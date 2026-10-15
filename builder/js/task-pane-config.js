// task-pane-config.js: Right-hand config pane: empty | multi-select | single-block form.
import { el, tProp } from './util.js';
import { state, pushHistoryDebounced, takeHistorySnap, commitHistorySnap, discardHistorySnap, getEditorLocale, setEditorLocale, renderActivePane } from './state.js';
import { renderField } from './form.js';
import { validateBlock } from './tasks.js';
import { renderTaskList } from './panes.js';
import { bulkAlign, bulkDistribute, bulkDuplicate, bulkDelete } from './task-pane-bulk.js';
import { BLOCK_HELP, commonGradedHelp } from './block-help.js';
import { t, availableLocales, localeMeta } from './i18n.js';

// Small toggle at the top of the block-config pane so the author can switch
// which content locale they are currently editing. Shown only when at least
// two locale bundles are registered.
function renderEditorLocaleToggle(){
  const codes = availableLocales();
  if(codes.length < 2) return el('span');
  const wrap = el('div', { className: 'editor-locale-toggle' });
  wrap.appendChild(el('span', { className: 'editor-locale-toggle-label', text: t('taskPane.config.editorLocale.label') }));
  const cur = getEditorLocale();
  codes.forEach(code => {
    const meta = localeMeta(code);
    const btn = el('button', {
      className: 'editor-locale-btn' + (code === cur ? ' active' : ''),
      attrs: { type: 'button', title: meta.name || code },
      text: meta.label || code.toUpperCase()
    });
    btn.addEventListener('click', () => {
      if(code === getEditorLocale()) return;
      setEditorLocale(code);
      renderActivePane();
    });
    wrap.appendChild(btn);
  });
  return wrap;
}

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
    html: '<span class="block-help-caret" aria-hidden="true"></span>' + t('taskPane.config.help.toggle')
  });
  box.appendChild(toggle);

  const body = el('div', { className: 'block-help-body' });
  body.appendChild(el('p', { className: 'block-help-summary', text: help.summary }));

  if(help.steps && help.steps.length){
    body.appendChild(el('div', { className: 'block-help-head', text: t('taskPane.config.help.stepsHead') }));
    const ol = el('ol', { className: 'block-help-list' });
    help.steps.forEach(s => {
      const li = document.createElement('li');
      li.innerHTML = s;
      ol.appendChild(li);
    });
    body.appendChild(ol);
  }
  if(help.tips && help.tips.length){
    body.appendChild(el('div', { className: 'block-help-head', text: t('taskPane.config.help.tipsHead') }));
    const ul = el('ul', { className: 'block-help-list' });
    help.tips.forEach(t => {
      const li = document.createElement('li');
      li.innerHTML = t;
      ul.appendChild(li);
    });
    body.appendChild(ul);
  }
  // Graded blocks share the sections below the block's own fields.
  const def = window.Blocks && window.Blocks.get(blockType);
  if(def && def.graded) body.appendChild(el('p', { className: 'block-help-common', text: commonGradedHelp() }));
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
  return t('taskPane.config.posLabel', {
    x: Math.round(b.pos.x),
    y: Math.round(b.pos.y),
    w: Math.round(b.pos.w),
    h: Math.round(b.pos.h)
  });
}

