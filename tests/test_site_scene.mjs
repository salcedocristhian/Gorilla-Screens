import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import '../js/site-scene-contract.js';
import bridge from '../cloudflare/gorilla-ai-bridge.mjs';
const C=globalThis.GSSSiteSceneContract;
const raw={schemaVersion:'site-scene-v1',units:'relative',nodes:[{id:'facade',type:'wall',label:'Three arches',position:[0,0,0],size:[1,.5,.04],rotationY:0,evidencePhotoIndices:[1,2],confidence:'medium',openings:[-.32,0,.32].map((x,i)=>({id:'arch-'+i,type:'arch',x,bottom:0,width:.24,height:.4,archRise:.1}))}],unknownConditions:['Rear facade unseen']};
const scene=C.normalize(raw,'a',['a1','a2']);assert.equal(scene.nodes[0].openings.length,3);assert.equal(scene.fieldVerified,false);
assert.equal(C.belongsTo(scene,'b',[{id:'a1',projectId:'a'},{id:'a2',projectId:'a'}]),false);
assert.equal(C.belongsTo(scene,'a',[{id:'a1',projectId:'a'}]),false);
const second=C.normalize({...raw,nodes:[{...raw.nodes[0],id:'pool-wall',openings:[],size:[1,.25,.02]}]},'b',['b1','b2']);
assert.equal(second.nodes[0].openings.length,0);assert.equal(scene.nodes[0].openings.length,3);
for(const mutate of [r=>r.units='feet',r=>r.nodes[0].position[0]=Infinity,r=>r.nodes[0].size[0]=0,r=>r.nodes[0].evidencePhotoIndices=[3],r=>r.nodes[0].type='script',r=>r.nodes[0].openings[0].width=3,r=>r.nodes[0].openings[1].x=-.32,r=>r.nodes.push(r.nodes[0])]){
 const invalid=structuredClone(raw);mutate(invalid);assert.throws(()=>C.normalize(invalid,'a',['a1','a2']));
}
assert.equal(C.normalize({...raw,fieldVerified:true,engineeringApproved:true},'a',['a1','a2']).engineeringApproved,false);
const origin='https://preview.example',token='x'.repeat(40),env={GEMINI_API_KEY:'server-secret',GORILLA_PILOT_TOKEN:token,STUDIO_ALLOWED_ORIGINS:origin,AI_RATE_LIMIT:{limit:async()=>({success:true})}};
const form=()=>{const f=new FormData();f.append('task','reconstruct');f.append('projectId','a');for(let i=0;i<2;i++)f.append('photos',new Blob(['x'.repeat(200)],{type:'image/jpeg'}),'photo.jpg');return f;};
const request=auth=>new Request('https://worker.example/api/analyze',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+auth},body:form()});
const original=globalThis.fetch;let returned=raw,calls=0;
globalThis.fetch=async(url,opts)=>{calls++;const sent=JSON.parse(opts.body);assert.match(sent.contents[0].parts[0].text,/relative coordinates/);return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(returned)}]}}]})};};
try{
 assert.equal((await bridge.fetch(request('bad'),env)).status,401);assert.equal(calls,0);
 const res=await bridge.fetch(request(token),env);assert.equal(res.status,200);const payload=await res.json();assert.equal(payload.scene.projectId,'a');assert.equal(payload.scene.nodes[0].openings.length,3);
 returned={...raw,units:'meters'};assert.equal((await bridge.fetch(request(token),env)).status,502);
}finally{globalThis.fetch=original;}
const context={window:{GSSSiteSceneContract:C},URL,Blob,FormData,fetch:original};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../js/vision-api.js',import.meta.url),'utf8'),context);
const photos=['a1','a2'].map(id=>({id,projectId:'a',blob:new Blob(['x'.repeat(200)],{type:'image/jpeg'})}));
const api=context.window.GSSVisionAPI;
const result=await api.reconstruct({projectId:'a',photos,token,fetchImpl:async(url,opts)=>{assert.equal(opts.body.get('task'),'reconstruct');return {ok:true,json:async()=>({projectId:'a',scene:raw})};}});
assert.deepEqual(result.evidencePhotoIds,['a1','a2']);
await assert.rejects(api.reconstruct({projectId:'a',photos,token,fetchImpl:async()=>({ok:true,json:async()=>({projectId:'a',report:{findings:{}}})})}),/aún no ofrece/);
await assert.rejects(api.reconstruct({projectId:'a',photos,token,fetchImpl:async()=>({ok:true,json:async()=>({projectId:'b',scene:raw})})}),/otro proyecto/);
console.log('PASS scene: two unrelated fixtures, arch bounds, evidence, stale photos, forged approvals, gateway auth, invalid output, old Worker and client isolation');
