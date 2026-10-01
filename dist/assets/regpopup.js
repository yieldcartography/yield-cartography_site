/* regpopup.js v2 — registration prompt + header profile icon for the
   1 Nov 2026 access split. No tracking beyond localStorage on this device.

   Profile icon (always injected, last item in the header nav):
     - registered with a stored manage token  -> opens /alerts/?t=TOKEN
     - registered without a token             -> opens /alerts/ (re-send link)
     - unregistered                           -> opens the registration popup
     A small green dot marks the registered state.

   Popup auto-show: 2nd pageview OR >90s dwell, at most once per 7 days,
   never on /alerts/, never for registered (yc_registered=1) or beta
   (yc_beta=1) users, and not again in a session after a dismissal.
   The icon can always open it on demand (force). */
(function () {
  'use strict';
  var K_VIEWS = 'yc_reg_views';
  var K_LAST = 'yc_reg_last';
  var WEEK = 7 * 24 * 3600 * 1000;
  var DWELL_MS = 90 * 1000;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var registered = lsGet('yc_registered') === '1';
  var token = lsGet('yc_token');

  // ---------------------------------------------------------- header icon
  function injectIcon() {
    var nav = document.querySelector('.site-header nav');
    if (!nav || document.getElementById('ycProfile')) return;
    var a = document.createElement('a');
    a.id = 'ycProfile';
    a.href = registered ? (token ? '/alerts/?t=' + encodeURIComponent(token) : '/alerts/') : '#';
    a.title = registered ? 'Your alerts & registration' : 'Register for daily access';
    a.setAttribute('aria-label', a.title);
    a.style.cssText = 'display:inline-flex;align-items:center;position:relative;border:none;line-height:0';
    a.innerHTML =
      '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" style="color:var(--muted,#6a6a6a)" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"></circle>' +
      '<circle cx="12" cy="9.5" r="3.2"></circle>' +
      '<path d="M 5.5 19 Q 8 14.8 12 14.8 Q 16 14.8 18.5 19"></path></svg>' +
      (registered
        ? '<span style="position:absolute;top:-1px;right:-3px;width:7px;height:7px;' +
          'border-radius:50%;background:var(--green,#2e7d32)"></span>'
        : '');
    a.addEventListener('mouseenter', function () {
      a.querySelector('svg').style.color = 'var(--accent, #1f4e79)';
    });
    a.addEventListener('mouseleave', function () {
      a.querySelector('svg').style.color = 'var(--muted, #6a6a6a)';
    });
    if (!registered) {
      a.addEventListener('click', function (ev) { ev.preventDefault(); show(true); });
    }
    nav.appendChild(a);
  }

  // ---------------------------------------------------------------- popup
  function bumpViews() {
    lsSet(K_VIEWS, String((+(lsGet(K_VIEWS) || 0)) + 1));
  }

  function row(txt) {
    return '<div style="display:flex;gap:9px;margin:5px 0"><span style="color:var(--green,#2e7d32);' +
      'font-weight:700">✓</span><span>' + txt + '</span></div>';
  }

  function show(force) {
    if (document.getElementById('ycRegPop')) return;
    if (!force) lsSet(K_LAST, String(Date.now()));
    var ov = document.createElement('div');
    ov.id = 'ycRegPop';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'Registration invitation');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(26,26,26,0.45);' +
      'z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px';
    ov.innerHTML =
      '<div style="background:var(--panel,#fff);color:var(--ink,#1a1a1a);max-width:460px;width:100%;' +
      'border:1px solid var(--rule,#d8d8d8);border-radius:8px;padding:26px 28px;position:relative;' +
      'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif">' +
      '<button id="ycRegX" aria-label="Close" style="position:absolute;top:10px;right:12px;border:none;' +
      'background:none;font-size:20px;line-height:1;color:var(--muted,#6a6a6a);cursor:pointer">×</button>' +
      '<div style="font-family:var(--mono,monospace);font-size:10.5px;letter-spacing:1.2px;' +
      'color:var(--salmon,#c2522d);margin-bottom:10px">FROM 1 NOVEMBER 2026</div>' +
      '<div style="font-size:19px;font-weight:700;letter-spacing:-0.2px;margin-bottom:6px">' +
      'Register free — keep the daily updates</div>' +
      '<p style="font-size:13px;color:var(--soft,#3a3a3a);margin:0 0 14px 0;line-height:1.5">' +
      'The curves tab stays live for everyone. The rest of the site moves to a ' +
      'one-month delay for unregistered visitors. Registration is free and takes one email.</p>' +
      '<div style="font-size:13px;line-height:1.55;margin:0 0 18px 0">' +
      row('Daily-updated data on every dashboard') +
      row('Email alerts with thresholds you set (e.g. 10y moves ≥ 10 bp)') +
      row('Reserved tabs: vols · oracle · LT · debt · des') +
      row('A note when a new tab, short or paper is released') +
      '</div>' +
      '<div id="ycRegStep1">' +
      '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">' +
      '<button id="ycRegGo" style="background:var(--accent,#1f4e79);color:#fff;border:none;cursor:pointer;' +
      'font-size:14px;font-weight:600;padding:10px 22px;border-radius:5px">Register free →</button>' +
      '<button id="ycRegLater" style="border:none;background:none;font-size:12.5px;' +
      'color:var(--muted,#6a6a6a);cursor:pointer;text-decoration:underline">maybe later</button></div>' +
      '<p style="font-size:10.5px;color:var(--muted,#9a9a9a);margin:14px 0 0 0">' +
      'No spam: only what you opt into, unsubscribe in one click. Free for academic and personal use, as always.</p>' +
      '</div>' +
      '<div id="ycRegStep2" style="display:none">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<input id="ycRegEmail" type="email" placeholder="you@example.com" autocomplete="email" ' +
      'style="flex:1 1 200px;font-family:var(--mono,monospace);font-size:13px;padding:9px 11px;' +
      'border:1px solid var(--rule,#ccc);border-radius:5px">' +
      '<button id="ycRegSend" style="background:var(--accent,#1f4e79);color:#fff;border:none;cursor:pointer;' +
      'font-size:13.5px;font-weight:600;padding:9px 18px;border-radius:5px">Send confirmation link</button></div>' +
      '<p id="ycRegNote" style="font-size:10.5px;color:var(--muted,#9a9a9a);margin:12px 0 0 0;line-height:1.5">' +
      'By registering you agree to receive the emails you opt into at this address. We store only your ' +
      'email and your preferences, and delete both when you unsubscribe. ' +
      '<a href="/alerts/" style="color:inherit">More on the alerts page</a>.</p>' +
      '</div>' +
      '<div id="ycRegStep3" style="display:none">' +
      '<div style="display:flex;gap:9px;font-size:14px;line-height:1.55">' +
      '<span style="color:var(--green,#2e7d32);font-weight:700">✓</span>' +
      '<span><b>Check your inbox.</b> We sent a confirmation link — click it to activate the daily ' +
      'access and choose your alert thresholds. (Also check the spam folder.)</span></div>' +
      '<button id="ycRegDone" style="margin-top:14px;border:1px solid var(--rule,#ccc);background:none;' +
      'font-size:12.5px;color:var(--soft,#3a3a3a);cursor:pointer;padding:7px 14px;border-radius:5px">' +
      'Back to the charts</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(ov);
    function close() {
      ov.remove();
      try { sessionStorage.setItem('yc_reg_dismissed', '1'); } catch (e) {}
    }
    document.getElementById('ycRegX').addEventListener('click', close);
    document.getElementById('ycRegLater').addEventListener('click', close);
    document.getElementById('ycRegGo').addEventListener('click', function () {
      document.getElementById('ycRegStep1').style.display = 'none';
      document.getElementById('ycRegStep2').style.display = '';
      document.getElementById('ycRegEmail').focus();
    });
    document.getElementById('ycRegSend').addEventListener('click', submitEmail);
    document.getElementById('ycRegEmail').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') submitEmail();
    });
    document.getElementById('ycRegDone').addEventListener('click', close);
    ov.addEventListener('click', function (ev) { if (ev.target === ov) close(); });
    document.addEventListener('keydown', function esc(ev) {
      if (ev.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
    function submitEmail() {
      var box = document.getElementById('ycRegEmail');
      var note = document.getElementById('ycRegNote');
      var email = (box.value || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        note.innerHTML = '<span style="color:var(--salmon,#c2522d)">Enter a valid email address.</span>';
        return;
      }
      var btn = document.getElementById('ycRegSend');
      btn.disabled = true; btn.textContent = 'Sending…';
      fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email })
      }).then(function (r) {
        if (!r.ok) throw new Error('subscribe failed');
        lsSet('yc_registered', '1');
        document.getElementById('ycRegStep2').style.display = 'none';
        document.getElementById('ycRegStep3').style.display = '';
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'Send confirmation link';
        note.innerHTML = '<span style="color:var(--salmon,#c2522d)">Could not reach the ' +
          'registration service — try again in a moment or use the ' +
          '<a href="/alerts/" style="color:inherit">alerts page</a>.</span>';
      });
    }
  }

  window.ycRegister = function () { show(true); };

  function autoShowInit() {
    if (location.pathname.indexOf('/alerts') === 0) return;
    if (registered || lsGet('yc_beta') === '1') return;
    try { if (sessionStorage.getItem('yc_reg_dismissed') === '1') return; } catch (e) {}
    bumpViews();
    if (Date.now() - (+(lsGet(K_LAST) || 0)) < WEEK) return;
    var views = +(lsGet(K_VIEWS) || 1);
    if (views >= 2) { setTimeout(function () { show(false); }, 1200); }
    else { setTimeout(function () { show(false); }, DWELL_MS); }
  }

  // The whole feature stays dormant until the yc-alerts Worker answers on
  // /api/* (so this file can ship before the Worker is deployed). The check
  // is one tiny GET per browsing session, cached in sessionStorage.
  function apiAlive() {
    // positive verdicts are cached for the session; NEGATIVE verdicts expire
    // after 10 minutes, so a visit that happened to precede the Worker
    // deployment (or a transient outage) cannot lock a session out —
    // Safari in particular restores sessionStorage for reopened tabs.
    try {
      var c = sessionStorage.getItem('yc_api');
      if (c === '1') return Promise.resolve(true);
      if (c && c.charAt(0) === '0') {
        var ts = +(c.slice(2) || 0);
        if (Date.now() - ts < 10 * 60 * 1000) return Promise.resolve(false);
      }
    } catch (e) {}
    return fetch('/api/prefs?t=ping', { method: 'GET' }).then(function (r) {
      var ok = (r.headers.get('content-type') || '').indexOf('json') >= 0;
      try { sessionStorage.setItem('yc_api', ok ? '1' : '0:' + Date.now()); } catch (e) {}
      return ok;
    }).catch(function () {
      try { sessionStorage.setItem('yc_api', '0:' + Date.now()); } catch (e) {}
      return false;
    });
  }

  function init() {
    apiAlive().then(function (ok) {
      if (!ok) return;
      injectIcon();
      autoShowInit();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
