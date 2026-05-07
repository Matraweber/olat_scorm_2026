(function(){
  'use strict';
  const registry = Object.create(null);
  window.TaskTypes = {
    register(id, def){
      if(!id) throw new Error('TaskTypes.register: id required');
      if(!def || typeof def.mount !== 'function') throw new Error('TaskTypes.register: def.mount required for ' + id);
      registry[id] = Object.assign({id}, def);
    },
    get(id){ return registry[id] || null; },
    all(){ return Object.values(registry); },
    ids(){ return Object.keys(registry); }
  };
})();
