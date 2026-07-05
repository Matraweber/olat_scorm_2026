// modals.js: Block-type picker, task-create, save-template, preview modal.
import { el, uid, toast, confirmDialog, tProp } from './util.js';
import { state, pushHistory, render } from './state.js';
import { instantiateTemplate, captureTaskAsTemplateData, saveUserTemplates } from './tasks.js';
import { t, l } from './i18n.js';

// Task-create modal
export function openTaskCreateModal(){
  document.getElementById('btnCreateEmpty').onclick = () => {
    pushHistory();
    const newTask = { id: uid('t_'), title: '', blocks: [] };
    state.course.tasks.push(newTask);
    state.selected = { kind: 'task', idx: state.course.tasks.length - 1 };
    document.getElementById('taskCreateModal').classList.add('hidden');
    render();
  };
  renderTemplateList();
  document.getElementById('taskCreateModal').classList.remove('hidden');
}

function renderTemplateList(){
  const host = document.getElementById('templateList');
  host.innerHTML = '';

  const builtin = (typeof window.getBuiltinTemplates === 'function' ? window.getBuiltinTemplates() : (window.BUILTIN_TEMPLATES || []).slice());
  builtin.sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.label.localeCompare(b.label));

  const cats = {};
  builtin.forEach(tpl => {
    const cat = tpl.category || t('modals.categoryGeneral');
    (cats[cat] = cats[cat] || []).push(tpl);
  });

  Object.keys(cats).forEach(cat => {
    host.appendChild(el('div', { className: 'tpl-section-head', text: cat }));
    cats[cat].forEach(tpl => host.appendChild(makeTplRow(tpl, false)));
  });

  if (state.userTemplates.length > 0) {
    host.appendChild(el('div', { className: 'tpl-section-head', text: t('modals.userTemplatesHead') }));
    state.userTemplates.forEach(tpl => host.appendChild(makeTplRow(tpl, true)));
  }

  if (builtin.length === 0 && state.userTemplates.length === 0) {
    host.appendChild(el('div', { className: 'template-empty', text: t('modals.noTemplates') }));
  }
}

function makeTplRow(tpl, isUser){
  const row = el('div', { className: 'tpl-row' });

  const main = el('div', { className: 'tpl-row-main' });
  main.appendChild(el('span', { className: 'tpl-row-label', text: tpl.label }));
  if (tpl.description) main.appendChild(el('span', { className: 'tpl-row-desc', text: tpl.description }));
  row.appendChild(main);

  const insertBtn = el('button', { className: 'btn btn-primary btn-sm tpl-row-action', attrs: { type: 'button' }, text: t('modals.insert') });
  insertBtn.addEventListener('click', e => {
    e.stopPropagation();
    pushHistory();
    const newTask = instantiateTemplate(tpl);
    // Flag for the post-render autofit pass.
    const flag = (blocks) => (blocks || []).forEach(b => { b._needsAutofit = true; });
    if(newTask.tabs && newTask.tabs.length) newTask.tabs.forEach(t => flag(t.blocks));
    else flag(newTask.blocks);
    state.course.tasks.push(newTask);
    state.selected = { kind: 'task', idx: state.course.tasks.length - 1 };
    document.getElementById('taskCreateModal').classList.add('hidden');
    render();
    toast(t('modals.templateInserted', { name: tpl.label }));
  });
  row.appendChild(insertBtn);

  if (isUser) {
    const renameBtn = el('button', { className: 'btn btn-secondary btn-sm tpl-row-action', attrs: { type: 'button' }, text: t('common.rename') });
    renameBtn.addEventListener('click', e => {
      e.stopPropagation();
      const newName = prompt(t('modals.renamePrompt'), tpl.label);
      if (!newName) return;
      tpl.label = newName.trim();
      saveUserTemplates();
      renderTemplateList();
    });

    const delBtn = el('button', { className: 'btn btn-danger btn-sm tpl-row-action', attrs: { type: 'button' }, text: t('common.delete') });
    delBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if(!await confirmDialog({
        title: t('modals.deleteTemplateTitle'),
        message: t('modals.deleteTemplateMessage', { name: tpl.label }),
        confirmLabel: t('common.delete'),
        danger: true
      })) return;
      const i = state.userTemplates.findIndex(x => x.id === tpl.id);
      if (i >= 0) { state.userTemplates.splice(i, 1); saveUserTemplates(); renderTemplateList(); }
    });

    row.appendChild(renameBtn);
    row.appendChild(delBtn);
  }

  row.addEventListener('click', () => insertBtn.click());

  return row;
}

