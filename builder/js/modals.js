// ============================================================================
// modals.js: Block-type picker, task-create (Leer + Vorlagen),
// save-template, preview modal open/close logic.
// ============================================================================
import { el, uid, toast, confirmDialog } from './util.js';
import { state, pushHistory, render } from './state.js';
import { instantiateTemplate, captureTaskAsTemplateData, saveUserTemplates, captureBlockAsTemplate, saveUserBlockTemplates } from './tasks.js';

// ===== Task-create modal =====
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

  const builtin = (window.BUILTIN_TEMPLATES || []).slice();
  builtin.sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.label.localeCompare(b.label));

  // Group builtin templates by category
  const cats = {};
  builtin.forEach(tpl => {
    const cat = tpl.category || 'Allgemein';
    (cats[cat] = cats[cat] || []).push(tpl);
  });

  Object.keys(cats).forEach(cat => {
    host.appendChild(el('div', { className: 'tpl-section-head', text: cat }));
    cats[cat].forEach(tpl => host.appendChild(makeTplRow(tpl, false)));
  });

  // User templates
  if (state.userTemplates.length > 0) {
    host.appendChild(el('div', { className: 'tpl-section-head', text: 'Eigene Vorlagen' }));
    state.userTemplates.forEach(tpl => host.appendChild(makeTplRow(tpl, true)));
  }

  if (builtin.length === 0 && state.userTemplates.length === 0) {
    host.appendChild(el('div', { className: 'template-empty', text: 'Keine Vorlagen verfügbar.' }));
  }
}

function makeTplRow(tpl, isUser){
  const row = el('div', { className: 'tpl-row' });

  const main = el('div', { className: 'tpl-row-main' });
  main.appendChild(el('span', { className: 'tpl-row-label', text: tpl.label }));
  if (tpl.description) main.appendChild(el('span', { className: 'tpl-row-desc', text: tpl.description }));
  row.appendChild(main);

  const insertBtn = el('button', { className: 'btn btn-primary btn-sm tpl-row-action', attrs: { type: 'button' }, text: 'Einfügen' });
  insertBtn.addEventListener('click', e => {
    e.stopPropagation();
    pushHistory();
    const newTask = instantiateTemplate(tpl);
    // Flag template-instantiated blocks so the canvas auto-fits them to actual content
    const flag = (blocks) => (blocks || []).forEach(b => { b._needsAutofit = true; });
    if(newTask.tabs && newTask.tabs.length) newTask.tabs.forEach(t => flag(t.blocks));
    else flag(newTask.blocks);
    state.course.tasks.push(newTask);
    state.selected = { kind: 'task', idx: state.course.tasks.length - 1 };
    document.getElementById('taskCreateModal').classList.add('hidden');
    render();
    toast('Vorlage "' + tpl.label + '" eingefügt.');
  });
  row.appendChild(insertBtn);

  if (isUser) {
    const renameBtn = el('button', { className: 'btn btn-secondary btn-sm tpl-row-action', attrs: { type: 'button' }, text: 'Umbenennen' });
    renameBtn.addEventListener('click', e => {
      e.stopPropagation();
      const newName = prompt('Neuer Name:', tpl.label);
      if (!newName) return;
      tpl.label = newName.trim();
      saveUserTemplates();
      renderTemplateList();
    });

    const delBtn = el('button', { className: 'btn btn-danger btn-sm tpl-row-action', attrs: { type: 'button' }, text: 'Löschen' });
    delBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if(!await confirmDialog({
        title: 'Vorlage löschen?',
        message: '„' + tpl.label + '" wird endgültig aus den Aufgaben-Vorlagen entfernt.',
        confirmLabel: 'Löschen',
        danger: true
      })) return;
      const i = state.userTemplates.findIndex(x => x.id === tpl.id);
      if (i >= 0) { state.userTemplates.splice(i, 1); saveUserTemplates(); renderTemplateList(); }
    });

    row.appendChild(renameBtn);
    row.appendChild(delBtn);
  }

  // Clicking the row itself triggers insert
  row.addEventListener('click', () => insertBtn.click());

  return row;
}

