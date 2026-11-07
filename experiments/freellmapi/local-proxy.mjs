// Local-only experimental proxy. Node 20+. No npm dependencies.
import http from 'node:http';
const host='127.0.0.1',port=8789;
const upstream=process.env.GORILLA_AI_UPSTREAM;
const model=process.env.GORILLA_AI_MODEL;
const token=process.env.GORILLA_AI_TOKEN;
if(!upstream||!model||!token||token.length<24)throw Error('Set GORILLA_AI_UPSTREAM, GORILLA_AI_MODEL and a 24+ character GORILLA_AI_TOKEN');
const target=new URL(upstream);
if(!['127.0.0.1','localhost','::1'].includes(target.hostname)||target.protocol!=='http:')throw Error('Only loopback HTTP upstream is allowed in this local pilot');
const prompt='Analyze the provided site photos for screen enclosure design context. Respond ONLY with JSON: {observations:[{feature,description,photoIndex,confidence}],possibleFasciaLocations:[],openings:[],obstacles:[],measurementsToVerify:[],limitations:[]}. Never invent verified dimensions, structural capacity, survey boundaries, or permit approval.';
const server=http.createServer(async(req,res)=>{
 const send=(code,obj)=>{res.writeHead(code,{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'http://127.0.0.1:8789','x-content-type-options':'nosniff'});res.end(JSON.stringify(obj));};
 if(req.method!=='POST'||req.url!=='/analyze')return send(404,{error:'Not found'});
 if(req.headers.authorization!=='Bearer '+token)return send(401,{error:'Unauthorized'});
 try{
  let bytes=0,parts=[];
  for await(const part of req){bytes+=part.length;if(bytes>8*1024*1024)return send(413,{error:'Request too large'});parts.push(part);}
  const input=JSON.parse(Buffer.concat(parts).toString('utf8'));
  if(!Array.isArray(input.images)||input.images.length<1||input.images.length>5||!input.images.every(x=>typeof x==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x)))return send(400,{error:'Provide 1–5 JPEG/PNG/WebP data URLs'});
  const response=await fetch(target,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model,temperature:0.1,max_tokens:1400,messages:[{role:'user',content:[{type:'text',text:prompt},...input.images.map(url=>({type:'image_url',image_url:{url}}))]}]}),signal:AbortSignal.timeout(60000)});
  if(!response.ok)return send(502,{error:'Local model provider failed',status:response.status});
  const data=await response.json();const raw=data.choices?.[0]?.message?.content;
  if(typeof raw!=='string'||raw.length>18000)return send(502,{error:'Unexpected model response'});
  // Draft text only: no code execution, geometry mutation or trusted approval.
  return send(200,{status:'DRAFT_REQUIRES_REVIEW',model,raw:raw.slice(0,18000)});
 }catch(e){return send(500,{error:'Analysis failed',detail:String(e.message||e).slice(0,200)});}
});
server.listen(port,host,()=>console.log('Gorilla experimental local vision proxy on http://'+host+':'+port));
