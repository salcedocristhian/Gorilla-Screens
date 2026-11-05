import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const pageCounts={n:0,ops:0};
class StubPDF{
  constructor(){pageCounts.n=1;}setDrawColor(){}setTextColor(){}setLineWidth(){}line(){pageCounts.ops++}rect(){pageCounts.ops++}setFont(){}setFontSize(){}text(){pageCounts.ops++}splitTextToSize(s){return [s]}getImageProperties(){return {width:1000,height:500,fileType:'JPEG'}}addImage(){}addPage(){pageCounts.n++}output(){return new Blob(['pdf-stub'],{type:'application/pdf'})}
}
const env={window:{jspdf:{jsPDF:StubPDF}},Math,Date,Blob,console};vm.createContext(env);
for(const file of ['model','field-plan'])vm.runInContext(fs.readFileSync(new URL('../js/'+file+'.js',import.meta.url),'utf8'),env);
const m=env.window.GSSModel;
const p=m.emptyProject();p.address='918 Spring Cir, Deerfield Beach, FL';p.designStatus='approved';
p.approvedDrawing={revision:1,approvedAt:Date.now(),items:[{id:'o1',type:'rect',w:5,h:8,profile:'2x2',verified:true,door:false,segments:[{direction:'v',t:.4,profile:'2x2'}]}]};
p.openings=p.approvedDrawing.items;
const blob=await env.window.GSSFieldPlan(p,{});
assert.equal(blob.type,'application/pdf');assert.equal(pageCounts.n,4);assert.ok(pageCounts.ops>50);
console.log('PASS 4 field PDF sheets generated from approved project geometry using PDF API stub');
