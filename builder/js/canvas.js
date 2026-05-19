// ============================================================================
// canvas.js: Canvas constants, default sizes, position helpers, snap algorithm,
//             snap guides, block summary, autofit, drop-marker helpers.
// ============================================================================
import { el, cssEscapeSafe, stripHtmlText } from './util.js';
import { state, pushHistory, render } from './state.js';

// ---- Block-files registry (used for ZIP packaging and template loading) ----
export const BLOCK_FILES = {
  'heading':           'heading.js',
  'rich-text':         'rich-text.js',
  'note-box':          'note-box.js',
  'image':             'image.js',
  'divider':           'divider.js',
  'code':              'code.js',
  'multiple-choice':   'multiple-choice.js',
  'numeric-input':     'numeric-input.js',
  'text-input':        'text-input.js',
  'cloze':             'cloze.js',
  'match-pairs':       'match-pairs.js',
  'hotzone':           'hotzone.js',
  'sort-list':         'sort-list.js',
  'complex-question':  'complex-question.js',
  'function-question': 'function-question.js',
  'vector-question':   'vector-question.js',
  'number-base':       'number-base.js',
  'unit-convert':      'unit-convert.js',
  'truth-table':       'truth-table.js',
  'function-sandbox':  'function-sandbox.js',
  'composition':       'composition.js'
};

export function usedBlockTypes(){
  const set = new Set();
  state.course.tasks.forEach(t => {
    const allBlocks = (t.tabs && t.tabs.length) ? t.tabs.flatMap(tb => tb.blocks || []) : (t.blocks || []);
    allBlocks.forEach(b => set.add(b.type));
  });
  return Array.from(set);
}

// ---- Canvas dimensions ----
export const CANVAS_WIDTH = 1100;
export const SNAP_PX = 6;
export const GRID = 8;

const BLOCK_DEFAULT_SIZES = {
  'heading':           {w: 900, h: 72},
  'rich-text':         {w: 900, h: 160},
  'note-box':          {w: 900, h: 160},
  'image':             {w: 500, h: 380},
  'divider':           {w: 900, h: 24},
  'code':              {w: 800, h: 280},
  'multiple-choice':   {w: 600, h: 520},
  'numeric-input':     {w: 600, h: 380},
  'text-input':        {w: 600, h: 340},
  'cloze':             {w: 900, h: 320},
  'match-pairs':       {w: 900, h: 540},
  'sort-list':         {w: 700, h: 420},
  'complex-question':  {w: 1080, h: 720},
  'function-question': {w: 1080, h: 640},
  'vector-question':   {w: 1080, h: 720},
  'number-base':       {w: 700, h: 360},
  'truth-table':       {w: 700, h: 520},
  'function-sandbox':  {w: 1080, h: 580},
  'composition':       {w: 700, h: 460}
};
export function defaultSizeFor(type){ return BLOCK_DEFAULT_SIZES[type] || {w: 500, h: 200}; }

export function ensurePos(block, allBlocks){
  if(block.pos) return;
  const sz = defaultSizeFor(block.type);
  let stackY = 20;
  allBlocks.forEach(b => { if(b !== block && b.pos && b.pos.y + b.pos.h > stackY) stackY = b.pos.y + b.pos.h + 16; });
  block.pos = { x: 20, y: stackY, w: sz.w, h: sz.h };
}
export function ensureAllPos(blocks){ blocks.forEach(b => ensurePos(b, blocks)); }

// ---- Snap algorithm ----
const EDGE_LABELS = {
  left:'links', right:'rechts', cx:'Mitte X',
  top:'oben',  bottom:'unten', cy:'Mitte Y'
};

