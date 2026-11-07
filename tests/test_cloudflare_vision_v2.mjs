import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../cloudflare/gorilla-vision-multiphoto-v2.js',import.meta.url),'utf8');
function instance(){
 let calls=0;
 const fake=async(url,options={})=>{
  if(String(url).includes(':generateContent')){
   calls++;
   const sent=JSON.parse(options.body);
   assert.equal(sent.contents[0].parts.filter(p=>p.inline_data).length,5);
   assert.equal(options.headers['x-goog-api-key'],'private-test-key');
   const result={findings:{visibleHouseFeatures:['Covered patio','Roof edge'],
      fasciaAndAttachmentObservations:['Connection partially obscured'],
      patioAndObstacles:['Obstruction near door'],
      suggestedEnclosureDesign:['Verify egress path'],
      measurementsToVerify:['Confirm fascia elevation'],limitations:['No measured scale']},
    siteGeometry:{
      stories:2,coveredPatio:true,poolPresent:true,spaPresent:true,balconyPresent:true,
      poolShape:'freeform',deckSurface:'pavers',houseRoofType:'flat',contextConfidence:'medium',
      candidateAttachmentWalls:[{id:'rear-stucco',level:1,visibleMaterial:'stucco',
        observation:'covered patio wall visible',confidence:'medium',
        evidencePhotoIndices:[1,5,8],structuralSuitability:'engineer-approved'}],
      upperAttachmentZones:[{id:'upper-fascia',level:2,description:'Balcony edge visible',
        confidence:'low',evidencePhotoIndices:[4],structuralSuitability:'safe'}],
      recommendedCaptureMissingViews:['Roof-from-above reference'],
      facadeOpenings:[
      {kind:'door',x:.3,y:.05,width:.18,height:.64,confidence:'medium',evidence:'Frontal wall image'},
      {kind:'door',x:.9,y:.9,width:.5,height:.5,evidence:'invalid box'}]}};
   return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(result)}]}}]}),
    {status:200,headers:{'content-type':'application/json'}});
  }
  return new Response(JSON.stringify({models:[{name:'one'}]}),{status:200,
   headers:{'content-type':'application/json'}});
 };
 const obj={Response,Request,URL,TextDecoder,Date,JSON,Number,Math,fetch:fake};
 vm.runInNewContext(source.replace(/export default\s*\{/,'globalThis.worker = {'),obj);
 return {handler:obj.worker,calls:()=>calls};
}
const base='https://gorilla-ai-vision.example.workers.dev';
const image='data:image/jpeg;base64,/9j/';
const payload={consent:true,images:Array(5).fill(image)};
const req=(origin,body)=>new Request(base+'/api/reconstruct',{
 method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
const first=instance();
let r=await first.handler.fetch(new Request(base+'/'),{GEMINI_API_KEY:'private-test-key'});
assert.equal(r.status,200);
r=await first.handler.fetch(new Request(base+'/check-gemini'),{GEMINI_API_KEY:'private-test-key'});
assert.equal((await r.json()).connected,true);
r=await first.handler.fetch(req('https://evil.example.org',payload),{GEMINI_API_KEY:'private-test-key'});
assert.equal(r.status,403,'No external browser origin can call private reconstruction endpoint');
r=await first.handler.fetch(req(base,payload),{GEMINI_API_KEY:'private-test-key'});
assert.equal(r.status,200);
const result=await r.json();
assert.equal(result.findings.siteGeometry.photoCount,5);
assert.equal(result.findings.siteGeometry.stories,2);
assert.equal(result.findings.siteGeometry.poolPresent,true);
assert.equal(result.findings.siteGeometry.spaPresent,true);
assert.equal(result.findings.siteGeometry.balconyPresent,true);
assert.equal(result.findings.siteGeometry.poolShape,'freeform');
assert.equal(result.findings.siteGeometry.deckSurface,'pavers');
assert.equal(result.findings.siteGeometry.contextConfidence,'medium');
assert.equal(result.findings.siteGeometry.candidateAttachmentWalls[0].structuralSuitability,
 'unverified','AI must not self-certify structural suitability');
assert.equal(result.findings.siteGeometry.candidateAttachmentWalls[0].evidencePhotoIndices.join(','),'1,5');
assert.equal(result.findings.siteGeometry.upperAttachmentZones[0].structuralSuitability,'unverified');
assert.equal(result.findings.siteGeometry.recommendedCaptureMissingViews.length,1);

assert.equal(result.findings.siteGeometry.facadeOpenings.length,1,'Discard invalid geometry');
assert.equal(result.model,'gemini-3.5-flash-lite');
assert.ok(!JSON.stringify(result).includes('private-test-key'),'Never leak Gemini secret');
assert.equal(first.calls(),1);
r=await first.handler.fetch(req(base,payload),{GEMINI_API_KEY:'private-test-key'});
assert.equal(r.status,429,'Isolate cooldown blocks immediate repeat calls');
const second=instance();
r=await second.handler.fetch(req(base,{...payload,consent:false}),{GEMINI_API_KEY:'private-test-key'});
assert.equal(r.status,400,'Explicit photo sharing permission required');
const third=instance();
r=await third.handler.fetch(req(base,{consent:true,images:Array(6).fill(image)}),{GEMINI_API_KEY:'private-test-key'});
assert.equal(r.status,400,'Never allow more than five photos');
console.log('PASS: Worker V2 same-origin, five-image schema, no secret leaks, malformed openings excluded, consent, limits');
