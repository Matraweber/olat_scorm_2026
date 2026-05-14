// ============================================================================
// form.js - Schema-driven form renderer.
// `renderField(spec, getObj, setObj)` builds an editor UI for one field
// based on the spec. Supports: group, list, text, textarea, number, boolean,
// select, color, image, math-textarea, formula-text, zone-editor.
// ============================================================================
import { el } from './util.js';
import { MATH_CATS, FORMULA_FN_BTNS } from './math-toolbar-data.js';

export function renderField(spec, getObj, setObj){
  const obj = getObj() || {};

  // ---------- container types ----------
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

  // ---------- scalar fields ----------
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
    return renderImageField(spec, getObj, setObj, wrap);
  } else if(spec.type === 'math-textarea') {
    return renderMathTextarea(spec, getObj, setObj, wrap);
  } else if(spec.type === 'formula-text') {
    return renderFormulaText(spec, getObj, setObj, wrap);
  } else if(spec.type === 'zone-editor') {
    return renderZoneEditor(spec, getObj, setObj, wrap);
  } else { // plain text
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

// ---------- image field (file upload OR URL) ----------
function renderImageField(spec, getObj, setObj, wrap){
  const obj = getObj() || {};
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
}

// ---------- math-textarea: toolbar + textarea + live KaTeX preview ----------
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

// ---------- formula-text: function helper buttons + text input ----------
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

// ---------- zone-editor: drag rectangles onto an image (for hotzone block) ----------
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
      r.title = 'Zone ' + (idx+1) + ' - klicken zum Löschen';
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

  // Watch the sibling `src` field via interval (form re-render doesn't notify peer fields)
  const watcher = setInterval(() => {
    const cur = (getObj() || {}).src;
    if(cur !== lastRenderedSrc) render();
  }, 500);

  // Cleanup when wrap is detached from DOM
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
