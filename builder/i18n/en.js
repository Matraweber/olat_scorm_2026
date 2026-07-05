// en.js: English UI chrome bundle for the builder.
// Registered on load in main.js.

const en = {
  meta: { name: 'English', label: 'EN' },

  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    yes: 'Yes',
    no: 'No',
    edit: 'Edit',
    rename: 'Rename',
    add: 'Add',
    remove: 'Remove',
    duplicate: 'Duplicate',
    move: 'Move',
    up: 'Move up',
    down: 'Move down',
    loading: 'Loading …',
    error: 'Error',
    warning: 'Warning',
    empty: 'Empty',
    optional: 'optional',
    example: 'Example',
    tip: 'Tip',
    hint: 'Note'
  },

  header: {
    brand: 'SCORM Builder',
    brandTitle: 'Build OLAT learning units',
    home: 'Back to welcome',
    editCourseInfo: 'Edit course info',
    sidebarToggle: 'Show or hide the task sidebar',
    dataMenu: 'File',
    dataMenuSection: {
      course: 'Learning unit',
      open: 'Open',
      export: 'Export'
    },
    new: 'New',
    newHint: 'Start an empty learning unit',
    loadZip: 'Load SCORM ZIP …',
    loadZipHint: 'Open a previously exported ZIP',
    loadJson: 'Load JSON …',
    loadJsonHint: 'Open a configuration file',
    exportJson: 'Export as JSON',
    exportJsonHint: 'Download the raw configuration',
    help: 'Keyboard shortcuts',
    helpTitle: 'Keyboard shortcuts (?)',
    openFolder: 'Folder',
    openFolderTitle: 'Open a folder of SCORM ZIPs',
    preview: 'Preview',
    download: 'Export SCORM ZIP',
    language: 'Language',
    languageTitle: 'Pick display language'
  },

  sidebar: {
    tasks: 'Tasks',
    addTask: '+ Task',
    general: 'General',
    welcomeLink: 'Welcome and help',
    courseInfoLink: 'Course info',
    themeLink: 'Branding and theme',
    mode: 'Mode',
    jsonEditor: 'JSON editor'
  },

  taskList: {
    emptyTitle: 'No tasks yet',
    emptyBody: 'Create the first task to add learning content.',
    firstTask: '+ First task',
    up: 'Move up',
    down: 'Move down',
    delete: 'Delete',
    blocksSingular: '{n} block',
    blocksPlural: '{n} blocks',
    tabsSuffix: ' · {n} tabs',
    fallbackTitle: 'Task {n}'
  },

  footer: {
    tagline: 'SCORM 1.2 · browser only · runs offline · 2026 build'
  },

  preview: {
    title: 'Preview',
    close: 'Close',
    frameTitle: 'SCORM preview'
  },

  toast: {
    genericError: 'Error: {msg}'
  },

  lang: {
    switchTitle: 'Switch display language',
    switchLabel: 'Pick a language'
  },

  io: {
    error: {
      templateLoad: 'Could not load template file: {path}',
      fileLoad: 'Could not load file: {path}',
      jszipMissing: 'JSZip is not loaded.',
      writePermissionDenied: 'Write permission not granted.',
      saveFailed: 'Could not save: {msg}',
      zipFailed: 'ZIP error: {msg}',
      previewFailed: 'Preview error: {msg}'
    },
    manifest: {
      defaultCourseTitle: 'SCORM learning unit'
    },
    emptyPackage: {
      title: 'Export an empty package?',
      message: 'The SCORM package contains no tasks. After import in OLAT it will show only an empty course. Continue anyway?',
      confirm: 'Export anyway'
    },
    exportGate: {
      title: 'Ready to export?',
      summarySingular: 'The check found {total} item worth reviewing:',
      summaryPlural: 'The check found {total} items worth reviewing:',
      hint: 'You can still export the package, but the learning unit may feel incomplete to learners.',
      fix: 'Fix',
      proceed: 'Export anyway'
    },
    savePicker: {
      description: 'SCORM package (ZIP)'
    },
    unknownZip: {
      title: 'Unknown ZIP format?',
      message: 'This ZIP file does not contain a tasks.json. It was probably not created with the SCORM Builder. Try to load it anyway?',
      confirm: 'Try anyway'
    },
    toast: {
      packageProgress: 'Building package … {percent} %',
      saved: 'Saved: {name}',
      savedToDownloadsSafari: 'Saved to Downloads. Tip: Safari > Settings > General > "Ask for each download" lets you choose the location.',
      downloadReady: 'Download ready: {filename}',
      savingPackage: 'Saving package …',
      readingPackage: 'Reading package …',
      loadingTasks: 'Loading tasks …',
      embeddingMedia: 'Embedding media …',
      packageLoaded: 'SCORM package loaded.',
      jsonLoaded: 'JSON configuration loaded.',
      preparingPreview: 'Preparing preview …'
    },
    preview: {
      docTitle: 'Preview'
    },
    jsonEditor: {
      applied: 'Applied.'
    }
  },

  main: {
    newCourseConfirm: {
      title: 'New learning unit?',
      message: 'Discard the current state and start with an empty learning unit? Unsaved changes will be lost.',
      confirm: 'Discard and start over'
    },
    header: {
      newCourseTitle: 'New learning unit'
    },
    toast: {
      saved: 'Learning unit saved.'
    },
    autosave: {
      title: 'Automatically saved in the browser',
      notSaved: 'Not saved',
      saved: 'Saved',
      savedSecondsAgo: 'Saved · {n} s ago',
      savedMinutesAgo: 'Saved · {n} min ago',
      saving: 'Saving …'
    },
    recovery: {
      title: 'Restore previous session?',
      body: 'An unsaved learning unit was found:',
      untitledCourse: 'Learning unit',
      taskCountSingular: '{n} task',
      taskCountPlural: '{n} tasks',
      lastEditedMinutes: 'Last edited {n} minutes ago.',
      lastEditedHours: 'Last edited {n} hours ago.',
      discard: 'Discard',
      restore: 'Restore'
    }
  },

  state: {
    toast: {
      undoFailed: 'Undo failed: {msg}',
      nothingToUndo: 'Nothing to undo.',
      undone: 'Undone',
      nothingToRedo: 'Nothing to redo.',
      redone: 'Redone',
      blocksCopiedSingular: '{n} block copied.',
      blocksCopiedPlural: '{n} blocks copied.',
      clipboardEmpty: 'Clipboard is empty.',
      blocksPastedSingular: '{n} block pasted.',
      blocksPastedPlural: '{n} blocks pasted.'
    }
  },

  panes: {
    taskDelete: {
      title: 'Delete task?',
      message: '"{name}" and all of its blocks will be deleted. This action can be undone with Ctrl + Z.'
    },
    course: {
      heading: 'Learning unit course info',
      hint: 'These details appear in the SCORM header and in the OLAT learning path.',
      fields: {
        title: 'Course title',
        titlePlaceholder: 'e.g. Machine dynamics: complex numbers',
        subtitle: 'Subtitle',
        passThreshold: 'Passing threshold (0 to 1)'
      },
      questionBlocks: {
        heading: 'Question blocks (defaults for the whole learning unit)',
        note: 'Applies to every question block with a random pool. Individual tasks can override this.',
        lockAfterCheck: {
          label: 'Lock after check',
          help: 'After the first check, no new task can be generated.'
        },
        hideRegenerate: {
          label: 'Hide regenerate',
          help: 'No "Regenerate" button; the first random task must be solved.'
        }
      }
    },
    theme: {
      heading: 'Branding / theme',
      hint: 'UCB style by default. Adjust colors and the footer here.',
      reset: {
        button: 'Restore default branding',
        title: 'Reset branding?',
        message: 'Colors, logo, and footer settings will be reset to the original UCB defaults.',
        confirmLabel: 'Reset',
        toast: 'Default branding restored.'
      },
      persistError: 'Branding could not be saved persistently.',
      fields: {
        kicker: 'Kicker (badge top left)',
        fontFamily: 'Font (CSS font-family)',
        primaryColor: 'Primary color',
        primaryLight: 'Primary color light (gradient)',
        accentColor: 'Accent color',
        accentDarkColor: 'Accent color dark',
        footerText: 'Footer text',
        footerLink: 'Footer link',
        logoUrl: {
          label: 'Logo path (file in template/, gets bundled into the ZIP)',
          help: 'A file with this name must exist in builder/template/.'
        }
      },
      logoUpload: {
        label: 'Upload logo (overrides path)',
        help: 'Loads the image as a data URL into the JSON.',
        loaded: 'Logo loaded.',
        remove: 'Remove uploaded logo'
      },
      logoAlt: 'Logo',
      logoMissing: 'Logo "{name}" not found in template/.'
    }
  },

  welcome: {
    rail: {
      ariaLabel: 'Chapter overview',
      label: 'Chapters'
    },
    hero: {
      title: 'Welcome.',
      kicker: 'SCORM Builder · Umwelt-Campus Birkenfeld',
      lede: 'Build OLAT learning units right in the browser.<br><span class="welcome-lede-sub">No installation, no account.</span>',
      ctaPrimary: 'Create the first task',
      ctaSecondary: 'Go to course info'
    },
    video: {
      title: 'Video: the steps in one minute',
      lead: 'The short tutorial walks through the whole flow from an empty course to the SCORM export.',
      missing: 'The tutorial video was not found (tutorial/scorm-builder-tutorial.webm).'
    },
    quickstart: {
      title: 'From zero to SCORM package in 5 steps',
      lead: 'From an empty builder to a finished ZIP file.',
      optionalLabel: 'Optional first:',
      optionalCourse: 'Course info',
      optionalTheme: 'Branding / theme'
    },
    step1: {
      title: 'Create a task',
      body: 'In the sidebar, click <strong>+ Task</strong>. Choose an empty task or a template (for example "Truth table" or "Numeric input with variables").'
    },
    step2: {
      title: 'Add a block',
      body: 'Inside the task, click <strong>+ Block</strong>. A menu lists every available block type.'
    },
    step3: {
      title: 'Load an example or fill it in yourself',
      body: 'Every question block starts from a <strong>template</strong>: "Manual (empty)" for your own content or an <strong>example</strong> with ready-made content. <strong>Reset</strong> clears your manual input.'
    },
    step4: {
      title: 'Open the preview',
      body: 'Click <strong>Preview</strong> in the top right. This shows the learning unit from the student\'s perspective, and you can try answers directly.'
    },
    step5: {
      title: 'Export the SCORM ZIP',
      body: '<strong>Export SCORM ZIP</strong> downloads a complete SCORM 1.2 package. The ZIP file is uploaded into OLAT as a learning unit.'
    },
    mock: {
      previewBtn: 'Preview',
      exportBtn: 'Export SCORM ZIP',
      task1: 'Task 1',
      task2: 'Task 2',
      blocks1: '1 block',
      blocks2: '2 blocks',
      pickerHead: 'Add block',
      catMedia: 'Media and content',
      catQuestion: 'Question',
      catStem: 'STEM',
      chipText: 'Text',
      chipImage: 'Image',
      chipVideo: 'Video',
      chipMultipleChoice: 'Multiple choice',
      chipSort: 'Sort',
      chipNumeric: 'Numeric',
      chipTruthTable: 'Truth table',
      chipUnits: 'Units',
      headingLabel: 'Heading',
      headingValue: 'Task',
      templateLabel: 'Template',
      templateValue: 'Example: mathematics, Pythagoras ▾',
      questionSection: 'Question',
      questionTemplateLabel: 'Question template',
      questionTemplateValue: 'Compute {a}² + {b}².',
      jsonExportBtn: 'Export JSON',
      canvasHead: 'Task 1 · + Block',
      blockNumericInput: 'Numeric input',
      configHead: 'Configuration',
      cfgTemplate: 'Template',
      cfgQuestion: 'Question',
      cfgScoring: 'Scoring'
    },
    interface: {
      title: 'The interface at a glance',
      lead: 'The builder is made up of three areas.',
      legend: {
        sidebarTitle: 'Sidebar',
        sidebarBody: 'The list of your tasks and the General links (course info, branding, this help page). This is where you add, reorder, and delete tasks.',
        canvasTitle: 'Canvas',
        canvasBody: 'The work surface for the selected task. Blocks are arranged and resized here using drag-and-drop.',
        configTitle: 'Configuration pane',
        configBody: 'On the right: the properties of the selected block. Templates, text, answers, and scoring are set here.'
      }
    },
    blockTypes: {
      title: 'Block types',
      lead: 'Media and text blocks are static, question and STEM blocks are graded. A task can contain any number of blocks.',
      hint: 'Click a tile to see a live preview and details.',
      categoryOther: 'Other',
      cardAriaLabel: '{name}: view details',
      gradedBadge: 'graded'
    },
    canvas: {
      title: 'Working with the canvas',
      tipMove: {
        title: 'Move',
        body: 'Blocks are dragged with the mouse. Hold Shift to move several blocks at once.'
      },
      tipResize: {
        title: 'Resize',
        body: 'Drag the corner at the bottom right of any block, or use the "Fit height to content" button.'
      },
      tipMultiSelect: {
        title: 'Multi-select',
        body: 'Shift + click selects several blocks. Align, distribute, and duplicate options then appear in the right pane.'
      },
      tipZoom: {
        title: 'Zoom',
        body: 'Ctrl/Cmd + mouse wheel zooms the canvas. The +/− buttons at the top right of the task work as well.'
      },
      tipTabs: {
        title: 'Tabs (optional)',
        body: 'Each task can have two tabs enabled, for example "Visualisation" and "Task".'
      },
      tipTemplates: {
        title: 'Save templates',
        body: 'Save a finished task as a template ("Template" in the task header). It is then available the next time you open the builder.'
      }
    },
    languages: {
      title: 'Multilingual learning units',
      lead: 'The builder separates two levels: the language of the interface and the language of the course content.',
      uiLang: {
        title: 'Interface language',
        body: 'The button in the top-right corner of the header (e.g. EN) switches the builder interface language. Course content is not affected.'
      },
      contentLang: {
        title: 'Content language per field',
        body: 'The config panel has a "Content language: DE | EN" switch. Set it to EN, fill in the same field in English, done. The German text stays visible below the field as a reference and is never lost.'
      },
      student: {
        title: 'What students see',
        body: 'When two languages are filled in, the SCORM player automatically shows a DE/EN switch. With a single language everything behaves as before, without a switch.'
      },
      export: {
        title: 'Export',
        body: 'The ZIP contains only the languages actually in use. The course starts in the language that was active in the builder at export time. Fields without a translation fall back to the source language.'
      }
    },
    shortcuts: {
      title: 'Keyboard shortcuts',
      lead: 'Available on the canvas:',
      keyArrow: 'Arrow',
      keyCtrl: 'Ctrl/⌘',
      keyDel: 'Del',
      keyWheel: 'Mouse wheel',
      moveByPixel: 'Move selected blocks pixel by pixel',
      moveBy10: 'Move blocks in 10-px steps',
      copy: 'Copy selected blocks',
      paste: 'Paste blocks',
      duplicate: 'Duplicate selected blocks',
      selectAll: 'Select every block in the task',
      delete: 'Delete selected blocks',
      deselect: 'Clear selection',
      undo: 'Undo',
      redo: 'Redo',
      zoom: 'Zoom the canvas'
    },
    foot: {
      note: 'This page is always reachable via <strong>Welcome / Help</strong> in the sidebar.'
    },
    modal: {
      ariaLabel: '{name}: details',
      gradedBadge: 'Graded',
      factCategory: 'Category',
      factGradable: 'Gradable',
      factConfigOptions: 'Configuration options',
      previewLabel: 'Live preview',
      previewNone: '(No preview available)',
      previewError: 'The preview could not be rendered.'
    }
  },

  modals: {
    categoryGeneral: 'General',
    userTemplatesHead: 'My templates',
    noTemplates: 'No templates available.',
    insert: 'Insert',
    renamePrompt: 'New name:',
    templateInserted: 'Template "{name}" inserted.',
    deleteTemplateTitle: 'Delete template?',
    deleteTemplateMessage: '"{name}" will be permanently removed from the task templates.',
    noBlocksInTask: 'This task contains no blocks.',
    defaultTemplateName: 'My template',
    defaultTemplateCategory: 'My own',
    nameRequired: 'Name must not be empty.',
    templateSaved: 'Template "{name}" saved.',
    templateBasedOn: 'Template based on: {base}',
    templateBadge: 'Template',
    gradedBadge: 'graded',
    deleteTemplateAction: 'Delete template',
    deleteBlockTemplateTitle: 'Delete block template?',
    deleteBlockTemplateMessage: '"{name}" will be permanently removed from your block templates.',
    noBlockMatch: 'No block type matches "{query}".'
  },

  taskPane: {
    taskLabel: 'Task {n}',
    titlePlaceholder: 'Task title (shown in the navigation)',
    addBlock: '+ Block',
    addBlockTitle: 'Add a block',
    saveTemplate: '★ Template',
    saveTemplateTitle: 'Save task as a template',
    tabsDisable: 'Disable tabs',
    tabsEnable: '+ Enable tabs',
    tabsDisableTitle: 'Remove tabs (only tab 1 is kept)',
    tabsEnableTitle: 'Enable 2 tabs: visualisation and task',
    tabsDisableConfirmTitle: 'Disable tabs?',
    tabsDisableConfirmMessageSingular: 'Tab 2 contains {n} block. Disabling tabs will discard it.',
    tabsDisableConfirmMessagePlural: 'Tab 2 contains {n} blocks. Disabling tabs will discard them.',
    tabsDisableConfirmLabel: 'Disable',
    zoomOutTitle: 'Zoom out (Ctrl + mouse wheel)',
    zoomInTitle: 'Zoom in (Ctrl + mouse wheel)',
    zoomResetTitle: 'Zoom 100%',
    tabSwitchTitle: 'Switch tab',
    tabFallbackTitle: 'Tab {n}',
    dropRejectedSingular: 'File ignored: only image files can be dropped on the canvas.',
    dropRejectedPlural: '{n} files ignored: only image files can be dropped on the canvas.',
    fileValidationError: '"{name}": {error}',
    fileReadError: '"{name}" could not be read.',
    imageAddedSingular: 'Image added as a block.',
    imageAddedPlural: '{n} images added as blocks.',
    canvas: {
      gradedSuffix: ' · graded',
      fitHeightTitle: 'Fit height to content',
      saveAsTemplateTitle: 'Save as block template',
      resizeTitle: 'Resize',
      saveTemplateDialog: {
        title: 'Save block as template',
        nameLabel: 'Name',
        namePlaceholder: 'e.g. multiple choice with 4 options',
        descriptionLabel: 'Description (optional)',
        descriptionPlaceholder: 'What makes this template distinctive?'
      },
      templateNotSavedNoName: 'Template was not saved (no name given).',
      templateSaved: 'Block template "{name}" saved.',
      deleteBlockDialog: {
        title: 'Delete block?',
        message: '"{name}" will be removed from the canvas. This action can be undone with Ctrl + Z.'
      },
      empty: {
        title: 'Ready for the first block?',
        body: 'Pick a block type (e.g. image, text, or question) and place it freely on the canvas.',
        addBlock: '+ Add block',
        hint: 'Tip: <kbd>Ctrl</kbd> + mouse wheel to zoom · <kbd>arrow keys</kbd> to move'
      }
    },
    config: {
      editorLocale: {
        label: 'Content language:'
      },
      help: {
        toggle: 'What is this?',
        stepsHead: 'Steps',
        tipsHead: 'Tips'
      },
      posLabel: 'Position {x}, {y} · Size {w}×{h}',
      empty: {
        prompt: 'Pick a block on the canvas to edit it.',
        shortcutHint: '<kbd>?</kbd> opens all keyboard shortcuts.'
      },
      multi: {
        title: 'Multiple selection',
        hint: 'Pick an action for all selected blocks.',
        alignHead: 'Align',
        alignLeft: '⟸ Left',
        alignCenterX: '⇔ Center X',
        alignRight: 'Right ⟹',
        alignTop: '⤒ Top',
        alignCenterY: '⇕ Center Y',
        alignBottom: 'Bottom ⤓',
        distributeHead: 'Distribute (equal spacing)',
        distributeHorizontal: 'Horizontal',
        distributeVertical: 'Vertical',
        actionsHead: 'Actions',
        duplicate: '⧉ Duplicate',
        delete: '✕ Delete'
      },
      single: {
        title: 'Configuration: {label}',
        unknownType: 'Block type "{type}" is not registered.',
        noSchema: 'This block has no configuration.'
      },
      warnings: {
        title: 'Notes ({n})',
        item: '• {msg}'
      }
    },
    bulk: {
      deleteTitleSingular: 'Delete block?',
      deleteTitlePlural: 'Delete {n} blocks?',
      deleteMessageSingular: 'The selected block will be removed from the canvas.',
      deleteMessagePlural: 'All {n} selected blocks will be removed from the canvas.'
    }
  },

  form: {
    upload: {
      noFile: 'No file selected.',
      tooLarge: 'File is too large ({size}). Maximum: {max}.',
      tooLargeVideoTip: 'Tip: YouTube and Vimeo support videos of any size, just paste the link.',
      notImage: 'This file is not an image.',
      notImageWithType: 'This file is not an image (type: {type}).',
      notAudio: 'This file is not an audio file.',
      notAudioWithType: 'This file is not an audio file (type: {type}).',
      notVideo: 'This file is not a video.',
      notVideoWithType: 'This file is not a video (type: {type}).',
      veryLargeVideoTip: 'For very long videos, a YouTube or Vimeo link may work better.',
      veryLargeWarning: 'Very large file: browser autosave may fail, so the file could be lost on reload. The SCORM export still works.'
    },
    list: {
      itemLabel: 'Item',
      empty: 'No items yet.'
    },
    action: {
      default: 'Action'
    },
    color: {
      pickerAria: '{label} (color picker)',
      hexAria: '{label} (hex code)'
    },
    media: {
      readError: 'Could not read the file.',
      urlPlaceholder: 'or enter a URL or path',
      image: {
        clear: 'Remove image',
        embedded: 'Image embedded ({size})'
      },
      audio: {
        clear: 'Remove audio',
        embedded: 'Audio embedded ({size})',
        urlPlaceholder: 'or enter a URL or path (e.g. https://example.org/clip.mp3)'
      },
      video: {
        clear: 'Remove video',
        embedded: 'Video embedded ({size})',
        urlPlaceholder: 'YouTube or Vimeo link or a direct video URL (e.g. https://youtu.be/abc12345678)',
        embedDetected: '{provider} embed detected'
      },
      file: {
        clear: 'Remove file',
        embedded: 'File embedded ({size})',
        previewEmbedded: '✓ File embedded ({size})',
        previewUrl: '✓ URL: {url}'
      }
    },
    math: {
      mathHint: 'Tip: write formulas between $ and $, for example $\\frac{a}{b}$ · variables as {name}',
      delimBtnTitle: 'Insert formula environment',
      formulaHint: 'Available: sqrt, sin, cos, tan, log, exp, abs, floor, ceil, round, min, max, pow, atan2 · constants: pi, e · power: ^'
    },
    specialized: {
      zoneEditor: {
        uploadFirst: 'Upload an image first (field above) to mark zones.',
        instructions: 'Click and drag on the image to mark a zone. Click a zone to delete it.',
        rectTitle: 'Zone {n}: click to delete',
        listItem: 'Zone {n}: {w}×{h}% @ ({x}%, {y}%)',
        emptyZones: 'No zones marked yet.'
      },
      unitPair: {
        defaultLabel: 'Conversion task',
        inputPlaceholder: 'Input',
        outputPlaceholder: 'Output',
        swapTitle: 'Swap input and output',
        incompatible: 'Units are not compatible.',
        help: 'Type into the output on the right and the input on the left is computed from it, and vice versa.'
      },
      unitFromTo: {
        randomOption: 'Random  ({cat})',
        defaultLabel: 'Direction',
        swapTitle: 'Swap from ↔ to'
      }
    }
  },

  canvas: {
    snap: {
      edge: {
        left: 'Left',
        right: 'Right',
        centerX: 'Center X',
        top: 'Top',
        bottom: 'Bottom',
        centerY: 'Center Y',
        rightEdge: 'Right edge',
        bottomEdge: 'Bottom edge'
      }
    }
  },

  tasks: {
    defaultTab: {
      visualization: 'Visualization',
      task: 'Task'
    },
    defaultNoteTitle: 'Note',
    defaultTitle: 'Task',
    validation: {
      noTasks: 'Learning unit contains no tasks.',
      emptyCourseTitle: 'Course title is empty.'
    },
    toast: {
      saveTemplatesFailed: 'Templates could not be saved: {msg}',
      saveBlockTemplatesFailed: 'Block templates could not be saved: {msg}'
    },
    defaultTemplateLabel: 'Custom template'
  },

  util: {
    confirmDialog: {
      fallbackMessage: 'OK?'
    }
  },

  folder: {
    toast: {
      opened: 'Folder "{name}" opened.',
      openFailed: 'Could not open folder: {msg}',
      fileReadFailed: 'Could not read file.',
      loadFailed: 'Error while loading: {msg}'
    },
    close: {
      title: 'Close folder (forgets the path)',
      ariaLabel: 'Close folder'
    },
    hint: {
      click: 'Click a file to load it. Stays open until you click elsewhere.',
      readOnly: 'Read-only (browser without File System API).'
    }
  },

  blockHelp: {
    heading: {
      summary: 'Heading. Structures the task and marks thematic sections.',
      steps: {
        1: 'Enter the text in the field.',
        2: 'Pick a size as needed (H2 is the default for subsections).'
      }
    },
    richText: {
      summary: 'Body text with basic formatting (bold, italic, lists, links).',
      steps: {
        1: 'Write the content in the editor.',
        2: 'Use the formatting toolbar at the top for emphasis.'
      },
      tips: {
        1: 'For inline formulas use dollar signs like in LaTeX, e.g. $a^2 + b^2 = c^2$.'
      }
    },
    noteBox: {
      summary: 'Color-tinted callout box to highlight key points against the body text.',
      steps: {
        1: 'Pick a style: info, warning, tip or definition.',
        2: 'Enter the text.'
      }
    },
    image: {
      summary: 'Embedded image. Bundled into the SCORM package as a data URL.',
      steps: {
        1: 'Pick a file or drag-and-drop it onto the canvas.',
        2: 'Enter alt text for accessibility.'
      },
      tips: {
        1: 'Compress images larger than 2 MB first, otherwise the ZIP grows unnecessarily.'
      }
    },
    audio: {
      summary: 'Audio player with standard browser controls.',
      steps: {
        1: 'Upload an audio file (mp3, ogg, wav).',
        2: 'Optional: enter a caption.'
      }
    },
    video: {
      summary: 'Video player. Local file or YouTube/Vimeo embed.',
      steps: {
        1: 'For a local video: upload the file (mp4 recommended).',
        2: 'For YouTube/Vimeo: paste the full link, the builder detects the format automatically.'
      },
      tips: {
        1: 'Local videos over 10 MB bloat the SCORM ZIP significantly. YouTube/Vimeo links have no size limit.'
      }
    },
    fileDownload: {
      summary: 'List of downloadable files (PDFs, worksheets, code samples).',
      steps: {
        1: 'Add one row per file, upload the file, and enter a caption.'
      }
    },
    divider: {
      summary: 'Horizontal rule as a visual section break.',
      steps: {
        1: 'Just place it. No further configuration.'
      }
    },
    code: {
      summary: 'Source code block with syntax highlighting.',
      steps: {
        1: 'Pick a language.',
        2: 'Paste the code into the text field, indentation is preserved.'
      }
    },
    summary: {
      summary: 'Summary block with a title and bullet points. Well suited for closing sections.',
      steps: {
        1: 'Enter a title.',
        2: 'For each point, enter a heading and an explanation.'
      }
    },
    survey: {
      summary: 'Ungraded survey. Shown to the learner but does not count towards the points.',
      steps: {
        1: 'Write the question.',
        2: 'Add answer choices. No marking as right or wrong.'
      },
      tips: {
        1: 'Useful for self-assessment or mood check-ins at the start or end of a unit.'
      }
    },
    multipleChoice: {
      summary: 'Multiple-choice question with one or more correct answers.',
      steps: {
        1: 'Write the question.',
        2: 'Add answer choices and check the correct ones.'
      },
      tips: {
        1: 'When several answers are correct, partial credit is awarded automatically (e.g. 1 out of 2 correct answers = 50 %).',
        2: 'Choices are shuffled per learner.',
        3: '"Penalise wrong answers" deducts points for each incorrect selection.'
      }
    },
    cloze: {
      summary: 'Cloze text: words in the body are replaced by input fields or dropdowns.',
      steps: {
        1: 'Write the text with gaps into the template.',
        2: 'Add a gap: <code>{{answer}}</code> for a free input, <code>{{a|b|c}}</code> for alternatives, <code>{{=correct|wrong1|wrong2}}</code> for a dropdown.'
      },
      tips: {
        1: '"Ignore case" lets "berlin" count as "Berlin".',
        2: 'Separate multiple correct spellings with |, e.g. <code>{{Hund|dog|chien}}</code>.'
      }
    },
    textInput: {
      summary: 'Free text answer. The comparison mode controls how strict the match is.',
      steps: {
        1: 'Write the question.',
        2: 'Enter the correct answers.',
        3: 'Pick a comparison mode.'
      },
      tips: {
        1: '"Ignore case" is the default. Use "Exact" only for code or case-sensitive spellings.',
        2: '"Regex" for patterns like <code>\\d{4}</code> (a year).',
        3: '"Keywords" awards partial credit for each keyword found.'
      }
    },
    matchPairs: {
      summary: 'Matching by drag-and-drop. 1:1 for classic pairs, categorization for several terms per category.',
      steps: {
        1: 'Pick a mode: pairs or categorization.',
        2: 'For pairs: enter the left and right sides in matching order.',
        3: 'For categorization: add categories, then assign terms to the matching category.'
      },
      tips: {
        1: 'Images and text can be mixed. Compress images larger than 1 MB.',
        2: 'Points are awarded proportionally: 3 out of 4 correct matches = 75 %.'
      }
    },
    sortList: {
      summary: 'Sort list: the learner drags terms into the correct order.',
      steps: {
        1: 'Enter the items in the correct order.',
        2: 'The learner sees them shuffled and has to sort them.'
      },
      tips: {
        1: 'One point per item in the correct position. With 4 items and 2 correct = 2 points.'
      }
    },
    hotzone: {
      summary: 'Click-on-image task. The learner clicks the correct areas of the image.',
      steps: {
        1: 'Upload an image.',
        2: 'Place rectangular zones over the correct areas of the image.'
      },
      tips: {
        1: 'Zone coordinates are normalised (0 to 1). They stay valid when the image is swapped for one with the same aspect ratio.',
        2: 'Multiple zones per image are supported; points are awarded proportionally.'
      }
    },
    numericInput: {
      summary: 'Numeric input with tolerance, variables and an auto-generated task.',
      steps: {
        1: 'Write a question template with placeholders like <code>{a}</code>.',
        2: 'Add variables with a min/max range.',
        3: 'Enter the solution formula, e.g. <code>a*b</code> or <code>sqrt(a^2+b^2)</code>.'
      },
      tips: {
        1: 'On every "Regenerate" the builder draws new values from the variable ranges.',
        2: 'Tolerance defines the accepted deviation from the target value.',
        3: 'With "Simplify term" the answer is expected as a reduced fraction.'
      }
    },
    unitConvert: {
      summary: 'Unit conversion (length, time, mass, speed, energy, etc.).',
      steps: {
        1: 'Pick a quantity type (e.g. length).',
        2: 'Set the source and target units.',
        3: 'Define the value range.'
      },
      tips: {
        1: 'With "Fractions allowed", fractional numbers are also accepted as an answer.',
        2: 'The decimal separator is a comma, but the builder also accepts a dot.'
      }
    },
    table: {
      summary: 'Table with variable columns and input fields. For several calculations in a single task.',
      steps: {
        1: 'Add columns and pick a type per column: random value, formula or free text input.',
        2: 'Set the number of rows and the variable range.'
      },
      tips: {
        1: 'Formula columns use the values of the preceding columns in the same row.',
        2: 'Step sizes decide whether values are rolled in steps of 1, 0.5 or other increments.'
      }
    },
    equationSystem: {
      summary: 'Linear equation system with 2 or 3 variables, either random or with your own variants.',
      steps: {
        1: 'Pick a mode: randomly generated or your own variants.',
        2: 'For "Random": set the variables, coefficient range and solution range.',
        3: 'For "Manual": enter the equations directly, e.g. <code>2x + y = 5</code>.'
      },
      tips: {
        1: 'In manual mode the builder checks whether the system has a unique solution.',
        2: 'Points are awarded per correctly solved variable.'
      }
    },
    functionQuestion: {
      summary: 'Function graph with a question on function values, roots, intersections or extrema.',
      steps: {
        1: 'Enter a function, e.g. <code>x^2 - 3</code> or <code>sin(x)</code>.',
        2: 'Pick a question mode: function value, roots, y-intercept, extrema or a custom question.',
        3: 'Set the visible range (x/y).'
      },
      tips: {
        1: 'When there are several roots, all of them are expected; order does not matter.',
        2: 'For extrema, the coordinates are entered as (x; y).'
      }
    },
    complexQuestion: {
      summary: 'Read a complex number off a plot in the Gaussian plane.',
      steps: {
        1: 'Add a pool of points.',
        2: 'Pick a mode: Cartesian (Re, Im), polar (|z|, φ), both, or conjugate.'
      }
    },
    complexInput: {
      summary: 'Complex number as the answer. Like numeric input, but with operations on complex numbers.',
      steps: {
        1: 'Write a question template, e.g. <code>$(a + bi)(c - di)</code>.',
        2: 'Add variables with ranges.',
        3: 'Enter the solution formula, e.g. <code>(a + b*i) * (c - d*i)</code>.'
      },
      tips: {
        1: 'Input formats for learners: <code>3+4i</code>, <code>-i</code>, <code>1/2+3/4i</code>.'
      }
    },
    vectorQuestion: {
      summary: 'Read a vector off a 2D plot. Ask for components, magnitude or angle.',
      steps: {
        1: 'Add a pool of vectors.',
        2: 'Pick a question mode: components, magnitude, angle, unit vector or all.',
        3: 'Set the angle unit (degrees or radians).'
      }
    },
    truthTable: {
      summary: 'Boolean truth table. The learner fills in the column and the builder checks each row value.',
      steps: {
        1: 'Enter an expression, e.g. <code>a and b</code>, <code>not (a or b)</code>.',
        2: 'Separate variable names with commas.'
      },
      tips: {
        1: 'Allowed operators: and, or, not, xor (as well as &&, ||, !).',
        2: 'Each row is worth one point; 2^N rows for N variables.'
      }
    },
    numberBase: {
      summary: 'Number base conversion: binary, octal, decimal and hexadecimal.',
      steps: {
        1: 'Pick a direction preset or define your own directions.',
        2: 'Set the value range (decimal).'
      },
      tips: {
        1: 'Hex answers are checked case-insensitively; the <code>0x</code> prefix is allowed.'
      }
    },
    composition: {
      summary: 'Vector editor for custom geometric constructions and labels. Optionally with input gaps.',
      steps: {
        1: 'Insert a template (rectangle, triangle, Pythagoras, circle), or add shapes one by one from the toolbar.',
        2: 'Add labels with <code>{a}</code> for variables and <code>{1}</code> for answer fields.',
        3: 'Pick a grading mode: display only, understood button, or with solution.'
      },
      tips: {
        1: 'Variables are rolled again on every start; the solution formula uses those values.',
        2: 'Multiple slots in one label: <code>{1}</code>, <code>{2}</code>, … can reference each other (<code>{1*}</code> as the answer of slot 1 in another formula).'
      }
    },
    functionSandbox: {
      summary: 'Interactive function plot for exploration. Learners change parameters and see the effect instantly.',
      steps: {
        1: 'Enter a function with placeholders for parameters.',
        2: 'Add parameters with min/max/step size.',
        3: 'Set the visible x/y range.'
      },
      tips: {
        1: 'No grading, purely a learning tool. Pairs well with a function question.'
      }
    }
  },

  taskTemplates: {
    category: {
      content: 'Content',
      question: 'Question',
      math: 'Mathematics',
      cs: 'Computer science'
    },
    emptyContent: {
      label: 'Content page',
      description: 'Heading, text, and image. Good for explanations without a question.'
    },
    mcSimple: {
      label: 'Multiple choice, short',
      description: 'One question with multiple answer options.'
    },
    numericClassic: {
      label: 'Numeric calculation',
      description: 'Task text, variables, and solution formula.'
    },
    cloze: {
      label: 'Cloze text',
      description: 'Text with gaps {{answer}} to fill in.'
    },
    match: {
      label: 'Match terms',
      description: 'Drag-and-drop or click to connect terms on the left to answers on the right.'
    },
    textInput: {
      label: 'Text answer',
      description: 'Question with a free text answer (exact or regex).'
    },
    complex: {
      label: 'Complex numbers task',
      description: 'Intro, hint, and reading Re/Im/|z|/φ off the plot.'
    },
    function: {
      label: 'Read a function',
      description: 'Plot a function and have learners read off values, roots, or extrema.'
    },
    vector: {
      label: 'Read a 2D vector',
      description: 'Read a vector\'s components, magnitude, or angle off the plot.'
    },
    truthTable: {
      label: 'Truth table',
      description: 'Boolean expression, fill in the truth table.'
    },
    baseConversion: {
      label: 'Number base conversion',
      description: 'Conversion between binary, decimal, hex, and octal.'
    }
  },

  mathToolbar: {
    categories: {
      fractions: 'Fractions',
      roots: 'Roots',
      exponents: 'Exponents',
      greek: 'Greek',
      operators: 'Operators',
      functions: 'Functions',
      sets: 'Sets',
      brackets: 'Brackets'
    },
    tips: {
      fraction: 'Fraction',
      squareRoot: 'Square root',
      cubeRoot: 'Cube root',
      nthRoot: 'nth root',
      superscript: 'Superscript',
      subscript: 'Subscript',
      sum: 'Sum',
      product: 'Product',
      integral: 'Integral',
      vector: 'Vector',
      roundBrackets: 'Round brackets',
      squareBrackets: 'Square brackets',
      absoluteValue: 'Absolute value',
      curlyBrackets: 'Curly brackets'
    }
  },

  html: {
    docTitle: 'SCORM Builder | Umwelt-Campus Birkenfeld',
    header: {
      sidebarToggleAria: 'Show or hide the task sidebar',
      loadZipHintAlt: 'Open a .zip from a previous export',
      exportJsonHintAlt: 'Download the raw configuration',
      cheatsheetAria: 'Show keyboard shortcuts'
    },
    sidebar: {
      welcomeAndHelp: 'Welcome / help'
    },
    jsonPane: {
      hint: 'Edit the whole package as JSON. Valid JSON is applied immediately.'
    },
    footer: {
      tagline: 'SCORM 1.2 · browser only · runs offline · 2026 build'
    },
    modal: {
      blockPicker: {
        searchPlaceholder: 'Search block type (e.g. image, question, code)',
        categoriesAria: 'Categories'
      },
      taskCreate: {
        title: 'New task',
        emptyTitle: 'Empty task',
        emptyHint: 'Compose blocks freely',
        orTemplate: 'or pick a template'
      },
      saveTemplate: {
        hint: 'Templates are stored locally in your browser (localStorage) and remain available for future SCORM packages.',
        nameLabel: 'Template name',
        categoryLabel: 'Category',
        categoryPlaceholder: 'e.g. mathematics'
      }
    },
    cheatsheet: {
      general: {
        toggle: 'Show or hide this overview',
        save: 'Save immediately (autosave flush)',
        exportZip: 'Export SCORM ZIP',
        undo: 'Undo',
        redo: 'Redo',
        redoAlt: 'Redo (alternative)'
      },
      canvas: {
        heading: 'Task canvas',
        move1: 'Move selected blocks 1 px',
        arrowLabel: 'Arrow',
        move10: 'Move blocks 10 px',
        selectAll: 'Select every block',
        copy: 'Copy selected blocks',
        paste: 'Paste blocks',
        duplicate: 'Duplicate blocks',
        delete: 'Delete selected blocks',
        deselect: 'Clear selection'
      },
      composition: {
        heading: 'Composition (inside the editor)',
        moveTool: 'Move tool',
        selectTool: 'Selection tool (drag a frame)',
        move1: 'Move shape 1 px',
        move10: 'Move shape 10 px',
        dragCorner: 'Drag on corner point',
        scaleProportional: 'Scale proportionally (ellipse, rectangle, polygon)',
        duplicate: 'Duplicate shape',
        copy: 'Copy shape into composition clipboard',
        paste: 'Paste shape from clipboard',
        selectAll: 'Select every shape',
        delete: 'Delete selected shapes',
        undo: 'Undo inside the composition'
      },
      footTip: 'Tip: <kbd>?</kbd> opens this overview any time'
    }
  }
};

if(typeof window !== 'undefined'){
  window.__scormI18n_en = en;
}
export default en;
