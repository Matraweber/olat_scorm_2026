// ============================================================================
// main.js - Entry point. Wires render() / renderActivePane() into state,
// hooks up event listeners on top-bar buttons, sidebar links, modal close
// buttons, the JSON-mode toggle, sidebar collapse, and global keyboard shortcuts.
// ============================================================================
import { state, setRenderer, defaultCourse, undo, redo, copySelectedBlocks, pasteBlocks } from './state.js';
import { renderTaskList, renderActivePaneImpl } from './panes.js';
import { loadUserTemplates } from './tasks.js';
import { defaultTheme } from './state.js';
import { openTaskCreateModal } from './modals.js';
import { downloadZip, exportJson, loadJsonFile, loadZipFile, showPreview, syncJsonEditor, applyJsonEditor } from './io.js';
import { getActiveTaskCtx } from './task-pane.js';

// ----- Wire render dispatchers into state.js -----
function render(){
  renderTaskList();
  renderActivePaneImpl();
  if(state.jsonMode) syncJsonEditor();
}
setRenderer(render, renderActivePaneImpl);

// ----- Event wiring -----
function init(){
  document.getElementById('btnNew').addEventListener('click', () => {
    if(!confirm('Aktuellen Stand verwerfen und neue Lerneinheit anlegen?')) return;
    state.course = defaultCourse();
    state.theme = defaultTheme();
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

  // ----- Global keyboard shortcuts -----
  document.addEventListener('keydown', (e) => {
    const ae = document.activeElement;
    const inField = ae && ae.matches('input, textarea, select, [contenteditable="true"]');
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;

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
  render();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
