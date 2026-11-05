/* Gorilla Screening Solutions — isolated field-plan set, 11x17 landscape.
 * All geometry belongs to the active project's approvedDrawing.items.
 * Pre-engineering documentation only; no fabricated site, sealed design or fake aerial. */
(function(){
'use strict';
const M=window.GSSModel;
window.GSSFieldPlan=async function(project,assets={}){
 if(!M.hasApprovedGeometry(project))throw Error('An approved drawing is required.');
 const {jsPDF}=window.jspdf;
 const pdf=new jsPDF({orientation:'landscape',unit:'in',format:[11,17],compress:true});
 const P=project, items=P.approvedDrawing.items;
 const C={dark:[32,41,52],bronze:[76,57,44],muted:[112,120,130],light:[208,211,216],blue:[45,93,131]};
 const color=(rgb)=>{pdf.setDrawColor(...rgb);pdf.setTextColor(...rgb);};
 const font=(s=8,b=false)=>{pdf.setFont('helvetica',b?'bold':'normal');pdf.setFontSize(s);};
 const rule=(x1,y1,x2,y2,w=.008)=>{pdf.setLineWidth(w);pdf.line(x1,y1,x2,y2);};
 const label=(txt,x,y,sz=8)=>{font(sz,true);pdf.text(String(txt),x,y);};
 const note=(text,x,y,width=9,size=8)=>{font(size);let lines=pdf.splitTextToSize(String(text),width);pdf.text(lines,x,y,{lineHeightFactor:1.22});return y+lines.length*size/72*1.25;};
 const addr=P.address||'Address pending field confirmation';
 function frame(no,title){
  color(C.dark);pdf.setLineWidth(.018);pdf.rect(.28,.28,16.44,10.43);pdf.setLineWidth(.008);pdf.rect(.36,.36,16.28,10.27);
  rule(13.96,.36,13.96,10.63,.013);
  if(assets.logo)try{pdf.addImage(assets.logo,'PNG',14.24,.55,2.18,1.48);}catch(e){}
  label((assets.company?.name||'GORILLA SCREENING SOLUTIONS LLC').toUpperCase(),14.2,2.25,9);
  let y=2.54;const parts=[assets.company?.address||'Address on file',assets.company?.phone||'Contact information pending',assets.company?.email||'',assets.company?.license?'License '+assets.company.license:'Contractor license to confirm'];
  parts.filter(Boolean).forEach(v=>{note(v,14.2,y,2.2,7);y+=.23;});
  rule(13.96,3.48,16.64,3.48);
  label('PROJECT / SITE',14.2,3.72);y=note(addr,14.2,3.97,2.24,8);
  label('CLIENT',14.2,4.54);note(P.client?.name||'To be confirmed',14.2,4.75,2.2,8);
  rule(13.96,5.04,16.64,5.04);
  label('FIELD DRAWING / NON-ENGINEERED',14.2,5.31,7.7);
  note('Review field measurements, structural loading, attachment methods and applicable permits with the responsible design professional.',14.2,5.55,2.2,7);
  rule(13.96,6.75,16.64,6.75);label('REVISION',14.2,6.99,8);
  font(8);pdf.text('2D REV '+P.approvedDrawing.revision,14.2,7.23);
  pdf.text(new Date(P.approvedDrawing.approvedAt).toLocaleDateString('en-US'),14.2,7.46);
  label('DRAWN IN GORILLA SCREEN STUDIO',14.2,8.15,7);
  rule(13.96,9.45,16.64,9.45);
  label('SHEET',14.18,9.7,7);label(title,14.18,9.96,9);font(22,true);pdf.text(no,16.4,10.45,{align:'right'});
 }
 function heading(s,x=.74,y=.89){color(C.dark);font(15,true);pdf.text(s,x,y);rule(x,y+.12,13.5,y+.12,.011);}
 function putImage(data,x,y,w,h){
  pdf.setLineWidth(.009);color(C.light);pdf.rect(x,y,w,h);
  if(!data)return false;
  try{const prop=pdf.getImageProperties(data),rw=prop.width,rh=prop.height,scale=Math.min((w-.10)/rw,(h-.10)/rh),ww=rw*scale,hh=rh*scale;pdf.addImage(data,prop.fileType||'JPEG',x+(w-ww)/2,y+(h-hh)/2,ww,hh,undefined,'FAST');return true;}catch(e){return false;}
 }
 const imageMissing=(t,x,y,w,h)=>{color(C.muted);font(9);pdf.text(t,x+w/2,y+h/2,{align:'center'});};
 function openingOutline(o,x,y,s){const w=o.w*s,h=o.h*s,r=o.type==='arch'?o.w*s/2:0;const base=y+h;color(C.dark);pdf.setLineWidth(.018);rule(x,base,x,y+r);if(o.type==='arch'){
   const spring=y+r;let lx=x,ly=spring;for(let k=1;k<=35;k++){let a=Math.PI-k*Math.PI/35,nx=x+r+r*Math.cos(a),ny=spring-r*Math.sin(a);rule(lx,ly,nx,ny,.014);lx=nx;ly=ny;}
 }else rule(x,y,x+w,y);rule(x+w,y+r,x+w,base);rule(x,base,x+w,base);
  for(const seg of o.segments||[]){let t=Math.max(.02,Math.min(.98,+seg.t||.5));if(seg.direction==='v'){
    const sx=x+w*t,dx=t-.5,top=o.type==='arch'?y+r-r*Math.sqrt(Math.max(0,1-4*dx*dx)):y;rule(sx,base,sx,top,.014);
  }else{const yy=y+h*t;let xx=x,xr=x+w;if(o.type==='arch'&&yy<y+r){const dy=(y+r-yy)/r,half=r*Math.sqrt(Math.max(0,1-dy*dy));xx=x+r-half;xr=x+r+half;}rule(xx,yy,xr,yy,.014);}}
  if(o.door){const dw=Math.min(3,o.w-.15)*s;const dh=Math.min(80/12,o.h)*s;const ox=x+(w-dw)/2;pdf.setDrawColor(...C.bronze);pdf.setLineWidth(.018);pdf.rect(ox,base-dh,dw,dh);rule(ox,base-dh*.44,ox+dw,base-dh*.44);pdf.rect(ox,base-.37*s,dw,.37*s);color(C.dark);}
  font(7,true);pdf.text(M.fmt(o.w),x+w/2,base+.24,{align:'center'});pdf.text(M.fmt(o.h),x+w+.12,y+h/2,{angle:90,align:'center'});
 }
 // G-0
 frame('G-0','SITE / LOCATION');heading('SCREEN ENCLOSURE  |  PROJECT LOCATION');
 label('EXISTING CONDITION  /  SITE PHOTOGRAPH',.72,1.28,9);if(!putImage(assets.existing,.72,1.46,7.15,4.05))imageMissing('Add field photograph',.72,1.46,7.15,4.05);
 label('AERIAL LOCATION  /  USER-SUPPLIED REFERENCE',8.11,1.28,9);if(!putImage(assets.aerial,8.1,1.46,5.48,4.05))imageMissing('No authorized aerial photo saved',8.1,1.46,5.48,4.05);
 color(C.dark);label('PROJECT SUMMARY',.74,6.0,10);
 let cy=6.38;["Project address: "+addr,"Existing field openings documented: "+items.length,"Approved 2D revision: "+P.approvedDrawing.revision,"Photo-based measurements: checked by field operator",'All dimensions subject to independent site verification'].forEach(t=>{cy=note(t,.75,cy,12,9)+.14;});
 label('DRAWING INDEX',.74,8.37,9);note('G-0  Site / Location     S-1  Field Elevation & Roof Plan     S-2  Opening & Materials Schedule     S-3  Installation Notes & References',.74,8.61,12.5,8);
 // S-1: elevation to actual approved openings, never imaginary house
 pdf.addPage();frame('S-1','OPENINGS / ROOF');heading('SCREEN FRAME  |  APPROVED FIELD GEOMETRY');
 const maxH=Math.max(1,...items.map(o=>o.h)),total=items.reduce((s,o)=>s+o.w,0),gap=items.length>1?Math.max(0,Number(P.pier)||0):0,overall=total+gap*(items.length-1),scale=Math.min(8.3/Math.max(overall,.1),5.8/Math.max(maxH,.1),.74);
 const startX=.85,baseY=7.42;let ox=startX;
 items.forEach((o,i)=>{openingOutline(o,ox,baseY-o.h*scale,scale);font(8,true);pdf.text('O-'+String(i+1).padStart(2,'0'),ox+o.w*scale/2,baseY+.46,{align:'center'});ox+=(o.w+gap)*scale;});
 label('FRONT ELEVATION · SCREEN OPENINGS (DRAWING GEOMETRY)',.85,8.25,9);
 color(C.muted);note('The spacing between separate photo-traced openings is schematic unless overall facade dimensions were field measured. Existing house geometry is intentionally omitted.',.85,8.55,12.2,8);
 const rr=P.roofDesign?.status==='approved-conceptual'?P.roofDesign:null;
 label('ROOF PLAN',9.7,1.28,9);
 color(C.light);pdf.rect(9.68,1.43,3.8,3.3);
 if(rr && rr.width>0 && rr.depth>0){const pw=3.4,ph=2.25;const x=9.85,y=1.75;color(C.dark);pdf.rect(x,y,pw,ph);if(rr.style==='gable'){rule(x,y+ph/2,x+pw,y+ph/2);}if(rr.style==='mansard'){pdf.rect(x+.3,y+.3,pw-.6,ph-.6);[[x,y,x+.3,y+.3],[x+pw,y,x+pw-.3,y+.3],[x,y+ph,x+.3,y+ph-.3],[x+pw,y+ph,x+pw-.3,y+ph-.3]].forEach(a=>rule(...a));}(rr.bays||[]).forEach(t=>rule(x+pw*t,y,x+pw*t,y+ph));font(8);pdf.text(rr.style.toUpperCase()+' · '+M.fmt(rr.width)+' × '+M.fmt(rr.depth),x,4.37);}
 else imageMissing('No roof plan approved',9.68,1.43,3.8,3.3);
 label('PROPOSED SCREEN SCOPE',9.68,5.3,9);note('Profiles and screen specified per approved 2D objects. Dimensions remain subject to onsite verification and structural review. New work is drawn in dark bronze / black linework.',9.68,5.58,3.7,8);
 // S-2
 pdf.addPage();frame('S-2','MATERIALS / DETAILS');heading('OPENING SCHEDULE  |  FRAME & SCREEN QUANTITIES');
 const colX=[.85,1.8,4.4,6.2,8.4,10.4,12.2],cols=['ID','TYPE','WIDTH','HEIGHT','PROFILE','DOOR','AREA'];color(C.dark);font(8,true);cols.forEach((x,i)=>pdf.text(['ID','TYPE','WIDTH','HEIGHT','PROFILE','DOOR','AREA'][i],colX[i],1.52));rule(.78,1.65,13.45,1.65,.015);
 let y=1.93;items.forEach((o,i)=>{if(y>6.5)return;color(C.dark);font(8);const values=['O-'+(i+1),o.type==='arch'?'ARCH':'RECT.',M.fmt(o.w),M.fmt(o.h),o.profile||'1x2',o.door?'YES':'NO',M.openingArea(o).toFixed(1)+' SF'];values.forEach((v,j)=>pdf.text(String(v),colX[j],y));rule(.78,y+.12,13.45,y+.12,.006);y+=.43;});
 const bom=window.GSSPhotoEditor?.takeoff?.({items:P.approvedDrawing.geometry||items.map(o=>({...o,physicalW:o.w,physicalH:o.h}))});
 label('PRELIMINARY FRAME TAKEOFF',.85,7.43,9);
 let yy=7.73;if(bom){Object.entries(bom.byProfile||{}).forEach(([k,v])=>{font(8);pdf.text('Aluminum '+k,1.0,yy);pdf.text(v.toFixed(1)+' LF',4.7,yy);yy+=.24;});font(8);pdf.text('Screen area (gross): '+bom.screenSqFt.toFixed(1)+' SF',7.4,7.73);pdf.text('Doors: '+bom.doors,7.4,8.02);}else note('Quantities pending geometric takeoff.',.85,yy,11,8);
 color(C.muted);note('Quantities are preliminary and do not include waste, splice constraints, supplier stock lengths, hardware or engineered fastener schedules.',.85,9.4,12,7);
 // S-3 notes and issue log
 pdf.addPage();frame('S-3','FIELD / DETAILS');heading('CONSTRUCTION REFERENCE  |  FIELD NOTES');
 let ny=1.50;const notes=[
  '1. Coordinate all on-site dimensions and actual framing conditions prior to ordering, cutting or fabrication.',
  '2. Manufacturer-specific aluminum extrusion profiles, spline channels and connectors must match the selected supplied system.',
  '3. Screen door opening, handing, closer, midrail and kickplate configuration must be field verified. A 36 in x 80 in door may not fit under a 48 in wide semicircular arch.',
  '4. Screen mesh and aluminum finish are project selections; verify manufacturer specifications and product compatibility.',
  '5. Roof types Flat, Mansard, Gable and solid IRP require separate design review and member/attachment selections; no structural approval is implied.',
  '6. Wind loads, member capacities, post spacing, footings, anchors, existing support and local building-code requirements are outside this conceptual field drawing.',
  '7. Drawings produced by this application are NOT SEALED ENGINEERING DOCUMENTS and are not valid substitutes for engineering/permit documents.',
  '8. Reference photos are site-specific and remain tied to this project; do not reuse from any other property.'
 ];
 notes.forEach(text=>{ny=note(text,.83,ny,12.25,8.5)+.19;});
 label('REVISION / APPROVAL RECORD',.83,8.7,9);font(8);pdf.text('2D REV '+P.approvedDrawing.revision+' — '+new Date(P.approvedDrawing.approvedAt).toLocaleString('en-US'),.83,9.02);
 pdf.text('Source: manual photo trace · field-confirmed dimensions · no automated photogrammetry claim',.83,9.32);
 return pdf.output('blob');
};
})();
