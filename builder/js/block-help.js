// block-help.js: Inline help text for every block type, shown in the
// right config pane as a collapsible "Was ist das?" box. Keeps new authors
// oriented without forcing them to leave the builder for the README.
//
// Format per entry:
//   summary  one-sentence what-it-is (always shown when expanded)
//   steps    ordered list, the minimum sequence to get a working block
//   tips     optional bulleted hints, common pitfalls, recommended toggles
//
// All texts in German for end users. Keep them short. If a block has no
// entry the help box simply does not render.

export const BLOCK_HELP = {
  // Medien & Inhalt
  'heading': {
    summary: 'Überschrift. Strukturiert die Aufgabe und gibt thematische Kapitel an.',
    steps: [
      'Text in das Feld eintragen.',
      'Größe nach Bedarf wählen (H2 ist Standard für Unterabschnitte).'
    ]
  },
  'rich-text': {
    summary: 'Fließtext mit einfachen Formatierungen (Fett, Kursiv, Listen, Links).',
    steps: [
      'Inhalt in den Editor schreiben.',
      'Formatierungs-Toolbar oben für Hervorhebungen verwenden.'
    ],
    tips: [
      'Für Formeln innerhalb des Textes Dollarzeichen wie in LaTeX nutzen, z. B. $a^2 + b^2 = c^2$.'
    ]
  },
  'note-box': {
    summary: 'Farbig hinterlegter Hinweis-Kasten, um wichtige Punkte vom Fließtext abzuheben.',
    steps: [
      'Stil wählen: Info, Warnung, Tipp oder Definition.',
      'Text eintragen.'
    ]
  },
  'image': {
    summary: 'Eingebettetes Bild. Wird als Data-URL ins SCORM-Paket aufgenommen.',
    steps: [
      'Datei auswählen oder per Drag-and-Drop auf die Canvas ziehen.',
      'Alt-Text für Barrierefreiheit eintragen.'
    ],
    tips: [
      'Bilder über 2 MB sollten vorher komprimiert werden, sonst wächst das ZIP unnötig.'
    ]
  },
  'audio': {
    summary: 'Audio-Player mit Standard-Browser-Controls.',
    steps: [
      'Audio-Datei hochladen (mp3, ogg, wav).',
      'Optional: Beschriftung eintragen.'
    ]
  },
  'video': {
    summary: 'Video-Player. Lokale Datei oder YouTube/Vimeo-Embed.',
    steps: [
      'Bei lokalem Video: Datei hochladen (mp4 empfohlen).',
      'Bei YouTube/Vimeo: kompletten Link einfügen, der Builder erkennt das Format automatisch.'
    ],
    tips: [
      'Lokale Videos über 10 MB blähen das SCORM-ZIP stark auf. YouTube/Vimeo-Links sind in der Größe unbegrenzt.'
    ]
  },
  'file-download': {
    summary: 'Liste herunterladbarer Dateien (PDFs, Arbeitsblätter, Code-Beispiele).',
    steps: [
      'Pro Datei eine Zeile anlegen, Datei hochladen, Beschriftung eintragen.'
    ]
  },
  'divider': {
    summary: 'Horizontale Trennlinie als visueller Abschnittsabschluss.',
    steps: [
      'Einfach platzieren. Keine weitere Konfiguration.'
    ]
  },
  'code': {
    summary: 'Quellcode-Block mit Syntax-Hervorhebung.',
    steps: [
      'Sprache wählen.',
      'Code in das Textfeld einfügen, Einrückung bleibt erhalten.'
    ]
  },
  'summary': {
    summary: 'Zusammenfassungs-Block mit Titel und Stichpunkten. Eignet sich für Schluss-Kapitel.',
    steps: [
      'Titel angeben.',
      'Pro Punkt eine Überschrift und einen Erklärungstext eintragen.'
    ]
  },
  'survey': {
    summary: 'Unbenotete Umfrage. Wird beim Lernenden angezeigt, fließt aber nicht in die Punkte ein.',
    steps: [
      'Frage formulieren.',
      'Antwortoptionen anlegen. Keine Markierung als richtig oder falsch.'
    ],
    tips: [
      'Sinnvoll für Selbsteinschätzungen oder Stimmungsabfragen am Anfang oder Ende einer Einheit.'
    ]
  },

  // Frage
  'multiple-choice': {
    summary: 'Multiple-Choice-Frage mit einer oder mehreren richtigen Antworten.',
    steps: [
      'Frage formulieren.',
      'Antwortoptionen anlegen, richtige mit Häkchen markieren.'
    ],
    tips: [
      'Bei mehreren richtigen Antworten gibt es automatisch Teilpunkte (z. B. 1 von 2 richtigen Antworten = 50 %).',
      'Optionen werden für jeden Lernenden gemischt angezeigt.',
      '„Falsche bestrafen" zieht für jede falsche Auswahl Punkte ab.'
    ]
  },
  'cloze': {
    summary: 'Lückentext: Wörter im Fließtext werden durch Eingabefelder oder Dropdowns ersetzt.',
    steps: [
      'Text mit Lücken in die Vorlage schreiben.',
      'Lücke einbauen: <code>{{Antwort}}</code> für freie Eingabe, <code>{{a|b|c}}</code> für Alternativen, <code>{{=richtig|falsch1|falsch2}}</code> für Dropdown.'
    ],
    tips: [
      '„Groß/Klein ignorieren" lässt zu, dass „berlin" als „Berlin" gewertet wird.',
      'Mehrere richtige Schreibweisen mit | trennen, z. B. <code>{{Hund|dog|chien}}</code>.'
    ]
  },
  'text-input': {
    summary: 'Frei einzugebende Text-Antwort. Vergleichsmodus regelt die Strenge.',
    steps: [
      'Frage formulieren.',
      'Richtige Antworten eintragen.',
      'Vergleichsmodus wählen.'
    ],
    tips: [
      '„Groß/Klein ignorieren" ist Standard. „Genau" nur bei Code oder kontextsensitiven Schreibweisen.',
      '„Regex" für Muster wie <code>\\d{4}</code> (Jahreszahl).',
      '„Stichworte" gibt Teilpunkte für jedes gefundene Stichwort.'
    ]
  },
  'match-pairs': {
    summary: 'Zuordnung per Drag-and-Drop. 1:1 für klassische Paare, Kategorisierung für mehrere Begriffe pro Kategorie.',
    steps: [
      'Modus wählen: Paare oder Kategorisierung.',
      'Bei Paaren: links und rechts paarweise eintragen.',
      'Bei Kategorisierung: Kategorien anlegen, dann Begriffe der jeweiligen Kategorie zuordnen.'
    ],
    tips: [
      'Bilder und Text lassen sich mischen. Bilder über 1 MB komprimieren.',
      'Punkte werden anteilig vergeben: 3 von 4 richtigen Zuordnungen = 75 %.'
    ]
  },
  'sort-list': {
    summary: 'Sortierliste: Lernender bringt Begriffe per Drag-and-Drop in die richtige Reihenfolge.',
    steps: [
      'Elemente in der korrekten Reihenfolge eintragen.',
      'Der Lernende sieht sie gemischt und muss sie sortieren.'
    ],
    tips: [
      'Punkte pro Element in korrekter Position. Bei 4 Elementen und 2 korrekt = 2 Punkte.'
    ]
  },
  'hotzone': {
    summary: 'Klick-auf-Bild-Aufgabe. Der Lernende klickt richtige Bereiche im Bild an.',
    steps: [
      'Bild hochladen.',
      'Rechteckige Zonen über die richtigen Bildbereiche legen.'
    ],
    tips: [
      'Zonen-Koordinaten sind normiert (0 bis 1). Bei Bildwechsel mit gleichem Seitenverhältnis bleiben sie gültig.',
      'Mehrere Zonen pro Bild möglich; Punkte werden anteilig vergeben.'
    ]
  },

  // MINT
  'numeric-input': {
    summary: 'Numerische Eingabe mit Toleranz, Variablen und automatisch generierter Aufgabe.',
    steps: [
      'Frage-Vorlage mit Platzhaltern wie <code>{a}</code> formulieren.',
      'Variablen mit Min/Max-Bereich anlegen.',
      'Lösungs-Formel eintragen, z. B. <code>a*b</code> oder <code>sqrt(a^2+b^2)</code>.'
    ],
    tips: [
      'Bei jedem „Neu generieren" zieht der Builder neue Werte aus den Variablenbereichen.',
      'Toleranz definiert die akzeptierte Abweichung vom Sollwert.',
      'Mit „Term vereinfachen" wird die Antwort als gekürzter Bruch erwartet.'
    ]
  },
  'unit-convert': {
    summary: 'Einheiten-Umrechnung (Länge, Zeit, Masse, Geschwindigkeit, Energie, etc.).',
    steps: [
      'Größenart wählen (z. B. Länge).',
      'Quell- und Ziel-Einheiten festlegen.',
      'Wertebereich definieren.'
    ],
    tips: [
      'Bei „Mit Bruch" sind auch gebrochene Zahlen als Antwort zulässig.',
      'Dezimaltrennzeichen ist Komma; der Builder akzeptiert aber auch Punkt.'
    ]
  },
  'table': {
    summary: 'Tabelle mit variablen Spalten und Eingabefeldern. Für mehrere Berechnungen in einer Aufgabe.',
    steps: [
      'Spalten anlegen, pro Spalte Typ wählen: Zufallswert, Formel oder Freitext-Eingabe.',
      'Zeilenanzahl und Variablenbereich festlegen.'
    ],
    tips: [
      'Formel-Spalten verwenden die Werte der vorherigen Spalten in derselben Zeile.',
      'Schrittweiten bestimmen, ob Werte in 1er-, 0.5er- oder anderen Sprüngen gewürfelt werden.'
    ]
  },
  'equation-system': {
    summary: 'Lineares Gleichungssystem mit 2 oder 3 Variablen, zufällig oder mit eigenen Varianten.',
    steps: [
      'Modus wählen: zufällig generiert oder eigene Varianten.',
      'Bei „Zufällig": Variablen, Koeffizienten- und Lösungsbereich festlegen.',
      'Bei „Manuell": Gleichungen direkt eingeben, z. B. <code>2x + y = 5</code>.'
    ],
    tips: [
      'Im manuellen Modus prüft der Builder, ob das System eindeutig lösbar ist.',
      'Punkte werden pro richtig gelöster Variable vergeben.'
    ]
  },
  'function-question': {
    summary: 'Funktions-Graph mit Frage zu Funktionswerten, Nullstellen, Schnittpunkten oder Extrema.',
    steps: [
      'Funktion eingeben, z. B. <code>x^2 - 3</code> oder <code>sin(x)</code>.',
      'Frage-Modus wählen: Funktionswert, Nullstellen, y-Achsenabschnitt, Extrempunkte, oder eigene Frage.',
      'Sichtbaren Bereich (x/y) festlegen.'
    ],
    tips: [
      'Bei mehreren Nullstellen werden alle erwartet; die Reihenfolge ist egal.',
      'Für Extrempunkte werden die Koordinaten als (x; y) eingegeben.'
    ]
  },
  'complex-question': {
    summary: 'Komplexe Zahl aus einem Plot in der Gaußschen Zahlenebene ablesen.',
    steps: [
      'Pool von Punkten anlegen.',
      'Modus wählen: kartesisch (Re, Im), polar (|z|, φ), beides oder konjugiert.'
    ]
  },
  'complex-input': {
    summary: 'Komplexe Zahl als Antwort. Wie numerische Eingabe, aber mit Operationen auf komplexen Zahlen.',
    steps: [
      'Frage-Vorlage formulieren, z. B. <code>$(a + bi)(c - di)</code>.',
      'Variablen mit Bereichen anlegen.',
      'Lösungs-Formel eintragen, z. B. <code>(a + b*i) * (c - d*i)</code>.'
    ],
    tips: [
      'Eingabeformate für Lernende: <code>3+4i</code>, <code>-i</code>, <code>1/2+3/4i</code>.'
    ]
  },
  'vector-question': {
    summary: 'Vektor aus einem 2D-Plot ablesen. Frage nach Komponenten, Betrag oder Winkel.',
    steps: [
      'Pool von Vektoren anlegen.',
      'Frage-Modus wählen: Komponenten, Betrag, Winkel, Einheitsvektor oder alle.',
      'Winkel-Einheit setzen (Grad oder Radiant).'
    ]
  },
  'truth-table': {
    summary: 'Boolesche Wahrheitstabelle. Lernender füllt Spalte aus, der Builder vergleicht jeden Zeilenwert.',
    steps: [
      'Ausdruck eingeben, z. B. <code>a and b</code>, <code>not (a or b)</code>.',
      'Variablennamen mit Komma trennen.'
    ],
    tips: [
      'Erlaubte Operatoren: and, or, not, xor (sowie &&, ||, !).',
      'Jede Zeile gibt einen Punkt; 2^N Zeilen für N Variablen.'
    ]
  },
  'number-base': {
    summary: 'Zahlensystem-Umrechnung: Binär, Oktal, Dezimal und Hexadezimal.',
    steps: [
      'Richtungs-Preset wählen oder eigene Richtungen festlegen.',
      'Wertebereich angeben (dezimal).'
    ],
    tips: [
      'Hex-Antworten werden case-insensitive geprüft; Prefix <code>0x</code> ist erlaubt.'
    ]
  },

  // Visualisierung
  'composition': {
    summary: 'Vektor-Editor für eigene geometrische Konstruktionen und Beschriftungen. Optional mit Lücken zur Eingabe.',
    steps: [
      'Eine Vorlage einfügen (Rechteck, Dreieck, Pythagoras, Kreis), oder Formen einzeln über die Toolbar hinzufügen.',
      'Beschriftungen mit <code>{a}</code> für Variablen und <code>{1}</code> für Antwortfelder einfügen.',
      'Bewertungs-Modus wählen: Anzeige, Verstanden-Button oder Mit Lösung.'
    ],
    tips: [
      'Variablen werden bei jedem Start neu gewürfelt; die Lösungs-Formel rechnet damit.',
      'Mehrere Slots in einem Label: <code>{1}</code>, <code>{2}</code>, … können untereinander verrechnet werden (<code>{1*}</code> als Antwort von Slot 1 in einer anderen Formel).'
    ]
  },
  'function-sandbox': {
    summary: 'Interaktiver Funktionsplot zum Erkunden. Lernende ändern Parameter und sehen den Effekt sofort.',
    steps: [
      'Funktion mit Platzhaltern für Parameter eintragen.',
      'Parameter mit Min/Max/Schrittweite anlegen.',
      'Sichtbaren x/y-Bereich festlegen.'
    ],
    tips: [
      'Keine Bewertung, reines Lernwerkzeug. Ergänzt eine Funktionsfrage gut.'
    ]
  }
};
