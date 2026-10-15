// template/i18n/en.js: English runtime chrome bundle (SCORM player side).
(function(){
  'use strict';
  var bundle = {
    meta: { name: 'English', label: 'EN' },

    common: {
      check: 'Check',
      regenerate: 'Regenerate',
      submit: 'Submit',
      answer: 'Answer',
      answerPlaceholder: 'Type your answer',
      question: 'Question',
      task: 'Task',
      points: 'Points',
      of: 'of',
      correct: 'Correct.',
      wrong: 'Incorrect.',
      partial: 'Partly correct.'
    },

    footer: {
      previous: 'Back',
      next: 'Next',
      finish: 'Finish test'
    },

    progress: {
      taskLabel: 'Task {current} of {total}',
      doneSuffix: '{done} completed ({pct}%)',
      ariaLabel: 'Progress'
    },

    header: {
      nav: 'Task navigation',
      pointsPill: 'Points: {pts} / {max}'
    },

    feedback: {
      title: 'Feedback',
      initial: 'No check performed yet.',
      chooseAtLeastOne: 'Please select at least one answer.',
      correctScored: 'Correct. {pts} / {max} points.',
      partialScored: 'Partly correct: {pts} / {max} points.',
      wrongScored: 'Incorrect. {pts} / {max} points.',
      notFullyCorrect: 'Answer is not fully correct. {pts} / {max} points.'
    },

    finish: {
      title: 'Test finished',
      scoreLine: 'Score: {pts} of {max} ({pct}%)',
      scoreLineHtml: 'Score: <strong>{pts} of {max}</strong> ({pct}%)',
      passed: 'Passed',
      failed: 'Not passed.',
      closeHint: 'You can close this window now and return to the course.'
    },

    error: {
      configNotLoadable: 'Configuration could not be loaded',
      unknownBlockType: 'Unknown block type: {type}',
      unknownBlockTypeHtml: 'Unknown block type: {type}',
      blockMountFailed: 'Block {type} failed: {msg}',
      blockMountFailedHtml: 'Block {type} failed: {msg}'
    },

    lang: {
      switcherLabel: 'Language:'
    },

    utils: {
      regen: {
        on: 'On',
        off: 'Off',
        inherit: 'Inherit from learning unit ({state})',
        lockAfterCheckLabel: 'Lock Regenerate button after check',
        lockAfterCheckHelp: 'After the first check, no new task can be generated. "Inherit from learning unit" follows the setting in Course info.',
        noRegenerateLabel: 'Hide Regenerate button',
        noRegenerateHelp: 'No "Regenerate" button; the first random task must be solved. "Inherit from learning unit" follows Course info.',
        lockedTitle: 'Locked after check'
      },
      varFormat: {
        decimals: {
          label: 'Decimal places (random numbers)',
          help: 'How many decimal places non-integer variables get (0–6). Individual variables can differ.'
        },
        display: {
          label: 'Display of decimal numbers',
          help: 'How non-integer variables appear in the text. Individual variables can differ.',
          auto: 'Automatic (simple fraction, otherwise decimal)',
          decimal: 'Always as decimal (e.g. 0.75)',
          fraction: 'Always as fraction (e.g. 3/4)'
        },
        item: {
          decimals: { label: 'Decimal places (empty = like the task)' },
          display: {
            label: 'Display',
            inherit: 'Like the task',
            auto: 'Automatic',
            decimal: 'Decimal',
            fraction: 'Fraction'
          }
        }
      },
      resume: {
        solved: 'Already solved – the solution has been filled in.'
      },
      integerAnswers: {
        label: 'Whole-number solutions only',
        help: 'Only tasks whose solutions are whole numbers are generated.'
      },
      penalty: {
        label: 'Deduct points for wrong answers',
        help: 'Every wrong answer deducts points; the total never drops below 0. Unanswered counts 0.',
        pointsLabel: 'Deduction per wrong answer (points)',
        pointsPlaceholder: 'empty = as much as one correct answer earns',
        pointsHelp: 'Leave empty: the deduction equals the value of one correct answer.'
      },
      angleUnit: {
        label: 'Angles in formulas',
        help: 'Applies to sin, cos, tan, arcsin, arccos, arctan (= asin, acos, atan). sind(), cosd() … always use degrees.',
        deg: 'Degrees (°), e.g. sin(30) = 0.5',
        rad: 'Radians, e.g. sin(pi/6) = 0.5'
      }
    },

    runtime: {
      legacyNoteTitle: 'Note',
      tabs: {
        fallbackTitle: 'Tab {n}'
      },
      timer: {
        courseLabel: 'Time left: {time}',
        courseExpired: 'Time is up. The learning unit was finished automatically.',
        blockLabel: '{time}',
        blockExpired: 'Time is up'
      },
      help: {
        attempts: 'Attempt {n} / {max}',
        attemptsUsed: 'No attempts left',
        attemptPenalty: '−{pct} % per further attempt',
        hintButton: 'Hint',
        solutionButton: 'Worked solution',
        hintTitle: 'Hint',
        solutionTitle: 'Worked solution',
        hintPenalty: 'Opening the hint costs {pts} point(s).',
        solutionLocks: 'Once the worked solution is opened, the answers are locked.',
        open: 'Show',
        cancel: 'Cancel',
        close: 'Close'
      },
      globalRegen: {
        button: 'Regenerate global values',
        title: 'Draws new values for the global variables and resets every task that uses them.',
        lockedTitle: 'Locked: a task that uses them has already been checked or has locked answers.',
        confirmTitle: 'Regenerate global values?',
        confirmMessage: 'Answers and points in {n} task(s) will be reset:',
        confirm: 'Regenerate',
        cancel: 'Cancel'
      },
      error: {
        unknownBlockTypeHtml: 'Unknown block type: {type}',
        blockMountFailedHtml: 'Block {type} failed: {msg}'
      },
      finish: {
        scoreLineHtml: 'Score: <strong>{pts} of {max}</strong> ({pct}%)'
      },
      defaultCourseTitle: 'SCORM learning unit'
    },

    taskList: {
      fallbackTitle: 'Task {n}'
    },

    html: {
      title: 'SCORM learning unit',
      brandKicker: 'Umwelt-Campus Birkenfeld',
      courseTitle: 'SCORM learning unit'
    },

    block: {
      audio: {
        label: 'Audio',
        description: 'Play an audio file, for example a voice recording or listening sample. File upload or URL.',
        field: {
          title: {
            label: 'Title (above the player, optional)'
          },
          src: {
            label: 'Audio source (data URL or URL/path)',
            help: 'Uploaded audio files are embedded as a data URL in the SCORM package. URL must be MP3/WAV/OGG.'
          },
          caption: {
            label: 'Caption (below the player, optional)'
          }
        },
        placeholder: {
          notSet: '(Audio not set yet)'
        },
        preview: {
          noAudio: '(no audio file yet)'
        }
      },
      category: {
        content: 'Media & content',
        question: 'Question',
        mint: 'STEM',
        visualization: 'Visualization'
      },
      cloze: {
        label: 'Cloze text',
        description: 'Cloze text with free input, alternatives or dropdown choice.',
        defaultTitle: 'Cloze text',
        dropdownPlaceholder: 'select...',
        summary: {
          empty: '(empty)'
        },
        validate: {
          noGaps: 'No gaps in the text ({{answer}}).'
        },
        feedback: {
          noGaps: 'No gaps in the text.',
          fillAtLeastOne: 'Please fill in at least one gap.',
          allCorrect: 'All gaps correct.',
          someCorrect: '{correct} of {total} correct.'
        },
        preview: {
          dropdownTag: 'Dropdown'
        },
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Cloze text'
          },
          preset: {
            label: 'Template',
            help: 'Gap syntax: {{answer}} = text input, {{a|b}} = alternatives, {{=correct|wrong}} = dropdown.',
            option: {
              custom: 'Manual (empty)',
              'math-terms': 'Example: mathematics, quadratic function',
              'ohm-law': 'Example: physics, Ohm\'s law'
            }
          },
          reset: {
            label: '↺ Reset'
          },
          sec_text: {
            label: 'Cloze text'
          },
          text: {
            label: 'Text with gaps',
            help: 'Gap syntax:\n• {{answer}} -> text input\n• {{a|b|c}} -> input with alternatives (all correct)\n• {{=correct|wrong1|wrong2}} -> dropdown (first option = correct)'
          },
          sec_opts: {
            label: 'Settings and scoring'
          },
          ignoreCase: {
            label: 'Ignore case'
          },
          shuffleDropdown: {
            label: 'Shuffle dropdown options'
          },
          maxPoints: {
            label: 'Points (total for all gaps)'
          }
        }
      },
      code: {
        label: 'Code block',
        description: 'Source code in monospace font, optionally with a language tag.',
        field: {
          title: {
            label: 'Title (optional)'
          },
          language: {
            label: 'Language (e.g. javascript, python, c)'
          },
          code: {
            label: 'Code'
          }
        },
        previewFallbackTitle: 'Code'
      },
      'complex-input': {
        label: 'Complex input',
        description: 'Complex number as answer. Variables, formula, domain check.',
        defaultTitle: 'Complex input',
        inputLabel: 'Answer (e.g. 3+4i)',
        inputPlaceholder: 'Complex number: 3+4i, -i, 5, 1/2 - 3/4i',
        summary: {
          empty: '(question empty)'
        },
        validate: {
          missingQuestion: 'Question template is missing.',
          missingFormula: 'Solution formula is missing.',
          formulaAlwaysInvalid: 'The formula ALWAYS yields an invalid result within the current variable ranges. Adjust the formula or the ranges.',
          formulaFailsRatio: 'The formula fails in {pct}% of samples. Narrow the variable ranges or adjust the formula.'
        },
        feedback: {
          notGeneratable: 'Task cannot be generated: the formula produces no valid result within the current variable ranges. Please adjust the formula or the variables.',
          notGeneratableInteger: 'Task cannot be generated: the current variable ranges give no solution with a whole-number real and imaginary part. Adjust the ranges or the formula, or turn off "Whole-number solutions only".',
          newGenerated: 'New task generated.',
          noTaskLoaded: 'No task loaded.',
          invalidComplex: 'Please enter a complex number, e.g. "3+4i", "-i" or "5".',
          correctWithSolution: 'Correct. (Solution: {solution})',
          wrongWithSolution: 'Incorrect. (Solution: {solution})'
        },
        preview: {
          sampleQuestion: 'Compute $(3 + 4i)(2 - i)$.',
          acceptedHint: 'Accepted: a+bi, -i, fractions such as 1/2+3/4i.'
        },
        field: {
          integerAnswers: { help: 'Only tasks whose solution has a whole-number real and imaginary part are generated (e.g. 3 - 2i).' },
          blockTitle: {
            label: 'Heading',
            placeholder: 'Complex input'
          },
          _sec_q: {
            label: 'Question'
          },
          questionTemplate: {
            label: 'Question template',
            placeholder: 'Compute $({a}+{b}i)({c}-{d}i)$.',
            help: 'Insert variables with {a}, {b}, ... Use $...$ for KaTeX math, e.g. $z = {a} + {b}i$.'
          },
          _sec_vars: {
            label: 'Variables'
          },
          variables: {
            label: 'Real variables',
            itemLabel: 'Variable',
            help: 'Real values used in the question and formula. New values are drawn on every regenerate.',
            item: {
              name: {
                label: 'Name',
                placeholder: 'a'
              },
              min: {
                label: 'Min'
              },
              max: {
                label: 'Max'
              },
              integer: {
                label: 'Integers only'
              }
            }
          },
          _sec_sol: {
            label: 'Solution'
          },
          formula: {
            label: 'Solution formula (complex)',
            placeholder: '(a+b*i)*(c-d*i)',
            help: 'i is the imaginary unit. Operators: + - * / ^. Functions: re(z), im(z), abs(z), conj(z), arg(z), sqrt(z), exp(z), ln(z), sin(x), cos(x). Variables from the list are inserted as real values.'
          },
          tolerance: {
            label: 'Tolerance  (|Δ|)',
            help: 'Accepted distance between answer and solution in the complex plane.'
          },
          _sec_score: {
            label: 'Scoring'
          },
          maxPoints: {
            label: 'Points'
          }
        }
      },
      'complex-question': {
        label: 'Read complex number',
        description: 'Show plot in Gaussian plane and query Re/Im/|z|/φ.',
        summary: '{n} points in pool',
        plotTitle: 'Task plot',
        inputHeading: 'Input',
        newTaskGenerated: 'New task generated.',
        fillAtLeastOne: 'Please fill in at least one field.',
        partMissing: '{label} is missing.',
        partCorrect: '{label} correct.',
        partWrong: '{label} not yet correct.',
        partialScoredDetail: 'Partly correct ({ok} of {total}): {pts} / {max} points. {parts}',
        wrongScoredDetail: '0 / {max} points. {parts}',
        placeholder: {
          real: 'e.g. 2',
          imag: 'e.g. -1',
          abs: 'e.g. 2.24',
          arg: 'e.g. pi/2'
        },
        previewTag: 'Read z = a + bi',
        questionText: {
          cartesian: 'Read the real and imaginary parts of the complex number.',
          polar: 'Determine the magnitude |z| and the argument φ.',
          conjugate: 'Determine the complex conjugate z̄ = a - bi.',
          all: 'Read the cartesian and polar form of the complex number.'
        },
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Complex numbers'
          },
          pool: {
            label: 'Task pool  (z = a + bi)',
            itemLabel: 'Point',
            item: {
              a: {
                label: 'Re(z)  =  a'
              },
              b: {
                label: 'Im(z)  =  b'
              }
            }
          },
          randomize: {
            label: 'Pick at random'
          },
          _sec_query: {
            label: 'Query'
          },
          questionMode: {
            label: 'What is asked?',
            option: {
              all: 'Cartesian and polar  (Re, Im, |z|, φ)',
              cartesian: 'Cartesian only  (Re(z) and Im(z))',
              polar: 'Polar only  (|z| and φ)',
              conjugate: 'Complex conjugate  z̄'
            }
          },
          _sec_fields: {
            label: 'Fields and tolerances'
          },
          fields: {
            label: 'Show or hide individual fields',
            help: 'Only applies to "Cartesian and polar". Every other mode chooses the fields automatically.',
            item: {
              real: {
                label: 'Re(z)'
              },
              imag: {
                label: 'Im(z)'
              },
              abs: {
                label: '|z|'
              },
              arg: {
                label: 'φ'
              }
            }
          },
          tolerances: {
            label: 'Tolerances  (±)',
            item: {
              real: {
                label: 'Re(z)'
              },
              imag: {
                label: 'Im(z)'
              },
              abs: {
                label: '|z|'
              },
              arg: {
                label: 'φ (rad)'
              }
            }
          },
          _sec_score: {
            label: 'Display and scoring'
          },
          plotRange: {
            label: 'Plot range (±)'
          },
          maxPoints: {
            label: 'Points'
          }
        }
      },
      divider: {
        label: 'Divider',
        description: 'Horizontal divider with some spacing.',
        summary: 'Divider'
      },
      'equation-system': {
        label: 'Equation system',
        description: 'Linear equation system, generated randomly or from your own variants.',
        defaultTitle: 'Equation system',
        defaultQuestion: 'Solve the following equation system.',
        noValidSystem: 'No valid equation system configured.',
        noValidVariant: 'No valid variant configured.',
        inputPlaceholder: 'Number or fraction',
        enterAtLeastOne: 'Please enter at least one variable.',
        allCorrect: 'All variables correct. {max} / {max} points. Solution: {solution}',
        partialCorrect: '{correct} of {total} correct. {pts} / {max} points. Expected: {solution}',
        newSystemGenerated: 'New system generated.',
        summary: {
          variantsCountOne: '{count} variant',
          variantsCountMany: '{count} variants',
          randomWithVars: '{count} variables, random'
        },
        validate: {
          manualNoVariants: 'Manual mode: no variant defined.',
          variantPrefix: 'Variant {index}: {err}',
          varCountRange: 'Variable count must be 2 or 3.',
          coeffRangeInvalid: 'Coefficient range is invalid.'
        },
        parser: {
          unexpectedChar: 'unexpected character "{char}"',
          emptyTermAfterSign: 'empty term after sign',
          invalidNumber: 'invalid number "{num}"',
          unknownVariable: 'unknown variable "{name}"',
          emptyEquation: 'empty equation',
          noEquals: 'no "=" found',
          multipleEquals: 'more than one "=", please one equation per line',
          leftSide: 'left side: {err}',
          rightSide: 'right side: {err}',
          noVariables: 'no variables defined',
          tooManyVariables: 'at most 4 variables supported',
          duplicateVariables: 'duplicate variable names',
          invalidVariableName: 'invalid variable name "{name}"',
          noEquation: 'no equation given',
          linePrefix: 'Line {line}: {err}',
          systemInvalid: 'system invalid',
          systemInconsistent: 'contradiction in the equations; system is not solvable',
          underdeterminedOne: 'not uniquely solvable ({count} free variable)',
          underdeterminedMany: 'not uniquely solvable ({count} free variables)'
        },
        preview: {
          defaultQuestion: 'Solve the following equation system.'
        },
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Equation system'
          },
          mode: {
            label: 'Mode',
            help: '"Random" generates new coefficients on every start. "Own variants" picks from systems you defined.',
            option: {
              random: 'Random values (builder generates the system)',
              manual: 'Own variants (you write the system)'
            }
          },
          preset: {
            label: 'Template',
            option: {
              custom: 'Manual (empty)',
              'simple-2': 'Example: 2 variables, small numbers',
              'standard-2': 'Example: 2 variables, standard range',
              'standard-3': 'Example: 3 variables'
            }
          },
          reset: {
            label: 'Reset'
          },
          _sec_q: {
            label: 'Question'
          },
          question: {
            label: 'Task text'
          },
          _sec_sys: {
            label: 'System (random)'
          },
          variableCount: {
            label: 'Number of variables (2 or 3)'
          },
          variableNames: {
            label: 'Variable names (comma-separated)',
            placeholder: 'x,y or x,y,z'
          },
          _sec_ranges: {
            label: 'Value ranges'
          },
          coeffMin: {
            label: 'Coefficient min'
          },
          coeffMax: {
            label: 'Coefficient max'
          },
          solutionMin: {
            label: 'Solution min'
          },
          solutionMax: {
            label: 'Solution max'
          },
          integerSolution: {
            label: 'Solutions are integers'
          },
          _sec_var: {
            label: 'Variants',
            help: 'On each "Regenerate", a variant is chosen at random. Every variant is checked live. The summary shows the computed solution or a warning if the system does not have a unique solution.'
          },
          variants: {
            label: 'Variants',
            itemLabel: 'Variant',
            item: {
              variableNames: {
                label: 'Variables (comma-separated)',
                placeholder: 'x,y'
              },
              equations: {
                label: 'Equations (one per line)',
                placeholder: '2x + 3y = 7\nx - y = 1',
                help: 'Examples: "2x + 3y = 7", "x = 5", "-0.5x + y = 2", "2x = y + 1". Multiplication does not need to be written with *.'
              }
            }
          },
          _sec_score: {
            label: 'Scoring'
          },
          tolerance: {
            label: 'Tolerance per variable'
          },
          maxPoints: {
            label: 'Points (total)'
          }
        }
      },
      'file-download': {
        label: 'File download',
        description: 'Offer a learning-unit attachment for download, for example a PDF script, ZIP exercise, or template.',
        field: {
          title: {
            label: 'Title (above the download button)',
            placeholder: 'e.g. "Lecture script week 3"'
          },
          src: {
            label: 'File (upload or URL)',
            help: 'Uploaded files are embedded as data URLs in the SCORM package.'
          },
          filename: {
            label: 'Display name / save name',
            placeholder: 'e.g. "script-week-3.pdf"'
          },
          description: {
            label: 'Description (optional, below the button)',
            placeholder: 'Format, page count, notes ...'
          }
        },
        downloadButton: '↓ Download',
        noFile: '(no file)'
      },
      'function-question': {
        label: 'Read function',
        description: 'Show a function graph. Read values, zeros and extrema.',
        summary: '{count} function(s)',
        defaultTitle: 'Function plot',
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Function plot'
          },
          functions: {
            label: 'Function pool',
            itemLabel: 'Function'
          },
          expr: {
            label: 'f(x) =',
            placeholder: 'e.g. x^2 - 2*x - 3'
          },
          _sec_axes: {
            label: 'Coordinate range'
          },
          xMin: {
            label: 'x from'
          },
          xMax: {
            label: 'x to'
          },
          yMin: {
            label: 'y from'
          },
          yMax: {
            label: 'y to'
          },
          _sec_query: {
            label: 'Query'
          },
          questionMode: {
            label: 'What is asked?',
            option: {
              custom: 'Custom question / solution',
              'value-at-x': 'Function value f(x0)',
              'x-for-y': 'x values for f(x) = y0',
              zeros: 'Zeros',
              'y-intercept': 'y-intercept f(0)',
              minima: 'Minima',
              maxima: 'Maxima',
              extrema: 'All extrema'
            }
          },
          xQuery: {
            label: 'Position  x₀'
          },
          targetY: {
            label: 'Target value  y₀'
          },
          tolerance: {
            label: 'Tolerance (± deviation)'
          },
          question: {
            label: 'Question text',
            help: 'Leave empty: the question is generated automatically from the type.'
          },
          answer: {
            label: 'Sample solution',
            help: 'Separate multiple values with semicolons.'
          },
          answerType: {
            label: 'Answer format',
            option: {
              number: 'Single number',
              list: 'Multiple numbers'
            }
          },
          randomize: {
            label: 'Pick function at random'
          },
          maxPoints: {
            label: 'Points'
          }
        },
        modeLabel: {
          custom: 'Custom question',
          'value-at-x': 'Read f(x₀)',
          'x-for-y': 'x when f(x) = y₀',
          zeros: 'Zeros',
          'y-intercept': 'y-intercept',
          minima: 'Minima',
          maxima: 'Maxima',
          extrema: 'All extrema'
        },
        noneInRange: 'None in the visible range',
        valuePlaceholder: 'Value',
        newTaskGenerated: 'New task generated.',
        pleaseEnterAnswer: 'Please enter an answer.',
        autoQuestion: {
          custom: 'Read the required value from the plot.',
          'value-at-x': 'Determine f({x}).',
          'x-for-y': 'For which x values does f(x) = {y}?',
          zeros: 'Determine the zero(s) of the function (x values).',
          'y-intercept': 'Determine the y-intercept f(0).',
          extrema: {
            none: {
              minima: 'Tick "None in the visible range" if there are no minima.',
              maxima: 'Tick "None in the visible range" if there are no maxima.',
              extrema: 'Tick "None in the visible range" if there are no extrema.'
            },
            single: {
              minima: 'Determine the minimum as a coordinate (x; y).',
              maxima: 'Determine the maximum as a coordinate (x; y).',
              extrema: 'Determine the extremum as a coordinate (x; y).'
            },
            multiple: {
              minima: 'Determine the {n} minima as coordinates (x; y).',
              maxima: 'Determine the {n} maxima as coordinates (x; y).',
              extrema: 'Determine the {n} extrema as coordinates (x; y).'
            }
          },
          fallback: 'Read the required value from the plot.'
        },
        grade: {
          pleaseEnterAnswer: 'Please enter an answer.',
          valuesNotMatching: 'Not all values match. {n} value(s) expected.',
          invalidNumber: 'Please enter a valid number.',
          valueNotYetCorrect: 'Value not yet correct.',
          correctNoPoints: 'Correct: there are no matching points in the visible range.',
          noPointsInRange: 'There are no matching points in the visible range. Tick "None in the visible range".',
          enterCoordinates: 'Please enter coordinates as (x; y).',
          coordinatesNotYetCorrect: 'Coordinates not yet correct. {n} point(s) expected.',
          correctNoValues: 'Correct: there are no matching values in the visible range.',
          noValuesInRange: 'There are no matching values in the visible range. Tick "None in the visible range".',
          valuesNotYetCorrect: 'Value(s) not yet correct. {n} value(s) expected.'
        }
      },
      'function-sandbox': {
        label: 'Function plot sandbox',
        description: 'Explore a function interactively with sliders, not graded.',
        sliderStepShort: 'step',
        sliderStartShort: 'start',
        field: {
          _sec_fn: {
            label: 'Function'
          },
          title: {
            label: 'Title (optional)',
            placeholder: 'e.g. Explore sine'
          },
          expr: {
            label: 'f(x) =',
            placeholder: 'a*sin(b*x + c)',
            help: 'Slider variables (a, b, c, ...) may appear here.'
          },
          _sec_axes: {
            label: 'Coordinate range'
          },
          xMin: {
            label: 'x from'
          },
          xMax: {
            label: 'x to'
          },
          yMin: {
            label: 'y from'
          },
          yMax: {
            label: 'y to'
          },
          _sec_sliders: {
            label: 'Sliders'
          },
          sliders: {
            label: 'Sliders',
            itemLabel: 'Slider',
            item: {
              name: {
                label: 'Variable',
                placeholder: 'a'
              },
              _sec_range: {
                label: 'Range and step'
              },
              min: {
                label: 'from'
              },
              max: {
                label: 'to'
              },
              step: {
                label: 'Step size'
              },
              value: {
                label: 'Start value'
              }
            }
          }
        },
        preview: {
          tag: 'ƒ  Sandbox: {expr}',
          sliderHint: '{count} sliders, interactive in SCORM'
        }
      },
      heading: {
        label: 'Heading',
        description: 'Section heading inside the task text.',
        summary: {
          empty: '(empty)'
        },
        field: {
          text: {
            label: 'Text'
          },
          level: {
            label: 'Size',
            option: {
              2: 'Large (h2)',
              3: 'Medium (h3)',
              4: 'Small (h4)'
            }
          }
        },
        defaultText: 'Heading'
      },
      hotzone: {
        label: 'Hotzone (mark image)',
        description: 'Image with marked areas. Learners click on the correct zones.',
        preview: {
          prompt: 'Click on the tree.'
        },
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Hotzone'
          },
          _sec_q: {
            label: 'Question'
          },
          prompt: {
            label: 'Task text'
          },
          _sec_zones: {
            label: 'Image and zones'
          },
          src: {
            label: 'Image',
            help: 'Upload an image or enter a URL.'
          },
          zones: {
            label: 'Draw hotzones',
            help: 'Drag a rectangle on the image to add a zone. Click a zone to delete it.'
          },
          _sec_opts: {
            label: 'Settings and scoring'
          },
          showZonesAfterCheck: {
            label: 'Show missed zones after check'
          },
          maxPoints: {
            label: 'Points'
          },
          penalizeWrong: { help: 'Every click outside all zones deducts points; the total never drops below 0.' }
        },
        noImage: '(No image set)',
        noImageShort: '(No image)',
        counter: '{count} / {max} marks placed',
        removeMark: 'Click to remove',
        reset: 'Reset',
        noZonesConfigured: 'No hotzones configured.',
        markAtLeastOne: 'Please mark at least one spot on the image.',
        allFound: 'All {total} zones found.',
        allFoundWithMisclicks: '{correct}/{total} zones found, but {misclicks} misclick(s).',
        partialWithMisclicks: '{correct} of {total} zones found ({misclicks} misclick(s)).',
        partial: '{correct} of {total} zones found.',
        resetHint: 'Reset. Please click again.',
        zonesMarked: '{count} zone(s) marked'
      },
      image: {
        label: 'Image',
        description: 'Image with an optional caption. Source: upload or URL.',
        summary: {
          set: 'Image set',
          empty: '(no image yet)'
        },
        validate: {
          noSrc: 'No image set.',
          noAlt: 'Alt text is missing (accessibility).'
        },
        field: {
          src: {
            label: 'Image source (data URL or URL/path)',
            help: 'Uploaded images are embedded into the SCORM package as a data URL.'
          },
          alt: {
            label: 'Alt text (accessibility)'
          },
          caption: {
            label: 'Caption (optional)'
          },
          width: {
            label: 'Width (CSS, e.g. 400px, 60%, auto)'
          }
        },
        placeholder: {
          empty: '(image not set yet)'
        },
        preview: {
          kicker: 'IMAGE',
          empty: '(no image set yet)'
        }
      },
      'match-pairs': {
        label: 'Match pairs (drag & drop)',
        description: 'Match terms in pairs or sort them into categories, by dragging or tapping.',
        summary: {
          pairs: '{count} pairs',
          categorize: '{cats} categories, {items} items'
        },
        validate: {
          minTwoCategories: 'At least two categories are required.',
          minTwoItems: 'At least two items are required.',
          itemMissingCategory: 'At least one item has no valid category.',
          minTwoPairs: 'At least two pairs are required.',
          pairEmptySide: 'At least one pair has an empty side.'
        },
        preview: {
          defaultQuestion: 'Match the capitals to their countries.',
          pairs: {
            country1: 'Germany', capital1: 'Berlin',
            country2: 'France', capital2: 'Paris',
            country3: 'Italy', capital3: 'Rome'
          }
        },
        defaultTitle: 'Task',
        defaultCategorizeTitle: 'Categorization',
        dropHere: 'Drop here',
        resetBtn: 'Reset',
        noPairsDefined: 'No pairs defined.',
        pleaseAssignAtLeastOne: 'Please make at least one assignment.',
        allCorrect: 'All matches correct.',
        scoreLine: '{correct} of {total} correct.',
        resetDone: 'Reset.',
        newTaskGenerated: 'New task generated.',
        slotRemoveHint: 'Click or drag back to remove',
        previewTag: 'Drag & drop matching',
        noCategoriesOrItems: '(No categories or items defined.)',
        poolLabel: 'Items',
        pleaseAssignAtLeastOneTerm: 'Please assign at least one item.',
        categorizeAllCorrect: 'All {total} items assigned correctly. {pts} / {max} points.',
        categorizeScoreLine: '{correct} of {total} correct. {pts} / {max} points.',
        categorizeHint: 'Drag each item into its category, or tap an item and then tap the category. To move it back: tap the item, then tap the "Items" area.',
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Match pairs'
          },
          preset: {
            label: 'Template',
            help: 'Examples show typical matching tasks. Choose "Manual" to enter your own data.',
            option: {
              custom: 'Manual (empty)',
              chemistry: 'Example: chemistry, elements & symbols',
              units: 'Example: physics, matching units',
              'number-bases': 'Example: computer science, number systems',
              'math-symbols': 'Example: mathematics, symbols & meanings',
              animals: 'Example: biology, animals by class (categorization)',
              states: 'Example: chemistry, states of matter (categorization)'
            }
          },
          reset: {
            label: '↺ Reset'
          },
          sec_mode: {
            label: 'Mode'
          },
          mode: {
            label: 'Matching mode',
            option: {
              pairs: '1 to 1 (each term has exactly one partner)',
              categorize: 'Categorization (multiple items per category)'
            }
          },
          sec_q: {
            label: 'Question'
          },
          question: {
            label: 'Task text'
          },
          sec_pairs: {
            label: 'Pairs  (left ↔ right)'
          },
          pairs: {
            label: 'Pairs',
            itemLabel: 'Pair'
          },
          sec_left: {
            label: 'Left side'
          },
          pair: {
            left: {
              label: 'Text'
            },
            leftImg: {
              label: 'Image'
            },
            right: {
              label: 'Text'
            },
            rightImg: {
              label: 'Image'
            }
          },
          sec_right: {
            label: 'Right side'
          },
          sec_cats: {
            label: 'Categories'
          },
          categories: {
            label: 'Categories',
            itemLabel: 'Category'
          },
          category: {
            id: {
              label: 'Internal ID',
              placeholder: 'c1'
            },
            label: {
              label: 'Display name',
              placeholder: 'e.g. mammals'
            },
            image: {
              label: 'Image (optional)'
            }
          },
          sec_items: {
            label: 'Items'
          },
          items: {
            label: 'Items',
            itemLabel: 'Item'
          },
          item: {
            text: {
              label: 'Text',
              placeholder: 'e.g. dog'
            },
            image: {
              label: 'Image (optional)'
            },
            categoryId: {
              label: 'Associated category ID(s)',
              help: 'Several IDs separated by commas (e.g. c1, c2): the element then appears once per category. Identical-looking elements are interchangeable when sorting.',
              placeholder: 'c1'
            }
          },
          sec_opts: {
            label: 'Settings'
          },
          imgHeight: {
            label: 'Image height in px',
            help: 'Maximum height for all images.'
          },
          shuffle: {
            label: 'Shuffle order'
          },
          poolSize: {
            label: 'Tasks per round  (0 = all)',
            help: 'In 1:1 mode: random selection of N pairs from the pool. In categorization mode: random selection of N items (categories stay the same). Enables the "Regenerate" button.'
          },
          sec_score: {
            label: 'Scoring'
          },
          maxPoints: {
            label: 'Points (total)'
          }
        }
      },
      'multiple-choice': {
        label: 'Multiple choice',
        description: 'Select one or more correct answers.',
        summary: {
          empty: '(question empty)',
          answersSuffix: '{count} answers'
        },
        validate: {
          questionEmpty: 'Question is empty.',
          minTwoChoices: 'At least two answer choices are required.',
          noCorrect: 'No correct answer marked.',
          allCorrect: 'All answers marked as correct.',
          capBelowCorrect: 'Only {max} answers can be selected, but {correct} are correct. Full points cannot be reached.',
          choiceEmpty: 'Answer {n} has neither text nor an image.'
        },
        preview: {
          question: 'Which capital belongs to Germany?',
          choices: {
            correct: 'Berlin',
            option1: 'Munich',
            option2: 'Vienna',
            option3: 'Hamburg'
          }
        },
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Multiple choice'
          },
          preset: {
            label: 'Template',
            help: 'The examples show what this block can do. Enter your own content under "Manual".',
            option: {
              custom: 'Manual (empty)',
              'example-single': 'Example: computer science, time complexity (single choice)',
              'example-multi': 'Example: computer science, OOP concepts (multiple choice)',
              'example-math': 'Example: mathematics, derivative rules (single choice)'
            }
          },
          reset: {
            label: '↺ Reset'
          },
          sectionQuestion: {
            label: 'Question'
          },
          question: {
            label: 'Question text'
          },
          sectionChoices: {
            label: 'Answer options'
          },
          choices: {
            label: 'Answers',
            itemLabel: 'Answer',
            item: {
              text: {
                label: 'Answer text (optional if an image is set)'
              },
              image: {
                label: 'Image (optional)'
              },
              correct: {
                label: 'Is correct'
              }
            }
          },
          sectionSettings: {
            label: 'Settings'
          },
          multi: {
            label: 'Allow multiple selection'
          },
          limitSelections: {
            label: 'Limit the number of selectable answers',
            help: 'Once the maximum is reached, further answers can only be selected after deselecting one.'
          },
          maxSelections: {
            label: 'Maximum selectable'
          },
          shuffle: {
            label: 'Shuffle answers'
          },
          imageHeight: {
            label: 'Image height in the answers (px)',
            help: 'Maximum height of the answer images. The width adjusts automatically.'
          },
          sectionScoring: {
            label: 'Scoring'
          },
          maxPoints: {
            label: 'Points (total)'
          },
          partialCredit: {
            label: 'Partial credit for multiple choice',
            help: 'Each correctly ticked answer gives a share of the points (total divided by number of correct answers).'
          },
          penalizeWrong: {
            label: 'Deduct for wrong selection',
            help: 'With partial credit: each incorrectly ticked answer deducts one partial point (min. 0).'
          },
          penaltyPoints: {
            label: 'Deduction per wrong selection (points)',
            placeholder: 'empty = one partial point',
            help: 'Leave empty: the deduction equals one partial point (points ÷ number of correct answers). Applies to multiple selection with partial credit; the total never drops below 0.'
          }
        },
        limitHint: 'Select at most {max} answers ({n} of {max} selected).',
        partialDetail: 'Partly correct: {pts} / {max} points ({correctSelected} of {correctTotal} correct{wrongSuffix}).',
        wrongSuffix: ', {wrong} wrong',
        questionEmpty: '(Question empty)',
        imageAlt: 'Answer {n} (image)'
      },
      'note-box': {
        label: 'Note box',
        description: 'Highlighted note box (info or warning).',
        defaultTitle: 'Note',
        field: {
          title: {
            label: 'Title'
          },
          html: {
            label: 'Content (HTML)'
          },
          variant: {
            label: 'Style',
            option: {
              info: 'Info (green)',
              warn: 'Warning (yellow)',
              tip: 'Tip (blue)'
            }
          }
        }
      },
      'number-base': {
        label: 'Number systems (Bin/Dec/Hex)',
        description: 'Conversion between binary, octal, decimal and hexadecimal.',
        summary: 'Number system conversion',
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Number systems'
          },
          directionPreset: {
            label: 'Conversion preset',
            option: {
              custom: 'Custom directions',
              standard: 'Standard mix',
              'all-decimal': 'All from/to decimal',
              'dec-bin': 'Decimal → Binary',
              'bin-dec': 'Binary → Decimal',
              'dec-hex': 'Decimal → Hex',
              'hex-dec': 'Hex → Decimal',
              'bin-hex': 'Binary ↔ Hex'
            }
          },
          sectionDirections: {
            label: 'Allowed conversion directions'
          },
          directions: {
            label: 'Directions',
            itemLabel: 'Direction'
          },
          from: {
            label: 'From',
            option: {
              bin: 'Binary (base 2)',
              oct: 'Octal (base 8)',
              dec: 'Decimal (base 10)',
              hex: 'Hexadecimal (base 16)'
            }
          },
          to: {
            label: 'To',
            option: {
              bin: 'Binary (base 2)',
              oct: 'Octal (base 8)',
              dec: 'Decimal (base 10)',
              hex: 'Hexadecimal (base 16)'
            }
          },
          sectionSettings: {
            label: 'Settings & scoring'
          },
          valueRange: {
            label: 'Value range (decimal)',
            min: {
              label: 'from'
            },
            max: {
              label: 'to'
            }
          },
          randomize: {
            label: 'Randomize direction'
          },
          maxPoints: {
            label: 'Points'
          }
        },
        base: {
          bin: 'Binary',
          oct: 'Octal',
          dec: 'Decimal',
          hex: 'Hexadecimal'
        },
        instruction: 'Convert <strong>{value}</strong> from <em>{from}</em> to <em>{to}</em>.',
        newTaskGenerated: 'New task generated.',
        enterAnswer: 'Please enter an answer.',
        invalidChars: 'Invalid characters for {base}.',
        incorrectWithAnswer: 'Incorrect. Correct answer: {answer}',
        baseShort: {
          bin: 'Binary (₂)',
          oct: 'Octal (₈)',
          dec: 'Decimal (₁₀)',
          hex: 'Hex (₁₆)'
        },
        previewLabel: 'Number system conversion',
        previewHint: '{count} direction(s) in pool, values {min} to {max}'
      },
      'numeric-input': {
        label: 'Numeric input',
        description: 'Numeric question with random variables and a solution formula.',
        summary: {
          empty: '(Question empty)'
        },
        validate: {
          templateMissing: 'Question template missing.',
          formulaMissing: 'Solution formula missing.',
          extraFormulaMissing: 'Answer field {n}: solution formula missing (the field is ignored).',
          integerNever: '"Whole-number solutions only": no sample produced a whole-number solution. Set variables to "Integers only" or adjust formula/ranges.',
          varNameInvalid: 'Variable {index} ("{name}"): name may only contain letters (a-z, A-Z), digits and underscore.',
          varRangeInverted: 'Variable "{name}": min ({min}) is greater than max ({max}).',
          formulaAlwaysInvalid: 'Formula ALWAYS produces an invalid result with the current variable ranges (e.g. division by 0, root of a negative). Adjust formula or ranges.',
          formulaOftenInvalid: 'Formula fails in {pct}% of samples (e.g. division by 0). Narrow the variable range or adjust the formula.'
        },
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Numeric input'
          },
          preset: {
            label: 'Template',
            help: 'Examples show every feature of this block. Use "Manual" for your own questions.',
            option: {
              custom: 'Manual (empty)',
              pythagoras: 'Example: Pythagoras (c = √(a²+b²))',
              'rectangle-area': 'Example: rectangle area (A = a·b)',
              'circle-area': 'Example: circle area (A = π·r²)',
              ohm: 'Example: Ohm\'s law (U = R·I)'
            }
          },
          reset: {
            label: '↺ Reset'
          },
          sectionQuestion: {
            label: 'Question'
          },
          questionTemplate: {
            label: 'Question template  (variables as {name})',
            help: 'Example: "Calculate {a} + {b}." Variables get random values at start. The solution formula is derived automatically.'
          },
          sectionVariables: {
            label: 'Random variables'
          },
          variables: {
            label: 'Variables',
            itemLabel: 'Variable',
            item: {
              name: {
                label: 'Name',
                placeholder: 'e.g. a'
              },
              min: {
                label: 'from'
              },
              max: {
                label: 'to'
              },
              integer: {
                label: 'Integers only'
              }
            }
          },
          sectionSolution: {
            label: 'Solution'
          },
          formula: {
            label: 'Solution formula',
            placeholder: 'sqrt(a^2 + b^2)',
            help: 'Derived from the question automatically. Override manually if needed.'
          },
          tolerance: {
            label: 'Tolerance  (±)',
            help: 'Deviation still counted as correct. 0 = exact.'
          },
          unit: {
            label: 'Answer unit (optional)',
            placeholder: 'e.g. m/s or kg',
            help: 'Shown next to the answer field. Any unit in the question itself belongs in the question text.'
          },
          answerPrefix: {
            label: 'Label before the answer field (optional)',
            placeholder: 'e.g. x =',
            help: 'Shown to the left of the input, e.g. a variable name. $…$ works for formulas.'
          },
          extraAnswers: {
            label: 'Additional answer fields',
            itemLabel: 'Answer field',
            help: 'Each field has its own formula (same random variables). Partial points per correct field.',
            item: {
              prefix: { label: 'Label before', placeholder: 'e.g. y =' },
              formula: { label: 'Solution formula' },
              unit: { label: 'Unit after', placeholder: 'e.g. m' },
              tolerance: { label: 'Tolerance (±), empty = as above' }
            }
          },
          simplifyFractions: {
            label: 'Simplify term',
            help: 'On: students must enter the reduced fraction. "10/20" is rejected, "1/2" is correct. Off: all equivalent inputs are accepted.'
          },
          integerAnswers: {
            label: 'Whole-number solutions only',
            help: 'Only tasks whose solutions (all answer fields) are whole numbers are generated.'
          },
          allowImpossible: {
            label: 'Allow impossible tasks (answer "X")',
            help: 'If a formula has no result for the drawn values (e.g. root of a negative, division by 0), the task is still asked. The correct answer is then "X".'
          },
          sectionScoring: {
            label: 'Scoring'
          },
          maxPoints: {
            label: 'Points'
          }
        },
        answerWithUnit: 'Answer ({unit})',
        answerPlaceholder: 'Number or fraction (e.g. 0.75 or 3/4)',
        answerPlaceholderX: 'Number, fraction or X (if impossible)',
        impossibleSolution: 'X (no solution)',
        feedback: {
          notGeneratable: 'Task not generatable: formula always yields an invalid result with the current variable ranges (e.g. division by 0). Adjust variable ranges or formula.',
          newTask: 'New task generated.',
          solutionUnavailable: 'Solution could not be computed (check formula).',
          enterValidNumber: 'Please enter a valid number or fraction (e.g. 3/4).',
          enterValidNumberOrX: 'Please enter a valid number, a fraction (e.g. 3/4) or "X" (no solution).',
          notGeneratableInteger: 'Task not generatable: no whole-number solution with the current variable ranges. Adjust ranges or formula, or turn off "Whole-number solutions only".',
          needSimplifiedFraction: 'Please enter a reduced fraction (e.g. 1/2 instead of 2/4).',
          correctWithSolution: 'Correct. (Solution: {solution})',
          partial: '{n} of {total} fields correct: {pts} / {max} points.'
        },
        preview: {
          taskPlaceholder: '(Task)',
          enterNumber: 'Enter number…',
          exampleSolutionTitle: 'Example solution'
        }
      },
      'rich-text': {
        label: 'Rich text',
        description: 'Paragraph with formatting (bold, italic, lists, links).',
        emptyText: '(empty text)',
        previewHtml: '<p>This block contains <strong>formatted text</strong>. Supported features include <em>italic emphasis</em>, lists and links.</p>',
        field: {
          html: {
            label: 'Content (HTML allowed)',
            help: 'Allowed: HTML such as <p>, <strong>, <em>, <ul>, <li>, <code>, <a>, <br>.'
          }
        }
      },
      'sort-list': {
        label: 'Sort list',
        description: 'Arrange items into the correct order via drag-and-drop.',
        defaultTitle: 'Task',
        qBoxTitle: 'Sort',
        previewTag: 'Sort (D&D)',
        feedback: {
          allCorrect: 'All items sorted correctly.',
          partial: '{correct} of {total} sorted correctly.'
        },
        preview: {
          more: '… +{count} more'
        },
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Sort list'
          },
          preset: {
            label: 'Template',
            help: 'Items are graded as correct in the order entered. Shuffled randomly on start.',
            option: {
              custom: 'Manual (empty)',
              'example-se': 'Example: Computer science, waterfall model',
              'example-science': 'Example: Science, scientific method',
              'example-algo': 'Example: Algorithm, merge sort phases'
            }
          },
          reset: {
            label: '↺ Reset'
          },
          sec_q: {
            label: 'Question & items'
          },
          question: {
            label: 'Task text'
          },
          items: {
            label: 'Items',
            itemLabel: 'Item',
            help: 'Enter items in the correct order. They are shuffled randomly on start.',
            value: {
              label: 'Text'
            }
          },
          sec_score: {
            label: 'Scoring'
          },
          maxPoints: {
            label: 'Points'
          }
        },
        preset: {
          'example-se': {
            question: 'Arrange the phases of the waterfall model in the correct order.',
            item: {
              requirements: 'Requirements analysis',
              design: 'System design',
              implementation: 'Implementation',
              testing: 'Testing',
              acceptance: 'Acceptance',
              maintenance: 'Maintenance'
            }
          },
          'example-science': {
            question: 'Arrange the steps of the scientific method.',
            item: {
              observe: 'Formulate an observation',
              question: 'Develop a research question',
              hypothesis: 'Formulate a hypothesis',
              experiment: 'Plan and run an experiment',
              analyze: 'Analyze the data',
              conclude: 'Draw a conclusion'
            }
          },
          'example-algo': {
            question: 'Arrange the phases of the merge sort algorithm.',
            item: {
              split: 'Split the list into two halves',
              sortHalves: 'Sort each half recursively',
              merge: 'Merge both sorted halves',
              return: 'Return the fully sorted list'
            }
          }
        }
      },
      summary: {
        label: 'Summary',
        description: 'A checklist of learning objectives or key takeaways. Typically placed at the end of a task.',
        field: {
          title: {
            label: 'Heading',
            placeholder: 'e.g. "What you take away"'
          },
          points: {
            label: 'Key points',
            itemLabel: 'Point'
          },
          headline: {
            label: 'Key statement (bold)',
            placeholder: 'e.g. "Truth tables"'
          },
          text: {
            label: 'Explanation (optional)',
            placeholder: 'Short explanatory sentence'
          }
        },
        emptyPlaceholder: '(no key points yet)',
        itemEmpty: '(empty)'
      },
      survey: {
        label: 'Survey',
        description: 'Anonymous feedback (star rating, choice, free text). Not graded.',
        field: {
          title: {
            label: 'Heading',
            placeholder: 'e.g. "Feedback on this task"'
          },
          intro: {
            label: 'Intro text (optional)',
            placeholder: 'Note on anonymity, purpose, ...'
          },
          questions: {
            label: 'Questions',
            itemLabel: 'Question'
          },
          type: {
            label: 'Question type',
            option: {
              rating: 'Star rating (1 to N stars)',
              select: 'Single choice (options, 1 answer)',
              text: 'Free text'
            }
          },
          prompt: {
            label: 'Question',
            placeholder: 'e.g. "How would you rate ...?"'
          },
          scale: {
            label: 'Number of stars (star rating only)'
          },
          options: {
            label: 'Answer options (one per line, single choice only)',
            placeholder: 'Option A\nOption B\nOption C'
          },
          placeholder: {
            label: 'Placeholder text (free text only)',
            placeholder: 'Optional ...'
          }
        },
        noQuestions: '(no questions yet)',
        itemEmpty: '(empty)',
        starAria: '{n} of {total} stars',
        submit: 'Submit',
        thanks: '✓ Thank you for your feedback.',
        sent: 'Sent'
      },
      table: {
        label: 'Table',
        description: 'Value table, true/false statements, choice matrix or free table with answer cells.',
        defaultTitle: 'Value table',
        emptyState: '(No columns or no answer column defined.)',
        summary: '{cols} columns, {rows} rows',
        grid: {
          summary: '{rows} × {cols} table, {answers} answer fields',
          empty: '(No rows or columns defined.)',
          solutionTitle: 'Solution: {solution}',
          validate: {
            needRowsCols: 'At least one row and one column are required.',
            noAnswerCell: 'No answer cell: set at least one column or row to "Number answer", "Text answer" or "Choice".',
            missingFormula: 'Row {row}, column {col}: solution formula missing.',
            missingAnswers: 'Row {row}, column {col}: no accepted answer entered.',
            missingOptions: 'Row {row}, column {col}: a choice needs at least two options (separated by |, the first one is correct).',
            noGradedCell: 'No answer cell counts for points ("Points" is unticked everywhere). All answer cells will count then.'
          },
          feedback: {
            noAnswerCells: 'This table has no answer fields.',
            fillAtLeastOne: 'Please fill in at least one field.',
            allCorrect: 'All {total} graded fields correct. {pts} / {max} points.',
            summary: '{correct} of {total} graded fields correct, {wrong} wrong: {pts} / {max} points.'
          }
        },
        mx: {
          summary: '{rows} × {cols} choice matrix',
          empty: '(No rows or columns defined.)',
          validate: {
            needRowsCols: 'At least one row and one column are required.',
            emptyLabel: 'At least one row or column has no name.',
            noCorrect: 'No correct answer ticked.',
            singleNeedsOne: '"One answer per row": every row needs exactly one ticked box.'
          },
          feedback: {
            tickAtLeastOne: 'Please tick at least one box.',
            allCorrect: 'Everything ticked correctly. {pts} / {max} points.',
            summary: '{hits} of {total} correct ticks, {wrong} wrong: {pts} / {max} points.'
          }
        },
        tf: {
          summary: '{n} statements (true/false)',
          empty: '(No statements defined.)',
          colUnanswered: 'Unanswered',
          colTrue: 'True',
          colFalse: 'False',
          validate: {
            noStatements: 'At least one statement is required.',
            emptyStatement: 'Statement {n} is empty.'
          },
          feedback: {
            answerAtLeastOne: 'Please mark at least one statement as true or false.',
            allCorrect: 'All {total} statements judged correctly. {pts} / {max} points.',
            summary: '{correct} of {total} correct, {wrong} wrong, {open} unanswered: {pts} / {max} points.'
          }
        },
        typeShort: {
          var: 'Random value',
          answer: 'Answer field',
          expr: 'Computed',
          text: 'Text'
        },
        validate: {
          minColumns: 'At least two columns are required.',
          needAnswerColumn: 'At least one answer column is required.'
        },
        feedback: {
          noAnswerCells: 'No answer cells.',
          fillAtLeastOne: 'Please fill in at least one cell.',
          allCorrect: 'All {total} entries correct. {max} / {max} points.',
          someCorrect: '{correct} of {total} correct. {pts} / {max} points.',
          newValues: 'New values generated.'
        },
        preview: {
          questionEmpty: '(Question empty)',
          noColumns: '(No columns defined.)',
          defaultQuestion: 'Compute $f(x) = 2x + 1$ for the given values.'
        },
        field: {
          integerAnswers: {
            valuesHelp: 'Each row is drawn so that all answer columns are whole numbers.',
            gridHelp: 'The variables are drawn so that all number answers in the table are whole numbers.'
          },
          mode: {
            label: 'Table type',
            help: 'True/false: one statement per row, to be marked as true or false. Choice matrix: rows × columns to tick. Free table: arrange text and answer cells (number or text) freely.',
            option: {
              values: 'Value table (variables, formulas, input fields)',
              truefalse: 'True/false statements',
              matrix: 'Choice matrix (tick rows × columns)',
              grid: 'Free table (arrange text and answer cells freely)'
            }
          },
          sectionGrid: { label: 'Table' },
          grid: { label: 'Rows, columns and cells' },
          gridTolerance: { label: 'Tolerance for number answers (±)', help: 'Applies to every number answer without its own tolerance.' },
          gridIgnoreCase: { label: 'Ignore upper/lower case in text answers' },
          sectionGridLayout: { label: 'Layout' },
          gridLines: { label: 'Show grid lines' },
          gridHeaderRow: { label: 'First row is a header row' },
          gridHeaderCol: { label: 'First column is a header column' },
          gridHeaderColWidth: { label: 'Header column width (px, empty = automatic)' },
          gridHeaderColGap: { label: 'Spacing after the header column (px)' },
          gridHeaderRowGap: { label: 'Spacing after the header row (px)' },
          sectionMatrix: { label: 'Matrix' },
          matrix: { label: 'Rows, columns and correct answers' },
          matrixSingle: {
            label: 'One answer per row',
            help: 'On: radio buttons instead of boxes, exactly one column can be chosen per row.'
          },
          matrixShuffle: { label: 'Shuffle rows' },
          matrixScoring: {
            label: 'Matrix scoring',
            help: 'Per tick: every correct tick earns partial points. Per row: only fully correct rows count.',
            option: { cell: 'Per tick (partial points)', row: 'Per row (fully correct)' }
          },
          sectionStatements: { label: 'Statements' },
          statements: {
            label: 'Statements',
            itemLabel: 'Statement',
            help: 'Each statement becomes one row. $…$ for formulas; line breaks are kept.',
            text: { label: 'Statement' },
            correct: { label: 'The statement is', option: { true: 'true', false: 'false' } }
          },
          tfUnanswered: {
            label: 'Show "Unanswered" column',
            help: 'Preselected, so statements can be left open on purpose (0 points instead of a deduction).'
          },
          tfShuffle: { label: 'Shuffle statements' },
          tfLabelTrue: { label: '"True" column header (optional)' },
          tfLabelFalse: { label: '"False" column header (optional)' },
          penalizeWrong: {
            label: 'Deduct points for wrong answers',
            help: 'Every wrong answer deducts points; the total never drops below 0. Unanswered counts 0.'
          },
          penaltyPoints: {
            label: 'Deduction per wrong answer (points)',
            placeholder: 'empty = as much as one correct answer earns',
            help: 'Leave empty: the deduction equals the value of one correct answer (points divided by the number of statements or correct ticks/rows).'
          },
          blockTitle: {
            label: 'Heading',
            placeholder: 'Value table'
          },
          preset: {
            label: 'Template',
            help: 'Under "Manual" define your own columns and formulas.',
            option: {
              custom: 'Manual (empty)',
              linear: 'Example: f(x) = 2x + 1',
              quadratic: 'Example: f(x) = x^2',
              'area-rect': 'Example: rectangle area A = a*b'
            }
          },
          reset: {
            label: 'Reset'
          },
          sectionQuestion: {
            label: 'Question'
          },
          question: {
            label: 'Task text',
            help: 'KaTeX is rendered. Example: $f(x) = 2x + 1$.'
          },
          sectionVariables: {
            label: 'Variables'
          },
          variables: {
            label: 'Variables',
            itemLabel: 'Variable',
            help: 'Rerolled per row. Referenced by name in column formulas.',
            name: {
              label: 'Name',
              placeholder: 'e.g. n',
              help: 'Letters and digits only.'
            },
            sectionRange: {
              label: 'Range'
            },
            min: {
              label: 'Min'
            },
            max: {
              label: 'Max'
            },
            integer: {
              label: 'Integer'
            }
          },
          sectionColumns: {
            label: 'Columns'
          },
          columns: {
            listLabel: 'Columns',
            label: {
              label: 'Column header',
              placeholder: 'e.g. f(x) = 2*x + 1',
              help: 'Write "name = term" and the formula is picked up automatically.'
            },
            itemLabel: 'Column',
            key: {
              label: 'Key',
              placeholder: 'e.g. x',
              help: 'Internal name for formulas. Letters and digits only.'
            },
            sectionSource: {
              label: 'Source'
            },
            type: {
              label: 'Type',
              option: {
                var: 'Random value',
                answer: 'Answer field (students fill in)',
                expr: 'Computed (automatic)',
                text: 'Static text'
              }
            },
            sectionRange: {
              label: 'Range'
            },
            min: {
              label: 'Min',
              disabledHint: 'No effect: the formula replaces the random value.'
            },
            max: {
              label: 'Max',
              disabledHint: 'No effect: the formula replaces the random value.'
            },
            integer: {
              label: 'Integer'
            },
            varFormula: {
              label: 'Formula (optional)',
              placeholder: 'e.g. 5 * k',
              help: 'When set, replaces the random value. Reads top-level variables. Example: variable k = 0..72 integer, formula "5 * k" yields random multiples of 5 between 0 and 360.'
            },
            text: {
              label: 'Text'
            },
            sectionFormula: {
              label: 'Formula'
            },
            formula: {
              label: 'Formula',
              placeholder: 'e.g. 2*x + 1',
              help: 'Uses other column keys and variables.'
            },
            tolerance: {
              label: 'Tolerance',
              help: 'Allowed deviation of the student answer.'
            },
            sectionDisplay: {
              label: 'Display'
            },
            unit: {
              label: 'Unit (optional)',
              placeholder: 'e.g. cm'
            },
            decimals: {
              label: 'Decimal places (empty = like the table)'
            },
            fraction: {
              label: 'Show as fraction',
              help: 'Decimals like 4.5 are rendered as a fraction (\\frac{9}{2}). No effect on integer values.'
            }
          },
          sectionRows: {
            label: 'Rows'
          },
          rowCount: {
            label: 'Number of rows'
          },
          sectionScoring: {
            label: 'Scoring'
          },
          maxPoints: {
            label: 'Points (total)',
            help: 'Distributed evenly across all answer cells.'
          }
        }
      },
      'text-input': {
        label: 'Text input',
        description: 'Free text answer. Match exactly or by regular expression.',
        summary: {
          empty: '(question empty)'
        },
        validate: {
          questionEmpty: 'Question is empty.',
          noAnswers: 'No accepted answers defined.'
        },
        itemModeLabel: {
          manual: 'manual'
        },
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Text input'
          },
          preset: {
            label: 'Template',
            help: '"Manual" is for your own questions. Examples show every check mode.',
            option: {
              custom: 'Manual (empty)',
              'example-term': 'Example: physics, technical term (Ohm\'s law)',
              'example-keyword': 'Example: computer science, keywords (several terms)',
              'example-regex': 'Example: regex, pattern (three-digit number)'
            }
          },
          reset: {
            label: '↺ Reset'
          },
          sectionQuestion: {
            label: 'Question'
          },
          question: {
            label: 'Question text'
          },
          sectionAnswers: {
            label: 'Accepted answers'
          },
          answerMode: {
            label: 'Check mode (for all answers)',
            help: '"Manual" allows a different match mode per answer entry.',
            option: {
              iexact: 'Exact: case insensitive (default)',
              manual: 'Manual: choose match mode per entry',
              regex: 'Regular expression: patterns like \\d+ or (A|B)',
              keywords: 'Keywords: partial points per matched term'
            }
          },
          answers: {
            label: 'Answers',
            itemLabel: 'Answer',
            item: {
              value: {
                label: 'Answer text or regex'
              },
              mode: {
                label: 'Match',
                option: {
                  iexact: 'Exact (case insensitive)',
                  regex: 'Regular expression'
                }
              }
            }
          },
          sectionScoring: {
            label: 'Scoring'
          },
          maxPoints: {
            label: 'Points (total)'
          },
          partialKeywords: {
            label: 'Enable partial points',
            help: 'Each matched answer entry gives a proportional share of points. Suitable for free-text answers with several required terms.'
          }
        },
        feedback: {
          pleaseEnterAnswer: 'Please enter an answer.',
          correctKeywords: 'Correct. {pts} / {max} points ({hits} of {total} keywords).',
          partialKeywords: 'Partly correct: {pts} / {max} points ({hits} of {total} keywords found).',
          noKeyword: 'No keyword found. 0 / {max} points.'
        },
        preview: {
          questionPlaceholder: '(question)',
          answersLabel: 'Answer(s):',
          inputPlaceholder: 'Type your answer…'
        }
      },
      'truth-table': {
        label: 'Truth table',
        description: 'Evaluate boolean expressions (AND, OR, NOT, XOR). Enter 0 or 1 per row.',
        summary: {
          expressionsCount: '{count} expressions'
        },
        validate: {
          noExpressions: 'No boolean expressions defined.'
        },
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Truth table'
          },
          expressionPreset: {
            label: 'Template',
            option: {
              custom: 'Manual (empty)',
              'basics-2': 'Example: AND, OR, NOT (2 variables)',
              'mixed-2': 'Example: Mixed logic (2 variables)',
              'mixed-3': 'Example: Mixed logic (3 variables)',
              'de-morgan': 'Example: De Morgan\'s laws',
              xor: 'Example: XOR / either-or'
            }
          },
          reset: {
            label: '↺ Reset'
          },
          variableCount: {
            label: 'Variable count',
            help: '2 variables = 4 rows, 3 variables = 8 rows.'
          },
          sectionExpressions: {
            label: 'Boolean expressions'
          },
          expressions: {
            label: 'Expressions',
            itemLabel: 'Expression'
          },
          expr: {
            label: 'Boolean expression',
            placeholder: 'a && b || !c',
            help: 'Operators: && (AND), || (OR), ! (NOT), xor (XOR)'
          },
          vars: {
            label: 'Variables (comma-separated)',
            placeholder: 'a,b,c'
          },
          sectionSettings: {
            label: 'Settings and scoring'
          },
          randomize: {
            label: 'Pick expression at random'
          },
          maxPoints: {
            label: 'Points'
          },
          penalizeWrong: { help: 'Every wrongly filled row deducts points; the total never drops below 0. Rows left at "?" count 0.' }
        },
        defaultTitle: 'Truth table',
        expressionLabel: 'Expression',
        resultColumn: 'Result',
        fillHint: 'Enter 0 or 1 for each row.',
        fillAllRows: 'Please fill in every row.',
        partialRows: 'Partly correct: {correct} of {total} rows ({pts} / {max} points).',
        noRowCorrect: 'No row correct. 0 / {max} points.'
      },
      'unit-convert': {
        label: 'Unit conversion',
        description: 'Convert physical units with random values.',
        inputPlaceholder: 'Enter a number',
        noTasksDefined: 'No tasks defined.',
        newTaskGenerated: 'New task generated.',
        solutionUnavailable: 'Solution not available.',
        enterValidNumber: 'Please enter a valid number.',
        correctWithSolution: 'Correct. (Solution: {value} {unit})',
        exampleSolution: 'Example solution',
        questionTemplateFallback: 'Convert {value} {fromUnit} to {toUnit}.',
        validate: {
          minOneConversion: 'Configure at least one conversion.',
          unknownUnit: 'Conversion {index}: unknown unit.',
          categoryMismatch: 'Conversion {index}: {from} to {to} is not possible.'
        },
        preview: {
          questionTemplate: 'Convert {value} {fromUnit} to {toUnit}.'
        },
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Unit conversion'
          },
          preset: {
            label: 'Template',
            help: 'Examples show what the block can do. Use "Manual" for custom questions.',
            option: {
              custom: 'Manual (empty)',
              'ex-speed': 'Example: Speed  (km/h, m/s, kn)',
              'ex-temp': 'Example: Temperature  (°C, K, °F)',
              'ex-energy': 'Example: Energy  (kWh, MJ, kJ, kcal)',
              'ex-pressure': 'Example: Pressure  (bar, Pa, atm, mmHg)',
              'ex-data': 'Example: Data size  (GiB ↔ GB, MiB ↔ MB)',
              'ex-power': 'Example: Power  (PS, kW, W, MW)',
              'ex-length': 'Example: Length  (nm, μm, mm, m, km)',
              'ex-density': 'Example: Density  (g/cm³, kg/m³, kg/L)',
              'ex-mixed': 'Example: Mixed, all categories'
            }
          },
          reset: {
            label: '↺ Reset'
          },
          sec_q: {
            label: 'Question'
          },
          questionTemplate: {
            label: 'Question template  (variables as {value}, {fromUnit}, {toUnit})',
            help: 'Example: "Convert {value} {fromUnit} to {toUnit}." Variables are filled in for each new task.'
          },
          sec_vars: {
            label: 'Random variables'
          },
          variants: {
            label: 'Conversions',
            itemLabel: 'Conversion'
          },
          dir: {
            label: 'Direction'
          },
          valueMin: {
            label: 'from'
          },
          valueMax: {
            label: 'to'
          },
          integer: {
            label: 'Integers only'
          },
          randomize: {
            label: 'Pick variant at random'
          },
          randomSwap: {
            label: 'Swap direction at random'
          },
          sec_solution: {
            label: 'Solution'
          },
          tolerance: {
            label: 'Tolerance  (±, relative)',
            help: 'Deviation still counted as correct. 0.01 = ±1 %.'
          },
          sec_score: {
            label: 'Scoring'
          },
          maxPoints: {
            label: 'Points'
          }
        }
      },
      'vector-question': {
        label: 'Read a 2D vector',
        description: '2D vector: read components, magnitude, angle.',
        summary: '{count} vectors in pool',
        field: {
          blockTitle: {
            label: 'Heading',
            placeholder: 'Vector task'
          },
          pool: {
            label: 'Vector pool',
            itemLabel: 'Vector',
            item: {
              x: {
                label: 'x component'
              },
              y: {
                label: 'y component'
              }
            }
          },
          randomize: {
            label: 'Pick vector randomly'
          },
          _sec_query: {
            label: 'Query'
          },
          questionMode: {
            label: 'What is asked?',
            option: {
              all: 'Components, magnitude and angle',
              components: 'Components only  (x, y)',
              magnitude: 'Magnitude only  |v|',
              angle: 'Angle only  φ',
              'unit-vector': 'Unit vector  v̂  (v / |v|)'
            }
          },
          _sec_fields: {
            label: 'Fields and tolerances'
          },
          fields: {
            label: 'Show or hide fields individually',
            help: 'Only relevant for "Components, magnitude and angle". All other modes choose the fields automatically.',
            item: {
              x: {
                label: 'x'
              },
              y: {
                label: 'y'
              },
              mag: {
                label: '|v|'
              },
              angle: {
                label: 'Angle'
              }
            }
          },
          angleUnit: {
            label: 'Angle unit',
            option: {
              deg: 'Degrees (°)',
              rad: 'Radians (rad)'
            }
          },
          tolerances: {
            label: 'Tolerances  (±)',
            item: {
              x: {
                label: 'x'
              },
              y: {
                label: 'y'
              },
              mag: {
                label: '|v|'
              },
              angle: {
                label: 'Angle'
              }
            }
          },
          _sec_score: {
            label: 'Display and scoring'
          },
          plotRange: {
            label: 'Plot range (±)'
          },
          maxPoints: {
            label: 'Points'
          }
        },
        plotTitle: 'Vector plot',
        inputHeading: 'Input',
        input: {
          angleDeg: 'α (degrees)',
          angleRad: 'α (rad)'
        },
        placeholder: {
          x: 'e.g. 3',
          y: 'e.g. 2',
          unitX: 'e.g. 0.832',
          unitY: 'e.g. 0.555',
          mag: 'e.g. 3.61',
          angleDeg: 'e.g. 33.7',
          angleRad: 'e.g. pi/6'
        },
        feedback: {
          newGenerated: 'New task generated.',
          fillAtLeastOne: 'Please fill in at least one field.',
          fieldMissing: '{field} is missing.',
          fieldCorrect: '{field} correct.',
          fieldWrong: '{field} not yet correct.',
          partialDetailed: 'Partly correct ({ok} of {total}): {pts} / {max} points. {details}',
          zeroDetailed: '0 / {max} points. {details}'
        },
        question: {
          components: 'Read off the components x and y of the vector.',
          magnitude: 'Determine the magnitude |v| of the vector.',
          angle: 'Determine the angle of the vector to the positive x axis.',
          unitVector: 'Determine the unit vector v̂ = v / |v|.',
          all: 'Read off the components, magnitude and angle of the vector.'
        }
      },
      video: {
        label: 'Video',
        description: 'Embed a video file or YouTube/Vimeo URL. File upload or link.',
        field: {
          title: {
            label: 'Title (above the player, optional)'
          },
          src: {
            label: 'Video source (file, YouTube or Vimeo)',
            help: 'Uploaded files are embedded as a data URL. YouTube and Vimeo links are detected automatically and embedded.'
          },
          poster: {
            label: 'Poster image (only visible for file uploads)',
            help: 'For YouTube and Vimeo, the embed uses its own preview.'
          },
          caption: {
            label: 'Caption (below the player, optional)'
          }
        },
        placeholder: {
          noVideo: '(No video set yet)'
        },
        preview: {
          noVideoFile: '(No video file yet)'
        },
        embed: {
          defaultTitle: 'Embedded video'
        }
      },
      composition: {
        label: 'Composition',
        description: 'Sketch made of lines, circles, arrows, and labels. Optionally graded as a task.',
        shape: {
          line: 'Line',
          arrow: 'Arrow',
          circle: 'Circle',
          ellipse: 'Ellipse',
          polygon: 'Polygon',
          rect: 'Rectangle',
          label: 'Label',
          coords: 'Coordinate system',
          image: 'Image',
          yesno: 'Yes/No field'
        },
        polygonByCount: {
          3: 'Triangle',
          4: 'Quadrilateral',
          5: 'Pentagon',
          6: 'Hexagon',
          7: 'Heptagon',
          8: 'Octagon',
          generic: '{n}-gon'
        },
        polygonPreset: {
          right:       { label: 'Right-angled', hint: '90° bottom left' },
          isosceles:   { label: 'Isosceles',    hint: 'apex on top' },
          equilateral: { label: 'Equilateral',  hint: 'all sides equal' },
          scalene:     { label: 'Irregular',    hint: 'freely adjustable' },
          square:      { label: 'Square',       hint: '4 equal sides' },
          pentagon:    { label: 'Pentagon',     hint: 'regular' },
          hexagon:     { label: 'Hexagon',      hint: 'regular' }
        },
        template: {
          'tpl-rect-area':      { label: 'Rectangle area',                         description: 'A = a · b' },
          'tpl-triangle-area':  { label: 'Triangle area',                          description: 'A = (a · h) / 2' },
          'tpl-pythagoras':     { label: 'Pythagoras',                             description: 'c = √(a² + b²)' },
          'tpl-circle-area':    { label: 'Circle area',                            description: 'A = π · r²' },
          'tpl-multi-step-pyth':{ label: 'Multi-step: Pythagoras  (answer as variable)', description: '{1} and {2}, where {2} reuses answer {1*}' }
        },
        summary: {
          empty: 'empty',
          cornersSuffix: 'corners'
        },
        display: {
          fallback: 'Shape {n}',
          label: 'Label "{text}"',
          imageEmpty: 'Image  (empty)',
          yesno: 'Yes/No field  ({answer}, {pts} pt.)'
        },
        yesno: {
          yes: 'Yes',
          no: 'No',
          placeholder: 'Yes/No'
        },
        preview: {
          shapeSingular: 'shape',
          shapePlural: 'shapes'
        },
        canvas: {
          empty: {
            title: 'Composition is empty',
            body: 'Click <strong>Template…</strong> above to start from a ready example (rectangle, Pythagoras, circle, triangle), or pick a shape tool.'
          },
          imagePlaceholder: 'Select image…',
          labelInputPlaceholder: 'e.g. a or {a}',
          previewHead: 'Preview · Enter = save · Shift+Enter = new line · Esc = cancel',
          hint: {
            multi: '{count} shapes selected. Drag moves all • Arrow keys nudge (⇧ +10 px) • ⌘/Ctrl + D / C / V • ⌫ deletes • Esc clears the selection.',
            single: 'Shape selected. Drag moves it • Arrow keys nudge pixel by pixel (⇧ +10 px) • ⌘/Ctrl + Z / ⇧Z undo / redo • ⌘/Ctrl + D duplicates • ⌘/Ctrl + C / V copy / paste • ⌫ deletes • Esc clears the selection.',
            selectTool: 'Selection tool active: drag a box with the mouse to mark multiple shapes.',
            idle: 'Click a shape or drag a box for multi-select. Tools at the top left.'
          }
        },
        field: {
          integerAnswers: { help: 'The variables are drawn so that every answer field computed by a formula is a whole number.' },
          blockTitle: { label: 'Heading', placeholder: 'Composition' },
          _sec_canvas: { label: 'Drawing area' },
          canvasWidth: { label: 'Width (px)' },
          canvasHeight: { label: 'Height (px)' },
          background: { label: 'Background' },
          _sec_grading: { label: 'Grading' },
          gradingMode: {
            label: 'Grading mode',
            help: 'In "With solution" mode, labels can contain input fields: type {} in the text and the answer field appears there. {a} becomes a variable.',
            option: {
              none: 'None (display only)',
              acknowledge: '"Got it" button',
              fillblanks: 'With solution (input fields)',
              click: 'Click task (click the correct shapes)',
              hotspot: 'Hotspot task (mark areas)'
            }
          },
          prompt: { label: 'Task text (optional)', help: 'Shown above the composition. Variables as {name} are replaced with the current values (as in the labels), $…$ for formulas.' },
          maxPoints: { label: 'Maximum points', help: 'Applies to the answer fields {1}, {2} … (together). Yes/No fields add their own points on top.' },
          tolerance: { label: 'Tolerance', help: 'Allowed deviation between the answer and the computed value. 0.01 means ±0.01. Applied to every solution field without its own tolerance.' },
          penalizeWrong: { label: 'Deduct points for wrong answers', help: 'Click mode: every click on a shape not marked correct. Fill-in-the-blanks: every wrongly answered yes/no field. The total never drops below 0.' },
          penaltyPoints: { help: 'Leave empty: click mode = value of one correct shape, yes/no = the points of that field.' },
          _sec_vars: { label: 'Random variables' },
          variables: {
            label: 'Variables',
            itemLabel: 'Variable',
            help: 'Every label can use {name} as a placeholder. Each click on "Regenerate" (shown as soon as at least one variable is defined) redraws every variable from its range. In "With solution" mode, gaps can also reference a formula evaluated with the current values.',
            item: {
              name: { label: 'Name', placeholder: 'e.g. a' },
              min: { label: 'Min' },
              max: { label: 'Max' },
              integer: { label: 'Integer' }
            }
          },
          _sec_shapes: { label: 'Shapes (advanced)' },
          shapes: {
            label: 'Shapes',
            itemLabel: 'Shape',
            help: 'Tip: shapes can also be moved directly on the canvas and adjusted in the toolbar above it.',
            item: {
              type: { label: 'Type' },
              text: { label: 'Text' },
              sides: { label: 'Corners' },
              color: { label: 'Line color' },
              fill: { label: 'Fill color' },
              isCorrect: { label: 'Correct answer (click mode)' },
              blank: { label: 'As blank (label mode)' },
              correctText: { label: 'Solution (blank)' },
              isTarget: { label: 'Target zone (hotspot mode)' },
              isMarker: { label: 'Movable marker (hotspot mode)' },
              markerTargetIdx: { label: 'Index of the correct target zone' },
              yesnoCorrect: { label: 'Correct answer (yes/no field)' },
              yesnoPoints: { label: 'Points (yes/no field)' }
            }
          }
        },
        toolbar: {
          yesno: {
            correctLabel: 'Correct:',
            correctTitle: 'Which answer is correct?',
            pointsLabel: 'Points:',
            pointsTitle: 'Points for this field (default 1)'
          },
          tool: {
            move: 'Move tool (V)',
            select: 'Selection tool (S): drag a box for multi-select'
          },
          template: {
            title: 'Insert template (rectangle, triangle, Pythagoras, circle)',
            label: 'Template…'
          },
          addShape: 'Add {name}',
          mode: {
            none: 'Display only',
            acknowledge: 'Got-it button',
            fillblanks: 'With solution',
            chipTitle: 'Switch grading mode',
            aria: 'Grading mode: {name}'
          },
          addVariable: {
            title: 'Create a new random variable (name, min, max)',
            label: '+ Variable'
          },
          editVariables: {
            titleSingular: '{count} variable defined. Click to edit.',
            titlePlural: '{count} variables defined. Click to edit.',
            label: 'Variables ({count})'
          },
          shapes: {
            titleSingular: '{count} shape in this composition. Click to select.',
            titlePlural: '{count} shapes in this composition. Click to select.',
            label: 'Shapes ({count})'
          },
          transparent: {
            activeTitle: 'Transparent active. Click for color',
            setTitle: 'Set to transparent'
          },
          color: {
            stroke: 'Line',
            axis: 'Axis',
            text: 'Text',
            fill: 'Fill'
          },
          polygon: {
            cornersLabel: 'Corners',
            cornersTitle: 'Number of corners (regenerates as regular)',
            regularLabel: 'Regular',
            regularTitle: 'Reset to a regular polygon'
          },
          strokeWidthLabel: 'Width',
          dash: {
            title: 'Line style',
            solid: '─ solid',
            dashed: '┄ dashed',
            dotted: '┈ dotted'
          },
          label: {
            textPlaceholder: 'e.g. a or {a}',
            textTitle: 'Text content of the label',
            fontSizeTitle: 'Font size',
            boldAll: 'All bold',
            boldAllTitle: 'Show the whole label in bold (single words: select them and use the B button)',
            format: {
              bold: 'Bold (<b>…</b>)',
              italic: 'Italic (<i>…</i>)',
              underline: 'Underline (<u>…</u>)',
              sup: 'Superscript (<sup>…</sup>)',
              sub: 'Subscript (<sub>…</sub>)',
              lineBreak: 'Line break (<br>, also Shift+Enter when editing on the canvas)'
            }
          },
          insert: {
            title: 'Insert variable or special character',
            label: 'Insert ▾'
          },
          coords: {
            showGrid: 'Grid',
            showLabels: 'Axis labels',
            xMin: 'x min',
            xMax: 'x max',
            yMin: 'y min',
            yMax: 'y max',
            step: 'Step',
            rangeTitle: 'Axis range {name}',
            stepTitle: 'Spacing between grid and labels'
          },
          image: {
            replace: 'Replace image…'
          },
          grading: {
            isCorrect: 'Correct',
            isTarget: 'Target zone',
            isMarker: 'Marker',
            targetOption: 'Target #{idx} ({name})',
            targetTitle: 'Correct target zone',
            targetChoose: '(choose target)',
            formulaTitle: 'Configure formula and tolerance for the answer field',
            formulaLabel: 'Formula ▾'
          },
          action: {
            forward: 'Bring forward',
            backward: 'Send backward',
            duplicate: 'Duplicate',
            delete: 'Delete shape'
          }
        },
        popover: {
          insert: {
            solutionsHead: 'Solution fields',
            newSlotTitle: 'New answer input (slot {slot})',
            mirrorTitle: 'Mirror: shows the student answer from slot {slot} (also usable in formulas)',
            hint: '<strong>{N}</strong>: answer field · <strong>{N*}</strong>: reuse the student answer (in text or in a formula)',
            variablesHead: 'Variables',
            globalVariablesHead: 'Global variables (course settings)',
            symbolsHead: 'Special characters'
          },
          grading: {
            blankToggle: '<strong>Blank</strong>: label becomes an answer input',
            formulaForSlot: 'Formula for {slot}',
            formulaGeneric: 'Formula (with variables)',
            formulaPlaceholder: 'e.g. a*b · sqrt(a*a+b*b) · sqrt({1*})',
            formulaTitle: 'Formula · student answers as {1*}, {2*} … or s1, s2 …',
            helpSqrt: 'Square root',
            helpPi: 'Pi (π)',
            helpSquare: 'Square',
            trigSelectTitle: 'Insert a trig function (unit: see "Angles in" below)',
            trigSelectPlaceholder: 'sin/cos…',
            angleUnitLabel: 'Angles in',
            angleUnitTitle: 'Applies to sin, cos, tan, arcsin, arccos, arctan (= asin, acos, atan) in every formula of this block. sind(), cosd() … always use degrees.',
            angleUnitDeg: 'Degrees (°), e.g. sin(30) = 0.5',
            angleUnitRad: 'Radians, e.g. sin(pi/6) = 0.5',
            varsSelectTitle: 'Insert a variable into the formula',
            varsSelectPlaceholder: 'Variable…',
            globalSuffix: 'global',
            slotSelectTitle: 'Insert the student answer from another slot into the formula',
            slotSelectPlaceholder: 'Answer {N*}…',
            multiSlotHintOne: 'Slot <strong>{slot}</strong>: formula for the expected answer.',
            multiSlotHintMany: 'One formula per slot. Use <code>{N*}</code> or <code>s<i>N</i></code> to reuse the answer from an earlier slot.',
            staticLabel: 'Solution (static)',
            staticPlaceholder: 'e.g. 42 or "water"',
            staticTitle: 'Expected answer without a calculation. Ignored as soon as a formula is set.'
          },
          polygon: {
            title: 'Insert polygon',
            subtitle: 'Choose a preset'
          },
          varTable: {
            title: 'Variables',
            subtitle: 'Edit table',
            colName: 'Name',
            colMin: 'Min',
            colMax: 'Max',
            colInteger: 'Int',
            removeTitle: 'Remove variable',
            addRow: '+ Variable',
            cancel: 'Cancel',
            save: 'Save',
            validate: {
              needName: 'Every variable needs a name.',
              invalidName: 'Invalid name: {name}',
              duplicateName: 'Duplicate name: {name}',
              rangeInvalid: 'Range invalid for {name} (min ≤ max).'
            }
          },
          shapes: {
            title: 'Shapes',
            subtitle: 'click to select'
          },
          varAdd: {
            title: 'New variable',
            subtitle: 'Use as {name} in label text',
            name: 'Name',
            min: 'Min',
            max: 'Max',
            integerOnly: 'Integers only',
            cancel: 'Cancel',
            add: 'Add',
            validate: {
              startWithLetter: 'Variable name must start with a letter or underscore.',
              exists: 'Variable "{name}" already exists.',
              rangeInvalid: 'Range invalid (min ≤ max).'
            }
          },
          template: {
            title: 'Insert template',
            subtitle: 'Replaces the current composition'
          },
          templateChooser: {
            question: 'This composition already has shapes. How should <strong>{name}</strong> be inserted?',
            cancel: 'Cancel',
            append: 'Append',
            replace: 'Replace',
            explain: '<strong>Append</strong> keeps existing shapes and variables (renamed on name conflict). <strong>Replace</strong> discards everything.'
          }
        },
        runtime: {
          acknowledge: {
            button: 'Got it ({pts} pts.)',
            confirmed: 'Confirmed. {pts} / {max} points.'
          },
          click: {
            allFound: 'All correct shapes found.',
            finish: 'Done',
            summary: '{found} / {total} correct shapes → {pts} / {max} points.',
            summaryWithWrong: '{found} / {total} correct shapes, {wrong} wrong → {pts} / {max} points.'
          },
          fillblanks: {
            regenerated: 'New values generated.',
            noBlanks: 'No blanks defined.',
            solutionTitle: 'Solution: {solution}',
            summary: '{correct} / {total} blanks correct → {pts} / {max} points.',
            summaryWithPartial: '{correct} / {total} blanks correct, {partial} follow-through errors (half points) → {pts} / {max} points.'
          },
          hotspot: {
            noMarkers: 'No markers defined.',
            summary: '{correct} / {total} markers correct → {pts} / {max} points.'
          }
        }
      }
    }
  };

  if(window.BlockUtils && typeof window.BlockUtils.registerLocale === 'function'){
    window.BlockUtils.registerLocale('en', bundle);
  } else {
    window.__ScormI18nPending = window.__ScormI18nPending || [];
    window.__ScormI18nPending.push(['en', bundle]);
  }
})();