export function applySnap(self, candidate, others){
  const guides = [];
  let snappedX = candidate.x, snappedY = candidate.y;
  const vLines = [0, CANVAS_WIDTH];
  const hLines = [0];
  others.forEach(b => {
    vLines.push(b.pos.x, b.pos.x + b.pos.w, b.pos.x + b.pos.w / 2);
    hLines.push(b.pos.y, b.pos.y + b.pos.h, b.pos.y + b.pos.h / 2);
  });
  const selfX = [
    {edge:'left',  val: candidate.x},
    {edge:'right', val: candidate.x + candidate.w},
    {edge:'cx',    val: candidate.x + candidate.w / 2}
  ];
  let bestX = null;
  selfX.forEach(s => vLines.forEach(line => {
    const d = Math.abs(s.val - line);
    if(d <= SNAP_PX && (!bestX || d < bestX.d)) bestX = {d, line, edge: s.edge};
  }));
  if(bestX){
    if(bestX.edge === 'left') snappedX = bestX.line;
    else if(bestX.edge === 'right') snappedX = bestX.line - candidate.w;
    else snappedX = bestX.line - candidate.w / 2;
    guides.push({orientation:'v', val: bestX.line, edge: bestX.edge, label: EDGE_LABELS[bestX.edge]});
  }
  const selfY = [
    {edge:'top',    val: candidate.y},
    {edge:'bottom', val: candidate.y + candidate.h},
    {edge:'cy',     val: candidate.y + candidate.h / 2}
  ];
  let bestY = null;
  selfY.forEach(s => hLines.forEach(line => {
    const d = Math.abs(s.val - line);
    if(d <= SNAP_PX && (!bestY || d < bestY.d)) bestY = {d, line, edge: s.edge};
  }));
  if(bestY){
    if(bestY.edge === 'top') snappedY = bestY.line;
    else if(bestY.edge === 'bottom') snappedY = bestY.line - candidate.h;
    else snappedY = bestY.line - candidate.h / 2;
    guides.push({orientation:'h', val: bestY.line, edge: bestY.edge, label: EDGE_LABELS[bestY.edge]});
  }
  if(!bestX) snappedX = Math.round(snappedX / GRID) * GRID;
  if(!bestY) snappedY = Math.round(snappedY / GRID) * GRID;
  snappedX = Math.max(0, Math.min(snappedX, CANVAS_WIDTH - candidate.w));
  snappedY = Math.max(0, snappedY);
  return { x: snappedX, y: snappedY, guides };
}

export function applyResizeSnap(self, candidateW, candidateH, others){
  const guides = [];
  let w = Math.max(80, candidateW);
  let h = Math.max(40, candidateH);
  const vLines = [CANVAS_WIDTH];
  const hLines = [];
  others.forEach(b => {
    vLines.push(b.pos.x, b.pos.x + b.pos.w);
    hLines.push(b.pos.y, b.pos.y + b.pos.h);
  });
  const myRight = self.pos.x + w;
  let bestV = null;
  vLines.forEach(line => { const d = Math.abs(myRight - line); if(d <= SNAP_PX && (!bestV || d < bestV.d)) bestV = {d, line}; });
  if(bestV){ w = bestV.line - self.pos.x; guides.push({orientation:'v', val: bestV.line, edge:'right', label:'rechte Kante'}); }
  else w = Math.round(w / GRID) * GRID;
  const myBottom = self.pos.y + h;
  let bestH = null;
  hLines.forEach(line => { const d = Math.abs(myBottom - line); if(d <= SNAP_PX && (!bestH || d < bestH.d)) bestH = {d, line}; });
  if(bestH){ h = bestH.line - self.pos.y; guides.push({orientation:'h', val: bestH.line, edge:'bottom', label:'untere Kante'}); }
  else h = Math.round(h / GRID) * GRID;
  w = Math.max(80, Math.min(w, CANVAS_WIDTH - self.pos.x));
  h = Math.max(40, h);
  return { w, h, guides };
}

export function showSnapGuides(canvas, guides){
  canvas.querySelectorAll('.snap-guide').forEach(g => g.remove());
  guides.forEach(g => {
    const guide = el('div', {className: 'snap-guide ' + (g.orientation === 'v' ? 'v' : 'h')});
    if(g.orientation === 'v') guide.style.left = g.val + 'px';
    else guide.style.top = g.val + 'px';
    if(g.label) guide.appendChild(el('span', {className:'snap-guide-label', text: g.label}));
    canvas.appendChild(guide);
  });
}
export function hideSnapGuides(canvas){ canvas.querySelectorAll('.snap-guide').forEach(g => g.remove()); }

