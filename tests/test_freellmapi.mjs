// FreeLLMAPI pilot QA uses a mocked router; no external providers or secrets.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';

const routerPort=Number(process.env.GORILLA_TEST_ROUTER_PORT||39631);
const pilotPort=Number(process.env.GORILLA_TEST_PILOT_PORT||39632);
const demoImage='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV3cAAAAASUVORK5CYII=';
const draft={
 schemaVersion:1,site:{houseRoofType:'flat',fasciaVisible:true,
  attachmentCandidates:[{imageIndex:1,location:'Rear roof fascia',reason:'Horizontal edge visible',confidence:'medium'}],
  obstacles:['Existing door'],visibleFeatures:['Three arches'],limitations:['Fascia height not measured']},
 enclosure:{proposedRoof:'flat',designNotes:['Consider under-roof porch enclosure'],
  doorPlacementComment:'Confirm threshold',drainageNotes:['Keep existing gutters']},
 measurementsToVerify:['Measure fascia height','Confirm slab'],warnings:['Do not infer measurements'],
 overallConfidence:'medium'
};
let lastProviderPayload=null;
const mock=createServer(async(req,res)=>{
 if(req.url==='/v1/chat/completions'){
  let data='';for await(const ch of req)data+=ch;
  lastProviderPayload=JSON.parse(data);
  assert.equal(req.headers.authorization,'Bearer test-unified-local-token');
  res.setHeader('Content-Type','application/json');
  res.setHeader('x-routed-via','mock-vision-provider');
  res.end(JSON.stringify({id:'mock-response',model:'mock-vision',
   usage:{prompt_tokens:111,completion_tokens:222},
   choices:[{message:{role:'assistant',content:JSON.stringify(draft)}}]}));
  return;
 }
 res.writeHead(404);res.end();
});
mock.listen(routerPort,'127.0.0.1');await once(mock,'listening');
const child=spawn(process.execPath,['experiments/freellmapi/server.mjs'],{
 cwd:new URL('../',import.meta.url).pathname,
 env:{...process.env,GORILLA_AI_PORT:String(pilotPort),
  FREELLMAPI_API_KEY:'test-unified-local-token',FREELLMAPI_MODEL:'auto',
  FREELLMAPI_BASE_URL:'http://127.0.0.1:'+routerPort+'/v1'},
 stdio:['ignore','pipe','pipe']
});
let log='';
child.stdout.on('data',c=>log+=c.toString());
child.stderr.on('data',c=>log+=c.toString());
const base='http://127.0.0.1:'+pilotPort;
async function post(payload,origin=base){
 return fetch(base+'/api/ai/analyze',{method:'POST',
  headers:{'Content-Type':'application/json',Origin:origin},
  body:JSON.stringify(payload)});
}
try{
 let alive=false;
 for(let i=0;i<65;i++){
  if(child.exitCode!==null)throw Error('Pilot crashed: '+log);
  try{const r=await fetch(base+'/api/ai/health');if(r.ok){alive=true;break}}catch{}
  await delay(100);
 }
 assert.ok(alive,'Local pilot server failed to boot: '+log);
 const health=await (await fetch(base+'/api/ai/health')).json();
 assert.equal(health.configured,true);
 assert.equal(health.localhostOnly,true);
 assert.ok(!JSON.stringify(health).includes('test-unified-local-token'));
 let r=await fetch(base+'/experiments/freellmapi/index.html');
 assert.equal(r.status,200);
 assert.match(await r.text(),/AI Site Analysis/);
 r=await fetch(base+'/demo/01-frente-actual.jpg');
 assert.equal(r.status,200);
 r=await fetch(base+'/README.md');
 assert.equal(r.status,404,'Do not serve unrelated source files');
 r=await post({images:[demoImage],agreedToShare:false});
 assert.equal(r.status,400,'Photo consent required');
 assert.equal(lastProviderPayload,null);
 r=await post({images:['data:text/html;base64,SGk='],agreedToShare:true});
 assert.equal(r.status,400,'Reject malicious upload type');
 r=await post({images:[demoImage],agreedToShare:true},'https://evil.example.com');
 assert.equal(r.status,403,'Reject cross-site request');
 r=await post({images:[demoImage],agreedToShare:true,
  dimensions:{width:16,depth:6,height:9.17}});
 assert.equal(r.status,200,'Mock vision result should be accepted');
 const body=await r.json();
 assert.equal(body.draft.site.houseRoofType,'flat');
 assert.equal(body.draft.enclosure.proposedRoof,'flat');
 assert.equal(body.draft.measurementsToVerify.length,2);
 assert.equal(body.meta.servedModel,'mock-vision');
 assert.equal(body.meta.usage.inputTokens,111);
 assert.equal(lastProviderPayload.model,'auto');
 assert.equal(lastProviderPayload.messages[1].content[1].type,'text');
 assert.equal(lastProviderPayload.messages[1].content[2].type,'image_url');
 assert.ok(!JSON.stringify(body).includes('test-unified-local-token'));
 assert.ok(lastProviderPayload.messages[0].content.includes('NEVER claim photo-derived dimensions'));
 console.log('PASS Local FreeLLMAPI pilot: loopback, photo consent, origin validation, media validation, mock provider, structured JSON and secret isolation');
}finally{
 child.kill('SIGTERM');mock.close();
}
