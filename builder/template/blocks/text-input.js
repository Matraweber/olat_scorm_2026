(function(){
  'use strict';
  Blocks.register('text-input', {
    label: 'Text-Eingabe',
    labelKey: 'block.text-input.label',
    description: 'Freie Text-Antwort. Vergleich exakt oder per regulärem Ausdruck.',
    descKey: 'block.text-input.description',
    category: 'Frage',
    categoryKey: 'block.category.question',
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
    summary(cfg){
      const u = window.BlockUtils;
      const empty = (u && typeof u.t === 'function') ? u.t('block.text-input.summary.empty') : '(Frage leer)';
      return cfg.question || empty;
    },
    validate(cfg){
      const u = window.BlockUtils;
      const t = (key, fallback) => (u && typeof u.t === 'function') ? u.t(key) : fallback;
      const w = [];
      if(!cfg.question || !String(cfg.question).trim()) w.push(t('block.text-input.validate.questionEmpty', 'Frage ist leer.'));
      if(!Array.isArray(cfg.answers) || cfg.answers.length === 0 || cfg.answers.every(a => !a.value)) w.push(t('block.text-input.validate.noAnswers', 'Keine akzeptierten Antworten definiert.'));
      return w;
    },
    previewConfig(){
      const u = window.BlockUtils || {};
      const locale = (u.getLocale && u.getLocale()) || 'de';
      const en = locale === 'en';
      return {
        blockTitle: '', preset: 'custom', answerMode: 'iexact',
        question: en ? 'What is the capital of Germany?' : 'Wie heißt die Hauptstadt von Deutschland?',
        answers: ['Berlin'],
        maxPoints: 1, partialKeywords: false
      };
    },
    builderSchema(){
      const isCustom = c => (c.preset || 'custom') === 'custom';
      const u = window.BlockUtils;
      const tt = (u && typeof u.t === 'function') ? u.t : (k => k);
      const MODE_LABEL = { manual: tt('block.text-input.itemModeLabel.manual'), iexact:'≈', exact:'≈', regex:'regex' };
      return [
        { key:'blockTitle', label:'Überschrift', labelKey:'block.text-input.field.blockTitle.label', type:'text', placeholder:'Text-Eingabe', placeholderKey:'block.text-input.field.blockTitle.placeholder' },
        { key:'preset', label:'Vorlage', labelKey:'block.text-input.field.preset.label', type:'select', options:[
          {value:'custom',          label:'Manuell (leer)', labelKey:'block.text-input.field.preset.option.custom'},
          {value:'example-term',    label:'Beispiel: Physik, Fachbegriff (Ohmsches Gesetz)', labelKey:'block.text-input.field.preset.option.example-term'},
          {value:'example-keyword', label:'Beispiel: Informatik, Schlüsselwörter (Mehrere Begriffe)', labelKey:'block.text-input.field.preset.option.example-keyword'},
          {value:'example-regex',   label:'Beispiel: Regex, Muster (3-stellige Zahl)', labelKey:'block.text-input.field.preset.option.example-regex'}
        ], help:'„Manuell" ist für eigene Fragen. Beispiele zeigen alle Auswertungsarten.', helpKey:'block.text-input.field.preset.help' },
        { type:'action', label:'↺ Zurücksetzen', labelKey:'block.text-input.field.reset.label', action:'reset', showIf: isCustom },
        // Question
        { type:'section', label:'Frage', labelKey:'block.text-input.field.sectionQuestion.label', key:'_sec_q', showIf: isCustom },
        { key:'question', label:'Fragetext', labelKey:'block.text-input.field.question.label', type:'math-textarea', rows:2, showIf: isCustom },
        // Antworten
        { type:'section', label:'Akzeptierte Antworten', labelKey:'block.text-input.field.sectionAnswers.label', key:'_sec_answers', showIf: isCustom },
        { key:'answerMode', label:'Auswertungsart (für alle Antworten)', labelKey:'block.text-input.field.answerMode.label', type:'select',
          showIf: isCustom,
          options:[
            {value:'iexact',   label:'Exakt: Groß-/Kleinschreibung egal (Standard)', labelKey:'block.text-input.field.answerMode.option.iexact'},
            {value:'manual',   label:'Manuell: Vergleichsart je Eintrag wählen', labelKey:'block.text-input.field.answerMode.option.manual'},
            {value:'regex',    label:'Regulärer Ausdruck: Muster wie \\d+ oder (A|B)', labelKey:'block.text-input.field.answerMode.option.regex'},
            {value:'keywords', label:'Schlüsselwörter: Teilpunkte pro gefundenem Begriff', labelKey:'block.text-input.field.answerMode.option.keywords'}
          ], help:'„Manuell" erlaubt unterschiedliche Vergleichsarten je Antworteintrag.', helpKey:'block.text-input.field.answerMode.help' },
        { key:'answers', label:'Antworten', labelKey:'block.text-input.field.answers.label', type:'list', itemLabel:'Antwort', itemLabelKey:'block.text-input.field.answers.itemLabel',
          showIf: isCustom,
          itemSummary: item => {
            const mode = MODE_LABEL[item.mode] || item.mode || '';
            const val  = (item.value || '…').slice(0, 60);
            return mode ? '[' + mode + ']  ' + val : val;
          },
          itemSchema:[
            { key:'value', label:'Antworttext oder Regex', labelKey:'block.text-input.field.answers.item.value.label', type:'text', fullWidth:true },
            { key:'mode',  label:'Vergleich', labelKey:'block.text-input.field.answers.item.mode.label', type:'select', options:[
              {value:'iexact', label:'Exakt (Groß/Klein egal)', labelKey:'block.text-input.field.answers.item.mode.option.iexact'},
              {value:'regex',  label:'Regulärer Ausdruck', labelKey:'block.text-input.field.answers.item.mode.option.regex'}
            ]}
          ]},
        // Scoring
        { type:'section', label:'Bewertung', labelKey:'block.text-input.field.sectionScoring.label', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte (gesamt)', labelKey:'block.text-input.field.maxPoints.label', type:'number', step:1, min:1 },
        { key:'partialKeywords', label:'Teilpunkte aktivieren', labelKey:'block.text-input.field.partialKeywords.label', type:'boolean',
          showIf: c => isCustom(c) && (c.answerMode || 'iexact') === 'keywords',
          help:'Jeder gefundene Antworteintrag gibt anteilige Punkte. Geeignet für Freitextantworten mit mehreren gesuchten Begriffen.', helpKey:'block.text-input.field.partialKeywords.help' }
      ];
    },
    mount(host, config, api){
      const t = (k, p) => api.utils.t(k, p);
      const l = v => api.utils.l(v);
      const activeConfig = textInputConfig(textInputPreset(config, (window.BlockUtils && window.BlockUtils.getLocale && window.BlockUtils.getLocale()) || 'de'));
      const ui = api.utils.simpleQuestionCard(host, { title: l(activeConfig.blockTitle) || t('common.task'), question: l(activeConfig.question) || '' });
      const { content, buttons, fb } = ui;

      const inp = document.createElement('input');
      inp.type = 'text'; inp.className = 'text-input';
      inp.placeholder = t('common.answerPlaceholder');
      content.appendChild(inp);

      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = t('common.check');
      buttons.appendChild(checkBtn);

      function check(){
        const got = String(inp.value || '');
        if(!got.trim()){ fb.bad(t('block.text-input.feedback.pleaseEnterAnswer')); return; }
        const answers = (activeConfig.answers || []).filter(a => a && a.value);
        const maxPoints = activeConfig.maxPoints || 1;

        if(activeConfig.partialKeywords && answers.length > 0){
          // Each answer is a keyword. Count how many appear in the input.
          let hits = 0;
          answers.forEach(a => {
            const v = String(l(a.value) || '');
            let found;
            if(a.mode === 'regex'){
              try { found = new RegExp(v).test(got); } catch{ found = false; }
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
          if(hits === answers.length) fb.ok(t('block.text-input.feedback.correctKeywords', { pts: pts, max: maxPoints, hits: hits, total: answers.length }));
          else if(hits > 0) fb.neutral(t('block.text-input.feedback.partialKeywords', { pts: pts, max: maxPoints, hits: hits, total: answers.length }));
          else fb.bad(t('block.text-input.feedback.noKeyword', { max: maxPoints }));
          return;
        }

        const ok = answers.some(a => {
          const v = String(l(a.value) || '');
          if(a.mode === 'regex'){
            try { return new RegExp('^(?:' + v + ')$').test(got); } catch{ return false; }
          }
          if(a.mode === 'exact') return got === v;
          return got.trim().toLowerCase() === v.trim().toLowerCase();
        });
        if(ok){ fb.ok(t('feedback.correctScored', { pts: maxPoints, max: maxPoints })); api.reportScore(maxPoints); }
        else { fb.bad(t('feedback.wrongScored', { pts: 0, max: maxPoints })); api.reportScore(0); }
      }
      checkBtn.addEventListener('click', check);
      inp.addEventListener('keydown', e => { if(e.key === 'Enter') check(); });

      api.initScore(activeConfig.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const u = window.BlockUtils;
      const t = (k, p) => u.t(k, p);
      const l = v => u.l(v);
      const activeConfig = textInputConfig(textInputPreset(config, (window.BlockUtils && window.BlockUtils.getLocale && window.BlockUtils.getLocale()) || 'de'));
      const wrap = u.tagPreview(host, { icon:'Aa', label: t('block.text-input.label') });
      const q = document.createElement('div');
      q.style.cssText = 'font-weight:700; color:#003b5c; margin-bottom:0.4rem; line-height:1.3;';
      q.textContent = l(activeConfig.question) || t('block.text-input.preview.questionPlaceholder');
      wrap.appendChild(q);
      if((activeConfig.answers||[]).length){
        const ans = document.createElement('div');
        ans.style.cssText = 'font-size:0.72rem; color:#5d6872; margin-bottom:0.4rem;';
        ans.textContent = t('block.text-input.preview.answersLabel') + ' ' + (activeConfig.answers||[]).map(a => l(a.value)).filter(Boolean).join(' · ');
        wrap.appendChild(ans);
      }
      const inp = document.createElement('div');
      inp.style.cssText = 'border:1px solid #c6d1d8; border-radius:6px; padding:0.4rem 0.6rem; background:#f5f8fa; color:#888;';
      inp.textContent = t('block.text-input.preview.inputPlaceholder');
      wrap.appendChild(inp);
    }
  });

  function textInputPreset(config, locale){
    if(!config || !config.preset || config.preset === 'custom') return config || {};
    const u = window.BlockUtils || {};
    const loc = locale || (u.getLocale && u.getLocale()) || 'de';
    const en = loc === 'en';
    const base = Object.assign({}, config);
    if(config.preset === 'example-term'){
      return Object.assign(base, {
        question: en
          ? 'What is the law that describes the relationship $U = R \\cdot I$?'
          : 'Wie lautet das Gesetz, das den Zusammenhang $U = R \\cdot I$ beschreibt?',
        answerMode: 'iexact',
        answers: en ? [
          { value:'Ohm\'s law',       mode:'iexact' },
          { value:'Ohms law',         mode:'iexact' },
          { value:'Law of Ohm',       mode:'iexact' }
        ] : [
          { value:'Ohmsches Gesetz', mode:'iexact' },
          { value:'Ohm\'sches Gesetz', mode:'iexact' },
          { value:'Gesetz von Ohm',   mode:'iexact' }
        ]
      });
    }
    if(config.preset === 'example-keyword'){
      return Object.assign(base, {
        question: en
          ? 'Name three core principles of object-oriented programming.'
          : 'Nennen Sie drei Grundprinzipien der objektorientierten Programmierung.',
        answerMode: 'keywords',
        answers: en ? [
          { value:'Encapsulation', mode:'iexact' },
          { value:'Inheritance',   mode:'iexact' },
          { value:'Polymorphism',  mode:'iexact' }
        ] : [
          { value:'Kapselung',      mode:'iexact' },
          { value:'Vererbung',      mode:'iexact' },
          { value:'Polymorphismus', mode:'iexact' }
        ],
        partialKeywords: true
      });
    }
    if(config.preset === 'example-regex'){
      return Object.assign(base, {
        question: en
          ? 'Enter a three-digit positive integer (100 to 999).'
          : 'Geben Sie eine dreistellige positive ganze Zahl ein (100 bis 999).',
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
