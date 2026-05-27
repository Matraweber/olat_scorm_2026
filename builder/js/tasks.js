// tasks.js: Migration, tab helpers, validation, template management.
import { state } from './state.js';
import { uid, toast } from './util.js';

// When tabs are on, task.blocks aliases task.tabs[activeTab].blocks so existing code paths keep working.
export function hasTabs(task){
  return task && Array.isArray(task.tabs) && task.tabs.length >= 2;
}
export function syncTaskBlocksAlias(task){
  if(!hasTabs(task)) return;
  const i = (task._uiActiveTab != null) ? task._uiActiveTab : 0;
  task._uiActiveTab = Math.max(0, Math.min(task.tabs.length - 1, i));
  task.tabs[task._uiActiveTab].blocks = task.tabs[task._uiActiveTab].blocks || [];
  task.blocks = task.tabs[task._uiActiveTab].blocks; // same array reference
}
export function enableTabsOn(task){
  if(hasTabs(task)) return;
  task.tabs = [
    { title: 'Visualisierung', blocks: task.blocks || [] },
    { title: 'Aufgabe',         blocks: [] }
  ];
  task._uiActiveTab = 0;
  task.blocks = task.tabs[0].blocks;
}
export function disableTabsOn(task){
  if(!hasTabs(task)) return;
  task.blocks = (task.tabs[0] && task.tabs[0].blocks) || [];
  delete task.tabs;
  delete task._uiActiveTab;
}
export function cleanTaskForExport(task){
  // Strip UI-only fields and the blocks alias.
  const copy = JSON.parse(JSON.stringify(task));
  delete copy._uiSelectedBlockIds; delete copy._uiZoom; delete copy._uiActiveTab;
  const stripFlags = (arr) => (arr || []).forEach(b => { delete b._needsAutofit; });
  stripFlags(copy.blocks);
  if(copy.tabs) copy.tabs.forEach(t => stripFlags(t.blocks));
  if(hasTabs(copy)){
    delete copy.blocks;
  }
  return copy;
}

// Migration of legacy single-task model into block-based
export function migrateTaskIfNeeded(task){
  if(task.tabs && Array.isArray(task.tabs)){
    task.tabs.forEach(t => { t.blocks = t.blocks || []; });
    task._uiActiveTab = task._uiActiveTab || 0;
    syncTaskBlocksAlias(task);
    return task;
  }
  if(task.blocks) return task;
  const legacyMap = {
    'complex-numbers': 'complex-question',
    'function-plot':   'function-question',
    'vector-2d':       'vector-question'
  };
  const blockType = legacyMap[task.type] || task.type;
  const blocks = [];
  if(task.config && task.config.intro){
    blocks.push({id: uid('b_'), type: 'rich-text', config: { html: '<p>' + String(task.config.intro) + '</p>' }});
  }
  if(task.config && task.config.noteHtml){
    blocks.push({id: uid('b_'), type: 'note-box', config: { title: task.config.noteTitle || 'Hinweis', html: task.config.noteHtml, variant: 'info' }});
  }
  const cleanCfg = Object.assign({}, task.config || {});
  delete cleanCfg.intro; delete cleanCfg.noteTitle; delete cleanCfg.noteHtml;
  blocks.push({id: uid('b_'), type: blockType, config: cleanCfg});
  return { id: task.id || uid('t_'), title: task.title || 'Aufgabe', blocks };
}

// Validation
export function validateBlock(block){
  const warnings = [];
  const cfg = block.config || {};
  // Blocks may declare validate(cfg) => string[]; missing = always-valid.
  const def = window.Blocks.get(block.type);
  if(def && typeof def.validate === 'function'){
    try {
      const result = def.validate(cfg);
      if(Array.isArray(result)) result.forEach(w => warnings.push(String(w)));
    } catch{}
  }
  return warnings;
}
export function validateTask(task){
  const out = [];
  const allBlocks = (task.tabs && task.tabs.length)
    ? task.tabs.flatMap(t => t.blocks || [])
    : (task.blocks || []);
  allBlocks.forEach((b, i) => {
    const def = window.Blocks && window.Blocks.get(b.type);
    const label = (def && def.label) || b.type;
    validateBlock(b).forEach(w => out.push({blockId: b.id, blockLabel: label + ' #' + (i+1), message: w}));
  });
  return out;
}

