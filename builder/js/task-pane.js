// ============================================================================
// task-pane.js - The free-canvas editor for one task: drag, snap, multi-select,
// zoom, optional tab nav, block-config side panel. Largest single module.
// ============================================================================
import { el, uid, cssEscape } from './util.js';
import { state, pushHistory, pushHistoryDebounced, takeHistorySnap, commitHistorySnap, discardHistorySnap, renderActivePane } from './state.js';
import {
  CANVAS_WIDTH,
  ensurePos, ensureAllPos,
  applySnap, applyResizeSnap, showSnapGuides, hideSnapGuides,
  autoFitBlock
} from './canvas.js';
import { hasTabs, syncTaskBlocksAlias, enableTabsOn, disableTabsOn, validateBlock } from './tasks.js';
import { renderField } from './form.js';
import { renderBlockPreview } from './preview.js';
import { renderTaskList } from './panes.js';
import { openBlockTypeModal, openSaveTemplateModal } from './modals.js';

// Currently-active task pane context - used by global keyboard handler.
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
  tabsBtn.addEventListener('click', () => {
    if(hasTabs(task)){
      const tab2Count = (task.tabs[1] && task.tabs[1].blocks ? task.tabs[1].blocks.length : 0);
      if(tab2Count > 0 && !confirm('Tab 2 enthält ' + tab2Count + ' Block/Blöcke. Beim Deaktivieren gehen diese verloren. Fortfahren?')) return;
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
    let maxBottom = 320;
    task.blocks.forEach(b => { if(b.pos.y + b.pos.h + 80 > maxBottom) maxBottom = b.pos.y + b.pos.h + 80; });
    canvas.style.height = maxBottom + 'px';
    applyZoom();
  }

  function selectedBlocks(){ return task.blocks.filter(b => selectedBlockIds.has(b.id)); }

  // ===== Config side-pane (single block / multi-select / empty) =====
  function renderConfigPane(){
    configHost.innerHTML = '';
    const selBlocks = selectedBlocks();

    if(selBlocks.length === 0){
      configHost.appendChild(el('div', {className:'block-config-empty', html:'Klicke einen Block auf der Canvas, um ihn zu bearbeiten.<br><br><strong>Tipps:</strong><br>• Shift + Klick: mehrere Blöcke auswählen<br>• Pfeiltasten: pixelweise verschieben (Shift = 10 px)<br>• Entf: Block löschen<br>• Strg + Mausrad: Zoom'}));
      return;
    }

    if(selBlocks.length > 1){
      // Multi-select bulk actions
      const head = el('div', {className:'block-config-head'});
      head.appendChild(el('h3', {html: 'Mehrfachauswahl <span class="multi-count-badge">' + selBlocks.length + '</span>'}));
      configHost.appendChild(head);
      configHost.appendChild(el('div', {className:'field-help', text:'Wähle eine Aktion für alle ausgewählten Blöcke.'}));

      const actions = el('div', {className:'bulk-actions'});
      const alignRow = el('div', {className:'bulk-row'});
      alignRow.appendChild(el('strong', {text:'Ausrichten'}));
      [
        {label:'⟸ Links',   fn:()=>bulkAlign('left')},
        {label:'⇔ Mitte X', fn:()=>bulkAlign('cx')},
        {label:'Rechts ⟹', fn:()=>bulkAlign('right')},
        {label:'⤒ Oben',   fn:()=>bulkAlign('top')},
        {label:'⇕ Mitte Y', fn:()=>bulkAlign('cy')},
        {label:'Unten ⤓',  fn:()=>bulkAlign('bottom')}
      ].forEach(a => {
        const b = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:a.label});
        b.addEventListener('click', a.fn);
        alignRow.appendChild(b);
      });
      actions.appendChild(alignRow);

      if(selBlocks.length >= 3){
        const distRow = el('div', {className:'bulk-row'});
        distRow.appendChild(el('strong', {text:'Verteilen (gleicher Abstand)'}));
        const dh = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Horizontal'});
        dh.addEventListener('click', () => bulkDistribute('h'));
        const dv = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'Vertikal'});
        dv.addEventListener('click', () => bulkDistribute('v'));
        distRow.appendChild(dh); distRow.appendChild(dv);
        actions.appendChild(distRow);
      }
      const commonRow = el('div', {className:'bulk-row'});
      commonRow.appendChild(el('strong', {text:'Aktionen'}));
      const dupAll = el('button', {className:'btn btn-secondary btn-sm', attrs:{type:'button'}, text:'⧉ Duplizieren'});
      dupAll.addEventListener('click', bulkDuplicate);
      const delAll = el('button', {className:'btn btn-danger btn-sm', attrs:{type:'button'}, text:'✕ Löschen'});
      delAll.addEventListener('click', bulkDelete);
      commonRow.appendChild(dupAll); commonRow.appendChild(delAll);
      actions.appendChild(commonRow);
      configHost.appendChild(actions);
      return;
    }

    // Single selection: full config form
    const sel = selBlocks[0];
    const def = window.Blocks.get(sel.type);
    const headBlock = el('div', {className:'block-config-head'});
    headBlock.appendChild(el('h3', {text: 'Konfiguration: ' + ((def && def.label) || sel.type)}));
    const meta = el('span', {className:'block-config-meta', text: posLabel(sel)});
    headBlock.appendChild(meta);
    configHost.appendChild(headBlock);
    if(!def){
      configHost.appendChild(el('div', {className:'block-edit-error', text: 'Block-Typ "' + sel.type + '" ist nicht registriert.'}));
      return;
    }
    if(!sel.config) sel.config = def.defaultConfig ? def.defaultConfig() : {};
    const schema = def.builderSchema ? def.builderSchema() : [];
    if(schema.length === 0){
      configHost.appendChild(el('div', {className:'field-help', text:'Dieser Block hat keine Konfiguration.'}));
    } else {
      schema.forEach(spec => configHost.appendChild(renderField(spec, () => sel.config, (k, v) => {
        pushHistoryDebounced();
        sel.config[k] = v;
        scheduleBlockPreviewRefresh(sel);
        renderTaskList();
      })));
    }
    const warnings = validateBlock(sel);
    if(warnings.length > 0){
      const box = el('div', {className:'config-warnings'});
      box.appendChild(el('div', {className:'config-warnings-title', text:'Hinweise (' + warnings.length + ')'}));
      warnings.forEach(w => box.appendChild(el('div', {className:'config-warnings-item', text:'• ' + w})));
      configHost.appendChild(box);
    }
  }

  // Debounce canvas block re-renders so heavy mount() (e.g. plots) doesn't run on every keystroke.
  const _refreshTimers = new Map();
  function scheduleBlockPreviewRefresh(block){
    const id = block.id;
    if(_refreshTimers.has(id)) clearTimeout(_refreshTimers.get(id));
    _refreshTimers.set(id, setTimeout(() => {
      _refreshTimers.delete(id);
      const card = canvas.querySelector('[data-block-id="' + cssEscape(block.id) + '"]');
      if(card){
        const body = card.querySelector('.canvas-block-body');
        if(body) renderBlockPreview(body, block);
      }
    }, 250));
  }
  function posLabel(b){ return 'Position ' + Math.round(b.pos.x) + ', ' + Math.round(b.pos.y) + ' · Größe ' + Math.round(b.pos.w) + '×' + Math.round(b.pos.h); }

  // ===== Bulk actions =====
  function bulkAlign(edge){
    const sel = selectedBlocks(); if(sel.length < 2) return;
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
    renderCanvas(); adjustCanvasHeight();
  }
  function bulkDistribute(axis){
    const sel = selectedBlocks(); if(sel.length < 3) return;
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
    renderCanvas(); adjustCanvasHeight();
  }
  function bulkDuplicate(){
    const sel = selectedBlocks(); if(sel.length === 0) return;
    const newIds = [];
    sel.forEach(b => {
      const copy = JSON.parse(JSON.stringify(b));
      copy.id = uid('b_');
      copy.pos = Object.assign({}, b.pos, {x: b.pos.x + 24, y: b.pos.y + 24});
      task.blocks.push(copy);
      newIds.push(copy.id);
    });
    selectedBlockIds.clear();
    newIds.forEach(id => selectedBlockIds.add(id));
    persistSelection();
    renderCanvas(); renderConfigPane(); adjustCanvasHeight(); renderTaskList();
  }
  function bulkDelete(){
    const sel = selectedBlocks(); if(sel.length === 0) return;
    if(!confirm(sel.length === 1 ? 'Block löschen?' : sel.length + ' Blöcke löschen?')) return;
    const ids = sel.map(b => b.id);
    // In-place removal keeps task.blocks and task.tabs[i].blocks pointing at same array
    for(let bi = task.blocks.length - 1; bi >= 0; bi--){ if(ids.includes(task.blocks[bi].id)) task.blocks.splice(bi, 1); }
    selectedBlockIds.clear();
    persistSelection();
    renderCanvas(); renderConfigPane(); adjustCanvasHeight(); renderTaskList(); refreshTabCounts();
  }

  function updateSelectionVisuals(){
    canvas.querySelectorAll('.canvas-block-card').forEach(c => {
      c.classList.toggle('selected', selectedBlockIds.has(c.dataset.blockId));
    });
  }

  // ===== Canvas rendering =====
  function renderCanvas(){
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
      cardHead.appendChild(el('span', {className:'canvas-block-type', text: ((def && def.label) || block.type) + (def && def.graded ? ' · gewertet' : '')}));
      const ctrls = el('div', {className:'canvas-block-controls'});
      const fitBtn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Höhe an Inhalt anpassen'}, text:'↕'});
      const dupBtn = el('button', {className:'icon-btn', attrs:{type:'button', title:'Duplizieren'}, text:'⧉'});
      const rmBtn  = el('button', {className:'icon-btn danger', attrs:{type:'button', title:'Entfernen'}, text:'✕'});
      fitBtn.addEventListener('click', e => {
        e.stopPropagation();
        autoFitBlock(block);
      });
      dupBtn.addEventListener('click', e => {
        e.stopPropagation();
        pushHistory();
        const copy = JSON.parse(JSON.stringify(block));
        copy.id = uid('b_');
        copy.pos = Object.assign({}, block.pos, { x: block.pos.x + 24, y: block.pos.y + 24 });
        task.blocks.push(copy);
        selectedBlockIds.clear(); selectedBlockIds.add(copy.id); persistSelection();
        renderCanvas(); renderConfigPane(); adjustCanvasHeight(); renderTaskList();
      });
      rmBtn.addEventListener('click', e => {
        e.stopPropagation();
        if(!confirm('Block "' + ((def && def.label) || block.type) + '" entfernen?')) return;
        pushHistory();
        const i = task.blocks.findIndex(b => b.id === block.id);
        if(i >= 0) task.blocks.splice(i, 1);
        selectedBlockIds.delete(block.id); persistSelection();
        renderCanvas(); renderConfigPane(); adjustCanvasHeight(); renderTaskList();
      });
      ctrls.appendChild(fitBtn); ctrls.appendChild(dupBtn); ctrls.appendChild(rmBtn);
      cardHead.appendChild(ctrls);
      card.appendChild(cardHead);

      const cardBody = el('div', {className:'canvas-block-body'});
      renderBlockPreview(cardBody, block);
      card.appendChild(cardBody);

      const resize = el('div', {className:'canvas-block-resize', attrs:{title:'Größe ändern'}, text:'⌟'});
      card.appendChild(resize);

      installDragHandlers(card, block);
      installResizeHandler(resize, card, block);

      canvas.appendChild(card);
    });
    if(task.blocks.length === 0){
      const empty = el('div', {className:'canvas-block-empty', html:'<strong>Leere Canvas.</strong><br>Klicke <strong>+ Block</strong> oben rechts, um Inhalte hinzuzufügen.'});
      canvas.appendChild(empty);
    }
  }

  function installDragHandlers(card, block){
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
      persistSelection();
      updateSelectionVisuals();
      renderConfigPane();

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
        const dx = sdx / zoom, dy = sdy / zoom;
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
          persistSelection();
          updateSelectionVisuals();
          renderConfigPane();
        }
        adjustCanvasHeight();
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function installResizeHandler(handle, card, block){
    handle.addEventListener('mousedown', e => {
      e.stopPropagation();
      e.preventDefault();
      selectedBlockIds.clear(); selectedBlockIds.add(block.id); persistSelection();
      updateSelectionVisuals();
      renderConfigPane();
      const startX = e.clientX, startY = e.clientY;
      const startW = block.pos.w, startH = block.pos.h;
      takeHistorySnap();
      let didResize = false;
      function onMove(ev){
        const dx = (ev.clientX - startX) / zoom;
        const dy = (ev.clientY - startY) / zoom;
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
        adjustCanvasHeight();
        if(didResize) commitHistorySnap(); else discardHistorySnap();
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  canvas.addEventListener('mousedown', e => {
    if(e.target === canvas){
      selectedBlockIds.clear(); persistSelection();
      updateSelectionVisuals();
      renderConfigPane();
    }
  });

  function refreshTabCounts(){
    if(!hasTabs(task)) return;
    document.querySelectorAll('.builder-tab-btn').forEach((btn, i) => {
      const cnt = btn.querySelector('.builder-tab-count');
      if(cnt && task.tabs[i]) cnt.textContent = '(' + ((task.tabs[i].blocks || []).length) + ')';
    });
  }

  function addBlockOfType(blockType){
    pushHistory();
    const def = window.Blocks.get(blockType);
    const block = { id: uid('b_'), type: blockType, config: def && def.defaultConfig ? def.defaultConfig() : {} };
    ensurePos(block, task.blocks);
    task.blocks.push(block);
    selectedBlockIds.clear(); selectedBlockIds.add(block.id); persistSelection();
    renderCanvas(); renderConfigPane(); adjustCanvasHeight(); renderTaskList(); refreshTabCounts();
    // After mount, autofit height
    requestAnimationFrame(() => {
      const card = canvas.querySelector('[data-block-id="' + cssEscape(block.id) + '"]');
      if(!card) return;
      const cardBody = card.querySelector('.canvas-block-body');
      const cardHeadEl = card.querySelector('.canvas-block-head');
      const shadowHost = cardBody && cardBody.querySelector('.canvas-mount-host');
      let contentH = 0;
      if(shadowHost && shadowHost.shadowRoot){
        const wrap = shadowHost.shadowRoot.querySelector('.canvas-mount-wrap');
        if(wrap) contentH = wrap.scrollHeight;
      } else if(cardBody) contentH = cardBody.scrollHeight;
      if(contentH > 10){
        const headH = cardHeadEl ? cardHeadEl.offsetHeight : 32;
        const newH = Math.max(60, Math.round(contentH + headH + 8));
        if(Math.abs(newH - block.pos.h) > 10){ block.pos.h = newH; card.style.height = newH + 'px'; adjustCanvasHeight(); }
      }
    });
  }

  // ===== Helpers exposed to global keyboard handler via activeTaskCtx =====
  function nudgeSelected(dx, dy){
    const sel = selectedBlocks(); if(sel.length === 0) return;
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
    renderConfigPane();
  }
  function deselectAll(){
    selectedBlockIds.clear(); persistSelection();
    updateSelectionVisuals();
    renderConfigPane();
  }

  activeTaskCtx = {
    task,
    get selectedIds(){ return Array.from(selectedBlockIds); },
    nudgeSelected,
    bulkDelete,
    bulkDuplicate,
    selectAll,
    deselectAll
  };

  renderCanvas();
  adjustCanvasHeight();
  renderConfigPane();
}

// Clear the activeTaskCtx (called from panes when leaving a task)
export function clearActiveTaskCtx(){ activeTaskCtx = null; }
export function getActiveTaskCtx(){ return activeTaskCtx; }
