// ============================================================================
// tasks.js: Task data manipulation: migration, tab helpers, validation,
//            template management (built-in & user-defined).
// ============================================================================
import { state } from './state.js';
import { uid, toast } from './util.js';

// ----- Tab helpers --------------------------------------------------------
// When `task.tabs` exists with >=2 entries, `task.blocks` is kept as a
// *reference alias* to `task.tabs[activeTab].blocks` so all existing code
// paths (which read/write task.blocks) continue to work unchanged.
export function hasTabs(task){
  return task && Array.isArray(task.tabs) && task.tabs.length >= 2;
}
export function syncTaskBlocksAlias(task){
  if(!hasTabs(task)) return;
  const i = (task._uiActiveTab != null) ? task._uiActiveTab : 0;
  task._uiActiveTab = Math.max(0, Math.min(task.tabs.length - 1, i));
  task.tabs[task._uiActiveTab].blocks = task.tabs[task._uiActiveTab].blocks || [];
  task.blocks = task.tabs[task._uiActiveTab].blocks; // alias, same array reference
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
  // Strip UI-only fields and avoid double-serializing task.blocks when tabs exist
  const copy = JSON.parse(JSON.stringify(task));
  delete copy._uiSelectedBlockIds; delete copy._uiZoom; delete copy._uiActiveTab;
  const stripFlags = (arr) => (arr || []).forEach(b => { delete b._needsAutofit; });
  stripFlags(copy.blocks);
  if(copy.tabs) copy.tabs.forEach(t => stripFlags(t.blocks));
  if(hasTabs(copy)){
    delete copy.blocks; // alias would otherwise duplicate tabs[0].blocks
  }
  return copy;
}

// ----- Migration of legacy single-task model into block-based -----------
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

// ----- Validation --------------------------------------------------------
export function validateBlock(block){
  const warnings = [];
  const cfg = block.config || {};
  switch(block.type){
    case 'multiple-choice':
      if(cfg.preset && cfg.preset !== 'custom') break;
      if(!cfg.question || !String(cfg.question).trim()) warnings.push('Frage ist leer.');
      if(!Array.isArray(cfg.choices) || cfg.choices.length < 2) warnings.push('Mindestens zwei Antwortmöglichkeiten erforderlich.');
      else if(!cfg.choices.some(c => c.correct)) warnings.push('Keine richtige Antwort markiert.');
      else if(cfg.choices.every(c => c.correct)) warnings.push('Alle Antworten als richtig markiert.');
      break;
    case 'match-pairs':
      if(cfg.preset && cfg.preset !== 'custom') break;
      if(!Array.isArray(cfg.pairs) || cfg.pairs.length < 2) warnings.push('Mindestens zwei Paare erforderlich.');
      else if(cfg.pairs.some(p => !p.left || !p.right)) warnings.push('Mindestens ein Paar hat eine leere Seite.');
      break;
    case 'numeric-input':
      if(cfg.preset && cfg.preset !== 'custom') break;
      if(!cfg.questionTemplate || !String(cfg.questionTemplate).trim()) warnings.push('Frage-Vorlage fehlt.');
      if(!cfg.formula || !String(cfg.formula).trim()) warnings.push('Lösungsformel fehlt.');
      break;
    case 'text-input':
      if(!cfg.question || !String(cfg.question).trim()) warnings.push('Frage ist leer.');
      if(!Array.isArray(cfg.answers) || cfg.answers.length === 0 || cfg.answers.every(a => !a.value)) warnings.push('Keine akzeptierten Antworten definiert.');
      break;
    case 'image':
      if(!cfg.src) warnings.push('Kein Bild gesetzt.');
      if(cfg.src && !cfg.alt) warnings.push('Alt-Text fehlt (Barrierefreiheit).');
      break;
    case 'cloze':
      if(cfg.preset && cfg.preset !== 'custom') break;
      if(!cfg.text || !String(cfg.text).includes('{{')) warnings.push('Keine Lücken im Text ({{Antwort}}).');
      break;
    case 'truth-table':
      if(cfg.expressionPreset && cfg.expressionPreset !== 'custom') break;
      if(!cfg.expressionPreset && (!Array.isArray(cfg.expressions) || cfg.expressions.length === 0)) break;
      if(!Array.isArray(cfg.expressions) || cfg.expressions.length === 0 || cfg.expressions.every(e => !e.expr)) warnings.push('Keine booleschen Ausdrücke definiert.');
      break;
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

// Course-level validation rolls up per-block warnings and adds course-level
// checks. Result shape:
//   { issues: [{ taskIdx, taskTitle, blockId, blockLabel, message }],
//     courseIssues: [{ message }] }
// Used by the SCORM export modal to decide whether to gate or warn the user.
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

// ----- Template (built-in & user) ---------------------------------------
const USER_TEMPLATES_KEY = 'scorm-builder-user-templates';
export function loadUserTemplates(){
  try {
    const raw = localStorage.getItem(USER_TEMPLATES_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch(e){ return []; }
}
export function saveUserTemplates(){
  try { localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(state.userTemplates)); }
  catch(e){ toast('Vorlagen konnten nicht gespeichert werden: ' + e.message, 'error'); }
}

// ----- Block-level templates ("Block-Vorlagen") -------------------------
// Each entry: { id, label, description?, blockType, config }.
// `config` is deep-cloned from the source block at save time; instantiating
// a template clones again so the new block doesn't share references.
const USER_BLOCK_TEMPLATES_KEY = 'scorm-builder-user-block-templates';
export function loadUserBlockTemplates(){
  try {
    const raw = localStorage.getItem(USER_BLOCK_TEMPLATES_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch(e){ return []; }
}
export function saveUserBlockTemplates(){
  try { localStorage.setItem(USER_BLOCK_TEMPLATES_KEY, JSON.stringify(state.userBlockTemplates || [])); }
  catch(e){ toast('Block-Vorlagen konnten nicht gespeichert werden: ' + e.message, 'error'); }
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
    // pos is set by ensurePos() when the new block is added to a task
  };
}
export function instantiateTemplate(tpl){
  // Deep-clone, generate fresh IDs for task and every block
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
  // Strip transient IDs so the task can be re-instantiated cleanly later
  const cleanBlocks = arr => (arr || []).map(b => ({type: b.type, config: JSON.parse(JSON.stringify(b.config || {}))}));
  if(task.tabs && task.tabs.length){
    return { title: task.title, tabs: task.tabs.map(t => ({title: t.title, blocks: cleanBlocks(t.blocks)})) };
  }
  return { title: task.title, blocks: cleanBlocks(task.blocks) };
}
