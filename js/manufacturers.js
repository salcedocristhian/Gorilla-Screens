/* Gorilla Screen Studio — V15: manufacturer-grounded technical reference.
   Only records information in the user's two manuals. NOT engineering approval. */
(function(){'use strict';
const P={
 screenTight:{name:'Screen Tight — Screen Enclosures',manual:'docs/Screen_Enclosure_Instructions.pdf',
  profiles:[
   {type:'1x2',name:'1×2 Open Back',white:'WF128',bronze:'BF128',white10:'WF1210',bronze10:'BF1210',lengths:'8′ / 10′',gauge:'.040',pages:'1, 3'},
   {type:'2x2',name:'2×2 Double Channel',white:'WF228',bronze:'BF228',white10:'WF2210',bronze10:'BF2210',lengths:'8′ / 10′',gauge:'.040',pages:'1, 3'},
   {type:'2x3',name:'2×3 Framework',white:'WF238',bronze:'BF238',lengths:'8′',gauge:'.050',pages:'1, 3'}
  ],
  components:[['Capri Clip','BCCAF / WCCAF','Une marco lateral y superior','p. 1, 3'],['Castle Clip','BCCUF / WCCUF','Une 2×2 horizontal con un miembro vertical','p. 1, 3'],['Ángulo 2×2','BAA22 / WAA22','Conexión de base y costado','p. 1, 3'],['Gutter brace 1×1×6','WGBS6 (white)','Ejemplo de strap a poste; no es perfil de super gutter de 7″','p. 1, 3'],['Spline flat','0.310″','Compatible con ranuras de este sistema','p. 2'],['Anchors','BQSA2 / WQSA2','1/4″ × 2-1/4″; no asumir idoneidad estructural sin revisión','p. 1, 3'],['Kickplate','BRKPC16 / WKPC16','Kickplate opcional 16″ × 16′','p. 3']],
  steps:['Verificar sustrato y cotas reales antes de cortar','Definir orientación de canales y superficies de acceso','Construir marcos y conexiones según proyecto aprobado','Montar marco de puerta antes de cerrar paneles contiguos','Instalar malla con flat spline compatible; comprobar tensión','Sellar penetraciones y revisar drenaje y anclajes según diseño aprobado'],
  note:'El PDF incluye paneles de techo sólido de aluminio, NO un diseño estructural para techo de malla Mansard/Flat ni el perfil exacto del super gutter de 7″.'},
 ez:{name:'EZ Screen Room — Installation Guide',manual:'docs/EZ_Screen_Room_Installation.pdf',
  profiles:[{type:'1x2',name:'1×2 Open Back',lengths:'4′ / 8′ (kit)',gauge:'No indicado',pages:'4–5'},
            {type:'2x2',name:'2×2 Post, dual channels',lengths:'8′ (kit)',gauge:'No indicado',pages:'4–5, 20–25'}],
  components:[['Capri Clip','F2','Conexión de rail con posts','p. 4, 9, 20'],['Flat spline','S3','Spline de kit, no intercambiar sin confirmar ranura','p. 4–5, 12–16'],['Fastener self-tapping','F3','1/2″, kit','p. 4–5'],['Concrete fastener','F6','2-1/4″, kit','p. 5'],['Screen mesh','S1 / S2','Fiberglass, tamaños de rollo del kit','p. 4–5'],['Door frame posts','C1–C5','Kit de puerta 2×2, encabezado y jambas','p. 20–26']],
  steps:['Revisar medidas de opening (kit hasta 8′ de ancho y 10′ de alto)','Definir instalación de screen desde interior o exterior y alinear todos los canales','Planear puerta y montar su marco antes de completar screen wall','Instalar tramos inferiores y midrail (aprox. 36″ en ejemplo del manual)','Completar upright, top y bottom frame','Instalar malla y spline en la secuencia del manual'],
  note:'El manual ilustra ejemplos de aberturas rectangulares y hasta 8′×10′. No certifica la curva de los arcos existentes ni los techos Mansard.'}
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ft=n=>Number(n||0).toFixed(2)+' LF';
function archClearance(opening,installedWidth){
 const w=Math.max(0,Number(opening?.w||0)*12),h=Math.max(0,Number(opening?.h||0)*12), dw=Number(installedWidth||36);
 if(opening?.type!=='arch')return {maxH:h,available:w,valid:dw<=w};
 const r=w/2, spring=Math.max(0,h-r);return {maxH:dw<=w?spring+Math.sqrt(Math.max(0,r*r-(dw/2)*(dw/2))):0,available:w,valid:dw<=w};
}
function profileDiagram(type){
 const w=type==='1x2'?150:type==='2x3'?205:165; const h=type==='1x2'?86:type==='2x3'?190:150;
 // Visualization is a symbol; catalog technical cross section PDF is definitive.
 return `<svg viewBox="0 0 280 220" role="img" aria-label="Sección esquemática de perfil ${esc(type)}; no es CAD" style="width:100%;max-width:280px;height:210px"><g fill="none" stroke="var(--text,#1d1d1f)" stroke-width="8" stroke-linejoin="round"><path d="M50 27 H${50+w} V${27+h} H50 V27 Z"/><path d="M66 44 H${35+w} V${10+h} H66 Z" stroke-width="3" opacity=".4"/><path d="M50 48 h-14 v15 h14 M${50+w} 48 h14 v15 h-14"/>${type!=='1x2'?`<path d="M50 ${h+6} h-14 v15 h14 M${50+w} ${h+6} h14 v15 h-14"/>`:''}</g><text x="140" y="${Math.min(210,h+70)}" text-anchor="middle" fill="currentColor" font-size="13">${esc(type.toUpperCase())} · ESQUEMA, NTS</text></svg>`;
}
function profileTakeoff(project){
 if(project.approvedDrawing?.geometry && window.GSSPhotoEditor){return {mode:'from-approved',...window.GSSPhotoEditor.takeoff({items:project.approvedDrawing.geometry})};}
 return {mode:'estimate',byProfile:{},linearFt:0,doors:(project.openings||[]).filter(x=>x.door).length};
}
function render({project,host,save,back}){
 const selected=project.materialSystem==='ez'?'ez':'screenTight'; const vendor=P[selected];
 const vendorImages=selected==='ez'?[['ref-ezscreen-parts.webp','Isométricos y componentes del kit · manual p. 4'],['ref-ezscreen-doorframe.webp','Kit del marco de puerta · manual p. 21']]:[['ref-screentight-diagram.webp','Framework, clips, conectores y roof members · manual p. 1']];
 const take=profileTakeoff(project);
 const door=(project.openings||[]).find(o=>o.door);
 const nominal=project.doorSpec||{installedW:36,installedH:80,leafW:35,leafH:79};
 const meas=door?archClearance(door,nominal.installedW):null;
 const safe=meas?meas.valid&&meas.maxH>=nominal.installedH:false;
 const r=project.roofDesign||project.roofDraft||{};
 const rt=r.style||'flat';
 host.innerHTML=`<div class="ref-head"><div><p class="cap">LIBRERÍA TÉCNICA · PDF DE FABRICANTES</p><h1 class="h1">Perfiles y montaje</h1><p class="lead">Datos de catálogo como referencia; la ingeniería y el fabricante definitivo se verifican por proyecto.</p></div><button class="iconbtn" id="refBack" aria-label="Volver a medidas">✕</button></div>
 <div class="card"><div class="field"><label for="refVendor">Manual de referencia</label><select id="refVendor"><option value="screenTight" ${selected==='screenTight'?'selected':''}>Screen Tight · Screen Enclosures</option><option value="ez" ${selected==='ez'?'selected':''}>EZ Screen Room · Kit</option></select></div><a class="ref-manual" href="${vendor.manual}" target="_blank" rel="noopener">↗ Abrir PDF del fabricante</a><p class="lead smalltext">${esc(vendor.note)}</p><details class="ref-details"><summary>Ver diagramas originales del fabricante</summary>${vendorImages.map(([file,label])=>`<figure><img loading="lazy" src="assets/${file}" alt="${esc(label)}"><figcaption>${esc(label)}</figcaption></figure>`).join('')}</details></div>
 <div class="card"><p class="cap">SECCIONES · ALUMINIO</p><div class="ref-grid">${vendor.profiles.map(p=>`<button class="ref-profile" data-prof="${p.type}" aria-pressed="${(project.previewProfile||'1x2')===p.type}"><b>${esc(p.type.replace('x','×'))}</b><span>${esc(p.name)}</span></button>`).join('')}</div><div id="profVisual">${profileDiagram(project.previewProfile&&vendor.profiles.some(p=>p.type===project.previewProfile)?project.previewProfile:vendor.profiles[0].type)}</div><div id="profDetails"></div><p class="lead smalltext">Dibujo esquemático, no isométrico ni shop drawing del fabricante. Ver sección real en la página indicada.</p></div>
 <div class="card"><p class="cap">ACCESORIOS / CONEXIONES</p>${vendor.components.map(([name,sku,use,pg])=>`<div class="ref-row"><span><b>${esc(name)}</b><small>${esc(use)}</small></span><span class="ref-code">${esc(sku)}<br><small>${esc(pg)}</small></span></div>`).join('')}</div>
 <div class="card"><p class="cap">PUERTA · INSTALLED vs LEAF</p><p class="lead smalltext">Ejemplo EZ Screen: conjunto instalado 36″×80″, hoja aproximada 35″×79″ (págs. 18–24). No asuma estas medidas para otro sistema.</p><div class="ref-door-grid"><label>Conjunto ancho, in<input type="number" id="installedW" min="20" max="80" value="${nominal.installedW}"></label><label>Conjunto alto, in<input type="number" id="installedH" min="30" max="120" value="${nominal.installedH}"></label><label>Hoja ancho, in<input type="number" id="leafW" min="20" max="80" value="${nominal.leafW}"></label><label>Hoja alto, in<input type="number" id="leafH" min="30" max="120" value="${nominal.leafH}"></label></div><div id="refDoorResult"></div></div>
 <div class="card"><p class="cap">TAKEOFF · PERFILERÍA</p><p class="lead smalltext">${take.mode==='from-approved'?'Longitudes geométricas calculadas desde el dibujo aprobado; no es lista de corte final.':'Aprueba primero el dibujo 2D para obtener longitudes de perfiles; no se inventan cortes.'}</p><div class="ref-bom">${Object.entries(take.byProfile||{}).map(([k,v])=>`<div class="ref-row"><b>${esc(k)}</b><b>${ft(v)}</b></div>`).join('')||'<div class="ref-row">Sin perfiles aprobados.</div>'}<div class="ref-row"><b>Total geométrico</b><b>${ft(take.linearFt)}</b></div><div class="ref-row"><b>Puertas</b><b>${take.doors}</b></div>${project.gutter?.superOn?`<div class="ref-row"><b>Super gutter propuesto (perfil externo, sin ficha)</b><b>${ft(project.gutter.superLen)}</b></div>`:''}</div><p class="lead smalltext">La lista no incluye pérdidas por corte, curvado, accesorios, traslapes, fijaciones ni separación estructural.</p></div>
 <div class="card"><p class="cap">TECHO · REVISIÓN CONSTRUCTIVA</p><p><b>${esc(rt.toUpperCase())}</b> · Proyecto ${project.topScreen?.length||0}′ × ${project.topScreen?.depth||0}′</p><p class="lead smalltext">El manual Screen Tight describe techos sólidos con roof pans; NO certifica la configuración de techo de malla Flat, Mansard o Gable. Se requiere diseño de ingeniería para luces, cargas, anclajes, drenaje y sistema seleccionado.</p><div class="ref-row"><b>Super gutter de 7″</b><span class="ref-code">Ficha específica pendiente</span></div></div>
 <div class="card"><p class="cap">CHECKLIST · CONSTRUCCIÓN</p><p class="lead smalltext">Lista de control preliminar, no una inspección ni una certificación.</p><div id="refChecks">${vendor.steps.map((t,i)=>`<label class="ref-check"><input type="checkbox" data-ch="${i}" ${project.installChecks?.[selected]?.[i]?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div></div>`;
 host.querySelector('#refBack').onclick=back;
 host.querySelector('#refVendor').onchange=e=>{project.materialSystem=e.target.value;project.previewProfile='1x2';save();render({project,host,save,back});};
 const updateProfile=()=>{
  const t=project.previewProfile&&vendor.profiles.some(p=>p.type===project.previewProfile)?project.previewProfile:vendor.profiles[0].type;
  const x=vendor.profiles.find(p=>p.type===t),color=project.frameColor==='white'?'white':'bronze';
  host.querySelector('#profVisual').innerHTML=profileDiagram(t);
  host.querySelector('#profDetails').innerHTML=`<div class="ref-row"><span>Longitudes del catálogo</span><b>${esc(x.lengths)}</b></div><div class="ref-row"><span>Espesor nominal indicado</span><b>${esc(x.gauge)}</b></div><div class="ref-row"><span>SKU (${esc(color)})</span><b>${esc(x[color]||'No identificado en manual')}${x[color+'10']?' / '+esc(x[color+'10']):''}</b></div><div class="ref-row"><span>Fuente</span><b>${esc(x.pages)} · ${esc(vendor.name)}</b></div>`;
  host.querySelectorAll('[data-prof]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.prof===t)));
 };
 host.querySelectorAll('[data-prof]').forEach(b=>b.onclick=()=>{project.previewProfile=b.dataset.prof;save();updateProfile();});updateProfile();
 function updateDoor(){const n=project.doorSpec;const box=host.querySelector('#refDoorResult');if(!door){box.innerHTML='<p class="lead">El proyecto no tiene una puerta marcada en Medidas.</p>';return;}
  const c=archClearance(door,n.installedW),ok=c.valid&&c.maxH>=n.installedH-0.001;
  box.innerHTML=`<p class="${ok?'ref-ok':'warn'}">${door.type==='arch'?`Arco ${Math.round(door.w*12)}″ × ${Math.round(door.h*12)}″: altura máxima teórica de un marco rectangular de ${n.installedW}″ de ancho = <b>${c.maxH.toFixed(1)}″</b>.`:`Opening rect.: alto libre ${c.maxH.toFixed(1)}″.`} ${ok?'Ajuste geométrico teórico posible; verificar tolerancias y sustrato.':'No cabe la altura instalada solicitada con esta geometría. Requiere medición real / rediseño.'}</p>`;
 }
 ['installedW','installedH','leafW','leafH'].forEach(k=>host.querySelector('#'+k).onchange=e=>{
  project.doorSpec ||= {installedW:36,installedH:80,leafW:35,leafH:79};project.doorSpec[k]=Math.max(0,Number(e.target.value)||0);save();updateDoor();
 });updateDoor();
 host.querySelectorAll('[data-ch]').forEach(b=>b.onchange=e=>{project.installChecks ||= {};project.installChecks[selected] ||= {};project.installChecks[selected][b.dataset.ch]=b.checked;save();});
}
window.GSSManufacturer={catalog:P,archClearance,profileTakeoff,render};
})();
