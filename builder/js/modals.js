// ============================================================================
// modals.js - Block-type picker, task-create (Baukasten + Vorlagen),
// save-template, preview modal open/close logic.
// ============================================================================
import { el, uid, toast } from './util.js';
import { state, pushHistory, render } from './state.js';
import { instantiateTemplate, captureTaskAsTemplateData, saveUserTemplates } from './tasks.js';

// ===== Task-create modal (Baukasten / Vorlagen) =====
export function openTaskCreateModal(){
  document.querySelectorAll('#taskCreateModal .modal-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#taskCreateModal .modal-tab').forEach(t => t.classList.toggle('active', t === tab));
      const which = tab.dataset.tab;
      document.getElementById('taskCreatePanelEmpty').classList.toggle('hidden', which !== 'empty');
      document.getElementById('taskCreatePanelTemplates').classList.toggle('hidden', which !== 'templates');
    };
  });
  document.querySelectorAll('#taskCreateModal .modal-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.getElementById('taskCreatePanelEmpty').classList.remove('hidden');
  document.getElementById('taskCreatePanelTemplates').classList.add('hidden');

  document.getElementById('btnCreateEmpty').onclick = () => {
    pushHistory();
    const newTask = { id: uid('t_'), title: 'Aufgabe ' + (state.course.tasks.length + 1), blocks: [] };
    state.course.tasks.push(newTask);
    state.selected = {kind:'task', idx: state.course.tasks.length - 1};
    document.getElementById('taskCreateModal').classList.add('hidden');
    render();
  };

  renderTemplateLists();
  document.getElementById('taskCreateModal').classList.remove('hidden');
}

function renderTemplateLists(){
  const builtinHost = document.getElementById('builtinTemplateList');
  const userHost = document.getElementById('userTemplateList');
  builtinHost.innerHTML = '';
  userHost.innerHTML = '';

  const builtin = (window.BUILTIN_TEMPLATES || []).slice();
  builtin.sort((a,b) => (a.category || '').localeCompare(b.category || '') || a.label.localeCompare(b.label));
  builtin.forEach(tpl => builtinHost.appendChild(makeTemplateCard(tpl, false)));
  if(builtin.length === 0){
    builtinHost.appendChild(el('div', {className:'template-empty', text:'Keine eingebauten Vorlagen verfügbar.'}));
  }

  if(state.userTemplates.length === 0){
    userHost.appendChild(el('div', {className:'template-empty', text:'Du hast noch keine eigenen Vorlagen. Beim Bearbeiten einer Aufgabe kannst du sie über „★ Als Vorlage speichern" sichern.'}));
  } else {
    state.userTemplates.forEach(tpl => userHost.appendChild(makeTemplateCard(tpl, true)));
  }
}

function makeTemplateCard(tpl, isUser){
  const card = el('div', {className:'template-card'});
  if(tpl.category) card.appendChild(el('span', {className:'tpl-cat', text: tpl.category}));
  card.appendChild(el('span', {className:'tpl-label', text: tpl.label}));
  if(tpl.description) card.appendChild(el('span', {className:'tpl-desc', text: tpl.description}));
  const tplTask = tpl.task || {};
  const blockCount = (tplTask.tabs && tplTask.tabs.length)
    ? tplTask.tabs.reduce((n, t) => n + ((t.blocks || []).length), 0)
    : (tplTask.blocks ? tplTask.blocks.length : 0);
  card.appendChild(el('span', {className:'tpl-desc', text: blockCount + ' Block' + (blockCount === 1 ? '' : 'e') + (tplTask.tabs ? ' · ' + tplTask.tabs.length + ' Tabs' : '')}));

  const actions = el('div', {className:'tpl-actions'});
  const useBtn = el('button', {className:'btn btn-primary btn-sm', attrs:{type:'button'}, text:'Einfügen'});
  useBtn.addEventListener('click', () => {
    pushHistory();
    const newTask = instantiateTemplate(tpl);
    state.course.tasks.push(newTask);
    state.selected = {kind:'task', idx: state.course.tasks.length - 1};
    document.getElementById('taskCreateModal').classList.add('hidden');
    render();
    toast('Vorlage „' + tpl.label + '" eingefügt.');
  });
  actions.appendChild(useBtn);
  if(isUser){
    const renameBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Umbenennen'});
    renameBtn.addEventListener('click', e => {
      e.stopPropagation();
      const newName = prompt('Neuer Name für die Vorlage:', tpl.label);
      if(!newName) return;
      tpl.label = newName.trim();
      saveUserTemplates();
      renderTemplateLists();
    });
    const delBtn = el('button', {className:'btn btn-danger btn-sm', attrs:{type:'button'}, text:'Löschen'});
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      if(!confirm('Vorlage „' + tpl.label + '" wirklich löschen?')) return;
      const i = state.userTemplates.findIndex(x => x.id === tpl.id);
      if(i >= 0){ state.userTemplates.splice(i, 1); saveUserTemplates(); renderTemplateLists(); }
    });
    actions.appendChild(renameBtn);
    actions.appendChild(delBtn);
  }
  card.appendChild(actions);
  return card;
}

// ===== Save-template modal =====
export function openSaveTemplateModal(task){
  const blocks = task.blocks || [];
  if(blocks.length === 0){ toast('Diese Aufgabe enthält keine Blöcke.', 'warn'); return; }
  const m = document.getElementById('saveTemplateModal');
  document.getElementById('saveTplName').value = task.title || 'Meine Vorlage';
  document.getElementById('saveTplDesc').value = '';
  document.getElementById('saveTplCat').value = 'Eigene';
  document.getElementById('btnSaveTplConfirm').onclick = () => {
    const name = document.getElementById('saveTplName').value.trim();
    if(!name){ toast('Name darf nicht leer sein.', 'error'); return; }
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
    toast('Vorlage „' + name + '" gespeichert.');
  };
  m.classList.remove('hidden');
}

// ===== Block-type modal =====
export function openBlockTypeModal(onPick){
  const list = document.getElementById('blockTypeList');
  list.innerHTML = '';
  const all = window.Blocks.all().slice().sort((a,b) => (a.category || '').localeCompare(b.category || '') || a.label.localeCompare(b.label));
  const byCat = {};
  all.forEach(def => { (byCat[def.category || 'Allgemein'] = byCat[def.category || 'Allgemein'] || []).push(def); });
  Object.keys(byCat).forEach(cat => {
    const head = el('h3', {text: cat, style:{margin:'0.6rem 0 0.4rem', color:'var(--primary)', fontSize:'1rem', gridColumn:'1 / -1'}});
    list.appendChild(head);
    byCat[cat].forEach(def => {
      const card = el('button', {className:'task-type-card', attrs:{type:'button'}});
      const cardHead = el('div', {className:'ttc-head'});
      const ico = el('span', {className:'ttc-icon', text: def.icon || '◻'});
      cardHead.appendChild(ico);
      const titleWrap = el('div', {className:'ttc-titlewrap'});
      titleWrap.appendChild(el('span', {className:'ttc-label', text: def.label}));
      if(def.graded) titleWrap.appendChild(el('span', {className:'ttc-cat', text:'gewertet'}));
      cardHead.appendChild(titleWrap);
      card.appendChild(cardHead);
      if(def.description) card.appendChild(el('span', {className:'ttc-desc', text: def.description}));
      card.addEventListener('click', () => {
        document.getElementById('blockTypeModal').classList.add('hidden');
        onPick(def.id);
      });
      list.appendChild(card);
    });
  });
  document.getElementById('blockTypeModal').classList.remove('hidden');
}
