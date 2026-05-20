(function(){
  'use strict';
  Blocks.register('sort-list', {
    label: 'Sortierliste',
    description: 'Items per Drag & Drop in die korrekte Reihenfolge bringen.',
    category: 'Frage',
    icon: '↕',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '',
        preset: 'custom',
        question: 'Bringen Sie die Planeten in die richtige Reihenfolge (sonnennah zu sonnenfern).',
        items: [
          { value: 'Merkur' },
          { value: 'Venus'  },
          { value: 'Erde'   },
          { value: 'Mars'   }
        ],
        maxPoints: 4
      };
    },
    builderSchema(){
      const isCustom = c => (c.preset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Sortierliste' },
        { key:'preset', label:'Vorlage', type:'select', options:[
          {value:'custom',          label:'Manuell (leer)'},
          {value:'example-se',      label:'Beispiel: Informatik - Wasserfallmodell'},
          {value:'example-science', label:'Beispiel: Wissenschaft - Wissenschaftliche Methode'},
          {value:'example-algo',    label:'Beispiel: Algorithmus - Merge-Sort-Phasen'}
        ], help:'Items werden in der eingegebenen Reihenfolge als korrekt gewertet. Beim Start zufällig gemischt.' },
        { type:'action', label:'↺ Zurücksetzen', action:'reset', showIf: isCustom },
        // Frage & Items
        { type:'section', label:'Frage & Items', key:'_sec_q', showIf: isCustom },
        { key:'question', label:'Aufgabentext', type:'math-textarea', rows:2, showIf: isCustom },
        { key:'items', label:'Items', type:'list', itemLabel:'Item',
          showIf: isCustom,
          help:'Items in der richtigen Reihenfolge eingeben. Beim Start werden sie zufällig gemischt.',
          itemSummary: item => (item.value || '…').slice(0, 70),
          itemSchema:[ { key:'value', label:'Text', type:'text', fullWidth:true } ] },
        // Bewertung
        { type:'section', label:'Bewertung', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      const generated = sortListPreset(config);
      const correct = generated.items.filter(Boolean);
      // Shuffle for display
      const order = correct.map((_, i) => i);
      for(let i = order.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }

      const ui = u.simpleQuestionCard(host, { title: config.blockTitle || 'Aufgabe', qBoxTitle: 'Sortieren', question: generated.question || config.question || '' });
      const { content, buttons, fb } = ui;

      const list = document.createElement('div');
      list.style.cssText = 'display:flex; flex-direction:column; gap:0.5rem; margin:0.6rem 0;';
      // currentOrder: array of indices into `correct`
      let currentOrder = order.slice();

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
      }
      content.appendChild(list);

      const checkBtn = document.createElement('button'); checkBtn.type='button'; checkBtn.className='btn btn-primary'; checkBtn.textContent='Korrektur';
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
        if(correctCount === correct.length) fb.ok('Alle Items korrekt sortiert.');
        else fb.bad(correctCount + ' von ' + correct.length + ' richtig sortiert.');
      });

      rerender();
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const u = window.BlockUtils;
      const wrap = u.tagPreview(host, { icon:'↕', label:'Sortieren (D&D)', fillHeight:true });
      const generated = sortListPreset(config);
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
        const m = document.createElement('div'); m.textContent = '… +' + (generated.items.length - 5) + ' weitere'; m.style.cssText = 'color:#888; font-size:0.78rem; padding-left:1rem; font-style:italic;';
        wrap.appendChild(m);
      }
    }
  });

  function sortListPreset(config){
    const preset = config.preset || 'custom';
    const manual = (config.items || []).map(it => typeof it === 'string' ? it : (it && it.value) || '').filter(Boolean);
    if(preset === 'example-se'){
      return { question:'Ordnen Sie die Phasen des Wasserfallmodells in der richtigen Reihenfolge.',
        items:['Anforderungsanalyse','Systemdesign','Implementierung','Testen','Abnahme','Wartung'] };
    }
    if(preset === 'example-science'){
      return { question:'Ordnen Sie die Schritte der wissenschaftlichen Methode.',
        items:['Beobachtung formulieren','Fragestellung entwickeln','Hypothese aufstellen','Experiment planen und durchführen','Daten auswerten','Schlussfolgerung ziehen'] };
    }
    if(preset === 'example-algo'){
      return { question:'Ordnen Sie die Phasen des Merge-Sort-Algorithmus.',
        items:['Liste in zwei Hälften teilen','Jede Hälfte rekursiv sortieren','Beide sortierten Hälften zusammenführen (merge)','Sortierte Gesamtliste zurückgeben'] };
    }
    return { question: config.question || '', items: manual };
  }
})();
