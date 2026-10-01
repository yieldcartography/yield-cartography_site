/* yc-alerts — Cloudflare Worker behind alerts.yieldcartography.com (or a
   route on the main domain, see wrangler.toml).

   Flow
   ----
   1. POST /api/subscribe {email}        -> create pending user, send magic link
   2. GET  /api/verify?t=TOKEN           -> confirm (double opt-in), redirect to
                                            /alerts/?t=TOKEN on the main site
   3. GET  /api/prefs?t=TOKEN            -> {email, rules, metrics catalog}
      POST /api/prefs {t, rules:[{metric, threshold}]}   -> replace rules
   4. GET  /api/unsubscribe?t=TOKEN      -> mark unsubscribed
   5. POST /api/metrics {asof, metrics}  -> pipeline push, HMAC-signed
      (header x-yc-sig = hex(hmac_sha256(PUSH_SECRET, raw body))); stores the
      snapshot in KV, computes 1-day changes vs the previous snapshot,
      evaluates every confirmed user's rules and emails those that fired.

   Bindings (wrangler.toml): DB (D1), SNAP (KV), secrets PUSH_SECRET,
   RESEND_KEY. Vars: FROM_ADDR, SITE.

   Sends go through Resend (https://resend.com) — the sending domain needs
   SPF/DKIM records, see ALERTS_SETUP.md. One email per user per metrics
   date at most (sends table unique index). Client-side gate only for the
   prefs page; the token in the link is the credential (v1 convention). */

export const METRICS = {
  z1:    "1y zero yield",
  z2:    "2y zero yield",
  z5:    "5y zero yield",
  z10:   "10y zero yield",
  s2s10: "2s10s slope",
  nbp:   "NBP reference rate",
};
const MAX_RULES = 12;

// ---------------------------------------------------------------- helpers
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json",
               "access-control-allow-origin": "*" },
  });

const now = () => new Date().toISOString();

async function hmacHex(secret, body) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key,
    new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function randToken() {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, "0")).join("");
}

const okEmail = e => typeof e === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && e.length < 200;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cleanName = n => {
  if (typeof n !== "string") return null;
  const v = n.trim().slice(0, 60);
  return v ? v : null;
};
const greet = name => name ? `<p style="font-size:14px;margin:0 0 8px 0">Hello ${esc(name)},</p>` : "";

async function sendEmail(env, to, subject, html) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json",
               authorization: `Bearer ${env.RESEND_KEY}` },
    body: JSON.stringify({ from: env.FROM_ADDR, to: [to], subject, html }),
  });
  if (!r.ok) console.log("resend fail", to, r.status, await r.text());
  return r.ok;
}

// pure rule engine — exported for tests
export function evaluate(rules, prev, curr) {
  const fired = [];
  if (!prev || !curr) return fired;
  for (const r of rules) {
    const p = prev[r.metric], c = curr[r.metric];
    if (p == null || c == null) continue;
    const chg = (c - p) * 100;                       // % -> bp
    if (Math.abs(chg) >= r.threshold) {
      fired.push({ metric: r.metric, label: METRICS[r.metric] || r.metric,
                   from: p, to: c, chg });
    }
  }
  return fired;
}

