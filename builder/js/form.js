// form.js: Schema-driven form renderer. renderField(spec, getObj, setObj)
// builds one field. Types: group, list, text, textarea, number, boolean,
// select, color, image, math-textarea, formula-text, zone-editor.
import { el } from './util.js';
import { MATH_CATS, FORMULA_FN_BTNS } from './math-toolbar-data.js';

// Upload limits, shared by image/audio/video/file fields.
// WARN: autosave (localStorage ~5-10 MB) will likely fail above this, so a
// reload loses unsaved edits. The final SCORM-ZIP still ships the file
// because media extraction writes it as a separate binary.
// SIZE: hard cap. Above this, FileReader risks an OOM.
const UPLOAD_SIZE_LIMITS = {
  image:  50 * 1024 * 1024,
  audio: 200 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  file:  500 * 1024 * 1024
};
const UPLOAD_WARN_THRESHOLDS = {
  image:  2 * 1024 * 1024,
  audio:  5 * 1024 * 1024,
  video: 10 * 1024 * 1024,
  file:  10 * 1024 * 1024
};
export function humanSize(bytes){
  if(bytes < 1024) return bytes + ' B';
  if(bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if(bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}
export function validateUpload(file, kind){
  if(!file) return { ok: false, error: 'Keine Datei ausgewählt.' };
  const limit = UPLOAD_SIZE_LIMITS[kind] || UPLOAD_SIZE_LIMITS.file;
  if(file.size > limit){
    const suggestion = kind === 'video'
      ? ' Tipp: YouTube oder Vimeo unterstützen beliebig große Videos - einfach den Link einfügen.'
      : '';
    return { ok:false, error:'Datei ist zu groß (' + humanSize(file.size) + '). Maximum: ' + humanSize(limit) + '.' + suggestion };
  }
  const mime = file.type || '';
  if(kind === 'image' && !mime.startsWith('image/')){
    return { ok:false, error:'Diese Datei ist kein Bild' + (mime ? ' (Typ: ' + mime + ')' : '') + '.' };
  }
  if(kind === 'audio' && !mime.startsWith('audio/')){
    return { ok:false, error:'Diese Datei ist keine Audiodatei' + (mime ? ' (Typ: ' + mime + ')' : '') + '.' };
  }
  if(kind === 'video' && !mime.startsWith('video/')){
    return { ok:false, error:'Diese Datei ist kein Video' + (mime ? ' (Typ: ' + mime + ')' : '') + '.' };
  }
  const warnThresh = UPLOAD_WARN_THRESHOLDS[kind];
  let warning = null;
  if(warnThresh && file.size > warnThresh){
    const suggestion = kind === 'video'
      ? ' Für sehr lange Videos kann ein YouTube-/Vimeo-Link sinnvoller sein.'
      : '';
    warning = 'Sehr große Datei - der Auto-Save im Browser kann scheitern, d. h. bei Reload wäre die Datei weg. Der SCORM-Export funktioniert weiterhin.' + suggestion;
  }
  return { ok: true, sizeHuman: humanSize(file.size), warning };
}
// Inline status row below an upload input.
// Returns { el, showError, showSuccess, showWarning, clear }.
function makeUploadStatus(){
  const el = document.createElement('div');
  el.className = 'upload-status';
  el.style.cssText = 'min-height:1.1rem; margin-top:0.4rem; font-size:0.78rem; line-height:1.35;';
  return {
    el,
    showError(msg){
      el.textContent = '⚠ ' + msg;
      el.style.color = '#a82015';
    },
    showSuccess(msg){
      el.textContent = '✓ ' + msg;
      el.style.color = '#2c7a3f';
    },
    showWarning(msg){
      el.textContent = '⚠ ' + msg;
      el.style.color = '#a3722b';
    },
    clear(){
      el.textContent = '';
      el.style.color = '';
    }
  };
}

export function renderField(spec, getObj, setObj){
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
        if(s.type === 'section') return;
        if(s.type === 'unit-pair'){
          if(s.defaultFromValue != null) item[s.fromKey || 'fromValue']    = s.defaultFromValue;
          if(s.defaultFromUnit  != null) item[s.fromUnitKey || 'fromUnit'] = s.defaultFromUnit;
          if(s.defaultToValue   != null) item[s.toKey || 'toValue']        = s.defaultToValue;
          if(s.defaultToUnit    != null) item[s.toUnitKey || 'toUnit']     = s.defaultToUnit;
          return;
        }
        if(s.type === 'unit-from-to'){
          if(s.defaultFrom != null) item[s.fromKey || 'fromUnit'] = s.defaultFrom;
          if(s.defaultTo   != null) item[s.toKey   || 'toUnit']   = s.defaultTo;
          return;
        }
        if(s.type === 'action') return;
        if(s.default != null) item[s.key] = s.default;
        else if(s.type === 'boolean') item[s.key] = false;
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

        let summarySpan = null;
        if(spec.itemSummary){
          summarySpan = el('span', {className:'list-item-subtitle', text: spec.itemSummary(item) || ''});
          ihead.appendChild(summarySpan);
        }

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

        const conditionals = [];
        function evalConditionals(){
          conditionals.forEach(c => { c.el.style.display = c.showIf(item) ? '' : 'none'; });
        }

        // Group itemSchema by section dividers so each label sits outside
        // its field-row (Safari grid-column:-1 bug with auto-fit).
        const groups = [];
        let cur = { label: null, fields: [] };
        (spec.itemSchema || []).forEach(sub => {
          if(sub.type === 'section'){ groups.push(cur); cur = { label: sub.label, fields: [] }; }
          else cur.fields.push(sub);
        });
        groups.push(cur);

        const itemBody = el('div');
        groups.forEach(group => {
          if(group.label != null)
            itemBody.appendChild(el('div', {className:'field-section-label', text: group.label}));
          if(!group.fields.length) return;
          const groupRow = el('div', {className:'field-row'});
          group.fields.forEach(sub => {
            const fieldEl = renderField(sub, () => item, (k, v) => {
              item[k] = v;
              setObj(spec.key, list);
              evalConditionals();
              if(summarySpan) summarySpan.textContent = spec.itemSummary(item) || '';
            });
            groupRow.appendChild(fieldEl);
            if(sub.showIf) conditionals.push({ el: fieldEl, showIf: sub.showIf });
          });
          itemBody.appendChild(groupRow);
        });
        evalConditionals();
        card.appendChild(itemBody);
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

  if(spec.type === 'section'){
    return el('div', {className:'field-section-label', text: spec.label || ''});
  }

  if(spec.type === 'unit-pair'){
    return renderUnitPairField(spec, getObj, setObj);
  }

  if(spec.type === 'unit-from-to'){
    return renderUnitFromToField(spec, getObj, setObj);
  }

  if(spec.type === 'action'){
    const row = el('div', {className:'field-action-row'});
    const btn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text: spec.label || 'Aktion'});
    btn.addEventListener('click', () => btn.dispatchEvent(
      new CustomEvent('block-field-action', {detail:{action: spec.action}, bubbles:true})
    ));
    row.appendChild(btn);
    return row;
  }

  const wrap = el('div', {className: 'field' + (spec.help ? ' field-has-help' : '') + (spec.fullWidth ? ' field-full' : '')});
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
    // Native swatch + hex input, kept in sync.
    const cfWrap = el('div', {className:'color-field'});
    const swatch = el('input', {className:'color-field-swatch', attrs:{type:'color'}});
    const hexInp = el('input', {className:'color-field-hex', attrs:{type:'text', maxlength:'7', spellcheck:'false', placeholder:'#RRGGBB'}});
    const initial = (obj[spec.key] && /^#[0-9A-Fa-f]{6}$/.test(obj[spec.key])) ? obj[spec.key] : '#000000';
    swatch.value = initial;
    hexInp.value = initial;
    swatch.addEventListener('input', () => {
      hexInp.value = swatch.value;
      setObj(spec.key, swatch.value);
    });
    hexInp.addEventListener('input', () => {
      let v = hexInp.value.trim();
      if(v && !v.startsWith('#')) v = '#' + v;
      if(/^#[0-9A-Fa-f]{6}$/.test(v)){
        swatch.value = v;
        setObj(spec.key, v);
      }
    });
    cfWrap.appendChild(swatch);
    cfWrap.appendChild(hexInp);
    wrap.appendChild(cfWrap);
    return wrap;
  } else if(spec.type === 'image'){
    return renderImageField(spec, getObj, setObj, wrap);
  } else if(spec.type === 'audio'){
    return renderAudioField(spec, getObj, setObj, wrap);
  } else if(spec.type === 'video'){
    return renderVideoField(spec, getObj, setObj, wrap);
  } else if(spec.type === 'file'){
    return renderFileField(spec, getObj, setObj, wrap);
  } else if(spec.type === 'math-textarea') {
    return renderMathTextarea(spec, getObj, setObj, wrap);
  } else if(spec.type === 'formula-text') {
    return renderFormulaText(spec, getObj, setObj, wrap);
  } else if(spec.type === 'zone-editor') {
    return renderZoneEditor(spec, getObj, setObj, wrap);
  } else {
    // plain text
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

// image field: file upload or URL.
function renderImageField(spec, getObj, setObj, wrap){
  const obj = getObj() || {};
  const inner = el('div');
  const fileRow = el('div', {className:'field-row'});
  const fileInp = el('input', {attrs:{type:'file', accept:'image/*'}});
  const clearBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Bild entfernen'});
  const status = makeUploadStatus();
  fileInp.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const v = validateUpload(f, 'image');
    if(!v.ok){
      status.showError(v.error);
      fileInp.value = '';  // reset so the same file can be retried
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      setObj(spec.key, r.result);
      status.showSuccess('Bild eingebettet (' + v.sizeHuman + ')');
      rerenderImagePreview();
    };
    r.onerror = () => status.showError('Datei konnte nicht gelesen werden.');
    r.readAsDataURL(f);
  });
  clearBtn.addEventListener('click', () => {
    setObj(spec.key, '');
    status.clear();
    rerenderImagePreview();
  });
  fileRow.appendChild(fileInp); fileRow.appendChild(clearBtn);
  inner.appendChild(fileRow);
  inner.appendChild(status.el);
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
}

