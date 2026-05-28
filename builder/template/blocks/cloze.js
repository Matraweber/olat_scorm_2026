(function(){
  'use strict';
  Blocks.register('cloze', {
    label: 'Lückentext',
    description: 'Lückentext mit freier Eingabe, Alternativen oder Dropdown-Auswahl.',
    category: 'Frage',
    icon: '___',
    graded: true,
    defaultConfig(){
      return {
        blockTitle: '', preset: 'custom',
        text: '',
        ignoreCase: true, shuffleDropdown: true, maxPoints: 1
      };
    },
    summary(cfg){
      const d = document.createElement('div');
      d.innerHTML = String(cfg.text || '');
      const t = (d.textContent || '').trim();
      return t.length > 80 ? t.slice(0, 80) + '…' : (t || '(leer)');
    },
    validate(cfg){
      if(cfg.preset && cfg.preset !== 'custom') return [];
      const w = [];
      if(!cfg.text || !String(cfg.text).includes('{{')) w.push('Keine Lücken im Text ({{Antwort}}).');
      return w;
    },
    previewConfig(){
      return {
        blockTitle: '', preset: 'custom',
        // {{...}} = Texteingabe, {{=a|b|c}} = Dropdown (a richtig).
        text: 'Die Hauptstadt Deutschlands heißt {{Berlin}}. Der größte Planet im Sonnensystem ist {{=Jupiter|Saturn|Mars}}.',
        ignoreCase: true, shuffleDropdown: true, maxPoints: 2
      };
    },
    builderSchema(){
      const isCustom = c => (c.preset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Lückentext' },
        { key:'preset', label:'Vorlage', type:'select', options:[
          {value:'custom',     label:'Manuell (leer)'},
          {value:'math-terms', label:'Beispiel: Mathematik, Quadratische Funktion'},
          {value:'ohm-law',    label:'Beispiel: Physik, Ohmsches Gesetz'}
        ], help:'Lücken-Syntax: {{antwort}} = Texteingabe · {{a|b}} = Alternativen · {{=richtig|falsch}} = Dropdown.' },
        { type:'action', label:'↺ Zurücksetzen', action:'reset', showIf: isCustom },
        { type:'section', label:'Lückentext', key:'_sec_text', showIf: isCustom },
        { key:'text', label:'Text mit Lücken', type:'textarea', rows:5, showIf: isCustom,
          help:'Lücken-Syntax:\n• {{antwort}} → Texteingabe\n• {{a|b|c}} → Eingabe mit Alternativen (alle richtig)\n• {{=richtig|falsch1|falsch2}} → Dropdown (erste Option = richtig)' },
        { type:'section', label:'Einstellungen & Bewertung', key:'_sec_opts' },
        { key:'ignoreCase',      label:'Groß-/Kleinschreibung ignorieren', type:'boolean' },
        { key:'shuffleDropdown', label:'Dropdown-Optionen mischen',        type:'boolean' },
        { key:'maxPoints', label:'Punkte (gesamt für alle Lücken)', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const activeConfig = clozePresetConfig(config);
      const card = document.createElement('section');
      card.className = 'section-card block-question';
      const h = document.createElement('h3'); h.textContent = activeConfig.blockTitle || 'Lückentext'; card.appendChild(h);

      const wrap = document.createElement('div');
      wrap.className = 'cloze-wrap';
      wrap.style.lineHeight = '2.2';
      const parts = parseCloze(activeConfig.text || '');
      const gaps = [];
      parts.forEach(p => {
        if(p.kind === 'text'){
          const span = document.createElement('span');
          span.innerHTML = p.html;
          wrap.appendChild(span);
        } else if(p.kind === 'dropdown'){
          const sel = document.createElement('select');
          sel.className = 'text-input cloze-dropdown';
          sel.style.display = 'inline-block';
          sel.style.margin = '0 0.2rem';
          sel.style.padding = '0.25rem 0.5rem';
          sel.style.width = 'auto';
          // Build options. First option is empty placeholder, then shuffled or original-order options
          const ph = document.createElement('option');
          ph.value = ''; ph.textContent = 'wählen…'; ph.disabled = true; ph.selected = true;
          sel.appendChild(ph);
          const opts = p.options.slice();
          if(activeConfig.shuffleDropdown !== false) window.BlockUtils.shuffle(opts);
          opts.forEach(o => {
            const op = document.createElement('option');
            op.value = o; op.textContent = o;
            sel.appendChild(op);
          });
          wrap.appendChild(sel);
          gaps.push({kind:'dropdown', el: sel, correct: p.correct});
        } else {
          const inp = document.createElement('input');
          inp.type = 'text'; inp.className = 'text-input';
          inp.style.display = 'inline-block';
          inp.style.width = Math.max(80, p.maxLen * 9) + 'px';
          inp.style.margin = '0 0.2rem';
          inp.style.padding = '0.25rem 0.5rem';
          wrap.appendChild(inp);
          gaps.push({kind:'text', el: inp, alternatives: p.alternatives});
        }
      });
      card.appendChild(wrap);

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
        if(gaps.length === 0){ fb.neutral('Keine Lücken im Text.'); return; }
        // No gap filled at all: prompt instead of recording a 0.
        if(gaps.every(g => String(g.el.value || '').trim() === '')){
          fb.bad('Bitte mindestens eine Lücke ausfüllen.');
          return;
        }
        let correct = 0;
        const cmpText = activeConfig.ignoreCase ? (a,b) => a.trim().toLowerCase() === b.trim().toLowerCase() : (a,b) => a.trim() === b.trim();
        gaps.forEach(g => {
          let ok = false;
          if(g.kind === 'dropdown'){
            ok = g.el.value === g.correct;
          } else {
            const got = String(g.el.value || '');
            ok = g.alternatives.some(alt => cmpText(alt, got));
          }
          g.el.style.borderColor = ok ? 'var(--accent-dark)' : 'var(--danger)';
          g.el.style.background  = ok ? 'rgba(132,191,102,0.08)' : 'rgba(180,35,24,0.06)';
          if(ok) correct++;
        });
        const ratio = correct / gaps.length;
        const pts = Math.round(ratio * (activeConfig.maxPoints || 1) * 100) / 100;
        api.reportScore(pts);
        if(correct === gaps.length) fb.ok('Alle Lücken korrekt.');
        else fb.bad(correct + ' von ' + gaps.length + ' korrekt.');
      }
      checkBtn.addEventListener('click', check);

      api.initScore(activeConfig.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const activeConfig = clozePresetConfig(config);
      const u = window.BlockUtils;
      const wrap = u.tagPreview(host, { icon:'▭', label:'Lückentext' });
      wrap.style.lineHeight = '1.7';
      wrap.style.fontSize = '0.88rem';
      let html = String(activeConfig.text || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\n/g, '<br>');
      html = html.replace(/\{\{([^}]*)\}\}/g, (m, body) => {
        if(body.trim().startsWith('=')){
          return '<span style="display:inline-block; min-width:80px; border:1px solid #1565ff; background:#eff5ff; padding:0 0.45rem; color:#1565ff; font-weight:700; border-radius:4px;">▾ Dropdown</span>';
        }
        return '<span style="display:inline-block; min-width:60px; border-bottom:2px dashed #d4a72a; background:#fff8e6; padding:0 0.4rem; color:#8c701b; font-weight:700;">_____</span>';
      });
      const body = document.createElement('div'); body.innerHTML = html;
      wrap.appendChild(body);
    }
  });

  function parseCloze(text){
    const parts = [];
    let last = 0;
    const re = /\{\{([^}]*)\}\}/g;
    let m;
    while((m = re.exec(text)) != null){
      if(m.index > last){
        parts.push({kind:'text', html: htmlSafe(text.slice(last, m.index))});
      }
      const raw = m[1].trim();
      if(raw.startsWith('=')){
        // Dropdown: =correct|distractor1|distractor2
        const opts = raw.slice(1).split('|').map(s => s.trim()).filter(Boolean);
        if(opts.length){
          parts.push({kind:'dropdown', correct: opts[0], options: opts});
        }
      } else {
        // Text input with alternatives
        const alts = raw.split('|').map(s => s.trim()).filter(Boolean);
        const maxLen = Math.max.apply(null, alts.map(a => a.length).concat([4]));
        parts.push({kind:'gap', alternatives: alts, maxLen});
      }
      last = re.lastIndex;
    }
    if(last < text.length) parts.push({kind:'text', html: htmlSafe(text.slice(last))});
    return parts;
  }
  function htmlSafe(s){ return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\n/g, '<br>'); }

  function clozePresetConfig(config){
    if(!config || !config.preset || config.preset === 'custom') return config || {};
    const presets = {
      capitals: 'Die Hauptstadt von Frankreich ist {{Paris}}. Deutschland hat die Hauptstadt {{Berlin}}. Die Hauptstadt von Österreich ist {{=Wien|Graz|Salzburg|Innsbruck}}.',
      'math-terms': 'Eine Gleichung der Form ax² + bx + c heißt {{quadratische Gleichung|Parabelgleichung}}. Die Lösungen nennt man {{Nullstellen}}. Der Graph einer quadratischen Funktion ist eine {{=Parabel|Gerade|Hyperbel|Ellipse}}.',
      'ohm-law': 'Das Ohmsche Gesetz lautet {{U = R · I|U=R*I}}. Die Einheit der Spannung ist {{=Volt|Ampere|Ohm|Watt}} und die Einheit des Widerstands ist {{Ohm|Ω}}.',
      grammar: 'Nomen schreibt man im Deutschen {{groß}}. Verben beschreiben häufig eine {{Tätigkeit|Handlung}}. Adjektive beschreiben {{=Eigenschaften|Orte|Zahlen|Artikel}}.'
    };
    return presets[config.preset] ? Object.assign({}, config, { text: presets[config.preset] }) : config;
  }
})();
