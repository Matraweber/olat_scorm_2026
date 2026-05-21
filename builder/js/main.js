// main.js: Entry point. Wires render dispatchers and event listeners.
import {
  state, setRenderer, defaultCourse, loadPersistentTheme, applyThemeToBuilder,
  undo, redo, copySelectedBlocks, pasteBlocks,
  isAutosaveAvailable, loadAutosave, loadAutosaveMeta, clearAutosave,
  flushAutosave, setAutosaveListener, setAutosavePendingListener, scheduleAutosave
} from './state.js';
import { renderTaskList, renderActivePaneImpl } from './panes.js';
import { loadUserTemplates, loadUserBlockTemplates, loadBlockUsage } from './tasks.js';
import { openTaskCreateModal } from './modals.js';
import { downloadZip, exportJson, loadJsonFile, loadZipFile, showPreview, syncJsonEditor, applyJsonEditor } from './io.js';
import { toast, confirmDialog, escapeHtml } from './util.js';
import { getActiveTaskCtx } from './task-pane.js';

function render(){
  renderTaskList();
  renderActivePaneImpl();
  if(state.jsonMode) syncJsonEditor();
}
setRenderer(render, renderActivePaneImpl);

// Exposed for devtools inspection and tests. The app itself
// never reads window.state.
window.state = state;
window.scormBuilderRender = render;

function init(){
  // Apply persisted theme on frame 1 so the builder UI never flashes default.
  applyThemeToBuilder(state.theme);
  document.getElementById('btnNew').addEventListener('click', async () => {
    if(!await confirmDialog({
      title: 'Neue Lerneinheit?',
      message: 'Aktuellen Stand verwerfen und mit einer leeren Lerneinheit beginnen? Nicht gespeicherte Änderungen gehen verloren.',
      confirmLabel: 'Verwerfen und neu',
      danger: true
    })) return;
    state.course = defaultCourse();
    state.theme = loadPersistentTheme();
    applyThemeToBuilder(state.theme);
    state.selected = {kind:'course'};
    render();
  });
  document.getElementById('btnAddTask').addEventListener('click', openTaskCreateModal);
  document.getElementById('btnDownload').addEventListener('click', downloadZip);
  document.getElementById('btnPreview').addEventListener('click', showPreview);
  document.getElementById('btnExportJson').addEventListener('click', exportJson);
  document.getElementById('fileLoadZip').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f) loadZipFile(f); e.target.value = ''; });
  document.getElementById('fileLoadJson').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f) loadJsonFile(f); e.target.value = ''; });
  document.querySelectorAll('.sidebar-link').forEach(b => {
    b.addEventListener('click', () => { state.selected = {kind: b.dataset.target}; render(); });
  });
  document.querySelectorAll('[data-modal-close]').forEach(b => {
    b.addEventListener('click', () => b.closest('.modal').classList.add('hidden'));
  });
  document.getElementById('jsonModeToggle').addEventListener('change', e => {
    state.jsonMode = e.target.checked;
    if(state.jsonMode) syncJsonEditor();
    renderActivePaneImpl();
  });
  document.getElementById('jsonEditor').addEventListener('input', () => applyJsonEditor());

  // Sidebar collapse (persisted)
  function applySidebarState(){
    const collapsed = localStorage.getItem('scorm-builder-sidebar-collapsed') === '1';
    document.querySelector('.builder-shell').classList.toggle('sidebar-collapsed', collapsed);
  }
  document.getElementById('btnSidebarToggle').addEventListener('click', () => {
    const cur = localStorage.getItem('scorm-builder-sidebar-collapsed') === '1';
    localStorage.setItem('scorm-builder-sidebar-collapsed', cur ? '0' : '1');
    applySidebarState();
  });
  applySidebarState();

  setupCheatsheet();

  // Header brand: SCORM-Builder badge -> welcome, course title -> Kopfdaten.
  document.getElementById('btnHomeBrand')?.addEventListener('click', () => {
    state.selected = { kind: 'welcome' };
    render();
  });
  document.getElementById('btnCourseHead')?.addEventListener('click', () => {
    state.selected = { kind: 'course' };
    render();
  });
  // Keep the header title in sync with state.course.courseTitle.
  function syncHeaderTitle(){
    const t = document.getElementById('courseTitleDisplay');
    if(t) t.textContent = state.course.courseTitle || 'Neue Lerneinheit';
  }
  syncHeaderTitle();
  window.scormBuilderSyncHeaderTitle = syncHeaderTitle;

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const ae = document.activeElement;
    const inField = ae && ae.matches('input, textarea, select, [contenteditable="true"]');
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;

    // "?" requires Shift+/ on US layouts; accept both forms.
    if(!mod && !inField && (key === '?' || (e.shiftKey && key === '/'))){
      e.preventDefault();
      toggleCheatsheet();
      return;
    }

    // Cmd/Ctrl + Shift + S = "Speichern unter": export the SCORM-ZIP.
    // Must come before the plain Ctrl+S check.
    if(mod && e.shiftKey && (key === 's' || key === 'S')){
      if(inField) return;
      e.preventDefault();
      downloadZip();
      return;
    }
    // Cmd/Ctrl + S: flush autosave + toast. Muscle memory for every user.
    if(mod && !e.shiftKey && (key === 's' || key === 'S')){
      if(inField) return;
      e.preventDefault();
      flushAutosave();
      toast('Lerneinheit gespeichert.');
      return;
    }

    if(mod && !e.shiftKey && (key === 'z' || key === 'Z')){
      if(inField) return;
      e.preventDefault(); undo(); return;
    }
    if(mod && (key === 'y' || key === 'Y' || (e.shiftKey && (key === 'z' || key === 'Z')))){
      if(inField) return;
      e.preventDefault(); redo(); return;
    }
    // Copy/Paste blocks: only in task editor.
    if(mod && (key === 'c' || key === 'C') && !inField){
      if(state.selected.kind !== 'task') return;
      if(copySelectedBlocks()) e.preventDefault();
      return;
    }
    if(mod && (key === 'v' || key === 'V') && !inField){
      if(state.selected.kind !== 'task') return;
      if(pasteBlocks()) e.preventDefault();
      return;
    }

    // Task-editor-only below this point.
    if(state.selected.kind !== 'task') return;
    const ctx = getActiveTaskCtx();
    if(!ctx) return;
    if(inField) return;
    if(ctx.selectedIds.length === 0 && !(mod && (key === 'a' || key === 'A'))) return;

    if(key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown'){
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0;
      const dy = key === 'ArrowUp'   ? -step : key === 'ArrowDown'  ? step : 0;
      ctx.nudgeSelected(dx, dy);
      return;
    }
    if(key === 'Delete' || key === 'Backspace'){
      e.preventDefault(); ctx.bulkDelete(); return;
    }
    if(key === 'Escape'){
      e.preventDefault(); ctx.deselectAll(); return;
    }
    if(mod && (key === 'd' || key === 'D')){
      e.preventDefault(); ctx.bulkDuplicate(); return;
    }
    if(mod && (key === 'a' || key === 'A')){
      e.preventDefault(); ctx.selectAll(); return;
    }
  });

  state.userTemplates = loadUserTemplates();
  state.userBlockTemplates = loadUserBlockTemplates();
  state.blockUsage = loadBlockUsage();

  setupFileMenu();

  setupAutosaveIndicator();
  // After "Neu", clear autosave too so the next reload doesn't offer recovery.
  document.getElementById('btnNew').addEventListener('click', clearAutosave);

  window.addEventListener('beforeunload', flushAutosave);
  // beforeunload isn't reliable on mobile; visibilitychange is a backup.
  document.addEventListener('visibilitychange', () => { if(document.hidden) flushAutosave(); });

  maybeOfferRecovery();

  render();
}

