// runtime.js: SCORM-1.2 player. Reads the course data embedded in index.html
// (tasks.json/theme.json only as a fallback), builds the nav, renders blocks
// on an absolute-positioned, scaled canvas and pushes scores to the LMS.
// Also: saved progress/resume, global variables, task pools, attempts /
// hint / worked solution, timers. Overview in ARCHITECTURE.md ("Runtime-Ablauf").
// Default sizes duplicate canvas.js because the runtime ships standalone.
(function(){
  'use strict';

  const utils = window.BlockUtils;
  if(!utils) throw new Error('runtime.js: window.BlockUtils not loaded. Make sure utils.js is loaded before runtime.js.');

  let courseConfig = null;
  let currentPageIdx = -1;
  // perTask[i] = { blockScores: { blockId: {points, max, completed} }, blockInstances: [] }
  const perTask = [];
  // Rendered pages keyed "taskIdx:tabIdx". Pages are kept alive (detached,
  // not destroyed) when switching tasks/tabs, so randomized values, inputs
  // and feedback survive navigation; only "Neu generieren" draws new values.
  const pageCache = {};

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

  // Canvas scaling: the authored layout is CANVAS_WIDTH px wide; it is scaled
  // (CSS transform, so block pointer math via getBoundingClientRect stays
  // correct) to fill the page width. Below MIN the canvas scrolls sideways
  // instead of becoming unreadable; MAX keeps blocks from getting huge.
  const CANVAS_MIN_SCALE = 0.6;
  const CANVAS_MAX_SCALE = 2.0;
  // Flicker guards: the scaled height decides whether the page gets a
  // vertical scrollbar, and the scrollbar changes the width the scale is
  // computed from, so near that threshold the layout could flip back and
  // forth every frame. Hence: whole-pixel sizes (a fraction of a pixel too
  // wide must not show a horizontal scrollbar), sideways scrolling only
  // below the minimum scale, and growing back by about a scrollbar's width
  // right after a shrink is ignored (styles.css also reserves the
  // scrollbar's space via scrollbar-gutter).
  const SCROLLBAR_SLACK = 24;
  function fitCanvas(frame){
    const canvas = frame.querySelector('.task-canvas');
    const scroller = frame.parentElement;
    if(!canvas || !scroller || !scroller.isConnected) return;
    const avail = Math.floor(scroller.clientWidth);
    if(!avail) return;
    const s = Math.max(CANVAS_MIN_SCALE, Math.min(CANVAS_MAX_SCALE, avail / CANVAS_WIDTH));
    const w = Math.min(Math.floor(CANVAS_WIDTH * s), Math.max(avail, Math.ceil(CANVAS_WIDTH * CANVAS_MIN_SCALE)));
    const prevW = parseFloat(frame.style.width) || 0;
    const now = Date.now();
    if(prevW && w > prevW && w - prevW <= SCROLLBAR_SLACK && now - (frame._fitShrinkAt || 0) < 1000) return;
    if(prevW && w < prevW) frame._fitShrinkAt = now;
    const scale = w / CANVAS_WIDTH;
    const h = parseFloat(canvas.style.height) || 0;
    canvas.style.transform = 'scale(' + scale + ')';
    frame.style.width  = w + 'px';
    frame.style.height = Math.ceil(h * scale) + 'px';
    scroller.style.overflowX = w > avail ? 'auto' : 'hidden';
  }
  function fitAllCanvases(){
    document.querySelectorAll('#taskContainer .task-canvas-frame').forEach(fitCanvas);
  }
  let _fitRaf = 0;
  function scheduleFit(){
    if(_fitRaf) return;
    _fitRaf = requestAnimationFrame(() => { _fitRaf = 0; fitAllCanvases(); });
  }
  window.addEventListener('resize', scheduleFit);
  // Also catches width changes without a window resize (e.g. a scrollbar
  // appearing once a tall page is shown).
  if(typeof ResizeObserver === 'function'){
    const watchContainer = () => {
      const c = document.getElementById('taskContainer');
      if(c) new ResizeObserver(scheduleFit).observe(c);
    };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchContainer);
    else watchContainer();
  }
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
    if(task.tabs && Array.isArray(task.tabs)){
      task.tabs.forEach(t => { ensurePositions(t.blocks = t.blocks || []); });
      return task;
    }
    if(task.blocks){
      ensurePositions(task.blocks);
      return task;
    }
    // Legacy monolithic task types collapse onto a single block.
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
      blocks.push({id: 'b_legacy_note_' + Math.random().toString(36).slice(2,7), type: 'note-box', config: { title: task.config.noteTitle || utils.t('runtime.legacyNoteTitle'), html: task.config.noteHtml, variant: 'info' }});
    }
    const cleanCfg = Object.assign({}, task.config || {});
    delete cleanCfg.intro; delete cleanCfg.noteTitle; delete cleanCfg.noteHtml;
    blocks.push({id: 'b_legacy_main_' + Math.random().toString(36).slice(2,7), type: blockType, config: cleanCfg});
    ensurePositions(blocks);
    return { id: task.id, title: task.title, blocks };
  }

  // Max points from block configs alone, so the score pill is correct before mount().
  function computeMaxPoints(task){
    if(!task) return 0;
    const blocks = getAllTaskBlocks(task);
    let max = 0;
    blocks.forEach(b => {
      const def = window.Blocks && window.Blocks.get(b.type);
      if(def && def.graded){
        // Blocks whose max is not just config.maxPoints (e.g. composition with
        // Ja/Nein fields) expose maxPointsFor(config).
        const mp = typeof def.maxPointsFor === 'function'
          ? Number(def.maxPointsFor(b.config || {}))
          : Number(b.config && b.config.maxPoints);
        max += Math.max(1, isNaN(mp) ? 1 : mp);
      }
    });
    return max;
  }
  function totalScore(){
    let pts = 0, max = 0;
    perTask.forEach(t => {
      if(!t || !t.blockScores) return;
      Object.values(t.blockScores).forEach(s => { pts += s.points; });
    });
    courseConfig.tasks.forEach(task => { max += computeMaxPoints(task); });
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
    if(!final) writeProgress();
    Scorm12.commit();
  }

  // ---- Saved progress + time spent ----------------------------------------
  // While the course is open, progress is kept in cmi.suspend_data with
  // cmi.core.exit = "suspend", so the LMS resumes the attempt next launch.
  // Saved: current task + tabs, locale, per-block scores, random seeds and
  // "Neu generieren" history (same values come back), locks, timer states,
  // attempts / hint / solution state, global-variable and pool seeds, and
  // typed answers (form controls; solved blocks only a marker, they refill
  // their solution via showSolution()). Not saved: drag-and-drop states.
  // Time spent goes to cmi.core.session_time when the session ends.
  const sessionStart = Date.now();
  const SUSPEND_LIMIT = 4096; // SCORM 1.2 max length of cmi.suspend_data
  let saveTimer = null;
  let sessionClosed = false;
  function fmtSessionTime(ms){
    const total = Math.floor(ms / 1000);
    const h = Math.min(9999, Math.floor(total / 3600));
    const m = Math.floor((total % 3600) / 60), s = total % 60;
    const p = n => (n < 10 ? '0' : '') + n;
    return p(h) + ':' + p(m) + ':' + p(s);
  }
  function buildSuspendData(){
    captureRegenLocks();
    const tabs = {};
    courseConfig.tasks.forEach((t, i) => { if(t._activeTab) tabs[i] = t._activeTab; });
    const scores = perTask.map(t => {
      const o = {};
      Object.keys((t && t.blockScores) || {}).forEach(id => {
        const s = t.blockScores[id];
        o[id] = [Math.round(s.points * 100) / 100, s.max, s.completed ? 1 : 0, s.solved ? 1 : 0];
      });
      return o;
    });
    // r[key] = [seed (base36), regenClicks, locked, flags, timeLeft, attempts, fails]
    // flags: 1 = answers locked, 2 = block timer expired, 4 = hint opened,
    // 8 = worked solution opened
    const rng = {};
    Object.keys(blockRng).forEach(k => {
      const st = blockRng[k];
      rng[k] = [st.seed.toString(36), st.regenClicks, st.locked,
        (st.answersLocked ? 1 : 0) | (st.timerExpired ? 2 : 0) | (st.hintUsed ? 4 : 0) | (st.solutionShown ? 8 : 0),
        st.timeLeft == null ? null : st.timeLeft, st.attempts || 0, st.fails || 0];
    });
    captureAllInputs();
    const data = { v: 1, p: Math.max(0, currentPageIdx), l: utils.getLocale ? utils.getLocale() : null,
      t: tabs, c: courseTimeLeft, s: scores, r: rng };
    if(globalSeed != null) data.g = globalSeed.toString(36);
    if(poolSeed != null) data.pl = poolSeed.toString(36);
    if(Object.keys(inputsStore).length) data.i = Object.assign({}, inputsStore);
    let json = JSON.stringify(data);
    // Over the SCORM limit: drop typed answers of unsolved blocks first
    // (solved blocks only need their 1-marker), then the regenerate
    // history (values fall back to the first generated task), then the
    // random state entirely.
    if(json.length > SUSPEND_LIMIT && data.i){
      Object.keys(data.i).forEach(k => { if(data.i[k] !== 1) delete data.i[k]; });
      json = JSON.stringify(data);
    }
    if(json.length > SUSPEND_LIMIT){
      Object.keys(rng).forEach(k => { rng[k][1] = []; });
      json = JSON.stringify(data);
    }
    if(json.length > SUSPEND_LIMIT){
      delete data.r;
      delete data.i;
      json = JSON.stringify(data);
    }
    return json.length > SUSPEND_LIMIT ? null : json;
  }
  function writeProgress(){
    if(!window.Scorm12 || !Scorm12.initialized || courseFinished) return;
    const json = buildSuspendData();
    if(json != null) Scorm12.set('cmi.suspend_data', json);
    Scorm12.set('cmi.core.lesson_location', String(Math.max(0, currentPageIdx)));
    Scorm12.set('cmi.core.exit', 'suspend');
  }
  // Debounced save for navigation, regenerations and timer progress.
  function scheduleSave(){
    if(saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      if(!window.Scorm12 || !Scorm12.initialized || courseFinished) return;
      writeProgress();
      Scorm12.commit();
    }, 1500);
  }
  // The saved state without applying it (the task-pool seed must be known
  // before tasks are indexed). null for a new attempt.
  function peekSuspendData(){
    if(!window.Scorm12 || !Scorm12.initialized) return null;
    if(Scorm12.get('cmi.core.entry') === 'ab-initio') return null;
    try { const d = JSON.parse(Scorm12.get('cmi.suspend_data') || ''); return d && d.v === 1 ? d : null; }
    catch { return null; }
  }

  // ---- Task pools ------------------------------------------------------------
  // course.pools = [{ id, name, draw }], task.pool = pool id. Per attempt,
  // `draw` tasks are picked from each pool (own seed, saved in suspend_data,
  // so a resume shows the same selection; empty = all). Tasks without a
  // pool are always part of the course; the original order is kept.
  let poolSeed = null;
  function applyPools(cfg){
    const pools = (Array.isArray(cfg.pools) ? cfg.pools : []).filter(pl => pl && pl.id);
    if(!pools.length || !cfg.tasks.some(t => t.pool)) return;
    if(poolSeed == null) poolSeed = Math.floor(Math.random() * 4294967296);
    const rng = seededRandom(poolSeed);
    const keep = new Set();
    pools.forEach(pl => {
      const members = [];
      cfg.tasks.forEach((t, i) => { if(t.pool === pl.id) members.push(i); });
      const want = Math.floor(Number(pl.draw));
      const n = pl.draw === '' || pl.draw == null || !Number.isFinite(want) || want <= 0 ? members.length : Math.min(members.length, want);
      for(let i = members.length - 1; i > 0; i--){
        const j = Math.floor(rng() * (i + 1));
        const tmp = members[i]; members[i] = members[j]; members[j] = tmp;
      }
      members.slice(0, n).forEach(i => keep.add(i));
    });
    const known = new Set(pools.map(pl => pl.id));
    cfg.tasks = cfg.tasks.filter((t, i) => !t.pool || !known.has(t.pool) || keep.has(i));
  }

  // Restore a suspended attempt. Must run after the LMS init and before the
  // first page renders (blocks pick up blockRng/scores while mounting).
  function restoreProgress(){
    if(!window.Scorm12 || !Scorm12.initialized) return false;
    if(Scorm12.get('cmi.core.entry') === 'ab-initio') return false;
    const raw = Scorm12.get('cmi.suspend_data');
    if(!raw) return false;
    let d;
    try { d = JSON.parse(raw); } catch { return false; }
    if(!d || d.v !== 1) return false;
    if(d.l && utils.setLocale) utils.setLocale(d.l);
    Object.keys(d.t || {}).forEach(i => {
      const task = courseConfig.tasks[i];
      if(task && task.tabs && d.t[i] < task.tabs.length) task._activeTab = d.t[i];
    });
    (d.s || []).forEach((o, i) => {
      if(!perTask[i]) return;
      Object.keys(o || {}).forEach(id => {
        const a = o[id];
        perTask[i].blockScores[id] = { points: a[0], max: a[1], completed: !!a[2], solved: !!a[3] };
      });
    });
    Object.keys(d.r || {}).forEach(k => {
      const a = d.r[k];
      blockRng[k] = { seed: parseInt(a[0], 36), regenClicks: a[1] || [], locked: a[2] || [],
        answersLocked: !!(a[3] & 1), timerExpired: !!(a[3] & 2), timeLeft: a[4] == null ? null : a[4],
        hintUsed: !!(a[3] & 4), solutionShown: !!(a[3] & 8), attempts: a[5] || 0, fails: a[6] || 0 };
    });
    Object.assign(inputsStore, d.i || {});
    if(typeof d.c === 'number' && courseTimeLeft != null) courseTimeLeft = Math.max(1, d.c);
    if(d.g && globalUsers.length) globalSeed = parseInt(d.g, 36) >>> 0;
    return { page: Math.min(Math.max(0, d.p | 0), courseConfig.tasks.length - 1) };
  }
  // Leaving without finishing: save, report the time spent, close the session.
  function suspendSession(){
    if(sessionClosed || !window.Scorm12 || !Scorm12.initialized) return;
    sessionClosed = true;
    writeProgress();
    Scorm12.set('cmi.core.session_time', fmtSessionTime(Date.now() - sessionStart));
    Scorm12.commit();
    Scorm12.finish();
  }
  window.addEventListener('pagehide', suspendSession);
  window.addEventListener('beforeunload', suspendSession);

  function isTaskDone(idx){
    const blocks = getAllTaskBlocks(courseConfig.tasks[idx]);
    const graded = blocks.filter(b => {
      const def = window.Blocks.get(b.type);
      return def && def.graded;
    });
    // Content-only tasks count as done immediately.
    if(graded.length === 0) return true;
    const t = perTask[idx];
    if(!t || !t.blockScores) return false;
    return graded.every(b => {
      const s = t.blockScores[b.id];
      return s && s.max > 0 && (s.points >= s.max || s.solved);
    });
  }

  function updateNavStates(){
    document.querySelectorAll('#topNav .nav-link').forEach((btn, i) => {
      btn.classList.toggle('active', i === currentPageIdx);
      btn.classList.toggle('done', isTaskDone(i));
    });
    updateProgressBar();
    updateGlobalRegenButton();
  }

  function updateProgressBar(){
    const fill = document.getElementById('progressBarFill');
    const text = document.getElementById('progressBarText');
    if(!fill || !text || !courseConfig) return;
    const total = courseConfig.tasks.length;
    if(total === 0){ fill.style.width = '0%'; text.textContent = ''; return; }
    let done = 0;
    for(let i = 0; i < total; i++) if(isTaskDone(i)) done++;
    const pct = Math.round((done / total) * 100);
    fill.style.width = pct + '%';
    const current = currentPageIdx >= 0 ? currentPageIdx + 1 : 1;
    text.innerHTML = '<strong>' + escapeHtml(utils.t('progress.taskLabel', {current: current, total: total})) + '</strong> · ' +
      escapeHtml(utils.t('progress.doneSuffix', {done: done, pct: pct}));
  }

  function buildNav(){
    const nav = document.getElementById('topNav');
    nav.innerHTML = '';
    courseConfig.tasks.forEach((task, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-link';
      btn.textContent = utils.l(task.title) || utils.t('taskList.fallbackTitle', {n: i+1});
      btn.addEventListener('click', () => showPage(i));
      nav.appendChild(btn);
    });
    // Course timer: centered on the header's bottom edge. Created once;
    // buildNav also runs on locale switches.
    if(courseTimeLeft != null && !document.getElementById('courseTimer')){
      const header = document.querySelector('.scorm-header');
      if(header){
        const timer = document.createElement('div');
        timer.className = 'course-timer';
        timer.id = 'courseTimer';
        header.appendChild(timer);
        header.classList.add('has-course-timer');
      }
    }
    renderCourseTimer();
  }

  // ---- Timers -------------------------------------------------------------
  // Course timer: one countdown across all tasks; at 0 the course is finished.
  // Block timers: run only while their page (task + tab) is shown, so they
  // pause on task/tab switches; at 0 the block's answers are locked.
  // pageTimers[cacheKey] = [{ cell, st, badge }]; remaining time lives in st.
  let courseTimeLeft = null;
  let courseFinished = false;
  let courseTimedOut = false;
  let currentCacheKey = null;
  let tickHandle = null;
  const pageTimers = {};
  function timerSeconds(minutes, seconds){
    const total = Math.floor((Number(minutes) || 0) * 60 + (Number(seconds) || 0));
    return total > 0 ? total : 0;
  }
  function fmtTime(s){
    const m = Math.floor(s / 60), sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }
  function renderCourseTimer(){
    const elT = document.getElementById('courseTimer');
    if(!elT || courseTimeLeft == null) return;
    elT.textContent = '⏱ ' + utils.t('runtime.timer.courseLabel', { time: fmtTime(courseTimeLeft) });
    elT.classList.toggle('timer-low', courseTimeLeft <= 60);
  }
  function renderBlockTimer(entry){
    const { st, badge } = entry;
    badge.textContent = st.timerExpired
      ? '⏱ ' + utils.t('runtime.timer.blockExpired')
      : '⏱ ' + utils.t('runtime.timer.blockLabel', { time: fmtTime(st.timeLeft) });
    badge.classList.toggle('timer-low', !st.timerExpired && st.timeLeft <= 30);
    badge.classList.toggle('timer-expired', !!st.timerExpired);
  }
  function expireBlockTimer(entry){
    entry.st.timerExpired = true;
    lockAnswers(entry.cell, entry.st, true);
    renderBlockTimer(entry);
  }
  function tick(){
    if(courseFinished) return;
    (pageTimers[currentCacheKey] || []).forEach(entry => {
      if(entry.st.timerExpired || !entry.cell.isConnected) return;
      entry.st.timeLeft = Math.max(0, entry.st.timeLeft - 1);
      if(entry.st.timeLeft === 0) expireBlockTimer(entry);
      else renderBlockTimer(entry);
    });
    if(courseTimeLeft != null){
      courseTimeLeft = Math.max(0, courseTimeLeft - 1);
      renderCourseTimer();
      if(courseTimeLeft === 0){ finishCourse(true); return; }
    }
    // Persist remaining times now and then, so a resume loses at most ~15 s.
    if(++tickCount % 15 === 0) scheduleSave();
  }
  let tickCount = 0;
  function ensureTicking(){
    if(!tickHandle) tickHandle = setInterval(tick, 1000);
  }

  function tearDownTask(idx){
    const t = perTask[idx];
    if(t && t.blockInstances){
      t.blockInstances.forEach(inst => { try { inst && inst.destroy && inst.destroy(); } catch {} });
      t.blockInstances = [];
    }
  }
  // Drop every cached page (e.g. after a locale switch, where block content
  // must be re-rendered in the new language). Locked "Neu generieren"
  // buttons are remembered so the rebuilt blocks stay locked.
  // Record which "Neu generieren" buttons are disabled (index among the
  // cell's buttons) for every rendered block, so a rebuild or a resumed
  // session can disable them again.
  function captureRegenLocks(){
    Object.keys(pageCache).forEach(k => {
      pageCache[k].querySelectorAll('.canvas-block[data-rng-key]').forEach(cell => {
        const st = blockRng[cell.dataset.rngKey];
        if(!st) return;
        st.locked = [];
        cellButtons(cell).forEach((btn, i) => {
          // Buttons locked by an expired block timer are restored by the timer.
          if(btn.dataset.regen && btn.disabled && !btn.dataset.answerLock) st.locked.push(i);
        });
      });
    });
  }
  function clearPageCache(){
    captureRegenLocks();
    captureAllInputs();
    Object.keys(pageCache).forEach(k => {
      delete pageCache[k];
      delete pageTimers[k];
    });
    perTask.forEach((_, i) => tearDownTask(i));
  }

  // Reproducible randomness per block, so a rebuilt page (after a locale
  // switch) shows the same values as before. Each block gets its own seeded
  // stream that feeds Math.random during mount and during "Neu generieren"
  // clicks; the clicks are logged so a rebuild can replay them in order.
  // blockRng[key] = { seed, rng, regenClicks: [buttonIndex], locked: [buttonIndex],
  //   answersLocked, timeLeft, timerExpired }
  const blockRng = {};
  let regenDispatching = false;
  function seededRandom(seed){
    let a = seed >>> 0;
    return function(){
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function withRandom(rng, fn){
    const orig = Math.random;
    Math.random = rng;
    try { return fn(); } finally { Math.random = orig; }
  }
  function cellButtons(cell){ return Array.from(cell.querySelectorAll('button')); }
  function isRegenButton(btn){ return btn.textContent.trim() === utils.t('common.regenerate'); }
  // Tag regenerate buttons while the label is still in the current locale;
  // clearPageCache runs after a locale switch, when text matching would fail.
  function markRegenButtons(cell){
    cellButtons(cell).forEach(btn => { if(isRegenButton(btn)) btn.dataset.regen = '1'; });
  }
  // Route "Neu generieren" clicks through the block's seeded stream. The
  // original click is stopped and re-dispatched synchronously so Math.random
  // can be swapped for exactly the duration of the block's handlers.
  function attachRegenRecorder(cell, st){
    cell.addEventListener('click', e => {
      if(regenDispatching) return;
      const btn = e.target.closest && e.target.closest('button');
      if(!btn || !cell.contains(btn) || btn.disabled || !isRegenButton(btn)) return;
      e.stopPropagation();
      e.preventDefault();
      st.regenClicks.push(cellButtons(cell).indexOf(btn));
      scheduleSave();
      dispatchRegen(btn, st, cell);
    }, true);
  }
  function dispatchRegen(btn, st, cell){
    regenDispatching = true;
    try { withRandom(st.rng, () => btn.click()); }
    finally { regenDispatching = false; }
    // Some blocks (composition) rebuild their buttons on regenerate.
    markRegenButtons(cell);
    // A new task means a new attempt (unless the block's time is up).
    if(!st.timerExpired) unlockAnswers(cell, st);
  }

  // "Antwort nach Prüfen sperren": once a check reports a score, the block's
  // inputs and buttons are disabled (except "Neu generieren"). Only scores
  // reported while handling a button click / Enter count as a check, so
  // blocks that score live on every interaction (composition click mode)
  // don't lock on the first click.
  function resolveLockAnswers(config){
    const v = config && config.lockAnswers;
    if(v === 'on' || v === true) return true;
    if(v === 'off') return false;
    return !!courseConfig.lockAnswersAfterCheck;
  }
  function attachCheckDetector(cell){
    const mark = () => {
      cell._checkActive = true;
      cell._checkId = (cell._checkId || 0) + 1;
      setTimeout(() => { cell._checkActive = false; }, 0);
    };
    cell.addEventListener('click', e => {
      const btn = e.target.closest && e.target.closest('button');
      if(btn && cell.contains(btn) && !btn.dataset.regen) mark();
    }, true);
    cell.addEventListener('keydown', e => { if(e.key === 'Enter') mark(); }, true);
  }
  // includeRegen: also lock "Neu generieren" (block timer ran out).
  function lockAnswers(cell, st, includeRegen){
    st.answersLocked = true;
    scheduleSave();
    setTimeout(updateGlobalRegenButton, 0);
    cell.classList.add('answers-locked');
    if(includeRegen) cell.classList.add('time-up');
    cell.querySelectorAll('input, select, textarea, button').forEach(n => {
      if((n.dataset.regen && !includeRegen) || n.disabled) return;
      n.disabled = true;
      n.dataset.answerLock = '1';
    });
  }
  function unlockAnswers(cell, st){
    st.answersLocked = false;
    cell.classList.remove('answers-locked');
    cell.querySelectorAll('[data-answer-lock]').forEach(n => {
      n.disabled = false;
      delete n.dataset.answerLock;
    });
  }

  // ---- Global variables ----------------------------------------------------
  // Course-wide variables (course.globalVariables) are drawn once per attempt
  // from their own seed and shared by every block that uses them. The header
  // button "Globale Werte neu generieren" draws a new set and resets every
  // task containing such a block (scores, random values, answer locks;
  // block timers keep running). It is locked once a check happened in one
  // of those tasks when "nach Prüfen sperren" is on, and always while one of
  // their blocks has locked answers, so an answer lock can't be bypassed.
  let globalSeed = null;
  const globalUsers = []; // [{ taskIdx, block }]
  function setupGlobalVars(cfg){
    utils.setGlobalVarDefs(cfg.globalVariables, { decimals: cfg.globalVarDecimals, valueDisplay: cfg.globalVarDisplay });
    if(!utils.globalVarNames().length) return;
    cfg.tasks.forEach((task, ti) => getAllTaskBlocks(task).forEach(block => {
      if(utils.globalVarsUsedBy(block.config || {}).length) globalUsers.push({ taskIdx: ti, block });
    }));
  }
  function globalTaskIdxs(){
    return Array.from(new Set(globalUsers.map(g => g.taskIdx))).sort((a, b) => a - b);
  }
  // The values follow from the seed: candidate sets are drawn until every
  // block using them can still build a valid task (def.acceptsGlobals, e.g.
  // "Nur ganzzahlige Lösungen"); if none fits, the first set is used.
  function applyGlobalSeed(seed){
    globalSeed = seed >>> 0;
    const values = withRandom(seededRandom(globalSeed), () => {
      let first = null;
      for(let i = 0; i < 40; i++){
        const cand = utils.genGlobalVarValues();
        if(!first) first = cand;
        const ok = globalUsers.every(({ block }) => {
          const def = window.Blocks.get(block.type);
          if(!def || typeof def.acceptsGlobals !== 'function') return true;
          try { return def.acceptsGlobals(block.config || {}, cand) !== false; } catch { return true; }
        });
        if(ok) return cand;
      }
      return first;
    });
    utils.setGlobalVarValues(values);
  }
  function globalRegenLocked(){
    const tasks = globalTaskIdxs();
    const checked = courseConfig.globalRegenLockAfterCheck && globalUsers.some(({ taskIdx, block }) => {
      const score = perTask[taskIdx] && perTask[taskIdx].blockScores[block.id];
      return !!(score && score.completed);
    });
    if(checked) return true;
    return Object.keys(blockRng).some(k => blockRng[k].answersLocked && tasks.some(ti => k.startsWith('bl_' + ti + '_')));
  }
  function updateGlobalRegenButton(){
    const btn = document.getElementById('globalRegenBtn');
    if(!btn) return;
    btn.textContent = '↻ ' + utils.t('runtime.globalRegen.button');
    const locked = courseFinished || globalRegenLocked();
    btn.disabled = locked;
    btn.title = locked ? utils.t('runtime.globalRegen.lockedTitle') : utils.t('runtime.globalRegen.title');
  }
  function buildGlobalRegenButton(){
    if(!globalUsers.length || courseConfig.globalRegenButton === false) return;
    if(!document.getElementById('globalRegenBtn')){
      const header = document.querySelector('.scorm-header');
      if(!header) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'globalRegenBtn';
      btn.className = 'global-regen-btn';
      btn.addEventListener('click', confirmGlobalRegen);
      header.appendChild(btn);
      header.classList.add('has-global-regen');
    }
    updateGlobalRegenButton();
  }
  // In-page dialog: window.confirm is blocked in some LMS iframes.
  function confirmGlobalRegen(){
    if(globalRegenLocked() || courseFinished) return;
    const names = globalTaskIdxs().map(i => utils.l(courseConfig.tasks[i].title) || utils.t('taskList.fallbackTitle', { n: i + 1 }));
    const back = document.createElement('div');
    back.className = 'scorm-dialog-backdrop';
    const dlg = document.createElement('div');
    dlg.className = 'scorm-dialog';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    const h = document.createElement('h3');
    h.textContent = utils.t('runtime.globalRegen.confirmTitle');
    const p = document.createElement('p');
    p.textContent = utils.t('runtime.globalRegen.confirmMessage', { n: names.length });
    const ul = document.createElement('ul');
    names.forEach(n => { const li = document.createElement('li'); li.textContent = n; ul.appendChild(li); });
    const row = document.createElement('div');
    row.className = 'scorm-dialog-buttons';
    const cancel = document.createElement('button');
    cancel.type = 'button'; cancel.className = 'btn btn-secondary';
    cancel.textContent = utils.t('runtime.globalRegen.cancel');
    const ok = document.createElement('button');
    ok.type = 'button'; ok.className = 'btn btn-primary';
    ok.textContent = utils.t('runtime.globalRegen.confirm');
    const onKey = e => { if(e.key === 'Escape') close(); };
    const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
    cancel.addEventListener('click', close);
    back.addEventListener('click', e => { if(e.target === back) close(); });
    ok.addEventListener('click', () => { close(); regenerateGlobals(); });
    document.addEventListener('keydown', onKey);
    row.appendChild(cancel); row.appendChild(ok);
    dlg.appendChild(h); dlg.appendChild(p); dlg.appendChild(ul); dlg.appendChild(row);
    back.appendChild(dlg);
    document.body.appendChild(back);
    ok.focus();
  }
  function regenerateGlobals(){
    const tasks = globalTaskIdxs();
    captureRegenLocks();
    tasks.forEach(ti => {
      Object.keys(pageCache).forEach(k => {
        if(k.split(':')[0] === String(ti)){ delete pageCache[k]; delete pageTimers[k]; }
      });
      tearDownTask(ti);
      if(perTask[ti]) perTask[ti].blockScores = {};
      Object.keys(inputsStore).forEach(k => { if(k.startsWith('bl_' + ti + '_')) delete inputsStore[k]; });
      // Fresh random state per block; block timers keep their remaining time.
      Object.keys(blockRng).forEach(k => {
        if(!k.startsWith('bl_' + ti + '_')) return;
        const old = blockRng[k];
        blockRng[k] = { seed: Math.floor(Math.random() * 4294967296), regenClicks: [], locked: [], answersLocked: false,
          timeLeft: old.timeLeft, timerExpired: old.timerExpired };
      });
    });
    applyGlobalSeed(Math.floor(Math.random() * 4294967296));
    pushScoreToLMS(false);
    updateNavStates();
    scheduleSave();
    if(tasks.includes(currentPageIdx)) showPage(currentPageIdx);
    updateGlobalRegenButton();
  }

  // ---- Saved answers (resume) ---------------------------------------------
  // inputsStore[rngKey] = 1 for a solved block that can refill its solution
  // (instance.showSolution, values follow from the restored variables, so
  // nothing else is stored), else the values of the block's form controls
  // in DOM order. Only applied when the block renders the same controls.
  const inputsStore = {};
  function answerControls(cell){
    return Array.from(cell.querySelectorAll('input, select, textarea'));
  }
  function captureInputs(cell){
    const key = cell.dataset.rngKey;
    if(!key || !cell._blockId) return;
    const t = perTask[cell._taskIdx];
    const score = t && t.blockScores[cell._blockId];
    if(score && score.solved && cell._inst && typeof cell._inst.showSolution === 'function'){
      inputsStore[key] = 1;
      return;
    }
    const vals = answerControls(cell).map(n => (n.type === 'checkbox' || n.type === 'radio')
      ? (n.checked ? 1 : 0) : String(n.value || '').slice(0, 200));
    if(vals.some(v => v !== '' && v !== 0)) inputsStore[key] = vals;
    else delete inputsStore[key];
  }
  function captureAllInputs(){
    Object.keys(pageCache).forEach(k => {
      pageCache[k].querySelectorAll('.canvas-block[data-rng-key]').forEach(captureInputs);
    });
  }
  function restoreInputs(cell){
    const saved = inputsStore[cell.dataset.rngKey];
    if(saved == null) return;
    if(saved === 1){
      if(cell._inst && typeof cell._inst.showSolution === 'function') cell._inst.showSolution();
      return;
    }
    const ctrls = answerControls(cell);
    if(!Array.isArray(saved) || saved.length !== ctrls.length) return;
    ctrls.forEach((n, i) => {
      const v = saved[i];
      if(n.type === 'checkbox' || n.type === 'radio'){
        if(!!v !== n.checked){ n.checked = !!v; n.dispatchEvent(new Event('change', { bubbles: true })); }
      } else if(String(v) !== n.value){
        n.value = String(v);
        n.dispatchEvent(new Event('input', { bubbles: true }));
        n.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  // ---- Attempts, hint, worked solution (per graded block) -----------------
  // Block settings: attemptsLimit + maxAttempts (+ attemptPenalty in % per
  // further attempt), hintEnabled + hintText (after hintAfter failed checks,
  // optional hintPenalty points), solutionEnabled + solutionText (after
  // solutionAfter failed checks; empty = once the attempts are used up, or
  // 3 without a limit; solutionWhenCorrect also after a correct answer).
  // Texts are KaTeX-capable and use the block's current variable values.
  // Opening the worked solution locks the answers.
  function helpConfig(cfg){
    const hasText = v => !!String(utils.l(v) || '').trim();
    const num = (v, d) => {
      if(v === '' || v == null) return d;
      const x = Math.floor(Number(v));
      return Number.isFinite(x) && x >= 0 ? x : d;
    };
    const h = {
      attempts: !!cfg.attemptsLimit,
      maxAttempts: Math.max(1, num(cfg.maxAttempts, 3)),
      attemptPenalty: Math.max(0, Math.min(100, Number(cfg.attemptPenalty) || 0)),
      hint: !!cfg.hintEnabled && hasText(cfg.hintText),
      hintAfter: num(cfg.hintAfter, 1),
      hintPenalty: Math.max(0, Number(cfg.hintPenalty) || 0),
      solution: !!cfg.solutionEnabled && hasText(cfg.solutionText),
      solutionAfter: num(cfg.solutionAfter, null),
      solutionWhenCorrect: !!cfg.solutionWhenCorrect
    };
    h.any = h.attempts || h.hint || h.solution;
    return h;
  }
  function attemptsUsedUp(h, st){ return !!h.attempts && (st.attempts || 0) >= h.maxAttempts; }
  function scoreWithHelp(h, st, raw){
    let pts = raw;
    if(h.attempts && h.attemptPenalty > 0 && (st.attempts || 0) > 1){
      pts *= Math.max(0, 1 - h.attemptPenalty / 100 * (st.attempts - 1));
    }
    if(st.hintUsed && h.hintPenalty > 0) pts -= h.hintPenalty;
    return Math.max(0, Math.round(pts * 100) / 100);
  }
  function solutionAvailable(h, st, solved){
    if(st.solutionShown) return true;
    if(solved) return h.solutionWhenCorrect;
    if(h.solutionAfter != null) return (st.fails || 0) >= Math.max(1, h.solutionAfter);
    if(h.attempts) return attemptsUsedUp(h, st);
    return (st.fails || 0) >= 3;
  }
  // entry = { cell, canvas, pos, cfg, st, h, topOffset, isSolved(), rescore() }
  function mountBlockHelp(entry){
    const { canvas, pos, h, st } = entry;
    const bar = document.createElement('div');
    bar.className = 'block-help';
    bar.style.left = (pos.x + pos.w) + 'px';
    bar.style.top  = (pos.y + entry.topOffset) + 'px';
    const chip = document.createElement('span');
    chip.className = 'block-help-attempts';
    const hintBtn = document.createElement('button');
    hintBtn.type = 'button'; hintBtn.className = 'block-help-btn';
    hintBtn.textContent = '💡 ' + utils.t('runtime.help.hintButton');
    hintBtn.addEventListener('click', () => openHelpPanel(entry, 'hint'));
    const solBtn = document.createElement('button');
    solBtn.type = 'button'; solBtn.className = 'block-help-btn';
    solBtn.textContent = '📖 ' + utils.t('runtime.help.solutionButton');
    solBtn.addEventListener('click', () => openHelpPanel(entry, 'solution'));
    bar.appendChild(chip); bar.appendChild(hintBtn); bar.appendChild(solBtn);
    canvas.appendChild(bar);
    entry.update = () => {
      const solved = entry.isSolved();
      const used = attemptsUsedUp(h, st);
      chip.hidden = !h.attempts;
      if(h.attempts){
        chip.textContent = (used && !solved)
          ? utils.t('runtime.help.attemptsUsed')
          : utils.t('runtime.help.attempts', { n: Math.min(h.maxAttempts, (st.attempts || 0) + (solved || used ? 0 : 1)), max: h.maxAttempts });
        chip.classList.toggle('used', used && !solved);
        chip.title = h.attemptPenalty > 0 ? utils.t('runtime.help.attemptPenalty', { pct: h.attemptPenalty }) : '';
      }
      hintBtn.hidden = !(h.hint && (st.hintUsed || (!solved && (st.fails || 0) >= h.hintAfter)));
      solBtn.hidden = !(h.solution && solutionAvailable(h, st, solved));
      bar.hidden = chip.hidden && hintBtn.hidden && solBtn.hidden;
    };
    entry.update();
  }
  function openHelpPanel(entry, kind){
    const { canvas, pos, cfg, st, h, cell } = entry;
    canvas.querySelectorAll('.block-help-panel').forEach(n => n.remove());
    const already = kind === 'hint' ? st.hintUsed : st.solutionShown;
    const confirmText = already ? null
      : (kind === 'hint' && h.hintPenalty > 0) ? utils.t('runtime.help.hintPenalty', { pts: h.hintPenalty })
      : (kind === 'solution' && !entry.isSolved()) ? utils.t('runtime.help.solutionLocks')
      : null;
    const panel = document.createElement('div');
    panel.className = 'block-help-panel';
    panel.style.left  = (pos.x + 8) + 'px';
    panel.style.top   = (pos.y + entry.topOffset + 40) + 'px';
    panel.style.width = Math.max(220, Math.min(520, pos.w - 16)) + 'px';
    const head = document.createElement('div');
    head.className = 'block-help-panel-head';
    const title = document.createElement('strong');
    title.textContent = utils.t(kind === 'hint' ? 'runtime.help.hintTitle' : 'runtime.help.solutionTitle');
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'block-help-close';
    close.textContent = '×';
    close.title = utils.t('runtime.help.close');
    close.addEventListener('click', () => panel.remove());
    head.appendChild(title); head.appendChild(close);
    const body = document.createElement('div');
    body.className = 'block-help-panel-body';
    panel.appendChild(head); panel.appendChild(body);
    function reveal(){
      if(kind === 'hint' && !st.hintUsed){ st.hintUsed = true; entry.rescore(); }
      if(kind === 'solution' && !st.solutionShown){
        st.solutionShown = true;
        if(!entry.isSolved()) lockAnswers(cell, st, true);
      }
      scheduleSave();
      body.innerHTML = '';
      const inst = cell._inst;
      const own = (inst && typeof inst.getVars === 'function' && inst.getVars()) || {};
      const vars = utils.withGlobalVars(own, cfg.variables);
      const raw = String(utils.l(kind === 'hint' ? cfg.hintText : cfg.solutionText) || '');
      const text = document.createElement('div');
      text.className = 'block-help-text';
      text.textContent = utils.fillMathTemplate(raw, vars, utils.varFormats(cfg.variables, cfg));
      body.appendChild(text);
      utils.renderMath(text);
      entry.update();
    }
    if(confirmText){
      const p = document.createElement('p');
      p.textContent = confirmText;
      const row = document.createElement('div');
      row.className = 'block-help-confirm';
      const cancel = document.createElement('button');
      cancel.type = 'button'; cancel.className = 'btn btn-secondary';
      cancel.textContent = utils.t('runtime.help.cancel');
      cancel.addEventListener('click', () => panel.remove());
      const ok = document.createElement('button');
      ok.type = 'button'; ok.className = 'btn btn-primary';
      ok.textContent = utils.t('runtime.help.open');
      ok.addEventListener('click', reveal);
      row.appendChild(cancel); row.appendChild(ok);
      body.appendChild(p); body.appendChild(row);
    } else {
      reveal();
    }
    canvas.appendChild(panel);
  }

  function getTabBlocks(task){
    if(task.tabs && Array.isArray(task.tabs) && task.tabs.length >= 2){
      const i = (task._activeTab != null) ? task._activeTab : 0;
      return (task.tabs[i] && task.tabs[i].blocks) || [];
    }
    return task.blocks || [];
  }
  function getAllTaskBlocks(task){
    if(task.tabs && Array.isArray(task.tabs) && task.tabs.length >= 2){
      const out = [];
      task.tabs.forEach(t => (t.blocks || []).forEach(b => out.push(b)));
      return out;
    }
    return task.blocks || [];
  }

  function showPage(idx){
    if(idx < 0 || idx >= courseConfig.tasks.length) return;
    // Time is up: the result page is final (re-render it, e.g. after a
    // language switch, instead of reopening a task).
    if(courseTimedOut){ finishCourse(true); return; }
    currentPageIdx = idx;
    const task = courseConfig.tasks[idx];
    const container = document.getElementById('taskContainer');
    container.innerHTML = '';

    const useTabs = task.tabs && Array.isArray(task.tabs) && task.tabs.length >= 2;
    if(useTabs && task._activeTab == null) task._activeTab = 0;
    const cacheKey = idx + ':' + (useTabs ? task._activeTab : 0);
    // Only the shown page's block timers tick; all others are paused.
    currentCacheKey = cacheKey;
    scheduleSave();
    const cached = pageCache[cacheKey];
    if(cached){
      container.appendChild(cached);
      // The window may have been resized while this page was detached.
      fitAllCanvases();
      updateNavStates();
      window.scrollTo(0, 0);
      return;
    }

    const page = document.createElement('div');
    pageCache[cacheKey] = page;
    page.className = 'task-page';
    container.appendChild(page);

    const localizedTitle = utils.l(task.title);
    if(localizedTitle){
      const h = document.createElement('h2'); h.className='task-page-title';
      h.textContent = localizedTitle;
      page.appendChild(h);
    }

    // Optional tab navigation per task.
    if(useTabs){
      const tabNav = document.createElement('nav');
      tabNav.className = 'task-tab-nav';
      task.tabs.forEach((t, ti) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'task-tab-btn' + (ti === task._activeTab ? ' active' : '');
        btn.textContent = utils.l(t.title) || utils.t('runtime.tabs.fallbackTitle', {n: ti+1});
        btn.addEventListener('click', () => {
          if(ti === task._activeTab) return;
          task._activeTab = ti;
          showPage(idx);
        });
        tabNav.appendChild(btn);
      });
      page.appendChild(tabNav);
    }

    // Canvas: blocks absolutely positioned per pos.{x,y,w,h}. It is laid
    // out at CANVAS_WIDTH and scaled to the page width (see fitCanvas);
    // the frame takes the scaled size so the canvas centers and the page
    // height follows.
    const scroller = document.createElement('div');
    scroller.className = 'task-canvas-scroll';
    const frame = document.createElement('div');
    frame.className = 'task-canvas-frame';
    const canvas = document.createElement('div');
    canvas.className = 'task-canvas';
    canvas.style.width = CANVAS_WIDTH + 'px';
    frame.appendChild(canvas);
    scroller.appendChild(frame);
    page.appendChild(scroller);

    const slot = perTask[idx] = perTask[idx] || { blockScores: {}, blockInstances: [] };

    let maxBottom = 200;
    getTabBlocks(task).forEach((block, bIdx) => {
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
        cell.innerHTML = '<div class="block-error">' + utils.t('runtime.error.unknownBlockTypeHtml', {type: '<code>' + escapeHtml(block.type) + '</code>'}) + '</div>';
        return;
      }
      const blockApi = {
        utils,
        blockId: 'bl_' + idx + '_' + bIdx + '_' + (block.id || bIdx).toString().replace(/[^A-Za-z0-9_]/g, ''),
        // Course-wide "Neu generieren" defaults; blocks override per-config.
        regenDefaults: {
          lockAfterCheck: !!courseConfig.regenLockAfterCheck,
          noRegenerate: !!courseConfig.regenNoRegenerate
        },
        initScore(max){
          const existing = slot.blockScores[block.id];
          if(!existing) slot.blockScores[block.id] = {points: 0, max: Math.max(1, max), completed: false};
          else slot.blockScores[block.id] = {points: existing.points, max: Math.max(1, max), completed: existing.completed, solved: !!existing.solved};
          pushScoreToLMS(false); updateNavStates();
        },
        reportScore(points, max){
          const existing = slot.blockScores[block.id];
          const m = max != null ? Math.max(1, max) : (existing ? existing.max : 1);
          const raw = Math.max(0, Math.min(points, m));
          const solved = raw >= m - 1e-9;
          // A check (button / Enter) is one attempt, even if the block
          // reports several scores while handling it.
          if(cell._checkActive && cell._countedCheck !== cell._checkId){
            cell._countedCheck = cell._checkId;
            st.attempts = (st.attempts || 0) + 1;
            if(!solved) st.fails = (st.fails || 0) + 1;
          }
          st.lastRaw = raw;
          slot.blockScores[block.id] = {points: help.any ? scoreWithHelp(help, st, raw) : raw, max: m, completed: true, solved};
          pushScoreToLMS(false); updateNavStates();
          if(lockOnCheck && cell._checkActive) lockAnswers(cell, st);
          if(cell._checkActive && attemptsUsedUp(help, st)) lockAnswers(cell, st, true);
          if(helpEntry) setTimeout(helpEntry.update, 0);
          // Re-save shortly after: regenPolicy locks its button after this returns.
          scheduleSave();
        }
      };
      const help = def && def.graded ? helpConfig(block.config || {}) : { any: false };
      let helpEntry = null;
      const rngKey = blockApi.blockId;
      const isRebuild = !!blockRng[rngKey];
      const st = blockRng[rngKey] = blockRng[rngKey] ||
        { seed: Math.floor(Math.random() * 4294967296), regenClicks: [], locked: [], answersLocked: false };
      st.rng = seededRandom(st.seed);
      const lockOnCheck = !!def.graded && resolveLockAnswers(block.config);
      cell.dataset.rngKey = rngKey;
      attachRegenRecorder(cell, st);
      if(lockOnCheck || help.any) attachCheckDetector(cell);
      // Typed answers are saved with the progress (debounced).
      cell.addEventListener('input', scheduleSave);
      cell.addEventListener('change', scheduleSave);
      try {
        const inst = withRandom(st.rng, () => def.mount(cell, block.config || {}, blockApi)) || {};
        slot.blockInstances.push(inst);
        cell._inst = inst; cell._blockId = block.id; cell._taskIdx = idx;
        markRegenButtons(cell);
        if(isRebuild){
          // Replay the student's earlier regenerations, then restore locks.
          // (Replayed regenerations unlock answers, so remember the flag first.)
          const wasAnswerLocked = st.answersLocked;
          st.regenClicks.forEach(i => {
            const btn = cellButtons(cell)[i];
            if(btn) dispatchRegen(btn, st, cell);
          });
          st.locked.forEach(i => {
            const btn = cellButtons(cell)[i];
            if(btn){ btn.disabled = true; btn.title = utils.t('utils.regen.lockedTitle'); }
          });
          if(lockOnCheck && wasAnswerLocked) lockAnswers(cell, st);
        }
        // Per-block countdown. The badge sits on the canvas (not inside the
        // cell) because some blocks wipe their host on regenerate.
        const cfg = block.config || {};
        const duration = def.graded && cfg.timerEnabled ? timerSeconds(cfg.timerMinutes, cfg.timerSeconds) : 0;
        if(duration > 0){
          if(st.timeLeft == null) st.timeLeft = duration;
          const badge = document.createElement('div');
          badge.className = 'block-timer';
          badge.style.left = (pos.x + pos.w) + 'px';
          badge.style.top  = pos.y + 'px';
          canvas.appendChild(badge);
          const entry = { cell, st, badge };
          (pageTimers[cacheKey] = pageTimers[cacheKey] || []).push(entry);
          if(st.timerExpired) expireBlockTimer(entry);
          else renderBlockTimer(entry);
          ensureTicking();
        }
        // Saved answers (resume / rebuilt page), then the locks that follow
        // from used-up attempts or an opened worked solution.
        restoreInputs(cell);
        const isSolved = () => !!(slot.blockScores[block.id] && slot.blockScores[block.id].solved);
        if(def.graded && (attemptsUsedUp(help, st) || (st.solutionShown && !isSolved()))) lockAnswers(cell, st, true);
        if(help.any){
          helpEntry = { cell, canvas, pos, cfg, st, h: help, topOffset: duration > 0 ? 34 : 0, isSolved,
            rescore(){
              const sc = slot.blockScores[block.id];
              if(!sc || st.lastRaw == null) return;
              sc.points = scoreWithHelp(help, st, st.lastRaw);
              pushScoreToLMS(false); updateNavStates();
            } };
          mountBlockHelp(helpEntry);
        }
        utils.renderMath(cell);
      } catch(err){
        console.error('Block ' + block.type + ' mount error:', err);
        cell.innerHTML = '<div class="block-error">' + utils.t('runtime.error.blockMountFailedHtml', {type: '<code>' + escapeHtml(block.type) + '</code>', msg: escapeHtml(String(err))}) + '</div>';
      }
    });
    canvas.style.height = maxBottom + 'px';
    fitCanvas(frame);

    // Footer navigation
    const foot = document.createElement('footer'); foot.className = 'task-page-foot';
    if(idx > 0){
      const prev = document.createElement('button'); prev.type='button'; prev.className='btn btn-secondary'; prev.textContent = '← ' + utils.t('footer.previous');
      prev.addEventListener('click', () => showPage(idx - 1));
      foot.appendChild(prev);
    }
    const spacer = document.createElement('span'); spacer.style.flex='1'; foot.appendChild(spacer);
    if(idx + 1 < courseConfig.tasks.length){
      const next = document.createElement('button'); next.type='button'; next.className='btn btn-primary'; next.textContent = utils.t('footer.next') + ' →';
      next.addEventListener('click', () => showPage(idx + 1));
      foot.appendChild(next);
    } else {
      const finish = document.createElement('button'); finish.type='button'; finish.className='btn btn-primary'; finish.textContent = utils.t('footer.finish');
      finish.addEventListener('click', () => finishCourse());
      foot.appendChild(finish);
    }
    page.appendChild(foot);

    updateNavStates();
    window.scrollTo(0, 0);
  }

  // timedOut: the course timer hit 0. Then the result page is final (task
  // navigation is blocked); a manual finish still allows reviewing tasks.
  function finishCourse(timedOut){
    courseFinished = true;
    if(timedOut) courseTimedOut = true;
    if(tickHandle){ clearInterval(tickHandle); tickHandle = null; }
    pushScoreToLMS(true);
    // Completed attempt: report time spent, normal exit, no resume state.
    if(window.Scorm12 && Scorm12.initialized && !sessionClosed){
      sessionClosed = true;
      Scorm12.set('cmi.core.session_time', fmtSessionTime(Date.now() - sessionStart));
      Scorm12.set('cmi.core.exit', '');
      Scorm12.set('cmi.suspend_data', '');
      Scorm12.commit();
    }
    try { Scorm12.finish(); } catch {}
    const pb = document.getElementById('progressBarWrap');
    if(pb) pb.classList.add('hidden');
    updateGlobalRegenButton();
    const container = document.getElementById('taskContainer');
    const {pts, max} = totalScore();
    const threshold = (courseConfig.passThreshold == null) ? 0.5 : courseConfig.passThreshold;
    const ratio = max > 0 ? pts / max : 0;
    const passed = ratio >= threshold;
    const scoreLineHtml = utils.t('runtime.finish.scoreLineHtml', {
      pts: Math.round(pts*100)/100,
      max: max,
      pct: Math.round(ratio*100)
    });
    const passLine = passed
      ? '<strong style="color:var(--accent-dark)">' + escapeHtml(utils.t('finish.passed')) + ' ✓</strong>'
      : '<strong style="color:var(--danger)">' + escapeHtml(utils.t('finish.failed')) + '</strong>';
    container.innerHTML = '<div class="task-page"><section class="section-card" style="padding:2rem 2.2rem">' +
      '<h2 style="color:var(--primary);margin-top:0">' + escapeHtml(utils.t('finish.title')) + '</h2>' +
      (courseTimedOut ? '<p><strong>⏱ ' + escapeHtml(utils.t('runtime.timer.courseExpired')) + '</strong></p>' : '') +
      '<p>' + scoreLineHtml + '</p>' +
      '<p>' + passLine + '</p>' +
      '<p style="color:var(--muted)">' + escapeHtml(utils.t('finish.closeHint')) + '</p>' +
      '</section></div>';
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  window.ScormRuntime = { finishCourse, totalScore, getCourseConfig: () => courseConfig };

  function loadJson(globalKey, filename){
    if(window[globalKey]) return Promise.resolve(window[globalKey]);
    return fetch(filename).then(r => r.json());
  }

  // Footer-style language switcher shown when the course was exported with
  // more than one locale. Each button flips utils.setLocale, re-applies the
  // static HTML labels, and re-renders the current task page so block content
  // read via api.utils.l() picks the freshly-selected locale.
  function buildLangSwitcher(){
    const host = document.getElementById('scormLangSwitcher');
    if(!host || !courseConfig) return;
    const locales = Array.isArray(courseConfig.locales) ? courseConfig.locales : [];
    if(locales.length < 2){ host.classList.add('hidden'); return; }
    host.innerHTML = '';
    host.classList.remove('hidden');
    const active = utils.getLocale ? utils.getLocale() : (courseConfig.defaultLocale || 'de');
    locales.forEach(code => {
      const meta = utils.localeMeta ? utils.localeMeta(code) : { label: String(code).toUpperCase() };
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'scorm-lang-btn' + (code === active ? ' active' : '');
      btn.textContent = meta.label || String(code).toUpperCase();
      btn.setAttribute('title', meta.name || code);
      btn.setAttribute('aria-pressed', code === active ? 'true' : 'false');
      btn.addEventListener('click', () => {
        if(code === utils.getLocale()) return;
        if(utils.setLocale && !utils.setLocale(code)) return;
        applyRuntimeLocale();
      });
      host.appendChild(btn);
    });
  }

  // Re-apply everything that depends on the current locale: static HTML
  // labels, document lang, dynamic titles, nav buttons, progress, and the
  // currently displayed page (so block content re-reads via l()).
  function applyRuntimeLocale(){
    if(!courseConfig) return;
    if(utils.applyDataI18n) utils.applyDataI18n(document);
    document.documentElement.setAttribute('lang', utils.getLocale ? utils.getLocale() : 'de');
    document.title = utils.l(courseConfig.courseTitle) || utils.t('runtime.defaultCourseTitle');
    const titleEl = document.getElementById('courseTitle');
    if(titleEl) titleEl.textContent = utils.l(courseConfig.courseTitle) || '';
    const subEl = document.getElementById('courseSubtitle');
    if(subEl) subEl.textContent = utils.l(courseConfig.courseSubtitle) || '';
    buildNav();
    buildLangSwitcher();
    updateNavStates();
    clearPageCache();
    scheduleSave();
    if(currentPageIdx >= 0) showPage(currentPageIdx);
  }

  function bootstrap(){
    loadJson('__SCORM_THEME__', 'theme.json').then(t => { applyTheme(t); }).catch(() => {});
    loadJson('__SCORM_TASKS__', 'tasks.json').then(cfg => {
      cfg.tasks = (cfg.tasks || []).map(migrateLegacyTask);
      courseConfig = cfg;
      if(cfg.defaultLocale && utils.setDefaultLocale) utils.setDefaultLocale(cfg.defaultLocale);
      if(cfg.defaultLocale && utils.setLocale) utils.setLocale(cfg.defaultLocale);
      try { window.Scorm12 && Scorm12.init(); } catch {}
      // Task pools: fix the drawn selection before anything is indexed by
      // task position (scores, navigation, saved progress).
      const peek = peekSuspendData();
      if(peek && peek.pl) poolSeed = parseInt(peek.pl, 36) >>> 0;
      applyPools(cfg);
      cfg.tasks.forEach(() => perTask.push({blockScores: {}, blockInstances: []}));
      setupGlobalVars(cfg);
      // Course-wide countdown starts as soon as the course is opened.
      const courseDuration = cfg.courseTimerEnabled ? timerSeconds(cfg.courseTimerMinutes, cfg.courseTimerSeconds) : 0;
      if(courseDuration > 0){ courseTimeLeft = courseDuration; ensureTicking(); }
      // Resume a suspended attempt (locale, scores, random values, timers,
      // position). Runs before any locale-dependent text is rendered.
      const resumed = restoreProgress();
      // Global variables: the resumed seed, else a fresh one (before any block mounts).
      if(globalUsers.length) applyGlobalSeed(globalSeed != null ? globalSeed : Math.floor(Math.random() * 4294967296));
      if(utils.applyDataI18n) utils.applyDataI18n(document);
      document.documentElement.setAttribute('lang', utils.getLocale ? utils.getLocale() : (cfg.defaultLocale || 'de'));
      document.title = utils.l(cfg.courseTitle) || utils.t('runtime.defaultCourseTitle');
      document.getElementById('courseTitle').textContent = utils.l(cfg.courseTitle) || '';
      document.getElementById('courseSubtitle').textContent = utils.l(cfg.courseSubtitle) || '';
      buildNav();
      buildLangSwitcher();
      buildGlobalRegenButton();
      updateNavStates();
      if(cfg.tasks.length > 0) showPage(resumed ? resumed.page : 0);
    }).catch(err => {
      document.getElementById('taskContainer').innerHTML = '<section class="hero-card"><div><h2>' + escapeHtml(utils.t('error.configNotLoadable')) + '</h2><pre>' + escapeHtml(String(err)) + '</pre></div></section>';
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
})();
