// task-pane-canvas.js: Canvas render + drag-to-move / drag-to-resize with snap guides.
import { t } from './i18n.js';
import { el, uid, cssEscape, toast, confirmDialog, formDialog, tProp } from './util.js';
import { state, pushHistory, takeHistorySnap, commitHistorySnap, discardHistorySnap } from './state.js';
import { captureBlockAsTemplate, saveUserBlockTemplates } from './tasks.js';
import {
  CANVAS_WIDTH, ensurePos,
  applySnap, applyResizeSnap, showSnapGuides, hideSnapGuides,
  autoFitBlock, fitHeightForCard, RUNTIME_FIT_MARGIN, RUNTIME_FIT_FEEDBACK_MARGIN
} from './canvas.js';
import { renderBlockPreview, measureRuntimeHeight } from './preview.js';
import { renderTaskList } from './panes.js';
import { posLabel } from './task-pane-config.js';

export function renderCanvas(ctx){
  const { task, canvas, selectedBlockIds, seenBlockIds } = ctx;
  canvas.querySelectorAll('.canvas-block-card, .canvas-block-empty').forEach(c => c.remove());
  scheduleTemplateAutofitPass(ctx);
  task.blocks.forEach(block => {
    ensurePos(block, task.blocks);
    const def = window.Blocks.get(block.type);
    const card = el('div', {className:'canvas-block-card', attrs:{'data-block-id': block.id}});
    if(selectedBlockIds.has(block.id)) card.classList.add('selected');
    // Tag .is-new only on first render so fade-in fires once per block.
    if(seenBlockIds && !seenBlockIds.has(block.id)){
      card.classList.add('is-new');
      seenBlockIds.add(block.id);
    }
    Object.assign(card.style, {
      left: block.pos.x + 'px', top: block.pos.y + 'px',
      width: block.pos.w + 'px', height: block.pos.h + 'px'
    });
    const cardHead = el('div', {className:'canvas-block-head'});
    cardHead.appendChild(el('span', {
      className:'canvas-block-type',
      text: ((def && tProp(def, 'label')) || block.type) + (def && def.graded ? t('taskPane.canvas.gradedSuffix') : '')
    }));
    const ctrls = el('div', {className:'canvas-block-controls'});
    const fitBtn = el('button', {className:'icon-btn', attrs:{type:'button', title: t('taskPane.canvas.fitHeightTitle')}, text:'↕'});
    const scormFitBtn = el('button', {className:'icon-btn', attrs:{type:'button', title: t('taskPane.canvas.fitScormTitle')}, text:'⇳'});
    const dupBtn = el('button', {className:'icon-btn', attrs:{type:'button', title: t('common.duplicate')}, text:'⧉'});
    // Block-template button: deep-clones into state.userBlockTemplates.
    const tplBtn = el('button', {className:'icon-btn', attrs:{type:'button', title: t('taskPane.canvas.saveAsTemplateTitle')}, text:'★'});
    const rmBtn  = el('button', {className:'icon-btn danger', attrs:{type:'button', title: t('common.remove')}, text:'✕'});
    fitBtn.addEventListener('click', e => { e.stopPropagation(); autoFitBlock(block); });
    scormFitBtn.addEventListener('click', async e => {
      e.stopPropagation();
      scormFitBtn.disabled = true;
      let h = null;
      try { h = await measureRuntimeHeight(block); } catch{}
      scormFitBtn.disabled = false;
      if(h == null){ toast(t('taskPane.canvas.fitScormFailed'), 'warn'); return; }
      const newH = Math.max(60, Math.ceil(h + RUNTIME_FIT_MARGIN + (def && def.graded ? RUNTIME_FIT_FEEDBACK_MARGIN : 0)));
      if(newH === block.pos.h){ toast(t('taskPane.canvas.fitScormUnchanged')); return; }
      pushHistory();
      block.pos.h = newH;
      renderCanvas(ctx); ctx.renderConfigPane(); ctx.adjustCanvasHeight();
      toast(t('taskPane.canvas.fitScormDone', { h: newH }));
    });
    dupBtn.addEventListener('click', e => {
      e.stopPropagation();
      pushHistory();
      const copy = JSON.parse(JSON.stringify(block));
      copy.id = uid('b_');
      copy.pos = Object.assign({}, block.pos, { x: block.pos.x + 24, y: block.pos.y + 24 });
      task.blocks.push(copy);
      selectedBlockIds.clear(); selectedBlockIds.add(copy.id); ctx.persistSelection();
      renderCanvas(ctx); ctx.renderConfigPane(); ctx.adjustCanvasHeight(); renderTaskList();
    });
    tplBtn.addEventListener('click', async e => {
      e.stopPropagation();
      const defaultName = (def && tProp(def, 'label')) || block.type;
      const result = await formDialog({
        title: t('taskPane.canvas.saveTemplateDialog.title'),
        fields: [
          { key:'name',        label: t('taskPane.canvas.saveTemplateDialog.nameLabel'),        default: defaultName, placeholder: t('taskPane.canvas.saveTemplateDialog.namePlaceholder') },
          { key:'description', label: t('taskPane.canvas.saveTemplateDialog.descriptionLabel'), type:'textarea', rows:2, placeholder: t('taskPane.canvas.saveTemplateDialog.descriptionPlaceholder') }
        ],
        confirmLabel: t('common.save')
      });
      if(!result) return;
      const trimmed = String(result.name || '').trim();
      if(!trimmed){ toast(t('taskPane.canvas.templateNotSavedNoName'), 'error'); return; }
      const tpl = captureBlockAsTemplate(block, trimmed, String(result.description || '').trim());
      state.userBlockTemplates = Array.isArray(state.userBlockTemplates) ? state.userBlockTemplates : [];
      state.userBlockTemplates.unshift(tpl);
      saveUserBlockTemplates();
      toast(t('taskPane.canvas.templateSaved', { name: trimmed }));
    });
    rmBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if(!await confirmDialog({
        title: t('taskPane.canvas.deleteBlockDialog.title'),
        message: t('taskPane.canvas.deleteBlockDialog.message', { name: (def && tProp(def, 'label')) || block.type }),
        confirmLabel: t('common.delete'),
        danger: true
      })) return;
      pushHistory();
      // Fade + shrink (180 ms) before splicing.
      const i = task.blocks.findIndex(b => b.id === block.id);
      const animate = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const doRemove = () => {
        if(i >= 0) task.blocks.splice(i, 1);
        // Drop from seen-set so undo re-triggers fade-in.
        if(ctx.seenBlockIds) ctx.seenBlockIds.delete(block.id);
        selectedBlockIds.delete(block.id); ctx.persistSelection();
        renderCanvas(ctx); ctx.renderConfigPane(); ctx.adjustCanvasHeight(); renderTaskList();
      };
      if(animate){
        card.classList.add('is-removing');
        setTimeout(doRemove, 180);
      } else {
        doRemove();
      }
    });
    ctrls.appendChild(fitBtn); ctrls.appendChild(scormFitBtn); ctrls.appendChild(dupBtn); ctrls.appendChild(tplBtn); ctrls.appendChild(rmBtn);
    cardHead.appendChild(ctrls);
    card.appendChild(cardHead);

    const cardBody = el('div', {className:'canvas-block-body'});
    renderBlockPreview(cardBody, block);
    card.appendChild(cardBody);

    const resize = el('div', {className:'canvas-block-resize', attrs:{title: t('taskPane.canvas.resizeTitle')}, text:'⌟'});
    card.appendChild(resize);

    installDragHandlers(ctx, card, block);
    installResizeHandler(ctx, resize, card, block);

    canvas.appendChild(card);
  });
  if(task.blocks.length === 0){
    // Empty state: illustration + headline + picker CTA.
    const empty = el('div', { className:'canvas-block-empty' });
    const svg = '<svg class="canvas-empty-art" viewBox="0 0 120 64" width="96" height="51" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="10"  y="10" width="58" height="18" rx="3" opacity="0.55"/>' +
      '<rect x="22"  y="24" width="74" height="18" rx="3" opacity="0.75"/>' +
      '<rect x="40"  y="38" width="58" height="18" rx="3"/>' +
      '<path d="M58 46 L58 52 M54 49 L62 49" stroke-width="2.5"/>' +
    '</svg>';
    empty.innerHTML =
      svg +
      '<h3 class="canvas-empty-title">' + t('taskPane.canvas.empty.title') + '</h3>' +
      '<p class="canvas-empty-body">' + t('taskPane.canvas.empty.body') + '</p>';
    const cta = el('button', {
      className:'btn btn-primary canvas-empty-cta',
      attrs:{type:'button'},
      text: t('taskPane.canvas.empty.addBlock')
    });
    cta.addEventListener('click', () => {
      if(typeof ctx.openAddBlockPicker === 'function') ctx.openAddBlockPicker();
    });
    empty.appendChild(cta);
    empty.appendChild(el('p', {
      className:'canvas-empty-hint',
      html: t('taskPane.canvas.empty.hint')
    }));
    canvas.appendChild(empty);
  }
}

