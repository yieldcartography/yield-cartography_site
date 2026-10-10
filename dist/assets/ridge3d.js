/* ridge3d.js v1 — shared 3D "ribbon / waterfall" chart for yieldcartography.
   Filled time series stacked at depths, MATLAB-waterfall style, one mesh3d
   ribbon (series filled to a zero baseline) plus a dark edge line per series.
   First used on /curves/ (inline copy), then /vols/ and /liquidity/.

   window.ycRidge3d(divId, {
     dates:   ['2005-01-31', ...]            ISO date strings (common x grid),
     series:  [{ label, values, color }, ...] front series first,
     zTitle:  'score (pp)',
     yearStep: 3,                             x tick spacing in years,
     aspect:  { x:2.7, y:1.05, z:0.75 },      scene aspect ratio,
     hoverUnit: 'bp'                          appended to hover values
   })
   Requires Plotly on the page. */
(function () {
  'use strict';

  var RULE = '#d8d8d8';
  var MONO = { family: "'JetBrains Mono','Fira Code',Menlo,Consolas,monospace",
               size: 10, color: '#6a6a6a' };

  function decYear(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    var y0 = Date.UTC(d.getUTCFullYear(), 0, 1);
    var y1 = Date.UTC(d.getUTCFullYear() + 1, 0, 1);
    return d.getUTCFullYear() + (d - y0) / (y1 - y0);
  }

  window.ycRidge3d = function (divId, opt) {
    var x = opt.dates.map(decYear);
    var n = x.length;
    var traces = [];
    opt.series.forEach(function (s, k) {
      var y = s.values;
      var xs = new Array(2 * n), ds = new Array(2 * n), zs = new Array(2 * n);
      for (var i = 0; i < n; i++) {
        xs[i] = x[i];     ds[i] = k;     zs[i] = (y[i] == null ? 0 : y[i]);
        xs[n + i] = x[i]; ds[n + i] = k; zs[n + i] = 0;
      }
      var I = [], J = [], K = [];
      for (i = 0; i < n - 1; i++) {
        I.push(i, n + i);
        J.push(n + i, n + i + 1);
        K.push(i + 1, i + 1);
      }
      traces.push({ type: 'mesh3d', x: xs, y: ds, z: zs, i: I, j: J, k: K,
        color: s.color, opacity: 0.72, flatshading: true, hoverinfo: 'skip',
        lighting: { ambient: 0.9, diffuse: 0.3, specular: 0.05 },
        showlegend: false });
      traces.push({ type: 'scatter3d', mode: 'lines',
        x: x, y: new Array(n).fill(k), z: y,
        line: { color: '#444444', width: 1.6 }, name: s.label,
        hovertemplate: s.label + ' · %{x:.2f}: %{z:.2f}' +
          (opt.hoverUnit ? ' ' + opt.hoverUnit : '') + '<extra></extra>',
        showlegend: false });
    });
    var yr0 = Math.floor(x[0]), yr1 = Math.ceil(x[n - 1]);
    var step = opt.yearStep || 3;
    var yrs = [];
    for (var y2 = yr0; y2 <= yr1; y2 += step) yrs.push(y2);
    var lay = {
      margin: { l: 0, r: 0, t: 10, b: 0 }, height: opt.height || 560,
      paper_bgcolor: 'rgba(0,0,0,0)',
      scene: {
        aspectratio: opt.aspect || { x: 2.7, y: 1.05, z: 0.75 },
        camera: { eye: { x: 2.0, y: -2.2, z: 0.9 } },
        xaxis: { tickvals: yrs, ticktext: yrs.map(String), tickfont: MONO,
                 showspikes: false, gridcolor: RULE },
        yaxis: { tickvals: opt.series.map(function (_, k) { return k; }),
                 ticktext: opt.series.map(function (s) { return s.label; }),
                 tickfont: MONO, showspikes: false, gridcolor: RULE },
        zaxis: { title: { text: opt.zTitle || '', font: MONO },
                 tickfont: MONO, showspikes: false, gridcolor: RULE }
      }
    };
    Plotly.react(divId, traces, lay,
                 { displayModeBar: false, responsive: true });
  };
})();