function alertHtml(env, fired, asof, prevDate, token, name) {
  const rows = fired.map(f =>
    `<tr><td style="padding:4px 10px 4px 0">${f.label}</td>` +
    `<td style="padding:4px 10px 4px 0;font-family:monospace">` +
    `${f.from.toFixed(2)}% → ${f.to.toFixed(2)}%</td>` +
    `<td style="padding:4px 0;font-family:monospace;font-weight:700;` +
    `color:${f.chg > 0 ? "#c2522d" : "#2e7d32"}">${f.chg > 0 ? "+" : ""}` +
    `${f.chg.toFixed(1)} bp</td></tr>`).join("");
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,sans-serif;max-width:560px">
  ${greet(name)}<p style="font-size:13px;color:#666">yieldcartography.com alert · ${asof} vs ${prevDate}</p>
  <table style="font-size:14px;border-collapse:collapse">${rows}</table>
  <p style="font-size:13px"><a href="${env.SITE}/curves/">Open the curves tab →</a></p>
  <p style="font-size:11px;color:#999">You set these thresholds yourself.
  <a href="${env.SITE}/alerts/?t=${token}">Manage</a> ·
  <a href="${env.SITE.replace(/\/$/, "")}/api/unsubscribe?t=${token}" >Unsubscribe</a></p></div>`;
}

// ---------------------------------------------------------------- handlers
async function subscribe(req, env) {
  const { email } = await req.json().catch(() => ({}));
  if (!okEmail(email)) return json({ error: "invalid email" }, 400);
  let row = await env.DB.prepare("SELECT token FROM users WHERE email=?")
    .bind(email.toLowerCase()).first();
  let token = row?.token;
  if (!token) {
    token = randToken();
    await env.DB.prepare(
      "INSERT INTO users (email, token, created_at) VALUES (?,?,?)")
      .bind(email.toLowerCase(), token, now()).run();
  } else {
    await env.DB.prepare("UPDATE users SET unsub_at=NULL WHERE token=?")
      .bind(token).run();
  }
  const link = `${new URL(req.url).origin}/api/verify?t=${token}`;
  await sendEmail(env, email, "Confirm your yieldcartography alerts",
    `<p>Click to confirm and set your thresholds:</p>
     <p><a href="${link}">${link}</a></p>
     <p style="font-size:11px;color:#999">If you did not request this, ignore this email.</p>`);
  return json({ ok: true });
}

async function verify(req, env) {
  const t = new URL(req.url).searchParams.get("t") || "";
  const row = await env.DB.prepare("SELECT id FROM users WHERE token=?").bind(t).first();
  if (!row) return new Response("unknown token", { status: 404 });
  await env.DB.prepare(
    "UPDATE users SET confirmed_at=COALESCE(confirmed_at,?) WHERE token=?")
    .bind(now(), t).run();
  return Response.redirect(`${env.SITE}/alerts/?t=${t}`, 302);
}

async function getPrefs(req, env) {
  const t = new URL(req.url).searchParams.get("t") || "";
  const u = await env.DB.prepare(
    "SELECT id, email, name, confirmed_at, unsub_at, n_tabs, n_shorts, n_research " +
    "FROM users WHERE token=?").bind(t).first();
  if (!u) return json({ error: "unknown token" }, 404);
  const rules = (await env.DB.prepare(
    "SELECT metric, threshold FROM rules WHERE user_id=? AND enabled=1")
    .bind(u.id).all()).results;
  return json({ email: u.email, name: u.name || "", confirmed: !!u.confirmed_at,
                unsubscribed: !!u.unsub_at, rules, metrics: METRICS,
                news: { tabs: !!u.n_tabs, shorts: !!u.n_shorts,
                        research: !!u.n_research } });
}

async function postPrefs(req, env) {
  const { t, rules, news, name } = await req.json().catch(() => ({}));
  const u = await env.DB.prepare("SELECT id FROM users WHERE token=?").bind(t || "").first();
  if (!u) return json({ error: "unknown token" }, 404);
  if (!Array.isArray(rules) || rules.length > MAX_RULES)
    return json({ error: "bad rules" }, 400);
  for (const r of rules)
    if (!(r.metric in METRICS) || !(+r.threshold >= 1 && +r.threshold <= 500))
      return json({ error: `bad rule ${JSON.stringify(r)}` }, 400);
  await env.DB.prepare("DELETE FROM rules WHERE user_id=?").bind(u.id).run();
  for (const r of rules)
    await env.DB.prepare(
      "INSERT INTO rules (user_id, metric, threshold, created_at) VALUES (?,?,?,?)")
      .bind(u.id, r.metric, +r.threshold, now()).run();
  const nw = news || {};
  await env.DB.prepare(
    "UPDATE users SET n_tabs=?, n_shorts=?, n_research=?, name=? WHERE id=?")
    .bind(nw.tabs ? 1 : 0, nw.shorts ? 1 : 0, nw.research ? 1 : 0,
          cleanName(name), u.id).run();
  return json({ ok: true, n: rules.length });
}

// site-news announcements: pipeline/manual push, HMAC-signed like /api/metrics
const NEWS_KINDS = { tabs: "n_tabs", shorts: "n_shorts", research: "n_research" };

async function announce(req, env) {
  const body = await req.text();
  const sig = req.headers.get("x-yc-sig") || "";
  if (sig !== await hmacHex(env.PUSH_SECRET, body))
    return json({ error: "bad signature" }, 401);
  const { id, kind, title, url, blurb } = JSON.parse(body);
  if (!id || !(kind in NEWS_KINDS) || !title)
    return json({ error: "bad payload (need id, kind in tabs|shorts|research, title)" }, 400);
  const col = NEWS_KINDS[kind];
  const users = (await env.DB.prepare(
    `SELECT id, email, token, name FROM users
     WHERE confirmed_at IS NOT NULL AND unsub_at IS NULL AND ${col}=1`).all()).results;
  const key = "ann:" + id;
  let sent = 0;
  for (const u of users) {
    const dup = await env.DB.prepare(
      "SELECT 1 FROM sends WHERE user_id=? AND asof=?").bind(u.id, key).first();
    if (dup) continue;
    const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,sans-serif;max-width:560px">
      ${greet(u.name)}<p style="font-size:13px;color:#666">yieldcartography.com · new on the site</p>
      <p style="font-size:16px;font-weight:700;margin:6px 0">${title}</p>
      ${blurb ? `<p style="font-size:14px">${blurb}</p>` : ""}
      ${url ? `<p style="font-size:13px"><a href="${env.SITE}${url}">Open →</a></p>` : ""}
      <p style="font-size:11px;color:#999"><a href="${env.SITE}/alerts/?t=${u.token}">Manage</a> ·
      <a href="${new URL(req.url).origin}/api/unsubscribe?t=${u.token}">Unsubscribe</a></p></div>`;
    const ok = await sendEmail(env, u.email, "New on yieldcartography — " + title, html);
    if (ok) {
      await env.DB.prepare(
        "INSERT INTO sends (user_id, asof, n_fired, sent_at) VALUES (?,?,?,?)")
        .bind(u.id, key, 1, now()).run();
      sent++;
    }
  }
  return json({ ok: true, kind, recipients: users.length, sent });
}

