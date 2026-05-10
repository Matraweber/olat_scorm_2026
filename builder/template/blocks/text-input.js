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
        maxPoints: 1
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
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
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
      btnRow.style.marginTop = '0.7rem';
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
        const answers = config.answers || [];
        const ok = answers.some(a => {
          const v = String(a.value || '');
          if(a.mode === 'regex'){
            try { return new RegExp('^(?:' + v + ')$').test(got); } catch(e){ return false; }
          }
          if(a.mode === 'exact') return got === v;
          return got.trim().toLowerCase() === v.trim().toLowerCase();
        });
        if(ok){ fb.ok('Korrekt.'); api.reportScore(config.maxPoints || 1); }
        else { fb.bad('Nicht korrekt.'); api.reportScore(0); }
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