export function renderConfigPane(ctx){
  const { configHost } = ctx;
  configHost.innerHTML = '';
  const selBlocks = ctx.selectedBlocks();

  if(selBlocks.length === 0){
    configHost.appendChild(el('div', {
      className: 'block-config-empty',
      html: t('taskPane.config.empty.prompt') +
            '<br><span class="block-config-empty-hint">' + t('taskPane.config.empty.shortcutHint') + '</span>'
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
  head.appendChild(el('h3', {html: t('taskPane.config.multi.title') + ' <span class="multi-count-badge">' + selBlocks.length + '</span>'}));
  configHost.appendChild(head);
  configHost.appendChild(el('div', {className:'field-help', text: t('taskPane.config.multi.hint')}));

  const actions = el('div', {className:'bulk-actions'});

  const alignRow = el('div', {className:'bulk-row'});
  alignRow.appendChild(el('strong', {text: t('taskPane.config.multi.alignHead')}));
  [
    {label: t('taskPane.config.multi.alignLeft'),   fn:()=>bulkAlign(ctx, 'left')},
    {label: t('taskPane.config.multi.alignCenterX'), fn:()=>bulkAlign(ctx, 'cx')},
    {label: t('taskPane.config.multi.alignRight'), fn:()=>bulkAlign(ctx, 'right')},
    {label: t('taskPane.config.multi.alignTop'),   fn:()=>bulkAlign(ctx, 'top')},
    {label: t('taskPane.config.multi.alignCenterY'), fn:()=>bulkAlign(ctx, 'cy')},
    {label: t('taskPane.config.multi.alignBottom'),  fn:()=>bulkAlign(ctx, 'bottom')}
  ].forEach(a => {
    const b = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:a.label});
    b.addEventListener('click', a.fn);
    alignRow.appendChild(b);
  });
  actions.appendChild(alignRow);

  if(selBlocks.length >= 3){
    const distRow = el('div', {className:'bulk-row'});
    distRow.appendChild(el('strong', {text: t('taskPane.config.multi.distributeHead')}));
    const dh = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text: t('taskPane.config.multi.distributeHorizontal')});
    dh.addEventListener('click', () => bulkDistribute(ctx, 'h'));
    const dv = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text: t('taskPane.config.multi.distributeVertical')});
    dv.addEventListener('click', () => bulkDistribute(ctx, 'v'));
    distRow.appendChild(dh); distRow.appendChild(dv);
    actions.appendChild(distRow);
  }

  const commonRow = el('div', {className:'bulk-row'});
  commonRow.appendChild(el('strong', {text: t('taskPane.config.multi.actionsHead')}));
  const dupAll = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text: t('taskPane.config.multi.duplicate')});
  dupAll.addEventListener('click', () => bulkDuplicate(ctx));
  const delAll = el('button', {className:'btn btn-danger btn-sm', attrs:{type:'button'}, text: t('taskPane.config.multi.delete')});
  delAll.addEventListener('click', () => bulkDelete(ctx));
  commonRow.appendChild(dupAll); commonRow.appendChild(delAll);
  actions.appendChild(commonRow);
  configHost.appendChild(actions);
}

