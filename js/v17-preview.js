/* V17 isolated THREE.js conceptual framing viewer.
   Does not reuse the demonstration property's house geometry. */
(function(){
'use strict';
function mount(host,s){
 const T=window.THREE;
 if(!T||!T.OrbitControls)throw Error('THREE or OrbitControls not available.');
 const W=+s.width,D=+s.depth,H=+s.height;
 if(!(W>0&&D>0&&H>0))return {destroy(){}};
 const color=s.finish==='white'?0xe9ece9:0x3d3028;
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 renderer.outputEncoding=T.sRGBEncoding;
 renderer.setClearColor(0xe8edf0,1);
 host.innerHTML='';host.appendChild(renderer.domElement);renderer.domElement.style.touchAction='none';
 const scene=new T.Scene();scene.background=new T.Color(0xe9eef2);
 const camera=new T.PerspectiveCamera(40,1,.2,1000);
 const span=Math.max(W,D,H);
 camera.position.set(W*.9+span*.25,H*.85+span*.6,D*1.25+span*.7);
 camera.lookAt(W/2,H*.6,D/2);
 const controls=new T.OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.dampingFactor=.07;controls.maxPolarAngle=Math.PI*.49;
 controls.minDistance=Math.max(2,span*.25);controls.maxDistance=span*6;
 scene.add(new T.HemisphereLight(0xffffff,0x88939b,1.2));
 const sun=new T.DirectionalLight(0xffffff,.9);sun.position.set(W/2+20,H+28,D+12);scene.add(sun);
 const frameMat=new T.MeshStandardMaterial({color,metalness:.48,roughness:.47});
 const roofMat=new T.MeshStandardMaterial({color:0x7a9ba8,roughness:.75,metalness:.1,transparent:true,opacity:.18,side:T.DoubleSide,depthWrite:false});
 const wallMat=new T.MeshStandardMaterial({color:0x77a0ad,roughness:.6,transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false});
 const irpMat=new T.MeshStandardMaterial({color:0xd7dadd,roughness:.55,metalness:.15,transparent:true,opacity:.91,side:T.DoubleSide});
 const houseMat=new T.MeshStandardMaterial({color:0xbfc2bd,roughness:1,transparent:true,opacity:.52,side:T.DoubleSide});
 const floorMat=new T.MeshStandardMaterial({color:0xd7d5cc,roughness:1,side:T.DoubleSide});
 const objects=[];
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
 // Ground and an intentionally neutral reference attachment plane, not an invented house reconstruction.
 mesh(new T.PlaneGeometry(W+6,D+6),floorMat,W/2,-.04,D/2).rotation.x=-Math.PI/2;
 plane([[0,0,-.55],[W,0,-.55],[W,H+1.5,-.55],[0,H+1.5,-.55]],houseMat);
 for(let i=0;i<=bayCount;i++)beam([W*i/bayCount,0,D],[W*i/bayCount,H,D],.22,.4);
 for(let side of [0,W])for(let j=0;j<sideCount;j++)beam([side,0,D*j/sideCount],[side,H,D*j/sideCount],.22,.4);
 // Top two separate profiles: upper roof 2x2, lower wall spline 1x2, both front and sides.
 beam([0,H,D],[W,H,D],.18,.18);
 beam([0,H,0],[0,H,D],.18,.18);beam([W,H,0],[W,H,D],.18,.18);
 const lowerY=H-.20;
 beam([0,lowerY,D],[W,lowerY,D],.10,.12);
 beam([0,lowerY,0],[0,lowerY,D],.10,.12);beam([W,lowerY,0],[W,lowerY,D],.10,.12);
 const doorWidth=Math.min(W*.45,Math.max(0,+s.doorWidth||3)),doorH=Math.min(H,Math.max(0,+s.doorHeight||6.667));
 if(s.doorCount>0&&doorWidth>0){
  const dx=W*.5-doorWidth*.5;
  beam([dx,0,D],[dx,doorH,D],.17,.17);
  beam([dx+doorWidth,0,D],[dx+doorWidth,doorH,D],.17,.17);
  beam([dx,doorH,D],[dx+doorWidth,doorH,D],.17,.17);
  plane([[dx,0,D+.03],[dx+doorWidth,0,D+.03],[dx+doorWidth,doorH,D+.03],[dx,doorH,D+.03]],wallMat);
  // No bottom track under door.
  beam([0,.06,D],[dx,.06,D],.08,.12);
  beam([dx+doorWidth,.06,D],[W,.06,D],.08,.12);
 }else beam([0,.06,D],[W,.06,D],.08,.12);
 for(let x of [0,W])beam([x,.06,0],[x,.06,D],.08,.12);
 if(+s.chairHeight>0&&+s.chairHeight<H){
  const cy=+s.chairHeight;
  for(let side of [0,W])beam([side,cy,0],[side,cy,D],.17,.17);
  if(s.doorCount>0){const dx=W*.5-doorWidth*.5;beam([0,cy,D],[dx,cy,D],.17,.17);beam([dx+doorWidth,cy,D],[W,cy,D],.17,.17);}
  else beam([0,cy,D],[W,cy,D],.17,.17);
 }
 // Schematic screen mesh on the exterior walls.
 plane([[0,.06,D],[W,.06,D],[W,H,D],[0,H,D]],wallMat);
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
 let dead=false;
 const resize=()=>{
  if(dead)return;
  const w=Math.max(180,host.clientWidth||600),h=Math.max(200,host.clientHeight||330);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 };
 const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
 if(ro)ro.observe(host);resize();
 const lost=e=>{e.preventDefault();dead=true;};
 renderer.domElement.addEventListener('webglcontextlost',lost);
 function loop(){if(dead)return;requestAnimationFrame(loop);controls.update();renderer.render(scene,camera);}
 loop();
 return {destroy(){dead=true;if(ro)ro.disconnect();controls.dispose();objects.forEach(o=>o.geometry.dispose());
  [frameMat,roofMat,wallMat,irpMat,houseMat,floorMat].forEach(m=>m.dispose());
  renderer.dispose();if(renderer.domElement.parentNode)renderer.domElement.parentNode.removeChild(renderer.domElement);
 }};
}
window.GSSV17Preview={mount};
})();
