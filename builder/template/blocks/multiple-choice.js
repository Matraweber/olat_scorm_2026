(function(){
  'use strict';
  Blocks.register('multiple-choice', {
    label: 'Multiple Choice',
    description: 'Eine oder mehrere richtige Antworten auswählen.',
    category: 'Frage',
    icon: '☑',
    graded: true,
    defaultConfig(){
      return {
        question: 'Welche Aussage ist richtig?',
        choices: [
          { text: 'Antwort A', correct: true },
          { text: 'Antwort B', correct: false },
          { text: 'Antwort C', correct: false }
        ],
        multi: false,
        shuffle: true,
        maxPoints: 1,
        partialCredit: true,
        penalizeWrong: true
      };
    },
    builderSchema(){
      return [
        { key:'question', label:'Frage (HTML erlaubt)', type:'textarea', rows:2 },
        { key:'choices', label:'Antwortmöglichkeiten', type:'list', itemLabel:'Antwort',
          itemSchema:[
            { key:'text', label:'Text', type:'text' },
            { key:'correct', label:'Richtig?', type:'boolean' }
          ]},
        { key:'multi', label:'Mehrfachauswahl erlauben', type:'boolean' },
        { key:'shuffle', label:'Antworten mischen', type:'boolean' },
        { key:'maxPoints', label:'Punkte (gesamt)', type:'number', step:1, min:1 },
        { key:'partialCredit', label:'Teilpunkte bei Mehrfachauswahl', type:'boolean',
          help:'Jede richtig angekreuzte Antwort gibt anteilig Punkte (gesamt / Anzahl richtiger Antworten).' },
        { key:'penalizeWrong', label:'Falsche Auswahl abziehen', type:'boolean',
          help:'Bei Teilpunkten: falsch angekreuzte Antworten ziehen jeweils einen Teilpunkt ab (mindestens 0).' }
      ];
    },
    mount(host, config, api){
      const card = document.createElement('section');
      card.className = 'section-card block-question';
      card.innerHTML = '<h3>Frage</h3>';
      const qEl = document.createElement('p');
      qEl.innerHTML = config.question || '';
      card.appendChild(qEl);

      const list = document.createElement('div'); list.className = 'choice-list';
      const choices = (config.choices || []).slice();
      if(config.shuffle){
        for(let i = choices.length - 1; i > 0; i--){
          const j = Math.floor(Math.random() * (i + 1));
          [choices[i], choices[j]] = [choices[j], choices[i]];
        }
      }
      const groupName = api.blockId + '_grp';
      const inputs = [];
      choices.forEach((c, i) => {
        const id = api.blockId + '_c' + i;
        const lbl = document.createElement('label'); lbl.className = 'choice-item'; lbl.htmlFor = id;
        const inp = document.createElement('input');
        inp.type = config.multi ? 'checkbox' : 'radio';
        inp.id = id; inp.name = groupName;
        lbl.appendChild(inp);
        const span = document.createElement('span'); span.innerHTML = c.text || '';
        lbl.appendChild(span);
        list.appendChild(lbl);
        inputs.push({input: inp, correct: !!c.correct});
      });
      card.appendChild(list);

      const btnRow = document.createElement('div'); btnRow.className = 'button-cluster';
      btnRow.style.marginTop = '0.7rem';
      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary'; checkBtn.textContent = 'Korrektur';
      btnRow.appendChild(checkBtn);
      card.appendChild(btnRow);

      const fb = api.utils.feedbackBox(card);
      host.appendChild(card);

      checkBtn.addEventListener('click', () => {
        const checked = inputs.filter(i => i.input.checked);
        if(checked.length === 0){ fb.bad('Bitte mindestens eine Antwort auswählen.'); return; }
        const correctTotal    = inputs.filter(i => i.correct).length;
        const correctSelected = inputs.filter(i => i.correct && i.input.checked).length;
        const wrongSelected   = inputs.filter(i => !i.correct && i.input.checked).length;
        const allCorrect = correctSelected === correctTotal;
        const noWrong   = wrongSelected === 0;
        const maxPoints = config.maxPoints || 1;
        const usePartial = config.partialCredit !== false && config.multi && correctTotal > 0;

        if(allCorrect && noWrong){
          fb.ok('Korrekt. ' + maxPoints + ' / ' + maxPoints + ' Punkte.');
          api.reportScore(maxPoints);
          return;
        }

        if(usePartial){
          const penalize = config.penalizeWrong !== false;
          const raw = penalize ? (correctSelected - wrongSelected) : correctSelected;
          const ratio = Math.max(0, raw / correctTotal);
          const pts = Math.round(ratio * maxPoints * 100) / 100;
          if(pts > 0){
            fb.neutral('Teilweise richtig: ' + pts + ' / ' + maxPoints + ' Punkte (' + correctSelected + ' von ' + correctTotal + ' richtig' + (wrongSelected ? ', ' + wrongSelected + ' falsch' : '') + ').');
            api.reportScore(pts);
          } else {
            fb.bad('Nicht richtig. 0 / ' + maxPoints + ' Punkte.');
            api.reportScore(0);
          }
        } else {
          fb.bad('Antwort nicht vollständig richtig. 0 / ' + maxPoints + ' Punkte.');
          api.reportScore(0);
        }
      });

      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const card = document.createElement('div');
      card.style.cssText = 'background:#fff; border:1px solid #d8e0e6; border-radius:18px; padding:1.2rem; margin:0;';
      const h3 = document.createElement('h3');
      h3.textContent = 'Frage';
      h3.style.cssText = 'color:#003b5c; margin:0 0 0.6rem; font-size:1rem;';
      card.appendChild(h3);
      const q = document.createElement('p');
      q.innerHTML = config.question || '<em style="color:#888">(Frage leer)</em>';
      q.style.cssText = 'margin:0 0 0.9rem; color:#111; line-height:1.45;';
      card.appendChild(q);
      const isMulti = !!config.multi;
      const list = document.createElement('div');
      list.style.cssText = 'display:grid; gap:0.5rem;';
      (config.choices || []).forEach(c => {
        const li = document.createElement('div');
        li.style.cssText = 'display:flex; align-items:center; gap:0.5rem; padding:0.6rem 0.8rem; border:1px solid #d8e0e6; border-radius:12px; background:#fff; line-height:1.35;';
        const m = document.createElement('span');
        m.style.cssText = 'color:' + (c.correct ? '#84bf66' : '#5d6872') + '; font-size:1rem; line-height:1; min-width:1rem;';
        m.textContent = c.correct ? (isMulti ? '☑' : '◉') : (isMulti ? '☐' : '○');
        li.appendChild(m);
        const t = document.createElement('span'); t.innerHTML = c.text || '';
        li.appendChild(t);
        list.appendChild(li);
      });
      card.appendChild(list);
      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'margin-top:0.7rem;';
      const btn = document.createElement('span');
      btn.textContent = 'Korrektur';
      btn.style.cssText = 'display:inline-block; background:#003b5c; color:#fff; padding:0.55rem 1.1rem; border-radius:999px; font-weight:700; font-size:0.88rem;';
      btnRow.appendChild(btn);
      card.appendChild(btnRow);
      const fb = document.createElement('div');
      fb.style.cssText = 'background:#f5f8fa; border:1px solid #d8e0e6; border-left:6px solid #a1d884; border-radius:14px; padding:0.7rem 0.9rem; margin-top:0.6rem;';
      fb.innerHTML = '<div style="font-weight:700; color:#003b5c; margin-bottom:0.2rem;">Rückmeldung</div><div style="color:#0f2d44; font-family:Courier New,monospace;">Noch keine Korrektur durchgeführt.</div>';
      card.appendChild(fb);
      host.appendChild(card);
    }
  });
})();
