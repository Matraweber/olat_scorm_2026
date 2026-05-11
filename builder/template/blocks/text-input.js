(function(){
  'use strict';
  Blocks.register('text-input', {
    label: 'Text-Eingabe',
    description: 'Freie Text-Antwort. Vergleich exakt, ohne Groß/Klein, oder per Regex.',
    category: 'Frage',
    icon: '✎',
    graded: true,
    defaultConfig(){
      return {
        question: 'Frage hier eingeben.',
        answers: [{ value: 'Antwort', mode: 'iexact' }],
        maxPoints: 1,
        partialKeywords: false
      };
    },
    builderSchema(){
      return [
        { key:'question', label:'Frage', type:'textarea', rows:2 },
        { key:'answers', label:'Akzeptierte Antworten', type:'list', itemLabel:'Antwort',
          itemSchema:[
            { key:'value', label:'Antworttext / Regex', type:'text' },
            { key:'mode', label:'Vergleich', type:'select', options:[
              {value:'iexact', label:'Exakt (ohne Groß/Klein)'},
              {value:'exact',  label:'Exakt'},
              {value:'regex',  label:'Regex'}
            ]}
          ]},
        { key:'maxPoints', label:'Punkte (gesamt)', type:'number', step:1, min:1 },
        { key:'partialKeywords', label:'Schlüsselwort-Modus (Teilpunkte)', type:'boolean',
          help:'Statt einer Volltreffer-Prüfung wird der Eingabetext nach jedem Antworteintrag durchsucht. Pro gefundenes Schlüsselwort gibt es anteilige Punkte.' }
      ];
    },
    mount(host, config, api){
      const card = document.createElement('section');
      card.className = 'section-card block-question';
      card.innerHTML = '<h3>Frage</h3><p class="question-text"></p>';
      card.querySelector('.question-text').textContent = config.question || '';

      const inp = document.createElement('input');
      inp.type = 'text'; inp.className = 'text-input';
      inp.placeholder = 'Antwort eingeben';
      card.appendChild(inp);

      const btnRow = document.createElement('div');
      btnRow.className = 'button-cluster';
      
      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = 'Korrektur';
      btnRow.appendChild(checkBtn);
      card.appendChild(btnRow);

      const fb = api.utils.feedbackBox(card);
      host.appendChild(card);

      function check(){
        const got = String(inp.value || '');
        if(!got.trim()){ fb.bad('Bitte eine Antwort eingeben.'); return; }
        const answers = (config.answers || []).filter(a => a && a.value);
        const maxPoints = config.maxPoints || 1;

        if(config.partialKeywords && answers.length > 0){
          // Each answer is a keyword. Count how many appear in the input.
          let hits = 0;
          answers.forEach(a => {
            const v = String(a.value || '');
            let found;
            if(a.mode === 'regex'){
              try { found = new RegExp(v).test(got); } catch(e){ found = false; }
            } else if(a.mode === 'exact'){
              found = got.indexOf(v) >= 0;
            } else {
              found = got.toLowerCase().indexOf(v.toLowerCase()) >= 0;
            }
            if(found) hits++;
          });
          const ratio = hits / answers.length;
          const pts = Math.round(ratio * maxPoints * 100) / 100;
          api.reportScore(pts);
          if(hits === answers.length) fb.ok('Korrekt. ' + pts + ' / ' + maxPoints + ' Punkte (' + hits + ' von ' + answers.length + ' Schlüsselwörtern).');
          else if(hits > 0) fb.neutral('Teilweise richtig: ' + pts + ' / ' + maxPoints + ' Punkte (' + hits + ' von ' + answers.length + ' Schlüsselwörtern gefunden).');
          else fb.bad('Kein Schlüsselwort gefunden. 0 / ' + maxPoints + ' Punkte.');
          return;
        }

        const ok = answers.some(a => {
          const v = String(a.value || '');
          if(a.mode === 'regex'){
            try { return new RegExp('^(?:' + v + ')$').test(got); } catch(e){ return false; }
          }
          if(a.mode === 'exact') return got === v;
          return got.trim().toLowerCase() === v.trim().toLowerCase();
        });
        if(ok){ fb.ok('Korrekt. ' + maxPoints + ' / ' + maxPoints + ' Punkte.'); api.reportScore(maxPoints); }
        else { fb.bad('Nicht korrekt. 0 / ' + maxPoints + ' Punkte.'); api.reportScore(0); }
      }
      checkBtn.addEventListener('click', check);
      inp.addEventListener('keydown', e => { if(e.key === 'Enter') check(); });

      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.55rem 0.75rem; font-size:0.85rem;';
      const tag = document.createElement('div');
      tag.textContent = '✎  Text-Eingabe';
      tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700; margin-bottom:0.3rem;';
      wrap.appendChild(tag);
      const q = document.createElement('div');
      q.style.cssText = 'font-weight:700; color:#003b5c; margin-bottom:0.4rem; line-height:1.3;';
      q.textContent = config.question || '(Frage)';
      wrap.appendChild(q);
      if((config.answers||[]).length){
        const ans = document.createElement('div');
        ans.style.cssText = 'font-size:0.72rem; color:#5d6872; margin-bottom:0.4rem;';
        ans.textContent = 'Antwort(en): ' + (config.answers||[]).map(a => a.value).filter(Boolean).join(' · ');
        wrap.appendChild(ans);
      }
      const inp = document.createElement('div');
      inp.style.cssText = 'border:1px solid #c6d1d8; border-radius:6px; padding:0.4rem 0.6rem; background:#f5f8fa; color:#888;';
      inp.textContent = '⏤ Antwort eingeben';
      wrap.appendChild(inp);
      host.appendChild(wrap);
    }
  });
})();
