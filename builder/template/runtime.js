(function(){
  'use strict';

  // ---- Built-in helper utilities exposed to task-type modules via api.utils ----
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const utils = {
    SVG_NS,
    svg(name, attrs){
      const el = document.createElementNS(SVG_NS, name);
      if(attrs) Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, String(v)));
      return el;
    },
    el(tag, opts){
      const e = document.createElement(tag);
      if(!opts) return e;
      if(opts.className) e.className = opts.className;
      if(opts.id) e.id = opts.id;
      if(opts.text != null) e.textContent = opts.text;
      if(opts.html != null) e.innerHTML = opts.html;
      if(opts.attrs) Object.entries(opts.attrs).forEach(([k,v]) => e.setAttribute(k, String(v)));
      if(opts.style) Object.assign(e.style, opts.style);
      if(opts.children) opts.children.forEach(c => c && e.appendChild(c));
      return e;
    },
    sanitizeZero(value, eps){
      eps = eps == null ? 5e-3 : eps;
      return Math.abs(value) < eps ? 0 : value;
    },
    fmt(num, digits){
      digits = digits == null ? 2 : digits;
      const clean = utils.sanitizeZero(Number(num), 0.5 * Math.pow(10, -digits));
      return clean.toFixed(digits);
    },
    parseNum(value){
      const s = String(value == null ? '' : value).trim().replace(',', '.');
      if(!s) return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    },
    parseAngle(value){
      const s0 = String(value == null ? '' : value).trim().toLowerCase().replace(/,/g, '.').replace(/\s+/g, '');
      if(!s0) return null;
      const s = s0
        .replace(/π/g, 'pi')
        .replace(/([0-9)])pi/g, '$1*pi')
        .replace(/pi(?=[0-9(])/g, 'pi*')
        .replace(/\)(?=[0-9a-z])/g, ')*');
      if(!/^[0-9pi+\-*/().]+$/i.test(s)) return null;
      const jsExpr = s.replace(/pi/g, '(' + Math.PI + ')');
      try {
        const result = Function('"use strict"; return (' + jsExpr + ');')();
        return Number.isFinite(result) ? result : null;
      } catch(e) {
        return null;
      }
    },
    nearlyEqual(a, b, tol){ return Math.abs(a - b) <= (tol == null ? 0.05 : tol); },
    normalizeAngle(phi){
      let x = phi;
      while(x <= -Math.PI) x += 2 * Math.PI;
      while(x > Math.PI) x -= 2 * Math.PI;
      return utils.sanitizeZero(x, 1e-9);
    },
    angleEqual(a, b, tol){
      return Math.abs(utils.normalizeAngle(a - b)) <= (tol == null ? 0.06 : tol);
    },
    safeMathExpr(expr, vars){
      // Evaluate a math expression like "x^2 + 2*x" with given vars {x: 1.5}.
      // Allowed: digits, vars, pi, e, + - * / ^ % ( ) , and Math.* functions.
      const allowedFns = ['sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','exp','log','log2','log10','sqrt','abs','floor','ceil','round','pow','min','max','sign'];
      let s = String(expr || '').replace(/\s+/g, '').replace(/,/g, '.');
      if(!s) return null;
      s = s.replace(/\^/g, '**');
      const varNames = Object.keys(vars || {});
      // Whitelist token check: identifiers must be allowed fn / var / pi / e
      const tokens = s.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
      for(const t of tokens){
        if(!(allowedFns.includes(t) || varNames.includes(t) || t === 'pi' || t === 'e' || t === 'PI' || t === 'E')) return null;
      }
      // Replace pi/e with Math values; prefix functions with Math.
      let body = s.replace(/\bpi\b/g, '(Math.PI)').replace(/\bPI\b/g, '(Math.PI)')
                  .replace(/\be\b/g, '(Math.E)').replace(/\bE\b/g, '(Math.E)');
      allowedFns.forEach(fn => {
        body = body.replace(new RegExp('\\b' + fn + '\\b', 'g'), 'Math.' + fn);
      });
      try {
        const fn = new Function(...varNames, '"use strict"; return (' + body + ');');
        const r = fn(...varNames.map(v => vars[v]));
        return Number.isFinite(r) ? r : null;
      } catch(e) {
        return null;
      }
    },
    feedbackBox(host){
      const box = utils.el('div', {className: 'formula-box feedback-box'});
      const title = utils.el('div', {className: 'formula-title', text: 'Rückmeldung'});
      const text = utils.el('div', {className: 'formula-text', text: 'Noch keine Korrektur durchgeführt.'});
      box.appendChild(title); box.appendChild(text);
      host.appendChild(box);
      return {
        ok(msg){ box.classList.remove('feedback-bad'); box.classList.add('feedback-good'); text.textContent = msg; },
        bad(msg){ box.classList.remove('feedback-good'); box.classList.add('feedback-bad'); text.textContent = msg; },
        neutral(msg){ box.classList.remove('feedback-good','feedback-bad'); text.textContent = msg; }
      };
    }
  };

  // ---- Coordinate-plane plot helper (used by complex / vector / function tasks) ----
  utils.renderPlane = function(host, options){
    const opts = Object.assign({
      width: 640, height: 640, pad: 54,
      xMin: -5.5, xMax: 5.5, yMin: -5.5, yMax: 5.5,
      xLabel: 'x', yLabel: 'y',
      showGrid: true, gridStep: 1,
      paths: [],   // {points:[[x,y],..], stroke, strokeWidth, dash}
      lines: [],   // {x1,y1,x2,y2, stroke, strokeWidth, dash}
      circles: [], // {cx, cy, r, stroke, fill, strokeWidth, dash}
      points: [],  // {x, y, label, color, size}
      arcs: []     // {cx,cy,r, a0,a1, stroke, dash}
    }, options || {});
    const W = opts.width, H = opts.height, P = opts.pad;
    const sx = (x) => P + ((x - opts.xMin)/(opts.xMax - opts.xMin)) * (W - 2*P);
    const sy = (y) => H - P - ((y - opts.yMin)/(opts.yMax - opts.yMin)) * (H - 2*P);
    host.innerHTML = '';
    const svg = utils.svg('svg', {viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%'});
    svg.appendChild(utils.svg('rect', {x:0, y:0, width:W, height:H, fill:'#ffffff'}));
    // grid
    if(opts.showGrid){
      const step = opts.gridStep;
      for(let xv = Math.ceil(opts.xMin/step)*step; xv <= opts.xMax; xv += step){
        if(Math.abs(xv) < 1e-9) continue;
        const x = sx(xv);
        svg.appendChild(utils.svg('line', {x1:x, y1:P, x2:x, y2:H-P, stroke:'#e2e8ed', 'stroke-width':1}));
        const t = utils.svg('text', {x:x, y:sy(0)+18, 'font-size':14, 'text-anchor':'middle', fill:'#5d6872'});
        t.textContent = (Math.round(xv*100)/100); svg.appendChild(t);
      }
      for(let yv = Math.ceil(opts.yMin/step)*step; yv <= opts.yMax; yv += step){
        if(Math.abs(yv) < 1e-9) continue;
        const y = sy(yv);
        svg.appendChild(utils.svg('line', {x1:P, y1:y, x2:W-P, y2:y, stroke:'#e2e8ed', 'stroke-width':1}));
        const t = utils.svg('text', {x:sx(0)-10, y:y+5, 'font-size':14, 'text-anchor':'end', fill:'#5d6872'});
        t.textContent = (Math.round(yv*100)/100); svg.appendChild(t);
      }
    }
    // axes
    svg.appendChild(utils.svg('line', {x1:P, y1:sy(0), x2:W-P, y2:sy(0), stroke:'#003b5c', 'stroke-width':2}));
    svg.appendChild(utils.svg('line', {x1:sx(0), y1:P, x2:sx(0), y2:H-P, stroke:'#003b5c', 'stroke-width':2}));
    const xl = utils.svg('text', {x:W-P+6, y:sy(0)-8, 'font-size':16, fill:'#003b5c'}); xl.textContent = opts.xLabel; svg.appendChild(xl);
    const yl = utils.svg('text', {x:sx(0)+10, y:P+16, 'font-size':16, fill:'#003b5c'}); yl.textContent = opts.yLabel; svg.appendChild(yl);
    // user shapes
    (opts.paths || []).forEach(p => {
      if(!p.points || !p.points.length) return;
      const d = p.points.map((pt,i) => (i===0?'M':'L') + sx(pt[0]) + ' ' + sy(pt[1])).join(' ');
      const path = utils.svg('path', {d, stroke: p.stroke || '#1565ff', fill:'none', 'stroke-width': p.strokeWidth || 3});
      if(p.dash) path.setAttribute('stroke-dasharray', p.dash);
      svg.appendChild(path);
    });
    (opts.circles || []).forEach(c => {
      const radiusPx = Math.abs(sx(c.cx + c.r) - sx(c.cx));
      const el = utils.svg('circle', {cx: sx(c.cx), cy: sy(c.cy), r: radiusPx, fill: c.fill || 'none', stroke: c.stroke || '#888', 'stroke-width': c.strokeWidth || 2});
      if(c.dash) el.setAttribute('stroke-dasharray', c.dash);
      svg.appendChild(el);
    });
    (opts.lines || []).forEach(l => {
      const el = utils.svg('line', {x1:sx(l.x1), y1:sy(l.y1), x2:sx(l.x2), y2:sy(l.y2), stroke: l.stroke || '#1565ff', 'stroke-width': l.strokeWidth || 3});
      if(l.dash) el.setAttribute('stroke-dasharray', l.dash);
      svg.appendChild(el);
    });
    (opts.points || []).forEach(p => {
      svg.appendChild(utils.svg('circle', {cx:sx(p.x), cy:sy(p.y), r: p.size || 7, fill: p.color || '#1565ff'}));
      if(p.label){
        const t = utils.svg('text', {x:sx(p.x)+10, y:sy(p.y)-10, 'font-size':16, fill:'#003b5c', 'font-weight':'700'});
        t.textContent = p.label; svg.appendChild(t);
      }
    });
    host.appendChild(svg);
  };

  // ---- Runtime state ----
  let theme = null;
  let courseConfig = null;
  let currentPageIdx = -1;
  const taskScores = []; // [{points, max, completed}]
  const taskInstances = []; // {destroy?}

  function applyTheme(t){
    const root = document.documentElement;
    if(t.primaryColor) root.style.setProperty('--primary', t.primaryColor);
    if(t.primaryLight) root.style.setProperty('--primary-light', t.primaryLight);
    if(t.accentColor) root.style.setProperty('--accent', t.accentColor);
    if(t.accentDarkColor) root.style.setProperty('--accent-dark', t.accentDarkColor);
    if(t.fontFamily) root.style.setProperty('--font', t.fontFamily);
    document.getElementById('brandKicker').textContent = t.kicker || '';
    const logoSrc = t.logoDataUrl || t.logoUrl || null;
    if(logoSrc){
      const img = document.getElementById('brandLogo');
      img.src = logoSrc;
      img.alt = t.kicker || '';
      img.classList.remove('hidden');
      // If file missing, hide the broken image gracefully
      img.onerror = () => img.classList.add('hidden');
    }
    const link = document.getElementById('footerLink');
    if(t.footerLink){
      link.href = t.footerLink;
      link.textContent = t.footerText || t.footerLink;
    } else {
      link.parentElement.style.display = 'none';
    }
  }

  function totalScore(){
    let pts = 0, max = 0;
    taskScores.forEach(s => { if(s){ pts += s.points; max += s.max; } });
    return {pts, max};
  }

  function pushScoreToLMS(final){
    if(!window.Scorm12 || !Scorm12.initialized) return;
    const {pts, max} = totalScore();
    Scorm12.set('cmi.core.score.raw', pts.toFixed(2));
    Scorm12.set('cmi.core.score.min', '0');
    Scorm12.set('cmi.core.score.max', String(max || 1));
    let status = 'incomplete';
    if(final){
      const threshold = (courseConfig.passThreshold == null) ? 0.5 : courseConfig.passThreshold;
      const ratio = max > 0 ? pts / max : 0;
      status = ratio >= threshold ? 'passed' : 'failed';
    }
    Scorm12.set('cmi.core.lesson_status', status);
    Scorm12.commit();
  }

  function updateScorePill(){
    const pill = document.getElementById('scorePill');
    if(!pill) return;
    const {pts, max} = totalScore();
    pill.textContent = 'Punkte: ' + pts + ' / ' + max;
  }

  function updateNavStates(){
    const buttons = document.querySelectorAll('#topNav .nav-link');
    buttons.forEach((btn, i) => {
      btn.classList.toggle('active', i === currentPageIdx);
      const score = taskScores[i];
      btn.classList.toggle('done', !!(score && score.points >= score.max && score.max > 0));
    });
  }

  function buildNav(){
    const nav = document.getElementById('topNav');
    nav.innerHTML = '';
    courseConfig.tasks.forEach((task, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-link';
      btn.textContent = task.title || ('Aufgabe ' + (i+1));
      btn.addEventListener('click', () => showPage(i));
      nav.appendChild(btn);
    });
    const pill = document.createElement('span');
    pill.className = 'score-pill';
    pill.id = 'scorePill';
    nav.appendChild(pill);
  }

  function showPage(idx){
    if(idx < 0 || idx >= courseConfig.tasks.length) return;
    // tear down previous
    const prev = taskInstances[currentPageIdx];
    if(prev && typeof prev.destroy === 'function'){
      try { prev.destroy(); } catch(e) {}
    }
    taskInstances[currentPageIdx] = null;
    currentPageIdx = idx;
    const task = courseConfig.tasks[idx];
    const container = document.getElementById('taskContainer');
    container.innerHTML = '';
    const page = document.createElement('div');
    page.className = 'task-page';
    container.appendChild(page);

    const def = window.TaskTypes.get(task.type);
    if(!def){
      page.innerHTML = '<section class="hero-card"><div><h2>Unbekannter Aufgabentyp</h2><p>Aufgabentyp <code>' + escapeHtml(task.type) + '</code> ist in diesem Paket nicht enthalten.</p></div></section>';
      updateNavStates();
      return;
    }

    const api = {
      utils,
      initScore(max){
        // Called once on mount to register the task's max points without overwriting prior answers.
        const existing = taskScores[idx];
        if(!existing) taskScores[idx] = {points: 0, max: Math.max(1, max), completed: false};
        else taskScores[idx] = {points: existing.points, max: Math.max(1, max), completed: existing.completed};
        pushScoreToLMS(false);
        updateScorePill();
        updateNavStates();
      },
      reportScore(points, max){
        const existing = taskScores[idx];
        const m = max != null ? Math.max(1, max) : (existing ? existing.max : 1);
        taskScores[idx] = {points: Math.max(0, Math.min(points, m)), max: m, completed: true};
        pushScoreToLMS(false);
        updateScorePill();
        updateNavStates();
      },
      goToNext(){ if(idx + 1 < courseConfig.tasks.length) showPage(idx + 1); else finishCourse(); },
      goToPrev(){ if(idx - 1 >= 0) showPage(idx - 1); },
      isLast(){ return idx + 1 >= courseConfig.tasks.length; }
    };

    try {
      taskInstances[idx] = def.mount(page, task.config || {}, task, api) || {};
    } catch(err) {
      console.error('Aufgabentyp ' + task.type + ' Mount-Fehler:', err);
      page.innerHTML = '<section class="hero-card"><div><h2>Fehler beim Laden</h2><pre>' + escapeHtml(String(err && err.stack || err)) + '</pre></div></section>';
    }
    updateNavStates();
    updateScorePill();
  }

  function finishCourse(){
    pushScoreToLMS(true);
    try { Scorm12.finish(); } catch(e) {}
    const container = document.getElementById('taskContainer');
    const {pts, max} = totalScore();
    container.innerHTML = '<section class="hero-card"><div><h2>Test beendet</h2><p>Erreichte Punktzahl: <strong>' + pts + ' / ' + max + '</strong></p><p>Du kannst dieses Fenster jetzt schließen und zum Kurs zurückkehren.</p></div></section>';
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // expose to allow task types to call programmatically
  window.ScormRuntime = { finishCourse, totalScore, getCourseConfig: () => courseConfig };

  function loadJson(globalKey, filename){
    if(window[globalKey]) return Promise.resolve(window[globalKey]);
    return fetch(filename).then(r => r.json());
  }

  function bootstrap(){
    loadJson('__SCORM_THEME__', 'theme.json').then(t => { theme = t; applyTheme(t); }).catch(() => {});
    loadJson('__SCORM_TASKS__', 'tasks.json').then(cfg => {
      courseConfig = cfg;
      document.title = cfg.courseTitle || 'SCORM Lerneinheit';
      document.getElementById('courseTitle').textContent = cfg.courseTitle || '';
      document.getElementById('courseSubtitle').textContent = cfg.courseSubtitle || '';
      cfg.tasks.forEach(() => taskScores.push(null));
      buildNav();
      try { window.Scorm12 && Scorm12.init(); } catch(e) {}
      if(cfg.tasks.length > 0) showPage(0);
    }).catch(err => {
      document.getElementById('taskContainer').innerHTML = '<section class="hero-card"><div><h2>Konfiguration nicht ladbar</h2><pre>' + escapeHtml(String(err)) + '</pre></div></section>';
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
})();
