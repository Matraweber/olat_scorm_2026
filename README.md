# SCORM Builder für OLAT

Browser-basiertes Werkzeug zum Erstellen von SCORM-1.2-Lerneinheiten für die OLAT-Lernplattform. Komplett ohne Installation, ohne Backend, ohne Konto. Der Builder läuft als statische HTML/JS-App lokal im Browser. Das fertige SCORM-ZIP wird im Builder erzeugt und heruntergeladen.

Entwickelt am Umwelt-Campus Birkenfeld, Hochschule Trier.

---

## Inhalt

- [Schnellstart](#schnellstart)
- [Projektstruktur](#projektstruktur)
- [Builder-Workflow](#builder-workflow)
- [Mehrsprachigkeit (Deutsch / Englisch)](#mehrsprachigkeit-deutsch--englisch)
- [Block-Kategorien](#block-kategorien)
- [Funktionen der Lerneinheit](#funktionen-der-lerneinheit)
- [Persistenz: Autosave, JSON, SCORM-ZIP](#persistenz-autosave-json-scorm-zip)
- [Tastaturkürzel](#tastaturkürzel)
- [Cache-Buster bumpen](#cache-buster-bumpen)
- [Eigene Block-Typen entwickeln](#eigene-block-typen-entwickeln)
- [Architektur und Entwickler-Dokumentation](#architektur-und-entwickler-dokumentation)
- [Branding / Theme](#branding--theme)
- [Browser-Anforderungen](#browser-anforderungen)

---

## Schnellstart

Der Builder ist eine statische Webseite, er braucht nur einen lokalen HTTP-Server (kein Node.js, kein npm-Build).

**Video-Tutorial:** [tutorial/scorm-builder-tutorial-de.webm](tutorial/scorm-builder-tutorial-de.webm) (englische Fassung: [scorm-builder-tutorial-en.webm](tutorial/scorm-builder-tutorial-en.webm)) zeigt in rund anderthalb Minuten den kompletten Weg vom leeren Kurs bis zum fertigen SCORM-Paket (Kopfdaten, Aufgabe anlegen, Blöcke hinzufügen, Vorschau, Export). Die Dateien lassen sich direkt im Browser öffnen. Auf der Willkommen-Seite des Builders ist das Video passend zur gewählten Sprache eingebettet.

### macOS / Linux

```bash
./start.sh
```

### Windows

```cmd
start.bat
```

Beide Scripts:
- starten einen lokalen Python-HTTP-Server auf Port `8765`
- öffnen automatisch `http://localhost:8765/builder/` im Browser
- beenden via `Strg + C`

### Voraussetzung

Python 3 muss installiert sein. Auf macOS bereits enthalten, unter Windows ggf. von [python.org](https://www.python.org/downloads/) installieren. Der Builder selbst nutzt kein Python, der Server liefert nur die statischen Dateien aus.

### Manuell starten

```bash
python3 serve.py 8765        # Windows: py -3 serve.py 8765
# danach im Browser: http://localhost:8765/builder/
```

`serve.py` ist ein kleiner Python-Server, der bei jeder Antwort `Cache-Control: no-cache` mitschickt (geänderte Dateien kommen sofort an), mehrere Anfragen gleichzeitig bedient (ZIP-Export) und Byte-Ranges unterstützt (Vorspulen im Tutorial-Video). Notfalls geht auch `python3 -m http.server 8765 --bind 127.0.0.1`, dann aber ohne diese drei Punkte.

---

## Projektstruktur

```
olat_scorm_2026/
├── README.md                 Dieses Dokument
├── ARCHITECTURE.md           Entwickler-Dokumentation
├── start.sh / start.bat      Lokalen Server starten
├── serve.py                  Der lokale Server (von start.* benutzt)
├── bump-version.sh / .bat    Cache-Buster in builder/index.html erhöhen
├── tutorial/                 Video-Tutorial (de/en)
├── package.json, test/, test.bat, eslint.config.mjs   Tests und Lint (optional, siehe unten)
└── builder/                  Builder-Applikation
    ├── index.html
    ├── builder.css
    ├── i18n/                 Texte der Builder-Oberfläche (de, en)
    ├── js/                   Builder-Logik (ES-Module)
    ├── template/             Block-Definitionen + SCORM-Runtime
    │   ├── index.html        Einstiegsseite der Lerneinheit (wird beim Export befüllt)
    │   ├── blocks/           Eine Datei pro Block-Typ
    │   ├── i18n/             Texte des SCORM-Players und der Blöcke (de, en)
    │   ├── block-icons.js    SVG-Icons aller Blöcke (nur im Builder)
    │   ├── runtime.js        Wird in jedes SCORM-ZIP eingebettet
    │   ├── styles.css        Runtime-Styles im SCORM-Paket
    │   ├── imsmanifest.xml   SCORM-1.2-Manifest-Template
    │   ├── scorm12.js        SCORM-API-Wrapper für die Lernplattform
    │   └── utils.js          Shared BlockUtils für Block-Runtimes
    ├── task-templates.js     Vordefinierte Aufgaben-Vorlagen
    └── lib/                  Externe Libs (KaTeX, JSZip)
```

### Builder-JS-Module

| Datei | Verantwortung |
|---|---|
| `main.js` | Bootstrap, globale Keyboard-Shortcuts, Autosave-Listener |
| `state.js` | Zentraler State, Autosave, Theme |
| `panes.js` | Sidebar, Kopfdaten-Pane, Theme-Pane |
| `welcome-pane.js` | Welcome-Seite mit Kapitel-Rail und Block-Demos |
| `task-pane.js` | Canvas-Editor-Container, Toolbar, Tabs |
| `task-pane-canvas.js` | Drag/Resize/Snap auf der Canvas |
| `task-pane-config.js` | Rechte Konfig-Pane, Multi-Select-Toolbar |
| `task-pane-bulk.js` | Bulk-Operationen (align, distribute, duplicate, delete) |
| `modals.js` | Block-Picker, Task-Create-Modal |
| `form.js` | Schema-getriebener Form-Renderer (Dispatcher + einfache Felder) |
| `form-media.js` | Upload-Felder (Bild, Audio, Video, Datei) |
| `form-math.js` | Math-Textarea + Formel-Eingabe mit KaTeX-Toolbar |
| `form-specialized.js` | Block-spezifische Felder (zone-editor, unit-pair, unit-from-to, Auswahl-Matrix, Freie Tabelle) |
| `math-toolbar-data.js` | Symboltabelle der Mathe-Toolbar (Pi, Wurzel, etc.) |
| `preview.js` | Block-Vorschau auf der Canvas, Messung für „Höhe für SCORM anpassen“ |
| `block-help.js` | Inhalte der „Was ist das?“-Kästen je Block-Typ |
| `image-shrink.js` | Verkleinert hochgeladene Bilder (max. 2000 px) |
| `i18n.js`, `lang-menu.js` | Übersetzungen der Oberfläche, Sprachumschalter |
| `io.js` | JSON-Im/Export, SCORM-ZIP-Generierung, Preview-Iframe |
| `folder-browser.js` | Header-Dropdown mit Ordner-Tree für SCORM-ZIPs |
| `canvas.js` | Snap-Algorithmus, Block-Summary, Auto-Fit-Höhen |
| `tasks.js` | Task-Validierung, Block-Usage-Tracking, User-Templates |
| `util.js` | DOM-Helper, Escape-Funktionen, Toast, ConfirmDialog |

---

## Builder-Workflow

Vom leeren Builder bis zum SCORM-Paket:

1. **Aufgabe anlegen**: in der Sidebar auf `+ Aufgabe`. Wählbar: leere Aufgabe oder eine Vorlage.
2. **Blöcke hinzufügen**: innerhalb der Aufgabe auf `+ Block`. Ein Menü zeigt alle Block-Typen, gruppiert nach Kategorie.
3. **Block befüllen**: jeder Frage-Block startet mit einer Vorlage: „Manuell (leer)" für eigene Inhalte oder „Beispiel" mit fertigem Inhalt.
4. **Vorschau ansehen**: Button `Vorschau` oben rechts zeigt die Lerneinheit aus Studierenden-Sicht. Antworten lassen sich direkt ausprobieren.
5. **SCORM-ZIP erzeugen**: `SCORM-ZIP erzeugen` lädt ein vollständiges SCORM-1.2-Paket herunter. Diese ZIP-Datei wird in OLAT als Lerneinheit hochgeladen.

### Canvas-Bedienung

- Blöcke werden frei auf einer Canvas platziert (kein starres Raster)
- **Drag** zum Verschieben, **Resize-Handle** unten rechts zum Skalieren
- **Snap-Lines** erscheinen während des Drags, wenn Kanten oder Mitten mit anderen Blöcken übereinstimmen
- **Shift + Klick** für Mehrfachauswahl
- **Strg/Cmd + Mausrad** zum Zoomen
- **Bild per Drag & Drop** auf die Canvas erzeugt automatisch einen Image-Block am Drop-Punkt
- **↕** passt die Blockhöhe an die Vorschau im Builder an, **⇳** an die fertige Lerneinheit (der Block muss dort nicht scrollen)
- **Tabs** pro Aufgabe: aktivieren, mit `+` ergänzen, mit `×` schließen, Namen direkt im Tab bearbeiten
- **Komposition:** Beschriftungen per Doppelklick bearbeiten (Enter speichert, Shift+Enter = neue Zeile, darunter eine Live-Vorschau)

---

## Mehrsprachigkeit (Deutsch / Englisch)

Der Builder und die exportierten Lerneinheiten unterstützen mehrere Sprachen. Dabei gibt es zwei getrennte Ebenen:

### Oberflächensprache (Builder-UI)

Der Knopf oben rechts im Header (z. B. `DE`) öffnet die Sprachauswahl für die Builder-Oberfläche: Buttons, Menüs, Dialoge, Feldbeschriftungen. Die Wahl wird lokal gespeichert und gilt beim nächsten Start wieder. Die Oberflächensprache hat keinen Einfluss auf die Kursinhalte.

### Inhaltssprache (Kursinhalte)

Kursinhalte (Kurstitel, Aufgabentitel, Fragen, Antworten, Texte) können pro Feld in mehreren Sprachen hinterlegt werden:

1. Feld normal auf Deutsch ausfüllen.
2. Oben im Konfigurationspanel (oder bei den Kopfdaten) den Umschalter **Inhaltssprache: DE | EN** auf `EN` stellen.
3. Dasselbe Feld erneut ausfüllen, diesmal auf Englisch. Als Hilfe wird der deutsche Text unter dem Feld angezeigt.
4. Zurückschalten auf `DE` zeigt wieder den deutschen Text. Nichts geht verloren.

Felder ohne englische Übersetzung fallen automatisch auf den deutschen Text zurück.

### Was Studierende sehen

- Enthält die Lerneinheit nur eine Sprache, verhält sich alles wie bisher. Kein Umschalter, keine Änderung.
- Enthält sie zwei Sprachen, erscheint im SCORM-Player oben rechts ein **DE / EN**-Umschalter. Ein Klick wechselt Oberfläche und Inhalte gleichzeitig. Der Kurs startet in der Sprache, die beim Export im Builder aktiv war.
- Der Export packt nur die tatsächlich benutzten Sprachen ins ZIP. Ein rein deutscher Kurs bleibt so klein wie vorher.

### Neue Sprache hinzufügen (für Entwickler)

1. `builder/i18n/<code>.js` anlegen (UI-Texte des Builders, Aufbau wie `en.js`).
2. `builder/template/i18n/<code>.js` anlegen (UI-Texte des SCORM-Players und der Blöcke).
3. In `builder/js/main.js` das Bundle importieren und per `i18n.register('<code>', bundle, meta)` registrieren.
4. In `builder/index.html` das Runtime-Bundle als `<script>` einbinden (neben `template/i18n/de.js`).
5. In `builder/js/io.js` den Code zu `RUNTIME_LOCALES` hinzufügen.

Danach erscheint die Sprache automatisch im Header-Umschalter, im Inhaltssprache-Toggle und im Player-Umschalter.

---

## Block-Kategorien

29 Block-Typen in 4 Kategorien:

| Kategorie | Anzahl | Beispiele |
|---|---|---|
| **Medien & Inhalt** | 11 | Audio, Bild, Video, Datei-Download, Fließtext, Überschrift, Trennlinie, Hinweisbox, Zusammenfassung, Code-Block, Umfrage |
| **Frage** | 6 | Multiple Choice, Lückentext, Text-Eingabe, Zuordnung (Drag & Drop), Sortierliste, Hotzone |
| **MINT** | 10 | Numerische Eingabe, Einheitenumrechnung, Tabelle, Gleichungssystem, Funktion ablesen, Komplexe Zahl ablesen, Komplexe Eingabe, Vektor 2D ablesen, Wahrheitstabelle, Zahlensysteme |
| **Visualisierung** | 2 | Komposition (Vektor-Editor), Funktionsplot-Sandbox |

Im Block-Picker werden Blöcke pro Kategorie nach Nutzungshäufigkeit sortiert. Meistgenutzte zuerst. Die Häufigkeiten werden lokal in `localStorage` mitgezählt.

---

## Funktionen der Lerneinheit

Ausführlich erklärt mit Beispielen sind diese Funktionen auf der **Willkommen-Seite des Builders**; jeder Block hat zusätzlich einen „Was ist das?“-Kasten. Kurzüberblick:

- **Zufallsvariablen** in Rechenblöcken (`{a}` im Text, `a` in der Formel), mit Nachkommastellen, Bruch-/Kommadarstellung und „Nur ganzzahlige Lösungen“. **Globale Variablen** in den Kopfdaten gelten in allen Aufgaben; „Globale Werte neu generieren“ setzt die betroffenen Aufgaben zurück.
- **Bewertung:** Teilpunkte, Abzug für falsche Antworten, begrenzte Versuche (optional mit Abzug pro Versuch), Hinweis und Lösungsweg (KaTeX, mit aktuellen Werten), „Antwort nach Prüfen sperren“, Zeitlimit pro Block oder für die ganze Lerneinheit.
- **Kopfdaten** setzen Standards für alle Blöcke; im Block bedeutet „Wie Lerneinheit“, dass dieser Standard gilt.
- **Aufgabenpools:** pro Durchlauf N zufällige Aufgaben aus einem Pool.
- **Vorlagen:** Aufgaben-Vorlagen (ganze Aufgabe) und Block-Vorlagen (★ am Block). Beide liegen im Browser (`localStorage`), nicht in der Lerneinheit, und gelten nur für diesen Browser und diese Adresse.
- **In OLAT:** Fortschrittsbalken; Unterbrechen und Fortsetzen mit denselben Zufallswerten, Punkten, Sperren, Timern und Eingaben (Zuordnungen per Ziehen ausgenommen). OLAT erhält Punkte, Status (bestanden/nicht bestanden nach der Bestehensschwelle) und Bearbeitungszeit.

---

## Persistenz: Autosave, JSON, SCORM-ZIP

### Autosave (lokal)

- Jede Änderung am Kurs wird mit 800 ms Debounce in `localStorage` gespeichert
- Bei Reload bietet der Builder an, den letzten Stand wiederherzustellen
- `Strg + S` überschreibt die ZIP-Datei, die zuletzt aus der Ordneransicht geöffnet oder über den Speichern-Dialog von „SCORM-ZIP erzeugen“ gespeichert wurde; sonst sichert es sofort im Browser
- Der Status oben im Header zeigt „Gespeichert" / „Wird gespeichert..." / „Nicht gespeichert"

`localStorage` ist auf ca. 5-10 MB beschränkt. Bei sehr großen eingebetteten Medien (Videos > 10 MB) kann das Autosave fehlschlagen. Der SCORM-Export funktioniert trotzdem.

### JSON-Im/Export

- `Datei -> Als JSON exportieren` speichert das gesamte Paket als `.json`-Datei
- `Datei -> JSON laden …` lädt eine zuvor exportierte JSON-Datei
- `Datei -> SCORM-ZIP laden …` ermöglicht Re-Import eines früher generierten SCORM-Pakets
- Im **JSON-Editor**-Modus (Toggle in der Sidebar) kann der gesamte Kurs direkt als JSON editiert werden

### Ordner-Browser

- Header-Button `Ordner` öffnet beim ersten Klick einen Dateipicker für ein Verzeichnis mit SCORM-ZIPs
- Danach erscheint ein **Dropdown unterhalb der Schaltfläche** mit dem Ordnerbaum
- Themen sind als Accordion organisiert. Nur ein Theme ist gleichzeitig aufgeklappt, damit das Dropdown kompakt bleibt.
- Klick auf eine `.zip` lädt sie in den Builder; das Dropdown bleibt offen, damit man direkt die nächste Datei wählen kann
- Aktive Datei ist im Tree hervorgehoben, was den Wechsel zwischen mehreren Lerneinheiten beschleunigt
- Klick außerhalb des Dropdowns oder `ESC` schließt es; der Ordner bleibt im Hintergrund aktiv
- `×` im Dropdown vergisst den Ordner ganz (entfernt den persistierten Handle)
- **Persistierung über Reload:** der gewählte Ordner wird in IndexedDB gespeichert. Beim nächsten Builder-Start ist er noch verfügbar, solange der Browser die Berechtigung beibehält; kein erneutes Auswählen nötig
- Funktioniert mit File System Access API in Chromium-Browsern (Chrome, Edge, Brave), Fallback via `webkitdirectory` in anderen Browsern (read-only, keine Persistierung)

### SCORM-ZIP

- Erzeugt ein SCORM-1.2-konformes ZIP mit `imsmanifest.xml`, allen Blocks und Runtime-Files
- Hochgeladene Medien (Bilder, Audio, Video, Dateien) werden als eigene Dateien im Ordner `media/` des ZIPs abgelegt und beim Laden wieder eingebettet
- YouTube/Vimeo-Videos bleiben als Embed-Links erhalten

### Datei-Upload-Limits

| Typ | Hard-Cap | Warn-Schwelle |
|---|---|---|
| Bild | 50 MB | 2 MB |
| Audio | 200 MB | 5 MB |
| Video | 500 MB | 10 MB |
| Sonstige Dateien | 500 MB | 10 MB |

Bei großen Videos einen YouTube/Vimeo-Link einbetten (unbegrenzte Größe).

Große Fotos werden beim Hochladen automatisch auf höchstens 2000 px (längere Seite) verkleinert und als JPEG gespeichert; PNG bleibt verlustfrei. Abschaltbar in den Kopfdaten unter „Bilder“ oder pro Upload mit „Original behalten“. Die Warnschwelle für Bilder betrifft deshalb vor allem PNG-Screenshots und Originale.

---

## Tastaturkürzel

`?` öffnet jederzeit die vollständige Übersicht im Builder. Wichtigste:

| Shortcut | Aktion |
|---|---|
| `?` | Tastaturkürzel-Übersicht ein-/ausblenden |
| `Strg/Cmd + S` | Speichern (geöffnete ZIP-Datei überschreiben, sonst Sicherung im Browser) |
| `Strg/Cmd + Shift + S` | SCORM-ZIP exportieren |
| `Strg/Cmd + Z` / `Y` | Rückgängig / Wiederherstellen |
| `Strg/Cmd + A` | Alle Blöcke der Aufgabe markieren |
| `Strg/Cmd + C` / `V` / `D` | Blöcke kopieren / einfügen / duplizieren |
| `Entf` / `Backspace` | Markierte Blöcke löschen |
| `Pfeiltasten` | Markierte Blöcke 1 px verschieben (`Shift` = 10 px) |
| `Esc` | Auswahl aufheben / Modal schließen |

Innerhalb des Komposition-Editors gibt es zusätzliche Shortcuts (`V` = Verschieben, `S` = Auswahl, etc.).

---

## Cache-Buster bumpen

`builder/index.html` lädt CSS, Runtime-Skripte, Sprachdateien und alle Block-Dateien mit einem Query-Parameter (`?v=N`). Wird der Builder über einen Server ohne No-Cache-Header ausgeliefert, sorgt ein höheres `N` dafür, dass Browser nicht die alte Version aus dem Cache nehmen. Mit `serve.py` (also `start.sh`/`start.bat`) ist das weniger kritisch, weil jede Antwort `Cache-Control: no-cache` trägt.

### macOS / Linux

```bash
./bump-version.sh           # bumped um +1
./bump-version.sh 200       # setzt auf 200
```

### Windows

```cmd
bump-version.bat
bump-version.bat 200
```

Beide Scripts:
- suchen das aktuelle `?v=N` in `builder/index.html`
- ersetzen es durch `N+1` (oder den übergebenen Wert)
- bestätigen das Ergebnis (`Bumped cache-buster: v=110 -> v=111`)

Vor dem Weitergeben oder Veröffentlichen einer geänderten Version bumpen. Die ES-Module unter `builder/js/` haben keinen `?v=`; für sie verlässt sich der Builder auf die No-Cache-Header.

---

## Eigene Block-Typen entwickeln

Block-Typen sind selbst-registrierende Module unter `builder/template/blocks/`. Eine Datei pro Block.

### Skelett

Das Skelett zeigt feste deutsche Texte, damit es kurz bleibt. Die mitgelieferten Blöcke nutzen stattdessen Übersetzungsschlüssel (`labelKey`, `descKey`, `categoryKey`, in Feldern `labelKey`/`helpKey`/`placeholderKey`), deren Texte in `builder/template/i18n/de.js` und `en.js` stehen.

```javascript
(function(){
  'use strict';
  Blocks.register('my-block', {
    label: 'Mein Block',
    description: 'Was dieser Block tut.',
    category: 'Medien & Inhalt',   // 'Frage', 'MINT', 'Visualisierung'
    icon: '*',
    graded: false,                  // true -> Block wird bewertet

    defaultConfig(){
      return { title: '', body: '' };
    },

    // Optional: Beispiel-Config für die Welcome-Page-Vorschau
    previewConfig(){
      return { title: 'Beispiel', body: 'Inhalt...' };
    },

    // Optional: Ein-Zeilen-Zusammenfassung für die Task-Liste
    summary(cfg){ return cfg.title || '(leer)'; },

    // Optional: Validation für den Pre-Export-Check
    validate(cfg){
      const warnings = [];
      if(!cfg.title) warnings.push('Titel fehlt.');
      return warnings;
    },

    // Schema-getriebenes Konfig-Formular (rechte Pane)
    builderSchema(){
      return [
        { key: 'title', label: 'Titel', type: 'text' },
        { key: 'body',  label: 'Inhalt', type: 'textarea', rows: 4 }
      ];
    },

    // Render im echten Lerneinheit-Output (SCORM-Runtime)
    mount(host, config, api){
      const div = document.createElement('div');
      div.textContent = config.title + ': ' + config.body;
      host.appendChild(div);
    },

    // Render in der Welcome-Page-Live-Vorschau (Builder-Seite)
    preview(host, config){
      const div = document.createElement('div');
      div.textContent = config.title + ': ' + config.body;
      host.appendChild(div);
    }
  });
})();
```

### Block einbinden

Damit der neue Block sowohl im Builder als auch im exportierten SCORM-ZIP funktioniert, sind zwei Stellen zu aktualisieren:

1. **`builder/index.html`**: Script-Tag mit Cache-Buster ergänzen, damit der Builder die Datei lädt:

   ```html
   <script src="template/blocks/my-block.js?v=N" defer></script>
   ```

2. **`builder/js/canvas.js`**: Eintrag in `BLOCK_FILES` ergänzen, damit die Datei mit ins SCORM-ZIP kommt:

   ```javascript
   export const BLOCK_FILES = {
     // ...
     'my-block': 'my-block.js',
   };
   ```

   Wenn der Block einen Helfer-File benötigt (so wie `composition`), als Array angeben:

   ```javascript
   'my-block': ['my-block-helpers.js', 'my-block.js'],
   ```

   Das Array wird in der angegebenen Reihenfolge geladen.

3. **`builder/js/block-help.js`** sowie `blockHelp` in `builder/i18n/de.js`/`en.js`: Inhalt des „Was ist das?“-Kastens.
4. **Test:** mindestens ein Bewertungstest unter `test/blocks/` (der Smoke-Test `test/mount-audit.test.mjs` prüft neue Blöcke automatisch mit).

Anschließend `./bump-version.sh` ausführen.

### Verfügbare Schema-Field-Typen

| Type | Renderer |
|---|---|
| `text`, `textarea`, `number`, `select`, `boolean` | Standard-Inputs (`boolean` = Checkbox) |
| `color` | Farb-Picker |
| `image`, `audio`, `video`, `file` | Datei-Upload mit MIME-Validierung |
| `math-textarea` | Mathe-Toolbar (LaTeX-Eingabe mit Live-KaTeX-Preview) |
| `formula-text` | Einzeilige Lösungs-Formel mit Formel-Hilfen |
| `list` | Wiederholbare Sub-Schema-Liste mit add/remove (`itemSchema`) |
| `group` | Gruppiert Unterfelder in einem Rahmen |
| `zone-editor`, `unit-pair`, `unit-from-to`, `choice-matrix`, `grid-table` | Spezial-Editoren einzelner Blöcke |
| `section`, `action` | Layout-Helfer (Zwischenüberschrift, Button) |

Jedes Feld kann `showIf: cfg => …` haben (nur anzeigen, wenn die Bedingung gilt). Bewertete Blöcke bekommen die gemeinsamen Felder (Antwort sperren, Zeitlimit, Versuche/Hinweis/Lösungsweg) automatisch angehängt.

### Block-API-Lifecycle

| Methode | Pflicht | Aufruf |
|---|---|---|
| `defaultConfig()` | ja | beim Erstellen eines neuen Blocks |
| `previewConfig()` | optional | für Welcome-Modal-Vorschau (sonst `defaultConfig`) |
| `summary(cfg)` | optional | Task-Liste, Block-Karten-Header |
| `validate(cfg)` | optional | Pre-Export-Check (Warnungen) |
| `builderSchema()` | ja | rechte Konfig-Pane |
| `mount(host, cfg, api)` | ja | SCORM-Runtime und Builder-Canvas (dort in einem Shadow-DOM) |
| `preview(host, cfg)` | optional | Vorschau auf der Willkommen-Seite; auf der Canvas nur, falls `mount` scheitert |
| `maxPointsFor(cfg)` | optional | Maximalpunkte, wenn sie nicht einfach `cfg.maxPoints` sind |
| `acceptsGlobals(cfg, werte)` | optional | Prüft, ob globale Variablen-Werte die Bedingungen des Blocks erfüllen (z. B. „Nur ganzzahlige Lösungen“) |

`mount()` kann ein Objekt zurückgeben, das die Runtime nutzt: `getVars()` (aktuelle Variablenwerte für Hinweis/Lösungsweg), `showSolution()` (Lösung eintragen, beim Fortsetzen gelöster Blöcke) und `destroy()`. Details in [`ARCHITECTURE.md`](ARCHITECTURE.md#runtime-ablauf).

---

## Architektur und Entwickler-Dokumentation

Für tiefer gehende Informationen zum Code-Aufbau, den vier Ebenen (UI-Shell, State, Render-Dispatcher, Blocks), den Datenflüssen beim Speichern und Abspielen sowie häufigen Fallstricken siehe [`ARCHITECTURE.md`](ARCHITECTURE.md).

### Tests

Optional, nicht zwingend für Anwender (der Builder läuft weiter nur mit `start.bat` / `serve.py`). Voraussetzung: Node 18+, Python 3 und ein installiertes Edge oder Chrome. Es wird kein eigener Browser heruntergeladen.

```bash
npm install               # einmalig
npm test                  # gesamte Test-Suite (~50 Sekunden)
npm test -- blocks        # nur Tests, deren Pfad "blocks" enthält
npm run lint              # ESLint (Warnungen erlaubt, Fehler nicht)
```

Unter Windows startet ein Doppelklick auf `test.bat` dasselbe (inkl. `npm install` beim ersten Mal). Der Browser lässt sich mit `TEST_BROWSER=chrome` (bzw. `msedge`, `chromium`) wählen, der Port mit `TEST_PORT` (Standard 8766). Auf langsamen Rechnern verdoppelt `TEST_PERF_FACTOR=2` die Zeitgrenzen.

Abgedeckt sind die Bewertung der wichtigsten Blöcke, die Hilfsfunktionen (Formeln, LaTeX, Variablen), die Sprachdateien (doppelte bzw. fehlende Schlüssel), Zeitgrenzen für die langsamen Pfade (Start einer großen Lerneinheit mit globalen Variablen, globales Neu-Generieren, Builder mit vielen Blöcken, ZIP-Export), Builder-Abläufe (Vorlagen, Validierung, Textfeld-Editor, Bildverkleinerung, „Höhe für SCORM anpassen") und die exportierte Lerneinheit mit nachgebautem LMS (globale Variablen, Versuche/Hinweis/Lösungsweg, Fortsetzen, Pools, Sprachwechsel, Abschlussmeldung). Details in [`ARCHITECTURE.md`](ARCHITECTURE.md#tests).

---

## Branding / Theme

Unter **Allgemein -> Branding / Theme** anpassbar:

- Primärfarbe, Akzentfarbe (jeweils Standard + Hell-Variante)
- Schriftart (CSS `font-family`)
- Kicker-Text (Badge oben links)
- Footer-Text und -Link
- Logo (Upload als Data-URL oder Pfad zu einer Datei in `template/`)

Theme-Änderungen sind live im Builder sichtbar und werden ins SCORM-ZIP übernommen. Das Standard-Branding ist UCB / Hochschule Trier.

---

## Browser-Anforderungen

- Chromium-basierter Browser (Chrome, Edge, Brave, Arc, Opera) oder Firefox
- Aktuelle Version (ES-Modules, async/await, IntersectionObserver)
- JavaScript aktiviert
- `localStorage` aktiviert (für Autosave und Block-Usage-Tracking)
- Touch-Bedienung wird unterstützt, Desktop empfohlen

Das im SCORM-ZIP erzeugte Paket läuft in jedem SCORM-1.2-kompatiblen LMS. Getestet mit Open-OLAT.


