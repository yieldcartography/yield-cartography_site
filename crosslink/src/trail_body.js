  /* ---------- tracks rail ----------
     The right margin of lesson pages (the slot reserved for a sponsor, still
     unused): the three paid tracks and the author's yieldcartography.com, as
     the shared FA_CARDS cards. Renders only with room for a 230px column
     beside the 780px reading width; never on tests, cheat sheets, index or
     account pages, never in print. Links carry ?ref=... (see FA.initRef). */
  FA.trackRail = [['risk1', 'fa-rail-risk1'], ['risk2', 'fa-rail-risk2'], ['cfa1', 'fa-rail-cfa1'], ['yc', 'fa-rail']];
  FA.railOff = function () { try { return localStorage.getItem('fa_rail_off') === '1'; } catch (e) { return false; } };
  FA.initTracksRail = function () {
    var p = location.pathname.replace(/\.html$/, '');
    if (!/^\/courses\/l[1-5]\/[a-z]/.test(p)) return;
    if (/(?:^|\/)(test|index)$|cert|login|verify|account|-cheat/.test(p)) return;
    if (typeof FA_CARDS === 'undefined' || !FA.trackRail.length) return;
    var wrap = document.querySelector('.wrap');
    if (!wrap) return;
    if (!document.getElementById('fa-cards-css')) { var st = document.createElement('style'); st.id = 'fa-cards-css'; st.textContent = FA_CARDS.CSS; document.head.appendChild(st); }

    var el = null, place = function () {
      if (!el) return;
      var r = wrap.getBoundingClientRect();
      var contentRight = r.left + 24 + 780;
      var room = r.right - 24 - contentRight;
      if (window.innerWidth < 1120 || room < 230) { el.style.display = 'none'; return; }
      el.style.display = 'block';
      el.style.left = (contentRight + 28) + 'px';
      el.style.width = Math.min(room - 8, 260) + 'px';
    };
    function build() {
      if (el) return;
      el = document.createElement('aside');
      el.className = 'trail noprint';
      el.setAttribute('aria-label', 'Tracks and related sites');
      el.innerHTML = '<div class="trail-k">More from FinAcademy</div>' +
        FA.trackRail.map(function (r) {
          var c = FA_CARDS.CARDS[r[0]], own = c.url.indexOf('learn.finacademy.ai') >= 0;
          return FA_CARDS.html(r[0], r[1], own ? { url: c.url.replace('https://learn.finacademy.ai/', '../../'), external: false } : {});
        }).join('') + '<p class="fa-cards-note">' + FA_CARDS.NOTE + '</p>';
      document.body.appendChild(el);
      place();
    }
    function unbuild() { if (el) { el.parentNode.removeChild(el); el = null; } }
    window.addEventListener('resize', place);
    if (!FA.railOff()) build();

    /* the quiet switch at the foot of the lesson: focus mode hides the rail
       on this browser until it is switched back */
    var f = document.querySelector('footer.site > div') || document.querySelector('footer.site');
    if (f && !document.querySelector('.trail-toggle')) {
      var a = document.createElement('a'); a.href = '#'; a.className = 'trail-toggle';
      var label = function () { a.textContent = FA.railOff() ? 'Show the tracks rail' : 'Focus mode: hide the tracks rail'; };
      a.addEventListener('click', function (e) {
        e.preventDefault();
        try { if (FA.railOff()) localStorage.removeItem('fa_rail_off'); else localStorage.setItem('fa_rail_off', '1'); } catch (err) {}
        if (FA.railOff()) unbuild(); else build(); label();
      });
      f.appendChild(document.createTextNode(' · ')); f.appendChild(a); label();
    }
  };

  /* ---------- referral counter ----------
     A page opened with ?ref=<source> (links from yieldcartography.com, the
     newsletter, posts) reports the source once per browser session to
     /api/ref. No cookies, no identity: source, path and a timestamp. */
  FA.initRef = function () {
    var m = location.search.match(/[?&]ref=([A-Za-z0-9_.-]{1,40})/);
    if (!m) return;
    try { if (sessionStorage.getItem('fa_ref_sent') === m[1]) return; sessionStorage.setItem('fa_ref_sent', m[1]); } catch (e) {}
    var body = JSON.stringify({ src: m[1], path: location.pathname });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon('/api/ref', new Blob([body], { type: 'application/json' }));
      else fetch('/api/ref', { method: 'POST', headers: { 'content-type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
    } catch (e) {}
  };

