// task-pane.js: Canvas task editor orchestrator. Builds the shared ctx and
// wires up head/toolbar/zoom/tab-bar; canvas/config/bulk live in sibling modules.
import { el, uid, cssEscape, confirmDialog, toast } from './util.js';
import { t, readForEdit, writeFromEdit, getDefaultLocale } from './i18n.js';
import { state, pushHistory, renderActivePane, getEditorLocale } from './state.js';
import { CANVAS_WIDTH, ensurePos, ensureAllPos, fitHeightForCard } from './canvas.js';
import { hasTabs, syncTaskBlocksAlias, enableTabsOn, disableTabsOn, bumpBlockUsage } from './tasks.js';
import { renderTaskList } from './panes.js';
import { openBlockTypeModal, openSaveTemplateModal } from './modals.js';
import { renderBlockPreview } from './preview.js';
import { renderCanvas } from './task-pane-canvas.js';
import { renderConfigPane, posLabel } from './task-pane-config.js';
import { bulkDelete, bulkDuplicate } from './task-pane-bulk.js';
import { validateUpload } from './form.js';

// Exposed for the global keyboard handler.
export let activeTaskCtx = null;

export function renderTaskPane(host, idx){
  const task = state.course.tasks[idx];
  if(!task){ state.selected = {kind:'course'}; renderActivePane(); return; }
  // With tabs enabled, task.blocks aliases the active tab's blocks.
  syncTaskBlocksAlias(task);
  task.blocks = task.blocks || [];
  ensureAllPos(task.blocks);

  const selectedBlockIds = new Set(Array.isArray(task._uiSelectedBlockIds) ? task._uiSelectedBlockIds : []);
  function persistSelection(){ task._uiSelectedBlockIds = Array.from(selectedBlockIds); }

  let zoom = (typeof task._uiZoom === 'number' && task._uiZoom > 0) ? task._uiZoom : 1.0;

  // Header: task number + editable title + toolbar. Reading and writing the
  // title go through readForEdit/writeFromEdit so the value stays wrapped
  // once the author has entered more than one locale (otherwise plain-string
  // assignment would silently drop the other-locale text).
  const head = el('div', {className:'task-edit-head'});
  head.appendChild(el('span', {className:'task-num', text: t('taskPane.taskLabel', { n: idx+1 })}));
  const titleInput = el('input', {className:'task-title-input', attrs:{type:'text', placeholder: t('taskPane.titlePlaceholder')}});
  const titleEditorLoc = getEditorLocale();
  const titleSourceLoc = getDefaultLocale();
  titleInput.value = readForEdit(task.title, titleEditorLoc, titleSourceLoc);
  titleInput.addEventListener('input', () => {
    task.title = writeFromEdit(task.title, titleEditorLoc, titleInput.value, titleSourceLoc);
    renderTaskList();
  });
  head.appendChild(titleInput);

  const toolbar = el('div', {className:'canvas-toolbar'});
  const addBtn = el('button', {className:'btn btn-primary', attrs:{type:'button'}, text: t('taskPane.addBlock')});
  addBtn.title = t('taskPane.addBlockTitle');
  addBtn.addEventListener('click', () => openBlockTypeModal(addBlockOfType));
  const saveTplBtn = el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text: t('taskPane.saveTemplate')});
  saveTplBtn.title = t('taskPane.saveTemplateTitle');
  saveTplBtn.addEventListener('click', () => openSaveTemplateModal(task));

  // Tabs toggle
  const tabsBtn = el('button', {className:'btn btn-secondary', attrs:{type:'button'}});
  function refreshTabsBtn(){
    tabsBtn.textContent = hasTabs(task) ? t('taskPane.tabsDisable') : t('taskPane.tabsEnable');
    tabsBtn.title = hasTabs(task) ? t('taskPane.tabsDisableTitle') : t('taskPane.tabsEnableTitle');
  }
  refreshTabsBtn();
  tabsBtn.addEventListener('click', async () => {
    if(hasTabs(task)){
      const tab2Count = (task.tabs[1] && task.tabs[1].blocks ? task.tabs[1].blocks.length : 0);
      if(tab2Count > 0){
        const ok = await confirmDialog({
          title: t('taskPane.tabsDisableConfirmTitle'),
          message: tab2Count === 1
            ? t('taskPane.tabsDisableConfirmMessageSingular', { n: tab2Count })
            : t('taskPane.tabsDisableConfirmMessagePlural', { n: tab2Count }),
          confirmLabel: t('taskPane.tabsDisableConfirmLabel'),
          danger: true
        });
        if(!ok) return;
      }
      // Snapshot before the structural change so a single Ctrl+Z reverts it.
      pushHistory();
      disableTabsOn(task);
    } else {
      pushHistory();
      enableTabsOn(task);
    }
    renderActivePane();
  });
  toolbar.appendChild(addBtn); toolbar.appendChild(saveTplBtn); toolbar.appendChild(tabsBtn);

  const zoomBar = el('div', {className:'canvas-zoom-bar'});
  const zoomOut = el('button', {className:'icon-btn', attrs:{type:'button', title: t('taskPane.zoomOutTitle')}, text:'−'});
  const zoomVal = el('span', {className:'zoom-value', text: Math.round(zoom*100) + '%'});
  const zoomIn = el('button', {className:'icon-btn', attrs:{type:'button', title: t('taskPane.zoomInTitle')}, text:'+'});
  const zoomReset = el('button', {className:'icon-btn', attrs:{type:'button', title: t('taskPane.zoomResetTitle')}, text:'⤢'});
  zoomBar.appendChild(zoomOut); zoomBar.appendChild(zoomVal); zoomBar.appendChild(zoomIn); zoomBar.appendChild(zoomReset);
  toolbar.appendChild(zoomBar);
  head.appendChild(toolbar);
  host.appendChild(head);

  // Optional tab nav bar
  if(hasTabs(task)){
    const tabBar = el('div', {className:'builder-tab-bar'});
    task.tabs.forEach((tab, ti) => {
      const isActive = ti === (task._uiActiveTab || 0);
      const btn = el('button', { className: 'builder-tab-btn' + (isActive ? ' active' : ''), attrs:{type:'button', title: t('taskPane.tabSwitchTitle')} });
      const titleSpan = el('input', {className:'builder-tab-title', attrs:{type:'text'}});
      titleSpan.value = tab.title || t('taskPane.tabFallbackTitle', { n: ti+1 });
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

  // Body: canvas + config-pane
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

  // Pinch-zoom (two-finger). Single-finger touches fall through to native scroll.
  let _pinchStart = null;
  function touchDist(t1, t2){
    const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  }
  canvasWrap.addEventListener('touchstart', e => {
    if(e.touches.length !== 2) return;
    _pinchStart = { dist: touchDist(e.touches[0], e.touches[1]), zoom };
  }, { passive: true });
  canvasWrap.addEventListener('touchmove', e => {
    if(!_pinchStart || e.touches.length !== 2) return;
    e.preventDefault(); // suppress browser page pinch-zoom
    const d = touchDist(e.touches[0], e.touches[1]);
    setZoom(_pinchStart.zoom * (d / _pinchStart.dist));
  }, { passive: false });
  function endPinch(){ _pinchStart = null; }
  canvasWrap.addEventListener('touchend', endPinch);
  canvasWrap.addEventListener('touchcancel', endPinch);

  function adjustCanvasHeight(){
    // Empty: extra room for empty-state card. Filled: lowest block + 80 px.
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

  // Debounced re-render + auto-fit for a single block.
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
      // Wait one frame for the shadow-DOM mount, then fit.
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

  // New blocks get `.is-new` for CSS fade-in; tracked here so they only animate once.
  const seenBlockIds = new Set(task.blocks.map(b => b.id));

  // Shared ctx for sibling modules
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
    openAddBlockPicker: () => openBlockTypeModal(addBlockOfType),
    renderCanvas: () => renderCanvas(ctx),
    renderConfigPane: () => renderConfigPane(ctx),
  };

  // Picker callback: accepts a block-type id (string) or a saved template object.
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
      // Pass the author's current editor locale so example content (question,
      // choices, prompt, etc.) is minted in the language they are writing.
      const seedLocale = getEditorLocale();
      block = { id: uid('b_'), type: blockType, config: def && def.defaultConfig ? def.defaultConfig(seedLocale) : {} };
    }
    ensurePos(block, task.blocks);
    task.blocks.push(block);
    bumpBlockUsage(block.type);
    selectedBlockIds.clear(); selectedBlockIds.add(block.id); persistSelection();
    ctx.renderCanvas(); ctx.renderConfigPane(); adjustCanvasHeight(); renderTaskList(); refreshTabCounts();
    // Snap card height to rendered content.
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

  // Drag-and-drop image files: one Image block per file.
  let dragDepth = 0; // counters dragenter/leave firing on children
  function hasFiles(e){
    if(!e.dataTransfer) return false;
    const types = e.dataTransfer.types;
    return types && Array.from(types).indexOf('Files') >= 0;
  }
  canvas.addEventListener('dragenter', e => {
    if(!hasFiles(e)) return;
    e.preventDefault();
    dragDepth++;
    canvas.classList.add('drop-target');
  });
  canvas.addEventListener('dragover', e => {
    if(!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  canvas.addEventListener('dragleave', e => {
    if(!hasFiles(e)) return;
    dragDepth--;
    if(dragDepth <= 0){
      dragDepth = 0;
      canvas.classList.remove('drop-target');
    }
  });
  canvas.addEventListener('drop', e => {
    if(!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    canvas.classList.remove('drop-target');
    const files = Array.from(e.dataTransfer.files || []);
    const images = files.filter(f => (f.type || '').startsWith('image/'));
    const rejected = files.length - images.length;
    if(rejected > 0){
      toast(rejected === 1
        ? t('taskPane.dropRejectedSingular')
        : t('taskPane.dropRejectedPlural', { n: rejected }), 'error');
    }
    if(images.length === 0) return;
    // Canvas-logical pixels: divide by zoom (canvas uses transform: scale).
    const rect = canvas.getBoundingClientRect();
    const dropX = Math.max(0, Math.round((e.clientX - rect.left) / zoom));
    const dropY = Math.max(0, Math.round((e.clientY - rect.top)  / zoom));
    pushHistory();
    const newIds = [];
    images.forEach((file, i) => {
      const v = validateUpload(file, 'image');
      if(!v.ok){ toast(t('taskPane.fileValidationError', { name: file.name, error: v.error }), 'error'); return; }
      const def = window.Blocks.get('image');
      const cfg = def && def.defaultConfig ? def.defaultConfig() : {};
      const id = uid('b_');
      const block = {
        id, type: 'image', config: cfg,
        // Drop point = top-left; diagonal stagger avoids overlap on multi-drop.
        pos: { x: dropX + i * 24, y: dropY + i * 24, w: 480, h: 320 }
      };
      task.blocks.push(block);
      bumpBlockUsage('image');
      newIds.push(id);
      const r = new FileReader();
      r.onload = () => {
        block.config.src = r.result;
        const card = canvas.querySelector('[data-block-id="' + cssEscape(id) + '"]');
        if(card){
          const body = card.querySelector('.canvas-block-body');
          if(body) renderBlockPreview(body, block);
        }
      };
      r.onerror = () => toast(t('taskPane.fileReadError', { name: file.name }), 'error');
      r.readAsDataURL(file);
    });
    if(newIds.length === 0) return;
    selectedBlockIds.clear();
    newIds.forEach(id => selectedBlockIds.add(id));
    persistSelection();
    ctx.renderCanvas(); ctx.renderConfigPane(); adjustCanvasHeight(); renderTaskList(); refreshTabCounts();
    toast(images.length === 1
      ? t('taskPane.imageAddedSingular')
      : t('taskPane.imageAddedPlural', { n: images.length }));
  });

  // In-canvas editors (e.g. Komposition drag-to-move) dispatch this on mutation.
  canvas.addEventListener('block-config-changed', () => {
    ctx.renderConfigPane();
    adjustCanvasHeight();
  });

  // Exposed to the global keyboard handler via activeTaskCtx.
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

// Called from panes when leaving a task.
export function clearActiveTaskCtx(){ activeTaskCtx = null; }
export function getActiveTaskCtx(){ return activeTaskCtx; }
