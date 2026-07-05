// audio.js: Embeds an audio file (data-URL or URL) with <audio controls>.
// Optional title above, caption below.
(function(){
  'use strict';

  Blocks.register('audio', {
    label: 'Audio',
    labelKey: 'block.audio.label',
    description: 'Audiodatei abspielen, z. B. Sprachaufnahme oder Hörbeispiel. Datei-Upload oder URL.',
    descKey: 'block.audio.description',
    category: 'Medien & Inhalt',
    categoryKey: 'block.category.content',
    icon: 'audio',
    graded: false,
    defaultConfig(locale = 'de'){
      return { src: '', title: '', caption: '' };
    },
    previewConfig(locale = 'de'){
      const en = locale === 'en';
      // _demo:true tells preview() to render a mock player.
      return {
        src: '',
        _demo: true,
        title: en ? 'Audio example: voice sample' : 'Audiobeispiel: Sprechprobe',
        caption: en ? 'Source: own recording' : 'Quelle: eigene Aufnahme'
      };
    },
    builderSchema(){
      return [
        { key:'title', label:'Titel (über dem Player, optional)', labelKey:'block.audio.field.title.label', type:'text' },
        { key:'src', label:'Audioquelle (Data-URL oder URL/Pfad)', labelKey:'block.audio.field.src.label', type:'audio', help:'Hochgeladene Audiodateien werden als Data-URL ins SCORM-Paket eingebettet. URL muss MP3/WAV/OGG sein.', helpKey:'block.audio.field.src.help' },
        { key:'caption', label:'Bildunterschrift (unter dem Player, optional)', labelKey:'block.audio.field.caption.label', type:'text' }
      ];
    },
    mount(host, config, api){
      const t = (api && api.utils && api.utils.t) ? api.utils.t : (k) => k;
      const l = (api && api.utils && api.utils.l) ? api.utils.l : (v) => v;
      const wrap = document.createElement('figure');
      wrap.className = 'audio-block';
      wrap.style.margin = '0';
      const titleText = l(config.title);
      if(titleText){
        const title = document.createElement('div');
        title.className = 'audio-block-title';
        title.textContent = titleText;
        title.style.cssText = 'font-weight:700; color:var(--primary); margin-bottom:0.4rem;';
        wrap.appendChild(title);
      }
      if(!config.src){
        const ph = document.createElement('div');
        ph.className = 'block-placeholder';
        ph.textContent = t('block.audio.placeholder.notSet');
        wrap.appendChild(ph);
        host.appendChild(wrap);
        return {};
      }
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.preload = 'metadata';
      audio.src = config.src;
      audio.style.cssText = 'width:100%; display:block;';
      wrap.appendChild(audio);
      const captionText = l(config.caption);
      if(captionText){
        const cap = document.createElement('figcaption');
        cap.textContent = captionText;
        cap.style.cssText = 'font-size:0.85rem; color:var(--muted); margin-top:0.4rem;';
        wrap.appendChild(cap);
      }
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      // _demo: render a mock player (welcome modal).
      // Otherwise: real <audio> if src set, dashed placeholder if not.
      const BU = window.BlockUtils || {};
      const t = (typeof BU.t === 'function') ? BU.t : (k) => k;
      const l = (typeof BU.l === 'function') ? BU.l : (v) => v;
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; flex-direction:column; height:100%; padding:0.4rem; box-sizing:border-box; gap:0.3rem; overflow:hidden;';
      const titleText = l(config.title);
      if(titleText){
        const tEl = document.createElement('div');
        tEl.textContent = titleText;
        tEl.style.cssText = 'font-weight:700; color:#003b5c; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
        wrap.appendChild(tEl);
      }
      if(config._demo){
        // Mock player (static SVG/HTML) for the welcome modal.
        const demo = document.createElement('div');
        demo.style.cssText = 'display:flex; align-items:center; gap:0.5rem; padding:0.45rem 0.7rem; border-radius:999px; background:#f1f5f9; border:1px solid #d2dce5;';
        demo.innerHTML =
          '<button type="button" style="flex:0 0 auto; width:28px; height:28px; border-radius:50%; background:#003b5c; color:#fff; border:none; cursor:default; display:flex; align-items:center; justify-content:center; padding:0;">' +
            '<svg viewBox="0 0 14 14" width="11" height="11" fill="currentColor" aria-hidden="true"><path d="M3 2 L12 7 L3 12 Z"/></svg>' +
          '</button>' +
          '<span style="color:#003b5c; font-family:\'SF Mono\',Menlo,Consolas,monospace; font-size:0.78rem;">0:00</span>' +
          // Waveform: 30 sine-based bars
          '<svg viewBox="0 0 220 18" width="100%" height="18" preserveAspectRatio="none" style="flex:1; opacity:0.6;" aria-hidden="true">' +
            (() => {
              const bars = [];
              for(let i = 0; i < 30; i++){
                const h = 4 + Math.abs(Math.sin(i * 1.3)) * 12;
                const y = 9 - h / 2;
                bars.push('<rect x="' + (i * 7.3) + '" y="' + y + '" width="3" height="' + h + '" rx="1.5" fill="#003b5c"/>');
              }
              return bars.join('');
            })() +
          '</svg>' +
          '<span style="color:#6a7986; font-family:\'SF Mono\',Menlo,Consolas,monospace; font-size:0.78rem;">2:14</span>' +
          '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="#6a7986" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M3 8 L6.5 8 L10.5 5 L10.5 15 L6.5 12 L3 12 Z" fill="#6a7986" stroke="none"/>' +
            '<path d="M13 7.5 C 14.3 8.8, 14.3 11.2, 13 12.5"/>' +
            '<path d="M15 5.5 C 17.2 7.7, 17.2 12.3, 15 14.5" opacity="0.55"/>' +
          '</svg>';
        wrap.appendChild(demo);
      } else if(!config.src){
        const ph = document.createElement('div');
        ph.style.cssText = 'flex:1; display:flex; align-items:center; justify-content:center; color:#888; font-style:italic; font-size:0.8rem; border:1px dashed #c7d3dc; border-radius:6px;';
        ph.textContent = t('block.audio.preview.noAudio');
        wrap.appendChild(ph);
      } else {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'metadata';
        audio.src = config.src;
        audio.style.cssText = 'width:100%; display:block;';
        wrap.appendChild(audio);
      }
      const captionText = l(config.caption);
      if(captionText){
        const cap = document.createElement('div');
        cap.textContent = captionText;
        cap.style.cssText = 'font-size:0.7rem; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
        wrap.appendChild(cap);
      }
      host.appendChild(wrap);
    }
  });
})();
