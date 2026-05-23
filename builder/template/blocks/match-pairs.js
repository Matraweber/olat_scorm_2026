(function(){
  'use strict';
  Blocks.register('match-pairs', {
    label: 'Zuordnung (Drag & Drop)',
    description: 'Linke Begriffe per Drag-and-Drop mit den richtigen rechten verbinden.',
    category: 'Frage',
    icon: '⇄',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '', preset: 'custom',
        mode: 'pairs',
        question: '', pairs: [],
        categories: [], items: [],
        imgHeight: 70, shuffle: true, maxPoints: 1
      };
    },
    summary(cfg){
      if(cfg.mode === 'categorize'){
        return ((cfg.categories || []).length) + ' Kategorien, ' + ((cfg.items || []).length) + ' Begriffe';
      }
      return ((cfg.pairs || []).length) + ' Paare';
    },
    validate(cfg){
      if(cfg.preset && cfg.preset !== 'custom') return [];
      const w = [];
      if(cfg.mode === 'categorize'){
        const cats = cfg.categories || [];
        const items = cfg.items || [];
        if(cats.length < 2) w.push('Mindestens zwei Kategorien erforderlich.');
        if(items.length < 2) w.push('Mindestens zwei Begriffe erforderlich.');
        const ids = new Set(cats.map(c => c.id));
        if(items.some(i => !ids.has(i.categoryId))) w.push('Mindestens ein Begriff hat keine gültige Kategorie.');
        return w;
      }
      if(!Array.isArray(cfg.pairs) || cfg.pairs.length < 2) w.push('Mindestens zwei Paare erforderlich.');
      else if(cfg.pairs.some(p => !p.left || !p.right)) w.push('Mindestens ein Paar hat eine leere Seite.');
      return w;
    },
    previewConfig(){
      return {
        blockTitle: '', preset: 'custom',
        question: 'Ordnen Sie die Hauptstädte den Ländern zu.',
        pairs: [
          { left: 'Deutschland', right: 'Berlin' },
          { left: 'Frankreich',  right: 'Paris'  },
          { left: 'Italien',     right: 'Rom'    }
        ],
        imgHeight: 70, shuffle: true, maxPoints: 3
      };
    },
    builderSchema(){
      const isCustom = c => (c.preset || 'custom') === 'custom';
      const isPairs  = c => isCustom(c) && (c.mode || 'pairs') === 'pairs';
      const isCat    = c => isCustom(c) && c.mode === 'categorize';
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Zuordnung' },
        { key:'preset', label:'Vorlage', type:'select', options:[
          {value:'custom',        label:'Manuell (leer)'},
          {value:'chemistry',     label:'Beispiel: Chemie, Elemente & Symbole'},
          {value:'units',         label:'Beispiel: Physik, Einheiten zuordnen'},
          {value:'number-bases',  label:'Beispiel: Informatik, Zahlensysteme'},
          {value:'math-symbols',  label:'Beispiel: Mathematik, Symbole & Bedeutungen'},
          {value:'animals',       label:'Beispiel: Biologie, Tiere nach Klasse (Kategorisierung)'},
          {value:'states',        label:'Beispiel: Chemie, Aggregatzustaende (Kategorisierung)'}
        ], help:'Beispiele zeigen typische Zuordnungsaufgaben. Bei „Manuell" eigene Daten eingeben.' },
        { type:'action', label:'↺ Zurücksetzen', action:'reset', showIf: isCustom },

        { type:'section', label:'Modus', key:'_sec_mode', showIf: isCustom },
        { key:'mode', label:'Zuordnungs-Modus', type:'select', showIf: isCustom, options:[
          {value:'pairs',      label:'1 zu 1 (jeder Begriff hat genau einen Partner)'},
          {value:'categorize', label:'Kategorisierung (mehrere Begriffe pro Kategorie)'}
        ]},

        // Question
        { type:'section', label:'Frage', key:'_sec_q', showIf: isCustom },
        { key:'question', label:'Aufgabentext', type:'math-textarea', rows:2, showIf: isCustom },

        // Pairs (1:1 mode)
        { type:'section', label:'Paare  (links ↔ rechts)', key:'_sec_pairs', showIf: isPairs },
        { key:'pairs', label:'Paare', type:'list', itemLabel:'Paar',
          showIf: isPairs,
          itemSummary: item => {
            const l = (item.left  || (item.leftImg  ? '(Bild)' : '')).slice(0, 35) || '…';
            const r = (item.right || (item.rightImg ? '(Bild)' : '')).slice(0, 35) || '…';
            return l + '  ↔  ' + r;
          },
          itemSchema:[
            { type:'section', label:'Linke Seite',   key:'_sec_left'  },
            { key:'left',    label:'Text',  type:'text',  fullWidth:true },
            { key:'leftImg', label:'Bild',  type:'image', fullWidth:true },
            { type:'section', label:'Rechte Seite',  key:'_sec_right' },
            { key:'right',    label:'Text',  type:'text',  fullWidth:true },
            { key:'rightImg', label:'Bild',  type:'image', fullWidth:true }
          ]},

        // Categorization (n:1 mode)
        { type:'section', label:'Kategorien', key:'_sec_cats', showIf: isCat },
        { key:'categories', label:'Kategorien', type:'list', itemLabel:'Kategorie',
          showIf: isCat,
          itemSummary: item => (item.label || '...'),
          itemSchema:[
            { key:'id',    label:'Interne ID', type:'text', placeholder:'c1' },
            { key:'label', label:'Anzeige-Name', type:'text', placeholder:'z. B. Säugetiere' },
            { key:'image', label:'Bild (optional)', type:'image', fullWidth:true }
          ]},
        { type:'section', label:'Begriffe', key:'_sec_items', showIf: isCat },
        { key:'items', label:'Begriffe', type:'list', itemLabel:'Begriff',
          showIf: isCat,
          itemSummary: item => (item.text || (item.image ? '(Bild)' : '...')) + '  ->  ' + (item.categoryId || '?'),
          itemSchema:[
            { key:'text',       label:'Text', type:'text', placeholder:'z. B. Hund' },
            { key:'image',      label:'Bild (optional)', type:'image', fullWidth:true },
            { key:'categoryId', label:'Zugehörige Kategorie-ID', type:'text', placeholder:'c1' }
          ]},

        // Settings
        { type:'section', label:'Einstellungen', key:'_sec_opts' },
        { key:'imgHeight', label:'Bild-Höhe in px', type:'number', step:10, min:20, max:400,
          help:'Maximale Höhe für alle Bilder.' },
        { key:'shuffle',   label:'Reihenfolge mischen', type:'boolean' },
        // Scoring
        { type:'section', label:'Bewertung', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte (gesamt)', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const activeConfig = matchPresetConfig(config);
      if(activeConfig.mode === 'categorize'){
        return mountCategorize(host, activeConfig, api);
      }
      const imgH = Number(activeConfig.imgHeight) || 70;

      const card = document.createElement('section');
      card.className = 'section-card block-question';
      const h = document.createElement('h3'); h.textContent = activeConfig.blockTitle || 'Aufgabe'; card.appendChild(h);
      if(activeConfig.question && String(activeConfig.question).trim() !== ''){
        const qBox = document.createElement('div'); qBox.className = 'formula-box'; qBox.style.marginBottom = '1rem';
        const qBoxTitle = document.createElement('div'); qBoxTitle.className = 'formula-title'; qBoxTitle.textContent = 'Frage';
        qBox.appendChild(qBoxTitle);
        const qText = document.createElement('div'); qText.className = 'formula-text'; qText.textContent = activeConfig.question;
        qBox.appendChild(qText);
        card.appendChild(qBox);
      }

      const pairs = (activeConfig.pairs || []).filter(p => p && (p.left || p.leftImg || p.right || p.rightImg));
      const lefts  = pairs.map((p, i) => ({ id:'L'+i, text:p.left||'',  img:p.leftImg||''  }));
      const rights = pairs.map((p, i) => ({ id:'R'+i, text:p.right||'', img:p.rightImg||'', correctLeftId:'L'+i }));
      const rightOrder = activeConfig.shuffle ? window.BlockUtils.shuffle(rights.slice()) : rights.slice();

      const grid = document.createElement('div');
      grid.className = 'match-grid';
      const colL = document.createElement('div'); colL.className = 'match-col match-col-left';
      const colR = document.createElement('div'); colR.className = 'match-col match-col-right';
      grid.appendChild(colL); grid.appendChild(colR);
      card.appendChild(grid);

      let currentMap = Object.create(null);
      let selectedRightId = null;
      let selectedLeftId = null;
      const leftEls = {}, rightEls = {};

      /** Render a cell that may contain an image, text, or both */
      function makeContent(text, img){
        const wrap = document.createElement('div');
        wrap.className = 'match-content';
        if(img){
          const imgEl = document.createElement('img');
          imgEl.src = img; imgEl.alt = text || '';
          imgEl.style.cssText = 'max-height:' + imgH + 'px; max-width:100%; border-radius:6px; display:block; margin:0 auto;';
          wrap.appendChild(imgEl);
        }
        if(text){
          const span = document.createElement('span'); span.textContent = text;
          wrap.appendChild(span);
        }
        return wrap;
      }

      /* ---- Left column ---- */
      lefts.forEach(L => {
        const cell = document.createElement('div');
        cell.className = 'match-cell match-cell-left';
        cell.dataset.id = L.id;

        const textWrap = document.createElement('div');
        textWrap.className = 'match-text';
        textWrap.appendChild(makeContent(L.text, L.img));

        const slot = document.createElement('span');
        slot.className = 'match-slot';
        slot.dataset.empty = 'true';
        slot.textContent = 'Hier ablegen';

        cell.appendChild(textWrap);
        cell.appendChild(slot);

        cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('over'); });
        cell.addEventListener('dragleave', () => cell.classList.remove('over'));
        cell.addEventListener('drop', e => {
          e.preventDefault();
          cell.classList.remove('over');
          const rid      = e.dataTransfer.getData('text/match-right');
          const fromLeft = e.dataTransfer.getData('text/from-left');
          if(fromLeft && fromLeft === L.id) return;
          if(rid) assign(L.id, rid);
        });
        cell.addEventListener('click', () => {
          if(selectedRightId){ assign(L.id, selectedRightId); selectedRightId = null; clearSelection(); }
          else { selectedLeftId = (selectedLeftId === L.id ? null : L.id); updateSelection(); }
        });
        colL.appendChild(cell);
        leftEls[L.id] = cell;
      });

      /* ---- Right column drop zone (drag items back) ---- */
      colR.addEventListener('dragover', e => { e.preventDefault(); colR.classList.add('over'); });
      colR.addEventListener('dragleave', e => {
        if(!colR.contains(e.relatedTarget)) colR.classList.remove('over');
      });
      colR.addEventListener('drop', e => {
        e.preventDefault();
        colR.classList.remove('over');
        const fromLeft = e.dataTransfer.getData('text/from-left');
        if(fromLeft) unassign(fromLeft);
      });

      /* ---- Right column items ---- */
      rightOrder.forEach(R => {
        const cell = document.createElement('div');
        cell.className = 'match-cell match-cell-right';
        cell.dataset.id = R.id;
        cell.draggable = true;
        cell.appendChild(makeContent(R.text, R.img));
        cell.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/match-right', R.id);
          cell.classList.add('dragging');
        });
        cell.addEventListener('dragend', () => cell.classList.remove('dragging'));
        cell.addEventListener('click', () => {
          if(selectedLeftId){ assign(selectedLeftId, R.id); selectedLeftId = null; clearSelection(); }
          else { selectedRightId = (selectedRightId === R.id ? null : R.id); updateSelection(); }
        });
        colR.appendChild(cell);
        rightEls[R.id] = cell;
      });

      /* ---- Assignment logic ---- */
      function assign(leftId, rightId){
        Object.keys(currentMap).forEach(lid => { if(currentMap[lid] === rightId) delete currentMap[lid]; });
        currentMap[leftId] = rightId;
        renderAssignments();
      }
      function unassign(leftId){ delete currentMap[leftId]; renderAssignments(); }

      function renderAssignments(){
        Object.values(rightEls).forEach(c => c.classList.remove('used'));
        Object.values(leftEls).forEach(c => {
          const slot = c.querySelector('.match-slot');
          slot.textContent = 'Hier ablegen';
          slot.dataset.empty = 'true';
          slot.draggable = false;
          slot.ondragstart = null;
          slot.onclick = null;
          slot.title = '';
        });
        Object.entries(currentMap).forEach(([lid, rid]) => {
          if(rightEls[rid]) rightEls[rid].classList.add('used');
          const slot = leftEls[lid].querySelector('.match-slot');
          const R = rights.find(r => r.id === rid);
          slot.innerHTML = '';
          if(R) slot.appendChild(makeContent(R.text, R.img));
          slot.dataset.empty = 'false';
          slot.draggable = true;
          slot.ondragstart = (e) => {
            e.stopPropagation();
            e.dataTransfer.setData('text/match-right', rid);
            e.dataTransfer.setData('text/from-left', lid);
          };
          slot.onclick = (e) => { e.stopPropagation(); unassign(lid); };
          slot.title = 'Klicken oder zurückziehen zum Entfernen';
        });
      }

      function updateSelection(){
        Object.values(leftEls).forEach(c => c.classList.toggle('selected', c.dataset.id === selectedLeftId));
        Object.values(rightEls).forEach(c => c.classList.toggle('selected', c.dataset.id === selectedRightId));
      }
      function clearSelection(){ selectedLeftId = null; selectedRightId = null; updateSelection(); }

      /* ---- Buttons ---- */
      const btnRow = document.createElement('div');
      btnRow.className = 'button-cluster';
      
      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary'; checkBtn.textContent = 'Korrektur';
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button'; resetBtn.className = 'btn btn-secondary'; resetBtn.textContent = 'Zurücksetzen';
      btnRow.appendChild(checkBtn); btnRow.appendChild(resetBtn);
      card.appendChild(btnRow);

      const fb = api.utils.feedbackBox(card);

      checkBtn.addEventListener('click', () => {
        let correct = 0;
        lefts.forEach(L => {
          const rid = currentMap[L.id];
          const expectedR = rights.find(r => r.correctLeftId === L.id);
          const ok = rid && expectedR && rid === expectedR.id;
          leftEls[L.id].classList.toggle('correct',   !!ok);
          leftEls[L.id].classList.toggle('incorrect', !ok && !!rid);
          if(ok) correct++;
        });
        const ratio = correct / Math.max(1, lefts.length);
        api.reportScore(Math.round(ratio * (activeConfig.maxPoints || 1) * 100) / 100);
        if(correct === lefts.length) fb.ok('Alle Zuordnungen korrekt.');
        else fb.bad(correct + ' von ' + lefts.length + ' korrekt.');
      });

      resetBtn.addEventListener('click', () => {
        currentMap = Object.create(null);
        clearSelection();
        Object.values(leftEls).forEach(c => c.classList.remove('correct','incorrect'));
        renderAssignments();
        fb.neutral('Zurückgesetzt.');
      });

      host.appendChild(card);
      renderAssignments();
      api.initScore(activeConfig.maxPoints || 1);
      return {};
    },

    preview(host, config){
      const activeConfig = matchPresetConfig(config);
      const imgH = Math.min(Number(activeConfig.imgHeight) || 70, 50); // smaller in mini-preview
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.5rem 0.7rem; font-size:0.8rem; height:100%; overflow:hidden; display:flex; flex-direction:column;';
      const tag = document.createElement('div');
      tag.textContent = '⇄  Drag & Drop-Zuordnung';
      tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700; margin-bottom:0.3rem;';
      wrap.appendChild(tag);
      const q = document.createElement('div'); q.textContent = activeConfig.question || '';
      q.style.cssText = 'color:#003b5c; font-weight:700; margin-bottom:0.4rem; font-size:0.82rem;';
      wrap.appendChild(q);

      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid; grid-template-columns:1fr 20px 1fr; gap:0.2rem 0.35rem;';

      (activeConfig.pairs || []).slice(0, 4).forEach(p => {
        const mkSide = (text, img) => {
          const d = document.createElement('div');
          d.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:0.15rem; padding:0.2rem 0.4rem; background:#f5f8fa; border:1px solid #d8e0e6; border-radius:6px; overflow:hidden;';
          if(img){
            const i = document.createElement('img'); i.src = img; i.alt = text||'';
            i.style.cssText = 'max-height:' + imgH + 'px; max-width:100%; border-radius:3px; display:block;';
            d.appendChild(i);
          }
          if(text){ const s = document.createElement('span'); s.textContent = text; s.style.cssText='font-size:0.75rem;color:#003b5c;font-weight:700;text-align:center;'; d.appendChild(s); }
          return d;
        };
        const l = mkSide(p.left, p.leftImg);
        const arr = document.createElement('div'); arr.textContent='↔'; arr.style.cssText='text-align:center;color:#84bf66;font-weight:700;line-height:2;font-size:0.7rem;';
        const r = mkSide(p.right, p.rightImg);
        r.style.background = '#a1d884'; r.style.borderColor = '#84bf66';
        grid.appendChild(l); grid.appendChild(arr); grid.appendChild(r);
      });
      wrap.appendChild(grid);
      host.appendChild(wrap);
    }
  });


  function matchPresetConfig(config){
    if(!config || !config.preset || config.preset === 'custom') return config || {};
    const base = Object.assign({}, config);
    const pairs = {
      chemistry: {
        question: 'Ordne die Elementsymbole den Elementen zu.',
        pairs: [
          { left:'Wasserstoff', right:'H' },
          { left:'Sauerstoff', right:'O' },
          { left:'Kohlenstoff', right:'C' },
          { left:'Natrium', right:'Na' }
        ]
      },
      units: {
        question: 'Ordne die Einheit der passenden Größe zu.',
        pairs: [
          { left:'Stromstärke', right:'Ampere (A)' },
          { left:'Spannung', right:'Volt (V)' },
          { left:'Widerstand', right:'Ohm (Ω)' },
          { left:'Leistung', right:'Watt (W)' }
        ]
      },
      'number-bases': {
        question: 'Ordne die Schreibweise dem Zahlensystem zu.',
        pairs: [
          { left:'1010₂', right:'Binärsystem' },
          { left:'A₁₆', right:'Hexadezimalsystem' },
          { left:'10₁₀', right:'Dezimalsystem' },
          { left:'17₈', right:'Oktalsystem' }
        ]
      },
      'math-symbols': {
        question: 'Ordne die mathematischen Zeichen ihrer Bedeutung zu.',
        pairs: [
          { left:'∑', right:'Summe' },
          { left:'√', right:'Wurzel' },
          { left:'≈', right:'ungefähr gleich' },
          { left:'∞', right:'unendlich' }
        ]
      },
      animals: {
        mode: 'categorize',
        question: 'Ordnen Sie die Tiere ihren Klassen zu.',
        categories: [
          { id:'mammals', label:'Säugetiere' },
          { id:'birds',   label:'Vögel' },
          { id:'fish',    label:'Fische' }
        ],
        items: [
          { text:'Hund',  categoryId:'mammals' },
          { text:'Katze', categoryId:'mammals' },
          { text:'Adler', categoryId:'birds' },
          { text:'Spatz', categoryId:'birds' },
          { text:'Hai',   categoryId:'fish' },
          { text:'Lachs', categoryId:'fish' }
        ],
        maxPoints: 6
      },
      states: {
        mode: 'categorize',
        question: 'Ordnen Sie die Stoffe ihrem Aggregatzustand zu.',
        categories: [
          { id:'solid',  label:'Fest' },
          { id:'liquid', label:'Fluessig' },
          { id:'gas',    label:'Gasfoermig' }
        ],
        items: [
          { text:'Eisen',       categoryId:'solid'  },
          { text:'Granit',      categoryId:'solid'  },
          { text:'Wasser',      categoryId:'liquid' },
          { text:'Quecksilber', categoryId:'liquid' },
          { text:'Sauerstoff',  categoryId:'gas'    },
          { text:'Helium',      categoryId:'gas'    }
        ],
        maxPoints: 6
      }
    }[config.preset];
    return pairs ? Object.assign(base, pairs) : config;
  }
  // Mount for categorization mode (n-to-1 drag&drop).
  function mountCategorize(host, cfg, api){
    const imgH = Number(cfg.imgHeight) || 70;
    const card = document.createElement('section');
    card.className = 'section-card block-question';
    const h = document.createElement('h3'); h.textContent = cfg.blockTitle || 'Kategorisierung'; card.appendChild(h);
    if(cfg.question && String(cfg.question).trim() !== ''){
      const qBox = document.createElement('div'); qBox.className = 'formula-box'; qBox.style.marginBottom = '1rem';
      const qBoxTitle = document.createElement('div'); qBoxTitle.className = 'formula-title'; qBoxTitle.textContent = 'Frage';
      qBox.appendChild(qBoxTitle);
      const qText = document.createElement('div'); qText.className = 'formula-text'; qText.textContent = cfg.question;
      qBox.appendChild(qText);
      card.appendChild(qBox);
    }
    const cats  = (cfg.categories || []).filter(c => c && c.id);
    const items = (cfg.items || []).filter(it => it && (it.text || it.image));
    if(cats.length === 0 || items.length === 0){
      const ph = document.createElement('div');
      ph.style.cssText = 'color:var(--muted, #6a7986); font-style:italic;';
      ph.textContent = '(Keine Kategorien oder Begriffe definiert.)';
      card.appendChild(ph);
      host.appendChild(card);
      api.initScore(Number(cfg.maxPoints) || 1);
      return {};
    }

    const wrap = document.createElement('div');
    wrap.className = 'cat-wrap';
    card.appendChild(wrap);

    const pool = document.createElement('div');
    pool.className = 'cat-pool';
    const poolLabel = document.createElement('div');
    poolLabel.className = 'cat-pool-label';
    poolLabel.textContent = 'Begriffe';
    pool.appendChild(poolLabel);
    const poolList = document.createElement('div');
    poolList.className = 'cat-pool-list';
    pool.appendChild(poolList);
    wrap.appendChild(pool);

    const dropArea = document.createElement('div');
    dropArea.className = 'cat-drops';
    wrap.appendChild(dropArea);

    const dropZones = {};
    cats.forEach(c => {
      const zone = document.createElement('div');
      zone.className = 'cat-zone';
      zone.dataset.categoryId = c.id;
      const lbl = document.createElement('div');
      lbl.className = 'cat-zone-label';
      if(c.image){
        const img = document.createElement('img');
        img.src = c.image; img.alt = c.label || c.id;
        img.style.cssText = 'max-height:' + Math.round(imgH*0.6) + 'px; vertical-align:middle; margin-right:0.4rem;';
        lbl.appendChild(img);
      }
      const txt = document.createElement('span');
      txt.textContent = c.label || c.id;
      lbl.appendChild(txt);
      zone.appendChild(lbl);
      const list = document.createElement('div');
      list.className = 'cat-zone-list';
      zone.appendChild(list);
      dropArea.appendChild(zone);
      dropZones[c.id] = { zone, list };
    });

    const assigned = items.map(() => null);
    const itemOrder = items.map((_, i) => i);
    if(cfg.shuffle !== false) window.BlockUtils.shuffle(itemOrder);

    const chips = items.map((it, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'cat-chip';
      chip.draggable = true;
      chip.dataset.itemIdx = String(idx);
      if(it.image){
        const img = document.createElement('img');
        img.src = it.image; img.alt = it.text || '';
        img.style.cssText = 'max-height:' + imgH + 'px; vertical-align:middle; margin-right:0.4rem;';
        chip.appendChild(img);
      }
      if(it.text){
        const txt = document.createElement('span');
        txt.textContent = it.text;
        chip.appendChild(txt);
      }
      chip.addEventListener('dragstart', e => {
        chip.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', String(idx)); } catch(_){}
      });
      chip.addEventListener('dragend', () => chip.classList.remove('is-dragging'));
      chip.addEventListener('click', () => {
        if(assigned[idx] != null){
          assigned[idx] = null;
          poolList.appendChild(chip);
        }
      });
      return chip;
    });
    itemOrder.forEach(i => poolList.appendChild(chips[i]));

    function attachDrop(target, categoryId){
      target.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        target.classList.add('is-drop-target');
      });
      target.addEventListener('dragleave', () => target.classList.remove('is-drop-target'));
      target.addEventListener('drop', e => {
        e.preventDefault();
        target.classList.remove('is-drop-target');
        const itemIdx = Number(e.dataTransfer.getData('text/plain'));
        if(Number.isNaN(itemIdx) || !chips[itemIdx]) return;
        assigned[itemIdx] = categoryId;
        if(categoryId == null) poolList.appendChild(chips[itemIdx]);
        else dropZones[categoryId].list.appendChild(chips[itemIdx]);
      });
    }
    cats.forEach(c => attachDrop(dropZones[c.id].zone, c.id));
    attachDrop(pool, null);

    const btnRow = document.createElement('div');
    btnRow.className = 'button-cluster';
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = 'Korrektur';
    btnRow.appendChild(checkBtn);
    card.appendChild(btnRow);
    const fb = api.utils.feedbackBox(card);
    host.appendChild(card);

    checkBtn.addEventListener('click', () => {
      let correct = 0;
      chips.forEach((chip, idx) => {
        const expected = items[idx].categoryId;
        const actual   = assigned[idx];
        chip.classList.remove('cat-chip-correct', 'cat-chip-wrong');
        if(actual === expected){ chip.classList.add('cat-chip-correct'); correct++; }
        else                    { chip.classList.add('cat-chip-wrong'); }
      });
      const maxPoints = Number(cfg.maxPoints) || items.length;
      const pts = Math.round((correct / items.length) * maxPoints * 100) / 100;
      if(correct === items.length){
        fb.ok('Alle ' + items.length + ' Begriffe richtig zugeordnet. ' + maxPoints + ' / ' + maxPoints + ' Punkte.');
      } else {
        fb.bad(correct + ' von ' + items.length + ' richtig. ' + pts + ' / ' + maxPoints + ' Punkte.');
      }
      api.reportScore(pts);
    });

    api.initScore(Number(cfg.maxPoints) || 1);
    return {};
  }
})();
