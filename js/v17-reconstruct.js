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
 const certainty=v=>['low','medium','high'].includes(v)?v:'low';
 const flag=v=>typeof v==='boolean'?v:null;
 const stories=Number.isInteger(schema.stories)&&schema.stories>=1&&schema.stories<=3?schema.stories:null;
 const poolShape=['rectangular','freeform','circular','other','unknown'].includes(schema.poolShape)?schema.poolShape:'unknown';
 const deckSurface=['pavers','concrete','tile','wood','other','unknown'].includes(schema.deckSurface)?schema.deckSurface:'unknown';
 const missingViews=strings(schema.recommendedCaptureMissingViews,10);
 const evidence=(value)=>Array.isArray(value)?[...new Set(value)]
  .filter(i=>Number.isInteger(i)&&i>=1&&i<=5).slice(0,5):[];
 const walls=Array.isArray(schema.candidateAttachmentWalls)?schema.candidateAttachmentWalls.slice(0,8)
  .map((a,i)=>({id:str(a?.id||'wall-'+(i+1),60),
   level:Number.isInteger(a?.level)&&a.level>=1&&a.level<=3?a.level:null,
   visibleMaterial:str(a?.visibleMaterial||'unknown',80),
   observation:str(a?.observation,240),confidence:certainty(a?.confidence),
   evidencePhotoIndices:evidence(a?.evidencePhotoIndices),structuralSuitability:'unverified'}))
  .filter(a=>a.observation):[];
 const upperZones=Array.isArray(schema.upperAttachmentZones)?schema.upperAttachmentZones.slice(0,8)
  .map((a,i)=>({id:str(a?.id||'upper-'+(i+1),60),
   level:Number.isInteger(a?.level)&&a.level>=1&&a.level<=3?a.level:null,
   description:str(a?.description,240),confidence:certainty(a?.confidence),
   evidencePhotoIndices:evidence(a?.evidencePhotoIndices),structuralSuitability:'unverified'}))
  .filter(a=>a.description):[];
 if(!features.length&&!fascia.length&&!obstacles.length&&!comments.length&&!toVerify.length&&!openings.length){
   throw Error('Gemini returned no useful visible observations.');
 }
 return {schemaVersion:2,kind:'existing-site-visual-reference',roofType,
  stories,coveredPatio:flag(schema.coveredPatio),poolPresent:flag(schema.poolPresent),
  spaPresent:flag(schema.spaPresent),balconyPresent:flag(schema.balconyPresent),
  poolShape,deckSurface,contextConfidence:certainty(schema.contextConfidence),
  attachments:walls,upperZones,missingViews,
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
 const expected=result.sourceCount||1;
 if(sources.length!==expected)throw Error('Gemini analyzed '+expected+' photo(s). Select exactly the source photos that were actually analyzed.');
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
// Visual-only 3D primitive plan from observed site features.
// All spatial dimensions are PROVISIONAL display proportions based on enclosure
// values already entered by the seller. Nothing here is used for takeoff.
function contextLayout(s){
 const E=window.GSSV17Engine;
 const site=E.siteLayout(s),r=s.site?.reconstruction||{};
 const stories=Number.isInteger(r.stories)?clamp(r.stories,1,3):1;
 const firstLevel=site.fascia;
 const upperLevel=Math.max(5,firstLevel*.75);
 const houseHeight=firstLevel+(stories-1)*upperLevel;
 const W=Math.max(0,Number(s.width)||0),D=Math.max(0,Number(s.depth)||0);
 const pool=r.poolPresent===true&&W>0&&D>0?{
  // Schematic position INSIDE the proposed enclosure as a visual cue only.
  // It is NOT a pool location recovered from the photo.
  cx:W*.52,cz:D*.64,width:W*.58,depth:D*.38,shape:r.poolShape||'unknown'
 }:null;
 const spa=r.spaPresent===true&&pool?{
  cx:Math.min(W*.84,pool.cx+pool.width*.36),
  cz:Math.min(D*.91,pool.cz+pool.depth*.26),
  radius:Math.min(W,D)*.105
 }:null;
 return {stories,firstLevel,upperLevel,houseHeight,houseRoofType:r.roofType||'unknown',
  pool,spa,coveredPatio:r.coveredPatio===true,balcony:r.balconyPresent===true,
  attachmentBands:[...(r.attachments||[]),...(r.upperZones||[])].slice(0,12)
   .map(a=>({level:Number.isInteger(a.level)?clamp(a.level,1,stories):null,
    confidence:a.confidence||'low'})).filter(a=>a.level!==null),
  estimated:true,sourceCount:r.sourceCount||null};
}
function formatStatus(s){
 const r=s.site?.reconstruction;
 return !r?'NONE':r.reviewed?'REVIEWED_VISUAL_ONLY':'DRAFT_REVIEW_REQUIRED';
}
window.GSSReconstruction={parse,apply,approveAsReference,formatStatus,contextLayout};
})();
