/* Gorilla Screen Studio V17 — on-device Design-to-Purchase workspace.
   Never issues supplier orders, claims AI photo reconstruction, or approves engineering. */
(function(){
'use strict';
const E=window.GSSV17Engine;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmt=n=>Number(n||0).toFixed(2)+' ft';
const download=(filename,blob)=>{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);};
let active='design',previousPreview=null;
function field(k,label,value,type='number',step='.25',extra=''){
 const props=type==='checkbox'?'type="checkbox" '+(value?'checked':''):'type="'+type+'" value="'+esc(value===null?'':value)+'" '+(type==='number'?'step="'+step+'" '+(k==='site-offsetX'?'':'min="0"'):'');
 return '<label class="v17-field"><span>'+esc(label)+'</span><input data-v17-key="'+esc(k)+'" '+props+' '+extra+'></label>';
}
function select(k,label,val,options){
 return '<label class="v17-field"><span>'+esc(label)+'</span><select data-v17-key="'+esc(k)+'">'+options.map(o=>'<option value="'+esc(o[0])+'" '+(String(o[0])===String(val)?'selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select></label>';
}
function action(name,text,kind='sec'){return '<button class="btn '+kind+'" data-v17-action="'+name+'">'+text+'</button>';}
function info(text){return '<div class="v17-note">'+text+'</div>';}

function visionReviewPanel(p,photos){
  const a=p.aiVision;
  if(!a)return '<div class="v17-note"><strong>AI Vision:</strong> Sin análisis importado. <a href="#/p/'+esc(p.id)+'/fotos">Abrir Fotos y analizar →</a></div>';
  const valid=window.GSSVision?.belongsTo(a,p.id,photos);
  const g=a.findings?.siteGeometry||{};
  const openings=Array.isArray(g.facadeOpenings)?g.facadeOpenings:[];
  const upper=Array.isArray(g.upperAttachmentZones)?g.upperAttachmentZones:[];
  const obs=[...(a.findings?.visibleHouseFeatures||[]),...(a.findings?.suggestedEnclosureDesign||[])].join(' ');
  const arches=/arch(?:es|ed)?|arcos?/i.test(obs) || openings.some(o=>/arch|arco/i.test(o.type||''));
  const porchCandidate=g.coveredPatio===true&&arches;
  const openingLines=openings.length?'<ol class="v17-evidence-list">'+openings.map(o=>
    '<li><strong>'+esc(o.id||o.type||'Opening')+'</strong> · '+esc(o.type||'unknown')+
    ' · '+esc(o.estimatedRelativePosition||'posición sin verificar')+
    ' · evidencia: '+esc((o.evidencePhotoIndices||[]).map(n=>'Foto '+n).join(', ')||'no identificada')+
    ' · <em>sin cotas verificadas</em></li>').join('')+'</ol>':
    (arches?'<p class="v17-attach-warning"><strong>Falta identificación individual de los arcos:</strong> Gemini describió la fachada, pero no entregó cada opening con evidencia fotográfica. No generar paneles ni tomar cantidades de este análisis.</p>':'<p>Sin openings documentados por foto; no se infieren aberturas.</p>');
  const upperLines=upper.length?'<p><strong>Interfaz superior/soffit:</strong> '+upper.map(o=>
    esc(o.observation||o.id||'Zona observada')+' (fotos: '+esc((o.evidencePhotoIndices||[]).join(', ')||'sin referencia')+')').join('; ')+
    '. <strong>Conexiones y cierres no verificados.</strong></p>':'';
  return '<div class="v17-note v17-ai-review" aria-label="AI Vision observations requiring review">'+
    '<strong>AI Vision · Pending human review</strong>'+
    '<p>Fotos vinculadas: '+(a.photoIds?.length||0)+' · '+esc(a.model||'Gemini')+
    ' · '+(valid?'Evidencia disponible':'⚠ Evidencia no disponible')+'</p>'+
    '<p>Techo observado: '+esc(g.houseRoofType||'sin confirmar')+
    ' · Piscina: '+(g.poolStatus==='observed-in-images'?'observada':'no confirmada')+'</p>'+
    (porchCandidate?'<p><strong>Alternativa a revisar: Porch Infill (porche cubierto con arcos).</strong> La cubierta ya existe según las fotos. El Mansard actual es un concepto genérico y NO representa el diseño de esta casa.</p>':'')+
    '<p><strong>Openings observados:</strong> '+openings.length+' registrados en JSON (no son medidas).</p>'+openingLines+upperLines+
    '<p>Attachment: '+esc(a.findings?.fasciaAndAttachmentObservations?.[0]||'por verificar')+'</p>'+
    '<p><strong>El análisis no cambia geometría, medidas, precios, takeoff ni aprobaciones.</strong> '+
    '<a href="#/p/'+esc(p.id)+'/fotos">Revisar hallazgos y evidencia en Fotos →</a></p></div>';
}
function siteReference(s,photos,p){
 const site=E.siteLayout(s),raw=s.site||{},photo=photos.find(x=>x.id===site.photoId);
 const available=photos.filter(x=>['porche','frente','west','east','south','site','street','detalles','aerea','openings','render'].includes(x.cat));
 const photoOptions=[['','Choose a project photo'],...available.map(x=>[x.id,({porche:'Patio / interior',frente:'Facade',west:'West',east:'East',south:'South / Rear',site:'AI Site',street:'Street',detalles:'Fascia / detail',aerea:'Aerial',openings:'Opening',render:'Render reference'}[x.cat]||x.cat)+' · '+new Date(x.createdAt).toLocaleDateString('en-US')])];
 const refStatus=site.estimated?'Reference dimensions estimated':'Field dimensions marked verified';
 const delta=(site.delta!==null&&Math.abs(site.delta)>.12)?
  '<div class="v17-note v17-attach-warning"><strong>Fascia connection mismatch: '+Math.abs(site.delta).toFixed(2)+' ft.</strong> Proposed enclosure height and existing fascia are different. Verify the actual attachment before releasing plans or purchasing.</div>':'';
 return '<section class="v17-site-reference" aria-label="Existing house reference">'+
   '<div class="v17-site-header"><div><span class="cap">EXISTING SITE · REFERENCE ONLY</span><p>Diseña el enclosure sobre la casa, sin modelar la vivienda pieza por pieza.</p></div>'+
   '<label class="v17-site-switch"><input type="checkbox" data-v17-site="enabled" '+(site.enabled?'checked':'')+'><span>Show house</span></label></div>'+
   (!available.length?'<p class="v17-note">Todavía no hay fotos del proyecto. <a href="#/p/'+esc(p.id)+'/fotos">Agrega una foto del patio o de la fachada en Fotos</a>. La geometría no se inventa.</p>':'')+
   visionReviewPanel(p,photos)+
   '<div class="v17-site-primary">'+
   (photo?'<img class="v17-site-thumb" src="'+esc(photo.url)+'" alt="Fotografía real seleccionada del proyecto">':'<div class="v17-site-thumb v17-site-empty">No site photo</div>')+
   '<label class="v17-field v17-site-photo-field"><span>Site photo · from this project</span>'+
   '<select data-v17-site="photoId">'+photoOptions.map(o=>'<option value="'+esc(o[0])+'" '+(o[0]===site.photoId?'selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select></label></div>'+
   '<details class="v17-site-more"><summary>Adjust house reference / fascia connection <span>⌄</span></summary>'+
   '<div class="v17-fields">'+
   field('site-houseWidth','House facade width · ft (0 = estimate)',raw.houseWidth)+
   field('site-houseDepth','House depth · ft (0 = estimate)',raw.houseDepth)+
   field('site-fasciaHeight','Existing fascia elevation · ft',raw.fasciaHeight)+
   field('site-offsetX','House horizontal offset · ft',raw.offsetX,'number','.25')+
   select('site-roofType','Existing house roof sketch',raw.roofType,[['flat','Flat'],['gable','Gable'],['hip','Hip (simplified)']])+
   field('site-roofRise','Roof rise sketch · ft',raw.roofRise)+
   '</div><div class="v17-checkrow">'+
   field('site-showPhoto','Project photo on facade plane',raw.showPhoto,'checkbox')+
   field('site-verified','House attachment dimensions verified on site',raw.verified,'checkbox')+
   '</div><div class="v17-btnrow">'+action('snap','Match enclosure height to fascia')+'</div>'+
   '<p class="lead smalltext">The facade photograph is mapped to a flat reference plane. It is not photogrammetric reconstruction, a survey, or an engineering design. Confirm where the actual fascia, supports and slab occur.</p>'+
   '</details>'+
   '<div class="v17-site-foot"><span>● '+esc(refStatus)+'</span><span>House model excluded from enclosure takeoff</span></div>'+
   delta+
   '</section>';
}
function design(s,r,p,photos){
 const types=[['mansard','Mansard'],['flat','Flat screen'],['gable','Gable'],['irp','IRP Solid'],['mixed','Mixed IRP + Screen']];
 const profileOptions=vals=>vals.map(v=>[v,v.replace('x','×')]);
 return '<div class="v17-grid"><section class="card"><div class="v17-cardhead"><div><div class="cap">LIVE GEOMETRY</div><h2>Enclosure · 3D</h2></div><span class="v17-pill">Concept design</span></div>'+
   '<div id="v17-preview" class="v17-stage"><div class="v17-stage-empty">Introduce ancho, profundidad y altura para visualizar la estructura.</div></div>'+
   siteReference(s,photos,p)+
   '<div class="v17-metrics"><div><b>'+fmt(r.geometry.W)+'</b><small>Front width</small></div><div><b>'+fmt(r.geometry.D)+'</b><small>Depth</small></div><div><b>'+fmt(r.geometry.H)+'</b><small>Wall height</small></div></div>'+
   info('Perfiles y conexiones son presets geométricos, sujetos a ingeniería de viento, anclajes y cimentación. Ninguna cota se infiere de las fotos.')+
   '</section><div><section class="card"><div class="cap">01 · DATOS DEL ENCLOSURE</div>'+
   '<div class="v17-fields">'+field('width','Front wall · feet',s.width)+field('depth','Depth · feet',s.depth)+field('height','Height · feet',s.height)+
   select('roof','Roof type',s.roof,types)+select('finish','Aluminum finish',s.finish,[['white','White'],['bronze','Dark Bronze']])+
   select('mesh','Screen mesh',s.mesh,['Standard 18x14 fiberglass','No-See-Um','Pet Screen','Privacy Screen'].map(x=>[x,x]))+
   field('wallTarget','Target wall bay · feet',s.wallTarget)+field('roofTarget','Target roof grid · feet',s.roofTarget)+
   ((s.roof==='mansard'||s.roof==='gable')?field('mansardRise','Roof rise · feet',s.mansardRise):'')+
   (s.roof==='mansard'?field('mansardInset','Mansard inset · feet',s.mansardInset):'')+
   (s.roof==='mixed'?field('irpDepth','Solid IRP depth · feet',s.irpDepth):'')+
   '</div><div class="v17-checkrow">'+field('verified','I verified these measurements on site',s.verified,'checkbox')+'</div></section>'+
   '<section class="card"><div class="cap">02 · FRAMING & FEATURES</div><div class="v17-fields">'+
   select('postProfile','Wall posts',s.postProfile,profileOptions(['2x3','2x4','2x5','2x6','2x7','2x8']))+
   select('beamProfile','Big beams · house to front',s.beamProfile,profileOptions(['2x6','2x8','2x10']))+
   select('crossProfile','Secondary roof traverses',s.crossProfile,profileOptions(['2x2','2x3','2x4']))+
   select('topRoofProfile','Upper roof spline / beam receiver',s.topRoofProfile,profileOptions(['2x2','2x3','2x4']))+
   select('topWallProfile','Lower wall spline channel',s.topWallProfile,profileOptions(['1x2','2x2']))+
   select('chairProfile','Chair rail profile',s.chairProfile,profileOptions(['2x2','2x3']))+
   field('chairHeight','Chair rail height · feet (0 = off)',s.chairHeight)+
   field('doorCount','Screen doors · quantity',s.doorCount,'number','1')+
   field('doorWidthIn','Door width · inches',Math.round(s.doorWidth*12),'number','1')+field('doorHeightIn','Door height · inches',Math.round(s.doorHeight*12),'number','1')+
   select('doorBay','Door position · front wall',s.doorBay??'',[['','Auto · central bay'],...Array.from({length:r.geometry.frontBays},(_,i)=>[i,'Panel '+(i+1)+' · from left'])])+
   select('doorHinge','Hinges · viewed from outside',s.doorHinge,[['left','Left · default'],['right','Right']])+
   select('doorSwing','Door swing',s.doorSwing,[['outward','Outward · default'],['inward','Inward']])+

   select('gutterSize','Super gutter size',s.gutterSize,[[5,'5 inches'],[7,'7 inches']])+
   field('downspouts','Downspouts · quantity',s.downspouts,'number','1')+
   '</div><div class="v17-checkrow">'+field('pictureView','Picture View · preliminary opening mode',s.pictureView,'checkbox')+
   field('gutterEnabled','Include house fascia super gutter',s.gutterEnabled,'checkbox')+
   field('doorOpen','Show door open in 3D (60°)',s.doorOpen,'checkbox')+'</div>'+
   (E.doorLayout(s).issues.length?info('<strong>Door needs adjustment:</strong> '+E.doorLayout(s).issues.map(esc).join(' ')):'')+
   info('Default: top horizontal 2×2 for roof screen framing, immediately below 1×2 for wall screen — on front AND side walls. Profile lengths are counted independently.')+
   '<div class="v17-metrics"><div><b>'+r.geometry.frontBays+'</b><small>Front bays</small></div><div><b>'+r.geometry.postCount+'</b><small>Posts (concept)</small></div><div><b>'+r.geometry.meshArea+' ft²</b><small>Mesh area (gross)</small></div></div></section></div></div>';
}
function photo(s,photos){
 const m=s.match;const choices=photos.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.cat+' · '+new Date(x.createdAt).toLocaleDateString('en-US'))+'</option>').join('');
 const before=photos.find(x=>x.id===m.before)||photos.find(x=>['frente','porche','street'].includes(x.cat));
 const after=photos.find(x=>x.id===m.after)||photos.find(x=>x.cat==='render');
 if(before&&!m.before)m.before=before.id;if(after&&!m.after)m.after=after.id;
 const split=E.round(m.split);
 return '<section class="card"><div class="v17-cardhead"><div><div class="cap">PHOTO MATCH STUDIO</div><h2>Before / After</h2></div><span class="v17-pill">Manual alignment · V17</span></div>'+
   info('Selecciona una foto real y un render del MISMO proyecto, con una perspectiva similar. El slider compara ambas imágenes. Photo Match automático con IA aún requiere un servicio externo.')+
   '<div class="v17-fields"><label class="v17-field"><span>Before · real photo</span><select data-v17-match="before"><option value="">Select photo</option>'+choices+'</select></label>'+
   '<label class="v17-field"><span>After · 3D render</span><select data-v17-match="after"><option value="">Select render</option>'+choices+'</select></label></div>'+
   (before&&after?'<div class="v17-compare" id="v17-compare"><img src="'+esc(before.url)+'" alt="Before photo">'+
      '<img class="v17-after" src="'+esc(after.url)+'" alt="Proposed render" style="clip-path:inset(0 0 0 '+split+'%);transform:translate('+E.round(m.x)+'px,'+E.round(m.y)+'px) scale('+(E.round(m.scale)/100)+')">'+
      '<div class="v17-splitline" style="left:'+split+'%"><span>↔</span></div><span class="v17-photo-label left">BEFORE</span><span class="v17-photo-label right">AFTER</span></div>':
      '<div class="v17-placeholder">Add real site photos and an image categorized “Render propuesto” in the Fotos tab to enable this comparison.</div>')+
   '<div class="v17-sliders"><label>Reveal <strong id="v17-splitval">'+split+'%</strong><input data-v17-match="split" type="range" min="0" max="100" value="'+split+'"></label>'+
   '<label>Render scale <strong>'+E.round(m.scale)+'%</strong><input data-v17-match="scale" type="range" min="60" max="160" value="'+E.round(m.scale)+'"></label>'+
   '<div class="v17-fields">'+field('matchX','Offset X · pixels',m.x,'number','1')+field('matchY','Offset Y · pixels',m.y,'number','1')+'</div></div>'+
   '<p class="lead smalltext">Si el render no proviene de una cámara calibrada, el resultado es una comparativa visual, no una superposición geométricamente verificada.</p></section>';
}
function deliverables(s,r,photos){
 const ready=r.geometry.valid,hasAerial=photos.some(x=>x.cat==='aerea');
 return '<section class="card"><div class="cap">DELIVERABLES STUDIO · 11×17</div><h2>Document Package</h2>'+
   '<p class="lead">Tres entregables siguiendo la presentación de proyectos profesionales; se generan a partir de medidas ingresadas, nunca de cotas inventadas.</p>'+
   '<div class="v17-docgrid"><article><div class="v17-docpreview"><svg viewBox="0 0 160 100"><g fill="none" stroke="currentColor" stroke-width="1.1"><rect x="18" y="18" width="100" height="60"/><path d="M18 50H118M38 18V78M58 18V78M78 18V78M98 18V78M8 85H130M8 12H130"/></g></svg></div><h3>01 Engineering & Plans</h3><p>Footprint, elevations, roof grid, framing schedule, dimensions, profiles and notes.</p></article>'+
   '<article><div class="v17-docpreview"><svg viewBox="0 0 160 100"><g fill="none" stroke="currentColor" stroke-width="1.4"><path d="M26 35L102 18L141 43L63 62Z M26 35V78L63 94V62 M141 43V82L63 94 M102 18V65 M53 29V90M79 24V89M117 27V82"/></g></svg></div><h3>02 Layout Visualization</h3><p>3D editable framing, photo-match references and an illustrative enclosure view.</p></article>'+
   '<article><div class="v17-docpreview"><svg viewBox="0 0 160 100"><g fill="none" stroke="currentColor" stroke-width="1.1"><path stroke-dasharray="3 2" d="M10 10H151V89H10Z"/><rect x="29" y="29" width="86" height="43"/><path d="M50 29V72 M29 52H115 M10 95H150"/></g></svg></div><h3>03 Site Planning</h3><p>Proposed footprint and survey/aerial reference; actual lot lines and setbacks require a valid survey.</p></article></div>'+
   '<div class="v17-btnrow">'+action('pdf','↓ Generate Conceptual PDF','')+action('csv','↓ Export Cutting Plan CSV')+'</div>'+
   info((ready?'Geometry is entered. ':'Enter dimensions first. ')+(s.verified?'Field measurements marked verified. ':'Unverified measurements are labeled on export. ')+(hasAerial?'Aerial reference available.':'No project aerial: no property boundary will be inferred.'))+
   '<p class="lead smalltext"><strong>Not for permitting:</strong> No sealed engineering, structural analysis, survey or AHJ approvals are produced by this module.</p></section>';
}
function purchasing(s,r,p){
 const status=E.orderStatus(s,p),unsupported=(s.pictureView||s.roof==='irp'||s.roof==='mixed'),ready=r.geometry.valid&&s.verified&&!r.unresolved.length&&!unsupported,priced=E.price(s,r);
 const table=r.rows.length?'<div class="v17-tablewrap"><table class="v17-table"><thead><tr><th>Profile / finish</th><th>Net LF</th><th>Commercial bars</th><th>Price / LF</th></tr></thead><tbody>'+
    r.rows.map(row=>{
      const grouped={};row.bars.forEach(b=>{const key=String(b.length);grouped[key]=(grouped[key]||0)+1;});
      return '<tr><td><b>'+esc(row.profile)+'</b><small>'+esc(s.finish==='white'?'White':'Dark Bronze')+'</small></td><td>'+row.footage.toFixed(1)+'</td><td>'+
        Object.entries(grouped).map(([len,qty])=>esc(qty+' × '+len+' ft')).join('<br>')+
        (row.reserves?' <small>('+row.reserves+' reserve)</small>':'')+'</td><td><input class="v17-cost" data-v17-cost="'+esc(row.profile)+'" type="number" min="0" step=".01" placeholder="Not set" value="'+esc(s.costs[row.profile]??'')+'"></td></tr>';
    }).join('')+'</tbody></table></div>':'<div class="v17-placeholder">Enter project dimensions to calculate commercial stock.</div>';
 const priceTxt=priced?'<div class="v17-price"><span>Calculated selling price</span><strong>'+money(priced.sellingPrice)+'</strong><small>Estimated materials '+money(priced.material)+' · labor '+money(priced.labor)+' · overhead '+money(priced.overhead)+'</small></div>':info('Pricing incomplete. Add verified supplier cost per purchased LF, labor, overhead and target gross margin. No default price will be invented.');
 const statusClass=status==='APPROVED'?'v17-success':status==='OUTDATED'?'v17-warning':'';
 return '<section class="card"><div class="v17-cardhead"><div><div class="cap">TAKEOFF → PROCUREMENT</div><h2>Material Purchase List</h2></div><span class="v17-pill '+statusClass+'">'+status+'</span></div>'+
   '<div class="v17-fields">'+select('supplier','Supplier',s.supplier,[['Town & Country / ABC Outdoor Solutions','Town & Country / ABC Outdoor Solutions'],['Lansing Building Products','Lansing Building Products'],['Other','Other / Custom']])+
   field('waste','Reserve allowance · %',s.waste,'number','1')+
   field('stock24','Commercial stock A · ft',s.stocks[0]||24)+field('stock30','Commercial stock B · ft',s.stocks[1]||30)+
   field('supplierPhone','Supplier phone (enter actual number)',s.supplierPhone,'tel')+
   field('supplierEmail','Supplier email (enter actual address)',s.supplierEmail,'email')+'</div>'+
   '<div class="v17-metrics"><div><b>'+r.rows.length+'</b><small>Profile types</small></div><div><b>'+r.rows.reduce((t,x)=>t+x.bars.length,0)+'</b><small>Commercial bars</small></div><div><b>'+fmt(r.rows.reduce((t,x)=>t+x.purchased,0))+'</b><small>Purchase length</small></div></div>'+
   table+(r.unresolved.length?info('<b>BLOCKED:</b> '+r.unresolved.length+' continuous pieces exceed configured commercial stock. Confirm lengths, approved splices or an alternate supplier; do not order automatically.'):'')+
   (unsupported?info('<b>PRELIMINARY ONLY:</b> Picture View or solid IRP roof requires an engineered profile/connection or panel schedule before its purchasing list can be approved. The current takeoff is not complete for that system.'):'')+
   (E.doorLayout(s).issues.length?info('<b>DOOR FIT ERROR:</b> '+E.doorLayout(s).issues.map(esc).join(' ')+' Correct the opening before approving a cut list.'):'')+
   '<div class="v17-btnrow">'+action('csv','↓ Export full cutting plan CSV')+action('approve','✓ Approve purchase list','')+'</div>'+
   '<hr class="v17-rule"><div class="cap">ESTIMATE · PRIVATE COMPANY RATES</div><div class="v17-fields">'+field('laborPerSqft','Labor · $ per developed ft²',s.laborPerSqft)+
   field('overhead','Overhead / equipment / permits · $',s.overhead)+field('targetMargin','Target gross margin · %',s.targetMargin,'number','1')+'</div>'+priceTxt+
   '<hr class="v17-rule"><div class="cap">MANUAL PURCHASE HANDOFF</div>'+
   (status==='OUTDATED'?info('<b>Outdated order:</b> project geometry, profiles or verification changed. Recalculate and approve again before preparing the email.'):'')+
   '<p class="lead smalltext">Gorilla never places a real order. Approval is local and only unlocks a draft email/call. A human must check quantities, pricing, specifications and the vendor quotation.</p>'+
   '<div class="v17-btnrow">'+action('email','↗ Prepare supplier email')+action('phone','☎ Call supplier')+'</div></section>';
}
function generateCSV(s,r,p){
 const header=['Supplier,Profile,Finish,Stock length ft,Bar #,Cut lengths ft,Offcut ft,Reserve'];
 const rows=[];r.rows.forEach(group=>group.bars.forEach((bar,i)=>{
  const v=[s.supplier,group.profile,s.finish,String(bar.length),String(i+1),bar.cuts.map(c=>c.length.toFixed(2)+' ('+c.use+')').join(' | '),String(bar.remaining),bar.reserve?'YES':'NO'];
  rows.push(v.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(','));
 }));
 return new Blob(['# Preliminary cutting list; unengineered profiles, supplier lengths require verification\n'+header.concat(rows).join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'});
}
async function generatePDF(p,s,r,photos){
 if(!r.geometry.valid)throw Error('Enter width, depth and height first.');
 if(!window.jspdf?.jsPDF)throw Error('PDF library is not loaded.');
 const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'in',format:[11,17],compress:true});
 const G=r.geometry,black=[34,40,50],grey=[109,117,128],blue=[31,80,141],ft=(x)=>Number(x).toFixed(2)+' ft';
 let page=0;
 function txt(str,x,y,size=9,bold=false,color=black){doc.setTextColor(...color);doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.text(String(str).replace(/[^\x20-\x7E]/g,'-'),x,y);}
 function line(x1,y1,x2,y2){doc.setDrawColor(...black);doc.setLineWidth(.012);doc.line(x1,y1,x2,y2);}
 function sheet(no,title){
  if(page++)doc.addPage();doc.setDrawColor(...grey);doc.rect(.35,.35,16.3,10.3);
  line(13.5,.35,13.5,10.65);txt('GORILLA SCREEN STUDIO',.66,.8,17,true,blue);
  txt(title,.66,1.13,12,true);txt('PRELIMINARY CONCEPT / NOT FOR PERMIT',.66,1.37,8,true,[170,62,39]);
  txt('PROJECT',13.75,.95,9,true);const addr=(p.address||'Address not entered').slice(0,35);
  doc.setFontSize(8);doc.setTextColor(...grey);doc.text(doc.splitTextToSize(addr,2.4),13.75,1.22);
  txt('CLIENT',13.75,1.92,9,true);txt((p.client?.name||'Not entered').slice(0,30),13.75,2.18,8);
  txt('DIMENSION STATUS',13.75,2.88,9,true);txt(s.verified?'FIELD-VERIFIED (USER ATTESTED)':'ESTIMATED / NOT VERIFIED',13.75,3.14,7,true);
  txt('REVISION',13.75,3.77,9,true);txt('V17 / '+s.revision,13.75,4.04,8);
  txt('DISCLAIMER',13.75,5.05,9,true);
  const lines=doc.splitTextToSize('No engineered spans, footing, anchors, wind loads, property boundary or setbacks are approved or established by this conceptual drawing.',2.35);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(lines,13.75,5.38);
  txt(no,15.5,10.3,20,true);txt(new Date().toLocaleDateString('en-US'),13.75,9.65,8);
 }
 function rectFrame(x,y,w,h){doc.setDrawColor(...black);doc.setLineWidth(.018);doc.rect(x,y,w,h);}
 sheet('A-101','ENCLOSURE PLAN / FRONT ELEVATION');
 const boxX=1.25,boxY=2,scale=Math.min(9/Math.max(G.W,.1),3.1/Math.max(G.D,.1)),w=G.W*scale,d=G.D*scale;
 rectFrame(boxX,boxY,w,d);for(let i=1;i<G.frontBays;i++)line(boxX+w*i/G.frontBays,boxY,boxX+w*i/G.frontBays,boxY+d);
 txt('HOUSE / FASCIA',boxX,boxY-.17,9);txt('FRONT '+ft(G.W),boxX,boxY+d+.24,9,true);txt('DEPTH '+ft(G.D),boxX+w+.2,boxY+d/2,9);
 let ey=6.4,ew=Math.min(9.3,G.W*scale),eh=2.6;rectFrame(boxX,ey,ew,eh);
 for(let i=1;i<G.frontBays;i++)line(boxX+ew*i/G.frontBays,ey,boxX+ew*i/G.frontBays,ey+eh);
 const elDoors=E.doorLayout(s);
 const doorBottom=ey+eh,doorScale=ew/G.W;
 const chairY=doorBottom-eh*Math.min(G.H,Math.max(0,Number(s.chairHeight)))/G.H;
 if(s.chairHeight>0&&s.chairHeight<G.H) {
   let from=0;
   for(const door of elDoors.placements){
     if(door.x0>from)line(boxX+from*doorScale,chairY,boxX+door.x0*doorScale,chairY);
     from=door.x1;
   }
   if(from<G.W)line(boxX+from*doorScale,chairY,boxX+ew,chairY);
 }
 elDoors.placements.forEach(door=>{
   const dx0=boxX+door.x0*doorScale,dx1=boxX+door.x1*doorScale;
   const header=doorBottom-eh*door.height/G.H;
   // A real open threshold: 2x2 jambs, a 2x2 header and door leaf frame inside one bay.
   line(dx0,header,dx0,doorBottom);line(dx1,header,dx1,doorBottom);line(dx0,header,dx1,header);
   const inset=Math.min((dx1-dx0)*.04,.04);
   doc.setLineWidth(.008);
   doc.rect(dx0+inset,header+inset,(dx1-dx0)-2*inset,(doorBottom-header)-2*inset);
   const handleX=s.doorHinge==='right'?dx0+inset*2:dx1-inset*2;
   line(handleX,header+(doorBottom-header)*.51,handleX,header+(doorBottom-header)*.57);
 });

 txt('FRONT ELEVATION - '+ft(G.W)+' x '+ft(G.H),boxX,ey+eh+.25,10,true);
 txt('TOP: '+s.topRoofProfile+' roof / '+s.topWallProfile+' wall spline - counted separately',boxX,10,8);
 sheet('A-102','ROOF FRAMING / PROFILE SCHEDULE');
 const rx=1.15,ry=2.1,rs=Math.min(10/Math.max(G.W,.1),5.7/Math.max(G.D,.1)),rw=G.W*rs,rd=G.D*rs;
 rectFrame(rx,ry,rw,rd);
 for(let i=1;i<G.frontBays;i++)line(rx+rw*i/G.frontBays,ry,rx+rw*i/G.frontBays,ry+rd);
 for(let j=1;j<G.roofRows;j++)line(rx,ry+rd*j/G.roofRows,rx+rw,ry+rd*j/G.roofRows);
 txt('HOUSE SUPER GUTTER / CONNECTION - FIELD VERIFY',rx,ry-.25,8);
 txt('FRONT RECEIVER: '+s.topRoofProfile,rx,ry+rd+.3,9,true);
 txt('ROOF TYPE '+s.roof.toUpperCase()+'   | BIG BEAM '+s.beamProfile+'   | TRAVERSE '+s.crossProfile,rx,9.1,11,true);
 txt('Roof panel target ~'+s.roofTarget+' ft; framing schematic only. Engineer must check spans and sections.',rx,9.5,8);
 sheet('SP-101','SITE PLAN / EXISTING HOUSE + PROPOSED ENCLOSURE');
 txt('CONCEPTUAL RELATIVE LAYOUT / NOT A PROPERTY SURVEY',.9,1.92,11,true,[170,62,39]);
 txt('No lot boundaries or setbacks inferred. Verify house fascia, slab, footing and attachments.',.9,2.23,9);
 const existing=E.siteLayout(s),hasHouse=existing.enabled;
 const leftLimit=hasHouse?Math.min(0,existing.x0):0;
 const rightLimit=hasHouse?Math.max(G.W,existing.x1):G.W;
 const extent=G.D+(hasHouse?existing.depth:0);
 const planScale=Math.min(9.8/Math.max(.01,rightLimit-leftLimit),5.15/Math.max(.01,extent));
 const originX=1.5-leftLimit*planScale,connectY=3.05+(hasHouse?existing.depth:0)*planScale;
 if(hasHouse){
   doc.setDrawColor(...grey);doc.setFillColor(224,225,222);
   doc.rect(originX+existing.x0*planScale,connectY-existing.depth*planScale,
     existing.width*planScale,existing.depth*planScale,'FD');
   txt('EXISTING HOUSE - REFERENCE ONLY',originX+existing.x0*planScale,connectY-existing.depth*planScale-.12,8,true);
 }
 doc.setDrawColor(...blue);doc.setLineWidth(.034);
 doc.rect(originX,connectY,G.W*planScale,G.D*planScale);
 doc.line(originX,connectY,originX+G.W*planScale,connectY);
 txt('FASCIA / SUPER GUTTER CONNECTION',originX,connectY-.15,8,true,blue);
 txt('PROPOSED ENCLOSURE',originX+.09,connectY+.33,9,true,blue);
 txt(ft(G.W)+' x '+ft(G.D)+'  | '+G.footprint+' sq ft',originX,connectY+G.D*planScale+.28,9);
 txt(hasHouse?'Existing facade/photo positioning remains conceptual.':'No house context selected. Add a project-owned house photo in Studio.',.9,8.98,8);
 txt('Actual survey, zoning setbacks and true roof/footing layout require field and engineering review.',.9,9.33,8);
 sheet('V-101','LAYOUT VISUALIZATION / PHOTO REFERENCES');
 txt('THESE IMAGES ARE PROJECT REFERENCES, NOT SURVEY-CALIBRATED RENDERS.',.86,1.65,8,true,[170,62,39]);
 async function photoData(photo){
   return new Promise((resolve,reject)=>{
     if(!photo?.blob)return reject(Error('Missing site image'));
     const reader=new FileReader();
     reader.onload=()=>resolve(reader.result);
     reader.onerror=()=>reject(reader.error||Error('Unable to read image'));
     reader.readAsDataURL(photo.blob);
   });
 }
 async function showPhoto(photo,x,label){
   txt(label,x,2.0,10,true);
   doc.setDrawColor(...grey);doc.rect(x,2.18,5.6,3.3);
   if(!photo){txt('No project-owned photo provided.',x+.45,3.8,9);return;}
   try{
     const url=await photoData(photo),props=doc.getImageProperties(url),ratio=Math.min(5.45/props.width,3.15/props.height);
     const wi=props.width*ratio,hi=props.height*ratio;
     doc.addImage(url,props.fileType||'JPEG',x+(5.6-wi)/2,2.18+(3.3-hi)/2,wi,hi,undefined,'FAST');
   }catch(e){txt('Image cannot be embedded in PDF: '+photo.cat,x+.3,3.8,8);}
 }
 await showPhoto(photos.find(x=>x.id===s.site?.photoId)||photos.find(x=>x.cat==='frente'||x.cat==='porche')||null,.86,'EXISTING SITE / BEFORE');
 await showPhoto(photos.find(x=>x.cat==='render')||null,6.8,'PROPOSED IMAGE / AFTER');
 txt('SCHEMATIC ISOMETRIC - NOT APPROVED ENGINEERING',.86,6,9,true);
 const xscale=Math.min(.19,5.9/Math.max(G.W,1)),zscale=Math.min(.12,3/Math.max(G.D,1)),yscale=Math.min(.28,2.5/Math.max(G.H,1));
 const proj=(x,y,z)=>[1.8+x*xscale+z*zscale,9.65-y*yscale-z*zscale*.48];
 const iso=(a,b)=>{const x=proj(...a),y=proj(...b);line(x[0],x[1],y[0],y[1]);};
 for(const x of [0,G.W]){iso([x,0,G.D],[x,G.H,G.D]);iso([x,G.H,0],[x,G.H,G.D]);}
 iso([0,G.H,0],[G.W,G.H,0]);iso([0,G.H,G.D],[G.W,G.H,G.D]);
 for(let i=1;i<G.frontBays;i++){const x=G.W*i/G.frontBays;if(!s.pictureView)iso([x,0,G.D],[x,G.H,G.D]);iso([x,G.H,0],[x,G.H,G.D]);}
 for(let j=1;j<G.roofRows;j++){const z=G.D*j/G.roofRows;iso([0,G.H,z],[G.W,G.H,z]);}
 txt('Aluminum '+(s.finish==='white'?'White':'Dark Bronze')+' | Roof '+s.roof+' | '+G.footprint+' sq ft footprint',7.3,8.25,10,true);
 txt('3D geometry is schematic. Image perspective matching and actual profile sizing need review.',7.3,8.7,8);
 sheet('Q-101','MATERIAL TAKEOFF / COMMERCIAL CUT SUMMARY');
 txt('ALUMINUM FINISH: '+(s.finish==='white'?'WHITE':'DARK BRONZE')+'   | WASTE RESERVE: '+s.waste+'%',.86,1.85,11,true);
 txt('Stock assumptions: '+s.stocks.join(', ')+' ft  | Supplier: '+s.supplier,.86,2.15,9);
 txt('PROFILE',.86,2.68,9,true);txt('NET FT',3.5,2.68,9,true);txt('PURCHASE BARS',5,2.68,9,true);txt('STOCK FT',10.3,2.68,9,true);
 line(.82,2.83,12.9,2.83);let ty=3.14;
 r.rows.slice(0,25).forEach(row=>{
  const stock={};row.bars.forEach(b=>stock[b.length]=(stock[b.length]||0)+1);
  txt(row.profile,.86,ty,10,true);txt(row.footage.toFixed(2),3.5,ty,9);
  txt(Object.entries(stock).map(([length,count])=>count+' x '+length+' ft').join('  '),5,ty,9);
  txt(row.purchased.toFixed(2),10.3,ty,9);ty+=.30;
 });
 txt('Screen mesh gross: '+G.meshArea+' sq ft  | Solid roof footprint: '+G.solidRoofArea+' sq ft',.86,Math.min(10.15,ty+.40),10,true);
 txt(r.unresolved.length?'WARNING: Pieces longer than commercial stock - procurement blocked.':'Cutting list available as a separate CSV export.',.86,10.35,8);
 return doc.output('blob');
}
function mount({project,photos,host,save,notify}){
 if(previousPreview){previousPreview.destroy();previousPreview=null;}
 const hadSite=!!project.studioV17?.site;
 let s=E.get(project);project.studioV17=s;
 const source=photos.find(x=>x.cat==='porche')||photos.find(x=>x.cat==='frente')||photos.find(x=>x.cat==='street');
 const hadPhoto=!!s.site.photoId;
 if(source&&!hadPhoto){
   s.site.photoId=source.id;
   if(!s.site.userDisabled)s.site.enabled=true;
 }
 const store=()=>{project.studioV17=s;save();};
 if(!hadSite||(source&&!hadPhoto))store();
 const tell=notify||((message)=>alert(message));
 function render(){
   const detailsWasOpen=host.querySelector('.v17-site-more')?.open===true;
   if(previousPreview){previousPreview.destroy();previousPreview=null;}
   const r=E.takeoff(s);
   const body={design:()=>design(s,r,project,photos),match:()=>photo(s,photos),docs:()=>deliverables(s,r,photos),buy:()=>purchasing(s,r,project)}[active]||(()=>design(s,r,project));
   host.innerHTML='<div class="v17-shell"><header class="v17-heading"><div><div class="cap">GORILLA SCREEN STUDIO · V17 WORKSPACE</div><h1>Design to Purchase</h1><p class="lead">Diseña, presenta, calcula y prepara compras — sin perder el control humano.</p></div><span class="v17-beta">FIELD PILOT</span></header>'+
    '<nav class="v17-nav" aria-label="Studio sections">'+[
    ['design','▧','Design'],['match','◐','Photo Match'],['docs','▤','Deliverables'],['buy','▦','Takeoff & Order']
   ].map(x=>'<button data-v17-tab="'+x[0]+'" '+(active===x[0]?'aria-current="page"':'')+'><span>'+x[1]+'</span>'+x[2]+'</button>').join('')+'</nav>'+body()+'</div>';
   if(detailsWasOpen&&host.querySelector('.v17-site-more'))host.querySelector('.v17-site-more').open=true;
   host.querySelectorAll('[data-v17-tab]').forEach(b=>b.onclick=()=>{active=b.dataset.v17Tab;render();});
   host.querySelectorAll('[data-v17-key]').forEach(input=>{
      input.onchange=()=>{
        let key=input.dataset.v17Key,value=input.type==='checkbox'?input.checked:input.value;
        if(key.startsWith('site-')){s.site[key.slice(5)]=input.type==='checkbox'?value:input.type==='number'?Number(value):value;}
        else if(key==='stock24'||key==='stock30'){s.stocks[key==='stock24'?0:1]=Number(value)||0;}
        else if(key==='matchX'||key==='matchY'){s.match[key==='matchX'?'x':'y']=Number(value)||0;}
        else if(key==='doorWidthIn'||key==='doorHeightIn'){s[key==='doorWidthIn'?'doorWidth':'doorHeight']=(Number(value)||0)/12;}
        else if(key==='doorBay'){s.doorBay=value===''?null:Number(value);}
        else if(input.type==='number'){s[key]=value===''?0:Number(value);}
        else s[key]=value;
        if(key==='finish')project.frameColor=value;
        store();setTimeout(render,0);
      };
   });
   host.querySelectorAll('[data-v17-site]').forEach(input=>{
     input.onchange=()=>{
       const key=input.dataset.v17Site;
       s.site[key]=input.type==='checkbox'?input.checked:
         input.type==='number'?(input.value===''?0:Number(input.value)):input.value;
       if(key==='enabled')s.site.userDisabled=!s.site.enabled;
       store();setTimeout(render,0);
     };
   });
   host.querySelectorAll('[data-v17-match]').forEach(input=>{
      input.value=s.match[input.dataset.v17Match]||input.value;
      input.oninput=()=>{
        const k=input.dataset.v17Match,val=input.type==='range'?Number(input.value):input.value;
        s.match[k]=val;
        if(k==='split'){
          const after=host.querySelector('.v17-after'),line=host.querySelector('.v17-splitline');
          if(after)after.style.clipPath='inset(0 0 0 '+val+'%)';
          if(line)line.style.left=val+'%';
          const label=host.querySelector('#v17-splitval');if(label)label.textContent=val+'%';
        }
      };
      input.onchange=()=>{store();setTimeout(render,0);};
   });
   host.querySelectorAll('[data-v17-cost]').forEach(input=>{input.onchange=()=>{const k=input.dataset.v17Cost;s.costs[k]=input.value===''?null:Number(input.value);store();setTimeout(render,0);};});
   host.querySelectorAll('[data-v17-action]').forEach(b=>b.onclick=async()=>{
      b.disabled=true;
      try{
       const kind=b.dataset.v17Action,report=E.takeoff(s),valid=report.geometry.valid;
       if(kind==='snap'){
         const fascia=Number(s.site?.fasciaHeight);
         if(!(fascia>0))throw Error('Primero introduce la elevación de fascia medida en campo.');
         if(!s.site.verified&&!confirm('La elevación de fascia no está marcada como verificada. ¿Aplicarla solo como valor conceptual?'))return;
         s.height=fascia;
         s.verified=false; // Changes to connection geometry require project field review.
         store();tell('Enclosure alineado con la referencia de fascia. Verifica dimensiones antes de comprar.');
         setTimeout(render,0);return;
       }

       if(kind==='csv'){if(!valid)throw Error('Introduce dimensiones primero.');download('Gorilla-Cutting-Plan-'+project.id+'.csv',generateCSV(s,report,project));}
       if(kind==='pdf'){const blob=await generatePDF(project,s,report,photos);download('Gorilla-Concept-Drawings-'+project.id+'.pdf',blob);}
       if(kind==='approve'){
         if(!valid||!s.verified)throw Error('Verifica y confirma las medidas de campo antes de aprobar.');
         if(s.site?.enabled&&s.gutterEnabled&&(
           !s.site.verified||!(Number(s.site.fasciaHeight)>0)||
           Math.abs(Number(s.site.fasciaHeight)-Number(s.height))>.12
         ))throw Error('La conexión house fascia / super gutter debe verificarse y coincidir con la altura del enclosure antes de aprobar.');

         if(report.unresolved.length)throw Error('Hay piezas mayores que la longitud comercial; resuelve splices/stock primero.');
         if(s.pictureView||s.roof==='irp'||s.roof==='mixed')throw Error('Se requiere revisión estructural y un schedule completo de componentes Picture View/IRP antes de aprobar materiales de compra.');
         if(E.doorLayout(s).issues.length)throw Error('La puerta no cabe en el panel seleccionado. Ajusta el ancho del panel, la altura o la cantidad de puertas antes de aprobar.');
         if(!confirm('¿Aprobar la lista conceptual de compra? No se enviará ninguna orden.')){b.disabled=false;return;}
         s.approvedOrder={signature:E.signature(s,project),approvedAt:Date.now()};
         store();tell('Lista revisada y aprobada localmente. Envío todavía manual.');setTimeout(render,0);
       }
       if(kind==='email'){
         if(E.orderStatus(s,project)!=='APPROVED')throw Error('Primero aprueba la lista vigente. Cambios requieren nueva aprobación.');
         if(!s.supplierEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.supplierEmail))throw Error('Ingresa un email real del proveedor.');
         const lines=['REQUEST FOR QUOTE — Gorilla Screen Studio',project.address||'Project address pending','Supplier: '+s.supplier,'Finish: '+(s.finish==='white'?'White':'Dark Bronze'),'Please confirm sizes, availability, stock lengths, SKU, cost, and delivery before ordering.','','Material request:'];
         report.rows.forEach(row=>{const bars={};row.bars.forEach(x=>bars[x.length]=(bars[x.length]||0)+1);lines.push(row.profile+': '+Object.entries(bars).map(([len,count])=>count+' bars x '+len+' ft').join(', '));});
         lines.push('','This is a quotation request only, not an authorized purchase order.');
         location.href='mailto:'+encodeURIComponent(s.supplierEmail)+'?subject='+encodeURIComponent('RFQ Gorilla — '+(project.address||'Project'))+'&body='+encodeURIComponent(lines.join('\n'));
       }
       if(kind==='phone'){
         if(E.orderStatus(s,project)!=='APPROVED')throw Error('Primero aprueba la lista actual.');
         const number=String(s.supplierPhone).replace(/[^\d+]/g,'');
         if(!number)throw Error('Ingresa el teléfono verdadero del proveedor antes de llamar.');
         location.href='tel:'+number;
       }
      }catch(ex){tell(ex.message||'Operation could not be completed.');}
      finally{b.disabled=false;}
   });
   if(active==='design'&&r.geometry.valid&&window.GSSV17Preview){
      try{previousPreview=window.GSSV17Preview.mount(host.querySelector('#v17-preview'),s,photos.find(x=>x.id===s.site?.photoId));}
      catch(e){console.warn('V17 preview unavailable',e); const stage=host.querySelector('#v17-preview');if(stage)stage.textContent='Vista 3D no disponible. Cálculos y documentos siguen accesibles.';}
   }
 }
 render();
}
window.GSSV17={mount};
})();