// ---- Drop markers (block list reordering) ----
export function clearDropMarkers(host){
  host.querySelectorAll('.drop-before, .drop-after').forEach(c => c.classList.remove('drop-before','drop-after'));
}
export function findInsertIndex(listEl, y){
  const cards = Array.from(listEl.querySelectorAll('.block-edit-card:not(.dragging)'));
  for(let i = 0; i < cards.length; i++){
    const r = cards[i].getBoundingClientRect();
    if(y < r.top + r.height / 2) return parseInt(cards[i].dataset.blockIdx, 10);
  }
  return listEl.querySelectorAll('.block-edit-card').length;
}

// ---- Short summary text used when block preview can't render ----
export function blockSummary(block){
  const cfg = block.config || {};
  switch(block.type){
    case 'heading': return cfg.text || '(leer)';
    case 'rich-text': { const t = stripHtmlText(cfg.html); return t.length > 80 ? t.slice(0, 80) + '…' : (t || '(leerer Text)'); }
    case 'note-box': return cfg.title || 'Hinweis';
    case 'image': return cfg.src ? 'Bild gesetzt' : '(noch kein Bild)';
    case 'divider': return 'Trennlinie';
    case 'multiple-choice': return (stripHtmlText(cfg.question) || '(Frage leer)') + ' · ' + ((cfg.choices||[]).length) + ' Antworten';
    case 'numeric-input': return cfg.questionTemplate || '(Frage leer)';
    case 'text-input': return cfg.question || '(Frage leer)';
    case 'cloze': { const t = stripHtmlText(cfg.text); return t.length > 80 ? t.slice(0, 80) + '…' : (t || '(leer)'); }
    case 'match-pairs': return ((cfg.pairs||[]).length) + ' Paare';
    case 'truth-table': return ((cfg.expressions||[]).length) + ' Ausdrücke';
    case 'number-base': return 'Zahlensystem-Umrechnung';
    case 'complex-question': return ((cfg.pool||[]).length) + ' Punkte im Pool';
    case 'function-question': return ((cfg.functions||[]).length) + ' Funktion(en)';
    case 'vector-question': return ((cfg.pool||[]).length) + ' Vektoren im Pool';
    default: return (window.Blocks.get(block.type) || {}).label || block.type;
  }
}

// ---- Content-fit height measurement helpers ----
// Used by autoFitBlock plus the post-render autofit passes in task-pane.js
// and task-pane-canvas.js. Centralised so all three agree on how to read a
// block's rendered height (which may live inside a shadow-DOM mount host).

// Measure the rendered content height of a canvas-block card.
// Returns 0 if the card has no body or has not rendered yet.
export function measureCardContent(card){
  if(!card) return 0;
  const body = card.querySelector('.canvas-block-body');
  if(!body) return 0;
  const shadowHost = body.querySelector('.canvas-mount-host');
  if(shadowHost && shadowHost.shadowRoot){
    const wrap = shadowHost.shadowRoot.querySelector('.canvas-mount-wrap');
    if(wrap) return wrap.scrollHeight;
  }
  return body.scrollHeight;
}

// Compute the card height (head + content + padding) that snugly fits the
// rendered content. Returns null when there is nothing measurable yet.
export function fitHeightForCard(card){
  const content = measureCardContent(card);
  if(content <= 0) return null;
  const head = card.querySelector('.canvas-block-head');
  const headH = head ? head.offsetHeight : 32;
  return Math.max(60, Math.round(content + headH + 8));
}

// ---- Auto-fit block height to its rendered content (button + Enter handler) ----
export function autoFitBlock(block){
  const card = document.querySelector('.canvas-block-card[data-block-id="' + cssEscapeSafe(block.id) + '"]');
  const newH = fitHeightForCard(card);
  if(newH == null) return;
  pushHistory();
  block.pos.h = newH;
  render();
}
