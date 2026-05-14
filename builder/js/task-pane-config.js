// ============================================================================
// task-pane-config.js - Renders the right-hand block-configuration pane.
// Handles three states: empty selection, multi-select (bulk actions), and
// single-block edit (schema-driven config form + validation warnings).
// ============================================================================
import { el } from './util.js';
import { pushHistoryDebounced } from './state.js';
import { renderField } from './form.js';
import { validateBlock } from './tasks.js';
import { renderTaskList } from './panes.js';
import { bulkAlign, bulkDistribute, bulkDuplicate, bulkDelete } from './task-pane-bulk.js';

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
      html: 'Klicke einen Block auf der Canvas, um ihn zu bearbeiten.<br><br>' +
            '<strong>Tipps:</strong><br>' +
            '• Shift + Klick: mehrere Blöcke auswählen<br>' +
            '• Pfeiltasten: pixelweise verschieben (Shift = 10 px)<br>' +
            '• Entf: Block löschen<br>' +
            '• Strg + Mausrad: Zoom'
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
  configHost.appendChild(el('div', {className:'field-help', text:'Wähle eine Aktion für alle ausgewählten Blöcke.'}));

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
  const schema = def.builderSchema ? def.builderSchema() : [];
  if(schema.length === 0){
    configHost.appendChild(el('div', {className:'field-help', text:'Dieser Block hat keine Konfiguration.'}));
  } else {
    schema.forEach(spec => configHost.appendChild(renderField(spec, () => sel.config, (k, v) => {
      pushHistoryDebounced();
      sel.config[k] = v;
      ctx.scheduleBlockPreviewRefresh(sel);
      renderTaskList();
    })));
  }
  const warnings = validateBlock(sel);
  if(warnings.length > 0){
    const box = el('div', {className:'config-warnings'});
    box.appendChild(el('div', {className:'config-warnings-title', text:'Hinweise (' + warnings.length + ')'}));
    warnings.forEach(w => box.appendChild(el('div', {className:'config-warnings-item', text:'• ' + w})));
    configHost.appendChild(box);
  }
}
