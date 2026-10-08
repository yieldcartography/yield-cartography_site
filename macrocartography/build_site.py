#!/usr/bin/env python3
"""Build the macrocartography.com site folder from the Macro Radar template and the two data files.

    python3 build_site.py --us macro_radar.json --pl macro_radar_pl.json [--template macro_radar_template_mc.html] [--out mc_dist]

Writes:
    mc_dist/index.html              landing page (both countries, EN/PL)
    mc_dist/us/index.html           United States radar   (reads /data/us.json)
    mc_dist/pl/index.html           Poland radar          (reads /data/pl.json)
    mc_dist/data/us.json, pl.json   the published files, unchanged
    mc_dist/data/summary.json       latest headline readings for the landing page
    mc_dist/_headers, _redirects, robots.txt, sitemap.xml, 404.html, assets/

Standard library only. Run it after every data build (the daily hook) or after a template change. The radar pages
carry no embedded data on the site; for an offline copy use macro_radar_generator.py as before.
"""
import argparse, json, math, os, re, shutil, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA = "macro_radar/v1"
COUNTRY_MARK = 'const mk=(/*__MC_COUNTRY__*/"us")'
SITE_MARK = "const MC_SITE_MODE = (/*__MC_SITE__*/false);"   # site pages: menu header, About, no expert tabs, no snapshot or theme switch
BODY_MARK = '<body class="light">'
DEMO_RE = re.compile(r"const DEMO = /\*__MACRO_DEMO__\*/.*?;\n", re.S)

def die(msg):
    sys.exit("build_site.py: " + msg)

def load(path):
    try:
        with open(path, encoding="utf-8") as f:
            doc = json.load(f)
    except Exception as e:
        die("cannot read %s (%s)" % (path, e))
    if doc.get("schema") != SCHEMA:
        die("%s: schema is %r, expected %r" % (path, doc.get("schema"), SCHEMA))
    if not doc.get("scores"):
        die("%s has no scores; the site needs a scored file (macro_build.py --with-stats)" % path)
    return doc

# ---------- the same arithmetic as the page, for the landing summary ----------
Phi = lambda z: 0.5 * (1 + math.erf(z / math.sqrt(2)))

def ym(d):
    return int(d[:4]) * 12 + int(d[5:7]) - 1

