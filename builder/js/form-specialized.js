// form-specialized.js: block-specific complex field renderers.
//   * zone-editor    drag rectangles onto an image (hotzone block)
//   * unit-pair      paired unit selectors (unit-convert block)
//   * unit-from-to   from/to unit selectors with category switcher
//   * choice-matrix  rows × columns grid with the correct ticks (table, matrix mode)
//   * grid-table     free table: rows/columns, cell kinds, points (table, grid mode)

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

// choice-matrix: grid editor for the table block's "Auswahl-Matrix".
// Value: { rows:[{id,label}], cols:[{id,label}], correct:['rowId|colId', …] }.
// Rows/columns are named and added/removed in place; a ticked cell is a
// correct answer. Label edits and ticks save without re-rendering (keeps
// focus); structural changes (add/remove) re-render the grid.
export function renderChoiceMatrix(spec, getObj, setObj, wrap){
  const box = el('div', {className:'choice-matrix-editor'});
  const newId = p => p + Math.random().toString(36).slice(2, 8);
  function read(){
    const m = (getObj() || {})[spec.key] || {};
    const fix = (arr, p) => (Array.isArray(arr) ? arr : []).map(x => ({ id: (x && x.id) || newId(p), label: (x && x.label) || '' }));
    return { rows: fix(m.rows, 'r'), cols: fix(m.cols, 'c'), correct: Array.isArray(m.correct) ? m.correct.slice() : [] };
  }
  let m = read();
  if(!m.rows.length && !m.cols.length){
    // Fresh block: start with a 3 × 3 grid so the editor is usable at once.
    m.rows = [1, 2, 3].map(() => ({ id: newId('r'), label: '' }));
    m.cols = [1, 2, 3].map(() => ({ id: newId('c'), label: '' }));
    setObj(spec.key, m);
  }
  const save = () => setObj(spec.key, { rows: m.rows.map(r => ({...r})), cols: m.cols.map(c => ({...c})), correct: m.correct.slice() });
  const key = (r, c) => r.id + '|' + c.id;

  function iconBtn(text, title, onClick){
    const b = el('button', {className:'icon-btn', attrs:{type:'button', title}, text});
    b.addEventListener('click', onClick);
    return b;
  }
  function labelInput(item, placeholder){
    const inp = el('input', {className:'choice-matrix-label', attrs:{type:'text', placeholder}});
    inp.value = item.label || '';
    inp.addEventListener('input', () => { item.label = inp.value; save(); });
    return inp;
  }
  function render(){
    box.innerHTML = '';
    const scroller = el('div', {className:'choice-matrix-scroll'});
    const tbl = el('table', {className:'choice-matrix-table'});
    const head = el('tr');
    head.appendChild(el('th', {className:'choice-matrix-corner', text: t('form.choiceMatrix.corner')}));
    m.cols.forEach((c, ci) => {
      const th = el('th');
      const cell = el('div', {className:'choice-matrix-head'});
      cell.appendChild(labelInput(c, t('form.choiceMatrix.colPlaceholder', { n: ci + 1 })));
      cell.appendChild(iconBtn('✕', t('form.choiceMatrix.removeCol'), () => {
        m.cols.splice(ci, 1);
        m.correct = m.correct.filter(k => !k.endsWith('|' + c.id));
        save(); render();
      }));
      th.appendChild(cell);
      head.appendChild(th);
    });
    const addColTh = el('th');
    addColTh.appendChild(iconBtn('+', t('form.choiceMatrix.addCol'), () => {
      m.cols.push({ id: newId('c'), label: '' }); save(); render();
    }));
    head.appendChild(addColTh);
    tbl.appendChild(head);

    m.rows.forEach((r, ri) => {
      const tr = el('tr');
      const th = el('th');
      const cell = el('div', {className:'choice-matrix-head'});
      cell.appendChild(labelInput(r, t('form.choiceMatrix.rowPlaceholder', { n: ri + 1 })));
      cell.appendChild(iconBtn('✕', t('form.choiceMatrix.removeRow'), () => {
        m.rows.splice(ri, 1);
        m.correct = m.correct.filter(k => !k.startsWith(r.id + '|'));
        save(); render();
      }));
      th.appendChild(cell);
      tr.appendChild(th);
      m.cols.forEach(c => {
        const td = el('td', {className:'choice-matrix-cell'});
        const cb = el('input', {attrs:{type:'checkbox', title: t('form.choiceMatrix.cellTitle')}});
        cb.checked = m.correct.includes(key(r, c));
        cb.addEventListener('change', () => {
          const k = key(r, c);
          m.correct = m.correct.filter(x => x !== k);
          if(cb.checked) m.correct.push(k);
          save();
        });
        td.appendChild(cb);
        tr.appendChild(td);
      });
      tr.appendChild(el('td'));
      tbl.appendChild(tr);
    });
    const addRowTr = el('tr');
    const addRowTh = el('th');
    addRowTh.appendChild(iconBtn('+', t('form.choiceMatrix.addRow'), () => {
      m.rows.push({ id: newId('r'), label: '' }); save(); render();
    }));
    addRowTr.appendChild(addRowTh);
    tbl.appendChild(addRowTr);
    scroller.appendChild(tbl);
    box.appendChild(scroller);
    box.appendChild(el('div', {className:'field-help', text: t('form.choiceMatrix.hint')}));
  }
  render();
  wrap.appendChild(box);
  return wrap;
}

