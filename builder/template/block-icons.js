// block-icons.js: Canonical inline-SVG icon set for every block type.
// Same viewBox, stroke, and currentColor across the board. Blocks set
// `icon: '<key>'` and window.BlockIcons.get(key) resolves the SVG.
// Unknown keys fall back to the icon string verbatim (legacy ASCII labels).
(function(){
  'use strict';
  if(window.BlockIcons && window.BlockIcons._v >= 94) return;
  // Bump on icon changes so cached older versions don't shadow.
  const _v = 94;

  // 20x20 viewBox, 1.8 px stroke, rounded caps. Renders at 18 px on the
  // welcome cards (30 px chip).
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
    // Audio: speaker silhouette + 2 sound-wave arcs to the right. The arcs
    // sit far enough from the cone that the icon stays legible at 30 px.
    'audio':         svg('<path d="M4 8 L7.5 8 L11.5 5 L11.5 15 L7.5 12 L4 12 Z" fill="currentColor" stroke="none"/><path d="M14 7.5 C 15.3 8.8, 15.3 11.2, 14 12.5"/><path d="M16 5.5 C 18.2 7.7, 18.2 12.3, 16 14.5" opacity="0.55"/>'),
    // Video: rounded rectangle (screen) with a play triangle centred inside.
    // Reads as "video player" at any size.
    'video':         svg('<rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M8 7.5 L8 12.5 L12.5 10 Z" fill="currentColor" stroke="none"/>'),
    // File-Download: document silhouette with a folded corner and a
    // downward arrow at the bottom-centre. Unambiguous "download file".
    'file-download': svg('<path d="M5 2.5 L12 2.5 L15.5 6 L15.5 17.5 L5 17.5 Z"/><path d="M12 2.5 L12 6 L15.5 6"/><path d="M10 9.5 L10 13.5 M8 12 L10 14 L12 12" stroke-linejoin="round"/>'),
    // Summary: 3 horizontal lines with a checkmark on the left of each.
    // Reads as "key-points list / takeaways".
    'summary':       svg('<path d="M4 5 L5.5 6.5 L7.5 4.5 M9 5.5 L16 5.5 M4 10 L5.5 11.5 L7.5 9.5 M9 10.5 L16 10.5 M4 15 L5.5 16.5 L7.5 14.5 M9 15.5 L16 15.5"/>'),
    // Survey: a 5-star bar (3 stars). Reads as "rating / feedback".
    'survey':        svg('<path d="M5 6.2 L6.05 8.4 L8.4 8.7 L6.7 10.3 L7.1 12.6 L5 11.5 L2.9 12.6 L3.3 10.3 L1.6 8.7 L3.95 8.4 Z" fill="currentColor" stroke="none"/><path d="M10 6.2 L11.05 8.4 L13.4 8.7 L11.7 10.3 L12.1 12.6 L10 11.5 L7.9 12.6 L8.3 10.3 L6.6 8.7 L8.95 8.4 Z" fill="currentColor" stroke="none"/><path d="M15 6.2 L16.05 8.4 L18.4 8.7 L16.7 10.3 L17.1 12.6 L15 11.5 L12.9 12.6 L13.3 10.3 L11.6 8.7 L13.95 8.4 Z" fill="currentColor" stroke="none" opacity="0.4"/>'),
    'code':          svg('<path d="M7.5 6 L4 10 L7.5 14 M12.5 6 L16 10 L12.5 14"/>'),
    'composition':   svg('<rect x="3" y="3" width="14" height="14" rx="1.5"/><circle cx="7" cy="8" r="1.5"/><path d="M11 6 L15 10 L11 14 Z"/>'),

    // Frage
    'multiple-choice': svg('<rect x="3.5" y="3.5" width="13" height="13" rx="2"/><path d="M6.5 10.2 L9 12.5 L14 7"/>'),
    // "#" with two horizontal + two slightly-tilted vertical strokes (a clean
    // hash shape).
    'numeric-input':   svg('<path d="M7.5 3.5 L6 16.5 M13.5 3.5 L12 16.5 M3.5 8 L16.5 8 M3.5 12 L16.5 12"/>'),
    // Capital T sitting on a baseline, with a blinking-cursor-style mark on
    // the right - reads as a single-line text input.
    'text-input':      svg('<path d="M5 5.5 L15 5.5 M10 5.5 L10 14 M5 16.5 L15 16.5"/><path d="M16 9 L16 13" opacity="0.7"/>'),
    // Top text line + an empty box centered (a labelled blank cell) +
    // bottom text line. Reads as "fill in the blank" without depending on
    // stroke thickness fusing the small inner rectangle into a solid blob.
    'cloze':           svg('<path d="M2.5 5 L8.5 5 M11.5 5 L17.5 5"/><rect x="6" y="9" width="8" height="5" rx="0.7"/><path d="M2.5 17 L7 17 M13 17 L17.5 17"/>'),
    'match-pairs':     svg('<rect x="3" y="4" width="5" height="3.5" rx="0.5"/><rect x="3" y="12.5" width="5" height="3.5" rx="0.5"/><rect x="12" y="4" width="5" height="3.5" rx="0.5"/><rect x="12" y="12.5" width="5" height="3.5" rx="0.5"/><path d="M8 5.75 L12 14.25 M8 14.25 L12 5.75"/>'),
    // Image frame with one marked hotzone (filled translucent rectangle) +
    // a small cursor arrow over it - reads as "click the right area".
    'hotzone':         svg('<rect x="2.5" y="3" width="15" height="12" rx="1"/><rect x="4.5" y="5" width="6" height="5" rx="0.5" fill="currentColor" stroke="none" opacity="0.22"/><rect x="4.5" y="5" width="6" height="5" rx="0.5"/><path d="M13 10.5 L13 16 L14.7 14.5 L16 17 L17 16.4 L15.7 14 L17.8 13.4 Z" fill="currentColor" stroke="none"/>'),
    // Drag-handle (two-dot grip) on the left of each row → unmistakably a
    // reorderable list. Distinct from rich-text/cloze that don't have grips.
    'sort-list':       svg('<circle cx="4" cy="6"  r="0.9" fill="currentColor" stroke="none"/><circle cx="6.5" cy="6"  r="0.9" fill="currentColor" stroke="none"/><circle cx="4" cy="10" r="0.9" fill="currentColor" stroke="none"/><circle cx="6.5" cy="10" r="0.9" fill="currentColor" stroke="none"/><circle cx="4" cy="14" r="0.9" fill="currentColor" stroke="none"/><circle cx="6.5" cy="14" r="0.9" fill="currentColor" stroke="none"/><path d="M9.5 6 L17 6 M9.5 10 L17 10 M9.5 14 L17 14"/>'),
    'complex-question':svg('<path d="M4 10 L16 10 M10 4 L10 16"/><circle cx="13" cy="7" r="2"/>'),
    'function-question': svg('<path d="M3 17 L3 3 M3 17 L17 17"/><path d="M3 14 C 6 14, 8 4, 11 4 S 14 14, 17 14"/>'),
    'vector-question': svg('<path d="M4 16 L16 4"/><path d="M11 4 L16 4 L16 9"/>'),
    // Big bold "0x" - the universal hex-literal prefix used in every
    // programming language. Instantly recognizable as "number bases / hex"
    // and stays legible from 30 px chip all the way up to poster size.
    'number-base':     svg('<text x="10" y="14.5" font-family="Verdana,Arial,sans-serif" font-size="11.5" font-weight="800" fill="currentColor" stroke="none" text-anchor="middle" letter-spacing="-0.4">0x</text>'),
    'unit-convert':    svg('<path d="M5 7 L13 7 M11 5 L13 7 L11 9"/><path d="M15 13 L7 13 M9 11 L7 13 L9 15"/>'),
    'truth-table':     svg('<rect x="3" y="4" width="14" height="12" rx="0.5"/><path d="M3 8 L17 8 M10 4 L10 16"/>'),
    // Grid with header row + 3 data rows.
    'table':           svg('<rect x="2" y="3" width="16" height="14" rx="1"/><path d="M2 7 L18 7 M10 3 L10 17 M2 11 L18 11 M2 14 L18 14"/>'),
    // Curly brace + two equation lines for a linear system.
    'equation-system': svg('<path d="M5 3 Q3 3 3 5 L3 9 Q3 10 2 10 Q3 10 3 11 L3 15 Q3 17 5 17"/><path d="M7 7 L17 7 M7 13 L17 13"/>'),

    // Visualisierung
    'function-sandbox': svg('<path d="M3 17 L3 3 M3 17 L17 17"/><path d="M3 13 C 7 13, 9 7, 13 7 S 17 11, 17 11"/><circle cx="13" cy="7" r="1.4" fill="currentColor" stroke="none"/>')
  };

  window.BlockIcons = {
    _v: _v,
    /** Lookup the SVG for a block id (or an icon key the block declares). */
    get(key){ return ICONS[key] || null; },
    /** True iff a custom SVG exists for this key. */
    has(key){ return Object.prototype.hasOwnProperty.call(ICONS, key); },
    /** All registered keys, for sanity checks. */
    keys(){ return Object.keys(ICONS); }
  };
})();
