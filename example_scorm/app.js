(function(){
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PLANE_MIN = -5.5;
  const PLANE_MAX = 5.5;
  let currentTask = null;
  let achievedBest = 0;

  function sanitizeZero(value, eps = 5e-3){ return Math.abs(value) < eps ? 0 : value; }
  function fmt(num, digits = 2){ const clean = sanitizeZero(Number(num), 0.5 * 10 ** (-digits)); return clean.toFixed(digits); }
  function parseNum(value){
    const s = String(value || '').trim().replace(',', '.');
    if(!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  function parseAngle(value){
    const s0 = String(value || '').trim().toLowerCase().replace(/,/g, '.').replace(/\s+/g, '');
    if(!s0) return null;
    const s = s0
      .replace(/π/g, 'pi')
      .replace(/([0-9)])pi/g, '$1*pi')
      .replace(/pi(?=[0-9(])/g, 'pi*')
      .replace(/\)(?=[0-9a-z])/g, ')*');
    if(!/^[0-9pi+\-*/().]+$/i.test(s)) return null;
    const jsExpr = s.replace(/pi/g, `(${Math.PI})`);
    try {
      const result = Function(`"use strict"; return (${jsExpr});`)();
      return Number.isFinite(result) ? result : null;
    } catch(e) {
      return null;
    }
  }
  function nearlyEqual(a,b,tol=0.05){ return Math.abs(a-b) <= tol; }
  function normalizeAngle(phi){
    let x = phi;
    while(x <= -Math.PI) x += 2 * Math.PI;
    while(x > Math.PI) x -= 2 * Math.PI;
    return sanitizeZero(x, 1e-9);
  }
  function angleEqual(a,b,tol=0.06){ return Math.abs(normalizeAngle(a - b)) <= tol; }

  function createSvgElement(name, attrs={}){
    const el = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, String(v)));
    return el;
  }
  function planeX(x, width, pad){ return pad + ((x - PLANE_MIN)/(PLANE_MAX - PLANE_MIN)) * (width - 2*pad); }
  function planeY(y, height, pad){ return height - pad - ((y - PLANE_MIN)/(PLANE_MAX - PLANE_MIN)) * (height - 2*pad); }

  function renderComplexPlane(host, point, options={}){
    const width = 640, height = 640, pad = 54;
    host.innerHTML = '';
    const svg = createSvgElement('svg', {viewBox:`0 0 ${width} ${height}`, width:'100%', height:'100%'});
    svg.appendChild(createSvgElement('rect', {x:0,y:0,width,height,fill:'#ffffff'}));

    for(let k=-3; k<=3; k++){
      const x = planeX(k,width,pad);
      const y = planeY(k,height,pad);
      svg.appendChild(createSvgElement('line', {x1:x,y1:pad,x2:x,y2:height-pad,stroke:'#e2e8ed','stroke-width':1}));
      svg.appendChild(createSvgElement('line', {x1:pad,y1:y,x2:width-pad,y2:y,stroke:'#e2e8ed','stroke-width':1}));
      if(k !== 0){
        const tx = createSvgElement('text', {x:x,y:height-pad+24,'font-size':15,'text-anchor':'middle',fill:'#5d6872'}); tx.textContent = k; svg.appendChild(tx);
        const ty = createSvgElement('text', {x:pad-18,y:y+5,'font-size':15,'text-anchor':'middle',fill:'#5d6872'}); ty.textContent = k; svg.appendChild(ty);
      }
    }

    const xAxisY = planeY(0,height,pad), yAxisX = planeX(0,width,pad);
    svg.appendChild(createSvgElement('line', {x1:pad,y1:xAxisY,x2:width-pad,y2:xAxisY,stroke:'#003b5c','stroke-width':2}));
    svg.appendChild(createSvgElement('line', {x1:yAxisX,y1:pad,x2:yAxisX,y2:height-pad,stroke:'#003b5c','stroke-width':2}));

    const xLabel = createSvgElement('text', {x:width-pad+6,y:xAxisY-8,'font-size':16,fill:'#003b5c'}); xLabel.textContent = 'Re'; svg.appendChild(xLabel);
    const yLabel = createSvgElement('text', {x:yAxisX+10,y:pad+16,'font-size':16,fill:'#003b5c'}); yLabel.textContent = 'Im'; svg.appendChild(yLabel);

    const originX = planeX(0,width,pad), originY = planeY(0,height,pad);
    const px = planeX(point.a,width,pad), py = planeY(point.b,height,pad);

    if(options.showCircle && point.r > 0){
      const radiusPx = Math.abs(planeX(point.r,width,pad) - originX);
      svg.appendChild(createSvgElement('circle', {cx:originX,cy:originY,r:radiusPx,fill:'none',stroke:'#888888','stroke-dasharray':'6 6','stroke-width':2}));
    }

    svg.appendChild(createSvgElement('line', {x1:originX,y1:originY,x2:px,y2:py,stroke:'#1565ff','stroke-width':4}));
    svg.appendChild(createSvgElement('line', {x1:px,y1:originY,x2:px,y2:py,stroke:'#9bbdff','stroke-width':2,'stroke-dasharray':'5 4'}));
    svg.appendChild(createSvgElement('line', {x1:originX,y1:py,x2:px,y2:py,stroke:'#9bbdff','stroke-width':2,'stroke-dasharray':'5 4'}));
    svg.appendChild(createSvgElement('circle', {cx:px,cy:py,r:7,fill:'#1565ff'}));

    const label = createSvgElement('text', {x:px+10,y:py-10,'font-size':16,fill:'#003b5c','font-weight':'700'});
    label.textContent = 'z';
    svg.appendChild(label);

    host.appendChild(svg);
  }

  function showSection(name){
    const viz = document.getElementById('vizSection');
    const task = document.getElementById('taskSection');
    const vizBtn = document.getElementById('showVizBtn');
    const taskBtn = document.getElementById('showTaskBtn');
    const isViz = name === 'viz';
    viz.classList.toggle('hidden', !isViz);
    task.classList.toggle('hidden', isViz);
    vizBtn.classList.toggle('active', isViz);
    taskBtn.classList.toggle('active', !isViz);
    if(!isViz) renderCurrentTaskPlot();
  }

  function setupSteppers(){
    document.querySelectorAll('.step-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if(!target) return;
        const step = Number(target.step || 1);
        const dir = btn.dataset.direction === 'up' ? 1 : -1;
        const min = Number(target.min), max = Number(target.max);
        let value = Number(target.value) + dir * step;
        value = Math.max(min, Math.min(max, value));
        target.value = value.toFixed(String(step).includes('.') ? String(step).split('.')[1].length : 0);
        target.dispatchEvent(new Event('input', {bubbles:true}));
      });
    });
  }

  function initVisualization(){
    const realRange = document.getElementById('realRange');
    const imagRange = document.getElementById('imagRange');
    const absRange = document.getElementById('absRange');
    const argRange = document.getElementById('argRange');
    const realValue = document.getElementById('realValue');
    const imagValue = document.getElementById('imagValue');
    const absValue = document.getElementById('absValue');
    const argValue = document.getElementById('argValue');
    const complexText = document.getElementById('complexText');
    const host = document.getElementById('plotHost');
    let lock = false;

    function updateDisplay(a, b, r, phi){
      const aa = sanitizeZero(a, 1e-9);
      const bb = sanitizeZero(b, 1e-9);
      const rr = sanitizeZero(r, 1e-9);
      const pp = sanitizeZero(phi, 1e-9);
      realValue.textContent = fmt(aa,2);
      imagValue.textContent = fmt(bb,2);
      absValue.textContent = fmt(rr,2);
      argValue.textContent = `${fmt(pp,2)} rad`;
      complexText.textContent = `z = ${fmt(aa,2)} ${bb < 0 ? '-' : '+'} ${fmt(Math.abs(bb),2)} i = ${fmt(rr,2)} e^(i ${fmt(pp,2)})`;
      renderComplexPlane(host, {a: aa, b: bb, r: rr}, {showCircle:false});
    }

    function syncFromCartesian(){
      if(lock) return;
      lock = true;
      const a = Number(realRange.value);
      const b = Number(imagRange.value);
      const r = Math.sqrt(a*a + b*b);
      const phi = sanitizeZero(Math.atan2(b,a), 1e-9);
      absRange.value = String(Math.max(0, Math.min(5, r)));
      argRange.value = String(phi);
      updateDisplay(a, b, r, phi);
      lock = false;
    }

    function syncFromPolar(){
      if(lock) return;
      lock = true;
      const r = Number(absRange.value);
      const phi = sanitizeZero(Number(argRange.value), 1e-9);
      const a = r * Math.cos(phi);
      const b = r * Math.sin(phi);
      realRange.value = String(a);
      imagRange.value = String(b);
      updateDisplay(a, b, r, phi);
      lock = false;
    }

    [realRange, imagRange].forEach(el => el.addEventListener('input', syncFromCartesian));
    [absRange, argRange].forEach(el => el.addEventListener('input', syncFromPolar));
    document.getElementById('resetBtn').addEventListener('click', () => {
      realRange.value = '1';
      imagRange.value = '1';
      syncFromCartesian();
    });
    document.getElementById('toTaskBtn').addEventListener('click', () => showSection('task'));
    syncFromCartesian();
  }

  const taskPool = [
    {a:1,b:1}, {a:2,b:0}, {a:0,b:2}, {a:-1,b:1}, {a:2,b:-1}, {a:-2,b:2}, {a:-2,b:-1}, {a:1,b:-2}, {a:3,b:0}, {a:0,b:-3}
  ].map(item => ({
    ...item,
    r: Math.sqrt(item.a*item.a + item.b*item.b),
    phi: normalizeAngle(Math.atan2(item.b, item.a))
  }));

  function renderCurrentTaskPlot(){
    const host = document.getElementById('taskPlotHost');
    if(!host || !currentTask) return;
    renderComplexPlane(host, currentTask, {showCircle:false});
  }

  function updateFinishButton(){
    const btn = document.getElementById('finishBtn');
    if(!btn) return;
    const enabled = achievedBest >= 1;
    btn.disabled = !enabled;
    btn.classList.toggle('btn-disabled', !enabled);
  }

  function chooseNewTask(){
    currentTask = taskPool[Math.floor(Math.random() * taskPool.length)];
    achievedBest = 0;
    document.getElementById('taskRealInput').value = '';
    document.getElementById('taskImagInput').value = '';
    document.getElementById('taskAbsInput').value = '';
    document.getElementById('taskArgInput').value = '';
    const box = document.getElementById('feedbackBox');
    const text = document.getElementById('feedbackText');
    box.classList.remove('feedback-good','feedback-bad');
    text.textContent = 'Neue Aufgabe generiert. Tragen Sie jetzt Re(z), Im(z), |z| und φ ein.';
    renderCurrentTaskPlot();
    updateFinishButton();
    pushScoreToLMS(false);
  }

  function gradeTask(){
    const reIn = parseNum(document.getElementById('taskRealInput').value);
    const imIn = parseNum(document.getElementById('taskImagInput').value);
    const absIn = parseNum(document.getElementById('taskAbsInput').value);
    const argIn = parseAngle(document.getElementById('taskArgInput').value);
    const box = document.getElementById('feedbackBox');
    const text = document.getElementById('feedbackText');
    box.classList.remove('feedback-good','feedback-bad');

    if(!Number.isFinite(reIn) || !Number.isFinite(imIn) || !Number.isFinite(absIn) || !Number.isFinite(argIn)){
      box.classList.add('feedback-bad');
      text.textContent = 'Bitte geben Sie für Re(z), Im(z), |z| und φ gültige Zahlen ein.';
      achievedBest = 0;
      updateFinishButton();
      return;
    }

    const reOk = nearlyEqual(reIn, currentTask.a, 0.01);
    const imOk = nearlyEqual(imIn, currentTask.b, 0.01);
    const absOk = nearlyEqual(absIn, currentTask.r, 0.06);
    const argOk = angleEqual(argIn, currentTask.phi, 0.06);

    if(reOk && imOk && absOk && argOk){
      achievedBest = 1;
      box.classList.add('feedback-good');
      text.textContent = 'Korrekt. (1 Punkt)';
    } else {
      achievedBest = 0;
      box.classList.add('feedback-bad');
      const parts = [];
      parts.push(reOk ? 'Re(z) richtig.' : 'Re(z) noch nicht richtig.');
      parts.push(imOk ? 'Im(z) richtig.' : 'Im(z) noch nicht richtig.');
      parts.push(absOk ? '|z| richtig.' : '|z| noch nicht richtig.');
      parts.push(argOk ? 'φ richtig.' : 'φ noch nicht richtig.');
      text.textContent = parts.join(' ');
    }
    updateFinishButton();
    pushScoreToLMS(false);
  }

  function pushScoreToLMS(final){
    if(!window.Scorm12 || !Scorm12.initialized) return;
    const pts = achievedBest >= 1 ? 1 : 0;
    Scorm12.set('cmi.core.score.raw', pts.toFixed(2));
    Scorm12.set('cmi.core.score.min', '0');
    Scorm12.set('cmi.core.score.max', '1');
    Scorm12.set('cmi.core.lesson_status', final ? 'completed' : 'incomplete');
    Scorm12.commit();
  }

  function finishTest(){
    if(achievedBest < 1) return;
    try {
      pushScoreToLMS(true);
      Scorm12.finish();
    } catch(e) {}
    try { window.close(); } catch(e) {}
    try {
      document.body.innerHTML = "<main style='max-width:900px;margin:40px auto;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;padding:0 16px;'><h1>Test beendet</h1><p>Sie können dieses Fenster jetzt schließen und zum Kurs zurückkehren.</p></main>";
    } catch(e) {}
  }

  window.addEventListener('load', () => {
    try { window.Scorm12?.init(); } catch(e) {}
    setupSteppers();
    initVisualization();
    chooseNewTask();
    document.getElementById('showVizBtn').addEventListener('click', () => showSection('viz'));
    document.getElementById('showTaskBtn').addEventListener('click', () => showSection('task'));
    document.getElementById('checkBtn').addEventListener('click', gradeTask);
    document.getElementById('newTaskBtn').addEventListener('click', chooseNewTask);
    document.getElementById('finishBtn').addEventListener('click', finishTest);
  });
})();
