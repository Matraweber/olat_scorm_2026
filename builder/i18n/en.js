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
    unsaved: {
      title: 'Unsaved learning unit',
      message: 'The current learning unit has not been saved as a SCORM ZIP yet. Switching will lose these changes.',
      save: 'Save as SCORM ZIP and switch',
      discard: 'Discard and switch',
      cancel: 'Cancel'
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
          label: 'Lock Regenerate button after check',
          help: 'After the first check, no new task can be generated.'
        },
        hideRegenerate: {
          label: 'Hide regenerate',
          help: 'No "Regenerate" button; the first random task must be solved.'
        },
        lockAnswers: {
          label: 'Lock answer after check',
          help: 'Applies to every graded block: after checking, the answer can no longer be changed (one attempt). "Regenerate" unlocks the input for the new task.'
        }
      },
      timer: {
        heading: 'Time limit (whole learning unit)',
        enabled: {
          label: 'Time limit for the learning unit',
          help: 'One countdown runs across all tasks (it keeps running when switching tasks). At 0 the learning unit is finished and scored automatically.'
        },
        minutes: 'Minutes',
        seconds: 'Seconds'
      },
      images: {
        heading: 'Images',
        shrink: {
          label: 'Shrink large images on upload',
          help: 'Photos are scaled to at most 2000 px (longer side) and saved as JPEG, typically around 90 % smaller. Screenshots/PNG stay lossless. No visible difference in the learning unit. Only affects newly uploaded images.'
        }
      },
      pools: {
        heading: 'Task pools',
        note: 'Per attempt, the set number of tasks is drawn at random from each pool; tasks without a pool are always included. Assign tasks in each task\'s header. A resumed attempt keeps the same selection.',
        listLabel: 'Pools',
        itemLabel: 'Pool',
        name: 'Name',
        namePlaceholder: 'e.g. Statics',
        draw: 'Number of tasks drawn',
        drawPlaceholder: 'empty = all',
        usage: '{draw} of {n} tasks are drawn',
        empty: 'no tasks assigned yet'
      },
      globalVars: {
        heading: 'Global variables (whole learning unit)',
        note: 'Random variables that apply to every task. Blocks use them like their own variables: {F} in texts, F in formulas. A block variable with the same name takes precedence. Values are drawn once per attempt.',
        listLabel: 'Global variables',
        itemLabel: 'Global variable',
        listHelp: 'Works in Numeric input, Composition, Table (values and free table) and Complex numbers.',
        name: 'Name',
        namePlaceholder: 'e.g. F',
        min: 'from',
        max: 'to',
        integer: 'Integers only',
        usageHead: 'Used in:',
        unused: 'not used in any task yet',
        button: {
          label: 'Show the "Regenerate global values" button',
          help: 'In the header of the learning unit. Draws new values and resets every task that uses global variables (after a confirmation). A block\'s own "Regenerate" button only changes that block\'s variables.'
        },
        lock: {
          label: 'Lock global regeneration after a check',
          help: 'Once an answer has been checked in an affected task, the button is locked. It is also locked while answers there are locked ("Lock answer after check").'
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
      missing: 'The tutorial video was not found ({file}).'
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
        body: 'Drag the corner at the bottom right of a block. ↕ fits the height to the builder preview, ⇳ to the finished learning unit, so the block never scrolls there.'
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
        body: 'Each task can have tabs enabled, for example "Visualisation" and "Task". Use + to add more tabs and × to close one; the active tab\'s name can be edited in place.'
      },
      tipTemplates: {
        title: 'Save templates',
        body: 'Save a finished task as a template ("Template" in the task header). It is then available the next time you open the builder.'
      }
    },
    variables: {
      title: 'Random variables',
      lead: 'Calculation blocks (numeric input, composition, table, complex input) draw numbers from ranges you set. Every learner gets their own values, and "Regenerate" produces a new task of the same kind.',
      local: {
        title: 'Variables in a block',
        body: 'In the block under "Random variables", set name, range (from/to) and "Integers only". Write <code>{a}</code> in texts and <code>a</code> in formulas.'
      },
      global: {
        title: 'Global variables',
        body: 'Defined in the course settings, they apply to every task, e.g. the same force F across a whole series of tasks. A block variable with the same name takes precedence. "Regenerate global values" at the top of the learning unit resets every affected task.'
      },
      regen: {
        title: '"Regenerate"',
        body: 'Draws new values for the block\'s variables. Can be locked after a check or hidden, in the course settings or per block.'
      },
      format: {
        title: 'Display and whole-number solutions',
        body: 'Decimal places and display (decimal, fraction or automatic) per block or per variable. "Whole-number solutions only" only draws values with a whole result.'
      },
      example: '<strong>Example:</strong> task text <code>A beam of length {l} m carries F = {F} kN. Compute M = F · l.</code>, variable <code>l</code> from 2 to 6 (integer), <code>F</code> as a global variable from 10 to 50, solution formula <code>F*l</code>. Learners see e.g. "length 4 m … F = 25 kN"; the answer is 100.'
    },
    scoring: {
      title: 'Grading and points',
      lead: 'Every graded block has a number of points. Together they make up the total of the learning unit; the pass threshold in the course settings decides whether it is passed.',
      partial: {
        title: 'Partial credit',
        body: 'Most blocks grade proportionally: 3 of 4 correct matches give 75 % of the points. Several answer fields count individually.'
      },
      deduct: {
        title: 'Deductions for mistakes',
        body: 'Multiple choice, table, truth table, hot zone and composition can deduct points for wrong answers. A block\'s score never drops below 0.'
      },
      attempts: {
        title: 'Limit attempts',
        body: 'Under "Attempts, hint & worked solution": the number of attempts and optionally a deduction in % per further attempt. Once all are used, the block is locked.'
      },
      help: {
        title: 'Hint and worked solution',
        body: 'Appear as buttons on the block after a set number of failed checks, with KaTeX and the current variable values. A hint can cost points; the worked solution locks the answers.'
      },
      locks: {
        title: 'Locks',
        body: '"Lock answer after check" allows a single attempt. "Lock regeneration after check" stops learners from re-rolling until the values are especially easy.'
      },
      timer: {
        title: 'Time limits',
        body: 'For the whole learning unit (finished at 0) or per block (locks its answers; only runs while the task is shown).'
      },
      example: '<strong>Worked example:</strong> block with 2 points, 3 attempts, 25 % deduction per further attempt and 0.5 points for the hint. Correct in the 2nd attempt after opening the hint: 2 × 75 % − 0.5 = <strong>1 point</strong>.'
    },
    courseSettings: {
      title: 'Course settings: defaults for all tasks',
      lead: 'The course settings ("Edit course info") apply to the whole learning unit: title, pass threshold, defaults for question blocks, time limit, global variables, task pools and images.',
      inherit: {
        title: '"As in learning unit"',
        body: 'Settings like "Lock regeneration after check" or "Lock answer after check" are set to "As in learning unit (on/off)" in the block. Then the course value applies; "On" or "Off" in the block only applies to that block.'
      },
      threshold: {
        title: 'Pass threshold',
        body: 'Share of the points needed to pass, as a number between 0 and 1: 0.5 means 50 %. When finishing, the learning unit reports "passed" or "failed" accordingly.'
      },
      example: ''
    },
    pools: {
      title: 'Task pools',
      lead: 'With pools, not everyone works on the same tasks: per attempt, the set number of tasks is drawn at random from each pool. Tasks without a pool are always included.',
      setup: {
        title: 'Set up',
        body: 'In the course settings under "Task pools", add a pool with a name and a number. Then choose the pool in each task\'s header next to the title.'
      },
      run: {
        title: 'During an attempt',
        body: 'The selection stays the same when resuming. Navigation, progress and maximum points only cover the drawn tasks.'
      },
      example: '<strong>Example:</strong> 8 statics tasks in the pool "Statics" with number 3, plus an introduction and a closing task without a pool: everyone works on 5 tasks, the middle 3 chosen at random.'
    },
    templates: {
      title: 'Templates',
      lead: 'Two kinds of templates save work on recurring tasks.',
      task: {
        title: 'Task templates',
        body: 'A whole task with all its blocks: save it with "★ Template" in the task header. Insert it via "+ Task" as a new task, or in the block dialog under "My templates" into an existing task.'
      },
      block: {
        title: 'Block templates',
        body: 'A single block with all its settings: save it with ★ at the top of the block and insert it again in the block dialog under "My templates".'
      },
      storage: {
        title: 'Where they live',
        body: 'Templates are stored in the browser, not in the learning unit. They only apply to this browser and this address (localhost and 127.0.0.1 count separately) and are lost when the browser data is cleared.'
      },
      example: ''
    },
    saving: {
      title: 'Saving and backups',
      lead: 'The actual file of a learning unit is the SCORM ZIP. The same file goes to OLAT and can be opened and edited again at any time.',
      zip: {
        title: 'SCORM ZIP',
        body: '"Create SCORM ZIP" (Ctrl+Shift+S) saves the learning unit. Open it again via "File → Load SCORM ZIP …" or the folder view. Once the file was opened from the folder view or saved via the save dialog, Ctrl+S overwrites it directly.'
      },
      autosave: {
        title: 'Automatic backup',
        body: 'The builder keeps a backup in the browser. After a crash or closing by accident, it offers "Restore" on the next start. This does not replace the ZIP.'
      },
      guard: {
        title: 'Unsaved changes',
        body: 'Before "New" or opening another file, the builder asks if the current learning unit has not been saved as a ZIP yet.'
      },
      images: {
        title: 'Images',
        body: 'Large photos are shrunk to at most 2000 px on upload, which keeps the ZIP small. For detailed images there is "Keep original" at the image field.'
      },
      example: ''
    },
    lms: {
      title: 'In OLAT: what learners experience',
      lead: 'The learning unit runs in OLAT as a SCORM 1.2 package. "Preview" shows it beforehand exactly as learners will see it.',
      progress: {
        title: 'Progress',
        body: 'A bar shows how many tasks are done. Done means: all graded blocks of the task are solved.'
      },
      resume: {
        title: 'Pause and resume',
        body: 'Learners who close the learning unit continue later where they left off: with the same random values, points, locks, timers and answers. Solved tasks show their solution. Drag-and-drop matches are not saved.'
      },
      report: {
        title: 'What OLAT receives',
        body: 'Points achieved and maximum points, the status ("passed" or "failed" by the pass threshold when finishing, "incomplete" before) and the time spent.'
      },
      finish: {
        title: 'Finishing',
        body: '"Finish test" on the last task completes the learning unit and shows the result. After that, no resume state is kept.'
      },
      example: ''
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
    katex: {
      title: 'Formulas with KaTeX',
      lead: 'Formulas work in task texts, answer options, composition labels, table cells, hints and worked solutions. Put them between <code>$…$</code> (inline) or <code>$$…$$</code> (own line, centred). Random variables are written as <code>{a}</code>; the learning unit shows the drawn value there.',
      colInput: 'Input',
      colResult: 'Result',
      colNote: 'Used for',
      ex: {
        fraction: 'Fraction',
        scripts: 'Exponent and subscript',
        sqrt: 'Square root',
        greek: 'Greek letters, degrees',
        cdot: 'Multiplication dot',
        text: 'Vector arrow, plain text in a subscript',
        variables: 'Variables {a}, {b} (shown with a = 3, b = 4)',
        display: 'Display formula with a sum'
      },
      tip: {
        umlauts: 'Put words and umlauts inside formulas into <code>\\text{…}</code>, e.g. <code>$F_{\\text{bearing}}$</code>.',
        varsInMath: 'If the block has variables named a and b, <code>{a}</code> inside <code>\\frac{a}{b}</code> is replaced by the value as well. To keep the letter, add a space: <code>\\frac{ a}{ b}</code>.',
        dollar: 'Write a dollar sign that should not start a formula as <code>\\$</code>.',
        check: 'The builder preview shows right away whether a formula works; broken formulas appear in red.'
      },
      linkIntro: 'All commands KaTeX understands:',
      linkText: 'katex.org/docs/supported'
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
      save: 'Save (overwrites the opened ZIP file, otherwise a backup in the browser)',
      saveAs: 'Create SCORM ZIP',
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
    noBlockTemplatesHint: 'No templates of your own in this browser yet. To create a block template: select a block in a task and click ★ (Save as block template) at the top of the block. Templates are stored in the browser, so they only apply to this browser and this address (e.g. localhost:8765).',
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
    taskTemplateBadge: 'Task template',
    taskTemplateBlocks: 'Inserts {n} block(s) from this task template',
    gradedBadge: 'graded',
    deleteTemplateAction: 'Delete template',
    deleteBlockTemplateTitle: 'Delete block template?',
    deleteBlockTemplateMessage: '"{name}" will be permanently removed from your block templates.',
    noBlockMatch: 'No block type matches "{query}".'
  },

  taskPane: {
    taskLabel: 'Task {n}',
    titlePlaceholder: 'Task title (shown in the navigation)',
    poolTitle: 'Task pool (course settings): tasks of a pool are drawn at random per attempt',
    poolNone: 'No pool (always included)',
    poolOption: 'Pool: {name}',
    addBlock: '+ Block',
    addBlockTitle: 'Add a block',
    saveTemplate: '★ Template',
    saveTemplateTitle: 'Save task as a template',
    tabsDisable: 'Disable tabs',
    tabsEnable: '+ Enable tabs',
    tabsDisableTitle: 'Remove all tabs (only tab 1 and its blocks are kept)',
    tabsEnableTitle: 'Enable tabs (starts with "Visualisation" and "Task"; add more with +)',
    tabsDisableConfirmTitle: 'Disable tabs?',
    tabsDisableConfirmMessageSingular: 'The tabs after tab 1 contain {n} block. Disabling tabs will discard it.',
    tabsDisableConfirmMessagePlural: 'The tabs after tab 1 contain {n} blocks. Disabling tabs will discard them.',
    tabsDisableConfirmLabel: 'Disable',
    zoomOutTitle: 'Zoom out (Ctrl + mouse wheel)',
    zoomInTitle: 'Zoom in (Ctrl + mouse wheel)',
    zoomResetTitle: 'Zoom 100%',
    tabSwitchTitle: 'Switch tab',
    tabFallbackTitle: 'Tab {n}',
    tabRenameTitle: 'Click to rename',
    tabCloseTitle: 'Close tab',
    tabAddTitle: 'Add tab',
    tabCloseConfirmTitle: 'Close tab?',
    tabCloseConfirmMessageSingular: 'This tab contains {n} block. Closing it will discard it.',
    tabCloseConfirmMessagePlural: 'This tab contains {n} blocks. Closing it will discard them.',
    tabCloseConfirmLabel: 'Close',
    dropRejectedSingular: 'File ignored: only image files can be dropped on the canvas.',
    dropRejectedPlural: '{n} files ignored: only image files can be dropped on the canvas.',
    fileValidationError: '"{name}": {error}',
    fileReadError: '"{name}" could not be read.',
    imageAddedSingular: 'Image added as a block.',
    imageAddedPlural: '{n} images added as blocks.',
    canvas: {
      gradedSuffix: ' · graded',
      fitHeightTitle: 'Fit height to content (builder preview)',
      fitScormTitle: 'Fit height for SCORM: tall enough that the block never scrolls in the finished learning unit (measured as in the SCORM file, with room for feedback)',
      fitScormFailed: 'The height could not be measured for this block.',
      fitScormUnchanged: 'The height already fits.',
      fitScormDone: 'Height set to {h} px.',
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
        noSchema: 'This block has no configuration.',
        lockAnswersLabel: 'Lock answer after check',
        lockAnswersHelp: 'After checking, the answer can no longer be changed. "Inherit from learning unit" follows the setting in Course info.',
        timerEnabledLabel: 'Time limit for this block',
        timerEnabledHelp: 'Countdown shown in the block. It only runs while its task (or tab) is shown and pauses when switching. At 0 the answer is locked.',
        timerMinutes: 'Minutes',
        timerSeconds: 'Seconds'
      },
      support: {
        section: 'Attempts, hint & worked solution',
        attemptsLimit: 'Limit the number of attempts',
        attemptsLimitHelp: 'Every check counts as an attempt. Once all attempts are used, the answers (and "Regenerate") are locked.',
        maxAttempts: 'Number of attempts',
        attemptPenalty: 'Deduction per further attempt (%)',
        attemptPenaltyHelp: 'Example 25: at most 75 % of the points in the 2nd attempt, 50 % in the 3rd. 0 = no deduction.',
        hintEnabled: 'Offer a hint',
        hintEnabledHelp: 'After the set number of failed checks, a "Hint" button appears on the block. KaTeX and variables ({a}) with the current values are supported.',
        hintText: 'Hint text',
        hintAfter: 'Hint after … failed checks (0 = right away)',
        hintPenalty: 'Points deducted for opening the hint',
        solutionEnabled: 'Offer a worked solution',
        solutionEnabledHelp: '"Worked solution" button on the block. Opening it before the task is solved locks the answers. KaTeX and variables ({a}) are supported.',
        solutionText: 'Worked solution',
        solutionAfter: 'Worked solution after … failed checks',
        solutionAfterPlaceholder: 'empty = once all attempts are used (no limit: 3)',
        solutionWhenCorrect: 'Also show the worked solution after a correct answer'
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
    gridTable: {
      corner: 'Row / column',
      kindInherit: 'like column',
      kind: { text: 'Text', numeric: 'Number answer', textAnswer: 'Text answer', choice: 'Choice (dropdown)' },
      optionsPlaceholder: 'Correct | Wrong 1 | Wrong 2',
      graded: 'Points',
      gradedTitle: 'Ticked: the cell counts towards the points. Off: only checked and marked (e.g. a helper field).',
      cellPoints: 'Set points per cell individually',
      cellPointsTitle: 'On: every graded cell gets its own points; the total is their sum. Off: "Points (total)" is split equally.',
      pointsTitle: 'Points for this cell',
      textPlaceholder: 'Text ($…$, {a} allowed)',
      formulaPlaceholder: 'Formula, e.g. a*b',
      tolPlaceholder: '± (empty = default)',
      answersPlaceholder: 'Answer(s): a | b',
      addRow: 'Add row',
      addCol: 'Add column',
      removeRow: 'Remove row',
      removeCol: 'Remove column',
      hint: 'Choose the type per column at the top; a row can override it on the left. Text answers: separate several accepted answers with |. Choice: separate options with |, the first one is correct (shown shuffled). Untick "Points": the cell is checked but does not count.'
    },
    choiceMatrix: {
      corner: 'Row / column',
      rowPlaceholder: 'Row {n}',
      colPlaceholder: 'Column {n}',
      addRow: 'Add row',
      addCol: 'Add column',
      removeRow: 'Remove row',
      removeCol: 'Remove column',
      cellTitle: 'Ticked = correct answer',
      hint: 'Name the rows and columns; ticked boxes are the correct answers.'
    },
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
        embedded: 'Image embedded ({size})',
        keepOriginal: 'Keep original (do not shrink)',
        keepOriginalHelp: 'For detailed images that students should zoom into. Otherwise large images are shrunk to at most 2000 px automatically.',
        shrunk: 'Image shrunk: {from} → {to} ({w} × {h} px)'
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
      emptyCourseTitle: 'Course title is empty.',
      shadowsGlobalVar: 'Variable "{name}" hides the global variable of the same name (the block variable applies in this block).',
      globalVarNoName: 'Global variable {n}: name is missing.',
      globalVarBadName: 'Global variable "{name}": the name may only contain letters (a-z, A-Z), digits and underscores.',
      globalVarDuplicate: 'Global variable "{name}" is defined more than once.',
      globalVarRange: 'Global variable "{name}": min ({min}) is greater than max ({max}).',
      globalVarUnused: 'Global variable "{name}" is not used in any task.',
      poolUnnamed: 'Pool {n}',
      poolEmpty: 'Task pool "{name}" contains no tasks.',
      poolDrawTooBig: 'Task pool "{name}": {draw} tasks should be drawn, but it only contains {n}.'
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
    common: {
      graded: 'Further down, every graded block also has: "Lock answer after check", a time limit and "Attempts, hint & worked solution". "As in learning unit" follows the course settings.'
    },
    heading: {
      summary: 'Heading that structures a task.',
      steps: {
        1: 'Enter the text.',
        2: 'Choose the size: large (h2, default), medium (h3) or small (h4).'
      }
    },
    richText: {
      summary: 'Body text with formatting (bold, italic, lists, links) and formulas.',
      steps: {
        1: 'Enter the content; HTML is allowed.',
        2: 'Put formulas between <code>$…$</code>, e.g. <code>$a^2 + b^2 = c^2$</code>.'
      },
      tips: {
        1: 'Placeholders like <code>{a}</code> are not replaced by values here. For texts with random values, use the task text of a question block.'
      }
    },
    noteBox: {
      summary: 'Coloured box that makes important points stand out.',
      steps: {
        1: 'Choose the style: info (green), warning (yellow) or tip (blue).',
        2: 'Enter title and content; HTML and formulas are allowed.'
      }
    },
    image: {
      summary: 'Image with alt text and an optional caption; embedded in the SCORM package.',
      steps: {
        1: 'Upload a file, enter a URL or drop the image straight onto the canvas.',
        2: 'Enter an alt text for screen readers.'
      },
      tips: {
        1: 'Large photos are shrunk to at most 2000 px on upload. To switch this off: "Images" in the course settings, or "Keep original" at the image field.',
        2: '"Width" takes CSS values like <code>400px</code>, <code>60%</code> or <code>auto</code>.'
      }
    },
    audio: {
      summary: 'Audio player with the browser\'s controls.',
      steps: {
        1: 'Upload an audio file (mp3, ogg, wav) or enter a URL.',
        2: 'Optionally add a title and a caption.'
      },
      tips: {
        1: 'Uploaded files are embedded in the ZIP and make it larger accordingly.'
      }
    },
    video: {
      summary: 'Video player for own files or YouTube/Vimeo.',
      steps: {
        1: 'Upload a file (mp4 recommended) or paste a YouTube/Vimeo link; the format is detected automatically.',
        2: 'For own files, optionally set a poster image.'
      },
      tips: {
        1: 'Own videos live in the ZIP and make it large. YouTube/Vimeo do not, but need internet access while playing.'
      }
    },
    fileDownload: {
      summary: 'File to download, e.g. a PDF, worksheet or code sample.',
      steps: {
        1: 'Upload a file or enter a URL.',
        2: 'Enter a display name and optionally a description.'
      }
    },
    summary: {
      summary: 'Summary with a heading and bullet points, e.g. to close a learning unit.',
      steps: {
        1: 'Enter the heading.',
        2: 'For each bullet, enter a key statement (shown in bold) and optionally an explanation.'
      }
    },
    survey: {
      summary: 'Ungraded survey: star rating, single choice or free text.',
      steps: {
        1: 'Add questions and choose a question type for each.',
        2: 'For single choice, enter the options, one per line.'
      },
      tips: {
        1: 'Does not count towards the points. Good for self-assessments at the start or end of a unit.'
      }
    },
    divider: {
      summary: 'Horizontal line between sections.',
      steps: {
        1: 'Just place it; there are no settings.'
      }
    },
    code: {
      summary: 'Source code in a monospaced font; indentation is kept.',
      steps: {
        1: 'Optionally enter a title and a language; both appear as a label above the code.',
        2: 'Paste the code into the text field.'
      }
    },
    multipleChoice: {
      summary: 'Question with one or more correct answers; answers as text, image or both.',
      steps: {
        1: 'Write the question.',
        2: 'Add answers and mark the correct ones with "Is correct".',
        3: 'For several correct answers, turn on "Allow multiple selection".'
      },
      tips: {
        1: 'Partial credit: each correct tick earns points ÷ number of correct answers. "Deduct wrong selection" deducts per wrong tick; the score never drops below 0.',
        2: '"Limit the number of selectable answers" locks further boxes once the maximum is reached.',
        3: '"Shuffle answers" reorders the answers in every attempt.'
      }
    },
    numericInput: {
      summary: 'Calculation task with random variables; a formula computes the correct answer.',
      steps: {
        1: 'Write the question template with placeholders like <code>{a}</code> (KaTeX supported).',
        2: 'Add variables with a range (from, to, integer or decimal places).',
        3: 'Enter the solution formula, e.g. <code>a*b</code> or <code>sqrt(a^2+b^2)</code>, and set the tolerance.'
      },
      tips: {
        1: '"Additional answer fields": several results with their own formula, label (e.g. "x =") and unit; partial credit per field.',
        2: '"Whole-number solutions only" only draws values with a whole result. "Allow impossible tasks": if the formula has no result, "X" is the correct answer.',
        3: 'Angles in formulas are in degrees by default (<code>sin(30)</code> = 0.5); switchable to radians.',
        4: '"Simplify term": fractions must be entered in lowest terms.',
        5: 'Global variables from the course settings work like the block\'s own.'
      }
    },
    textInput: {
      summary: 'Free text answer; the evaluation mode decides how strictly it is compared.',
      steps: {
        1: 'Write the question.',
        2: 'Enter the accepted answers.',
        3: 'Choose the evaluation mode.'
      },
      tips: {
        1: '"Exact" (default) ignores upper/lower case. "Manual" chooses the comparison per entry.',
        2: '"Regular expression" for patterns like <code>\\d{4}</code> (four-digit number).',
        3: '"Keywords" gives partial credit for each term found.'
      }
    },
    cloze: {
      summary: 'Gap text with input fields or drop-down lists.',
      steps: {
        1: 'Write the text with gaps.',
        2: 'Insert gaps: <code>{{answer}}</code> input field, <code>{{a|b}}</code> input field with several correct spellings, <code>{{=right|wrong1|wrong2}}</code> drop-down (first option is correct).'
      },
      tips: {
        1: '"Ignore upper/lower case" accepts "berlin" as "Berlin".',
        2: '"Shuffle drop-down options" changes the order within the drop-downs.',
        3: 'Points are awarded proportionally per correct gap.'
      }
    },
    matchPairs: {
      summary: 'Matching by dragging or tapping: one-to-one or categorisation.',
      steps: {
        1: 'Choose the mode.',
        2: 'One-to-one: enter pairs with a left and a right side (text, image or both).',
        3: 'Categorisation: add categories with an ID, then assign elements via "Category ID(s)".'
      },
      tips: {
        1: 'An element can belong to several categories: separate the IDs with commas. Identical-looking elements are interchangeable.',
        2: 'Tapping works instead of dragging: first the element, then the target. Handy on tablets and with long lists.',
        3: '"Number of tasks per attempt" draws a selection; points are proportional (3 of 4 correct = 75 %).'
      }
    },
    hotzone: {
      summary: 'Image task: learners click the correct areas of an image.',
      steps: {
        1: 'Upload the image.',
        2: 'Use "Draw hot zones" to drag rectangles over the correct areas.'
      },
      tips: {
        1: 'Points per zone found; "Deduct points for wrong answers" counts misclicks.',
        2: 'Zones are stored relative to the image and still fit at another image size.',
        3: 'Optionally the check shows zones that were not found.'
      }
    },
    sortList: {
      summary: 'Sort list: drag elements into the correct order.',
      steps: {
        1: 'Enter the task text.',
        2: 'Add the items in the correct order; they are shown shuffled.'
      },
      tips: {
        1: 'Proportional points: share of items in the correct position × points.',
        2: 'Formulas (<code>$…$</code>) inside items are supported.'
      }
    },
    complexQuestion: {
      summary: 'Read a complex number from the complex plane.',
      steps: {
        1: 'Add a task pool with real and imaginary parts.',
        2: 'Choose what is asked (Cartesian, polar, both or conjugate) and set the tolerances.'
      },
      tips: {
        1: '"Choose at random" picks a number from the pool in every attempt.'
      }
    },
    functionQuestion: {
      summary: 'Function graph with a question about values, roots, intersections or extrema.',
      steps: {
        1: 'Enter the function, e.g. <code>x^2 - 3</code> or <code>sin(x)</code>.',
        2: 'Choose what is asked: function value, roots, y-intercept, extrema or a custom question.',
        3: 'Set the visible range (x/y).'
      },
      tips: {
        1: 'With several roots, all are expected; the order does not matter.',
        2: 'Extrema are entered as (x; y).'
      }
    },
    vectorQuestion: {
      summary: 'Read a vector from a 2D plot: components, magnitude, angle or unit vector.',
      steps: {
        1: 'Add a vector pool.',
        2: 'Choose what is asked.',
        3: 'Choose the angle unit (degrees or radians) and set the tolerances.'
      }
    },
    numberBase: {
      summary: 'Conversion between binary, octal, decimal and hexadecimal.',
      steps: {
        1: 'Choose a conversion preset or set your own directions.',
        2: 'Enter the value range (decimal).'
      },
      tips: {
        1: 'Hex answers are checked case-insensitively; the prefix <code>0x</code> is allowed.'
      }
    },
    unitConvert: {
      summary: 'Convert units: length, time, mass, speed, energy, pressure, temperature and more.',
      steps: {
        1: 'Add conversions: direction (from → to) and value range.',
        2: 'Write the question template with <code>{value}</code>, <code>{fromUnit}</code> and <code>{toUnit}</code>.'
      },
      tips: {
        1: 'The tolerance is relative: 0.01 means 1 % deviation.',
        2: 'Comma and point are both accepted as decimal separator.',
        3: '"Swap direction at random" also asks the reverse way.'
      }
    },
    truthTable: {
      summary: 'Boolean truth table: learners fill in the result column.',
      steps: {
        1: 'Enter an expression, e.g. <code>a and b</code> or <code>not (a or b)</code>.',
        2: 'Enter the variable names separated by commas.'
      },
      tips: {
        1: 'Allowed operators: and, or, not, xor (and &&, ||, !).',
        2: 'Proportional points per correct row; optional deduction for wrong rows. N variables give 2^N rows.'
      }
    },
    table: {
      summary: 'Table of four kinds: value table, true/false statements, choice matrix or free table.',
      steps: {
        1: 'Choose the "Table type".',
        2: 'Value table: add variables and columns (random value, formula, text or answer column) and set the number of rows.',
        3: 'True/false: enter statements and choose true or false for each.',
        4: 'Choice matrix: add rows and columns and set the correct ticks in the grid.',
        5: 'Free table: add rows and columns freely; each cell is text, a number answer (with formula), a text answer or a drop-down.'
      },
      tips: {
        1: 'Value table: formulas use the values of the same row; every row is drawn anew.',
        2: 'Free table: "Points" at a cell decides whether it counts; "Set points per cell" gives every cell its own points.',
        3: 'True/false, matrix and free table can deduct points for wrong answers.'
      }
    },
    equationSystem: {
      summary: 'Linear system of equations with 2 or 3 variables, generated at random or with own variants.',
      steps: {
        1: 'Choose the mode: random values or own variants.',
        2: 'Random: set the variables and the coefficient and solution ranges.',
        3: 'Own variants: enter the equations directly, e.g. <code>2x + y = 5</code>.'
      },
      tips: {
        1: 'Own variants are checked live; a system without a unique solution is reported.',
        2: 'Points are awarded proportionally per correctly solved variable.'
      }
    },
    functionSandbox: {
      summary: 'Interactive function plot to explore: learners move sliders and see the effect at once.',
      steps: {
        1: 'Enter the function with parameters.',
        2: 'Add sliders with range, step and start value.',
        3: 'Set the visible x/y range.'
      },
      tips: {
        1: 'Not graded, purely a learning tool. Pairs well with a function question.'
      }
    },
    composition: {
      summary: 'Canvas for own sketches and constructions, optionally with answer fields, yes/no fields, click or hotspot tasks.',
      steps: {
        1: 'Insert a template or add shapes via the toolbar.',
        2: 'Double-click a label to edit it: <code>{a}</code> for variables, <code>{1}</code> for answer fields; formulas and formatting (B, I, x²) are supported.',
        3: 'Choose the grading mode; with "With solution", set each answer field\'s solution via "Formula ▾".'
      },
      tips: {
        1: 'In the label editor: Enter saves, Shift+Enter adds a line, and a live preview appears below.',
        2: '<code>{1*}</code> shows the answer from field 1 and can be reused in later formulas.',
        3: 'A yes/no field is added via the toolbar; set its correct answer and points at the shape.'
      }
    },
    complexInput: {
      summary: 'Complex number as the answer; built like the numeric input, but with complex numbers.',
      steps: {
        1: 'Write the question template, e.g. <code>Compute $({a} + {b}i)({c} - {d}i)$</code>.',
        2: 'Add real variables with ranges.',
        3: 'Enter the solution formula, e.g. <code>(a + b*i) * (c - d*i)</code>.'
      },
      tips: {
        1: 'Input formats for learners: <code>3+4i</code>, <code>-i</code>, <code>1/2+3/4i</code>.',
        2: '"Whole-number solutions only": the real and imaginary part of the solution are whole numbers.'
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
