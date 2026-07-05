// panes.js: Sidebar task list + course/theme settings panes.
// renderActivePaneImpl dispatches to course/theme/task panes; task editor in task-pane.js.
import { el, toast, confirmDialog } from './util.js';
import { state, pushHistory, scheduleAutosave, render, renderActivePane, defaultTheme, savePersistentTheme, clearPersistentTheme, applyThemeToBuilder, getEditorLocale, setEditorLocale, DEFAULT_COURSE_TITLE } from './state.js';
import { renderField } from './form.js';
import { renderTaskPane } from './task-pane.js';
import { renderWelcomePane } from './welcome-pane.js';
import { t, availableLocales, localeMeta, l } from './i18n.js';

// Small editor-locale switcher shown at the top of the course pane so the
// author can enter English course info next to the German one. Mirrors the
// version in task-pane-config.js.
function renderEditorLocaleToggleForCourse(){
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
      '<p class="task-empty-title">' + t('taskList.emptyTitle') + '</p>' +
      '<p class="task-empty-body">' + t('taskList.emptyBody') + '</p>';
    const cta = el('button', {
      className: 'btn btn-primary btn-sm task-empty-cta',
      attrs: { type: 'button' },
      text: t('taskList.firstTask')
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
    const titleSpan = el('span', {text: l(task.title) || t('taskList.fallbackTitle', {n: idx+1})});
    btn.appendChild(titleSpan);
    const blockCount = (task.tabs && task.tabs.length)
      ? task.tabs.reduce((n, tab) => n + (tab.blocks || []).length, 0)
      : (task.blocks || []).length;
    const tabSuffix = (task.tabs && task.tabs.length) ? t('taskList.tabsSuffix', {n: task.tabs.length}) : '';
    const blocksLabel = blockCount === 1 ? t('taskList.blocksSingular', {n: blockCount}) : t('taskList.blocksPlural', {n: blockCount});
    btn.appendChild(el('span', {className:'task-meta', text: blocksLabel + tabSuffix}));
    btn.addEventListener('click', () => { state.selected = {kind:'task', idx}; render(); });
    li.appendChild(btn);
    const ctrls = el('div', {className:'task-controls'});
    const up = el('button', {className:'icon-btn', attrs:{type:'button', title:t('common.up')}, text:'▲'});
    const dn = el('button', {className:'icon-btn', attrs:{type:'button', title:t('common.down')}, text:'▼'});
    const rm = el('button', {className:'icon-btn danger', attrs:{type:'button', title:t('common.delete')}, text:'✕'});
    up.disabled = idx === 0; dn.disabled = idx === state.course.tasks.length - 1;
    up.addEventListener('click', () => swapTasks(idx, idx-1));
    dn.addEventListener('click', () => swapTasks(idx, idx+1));
    rm.addEventListener('click', async () => {
      if(!await confirmDialog({
        title: t('panes.taskDelete.title'),
        message: t('panes.taskDelete.message', {name: l(task.title) || t('taskList.fallbackTitle', {n: idx + 1})}),
        confirmLabel: t('common.delete'),
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
  host.appendChild(el('h2', {text:t('panes.course.heading')}));
  host.appendChild(el('p', {className:'hint', text:t('panes.course.hint')}));
  // Content-language toggle so authors can add EN course info alongside DE.
  host.appendChild(renderEditorLocaleToggleForCourse());
  const c = state.course;
  const get = () => c;
  const set = (k, v) => {
    // Deleting the whole course title falls back to the default title, so a
    // course never ends up without one. Only triggers when the value has
    // collapsed to a fully empty string (writeFromEdit collapses wrappers
    // whose every language slot is empty); clearing just one language of a
    // bilingual title keeps the other language untouched.
    if(k === 'courseTitle' && v === ''){
      v = DEFAULT_COURSE_TITLE;
    }
    c[k] = v;
    if(k === 'courseTitle'){
      renderTaskList();
      if(typeof window.scormBuilderSyncHeaderTitle === 'function') window.scormBuilderSyncHeaderTitle();
    }
    // Persist Kopfdaten edits (title, threshold, the question-block defaults)
    // to the local autosave; otherwise they only survived a tab-close flush.
    scheduleAutosave();
  };
  [
    { key:'courseTitle', label:t('panes.course.fields.title'), type:'text', placeholder:t('panes.course.fields.titlePlaceholder') },
    { key:'courseSubtitle', label:t('panes.course.fields.subtitle'), type:'text' },
    { key:'passThreshold', label:t('panes.course.fields.passThreshold'), type:'number', step:'any', min:0, max:1 }
  ].forEach(spec => host.appendChild(renderField(spec, get, set)));

  // Course-wide defaults for the random-pool question blocks. Per-block
  // settings can still override these individually.
  host.appendChild(el('div', {className:'field-section-label', text:t('panes.course.questionBlocks.heading')}));
  host.appendChild(el('div', {className:'field-section-note',
    text:t('panes.course.questionBlocks.note')}));
  [
    { key:'regenLockAfterCheck', label:t('panes.course.questionBlocks.lockAfterCheck.label'), type:'boolean',
      help:t('panes.course.questionBlocks.lockAfterCheck.help') },
    { key:'regenNoRegenerate', label:t('panes.course.questionBlocks.hideRegenerate.label'), type:'boolean',
      help:t('panes.course.questionBlocks.hideRegenerate.help') }
  ].forEach(spec => host.appendChild(renderField(spec, get, set)));
}

function renderThemePane(host){
  host.appendChild(el('h2', {text:t('panes.theme.heading')}));
  host.appendChild(el('p', {className:'hint', text:t('panes.theme.hint')}));
  const theme = state.theme;
  const actions = el('div', {className:'button-cluster', style:{marginBottom:'1rem'}});
  const resetBtn = el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:t('panes.theme.reset.button')});
  resetBtn.addEventListener('click', async () => {
    if(!await confirmDialog({
      title: t('panes.theme.reset.title'),
      message: t('panes.theme.reset.message'),
      confirmLabel: t('panes.theme.reset.confirmLabel')
    })) return;
    pushHistory();
    clearPersistentTheme();
    state.theme = defaultTheme();
    applyThemeToBuilder(state.theme);
    renderActivePane();
    toast(t('panes.theme.reset.toast'));
  });
  actions.appendChild(resetBtn);
  host.appendChild(actions);

  const persistTheme = () => {
    if(!savePersistentTheme(state.theme)) toast(t('panes.theme.persistError'), 'error');
  };
  // Apply to :root for live theme preview.
  const get = () => theme;
  const set = (k, v) => { theme[k] = v; persistTheme(); applyThemeToBuilder(state.theme); };
  [
    { key:'kicker', label:t('panes.theme.fields.kicker'), type:'text' },
    { key:'fontFamily', label:t('panes.theme.fields.fontFamily'), type:'text' },
    { key:'primaryColor', label:t('panes.theme.fields.primaryColor'), type:'color' },
    { key:'primaryLight', label:t('panes.theme.fields.primaryLight'), type:'color' },
    { key:'accentColor', label:t('panes.theme.fields.accentColor'), type:'color' },
    { key:'accentDarkColor', label:t('panes.theme.fields.accentDarkColor'), type:'color' },
    { key:'footerText', label:t('panes.theme.fields.footerText'), type:'text' },
    { key:'footerLink', label:t('panes.theme.fields.footerLink'), type:'text', placeholder:'https://...' },
    { key:'logoUrl', label:t('panes.theme.fields.logoUrl.label'), type:'text', placeholder:'default-logo.svg', help:t('panes.theme.fields.logoUrl.help') }
  ].forEach(spec => host.appendChild(renderField(spec, get, set)));
  const logoField = el('div', {className:'field'});
  const logoInputId = 'fld_logoUpload';
  logoField.appendChild(el('label', {text:t('panes.theme.logoUpload.label'), attrs:{'for': logoInputId}}));
  logoField.appendChild(el('div', {className:'field-help', text:t('panes.theme.logoUpload.help')}));
  const inp = el('input', {attrs:{type:'file', accept:'image/*', id: logoInputId}});
  inp.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = () => { state.theme.logoDataUrl = r.result; persistTheme(); renderActivePane(); toast(t('panes.theme.logoUpload.loaded')); };
    r.readAsDataURL(file);
  });
  logoField.appendChild(inp);
  if(theme.logoDataUrl){
    const preview = el('img', {attrs:{src: theme.logoDataUrl, alt:t('panes.theme.logoAlt')}, style:{maxHeight:'60px', marginTop:'0.5rem', display:'block'}});
    logoField.appendChild(preview);
    const remove = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:t('panes.theme.logoUpload.remove'), style:{marginTop:'0.4rem'}});
    remove.addEventListener('click', () => { state.theme.logoDataUrl = null; persistTheme(); renderActivePane(); });
    logoField.appendChild(remove);
  } else if(theme.logoUrl){
    const preview = el('img', {attrs:{src: 'template/' + theme.logoUrl, alt:t('panes.theme.logoAlt')}, style:{maxHeight:'60px', marginTop:'0.5rem', display:'block'}});
    preview.onerror = () => { preview.replaceWith(el('div', {className:'field-help', text:t('panes.theme.logoMissing', {name: theme.logoUrl})})); };
    logoField.appendChild(preview);
  }
  host.appendChild(logoField);
}
