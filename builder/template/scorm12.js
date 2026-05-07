function findAPI(win){
  let attempts = 0;
  while(win && attempts < 500){
    if(win.API) return win.API;
    if(win.parent && win.parent !== win) win = win.parent;
    else break;
    attempts++;
  }
  return null;
}

window.Scorm12 = {
  api: null,
  initialized: false,
  init(){
    this.api = findAPI(window);
    if(!this.api) return false;
    try{
      this.initialized = (this.api.LMSInitialize("") === "true");
      return this.initialized;
    }catch(e){
      return false;
    }
  },
  get(k){ if(!this.initialized||!this.api) return ""; try{ return this.api.LMSGetValue(k); }catch(e){ return ""; } },
  set(k,v){ if(!this.initialized||!this.api) return false; try{ return (this.api.LMSSetValue(k,String(v)) === "true"); }catch(e){ return false; } },
  commit(){ if(!this.initialized||!this.api) return false; try{ return (this.api.LMSCommit("") === "true"); }catch(e){ return false; } },
  finish(){ if(!this.initialized||!this.api) return false; try{ const ok=(this.api.LMSFinish("") === "true"); this.initialized=false; return ok; }catch(e){ return false; } }
};
