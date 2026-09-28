/* betagate.js v2 — soft beta gate for unreleased (experimental) tabs.
   A small code box sits in the footer Contact column on every page. Typing
   the current beta code unlocks the experimental tabs (flag in localStorage)
   and reloads the page. While unlocked, the experimental tabs appear in the
   main nav marked with an asterisk. Client-side convenience gate, not
   security. */
(function () {
  'use strict';
  var CODE = 'beta';
  var KEY = 'yc_beta';
  var BETA_TABS = [
    { href: '/lt/', label: 'LT *' },
    { href: '/debt/', label: 'debt *' }
  ];

  function unlocked() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }

  function addNavTabs() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    BETA_TABS.forEach(function (t) {
      if (nav.querySelector('a[href="' + t.href + '"]')) return;
      var a = document.createElement('a');
      a.href = t.href;
      a.textContent = t.label;
      if (window.location.pathname.indexOf(t.href) === 0) {
        a.className = 'active';
      }
      nav.appendChild(a);
    });
  }

  function init() {
    if (unlocked()) addNavTabs();
    var box = document.getElementById('betaCode');
    if (!box) return;
    if (unlocked()) {
      var li = box.closest('li');
      if (li) li.innerHTML = '<span style="font-family:var(--mono);' +
        'font-size:10.5px;color:var(--muted)">beta unlocked</span>';
      return;
    }
    box.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      if (box.value.trim().toLowerCase() === CODE) {
        try { localStorage.setItem(KEY, '1'); } catch (e) {}
        window.location.reload();
      } else {
        box.value = '';
        box.placeholder = 'no';
        setTimeout(function () { box.placeholder = 'beta access code'; }, 1200);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
