// panes.js: Sidebar task list + course/theme settings panes.
// renderActivePaneImpl dispatches to course/theme/task panes; task editor in task-pane.js.
import { el, toast, confirmDialog } from './util.js';
import { state, pushHistory, render, renderActivePane, defaultTheme, savePersistentTheme, clearPersistentTheme, applyThemeToBuilder } from './state.js';
import { renderField } from './form.js';
import { renderTaskPane } from './task-pane.js';
import { renderWelcomePane } from './welcome-pane.js';

export function renderTaskList(){
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  // Hide header "+ Aufgabe" in empty-state so we don't render three CTAs at once.
  const headerAddBtn = document.getElementById('btnAddTask');
  if(headerAddBtn) headerAddBtn.hidden = state.course.tasks.length === 0;
  if(state.course.tasks.length === 0){
    const empty = el('li', { className: 'task-empty' });
    empty.innerHTML =
      '<svg class="task-empty-art" viewBox="0 0 64 48" width="56" height="42" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<rect x="6"  y="6"  width="40" height="10" rx="2" opacity="0.45"/>' +
        '<rect x="10" y="20" width="40" height="10" rx="2" opacity="0.7"/>' +
        '<rect x="14" y="34" width="40" height="10" rx="2"/>' +
      '</svg>' +
      '<p class="task-empty-title">Noch keine Aufgaben</p>' +
      '<p class="task-empty-body">Die erste Aufgabe anlegen, um Lerninhalte hinzuzufügen.</p>';
    const cta = el('button', {
      className: 'btn btn-primary btn-sm task-empty-cta',
      attrs: { type: 'button' },
      text: '+ Erste Aufgabe'
    });
    cta.addEventListener('click', () => {
      const btn = document.getElementById('btnAddTask');
      if(btn) btn.click();
    });
    empty.appendChild(cta);
    list.appendChild(empty);
    document.querySelectorAll('.sidebar-link').forEach(b => {
      b.classList.toggle('active', state.selected.kind === b.dataset.target);
    });
    return;
  }
  state.course.tasks.forEach((task, idx) => {
    const li = el('li', { attrs: { draggable: 'true' } });
    li.dataset.taskIdx = String(idx);
    const btn = el('button', {className: 'task-btn' + (state.selected.kind === 'task' && state.selected.idx === idx ? ' active' : ''), attrs:{type:'button'}});
    const titleSpan = el('span', {text: task.title || 'Aufgabe ' + (idx+1)});
    btn.appendChild(titleSpan);
    const blockCount = (task.tabs && task.tabs.length)
      ? task.tabs.reduce((n, t) => n + (t.blocks || []).length, 0)
      : (task.blocks || []).length;
    const tabSuffix = (task.tabs && task.tabs.length) ? ' · ' + task.tabs.length + ' Tabs' : '';
    btn.appendChild(el('span', {className:'task-meta', text: blockCount + ' ' + (blockCount === 1 ? 'Block' : 'Blöcke') + tabSuffix}));
    btn.addEventListener('click', () => { state.selected = {kind:'task', idx}; render(); });
    li.appendChild(btn);
    const ctrls = el('div', {className:'task-controls'});
    const up = el('button', {className:'icon-btn', attrs:{type:'button', title:'Hoch'}, text:'▲'});
    const dn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Runter'}, text:'▼'});
    const rm = el('button', {className:'icon-btn danger', attrs:{type:'button', title:'Löschen'}, text:'✕'});
    up.disabled = idx === 0; dn.disabled = idx === state.course.tasks.length - 1;
    up.addEventListener('click', () => swapTasks(idx, idx-1));
    dn.addEventListener('click', () => swapTasks(idx, idx+1));
    rm.addEventListener('click', async () => {
      if(!await confirmDialog({
        title: 'Aufgabe löschen?',
        message: '„' + (task.title || 'Aufgabe ' + (idx + 1)) + '" wird mit allen darin enthaltenen Blöcken gelöscht. Diese Aktion kann mit Strg + Z rückgängig gemacht werden.',
        confirmLabel: 'Löschen',
        danger: true
      })) return;
      pushHistory();
      state.course.tasks.splice(idx, 1);
      if(state.selected.kind === 'task'){
        if(state.course.tasks.length === 0) state.selected = {kind:'course'};
        else if(state.selected.idx >= state.course.tasks.length) state.selected = {kind:'task', idx: state.course.tasks.length - 1};
      }
      render();
    });
    ctrls.appendChild(up); ctrls.appendChild(dn); ctrls.appendChild(rm);
    li.appendChild(ctrls);
    list.appendChild(li);
  });
  installTaskDnD(list);
  document.querySelectorAll('.sidebar-link').forEach(b => {
    b.classList.toggle('active', state.selected.kind === b.dataset.target);
  });
}

