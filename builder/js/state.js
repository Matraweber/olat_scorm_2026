// state.js: Global state, defaults, history (undo/redo), clipboard.
// render/renderActivePane are set by main.js to break circular imports.
import { toast } from './util.js';

export function defaultCourse(){
  return { courseTitle: 'Neue SCORM-Lerneinheit', courseSubtitle: '', passThreshold: 0.5, tasks: [] };
}
export function defaultTheme(){
  return {
    primaryColor: '#003b5c', primaryLight: '#0f567d',
    accentColor: '#a1d884', accentDarkColor: '#84bf66',
    fontFamily: 'Verdana, Arial, sans-serif',
    kicker: 'Umwelt-Campus Birkenfeld | Hochschule Trier',
    footerText: 'Dr.-Ing. Lukas Lentz',
    footerLink: 'https://www.umwelt-campus.de/dr-lukas-lentz',
    logoUrl: 'default-logo.svg', logoDataUrl: null
  };
}

const THEME_STORAGE_KEY    = 'scorm-builder-persistent-theme';
const AUTOSAVE_KEY         = 'scorm-builder-autosave-course';
const AUTOSAVE_META_KEY    = 'scorm-builder-autosave-meta';

export function mergeTheme(theme){
  return Object.assign(defaultTheme(), theme || {});
}

export function loadPersistentTheme(){
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? mergeTheme(JSON.parse(raw)) : defaultTheme();
  } catch(e){
    return defaultTheme();
  }
}

export function savePersistentTheme(theme){
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(mergeTheme(theme)));
    return true;
  } catch(e){
    return false;
  }
}

export function clearPersistentTheme(){
  try { localStorage.removeItem(THEME_STORAGE_KEY); }
  catch(e){}
}

// Push theme colors onto the document root so the builder UI live-previews
// changes (the SCORM output already uses these vars natively).
export function applyThemeToBuilder(theme){
  const t = mergeTheme(theme);
  const r = document.documentElement;
  if(!r || !r.style) return;
  if(t.primaryColor)     r.style.setProperty('--primary',      t.primaryColor);
  if(t.primaryLight)     r.style.setProperty('--primary-light', t.primaryLight);
  if(t.accentColor)      r.style.setProperty('--accent',       t.accentColor);
  if(t.accentDarkColor)  r.style.setProperty('--accent-dark',  t.accentDarkColor);
}

// Autosave: mirror state.course to localStorage. On next load main.js
// offers to restore the saved course.
let _autosaveTimer = null;
let _onAutosave = null;
let _onAutosavePending = null;

export function setAutosaveListener(fn){ _onAutosave = typeof fn === 'function' ? fn : null; }
export function setAutosavePendingListener(fn){ _onAutosavePending = typeof fn === 'function' ? fn : null; }

// True if the course has any task or a non-default title.
function courseHasContent(c){
  if(!c) return false;
  const def = defaultCourse();
  if(Array.isArray(c.tasks) && c.tasks.length > 0) return true;
  if(c.courseTitle && c.courseTitle !== def.courseTitle) return true;
  if(c.courseSubtitle && c.courseSubtitle.trim() !== '') return true;
  return false;
}

export function isAutosaveAvailable(){
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if(!raw) return false;
    const c = JSON.parse(raw);
    return courseHasContent(c);
  } catch(e){ return false; }
}

export function loadAutosave(){
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}

