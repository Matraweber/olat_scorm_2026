// preview.js: Mount each block in a shadow DOM so the canvas matches the SCORM preview.
// Falls back to def.preview() or a text summary when mount() isn't usable.
import { state } from './state.js';
import { blockSummary } from './canvas.js';

// Cached runtime stylesheet, injected into each shadow root.
let _runtimeStylesText = null;
let _runtimeStylesPromise = null;

async function fetchTextRelOnce(path){
  const url = 'template/' + path + '?t=' + Date.now();
  const r = await fetch(url);
  if(!r.ok) throw new Error('Konnte Template-Datei nicht laden: ' + path);
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
