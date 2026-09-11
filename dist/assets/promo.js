/* ===== FinAcademy cross-link cards: shared by yieldcartography (promo.js)
   and FinAcademy (core.js). Edit here, then run build.py to regenerate both.
   Each card: key, colours (ink / mid / light), an inline SVG emblem, copy,
   link and status ('live' | 'soon' | 'prep'). ===== */
var FA_CARDS = (function () {
  var FA_URL = 'https://learn.finacademy.ai/';
  var YC_URL = 'https://yieldcartography.com/';

  /* the serif F of the FinAcademy favicon (own brand asset) */
  var F_PATH = 'M96 0V121H287V1372H96V1493H1427V1141H1290V1356H674V877H1053V1067H1190V551H1053V741H674V121H909V0Z';

  function emblem(kind, c) {
    var head = '<svg class="fa-em" viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">' +
      '<circle cx="22" cy="22" r="21" fill="' + c.light + '"/>';
    var num = function (t) { return '<text x="36" y="39" text-anchor="end" font-family="Georgia,serif" font-weight="700" font-size="12" fill="' + c.ink + '">' + t + '</text>'; };
    if (kind === 'fa') return head +
      '<g transform="translate(9,9) scale(0.26)"><path transform="matrix(0.04689 0 0 -0.04689 14.2967 85.0000)" d="' + F_PATH + '" fill="' + c.ink + '"/></g></svg>';
    /* styled letters for the tracks: a serif capital with a superscript numeral */
    var letter = function (L, n) {
      return '<text x="16" y="31" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-weight="700" font-size="26" fill="' + c.ink + '">' + L + '</text>' +
        '<text x="30" y="19" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-weight="700" font-size="13" fill="' + c.ink + '">' + n + '</text>';
    };
    if (kind === 'risk1') return head + letter('R', '1') + '</svg>';
    if (kind === 'risk2') return head + letter('R', '2') + '</svg>';
    if (kind === 'cfa1') return head + letter('A', '1') + '</svg>';
    if (kind === 'yc') return head +                                        /* the yieldcartography ridge mark */
      '<g transform="translate(5,4) scale(0.32)">' +
      '<path d="M 10 100 C 25 96, 40 88, 60 78 S 90 62, 110 58" fill="none" stroke="#1f4e79" stroke-width="3" opacity=".35"/>' +
      '<path d="M 10 90 C 25 84, 40 74, 60 62 S 90 44, 110 38" fill="none" stroke="#1f4e79" stroke-width="3.6" opacity=".55"/>' +
      '<path d="M 10 78 C 25 70, 40 58, 60 44 S 90 24, 110 18" fill="none" stroke="#c2522d" stroke-width="5.2" stroke-linecap="round"/>' +
      '<circle cx="100" cy="22" r="5.5" fill="#c2522d" stroke="#fff" stroke-width="1.4"/><circle cx="68" cy="38" r="4.4" fill="#c2522d"/><circle cx="50" cy="50" r="4" fill="#1f4e79"/>' +
      '</g></svg>';
    return head + '</svg>';
  }

  var COL = {
    fa:    { ink: '#2a78d6', mid: '#c9dcf5', light: '#e6effb' },   /* FinAcademy blue */
    risk1: { ink: '#2e7d32', mid: '#bfe3c6', light: '#e3f3e6' },   /* light green */
    risk2: { ink: '#2e75b6', mid: '#c4dcf2', light: '#e4eff9' },   /* light blue */
    cfa1:  { ink: '#b7700a', mid: '#f6dfa8', light: '#fbefd6' },   /* amber */
    yc:    { ink: '#1f4e79', mid: '#d3dfeb', light: '#eaf0f6' }    /* yieldcartography navy */
  };

  var CARDS = {
    fa: { key: 'fa', status: 'live', tag: 'Free · no paywall', title: 'FinAcademy',
      text: 'Five levels, 56 lessons, 145 interactive figures, 217 exercises, tests and certificates.',
      cta: 'Start learning', url: FA_URL },
    risk1: { key: 'risk1', status: 'soon', tag: 'Risk Track I · opening soon', title: 'FRM® Part I, the quantitative half',
      text: 'Twelve modules, every formula as a widget, computed worked examples, 37 one-page cheat sheets.',
      cta: 'Get notified', url: FA_URL + 'login.html' },
    risk2: { key: 'risk2', status: 'prep', tag: 'Risk Track II · in preparation', title: 'FRM® Part II',
      text: 'Market, credit, operational and liquidity risk at exam depth, on the same engine.',
      cta: 'Get notified', url: FA_URL + 'login.html' },
    cfa1: { key: 'cfa1', status: 'prep', tag: 'Analyst Track I · in preparation', title: 'CFA® Level I',
      text: 'Quantitative methods, fixed income, derivatives and portfolio management, built for the exam.',
      cta: 'Get notified', url: FA_URL + 'login.html' },
    yc: { key: 'yc', status: 'live', tag: 'Live data · from the same desk', title: 'yieldcartography.com',
      text: 'Daily Polish sovereign curves, term premia, liquidity and expectations-hypothesis dashboards.',
      cta: 'Open the dashboards', url: YC_URL }
  };

  /* Card styles. Colour variables are set per card; the container colours fall
     back across the two sites' palettes (yieldcartography: --panel/--rule,
     FinAcademy: --surface/--ring). */
  var CSS = [
    '.fa-card{--tk:#444;--tm:#ddd;--tl:#eee;position:relative;display:block;overflow:hidden;background:var(--panel,var(--surface,#fff));border:1px solid var(--rule,var(--ring,#ddd));border-radius:10px;padding:14px 14px 12px;color:var(--ink,#111);text-decoration:none;transition:border-color .15s,transform .15s}',
    '.fa-card:hover{border-color:var(--tk);transform:translateY(-1px);text-decoration:none;border-bottom-color:var(--tk)}',
    '.fa-card>span,.fa-card .fa-tag,.fa-card .fa-title{display:block}',
    '.fa-head>span:last-child{min-width:0;flex:1 1 auto}',
    '.fa-ribbon{position:absolute;left:0;top:0;right:0;height:7px;background:repeating-linear-gradient(135deg,var(--tm) 0 5px,var(--tk) 5px 9px);opacity:.45}',
    '.fa-card.live .fa-ribbon{opacity:.8}',
    '.fa-head{display:flex!important;gap:11px;align-items:center;margin:4px 0 8px}',
    '.fa-em{flex:0 0 44px;width:44px;height:44px}',
    '.fa-tag{font-family:var(--mono,ui-monospace,Menlo,monospace);font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--tk);margin-bottom:3px}',
    '.fa-title{font-weight:650;font-size:14px;line-height:1.25;color:var(--ink,#111)}',
    '.fa-text{font-size:12.5px;line-height:1.45;color:var(--muted,#666);margin:0 0 8px}',
    '.fa-cta{font-family:var(--mono,ui-monospace,Menlo,monospace);font-size:11.5px;color:var(--tk);font-weight:600}',
    '.fa-cards-note{font-size:11px;line-height:1.4;color:var(--muted,#666);margin:10px 0 0}'
  ].join('\n');

  function html(key, ref, opts) {
    var c = CARDS[key], k = COL[key]; opts = opts || {};
    var url = (opts.url || c.url) + ((opts.url || c.url).indexOf('?') < 0 ? '?' : '&') + 'ref=' + encodeURIComponent(ref);
    var ext = opts.external !== false;
    return '<a class="fa-card ' + c.status + ' t-' + c.key + '" style="--tk:' + k.ink + ';--tm:' + k.mid + ';--tl:' + k.light + '" href="' + url + '"' +
      (ext ? ' target="_blank" rel="noopener"' : '') + '>' +
      '<span class="fa-ribbon" aria-hidden="true"></span>' +
      '<span class="fa-head">' + emblem(c.key, k) + '<span><span class="fa-tag">' + c.tag + '</span><span class="fa-title">' + c.title + '</span></span></span>' +
      '<span class="fa-text">' + c.text + '</span><span class="fa-cta">' + c.cta + ' →</span></a>';
  }

  var NOTE = 'FRM® is a registered trademark of GARP and CFA® of CFA Institute; neither endorses or is affiliated with FinAcademy.';
  return { CARDS: CARDS, COL: COL, CSS: CSS, html: html, NOTE: NOTE };
})();

