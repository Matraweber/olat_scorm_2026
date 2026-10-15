(function(){
  'use strict';
  Blocks.register('match-pairs', {
    label: 'Zuordnung (Drag & Drop)',
    labelKey: 'block.match-pairs.label',
    description: 'Begriffe paarweise verbinden oder in Kategorien einsortieren, per Ziehen oder Antippen.',
    descKey: 'block.match-pairs.description',
    category: 'Frage',
    categoryKey: 'block.category.question',
    icon: '⇄',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '', preset: 'custom',
        mode: 'pairs',
        question: '', pairs: [],
        categories: [], items: [],
        imgHeight: 70, shuffle: true, maxPoints: 1,
        poolSize: 0 // 0 = show all; >0 = sample this many for each round
      };
    },
    summary(cfg){
      const t = (window.BlockUtils && window.BlockUtils.t) ? window.BlockUtils.t : function(k, p, fb){ return fb; };
      if(cfg.mode === 'categorize'){
        return t('block.match-pairs.summary.categorize', {
          cats: (cfg.categories || []).length,
          items: (cfg.items || []).length
        });
      }
      return t('block.match-pairs.summary.pairs', { count: (cfg.pairs || []).length });
    },
    validate(cfg){
      if(cfg.preset && cfg.preset !== 'custom') return [];
      const t = (window.BlockUtils && window.BlockUtils.t) || (k => k);
      const w = [];
      if(cfg.mode === 'categorize'){
        const cats = cfg.categories || [];
        const items = cfg.items || [];
        if(cats.length < 2) w.push(t('block.match-pairs.validate.minTwoCategories'));
        if(items.length < 2) w.push(t('block.match-pairs.validate.minTwoItems'));
        const ids = new Set(cats.map(c => c.id));
        // categoryId may list several ids ("c1, c2"); every one must exist.
        if(items.some(i => { const l = String(i.categoryId || '').split(',').map(s => s.trim()).filter(Boolean); return !l.length || l.some(id => !ids.has(id)); }))
          w.push(t('block.match-pairs.validate.itemMissingCategory'));
        return w;
      }
      if(!Array.isArray(cfg.pairs) || cfg.pairs.length < 2) w.push(t('block.match-pairs.validate.minTwoPairs'));
      else if(cfg.pairs.some(p => !p.left || !p.right)) w.push(t('block.match-pairs.validate.pairEmptySide'));
      return w;
    },
    previewConfig(){
      const u = window.BlockUtils || {};
      const t = (typeof u.t === 'function') ? u.t : (k => k);
      const locale = (u.getLocale && u.getLocale()) || 'de';
      const en = locale === 'en';
      return {
        blockTitle: '', preset: 'custom',
        question: t('block.match-pairs.preview.defaultQuestion'),
        pairs: en
          ? [
              { left: 'Germany', right: 'Berlin' },
              { left: 'France',  right: 'Paris'  },
              { left: 'Italy',   right: 'Rome'   }
            ]
          : [
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
        { key:'blockTitle', label:'Überschrift', labelKey:'block.match-pairs.field.blockTitle.label',
          type:'text', placeholder:'Zuordnung', placeholderKey:'block.match-pairs.field.blockTitle.placeholder' },
        { key:'preset', label:'Vorlage', labelKey:'block.match-pairs.field.preset.label', type:'select', options:[
          {value:'custom',        label:'Manuell (leer)',                                        labelKey:'block.match-pairs.field.preset.option.custom'},
          {value:'chemistry',     label:'Beispiel: Chemie, Elemente & Symbole',                  labelKey:'block.match-pairs.field.preset.option.chemistry'},
          {value:'units',         label:'Beispiel: Physik, Einheiten zuordnen',                  labelKey:'block.match-pairs.field.preset.option.units'},
          {value:'number-bases',  label:'Beispiel: Informatik, Zahlensysteme',                   labelKey:'block.match-pairs.field.preset.option.number-bases'},
          {value:'math-symbols',  label:'Beispiel: Mathematik, Symbole & Bedeutungen',           labelKey:'block.match-pairs.field.preset.option.math-symbols'},
          {value:'animals',       label:'Beispiel: Biologie, Tiere nach Klasse (Kategorisierung)', labelKey:'block.match-pairs.field.preset.option.animals'},
          {value:'states',        label:'Beispiel: Chemie, Aggregatzustaende (Kategorisierung)',   labelKey:'block.match-pairs.field.preset.option.states'}
        ], help:'Beispiele zeigen typische Zuordnungsaufgaben. Bei „Manuell" eigene Daten eingeben.',
          helpKey:'block.match-pairs.field.preset.help' },
        { type:'action', label:'↺ Zurücksetzen', labelKey:'block.match-pairs.field.reset.label', action:'reset', showIf: isCustom },

        { type:'section', label:'Modus', labelKey:'block.match-pairs.field.sec_mode.label', key:'_sec_mode', showIf: isCustom },
        { key:'mode', label:'Zuordnungs-Modus', labelKey:'block.match-pairs.field.mode.label',
          type:'select', showIf: isCustom, options:[
          {value:'pairs',      label:'1 zu 1 (jeder Begriff hat genau einen Partner)',      labelKey:'block.match-pairs.field.mode.option.pairs'},
          {value:'categorize', label:'Kategorisierung (mehrere Elemente pro Kategorie)',    labelKey:'block.match-pairs.field.mode.option.categorize'}
        ]},

        // Question
        { type:'section', label:'Frage', labelKey:'block.match-pairs.field.sec_q.label', key:'_sec_q', showIf: isCustom },
        { key:'question', label:'Aufgabentext', labelKey:'block.match-pairs.field.question.label',
          type:'math-textarea', rows:2, showIf: isCustom },

        // Pairs (1:1 mode)
        { type:'section', label:'Paare  (links ↔ rechts)', labelKey:'block.match-pairs.field.sec_pairs.label', key:'_sec_pairs', showIf: isPairs },
        { key:'pairs', label:'Paare', labelKey:'block.match-pairs.field.pairs.label',
          type:'list', itemLabel:'Paar', itemLabelKey:'block.match-pairs.field.pairs.itemLabel',
          showIf: isPairs,
          itemSummary: item => {
            const l = (item.left  || (item.leftImg  ? '(Bild)' : '')).slice(0, 35) || '…';
            const r = (item.right || (item.rightImg ? '(Bild)' : '')).slice(0, 35) || '…';
            return l + '  ↔  ' + r;
          },
          itemSchema:[
            { type:'section', label:'Linke Seite', labelKey:'block.match-pairs.field.sec_left.label', key:'_sec_left'  },
            { key:'left',    label:'Text', labelKey:'block.match-pairs.field.pair.left.label', type:'text',  fullWidth:true },
            { key:'leftImg', label:'Bild', labelKey:'block.match-pairs.field.pair.leftImg.label', type:'image', fullWidth:true },
            { type:'section', label:'Rechte Seite', labelKey:'block.match-pairs.field.sec_right.label', key:'_sec_right' },
            { key:'right',    label:'Text', labelKey:'block.match-pairs.field.pair.right.label', type:'text',  fullWidth:true },
            { key:'rightImg', label:'Bild', labelKey:'block.match-pairs.field.pair.rightImg.label', type:'image', fullWidth:true }
          ]},

        // Categorization (n:1 mode)
        { type:'section', label:'Kategorien', labelKey:'block.match-pairs.field.sec_cats.label', key:'_sec_cats', showIf: isCat },
        { key:'categories', label:'Kategorien', labelKey:'block.match-pairs.field.categories.label',
          type:'list', itemLabel:'Kategorie', itemLabelKey:'block.match-pairs.field.categories.itemLabel',
          showIf: isCat,
          itemSummary: item => (item.label || '...'),
          itemSchema:[
            { key:'id',    label:'Interne ID', labelKey:'block.match-pairs.field.category.id.label',
              type:'text', placeholder:'c1', placeholderKey:'block.match-pairs.field.category.id.placeholder' },
            { key:'label', label:'Anzeige-Name', labelKey:'block.match-pairs.field.category.label.label',
              type:'text', placeholder:'z. B. Säugetiere', placeholderKey:'block.match-pairs.field.category.label.placeholder' },
            { key:'image', label:'Bild (optional)', labelKey:'block.match-pairs.field.category.image.label',
              type:'image', fullWidth:true }
          ]},
        { type:'section', label:'Elemente', labelKey:'block.match-pairs.field.sec_items.label', key:'_sec_items', showIf: isCat },
        { key:'items', label:'Elemente', labelKey:'block.match-pairs.field.items.label',
          type:'list', itemLabel:'Element', itemLabelKey:'block.match-pairs.field.items.itemLabel',
          showIf: isCat,
          itemSummary: item => (item.text || (item.image ? '(Bild)' : '...')) + '  ->  ' + (item.categoryId || '?'),
          itemSchema:[
            { key:'text',       label:'Text', labelKey:'block.match-pairs.field.item.text.label',
              type:'text', placeholder:'z. B. Hund', placeholderKey:'block.match-pairs.field.item.text.placeholder' },
            { key:'image',      label:'Bild (optional)', labelKey:'block.match-pairs.field.item.image.label',
              type:'image', fullWidth:true },
            { key:'categoryId', label:'Zugehörige Kategorie-ID(s)', labelKey:'block.match-pairs.field.item.categoryId.label',
              type:'text', placeholder:'c1', placeholderKey:'block.match-pairs.field.item.categoryId.placeholder',
              help:'Mehrere IDs mit Komma (z. B. c1, c2): Das Element erscheint dann einmal pro Kategorie. Gleich aussehende Elemente sind beim Zuordnen austauschbar.',
              helpKey:'block.match-pairs.field.item.categoryId.help' }
          ]},

        // Settings
        { type:'section', label:'Einstellungen', labelKey:'block.match-pairs.field.sec_opts.label', key:'_sec_opts' },
        { key:'imgHeight', label:'Bild-Höhe in px', labelKey:'block.match-pairs.field.imgHeight.label',
          type:'number', step:10, min:20, max:400,
          help:'Maximale Höhe für alle Bilder.', helpKey:'block.match-pairs.field.imgHeight.help' },
        { key:'shuffle',   label:'Reihenfolge mischen', labelKey:'block.match-pairs.field.shuffle.label',
          type:'boolean' },
        { key:'poolSize',  label:'Anzahl Aufgaben pro Durchlauf  (0 = alle)',
          labelKey:'block.match-pairs.field.poolSize.label',
          type:'number', step:1, min:0,
          help:'Bei 1:1: zufällige Auswahl von N Paaren aus dem Pool. Bei Kategorisierung: zufällige Auswahl von N Elementen (Kategorien bleiben gleich). Schaltet den „Neu generieren"-Button frei.',
          helpKey:'block.match-pairs.field.poolSize.help' },
        // Scoring
        { type:'section', label:'Bewertung', labelKey:'block.match-pairs.field.sec_score.label', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte (gesamt)', labelKey:'block.match-pairs.field.maxPoints.label',
          type:'number', step:1, min:1 },
        ...window.BlockUtils.regenSchemaFields()
      ];
    },
    mount(host, config, api){
      const activeConfig = matchPresetConfig(config);
      if(activeConfig.mode === 'categorize'){
        return mountCategorize(host, activeConfig, api);
      }
      const imgH = Number(activeConfig.imgHeight) || 70;
      const allPairs = (activeConfig.pairs || []).filter(p => p && (p.left || p.leftImg || p.right || p.rightImg));
      const poolSize = Math.max(0, Math.floor(Number(activeConfig.poolSize) || 0));
      const hasPool = poolSize > 0 && poolSize < allPairs.length;

      const card = document.createElement('section');
      card.className = 'section-card block-question';
      const h = document.createElement('h3');
      h.textContent = api.utils.l(activeConfig.blockTitle) || api.utils.t('block.match-pairs.defaultTitle');
      card.appendChild(h);
      const questionText = api.utils.l(activeConfig.question);
      if(questionText && String(questionText).trim() !== ''){
        const qBox = document.createElement('div'); qBox.className = 'formula-box'; qBox.style.marginBottom = '1rem';
        const qBoxTitle = document.createElement('div'); qBoxTitle.className = 'formula-title';
        qBoxTitle.textContent = api.utils.t('common.question');
        qBox.appendChild(qBoxTitle);
        const qText = document.createElement('div'); qText.className = 'formula-text'; qText.textContent = questionText;
        qBox.appendChild(qText);
        card.appendChild(qBox);
      }

      // Grid host re-built on each round so "Neu generieren" can swap the subset.
      const gridHost = document.createElement('div');
      card.appendChild(gridHost);

      let lefts = [], rights = [];
      let currentMap = Object.create(null);
      let selectedRightId = null, selectedLeftId = null;
      const leftEls = {}, rightEls = {};

      function pickPairs(){
        if(!hasPool) return allPairs.slice();
        const pool = allPairs.slice();
        window.BlockUtils.shuffle(pool);
        return pool.slice(0, poolSize);
      }

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

      function buildRound(){
        gridHost.innerHTML = '';
        currentMap = Object.create(null);
        selectedRightId = null; selectedLeftId = null;
        Object.keys(leftEls).forEach(k => delete leftEls[k]);
        Object.keys(rightEls).forEach(k => delete rightEls[k]);

        const pairs = pickPairs();
        lefts  = pairs.map((p, i) => ({ id:'L'+i, text: api.utils.l(p.left)  || '', img: p.leftImg  || '' }));
        rights = pairs.map((p, i) => ({ id:'R'+i, text: api.utils.l(p.right) || '', img: p.rightImg || '', correctLeftId:'L'+i }));
        const rightOrder = activeConfig.shuffle ? window.BlockUtils.shuffle(rights.slice()) : rights.slice();

        const grid = document.createElement('div');
        grid.className = 'match-grid';
        const colL = document.createElement('div'); colL.className = 'match-col match-col-left';
        const colR = document.createElement('div'); colR.className = 'match-col match-col-right';
        grid.appendChild(colL); grid.appendChild(colR);
        gridHost.appendChild(grid);

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
          slot.textContent = api.utils.t('block.match-pairs.dropHere');
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

        renderAssignments();
        // A regenerated round is new DOM; the runtime only typesets on mount.
        api.utils.renderMath(gridHost);
      }

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
          slot.textContent = api.utils.t('block.match-pairs.dropHere');
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
          // The copied right-hand content is fresh plain text: typeset its $…$.
          api.utils.renderMath(slot);
          slot.dataset.empty = 'false';
          slot.draggable = true;
          slot.ondragstart = (e) => {
            e.stopPropagation();
            e.dataTransfer.setData('text/match-right', rid);
            e.dataTransfer.setData('text/from-left', lid);
          };
          slot.onclick = (e) => { e.stopPropagation(); unassign(lid); };
          slot.title = api.utils.t('block.match-pairs.slotRemoveHint');
        });
      }

      function updateSelection(){
        Object.values(leftEls).forEach(c => c.classList.toggle('selected', c.dataset.id === selectedLeftId));
        Object.values(rightEls).forEach(c => c.classList.toggle('selected', c.dataset.id === selectedRightId));
      }
      function clearSelection(){ selectedLeftId = null; selectedRightId = null; updateSelection(); }

      const btnRow = document.createElement('div');
      btnRow.className = 'button-cluster';
      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = api.utils.t('common.check');
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button'; resetBtn.className = 'btn btn-secondary';
      resetBtn.textContent = api.utils.t('block.match-pairs.resetBtn');
      btnRow.appendChild(checkBtn); btnRow.appendChild(resetBtn);
      // Neu generieren only when a pool is configured.
      let newBtn = null;
      if(hasPool){
        newBtn = document.createElement('button');
        newBtn.type = 'button'; newBtn.className = 'btn btn-secondary';
        newBtn.textContent = api.utils.t('common.regenerate');
        btnRow.appendChild(newBtn);
      }
      card.appendChild(btnRow);

      const fb = api.utils.feedbackBox(card);

      checkBtn.addEventListener('click', () => {
        if(lefts.length === 0){
          fb.neutral(api.utils.t('block.match-pairs.noPairsDefined'));
          api.reportScore(0);
          return;
        }
        // Nothing assigned yet: prompt instead of recording a 0.
        if(Object.keys(currentMap).length === 0){
          fb.bad(api.utils.t('block.match-pairs.pleaseAssignAtLeastOne'));
          return;
        }
        let correct = 0;
        lefts.forEach(L => {
          const rid = currentMap[L.id];
          const expectedR = rights.find(r => r.correctLeftId === L.id);
          const ok = rid && expectedR && rid === expectedR.id;
          leftEls[L.id].classList.toggle('correct',   !!ok);
          leftEls[L.id].classList.toggle('incorrect', !ok && !!rid);
          if(ok) correct++;
        });
        const ratio = correct / lefts.length;
        api.reportScore(Math.round(ratio * (activeConfig.maxPoints || 1) * 100) / 100);
        if(correct === lefts.length) fb.ok(api.utils.t('block.match-pairs.allCorrect'));
        else fb.bad(api.utils.t('block.match-pairs.scoreLine', { correct: correct, total: lefts.length }));
      });

      resetBtn.addEventListener('click', () => {
        currentMap = Object.create(null);
        clearSelection();
        Object.values(leftEls).forEach(c => c.classList.remove('correct','incorrect'));
        renderAssignments();
        fb.neutral(api.utils.t('block.match-pairs.resetDone'));
      });

      if(newBtn){
        newBtn.addEventListener('click', () => {
          buildRound();
          fb.neutral(api.utils.t('block.match-pairs.newTaskGenerated'));
        });
        window.BlockUtils.regenPolicy(newBtn, activeConfig, api);
      }

      host.appendChild(card);
      enableDragAutoScroll(card);
      buildRound();
      api.initScore(activeConfig.maxPoints || 1);
      return {};
    },

    preview(host, config){
      const t = window.BlockUtils.t;
      const l = window.BlockUtils.l;
      const activeConfig = matchPresetConfig(config);
      const imgH = Math.min(Number(activeConfig.imgHeight) || 70, 50); // smaller in mini-preview
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.5rem 0.7rem; font-size:0.8rem; height:100%; overflow:hidden; display:flex; flex-direction:column;';
      const tag = document.createElement('div');
      tag.textContent = '⇄  ' + t('block.match-pairs.previewTag');
      tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700; margin-bottom:0.3rem;';
      wrap.appendChild(tag);
      const q = document.createElement('div'); q.textContent = l(activeConfig.question) || '';
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
        const l1 = mkSide(l(p.left), p.leftImg);
        const arr = document.createElement('div'); arr.textContent='↔'; arr.style.cssText='text-align:center;color:#84bf66;font-weight:700;line-height:2;font-size:0.7rem;';
        const r = mkSide(l(p.right), p.rightImg);
        r.style.background = '#a1d884'; r.style.borderColor = '#84bf66';
        grid.appendChild(l1); grid.appendChild(arr); grid.appendChild(r);
      });
      wrap.appendChild(grid);
      host.appendChild(wrap);
    }
  });


  function matchPresetConfig(config, locale){
    if(!config || !config.preset || config.preset === 'custom') return config || {};
    const base = Object.assign({}, config);
    const u = window.BlockUtils || {};
    const loc = locale || (u.getLocale && u.getLocale()) || 'de';
    const en = loc === 'en';
    const presets = en ? {
      chemistry: {
        question: 'Match the element symbols to the elements.',
        pairs: [
          { left:'Hydrogen', right:'H' },
          { left:'Oxygen', right:'O' },
          { left:'Carbon', right:'C' },
          { left:'Sodium', right:'Na' }
        ]
      },
      units: {
        question: 'Match each unit to the corresponding quantity.',
        pairs: [
          { left:'Current', right:'Ampere (A)' },
          { left:'Voltage', right:'Volt (V)' },
          { left:'Resistance', right:'Ohm (Ω)' },
          { left:'Power', right:'Watt (W)' }
        ]
      },
      'number-bases': {
        question: 'Match the notation to the number system.',
        pairs: [
          { left:'1010₂', right:'Binary' },
          { left:'A₁₆', right:'Hexadecimal' },
          { left:'10₁₀', right:'Decimal' },
          { left:'17₈', right:'Octal' }
        ]
      },
      'math-symbols': {
        question: 'Match the math symbols to their meanings.',
        pairs: [
          { left:'∑', right:'Sum' },
          { left:'√', right:'Root' },
          { left:'≈', right:'approximately equal' },
          { left:'∞', right:'infinity' }
        ]
      },
      animals: {
        mode: 'categorize',
        question: 'Assign the animals to their classes.',
        categories: [
          { id:'mammals', label:'Mammals' },
          { id:'birds',   label:'Birds' },
          { id:'fish',    label:'Fish' }
        ],
        items: [
          { text:'Dog',    categoryId:'mammals' },
          { text:'Cat',    categoryId:'mammals' },
          { text:'Eagle',  categoryId:'birds' },
          { text:'Sparrow', categoryId:'birds' },
          { text:'Shark',  categoryId:'fish' },
          { text:'Salmon', categoryId:'fish' }
        ],
        maxPoints: 6
      },
      states: {
        mode: 'categorize',
        question: 'Assign the substances to their states of matter.',
        categories: [
          { id:'solid',  label:'Solid' },
          { id:'liquid', label:'Liquid' },
          { id:'gas',    label:'Gas' }
        ],
        items: [
          { text:'Iron',    categoryId:'solid'  },
          { text:'Granite', categoryId:'solid'  },
          { text:'Water',   categoryId:'liquid' },
          { text:'Mercury', categoryId:'liquid' },
          { text:'Oxygen',  categoryId:'gas'    },
          { text:'Helium',  categoryId:'gas'    }
        ],
        maxPoints: 6
      }
    } : {
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
          { id:'liquid', label:'Flüssig' },
          { id:'gas',    label:'Gasförmig' }
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
    };
    const pairs = presets[config.preset];
    return pairs ? Object.assign(base, pairs) : config;
  }
  // Mount for categorization mode (n-to-1 drag&drop).
  // ---- Categorize helpers ----------------------------------------------------
  // An item's categoryId may list several ids ("c1, c2"): the item then
  // appears once per category.
  function catIds(item){
    return String((item && item.categoryId) || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  // Auto-scroll while dragging near the top/bottom edge: nested scroll boxes
  // (e.g. the block cell), the page itself and, if allowed (same origin), the
  // LMS page around the SCO frame. Native drag & drop doesn't do this
  // reliably, so long element lists couldn't reach every category.
  function enableDragAutoScroll(root){
    const EDGE = 70, MAX_STEP = 22;
    let active = false;
    const step = dist => dist < EDGE ? Math.ceil((EDGE - Math.max(0, dist)) / EDGE * MAX_STEP) : 0;
    function scrollBoxes(){
      const out = [];
      for(let n = root.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement){
        const oy = getComputedStyle(n).overflowY;
        if((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) out.push(n);
      }
      return out;
    }
    function onDragOver(e){
      if(!active) return;
      const y = e.clientY;
      scrollBoxes().forEach(box => {
        const r = box.getBoundingClientRect();
        const up = step(y - r.top), down = step(r.bottom - y);
        if(up) box.scrollTop -= up; else if(down) box.scrollTop += down;
      });
      const up = step(y), down = step(window.innerHeight - y);
      if(up || down){
        const d = up ? -up : down;
        window.scrollBy(0, d);
        try { if(window.parent && window.parent !== window) window.parent.scrollBy(0, d); } catch(_){ /* cross-origin LMS */ }
      }
    }
    root.addEventListener('dragstart', () => { active = true; }, true);
    const stop = () => { active = false; };
    root.addEventListener('dragend', stop, true);
    root.addEventListener('drop', stop, true);
    document.addEventListener('dragover', onDragOver);
  }

  function mountCategorize(host, cfg, api){
    const imgH = Number(cfg.imgHeight) || 70;
    const card = document.createElement('section');
    card.className = 'section-card block-question';
    const h = document.createElement('h3');
    h.textContent = api.utils.l(cfg.blockTitle) || api.utils.t('block.match-pairs.defaultCategorizeTitle');
    card.appendChild(h);
    const questionText = api.utils.l(cfg.question);
    if(questionText && String(questionText).trim() !== ''){
      const qBox = document.createElement('div'); qBox.className = 'formula-box'; qBox.style.marginBottom = '1rem';
      const qBoxTitle = document.createElement('div'); qBoxTitle.className = 'formula-title';
      qBoxTitle.textContent = api.utils.t('common.question');
      qBox.appendChild(qBoxTitle);
      const qText = document.createElement('div'); qText.className = 'formula-text'; qText.textContent = questionText;
      qBox.appendChild(qText);
      card.appendChild(qBox);
    }
    const cats     = (cfg.categories || []).filter(c => c && c.id);
    const allItems = (cfg.items || []).filter(it => it && (it.text || it.image));
    if(cats.length === 0 || allItems.length === 0){
      const ph = document.createElement('div');
      ph.style.cssText = 'color:var(--muted, #6a7986); font-style:italic;';
      ph.textContent = api.utils.t('block.match-pairs.noCategoriesOrItems');
      card.appendChild(ph);
      host.appendChild(card);
      api.initScore(Number(cfg.maxPoints) || 1);
      return {};
    }
    const poolSize = Math.max(0, Math.floor(Number(cfg.poolSize) || 0));
    const hasPool  = poolSize > 0 && poolSize < allItems.length;

    // Wrap that gets rebuilt on "Neu generieren". The categories don't change,
    // only which items are present in the pool.
    const wrapHost = document.createElement('div');
    card.appendChild(wrapHost);
    let items = [], assigned = [], chips = [], dropZones = {}, poolList = null;

    function pickItems(){
      if(!hasPool) return allItems.slice();
      // Bucket items by category; first pass picks one per category so every
      // category has at least one item (assuming poolSize >= category count).
      // Multi-category items are bucketed by their first category.
      const buckets = {};
      cats.forEach(c => { buckets[c.id] = []; });
      allItems.forEach(it => {
        const first = catIds(it)[0];
        if(buckets[first]) buckets[first].push(it);
      });
      Object.values(buckets).forEach(arr => window.BlockUtils.shuffle(arr));
      const picked = [];
      // First pass: one item from each non-empty category if pool allows.
      cats.forEach(c => {
        if(picked.length < poolSize && buckets[c.id].length){
          picked.push(buckets[c.id].shift());
        }
      });
      // Second pass: fill remaining slots from the leftover pool.
      const leftover = [];
      Object.values(buckets).forEach(arr => leftover.push(...arr));
      window.BlockUtils.shuffle(leftover);
      while(picked.length < poolSize && leftover.length){
        picked.push(leftover.shift());
      }
      window.BlockUtils.shuffle(picked);
      return picked;
    }

    // Chip key: chips that look the same (text + image) are interchangeable.
    const lookKey = it => JSON.stringify([String(api.utils.l(it.text) || '').trim(), it.image || '']);

    function buildRound(){
      wrapHost.innerHTML = '';
      // One chip per (item, category): an item listed for "c1, c2" yields
      // two chips. items[i] = { it, expected } from here on.
      const catSet = new Set(cats.map(c => c.id));
      items = [];
      pickItems().forEach(it => {
        const ids = catIds(it).filter(id => catSet.has(id));
        (ids.length ? ids : ['']).forEach(id => items.push({ it, expected: id }));
      });
      assigned = items.map(() => null);
      chips = [];
      dropZones = {};
      let selected = null;   // chip picked by click/tap, waiting for a target

      const hint = document.createElement('div');
      hint.className = 'cat-hint';
      hint.textContent = api.utils.t('block.match-pairs.categorizeHint');
      wrapHost.appendChild(hint);

      const wrap = document.createElement('div');
      wrap.className = 'cat-wrap';
      wrapHost.appendChild(wrap);

      function select(idx){
        if(selected != null && chips[selected]) chips[selected].classList.remove('is-selected');
        selected = (idx == null || selected === idx) ? null : idx;
        if(selected != null) chips[selected].classList.add('is-selected');
        wrap.classList.toggle('has-selection', selected != null);
      }
      function moveTo(idx, categoryId){
        assigned[idx] = categoryId;
        chips[idx].classList.remove('cat-chip-correct', 'cat-chip-wrong');
        if(categoryId == null) poolList.appendChild(chips[idx]);
        else dropZones[categoryId].list.appendChild(chips[idx]);
      }

      const pool = document.createElement('div');
      pool.className = 'cat-pool';
      const poolLabel = document.createElement('div');
      poolLabel.className = 'cat-pool-label';
      poolLabel.textContent = api.utils.t('block.match-pairs.poolLabel');
      pool.appendChild(poolLabel);
      poolList = document.createElement('div');
      poolList.className = 'cat-pool-list';
      pool.appendChild(poolList);
      wrap.appendChild(pool);

      const dropArea = document.createElement('div');
      dropArea.className = 'cat-drops';
      wrap.appendChild(dropArea);

      cats.forEach(c => {
        const zone = document.createElement('div');
        zone.className = 'cat-zone';
        zone.dataset.categoryId = c.id;
        const lbl = document.createElement('div');
        lbl.className = 'cat-zone-label';
        if(c.image){
          const img = document.createElement('img');
          img.src = c.image; img.alt = api.utils.l(c.label) || c.id;
          img.style.cssText = 'max-height:' + Math.round(imgH*0.6) + 'px; vertical-align:middle; margin-right:0.4rem;';
          lbl.appendChild(img);
        }
        const txt = document.createElement('span');
        txt.textContent = api.utils.l(c.label) || c.id;
        lbl.appendChild(txt);
        zone.appendChild(lbl);
        const list = document.createElement('div');
        list.className = 'cat-zone-list';
        zone.appendChild(list);
        dropArea.appendChild(zone);
        dropZones[c.id] = { zone, list };
      });

      const itemOrder = items.map((_, i) => i);
      if(cfg.shuffle !== false) window.BlockUtils.shuffle(itemOrder);

      chips = items.map(({ it }, idx) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'cat-chip';
        chip.draggable = true;
        chip.dataset.itemIdx = String(idx);
        const itText = api.utils.l(it.text);
        if(it.image){
          const img = document.createElement('img');
          img.src = it.image; img.alt = itText || '';
          img.style.cssText = 'max-height:' + imgH + 'px; vertical-align:middle; margin-right:0.4rem;';
          chip.appendChild(img);
        }
        if(itText){
          const txt = document.createElement('span');
          txt.textContent = itText;
          chip.appendChild(txt);
        }
        chip.addEventListener('dragstart', e => {
          chip.classList.add('is-dragging');
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', String(idx)); } catch(_){}
        });
        chip.addEventListener('dragend', () => chip.classList.remove('is-dragging'));
        // Tap/click alternative to dragging (works on touch screens and with
        // the keyboard): pick the chip, then click a category or the pool.
        chip.addEventListener('click', e => {
          e.stopPropagation();
          select(idx);
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
          moveTo(itemIdx, categoryId);
          select(null);
        });
        // Click/tap target for a picked chip.
        target.addEventListener('click', () => {
          if(selected == null) return;
          moveTo(selected, categoryId);
          select(null);
        });
      }
      cats.forEach(c => attachDrop(dropZones[c.id].zone, c.id));
      attachDrop(pool, null);
      // New chips and category labels (also after "Neu generieren"): typeset $…$.
      api.utils.renderMath(wrapHost);
    }

    const btnRow = document.createElement('div');
    btnRow.className = 'button-cluster';
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = api.utils.t('common.check');
    btnRow.appendChild(checkBtn);
    let newBtn = null;
    if(hasPool){
      newBtn = document.createElement('button');
      newBtn.type = 'button'; newBtn.className = 'btn btn-secondary';
      newBtn.textContent = api.utils.t('common.regenerate');
      btnRow.appendChild(newBtn);
    }
    card.appendChild(btnRow);
    const fb = api.utils.feedbackBox(card);
    host.appendChild(card);
    enableDragAutoScroll(card);

    checkBtn.addEventListener('click', () => {
      // Nothing assigned to a category yet: prompt instead of recording a 0.
      if(assigned.every(a => a == null)){
        fb.bad(api.utils.t('block.match-pairs.pleaseAssignAtLeastOneTerm'));
        return;
      }
      // Chips that look identical are interchangeable: per look-alike group,
      // each category accepts as many chips as the group expects there.
      const ok = items.map(() => false);
      const groups = {};
      items.forEach((d, idx) => { (groups[lookKey(d.it)] = groups[lookKey(d.it)] || []).push(idx); });
      Object.values(groups).forEach(idxs => {
        const quota = {};
        idxs.forEach(i => { quota[items[i].expected] = (quota[items[i].expected] || 0) + 1; });
        idxs.forEach(i => {
          const a = assigned[i];
          if(a != null && quota[a] > 0){ quota[a]--; ok[i] = true; }
        });
      });
      let correct = 0;
      chips.forEach((chip, idx) => {
        chip.classList.remove('cat-chip-correct', 'cat-chip-wrong');
        if(ok[idx]){ chip.classList.add('cat-chip-correct'); correct++; }
        else        { chip.classList.add('cat-chip-wrong'); }
      });
      const maxPoints = Number(cfg.maxPoints) || items.length;
      const pts = Math.round((correct / items.length) * maxPoints * 100) / 100;
      if(correct === items.length){
        fb.ok(api.utils.t('block.match-pairs.categorizeAllCorrect', {
          total: items.length, pts: maxPoints, max: maxPoints
        }));
      } else {
        fb.bad(api.utils.t('block.match-pairs.categorizeScoreLine', {
          correct: correct, total: items.length, pts: pts, max: maxPoints
        }));
      }
      api.reportScore(pts);
    });

    if(newBtn){
      newBtn.addEventListener('click', () => {
        buildRound();
        fb.neutral(api.utils.t('block.match-pairs.newTaskGenerated'));
      });
      window.BlockUtils.regenPolicy(newBtn, cfg, api);
    }

    buildRound();
    api.initScore(Number(cfg.maxPoints) || 1);
    return {};
  }
})();
