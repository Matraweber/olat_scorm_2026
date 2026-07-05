// summary.js: styled key-points callout with checkmarks.
// Each point has a bold headline + optional explanation.
(function(){
  'use strict';

  Blocks.register('summary', {
    label: 'Zusammenfassung',
    labelKey: 'block.summary.label',
    description: 'Lernziel- oder Kernaussagen-Liste mit Häkchen. Wird typischerweise am Ende einer Aufgabe platziert.',
    descKey: 'block.summary.description',
    category: 'Medien & Inhalt',
    categoryKey: 'block.category.content',
    icon: 'summary',
    graded: false,
    defaultConfig(locale = 'de'){
      const en = locale === 'en';
      return {
        title: en ? 'What you take away' : 'Das nehmen Sie mit',
        points: []
      };
    },
    previewConfig(locale = 'de'){
      const en = locale === 'en';
      return {
        title: en ? 'What you take away' : 'Das nehmen Sie mit',
        points: en ? [
          { headline: 'Boolean operations', text: 'AND, OR, NOT are the building blocks of every logic circuit.' },
          { headline: 'Truth tables', text: 'They allow systematic checking of every input combination.' },
          { headline: 'De Morgan\'s laws', text: 'Negation of an AND is OR of the negations (and vice versa).' }
        ] : [
          { headline: 'Boolesche Operationen', text: 'AND, OR, NOT sind die Grundbausteine jeder Logik.' },
          { headline: 'Wahrheitstabellen', text: 'Erlauben das systematische Prüfen aller Eingaben.' },
          { headline: 'De-Morgan-Gesetze', text: 'Negation einer UND-Verknüpfung = ODER der Negationen (und umgekehrt).' }
        ]
      };
    },
    builderSchema(){
      return [
        { key:'title', label:'Überschrift', labelKey:'block.summary.field.title.label', type:'text', placeholder:'z. B. „Das nehmen Sie mit"', placeholderKey:'block.summary.field.title.placeholder' },
        { key:'points', label:'Stichpunkte', labelKey:'block.summary.field.points.label', type:'list', itemLabel:'Punkt', itemLabelKey:'block.summary.field.points.itemLabel',
          itemSummary: item => {
            const u = window.BlockUtils;
            if(item.headline) return item.headline;
            if(item.text) return item.text;
            return u && u.t ? u.t('block.summary.itemEmpty') : '(empty)';
          },
          itemSchema:[
            { key:'headline', label:'Kernaussage (fett)', labelKey:'block.summary.field.headline.label', type:'text', placeholder:'z. B. „Wahrheitstabellen"', placeholderKey:'block.summary.field.headline.placeholder' },
            { key:'text', label:'Erläuterung (optional)', labelKey:'block.summary.field.text.label', type:'text', placeholder:'Kurzer erklärender Satz', placeholderKey:'block.summary.field.text.placeholder' }
          ]
        }
      ];
    },
    mount(host, config, api){
      const wrap = document.createElement('section');
      wrap.className = 'summary-block';
      wrap.style.cssText = 'padding:1rem 1.2rem 1.1rem; border-radius:12px; background:linear-gradient(135deg, rgba(132,191,102,0.10), rgba(0,59,92,0.06)); border-left:4px solid var(--accent, #84bf66);';
      const titleText = api.utils.l(config.title);
      if(titleText){
        const t = document.createElement('h3');
        t.textContent = titleText;
        t.style.cssText = 'margin:0 0 0.6rem 0; color:var(--primary, #003b5c); font-size:1.05rem; font-weight:800; letter-spacing:-0.01em;';
        wrap.appendChild(t);
      }
      const list = document.createElement('ul');
      list.style.cssText = 'list-style:none; padding:0; margin:0; display:grid; gap:0.5rem;';
      const points = Array.isArray(config.points) ? config.points : [];
      if(points.length === 0){
        const ph = document.createElement('li');
        ph.style.cssText = 'color:var(--muted, #6a7986); font-style:italic; font-size:0.9rem;';
        ph.textContent = api.utils.t('block.summary.emptyPlaceholder');
        list.appendChild(ph);
      } else {
        points.forEach(p => {
          if(!p) return;
          const headline = api.utils.l(p.headline);
          const text = api.utils.l(p.text);
          if(!headline && !text) return;
          const li = document.createElement('li');
          li.style.cssText = 'display:flex; gap:0.6rem; align-items:flex-start; line-height:1.45;';
          const mark = document.createElement('span');
          mark.style.cssText = 'flex:0 0 22px; height:22px; width:22px; border-radius:50%; background:var(--accent, #84bf66); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; margin-top:1px;';
          mark.textContent = '✓';
          li.appendChild(mark);
          const body = document.createElement('div');
          body.style.cssText = 'flex:1; min-width:0;';
          if(headline){
            const h = document.createElement('strong');
            h.textContent = headline;
            h.style.cssText = 'color:var(--primary, #003b5c); font-weight:700;';
            body.appendChild(h);
          }
          if(headline && text){
            body.appendChild(document.createTextNode(': '));
          }
          if(text){
            const span = document.createElement('span');
            span.textContent = text;
            span.style.cssText = 'color:#2d3a44;';
            body.appendChild(span);
          }
          li.appendChild(body);
          list.appendChild(li);
        });
      }
      wrap.appendChild(list);
      host.appendChild(wrap);
      return {};
    },
    preview(host, config){
      // Cap to 3 points so the preview card doesn't grow unbounded.
      const capped = Object.assign({}, config, {
        points: Array.isArray(config.points) ? config.points.slice(0, 3) : []
      });
      const api = {
        utils: {
          t: function(key, params, fallback){
            if(window.BlockUtils && typeof window.BlockUtils.t === 'function'){
              return window.BlockUtils.t(key, params, fallback);
            }
            return fallback != null ? fallback : key;
          },
          l: function(value){
            if(window.BlockUtils && typeof window.BlockUtils.l === 'function'){
              return window.BlockUtils.l(value);
            }
            return value;
          }
        }
      };
      this.mount(host, capped, api);
    }
  });
})();
