# Architektur

Dieses Dokument richtet sich an Entwickler, die den Code lesen oder erweitern wollen. Es erklärt, wie der Builder intern aufgebaut ist, wo welcher Code liegt und welche Datenflüsse beim Erstellen, Speichern und Abspielen einer Lerneinheit ablaufen.

Für den Anwender-Workflow und das Hinzufügen eigener Block-Typen siehe `README.md`.

---

## Inhalt

- [Überblick](#überblick)
- [Die vier Ebenen](#die-vier-ebenen)
- [Datenflüsse](#datenflüsse)
- [Modul-Karte](#modul-karte)
- [Fallstricke](#fallstricke)
- [Tests und Benchmark](#tests-und-benchmark)
- [Code-Stil](#code-stil)

---

## Überblick

Der Builder ist eine reine Browser-App, kein Backend, kein Build-Schritt. Zwei Welten leben im selben Repo:

- **Builder** (`builder/index.html` + `builder/js/`): Was der Autor sieht. ES-Module, lädt im Browser via `<script type="module">`.
- **Runtime** (`builder/template/`): Was der Lernende im SCORM-Player sieht. Klassische IIFE-Skripte, weil das Paket eigenständig laufen können muss (auch in alten LMS-Embeds).

Beide Welten teilen sich die **Block-Definitionen** unter `builder/template/blocks/`. Ein Block wird im Builder zum Konfigurieren und in der Runtime zum Anzeigen verwendet. Eine einzige Datei, zwei Lebenszyklen.

Der Export ist eine reine Verpackungsaktion: Builder serialisiert den State, kopiert die Template-Dateien aus `builder/template/` ins ZIP und schreibt das SCORM-Manifest.

---

## Die vier Ebenen

```
┌─────────────────────────────────────────────────────────────────┐
│  1. UI-Shell        index.html + builder.css                    │
│     (Layout, Sidebar, Header, Modals)                           │
├─────────────────────────────────────────────────────────────────┤
│  2. State           state.js                                    │
│     (course, theme, selection, history, autosave)               │
├─────────────────────────────────────────────────────────────────┤
│  3. Render-Dispatcher                                           │
│     panes.js, task-pane*.js, welcome-pane.js, form*.js, canvas.js│
│     (entscheidet welche Pane gezeichnet wird, baut Formulare)   │
├─────────────────────────────────────────────────────────────────┤
│  4. Blocks          template/blocks/*.js                        │
│     (jeder Block-Typ: defaultConfig, builderSchema, mount,      │
│      preview, validate, summary)                                │
└─────────────────────────────────────────────────────────────────┘
```

**Regel:** Daten fließen abwärts (State → Render → Blocks), Events fließen aufwärts (Block mutiert `state.course.tasks[i].blocks[j].config`, ruft `render()`). Es gibt keinen Reactive-Layer. Jede Änderung am State erfordert einen expliziten `render()`-Aufruf.

`state.js` exportiert ein leeres `setRenderer()`-Hook. `main.js` reicht beim Boot die echte `render`-Funktion herein, damit `state.js` keine zyklische Abhängigkeit auf `panes.js` braucht.

---

## Datenflüsse

### Block hinzufügen

```
User klickt "Block hinzufügen"
       │
       ▼
modals.js öffnet Auswahl-Dialog
       │
       ▼
Auswahl bestätigt
       │
       ▼
tasks.js erzeugt block-objekt mit defaultConfig()
       │ pushHistory()
       ▼
state.course.tasks[i].blocks.push(block)
       │
       ▼
render()
   ├── renderTaskList()        (Sidebar)
   └── renderActivePaneImpl()  (Mittel- und rechte Pane)
       │
       ▼
task-pane.js zeichnet Canvas
       │
       ▼
canvas.js positioniert jeden Block, ruft block.preview() bzw. block.summary()
       │
       ▼
scheduleAutosave()             (debounced, schreibt nach localStorage)
```

### SCORM-ZIP exportieren

```
btnDownload click
       │
       ▼
io.downloadZip()
       │
       ├── validateCourse()         (warnings only, nicht blockierend)
       ├── usedBlockTypes()         (welche template/blocks/*.js brauchen wir)
       ├── fetchTextRel('index.html'), fetchTextRel('runtime.js'), ...
       ├── BLOCK_FILES[type] für jeden verwendeten Typ laden
       ├── addKatexToZip()          (parallel-fetch, fonts mit STORE)
       │
       ▼
JSZip baut Blob (STORE für Binaries, DEFLATE für Text)
       │
       ▼
showSaveFilePicker() oder Fallback <a download>
       │
       ▼
Blob wird geschrieben, setLoadedHandle() merkt sich den Handle
```

Wichtig: KaTeX-Fonts (woff2, schon komprimiert) werden mit `compression: 'STORE'` ins ZIP gelegt. Eine zweite DEFLATE-Runde würde nichts bringen und nur Zeit kosten.

### Lernender öffnet SCORM-Paket

```
LMS lädt template/index.html
       │
       ▼
template/index.html lädt:
   utils.js  →  scorm12.js  →  block-icons.js  →
   _registry.js  →  blocks/*.js  →  runtime.js
       │
       ▼
runtime.js liest tasks.json + theme.json
       │
       ▼
für jede Aufgabe: container erzeugen, Blocks.get(type).mount(host, config, api)
       │
       ▼
Lernender beantwortet, klickt "Korrektur"
       │
       ▼
Block ruft api.reportScore(points) auf
       │
       ▼
runtime.js akkumuliert pro Task, schreibt cmi.core.score.raw via SCORM-API
```

Die Load-Reihenfolge in `template/index.html` muss zur Reihenfolge in `BLOCK_FILES` passen. Wer einen Block mit Helper-Dateien einfügt, muss beide Stellen synchron halten (siehe `composition` als Beispiel).

---

## Modul-Karte

### Builder-Seite (`builder/js/`)

| Datei | Zuständigkeit |
|---|---|
| `main.js` | Entry-Point. Verkabelt Event-Listener, reicht `render` an `state.js`. |
| `state.js` | Globaler State (`state.course`, `state.theme`, Selection, History, Autosave, Clipboard). |
| `panes.js` | Wählt anhand `state.selected.kind`, welche Pane gerendert wird. |
| `welcome-pane.js` | Startseite mit Block-Vorschauen und Kopfdaten-Editor. |
| `task-pane.js` | Aufgaben-Pane inkl. Tab-Header. Delegiert an die folgenden Untermodule: |
| `task-pane-canvas.js` | Canvas mit den Block-Karten, Drag-und-Resize-Handles. |
| `task-pane-config.js` | Rechte Konfig-Pane für den ausgewählten Block. |
| `task-pane-bulk.js` | Mehrfach-Auswahl-Aktionen (löschen, verschieben). |
| `canvas.js` | Canvas-Konstanten, `BLOCK_FILES`, Snap, Default-Größen. |
| `tasks.js` | Task-Operationen (anlegen, löschen, klonen, migrieren, validieren). |
| `form.js` | Schema-Dispatcher. Liest `builderSchema()` und rendert Inputs. |
| `form-media.js`, `form-math.js`, `form-specialized.js` | Renderer für Spezial-Felder. |
| `io.js` | JSON-Export, SCORM-ZIP-Build, Preview-Iframe, Loader. |
| `modals.js` | Block-Auswahl, Bestätigungs-Dialoge. |
| `folder-browser.js` | Optionaler Ordner-Browser im Header (File System Access API). |
| `preview.js` | Live-Vorschau einer einzelnen Aufgabe in einem Iframe. |
| `util.js` | Generika: escape, dom-helpers, debounce, toast. |

### Runtime-Seite (`builder/template/`)

| Datei | Zuständigkeit |
|---|---|
| `index.html` | SCORM-Einstiegsseite. Lädt alle Block-Skripte als klassische `<script>`. |
| `runtime.js` | Lädt `tasks.json` + `theme.json`, baut Navigation, ruft `block.mount()`. |
| `scorm12.js` | LMS-Bridge. Findet `API` im Eltern-Frame, normalisiert SCORM-1.2-Calls. |
| `utils.js` | `window.BlockUtils`: shuffle, escapeHtml, renderMath (KaTeX), Punktelogik. |
| `_registry.js` | Lädt zuerst, stellt `window.Blocks.register/get/all/ids` bereit. |
| `block-icons.js` | SVG-Icon-Map für die Builder-Sidebar (im Runtime ungenutzt, aber im ZIP enthalten). |
| `styles.css` | Geteilter Stil für Builder-Preview und Runtime. |
| `blocks/*.js` | Eine Datei pro Block-Typ. Selbst-registrierend via `Blocks.register`. |

### Gemeinsam genutzt

| Pfad | Zweck |
|---|---|
| `builder/template/blocks/composition-*.js` | Composition besteht aus fünf Dateien (`helpers`, `runtime`, `toolbar`, `canvas`, dann `composition.js`). Lade-Reihenfolge ist Pflicht. |
| `builder/lib/katex/` | KaTeX-Bundle. Wird vom Builder direkt geladen und beim Export ins ZIP kopiert. |
| `builder/lib/jszip.min.js` | JSZip-Bundle für den Export. |

### Tests

| Datei | Zweck |
|---|---|
| `test/run-all.mjs` | Discovery + Runner für alle `*.test.mjs`. |
| `test/lib/setup.mjs` | `startServer`, `openBuilder`, `close`, `assert*`. |
| `test/blocks/*.test.mjs` | Pro Block ein eigener Korrektur-Test. |
| `test/workflows/*.test.mjs` | Builder-End-to-End-Flows (Save, ZIP-Roundtrip, Right-Pane-Stabilität). |
| `test/quality/*.test.mjs` | a11y (axe-core), Performance-Regression, HTML-Escaping, Konsistenz-Checks. |
| `test/mount-audit.test.mjs` | Smoke-Test: jeder registrierte Block-Typ rendert ohne Fehler. |
| `test/bench.mjs` | Performance-Benchmark (nicht Teil von `npm test`, läuft via `npm run bench`). |

---

## Fallstricke

Die folgenden Punkte haben in der Vergangenheit mindestens einmal Zeit gekostet. Wer hier vorbeischaut, spart sich die Erfahrung.

**1. State-Mutation ohne `render()`.** Es gibt keinen Watcher. Wer `state.course.tasks[i] = ...` schreibt und vergisst, danach `render()` aufzurufen, sieht alte Pixel.

**2. Verlust der User-Activation bei Save.** `showSaveFilePicker` braucht eine direkte User-Geste. Wenn `downloadZip()` zu lang braucht oder ein `await`-Hop dazwischenliegt, schlägt der Picker fehl. Deshalb wird der Handle vor dem Build geöffnet, nicht danach.

**3. KaTeX-Render-Timing.** `renderMath()` läuft asynchron. Wer einen Block neu rendert und sofort die Höhe misst, sieht den Wert vor der KaTeX-Substitution. Lösung: per `MutationObserver` oder kurzem `requestAnimationFrame`-Delay nachmessen.

**4. Cache-Buster vergessen.** Browser cachen ES-Module aggressiv. Jede Änderung an einem Script muss in `index.html` ein höheres `?v=N` bekommen. `bump-version.sh` macht das automatisch.

**5. Block-Datei nicht in `BLOCK_FILES`.** Ein Block kann im Builder funktionieren (weil `index.html` ihn lädt) und beim SCORM-Export fehlen (weil das ZIP-Packing nur die Dateien aus `BLOCK_FILES` kopiert). Beide Stellen müssen synchron sein.

**6. IIFE-Closure-State zwischen Blöcken.** Block-Dateien sind IIFEs. Variablen innerhalb der IIFE sind privat. Wer zwei Composition-Blöcke auf einer Seite hat und Ctrl+C in einem will und Ctrl+V im anderen, muss den Clipboard-State auf `window` legen (siehe `window.__compClipboard` in `composition.js`).

**7. `getBoundingClientRect` in Tests.** Headless-Chromium liefert oft 0 für nicht-eingehängte Elemente. Wer Click-Koordinaten testet, muss `getBoundingClientRect` für das Test-Setup mocken (siehe `test/blocks/hotzone.test.mjs`).

**8. `state.course.tasks[i].blocks` vs. `tabs[].blocks`.** Aufgaben haben optionale Tabs. Wer alle Blöcke einer Aufgabe iterieren will, muss beide Pfade abdecken (`usedBlockTypes` in `canvas.js` zeigt das Muster).

**9. KaTeX-Re-Render nach State-Update.** Wer eine Frage neu generiert (z. B. Numeric-Input mit Variablen), muss `renderMath()` erneut auf dem neuen DOM aufrufen. Die ursprüngliche Substitution greift nicht für nachträglich eingefügte LaTeX-Strings.

**10. Schema-`showIf`.** Felder mit `showIf: cfg => cfg.mode === 'x'` werden bei jedem Re-Render evaluiert. Wer im Callback eine teure Berechnung macht, blockiert die Pane.

---

## Tests und Benchmark

```bash
npm test        # alle Suites, ca. 1 Minute
npm run bench   # SCORM-ZIP-Build + Block-Mount-Performance
npm run lint    # ESLint
```

Der Test-Runner startet einen Python-HTTP-Server auf Port 8766, öffnet ein headless-Chromium, navigiert zum Builder, lädt jeden Block in einem isolierten Container und prüft die Korrektur-Logik. Jede `*.test.mjs`-Datei läuft standalone, also reicht `node test/blocks/cloze.test.mjs` zum Debuggen einer einzelnen Suite.

`npm run bench` ist kein Test, sondern ein Mess-Tool. Es druckt min/median/p95 für realistische Kurs-Größen aus. Vor und nach einer Performance-relevanten Änderung laufen lassen und die Tabellen vergleichen.

---

## Code-Stil

- Vanilla ES2020+, keine Frameworks, kein TypeScript, kein Build.
- Kommentare auf Englisch, im Code keine Umlaute. UI-Strings auf Deutsch mit Umlauten.
- Funktionen klein halten, lieber drei einzeilige Helfer als eine 200-Zeilen-Funktion.
- Keine `console.log` in committedem Code. Stattdessen `toast()` für sichtbare Meldungen oder Devtools-`debugger` für Einzelfall-Debugging.
- Vor jedem Commit: `npm test && npm run lint` muss grün sein.
