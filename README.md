# SCORM Builder für OLAT

Browser-basiertes Werkzeug zum Erstellen von SCORM-1.2-Lerneinheiten für die OLAT-Lernplattform. Komplett ohne Installation, ohne Backend, ohne Konto. Der Builder läuft als statische HTML/JS-App lokal im Browser. Das fertige SCORM-ZIP wird im Builder erzeugt und heruntergeladen.

Entwickelt am Umwelt-Campus Birkenfeld, Hochschule Trier.

---

## Inhalt

- [Schnellstart](#schnellstart)
- [Projektstruktur](#projektstruktur)
- [Builder-Workflow](#builder-workflow)
- [Block-Kategorien](#block-kategorien)
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
python3 -m http.server 8765 --bind 127.0.0.1
# danach im Browser: http://localhost:8765/builder/
```

---

## Projektstruktur

```
olat_scorm_2026/
├── README.md                 Dieses Dokument
├── start.sh / start.bat      Lokalen Server starten
├── bump-version.sh / .bat    Cache-Buster in builder/index.html erhöhen
└── builder/                  Builder-Applikation
    ├── index.html
    ├── builder.css
    ├── js/                   Builder-Logik (ES-Module)
    ├── template/             Block-Definitionen + SCORM-Runtime
    │   ├── blocks/           Eine Datei pro Block-Typ
    │   ├── block-icons.js    SVG-Icons aller Blöcke
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
| `form-specialized.js` | Block-spezifische Felder (zone-editor, unit-pair, unit-from-to) |
| `math-toolbar-data.js` | Symboltabelle der Mathe-Toolbar (Pi, Wurzel, etc.) |
| `preview.js` | Block-Vorschau im Canvas + Welcome-Detail |
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

## Persistenz: Autosave, JSON, SCORM-ZIP

### Autosave (lokal)

- Jede Änderung am Kurs wird mit 800 ms Debounce in `localStorage` gespeichert
- Bei Reload bietet der Builder an, den letzten Stand wiederherzustellen
- `Strg + S` löst ein sofortiges Speichern aus
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
- Eingebettete Medien (Bilder, Audio) werden als Data-URLs im ZIP transportiert
- YouTube/Vimeo-Videos bleiben als Embed-Links erhalten

### Datei-Upload-Limits

| Typ | Hard-Cap | Warn-Schwelle |
|---|---|---|
| Bild | 50 MB | 2 MB |
| Audio | 200 MB | 5 MB |
| Video | 500 MB | 10 MB |
| Sonstige Dateien | 500 MB | 10 MB |

Bei großen Videos einen YouTube/Vimeo-Link einbetten (unbegrenzte Größe).

---

## Tastaturkürzel

`?` öffnet jederzeit die vollständige Übersicht im Builder. Wichtigste:

| Shortcut | Aktion |
|---|---|
| `?` | Tastaturkürzel-Übersicht ein-/ausblenden |
| `Strg/Cmd + S` | Sofort speichern |
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

`builder/index.html` lädt das CSS mit einem Query-Parameter (`?v=N`). Nach Änderungen an `builder.css` muss `N` erhöht werden, damit Nutzer-Browser nicht die alte Version cachen.

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

Nach jeder produktiven Änderung an `builder.css` bumpen. Bei reinen JS-Änderungen weniger kritisch.

---

## Eigene Block-Typen entwickeln

Block-Typen sind selbst-registrierende Module unter `builder/template/blocks/`. Eine Datei pro Block.

### Skelett

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

Anschließend `./bump-version.sh` ausführen.

### Verfügbare Schema-Field-Typen

| Type | Renderer |
|---|---|
| `text`, `textarea`, `number`, `select`, `checkbox` | Standard-Inputs |
| `color` | Farb-Picker |
| `image`, `audio`, `video`, `file` | Datei-Upload mit MIME-Validierung |
| `math-textarea` | Mathe-Toolbar (LaTeX-Eingabe mit Live-KaTeX-Preview) |
| `list` | Wiederholbare Sub-Schema-Liste mit add/remove |
| `section`, `action` | Layout-Helfer |

### Block-API-Lifecycle

| Methode | Pflicht | Aufruf |
|---|---|---|
| `defaultConfig()` | ja | beim Erstellen eines neuen Blocks |
| `previewConfig()` | optional | für Welcome-Modal-Vorschau (sonst `defaultConfig`) |
| `summary(cfg)` | optional | Task-Liste, Block-Karten-Header |
| `validate(cfg)` | optional | Pre-Export-Check (Warnungen) |
| `builderSchema()` | ja | rechte Konfig-Pane |
| `mount(host, cfg, api)` | ja | SCORM-Runtime und Vorschau-Modal |
| `preview(host, cfg)` | optional | Builder-Canvas-Vorschau (sonst `mount`) |

---

## Architektur und Entwickler-Dokumentation

Für tiefer gehende Informationen zum Code-Aufbau, den vier Ebenen (UI-Shell, State, Render-Dispatcher, Blocks), den Datenflüssen beim Speichern und Abspielen sowie häufigen Fallstricken siehe [`ARCHITECTURE.md`](ARCHITECTURE.md).

### Tests und Benchmark

Optional, nicht zwingend für Anwender. Voraussetzung: Node 18+.

```bash
npm install               # einmalig
npm test                  # gesamte Test-Suite (~1 Minute)
npm run lint              # ESLint
npm run bench             # SCORM-ZIP-Build- und Block-Mount-Performance
npm run test:visual       # visuelle Regression aller Blöcke (Pixel-Diff)
npm run test:visual:update  # Baselines nach gewollter visueller Änderung neu erzeugen
```

Der Benchmark druckt min/median/p95 für realistische Kurs-Größen aus. Vor und nach einer Performance-Änderung laufen lassen und die Tabellen vergleichen.

Die visuelle Regression rendert jeden Block im Runtime-Stil und vergleicht ihn pixelgenau mit einer Baseline in `test/visual/baselines/`. Bei einer Abweichung landet ein Diff-Bild in `test/visual/diffs/`. Nach einer beabsichtigten optischen Änderung die Baselines mit `npm run test:visual:update` neu erzeugen. Baselines sind maschinenspezifisch (Antialiasing) und werden lokal gehalten.

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


