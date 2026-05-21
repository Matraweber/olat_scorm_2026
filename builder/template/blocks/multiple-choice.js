(function(){
  'use strict';
  Blocks.register('multiple-choice', {
    label: 'Multiple Choice',
    description: 'Eine oder mehrere richtige Antworten auswählen.',
    category: 'Frage',
    icon: '☑',
    graded: true,
    defaultConfig(){
      // Fresh block on the canvas starts empty - the user fills it in.
      // For the welcome-page preview we expose `previewConfig` below with a
      // populated example so the modal isn't blank.
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
      const d = document.createElement('div');
      d.innerHTML = String(cfg.question || '');
      const q = (d.textContent || '').trim();
      return (q || '(Frage leer)') + ' · ' + ((cfg.choices || []).length) + ' Antworten';
    },
    validate(cfg){
      if(cfg.preset && cfg.preset !== 'custom') return [];
      const w = [];
      if(!cfg.question || !String(cfg.question).trim()) w.push('Frage ist leer.');
      if(!Array.isArray(cfg.choices) || cfg.choices.length < 2) w.push('Mindestens zwei Antwortmöglichkeiten erforderlich.');
      else if(!cfg.choices.some(c => c.correct)) w.push('Keine richtige Antwort markiert.');
      else if(cfg.choices.every(c => c.correct)) w.push('Alle Antworten als richtig markiert.');
      return w;
    },
    previewConfig(){
      return {
        blockTitle: '', preset: 'custom',
        question: 'Welche Hauptstadt gehört zu Deutschland?',
        choices: [
          { text: 'Berlin',  correct: true  },
          { text: 'München', correct: false },
          { text: 'Wien',    correct: false },
          { text: 'Hamburg', correct: false }
        ],
        multi: false, shuffle: true, maxPoints: 1,
        partialCredit: true, penalizeWrong: true
      };
    },
    builderSchema(){
      const isCustom = c => (c.preset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Multiple Choice' },
        { key:'preset', label:'Vorlage', type:'select', options:[
          {value:'custom',         label:'Manuell (leer)'},
          {value:'example-single', label:'Beispiel: Informatik, Zeitkomplexität (Einfachauswahl)'},
          {value:'example-multi',  label:'Beispiel: Informatik, OOP-Konzepte (Mehrfachauswahl)'},
          {value:'example-math',   label:'Beispiel: Mathematik, Ableitungsregeln (Einfachauswahl)'}
        ], help:'Beispiele zeigen die Möglichkeiten des Blocks. Eigene Inhalte unter „Manuell" eingeben.' },
        { type:'action', label:'↺ Zurücksetzen', action:'reset', showIf: isCustom },
        // Frage
        { type:'section', label:'Frage', key:'_sec_q', showIf: isCustom },
        { key:'question', label:'Fragetext', type:'math-textarea', rows:2, showIf: isCustom },
        // Antworten
        { type:'section', label:'Antwortmöglichkeiten', key:'_sec_choices', showIf: isCustom },
        { key:'choices', label:'Antworten', type:'list', itemLabel:'Antwort',
          showIf: isCustom,
          itemSummary: item => (item.correct ? '✓ ' : '○ ') + (item.text || '…').slice(0, 70),
          itemSchema:[
            { key:'text',    label:'Antworttext', type:'text', fullWidth:true },
            { key:'correct', label:'Ist richtig', type:'boolean' }
          ]},
        // Einstellungen
        { type:'section', label:'Einstellungen', key:'_sec_opts', showIf: isCustom },
        { key:'multi',   label:'Mehrfachauswahl erlauben', type:'boolean', showIf: isCustom },
        { key:'shuffle', label:'Antworten mischen',        type:'boolean', showIf: isCustom },
        // Bewertung
        { type:'section', label:'Bewertung', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte (gesamt)', type:'number', step:1, min:1 },
        { key:'partialCredit', label:'Teilpunkte bei Mehrfachauswahl', type:'boolean',
          help:'Jede richtig angekreuzte Antwort gibt anteilig Punkte (gesamt ÷ Anzahl richtiger Antworten).' },
        { key:'penalizeWrong', label:'Falsche Auswahl abziehen', type:'boolean',
          help:'Bei Teilpunkten: falsch angekreuzte Antworten ziehen jeweils einen Teilpunkt ab (min. 0).' }
      ];
    },
    mount(host, config, api){
      const activeConfig = mcPresetConfig(config) || config;
      const ui = api.utils.simpleQuestionCard(host, { title: activeConfig.blockTitle || 'Aufgabe', question: activeConfig.question || '' });
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
        const span = document.createElement('span'); span.innerHTML = c.text || '';
        lbl.appendChild(span);
        list.appendChild(lbl);
        inputs.push({input: inp, correct: !!c.correct});
      });
      content.appendChild(list);

      const checkBtn = document.createElement('button');
      checkBtn.type = 'button'; checkBtn.className = 'btn btn-primary'; checkBtn.textContent = 'Korrektur';
      buttons.appendChild(checkBtn);

      checkBtn.addEventListener('click', () => {
        const checked = inputs.filter(i => i.input.checked);
        if(checked.length === 0){ fb.bad('Bitte mindestens eine Antwort auswählen.'); return; }
        const correctTotal    = inputs.filter(i => i.correct).length;
        const correctSelected = inputs.filter(i => i.correct && i.input.checked).length;
        const wrongSelected   = inputs.filter(i => !i.correct && i.input.checked).length;
        const allCorrect = correctSelected === correctTotal;
        const noWrong   = wrongSelected === 0;
        const maxPoints = activeConfig.maxPoints || 1;
        const usePartial = activeConfig.partialCredit !== false && activeConfig.multi && correctTotal > 0;

        if(allCorrect && noWrong){
          fb.ok('Korrekt. ' + maxPoints + ' / ' + maxPoints + ' Punkte.');
          api.reportScore(maxPoints);
          return;
        }

        if(usePartial){
          const penalize = activeConfig.penalizeWrong !== false;
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

      api.initScore(activeConfig.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const activeConfig = mcPresetConfig(config);
      const card = document.createElement('div');
      card.style.cssText = 'background:#fff; border:1px solid #d8e0e6; border-radius:18px; padding:1.2rem; margin:0;';
      const h3 = document.createElement('h3');
      h3.textContent = 'Frage';
      h3.style.cssText = 'color:#003b5c; margin:0 0 0.6rem; font-size:1rem;';
      card.appendChild(h3);
      const q = document.createElement('p');
      q.innerHTML = activeConfig.question || '<em style="color:#888">(Frage leer)</em>';
      q.style.cssText = 'margin:0 0 0.9rem; color:#111; line-height:1.45;';
      card.appendChild(q);
      const isMulti = !!activeConfig.multi;
      const list = document.createElement('div');
      list.style.cssText = 'display:grid; gap:0.5rem;';
      (activeConfig.choices || []).forEach(c => {
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
      btnRow.style.cssText = 'margin-top:1rem;';
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

  function mcPresetConfig(config){
    if(!config || !config.preset || config.preset === 'custom') return config || {};
    const base = Object.assign({}, config, { shuffle:true, partialCredit:true, penalizeWrong:true });

    if(config.preset === 'example-single'){
      return Object.assign(base, {
        question: 'Welche Zeitkomplexität hat die binäre Suche?',
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
        question: 'Welche Konzepte gehören zur objektorientierten Programmierung? (Mehrere Antworten möglich)',
        choices: [
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
        question: 'Welche Formel gibt die Ableitung von $f(x) = x^n$ nach der Potenzregel an?',
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
