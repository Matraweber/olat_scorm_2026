// _registry.js: Block-type registry. Each block file calls
// Blocks.register(id, def) at load time. Both runtime and builder read here
// for labels, defaults, and the mount() function.
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
