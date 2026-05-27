// form.js: Schema-driven form renderer. Holds the renderField() dispatcher
// and the simple-input branches (text, textarea, number, boolean, select,
// color, group, list, section, action). Complex field renderers live in
// sibling modules so this file stays focused on the dispatch layer.
import { el } from './util.js';
import {
  renderImageField, renderAudioField, renderVideoField, renderFileField
} from './form-media.js';
import { renderMathTextarea, renderFormulaText } from './form-math.js';
import {
  renderZoneEditor, renderUnitPairField, renderUnitFromToField
} from './form-specialized.js';

// WARN prompts the user; SIZE is the hard FileReader cap.
// Autosave (~5-10 MB localStorage) won't survive WARN-sized uploads.
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
      ? ' Tipp: YouTube oder Vimeo unterstützen beliebig große Videos; einfach den Link einfügen.'
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
    warning = 'Sehr große Datei: der Auto-Save im Browser kann scheitern, d. h. bei Reload wäre die Datei weg. Der SCORM-Export funktioniert weiterhin.' + suggestion;
  }
  return { ok: true, sizeHuman: humanSize(file.size), warning };
}
// Inline status row below an upload input.
export function makeUploadStatus(){
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
        let evalConditionals = () => {
          conditionals.forEach(c => { c.el.style.display = c.showIf(item) ? '' : 'none'; });
        };

        // Group by section dividers (works around Safari grid-column:-1 bug).
        const groups = [];
        let cur = { label: null, fields: [] };
        (spec.itemSchema || []).forEach(sub => {
          if(sub.type === 'section'){ groups.push(cur); cur = { label: sub.label, fields: [] }; }
          else cur.fields.push(sub);
        });
        groups.push(cur);

        const itemBody = el('div');
        // Track each section so its label / divider can be hidden when every
        // child field is currently filtered out by a showIf rule.
        const sectionVisibility = [];
        groups.forEach(group => {
          let labelEl = null;
          if(group.label != null){
            labelEl = el('div', {className:'field-section-label', text: group.label});
            itemBody.appendChild(labelEl);
          }
          if(!group.fields.length){
            if(labelEl) sectionVisibility.push({ labelEl, fields: [] });
            return;
          }
          const groupRow = el('div', {className:'field-row'});
          const groupFields = [];
          group.fields.forEach(sub => {
            const fieldEl = renderField(sub, () => item, (k, v) => {
              item[k] = v;
              setObj(spec.key, list);
              evalConditionals();
              if(summarySpan) summarySpan.textContent = spec.itemSummary(item) || '';
            });
            groupRow.appendChild(fieldEl);
            groupFields.push({ el: fieldEl, showIf: sub.showIf || null });
            if(sub.showIf) conditionals.push({ el: fieldEl, showIf: sub.showIf });
          });
          itemBody.appendChild(groupRow);
          sectionVisibility.push({ labelEl, groupRow, fields: groupFields });
        });
        // Hide a section's label + row when every field in it is hidden.
        function syncSectionVisibility(){
          sectionVisibility.forEach(sec => {
            const anyVisible = sec.fields.length === 0
              ? false
              : sec.fields.some(f => !f.showIf || f.showIf(item));
            if(sec.labelEl) sec.labelEl.style.display = anyVisible ? '' : 'none';
            if(sec.groupRow) sec.groupRow.style.display = anyVisible ? '' : 'none';
          });
        }
        const origEval = evalConditionals;
        evalConditionals = () => { origEval(); syncSectionVisibility(); };
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
  // Stable id pairs the <label for=""> with the input below, satisfying
  // screen-reader form associations.
  const fieldId = 'fld_' + (spec.key || 'x') + '_' + Math.random().toString(36).slice(2, 8);
  let labelNode = null;
  if(spec.type !== 'boolean'){
    labelNode = el('label', {text: spec.label || spec.key, attrs:{'for': fieldId}});
    wrap.appendChild(labelNode);
  }
  if(spec.help) wrap.appendChild(el('div', {className:'field-help', text: spec.help}));

  let input;
  if(spec.type === 'textarea'){
    input = el('textarea', {attrs:{rows: spec.rows || 3, placeholder: spec.placeholder || ''}});
    input.value = obj[spec.key] != null ? String(obj[spec.key]) : '';
    input.addEventListener('input', () => setObj(spec.key, input.value));
  } else if(spec.type === 'number'){
    input = el('input', {attrs:{type:'number', step: spec.step != null ? spec.step : 'any', placeholder: spec.placeholder || ''}});
    input.dataset.fieldKey = spec.key;
    if(spec.min != null) input.min = spec.min;
    if(spec.max != null) input.max = spec.max;
    input.value = obj[spec.key] != null ? String(obj[spec.key]) : '';
    input.addEventListener('input', () => {
      const val = input.value === '' ? null : Number(input.value);
      setObj(spec.key, val);
      // Cross-field hook (e.g. min/max sync). setLive(k,v) updates state + DOM.
      if(typeof spec.onChange === 'function'){
        const setLive = (k, v) => {
          setObj(k, v);
          const root = input.closest('.list-item, .field-row, fieldset, form, .block-config-pane') || document;
          const sibling = root.querySelector('input[data-field-key="' + k + '"]');
          if(sibling && sibling !== input) sibling.value = v == null ? '' : String(v);
        };
        spec.onChange(val, getObj() || {}, setLive);
      }
    });
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
    // Native swatch + hex input, kept in sync. Both share the field <label>
    // via aria-label so screen readers announce them as "<spec.label>, Farbe".
    const cfWrap = el('div', {className:'color-field'});
    const ariaLabel = spec.label || spec.key;
    const swatch = el('input', {
      className:'color-field-swatch',
      attrs:{type:'color', 'aria-label': ariaLabel + ' (Farbwähler)'}
    });
    const hexInp = el('input', {
      className:'color-field-hex',
      attrs:{type:'text', maxlength:'7', spellcheck:'false', placeholder:'#RRGGBB',
             'aria-label': ariaLabel + ' (Hex-Code)'}
    });
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
  if(input) input.id = fieldId;
  wrap.appendChild(input);
  return wrap;
}

