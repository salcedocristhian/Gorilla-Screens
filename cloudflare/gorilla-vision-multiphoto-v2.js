/* Gorilla AI Vision — Cloudflare Worker V2 staging template.
   Cloudflare Access MUST protect All traffic.
   Browser app remains on GitHub Pages; same-origin /pilot submits to THIS Worker.
   No public CORS, no keys in this file, no direct ordering / engineering. */
const MODEL='gemini-3.5-flash-lite';
let lastCall=0; // Isolate-local courtesy cooldown, NOT a global rate limit.
const json=(v,status=200)=>new Response(JSON.stringify(v,null,2),{status,headers:{
  'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const PAGE=[
'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
'<title>Gorilla AI · Multi-photo pilot</title>',
'<style>body{font:15px system-ui;background:#101216;color:#eee;margin:0}main{max-width:720px;margin:auto;padding:26px 18px}',
'section{padding:18px;background:#24262b;border-radius:14px;margin:18px 0}small,p{color:#bec3ca;line-height:1.5}',
'button{background:#81b3fa;color:#111;border:0;padding:12px 16px;border-radius:9px;font-weight:700;margin:8px 0}',
'button:disabled{opacity:.5}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#141519;border-radius:10px;padding:15px;font-size:12px}',
'input[type=file]{width:100%;padding:9px 0}label{display:flex;gap:10px;margin:15px 0;align-items:start}</style>',
'<main><small>GORILLA SCREEN STUDIO · PRIVATE TEST</small><h1>AI Site Reconstruction</h1>',
'<p>La casa es la referencia; el screen enclosure es nuestro diseño. Dimensiones y conexiones requieren verificación.</p>',
'<section><h3>1 · Hasta cinco fotos de la misma propiedad</h3><input id="photos" type="file" multiple accept="image/jpeg,image/png,image/webp">',
'<label><input id="consent" type="checkbox">Tengo autorización para enviar estas fotos a Gemini y acepto sus condiciones.</label>',
'<button id="analyze">Analizar fotos</button><p id="status">No se han enviado fotografías.</p></section>',
'<section><h3>2 · Resultado para Gorilla Studio</h3><p>Borrador visual; no es un plano o medida certificada.</p>',
'<pre id="out">Esperando…</pre><button id="copy" disabled>Copiar JSON</button></section></main>',
'<script>',
'const $=id=>document.getElementById(id);',
'async function compressed(f){const b=await createImageBitmap(f);try{for(const max of [1100,880,700]){',
'const c=document.createElement("canvas"),scale=Math.min(1,max/Math.max(b.width,b.height));',
'c.width=Math.max(1,Math.round(b.width*scale));c.height=Math.max(1,Math.round(b.height*scale));',
'c.getContext("2d").drawImage(b,0,0,c.width,c.height);const u=c.toDataURL("image/jpeg",.66);',
'if(u.length<1050000)return u;}throw Error("Imagen demasiado grande.");}finally{b.close();}}',
'$("analyze").onclick=async()=>{const files=[...$("photos").files];',
'if(files.length<1||files.length>5){$("status").textContent="Selecciona entre 1 y 5 fotos.";return;}',
'if(!$("consent").checked){$("status").textContent="Confirma autorización primero.";return;}',
'$("analyze").disabled=true;$("status").textContent="Gemini analiza las fotos…";',
'try{const images=[];for(const f of files)images.push(await compressed(f));',
'const response=await fetch("/api/reconstruct",{method:"POST",headers:{"content-type":"application/json"},',
'body:JSON.stringify({images,consent:true})});const data=await response.json();',
'if(!response.ok)throw Error(data.error||"Request failed");$("out").textContent=JSON.stringify(data,null,2);',
'$("copy").disabled=false;$("copy").onclick=()=>navigator.clipboard.writeText(JSON.stringify(data,null,2));',
'$("status").textContent="Borrador listo. Revísalo antes de importarlo a Gorilla Studio.";',
'}catch(e){$("status").textContent="Error: "+e.message;}finally{$("analyze").disabled=false;}};',
'</script></html>'
].join('');
const PROMPT=[
 'You are a Florida screen enclosure existing-site visual analysis assistant.',
 'The HOUSE is context; the SCREEN ENCLOSURE is the proposed design.',
 'Analyze the attached photos as the same property. Do not confuse proposal renders with existing conditions.',
 'Return exactly one JSON object with fields: findings and siteGeometry.',
 'findings keys: visibleHouseFeatures, fasciaAndAttachmentObservations, patioAndObstacles,',
 'suggestedEnclosureDesign, measurementsToVerify, limitations. All are short string arrays.',
 'siteGeometry keys: houseRoofType (flat/gable/hip/unknown), facadeOpenings (array).',
 'Each opening has: kind (window/door/sliding-door/arch/column/opening),',
 'x,y,width,height (all normalized 0..1 relative to a conceptual FRONTAL elevation of existing house;',
 'x left-to-right, y measured upward from bottom), confidence (low/medium/high), evidence (string).',
 'Include coordinates ONLY if multiple views clearly support a conceptual frontal alignment;',
 'if perspective or position is ambiguous, return facadeOpenings: []. Never fabricate openings.',
 'Never infer measured ft/in, verified fascia attachment, exact slab dimension, wind loading,',
 'property survey, code compliance, engineering approval or quantity from photos.',
 'Identify field measurements needed before screen enclosure fabrication.',
 'Maximum 12 observations in each array and 12 openings.'
].join('\n');
async function readBody(request){
 let body='';const decoder=new TextDecoder(),reader=request.body?.getReader();
 if(!reader)throw Error('Missing body');
 while(true){
  const {done,value}=await reader.read();if(done)break;
  body+=decoder.decode(value,{stream:true});
  if(body.length>6200000)throw Error('Request too large');
 }
 return JSON.parse(body+decoder.decode());
}
function normalize(data,count){
 const f=data?.findings,g=data?.siteGeometry;
 if(!f||!g||typeof f!=='object'||typeof g!=='object')throw Error('Missing AI schema');
 const list=k=>Array.isArray(f[k])?f[k].slice(0,12).filter(x=>typeof x==='string').map(x=>x.slice(0,250)):[];
 const kinds=['window','door','sliding-door','arch','column','opening'];
 const openings=Array.isArray(g.facadeOpenings)?g.facadeOpenings.slice(0,12).filter(o=>{
  if(!kinds.includes(o?.kind))return false;
  const n=[o.x,o.y,o.width,o.height];
  return n.every(x=>typeof x==='number'&&Number.isFinite(x))&&o.x>=0&&o.y>=0&&
   o.width>0&&o.height>0&&o.x+o.width<=1&&o.y+o.height<=1;
 }).map(o=>({kind:o.kind,x:o.x,y:o.y,width:o.width,height:o.height,
  confidence:['low','medium','high'].includes(o.confidence)?o.confidence:'low',
  evidence:String(o.evidence||'').slice(0,220)})):[];
 return {status:'draft-needs-human-review',model:MODEL,findings:{
  visibleHouseFeatures:list('visibleHouseFeatures'),
  fasciaAndAttachmentObservations:list('fasciaAndAttachmentObservations'),
  patioAndObstacles:list('patioAndObstacles'),
  suggestedEnclosureDesign:list('suggestedEnclosureDesign'),
  measurementsToVerify:list('measurementsToVerify'),
  limitations:list('limitations'),
  siteGeometry:{houseRoofType:['flat','gable','hip'].includes(g.houseRoofType)?g.houseRoofType:'unknown',
   photoCount:count,facadeOpenings:openings}
 },note:'Visual reference only: no measured dimensions, engineering, survey or fabrication approval.'};
}
export default {
 async fetch(request,env){
  const u=new URL(request.url),p=u.pathname;
  if(request.method==='GET'&&p==='/')return json({
   application:'Gorilla Screen Studio',service:'AI Vision',
   status:'Online',phase:'Private multi-photo draft',geminiKeyConfigured:!!env.GEMINI_API_KEY
  });
  if(request.method==='GET'&&p==='/check-gemini'){
   if(!env.GEMINI_API_KEY)return json({connected:false,error:'Gemini secret not set'},503);
   try{
    const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=20',
     {headers:{'x-goog-api-key':env.GEMINI_API_KEY}});
    if(!r.ok)return json({connected:false,googleStatus:r.status},502);
    const v=await r.json();return json({connected:true,service:'Google Gemini',modelsFound:v.models?.length||0});
   }catch{return json({connected:false,error:'Connection failed'},502);}
  }
  if(request.method==='GET'&&p==='/pilot')return new Response(PAGE,{headers:{
   'content-type':'text/html; charset=utf-8','cache-control':'no-store',
   'content-security-policy':"default-src 'none'; img-src blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'"
  }});
  if(p!=='/api/reconstruct')return json({error:'Not found'},404);
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(!env.GEMINI_API_KEY)return json({error:'Gemini key not configured'},503);
  // Cloudflare Access policy must be All traffic; do NOT expose public CORS.
  if(request.headers.get('origin')!==u.origin||
    !request.headers.get('content-type')?.startsWith('application/json'))
   return json({error:'Same-origin JSON only'},403);
  if(Number(request.headers.get('content-length')||0)>6200000)
   return json({error:'Request is too large'},413);
  if(Date.now()-lastCall<6000)return json({error:'Wait between analyses'},429);
  lastCall=Date.now();
  let args;try{args=await readBody(request);}catch{return json({error:'Invalid or oversized JSON'},400);}
  if(args?.consent!==true||!Array.isArray(args.images)||args.images.length<1||args.images.length>5)
   return json({error:'Explicit consent and one to five images required'},400);
  const base64=[];
  for(const item of args.images){
   const m=typeof item==='string'?/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(item):null;
   if(!m||m[1].length>1120000)return json({error:'Only compressed JPEG under ~800 KB allowed'},400);
   base64.push(m[1]);
  }
  const parts=[{text:PROMPT}].concat(base64.map(data=>({inline_data:{mime_type:'image/jpeg',data}})));
  const payload={contents:[{role:'user',parts}],
   generationConfig:{responseMimeType:'application/json',temperature:.1,maxOutputTokens:3200}};
  try{
   const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+MODEL+':generateContent',
    {method:'POST',headers:{'content-type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},
      body:JSON.stringify(payload)});
   if(!r.ok)return json({error:'Gemini rejected the request',googleStatus:r.status},502);
   const response=await r.json();
   const text=(response.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('');
   let ai;try{ai=JSON.parse(text);}catch{return json({error:'Gemini returned invalid JSON'},502);}
   try{return json(normalize(ai,base64.length));}
   catch{return json({error:'Gemini returned unsupported site geometry structure'},502);}
  }catch{return json({error:'Gemini analysis failed'},502);}
 }
};
