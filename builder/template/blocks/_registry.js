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
