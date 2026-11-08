import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const window={
 GSSVision:{belongsTo:(a,id,photos)=>a?.projectId===id&&a.photoIds.every(key=>photos.some(x=>x.id===key&&x.projectId===id))},
 GSSModel:{hasApprovedGeometry:p=>p.kind==='field'&&p.designStatus==='approved'&&!!p.approvedDrawing?.items?.length},
 GSSAiDesigner:{recommendedPhotos:(id,photos)=>{
  const rows=photos.filter(x=>x.projectId===id);
  const site=rows.filter(x=>x.cat!=='aerea').slice(0,4);
  const aerial=rows.find(x=>x.cat==='aerea');
  return [...site,...(aerial?[aerial]:[])].map(x=>x.id);
 }}
};
const context={window,Date,JSON};
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('../js/visit-flow.js',import.meta.url),'utf8'),context);
const F=window.GSSVisitFlow;
const p={id:'house-a',kind:'field',address:'',client:{name:''},quote:{rate:0},designStatus:'awaiting-photos',openings:[]};
const photos=[];
assert.equal(F.next(p,photos).tab,'datos');
assert.equal(F.status(p,photos).datos,false);
p.address='123 Test Avenue';p.client.name='Customer Example';
assert.equal(F.next(p,photos).tab,'fotos');
photos.push({id:'house-b-photo',projectId:'house-b',cat:'frente'});
assert.equal(F.status(p,photos).rawPhotoCount,0);
photos.push({id:'one',projectId:p.id,cat:'frente'});
assert.equal(F.status(p,photos).fotos,true);
assert.equal(F.next(p,photos).label,'Analizar fotos existentes');
assert.equal(F.status(p,photos).analisis,false);
p.aiVision={projectId:p.id,photoIds:['one'],importedAt:77};
assert.equal(F.status(p,photos).analisis,true);
assert.equal(F.next(p,photos).tab,'disenador');
p.aiDesigner={projectId:p.id,evidencePhotoIds:['one'],reportKey:77,reviewed:true};
assert.equal(F.status(p,photos).disenador,true);
assert.equal(F.next(p,photos).tab,'medidas');
assert.equal(F.status(p,photos).studio,false);
assert.equal(F.status(p,photos).precio,false);
p.approvedDrawing={items:[{id:'verified-opening',w:4,h:7,verified:true}]};
p.designStatus='approved';
assert.equal(F.status(p,photos).medidas,true);
assert.equal(F.next(p,photos).tab,'precio');
p.quote.rate=20;
assert.equal(F.next(p,photos).tab,'entregar');
assert.equal(p.openings.length,0,'No geometry mutation');
p.aiVision.importedAt=78;
assert.equal(F.status(p,photos).disenador,false,'New AI report invalidates old Designer review');
p.aiVision.photoIds=['one','deleted'];
assert.equal(F.aiValid(p,photos),false,'Missing source image invalidates Gemini report');
const all=[{id:'z',projectId:p.id,cat:'aerea'},
{id:'a',projectId:p.id,cat:'frente'}, {id:'b',projectId:p.id,cat:'west'},
{id:'c',projectId:p.id,cat:'east'},{id:'d',projectId:p.id,cat:'detalles'},
{id:'f',projectId:p.id,cat:'porche'},
{id:'foreign',projectId:'house-b',cat:'porche'}];
const selected=F.selectedPhotos(p,all);
assert.deepEqual([...selected],['a','b','c','d','z'],'Recommended: 4 site views + own aerial');
assert.equal(selected.includes('foreign'),false);
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
assert.ok(html.indexOf('js/visit-flow.js')<html.indexOf('js/field-studio-ui.js'),'Load visit status before UI');
assert.ok(app.includes('FS.header(p,tab,S.photos)'),'Real project photos feed progress');
assert.ok(app.includes('Continuar con Diseñador IA →'),'Gemini report moves to Designer');
assert.ok(app.includes('Otras opciones de captura'),'Extra upload is optional, not a required second capture');
assert.ok(app.includes('data-ai-photo'),'Saved photos remain selectable');
assert.ok(app.includes('vision-authorized'),'User consent remains explicit');
assert.ok(app.includes('vision-token'),'Bridge remains authenticated');
assert.ok(!app.includes('sessionStorage.setItem('),'Bridge access code is not persisted');
console.log('PASS guided visit: no fake completions, own 4+1 evidence, one capture, consent and AI Designer handoff');
