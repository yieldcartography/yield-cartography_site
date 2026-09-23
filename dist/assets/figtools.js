/* figtools.js v1 — uniform figure UX for yieldcartography.
   Decorates every rendered Plotly figure with a toolbar (pop-out, CSV, XLS,
   PNG) and appends a source line and a suggested citation under the panel.
   Panels opt in to attribution via data-fig-source / data-fig-cite on the
   .panel element, with page-wide defaults on <body data-fig-source-default
   data-fig-cite-default>. Tables opt in to export buttons via
   data-figtable on the <table>. No dependencies beyond Plotly. */
(function () {
  'use strict';

  var CSS = [
    '.figtools{display:inline-flex;gap:4px;margin-left:auto;vertical-align:middle}',
    '.figtools button{background:var(--panel,#f6f6f6);border:1px solid var(--rule,#ddd);',
    'color:var(--muted,#777);border-radius:4px;font-size:10px;font-weight:600;line-height:1;',
    'padding:3px 7px;cursor:pointer;letter-spacing:.3px;font-family:var(--mono,monospace)}',
    '.figtools button:hover{border-color:var(--accent,#1F4E79);color:var(--accent,#1F4E79)}',
    '.fig-head-row{display:flex;align-items:baseline;gap:8px}',
    '.fig-source{font-family:var(--mono,monospace);font-size:10px;color:var(--muted,#888);',
    'letter-spacing:.2px;margin:8px 0 0 0;line-height:1.5}',
    '.fig-source b{font-weight:600;color:var(--ink-soft,#555)}',
    '.fig-modal-backdrop{position:fixed;inset:0;background:rgba(20,25,32,.55);z-index:9000;',
    'display:flex;align-items:center;justify-content:center;padding:3vh 3vw}',
    '.fig-modal{background:#fff;border-radius:8px;box-shadow:0 18px 60px rgba(0,0,0,.35);',
    'width:min(1400px,94vw);max-height:94vh;overflow:auto;padding:22px 26px;position:relative}',
    '.fig-modal-close{position:absolute;top:10px;right:12px;background:none;border:none;',
    'font-size:22px;line-height:1;color:var(--muted,#888);cursor:pointer;padding:4px}',
    '.fig-modal-close:hover{color:var(--accent,#1F4E79)}',
    '.fig-modal .plot-frame,.fig-modal .js-plotly-plot{height:74vh!important}'
  ].join('');

  function injectCss() {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function slug(t) {
    return (t || 'figure').toLowerCase().replace(/&[a-z]+;/g, ' ')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'figure';
  }

  function csvEsc(v) {
    v = String(v === null || v === undefined ? '' : v);
    return (v.indexOf(',') >= 0 || v.indexOf('"') >= 0)
      ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function rowsToCSV(cols, rows) {
    return [cols.map(csvEsc).join(',')]
      .concat(rows.map(function (r) { return r.map(csvEsc).join(','); }))
      .join('\n');
  }

  function rowsToXLS(cols, rows, title) {
    var th = cols.map(function (c) { return '<th>' + c + '</th>'; }).join('');
    var trs = rows.map(function (r) {
      return '<tr>' + r.map(function (c) {
        return '<td>' + String(c === null || c === undefined ? '' : c) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head>' +
      '<meta charset="UTF-8"><title>' + (title || 'data') + '</title></head>' +
      '<body><table border="1"><tr>' + th + '</tr>' + trs + '</table></body></html>';
  }

  function dlBlob(content, mime, fn) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = fn;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  function plotData(gd) {
    var traces = (gd.data || []).filter(function (t) { return t.visible !== 'legendonly'; });
    var hm = traces.filter(function (t) { return t.z && t.z.length; })[0];
    if (hm) {
      var cols = [''].concat((hm.x || hm.z[0].map(function (_, i) { return i; }))
        .map(String));
      var rows = hm.z.map(function (zr, i) {
        return [hm.y ? String(hm.y[i]) : i].concat(zr);
      });
      return { cols: cols, rows: rows };
    }
    var xs = [], seen = {};
    traces.forEach(function (t) {
      (t.x || []).forEach(function (x) {
        var k = String(x);
        if (!seen[k]) { seen[k] = 1; xs.push(k); }
      });
    });
    var cols = ['x'].concat(traces.map(function (t, i) { return t.name || 'series' + (i + 1); }));
    var maps = traces.map(function (t) {
      var m = {};
      (t.x || []).forEach(function (x, i) { m[String(x)] = (t.y || [])[i]; });
      return m;
    });
    var rows = xs.map(function (x) {
      return [x].concat(maps.map(function (m) {
        return m[x] === undefined ? '' : m[x];
      }));
    });
    return { cols: cols, rows: rows };
  }

  function panelOf(el) {
    var p = el.closest('.panel');
    return p || el.parentElement;
  }

  function titleOf(panel, gd) {
    var h = panel ? panel.querySelector('h3, h2') : null;
    if (h) return h.textContent.trim();
    var lt = gd && gd.layout && gd.layout.title;
    return (lt && (lt.text || lt)) || document.title.split('—')[0].trim();
  }

  function resizePlots(root) {
    (root || document).querySelectorAll('.js-plotly-plot').forEach(function (gd) {
      if (window.Plotly && Plotly.Plots) { try { Plotly.Plots.resize(gd); } catch (e) {} }
    });
  }

  var modal = null;

  function closeModal() {
    if (!modal) return;
    var panel = modal.panel, ph = modal.placeholder;
    ph.parentNode.replaceChild(panel, ph);
    modal.backdrop.remove();
    document.removeEventListener('keydown', modal.onKey);
    modal = null;
    setTimeout(function () { resizePlots(panel); }, 30);
  }

  function popOut(panel) {
    if (modal) { closeModal(); return; }
    var ph = document.createElement('div');
    ph.style.display = 'none';
    panel.parentNode.replaceChild(ph, panel);
    var backdrop = document.createElement('div');
    backdrop.className = 'fig-modal-backdrop';
    var box = document.createElement('div');
    box.className = 'fig-modal';
    var x = document.createElement('button');
    x.className = 'fig-modal-close';
    x.innerHTML = '&times;';
    x.title = 'Close (Esc)';
    x.addEventListener('click', closeModal);
    box.appendChild(x);
    box.appendChild(panel);
    backdrop.appendChild(box);
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeModal();
    });
    var onKey = function (ev) { if (ev.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    document.body.appendChild(backdrop);
    modal = { panel: panel, placeholder: ph, backdrop: backdrop, onKey: onKey };
    setTimeout(function () { resizePlots(box); }, 30);
  }

  function mkBtn(label, tip, fn) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = label; b.title = tip;
    b.addEventListener('click', function (ev) { ev.preventDefault(); fn(); });
    return b;
  }

  function toolbarHost(panel, target) {
    var h = panel ? panel.querySelector('.panel-head-row, h3, h2') : null;
    if (h) {
      if (h.tagName === 'H3' || h.tagName === 'H2') {
        if (!h.parentElement.classList.contains('fig-head-row')) {
          var wrap = document.createElement('div');
          wrap.className = 'fig-head-row';
          h.parentNode.insertBefore(wrap, h);
          wrap.appendChild(h);
        }
        return h.parentElement;
      }
      return h;
    }
    return target.parentElement;
  }

  function attribution(panel) {
    var src = (panel && panel.getAttribute('data-fig-source')) ||
      document.body.getAttribute('data-fig-source-default');
    var cite = (panel && panel.getAttribute('data-fig-cite')) ||
      document.body.getAttribute('data-fig-cite-default');
    if (!src && !cite) return null;
    var p = document.createElement('p');
    p.className = 'fig-source';
    var html = '';
    if (src) html += '<b>Source:</b> ' + src;
    if (cite) html += (src ? '<br>' : '') + '<b>Suggested citation:</b> ' + cite;
    p.innerHTML = html;
    return p;
  }

  function decoratePlot(gd) {
    if (gd.dataset.figtools) return;
    gd.dataset.figtools = '1';
    var panel = panelOf(gd);
    var title = titleOf(panel, gd);
    var fn = slug(title);
    var bar = document.createElement('span');
    bar.className = 'figtools';
    bar.appendChild(mkBtn('↗', 'Pop out and magnify', function () { popOut(panel); }));
    bar.appendChild(mkBtn('CSV', 'Download the chart data as CSV', function () {
      var d = plotData(gd);
      dlBlob(rowsToCSV(d.cols, d.rows), 'text/csv', fn + '.csv');
    }));
    bar.appendChild(mkBtn('XLS', 'Download the chart data as XLS', function () {
      var d = plotData(gd);
      dlBlob(rowsToXLS(d.cols, d.rows, title), 'application/vnd.ms-excel', fn + '.xls');
    }));
    bar.appendChild(mkBtn('PNG', 'Download the chart as a PNG image', function () {
      if (window.Plotly && Plotly.downloadImage) {
        Plotly.downloadImage(gd, { format: 'png', scale: 2, filename: fn,
          width: gd.offsetWidth || 900, height: gd.offsetHeight || 420 });
      }
    }));
    toolbarHost(panel, gd).appendChild(bar);
    if (panel && !panel.dataset.figsrc) {
      panel.dataset.figsrc = '1';
      var att = attribution(panel);
      if (att) panel.appendChild(att);
    }
  }

  function tableRows(tbl) {
    var rows = Array.prototype.map.call(tbl.querySelectorAll('tr'), function (tr) {
      return Array.prototype.map.call(tr.children, function (c) {
        return c.textContent.replace(/\s+/g, ' ').trim();
      });
    });
    return { cols: rows[0] || [], rows: rows.slice(1) };
  }

  function decorateTable(tbl) {
    if (tbl.dataset.figtools) return;
    tbl.dataset.figtools = '1';
    var panel = panelOf(tbl);
    var title = titleOf(panel, null);
    var fn = slug(title);
    var bar = document.createElement('span');
    bar.className = 'figtools';
    bar.appendChild(mkBtn('CSV', 'Download this table as CSV', function () {
      var d = tableRows(tbl);
      dlBlob(rowsToCSV(d.cols, d.rows), 'text/csv', fn + '.csv');
    }));
    bar.appendChild(mkBtn('XLS', 'Download this table as XLS', function () {
      var d = tableRows(tbl);
      dlBlob(rowsToXLS(d.cols, d.rows, title), 'application/vnd.ms-excel', fn + '.xls');
    }));
    toolbarHost(panel, tbl).appendChild(bar);
    if (panel && !panel.dataset.figsrc) {
      panel.dataset.figsrc = '1';
      var att = attribution(panel);
      if (att) panel.appendChild(att);
    }
  }

  function scan() {
    document.querySelectorAll('.js-plotly-plot').forEach(decoratePlot);
    document.querySelectorAll('table[data-figtable]').forEach(decorateTable);
    document.querySelectorAll('.panel[data-fig-source], .panel[data-fig-cite]')
      .forEach(function (panel) {
        if (panel.dataset.figsrc) return;
        panel.dataset.figsrc = '1';
        var att = attribution(panel);
        if (att) panel.appendChild(att);
      });
  }

  function start() {
    injectCss();
    scan();
    var n = 0;
    var t = setInterval(function () {
      scan();
      if (++n > 40) clearInterval(t);
    }, 700);
    if (window.MutationObserver) {
      new MutationObserver(function () { scan(); })
        .observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