// Course-level validation. Returns { issues, courseIssues }.
export function validateCourse(course){
  const issues = [];
  const courseIssues = [];
  if(!course) return { issues, courseIssues };
  const tasks = course.tasks || [];
  if(tasks.length === 0){
    courseIssues.push({ message: 'Lerneinheit enthält keine Aufgaben.' });
  }
  if(!course.courseTitle || !String(course.courseTitle).trim()){
    courseIssues.push({ message: 'Kurstitel ist leer.' });
  }
  tasks.forEach((t, idx) => {
    const taskTitle = t.title || ('Aufgabe ' + (idx + 1));
    const taskIssues = validateTask(t);
    taskIssues.forEach(w => issues.push(Object.assign({ taskIdx: idx, taskTitle }, w)));
  });
  return { issues, courseIssues };
}

// Templates (built-in & user)
const USER_TEMPLATES_KEY = 'scorm-builder-user-templates';
export function loadUserTemplates(){
  try {
    const raw = localStorage.getItem(USER_TEMPLATES_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch{ return []; }
}
export function saveUserTemplates(){
  try { localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(state.userTemplates)); }
  catch(e){ toast('Vorlagen konnten nicht gespeichert werden: ' + e.message, 'error'); }
}

// User block templates. Shape: { id, label, description?, blockType, config }.
const USER_BLOCK_TEMPLATES_KEY = 'scorm-builder-user-block-templates';
export function loadUserBlockTemplates(){
  try {
    const raw = localStorage.getItem(USER_BLOCK_TEMPLATES_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch{ return []; }
}
export function saveUserBlockTemplates(){
  try { localStorage.setItem(USER_BLOCK_TEMPLATES_KEY, JSON.stringify(state.userBlockTemplates || [])); }
  catch(e){ toast('Block-Vorlagen konnten nicht gespeichert werden: ' + e.message, 'error'); }
}
// {blockType: count} drives "most-used first" in the picker. Bumped on every add.
const BLOCK_USAGE_KEY = 'scorm-builder-block-usage';
export function loadBlockUsage(){
  try {
    const raw = localStorage.getItem(BLOCK_USAGE_KEY);
    if(!raw) return {};
    const obj = JSON.parse(raw);
    return (obj && typeof obj === 'object') ? obj : {};
  } catch{ return {}; }
}
export function saveBlockUsage(){
  try { localStorage.setItem(BLOCK_USAGE_KEY, JSON.stringify(state.blockUsage || {})); }
  catch{}
}
export function bumpBlockUsage(type){
  if(!type) return;
  if(!state.blockUsage || typeof state.blockUsage !== 'object') state.blockUsage = {};
  state.blockUsage[type] = (state.blockUsage[type] || 0) + 1;
  saveBlockUsage();
}

export function captureBlockAsTemplate(block, label, description){
  return {
    id: uid('btpl_'),
    label: String(label || '').trim() || 'Eigene Vorlage',
    description: String(description || '').trim(),
    blockType: block.type,
    config: JSON.parse(JSON.stringify(block.config || {}))
  };
}
export function instantiateBlockTemplate(tpl){
  return {
    id: uid('b_'),
    type: tpl.blockType,
    config: JSON.parse(JSON.stringify(tpl.config || {}))
    // pos set by ensurePos() on add
  };
}
export function instantiateTemplate(tpl){
  // Deep-clone with fresh IDs for the task and every block.
  const t = JSON.parse(JSON.stringify(tpl.task || {title:'Aufgabe', blocks:[]}));
  t.id = uid('t_');
  if(t.tabs && Array.isArray(t.tabs) && t.tabs.length){
    t.tabs.forEach(tab => { tab.blocks = (tab.blocks || []).map(b => Object.assign({}, b, {id: uid('b_')})); });
    t._uiActiveTab = 0;
    t.blocks = t.tabs[0].blocks;
  } else {
    t.blocks = (t.blocks || []).map(b => Object.assign({}, b, {id: uid('b_')}));
  }
  return t;
}
export function captureTaskAsTemplateData(task){
  // Drop IDs; instantiateTemplate generates fresh ones.
  const cleanBlocks = arr => (arr || []).map(b => ({type: b.type, config: JSON.parse(JSON.stringify(b.config || {}))}));
  if(task.tabs && task.tabs.length){
    return { title: task.title, tabs: task.tabs.map(t => ({title: t.title, blocks: cleanBlocks(t.blocks)})) };
  }
  return { title: task.title, blocks: cleanBlocks(task.blocks) };
}
