import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const env={window:{}, Date, JSON, Set, Array, Number, Error};
vm.createContext(env);
vm.runInContext(fs.readFileSync(new URL('../js/ai-vision.js',import.meta.url),'utf8'),env);
const V=env.window.GSSVision;
const sample={status:'draft-needs-human-review',model:'gemini-3.5-flash-lite',findings:{
  visibleHouseFeatures:['Stucco','Three masonry arches'],
  fasciaAndAttachmentObservations:['Fascia visible, attachment unverified'],
  measurementsToVerify:['Three arch radii and slab'],
  limitations:['Only front views; rear pool unknown'],
  siteGeometry:{photoCount:3,stories:1,houseRoofType:'gable',poolPresent:false,facadeOpenings:[]}
}};
const a=V.normalize(JSON.stringify(sample),'house-arches',['a1','a2','a3']);
const b=V.normalize({...sample,findings:{...sample.findings,siteGeometry:{photoCount:5,poolPresent:true}}},'house-pool',['b1','b2','b3','b4','b5']);
assert.equal(a.projectId,'house-arches');
assert.equal(b.projectId,'house-pool');
assert.equal(a.status,'draft-needs-human-review');
assert.equal(a.findings.siteGeometry.poolStatus,'not-confirmed');
assert.equal(b.findings.siteGeometry.poolStatus,'observed-in-images');
assert.equal(a.reviewed,false);
assert.equal(a.findings.siteGeometry.facadeOpenings.length,0);
assert.equal(a.warnings.some(w=>w.includes('arcos')),true);
assert.equal(V.belongsTo(a,'house-arches',['a1','a2','a3'].map(id=>({id,projectId:'house-arches'}))),true);
assert.equal(V.belongsTo(a,'house-pool',['a1','a2','a3'].map(id=>({id,projectId:'house-pool'}))),false);
assert.equal(V.belongsTo(a,'house-arches',['a1','a2'].map(id=>({id,projectId:'house-arches'}))),false);
assert.throws(()=>V.normalize(JSON.stringify(sample),'house-pool',['b1','b2','b3','b4','b5']),/3 fotos/);
assert.throws(()=>V.normalize('{bad','house-arches',['a1']),/JSON inválido/);
assert.throws(()=>V.normalize({findings:{}},'house-arches',[]),/Selecciona/);
assert.throws(()=>V.normalize(sample,'house-arches',['a1','a1']),/duplicadas/);
// Regression: model returns three distinct arches, repeated across camera angles.
// Evidence indices are bounded to the photos for THIS project; all inferred dimensions are discarded.
const rich={...sample,findings:{...sample.findings,siteGeometry:{
  photoCount:3,coveredPatio:true,poolPresent:null,
  facadeOpenings:[
    {id:'arch_left',type:'arch',description:'Left opening',estimatedRelativePosition:'left',
      evidencePhotoIndices:[1,2,99,2],confidence:'high',width:25},
    {id:'arch_center',type:'arch',description:'Center opening',estimatedRelativePosition:'center',
      evidencePhotoIndices:[1,3],confidence:'medium'},
    {id:'arch_right',type:'arch',description:'Right opening',estimatedRelativePosition:'right',
      evidencePhotoIndices:[1,2,3],confidence:'high'}
  ],
  upperAttachmentZones:[{id:'soffit_gap',observation:'Daylight above outer arched wall',
    evidencePhotoIndices:[2,3,4],confidence:'medium',structuralSuitability:'approved'}]
}}};
const infill=V.normalize(rich,'house-arches',['a1','a2','a3']);
assert.equal(infill.findings.siteGeometry.facadeOpenings.length,3);
assert.equal(infill.findings.siteGeometry.facadeOpenings[0].estimatedRelativePosition,'left');
assert.equal(infill.findings.siteGeometry.facadeOpenings[0].evidencePhotoIndices.join(','),'1,2');
assert.equal(infill.findings.siteGeometry.facadeOpenings[0].width,undefined);
assert.equal(infill.findings.siteGeometry.facadeOpenings[0].measurementStatus,'unverified');
assert.equal(infill.findings.siteGeometry.upperAttachmentZones[0].structuralSuitability,'unverified');
assert.equal(infill.findings.siteGeometry.upperAttachmentZones[0].evidencePhotoIndices.join(','),'2,3');
assert.equal(V.belongsTo(infill,'house-pool',['a1','a2','a3'].map(id=>({id,projectId:'house-pool'}))),false);
const worker=fs.readFileSync(new URL('../cloudflare/gorilla-ai-bridge.mjs',import.meta.url),'utf8');
assert.ok(worker.includes('upperAttachmentZones'));
assert.ok(worker.includes('facadeOpenings MUST NOT be empty'));
const studio=fs.readFileSync(new URL('../js/v17-studio.js',import.meta.url),'utf8');
assert.ok(studio.includes('Alternativa a revisar: Porch Infill'));
assert.ok(studio.includes('El análisis no cambia geometría, medidas, precios, takeoff ni aprobaciones.'));
console.log('PASS AI Vision isolation, incomplete observations, per-arch evidence, upper-zone safety, and photo count');
