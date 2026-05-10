(function(){
  'use strict';

  // ---- Built-in helper utilities exposed to block modules via api.utils ----
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
      } catch(e) { return null; }
    },
    nearlyEqual(a, b, tol){ return Math.abs(a - b) <= (tol == null ? 0.05 : tol); },
    normalizeAngle(phi){
      let x = phi;
      while(x <= -Math.PI) x += 2 * Math.PI;
      while(x > Math.PI) x -= 2 * Math.PI;
      return utils.sanitizeZero(x, 1e-9);
    },
    angleEqual(a, b, tol){ return Math.abs(utils.normalizeAngle(a - b)) <= (tol == null ? 0.06 : tol); },
    safeMathExpr(expr, vars){
      const allowedFns = ['sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','exp','log','log2','log10','sqrt','abs','floor','ceil','round','pow','min','max','sign'];
      let s = String(expr || '').replace(/\s+/g, '').replace(/,/g, '.');
      if(!s) return null;
      s = s.replace(/\^/g, '**');
      const varNames = Object.keys(vars || {});
      const tokens = s.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
      for(const t of tokens){
        if(!(allowedFns.includes(t) || varNames.includes(t) || t === 'pi' || t === 'e' || t === 'PI' || t === 'E')) return null;
      }
      let body = s.replace(/\bpi\b/g, '(Math.PI)').replace(/\bPI\b/g, '(Math.PI)')
                  .replace(/\be\b/g, '(Math.E)').replace(/\bE\b/g, '(Math.E)');
      allowedFns.forEach(fn => { body = body.replace(new RegExp('\\b' + fn + '\\b', 'g'), 'Math.' + fn); });
      try {
        const fn = new Function(...varNames, '"use strict"; return (' + body + ');');
        const r = fn(...varNames.map(v => vars[v]));
        return Number.isFinite(r) ? r : null;
      } catch(e) { return null; }
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

  utils.renderPlane = function(host, options){
    const opts = Object.assign({
      width: 640, height: 640, pad: 54,
      xMin: -5.5, xMax: 5.5, yMin: -5.5, yMax: 5.5,
      xLabel: 'x', yLabel: 'y',
      showGrid: true, gridStep: 1,
      paths: [], lines: [], circles: [], points: [], arcs: []
    }, options || {});
    const W = opts.width, H = opts.height, P = opts.pad;
    const sx = (x) => P + ((x - opts.xMin)/(opts.xMax - opts.xMin)) * (W - 2*P);
    const sy = (y) => H - P - ((y - opts.yMin)/(opts.yMax - opts.yMin)) * (H - 2*P);
    host.innerHTML = '';
    const svg = utils.svg('svg', {viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%'});
    svg.appendChild(utils.svg('rect', {x:0, y:0, width:W, height:H, fill:'#ffffff'}));
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
    svg.appendChild(utils.svg('line', {x1:P, y1:sy(0), x2:W-P, y2:sy(0), stroke:'#003b5c', 'stroke-width':2}));
    svg.appendChild(utils.svg('line', {x1:sx(0), y1:P, x2:sx(0), y2:H-P, stroke:'#003b5c', 'stroke-width':2}));
    const xl = utils.svg('text', {x:W-P+6, y:sy(0)-8, 'font-size':16, fill:'#003b5c'}); xl.textContent = opts.xLabel; svg.appendChild(xl);
    const yl = utils.svg('text', {x:sx(0)+10, y:P+16, 'font-size':16, fill:'#003b5c'}); yl.textContent = opts.yLabel; svg.appendChild(yl);
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
  // perTask[i] = { blockScores: { blockId: {points, max, completed} }, blockInstances: [] }
  const perTask = [];

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

  // Default canvas size + per-block default sizes
  const CANVAS_WIDTH = 1100;
  const BLOCK_DEFAULT_SIZES = {
    'heading':           {w: 900, h: 56},
    'rich-text':         {w: 900, h: 140},
    'note-box':          {w: 900, h: 140},
    'image':             {w: 500, h: 360},
    'divider':           {w: 900, h: 24},
    'code':              {w: 800, h: 260},
    'multiple-choice':   {w: 600, h: 320},
    'numeric-input':     {w: 600, h: 280},
    'text-input':        {w: 600, h: 220},
    'cloze':             {w: 900, h: 220},
    'match-pairs':       {w: 900, h: 460},
    'sort-list':         {w: 700, h: 360},
    'complex-question':  {w: 1080, h: 660},
    'function-question': {w: 1080, h: 580},
    'vector-question':   {w: 1080, h: 660},
    'number-base':       {w: 700, h: 280},
    'truth-table':       {w: 700, h: 460},
    'function-sandbox':  {w: 1080, h: 540}
  };
  function defaultSize(type){ return BLOCK_DEFAULT_SIZES[type] || {w: 500, h: 200}; }
  function ensurePositions(blocks){
    let stackY = 20;
    blocks.forEach(b => {
      if(!b.pos){
        const sz = defaultSize(b.type);
        b.pos = { x: 20, y: stackY, w: sz.w, h: sz.h };
        stackY += sz.h + 16;
      }
    });
  }

  function migrateLegacyTask(task){
    // Backward compat: old monolithic task types that now live as blocks
    if(task.blocks){
      ensurePositions(task.blocks);
      return task;
    }
    const legacyMap = {
      'complex-numbers': 'complex-question',
      'function-plot':   'function-question',
      'vector-2d':       'vector-question'
    };
    const blockType = legacyMap[task.type] || task.type;
    const blocks = [];
    if(task.config && task.config.intro){
      blocks.push({id: 'b_legacy_intro_' + Math.random().toString(36).slice(2,7), type: 'rich-text', config: { html: '<p>' + task.config.intro + '</p>' }});
    }
    if(task.config && task.config.noteHtml){
      blocks.push({id: 'b_legacy_note_' + Math.random().toString(36).slice(2,7), type: 'note-box', config: { title: task.config.noteTitle || 'Hinweis', html: task.config.noteHtml, variant: 'info' }});
    }
    const cleanCfg = Object.assign({}, task.config || {});
    delete cleanCfg.intro; delete cleanCfg.noteTitle; delete cleanCfg.noteHtml;
    blocks.push({id: 'b_legacy_main_' + Math.random().toString(36).slice(2,7), type: blockType, config: cleanCfg});
    ensurePositions(blocks);
    return { id: task.id, title: task.title, blocks };
  }

  function totalScore(){
    let pts = 0, max = 0;
    perTask.forEach(t => {
      if(!t || !t.blockScores) return;
      Object.values(t.blockScores).forEach(s => { pts += s.points; max += s.max; });
    });
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
    pill.textContent = 'Punkte: ' + (Math.round(pts*100)/100) + ' / ' + max;
  }

  function isTaskDone(idx){
    const t = perTask[idx];
    if(!t || !t.blockScores) return false;
    const blocks = courseConfig.tasks[idx].blocks || [];
    const graded = blocks.filter(b => {
      const def = window.Blocks.get(b.type);
      return def && def.graded;
    });
    if(graded.length === 0) return true; // content-only tasks count as done after view
    return graded.every(b => {
      const s = t.blockScores[b.id];
      return s && s.points >= s.max && s.max > 0;
    });
  }

  function updateNavStates(){
    document.querySelectorAll('#topNav .nav-link').forEach((btn, i) => {
      btn.classList.toggle('active', i === currentPageIdx);
      btn.classList.toggle('done', isTaskDone(i));
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

  function tearDownTask(idx){
    const t = perTask[idx];
    if(t && t.blockInstances){
      t.blockInstances.forEach(inst => { try { inst && inst.destroy && inst.destroy(); } catch(e) {} });
      t.blockInstances = [];
    }
  }

  function showPage(idx){
    if(idx < 0 || idx >= courseConfig.tasks.length) return;
    if(currentPageIdx >= 0) tearDownTask(currentPageIdx);
    currentPageIdx = idx;
    const task = courseConfig.tasks[idx];
    const container = document.getElementById('taskContainer');
    container.innerHTML = '';

    const page = document.createElement('div');
    page.className = 'task-page';
    container.appendChild(page);

    if(task.title){
      const h = document.createElement('h2'); h.className='task-page-title';
      h.textContent = task.title;
      page.appendChild(h);
    }

    // Canvas: blocks are absolutely positioned per their pos.{x,y,w,h}
    const canvas = document.createElement('div');
    canvas.className = 'task-canvas';
    canvas.style.width = CANVAS_WIDTH + 'px';
    page.appendChild(canvas);

    const slot = perTask[idx] = perTask[idx] || { blockScores: {}, blockInstances: [] };
    slot.blockInstances = [];

    let maxBottom = 200;
    (task.blocks || []).forEach((block, bIdx) => {
      const def = window.Blocks.get(block.type);
      const cell = document.createElement('div');
      cell.className = 'canvas-block';
      cell.dataset.blockId = block.id;
      const pos = block.pos || (function(){
        const sz = defaultSize(block.type);
        return {x: 20, y: 20 + bIdx * (sz.h + 16), w: sz.w, h: sz.h};
      })();
      cell.style.left = pos.x + 'px';
      cell.style.top  = pos.y + 'px';
      cell.style.width  = pos.w + 'px';
      cell.style.height = pos.h + 'px';
      canvas.appendChild(cell);
      if(pos.y + pos.h + 80 > maxBottom) maxBottom = pos.y + pos.h + 80;

      if(!def){
        cell.innerHTML = '<div class="block-error">Unbekannter Block-Typ: <code>' + escapeHtml(block.type) + '</code></div>';
        return;
      }
      const blockApi = {
        utils,
        blockId: 'bl_' + idx + '_' + bIdx + '_' + (block.id || bIdx).toString().replace(/[^A-Za-z0-9_]/g, ''),
        initScore(max){
          const existing = slot.blockScores[block.id];
          if(!existing) slot.blockScores[block.id] = {points: 0, max: Math.max(1, max), completed: false};
          else slot.blockScores[block.id] = {points: existing.points, max: Math.max(1, max), completed: existing.completed};
          pushScoreToLMS(false); updateScorePill(); updateNavStates();
        },
        reportScore(points, max){
          const existing = slot.blockScores[block.id];
          const m = max != null ? Math.max(1, max) : (existing ? existing.max : 1);
          slot.blockScores[block.id] = {points: Math.max(0, Math.min(points, m)), max: m, completed: true};
          pushScoreToLMS(false); updateScorePill(); updateNavStates();
        }
      };
      try { slot.blockInstances.push(def.mount(cell, block.config || {}, blockApi) || {}); }
      catch(err){
        console.error('Block ' + block.type + ' mount error:', err);
        cell.innerHTML = '<div class="block-error">Fehler beim Block <code>' + escapeHtml(block.type) + '</code>: ' + escapeHtml(String(err)) + '</div>';
      }
    });
    canvas.style.height = maxBottom + 'px';

    // Footer navigation
    const foot = document.createElement('footer'); foot.className = 'task-page-foot';
    if(idx > 0){
      const prev = document.createElement('button'); prev.type='button'; prev.className='btn btn-secondary'; prev.textContent='← Zurück';
      prev.addEventListener('click', () => showPage(idx - 1));
      foot.appendChild(prev);
    }
    const spacer = document.createElement('span'); spacer.style.flex='1'; foot.appendChild(spacer);
    if(idx + 1 < courseConfig.tasks.length){
      const next = document.createElement('button'); next.type='button'; next.className='btn btn-primary'; next.textContent='Weiter →';
      next.addEventListener('click', () => showPage(idx + 1));
      foot.appendChild(next);
    } else {
      const finish = document.createElement('button'); finish.type='button'; finish.className='btn btn-primary'; finish.textContent='Test beenden';
      finish.addEventListener('click', () => finishCourse());
      foot.appendChild(finish);
    }
    page.appendChild(foot);

    updateNavStates();
    updateScorePill();
    window.scrollTo(0, 0);
  }

  function finishCourse(){
    pushScoreToLMS(true);
    try { Scorm12.finish(); } catch(e) {}
    const container = document.getElementById('taskContainer');
    const {pts, max} = totalScore();
    const threshold = (courseConfig.passThreshold == null) ? 0.5 : courseConfig.passThreshold;
    const ratio = max > 0 ? pts / max : 0;
    const passed = ratio >= threshold;
    container.innerHTML = '<section class="hero-card"><div><h2>Test beendet</h2><p>Erreichte Punktzahl: <strong>' + (Math.round(pts*100)/100) + ' / ' + max + '</strong> (' + Math.round(ratio*100) + '%)</p><p>' + (passed ? '<strong style="color:var(--accent-dark)">Bestanden.</strong>' : '<strong style="color:var(--danger)">Nicht bestanden.</strong>') + '</p><p>Du kannst dieses Fenster jetzt schließen und zum Kurs zurückkehren.</p></div></section>';
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  window.ScormRuntime = { finishCourse, totalScore, getCourseConfig: () => courseConfig };

  function loadJson(globalKey, filename){
    if(window[globalKey]) return Promise.resolve(window[globalKey]);
    return fetch(filename).then(r => r.json());
  }

  function bootstrap(){
    loadJson('__SCORM_THEME__', 'theme.json').then(t => { theme = t; applyTheme(t); }).catch(() => {});
    loadJson('__SCORM_TASKS__', 'tasks.json').then(cfg => {
      // Migrate legacy tasks (old monolithic task type) into block-based form
      cfg.tasks = (cfg.tasks || []).map(migrateLegacyTask);
      courseConfig = cfg;
      document.title = cfg.courseTitle || 'SCORM Lerneinheit';
      document.getElementById('courseTitle').textContent = cfg.courseTitle || '';
      document.getElementById('courseSubtitle').textContent = cfg.courseSubtitle || '';
      cfg.tasks.forEach(() => perTask.push({blockScores: {}, blockInstances: []}));
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
