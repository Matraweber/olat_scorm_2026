// ============================================================================
// main.js: Entry point. Wires render() / renderActivePane() into state,
// hooks up event listeners on top-bar buttons, sidebar links, modal close
// buttons, the JSON-mode toggle, sidebar collapse, and global keyboard shortcuts.
// ============================================================================
import {
  state, setRenderer, defaultCourse, loadPersistentTheme,
  undo, redo, copySelectedBlocks, pasteBlocks,
  isAutosaveAvailable, loadAutosave, loadAutosaveMeta, clearAutosave,
  flushAutosave, setAutosaveListener, setAutosavePendingListener, scheduleAutosave
} from './state.js';
import { renderTaskList, renderActivePaneImpl } from './panes.js';
import { loadUserTemplates, loadUserBlockTemplates } from './tasks.js';
import { openTaskCreateModal } from './modals.js';
import { downloadZip, exportJson, loadJsonFile, loadZipFile, showPreview, syncJsonEditor, applyJsonEditor } from './io.js';
import { toast, confirmDialog } from './util.js';
import { getActiveTaskCtx } from './task-pane.js';

// ----- Wire render dispatchers into state.js -----
function render(){
  renderTaskList();
  renderActivePaneImpl();
  if(state.jsonMode) syncJsonEditor();
}
setRenderer(render, renderActivePaneImpl);

// Expose mutable state + render on `window` for two reasons:
//   1. Browser devtools - easy to inspect the current course while debugging.
//   2. automated tests - direct mutation via `page.evaluate` saves a lot of
//      UI-driving scaffolding for assertions that just need a known state.
// Nothing in the app itself reads from `window.state`; if the global ever
// goes away the runtime is unaffected.
window.state = state;
window.scormBuilderRender = render;

// ----- Event wiring -----
function init(){
  document.getElementById('btnNew').addEventListener('click', async () => {
    if(!await confirmDialog({
      title: 'Neue Lerneinheit?',
      message: 'Aktuellen Stand verwerfen und mit einer leeren Lerneinheit beginnen? Nicht gespeicherte Änderungen gehen verloren.',
      confirmLabel: 'Verwerfen und neu',
      danger: true
    })) return;
    state.course = defaultCourse();
    state.theme = loadPersistentTheme();
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

  // ----- Sidebar collapse (persisted) -----
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

  // ----- Cheatsheet (? key) --------------------------------------------
  setupCheatsheet();

  // ----- Global keyboard shortcuts -----
  document.addEventListener('keydown', (e) => {
    const ae = document.activeElement;
    const inField = ae && ae.matches('input, textarea, select, [contenteditable="true"]');
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;

    // "?" opens the cheatsheet. On most keyboards "?" requires Shift+/ -
    // accept either key === '?' (most layouts) or Shift+/ (US).
    if(!mod && !inField && (key === '?' || (e.shiftKey && key === '/'))){
      e.preventDefault();
      toggleCheatsheet();
      return;
    }

    // Cmd/Ctrl + Shift + S → "Speichern unter": export the SCORM-ZIP. Same
    // intent as classic "Save As" - it persists work to a real file the
    // user can hand off. Must come BEFORE the plain Ctrl+S check below
    // because Shift+S also matches the !e.shiftKey-less variant.
    if(mod && e.shiftKey && (key === 's' || key === 'S')){
      if(inField) return;
      e.preventDefault();
      downloadZip();
      return;
    }
    // Cmd/Ctrl + S → "Speichern": flush any pending autosave NOW and show a
    // toast confirmation. The app already auto-saves on idle, but the
    // shortcut is muscle memory for every user, so we honour it.
    if(mod && !e.shiftKey && (key === 's' || key === 'S')){
      if(inField) return;
      e.preventDefault();
      flushAutosave();
      toast('Lerneinheit gespeichert.');
      return;
    }

    // Undo/Redo work globally
    if(mod && !e.shiftKey && (key === 'z' || key === 'Z')){
      if(inField) return;
      e.preventDefault(); undo(); return;
    }
    if(mod && (key === 'y' || key === 'Y' || (e.shiftKey && (key === 'z' || key === 'Z')))){
      if(inField) return;
      e.preventDefault(); redo(); return;
    }
    // Copy/Paste blocks (only in task editor and not in a field)
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

    // Task-editor-only shortcuts
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

  // ----- Datei dropdown -----------------------------------------------
  setupFileMenu();

  // ----- Autosave: status indicator + recovery dialog + unload flush ----
  setupAutosaveIndicator();
  // After "Neu" is clicked, the user explicitly wants a fresh course - we
  // should drop the autosave too so it doesn't immediately suggest recovery.
  document.getElementById('btnNew').addEventListener('click', clearAutosave);

  // Flush any pending debounced save when the tab closes so the very last
  // edit isn't lost.
  window.addEventListener('beforeunload', flushAutosave);
  // Also save on visibility-hidden - covers tab switches and some mobile
  // browser cases where beforeunload isn't reliable.
  document.addEventListener('visibilitychange', () => { if(document.hidden) flushAutosave(); });

  maybeOfferRecovery();

  render();
}

// Cheatsheet overlay - discoverable via the "?" header button and via the
// "?" key. Closes on Escape, the X button, or a backdrop click. Returns
// focus to whatever element previously had it, so keyboard users land back
// in the same place they came from.
let _cheatsheetPrevFocus = null;
function toggleCheatsheet(){
  const m = document.getElementById('cheatsheetModal');
  if(!m) return;
  if(m.classList.contains('hidden')){
    _cheatsheetPrevFocus = document.activeElement;
    m.classList.remove('hidden');
    // Trap focus inside the modal - focus the close button so Escape works
    // immediately without further tabbing.
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
  // Backdrop click (the modal element itself, not the inner card).
  modal.addEventListener('click', e => {
    if(e.target === modal) toggleCheatsheet();
  });
  // Escape closes when open.
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && !modal.classList.contains('hidden')){
      e.preventDefault();
      toggleCheatsheet();
    }
  });
}

// Wire the Datei-dropdown menu in the header: opens on click, closes on
// outside-click + Escape + after any menu item is activated. Aria state on
// the trigger reflects open/closed for screen readers.
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
  // Close on click outside
  document.addEventListener('click', e => {
    if(!pop.hidden && !wrap.contains(e.target)) setOpen(false);
  });
  // Close on Escape
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && !pop.hidden){ setOpen(false); trig.focus(); }
  });
  // Close after any menu item is activated. <label>s for file inputs trigger
  // a synthetic click on the hidden <input>; both flows close the popover.
  pop.querySelectorAll('.header-menu-item').forEach(el => {
    el.addEventListener('click', () => setOpen(false));
    if(el.tagName === 'LABEL'){
      // Labels can also be activated via keyboard (tabindex="0" + Enter).
      el.addEventListener('keydown', e => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); el.click(); }
      });
    }
  });
}