// Save-template modal
export function openSaveTemplateModal(task){
  const blocks = task.blocks || [];
  if (blocks.length === 0) { toast(t('modals.noBlocksInTask'), 'warn'); return; }
  const m = document.getElementById('saveTemplateModal');
  document.getElementById('saveTplName').value = l(task.title) || t('modals.defaultTemplateName');
  document.getElementById('saveTplDesc').value = '';
  document.getElementById('saveTplCat').value = t('modals.defaultTemplateCategory');
  document.getElementById('btnSaveTplConfirm').onclick = () => {
    const name = document.getElementById('saveTplName').value.trim();
    if (!name) { toast(t('modals.nameRequired'), 'error'); return; }
    const tpl = {
      id: uid('utpl_'),
      label: name,
      description: document.getElementById('saveTplDesc').value.trim(),
      category: document.getElementById('saveTplCat').value.trim() || t('modals.defaultTemplateCategory'),
      task: captureTaskAsTemplateData(task)
    };
    state.userTemplates.push(tpl);
    saveUserTemplates();
    m.classList.add('hidden');
    toast(t('modals.templateSaved', { name: name }));
  };
  m.classList.remove('hidden');
}

// Block-type modal. onPick gets a block-type id (string) or a saved-template object.
export function openBlockTypeModal(onPick){
  const nav    = document.getElementById('blockCatNav');
  const list   = document.getElementById('blockTypeList');
  // `search` is reassigned via cloneNode below to drop stale listeners.
  let   search = document.getElementById('blockPickerSearch');
  nav.innerHTML  = '';
  list.innerHTML = '';
  if(search) search.value = '';

  // Sort: category, then usage count DESC, then label.
  const usage = (state.blockUsage && typeof state.blockUsage === 'object') ? state.blockUsage : {};
  const useCount = (def) => usage[def.id] || 0;
  const all = window.Blocks.all().slice().sort((a, b) =>
    (tProp(a, 'category') || '').localeCompare(tProp(b, 'category') || '')
    || (useCount(b) - useCount(a))
    || tProp(a, 'label').localeCompare(tProp(b, 'label'))
  );
  const byCat = {};
  all.forEach(def => {
    const cat = tProp(def, 'category') || t('modals.categoryGeneral');
    (byCat[cat] = byCat[cat] || []).push(def);
  });

  // User block-templates: synthesize a def with isTemplate=true; renderRow routes onPick.
  const userBlockTemplates = Array.isArray(state.userBlockTemplates) ? state.userBlockTemplates : [];
  if(userBlockTemplates.length > 0){
    byCat[t('modals.userTemplatesHead')] = userBlockTemplates.map(tpl => {
      const baseDef = window.Blocks.get(tpl.blockType);
      return {
        id: tpl.id,
        label: tpl.label,
        description: tpl.description || t('modals.templateBasedOn', { base: baseDef ? tProp(baseDef, 'label') : tpl.blockType }),
        icon: baseDef ? baseDef.icon : null,
        category: t('modals.userTemplatesHead'),
        isTemplate: true,
        tpl: tpl
      };
    });
  }

  // Stable category order; unknown categories sort alphabetically at the end.
  // Categories are resolved via t('block.category.*'), so CAT_ORDER holds the
  // translated strings that tProp(def, 'category') returns.
  const tCat = (key) => (window.BlockUtils && window.BlockUtils.t) ? window.BlockUtils.t(key) : key;
  const CAT_ORDER = [
    tCat('block.category.content'),
    tCat('block.category.question'),
    tCat('block.category.mint'),
    tCat('block.category.visualization'),
    t('modals.userTemplatesHead')
  ];
  const cats = Object.keys(byCat).sort((a, b) => {
    const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b);
    if(ia !== -1 && ib !== -1) return ia - ib;
    if(ia !== -1) return -1;
    if(ib !== -1) return 1;
    return a.localeCompare(b);
  });
  let activeCat = cats[0];

  function renderRow(def){
    const row = el('button', { className: 'block-type-row', attrs: { type: 'button' } });
    if(def.isTemplate) row.classList.add('block-type-row-template');
    const ico = el('span', { className: 'block-type-ico' });
    const iconKey = def.isTemplate
      ? (window.Blocks.get(def.tpl.blockType)?.id || def.tpl.blockType)
      : def.id;
    const svgIcon = window.BlockIcons && window.BlockIcons.get(iconKey);
    if(svgIcon){ ico.innerHTML = svgIcon; }
    else { ico.textContent = def.icon || '?'; }
    row.appendChild(ico);
    const body = el('div', { className: 'block-type-body' });
    const labelEl = el('span', { className: 'block-type-label', text: tProp(def, 'label') });
    if(def.isTemplate){
      labelEl.appendChild(el('span', { className: 'block-type-badge block-type-badge-template', text: t('modals.templateBadge') }));
    } else if(def.graded){
      labelEl.appendChild(el('span', { className: 'block-type-badge', text: t('modals.gradedBadge') }));
    }
    body.appendChild(labelEl);
    const desc = tProp(def, 'description');
    if(desc) body.appendChild(el('span', { className: 'block-type-desc', text: desc }));
    row.appendChild(body);

    if(def.isTemplate){
      const del = el('button', {
        className: 'block-type-template-delete',
        attrs: { type:'button', title: t('modals.deleteTemplateAction'), 'aria-label': t('modals.deleteTemplateAction') },
        text: '✕'
      });
      del.addEventListener('click', async e => {
        e.stopPropagation();
        if(!await confirmDialog({
          title: t('modals.deleteBlockTemplateTitle'),
          message: t('modals.deleteBlockTemplateMessage', { name: tProp(def, 'label') }),
          confirmLabel: t('common.delete'),
          danger: true
        })) return;
        const idx = (state.userBlockTemplates || []).findIndex(t => t.id === def.tpl.id);
        if(idx >= 0){
          state.userBlockTemplates.splice(idx, 1);
          import('./tasks.js').then(m => m.saveUserBlockTemplates());
          openBlockTypeModal(onPick);
        }
      });
      row.appendChild(del);
    }

    row.addEventListener('click', () => {
      document.getElementById('blockTypeModal').classList.add('hidden');
      onPick(def.isTemplate ? def.tpl : def.id);
    });
    return row;
  }

  function showCat(cat){
    activeCat = cat;
    nav.querySelectorAll('.block-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
    list.innerHTML = '';
    (byCat[cat] || []).forEach(def => list.appendChild(renderRow(def)));
  }

  // Live search; empty query restores the category view.
  function applySearch(){
    if(!search) return;
    const q = search.value.trim().toLowerCase();
    if(!q){
      nav.classList.remove('search-active');
      showCat(activeCat);
      return;
    }
    nav.classList.add('search-active');
    const allRows = all.concat(byCat[t('modals.userTemplatesHead')] || []);
    const matches = allRows.filter(def => {
      const hay = (tProp(def, 'label') + ' ' + tProp(def, 'description') + ' ' + tProp(def, 'category')).toLowerCase();
      return hay.includes(q);
    });
    list.innerHTML = '';
    if(matches.length === 0){
      const empty = el('div', {
        className: 'block-picker-empty',
        text: t('modals.noBlockMatch', { query: search.value })
      });
      list.appendChild(empty);
      return;
    }
    matches.forEach(def => list.appendChild(renderRow(def)));
  }

  cats.forEach(cat => {
    const btn = el('button', {
      className: 'block-cat-btn',
      text: cat,
      attrs: { type: 'button' }
    });
    btn.dataset.cat = cat;
    btn.addEventListener('click', () => {
      if(search) search.value = '';
      nav.classList.remove('search-active');
      showCat(cat);
    });
    nav.appendChild(btn);
  });

  if(search){
    // Replace the input to drop stale listeners from a prior open.
    const fresh = search.cloneNode(true);
    search.replaceWith(fresh);
    search = fresh;
    fresh.addEventListener('input', applySearch);
    fresh.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && fresh.value){
        e.preventDefault();
        fresh.value = '';
        applySearch();
      }
      // Enter picks the first match.
      if(e.key === 'Enter'){
        const first = list.querySelector('.block-type-row');
        if(first){ e.preventDefault(); first.click(); }
      }
    });
    setTimeout(() => fresh.focus({ preventScroll: true }), 0);
  }

  showCat(cats[0]);
  document.getElementById('blockTypeModal').classList.remove('hidden');
}
