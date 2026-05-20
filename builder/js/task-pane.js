// ============================================================================
// task-pane.js: Orchestrator for the free-canvas task editor. Builds the
// shared `ctx` object and wires up the head/toolbar/zoom/tab-bar. The heavy
// lifting lives in sibling modules:
//   • task-pane-canvas.js: canvas render + drag/resize handlers
//   • task-pane-config.js: right-side block config pane + multi-select UI
//   • task-pane-bulk.js: bulk align/distribute/duplicate/delete
// ============================================================================
import { el, uid, cssEscape, confirmDialog } from './util.js';
import { state, pushHistory, renderActivePane } from './state.js';
import { CANVAS_WIDTH, ensurePos, ensureAllPos, fitHeightForCard } from './canvas.js';
import { hasTabs, syncTaskBlocksAlias, enableTabsOn, disableTabsOn } from './tasks.js';
import { renderTaskList } from './panes.js';
import { openBlockTypeModal, openSaveTemplateModal } from './modals.js';
import { renderBlockPreview } from './preview.js';
import { renderCanvas } from './task-pane-canvas.js';
import { renderConfigPane, posLabel } from './task-pane-config.js';
import { bulkDelete, bulkDuplicate } from './task-pane-bulk.js';

// Currently-active task pane context: used by global keyboard handler.
export let activeTaskCtx = null;

