/* Gorilla V17 AI Site Reconstruction: reviewable visual context, never engineering.
   Works offline with JSON exported/copied from the private Gemini pilot.
   Does not call third-party APIs or change proposed enclosure quantities. */
(function(){
'use strict';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number(v)||0));
const str=(x,max=240)=>typeof x==='string'?x.trim().slice(0,max):'';
const strings=(xs,n=14)=>Array.isArray(xs)?xs.slice(0,n).map(x=>str(x)).filter(Boolean):[];
const kinds=new Set(['window','sliding-door','door','arch','column','opening']);
const roofKinds=new Set(['flat','gable','hip','unknown']);
function parse(input){
 const raw=typeof input==='string'?JSON.parse(input):input;
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Expected Gemini JSON object.');
 const result=raw.findings||raw.draft||raw;
 if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Missing analysis findings.');
 const house=result.site||result;
 const suggested=result.enclosure||result;
 const features=strings(house.visibleHouseFeatures||house.visibleFeatures);
 const fascia=strings(house.fasciaAndAttachmentObservations||house.attachmentObservations);
 const obstacles=strings(house.patioAndObstacles||house.obstacles);
 const limitations=strings(house.limitations||result.limitations);
 const toVerify=strings(result.measurementsToVerify);
 const comments=strings(suggested.suggestedEnclosureDesign||suggested.designNotes);
 const schema=result.siteGeometry||result.geometry||{};
 const roof=(schema.houseRoofType||house.houseRoofType||'unknown').toLowerCase();
 const roofType=roofKinds.has(roof)?roof:'unknown';
 // Only normalized facade rectangles explicitly located by the vision model are drawable.
 // Do NOT guess dimensions/placements from prose.
 const rawItems=Array.isArray(schema.facadeOpenings)?schema.facadeOpenings:[];
 const openings=rawItems.slice(0,16).map((item,index)=>{
  const kind=str(item.kind||'opening',30).toLowerCase();
  const coords=[item.x,item.y,item.width,item.height].map(Number);
  if(!kinds.has(kind)||coords.some(v=>!Number.isFinite(v))||
     coords[0]<0||coords[1]<0||coords[2]<=0||coords[3]<=0||
     coords[0]+coords[2]>1||coords[1]+coords[3]>1)return null;
  return {id:'opening-'+index,kind,x:clamp(coords[0],0,1),y:clamp(coords[1],0,1),
    width:clamp(coords[2],0,1),height:clamp(coords[3],0,1),
    evidence:str(item.evidence,220),confidence:['low','medium','high'].includes(item.confidence)?item.confidence:'low'};
 }).filter(Boolean);
 if(!features.length&&!fascia.length&&!obstacles.length&&!comments.length&&!toVerify.length&&!openings.length){
   throw Error('Gemini returned no useful visible observations.');
 }
 return {schemaVersion:1,kind:'existing-site-visual-reference',roofType,
  openings,features,fascia,obstacles,limitations,toVerify,comments,
  modelName:str(raw.model||raw.meta?.servedModel||'Gemini',80),
  sourceCount:Number.isFinite(Number(schema.photoCount))?Math.min(5,Math.max(1,Number(schema.photoCount))):null,
  generatedAt:new Date().toISOString(),status:'DRAFT_REVIEW_REQUIRED',
  // Persist text observations and normalized geometry only; never persist images in this object.
  disclaimer:'Approximate visual reference, not surveyed, measured or engineered. Apply verified dimensions manually.'};
}
function apply(s,result,photoIds,validPhotoIds){
 if(result.kind!=='existing-site-visual-reference'||result.status!=='DRAFT_REVIEW_REQUIRED')
  throw Error('Invalid reconstruction draft.');
 const permitted=new Set(validPhotoIds);
 const sources=[...new Set(photoIds)].filter(id=>permitted.has(id)).slice(0,5);
 if(!sources.length)throw Error('Select at least one photo owned by this project.');
 const draft=JSON.parse(JSON.stringify(result));
 // Intentionally never updates geometry W/D/H, house dimensions, fascia height,
 // enclosure roof, cut list, price or field measurement verification.
 s.site=s.site||{};
 s.site.reconstruction={...draft,sourcePhotoIds:sources,reviewed:false};
 s.site.enabled=true;
 s.site.photoId=sources[0];
 s.site.userDisabled=false;
 s.site.verified=false;
 return s.site.reconstruction;
}
function approveAsReference(s){
 const r=s.site?.reconstruction;
 if(!r)throw Error('No reconstruction to review.');
 // Review acceptance does not imply field measurement, structural or survey approval.
 r.reviewed=true;
 r.status='VISUAL_REFERENCE_REVIEWED';
 r.reviewedAt=new Date().toISOString();
 return r;
}
function formatStatus(s){
 const r=s.site?.reconstruction;
 return !r?'NONE':r.reviewed?'REVIEWED_VISUAL_ONLY':'DRAFT_REVIEW_REQUIRED';
}
window.GSSReconstruction={parse,apply,approveAsReference,formatStatus};
})();