// Cheatsheet overlay: opens via the "?" header button or "?" key, closes on
// Escape / X / backdrop click. Restores focus to the previous element.
let _cheatsheetPrevFocus = null;
function toggleCheatsheet(){
  const m = document.getElementById('cheatsheetModal');
  if(!m) return;
  if(m.classList.contains('hidden')){
    _cheatsheetPrevFocus = document.activeElement;
    m.classList.remove('hidden');
    setTimeout(() => document.getElementById('cheatsheetClose')?.focus({ preventScroll: true }), 0);
  } else {
    m.classList.add('hidden');
    if(_cheatsheetPrevFocus && typeof _cheatsheetPrevFocus.focus === 'function'){
      try { _cheatsheetPrevFocus.focus({ preventScroll: true }); } catch(e){}
    }
  }
}
function setupCheatsheet(){
  const trig = document.getElementById('btnCheatsheet');
  const close = document.getElementById('cheatsheetClose');
  const modal = document.getElementById('cheatsheetModal');
  if(!modal) return;
  trig?.addEventListener('click', toggleCheatsheet);
  close?.addEventListener('click', toggleCheatsheet);
  modal.addEventListener('click', e => {
    if(e.target === modal) toggleCheatsheet();
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && !modal.classList.contains('hidden')){
      e.preventDefault();
      toggleCheatsheet();
    }
  });
}