export function renderTaskPane(host, idx){
  const task = state.course.tasks[idx];
  if(!task){ state.selected = {kind:'course'}; renderActivePane(); return; }
  // Keep task.blocks aliased to active tab's blocks if tabs mode is on
  syncTaskBlocksAlias(task);
  task.blocks = task.blocks || [];
  ensureAllPos(task.blocks);

  // Multi-select state (Set of block IDs).
  const selectedBlockIds = new Set(Array.isArray(task._uiSelectedBlockIds) ? task._uiSelectedBlockIds : []);
  function persistSelection(){ task._uiSelectedBlockIds = Array.from(selectedBlockIds); }

  // Zoom state (per-task)
  let zoom = (typeof task._uiZoom === 'number' && task._uiZoom > 0) ? task._uiZoom : 1.0;

  // ===== Header: task number + editable title + toolbar =====
  const head = el('div', {className:'task-edit-head'});
  head.appendChild(el('span', {className:'task-num', text: 'Aufgabe ' + (idx+1)}));
  const titleInput = el('input', {className:'task-title-input', attrs:{type:'text', placeholder:'Titel der Aufgabe (in der Navigation sichtbar)'}});
  titleInput.value = task.title || '';
  titleInput.addEventListener('input', () => { task.title = titleInput.value; renderTaskList(); });
  head.appendChild(titleInput);

  const toolbar = el('div', {className:'canvas-toolbar'});
  const addBtn = el('button', {className:'btn btn-primary', attrs:{type:'button'}, text:'+ Block'});
  addBtn.title = 'Block hinzufügen';
  addBtn.addEventListener('click', () => openBlockTypeModal(addBlockOfType));
  const saveTplBtn = el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:'★ Vorlage'});
  saveTplBtn.title = 'Aufgabe als Vorlage speichern';
  saveTplBtn.addEventListener('click', () => openSaveTemplateModal(task));

  // Tabs toggle (Visualisierung + Aufgabe)
  const tabsBtn = el('button', {className:'btn btn-secondary', attrs:{type:'button'}});
  function refreshTabsBtn(){
    tabsBtn.textContent = hasTabs(task) ? 'Tabs deaktivieren' : '+ Tabs aktivieren';
    tabsBtn.title = hasTabs(task) ? 'Tabs entfernen (nur Tab 1 wird behalten)' : '2 Tabs aktivieren: Visualisierung + Aufgabe';
  }
  refreshTabsBtn();
  tabsBtn.addEventListener('click', async () => {
    if(hasTabs(task)){
      const tab2Count = (task.tabs[1] && task.tabs[1].blocks ? task.tabs[1].blocks.length : 0);
      if(tab2Count > 0){
        const ok = await confirmDialog({
          title: 'Tabs deaktivieren?',
          message: 'Tab 2 enthält ' + tab2Count + ' Block' + (tab2Count === 1 ? '' : 'e') + '. Beim Deaktivieren gehen diese verloren.',
          confirmLabel: 'Deaktivieren',
          danger: true
        });
        if(!ok) return;
      }
      disableTabsOn(task);
    } else {
      enableTabsOn(task);
    }
    pushHistory();
    renderActivePane();
  });
  toolbar.appendChild(addBtn); toolbar.appendChild(saveTplBtn); toolbar.appendChild(tabsBtn);

  // Zoom controls
  const zoomBar = el('div', {className:'canvas-zoom-bar'});
  const zoomOut = el('button', {className:'icon-btn', attrs:{type:'button', title:'Verkleinern (Strg + Mausrad)'}, text:'−'});
  const zoomVal = el('span', {className:'zoom-value', text: Math.round(zoom*100) + '%'});
  const zoomIn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Vergrößern (Strg + Mausrad)'}, text:'+'});
  const zoomReset = el('button', {className:'icon-btn', attrs:{type:'button', title:'Zoom 100%'}, text:'⤢'});
  zoomBar.appendChild(zoomOut); zoomBar.appendChild(zoomVal); zoomBar.appendChild(zoomIn); zoomBar.appendChild(zoomReset);
  toolbar.appendChild(zoomBar);
  head.appendChild(toolbar);
  host.appendChild(head);

  // ===== Optional tab nav bar =====
  if(hasTabs(task)){
    const tabBar = el('div', {className:'builder-tab-bar'});
    task.tabs.forEach((tab, ti) => {
      const isActive = ti === (task._uiActiveTab || 0);
      const btn = el('button', { className: 'builder-tab-btn' + (isActive ? ' active' : ''), attrs:{type:'button', title:'Tab wechseln'} });
      const titleSpan = el('input', {className:'builder-tab-title', attrs:{type:'text'}});
      titleSpan.value = tab.title || ('Tab ' + (ti+1));
      titleSpan.addEventListener('click', e => e.stopPropagation());
      titleSpan.addEventListener('input', () => { tab.title = titleSpan.value; });
      btn.appendChild(titleSpan);
      btn.appendChild(el('span', {className:'builder-tab-count', text: '(' + ((tab.blocks||[]).length) + ')'}));
      btn.addEventListener('click', () => {
        if(ti === (task._uiActiveTab || 0)) return;
        task._uiActiveTab = ti;
        syncTaskBlocksAlias(task);
        renderActivePane();
      });
      tabBar.appendChild(btn);
    });
    host.appendChild(tabBar);
  }

  // ===== Body: canvas (left) + config-pane (right) =====
  const body = el('div', {className:'task-edit-body'});
  const canvasWrap = el('div', {className:'builder-canvas-wrap'});
  const zoomContainer = el('div', {className:'canvas-zoom-container'});
  const canvas = el('div', {className:'builder-canvas'});
  canvas.style.width = CANVAS_WIDTH + 'px';
  zoomContainer.appendChild(canvas);
  canvasWrap.appendChild(zoomContainer);
  body.appendChild(canvasWrap);
  const configHost = el('div', {className:'block-config-pane'});
  body.appendChild(configHost);
  host.appendChild(body);

  // ===== Local helpers shared via ctx =====
  function applyZoom(){
    canvas.style.transform = 'scale(' + zoom + ')';
    zoomContainer.style.width  = (CANVAS_WIDTH * zoom) + 'px';
    const cssH = parseFloat(canvas.style.height || '320');
    zoomContainer.style.height = (cssH * zoom) + 'px';
    zoomVal.textContent = Math.round(zoom * 100) + '%';
    task._uiZoom = zoom;
  }
  function setZoom(z){ zoom = Math.max(0.4, Math.min(2.0, z)); applyZoom(); }
  zoomIn.addEventListener('click', () => setZoom(zoom + 0.1));
  zoomOut.addEventListener('click', () => setZoom(zoom - 0.1));
  zoomReset.addEventListener('click', () => setZoom(1.0));
  canvasWrap.addEventListener('wheel', (e) => {
    if(!e.ctrlKey) return;
    e.preventDefault();
    setZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1));
  }, {passive: false});

  function adjustCanvasHeight(){
    // Empty canvas: stretch a bit so the empty-state card (illustration +
    // headline + CTA + hint) has vertical breathing room and doesn't poke
    // out at the top/bottom of the dashed grid. Filled canvas: snap to the
    // bottom of the lowest block plus 80 px padding.
    let maxBottom = task.blocks.length === 0 ? 420 : 320;
    task.blocks.forEach(b => { if(b.pos.y + b.pos.h + 80 > maxBottom) maxBottom = b.pos.y + b.pos.h + 80; });
    canvas.style.height = maxBottom + 'px';
    applyZoom();
  }

  function updateSelectionVisuals(){
    canvas.querySelectorAll('.canvas-block-card').forEach(c => {
      c.classList.toggle('selected', selectedBlockIds.has(c.dataset.blockId));
    });
  }

  function refreshTabCounts(){
    if(!hasTabs(task)) return;
    document.querySelectorAll('.builder-tab-btn').forEach((btn, i) => {
      const cnt = btn.querySelector('.builder-tab-count');
      if(cnt && task.tabs[i]) cnt.textContent = '(' + ((task.tabs[i].blocks || []).length) + ')';
    });
  }

  // Debounced re-render of a single block's preview. Heavy mount() calls
  // (e.g. plot blocks) shouldn't run on every keystroke in the config form.
  // After the preview re-renders, the block's height is auto-fit so config
  // edits don't leave empty space or clip content.
  const _refreshTimers = new Map();
  function scheduleBlockPreviewRefresh(block){
    const id = block.id;
    if(_refreshTimers.has(id)) clearTimeout(_refreshTimers.get(id));
    _refreshTimers.set(id, setTimeout(() => {
      _refreshTimers.delete(id);
      const card = canvas.querySelector('[data-block-id="' + cssEscape(block.id) + '"]');
      if(!card) return;
      const body = card.querySelector('.canvas-block-body');
      if(body) renderBlockPreview(body, block);
      // Wait one frame for the (possibly shadow-DOM) mount, then fit the card.
      requestAnimationFrame(() => {
        const newH = fitHeightForCard(card);
        if(newH != null && Math.abs(newH - block.pos.h) > 15){
          block.pos.h = newH;
          card.style.height = newH + 'px';
          adjustCanvasHeight();
        }
      });
    }, 250));
  }

  // Track which block IDs have already been rendered at least once. New
  // blocks (ids that aren't in the set yet) get a `.is-new` class on first
  // mount so the CSS fade-in animation triggers - existing blocks don't
  // re-animate on every re-render.
  const seenBlockIds = new Set(task.blocks.map(b => b.id));

  // ===== Shared ctx passed to sibling modules =====
  const ctx = {
    task, canvas, configHost,
    selectedBlockIds,
    seenBlockIds,
    get zoom(){ return zoom; },
    selectedBlocks(){ return task.blocks.filter(b => selectedBlockIds.has(b.id)); },
    persistSelection,
    adjustCanvasHeight,
    updateSelectionVisuals,
    refreshTabCounts,
    scheduleBlockPreviewRefresh,
    // Empty-state CTA needs a way to open the block picker. We expose the
    // wired handler so the renderer doesn't have to re-import the modal.
    openAddBlockPicker: () => openBlockTypeModal(addBlockOfType),
    renderCanvas: () => renderCanvas(ctx),
    renderConfigPane: () => renderConfigPane(ctx),
  };

  // Called from the picker. Accepts either:
  //   • a block-type id (string)         - built-in block, use defaultConfig()
  //   • a user-saved block-template obj  - deep-clone the saved config
  function addBlockOfType(blockTypeOrTemplate){
    pushHistory();
    let block;
    if(blockTypeOrTemplate && typeof blockTypeOrTemplate === 'object' && blockTypeOrTemplate.blockType){
      const tpl = blockTypeOrTemplate;
      block = {
        id: uid('b_'),
        type: tpl.blockType,
        config: JSON.parse(JSON.stringify(tpl.config || {}))
      };
    } else {
      const blockType = blockTypeOrTemplate;
      const def = window.Blocks.get(blockType);
      block = { id: uid('b_'), type: blockType, config: def && def.defaultConfig ? def.defaultConfig() : {} };
    }
    ensurePos(block, task.blocks);
    task.blocks.push(block);
    selectedBlockIds.clear(); selectedBlockIds.add(block.id); persistSelection();
    ctx.renderCanvas(); ctx.renderConfigPane(); adjustCanvasHeight(); renderTaskList(); refreshTabCounts();
    // After mount, snap the new card's height to its actual rendered content.
    requestAnimationFrame(() => {
      const card = canvas.querySelector('[data-block-id="' + cssEscape(block.id) + '"]');
      const newH = fitHeightForCard(card);
      if(newH != null && Math.abs(newH - block.pos.h) > 10){
        block.pos.h = newH;
        card.style.height = newH + 'px';
        adjustCanvasHeight();
      }
    });
  }

  canvas.addEventListener('mousedown', e => {
    if(e.target === canvas){
      selectedBlockIds.clear(); persistSelection();
      updateSelectionVisuals();
      ctx.renderConfigPane();
    }
  });

  // When an interactive in-canvas editor (e.g. Komposition's drag-to-move)
  // mutates a block's config, refresh the right-side config pane so any
  // numerical fields stay in sync with what the user just drew.
  canvas.addEventListener('block-config-changed', () => {
    ctx.renderConfigPane();
    adjustCanvasHeight();
  });

  // ===== Helpers exposed to global keyboard handler via activeTaskCtx =====
  function nudgeSelected(dx, dy){
    const sel = ctx.selectedBlocks(); if(sel.length === 0) return;
    sel.forEach(b => {
      b.pos.x = Math.max(0, Math.min(b.pos.x + dx, CANVAS_WIDTH - b.pos.w));
      b.pos.y = Math.max(0, b.pos.y + dy);
      const c = canvas.querySelector('[data-block-id="' + cssEscape(b.id) + '"]');
      if(c){ c.style.left = b.pos.x + 'px'; c.style.top = b.pos.y + 'px'; }
    });
    const meta = configHost.querySelector('.block-config-meta');
    if(meta && sel.length === 1) meta.textContent = posLabel(sel[0]);
    adjustCanvasHeight();
  }
  function selectAll(){
    task.blocks.forEach(b => selectedBlockIds.add(b.id));
    persistSelection();
    updateSelectionVisuals();
    ctx.renderConfigPane();
  }
  function deselectAll(){
    selectedBlockIds.clear(); persistSelection();
    updateSelectionVisuals();
    ctx.renderConfigPane();
  }

  activeTaskCtx = {
    task,
    get selectedIds(){ return Array.from(selectedBlockIds); },
    nudgeSelected,
    bulkDelete: () => bulkDelete(ctx),
    bulkDuplicate: () => bulkDuplicate(ctx),
    selectAll,
    deselectAll
  };

  ctx.renderCanvas();
  adjustCanvasHeight();
  ctx.renderConfigPane();
}

// Clear the activeTaskCtx (called from panes when leaving a task)
export function clearActiveTaskCtx(){ activeTaskCtx = null; }
export function getActiveTaskCtx(){ return activeTaskCtx; }
