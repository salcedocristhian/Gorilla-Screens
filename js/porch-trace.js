/* Gorilla V17 Porch Infill: project-isolated, photo-relative arch tracings.
   REVIEW DRAFT ONLY. Coordinates are ratios of one unmodified project photo,
   never field measurements, construction geometry, material quantities or approvals. */
(function(){
'use strict';
const clamp=n=>Math.max(0,Math.min(1000,Math.round(Number(n)||0)));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DEFAULT={left:230,right:410,top:250,spring:460,bottom:800,crown:320};
function cleanArch(a,i){
 const o={id:String(a?.id||'arch-'+(i+1)).slice(0,48),label:String(a?.label||'Arco '+(i+1)).slice(0,70),
   left:clamp(a?.left),right:clamp(a?.right),top:clamp(a?.top),
   spring:clamp(a?.spring),bottom:clamp(a?.bottom),crown:clamp(a?.crown),
   measurementStatus:'unverified',structuralSuitability:'unverified',photoAligned:a?.photoAligned===true};
 if(o.right<=o.left+15||o.top>=o.spring-10||o.spring>=o.bottom-10) return null;
 o.crown=Math.max(o.left+5,Math.min(o.right-5,o.crown));
 return o;
}
function photoOwned(photo,projectId){return !!photo&&photo.projectId===projectId&&typeof photo.id==='string';}
function read(project,photos){
 const d=project?.porchTrace;
 if(!project?.id||!d||d.projectId!==project.id||!Array.isArray(photos))return null;
 const ph=photos.find(p=>p.id===d.photoId&&photoOwned(p,project.id));
 if(!ph)return null;
 return {schemaVersion:1,projectId:project.id,photoId:ph.id,
   arches:(Array.isArray(d.arches)?d.arches:[]).slice(0,12).map(cleanArch).filter(Boolean),
   status:'draft-needs-human-review',verified:false,
   conceptDoorArchId:(Array.isArray(d.arches)&&d.arches.some(a=>a.id===d.conceptDoorArchId))?String(d.conceptDoorArchId):'',
   updatedAt:Number(d.updatedAt)||0};
}
function defaultArch(i,count){
 const w=Math.min(210,Math.floor(770/Math.max(1,count)));
 const start=Math.round((1000-w*count)/2)+i*w;
 return {...DEFAULT,id:'arch-'+(i+1),label:'Arco '+(i+1),
   left:start+8,right:start+w-8,crown:start+Math.floor(w/2),
   measurementStatus:'unverified',structuralSuitability:'unverified'};
}
function path(a){
 const x0=a.left,x1=a.right,c=a.crown,y=a.top,ys=a.spring,yb=a.bottom;
 return 'M'+x0+','+yb+' L'+x0+','+ys+' Q'+x0+','+y+' '+c+','+y+
   ' Q'+x1+','+y+' '+x1+','+ys+' L'+x1+','+yb+' Z';
}
let activeMount=null;
function unmount(){if(activeMount){activeMount.destroy();activeMount=null;}}
function mount({project,photos,host,save,notify}){
 unmount();
 if(!host||!project?.id)return;
 let preview3d=null;
 const instance={destroy(){if(preview3d){preview3d.destroy();preview3d=null;}}};
 activeMount=instance;
 const owned=(photos||[]).filter(p=>photoOwned(p,project.id)&&p.url);
 const tell=notify||((msg)=>alert(msg));
 let draft=read(project,owned);
 let selected=0;
 let placement=null;
 const placeTip=()=>!placement?'':('Paso '+(placement.points.length+1)+'/3 del '+(placement.index+1)+'º arco: '+['marca la corona (punto más alto)','marca la base del lado izquierdo','marca la base del lado derecho'][placement.points.length]+'.');
 const persist=()=>{if(!draft)return;draft.updatedAt=Date.now();project.porchTrace=JSON.parse(JSON.stringify(draft));save();};
 function draw(){
   const svg=host.querySelector('.v17-trace-svg');
   if(!svg||!draft)return;
   svg.innerHTML=draft.arches.map((a,i)=>{
     const sel=i===selected;
     const handles=sel?[
       ['left',a.left,a.spring],['right',a.right,a.spring],['top',a.crown,a.top],
       ['bottom',a.crown,a.bottom]
     ].map(([k,x,y])=>'<circle data-handle="'+k+'" data-index="'+i+'" cx="'+x+'" cy="'+y+'" r="14" class="v17-trace-handle"/>').join(''):'';
     return '<path data-arch-index="'+i+'" d="'+path(a)+'" class="v17-trace-path '+(sel?'selected':'')+'"/>'+
       '<text x="'+(a.crown)+'" y="'+Math.max(20,a.top-25)+'" class="v17-trace-text">'+esc(a.label)+'</text>'+handles;
   }).join('');
 }
 function render(){
  if(preview3d){preview3d.destroy();preview3d=null;}
  if(!owned.length){
    host.innerHTML='<section class="card v17-trace-card"><h2>Porch Infill · Trazado fotográfico</h2>'+
      '<p>No hay fotografías de esta propiedad disponibles aquí. <a href="#/p/'+esc(project.id)+'/fotos">Agregar fotos →</a></p></section>';return;
  }
  const photo=owned.find(p=>p.id===draft?.photoId)||owned[0];
  const obs=project.aiVision?.findings?.siteGeometry?.facadeOpenings||[];
  const count=Array.isArray(obs)&&obs.length?Math.max(1,Math.min(8,obs.length)):3;
  host.innerHTML='<section class="card v17-trace-card" aria-label="Porch Infill photo tracing">'+
    '<div class="v17-cardhead"><div><div class="cap">PORCH INFILL · PHOTO TRACE P0</div>'+
    '<h2>Arcos existentes — trazado 2D</h2></div><span class="v17-pill v17-warning">Solo referencia</span></div>'+
    '<p class="lead smalltext">Delimita cada abertura sobre una foto de ESTA propiedad. Los contornos son proporciones visuales, NO pulgadas, pies, cotas, anclajes ni planos aprobados.</p>'+
    '<label class="v17-field"><span>Fotografía de referencia</span><select data-trace-photo>'+
    owned.map(p=>'<option value="'+esc(p.id)+'" '+(p.id===photo.id?'selected':'')+'>'+esc(p.cat||'foto')+' · '+new Date(p.createdAt||Date.now()).toLocaleDateString('en-US')+'</option>').join('')+
    '</select></label>'+
    (!draft?'<div class="v17-trace-setup"><p>Aún no hay contornos para esta foto.</p>'+
      '<button class="btn" data-trace-start>Crear '+count+' guías editables · sin medidas</button></div>':
      '<div class="v17-trace-photo"><img src="'+esc(photo.url)+'" alt="Fotografía autorizada del proyecto"><svg class="v17-trace-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Contornos preliminares editables de arcos"></svg></div>'+
      '<p class="smalltext lead"><strong>Atención:</strong> las guías iniciales son ejemplos y pueden estar fuera de los arcos reales. No equivalen a detección automática.</p>'+
      '<div class="v17-trace-position"><strong>'+draft.arches.filter(a=>a.photoAligned).length+' de '+draft.arches.length+' aberturas ubicadas sobre la foto</strong>'+
      '<p data-trace-place-tip aria-live="polite">'+(placement?placeTip():'Usa 3 clics por arco para definir la corona y las dos bases. Después ajusta los círculos.')+'</p>'+
      '<button type="button" class="btn sec" data-trace-place>'+(placement?'Cancelar ubicación':'📍 Ubicar arcos reales (3 clics por arco)')+'</button></div>'+
      '<p class="smalltext lead">Ajuste fino: arrastra los círculos del arco seleccionado. Las ubicaciones son referencia visual, no cotas.</p>'+
      '<div class="v17-trace-list">'+draft.arches.map((a,i)=>
        '<button type="button" data-trace-select="'+i+'" aria-pressed="'+(selected===i)+'">'+esc(a.label)+' · sin cotas</button>').join('')+'</div>'+
      '<section class="v17-porch-concept" aria-label="Porch Infill conceptual 3D">'+
      '<h3>Porch Infill · Vista 3D conceptual</h3>'+
      '<p class="smalltext lead">Reproduce los contornos que ajustaste, con malla y spline de aluminio. Conserva los muros y arcos como contexto esquemático; NO agrega techo ni inventa cotas.</p>'+
      '<label class="v17-field"><span>Puerta opcional · posición visual solamente</span><select data-trace-door>'+
      '<option value="">Sin puerta propuesta</option>'+
      draft.arches.map(a=>'<option value="'+esc(a.id)+'" '+(a.id===draft.conceptDoorArchId?'selected':'')+'>'+esc(a.label)+'</option>').join('')+
      '</select></label>'+
      '<h4 class="v17-photo-match-title">Foto real + propuesta de screen</h4>'+
      '<div class="v17-porch-match" aria-label="Comparación visual de malla sobre la fotografía real">'+
      '<img src="'+esc(photo.url)+'" alt="Fotografía real del proyecto, sin reconstrucción inventada">'+
      '<svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Malla de screen propuesta dentro de contornos trazados">'+
      '<defs><pattern id="gorilla-mesh-'+esc(project.id)+'" width="13" height="13" patternUnits="userSpaceOnUse">'+
      '<path d="M 0 0 L 13 13 M 13 0 L 0 13" stroke="rgba(180,210,222,.8)" stroke-width="1.5"/></pattern></defs>'+
      draft.arches.map(a=>'<path d="'+path(a)+'" fill="rgba(48,88,105,.20)" stroke="#e8edf0" stroke-width="4"/>'+
      '<path d="'+path(a)+'" fill="url(#gorilla-mesh-'+esc(project.id)+')" stroke="none"/>').join('')+
      '</svg></div>'+
      '<p class="smalltext lead">Photo Match: esta imagen conserva la casa real de fondo. El screen superpuesto es una propuesta preliminar, no un render de ingeniería.</p>'+
      '<h4 class="v17-photo-match-title">Volumen 3D conceptual · giro libre</h4>'+
      '<div class="v17-porch-stage" id="v17-porch-infill-3d"></div>'+
      '<p class="smalltext lead">Arrastra para girar el concepto 3D. El espesor de muro, el diseño de la puerta y la ubicación de anclajes NO están verificados.</p>'+
      '</section>'+
      '<div class="v17-btnrow"><button class="btn sec" data-trace-add>+ Añadir abertura</button>'+
      '<button class="btn sec" data-trace-delete '+(!draft.arches.length?'disabled':'')+'>Quitar seleccionada</button>'+
      '<button class="btn sec" data-trace-clear>Restablecer dibujo</button></div>'+
      '<p class="v17-note"><strong>Estado: revisión humana.</strong> No se modifican el 3D existente, cubierta Mansard, medidas verificadas, precios, takeoff ni compras. Falta medir cada arco, verificar soportes y revisar la abertura superior del plafón.</p>')+
    '</section>';
  host.querySelector('[data-trace-photo]').onchange=e=>{
    const id=e.target.value;
    if(draft&&draft.photoId!==id&&draft.arches.length&&!confirm('La nueva foto requiere un trazado nuevo. ¿Reemplazar el trazado actual?')){render();return;}
    draft={schemaVersion:1,projectId:project.id,photoId:id,arches:[],conceptDoorArchId:'',status:'draft-needs-human-review',verified:false,updatedAt:Date.now()};
    selected=0;placement=null;persist();render();
  };
  const start=host.querySelector('[data-trace-start]');
  if(start)start.onclick=()=>{
    draft={schemaVersion:1,projectId:project.id,photoId:photo.id,
      arches:Array.from({length:count},(_,i)=>defaultArch(i,count)),
      conceptDoorArchId:'',status:'draft-needs-human-review',verified:false,updatedAt:Date.now()};
    selected=0;placement=null;persist();render();tell('Guías provisionales creadas. Usa “Ubicar arcos reales” para llevarlas a las aberturas fotografiadas.');
  };
  const placeButton=host.querySelector('[data-trace-place]');
  if(placeButton)placeButton.onclick=()=>{
    placement=placement?null:{index:0,points:[]};
    selected=placement?.index||0;render();
  };
  host.querySelectorAll('[data-trace-select]').forEach(b=>b.onclick=()=>{
    selected=Number(b.dataset.traceSelect);
    if(placement)placement={index:selected,points:[]};
    render();
  });
  const add=host.querySelector('[data-trace-add]');
  if(add)add.onclick=()=>{
    if(draft.arches.length>=12){tell('Máximo 12 aberturas por fotografía.');return;}
    const a=defaultArch(draft.arches.length,Math.max(3,draft.arches.length+1));
    a.id='arch-'+Date.now();draft.arches.push(a);selected=draft.arches.length-1;persist();render();
  };
  const door=host.querySelector('[data-trace-door]');
  if(door)door.onchange=e=>{draft.conceptDoorArchId=draft.arches.some(a=>a.id===e.target.value)?e.target.value:'';persist();render();};
  const del=host.querySelector('[data-trace-delete]');
  if(del)del.onclick=()=>{
    const removed=draft.arches.splice(selected,1);
    if(removed.some(a=>a.id===draft.conceptDoorArchId))draft.conceptDoorArchId='';
    selected=Math.max(0,Math.min(selected,draft.arches.length-1));persist();render();
  };
  const reset=host.querySelector('[data-trace-clear]');
  if(reset)reset.onclick=()=>{if(!confirm('¿Eliminar solo los contornos de esta propiedad?'))return;draft.arches=[];selected=0;placement=null;persist();render();};
  const svg=host.querySelector('.v17-trace-svg');
  if(svg&&draft){
    draw();
    let dragging=null;
    const xy=e=>{const b=svg.getBoundingClientRect();return {x:clamp((e.clientX-b.left)*1000/b.width),
      y:clamp((e.clientY-b.top)*1000/b.height)};};
    svg.onpointerdown=e=>{
      if(placement){
        const p=xy(e);
        placement.points.push(p);
        if(placement.points.length===3){
          const [top,left,right]=placement.points;
          const xa=Math.min(left.x,right.x),xb=Math.max(left.x,right.x);
          const bottom=Math.round((left.y+right.y)/2);
          const spring=top.y+Math.round((bottom-top.y)*.48);
          if(xb-xa<25||top.y+30>=bottom||top.x<xa-40||top.x>xb+40){
            tell('Los 3 puntos no forman una abertura clara. Vuelve a marcar corona, base izquierda y base derecha.');
            placement.points=[];
          }else{
            const a=draft.arches[placement.index];
            const test=cleanArch({...a,left:xa,right:xb,top:top.y,
              crown:Math.max(xa+5,Math.min(xb-5,top.x)),spring,bottom,photoAligned:true},placement.index);
            if(test)draft.arches[placement.index]=test;
            else tell('Contorno inválido, vuelve a marcar el arco.');
            if(test){
              persist();
              placement.index++;
              placement.points=[];
              if(placement.index>=draft.arches.length)placement=null;
              selected=placement?.index||Math.min(selected,draft.arches.length-1);
            }else placement.points=[];
          }
        }
        e.preventDefault();
        render();return;
      }
      const h=e.target.closest('[data-handle]');
      if(h){selected=Number(h.dataset.index);dragging=h.dataset.handle;svg.setPointerCapture(e.pointerId);e.preventDefault();return;}
      const target=e.target.closest('[data-arch-index]');
      if(target){selected=Number(target.dataset.archIndex);draw();}
    };
    svg.onpointermove=e=>{
      if(!dragging||!draft.arches[selected])return;
      const a=draft.arches[selected],p=xy(e);
      if(dragging==='left')a.left=Math.max(0,Math.min(a.right-24,p.x));
      if(dragging==='right')a.right=Math.min(1000,Math.max(a.left+24,p.x));
      if(dragging==='top'){a.top=Math.max(0,Math.min(a.spring-24,p.y));a.crown=Math.max(a.left+5,Math.min(a.right-5,p.x));}
      if(dragging==='bottom')a.bottom=Math.min(1000,Math.max(a.spring+24,p.y));
      a.photoAligned=true;
      draw();e.preventDefault();
    };
    const stop=()=>{if(!dragging)return;dragging=null;persist();render();};
    svg.onpointerup=stop;svg.onpointercancel=stop;svg.onlostpointercapture=stop;
  }
 if(draft&&draft.arches.length&&window.GSSPorchInfill3D){
   preview3d=window.GSSPorchInfill3D.mount({host:host.querySelector('#v17-porch-infill-3d'),project,photos:owned});
 }
 }
 render();
 return instance;
}
window.GSSPorchTrace={read,mount,unmount,cleanArch,path};
})();
