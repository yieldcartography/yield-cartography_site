/* betagate.js v3 — soft beta gate for unreleased (experimental) tabs.
   A small code box sits in the footer Contact column on every page. Typing
   the current beta code unlocks the experimental tabs (flag in localStorage)
   and reloads the page. While unlocked, the experimental tabs appear in the
   main nav marked with an asterisk, and their landing-page cards
   ([data-beta-card], hidden by default) are revealed. Client-side
   convenience gate, not security. */
(function () {
  'use strict';
  var CODE = 'beta';
  var KEY = 'yc_beta';
  var BETA_TABS = [
    { href: '/debt/', label: 'debt *', tip: 'Beta: Treasury wholesale bonds, maturity profile since 2005 and a ten-year rollover simulator' },
    { href: '/des/', label: 'des *', tip: 'Beta: one bond under the microscope, schedule, auctions, turnover, rich/cheap, bid-ask' }
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
      if (t.tip) a.setAttribute('data-tip', t.tip);
      if (window.location.pathname.indexOf(t.href) === 0) {
        a.className = 'active';
      }
      nav.appendChild(a);
    });
  }

  function revealCards() {
    var cards = document.querySelectorAll('[data-beta-card]');
    for (var i = 0; i < cards.length; i++) cards[i].style.display = '';
  }

  function init() {
    if (unlocked()) { addNavTabs(); revealCards(); }
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
