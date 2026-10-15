# Architektur

Dieses Dokument richtet sich an Entwickler, die den Code lesen oder erweitern wollen. Es erklärt, wie der Builder intern aufgebaut ist, wo welcher Code liegt und welche Datenflüsse beim Erstellen, Speichern und Abspielen einer Lerneinheit ablaufen.

Für den Anwender-Workflow und das Hinzufügen eigener Block-Typen siehe `README.md`.

---

## Inhalt

- [Überblick](#überblick)
- [Die vier Ebenen](#die-vier-ebenen)
- [Datenflüsse](#datenflüsse)
- [Runtime-Ablauf](#runtime-ablauf)
- [Modul-Karte](#modul-karte)
- [Fallstricke](#fallstricke)
- [Tests](#tests-1)
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
modals.js öffnet den Block-Dialog (Typen, Block- und Aufgaben-Vorlagen)
       │
       ▼
Auswahl bestätigt
       │
       ▼
task-pane.js addBlockOfType(): Block mit defaultConfig() bzw. aus der Vorlage
       │ pushHistory(), ensurePos() (canvas.js) setzt die Position
       ▼
task.blocks.push(block)        (bei Tabs: Alias auf tabs[aktiv].blocks)
       │
       ▼
renderCanvas() (task-pane-canvas.js) zeichnet die Block-Karten
       │
       ▼
preview.js renderBlockPreview(): builderMount() (Komposition) oder
mount() in einem Shadow-DOM mit den Runtime-Styles, sonst preview()
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
       ├── validateCourse()         (Warnungen; Dialog „trotzdem exportieren?“)
       ├── usedBlockTypes()         (welche template/blocks/*.js brauchen wir)
       ├── extractMediaFromTasks()  (Data-URLs → Dateien unter media/)
       ├── fetchTextRel('index.html'), fetchTextRel('runtime.js'), ...
       ├── BLOCK_FILES[type] für jeden verwendeten Typ laden
       ├── buildIndexHtml()         (Block-Skripte, Sprachdateien und die
       │                             Kursdaten als window.__SCORM_TASKS__
       │                             in template/index.html einsetzen)
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
LMS lädt index.html (aus template/index.html erzeugt)
       │
       ▼
index.html lädt:
   KaTeX  →  Kursdaten (window.__SCORM_TASKS__/__SCORM_THEME__)  →
   scorm12.js  →  utils.js  →  i18n/*.js  →  _registry.js  →
   blocks/*.js  →  runtime.js
       │
       ▼
runtime.js nimmt die eingebetteten Kursdaten (tasks.json/theme.json
nur als Fallback), verbindet das LMS, setzt einen gespeicherten Stand fort
       │
       ▼
pro angezeigter Seite: Blocks.get(type).mount(cell, config, api)
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

Die Block-Skripte der exportierten `index.html` werden automatisch aus `BLOCK_FILES` (in dieser Reihenfolge) eingesetzt. Synchron halten muss man dagegen die **Builder**-`index.html`: Sie lädt dieselben Dateien als eigene `<script>`-Tags. Wer einen Block mit Helper-Dateien einfügt, muss beide Stellen pflegen (siehe `composition` als Beispiel). Was die Runtime danach im Detail tut, steht unter [Runtime-Ablauf](#runtime-ablauf).

---

## Runtime-Ablauf

Alles in `builder/template/runtime.js`, Hilfsfunktionen in `utils.js`.

**Start** (`bootstrap`), in dieser Reihenfolge, weil spätere Schritte von früheren abhängen:

1. LMS verbinden (`Scorm12.init`).
2. Aufgabenpools ziehen (`applyPools`). Der Pool-Seed kommt aus dem gespeicherten Stand (`peekSuspendData`), damit die Auswahl beim Fortsetzen gleich bleibt. Erst danach sind die Aufgaben-Positionen fest, an denen alles Weitere hängt.
3. Globale Variablen einrichten (`setupGlobalVars`): Definitionen an `BlockUtils` geben, Blöcke merken, die sie benutzen (`globalVarsUsedBy`).
4. Gespeicherten Stand anwenden (`restoreProgress`): Sprache, Tabs, Punkte, Zufallszustand, Eingaben, Kurs-Timer.
5. Globale Werte ziehen (`applyGlobalSeed`): Aus dem Seed werden bis zu 40 Wertesätze gezogen, bis alle betroffenen Blöcke über `def.acceptsGlobals(cfg, werte)` zustimmen (z. B. „Nur ganzzahlige Lösungen“); sonst gilt der erste.
6. Navigation, Header-Button für globales Neu-Generieren, erste Seite.

**Seiten** (`showPage`): Jede Seite (Aufgabe + Tab) wird einmal aufgebaut und dann im `pageCache` gehalten, nicht zerstört. Darum bleiben Werte und Eingaben beim Aufgabenwechsel erhalten. Nur ein Sprachwechsel baut alle Seiten neu (`clearPageCache`, vorher werden Sperren und Eingaben gesichert).

**Zufall pro Block** (`blockRng`): Jeder Block hat einen eigenen Seed unter dem Schlüssel `bl_<Aufgabe>_<Blockindex>_<Block-ID>`. Während `mount()` und während jedes „Neu generieren“-Klicks wird `Math.random` gegen diesen Zufallsstrom getauscht; die Klicks werden protokolliert und beim Neuaufbau nachgespielt. So entstehen nach Sprachwechsel oder Fortsetzen exakt dieselben Werte.

**Bewertung:** Blöcke melden `api.reportScore(punkte, max)`. Die Runtime zählt einen Klick auf einen Button im Block bzw. Enter als einen Versuch (`attachCheckDetector`, `_checkId`), auch wenn der Block mehrfach meldet. `helpConfig`/`scoreWithHelp` verrechnen Versuchsabzug und Hinweis-Abzug; gespeichert wird zusätzlich `solved` (Rohpunkte voll). Sperren laufen über `lockAnswers(cell, st, inklusiveNeuGenerieren)`, markiert mit `data-answer-lock`; die Antwortbegrenzung im Multiple Choice nutzt getrennt `data-limit-lock`. Hinweis-/Lösungs-Buttons und Timer-Abzeichen liegen auf der Zeichenfläche, nicht im Block, weil manche Blöcke beim Neu-Generieren ihren Inhalt ersetzen.

**Gespeicherter Stand** (`buildSuspendData` → `cmi.suspend_data`, JSON `v: 1`):

| Schlüssel | Inhalt |
|---|---|
| `p`, `l`, `t`, `c` | Seite, Sprache, aktive Tabs, Restzeit des Kurs-Timers |
| `s` | Punkte je Block `[Punkte, Max, abgeschlossen, gelöst]` |
| `r` | Zufall je Block `[Seed, Neu-generieren-Klicks, gesperrte Buttons, Flags, Restzeit, Versuche, Fehlversuche]`; Flags: 1 Antworten gesperrt, 2 Timer abgelaufen, 4 Hinweis geöffnet, 8 Lösungsweg geöffnet |
| `i` | Eingaben je Block: `1` = gelöst (der Block trägt die Lösung selbst ein, `showSolution()`), sonst die Werte seiner Formularfelder |
| `g`, `pl` | Seed der globalen Variablen, Seed der Aufgabenpools |

SCORM 1.2 erlaubt nur 4096 Zeichen. Wird es zu lang, fallen in dieser Reihenfolge weg: Eingaben ungelöster Blöcke, Neu-generieren-Protokoll, Zufallszustand und Eingaben ganz. Gespeichert wird verzögert (`scheduleSave`, 1,5 s) und beim Verlassen der Seite; `session_time` geht beim Verlassen oder Beenden ans LMS, beim Beenden außerdem `lesson_status` (passed/failed) und ein leerer `suspend_data`.

**Zeichenfläche:** Blöcke sind in einem 1100 px breiten Koordinatensystem positioniert. `fitCanvas` skaliert die ganze Fläche per CSS-Transform auf die verfügbare Breite (0,6- bis 2-fach, ganze Pixel, Schutz gegen das Hin- und Herspringen an der Scrollleisten-Grenze; dazu `scrollbar-gutter: stable` in `styles.css`).

### Block-API für Runtime-Funktionen

Neben `mount()` & Co. (siehe README) nutzt die Runtime diese optionalen Teile:

| Wo | Name | Zweck |
|---|---|---|
| Definition | `graded` | Block wird bewertet; bekommt Sperren, Timer, Versuche/Hinweis/Lösungsweg |
| Definition | `maxPointsFor(cfg)` | Maximalpunkte vor dem ersten Einbinden (z. B. Komposition mit Ja/Nein-Feldern) |
| Definition | `acceptsGlobals(cfg, werte)` | `false`, wenn die Bedingungen des Blocks mit diesen globalen Werten nicht erfüllbar sind |
| Rückgabe von `mount()` | `getVars()` | aktuelle Variablenwerte (Hinweis/Lösungsweg setzen sie ein) |
| Rückgabe von `mount()` | `showSolution()` | richtige Antworten eintragen (Fortsetzen eines gelösten Blocks) |
| Rückgabe von `mount()` | `destroy()` | Aufräumen beim Neuaufbau |

Blöcke mit Zufallsvariablen holen globale Werte über `BlockUtils.withGlobalVars(eigeneWerte, eigeneDefinitionen)`; `varFormats()` liefert die Anzeigeformate inklusive der globalen Variablen.

---

## Modul-Karte

### Builder-Seite (`builder/js/`)

| Datei | Zuständigkeit |
|---|---|
| `main.js` | Entry-Point. Verkabelt Event-Listener, reicht `render` an `state.js`. |
| `state.js` | Globaler State (`state.course`, `state.theme`, Selection, History, Autosave, Clipboard). |
| `panes.js` | Wählt anhand `state.selected.kind`, welche Pane gerendert wird; Sidebar, Kopfdaten-Pane (inkl. globale Variablen, Pools), Theme-Pane. |
| `welcome-pane.js` | Startseite: Kapitel mit Kapitelleiste, Block-Typen mit Live-Vorschau, KaTeX-Beispiele. |
| `task-pane.js` | Aufgaben-Pane inkl. Tab-Header. Delegiert an die folgenden Untermodule: |
| `task-pane-canvas.js` | Canvas mit den Block-Karten, Drag-und-Resize-Handles. |
| `task-pane-config.js` | Rechte Konfig-Pane für den ausgewählten Block; hängt bei bewerteten Blöcken die gemeinsamen Felder an (Sperren, Timer, Versuche/Hinweis/Lösungsweg). |
| `block-help.js` | Inhalte der „Was ist das?“-Kästen (Texte in `i18n/*.js` unter `blockHelp`). |
| `task-pane-bulk.js` | Mehrfach-Auswahl-Aktionen (löschen, verschieben). |
| `canvas.js` | Canvas-Konstanten, `BLOCK_FILES`, Snap, Default-Größen. |
| `tasks.js` | Task-Operationen (anlegen, löschen, klonen, migrieren, validieren). |
| `form.js` | Schema-Dispatcher. Liest `builderSchema()` und rendert Inputs. |
| `form-media.js`, `form-math.js`, `form-specialized.js` | Renderer für Spezial-Felder. |
| `image-shrink.js` | Verkleinert hochgeladene Bilder (max. 2000 px, Fotos als JPEG). Auch für die Komposition als `window.ScormBuilderShrinkImage`. |
| `io.js` | JSON-Export, SCORM-ZIP-Build, Preview-Iframe, Loader. |
| `modals.js` | Block-Auswahl, Bestätigungs-Dialoge. |
| `folder-browser.js` | Optionaler Ordner-Browser im Header (File System Access API). |
| `preview.js` | Block-Vorschau auf der Canvas (Shadow-DOM mit Runtime-Styles) und `measureRuntimeHeight()` für „Höhe für SCORM anpassen“. Die Vorschau der ganzen Lerneinheit macht `io.js` (`showPreview`). |
| `i18n.js`, `lang-menu.js` | Übersetzungen der Builder-Oberfläche (`t()`, `l()` für mehrsprachige Inhalte), Sprachumschalter im Header. |
| `math-toolbar-data.js` | Symbole und Funktionen der Mathe-Toolbar. |
| `util.js` | Generika: escape, dom-helpers, debounce, toast. |

### Runtime-Seite (`builder/template/`)

| Datei | Zuständigkeit |
|---|---|
| `index.html` | SCORM-Einstiegsseite. Platzhalter für Kursdaten, Sprachdateien und Block-Skripte werden beim Export ersetzt. |
| `i18n/*.js` | Texte des SCORM-Players und aller Blöcke; registrieren sich bei `BlockUtils`. |
| `runtime.js` | Kursdaten, Navigation, `block.mount()`, Punkte und LMS, Fortsetzen, globale Variablen, Pools, Versuche/Hinweis/Lösungsweg, Timer, Skalierung (siehe [Runtime-Ablauf](#runtime-ablauf)). |
| `scorm12.js` | LMS-Bridge. Findet `API` im Eltern-Frame, normalisiert SCORM-1.2-Calls. |
| `utils.js` | `window.BlockUtils`: Formelrechner (`safeMathExpr`, `latexToAscii`, Winkel), Variablen-Darstellung (`fillMathTemplate`, `varFormats`), globale Variablen, Abzugslogik, renderMath (KaTeX), Frage-Karten, Übersetzung. |
| `_registry.js` | Lädt zuerst, stellt `window.Blocks.register/get/all/ids` bereit. |
| `block-icons.js` | SVG-Icon-Map für den Builder (Block-Dialog, Startseite). Wird nicht ins ZIP gepackt. |
| `styles.css` | Geteilter Stil für Builder-Preview und Runtime. |
| `blocks/*.js` | Eine Datei pro Block-Typ. Selbst-registrierend via `Blocks.register`. |

### Gemeinsam genutzt

| Pfad | Zweck |
|---|---|
| `builder/template/blocks/composition-*.js` | Composition besteht aus sechs Dateien (`helpers`, `runtime`, `toolbar-popovers`, `toolbar`, `canvas`, dann `composition.js`). Lade-Reihenfolge ist Pflicht. |
| `builder/lib/katex/` | KaTeX-Bundle. Wird vom Builder direkt geladen und beim Export ins ZIP kopiert. |
| `builder/lib/jszip.min.js` | JSZip-Bundle für den Export. |

### Tests

| Datei | Zweck |
|---|---|
| `test/run-all.mjs` | Findet alle `*.test.mjs` und startet sie nacheinander mit dem Node-Testrunner (`node --test`). Argumente filtern nach Pfad. |
| `test/lib/setup.mjs` | `startServer`, `openBuilder`, `openRuntime(course)`, `reloadRuntime`, `assertNoErrors`, `closeAll`; Kurs-Bausteine `task`, `block`, `numeric`. |
| `test/mount-audit.test.mjs` | Smoke-Test: jeder registrierte Block-Typ rendert (mount, preview, validate) ohne Fehler. |
| `test/blocks/*.test.mjs` | Bewertung je Block (Numerische Eingabe, Multiple Choice, Tabelle, Komposition). |
| `test/quality/*.test.mjs` | Hilfsfunktionen in `utils.js`; Sprachdateien (doppelte Schlüssel, de/en gleich); `performance.test.mjs`: Zeitgrenzen (siehe unten). |
| `test/workflows/builder.test.mjs` | Builder-Abläufe: Block-Dialog/Vorlagen, Validierung, Textfeld-Editor, Bildverkleinerung, „Höhe für SCORM anpassen". |
| `test/workflows/runtime.test.mjs` | Exportierte Lerneinheit mit Fake-LMS: globale Variablen, Versuche/Hinweis/Lösungsweg, Fortsetzen, Pools, Sprachwechsel, Abschluss. |

---

## Fallstricke

Die folgenden Punkte haben in der Vergangenheit mindestens einmal Zeit gekostet. Wer hier vorbeischaut, spart sich die Erfahrung.

**1. State-Mutation ohne `render()`.** Es gibt keinen Watcher. Wer `state.course.tasks[i] = ...` schreibt und vergisst, danach `render()` aufzurufen, sieht alte Pixel.

**2. Verlust der User-Activation bei Save.** `showSaveFilePicker` braucht eine direkte User-Geste. Wenn `downloadZip()` zu lang braucht oder ein `await`-Hop dazwischenliegt, schlägt der Picker fehl. Deshalb wird der Handle vor dem Build geöffnet, nicht danach.

**3. KaTeX-Render-Timing.** `renderMath()` läuft asynchron. Wer einen Block neu rendert und sofort die Höhe misst, sieht den Wert vor der KaTeX-Substitution. Lösung: per `MutationObserver` oder kurzem `requestAnimationFrame`-Delay nachmessen.

**4. Cache-Buster vergessen.** Ohne No-Cache-Header cachen Browser Skripte hartnäckig. `serve.py` schickt diese Header, im lokalen Betrieb ist das also abgedeckt. Läuft der Builder über einen anderen Server, braucht jede Änderung ein höheres `?v=N` in `index.html` (`bump-version.sh`); die ES-Module unter `builder/js/` haben gar keinen `?v=` und hängen dann ganz an den Server-Headern.

**5. Block-Datei nicht in `BLOCK_FILES`.** Ein Block kann im Builder funktionieren (weil `index.html` ihn lädt) und beim SCORM-Export fehlen (weil das ZIP-Packing nur die Dateien aus `BLOCK_FILES` kopiert). Beide Stellen müssen synchron sein.

**6. IIFE-Closure-State zwischen Blöcken.** Block-Dateien sind IIFEs. Variablen innerhalb der IIFE sind privat. Wer zwei Composition-Blöcke auf einer Seite hat und Ctrl+C in einem will und Ctrl+V im anderen, muss den Clipboard-State auf `window` legen (siehe `window.__compClipboard` in `composition.js`).

**7. `getBoundingClientRect` in Tests.** Headless-Chromium liefert oft 0 für nicht-eingehängte Elemente. Wer Click-Koordinaten testet, hängt den Block per `__mount()` (siehe `test/lib/setup.mjs`) ins Dokument ein oder mockt `getBoundingClientRect`.

**8. `state.course.tasks[i].blocks` vs. `tabs[].blocks`.** Aufgaben haben optionale Tabs. Wer alle Blöcke einer Aufgabe iterieren will, muss beide Pfade abdecken (`usedBlockTypes` in `canvas.js` zeigt das Muster).

**9. KaTeX-Re-Render nach State-Update.** Wer eine Frage neu generiert (z. B. Numeric-Input mit Variablen), muss `renderMath()` erneut auf dem neuen DOM aufrufen. Die ursprüngliche Substitution greift nicht für nachträglich eingefügte LaTeX-Strings.

**10. Schema-`showIf`.** Felder mit `showIf: cfg => cfg.mode === 'x'` werden bei jedem Re-Render evaluiert. Wer im Callback eine teure Berechnung macht, blockiert die Pane.

**11. Doppelte Übersetzungsschlüssel.** In einem JS-Objekt gewinnt bei gleichem Schlüssel der letzte. Ein neues `help: {…}` unter `taskPane.config` hat so einmal die Texte des „Was ist das?“-Kastens überschrieben. `test/quality/i18n.test.mjs` findet doppelte und fehlende Schlüssel.

**12. Verschluckte Backslashes.** `'\frac'` mit nur einem Backslash wird in JavaScript zu Seitenvorschub + „rac“, `'\b'` zu einem Rückschritt. Das passiert leicht, wenn Texte über Shell-Befehle in Dateien geschrieben werden. Der i18n-Test prüft auf Steuerzeichen; im Zweifel Dateien mit einem Editor bearbeiten.

**13. Zufalls-Schlüssel hängen an der Aufgabenposition.** `bl_<Aufgabe>_<Blockindex>_<ID>` nutzt die Position in der (nach Pools gefilterten) Aufgabenliste. Alles, was die Liste verändert, muss vor dem Wiederherstellen laufen, sonst passen gespeicherte Werte nicht mehr zu den Blöcken (siehe Start-Reihenfolge unter [Runtime-Ablauf](#runtime-ablauf)).

**14. Die 1100 px stehen an drei Stellen.** `CANVAS_WIDTH` in `builder/js/canvas.js` und `builder/template/runtime.js` sowie die Messzelle in `measureRuntimeHeight()` (`preview.js`). Wer die Breite ändert, muss alle drei anpassen; bestehende Kurse sind in diesem Koordinatensystem gespeichert.

**15. Globale Variablen werden per Text erkannt.** `globalVarsUsedBy()` findet eine globale Variable nur als `{name}` in Texten oder als Name in Feldern, deren Schlüssel „formula“ oder „expr“ enthält. Ein neues Formelfeld mit anderem Namen sieht sie nicht, der Block würde dann beim globalen Neu-Generieren nicht zurückgesetzt.

---

## Tests

```bash
npm test             # alle Suites, ca. 50 Sekunden (Windows: test.bat)
npm test -- runtime  # nur Dateien, deren Pfad "runtime" enthält
npm run lint         # ESLint
node test/blocks/cloze.test.mjs   # eine einzelne Datei
```

Ablauf: `startServer()` startet `serve.py` auf Port 8766 (`TEST_PORT`), oder nutzt einen schon laufenden Server. Der Browser ist das installierte Edge bzw. Chrome, ferngesteuert über `playwright-core`; es wird kein Browser heruntergeladen (`TEST_BROWSER` wählt ihn). Jede Seite bekommt einen frischen Browser-Kontext, `localStorage` wandert also nicht zwischen Tests. Fehler in der Browser-Konsole lassen einen Test über `assertNoErrors(page)` scheitern.

- **Builder-Tests** (`openBuilder()`): Die Seite enthält das Test-Hilfsobjekt `__mount(type, config)`, das einen Block wie die Runtime einbindet und `initScore`/`reportScore` mitschreibt (`m.scores`, `m.last()`), plus `__btn(root, /Text/)` und `__sleep(ms)`.
- **Runtime-Tests** (`openRuntime(course)`): `runtimeHtml()` baut aus `template/index.html` dieselbe Seite wie der ZIP-Export (Block-Skripte in der Reihenfolge von `BLOCK_FILES`, KaTeX aus `lib/katex`) und setzt ein Fake-LMS (`window.API`, SCORM 1.2) ein, das in `localStorage` speichert. `reloadRuntime(page)` wartet auf das verzögerte Speichern und lädt neu, so wird Fortsetzen getestet. `window.__lms.data` enthält alles, was ans LMS ging.

**Zeitgrenzen statt Benchmark** (`test/quality/performance.test.mjs`): Start einer Lerneinheit mit 30 Aufgaben und globalen Variablen samt „Nur ganzzahlige Lösungen“, globales Neu-Generieren, der ungünstigste Fall (keine globale Belegung erfüllt die Bedingung, die Runtime probiert alle Kandidaten), Builder mit 60 Blöcken und ZIP-Export mit Bildern. Die Grenzen liegen beim 3- bis 15-Fachen der gemessenen Zeiten; die Messwerte erscheinen als `ℹ`-Zeilen in der Ausgabe. `TEST_PERF_FACTOR=2` verdoppelt die Grenzen auf langsamen Rechnern. Wird ein Pfad absichtlich teurer, Grenze in `LIMITS` mit Begründung anpassen.

Neue Funktion → Test dazu, möglichst im passenden Ordner. Ein Test, der nach einer bewussten Änderung rot wird, wird angepasst, nicht gelöscht.

---

## Code-Stil

- Vanilla ES2020+, keine Frameworks, kein TypeScript, kein Build.
- Kommentare auf Englisch, im Code keine Umlaute. UI-Strings auf Deutsch mit Umlauten.
- Funktionen klein halten, lieber drei einzeilige Helfer als eine 200-Zeilen-Funktion.
- Keine `console.log` in committedem Code. Stattdessen `toast()` für sichtbare Meldungen oder Devtools-`debugger` für Einzelfall-Debugging.
- Vor jedem Commit: `npm test && npm run lint` muss grün sein.
