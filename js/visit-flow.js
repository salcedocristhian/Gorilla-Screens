/* Gorilla Visit Flow — accurate steps and a single next action.
   Workflow is entirely on the existing Gorilla app. No LiDAR/ARKit claims.
   Never mark AI, geometry, pricing or documents approved from route navigation. */
(function(){
 'use strict';
 function own(p,photos){
   return (Array.isArray(photos)?photos:[]).filter(x=>x&&x.id&&x.projectId===p?.id);
 }
 function aiValid(p,photos){
   return !!(p?.aiVision&&window.GSSVision?.belongsTo(p.aiVision,p.id,own(p,photos)));
 }
 function designerReviewed(p,photos){
   if(!aiValid(p,photos))return false;
   const a=p.aiDesigner;
   const v=p.aiVision;
   return !!(a&&a.projectId===p.id&&a.reviewed===true&&
     Number(a.reportKey||0)===Number(v.importedAt||0)&&
     Array.isArray(a.evidencePhotoIds)&&Array.isArray(v.photoIds)&&
     a.evidencePhotoIds.join('|')===v.photoIds.join('|'));
 }
 function measured(p){
   return !!(p?.kind==='field'?
      (window.GSSModel?.hasApprovedGeometry(p)===true):
      (p?.studioV17?.verified===true &&
       Number(p.studioV17.width)>0&&Number(p.studioV17.depth)>0&&Number(p.studioV17.height)>0));
 }
 function status(p,photos){
   const pp=own(p,photos);
   const ai=aiValid(p,pp),design=designerReviewed(p,pp);
   const verified=measured(p);
   const price=Number(p?.quote?.rate)>0;
   return {
     datos:!!String(p?.address||'').trim()&&!!String(p?.client?.name||'').trim(),
     fotos:pp.length>0,
     aerea:pp.some(x=>x.cat==='aerea'),
     analisis:ai,
     disenador:design,
     medidas:verified,
     studio:verified,
     precio:verified&&price,
     entregar:verified&&price,
     rawPhotoCount:pp.length
   };
 }
 function next(p,photos){
   const s=status(p,photos);
   if(!s.datos)return {tab:'datos',label:'Confirmar cliente y dirección',reason:'Primero completa los datos de la visita.'};
   if(!s.fotos)return {tab:'fotos',label:'Capturar la propiedad',reason:'Toma las fotos del área real donde se instalará el screen.'};
   if(!s.analisis)return {tab:'fotos',label:'Analizar fotos existentes',reason:'Usa las fotos guardadas; no necesitas subirlas de nuevo.'};
   if(!s.disenador)return {tab:'disenador',label:'Responder al diseñador IA',reason:'Define el screen que construiremos antes de verificar la geometría.'};
   if(!s.medidas)return {tab:'medidas',label:'Verificar medidas del proyecto',reason:'La IA no establece cotas de fabricación por sí sola.'};
   if(!s.precio)return {tab:'precio',label:'Preparar cotización',reason:'Solo cotiza el screen propuesto; la casa es referencia.'};
   return {tab:'entregar',label:'Revisar entregables',reason:'La ingeniería y los anclajes siguen sujetos a revisión profesional.'};
 }
 function selectedPhotos(p,photos){
   const list=own(p,photos).filter(x=>x.cat!=='render');
   const ids=window.GSSAiDesigner?.recommendedPhotos(p.id,list)||list.slice(0,5).map(x=>x.id);
   return ids.slice(0,5).filter(id=>list.some(x=>x.id===id));
 }
 window.GSSVisitFlow={own,aiValid,designerReviewed,measured,status,next,selectedPhotos};
})();