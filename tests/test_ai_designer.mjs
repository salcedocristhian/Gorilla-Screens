import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{},Date,Math,JSON,Set};
vm.createContext(ctx);
for(const name of ['ai-vision','ai-designer']){
 vm.runInContext(fs.readFileSync(new URL('../js/'+name+'.js',import.meta.url),'utf8'),ctx);
}
const AD=ctx.window.GSSAiDesigner,Vision=ctx.window.GSSVision;
const p={id:'property-a',kind:'field',fieldType:'porch',quote:{rate:0,extras:[]},openings:[],studioV17:{width:0,depth:0,height:0,verified:false}};
const photos=[1,2,3,4].map(i=>({id:'ph'+i,projectId:'property-a',cat:i===1?'frente':'site'}));
p.aiVision=Vision.normalize({findings:{visibleHouseFeatures:['Covered porch with three stucco arches'],siteGeometry:{
 photoCount:4,coveredPatio:true,houseRoofType:'gable',facadeOpenings:[
 {id:'arch-one',type:'arch',evidencePhotoIndices:[1,2]},
 {id:'arch-two',type:'arch',evidencePhotoIndices:[1,3]},
 {id:'arch-three',type:'arch',evidencePhotoIndices:[1,4]}],
 candidateAttachmentWalls:[],upperAttachmentZones:[],recommendedCaptureMissingViews:['Back patio view']
}}},p.id,photos.map(ph=>ph.id));
const upload=[{id:'a',projectId:p.id,cat:'frente'},
{id:'b',projectId:p.id,cat:'west'},{id:'c',projectId:p.id,cat:'east'},
{id:'d',projectId:p.id,cat:'detalles'},{id:'x',projectId:p.id,cat:'porche'},
{id:'z',projectId:p.id,cat:'aerea'},{id:'foreign',projectId:'property-b',cat:'aerea'}];
assert.deepEqual([...AD.recommendedPhotos(p.id,upload)],['a','b','c','d','z'],
 "Use the four site views plus this project's aerial, never the other house");
const ev=AD.evidence(p,photos);
assert.equal(ev.valid,true);
assert.equal(ev.archCount,3);
assert.equal(AD.next(p,photos).id,'kind');
AD.answer(p,photos,'kind','porch');
const q=AD.next(p,photos);
assert.match(q.title,/3 arco/);
assert.equal(q.id,'scope');
assert.throws(()=>AD.answer(p,photos,'finish','bronze'),/fuera de secuencia/);
assert.throws(()=>AD.answer(p,photos,'scope','new_mansard'),/no válida/);
AD.answer(p,photos,'scope','all');
assert.equal(AD.next(p,photos).id,'top');
AD.answer(p,photos,'top','yes');
AD.answer(p,photos,'door','center');
AD.answer(p,photos,'finish','bronze');
AD.answer(p,photos,'mesh','standard');
AD.answer(p,photos,'scale','later');
const plan=AD.summary(p,photos);
assert.equal(plan.complete,true);
assert.equal(plan.product.kind,'porch');
assert.equal(plan.product.roof,null,'Covered porch never gets an invented Mansard roof');
assert.equal(plan.product.upperScreen,'yes');
assert.equal(plan.houseContext.role,'existing-context-only');
assert.equal(plan.product.role,'proposed-screen-enclosure');
assert.equal(plan.houseContext.facadeArches,3);
assert.equal(plan.houseContext.reconstructionStatus,'needs-scene-model','Must not claim accurate house reconstruction');
assert.equal(plan.measurements[0].valueFt,null);
assert.equal(plan.measurements[0].status,'needs-reference-or-field-measurement');
assert.equal(p.studioV17.verified,false);
assert.deepEqual(p.openings,[],'AI conversation cannot fabricate opening sizes');
assert.equal(p.quote.rate,0,'Conversation cannot set prices');
AD.approveIntent(p,photos);
assert.equal(p.aiDesigner.reviewed,true);
assert.equal(p.frameColor,'bronze','Confirmed choice reaches existing project settings');
assert.equal(p.studioV17.finish,'bronze');
assert.equal(p.studioV17.width,0,'No invented enclosure dimensions');
assert.equal(p.studioV17.verified,false,'Selecting materials is not a field measurement');
assert.equal(p.studioV17.roof,undefined,'Porch does not acquire an invented roof');

AD.back(p,photos);
assert.equal(AD.next(p,photos).id,'scale');
const foreign={id:'property-b',kind:'field',fieldType:'pool',openings:[]},foreignPhotos=[{id:'ph1',projectId:'property-b'}];
assert.equal(AD.evidence(foreign,foreignPhotos).valid,false);
assert.equal(AD.next(foreign,foreignPhotos).id,'kind');
assert.equal(AD.get(foreign,foreignPhotos).projectId,'property-b');
assert.notEqual(AD.get(foreign,foreignPhotos).projectId,AD.get(p,photos).projectId);
const old=AD.get(p,photos);
const changed=photos.slice(1);
assert.equal(AD.evidence(p,changed).valid,false);
assert.equal(AD.next(p,changed).id,'kind','Changing evidence invalidates design interview');
assert.equal(AD.get(p,changed).answers.kind,undefined);
assert.notEqual(AD.get(p,changed),old);
const n=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.ok(n.includes('disenador: tabDisenador'));
assert.ok(html.indexOf('js/ai-designer.js')<html.indexOf('js/app.js'));
assert.ok(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8').includes('ai-designer.js'));
console.log('PASS AI Designer: 3-arch evidence, conditional product questions, project isolation, no invented geometry or pricing');
