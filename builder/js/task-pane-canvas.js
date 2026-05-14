// ============================================================================
// task-pane-canvas.js - Canvas rendering for the task editor and the
// direct-manipulation handlers (drag-to-move, drag-to-resize) with snap
// guides and history snapshots.
// ============================================================================
import { el, uid, cssEscape } from './util.js';
import { pushHistory, takeHistorySnap, commitHistorySnap, discardHistorySnap } from './state.js';
import {
  CANVAS_WIDTH, ensurePos,
  applySnap, applyResizeSnap, showSnapGuides, hideSnapGuides,
  autoFitBlock
} from './canvas.js';
import { renderBlockPreview } from './preview.js';
import { renderTaskList } from './panes.js';
import { posLabel } from './task-pane-config.js';

export function renderCanvas(ctx){
  const { task, canvas, selectedBlockIds } = ctx;
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
    const cardHead = el('div', {className:'canvas-block-head'});
    cardHead.appendChild(el('span', {
      className:'canvas-block-type',
      text: ((def && def.label) || block.type) + (def && def.graded ? ' · gewertet' : '')
    }));
    const ctrls = el('div', {className:'canvas-block-controls'});
    const fitBtn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Höhe an Inhalt anpassen'}, text:'↕'});
    const dupBtn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Duplizieren'}, text:'⧉'});
    const rmBtn  = el('button', {className:'icon-btn danger', attrs:{type:'button', title:'Entfernen'}, text:'✕'});
    fitBtn.addEventListener('click', e => { e.stopPropagation(); autoFitBlock(block); });
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
    rmBtn.addEventListener('click', e => {
      e.stopPropagation();
      if(!confirm('Block "' + ((def && def.label) || block.type) + '" entfernen?')) return;
      pushHistory();
      const i = task.blocks.findIndex(b => b.id === block.id);
      if(i >= 0) task.blocks.splice(i, 1);
      selectedBlockIds.delete(block.id); ctx.persistSelection();
      renderCanvas(ctx); ctx.renderConfigPane(); ctx.adjustCanvasHeight(); renderTaskList();
    });
    ctrls.appendChild(fitBtn); ctrls.appendChild(dupBtn); ctrls.appendChild(rmBtn);
    cardHead.appendChild(ctrls);
    card.appendChild(cardHead);

    const cardBody = el('div', {className:'canvas-block-body'});
    renderBlockPreview(cardBody, block);
    card.appendChild(cardBody);

    const resize = el('div', {className:'canvas-block-resize', attrs:{title:'Größe ändern'}, text:'⌟'});
    card.appendChild(resize);

    installDragHandlers(ctx, card, block);
    installResizeHandler(ctx, resize, card, block);

    canvas.appendChild(card);
  });
  if(task.blocks.length === 0){
    canvas.appendChild(el('div', {
      className:'canvas-block-empty',
      html:'<strong>Leere Canvas.</strong><br>Klicke <strong>+ Block</strong> oben rechts, um Inhalte hinzuzufügen.'
    }));
  }
}

export function installDragHandlers(ctx, card, block){
  const { task, canvas, configHost, selectedBlockIds } = ctx;
  card.addEventListener('mousedown', e => {
    if(e.target.closest('.canvas-block-resize') || e.target.closest('.canvas-block-controls')) return;
    if(e.button !== 0) return;
    e.preventDefault();

    // Selection logic on MOUSEDOWN
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
    takeHistorySnap();

    function onMove(ev){
      const sdx = ev.clientX - startX, sdy = ev.clientY - startY;
      if(!dragged && (Math.abs(sdx) > 3 || Math.abs(sdy) > 3)) dragged = true;
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
    function onUp(){
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      hideSnapGuides(canvas);
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
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

export function installResizeHandler(ctx, handle, card, block){
  const { task, canvas, configHost, selectedBlockIds } = ctx;
  handle.addEventListener('mousedown', e => {
    e.stopPropagation();
    e.preventDefault();
    selectedBlockIds.clear(); selectedBlockIds.add(block.id); ctx.persistSelection();
    ctx.updateSelectionVisuals();
    ctx.renderConfigPane();
    const startX = e.clientX, startY = e.clientY;
    const startW = block.pos.w, startH = block.pos.h;
    takeHistorySnap();
    let didResize = false;
    function onMove(ev){
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
    function onUp(){
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      hideSnapGuides(canvas);
      ctx.adjustCanvasHeight();
      if(didResize) commitHistorySnap(); else discardHistorySnap();
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}
