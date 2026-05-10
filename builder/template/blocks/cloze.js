(function(){
  'use strict';
  Blocks.register('cloze', {
    label: 'Lückentext',
    description: 'Text mit Lücken {{antwort}} oder {{antwort1|antwort2}} (Pipes = Alternativen).',
    category: 'Frage',
    icon: '___',
    graded: true,
    defaultConfig(){
      return {
        text: 'Die Hauptstadt von Deutschland ist {{Berlin}} und liegt am Fluss {{Spree}}.',
        ignoreCase: true,
        maxPoints: 1
      };
    },
    builderSchema(){
      return [
        { key:'text', label:'Lückentext (Lücken in {{...}}, Alternativen mit |)', type:'textarea', rows:5,
          help:'Beispiel: "f(x) = {{x^2|x*x}} ist die {{Quadrat}}-Funktion."' },
        { key:'ignoreCase', label:'Groß-/Kleinschreibung ignorieren', type:'boolean' },
        { key:'maxPoints', label:'Punkte (gesamt für alle Lücken zusammen)', type:'number', step:1, min:1 }
      ];
    },
    mount(host, config, api){
      const card = document.createElement('section');
      card.className = 'section-card block-question';
      const h = document.createElement('h3'); h.textContent = 'Lückentext'; card.appendChild(h);

      const wrap = document.createElement('div');
      wrap.className = 'cloze-wrap';
      wrap.style.lineHeight = '2.2';
      const parts = parseCloze(config.text || '');
      const inputs = [];
      parts.forEach(p => {
        if(p.kind === 'text'){
          const span = document.createElement('span');
          span.innerHTML = p.html;
          wrap.appendChild(span);
        } else {
          const inp = document.createElement('input');
          inp.type = 'text'; inp.className = 'text-input';
          inp.style.display = 'inline-block';
          inp.style.width = Math.max(80, p.maxLen * 9) + 'px';
          inp.style.margin = '0 0.2rem';
          inp.style.padding = '0.25rem 0.5rem';
          wrap.appendChild(inp);
          inputs.push({input: inp, alternatives: p.alternatives});
        }
      });
      card.appendChild(wrap);

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
        if(inputs.length === 0){ fb.neutral('Keine Lücken im Text.'); return; }
        let correct = 0;
        const cmp = config.ignoreCase ? (a,b) => a.trim().toLowerCase() === b.trim().toLowerCase() : (a,b) => a.trim() === b.trim();
        inputs.forEach(p => {
          const got = String(p.input.value || '');
          const ok = p.alternatives.some(alt => cmp(alt, got));
          p.input.style.borderColor = ok ? 'var(--accent-dark)' : 'var(--danger)';
          p.input.style.background = ok ? 'rgba(132,191,102,0.08)' : 'rgba(180,35,24,0.06)';
          if(ok) correct++;
        });
        const ratio = correct / inputs.length;
        const pts = Math.round(ratio * (config.maxPoints || 1) * 100) / 100;
        api.reportScore(pts);
        if(correct === inputs.length) fb.ok('Alle Lücken korrekt.');
        else fb.bad(correct + ' von ' + inputs.length + ' korrekt.');
      }
      checkBtn.addEventListener('click', check);

      api.initScore(config.maxPoints || 1);
      return {};
    },
    preview(host, config){
      const wrap = document.createElement('div');
      wrap.style.cssText = 'padding:0.55rem 0.75rem; font-size:0.88rem; line-height:1.7;';
      const tag = document.createElement('div');
      tag.textContent = '___  Lückentext';
      tag.style.cssText = 'color:#84bf66; font-size:0.72rem; font-weight:700; margin-bottom:0.4rem;';
      wrap.appendChild(tag);
      let html = String(config.text || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\n/g, '<br>');
      html = html.replace(/\{\{[^}]*\}\}/g, '<span style="display:inline-block; min-width:60px; border-bottom:2px dashed #d4a72a; background:#fff8e6; padding:0 0.4rem; color:#8c701b; font-weight:700;">_____</span>');
      const body = document.createElement('div'); body.innerHTML = html;
      wrap.appendChild(body);
      host.appendChild(wrap);
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
      const alts = m[1].split('|').map(s => s.trim()).filter(Boolean);
      const maxLen = Math.max.apply(null, alts.map(a => a.length).concat([4]));
      parts.push({kind:'gap', alternatives: alts, maxLen});
      last = re.lastIndex;
    }
    if(last < text.length) parts.push({kind:'text', html: htmlSafe(text.slice(last))});
    return parts;
  }
  function htmlSafe(s){ return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\n/g, '<br>'); }
})();
