(function(){
  'use strict';

  // Einheitenregister
  // Umrechnung: Basiswert = Wert × factor + (off || 0)
  //             Ergebnis  = (Basiswert − (off || 0)) / factor
  // Temperatur: Basis = Kelvin; off kompensiert den Nullpunkts-Versatz.
  const UREG = {
    'nm':  { label:'nm',           cat:'Länge',            factor:1e-9 },
    'μm':  { label:'μm',           cat:'Länge',            factor:1e-6 },
    'mm':  { label:'mm',           cat:'Länge',            factor:1e-3 },
    'cm':  { label:'cm',           cat:'Länge',            factor:0.01 },
    'm':   { label:'m',            cat:'Länge',            factor:1 },
    'km':  { label:'km',           cat:'Länge',            factor:1000 },
    'in':  { label:'in (Zoll)',    cat:'Länge',            factor:0.0254 },
    'ft':  { label:'ft (Fuß)',     cat:'Länge',            factor:0.3048 },
    'mi':  { label:'mi (Meile)',   cat:'Länge',            factor:1609.344 },

    'mg':  { label:'mg',           cat:'Masse',            factor:1e-6 },
    'g':   { label:'g',            cat:'Masse',            factor:1e-3 },
    'kg':  { label:'kg',           cat:'Masse',            factor:1 },
    't':   { label:'t (Tonne)',    cat:'Masse',            factor:1000 },
    'lb':  { label:'lb (Pfund)',   cat:'Masse',            factor:0.453592 },
    'oz':  { label:'oz (Unze)',    cat:'Masse',            factor:0.028350 },

    'ns':  { label:'ns',           cat:'Zeit',             factor:1e-9 },
    'μs':  { label:'μs',           cat:'Zeit',             factor:1e-6 },
    'ms':  { label:'ms',           cat:'Zeit',             factor:1e-3 },
    's':   { label:'s',            cat:'Zeit',             factor:1 },
    'min': { label:'min',          cat:'Zeit',             factor:60 },
    'h':   { label:'h',            cat:'Zeit',             factor:3600 },
    'd':   { label:'d (Tag)',      cat:'Zeit',             factor:86400 },

    'm/s': { label:'m/s',          cat:'Geschwindigkeit',  factor:1 },
    'km/h':{ label:'km/h',         cat:'Geschwindigkeit',  factor:1/3.6 },
    'mph': { label:'mph',          cat:'Geschwindigkeit',  factor:0.44704 },
    'kn':  { label:'kn (Knoten)', cat:'Geschwindigkeit',  factor:0.514444 },
    'km/s':{ label:'km/s',         cat:'Geschwindigkeit',  factor:1000 },

    'K':   { label:'K',            cat:'Temperatur',       factor:1,     off:0 },
    '°C':  { label:'°C',           cat:'Temperatur',       factor:1,     off:273.15 },
    '°F':  { label:'°F',           cat:'Temperatur',       factor:5/9,   off:255.3722 },

    'Pa':  { label:'Pa',           cat:'Druck',            factor:1 },
    'hPa': { label:'hPa',          cat:'Druck',            factor:100 },
    'kPa': { label:'kPa',          cat:'Druck',            factor:1000 },
    'MPa': { label:'MPa',          cat:'Druck',            factor:1e6 },
    'mbar':{ label:'mbar',         cat:'Druck',            factor:100 },
    'bar': { label:'bar',          cat:'Druck',            factor:1e5 },
    'atm': { label:'atm',          cat:'Druck',            factor:101325 },
    'psi': { label:'psi',          cat:'Druck',            factor:6894.757 },
    'mmHg':{ label:'mmHg (Torr)', cat:'Druck',            factor:133.322 },

    'J':   { label:'J',            cat:'Energie',          factor:1 },
    'kJ':  { label:'kJ',           cat:'Energie',          factor:1000 },
    'MJ':  { label:'MJ',           cat:'Energie',          factor:1e6 },
    'GJ':  { label:'GJ',           cat:'Energie',          factor:1e9 },
    'Wh':  { label:'Wh',           cat:'Energie',          factor:3600 },
    'kWh': { label:'kWh',          cat:'Energie',          factor:3.6e6 },
    'MWh': { label:'MWh',          cat:'Energie',          factor:3.6e9 },
    'cal': { label:'cal',          cat:'Energie',          factor:4.184 },
    'kcal':{ label:'kcal',         cat:'Energie',          factor:4184 },
    'eV':  { label:'eV',           cat:'Energie',          factor:1.60218e-19 },

    'mW':  { label:'mW',           cat:'Leistung',         factor:1e-3 },
    'W':   { label:'W',            cat:'Leistung',         factor:1 },
    'kW':  { label:'kW',           cat:'Leistung',         factor:1000 },
    'MW':  { label:'MW',           cat:'Leistung',         factor:1e6 },
    'GW':  { label:'GW',           cat:'Leistung',         factor:1e9 },
    'hp':  { label:'hp (PS)',      cat:'Leistung',         factor:745.7 },

    'mN':  { label:'mN',           cat:'Kraft',            factor:1e-3 },
    'N':   { label:'N',            cat:'Kraft',            factor:1 },
    'kN':  { label:'kN',           cat:'Kraft',            factor:1000 },
    'MN':  { label:'MN',           cat:'Kraft',            factor:1e6 },

    'mm²': { label:'mm²',          cat:'Fläche',           factor:1e-6 },
    'cm²': { label:'cm²',          cat:'Fläche',           factor:1e-4 },
    'm²':  { label:'m²',           cat:'Fläche',           factor:1 },
    'ha':  { label:'ha',           cat:'Fläche',           factor:10000 },
    'km²': { label:'km²',          cat:'Fläche',           factor:1e6 },

    'mL':  { label:'mL = cm³',     cat:'Volumen',          factor:1e-6 },
    'dL':  { label:'dL',           cat:'Volumen',          factor:1e-4 },
    'L':   { label:'L',            cat:'Volumen',          factor:1e-3 },
    'm³':  { label:'m³',           cat:'Volumen',          factor:1 },

    'Hz':  { label:'Hz',           cat:'Frequenz',         factor:1 },
    'kHz': { label:'kHz',          cat:'Frequenz',         factor:1000 },
    'MHz': { label:'MHz',          cat:'Frequenz',         factor:1e6 },
    'GHz': { label:'GHz',          cat:'Frequenz',         factor:1e9 },

    'mV':  { label:'mV',           cat:'Spannung',         factor:1e-3 },
    'V':   { label:'V',            cat:'Spannung',         factor:1 },
    'kV':  { label:'kV',           cat:'Spannung',         factor:1000 },

    'μA':  { label:'μA',           cat:'Stromstärke',      factor:1e-6 },
    'mA':  { label:'mA',           cat:'Stromstärke',      factor:1e-3 },
    'A':   { label:'A',            cat:'Stromstärke',      factor:1 },
    'kA':  { label:'kA',           cat:'Stromstärke',      factor:1000 },

    'mΩ':  { label:'mΩ',           cat:'Widerstand',       factor:1e-3 },
    'Ω':   { label:'Ω',            cat:'Widerstand',       factor:1 },
    'kΩ':  { label:'kΩ',           cat:'Widerstand',       factor:1000 },
    'MΩ':  { label:'MΩ',           cat:'Widerstand',       factor:1e6 },

    'bit': { label:'bit',          cat:'Datenmenge',       factor:0.125 },
    'B':   { label:'B (Byte)',     cat:'Datenmenge',       factor:1 },
    'KB':  { label:'KB (1000 B)', cat:'Datenmenge',       factor:1000 },
    'MB':  { label:'MB',           cat:'Datenmenge',       factor:1e6 },
    'GB':  { label:'GB',           cat:'Datenmenge',       factor:1e9 },
    'TB':  { label:'TB',           cat:'Datenmenge',       factor:1e12 },
    'KiB': { label:'KiB (1024 B)',cat:'Datenmenge',       factor:1024 },
    'MiB': { label:'MiB',          cat:'Datenmenge',       factor:1048576 },
    'GiB': { label:'GiB',          cat:'Datenmenge',       factor:1073741824 },
    'TiB': { label:'TiB',          cat:'Datenmenge',       factor:1099511627776 },
  };

  // Hilfsfunktionen
  function convertUnits(value, fromId, toId){
    const from = UREG[fromId], to = UREG[toId];
    if(!from || !to || from.cat !== to.cat) return null;
    const base = value * from.factor + (from.off || 0);
    return (base - (to.off || 0)) / to.factor;
  }

  function fmtNum(v){
    if(v == null || !isFinite(v)) return '?';
    if(v === 0) return '0';
    const abs = Math.abs(v);
    if(abs >= 0.0001 && abs < 1e9) return String(parseFloat(v.toPrecision(6)));
    return parseFloat(v.toPrecision(5)).toExponential();
  }

  function nearlyEqual(a, b, tol){
    if(b === 0) return Math.abs(a) <= tol;
    return Math.abs((a - b) / b) <= tol;
  }

  function fillTemplate(tpl, value, fromUnit, toUnit){
    return String(tpl || 'Rechnen Sie {value} {fromUnit} in {toUnit} um.')
      .replace(/\{value\}/g,    fmtNum(value))
      .replace(/\{fromUnit\}/g, fromUnit || '?')
      .replace(/\{toUnit\}/g,   toUnit || '?');
  }

  // Beispiel-Vorlagen
  const PRESET_OPTIONS = [
    {value:'custom',     label:'Manuell (leer)'},
    {value:'ex-speed',   label:'Beispiel: Geschwindigkeit  (km/h, mph, m/s, kn)'},
    {value:'ex-temp',    label:'Beispiel: Temperatur  (°C, K, °F)'},
    {value:'ex-energy',  label:'Beispiel: Energie  (kWh, MJ, kJ, kcal)'},
    {value:'ex-pressure',label:'Beispiel: Druck  (bar, Pa, atm, mmHg, psi)'},
    {value:'ex-data',    label:'Beispiel: Datenmenge  (GiB ↔ GB, MiB ↔ MB)'},
    {value:'ex-power',   label:'Beispiel: Leistung  (hp, kW, W)'},
    {value:'ex-length',  label:'Beispiel: Länge  (nm, μm, km, mi, in)'},
    {value:'ex-mixed',   label:'Beispiel: Gemischt - alle Kategorien'}
  ];

  const EXAMPLE_PRESETS = {
    'ex-speed': {
      questionTemplate: 'Rechnen Sie {value} {fromUnit} in {toUnit} um.',
      variants: [
        { fromUnit:'km/h', toUnit:'m/s',  valueMin:30, valueMax:200, integer:true },
        { fromUnit:'mph',  toUnit:'km/h', valueMin:20, valueMax:120, integer:true },
        { fromUnit:'m/s',  toUnit:'km/h', valueMin:10, valueMax:50,  integer:true },
        { fromUnit:'kn',   toUnit:'km/h', valueMin:5,  valueMax:50,  integer:true }
      ],
      randomSwap: false, tolerance: 0.02
    },
    'ex-temp': {
      questionTemplate: 'Wandeln Sie {value} {fromUnit} in {toUnit} um.',
      variants: [
        { fromUnit:'°C', toUnit:'K',  valueMin:-50, valueMax:200, integer:true },
        { fromUnit:'°C', toUnit:'°F', valueMin:-40, valueMax:120, integer:true },
        { fromUnit:'K',  toUnit:'°C', valueMin:200, valueMax:400, integer:true }
      ],
      randomSwap: false, tolerance: 0.02
    },
    'ex-energy': {
      questionTemplate: 'Rechnen Sie {value} {fromUnit} in {toUnit} um.',
      variants: [
        { fromUnit:'kWh',  toUnit:'MJ',  valueMin:1,    valueMax:10,   integer:false },
        { fromUnit:'kcal', toUnit:'kJ',  valueMin:50,   valueMax:1000, integer:true },
        { fromUnit:'J',    toUnit:'cal', valueMin:100,  valueMax:5000, integer:true }
      ],
      randomSwap: true, tolerance: 0.02
    },
    'ex-pressure': {
      questionTemplate: 'Rechnen Sie {value} {fromUnit} in {toUnit} um.',
      variants: [
        { fromUnit:'bar',  toUnit:'kPa',  valueMin:0.5, valueMax:10,  integer:false },
        { fromUnit:'hPa',  toUnit:'atm',  valueMin:900, valueMax:1100,integer:true },
        { fromUnit:'mmHg', toUnit:'kPa',  valueMin:300, valueMax:800, integer:true },
        { fromUnit:'psi',  toUnit:'bar',  valueMin:10,  valueMax:100, integer:true }
      ],
      randomSwap: true, tolerance: 0.02
    },
    'ex-data': {
      questionTemplate: 'Wie viele {toUnit} sind {value} {fromUnit}?',
      variants: [
        { fromUnit:'GiB', toUnit:'GB',  valueMin:1,   valueMax:10,   integer:true },
        { fromUnit:'MiB', toUnit:'MB',  valueMin:1,   valueMax:1000, integer:true },
        { fromUnit:'KiB', toUnit:'MiB', valueMin:512, valueMax:5120, integer:true }
      ],
      randomSwap: true, tolerance: 0.005
    },
    'ex-power': {
      questionTemplate: 'Rechnen Sie {value} {fromUnit} in {toUnit} um.',
      variants: [
        { fromUnit:'hp', toUnit:'kW', valueMin:50,  valueMax:500,  integer:true },
        { fromUnit:'kW', toUnit:'W',  valueMin:0.5, valueMax:20,   integer:false }
      ],
      randomSwap: true, tolerance: 0.02
    },
    'ex-length': {
      questionTemplate: 'Wandeln Sie {value} {fromUnit} in {toUnit} um.',
      variants: [
        { fromUnit:'km', toUnit:'mi', valueMin:1, valueMax:100, integer:true },
        { fromUnit:'in', toUnit:'cm', valueMin:1, valueMax:50,  integer:true },
        { fromUnit:'m',  toUnit:'ft', valueMin:1, valueMax:100, integer:true },
        { fromUnit:'nm', toUnit:'μm', valueMin:100, valueMax:10000, integer:true }
      ],
      randomSwap: true, tolerance: 0.02
    },
    'ex-mixed': {
      questionTemplate: 'Rechnen Sie {value} {fromUnit} in {toUnit} um.',
      variants: [
        { fromUnit:'km/h', toUnit:'m/s', valueMin:30, valueMax:200, integer:true },
        { fromUnit:'°C',   toUnit:'K',   valueMin:0,  valueMax:100, integer:true },
        { fromUnit:'bar',  toUnit:'kPa', valueMin:1,  valueMax:10,  integer:true },
        { fromUnit:'kWh',  toUnit:'MJ',  valueMin:1,  valueMax:10,  integer:false },
        { fromUnit:'hp',   toUnit:'kW',  valueMin:50, valueMax:300, integer:true },
        { fromUnit:'GiB',  toUnit:'GB',  valueMin:1,  valueMax:10,  integer:true },
        { fromUnit:'N',    toUnit:'kN',  valueMin:100,valueMax:5000,integer:true }
      ],
      randomSwap: true, tolerance: 0.02
    }
  };

  function unitPresetConfig(config){
    const p = config.preset || 'custom';
    if(p === 'custom') return config;
    const ex = EXAMPLE_PRESETS[p];
    if(!ex) return config;
    return Object.assign({}, config, ex);
  }

  // Block-Registrierung
  Blocks.register('unit-convert', {
    label: 'Einheitenumrechnung',
    description: 'Physikalische Einheiten umrechnen mit zufälligen Werten.',
    category: 'Frage',
    icon: '⇌',
    graded: true,

    defaultConfig(){
      return {
        blockTitle: '',
        preset: 'custom',
        questionTemplate: '',
        variants: [],
        randomize: true,
        randomSwap: false,
        tolerance: 0.01,
        maxPoints: 1
      };
    },

    builderSchema(){
      const isCustom = c => (c.preset || 'custom') === 'custom';
      return [
        { key:'blockTitle', label:'Überschrift', type:'text', placeholder:'Einheitenumrechnung' },
        { key:'preset', label:'Vorlage', type:'select', options: PRESET_OPTIONS,
          help:'Beispiele zeigen alle Möglichkeiten des Blocks. „Manuell" für eigene Fragen.' },
        { type:'action', label:'↺ Zurücksetzen', action:'reset', showIf: isCustom },
        // Frage
        { type:'section', label:'Frage', key:'_sec_q' },
        { key:'questionTemplate', label:'Frage-Vorlage  (Variablen als {value}, {fromUnit}, {toUnit})', type:'text', showIf: isCustom,
          help:'Beispiel: „Rechnen Sie {value} {fromUnit} in {toUnit} um." Variablen werden bei jeder neuen Aufgabe belegt.' },
        // Zufallsvariablen
        { type:'section', label:'Zufallsvariablen', key:'_sec_vars' },
        { key:'variants', label:'Umrechnungen', type:'list', itemLabel:'Umrechnung',
          showIf: isCustom,
          itemSummary: item => {
            if(!item) return '…';
            const range = (item.valueMin ?? '') + ' … ' + (item.valueMax ?? '');
            return range + ' ' + (item.fromUnit || '?') + '  →  ' + (item.toUnit || '?') + (item.integer ? '  (ganz)' : '');
          },
          itemSchema:[
            { key:'_dir', type:'unit-from-to', label:'Richtung',
              fromKey:'fromUnit', toKey:'toUnit',
              defaultFrom:'km/h', defaultTo:'m/s',
              units: UREG },
            { key:'valueMin', label:'von', type:'number', step:'any', default: 0 },
            { key:'valueMax', label:'bis', type:'number', step:'any', default: 100 },
            { key:'integer',  label:'Nur Ganzzahlen',  type:'boolean' }
          ]},
        { key:'randomize',  label:'Variante zufällig wählen',     type:'boolean' },
        { key:'randomSwap', label:'Richtung zufällig vertauschen', type:'boolean' },
        // Lösung
        { type:'section', label:'Lösung', key:'_sec_solution' },
        { key:'tolerance', label:'Toleranz  (±, relativ)', type:'number', step:'any',
          help:'Abweichung, die noch als korrekt gilt. 0.01 = ±1 %.' },
        // Bewertung
        { type:'section', label:'Bewertung', key:'_sec_score' },
        { key:'maxPoints', label:'Punkte', type:'number', step:1, min:1 }
      ];
    },

    mount(host, config, api){
      const u = api.utils;
      let current = null;
      const ac = unitPresetConfig(config);
      const tol = Number(ac.tolerance) || 0.01;

      const ui = u.questionCard(host, {
        h3: ac.blockTitle || 'Aufgabe',
        qBoxTitle: 'Frage',
        inputLabel: 'Antwort',
        inputPlaceholder: 'Zahl eingeben'
      });
      const { qText, inp, checkBtn, newBtn, fb } = ui;

      // Unit label next to the answer input (same pattern as numeric-input's optional unit)
      const unitLbl = document.createElement('span');
      unitLbl.style.cssText = 'font-weight:700; color:var(--primary); margin-left:0.5rem; font-size:1.05rem;';
      if(inp.parentNode) inp.parentNode.insertBefore(unitLbl, inp.nextSibling);

      function genInstance(){
        const variants = (ac.variants || []).filter(v => v && v.fromUnit && v.toUnit);
        if(variants.length === 0) return null;
        const v = (ac.randomize !== false && variants.length > 1)
          ? variants[Math.floor(Math.random() * variants.length)]
          : variants[0];
        const min = Number(v.valueMin), max = Number(v.valueMax);
        let value = min + Math.random() * (max - min);
        if(v.integer) value = Math.round(value);
        else value = Math.round(value * 100) / 100;
        let from = v.fromUnit, to = v.toUnit;
        if(ac.randomSwap && Math.random() < 0.5){
          const inv = convertUnits(value, from, to);
          if(inv != null && isFinite(inv)){
            value = v.integer ? Math.round(inv) : Math.round(inv * 100) / 100;
            const tmp = from; from = to; to = tmp;
          }
        }
        const expected = convertUnits(value, from, to);
        return { value: value, from: from, to: to, expected: expected };
      }
      function sameInstance(a, b){
        return !!a && !!b && a.value === b.value && a.from === b.from && a.to === b.to;
      }
      function chooseNew(showMsg){
        let next = genInstance();
        if(!next){
          qText.innerHTML = '<em>Keine Aufgaben definiert.</em>';
          unitLbl.textContent = '';
          inp.value = '';
          current = null;
          return;
        }
        for(let i = 0; current && sameInstance(next, current) && i < 30; i++){
          next = genInstance();
        }
        current = next;
        inp.value = '';
        qText.textContent = fillTemplate(ac.questionTemplate, current.value, current.from, current.to);
        unitLbl.textContent = current.to;
        if(showMsg) fb.neutral('Neue Aufgabe generiert.');
      }
      function grade(){
        if(!current || current.expected == null){ fb.bad('Lösung nicht verfügbar.'); return; }
        const got = u.parseNum(inp.value);
        if(got == null){ fb.bad('Bitte eine gültige Zahl eingeben.'); return; }
        if(nearlyEqual(got, current.expected, tol)){
          fb.ok('Korrekt. (Lösung: ' + fmtNum(current.expected) + ' ' + current.to + ')');
          api.reportScore(ac.maxPoints || 1);
        } else {
          fb.bad('Nicht korrekt.');
          api.reportScore(0);
        }
      }
      checkBtn.addEventListener('click', grade);
      newBtn.addEventListener('click', () => chooseNew(true));

      chooseNew(false);
      api.initScore(ac.maxPoints || 1);
      return {};
    },

    preview(host, config){
      const u = window.BlockUtils;
      const ac = unitPresetConfig(config);
      const wrap = u.tagPreview(host, { icon:'⇌', label:'Einheitenumrechnung' });

      // Question template (mono font, like numeric-input)
      const q = document.createElement('div');
      q.style.cssText = 'color:#0f2d44; margin-bottom:0.5rem; font-family:"Courier New",monospace; line-height:1.4;';
      q.textContent = ac.questionTemplate || '(Frage-Vorlage)';
      wrap.appendChild(q);

      // Variants summary (small mono, like numeric-input's formula)
      const variants = (ac.variants || []).filter(v => v && v.fromUnit && v.toUnit);
      if(variants.length > 0){
        const f = document.createElement('div');
        f.style.cssText = 'font-size:0.72rem; color:#5d6872; font-family:"Courier New",monospace; margin-bottom:0.4rem;';
        const first = variants[0];
        const range = (first.valueMin ?? '?') + '…' + (first.valueMax ?? '?');
        const more = variants.length > 1 ? '  +' + (variants.length - 1) + ' weitere' : '';
        const swap = ac.randomSwap ? '  ⇄' : '';
        f.textContent = range + ' ' + first.fromUnit + ' → ' + first.toUnit + more + swap;
        wrap.appendChild(f);
      } else {
        const f = document.createElement('div');
        f.style.cssText = 'font-size:0.72rem; color:#888; font-style:italic; margin-bottom:0.4rem;';
        f.textContent = '(Keine Aufgaben definiert)';
        wrap.appendChild(f);
      }

      // Answer placeholder (like numeric-input)
      const inp = document.createElement('div');
      inp.style.cssText = 'border:1px solid #c6d1d8; border-radius:6px; padding:0.4rem 0.6rem; background:#f5f8fa; color:#888; font-size:0.8rem;';
      inp.textContent = '⏤ Zahl eingeben';
      wrap.appendChild(inp);
    }
  });
})();
