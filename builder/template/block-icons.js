// block-icons.js: Inline-SVG icon set for every block type.
// Blocks set `icon: '<key>'`; BlockIcons.get(key) resolves the SVG.
// Unknown keys fall back to the icon string (legacy ASCII labels).
(function(){
  'use strict';
  if(window.BlockIcons && window.BlockIcons._v >= 94) return;
  // Bump on icon changes so cached older versions don't shadow.
  const _v = 94;

  // 20x20 viewBox, 1.8 px stroke, rounded caps; renders at 18 px in 30 px chip.
  const SVG_OPEN  = '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  const SVG_CLOSE = '</svg>';
  function svg(inner){ return SVG_OPEN + inner + SVG_CLOSE; }

  const ICONS = {
    // Inhalt
    'heading':       svg('<path d="M5 4 L5 16 M15 4 L15 16 M5 10 L15 10"/>'),
    'rich-text':     svg('<path d="M4 5 L16 5 M4 10 L16 10 M4 15 L11 15"/>'),
    'note-box':      svg('<circle cx="10" cy="10" r="7"/><path d="M10 7 L10 11 M10 13.5 L10 13.6"/>'),
    'image':         svg('<rect x="3" y="4.5" width="14" height="11" rx="1"/><circle cx="8" cy="9" r="1.3" fill="currentColor" stroke="none"/><path d="M3 13.5 L8 9.5 L13 13.5 L17 11"/>'),
    'divider':       svg('<path d="M2.5 10 L17.5 10"/><path d="M2 6.5 L4 6.5 M16 6.5 L18 6.5 M2 13.5 L4 13.5 M16 13.5 L18 13.5" opacity="0.45"/>'),
    // Speaker silhouette + 2 sound-wave arcs.
    'audio':         svg('<path d="M4 8 L7.5 8 L11.5 5 L11.5 15 L7.5 12 L4 12 Z" fill="currentColor" stroke="none"/><path d="M14 7.5 C 15.3 8.8, 15.3 11.2, 14 12.5"/><path d="M16 5.5 C 18.2 7.7, 18.2 12.3, 16 14.5" opacity="0.55"/>'),
    // Video player: screen + play triangle.
    'video':         svg('<rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M8 7.5 L8 12.5 L12.5 10 Z" fill="currentColor" stroke="none"/>'),
    // Document with folded corner + downward arrow.
    'file-download': svg('<path d="M5 2.5 L12 2.5 L15.5 6 L15.5 17.5 L5 17.5 Z"/><path d="M12 2.5 L12 6 L15.5 6"/><path d="M10 9.5 L10 13.5 M8 12 L10 14 L12 12" stroke-linejoin="round"/>'),
    // 3 lines with checkmarks: key-points list.
    'summary':       svg('<path d="M4 5 L5.5 6.5 L7.5 4.5 M9 5.5 L16 5.5 M4 10 L5.5 11.5 L7.5 9.5 M9 10.5 L16 10.5 M4 15 L5.5 16.5 L7.5 14.5 M9 15.5 L16 15.5"/>'),
    // Star row: rating / feedback.
    'survey':        svg('<path d="M5 6.2 L6.05 8.4 L8.4 8.7 L6.7 10.3 L7.1 12.6 L5 11.5 L2.9 12.6 L3.3 10.3 L1.6 8.7 L3.95 8.4 Z" fill="currentColor" stroke="none"/><path d="M10 6.2 L11.05 8.4 L13.4 8.7 L11.7 10.3 L12.1 12.6 L10 11.5 L7.9 12.6 L8.3 10.3 L6.6 8.7 L8.95 8.4 Z" fill="currentColor" stroke="none"/><path d="M15 6.2 L16.05 8.4 L18.4 8.7 L16.7 10.3 L17.1 12.6 L15 11.5 L12.9 12.6 L13.3 10.3 L11.6 8.7 L13.95 8.4 Z" fill="currentColor" stroke="none" opacity="0.4"/>'),
    'code':          svg('<path d="M7.5 6 L4 10 L7.5 14 M12.5 6 L16 10 L12.5 14"/>'),
    'composition':   svg('<rect x="3" y="3" width="14" height="14" rx="1.5"/><circle cx="7" cy="8" r="1.5"/><path d="M11 6 L15 10 L11 14 Z"/>'),

    // Question
    'multiple-choice': svg('<rect x="3.5" y="3.5" width="13" height="13" rx="2"/><path d="M6.5 10.2 L9 12.5 L14 7"/>'),
    // "#" shape.
    'numeric-input':   svg('<path d="M7.5 3.5 L6 16.5 M13.5 3.5 L12 16.5 M3.5 8 L16.5 8 M3.5 12 L16.5 12"/>'),
    // Capital T + blinking-cursor stroke: single-line text input.
    'text-input':      svg('<path d="M5 5.5 L15 5.5 M10 5.5 L10 14 M5 16.5 L15 16.5"/><path d="M16 9 L16 13" opacity="0.7"/>'),
    // Two text lines around a blank cell: fill-in-the-blank.
    'cloze':           svg('<path d="M2.5 5 L8.5 5 M11.5 5 L17.5 5"/><rect x="6" y="9" width="8" height="5" rx="0.7"/><path d="M2.5 17 L7 17 M13 17 L17.5 17"/>'),
    'match-pairs':     svg('<rect x="3" y="4" width="5" height="3.5" rx="0.5"/><rect x="3" y="12.5" width="5" height="3.5" rx="0.5"/><rect x="12" y="4" width="5" height="3.5" rx="0.5"/><rect x="12" y="12.5" width="5" height="3.5" rx="0.5"/><path d="M8 5.75 L12 14.25 M8 14.25 L12 5.75"/>'),
    // Image frame + highlighted region + cursor arrow.
    'hotzone':         svg('<rect x="2.5" y="3" width="15" height="12" rx="1"/><rect x="4.5" y="5" width="6" height="5" rx="0.5" fill="currentColor" stroke="none" opacity="0.22"/><rect x="4.5" y="5" width="6" height="5" rx="0.5"/><path d="M13 10.5 L13 16 L14.7 14.5 L16 17 L17 16.4 L15.7 14 L17.8 13.4 Z" fill="currentColor" stroke="none"/>'),
    // Two-dot grip + 3 rows: reorderable list.
    'sort-list':       svg('<circle cx="4" cy="6"  r="0.9" fill="currentColor" stroke="none"/><circle cx="6.5" cy="6"  r="0.9" fill="currentColor" stroke="none"/><circle cx="4" cy="10" r="0.9" fill="currentColor" stroke="none"/><circle cx="6.5" cy="10" r="0.9" fill="currentColor" stroke="none"/><circle cx="4" cy="14" r="0.9" fill="currentColor" stroke="none"/><circle cx="6.5" cy="14" r="0.9" fill="currentColor" stroke="none"/><path d="M9.5 6 L17 6 M9.5 10 L17 10 M9.5 14 L17 14"/>'),
    'complex-question':svg('<path d="M4 10 L16 10 M10 4 L10 16"/><circle cx="13" cy="7" r="2"/>'),
    // "a+bi" complex-number notation.
    'complex-input':   svg('<text x="10" y="14" font-family="Georgia, Times New Roman, serif" font-size="8" font-style="italic" font-weight="800" fill="currentColor" stroke="none" text-anchor="middle" letter-spacing="-0.15">a+bi</text>'),
    'function-question': svg('<path d="M3 17 L3 3 M3 17 L17 17"/><path d="M3 14 C 6 14, 8 4, 11 4 S 14 14, 17 14"/>'),
    'vector-question': svg('<path d="M4 16 L16 4"/><path d="M11 4 L16 4 L16 9"/>'),
    // Bold "0x": hex-literal prefix.
    'number-base':     svg('<text x="10" y="14.5" font-family="Verdana,Arial,sans-serif" font-size="11.5" font-weight="800" fill="currentColor" stroke="none" text-anchor="middle" letter-spacing="-0.4">0x</text>'),
    'unit-convert':    svg('<path d="M5 7 L13 7 M11 5 L13 7 L11 9"/><path d="M15 13 L7 13 M9 11 L7 13 L9 15"/>'),
    'truth-table':     svg('<rect x="3" y="4" width="14" height="12" rx="0.5"/><path d="M3 8 L17 8 M10 4 L10 16"/>'),
    // Symmetric 3x3 grid.
    'table':           svg('<rect x="3" y="3" width="14" height="14" rx="1"/><path d="M3 8 L17 8 M3 12 L17 12 M8 3 L8 17 M12 3 L12 17"/>'),
    // Curly brace + 2 equation lines.
    'equation-system': svg('<path d="M5 3 Q3 3 3 5 L3 9 Q3 10 2 10 Q3 10 3 11 L3 15 Q3 17 5 17"/><path d="M7 7 L17 7 M7 13 L17 13"/>'),

    // Visualisierung
    'function-sandbox': svg('<path d="M3 17 L3 3 M3 17 L17 17"/><path d="M3 13 C 7 13, 9 7, 13 7 S 17 11, 17 11"/><circle cx="13" cy="7" r="1.4" fill="currentColor" stroke="none"/>')
  };

  window.BlockIcons = {
    _v: _v,
    get(key){ return ICONS[key] || null; },
    has(key){ return Object.prototype.hasOwnProperty.call(ICONS, key); },
    keys(){ return Object.keys(ICONS); }
  };
})();
