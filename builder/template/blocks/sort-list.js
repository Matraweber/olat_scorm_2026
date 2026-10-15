(function(){
  'use strict';
  Blocks.register('sort-list', {
    label: 'Sortierliste',
    labelKey: 'block.sort-list.label',
    description: 'Items per Drag & Drop in die korrekte Reihenfolge bringen.',
    descKey: 'block.sort-list.description',
    category: 'Frage',
    categoryKey: 'block.category.question',
    icon: '↕',
    graded: true,
    defaultConfig(locale = 'de'){
      return {
        blockTitle: '', preset: 'custom',
        question: '', items: [], maxPoints: 1
      };
    },
    previewConfig(locale = 'de'){
      const en = locale === 'en';
      return {
        blockTitle: '', preset: 'custom',
        question: en
          ? 'Put the planets in the correct order (closest to the sun to farthest).'
          : 'Bringen Sie die Planeten in die richtige Reihenfolge (sonnennah zu sonnenfern).',
        items: en
          ? [ { value: 'Mercury' }, { value: 'Venus' }, { value: 'Earth' }, { value: 'Mars' } ]
          : [ { value: 'Merkur' }, { value: 'Venus' }, { value: 'Erde'   }, { value: 'Mars'  } ],
        maxPoints: 4
      };
    },
    builderSchema(){
      const isCustom = c => (c.preset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Überschrift', labelKey:'block.sort-list.field.blockTitle.label', type:'text', placeholder:'Sortierliste', placeholderKey:'block.sort-list.field.blockTitle.placeholder' },
        { key:'preset', label:'Vorlage', labelKey:'block.sort-list.field.preset.label', type:'select', options:[
          {value:'custom',          label:'Manuell (leer)',                              labelKey:'block.sort-list.field.preset.option.custom'},
          {value:'example-se',      label:'Beispiel: Informatik, Wasserfallmodell',      labelKey:'block.sort-list.field.preset.option.example-se'},
          {value:'example-science', label:'Beispiel: Wissenschaft, Wissenschaftliche Methode', labelKey:'block.sort-list.field.preset.option.example-science'},
          {value:'example-algo',    label:'Beispiel: Algorithmus, Merge-Sort-Phasen',    labelKey:'block.sort-list.field.preset.option.example-algo'}
        ], help:'Items werden in der eingegebenen Reihenfolge als korrekt gewertet. Beim Start zufällig gemischt.', helpKey:'block.sort-list.field.preset.help' },
        { type:'action', label:'↺ Zurücksetzen', labelKey:'block.sort-list.field.reset.label', action:'reset', showIf: isCustom },
        // Question & items
        { type:'section', label:'Frage & Items', labelKey:'block.sort-list.field.sec_q.label', key:'_sec_q', showIf: isCustom },
        { key:'question', label:'Aufgabentext', labelKey:'block.sort-list.field.question.label', type:'math-textarea', rows:2, showIf: isCustom },
        { key:'items', label:'Items', labelKey:'block.sort-list.field.items.label', type:'list', itemLabel:'Item', itemLabelKey:'block.sort-list.field.items.itemLabel',
          showIf: isCustom,
          help:'Items in der richtigen Reihenfolge eingeben. Beim Start werden sie zufällig gemischt.',
          helpKey:'block.sort-list.field.items.help',
          itemSummary: item => (item.value || '…').slice(0, 70),
          itemSchema:[ { key:'value', label:'Text', labelKey:'block.sort-list.field.items.value.label', type:'text', fullWidth:true } ] },
        // Scoring
        { type:'section', label:'Bewertung', labelKey:'block.sort-list.field.sec_score.label', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte', labelKey:'block.sort-list.field.maxPoints.label', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      const generated = sortListPreset(config, u);
      const correct = generated.items.filter(Boolean);
      // Shuffle indices for display
      const order = u.shuffle(correct.map((_, i) => i));

      const ui = u.simpleQuestionCard(host, {
        title: u.l(config.blockTitle) || u.t('block.sort-list.defaultTitle'),
        qBoxTitle: u.t('block.sort-list.qBoxTitle'),
        question: generated.question || u.l(config.question) || ''
      });
      const { content, buttons, fb } = ui;

      const list = document.createElement('div');
      list.style.cssText = 'display:flex; flex-direction:column; gap:0.5rem; margin:0.6rem 0;';
      // currentOrder: array of indices into `correct`
      const currentOrder = order.slice();

      function rerender(){
        list.innerHTML = '';
        currentOrder.forEach((origIdx, displayIdx) => {
          const item = document.createElement('div');
          item.draggable = true;
          item.dataset.displayIdx = String(displayIdx);
          item.style.cssText = 'display:flex; align-items:center; gap:0.6rem; padding:0.6rem 0.8rem; background:#fff; border:1px solid var(--line); border-radius:10px; cursor:grab; user-select:none;';
          const handle = document.createElement('span'); handle.textContent = '☰'; handle.style.cssText = 'color:var(--muted); font-size:1.1rem;';
          item.appendChild(handle);
          const num = document.createElement('span'); num.textContent = (displayIdx + 1) + '.'; num.style.cssText = 'color:var(--primary); font-weight:700; min-width:1.4rem;';
          item.appendChild(num);
          const txt = document.createElement('span'); txt.textContent = correct[origIdx]; item.appendChild(txt);
          item.addEventListener('dragstart', e => { e.dataTransfer.setData('text/sort-idx', String(displayIdx)); item.style.opacity = '0.4'; });
          item.addEventListener('dragend', () => { item.style.opacity = '1'; });
          item.addEventListener('dragover', e => { e.preventDefault(); item.style.borderColor = 'var(--primary)'; });
          item.addEventListener('dragleave', () => { item.style.borderColor = 'var(--line)'; });
          item.addEventListener('drop', e => {
            e.preventDefault(); item.style.borderColor = 'var(--line)';
            const from = Number(e.dataTransfer.getData('text/sort-idx'));
            const to = displayIdx;
            if(Number.isFinite(from) && from !== to){
              const [moved] = currentOrder.splice(from, 1);
              currentOrder.splice(to, 0, moved);
              rerender();
            }
          });
          list.appendChild(item);
        });
        // The list is rebuilt as plain text on every move: typeset $…$ again.
        u.renderMath(list);
      }
      content.appendChild(list);

      const checkBtn = document.createElement('button'); checkBtn.type='button'; checkBtn.className='btn btn-primary'; checkBtn.textContent = u.t('common.check');
      buttons.appendChild(checkBtn);

      checkBtn.addEventListener('click', () => {
        let correctCount = 0;
        currentOrder.forEach((origIdx, displayIdx) => {
          const itemEl = list.children[displayIdx];
          if(origIdx === displayIdx){
            correctCount++;
            itemEl.style.borderColor = 'var(--accent-dark)';
            itemEl.style.background = 'rgba(132,191,102,0.08)';
          } else {
            itemEl.style.borderColor = 'var(--danger)';
            itemEl.style.background = 'rgba(180,35,24,0.06)';
          }
        });
        const ratio = correctCount / Math.max(1, correct.length);
        const pts = Math.round(ratio * (config.maxPoints || 1) * 100) / 100;
        api.reportScore(pts);
        if(correctCount === correct.length) fb.ok(u.t('block.sort-list.feedback.allCorrect'));
        else fb.bad(u.t('block.sort-list.feedback.partial', { correct: correctCount, total: correct.length }));
      });

      rerender();
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const u = window.BlockUtils;
      const wrap = u.tagPreview(host, { icon:'↕', label: u.t('block.sort-list.previewTag'), fillHeight:true });
      const generated = sortListPreset(config, u);
      if(generated.question){
        const q = document.createElement('div'); q.textContent = generated.question;
        q.style.cssText = 'color:#003b5c; font-weight:700; margin-bottom:0.4rem; font-size:0.82rem;';
        wrap.appendChild(q);
      }
      const items = generated.items.slice(0, 5);
      items.forEach((txt, i) => {
        const li = document.createElement('div');
        li.style.cssText = 'display:flex; align-items:center; gap:0.4rem; padding:0.25rem 0.5rem; margin-bottom:0.2rem; background:#fff; border:1px solid #d8e0e6; border-radius:6px;';
        li.innerHTML = '<span style="color:#5d6872;">☰</span><span style="color:#003b5c; font-weight:700;">' + (i+1) + '.</span><span>' + (txt.length > 40 ? txt.slice(0,40) + '…' : txt) + '</span>';
        wrap.appendChild(li);
      });
      if(generated.items.length > 5){
        const m = document.createElement('div'); m.textContent = u.t('block.sort-list.preview.more', { count: generated.items.length - 5 }); m.style.cssText = 'color:#888; font-size:0.78rem; padding-left:1rem; font-style:italic;';
        wrap.appendChild(m);
      }
    }
  });

  function sortListPreset(config, u){
    const preset = config.preset || 'custom';
    const manual = (config.items || []).map(it => typeof it === 'string' ? it : (it && it.value) || '').filter(Boolean);
    const tr = (key, params) => (u && typeof u.t === 'function') ? u.t(key, params) : key;
    if(preset === 'example-se'){
      return { question: tr('block.sort-list.preset.example-se.question'),
        items:[
          tr('block.sort-list.preset.example-se.item.requirements'),
          tr('block.sort-list.preset.example-se.item.design'),
          tr('block.sort-list.preset.example-se.item.implementation'),
          tr('block.sort-list.preset.example-se.item.testing'),
          tr('block.sort-list.preset.example-se.item.acceptance'),
          tr('block.sort-list.preset.example-se.item.maintenance')
        ] };
    }
    if(preset === 'example-science'){
      return { question: tr('block.sort-list.preset.example-science.question'),
        items:[
          tr('block.sort-list.preset.example-science.item.observe'),
          tr('block.sort-list.preset.example-science.item.question'),
          tr('block.sort-list.preset.example-science.item.hypothesis'),
          tr('block.sort-list.preset.example-science.item.experiment'),
          tr('block.sort-list.preset.example-science.item.analyze'),
          tr('block.sort-list.preset.example-science.item.conclude')
        ] };
    }
    if(preset === 'example-algo'){
      return { question: tr('block.sort-list.preset.example-algo.question'),
        items:[
          tr('block.sort-list.preset.example-algo.item.split'),
          tr('block.sort-list.preset.example-algo.item.sortHalves'),
          tr('block.sort-list.preset.example-algo.item.merge'),
          tr('block.sort-list.preset.example-algo.item.return')
        ] };
    }
    const q = u && typeof u.l === 'function' ? u.l(config.question) : config.question;
    const localizedManual = (config.items || [])
      .map(it => {
        const raw = typeof it === 'string' ? it : (it && it.value) || '';
        return u && typeof u.l === 'function' ? u.l(raw) : raw;
      })
      .filter(Boolean);
    return { question: q || '', items: localizedManual.length ? localizedManual : manual };
  }
})();