// grid-table: editor for the table block's "Freie Tabelle".
// Value: { rows:[{id,kind}], cols:[{id,kind}], cells:{ 'rowId|colId': {text, formula, tolerance, answers, options} } }.
// Column kind: 'text' | 'numeric' | 'textAnswer' | 'choice'. Row kind: '' (= like the
// column) or one of those, overriding the column. Each cell shows the inputs
// its resolved kind needs. Kind changes and add/remove re-render the grid;
// typing saves without re-rendering (keeps focus).
export function renderGridTable(spec, getObj, setObj, wrap){
  const box = el('div', {className:'grid-table-editor'});
  const newId = p => p + Math.random().toString(36).slice(2, 8);
  const KINDS = ['text', 'numeric', 'textAnswer', 'choice'];
  function read(){
    const g = (getObj() || {})[spec.key] || {};
    const fix = (arr, p, def) => (Array.isArray(arr) ? arr : []).map(x => ({
      id: (x && x.id) || newId(p), kind: (x && (KINDS.includes(x.kind) || x.kind === '')) ? x.kind : def
    }));
    return { rows: fix(g.rows, 'r', ''), cols: fix(g.cols, 'c', 'text'),
             cells: (g.cells && typeof g.cells === 'object') ? JSON.parse(JSON.stringify(g.cells)) : {} };
  }
  let g = read();
  if(!g.rows.length && !g.cols.length){
    // Fresh grid: label column + answer column, three rows.
    g.cols = [{ id: newId('c'), kind: 'text' }, { id: newId('c'), kind: 'numeric' }];
    g.rows = [1, 2, 3].map(() => ({ id: newId('r'), kind: '' }));
    setObj(spec.key, g);
  }
  const save = () => setObj(spec.key, JSON.parse(JSON.stringify(g)));
  const cellOf = (r, c) => (g.cells[r.id + '|' + c.id] = g.cells[r.id + '|' + c.id] || {});
  const kindOf = (r, c) => r.kind || c.kind || 'text';

  function kindSelect(value, withInherit, onChange){
    const sel = el('select', {className:'grid-table-kind'});
    const opts = (withInherit ? [['', t('form.gridTable.kindInherit')]] : [])
      .concat(KINDS.map(k => [k, t('form.gridTable.kind.' + k)]));
    opts.forEach(([v, label]) => sel.appendChild(el('option', {attrs:{value:v}, text:label})));
    sel.value = value;
    sel.addEventListener('change', () => onChange(sel.value));
    return sel;
  }
  function iconBtn(text, title, onClick){
    const b = el('button', {className:'icon-btn', attrs:{type:'button', title}, text});
    b.addEventListener('click', onClick);
    return b;
  }
  function field(cell, key, placeholder, cls){
    const inp = el('input', {className:'grid-table-input' + (cls ? ' ' + cls : ''), attrs:{type:'text', placeholder}});
    inp.value = cell[key] != null ? String(cell[key]) : '';
    inp.addEventListener('input', () => { cell[key] = inp.value; save(); });
    return inp;
  }
  function cellEditor(r, c){
    const td = el('td');
    const kind = kindOf(r, c);
    const cell = cellOf(r, c);
    td.className = 'grid-table-cell grid-kind-' + kind;
    if(kind === 'text'){
      td.appendChild(field(cell, 'text', t('form.gridTable.textPlaceholder')));
    } else if(kind === 'numeric'){
      td.appendChild(field(cell, 'formula', t('form.gridTable.formulaPlaceholder')));
      td.appendChild(field(cell, 'tolerance', t('form.gridTable.tolPlaceholder'), 'grid-table-tol'));
    } else if(kind === 'choice'){
      // Dropdown: options separated by |, the first one is the correct answer.
      td.appendChild(field(cell, 'options', t('form.gridTable.optionsPlaceholder')));
    } else {
      td.appendChild(field(cell, 'answers', t('form.gridTable.answersPlaceholder')));
    }
    if(kind !== 'text'){
      // Does this answer cell count towards the points? (unset = yes)
      const lbl = el('label', {className:'grid-table-graded', attrs:{title: t('form.gridTable.gradedTitle')}});
      const cb = el('input', {attrs:{type:'checkbox'}});
      cb.checked = cell.graded !== false;
      // Per-cell points (only with "Punkte je Zelle" on and the cell graded).
      const pts = el('input', {className:'grid-table-pts', attrs:{type:'number', min:'0', step:'0.5', title: t('form.gridTable.pointsTitle')}});
      pts.value = cell.points != null && cell.points !== '' ? String(cell.points) : '1';
      pts.addEventListener('input', () => { cell.points = pts.value === '' ? '' : Number(pts.value); save(); });
      const showPts = () => { pts.style.display = (cellPointsOn() && cb.checked) ? '' : 'none'; };
      cb.addEventListener('change', () => {
        cell.graded = cb.checked;
        td.classList.toggle('grid-ungraded', !cb.checked);
        showPts();
        save();
      });
      lbl.appendChild(cb);
      lbl.appendChild(el('span', {text: t('form.gridTable.graded')}));
      lbl.appendChild(pts);
      showPts();
      td.appendChild(lbl);
      td.classList.toggle('grid-ungraded', cell.graded === false);
    }
    return td;
  }
  // Block-level switch "points per cell", stored in config.gridCellPoints.
  const cellPointsOn = () => !!(getObj() || {}).gridCellPoints;
  function render(){
    box.innerHTML = '';
    // Switch: points per graded cell instead of an equal share of the total.
    // Lives in the editor so the point inputs appear right away.
    const togLbl = el('label', {className:'checkbox-field grid-table-cellpts', attrs:{title: t('form.gridTable.cellPointsTitle')}});
    const tog = el('input', {attrs:{type:'checkbox'}});
    tog.checked = cellPointsOn();
    tog.addEventListener('change', () => { setObj('gridCellPoints', tog.checked); render(); });
    togLbl.appendChild(tog);
    togLbl.appendChild(el('span', {text: t('form.gridTable.cellPoints')}));
    box.appendChild(togLbl);
    const scroller = el('div', {className:'choice-matrix-scroll'});
    const tbl = el('table', {className:'grid-table-table'});
    const head = el('tr');
    head.appendChild(el('th', {className:'choice-matrix-corner', text: t('form.gridTable.corner')}));
    g.cols.forEach((c, ci) => {
      const th = el('th');
      const wrapH = el('div', {className:'choice-matrix-head'});
      wrapH.appendChild(kindSelect(c.kind, false, v => { c.kind = v; save(); render(); }));
      wrapH.appendChild(iconBtn('✕', t('form.gridTable.removeCol'), () => {
        g.cols.splice(ci, 1);
        Object.keys(g.cells).forEach(k => { if(k.endsWith('|' + c.id)) delete g.cells[k]; });
        save(); render();
      }));
      th.appendChild(wrapH);
      head.appendChild(th);
    });
    const addColTh = el('th');
    addColTh.appendChild(iconBtn('+', t('form.gridTable.addCol'), () => { g.cols.push({ id: newId('c'), kind: 'text' }); save(); render(); }));
    head.appendChild(addColTh);
    tbl.appendChild(head);

    g.rows.forEach((r, ri) => {
      const tr = el('tr');
      const th = el('th');
      const wrapH = el('div', {className:'choice-matrix-head'});
      wrapH.appendChild(el('span', {className:'grid-table-rownum', text: String(ri + 1)}));
      wrapH.appendChild(kindSelect(r.kind, true, v => { r.kind = v; save(); render(); }));
      wrapH.appendChild(iconBtn('✕', t('form.gridTable.removeRow'), () => {
        g.rows.splice(ri, 1);
        Object.keys(g.cells).forEach(k => { if(k.startsWith(r.id + '|')) delete g.cells[k]; });
        save(); render();
      }));
      th.appendChild(wrapH);
      tr.appendChild(th);
      g.cols.forEach(c => tr.appendChild(cellEditor(r, c)));
      tr.appendChild(el('td'));
      tbl.appendChild(tr);
    });
    const addRowTr = el('tr');
    const addRowTh = el('th');
    addRowTh.appendChild(iconBtn('+', t('form.gridTable.addRow'), () => { g.rows.push({ id: newId('r'), kind: '' }); save(); render(); }));
    addRowTr.appendChild(addRowTh);
    tbl.appendChild(addRowTr);
    scroller.appendChild(tbl);
    box.appendChild(scroller);
    box.appendChild(el('div', {className:'field-help', text: t('form.gridTable.hint')}));
  }
  render();
  wrap.appendChild(box);
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