function renderSingleBlockPane(ctx, sel){
  const { configHost } = ctx;
  const def = window.Blocks.get(sel.type);
  const headBlock = el('div', {className:'block-config-head'});
  headBlock.appendChild(el('h3', {text: t('taskPane.config.single.title', { label: (def && tProp(def, 'label')) || sel.type })}));
  const meta = el('span', {className:'block-config-meta', text: posLabel(sel)});
  headBlock.appendChild(meta);
  configHost.appendChild(headBlock);
  configHost.appendChild(renderEditorLocaleToggle());

  if(!def){
    configHost.appendChild(el('div', {className:'block-edit-error', text: t('taskPane.config.single.unknownType', { type: sel.type })}));
    return;
  }

  if(!sel.config) sel.config = def.defaultConfig ? def.defaultConfig(getEditorLocale()) : {};

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
      sel.config = def.defaultConfig ? def.defaultConfig(getEditorLocale()) : {};
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

  const schema = (def.builderSchema ? def.builderSchema() : []).slice();
  // Every graded block gets the shared fields: the "lock answer after check"
  // override (tri-state like the regenerate fields: "" inherits the course
  // default from Kopfdaten), a block timer, and attempts / hint / worked
  // solution (read by runtime.js helpConfig).
  if(def.graded){
    const u = window.BlockUtils;
    const courseOn = !!(state.course && state.course.lockAnswersAfterCheck);
    schema.push({ key:'lockAnswers', label:t('taskPane.config.single.lockAnswersLabel'), type:'select',
      help:t('taskPane.config.single.lockAnswersHelp'),
      options: [
        { value:'',    label:u.t('utils.regen.inherit', { state: courseOn ? u.t('utils.regen.on') : u.t('utils.regen.off') }) },
        { value:'on',  label:u.t('utils.regen.on') },
        { value:'off', label:u.t('utils.regen.off') }
      ] });
    // Per-block countdown; runs only while the block's task/tab is shown and
    // locks the block's answers at 0.
    const timerOn = c => !!c.timerEnabled;
    schema.push(
      { key:'timerEnabled', label:t('taskPane.config.single.timerEnabledLabel'), type:'boolean',
        help:t('taskPane.config.single.timerEnabledHelp') },
      { key:'timerMinutes', label:t('taskPane.config.single.timerMinutes'), type:'number', step:1, min:0, showIf: timerOn },
      { key:'timerSeconds', label:t('taskPane.config.single.timerSeconds'), type:'number', step:1, min:0, max:59, showIf: timerOn }
    );
    // Attempts, hint and worked solution (runtime.js: helpConfig).
    const attemptsOn = c => !!c.attemptsLimit;
    const hintOn = c => !!c.hintEnabled;
    const solOn = c => !!c.solutionEnabled;
    schema.push(
      { type:'section', key:'_sec_help', label:t('taskPane.config.support.section') },
      { key:'attemptsLimit', label:t('taskPane.config.support.attemptsLimit'), type:'boolean', help:t('taskPane.config.support.attemptsLimitHelp') },
      { key:'maxAttempts', label:t('taskPane.config.support.maxAttempts'), type:'number', step:1, min:1, placeholder:'3', showIf: attemptsOn },
      { key:'attemptPenalty', label:t('taskPane.config.support.attemptPenalty'), type:'number', step:5, min:0, max:100, placeholder:'0',
        help:t('taskPane.config.support.attemptPenaltyHelp'), showIf: attemptsOn },
      { key:'hintEnabled', label:t('taskPane.config.support.hintEnabled'), type:'boolean', help:t('taskPane.config.support.hintEnabledHelp') },
      { key:'hintText', label:t('taskPane.config.support.hintText'), type:'math-textarea', rows:3, showIf: hintOn },
      { key:'hintAfter', label:t('taskPane.config.support.hintAfter'), type:'number', step:1, min:0, placeholder:'1', showIf: hintOn },
      { key:'hintPenalty', label:t('taskPane.config.support.hintPenalty'), type:'number', step:0.25, min:0, placeholder:'0', showIf: hintOn },
      { key:'solutionEnabled', label:t('taskPane.config.support.solutionEnabled'), type:'boolean', help:t('taskPane.config.support.solutionEnabledHelp') },
      { key:'solutionText', label:t('taskPane.config.support.solutionText'), type:'math-textarea', rows:4, showIf: solOn },
      { key:'solutionAfter', label:t('taskPane.config.support.solutionAfter'), type:'number', step:1, min:1,
        placeholder:t('taskPane.config.support.solutionAfterPlaceholder'), showIf: solOn },
      { key:'solutionWhenCorrect', label:t('taskPane.config.support.solutionWhenCorrect'), type:'boolean', showIf: solOn }
    );
  }
  if(schema.length === 0){
    configHost.appendChild(el('div', {className:'field-help', text: t('taskPane.config.single.noSchema')}));
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
    box.appendChild(el('div', {className:'config-warnings-title', text: t('taskPane.config.warnings.title', { n: warnings.length })}));
    warnings.forEach(w => box.appendChild(el('div', {className:'config-warnings-item', text: t('taskPane.config.warnings.item', { msg: w })})));
    configHost.appendChild(box);
  }
}
