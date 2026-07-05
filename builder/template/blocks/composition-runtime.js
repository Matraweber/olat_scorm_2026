// composition-runtime.js: SCORM-Runtime helpers for the composition block.
// Runs in the generated SCORM ZIP when a learner views a composition.
// Reads from window.CompositionHelpers + window.BlockUtils; exposes
// mount-mode handlers on window.CompositionRuntime so composition.js
// can pull them into the registered Blocks.mount() dispatcher.
(function(){
  'use strict';

  const H = window.CompositionHelpers;
  if(!H) throw new Error("composition-runtime.js: window.CompositionHelpers not loaded.");
  const {
    NS, buildSvg, renderShape,
    parseSlotTokens, slotNumbersInLabel, expandSlotRefs, formatSlotValue
  } = H;

  // Runtime mount helpers (SCORM player)

  // Roll variable values (shared across all modes).
  function compGenVars(variables){
    const vars = {};
    (variables || []).forEach(v => {
      if(!v || !v.name) return;
      const lo = Number(v.min); const hi = Number(v.max);
      const a = isNaN(lo) ? 1 : lo;
      const b = isNaN(hi) ? 10 : hi;
      let val = a + Math.random() * (b - a);
      if(v.integer !== false) val = Math.round(val);
      else val = Math.round(val * 100) / 100;
      vars[v.name] = val;
    });
    return vars;
  }
  function compFillTemplate(str, vars){
    return String(str || '').replace(/\{([A-Za-z_][A-Za-z_0-9]*)\}/g, (m, name) => {
      if(name in vars){
        const v = vars[name];
        return Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
      }
      return m;
    });
  }
  function compApplyVarsToShapes(shapes, vars){
    return (shapes || []).map(sh => {
      if(sh.type !== 'label') return sh;
      return Object.assign({}, sh, { text: compFillTemplate(sh.text, vars) });
    });
  }

  // Wrap an SVG inside the standard SCORM card.
  function makeRuntimeCard(host, config){
    const u = window.BlockUtils;
    const opts = {
      title: u.l(config.blockTitle) || u.t('block.composition.label'),
      qBoxTitle: u.t('common.task')
    };
    if(config.prompt && String(config.prompt).trim()){
      opts.question = u.l(config.prompt);
    }
    const ui = u.simpleQuestionCard(host, opts);
    return ui;
  }
  function appendSvg(parentEl, config, idPrefix, opts){
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; justify-content:center; padding:0.4rem 0;';
    // Runtime mount path: cap by viewport so preview/SCORM never scrolls.
    const merged = Object.assign({ idPrefix, capViewport: true }, opts || {});
    const svg = buildSvg(config, merged);
    wrap.appendChild(svg);
    parentEl.appendChild(wrap);
    return svg;
  }

  // Mode: static (no grading)
  function mountStatic(host, config, api){
    const u = window.BlockUtils;
    const card = document.createElement('section');
    card.className = 'section-card block-question';
    const h3 = document.createElement('h3');
    h3.textContent = u.l(config.blockTitle) || u.t('block.composition.label');
    card.appendChild(h3);
    appendSvg(card, config, 'arr-' + (api.blockId || 'r'));
    host.appendChild(card);
    return {};
  }

  // Mode dispatcher; graded modes share the standard question card.
  function mountGraded(host, config, api, mode){
    const ui = makeRuntimeCard(host, config);
    const maxPoints = Math.max(1, Number(config.maxPoints) || 1);
    api.initScore(maxPoints);
    if(mode === 'acknowledge') return runAcknowledge(ui, config, api, maxPoints);
    if(mode === 'click')       return runClick(ui, config, api, maxPoints);
    if(mode === 'fillblanks')  return runFillBlanks(ui, config, api, maxPoints);
    if(mode === 'hotspot')     return runHotspot(ui, config, api, maxPoints);
    return {};
  }

  // Mode: acknowledge. SVG + "Verstanden"-Button.
  function runAcknowledge(ui, config, api, maxPoints){
    const t = (api && api.utils && api.utils.t) ? api.utils.t : window.BlockUtils.t;
    appendSvg(ui.content, config, 'comp-ack-' + (api?.blockId || ''));
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.type = 'button';
    btn.textContent = t('block.composition.runtime.acknowledge.button', { pts: maxPoints });
    let done = false;
    btn.addEventListener('click', () => {
      if(done) return;
      done = true;
      btn.disabled = true;
      ui.fb.ok(t('block.composition.runtime.acknowledge.confirmed', { pts: maxPoints, max: maxPoints }));
      api.reportScore(maxPoints);
    });
    ui.buttons.appendChild(btn);
    return {};
  }

  // Mode: click. Clicking a shape marked isCorrect awards points
  function runClick(ui, config, api, maxPoints){
    const t = (api && api.utils && api.utils.t) ? api.utils.t : window.BlockUtils.t;
    const svg = appendSvg(ui.content, config, 'comp-click-' + (api?.blockId || ''));
    const shapes = config.shapes || [];
    const correctCount = shapes.filter(s => s.isCorrect).length;
    const penalize     = !!config.penalizeWrong;
    let foundCorrect = 0;
    let wrongClicks  = 0;
    let locked = false;

    function recomputeScore(){
      if(correctCount === 0){ api.reportScore(0); return; }
      const ratio = penalize
        ? Math.max(0, (foundCorrect - wrongClicks) / correctCount)
        : (foundCorrect / correctCount);
      api.reportScore(Math.round(ratio * maxPoints * 100) / 100);
    }
    function markShape(node, kind){
      node.classList.add('comp-graded-' + kind);
      node.style.cursor = 'default';
    }
    // Click each shape: green = correct, red = wrong.
    svg.querySelectorAll('[data-shape-idx]').forEach(node => {
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => {
        if(locked) return;
        const idx = parseInt(node.getAttribute('data-shape-idx'), 10);
        const sh = shapes[idx];
        if(!sh || node.classList.contains('comp-graded-correct') || node.classList.contains('comp-graded-wrong')) return;
        if(sh.isCorrect){ foundCorrect++; markShape(node, 'correct'); }
        else            { wrongClicks++;  markShape(node, 'wrong'); }
        recomputeScore();
        if(foundCorrect === correctCount){ ui.fb.ok(t('block.composition.runtime.click.allFound')); }
      });
    });

    const checkBtn = document.createElement('button');
    checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = t('block.composition.runtime.click.finish');
    checkBtn.addEventListener('click', () => {
      if(locked) return;
      locked = true;
      checkBtn.disabled = true;
      // Reveal correct shapes the learner missed.
      svg.querySelectorAll('[data-shape-idx]').forEach(node => {
        const idx = parseInt(node.getAttribute('data-shape-idx'), 10);
        const sh = shapes[idx];
        if(sh && sh.isCorrect && !node.classList.contains('comp-graded-correct')){
          node.classList.add('comp-graded-missed');
        }
        node.style.cursor = 'default';
      });
      const pts = correctCount === 0 ? 0
                : penalize ? Math.max(0, Math.round((foundCorrect - wrongClicks) / correctCount * maxPoints * 100) / 100)
                           : Math.round((foundCorrect / correctCount) * maxPoints * 100) / 100;
      api.reportScore(pts);
      const msg = wrongClicks
        ? t('block.composition.runtime.click.summaryWithWrong', { found: foundCorrect, total: correctCount, wrong: wrongClicks, pts, max: maxPoints })
        : t('block.composition.runtime.click.summary', { found: foundCorrect, total: correctCount, pts, max: maxPoints });
      if(pts >= maxPoints)    ui.fb.ok(msg);
      else if(pts > 0)        ui.fb.neutral(msg);
      else                    ui.fb.bad(msg);
    });
    ui.buttons.appendChild(checkBtn);
    return {};
  }

  // Mode: fillblanks. Label shapes with {} / {N} placeholders become inputs.
  // {N*} renders as a read-only mirror of slot N's expected value, so authors
  // can build multi-step problems where step 2 references step 1's solution.
  function runFillBlanks(ui, config, api, maxPoints){
    const u = window.BlockUtils;
    const variables = Array.isArray(config.variables) ? config.variables : [];
    let currentVars = {};
    const renderedSvgHost = document.createElement('div');
    ui.content.appendChild(renderedSvgHost);

    const genVars       = () => compGenVars(variables);
    const fillTemplate  = compFillTemplate;
    function evalFormula(expr, vars){
      if(!expr) return null;
      try {
        const r = u.safeMathExpr(expandSlotRefs(expr), vars);
        if(typeof r === 'number' && Number.isFinite(r)) return r;
      } catch{}
      return null;
    }
    // Pre-compute expected values for every input slot in slot-number order,
    // so a slot's formula can reference earlier slots via {1*}/s1. Returns
    // { 1: {value, asString, tolerance, formula}, 2: ... } and `slotVars`
    // (the s1, s2, ... map suitable for safeMathExpr).
    function computeSlotExpected(){
      const shapes = config.shapes || [];
      const usedSlots = new Set();
      shapes.forEach(sh => {
        if(sh.type !== 'label' || !sh.text) return;
        slotNumbersInLabel(sh.text).forEach(n => usedSlots.add(n));
        // Legacy {} counts as the first unnamed slot.
        if(sh.text.indexOf('{}') >= 0) usedSlots.add(0);
      });
      const slotOrder = Array.from(usedSlots).sort((a, b) => a - b);
      const results = {};
      const slotVars = {};
      // Block-level tolerance as default; slot-specific tolerance still wins.
      const defaultTolerance = Number(config.tolerance);
      const blockTolerance = Number.isFinite(defaultTolerance) && defaultTolerance >= 0
        ? defaultTolerance : 0.01;
      // For each slot, find the label(s) that own it and look up its formula.
      slotOrder.forEach(n => {
        let formula = null, tolerance = blockTolerance, ownerLabel = null;
        for(const sh of shapes){
          if(sh.type !== 'label') continue;
          // Numbered slot: look in sh.formulas[n] first.
          if(n > 0 && sh.formulas && sh.formulas[n] && sh.formulas[n].formula){
            formula = sh.formulas[n].formula;
            tolerance = Number(sh.formulas[n].tolerance) || tolerance;
            ownerLabel = sh; break;
          }
          // Legacy: a label that has {N} (or {} for n=0) AND a sh.formula.
          const hasNumbered = n > 0 && slotNumbersInLabel(sh.text || '').indexOf(n) >= 0;
          const hasLegacy   = n === 0 && (sh.text || '').indexOf('{}') >= 0;
          if((hasNumbered || hasLegacy) && sh.formula && String(sh.formula).trim()){
            formula = sh.formula;
            tolerance = Number(sh.tolerance) || tolerance;
            ownerLabel = sh; break;
          }
        }
        const allVars = Object.assign({}, currentVars, slotVars);
        let value = formula ? evalFormula(formula, allVars) : null;
        // Static fallback: if no formula but label has correctText.
        if(value == null && ownerLabel && ownerLabel.correctText){
          const filled = fillTemplate(String(ownerLabel.correctText), allVars);
          const asNum = u.parseNum(filled);
          if(asNum != null) value = asNum;
        }
        const asString = value == null ? '' : formatSlotValue(value);
        results[n] = { value, asString, tolerance, formula };
        if(n > 0 && value != null) slotVars['s' + n] = value;
      });
      return { results, slotVars };
    }

    function render(){
      renderedSvgHost.innerHTML = '';
      // Substitute named variables {name} (numbered {N} placeholders are kept).
      const shapes = (config.shapes || []).map(sh => {
        if(sh.type !== 'label') return sh;
        return Object.assign({}, sh, { text: fillTemplate(sh.text, currentVars) });
      });
      const renderConfig = Object.assign({}, config, { shapes });
      const svg = appendSvg(renderedSvgHost, renderConfig, 'comp-blanks-' + (api?.blockId || ''));
      const slotInfo = computeSlotExpected();
      const blanks = [];
      // Mirror spans grouped by the slot they display, so we can refresh them
      // when the matching input changes.
      const mirrorsBySlot = {};

      shapes.forEach((sh, idx) => {
        if(sh.type !== 'label') return;
        const text = sh.text || '';
        const tokens = parseSlotTokens(text);
        const hasInline = tokens.some(t => t.kind === 'slot' || t.kind === 'mirror');
        if(!sh.blank && !hasInline) return;
        const textNode = svg.querySelector('text[data-shape-idx="' + idx + '"]');
        if(!textNode) return;
        const fs = sh.fontSize || 18;
        const fontWeight = sh.fontWeight || 400;
        const color = sh.color || '#003b5c';

        function makeInput(width){
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'comp-blank-input';
          inp.style.cssText = 'min-width:' + width + 'px; width:' + width + 'px; height:' + (fs + 12) + 'px; box-sizing:border-box; ' +
            'font:' + fontWeight + ' ' + (fs - 2) + 'px Verdana,Arial,sans-serif; ' +
            'padding:0 0.4rem; border:1px solid var(--line, #d8e0e6); border-radius:6px; background:#fff; color:#003b5c;';
          inp.placeholder = '?';
          return inp;
        }

        if(hasInline){
          // Mixed text + slots + mirrors. Build a flow layout with a foreignObject.
          const charW = fs * 0.55;
          // Width estimate: text segments + per-slot input + per-mirror span.
          let estW = 12;
          tokens.forEach(t => {
            if(t.kind === 'text') estW += t.text.length * charW;
            else if(t.kind === 'slot'){
              const n = t.n == null ? 0 : t.n;
              const expectedStr = (slotInfo.results[n] && slotInfo.results[n].asString) || '';
              estW += Math.max(60, expectedStr.length * fs * 0.55 + 20);
            } else if(t.kind === 'mirror'){
              estW += Math.max(40, 4 * charW + 8);
            }
          });

          const fo = document.createElementNS(NS, 'foreignObject');
          fo.setAttribute('x', sh.x - 2);
          fo.setAttribute('y', sh.y - fs);
          fo.setAttribute('width', estW);
          fo.setAttribute('height', fs + 16);
          fo.setAttribute('data-shape-idx', String(idx));

          const wrap = document.createElement('div');
          wrap.style.cssText = 'display:flex; align-items:center; gap:3px; height:' + (fs + 12) + 'px; ' +
            'font:' + fontWeight + ' ' + fs + 'px Verdana,Arial,sans-serif; color:' + color + '; white-space:nowrap;';

          tokens.forEach(t => {
            if(t.kind === 'text'){
              if(t.text){
                const s = document.createElement('span');
                s.textContent = t.text;
                wrap.appendChild(s);
              }
            } else if(t.kind === 'slot'){
              const n = t.n == null ? 0 : t.n;
              const exp = slotInfo.results[n] || { value:null, asString:'', tolerance:0.01, formula:null };
              const expectedStr = exp.asString || '';
              const inputW = Math.max(60, expectedStr.length * fs * 0.55 + 20);
              const inp = makeInput(inputW);
              wrap.appendChild(inp);
              blanks.push({ slotN: n, idx, input: inp, expected: exp });
            } else if(t.kind === 'mirror'){
              const n = t.n;
              const span = document.createElement('span');
              span.className = 'comp-mirror';
              span.style.cssText = 'display:inline-block; min-width:1.5em; padding:0 0.25rem; ' +
                'border-bottom:1px dashed #84bf66; color:#0f567d; font-style:italic;';
              span.textContent = '?';
              wrap.appendChild(span);
              (mirrorsBySlot[n] = mirrorsBySlot[n] || []).push(span);
            }
          });
          fo.appendChild(wrap);
          textNode.replaceWith(fo);
        } else if(sh.blank){
          // Legacy blank:true with no inline placeholder. Replace whole label.
          const exp = slotInfo.results[0] || { value:null, asString:'', tolerance:0.01, formula:null };
          const expectedStr = exp.asString || '';
          const inputW = Math.max(60, expectedStr.length * fs * 0.55 + 20);
          const fo = document.createElementNS(NS, 'foreignObject');
          fo.setAttribute('x', sh.x - 2);
          fo.setAttribute('y', sh.y - fs);
          fo.setAttribute('width', inputW + 8);
          fo.setAttribute('height', fs + 12);
          fo.setAttribute('data-shape-idx', String(idx));
          const inp = makeInput(inputW);
          inp.style.width = '100%';
          fo.appendChild(inp);
          textNode.replaceWith(fo);
          blanks.push({ slotN: 0, idx, input: inp, expected: exp });
        }
      });

      // Mirror spans show the student's actual entered value (live update).
      function updateMirrorsForSlot(slotN){
        const spans = mirrorsBySlot[slotN];
        if(!spans) return;
        const matching = blanks.filter(b => b.slotN === slotN);
        const val = matching.length ? matching[0].input.value : '';
        const trimmed = String(val || '').trim();
        spans.forEach(s => { s.textContent = trimmed === '' ? '?' : trimmed; });
      }
      blanks.forEach(b => {
        b.input.addEventListener('input', () => updateMirrorsForSlot(b.slotN));
      });
      // Initial fill in case prior values exist (regenerate path).
      Object.keys(mirrorsBySlot).forEach(n => updateMirrorsForSlot(Number(n)));

      return blanks;
    }

    function regenerate(){
      currentVars = genVars();
      const blanks = render();
      checkBtn.disabled = false;
      checked = false;
      currentBlanks = blanks;
      u.renderMath(renderedSvgHost);
      ui.fb.neutral(u.t('block.composition.runtime.fillblanks.regenerated'));
    }

    let currentBlanks = [];
    let checked = false;
    currentVars = genVars();
    currentBlanks = render();

    const checkBtn = document.createElement('button');
    checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = u.t('common.check');
    checkBtn.addEventListener('click', () => {
      if(checked) return;
      if(currentBlanks.length === 0){ ui.fb.neutral(u.t('block.composition.runtime.fillblanks.noBlanks')); api.reportScore(0); return; }
      checked = true;
      checkBtn.disabled = true;
      // Collect what the student actually typed in each numbered slot. Used
      // for follow-through grading: a later slot whose formula references
      // {N*} is re-evaluated against the student's slot N, not the correct
      // one, so a propagated mistake still earns half points.
      const studentSlotValues = {};
      currentBlanks.forEach(b => {
        if(b.slotN > 0){
          const g = u.parseNum(b.input.value);
          if(g != null) studentSlotValues['s' + b.slotN] = g;
        }
      });
      let scoreSum = 0;
      let strictCount = 0;
      let partialCount = 0;
      currentBlanks.forEach(b => {
        const given = String(b.input.value || '').trim();
        const tol = b.expected.tolerance != null ? b.expected.tolerance : 0.01;
        let mark = 'wrong';
        if(b.expected.value != null){
          const gotNum = u.parseNum(given);
          if(gotNum != null && u.nearlyEqual(gotNum, b.expected.value, tol)){
            mark = 'correct';
          } else if(gotNum != null && b.expected.formula){
            // Re-evaluate the slot's formula with the student's earlier
            // answers. If their value is consistent (Folgefehler), give half.
            const ftVars = Object.assign({}, currentVars, studentSlotValues);
            const ftVal = evalFormula(b.expected.formula, ftVars);
            if(ftVal != null && u.nearlyEqual(gotNum, ftVal, tol)){
              mark = 'partial';
            }
          }
        } else if(given.toLowerCase() === b.expected.asString.toLowerCase() && b.expected.asString !== ''){
          mark = 'correct';
        }
        b.input.disabled = true;
        b.input.classList.add(
          mark === 'correct' ? 'comp-blank-ok'
            : mark === 'partial' ? 'comp-blank-partial'
              : 'comp-blank-bad');
        if(mark !== 'correct' && b.expected.asString){
          b.input.title = u.t('block.composition.runtime.fillblanks.solutionTitle', { solution: b.expected.asString });
        }
        if(mark === 'correct'){ scoreSum += 1; strictCount++; }
        else if(mark === 'partial'){ scoreSum += 0.5; partialCount++; }
      });
      const pts = Math.round((scoreSum / currentBlanks.length) * maxPoints * 100) / 100;
      api.reportScore(pts);
      const fullCount = strictCount;
      const msgKey = partialCount > 0
        ? 'block.composition.runtime.fillblanks.summaryWithPartial'
        : 'block.composition.runtime.fillblanks.summary';
      const msg = u.t(msgKey, {
        correct: fullCount, total: currentBlanks.length,
        partial: partialCount, pts, max: maxPoints
      });
      if(fullCount === currentBlanks.length) ui.fb.ok(msg);
      else if(scoreSum > 0)                  ui.fb.neutral(msg);
      else                                   ui.fb.bad(msg);
    });
    ui.buttons.appendChild(checkBtn);

    if(variables.length > 0){
      const newBtn = document.createElement('button');
      newBtn.type = 'button'; newBtn.className = 'btn btn-secondary';
      newBtn.textContent = u.t('common.regenerate');
      newBtn.addEventListener('click', regenerate);
      ui.buttons.appendChild(newBtn);
      window.BlockUtils.regenPolicy(newBtn, config, api);
    }
    return {};
  }

  // Mode: hotspot. Draggable markers must land in their target zones.
  function runHotspot(ui, config, api, maxPoints){
    const svg = appendSvg(ui.content, config, 'comp-hot-' + (api?.blockId || ''));
    const shapes = config.shapes || [];
    const targets = [];
    const markers = [];
    shapes.forEach((sh, idx) => {
      if(sh.isTarget) targets.push({ idx, shape: sh });
      else if(sh.isMarker) markers.push({ idx, shape: sh, node: svg.querySelector('[data-shape-idx="' + idx + '"]') });
    });

    // Dashed outline so learners see where to drop.
    targets.forEach(t => {
      const n = svg.querySelector('[data-shape-idx="' + t.idx + '"]');
      if(n){ n.classList.add('comp-target-zone'); n.style.pointerEvents = 'none'; }
    });

    function shapeCenter(sh){
      if(sh.type === 'line' || sh.type === 'arrow'){
        return { x: (sh.x1 + sh.x2)/2, y: (sh.y1 + sh.y2)/2 };
      }
      if(sh.type === 'circle' || sh.type === 'ellipse' || sh.type === 'polygon'){
        return { x: sh.cx, y: sh.cy };
      }
      return { x: (sh.x || 0) + (sh.w || 0)/2, y: (sh.y || 0) + (sh.h || 0)/2 };
    }
    function pointInTarget(pt, target){
      const t = target.shape;
      if(t.type === 'rect' || t.type === 'image' || t.type === 'coords'){
        return pt.x >= t.x && pt.x <= t.x + t.w && pt.y >= t.y && pt.y <= t.y + t.h;
      }
      if(t.type === 'circle'){
        const dx = pt.x - t.cx, dy = pt.y - t.cy;
        return Math.sqrt(dx*dx + dy*dy) <= t.r;
      }
      if(t.type === 'ellipse'){
        const dx = (pt.x - t.cx) / t.rx, dy = (pt.y - t.cy) / t.ry;
        return dx*dx + dy*dy <= 1;
      }
      // Polygon/label/line/arrow: approximate with a radius.
      const c = shapeCenter(t);
      const r = (t.r || Math.max(t.rx || 50, t.ry || 50));
      const dx = pt.x - c.x, dy = pt.y - c.y;
      return Math.sqrt(dx*dx + dy*dy) <= r;
    }
    function svgPoint(svg, cx, cy){
      const r = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const scale = vb.width / r.width;
      return { x: (cx - r.left) * scale, y: (cy - r.top) * scale };
    }
    function moveShapeTo(sh, dx, dy){
      if(sh.type === 'line' || sh.type === 'arrow'){
        sh.x1 += dx; sh.y1 += dy; sh.x2 += dx; sh.y2 += dy;
      } else if(sh.type === 'circle' || sh.type === 'ellipse' || sh.type === 'polygon'){
        sh.cx += dx; sh.cy += dy;
      } else {
        sh.x += dx; sh.y += dy;
      }
    }
    function refreshMarkerNode(m){
      const def = svg.querySelector('defs');
      const fresh = renderShape(m.shape, def, m.idx, 'comp-hot-' + (api?.blockId || ''));
      if(!fresh) return;
      fresh.setAttribute('data-shape-idx', String(m.idx));
      fresh.classList.add('comp-marker');
      fresh.style.cursor = 'grab';
      m.node.replaceWith(fresh);
      m.node = fresh;
      attachDrag(m);
    }
    function attachDrag(m){
      m.node.addEventListener('mousedown', e => {
        if(locked) return;
        e.preventDefault();
        const start = svgPoint(svg, e.clientX, e.clientY);
        const startShape = JSON.parse(JSON.stringify(m.shape));
        let moved = false;
        function onMove(ev){
          const p = svgPoint(svg, ev.clientX, ev.clientY);
          const dx = p.x - start.x, dy = p.y - start.y;
          if(!moved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) moved = true;
          if(!moved) return;
          // Rebuild from startShape + delta to avoid cumulative drift.
          Object.assign(m.shape, JSON.parse(JSON.stringify(startShape)));
          moveShapeTo(m.shape, dx, dy);
          refreshMarkerNode(m);
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
    markers.forEach(m => {
      if(!m.node) return;
      m.node.classList.add('comp-marker');
      m.node.style.cursor = 'grab';
      attachDrag(m);
    });

    let locked = false;
    const t = (api && api.utils && api.utils.t) ? api.utils.t : window.BlockUtils.t;
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = t('common.check');
    checkBtn.addEventListener('click', () => {
      if(locked) return;
      locked = true;
      checkBtn.disabled = true;
      if(markers.length === 0){ ui.fb.neutral(t('block.composition.runtime.hotspot.noMarkers')); api.reportScore(0); return; }
      let correctCount = 0;
      markers.forEach(m => {
        const targetIdx = Number(m.shape.markerTargetIdx);
        const wantTarget = targets.find(tg => tg.idx === targetIdx);
        const ok = wantTarget && pointInTarget(shapeCenter(m.shape), wantTarget);
        m.node.classList.add(ok ? 'comp-graded-correct' : 'comp-graded-wrong');
        m.node.style.cursor = 'default';
        if(ok) correctCount++;
      });
      const pts = Math.round((correctCount / markers.length) * maxPoints * 100) / 100;
      api.reportScore(pts);
      const msg = t('block.composition.runtime.hotspot.summary', {
        correct: correctCount, total: markers.length, pts, max: maxPoints
      });
      if(correctCount === markers.length) ui.fb.ok(msg);
      else if(correctCount > 0)           ui.fb.neutral(msg);
      else                                ui.fb.bad(msg);
    });
    ui.buttons.appendChild(checkBtn);
    return {};
  }


  window.CompositionRuntime = {
    compGenVars, compApplyVarsToShapes,
    mountStatic, mountGraded
  };
})();
