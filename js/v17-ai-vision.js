/* Gorilla AI Vision experimental client. Project photos remain local unless a user
   explicitly consents to send selected images to an approved HTTPS backend.
   AI responses are DRAFT observations; never alter 3D, dimensions, pricing or approvals. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const accepted=['image/jpeg','image/png','image/webp'];
const maxFiles=5,maxImageBytes=1400000;
function endpoint(){
 const x=typeof window.GORILLA_VISION_ENDPOINT==='string'?window.GORILLA_VISION_ENDPOINT.trim():'';
 try{const u=new URL(x);return u.protocol==='https:'&&u.pathname.endsWith('/analyze')?u.toString():'';}
 catch{return '';}
}
function getAIState(p){
 if(!p.aiVision||typeof p.aiVision!=='object')p.aiVision={draft:null,selected:[],reviewedAt:null};
 return p.aiVision;
}
function validateResponse(input){
 if(!input||input.status!=='DRAFT_REQUIRES_REVIEW'||!input.analysis||typeof input.analysis!=='object')throw Error('Respuesta del servicio no tiene el formato de borrador esperado.');
 const a=input.analysis;
 const list=(key,limit=30)=>Array.isArray(a[key])?a[key].slice(0,limit).map(v=>String(typeof v==='string'?v:JSON.stringify(v)).slice(0,300)):[];
 return {
   observations:list('observations'),fascia:list('possibleFasciaLocations'),openings:list('openings'),
   obstacles:list('obstacles'),measurements:list('measurementsToVerify'),limitations:list('limitations'),
   model:String(input.model||'unspecified').slice(0,120),status:'DRAFT_REQUIRES_REVIEW'
 };
}
function dataURL(blob){
 return new Promise((resolve,reject)=>{
   const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('No se pudo leer la fotografía.'));
   r.readAsDataURL(blob);
 });
}
async function prepareImage(photo){
 if(!photo?.blob||!accepted.includes(photo.blob.type))throw Error('Solamente JPEG, PNG y WebP compatibles.');
 // Downscale on-device to reduce exposure, latency and free-tier costs.
 const src=await createImageBitmap(photo.blob);
 try{
   const size=Math.min(1,1280/Math.max(src.width,src.height));
   const cvs=document.createElement('canvas');cvs.width=Math.max(1,Math.round(src.width*size));cvs.height=Math.max(1,Math.round(src.height*size));
   const ctx=cvs.getContext('2d');if(!ctx)throw Error('No hay memoria para procesar la foto.');
   ctx.drawImage(src,0,0,cvs.width,cvs.height);
   let quality=.84;
   for(let k=0;k<4;k++){
     const b=await new Promise(resolve=>cvs.toBlob(resolve,'image/jpeg',quality));
     if(b&&b.size<=maxImageBytes)return dataURL(b);
     quality-=.17;
   }
   throw Error('Imagen demasiado grande después de comprimirla.');
 }finally{src.close();}
}
const listed=(items,label)=>{
 if(!items.length)return '<p class="v17-vision-empty">No reportado; no equivale a ausencia en la vivienda.</p>';
 return '<div class="v17-vision-group"><b>'+esc(label)+'</b><ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>';
};
function render({project,photos,host,save,notify}){
 const state=getAIState(project),endpointURL=endpoint();
 const photoChoices=photos.filter(p=>p?.blob&&accepted.includes(p.blob.type)&&p.cat!=='render');
 const selected=new Set(state.selected.filter(id=>photoChoices.some(p=>p.id===id)));
 if(selected.size===0&&photoChoices.length)photoChoices.slice(0,maxFiles).forEach(p=>selected.add(p.id));
 state.selected=[...selected];
 const old=state.draft;
 const btnDisabled=!(endpointURL&&photoChoices.length);
 host.innerHTML='<section class="card v17-vision-card"><div class="v17-cardhead"><div><div class="cap">EXPERIMENTAL · AI VISION</div><h2>Analyze Existing Site</h2></div><span class="v17-pill">Not for production</span></div>'+
 '<p class="lead">Analiza fotos del proyecto como referencia para diseñar el <strong>screen enclosure</strong>. Nunca aplica cambios automáticos al 3D ni al takeoff.</p>'+
 '<div class="v17-note">'+(endpointURL?'Gateway HTTPS configurado. Ninguna foto se transmite sin tu consentimiento.':'Gateway de IA no configurado. Puedes preparar las fotos; para hacer llamadas reales hace falta desplegar y proteger el servicio.')+'</div>'+
 '<div class="v17-vision-photos">'+photoChoices.map(p=>'<label class="v17-vision-photo"><img src="'+esc(p.url)+'" alt="Foto del proyecto: '+esc(p.cat)+'"><input type="checkbox" data-v17-photo="'+esc(p.id)+'" '+(selected.has(p.id)?'checked':'')+'><span>'+esc(p.cat)+'</span></label>').join('')+'</div>'+
 (!photoChoices.length?'<div class="v17-placeholder">Este proyecto aún no tiene fotografías compatibles. Agrégalas en la pestaña Fotos.</div>':'')+
 '<label class="v17-vision-consent"><input id="v17-vision-consent" type="checkbox"> Confirmo que tengo autorización para enviar estas fotos al proveedor de IA seleccionado.</label>'+
 '<div class="v17-btnrow"><button class="btn" data-v17-vision-action="analyze" '+(btnDisabled?'disabled':'')+'>Analyze Site Photos</button><button class="btn sec" data-v17-vision-action="prepare">Prepare review</button></div>'+
 '<p class="v17-vision-status" role="status">'+(endpointURL?'Listo para análisis, pendiente autorización.':'Sin conexión configurada; ningún análisis se ejecutará.')+'</p>'+
 (old?'<div class="v17-vision-results"><div class="cap">UNVERIFIED AI DRAFT · '+esc(old.model)+'</div>'+
 listed(old.observations,'Observations')+listed(old.fascia,'Potential fascia locations')+listed(old.openings,'Openings')+
 listed(old.obstacles,'Obstacles')+listed(old.measurements,'Field measurements required')+listed(old.limitations,'Limitations')+
 '<p class="v17-note">Resultado solamente de lectura. La confirmación dimensional y el diseño siguen en Studio → Design.</p></div>':'')+'</section>';
 host.querySelectorAll('[data-v17-photo]').forEach(c=>c.onchange=()=>{
   const id=c.dataset.v17Photo;if(c.checked){if(selected.size>=maxFiles){c.checked=false;notify('Máximo 5 fotografías.');return;}selected.add(id);}else selected.delete(id);
   state.selected=[...selected];save();
 });
 host.querySelector('[data-v17-vision-action="prepare"]').onclick=()=>{
   host.querySelector('.v17-vision-status').textContent=selected.size+
    ' fotografía(s) listas para revisar. Falta conexión segura y autorización para solicitar IA.';
 };
 host.querySelector('[data-v17-vision-action="analyze"]').onclick=async e=>{
   const checked=host.querySelector('#v17-vision-consent').checked;
   const current=photos.filter(p=>selected.has(p.id)),status=host.querySelector('.v17-vision-status');
   if(!checked){status.textContent='Debes autorizar explícitamente el envío de fotografías.';return;}
   if(!endpointURL){status.textContent='No hay gateway configurado.';return;}
   if(current.length<1||current.length>maxFiles){status.textContent='Selecciona de 1 a 5 fotos.';return;}
   const button=e.currentTarget;button.disabled=true;status.textContent='Preparando fotografías y analizando…';
   try{
     const images=await Promise.all(current.map(prepareImage));
     const controller=new AbortController();
     const timer=setTimeout(()=>controller.abort(),65000);
     let response;
     try{response=await fetch(endpointURL,{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({images,projectRef:project.id}),signal:controller.signal});}
     finally{clearTimeout(timer);}
     const answer=await response.json();
     if(!response.ok)throw Error(answer.error||'El gateway no pudo analizar las fotografías.');
     state.draft=validateResponse(answer);state.reviewedAt=null;state.selected=[...selected];save();
     render({project,photos,host,save,notify});
   }catch(err){status.textContent='Análisis no completado: '+String(err?.message||err).slice(0,260);}
   finally{button.disabled=false;}
 };
}
window.GSSVisionExperiment={render,validateResponse,endpoint};
})();