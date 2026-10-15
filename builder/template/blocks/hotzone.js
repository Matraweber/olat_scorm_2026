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
    labelKey: 'block.hotzone.label',
    description: 'Bild mit markierten Bereichen. Lernende klicken in die richtigen Zonen.',
    descKey: 'block.hotzone.description',
    category: 'Frage',
    categoryKey: 'block.category.question',
    icon: '◳',
    graded: true,
    defaultConfig(locale){
      const u = window.BlockUtils || {};
      const loc = locale || (u.getLocale && u.getLocale()) || 'de';
      const en = loc === 'en';
      return {
        blockTitle: '',
        src: '', zones: [],
        prompt: en ? 'Click on all marked areas.' : 'Klicken Sie auf alle markierten Bereiche.',
        showZonesAfterCheck: true,
        maxPoints: 1
      };
    },
    previewConfig(){
      const u = window.BlockUtils || {};
      const t = (typeof u.t === 'function') ? u.t : (k => k);
      return {
        blockTitle: '',
        src: STOCK_LANDSCAPE_SVG,
        zones: [{ x: 0.41, y: 0.425, w: 0.19, h: 0.317 }],
        prompt: t('block.hotzone.preview.prompt'),
        showZonesAfterCheck: true,
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'blockTitle', label:'Überschrift', labelKey:'block.hotzone.field.blockTitle.label', type:'text', placeholder:'Hotzone', placeholderKey:'block.hotzone.field.blockTitle.placeholder' },
        { type:'section', label:'Frage', labelKey:'block.hotzone.field._sec_q.label', key:'_sec_q' },
        { key:'prompt', label:'Aufgabentext', labelKey:'block.hotzone.field.prompt.label', type:'math-textarea', rows:2 },
        { type:'section', label:'Bild & Zonen', labelKey:'block.hotzone.field._sec_zones.label', key:'_sec_zones' },
        { key:'src',   label:'Bild', labelKey:'block.hotzone.field.src.label', type:'image',
          help:'Bild hochladen oder URL eingeben.', helpKey:'block.hotzone.field.src.help' },
        { key:'zones', label:'Hotzonen einzeichnen', labelKey:'block.hotzone.field.zones.label', type:'zone-editor',
          help:'Rechteck auf dem Bild ziehen → Zone hinzufügen. Zone anklicken → löschen.', helpKey:'block.hotzone.field.zones.help' },
        { type:'section', label:'Einstellungen & Bewertung', labelKey:'block.hotzone.field._sec_opts.label', key:'_sec_opts' },
        { key:'showZonesAfterCheck', label:'Nicht gefundene Zonen nach Korrektur anzeigen', labelKey:'block.hotzone.field.showZonesAfterCheck.label', type:'boolean' },
        { key:'maxPoints', label:'Punkte', labelKey:'block.hotzone.field.maxPoints.label', type:'number', step:1, min:1 },
        // Wrong = a click outside every zone.
        ...window.BlockUtils.penaltySchemaFields({
          help:'Jeder Klick außerhalb aller Zonen zieht Punkte ab; die Gesamtpunktzahl fällt nie unter 0.',
          helpKey:'block.hotzone.field.penalizeWrong.help' })
      ];
    },
    mount(host, config, api){
      const t = api.utils.t;
      const l = api.utils.l;
      const titleText = l(config.blockTitle) || api.utils.t('common.task');
      const promptText = l(config.prompt) || '';
      const ui = api.utils.simpleQuestionCard(host, { title: titleText, qBoxTitle: api.utils.t('common.task'), question: promptText });
      const { content, buttons, fb } = ui;

      if(!config.src){
        const ph = document.createElement('div');
        ph.style.cssText = 'padding:2rem; text-align:center; color:var(--muted); border:1px dashed var(--line); border-radius:8px;';
        ph.textContent = t('block.hotzone.noImage');
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
        counter.textContent = t('block.hotzone.counter', { count: clicks.length, max: maxClicks });
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
        dot.title = t('block.hotzone.removeMark');
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

      const checkBtn = document.createElement('button'); checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary'; checkBtn.textContent = t('common.check');
      const resetBtn = document.createElement('button'); resetBtn.type = 'button'; resetBtn.className = 'btn btn-secondary'; resetBtn.textContent = t('block.hotzone.reset');
      buttons.appendChild(checkBtn); buttons.appendChild(resetBtn);

      function pointInZone(p, z){
        return p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h;
      }

      function grade(){
        const zones = config.zones || [];
        if(zones.length === 0){ fb.neutral(t('block.hotzone.noZonesConfigured')); return; }
        // No mark placed yet: prompt instead of recording a 0.
        if(clicks.length === 0){ fb.bad(t('block.hotzone.markAtLeastOne')); return; }
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
        // Each found zone earns a share; each click outside all zones can
        // deduct (penalizeWrong / penaltyPoints), never below 0.
        const maxPts = config.maxPoints || 1;
        const perZone = maxPts / zones.length;
        const BU = window.BlockUtils;
        const pts = BU.scoreWithPenalty(correct * perZone, misclicks, BU.penaltyPerWrong(config, perZone), maxPts);
        api.reportScore(pts);
        if(correct === zones.length && misclicks === 0){
          fb.ok(t('block.hotzone.allFound', { total: zones.length }));
        } else if(correct === zones.length){
          fb.bad(t('block.hotzone.allFoundWithMisclicks', { correct: correct, total: zones.length, misclicks: misclicks }));
        } else if(misclicks > 0){
          fb.bad(t('block.hotzone.partialWithMisclicks', { correct: correct, total: zones.length, misclicks: misclicks }));
        } else {
          fb.bad(t('block.hotzone.partial', { correct: correct, total: zones.length }));
        }
      }
      function reset(){
        clicks.length = 0;
        overlay.innerHTML = '';
        stage.dataset.locked = '';
        updateCounter();
        fb.neutral(t('block.hotzone.resetHint'));
      }
      checkBtn.addEventListener('click', grade);
      resetBtn.addEventListener('click', reset);

      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const t = (window.BlockUtils && window.BlockUtils.t) ? window.BlockUtils.t : function(k){ return k; };
      const l = (window.BlockUtils && window.BlockUtils.l) ? window.BlockUtils.l : function(v){ return v; };
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; flex-direction:column; height:100%; padding:0.4rem; box-sizing:border-box; gap:0.3rem;';
      const tag = document.createElement('div');
      tag.textContent = '◳  ' + t('block.hotzone.label');
      tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700;';
      wrap.appendChild(tag);
      const promptText = l(config.prompt);
      if(promptText){
        const q = document.createElement('div');
        q.textContent = promptText;
        q.style.cssText = 'color:#003b5c; font-weight:700; font-size:0.82rem;';
        wrap.appendChild(q);
      }
      if(!config.src){
        const ph = document.createElement('div');
        ph.style.cssText = 'flex:1; display:flex; align-items:center; justify-content:center; color:#888; font-style:italic; border:1px dashed #d8e0e6; border-radius:6px;';
        ph.textContent = t('block.hotzone.noImageShort');
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
      hint.textContent = t('block.hotzone.zonesMarked', { count: (config.zones || []).length });
      wrap.appendChild(hint);
      host.appendChild(wrap);
    }
  });
})();