// audio field: file upload or URL. Same shape as renderImageField.
function renderAudioField(spec, getObj, setObj, wrap){
  const obj = getObj() || {};
  const inner = el('div');
  const fileRow = el('div', {className:'field-row'});
  const fileInp = el('input', {attrs:{type:'file', accept:'audio/*'}});
  const clearBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Audio entfernen'});
  const status = makeUploadStatus();
  fileInp.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const v = validateUpload(f, 'audio');
    if(!v.ok){ status.showError(v.error); fileInp.value = ''; return; }
    const r = new FileReader();
    r.onload = () => {
      setObj(spec.key, r.result);
      status.showSuccess('Audio eingebettet (' + v.sizeHuman + ')');
      rerenderAudioPreview();
    };
    r.onerror = () => status.showError('Datei konnte nicht gelesen werden.');
    r.readAsDataURL(f);
  });
  clearBtn.addEventListener('click', () => { setObj(spec.key, ''); status.clear(); rerenderAudioPreview(); });
  fileRow.appendChild(fileInp); fileRow.appendChild(clearBtn);
  inner.appendChild(fileRow);
  inner.appendChild(status.el);
  const urlInp = el('input', {attrs:{type:'text', placeholder:'oder URL/Pfad eingeben (z. B. https://example.org/clip.mp3)'}});
  urlInp.value = (obj[spec.key] && !String(obj[spec.key]).startsWith('data:')) ? String(obj[spec.key]) : '';
  urlInp.addEventListener('input', () => { setObj(spec.key, urlInp.value); rerenderAudioPreview(); });
  inner.appendChild(urlInp);
  const previewWrap = el('div', {style:{marginTop:'0.5rem'}});
  function rerenderAudioPreview(){
    previewWrap.innerHTML = '';
    const v = (getObj() || {})[spec.key];
    if(!v) return;
    const a = document.createElement('audio');
    a.controls = true; a.preload = 'metadata';
    a.src = v;
    a.style.cssText = 'width:100%; display:block;';
    previewWrap.appendChild(a);
  }
  inner.appendChild(previewWrap);
  rerenderAudioPreview();
  wrap.appendChild(inner);
  return wrap;
}

