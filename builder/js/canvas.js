// canvas.js: Canvas constants, default sizes, position helpers, snap
// algorithm, snap guides, block summary, autofit, drop-marker helpers.
import { el, cssEscape, tProp } from './util.js';
import { state, pushHistory, render } from './state.js';
import { t } from './i18n.js';

// Block-files registry, used for ZIP packaging and template loading.
// Each value is either a single filename or an array of files loaded in order
// (the last file is the one that calls Blocks.register; earlier files contain
// helpers consumed by the registration file).
export const BLOCK_FILES = {
  'heading':           'heading.js',
  'rich-text':         'rich-text.js',
  'note-box':          'note-box.js',
  'image':             'image.js',
  'audio':             'audio.js',
  'video':             'video.js',
  'file-download':     'file-download.js',
  'summary':           'summary.js',
  'survey':            'survey.js',
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
  'table':             'table.js',
  'equation-system':   'equation-system.js',
  'function-sandbox':  'function-sandbox.js',
  'composition':       ['composition-helpers.js', 'composition-runtime.js', 'composition-toolbar-popovers.js', 'composition-toolbar.js', 'composition-canvas.js', 'composition.js'],
  'complex-input':     'complex-input.js'
};

export function usedBlockTypes(){
  const set = new Set();
  state.course.tasks.forEach(t => {
    const allBlocks = (t.tabs && t.tabs.length) ? t.tabs.flatMap(tb => tb.blocks || []) : (t.blocks || []);
    allBlocks.forEach(b => set.add(b.type));
  });
  return Array.from(set);
}

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
  'table':             {w: 700, h: 460},
  'equation-system':   {w: 600, h: 460},
  'sort-list':         {w: 700, h: 420},
  'complex-question':  {w: 1080, h: 720},
  'function-question': {w: 1080, h: 640},
  'vector-question':   {w: 1080, h: 720},
  'number-base':       {w: 700, h: 360},
  'truth-table':       {w: 700, h: 520},
  'function-sandbox':  {w: 1080, h: 580},
  'composition':       {w: 700, h: 460},
  'complex-input':     {w: 600, h: 380}
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

// Snap algorithm
const EDGE_LABEL_KEYS = {
  left:'canvas.snap.edge.left',
  right:'canvas.snap.edge.right',
  cx:'canvas.snap.edge.centerX',
  top:'canvas.snap.edge.top',
  bottom:'canvas.snap.edge.bottom',
  cy:'canvas.snap.edge.centerY'
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
    guides.push({orientation:'v', val: bestX.line, edge: bestX.edge, label: t(EDGE_LABEL_KEYS[bestX.edge])});
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
    guides.push({orientation:'h', val: bestY.line, edge: bestY.edge, label: t(EDGE_LABEL_KEYS[bestY.edge])});
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
  if(bestV){ w = bestV.line - self.pos.x; guides.push({orientation:'v', val: bestV.line, edge:'right', label: t('canvas.snap.edge.rightEdge')}); }
  else w = Math.round(w / GRID) * GRID;
  const myBottom = self.pos.y + h;
  let bestH = null;
  hLines.forEach(line => { const d = Math.abs(myBottom - line); if(d <= SNAP_PX && (!bestH || d < bestH.d)) bestH = {d, line}; });
  if(bestH){ h = bestH.line - self.pos.y; guides.push({orientation:'h', val: bestH.line, edge:'bottom', label: t('canvas.snap.edge.bottomEdge')}); }
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

// Drop markers (block list reordering)
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

// Block summary text used when preview can't render. Blocks may declare
// summary(cfg); we fall back to the block's label.
export function blockSummary(block){
  const def = window.Blocks.get(block.type);
  if(def && typeof def.summary === 'function'){
    try { return def.summary(block.config || {}); } catch{}
  }
  return (def && tProp(def, 'label')) || block.type;
}

// Natural content height. Relaxes overflow:hidden on card/body and any SVG
// max-height (capViewport) so scrollHeight reports the true height.
export function measureCardContent(card){
  if(!card) return 0;
  const body = card.querySelector('.canvas-block-body');
  if(!body) return 0;
  const shadowHost = body.querySelector('.canvas-mount-host');
  if(shadowHost && shadowHost.shadowRoot){
    const wrap = shadowHost.shadowRoot.querySelector('.canvas-mount-wrap');
    if(wrap) return wrap.scrollHeight;
  }
  const cardStyle = { overflow: card.style.overflow, height: card.style.height };
  const bodyStyle = { overflow: body.style.overflow, height: body.style.height, minHeight: body.style.minHeight, flex: body.style.flex };
  // Also release SVGs whose max-height was set by capViewport.
  const svgs = Array.from(body.querySelectorAll('svg'));
  const svgStyles = svgs.map(s => ({ maxHeight: s.style.maxHeight, height: s.style.height, aspectRatio: s.style.aspectRatio }));
  try {
    card.style.height = 'auto';
    card.style.overflow = 'visible';
    body.style.height = 'auto';
    body.style.overflow = 'visible';
    body.style.minHeight = '';
    body.style.flex = 'initial';
    svgs.forEach(s => { s.style.maxHeight = 'none'; });
    return body.scrollHeight;
  } finally {
    card.style.overflow = cardStyle.overflow;
    card.style.height = cardStyle.height;
    body.style.overflow = bodyStyle.overflow;
    body.style.height = bodyStyle.height;
    body.style.minHeight = bodyStyle.minHeight;
    body.style.flex = bodyStyle.flex;
    svgs.forEach((s, i) => {
      s.style.maxHeight = svgStyles[i].maxHeight;
      s.style.height = svgStyles[i].height;
      s.style.aspectRatio = svgStyles[i].aspectRatio;
    });
  }
}

// Card height = head + content + 8 px padding. Returns null when nothing
// measurable is rendered yet.
export function fitHeightForCard(card){
  const content = measureCardContent(card);
  if(content <= 0) return null;
  const head = card.querySelector('.canvas-block-head');
  const headH = head ? head.offsetHeight : 32;
  return Math.max(60, Math.round(content + headH + 8));
}

// Auto-fit block height to its rendered content (button + Enter handler).
export function autoFitBlock(block){
  const card = document.querySelector('.canvas-block-card[data-block-id="' + cssEscape(block.id) + '"]');
  const newH = fitHeightForCard(card);
  if(newH == null) return;
  pushHistory();
  block.pos.h = newH;
  render();
}
