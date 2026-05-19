// Built-in task templates. The builder consumes window.BUILTIN_TEMPLATES.
// Each template's blocks omit `id`: the builder generates fresh IDs on instantiation.
// `config` may be partial; for keys that aren't set the block's defaultConfig() applies.
(function(){
  'use strict';
  window.BUILTIN_TEMPLATES = [
    {
      id: 'tpl-empty-content',
      label: 'Inhaltsseite',
      category: 'Inhalt',
      description: 'Überschrift + Text + Bild, gut zum Erklären ohne Frage.',
      task: {
        title: 'Erklärung',
        blocks: [
          { type: 'heading',   config: { text: 'Worum geht es?', level: 2 } },
          { type: 'rich-text', config: { html: '<p>Hier können Sie den Lerninhalt einführen. <strong>Fett</strong>, <em>kursiv</em> und <code>Code</code> sind erlaubt.</p>' } },
          { type: 'image',     config: { src:'', alt:'', caption:'(optional) Bildunterschrift' } }
        ]
      }
    },
    {
      id: 'tpl-mc-simple',
      label: 'Multiple Choice, kurz',
      category: 'Frage',
      description: 'Eine Frage mit mehreren Antwortoptionen.',
      task: {
        title: 'Multiple-Choice-Frage',
        blocks: [
          { type: 'multiple-choice', config: {
            question: 'Welche Aussage ist korrekt?',
            choices: [
              { text: 'Antwort A', correct: true },
              { text: 'Antwort B', correct: false },
              { text: 'Antwort C', correct: false },
              { text: 'Antwort D', correct: false }
            ],
            multi: false, shuffle: true, maxPoints: 1
          }}
        ]
      }
    },
    {
      id: 'tpl-numeric-classic',
      label: 'Numerische Berechnung',
      category: 'Frage',
      description: 'Aufgabentext + Variablen + Lösungs-Formel.',
      task: {
        title: 'Numerische Aufgabe',
        blocks: [
          { type: 'rich-text', config: { html: '<p>Berechnen Sie die Aufgabe und geben Sie das Ergebnis ein.</p>' } },
          { type: 'numeric-input', config: {
            questionTemplate: 'Berechnen Sie {a} · {b}.',
            variables: [
              { name:'a', min:2, max:9, integer:true },
              { name:'b', min:2, max:9, integer:true }
            ],
            formula: 'a * b',
            tolerance: 0.01,
            unit: '',
            maxPoints: 1
          }}
        ]
      }
    },
    {
      id: 'tpl-cloze',
      label: 'Lückentext',
      category: 'Frage',
      description: 'Text mit Lücken {{antwort}} zum Ausfüllen.',
      task: {
        title: 'Lückentext-Übung',
        blocks: [
          { type: 'rich-text', config: { html: '<p>Vervollständigen Sie den folgenden Text.</p>' } },
          { type: 'cloze', config: {
            text: 'Die Hauptstadt von Deutschland ist {{Berlin}}, die Hauptstadt von Frankreich ist {{Paris}} und die Hauptstadt von Italien ist {{Rom}}.',
            ignoreCase: true,
            maxPoints: 1
          }}
        ]
      }
    },
    {
      id: 'tpl-match',
      label: 'Begriffe zuordnen',
      category: 'Frage',
      description: 'Drag & Drop oder Klick, linke Begriffe zu rechten Antworten verbinden.',
      task: {
        title: 'Zuordnung',
        blocks: [
          { type: 'rich-text', config: { html: '<p>Ordnen Sie die Begriffe einander zu (per Drag &amp; Drop oder Klick).</p>' } },
          { type: 'match-pairs', config: {
            question: 'Verbinde Element und chemisches Symbol.',
            pairs: [
              { left:'Wasserstoff', right:'H' },
              { left:'Sauerstoff',  right:'O' },
              { left:'Gold',        right:'Au' },
              { left:'Eisen',       right:'Fe' }
            ],
            shuffle: true, maxPoints: 1
          }}
        ]
      }
    },
    {
      id: 'tpl-text-input',
      label: 'Text-Antwort',
      category: 'Frage',
      description: 'Frage mit freier Text-Antwort (exakt oder Regex).',
      task: {
        title: 'Text-Frage',
        blocks: [
          { type: 'text-input', config: {
            question: 'Wer hat die Relativitätstheorie entwickelt?',
            answers: [
              { value: 'Einstein', mode: 'iexact' },
              { value: 'Albert Einstein', mode: 'iexact' }
            ],
            maxPoints: 1
          }}
        ]
      }
    },
    {
      id: 'tpl-complex',
      label: 'Komplexe Zahlen: Aufgabe',
      category: 'Mathematik',
      description: 'Intro + Hinweis + Re/Im/|z|/φ aus dem Plot ablesen.',
      task: {
        title: 'Komplexe Zahlen',
        blocks: [
          { type: 'rich-text', config: { html: '<p><strong>Bestimmen Sie Re(z), Im(z), |z| und φ aus dem Plot.</strong></p><p>Im Diagramm ist eine komplexe Zahl in der Gaußschen Zahlenebene dargestellt. Lesen Sie die Werte ab und tragen Sie sie in die Eingabefelder ein.</p>' } },
          { type: 'note-box', config: {
            title: 'Eingabehinweis',
            html: 'Re(z) und Im(z) als Dezimalzahl. Für φ sind <strong>pi</strong>-Ausdrücke wie <strong>pi/2</strong> oder <strong>3*pi/4</strong> erlaubt.',
            variant: 'info'
          }},
          { type: 'complex-question', config: {} }
        ]
      }
    },
    {
      id: 'tpl-function',
      label: 'Funktion ablesen',
      category: 'Mathematik',
      description: 'Funktion plotten und Funktionswerte, Nullstellen oder Extrempunkte ablesen lassen.',
      task: {
        title: 'Funktionsanalyse',
        blocks: [
          { type: 'rich-text', config: { html: '<p>Lesen Sie aus dem Plot die geforderte Größe ab.</p>' } },
          { type: 'function-question', config: {} }
        ]
      }
    },
    {
      id: 'tpl-vector',
      label: 'Vektor 2D ablesen',
      category: 'Mathematik',
      description: 'Komponenten / Betrag / Winkel eines Vektors aus dem Plot ablesen.',
      task: {
        title: 'Vektor-Analyse',
        blocks: [
          { type: 'rich-text', config: { html: '<p>Lesen Sie x, y, |v| und α aus dem Plot ab.</p>' } },
          { type: 'vector-question', config: {} }
        ]
      }
    },
    {
      id: 'tpl-truth-table',
      label: 'Wahrheitstabelle',
      category: 'Informatik',
      description: 'Booleschen Ausdruck, Wahrheitstabelle ausfüllen.',
      task: {
        title: 'Boolesche Logik',
        blocks: [
          { type: 'rich-text', config: { html: '<p>Tragen Sie für jede Belegung der Variablen den Wahrheitswert (0/1) des Ausdrucks ein.</p>' } },
          { type: 'truth-table', config: {} }
        ]
      }
    },
    {
      id: 'tpl-base-conversion',
      label: 'Zahlensystem-Umrechnung',
      category: 'Informatik',
      description: 'Umrechnung zwischen Binär / Dezimal / Hex / Oktal.',
      task: {
        title: 'Zahlensystem',
        blocks: [
          { type: 'note-box', config: {
            title: 'Hinweis',
            html: 'Hex-Werte ohne 0x-Präfix. Groß-/Kleinschreibung egal.',
            variant: 'info'
          }},
          { type: 'number-base', config: {} }
        ]
      }
    }
  ];
})();