export function installDragHandlers(ctx, card, block){
  const { task, canvas, configHost, selectedBlockIds } = ctx;
  // mousedown for mouse + test events; pointerdown (non-mouse) for touch/pen.
  // setPointerCapture keeps events flowing on fast drags.
  function startDrag(e, isPointer){
    if(e.target.closest('.canvas-block-resize') || e.target.closest('.canvas-block-controls')) return;
    if(!isPointer && e.button !== 0) return;
    e.preventDefault();

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
    ctx.persistSelection();
    ctx.updateSelectionVisuals();
    ctx.renderConfigPane();

    const movingIds = Array.from(selectedBlockIds);
    const movingBlocks = movingIds.map(id => task.blocks.find(b => b.id === id)).filter(Boolean);
    if(movingBlocks.length === 0) return;
    const startPos = {};
    movingBlocks.forEach(b => { startPos[b.id] = {x: b.pos.x, y: b.pos.y}; });
    const startX = e.clientX, startY = e.clientY;
    let dragged = false;
    const pointerId = isPointer ? e.pointerId : null;
    if(isPointer){ try { card.setPointerCapture(pointerId); } catch(_){} }
    takeHistorySnap();

    function onMove(ev){
      if(isPointer && ev.pointerId !== pointerId) return;
      const sdx = ev.clientX - startX, sdy = ev.clientY - startY;
      if(!dragged && (Math.abs(sdx) > 3 || Math.abs(sdy) > 3)){
        dragged = true;
        movingBlocks.forEach(b => {
          const c = canvas.querySelector('[data-block-id="' + cssEscape(b.id) + '"]');
          if(c) c.classList.add('dragging');
        });
      }
      if(!dragged) return;
      const z = ctx.zoom;
      const dx = sdx / z, dy = sdy / z;
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
    function onUp(ev){
      if(isPointer && ev.pointerId !== pointerId) return;
      if(isPointer){
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerup', onUp);
        card.removeEventListener('pointercancel', onUp);
        try { card.releasePointerCapture(pointerId); } catch(_){}
      } else {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      hideSnapGuides(canvas);
      movingBlocks.forEach(b => {
        const c = canvas.querySelector('[data-block-id="' + cssEscape(b.id) + '"]');
        if(c) c.classList.remove('dragging');
      });
      if(dragged) commitHistorySnap();
      else discardHistorySnap();
      if(!dragged && !shift && wasSelected && selectedBlockIds.size > 1){
        selectedBlockIds.clear();
        selectedBlockIds.add(block.id);
        ctx.persistSelection();
        ctx.updateSelectionVisuals();
        ctx.renderConfigPane();
      }
      ctx.adjustCanvasHeight();
    }
    if(isPointer){
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerup', onUp);
      card.addEventListener('pointercancel', onUp);
    } else {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
  }

  card.addEventListener('mousedown', e => startDrag(e, false));
  card.addEventListener('pointerdown', e => {
    if(e.pointerType === 'mouse') return;
    startDrag(e, true);
  });
}

export function installResizeHandler(ctx, handle, card, block){
  const { task, canvas, configHost, selectedBlockIds } = ctx;
  function startResize(e, isPointer){
    if(!isPointer && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    selectedBlockIds.clear(); selectedBlockIds.add(block.id); ctx.persistSelection();
    ctx.updateSelectionVisuals();
    ctx.renderConfigPane();
    const startX = e.clientX, startY = e.clientY;
    const startW = block.pos.w, startH = block.pos.h;
    const pointerId = isPointer ? e.pointerId : null;
    if(isPointer){ try { handle.setPointerCapture(pointerId); } catch(_){} }
    takeHistorySnap();
    let didResize = false;
    function onMove(ev){
      if(isPointer && ev.pointerId !== pointerId) return;
      const z = ctx.zoom;
      const dx = (ev.clientX - startX) / z;
      const dy = (ev.clientY - startY) / z;
      if(Math.abs(dx) > 1 || Math.abs(dy) > 1) didResize = true;
      const others = task.blocks.filter(b => b.id !== block.id);
      const snapped = applyResizeSnap(block, startW + dx, startH + dy, others);
      block.pos.w = snapped.w; block.pos.h = snapped.h;
      card.style.width = snapped.w + 'px';
      card.style.height = snapped.h + 'px';
      showSnapGuides(canvas, snapped.guides);
      const meta = configHost.querySelector('.block-config-meta');
      if(meta) meta.textContent = posLabel(block);
    }
    function onUp(ev){
      if(isPointer && ev.pointerId !== pointerId) return;
      if(isPointer){
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
        try { handle.releasePointerCapture(pointerId); } catch(_){}
      } else {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      hideSnapGuides(canvas);
      ctx.adjustCanvasHeight();
      if(didResize) commitHistorySnap(); else discardHistorySnap();
    }
    if(isPointer){
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    } else {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
  }
  handle.addEventListener('mousedown', e => startResize(e, false));
  handle.addEventListener('pointerdown', e => {
    if(e.pointerType === 'mouse') return;
    startResize(e, true);
  });
}

// Autofit pass for fresh template blocks: measure, set pos.h, re-pack column.
function scheduleTemplateAutofitPass(ctx){
  const { task, canvas } = ctx;
  const flagged = (task.blocks || []).filter(b => b && b._needsAutofit);
  if(flagged.length === 0) return;
  // 2 rAFs: 1 for card render, 1 for shadow-DOM mount.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    let changed = false;
    flagged.forEach(block => {
      delete block._needsAutofit;
      if(!block.pos) return;
      const card = canvas.querySelector('.canvas-block-card[data-block-id="' + cssEscape(block.id) + '"]');
      const newH = fitHeightForCard(card);
      if(newH != null && Math.abs(newH - block.pos.h) > 10){
        block.pos.h = newH;
        changed = true;
      }
    });
    if(changed){
      repackBlocksVertically(task.blocks);
      renderCanvas(ctx);
      ctx.adjustCanvasHeight();
    }
  }));
}

// Re-stack blocks at x=20, preserving Y order.
function repackBlocksVertically(blocks){
  const sorted = (blocks || []).filter(b => b && b.pos).slice().sort((a, b) => a.pos.y - b.pos.y);
  let y = 20;
  sorted.forEach(b => {
    b.pos.x = 20;
    b.pos.y = y;
    y += b.pos.h + 16;
  });
}
