(function(){
  'use strict';

  // ---- Task type file mapping (must mirror script tags in index.html) ----
  const TASK_TYPE_FILES = {
    'complex-numbers': 'complex-numbers.js',
    'function-plot': 'function-plot.js',
    'vector-2d': 'vector-2d.js',
    'number-base': 'number-base.js',
    'truth-table': 'truth-table.js',
    'multiple-choice': 'multiple-choice.js',
    'numeric-input': 'numeric-input.js'
  };

  // ---- Defaults ----
  function defaultCourse(){
    return {
      courseTitle: 'Neue SCORM-Lerneinheit',
      courseSubtitle: '',
      passThreshold: 0.5,
      tasks: []
    };
  }
  function defaultTheme(){
    return {
      primaryColor: '#003b5c',
      primaryLight: '#0f567d',
      accentColor: '#a1d884',
      accentDarkColor: '#84bf66',
      fontFamily: 'Verdana, Arial, sans-serif',
      kicker: 'Umwelt-Campus Birkenfeld | Hochschule Trier',
      footerText: 'Dr.-Ing. Lukas Lentz',
      footerLink: 'https://www.umwelt-campus.de/dr-lukas-lentz',
      logoUrl: 'default-logo.svg',
      logoDataUrl: null
    };
  }

  // ---- State ----
  const state = {
    course: defaultCourse(),
    theme: defaultTheme(),
    selected: { kind: 'course' },
    jsonMode: false
  };

  function uid(){ return 't_' + Math.random().toString(36).slice(2, 8); }

  // ===== UI helpers =====
  function el(tag, opts){
    const e = document.createElement(tag);
    if(!opts) return e;
    if(opts.className) e.className = opts.className;
    if(opts.id) e.id = opts.id;
    if(opts.text != null) e.textContent = opts.text;
    if(opts.html != null) e.innerHTML = opts.html;
    if(opts.attrs) Object.entries(opts.attrs).forEach(([k,v]) => e.setAttribute(k, String(v)));
    if(opts.style) Object.assign(e.style, opts.style);
    if(opts.on) Object.entries(opts.on).forEach(([k,v]) => e.addEventListener(k, v));
    if(opts.children) opts.children.forEach(c => c && e.appendChild(c));
    return e;
  }
  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function toast(msg, type){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + (type || '');
    t.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add('hidden'), 3000);
  }

  // ===== Schema-driven form renderer =====
  // Each field spec: { key, label, type, defaultValue?, options?, schema?, itemSchema?, itemLabel?, rows?, step?, min?, max?, placeholder?, help? }
  function renderSchema(host, schema, getObj, setObj, onChangeStruct){
    schema.forEach(spec => host.appendChild(renderField(spec, getObj, setObj, onChangeStruct)));
  }

  function renderField(spec, getObj, setObj, onChangeStruct){
    const wrap = el('div', {className: 'field'});
    const obj = getObj() || {};

    if(spec.type === 'group'){
      const fs = el('fieldset', {className:'fieldset'});
      const lg = el('legend', {text: spec.label || spec.key});
      fs.appendChild(lg);
      if(spec.help) fs.appendChild(el('div', {className:'field-help', text: spec.help}));
      const subGet = () => (obj[spec.key] = obj[spec.key] || {});
      const subSet = (k, v) => { subGet()[k] = v; setObj(spec.key, subGet()); };
      const row = el('div', {className:'field-row'});
      spec.schema.forEach(sub => {
        row.appendChild(renderField(sub, () => subGet(), subSet, onChangeStruct));
      });
      fs.appendChild(row);
      return fs;
    }

    if(spec.type === 'list'){
      const block = el('div', {className:'list-block'});
      const head = el('div', {className:'list-head'});
      head.appendChild(el('strong', {text: spec.label || spec.key, style:{color:'var(--primary)'}}));
      const addBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'+ ' + (spec.itemLabel || 'Eintrag')});
      head.appendChild(addBtn);
      block.appendChild(head);
      if(spec.help) block.appendChild(el('div', {className:'field-help', text: spec.help}));
      const body = el('div');
      block.appendChild(body);

      function defaultItem(){
        const item = {};
        (spec.itemSchema || []).forEach(s => {
          if(s.type === 'boolean') item[s.key] = false;
          else if(s.type === 'number') item[s.key] = 0;
          else if(s.type === 'select' && s.options && s.options.length) item[s.key] = s.options[0].value;
          else item[s.key] = '';
        });
        return item;
      }

      function rerender(){
        body.innerHTML = '';
        const list = obj[spec.key] = Array.isArray(obj[spec.key]) ? obj[spec.key] : [];
        list.forEach((item, idx) => {
          const card = el('div', {className:'list-item'});
          const ihead = el('div', {className:'list-item-head'});
          ihead.appendChild(el('span', {className:'list-item-title', text:(spec.itemLabel || 'Eintrag') + ' ' + (idx+1)}));
          const ctrls = el('div', {className:'list-item-controls'});
          const upBtn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Nach oben'}, text:'▲'});
          const dnBtn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Nach unten'}, text:'▼'});
          const rmBtn = el('button', {className:'icon-btn danger', attrs:{type:'button', title:'Entfernen'}, text:'✕'});
          upBtn.disabled = idx === 0; dnBtn.disabled = idx === list.length - 1;
          upBtn.addEventListener('click', () => { [list[idx-1], list[idx]] = [list[idx], list[idx-1]]; setObj(spec.key, list); rerender(); });
          dnBtn.addEventListener('click', () => { [list[idx+1], list[idx]] = [list[idx], list[idx+1]]; setObj(spec.key, list); rerender(); });
          rmBtn.addEventListener('click', () => { list.splice(idx, 1); setObj(spec.key, list); rerender(); });
          ctrls.appendChild(upBtn); ctrls.appendChild(dnBtn); ctrls.appendChild(rmBtn);
          ihead.appendChild(ctrls);
          card.appendChild(ihead);

          const itemRow = el('div', {className:'field-row'});
          spec.itemSchema.forEach(sub => {
            itemRow.appendChild(renderField(sub, () => item, (k, v) => { item[k] = v; setObj(spec.key, list); }, onChangeStruct));
          });
          card.appendChild(itemRow);
          body.appendChild(card);
        });
        if(list.length === 0) body.appendChild(el('div', {className:'field-help', text:'Noch keine Einträge.'}));
      }

      addBtn.addEventListener('click', () => {
        const list = obj[spec.key] = Array.isArray(obj[spec.key]) ? obj[spec.key] : [];
        list.push(defaultItem());
        setObj(spec.key, list);
        rerender();
      });
      rerender();
      return block;
    }

    // ---- scalar fields ----
    const labelEl = el('label', {text: spec.label || spec.key});
    if(spec.type !== 'boolean') wrap.appendChild(labelEl);
    if(spec.help) wrap.appendChild(el('div', {className:'field-help', text: spec.help}));

    let input;
    if(spec.type === 'textarea'){
      input = el('textarea', {attrs:{rows: spec.rows || 3, placeholder: spec.placeholder || ''}});
      input.value = obj[spec.key] != null ? String(obj[spec.key]) : '';
      input.addEventListener('input', () => setObj(spec.key, input.value));
    } else if(spec.type === 'number'){
      input = el('input', {attrs:{type:'number', step: spec.step != null ? spec.step : 'any', placeholder: spec.placeholder || ''}});
      if(spec.min != null) input.min = spec.min;
      if(spec.max != null) input.max = spec.max;
      input.value = obj[spec.key] != null ? String(obj[spec.key]) : '';
      input.addEventListener('input', () => {
        const v = input.value === '' ? null : Number(input.value);
        setObj(spec.key, v);
      });
    } else if(spec.type === 'boolean'){
      const cb = el('input', {attrs:{type:'checkbox'}});
      cb.checked = !!obj[spec.key];
      const lbl = el('label', {className:'checkbox-field'});
      lbl.appendChild(cb);
      lbl.appendChild(el('span', {text: spec.label || spec.key}));
      cb.addEventListener('change', () => setObj(spec.key, cb.checked));
      wrap.innerHTML = '';
      if(spec.help) wrap.appendChild(el('div', {className:'field-help', text: spec.help}));
      wrap.appendChild(lbl);
      return wrap;
    } else if(spec.type === 'select'){
      input = el('select');
      (spec.options || []).forEach(o => {
        const op = el('option', {attrs:{value: o.value}, text: o.label || o.value});
        input.appendChild(op);
      });
      input.value = obj[spec.key] != null ? String(obj[spec.key]) : (spec.options && spec.options[0] && spec.options[0].value) || '';
      input.addEventListener('change', () => setObj(spec.key, input.value));
    } else if(spec.type === 'color'){
      input = el('input', {attrs:{type:'color'}});
      input.value = obj[spec.key] || '#000000';
      input.addEventListener('input', () => setObj(spec.key, input.value));
    } else { // text
      input = el('input', {attrs:{type:'text', placeholder: spec.placeholder || ''}});
      const v = obj[spec.key];
      input.value = Array.isArray(v) ? v.join(',') : (v != null ? String(v) : '');
      input.addEventListener('input', () => {
        if(spec.transform === 'csv') setObj(spec.key, input.value.split(',').map(s => s.trim()).filter(Boolean));
        else setObj(spec.key, input.value);
      });
    }
    wrap.appendChild(input);
    return wrap;
  }

  // ===== Sidebar =====
  function renderTaskList(){
    const list = document.getElementById('taskList');
    list.innerHTML = '';
    state.course.tasks.forEach((task, idx) => {
      const li = el('li');
      const def = window.TaskTypes.get(task.type);
      const btn = el('button', {className: 'task-btn' + (state.selected.kind === 'task' && state.selected.idx === idx ? ' active' : ''), attrs:{type:'button'}});
      btn.appendChild(el('span', {text: task.title || 'Aufgabe ' + (idx+1)}));
      btn.appendChild(el('span', {className:'task-meta', text: (def && def.label) || task.type}));
      btn.addEventListener('click', () => { state.selected = {kind:'task', idx}; render(); });
      li.appendChild(btn);
      const ctrls = el('div', {className:'task-controls'});
      const up = el('button', {className:'icon-btn', attrs:{type:'button', title:'Hoch'}, text:'▲'});
      const dn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Runter'}, text:'▼'});
      const rm = el('button', {className:'icon-btn danger', attrs:{type:'button', title:'Löschen'}, text:'✕'});
      up.disabled = idx === 0; dn.disabled = idx === state.course.tasks.length - 1;
      up.addEventListener('click', () => { swapTasks(idx, idx-1); });
      dn.addEventListener('click', () => { swapTasks(idx, idx+1); });
      rm.addEventListener('click', () => {
        if(!confirm('Aufgabe "' + (task.title || '') + '" entfernen?')) return;
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

  // ===== Pane rendering =====
  function renderActivePane(){
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
    host.appendChild(el('h2', {text: 'Kopfdaten der Lerneinheit'}));
    host.appendChild(el('p', {className:'hint', text:'Diese Angaben erscheinen im SCORM-Header und im OLAT-Lernpfad.'}));
    const c = state.course;
    const get = () => c;
    const set = (k, v) => { c[k] = v; if(k === 'courseTitle') renderTaskList(); };
    [
      { key:'courseTitle', label:'Kurstitel', type:'text', placeholder:'z. B. Maschinendynamik - Komplexe Zahlen' },
      { key:'courseSubtitle', label:'Untertitel', type:'text', placeholder:'z. B. Interaktive Lerneinheit' },
      { key:'passThreshold', label:'Bestehensschwelle (0-1, Anteil korrekter Aufgaben)', type:'number', step:'any', min:0, max:1 }
    ].forEach(spec => host.appendChild(renderField(spec, get, set)));
  }

  function renderThemePane(host){
    host.appendChild(el('h2', {text:'Branding / Theme'}));
    host.appendChild(el('p', {className:'hint', text:'Standardmäßig im UCB-Stil. Farben und Footer können hier angepasst werden.'}));
    const t = state.theme;
    const get = () => t;
    const set = (k, v) => { t[k] = v; };
    [
      { key:'kicker', label:'Kicker (Badge oben links)', type:'text' },
      { key:'fontFamily', label:'Schriftart (CSS font-family)', type:'text' },
      { key:'primaryColor', label:'Primärfarbe', type:'color' },
      { key:'primaryLight', label:'Primärfarbe hell (Verlauf)', type:'color' },
      { key:'accentColor', label:'Akzentfarbe', type:'color' },
      { key:'accentDarkColor', label:'Akzentfarbe dunkel', type:'color' },
      { key:'footerText', label:'Footer-Text', type:'text' },
      { key:'footerLink', label:'Footer-Link', type:'text', placeholder:'https://...' },
      { key:'logoUrl', label:'Logo-Pfad (Datei in template/, wird ins ZIP gepackt)', type:'text', placeholder:'default-logo.png', help:'Lege eine Datei mit diesem Namen in builder/template/ ab. Leer lassen, wenn kein Logo verwendet werden soll.' }
    ].forEach(spec => host.appendChild(renderField(spec, get, set)));

    // Logo upload (Data-URL) - überschreibt logoUrl im Header
    const logoField = el('div', {className:'field'});
    logoField.appendChild(el('label', {text:'Logo per Upload (überschreibt den Pfad oben)'}));
    logoField.appendChild(el('div', {className:'field-help', text:'Lädt das Bild als Data-URL ins JSON. Praktisch für einmalige Pakete; bläht aber tasks.json auf.'}));
    const inp = el('input', {attrs:{type:'file', accept:'image/*'}});
    inp.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if(!file) return;
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
      preview.onerror = () => { preview.replaceWith(el('div', {className:'field-help', text:'Logo-Datei "' + t.logoUrl + '" wurde in template/ nicht gefunden. Datei dort ablegen, dann Builder neu laden.'})); };
      logoField.appendChild(preview);
    }
    host.appendChild(logoField);
  }

  function renderTaskPane(host, idx){
    const task = state.course.tasks[idx];
    if(!task){ state.selected = {kind:'course'}; renderActivePane(); return; }
    const def = window.TaskTypes.get(task.type);
    if(!def){
      host.appendChild(el('h2', {text:'Aufgabe ' + (idx+1)}));
      host.appendChild(el('p', {className:'hint', text:'Unbekannter Aufgabentyp: ' + task.type}));
      return;
    }

    const headRow = el('div', {style:{display:'flex', gap:'0.6rem', alignItems:'center', marginBottom:'0.4rem'}});
    headRow.appendChild(el('h2', {text: 'Aufgabe ' + (idx+1) + ': ' + def.label, style:{margin:0}}));
    host.appendChild(headRow);
    host.appendChild(el('p', {className:'hint', text: def.description || ''}));

    // Title
    host.appendChild(renderField(
      { key:'title', label:'Titel der Aufgabe (in der Navigation sichtbar)', type:'text' },
      () => task,
      (k, v) => { task[k] = v; renderTaskList(); }
    ));

    // Auto-form for the task type's config
    const cfgFs = el('fieldset', {className:'fieldset'});
    cfgFs.appendChild(el('legend', {text: 'Konfiguration'}));
    if(!task.config) task.config = def.defaultConfig ? def.defaultConfig() : {};
    const cfgGet = () => task.config;
    const cfgSet = (k, v) => { task.config[k] = v; };
    (def.builderSchema ? def.builderSchema() : []).forEach(spec => {
      cfgFs.appendChild(renderField(spec, cfgGet, cfgSet));
    });
    host.appendChild(cfgFs);

    // Reset to defaults
    const resetRow = el('div', {className:'button-cluster', style:{marginTop:'0.5rem'}});
    const resetBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Auf Standardwerte zurücksetzen'});
    resetBtn.addEventListener('click', () => {
      if(!confirm('Konfiguration dieser Aufgabe auf Standardwerte zurücksetzen?')) return;
      task.config = def.defaultConfig ? def.defaultConfig() : {};
      render();
    });
    resetRow.appendChild(resetBtn);
    host.appendChild(resetRow);
  }

  // ===== Top-level render =====
  function render(){
    renderTaskList();
    renderActivePane();
    if(state.jsonMode) syncJsonEditor();
  }

  // ===== JSON mode =====
  function syncJsonEditor(){
    const ta = document.getElementById('jsonEditor');
    ta.value = JSON.stringify({course: state.course, theme: state.theme}, null, 2);
    document.getElementById('jsonStatus').textContent = '';
    document.getElementById('jsonStatus').className = 'json-status';
  }
  function applyJsonEditor(){
    try {
      const parsed = JSON.parse(document.getElementById('jsonEditor').value);
      if(parsed.course) state.course = parsed.course;
      if(parsed.theme) state.theme = parsed.theme;
      const status = document.getElementById('jsonStatus');
      status.textContent = 'Übernommen.';
      status.className = 'json-status ok';
      renderTaskList();
    } catch(err){
      const status = document.getElementById('jsonStatus');
      status.textContent = 'Fehler: ' + err.message;
      status.className = 'json-status error';
    }
  }

  // ===== ZIP build =====
  async function fetchTextRel(path){
    const r = await fetch('template/' + path);
    if(!r.ok) throw new Error('Konnte Template-Datei nicht laden: ' + path);
    return r.text();
  }
  async function fetchBinaryRel(path){
    const r = await fetch('template/' + path);
    if(!r.ok) return null;
    return await r.blob();
  }
  async function fetchJsonRel(path){
    const r = await fetch('template/' + path);
    if(!r.ok) throw new Error(path);
    return r.json();
  }

  async function gatherTemplateFiles(usedTaskTypes){
    const files = {};
    const list = ['scorm12.js', 'styles.css', 'runtime.js', 'index.html', 'task-types/_registry.js'];
    for(const f of list) files[f] = await fetchTextRel(f);
    for(const t of usedTaskTypes){
      const rel = TASK_TYPE_FILES[t];
      if(!rel) continue;
      files['task-types/' + rel] = await fetchTextRel('task-types/' + rel);
    }
    return files;
  }

  function escapeXml(s){ return String(s).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])); }

  function buildManifest(template, courseTitle, fileList){
    const id = 'man_' + Date.now().toString(36);
    const fileXml = fileList.map(f => '      <file href="' + f + '"/>').join('\n');
    return template
      .replace(/__MANIFEST_ID__/g, id)
      .replace(/__COURSE_TITLE__/g, escapeXml(courseTitle || 'SCORM Lerneinheit'))
      .replace('__RESOURCE_FILES__', fileXml);
  }

  function buildIndexHtml(template, taskTypeFiles){
    const tags = taskTypeFiles.map(f => '  <script src="' + f + '"></script>').join('\n');
    return template.replace('<!-- TASK_TYPE_SCRIPTS -->', tags);
  }

  function usedTaskTypes(){
    return Array.from(new Set(state.course.tasks.map(t => t.type)));
  }

  async function buildZip(){
    if(!window.JSZip){ toast('JSZip nicht geladen.', 'error'); return null; }
    if(state.course.tasks.length === 0){
      if(!confirm('Das Paket enthält keine Aufgaben. Trotzdem erzeugen?')) return null;
    }
    const used = usedTaskTypes();
    const tmpl = await gatherTemplateFiles(used);
    const manifestTpl = await fetchTextRel('imsmanifest.xml');
    const taskTypeFiles = used.map(t => 'task-types/' + TASK_TYPE_FILES[t]).filter(Boolean);

    const indexHtml = buildIndexHtml(tmpl['index.html'], taskTypeFiles);
    const tasksJson = JSON.stringify({
      courseTitle: state.course.courseTitle,
      courseSubtitle: state.course.courseSubtitle,
      passThreshold: state.course.passThreshold,
      tasks: state.course.tasks.map(t => ({ id: t.id, type: t.type, title: t.title, config: t.config }))
    }, null, 2);
    const themeJson = JSON.stringify(state.theme, null, 2);

    // Optional: bundle a relative-path logo file if specified in theme
    let logoBlob = null;
    let logoFilename = null;
    if(state.theme.logoUrl && !/^(https?:|data:)/i.test(state.theme.logoUrl)){
      logoFilename = state.theme.logoUrl;
      logoBlob = await fetchBinaryRel(logoFilename);
      // If user specified a path that is not present in template/, drop the reference quietly
      if(!logoBlob) logoFilename = null;
    }

    const fileList = [
      'index.html', 'styles.css', 'scorm12.js', 'runtime.js',
      'theme.json', 'tasks.json',
      'task-types/_registry.js',
      ...taskTypeFiles,
      ...(logoFilename ? [logoFilename] : [])
    ];
    const manifestXml = buildManifest(manifestTpl, state.course.courseTitle, fileList);

    const zip = new JSZip();
    zip.file('index.html', indexHtml);
    zip.file('styles.css', tmpl['styles.css']);
    zip.file('scorm12.js', tmpl['scorm12.js']);
    zip.file('runtime.js', tmpl['runtime.js']);
    zip.file('theme.json', themeJson);
    zip.file('tasks.json', tasksJson);
    zip.file('imsmanifest.xml', manifestXml);
    zip.file('task-types/_registry.js', tmpl['task-types/_registry.js']);
    used.forEach(t => {
      const rel = 'task-types/' + TASK_TYPE_FILES[t];
      zip.file(rel, tmpl[rel]);
    });
    if(logoFilename && logoBlob) zip.file(logoFilename, logoBlob);
    return zip;
  }

  async function downloadZip(){
    try {
      toast('Paket wird erzeugt …');
      const zip = await buildZip();
      if(!zip) return;
      const blob = await zip.generateAsync({type:'blob'});
      const filename = sanitizeFilename(state.course.courseTitle || 'scorm') + '.zip';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('Download bereit: ' + filename);
    } catch(err){
      console.error(err);
      toast('Fehler: ' + err.message, 'error');
    }
  }
  function sanitizeFilename(s){ return String(s).replace(/[^a-zA-Z0-9_\-]+/g, '_').slice(0, 80) || 'scorm'; }

  // ===== Load existing SCORM ZIP =====
  async function loadZipFile(file){
    if(!window.JSZip){ toast('JSZip nicht geladen.', 'error'); return; }
    try {
      const buf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);
      const tasksFile = zip.file('tasks.json');
      const themeFile = zip.file('theme.json');
      if(!tasksFile){
        if(!confirm('Diese ZIP-Datei enthält keine tasks.json (vermutlich kein vom Builder erzeugtes SCORM). Möchtest du trotzdem versuchen, sie zu öffnen?')) return;
      }
      if(tasksFile){
        const tasksTxt = await tasksFile.async('string');
        const cfg = JSON.parse(tasksTxt);
        state.course = {
          courseTitle: cfg.courseTitle || '',
          courseSubtitle: cfg.courseSubtitle || '',
          passThreshold: cfg.passThreshold != null ? cfg.passThreshold : 0.5,
          tasks: (cfg.tasks || []).map(t => Object.assign({id: t.id || uid()}, t))
        };
      }
      if(themeFile){
        const themeTxt = await themeFile.async('string');
        state.theme = Object.assign(defaultTheme(), JSON.parse(themeTxt));
      }
      state.selected = {kind:'course'};
      render();
      toast('SCORM-Paket geladen.');
    } catch(err){
      console.error(err);
      toast('ZIP konnte nicht gelesen werden: ' + err.message, 'error');
    }
  }

  // ===== JSON file IO =====
  function exportJson(){
    const blob = new Blob([JSON.stringify({course: state.course, theme: state.theme}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = sanitizeFilename(state.course.courseTitle || 'scorm') + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function loadJsonFile(file){
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if(parsed.course) state.course = parsed.course;
      if(parsed.theme) state.theme = Object.assign(defaultTheme(), parsed.theme);
      state.selected = {kind:'course'};
      render();
      toast('JSON-Konfiguration geladen.');
    } catch(err){ toast('Fehler: ' + err.message, 'error'); }
  }

  // ===== Preview =====
  function extractBodyInner(html){
    const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return m ? m[1] : html;
  }
  function blobToDataUrl(blob){
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  async function showPreview(){
    try {
      toast('Vorschau wird vorbereitet …');
      const used = usedTaskTypes();
      const tmpl = await gatherTemplateFiles(used);
      const taskTypeScripts = used.map(t => tmpl['task-types/' + TASK_TYPE_FILES[t]]).join('\n;\n');
      const tasksJson = JSON.stringify({
        courseTitle: state.course.courseTitle,
        courseSubtitle: state.course.courseSubtitle,
        passThreshold: state.course.passThreshold,
        tasks: state.course.tasks.map(t => ({id:t.id,type:t.type,title:t.title,config:t.config}))
      });
      // Resolve logoUrl to data URL for the srcdoc iframe (relative paths can't be loaded there)
      const previewTheme = Object.assign({}, state.theme);
      if(!previewTheme.logoDataUrl && previewTheme.logoUrl && !/^(https?:|data:)/i.test(previewTheme.logoUrl)){
        const blob = await fetchBinaryRel(previewTheme.logoUrl);
        if(blob) previewTheme.logoDataUrl = await blobToDataUrl(blob);
      }
      const themeJson = JSON.stringify(previewTheme);
      // Strip external scripts/links - we inline everything below.
      let bodyInner = extractBodyInner(tmpl['index.html']);
      bodyInner = bodyInner
        .replace(/<script[^>]+src=[^>]+><\/script>/gi, '')
        .replace(/<!--\s*TASK_TYPE_SCRIPTS\s*-->/g, '');
      const html = [
        '<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Vorschau</title>',
        '<style>', tmpl['styles.css'], '</style>',
        '</head><body>',
        bodyInner,
        '<script>window.__SCORM_THEME__=', themeJson, ';window.__SCORM_TASKS__=', tasksJson, ';<\/script>',
        '<script>', tmpl['scorm12.js'], '<\/script>',
        '<script>', tmpl['task-types/_registry.js'], '<\/script>',
        '<script>', taskTypeScripts, '<\/script>',
        '<script>', tmpl['runtime.js'], '<\/script>',
        '</body></html>'
      ].join('');
      const frame = document.getElementById('previewFrame');
      frame.srcdoc = html;
      document.getElementById('previewModal').classList.remove('hidden');
    } catch(err){
      console.error(err);
      toast('Vorschau-Fehler: ' + err.message, 'error');
    }
  }

  // ===== Task type modal =====
  function openTaskTypeModal(){
    const list = document.getElementById('taskTypeList');
    list.innerHTML = '';
    const all = window.TaskTypes.all().slice().sort((a,b) => (a.category || '').localeCompare(b.category || '') || a.label.localeCompare(b.label));
    all.forEach(def => {
      const card = el('button', {className:'task-type-card', attrs:{type:'button'}});
      card.appendChild(el('span', {className:'ttc-cat', text: def.category || 'Allgemein'}));
      card.appendChild(el('span', {className:'ttc-label', text: def.label}));
      card.appendChild(el('span', {className:'ttc-desc', text: def.description || ''}));
      card.addEventListener('click', () => {
        const task = {
          id: uid(),
          type: def.id,
          title: def.label,
          config: def.defaultConfig ? def.defaultConfig() : {}
        };
        state.course.tasks.push(task);
        state.selected = {kind:'task', idx: state.course.tasks.length - 1};
        document.getElementById('taskTypeModal').classList.add('hidden');
        render();
      });
      list.appendChild(card);
    });
    document.getElementById('taskTypeModal').classList.remove('hidden');
  }

  // ===== Init =====
  function init(){
    document.getElementById('btnNew').addEventListener('click', () => {
      if(!confirm('Aktuellen Stand verwerfen und neue Lerneinheit anlegen?')) return;
      state.course = defaultCourse();
      state.theme = defaultTheme();
      state.selected = {kind:'course'};
      render();
    });
    document.getElementById('btnAddTask').addEventListener('click', openTaskTypeModal);
    document.getElementById('btnDownload').addEventListener('click', downloadZip);
    document.getElementById('btnPreview').addEventListener('click', showPreview);
    document.getElementById('btnExportJson').addEventListener('click', exportJson);
    document.getElementById('fileLoadZip').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0]; if(f) loadZipFile(f); e.target.value = '';
    });
    document.getElementById('fileLoadJson').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0]; if(f) loadJsonFile(f); e.target.value = '';
    });
    document.querySelectorAll('.sidebar-link').forEach(b => {
      b.addEventListener('click', () => { state.selected = {kind: b.dataset.target}; render(); });
    });
    document.querySelectorAll('[data-modal-close]').forEach(b => {
      b.addEventListener('click', () => b.closest('.modal').classList.add('hidden'));
    });
    document.getElementById('jsonModeToggle').addEventListener('change', e => {
      state.jsonMode = e.target.checked;
      if(state.jsonMode) syncJsonEditor();
      renderActivePane();
    });
    document.getElementById('jsonEditor').addEventListener('input', () => applyJsonEditor());

    render();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