// ===== Save-template modal =====
export function openSaveTemplateModal(task){
  const blocks = task.blocks || [];
  if (blocks.length === 0) { toast('Diese Aufgabe enthält keine Blöcke.', 'warn'); return; }
  const m = document.getElementById('saveTemplateModal');
  document.getElementById('saveTplName').value = task.title || 'Meine Vorlage';
  document.getElementById('saveTplDesc').value = '';
  document.getElementById('saveTplCat').value = 'Eigene';
  document.getElementById('btnSaveTplConfirm').onclick = () => {
    const name = document.getElementById('saveTplName').value.trim();
    if (!name) { toast('Name darf nicht leer sein.', 'error'); return; }
    const tpl = {
      id: uid('utpl_'),
      label: name,
      description: document.getElementById('saveTplDesc').value.trim(),
      category: document.getElementById('saveTplCat').value.trim() || 'Eigene',
      task: captureTaskAsTemplateData(task)
    };
    state.userTemplates.push(tpl);
    saveUserTemplates();
    m.classList.add('hidden');
    toast('Vorlage "' + name + '" gespeichert.');
  };
  m.classList.remove('hidden');
}

// ===== Block-type modal =====
// `onPick` is called with either:
//   • a block-type id (string)   for built-in blocks
//   • a block-template object    for user-saved block-vorlagen
// Callers in task-pane.js inspect the shape and instantiate accordingly.
export function openBlockTypeModal(onPick){
  const nav    = document.getElementById('blockCatNav');
  const list   = document.getElementById('blockTypeList');
  // Note: `search` is reassigned below after we cloneNode-swap the element
  // to drop stale listeners from a previous modal open. Functions in this
  // closure that read `search.value` must reference the up-to-date binding.
  let   search = document.getElementById('blockPickerSearch');
  nav.innerHTML  = '';
  list.innerHTML = '';
  if(search) search.value = '';

  // Sort by category first (stable grouping in the nav), then by user
  // usage-count DESC (meistgenutzte zuerst), then alphabetically as
  // tiebreaker. `state.blockUsage` is a { type: count } map persisted in
  // localStorage and bumped each time a block is added.
  const usage = (state.blockUsage && typeof state.blockUsage === 'object') ? state.blockUsage : {};
  const useCount = (def) => usage[def.id] || 0;
  const all = window.Blocks.all().slice().sort((a, b) =>
    (a.category || '').localeCompare(b.category || '')
    || (useCount(b) - useCount(a))
    || a.label.localeCompare(b.label)
  );
  const byCat = {};
  all.forEach(def => {
    const cat = def.category || 'Allgemein';
    (byCat[cat] = byCat[cat] || []).push(def);
  });

  // Block-Vorlagen (user-saved snippets)
  // Each is represented as a synthetic "def" with `isTemplate=true` and the
  // original template object attached as `tpl`. The renderRow function
  // checks the flag and routes the click to onPick with the template object
  // instead of a block id.
  const userBlockTemplates = Array.isArray(state.userBlockTemplates) ? state.userBlockTemplates : [];
  if(userBlockTemplates.length > 0){
    byCat['Eigene Vorlagen'] = userBlockTemplates.map(tpl => {
      const baseDef = window.Blocks.get(tpl.blockType);
      return {
        id: tpl.id,
        label: tpl.label,
        description: tpl.description || ('Vorlage basiert auf: ' + (baseDef ? baseDef.label : tpl.blockType)),
        icon: baseDef ? baseDef.icon : null,
        category: 'Eigene Vorlagen',
        isTemplate: true,
        tpl: tpl
      };
    });
  }

  // Canonical category order - keeps the picker nav stable regardless of
  // block-file load order. Unknown categories (e.g. future additions) get
  // appended alphabetically at the end. "Eigene Vorlagen" lands last
  // because it only exists after the user has saved at least one snippet.
  const CAT_ORDER = ['Medien & Inhalt', 'Frage', 'MINT', 'Visualisierung', 'Eigene Vorlagen'];
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
    // For templates: use the base block's icon if available
    const iconKey = def.isTemplate
      ? (window.Blocks.get(def.tpl.blockType)?.id || def.tpl.blockType)
      : def.id;
    const svgIcon = window.BlockIcons && window.BlockIcons.get(iconKey);
    if(svgIcon){ ico.innerHTML = svgIcon; }
    else { ico.textContent = def.icon || '?'; }
    row.appendChild(ico);
    const body = el('div', { className: 'block-type-body' });
    const labelEl = el('span', { className: 'block-type-label', text: def.label });
    if(def.isTemplate){
      // Show a "Vorlage" badge so users can distinguish saved snippets
      // from built-in block types.
      labelEl.appendChild(el('span', { className: 'block-type-badge block-type-badge-template', text: 'Vorlage' }));
    } else if(def.graded){
      labelEl.appendChild(el('span', { className: 'block-type-badge', text: 'gewertet' }));
    }
    body.appendChild(labelEl);
    if (def.description) body.appendChild(el('span', { className: 'block-type-desc', text: def.description }));
    row.appendChild(body);

    // Templates also get a small "✕" delete control on hover
    if(def.isTemplate){
      const del = el('button', {
        className: 'block-type-template-delete',
        attrs: { type:'button', title:'Vorlage löschen', 'aria-label':'Vorlage löschen' },
        text: '✕'
      });
      del.addEventListener('click', async e => {
        e.stopPropagation();
        if(!await confirmDialog({
          title: 'Block-Vorlage löschen?',
          message: '„' + def.label + '" wird endgültig aus den eigenen Block-Vorlagen entfernt.',
          confirmLabel: 'Löschen',
          danger: true
        })) return;
        const idx = (state.userBlockTemplates || []).findIndex(t => t.id === def.tpl.id);
        if(idx >= 0){
          state.userBlockTemplates.splice(idx, 1);
          import('./tasks.js').then(m => m.saveUserBlockTemplates());
          // Re-render the picker so the row disappears
          openBlockTypeModal(onPick);
        }
      });
      row.appendChild(del);
    }

    row.addEventListener('click', () => {
      document.getElementById('blockTypeModal').classList.add('hidden');
      // Built-in blocks: pass the id string. Templates: pass the template
      // object so the caller can deep-clone the config.
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

  // Live search: as the user types, replace the category-filtered list with
  // a global flat list of matches. An empty query restores the category view.
  function applySearch(){
    if(!search) return;
    const q = search.value.trim().toLowerCase();
    if(!q){
      // Re-enable nav clickability and restore the active category.
      nav.classList.remove('search-active');
      showCat(activeCat);
      return;
    }
    nav.classList.add('search-active');
    // Search across built-in blocks AND user templates so both are findable.
    const allRows = all.concat(byCat['Eigene Vorlagen'] || []);
    const matches = allRows.filter(def => {
      const hay = (def.label + ' ' + (def.description || '') + ' ' + (def.category || '')).toLowerCase();
      return hay.includes(q);
    });
    list.innerHTML = '';
    if(matches.length === 0){
      const empty = el('div', {
        className: 'block-picker-empty',
        text: 'Kein Block-Typ entspricht „' + search.value + '".'
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
      // Clicking a category clears the search and shows that category.
      if(search) search.value = '';
      nav.classList.remove('search-active');
      showCat(cat);
    });
    nav.appendChild(btn);
  });

  if(search){
    // Avoid stacking listeners across modal opens by replacing the input.
    // Update the outer `search` binding so other closures (applySearch,
    // category-click handler, etc.) read from the live element.
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
    // Focus the search field on open so the user can immediately type.
    setTimeout(() => fresh.focus({ preventScroll: true }), 0);
  }

  showCat(cats[0]);
  document.getElementById('blockTypeModal').classList.remove('hidden');
}
