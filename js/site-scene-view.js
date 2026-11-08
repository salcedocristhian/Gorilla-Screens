/* Existing house and proposed infill are independent scene groups; no takeoff writes. */
(function(){
'use strict';
const C=globalThis.GSSSiteSceneContract;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function outline(T,o){
 const p=new T.Shape(),l=o.x-o.width/2,r=o.x+o.width/2,b=o.bottom+0.00001,t=o.bottom+o.height;
 p.moveTo(l,b);p.lineTo(r,b);p.lineTo(r,t-o.archRise);
 if(o.type==='arch')for(let i=1;i<=32;i++){const a=i*Math.PI/32;p.lineTo(o.x+Math.cos(a)*o.width/2,t-o.archRise+Math.sin(a)*o.archRise);}
 else p.lineTo(l,t);
 p.lineTo(l,b);return p;
}
function viewer(host,data,infill){
 const T=window.THREE;if(!T||!T.OrbitControls){host.textContent='No se pudo cargar el visor 3D. Revisa tu conexión.';return ()=>{};}
 let renderer;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch(_){host.textContent='Este dispositivo no pudo iniciar el visor 3D.';return ()=>{};}
 const scene=new T.Scene(),house=new T.Group(),screens=new T.Group();house.name='existing-house';screens.name='proposed-screen';scene.add(house,screens);
 const materials=[new T.MeshStandardMaterial({color:0xe0d7c6,side:T.DoubleSide}),new T.MeshStandardMaterial({color:0x72513a,side:T.DoubleSide}),new T.MeshStandardMaterial({color:0xa7a7a3,side:T.DoubleSide}),new T.MeshStandardMaterial({color:0x372b23,transparent:true,opacity:.48,side:T.DoubleSide}),new T.LineBasicMaterial({color:0x35271e})];
 for(const n of data.nodes){
  let geometry;
  if(n.type==='wall'){
   const shape=new T.Shape(),w=n.size[0],h=n.size[1];shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w/2,h);shape.lineTo(-w/2,h);shape.closePath();
   for(const o of n.openings)shape.holes.push(new T.Path(outline(T,o).getPoints()));
   geometry=new T.ExtrudeGeometry(shape,{depth:n.size[2],bevelEnabled:false,curveSegments:24});geometry.translate(0,0,-n.size[2]/2);
  }else{geometry=new T.BoxGeometry(...n.size);geometry.translate(0,n.size[1]/2,0);}
  const mesh=new T.Mesh(geometry,materials[n.type==='roof'?1:n.type==='slab'?2:0]);mesh.position.set(...n.position);mesh.rotation.y=n.rotationY;house.add(mesh);
  if(infill)for(const o of n.openings.filter(o=>['arch','rect','door'].includes(o.type))){
   const group=new T.Group();group.position.copy(mesh.position);group.rotation.y=n.rotationY;screens.add(group);
   const shape=outline(T,o),panel=new T.Mesh(new T.ShapeGeometry(shape),materials[3]);panel.position.z=n.size[2]/2+.002;group.add(panel);
   const line=new T.Line(new T.BufferGeometry().setFromPoints(shape.getPoints(40).map(p=>new T.Vector3(p.x,p.y,n.size[2]/2+.003))),materials[4]);group.add(line);
  }
 }
 const box=new T.Box3().setFromObject(house),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),radius=Math.max(size.x,size.y,size.z,.2);
 const camera=new T.PerspectiveCamera(42,1,.001,200);camera.position.copy(center).add(new T.Vector3(radius*.85,radius*.5,radius*1.7));
 scene.add(new T.HemisphereLight(0xffffff,0x777777,1.4));const light=new T.DirectionalLight(0xffffff,.8);light.position.set(3,6,5);scene.add(light);
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));host.replaceChildren(renderer.domElement);
 const controls=new T.OrbitControls(camera,renderer.domElement);controls.target.copy(center);controls.enableDamping=true;
 const resize=()=>{const w=host.clientWidth||300,h=host.clientHeight||320;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};resize();
 const ro=new ResizeObserver(resize);ro.observe(host);let dead=false,frame;
 const stop=()=>{if(dead)return;dead=true;cancelAnimationFrame(frame);ro.disconnect();controls.dispose();scene.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
 const loop=()=>{if(dead)return;if(!host.isConnected){stop();return;}controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(loop);};loop();return stop;
}
function mount({project:p,photos,host,save,access,notify}){
 let stop=()=>{},controller=null;
 const eligible=photos.filter(x=>x.projectId===p.id&&x.cat!=='render');
 let chosen=window.GSSAiDesigner.recommendedPhotos(p.id,photos),selected=null,showScreens=false;
 function draw(){
  stop();
  const valid=C.belongsTo(p.siteScene,p.id,photos);let data=null;
  if(valid)try{data=C.normalize(p.siteScene,p.id,p.siteScene.evidencePhotoIds);}catch(_){}
  const n=data?.nodes.find(x=>x.id===selected)||data?.nodes[0];selected=n?.id;
  host.innerHTML='<section class="card ss-card"><span class="cap">CASA 3D · EXPERIMENTAL</span><h3>Reconstruir desde tus fotos</h3>'+
   '<p>Gemini propone superficies y aberturas en coordenadas relativas. Revisa la forma contra las fotos antes de diseñar encima.</p>'+
   '<details><summary>Fotos para reconstrucción ('+chosen.length+'/5)</summary><div class="ss-photos">'+eligible.map(ph=>'<label><input type="checkbox" data-ss-photo="'+esc(ph.id)+'" '+(chosen.includes(ph.id)?'checked':'')+'>'+esc(ph.cat)+'<img src="'+esc(ph.url)+'" alt="Evidencia del proyecto"></label>').join('')+'</div></details>'+
   '<label class="ss-consent"><input type="checkbox" data-ss-consent> Autorizo enviar estas fotos a Gemini para generar el modelo.</label>'+
   '<label class="ss-access">Acceso seguro del equipo<input type="password" data-ss-token autocomplete="off" placeholder="Código de Gorilla"></label>'+
   '<button class="btn" data-ss-build '+(!eligible.length?'disabled':'')+'>'+(data?'Volver a reconstruir':'Generar casa 3D')+'</button><p data-ss-status role="status"></p>'+
   (p.siteScene&&!data?'<p>El modelo guardado no tiene evidencia válida para este proyecto. Vuelve a generar con las fotos actuales.</p>':'')+
   (data?'<p class="ss-warning"><strong>Interpretación sin escala · pendiente de revisión.</strong> No son medidas reales ni geometría lista para fabricar.</p>'+
    '<div class="ss-view"></div><label><input type="checkbox" data-ss-screens '+(showScreens?'checked':'')+'> Superponer screen conceptual en aberturas (sin cotización)</label>'+
    '<label>Comparar con foto<select data-ss-compare>'+data.evidencePhotoIds.map(id=>'<option value="'+esc(id)+'">'+esc(photos.find(x=>x.id===id)?.cat)+' · '+esc(id.slice(0,8))+'</option>').join('')+'</select></label><img class="ss-reference" alt="Foto original para comparación">'+
    (n?'<details open><summary>Editar geometría relativa</summary><label>Elemento<select data-ss-node>'+data.nodes.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===n.id?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select></label><p>Evidencia: fotos '+n.evidencePhotoIndices.join(', ')+' · confianza '+esc(n.confidence)+'</p><form data-ss-edit><div class="ss-fields">'+
    ['X','Y','Z','Ancho','Alto','Espesor','Giro Y (rad)'].map((label,i)=>'<label>'+label+'<input required type="number" step="any" name="v'+i+'" value="'+([...n.position,...n.size,n.rotationY][i])+'"></label>').join('')+'</div>'+
    n.openings.map((o,j)=>'<fieldset><legend>'+esc(o.id)+' · '+esc(o.type)+'</legend><div class="ss-fields">'+['x','bottom','width','height','archRise'].map(k=>'<label>'+esc({x:'Centro X',bottom:'Base',width:'Ancho',height:'Alto',archRise:'Altura curva'}[k])+'<input required type="number" step="any" name="o'+j+'-'+k+'" value="'+o[k]+'" '+(k==='archRise'&&o.type!=='arch'?'readonly':'')+'></label>').join('')+'</div></fieldset>').join('')+
    '<button class="btn sec">Guardar geometría</button></form></details>':'<p>No hay superficies suficientemente respaldadas por las fotos.</p>')+
    '<ul>'+data.unknownConditions.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+'</section>';
  host.querySelector('[data-ss-token]').value=access.getToken();
  host.querySelector('[data-ss-token]').oninput=e=>access.setToken(e.target.value);
  host.querySelectorAll('[data-ss-photo]').forEach(el=>el.onchange=()=>{chosen=[...host.querySelectorAll('[data-ss-photo]:checked')].map(x=>x.dataset.ssPhoto);});
  host.querySelector('[data-ss-build]').onclick=async()=>{
   const status=host.querySelector('[data-ss-status]'),button=host.querySelector('[data-ss-build]');
   if(!host.querySelector('[data-ss-consent]').checked){status.textContent='Confirma la autorización de las fotografías.';return;}
   button.disabled=true;status.textContent='Gemini está interpretando la geometría…';controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);
   const ids=chosen.slice();
   try{
    const scene=await window.GSSVisionAPI.reconstruct({projectId:p.id,photos:ids.map(id=>photos.find(x=>x.id===id)),token:access.getToken(),url:access.getUrl(),signal:controller.signal});
    if(!host.isConnected) return;
    const current=await access.currentPhotos();if(!C.belongsTo(scene,p.id,current))throw Error('Cambió la evidencia durante el análisis. Vuelve a intentarlo.');
    const before=p.siteScene;p.siteScene=scene;
    try{await save();}catch(e){p.siteScene=before;throw e;}
    draw();notify?.('Modelo conceptual guardado. Compara la geometría con tus fotos.');
   }catch(e){status.textContent=e.message;}finally{clearTimeout(timer);button.disabled=false;controller=null;}
  };
  if(data){
   stop=viewer(host.querySelector('.ss-view'),data,showScreens);
   const compare=host.querySelector('[data-ss-compare]'),img=host.querySelector('.ss-reference');const update=()=>{img.src=photos.find(x=>x.id===compare.value)?.url||'';};compare.onchange=update;update();
   host.querySelector('[data-ss-screens]').onchange=e=>{showScreens=e.target.checked;draw();};
   host.querySelector('[data-ss-node]')?.addEventListener('change',e=>{selected=e.target.value;draw();});
   host.querySelector('[data-ss-edit]')?.addEventListener('submit',async e=>{
    e.preventDefault();const form=new FormData(e.target),copy=JSON.parse(JSON.stringify(data)),node=copy.nodes.find(x=>x.id===selected);
    const vals=Array.from({length:7},(_,i)=>Number(form.get('v'+i)));node.position=vals.slice(0,3);node.size=vals.slice(3,6);node.rotationY=vals[6];
    node.openings.forEach((o,j)=>['x','bottom','width','height','archRise'].forEach(k=>o[k]=Number(form.get('o'+j+'-'+k))));
    try{const next=C.normalize(copy,p.id,data.evidencePhotoIds),before=p.siteScene;p.siteScene=next;try{await save();}catch(err){p.siteScene=before;throw err;}draw();}
    catch(err){host.querySelector('[data-ss-status]').textContent=err.message;}
   });
  }
 }
 draw();return ()=>{stop();controller?.abort();};
}
window.GSSSiteSceneView={mount,viewer};
})();
