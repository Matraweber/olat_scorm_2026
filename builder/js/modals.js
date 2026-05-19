// ============================================================================
// modals.js: Block-type picker, task-create (Leer + Vorlagen),
// save-template, preview modal open/close logic.
// ============================================================================
import { el, uid, toast } from './util.js';
import { state, pushHistory, render } from './state.js';
import { instantiateTemplate, captureTaskAsTemplateData, saveUserTemplates } from './tasks.js';

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
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm('Vorlage "' + tpl.label + '" wirklich löschen?')) return;
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
export function openBlockTypeModal(onPick){
  const nav  = document.getElementById('blockCatNav');
  const list = document.getElementById('blockTypeList');
  nav.innerHTML  = '';
  list.innerHTML = '';

  const all = window.Blocks.all().slice().sort((a, b) =>
    (a.category || '').localeCompare(b.category || '') || a.label.localeCompare(b.label)
  );
  const byCat = {};
  all.forEach(def => {
    const cat = def.category || 'Allgemein';
    (byCat[cat] = byCat[cat] || []).push(def);
  });

  const cats = Object.keys(byCat);
  let activeCat = cats[0];

  function showCat(cat){
    activeCat = cat;
    nav.querySelectorAll('.block-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
    list.innerHTML = '';
    (byCat[cat] || []).forEach(def => {
      const row = el('button', { className: 'block-type-row', attrs: { type: 'button' } });

      const ico = el('span', { className: 'block-type-ico', text: def.icon || '?' });
      row.appendChild(ico);

      const body = el('div', { className: 'block-type-body' });
      const labelEl = el('span', { className: 'block-type-label', text: def.label });
      if (def.graded) labelEl.appendChild(el('span', { className: 'block-type-badge', text: 'gewertet' }));
      body.appendChild(labelEl);
      if (def.description) body.appendChild(el('span', { className: 'block-type-desc', text: def.description }));
      row.appendChild(body);

      row.addEventListener('click', () => {
        document.getElementById('blockTypeModal').classList.add('hidden');
        onPick(def.id);
      });
      list.appendChild(row);
    });
  }

  cats.forEach(cat => {
    const btn = el('button', {
      className: 'block-cat-btn',
      text: cat,
      attrs: { type: 'button' }
    });
    btn.dataset.cat = cat;
    btn.addEventListener('click', () => showCat(cat));
    nav.appendChild(btn);
  });

  showCat(cats[0]);
  document.getElementById('blockTypeModal').classList.remove('hidden');
}
