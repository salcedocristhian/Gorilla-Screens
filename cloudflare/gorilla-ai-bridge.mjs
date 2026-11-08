/* Gorilla Studio AI Vision pilot gateway — NEW separate Cloudflare Worker.
 * Does not edit or replace gorilla-ai-vision, GitHub main or the V17 static Worker.
 * No raw photos, tokens or Gemini responses are logged or persisted by this Worker.
 */
const LIMIT_BYTES=9*1024*1024;
const ALLOWED_TYPES=new Set(['image/jpeg','image/png','image/webp']);
const MODEL_PATTERN=/^[a-zA-Z0-9._-]{1,90}$/;
const FIXED_NOTE='Visual reference only; no measured dimensions, survey, structural or fabrication approval.';
function allowedOrigin(origin,env){
  if(!origin)return false;
  return String(env.STUDIO_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean).includes(origin);
}
function cors(origin){return {
  'Access-Control-Allow-Origin':origin,
  'Vary':'Origin',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Access-Control-Allow-Headers':'Authorization, Content-Type',
  'Access-Control-Max-Age':'600'
};}
function reply(data,status=200,origin){
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(origin)Object.assign(headers,cors(origin));
  return new Response(JSON.stringify(data),{status,headers});
}
async function secureEqual(a,b){
  const encoder=new TextEncoder();
  const hashes=await Promise.all([a,b].map(s=>crypto.subtle.digest('SHA-256',encoder.encode(s))));
  const x=new Uint8Array(hashes[0]),y=new Uint8Array(hashes[1]);
  let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];
  return diff===0;
}
function base64(bytes){
  let result=''; const block=0x8000;
  for(let i=0;i<bytes.length;i+=block) result+=String.fromCharCode(...bytes.subarray(i,i+block));
  return btoa(result);
}
function promptFor(count) {
  return 'You are Gorilla Screen Studio site documentation AI. '+count+
    ' photos are views of ONE property, ordered 1 through '+count+'. Identify ONLY visible exterior features. '+
    'Return a single valid JSON object with shape {"status":"draft-needs-human-review","findings":{'+
    '"visibleHouseFeatures":[],"fasciaAndAttachmentObservations":[],"patioAndObstacles":[],'+
    '"suggestedEnclosureDesign":[],"measurementsToVerify":[],"limitations":[],"siteGeometry":{'+
    '"photoCount":'+count+',"stories":null,"houseRoofType":"unknown","coveredPatio":null,'+
    '"poolPresent":null,"poolShape":"unknown","deckSurface":"unknown",'+
    '"candidateAttachmentWalls":[],"facadeOpenings":[],"upperAttachmentZones":[],"recommendedCaptureMissingViews":[],"contextConfidence":"low"}}}. '+
    'Identify EVERY distinct, clearly visible exterior opening on the SAME facade, especially arches in a covered front porch. '+
    'Do not double count the SAME arch seen from different camera angles. '+
    'Each facadeOpening is {id,type,description,evidencePhotoIndices,estimatedRelativePosition,confidence}, '+
    'with a stable unique id, type "arch" for masonry arches, 1-based image indices, left/center/right/unknown relative position, and high/medium/low confidence. '+
    'If masonry arches are clearly visible, facadeOpenings MUST NOT be empty. If uncertain, report uncertainty, never fabricate counts. '+
    'Record visible upper-level gaps and soffit/fascia interfaces in upperAttachmentZones as '+
    '{id,observation,evidencePhotoIndices,confidence,structuralSuitability:"unverified"}, never label gaps as approved anchors. '+
    'For existing covered porches suggest Porch Infill ONLY as a human-review candidate instead of an unnecessary new Mansard roof. '+
    'Never invent widths, radii, heights, engineering approval or an as-built 3D model. '+
    'Absence from photos is UNKNOWN, not false, including poolPresent=null if rear area unseen. '+
    'Attachments are candidates only; structuralSuitability is always "unverified". '+
    'Return only JSON, no code fences.';
}
function parseGemini(body){
  const text=(body?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('');
  if(!text) throw Error('Gemini no devolvió contenido.');
  const stripped=text.trim().replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/,'');
  let parsed;
  try {parsed=JSON.parse(stripped);}catch(_){throw Error('Gemini no devolvió JSON válido.');}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||!parsed.findings||
     typeof parsed.findings!=='object'||Array.isArray(parsed.findings))throw Error('La respuesta de Gemini no contiene findings.');
  return parsed;
}
export default {
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    if(path==='/health' && request.method==='GET'){
      return reply({status:'configured',ready:Boolean(env.GEMINI_API_KEY&&env.GORILLA_PILOT_TOKEN&&
        env.STUDIO_ALLOWED_ORIGINS&&env.AI_RATE_LIMIT),note:'No project images are stored here.'});
    }
    if(path!=='/api/analyze') return reply({error:'Not found'},404);
    const origin=request.headers.get('Origin');
    if(!allowedOrigin(origin,env)) return reply({error:'Origin not permitted'},403);
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers:cors(origin)});
    if(request.method!=='POST')return reply({error:'Method not allowed'},405,origin);
    if(!env.GEMINI_API_KEY||!env.GORILLA_PILOT_TOKEN||String(env.GORILLA_PILOT_TOKEN).length<32||
       !env.AI_RATE_LIMIT?.limit) return reply({error:'AI Vision is not configured securely.'},503,origin);
    const auth=request.headers.get('Authorization')||'';
    const incoming=auth.startsWith('Bearer ')?auth.slice(7):'';
    if(!incoming||!await secureEqual(incoming,String(env.GORILLA_PILOT_TOKEN)))
      return reply({error:'Acceso no autorizado. Verifica tu clave de AI Vision.'},401,origin);
    const allowed=await env.AI_RATE_LIMIT.limit({key:'gorilla-studio-pilot'});
    if(!allowed.success)return reply({error:'Límite de análisis alcanzado. Intenta más tarde.'},429,origin);
    const length=Number(request.headers.get('Content-Length')||0);
    if(length>LIMIT_BYTES+1024*50)return reply({error:'Las imágenes son demasiado grandes.'},413,origin);
    if(!/multipart\/form-data/i.test(request.headers.get('Content-Type')||''))
      return reply({error:'Expected multipart/form-data'},415,origin);
    let form;
    try {form=await request.formData();}catch(_){return reply({error:'No se pudieron leer las fotografías.'},400,origin);}
    const projectId=form.get('projectId');
    if(typeof projectId!=='string'||!projectId.trim()||projectId.length>180)
      return reply({error:'Identificador de proyecto inválido.'},400,origin);
    const photos=form.getAll('photos');
    if(photos.length<1||photos.length>5)return reply({error:'Se necesitan de 1 a 5 fotos de una propiedad.'},400,origin);
    let sum=0;
    const imageParts=[];
    for(const image of photos){
      if(!image||typeof image.arrayBuffer!=='function'||!ALLOWED_TYPES.has(image.type)||
         image.size<100||image.size>3*1024*1024)
        return reply({error:'Foto no válida o mayor de 3 MB.'},400,origin);
      sum+=image.size;
      if(sum>LIMIT_BYTES)return reply({error:'Las fotos superan 9 MB.'},413,origin);
      const bytes=new Uint8Array(await image.arrayBuffer());
      imageParts.push({inline_data:{mime_type:image.type,data:base64(bytes)}});
    }
    const model=String(env.GEMINI_MODEL||'gemini-3.5-flash-lite');
    if(!MODEL_PATTERN.test(model))return reply({error:'Modelo de Gemini mal configurado.'},503,origin);
    const body={contents:[{role:'user',parts:[{text:promptFor(photos.length)},...imageParts]}],
      generationConfig:{responseMimeType:'application/json',temperature:0.15}};
    let geminiResponse,geminiBody;
    try {
      geminiResponse=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},
        body:JSON.stringify(body),signal:AbortSignal.timeout(80000)
      });
      geminiBody=await geminiResponse.json();
    }catch(_){return reply({error:'No fue posible completar el análisis con Gemini.'},502,origin);}
    if(!geminiResponse.ok)
      return reply({error:geminiResponse.status===429?'Gemini está temporalmente limitado.':'Gemini rechazó la solicitud. Revisa el modelo y la clave privada.'},502,origin);
    let report;
    try{report=parseGemini(geminiBody);}catch(err){return reply({error:err.message},502,origin);}
    report.status='draft-needs-human-review';
    report.model=model;
    report.findings.siteGeometry=report.findings.siteGeometry&&typeof report.findings.siteGeometry==='object'?
      report.findings.siteGeometry:{};
    report.findings.siteGeometry.photoCount=photos.length;
    report.note=FIXED_NOTE;
    return reply({projectId,report},200,origin);
  }
};
