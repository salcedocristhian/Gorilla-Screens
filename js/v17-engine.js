/* Gorilla Screen Studio V17 — conceptual parametric geometry & purchasing engine.
   Dimensions in feet; profiles are visual presets, NOT structural design. No external API calls. */
(function () {
  'use strict';
  const PROFILE_OPTIONS = ['1x2','2x2','2x3','2x4','2x5','2x6','2x7','2x8','2x10','custom'];
  const FINISHES = {white:'White',bronze:'Dark Bronze'};
  const round = n => Math.round((Number(n)||0)*100)/100;
  const n = (x,f=0) => Number.isFinite(Number(x)) ? Number(x) : f;
  const clamp=(x,min,max)=>Math.min(max,Math.max(min,n(x,min)));
  const clone=x=>JSON.parse(JSON.stringify(x));
  function defaults() { return {
    version:17,width:0,depth:0,height:0,verified:false,roof:'mansard',
    mansardRise:3,mansardInset:3,irpDepth:0,pictureView:false,
    finish:'white',mesh:'Standard 18x14 fiberglass',postProfile:'2x5',beamProfile:'2x8',
    crossProfile:'2x2',topRoofProfile:'2x2',topWallProfile:'1x2',chairProfile:'2x2',
    bottomProfile:'1x2',chairHeight:3,wallTarget:6,roofTarget:6,
    doorCount:1,doorWidth:3,doorHeight:80/12,
    gutterSize:7,gutterEnabled:true,downspouts:2,waste:10,stocks:[24,30],
    supplier:'Town & Country / ABC Outdoor Solutions',supplierPhone:'',supplierEmail:'',
    costs:{},laborPerSqft:null,overhead:null,targetMargin:null,revision:1,
    approvedOrder:null,siteSurvey:false,
    match:{before:'',after:'',split:50,scale:100,x:0,y:0}
  }; }
  function get(p) { if(!p.studioV17) p.studioV17=defaults();const d=defaults(); return Object.assign(d,p.studioV17,{
    costs:Object.assign({},d.costs,p.studioV17.costs||{}),
    match:Object.assign({},d.match,p.studioV17.match||{})
  });}
  function geometry(s) {
    const W=n(s.width),D=n(s.depth),H=n(s.height),valid=W>0&&D>0&&H>0;
    const frontBays=valid?Math.max(1,Math.ceil(W/clamp(s.wallTarget,2,20))):0;
    const sideBays=valid?Math.max(1,Math.ceil(D/clamp(s.wallTarget,2,20))):0;
    const roofRows=valid?Math.max(1,Math.ceil(D/clamp(s.roofTarget,2,20))):0;
    const wallArea=valid?(W+2*D)*H:0;
    let roofArea=valid?W*D:0;
    let solidArea=0;
    if(s.roof==='mansard'&&valid){
      const i=clamp(s.mansardInset,.01,Math.min(W,D)/2-.01),rise=Math.max(0,n(s.mansardRise));
      roofArea=(W-2*i)*(D-2*i)+2*(W+D-2*i)*Math.hypot(i,rise);
    }else if(s.roof==='gable'&&valid)roofArea=W*2*Math.hypot(D/2,n(s.mansardRise));
    else if(s.roof==='irp')solidArea=roofArea;
    else if(s.roof==='mixed'){solidArea=W*clamp(s.irpDepth,0,D);roofArea=W*(D-clamp(s.irpDepth,0,D));}
    if(s.roof==='irp')roofArea=0;
    const doorArea=clamp(s.doorCount,0,10)*clamp(s.doorWidth,2,8)*clamp(s.doorHeight,5,10);
    return {valid,W,D,H,frontBays,sideBays,roofRows,wallArea:round(wallArea),screenRoofArea:round(roofArea),
      solidRoofArea:round(solidArea),meshArea:round(wallArea+roofArea),doorArea:round(doorArea),
      footprint:round(W*D),totalPerimeter:round(W+2*D),postCount:valid?(frontBays+1+2*sideBays):0};
  }
  function segments(s) {
    const g=geometry(s),out=[];
    if(!g.valid) return out;
    const add=(profile,length,qty,use)=>{
      for(let i=0;i<qty;i++)if(length>.001)out.push({profile,length:round(length),use});
    };
    const front=g.W/g.frontBays,side=g.D/g.sideBays;
    add(s.postProfile,g.H,g.postCount,s.pictureView?'Wall posts / picture view concept':'Wall posts');
    add(s.topRoofProfile,g.W,1,'Upper roof spline/beam receiver · front');
    add(s.topRoofProfile,g.D,2,'Upper roof spline/beam receiver · sides');
    add(s.topWallProfile,g.W,1,'Lower wall spline channel · front');
    add(s.topWallProfile,g.D,2,'Lower wall spline channel · sides');
    let doorW=clamp(s.doorCount,0,10)*clamp(s.doorWidth,2,8);
    // The door interrupts the lower track and chair rail; the rest remains continuous.
    const frontClear=Math.max(0,g.W-doorW);
    add(s.bottomProfile,frontClear,1,'Bottom track · front excluding door');
    add(s.bottomProfile,g.D,2,'Bottom track · sides');
    if(s.chairHeight>0 && s.chairHeight<g.H) {
      add(s.chairProfile,frontClear,1,'36-inch chair rail (editable) · front excluding door');
      add(s.chairProfile,g.D,2,'Chair rail · sides');
    }
    add('2x2',clamp(s.doorHeight,5,10),2*clamp(s.doorCount,0,10),'Door jambs');
    add('2x2',clamp(s.doorWidth,2,8),clamp(s.doorCount,0,10),'Door headers');
    // Primary roof direction is from the house-side super gutter toward the front wall.
    const beams=g.frontBays+1;
    add(s.beamProfile,g.D,beams,'Primary big beams · house to front');
    add(s.crossProfile,g.W,Math.max(0,g.roofRows-1),'Secondary roof traverses');
    // A physical picture-view bay needs engineer-selected beam/brace spans. Not auto-estimated here.
    if(s.gutterEnabled)add('super-gutter-'+s.gutterSize,g.W,1,'House fascia super gutter (provisional)');
    if(s.gutterEnabled)add('downspout',g.H,clamp(s.downspouts,0,8),'Super gutter downspouts (provisional)');
    return out;
  }
  function optimize(pieces,stocks=[24,30],waste=10) {
    const lengths=(Array.isArray(stocks)?stocks:[]).map(v=>n(v)).filter(v=>v>0).sort((a,b)=>a-b);
    const bars=[],unresolved=[];
    pieces.slice().sort((a,b)=>b.length-a.length).forEach(piece=>{
      if(!lengths.length||piece.length>lengths[lengths.length-1]+1e-5){unresolved.push(piece);return;}
      let best=null,remain=Infinity;
      bars.forEach((bar,i)=>{const after=bar.remaining-piece.length;if(after>=-1e-5&&after<remain){best=i;remain=after;}});
      if(best===null){const length=lengths.find(l=>l+1e-5>=piece.length);bars.push({length,remaining:round(length-piece.length),cuts:[piece],reserve:false});}
      else{bars[best].cuts.push(piece);bars[best].remaining=round(bars[best].remaining-piece.length);}
    });
    // Reserve is applied only to the difference between the target and already-purchased stock,
    // so cutting offcuts are not counted a second time as extra waste.
    const used=pieces.reduce((t,p)=>t+p.length,0),target=used*(1+clamp(waste,0,50)/100);
    let bought=bars.reduce((t,b)=>t+b.length,0);
    const smallest=lengths[0]||0;
    while(smallest>0&&bought+1e-5<target&&bars.length<2000){
      bars.push({length:smallest,remaining:smallest,cuts:[],reserve:true});bought+=smallest;
    }
    return {bars,unresolved,used:round(used),purchased:round(bought),
      offcuts:round(bars.filter(b=>!b.reserve).reduce((t,b)=>t+b.remaining,0)),
      reserves:bars.filter(b=>b.reserve).length};
  }
  function takeoff(s){
    const rows=segments(s),types=[...new Set(rows.map(r=>r.profile))].sort();
    const list=types.map(profile=>{
      const rr=rows.filter(r=>r.profile===profile),opt=optimize(rr,s.stocks,s.waste);
      return {profile,finish:s.finish,footage:round(opt.used),bars:opt.bars,unresolved:opt.unresolved,
        purchased:opt.purchased,offcuts:opt.offcuts,reserves:opt.reserves,uses:[...new Set(rr.map(r=>r.use))]};
    });
    return {rows:list,geometry:geometry(s),unresolved:list.flatMap(r=>r.unresolved),meshSqft:geometry(s).meshArea,
      solidSqft:geometry(s).solidRoofArea};
  }
  function signature(s,project){
    // Keep approval stable across price-only edits; invalidate for changed geometry/cut rules.
    return JSON.stringify({revision:s.revision,width:s.width,depth:s.depth,height:s.height,verified:s.verified,roof:s.roof,
      mansardRise:s.mansardRise,mansardInset:s.mansardInset,irpDepth:s.irpDepth,pictureView:s.pictureView,
      finish:s.finish,mesh:s.mesh,postProfile:s.postProfile,beamProfile:s.beamProfile,crossProfile:s.crossProfile,
      topRoofProfile:s.topRoofProfile,topWallProfile:s.topWallProfile,chairProfile:s.chairProfile,bottomProfile:s.bottomProfile,
      chairHeight:s.chairHeight,doorCount:s.doorCount,doorWidth:s.doorWidth,doorHeight:s.doorHeight,
      gutterSize:s.gutterSize,gutterEnabled:s.gutterEnabled,downspouts:s.downspouts,waste:s.waste,stocks:s.stocks,
      approvedDrawing:project.approvedDrawing?.revision||null,roofDesign:project.roofDesign?.revision||null,
      fieldGeometry:project.openings||[],topScreen:project.topScreen||{},gutter:project.gutter||{}});
  }
  function orderStatus(s,p){
    if(!s.approvedOrder)return 'DRAFT';
    return s.approvedOrder.signature===signature(s,p)?'APPROVED':'OUTDATED';
  }
  function price(s,report){
    const priced=report.rows.length>0&&report.rows.every(r=>Number(s.costs[r.profile])>0);
    const labor=n(s.laborPerSqft,-1),overhead=n(s.overhead,-1),margin=n(s.targetMargin,-1);
    if(!priced||labor<0||overhead<0||margin<=0||margin>=100)return null;
    const material=report.rows.reduce((t,r)=>t+r.purchased*n(s.costs[r.profile]),0);
    const laborCost=labor*(report.geometry.wallArea+report.geometry.screenRoofArea+report.geometry.solidRoofArea);
    return {material:round(material),labor:round(laborCost),overhead:round(overhead),
      totalCost:round(material+laborCost+overhead),
      sellingPrice:round((material+laborCost+overhead)/(1-margin/100))};
  }
  window.GSSV17Engine={PROFILE_OPTIONS,FINISHES,defaults,get,geometry,segments,optimize,takeoff,signature,orderStatus,price,clone,round};
})();
