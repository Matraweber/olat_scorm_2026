// form-math.js: math-input renderers (math-textarea with LaTeX live
// preview, formula-text with function/symbol toolbar). Pulled out of
// form.js to isolate the KaTeX integration in one place.

import { el } from './util.js';
import { MATH_CATS, FORMULA_FN_BTNS } from './math-toolbar-data.js';

export function renderMathTextarea(spec, getObj, setObj, wrap){
  const obj = getObj() || {};

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
      } catch{}
    }
  }

  ta.addEventListener('input', () => {
    setObj(spec.key, ta.value);
    updateMathPreview();
    if(typeof spec.onChange === 'function'){
      spec.onChange(ta.value, getObj() || {}, (k, v) => setObj(k, v));
    }
  });
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
export function renderFormulaText(spec, getObj, setObj, wrap){
  const obj = getObj() || {};

  const formulaWrap = el('div', {className:'formula-field'});
  const fbar  = el('div', {className:'formula-toolbar'});
  const finp  = el('input', {attrs:{type:'text', placeholder: spec.placeholder || ''}});
  finp.dataset.formulaFieldKey = spec.key;
  finp.value  = obj[spec.key] != null ? String(obj[spec.key]) : '';
  // Auto-derivation fires this event to update the input without a re-render.
  finp.addEventListener('formula-field-set', e => {
    if(e.detail && e.detail.value != null && finp.value !== e.detail.value){
      finp.value = e.detail.value;
    }
  });

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