// video field: file upload or URL. Previews with <video controls> or
// embed iframe for YouTube/Vimeo links.
function renderVideoField(spec, getObj, setObj, wrap){
  const obj = getObj() || {};
  const inner = el('div');
  const fileRow = el('div', {className:'field-row'});
  const fileInp = el('input', {attrs:{type:'file', accept:'video/*'}});
  const clearBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Video entfernen'});
  const status = makeUploadStatus();
  fileInp.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const v = validateUpload(f, 'video');
    if(!v.ok){ status.showError(v.error); fileInp.value = ''; return; }
    const r = new FileReader();
    r.onload = () => {
      setObj(spec.key, r.result);
      status.showSuccess('Video eingebettet (' + v.sizeHuman + ')');
      rerenderVideoPreview();
    };
    r.onerror = () => status.showError('Datei konnte nicht gelesen werden.');
    r.readAsDataURL(f);
  });
  clearBtn.addEventListener('click', () => { setObj(spec.key, ''); status.clear(); rerenderVideoPreview(); });
  fileRow.appendChild(fileInp); fileRow.appendChild(clearBtn);
  inner.appendChild(fileRow);
  inner.appendChild(status.el);
  const urlInp = el('input', {attrs:{type:'text', placeholder:'YouTube-/Vimeo-Link oder direkte Video-URL (z. B. https://youtu.be/abc12345678)'}});
  urlInp.value = (obj[spec.key] && !String(obj[spec.key]).startsWith('data:')) ? String(obj[spec.key]) : '';
  urlInp.addEventListener('input', () => { setObj(spec.key, urlInp.value); rerenderVideoPreview(); });
  inner.appendChild(urlInp);
  const previewWrap = el('div', {style:{marginTop:'0.5rem'}});
  function rerenderVideoPreview(){
    previewWrap.innerHTML = '';
    const v = (getObj() || {})[spec.key];
    if(!v) return;
    // Mirror runtime detection so the editor preview matches the learner view.
    const def = window.Blocks && window.Blocks.get('video');
    const info = def && typeof def.detectVideoSource === 'function' ? def.detectVideoSource(v) : null;
    if(info && (info.kind === 'youtube' || info.kind === 'vimeo')){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative; width:100%; aspect-ratio:16/9; max-width:320px; border-radius:6px; overflow:hidden; background:#000;';
      const iframe = document.createElement('iframe');
      iframe.setAttribute('frameborder','0');
      iframe.setAttribute('allow','accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen','true');
      iframe.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; border:0;';
      iframe.src = info.kind === 'youtube'
        ? 'https://www.youtube-nocookie.com/embed/' + info.id + '?rel=0'
        : 'https://player.vimeo.com/video/' + info.id + '?dnt=1';
      wrap.appendChild(iframe);
      previewWrap.appendChild(wrap);
      const hint = document.createElement('div');
      hint.textContent = (info.kind === 'youtube' ? 'YouTube' : 'Vimeo') + '-Embed erkannt';
      hint.style.cssText = 'font-size:0.78rem; color:#2c7a3f; margin-top:0.3rem;';
      previewWrap.appendChild(hint);
      return;
    }
    const video = document.createElement('video');
    video.controls = true; video.preload = 'metadata';
    video.src = v;
    video.style.cssText = 'max-width:100%; max-height:180px; display:block; background:linear-gradient(135deg, #0f567d 0%, #003b5c 60%, #08293d 100%); border-radius:6px;';
    previewWrap.appendChild(video);
  }
  inner.appendChild(previewWrap);
  rerenderVideoPreview();
  wrap.appendChild(inner);
  return wrap;
}