export function loadAutosaveMeta(){
  try {
    const raw = localStorage.getItem(AUTOSAVE_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}

// Write through immediately. Caller decides timing.
export function saveAutosave(course){
  try {
    if(!courseHasContent(course)){
      localStorage.removeItem(AUTOSAVE_KEY);
      localStorage.removeItem(AUTOSAVE_META_KEY);
      return;
    }
    const ts = Date.now();
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(course));
    localStorage.setItem(AUTOSAVE_META_KEY, JSON.stringify({
      ts,
      taskCount: Array.isArray(course.tasks) ? course.tasks.length : 0,
      courseTitle: course.courseTitle || ''
    }));
    if(_onAutosave) try { _onAutosave({ ts }); } catch(e){}
  } catch(e){
    // Quota exceeded / private mode: ignore. Manual ZIP export still works.
  }
}

export function clearAutosave(){
  try { localStorage.removeItem(AUTOSAVE_KEY); localStorage.removeItem(AUTOSAVE_META_KEY); } catch(e){}
}

// Debounced for hot paths (typing, dragging): 800 ms idle = one write.
// main.js also registers a flush on unload for the last edit.
export function scheduleAutosave(){
  if(!_autosaveTimer && _onAutosavePending){
    try { _onAutosavePending(); } catch(e){}
  }
  if(_autosaveTimer) clearTimeout(_autosaveTimer);
  _autosaveTimer = setTimeout(() => { _autosaveTimer = null; saveAutosave(state.course); }, 800);
}
export function flushAutosave(){
  if(_autosaveTimer){ clearTimeout(_autosaveTimer); _autosaveTimer = null; }
  saveAutosave(state.course);
}

export const state = {
  course: defaultCourse(),
  theme: loadPersistentTheme(),
  // {kind:'welcome'|'course'|'theme'} or {kind:'task', idx}
  selected: { kind: 'welcome' },
  jsonMode: false,
  userTemplates: []
};

// Stubs so modules can call render() at import time before main.js sets them.
let _render = () => {};
let _renderActivePane = () => {};
export function setRenderer(renderFn, renderActivePaneFn){
  _render = renderFn;
  _renderActivePane = renderActivePaneFn;
}
export function render(){ _render(); }
export function renderActivePane(){ _renderActivePane(); }

// History (undo / redo)
const history = { past: [], future: [] };
const HISTORY_LIMIT = 50;
function snapshotState(){ return JSON.stringify({course: state.course, theme: state.theme}); }
function applySnapshot(snap){
  try {
    const o = JSON.parse(snap);
    if(o.course) state.course = o.course;
    if(o.theme) state.theme = o.theme;
    if(state.selected.kind === 'task' && state.selected.idx >= state.course.tasks.length){
      state.selected = state.course.tasks.length > 0 ? {kind:'task', idx:0} : {kind:'course'};
    }
    render();
  } catch(e){ toast('Rückgängig fehlgeschlagen: ' + e.message, 'error'); }
}
export function pushHistory(){
  history.past.push(snapshotState());
  if(history.past.length > HISTORY_LIMIT) history.past.shift();
  history.future = [];
  scheduleAutosave();
}

let _pendingHistorySnap = null;
export function takeHistorySnap(){ _pendingHistorySnap = snapshotState(); }
export function commitHistorySnap(){
  if(_pendingHistorySnap == null) return;
  history.past.push(_pendingHistorySnap);
  if(history.past.length > HISTORY_LIMIT) history.past.shift();
  history.future = [];
  _pendingHistorySnap = null;
  scheduleAutosave();
}
export function discardHistorySnap(){ _pendingHistorySnap = null; }

let _debounceTimer = null;
export function pushHistoryDebounced(){
  if(_pendingHistorySnap == null) takeHistorySnap();
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => { commitHistorySnap(); _debounceTimer = null; }, 700);
}

export function undo(){
  if(history.past.length === 0){ toast('Nichts zum Rückgängigmachen.'); return; }
  history.future.push(snapshotState());
  applySnapshot(history.past.pop());
  scheduleAutosave();
  toast('Rückgängig');
}
export function redo(){
  if(history.future.length === 0){ toast('Nichts zum Wiederherstellen.'); return; }
  history.past.push(snapshotState());
  applySnapshot(history.future.pop());
  scheduleAutosave();
  toast('Wiederherstellen');
}

// Clipboard for blocks, persisted via localStorage.
const CLIPBOARD_KEY = 'scorm-builder-clipboard';
function clipboardPut(payload){ try { localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(payload)); } catch(e){} }
function clipboardGet(){
  try { const raw = localStorage.getItem(CLIPBOARD_KEY); return raw ? JSON.parse(raw) : null; }
  catch(e){ return null; }
}

export function copySelectedBlocks(){
  if(state.selected.kind !== 'task') return false;
  const task = state.course.tasks[state.selected.idx];
  if(!task) return false;
  const selectedIds = Array.isArray(task._uiSelectedBlockIds) ? task._uiSelectedBlockIds : [];
  const blocks = (task.blocks || []).filter(b => selectedIds.includes(b.id));
  if(blocks.length === 0) return false;
  clipboardPut({ kind: 'blocks', data: blocks.map(b => JSON.parse(JSON.stringify(b))) });
  toast(blocks.length + ' Block' + (blocks.length === 1 ? '' : 'e') + ' kopiert.');
  return true;
}

import { uid as uidGen } from './util.js';

export function pasteBlocks(){
  if(state.selected.kind !== 'task') return false;
  const task = state.course.tasks[state.selected.idx];
  if(!task) return false;
  const payload = clipboardGet();
  if(!payload || payload.kind !== 'blocks' || !Array.isArray(payload.data)) {
    toast('Zwischenablage ist leer.'); return false;
  }
  pushHistory();
  const newIds = [];
  payload.data.forEach(b => {
    const copy = JSON.parse(JSON.stringify(b));
    copy.id = uidGen('b_');
    if(copy.pos){ copy.pos = Object.assign({}, copy.pos, { x: (copy.pos.x || 20) + 24, y: (copy.pos.y || 20) + 24 }); }
    task.blocks.push(copy);
    newIds.push(copy.id);
  });
  task._uiSelectedBlockIds = newIds;
  render();
  toast(payload.data.length + ' Block' + (payload.data.length === 1 ? '' : 'e') + ' eingefügt.');
  return true;
}
