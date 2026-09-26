/* betagate.js v1 — soft beta gate for unreleased tabs.
   A small code box sits in the footer Contact column on every page.
   Typing the current beta code unlocks /lt/ (flag in localStorage) and
   navigates there. Client-side convenience gate, not security. */
(function () {
  'use strict';
  var CODE = 'beta';
  var KEY = 'yc_beta';

  function unlocked() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }

  function unlock() {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
    window.location.href = '/lt/';
  }

  function init() {
    var box = document.getElementById('betaCode');
    if (!box) return;
    if (unlocked()) {
      var li = box.closest('li');
      if (li) li.innerHTML = '<a href="/lt/" style="font-family:var(--mono);' +
        'font-size:11px;letter-spacing:0.4px">LT · long-term curve (beta) →</a>';
      return;
    }
    box.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      if (box.value.trim().toLowerCase() === CODE) { unlock(); }
      else {
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