// Generic file upload (any MIME). Auto-fills a sibling `filename` field.
function renderFileField(spec, getObj, setObj, wrap){
  const obj = getObj() || {};
  const inner = el('div');
  const fileRow = el('div', {className:'field-row'});
  const fileInp = el('input', {attrs:{type:'file'}});
  const clearBtn = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Datei entfernen'});
  const status = makeUploadStatus();
  fileInp.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const v = validateUpload(f, 'file');
    if(!v.ok){ status.showError(v.error); fileInp.value = ''; return; }
    const r = new FileReader();
    r.onload = () => {
      setObj(spec.key, r.result);
      // Seed a sibling `filename` field if present and still empty.
      const cur = getObj() || {};
      if('filename' in cur && !cur.filename) setObj('filename', f.name);
      status.showSuccess('Datei eingebettet (' + v.sizeHuman + ')');
      rerenderFilePreview();
    };
    r.onerror = () => status.showError('Datei konnte nicht gelesen werden.');
    r.readAsDataURL(f);
  });
  clearBtn.addEventListener('click', () => { setObj(spec.key, ''); status.clear(); rerenderFilePreview(); });
  fileRow.appendChild(fileInp); fileRow.appendChild(clearBtn);
  inner.appendChild(fileRow);
  inner.appendChild(status.el);
  const urlInp = el('input', {attrs:{type:'text', placeholder:'oder URL/Pfad eingeben'}});
  urlInp.value = (obj[spec.key] && !String(obj[spec.key]).startsWith('data:')) ? String(obj[spec.key]) : '';
  urlInp.addEventListener('input', () => { setObj(spec.key, urlInp.value); rerenderFilePreview(); });
  inner.appendChild(urlInp);
  const previewWrap = el('div', {style:{marginTop:'0.5rem', fontSize:'0.85rem', color:'var(--muted)'}});
  function rerenderFilePreview(){
    previewWrap.innerHTML = '';
    const v = (getObj() || {})[spec.key];
    if(!v) return;
    if(v.startsWith('data:')){
      const b64 = v.split(',')[1] || '';
      const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
      const bytes = Math.max(0, (b64.length * 3 / 4) - padding);
      const human = bytes < 1024 ? bytes + ' B' :
                    bytes < 1024*1024 ? (bytes/1024).toFixed(1) + ' KB' :
                    bytes < 1024*1024*1024 ? (bytes/1024/1024).toFixed(1) + ' MB' :
                    (bytes/1024/1024/1024).toFixed(2) + ' GB';
      previewWrap.textContent = '✓ Datei eingebettet (' + human + ')';
    } else {
      previewWrap.textContent = '✓ URL: ' + v;
    }
  }
  inner.appendChild(previewWrap);
  rerenderFilePreview();
  wrap.appendChild(inner);
  return wrap;
}

