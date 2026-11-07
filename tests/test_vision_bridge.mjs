import assert from 'node:assert/strict';
import bridge from '../cloudflare/gorilla-ai-bridge.mjs';
const origin='https://previewfixed.salcedo-cristhian-2020.workers.dev';
const env={
  GEMINI_API_KEY:'private-gemini-api-key',
  GEMINI_MODEL:'gemini-3.5-flash-lite',
  GORILLA_PILOT_TOKEN:'P'.repeat(48),
  STUDIO_ALLOWED_ORIGINS:origin,
  AI_RATE_LIMIT:{limit:async()=>({success:true})}
};
const endpoint='https://gorilla-studio-ai-bridge.workers.dev/api/analyze';
let calls=0;
const original=globalThis.fetch;
globalThis.fetch=async(url,opts)=>{
  calls++;
  assert.match(url,/generativelanguage.googleapis.com/);
  assert.equal(opts.headers['x-goog-api-key'],env.GEMINI_API_KEY);
  assert.equal(opts.body.includes(env.GORILLA_PILOT_TOKEN),false);
  const sent=JSON.parse(opts.body);
  assert.equal(sent.contents[0].parts.length,3); // prompt + two photos
  assert.equal(sent.contents[0].parts.filter(p=>p.inline_data).length,2);
  return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({
    status:'draft-needs-human-review',findings:{visibleHouseFeatures:['2 arches'],
      siteGeometry:{photoCount:2,facadeOpenings:[]}}
  })}]}}]})};
};
const file=new Blob(['jpeg image'.repeat(50)],{type:'image/jpeg'});
function req(opts={}){
  const body=new FormData();body.set('projectId','house-a');
  body.append('photos',file,'1.jpg');body.append('photos',file,'2.jpg');
  return new Request(endpoint,{method:'POST',headers:{Origin:opts.origin||origin,
    Authorization:opts.auth===undefined?'Bearer '+'P'.repeat(48):opts.auth},body});
}
try{
  const forbidden=await bridge.fetch(req({origin:'https://attacker.example'}),env);
  assert.equal(forbidden.status,403);
  const unauthorized=await bridge.fetch(req({auth:'Bearer wrong'}),env);
  assert.equal(unauthorized.status,401);
  assert.equal(calls,0);
  const preflight=await bridge.fetch(new Request(endpoint,{method:'OPTIONS',headers:{Origin:origin}}),env);
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);
  const ok=await bridge.fetch(req(),env);
  assert.equal(ok.status,200);
  const data=await ok.json();
  assert.equal(data.projectId,'house-a');
  assert.equal(data.report.status,'draft-needs-human-review');
  assert.equal(data.report.findings.siteGeometry.photoCount,2);
  assert.equal(calls,1);
  const limited=await bridge.fetch(req(),{...env,AI_RATE_LIMIT:{limit:async()=>({success:false})}});
  assert.equal(limited.status,429);
  const unconfigured=await bridge.fetch(req(),{...env,AI_RATE_LIMIT:null});
  assert.equal(unconfigured.status,503);
  assert.equal(calls,1);
  console.log('PASS isolated Gemini bridge: origin, authorization, rate limits, image count, no exposed key');
}finally{globalThis.fetch=original;}
