/* Gorilla AI vision pilot: no customer data stored or automatically published. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const demoNames=[
 '01-frente-actual.jpg',
 '03-porche-puerta-ventana.jpg',
 '04-porche-arcos-a.jpg',
 '05-porche-arcos-b.jpg'
];
const photos=[];
let latest=null,preview=null,working=false;
const setStatus=(message,kind='')=>{
 const el=$('status');el.textContent=message;el.className='status '+kind;
};
const clearPhotos=()=>{
 photos.forEach(x=>URL.revokeObjectURL(x.preview));
 photos.length=0;
};
function showPhotos(){
 const target=$('gallery');target.replaceChildren();
 if(!photos.length){target.textContent='No hay fotografías seleccionadas.';return;}
 for(let i=0;i<photos.length;i++){
  const card=document.createElement('div');card.className='photo';
  const img=document.createElement('img');img.src=photos[i].preview;img.alt=photos[i].name;
  const label=document.createElement('span');label.textContent=''+(i+1)+' · '+photos[i].name.slice(0,22);
  card.append(img,label);target.append(card);
 }
}
function usePhotos(files){
 if(!files?.length)throw Error('Selecciona al menos una fotografía.');
 clearPhotos();
 for(const file of [...files].slice(0,5)){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))
   throw Error('Solo se permiten imágenes JPG, PNG o WebP.');
  const previewUrl=URL.createObjectURL(file);
  photos.push({blob:file,preview:previewUrl,name:file.name});
 }
 showPhotos();
 latest=null;$('result').hidden=true;$('exports').hidden=true;$('stage').hidden=true;
 if(preview){preview.destroy();preview=null;}
 setStatus(photos.length+' imágenes preparadas. Esperando autorización para enviar al proveedor.');
}
async function loadDemo(){
 if(working)return;
 $('demo').disabled=true;
 try{
  const files=await Promise.all(demoNames.map(async filename=>{
   const response=await fetch('/demo/'+encodeURIComponent(filename),{cache:'no-store'});
   if(!response.ok)throw Error('Unable to load sample photo '+filename);
   return new File([await response.blob()],filename,{type:'image/jpeg'});
  }));
  usePhotos(files);
  // These are numbers from the opt-in repository demo, never presented as field measurements.
  $('width').value='16';$('depth').value='6';$('height').value='9.17';
  setStatus('4 fotos existentes de Boca Raton cargadas. El render propuesto se excluyó para no confundir a la IA. Medidas del demo: no verificadas.');
 }catch(e){setStatus(e.message,'error');}
 finally{$('demo').disabled=false;}
}
function loadInput(files){
 try{usePhotos(files);}
 catch(e){setStatus(e.message,'error');}
}
async function compress(blob){
 const img=await createImageBitmap(blob).catch(()=>null);
 if(!img)throw Error('Unable to read photograph; try a smaller JPG.');
 try{
  for(const max of [1200,1024,768,640]){
   const scale=Math.min(1,max/Math.max(img.width,img.height));
   const c=document.createElement('canvas');
   c.width=Math.max(1,Math.round(img.width*scale));
   c.height=Math.max(1,Math.round(img.height*scale));
   const ctx=c.getContext('2d');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
   ctx.drawImage(img,0,0,c.width,c.height);
   const url=c.toDataURL('image/jpeg',.72);
   if(url.length<1_300_000)return url;
  }
  throw Error('One photograph is too large after compression.');
 }finally{img.close?.();}
}
function getNumber(id){
 const v=Number($(id).value);
 return $(id).value.trim()!==''&&Number.isFinite(v)&&v>0?v:null;
}
function addCard(title,lines,root){
 const section=document.createElement('section');
 const heading=document.createElement('h3');heading.textContent=title;section.append(heading);
 if(lines.length){
  const list=document.createElement('ul');
  for(const item of lines){const li=document.createElement('li');li.textContent=String(item);list.append(li);}
  section.append(list);
 }else{
  const p=document.createElement('p');p.textContent='No observation reported';section.append(p);
 }
 root.append(section);
}
function showResult(r){
 const holder=$('result');holder.replaceChildren();holder.hidden=false;
 const grid=document.createElement('div');grid.className='result-grid';
 const obs=[
  'Existing roof: '+r.site.houseRoofType,
  'Fascia visible: '+(r.site.fasciaVisible?'Yes':'Not confirmed'),
  ...r.site.visibleFeatures.map(x=>'Visible: '+x),
  ...r.site.obstacles.map(x=>'Obstacle: '+x),
  ...r.site.attachmentCandidates.map(c=>
   'Photo '+(c.imageIndex||'?')+': '+c.location+' — '+c.reason+' ('+c.confidence+')'),
  ...r.site.limitations.map(x=>'Uncertainty: '+x)
 ];
 addCard('Existing house · context only',obs,grid);
 addCard('Proposed enclosure · draft',[
  'Suggested roof: '+r.enclosure.proposedRoof,
  ...r.enclosure.designNotes,
  r.enclosure.doorPlacementComment,
  ...r.enclosure.drainageNotes
 ].filter(Boolean),grid);
 addCard('Must verify before any structural design',[
  ...r.measurementsToVerify,...r.warnings,
  'No photo-derived dimensions are certified by this analysis.'
 ],grid);
 holder.append(grid);$('exports').hidden=false;
}
async function analyze(){
 if(working)return;
 if(!photos.length){setStatus('Primero selecciona fotografías.','error');return;}
 if(!$('consent').checked){setStatus('Confirma la autorización para compartir fotografías.','error');return;}
 working=true;$('analyze').disabled=true;$('demo').disabled=true;
 setStatus('Reduciendo fotos y solicitando observaciones al modelo visual…');
 try{
  const images=[];
  for(const photo of photos)images.push(await compress(photo.blob));
  const resp=await fetch('/api/ai/analyze',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({
    agreedToShare:true,images,
    dimensions:{width:getNumber('width'),depth:getNumber('depth'),height:getNumber('height')}
   })
  });
  const data=await resp.json();
  if(!resp.ok)throw Error(data.error||'Analysis failed');
  latest={...data,inputs:{
   width:getNumber('width'),depth:getNumber('depth'),height:getNumber('height'),
   photoCount:photos.length,source:'Gorilla Private FreeLLMAPI Pilot',
   dimensionsStatus:'User supplied / unverified'
  }};
  showResult(data.draft);
  setStatus('Borrador recibido de '+(data.meta.servedModel||data.meta.requestedModel)+
   ' · Confianza reportada: '+data.draft.overallConfidence+'. Revisa todo antes de continuar.','success');
 }catch(e){latest=null;$('result').hidden=true;$('exports').hidden=true;setStatus(e.message,'error');}
 finally{working=false;$('analyze').disabled=false;$('demo').disabled=false;}
}
function exportDraft(){
 if(!latest)return;
 const content={...latest,exportNotice:
  'Reference-only visual interpretation. No real-site dimensions or structural compliance verified.'};
 const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');
 a.href=url;a.download='gorilla-site-observations-DRAFT.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function view3D(){
 if(!latest)return;
 const {width,depth,height}=latest.inputs;
 if(!(width>0&&depth>0&&height>0)){
  setStatus('Para el visor 3D introduce ancho, profundidad y altura manualmente. La IA no debe inventarlos.','error');return;
 }
 if(!window.GSSV17Engine||!window.GSSV17Preview||!window.THREE?.OrbitControls){
  setStatus('No se pudo cargar Three.js; revisa que tu navegador tenga acceso a la biblioteca.','error');return;
 }
 if(preview){preview.destroy();preview=null;}
 const draft=latest.draft,model=window.GSSV17Engine.defaults();
 model.width=width;model.depth=depth;model.height=height;
 const allowed=['flat','mansard','gable','irp','mixed'];
 model.roof=allowed.includes(draft.enclosure.proposedRoof)?draft.enclosure.proposedRoof:'flat';
 model.site.enabled=true;model.site.showPhoto=true;model.site.verified=false;
 model.site.roofType=['flat','gable','hip'].includes(draft.site.houseRoofType)?
  draft.site.houseRoofType:'gable';
 // Sizes of the existing house are PROVISIONAL for this 3D reference. Never used for takeoff.
 const photo={id:'local-draft',url:photos[0]?.preview};
 $('stage').hidden=false;
 try{preview=window.GSSV17Preview.mount($('preview'),model,photo)}
 catch(e){$('stage').hidden=true;setStatus('No se pudo abrir el visor: '+e.message,'error');}
}
async function health(){
 try{
  const resp=await fetch('/api/ai/health',{cache:'no-store'});
  const data=await resp.json();
  $('connection').textContent=data.configured?
   'Local FreeLLMAPI bridge listo · Vision model: '+data.model+' · Nada se envía hasta autorizar.':
   'No hay clave de FreeLLMAPI configurada. Añádela al entorno local para activar el análisis.';
  $('connection').classList.toggle('off',!data.configured);
  $('analyze').disabled=!data.configured;
 }catch{
  $('connection').textContent='Local pilot server not running. See README for launch instructions.';
  $('connection').classList.add('off');
 }
}
$('demo').addEventListener('click',loadDemo);
$('photos').addEventListener('change',e=>loadInput(e.target.files));
$('analyze').addEventListener('click',analyze);
$('export').addEventListener('click',exportDraft);
$('view').addEventListener('click',view3D);
window.addEventListener('pagehide',()=>{if(preview)preview.destroy();clearPhotos();});
health();
})();
