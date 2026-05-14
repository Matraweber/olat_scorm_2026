// ============================================================================
// preview.js - Render a block's real runtime mount() inside an isolated
// Shadow DOM, so the builder canvas matches the SCORM preview exactly.
// Falls back to def.preview() or a text summary if mount() isn't possible.
// ============================================================================
import { el } from './util.js';
import { state } from './state.js';
import { blockSummary } from './canvas.js';

// ---- Cache for runtime stylesheet (injected into each shadow root) ----
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

// Preload once on first use; re-render whatever's already on screen.
loadRuntimeStyles().then(() => { try { renderCanvasAll(); } catch(e){} });

export function renderCanvasAll(){
  // Re-render every canvas-block-body that has a [data-block-id] in the document.
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
    initScore(){ /* no-op in builder preview */ },
    reportScore(){ /* no-op in builder preview */ }
  };
}

export function renderBlockPreview(host, block){
  host.innerHTML = '';
  const def = window.Blocks.get(block.type);

  // Preferred: real runtime mount() inside an isolated shadow DOM so the
  // canvas matches the preview exactly.
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

      // Mirror the page's KaTeX stylesheet so math renders inside shadow root.
      document.querySelectorAll('link[rel="stylesheet"][href*="katex"]').forEach(l => {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = l.href; link.crossOrigin = 'anonymous';
        shadow.appendChild(link);
      });

      const mountHost = document.createElement('div');
      mountHost.className = 'canvas-mount-wrap';
      shadow.appendChild(mountHost);

      // Stabilise random/shuffle config so the canvas stays static while editing.
      const stableConfig = Object.assign({}, block.config || {}, { shuffle: false, randomize: false });
      def.mount(mountHost, stableConfig, makeStubApi(block));
      if(window.BlockUtils && typeof window.BlockUtils.renderMath === 'function'){
        window.BlockUtils.renderMath(mountHost);
      }
      return;
    } catch(e){
      host.innerHTML = '';
      // Fall through to legacy preview()
    }
  }

  if(def && typeof def.preview === 'function'){
    try { def.preview(host, block.config || {}); return; }
    catch(e){ /* fall through to summary text */ }
  }
  // Fallback: text summary
  const span = document.createElement('span');
  span.className = 'canvas-block-summary';
  span.style.cssText = 'padding:0.5rem 0.7rem; color:var(--muted); font-size:0.85rem;';
  span.textContent = blockSummary(block);
  host.appendChild(span);
}
