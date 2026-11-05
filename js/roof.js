/* Gorilla Screen Studio — on-device roof frame planner.
   Geometries are schematic; no structural sizes or allowable spans are inferred. */
(function(){
 'use strict';
 const M=window.GSSModel;
 const cp=v=>JSON.parse(JSON.stringify(v));
 const fmt=v=>M.fmt(+v||0), n=(v,def)=>Number.isFinite(+v)?+v:def, clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 function init(p){
  if(!p.roofDraft){p.roofDraft={version:1,style:p.roofDesign?.style||'flat',width:p.kind==='field'?(p.topScreen?.length||p.house?.porchW||0):(p.topScreen?.length||16),depth:p.kind==='field'?(p.topScreen?.depth||0):(p.topScreen?.depth||2),rise:1.5,inset:1,bays:[],profile:'2x2',edgeProfile:'2x2',photoId:'',photoOpacity:.25,updatedAt:Date.now()};}
  p.roofDraft.bays||=[.5];return p.roofDraft;
 }
 function surface(p){const r=p.roofDraft||p.roofDesign||{};const W=n(r.width,16), D=n(r.depth,2),rise=n(r.rise,0),ins=n(r.inset,1);
  if(r.style==='mansard'&&D>2*ins&&W>2*ins){const horizontal=(W-2*ins)*(D-2*ins),slant=Math.hypot(ins,rise);return horizontal+2*(W+D-2*ins)*slant;}
  if(r.style==='gable'&&D>0)return W*2*Math.hypot(D/2,rise);
  return W*D;
 }
 function editor({project,photos,host,goBack,save,approved}){
  const R=init(project); let selected=-1, dragging=-1, state=[];
  const $$=q=>[...host.querySelectorAll(q)], $=q=>host.querySelector(q);
  const photo=()=>photos.find(p=>p.id===R.photoId);
  const remember=()=>{state.push(cp(R));if(state.length>30)state.shift();};
  const persist=()=>{R.updatedAt=Date.now();save();};
  const field=(id,label,value,min,max,step)=>`<label class="roof-field">${label}<input id="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
  host.innerHTML=`<div class="draft-top"><div><div class="draft-eyebrow">FRAME PLAN · ROOF</div><h1>Diseño de techo</h1><div class="draft-sub">Elige un estilo, ajusta las cotas y arrastra las vigas en planta.</div></div><button class="iconbtn" id="roofBack" aria-label="Volver">✕</button></div>
  <div class="roof-layout"><div class="roof-drawing card"><div class="roof-preset" role="group" aria-label="Tipo de techo"><button data-style="flat">▭ <span>Flat</span></button><button data-style="mansard">▱ <span>Mansard</span></button><button data-style="gable">⌃ <span>Gable</span></button></div>
  <div class="draft-canvasbox roof-canvas"><svg id="roofSvg" viewBox="0 0 1000 670" aria-label="Plano de techo editable; toca una viga para seleccionarla" style="touch-action:none"></svg></div>
  <div class="roof-toolbar"><button id="roofAdd" class="btn sec">+ Viga</button><button id="roofRemove" class="btn sec">− Quitar viga</button><button id="roofUndo" class="btn sec">↶ Deshacer</button></div>
  <p class="lead smalltext">Arrastra los puntos azules para mover una viga. La foto es referencia visual: las dimensiones se introducen en campo.</p>
  </div><aside class="roof-side"><section class="card"><div class="cap">Dimensiones · pies</div><div class="roof-fields">${field('roofW','Longitud',R.width,.5,300,.25)}${field('roofD','Profundidad',R.depth,.5,300,.25)}${field('roofRise','Elevación / rise',R.rise,0,40,.25)}${field('roofInset','Retiro mansard',R.inset,.1,60,.25)}</div><label class="roof-field">Perfil de vigas<select id="roofProf"><option>1x2</option><option>2x2</option><option>2x3</option><option>3x3</option><option>4x4</option></select></label><label class="roof-field">Foto de referencia<select id="roofPhoto"><option value="">Sin foto</option>${photos.filter(p=>!['aerea','street','render'].includes(p.cat)).map(p=>`<option value="${p.id}">${p.cat} · ${new Date(p.createdAt).toLocaleDateString('es-US')}</option>`).join('')}</select></label><label class="roof-field">Opacidad de foto<input type="range" min="0" max="0.8" step="0.05" id="roofOpacity"></label></section>
  <section class="card"><div class="cap">Resumen geométrico</div><div id="roofSummary"></div><p class="lead smalltext">Solo concepto geométrico; perfilería, anclajes, separación estructural y cargas de viento deben ser revisados por el profesional responsable.</p></section>
  <button class="btn block" id="roofApprove">✓ Aprobar trazado de techo</button></aside></div>`;
  $('#roofProf').value=R.profile||'2x2';$('#roofPhoto').value=R.photoId||'';$('#roofOpacity').value=R.photoOpacity??.25;
  const X0=93,Y0=114,PW=810,PH=408;
  function render(){
   $$('[data-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.style===R.style)));
   $('#roofRise').disabled=R.style==='flat';$('#roofInset').disabled=R.style!=='mansard';
   const W=Math.max(.5,n(R.width,.5)), D=Math.max(.5,n(R.depth,.5)), In=n(R.inset,1),rise=n(R.rise,1.5),broken=R.style==='mansard'&&(In*2>=Math.min(W,D));
   const sx=PW/W,sy=PH/D, xi=clamp(In/W,0,.48)*PW,yi=clamp(In/D,0,.48)*PH;
   const bg=photo()?.url||'';const pic=bg?`<image href="${bg}" x="${X0}" y="${Y0}" width="${PW}" height="${PH}" preserveAspectRatio="xMidYMid meet" opacity="${R.photoOpacity??.25}"/>`:'';
   const outline=R.style==='mansard'&&!broken?`<rect x="${X0+xi}" y="${Y0+yi}" width="${PW-2*xi}" height="${PH-2*yi}" fill="rgba(0,113,227,.11)" stroke="#40576c" stroke-width="4"/><path d="M${X0},${Y0} L${X0+xi},${Y0+yi} M${X0+PW},${Y0} L${X0+PW-xi},${Y0+yi} M${X0},${Y0+PH} L${X0+xi},${Y0+PH-yi} M${X0+PW},${Y0+PH} L${X0+PW-xi},${Y0+PH-yi}" fill="none" stroke="#4f3d2c" stroke-width="5"/>`:R.style==='gable'?`<line x1="${X0}" y1="${Y0+PH/2}" x2="${X0+PW}" y2="${Y0+PH/2}" stroke="#4f3d2c" stroke-width="7"/><text x="${X0+PW-5}" y="${Y0+PH/2-11}" fill="#334155" text-anchor="end" font-size="22">RIDGE</text>`:'';
   const bays=R.bays.map((t,i)=>{const x=X0+PW*t;return `<line data-beam="${i}" x1="${x}" x2="${x}" y1="${Y0}" y2="${Y0+PH}" stroke="${selected===i?'#0071e3':'#4f3d2c'}" stroke-width="${selected===i?9:6}" style="cursor:ew-resize"/><circle data-beam="${i}" cx="${x}" cy="${Y0+PH/2}" r="${selected===i?18:14}" fill="#fff" stroke="#0071e3" stroke-width="5" style="cursor:ew-resize"/>`;}).join('');
   $('#roofSvg').innerHTML=`<defs><pattern id="rgrid" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M38 0H0V38" fill="none" stroke="#c5ccd4" stroke-width="1"/></pattern><pattern id="rmesh" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0L6 6M6 0L0 6" stroke="#333" stroke-opacity=".18" stroke-width=".6"/></pattern></defs><rect width="1000" height="670" fill="#f5f6f8"/><rect width="1000" height="670" fill="url(#rgrid)"/><rect x="${X0}" y="${Y0}" width="${PW}" height="${PH}" fill="url(#rmesh)" stroke="#4f3d2c" stroke-width="8"/>${pic}${outline}${bays}<line x1="${X0}" y1="${Y0-43}" x2="${X0+PW}" y2="${Y0-43}" stroke="#202c36" stroke-width="3"/><text x="${X0+PW/2}" y="${Y0-52}" font-size="26" text-anchor="middle" fill="#202c36">${fmt(W)}</text><text x="${X0-20}" y="${Y0+PH/2}" text-anchor="middle" transform="rotate(-90 ${X0-20} ${Y0+PH/2})" font-size="25" fill="#202c36">${fmt(D)}</text><text x="${X0}" y="585" font-size="22" fill="#3c4856">${R.style==='flat'?'FLAT · 1 PLANO':R.style==='mansard'?'MANSARD · PERÍMETRO INCLINADO + CENTRO': 'GABLE · 2 PLANOS CON CUMBRERA'} · ${R.bays.length} VIGAS INTERMEDIAS</text>`;
   const area=surface({roofDraft:R});$('#roofSummary').innerHTML=`<div class="row"><span>Estilo</span><b>${R.style.toUpperCase()}</b></div><div class="row"><span>Área de superficie aprox.</span><b>${area.toFixed(1)} pie²</b></div><div class="row"><span>Vigas interiores</span><b>${R.bays.length}</b></div><div class="row"><span>Perfil</span><b>${R.profile}</b></div>${broken?`<p class="warn">El ancho/profundidad es insuficiente para el retiro de mansard. Reduce el retiro o aumenta la dimensión.</p>`:''}${R.depth<=2&&R.style!=='flat'?`<p class="warn">La abertura de 2 ft existente se diseñó flat. Mansard/gable requiere confirmar un nuevo alcance.</p>`:''}`;
  }
  const pos=ev=>{const pt=$('#roofSvg').createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;const m=$('#roofSvg').getScreenCTM();return m?pt.matrixTransform(m.inverse()):{x:0,y:0};};
  $('#roofSvg').addEventListener('pointerdown',ev=>{const i=ev.target.getAttribute('data-beam');if(i===null)return;selected=+i;dragging=+i;remember();ev.target.setPointerCapture(ev.pointerId);render();});
  $('#roofSvg').addEventListener('pointermove',ev=>{if(dragging<0)return;const p=pos(ev);R.bays[dragging]=clamp((p.x-X0)/PW,.04,.96);render();});
  $('#roofSvg').addEventListener('pointerup',()=>{if(dragging>=0){dragging=-1;R.bays.sort((a,b)=>a-b);selected=-1;persist();render();}});
  $$('[data-style]').forEach(b=>b.onclick=()=>{remember();R.style=b.dataset.style;persist();render();});
  [['roofW','width'],['roofD','depth'],['roofRise','rise'],['roofInset','inset']].forEach(([id,key])=>{$('#'+id).onchange=e=>{remember();R[key]=clamp(n(e.target.value,R[key]),key==='inset'?.1:key==='rise'?0:.5,key==='rise'?40:300);persist();render();};});
  $('#roofProf').onchange=e=>{R.profile=e.target.value;persist();render();};
  $('#roofPhoto').onchange=e=>{R.photoId=e.target.value;persist();render();};
  $('#roofOpacity').oninput=e=>{R.photoOpacity=+e.target.value;render();};$('#roofOpacity').onchange=persist;
  $('#roofAdd').onclick=()=>{remember();const at=R.bays.length?Math.max(.05,Math.min(.95,1/(R.bays.length+2))):.5;R.bays.push(at);R.bays.sort((a,b)=>a-b);persist();render();};
  $('#roofRemove').onclick=()=>{if(!R.bays.length)return;remember();R.bays.splice(selected>=0?selected:R.bays.length-1,1);selected=-1;persist();render();};
  $('#roofUndo').onclick=()=>{if(!state.length)return;const old=state.pop();Object.keys(R).forEach(k=>delete R[k]);Object.assign(R,old);for(const [id,key] of [['roofW','width'],['roofD','depth'],['roofRise','rise'],['roofInset','inset']])$('#'+id).value=R[key];persist();render();};
  $('#roofBack').onclick=goBack;
  $('#roofApprove').onclick=()=>{if(R.style==='mansard'&&R.inset*2>=Math.min(R.width,R.depth)){alert('El retiro de mansard no cabe en las dimensiones del techo.');return;}
   if(R.width<=0||R.depth<=0){alert('Introduce el largo y profundidad real del techo. No se puede aprobar un techo con medidas vacías.');return;}
   const msg='¿Aprobar el trazado de techo como geometría conceptual? Los anclajes y perfiles siguen pendientes de revisión estructural.';if(!confirm(msg))return;
   const revision=(project.roofDesign?.revision||0)+1;project.roofDesign={...cp(R),revision,approvedAt:Date.now(),status:'approved-conceptual',surfaceSqFt:surface({roofDraft:R})};
   project.topScreen.on=true;project.topScreen.length=R.width;project.topScreen.depth=R.depth;if(project.kind!=='field')project.house.porchW=R.width;save();approved(revision);};
  render();
 }
 window.GSSRoofEditor={editor,init,surface};
})();
