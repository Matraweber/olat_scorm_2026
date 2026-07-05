// Built-in task templates. The builder consumes window.getBuiltinTemplates().
// Each template's blocks omit `id`: the builder generates fresh IDs on instantiation.
// `config` may be partial; for keys that aren't set the block's defaultConfig() applies.
//
// Exposed as a factory (not a static array) so labels/descriptions/categories
// are resolved through the active i18n bundle every time the "New task" modal
// opens. The block config below stays in German by design: it represents
// authored course content that the user will edit after inserting the template.
(function(){
  'use strict';

  function tr(key, fallback){
    var i18n = window.i18n;
    if(i18n && typeof i18n.t === 'function'){
      var out = i18n.t(key);
      // t() returns the key itself when a translation is missing; fall back
      // to the German original in that case so the modal never shows a raw key.
      if(out && out !== key) return out;
    }
    return fallback;
  }

  window.getBuiltinTemplates = function(){
    return [
      {
        id: 'tpl-empty-content',
        label: tr('taskTemplates.emptyContent.label', 'Inhaltsseite'),
        category: tr('taskTemplates.category.content', 'Inhalt'),
        description: tr('taskTemplates.emptyContent.description', 'Überschrift + Text + Bild, gut zum Erklären ohne Frage.'),
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
        label: tr('taskTemplates.mcSimple.label', 'Multiple Choice, kurz'),
        category: tr('taskTemplates.category.question', 'Frage'),
        description: tr('taskTemplates.mcSimple.description', 'Eine Frage mit mehreren Antwortoptionen.'),
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
        label: tr('taskTemplates.numericClassic.label', 'Numerische Berechnung'),
        category: tr('taskTemplates.category.question', 'Frage'),
        description: tr('taskTemplates.numericClassic.description', 'Aufgabentext + Variablen + Lösungs-Formel.'),
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
        label: tr('taskTemplates.cloze.label', 'Lückentext'),
        category: tr('taskTemplates.category.question', 'Frage'),
        description: tr('taskTemplates.cloze.description', 'Text mit Lücken {{antwort}} zum Ausfüllen.'),
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
        label: tr('taskTemplates.match.label', 'Begriffe zuordnen'),
        category: tr('taskTemplates.category.question', 'Frage'),
        description: tr('taskTemplates.match.description', 'Drag & Drop oder Klick, linke Begriffe zu rechten Antworten verbinden.'),
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
        label: tr('taskTemplates.textInput.label', 'Text-Antwort'),
        category: tr('taskTemplates.category.question', 'Frage'),
        description: tr('taskTemplates.textInput.description', 'Frage mit freier Text-Antwort (exakt oder Regex).'),
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
        label: tr('taskTemplates.complex.label', 'Komplexe Zahlen: Aufgabe'),
        category: tr('taskTemplates.category.math', 'Mathematik'),
        description: tr('taskTemplates.complex.description', 'Intro + Hinweis + Re/Im/|z|/φ aus dem Plot ablesen.'),
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
        label: tr('taskTemplates.function.label', 'Funktion ablesen'),
        category: tr('taskTemplates.category.math', 'Mathematik'),
        description: tr('taskTemplates.function.description', 'Funktion plotten und Funktionswerte, Nullstellen oder Extrempunkte ablesen lassen.'),
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
        label: tr('taskTemplates.vector.label', 'Vektor 2D ablesen'),
        category: tr('taskTemplates.category.math', 'Mathematik'),
        description: tr('taskTemplates.vector.description', 'Komponenten / Betrag / Winkel eines Vektors aus dem Plot ablesen.'),
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
        label: tr('taskTemplates.truthTable.label', 'Wahrheitstabelle'),
        category: tr('taskTemplates.category.cs', 'Informatik'),
        description: tr('taskTemplates.truthTable.description', 'Booleschen Ausdruck, Wahrheitstabelle ausfüllen.'),
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
        label: tr('taskTemplates.baseConversion.label', 'Zahlensystem-Umrechnung'),
        category: tr('taskTemplates.category.cs', 'Informatik'),
        description: tr('taskTemplates.baseConversion.description', 'Umrechnung zwischen Binär / Dezimal / Hex / Oktal.'),
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
  };
})();
