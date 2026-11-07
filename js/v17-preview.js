/* V17 isolated THREE.js conceptual framing viewer.
   Does not reuse the demonstration property's house geometry. */
(function(){
'use strict';
function mount(host,s,sitePhoto){
 const T=window.THREE;
 if(!T||!T.OrbitControls)throw Error('THREE or OrbitControls not available.');
 const W=+s.width,D=+s.depth,H=+s.height;
 const site=window.GSSV17Engine.siteLayout(s);
 const context=window.GSSReconstruction?.contextLayout(s)||null;
 host.dataset.houseReference=site.enabled?'true':'false';
 host.dataset.photoReference=site.enabled&&sitePhoto?.url?String(sitePhoto.id):'';
 host.dataset.aiOpenings=String(s.site?.reconstruction?.openings?.length||0);
 host.dataset.aiReviewed=String(s.site?.reconstruction?.reviewed===true);
 host.dataset.aiStories=String(s.site?.reconstruction?.stories??'unknown');
 host.dataset.aiPool=String(s.site?.reconstruction?.poolPresent===true);
 host.dataset.aiSpa=String(s.site?.reconstruction?.spaPresent===true);
 host.dataset.aiCoveredPatio=String(s.site?.reconstruction?.coveredPatio===true);
 host.dataset.aiBalcony=String(s.site?.reconstruction?.balconyPresent===true);
 host.dataset.aiAttachmentBands=String(context?.attachmentBands?.length||0);
 if(!(W>0&&D>0&&H>0))return {destroy(){}};
 const color=s.finish==='white'?0xe9ece9:0x3d3028;
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 renderer.outputEncoding=T.sRGBEncoding;
 renderer.setClearColor(0x91a5b4,1);
 host.innerHTML='';host.appendChild(renderer.domElement);renderer.domElement.style.touchAction='none';
 const scene=new T.Scene();scene.background=new T.Color(0x91a5b4);
 const camera=new T.PerspectiveCamera(40,1,.2,1000);
 const span=Math.max(W,D,H,site.enabled?site.width:0,site.enabled?site.depth:0,
   site.enabled?context?.houseHeight||0:0);
 camera.position.set(W*.9+span*.50,Math.max(H,context?.houseHeight||0)*.85+span*.75,D*1.25+span*.9);
 camera.lookAt(W/2,Math.max(H,context?.houseHeight||0)*.48,D/2);
 const controls=new T.OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.dampingFactor=.07;controls.maxPolarAngle=Math.PI*.49;
 controls.minDistance=Math.max(2,span*.25);controls.maxDistance=span*6;
 scene.add(new T.HemisphereLight(0xffffff,0x88939b,1.2));
 const sun=new T.DirectionalLight(0xffffff,.9);sun.position.set(W/2+20,H+28,D+12);scene.add(sun);
 const frameMat=new T.MeshStandardMaterial({color,metalness:.48,roughness:.47});
 const roofMat=new T.MeshStandardMaterial({color:0x7a9ba8,roughness:.75,metalness:.1,transparent:true,opacity:.18,side:T.DoubleSide,depthWrite:false});
 const wallMat=new T.MeshStandardMaterial({color:0x77a0ad,roughness:.6,transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false});
 const irpMat=new T.MeshStandardMaterial({color:0xd7dadd,roughness:.55,metalness:.15,transparent:true,opacity:.91,side:T.DoubleSide});
 const houseMat=new T.MeshStandardMaterial({color:0x7b8389,roughness:1,transparent:true,opacity:.40,side:T.DoubleSide});
 const floorMat=new T.MeshStandardMaterial({color:0xb8bfc4,roughness:1,side:T.DoubleSide});
 const objects=[],extraMaterials=[],textures=[];
 let dead=false;
 function mesh(geo,mat,x,y,z){const item=new T.Mesh(geo,mat);item.position.set(x,y,z);scene.add(item);objects.push(item);return item;}
 function beam(a,b,cross=.16,deep=.3,mat=frameMat){
  const v1=new T.Vector3(...a),v2=new T.Vector3(...b),diff=new T.Vector3().subVectors(v2,v1),len=diff.length();
  if(len<.001)return;
  const obj=mesh(new T.BoxGeometry(cross,len,deep),mat,(v1.x+v2.x)/2,(v1.y+v2.y)/2,(v1.z+v2.z)/2);
  obj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),diff.normalize());
 }
 function plane(pts,mat){
  const geo=new T.BufferGeometry(),verts=[];
  for(const k of [0,1,2,0,2,3])verts.push(...pts[k]);
  geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();
  mesh(geo,mat,0,0,0);
 }
 const bayCount=Math.max(1,Math.ceil(W/(+s.wallTarget||6)));
 const sideCount=Math.max(1,Math.ceil(D/(+s.wallTarget||6)));
 const rows=Math.max(1,Math.ceil(D/(+s.roofTarget||6)));
 function roofY(x,z){
  if(s.roof==='mansard'){
   const inset=Math.max(.05,Math.min(+s.mansardInset||3,W*.45,D*.45));
   const level=Math.max(0,Math.min(1,x/inset,(W-x)/inset,z/inset,(D-z)/inset));
   return H+Math.max(0,+s.mansardRise||0)*level;
  }
  if(s.roof==='gable')return H+Math.max(0,+s.mansardRise||0)*(1-Math.abs(x-W/2)/(W/2));
  return H;
 }
 const tiny=.012;
 // Ground supports both the proposal and the separate, contextual house footprint.
 const back=site.enabled?site.depth:0;
 mesh(new T.PlaneGeometry(Math.max(W,site.enabled?site.width:W)+8,D+back+8),floorMat,W/2,-.04,(D-back)/2).rotation.x=-Math.PI/2;
 if(site.enabled){
   // Simple, editable volume at the site-facing fascia — never a photogrammetric mesh.
   const x0=site.x0,x1=site.x1,zFront=-.28,zRear=-site.depth-.28,eaves=site.fascia;
   // A second/third story comes from an AI visual observation; its height is schematic.
   const roofElevation=context?.houseHeight||eaves;
   const conceptualRoof=s.site?.verified?site.roofType:context?.houseRoofType;
   const displayRoof=['flat','gable','hip'].includes(conceptualRoof)?conceptualRoof:site.roofType;
   const houseBodyMat=new T.MeshStandardMaterial({color:0xcfd2ce,roughness:.93});
   const houseRoofMat=new T.MeshStandardMaterial({color:0x657077,roughness:.87,metalness:.08,side:T.DoubleSide});
   extraMaterials.push(houseBodyMat,houseRoofMat);
   mesh(new T.BoxGeometry(site.width,Math.max(.1,roofElevation),site.depth),houseBodyMat,x0+site.width/2,roofElevation/2,-.28-site.depth/2);
   if(displayRoof==='flat') {
     mesh(new T.BoxGeometry(site.width+.9,.22,site.depth+.7),houseRoofMat,x0+site.width/2,roofElevation+.12,-.28-site.depth/2);
   }else if(displayRoof==='gable'){
     const ridge=roofElevation+site.roofRise,cx=(x0+x1)/2;
     plane([[x0,roofElevation,zFront],[cx,ridge,zFront],[cx,ridge,zRear],[x0,roofElevation,zRear]],houseRoofMat);
     plane([[cx,ridge,zFront],[x1,roofElevation,zFront],[x1,roofElevation,zRear],[cx,ridge,zRear]],houseRoofMat);
     plane([[x0,roofElevation,zFront],[x1,roofElevation,zFront],[cx,ridge,zFront],[cx,ridge,zFront]],houseRoofMat);
   }else{
     const ridge=roofElevation+site.roofRise,cx=(x0+x1)/2,midZ=(zFront+zRear)/2;
     plane([[x0,roofElevation,zFront],[cx,ridge,midZ],[cx,ridge,midZ],[x1,roofElevation,zFront]],houseRoofMat);
     plane([[x0,roofElevation,zRear],[x1,roofElevation,zRear],[cx,ridge,midZ],[cx,ridge,midZ]],houseRoofMat);
     plane([[x0,roofElevation,zFront],[x0,roofElevation,zRear],[cx,ridge,midZ],[cx,ridge,midZ]],houseRoofMat);
     plane([[x1,roofElevation,zRear],[x1,roofElevation,zFront],[cx,ridge,midZ],[cx,ridge,midZ]],houseRoofMat);
   }
   if(context&&s.site?.reconstruction){
     // Floor/elevation seam is a VISUAL cue, not a measured storey height.
     const seamMat=new T.MeshStandardMaterial({color:0x83939e,metalness:.15,roughness:.7});
     extraMaterials.push(seamMat);
     for(let level=1;level<context.stories;level++){
       const y=context.firstLevel+(level-1)*context.upperLevel;
       beam([x0,y,-.245],[x1,y,-.245],.055,.06,seamMat);
     }
     if(context.coveredPatio){
       const shadeMat=new T.MeshStandardMaterial({color:0xc7d4c6,metalness:.1,
         roughness:.5,transparent:true,opacity:.40,side:T.DoubleSide,depthWrite:false});
       extraMaterials.push(shadeMat);
       const porchDepth=Math.min(D*.22,6);
       mesh(new T.BoxGeometry(Math.min(W,site.width),.10,porchDepth),
         shadeMat,W/2,context.firstLevel+.04,porchDepth/2);
     }
     if(context.balcony){
       const balconyMat=new T.MeshStandardMaterial({color:0xa7aaad,roughness:.85});
       extraMaterials.push(balconyMat);
       const depth=Math.min(D*.14,3),balconyWidth=Math.min(W*.55,site.width*.66);
       mesh(new T.BoxGeometry(balconyWidth,.12,depth),balconyMat,W/2,context.firstLevel+.14,depth/2);
       const railZ=depth-.10;
       beam([W/2-balconyWidth/2,context.firstLevel+.18,railZ],
         [W/2-balconyWidth/2,context.firstLevel+3,railZ],.07,.08,seamMat);
       beam([W/2+balconyWidth/2,context.firstLevel+.18,railZ],
         [W/2+balconyWidth/2,context.firstLevel+3,railZ],.07,.08,seamMat);
       beam([W/2-balconyWidth/2,context.firstLevel+3,railZ],
         [W/2+balconyWidth/2,context.firstLevel+3,railZ],.07,.08,seamMat);
     }
     // Attachment bands communicate possible ELEVATION LEVELS, not physical
     // anchoring points or permission to connect structural members.
     if(context.attachmentBands.length){
       const candidateMat=new T.MeshStandardMaterial({color:0xe4a947,roughness:.45,
         metalness:.15,transparent:true,opacity:.80});
       extraMaterials.push(candidateMat);
       const levels=[...new Set(context.attachmentBands.map(a=>a.level))];
       for(const level of levels){
         const y=Math.min(roofElevation-.15,context.firstLevel+(level-1)*context.upperLevel-.20);
         if(y>0)beam([x0,y,-.20],[x1,y,-.20],.055,.10,candidateMat);
       }
     }
     if(context.pool){
       const water=new T.MeshStandardMaterial({color:0x258fa6,metalness:.05,
         roughness:.25,transparent:true,opacity:.75,side:T.DoubleSide});
       extraMaterials.push(water);
       const p=context.pool;
       // Geometry is a 2D placeholder of unknown plan location & dimensions.
       const g=p.shape==='circular'?new T.CircleGeometry(Math.min(p.width,p.depth)*.50,42)
         :new T.PlaneGeometry(p.width,p.depth);
       const pool=mesh(g,water,p.cx,.025,p.cz);
       pool.rotation.x=-Math.PI/2;
       if(context.spa){
         const sp=context.spa;
         mesh(new T.CylinderGeometry(sp.radius,sp.radius,.08,32),
           water,sp.cx,.08,sp.cz);
       }
     }
   }
   // Project-owned photo is an upright reference plane; its perspective is not geometrically solved.
   if(site.showPhoto && sitePhoto?.url){
     const photoMaterial=new T.MeshBasicMaterial({transparent:true,opacity:.95,side:T.DoubleSide,depthWrite:false,color:0xffffff});
     extraMaterials.push(photoMaterial);
     const photoPlane=mesh(new T.PlaneGeometry(site.width,Math.max(.1,roofElevation)),photoMaterial,x0+site.width/2,roofElevation/2,-.275+.018);
     photoPlane.renderOrder=3;
     const loader=new T.TextureLoader();
     loader.load(sitePhoto.url,tex=>{
       if(dead){tex.dispose();return;}
       tex.encoding=T.sRGBEncoding;
       photoMaterial.map=tex;photoMaterial.needsUpdate=true;textures.push(tex);
     },undefined,()=>{/* Keep neutral house if the source photo cannot be decoded. */});
   }
   // The AI's explicitly normalized facade annotations are visual OVERLAYS,
   // not cut-outs or surveyed geometry. No guessed locations from prose.
   const rec=s.site?.reconstruction;
   if(Array.isArray(rec?.openings)&&rec.openings.length){
     const glassMat=new T.MeshStandardMaterial({
       color:0x244d65,roughness:.3,metalness:.15,transparent:true,opacity:.80,
       side:T.DoubleSide,depthWrite:false
     });
     const markerMat=new T.MeshStandardMaterial({color:rec.reviewed?0x48bdb2:0xe4a947,roughness:.7});
     extraMaterials.push(glassMat,markerMat);
     for(const o of rec.openings.slice(0,16)){
       const aw=Math.max(.05,site.width*o.width),ah=Math.max(.05,roofElevation*o.height);
       const ox=x0+site.width*(o.x+o.width/2),oy=roofElevation*(o.y+o.height/2);
       if(o.kind==='column'){
         mesh(new T.BoxGeometry(aw,ah,.13),markerMat,ox,oy,-.19);
       }else{
         mesh(new T.BoxGeometry(aw,ah,.025),glassMat,ox,oy,-.16);
         beam([ox-aw/2,oy-ah/2,-.13],[ox-aw/2,oy+ah/2,-.13],.045,.055,markerMat);
         beam([ox+aw/2,oy-ah/2,-.13],[ox+aw/2,oy+ah/2,-.13],.045,.055,markerMat);
         beam([ox-aw/2,oy+ah/2,-.13],[ox+aw/2,oy+ah/2,-.13],.045,.055,markerMat);
         beam([ox-aw/2,oy-ah/2,-.13],[ox+aw/2,oy-ah/2,-.13],.045,.055,markerMat);
       }
     }
   }
   // Existing fascia reference (not the proposed super gutter).
   const fasciaMat=new T.MeshStandardMaterial({color:0x318d92,metalness:.3,roughness:.45});
   extraMaterials.push(fasciaMat);
   beam([x0,eaves,-.24],[x1,eaves,-.24],.13,.17,fasciaMat);
 }else{
   // Legacy visual aid only when the user has not selected any project-owned house context.
   plane([[0,0,-.55],[W,0,-.55],[W,H+1.5,-.55],[0,H+1.5,-.55]],houseMat);
 }
 for(let i=0;i<=bayCount;i++)if(!s.pictureView||i===0||i===bayCount)beam([W*i/bayCount,0,D],[W*i/bayCount,H,D],.22,.4);
 for(let side of [0,W])for(let j=0;j<sideCount;j++)beam([side,0,D*j/sideCount],[side,H,D*j/sideCount],.22,.4);
 // Top two separate profiles: upper roof 2x2, lower wall spline 1x2, both front and sides.
 beam([0,H,D],[W,H,D],.18,.18);
 beam([0,H,0],[0,H,D],.18,.18);beam([W,H,0],[W,H,D],.18,.18);
 const lowerY=H-.20;
 beam([0,lowerY,D],[W,lowerY,D],.10,.12);
 beam([0,lowerY,0],[0,lowerY,D],.10,.12);beam([W,lowerY,0],[W,lowerY,D],.10,.12);
 // Use the SAME bay-aware doorway geometry as the purchase takeoff.
 const doorGeometry=window.GSSV17Engine.doorLayout(s);
 const doors=doorGeometry.placements;
 const doorAtBay=new Map(doors.map(d=>[d.bay,d]));
 // Keep the stationary 1x2 bottom track OUT of the door openings.
 let trackCursor=0;
 doors.forEach(d=>{
   if(d.x0-trackCursor>.001)beam([trackCursor,.06,D],[d.x0,.06,D],.08,.12);
   trackCursor=d.x1;
 });
 if(W-trackCursor>.001)beam([trackCursor,.06,D],[W,.06,D],.08,.12);
 for(let x of [0,W])beam([x,.06,0],[x,.06,D],.08,.12);
 // The chair rail also stops at the doorway, not across the swinging leaf.
 if(+s.chairHeight>0&&+s.chairHeight<H){
   const cy=+s.chairHeight;
   for(let side of [0,W])beam([side,cy,0],[side,cy,D],.17,.17);
   let current=0;
   doors.forEach(d=>{
     if(d.x0-current>.001)beam([current,cy,D],[d.x0,cy,D],.17,.17);
     current=d.x1;
   });
   if(W-current>.001)beam([current,cy,D],[W,cy,D],.17,.17);
 }
 // Fit the door within one existing bay. Preserve the screen above its header.
 for(let i=0;i<bayCount;i++){
   const bx0=W*i/bayCount,bx1=W*(i+1)/bayCount,door=doorAtBay.get(i);
   const z=D+.008;
   if(!door){
     plane([[bx0,.06,z],[bx1,.06,z],[bx1,H,z],[bx0,H,z]],wallMat);
     continue;
   }
   const {x0,x1,height}=door;
   if(x0-bx0>.001)plane([[bx0,.06,z],[x0,.06,z],[x0,H,z],[bx0,H,z]],wallMat);
   if(bx1-x1>.001)plane([[x1,.06,z],[bx1,.06,z],[bx1,H,z],[x1,H,z]],wallMat);
   if(H-height>.001)plane([[x0,height,z],[x1,height,z],[x1,H,z],[x0,H,z]],wallMat);
   // 2x2 stationary jambs/header.
   beam([x0,0,D],[x0,height,D],.17,.17);
   beam([x1,0,D],[x1,height,D],.17,.17);
   beam([x0,height,D],[x1,height,D],.17,.17);
   // Separate real leaf mesh, framed on four edges, rotating about its own hinges.
   const hingeRight=s.doorHinge==='right',hingeX=hingeRight?x1:x0;
   const pivot=new T.Group();
   pivot.position.set(hingeX,0,D+.08);
   scene.add(pivot);
   function leafMember(a,b,cross=.10,deep=.13,mat=frameMat){
     const v1=new T.Vector3(...a),v2=new T.Vector3(...b);
     const delta=v2.clone().sub(v1),len=delta.length();
     if(len<=0)return;
     const item=new T.Mesh(new T.BoxGeometry(cross,len,deep),mat);
     item.position.copy(v1.clone().add(v2).multiplyScalar(.5));
     item.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
     pivot.add(item);objects.push(item);
   }
   const leafW=Math.max(.2,x1-x0-.12),leafH=Math.max(.3,height-.12),direction=hingeRight?-1:1;
   const xx=direction*leafW;
   leafMember([0,.10,0],[0,leafH,0]);
   leafMember([xx,.10,0],[xx,leafH,0]);
   leafMember([0,.10,0],[xx,.10,0]);
   leafMember([0,leafH,0],[xx,leafH,0]);
   leafMember([0,Math.min(3,leafH*.45),0],[xx,Math.min(3,leafH*.45),0],.10,.10);
   const leafMesh=new T.BufferGeometry();
   const leafVertices=[0,.12,0,xx,.12,0,xx,leafH-.03,0,0,.12,0,xx,leafH-.03,0,0,leafH-.03,0];
   leafMesh.setAttribute('position',new T.Float32BufferAttribute(leafVertices,3));
   leafMesh.computeVertexNormals();
   const meshLeaf=new T.Mesh(leafMesh,new T.MeshStandardMaterial({color:0x779aa4,roughness:.8,transparent:true,opacity:.28,side:T.DoubleSide,depthWrite:false}));
   pivot.add(meshLeaf);objects.push(meshLeaf);
   // Visible handle and a compact top closer representation (conceptual).
   const hardware=new T.MeshStandardMaterial({color:0x323a3c,metalness:.55,roughness:.4});
   leafMember([xx-direction*.12,3.6,.1],[xx-direction*.12,3.95,.1],.09,.09,hardware);
   leafMember([0,leafH-.19,0],[direction*.65,leafH-.19,0],.065,.09,hardware);
   const open=s.doorOpen===true,angle=open?(Math.PI/3):0;
   const outward=s.doorSwing!=='inward';
   pivot.rotation.y=angle*(hingeRight?1:-1)*(outward?1:-1);
 }
 // Exterior side-wall screen remains complete.
 plane([[0,.06,0],[0,.06,D],[0,H,D],[0,H,0]],wallMat);
 plane([[W,.06,D],[W,.06,0],[W,H,0],[W,H,D]],wallMat);
 // Big beams span from house fascia z=0 toward the front enclosure z=D.
 const steps=(s.roof==='mansard'?Math.max(2,rows*2):1);
 for(let i=0;i<=bayCount;i++){
  const x=W*i/bayCount;
  for(let j=0;j<steps;j++){
   const z0=D*j/steps,z1=D*(j+1)/steps;
   beam([x,roofY(x,z0),z0],[x,roofY(x,z1),z1],.18,.65);
  }
 }
 for(let j=1;j<rows;j++){
  const z=D*j/rows;
  for(let i=0;i<bayCount;i++){
   const x0=W*i/bayCount,x1=W*(i+1)/bayCount;
   beam([x0,roofY(x0,z),z],[x1,roofY(x1,z),z],.17,.17);
  }
 }
 // Roof panel surfaces (screen or IRP, mixed roof at house side).
 const cols=bayCount,subRows=rows*2;
 for(let i=0;i<cols;i++)for(let j=0;j<subRows;j++){
  const x0=W*i/cols,x1=W*(i+1)/cols,z0=D*j/subRows,z1=D*(j+1)/subRows;
  const material=s.roof==='irp'||(s.roof==='mixed'&&z1<=Math.max(0,+s.irpDepth||0)+tiny)?irpMat:roofMat;
  plane([[x0,roofY(x0,z0)+tiny,z0],[x1,roofY(x1,z0)+tiny,z0],[x1,roofY(x1,z1)+tiny,z1],[x0,roofY(x0,z1)+tiny,z1]],material);
 }
 // Existing fascia and proposed gutter, conceptual attachment line only.
 if(s.gutterEnabled){
  beam([0,H,0],[W,H,0],.35,.55);
  for(let x of [0,W])beam([x,H,0],[x,0,0],.14,.14);
 }
 controls.target.set(W/2,H*.55,D/2);controls.update();
 const resize=()=>{
  if(dead)return;
  const w=Math.max(180,host.clientWidth||600),h=Math.max(200,host.clientHeight||330);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 };
 const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
 if(ro)ro.observe(host);resize();
 const lost=e=>{e.preventDefault();dead=true;};
 renderer.domElement.addEventListener('webglcontextlost',lost);
 function cleanup(){if(dead)return;dead=true;if(ro)ro.disconnect();controls.dispose();objects.forEach(o=>o.geometry.dispose());
  [frameMat,roofMat,wallMat,irpMat,houseMat,floorMat,...extraMaterials].forEach(m=>m.dispose());
  textures.forEach(t=>t.dispose());
  renderer.dispose();if(renderer.domElement.parentNode)renderer.domElement.parentNode.removeChild(renderer.domElement);
 }
 function loop(){if(dead)return;if(!host.isConnected){cleanup();return;}requestAnimationFrame(loop);controls.update();renderer.render(scene,camera);}
 loop();
 return {destroy:cleanup};
}
window.GSSV17Preview={mount};
})();
