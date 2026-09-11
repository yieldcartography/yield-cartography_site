/* FinAcademy core: theme, progress store, math rendering, quiz engine, chart helpers */
(function () {
  'use strict';
  const FA = (window.FA = {});

  /* ---------- progress store (localStorage, swappable for a backend later) ---------- */
  const KEY = 'finacademy.v1';
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  FA.store = {
    all: load,
    lesson(id) { const s = load(); return (s.lessons || {})[id] || null; },
    markLesson(id) {
      const s = load(); s.lessons = s.lessons || {};
      s.lessons[id] = { completedAt: new Date().toISOString() }; save(s);
    },
    unmarkLesson(id) { const s = load(); if (s.lessons) { delete s.lessons[id]; save(s); } },
    visit(id) {
      const s = load(); s.visits = s.visits || {};
      if (!s.visits[id]) { s.visits[id] = new Date().toISOString(); save(s); }
    },
    quiz(qid) { const s = load(); return (s.quiz || {})[qid] || null; },
    setQuiz(qid, res) {
      const s = load(); s.quiz = s.quiz || {};
      const prev = s.quiz[qid] || { attempts: 0 };
      s.quiz[qid] = { correct: !!res.correct || !!prev.correct, attempts: prev.attempts + 1, ts: new Date().toISOString() };
      save(s);
    },
    reset() { localStorage.removeItem(KEY); }
  };

  /* ---------- theme ---------- */
  FA.initTheme = function () {
    const saved = localStorage.getItem('fa.theme');
    if (saved) document.documentElement.dataset.theme = saved;
    const btn = document.querySelector('.theme-btn');
    if (btn) btn.addEventListener('click', () => {
      const cur = document.documentElement.dataset.theme ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('fa.theme', next);
      window.dispatchEvent(new Event('fa-theme'));
    });
  };

  /* ---------- math ---------- */
  FA.initMath = function () {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
  };

  /* ---------- formatting ---------- */
  FA.fmt = function (x, dp) {
    if (dp === undefined) dp = 2;
    return x.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  };

  /* ---------- quiz engine ----------
     FA.renderExercises(containerId, lessonId, [{id, prompt, type:'num'|'mc', answer, tol, unit, choices:[{t,ok}], solution}]) */
  FA.renderExercises = function (containerId, lessonId, items) {
    const root = document.getElementById(containerId);
    if (!root) return;
    items.forEach(function (q, idx) {
      const qid = lessonId + '.' + q.id;
      const saved = FA.store.quiz(qid);
      const el = document.createElement('div');
      el.className = 'exercise';
      let body = '<div class="qhead"><span class="qnum">Exercise ' + (idx + 1) + '</span>' +
        '<span class="status" data-st></span></div>' +
        '<div class="qbody prose">' + q.prompt + '</div>';
      if (q.type === 'num') {
        body += '<div class="answer-row"><input type="text" inputmode="decimal" placeholder="Your answer" data-in>' +
          (q.unit ? '<span class="unit">' + q.unit + '</span>' : '') +
          '<button class="btn" data-check>Check</button></div>';
      } else {
        body += '<div class="mc">' + q.choices.map(function (c, i) {
          return '<label><input type="radio" name="' + qid + '" value="' + i + '"><span>' + c.t + '</span></label>';
        }).join('') + '</div><div class="answer-row"><button class="btn" data-check>Check</button></div>';
      }
      body += '<div class="feedback" data-fb></div>' +
        '<details class="sol"><summary>Show worked solution</summary><div class="inner prose">' + q.solution + '</div></details>';
      el.innerHTML = body;
      root.appendChild(el);

      const st = el.querySelector('[data-st]');
      const fb = el.querySelector('[data-fb]');
      function paint(correct, msg) {
        st.textContent = correct ? '✓ correct' : '✗ not yet';
        st.className = 'status ' + (correct ? 'ok' : 'bad');
        fb.className = 'feedback show';
        fb.innerHTML = msg;
      }
      if (saved && saved.correct) { st.textContent = '✓ solved'; st.className = 'status ok'; }

      el.querySelector('[data-check]').addEventListener('click', function () {
        let correct = false, msg = '';
        if (q.type === 'num') {
          const raw = (el.querySelector('[data-in]').value || '').replace(/\s/g, '').replace(',', '.');
          const v = parseFloat(raw);
          if (isNaN(v)) { paint(false, 'Enter a number.'); return; }
          const tol = q.tol !== undefined ? q.tol : Math.abs(q.answer) * 0.005 + 1e-9;
          correct = Math.abs(v - q.answer) <= tol;
          msg = correct ? 'Correct: ' + FA.fmt(q.answer, q.dp === undefined ? 2 : q.dp) + (q.unit ? ' ' + q.unit : '')
            : 'Not quite. Check the day-count, the compounding, and the order of operations, then look at the worked solution.';
        } else {
          const sel = el.querySelector('input[name="' + qid + '"]:checked');
          if (!sel) { paint(false, 'Pick an answer.'); return; }
          correct = !!q.choices[+sel.value].ok;
          msg = correct ? 'Correct.' : 'Not this one. Open the worked solution to see why.';
        }
        FA.store.setQuiz(qid, { correct: correct });
        paint(correct, msg);
        if (window.renderMathInElement) renderMathInElement(fb, { delimiters: [{ left: '\\(', right: '\\)', display: false }], throwOnError: false });
        FA.updateLessonUI && FA.updateLessonUI();
      });
    });
  };

  /* ---------- lesson completion ---------- */
  FA.initLesson = function (lessonId, exerciseCount) {
    FA.store.visit(lessonId);
    const btn = document.getElementById('markComplete');
    const msg = document.getElementById('completeMsg');
    function refresh() {
      const done = !!FA.store.lesson(lessonId);
      if (btn) { btn.textContent = done ? 'Completed ✓ (click to undo)' : 'Mark lesson complete'; }
      if (msg) {
        const all = FA.countSolved(lessonId);
        msg.style.display = 'inline';
        msg.style.color = '';
        msg.textContent = exerciseCount ? all + ' / ' + exerciseCount + ' exercises solved' : '';
      }
    }
    if (btn) btn.addEventListener('click', function () {
      if (FA.store.lesson(lessonId)) FA.store.unmarkLesson(lessonId);
      else FA.store.markLesson(lessonId);
      refresh();
    });
    FA.updateLessonUI = refresh;
    refresh();
  };
  FA.countSolved = function (lessonId) {
    const s = FA.store.all(); let n = 0;
    Object.keys(s.quiz || {}).forEach(function (k) {
      if (k.indexOf(lessonId + '.') === 0 && s.quiz[k].correct) n++;
    });
    return n;
  };

  /* ---------- course progress ---------- */
  FA.courseProgress = function (lessonIds) {
    const done = lessonIds.filter(function (id) { return !!FA.store.lesson(id); }).length;
    return { done: done, total: lessonIds.length, pct: lessonIds.length ? Math.round(done / lessonIds.length * 100) : 0 };
  };

  /* ---------- tiny SVG line chart ----------
     FA.lineChart(svgEl, {series:[{name,color,pts:[[x,y],...]}], x0,x1, yfmt, xfmt, xlabel}) */
  FA.lineChart = function (svg, cfg) {
    const W = 720, H = 320, padL = 62, padR = 14, padT = 14, padB = 34;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    let ymax = -Infinity, ymin = Infinity, xmax = -Infinity, xmin = Infinity;
    const scan = function (pts) {
      pts.forEach(function (p) {
        if (p[1] > ymax) ymax = p[1]; if (p[1] < ymin) ymin = p[1];
        if (p[0] > xmax) xmax = p[0]; if (p[0] < xmin) xmin = p[0];
      });
    };
    cfg.series.forEach(function (s) { scan(s.pts); });
    if (cfg.band) { scan(cfg.band.top); scan(cfg.band.bottom); }
    if (cfg.y0 !== undefined) ymin = cfg.y0;
    const span = ymax - ymin || 1;
    ymax += span * 0.06;
    function X(x) { return padL + (x - xmin) / ((xmax - xmin) || 1) * (W - padL - padR); }
    function Y(y) { return H - padB - (y - ymin) / ((ymax - ymin) || 1) * (H - padT - padB); }
    let out = '';
    /* shaded band between two point sets (difference made visible) */
    if (cfg.band) {
      const top = cfg.band.top, bot = cfg.band.bottom.slice().reverse();
      let d = top.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join('');
      d += bot.map(function (p) { return 'L' + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join('');
      out += '<path d="' + d + 'Z" style="fill:' + (cfg.band.color || 'var(--s2)') + ';opacity:.16"/>';
    }
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const yv = ymin + (ymax - ymin) * i / ticks, yy = Y(yv);
      out += '<line class="gridln" x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '"/>' +
        '<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + (cfg.yfmt ? cfg.yfmt(yv) : FA.fmt(yv, 0)) + '</text>';
    }
    const xt = cfg.xticks || 6;
    for (let i = 0; i <= xt; i++) {
      const xv = xmin + (xmax - xmin) * i / xt, xx = X(xv);
      out += '<text x="' + xx + '" y="' + (H - padB + 18) + '" text-anchor="middle">' + (cfg.xfmt ? cfg.xfmt(xv) : Math.round(xv)) + '</text>';
    }
    out += '<line class="axis" x1="' + padL + '" y1="' + (H - padB) + '" x2="' + (W - padR) + '" y2="' + (H - padB) + '"/>';
    cfg.series.forEach(function (s) {
      const d = s.pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join('');
      out += '<path d="' + d + '" style="fill:none;stroke:' + s.color + '" stroke-width="2" stroke-linejoin="round"' +
        (s.dash ? ' stroke-dasharray="5 4"' : '') + '/>';
    });
    if (cfg.markers) cfg.markers.forEach(function (mk) {
      var mx = X(mk.x), my = Y(mk.y);
      out += '<line class="gridln" x1="' + mx + '" y1="' + my + '" x2="' + mx + '" y2="' + (H - padB) + '" stroke-dasharray="3 3"/>' +
        '<circle cx="' + mx + '" cy="' + my + '" r="5.5" style="fill:' + mk.color + '" stroke="var(--surface)" stroke-width="2"/>';
      if (mk.label) out += '<text x="' + Math.min(mx + 9, W - 90) + '" y="' + (my - 9) + '" style="fill:var(--ink);font-weight:600">' + mk.label + '</text>';
    });
    if (cfg.xlabel) out += '<text x="' + (W / 2) + '" y="' + (H - 2) + '" text-anchor="middle">' + cfg.xlabel + '</text>';
    svg.innerHTML = out;
    svg.__fa = { type: 'line', cfg: cfg };
  };

  /* ---------- bar chart with optional overlay line, negatives allowed ----------
     FA.barLine(svg, {cats:[...], vals:[...], color, name, line:{vals,color,name}, yfmt, xlabel, labelEvery}) */
  FA.barLine = function (svg, cfg) {
    var W = 720, H = 320, padL = 66, padR = 14, padT = 16, padB = 34;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var n = cfg.cats.length;
    var all = cfg.vals.slice();
    if (cfg.line) all = all.concat(cfg.line.vals);
    if (cfg.ghostVals) all = all.concat(cfg.ghostVals);
    if (cfg.hline) all.push(cfg.hline.y);
    var ymax = Math.max(0, Math.max.apply(null, all));
    var ymin = Math.min(0, Math.min.apply(null, all));
    var span = (ymax - ymin) || 1; ymax += span * 0.08; if (ymin < 0) ymin -= span * 0.08;
    function Y(y) { return H - padB - (y - ymin) / (ymax - ymin) * (H - padT - padB); }
    function Xc(i2) { return padL + (i2 + 0.5) / n * (W - padL - padR); }
    var bw = Math.min(30, (W - padL - padR) / n * 0.66);
    var out = '';
    for (var g = 0; g <= 5; g++) {
      var yv = ymin + (ymax - ymin) * g / 5, yy = Y(yv);
      out += '<line class="gridln" x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '"/>' +
        '<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + (cfg.yfmt ? cfg.yfmt(yv) : FA.fmt(yv, 0)) + '</text>';
    }
    var y0 = Y(0);
    var step = cfg.labelEvery || Math.max(1, Math.ceil(n / 16));
    if (cfg.ghostVals) for (var gi = 0; gi < n; gi++) {
      var gv = cfg.ghostVals[gi]; if (gv === undefined || gv === null) continue;
      var gxc = Xc(gi), gyA = Y(Math.max(0, gv)), ghgt = Math.abs(y0 - Y(gv));
      out += '<rect x="' + (gxc - bw / 2 - 3) + '" y="' + (Math.min(gyA, y0) - (gv >= 0 ? 3 : 0)) + '" width="' + (bw + 6) +
        '" height="' + Math.max(1, ghgt + 3) + '" rx="3" style="fill:none;stroke:var(--muted);opacity:.75" stroke-dasharray="4 3">' +
        '<title>' + (cfg.ghostName || 'baseline') + ': ' + FA.fmt(gv, 2) + '</title></rect>';
    }
    for (var i = 0; i < n; i++) {
      var v = cfg.vals[i], xc = Xc(i);
      var yA = Y(Math.max(0, v)), hgt = Math.abs(y0 - Y(v));
      out += '<rect x="' + (xc - bw / 2) + '" y="' + Math.min(yA, y0) + '" width="' + bw + '" height="' + Math.max(1, hgt) +
        '" rx="3" style="fill:' + (cfg.color || 'var(--s1)') + '"><title>' + cfg.cats[i] + ': ' + FA.fmt(v, 2) + '</title></rect>';
      if (i % step === 0) out += '<text x="' + xc + '" y="' + (H - padB + 18) + '" text-anchor="middle">' + cfg.cats[i] + '</text>';
    }
    out += '<line class="axis" x1="' + padL + '" y1="' + y0 + '" x2="' + (W - padR) + '" y2="' + y0 + '"/>';
    if (cfg.line) {
      var d = cfg.line.vals.map(function (v2, i2) { return (i2 ? 'L' : 'M') + Xc(i2).toFixed(1) + ',' + Y(v2).toFixed(1); }).join('');
      out += '<path d="' + d + '" style="fill:none;stroke:' + cfg.line.color + '" stroke-width="2" stroke-linejoin="round"/>';
    }
    if (cfg.hline) {
      var hy = Y(cfg.hline.y);
      out += '<line x1="' + padL + '" y1="' + hy + '" x2="' + (W - padR) + '" y2="' + hy +
        '" style="stroke:' + (cfg.hline.color || 'var(--baseline)') + '" stroke-width="2" stroke-dasharray="6 4"/>';
      if (cfg.hline.label) out += '<text x="' + (W - padR - 4) + '" y="' + (hy - 6) +
        '" text-anchor="end" style="fill:var(--ink);font-weight:600">' + cfg.hline.label + '</text>';
    }
    if (cfg.dot) {
      var dx = Xc(cfg.dot.i), dy = Y(cfg.dot.y);
      out += '<circle cx="' + dx + '" cy="' + dy + '" r="5.5" style="fill:' + (cfg.dot.color || 'var(--s2)') +
        '" stroke="var(--surface)" stroke-width="2"/>';
      if (cfg.dot.label) out += '<text x="' + Math.min(dx + 9, W - 100) + '" y="' + (dy - 9) +
        '" style="fill:var(--ink);font-weight:600">' + cfg.dot.label + '</text>';
    }
    if (cfg.xlabel) out += '<text x="' + (W / 2) + '" y="' + (H - 2) + '" text-anchor="middle">' + cfg.xlabel + '</text>';
    svg.innerHTML = out;
    svg.__fa = { type: 'bar', cfg: cfg };
  };

  /* ---------- stacked bar chart (amortization) ----------
     FA.stackChart(svg, {cats:[...], stacks:[{name,color,vals:[...]},{...}], yfmt}) */
  FA.stackChart = function (svg, cfg) {
    const W = 720, H = 320, padL = 66, padR = 14, padT = 14, padB = 34;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const n = cfg.cats.length;
    let ymax = 0;
    for (let i = 0; i < n; i++) {
      let t = 0; cfg.stacks.forEach(function (s) { t += s.vals[i]; });
      if (t > ymax) ymax = t;
    }
    ymax *= 1.06;
    function Y(y) { return H - padB - y / ymax * (H - padT - padB); }
    const bw = Math.min(34, (W - padL - padR) / n * 0.72);
    let out = '';
    for (let i = 0; i <= 5; i++) {
      const yv = ymax * i / 5, yy = Y(yv);
      out += '<line class="gridln" x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '"/>' +
        '<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + (cfg.yfmt ? cfg.yfmt(yv) : FA.fmt(yv, 0)) + '</text>';
    }
    const step = Math.max(1, Math.ceil(n / 16));
    for (let i = 0; i < n; i++) {
      const xc = padL + (i + 0.5) / n * (W - padL - padR);
      let acc = 0;
      cfg.stacks.forEach(function (s, si) {
        const v = s.vals[i]; if (v <= 0) return;
        const y1 = Y(acc), y2 = Y(acc + v);
        const isTop = si === cfg.stacks.length - 1;
        const hgt = Math.max(0, y1 - y2 - 1);  /* 1px gap between segments */
        out += '<rect x="' + (xc - bw / 2) + '" y="' + y2 + '" width="' + bw + '" height="' + hgt +
          '" style="fill:' + s.color + '"' + (isTop ? ' rx="3"' : '') + '><title>' + cfg.cats[i] + ' — ' + s.name + ': ' + FA.fmt(v, 2) + '</title></rect>';
        acc += v;
      });
      if (i % step === 0) out += '<text x="' + xc + '" y="' + (H - padB + 18) + '" text-anchor="middle">' + cfg.cats[i] + '</text>';
    }
    out += '<line class="axis" x1="' + padL + '" y1="' + (H - padB) + '" x2="' + (W - padR) + '" y2="' + (H - padB) + '"/>';
    if (cfg.xlabel) out += '<text x="' + (W / 2) + '" y="' + (H - 2) + '" text-anchor="middle">' + cfg.xlabel + '</text>';
    svg.innerHTML = out;
    svg.__fa = { type: 'stack', cfg: cfg };
  };

  /* ---------- cash-flow arrow diagram ----------
     FA.flowDiagram(svg, {t0, t1, axis:[{t,label}], rows:[{name, color, flows:[{t, amt, label, note}]}]})
     One timeline per row; amt>0 draws an arrow up (you receive), amt<0 down (you pay).
     Arrow heights scale with sqrt(|amt|) within the diagram; note renders under the axis (e.g. a DF). */
  FA.flowDiagram = function (svg, cfg) {
    var W = 720, rowH = cfg.rowH || 150, rows = cfg.rows, H = rows.length * rowH + 26;
    var padL = 20, padR = 20;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var t0 = cfg.t0 !== undefined ? cfg.t0 : 0, t1 = cfg.t1 !== undefined ? cfg.t1 : 1;
    function X(t) { return padL + (t - t0) / ((t1 - t0) || 1) * (W - padL - padR); }
    var maxAmt = 0;
    rows.forEach(function (r) { r.flows.forEach(function (f) { maxAmt = Math.max(maxAmt, Math.abs(f.amt)); }); });
    if (!maxAmt) maxAmt = 1;
    var out = '';
    rows.forEach(function (r, ri) {
      var cy = ri * rowH + rowH / 2 + 8;
      var maxH = rowH / 2 - 30;
      out += '<line x1="' + padL + '" y1="' + cy + '" x2="' + (W - padR) + '" y2="' + cy +
        '" style="stroke:var(--axis, var(--muted))" stroke-width="1.6"/>';
      out += '<polygon points="' + (W - padR) + ',' + cy + ' ' + (W - padR - 8) + ',' + (cy - 4) + ' ' + (W - padR - 8) + ',' + (cy + 4) +
        '" style="fill:var(--axis, var(--muted))"/>';
      if (r.name) out += '<text x="' + padL + '" y="' + (cy - maxH - 12) + '" style="fill:var(--muted);font-weight:600;font-size:12px">' + r.name + '</text>';
      (cfg.axis || []).forEach(function (a) {
        var x = X(a.t);
        out += '<line x1="' + x + '" y1="' + (cy - 4) + '" x2="' + x + '" y2="' + (cy + 4) + '" style="stroke:var(--axis, var(--muted))"/>' +
          (ri === rows.length - 1 ? '<text x="' + x + '" y="' + (cy + 20) + '" text-anchor="middle" style="fill:var(--muted);font-size:11px">' + a.label + '</text>' : '');
      });
      r.flows.forEach(function (f) {
        var x = X(f.t);
        var h = Math.max(20, Math.sqrt(Math.abs(f.amt) / maxAmt) * maxH);
        var up = f.amt > 0;
        var y2 = up ? cy - h : cy + h;
        var col = f.color || r.color || 'var(--s1)';
        out += '<line x1="' + x + '" y1="' + cy + '" x2="' + x + '" y2="' + (up ? y2 + 7 : y2 - 7) + '" style="stroke:' + col + '" stroke-width="2.5"/>';
        out += '<polygon points="' + x + ',' + y2 + ' ' + (x - 4.5) + ',' + (up ? y2 + 9 : y2 - 9) + ' ' + (x + 4.5) + ',' + (up ? y2 + 9 : y2 - 9) +
          '" style="fill:' + col + '"/>';
        if (f.label) out += '<text x="' + x + '" y="' + (up ? y2 - 6 : y2 + 14) + '" text-anchor="middle" style="fill:var(--ink);font-weight:600;font-size:12px">' + f.label + '</text>';
        if (f.note) out += '<text x="' + x + '" y="' + (up ? cy + 34 : cy - 8) + '" text-anchor="middle" style="fill:var(--muted);font-size:10.5px">' + f.note + '</text>';
      });
      (r.segments || []).forEach(function (s) {
        var xa = X(s.from), xb = X(s.to), ym = cy - 14;
        out += '<line x1="' + (xa + 3) + '" y1="' + ym + '" x2="' + (xb - 3) + '" y2="' + ym +
          '" style="stroke:' + (s.color || 'var(--muted)') + '" stroke-width="1.2" stroke-dasharray="4 3"/>' +
          '<line x1="' + (xa + 3) + '" y1="' + (ym - 4) + '" x2="' + (xa + 3) + '" y2="' + (ym + 4) + '" style="stroke:' + (s.color || 'var(--muted)') + '"/>' +
          '<line x1="' + (xb - 3) + '" y1="' + (ym - 4) + '" x2="' + (xb - 3) + '" y2="' + (ym + 4) + '" style="stroke:' + (s.color || 'var(--muted)') + '"/>' +
          '<text x="' + ((xa + xb) / 2) + '" y="' + (ym - 6) + '" text-anchor="middle" style="fill:var(--muted);font-size:11px">' + s.label + '</text>';
      });
    });
    svg.innerHTML = out;
    svg.__fa = { type: 'flow', cfg: cfg };
  };

  /* ---------- figure downloads: PNG + Excel ---------- */
  FA._cssVar = function (el, name) {
    return getComputedStyle(el).getPropertyValue(name).trim() || getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };
  FA._resolveVars = function (s, ctx) {
    var guard = 0;
    var re = /var\((--[a-zA-Z0-9-]+)(?:\s*,\s*([^()]*))?\)/;
    while (re.test(s) && guard++ < 200) {
      s = s.replace(re, function (m, name, fb) {
        var v = FA._cssVar(ctx, name);
        return v || (fb || '#888');
      });
    }
    return s;
  };
  FA._esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  /* Collect title, current control settings, and legend entries for a chart. */
  FA._exportMeta = function (svg) {
    var box = svg.closest ? (svg.closest('.widget') || svg.closest('section')) : null;
    var title = '';
    if (box) {
      var h = box.querySelector('h3') || box.querySelector('h2');
      if (h) title = h.textContent.replace(/\s+/g, ' ').trim();
    }
    if (!title) title = (document.title.split('·')[0] || 'Figure').trim();
    var params = [];
    if (box) {
      box.querySelectorAll('.ctrl').forEach(function (c) {
        var name = '';
        for (var n = c.firstChild; n; n = n.nextSibling) {
          if (n.nodeType === 3 && n.textContent.trim()) { name = n.textContent.trim(); break; }
        }
        if (!name) return;
        var val = '';
        var vs = c.querySelector('.val');
        var sel = c.querySelector('select');
        var inp = c.querySelector('input');
        if (vs && vs.textContent.trim() && vs.textContent.trim() !== '—') val = vs.textContent.trim();
        else if (sel) val = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent.trim() : sel.value;
        else if (inp && inp.type === 'checkbox') val = inp.checked ? 'on' : 'off';
        else if (inp) val = inp.value;
        if (val !== '') params.push(name.replace(/:$/, '') + ' = ' + val);
      });
    }
    var legend = [];
    var lg = box ? box.querySelector('.legend') : null;
    if (lg) {
      lg.querySelectorAll('.it').forEach(function (it) {
        var sw = it.querySelector('.sw');
        var col = sw ? FA._resolveVars(sw.style.background || sw.style.backgroundColor || '#888', svg) : '#888';
        legend.push({ name: it.textContent.replace(/\s+/g, ' ').trim(), color: col });
      });
    } else if (svg.__fa) {
      var cfg = svg.__fa.cfg, t = svg.__fa.type;
      var push = function (name, color) {
        if (name) legend.push({ name: name, color: FA._resolveVars(color || 'var(--muted)', svg) });
      };
      if (t === 'line') (cfg.series || []).forEach(function (s) { push(s.name, s.color); });
      else if (t === 'bar') {
        push(cfg.name, cfg.color);
        if (cfg.ghostVals) push(cfg.ghostName || 'baseline', cfg.ghostColor || 'var(--muted)');
        if (cfg.line) push(cfg.line.name, cfg.line.color);
      } else if (t === 'stack') (cfg.stacks || []).forEach(function (s) { push(s.name, s.color); });
      else if (t === 'flow') (cfg.rows || []).forEach(function (r) { push(r.name, r.color); });
    }
    return { title: title, params: params, legend: legend };
  };
  /* Greedy-wrap strings into lines that fit maxW at the given font size. */
  FA._wrapItems = function (items, maxW, fs, sep) {
    var lines = [], cur = [], curW = 0, perChar = fs * 0.58, sepW = (sep || '   ').length * perChar;
    items.forEach(function (it) {
      var w = String(it.text !== undefined ? it.text : it).length * perChar + (it.extra || 0);
      if (cur.length && curW + sepW + w > maxW) { lines.push(cur); cur = []; curW = 0; }
      cur.push(it); curW += (cur.length > 1 ? sepW : 0) + w;
    });
    if (cur.length) lines.push(cur);
    return lines;
  };
  FA.downloadPNG = function (svg) {
    var vb = (svg.getAttribute('viewBox') || '0 0 720 320').split(/\s+/);
    var W = +vb[2], H = +vb[3];
    var muted = FA._cssVar(svg, '--muted') || '#777';
    var ink = FA._cssVar(svg, '--ink') || '#111';
    var ink2 = FA._cssVar(svg, '--ink2') || '#444';
    var grid = FA._cssVar(svg, '--grid') || '#ddd';
    var axis = FA._cssVar(svg, '--baseline') || '#999';
    var surface = FA._cssVar(svg, '--surface') || FA._cssVar(svg, '--bg') || '#ffffff';
    var meta = FA._exportMeta(svg);
    var PAD = 18, innerW = W - 2 * PAD;
    /* header layout */
    var hdr = [], y = PAD + 14;
    hdr.push('<text x="' + PAD + '" y="' + y + '" style="font:600 15px system-ui,sans-serif;fill:' + ink + '">' + FA._esc(meta.title) + '</text>');
    y += 8;
    if (meta.params.length) {
      var pLines = FA._wrapItems(meta.params, innerW, 11, '   ');
      pLines.forEach(function (ln) {
        y += 15;
        hdr.push('<text x="' + PAD + '" y="' + y + '" style="font:11px system-ui,sans-serif;fill:' + ink2 + '">' +
          FA._esc(ln.map(function (i) { return i; }).join('   ·   ')) + '</text>');
      });
      y += 3;
    }
    if (meta.legend.length) {
      var lItems = meta.legend.map(function (l) { return { text: l.name, extra: 18, l: l }; });
      var lLines = FA._wrapItems(lItems, innerW, 11, '   ');
      lLines.forEach(function (ln) {
        y += 17;
        var x = PAD;
        ln.forEach(function (it) {
          hdr.push('<rect x="' + x + '" y="' + (y - 9) + '" width="10" height="10" rx="2" fill="' + it.l.color + '"/>');
          x += 15;
          hdr.push('<text x="' + x + '" y="' + y + '" style="font:11px system-ui,sans-serif;fill:' + ink2 + '">' + FA._esc(it.l.name) + '</text>');
          x += it.l.name.length * 11 * 0.58 + 17;
        });
      });
      y += 3;
    }
    var headH = y + 8;
    var footH = 24;
    var totH = headH + H + footH;
    var pageTitle = (document.title || '').split('·')[0].replace(/\s+/g, ' ').trim();
    var stamp = new Date().toISOString().slice(0, 10);
    var foot = '<text x="' + PAD + '" y="' + (headH + H + 14) + '" style="font:10px system-ui,sans-serif;fill:' + muted + '">' +
      FA._esc('FinAcademy · ' + pageTitle + ' · exported ' + stamp) + '</text>';
    var style = '<style>text{font:12px system-ui,-apple-system,Segoe UI,sans-serif;fill:' + muted + '}' +
      '.axis{stroke:' + axis + '}.gridln{stroke:' + grid + '}</style>';
    var inner = FA._resolveVars(svg.innerHTML, svg);
    var markup = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + totH + '" width="' + W + '" height="' + totH + '">' +
      '<rect x="0" y="0" width="' + W + '" height="' + totH + '" fill="' + (surface || '#fff') + '"/>' + style +
      hdr.join('') +
      '<line x1="' + PAD + '" y1="' + (headH - 6) + '" x2="' + (W - PAD) + '" y2="' + (headH - 6) + '" stroke="' + grid + '"/>' +
      '<g transform="translate(0,' + headH + ')">' + inner + '</g>' + foot + '</svg>';
    var img = new Image();
    var name = (document.title.split('·')[0] || 'figure').trim().replace(/[^\w-]+/g, '_') + '_' + (svg.id || 'chart');
    img.onload = function () {
      var H2 = totH;
      var scale = 2;
      var cv = document.createElement('canvas');
      cv.width = W * scale; cv.height = H2 * scale;
      var ctx = cv.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, W, H2);
      cv.toBlob(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name + '.png';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      }, 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
  };
  FA._xlsxReady = null;
  FA._loadXLSX = function () {
    if (window.XLSX) return Promise.resolve();
    if (FA._xlsxReady) return FA._xlsxReady;
    var coreSrc = document.querySelector('script[src*="core.js"]').getAttribute('src');
    var base = coreSrc.replace(/js\/core\.js.*$/, '');
    FA._xlsxReady = new Promise(function (res, rej) {
      var sc = document.createElement('script');
      sc.src = base + 'vendor/xlsx/xlsx.mini.min.js';
      sc.onload = res; sc.onerror = rej;
      document.head.appendChild(sc);
    });
    return FA._xlsxReady;
  };
  FA._chartAOA = function (fa) {
    var cfg = fa.cfg, aoa = [], i, j;
    if (fa.type === 'aoa') return cfg;  /* custom widgets hand over their own worksheet rows */
    if (fa.type === 'line') {
      var blocks = [];
      (cfg.series || []).forEach(function (s) {
        blocks.push({ h: [(s.name || 'series') + ' x', s.name || 'series'], rows: s.pts });
      });
      if (cfg.band) {
        blocks.push({ h: ['band top x', 'band top'], rows: cfg.band.top });
        blocks.push({ h: ['band bottom x', 'band bottom'], rows: cfg.band.bottom });
      }
      var maxN = 0;
      blocks.forEach(function (b) { maxN = Math.max(maxN, b.rows.length); });
      var head = [];
      blocks.forEach(function (b) { head = head.concat(b.h); });
      aoa.push(head);
      for (i = 0; i < maxN; i++) {
        var row = [];
        blocks.forEach(function (b) {
          var p = b.rows[i];
          row.push(p ? p[0] : null, p ? p[1] : null);
        });
        aoa.push(row);
      }
    } else if (fa.type === 'bar') {
      var head2 = ['category', cfg.name || 'value'];
      if (cfg.ghostVals) head2.push(cfg.ghostName || 'baseline');
      if (cfg.line) head2.push(cfg.line.name || 'line');
      aoa.push(head2);
      for (i = 0; i < cfg.cats.length; i++) {
        var r2 = [cfg.cats[i], cfg.vals[i]];
        if (cfg.ghostVals) r2.push(cfg.ghostVals[i] !== undefined ? cfg.ghostVals[i] : null);
        if (cfg.line) r2.push(cfg.line.vals[i]);
        aoa.push(r2);
      }
    } else if (fa.type === 'stack') {
      var head3 = ['category'];
      cfg.stacks.forEach(function (s) { head3.push(s.name); });
      aoa.push(head3);
      for (i = 0; i < cfg.cats.length; i++) {
        var r3 = [cfg.cats[i]];
        cfg.stacks.forEach(function (s) { r3.push(s.vals[i]); });
        aoa.push(r3);
      }
    } else if (fa.type === 'flow') {
      aoa.push(['leg / row', 'time', 'amount (sign: + receive, − pay)', 'label', 'note']);
      (cfg.rows || []).forEach(function (r) {
        (r.flows || []).forEach(function (f) {
          aoa.push([r.name || '', f.t, f.amt, f.label || '', f.note || '']);
        });
      });
    }
    return aoa;
  };
  FA.downloadXLSX = function (svg) {
    if (!svg.__fa) return;
    FA._loadXLSX().then(function () {
      var aoa = FA._chartAOA(svg.__fa);
      var wb = XLSX.utils.book_new();
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'figure data');
      var meta = FA._exportMeta(svg);
      var sAoa = [['figure', meta.title], ['page', (document.title || '').trim()]];
      meta.params.forEach(function (p) {
        var k = p.split(' = ');
        sAoa.push([k[0], k.slice(1).join(' = ')]);
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sAoa), 'settings');
      var name = (document.title.split('·')[0] || 'figure').trim().replace(/[^\w-]+/g, '_') + '_' + (svg.id || 'chart');
      XLSX.writeFile(wb, name + '.xlsx');
    }).catch(function () { alert('Could not load the Excel export library.'); });
  };
  FA.initDownloads = function () {
    document.querySelectorAll('svg.chart').forEach(function (svg) {
      var row = document.createElement('div');
      row.className = 'dlrow';
      var b1 = document.createElement('button');
      b1.type = 'button'; b1.className = 'dlbtn'; b1.textContent = '\u2913 PNG';
      b1.title = 'Download this figure as a PNG image';
      b1.addEventListener('click', function () { FA.downloadPNG(svg); });
      var b2 = document.createElement('button');
      b2.type = 'button'; b2.className = 'dlbtn'; b2.textContent = '\u2913 Excel';
      b2.title = 'Download the data behind this figure as an Excel file';
      b2.addEventListener('click', function () { FA.downloadXLSX(svg); });
      row.appendChild(b1); row.appendChild(b2);
      svg.parentNode.insertBefore(row, svg.nextSibling);
    });
  };

  /* ---------- account sync (server-side progress via /api, optional) ----------
     Works only when the site is served by the FinAcademy Worker. On file:// or
     plain static hosting every call fails silently and the site stays local-only. */
  const SKEY = 'finacademy.v1';
  function loadRaw() {
    try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch (e) { return {}; }
  }
  function saveRaw(s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {} }
  FA.mergeStores = function (a, b) {
    a = a || {}; b = b || {};
    const out = { lessons: {}, visits: {}, quiz: {}, tests: {} };
    out.lessons = Object.assign({}, b.lessons || {}, a.lessons || {});   // keep a's timestamps on conflict
    out.visits = Object.assign({}, b.visits || {}, a.visits || {});
    const qids = new Set(Object.keys(a.quiz || {}).concat(Object.keys(b.quiz || {})));
    qids.forEach(function (q) {
      const x = (a.quiz || {})[q], y = (b.quiz || {})[q];
      if (!x) { out.quiz[q] = y; return; }
      if (!y) { out.quiz[q] = x; return; }
      out.quiz[q] = {
        correct: !!(x.correct || y.correct),
        attempts: Math.max(x.attempts || 0, y.attempts || 0),
        ts: (x.ts || '') > (y.ts || '') ? x.ts : y.ts
      };
    });
    const lvls = new Set(Object.keys(a.tests || {}).concat(Object.keys(b.tests || {})));
    lvls.forEach(function (lv) {
      const seen = {}, all = ((a.tests || {})[lv] || []).concat(((b.tests || {})[lv] || []));
      const ded = all.filter(function (t) {
        if (!t || !t.ts || seen[t.ts]) return false;
        seen[t.ts] = 1; return true;
      }).sort(function (x, y) { return x.ts < y.ts ? -1 : 1; });
      out.tests[lv] = ded.slice(-25);
    });
    return out;
  };
  FA.sync = { user: null, ready: false };
  FA.sync.push = function () {
    if (!FA.sync.user) return;
    fetch('/api/progress', {
      method: 'PUT', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(loadRaw())
    }).catch(function () {});
  };
  FA.sync.init = function () {
    fetch('/api/me', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (res) {
      FA.sync.ready = true;
      const right = document.querySelector('.topnav .right');
      FA.sync.config = (res && res.config) || {};
      if (res && res.user) {
        FA.sync.user = res.user;
        FA.sync.certificates = res.certificates || [];
        FA.sync.surveyDone = !!res.surveyDone;
        if (right && !document.getElementById('acctLink')) {
          const a = document.createElement('a');
          a.id = 'acctLink'; a.href = '/account.html'; a.className = 'pill';
          a.style.textDecoration = 'none';
          a.textContent = (res.user.name ? res.user.name.split(' ')[0] : 'Account') + ' · synced';
          right.insertBefore(a, right.firstChild);
        }
        fetch('/api/progress', { credentials: 'same-origin' }).then(function (r) { return r.json(); })
          .then(function (pr) {
            const merged = FA.mergeStores(loadRaw(), pr && pr.data);
            saveRaw(merged);
            FA.sync.push();
            window.dispatchEvent(new Event('fa-sync'));
          }).catch(function () {});
        // watch for local changes and push them (debounced by polling)
        let last = JSON.stringify(loadRaw());
        setInterval(function () {
          const now = JSON.stringify(loadRaw());
          if (now !== last) { last = now; FA.sync.push(); }
        }, 4000);
      } else if (right && !document.getElementById('acctLink')) {
        const a = document.createElement('a');
        a.id = 'acctLink'; a.href = '/login.html'; a.className = 'pill';
        a.style.textDecoration = 'none';
        a.textContent = 'Sign in';
        right.insertBefore(a, right.firstChild);
      }
      window.dispatchEvent(new Event('fa-auth'));
    }).catch(function () { /* static hosting or offline: stay local-only */ });
  };


  /* ---------- "/" jumps to search ---------- */

  /* ---------- textbook banner ---------- */
  FA.initBookBar = function () {
    if (document.querySelector('.bookbar')) return;
    var p = location.pathname;
    if (/test(\.html)?$|cert|login|verify|account|survey-admin/.test(p)) return;
    var f = document.querySelector('footer.site');
    if (!f) return;
    var d = document.createElement('div');
    d.className = 'bookbar noprint';
    d.innerHTML = '<span class="bb-mark" aria-hidden="true"></span>' +
      '<span>Prefer it on paper? The whole curriculum is also a <b>275-page textbook</b>: ' +
      'every lesson, every figure, exercises with full solutions, typeset for print.</span>' +
      '<a href="https://finacademy.gumroad.com/l/bifpzm" target="_blank" rel="noopener">Get the textbook \u00b7 $19.99 \u2192</a>';
    f.parentNode.insertBefore(d, f);
  };

  /* ---------- demand survey (registered users only) ----------
     Renders once per user, above the textbook banner, until they answer.
     "Not now" hides it for 10 days on this browser. Answers go to /api/survey. */
  FA.initSurveyBar = function () {
    var p = location.pathname;
    if (/test(\.html)?$|cert|login|verify|account|search|survey-admin/.test(p)) return;
    var SNOOZE_KEY = 'fa_survey_snooze', SNOOZE_DAYS = 10;
    function snoozed() {
      try { var t = +localStorage.getItem(SNOOZE_KEY) || 0; return t > Date.now(); } catch (e) { return false; }
    }
    function render() {
      if (document.querySelector('.survey')) return;
      var f = document.querySelector('footer.site');
      if (!f) return;
      var d = document.createElement('section');
      d.className = 'survey noprint';
      d.setAttribute('aria-label', 'Short survey');
      var cb = function (id, label) {
        return '<label class="sv-opt"><input type="checkbox" name="i" value="' + id + '"><span>' + label + '</span></label>';
      };
      var rd = function (name, id, label) {
        return '<label class="sv-opt"><input type="radio" name="' + name + '" value="' + id + '"><span>' + label + '</span></label>';
      };
      d.innerHTML =
        '<div class="sv-k">Two questions · one minute</div>' +
        '<h3>What should FinAcademy build next?</h3>' +
        '<p class="sv-lead">The five free levels stay free. We are deciding what to add, and your answer decides it.</p>' +
        '<div class="sv-q">1. Which of these would you actually use? <span class="sv-hint">(tick any)</span></div>' +
        '<div class="sv-opts">' +
          cb('frm1', 'Quantitative methods for the <b>FRM® Part I</b> exam') +
          cb('frm2', 'Quantitative methods for the <b>FRM® Part II</b> exam') +
          cb('cfa', 'Quantitative methods for the <b>CFA®</b> exams') +
          cb('xva', 'Advanced derivatives, XVA and curve building beyond Level 4') +
          cb('python', 'Python for finance, built on these lessons') +
          cb('free', 'More free levels like the current ones') +
        '</div>' +
        '<div class="sv-q">2. If a focused exam-prep course cost about <b>$99</b>, you would…</div>' +
        '<div class="sv-opts sv-row">' +
          rd('pay', 'buy', 'buy it') + rd('pay', 'consider', 'consider it') + rd('pay', 'free', 'stick to free material') +
        '</div>' +
        '<details class="sv-more"><summary>Optional: are you preparing for an exam, and anything else?</summary>' +
          '<div class="sv-opts sv-row">' +
            rd('exam', 'frm1', 'FRM Part I') + rd('exam', 'frm2', 'FRM Part II') + rd('exam', 'cfa', 'CFA') +
            rd('exam', 'other', 'another exam') + rd('exam', 'none', 'no exam') +
          '</div>' +
          '<textarea name="comment" maxlength="600" rows="2" placeholder="What is missing, what would you pay for, what should stay free…"></textarea>' +
        '</details>' +
        '<div class="sv-actions"><button type="button" class="btn sv-send">Send answers</button>' +
          '<button type="button" class="btn ghost sv-later">Not now</button>' +
          '<span class="sv-msg" role="status"></span></div>' +
        '<div class="sv-fine">FRM® is a registered trademark of GARP and CFA® of CFA Institute. Neither endorses or is affiliated with FinAcademy.</div>';
      var bb = document.querySelector('.bookbar');
      f.parentNode.insertBefore(d, bb || f);

      var msg = d.querySelector('.sv-msg');
      d.querySelector('.sv-later').addEventListener('click', function () {
        try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 864e5)); } catch (e) {}
        d.remove();
      });
      d.querySelector('.sv-send').addEventListener('click', function () {
        var interests = [].slice.call(d.querySelectorAll('input[name=i]:checked')).map(function (x) { return x.value; });
        var pay = (d.querySelector('input[name=pay]:checked') || {}).value || '';
        var exam = (d.querySelector('input[name=exam]:checked') || {}).value || '';
        var comment = d.querySelector('textarea[name=comment]').value.trim();
        if (!interests.length && !pay && !exam && !comment) { msg.textContent = 'Tick at least one option first.'; return; }
        var btn = d.querySelector('.sv-send');
        btn.disabled = true; msg.textContent = 'Sending…';
        fetch('/api/survey', {
          method: 'PUT', credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ interests: interests, pay: pay, exam: exam, comment: comment, page: p })
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.error) || 'failed');
          d.classList.add('sv-done');
          d.innerHTML = '<div class="sv-k">Thank you</div><p class="sv-lead">Your answer is recorded. ' +
            'We will announce what we build next in the newsletter and here on the site.</p>';
          try { localStorage.removeItem(SNOOZE_KEY); } catch (e) {}
        }).catch(function (e) {
          btn.disabled = false; msg.textContent = 'Could not send (' + e.message + '). Please try again.';
        });
      });
    }
    function maybe() {
      if (!FA.sync.user || FA.sync.surveyDone || snoozed()) return;
      render();
    }
    if (FA.sync.ready) maybe(); else window.addEventListener('fa-auth', maybe, { once: true });
  };

  /* ---------- sponsor rail (empty by default) ----------
     To activate, set FA.sponsor before boot, e.g.
       FA.sponsor = { label:'Supported by', name:'Kozminski University',
                      url:'https://...', img:'data:image/png;base64,...' };
     or per level:
       FA.sponsor = { byLevel:true, l4:{...}, default:{...} };
     While null, nothing renders and the right margin stays clean. */
  FA.sponsor = null;
  FA.initSponsorRail = function () {
    var p = location.pathname.replace(/\.html$/, '');
    if (!/^\/courses\/l[1-5]\/[a-z]/.test(p)) return;            // lesson pages only
    if (/(?:^|\/)(test|index)$|cert|login|verify|account|-cheat/.test(p)) return;
    var cfg = FA.sponsor;
    if (cfg && cfg.byLevel) {
      var m = p.match(/\/courses\/(l[1-5])\//);
      cfg = (m && cfg[m[1]]) || cfg.default || null;
    }
    if (!cfg || !(cfg.name || cfg.img)) return;                   // empty -> render nothing
    var wrap = document.querySelector('.wrap');
    if (!wrap) return;
    var el = document.createElement('aside');
    el.className = 'srail noprint';
    var inner = '<div class="srail-k">' + (cfg.label || 'Supported by') + '</div>';
    var body = cfg.img
      ? '<img src="' + cfg.img + '" alt="' + (cfg.name || '') + '">'
      : '<span class="srail-name">' + (cfg.name || '') + '</span>';
    inner += cfg.url
      ? '<a href="' + cfg.url + '" target="_blank" rel="noopener sponsored">' + body + '</a>'
      : body;
    el.innerHTML = inner;
    document.body.appendChild(el);
    function place() {
      var r = wrap.getBoundingClientRect();
      var contentRight = r.left + 24 + 780;                       // padding + reading width
      var room = r.right - 24 - contentRight;
      if (window.innerWidth < 1120 || room < 230) { el.style.display = 'none'; return; }
      el.style.display = 'block';
      el.style.left = (contentRight + 28) + 'px';
      el.style.width = Math.min(room - 8, 260) + 'px';
    }
    place();
    window.addEventListener('resize', place);
  };

  /* ---------- nav: highlight the current level ---------- */
  FA.initNav = function () {
    var m = location.pathname.match(/\/courses\/(l[1-5])\//);
    if (!m) return;
    var a = document.querySelector('.topnav a.nl[data-lv="' + m[1] + '"]');
    if (a) a.classList.add('active');
  };

  FA.initSearchKey = function () {
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      var here = /\/search(\.html)?$/.test(location.pathname);
      var box = document.getElementById('q');
      e.preventDefault();
      if (here && box) { box.focus(); box.select(); return; }
      location.href = (location.pathname.indexOf('/courses/') >= 0 ? '../../' : '') + 'search.html';
    });
  };

  /* boot */
  document.addEventListener('DOMContentLoaded', function () {
    FA.initTheme();
    FA.initMath();
    FA.initDownloads();
    FA.sync.init();
    FA.initNav();
    FA.initSearchKey();
    FA.initBookBar();
    FA.initSurveyBar();
    FA.initSponsorRail();
  });
})();
