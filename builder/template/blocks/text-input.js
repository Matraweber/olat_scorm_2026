(function(){
  'use strict';
  Blocks.register('text-input', {
    label: 'Text-Eingabe',
    description: 'Freie Text-Antwort. Vergleich exakt oder per regulärem Ausdruck.',
    category: 'Frage',
    icon: 'Aa',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '',
        preset: 'custom',
        answerMode: 'iexact',
        question: '',
        answers: [],
        maxPoints: 1,
        partialKeywords: false
      };
    },
    summary(cfg){ return cfg.question || '(Frage leer)'; },
    validate(cfg){
      const w = [];
      if(!cfg.question || !String(cfg.question).trim()) w.push('Frage ist leer.');
      if(!Array.isArray(cfg.answers) || cfg.answers.length === 0 || cfg.answers.every(a => !a.value)) w.push('Keine akzeptierten Antworten definiert.');
      return w;
    },
    previewConfig(){
      return {
        blockTitle: '', preset: 'custom', answerMode: 'iexact',
        question: 'Wie heißt die Hauptstadt von Deutschland?',
        answers: ['Berlin'],
        maxPoints: 1, partialKeywords: false
      };
    },
    builderSchema(){
      const isCustom = c => (c.preset || 'custom') === 'custom';
      const MODE_LABEL = { manual:'manuell', iexact:'≈', exact:'≈', regex:'regex' };
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Text-Eingabe' },
        { key:'preset', label:'Vorlage', type:'select', options:[
          {value:'custom',          label:'Manuell (leer)'},
          {value:'example-term',    label:'Beispiel: Physik, Fachbegriff (Ohmsches Gesetz)'},
          {value:'example-keyword', label:'Beispiel: Informatik, Schlüsselwörter (Mehrere Begriffe)'},
          {value:'example-regex',   label:'Beispiel: Regex, Muster (3-stellige Zahl)'}
        ], help:'„Manuell" ist für eigene Fragen. Beispiele zeigen alle Auswertungsarten.' },
        { type:'action', label:'↺ Zurücksetzen', action:'reset', showIf: isCustom },
        // Question
        { type:'section', label:'Frage', key:'_sec_q', showIf: isCustom },
        { key:'question', label:'Fragetext', type:'math-textarea', rows:2, showIf: isCustom },
        // Antworten
        { type:'section', label:'Akzeptierte Antworten', key:'_sec_answers', showIf: isCustom },
        { key:'answerMode', label:'Auswertungsart (für alle Antworten)', type:'select',
          showIf: isCustom,
          options:[
            {value:'iexact',   label:'Exakt: Groß-/Kleinschreibung egal (Standard)'},
            {value:'manual',   label:'Manuell: Vergleichsart je Eintrag wählen'},
            {value:'regex',    label:'Regulärer Ausdruck: Muster wie \\d+ oder (A|B)'},
            {value:'keywords', label:'Schlüsselwörter: Teilpunkte pro gefundenem Begriff'}
          ], help:'„Manuell" erlaubt unterschiedliche Vergleichsarten je Antworteintrag.' },
        { key:'answers', label:'Antworten', type:'list', itemLabel:'Antwort',
          showIf: isCustom,
          itemSummary: item => {
            const mode = MODE_LABEL[item.mode] || item.mode || '';
            const val  = (item.value || '…').slice(0, 60);
            return mode ? '[' + mode + ']  ' + val : val;
          },
          itemSchema:[
            { key:'value', label:'Antworttext oder Regex', type:'text', fullWidth:true },
            { key:'mode',  label:'Vergleich', type:'select', options:[
              {value:'iexact', label:'Exakt (Groß/Klein egal)'},
              {value:'regex',  label:'Regulärer Ausdruck'}
            ]}
          ]},
        // Scoring
        { type:'section', label:'Bewertung', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte (gesamt)', type:'number', step:1, min:1 },
        { key:'partialKeywords', label:'Teilpunkte aktivieren', type:'boolean',
          showIf: c => isCustom(c) && (c.answerMode || 'iexact') === 'keywords',
          help:'Jeder gefundene Antworteintrag gibt anteilige Punkte. Geeignet für Freitextantworten mit mehreren gesuchten Begriffen.' }
      ];
    },
    mount(host, config, api){
      const activeConfig = textInputConfig(textInputPreset(config));
      const ui = api.utils.simpleQuestionCard(host, { title: activeConfig.blockTitle || 'Aufgabe', question: activeConfig.question || '' });
      const { content, buttons, fb } = ui;

      const inp = document.createElement('input');
      inp.type = 'text'; inp.className = 'text-input';
      inp.placeholder = 'Antwort eingeben';
      content.appendChild(inp);

      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = 'Korrektur';
      buttons.appendChild(checkBtn);

      function check(){
        const got = String(inp.value || '');
        if(!got.trim()){ fb.bad('Bitte eine Antwort eingeben.'); return; }
        const answers = (activeConfig.answers || []).filter(a => a && a.value);
        const maxPoints = activeConfig.maxPoints || 1;

        if(activeConfig.partialKeywords && answers.length > 0){
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

      api.initScore(activeConfig.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const activeConfig = textInputConfig(textInputPreset(config));
      const u = window.BlockUtils;
      const wrap = u.tagPreview(host, { icon:'Aa', label:'Text-Eingabe' });
      const q = document.createElement('div');
      q.style.cssText = 'font-weight:700; color:#003b5c; margin-bottom:0.4rem; line-height:1.3;';
      q.textContent = activeConfig.question || '(Frage)';
      wrap.appendChild(q);
      if((activeConfig.answers||[]).length){
        const ans = document.createElement('div');
        ans.style.cssText = 'font-size:0.72rem; color:#5d6872; margin-bottom:0.4rem;';
        ans.textContent = 'Antwort(en): ' + (activeConfig.answers||[]).map(a => a.value).filter(Boolean).join(' · ');
        wrap.appendChild(ans);
      }
      const inp = document.createElement('div');
      inp.style.cssText = 'border:1px solid #c6d1d8; border-radius:6px; padding:0.4rem 0.6rem; background:#f5f8fa; color:#888;';
      inp.textContent = 'Antwort eingeben…';
      wrap.appendChild(inp);
    }
  });

  function textInputPreset(config){
    if(!config || !config.preset || config.preset === 'custom') return config || {};
    const base = Object.assign({}, config);
    if(config.preset === 'example-term'){
      return Object.assign(base, {
        question: 'Wie lautet das Gesetz, das den Zusammenhang $U = R \\cdot I$ beschreibt?',
        answerMode: 'iexact',
        answers: [
          { value:'Ohmsches Gesetz', mode:'iexact' },
          { value:'Ohm\'sches Gesetz', mode:'iexact' },
          { value:'Gesetz von Ohm',   mode:'iexact' }
        ]
      });
    }
    if(config.preset === 'example-keyword'){
      return Object.assign(base, {
        question: 'Nennen Sie drei Grundprinzipien der objektorientierten Programmierung.',
        answerMode: 'keywords',
        answers: [
          { value:'Kapselung',      mode:'iexact' },
          { value:'Vererbung',      mode:'iexact' },
          { value:'Polymorphismus', mode:'iexact' }
        ],
        partialKeywords: true
      });
    }
    if(config.preset === 'example-regex'){
      return Object.assign(base, {
        question: 'Geben Sie eine dreistellige positive ganze Zahl ein (100 bis 999).',
        answerMode: 'regex',
        answers: [
          { value:'[1-9]\\d{2}', mode:'regex' }
        ]
      });
    }
    return config;
  }

  function textInputConfig(config){
    if(!config || !config.answerMode || config.answerMode === 'manual') return config || {};
    const mode = config.answerMode;
    const answers = (config.answers || []).map(a => Object.assign({}, a, {
      mode: mode === 'keywords' ? (a.mode || 'iexact') : mode
    }));
    return Object.assign({}, config, {
      answers,
      partialKeywords: mode === 'keywords' ? (config.partialKeywords !== false) : config.partialKeywords
    });
  }
})();
