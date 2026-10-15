// template/i18n/de.js: German runtime chrome bundle (SCORM player side).
// Loaded by template/index.html after utils.js. Registers itself into
// window.BlockUtils. Also referenced by the builder's showPreview() so the
// preview iframe uses the same bundle as the packaged runtime.
(function(){
  'use strict';
  var bundle = {
    meta: { name: 'Deutsch', label: 'DE' },

    common: {
      check: 'Korrektur',
      regenerate: 'Neu generieren',
      submit: 'Abgeben',
      answer: 'Antwort',
      answerPlaceholder: 'Antwort eingeben',
      question: 'Frage',
      task: 'Aufgabe',
      points: 'Punkte',
      of: 'von',
      correct: 'Korrekt.',
      wrong: 'Nicht richtig.',
      partial: 'Teilweise richtig.'
    },

    footer: {
      previous: 'Zurück',
      next: 'Weiter',
      finish: 'Test beenden'
    },

    progress: {
      taskLabel: 'Aufgabe {current} von {total}',
      doneSuffix: '{done} erledigt ({pct}%)',
      ariaLabel: 'Lernfortschritt'
    },

    header: {
      nav: 'Aufgabennavigation',
      pointsPill: 'Punkte: {pts} / {max}'
    },

    feedback: {
      title: 'Rückmeldung',
      initial: 'Noch keine Korrektur durchgeführt.',
      chooseAtLeastOne: 'Bitte mindestens eine Antwort auswählen.',
      correctScored: 'Korrekt. {pts} / {max} Punkte.',
      partialScored: 'Teilweise richtig: {pts} / {max} Punkte.',
      wrongScored: 'Nicht richtig. {pts} / {max} Punkte.',
      notFullyCorrect: 'Antwort nicht vollständig richtig. {pts} / {max} Punkte.'
    },

    finish: {
      title: 'Test beendet',
      scoreLine: 'Erreichte Punktzahl: {pts} von {max} ({pct}%)',
      scoreLineHtml: 'Erreichte Punktzahl: <strong>{pts} / {max}</strong> ({pct}%)',
      passed: 'Bestanden',
      failed: 'Nicht bestanden.',
      closeHint: 'Sie können dieses Fenster jetzt schließen und zum Kurs zurückkehren.'
    },

    error: {
      configNotLoadable: 'Konfiguration nicht ladbar',
      unknownBlockType: 'Unbekannter Block-Typ: {type}',
      unknownBlockTypeHtml: 'Unbekannter Block-Typ: {type}',
      blockMountFailed: 'Fehler beim Block {type}: {msg}',
      blockMountFailedHtml: 'Fehler beim Block {type}: {msg}'
    },

    lang: {
      switcherLabel: 'Sprache:'
    },

    utils: {
      regen: {
        on: 'An',
        off: 'Aus',
        inherit: 'Wie Lerneinheit ({state})',
        lockAfterCheckLabel: 'Neu-Generieren nach Prüfen sperren',
        lockAfterCheckHelp: 'Nach dem ersten Prüfen kann keine neue Aufgabe mehr generiert werden. „Wie Lerneinheit" folgt der Einstellung in den Kopfdaten.',
        noRegenerateLabel: 'Neu-Generieren ausblenden',
        noRegenerateHelp: 'Kein „Neu generieren"-Knopf; die erste Zufallsaufgabe muss gelöst werden. „Wie Lerneinheit" folgt den Kopfdaten.',
        lockedTitle: 'Nach der Korrektur gesperrt'
      },
      varFormat: {
        decimals: {
          label: 'Nachkommastellen (Zufallszahlen)',
          help: 'Wie viele Nachkommastellen nicht-ganzzahlige Variablen erhalten (0–6). Einzelne Variablen können abweichen.'
        },
        display: {
          label: 'Darstellung von Kommazahlen',
          help: 'Wie nicht-ganzzahlige Variablen im Text erscheinen. Einzelne Variablen können abweichen.',
          auto: 'Automatisch (einfacher Bruch, sonst Kommazahl)',
          decimal: 'Immer als Kommazahl (z. B. 0.75)',
          fraction: 'Immer als Bruch (z. B. 3/4)'
        },
        item: {
          decimals: { label: 'Nachkommastellen (leer = wie Aufgabe)' },
          display: {
            label: 'Darstellung',
            inherit: 'Wie Aufgabe',
            auto: 'Automatisch',
            decimal: 'Kommazahl',
            fraction: 'Bruch'
          }
        }
      },
      resume: {
        solved: 'Bereits gelöst – die Lösung ist eingetragen.'
      },
      integerAnswers: {
        label: 'Nur ganzzahlige Lösungen',
        help: 'Es werden nur Aufgaben gestellt, deren Lösungen ganze Zahlen sind.'
      },
      penalty: {
        label: 'Punkte für falsche Antworten abziehen',
        help: 'Jede falsche Antwort zieht Punkte ab; die Gesamtpunktzahl fällt nie unter 0. Offen Gelassenes zählt 0.',
        pointsLabel: 'Abzug pro falscher Antwort (Punkte)',
        pointsPlaceholder: 'leer = so viel wie eine richtige Antwort bringt',
        pointsHelp: 'Leer lassen: Abzug entspricht dem Wert einer richtigen Antwort.'
      },
      angleUnit: {
        label: 'Winkel in Formeln',
        help: 'Gilt für sin, cos, tan, arcsin, arccos, arctan (= asin, acos, atan). sind(), cosd() … rechnen immer in Grad.',
        deg: 'Grad (°), z. B. sin(30) = 0,5',
        rad: 'Bogenmaß (rad), z. B. sin(pi/6) = 0,5'
      }
    },

    runtime: {
      legacyNoteTitle: 'Hinweis',
      tabs: {
        fallbackTitle: 'Tab {n}'
      },
      timer: {
        courseLabel: 'Restzeit: {time}',
        courseExpired: 'Die Zeit ist abgelaufen. Die Lerneinheit wurde automatisch abgeschlossen.',
        blockLabel: '{time}',
        blockExpired: 'Zeit abgelaufen'
      },
      help: {
        attempts: 'Versuch {n} / {max}',
        attemptsUsed: 'Keine Versuche mehr',
        attemptPenalty: '−{pct} % pro weiterem Versuch',
        hintButton: 'Hinweis',
        solutionButton: 'Lösungsweg',
        hintTitle: 'Hinweis',
        solutionTitle: 'Lösungsweg',
        hintPenalty: 'Das Öffnen des Hinweises kostet {pts} Punkt(e).',
        solutionLocks: 'Nach dem Öffnen des Lösungswegs sind die Antworten gesperrt.',
        open: 'Anzeigen',
        cancel: 'Abbrechen',
        close: 'Schließen'
      },
      globalRegen: {
        button: 'Globale Werte neu generieren',
        title: 'Zieht neue Werte für die globalen Variablen und setzt alle Aufgaben zurück, in denen sie vorkommen.',
        lockedTitle: 'Gesperrt: In einer betroffenen Aufgabe wurde bereits geprüft bzw. sind Antworten gesperrt.',
        confirmTitle: 'Globale Werte neu generieren?',
        confirmMessage: 'Antworten und Punkte in {n} Aufgabe(n) werden zurückgesetzt:',
        confirm: 'Neu generieren',
        cancel: 'Abbrechen'
      },
      error: {
        unknownBlockTypeHtml: 'Unbekannter Block-Typ: {type}',
        blockMountFailedHtml: 'Fehler beim Block {type}: {msg}'
      },
      finish: {
        scoreLineHtml: 'Erreichte Punktzahl: <strong>{pts} / {max}</strong> ({pct}%)'
      },
      defaultCourseTitle: 'SCORM Lerneinheit'
    },

    taskList: {
      fallbackTitle: 'Aufgabe {n}'
    },

    html: {
      title: 'SCORM Lerneinheit',
      brandKicker: 'Umwelt-Campus Birkenfeld',
      courseTitle: 'SCORM Lerneinheit'
    },

    block: {
      audio: {
        label: 'Audio',
        description: 'Audiodatei abspielen, z. B. Sprachaufnahme oder Hörbeispiel. Datei-Upload oder URL.',
        field: {
          title: {
            label: 'Titel (über dem Player, optional)'
          },
          src: {
            label: 'Audioquelle (Data-URL oder URL/Pfad)',
            help: 'Hochgeladene Audiodateien werden als Data-URL ins SCORM-Paket eingebettet. URL muss MP3/WAV/OGG sein.'
          },
          caption: {
            label: 'Bildunterschrift (unter dem Player, optional)'
          }
        },
        placeholder: {
          notSet: '(Audio noch nicht gesetzt)'
        },
        preview: {
          noAudio: '(noch keine Audiodatei)'
        }
      },
      category: {
        content: 'Medien & Inhalt',
        question: 'Frage',
        mint: 'MINT',
        visualization: 'Visualisierung'
      },
      cloze: {
        label: 'Lückentext',
        description: 'Lückentext mit freier Eingabe, Alternativen oder Dropdown-Auswahl.',
        defaultTitle: 'Lückentext',
        dropdownPlaceholder: 'wählen…',
        summary: {
          empty: '(leer)'
        },
        validate: {
          noGaps: 'Keine Lücken im Text ({{Antwort}}).'
        },
        feedback: {
          noGaps: 'Keine Lücken im Text.',
          fillAtLeastOne: 'Bitte mindestens eine Lücke ausfüllen.',
          allCorrect: 'Alle Lücken korrekt.',
          someCorrect: '{correct} von {total} korrekt.'
        },
        preview: {
          dropdownTag: 'Dropdown'
        },
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Lückentext'
          },
          preset: {
            label: 'Vorlage',
            help: 'Lücken-Syntax: {{antwort}} = Texteingabe · {{a|b}} = Alternativen · {{=richtig|falsch}} = Dropdown.',
            option: {
              custom: 'Manuell (leer)',
              'math-terms': 'Beispiel: Mathematik, Quadratische Funktion',
              'ohm-law': 'Beispiel: Physik, Ohmsches Gesetz'
            }
          },
          reset: {
            label: '↺ Zurücksetzen'
          },
          sec_text: {
            label: 'Lückentext'
          },
          text: {
            label: 'Text mit Lücken',
            help: 'Lücken-Syntax:\n• {{antwort}} → Texteingabe\n• {{a|b|c}} → Eingabe mit Alternativen (alle richtig)\n• {{=richtig|falsch1|falsch2}} → Dropdown (erste Option = richtig)'
          },
          sec_opts: {
            label: 'Einstellungen & Bewertung'
          },
          ignoreCase: {
            label: 'Groß-/Kleinschreibung ignorieren'
          },
          shuffleDropdown: {
            label: 'Dropdown-Optionen mischen'
          },
          maxPoints: {
            label: 'Punkte (gesamt für alle Lücken)'
          }
        }
      },
      code: {
        label: 'Code-Block',
        description: 'Quellcode mit fester Schrift, optional mit Sprach-Tag.',
        field: {
          title: {
            label: 'Titel (optional)'
          },
          language: {
            label: 'Sprache (z. B. javascript, python, c)'
          },
          code: {
            label: 'Code'
          }
        },
        previewFallbackTitle: 'Code'
      },
      'complex-input': {
        label: 'Komplexe Eingabe',
        description: 'Komplexe Zahl als Antwort. Variablen, Formel, Domain-Check.',
        defaultTitle: 'Komplexe Eingabe',
        inputLabel: 'Antwort (z. B. 3+4i)',
        inputPlaceholder: 'Komplexe Zahl: 3+4i, -i, 5, 1/2 - 3/4i',
        summary: {
          empty: '(Frage leer)'
        },
        validate: {
          missingQuestion: 'Frage-Vorlage fehlt.',
          missingFormula: 'Lösungsformel fehlt.',
          formulaAlwaysInvalid: 'Formel ergibt mit den aktuellen Variablenbereichen IMMER ein ungültiges Ergebnis. Formel oder Bereiche anpassen.',
          formulaFailsRatio: 'Formel scheitert in {pct}% der Stichproben. Variablenbereich enger fassen oder Formel anpassen.'
        },
        feedback: {
          notGeneratable: 'Aufgabe nicht generierbar: Formel ergibt mit den aktuellen Variablenbereichen kein gültiges Ergebnis. Bitte Formel oder Variablen anpassen.',
          notGeneratableInteger: 'Aufgabe nicht generierbar: Mit den aktuellen Variablenbereichen ergibt sich keine Lösung mit ganzzahligem Real- und Imaginärteil. Bereiche oder Formel anpassen oder „Nur ganzzahlige Lösungen“ ausschalten.',
          newGenerated: 'Neue Aufgabe generiert.',
          noTaskLoaded: 'Keine Aufgabe geladen.',
          invalidComplex: 'Bitte eine komplexe Zahl eingeben, z. B. „3+4i", „-i" oder „5".',
          correctWithSolution: 'Korrekt. (Lösung: {solution})',
          wrongWithSolution: 'Nicht korrekt. (Lösung: {solution})'
        },
        preview: {
          sampleQuestion: 'Berechnen Sie $(3 + 4i)(2 - i)$.',
          acceptedHint: 'Akzeptiert: a+bi, -i, Brüche wie 1/2+3/4i.'
        },
        field: {
          integerAnswers: { help: 'Es werden nur Aufgaben gestellt, deren Lösung ganzzahligen Real- und Imaginärteil hat (z. B. 3 - 2i).' },
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Komplexe Eingabe'
          },
          _sec_q: {
            label: 'Frage'
          },
          questionTemplate: {
            label: 'Frage-Vorlage',
            placeholder: 'Berechnen Sie $({a}+{b}i)({c}-{d}i)$.',
            help: 'Variablen mit {a}, {b}, … einsetzen. $...$ für KaTeX-Mathe, z. B. $z = {a} + {b}i$.'
          },
          _sec_vars: {
            label: 'Variablen'
          },
          variables: {
            label: 'Reelle Variablen',
            itemLabel: 'Variable',
            help: 'Reelle Werte, die in Frage und Formel verwendet werden. Bei jedem "Neu generieren" werden sie neu gezogen.',
            item: {
              name: {
                label: 'Name',
                placeholder: 'a'
              },
              min: {
                label: 'Min'
              },
              max: {
                label: 'Max'
              },
              integer: {
                label: 'Nur Ganzzahlen'
              }
            }
          },
          _sec_sol: {
            label: 'Lösung'
          },
          formula: {
            label: 'Lösungs-Formel (komplex)',
            placeholder: '(a+b*i)*(c-d*i)',
            help: 'i ist die imaginäre Einheit. Operatoren: + - * / ^.  Funktionen: re(z), im(z), abs(z), conj(z), arg(z), sqrt(z), exp(z), ln(z), sin(x), cos(x). Variablen aus der Liste werden als reell eingesetzt.'
          },
          tolerance: {
            label: 'Toleranz  (|Δ|)',
            help: 'Akzeptierter Abstand zwischen Antwort und Lösung in der komplexen Ebene.'
          },
          _sec_score: {
            label: 'Bewertung'
          },
          maxPoints: {
            label: 'Punkte'
          }
        }
      },
      'complex-question': {
        label: 'Komplexe Zahl ablesen',
        description: 'Plot in Gaußscher Zahlenebene zeigen, Re/Im/|z|/φ abfragen.',
        summary: '{n} Punkte im Pool',
        plotTitle: 'Aufgabenplot',
        inputHeading: 'Eingabe',
        newTaskGenerated: 'Neue Aufgabe generiert.',
        fillAtLeastOne: 'Bitte mindestens ein Feld ausfüllen.',
        partMissing: '{label} fehlt.',
        partCorrect: '{label} richtig.',
        partWrong: '{label} noch nicht richtig.',
        partialScoredDetail: 'Teilweise richtig ({ok} von {total}): {pts} / {max} Punkte. {parts}',
        wrongScoredDetail: '0 / {max} Punkte. {parts}',
        placeholder: {
          real: 'z. B. 2',
          imag: 'z. B. -1',
          abs: 'z. B. 2.24',
          arg: 'z. B. pi/2'
        },
        previewTag: 'z = a + bi   ablesen',
        questionText: {
          cartesian: 'Lesen Sie Realteil und Imaginärteil der komplexen Zahl ab.',
          polar: 'Bestimmen Sie Betrag |z| und Argument φ.',
          conjugate: 'Bestimmen Sie die konjugierte komplexe Zahl z̄ = a - bi.',
          all: 'Lesen Sie kartesische und polare Darstellung der komplexen Zahl ab.'
        },
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Komplexe Zahlen'
          },
          pool: {
            label: 'Aufgaben-Pool  (z = a + bi)',
            itemLabel: 'Punkt',
            item: {
              a: {
                label: 'Re(z)  =  a'
              },
              b: {
                label: 'Im(z)  =  b'
              }
            }
          },
          randomize: {
            label: 'Zufällig wählen'
          },
          _sec_query: {
            label: 'Abfrage'
          },
          questionMode: {
            label: 'Was wird gefragt?',
            option: {
              all: 'Kartesisch und polar  (Re, Im, |z|, φ)',
              cartesian: 'Nur kartesisch  (Re(z) und Im(z))',
              polar: 'Nur polar  (|z| und φ)',
              conjugate: 'Konjugierte Zahl  z̄'
            }
          },
          _sec_fields: {
            label: 'Felder & Toleranzen'
          },
          fields: {
            label: 'Felder individuell ein-/ausblenden',
            help: 'Nur bei „Kartesisch und polar" relevant. Alle anderen Modi legen die Felder fest.',
            item: {
              real: {
                label: 'Re(z)'
              },
              imag: {
                label: 'Im(z)'
              },
              abs: {
                label: '|z|'
              },
              arg: {
                label: 'φ'
              }
            }
          },
          tolerances: {
            label: 'Toleranzen  (±)',
            item: {
              real: {
                label: 'Re(z)'
              },
              imag: {
                label: 'Im(z)'
              },
              abs: {
                label: '|z|'
              },
              arg: {
                label: 'φ (rad)'
              }
            }
          },
          _sec_score: {
            label: 'Darstellung & Bewertung'
          },
          plotRange: {
            label: 'Plot-Bereich (±)'
          },
          maxPoints: {
            label: 'Punkte'
          }
        }
      },
      divider: {
        label: 'Trennlinie',
        description: 'Horizontale Trennlinie mit etwas Abstand.',
        summary: 'Trennlinie'
      },
      'equation-system': {
        label: 'Gleichungssystem',
        description: 'Lineares Gleichungssystem, zufällig generiert oder mit eigenen Varianten.',
        defaultTitle: 'Gleichungssystem',
        defaultQuestion: 'Lösen Sie das folgende Gleichungssystem.',
        noValidSystem: 'Kein gültiges Gleichungssystem konfiguriert.',
        noValidVariant: 'Keine gültige Variante konfiguriert.',
        inputPlaceholder: 'Zahl oder Bruch',
        enterAtLeastOne: 'Bitte mindestens eine Variable eingeben.',
        allCorrect: 'Alle Variablen korrekt. {max} / {max} Punkte. Lösung: {solution}',
        partialCorrect: '{correct} von {total} korrekt. {pts} / {max} Punkte. Erwartet: {solution}',
        newSystemGenerated: 'Neues System generiert.',
        summary: {
          variantsCountOne: '{count} Variante',
          variantsCountMany: '{count} Varianten',
          randomWithVars: '{count} Variablen, zufällig'
        },
        validate: {
          manualNoVariants: 'Manueller Modus: keine Variante angelegt.',
          variantPrefix: 'Variante {index}: {err}',
          varCountRange: 'Anzahl Variablen muss 2 oder 3 sein.',
          coeffRangeInvalid: 'Koeffizienten-Bereich ungültig.'
        },
        parser: {
          unexpectedChar: 'unerwartetes Zeichen "{char}"',
          emptyTermAfterSign: 'leerer Term nach Vorzeichen',
          invalidNumber: 'ungültige Zahl "{num}"',
          unknownVariable: 'unbekannte Variable "{name}"',
          emptyEquation: 'leere Gleichung',
          noEquals: 'kein "=" gefunden',
          multipleEquals: 'mehr als ein "=", bitte eine Gleichung pro Zeile',
          leftSide: 'linke Seite: {err}',
          rightSide: 'rechte Seite: {err}',
          noVariables: 'keine Variablen definiert',
          tooManyVariables: 'höchstens 4 Variablen unterstützt',
          duplicateVariables: 'doppelte Variablennamen',
          invalidVariableName: 'ungültiger Variablenname "{name}"',
          noEquation: 'keine Gleichung angegeben',
          linePrefix: 'Zeile {line}: {err}',
          systemInvalid: 'System ungültig',
          systemInconsistent: 'Widerspruch in den Gleichungen; System ist nicht lösbar',
          underdeterminedOne: 'nicht eindeutig lösbar ({count} freie Variable)',
          underdeterminedMany: 'nicht eindeutig lösbar ({count} freie Variablen)'
        },
        preview: {
          defaultQuestion: 'Lösen Sie das folgende Gleichungssystem.'
        },
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Gleichungssystem'
          },
          mode: {
            label: 'Modus',
            help: '„Zufällig" generiert bei jedem Start neue Koeffizienten. „Eigene Varianten" wählt aus von Ihnen definierten Systemen.',
            option: {
              random: 'Zufällige Werte (Builder erzeugt das System)',
              manual: 'Eigene Varianten (Sie schreiben das System)'
            }
          },
          preset: {
            label: 'Vorlage',
            option: {
              custom: 'Manuell (leer)',
              'simple-2': 'Beispiel: 2 Variablen, kleine Zahlen',
              'standard-2': 'Beispiel: 2 Variablen, Standard-Bereich',
              'standard-3': 'Beispiel: 3 Variablen'
            }
          },
          reset: {
            label: 'Zurücksetzen'
          },
          _sec_q: {
            label: 'Frage'
          },
          question: {
            label: 'Aufgabentext'
          },
          _sec_sys: {
            label: 'System (zufällig)'
          },
          variableCount: {
            label: 'Anzahl Variablen (2 oder 3)'
          },
          variableNames: {
            label: 'Variablennamen (Komma-getrennt)',
            placeholder: 'x,y oder x,y,z'
          },
          _sec_ranges: {
            label: 'Wertebereiche'
          },
          coeffMin: {
            label: 'Koeffizient Min'
          },
          coeffMax: {
            label: 'Koeffizient Max'
          },
          solutionMin: {
            label: 'Lösung Min'
          },
          solutionMax: {
            label: 'Lösung Max'
          },
          integerSolution: {
            label: 'Lösungen sind ganzzahlig'
          },
          _sec_var: {
            label: 'Varianten',
            help: 'Pro „Neu generieren" wird zufällig eine Variante gewählt. Jede Variante wird live geprüft. Die Zusammenfassung zeigt die berechnete Lösung oder eine Warnung, falls das System nicht eindeutig lösbar ist.'
          },
          variants: {
            label: 'Varianten',
            itemLabel: 'Variante',
            item: {
              variableNames: {
                label: 'Variablen (Komma-getrennt)',
                placeholder: 'x,y'
              },
              equations: {
                label: 'Gleichungen (eine pro Zeile)',
                placeholder: '2x + 3y = 7\nx - y = 1',
                help: 'Beispiele: „2x + 3y = 7", „x = 5", „-0.5x + y = 2", „2x = y + 1". Multiplikation muss nicht mit * geschrieben werden.'
              }
            }
          },
          _sec_score: {
            label: 'Bewertung'
          },
          tolerance: {
            label: 'Toleranz pro Variable'
          },
          maxPoints: {
            label: 'Punkte (gesamt)'
          }
        }
      },
      'file-download': {
        label: 'Datei-Download',
        description: 'Lerneinheits-Anhang zum Download anbieten, z. B. PDF-Skript, ZIP-Übung oder Vorlagen.',
        field: {
          title: {
            label: 'Titel (vor dem Download-Button)',
            placeholder: 'z. B. „Vorlesungs-Skript Woche 3"'
          },
          src: {
            label: 'Datei (Upload oder URL)',
            help: 'Hochgeladene Dateien werden als Data-URL ins SCORM-Paket eingebettet.'
          },
          filename: {
            label: 'Anzeigename / Speichername',
            placeholder: 'z. B. „skript-woche-3.pdf"'
          },
          description: {
            label: 'Beschreibung (optional, unter dem Button)',
            placeholder: 'Format, Seitenzahl, Hinweise …'
          }
        },
        downloadButton: '↓ Download',
        noFile: '(keine Datei)'
      },
      'function-question': {
        label: 'Funktion ablesen',
        description: 'Funktionsgraph anzeigen. Werte, Nullstellen und Extrempunkte ablesen.',
        summary: '{count} Funktion(en)',
        defaultTitle: 'Funktionsplot',
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Funktionsplot'
          },
          functions: {
            label: 'Funktions-Pool',
            itemLabel: 'Funktion'
          },
          expr: {
            label: 'f(x) =',
            placeholder: 'z. B. x^2 - 2*x - 3'
          },
          _sec_axes: {
            label: 'Koordinatenbereich'
          },
          xMin: {
            label: 'x von'
          },
          xMax: {
            label: 'x bis'
          },
          yMin: {
            label: 'y von'
          },
          yMax: {
            label: 'y bis'
          },
          _sec_query: {
            label: 'Abfrage'
          },
          questionMode: {
            label: 'Was wird gefragt?',
            option: {
              custom: 'Eigene Frage / Lösung',
              'value-at-x': 'Funktionswert f(x0)',
              'x-for-y': 'x-Werte zu f(x) = y0',
              zeros: 'Nullstellen',
              'y-intercept': 'y-Achsenabschnitt f(0)',
              minima: 'Tiefpunkte / Minima',
              maxima: 'Hochpunkte / Maxima',
              extrema: 'Alle Extrempunkte'
            }
          },
          xQuery: {
            label: 'Stelle  x₀'
          },
          targetY: {
            label: 'Zielwert  y₀'
          },
          tolerance: {
            label: 'Toleranz (± Abweichung)'
          },
          question: {
            label: 'Fragetext',
            help: 'Leer lassen: die Frage wird automatisch aus dem Typ erzeugt.'
          },
          answer: {
            label: 'Musterlösung',
            help: 'Mehrere Werte mit Semikolon trennen.'
          },
          answerType: {
            label: 'Antwort-Format',
            option: {
              number: 'Einzelne Zahl',
              list: 'Mehrere Zahlen'
            }
          },
          randomize: {
            label: 'Funktion zufällig wählen'
          },
          maxPoints: {
            label: 'Punkte'
          }
        },
        modeLabel: {
          custom: 'Eigene Frage',
          'value-at-x': 'f(x₀) ablesen',
          'x-for-y': 'x bei f(x) = y₀',
          zeros: 'Nullstellen',
          'y-intercept': 'y-Achsenabschnitt',
          minima: 'Tiefpunkte',
          maxima: 'Hochpunkte',
          extrema: 'Alle Extrempunkte'
        },
        noneInRange: 'Keine im sichtbaren Bereich',
        valuePlaceholder: 'Wert',
        newTaskGenerated: 'Neue Aufgabe generiert.',
        pleaseEnterAnswer: 'Bitte eine Antwort eingeben.',
        autoQuestion: {
          custom: 'Lesen Sie den geforderten Wert aus dem Plot ab.',
          'value-at-x': 'Bestimmen Sie f({x}).',
          'x-for-y': 'Für welche x-Werte gilt f(x) = {y}?',
          zeros: 'Bestimmen Sie die Nullstelle(n) der Funktion (x-Werte).',
          'y-intercept': 'Bestimmen Sie den y-Achsenabschnitt f(0).',
          extrema: {
            none: {
              minima: 'Tragen Sie „keine" ein, falls keine Tiefpunkte im sichtbaren Bereich liegen.',
              maxima: 'Tragen Sie „keine" ein, falls keine Hochpunkte im sichtbaren Bereich liegen.',
              extrema: 'Tragen Sie „keine" ein, falls keine Extrempunkte im sichtbaren Bereich liegen.'
            },
            single: {
              minima: 'Bestimmen Sie den Tiefpunkt als Koordinate (x; y).',
              maxima: 'Bestimmen Sie den Hochpunkt als Koordinate (x; y).',
              extrema: 'Bestimmen Sie den Extrempunkt als Koordinate (x; y).'
            },
            multiple: {
              minima: 'Bestimmen Sie die {n} Tiefpunkte als Koordinaten (x; y).',
              maxima: 'Bestimmen Sie die {n} Hochpunkte als Koordinaten (x; y).',
              extrema: 'Bestimmen Sie die {n} Extrempunkte als Koordinaten (x; y).'
            }
          },
          fallback: 'Lesen Sie den geforderten Wert aus dem Plot ab.'
        },
        grade: {
          pleaseEnterAnswer: 'Bitte eine Antwort eingeben.',
          valuesNotMatching: 'Nicht alle Werte passen. Erwartet werden {n} Wert(e).',
          invalidNumber: 'Bitte eine gültige Zahl eingeben.',
          valueNotYetCorrect: 'Wert noch nicht richtig.',
          correctNoPoints: 'Korrekt: Es gibt keine passenden Punkte im sichtbaren Bereich.',
          noPointsInRange: 'Es gibt keine passenden Punkte im sichtbaren Bereich. Geben Sie „keine" ein.',
          enterCoordinates: 'Bitte Koordinaten als (x; y) eingeben.',
          coordinatesNotYetCorrect: 'Koordinaten noch nicht richtig. Erwartet werden {n} Punkt(e).',
          correctNoValues: 'Korrekt: Es gibt keine passenden Werte im sichtbaren Bereich.',
          noValuesInRange: 'Es gibt keine passenden Werte im sichtbaren Bereich. Geben Sie „keine" ein.',
          valuesNotYetCorrect: 'Wert(e) noch nicht richtig. Erwartet werden {n} Wert(e).'
        }
      },
      'function-sandbox': {
        label: 'Funktionsplot-Sandbox',
        description: 'Funktion mit Schiebereglern interaktiv erkunden, nicht bewertet.',
        sliderStepShort: 'Schritt',
        sliderStartShort: 'Start',
        field: {
          _sec_fn: {
            label: 'Funktion'
          },
          title: {
            label: 'Titel (optional)',
            placeholder: 'z. B. Sinus erkunden'
          },
          expr: {
            label: 'f(x) =',
            placeholder: 'a*sin(b*x + c)',
            help: 'Slider-Variablen (a, b, c, …) dürfen hier vorkommen.'
          },
          _sec_axes: {
            label: 'Koordinatenbereich'
          },
          xMin: {
            label: 'x von'
          },
          xMax: {
            label: 'x bis'
          },
          yMin: {
            label: 'y von'
          },
          yMax: {
            label: 'y bis'
          },
          _sec_sliders: {
            label: 'Schieberegler'
          },
          sliders: {
            label: 'Regler',
            itemLabel: 'Regler',
            item: {
              name: {
                label: 'Variable',
                placeholder: 'a'
              },
              _sec_range: {
                label: 'Bereich & Schritt'
              },
              min: {
                label: 'von'
              },
              max: {
                label: 'bis'
              },
              step: {
                label: 'Schrittweite'
              },
              value: {
                label: 'Startwert'
              }
            }
          }
        },
        preview: {
          tag: 'ƒ  Sandbox: {expr}',
          sliderHint: '{count} Schieberegler · interaktiv im SCORM'
        }
      },
      heading: {
        label: 'Überschrift',
        description: 'Zwischenüberschrift im Aufgabentext.',
        summary: {
          empty: '(leer)'
        },
        field: {
          text: {
            label: 'Text'
          },
          level: {
            label: 'Größe',
            option: {
              2: 'Groß (h2)',
              3: 'Mittel (h3)',
              4: 'Klein (h4)'
            }
          }
        },
        defaultText: 'Überschrift'
      },
      hotzone: {
        label: 'Hotzone (Bild markieren)',
        description: 'Bild mit markierten Bereichen. Lernende klicken in die richtigen Zonen.',
        preview: {
          prompt: 'Klicken Sie auf den Baum.'
        },
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Hotzone'
          },
          _sec_q: {
            label: 'Frage'
          },
          prompt: {
            label: 'Aufgabentext'
          },
          _sec_zones: {
            label: 'Bild & Zonen'
          },
          src: {
            label: 'Bild',
            help: 'Bild hochladen oder URL eingeben.'
          },
          zones: {
            label: 'Hotzonen einzeichnen',
            help: 'Rechteck auf dem Bild ziehen → Zone hinzufügen. Zone anklicken → löschen.'
          },
          _sec_opts: {
            label: 'Einstellungen & Bewertung'
          },
          showZonesAfterCheck: {
            label: 'Nicht gefundene Zonen nach Korrektur anzeigen'
          },
          maxPoints: {
            label: 'Punkte'
          },
          penalizeWrong: { help: 'Jeder Klick außerhalb aller Zonen zieht Punkte ab; die Gesamtpunktzahl fällt nie unter 0.' }
        },
        noImage: '(Kein Bild gesetzt)',
        noImageShort: '(Kein Bild)',
        counter: '{count} / {max} Markierungen gesetzt',
        removeMark: 'Klicken zum Entfernen',
        reset: 'Zurücksetzen',
        noZonesConfigured: 'Keine Hotzonen konfiguriert.',
        markAtLeastOne: 'Bitte mindestens eine Stelle im Bild markieren.',
        allFound: 'Alle {total} Zonen gefunden.',
        allFoundWithMisclicks: '{correct}/{total} Zonen gefunden, aber {misclicks} Fehlklick(s).',
        partialWithMisclicks: '{correct} von {total} Zonen gefunden ({misclicks} Fehlklick(s)).',
        partial: '{correct} von {total} Zonen gefunden.',
        resetHint: 'Zurückgesetzt. Bitte neu klicken.',
        zonesMarked: '{count} Zone(n) markiert'
      },
      image: {
        label: 'Bild',
        description: 'Bild mit optionaler Bildunterschrift. Quelle: hochladen oder URL.',
        summary: {
          set: 'Bild gesetzt',
          empty: '(noch kein Bild)'
        },
        validate: {
          noSrc: 'Kein Bild gesetzt.',
          noAlt: 'Alt-Text fehlt (Barrierefreiheit).'
        },
        field: {
          src: {
            label: 'Bildquelle (Data-URL oder URL/Pfad)',
            help: 'Hochgeladene Bilder werden als Data-URL ins SCORM-Paket eingebettet.'
          },
          alt: {
            label: 'Alt-Text (Barrierefreiheit)'
          },
          caption: {
            label: 'Bildunterschrift (optional)'
          },
          width: {
            label: 'Breite (CSS, z. B. 400px, 60%, auto)'
          }
        },
        placeholder: {
          empty: '(Bild noch nicht gesetzt)'
        },
        preview: {
          kicker: 'BILD',
          empty: '(noch kein Bild gesetzt)'
        }
      },
      'match-pairs': {
        label: 'Zuordnung (Drag & Drop)',
        description: 'Begriffe paarweise verbinden oder in Kategorien einsortieren, per Ziehen oder Antippen.',
        summary: {
          pairs: '{count} Paare',
          categorize: '{cats} Kategorien, {items} Elemente'
        },
        validate: {
          minTwoCategories: 'Mindestens zwei Kategorien erforderlich.',
          minTwoItems: 'Mindestens zwei Elemente erforderlich.',
          itemMissingCategory: 'Mindestens ein Element hat keine gültige Kategorie.',
          minTwoPairs: 'Mindestens zwei Paare erforderlich.',
          pairEmptySide: 'Mindestens ein Paar hat eine leere Seite.'
        },
        preview: {
          defaultQuestion: 'Ordnen Sie die Hauptstädte den Ländern zu.',
          pairs: {
            country1: 'Deutschland', capital1: 'Berlin',
            country2: 'Frankreich', capital2: 'Paris',
            country3: 'Italien', capital3: 'Rom'
          }
        },
        defaultTitle: 'Aufgabe',
        defaultCategorizeTitle: 'Kategorisierung',
        dropHere: 'Hier ablegen',
        resetBtn: 'Zurücksetzen',
        noPairsDefined: 'Keine Paare definiert.',
        pleaseAssignAtLeastOne: 'Bitte mindestens eine Zuordnung vornehmen.',
        allCorrect: 'Alle Zuordnungen korrekt.',
        scoreLine: '{correct} von {total} korrekt.',
        resetDone: 'Zurückgesetzt.',
        newTaskGenerated: 'Neue Aufgabe generiert.',
        slotRemoveHint: 'Klicken oder zurückziehen zum Entfernen',
        previewTag: 'Drag & Drop-Zuordnung',
        noCategoriesOrItems: '(Keine Kategorien oder Elemente definiert.)',
        poolLabel: 'Elemente',
        pleaseAssignAtLeastOneTerm: 'Bitte mindestens ein Element zuordnen.',
        categorizeAllCorrect: 'Alle {total} Elemente richtig zugeordnet. {pts} / {max} Punkte.',
        categorizeScoreLine: '{correct} von {total} richtig. {pts} / {max} Punkte.',
        categorizeHint: 'Elemente in die passende Kategorie ziehen – oder Element antippen und dann die Kategorie antippen. Zurück: Element antippen, dann den Bereich „Elemente“ antippen.',
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Zuordnung'
          },
          preset: {
            label: 'Vorlage',
            help: 'Beispiele zeigen typische Zuordnungsaufgaben. Bei „Manuell" eigene Daten eingeben.',
            option: {
              custom: 'Manuell (leer)',
              chemistry: 'Beispiel: Chemie, Elemente & Symbole',
              units: 'Beispiel: Physik, Einheiten zuordnen',
              'number-bases': 'Beispiel: Informatik, Zahlensysteme',
              'math-symbols': 'Beispiel: Mathematik, Symbole & Bedeutungen',
              animals: 'Beispiel: Biologie, Tiere nach Klasse (Kategorisierung)',
              states: 'Beispiel: Chemie, Aggregatzustaende (Kategorisierung)'
            }
          },
          reset: {
            label: '↺ Zurücksetzen'
          },
          sec_mode: {
            label: 'Modus'
          },
          mode: {
            label: 'Zuordnungs-Modus',
            option: {
              pairs: '1 zu 1 (jeder Begriff hat genau einen Partner)',
              categorize: 'Kategorisierung (mehrere Elemente pro Kategorie)'
            }
          },
          sec_q: {
            label: 'Frage'
          },
          question: {
            label: 'Aufgabentext'
          },
          sec_pairs: {
            label: 'Paare  (links ↔ rechts)'
          },
          pairs: {
            label: 'Paare',
            itemLabel: 'Paar'
          },
          sec_left: {
            label: 'Linke Seite'
          },
          pair: {
            left: {
              label: 'Text'
            },
            leftImg: {
              label: 'Bild'
            },
            right: {
              label: 'Text'
            },
            rightImg: {
              label: 'Bild'
            }
          },
          sec_right: {
            label: 'Rechte Seite'
          },
          sec_cats: {
            label: 'Kategorien'
          },
          categories: {
            label: 'Kategorien',
            itemLabel: 'Kategorie'
          },
          category: {
            id: {
              label: 'Interne ID',
              placeholder: 'c1'
            },
            label: {
              label: 'Anzeige-Name',
              placeholder: 'z. B. Säugetiere'
            },
            image: {
              label: 'Bild (optional)'
            }
          },
          sec_items: {
            label: 'Elemente'
          },
          items: {
            label: 'Elemente',
            itemLabel: 'Element'
          },
          item: {
            text: {
              label: 'Text',
              placeholder: 'z. B. Hund'
            },
            image: {
              label: 'Bild (optional)'
            },
            categoryId: {
              label: 'Zugehörige Kategorie-ID(s)',
              help: 'Mehrere IDs mit Komma (z. B. c1, c2): Das Element erscheint dann einmal pro Kategorie. Gleich aussehende Elemente sind beim Zuordnen austauschbar.',
              placeholder: 'c1'
            }
          },
          sec_opts: {
            label: 'Einstellungen'
          },
          imgHeight: {
            label: 'Bild-Höhe in px',
            help: 'Maximale Höhe für alle Bilder.'
          },
          shuffle: {
            label: 'Reihenfolge mischen'
          },
          poolSize: {
            label: 'Anzahl Aufgaben pro Durchlauf  (0 = alle)',
            help: 'Bei 1:1: zufällige Auswahl von N Paaren aus dem Pool. Bei Kategorisierung: zufällige Auswahl von N Elementen (Kategorien bleiben gleich). Schaltet den „Neu generieren"-Button frei.'
          },
          sec_score: {
            label: 'Bewertung'
          },
          maxPoints: {
            label: 'Punkte (gesamt)'
          }
        }
      },
      'multiple-choice': {
        label: 'Multiple Choice',
        description: 'Eine oder mehrere richtige Antworten auswählen.',
        summary: {
          empty: '(Frage leer)',
          answersSuffix: '{count} Antworten'
        },
        validate: {
          questionEmpty: 'Frage ist leer.',
          minTwoChoices: 'Mindestens zwei Antwortmöglichkeiten erforderlich.',
          noCorrect: 'Keine richtige Antwort markiert.',
          allCorrect: 'Alle Antworten als richtig markiert.',
          capBelowCorrect: 'Es sind nur {max} Antworten auswählbar, aber {correct} richtig. Volle Punktzahl ist so nicht erreichbar.',
          choiceEmpty: 'Antwort {n} hat weder Text noch Bild.'
        },
        preview: {
          question: 'Welche Hauptstadt gehört zu Deutschland?',
          choices: {
            correct: 'Berlin',
            option1: 'München',
            option2: 'Wien',
            option3: 'Hamburg'
          }
        },
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Multiple Choice'
          },
          preset: {
            label: 'Vorlage',
            help: 'Beispiele zeigen die Möglichkeiten des Blocks. Eigene Inhalte unter „Manuell" eingeben.',
            option: {
              custom: 'Manuell (leer)',
              'example-single': 'Beispiel: Informatik, Zeitkomplexität (Einfachauswahl)',
              'example-multi': 'Beispiel: Informatik, OOP-Konzepte (Mehrfachauswahl)',
              'example-math': 'Beispiel: Mathematik, Ableitungsregeln (Einfachauswahl)'
            }
          },
          reset: {
            label: '↺ Zurücksetzen'
          },
          sectionQuestion: {
            label: 'Frage'
          },
          question: {
            label: 'Fragetext'
          },
          sectionChoices: {
            label: 'Antwortmöglichkeiten'
          },
          choices: {
            label: 'Antworten',
            itemLabel: 'Antwort',
            item: {
              text: {
                label: 'Antworttext (optional, wenn ein Bild gesetzt ist)'
              },
              image: {
                label: 'Bild (optional)'
              },
              correct: {
                label: 'Ist richtig'
              }
            }
          },
          sectionSettings: {
            label: 'Einstellungen'
          },
          multi: {
            label: 'Mehrfachauswahl erlauben'
          },
          limitSelections: {
            label: 'Anzahl auswählbarer Antworten begrenzen',
            help: 'Ist die Höchstzahl erreicht, lassen sich weitere Antworten erst wählen, wenn eine abgewählt wird.'
          },
          maxSelections: {
            label: 'Höchstens auswählbar'
          },
          shuffle: {
            label: 'Antworten mischen'
          },
          imageHeight: {
            label: 'Bildhöhe in den Antworten (px)',
            help: 'Maximale Höhe der Antwortbilder. Die Breite passt sich automatisch an.'
          },
          sectionScoring: {
            label: 'Bewertung'
          },
          maxPoints: {
            label: 'Punkte (gesamt)'
          },
          partialCredit: {
            label: 'Teilpunkte bei Mehrfachauswahl',
            help: 'Jede richtig angekreuzte Antwort gibt anteilig Punkte (gesamt ÷ Anzahl richtiger Antworten).'
          },
          penalizeWrong: {
            label: 'Falsche Auswahl abziehen',
            help: 'Bei Teilpunkten: falsch angekreuzte Antworten ziehen jeweils einen Teilpunkt ab (min. 0).'
          },
          penaltyPoints: {
            label: 'Abzug pro falscher Auswahl (Punkte)',
            placeholder: 'leer = ein Teilpunkt',
            help: 'Leer lassen: Abzug entspricht einem Teilpunkt (Punkte ÷ Anzahl richtiger Antworten). Gilt bei Mehrfachauswahl mit Teilpunkten; die Gesamtpunktzahl fällt nie unter 0.'
          }
        },
        limitHint: 'Höchstens {max} Antworten auswählbar ({n} von {max} gewählt).',
        partialDetail: 'Teilweise richtig: {pts} / {max} Punkte ({correctSelected} von {correctTotal} richtig{wrongSuffix}).',
        wrongSuffix: ', {wrong} falsch',
        questionEmpty: '(Frage leer)',
        imageAlt: 'Antwort {n} (Bild)'
      },
      'note-box': {
        label: 'Hinweisbox',
        description: 'Hervorgehobener Hinweiskasten (Info oder Warnung).',
        defaultTitle: 'Hinweis',
        field: {
          title: {
            label: 'Titel'
          },
          html: {
            label: 'Inhalt (HTML)'
          },
          variant: {
            label: 'Stil',
            option: {
              info: 'Info (grün)',
              warn: 'Warnung (gelb)',
              tip: 'Tipp (blau)'
            }
          }
        }
      },
      'number-base': {
        label: 'Zahlensysteme (Bin/Dez/Hex)',
        description: 'Umrechnung zwischen Binär, Oktal, Dezimal und Hexadezimal.',
        summary: 'Zahlensystem-Umrechnung',
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Zahlensysteme'
          },
          directionPreset: {
            label: 'Umrechnungs-Preset',
            option: {
              custom: 'Eigene Richtungen',
              standard: 'Standardmix',
              'all-decimal': 'Alle von/nach Dezimal',
              'dec-bin': 'Dezimal → Binär',
              'bin-dec': 'Binär → Dezimal',
              'dec-hex': 'Dezimal → Hex',
              'hex-dec': 'Hex → Dezimal',
              'bin-hex': 'Binär ↔ Hex'
            }
          },
          sectionDirections: {
            label: 'Erlaubte Umrechnungs-Richtungen'
          },
          directions: {
            label: 'Richtungen',
            itemLabel: 'Richtung'
          },
          from: {
            label: 'Von',
            option: {
              bin: 'Binär (Basis 2)',
              oct: 'Oktal (Basis 8)',
              dec: 'Dezimal (Basis 10)',
              hex: 'Hexadezimal (Basis 16)'
            }
          },
          to: {
            label: 'Nach',
            option: {
              bin: 'Binär (Basis 2)',
              oct: 'Oktal (Basis 8)',
              dec: 'Dezimal (Basis 10)',
              hex: 'Hexadezimal (Basis 16)'
            }
          },
          sectionSettings: {
            label: 'Einstellungen & Bewertung'
          },
          valueRange: {
            label: 'Wertebereich (dezimal)',
            min: {
              label: 'von'
            },
            max: {
              label: 'bis'
            }
          },
          randomize: {
            label: 'Richtung zufällig wählen'
          },
          maxPoints: {
            label: 'Punkte'
          }
        },
        base: {
          bin: 'Binär',
          oct: 'Oktal',
          dec: 'Dezimal',
          hex: 'Hexadezimal'
        },
        instruction: 'Wandeln Sie <strong>{value}</strong> aus <em>{from}</em> nach <em>{to}</em> um.',
        newTaskGenerated: 'Neue Aufgabe generiert.',
        enterAnswer: 'Bitte eine Antwort eingeben.',
        invalidChars: 'Ungültige Zeichen für {base}.',
        incorrectWithAnswer: 'Nicht korrekt. Richtige Antwort: {answer}',
        baseShort: {
          bin: 'Binär (₂)',
          oct: 'Oktal (₈)',
          dec: 'Dezimal (₁₀)',
          hex: 'Hex (₁₆)'
        },
        previewLabel: 'Zahlensystem-Umrechnung',
        previewHint: '{count} Richtung(en) im Pool, Werte {min} bis {max}'
      },
      'numeric-input': {
        label: 'Numerische Eingabe',
        description: 'Numerische Frage mit Zufallsvariablen und Lösungs-Formel.',
        summary: {
          empty: '(Frage leer)'
        },
        validate: {
          templateMissing: 'Frage-Vorlage fehlt.',
          formulaMissing: 'Lösungsformel fehlt.',
          extraFormulaMissing: 'Antwortfeld {n}: Lösungsformel fehlt (Feld wird ignoriert).',
          integerNever: '„Nur ganzzahlige Lösungen“: In keiner Stichprobe war die Lösung ganzzahlig. Variablen auf „Nur Ganzzahlen“ stellen oder Formel/Bereiche anpassen.',
          varNameInvalid: 'Variable {index} („{name}"): Name darf nur Buchstaben (a-z, A-Z), Ziffern und Unterstrich enthalten.',
          varRangeInverted: 'Variable „{name}": Min ({min}) ist größer als Max ({max}).',
          formulaAlwaysInvalid: 'Formel ergibt mit den aktuellen Variablenbereichen IMMER ein ungültiges Ergebnis (z. B. Division durch 0, Wurzel aus Negativem). Formel oder Bereiche anpassen.',
          formulaOftenInvalid: 'Formel scheitert in {pct}% der Stichproben (z. B. Division durch 0). Variablenbereich enger fassen oder Formel anpassen.'
        },
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Numerische Eingabe'
          },
          preset: {
            label: 'Vorlage',
            help: 'Beispiele zeigen alle Möglichkeiten des Blocks. „Manuell" für eigene Fragen.',
            option: {
              custom: 'Manuell (leer)',
              pythagoras: 'Beispiel: Pythagoras (c = √(a²+b²))',
              'rectangle-area': 'Beispiel: Rechteckfläche (A = a·b)',
              'circle-area': 'Beispiel: Kreisfläche (A = π·r²)',
              ohm: 'Beispiel: Ohmsches Gesetz (U = R·I)'
            }
          },
          reset: {
            label: '↺ Zurücksetzen'
          },
          sectionQuestion: {
            label: 'Frage'
          },
          questionTemplate: {
            label: 'Frage-Vorlage  (Variablen als {name})',
            help: 'Beispiel: „Berechnen Sie {a} + {b}." Variablen werden beim Start zufällig belegt. Die Lösungs-Formel wird automatisch abgeleitet.'
          },
          sectionVariables: {
            label: 'Zufallsvariablen'
          },
          variables: {
            label: 'Variablen',
            itemLabel: 'Variable',
            item: {
              name: {
                label: 'Name',
                placeholder: 'z. B. a'
              },
              min: {
                label: 'von'
              },
              max: {
                label: 'bis'
              },
              integer: {
                label: 'Nur Ganzzahlen'
              }
            }
          },
          sectionSolution: {
            label: 'Lösung'
          },
          formula: {
            label: 'Lösungs-Formel',
            placeholder: 'sqrt(a^2 + b^2)',
            help: 'Wird automatisch aus der Frage abgeleitet. Bei Bedarf manuell überschreiben.'
          },
          tolerance: {
            label: 'Toleranz  (±)',
            help: 'Abweichung, die noch als korrekt gilt. 0 = exakt.'
          },
          unit: {
            label: 'Antwort-Einheit (optional)',
            placeholder: 'z. B. m/s oder kg',
            help: 'Wird neben dem Antwortfeld angezeigt. Die Einheit in der Frage selbst gehört in den Fragetext.'
          },
          answerPrefix: {
            label: 'Bezeichnung vor dem Antwortfeld (optional)',
            placeholder: 'z. B. x =',
            help: 'Steht links vor dem Eingabefeld, z. B. ein Variablenname. $…$ für Formeln möglich.'
          },
          extraAnswers: {
            label: 'Weitere Antwortfelder',
            itemLabel: 'Antwortfeld',
            help: 'Jedes Feld hat eine eigene Formel (gleiche Zufallsvariablen). Teilpunkte pro richtigem Feld.',
            item: {
              prefix: { label: 'Bezeichnung davor', placeholder: 'z. B. y =' },
              formula: { label: 'Lösungs-Formel' },
              unit: { label: 'Einheit dahinter', placeholder: 'z. B. m' },
              tolerance: { label: 'Toleranz (±), leer = wie oben' }
            }
          },
          simplifyFractions: {
            label: 'Term vereinfachen',
            help: 'Aktiv: Studierende müssen den gekürzten Bruch eingeben. „10/20" wird als falsch gewertet, „1/2" ist korrekt. Aus: alle äquivalenten Eingaben werden akzeptiert.'
          },
          integerAnswers: {
            label: 'Nur ganzzahlige Lösungen',
            help: 'Es werden nur Aufgaben gestellt, deren Lösungen (alle Antwortfelder) ganze Zahlen sind.'
          },
          allowImpossible: {
            label: 'Unlösbare Aufgaben zulassen (Antwort „X“)',
            help: 'Hat eine Formel für die gezogenen Werte kein Ergebnis (z. B. Wurzel aus Negativem, Division durch 0), wird die Aufgabe trotzdem gestellt. Richtig ist dann die Eingabe „X“.'
          },
          sectionScoring: {
            label: 'Bewertung'
          },
          maxPoints: {
            label: 'Punkte'
          }
        },
        answerWithUnit: 'Antwort ({unit})',
        answerPlaceholder: 'Zahl oder Bruch (z. B. 0.75 oder 3/4)',
        answerPlaceholderX: 'Zahl, Bruch oder X (falls unlösbar)',
        impossibleSolution: 'X (unlösbar)',
        feedback: {
          notGeneratable: 'Aufgabe nicht generierbar: Formel führt mit den aktuellen Variablenbereichen immer zu einem ungültigen Ergebnis (z. B. Division durch 0). Variablenbereiche oder Formel anpassen.',
          newTask: 'Neue Aufgabe generiert.',
          solutionUnavailable: 'Lösung konnte nicht berechnet werden (Formel prüfen).',
          enterValidNumber: 'Bitte eine gültige Zahl oder Bruch (z. B. 3/4) eingeben.',
          enterValidNumberOrX: 'Bitte eine gültige Zahl, einen Bruch (z. B. 3/4) oder „X“ (unlösbar) eingeben.',
          notGeneratableInteger: 'Aufgabe nicht generierbar: Mit den aktuellen Variablenbereichen ergibt sich keine ganzzahlige Lösung. Bereiche oder Formel anpassen oder „Nur ganzzahlige Lösungen“ ausschalten.',
          needSimplifiedFraction: 'Bitte gekürzten Bruch eingeben (z. B. 1/2 statt 2/4).',
          correctWithSolution: 'Korrekt. (Lösung: {solution})',
          partial: '{n} von {total} Feldern richtig: {pts} / {max} Punkte.'
        },
        preview: {
          taskPlaceholder: '(Aufgabe)',
          enterNumber: 'Zahl eingeben…',
          exampleSolutionTitle: 'Beispiel-Lösung'
        }
      },
      'rich-text': {
        label: 'Fließtext',
        description: 'Absatz mit Formatierung (fett, kursiv, Listen, Links).',
        emptyText: '(leerer Text)',
        previewHtml: '<p>Dieser Block enthält <strong>formatierten Text</strong>. Erlaubt sind unter anderem <em>kursive Auszeichnung</em>, Listen und Links.</p>',
        field: {
          html: {
            label: 'Inhalt (HTML erlaubt)',
            help: 'Erlaubt: HTML wie <p>, <strong>, <em>, <ul>, <li>, <code>, <a>, <br>.'
          }
        }
      },
      'sort-list': {
        label: 'Sortierliste',
        description: 'Items per Drag & Drop in die korrekte Reihenfolge bringen.',
        defaultTitle: 'Aufgabe',
        qBoxTitle: 'Sortieren',
        previewTag: 'Sortieren (D&D)',
        feedback: {
          allCorrect: 'Alle Items korrekt sortiert.',
          partial: '{correct} von {total} richtig sortiert.'
        },
        preview: {
          more: '… +{count} weitere'
        },
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Sortierliste'
          },
          preset: {
            label: 'Vorlage',
            help: 'Items werden in der eingegebenen Reihenfolge als korrekt gewertet. Beim Start zufällig gemischt.',
            option: {
              custom: 'Manuell (leer)',
              'example-se': 'Beispiel: Informatik, Wasserfallmodell',
              'example-science': 'Beispiel: Wissenschaft, Wissenschaftliche Methode',
              'example-algo': 'Beispiel: Algorithmus, Merge-Sort-Phasen'
            }
          },
          reset: {
            label: '↺ Zurücksetzen'
          },
          sec_q: {
            label: 'Frage & Items'
          },
          question: {
            label: 'Aufgabentext'
          },
          items: {
            label: 'Items',
            itemLabel: 'Item',
            help: 'Items in der richtigen Reihenfolge eingeben. Beim Start werden sie zufällig gemischt.',
            value: {
              label: 'Text'
            }
          },
          sec_score: {
            label: 'Bewertung'
          },
          maxPoints: {
            label: 'Punkte'
          }
        },
        preset: {
          'example-se': {
            question: 'Ordnen Sie die Phasen des Wasserfallmodells in der richtigen Reihenfolge.',
            item: {
              requirements: 'Anforderungsanalyse',
              design: 'Systemdesign',
              implementation: 'Implementierung',
              testing: 'Testen',
              acceptance: 'Abnahme',
              maintenance: 'Wartung'
            }
          },
          'example-science': {
            question: 'Ordnen Sie die Schritte der wissenschaftlichen Methode.',
            item: {
              observe: 'Beobachtung formulieren',
              question: 'Fragestellung entwickeln',
              hypothesis: 'Hypothese aufstellen',
              experiment: 'Experiment planen und durchführen',
              analyze: 'Daten auswerten',
              conclude: 'Schlussfolgerung ziehen'
            }
          },
          'example-algo': {
            question: 'Ordnen Sie die Phasen des Merge-Sort-Algorithmus.',
            item: {
              split: 'Liste in zwei Hälften teilen',
              sortHalves: 'Jede Hälfte rekursiv sortieren',
              merge: 'Beide sortierten Hälften zusammenführen (merge)',
              return: 'Sortierte Gesamtliste zurückgeben'
            }
          }
        }
      },
      summary: {
        label: 'Zusammenfassung',
        description: 'Lernziel- oder Kernaussagen-Liste mit Häkchen. Wird typischerweise am Ende einer Aufgabe platziert.',
        field: {
          title: {
            label: 'Überschrift',
            placeholder: 'z. B. „Das nehmen Sie mit"'
          },
          points: {
            label: 'Stichpunkte',
            itemLabel: 'Punkt'
          },
          headline: {
            label: 'Kernaussage (fett)',
            placeholder: 'z. B. „Wahrheitstabellen"'
          },
          text: {
            label: 'Erläuterung (optional)',
            placeholder: 'Kurzer erklärender Satz'
          }
        },
        emptyPlaceholder: '(noch keine Stichpunkte)',
        itemEmpty: '(leer)'
      },
      survey: {
        label: 'Umfrage',
        description: 'Anonymes Feedback (Sternebewertung, Auswahl, Freitext). Wird nicht bewertet.',
        field: {
          title: {
            label: 'Überschrift',
            placeholder: 'z. B. „Feedback zu dieser Aufgabe"'
          },
          intro: {
            label: 'Einleitungstext (optional)',
            placeholder: 'Hinweis zur Anonymität, Zweck, …'
          },
          questions: {
            label: 'Fragen',
            itemLabel: 'Frage'
          },
          type: {
            label: 'Fragetyp',
            option: {
              rating: 'Sternebewertung (1 bis N Sterne)',
              select: 'Einfachauswahl (Optionen, 1 Antwort)',
              text: 'Freitext'
            }
          },
          prompt: {
            label: 'Frage',
            placeholder: 'z. B. „Wie bewerten Sie …?"'
          },
          scale: {
            label: 'Anzahl Sterne (nur Sternebewertung)'
          },
          options: {
            label: 'Antwortoptionen (eine pro Zeile, nur Einfachauswahl)',
            placeholder: 'Option A\nOption B\nOption C'
          },
          placeholder: {
            label: 'Platzhaltertext (nur Freitext)',
            placeholder: 'Optional …'
          }
        },
        noQuestions: '(noch keine Fragen)',
        itemEmpty: '(leer)',
        starAria: '{n} von {total} Sternen',
        submit: 'Absenden',
        thanks: '✓ Vielen Dank für Ihr Feedback.',
        sent: 'Gesendet'
      },
      table: {
        label: 'Tabelle',
        description: 'Wertetabelle, Richtig/Falsch-Aussagen, Auswahl-Matrix oder freie Tabelle mit Antwortzellen.',
        defaultTitle: 'Wertetabelle',
        emptyState: '(Keine Spalten oder keine Antwort-Spalte definiert.)',
        summary: '{cols} Spalten, {rows} Zeilen',
        grid: {
          summary: '{rows} × {cols} Tabelle, {answers} Antwortfelder',
          empty: '(Keine Zeilen oder Spalten definiert.)',
          solutionTitle: 'Lösung: {solution}',
          validate: {
            needRowsCols: 'Mindestens eine Zeile und eine Spalte erforderlich.',
            noAnswerCell: 'Keine Antwortzelle: mindestens eine Spalte oder Zeile auf „Zahl-Antwort“, „Text-Antwort“ oder „Auswahl“ stellen.',
            missingFormula: 'Zeile {row}, Spalte {col}: Lösungsformel fehlt.',
            missingAnswers: 'Zeile {row}, Spalte {col}: keine erlaubte Antwort eingetragen.',
            missingOptions: 'Zeile {row}, Spalte {col}: Auswahl braucht mindestens zwei Optionen (mit | getrennt, die erste ist richtig).',
            noGradedCell: 'Keine Antwortzelle zählt für die Punkte („Punkte“ ist überall abgewählt). Dann zählen alle Antwortzellen.'
          },
          feedback: {
            noAnswerCells: 'Diese Tabelle hat keine Antwortfelder.',
            fillAtLeastOne: 'Bitte mindestens ein Feld ausfüllen.',
            allCorrect: 'Alle {total} bewerteten Felder richtig. {pts} / {max} Punkte.',
            summary: '{correct} von {total} bewerteten Feldern richtig, {wrong} falsch: {pts} / {max} Punkte.'
          }
        },
        mx: {
          summary: '{rows} × {cols} Auswahl-Matrix',
          empty: '(Keine Zeilen oder Spalten definiert.)',
          validate: {
            needRowsCols: 'Mindestens eine Zeile und eine Spalte erforderlich.',
            emptyLabel: 'Mindestens eine Zeile oder Spalte hat keinen Namen.',
            noCorrect: 'Keine richtige Antwort angehakt.',
            singleNeedsOne: '„Pro Zeile nur eine Antwort“: Jede Zeile braucht genau ein angehaktes Kästchen.'
          },
          feedback: {
            tickAtLeastOne: 'Bitte mindestens ein Kästchen ankreuzen.',
            allCorrect: 'Alles richtig angekreuzt. {pts} / {max} Punkte.',
            summary: '{hits} von {total} richtigen Kreuzen, {wrong} falsch: {pts} / {max} Punkte.'
          }
        },
        tf: {
          summary: '{n} Aussagen (Richtig/Falsch)',
          empty: '(Keine Aussagen definiert.)',
          colUnanswered: 'Unbeantwortet',
          colTrue: 'Richtig',
          colFalse: 'Falsch',
          validate: {
            noStatements: 'Mindestens eine Aussage erforderlich.',
            emptyStatement: 'Aussage {n} ist leer.'
          },
          feedback: {
            answerAtLeastOne: 'Bitte mindestens eine Aussage als richtig oder falsch markieren.',
            allCorrect: 'Alle {total} Aussagen richtig beurteilt. {pts} / {max} Punkte.',
            summary: '{correct} von {total} richtig, {wrong} falsch, {open} unbeantwortet: {pts} / {max} Punkte.'
          }
        },
        typeShort: {
          var: 'Zufallswert',
          answer: 'Antwortfeld',
          expr: 'Berechnet',
          text: 'Text'
        },
        validate: {
          minColumns: 'Mindestens zwei Spalten erforderlich.',
          needAnswerColumn: 'Mindestens eine Antwort-Spalte erforderlich.'
        },
        feedback: {
          noAnswerCells: 'Keine Antwort-Zellen.',
          fillAtLeastOne: 'Bitte mindestens eine Zelle ausfüllen.',
          allCorrect: 'Alle {total} Eintraege korrekt. {max} / {max} Punkte.',
          someCorrect: '{correct} von {total} korrekt. {pts} / {max} Punkte.',
          newValues: 'Neue Werte generiert.'
        },
        preview: {
          questionEmpty: '(Frage leer)',
          noColumns: '(Keine Spalten definiert.)',
          defaultQuestion: 'Berechnen Sie $f(x) = 2x + 1$ für die gegebenen Werte.'
        },
        field: {
          integerAnswers: {
            valuesHelp: 'Jede Zeile wird so gezogen, dass alle Antwort-Spalten ganze Zahlen ergeben.',
            gridHelp: 'Die Variablen werden so gezogen, dass alle Zahl-Antworten der Tabelle ganze Zahlen sind.'
          },
          mode: {
            label: 'Art der Tabelle',
            help: 'Richtig/Falsch: pro Zeile eine Aussage, die als richtig oder falsch markiert wird. Auswahl-Matrix: Zeilen × Spalten zum Ankreuzen. Freie Tabelle: Text- und Antwortzellen (Zahl oder Text) beliebig anordnen.',
            option: {
              values: 'Wertetabelle (Variablen, Formeln, Eingabefelder)',
              truefalse: 'Richtig/Falsch-Aussagen',
              matrix: 'Auswahl-Matrix (Zeilen × Spalten ankreuzen)',
              grid: 'Freie Tabelle (Text- und Antwortzellen frei anordnen)'
            }
          },
          sectionGrid: { label: 'Tabelle' },
          grid: { label: 'Zeilen, Spalten und Zellen' },
          gridTolerance: { label: 'Toleranz für Zahl-Antworten (±)', help: 'Gilt für alle Zahl-Antworten ohne eigene Toleranz.' },
          gridIgnoreCase: { label: 'Groß-/Kleinschreibung bei Text-Antworten ignorieren' },
          sectionGridLayout: { label: 'Darstellung' },
          gridLines: { label: 'Gitterlinien anzeigen' },
          gridHeaderRow: { label: 'Erste Zeile ist Kopfzeile' },
          gridHeaderCol: { label: 'Erste Spalte ist Kopfspalte' },
          gridHeaderColWidth: { label: 'Breite der Kopfspalte (px, leer = automatisch)' },
          gridHeaderColGap: { label: 'Abstand nach der Kopfspalte (px)' },
          gridHeaderRowGap: { label: 'Abstand nach der Kopfzeile (px)' },
          sectionMatrix: { label: 'Matrix' },
          matrix: { label: 'Zeilen, Spalten und richtige Antworten' },
          matrixSingle: {
            label: 'Pro Zeile nur eine Antwort',
            help: 'An: Auswahlknöpfe statt Kästchen, je Zeile ist genau eine Spalte wählbar.'
          },
          matrixShuffle: { label: 'Zeilen mischen' },
          matrixScoring: {
            label: 'Bewertung der Matrix',
            help: 'Pro Kreuz: jedes richtige Kreuz gibt Teilpunkte. Pro Zeile: nur komplett richtig angekreuzte Zeilen zählen.',
            option: { cell: 'Pro Kreuz (Teilpunkte)', row: 'Pro Zeile (ganz richtig)' }
          },
          sectionStatements: { label: 'Aussagen' },
          statements: {
            label: 'Aussagen',
            itemLabel: 'Aussage',
            help: 'Jede Aussage wird eine Zeile. $…$ für Formeln, Zeilenumbrüche bleiben erhalten.',
            text: { label: 'Aussage' },
            correct: { label: 'Die Aussage ist', option: { true: 'richtig', false: 'falsch' } }
          },
          tfUnanswered: {
            label: 'Spalte „Unbeantwortet“ anzeigen',
            help: 'Vorausgewählt; so lassen sich Aussagen bewusst offen lassen (0 Punkte statt Abzug).'
          },
          tfShuffle: { label: 'Aussagen mischen' },
          tfLabelTrue: { label: 'Spaltenkopf „Richtig“ (optional)' },
          tfLabelFalse: { label: 'Spaltenkopf „Falsch“ (optional)' },
          penalizeWrong: {
            label: 'Punkte für falsche Antworten abziehen',
            help: 'Jede falsche Antwort zieht Punkte ab, die Gesamtpunktzahl fällt dabei nie unter 0. Unbeantwortetes zählt 0.'
          },
          penaltyPoints: {
            label: 'Abzug pro falscher Antwort (Punkte)',
            placeholder: 'leer = so viel wie eine richtige Antwort bringt',
            help: 'Leer lassen: Abzug entspricht dem Wert einer richtigen Antwort (Punkte geteilt durch Anzahl der Aussagen bzw. richtigen Kreuze/Zeilen).'
          },
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Wertetabelle'
          },
          preset: {
            label: 'Vorlage',
            help: 'Bei "Manuell" eigene Spalten und Formeln festlegen.',
            option: {
              custom: 'Manuell (leer)',
              linear: 'Beispiel: f(x) = 2x + 1',
              quadratic: 'Beispiel: f(x) = x^2',
              'area-rect': 'Beispiel: Rechteck-Fläche A = a*b'
            }
          },
          reset: {
            label: 'Zurücksetzen'
          },
          sectionQuestion: {
            label: 'Frage'
          },
          question: {
            label: 'Aufgabentext',
            help: 'KaTeX wird gerendert. Beispiel: $f(x) = 2x + 1$.'
          },
          sectionVariables: {
            label: 'Variablen'
          },
          variables: {
            label: 'Variablen',
            itemLabel: 'Variable',
            help: 'Pro Zeile neu gewürfelt. Werden über ihren Namen in Spalten-Formeln referenziert.',
            name: {
              label: 'Name',
              placeholder: 'z. B. n',
              help: 'Nur Buchstaben/Ziffern.'
            },
            sectionRange: {
              label: 'Bereich'
            },
            min: {
              label: 'Min'
            },
            max: {
              label: 'Max'
            },
            integer: {
              label: 'Ganzzahlig'
            }
          },
          sectionColumns: {
            label: 'Spalten'
          },
          columns: {
            listLabel: 'Spalten',
            label: {
              label: 'Spaltenkopf',
              placeholder: 'z. B. f(x) = 2*x + 1',
              help: 'Schreibe „Name = Term", damit die Formel automatisch übernommen wird.'
            },
            itemLabel: 'Spalte',
            key: {
              label: 'Schlüssel',
              placeholder: 'z. B. x',
              help: 'Interner Name für Formeln. Nur Buchstaben/Ziffern.'
            },
            sectionSource: {
              label: 'Quelle'
            },
            type: {
              label: 'Typ',
              option: {
                var: 'Zufallswert',
                answer: 'Antwortfeld (Studierende füllen aus)',
                expr: 'Berechnet (automatisch)',
                text: 'Statischer Text'
              }
            },
            sectionRange: {
              label: 'Bereich'
            },
            min: {
              label: 'Min',
              disabledHint: 'Ohne Effekt: die Formel ersetzt den Zufallswert.'
            },
            max: {
              label: 'Max',
              disabledHint: 'Ohne Effekt: die Formel ersetzt den Zufallswert.'
            },
            integer: {
              label: 'Ganzzahlig'
            },
            varFormula: {
              label: 'Formel (optional)',
              placeholder: 'z. B. 5 * k',
              help: 'Wenn gesetzt, ersetzt sie den Zufallswert. Greift auf Top-Level-Variablen zu. Beispiel: Variable k = 0..72 ganz, Formel „5 * k" liefert zufällige Vielfache von 5 zwischen 0 und 360.'
            },
            text: {
              label: 'Text'
            },
            sectionFormula: {
              label: 'Formel'
            },
            formula: {
              label: 'Formel',
              placeholder: 'z. B. 2*x + 1',
              help: 'Verwendet andere Spalten-Schlüssel und Variablen.'
            },
            tolerance: {
              label: 'Toleranz',
              help: 'Erlaubte Abweichung der Studierenden-Antwort.'
            },
            sectionDisplay: {
              label: 'Anzeige'
            },
            unit: {
              label: 'Einheit (optional)',
              placeholder: 'z. B. cm'
            },
            decimals: {
              label: 'Nachkommastellen (leer = wie Tabelle)'
            },
            fraction: {
              label: 'Als Bruch anzeigen',
              help: 'Dezimalwerte wie 4.5 werden als Bruch (\\frac{9}{2}) gerendert. Ohne Effekt bei ganzzahligen Werten.'
            }
          },
          sectionRows: {
            label: 'Zeilen'
          },
          rowCount: {
            label: 'Anzahl Zeilen'
          },
          sectionScoring: {
            label: 'Bewertung'
          },
          maxPoints: {
            label: 'Punkte (gesamt)',
            help: 'Wird gleichmaessig auf alle Antwort-Zellen verteilt.'
          }
        }
      },
      'text-input': {
        label: 'Text-Eingabe',
        description: 'Freie Text-Antwort. Vergleich exakt oder per regulärem Ausdruck.',
        summary: {
          empty: '(Frage leer)'
        },
        validate: {
          questionEmpty: 'Frage ist leer.',
          noAnswers: 'Keine akzeptierten Antworten definiert.'
        },
        itemModeLabel: {
          manual: 'manuell'
        },
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Text-Eingabe'
          },
          preset: {
            label: 'Vorlage',
            help: '„Manuell" ist für eigene Fragen. Beispiele zeigen alle Auswertungsarten.',
            option: {
              custom: 'Manuell (leer)',
              'example-term': 'Beispiel: Physik, Fachbegriff (Ohmsches Gesetz)',
              'example-keyword': 'Beispiel: Informatik, Schlüsselwörter (Mehrere Begriffe)',
              'example-regex': 'Beispiel: Regex, Muster (3-stellige Zahl)'
            }
          },
          reset: {
            label: '↺ Zurücksetzen'
          },
          sectionQuestion: {
            label: 'Frage'
          },
          question: {
            label: 'Fragetext'
          },
          sectionAnswers: {
            label: 'Akzeptierte Antworten'
          },
          answerMode: {
            label: 'Auswertungsart (für alle Antworten)',
            help: '„Manuell" erlaubt unterschiedliche Vergleichsarten je Antworteintrag.',
            option: {
              iexact: 'Exakt: Groß-/Kleinschreibung egal (Standard)',
              manual: 'Manuell: Vergleichsart je Eintrag wählen',
              regex: 'Regulärer Ausdruck: Muster wie \\d+ oder (A|B)',
              keywords: 'Schlüsselwörter: Teilpunkte pro gefundenem Begriff'
            }
          },
          answers: {
            label: 'Antworten',
            itemLabel: 'Antwort',
            item: {
              value: {
                label: 'Antworttext oder Regex'
              },
              mode: {
                label: 'Vergleich',
                option: {
                  iexact: 'Exakt (Groß/Klein egal)',
                  regex: 'Regulärer Ausdruck'
                }
              }
            }
          },
          sectionScoring: {
            label: 'Bewertung'
          },
          maxPoints: {
            label: 'Punkte (gesamt)'
          },
          partialKeywords: {
            label: 'Teilpunkte aktivieren',
            help: 'Jeder gefundene Antworteintrag gibt anteilige Punkte. Geeignet für Freitextantworten mit mehreren gesuchten Begriffen.'
          }
        },
        feedback: {
          pleaseEnterAnswer: 'Bitte eine Antwort eingeben.',
          correctKeywords: 'Korrekt. {pts} / {max} Punkte ({hits} von {total} Schlüsselwörtern).',
          partialKeywords: 'Teilweise richtig: {pts} / {max} Punkte ({hits} von {total} Schlüsselwörtern gefunden).',
          noKeyword: 'Kein Schlüsselwort gefunden. 0 / {max} Punkte.'
        },
        preview: {
          questionPlaceholder: '(Frage)',
          answersLabel: 'Antwort(en):',
          inputPlaceholder: 'Antwort eingeben…'
        }
      },
      'truth-table': {
        label: 'Wahrheitstabelle',
        description: 'Boolesche Ausdrücke (AND, OR, NOT, XOR) auswerten, pro Zeile 0/1.',
        summary: {
          expressionsCount: '{count} Ausdrücke'
        },
        validate: {
          noExpressions: 'Keine booleschen Ausdrücke definiert.'
        },
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Wahrheitstabelle'
          },
          expressionPreset: {
            label: 'Vorlage',
            option: {
              custom: 'Manuell (leer)',
              'basics-2': 'Beispiel: AND, OR, NOT (2 Variablen)',
              'mixed-2': 'Beispiel: Gemischte Logik (2 Variablen)',
              'mixed-3': 'Beispiel: Gemischte Logik (3 Variablen)',
              'de-morgan': 'Beispiel: De-Morgan-Gesetze',
              xor: 'Beispiel: XOR / Entweder-oder'
            }
          },
          reset: {
            label: '↺ Zurücksetzen'
          },
          variableCount: {
            label: 'Variablenzahl',
            help: '2 Variablen = 4 Zeilen, 3 Variablen = 8 Zeilen.'
          },
          sectionExpressions: {
            label: 'Boolesche Ausdrücke'
          },
          expressions: {
            label: 'Ausdrücke',
            itemLabel: 'Ausdruck'
          },
          expr: {
            label: 'Boolescher Ausdruck',
            placeholder: 'a && b || !c',
            help: 'Operatoren: && (AND), || (OR), ! (NOT), xor (XOR)'
          },
          vars: {
            label: 'Variablen (kommasepariert)',
            placeholder: 'a,b,c'
          },
          sectionSettings: {
            label: 'Einstellungen & Bewertung'
          },
          randomize: {
            label: 'Ausdruck zufällig wählen'
          },
          maxPoints: {
            label: 'Punkte'
          },
          penalizeWrong: { help: 'Jede falsch ausgefüllte Zeile zieht Punkte ab; die Gesamtpunktzahl fällt nie unter 0. Mit „?“ offen gelassene Zeilen zählen 0.' }
        },
        defaultTitle: 'Wahrheitstabelle',
        expressionLabel: 'Ausdruck',
        resultColumn: 'Ergebnis',
        fillHint: 'Tragen Sie für jede Zeile 0 oder 1 ein.',
        fillAllRows: 'Bitte alle Zeilen ausfüllen.',
        partialRows: 'Teilweise richtig: {correct} von {total} Zeilen ({pts} / {max} Punkte).',
        noRowCorrect: 'Keine Zeile korrekt. 0 / {max} Punkte.'
      },
      'unit-convert': {
        label: 'Einheitenumrechnung',
        description: 'Physikalische Einheiten umrechnen mit zufälligen Werten.',
        inputPlaceholder: 'Zahl eingeben',
        noTasksDefined: 'Keine Aufgaben definiert.',
        newTaskGenerated: 'Neue Aufgabe generiert.',
        solutionUnavailable: 'Lösung nicht verfügbar.',
        enterValidNumber: 'Bitte eine gültige Zahl eingeben.',
        correctWithSolution: 'Korrekt. (Lösung: {value} {unit})',
        exampleSolution: 'Beispiel-Lösung',
        questionTemplateFallback: 'Rechnen Sie {value} {fromUnit} in {toUnit} um.',
        validate: {
          minOneConversion: 'Mindestens eine Umrechnung konfigurieren.',
          unknownUnit: 'Umrechnung {index}: unbekannte Einheit.',
          categoryMismatch: 'Umrechnung {index}: {from} nach {to} ist nicht möglich.'
        },
        preview: {
          questionTemplate: 'Rechnen Sie {value} {fromUnit} in {toUnit} um.'
        },
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Einheitenumrechnung'
          },
          preset: {
            label: 'Vorlage',
            help: 'Beispiele zeigen alle Möglichkeiten des Blocks. „Manuell" für eigene Fragen.',
            option: {
              custom: 'Manuell (leer)',
              'ex-speed': 'Beispiel: Geschwindigkeit  (km/h, m/s, kn)',
              'ex-temp': 'Beispiel: Temperatur  (°C, K, °F)',
              'ex-energy': 'Beispiel: Energie  (kWh, MJ, kJ, kcal)',
              'ex-pressure': 'Beispiel: Druck  (bar, Pa, atm, mmHg)',
              'ex-data': 'Beispiel: Datenmenge  (GiB ↔ GB, MiB ↔ MB)',
              'ex-power': 'Beispiel: Leistung  (PS, kW, W, MW)',
              'ex-length': 'Beispiel: Länge  (nm, μm, mm, m, km)',
              'ex-density': 'Beispiel: Dichte  (g/cm³, kg/m³, kg/L)',
              'ex-mixed': 'Beispiel: Gemischt, alle Kategorien'
            }
          },
          reset: {
            label: '↺ Zurücksetzen'
          },
          sec_q: {
            label: 'Frage'
          },
          questionTemplate: {
            label: 'Frage-Vorlage  (Variablen als {value}, {fromUnit}, {toUnit})',
            help: 'Beispiel: „Rechnen Sie {value} {fromUnit} in {toUnit} um." Variablen werden bei jeder neuen Aufgabe belegt.'
          },
          sec_vars: {
            label: 'Zufallsvariablen'
          },
          variants: {
            label: 'Umrechnungen',
            itemLabel: 'Umrechnung'
          },
          dir: {
            label: 'Richtung'
          },
          valueMin: {
            label: 'von'
          },
          valueMax: {
            label: 'bis'
          },
          integer: {
            label: 'Nur Ganzzahlen'
          },
          randomize: {
            label: 'Variante zufällig wählen'
          },
          randomSwap: {
            label: 'Richtung zufällig vertauschen'
          },
          sec_solution: {
            label: 'Lösung'
          },
          tolerance: {
            label: 'Toleranz  (±, relativ)',
            help: 'Abweichung, die noch als korrekt gilt. 0.01 = ±1 %.'
          },
          sec_score: {
            label: 'Bewertung'
          },
          maxPoints: {
            label: 'Punkte'
          }
        }
      },
      'vector-question': {
        label: 'Vektor 2D ablesen',
        description: '2D-Vektor: Komponenten, Betrag, Winkel ablesen.',
        summary: '{count} Vektoren im Pool',
        field: {
          blockTitle: {
            label: 'Überschrift',
            placeholder: 'Vektor-Aufgabe'
          },
          pool: {
            label: 'Vektor-Pool',
            itemLabel: 'Vektor',
            item: {
              x: {
                label: 'x-Komponente'
              },
              y: {
                label: 'y-Komponente'
              }
            }
          },
          randomize: {
            label: 'Vektor zufällig wählen'
          },
          _sec_query: {
            label: 'Abfrage'
          },
          questionMode: {
            label: 'Was wird gefragt?',
            option: {
              all: 'Komponenten, Betrag und Winkel',
              components: 'Nur Komponenten  (x, y)',
              magnitude: 'Nur Betrag  |v|',
              angle: 'Nur Winkel  φ',
              'unit-vector': 'Einheitsvektor  v̂  (v / |v|)'
            }
          },
          _sec_fields: {
            label: 'Felder & Toleranzen'
          },
          fields: {
            label: 'Felder individuell ein-/ausblenden',
            help: 'Nur bei „Komponenten, Betrag und Winkel" relevant. Alle anderen Modi legen die Felder fest.',
            item: {
              x: {
                label: 'x'
              },
              y: {
                label: 'y'
              },
              mag: {
                label: '|v|'
              },
              angle: {
                label: 'Winkel'
              }
            }
          },
          angleUnit: {
            label: 'Winkel-Einheit',
            option: {
              deg: 'Grad (°)',
              rad: 'Radiant (rad)'
            }
          },
          tolerances: {
            label: 'Toleranzen  (±)',
            item: {
              x: {
                label: 'x'
              },
              y: {
                label: 'y'
              },
              mag: {
                label: '|v|'
              },
              angle: {
                label: 'Winkel'
              }
            }
          },
          _sec_score: {
            label: 'Darstellung & Bewertung'
          },
          plotRange: {
            label: 'Plot-Bereich (±)'
          },
          maxPoints: {
            label: 'Punkte'
          }
        },
        plotTitle: 'Vektor-Plot',
        inputHeading: 'Eingabe',
        input: {
          angleDeg: 'α (Grad)',
          angleRad: 'α (rad)'
        },
        placeholder: {
          x: 'z. B. 3',
          y: 'z. B. 2',
          unitX: 'z. B. 0.832',
          unitY: 'z. B. 0.555',
          mag: 'z. B. 3.61',
          angleDeg: 'z. B. 33.7',
          angleRad: 'z. B. pi/6'
        },
        feedback: {
          newGenerated: 'Neue Aufgabe generiert.',
          fillAtLeastOne: 'Bitte mindestens ein Feld ausfüllen.',
          fieldMissing: '{field} fehlt.',
          fieldCorrect: '{field} richtig.',
          fieldWrong: '{field} noch nicht richtig.',
          partialDetailed: 'Teilweise richtig ({ok} von {total}): {pts} / {max} Punkte. {details}',
          zeroDetailed: '0 / {max} Punkte. {details}'
        },
        question: {
          components: 'Lesen Sie die Komponenten x und y des Vektors ab.',
          magnitude: 'Bestimmen Sie den Betrag |v| des Vektors.',
          angle: 'Bestimmen Sie den Winkel des Vektors zur positiven x-Achse.',
          unitVector: 'Bestimmen Sie den Einheitsvektor v̂ = v / |v|.',
          all: 'Lesen Sie Komponenten, Betrag und Winkel des Vektors ab.'
        }
      },
      video: {
        label: 'Video',
        description: 'Videodatei oder YouTube-/Vimeo-URL einbetten. Datei-Upload oder Link.',
        field: {
          title: {
            label: 'Titel (über dem Player, optional)'
          },
          src: {
            label: 'Videoquelle (Datei, YouTube oder Vimeo)',
            help: 'Hochgeladene Dateien werden als Data-URL eingebettet. YouTube- und Vimeo-Links werden automatisch erkannt und als Embed eingebunden.'
          },
          poster: {
            label: 'Vorschaubild (nur bei Datei-Upload sichtbar)',
            help: 'Bei YouTube/Vimeo verwendet der Embed seine eigene Vorschau.'
          },
          caption: {
            label: 'Bildunterschrift (unter dem Player, optional)'
          }
        },
        placeholder: {
          noVideo: '(Video noch nicht gesetzt)'
        },
        preview: {
          noVideoFile: '(noch keine Videodatei)'
        },
        embed: {
          defaultTitle: 'Eingebettetes Video'
        }
      },
      composition: {
        label: 'Komposition',
        description: 'Skizze aus Linien, Kreisen, Pfeilen und Beschriftungen. Optional als Aufgabe bewertbar.',
        shape: {
          line: 'Linie',
          arrow: 'Pfeil',
          circle: 'Kreis',
          ellipse: 'Ellipse',
          polygon: 'Polygon',
          rect: 'Rechteck',
          label: 'Beschriftung',
          coords: 'Koordinatensystem',
          image: 'Bild',
          yesno: 'Ja/Nein-Feld'
        },
        polygonByCount: {
          3: 'Dreieck',
          4: 'Viereck',
          5: 'Fünfeck',
          6: 'Sechseck',
          7: 'Siebeneck',
          8: 'Achteck',
          generic: '{n}-Eck'
        },
        polygonPreset: {
          right:       { label: 'Rechtwinklig',   hint: '90° unten links' },
          isosceles:   { label: 'Gleichschenklig', hint: 'Spitze oben' },
          equilateral: { label: 'Gleichseitig',   hint: 'alle Seiten gleich' },
          scalene:     { label: 'Unregelmäßig',   hint: 'beliebig anpassbar' },
          square:      { label: 'Quadrat',        hint: '4 gleiche Seiten' },
          pentagon:    { label: 'Fünfeck',        hint: 'regelmäßig' },
          hexagon:     { label: 'Sechseck',       hint: 'regelmäßig' }
        },
        template: {
          'tpl-rect-area':      { label: 'Rechteck-Fläche',                                 description: 'A = a · b' },
          'tpl-triangle-area':  { label: 'Dreieck-Fläche',                                  description: 'A = (a · h) / 2' },
          'tpl-pythagoras':     { label: 'Pythagoras',                                      description: 'c = √(a² + b²)' },
          'tpl-circle-area':    { label: 'Kreis-Fläche',                                    description: 'A = π · r²' },
          'tpl-multi-step-pyth':{ label: 'Mehrstufig: Pythagoras  (Lösung als Variable)',   description: '{1} und {2}, dabei nutzt {2} die Antwort {1*}' }
        },
        summary: {
          empty: 'leer',
          cornersSuffix: 'Ecken'
        },
        display: {
          fallback: 'Form {n}',
          label: 'Beschriftung „{text}"',
          imageEmpty: 'Bild  (leer)',
          yesno: 'Ja/Nein-Feld  ({answer}, {pts} P.)'
        },
        yesno: {
          yes: 'Ja',
          no: 'Nein',
          placeholder: 'Ja/Nein'
        },
        preview: {
          shapeSingular: 'Form',
          shapePlural: 'Formen'
        },
        canvas: {
          empty: {
            title: 'Komposition ist leer',
            body: 'Klicken Sie oben auf <strong>Vorlage…</strong>, um mit einem fertigen Beispiel (Rechteck, Pythagoras, Kreis, Dreieck) zu starten, oder wählen Sie ein Form-Werkzeug.'
          },
          imagePlaceholder: 'Bild auswählen…',
          labelInputPlaceholder: 'z. B. a oder {a}',
          previewHead: 'Vorschau · Enter = speichern · Shift+Enter = neue Zeile · Esc = abbrechen',
          hint: {
            multi: '{count} Formen ausgewählt. Ziehen verschiebt alle • Pfeiltasten nudgen (⇧ +10 px) • ⌘/Ctrl + D / C / V • ⌫ löscht • Esc hebt auf.',
            single: 'Form ausgewählt. Ziehen verschiebt sie • Pfeiltasten verschieben pixelweise (⇧ +10 px) • ⌘/Ctrl + Z / ⇧Z rückgängig / wiederherstellen • ⌘/Ctrl + D dupliziert • ⌘/Ctrl + C / V kopiert / fügt ein • ⌫ löscht • Esc hebt die Auswahl auf.',
            selectTool: 'Auswahl-Werkzeug aktiv: Mit der Maus einen Rahmen aufziehen, um mehrere Formen zu markieren.',
            idle: 'Auf eine Form klicken oder einen Rahmen aufziehen für Mehrfachauswahl. Werkzeuge oben links.'
          }
        },
        field: {
          integerAnswers: { help: 'Die Variablen werden so gezogen, dass alle per Formel berechneten Antwortfelder ganze Zahlen ergeben.' },
          blockTitle: { label: 'Überschrift', placeholder: 'Komposition' },
          _sec_canvas: { label: 'Zeichenfläche' },
          canvasWidth: { label: 'Breite (px)' },
          canvasHeight: { label: 'Höhe (px)' },
          background: { label: 'Hintergrund' },
          _sec_grading: { label: 'Bewertung' },
          gradingMode: {
            label: 'Bewertungsart',
            help: 'Bei „Mit Lösung" können Labels Eingabefelder enthalten: schreiben Sie {} in den Text, dort erscheint das Antwortfeld. {a} wird zu einer Variable.',
            option: {
              none: 'Keine (nur Anzeige)',
              acknowledge: '„Verstanden"-Button',
              fillblanks: 'Mit Lösung (Eingabefelder)',
              click: 'Klick-Aufgabe (richtige Formen anklicken)',
              hotspot: 'Hotspot-Aufgabe (Bereiche markieren)'
            }
          },
          prompt: { label: 'Aufgabentext (optional)', help: 'Wird oberhalb der Komposition angezeigt. Variablen als {name} werden durch die aktuellen Werte ersetzt (wie in den Beschriftungen), $…$ für Formeln.' },
          maxPoints: { label: 'Maximalpunkte', help: 'Gilt für die Antwortfelder {1}, {2} … (zusammen). Ja/Nein-Felder bringen ihre eigenen Punkte zusätzlich.' },
          tolerance: { label: 'Toleranz', help: 'Zulässige Abweichung der Antwort vom berechneten Wert. 0.01 bedeutet ±0,01. Wird auf alle Lösungsfelder angewendet, die keine eigene Toleranz haben.' },
          penalizeWrong: { label: 'Punkte für falsche Antworten abziehen', help: 'Klick-Modus: jeder Klick auf eine nicht als korrekt markierte Form. Lückentext: jedes falsch beantwortete Ja/Nein-Feld. Die Gesamtpunktzahl fällt nie unter 0.' },
          penaltyPoints: { help: 'Leer lassen: Klick-Modus = Wert einer richtigen Form, Ja/Nein = die Punkte des jeweiligen Feldes.' },
          _sec_vars: { label: 'Zufallsvariablen' },
          variables: {
            label: 'Variablen',
            itemLabel: 'Variable',
            help: 'In jedem Label kann {name} als Platzhalter genutzt werden. Bei jedem "Neu generieren"-Klick (erscheint sobald mindestens eine Variable definiert ist) werden alle Variablen im angegebenen Bereich neu gezogen. Im Lückentext-Modus können Lücken zusätzlich eine Formel referenzieren, die mit den aktuellen Werten ausgewertet wird.',
            item: {
              name: { label: 'Name', placeholder: 'z. B. a' },
              min: { label: 'Min' },
              max: { label: 'Max' },
              integer: { label: 'Ganzzahlig' }
            }
          },
          _sec_shapes: { label: 'Formen (erweitert)' },
          shapes: {
            label: 'Formen',
            itemLabel: 'Form',
            help: 'Tipp: Formen lassen sich auch direkt auf der Canvas verschieben und in der Werkzeugleiste oberhalb der Canvas anpassen.',
            item: {
              type: { label: 'Typ' },
              text: { label: 'Text' },
              sides: { label: 'Ecken' },
              color: { label: 'Linienfarbe' },
              fill: { label: 'Füllfarbe' },
              isCorrect: { label: 'Richtige Antwort (Klick-Modus)' },
              blank: { label: 'Als Lücke (Label-Modus)' },
              correctText: { label: 'Lösung (Lücke)' },
              isTarget: { label: 'Zielzone (Hotspot-Modus)' },
              isMarker: { label: 'Beweglicher Marker (Hotspot-Modus)' },
              markerTargetIdx: { label: 'Index der korrekten Zielzone' },
              yesnoCorrect: { label: 'Richtige Antwort (Ja/Nein-Feld)' },
              yesnoPoints: { label: 'Punkte (Ja/Nein-Feld)' }
            }
          }
        },
        toolbar: {
          yesno: {
            correctLabel: 'Richtig:',
            correctTitle: 'Welche Antwort ist richtig?',
            pointsLabel: 'Punkte:',
            pointsTitle: 'Punkte für dieses Feld (Standard 1)'
          },
          tool: {
            move: 'Verschieben-Werkzeug (V)',
            select: 'Auswahl-Werkzeug (S): Rahmen aufziehen für Mehrfachauswahl'
          },
          template: {
            title: 'Vorlage einfügen (Rechteck, Dreieck, Pythagoras, Kreis)',
            label: 'Vorlage…'
          },
          addShape: '{name} hinzufügen',
          mode: {
            none: 'Nur Anzeige',
            acknowledge: 'Verstanden-Button',
            fillblanks: 'Mit Lösung',
            chipTitle: 'Bewertungsart wechseln',
            aria: 'Bewertungsmodus: {name}'
          },
          addVariable: {
            title: 'Neue Zufallsvariable anlegen (Name, Min, Max)',
            label: '+ Variable'
          },
          editVariables: {
            titleSingular: '{count} Variable definiert. Klicken zum Bearbeiten.',
            titlePlural: '{count} Variablen definiert. Klicken zum Bearbeiten.',
            label: 'Variablen ({count})'
          },
          shapes: {
            titleSingular: '{count} Form in dieser Komposition. Klicken zum Auswählen.',
            titlePlural: '{count} Formen in dieser Komposition. Klicken zum Auswählen.',
            label: 'Formen ({count})'
          },
          transparent: {
            activeTitle: 'Transparent aktiv. Klicken für Farbe',
            setTitle: 'Auf transparent setzen'
          },
          color: {
            stroke: 'Linie',
            axis: 'Achse',
            text: 'Text',
            fill: 'Füllung'
          },
          polygon: {
            cornersLabel: 'Ecken',
            cornersTitle: 'Anzahl Ecken (regeneriert als regulär)',
            regularLabel: 'Regulär',
            regularTitle: 'Polygon zu reguläre Form zurücksetzen'
          },
          strokeWidthLabel: 'Stärke',
          dash: {
            title: 'Linienstil',
            solid: '─ durchgezogen',
            dashed: '┄ gestrichelt',
            dotted: '┈ gepunktet'
          },
          label: {
            textPlaceholder: 'z. B. a oder {a}',
            textTitle: 'Text-Inhalt des Labels',
            fontSizeTitle: 'Schriftgröße',
            boldAll: 'Ganz fett',
            boldAllTitle: 'Ganzes Textfeld fett darstellen (einzelne Wörter: markieren und B-Button)',
            format: {
              bold: 'Fett (<b>…</b>)',
              italic: 'Kursiv (<i>…</i>)',
              underline: 'Unterstrichen (<u>…</u>)',
              sup: 'Hochgestellt (<sup>…</sup>)',
              sub: 'Tiefgestellt (<sub>…</sub>)',
              lineBreak: 'Zeilenumbruch (<br>, auch Umschalt+Enter beim Bearbeiten im Bild)'
            }
          },
          insert: {
            title: 'Variable oder Sonderzeichen einfügen',
            label: 'Einfügen ▾'
          },
          coords: {
            showGrid: 'Gitter',
            showLabels: 'Achsen­beschriftung',
            xMin: 'x min',
            xMax: 'x max',
            yMin: 'y min',
            yMax: 'y max',
            step: 'Schritt',
            rangeTitle: 'Achsenbereich {name}',
            stepTitle: 'Abstand zwischen Gitter/Beschriftung'
          },
          image: {
            replace: 'Bild ersetzen…'
          },
          grading: {
            isCorrect: 'Korrekt',
            isTarget: 'Zielzone',
            isMarker: 'Marker',
            targetOption: 'Ziel #{idx} ({name})',
            targetTitle: 'Korrekte Zielzone',
            targetChoose: '(Ziel wählen)',
            formulaTitle: 'Formel und Toleranz für das Antwortfeld konfigurieren',
            formulaLabel: 'Formel ▾'
          },
          action: {
            forward: 'Nach vorne',
            backward: 'Nach hinten',
            duplicate: 'Duplizieren',
            delete: 'Form löschen'
          }
        },
        popover: {
          insert: {
            solutionsHead: 'Lösungsfelder',
            newSlotTitle: 'Neues Antwort-Eingabefeld (Slot {slot})',
            mirrorTitle: 'Spiegelung: zeigt die Schüler-Antwort aus Slot {slot} an (auch nutzbar in Formeln)',
            hint: '<strong>{N}</strong>: Antwortfeld · <strong>{N*}</strong>: Schüler-Antwort weiternutzen (im Text oder in einer Formel)',
            variablesHead: 'Variablen',
            globalVariablesHead: 'Globale Variablen (Kopfdaten)',
            symbolsHead: 'Sonderzeichen'
          },
          grading: {
            blankToggle: '<strong>Lücke</strong>: Label wird zur Antwort-Eingabe',
            formulaForSlot: 'Formel für {slot}',
            formulaGeneric: 'Formel (mit Variablen)',
            formulaPlaceholder: 'z. B. a*b · sqrt(a*a+b*b) · sqrt({1*})',
            formulaTitle: 'Formel · Schüler-Antworten als {1*}, {2*} … oder s1, s2 …',
            helpSqrt: 'Wurzel',
            helpPi: 'Kreiszahl π',
            helpSquare: 'Quadrieren',
            trigSelectTitle: 'Winkelfunktion einfügen (Einheit siehe „Winkel in“ unten)',
            trigSelectPlaceholder: 'sin/cos…',
            angleUnitLabel: 'Winkel in',
            angleUnitTitle: 'Gilt für sin, cos, tan, arcsin, arccos, arctan (= asin, acos, atan) in allen Formeln dieses Blocks. sind(), cosd() … rechnen immer in Grad.',
            angleUnitDeg: 'Grad (°), z. B. sin(30) = 0,5',
            angleUnitRad: 'Bogenmaß (rad), z. B. sin(pi/6) = 0,5',
            varsSelectTitle: 'Variable in die Formel einfügen',
            varsSelectPlaceholder: 'Variable…',
            globalSuffix: 'global',
            slotSelectTitle: 'Schüler-Antwort eines anderen Slots in die Formel einfügen',
            slotSelectPlaceholder: 'Antwort {N*}…',
            multiSlotHintOne: 'Slot <strong>{slot}</strong>: Formel für die erwartete Antwort.',
            multiSlotHintMany: 'Pro Slot eine Formel. Nutze <code>{N*}</code> oder <code>s<i>N</i></code>, um die Antwort aus einem früheren Slot weiterzunutzen.',
            staticLabel: 'Lösung (statisch)',
            staticPlaceholder: 'z. B. 42 oder "Wasser"',
            staticTitle: 'Erwartete Antwort ohne Berechnung. Wird ignoriert sobald eine Formel gesetzt ist.'
          },
          polygon: {
            title: 'Polygon einfügen',
            subtitle: 'Voreinstellung wählen'
          },
          varTable: {
            title: 'Variablen',
            subtitle: 'Tabelle bearbeiten',
            colName: 'Name',
            colMin: 'Min',
            colMax: 'Max',
            colInteger: 'Ganz',
            removeTitle: 'Variable entfernen',
            addRow: '+ Variable',
            cancel: 'Abbrechen',
            save: 'Speichern',
            validate: {
              needName: 'Jede Variable braucht einen Namen.',
              invalidName: 'Ungültiger Name: {name}',
              duplicateName: 'Doppelter Name: {name}',
              rangeInvalid: 'Bereich ungültig bei {name} (Min ≤ Max).'
            }
          },
          shapes: {
            title: 'Formen',
            subtitle: 'zum Auswählen klicken'
          },
          varAdd: {
            title: 'Neue Variable',
            subtitle: 'Im Label-Text als {Name} verwenden',
            name: 'Name',
            min: 'Min',
            max: 'Max',
            integerOnly: 'Nur Ganzzahlen',
            cancel: 'Abbrechen',
            add: 'Hinzufügen',
            validate: {
              startWithLetter: 'Variable-Name muss mit Buchstaben/Unterstrich beginnen.',
              exists: 'Variable „{name}" gibt es schon.',
              rangeInvalid: 'Bereich ungültig (Min ≤ Max).'
            }
          },
          template: {
            title: 'Vorlage einfügen',
            subtitle: 'Ersetzt die aktuelle Komposition'
          },
          templateChooser: {
            question: 'Diese Komposition enthält schon Formen. Wie soll <strong>{name}</strong> eingefügt werden?',
            cancel: 'Abbrechen',
            append: 'Hinzufügen',
            replace: 'Ersetzen',
            explain: '<strong>Hinzufügen</strong> behält bestehende Formen + Variablen (umbenannt bei Namenskonflikt). <strong>Ersetzen</strong> verwirft alles bisherige.'
          }
        },
        runtime: {
          acknowledge: {
            button: 'Verstanden ({pts} Pkt.)',
            confirmed: 'Bestätigt. {pts} / {max} Punkte.'
          },
          click: {
            allFound: 'Alle richtigen Formen gefunden!',
            finish: 'Abschließen',
            summary: '{found} / {total} richtige Formen → {pts} / {max} Punkte.',
            summaryWithWrong: '{found} / {total} richtige Formen, {wrong} falsch → {pts} / {max} Punkte.'
          },
          fillblanks: {
            regenerated: 'Neue Werte generiert.',
            noBlanks: 'Keine Lücken definiert.',
            solutionTitle: 'Lösung: {solution}',
            summary: '{correct} / {total} Lücken korrekt → {pts} / {max} Punkte.',
            summaryWithPartial: '{correct} / {total} Lücken korrekt, {partial} Folgefehler (halbe Punkte) → {pts} / {max} Punkte.'
          },
          hotspot: {
            noMarkers: 'Keine Marker definiert.',
            summary: '{correct} / {total} Marker korrekt → {pts} / {max} Punkte.'
          }
        }
      }
    }
  };

  if(window.BlockUtils && typeof window.BlockUtils.registerLocale === 'function'){
    window.BlockUtils.registerLocale('de', bundle);
  } else {
    window.__ScormI18nPending = window.__ScormI18nPending || [];
    window.__ScormI18nPending.push(['de', bundle]);
  }
})();
