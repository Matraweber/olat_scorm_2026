(function(){
  'use strict';
  TaskTypes.register('number-base', {
    label: 'Zahlensystem-Umrechnung',
    description: 'Umrechnung zwischen Binär, Dezimal, Oktal, Hexadezimal.',
    category: 'Informatik',
    defaultConfig(){
      return {
        intro: 'Rechnen Sie die angegebene Zahl in das gewünschte Zielsystem um.',
        noteTitle: 'Hinweis',
        noteHtml: 'Hex-Werte ohne 0x-Präfix angeben (z. B. <code>1A3</code>). Groß-/Kleinschreibung egal.',
        directions: [
          { from: 'dec', to: 'bin' },
          { from: 'bin', to: 'dec' },
          { from: 'dec', to: 'hex' }
        ],
        valueRange: { min: 0, max: 255 },
        randomize: true,
        maxPoints: 1
      };
    },
    builderSchema(){
      const baseOpts = [
        {value:'bin', label:'Binär (Basis 2)'},
        {value:'oct', label:'Oktal (Basis 8)'},
        {value:'dec', label:'Dezimal (Basis 10)'},
        {value:'hex', label:'Hexadezimal (Basis 16)'}
      ];
      return [
        { key:'intro', label:'Aufgabentext (HTML)', type:'textarea', rows:3 },
        { key:'noteTitle', label:'Hinweisbox-Titel', type:'text' },
        { key:'noteHtml', label:'Hinweisbox-Inhalt (HTML)', type:'textarea', rows:2 },
        { key:'directions', label:'Erlaubte Umrechnungs-Richtungen', type:'list', itemLabel:'Richtung',
          itemSchema:[
            { key:'from', label:'Von', type:'select', options: baseOpts },
            { key:'to', label:'Nach', type:'select', options: baseOpts }
          ]},
        { key:'valueRange', label:'Wertebereich (dezimal)', type:'group', schema:[
          { key:'min', label:'Min', type:'number', step:1 },
          { key:'max', label:'Max', type:'number', step:1 }
        ]},
        { key:'randomize', label:'Zufällig wählen', type:'boolean' },
        { key:'maxPoints', label:'Punkte pro Aufgabe', type:'number', step:1, min:1 }
      ];
    },
    mount(container, config, taskMeta, api){
      const u = api.utils;
      const cfg = Object.assign(this.defaultConfig(), config || {});
      const baseLabels = {bin:'Binär', oct:'Oktal', dec:'Dezimal', hex:'Hexadezimal'};
      const baseRadix = {bin:2, oct:8, dec:10, hex:16};
      let current = null;
      let achieved = 0;

      const hero = u.el('section', {className:'hero-card', html:
        '<div><h2>' + escapeHtml(taskMeta.title || 'Aufgabe') + '</h2><p>' + (cfg.intro || '') + '</p></div>' +
        '<div class="note-box"><div class="note-title">' + escapeHtml(cfg.noteTitle || 'Hinweis') + '</div><div>' + (cfg.noteHtml || '') + '</div></div>'
      });
      container.appendChild(hero);

      const card = u.el('section', {className:'section-card'});
      card.appendChild(u.el('h3', {text:'Aufgabe'}));
      const qBox = u.el('div', {className:'formula-box', style:{marginBottom:'1rem'}});
      qBox.appendChild(u.el('div', {className:'formula-title', text:'Aufgabe'}));
      const qText = u.el('div', {className:'formula-text'});
      qBox.appendChild(qText);
      card.appendChild(qBox);

      const inpRow = u.el('div', {className:'control-group control-group-compact'});
      inpRow.appendChild(u.el('label', {text:'Antwort'}));
      const inp = u.el('input', {className:'text-input', attrs:{type:'text', placeholder:'Antwort eingeben'}});
      inpRow.appendChild(inp);
      card.appendChild(inpRow);

      const btnRow = u.el('div', {className:'button-cluster'});
      const checkBtn = u.el('button', {className:'btn btn-primary', attrs:{type:'button'}, text:'Korrektur'});
      const newBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text:'Neu generieren'});
      const nextBtn = u.el('button', {className:'btn btn-secondary', attrs:{type:'button'}, text: api.isLast() ? 'Test beenden' : 'Weiter'});
      btnRow.appendChild(checkBtn); btnRow.appendChild(newBtn); btnRow.appendChild(nextBtn);
      card.appendChild(btnRow);

      const fb = u.feedbackBox(card);
      container.appendChild(card);

      function chooseNew(){
        const directions = cfg.directions && cfg.directions.length ? cfg.directions : [{from:'dec', to:'bin'}];
        const dir = cfg.randomize !== false ? directions[Math.floor(Math.random()*directions.length)] : directions[0];
        const min = Math.max(0, Number((cfg.valueRange && cfg.valueRange.min) ?? 0));
        const max = Math.max(min + 1, Number((cfg.valueRange && cfg.valueRange.max) ?? 255));
        const valueDec = Math.floor(min + Math.random() * (max - min + 1));
        const fromStr = valueDec.toString(baseRadix[dir.from]).toUpperCase();
        const toStr = valueDec.toString(baseRadix[dir.to]).toUpperCase();
        current = { dir, valueDec, fromStr, toStr };
        achieved = 0;
        inp.value = '';
        fb.neutral('Neue Aufgabe generiert.');
        qText.innerHTML = 'Wandeln Sie <strong>' + fromStr + '</strong> aus <em>' + baseLabels[dir.from] + '</em> nach <em>' + baseLabels[dir.to] + '</em> um.';
      }

      function grade(){
        const cleaned = String(inp.value || '').trim().toUpperCase().replace(/^0X/, '').replace(/^0B/, '').replace(/\s+/g, '');
        if(!cleaned){ fb.bad('Bitte eine Antwort eingeben.'); return; }
        const valid = {bin:/^[01]+$/, oct:/^[0-7]+$/, dec:/^[0-9]+$/, hex:/^[0-9A-F]+$/}[current.dir.to];
        if(!valid.test(cleaned)){
          fb.bad('Ungültige Zeichen für ' + baseLabels[current.dir.to] + '.');
          return;
        }
        const parsed = parseInt(cleaned, baseRadix[current.dir.to]);
        if(parsed === current.valueDec){
          achieved = cfg.maxPoints || 1;
          fb.ok('Korrekt. (' + achieved + ' Punkt' + (achieved===1?'':'e') + ')');
        } else {
          achieved = 0;
          fb.bad('Nicht korrekt. Richtige Antwort: ' + current.toStr);
        }
        api.reportScore(achieved, cfg.maxPoints || 1);
      }

      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', chooseNew);
      nextBtn.addEventListener('click', () => api.goToNext());

      chooseNew();
      api.initScore(cfg.maxPoints || 1);
      return {};
    }
  });
  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
})();
