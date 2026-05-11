(function(){
  'use strict';

  // ---- Block utilities loaded from utils.js, exposed to block modules via api.utils ----
  const utils = window.BlockUtils;
  if(!utils) throw new Error('runtime.js: window.BlockUtils not loaded. Make sure utils.js is loaded before runtime.js.');

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
    'heading':           {w: 900, h: 72},
    'rich-text':         {w: 900, h: 160},
    'note-box':          {w: 900, h: 160},
    'image':             {w: 500, h: 380},
    'divider':           {w: 900, h: 24},
    'code':              {w: 800, h: 280},
    'multiple-choice':   {w: 600, h: 520},
    'numeric-input':     {w: 600, h: 380},
    'text-input':        {w: 600, h: 340},
    'cloze':             {w: 900, h: 320},
    'match-pairs':       {w: 900, h: 540},
    'sort-list':         {w: 700, h: 420},
    'complex-question':  {w: 1080, h: 720},
    'function-question': {w: 1080, h: 640},
    'vector-question':   {w: 1080, h: 720},
    'number-base':       {w: 700, h: 360},
    'truth-table':       {w: 700, h: 520},
    'function-sandbox':  {w: 1080, h: 580}
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
      try {
        slot.blockInstances.push(def.mount(cell, block.config || {}, blockApi) || {});
        // Render LaTeX inside this block, if KaTeX is loaded.
        utils.renderMath(cell);
      } catch(err){
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
    container.innerHTML = '<section class="hero-card"><div><h2>Test beendet</h2><p>Erreichte Punktzahl: <strong>' + (Math.round(pts*100)/100) + ' / ' + max + '</strong> (' + Math.round(ratio*100) + '%)</p><p>' + (passed ? '<strong style="color:var(--accent-dark)">Bestanden.</strong>' : '<strong style="color:var(--danger)">Nicht bestanden.</strong>') + '</p><p>Sie können dieses Fenster jetzt schließen und zum Kurs zurückkehren.</p></div></section>';
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
