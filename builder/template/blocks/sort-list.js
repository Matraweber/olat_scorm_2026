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
        question: 'Bringe die Schritte in die richtige Reihenfolge.',
        items: ['Erster Schritt', 'Zweiter Schritt', 'Dritter Schritt', 'Letzter Schritt'],
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'question', label:'Aufgabentext', type:'textarea', rows:2 },
        { key:'items', label:'Items in der korrekten Reihenfolge', type:'list', itemLabel:'Item',
          itemSchema:[ { key:'value', label:'Text', type:'text' } ] },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const u = api.utils;
      // Items can be array of strings or array of {value:string}
      const correct = (config.items || []).map(it => typeof it === 'string' ? it : (it && it.value) || '');
      // Shuffle for display
      const order = correct.map((_, i) => i);
      for(let i = order.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }

      const card = document.createElement('section');
      card.className = 'section-card block-question';
      card.innerHTML = '<h3>Sortieren</h3>';
      const q = document.createElement('p'); q.textContent = config.question || ''; card.appendChild(q);

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
      card.appendChild(list);

      const btnRow = document.createElement('div'); btnRow.className = 'button-cluster'; btnRow.style.marginTop = '0.7rem';
      const checkBtn = document.createElement('button'); checkBtn.type='button'; checkBtn.className='btn btn-primary'; checkBtn.textContent='Korrektur';
      btnRow.appendChild(checkBtn);
      card.appendChild(btnRow);

      const fb = u.feedbackBox(card);
      host.appendChild(card);

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
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.55rem 0.75rem; font-size:0.85rem; height:100%; overflow:hidden;';
      const tag = document.createElement('div');
      tag.textContent = '↕  Sortieren (D&D)';
      tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700; margin-bottom:0.4rem;';
      wrap.appendChild(tag);
      if(config.question){
        const q = document.createElement('div'); q.textContent = config.question;
        q.style.cssText = 'color:#003b5c; font-weight:700; margin-bottom:0.4rem; font-size:0.82rem;';
        wrap.appendChild(q);
      }
      const items = (config.items || []).slice(0, 5);
      items.forEach((it, i) => {
        const txt = typeof it === 'string' ? it : (it && it.value) || '';
        const li = document.createElement('div');
        li.style.cssText = 'display:flex; align-items:center; gap:0.4rem; padding:0.25rem 0.5rem; margin-bottom:0.2rem; background:#fff; border:1px solid #d8e0e6; border-radius:6px;';
        li.innerHTML = '<span style="color:#5d6872;">☰</span><span style="color:#003b5c; font-weight:700;">' + (i+1) + '.</span><span>' + (txt.length > 40 ? txt.slice(0,40) + '…' : txt) + '</span>';
        wrap.appendChild(li);
      });
      if((config.items || []).length > 5){
        const m = document.createElement('div'); m.textContent = '… +' + (config.items.length - 5) + ' weitere'; m.style.cssText = 'color:#888; font-size:0.78rem; padding-left:1rem; font-style:italic;';
        wrap.appendChild(m);
      }
      host.appendChild(wrap);
    }
  });
})();
