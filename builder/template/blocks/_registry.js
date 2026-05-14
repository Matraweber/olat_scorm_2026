// ============================================================================
// _registry.js - Block-type registry. Each block (heading, multiple-choice,
// cloze, …) calls Blocks.register(id, def) at load time. The runtime and the
// builder both read from this registry to look up labels, defaults, and the
// mount() function that renders a block instance.
// ============================================================================
(function(){
  'use strict';
  const registry = Object.create(null);
  window.Blocks = {
    register(id, def){
      if(!id) throw new Error('Blocks.register: id required');
      if(!def || typeof def.mount !== 'function') throw new Error('Blocks.register: def.mount required for ' + id);
      registry[id] = Object.assign({id}, def);
    },
    get(id){ return registry[id] || null; },
    all(){ return Object.values(registry); },
    ids(){ return Object.keys(registry); }
  };
})();