// Status pill in the header. Three visual states:
//   • idle    - "Nicht gespeichert"   (grey dot)        - no save yet
//   • saving  - "Wird gespeichert …"  (amber pulse)     - debounce in-flight
//   • saved   - "Gespeichert · vor N" (green dot)       - write succeeded
// When a save lands we toggle a CSS class for ~700 ms so the dot does a
// brief expanding-ring "pulse" that confirms the write without being noisy.
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
    if(pill.dataset.state === 'saving') return; // hold the pending state
    if(!lastTs){ pill.textContent = 'Nicht gespeichert'; pill.dataset.state = 'idle'; return; }
    const dt = Math.round((Date.now() - lastTs) / 1000);
    pill.dataset.state = 'saved';
    pill.textContent = dt < 5  ? 'Gespeichert'
                    : dt < 60 ? 'Gespeichert · vor ' + dt + ' s'
                              : 'Gespeichert · vor ' + Math.floor(dt / 60) + ' min';
  }

  // ‹Pending›: scheduled but not yet written - show the "saving" state.
  // Idempotent: only flips into 'saving' if we have a save target.
  setAutosavePendingListener(() => {
    pill.dataset.state = 'saving';
    pill.textContent = 'Wird gespeichert …';
    pill.classList.remove('just-saved');
  });
  // ‹Written›: localStorage write succeeded. Trigger the dot pulse and
  // update the freshness text.
  setAutosaveListener(({ ts }) => {
    lastTs = ts;
    pill.dataset.state = 'saved';
    update();
    // Restart the pulse animation so the user gets a brief confirmation.
    pill.classList.remove('just-saved');
    void pill.offsetWidth; // force reflow so the animation re-fires
    pill.classList.add('just-saved');
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => pill.classList.remove('just-saved'), 800);
  });
  setInterval(update, 5000);

  // If a saved course already exists at load, reflect that.
  const meta = loadAutosaveMeta();
  if(meta && meta.ts){ lastTs = meta.ts; update(); }
}

// Recovery dialog. Only shown if localStorage holds a non-trivial course
// from a previous session AND the in-memory course is still the default.
// "Wiederherstellen" replaces state.course; "Verwerfen" clears the autosave.
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
  // Block input until the user decides.
  overlay.querySelector('#autosaveRestore').addEventListener('click', () => {
    state.course = saved;
    state.selected = state.course.tasks.length > 0 ? { kind: 'task', idx: 0 } : { kind: 'course' };
    overlay.remove();
    render();
    // Re-save so the meta timestamp updates.
    scheduleAutosave();
  });
  overlay.querySelector('#autosaveDiscard').addEventListener('click', () => {
    clearAutosave();
    overlay.remove();
  });
  // Focus the primary action for keyboard users.
  overlay.querySelector('#autosaveRestore').focus({ preventScroll: true });
}

function escapeHtml(s){
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
