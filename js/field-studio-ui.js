/* Gorilla Field Studio — iPhone-first presentation layer.
   All actions delegate to the existing project/store/vision/Studio/PDF modules.
   Zero design geometry, price, approval, or customer data is synthesized here. */
(function(){
 'use strict';
 const e=x=>String(x==null?'':x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const path=(p,s)=>'#/p/'+encodeURIComponent(p.id)+'/'+s;
 const stages=[
  ['datos','Cliente'],['fotos','Fotos'],['aerea','Vista aérea'],
  ['analisis','Análisis IA'],['studio','Diseño'],['precio','Cotizar'],['entregar','Entrega']
 ];
 const names={
  datos:['Cliente y proyecto','Empezamos con lo esencial.'],
  fotos:['Fotos del sitio','Captura el lugar donde construiremos el screen.'],
  aerea:['Vista aérea','Ubica el área de construcción alrededor de la casa.'],
  analisis:['Análisis del sitio','La IA observa las condiciones; tú verificas.'],
  studio:['Diseña tu screen','La estructura propuesta es nuestro producto.'],
  medidas:['Medidas y edición','Verifica las dimensiones antes de fabricar.'],
  '3d':['Visualización 3D','Explora tu proyecto antes de presentarlo.'],
  precio:['Takeoff y cotización','Revisa los materiales y configura el precio.'],
  entregar:['Proyecto listo para presentar','Comparte los entregables disponibles.'],
  editor:['Editor 2D','Traza y confirma los openings reales.'],
  roof:['Diseño de cubierta','Solo si se construirá un techo de screen.'],
  parts:['Biblioteca técnica','Perfiles y detalles para revisión.']
 };
 const stage=tab=>Math.max(0,stages.findIndex(x=>x[0]===tab))>=0&&stages.some(x=>x[0]===tab)?
  stages.findIndex(x=>x[0]===tab):
  ['medidas','editor','roof','parts','3d'].includes(tab)?4:0;
 function header(p,tab){
  const n=stage(tab),info=names[tab]||names.datos;
  return '<section class="fs-journey" aria-label="Flujo de visita">'+
   '<div class="fs-journey-line"><span class="fs-kicker">GORILLA FIELD STUDIO</span><span class="fs-step-count">PASO '+(n+1)+' DE 7</span></div>'+
   '<h1>'+e(info[0])+'</h1><p>'+e(info[1])+'</p>'+
   '<div class="fs-journey-steps" role="group" aria-label="Pasos del proyecto">'+stages.map((x,i)=>
    '<button type="button" class="fs-step '+(i===n?'current':i<n?'done':'')+'" data-fs-go="'+x[0]+'" aria-label="Paso '+(i+1)+': '+x[1]+'" title="'+x[1]+'" '+(i===n?'aria-current="step"':'')+'>'+
    '<span class="fs-step-dot">'+(i<n?'✓':(i+1))+'</span><span class="fs-step-name">'+x[1]+'</span></button>').join('')+
   '</div></section>';
 }
 const icon={
  datos:'<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  fotos:'<path d="M3 7h4l2-2h6l2 2h4v12H3z"/><circle cx="12" cy="13" r="3.5"/>',
  studio:'<path d="M12 3 21 8v9l-9 5-9-5V8z"/><path d="M12 12 21 8M12 12v10M12 12 3 8"/>',
  precio:'<path d="M12 2v20M17 6c-3-3-10-2-10 2 0 6 10 2 10 8 0 4-7 5-10 2"/>',
  entregar:'<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h5M8 13h8M8 17h8"/>'
 };
 function bottom(p,tab){
  const nav=[['datos','Visita'],['fotos','Capturar'],['studio','Diseñar'],['precio','Cotizar'],['entregar','Entregar']];
  const current=['aerea','analisis'].includes(tab)?'fotos':['medidas','editor','roof','parts','3d'].includes(tab)?'studio':tab;
  return '<nav class="tabbar fs-bottom" aria-label="Navegación principal">'+nav.map(([key,name])=>
   '<a href="'+path(p,key)+'" '+(current===key?'aria-current="page"':'')+' aria-label="'+name+'">'+
   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icon[key]+'</svg><span>'+name+'</span></a>').join('')+'</nav>';
 }
 function more(p,tab){
  const links=[['medidas','Medidas'],['3d','Visor 3D'],['editor','Plano 2D'],['roof','Techo'],['parts','Perfiles']];
  if(!['studio','medidas','3d','editor','roof','parts'].includes(tab))return '';
  return '<details class="fs-more"><summary>Herramientas de diseño <span aria-hidden="true">⌄</span></summary>'+
   '<div class="fs-tools">'+links.map(([k,l])=>'<button type="button" data-fs-go="'+k+'" '+(tab===k?'aria-current="page"':'')+'>'+l+'</button>').join('')+'</div></details>';
 }
 function introHome(){
  return '<section class="fs-home-welcome">'+
   '<div class="fs-home-brand"><img src="assets/gorilla-logo.png" alt="Gorilla Screening Solutions LLC">'+
    '<span>GORILLA SCREEN STUDIO</span></div>'+
   '<h1>Buenos días,<br><span>equipo Gorilla.</span></h1>'+
   '<p>De la primera foto al diseño listo para presentar. Todo en un lugar.</p>'+
   '<div class="fs-home-hero-tiles"><span>✦ Análisis del sitio</span><span>⬡ Diseño de screen</span><span>▤ Planos y propuesta</span></div>'+
  '</section>';
 }
 function homeStart(){
  return '<div class="fs-create-visit"><div class="fs-create-icon">＋</div><div><b>Nueva visita</b>'+
    '<span>Fotografía, diseña y prepara el proyecto</span></div><span aria-hidden="true" class="fs-chevron">›</span></div>';
 }
 const slots=[
  ['frente','Vista general','Frente o área completa del enclosure','photo'],
  ['west','Diagonal izquierda','Fascia, profundidad y conexiones','camera'],
  ['east','Diagonal derecha','Muros, encuentros y obstáculos','camera'],
  ['detalles','Fascia y gutters','Línea de conexión y soffit','details'],
  ['porche','Desde el interior','Puertas, ventanas y suelo','photo'],
  ['aerea','Vista aérea','Ubicación y perímetro del patio','aerial']
 ];
 function client(p){
  const types=[['pool','Pool enclosure','Estructura nueva'],['porch','Porch infill','Aberturas existentes'],
   ['lanai','Lanai / patio','Cubierta y screen'],['repair','Repair / rescreen','Revisión de obra']];
  return '<section class="card fs-client-intro"><span class="fs-kicker">NUEVA VISITA</span>'+
   '<h2>Primero, conoce al cliente.</h2><p class="fs-support">Confirma el nombre, teléfono y dirección de la cita. Después fotografía el área donde construiremos.</p></section>'+
   '<section class="fs-panel"><span class="fs-kicker">TIPO DE PROYECTO</span><h2>¿Qué vamos a diseñar?</h2>'+
   '<div class="fs-client-type">'+types.map(([k,l,h])=>
      '<button type="button" data-fs-type="'+k+'" aria-pressed="'+(p.fieldType===k)+'">'+l+'<span>'+h+'</span></button>').join('')+
   '</div></section>';
 }
 function photoGuide(p,photos){
  const completed=slots.filter(([cat])=>photos.some(ph=>ph.cat===cat)).length;
  const shot=photos.find(ph=>ph.cat==='frente'||ph.cat==='site')||photos.find(ph=>ph.cat!=='render');
  return '<section class="fs-photo-guide">'+
   '<div class="fs-photo-hero">'+
    (shot?'<img src="'+e(shot.url)+'" alt="Foto real guardada para esta visita">':'<div class="fs-camera-blank"><span>◎</span><b>Tu próxima visita comienza aquí</b><small>Captura la zona donde se instalará el screen</small></div>')+
    '<div class="fs-photo-badge">'+photos.length+' foto'+(photos.length===1?'':'s')+' guardada'+(photos.length===1?'':'s')+'</div></div>'+
   '<div class="fs-panel"><div class="fs-panel-title"><div><span class="fs-kicker">CAPTURA GUIADA</span><h2>Fotos del proyecto</h2></div>'+
   '<span class="fs-count">'+completed+'/6</span></div>'+
   '<p class="fs-support">Una sola captura para comprender la casa como contexto y diseñar el enclosure por separado.</p>'+
   '<div class="fs-guide-list">'+slots.map(([cat,title,desc])=>{
      const photo=photos.find(ph=>ph.cat===cat);
      return '<label class="fs-guide-row '+(photo?'is-done':'')+'">'+
       '<span class="fs-guide-thumb">'+(photo?'<img src="'+e(photo.url)+'" alt="">':(cat==='aerea'?'⌖':'▧'))+'</span>'+
       '<span class="fs-guide-copy"><b>'+title+'</b><small>'+desc+'</small></span>'+
       '<span class="fs-guide-status">'+(photo?'✓':'＋')+'</span>'+
       '<input type="file" accept="image/*" data-guide-cat="'+cat+'" aria-label="Agregar '+title+'"></label>';
   }).join('')+'</div>'+
   '<div class="fs-support fs-consent-note">Las fotos permanecen asociadas a este proyecto. El análisis con IA requiere tu autorización.</div>'+
   '<a class="btn block fs-next" href="'+path(p,'aerea')+'">Continuar a vista aérea <span>→</span></a>'+
   '</div></section>';
 }
 function aerial(p,photos,links){
  const photo=photos.find(x=>x.cat==='aerea');
  return '<section class="fs-aerial"><div class="fs-panel">'+
   '<span class="fs-kicker">CONTEXTO EXISTENTE</span><h2>Ubica la zona de construcción</h2>'+
   '<p class="fs-support">Usa la dirección para consultar la propiedad. El enclosure se diseña aparte de la casa.</p>'+
   '<div class="fs-aerial-map">'+(p.address?
     '<iframe src="'+e(links.embed)+'" title="Mapa satelital de referencia" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>':
     '<div class="fs-empty-map">⌖<br>Agrega primero la dirección de la propiedad</div>')+'</div>'+
   '<div class="fs-aerial-actions"><a class="btn sec" target="_blank" rel="noopener noreferrer" href="'+e(links.sat)+'">↗ Abrir mapa</a>'+
   '<label class="btn sec">＋ Añadir imagen autorizada<input type="file" data-field-aerial accept="image/*" aria-label="Subir una imagen aérea autorizada"></label></div>'+
   (photo?'<div class="fs-aerial-uploaded"><img src="'+e(photo.url)+'" alt="Vista aérea guardada en el proyecto">'+
      '<span>✓ Imagen aérea guardada</span></div>':'')+
   '<p class="fs-support fs-consent-note">El mapa es una referencia. No se guarda automáticamente una captura de Google Maps; agrega únicamente imágenes que tengas derecho a utilizar.</p>'+
   '<a class="btn block fs-next" href="'+path(p,'analisis')+'">Continuar al análisis del sitio →</a></div></section>';
 }
 function analysis(p,photos){
  const a=p.aiVision;
  const ok=!!(a&&window.GSSVision?.belongsTo(a,p.id,photos));
  const list=(title,arr)=>Array.isArray(arr)&&arr.length?
    '<div class="fs-analysis-list"><h3>'+title+'</h3>'+arr.slice(0,5).map(x=>'<div class="fs-analysis-point"><span>✓</span><p>'+e(x)+'</p></div>').join('')+'</div>':'';
  return '<section class="fs-panel fs-ai-stage"><div class="fs-ai-symbol">✦</div>'+
   '<span class="fs-kicker">GORILLA AI VISION</span><h2>'+(ok?'Análisis guardado':'Tu sitio, entendido con IA')+'</h2>'+
   '<p class="fs-support">'+(ok?'Hallazgos disponibles para revisión del vendedor.':'El primer análisis se ejecuta en Fotos, con hasta cinco imágenes autorizadas de esta misma propiedad.')+'</p>'+
   (ok?'<div class="fs-ai-summary"><span>✓ Evidencia vinculada al proyecto</span><span>Modelo: '+e(a.model)+'</span></div>'+
      list('Condiciones existentes',a.findings?.visibleHouseFeatures)+
      list('Conexiones y fascia',a.findings?.fasciaAndAttachmentObservations)+
      list('Verificar en campo',a.findings?.measurementsToVerify):
     '<div class="fs-ai-empty">Analiza las fotos guardadas para obtener un resumen del sitio. El resultado NO genera medidas de fabricación.</div>')+
   '<a class="btn sec block" href="'+path(p,'fotos')+'">'+(ok?'Revisar fotos y análisis':'Ir a analizar fotografías')+'</a>'+
   '<a class="btn block fs-next" href="'+path(p,'studio')+'">Abrir diseño del screen →</a>'+
   '<p class="fs-support fs-consent-note">Las medidas, anclajes y selecciones constructivas siguen sujetos a verificación y aprobación humana.</p></section>';
 }
 function studio(p,photos){
  const shot=photos.find(x=>x.cat==='frente'||x.cat==='site'||x.cat==='porche');
  return '<section class="fs-design-intro"><div class="fs-design-card">'+
   '<div class="fs-design-copy"><span class="fs-kicker">TU PRODUCTO · SCREEN ENCLOSURE</span>'+
    '<h2>Diseña, ajusta y presenta.</h2>'+
    '<p>La casa es la referencia. El aluminio, la malla y las puertas son el diseño editable de Gorilla.</p></div>'+
   (shot?'<img src="'+e(shot.url)+'" alt="Condiciones existentes en la propiedad">':
    '<div class="fs-design-placeholder">⌂</div>')+
   '<div class="fs-design-footer"><span>◉ Diseño conceptual</span><span>Medidas de campo pendientes de verificar</span></div></div>'+
   '<div class="fs-design-quick"><button data-fs-go="medidas" type="button">▤ Medidas</button>'+
   '<button data-fs-go="3d" type="button">⬡ Ver 3D</button>'+
   '<button data-fs-go="entregar" type="button">↗ Entregables</button></div>'+
   '</section>';
 }
 function deliverables(p,photos,isApproved,priceReady){
  const picture=photos.find(x=>x.cat==='frente'||x.cat==='site'||x.cat==='porche');
  const last=(p.address||'Nueva visita').split(',')[0];
  const sheets=[
   ['G-0','Sitio y ubicación'],['S-1','Plantas y elevaciones'],
   ['S-2','Detalles constructivos'],['S-3','Fotos y vistas 3D']
  ];
  return '<section class="fs-delivery"><div class="fs-delivery-cover"><div class="fs-cover-top">'+
   '<img src="assets/gorilla-logo.png" alt="Gorilla Screening Solutions LLC">'+
   '<span>FIELD STUDIO · ENTREGA</span></div>'+
   '<h2>'+e(last)+'</h2><p>'+e(p.address||'Agrega la dirección en Visita')+'</p>'+
   (picture?'<img class="fs-cover-photo" src="'+e(picture.url)+'" alt="Foto real del sitio del proyecto">':
     '<div class="fs-cover-placeholder">Añade una fotografía para la portada</div>')+
   '<div class="fs-cover-caption">Condiciones existentes · propuesta de screen sujeta a revisión</div>'+
   '</div><div class="fs-panel"><div class="fs-panel-title"><div><span class="fs-kicker">PAQUETE DEL PROYECTO</span>'+
    '<h2>Documentos para presentar</h2></div></div>'+
   '<p class="fs-support">'+(isApproved?'La revisión geométrica del proyecto está disponible para generar planos conceptuales.':
     'Para emitir planos y precios basados en el diseño, primero verifica y aprueba la geometría requerida.')+'</p>'+
   '<div class="fs-sheets">'+sheets.map(([id,title])=>
     '<div class="fs-sheet"><span>'+id+'</span><b>'+title+'</b><small>Conceptual</small></div>').join('')+
   '</div><div class="fs-delivery-warning">Planos conceptuales. No son planos sellados ni autorización de ingeniería o fabricación.</div>'+
   '</div></section>';
 }
 window.GSSFieldUI={header,bottom,more,introHome,homeStart,client,photoGuide,aerial,analysis,studio,deliverables,stage,stages};
})();
