// tasks.js: Migration, tab helpers, validation, template management.
import { state } from './state.js';
import { uid, toast, tProp } from './util.js';
import { t, l } from './i18n.js';

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
    { title: t('tasks.defaultTab.visualization'), blocks: task.blocks || [] },
    { title: t('tasks.defaultTab.task'),         blocks: [] }
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
// Append an empty tab and make it active.
export function addTabOn(task){
  if(!hasTabs(task)) return;
  task.tabs.push({ title: t('taskPane.tabFallbackTitle', { n: task.tabs.length + 1 }), blocks: [] });
  task._uiActiveTab = task.tabs.length - 1;
  syncTaskBlocksAlias(task);
}
// Remove tab i. Closing down to a single tab turns tabs off and keeps that
// remaining tab's blocks as the task's blocks.
export function removeTabOn(task, i){
  if(!hasTabs(task) || i < 0 || i >= task.tabs.length) return;
  const active = task._uiActiveTab || 0;
  task.tabs.splice(i, 1);
  if(task.tabs.length < 2){
    task.blocks = (task.tabs[0] && task.tabs[0].blocks) || [];
    delete task.tabs;
    delete task._uiActiveTab;
    return;
  }
  // Keep the same tab active if it still exists; otherwise step left.
  task._uiActiveTab = active > i ? active - 1 : Math.min(active, task.tabs.length - 1);
  syncTaskBlocksAlias(task);
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
    blocks.push({id: uid('b_'), type: 'note-box', config: { title: task.config.noteTitle || t('tasks.defaultNoteTitle'), html: task.config.noteHtml, variant: 'info' }});
  }
  const cleanCfg = Object.assign({}, task.config || {});
  delete cleanCfg.intro; delete cleanCfg.noteTitle; delete cleanCfg.noteHtml;
  blocks.push({id: uid('b_'), type: blockType, config: cleanCfg});
  return { id: task.id || uid('t_'), title: task.title || t('tasks.defaultTitle'), blocks };
}

// Validation
export function validateBlock(block){
  const warnings = [];
  const cfg = block.config || {};
  // A block variable named like a global one hides the global value here.
  const globalNames = new Set((state.course && state.course.globalVariables || []).map(v => v && v.name).filter(Boolean));
  (Array.isArray(cfg.variables) ? cfg.variables : []).forEach(v => {
    if(v && v.name && globalNames.has(v.name)) warnings.push(t('tasks.validation.shadowsGlobalVar', { name: v.name }));
  });
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
    const label = (def && tProp(def, 'label')) || b.type;
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
    courseIssues.push({ message: t('tasks.validation.noTasks') });
  }
  const courseTitleText = l(course.courseTitle);
  if(!courseTitleText || !courseTitleText.trim()){
    courseIssues.push({ message: t('tasks.validation.emptyCourseTitle') });
  }
  validateGlobalVars(course).forEach(message => courseIssues.push({ message }));
  validatePools(course).forEach(message => courseIssues.push({ message }));
  tasks.forEach((task, idx) => {
    const taskTitle = l(task.title) || t('taskList.fallbackTitle', { n: idx + 1 });
    const taskIssues = validateTask(task);
    taskIssues.forEach(w => issues.push(Object.assign({ taskIdx: idx, taskTitle }, w)));
  });
  return { issues, courseIssues };
}

// Course-wide variables: valid names, no duplicates, sane range, in use.
function validateGlobalVars(course){
  const out = [];
  const defs = Array.isArray(course.globalVariables) ? course.globalVariables : [];
  const U = window.BlockUtils;
  const seen = new Set();
  defs.forEach((v, i) => {
    const name = v && String(v.name || '').trim();
    if(!name){ out.push(t('tasks.validation.globalVarNoName', { n: i + 1 })); return; }
    if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) out.push(t('tasks.validation.globalVarBadName', { name }));
    if(seen.has(name)) out.push(t('tasks.validation.globalVarDuplicate', { name }));
    seen.add(name);
    const lo = Number(v.min), hi = Number(v.max);
    if(Number.isFinite(lo) && Number.isFinite(hi) && lo > hi) out.push(t('tasks.validation.globalVarRange', { name, min: lo, max: hi }));
  });
  if(U && typeof U.globalVarsUsedBy === 'function' && seen.size){
    const used = new Set();
    (course.tasks || []).forEach(task => {
      const blocks = (task.tabs && task.tabs.length >= 2) ? task.tabs.flatMap(tb => tb.blocks || []) : (task.blocks || []);
      blocks.forEach(b => U.globalVarsUsedBy(b.config || {}, defs).forEach(n => used.add(n)));
    });
    seen.forEach(name => { if(!used.has(name)) out.push(t('tasks.validation.globalVarUnused', { name })); });
  }
  return out;
}

// Task pools: each needs a name and members; draw must not exceed them.
function validatePools(course){
  const out = [];
  (Array.isArray(course.pools) ? course.pools : []).forEach((p, i) => {
    if(!p) return;
    const name = String(p.name || '').trim() || t('tasks.validation.poolUnnamed', { n: i + 1 });
    const n = (course.tasks || []).filter(tk => tk.pool === p.id).length;
    if(!n) out.push(t('tasks.validation.poolEmpty', { name }));
    const draw = Number(p.draw);
    if(p.draw !== '' && p.draw != null && Number.isFinite(draw) && n && draw > n) out.push(t('tasks.validation.poolDrawTooBig', { name, draw, n }));
  });
  return out;
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
  catch(e){ toast(t('tasks.toast.saveTemplatesFailed', { msg: e.message }), 'error'); }
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
  catch(e){ toast(t('tasks.toast.saveBlockTemplatesFailed', { msg: e.message }), 'error'); }
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
    label: String(label || '').trim() || t('tasks.defaultTemplateLabel'),
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
  const task = JSON.parse(JSON.stringify(tpl.task || {title: t('tasks.defaultTitle'), blocks:[]}));
  task.id = uid('t_');
  if(task.tabs && Array.isArray(task.tabs) && task.tabs.length){
    task.tabs.forEach(tab => { tab.blocks = (tab.blocks || []).map(b => Object.assign({}, b, {id: uid('b_')})); });
    task._uiActiveTab = 0;
    task.blocks = task.tabs[0].blocks;
  } else {
    task.blocks = (task.blocks || []).map(b => Object.assign({}, b, {id: uid('b_')}));
  }
  return task;
}
export function captureTaskAsTemplateData(task){
  // Drop IDs; instantiateTemplate generates fresh ones.
  const cleanBlocks = arr => (arr || []).map(b => ({type: b.type, config: JSON.parse(JSON.stringify(b.config || {}))}));
  if(task.tabs && task.tabs.length){
    return { title: task.title, tabs: task.tabs.map(t => ({title: t.title, blocks: cleanBlocks(t.blocks)})) };
  }
  return { title: task.title, blocks: cleanBlocks(task.blocks) };
}
