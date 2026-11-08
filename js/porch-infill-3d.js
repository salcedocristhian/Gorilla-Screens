/* Porch Infill 3D concept — derived ONLY from a same-project photograph's human-traced arches.
   All coordinates are normalized photo ratios, not feet or construction dimensions.
   Never mutates V17 engineering geometry, estimates, approvals, or the generic Mansard viewer. */
(function(){
'use strict';
const TINY=1e-5;
const limit=(v,min,max)=>Math.max(min,Math.min(max,v));
function fromTrace(project,photos){
 const trace=window.GSSPorchTrace?.read(project,photos);
 if(!trace||!trace.arches.length)return null;
 const photo=photos.find(p=>p.id===trace.photoId&&p.projectId===project.id&&p.url);
 if(!photo)return null;
 const arches=trace.arches.filter(a=>a.right>a.left&&a.top<a.spring&&a.spring<a.bottom).map(a=>({
   id:a.id,label:a.label,left:a.left,right:a.right,top:a.top,spring:a.spring,bottom:a.bottom,crown:a.crown,
   measured:false,structurallyVerified:false
 }));
 const sorted=arches.slice().sort((a,b)=>a.left-b.left);
 const overlap=sorted.some((a,i)=>i>0&&a.left<sorted[i-1].right);
 return {projectId:project.id,photoId:photo.id,arches,overlap,
   doorArchId:arches.some(a=>a.id===trace.conceptDoorArchId)?trace.conceptDoorArchId:'',
   finish:project?.studioV17?.finish==='bronze'?'bronze':'white',
   photoRelative:true,dimensionsVerified:false,roofAdded:false,depthVerified:false,
   takeoffEligible:false,approvalEligible:false};
}
function outline(a,aspect=1){
 // Match the two quadratic segments in Porch Trace's SVG. Do not "correct" architectural arches.
 const x=v=>((v/1000)-.5)*10*aspect;
 const y=v=>(1-v/1000)*10;
 const points=[[x(a.left),y(a.bottom)],[x(a.left),y(a.spring)]];
 const q=(p0,p1,p2,t)=>(1-t)*(1-t)*p0+2*(1-t)*t*p1+t*t*p2;
 for(let i=1;i<=16;i++){let t=i/16;points.push([x(q(a.left,a.left,a.crown,t)),y(q(a.spring,a.top,a.top,t))]);}
 for(let i=1;i<=16;i++){let t=i/16;points.push([x(q(a.crown,a.right,a.right,t)),y(q(a.top,a.top,a.spring,t))]);}
 points.push([x(a.right),y(a.bottom)]);
 return points;
}
function mount({host,project,photos}){
 if(!host)return {destroy(){}};
 const model=fromTrace(project,photos);
 if(!model){host.textContent='Primero traza los arcos usando una foto de este proyecto.';return {destroy(){}};}
 const photo=photos.find(p=>p.id===model.photoId&&p.projectId===project.id);
 let destroyed=false,frame=0,renderer=null,controls=null,scene=null;
 const materials=[],geometries=[],objects=[];
 function destroy(){
   destroyed=true;
   if(frame)cancelAnimationFrame(frame);
   if(controls)controls.dispose();
   for(const obj of objects)if(obj.parent)obj.parent.remove(obj);
   for(const g of geometries)g.dispose();
   for(const m of materials)m.dispose();
   if(renderer){renderer.dispose();renderer.forceContextLoss?.();renderer.domElement.remove();}
 }
 if(!window.THREE?.OrbitControls){
   host.textContent='Vista interactiva 3D no disponible en este dispositivo. El trazado 2D está conservado.';
   return {destroy};
 }
 const T=window.THREE;
 function addMaterial(m){materials.push(m);return m;}
 function addObject(geo,mat,x=0,y=0,z=0){
  geometries.push(geo);
  const mesh=new T.Mesh(geo,mat);mesh.position.set(x,y,z);scene.add(mesh);objects.push(mesh);return mesh;
 }
 function bar(a,b,radius,mat){
   const v1=new T.Vector3(...a),v2=new T.Vector3(...b),d=v2.clone().sub(v1);
   if(d.length()<TINY)return;
   const geo=new T.CylinderGeometry(radius,radius,d.length(),7);
   const mesh=addObject(geo,mat,(v1.x+v2.x)/2,(v1.y+v2.y)/2,(v1.z+v2.z)/2);
   mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());
 }
 function poly(points){const s=new T.Shape();s.moveTo(...points[0]);points.slice(1).forEach(p=>s.lineTo(...p));s.closePath();return s;}
 function build(aspect){
  if(destroyed)return;
  host.innerHTML='';
  renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setClearColor(0xe6eaf0,1);
  renderer.outputEncoding=T.sRGBEncoding;
  renderer.domElement.style.touchAction='none';
  renderer.domElement.setAttribute('aria-label','Modelo 3D conceptual de infill en arcos existentes, sin cubierta añadida');
  host.appendChild(renderer.domElement);
  scene=new T.Scene();scene.background=new T.Color(0xe6eaf0);
  const color=model.finish==='bronze'?0x302923:0xe9ebe6;
  const frameMat=addMaterial(new T.MeshStandardMaterial({color,metalness:.48,roughness:.42,side:T.DoubleSide}));
  const masonry=addMaterial(new T.MeshStandardMaterial({color:0xcdb9a5,roughness:.96,side:T.DoubleSide}));
  const meshMat=addMaterial(new T.MeshStandardMaterial({color:0x6d8790,transparent:true,opacity:.31,
    depthWrite:false,roughness:1,side:T.DoubleSide}));
  const doorMat=addMaterial(new T.MeshStandardMaterial({color:0x7f9ba5,transparent:true,opacity:.20,
    depthWrite:false,side:T.DoubleSide}));
  const g=model.arches.map(a=>({arch:a,pts:outline(a,aspect)}));
  const all=g.flatMap(x=>x.pts);
  const xmin=Math.min(...all.map(p=>p[0]))-.55,xmax=Math.max(...all.map(p=>p[0]))+.55;
  const ymin=Math.min(...all.map(p=>p[1]))-.13,ymax=Math.max(...all.map(p=>p[1]))+.65;
  const w=xmax-xmin,h=ymax-ymin,cx=(xmin+xmax)/2,cy=(ymin+ymax)/2;
  // The beige surface is schematic EXISTING wall, not a newly proposed structure.
  // Overlapping/invalid openings cannot be triangulated as a masonry wall.
  if(!model.overlap){
   const exterior=poly([[xmin,ymin],[xmax,ymin],[xmax,ymax],[xmin,ymax]]);
   g.forEach(({pts})=>{
     const holePoints=T.ShapeUtils.isClockWise(pts.map(p=>new T.Vector2(...p)))?pts.slice():pts.slice().reverse();
     const hole=new T.Path();hole.moveTo(...holePoints[0]);holePoints.slice(1).forEach(p=>hole.lineTo(...p));hole.closePath();
     exterior.holes.push(hole);
   });
   addObject(new T.ExtrudeGeometry(exterior,{depth:.19,steps:1,bevelEnabled:false,curveSegments:18}),masonry,0,0,-.29);
  }
  for(const {arch:a,pts} of g){
    const screen=addObject(new T.ShapeGeometry(poly(pts)),meshMat,0,0,.02);
    screen.renderOrder=2;
    // Screen spline follows the actual user-edited arch contour rather than a rectangular bay.
    const points=pts.map(p=>new T.Vector3(p[0],p[1],.07));
    points.push(points[0].clone());
    const spline=addObject(new T.TubeGeometry(new T.CatmullRomCurve3(points,false,'centripetal'),96,.025,5,false),frameMat);
    spline.renderOrder=3;
    // Door location is only a selectable concept; no nominal 36x80 dimensions are inferred.
    if(model.doorArchId===a.id){
      const x0=pts[0][0],x1=pts[pts.length-1][0],bottom=pts[0][1];
      const spring=(1-a.spring/1000)*10,top=(1-a.top/1000)*10;
      const dw=Math.max(.15,(x1-x0)*.44),dh=Math.max(.16,Math.min((spring-bottom)*.90,(top-bottom)*.68));
      const dx=(x0+x1)/2-dw/2,y0=bottom+.02,y1=y0+dh,z=.13;
      const door=addObject(new T.PlaneGeometry(dw,dh),doorMat,dx+dw/2,y0+dh/2,.055);
      door.renderOrder=4;
      bar([dx,y0,z],[dx,y1,z],.032,frame);bar([dx+dw,y0,z],[dx+dw,y1,z],.032,frame);
      bar([dx,y0,z],[dx+dw,y0,z],.027,frame);bar([dx,y1,z],[dx+dw,y1,z],.027,frame);
      // Hinge symbol and handle are intentionally schematic; door swing, latch and code are unverified.
      bar([dx+dw*.87,y0+dh*.47,z+.08],[dx+dw*.87,y0+dh*.53,z+.08],.02,frame);
    }
  }
  scene.add(new T.HemisphereLight(0xffffff,0x76818c,1.6));
  const sun=new T.DirectionalLight(0xffffff,1.35);sun.position.set(cx+w*.4,cy+h*.6,12);scene.add(sun);
  const camera=new T.PerspectiveCamera(40,1,.04,200);
  const fit=Math.max(w,h);
  camera.position.set(cx+fit*.15,cy+h*.13,fit*1.95);
  camera.lookAt(cx,cy,0);
  controls=new T.OrbitControls(camera,renderer.domElement);
  controls.target.set(cx,cy,0);controls.enableDamping=true;controls.dampingFactor=.075;
  controls.minDistance=fit*.7;controls.maxDistance=fit*4;controls.enablePan=false;
  controls.maxPolarAngle=Math.PI*.85;
  function animate(){
   if(destroyed||!renderer)return;
   const width=host.clientWidth||370,height=host.clientHeight||320;
   renderer.setSize(width,height,false);
   camera.aspect=width/height;camera.updateProjectionMatrix();
   controls.update();
   renderer.render(scene,camera);
   frame=requestAnimationFrame(animate);
  }
  animate();
  host.dataset.previewMode='porch-infill';
  host.dataset.projectId=project.id;
  host.dataset.photoId=photo.id;
  host.dataset.finish=model.finish;
  host.dataset.archCount=String(g.length);
  host.dataset.roofAdded='false';
  host.dataset.takeoffEligible='false';
  host.dataset.doors=String(model.doorArchId?1:0);
  if(model.overlap)host.dataset.overlapWarning='true';
 }
 const image=new Image();
 image.onload=()=>{if(!destroyed)try{build(limit(image.naturalWidth/Math.max(1,image.naturalHeight),.4,2.6));}catch(err){
   if(!destroyed)host.textContent='No se pudo mostrar el concepto 3D; el trazado 2D permanece guardado.';
 }};
 image.onerror=()=>{if(!destroyed)try{build(1);}catch(err){
   if(!destroyed)host.textContent='La vista 3D no pudo iniciarse; el trazado sigue guardado.';
 }};
 image.src=photo.url;
 return {destroy};
}
window.GSSPorchInfill3D={fromTrace,outline,mount};
})();