// Datei dropdown: opens on click, closes on outside-click, Escape, or any
// item activation.
function setupFileMenu(){
  const wrap   = document.getElementById('fileMenu');
  const trig   = document.getElementById('btnFileMenu');
  const pop    = wrap?.querySelector('.header-menu-popover');
  if(!wrap || !trig || !pop) return;

  function setOpen(open){
    wrap.dataset.open = open ? 'true' : 'false';
    trig.setAttribute('aria-expanded', open ? 'true' : 'false');
    pop.hidden = !open;
  }
  trig.addEventListener('click', e => {
    e.stopPropagation();
    setOpen(pop.hidden);
  });
  document.addEventListener('click', e => {
    if(!pop.hidden && !wrap.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && !pop.hidden){ setOpen(false); trig.focus(); }
  });
  // <label>s for file inputs trigger a click on the hidden <input>; both
  // flows close the popover.
  pop.querySelectorAll('.header-menu-item').forEach(el => {
    el.addEventListener('click', () => setOpen(false));
    if(el.tagName === 'LABEL'){
      el.addEventListener('keydown', e => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); el.click(); }
      });
    }
  });
}

// Autosave status pill in the header. States: idle / saving / saved.
// On a successful save, .just-saved triggers a ~700 ms ring pulse.
function setupAutosaveIndicator(){
  const actions = document.querySelector('.builder-actions');
  if(!actions) return;
  const pill = document.createElement('span');
  pill.id = 'autosaveStatus';
  pill.className = 'autosave-status';
  pill.title = 'Automatisch im Browser gespeichert';
  pill.textContent = 'Nicht gespeichert';
  pill.dataset.state = 'idle';
  actions.insertBefore(pill, actions.firstChild);

  let lastTs = 0;
  let pulseTimer = null;
  function update(){
    if(pill.dataset.state === 'saving') return;
    if(!lastTs){ pill.textContent = 'Nicht gespeichert'; pill.dataset.state = 'idle'; return; }
    const dt = Math.round((Date.now() - lastTs) / 1000);
    pill.dataset.state = 'saved';
    pill.textContent = dt < 5  ? 'Gespeichert'
                    : dt < 60 ? 'Gespeichert · vor ' + dt + ' s'
                              : 'Gespeichert · vor ' + Math.floor(dt / 60) + ' min';
  }

  setAutosavePendingListener(() => {
    pill.dataset.state = 'saving';
    pill.textContent = 'Wird gespeichert …';
    pill.classList.remove('just-saved');
  });
  setAutosaveListener(({ ts }) => {
    lastTs = ts;
    pill.dataset.state = 'saved';
    update();
    pill.classList.remove('just-saved');
    void pill.offsetWidth; // force reflow so the animation re-fires
    pill.classList.add('just-saved');
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => pill.classList.remove('just-saved'), 800);
  });
  setInterval(update, 5000);

  const meta = loadAutosaveMeta();
  if(meta && meta.ts){ lastTs = meta.ts; update(); }
}

// Recovery dialog: offered when localStorage has a non-trivial course from
// a previous session. "Wiederherstellen" replaces state.course, "Verwerfen"
// clears the autosave.
function maybeOfferRecovery(){
  if(!isAutosaveAvailable()) return;
  const saved = loadAutosave();
  const meta  = loadAutosaveMeta();
  if(!saved) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal autosave-recovery';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  const tasksN = Array.isArray(saved.tasks) ? saved.tasks.length : 0;
  const ageMin = meta && meta.ts ? Math.max(1, Math.round((Date.now() - meta.ts) / 60000)) : null;
  const ageLine = ageMin
    ? '<p class="hint">Zuletzt geändert vor ' + (ageMin < 60 ? ageMin + ' Minuten' : Math.round(ageMin/60) + ' Stunden') + '.</p>'
    : '';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:480px">
      <h2>Vorherige Sitzung wiederherstellen?</h2>
      <p>Es wurde eine ungespeicherte Lerneinheit gefunden:</p>
      <div class="autosave-summary">
        <strong>${escapeHtml(saved.courseTitle || 'Lerneinheit')}</strong>
        <span>${tasksN} Aufgabe${tasksN === 1 ? '' : 'n'}</span>
      </div>
      ${ageLine}
      <div class="modal-actions">
        <button id="autosaveDiscard" class="btn btn-secondary" type="button">Verwerfen</button>
        <button id="autosaveRestore" class="btn btn-primary" type="button">Wiederherstellen</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#autosaveRestore').addEventListener('click', () => {
    state.course = saved;
    state.selected = state.course.tasks.length > 0 ? { kind: 'task', idx: 0 } : { kind: 'course' };
    overlay.remove();
    render();
    scheduleAutosave();
  });
  overlay.querySelector('#autosaveDiscard').addEventListener('click', () => {
    clearAutosave();
    overlay.remove();
  });
  overlay.querySelector('#autosaveRestore').focus({ preventScroll: true });
}


if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
