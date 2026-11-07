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
console.log('PASS AI Vision isolation, incomplete observations, and photo count');
