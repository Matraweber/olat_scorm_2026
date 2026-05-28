(function(){
  'use strict';

  // Stock illustration used as the welcome-preview background.
  const STOCK_LANDSCAPE_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240">' +
      '<rect width="400" height="240" fill="#e7f3f8"/>' +
      '<rect y="180" width="400" height="60" fill="#cde4b0"/>' +
      '<circle cx="60" cy="60" r="30" fill="#f5c14d"/>' +
      '<g fill="#ffffff">' +
        '<ellipse cx="280" cy="70" rx="40" ry="20"/>' +
        '<ellipse cx="310" cy="60" rx="25" ry="18"/>' +
        '<ellipse cx="255" cy="65" rx="22" ry="15"/>' +
      '</g>' +
      '<rect x="195" y="150" width="15" height="40" fill="#7a4d28"/>' +
      '<circle cx="202" cy="140" r="38" fill="#3f8a3f"/>' +
    '</svg>'
  );

  Blocks.register('hotzone', {
    label: 'Hotzone (Bild markieren)',
    description: 'Bild mit markierten Bereichen. Lernende klicken in die richtigen Zonen.',
    category: 'Frage',
    icon: '◳',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '',
        src: '', zones: [],
        prompt: 'Klicken Sie auf alle markierten Bereiche.',
        showZonesAfterCheck: true,
        maxPoints: 1
      };
    },
    previewConfig(){
      return {
        blockTitle: '',
        src: STOCK_LANDSCAPE_SVG,
        zones: [{ x: 0.41, y: 0.425, w: 0.19, h: 0.317 }],
        prompt: 'Klicken Sie auf den Baum.',
        showZonesAfterCheck: true,
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Hotzone' },
        { type:'section', label:'Frage', key:'_sec_q' },
        { key:'prompt', label:'Aufgabentext', type:'math-textarea', rows:2 },
        { type:'section', label:'Bild & Zonen', key:'_sec_zones' },
        { key:'src',   label:'Bild', type:'image',
          help:'Bild hochladen oder URL eingeben.' },
        { key:'zones', label:'Hotzonen einzeichnen', type:'zone-editor',
          help:'Rechteck auf dem Bild ziehen → Zone hinzufügen. Zone anklicken → löschen.' },
        { type:'section', label:'Einstellungen & Bewertung', key:'_sec_opts' },
        { key:'showZonesAfterCheck', label:'Nicht gefundene Zonen nach Korrektur anzeigen', type:'boolean' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const ui = api.utils.simpleQuestionCard(host, { title: config.blockTitle || 'Aufgabe', qBoxTitle: 'Aufgabe', question: config.prompt || '' });
      const { content, buttons, fb } = ui;

      if(!config.src){
        const ph = document.createElement('div');
        ph.style.cssText = 'padding:2rem; text-align:center; color:var(--muted); border:1px dashed var(--line); border-radius:8px;';
        ph.textContent = '(Kein Bild gesetzt)';
        content.appendChild(ph);
        return {};
      }

      const stage = document.createElement('div');
      stage.style.cssText = 'position:relative; display:inline-block; max-width:100%; border-radius:8px; overflow:hidden; cursor:crosshair; user-select:none;';
      const img = document.createElement('img');
      img.src = config.src;
      img.alt = '';
      img.style.cssText = 'display:block; max-width:100%; height:auto; pointer-events:none;';
      stage.appendChild(img);

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:absolute; inset:0; pointer-events:none;';
      stage.appendChild(overlay);

      // clicks made by user: each entry: {x, y, dot}
      const clicks = [];
      const maxClicks = (config.zones || []).length;

      // Small counter under the image
      const counter = document.createElement('div');
      counter.style.cssText = 'font-size:0.82rem; color:var(--muted); margin:0.4rem 0 0.2rem;';
      function updateCounter(){
        counter.textContent = clicks.length + ' / ' + maxClicks + ' Markierungen gesetzt';
        // Visually indicate when max is reached
        stage.style.cursor = (clicks.length >= maxClicks) ? 'not-allowed' : 'crosshair';
      }

      stage.addEventListener('click', e => {
        if(stage.dataset.locked === '1') return;
        if(maxClicks === 0) return;
        if(clicks.length >= maxClicks) return;
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top)  / r.height;
        const dot = drawClick(x, y);
        clicks.push({x, y, dot});
        updateCounter();
      });

      function drawClick(x, y){
        const dot = document.createElement('div');
        dot.className = 'hotzone-click';
        // pointer-events:auto so the dot itself can capture clicks for removal
        dot.style.cssText = 'position:absolute; width:18px; height:18px; border-radius:50%; background:rgba(21,101,255,0.7); border:2px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,0.3); transform:translate(-50%,-50%); pointer-events:auto; cursor:pointer;';
        dot.style.left = (x * 100) + '%';
        dot.style.top  = (y * 100) + '%';
        dot.title = 'Klicken zum Entfernen';
        dot.addEventListener('click', ev => {
          if(stage.dataset.locked === '1') return;
          ev.stopPropagation(); // don't let it create a new dot
          const idx = clicks.findIndex(c => c.dot === dot);
          if(idx >= 0){ clicks.splice(idx, 1); dot.remove(); updateCounter(); }
        });
        overlay.appendChild(dot);
        return dot;
      }

      content.appendChild(stage);
      content.appendChild(counter);
      updateCounter();

      const checkBtn = document.createElement('button'); checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary'; checkBtn.textContent = 'Korrektur';
      const resetBtn = document.createElement('button'); resetBtn.type = 'button'; resetBtn.className = 'btn btn-secondary'; resetBtn.textContent = 'Zurücksetzen';
      buttons.appendChild(checkBtn); buttons.appendChild(resetBtn);

      function pointInZone(p, z){
        return p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h;
      }

      function grade(){
        const zones = config.zones || [];
        if(zones.length === 0){ fb.neutral('Keine Hotzonen konfiguriert.'); return; }
        // No mark placed yet: prompt instead of recording a 0.
        if(clicks.length === 0){ fb.bad('Bitte mindestens eine Stelle im Bild markieren.'); return; }
        const found = zones.map(z => clicks.some(c => pointInZone(c, z)));
        const correct = found.filter(Boolean).length;
        const misclicks = clicks.filter(c => !zones.some(z => pointInZone(c, z))).length;
        // Mark zones (overlay)
        overlay.querySelectorAll('.hotzone-feedback').forEach(n => n.remove());
        zones.forEach((z, i) => {
          const box = document.createElement('div');
          box.className = 'hotzone-feedback';
          box.style.cssText = 'position:absolute; border-radius:4px; pointer-events:none;';
          box.style.left   = (z.x * 100) + '%';
          box.style.top    = (z.y * 100) + '%';
          box.style.width  = (z.w * 100) + '%';
          box.style.height = (z.h * 100) + '%';
          if(found[i]){
            box.style.border = '3px solid var(--accent-dark, #84bf66)';
            box.style.background = 'rgba(132,191,102,0.15)';
          } else if(config.showZonesAfterCheck !== false){
            box.style.border = '3px dashed var(--danger, #b42318)';
            box.style.background = 'rgba(180,35,24,0.08)';
          }
          overlay.appendChild(box);
        });
        stage.dataset.locked = '1';
        stage.style.cursor = 'default';
        const ratio = correct / zones.length;
        const pts = Math.round(ratio * (config.maxPoints || 1) * 100) / 100;
        api.reportScore(pts);
        if(correct === zones.length && misclicks === 0){
          fb.ok('Alle ' + zones.length + ' Zonen gefunden.');
        } else if(correct === zones.length){
          fb.bad(correct + '/' + zones.length + ' Zonen gefunden, aber ' + misclicks + ' Fehlklick(s).');
        } else {
          fb.bad(correct + ' von ' + zones.length + ' Zonen gefunden' + (misclicks ? ' (' + misclicks + ' Fehlklick(s))' : '') + '.');
        }
      }
      function reset(){
        clicks.length = 0;
        overlay.innerHTML = '';
        stage.dataset.locked = '';
        updateCounter();
        fb.neutral('Zurückgesetzt. Bitte neu klicken.');
      }
      checkBtn.addEventListener('click', grade);
      resetBtn.addEventListener('click', reset);

      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; flex-direction:column; height:100%; padding:0.4rem; box-sizing:border-box; gap:0.3rem;';
      const tag = document.createElement('div');
      tag.textContent = '◳  Hotzone';
      tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700;';
      wrap.appendChild(tag);
      if(config.prompt){
        const q = document.createElement('div');
        q.textContent = config.prompt;
        q.style.cssText = 'color:#003b5c; font-weight:700; font-size:0.82rem;';
        wrap.appendChild(q);
      }
      if(!config.src){
        const ph = document.createElement('div');
        ph.style.cssText = 'flex:1; display:flex; align-items:center; justify-content:center; color:#888; font-style:italic; border:1px dashed #d8e0e6; border-radius:6px;';
        ph.textContent = '(Kein Bild)';
        wrap.appendChild(ph);
        host.appendChild(wrap); return;
      }
      const stage = document.createElement('div');
      stage.style.cssText = 'position:relative; flex:1; min-height:0; overflow:hidden; border-radius:6px;';
      const img = document.createElement('img');
      img.src = config.src;
      img.style.cssText = 'width:100%; height:100%; object-fit:contain; display:block;';
      stage.appendChild(img);
      (config.zones || []).forEach(z => {
        const r = document.createElement('div');
        r.style.cssText = 'position:absolute; border:2px solid #1565ff; background:rgba(21,101,255,0.18); border-radius:3px;';
        r.style.left   = (z.x * 100) + '%';
        r.style.top    = (z.y * 100) + '%';
        r.style.width  = (z.w * 100) + '%';
        r.style.height = (z.h * 100) + '%';
        stage.appendChild(r);
      });
      wrap.appendChild(stage);
      const hint = document.createElement('div');
      hint.style.cssText = 'font-size:0.72rem; color:#5d6872;';
      hint.textContent = (config.zones || []).length + ' Zone(n) markiert';
      wrap.appendChild(hint);
      host.appendChild(wrap);
    }
  });
})();