// Drag-and-drop reorder for the sidebar task list.
function installTaskDnD(list){
  let fromIdx = null;
  function clearMarkers(){
    list.querySelectorAll('.drop-before, .drop-after, .dragging').forEach(el =>
      el.classList.remove('drop-before', 'drop-after', 'dragging')
    );
  }
  list.querySelectorAll('li').forEach(li => {
    // Skip the up/down/delete icon buttons.
    li.addEventListener('mousedown', (e) => {
      const onBtn = e.target.closest('.task-controls');
      li.draggable = !onBtn;
    });
    li.addEventListener('dragstart', (e) => {
      fromIdx = parseInt(li.dataset.taskIdx, 10);
      e.dataTransfer.effectAllowed = 'move';
      // Some browsers won't start a drag without setData.
      try { e.dataTransfer.setData('text/plain', String(fromIdx)); } catch(_){}
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => {
      fromIdx = null;
      clearMarkers();
    });
    li.addEventListener('dragover', (e) => {
      if(fromIdx == null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      list.querySelectorAll('.drop-before, .drop-after').forEach(el =>
        el.classList.remove('drop-before', 'drop-after')
      );
      const rect = li.getBoundingClientRect();
      const after = (e.clientY - rect.top) > rect.height / 2;
      li.classList.add(after ? 'drop-after' : 'drop-before');
    });
    li.addEventListener('drop', (e) => {
      if(fromIdx == null) return;
      e.preventDefault();
      const rect = li.getBoundingClientRect();
      const after = (e.clientY - rect.top) > rect.height / 2;
      const toIdx = parseInt(li.dataset.taskIdx, 10) + (after ? 1 : 0);
      moveTask(fromIdx, toIdx);
      fromIdx = null;
      clearMarkers();
    });
  });
}

function swapTasks(a, b){
  if(b < 0 || b >= state.course.tasks.length) return;
  pushHistory();
  [state.course.tasks[a], state.course.tasks[b]] = [state.course.tasks[b], state.course.tasks[a]];
  if(state.selected.kind === 'task'){
    if(state.selected.idx === a) state.selected.idx = b;
    else if(state.selected.idx === b) state.selected.idx = a;
  }
  render();
}

// Move `from` to post-removal index `to`. Dropping after item 3 -> to=4.
function moveTask(from, to){
  const tasks = state.course.tasks;
  if(from < 0 || from >= tasks.length) return;
  if(to === from || to === from + 1) return;
  pushHistory();
  const [moved] = tasks.splice(from, 1);
  // After splice, indices above `from` shift down by 1.
  const adjusted = to > from ? to - 1 : to;
  tasks.splice(adjusted, 0, moved);
  if(state.selected.kind === 'task'){
    if(state.selected.idx === from) state.selected.idx = adjusted;
    else if(from < state.selected.idx && adjusted >= state.selected.idx) state.selected.idx -= 1;
    else if(from > state.selected.idx && adjusted <= state.selected.idx) state.selected.idx += 1;
  }
  render();
}

// Active pane dispatcher (welcome / course / theme / task).
export function renderActivePaneImpl(){
  const host = document.getElementById('formPane');
  if(typeof window._welcomeScrollCleanup === 'function') window._welcomeScrollCleanup();
  host.classList.remove('welcome-pane');
  host.innerHTML = '';
  if(state.jsonMode){ host.classList.add('hidden'); document.getElementById('jsonPane').classList.remove('hidden'); return; }
  host.classList.remove('hidden');
  document.getElementById('jsonPane').classList.add('hidden');
  if(state.selected.kind === 'welcome') renderWelcomePane(host);
  else if(state.selected.kind === 'course') renderCoursePane(host);
  else if(state.selected.kind === 'theme') renderThemePane(host);
  else if(state.selected.kind === 'task') renderTaskPane(host, state.selected.idx);
}


function renderCoursePane(host){
  host.appendChild(el('h2', {text:'Kopfdaten der Lerneinheit'}));
  host.appendChild(el('p', {className:'hint', text:'Diese Angaben erscheinen im SCORM-Header und im OLAT-Lernpfad.'}));
  const c = state.course;
  const get = () => c;
  const set = (k, v) => {
    c[k] = v;
    if(k === 'courseTitle'){
      renderTaskList();
      if(typeof window.scormBuilderSyncHeaderTitle === 'function') window.scormBuilderSyncHeaderTitle();
    }
  };
  [
    { key:'courseTitle', label:'Kurstitel', type:'text', placeholder:'z. B. Maschinendynamik: Komplexe Zahlen' },
    { key:'courseSubtitle', label:'Untertitel', type:'text' },
    { key:'passThreshold', label:'Bestehensschwelle (0 bis 1)', type:'number', step:'any', min:0, max:1 }
  ].forEach(spec => host.appendChild(renderField(spec, get, set)));
}

function renderThemePane(host){
  host.appendChild(el('h2', {text:'Branding / Theme'}));
  host.appendChild(el('p', {className:'hint', text:'Standardmäßig im UCB-Stil. Farben und Footer hier anpassen.'}));
  const t = state.theme;
  const actions = el('div', {className:'button-cluster', style:{marginBottom:'1rem'}});
  const resetBtn = el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:'Standard-Branding wiederherstellen'});
  resetBtn.addEventListener('click', async () => {
    if(!await confirmDialog({
      title: 'Branding zurücksetzen?',
      message: 'Farben, Logo und Footer-Einstellungen werden auf die ursprünglichen UCB-Standardwerte zurückgesetzt.',
      confirmLabel: 'Zurücksetzen'
    })) return;
    pushHistory();
    clearPersistentTheme();
    state.theme = defaultTheme();
    applyThemeToBuilder(state.theme);
    renderActivePane();
    toast('Standard-Branding wiederhergestellt.');
  });
  actions.appendChild(resetBtn);
  host.appendChild(actions);

  const persistTheme = () => {
    if(!savePersistentTheme(state.theme)) toast('Branding konnte nicht dauerhaft gespeichert werden.', 'error');
  };
  // Apply to :root for live theme preview.
  const get = () => t;
  const set = (k, v) => { t[k] = v; persistTheme(); applyThemeToBuilder(state.theme); };
  [
    { key:'kicker', label:'Kicker (Badge oben links)', type:'text' },
    { key:'fontFamily', label:'Schriftart (CSS font-family)', type:'text' },
    { key:'primaryColor', label:'Primärfarbe', type:'color' },
    { key:'primaryLight', label:'Primärfarbe hell (Verlauf)', type:'color' },
    { key:'accentColor', label:'Akzentfarbe', type:'color' },
    { key:'accentDarkColor', label:'Akzentfarbe dunkel', type:'color' },
    { key:'footerText', label:'Footer-Text', type:'text' },
    { key:'footerLink', label:'Footer-Link', type:'text', placeholder:'https://...' },
    { key:'logoUrl', label:'Logo-Pfad (Datei in template/, wird ins ZIP gepackt)', type:'text', placeholder:'default-logo.svg', help:'Datei mit diesem Namen muss in builder/template/ existieren.' }
  ].forEach(spec => host.appendChild(renderField(spec, get, set)));
  const logoField = el('div', {className:'field'});
  const logoInputId = 'fld_logoUpload';
  logoField.appendChild(el('label', {text:'Logo per Upload (überschreibt Pfad)', attrs:{'for': logoInputId}}));
  logoField.appendChild(el('div', {className:'field-help', text:'Lädt das Bild als Data-URL ins JSON.'}));
  const inp = el('input', {attrs:{type:'file', accept:'image/*', id: logoInputId}});
  inp.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = () => { state.theme.logoDataUrl = r.result; persistTheme(); renderActivePane(); toast('Logo geladen.'); };
    r.readAsDataURL(file);
  });
  logoField.appendChild(inp);
  if(t.logoDataUrl){
    const preview = el('img', {attrs:{src: t.logoDataUrl, alt:'Logo'}, style:{maxHeight:'60px', marginTop:'0.5rem', display:'block'}});
    logoField.appendChild(preview);
    const remove = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Upload-Logo entfernen', style:{marginTop:'0.4rem'}});
    remove.addEventListener('click', () => { state.theme.logoDataUrl = null; persistTheme(); renderActivePane(); });
    logoField.appendChild(remove);
  } else if(t.logoUrl){
    const preview = el('img', {attrs:{src: 'template/' + t.logoUrl, alt:'Logo'}, style:{maxHeight:'60px', marginTop:'0.5rem', display:'block'}});
    preview.onerror = () => { preview.replaceWith(el('div', {className:'field-help', text:'Logo "' + t.logoUrl + '" in template/ nicht gefunden.'})); };
    logoField.appendChild(preview);
  }
  host.appendChild(logoField);
}