/* ===== yieldcartography.com: the "from the same desk" rail =====
   Included on every page with  <script src="/assets/promo.js?v=2" defer></script>
   A sticky right column on wide screens, a row of cards under the content
   otherwise. To change copy, links or a card's status edit FA_CARDS above. */
(function () {
  'use strict';
  var RAIL = [['fa', 'yc-rail-free'], ['risk1', 'yc-rail-risk1'], ['risk2', 'yc-rail-risk2'], ['cfa1', 'yc-rail-cfa1']];

  var CSS = [
    '.fa-shell{max-width:1180px;margin:0 auto;display:block}',
    '.fa-shell>main{max-width:none}',
    '.fa-shell.narrow>main{max-width:880px}',
    '.fa-rail{margin:0 32px 8px;padding-top:8px}',
    '.fa-rail-k{font-family:var(--mono);font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--accent);margin:0 0 10px}',
    '.fa-cards{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}',
    '.fa-shell.side{display:grid;grid-template-columns:minmax(0,1fr) 268px;column-gap:8px;align-items:start;max-width:1456px}',
    '.fa-shell.narrow.side{max-width:1180px}',
    '.fa-shell.side>.fa-rail{position:sticky;top:104px;margin:32px 32px 32px 0;padding-top:0;max-height:calc(100vh - 120px);overflow-y:auto;scrollbar-width:none}',
    '.fa-shell.side>.fa-rail::-webkit-scrollbar{display:none}',
    '.fa-shell.side .fa-cards{grid-template-columns:1fr}',
    '@media (max-width:720px){.fa-rail{margin:0 20px 8px}}',
    '.fa-rail-toggle{color:#ccc;border:none;text-decoration:underline dotted;cursor:pointer}',
    '.fa-rail-toggle:hover{color:#fff}',
    '@media print{.fa-rail{display:none!important}}'
  ].join('\n');

  var OFF_KEY = 'yc_rail_off';
  function isOff() { try { return localStorage.getItem(OFF_KEY) === '1'; } catch (e) { return false; } }
  function setOff(v) { try { if (v) localStorage.setItem(OFF_KEY, '1'); else localStorage.removeItem(OFF_KEY); } catch (e) {} }

  function build() {
    var main = document.querySelector('main');
    if (!main || document.querySelector('.fa-rail')) return;
    var shell = document.createElement('div');
    shell.className = 'fa-shell' + (main.classList.contains('narrow') ? ' narrow' : '');
    main.parentNode.insertBefore(shell, main);
    shell.appendChild(main);

    var rail = document.createElement('aside');
    rail.className = 'fa-rail';
    rail.setAttribute('aria-label', 'Courses by the author of this site');
    rail.innerHTML = '<div class="fa-rail-k">Learn · from the same desk</div><div class="fa-cards">' +
      RAIL.map(function (r) { return FA_CARDS.html(r[0], r[1]); }).join('') + '</div>' +
      '<p class="fa-cards-note">FinAcademy is built by the author of yieldcartography. ' + FA_CARDS.NOTE + '</p>';
    shell.appendChild(rail);

    var narrow = shell.classList.contains('narrow');
    function place() {
      var side = window.innerWidth >= (narrow ? 1220 : 1480);
      if (shell.classList.contains('side') !== side) {
        shell.classList.toggle('side', side);
        try { window.dispatchEvent(new Event('resize')); } catch (e) {}   /* Plotly relayout */
      }
    }
    place();
    window.addEventListener('resize', place);
    shell.__unbuild = function () {
      window.removeEventListener('resize', place);
      shell.parentNode.insertBefore(main, shell); shell.parentNode.removeChild(shell);
      try { window.dispatchEvent(new Event('resize')); } catch (e) {}
    };
  }
  function unbuild() { var s = document.querySelector('.fa-shell'); if (s && s.__unbuild) s.__unbuild(); }

  /* the quiet switch in the footer: hides the rail on this browser until switched back */
  function toggle() {
    var foot = document.querySelector('.site-footer .copyright') || document.querySelector('.site-footer');
    if (!foot || document.querySelector('.fa-rail-toggle')) return;
    var a = document.createElement('a');
    a.href = '#'; a.className = 'fa-rail-toggle';
    var label = function () { a.textContent = isOff() ? 'show the learning rail' : 'focus mode: hide the learning rail'; };
    a.addEventListener('click', function (e) { e.preventDefault(); setOff(!isOff()); if (isOff()) unbuild(); else build(); label(); });
    foot.appendChild(document.createTextNode(' · ')); foot.appendChild(a); label();
  }

  function init() {
    if (!document.querySelector('main') || document.getElementById('fa-promo-css')) return;
    var st = document.createElement('style'); st.id = 'fa-promo-css'; st.textContent = FA_CARDS.CSS + '\n' + CSS; document.head.appendChild(st);
    if (!isOff()) build();
    toggle();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
