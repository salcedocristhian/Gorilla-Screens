/* Shared browser/Worker contract: visual ratios, never construction dimensions. */
(function(root){
'use strict';
const fail=()=>{throw Error('Geometría incompleta o inválida. Solicita más fotos o vuelve a analizar.');};
const number=(v,min,max)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail();return v;};
const text=v=>typeof v==='string'?v.slice(0,400):'';
const id=v=>{if(typeof v!=='string'||! /^[a-zA-Z0-9_-]{1,64}$/.test(v))fail();return v;};
function normalize(raw,projectId,photoIds){
 if(!projectId||!Array.isArray(photoIds)||!photoIds.length||photoIds.length>5||new Set(photoIds).size!==photoIds.length)fail();
 if(!raw||raw.schemaVersion!=='site-scene-v1'||raw.units!=='relative'||!Array.isArray(raw.nodes)||raw.nodes.length>100)fail();
 const seen=new Set();
 const nodes=raw.nodes.map(n=>{
  const key=id(n.id);if(seen.has(key))fail();seen.add(key);
  if(!['wall','slab','roof','column'].includes(n.type))fail();
  const vector=(a,min,max)=>{if(!Array.isArray(a)||a.length!==3)fail();return a.map(v=>number(v,min,max));};
  const position=vector(n.position,-10,10),size=vector(n.size,0.001,10);
  if(!Array.isArray(n.evidencePhotoIndices)||!n.evidencePhotoIndices.length)fail();
  const evidencePhotoIndices=[...new Set(n.evidencePhotoIndices.map(v=>{number(v,1,photoIds.length);if(!Number.isInteger(v))fail();return v;}))];
  const openings=n.openings||[];if(!Array.isArray(openings)||openings.length>20||n.type!=='wall'&&openings.length)fail();
  const openingIds=new Set();
  const clean=openings.map(o=>{
   const oid=id(o.id);if(openingIds.has(oid))fail();openingIds.add(oid);
   if(!['arch','door','window','rect'].includes(o.type))fail();
   const x=number(o.x,-5,5),bottom=number(o.bottom,0,10),width=number(o.width,.001,10),height=number(o.height,.001,10);
   const archRise=o.type==='arch'?number(o.archRise,0.001,height):0;
   if(x-width/2 < -size[0]/2-1e-6||x+width/2>size[0]/2+1e-6||bottom+height>size[1]+1e-6)fail();
   return {id:oid,type:o.type,x,bottom,width,height,archRise};
  });
  for(let i=0;i<clean.length;i++)for(let j=i+1;j<clean.length;j++){
   const a=clean[i],b=clean[j];
   if(Math.abs(a.x-b.x)<(a.width+b.width)/2-1e-6&&Math.max(a.bottom,b.bottom)<Math.min(a.bottom+a.height,b.bottom+b.height)-1e-6)fail();
  }
  return {id:key,type:n.type,label:text(n.label)||key,position,size,rotationY:number(n.rotationY,-Math.PI*2,Math.PI*2),
   evidencePhotoIndices,confidence:['low','medium','high'].includes(n.confidence)?n.confidence:'low',openings:clean};
 });
 return {schemaVersion:'site-scene-v1',projectId,units:'relative',status:'needs-human-review',
  evidencePhotoIds:photoIds.slice(),nodes,unknownConditions:Array.isArray(raw.unknownConditions)?raw.unknownConditions.slice(0,30).map(text):[],
  fieldVerified:false,engineeringApproved:false};
}
function belongsTo(scene,projectId,photos){
 return !!(scene&&scene.projectId===projectId&&Array.isArray(scene.evidencePhotoIds)&&scene.evidencePhotoIds.length&&
  scene.evidencePhotoIds.every(id=>photos.some(p=>p.id===id&&p.projectId===projectId)));
}
root.GSSSiteSceneContract={normalize,belongsTo};
})(globalThis);