// math-textarea: toolbar + textarea + live KaTeX preview.
function renderMathTextarea(spec, getObj, setObj, wrap){
  const obj = getObj() || {};

  let activeMathCat = 0;
  const mathWrap = el('div', {className:'math-field'});
  const toolbar  = el('div', {className:'math-toolbar'});
  const pills    = el('div', {className:'math-cat-pills'});
  const symGrid  = el('div', {className:'math-sym-grid'});
  toolbar.appendChild(pills);
  toolbar.appendChild(symGrid);

  const ta = el('textarea', {attrs:{rows: spec.rows || 3, placeholder: spec.placeholder || ''}});
  ta.value = obj[spec.key] != null ? String(obj[spec.key]) : '';

  const mathPreview = el('div', {className:'math-preview'});
  const mathHint = el('div', {className:'math-hint',
    text:'Tipp: Formeln zwischen $ und $ schreiben, z. B. $\\frac{a}{b}$ · Variablen als {name}'});

  function insertMathSnippet(snippet, cursorPos){
    const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    ta.value = v.slice(0,s) + snippet + v.slice(e);
    const pos = cursorPos != null ? s + cursorPos : s + snippet.length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.focus();
    ta.dispatchEvent(new Event('input'));
  }

  function renderMathCat(idx){
    activeMathCat = idx;
    pills.querySelectorAll('.math-cat-btn').forEach((b,i) => b.classList.toggle('active', i===idx));
    symGrid.innerHTML = '';
    MATH_CATS[idx].items.forEach(item => {
      const btn = el('button', {className:'math-sym-btn', attrs:{type:'button', title: item.t||item.s}, text: item.s});
      btn.addEventListener('click', () => insertMathSnippet(item.i, item.c != null ? item.c : null));
      symGrid.appendChild(btn);
    });
  }

  MATH_CATS.forEach((cat,i) => {
    const pill = el('button', {className:'math-cat-btn'+(i===0?' active':''), attrs:{type:'button'}, text:cat.label});
    pill.addEventListener('click', () => renderMathCat(i));
    pills.appendChild(pill);
  });
  renderMathCat(0);

  const delimRow = el('div', {className:'math-delim-row'});
  const delimBtn = el('button', {className:'math-delim-btn', attrs:{type:'button', title:'Formel-Umgebung einfügen'}, text:'$ … $'});
  delimBtn.addEventListener('click', () => {
    const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    const sel = v.slice(s, e);
    const ins = sel ? '$' + sel + '$' : '$$ ';
    ta.value = v.slice(0,s) + ins + v.slice(e);
    ta.selectionStart = ta.selectionEnd = sel ? s + ins.length : s + 1;
    ta.focus();
    ta.dispatchEvent(new Event('input'));
  });
  delimRow.appendChild(delimBtn);

  function updateMathPreview(){
    mathPreview.textContent = ta.value;
    if(typeof window.renderMathInElement === 'function'){
      try {
        window.renderMathInElement(mathPreview, {
          delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],
          throwOnError: false
        });
      } catch(e){}
    }
  }

  ta.addEventListener('input', () => { setObj(spec.key, ta.value); updateMathPreview(); });
  updateMathPreview();

  mathWrap.appendChild(toolbar);
  mathWrap.appendChild(delimRow);
  mathWrap.appendChild(ta);
  mathWrap.appendChild(mathPreview);
  mathWrap.appendChild(mathHint);
  wrap.appendChild(mathWrap);
  return wrap;
}

// formula-text: function helper buttons + text input.
function renderFormulaText(spec, getObj, setObj, wrap){
  const obj = getObj() || {};

  const formulaWrap = el('div', {className:'formula-field'});
  const fbar  = el('div', {className:'formula-toolbar'});
  const finp  = el('input', {attrs:{type:'text', placeholder: spec.placeholder || ''}});
  finp.value  = obj[spec.key] != null ? String(obj[spec.key]) : '';

  function insertFormulaPart(snippet, cursorPos){
    const s = finp.selectionStart, e = finp.selectionEnd, v = finp.value;
    finp.value = v.slice(0,s) + snippet + v.slice(e);
    const pos = cursorPos != null ? s + cursorPos : s + snippet.length;
    finp.selectionStart = finp.selectionEnd = pos;
    finp.focus();
    finp.dispatchEvent(new Event('input'));
  }
  FORMULA_FN_BTNS.forEach(b => {
    const btn = el('button', {className:'formula-fn-btn', attrs:{type:'button', title:b.s}, text:b.s});
    btn.addEventListener('click', () => insertFormulaPart(b.i, b.c));
    fbar.appendChild(btn);
  });
  finp.addEventListener('input', () => setObj(spec.key, finp.value));

  const fhint = el('div', {className:'math-hint',
    text:'Verfügbar: sqrt, sin, cos, tan, log, exp, abs, floor, ceil, round, min, max, pow, atan2 · Konstanten: pi, e · Potenz: ^'});

  formulaWrap.appendChild(fbar);
  formulaWrap.appendChild(finp);
  formulaWrap.appendChild(fhint);
  wrap.appendChild(formulaWrap);
  return wrap;
}

