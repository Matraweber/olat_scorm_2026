// preview.js: Mount each block in a shadow DOM so the canvas matches the SCORM preview.
// Falls back to def.preview() or a text summary when mount() isn't usable.
// measureRuntimeHeight(): block height in the exported page ("Höhe für SCORM anpassen").
import { state } from './state.js';
import { blockSummary } from './canvas.js';
import { t } from './i18n.js';

// Cached runtime stylesheet, injected into each shadow root.
let _runtimeStylesText = null;
let _runtimeStylesPromise = null;

async function fetchTextRelOnce(path){
  const url = 'template/' + path + '?t=' + Date.now();
  const r = await fetch(url);
  if(!r.ok) throw new Error(t('io.error.templateLoad', { path }));
  return r.text();
}

export function loadRuntimeStyles(){
  if(_runtimeStylesText != null) return Promise.resolve(_runtimeStylesText);
  if(_runtimeStylesPromise) return _runtimeStylesPromise;
  _runtimeStylesPromise = fetchTextRelOnce('styles.css').then(txt => { _runtimeStylesText = txt; return txt; }).catch(() => '');
  return _runtimeStylesPromise;
}

// Preload once; re-render whatever's already mounted.
loadRuntimeStyles().then(() => { try { renderCanvasAll(); } catch{} });

export function renderCanvasAll(){
  document.querySelectorAll('.canvas-block-card').forEach(card => {
    const id = card.dataset.blockId;
    const body = card.querySelector('.canvas-block-body');
    if(!body || !id) return;
    const task = state.course.tasks[state.selected && state.selected.idx];
    if(!task) return;
    const b = (task.blocks || []).find(x => x.id === id);
    if(b) renderBlockPreview(body, b);
  });
}

function makeStubApi(block){
  return {
    utils: window.BlockUtils,
    blockId: 'preview_' + String(block.id || '').replace(/[^A-Za-z0-9_]/g, ''),
    // Mirror the course-wide regenerate defaults so the in-builder preview
    // matches the SCORM runtime; blocks still override per-config.
    regenDefaults: {
      lockAfterCheck: !!(state.course && state.course.regenLockAfterCheck),
      noRegenerate: !!(state.course && state.course.regenNoRegenerate)
    },
    initScore(){},
    reportScore(){}
  };
}

// API for builderMount(): blocks mutate config directly and call requestConfigRefresh.
function makeBuilderApi(block, host){
  return {
    utils: window.BlockUtils,
    blockId: 'edit_' + String(block.id || '').replace(/[^A-Za-z0-9_]/g, ''),
    requestConfigRefresh(){
      host.dispatchEvent(new CustomEvent('block-config-changed', {
        bubbles: true,
        detail: { blockId: block.id }
      }));
    }
  };
}

