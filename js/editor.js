/* Gorilla Screen Studio — photo-backed parametric 2D drafting, offline-first.
   The photograph is a tracing reference only. Real-world dimensions require field calibration. */
(function(){
'use strict';
const M=window.GSSModel, W=1000,H=680;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const cp=x=>JSON.parse(JSON.stringify(x));
const clampN=(n,min,max,def)=>Number.isFinite(+n)?clamp(+n,min,max):def;
const tools=['select','arch','rect','vertical','horizontal','ruler','erase'];
function initDraft(p){
 if(!p.drawingDraft){p.drawingDraft={version:1,sourcePhotoId:'',imageOpacity:.49,feetPerPixel:null,referenceFeet:4,items:[],revisionBasedOn:p.approvedDrawing?.revision||0,updatedAt:Date.now()};}
 p.drawingDraft.items ||= [];
 p.drawingDraft.items.forEach(o=>{o.id||=(M.uid());o.segments||=[];});
 return p.drawingDraft;
}
function profileSize(v){const z=String(v||'1x2').split('x');return {width:Math.max(.06,(parseFloat(z[0])||1)/12),depth:Math.max(.06,(parseFloat(z[1])||2)/12)};}
function takeoff(draw){
 const items=draw.items||[];const out={openings:items.length,screenSqFt:0,linearFt:0,byProfile:{},doors:0};
 function add(key,ft){out.byProfile[key]=(out.byProfile[key]||0)+ft;out.linearFt+=ft;}
 items.forEach(o=>{
  const w=+o.physicalW||0,h=+o.physicalH||0,r=o.type==='arch'?w/2:0;
  const spring=h-r;out.screenSqFt+=o.type==='arch'?(w*Math.max(0,spring)+Math.PI*r*r/2):w*h;
  add(o.profile||'1x2',o.type==='arch'?2*Math.max(0,spring)+Math.PI*r+w:2*(w+h));
  if(o.door)out.doors++;
  (o.segments||[]).forEach(s=>{
   const t=clamp(+s.t||.5,.03,.97);
   let len=s.direction==='v'?h:w;
   if(s.direction==='v'&&o.type==='arch'){
    const xx=w*t-w/2;
    len=Math.max(0,spring)+Math.sqrt(Math.max(0,r*r-xx*xx));
   }
   if(s.direction==='h'&&o.type==='arch'&&h*t>spring){const dy=h*t-spring;len=2*Math.sqrt(Math.max(0,r*r-dy*dy));}
   add(s.profile||'1x2',len);
  });
 });
 return out;
}
function path(o){let {x,y,w,h}=o;const r=Math.min(w/2,h/2);if(o.type==='arch')return `M${x},${y+h} L${x},${y+r} A${r},${r} 0 0 1 ${x+w},${y+r} L${x+w},${y+h} Z`;return `M${x},${y} H${x+w} V${y+h} H${x} Z`;}
function shapeTop(o,x){if(o.type!=='arch')return o.y;const r=Math.min(o.w/2,o.h/2),dx=x-(o.x+o.w/2);return o.y+r-Math.sqrt(Math.max(0,r*r-dx*dx));}
function segLine(o,s){const t=clamp(+s.t||.5,.03,.97);if(s.direction==='v'){
 const x=o.x+o.w*t;return {x1:x,y1:shapeTop(o,x),x2:x,y2:o.y+o.h};}
 const y=o.y+o.h*t, r=Math.min(o.w/2,o.h/2), cy=o.y+r;
 const hw=o.type==='arch'&&y<cy?Math.sqrt(Math.max(0,r*r-(y-cy)*(y-cy))):o.w/2;
 const cx=o.x+o.w/2;return {x1:cx-hw,y1:y,x2:cx+hw,y2:y};
}
function editor({project,photos,host,goBack,save,approved}){
 const draft=initDraft(project);
 let selected=draft.items[0]?.id||null,tool='select',drag=null,prior=[],rulerStart=null;
 const imgFor=id=>photos.find(x=>x.id===id);
 function src(){return imgFor(draft.sourcePhotoId)?.url||'';}
 function persist(){draft.updatedAt=Date.now();save();}
 function checkpoint(){prior.push(cp(draft.items));if(prior.length>35)prior.shift();}
 const selector=(attr,val,txt)=>`<option value="${esc(val)}" ${attr===val?'selected':''}>${esc(txt)}</option>`;
 host.innerHTML=`<div class="draft-top"><div><div class="draft-eyebrow">PHOTO → PLAN</div><h1>Editor de openings</h1><div class="draft-sub">Traza perfiles sobre la foto. La escala debe verificarse en campo.</div></div><button class="iconbtn draft-close" id="draftClose" aria-label="Volver">✕</button></div>
 <div class="draft-layout"><div class="draft-work"><div class="draft-toolbar" id="draftTools" role="toolbar" aria-label="Herramientas de dibujo"></div>
 <div class="draft-canvasbox"><svg id="draftSvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Plano vectorial editable sobre fotografía"></svg></div>
 <div class="draft-foot"><label>Foto de fondo <select id="draftPhoto"><option value="">Sin foto (lienzo)</option>${photos.filter(p=>p.cat!=='render'&&p.cat!=='aerea'&&p.cat!=='street').map(p=>`<option value="${esc(p.id)}" ${p.id===draft.sourcePhotoId?'selected':''}>${esc(p.cat)} · ${new Date(p.createdAt).toLocaleDateString('es-US')}</option>`).join('')}</select></label><label class="opacity-field">Opacidad <input type="range" id="draftOpacity" min="0" max="1" step="0.05" value="${draft.imageOpacity??.49}"></label><span id="draftHelp" class="draft-sub"></span></div>
 <div class="draft-actions"><button class="btn sec" id="draftUndo" title="Deshacer">↶ Deshacer</button><button class="btn sec" id="draftSuggest">Usar medidas actuales</button><button class="btn sec" id="draftExport" title="Exportar dibujo SVG">⇧ Exportar SVG</button></div></div>
 <aside class="draft-inspector"><div class="draft-state" id="draftState"></div><section class="card"><p class="cap">Opening seleccionado</p><div id="draftDetail"></div></section>
 <section class="card"><p class="cap">Openings del plano</p><div id="draftList"></div><p class="lead smalltext">Puedes seleccionar un opening tocando el dibujo o esta lista.</p></section>
 <section class="card"><p class="cap">Takeoff — borrador</p><div id="draftBom"></div></section>
 <section class="card"><p class="cap">Calibración</p><p class="lead smalltext">La herramienta regla permite trazar una distancia conocida en la foto y establecer su longitud real. En fotos con perspectiva, mide cada opening en campo.</p><label class="field">Distancia de referencia (pies)<input id="draftRef" type="number" min="0.1" step="0.25" value="${draft.referenceFeet||4}"></label><p id="draftScale" class="draft-sub"></p></section>
 <button class="btn block" id="draftApprove">✓ Aprobar plano y actualizar 3D</button><p class="lead smalltext">La aprobación crea una revisión local del dibujo. No equivale a validación estructural ni sello profesional.</p></aside></div>`;
 const e={svg:host.querySelector('#draftSvg'),tools:host.querySelector('#draftTools'),detail:host.querySelector('#draftDetail')};
 function selectedObject(){return draft.items.find(x=>x.id===selected);}
 function setTool(t){tool=t;e.tools.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===t)));const messages={select:'Toca para seleccionar o arrastra para mover. Arrastra el punto inferior derecho para cambiar tamaño.',arch:'Arrastra sobre la foto para dibujar un arco.',rect:'Arrastra sobre la foto para dibujar un rectángulo.',vertical:'Toca dentro de un opening para añadir un perfil vertical.',horizontal:'Toca dentro de un opening para añadir un perfil horizontal.',ruler:'Arrastra sobre una distancia conocida para calibrar escala.',erase:'Toca un perfil para eliminarlo, o selecciona un opening en la lista.'};host.querySelector('#draftHelp').textContent=messages[t];}
 e.tools.innerHTML=[['select','↖','Seleccionar'],['arch','⌒+','Arco'],['rect','▭+','Rect.'],['vertical','│+','Vertical'],['horizontal','─+','Horizontal'],['ruler','↔','Regla'],['erase','⌫','Borrar perfil']].map(([k,ic,l])=>`<button type="button" data-tool="${k}" title="${l}" aria-label="${l}" aria-pressed="${k==='select'}"><strong>${ic}</strong><span>${l}</span></button>`).join('');
 e.tools.querySelectorAll('button').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));setTool('select');
 function renderSvg(){
  const photo=src();const opacity=clampN(draft.imageOpacity,0,1,.49);
  e.svg.innerHTML=`<defs><pattern id="draftGrid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#b2bfce" stroke-width=".7" opacity=".38"/></pattern></defs><rect width="1000" height="680" fill="#f1f4f8"/><rect width="1000" height="680" fill="url(#draftGrid)"/>${photo?`<image href="${esc(photo)}" x="0" y="0" width="1000" height="680" preserveAspectRatio="xMidYMid meet" opacity="${opacity}"/>`:''}
 ${draft.items.map((o,i)=>{
  const active=selected===o.id;
  return `<g data-opening="${esc(o.id)}" style="cursor:move">
  <path d="${path(o)}" stroke="${active?'#0071e3':'#176bba'}" fill="${active?'rgba(0,113,227,.15)':'rgba(0,113,227,.07)'}" stroke-width="${active?5:3}" vector-effect="non-scaling-stroke"/>
  ${o.segments.map(s=>{const l=segLine(o,s);return `<line data-segid="${esc(s.id)}" data-opening="${esc(o.id)}" x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="#594331" stroke-width="7" vector-effect="non-scaling-stroke" style="cursor:grab"/>`;}).join('')}
  <rect x="${o.x+6}" y="${o.y+o.h-35}" width="${Math.min(o.w-12,172)}" height="28" rx="8" fill="rgba(15,23,42,.86)" pointer-events="none"/>
  <text x="${o.x+15}" y="${o.y+o.h-16}" fill="white" font-size="18" font-family="system-ui" pointer-events="none">${i+1}: ${M.fmt(o.physicalW)} × ${M.fmt(o.physicalH)}</text>
  ${o.door?`<rect x="${o.x+o.w*.15}" y="${o.y+o.h*.23}" width="${o.w*.7}" height="${o.h*.77}" fill="none" stroke="#8a5a24" stroke-dasharray="10,5" stroke-width="4" pointer-events="none"/>`:''}
  ${active?`<circle data-handle="size" data-opening="${esc(o.id)}" cx="${o.x+o.w}" cy="${o.y+o.h}" r="13" fill="#fff" stroke="#0071e3" stroke-width="4" style="cursor:nwse-resize"/><circle data-handle="move" data-opening="${esc(o.id)}" cx="${o.x+o.w/2}" cy="${o.y+Math.max(16,o.h/2)}" r="11" fill="#0071e3" stroke="white" stroke-width="3"/>`:''}
  </g>`;}).join('')}
 ${drag?.kind==='draw'?`<rect x="${Math.min(drag.ax,drag.bx)}" y="${Math.min(drag.ay,drag.by)}" width="${Math.abs(drag.bx-drag.ax)}" height="${Math.abs(drag.by-drag.ay)}" fill="rgba(0,113,227,.09)" stroke="#0071e3" stroke-width="4" stroke-dasharray="10,8"/>`:''}
 ${drag?.kind==='ruler'?`<line x1="${drag.ax}" y1="${drag.ay}" x2="${drag.bx}" y2="${drag.by}" stroke="#ef8a22" stroke-width="5" stroke-dasharray="12,7"/>`:''}
 <text x="18" y="38" fill="#334155" font-size="18" font-weight="700" font-family="system-ui">${photo?'PHOTO TRACE · ESCALA POR VERIFICAR':'PLANO 2D · TOCA PARA DIBUJAR'}</text>`;
 }
 function renderInspector(){
  const o=selectedObject();host.querySelector('#draftState').innerHTML=`<b>${draft.items.length} openings</b><span>${draft.feetPerPixel?'Escala calibrada de forma aproximada':'Sin escala fotográfica calibrada'} · ${project.approvedDrawing?'Revisión aprobada '+project.approvedDrawing.revision:'Sin aprobación previa'}</span>`;
  host.querySelector('#draftList').innerHTML=draft.items.map((x,i)=>`<button class="draft-list-row" data-pick="${esc(x.id)}" aria-pressed="${x.id===selected}"><span><b>${i+1}. ${x.type==='arch'?'Arco':'Rectangular'}</b><small>${M.fmt(x.physicalW)} × ${M.fmt(x.physicalH)} · ${x.segments.length} perfiles${x.door?' · puerta':''}</small></span><span>›</span></button>`).join('')||'<p class="lead smalltext">Selecciona Arco o Rect., y dibújalo sobre la fotografía.</p>';
  host.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{selected=b.dataset.pick;renderAll();});
  e.detail.innerHTML=o?`<div class="draft-detailgrid"><label>Ancho (ft)<input id="dw" type="number" min=".3" step=".083333" value="${+o.physicalW.toFixed(3)}"></label><label>Alto (ft)<input id="dh" type="number" min=".3" step=".083333" value="${+o.physicalH.toFixed(3)}"></label></div>
    <div class="draft-detailgrid"><label>Forma<select id="dshape"><option value="arch" ${o.type==='arch'?'selected':''}>Arco</option><option value="rect" ${o.type==='rect'?'selected':''}>Rectangular</option></select></label><label>Perfil perimetral<select id="dprofile">${['1x2','2x2','2x3','3x3','4x4'].map(z=>selector(o.profile,z,z)).join('')}</select></label></div>
    <label class="draft-checkbox"><input id="ddoor" type="checkbox" ${o.door?'checked':''}> Puerta de screen</label>
    <div class="draft-seglist">${o.segments.map((s,i)=>`<div class="draft-segrow"><span>${s.direction==='v'?'│':'─'} ${i+1}</span><select data-segprofile="${esc(s.id)}">${['1x2','2x2','2x3','3x3','4x4'].map(z=>selector(s.profile,z,z)).join('')}</select><button data-remove-segment="${esc(s.id)}" class="draft-mini" aria-label="Quitar perfil">×</button></div>`).join('')||'<p class="lead smalltext">Dibuja perfiles verticales u horizontales tocando el opening.</p>'}</div>
    <div class="draft-inline"><button class="btn sec" id="draftDuplicate">Duplicar</button><button class="btn danger" id="draftDelete">Eliminar</button></div>`:'<p class="lead smalltext">Selecciona un opening del plano para editar dimensiones, puerta y perfiles.</p>';
  const bom=takeoff(draft);
  host.querySelector('#draftBom').innerHTML=`<div class="row"><span class="l">Área screen (sin descuentos)</span><b>${bom.screenSqFt.toFixed(1)} pie²</b></div><div class="row"><span class="l">Puertas</span><b>${bom.doors}</b></div>${Object.entries(bom.byProfile).map(([k,v])=>`<div class="row"><span class="l">Perfil ${esc(k)}</span><b>${v.toFixed(1)} LF</b></div>`).join('')}<p class="lead smalltext">Estimación geométrica preliminar; desperdicio, splines, fijaciones y cortes no incluidos.</p>`;
  host.querySelector('#draftScale').textContent=draft.feetPerPixel?`1 px ≈ ${(draft.feetPerPixel*12).toFixed(3)}″ (aproximado)`:'Traza una línea con Regla para establecer referencia.';
  if(!o)return;
  [['dw','physicalW'],['dh','physicalH']].forEach(([id,key])=>{host.querySelector('#'+id).onchange=e=>{checkpoint();o[key]=clampN(e.target.value,.3,100,o[key]);persist();renderAll();};});
  host.querySelector('#dshape').onchange=e=>{checkpoint();o.type=e.target.value;persist();renderAll();};
  host.querySelector('#dprofile').onchange=e=>{checkpoint();o.profile=e.target.value;persist();renderAll();};
  host.querySelector('#ddoor').onchange=e=>{checkpoint();if(e.target.checked){draft.items.forEach(z=>z.door=false);}o.door=e.target.checked;persist();renderAll();};
  host.querySelector('#draftDelete').onclick=()=>{checkpoint();draft.items=draft.items.filter(z=>z.id!==o.id);selected=draft.items[0]?.id||null;persist();renderAll();};
  host.querySelector('#draftDuplicate').onclick=()=>{checkpoint();let v=cp(o);v.id=M.uid();v.x=clamp(v.x+36,8,W-v.w-8);v.y=clamp(v.y+30,8,H-v.h-8);v.door=false;v.segments=v.segments.map(s=>({...s,id:M.uid()}));draft.items.push(v);selected=v.id;persist();renderAll();};
  host.querySelectorAll('[data-remove-segment]').forEach(b=>b.onclick=()=>{checkpoint();o.segments=o.segments.filter(s=>s.id!==b.dataset.removeSegment);persist();renderAll();});
  host.querySelectorAll('[data-segprofile]').forEach(b=>b.onchange=()=>{let s=o.segments.find(s=>s.id===b.dataset.segprofile);if(s){checkpoint();s.profile=b.value;persist();renderAll();}});
 }
 function renderAll(){renderSvg();renderInspector();}
 const point=ev=>{const pt=e.svg.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;const ctm=e.svg.getScreenCTM();if(!ctm)return{x:0,y:0};const p=pt.matrixTransform(ctm.inverse());return{x:clamp(p.x,0,W),y:clamp(p.y,0,H)};};
 e.svg.style.touchAction='none';
 e.svg.addEventListener('pointerdown',ev=>{
  if(ev.button!==0 && ev.pointerType==='mouse')return;
  const pt=point(ev),node=ev.target.closest('[data-opening]'),id=node?.getAttribute('data-opening'),oid=id&&draft.items.find(o=>o.id===id);
  const segId=ev.target.getAttribute('data-segid');
  if(tool==='erase'){if(segId&&oid){checkpoint();oid.segments=oid.segments.filter(s=>s.id!==segId);persist();renderAll();}return;}
  if(tool==='vertical'||tool==='horizontal'){
   if(oid){checkpoint();const t=tool==='vertical'?(pt.x-oid.x)/oid.w:(pt.y-oid.y)/oid.h;oid.segments.push({id:M.uid(),direction:tool==='vertical'?'v':'h',t:clamp(t,.04,.96),profile:'1x2'});selected=oid.id;persist();renderAll();}return;
  }
  if(tool==='arch'||tool==='rect'||tool==='ruler'){drag={kind:tool==='ruler'?'ruler':'draw',shape:tool,ax:pt.x,ay:pt.y,bx:pt.x,by:pt.y};e.svg.setPointerCapture(ev.pointerId);renderSvg();return;}
  if(oid){selected=oid.id;let kind=ev.target.getAttribute('data-handle')==='size'?'size':segId?'segment':'move';if(kind==='segment'){let s=oid.segments.find(s=>s.id===segId);drag={kind,o:oid,s,start:pt,orig:s.t};}else drag={kind,o:oid,start:pt,orig:{x:oid.x,y:oid.y,w:oid.w,h:oid.h}};checkpoint();e.svg.setPointerCapture(ev.pointerId);renderAll();}
 });
 e.svg.addEventListener('pointermove',ev=>{
  if(!drag)return;const pt=point(ev);
  if(drag.kind==='draw'||drag.kind==='ruler'){drag.bx=pt.x;drag.by=pt.y;renderSvg();return;}
  let o=drag.o,dx=pt.x-drag.start.x,dy=pt.y-drag.start.y;
  if(drag.kind==='move'){o.x=clamp(drag.orig.x+dx,0,W-o.w);o.y=clamp(drag.orig.y+dy,0,H-o.h);}
  if(drag.kind==='size'){o.w=clamp(drag.orig.w+dx,60,W-o.x);o.h=clamp(drag.orig.h+dy,80,H-o.y);if(draft.feetPerPixel){o.physicalW=o.w*draft.feetPerPixel;o.physicalH=o.h*draft.feetPerPixel;}}
  if(drag.kind==='segment'){let s=drag.s;let t=s.direction==='v'?(pt.x-o.x)/o.w:(pt.y-o.y)/o.h;s.t=clamp(t,.04,.96);}
  renderSvg();
 });
 e.svg.addEventListener('pointerup',ev=>{
  if(!drag)return;const d=drag;drag=null;
  if(d.kind==='draw'){
   const x=Math.min(d.ax,d.bx),y=Math.min(d.ay,d.by),w=Math.abs(d.bx-d.ax),h=Math.abs(d.by-d.ay);
   if(w>=35 && h>=55){checkpoint();let o={id:M.uid(),x,y,w,h,type:d.shape,physicalW:draft.feetPerPixel?+(w*draft.feetPerPixel).toFixed(3):4,physicalH:draft.feetPerPixel?+(h*draft.feetPerPixel).toFixed(3):7,profile:'1x2',segments:[],door:false};draft.items.push(o);selected=o.id;persist();setTool('select');}
  }else if(d.kind==='ruler'){
    const pixels=Math.hypot(d.bx-d.ax,d.by-d.ay);let feet=clampN(host.querySelector('#draftRef').value,.1,100,4);
    if(pixels>15){draft.feetPerPixel=feet/pixels;draft.referenceFeet=feet;persist();setTool('select');}
  }else{persist();}
  renderAll();
 });
 e.svg.addEventListener('pointercancel',()=>{drag=null;renderAll();});
 host.querySelector('#draftPhoto').onchange=ev=>{draft.sourcePhotoId=ev.target.value;persist();renderAll();};
 host.querySelector('#draftOpacity').oninput=ev=>{draft.imageOpacity=+ev.target.value;renderSvg();};
 host.querySelector('#draftOpacity').onchange=()=>persist();
 host.querySelector('#draftRef').onchange=ev=>{draft.referenceFeet=clampN(ev.target.value,.1,100,4);persist();};
 host.querySelector('#draftUndo').onclick=()=>{if(!prior.length)return;draft.items=prior.pop();selected=draft.items[0]?.id||null;persist();renderAll();};
 host.querySelector('#draftSuggest').onclick=()=>{if(draft.items.length && !confirm('¿Reemplazar el dibujo actual con una propuesta basada en las medidas existentes?'))return;checkpoint();const vals=project.openings||[],total=vals.reduce((s,x)=>s+x.w,0);let x=65;const space=Math.min(40,280/Math.max(1,vals.length-1));draft.items=vals.map((o,i)=>{let w=clamp(o.w/Math.max(1,total)*710,100,290);let v={id:M.uid(),x,y:155,w,h:435,type:o.type,physicalW:o.w,physicalH:o.h,door:!!o.door,profile:o.profile||'1x2',segments:cp(o.segments||[]).map(s=>({...s,id:M.uid()}))};x+=w+space;return v;});selected=draft.items[0]?.id||null;persist();renderAll();};
 host.querySelector('#draftClose').onclick=goBack;
 host.querySelector('#draftApprove').onclick=()=>{
   if(!draft.items.length){alert('Dibuja por lo menos un opening.');return;}
   if(draft.items.some(o=>!o.physicalW||!o.physicalH||o.physicalH<=0)){alert('Verifica todas las medidas antes de aprobar.');return;}
   const doors=draft.items.filter(x=>x.door).length;
   if(doors>1){alert('Confirma qué opening lleva la puerta.');return;}
   const bad=draft.items.some(o=>o.type==='arch'&&o.physicalH<o.physicalW/2);
   if(bad){alert('Algún arco tiene altura menor que el radio de su curvatura. Corrige su geometría.');return;}
   const pwidth=project.house.porchW,pier=+project.pier||1.25,sum=draft.items.reduce((s,o)=>s+o.physicalW,0)+Math.max(0,draft.items.length-1)*pier;
   if(sum>pwidth+.01 && !confirm('Los openings y pilares superan el ancho del muro. ¿Aprobar como medición pendiente de confirmar?'))return;
   if(!confirm('¿Aprobar esta revisión? El plano actualizará Medidas, 3D y el takeoff del proyecto. Verifica las dimensiones en campo.'))return;
   const rev=(project.approvedDrawing?.revision||0)+1;
   const canonical=draft.items.map(o=>({id:o.id,type:o.type,w:+o.physicalW,h:+o.physicalH,door:!!o.door,profile:o.profile||'1x2',segments:cp(o.segments),photoBox:{x:o.x,y:o.y,w:o.w,h:o.h}}));
   project.approvedDrawing={revision:rev,approvedAt:Date.now(),photoId:draft.sourcePhotoId,items:cp(canonical),geometry:cp(draft.items),feetPerPixel:draft.feetPerPixel||null,source:'manually-traced'};
   project.openings=canonical;
   project.drawingDraft.revisionBasedOn=rev;
   project.house.porchW=Math.max(project.house.porchW,sum+.5);
   save();approved(rev);
 };
 host.querySelector('#draftExport').onclick=()=>{
  const copy=e.svg.cloneNode(true);copy.setAttribute('xmlns','http://www.w3.org/2000/svg');const xml=new XMLSerializer().serializeToString(copy);
  const url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Gorilla-Photo-Trace-'+(project.approvedDrawing?.revision||'Draft')+'.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
 };
 renderAll();
 return ()=>{};
}
window.GSSPhotoEditor={editor,initDraft,takeoff,path};
})();