// zone-editor: drag rectangles onto an image (hotzone block).
function renderZoneEditor(spec, getObj, setObj, wrap){
  const ze = el('div', {className:'zone-editor'});
  const status = el('div', {className:'zone-editor-status'});
  const stage  = el('div', {className:'zone-editor-stage'});
  const list   = el('div', {className:'zone-editor-list'});

  function getZones(){
    const a = (getObj() || {})[spec.key];
    return Array.isArray(a) ? a : [];
  }
  function setZones(arr){ setObj(spec.key, arr.slice()); }

  let drawStart = null, drawRect = null, currentOverlay = null;
  function pos(e){
    const r = stage.getBoundingClientRect();
    return { x:(e.clientX - r.left)/r.width, y:(e.clientY - r.top)/r.height };
  }
  function onMove(e){
    if(!drawStart || !drawRect) return;
    const p = pos(e);
    const x = Math.max(0, Math.min(1, Math.min(drawStart.x, p.x)));
    const y = Math.max(0, Math.min(1, Math.min(drawStart.y, p.y)));
    const w = Math.max(0, Math.min(1, Math.abs(p.x - drawStart.x)));
    const h = Math.max(0, Math.min(1, Math.abs(p.y - drawStart.y)));
    drawRect.style.left = (x*100) + '%'; drawRect.style.top = (y*100) + '%';
    drawRect.style.width = (w*100) + '%'; drawRect.style.height = (h*100) + '%';
  }
  function onUp(e){
    if(!drawStart || !drawRect){ drawStart = null; drawRect = null; return; }
    const p = pos(e);
    const x = Math.max(0, Math.min(1, Math.min(drawStart.x, p.x)));
    const y = Math.max(0, Math.min(1, Math.min(drawStart.y, p.y)));
    const w = Math.max(0, Math.min(1, Math.abs(p.x - drawStart.x)));
    const h = Math.max(0, Math.min(1, Math.abs(p.y - drawStart.y)));
    drawStart = null;
    if(drawRect.parentNode) drawRect.parentNode.removeChild(drawRect);
    drawRect = null;
    if(w > 0.01 && h > 0.01){
      const arr = getZones(); arr.push({x, y, w, h}); setZones(arr); render();
    }
  }
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup',   onUp);

  let lastRenderedSrc = null;
  function render(){
    const cur = getObj() || {};
    const src = cur.src;
    lastRenderedSrc = src;
    stage.innerHTML = '';
    list.innerHTML  = '';
    if(!src){
      status.textContent = 'Lade zuerst ein Bild hoch (Feld oben), um Zonen zu markieren.';
      stage.style.display = 'none';
      return;
    }
    status.textContent = 'Klicke und ziehe auf dem Bild, um eine Zone zu markieren. Klicke eine Zone an, um sie zu löschen.';
    stage.style.display = 'inline-block';
    const img = el('img', {attrs:{src, alt:''}});
    stage.appendChild(img);
    const overlay = el('div', {className:'zone-editor-overlay'});
    currentOverlay = overlay;
    stage.appendChild(overlay);

    const zones = getZones();
    zones.forEach((z, idx) => {
      const r = el('div', {className:'zone-editor-rect'});
      r.style.left = (z.x*100)+'%'; r.style.top = (z.y*100)+'%';
      r.style.width = (z.w*100)+'%'; r.style.height = (z.h*100)+'%';
      r.title = 'Zone ' + (idx+1) + ': klicken zum Löschen';
      r.addEventListener('mousedown', e => e.stopPropagation());
      r.addEventListener('click', e => {
        e.stopPropagation();
        const arr = getZones(); arr.splice(idx, 1); setZones(arr); render();
      });
      overlay.appendChild(r);

      const row = el('div', {className:'zone-editor-list-item'});
      row.appendChild(el('span', {text:'Zone ' + (idx+1) + ': ' + Math.round(z.w*100) + '×' + Math.round(z.h*100) + '% @ ('+ Math.round(z.x*100) +'%, '+ Math.round(z.y*100) +'%)'}));
      const del = el('button', {className:'icon-btn danger', attrs:{type:'button'}, text:'×'});
      del.addEventListener('click', () => {
        const arr = getZones(); arr.splice(idx, 1); setZones(arr); render();
      });
      row.appendChild(del);
      list.appendChild(row);
    });
    if(zones.length === 0){
      list.appendChild(el('div', {className:'field-help', text:'Noch keine Zonen markiert.'}));
    }
  }

  stage.addEventListener('mousedown', e => {
    if(!currentOverlay) return;
    if(e.button !== 0) return;
    drawStart = pos(e);
    drawRect = el('div', {className:'zone-editor-rect zone-editor-rect-draft'});
    drawRect.style.left = (drawStart.x*100)+'%';
    drawRect.style.top  = (drawStart.y*100)+'%';
    drawRect.style.width = '0%'; drawRect.style.height = '0%';
    currentOverlay.appendChild(drawRect);
    e.preventDefault();
  });

  // Poll the sibling `src` field; peer fields don't notify on change.
  const watcher = setInterval(() => {
    const cur = (getObj() || {}).src;
    if(cur !== lastRenderedSrc) render();
  }, 500);

  const mo = new MutationObserver(() => {
    if(!document.body.contains(wrap)){
      clearInterval(watcher);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      mo.disconnect();
    }
  });
  mo.observe(document.body, {childList:true, subtree:true});

  render();

  ze.appendChild(status);
  ze.appendChild(stage);
  ze.appendChild(list);
  wrap.appendChild(ze);
  return wrap;
}

