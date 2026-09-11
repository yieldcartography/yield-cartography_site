
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
