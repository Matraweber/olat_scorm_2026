// ============================================================================
// survey.js: Umfrage / Feedback block - non-graded feedback collection
// with three question types: rating (1-5 stars), single-select (radio
// buttons), and free text. Answers are stored in cmi.suspend_data so the
// LMS records them anonymously per learner. The block never affects the
// score (graded=false) - it's purely formative feedback.
// ============================================================================
(function(){
  'use strict';

  function el(tag, props){
    const e = document.createElement(tag);
    if(props && props.style) e.style.cssText = props.style;
    return e;
  }

  Blocks.register('survey', {
    label: 'Umfrage',
    description: 'Anonymes Feedback (Sternebewertung, Auswahl, Freitext). Wird nicht bewertet.',
    category: 'Inhalt',
    icon: 'survey',
    graded: false,
    defaultConfig(){
      return {
        title: 'Feedback zu dieser Aufgabe',
        intro: '',
        questions: []
      };
    },
    previewConfig(){
      return {
        title: 'Feedback zu dieser Aufgabe',
        intro: 'Ihre Rückmeldung hilft uns, die Lerneinheit zu verbessern. Sie ist anonym.',
        questions: [
          { type:'rating', prompt:'Wie bewerten Sie diese Aufgabe?', scale:5 },
          { type:'select', prompt:'Welcher Teil war am hilfreichsten?', options:'Theorie\nBeispiele\nAufgabe\nLösung' },
          { type:'text',   prompt:'Was hätten Sie sich anders gewünscht?', placeholder:'Optional, freier Text …' }
        ]
      };
    },
    builderSchema(){
      return [
        { key:'title', label:'Überschrift', type:'text', placeholder:'z. B. „Feedback zu dieser Aufgabe"' },
        { key:'intro', label:'Einleitungstext (optional)', type:'text', placeholder:'Hinweis zur Anonymität, Zweck, …' },
        { key:'questions', label:'Fragen', type:'list', itemLabel:'Frage',
          itemSummary: item => item.prompt || '(leer)',
          itemSchema:[
            { key:'type', label:'Fragetyp', type:'select', options:[
              {value:'rating', label:'Sternebewertung (1 bis N Sterne)'},
              {value:'select', label:'Einfachauswahl (Optionen, 1 Antwort)'},
              {value:'text',   label:'Freitext'}
            ]},
            { key:'prompt', label:'Frage', type:'text', placeholder:'z. B. „Wie bewerten Sie …?"' },
            { key:'scale', label:'Anzahl Sterne (nur Sternebewertung)', type:'number', default:5 },
            { key:'options', label:'Antwortoptionen (eine pro Zeile, nur Einfachauswahl)', type:'textarea', rows:4, placeholder:'Option A\nOption B\nOption C' },
            { key:'placeholder', label:'Platzhaltertext (nur Freitext)', type:'text', placeholder:'Optional …' }
          ]
        }
      ];
    },
    mount(host, config, api){
      const wrap = document.createElement('section');
      wrap.className = 'survey-block';
      wrap.style.cssText = 'padding:1rem 1.2rem 1.1rem; border-radius:12px; background:#fffaf2; border:1px solid #f0e0bc;';

      if(config.title){
        const t = document.createElement('h3');
        t.textContent = config.title;
        t.style.cssText = 'margin:0 0 0.4rem 0; color:var(--primary, #003b5c); font-size:1.05rem; font-weight:800;';
        wrap.appendChild(t);
      }
      if(config.intro){
        const i = document.createElement('p');
        i.textContent = config.intro;
        i.style.cssText = 'margin:0 0 0.8rem 0; color:#5d6872; font-size:0.92rem;';
        wrap.appendChild(i);
      }

      const questions = Array.isArray(config.questions) ? config.questions : [];
      if(questions.length === 0){
        const ph = document.createElement('div');
        ph.style.cssText = 'color:var(--muted, #6a7986); font-style:italic; font-size:0.9rem;';
        ph.textContent = '(noch keine Fragen)';
        wrap.appendChild(ph);
        host.appendChild(wrap);
        return {};
      }

      const form = document.createElement('div');
      form.style.cssText = 'display:grid; gap:0.9rem;';
      const answers = Array(questions.length).fill('');

      questions.forEach((q, idx) => {
        if(!q || !q.prompt) return;
        const block = document.createElement('div');
        block.style.cssText = 'display:flex; flex-direction:column; gap:0.35rem;';
        const label = document.createElement('div');
        label.textContent = (idx + 1) + '. ' + q.prompt;
        label.style.cssText = 'font-weight:700; color:#2d3a44; font-size:0.94rem;';
        block.appendChild(label);

        if(q.type === 'rating'){
          const scale = Math.max(2, Math.min(10, Number(q.scale) || 5));
          const row = document.createElement('div');
          row.style.cssText = 'display:flex; gap:0.25rem;';
          for(let s = 1; s <= scale; s++){
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.style.cssText = 'background:none; border:none; padding:0.1rem 0.2rem; cursor:pointer; font-size:1.4rem; line-height:1; color:#c6b78a; transition:color 120ms ease;';
            btn.textContent = '★';
            btn.setAttribute('aria-label', s + ' von ' + scale + ' Sternen');
            btn.addEventListener('click', () => {
              answers[idx] = s;
              row.querySelectorAll('button').forEach((b, i) => {
                b.style.color = (i < s) ? '#e0a500' : '#c6b78a';
              });
            });
            row.appendChild(btn);
          }
          block.appendChild(row);
        } else if(q.type === 'select'){
          const opts = String(q.options || '').split('\n').map(o => o.trim()).filter(Boolean);
          opts.forEach((opt, i) => {
            const lbl = document.createElement('label');
            lbl.style.cssText = 'display:flex; gap:0.5rem; align-items:center; padding:0.35rem 0.5rem; border-radius:6px; cursor:pointer; transition:background 100ms;';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'survey-q-' + idx;
            radio.value = opt;
            radio.addEventListener('change', () => { answers[idx] = opt; });
            const span = document.createElement('span');
            span.textContent = opt;
            lbl.appendChild(radio); lbl.appendChild(span);
            lbl.addEventListener('mouseenter', () => { lbl.style.background = 'rgba(0,59,92,0.05)'; });
            lbl.addEventListener('mouseleave', () => { lbl.style.background = ''; });
            block.appendChild(lbl);
          });
        } else {
          // text
          const ta = document.createElement('textarea');
          ta.rows = 3;
          ta.placeholder = q.placeholder || '';
          ta.style.cssText = 'width:100%; padding:0.5rem 0.7rem; border:1px solid #d2dce5; border-radius:7px; font:inherit; font-size:0.92rem; resize:vertical; box-sizing:border-box;';
          ta.addEventListener('input', () => { answers[idx] = ta.value; });
          block.appendChild(ta);
        }
        form.appendChild(block);
      });

      // Submit button - persists answers to suspend_data if API available.
      // In builder-preview the api has no persist() function, so we mark
      // the button disabled to make clear that this is "live preview" and
      // clicking would do nothing.
      const submit = document.createElement('button');
      submit.type = 'button';
      submit.textContent = 'Absenden';
      const previewMode = !(api && typeof api.persist === 'function');
      submit.disabled = previewMode;
      submit.style.cssText = 'margin-top:0.4rem; padding:0.55rem 1.2rem; background:var(--primary, #003b5c); color:#fff; border:none; border-radius:8px; font-weight:700; cursor:' + (previewMode ? 'default' : 'pointer') + '; opacity:' + (previewMode ? '0.55' : '1') + '; align-self:flex-start;';

      const ack = document.createElement('div');
      ack.style.cssText = 'display:none; color:#2c7a3f; font-weight:700; font-size:0.92rem;';
      ack.textContent = '✓ Vielen Dank für Ihr Feedback.';

      if(!previewMode){
        submit.addEventListener('click', () => {
          try { api.persist({ answers: answers, ts: Date.now() }); } catch(e){}
          submit.disabled = true;
          submit.style.opacity = '0.55';
          submit.style.cursor = 'default';
          submit.textContent = 'Gesendet';
          ack.style.display = 'block';
        });
      }

      form.appendChild(submit);
      form.appendChild(ack);
      wrap.appendChild(form);
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      // Pass an empty api so mount() detects preview-mode and disables submit.
      this.mount(host, config, {});
    }
  });
})();