// unit-pair: two number+unit selects with live bidirectional conversion.
function renderUnitPairField(spec, getObj, setObj){
  const units   = spec.units  || {};
  const convert = spec.convertFn;
  const fk  = spec.fromKey      || 'fromValue';
  const fuk = spec.fromUnitKey  || 'fromUnit';
  const tk  = spec.toKey        || 'toValue';
  const tuk = spec.toUnitKey    || 'toUnit';

  const obj = getObj() || {};

  // Build optgroup-grouped selects.
  const cats = {};
  Object.entries(units).forEach(([id, u]) => {
    if(!cats[u.cat]) cats[u.cat] = [];
    cats[u.cat].push({id, label: u.label || id});
  });
  function buildSelect(currentVal){
    const sel = el('select');
    sel.style.cssText = 'flex:0 1 auto; min-width:80px; max-width:150px;';
    Object.entries(cats).forEach(([catName, items]) => {
      const og = document.createElement('optgroup');
      og.label = catName;
      items.forEach(({id, label}) => {
        const op = document.createElement('option');
        op.value = id; op.textContent = label;
        og.appendChild(op);
      });
      sel.appendChild(og);
    });
    sel.value = currentVal || (Object.keys(units)[0] || '');
    return sel;
  }

  function fmtNum(v){
    if(v == null || !isFinite(v)) return '';
    if(v === 0) return '0';
    const abs = Math.abs(v);
    if(abs >= 0.0001 && abs < 1e8) return String(parseFloat(v.toPrecision(7)));
    return parseFloat(v.toPrecision(5)).toExponential();
  }

  const outer = el('div', {className:'field field-full'});
  outer.appendChild(el('label', {text: spec.label || 'Umrechnungsaufgabe'}));
  if(spec.help) outer.appendChild(el('div', {className:'field-help', text: spec.help}));

  const row = el('div');
  row.style.cssText = 'display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-top:0.3rem;';

  const fromValInp = el('input', {attrs:{type:'number', step:'any', placeholder:'Eingabe'}});
  fromValInp.style.cssText = 'width:110px; flex:0 0 110px;';
  fromValInp.value = obj[fk] != null ? String(obj[fk]) : '';

  const fromUnitSel = buildSelect(obj[fuk]);
  const swapBtn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Eingabe und Ausgabe vertauschen'}, text:'⇄'});
  swapBtn.style.cssText = 'font-weight:700; color:var(--primary); font-size:1rem; flex:none; min-width:32px;';

  const toValInp = el('input', {attrs:{type:'number', step:'any', placeholder:'Ausgabe'}});
  toValInp.style.cssText = 'width:110px; flex:0 0 110px;';
  toValInp.value = obj[tk] != null ? String(obj[tk]) : '';

  const toUnitSel = buildSelect(obj[tuk]);

  const errSpan = el('span');
  errSpan.style.cssText = 'font-size:0.75rem; color:var(--danger); display:none; width:100%;';
  errSpan.textContent = 'Einheiten nicht kompatibel.';

  row.appendChild(fromValInp); row.appendChild(fromUnitSel);
  row.appendChild(swapBtn);
  row.appendChild(toValInp);   row.appendChild(toUnitSel);
  row.appendChild(errSpan);
  outer.appendChild(row);
  outer.appendChild(el('div', {className:'field-help',
    text:'Rechts tippt man in Ausgabe, links wird rückwärts berechnet, und umgekehrt.'}));

  function syncFromLeft(){
    const fv = parseFloat(fromValInp.value);
    const fu = fromUnitSel.value, tu = toUnitSel.value;
    if(!isNaN(fv) && convert){
      const tv = convert(fv, fu, tu);
      if(tv != null && isFinite(tv)){
        toValInp.value = fmtNum(tv);
        errSpan.style.display = 'none';
      } else {
        toValInp.value = '';
        errSpan.style.display = '';
      }
    }
    setObj(fk, isNaN(fv) ? null : fv);
    setObj(tk, parseFloat(toValInp.value) || null);
    setObj(fuk, fu); setObj(tuk, tu);
  }
  function syncFromRight(){
    const tv = parseFloat(toValInp.value);
    const fu = fromUnitSel.value, tu = toUnitSel.value;
    if(!isNaN(tv) && convert){
      const fv = convert(tv, tu, fu);
      if(fv != null && isFinite(fv)){
        fromValInp.value = fmtNum(fv);
        errSpan.style.display = 'none';
      } else {
        fromValInp.value = '';
        errSpan.style.display = '';
      }
    }
    setObj(tk, isNaN(tv) ? null : tv);
    setObj(fk, parseFloat(fromValInp.value) || null);
    setObj(fuk, fu); setObj(tuk, tu);
  }

  fromValInp.addEventListener('input', syncFromLeft);
  fromUnitSel.addEventListener('change', syncFromLeft);
  toUnitSel.addEventListener('change', syncFromLeft);
  toValInp.addEventListener('input', syncFromRight);

  swapBtn.addEventListener('click', e => {
    e.preventDefault();
    const fv = fromValInp.value, fu = fromUnitSel.value;
    const tv = toValInp.value,   tu = toUnitSel.value;
    fromValInp.value = tv; toValInp.value = fv;
    fromUnitSel.value = tu; toUnitSel.value = fu;
    syncFromLeft();
  });

  return outer;
}

