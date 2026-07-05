// form-specialized.js: block-specific complex field renderers.
//   * zone-editor    drag rectangles onto an image (hotzone block)
//   * unit-pair      paired unit selectors (unit-convert block)
//   * unit-from-to   from/to unit selectors with category switcher

import { el } from './util.js';
import { t } from './i18n.js';

export function renderZoneEditor(spec, getObj, setObj, wrap){
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
      status.textContent = t('form.specialized.zoneEditor.uploadFirst');
      stage.style.display = 'none';
      return;
    }
    status.textContent = t('form.specialized.zoneEditor.instructions');
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
      r.title = t('form.specialized.zoneEditor.rectTitle', {n: idx+1});
      r.addEventListener('mousedown', e => e.stopPropagation());
      r.addEventListener('click', e => {
        e.stopPropagation();
        const arr = getZones(); arr.splice(idx, 1); setZones(arr); render();
      });
      overlay.appendChild(r);

      const row = el('div', {className:'zone-editor-list-item'});
      row.appendChild(el('span', {text: t('form.specialized.zoneEditor.listItem', {n: idx+1, w: Math.round(z.w*100), h: Math.round(z.h*100), x: Math.round(z.x*100), y: Math.round(z.y*100)})}));
      const del = el('button', {className:'icon-btn danger', attrs:{type:'button'}, text:'×'});
      del.addEventListener('click', () => {
        const arr = getZones(); arr.splice(idx, 1); setZones(arr); render();
      });
      row.appendChild(del);
      list.appendChild(row);
    });
    if(zones.length === 0){
      list.appendChild(el('div', {className:'field-help', text: t('form.specialized.zoneEditor.emptyZones')}));
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

  // Poll sibling `src`; peer fields don't notify on change.
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
export function renderUnitPairField(spec, getObj, setObj){
  const units   = spec.units  || {};
  const convert = spec.convertFn;
  const fk  = spec.fromKey      || 'fromValue';
  const fuk = spec.fromUnitKey  || 'fromUnit';
  const tk  = spec.toKey        || 'toValue';
  const tuk = spec.toUnitKey    || 'toUnit';

  const obj = getObj() || {};

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
  outer.appendChild(el('label', {text: spec.label || t('form.specialized.unitPair.defaultLabel')}));
  if(spec.help) outer.appendChild(el('div', {className:'field-help', text: spec.help}));

  const row = el('div');
  row.style.cssText = 'display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-top:0.3rem;';

  const fromValInp = el('input', {attrs:{type:'number', step:'any', placeholder: t('form.specialized.unitPair.inputPlaceholder')}});
  fromValInp.style.cssText = 'width:110px; flex:0 0 110px;';
  fromValInp.value = obj[fk] != null ? String(obj[fk]) : '';

  const fromUnitSel = buildSelect(obj[fuk]);
  const swapBtn = el('button', {className:'icon-btn', attrs:{type:'button', title: t('form.specialized.unitPair.swapTitle')}, text:'⇄'});
  swapBtn.style.cssText = 'font-weight:700; color:var(--primary); font-size:1rem; flex:none; min-width:32px;';

  const toValInp = el('input', {attrs:{type:'number', step:'any', placeholder: t('form.specialized.unitPair.outputPlaceholder')}});
  toValInp.style.cssText = 'width:110px; flex:0 0 110px;';
  toValInp.value = obj[tk] != null ? String(obj[tk]) : '';

  const toUnitSel = buildSelect(obj[tuk]);

  const errSpan = el('span');
  errSpan.style.cssText = 'font-size:0.75rem; color:var(--danger); display:none; width:100%;';
  errSpan.textContent = t('form.specialized.unitPair.incompatible');

  row.appendChild(fromValInp); row.appendChild(fromUnitSel);
  row.appendChild(swapBtn);
  row.appendChild(toValInp);   row.appendChild(toUnitSel);
  row.appendChild(errSpan);
  outer.appendChild(row);
  outer.appendChild(el('div', {className:'field-help',
    text: t('form.specialized.unitPair.help')}));

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

// unit-from-to: two unit selects + swap button. "To" is restricted to "from"'s
// category, so incompatible pairs (time to speed) can't be picked. Each
// category also has a "Zufällig (cat)" entry stored as "*:<cat>"; the runtime
// resolves it to a random unit from that category per round.
export function renderUnitFromToField(spec, getObj, setObj){
  const units = spec.units || {};
  const fk = spec.fromKey || 'fromUnit';
  const tk = spec.toKey   || 'toUnit';
  const obj = getObj() || {};

  const cats = {};
  Object.entries(units).forEach(([id, u]) => {
    if(!cats[u.cat]) cats[u.cat] = [];
    cats[u.cat].push({ id, label: u.label || id });
  });
  function isCatRef(v){ return typeof v === 'string' && v.indexOf('*:') === 0; }
  function categoryOf(unitId){
    if(isCatRef(unitId)) return unitId.slice(2);
    return units[unitId] ? units[unitId].cat : null;
  }
  function populateSelect(sel, currentVal, restrictCat){
    sel.innerHTML = '';
    Object.entries(cats).forEach(([catName, items]) => {
      if(restrictCat && catName !== restrictCat) return;
      const og = document.createElement('optgroup');
      og.label = catName;
      // Category-wildcard entry: picks a random unit from this category every round.
      const wildcard = document.createElement('option');
      wildcard.value = '*:' + catName;
      wildcard.textContent = t('form.specialized.unitFromTo.randomOption', {cat: catName});
      og.appendChild(wildcard);
      items.forEach(({id, label}) => {
        const op = document.createElement('option');
        op.value = id; op.textContent = label;
        og.appendChild(op);
      });
      sel.appendChild(og);
    });
    const valid = Array.from(sel.querySelectorAll('option')).some(o => o.value === currentVal);
    if(valid){
      sel.value = currentVal;
    } else {
      sel.value = sel.querySelector('option')?.value || '';
    }
  }
  function buildSelect(){
    const sel = el('select');
    sel.style.cssText = 'flex:1; min-width:90px;';
    return sel;
  }

  const wrap = el('div', {className:'field field-full'});
  wrap.appendChild(el('label', {text: spec.label || t('form.specialized.unitFromTo.defaultLabel')}));
  if(spec.help) wrap.appendChild(el('div', {className:'field-help', text: spec.help}));

  const row = el('div');
  row.style.cssText = 'display:flex; align-items:center; gap:0.4rem; margin-top:0.2rem;';

  const fromSel = buildSelect();
  const swapBtn = el('button', {className:'icon-btn', attrs:{type:'button', title: t('form.specialized.unitFromTo.swapTitle')}, text:'⇄'});
  swapBtn.style.cssText = 'font-weight:700; color:var(--primary); font-size:1rem; flex:none; min-width:32px;';
  const toSel = buildSelect();

  // From: all categories. To: only the same category as From.
  populateSelect(fromSel, obj[fk] || (Object.keys(units)[0] || ''), null);
  populateSelect(toSel,   obj[tk] || '', categoryOf(fromSel.value));
  // Persist any auto-correction (e.g. when from/to started in mismatched
  // categories) so the config matches the visible state.
  if(toSel.value && toSel.value !== obj[tk]) setObj(tk, toSel.value);

  fromSel.addEventListener('change', () => {
    setObj(fk, fromSel.value);
    // Re-populate "to" with the new category; pick the first compatible unit
    // if the previous one is no longer valid.
    populateSelect(toSel, toSel.value, categoryOf(fromSel.value));
    setObj(tk, toSel.value);
  });
  toSel.addEventListener('change', () => setObj(tk, toSel.value));
  swapBtn.addEventListener('click', e => {
    e.preventDefault();
    const f = fromSel.value, t = toSel.value;
    // Both stay in the same category, so swapping is always safe.
    fromSel.value = t;
    populateSelect(toSel, f, categoryOf(t));
    setObj(fk, t); setObj(tk, toSel.value);
  });

  row.appendChild(fromSel); row.appendChild(swapBtn); row.appendChild(toSel);
  wrap.appendChild(row);
  return wrap;
}
