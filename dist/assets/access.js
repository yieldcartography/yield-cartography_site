/* access.js v1 — the 1 November 2026 access split.
   Loaded SYNCHRONOUSLY in <head> on every page (it must install its fetch
   interceptor before the page's inline scripts run).

   Access model from 2026-11-01 (all checks client-side by design, v1):
   - public-live:   landing, alerts, about, media, slides
   - delayed:       curves, cockpit, TP, MPC, liquidity, TR, EH — unregistered
                    visitors get the month-old data snapshots from
                    /data/delayed/ via a fetch interceptor + an amber banner
   - registered:    vols, oracle, LT, debt, des — unregistered visitors get
                    a registration wall instead of the dashboard
   Registered state: localStorage yc_registered=1 + yc_token, revalidated
   against /api/prefs once per session (sessionStorage yc_me).
   Before the cut date: only the countdown banner (28-31 Oct), dismissible.
*/
(function () {
  'use strict';

  var CUT = new Date('2026-11-01T00:00:00+01:00');       // Warsaw midnight
  var COUNTDOWN_FROM = new Date('2026-10-28T00:00:00+02:00');
  var NOW = new Date();
  var PATH = window.location.pathname;
  var RESERVED = ['/vols/', '/oracle/', '/lt/', '/debt/', '/des/'];
  var DELAYED = ['/curves/', '/cockpit/', '/term-premia/', '/mpc/', '/liquidity/',
                 '/total-return/', '/eh-tests/'];

  function on(list) {
    for (var i = 0; i < list.length; i++) {
      if (PATH.indexOf(list[i]) === 0) return true;
    }
    return false;
  }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var claimsRegistered = ls('yc_registered') === '1' && !!ls('yc_token');

  /* ---- fetch interceptor: delayed tabs, unregistered, after the cut ---- */
  if (NOW >= CUT && on(DELAYED) && !claimsRegistered) {
    var origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = (typeof input === 'string') ? input : (input && input.url) || '';
      var m = url.match(/^\/data\/([A-Za-z0-9_\-]+\.json)(\?.*)?$/);
      if (!m) return origFetch(input, init);
      var delayedUrl = '/data/delayed/' + m[1];
      return origFetch(delayedUrl, init).then(function (r) {
        if (r.ok) return r;
        return origFetch(input, init);        // fail-open: delayed copy missing
      }).catch(function () { return origFetch(input, init); });
    };
  }

  /* ---- everything below needs the DOM ---- */
  function init() {
    var registered = claimsRegistered;

    // anonymous usage beacon: (day, tab, registered-flag) counter only —
    // no user id, no IP, nothing joinable to an account (see worker hit())
    try {
      var seg = '/' + (PATH.split('/')[1] || '') + (PATH === '/' ? '' : '/');
      if (PATH === '/') seg = '/';
      var payload = JSON.stringify({ p: seg, r: claimsRegistered ? 1 : 0 });
      if (!sessionStorage.getItem('yc_hit_' + seg)) {
        sessionStorage.setItem('yc_hit_' + seg, '1');
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/hit', new Blob([payload], { type: 'application/json' }));
        } else {
          fetch('/api/hit', { method: 'POST', body: payload,
            headers: { 'content-type': 'application/json' }, keepalive: true }).catch(function () {});
        }
      }
    } catch (e) {}

    // one revalidation per session; a bad token demotes the device
    if (claimsRegistered && !sessionStorage.getItem('yc_me')) {
      fetch('/api/prefs?t=' + encodeURIComponent(ls('yc_token')))
        .then(function (r) {
          sessionStorage.setItem('yc_me', r.ok ? '1' : '0');
          if (!r.ok) {
            try {
              localStorage.removeItem('yc_registered');
              localStorage.removeItem('yc_token');
            } catch (e) {}
            if (NOW >= CUT && (on(RESERVED) || on(DELAYED))) location.reload();
          }
        }).catch(function () {});
    }

    /* ---- countdown banner, 28-31 Oct, all pages except /alerts/ ---- */
    if (NOW >= COUNTDOWN_FROM && NOW < CUT && PATH.indexOf('/alerts/') !== 0) {
      var dkey = 'yc_cd_' + NOW.toISOString().slice(0, 10);
      if (!ls(dkey)) {
        var days = Math.max(1, Math.ceil((CUT - NOW) / 86400000));
        var cd = document.createElement('div');
        cd.setAttribute('style',
          'background:#1F4E79;color:#fff;font-family:ui-monospace,Menlo,monospace;' +
          'font-size:12.5px;padding:9px 16px;text-align:center;line-height:1.5');
        cd.innerHTML = 'From <b>1 November</b> unregistered visitors see month-delayed data ' +
          'on every dashboard. Registration is free and takes one email. ' +
          '<a href="#" id="ycCdReg" style="color:#ffd9c9;font-weight:700;' +
          'text-decoration:underline">Register now</a>' +
          '<span style="opacity:.65"> &middot; ' + days + (days === 1 ? ' day' : ' days') +
          ' left</span>' +
          '<a href="#" id="ycCdX" aria-label="dismiss" style="color:#fff;opacity:.65;' +
          'float:right;padding:0 4px;text-decoration:none">&#10005;</a>';
        document.body.insertBefore(cd, document.body.firstChild);
        document.getElementById('ycCdX').addEventListener('click', function (ev) {
          ev.preventDefault(); lset(dkey, '1'); cd.remove();
        });
        document.getElementById('ycCdReg').addEventListener('click', function (ev) {
          ev.preventDefault();
          if (window.ycRegister) window.ycRegister(); else location.href = '/alerts/';
        });
      }
    }

    if (NOW < CUT) return;

    /* ---- registered wall on reserved tabs ---- */
    if (on(RESERVED) && !registered) {
      var main = document.querySelector('main');
      if (main) {
        var tab = PATH.split('/')[1];
        main.innerHTML =
          '<div style="max-width:560px;margin:8vh auto;padding:30px 34px;background:#fff;' +
          'border:1px solid #d8d8d8;border-radius:8px">' +
          '<div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;' +
          'letter-spacing:2px;color:#c2522d;margin-bottom:12px">REGISTERED AREA &middot; FREE</div>' +
          '<h1 style="font-size:22px;margin:0 0 10px 0;letter-spacing:-0.3px">This dashboard is ' +
          'for registered users</h1>' +
          '<p style="font-size:14px;color:#3a3a3a;line-height:1.6;margin:0 0 14px 0">Since ' +
          '1 November 2026 the <b>' + tab + '</b> tab, like the other reserved dashboards ' +
          '(vols, oracle, LT, debt, des), is part of the free registered area. Registration is one email, no password, ' +
          'no payment. Registered users also get daily data on every tab and optional ' +
          'email alerts with thresholds they set themselves.</p>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:16px 0 6px 0">' +
          '<input id="ycWallEmail" type="email" placeholder="you@example.com" ' +
          'autocomplete="email" style="flex:1 1 220px;font-family:ui-monospace,Menlo,monospace;' +
          'font-size:13px;padding:9px 11px;border:1px solid #d8d8d8;border-radius:4px">' +
          '<button id="ycWallGo" style="font-family:ui-monospace,Menlo,monospace;font-size:13px;' +
          'font-weight:700;padding:9px 18px;border:0;border-radius:4px;background:#1F4E79;' +
          'color:#fff;cursor:pointer">Register free</button></div>' +
          '<p id="ycWallMsg" style="font-size:12px;color:#6a6a6a;margin:8px 0 0 0">We send a ' +
          'confirmation link to this address and store nothing else. Already registered on ' +
          'another device? Enter the same email, the link doubles as a login.</p>' +
          '<p style="font-size:12px;color:#6a6a6a;margin:10px 0 0 0">' +
          '<a href="/" style="color:#1F4E79">&larr; back to the home page</a></p></div>';
        var go = document.getElementById('ycWallGo');
        go.addEventListener('click', function () {
          var em = document.getElementById('ycWallEmail').value.trim();
          var msg = document.getElementById('ycWallMsg');
          if (!em || em.indexOf('@') < 1) { msg.textContent = 'Enter an email address.'; return; }
          msg.textContent = 'Sending…';
          fetch('/api/subscribe', { method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email: em }) })
            .then(function (r) {
              msg.textContent = r.ok
                ? 'Check your inbox (and spam) for the confirmation link.'
                : 'Something went wrong, try again later or use the alerts page.';
            }).catch(function () {
              msg.textContent = 'Network problem, try again later.';
            });
        });
      }
      return;
    }

    /* ---- amber delayed-data banner on delayed tabs ---- */
    if (on(DELAYED) && !registered) {
      var b = document.createElement('div');
      b.setAttribute('style',
        'background:#fff7e6;border-bottom:1px solid #e8d9b0;color:#6a5518;' +
        'font-family:ui-monospace,Menlo,monospace;font-size:12.5px;' +
        'padding:8px 16px;text-align:center;line-height:1.5');
      b.innerHTML = 'You are viewing data <b>as of <span id="ycDelAsof">about one month ' +
        'ago</span></b>. Registered users (free) see daily updates. ' +
        '<a href="#" id="ycDelReg" style="color:#1F4E79;font-weight:700;' +
        'text-decoration:underline">Register</a>';
      var hdr = document.querySelector('.site-header');
      if (hdr && hdr.nextSibling) hdr.parentNode.insertBefore(b, hdr.nextSibling);
      else document.body.insertBefore(b, document.body.firstChild);
      document.getElementById('ycDelReg').addEventListener('click', function (ev) {
        ev.preventDefault();
        if (window.ycRegister) window.ycRegister(); else location.href = '/alerts/';
      });
      fetch('/data/delayed/meta.json').then(function (r) { return r.json(); })
        .then(function (m) {
          if (m && m.snapshot_date) {
            document.getElementById('ycDelAsof').textContent = m.snapshot_date;
          }
        }).catch(function () {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
