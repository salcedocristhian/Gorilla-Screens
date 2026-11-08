/* Gorilla AI Designer — project-specific design interview.
 * The house is EVIDENCE; only the screen enclosure is a proposed product.
 * No visual guesses become verified dimensions, fabrication geometry or takeoff.
 */
(function(){
'use strict';
const enc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=v=>String(v??'').trim().slice(0,400);
const validId=v=>typeof v==='string'&&/^[\w-]{1,48}$/.test(v);
const option=(id,label)=>({id,label});
const kinds=[
 option('porch','Porch infill / arcos existentes'),
 option('pool','Pool enclosure nuevo'),
 option('lanai','Patio / lanai'),
 option('repair','Rescreen o reparación')
];
const finishes=[option('white','White'),option('bronze','Dark Bronze')];
const mesh=[option('standard','Standard 18×14'),option('no-see-um','No-See-Um'),
 option('pet','Pet Screen'),option('privacy','Privacy Screen')];
function evidence(p,photos){
 const report=p?.aiVision;
 const valid=!!(report&&window.GSSVision?.belongsTo(report,p.id,photos));
 const g=valid?report.findings?.siteGeometry||{}:{};
 const hay=[...(report?.findings?.visibleHouseFeatures||[]),...(report?.findings?.suggestedEnclosureDesign||[])].join(' ');
 const arches=valid?(Array.isArray(g.facadeOpenings)&&g.facadeOpenings.length?
    g.facadeOpenings.filter(o=>/arch|arco/i.test(o.type||'')).length:0):0;
 return {valid,photoIds:valid?report.photoIds.slice():[],
  archCount:arches,archMentioned:valid&&/arch|arco/i.test(hay),
  coveredPatio:g.coveredPatio===true,roofType:valid?txt(g.houseRoofType):'',
  pool:g.poolPresent===true?'observed':g.poolPresent===false?'unconfirmed':'unknown',
  observations:valid?report.findings?.visibleHouseFeatures?.slice(0,8)||[]:[],
  attachments:valid?report.findings?.fasciaAndAttachmentObservations?.slice(0,8)||[]:[],
  missingViews:valid?g.recommendedCaptureMissingViews?.slice(0,5)||[]:[]
 };
}
function recommendedPhotos(projectId,photos){
 const preferred=['frente','site','west','east','detalles','porche','street','aerea'];
 const rows=(Array.isArray(photos)?photos:[]).filter(x=>x.projectId===projectId&&x.id&&
   !['render'].includes(x.cat));
 const aerial=rows.find(x=>x.cat==='aerea');
 const site=rows.filter(x=>x.cat!=='aerea').sort((a,b)=>
    preferred.indexOf(a.cat)<preferred.indexOf(b.cat)?-1:
    preferred.indexOf(a.cat)>preferred.indexOf(b.cat)?1:0);
 const chosen=site.slice(0,aerial?4:5);
 if(aerial)chosen.push(aerial);
 return chosen.map(x=>x.id);
}
function initial(p,photos){
 const ev=evidence(p,photos);
 const kind=['porch','pool','lanai','repair'].includes(p.fieldType)?p.fieldType:null;
 return {version:1,projectId:p.id,evidencePhotoIds:ev.photoIds,
  reportKey:ev.valid?Number(p.aiVision.importedAt)||0:0,
  projectType:kind,answers:{},reviewed:false,startedAt:Date.now(),updatedAt:Date.now()};
}
function get(p,photos){
 const ev=evidence(p,photos);
 const stored=p.aiDesigner;
 if(!stored||stored.projectId!==p.id||stored.version!==1||
   !Array.isArray(stored.evidencePhotoIds)||
   stored.evidencePhotoIds.join('|')!==ev.photoIds.join('|')||
   stored.reportKey!==(ev.valid?Number(p.aiVision.importedAt)||0:0)){
    p.aiDesigner=initial(p,photos);
 }
 return p.aiDesigner;
}
function questionSet(p,photos){
 const ev=evidence(p,photos),s=get(p,photos),kind=s.answers.kind||s.projectType;
 const q=[{id:'kind',title:'¿Qué construcción quiere el cliente?',
   helper:'La IA estudia la casa, pero tu producto es el screen enclosure.',
   options:kinds}];
 if(!kind)return q;
 if(kind==='porch'){
  q.push({id:'scope',title:ev.archCount?
    'Veo '+ev.archCount+' arco'+(ev.archCount===1?'':'s')+' identificados. ¿Qué vamos a cerrar?':
    '¿Qué aberturas existentes vamos a cerrar?',
    helper:'Confirmar en sitio. Un arco detectado no constituye una medida.',
    options:[option('all','Todas las aberturas del porche'),option('some','Solo algunas aberturas'),
     option('front','Únicamente la fachada principal'),option('other','Otro alcance')]});
  q.push({id:'top',title:ev.coveredPatio?
    'El porche parece cubierto. ¿Lleva screen en la abertura superior?':
    '¿Necesitamos un screen superior sin construir un techo nuevo?',
    helper:'Conservar el soffit, la estructura y los arcos existentes como referencia.',
    options:[option('no','No, solo screen en aberturas'),option('yes','Sí, cerrar el espacio superior'),
     option('inspect','Revisar el encuentro en campo')]});
  q.push({id:'door',title:'¿Dónde necesita el cliente acceso?',
    helper:'Una puerta de 36 × 80 pulgadas es una opción nominal; confirmar que cabe.',
    options:[option('none','No requiere puerta'),option('left','Primera abertura / izquierda'),
     option('center','Abertura central'),option('right','Última abertura / derecha'),
     option('field','Decidir en campo')]});
 }else if(kind==='pool'||kind==='lanai'){
  q.push({id:'roof',title:'¿Qué cubierta construiremos?',
    helper:'La cubierta de la casa no es el techo nuevo del enclosure.',
    options:[option('mansard','Mansard screen roof'),option('flat','Flat screen roof'),
     option('gable','Gable screen roof'),option('existing','Ya existe cubierta; solo infill'),
     option('review','Elegir después de revisar el sitio')]});
  q.push({id:'attachment',title:'¿Cómo se conecta a la propiedad?',
    helper:ev.attachments.length?'Gemini observó elementos de fascia/gutter. Las conexiones siguen sin verificación estructural.':
      'Se necesita una fotografía cercana de fascia y superficies de conexión.',
    options:[option('fascia','Super gutter en fascia existente'),option('wall','Conexión a muro existente'),
     option('free','Estructura independiente'),option('inspect','A confirmar en campo')]});
  q.push({id:'door',title:'¿Dónde irá la puerta de acceso?',
    helper:'La cantidad y posición serán editables en Studio.',
    options:[option('front','Frente'),option('side','Lateral'),option('multiple','Más de una puerta'),
     option('none','Sin puerta'),option('field','Definir en sitio')]});
 }else{
  q.push({id:'scope',title:'¿Qué vamos a intervenir?',
    helper:'No presupuestar piezas que no están incluidas.',
    options:[option('rescreen','Solo reemplazar malla'),option('frame','Reparar perfiles de aluminio'),
     option('door','Puertas y hardware'),option('mixed','Varios componentes')]});
  q.push({id:'attachment',title:'¿Hay daño en las conexiones?',
    options:[option('no','No observado'),option('yes','Sí, requiere evaluación'),option('inspect','Pendiente de inspección')]});
 }
 q.push({id:'finish',title:'¿Qué acabado de aluminio prefiere el cliente?',
   helper:'Solo las dos opciones del catálogo Gorilla.',options:finishes});
 q.push({id:'mesh',title:'¿Qué tipo de screen desea instalar?',
   helper:'Standard 18×14 es la configuración inicial.',options:mesh});
 q.push({id:'scale',title:'¿Tenemos una medida real para establecer escala?',
   helper:'Una foto diagonal sirve para contexto, pero no da dimensiones de fabricación.',
   options:[option('measured','Sí, tomaremos una medida de referencia'),option('later','No todavía; medir después')]});
 return q;
}
function next(p,photos){
 const s=get(p,photos),q=questionSet(p,photos);
 return q.find(x=>!Object.prototype.hasOwnProperty.call(s.answers,x.id))||null;
}
function answer(p,photos,id,value){
 const q=next(p,photos);
 if(!q||q.id!==id||!q.options.some(o=>o.id===value))throw Error('Respuesta fuera de secuencia o no válida.');
 const s=get(p,photos);
 s.answers[id]=value;
 if(id==='kind')s.projectType=value;
 s.updatedAt=Date.now();
 s.reviewed=false;
 return {completed:!next(p,photos),session:s};
}
function back(p,photos){
 const s=get(p,photos),q=questionSet(p,photos);
 const answered=q.filter(x=>Object.prototype.hasOwnProperty.call(s.answers,x.id));
 if(!answered.length)return;
 const last=answered[answered.length-1].id;
 delete s.answers[last];
 if(last==='kind')s.projectType=null;
 s.reviewed=false;s.updatedAt=Date.now();
}
function summary(p,photos){
 const s=get(p,photos),ev=evidence(p,photos),questions=questionSet(p,photos);
 const type=s.answers.kind||s.projectType||null;
 const answered=questions.filter(q=>s.answers[q.id]);
 return {
  projectId:p.id,evidence:ev,kind:type,
  answers:Object.assign({},s.answers),complete:next(p,photos)===null,
  asked:questions.length,answered:answered.length,
  // Context, not an as-built house geometry or inferred scale.
  houseContext:{role:'existing-context-only',observations:ev.observations,
    attachmentObservations:ev.attachments,facadeArches:ev.archCount,
    reconstructionStatus:'needs-scene-model',verified:false},
  product:{role:'proposed-screen-enclosure',kind:type,roof:s.answers.roof||null,
    upperScreen:s.answers.top||null,attachment:s.answers.attachment||null,
    doorLocation:s.answers.door||null,finish:s.answers.finish||'white',
    mesh:s.answers.mesh||'standard',editable:true},
  measurements:[
    {key:'enclosureWidth',valueFt:null,status:'needs-reference-or-field-measurement'},
    {key:'enclosureDepth',valueFt:null,status:'needs-reference-or-field-measurement'},
    {key:'attachmentHeight',valueFt:null,status:'needs-reference-or-field-measurement'}
  ],
  flags:['Design brief only: not construction approval','Do not add a Mansard roof to a covered porch infill',
   'No quantities or prices until geometry and field measurements are reviewed']
 };
}
function approveIntent(p,photos){
 const plan=summary(p,photos);
 if(!plan.complete)throw Error('Termina la conversación antes de confirmar el alcance.');
 const session=get(p,photos);
 session.reviewed=true;session.updatedAt=Date.now();
 // Import only direct seller CHOICES, never inferred structure, prices or dimensions.
 // Do not overwrite existing signed/approved or demo geometry.
 if(p.kind==='field' && !p.approvedDrawing && !p.studioV17?.approvedOrder){
   const finish=plan.product.finish,mesh=plan.product.mesh;
   p.frameColor=finish==='bronze'?'bronze':'white';
   p.mesh=mesh==='standard'?'18×14 fiberglass charcoal':
      mesh==='no-see-um'?'No-See-Um':mesh==='pet'?'Pet Screen':'Privacy Screen';
   if(!p.studioV17)p.studioV17={};
   p.studioV17.finish=p.frameColor;
   p.studioV17.mesh=mesh==='standard'?'Standard 18x14 fiberglass':
      mesh==='no-see-um'?'No-See-Um':mesh==='pet'?'Pet Screen':'Privacy Screen';
   if(['pool','lanai'].includes(plan.kind)&&['mansard','flat','gable'].includes(plan.product.roof)){
     p.studioV17.roof=plan.product.roof;
   }
   if(plan.product.doorLocation==='none')p.studioV17.doorCount=0;
   p.studioV17.verified=false;
 }
 return plan;
}
function escOpts(choices,current){
 return choices.map(o=>'<button type="button" class="ad-choice '+(current===o.id?'chosen':'')+
  '" data-ad-answer="'+enc(o.id)+'">'+enc(o.label)+'<span aria-hidden="true">›</span></button>').join('');
}
function render({project,photos,host,save,navigate,notify,sceneAccess}){
 host._sceneCleanup?.();
 const p=project,ev=evidence(p,photos),s=get(p,photos),q=next(p,photos),sum=summary(p,photos);
 const photo=photos.find(x=>x.projectId===p.id&&['frente','site','porche'].includes(x.cat));
 const markup='<section class="ad-shell">'+
 '<div class="ad-intro"><div><span class="fs-kicker">GORILLA · AI DESIGNER</span>'+
 '<h2>Diseñemos el screen juntos.</h2>'+
 '<p>Primero entiendo la casa y el área de trabajo. Después definimos qué vamos a construir.</p></div>'+
 (photo?'<img src="'+enc(photo.url)+'" alt="Fotografía de la propiedad actual">':'<div class="ad-placeholder">⌂</div>')+
 '</div>'+
 '<div class="ad-context"><span class="ad-status">'+(ev.valid?'✓ Análisis Gemini vinculado':'○ Sin análisis Gemini validado')+'</span>'+
 '<p>'+(!ev.valid?'El diseñador puede preparar el alcance, pero el análisis de la casa y sus conexiones requiere fotos y un reporte real.':
 ev.archCount?'La IA identificó '+ev.archCount+' arcos; faltan cotas verificadas.':
 'La IA registró condiciones existentes; valida siempre los puntos de conexión.')+'</p></div>'+
 '<div class="ad-conversation"><div class="ad-progress"><b>'+(q?'Conversación de diseño':'Brief listo para revisión')+
 '</b><span>'+sum.answered+' / '+sum.asked+'</span></div>'+
 (q?'<div class="ad-bubble"><div class="ad-avatar">✦</div><div class="ad-question"><h3>'+enc(q.title)+'</h3>'+
 (q.helper?'<p>'+enc(q.helper)+'</p>':'')+'</div></div>'+
 '<div class="ad-choices">'+escOpts(q.options,s.answers[q.id])+'</div>':
 '<div class="ad-finished"><span class="ad-complete">✓</span><h3>Ya tengo el alcance del diseño.</h3>'+
 '<p>Ahora toca verificar las dimensiones del sitio para convertir este brief en un modelo editable confiable.</p>'+
 '<div class="ad-brief">'+[
  ['Producto',sum.product.kind],['Cubierta propuesta',sum.product.roof||'No definida'],
  ['Acabado',sum.product.finish==='bronze'?'Dark Bronze':'White'],
  ['Screen',sum.product.mesh],['Puerta / acceso',sum.product.doorLocation||'No especificado']
 ].map(([k,v])=>'<div><span>'+enc(k)+'</span><b>'+enc(v||'Pendiente')+'</b></div>').join('')+'</div>'+
 '<div class="ad-warning">La casa todavía requiere un modelo geométrico revisable. Ninguna medida, precio o anclaje fue aprobado automáticamente.</div>'+
 '<button type="button" class="btn block" data-ad-continue>Verificar medidas y preparar el 3D →</button></div>')+
 '<div class="ad-controls"><button type="button" class="btn sec" data-ad-back '+(!sum.answered?'disabled':'')+'>← Corregir respuesta</button>'+
 '<a class="btn sec" href="#/p/'+enc(p.id)+'/fotos">Revisar fotos</a></div></div>'+
 (ev.missingViews.length?'<details class="ad-missing"><summary>Fotos adicionales sugeridas por Gemini</summary><ul>'+
 ev.missingViews.map(x=>'<li>'+enc(x)+'</li>').join('')+'</ul></details>':'')+'</section>';
 host.innerHTML=markup;
 if(sceneAccess&&window.GSSSiteSceneView){const target=document.createElement('div');host.appendChild(target);host._sceneCleanup=GSSSiteSceneView.mount({project:p,photos,host:target,save,access:sceneAccess,notify});}
 host.querySelectorAll('[data-ad-answer]').forEach(b=>b.onclick=async()=>{
   host.querySelectorAll('[data-ad-answer]').forEach(x=>x.disabled=true);
   try{answer(p,photos,q.id,b.dataset.adAnswer);await save();render({project:p,photos,host,save,navigate,notify,sceneAccess});}
   catch(err){notify?.(err.message);render({project:p,photos,host,save,navigate,notify,sceneAccess});}
 });
 host.querySelector('[data-ad-back]')?.addEventListener('click',async()=>{
   try{back(p,photos);await save();render({project:p,photos,host,save,navigate,notify,sceneAccess});}
   catch(err){notify?.(err.message);}
 });
 host.querySelector('[data-ad-continue]')?.addEventListener('click',async()=>{
   if(!sum.complete)return;
   try{approveIntent(p,photos);await save();navigate('medidas');}catch(err){notify?.(err.message);}
 });
}
window.GSSAiDesigner={evidence,recommendedPhotos,initial,get,questionSet,next,answer,back,summary,approveIntent,render};
})();
