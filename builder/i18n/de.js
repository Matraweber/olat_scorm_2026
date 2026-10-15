// de.js: German UI chrome bundle for the builder.
// Registered on load in main.js.
// Keys are hierarchical, dot-separated: 'header.new', 'block.multipleChoice.label'.

const de = {
  meta: { name: 'Deutsch', label: 'DE' },

  common: {
    ok: 'OK',
    cancel: 'Abbrechen',
    save: 'Speichern',
    delete: 'Löschen',
    close: 'Schließen',
    back: 'Zurück',
    next: 'Weiter',
    yes: 'Ja',
    no: 'Nein',
    edit: 'Bearbeiten',
    rename: 'Umbenennen',
    add: 'Hinzufügen',
    remove: 'Entfernen',
    duplicate: 'Duplizieren',
    move: 'Verschieben',
    up: 'Nach oben',
    down: 'Nach unten',
    loading: 'Wird geladen …',
    error: 'Fehler',
    warning: 'Warnung',
    empty: 'Leer',
    optional: 'optional',
    example: 'Beispiel',
    tip: 'Tipp',
    hint: 'Hinweis'
  },

  header: {
    brand: 'SCORM Builder',
    brandTitle: 'OLAT-Lerneinheiten erstellen',
    home: 'Zur Willkommen-Seite',
    editCourseInfo: 'Kopfdaten bearbeiten',
    sidebarToggle: 'Aufgabenleiste ein- oder ausblenden',
    dataMenu: 'Datei',
    dataMenuSection: {
      course: 'Lerneinheit',
      open: 'Öffnen',
      export: 'Exportieren'
    },
    new: 'Neu',
    newHint: 'Leere Lerneinheit beginnen',
    loadZip: 'SCORM-ZIP laden …',
    loadZipHint: 'Vorheriges Export-ZIP öffnen',
    loadJson: 'JSON laden …',
    loadJsonHint: 'Konfigurationsdatei öffnen',
    exportJson: 'Als JSON exportieren',
    exportJsonHint: 'Rohkonfiguration herunterladen',
    help: 'Tastaturkürzel',
    helpTitle: 'Tastaturkürzel (?)',
    openFolder: 'Ordner',
    openFolderTitle: 'Ordner mit SCORM-ZIPs öffnen',
    preview: 'Vorschau',
    download: 'SCORM-ZIP erzeugen',
    language: 'Sprache',
    languageTitle: 'Anzeigesprache wählen'
  },

  sidebar: {
    tasks: 'Aufgaben',
    addTask: '+ Aufgabe',
    general: 'Allgemein',
    welcomeLink: 'Willkommen und Hilfe',
    courseInfoLink: 'Kopfdaten',
    themeLink: 'Branding und Theme',
    mode: 'Modus',
    jsonEditor: 'JSON-Editor'
  },

  taskList: {
    emptyTitle: 'Noch keine Aufgaben',
    emptyBody: 'Die erste Aufgabe anlegen, um Lerninhalte hinzuzufügen.',
    firstTask: '+ Erste Aufgabe',
    up: 'Nach oben',
    down: 'Nach unten',
    delete: 'Löschen',
    blocksSingular: '{n} Block',
    blocksPlural: '{n} Blöcke',
    tabsSuffix: ' · {n} Tabs',
    fallbackTitle: 'Aufgabe {n}'
  },

  footer: {
    tagline: 'SCORM 1.2 · nur im Browser · läuft offline · Stand 2026'
  },

  preview: {
    title: 'Vorschau',
    close: 'Schließen',
    frameTitle: 'SCORM-Vorschau'
  },

  toast: {
    genericError: 'Fehler: {msg}'
  },

  lang: {
    switchTitle: 'Anzeigesprache wechseln',
    switchLabel: 'Sprache wählen'
  },

  io: {
    error: {
      templateLoad: 'Konnte Template-Datei nicht laden: {path}',
      fileLoad: 'Konnte Datei nicht laden: {path}',
      jszipMissing: 'JSZip nicht geladen.',
      writePermissionDenied: 'Schreibrecht nicht gewährt.',
      saveFailed: 'Fehler beim Speichern: {msg}',
      zipFailed: 'ZIP-Fehler: {msg}',
      previewFailed: 'Vorschau-Fehler: {msg}'
    },
    manifest: {
      defaultCourseTitle: 'SCORM Lerneinheit'
    },
    emptyPackage: {
      title: 'Leeres Paket erzeugen?',
      message: 'Das SCORM-Paket enthält keine Aufgaben. Beim Import in OLAT erscheint nur ein leerer Kurs. Trotzdem fortfahren?',
      confirm: 'Trotzdem erzeugen'
    },
    exportGate: {
      title: 'Bereit zum Export?',
      summarySingular: 'Beim Prüfen wurde {total} Punkt gefunden, den Sie ansehen sollten:',
      summaryPlural: 'Beim Prüfen wurden {total} Punkte gefunden, die Sie ansehen sollten:',
      hint: 'Sie können das Paket trotzdem exportieren, die Lerneinheit könnte für Lernende aber unvollständig wirken.',
      fix: 'Korrigieren',
      proceed: 'Trotzdem exportieren'
    },
    savePicker: {
      description: 'SCORM-Paket (ZIP)'
    },
    unsaved: {
      title: 'Ungespeicherte Lerneinheit',
      message: 'Die aktuelle Lerneinheit wurde noch nicht als SCORM-ZIP gespeichert. Beim Wechseln gehen die Änderungen verloren.',
      save: 'Als SCORM-ZIP speichern und wechseln',
      discard: 'Verwerfen und wechseln',
      cancel: 'Abbrechen'
    },
    unknownZip: {
      title: 'Unbekanntes ZIP-Format?',
      message: 'Diese ZIP-Datei enthält keine tasks.json. Wahrscheinlich wurde sie nicht mit dem SCORM Builder erzeugt. Trotzdem versuchen, sie zu laden?',
      confirm: 'Trotzdem versuchen'
    },
    toast: {
      packageProgress: 'Paket wird erzeugt … {percent} %',
      saved: 'Gespeichert: {name}',
      savedToDownloadsSafari: 'Gespeichert in Downloads. Tipp: Safari > Einstellungen > Allgemein > „Bei jedem Download nachfragen" für Speicherort-Auswahl.',
      downloadReady: 'Download bereit: {filename}',
      savingPackage: 'Paket wird gespeichert …',
      readingPackage: 'Paket wird gelesen …',
      loadingTasks: 'Aufgaben werden geladen …',
      embeddingMedia: 'Medien werden eingebettet …',
      packageLoaded: 'SCORM-Paket geladen.',
      jsonLoaded: 'JSON-Konfiguration geladen.',
      preparingPreview: 'Vorschau wird vorbereitet …'
    },
    preview: {
      docTitle: 'Vorschau'
    },
    jsonEditor: {
      applied: 'Übernommen.'
    }
  },

  main: {
    newCourseConfirm: {
      title: 'Neue Lerneinheit?',
      message: 'Aktuellen Stand verwerfen und mit einer leeren Lerneinheit beginnen? Nicht gespeicherte Änderungen gehen verloren.',
      confirm: 'Verwerfen und neu'
    },
    header: {
      newCourseTitle: 'Neue Lerneinheit'
    },
    toast: {
      saved: 'Lerneinheit gespeichert.'
    },
    autosave: {
      title: 'Automatisch im Browser gespeichert',
      notSaved: 'Nicht gespeichert',
      saved: 'Gespeichert',
      savedSecondsAgo: 'Gespeichert · vor {n} s',
      savedMinutesAgo: 'Gespeichert · vor {n} min',
      saving: 'Wird gespeichert …'
    },
    recovery: {
      title: 'Vorherige Sitzung wiederherstellen?',
      body: 'Es wurde eine ungespeicherte Lerneinheit gefunden:',
      untitledCourse: 'Lerneinheit',
      taskCountSingular: '{n} Aufgabe',
      taskCountPlural: '{n} Aufgaben',
      lastEditedMinutes: 'Zuletzt geändert vor {n} Minuten.',
      lastEditedHours: 'Zuletzt geändert vor {n} Stunden.',
      discard: 'Verwerfen',
      restore: 'Wiederherstellen'
    }
  },

  state: {
    toast: {
      undoFailed: 'Rückgängig fehlgeschlagen: {msg}',
      nothingToUndo: 'Nichts zum Rückgängigmachen.',
      undone: 'Rückgängig',
      nothingToRedo: 'Nichts zum Wiederherstellen.',
      redone: 'Wiederherstellen',
      blocksCopiedSingular: '{n} Block kopiert.',
      blocksCopiedPlural: '{n} Blöcke kopiert.',
      clipboardEmpty: 'Zwischenablage ist leer.',
      blocksPastedSingular: '{n} Block eingefügt.',
      blocksPastedPlural: '{n} Blöcke eingefügt.'
    }
  },

  panes: {
    taskDelete: {
      title: 'Aufgabe löschen?',
      message: '„{name}" wird mit allen darin enthaltenen Blöcken gelöscht. Diese Aktion kann mit Strg + Z rückgängig gemacht werden.'
    },
    course: {
      heading: 'Kopfdaten der Lerneinheit',
      hint: 'Diese Angaben erscheinen im SCORM-Header und im OLAT-Lernpfad.',
      fields: {
        title: 'Kurstitel',
        titlePlaceholder: 'z. B. Maschinendynamik: Komplexe Zahlen',
        subtitle: 'Untertitel',
        passThreshold: 'Bestehensschwelle (0 bis 1)'
      },
      questionBlocks: {
        heading: 'Frageblöcke (Standard für die ganze Lerneinheit)',
        note: 'Gilt für alle Frageblöcke mit Zufallspool. Einzelne Aufgaben können das überschreiben.',
        lockAfterCheck: {
          label: 'Neu-Generieren nach Prüfen sperren',
          help: 'Nach dem ersten Prüfen kann keine neue Aufgabe mehr generiert werden.'
        },
        hideRegenerate: {
          label: 'Neu-Generieren ausblenden',
          help: 'Kein „Neu generieren"-Knopf; die erste Zufallsaufgabe muss gelöst werden.'
        },
        lockAnswers: {
          label: 'Antwort nach Prüfen sperren',
          help: 'Gilt für alle bewerteten Blöcke: Nach dem Prüfen kann die Antwort nicht mehr geändert werden (ein Versuch). „Neu generieren" gibt die Eingabe für die neue Aufgabe wieder frei.'
        }
      },
      timer: {
        heading: 'Zeitlimit (ganze Lerneinheit)',
        enabled: {
          label: 'Zeitlimit für die Lerneinheit',
          help: 'Ein Countdown läuft über alle Aufgaben hinweg (auch beim Wechseln der Aufgabe). Bei 0 wird die Lerneinheit automatisch abgeschlossen und bewertet.'
        },
        minutes: 'Minuten',
        seconds: 'Sekunden'
      },
      images: {
        heading: 'Bilder',
        shrink: {
          label: 'Große Bilder beim Hochladen verkleinern',
          help: 'Fotos werden auf höchstens 2000 px (längere Seite) verkleinert und als JPEG gespeichert, typischerweise rund 90 % kleiner. Screenshots/PNG bleiben verlustfrei. In der Lerneinheit ist kein Unterschied sichtbar. Betrifft nur neu hochgeladene Bilder.'
        }
      },
      pools: {
        heading: 'Aufgabenpools',
        note: 'Pro Durchlauf werden aus jedem Pool zufällig so viele Aufgaben gezogen wie eingestellt; Aufgaben ohne Pool sind immer dabei. Die Zuordnung erfolgt im Kopf der jeweiligen Aufgabe. Beim Fortsetzen bleibt die Auswahl gleich.',
        listLabel: 'Pools',
        itemLabel: 'Pool',
        name: 'Name',
        namePlaceholder: 'z. B. Statik',
        draw: 'Anzahl gezogener Aufgaben',
        drawPlaceholder: 'leer = alle',
        usage: '{draw} von {n} Aufgaben werden gezogen',
        empty: 'noch keine Aufgabe zugeordnet'
      },
      globalVars: {
        heading: 'Globale Variablen (ganze Lerneinheit)',
        note: 'Zufallsvariablen, die in allen Aufgaben gelten. Sie werden in Blöcken wie eigene Variablen benutzt: {F} in Texten, F in Formeln. Eine Block-Variable mit gleichem Namen hat Vorrang. Die Werte werden einmal pro Durchlauf gezogen.',
        listLabel: 'Globale Variablen',
        itemLabel: 'Globale Variable',
        listHelp: 'Funktioniert in Numerischer Eingabe, Komposition, Tabelle (Werte und Freie Tabelle) und Komplexen Zahlen.',
        name: 'Name',
        namePlaceholder: 'z. B. F',
        min: 'von',
        max: 'bis',
        integer: 'Nur Ganzzahlen',
        usageHead: 'Verwendet in:',
        unused: 'noch in keiner Aufgabe verwendet',
        button: {
          label: 'Button „Globale Werte neu generieren“ anzeigen',
          help: 'Im Kopfbereich der Lerneinheit. Zieht neue Werte und setzt alle Aufgaben zurück, in denen globale Variablen vorkommen (mit Rückfrage). Der „Neu generieren“-Button eines Blocks ändert nur dessen eigene Variablen.'
        },
        lock: {
          label: 'Globales Neu-Generieren nach Prüfen sperren',
          help: 'Sobald in einer betroffenen Aufgabe eine Antwort geprüft wurde, ist der Button gesperrt. Unabhängig davon ist er gesperrt, solange dort Antworten gesperrt sind („Antwort nach Prüfen sperren“).'
        }
      }
    },
    theme: {
      heading: 'Branding / Theme',
      hint: 'Standardmäßig im UCB-Stil. Farben und Footer hier anpassen.',
      reset: {
        button: 'Standard-Branding wiederherstellen',
        title: 'Branding zurücksetzen?',
        message: 'Farben, Logo und Footer-Einstellungen werden auf die ursprünglichen UCB-Standardwerte zurückgesetzt.',
        confirmLabel: 'Zurücksetzen',
        toast: 'Standard-Branding wiederhergestellt.'
      },
      persistError: 'Branding konnte nicht dauerhaft gespeichert werden.',
      fields: {
        kicker: 'Kicker (Badge oben links)',
        fontFamily: 'Schriftart (CSS font-family)',
        primaryColor: 'Primärfarbe',
        primaryLight: 'Primärfarbe hell (Verlauf)',
        accentColor: 'Akzentfarbe',
        accentDarkColor: 'Akzentfarbe dunkel',
        footerText: 'Footer-Text',
        footerLink: 'Footer-Link',
        logoUrl: {
          label: 'Logo-Pfad (Datei in template/, wird ins ZIP gepackt)',
          help: 'Datei mit diesem Namen muss in builder/template/ existieren.'
        }
      },
      logoUpload: {
        label: 'Logo per Upload (überschreibt Pfad)',
        help: 'Lädt das Bild als Data-URL ins JSON.',
        loaded: 'Logo geladen.',
        remove: 'Upload-Logo entfernen'
      },
      logoAlt: 'Logo',
      logoMissing: 'Logo "{name}" in template/ nicht gefunden.'
    }
  },

  welcome: {
    rail: {
      ariaLabel: 'Kapitel-Übersicht',
      label: 'Kapitel'
    },
    hero: {
      title: 'Willkommen.',
      kicker: 'SCORM Builder · Umwelt-Campus Birkenfeld',
      lede: 'OLAT-Lerneinheiten direkt im Browser bauen.<br><span class="welcome-lede-sub">Ohne Installation, ohne Konto.</span>',
      ctaPrimary: 'Erste Aufgabe erstellen',
      ctaSecondary: 'Zu Kopfdaten'
    },
    video: {
      title: 'Video: Die Schritte in einer Minute',
      lead: 'Das kurze Tutorial zeigt den kompletten Ablauf vom leeren Kurs bis zum SCORM-Export.',
      missing: 'Das Tutorial-Video wurde nicht gefunden ({file}).'
    },
    quickstart: {
      title: 'In 5 Schritten zum SCORM-Paket',
      lead: 'Vom leeren Builder bis zur fertigen ZIP-Datei.',
      optionalLabel: 'Optional vorher:',
      optionalCourse: 'Kopfdaten',
      optionalTheme: 'Branding / Theme'
    },
    step1: {
      title: 'Aufgabe anlegen',
      body: 'In der Seitenleiste auf <strong>+ Aufgabe</strong>. Wählbar: leere Aufgabe oder eine Vorlage (z. B. „Wahrheitstabelle", „Numerische Eingabe mit Variablen").'
    },
    step2: {
      title: 'Block hinzufügen',
      body: 'Innerhalb der Aufgabe auf <strong>+ Block</strong>. Ein Menü zeigt alle verfügbaren Block-Typen.'
    },
    step3: {
      title: 'Beispiel laden oder selbst füllen',
      body: 'Jeder Frage-Block startet mit einer <strong>Vorlage</strong>: „Manuell (leer)" für eigene Inhalte oder ein <strong>Beispiel</strong> mit fertigem Inhalt. Mit <strong>Zurücksetzen</strong> entfernen Sie Ihre manuelle Eingabe.'
    },
    step4: {
      title: 'Vorschau ansehen',
      body: 'Oben rechts auf <strong>Vorschau</strong>. Zeigt die Lerneinheit aus Studierenden-Sicht, Antworten lassen sich direkt ausprobieren.'
    },
    step5: {
      title: 'SCORM-ZIP erzeugen',
      body: '<strong>SCORM-ZIP erzeugen</strong> lädt ein vollständiges SCORM-1.2-Paket herunter. Die ZIP-Datei wird in OLAT als Lerneinheit hochgeladen.'
    },
    mock: {
      previewBtn: 'Vorschau',
      exportBtn: 'SCORM-ZIP erzeugen',
      task1: 'Aufgabe 1',
      task2: 'Aufgabe 2',
      blocks1: '1 Block',
      blocks2: '2 Blöcke',
      pickerHead: 'Block hinzufügen',
      catMedia: 'Medien & Inhalt',
      catQuestion: 'Frage',
      catStem: 'MINT',
      chipText: 'Text',
      chipImage: 'Bild',
      chipVideo: 'Video',
      chipMultipleChoice: 'Multiple Choice',
      chipSort: 'Sortieren',
      chipNumeric: 'Numerisch',
      chipTruthTable: 'Wahrheitstabelle',
      chipUnits: 'Einheiten',
      headingLabel: 'Überschrift',
      headingValue: 'Aufgabe',
      templateLabel: 'Vorlage',
      templateValue: 'Beispiel: Mathematik, Pythagoras ▾',
      questionSection: 'Frage',
      questionTemplateLabel: 'Frage-Vorlage',
      questionTemplateValue: 'Berechnen Sie {a}² + {b}².',
      jsonExportBtn: 'JSON exportieren',
      canvasHead: 'Aufgabe 1 · + Block',
      blockNumericInput: 'Numerische Eingabe',
      configHead: 'Konfiguration',
      cfgTemplate: 'Vorlage',
      cfgQuestion: 'Frage',
      cfgScoring: 'Bewertung'
    },
    interface: {
      title: 'Die Oberfläche im Überblick',
      lead: 'Der Builder besteht aus drei Bereichen.',
      legend: {
        sidebarTitle: 'Seitenleiste',
        sidebarBody: 'Liste Ihrer Aufgaben sowie die Allgemein-Links (Kopfdaten, Branding, diese Hilfe). Hier fügen Sie Aufgaben hinzu, sortieren sie um oder löschen sie.',
        canvasTitle: 'Canvas',
        canvasBody: 'Die Arbeitsfläche der ausgewählten Aufgabe. Blöcke werden hier per Drag & Drop angeordnet und in der Größe angepasst.',
        configTitle: 'Konfigurations-Pane',
        configBody: 'Rechts: Eigenschaften des markierten Blocks. Vorlagen, Texte, Antworten und Bewertung werden hier eingestellt.'
      }
    },
    blockTypes: {
      title: 'Block-Typen',
      lead: 'Medien- & Text-Blöcke sind statisch, Frage- und MINT-Blöcke werden bewertet. Eine Aufgabe kann beliebig viele Blöcke enthalten.',
      hint: 'Auf eine Kachel klicken, um eine Live-Vorschau und Details zu sehen.',
      categoryOther: 'Sonstige',
      cardAriaLabel: '{name}: Details ansehen',
      gradedBadge: 'bewertet'
    },
    canvas: {
      title: 'Mit dem Canvas arbeiten',
      tipMove: {
        title: 'Verschieben',
        body: 'Blöcke werden per Maus gezogen. Mit gehaltener Shift-Taste lassen sich mehrere Blöcke gleichzeitig bewegen.'
      },
      tipResize: {
        title: 'Größe ändern',
        body: 'Unten rechts an jedem Block die Ecke ziehen. ↕ passt die Höhe an die Vorschau im Builder an, ⇳ an die fertige Lerneinheit, damit der Block dort nicht scrollen muss.'
      },
      tipMultiSelect: {
        title: 'Mehrfach-Auswahl',
        body: 'Shift + Klick wählt mehrere Blöcke aus. Im rechten Pane erscheinen dann Ausrichten, Verteilen und Duplizieren.'
      },
      tipZoom: {
        title: 'Zoom',
        body: 'Strg/Cmd + Mausrad zoomt die Canvas. Alternativ stehen die +/− Knöpfe oben rechts in der Aufgabe zur Verfügung.'
      },
      tipTabs: {
        title: 'Tabs (optional)',
        body: 'Pro Aufgabe können Tabs aktiviert werden, beispielsweise „Visualisierung" und „Aufgabe". Mit + kommen weitere Tabs dazu, mit × wird ein Tab geschlossen; der Name lässt sich im aktiven Tab direkt bearbeiten.'
      },
      tipTemplates: {
        title: 'Vorlagen speichern',
        body: 'Eine fertige Aufgabe als Vorlage speichern („Vorlage" im Aufgaben-Header). Sie steht beim nächsten Mal sofort zur Verfügung.'
      }
    },
    variables: {
      title: 'Zufallsvariablen',
      lead: 'Rechenblöcke (Numerische Eingabe, Komposition, Tabelle, Komplexe Eingabe) ziehen Zahlen aus Bereichen, die du festlegst. So bekommt jede Person eigene Werte, und „Neu generieren“ liefert eine neue Aufgabe derselben Art.',
      local: {
        title: 'Variablen im Block',
        body: 'Im Block unter „Zufallsvariablen“ Name, Bereich (von/bis) und „Nur Ganzzahlen“ festlegen. Im Text schreibst du <code>{a}</code>, in der Formel <code>a</code>.'
      },
      global: {
        title: 'Globale Variablen',
        body: 'In den Kopfdaten angelegt, gelten sie in allen Aufgaben, z. B. dieselbe Kraft F in einer ganzen Aufgabenreihe. Eine Block-Variable mit gleichem Namen hat Vorrang. „Globale Werte neu generieren“ oben in der Lerneinheit setzt alle betroffenen Aufgaben zurück.'
      },
      regen: {
        title: '„Neu generieren“',
        body: 'Zieht neue Werte für die Variablen des Blocks. Lässt sich in den Kopfdaten oder im Block nach dem Prüfen sperren oder ganz ausblenden.'
      },
      format: {
        title: 'Darstellung und ganzzahlige Lösungen',
        body: 'Nachkommastellen und Anzeige (Kommazahl, Bruch oder automatisch) pro Block oder pro Variable. „Nur ganzzahlige Lösungen“ zieht nur Werte, bei denen das Ergebnis eine ganze Zahl ist.'
      },
      example: '<strong>Beispiel:</strong> Aufgabentext <code>Ein Balken der Länge {l} m trägt F = {F} kN. Berechne M = F · l.</code>, Variable <code>l</code> von 2 bis 6 (ganzzahlig), <code>F</code> als globale Variable von 10 bis 50, Lösungs-Formel <code>F*l</code>. Lernende sehen z. B. „Länge 4 m … F = 25 kN“; richtig ist 100.'
    },
    scoring: {
      title: 'Bewertung und Punkte',
      lead: 'Jeder bewertete Block hat eine Punktzahl. Zusammen ergeben sie die Gesamtpunkte der Lerneinheit; ob bestanden ist, entscheidet die Bestehensschwelle in den Kopfdaten.',
      partial: {
        title: 'Teilpunkte',
        body: 'Die meisten Blöcke bewerten anteilig: 3 von 4 richtigen Zuordnungen geben 75 % der Punkte. Mehrere Antwortfelder zählen einzeln.'
      },
      deduct: {
        title: 'Abzug für Fehler',
        body: 'Multiple Choice, Tabelle, Wahrheitstabelle, Hotzone und Komposition können für falsche Antworten Punkte abziehen. Die Punktzahl eines Blocks fällt nie unter 0.'
      },
      attempts: {
        title: 'Versuche begrenzen',
        body: 'Unter „Versuche, Hinweis & Lösungsweg“: Anzahl der Versuche und optional ein Abzug in % pro weiterem Versuch. Sind alle verbraucht, ist der Block gesperrt.'
      },
      help: {
        title: 'Hinweis und Lösungsweg',
        body: 'Erscheinen als Buttons am Block, nach einer einstellbaren Zahl von Fehlversuchen, mit KaTeX und den aktuellen Variablenwerten. Ein Hinweis kann Punkte kosten; der Lösungsweg sperrt die Antworten.'
      },
      locks: {
        title: 'Sperren',
        body: '„Antwort nach Prüfen sperren“ erlaubt nur einen Versuch. „Neu-Generieren nach Prüfen sperren“ verhindert, dass bis zu besonders einfachen Werten weitergewürfelt wird.'
      },
      timer: {
        title: 'Zeitlimits',
        body: 'Für die ganze Lerneinheit (bei 0 wird sie beendet) oder pro Block (sperrt dessen Antworten; läuft nur, solange die Aufgabe angezeigt wird).'
      },
      example: '<strong>Rechenbeispiel:</strong> Block mit 2 Punkten, 3 Versuchen, 25 % Abzug pro weiterem Versuch und 0,5 Punkten für den Hinweis. Richtig im 2. Versuch nach geöffnetem Hinweis: 2 × 75 % − 0,5 = <strong>1 Punkt</strong>.'
    },
    courseSettings: {
      title: 'Kopfdaten: Standard für alle Aufgaben',
      lead: 'Die Kopfdaten („Kopfdaten bearbeiten“) gelten für die ganze Lerneinheit: Titel, Bestehensschwelle, Standards für Frageblöcke, Zeitlimit, globale Variablen, Aufgabenpools und Bilder.',
      inherit: {
        title: '„Wie Lerneinheit“',
        body: 'Einstellungen wie „Neu-Generieren nach Prüfen sperren“ oder „Antwort nach Prüfen sperren“ stehen im Block auf „Wie Lerneinheit (An/Aus)“. Dann gilt der Wert aus den Kopfdaten; „An“ oder „Aus“ im Block gilt nur für diesen Block.'
      },
      threshold: {
        title: 'Bestehensschwelle',
        body: 'Anteil der Punkte zum Bestehen, als Zahl zwischen 0 und 1: 0,5 bedeutet 50 %. Beim Beenden meldet die Lerneinheit danach „bestanden“ oder „nicht bestanden“.'
      },
      example: ''
    },
    pools: {
      title: 'Aufgabenpools',
      lead: 'Mit Pools bearbeitet nicht jede Person dieselben Aufgaben: Pro Durchlauf wird aus jedem Pool zufällig die eingestellte Zahl an Aufgaben gezogen. Aufgaben ohne Pool sind immer dabei.',
      setup: {
        title: 'Einrichten',
        body: 'In den Kopfdaten unter „Aufgabenpools“ einen Pool mit Namen und Anzahl anlegen. Dann im Kopf jeder Aufgabe neben dem Titel den Pool wählen.'
      },
      run: {
        title: 'Im Durchlauf',
        body: 'Die Auswahl bleibt beim Fortsetzen gleich. Navigation, Fortschritt und Maximalpunktzahl beziehen sich nur auf die gezogenen Aufgaben.'
      },
      example: '<strong>Beispiel:</strong> 8 Statik-Aufgaben im Pool „Statik“ mit Anzahl 3, dazu eine Einführung und ein Abschluss ohne Pool: Jede Person bearbeitet 5 Aufgaben, die mittleren 3 sind zufällig ausgewählt.'
    },
    templates: {
      title: 'Vorlagen',
      lead: 'Zwei Arten von Vorlagen sparen Arbeit bei wiederkehrenden Aufgaben.',
      task: {
        title: 'Aufgaben-Vorlagen',
        body: 'Eine ganze Aufgabe mit allen Blöcken: mit „★ Vorlage“ im Kopf der Aufgabe speichern. Einfügen über „+ Aufgabe“ als neue Aufgabe oder im Block-Dialog unter „Eigene Vorlagen“ in eine bestehende Aufgabe.'
      },
      block: {
        title: 'Block-Vorlagen',
        body: 'Ein einzelner Block mit allen Einstellungen: mit ★ oben am Block speichern und im Block-Dialog unter „Eigene Vorlagen“ wieder einfügen.'
      },
      storage: {
        title: 'Wo sie liegen',
        body: 'Vorlagen werden im Browser gespeichert, nicht in der Lerneinheit. Sie gelten nur für diesen Browser und diese Adresse (localhost und 127.0.0.1 zählen getrennt) und gehen beim Löschen der Browserdaten verloren.'
      },
      example: ''
    },
    saving: {
      title: 'Speichern und Sichern',
      lead: 'Die eigentliche Datei einer Lerneinheit ist das SCORM-ZIP. Dieselbe Datei kommt nach OLAT und lässt sich jederzeit wieder öffnen und weiterbearbeiten.',
      zip: {
        title: 'SCORM-ZIP',
        body: '„SCORM-ZIP erzeugen“ (Strg+Shift+S) speichert die Lerneinheit. Wieder öffnen über „Datei → SCORM-ZIP laden …“ oder die Ordneransicht. Wurde die Datei aus der Ordneransicht geöffnet oder über den Speichern-Dialog gespeichert, überschreibt Strg+S sie danach direkt.'
      },
      autosave: {
        title: 'Automatische Sicherung',
        body: 'Der Builder sichert laufend im Browser. Nach einem Absturz oder versehentlichem Schließen bietet er beim nächsten Start „Wiederherstellen“ an. Das ersetzt nicht das ZIP.'
      },
      guard: {
        title: 'Ungespeicherte Änderungen',
        body: 'Vor „Neu“ oder dem Öffnen einer anderen Datei fragt der Builder nach, wenn die aktuelle Lerneinheit noch nicht als ZIP gespeichert ist.'
      },
      images: {
        title: 'Bilder',
        body: 'Große Fotos werden beim Hochladen auf höchstens 2000 px verkleinert; das hält das ZIP klein. Für Detailbilder gibt es am Bildfeld „Original behalten“.'
      },
      example: ''
    },
    lms: {
      title: 'In OLAT: Was Lernende erleben',
      lead: 'Die Lerneinheit läuft in OLAT als SCORM-1.2-Paket. Mit „Vorschau“ siehst du sie vorher genau so, wie Lernende sie sehen.',
      progress: {
        title: 'Fortschritt',
        body: 'Ein Balken zeigt, wie viele Aufgaben erledigt sind. Erledigt heißt: Alle bewerteten Blöcke der Aufgabe sind gelöst.'
      },
      resume: {
        title: 'Unterbrechen und fortsetzen',
        body: 'Wer die Lerneinheit schließt, macht später an derselben Stelle weiter: mit denselben Zufallswerten, Punkten, Sperren, Timern und Eingaben. Gelöste Aufgaben zeigen ihre Lösung. Zuordnungen per Ziehen werden nicht gespeichert.'
      },
      report: {
        title: 'Was OLAT bekommt',
        body: 'Erreichte und maximale Punkte, den Status (beim Beenden „bestanden“ oder „nicht bestanden“ nach der Bestehensschwelle, vorher „unvollständig“) und die Bearbeitungszeit.'
      },
      finish: {
        title: 'Beenden',
        body: '„Test beenden“ auf der letzten Aufgabe schließt die Lerneinheit ab und zeigt das Ergebnis. Danach wird kein Fortsetzen-Stand mehr gespeichert.'
      },
      example: ''
    },
    languages: {
      title: 'Mehrsprachige Lerneinheiten',
      lead: 'Der Builder unterscheidet zwei Ebenen: die Sprache der Oberfläche und die Sprache der Kursinhalte.',
      uiLang: {
        title: 'Oberflächensprache',
        body: 'Der Knopf oben rechts im Header (z. B. DE) wechselt die Sprache der Builder-Oberfläche. Kursinhalte bleiben unberührt.'
      },
      contentLang: {
        title: 'Inhaltssprache pro Feld',
        body: 'Im Konfigurationspanel steht der Umschalter „Inhaltssprache: DE | EN". Auf EN stellen, dasselbe Feld auf Englisch ausfüllen, fertig. Der deutsche Text wird als Hilfe darunter angezeigt und bleibt erhalten.'
      },
      student: {
        title: 'Was Studierende sehen',
        body: 'Bei zwei befüllten Sprachen erscheint im SCORM-Player automatisch ein DE/EN-Umschalter. Bei nur einer Sprache verhält sich alles wie bisher, ohne Umschalter.'
      },
      export: {
        title: 'Export',
        body: 'Das ZIP enthält nur die tatsächlich benutzten Sprachen. Der Kurs startet in der Sprache, die beim Export im Builder aktiv war. Felder ohne Übersetzung fallen auf die Erstsprache zurück.'
      }
    },
    katex: {
      title: 'Formeln mit KaTeX',
      lead: 'In Aufgabentexten, Antwortmöglichkeiten, Beschriftungen der Komposition, Tabellenzellen sowie Hinweis und Lösungsweg lassen sich Formeln setzen. Formeln stehen zwischen <code>$…$</code> (im Text) oder <code>$$…$$</code> (eigene Zeile, zentriert). Zufallsvariablen schreibt man als <code>{a}</code>; in der Lerneinheit steht dort der gezogene Wert.',
      colInput: 'Eingabe',
      colResult: 'Ergebnis',
      colNote: 'Wofür',
      ex: {
        fraction: 'Bruch',
        scripts: 'Hochzahl und Index',
        sqrt: 'Wurzel',
        greek: 'Griechische Buchstaben, Grad',
        cdot: 'Malpunkt',
        text: 'Vektorpfeil, normaler Text im Index',
        variables: 'Variablen {a}, {b} (hier mit a = 3, b = 4)',
        display: 'Abgesetzte Formel mit Summe'
      },
      tip: {
        umlauts: 'Wörter und Umlaute in Formeln in <code>\\text{…}</code> setzen, z. B. <code>$F_{\\text{Lager}}$</code>.',
        varsInMath: 'Hat der Block Variablen namens a und b, wird <code>{a}</code> auch in <code>\\frac{a}{b}</code> durch den Wert ersetzt. Soll dort der Buchstabe stehen, ein Leerzeichen einfügen: <code>\\frac{ a}{ b}</code>.',
        dollar: 'Ein Dollarzeichen, das keine Formel beginnen soll, als <code>\\$</code> schreiben.',
        check: 'Die Vorschau im Builder zeigt sofort, ob eine Formel funktioniert; fehlerhafte Formeln erscheinen rot.'
      },
      linkIntro: 'Alle Befehle, die KaTeX versteht:',
      linkText: 'katex.org/docs/supported'
    },
    shortcuts: {
      title: 'Tastaturkürzel',
      lead: 'Auf der Canvas verfügbar:',
      keyArrow: 'Pfeil',
      keyCtrl: 'Strg/⌘',
      keyDel: 'Entf',
      keyWheel: 'Mausrad',
      moveByPixel: 'Markierte Blöcke pixelweise verschieben',
      moveBy10: 'Blöcke in 10-px-Schritten verschieben',
      copy: 'Markierte Blöcke kopieren',
      paste: 'Blöcke einfügen',
      duplicate: 'Markierte Blöcke duplizieren',
      selectAll: 'Alle Blöcke der Aufgabe markieren',
      delete: 'Markierte Blöcke löschen',
      deselect: 'Auswahl aufheben',
      undo: 'Rückgängig',
      redo: 'Wiederherstellen',
      save: 'Speichern (überschreibt die geöffnete ZIP-Datei, sonst Sicherung im Browser)',
      saveAs: 'SCORM-ZIP erzeugen',
      zoom: 'Canvas zoomen'
    },
    foot: {
      note: 'Diese Seite ist jederzeit über <strong>Willkommen / Hilfe</strong> in der Seitenleiste erreichbar.'
    },
    modal: {
      ariaLabel: '{name}: Details',
      gradedBadge: 'Bewertet',
      factCategory: 'Kategorie',
      factGradable: 'Bewertbar',
      factConfigOptions: 'Konfigurations-Optionen',
      previewLabel: 'Live-Vorschau',
      previewNone: '(Keine Vorschau verfügbar)',
      previewError: 'Vorschau konnte nicht gerendert werden.'
    }
  },

  modals: {
    categoryGeneral: 'Allgemein',
    userTemplatesHead: 'Eigene Vorlagen',
    noTemplates: 'Keine Vorlagen verfügbar.',
    noBlockTemplatesHint: 'Noch keine eigenen Vorlagen in diesem Browser. Block-Vorlage anlegen: Block in einer Aufgabe auswählen und oben am Block auf ★ (Als Block-Vorlage speichern) klicken. Vorlagen werden im Browser gespeichert, gelten also nur für diesen Browser und diese Adresse (z. B. localhost:8765).',
    insert: 'Einfügen',
    renamePrompt: 'Neuer Name:',
    templateInserted: 'Vorlage "{name}" eingefügt.',
    deleteTemplateTitle: 'Vorlage löschen?',
    deleteTemplateMessage: '„{name}" wird endgültig aus den Aufgaben-Vorlagen entfernt.',
    noBlocksInTask: 'Diese Aufgabe enthält keine Blöcke.',
    defaultTemplateName: 'Meine Vorlage',
    defaultTemplateCategory: 'Eigene',
    nameRequired: 'Name darf nicht leer sein.',
    templateSaved: 'Vorlage "{name}" gespeichert.',
    templateBasedOn: 'Vorlage basiert auf: {base}',
    templateBadge: 'Vorlage',
    taskTemplateBadge: 'Aufgaben-Vorlage',
    taskTemplateBlocks: 'Fügt {n} Block/Blöcke aus dieser Aufgaben-Vorlage ein',
    gradedBadge: 'gewertet',
    deleteTemplateAction: 'Vorlage löschen',
    deleteBlockTemplateTitle: 'Block-Vorlage löschen?',
    deleteBlockTemplateMessage: '„{name}" wird endgültig aus den eigenen Block-Vorlagen entfernt.',
    noBlockMatch: 'Kein Block-Typ entspricht „{query}".'
  },

  taskPane: {
    taskLabel: 'Aufgabe {n}',
    titlePlaceholder: 'Titel der Aufgabe (in der Navigation sichtbar)',
    poolTitle: 'Aufgabenpool (Kopfdaten): Aufgaben eines Pools werden pro Durchlauf zufällig gezogen',
    poolNone: 'Kein Pool (immer dabei)',
    poolOption: 'Pool: {name}',
    addBlock: '+ Block',
    addBlockTitle: 'Block hinzufügen',
    saveTemplate: '★ Vorlage',
    saveTemplateTitle: 'Aufgabe als Vorlage speichern',
    tabsDisable: 'Tabs deaktivieren',
    tabsEnable: '+ Tabs aktivieren',
    tabsDisableTitle: 'Alle Tabs entfernen (nur Tab 1 und seine Blöcke werden behalten)',
    tabsEnableTitle: 'Tabs aktivieren (startet mit „Visualisierung" und „Aufgabe"; weitere Tabs mit +)',
    tabsDisableConfirmTitle: 'Tabs deaktivieren?',
    tabsDisableConfirmMessageSingular: 'Die Tabs ab Tab 2 enthalten {n} Block. Beim Deaktivieren geht er verloren.',
    tabsDisableConfirmMessagePlural: 'Die Tabs ab Tab 2 enthalten {n} Blöcke. Beim Deaktivieren gehen diese verloren.',
    tabsDisableConfirmLabel: 'Deaktivieren',
    zoomOutTitle: 'Verkleinern (Strg + Mausrad)',
    zoomInTitle: 'Vergrößern (Strg + Mausrad)',
    zoomResetTitle: 'Zoom 100%',
    tabSwitchTitle: 'Tab wechseln',
    tabFallbackTitle: 'Tab {n}',
    tabRenameTitle: 'Klicken zum Umbenennen',
    tabCloseTitle: 'Tab schließen',
    tabAddTitle: 'Tab hinzufügen',
    tabCloseConfirmTitle: 'Tab schließen?',
    tabCloseConfirmMessageSingular: 'Dieser Tab enthält {n} Block. Beim Schließen geht er verloren.',
    tabCloseConfirmMessagePlural: 'Dieser Tab enthält {n} Blöcke. Beim Schließen gehen diese verloren.',
    tabCloseConfirmLabel: 'Schließen',
    dropRejectedSingular: 'Datei ignoriert: nur Bilddateien können auf die Canvas gezogen werden.',
    dropRejectedPlural: '{n} Dateien ignoriert: nur Bilddateien können auf die Canvas gezogen werden.',
    fileValidationError: '„{name}": {error}',
    fileReadError: '„{name}" konnte nicht gelesen werden.',
    imageAddedSingular: 'Bild als Block hinzugefügt.',
    imageAddedPlural: '{n} Bilder als Blöcke hinzugefügt.',
    canvas: {
      gradedSuffix: ' · gewertet',
      fitHeightTitle: 'Höhe an Inhalt anpassen (Builder-Vorschau)',
      fitScormTitle: 'Höhe für SCORM anpassen: so hoch, dass der Block in der fertigen Lerneinheit nicht scrollen muss (gemessen wie in der SCORM-Datei, mit Platz für Rückmeldungen)',
      fitScormFailed: 'Die Höhe konnte für diesen Block nicht gemessen werden.',
      fitScormUnchanged: 'Die Höhe passt bereits.',
      fitScormDone: 'Höhe auf {h} px gesetzt.',
      saveAsTemplateTitle: 'Als Block-Vorlage speichern',
      resizeTitle: 'Größe ändern',
      saveTemplateDialog: {
        title: 'Block als Vorlage speichern',
        nameLabel: 'Name',
        namePlaceholder: 'z. B. Multiple Choice mit 4 Optionen',
        descriptionLabel: 'Beschreibung (optional)',
        descriptionPlaceholder: 'Was zeichnet diese Vorlage aus?'
      },
      templateNotSavedNoName: 'Vorlage wurde nicht gespeichert (kein Name angegeben).',
      templateSaved: 'Block-Vorlage "{name}" gespeichert.',
      deleteBlockDialog: {
        title: 'Block löschen?',
        message: '„{name}" wird von der Canvas entfernt. Diese Aktion kann mit Strg + Z rückgängig gemacht werden.'
      },
      empty: {
        title: 'Bereit für den ersten Block?',
        body: 'Wählen Sie einen Block-Typ (z. B. Bild, Text oder Frage) und platzieren Sie ihn frei auf der Canvas.',
        addBlock: '+ Block hinzufügen',
        hint: 'Tipp: <kbd>Strg</kbd> + Mausrad zum Zoomen · <kbd>Pfeiltasten</kbd> zum Verschieben'
      }
    },
    config: {
      editorLocale: {
        label: 'Inhaltssprache:'
      },
      help: {
        toggle: 'Was ist das?',
        stepsHead: 'Schritte',
        tipsHead: 'Tipps'
      },
      posLabel: 'Position {x}, {y} · Größe {w}×{h}',
      empty: {
        prompt: 'Wählen Sie einen Block auf der Canvas, um ihn zu bearbeiten.',
        shortcutHint: '<kbd>?</kbd> öffnet alle Tastaturkürzel.'
      },
      multi: {
        title: 'Mehrfachauswahl',
        hint: 'Aktion für alle markierten Blöcke wählen.',
        alignHead: 'Ausrichten',
        alignLeft: '⟸ Links',
        alignCenterX: '⇔ Mitte X',
        alignRight: 'Rechts ⟹',
        alignTop: '⤒ Oben',
        alignCenterY: '⇕ Mitte Y',
        alignBottom: 'Unten ⤓',
        distributeHead: 'Verteilen (gleicher Abstand)',
        distributeHorizontal: 'Horizontal',
        distributeVertical: 'Vertikal',
        actionsHead: 'Aktionen',
        duplicate: '⧉ Duplizieren',
        delete: '✕ Löschen'
      },
      single: {
        title: 'Konfiguration: {label}',
        unknownType: 'Block-Typ "{type}" ist nicht registriert.',
        noSchema: 'Dieser Block hat keine Konfiguration.',
        lockAnswersLabel: 'Antwort nach Prüfen sperren',
        lockAnswersHelp: 'Nach dem Prüfen kann die Antwort nicht mehr geändert werden. „Wie Lerneinheit" folgt der Einstellung in den Kopfdaten.',
        timerEnabledLabel: 'Zeitlimit für diesen Block',
        timerEnabledHelp: 'Countdown im Block. Er läuft nur, solange die Aufgabe (bzw. der Tab) angezeigt wird, und pausiert beim Wechseln. Bei 0 wird die Antwort gesperrt.',
        timerMinutes: 'Minuten',
        timerSeconds: 'Sekunden'
      },
      support: {
        section: 'Versuche, Hinweis & Lösungsweg',
        attemptsLimit: 'Lösungsversuche begrenzen',
        attemptsLimitHelp: 'Jedes Prüfen zählt als Versuch. Sind alle Versuche verbraucht, werden die Antworten (und „Neu generieren“) gesperrt.',
        maxAttempts: 'Anzahl Versuche',
        attemptPenalty: 'Abzug pro weiterem Versuch (%)',
        attemptPenaltyHelp: 'Beispiel 25: im 2. Versuch höchstens 75 %, im 3. höchstens 50 % der Punkte. 0 = kein Abzug.',
        hintEnabled: 'Hinweis anbieten',
        hintEnabledHelp: 'Nach der eingestellten Zahl von Fehlversuchen erscheint am Block ein Button „Hinweis“. KaTeX und Variablen ({a}) mit den aktuellen Werten möglich.',
        hintText: 'Hinweistext',
        hintAfter: 'Hinweis nach … Fehlversuchen (0 = sofort)',
        hintPenalty: 'Punktabzug für das Öffnen des Hinweises',
        solutionEnabled: 'Lösungsweg anbieten',
        solutionEnabledHelp: 'Button „Lösungsweg“ am Block. Wird er geöffnet, bevor die Aufgabe gelöst ist, werden die Antworten gesperrt. KaTeX und Variablen ({a}) möglich.',
        solutionText: 'Lösungsweg',
        solutionAfter: 'Lösungsweg nach … Fehlversuchen',
        solutionAfterPlaceholder: 'leer = wenn alle Versuche verbraucht (ohne Begrenzung: 3)',
        solutionWhenCorrect: 'Lösungsweg auch nach richtiger Antwort anzeigen'
      },
      warnings: {
        title: 'Hinweise ({n})',
        item: '• {msg}'
      }
    },
    bulk: {
      deleteTitleSingular: 'Block löschen?',
      deleteTitlePlural: '{n} Blöcke löschen?',
      deleteMessageSingular: 'Der markierte Block wird von der Canvas entfernt.',
      deleteMessagePlural: 'Alle {n} markierten Blöcke werden von der Canvas entfernt.'
    }
  },

  form: {
    gridTable: {
      corner: 'Zeile / Spalte',
      kindInherit: 'wie Spalte',
      kind: { text: 'Text', numeric: 'Zahl-Antwort', textAnswer: 'Text-Antwort', choice: 'Auswahl (Dropdown)' },
      optionsPlaceholder: 'Richtig | Falsch 1 | Falsch 2',
      graded: 'Punkte',
      gradedTitle: 'Angehakt: Zelle zählt für die Punkte. Aus: wird nur geprüft und markiert (z. B. Hilfsfeld).',
      cellPoints: 'Punkte je Zelle einzeln festlegen',
      cellPointsTitle: 'An: jede bewertete Zelle bekommt eine eigene Punktzahl, die Gesamtpunktzahl ist deren Summe. Aus: „Punkte (gesamt)“ wird gleichmäßig verteilt.',
      pointsTitle: 'Punkte für diese Zelle',
      textPlaceholder: 'Text ($…$, {a} möglich)',
      formulaPlaceholder: 'Formel, z. B. a*b',
      tolPlaceholder: '± (leer = Standard)',
      answersPlaceholder: 'Antwort(en): a | b',
      addRow: 'Zeile hinzufügen',
      addCol: 'Spalte hinzufügen',
      removeRow: 'Zeile entfernen',
      removeCol: 'Spalte entfernen',
      hint: 'Typ oben pro Spalte wählen; links kann eine Zeile den Typ überschreiben. Text-Antworten: mehrere erlaubte Antworten mit | trennen. Auswahl: Optionen mit | trennen, die erste ist die richtige (wird gemischt angezeigt). „Punkte“ abwählen: Zelle wird geprüft, zählt aber nicht.'
    },
    choiceMatrix: {
      corner: 'Zeile / Spalte',
      rowPlaceholder: 'Zeile {n}',
      colPlaceholder: 'Spalte {n}',
      addRow: 'Zeile hinzufügen',
      addCol: 'Spalte hinzufügen',
      removeRow: 'Zeile entfernen',
      removeCol: 'Spalte entfernen',
      cellTitle: 'Angehakt = richtige Antwort',
      hint: 'Zeilen und Spalten benennen; angehakte Kästchen sind die richtigen Antworten.'
    },
    upload: {
      noFile: 'Keine Datei ausgewählt.',
      tooLarge: 'Datei ist zu groß ({size}). Maximum: {max}.',
      tooLargeVideoTip: 'Tipp: YouTube oder Vimeo unterstützen beliebig große Videos; einfach den Link einfügen.',
      notImage: 'Diese Datei ist kein Bild.',
      notImageWithType: 'Diese Datei ist kein Bild (Typ: {type}).',
      notAudio: 'Diese Datei ist keine Audiodatei.',
      notAudioWithType: 'Diese Datei ist keine Audiodatei (Typ: {type}).',
      notVideo: 'Diese Datei ist kein Video.',
      notVideoWithType: 'Diese Datei ist kein Video (Typ: {type}).',
      veryLargeVideoTip: 'Für sehr lange Videos kann ein YouTube-/Vimeo-Link sinnvoller sein.',
      veryLargeWarning: 'Sehr große Datei: der Auto-Save im Browser kann scheitern, d. h. bei Reload wäre die Datei weg. Der SCORM-Export funktioniert weiterhin.'
    },
    list: {
      itemLabel: 'Eintrag',
      empty: 'Noch keine Einträge.'
    },
    action: {
      default: 'Aktion'
    },
    color: {
      pickerAria: '{label} (Farbwähler)',
      hexAria: '{label} (Hex-Code)'
    },
    media: {
      readError: 'Datei konnte nicht gelesen werden.',
      urlPlaceholder: 'oder URL/Pfad eingeben',
      image: {
        clear: 'Bild entfernen',
        embedded: 'Bild eingebettet ({size})',
        keepOriginal: 'Original behalten (nicht verkleinern)',
        keepOriginalHelp: 'Für Detailbilder, in die hineingezoomt werden soll. Sonst werden große Bilder automatisch auf höchstens 2000 px verkleinert.',
        shrunk: 'Bild verkleinert: {from} → {to} ({w} × {h} px)'
      },
      audio: {
        clear: 'Audio entfernen',
        embedded: 'Audio eingebettet ({size})',
        urlPlaceholder: 'oder URL/Pfad eingeben (z. B. https://example.org/clip.mp3)'
      },
      video: {
        clear: 'Video entfernen',
        embedded: 'Video eingebettet ({size})',
        urlPlaceholder: 'YouTube-/Vimeo-Link oder direkte Video-URL (z. B. https://youtu.be/abc12345678)',
        embedDetected: '{provider}-Embed erkannt'
      },
      file: {
        clear: 'Datei entfernen',
        embedded: 'Datei eingebettet ({size})',
        previewEmbedded: '✓ Datei eingebettet ({size})',
        previewUrl: '✓ URL: {url}'
      }
    },
    math: {
      mathHint: 'Tipp: Formeln zwischen $ und $ schreiben, z. B. $\\frac{a}{b}$ · Variablen als {name}',
      delimBtnTitle: 'Formel-Umgebung einfügen',
      formulaHint: 'Verfügbar: sqrt, sin, cos, tan, log, exp, abs, floor, ceil, round, min, max, pow, atan2 · Konstanten: pi, e · Potenz: ^'
    },
    specialized: {
      zoneEditor: {
        uploadFirst: 'Lade zuerst ein Bild hoch (Feld oben), um Zonen zu markieren.',
        instructions: 'Klicke und ziehe auf dem Bild, um eine Zone zu markieren. Klicke eine Zone an, um sie zu löschen.',
        rectTitle: 'Zone {n}: klicken zum Löschen',
        listItem: 'Zone {n}: {w}×{h}% @ ({x}%, {y}%)',
        emptyZones: 'Noch keine Zonen markiert.'
      },
      unitPair: {
        defaultLabel: 'Umrechnungsaufgabe',
        inputPlaceholder: 'Eingabe',
        outputPlaceholder: 'Ausgabe',
        swapTitle: 'Eingabe und Ausgabe vertauschen',
        incompatible: 'Einheiten nicht kompatibel.',
        help: 'Rechts tippt man in Ausgabe, links wird rückwärts berechnet, und umgekehrt.'
      },
      unitFromTo: {
        randomOption: 'Zufällig  ({cat})',
        defaultLabel: 'Richtung',
        swapTitle: 'Von ↔ Nach vertauschen'
      }
    }
  },

  canvas: {
    snap: {
      edge: {
        left: 'links',
        right: 'rechts',
        centerX: 'Mitte X',
        top: 'oben',
        bottom: 'unten',
        centerY: 'Mitte Y',
        rightEdge: 'rechte Kante',
        bottomEdge: 'untere Kante'
      }
    }
  },

  tasks: {
    defaultTab: {
      visualization: 'Visualisierung',
      task: 'Aufgabe'
    },
    defaultNoteTitle: 'Hinweis',
    defaultTitle: 'Aufgabe',
    validation: {
      noTasks: 'Lerneinheit enthält keine Aufgaben.',
      emptyCourseTitle: 'Kurstitel ist leer.',
      shadowsGlobalVar: 'Variable „{name}“ überdeckt die gleichnamige globale Variable (in diesem Block gilt die Block-Variable).',
      globalVarNoName: 'Globale Variable {n}: Name fehlt.',
      globalVarBadName: 'Globale Variable „{name}“: Name darf nur Buchstaben (a-z, A-Z), Ziffern und Unterstrich enthalten.',
      globalVarDuplicate: 'Globale Variable „{name}“ ist mehrfach definiert.',
      globalVarRange: 'Globale Variable „{name}“: Min ({min}) ist größer als Max ({max}).',
      globalVarUnused: 'Globale Variable „{name}“ wird in keiner Aufgabe verwendet.',
      poolUnnamed: 'Pool {n}',
      poolEmpty: 'Aufgabenpool „{name}“ enthält keine Aufgaben.',
      poolDrawTooBig: 'Aufgabenpool „{name}“: Es sollen {draw} Aufgaben gezogen werden, er enthält aber nur {n}.'
    },
    toast: {
      saveTemplatesFailed: 'Vorlagen konnten nicht gespeichert werden: {msg}',
      saveBlockTemplatesFailed: 'Block-Vorlagen konnten nicht gespeichert werden: {msg}'
    },
    defaultTemplateLabel: 'Eigene Vorlage'
  },

  util: {
    confirmDialog: {
      fallbackMessage: 'OK?'
    }
  },

  folder: {
    toast: {
      opened: 'Ordner „{name}" geöffnet.',
      openFailed: 'Ordner konnte nicht geöffnet werden: {msg}',
      fileReadFailed: 'Datei konnte nicht gelesen werden.',
      loadFailed: 'Fehler beim Laden: {msg}'
    },
    close: {
      title: 'Ordner schließen (vergisst den Pfad)',
      ariaLabel: 'Ordner schließen'
    },
    hint: {
      click: 'Datei klicken zum Laden. Bleibt offen, bis Sie woanders klicken.',
      readOnly: 'Read-only (Browser ohne File-System-API).'
    }
  },

  blockHelp: {
    common: {
      graded: 'Unten im Einstellungsbereich hat jeder bewertete Block außerdem: „Antwort nach Prüfen sperren“, ein Zeitlimit sowie „Versuche, Hinweis & Lösungsweg“. „Wie Lerneinheit“ übernimmt die Einstellung aus den Kopfdaten.'
    },
    heading: {
      summary: 'Überschrift zur Gliederung einer Aufgabe.',
      steps: {
        1: 'Text eintragen.',
        2: 'Größe wählen: Groß (h2, Standard), Mittel (h3) oder Klein (h4).'
      }
    },
    richText: {
      summary: 'Fließtext mit Formatierungen (fett, kursiv, Listen, Links) und Formeln.',
      steps: {
        1: 'Inhalt eintragen; HTML ist erlaubt.',
        2: 'Formeln zwischen <code>$…$</code> setzen, z. B. <code>$a^2 + b^2 = c^2$</code>.'
      },
      tips: {
        1: 'Platzhalter wie <code>{a}</code> werden hier nicht durch Werte ersetzt. Für Texte mit Zufallswerten den Aufgabentext eines Frageblocks verwenden.'
      }
    },
    noteBox: {
      summary: 'Farbiger Hinweiskasten, um Wichtiges vom Text abzuheben.',
      steps: {
        1: 'Stil wählen: Info (grün), Warnung (gelb) oder Tipp (blau).',
        2: 'Titel und Inhalt eintragen; HTML und Formeln sind erlaubt.'
      }
    },
    image: {
      summary: 'Bild mit Alternativtext und optionaler Bildunterschrift; wird ins SCORM-Paket eingebettet.',
      steps: {
        1: 'Datei hochladen, eine URL eintragen oder das Bild direkt auf die Zeichenfläche ziehen.',
        2: 'Alternativtext für Screenreader eintragen.'
      },
      tips: {
        1: 'Große Fotos werden beim Hochladen automatisch auf höchstens 2000 px verkleinert. Abschalten: in den Kopfdaten unter „Bilder“ oder per „Original behalten“ am Bildfeld.',
        2: '„Breite“ nimmt CSS-Werte wie <code>400px</code>, <code>60%</code> oder <code>auto</code>.'
      }
    },
    audio: {
      summary: 'Audio-Player mit den Bedienelementen des Browsers.',
      steps: {
        1: 'Audiodatei hochladen (mp3, ogg, wav) oder eine URL eintragen.',
        2: 'Optional Titel und Bildunterschrift eintragen.'
      },
      tips: {
        1: 'Hochgeladene Dateien werden ins ZIP eingebettet und vergrößern es entsprechend.'
      }
    },
    video: {
      summary: 'Video-Player für eigene Dateien oder YouTube/Vimeo.',
      steps: {
        1: 'Datei hochladen (mp4 empfohlen) oder einen YouTube-/Vimeo-Link einfügen; das Format wird automatisch erkannt.',
        2: 'Bei eigenen Dateien optional ein Vorschaubild festlegen.'
      },
      tips: {
        1: 'Eigene Videos stecken im ZIP und machen es groß. YouTube/Vimeo nicht, sie brauchen beim Abspielen aber Internetzugang.'
      }
    },
    fileDownload: {
      summary: 'Datei zum Herunterladen, z. B. PDF, Arbeitsblatt oder Code-Beispiel.',
      steps: {
        1: 'Datei hochladen oder eine URL eintragen.',
        2: 'Anzeigenamen und optional eine Beschreibung eintragen.'
      }
    },
    summary: {
      summary: 'Zusammenfassung mit Überschrift und Stichpunkten, z. B. als Abschluss einer Lerneinheit.',
      steps: {
        1: 'Überschrift eintragen.',
        2: 'Pro Stichpunkt eine Kernaussage (wird fett) und optional eine Erläuterung eintragen.'
      }
    },
    survey: {
      summary: 'Umfrage ohne Bewertung: Sternebewertung, Einfachauswahl oder Freitext.',
      steps: {
        1: 'Fragen anlegen und für jede den Fragetyp wählen.',
        2: 'Bei Einfachauswahl die Antwortoptionen eintragen, eine pro Zeile.'
      },
      tips: {
        1: 'Zählt nicht zu den Punkten. Gut für Selbsteinschätzungen am Anfang oder Ende einer Einheit.'
      }
    },
    divider: {
      summary: 'Horizontale Trennlinie zwischen Abschnitten.',
      steps: {
        1: 'Einfach platzieren; es gibt keine Einstellungen.'
      }
    },
    code: {
      summary: 'Quellcode in Schrift mit fester Breite; Einrückungen bleiben erhalten.',
      steps: {
        1: 'Optional Titel und Sprache eintragen; beides erscheint als Beschriftung über dem Code.',
        2: 'Code in das Textfeld einfügen.'
      }
    },
    multipleChoice: {
      summary: 'Frage mit einer oder mehreren richtigen Antworten; Antworten als Text, Bild oder beides.',
      steps: {
        1: 'Frage formulieren.',
        2: 'Antworten anlegen und die richtigen mit „Ist richtig“ markieren.',
        3: 'Für mehrere richtige Antworten „Mehrfachauswahl erlauben“ einschalten.'
      },
      tips: {
        1: 'Teilpunkte: Jede richtige Auswahl bringt Punkte ÷ Anzahl richtiger Antworten. „Falsche Auswahl abziehen“ zieht pro falschem Kreuz ab; die Punktzahl fällt nie unter 0.',
        2: '„Anzahl auswählbarer Antworten begrenzen“ sperrt weitere Kästchen, sobald das Maximum erreicht ist.',
        3: '„Antworten mischen“ ordnet die Antworten in jedem Durchlauf neu an.'
      }
    },
    numericInput: {
      summary: 'Rechenaufgabe mit Zufallsvariablen; die richtige Lösung berechnet eine Formel.',
      steps: {
        1: 'Frage-Vorlage mit Platzhaltern wie <code>{a}</code> schreiben (KaTeX möglich).',
        2: 'Variablen mit Bereich anlegen (von, bis, ganzzahlig oder Nachkommastellen).',
        3: 'Lösungs-Formel eintragen, z. B. <code>a*b</code> oder <code>sqrt(a^2+b^2)</code>, und die Toleranz festlegen.'
      },
      tips: {
        1: '„Weitere Antwortfelder“: mehrere Ergebnisse mit eigener Formel, Bezeichnung (z. B. „x =“) und Einheit; Teilpunkte pro Feld.',
        2: '„Nur ganzzahlige Lösungen“ zieht nur Werte mit ganzzahligem Ergebnis. „Unlösbare Aufgaben zulassen“: Hat die Formel kein Ergebnis, ist „X“ die richtige Antwort.',
        3: 'Winkel in Formeln sind standardmäßig in Grad (<code>sin(30)</code> = 0,5); auf Bogenmaß umstellbar.',
        4: '„Term vereinfachen“: Brüche müssen gekürzt eingegeben werden.',
        5: 'Globale Variablen aus den Kopfdaten lassen sich wie eigene verwenden.'
      }
    },
    textInput: {
      summary: 'Freie Textantwort; die Auswertungsart bestimmt, wie streng verglichen wird.',
      steps: {
        1: 'Frage formulieren.',
        2: 'Akzeptierte Antworten eintragen.',
        3: 'Auswertungsart wählen.'
      },
      tips: {
        1: '„Exakt“ (Standard) ignoriert Groß-/Kleinschreibung. „Manuell“ wählt die Vergleichsart pro Eintrag.',
        2: '„Regulärer Ausdruck“ für Muster wie <code>\\d{4}</code> (vierstellige Zahl).',
        3: '„Schlüsselwörter“ gibt Teilpunkte für jeden gefundenen Begriff.'
      }
    },
    cloze: {
      summary: 'Lückentext mit Eingabefeldern oder Auswahllisten.',
      steps: {
        1: 'Text mit Lücken schreiben.',
        2: 'Lücken einbauen: <code>{{Antwort}}</code> Eingabefeld, <code>{{a|b}}</code> Eingabefeld mit mehreren richtigen Schreibweisen, <code>{{=richtig|falsch1|falsch2}}</code> Auswahlliste (erste Option ist richtig).'
      },
      tips: {
        1: '„Groß-/Kleinschreibung ignorieren“ wertet „berlin“ wie „Berlin“.',
        2: '„Dropdown-Optionen mischen“ ändert die Reihenfolge in den Auswahllisten.',
        3: 'Punkte werden anteilig pro richtiger Lücke vergeben.'
      }
    },
    matchPairs: {
      summary: 'Zuordnung per Ziehen oder Antippen: 1 zu 1 oder Kategorisierung.',
      steps: {
        1: 'Modus wählen.',
        2: '1 zu 1: Paare mit linker und rechter Seite eintragen (Text, Bild oder beides).',
        3: 'Kategorisierung: Kategorien mit ID anlegen, dann Elemente mit „Zugehörige Kategorie-ID(s)“ zuordnen.'
      },
      tips: {
        1: 'Ein Element kann zu mehreren Kategorien gehören: IDs mit Komma trennen. Gleich aussehende Elemente sind untereinander austauschbar.',
        2: 'Statt Ziehen geht auch Antippen: erst das Element, dann das Ziel. Praktisch auf Tablets und bei langen Listen.',
        3: '„Anzahl Aufgaben pro Durchlauf“ zieht eine Auswahl; Punkte werden anteilig vergeben (3 von 4 richtig = 75 %).'
      }
    },
    hotzone: {
      summary: 'Bildaufgabe: Lernende klicken die richtigen Bereiche eines Bildes an.',
      steps: {
        1: 'Bild hochladen.',
        2: 'Mit „Hotzonen einzeichnen“ Rechtecke über die richtigen Bereiche ziehen.'
      },
      tips: {
        1: 'Punkte anteilig pro gefundener Zone; „Punkte für falsche Antworten abziehen“ wertet Fehlklicks.',
        2: 'Zonen werden relativ zum Bild gespeichert und passen auch bei anderer Bildgröße.',
        3: 'Optional zeigt die Korrektur nicht gefundene Zonen an.'
      }
    },
    sortList: {
      summary: 'Sortierliste: Elemente per Ziehen in die richtige Reihenfolge bringen.',
      steps: {
        1: 'Aufgabentext eintragen.',
        2: 'Items in der richtigen Reihenfolge anlegen; angezeigt werden sie gemischt.'
      },
      tips: {
        1: 'Punkte anteilig: Anteil der Items an der richtigen Position × Punkte.',
        2: 'Formeln (<code>$…$</code>) in den Items sind möglich.'
      }
    },
    complexQuestion: {
      summary: 'Komplexe Zahl aus der Gaußschen Zahlenebene ablesen.',
      steps: {
        1: 'Aufgaben-Pool mit Real- und Imaginärteil anlegen.',
        2: 'Festlegen, was gefragt wird (kartesisch, polar, beides oder konjugiert), und Toleranzen setzen.'
      },
      tips: {
        1: '„Zufällig wählen“ nimmt in jedem Durchlauf eine Zahl aus dem Pool.'
      }
    },
    functionQuestion: {
      summary: 'Funktionsgraph mit Frage zu Funktionswerten, Nullstellen, Schnittpunkten oder Extrema.',
      steps: {
        1: 'Funktion eingeben, z. B. <code>x^2 - 3</code> oder <code>sin(x)</code>.',
        2: 'Festlegen, was gefragt wird: Funktionswert, Nullstellen, y-Achsenabschnitt, Extrempunkte oder eigene Frage.',
        3: 'Sichtbaren Bereich (x/y) festlegen.'
      },
      tips: {
        1: 'Bei mehreren Nullstellen werden alle erwartet; die Reihenfolge ist egal.',
        2: 'Extrempunkte werden als (x; y) eingegeben.'
      }
    },
    vectorQuestion: {
      summary: 'Vektor aus einem 2D-Plot ablesen: Komponenten, Betrag, Winkel oder Einheitsvektor.',
      steps: {
        1: 'Vektor-Pool anlegen.',
        2: 'Festlegen, was gefragt wird.',
        3: 'Winkeleinheit wählen (Grad oder Radiant) und Toleranzen setzen.'
      }
    },
    numberBase: {
      summary: 'Umrechnung zwischen Binär-, Oktal-, Dezimal- und Hexadezimalsystem.',
      steps: {
        1: 'Umrechnungs-Preset wählen oder eigene Richtungen festlegen.',
        2: 'Wertebereich (dezimal) angeben.'
      },
      tips: {
        1: 'Hex-Antworten werden ohne Rücksicht auf Groß-/Kleinschreibung geprüft; das Präfix <code>0x</code> ist erlaubt.'
      }
    },
    unitConvert: {
      summary: 'Einheiten umrechnen: Länge, Zeit, Masse, Geschwindigkeit, Energie, Druck, Temperatur und mehr.',
      steps: {
        1: 'Umrechnungen anlegen: Richtung (von → nach) und Wertebereich.',
        2: 'Frage-Vorlage mit <code>{value}</code>, <code>{fromUnit}</code> und <code>{toUnit}</code> schreiben.'
      },
      tips: {
        1: 'Die Toleranz ist relativ: 0,01 bedeutet 1 % Abweichung.',
        2: 'Komma und Punkt werden als Dezimaltrennzeichen akzeptiert.',
        3: '„Richtung zufällig vertauschen“ fragt auch rückwärts.'
      }
    },
    truthTable: {
      summary: 'Boolesche Wahrheitstabelle: Lernende füllen die Ergebnisspalte aus.',
      steps: {
        1: 'Ausdruck eingeben, z. B. <code>a and b</code> oder <code>not (a or b)</code>.',
        2: 'Variablennamen mit Komma getrennt eintragen.'
      },
      tips: {
        1: 'Erlaubte Operatoren: and, or, not, xor (sowie &&, ||, !).',
        2: 'Punkte anteilig pro richtiger Zeile; optional Abzug für falsche Zeilen. N Variablen ergeben 2^N Zeilen.'
      }
    },
    table: {
      summary: 'Tabelle in vier Arten: Wertetabelle, Richtig/Falsch-Aussagen, Auswahl-Matrix oder Freie Tabelle.',
      steps: {
        1: '„Art der Tabelle“ wählen.',
        2: 'Wertetabelle: Variablen und Spalten (Zufallswert, Formel, Text oder Antwortspalte) anlegen und die Zeilenzahl festlegen.',
        3: 'Richtig/Falsch: Aussagen eintragen und für jede richtig oder falsch wählen.',
        4: 'Auswahl-Matrix: Zeilen und Spalten anlegen und die richtigen Kreuze im Raster setzen.',
        5: 'Freie Tabelle: Zeilen und Spalten frei anlegen; jede Zelle ist Text, Zahl-Antwort (mit Formel), Text-Antwort oder Auswahlliste.'
      },
      tips: {
        1: 'Wertetabelle: Formeln rechnen mit den Werten derselben Zeile; jede Zeile wird neu gezogen.',
        2: 'Freie Tabelle: Mit „Punkte“ an der Zelle legst du fest, ob sie zählt; „Punkte je Zelle einzeln festlegen“ gibt jeder Zelle eigene Punkte.',
        3: 'Bei Richtig/Falsch, Matrix und Freier Tabelle können falsche Antworten Punkte abziehen.'
      }
    },
    equationSystem: {
      summary: 'Lineares Gleichungssystem mit 2 oder 3 Variablen, zufällig erzeugt oder mit eigenen Varianten.',
      steps: {
        1: 'Modus wählen: zufällige Werte oder eigene Varianten.',
        2: 'Zufällig: Variablen sowie Koeffizienten- und Lösungsbereich festlegen.',
        3: 'Eigene Varianten: Gleichungen direkt eingeben, z. B. <code>2x + y = 5</code>.'
      },
      tips: {
        1: 'Eigene Varianten werden live geprüft; ein nicht eindeutig lösbares System wird gemeldet.',
        2: 'Punkte werden anteilig pro richtig gelöster Variable vergeben.'
      }
    },
    functionSandbox: {
      summary: 'Interaktiver Funktionsplot zum Erkunden: Lernende verschieben Regler und sehen die Wirkung sofort.',
      steps: {
        1: 'Funktion mit Parametern eintragen.',
        2: 'Regler mit Bereich, Schrittweite und Startwert anlegen.',
        3: 'Sichtbaren x/y-Bereich festlegen.'
      },
      tips: {
        1: 'Keine Bewertung, reines Lernwerkzeug. Ergänzt eine Funktionsfrage gut.'
      }
    },
    composition: {
      summary: 'Zeichenfläche für eigene Skizzen und Konstruktionen, optional mit Antwortfeldern, Ja/Nein-Feldern, Klick- oder Hotspot-Aufgabe.',
      steps: {
        1: 'Vorlage einfügen oder Formen über die Werkzeugleiste hinzufügen.',
        2: 'Beschriftungen per Doppelklick bearbeiten: <code>{a}</code> für Variablen, <code>{1}</code> für Antwortfelder; Formeln und Formatierung (B, I, x²) sind möglich.',
        3: 'Bewertungsart wählen; bei „Mit Lösung“ über „Formel ▾“ die Lösung jedes Antwortfelds festlegen.'
      },
      tips: {
        1: 'Im Textfeld-Editor: Enter speichert, Shift+Enter erzeugt eine neue Zeile, darunter erscheint eine Live-Vorschau.',
        2: '<code>{1*}</code> zeigt die Antwort aus Feld 1 an und lässt sich in späteren Formeln weiterverwenden.',
        3: 'Ein Ja/Nein-Feld kommt über die Werkzeugleiste dazu; richtige Antwort und Punkte stellst du bei der Form ein.'
      }
    },
    complexInput: {
      summary: 'Komplexe Zahl als Antwort; aufgebaut wie die Numerische Eingabe, aber mit komplexen Zahlen.',
      steps: {
        1: 'Frage-Vorlage schreiben, z. B. <code>Berechne $({a} + {b}i)({c} - {d}i)$</code>.',
        2: 'Reelle Variablen mit Bereichen anlegen.',
        3: 'Lösungs-Formel eintragen, z. B. <code>(a + b*i) * (c - d*i)</code>.'
      },
      tips: {
        1: 'Eingabeformate für Lernende: <code>3+4i</code>, <code>-i</code>, <code>1/2+3/4i</code>.',
        2: '„Nur ganzzahlige Lösungen“: Real- und Imaginärteil der Lösung sind ganzzahlig.'
      }
    }
  },

  taskTemplates: {
    category: {
      content: 'Inhalt',
      question: 'Frage',
      math: 'Mathematik',
      cs: 'Informatik'
    },
    emptyContent: {
      label: 'Inhaltsseite',
      description: 'Überschrift + Text + Bild, gut zum Erklären ohne Frage.'
    },
    mcSimple: {
      label: 'Multiple Choice, kurz',
      description: 'Eine Frage mit mehreren Antwortoptionen.'
    },
    numericClassic: {
      label: 'Numerische Berechnung',
      description: 'Aufgabentext + Variablen + Lösungs-Formel.'
    },
    cloze: {
      label: 'Lückentext',
      description: 'Text mit Lücken {{antwort}} zum Ausfüllen.'
    },
    match: {
      label: 'Begriffe zuordnen',
      description: 'Drag & Drop oder Klick, linke Begriffe zu rechten Antworten verbinden.'
    },
    textInput: {
      label: 'Text-Antwort',
      description: 'Frage mit freier Text-Antwort (exakt oder Regex).'
    },
    complex: {
      label: 'Komplexe Zahlen: Aufgabe',
      description: 'Intro + Hinweis + Re/Im/|z|/φ aus dem Plot ablesen.'
    },
    function: {
      label: 'Funktion ablesen',
      description: 'Funktion plotten und Funktionswerte, Nullstellen oder Extrempunkte ablesen lassen.'
    },
    vector: {
      label: 'Vektor 2D ablesen',
      description: 'Komponenten / Betrag / Winkel eines Vektors aus dem Plot ablesen.'
    },
    truthTable: {
      label: 'Wahrheitstabelle',
      description: 'Booleschen Ausdruck, Wahrheitstabelle ausfüllen.'
    },
    baseConversion: {
      label: 'Zahlensystem-Umrechnung',
      description: 'Umrechnung zwischen Binär / Dezimal / Hex / Oktal.'
    }
  },

  mathToolbar: {
    categories: {
      fractions: 'Brüche',
      roots: 'Wurzeln',
      exponents: 'Potenzen',
      greek: 'Griechisch',
      operators: 'Operatoren',
      functions: 'Funktionen',
      sets: 'Mengen',
      brackets: 'Klammern'
    },
    tips: {
      fraction: 'Bruch',
      squareRoot: 'Quadratwurzel',
      cubeRoot: 'Kubikwurzel',
      nthRoot: 'n-te Wurzel',
      superscript: 'Hochstellen',
      subscript: 'Tiefstellen',
      sum: 'Summe',
      product: 'Produkt',
      integral: 'Integral',
      vector: 'Vektor',
      roundBrackets: 'runde Klammern',
      squareBrackets: 'eckige Klammern',
      absoluteValue: 'Betrag',
      curlyBrackets: 'geschweifte Klammern'
    }
  },

  html: {
    docTitle: 'SCORM Builder | Umwelt-Campus Birkenfeld',
    header: {
      sidebarToggleAria: 'Aufgabenleiste ein-/ausblenden',
      loadZipHintAlt: '.zip aus früherem Export öffnen',
      exportJsonHintAlt: 'Roh-Konfiguration herunterladen',
      cheatsheetAria: 'Tastaturkürzel anzeigen'
    },
    sidebar: {
      welcomeAndHelp: 'Willkommen / Hilfe'
    },
    jsonPane: {
      hint: 'Das gesamte Paket als JSON bearbeiten. Gültiges JSON wird sofort übernommen.'
    },
    footer: {
      tagline: 'SCORM 1.2 · nur im Browser · läuft offline · Stand 2026'
    },
    modal: {
      blockPicker: {
        searchPlaceholder: 'Block-Typ suchen (z. B. Bild, Frage, Code)',
        categoriesAria: 'Kategorien'
      },
      taskCreate: {
        title: 'Neue Aufgabe',
        emptyTitle: 'Leere Aufgabe',
        emptyHint: 'Blöcke frei zusammenstellen',
        orTemplate: 'oder Vorlage wählen'
      },
      saveTemplate: {
        hint: 'Vorlagen werden lokal in Ihrem Browser gespeichert (localStorage) und stehen für künftige SCORM-Pakete zur Verfügung.',
        nameLabel: 'Name der Vorlage',
        categoryLabel: 'Kategorie',
        categoryPlaceholder: 'z. B. Mathematik'
      }
    },
    cheatsheet: {
      general: {
        toggle: 'Diese Übersicht ein-/ausblenden',
        save: 'Sofort speichern (Autosave-Flush)',
        exportZip: 'SCORM-ZIP exportieren',
        undo: 'Rückgängig',
        redo: 'Wiederherstellen',
        redoAlt: 'Wiederherstellen (alternativ)'
      },
      canvas: {
        heading: 'Aufgaben-Canvas',
        move1: 'Markierte Blöcke 1 px verschieben',
        arrowLabel: 'Pfeil',
        move10: 'Blöcke 10 px verschieben',
        selectAll: 'Alle Blöcke markieren',
        copy: 'Markierte Blöcke kopieren',
        paste: 'Blöcke einfügen',
        duplicate: 'Blöcke duplizieren',
        delete: 'Markierte Blöcke löschen',
        deselect: 'Auswahl aufheben'
      },
      composition: {
        heading: 'Komposition (innerhalb des Editors)',
        moveTool: 'Verschieben-Werkzeug',
        selectTool: 'Auswahl-Werkzeug (Rahmen aufziehen)',
        move1: 'Form 1 px verschieben',
        move10: 'Form 10 px verschieben',
        dragCorner: 'Ziehen an Eckpunkt',
        scaleProportional: 'Proportional skalieren (Ellipse, Rechteck, Polygon)',
        duplicate: 'Form duplizieren',
        copy: 'Form in Komposition-Clipboard kopieren',
        paste: 'Form aus Clipboard einfügen',
        selectAll: 'Alle Formen markieren',
        delete: 'Markierte Formen löschen',
        undo: 'Innerhalb der Komposition rückgängig'
      },
      footTip: 'Tipp: <kbd>?</kbd> öffnet diese Übersicht jederzeit'
    }
  }
};

if(typeof window !== 'undefined'){
  window.__scormI18n_de = de;
}
export default de;