def fiscal_z(doc):
    """Robust z of the fiscal impulse (rolling 120 months, at least 60), sign reversed, clipped, carried 3 months."""
    F = doc["scores"]["headline"].get("fiscal") or {}
    raw = {}
    for d, v in zip(F.get("d", []), F.get("v", [])):
        if v is not None:
            raw[ym(d)] = v
    ms = sorted(raw)
    z = {}
    for m in ms:
        w = [raw[k] for k in ms if m - 120 < k <= m]
        if len(w) < 60:
            continue
        sw = sorted(w); n = len(sw)
        med = sw[(n - 1) // 2] if n % 2 else (sw[n // 2 - 1] + sw[n // 2]) / 2
        dev = sorted(abs(x - med) for x in w)
        mad = dev[(n - 1) // 2] if n % 2 else (dev[n // 2 - 1] + dev[n // 2]) / 2
        sc = 1.4826 * mad
        if not sc > 0:
            mu = sum(w) / n
            sc = math.sqrt(sum((x - mu) ** 2 for x in w) / max(1, n - 1))
        if sc > 0:
            z[m] = max(-3, min(3, -(raw[m] - med) / sc))
    return z

def carried(zmap, m, limit=3):
    for k in range(limit + 1):
        if m - k in zmap:
            return zmap[m - k]
    return None

def policy_blend(doc, w_mon=0.75, w_fis=0.25):
    H = doc["scores"]["headline"]["policy"]
    d = H["d"][-1]; zm = H["z"][-1]
    zf = carried(fiscal_z(doc), ym(d))
    z = zm if zf is None else (w_mon * zm + w_fis * zf) / (w_mon + w_fis)
    return round(100 * Phi(z), 1), d

REC_PARTS = {"us": [("piger", 3), ("hamilton", 9), ("curve_probit", 3)], "pl": [("curve_probit", 3)]}

def recession(doc, country):
    R = doc["scores"]["recession"]; parts = REC_PARTS[country]
    maps = []
    for k, _ in parts:
        o = R.get(k) or {}
        maps.append({ym(d): v for d, v in zip(o.get("d") or [], o.get("v") or []) if v is not None})
    last = doc["scores"]["groups"]["1"]["d"][-1]; m = ym(last)
    vals = [carried(mp, m, carry) for mp, (_, carry) in zip(maps, parts)]
    vals = [v for v in vals if v is not None]
    need = min(2, len(parts))
    if len(vals) < need:
        return None, last
    return round(sum(vals) / len(vals), 1), last

ZONES = {  # default cut-offs and names as on the page
    "economy": ([30, 45, 60], [("contraction", "skurcz"), ("soft", "słabo"), ("trend", "trend"), ("strong", "silnie")]),
    "prices": ([35, 65], [("low", "niska"), ("normal", "normalna"), ("high", "wysoka")]),
    "policy": ([35, 65], [("loose", "łagodna"), ("neutral", "neutralna"), ("tight", "restrykcyjna")]),
    "conditions": ([35, 65], [("easy", "łagodne"), ("neutral", "neutralne"), ("tight", "restrykcyjne")]),
    "recession": ([15, 30], [("low", "niskie"), ("elevated", "podwyższone"), ("high", "wysokie")]),
}
COLORS = {"economy": ["red", "amber", "pale", "green"], "prices": ["blue", "green", "red"], "policy": ["blue", "grey", "red"],
          "conditions": ["green", "grey", "red"], "recession": ["green", "amber", "red"]}

def zone(key, v):
    cuts, names = ZONES[key]
    i = sum(1 for c in cuts if v >= c)
    return {"en": names[i][0], "pl": names[i][1], "c": COLORS[key][i]}

def summary(doc, country):
    H = doc["scores"]["headline"]; out = {}
    for k in ("economy", "prices", "conditions"):
        v, d = H[k]["v"][-1], H[k]["d"][-1]
        out[k] = {"v": v, "d": d, "zone": zone(k, v)}
    v, d = policy_blend(doc); out["policy"] = {"v": v, "d": d, "zone": zone("policy", v)}
    v, d = recession(doc, country)
    if v is not None:
        out["recession"] = {"v": v, "d": d, "zone": zone("recession", v)}
    F = H.get("fiscal") or {}
    if F.get("v"):
        out["fiscal"] = {"v": F["v"][-1], "d": F["d"][-1]}
    return {"data_as_of": doc.get("data_as_of"), "built_at": doc.get("built_at"), "n_series": doc["counts"]["n_series"], "headline": out}

# ---------- files ----------
HEADERS = """/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: frame-ancestors 'self'
  Cache-Control: public, max-age=600

/assets/*
  Cache-Control: public, max-age=86400

/data/*
  Cache-Control: public, max-age=60
  Content-Type: application/json; charset=utf-8
  Access-Control-Allow-Origin: *
"""
REDIRECTS = """/en   /?lang=en  302
/pl/en  /pl/?lang=en  302
/us/pl  /us/?lang=pl  302
"""
ROBOTS = "User-agent: *\nAllow: /\nSitemap: https://macrocartography.com/sitemap.xml\n"

def sitemap(today):
    urls = ["https://macrocartography.com/", "https://macrocartography.com/us/", "https://macrocartography.com/pl/"]
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join("  <url><loc>%s</loc><lastmod>%s</lastmod><changefreq>daily</changefreq></url>\n" % (u, today) for u in urls)
            + "</urlset>\n")

def write(path, text, binary=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb" if binary else "w", **({} if binary else {"encoding": "utf-8"})) as f:
        f.write(text)

def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--us", required=True, help="scored US file (macro_radar.json)")
    ap.add_argument("--pl", required=True, help="scored Polish file (macro_radar_pl.json)")
    ap.add_argument("--template", default=os.path.join(HERE, "macro_radar_template_mc.html"))
    ap.add_argument("--landing", default=os.path.join(HERE, "landing.html"))
    ap.add_argument("--assets", default=os.path.join(HERE, "site_assets"))
    ap.add_argument("--out", default=os.path.join(HERE, "mc_dist"))
    a = ap.parse_args()
    with open(a.template, encoding="utf-8") as f:
        tpl = f.read()
    if tpl.count(COUNTRY_MARK) != 1:
        die("the template must carry the country marker %s exactly once" % COUNTRY_MARK)
    if tpl.count("/*__MACRO_JSON__*/null") != 1:
        die("the template must carry /*__MACRO_JSON__*/null exactly once")
    if tpl.count(SITE_MARK) != 1 or tpl.count(BODY_MARK) != 1:
        die("the template must carry the site-mode marker and %s exactly once (rebuild it with src/build_mc.py)" % BODY_MARK)
    tpl_site = DEMO_RE.sub("const DEMO = null;\n", tpl, count=1)   # the site never shows the US demo copy
    tpl_site = tpl_site.replace(SITE_MARK, SITE_MARK.replace("false", "true"), 1).replace(BODY_MARK, '<body class="light site">', 1)
    docs = {"us": load(a.us), "pl": load(a.pl)}
    if str(docs["pl"].get("country", "PL")).upper() != "PL":
        die("--pl file is not marked country PL")
    out = a.out
    for sub in ("", "data", "assets", "us", "pl"):
        os.makedirs(os.path.join(out, sub), exist_ok=True)
    for c in ("us", "pl"):
        write(os.path.join(out, c, "index.html"), tpl_site.replace(COUNTRY_MARK, 'const mk=(/*__MC_COUNTRY__*/"%s")' % c, 1))
        shutil.copyfile(a.us if c == "us" else a.pl, os.path.join(out, "data", c + ".json"))
    summ = {"built": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), "us": summary(docs["us"], "us"), "pl": summary(docs["pl"], "pl")}
    write(os.path.join(out, "data", "summary.json"), json.dumps(summ, ensure_ascii=False, separators=(",", ":")))
    with open(a.landing, encoding="utf-8") as f:
        landing = f.read()
    write(os.path.join(out, "index.html"), landing.replace("/*__SUMMARY__*/null", json.dumps(summ, ensure_ascii=False), 1))
    write(os.path.join(out, "404.html"), landing.replace("/*__SUMMARY__*/null", json.dumps(summ, ensure_ascii=False), 1).replace('<body class="landing">', '<body class="landing notfound">', 1))
    write(os.path.join(out, "_headers"), HEADERS)
    write(os.path.join(out, "_redirects"), REDIRECTS)
    write(os.path.join(out, "robots.txt"), ROBOTS)
    write(os.path.join(out, "sitemap.xml"), sitemap(datetime.date.today().isoformat()))
    if os.path.isdir(a.assets):
        for fn in os.listdir(a.assets):
            shutil.copyfile(os.path.join(a.assets, fn), os.path.join(out, "assets", fn))
    for c in ("us", "pl"):
        h = summ[c]["headline"]
        print("OK  %s: data as of %s, %d series · economy %.1f · prices %.1f · policy %.1f (blend) · conditions %.1f%s"
              % (c, summ[c]["data_as_of"], summ[c]["n_series"], h["economy"]["v"], h["prices"]["v"], h["policy"]["v"], h["conditions"]["v"],
                 " · recession %.1f" % h["recession"]["v"] if "recession" in h else ""))
    print("site written to", out)

if __name__ == "__main__":
    main()
