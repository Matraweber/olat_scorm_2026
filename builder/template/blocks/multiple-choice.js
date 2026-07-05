(function(){
  'use strict';
  Blocks.register('multiple-choice', {
    label: 'Multiple Choice',
    labelKey: 'block.multiple-choice.label',
    description: 'Eine oder mehrere richtige Antworten auswählen.',
    descKey: 'block.multiple-choice.description',
    category: 'Frage',
    categoryKey: 'block.category.question',
    icon: '☑',
    graded: true,
    defaultConfig(){
      // Fresh block starts empty; previewConfig() supplies a populated demo.
      return {
        blockTitle: '',
        preset: 'custom',
        question: '',
        choices: [],
        multi: false,
        shuffle: true,
        maxPoints: 1,
        partialCredit: true,
        penalizeWrong: true
      };
    },
    summary(cfg){
      const t = (window.BlockUtils && window.BlockUtils.t) || (k => k);
      const d = document.createElement('div');
      d.innerHTML = String(cfg.question || '');
      const q = (d.textContent || '').trim();
      const head = q || t('block.multiple-choice.summary.empty');
      return head + ' · ' + t('block.multiple-choice.summary.answersSuffix', { count: (cfg.choices || []).length });
    },
    validate(cfg){
      if(cfg.preset && cfg.preset !== 'custom') return [];
      const t = (window.BlockUtils && window.BlockUtils.t) || (k => k);
      const w = [];
      if(!cfg.question || !String(cfg.question).trim()) w.push(t('block.multiple-choice.validate.questionEmpty'));
      if(!Array.isArray(cfg.choices) || cfg.choices.length < 2) w.push(t('block.multiple-choice.validate.minTwoChoices'));
      else if(!cfg.choices.some(c => c.correct)) w.push(t('block.multiple-choice.validate.noCorrect'));
      else if(cfg.choices.every(c => c.correct)) w.push(t('block.multiple-choice.validate.allCorrect'));
      return w;
    },
    previewConfig(){
      const t = (window.BlockUtils && window.BlockUtils.t) || (k => k);
      return {
        blockTitle: '', preset: 'custom',
        question: t('block.multiple-choice.preview.question'),
        choices: [
          { text: t('block.multiple-choice.preview.choices.correct'),  correct: true  },
          { text: t('block.multiple-choice.preview.choices.option1'),  correct: false },
          { text: t('block.multiple-choice.preview.choices.option2'),  correct: false },
          { text: t('block.multiple-choice.preview.choices.option3'),  correct: false }
        ],
        multi: false, shuffle: true, maxPoints: 1,
        partialCredit: true, penalizeWrong: true
      };
    },
    builderSchema(){
      const isCustom = c => (c.preset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Überschrift', labelKey:'block.multiple-choice.field.blockTitle.label', type:'text', placeholder:'Multiple Choice', placeholderKey:'block.multiple-choice.field.blockTitle.placeholder' },
        { key:'preset', label:'Vorlage', labelKey:'block.multiple-choice.field.preset.label', type:'select', options:[
          {value:'custom',         label:'Manuell (leer)', labelKey:'block.multiple-choice.field.preset.option.custom'},
          {value:'example-single', label:'Beispiel: Informatik, Zeitkomplexität (Einfachauswahl)', labelKey:'block.multiple-choice.field.preset.option.example-single'},
          {value:'example-multi',  label:'Beispiel: Informatik, OOP-Konzepte (Mehrfachauswahl)', labelKey:'block.multiple-choice.field.preset.option.example-multi'},
          {value:'example-math',   label:'Beispiel: Mathematik, Ableitungsregeln (Einfachauswahl)', labelKey:'block.multiple-choice.field.preset.option.example-math'}
        ], help:'Beispiele zeigen die Möglichkeiten des Blocks. Eigene Inhalte unter „Manuell" eingeben.', helpKey:'block.multiple-choice.field.preset.help' },
        { type:'action', label:'↺ Zurücksetzen', labelKey:'block.multiple-choice.field.reset.label', action:'reset', showIf: isCustom },
        { type:'section', label:'Frage', labelKey:'block.multiple-choice.field.sectionQuestion.label', key:'_sec_q', showIf: isCustom },
        { key:'question', label:'Fragetext', labelKey:'block.multiple-choice.field.question.label', type:'math-textarea', rows:2, showIf: isCustom },
        { type:'section', label:'Antwortmöglichkeiten', labelKey:'block.multiple-choice.field.sectionChoices.label', key:'_sec_choices', showIf: isCustom },
        { key:'choices', label:'Antworten', labelKey:'block.multiple-choice.field.choices.label', type:'list', itemLabel:'Antwort', itemLabelKey:'block.multiple-choice.field.choices.itemLabel',
          showIf: isCustom,
          itemSummary: item => (item.correct ? '✓ ' : '○ ') + (item.text || '…').slice(0, 70),
          itemSchema:[
            { key:'text',    label:'Antworttext', labelKey:'block.multiple-choice.field.choices.item.text.label', type:'text', fullWidth:true },
            { key:'correct', label:'Ist richtig', labelKey:'block.multiple-choice.field.choices.item.correct.label', type:'boolean' }
          ]},
        { type:'section', label:'Einstellungen', labelKey:'block.multiple-choice.field.sectionSettings.label', key:'_sec_opts', showIf: isCustom },
        { key:'multi',   label:'Mehrfachauswahl erlauben', labelKey:'block.multiple-choice.field.multi.label', type:'boolean', showIf: isCustom },
        { key:'shuffle', label:'Antworten mischen', labelKey:'block.multiple-choice.field.shuffle.label',        type:'boolean', showIf: isCustom },
        { type:'section', label:'Bewertung', labelKey:'block.multiple-choice.field.sectionScoring.label', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte (gesamt)', labelKey:'block.multiple-choice.field.maxPoints.label', type:'number', step:1, min:1 },
        { key:'partialCredit', label:'Teilpunkte bei Mehrfachauswahl', labelKey:'block.multiple-choice.field.partialCredit.label', type:'boolean',
          help:'Jede richtig angekreuzte Antwort gibt anteilig Punkte (gesamt ÷ Anzahl richtiger Antworten).', helpKey:'block.multiple-choice.field.partialCredit.help' },
        { key:'penalizeWrong', label:'Falsche Auswahl abziehen', labelKey:'block.multiple-choice.field.penalizeWrong.label', type:'boolean',
          help:'Bei Teilpunkten: falsch angekreuzte Antworten ziehen jeweils einen Teilpunkt ab (min. 0).', helpKey:'block.multiple-choice.field.penalizeWrong.help' }
      ];
    },
    mount(host, config, api){
      const activeConfig = mcPresetConfig(config) || config;
      const title = api.utils.l(activeConfig.blockTitle) || api.utils.t('common.task');
      const questionText = api.utils.l(activeConfig.question) || '';
      const ui = api.utils.simpleQuestionCard(host, { title: title, question: questionText });
      const { content, buttons, fb } = ui;

      const list = document.createElement('div'); list.className = 'choice-list';
      const choices = (activeConfig.choices || []).slice();
      if(activeConfig.shuffle) window.BlockUtils.shuffle(choices);
      const groupName = api.blockId + '_grp';
      const inputs = [];
      choices.forEach((c, i) => {
        const id = api.blockId + '_c' + i;
        const lbl = document.createElement('label'); lbl.className = 'choice-item'; lbl.htmlFor = id;
        const inp = document.createElement('input');
        inp.type = activeConfig.multi ? 'checkbox' : 'radio';
        inp.id = id; inp.name = groupName;
        lbl.appendChild(inp);
        // textContent (not innerHTML) so authored choice text cannot inject
        // markup. Math still renders via the cell-level renderMath in runtime.js.
        const span = document.createElement('span'); span.textContent = api.utils.l(c.text) || '';
        lbl.appendChild(span);
        list.appendChild(lbl);
        inputs.push({input: inp, correct: !!c.correct});
      });
      content.appendChild(list);

      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary'; checkBtn.textContent = api.utils.t('common.check');
      buttons.appendChild(checkBtn);

      checkBtn.addEventListener('click', () => {
        const checked = inputs.filter(i => i.input.checked);
        if(checked.length === 0){ fb.bad(api.utils.t('feedback.chooseAtLeastOne')); return; }
        const correctTotal    = inputs.filter(i => i.correct).length;
        const correctSelected = inputs.filter(i => i.correct && i.input.checked).length;
        const wrongSelected   = inputs.filter(i => !i.correct && i.input.checked).length;
        const allCorrect = correctSelected === correctTotal;
        const noWrong   = wrongSelected === 0;
        const maxPoints = activeConfig.maxPoints || 1;
        const usePartial = activeConfig.partialCredit !== false && activeConfig.multi && correctTotal > 0;

        if(allCorrect && noWrong){
          fb.ok(api.utils.t('feedback.correctScored', { pts: maxPoints, max: maxPoints }));
          api.reportScore(maxPoints);
          return;
        }

        if(usePartial){
          const penalize = activeConfig.penalizeWrong !== false;
          const raw = penalize ? (correctSelected - wrongSelected) : correctSelected;
          const ratio = Math.max(0, raw / correctTotal);
          const pts = Math.round(ratio * maxPoints * 100) / 100;
          if(pts > 0){
            fb.neutral(api.utils.t('block.multiple-choice.partialDetail', {
              pts: pts,
              max: maxPoints,
              correctSelected: correctSelected,
              correctTotal: correctTotal,
              wrongSuffix: wrongSelected ? api.utils.t('block.multiple-choice.wrongSuffix', { wrong: wrongSelected }) : ''
            }));
            api.reportScore(pts);
          } else {
            fb.bad(api.utils.t('feedback.wrongScored', { pts: 0, max: maxPoints }));
            api.reportScore(0);
          }
        } else {
          fb.bad(api.utils.t('feedback.notFullyCorrect', { pts: 0, max: maxPoints }));
          api.reportScore(0);
        }
      });

      api.initScore(activeConfig.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const activeConfig = mcPresetConfig(config);
      const card = document.createElement('div');
      card.className = 'bp-card';
      const h3 = document.createElement('h3');
      h3.textContent = window.BlockUtils.t('common.question');
      card.appendChild(h3);
      const q = document.createElement('p');
      const questionText = window.BlockUtils.l(activeConfig.question);
      if(questionText && String(questionText).trim()){
        q.textContent = questionText;
      } else {
        const em = document.createElement('em');
        em.style.color = '#888';
        em.textContent = window.BlockUtils.t('block.multiple-choice.questionEmpty');
        q.appendChild(em);
      }
      card.appendChild(q);
      const isMulti = !!activeConfig.multi;
      const list = document.createElement('div');
      list.className = 'bp-choice-list';
      (activeConfig.choices || []).forEach(c => {
        const li = document.createElement('div');
        li.className = 'bp-choice';
        const m = document.createElement('span');
        m.className = 'bp-choice-marker' + (c.correct ? ' is-correct' : '');
        m.textContent = c.correct ? (isMulti ? '☑' : '◉') : (isMulti ? '☐' : '○');
        li.appendChild(m);
        const t = document.createElement('span'); t.textContent = window.BlockUtils.l(c.text) || '';
        li.appendChild(t);
        list.appendChild(li);
      });
      card.appendChild(list);
      const btnRow = document.createElement('div');
      btnRow.style.marginTop = '1rem';
      const btn = document.createElement('span');
      btn.textContent = window.BlockUtils.t('common.check');
      btn.className = 'bp-btn';
      btnRow.appendChild(btn);
      card.appendChild(btnRow);
      host.appendChild(card);
    }
  });

  function mcPresetConfig(config, locale){
    if(!config || !config.preset || config.preset === 'custom') return config || {};
    const base = Object.assign({}, config, { shuffle:true, partialCredit:true, penalizeWrong:true });
    const u = window.BlockUtils || {};
    const loc = locale || (u.getLocale && u.getLocale()) || 'de';
    const en = loc === 'en';

    if(config.preset === 'example-single'){
      return Object.assign(base, {
        question: en
          ? 'What is the time complexity of binary search?'
          : 'Welche Zeitkomplexität hat die binäre Suche?',
        choices: [
          { text:'O(log n)', correct:true  },
          { text:'O(n)',     correct:false },
          { text:'O(n²)',   correct:false },
          { text:'O(1)',     correct:false }
        ],
        multi: false
      });
    }
    if(config.preset === 'example-multi'){
      return Object.assign(base, {
        question: en
          ? 'Which concepts belong to object-oriented programming? (Multiple answers possible)'
          : 'Welche Konzepte gehören zur objektorientierten Programmierung? (Mehrere Antworten möglich)',
        choices: en
          ? [
              { text:'Encapsulation',  correct:true  },
              { text:'Inheritance',    correct:true  },
              { text:'Polymorphism',   correct:true  },
              { text:'Sequentiality',  correct:false }
            ]
          : [
              { text:'Kapselung',      correct:true  },
              { text:'Vererbung',      correct:true  },
              { text:'Polymorphismus', correct:true  },
              { text:'Sequentialität', correct:false }
            ],
        multi: true
      });
    }
    if(config.preset === 'example-math'){
      return Object.assign(base, {
        question: en
          ? 'Which formula gives the derivative of $f(x) = x^n$ according to the power rule?'
          : 'Welche Formel gibt die Ableitung von $f(x) = x^n$ nach der Potenzregel an?',
        choices: [
          { text:'$f\'(x) = n \\cdot x^{n-1}$', correct:true  },
          { text:'$f\'(x) = x^{n+1}$',           correct:false },
          { text:'$f\'(x) = n \\cdot x^n$',      correct:false },
          { text:'$f\'(x) = (n-1) \\cdot x^n$',  correct:false }
        ],
        multi: false
      });
    }
    return config;
  }
})();
