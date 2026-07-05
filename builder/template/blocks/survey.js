// survey.js: Non-graded feedback. Three question types: rating, single-select,
// free text. Answers persist to cmi.suspend_data via api.persist().
(function(){
  'use strict';

  Blocks.register('survey', {
    label: 'Umfrage',
    labelKey: 'block.survey.label',
    description: 'Anonymes Feedback (Sternebewertung, Auswahl, Freitext). Wird nicht bewertet.',
    descKey: 'block.survey.description',
    category: 'Medien & Inhalt',
    categoryKey: 'block.category.content',
    icon: 'survey',
    graded: false,
    defaultConfig(locale = 'de'){
      const en = locale === 'en';
      return {
        title: en ? 'Feedback on this task' : 'Feedback zu dieser Aufgabe',
        intro: '',
        questions: []
      };
    },
    previewConfig(locale = 'de'){
      const en = locale === 'en';
      return {
        title: en ? 'Feedback on this task' : 'Feedback zu dieser Aufgabe',
        intro: en
          ? 'Your feedback helps us improve this learning unit. It is anonymous.'
          : 'Ihre Rückmeldung hilft uns, die Lerneinheit zu verbessern. Sie ist anonym.',
        questions: en ? [
          { type:'rating', prompt:'How do you rate this task?', scale:5 },
          { type:'select', prompt:'Which part was most helpful?', options:'Theory\nExamples\nTask\nSolution' },
          { type:'text',   prompt:'What would you have preferred differently?', placeholder:'Optional, free text ...' }
        ] : [
          { type:'rating', prompt:'Wie bewerten Sie diese Aufgabe?', scale:5 },
          { type:'select', prompt:'Welcher Teil war am hilfreichsten?', options:'Theorie\nBeispiele\nAufgabe\nLösung' },
          { type:'text',   prompt:'Was hätten Sie sich anders gewünscht?', placeholder:'Optional, freier Text …' }
        ]
      };
    },
    builderSchema(){
      return [
        { key:'title', label:'Überschrift', labelKey:'block.survey.field.title.label', type:'text', placeholder:'z. B. „Feedback zu dieser Aufgabe"', placeholderKey:'block.survey.field.title.placeholder' },
        { key:'intro', label:'Einleitungstext (optional)', labelKey:'block.survey.field.intro.label', type:'text', placeholder:'Hinweis zur Anonymität, Zweck, …', placeholderKey:'block.survey.field.intro.placeholder' },
        { key:'questions', label:'Fragen', labelKey:'block.survey.field.questions.label', type:'list', itemLabel:'Frage', itemLabelKey:'block.survey.field.questions.itemLabel',
          itemSummary: item => {
            const u = window.BlockUtils;
            if(item.prompt) return item.prompt;
            return u && u.t ? u.t('block.survey.itemEmpty') : '(empty)';
          },
          itemSchema:[
            { key:'type', label:'Fragetyp', labelKey:'block.survey.field.type.label', type:'select', options:[
              {value:'rating', label:'Sternebewertung (1 bis N Sterne)', labelKey:'block.survey.field.type.option.rating'},
              {value:'select', label:'Einfachauswahl (Optionen, 1 Antwort)', labelKey:'block.survey.field.type.option.select'},
              {value:'text',   label:'Freitext', labelKey:'block.survey.field.type.option.text'}
            ]},
            { key:'prompt', label:'Frage', labelKey:'block.survey.field.prompt.label', type:'text', placeholder:'z. B. „Wie bewerten Sie …?"', placeholderKey:'block.survey.field.prompt.placeholder' },
            { key:'scale', label:'Anzahl Sterne (nur Sternebewertung)', labelKey:'block.survey.field.scale.label', type:'number', default:5 },
            { key:'options', label:'Antwortoptionen (eine pro Zeile, nur Einfachauswahl)', labelKey:'block.survey.field.options.label', type:'textarea', rows:4, placeholder:'Option A\nOption B\nOption C', placeholderKey:'block.survey.field.options.placeholder' },
            { key:'placeholder', label:'Platzhaltertext (nur Freitext)', labelKey:'block.survey.field.placeholder.label', type:'text', placeholder:'Optional …', placeholderKey:'block.survey.field.placeholder.placeholder' }
          ]
        }
      ];
    },
    mount(host, config, api){
      const t = (key, params) => api.utils.t(key, params);
      const l = (val) => api.utils.l(val);
      const wrap = document.createElement('section');
      wrap.className = 'survey-block';
      wrap.style.cssText = 'padding:1rem 1.2rem 1.1rem; border-radius:12px; background:#fffaf2; border:1px solid #f0e0bc;';

      const titleText = l(config.title);
      if(titleText){
        const th = document.createElement('h3');
        th.textContent = titleText;
        th.style.cssText = 'margin:0 0 0.4rem 0; color:var(--primary, #003b5c); font-size:1.05rem; font-weight:800;';
        wrap.appendChild(th);
      }
      const introText = l(config.intro);
      if(introText){
        const i = document.createElement('p');
        i.textContent = introText;
        i.style.cssText = 'margin:0 0 0.8rem 0; color:#5d6872; font-size:0.92rem;';
        wrap.appendChild(i);
      }

      const questions = Array.isArray(config.questions) ? config.questions : [];
      if(questions.length === 0){
        const ph = document.createElement('div');
        ph.style.cssText = 'color:var(--muted, #6a7986); font-style:italic; font-size:0.9rem;';
        ph.textContent = t('block.survey.noQuestions');
        wrap.appendChild(ph);
        host.appendChild(wrap);
        return {};
      }

      const form = document.createElement('div');
      form.style.cssText = 'display:grid; gap:0.9rem;';
      const answers = Array(questions.length).fill('');

      questions.forEach((q, idx) => {
        if(!q || !q.prompt) return;
        const promptText = l(q.prompt);
        const block = document.createElement('div');
        block.style.cssText = 'display:flex; flex-direction:column; gap:0.35rem;';
        const label = document.createElement('div');
        label.textContent = (idx + 1) + '. ' + promptText;
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
            btn.setAttribute('aria-label', t('block.survey.starAria', { n: s, total: scale }));
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
          const opts = String(l(q.options) || '').split('\n').map(o => o.trim()).filter(Boolean);
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
          const ta = document.createElement('textarea');
          ta.rows = 3;
          ta.placeholder = l(q.placeholder) || '';
          ta.style.cssText = 'width:100%; padding:0.5rem 0.7rem; border:1px solid #d2dce5; border-radius:7px; font:inherit; font-size:0.92rem; resize:vertical; box-sizing:border-box;';
          ta.addEventListener('input', () => { answers[idx] = ta.value; });
          block.appendChild(ta);
        }
        form.appendChild(block);
      });

      // Builder preview lacks api.persist(); disable the submit button so
      // it reads as "live preview, no submit".
      // Standard button styling (btn btn-primary) so the survey matches the
      // graded blocks' Korrektur button. The cream card background stays as
      // the non-graded signal. .btn:disabled handles the preview/sent state.
      const submit = document.createElement('button');
      submit.type = 'button';
      submit.className = 'btn btn-primary';
      submit.textContent = t('block.survey.submit');
      const previewMode = !(api && typeof api.persist === 'function');
      submit.disabled = previewMode;

      const ack = document.createElement('div');
      ack.style.cssText = 'display:none; color:#2c7a3f; font-weight:700; font-size:0.92rem;';
      ack.textContent = t('block.survey.thanks');

      if(!previewMode){
        submit.addEventListener('click', () => {
          try { api.persist({ answers: answers, ts: Date.now() }); } catch{}
          submit.disabled = true;
          submit.textContent = t('block.survey.sent');
          ack.style.display = 'block';
        });
      }

      // Wrap in a button-cluster so the button hugs its content (like the
      // Korrektur pill) instead of stretching across the form grid.
      const btnRow = document.createElement('div');
      btnRow.className = 'button-cluster';
      btnRow.appendChild(submit);
      form.appendChild(btnRow);
      form.appendChild(ack);
      wrap.appendChild(form);
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      const U = window.BlockUtils || {};
      const stubApi = {
        utils: {
          t: (key, params) => (U.t ? U.t(key, params) : key),
          l: (val) => (U.l ? U.l(val) : val)
        }
      };
      this.mount(host, config, stubApi);
    }
  });
})();
