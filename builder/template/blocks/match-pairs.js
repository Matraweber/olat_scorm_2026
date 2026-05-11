(function(){
  'use strict';
  Blocks.register('match-pairs', {
    label: 'Zuordnung (Drag & Drop)',
    description: 'Linke Begriffe per Drag & Drop oder Klick mit den richtigen rechten Antworten verbinden.',
    category: 'Frage',
    icon: '🔗',
    graded: true,
    defaultConfig(){
      return {
        question: 'Ordne die Begriffe einander zu.',
        pairs: [
          { left: 'Wasserstoff', leftImg: '', right: 'H',  rightImg: '' },
          { left: 'Sauerstoff',  leftImg: '', right: 'O',  rightImg: '' },
          { left: 'Gold',        leftImg: '', right: 'Au', rightImg: '' }
        ],
        imgHeight: 70,
        shuffle: true,
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'question',   label:'Aufgabentext',              type:'textarea', rows:2 },
        { key:'imgHeight',  label:'Bild-Höhe px (alle Paare)', type:'number', step:10, min:20, max:400,
          help:'Bestimmt die maximale Höhe jedes Bildes in allen Paaren.' },
        { key:'pairs', label:'Paare (links ↔ rechts)', type:'list', itemLabel:'Paar',
          itemSchema:[
            { key:'left',     label:'Links Text',  type:'text' },
            { key:'leftImg',  label:'Links Bild',  type:'image' },
            { key:'right',    label:'Rechts Text', type:'text' },
            { key:'rightImg', label:'Rechts Bild', type:'image' }
          ]},
        { key:'shuffle',    label:'Rechte Seite mischen', type:'boolean' },
        { key:'maxPoints',  label:'Punkte (gesamt)',       type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const imgH = Number(config.imgHeight) || 70;

      const card = document.createElement('section');
      card.className = 'section-card block-question';
      const h = document.createElement('h3'); h.textContent = 'Zuordnung'; card.appendChild(h);
      const q = document.createElement('p'); q.textContent = config.question || ''; card.appendChild(q);

      const pairs = (config.pairs || []).filter(p => p && (p.left || p.leftImg || p.right || p.rightImg));
      const lefts  = pairs.map((p, i) => ({ id:'L'+i, text:p.left||'',  img:p.leftImg||''  }));
      const rights = pairs.map((p, i) => ({ id:'R'+i, text:p.right||'', img:p.rightImg||'', correctLeftId:'L'+i }));
      const rightOrder = config.shuffle ? shuffle(rights.slice()) : rights.slice();

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
        api.reportScore(Math.round(ratio * (config.maxPoints || 1) * 100) / 100);
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
      api.initScore(config.maxPoints || 1);
      return {};
    },

    preview(host, config){
      const imgH = Math.min(Number(config.imgHeight) || 70, 50); // smaller in mini-preview
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.5rem 0.7rem; font-size:0.8rem; height:100%; overflow:hidden; display:flex; flex-direction:column;';
      const tag = document.createElement('div');
      tag.textContent = '🔗  Drag & Drop-Zuordnung';
      tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700; margin-bottom:0.3rem;';
      wrap.appendChild(tag);
      const q = document.createElement('div'); q.textContent = config.question || '';
      q.style.cssText = 'color:#003b5c; font-weight:700; margin-bottom:0.4rem; font-size:0.82rem;';
      wrap.appendChild(q);

      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid; grid-template-columns:1fr 20px 1fr; gap:0.2rem 0.35rem;';

      (config.pairs || []).slice(0, 4).forEach(p => {
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

  function shuffle(a){
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
})();
