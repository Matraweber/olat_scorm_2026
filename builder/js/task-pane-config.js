// task-pane-config.js: Right-hand config pane: empty | multi-select | single-block form.
import { el } from './util.js';
import { pushHistoryDebounced, takeHistorySnap, commitHistorySnap, discardHistorySnap } from './state.js';
import { renderField } from './form.js';
import { validateBlock } from './tasks.js';
import { renderTaskList } from './panes.js';
import { bulkAlign, bulkDistribute, bulkDuplicate, bulkDelete } from './task-pane-bulk.js';
import { BLOCK_HELP } from './block-help.js';

const HELP_COLLAPSED_KEY = 'scorm-builder-block-help-collapsed';

function isHelpCollapsed(blockType){
  try {
    const raw = localStorage.getItem(HELP_COLLAPSED_KEY);
    if(!raw) return false;
    const set = JSON.parse(raw);
    return Array.isArray(set) && set.includes(blockType);
  } catch{ return false; }
}
function setHelpCollapsed(blockType, collapsed){
  try {
    const raw = localStorage.getItem(HELP_COLLAPSED_KEY);
    let set = [];
    if(raw){ try { set = JSON.parse(raw); } catch{} }
    if(!Array.isArray(set)) set = [];
    const i = set.indexOf(blockType);
    if(collapsed && i < 0) set.push(blockType);
    if(!collapsed && i >= 0) set.splice(i, 1);
    localStorage.setItem(HELP_COLLAPSED_KEY, JSON.stringify(set));
  } catch{}
}

function renderBlockHelp(blockType){
  const help = BLOCK_HELP[blockType];
  if(!help) return null;
  const collapsed = isHelpCollapsed(blockType);
  const box = el('section', { className: 'block-help' + (collapsed ? ' is-collapsed' : '') });

  const toggle = el('button', {
    className: 'block-help-toggle',
    attrs: { type: 'button', 'aria-expanded': String(!collapsed) },
    html: '<span class="block-help-caret" aria-hidden="true"></span>Was ist das?'
  });
  box.appendChild(toggle);

  const body = el('div', { className: 'block-help-body' });
  body.appendChild(el('p', { className: 'block-help-summary', text: help.summary }));

  if(help.steps && help.steps.length){
    body.appendChild(el('div', { className: 'block-help-head', text: 'Schritte' }));
    const ol = el('ol', { className: 'block-help-list' });
    help.steps.forEach(s => {
      const li = document.createElement('li');
      li.innerHTML = s;
      ol.appendChild(li);
    });
    body.appendChild(ol);
  }
  if(help.tips && help.tips.length){
    body.appendChild(el('div', { className: 'block-help-head', text: 'Tipps' }));
    const ul = el('ul', { className: 'block-help-list' });
    help.tips.forEach(t => {
      const li = document.createElement('li');
      li.innerHTML = t;
      ul.appendChild(li);
    });
    body.appendChild(ul);
  }
  box.appendChild(body);

  toggle.addEventListener('click', () => {
    const nowCollapsed = !box.classList.contains('is-collapsed');
    box.classList.toggle('is-collapsed', nowCollapsed);
    toggle.setAttribute('aria-expanded', String(!nowCollapsed));
    setHelpCollapsed(blockType, nowCollapsed);
  });
  return box;
}

export function posLabel(b){
  return 'Position ' + Math.round(b.pos.x) + ', ' + Math.round(b.pos.y) +
         ' · Größe ' + Math.round(b.pos.w) + '×' + Math.round(b.pos.h);
}

export function renderConfigPane(ctx){
  const { configHost } = ctx;
  configHost.innerHTML = '';
  const selBlocks = ctx.selectedBlocks();

  if(selBlocks.length === 0){
    configHost.appendChild(el('div', {
      className: 'block-config-empty',
      html: 'Wählen Sie einen Block auf der Canvas, um ihn zu bearbeiten.' +
            '<br><span class="block-config-empty-hint"><kbd>?</kbd> öffnet alle Tastaturkürzel.</span>'
    }));
    return;
  }

  if(selBlocks.length > 1){
    renderMultiSelectPane(ctx, selBlocks);
    return;
  }

  renderSingleBlockPane(ctx, selBlocks[0]);
}

