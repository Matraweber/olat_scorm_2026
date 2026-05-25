// summary.js: styled key-points callout with checkmarks.
// Each point has a bold headline + optional explanation.
(function(){
  'use strict';

  Blocks.register('summary', {
    label: 'Zusammenfassung',
    description: 'Lernziel- oder Kernaussagen-Liste mit Häkchen. Wird typischerweise am Ende einer Aufgabe platziert.',
    category: 'Medien & Inhalt',
    icon: 'summary',
    graded: false,
    defaultConfig(){
      return {
        title: 'Das nehmen Sie mit',
        points: []
      };
    },
    previewConfig(){
      return {
        title: 'Das nehmen Sie mit',
        points: [
          { headline: 'Boolesche Operationen', text: 'AND, OR, NOT sind die Grundbausteine jeder Logik.' },
          { headline: 'Wahrheitstabellen', text: 'Erlauben das systematische Prüfen aller Eingaben.' },
          { headline: 'De-Morgan-Gesetze', text: 'Negation einer UND-Verknüpfung = ODER der Negationen (und umgekehrt).' }
        ]
      };
    },
    builderSchema(){
      return [
        { key:'title', label:'Überschrift', type:'text', placeholder:'z. B. „Das nehmen Sie mit"' },
        { key:'points', label:'Stichpunkte', type:'list', itemLabel:'Punkt',
          itemSummary: item => item.headline || item.text || '(leer)',
          itemSchema:[
            { key:'headline', label:'Kernaussage (fett)', type:'text', placeholder:'z. B. „Wahrheitstabellen"' },
            { key:'text', label:'Erläuterung (optional)', type:'text', placeholder:'Kurzer erklärender Satz' }
          ]
        }
      ];
    },
    mount(host, config, api){
      const wrap = document.createElement('section');
      wrap.className = 'summary-block';
      wrap.style.cssText = 'padding:1rem 1.2rem 1.1rem; border-radius:12px; background:linear-gradient(135deg, rgba(132,191,102,0.10), rgba(0,59,92,0.06)); border-left:4px solid var(--accent, #84bf66);';
      if(config.title){
        const t = document.createElement('h3');
        t.textContent = config.title;
        t.style.cssText = 'margin:0 0 0.6rem 0; color:var(--primary, #003b5c); font-size:1.05rem; font-weight:800; letter-spacing:-0.01em;';
        wrap.appendChild(t);
      }
      const list = document.createElement('ul');
      list.style.cssText = 'list-style:none; padding:0; margin:0; display:grid; gap:0.5rem;';
      const points = Array.isArray(config.points) ? config.points : [];
      if(points.length === 0){
        const ph = document.createElement('li');
        ph.style.cssText = 'color:var(--muted, #6a7986); font-style:italic; font-size:0.9rem;';
        ph.textContent = '(noch keine Stichpunkte)';
        list.appendChild(ph);
      } else {
        points.forEach(p => {
          if(!p || (!p.headline && !p.text)) return;
          const li = document.createElement('li');
          li.style.cssText = 'display:flex; gap:0.6rem; align-items:flex-start; line-height:1.45;';
          const mark = document.createElement('span');
          mark.style.cssText = 'flex:0 0 22px; height:22px; width:22px; border-radius:50%; background:var(--accent, #84bf66); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; margin-top:1px;';
          mark.textContent = '✓';
          li.appendChild(mark);
          const body = document.createElement('div');
          body.style.cssText = 'flex:1; min-width:0;';
          if(p.headline){
            const h = document.createElement('strong');
            h.textContent = p.headline;
            h.style.cssText = 'color:var(--primary, #003b5c); font-weight:700;';
            body.appendChild(h);
          }
          if(p.headline && p.text){
            body.appendChild(document.createTextNode(': '));
          }
          if(p.text){
            const span = document.createElement('span');
            span.textContent = p.text;
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
      this.mount(host, capped, {});
    }
  });
})();