async function unsubscribe(req, env) {
  const t = new URL(req.url).searchParams.get("t") || "";
  await env.DB.prepare("UPDATE users SET unsub_at=? WHERE token=?").bind(now(), t).run();
  return new Response("Unsubscribed. You can re-subscribe any time at " +
    env.SITE + "/alerts/", { headers: { "content-type": "text/plain" } });
}

async function ingestMetrics(req, env) {
  const body = await req.text();
  const sig = req.headers.get("x-yc-sig") || "";
  if (sig !== await hmacHex(env.PUSH_SECRET, body))
    return json({ error: "bad signature" }, 401);
  const { asof, metrics } = JSON.parse(body);
  if (!asof || !metrics) return json({ error: "bad payload" }, 400);
  const prevRaw = await env.SNAP.get("latest");
  const prev = prevRaw ? JSON.parse(prevRaw) : null;
  await env.SNAP.put("latest", JSON.stringify({ asof, metrics }));
  if (!prev || prev.asof === asof)
    return json({ ok: true, evaluated: 0, note: prev ? "same asof" : "first snapshot" });

  const users = (await env.DB.prepare(
    `SELECT u.id, u.email, u.token, u.name FROM users u
     WHERE u.confirmed_at IS NOT NULL AND u.unsub_at IS NULL`).all()).results;
  let sent = 0;
  for (const u of users) {
    const rules = (await env.DB.prepare(
      "SELECT metric, threshold FROM rules WHERE user_id=? AND enabled=1")
      .bind(u.id).all()).results;
    const fired = evaluate(rules, prev.metrics, metrics);
    if (!fired.length) continue;
    const dup = await env.DB.prepare(
      "SELECT 1 FROM sends WHERE user_id=? AND asof=?").bind(u.id, asof).first();
    if (dup) continue;
    const ok = await sendEmail(env, u.email,
      `PLN curve alert — ${fired.map(f => f.label).join(", ")}`,
      alertHtml(env, fired, asof, prev.asof, u.token, u.name));
    if (ok) {
      await env.DB.prepare(
        "INSERT INTO sends (user_id, asof, n_fired, sent_at) VALUES (?,?,?,?)")
        .bind(u.id, asof, fired.length, now()).run();
      sent++;
    }
  }
  return json({ ok: true, users: users.length, sent });
}

// admin roster: HMAC-signed POST {op:"users"} -> all users with rule counts
// and send counts. Same shared secret as the metrics push; for the owner's
// CLI (YIELDS/alerts_admin.py), never exposed in any page.
async function admin(req, env) {
  const body = await req.text();
  const sig = req.headers.get("x-yc-sig") || "";
  if (sig !== await hmacHex(env.PUSH_SECRET, body))
    return json({ error: "bad signature" }, 401);
  const { op } = JSON.parse(body);
  if (op !== "users") return json({ error: "unknown op" }, 400);
  const users = (await env.DB.prepare(
    `SELECT u.email, u.name, u.created_at, u.confirmed_at, u.unsub_at,
            u.n_tabs, u.n_shorts, u.n_research,
            (SELECT COUNT(*) FROM rules r WHERE r.user_id = u.id AND r.enabled = 1) AS n_rules,
            (SELECT COUNT(*) FROM sends s WHERE s.user_id = u.id) AS n_sends
     FROM users u ORDER BY u.created_at`).all()).results;
  return json({ users, counts: {
    total: users.length,
    confirmed: users.filter(u => u.confirmed_at && !u.unsub_at).length,
    unsubscribed: users.filter(u => u.unsub_at).length } });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS")
      return new Response(null, { headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type" } });
    try {
      if (url.pathname === "/api/subscribe" && req.method === "POST") return subscribe(req, env);
      if (url.pathname === "/api/verify") return verify(req, env);
      if (url.pathname === "/api/prefs" && req.method === "GET") return getPrefs(req, env);
      if (url.pathname === "/api/prefs" && req.method === "POST") return postPrefs(req, env);
      if (url.pathname === "/api/unsubscribe") return unsubscribe(req, env);
      if (url.pathname === "/api/metrics" && req.method === "POST") return ingestMetrics(req, env);
      if (url.pathname === "/api/announce" && req.method === "POST") return announce(req, env);
      if (url.pathname === "/api/admin" && req.method === "POST") return admin(req, env);
    } catch (e) {
      console.log("error", url.pathname, e.message);
      return json({ error: "internal" }, 500);
    }
    return json({ error: "not found" }, 404);
  },
};
