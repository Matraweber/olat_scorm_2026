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
          label: 'Nach Korrektur sperren',
          help: 'Nach dem ersten Prüfen kann keine neue Aufgabe mehr generiert werden.'
        },
        hideRegenerate: {
          label: 'Neu-Generieren ausblenden',
          help: 'Kein „Neu generieren"-Knopf; die erste Zufallsaufgabe muss gelöst werden.'
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
        body: 'Unten rechts an jedem Block die Ecke ziehen, oder den Knopf „Höhe an Inhalt anpassen" verwenden.'
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
        body: 'Pro Aufgabe können zwei Tabs aktiviert werden, beispielsweise „Visualisierung" und „Aufgabe".'
      },
      tipTemplates: {
        title: 'Vorlagen speichern',
        body: 'Eine fertige Aufgabe als Vorlage speichern („Vorlage" im Aufgaben-Header). Sie steht beim nächsten Mal sofort zur Verfügung.'
      }
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
    gradedBadge: 'gewertet',
    deleteTemplateAction: 'Vorlage löschen',
    deleteBlockTemplateTitle: 'Block-Vorlage löschen?',
    deleteBlockTemplateMessage: '„{name}" wird endgültig aus den eigenen Block-Vorlagen entfernt.',
    noBlockMatch: 'Kein Block-Typ entspricht „{query}".'
  },

  taskPane: {
    taskLabel: 'Aufgabe {n}',
    titlePlaceholder: 'Titel der Aufgabe (in der Navigation sichtbar)',
    addBlock: '+ Block',
    addBlockTitle: 'Block hinzufügen',
    saveTemplate: '★ Vorlage',
    saveTemplateTitle: 'Aufgabe als Vorlage speichern',
    tabsDisable: 'Tabs deaktivieren',
    tabsEnable: '+ Tabs aktivieren',
    tabsDisableTitle: 'Tabs entfernen (nur Tab 1 wird behalten)',
    tabsEnableTitle: '2 Tabs aktivieren: Visualisierung + Aufgabe',
    tabsDisableConfirmTitle: 'Tabs deaktivieren?',
    tabsDisableConfirmMessageSingular: 'Tab 2 enthält {n} Block. Beim Deaktivieren gehen diese verloren.',
    tabsDisableConfirmMessagePlural: 'Tab 2 enthält {n} Blöcke. Beim Deaktivieren gehen diese verloren.',
    tabsDisableConfirmLabel: 'Deaktivieren',
    zoomOutTitle: 'Verkleinern (Strg + Mausrad)',
    zoomInTitle: 'Vergrößern (Strg + Mausrad)',
    zoomResetTitle: 'Zoom 100%',
    tabSwitchTitle: 'Tab wechseln',
    tabFallbackTitle: 'Tab {n}',
    dropRejectedSingular: 'Datei ignoriert: nur Bilddateien können auf die Canvas gezogen werden.',
    dropRejectedPlural: '{n} Dateien ignoriert: nur Bilddateien können auf die Canvas gezogen werden.',
    fileValidationError: '„{name}": {error}',
    fileReadError: '„{name}" konnte nicht gelesen werden.',
    imageAddedSingular: 'Bild als Block hinzugefügt.',
    imageAddedPlural: '{n} Bilder als Blöcke hinzugefügt.',
    canvas: {
      gradedSuffix: ' · gewertet',
      fitHeightTitle: 'Höhe an Inhalt anpassen',
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
        noSchema: 'Dieser Block hat keine Konfiguration.'
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
        embedded: 'Bild eingebettet ({size})'
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
      emptyCourseTitle: 'Kurstitel ist leer.'
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
    heading: {
      summary: 'Überschrift. Strukturiert die Aufgabe und gibt thematische Kapitel an.',
      steps: {
        1: 'Text in das Feld eintragen.',
        2: 'Größe nach Bedarf wählen (H2 ist Standard für Unterabschnitte).'
      }
    },
    richText: {
      summary: 'Fließtext mit einfachen Formatierungen (Fett, Kursiv, Listen, Links).',
      steps: {
        1: 'Inhalt in den Editor schreiben.',
        2: 'Formatierungs-Toolbar oben für Hervorhebungen verwenden.'
      },
      tips: {
        1: 'Für Formeln innerhalb des Textes Dollarzeichen wie in LaTeX nutzen, z. B. $a^2 + b^2 = c^2$.'
      }
    },
    noteBox: {
      summary: 'Farbig hinterlegter Hinweis-Kasten, um wichtige Punkte vom Fließtext abzuheben.',
      steps: {
        1: 'Stil wählen: Info, Warnung, Tipp oder Definition.',
        2: 'Text eintragen.'
      }
    },
    image: {
      summary: 'Eingebettetes Bild. Wird als Data-URL ins SCORM-Paket aufgenommen.',
      steps: {
        1: 'Datei auswählen oder per Drag-and-Drop auf die Canvas ziehen.',
        2: 'Alt-Text für Barrierefreiheit eintragen.'
      },
      tips: {
        1: 'Bilder über 2 MB sollten vorher komprimiert werden, sonst wächst das ZIP unnötig.'
      }
    },
    audio: {
      summary: 'Audio-Player mit Standard-Browser-Controls.',
      steps: {
        1: 'Audio-Datei hochladen (mp3, ogg, wav).',
        2: 'Optional: Beschriftung eintragen.'
      }
    },
    video: {
      summary: 'Video-Player. Lokale Datei oder YouTube/Vimeo-Embed.',
      steps: {
        1: 'Bei lokalem Video: Datei hochladen (mp4 empfohlen).',
        2: 'Bei YouTube/Vimeo: kompletten Link einfügen, der Builder erkennt das Format automatisch.'
      },
      tips: {
        1: 'Lokale Videos über 10 MB blähen das SCORM-ZIP stark auf. YouTube/Vimeo-Links sind in der Größe unbegrenzt.'
      }
    },
    fileDownload: {
      summary: 'Liste herunterladbarer Dateien (PDFs, Arbeitsblätter, Code-Beispiele).',
      steps: {
        1: 'Pro Datei eine Zeile anlegen, Datei hochladen, Beschriftung eintragen.'
      }
    },
    divider: {
      summary: 'Horizontale Trennlinie als visueller Abschnittsabschluss.',
      steps: {
        1: 'Einfach platzieren. Keine weitere Konfiguration.'
      }
    },
    code: {
      summary: 'Quellcode-Block mit Syntax-Hervorhebung.',
      steps: {
        1: 'Sprache wählen.',
        2: 'Code in das Textfeld einfügen, Einrückung bleibt erhalten.'
      }
    },
    summary: {
      summary: 'Zusammenfassungs-Block mit Titel und Stichpunkten. Eignet sich für Schluss-Kapitel.',
      steps: {
        1: 'Titel angeben.',
        2: 'Pro Punkt eine Überschrift und einen Erklärungstext eintragen.'
      }
    },
    survey: {
      summary: 'Unbenotete Umfrage. Wird beim Lernenden angezeigt, fließt aber nicht in die Punkte ein.',
      steps: {
        1: 'Frage formulieren.',
        2: 'Antwortoptionen anlegen. Keine Markierung als richtig oder falsch.'
      },
      tips: {
        1: 'Sinnvoll für Selbsteinschätzungen oder Stimmungsabfragen am Anfang oder Ende einer Einheit.'
      }
    },
    multipleChoice: {
      summary: 'Multiple-Choice-Frage mit einer oder mehreren richtigen Antworten.',
      steps: {
        1: 'Frage formulieren.',
        2: 'Antwortoptionen anlegen, richtige mit Häkchen markieren.'
      },
      tips: {
        1: 'Bei mehreren richtigen Antworten gibt es automatisch Teilpunkte (z. B. 1 von 2 richtigen Antworten = 50 %).',
        2: 'Optionen werden für jeden Lernenden gemischt angezeigt.',
        3: '„Falsche bestrafen" zieht für jede falsche Auswahl Punkte ab.'
      }
    },
    cloze: {
      summary: 'Lückentext: Wörter im Fließtext werden durch Eingabefelder oder Dropdowns ersetzt.',
      steps: {
        1: 'Text mit Lücken in die Vorlage schreiben.',
        2: 'Lücke einbauen: <code>{{Antwort}}</code> für freie Eingabe, <code>{{a|b|c}}</code> für Alternativen, <code>{{=richtig|falsch1|falsch2}}</code> für Dropdown.'
      },
      tips: {
        1: '„Groß/Klein ignorieren" lässt zu, dass „berlin" als „Berlin" gewertet wird.',
        2: 'Mehrere richtige Schreibweisen mit | trennen, z. B. <code>{{Hund|dog|chien}}</code>.'
      }
    },
    textInput: {
      summary: 'Frei einzugebende Text-Antwort. Vergleichsmodus regelt die Strenge.',
      steps: {
        1: 'Frage formulieren.',
        2: 'Richtige Antworten eintragen.',
        3: 'Vergleichsmodus wählen.'
      },
      tips: {
        1: '„Groß/Klein ignorieren" ist Standard. „Genau" nur bei Code oder kontextsensitiven Schreibweisen.',
        2: '„Regex" für Muster wie <code>\\d{4}</code> (Jahreszahl).',
        3: '„Stichworte" gibt Teilpunkte für jedes gefundene Stichwort.'
      }
    },
    matchPairs: {
      summary: 'Zuordnung per Drag-and-Drop. 1:1 für klassische Paare, Kategorisierung für mehrere Begriffe pro Kategorie.',
      steps: {
        1: 'Modus wählen: Paare oder Kategorisierung.',
        2: 'Bei Paaren: links und rechts paarweise eintragen.',
        3: 'Bei Kategorisierung: Kategorien anlegen, dann Begriffe der jeweiligen Kategorie zuordnen.'
      },
      tips: {
        1: 'Bilder und Text lassen sich mischen. Bilder über 1 MB komprimieren.',
        2: 'Punkte werden anteilig vergeben: 3 von 4 richtigen Zuordnungen = 75 %.'
      }
    },
    sortList: {
      summary: 'Sortierliste: Lernender bringt Begriffe per Drag-and-Drop in die richtige Reihenfolge.',
      steps: {
        1: 'Elemente in der korrekten Reihenfolge eintragen.',
        2: 'Der Lernende sieht sie gemischt und muss sie sortieren.'
      },
      tips: {
        1: 'Punkte pro Element in korrekter Position. Bei 4 Elementen und 2 korrekt = 2 Punkte.'
      }
    },
    hotzone: {
      summary: 'Klick-auf-Bild-Aufgabe. Der Lernende klickt richtige Bereiche im Bild an.',
      steps: {
        1: 'Bild hochladen.',
        2: 'Rechteckige Zonen über die richtigen Bildbereiche legen.'
      },
      tips: {
        1: 'Zonen-Koordinaten sind normiert (0 bis 1). Bei Bildwechsel mit gleichem Seitenverhältnis bleiben sie gültig.',
        2: 'Mehrere Zonen pro Bild möglich; Punkte werden anteilig vergeben.'
      }
    },
    numericInput: {
      summary: 'Numerische Eingabe mit Toleranz, Variablen und automatisch generierter Aufgabe.',
      steps: {
        1: 'Frage-Vorlage mit Platzhaltern wie <code>{a}</code> formulieren.',
        2: 'Variablen mit Min/Max-Bereich anlegen.',
        3: 'Lösungs-Formel eintragen, z. B. <code>a*b</code> oder <code>sqrt(a^2+b^2)</code>.'
      },
      tips: {
        1: 'Bei jedem „Neu generieren" zieht der Builder neue Werte aus den Variablenbereichen.',
        2: 'Toleranz definiert die akzeptierte Abweichung vom Sollwert.',
        3: 'Mit „Term vereinfachen" wird die Antwort als gekürzter Bruch erwartet.'
      }
    },
    unitConvert: {
      summary: 'Einheiten-Umrechnung (Länge, Zeit, Masse, Geschwindigkeit, Energie, etc.).',
      steps: {
        1: 'Größenart wählen (z. B. Länge).',
        2: 'Quell- und Ziel-Einheiten festlegen.',
        3: 'Wertebereich definieren.'
      },
      tips: {
        1: 'Bei „Mit Bruch" sind auch gebrochene Zahlen als Antwort zulässig.',
        2: 'Dezimaltrennzeichen ist Komma; der Builder akzeptiert aber auch Punkt.'
      }
    },
    table: {
      summary: 'Tabelle mit variablen Spalten und Eingabefeldern. Für mehrere Berechnungen in einer Aufgabe.',
      steps: {
        1: 'Spalten anlegen, pro Spalte Typ wählen: Zufallswert, Formel oder Freitext-Eingabe.',
        2: 'Zeilenanzahl und Variablenbereich festlegen.'
      },
      tips: {
        1: 'Formel-Spalten verwenden die Werte der vorherigen Spalten in derselben Zeile.',
        2: 'Schrittweiten bestimmen, ob Werte in 1er-, 0.5er- oder anderen Sprüngen gewürfelt werden.'
      }
    },
    equationSystem: {
      summary: 'Lineares Gleichungssystem mit 2 oder 3 Variablen, zufällig oder mit eigenen Varianten.',
      steps: {
        1: 'Modus wählen: zufällig generiert oder eigene Varianten.',
        2: 'Bei „Zufällig": Variablen, Koeffizienten- und Lösungsbereich festlegen.',
        3: 'Bei „Manuell": Gleichungen direkt eingeben, z. B. <code>2x + y = 5</code>.'
      },
      tips: {
        1: 'Im manuellen Modus prüft der Builder, ob das System eindeutig lösbar ist.',
        2: 'Punkte werden pro richtig gelöster Variable vergeben.'
      }
    },
    functionQuestion: {
      summary: 'Funktions-Graph mit Frage zu Funktionswerten, Nullstellen, Schnittpunkten oder Extrema.',
      steps: {
        1: 'Funktion eingeben, z. B. <code>x^2 - 3</code> oder <code>sin(x)</code>.',
        2: 'Frage-Modus wählen: Funktionswert, Nullstellen, y-Achsenabschnitt, Extrempunkte, oder eigene Frage.',
        3: 'Sichtbaren Bereich (x/y) festlegen.'
      },
      tips: {
        1: 'Bei mehreren Nullstellen werden alle erwartet; die Reihenfolge ist egal.',
        2: 'Für Extrempunkte werden die Koordinaten als (x; y) eingegeben.'
      }
    },
    complexQuestion: {
      summary: 'Komplexe Zahl aus einem Plot in der Gaußschen Zahlenebene ablesen.',
      steps: {
        1: 'Pool von Punkten anlegen.',
        2: 'Modus wählen: kartesisch (Re, Im), polar (|z|, φ), beides oder konjugiert.'
      }
    },
    complexInput: {
      summary: 'Komplexe Zahl als Antwort. Wie numerische Eingabe, aber mit Operationen auf komplexen Zahlen.',
      steps: {
        1: 'Frage-Vorlage formulieren, z. B. <code>$(a + bi)(c - di)</code>.',
        2: 'Variablen mit Bereichen anlegen.',
        3: 'Lösungs-Formel eintragen, z. B. <code>(a + b*i) * (c - d*i)</code>.'
      },
      tips: {
        1: 'Eingabeformate für Lernende: <code>3+4i</code>, <code>-i</code>, <code>1/2+3/4i</code>.'
      }
    },
    vectorQuestion: {
      summary: 'Vektor aus einem 2D-Plot ablesen. Frage nach Komponenten, Betrag oder Winkel.',
      steps: {
        1: 'Pool von Vektoren anlegen.',
        2: 'Frage-Modus wählen: Komponenten, Betrag, Winkel, Einheitsvektor oder alle.',
        3: 'Winkel-Einheit setzen (Grad oder Radiant).'
      }
    },
    truthTable: {
      summary: 'Boolesche Wahrheitstabelle. Lernender füllt Spalte aus, der Builder vergleicht jeden Zeilenwert.',
      steps: {
        1: 'Ausdruck eingeben, z. B. <code>a and b</code>, <code>not (a or b)</code>.',
        2: 'Variablennamen mit Komma trennen.'
      },
      tips: {
        1: 'Erlaubte Operatoren: and, or, not, xor (sowie &&, ||, !).',
        2: 'Jede Zeile gibt einen Punkt; 2^N Zeilen für N Variablen.'
      }
    },
    numberBase: {
      summary: 'Zahlensystem-Umrechnung: Binär, Oktal, Dezimal und Hexadezimal.',
      steps: {
        1: 'Richtungs-Preset wählen oder eigene Richtungen festlegen.',
        2: 'Wertebereich angeben (dezimal).'
      },
      tips: {
        1: 'Hex-Antworten werden case-insensitive geprüft; Prefix <code>0x</code> ist erlaubt.'
      }
    },
    composition: {
      summary: 'Vektor-Editor für eigene geometrische Konstruktionen und Beschriftungen. Optional mit Lücken zur Eingabe.',
      steps: {
        1: 'Eine Vorlage einfügen (Rechteck, Dreieck, Pythagoras, Kreis), oder Formen einzeln über die Toolbar hinzufügen.',
        2: 'Beschriftungen mit <code>{a}</code> für Variablen und <code>{1}</code> für Antwortfelder einfügen.',
        3: 'Bewertungs-Modus wählen: Anzeige, Verstanden-Button oder Mit Lösung.'
      },
      tips: {
        1: 'Variablen werden bei jedem Start neu gewürfelt; die Lösungs-Formel rechnet damit.',
        2: 'Mehrere Slots in einem Label: <code>{1}</code>, <code>{2}</code>, … können untereinander verrechnet werden (<code>{1*}</code> als Antwort von Slot 1 in einer anderen Formel).'
      }
    },
    functionSandbox: {
      summary: 'Interaktiver Funktionsplot zum Erkunden. Lernende ändern Parameter und sehen den Effekt sofort.',
      steps: {
        1: 'Funktion mit Platzhaltern für Parameter eintragen.',
        2: 'Parameter mit Min/Max/Schrittweite anlegen.',
        3: 'Sichtbaren x/y-Bereich festlegen.'
      },
      tips: {
        1: 'Keine Bewertung, reines Lernwerkzeug. Ergänzt eine Funktionsfrage gut.'
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
