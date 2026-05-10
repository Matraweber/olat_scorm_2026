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
        maxPoints: 1
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
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
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
        const correctChoices = inputs.filter(i => i.correct);
        const allCorrect = correctChoices.every(i => i.input.checked);
        const noWrong   = inputs.every(i => !i.input.checked || i.correct);
        if(allCorrect && noWrong){ fb.ok('Korrekt.'); api.reportScore(config.maxPoints || 1); }
        else { fb.bad('Antwort nicht vollständig richtig.'); api.reportScore(0); }
      });

      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.55rem 0.75rem; font-size:0.85rem; height:100%; overflow:hidden;';
      const q = document.createElement('div');
      q.innerHTML = config.question || '<em style="color:#888">(Frage leer)</em>';
      q.style.cssText = 'font-weight:700; color:#003b5c; margin-bottom:0.4rem; line-height:1.3;';
      wrap.appendChild(q);
      const isMulti = !!config.multi;
      (config.choices || []).slice(0, 6).forEach(c => {
        const li = document.createElement('div');
        li.style.cssText = 'display:flex; align-items:center; gap:0.45rem; padding:0.18rem 0; line-height:1.3;';
        const m = document.createElement('span');
        m.style.cssText = 'color:' + (c.correct ? '#84bf66' : '#888') + '; font-size:1rem; line-height:1; min-width:1rem;';
        m.textContent = c.correct ? (isMulti ? '☑' : '◉') : (isMulti ? '☐' : '○');
        li.appendChild(m);
        const t = document.createElement('span'); t.innerHTML = c.text || '';
        li.appendChild(t);
        wrap.appendChild(li);
      });
      if((config.choices || []).length > 6){
        const more = document.createElement('div');
        more.style.cssText = 'padding-left:1.5rem; color:#888; font-size:0.78rem; font-style:italic;';
        more.textContent = '… +' + ((config.choices.length) - 6) + ' weitere';
        wrap.appendChild(more);
      }
      host.appendChild(wrap);
    }
  });
})();
