// block-help.js: Inline help text for every block type, shown in the
// right config pane as a collapsible "Was ist das?" box. Keeps new authors
// oriented without forcing them to leave the builder for the README.
//
// Format per entry:
//   summary  one-sentence what-it-is (always shown when expanded)
//   steps    ordered list, the minimum sequence to get a working block
//   tips     optional bulleted hints, common pitfalls, recommended toggles
//
// The texts live in builder/i18n/de.js + en.js under blockHelp (keys here,
// one per step/tip). Keep them short and in sync with the block's fields.
// If a block has no entry the help box simply does not render. Graded
// blocks additionally show blockHelp.common.graded (commonGradedHelp).

import { t } from './i18n.js';

// Shown under every graded block's help (attempts, hint, locks).
export function commonGradedHelp(){ return t('blockHelp.common.graded'); }

export const BLOCK_HELP = {
  get 'heading'(){ return {
    summary: t('blockHelp.heading.summary'),
    steps: [
      t('blockHelp.heading.steps.1'),
      t('blockHelp.heading.steps.2')
    ]
  }; },
  get 'rich-text'(){ return {
    summary: t('blockHelp.richText.summary'),
    steps: [
      t('blockHelp.richText.steps.1'),
      t('blockHelp.richText.steps.2')
    ],
    tips: [
      t('blockHelp.richText.tips.1')
    ]
  }; },
  get 'note-box'(){ return {
    summary: t('blockHelp.noteBox.summary'),
    steps: [
      t('blockHelp.noteBox.steps.1'),
      t('blockHelp.noteBox.steps.2')
    ]
  }; },
  get 'image'(){ return {
    summary: t('blockHelp.image.summary'),
    steps: [
      t('blockHelp.image.steps.1'),
      t('blockHelp.image.steps.2')
    ],
    tips: [
      t('blockHelp.image.tips.1'),
      t('blockHelp.image.tips.2')
    ]
  }; },
  get 'audio'(){ return {
    summary: t('blockHelp.audio.summary'),
    steps: [
      t('blockHelp.audio.steps.1'),
      t('blockHelp.audio.steps.2')
    ],
    tips: [
      t('blockHelp.audio.tips.1')
    ]
  }; },
  get 'video'(){ return {
    summary: t('blockHelp.video.summary'),
    steps: [
      t('blockHelp.video.steps.1'),
      t('blockHelp.video.steps.2')
    ],
    tips: [
      t('blockHelp.video.tips.1')
    ]
  }; },
  get 'file-download'(){ return {
    summary: t('blockHelp.fileDownload.summary'),
    steps: [
      t('blockHelp.fileDownload.steps.1'),
      t('blockHelp.fileDownload.steps.2')
    ]
  }; },
  get 'summary'(){ return {
    summary: t('blockHelp.summary.summary'),
    steps: [
      t('blockHelp.summary.steps.1'),
      t('blockHelp.summary.steps.2')
    ]
  }; },
  get 'survey'(){ return {
    summary: t('blockHelp.survey.summary'),
    steps: [
      t('blockHelp.survey.steps.1'),
      t('blockHelp.survey.steps.2')
    ],
    tips: [
      t('blockHelp.survey.tips.1')
    ]
  }; },
  get 'divider'(){ return {
    summary: t('blockHelp.divider.summary'),
    steps: [
      t('blockHelp.divider.steps.1')
    ]
  }; },
  get 'code'(){ return {
    summary: t('blockHelp.code.summary'),
    steps: [
      t('blockHelp.code.steps.1'),
      t('blockHelp.code.steps.2')
    ]
  }; },
  get 'multiple-choice'(){ return {
    summary: t('blockHelp.multipleChoice.summary'),
    steps: [
      t('blockHelp.multipleChoice.steps.1'),
      t('blockHelp.multipleChoice.steps.2'),
      t('blockHelp.multipleChoice.steps.3')
    ],
    tips: [
      t('blockHelp.multipleChoice.tips.1'),
      t('blockHelp.multipleChoice.tips.2'),
      t('blockHelp.multipleChoice.tips.3')
    ]
  }; },
  get 'numeric-input'(){ return {
    summary: t('blockHelp.numericInput.summary'),
    steps: [
      t('blockHelp.numericInput.steps.1'),
      t('blockHelp.numericInput.steps.2'),
      t('blockHelp.numericInput.steps.3')
    ],
    tips: [
      t('blockHelp.numericInput.tips.1'),
      t('blockHelp.numericInput.tips.2'),
      t('blockHelp.numericInput.tips.3'),
      t('blockHelp.numericInput.tips.4'),
      t('blockHelp.numericInput.tips.5')
    ]
  }; },
  get 'text-input'(){ return {
    summary: t('blockHelp.textInput.summary'),
    steps: [
      t('blockHelp.textInput.steps.1'),
      t('blockHelp.textInput.steps.2'),
      t('blockHelp.textInput.steps.3')
    ],
    tips: [
      t('blockHelp.textInput.tips.1'),
      t('blockHelp.textInput.tips.2'),
      t('blockHelp.textInput.tips.3')
    ]
  }; },
  get 'cloze'(){ return {
    summary: t('blockHelp.cloze.summary'),
    steps: [
      t('blockHelp.cloze.steps.1'),
      t('blockHelp.cloze.steps.2')
    ],
    tips: [
      t('blockHelp.cloze.tips.1'),
      t('blockHelp.cloze.tips.2'),
      t('blockHelp.cloze.tips.3')
    ]
  }; },
  get 'match-pairs'(){ return {
    summary: t('blockHelp.matchPairs.summary'),
    steps: [
      t('blockHelp.matchPairs.steps.1'),
      t('blockHelp.matchPairs.steps.2'),
      t('blockHelp.matchPairs.steps.3')
    ],
    tips: [
      t('blockHelp.matchPairs.tips.1'),
      t('blockHelp.matchPairs.tips.2'),
      t('blockHelp.matchPairs.tips.3')
    ]
  }; },
  get 'hotzone'(){ return {
    summary: t('blockHelp.hotzone.summary'),
    steps: [
      t('blockHelp.hotzone.steps.1'),
      t('blockHelp.hotzone.steps.2')
    ],
    tips: [
      t('blockHelp.hotzone.tips.1'),
      t('blockHelp.hotzone.tips.2'),
      t('blockHelp.hotzone.tips.3')
    ]
  }; },
  get 'sort-list'(){ return {
    summary: t('blockHelp.sortList.summary'),
    steps: [
      t('blockHelp.sortList.steps.1'),
      t('blockHelp.sortList.steps.2')
    ],
    tips: [
      t('blockHelp.sortList.tips.1'),
      t('blockHelp.sortList.tips.2')
    ]
  }; },
  get 'complex-question'(){ return {
    summary: t('blockHelp.complexQuestion.summary'),
    steps: [
      t('blockHelp.complexQuestion.steps.1'),
      t('blockHelp.complexQuestion.steps.2')
    ],
    tips: [
      t('blockHelp.complexQuestion.tips.1')
    ]
  }; },
  get 'function-question'(){ return {
    summary: t('blockHelp.functionQuestion.summary'),
    steps: [
      t('blockHelp.functionQuestion.steps.1'),
      t('blockHelp.functionQuestion.steps.2'),
      t('blockHelp.functionQuestion.steps.3')
    ],
    tips: [
      t('blockHelp.functionQuestion.tips.1'),
      t('blockHelp.functionQuestion.tips.2')
    ]
  }; },
  get 'vector-question'(){ return {
    summary: t('blockHelp.vectorQuestion.summary'),
    steps: [
      t('blockHelp.vectorQuestion.steps.1'),
      t('blockHelp.vectorQuestion.steps.2'),
      t('blockHelp.vectorQuestion.steps.3')
    ]
  }; },
  get 'number-base'(){ return {
    summary: t('blockHelp.numberBase.summary'),
    steps: [
      t('blockHelp.numberBase.steps.1'),
      t('blockHelp.numberBase.steps.2')
    ],
    tips: [
      t('blockHelp.numberBase.tips.1')
    ]
  }; },
  get 'unit-convert'(){ return {
    summary: t('blockHelp.unitConvert.summary'),
    steps: [
      t('blockHelp.unitConvert.steps.1'),
      t('blockHelp.unitConvert.steps.2')
    ],
    tips: [
      t('blockHelp.unitConvert.tips.1'),
      t('blockHelp.unitConvert.tips.2'),
      t('blockHelp.unitConvert.tips.3')
    ]
  }; },
  get 'truth-table'(){ return {
    summary: t('blockHelp.truthTable.summary'),
    steps: [
      t('blockHelp.truthTable.steps.1'),
      t('blockHelp.truthTable.steps.2')
    ],
    tips: [
      t('blockHelp.truthTable.tips.1'),
      t('blockHelp.truthTable.tips.2')
    ]
  }; },
  get 'table'(){ return {
    summary: t('blockHelp.table.summary'),
    steps: [
      t('blockHelp.table.steps.1'),
      t('blockHelp.table.steps.2'),
      t('blockHelp.table.steps.3'),
      t('blockHelp.table.steps.4'),
      t('blockHelp.table.steps.5')
    ],
    tips: [
      t('blockHelp.table.tips.1'),
      t('blockHelp.table.tips.2'),
      t('blockHelp.table.tips.3')
    ]
  }; },
  get 'equation-system'(){ return {
    summary: t('blockHelp.equationSystem.summary'),
    steps: [
      t('blockHelp.equationSystem.steps.1'),
      t('blockHelp.equationSystem.steps.2'),
      t('blockHelp.equationSystem.steps.3')
    ],
    tips: [
      t('blockHelp.equationSystem.tips.1'),
      t('blockHelp.equationSystem.tips.2')
    ]
  }; },
  get 'function-sandbox'(){ return {
    summary: t('blockHelp.functionSandbox.summary'),
    steps: [
      t('blockHelp.functionSandbox.steps.1'),
      t('blockHelp.functionSandbox.steps.2'),
      t('blockHelp.functionSandbox.steps.3')
    ],
    tips: [
      t('blockHelp.functionSandbox.tips.1')
    ]
  }; },
  get 'composition'(){ return {
    summary: t('blockHelp.composition.summary'),
    steps: [
      t('blockHelp.composition.steps.1'),
      t('blockHelp.composition.steps.2'),
      t('blockHelp.composition.steps.3')
    ],
    tips: [
      t('blockHelp.composition.tips.1'),
      t('blockHelp.composition.tips.2'),
      t('blockHelp.composition.tips.3')
    ]
  }; },
  get 'complex-input'(){ return {
    summary: t('blockHelp.complexInput.summary'),
    steps: [
      t('blockHelp.complexInput.steps.1'),
      t('blockHelp.complexInput.steps.2'),
      t('blockHelp.complexInput.steps.3')
    ],
    tips: [
      t('blockHelp.complexInput.tips.1'),
      t('blockHelp.complexInput.tips.2')
    ]
  }; }
};