// Height a block needs in the exported SCORM page so its cell doesn't
// scroll. Mounts it the way the runtime does (cell exactly pos.w wide,
// runtime styles, no builder head/padding) in a hidden shadow root and
// measures the content. Blocks with random values are mounted several
// times and the tallest draw counts. Returns px or null.
const RUNTIME_FIT_DRAWS = 4;
export async function measureRuntimeHeight(block){
  const def = window.Blocks && window.Blocks.get(block.type);
  if(!def || typeof def.mount !== 'function' || !window.BlockUtils) return null;
  const css = await loadRuntimeStyles();
  const width = Math.max(40, Number(block.pos && block.pos.w) || 500);
  const font = (state.theme && state.theme.fontFamily) || 'Verdana, Arial, sans-serif';
  const outer = document.createElement('div');
  outer.style.cssText = 'position:fixed; left:-20000px; top:0; width:' + (width + 40) + 'px; visibility:hidden; pointer-events:none;';
  document.body.appendChild(outer);
  try {
    const shadow = outer.attachShadow({ mode: 'open' });
    const styleEl = document.createElement('style');
    styleEl.textContent = (css || '') +
      '\n:host { display:block; font-family:' + font + '; color:#1d2a33; font-size:16px; line-height:normal; }\n' +
      // flow-root: like the runtime cell (overflow:auto), child margins
      // stay inside the cell instead of collapsing out of it.
      '.fit-cell { position:relative !important; height:auto !important; overflow:visible !important; display:flow-root !important; }\n';
    shadow.appendChild(styleEl);
    // KaTeX metrics change line heights, so wait for its stylesheet.
    const links = [];
    document.querySelectorAll('link[rel="stylesheet"][href*="katex"]').forEach(l => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = l.href;
      links.push(new Promise(res => { link.onload = link.onerror = res; }));
      shadow.appendChild(link);
    });
    await Promise.race([Promise.all(links), new Promise(r => setTimeout(r, 2000))]);
    const draws = def.graded ? RUNTIME_FIT_DRAWS : 1;
    let max = 0;
    for(let i = 0; i < draws; i++){
      const canvas = document.createElement('div');
      canvas.className = 'task-canvas';
      canvas.style.cssText = 'position:relative; width:1100px;';
      const cell = document.createElement('div');
      cell.className = 'canvas-block fit-cell';
      cell.style.width = width + 'px';
      canvas.appendChild(cell);
      shadow.appendChild(canvas);
      let inst = null;
      try {
        inst = def.mount(cell, JSON.parse(JSON.stringify(block.config || {})), makeStubApi(block));
        window.BlockUtils.renderMath(cell);
      } catch{ canvas.remove(); continue; }
      const imgs = Array.from(cell.querySelectorAll('img')).filter(img => !img.complete);
      if(imgs.length){
        await Promise.race([
          Promise.all(imgs.map(img => new Promise(res => { img.onload = img.onerror = res; }))),
          new Promise(r => setTimeout(r, 3000))
        ]);
      }
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      max = Math.max(max, cell.scrollHeight, Math.ceil(cell.getBoundingClientRect().height));
      try { inst && inst.destroy && inst.destroy(); } catch{}
      canvas.remove();
    }
    return max > 0 ? max : null;
  } finally {
    outer.remove();
  }
}

export function renderBlockPreview(host, block){
  host.innerHTML = '';
  const def = window.Blocks.get(block.type);

  // builderMount(): interactive in-canvas editor in regular DOM (no shadow).
  if(def && typeof def.builderMount === 'function' && window.BlockUtils){
    try {
      def.builderMount(host, block, makeBuilderApi(block, host));
      return;
    } catch{
      host.innerHTML = '';
    }
  }

  // Default: real mount() inside an isolated shadow DOM.
  if(def && typeof def.mount === 'function' && window.BlockUtils){
    try {
      const shadowHost = document.createElement('div');
      shadowHost.className = 'canvas-mount-host';
      shadowHost.style.cssText = 'width:100%; min-height:0; pointer-events:none;';
      host.appendChild(shadowHost);
      const shadow = shadowHost.attachShadow({mode: 'open'});

      const styleEl = document.createElement('style');
      styleEl.textContent = (_runtimeStylesText || '') +
        '\n:host { display:block; }\n' +
        '.scorm-shell, .scorm-header, .scorm-footer { display:none; }\n' +
        '.canvas-mount-wrap { padding: 0.55rem 0.7rem; }\n';
      shadow.appendChild(styleEl);

      // Mirror KaTeX stylesheet so math renders inside the shadow root.
      document.querySelectorAll('link[rel="stylesheet"][href*="katex"]').forEach(l => {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = l.href; link.crossOrigin = 'anonymous';
        shadow.appendChild(link);
      });

      const mountHost = document.createElement('div');
      mountHost.className = 'canvas-mount-wrap';
      shadow.appendChild(mountHost);

      // Disable shuffle/randomize so the canvas stays still while editing.
      const stableConfig = Object.assign({}, block.config || {}, { shuffle: false, randomize: false });
      def.mount(mountHost, stableConfig, makeStubApi(block));
      if(window.BlockUtils && typeof window.BlockUtils.renderMath === 'function'){
        window.BlockUtils.renderMath(mountHost);
      }
      return;
    } catch{
      host.innerHTML = '';
    }
  }

  if(def && typeof def.preview === 'function'){
    try { def.preview(host, block.config || {}); return; }
    catch{}
  }
  // Fallback: text summary
  const span = document.createElement('span');
  span.className = 'canvas-block-summary';
  span.style.cssText = 'padding:0.5rem 0.7rem; color:var(--muted); font-size:0.85rem;';
  span.textContent = blockSummary(block);
  host.appendChild(span);
}
