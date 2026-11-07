import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const context={window:{},JSON,Date,Number,Math,Set,Array,Error};
vm.createContext(context);
for(const path of ['v17-engine.js','v17-reconstruct.js']){
 vm.runInContext(fs.readFileSync(new URL('../js/'+path,import.meta.url),'utf8'),context);
}
const E=context.window.GSSV17Engine,R=context.window.GSSReconstruction;
const s=E.defaults();s.width=20;s.depth=30;s.height=10;
const project={id:'one',openings:[],topScreen:{},gutter:{}};
const baseline=JSON.stringify(E.takeoff(s));
const input={
 status:'draft-needs-human-review',
 model:'gemini-3.5-flash-lite',
 findings:{
 visibleHouseFeatures:['Sliding glass door','Covered ribbed soffit'],
 fasciaAndAttachmentObservations:['The attachment is partially obscured'],
 patioAndObstacles:['Existing porch columns'],
 suggestedEnclosureDesign:['Confirm screen framing at fascia'],
 measurementsToVerify:['Measure slab','Confirm fascia'],
 limitations:['No measurement from photo'],
 geometry:{photoCount:2,
  houseRoofType:'flat',
  facadeOpenings:[
   {kind:'sliding-door',x:.20,y:.05,width:.28,height:.65,evidence:'Rear patio photo',confidence:'medium'},
   {kind:'window',x:.60,y:.22,width:.18,height:.28,evidence:'Side photo',confidence:'low'},
   {kind:'window',x:.99,y:.90,width:.50,height:.50,evidence:'invalid extent'}
  ]
 }
 }};
const parsed=R.parse(JSON.stringify(input));
assert.equal(parsed.status,'DRAFT_REVIEW_REQUIRED');
assert.equal(parsed.features.length,2);
assert.equal(parsed.openings.length,2,'Reject out-of-bounds facade annotations');
assert.equal(parsed.roofType,'flat');
assert.equal(parsed.toVerify.length,2);
const d=R.apply(s,parsed,['p1','p2','other-project-photo'],['p1','p2']);
assert.equal(d.sourcePhotoIds.join(','),'p1,p2','Never import unrelated project photo IDs');
assert.equal(s.site.enabled,true);
assert.equal(s.site.verified,false,'AI must not verify house geometry');
assert.equal(s.verified,false,'AI must not verify enclosure field dimensions');
assert.equal(s.width,20);
assert.equal(s.depth,30);
assert.equal(s.height,10);
assert.equal(s.roof,'mansard','AI must not choose/change proposed enclosure roof');
assert.equal(JSON.stringify(E.takeoff(s)),baseline,'Site AI must not alter the vendor takeoff');
assert.equal(R.formatStatus(s),'DRAFT_REVIEW_REQUIRED');
R.approveAsReference(s);
assert.equal(R.formatStatus(s),'REVIEWED_VISUAL_ONLY');
assert.equal(s.site.verified,false,'Review does not create field measurement verification');
const flat=R.parse({findings:{
 visibleHouseFeatures:['Covered patio roof'],
 fasciaAndAttachmentObservations:['Fascia partially hidden'],
 patioAndObstacles:['Furniture'],
 measurementsToVerify:['Measure dimensions'],
 limitations:['No 3D geometry possible']
}});
assert.equal(flat.openings.length,0,'Do not invent windows or doors from prose-only Gemini JSON');
assert.throws(()=>R.parse('invalid text'),SyntaxError);
assert.throws(()=>R.apply(E.defaults(),parsed,['not-owned'],['owned']),/Select at least one photo/);
const result=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.ok(result.indexOf('js/v17-reconstruct.js')<result.indexOf('js/v17-studio.js'),'Load adapter before workspace');
console.log('PASS V17 AI: legacy Gemini JSON, geometry bounds, project photo isolation, human review and zero purchase changes');
