(function(){
  'use strict';
  TaskTypes.register('multiple-choice', {
    label: 'Multiple Choice',
    description: 'Eine oder mehrere richtige Antworten auswählen.',
    category: 'Allgemein',
    defaultConfig(){
      return {
        intro: 'Wählen Sie die richtige(n) Antwort(en).',
        noteTitle: '',
        noteHtml: '',
        question: 'Beispielfrage: Welche Aussage ist richtig?',
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
        { key:'intro', label:'Aufgabentext (HTML)', type:'textarea', rows:2 },
        { key:'noteTitle', label:'Hinweisbox-Titel (optional)', type:'text' },
        { key:'noteHtml', label:'Hinweisbox-Inhalt (HTML, optional)', type:'textarea', rows:2 },
        { key:'question', label:'Frage', type:'textarea', rows:2 },
        { key:'choices', label:'Antwortmöglichkeiten', type:'list', itemLabel:'Antwort',
          itemSchema:[
            { key:'text', label:'Text', type:'text' },
            { key:'correct', label:'Richtig?', type:'boolean' }
          ]},
        { key:'multi', label:'Mehrfachauswahl erlauben', type:'boolean' },
        { key:'shuffle', label:'Antworten mischen', type:'boolean' },
        { key:'maxPoints', label:'Punkte für korrekte Antwort', type:'number', step:1, min:1 }
      ];
    },
    mount(container, config, taskMeta, api){
      const u = api.utils;
      const cfg = Object.assign(this.defaultConfig(), config || {});
      let achieved = 0;

      let heroHtml = '<div><h2>' + escapeHtml(taskMeta.title || 'Aufgabe') + '</h2><p>' + (cfg.intro || '') + '</p></div>';
      heroHtml += cfg.noteHtml ? '<div class="note-box"><div class="note-title">' + escapeHtml(cfg.noteTitle || 'Hinweis') + '</div><div>' + cfg.noteHtml + '</div></div>' : '<div></div>';
      const hero = u.el('section', {className:'hero-card', html: heroHtml});
      container.appendChild(hero);

      const card = u.el('section', {className:'section-card'});
      card.appendChild(u.el('h3', {text:'Frage'}));
      card.appendChild(u.el('p', {html: cfg.question || ''}));
      const list = u.el('div', {className:'choice-list'});
      card.appendChild(list);

      const choices = (cfg.choices || []).slice();
      if(cfg.shuffle){
        for(let i = choices.length - 1; i > 0; i--){
          const j = Math.floor(Math.random() * (i + 1));
          [choices[i], choices[j]] = [choices[j], choices[i]];
        }
      }
      const inputs = [];
      choices.forEach((c, i) => {
        const id = 'mc_' + i + '_' + Math.random().toString(36).slice(2,7);
        const lbl = u.el('label', {className:'choice-item', attrs:{for: id}});
        const inp = u.el('input', {attrs:{
          type: cfg.multi ? 'checkbox' : 'radio',
          name: 'mc_' + Math.random().toString(36).slice(2,7),
          id
        }});
        if(!cfg.multi) inp.name = 'mc_choice_group';
        lbl.appendChild(inp);
        lbl.appendChild(u.el('span', {html: c.text || ''}));
        list.appendChild(lbl);
        inputs.push({input: inp, correct: !!c.correct});
      });

      const btnRow = u.el('div', {className:'button-cluster', style:{marginTop:'1rem'}});
      const checkBtn = u.el('button', {className:'btn btn-primary', attrs:{type:'button'}, text:'Korrektur'});
      const nextBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text: api.isLast() ? 'Test beenden' : 'Weiter'});
      btnRow.appendChild(checkBtn); btnRow.appendChild(nextBtn);
      card.appendChild(btnRow);

      const fb = u.feedbackBox(card);
      container.appendChild(card);

      function grade(){
        const checked = inputs.filter(i => i.input.checked);
        if(checked.length === 0){ fb.bad('Bitte mindestens eine Antwort auswählen.'); return; }
        const correctChoices = inputs.filter(i => i.correct);
        const allCorrectChosen = correctChoices.every(i => i.input.checked);
        const noWrongChosen = inputs.every(i => !i.input.checked || i.correct);
        if(allCorrectChosen && noWrongChosen){
          achieved = cfg.maxPoints || 1;
          fb.ok('Korrekt.');
        } else {
          achieved = 0;
          fb.bad('Antwort nicht vollständig richtig.');
        }
        api.reportScore(achieved, cfg.maxPoints || 1);
      }

      checkBtn.addEventListener('click', grade);
      nextBtn.addEventListener('click', () => api.goToNext());
      api.initScore(cfg.maxPoints || 1);
      return {};
    }
  });
  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
})();
