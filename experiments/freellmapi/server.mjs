// Gorilla x FreeLLMAPI: private local experiment, not a public API.
// Launch with FREELLMAPI_API_KEY set in the environment, NEVER in GitHub.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'../..');
const host='127.0.0.1',port=Number(process.env.GORILLA_AI_PORT||8788);
const routerUrl=(process.env.FREELLMAPI_BASE_URL||'http://127.0.0.1:3001/v1').replace(/\/$/,'');
const apiKey=process.env.FREELLMAPI_API_KEY||'';
const model=process.env.FREELLMAPI_MODEL||'auto';
const MAX_BODY=7_800_000,MAX_PER_IMAGE=1_050_000;
const allowed=new Map([
 ['/experiments/freellmapi/index.html',['experiments/freellmapi/index.html','text/html; charset=utf-8']],
 ['/experiments/freellmapi/pilot.js',['experiments/freellmapi/pilot.js','text/javascript; charset=utf-8']],
 ['/experiments/freellmapi/pilot.css',['experiments/freellmapi/pilot.css','text/css; charset=utf-8']],
 ['/js/v17-engine.js',['js/v17-engine.js','text/javascript; charset=utf-8']],
 ['/js/v17-preview.js',['js/v17-preview.js','text/javascript; charset=utf-8']],
 ...['01-frente-actual.jpg','02-render-propuesto.jpg','03-porche-puerta-ventana.jpg',
    '04-porche-arcos-a.jpg','05-porche-arcos-b.jpg'].map(name=>
      ['/demo/'+name,['demo/'+name,'image/jpeg']])
]);
const PROMPT=[
 'You are a visual SITE OBSERVATION assistant for a Florida screen-enclosure designer.',
 'The existing HOUSE is a reference only. The deliverable is a SCREEN ENCLOSURE built on a real patio.',
 'Analyze the attached photos. Return EXACTLY ONE JSON object, no extra text or Markdown:',
 '{"schemaVersion":1,"site":{"houseRoofType":"flat|gable|hip|unknown","fasciaVisible":true,',
 '"attachmentCandidates":[{"imageIndex":1,"location":"...","reason":"...","confidence":"low|medium|high"}],',
 '"obstacles":["..."],"visibleFeatures":["..."],"limitations":["..."]},',
 '"enclosure":{"proposedRoof":"flat|mansard|gable|irp|mixed|unknown","designNotes":["..."],',
 '"doorPlacementComment":"...","drainageNotes":["..."]},',
 '"measurementsToVerify":["..."],"warnings":["..."],"overallConfidence":"low|medium|high"}',
 'NEVER claim photo-derived dimensions, site survey, fascia height, setbacks, exact coordinates, wind engineering,',
 'material quantity or compliant attachment. Only describe visible evidence; mark uncertainties.',
 'Do not label a flat porch as a Mansard pool cage. Verify fascia, footing, slab, and egress in field.',
 'No construction approvals, purchasing, modification of saved models, emailing, or publishing.'
].join('\n');
function send(res,status,obj){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
 res.end(JSON.stringify(obj));
}
function isLoopback(addr){return ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(addr)}
function checkOrigin(req){
 const origin=req.headers.origin;if(!origin)return true;
 try{const u=new URL(origin);return ['127.0.0.1','localhost'].includes(u.hostname)&&Number(u.port||80)===port;}
 catch{return false}
}
function validateImage(str){
 if(typeof str!=='string'||str.length>MAX_PER_IMAGE*1.38+70)return false;
 const m=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(str);
 return !!m&&Buffer.byteLength(m[2],'base64')<=MAX_PER_IMAGE;
}
const clip=(v,max=300)=>typeof v==='string'?v.slice(0,max):'';
const list=(v,max=15)=>Array.isArray(v)?v.slice(0,max).map(x=>clip(x)).filter(Boolean):[];
const choice=(v,options)=>options.includes(v)?v:'unknown';
function normalize(obj){
 if(!obj||!obj.site||!obj.enclosure||!Array.isArray(obj.measurementsToVerify))
  throw Error('Invalid visual analysis JSON structure.');
 const a=obj.site,b=obj.enclosure;
 return {schemaVersion:1,
  site:{
   houseRoofType:choice(a.houseRoofType,['flat','gable','hip','unknown']),
   fasciaVisible:a.fasciaVisible===true,
   attachmentCandidates:Array.isArray(a.attachmentCandidates)?a.attachmentCandidates.slice(0,8).map(c=>({
    imageIndex:Number.isInteger(c?.imageIndex)?Math.max(1,Math.min(5,c.imageIndex)):null,
    location:clip(c?.location),reason:clip(c?.reason),
    confidence:choice(c?.confidence,['low','medium','high'])})):[],
   obstacles:list(a.obstacles),visibleFeatures:list(a.visibleFeatures),limitations:list(a.limitations)
  },
  enclosure:{
   proposedRoof:choice(b.proposedRoof,['flat','mansard','gable','irp','mixed','unknown']),
   designNotes:list(b.designNotes),doorPlacementComment:clip(b.doorPlacementComment),drainageNotes:list(b.drainageNotes)
  },
  measurementsToVerify:list(obj.measurementsToVerify,20),
  warnings:list(obj.warnings),
  overallConfidence:choice(obj.overallConfidence,['low','medium','high'])
 };
}
function parseContent(v){
 if(Array.isArray(v))v=v.map(x=>x?.text||'').join('');
 if(typeof v!=='string')throw Error('Empty model response');
 const a=v.indexOf('{'),b=v.lastIndexOf('}');
 if(a<0||b<a)throw Error('Missing structured result');
 return JSON.parse(v.slice(a,b+1));
}
async function readJSON(req){
 let size=0;const chunks=[];
 for await(const chunk of req){
  size+=chunk.length;
  if(size>MAX_BODY)throw Object.assign(Error('Images are too large'),{status:413});
  chunks.push(chunk);
 }
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
 catch{throw Object.assign(Error('Invalid JSON'),{status:400})}
}
async function analyze(payload){
 if(!apiKey)throw Object.assign(Error('Set FREELLMAPI_API_KEY in the private local environment.'),{status:503});
 if(!Array.isArray(payload?.images)||payload.images.length<1||payload.images.length>5||
   !payload.images.every(validateImage))
  throw Object.assign(Error('Provide 1–5 compressed JPEG/PNG/WebP images, maximum 1 MB each.'),{status:400});
 if(payload.agreedToShare!==true)
  throw Object.assign(Error('Explicit photo-sharing consent is required.'),{status:400});
 const measures=payload.dimensions||{};
 const sent={width:Number(measures.width)>0?Number(measures.width):null,
  depth:Number(measures.depth)>0?Number(measures.depth):null,
  height:Number(measures.height)>0?Number(measures.height):null};
 const content=[{type:'text',text:'Project: screen enclosure. User-entered draft dimensions in ft (NOT field-verified): '+JSON.stringify(sent)},
  ...payload.images.flatMap((src,i)=>[
    {type:'text',text:'PROPERTY IMAGE '+(i+1)},
    {type:'image_url',image_url:{url:src}}
  ])];
 const u=new URL(routerUrl+'/chat/completions');
 if(!['http:','https:'].includes(u.protocol))throw Object.assign(Error('Invalid local router URL'),{status:500});
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),65000);
 let resp;
 try{
  resp=await fetch(u,{method:'POST',signal:controller.signal,
   headers:{'Content-Type':'application/json',Authorization:'Bearer '+apiKey},
   body:JSON.stringify({model,stream:false,temperature:0.1,max_tokens:1900,
    messages:[{role:'system',content:PROMPT},{role:'user',content}]})});
 }catch(e){throw Object.assign(Error(e.name==='AbortError'?'Router request timed out':'FreeLLMAPI router unavailable.'),{status:502})}
 finally{clearTimeout(timer)}
 if(!resp.ok)throw Object.assign(Error('FreeLLMAPI returned HTTP '+resp.status+'; check connected vision models and quotas.'),{status:502});
 let response;
 try{response=await resp.json()}
 catch{throw Object.assign(Error('Invalid router response'),{status:502})}
 let draft;
 try{draft=normalize(parseContent(response?.choices?.[0]?.message?.content))}
 catch{throw Object.assign(Error('Vision model returned invalid geometry observations. Try another connected vision provider.'),{status:502})}
 return {draft,meta:{
  requestedModel:model,servedModel:clip(response?.model,120),
  routedVia:clip(resp.headers.get('x-routed-via'),120),
  usage:{inputTokens:Number(response?.usage?.prompt_tokens)||0,outputTokens:Number(response?.usage?.completion_tokens)||0}
 }};
}
export function startServer(){
 const server=createServer(async(req,res)=>{
  if(!isLoopback(req.socket.remoteAddress)){send(res,403,{error:'Localhost only'});return}
  const requestedHost=String(req.headers.host||'');
  if(!['127.0.0.1:'+port,'localhost:'+port].includes(requestedHost)){
   send(res,403,{error:'Invalid local Host header'});return;
  }
  const pathname=new URL(req.url||'/', 'http://127.0.0.1').pathname;
  if(req.method==='GET'&&pathname==='/api/ai/health'){
   send(res,200,{status:'experimental',configured:!!apiKey,model,
    routerOrigin:(()=>{try{return new URL(routerUrl).origin}catch{return 'invalid'}})(),
    localhostOnly:true});return;
  }
  if(req.method==='POST'&&pathname==='/api/ai/analyze'){
   if(!checkOrigin(req)){send(res,403,{error:'Cross-origin requests forbidden'});return}
   if(!String(req.headers['content-type']||'').startsWith('application/json')){
    send(res,415,{error:'JSON required'});return
   }
   try{send(res,200,await analyze(await readJSON(req)))}
   catch(e){send(res,e.status||500,{error:e.message||'Analysis failed'})}
   return;
  }
  if(req.method==='GET'&&(pathname==='/'||pathname==='/experiments/freellmapi')){
   res.writeHead(302,{Location:'/experiments/freellmapi/index.html'});res.end();return
  }
  if(req.method==='GET'&&allowed.has(pathname)){
   const [rel,mime]=allowed.get(pathname);
   try{
    const bytes=await readFile(path.resolve(root,rel));
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store',
     'X-Content-Type-Options':'nosniff',
     'Content-Security-Policy':"default-src 'self'; connect-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; worker-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"});
    res.end(bytes);
   }catch{send(res,404,{error:'File unavailable'})}
   return;
  }
  send(res,404,{error:'Not found'});
 });
 server.listen(port,host,()=>console.log('Gorilla AI pilot (local only): http://'+host+':'+port+'/experiments/freellmapi/index.html'));
 return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url)))startServer();
