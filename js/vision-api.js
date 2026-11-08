/* Gorilla V17 single-capture AI client. Images are already stored in the active project.
   Only the operator-authorized selection is transmitted; no API secrets in this bundle. */
(function () {
  'use strict';
  const DEFAULT_ENDPOINT='https://gorilla-studio-ai-bridge.salcedo-cristhian-2020.workers.dev/api/analyze';
  const MAX_BYTES=9*1024*1024;
  function endpoint(value) {
    let u;
    try { u=new URL(value||DEFAULT_ENDPOINT); } catch (_) { throw Error('La dirección del Worker no es válida.'); }
    if (u.protocol!=='https:' || u.username || u.password || u.search || u.hash ||
        u.hostname!=='gorilla-studio-ai-bridge.salcedo-cristhian-2020.workers.dev' || u.pathname!=='/api/analyze') {
      throw Error('El Worker debe usar HTTPS y terminar exactamente en /api/analyze.');
    }
    return u.href;
  }
  function selectedPhotos(projectId, photos) {
    if (!projectId || !Array.isArray(photos) || photos.length<1 || photos.length>5)
      throw Error('Selecciona entre 1 y 5 fotografías del proyecto.');
    const ids=new Set();
    let bytes=0;
    for (const photo of photos) {
      if (!photo || photo.projectId!==projectId || !photo.id || ids.has(photo.id) ||
          !(photo.blob instanceof Blob) || !['image/jpeg','image/png','image/webp'].includes(photo.blob.type)) {
        throw Error('Una fotografía no pertenece al proyecto o tiene un formato inválido.');
      }
      ids.add(photo.id);
      bytes+=photo.blob.size;
    }
    if (bytes>MAX_BYTES) throw Error('Las fotos superan 9 MB. Reduce la resolución antes de analizar.');
    return photos;
  }
  async function analyze({projectId,photos,token,url,signal,fetchImpl}) {
    selectedPhotos(projectId,photos);
    const accessToken=String(token||'').trim();
    if (accessToken.length<32) throw Error('Ingresa la clave privada de acceso a AI Vision (mínimo 32 caracteres).');
    const form=new FormData();
    form.append('projectId',projectId);
    for(const [i,p] of photos.entries()) form.append('photos',p.blob,'photo-'+(i+1)+'.jpg');
    let response;
    try {
      response=await (fetchImpl||fetch)(endpoint(url),{
        method:'POST',credentials:'omit',cache:'no-store',
        headers:{Authorization:'Bearer '+accessToken},body:form,signal
      });
    } catch(err) {
      if (err?.name==='AbortError') throw Error('El análisis fue cancelado.');
      throw Error('No se pudo conectar con AI Vision. Verifica que el Worker esté desplegado, autorizado y habilitado para esta app.');
    }
    let payload;
    try { payload=await response.json(); }
    catch(_){throw Error('AI Vision devolvió una respuesta que no es JSON.');}
    if(!response.ok) throw Error(String(payload?.error||'Error de AI Vision ('+response.status+').').slice(0,240));
    if(payload?.projectId && payload.projectId!==projectId) throw Error('AI Vision devolvió un resultado de otro proyecto. Se rechazó.');
    const raw=payload?.report||payload;
    if(!window.GSSVision)throw Error('Falta el validador del reporte AI Vision.');
    return window.GSSVision.normalize(raw,projectId,photos.map(p=>p.id));
  }
  window.GSSVisionAPI={DEFAULT_ENDPOINT,endpoint,selectedPhotos,analyze};
})();
