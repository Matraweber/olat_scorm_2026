(function(){
  'use strict';

  // ---- Block file mapping (must mirror script tags in index.html) ----
  const BLOCK_FILES = {
    'heading':           'heading.js',
    'rich-text':         'rich-text.js',
    'note-box':          'note-box.js',
    'image':             'image.js',
    'divider':           'divider.js',
    'code':              'code.js',
    'multiple-choice':   'multiple-choice.js',
    'numeric-input':     'numeric-input.js',
    'text-input':        'text-input.js',
    'cloze':             'cloze.js',
    'match-pairs':       'match-pairs.js',
    'sort-list':         'sort-list.js',
    'complex-question':  'complex-question.js',
    'function-question': 'function-question.js',
    'vector-question':   'vector-question.js',
    'number-base':       'number-base.js',
    'truth-table':       'truth-table.js',
    'function-sandbox':  'function-sandbox.js'
  };

  // ---- Defaults ----
  function defaultCourse(){
    return { courseTitle: 'Neue SCORM-Lerneinheit', courseSubtitle: '', passThreshold: 0.5, tasks: [] };
  }
  function defaultTheme(){
    return {
      primaryColor: '#003b5c', primaryLight: '#0f567d',
      accentColor: '#a1d884', accentDarkColor: '#84bf66',
      fontFamily: 'Verdana, Arial, sans-serif',
      kicker: 'Umwelt-Campus Birkenfeld | Hochschule Trier',
      footerText: 'Dr.-Ing. Lukas Lentz',
      footerLink: 'https://www.umwelt-campus.de/dr-lukas-lentz',
      logoUrl: 'default-logo.svg', logoDataUrl: null
    };
  }

  const state = {
    course: defaultCourse(),
    theme: defaultTheme(),
    selected: { kind: 'course' },  // {kind:'course'|'theme'} or {kind:'task', idx}
    jsonMode: false,
    userTemplates: []
  };

  function uid(prefix){ return (prefix || 'id_') + Math.random().toString(36).slice(2, 8); }

  // ===== Templates (built-in + user) =====
  const USER_TEMPLATES_KEY = 'scorm-builder-user-templates';
  function loadUserTemplates(){
    try {
      const raw = localStorage.getItem(USER_TEMPLATES_KEY);
      if(!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch(e){ return []; }
  }
  function saveUserTemplates(){
    try { localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(state.userTemplates)); }
    catch(e){ toast('Vorlagen konnten nicht gespeichert werden: ' + e.message, 'error'); }
  }
  function instantiateTemplate(tpl){
    // Deep-clone, generate fresh IDs for task and every block
    const t = JSON.parse(JSON.stringify(tpl.task || {title:'Aufgabe', blocks:[]}));
    t.id = uid('t_');
    t.blocks = (t.blocks || []).map(b => Object.assign({}, b, {id: uid('b_')}));
    return t;
  }
  function captureTaskAsTemplateData(task){
    // Strip transient IDs from task data so it can be re-instantiated cleanly
    const blocks = (task.blocks || []).map(b => ({type: b.type, config: JSON.parse(JSON.stringify(b.config || {}))}));
    return { title: task.title, blocks };
  }

  // ===== Migration of legacy single-task model into block-based =====
  function migrateTaskIfNeeded(task){
    if(task.blocks) return task;
    const legacyMap = {
      'complex-numbers': 'complex-question',
      'function-plot':   'function-question',
      'vector-2d':       'vector-question'
    };
    const blockType = legacyMap[task.type] || task.type;
    const blocks = [];
    if(task.config && task.config.intro){
      blocks.push({id: uid('b_'), type: 'rich-text', config: { html: '<p>' + String(task.config.intro) + '</p>' }});
    }
    if(task.config && task.config.noteHtml){
      blocks.push({id: uid('b_'), type: 'note-box', config: { title: task.config.noteTitle || 'Hinweis', html: task.config.noteHtml, variant: 'info' }});
    }
    const cleanCfg = Object.assign({}, task.config || {});
    delete cleanCfg.intro; delete cleanCfg.noteTitle; delete cleanCfg.noteHtml;
    blocks.push({id: uid('b_'), type: blockType, config: cleanCfg});
    return { id: task.id || uid('t_'), title: task.title || 'Aufgabe', blocks };
  }

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
  function renderField(spec, getObj, setObj){
    const obj = getObj() || {};

    if(spec.type === 'group'){
      const fs = el('fieldset', {className:'fieldset'});
      const lg = el('legend', {text: spec.label || spec.key});
      fs.appendChild(lg);
      if(spec.help) fs.appendChild(el('div', {className:'field-help', text: spec.help}));
      const subGet = () => (obj[spec.key] = obj[spec.key] || {});
      const subSet = (k, v) => { subGet()[k] = v; setObj(spec.key, subGet()); };
      const row = el('div', {className:'field-row'});
      spec.schema.forEach(sub => row.appendChild(renderField(sub, () => subGet(), subSet)));
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
            itemRow.appendChild(renderField(sub, () => item, (k, v) => { item[k] = v; setObj(spec.key, list); }));
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
    const wrap = el('div', {className: 'field'});
    if(spec.type !== 'boolean'){
      wrap.appendChild(el('label', {text: spec.label || spec.key}));
    }
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
      input.addEventListener('input', () => setObj(spec.key, input.value === '' ? null : Number(input.value)));
    } else if(spec.type === 'boolean'){
      const cb = el('input', {attrs:{type:'checkbox'}});
      cb.checked = !!obj[spec.key];
      const lbl = el('label', {className:'checkbox-field'});
      lbl.appendChild(cb);
      lbl.appendChild(el('span', {text: spec.label || spec.key}));
      cb.addEventListener('change', () => setObj(spec.key, cb.checked));
      wrap.appendChild(lbl);
      return wrap;
    } else if(spec.type === 'select'){
      input = el('select');
      (spec.options || []).forEach(o => {
        const op = el('option', {attrs:{value: o.value}, text: o.label || o.value});
        input.appendChild(op);
      });
      const cur = obj[spec.key];
      input.value = cur != null ? String(cur) : ((spec.options && spec.options[0] && spec.options[0].value) || '');
      input.addEventListener('change', () => setObj(spec.key, input.value));
    } else if(spec.type === 'color'){
      input = el('input', {attrs:{type:'color'}});
      input.value = obj[spec.key] || '#000000';
      input.addEventListener('input', () => setObj(spec.key, input.value));
    } else if(spec.type === 'image'){
      // Hybrid: file upload OR URL/path
      const inner = el('div');
      const fileRow = el('div', {className:'field-row'});
      const fileInp = el('input', {attrs:{type:'file', accept:'image/*'}});
      const clearBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Bild entfernen'});
      fileInp.addEventListener('change', e => {
        const f = e.target.files && e.target.files[0]; if(!f) return;
        const r = new FileReader();
        r.onload = () => { setObj(spec.key, r.result); rerenderImagePreview(); };
        r.readAsDataURL(f);
      });
      clearBtn.addEventListener('click', () => { setObj(spec.key, ''); rerenderImagePreview(); });
      fileRow.appendChild(fileInp); fileRow.appendChild(clearBtn);
      inner.appendChild(fileRow);
      const urlInp = el('input', {attrs:{type:'text', placeholder:'oder URL/Pfad eingeben'}});
      urlInp.value = (obj[spec.key] && !String(obj[spec.key]).startsWith('data:')) ? String(obj[spec.key]) : '';
      urlInp.addEventListener('input', () => { setObj(spec.key, urlInp.value); rerenderImagePreview(); });
      inner.appendChild(urlInp);
      const previewWrap = el('div', {style:{marginTop:'0.5rem'}});
      function rerenderImagePreview(){
        previewWrap.innerHTML = '';
        const v = (getObj() || {})[spec.key];
        if(!v) return;
        const img = el('img', {attrs:{src: v, alt:''}, style:{maxHeight:'120px', maxWidth:'100%', borderRadius:'8px', border:'1px solid var(--line)'}});
        previewWrap.appendChild(img);
      }
      inner.appendChild(previewWrap);
      rerenderImagePreview();
      wrap.appendChild(inner);
      return wrap;
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

  // ===== Sidebar: task list =====
  function renderTaskList(){
    const list = document.getElementById('taskList');
    list.innerHTML = '';
    state.course.tasks.forEach((task, idx) => {
      const li = el('li');
      const btn = el('button', {className: 'task-btn' + (state.selected.kind === 'task' && state.selected.idx === idx ? ' active' : ''), attrs:{type:'button'}});
      btn.appendChild(el('span', {text: task.title || 'Aufgabe ' + (idx+1)}));
      const blockCount = (task.blocks || []).length;
      btn.appendChild(el('span', {className:'task-meta', text: blockCount + ' Block' + (blockCount === 1 ? '' : 'e')}));
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
    activeTaskCtx = null;  // cleared; will be re-set by renderTaskPane if applicable
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

  // ===== Canvas constants =====
  const CANVAS_WIDTH = 1100;
  const SNAP_PX = 6;
  const GRID = 8;
  const BLOCK_DEFAULT_SIZES = {
    'heading':           {w: 900, h: 72},
    'rich-text':         {w: 900, h: 160},
    'note-box':          {w: 900, h: 160},
    'image':             {w: 500, h: 380},
    'divider':           {w: 900, h: 24},
    'code':              {w: 800, h: 280},
    'multiple-choice':   {w: 600, h: 520},
    'numeric-input':     {w: 600, h: 380},
    'text-input':        {w: 600, h: 340},
    'cloze':             {w: 900, h: 320},
    'match-pairs':       {w: 900, h: 540},
    'sort-list':         {w: 700, h: 420},
    'complex-question':  {w: 1080, h: 720},
    'function-question': {w: 1080, h: 640},
    'vector-question':   {w: 1080, h: 720},
    'number-base':       {w: 700, h: 360},
    'truth-table':       {w: 700, h: 520},
    'function-sandbox':  {w: 1080, h: 580}
  };
  function defaultSizeFor(type){ return BLOCK_DEFAULT_SIZES[type] || {w: 500, h: 200}; }
  function ensurePos(block, allBlocks){
    if(block.pos) return;
    const sz = defaultSizeFor(block.type);
    let stackY = 20;
    allBlocks.forEach(b => { if(b !== block && b.pos && b.pos.y + b.pos.h > stackY) stackY = b.pos.y + b.pos.h + 16; });
    block.pos = { x: 20, y: stackY, w: sz.w, h: sz.h };
  }
  function ensureAllPos(blocks){ blocks.forEach(b => ensurePos(b, blocks)); }
  function stripHtmlText(html){ const d = document.createElement('div'); d.innerHTML = String(html || ''); return (d.textContent || '').trim(); }

  // Cache the template stylesheet text for shadow-DOM injection in canvas previews.
  let _runtimeStylesText = null;
  let _runtimeStylesPromise = null;
  function loadRuntimeStyles(){
    if(_runtimeStylesText != null) return Promise.resolve(_runtimeStylesText);
    if(_runtimeStylesPromise) return _runtimeStylesPromise;
    _runtimeStylesPromise = fetchTextRel('styles.css').then(txt => { _runtimeStylesText = txt; return txt; }).catch(() => '');
    return _runtimeStylesPromise;
  }
  // Preload on first use so the canvas paints with runtime styling on initial render.
  loadRuntimeStyles().then(() => { try { renderCanvasAll(); } catch(e){} });
  function renderCanvasAll(){
    // Re-render every canvas-block-body that has a [data-block-id] in the document.
    document.querySelectorAll('.canvas-block-card').forEach(card => {
      const id = card.dataset.blockId;
      const body = card.querySelector('.canvas-block-body');
      if(!body || !id) return;
      // Find the block in state by id
      const task = state.course.tasks[state.selected && state.selected.idx];
      if(!task) return;
      const b = (task.blocks || []).find(x => x.id === id);
      if(b) renderBlockPreview(body, b);
    });
  }

  function makeStubApi(block){
    return {
      utils: window.BlockUtils,
      blockId: 'preview_' + String(block.id || '').replace(/[^A-Za-z0-9_]/g, ''),
      initScore(){ /* no-op in builder preview */ },
      reportScore(){ /* no-op in builder preview */ }
    };
  }

  function renderBlockPreview(host, block){
    host.innerHTML = '';
    const def = window.Blocks.get(block.type);

    // Preferred: render the REAL runtime mount() inside an isolated shadow DOM so
    // canvas matches preview exactly. Falls back to the lightweight preview() helper
    // (or text summary) if mount fails or runtime utils/styles aren't ready.
    if(def && typeof def.mount === 'function' && window.BlockUtils){
      try {
        const shadowHost = document.createElement('div');
        shadowHost.className = 'canvas-mount-host';
        shadowHost.style.cssText = 'width:100%; min-height:0; pointer-events:none;';
        host.appendChild(shadowHost);
        const shadow = shadowHost.attachShadow({mode: 'open'});

        // Inject runtime stylesheet (uses cached text or sync fetch fallback).
        const styleEl = document.createElement('style');
        styleEl.textContent = (_runtimeStylesText || '') +
          '\n:host { display:block; }\n' +
          '.scorm-shell, .scorm-header, .scorm-footer { display:none; }\n' +
          '.canvas-mount-wrap { padding: 0.55rem 0.7rem; }\n';
        shadow.appendChild(styleEl);

        const mountHost = document.createElement('div');
        mountHost.className = 'canvas-mount-wrap';
        shadow.appendChild(mountHost);

        def.mount(mountHost, block.config || {}, makeStubApi(block));
        return;
      } catch(e){
        // Fall through to legacy preview()
        host.innerHTML = '';
      }
    }

    if(def && typeof def.preview === 'function'){
      try { def.preview(host, block.config || {}); return; }
      catch(e){ /* fall through to summary text */ }
    }
    // Fallback: text summary
    const span = document.createElement('span');
    span.className = 'canvas-block-summary';
    span.style.cssText = 'padding:0.5rem 0.7rem; color:var(--muted); font-size:0.85rem;';
    span.textContent = blockSummary(block);
    host.appendChild(span);
  }

  function blockSummary(block){
    const cfg = block.config || {};
    switch(block.type){
      case 'heading': return cfg.text || '(leer)';
      case 'rich-text': { const t = stripHtmlText(cfg.html); return t.length > 80 ? t.slice(0, 80) + '…' : (t || '(leerer Text)'); }
      case 'note-box': return cfg.title || 'Hinweis';
      case 'image': return cfg.src ? '🖼 Bild gesetzt' : '(noch kein Bild)';
      case 'divider': return '- Trennlinie -';
      case 'multiple-choice': return (stripHtmlText(cfg.question) || '(Frage leer)') + ' · ' + ((cfg.choices||[]).length) + ' Antworten';
      case 'numeric-input': return cfg.questionTemplate || '(Frage leer)';
      case 'text-input': return cfg.question || '(Frage leer)';
      case 'cloze': { const t = stripHtmlText(cfg.text); return t.length > 80 ? t.slice(0, 80) + '…' : (t || '(leer)'); }
      case 'match-pairs': return ((cfg.pairs||[]).length) + ' Paare';
      case 'truth-table': return ((cfg.expressions||[]).length) + ' Ausdrücke';
      case 'number-base': return 'Zahlensystem-Umrechnung';
      case 'complex-question': return ((cfg.pool||[]).length) + ' Punkte im Pool';
      case 'function-question': return ((cfg.functions||[]).length) + ' Funktion(en)';
      case 'vector-question': return ((cfg.pool||[]).length) + ' Vektoren im Pool';
      default: return (window.Blocks.get(block.type) || {}).label || block.type;
    }
  }

  // Snap algorithm - returns {x, y, guides:[{orientation, val, edge, label}]}
  const EDGE_LABELS = {
    left:'links', right:'rechts', cx:'Mitte X',
    top:'oben',  bottom:'unten', cy:'Mitte Y'
  };
  function applySnap(self, candidate, others){
    const guides = [];
    let snappedX = candidate.x, snappedY = candidate.y;
    const vLines = [0, CANVAS_WIDTH];
    const hLines = [0];
    others.forEach(b => {
      vLines.push(b.pos.x, b.pos.x + b.pos.w, b.pos.x + b.pos.w / 2);
      hLines.push(b.pos.y, b.pos.y + b.pos.h, b.pos.y + b.pos.h / 2);
    });
    const selfX = [
      {edge:'left',  val: candidate.x},
      {edge:'right', val: candidate.x + candidate.w},
      {edge:'cx',    val: candidate.x + candidate.w / 2}
    ];
    let bestX = null;
    selfX.forEach(s => vLines.forEach(line => {
      const d = Math.abs(s.val - line);
      if(d <= SNAP_PX && (!bestX || d < bestX.d)) bestX = {d, line, edge: s.edge};
    }));
    if(bestX){
      if(bestX.edge === 'left') snappedX = bestX.line;
      else if(bestX.edge === 'right') snappedX = bestX.line - candidate.w;
      else snappedX = bestX.line - candidate.w / 2;
      guides.push({orientation:'v', val: bestX.line, edge: bestX.edge, label: EDGE_LABELS[bestX.edge]});
    }
    const selfY = [
      {edge:'top',    val: candidate.y},
      {edge:'bottom', val: candidate.y + candidate.h},
      {edge:'cy',     val: candidate.y + candidate.h / 2}
    ];
    let bestY = null;
    selfY.forEach(s => hLines.forEach(line => {
      const d = Math.abs(s.val - line);
      if(d <= SNAP_PX && (!bestY || d < bestY.d)) bestY = {d, line, edge: s.edge};
    }));
    if(bestY){
      if(bestY.edge === 'top') snappedY = bestY.line;
      else if(bestY.edge === 'bottom') snappedY = bestY.line - candidate.h;
      else snappedY = bestY.line - candidate.h / 2;
      guides.push({orientation:'h', val: bestY.line, edge: bestY.edge, label: EDGE_LABELS[bestY.edge]});
    }
    if(!bestX) snappedX = Math.round(snappedX / GRID) * GRID;
    if(!bestY) snappedY = Math.round(snappedY / GRID) * GRID;
    snappedX = Math.max(0, Math.min(snappedX, CANVAS_WIDTH - candidate.w));
    snappedY = Math.max(0, snappedY);
    return { x: snappedX, y: snappedY, guides };
  }

  function applyResizeSnap(self, candidateW, candidateH, others){
    const guides = [];
    let w = Math.max(80, candidateW);
    let h = Math.max(40, candidateH);
    const vLines = [CANVAS_WIDTH];
    const hLines = [];
    others.forEach(b => {
      vLines.push(b.pos.x, b.pos.x + b.pos.w);
      hLines.push(b.pos.y, b.pos.y + b.pos.h);
    });
    const myRight = self.pos.x + w;
    let bestV = null;
    vLines.forEach(line => { const d = Math.abs(myRight - line); if(d <= SNAP_PX && (!bestV || d < bestV.d)) bestV = {d, line}; });
    if(bestV){ w = bestV.line - self.pos.x; guides.push({orientation:'v', val: bestV.line, edge:'right', label:'rechte Kante'}); }
    else w = Math.round(w / GRID) * GRID;
    const myBottom = self.pos.y + h;
    let bestH = null;
    hLines.forEach(line => { const d = Math.abs(myBottom - line); if(d <= SNAP_PX && (!bestH || d < bestH.d)) bestH = {d, line}; });
    if(bestH){ h = bestH.line - self.pos.y; guides.push({orientation:'h', val: bestH.line, edge:'bottom', label:'untere Kante'}); }
    else h = Math.round(h / GRID) * GRID;
    w = Math.max(80, Math.min(w, CANVAS_WIDTH - self.pos.x));
    h = Math.max(40, h);
    return { w, h, guides };
  }

  function showSnapGuides(canvas, guides){
    canvas.querySelectorAll('.snap-guide').forEach(g => g.remove());
    guides.forEach(g => {
      const guide = el('div', {className: 'snap-guide ' + (g.orientation === 'v' ? 'v' : 'h')});
      if(g.orientation === 'v') guide.style.left = g.val + 'px';
      else guide.style.top = g.val + 'px';
      if(g.label) guide.appendChild(el('span', {className:'snap-guide-label', text: g.label}));
      canvas.appendChild(guide);
    });
  }
  function hideSnapGuides(canvas){ canvas.querySelectorAll('.snap-guide').forEach(g => g.remove()); }

  // ===== Task pane (free canvas with snapping, multi-select, zoom) =====
  // Currently-active task pane context - set by renderTaskPane, used by global keyboard handler.
  let activeTaskCtx = null;

  function renderTaskPane(host, idx){
    const task = state.course.tasks[idx];
    if(!task){ state.selected = {kind:'course'}; renderActivePane(); return; }
    task.blocks = task.blocks || [];
    ensureAllPos(task.blocks);

    // Multi-select state (Set of block IDs). Persist last selection in task._uiSelectedBlockIds.
    const selectedBlockIds = new Set(Array.isArray(task._uiSelectedBlockIds) ? task._uiSelectedBlockIds : []);
    function persistSelection(){ task._uiSelectedBlockIds = Array.from(selectedBlockIds); }

    // Zoom state (per-task)
    let zoom = (typeof task._uiZoom === 'number' && task._uiZoom > 0) ? task._uiZoom : 1.0;

    // Compact head: task number + editable title + toolbar (one row)
    const head = el('div', {className:'task-edit-head'});
    head.appendChild(el('span', {className:'task-num', text: 'Aufgabe ' + (idx+1)}));
    const titleInput = el('input', {className:'task-title-input', attrs:{type:'text', placeholder:'Titel der Aufgabe (in der Navigation sichtbar)'}});
    titleInput.value = task.title || '';
    titleInput.addEventListener('input', () => { task.title = titleInput.value; renderTaskList(); });
    head.appendChild(titleInput);
    const toolbar = el('div', {className:'canvas-toolbar'});
    const addBtn = el('button', {className:'btn btn-primary', attrs:{type:'button'}, text:'+ Block'});
    addBtn.title = 'Block hinzufügen';
    addBtn.addEventListener('click', () => openBlockTypeModal(addBlockOfType));
    const saveTplBtn = el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:'★ Vorlage'});
    saveTplBtn.title = 'Aufgabe als Vorlage speichern';
    saveTplBtn.addEventListener('click', () => openSaveTemplateModal(task));
    toolbar.appendChild(addBtn); toolbar.appendChild(saveTplBtn);
    // Zoom controls
    const zoomBar = el('div', {className:'canvas-zoom-bar'});
    const zoomOut = el('button', {className:'icon-btn', attrs:{type:'button', title:'Verkleinern (Strg + Mausrad)'}, text:'−'});
    const zoomVal = el('span', {className:'zoom-value', text: Math.round(zoom*100) + '%'});
    const zoomIn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Vergrößern (Strg + Mausrad)'}, text:'+'});
    const zoomReset = el('button', {className:'icon-btn', attrs:{type:'button', title:'Zoom 100%'}, text:'⤢'});
    zoomBar.appendChild(zoomOut); zoomBar.appendChild(zoomVal); zoomBar.appendChild(zoomIn); zoomBar.appendChild(zoomReset);
    toolbar.appendChild(zoomBar);
    head.appendChild(toolbar);
    host.appendChild(head);

    // Body: canvas (left) + config-pane (right)
    const body = el('div', {className:'task-edit-body'});
    const canvasWrap = el('div', {className:'builder-canvas-wrap'});
    const zoomContainer = el('div', {className:'canvas-zoom-container'});
    const canvas = el('div', {className:'builder-canvas'});
    canvas.style.width = CANVAS_WIDTH + 'px';
    zoomContainer.appendChild(canvas);
    canvasWrap.appendChild(zoomContainer);
    body.appendChild(canvasWrap);
    const configHost = el('div', {className:'block-config-pane'});
    body.appendChild(configHost);
    host.appendChild(body);

    function applyZoom(){
      canvas.style.transform = 'scale(' + zoom + ')';
      zoomContainer.style.width  = (CANVAS_WIDTH * zoom) + 'px';
      const cssH = parseFloat(canvas.style.height || '320');
      zoomContainer.style.height = (cssH * zoom) + 'px';
      zoomVal.textContent = Math.round(zoom * 100) + '%';
      task._uiZoom = zoom;
    }
    function setZoom(z){ zoom = Math.max(0.4, Math.min(2.0, z)); applyZoom(); }
    zoomIn.addEventListener('click', () => setZoom(zoom + 0.1));
    zoomOut.addEventListener('click', () => setZoom(zoom - 0.1));
    zoomReset.addEventListener('click', () => setZoom(1.0));
    canvasWrap.addEventListener('wheel', (e) => {
      if(!e.ctrlKey) return;
      e.preventDefault();
      setZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1));
    }, {passive: false});

    function adjustCanvasHeight(){
      let maxBottom = 320;
      task.blocks.forEach(b => { if(b.pos.y + b.pos.h + 80 > maxBottom) maxBottom = b.pos.y + b.pos.h + 80; });
      canvas.style.height = maxBottom + 'px';
      applyZoom();  // also keep zoom container height in sync
    }

    function selectedBlocks(){ return task.blocks.filter(b => selectedBlockIds.has(b.id)); }

    function renderConfigPane(){
      configHost.innerHTML = '';
      const selBlocks = selectedBlocks();

      if(selBlocks.length === 0){
        configHost.appendChild(el('div', {className:'block-config-empty', html:'Klicke einen Block auf der Canvas, um ihn zu bearbeiten.<br><br><strong>Tipps:</strong><br>• Shift + Klick: mehrere Blöcke auswählen<br>• Pfeiltasten: pixelweise verschieben (Shift = 10 px)<br>• Entf: Block löschen<br>• Strg + Mausrad: Zoom'}));
        return;
      }

      if(selBlocks.length > 1){
        // Multi-select: show count + bulk actions
        const head = el('div', {className:'block-config-head'});
        head.appendChild(el('h3', {html: 'Mehrfachauswahl <span class="multi-count-badge">' + selBlocks.length + '</span>'}));
        configHost.appendChild(head);
        configHost.appendChild(el('div', {className:'field-help', text:'Wähle eine Aktion für alle ausgewählten Blöcke.'}));

        const actions = el('div', {className:'bulk-actions'});
        // Align row
        const alignRow = el('div', {className:'bulk-row'});
        alignRow.appendChild(el('strong', {text:'Ausrichten'}));
        [
          {label:'⟸ Links',   fn:()=>bulkAlign('left')},
          {label:'⇔ Mitte X', fn:()=>bulkAlign('cx')},
          {label:'Rechts ⟹', fn:()=>bulkAlign('right')},
          {label:'⤒ Oben',   fn:()=>bulkAlign('top')},
          {label:'⇕ Mitte Y', fn:()=>bulkAlign('cy')},
          {label:'Unten ⤓',  fn:()=>bulkAlign('bottom')}
        ].forEach(a => {
          const b = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:a.label});
          b.addEventListener('click', a.fn);
          alignRow.appendChild(b);
        });
        actions.appendChild(alignRow);
        // Distribute row
        if(selBlocks.length >= 3){
          const distRow = el('div', {className:'bulk-row'});
          distRow.appendChild(el('strong', {text:'Verteilen (gleicher Abstand)'}));
          const dh = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Horizontal'});
          dh.addEventListener('click', () => bulkDistribute('h'));
          const dv = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Vertikal'});
          dv.addEventListener('click', () => bulkDistribute('v'));
          distRow.appendChild(dh); distRow.appendChild(dv);
          actions.appendChild(distRow);
        }
        // Common actions
        const commonRow = el('div', {className:'bulk-row'});
        commonRow.appendChild(el('strong', {text:'Aktionen'}));
        const dupAll = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'⧉ Duplizieren'});
        dupAll.addEventListener('click', bulkDuplicate);
        const delAll = el('button', {className:'btn btn-danger btn-sm', attrs:{type:'button'}, text:'✕ Löschen'});
        delAll.addEventListener('click', bulkDelete);
        commonRow.appendChild(dupAll); commonRow.appendChild(delAll);
        actions.appendChild(commonRow);
        configHost.appendChild(actions);
        return;
      }

      // Single selection: full config form
      const sel = selBlocks[0];
      const def = window.Blocks.get(sel.type);
      const head = el('div', {className:'block-config-head'});
      head.appendChild(el('h3', {text: 'Konfiguration: ' + ((def && def.label) || sel.type)}));
      const meta = el('span', {className:'block-config-meta', text: posLabel(sel)});
      head.appendChild(meta);
      configHost.appendChild(head);
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
          sel.config[k] = v;
          const card = canvas.querySelector('[data-block-id="' + cssEscape(sel.id) + '"]');
          if(card){
            const body = card.querySelector('.canvas-block-body');
            if(body) renderBlockPreview(body, sel);
          }
          renderTaskList();
        })));
      }
    }
    function posLabel(b){ return 'Position ' + Math.round(b.pos.x) + ', ' + Math.round(b.pos.y) + ' · Größe ' + Math.round(b.pos.w) + '×' + Math.round(b.pos.h); }

    // ---- Bulk actions on multi-select ----
    function bulkAlign(edge){
      const sel = selectedBlocks(); if(sel.length < 2) return;
      let target;
      if(edge === 'left')   target = Math.min(...sel.map(b => b.pos.x));
      if(edge === 'right')  target = Math.max(...sel.map(b => b.pos.x + b.pos.w));
      if(edge === 'cx')     target = sel.reduce((s,b) => s + b.pos.x + b.pos.w/2, 0) / sel.length;
      if(edge === 'top')    target = Math.min(...sel.map(b => b.pos.y));
      if(edge === 'bottom') target = Math.max(...sel.map(b => b.pos.y + b.pos.h));
      if(edge === 'cy')     target = sel.reduce((s,b) => s + b.pos.y + b.pos.h/2, 0) / sel.length;
      sel.forEach(b => {
        if(edge === 'left')   b.pos.x = Math.round(target);
        if(edge === 'right')  b.pos.x = Math.round(target - b.pos.w);
        if(edge === 'cx')     b.pos.x = Math.round(target - b.pos.w / 2);
        if(edge === 'top')    b.pos.y = Math.round(target);
        if(edge === 'bottom') b.pos.y = Math.round(target - b.pos.h);
        if(edge === 'cy')     b.pos.y = Math.round(target - b.pos.h / 2);
      });
      renderCanvas(); adjustCanvasHeight();
    }
    function bulkDistribute(axis){
      const sel = selectedBlocks(); if(sel.length < 3) return;
      // Sort by primary axis position
      if(axis === 'h'){
        sel.sort((a,b) => a.pos.x - b.pos.x);
        const first = sel[0], last = sel[sel.length-1];
        const totalSpan = (last.pos.x + last.pos.w) - first.pos.x;
        const widths = sel.reduce((s,b) => s + b.pos.w, 0);
        const gap = (totalSpan - widths) / (sel.length - 1);
        let cursor = first.pos.x;
        sel.forEach(b => { b.pos.x = Math.round(cursor); cursor += b.pos.w + gap; });
      } else {
        sel.sort((a,b) => a.pos.y - b.pos.y);
        const first = sel[0], last = sel[sel.length-1];
        const totalSpan = (last.pos.y + last.pos.h) - first.pos.y;
        const heights = sel.reduce((s,b) => s + b.pos.h, 0);
        const gap = (totalSpan - heights) / (sel.length - 1);
        let cursor = first.pos.y;
        sel.forEach(b => { b.pos.y = Math.round(cursor); cursor += b.pos.h + gap; });
      }
      renderCanvas(); adjustCanvasHeight();
    }
    function bulkDuplicate(){
      const sel = selectedBlocks(); if(sel.length === 0) return;
      const newIds = [];
      sel.forEach(b => {
        const copy = JSON.parse(JSON.stringify(b));
        copy.id = uid('b_');
        copy.pos = Object.assign({}, b.pos, {x: b.pos.x + 24, y: b.pos.y + 24});
        task.blocks.push(copy);
        newIds.push(copy.id);
      });
      selectedBlockIds.clear();
      newIds.forEach(id => selectedBlockIds.add(id));
      persistSelection();
      renderCanvas(); renderConfigPane(); adjustCanvasHeight(); renderTaskList();
    }
    function bulkDelete(){
      const sel = selectedBlocks(); if(sel.length === 0) return;
      if(!confirm(sel.length === 1 ? 'Block löschen?' : sel.length + ' Blöcke löschen?')) return;
      const ids = sel.map(b => b.id);
      task.blocks = task.blocks.filter(b => !ids.includes(b.id));
      selectedBlockIds.clear();
      persistSelection();
      renderCanvas(); renderConfigPane(); adjustCanvasHeight(); renderTaskList();
    }

    function updateSelectionVisuals(){
      canvas.querySelectorAll('.canvas-block-card').forEach(c => {
        c.classList.toggle('selected', selectedBlockIds.has(c.dataset.blockId));
      });
    }

    function renderCanvas(){
      canvas.querySelectorAll('.canvas-block-card, .canvas-block-empty').forEach(c => c.remove());
      task.blocks.forEach(block => {
        ensurePos(block, task.blocks);
        const def = window.Blocks.get(block.type);
        const card = el('div', {className:'canvas-block-card', attrs:{'data-block-id': block.id}});
        if(selectedBlockIds.has(block.id)) card.classList.add('selected');
        Object.assign(card.style, {
          left: block.pos.x + 'px', top: block.pos.y + 'px',
          width: block.pos.w + 'px', height: block.pos.h + 'px'
        });
        const head = el('div', {className:'canvas-block-head'});
        head.appendChild(el('span', {className:'canvas-block-type', text: ((def && def.label) || block.type) + (def && def.graded ? ' · gewertet' : '')}));
        const ctrls = el('div', {className:'canvas-block-controls'});
        const dupBtn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Duplizieren'}, text:'⧉'});
        const rmBtn  = el('button', {className:'icon-btn danger', attrs:{type:'button', title:'Entfernen'}, text:'✕'});
        dupBtn.addEventListener('click', e => {
          e.stopPropagation();
          const copy = JSON.parse(JSON.stringify(block));
          copy.id = uid('b_');
          copy.pos = Object.assign({}, block.pos, { x: block.pos.x + 24, y: block.pos.y + 24 });
          task.blocks.push(copy);
          selectedBlockIds.clear(); selectedBlockIds.add(copy.id); persistSelection();
          renderCanvas(); renderConfigPane(); adjustCanvasHeight(); renderTaskList();
        });
        rmBtn.addEventListener('click', e => {
          e.stopPropagation();
          if(!confirm('Block "' + ((def && def.label) || block.type) + '" entfernen?')) return;
          const i = task.blocks.findIndex(b => b.id === block.id);
          if(i >= 0) task.blocks.splice(i, 1);
          selectedBlockIds.delete(block.id); persistSelection();
          renderCanvas(); renderConfigPane(); adjustCanvasHeight(); renderTaskList();
        });
        ctrls.appendChild(dupBtn); ctrls.appendChild(rmBtn);
        head.appendChild(ctrls);
        card.appendChild(head);

        const body = el('div', {className:'canvas-block-body'});
        renderBlockPreview(body, block);
        card.appendChild(body);

        // Resize handle only when single-block selection (matches block)
        const resize = el('div', {className:'canvas-block-resize', attrs:{title:'Größe ändern'}, text:'⌟'});
        card.appendChild(resize);

        installDragHandlers(card, block);
        installResizeHandler(resize, card, block);

        canvas.appendChild(card);
      });
      if(task.blocks.length === 0){
        const empty = el('div', {className:'canvas-block-empty', html:'<strong>Leere Canvas.</strong><br>Klicke <strong>+ Block</strong> oben rechts, um Inhalte hinzuzufügen.'});
        canvas.appendChild(empty);
      }
    }

    function installDragHandlers(card, block){
      card.addEventListener('mousedown', e => {
        if(e.target.closest('.canvas-block-resize') || e.target.closest('.canvas-block-controls')) return;
        if(e.button !== 0) return;
        e.preventDefault();

        // Selection logic on MOUSEDOWN - Shift toggles; plain click on unselected sets;
        // plain click on already-selected keeps multi-selection (so a drag moves the whole group).
        // A click WITHOUT drag will reduce to single on MOUSEUP (handled below).
        const wasSelected = selectedBlockIds.has(block.id);
        const shift = e.shiftKey;
        if(shift){
          if(wasSelected) selectedBlockIds.delete(block.id);
          else selectedBlockIds.add(block.id);
        } else {
          if(!wasSelected){
            selectedBlockIds.clear();
            selectedBlockIds.add(block.id);
          }
        }
        persistSelection();
        updateSelectionVisuals();
        renderConfigPane();

        const movingIds = Array.from(selectedBlockIds);
        const movingBlocks = movingIds.map(id => task.blocks.find(b => b.id === id)).filter(Boolean);
        if(movingBlocks.length === 0) return;
        const startPos = {};
        movingBlocks.forEach(b => { startPos[b.id] = {x: b.pos.x, y: b.pos.y}; });
        const startX = e.clientX, startY = e.clientY;
        let dragged = false;

        function onMove(ev){
          const sdx = ev.clientX - startX, sdy = ev.clientY - startY;
          if(!dragged && (Math.abs(sdx) > 3 || Math.abs(sdy) > 3)) dragged = true;
          if(!dragged) return;
          const dx = sdx / zoom, dy = sdy / zoom;
          const others = task.blocks.filter(b => !selectedBlockIds.has(b.id));
          const candidate = {x: startPos[block.id].x + dx, y: startPos[block.id].y + dy, w: block.pos.w, h: block.pos.h};
          const snapped = applySnap(block, candidate, others);
          const finalDx = snapped.x - startPos[block.id].x;
          const finalDy = snapped.y - startPos[block.id].y;
          movingBlocks.forEach(b => {
            const newX = Math.max(0, Math.min(startPos[b.id].x + finalDx, CANVAS_WIDTH - b.pos.w));
            const newY = Math.max(0, startPos[b.id].y + finalDy);
            b.pos.x = newX; b.pos.y = newY;
            const c = canvas.querySelector('[data-block-id="' + cssEscape(b.id) + '"]');
            if(c){ c.style.left = newX + 'px'; c.style.top = newY + 'px'; }
          });
          showSnapGuides(canvas, snapped.guides);
          const meta = configHost.querySelector('.block-config-meta');
          if(meta && movingBlocks.length === 1) meta.textContent = posLabel(movingBlocks[0]);
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          hideSnapGuides(canvas);
          // No drag occurred → it was a pure click. Reduce multi-selection to single block (unless Shift).
          if(!dragged && !shift && wasSelected && selectedBlockIds.size > 1){
            selectedBlockIds.clear();
            selectedBlockIds.add(block.id);
            persistSelection();
            updateSelectionVisuals();
            renderConfigPane();
          }
          adjustCanvasHeight();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
    function installResizeHandler(handle, card, block){
      handle.addEventListener('mousedown', e => {
        e.stopPropagation();
        e.preventDefault();
        // Resize only ever affects this single block - set selection to it
        selectedBlockIds.clear(); selectedBlockIds.add(block.id); persistSelection();
        updateSelectionVisuals();
        renderConfigPane();
        const startX = e.clientX, startY = e.clientY;
        const startW = block.pos.w, startH = block.pos.h;
        function onMove(ev){
          const dx = (ev.clientX - startX) / zoom;
          const dy = (ev.clientY - startY) / zoom;
          const others = task.blocks.filter(b => b.id !== block.id);
          const snapped = applyResizeSnap(block, startW + dx, startH + dy, others);
          block.pos.w = snapped.w; block.pos.h = snapped.h;
          card.style.width = snapped.w + 'px';
          card.style.height = snapped.h + 'px';
          showSnapGuides(canvas, snapped.guides);
          const meta = configHost.querySelector('.block-config-meta');
          if(meta) meta.textContent = posLabel(block);
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          hideSnapGuides(canvas);
          adjustCanvasHeight();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    canvas.addEventListener('mousedown', e => {
      if(e.target === canvas){
        selectedBlockIds.clear(); persistSelection();
        updateSelectionVisuals();
        renderConfigPane();
      }
    });

    function addBlockOfType(blockType){
      const def = window.Blocks.get(blockType);
      const block = { id: uid('b_'), type: blockType, config: def && def.defaultConfig ? def.defaultConfig() : {} };
      ensurePos(block, task.blocks);
      task.blocks.push(block);
      selectedBlockIds.clear(); selectedBlockIds.add(block.id); persistSelection();
      renderCanvas(); renderConfigPane(); adjustCanvasHeight(); renderTaskList();
    }

    // Helpers exposed to global keyboard handler via activeTaskCtx
    function nudgeSelected(dx, dy){
      const sel = selectedBlocks(); if(sel.length === 0) return;
      sel.forEach(b => {
        b.pos.x = Math.max(0, Math.min(b.pos.x + dx, CANVAS_WIDTH - b.pos.w));
        b.pos.y = Math.max(0, b.pos.y + dy);
        const c = canvas.querySelector('[data-block-id="' + cssEscape(b.id) + '"]');
        if(c){ c.style.left = b.pos.x + 'px'; c.style.top = b.pos.y + 'px'; }
      });
      const meta = configHost.querySelector('.block-config-meta');
      if(meta && sel.length === 1) meta.textContent = posLabel(sel[0]);
      adjustCanvasHeight();
    }
    function selectAll(){
      task.blocks.forEach(b => selectedBlockIds.add(b.id));
      persistSelection();
      updateSelectionVisuals();
      renderConfigPane();
    }
    function deselectAll(){
      selectedBlockIds.clear(); persistSelection();
      updateSelectionVisuals();
      renderConfigPane();
    }

    activeTaskCtx = {
      task,
      get selectedIds(){ return Array.from(selectedBlockIds); },
      nudgeSelected,
      bulkDelete,
      bulkDuplicate,
      selectAll,
      deselectAll
    };

    renderCanvas();
    adjustCanvasHeight();
    renderConfigPane();
  }

  // CSS.escape polyfill for older browsers
  function cssEscape(s){
    if(window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/([!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~])/g, '\\$1');
  }

  function clearDropMarkers(host){
    host.querySelectorAll('.drop-before, .drop-after').forEach(c => c.classList.remove('drop-before','drop-after'));
  }
  function findInsertIndex(listEl, y){
    const cards = Array.from(listEl.querySelectorAll('.block-edit-card:not(.dragging)'));
    for(let i = 0; i < cards.length; i++){
      const r = cards[i].getBoundingClientRect();
      if(y < r.top + r.height / 2){
        return parseInt(cards[i].dataset.blockIdx, 10);
      }
    }
    return listEl.querySelectorAll('.block-edit-card').length;
  }

  // ===== Top-level render =====
  function render(){
    renderTaskList();
    renderActivePane();
    if(state.jsonMode) syncJsonEditor();
  }

  // ===== JSON mode =====
  function syncJsonEditor(){
    document.getElementById('jsonEditor').value = JSON.stringify({course: state.course, theme: state.theme}, null, 2);
    const s = document.getElementById('jsonStatus'); s.textContent = ''; s.className = 'json-status';
  }
  function applyJsonEditor(){
    try {
      const parsed = JSON.parse(document.getElementById('jsonEditor').value);
      if(parsed.course){ state.course = parsed.course; state.course.tasks = (state.course.tasks || []).map(migrateTaskIfNeeded); }
      if(parsed.theme) state.theme = parsed.theme;
      const s = document.getElementById('jsonStatus'); s.textContent = 'Übernommen.'; s.className = 'json-status ok';
      renderTaskList();
    } catch(err){
      const s = document.getElementById('jsonStatus'); s.textContent = 'Fehler: ' + err.message; s.className = 'json-status error';
    }
  }

  // ===== ZIP build/load =====
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

  function escapeXml(s){ return String(s).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])); }
  function buildManifest(template, courseTitle, fileList){
    const id = 'man_' + Date.now().toString(36);
    const fileXml = fileList.map(f => '      <file href="' + f + '"/>').join('\n');
    return template
      .replace(/__MANIFEST_ID__/g, id)
      .replace(/__COURSE_TITLE__/g, escapeXml(courseTitle || 'SCORM Lerneinheit'))
      .replace('__RESOURCE_FILES__', fileXml);
  }
  function buildIndexHtml(template, blockFiles){
    const tags = blockFiles.map(f => '  <script src="' + f + '"></script>').join('\n');
    return template.replace('<!-- BLOCK_SCRIPTS -->', tags);
  }
  function usedBlockTypes(){
    const set = new Set();
    state.course.tasks.forEach(t => (t.blocks || []).forEach(b => set.add(b.type)));
    return Array.from(set);
  }
  async function gatherTemplateFiles(usedBlocks){
    const files = {};
    const list = ['scorm12.js', 'utils.js', 'styles.css', 'runtime.js', 'index.html', 'blocks/_registry.js'];
    for(const f of list) files[f] = await fetchTextRel(f);
    for(const b of usedBlocks){
      const rel = BLOCK_FILES[b]; if(!rel) continue;
      files['blocks/' + rel] = await fetchTextRel('blocks/' + rel);
    }
    return files;
  }

  async function buildZip(){
    if(!window.JSZip){ toast('JSZip nicht geladen.', 'error'); return null; }
    if(state.course.tasks.length === 0){
      if(!confirm('Das Paket enthält keine Aufgaben. Trotzdem erzeugen?')) return null;
    }
    const used = usedBlockTypes();
    const tmpl = await gatherTemplateFiles(used);
    const manifestTpl = await fetchTextRel('imsmanifest.xml');
    const blockFiles = used.map(b => 'blocks/' + BLOCK_FILES[b]).filter(Boolean);
    const indexHtml = buildIndexHtml(tmpl['index.html'], blockFiles);
    const tasksJson = JSON.stringify({
      courseTitle: state.course.courseTitle,
      courseSubtitle: state.course.courseSubtitle,
      passThreshold: state.course.passThreshold,
      tasks: state.course.tasks.map(t => ({ id: t.id, title: t.title, blocks: t.blocks }))
    }, null, 2);
    const themeJson = JSON.stringify(state.theme, null, 2);

    let logoBlob = null, logoFilename = null;
    if(state.theme.logoUrl && !/^(https?:|data:)/i.test(state.theme.logoUrl)){
      logoFilename = state.theme.logoUrl;
      logoBlob = await fetchBinaryRel(logoFilename);
      if(!logoBlob) logoFilename = null;
    }

    const fileList = [
      'index.html', 'styles.css', 'scorm12.js', 'utils.js', 'runtime.js',
      'theme.json', 'tasks.json', 'blocks/_registry.js',
      ...blockFiles, ...(logoFilename ? [logoFilename] : [])
    ];
    const manifestXml = buildManifest(manifestTpl, state.course.courseTitle, fileList);

    const zip = new JSZip();
    zip.file('index.html', indexHtml);
    zip.file('styles.css', tmpl['styles.css']);
    zip.file('scorm12.js', tmpl['scorm12.js']);
    zip.file('utils.js', tmpl['utils.js']);
    zip.file('runtime.js', tmpl['runtime.js']);
    zip.file('theme.json', themeJson);
    zip.file('tasks.json', tasksJson);
    zip.file('imsmanifest.xml', manifestXml);
    zip.file('blocks/_registry.js', tmpl['blocks/_registry.js']);
    used.forEach(b => {
      const rel = 'blocks/' + BLOCK_FILES[b];
      zip.file(rel, tmpl[rel]);
    });
    if(logoFilename && logoBlob) zip.file(logoFilename, logoBlob);
    return zip;
  }

  function sanitizeFilename(s){ return String(s).replace(/[^a-zA-Z0-9_\-]+/g, '_').slice(0, 80) || 'scorm'; }
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

  async function loadZipFile(file){
    if(!window.JSZip){ toast('JSZip nicht geladen.', 'error'); return; }
    try {
      const buf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);
      const tasksFile = zip.file('tasks.json');
      const themeFile = zip.file('theme.json');
      if(!tasksFile){
        if(!confirm('Diese ZIP enthält keine tasks.json. Trotzdem versuchen?')) return;
      }
      if(tasksFile){
        const tasksTxt = await tasksFile.async('string');
        const cfg = JSON.parse(tasksTxt);
        state.course = {
          courseTitle: cfg.courseTitle || '',
          courseSubtitle: cfg.courseSubtitle || '',
          passThreshold: cfg.passThreshold != null ? cfg.passThreshold : 0.5,
          tasks: (cfg.tasks || []).map(t => migrateTaskIfNeeded(Object.assign({id: t.id || uid('t_')}, t)))
        };
      }
      if(themeFile){
        const themeTxt = await themeFile.async('string');
        state.theme = Object.assign(defaultTheme(), JSON.parse(themeTxt));
      }
      state.selected = {kind:'course'};
      render();
      toast('SCORM-Paket geladen.');
    } catch(err){ console.error(err); toast('ZIP-Fehler: ' + err.message, 'error'); }
  }

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
      if(parsed.course){ state.course = parsed.course; state.course.tasks = (state.course.tasks || []).map(migrateTaskIfNeeded); }
      if(parsed.theme) state.theme = Object.assign(defaultTheme(), parsed.theme);
      state.selected = {kind:'course'};
      render();
      toast('JSON-Konfiguration geladen.');
    } catch(err){ toast('Fehler: ' + err.message, 'error'); }
  }

  // ===== Preview =====
  function blobToDataUrl(blob){
    return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(blob); });
  }
  function extractBodyInner(html){
    const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return m ? m[1] : html;
  }
  async function showPreview(){
    try {
      toast('Vorschau wird vorbereitet …');
      const used = usedBlockTypes();
      const tmpl = await gatherTemplateFiles(used);
      const blockScripts = used.map(b => tmpl['blocks/' + BLOCK_FILES[b]]).join('\n;\n');
      const tasksJson = JSON.stringify({
        courseTitle: state.course.courseTitle,
        courseSubtitle: state.course.courseSubtitle,
        passThreshold: state.course.passThreshold,
        tasks: state.course.tasks.map(t => ({id:t.id, title:t.title, blocks:t.blocks}))
      });
      const previewTheme = Object.assign({}, state.theme);
      if(!previewTheme.logoDataUrl && previewTheme.logoUrl && !/^(https?:|data:)/i.test(previewTheme.logoUrl)){
        const blob = await fetchBinaryRel(previewTheme.logoUrl);
        if(blob) previewTheme.logoDataUrl = await blobToDataUrl(blob);
      }
      const themeJson = JSON.stringify(previewTheme);
      let bodyInner = extractBodyInner(tmpl['index.html']);
      bodyInner = bodyInner.replace(/<script[^>]+src=[^>]+><\/script>/gi, '').replace(/<!--\s*BLOCK_SCRIPTS\s*-->/g, '');
      const html = [
        '<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Vorschau</title>',
        '<style>', tmpl['styles.css'], '</style>',
        '</head><body>', bodyInner,
        '<script>window.__SCORM_THEME__=', themeJson, ';window.__SCORM_TASKS__=', tasksJson, ';<\/script>',
        '<script>', tmpl['scorm12.js'], '<\/script>',
        '<script>', tmpl['utils.js'], '<\/script>',
        '<script>', tmpl['blocks/_registry.js'], '<\/script>',
        '<script>', blockScripts, '<\/script>',
        '<script>', tmpl['runtime.js'], '<\/script>',
        '</body></html>'
      ].join('');
      document.getElementById('previewFrame').srcdoc = html;
      document.getElementById('previewModal').classList.remove('hidden');
    } catch(err){ console.error(err); toast('Vorschau-Fehler: ' + err.message, 'error'); }
  }

  // ===== Task-create modal (Baukasten / Vorlagen) =====
  function openTaskCreateModal(){
    // Tabs setup
    document.querySelectorAll('#taskCreateModal .modal-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('#taskCreateModal .modal-tab').forEach(t => t.classList.toggle('active', t === tab));
        const which = tab.dataset.tab;
        document.getElementById('taskCreatePanelEmpty').classList.toggle('hidden', which !== 'empty');
        document.getElementById('taskCreatePanelTemplates').classList.toggle('hidden', which !== 'templates');
      };
    });
    // Default to first tab visible
    document.querySelectorAll('#taskCreateModal .modal-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.getElementById('taskCreatePanelEmpty').classList.remove('hidden');
    document.getElementById('taskCreatePanelTemplates').classList.add('hidden');

    document.getElementById('btnCreateEmpty').onclick = () => {
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
    const blockCount = (tpl.task && tpl.task.blocks ? tpl.task.blocks.length : 0);
    card.appendChild(el('span', {className:'tpl-desc', text: blockCount + ' Block' + (blockCount === 1 ? '' : 'e')}));

    const actions = el('div', {className:'tpl-actions'});
    const useBtn = el('button', {className:'btn btn-primary btn-sm', attrs:{type:'button'}, text:'Einfügen'});
    useBtn.addEventListener('click', () => {
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

  function openSaveTemplateModal(task){
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
  function openBlockTypeModal(onPick){
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
        const head = el('div', {className:'ttc-head'});
        const ico = el('span', {className:'ttc-icon', text: def.icon || '◻'});
        head.appendChild(ico);
        const titleWrap = el('div', {className:'ttc-titlewrap'});
        titleWrap.appendChild(el('span', {className:'ttc-label', text: def.label}));
        if(def.graded) titleWrap.appendChild(el('span', {className:'ttc-cat', text:'gewertet'}));
        head.appendChild(titleWrap);
        card.appendChild(head);
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

  // ===== Init =====
  function init(){
    document.getElementById('btnNew').addEventListener('click', () => {
      if(!confirm('Aktuellen Stand verwerfen und neue Lerneinheit anlegen?')) return;
      state.course = defaultCourse();
      state.theme = defaultTheme();
      state.selected = {kind:'course'};
      render();
    });
    document.getElementById('btnAddTask').addEventListener('click', openTaskCreateModal);
    document.getElementById('btnDownload').addEventListener('click', downloadZip);
    document.getElementById('btnPreview').addEventListener('click', showPreview);
    document.getElementById('btnExportJson').addEventListener('click', exportJson);
    document.getElementById('fileLoadZip').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f) loadZipFile(f); e.target.value = ''; });
    document.getElementById('fileLoadJson').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f) loadJsonFile(f); e.target.value = ''; });
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

    // ---- Sidebar collapse (persisted) ----
    function applySidebarState(){
      const collapsed = localStorage.getItem('scorm-builder-sidebar-collapsed') === '1';
      document.querySelector('.builder-shell').classList.toggle('sidebar-collapsed', collapsed);
    }
    document.getElementById('btnSidebarToggle').addEventListener('click', () => {
      const cur = localStorage.getItem('scorm-builder-sidebar-collapsed') === '1';
      localStorage.setItem('scorm-builder-sidebar-collapsed', cur ? '0' : '1');
      applySidebarState();
    });
    applySidebarState();

    // ---- Global keyboard shortcuts (active when in task editor) ----
    document.addEventListener('keydown', (e) => {
      if(state.selected.kind !== 'task') return;
      if(!activeTaskCtx) return;
      const ae = document.activeElement;
      if(ae && ae.matches('input, textarea, select, [contenteditable="true"]')) return;
      if(activeTaskCtx.selectedIds.length === 0 && !(e.ctrlKey && e.key.toLowerCase() === 'a')) return;

      const key = e.key;
      if(key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown'){
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0;
        const dy = key === 'ArrowUp'   ? -step : key === 'ArrowDown'  ? step : 0;
        activeTaskCtx.nudgeSelected(dx, dy);
        return;
      }
      if(key === 'Delete' || key === 'Backspace'){
        e.preventDefault();
        activeTaskCtx.bulkDelete();
        return;
      }
      if(key === 'Escape'){
        e.preventDefault();
        activeTaskCtx.deselectAll();
        return;
      }
      if(e.ctrlKey && (key === 'd' || key === 'D')){
        e.preventDefault();
        activeTaskCtx.bulkDuplicate();
        return;
      }
      if(e.ctrlKey && (key === 'a' || key === 'A')){
        e.preventDefault();
        activeTaskCtx.selectAll();
        return;
      }
    });

    state.userTemplates = loadUserTemplates();
    render();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