function renderMultiSelectPane(ctx, selBlocks){
  const { configHost } = ctx;
  const head = el('div', {className:'block-config-head'});
  head.appendChild(el('h3', {html: 'Mehrfachauswahl <span class="multi-count-badge">' + selBlocks.length + '</span>'}));
  configHost.appendChild(head);
  configHost.appendChild(el('div', {className:'field-help', text:'Aktion für alle markierten Blöcke wählen.'}));

  const actions = el('div', {className:'bulk-actions'});

  const alignRow = el('div', {className:'bulk-row'});
  alignRow.appendChild(el('strong', {text:'Ausrichten'}));
  [
    {label:'⟸ Links',   fn:()=>bulkAlign(ctx, 'left')},
    {label:'⇔ Mitte X', fn:()=>bulkAlign(ctx, 'cx')},
    {label:'Rechts ⟹', fn:()=>bulkAlign(ctx, 'right')},
    {label:'⤒ Oben',   fn:()=>bulkAlign(ctx, 'top')},
    {label:'⇕ Mitte Y', fn:()=>bulkAlign(ctx, 'cy')},
    {label:'Unten ⤓',  fn:()=>bulkAlign(ctx, 'bottom')}
  ].forEach(a => {
    const b = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:a.label});
    b.addEventListener('click', a.fn);
    alignRow.appendChild(b);
  });
  actions.appendChild(alignRow);

  if(selBlocks.length >= 3){
    const distRow = el('div', {className:'bulk-row'});
    distRow.appendChild(el('strong', {text:'Verteilen (gleicher Abstand)'}));
    const dh = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Horizontal'});
    dh.addEventListener('click', () => bulkDistribute(ctx, 'h'));
    const dv = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Vertikal'});
    dv.addEventListener('click', () => bulkDistribute(ctx, 'v'));
    distRow.appendChild(dh); distRow.appendChild(dv);
    actions.appendChild(distRow);
  }

  const commonRow = el('div', {className:'bulk-row'});
  commonRow.appendChild(el('strong', {text:'Aktionen'}));
  const dupAll = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'⧉ Duplizieren'});
  dupAll.addEventListener('click', () => bulkDuplicate(ctx));
  const delAll = el('button', {className:'btn btn-danger btn-sm', attrs:{type:'button'}, text:'✕ Löschen'});
  delAll.addEventListener('click', () => bulkDelete(ctx));
  commonRow.appendChild(dupAll); commonRow.appendChild(delAll);
  actions.appendChild(commonRow);
  configHost.appendChild(actions);
}

function renderSingleBlockPane(ctx, sel){
  const { configHost } = ctx;
  const def = window.Blocks.get(sel.type);
  const headBlock = el('div', {className:'block-config-head'});
  headBlock.appendChild(el('h3', {text: 'Konfiguration: ' + ((def && def.label) || sel.type)}));
  const meta = el('span', {className:'block-config-meta', text: posLabel(sel)});
  headBlock.appendChild(meta);
  configHost.appendChild(headBlock);

  if(!def){
    configHost.appendChild(el('div', {className:'block-edit-error', text: 'Block-Typ "' + sel.type + '" ist nicht registriert.'}));
    return;
  }

  if(!sel.config) sel.config = def.defaultConfig ? def.defaultConfig() : {};

  const helpBox = renderBlockHelp(sel.type);
  if(helpBox) configHost.appendChild(helpBox);

  // Actions from `type:'action'` buttons in builderSchema():
  //   reset             : restore defaultConfig()
  //   add-shape:<type>  : push def.newShape(type) into sel.config.shapes
  const prevHandler = configHost._blockActionHandler;
  if(prevHandler) configHost.removeEventListener('block-field-action', prevHandler);
  const actionHandler = e => {
    const action = e.detail && e.detail.action;
    if(!action) return;
    if(action === 'reset'){
      // Snapshot before the mutation so a single Ctrl+Z reverts it.
      pushHistoryDebounced();
      sel.config = def.defaultConfig ? def.defaultConfig() : {};
      ctx.scheduleBlockPreviewRefresh(sel);
      renderTaskList();
      renderConfigPane(ctx);
      return;
    }
    if(action.indexOf('add-shape:') === 0 && typeof def.newShape === 'function'){
      const shapeType = action.slice('add-shape:'.length);
      sel.config.shapes = Array.isArray(sel.config.shapes) ? sel.config.shapes : [];
      pushHistoryDebounced();
      sel.config.shapes.push(def.newShape(shapeType));
      ctx.scheduleBlockPreviewRefresh(sel);
      renderConfigPane(ctx);
      return;
    }
    // Block-defined custom action; def.applyAction(action, cfg) -> bool.
    // Snapshot before; commit only if the action actually mutated.
    if(typeof def.applyAction === 'function'){
      takeHistorySnap();
      const handled = def.applyAction(action, sel.config);
      if(handled){
        commitHistorySnap();
        ctx.scheduleBlockPreviewRefresh(sel);
        renderConfigPane(ctx);
      } else {
        discardHistorySnap();
      }
    }
  };
  configHost._blockActionHandler = actionHandler;
  configHost.addEventListener('block-field-action', actionHandler);

  const schema = def.builderSchema ? def.builderSchema() : [];
  if(schema.length === 0){
    configHost.appendChild(el('div', {className:'field-help', text:'Dieser Block hat keine Konfiguration.'}));
  } else {
    const topConditionals = [];
    function evalTopConditionals(){
      topConditionals.forEach(c => { c.el.style.display = c.showIf(sel.config) ? '' : 'none'; });
    }
    schema.forEach(spec => {
      const fieldEl = renderField(spec, () => sel.config, (k, v) => {
        pushHistoryDebounced();
        sel.config[k] = v;
        ctx.scheduleBlockPreviewRefresh(sel);
        renderTaskList();
        evalTopConditionals();
      });
      configHost.appendChild(fieldEl);
      if(spec.showIf) topConditionals.push({ el: fieldEl, showIf: spec.showIf });
    });
    evalTopConditionals();
  }
  const warnings = validateBlock(sel);
  if(warnings.length > 0){
    const box = el('div', {className:'config-warnings'});
    box.appendChild(el('div', {className:'config-warnings-title', text:'Hinweise (' + warnings.length + ')'}));
    warnings.forEach(w => box.appendChild(el('div', {className:'config-warnings-item', text:'• ' + w})));
    configHost.appendChild(box);
  }
}
