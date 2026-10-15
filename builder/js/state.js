// state.js: Global state, defaults, history (undo/redo), clipboard.
// render/renderActivePane are set by main.js to break circular imports.
import { toast } from './util.js';
import { t } from './i18n.js';

// The default title is a fixed German literal on purpose. defaultCourse()
// runs once at module load, before main.js has registered the i18n bundles,
// so a t() call here would freeze the raw key ('state.defaultCourseTitle')
// into the state. German is the source content language of this builder;
// authors rename the course anyway.
export const DEFAULT_COURSE_TITLE = 'Neue SCORM-Lerneinheit';
export function defaultCourse(){
  return { courseTitle: DEFAULT_COURSE_TITLE, courseSubtitle: '', passThreshold: 0.5,
    regenLockAfterCheck: false, regenNoRegenerate: false, lockAnswersAfterCheck: false,
    courseTimerEnabled: false, courseTimerMinutes: 30, courseTimerSeconds: 0,
    globalVariables: [], globalVarDecimals: 2, globalVarDisplay: 'auto',
    globalRegenButton: true, globalRegenLockAfterCheck: false,
    pools: [], shrinkImages: true, tasks: [] };
}

// Repair titles written by a buggy earlier build that stored the raw i18n
// key (bundles were not registered yet when defaultCourse() ran). Applied to
// every course loaded from autosave, JSON, or ZIP. Handles both shapes:
// the plain string and multilingual wrappers whose slots carry the key
// (created when an author added a translation on top of the broken title).
// Wrappers that end up with only empty slots collapse back to ''.
const BROKEN_TITLE_KEY = 'state.defaultCourseTitle';
function repairTitleValue(v){
  // A plain broken key means the file was saved with the untouched default
  // title, so restore that default. Inside a wrapper the author had already
  // gone multilingual; clear the slot and let the other locale show through.
  if(v === BROKEN_TITLE_KEY) return DEFAULT_COURSE_TITLE;
  if(v != null && typeof v === 'object' && v.__i18n === true){
    let hasText = false;
    for(const k of Object.keys(v)){
      if(k === '__i18n') continue;
      if(v[k] === BROKEN_TITLE_KEY) v[k] = '';
      if(v[k] != null && v[k] !== '') hasText = true;
    }
    if(!hasText) return '';
  }
  return v;
}
export function repairCourse(c){
  if(c) c.courseTitle = repairTitleValue(c.courseTitle);
  return c;
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
const EDITOR_LOCALE_KEY    = 'scorm-builder-editor-language';

// Editor locale controls which language the author is currently writing into
// for multilingual content fields. Separate from the chrome locale (which UI
// language the builder shows). Defaults to 'de' on first boot; persisted in
// localStorage so it survives reloads.
let _editorLocale = null;
export function getEditorLocale(){
  if(_editorLocale) return _editorLocale;
  try {
    const stored = localStorage.getItem(EDITOR_LOCALE_KEY);
    if(stored){ _editorLocale = stored; return _editorLocale; }
  } catch{}
  _editorLocale = 'de';
  return _editorLocale;
}
export function setEditorLocale(code){
  if(!code) return;
  _editorLocale = code;
  try { localStorage.setItem(EDITOR_LOCALE_KEY, code); } catch{}
}

export function mergeTheme(theme){
  return Object.assign(defaultTheme(), theme || {});
}

export function loadPersistentTheme(){
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? mergeTheme(JSON.parse(raw)) : defaultTheme();
  } catch{
    return defaultTheme();
  }
}

export function savePersistentTheme(theme){
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(mergeTheme(theme)));
    return true;
  } catch{
    return false;
  }
}

export function clearPersistentTheme(){
  try { localStorage.removeItem(THEME_STORAGE_KEY); }
  catch{}
}

// Push theme colors onto :root so the builder UI updates live.
export function applyThemeToBuilder(theme){
  const t = mergeTheme(theme);
  const r = document.documentElement;
  if(!r || !r.style) return;
  if(t.primaryColor)     r.style.setProperty('--primary',      t.primaryColor);
  if(t.primaryLight)     r.style.setProperty('--primary-light', t.primaryLight);
  if(t.accentColor)      r.style.setProperty('--accent',       t.accentColor);
  if(t.accentDarkColor)  r.style.setProperty('--accent-dark',  t.accentDarkColor);
}

