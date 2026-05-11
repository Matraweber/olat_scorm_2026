(function(){
  'use strict';
  Blocks.register('match-pairs', {
    label: 'Zuordnung (Drag & Drop)',
    description: 'Linke Begriffe per Drag & Drop oder Klick mit den richtigen rechten Antworten verbinden.',
    category: 'Frage',
    icon: '↔',
    graded: true,
    defaultConfig(){
      return {
        question: 'Ordne die Begriffe einander zu.',
        pairs: [
          { left: 'Wasserstoff', right: 'H' },
          { left: 'Sauerstoff',  right: 'O' },
          { left: 'Gold',        right: 'Au' }
        ],
        shuffle: true,
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'question', label:'Aufgabentext', type:'textarea', rows:2 },
        { key:'pairs', label:'Paare (links ↔ rechts)', type:'list', itemLabel:'Paar',
          itemSchema:[
            { key:'left', label:'Links', type:'text' },
            { key:'right', label:'Rechts', type:'text' }
          ]},
        { key:'shuffle', label:'Rechte Seite mischen', type:'boolean' },
        { key:'maxPoints', label:'Punkte (gesamt)', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const card = document.createElement('section');
      card.className = 'section-card block-question';
      const h = document.createElement('h3'); h.textContent = 'Zuordnung'; card.appendChild(h);
      const q = document.createElement('p'); q.textContent = config.question || ''; card.appendChild(q);

      const pairs = (config.pairs || []).filter(p => p && (p.left || p.right));
      // Mapping of stable IDs
      const lefts = pairs.map((p, i) => ({id: 'L'+i, text: p.left}));
      const rights = pairs.map((p, i) => ({id: 'R'+i, text: p.right, correctLeftId: 'L'+i}));
      const rightOrder = config.shuffle ? shuffle(rights.slice()) : rights.slice();

      const grid = document.createElement('div');
      grid.className = 'match-grid';
      const colL = document.createElement('div'); colL.className = 'match-col match-col-left';
      const colR = document.createElement('div'); colR.className = 'match-col match-col-right';
      grid.appendChild(colL); grid.appendChild(colR);
      card.appendChild(grid);

      // currentMap: map of leftId → rightId (one-to-one)
      let currentMap = Object.create(null);
      let selectedRightId = null;
      let selectedLeftId = null;

      const leftEls = {}, rightEls = {};
      lefts.forEach(L => {
        const cell = document.createElement('div');
        cell.className = 'match-cell match-cell-left';
        cell.dataset.id = L.id;
        cell.innerHTML = '<span class="match-text"></span><span class="match-slot" data-empty="true">Hier ablegen</span>';
        cell.querySelector('.match-text').textContent = L.text;
        cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('over'); });
        cell.addEventListener('dragleave', () => cell.classList.remove('over'));
        cell.addEventListener('drop', e => {
          e.preventDefault();
          cell.classList.remove('over');
          const rid = e.dataTransfer.getData('text/match-right');
          if(rid) assign(L.id, rid);
        });
        cell.addEventListener('click', () => {
          if(selectedRightId){ assign(L.id, selectedRightId); selectedRightId = null; clearSelection(); }
          else { selectedLeftId = (selectedLeftId === L.id ? null : L.id); updateSelection(); }
        });
        colL.appendChild(cell);
        leftEls[L.id] = cell;
      });
      rightOrder.forEach(R => {
        const cell = document.createElement('div');
        cell.className = 'match-cell match-cell-right';
        cell.dataset.id = R.id;
        cell.draggable = true;
        cell.textContent = R.text;
        cell.addEventListener('dragstart', e => { e.dataTransfer.setData('text/match-right', R.id); cell.classList.add('dragging'); });
        cell.addEventListener('dragend', () => cell.classList.remove('dragging'));
        cell.addEventListener('click', () => {
          if(selectedLeftId){ assign(selectedLeftId, R.id); selectedLeftId = null; clearSelection(); }
          else { selectedRightId = (selectedRightId === R.id ? null : R.id); updateSelection(); }
        });
        colR.appendChild(cell);
        rightEls[R.id] = cell;
      });

      function assign(leftId, rightId){
        // Remove rightId from any other left that holds it
        Object.keys(currentMap).forEach(lid => { if(currentMap[lid] === rightId) delete currentMap[lid]; });
        // Remove existing right at this left
        currentMap[leftId] = rightId;
        renderAssignments();
      }
      function unassign(leftId){
        delete currentMap[leftId];
        renderAssignments();
      }
      function renderAssignments(){
        // Reset right cell visibility / left slot text
        Object.values(rightEls).forEach(c => c.classList.remove('used'));
        Object.values(leftEls).forEach(c => {
          const slot = c.querySelector('.match-slot');
          slot.textContent = 'Hier ablegen'; slot.dataset.empty = 'true';
          slot.onclick = null;
        });
        Object.entries(currentMap).forEach(([lid, rid]) => {
          if(rightEls[rid]) rightEls[rid].classList.add('used');
          const slot = leftEls[lid].querySelector('.match-slot');
          const rText = (rights.find(r => r.id === rid) || {}).text || '';
          slot.textContent = rText; slot.dataset.empty = 'false';
          slot.onclick = (e) => { e.stopPropagation(); unassign(lid); };
          slot.title = 'Klicken zum Entfernen';
        });
      }
      function updateSelection(){
        Object.values(leftEls).forEach(c => c.classList.toggle('selected', c.dataset.id === selectedLeftId));
        Object.values(rightEls).forEach(c => c.classList.toggle('selected', c.dataset.id === selectedRightId));
      }
      function clearSelection(){ selectedLeftId = null; selectedRightId = null; updateSelection(); }

      const btnRow = document.createElement('div');
      btnRow.className = 'button-cluster';
      btnRow.style.marginTop = '0.7rem';
      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = 'Korrektur';
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button'; resetBtn.className = 'btn btn-secondary';
      resetBtn.textContent = 'Zurücksetzen';
      btnRow.appendChild(checkBtn); btnRow.appendChild(resetBtn);
      card.appendChild(btnRow);

      const fb = api.utils.feedbackBox(card);

      checkBtn.addEventListener('click', () => {
        let correct = 0;
        lefts.forEach(L => {
          const rid = currentMap[L.id];
          const expectedR = rights.find(r => r.correctLeftId === L.id);
          const ok = rid && expectedR && rid === expectedR.id;
          leftEls[L.id].classList.toggle('correct', !!ok);
          leftEls[L.id].classList.toggle('incorrect', !ok && !!rid);
          if(ok) correct++;
        });
        const ratio = correct / Math.max(1, lefts.length);
        const pts = Math.round(ratio * (config.maxPoints || 1) * 100) / 100;
        api.reportScore(pts);
        if(correct === lefts.length) fb.ok('Alle Zuordnungen korrekt.');
        else fb.bad(correct + ' von ' + lefts.length + ' korrekt.');
      });
      resetBtn.addEventListener('click', () => {
        currentMap = Object.create(null);
        clearSelection();
        Object.values(leftEls).forEach(c => { c.classList.remove('correct','incorrect'); });
        renderAssignments();
        fb.neutral('Zurückgesetzt.');
      });

      host.appendChild(card);
      renderAssignments();
      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.5rem 0.7rem; font-size:0.8rem; height:100%; overflow:hidden; display:flex; flex-direction:column;';
      const tag = document.createElement('div');
      tag.textContent = 'Drag & Drop-Zuordnung';
      tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700; margin-bottom:0.3rem;';
      wrap.appendChild(tag);
      const q = document.createElement('div'); q.textContent = config.question || '';
      q.style.cssText = 'color:#003b5c; font-weight:700; margin-bottom:0.4rem; font-size:0.82rem;';
      wrap.appendChild(q);
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid; grid-template-columns:1fr 24px 1fr; gap:0.25rem 0.4rem; min-height:0;';
      (config.pairs || []).slice(0, 5).forEach(p => {
        const l = document.createElement('div'); l.textContent = p.left || '';
        l.style.cssText = 'padding:0.2rem 0.45rem; background:#f5f8fa; border:1px solid #d8e0e6; border-radius:6px; color:#003b5c; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
        const arr = document.createElement('div'); arr.textContent = '↔'; arr.style.cssText = 'text-align:center; color:#84bf66; font-weight:700; line-height:1.6;';
        const r = document.createElement('div'); r.textContent = p.right || '';
        r.style.cssText = 'padding:0.2rem 0.45rem; background:#a1d884; border:1px solid #84bf66; color:#003b5c; border-radius:6px; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
        grid.appendChild(l); grid.appendChild(arr); grid.appendChild(r);
      });
      wrap.appendChild(grid);
      host.appendChild(wrap);
    }
  });

  function shuffle(a){
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
})();
