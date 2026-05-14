// ============================================================================
// panes.js - Sidebar (task list) + course + theme settings pane.
// renderTaskPane lives in its own file because of its size; renderActivePane
// dispatches to one of the three pane renderers.
// ============================================================================
import { el, toast } from './util.js';
import { state, pushHistory, render, renderActivePane } from './state.js';
import { validateTask } from './tasks.js';
import { renderField } from './form.js';
import { renderTaskPane } from './task-pane.js';

// ---- Sidebar: task list + Allgemein-Links ----
export function renderTaskList(){
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  state.course.tasks.forEach((task, idx) => {
    const li = el('li');
    const btn = el('button', {className: 'task-btn' + (state.selected.kind === 'task' && state.selected.idx === idx ? ' active' : ''), attrs:{type:'button'}});
    const titleSpan = el('span', {text: task.title || 'Aufgabe ' + (idx+1)});
    const warnings = validateTask(task);
    if(warnings.length > 0){
      const badge = el('span', {className:'task-warning-badge', text: String(warnings.length), attrs:{title: warnings.map(w => w.message).join('\n')}});
      titleSpan.appendChild(badge);
    }
    btn.appendChild(titleSpan);
    const blockCount = (task.tabs && task.tabs.length)
      ? task.tabs.reduce((n, t) => n + (t.blocks || []).length, 0)
      : (task.blocks || []).length;
    const tabSuffix = (task.tabs && task.tabs.length) ? ' · ' + task.tabs.length + ' Tabs' : '';
    btn.appendChild(el('span', {className:'task-meta', text: blockCount + ' Block' + (blockCount === 1 ? '' : 'e') + tabSuffix}));
    btn.addEventListener('click', () => { state.selected = {kind:'task', idx}; render(); });
    li.appendChild(btn);
    const ctrls = el('div', {className:'task-controls'});
    const up = el('button', {className:'icon-btn', attrs:{type:'button', title:'Hoch'}, text:'▲'});
    const dn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Runter'}, text:'▼'});
    const rm = el('button', {className:'icon-btn danger', attrs:{type:'button', title:'Löschen'}, text:'✕'});
    up.disabled = idx === 0; dn.disabled = idx === state.course.tasks.length - 1;
    up.addEventListener('click', () => swapTasks(idx, idx-1));
    dn.addEventListener('click', () => swapTasks(idx, idx+1));
    rm.addEventListener('click', () => {
      if(!confirm('Aufgabe "' + (task.title || '') + '" entfernen?')) return;
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
  document.querySelectorAll('.sidebar-link').forEach(b => {
    b.classList.toggle('active', state.selected.kind === b.dataset.target);
  });
}

function swapTasks(a, b){
  if(b < 0 || b >= state.course.tasks.length) return;
  [state.course.tasks[a], state.course.tasks[b]] = [state.course.tasks[b], state.course.tasks[a]];
  if(state.selected.kind === 'task'){
    if(state.selected.idx === a) state.selected.idx = b;
    else if(state.selected.idx === b) state.selected.idx = a;
  }
  render();
}

// ---- Active pane dispatcher (course / theme / task) ----
export function renderActivePaneImpl(){
  const host = document.getElementById('formPane');
  host.innerHTML = '';
  if(state.jsonMode){ host.classList.add('hidden'); document.getElementById('jsonPane').classList.remove('hidden'); return; }
  host.classList.remove('hidden');
  document.getElementById('jsonPane').classList.add('hidden');
  if(state.selected.kind === 'course') renderCoursePane(host);
  else if(state.selected.kind === 'theme') renderThemePane(host);
  else if(state.selected.kind === 'task') renderTaskPane(host, state.selected.idx);
}

function renderCoursePane(host){
  host.appendChild(el('h2', {text:'Kopfdaten der Lerneinheit'}));
  host.appendChild(el('p', {className:'hint', text:'Diese Angaben erscheinen im SCORM-Header und im OLAT-Lernpfad.'}));
  const c = state.course;
  const get = () => c;
  const set = (k, v) => { c[k] = v; if(k === 'courseTitle') renderTaskList(); };
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
  const get = () => t; const set = (k, v) => { t[k] = v; };
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
  logoField.appendChild(el('label', {text:'Logo per Upload (überschreibt Pfad)'}));
  logoField.appendChild(el('div', {className:'field-help', text:'Lädt das Bild als Data-URL ins JSON.'}));
  const inp = el('input', {attrs:{type:'file', accept:'image/*'}});
  inp.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = () => { state.theme.logoDataUrl = r.result; renderActivePane(); toast('Logo geladen.'); };
    r.readAsDataURL(file);
  });
  logoField.appendChild(inp);
  if(t.logoDataUrl){
    const preview = el('img', {attrs:{src: t.logoDataUrl, alt:'Logo'}, style:{maxHeight:'60px', marginTop:'0.5rem', display:'block'}});
    logoField.appendChild(preview);
    const remove = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Upload-Logo entfernen', style:{marginTop:'0.4rem'}});
    remove.addEventListener('click', () => { state.theme.logoDataUrl = null; renderActivePane(); });
    logoField.appendChild(remove);
  } else if(t.logoUrl){
    const preview = el('img', {attrs:{src: 'template/' + t.logoUrl, alt:'Logo'}, style:{maxHeight:'60px', marginTop:'0.5rem', display:'block'}});
    preview.onerror = () => { preview.replaceWith(el('div', {className:'field-help', text:'Logo "' + t.logoUrl + '" in template/ nicht gefunden.'})); };
    logoField.appendChild(preview);
  }
  host.appendChild(logoField);
}