// Autosave to localStorage. main.js offers restore on next load.
let _autosaveTimer = null;
let _onAutosave = null;
let _onAutosavePending = null;

export function setAutosaveListener(fn){ _onAutosave = typeof fn === 'function' ? fn : null; }
export function setAutosavePendingListener(fn){ _onAutosavePending = typeof fn === 'function' ? fn : null; }

// "Dirty relative to the loaded SCORM file": set on any edit, cleared when the
// file is written back (Ctrl+S, export to handle, auto-save-on-switch) or when
// a file is freshly loaded. localStorage autosave is separate and always on.
let _fileDirty = false;
export function isCourseDirty(){ return _fileDirty; }
export function markCourseSavedToFile(){ _fileDirty = false; }

// True if the course has any task or a non-default title.
export function courseHasContent(c){
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
    const c = repairCourse(JSON.parse(raw));
    return courseHasContent(c);
  } catch{ return false; }
}

export function loadAutosave(){
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    return raw ? repairCourse(JSON.parse(raw)) : null;
  } catch{ return null; }
}

export function loadAutosaveMeta(){
  try {
    const raw = localStorage.getItem(AUTOSAVE_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch{ return null; }
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
    if(_onAutosave) try { _onAutosave({ ts }); } catch{}
  } catch{
    // Quota exceeded / private mode: ignore. Manual ZIP export still works.
  }
}

export function clearAutosave(){
  try { localStorage.removeItem(AUTOSAVE_KEY); localStorage.removeItem(AUTOSAVE_META_KEY); } catch{}
}

// Debounced: 800 ms idle = one write. Main.js flushes on unload.
export function scheduleAutosave(){
  _fileDirty = true;
  if(!_autosaveTimer && _onAutosavePending){
    try { _onAutosavePending(); } catch{}
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

// Stubs until main.js wires the real render functions.
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
  } catch(e){ toast(t('state.toast.undoFailed', { msg: e.message }), 'error'); }
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
  if(history.past.length === 0){ toast(t('state.toast.nothingToUndo')); return; }
  history.future.push(snapshotState());
  applySnapshot(history.past.pop());
  scheduleAutosave();
  toast(t('state.toast.undone'));
}
export function redo(){
  if(history.future.length === 0){ toast(t('state.toast.nothingToRedo')); return; }
  history.past.push(snapshotState());
  applySnapshot(history.future.pop());
  scheduleAutosave();
  toast(t('state.toast.redone'));
}

// Clipboard for blocks, persisted via localStorage.
const CLIPBOARD_KEY = 'scorm-builder-clipboard';
function clipboardPut(payload){ try { localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(payload)); } catch{} }
function clipboardGet(){
  try { const raw = localStorage.getItem(CLIPBOARD_KEY); return raw ? JSON.parse(raw) : null; }
  catch{ return null; }
}

export function copySelectedBlocks(){
  if(state.selected.kind !== 'task') return false;
  const task = state.course.tasks[state.selected.idx];
  if(!task) return false;
  const selectedIds = Array.isArray(task._uiSelectedBlockIds) ? task._uiSelectedBlockIds : [];
  const blocks = (task.blocks || []).filter(b => selectedIds.includes(b.id));
  if(blocks.length === 0) return false;
  clipboardPut({ kind: 'blocks', data: blocks.map(b => JSON.parse(JSON.stringify(b))) });
  toast(t(blocks.length === 1 ? 'state.toast.blocksCopiedSingular' : 'state.toast.blocksCopiedPlural', { n: blocks.length }));
  return true;
}

import { uid as uidGen } from './util.js';

export function pasteBlocks(){
  if(state.selected.kind !== 'task') return false;
  const task = state.course.tasks[state.selected.idx];
  if(!task) return false;
  const payload = clipboardGet();
  if(!payload || payload.kind !== 'blocks' || !Array.isArray(payload.data)) {
    toast(t('state.toast.clipboardEmpty')); return false;
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
  toast(t(payload.data.length === 1 ? 'state.toast.blocksPastedSingular' : 'state.toast.blocksPastedPlural', { n: payload.data.length }));
  return true;
}