// unit-from-to: two unit selects + swap button (no value inputs).
function renderUnitFromToField(spec, getObj, setObj){
  const units = spec.units || {};
  const fk = spec.fromKey || 'fromUnit';
  const tk = spec.toKey   || 'toUnit';
  const obj = getObj() || {};

  const cats = {};
  Object.entries(units).forEach(([id, u]) => {
    if(!cats[u.cat]) cats[u.cat] = [];
    cats[u.cat].push({ id, label: u.label || id });
  });
  function buildSelect(currentVal){
    const sel = el('select');
    sel.style.cssText = 'flex:1; min-width:90px;';
    Object.entries(cats).forEach(([catName, items]) => {
      const og = document.createElement('optgroup');
      og.label = catName;
      items.forEach(({id, label}) => {
        const op = document.createElement('option');
        op.value = id; op.textContent = label;
        og.appendChild(op);
      });
      sel.appendChild(og);
    });
    sel.value = currentVal || (Object.keys(units)[0] || '');
    return sel;
  }

  const wrap = el('div', {className:'field field-full'});
  wrap.appendChild(el('label', {text: spec.label || 'Richtung'}));
  if(spec.help) wrap.appendChild(el('div', {className:'field-help', text: spec.help}));

  const row = el('div');
  row.style.cssText = 'display:flex; align-items:center; gap:0.4rem; margin-top:0.2rem;';

  const fromSel = buildSelect(obj[fk]);
  const swapBtn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Von ↔ Nach vertauschen'}, text:'⇄'});
  swapBtn.style.cssText = 'font-weight:700; color:var(--primary); font-size:1rem; flex:none; min-width:32px;';
  const toSel = buildSelect(obj[tk]);

  fromSel.addEventListener('change', () => setObj(fk, fromSel.value));
  toSel.addEventListener('change',   () => setObj(tk, toSel.value));
  swapBtn.addEventListener('click', e => {
    e.preventDefault();
    const f = fromSel.value, t = toSel.value;
    fromSel.value = t; toSel.value = f;
    setObj(fk, t); setObj(tk, f);
  });

  row.appendChild(fromSel); row.appendChild(swapBtn); row.appendChild(toSel);
  wrap.appendChild(row);
  return wrap;
}
