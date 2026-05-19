// ============================================================================
// task-pane-bulk.js: Bulk operations on multi-selected canvas blocks:
// alignment, even distribution, duplicate, delete.
// All functions take a ctx object built by task-pane.js.
// ============================================================================
import { uid } from './util.js';
import { renderTaskList } from './panes.js';

export function bulkAlign(ctx, edge){
  const sel = ctx.selectedBlocks(); if(sel.length < 2) return;
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
  ctx.renderCanvas(); ctx.adjustCanvasHeight();
}

export function bulkDistribute(ctx, axis){
  const sel = ctx.selectedBlocks(); if(sel.length < 3) return;
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
  ctx.renderCanvas(); ctx.adjustCanvasHeight();
}

export function bulkDuplicate(ctx){
  const sel = ctx.selectedBlocks(); if(sel.length === 0) return;
  const newIds = [];
  sel.forEach(b => {
    const copy = JSON.parse(JSON.stringify(b));
    copy.id = uid('b_');
    copy.pos = Object.assign({}, b.pos, {x: b.pos.x + 24, y: b.pos.y + 24});
    ctx.task.blocks.push(copy);
    newIds.push(copy.id);
  });
  ctx.selectedBlockIds.clear();
  newIds.forEach(id => ctx.selectedBlockIds.add(id));
  ctx.persistSelection();
  ctx.renderCanvas(); ctx.renderConfigPane(); ctx.adjustCanvasHeight(); renderTaskList();
}

export function bulkDelete(ctx){
  const sel = ctx.selectedBlocks(); if(sel.length === 0) return;
  if(!confirm(sel.length === 1 ? 'Block löschen?' : sel.length + ' Blöcke löschen?')) return;
  const ids = sel.map(b => b.id);
  // In-place removal keeps task.blocks and task.tabs[i].blocks pointing at the same array
  for(let bi = ctx.task.blocks.length - 1; bi >= 0; bi--){
    if(ids.includes(ctx.task.blocks[bi].id)) ctx.task.blocks.splice(bi, 1);
  }
  ctx.selectedBlockIds.clear();
  ctx.persistSelection();
  ctx.renderCanvas(); ctx.renderConfigPane(); ctx.adjustCanvasHeight(); renderTaskList(); ctx.refreshTabCounts();
}
