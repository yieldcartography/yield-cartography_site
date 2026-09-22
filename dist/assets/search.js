/* ===== yieldcartography site search =====
   A magnifying-glass button in the header plus a full-screen overlay over
   dist/data/search_index.json (built by make_search_index.py on every site
   build). Open with the icon, "/" or Cmd/Ctrl+K; Esc closes; arrows + Enter
   navigate. Pure client side, index lazy-loaded on first open. */
(function () {
  'use strict';
  var INDEX = null, box = null, input = null, list = null, sel = 0, rows = [];

  var CSS = [
    '.yc-search-btn{background:none;border:none;cursor:pointer;padding:4px 6px;margin-left:6px;color:var(--muted,#666);display:inline-flex;align-items:center}',
    '.yc-search-btn:hover{color:var(--accent,#1f4e79)}',
    '.yc-search-ovl{position:fixed;inset:0;background:rgba(20,26,34,0.55);z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:9vh 16px 16px}',
    '.yc-search-box{width:min(680px,100%);background:#fff;border-radius:8px;box-shadow:0 12px 48px rgba(0,0,0,0.35);overflow:hidden}',
    '.yc-search-box input{width:100%;box-sizing:border-box;border:none;outline:none;padding:16px 18px;font-family:var(--mono,Menlo,monospace);font-size:15px;border-bottom:1px solid var(--rule,#ddd)}',
    '.yc-search-res{max-height:56vh;overflow-y:auto}',
    '.yc-search-row{display:block;padding:10px 18px;text-decoration:none;color:inherit;border-bottom:1px solid #f2f2f0}',
    '.yc-search-row.sel,.yc-search-row:hover{background:var(--accent-tint,#eaf0f6)}',
    '.yc-search-row .rt{font-size:13.5px;font-weight:600;color:var(--ink,#111)}',
    '.yc-search-row .rp{font-family:var(--mono,Menlo,monospace);font-size:10px;color:var(--accent,#1f4e79);text-transform:uppercase;letter-spacing:0.5px;margin-left:8px}',
    '.yc-search-row .rs{font-size:12px;color:var(--muted,#666);line-height:1.45;margin-top:2px}',
    '.yc-search-row .rs b{color:var(--ink,#111);background:#fdf3d8}',
    '.yc-search-empty{padding:16px 18px;font-family:var(--mono,Menlo,monospace);font-size:12px;color:var(--muted,#666)}'
  ].join('\n');

  var ICON = '<svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="17.5" y2="17.5"/></svg>';

  function tokens(q) {
    return q.toLowerCase().split(/[^a-z0-9ąćęłńóśźż%]+/).filter(function (t) { return t.length > 1; });
  }

  function score(rec, terms) {
    var t = rec.t.toLowerCase(), p = rec.p.toLowerCase(), s = rec.s.toLowerCase();
    var sc = 0;
    for (var i = 0; i < terms.length; i++) {
      var w = terms[i];
      var inT = t.indexOf(w) >= 0, inP = p.indexOf(w) >= 0, inS = s.indexOf(w) >= 0;
      if (!inT && !inP && !inS) return 0;          /* every term must hit somewhere */
      sc += (inT ? 5 : 0) + (inP ? 2 : 0) + (inS ? 1 : 0);
    }
    return sc;
  }

  function mark(text, terms) {
    var lo = text.toLowerCase(), best = 0;
    for (var i = 0; i < terms.length; i++) {
      var k = lo.indexOf(terms[i]);
      if (k >= 0) { best = Math.max(0, k - 60); break; }
    }
    var snip = (best > 0 ? '…' : '') + text.slice(best, best + 180) + (best + 180 < text.length ? '…' : '');
    terms.forEach(function (w) {
      snip = snip.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<b>$1</b>');
    });
    return snip;
  }

  function render() {
    var q = input.value.trim();
    var terms = tokens(q);
    list.innerHTML = '';
    rows = []; sel = 0;
    if (!terms.length) { list.innerHTML = '<div class="yc-search-empty">type to search the dashboards, methodology notes and shorts · Esc closes</div>'; return; }
    var hits = [];
    for (var i = 0; i < INDEX.length; i++) {
      var sc = score(INDEX[i], terms);
      if (sc > 0) hits.push([sc, INDEX[i]]);
    }
    hits.sort(function (a, b) { return b[0] - a[0]; });
    hits.slice(0, 14).forEach(function (h, i) {
      var r = h[1];
      var a = document.createElement('a');
      a.className = 'yc-search-row' + (i === 0 ? ' sel' : '');
      a.href = r.u;
      a.innerHTML = '<span class="rt">' + r.t + '</span><span class="rp">' + r.p + '</span>' +
                    '<div class="rs">' + mark(r.s, terms) + '</div>';
      list.appendChild(a); rows.push(a);
    });
    if (!hits.length) list.innerHTML = '<div class="yc-search-empty">no matches for "' + q.replace(/</g, '&lt;') + '"</div>';
  }

  function open() {
    if (box) { box.parentNode.style.display = 'flex'; input.focus(); input.select(); return; }
    var ovl = document.createElement('div');
    ovl.className = 'yc-search-ovl';
    ovl.innerHTML = '<div class="yc-search-box"><input type="text" placeholder="search yieldcartography…" autocomplete="off"><div class="yc-search-res"></div></div>';
    document.body.appendChild(ovl);
    box = ovl.firstChild; input = box.querySelector('input'); list = box.querySelector('.yc-search-res');
    ovl.addEventListener('mousedown', function (e) { if (e.target === ovl) close(); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!rows.length) return;
        rows[sel].classList.remove('sel');
        sel = (sel + (e.key === 'ArrowDown' ? 1 : rows.length - 1)) % rows.length;
        rows[sel].classList.add('sel');
        rows[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && rows.length) {
        location.href = rows[sel].href;
      }
    });
    if (INDEX === null) {
      INDEX = [];
      fetch('/data/search_index.json').then(function (r) { return r.json(); })
        .then(function (j) { INDEX = j; render(); }).catch(function () {});
    }
    render();
    input.focus();
  }

  function close() { if (box) box.parentNode.style.display = 'none'; }

  function init() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var nav = document.querySelector('.site-header nav');
    if (nav) {
      var b = document.createElement('button');
      b.className = 'yc-search-btn'; b.setAttribute('aria-label', 'Search'); b.title = 'Search ( / )';
      b.innerHTML = ICON;
      b.addEventListener('click', open);
      nav.appendChild(b);
    }
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault(); open();
      } else if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
