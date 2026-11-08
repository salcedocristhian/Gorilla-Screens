/* Gorilla AI Vision result boundary — manual import, no photo uploads and no geometry mutation. */
(function () {
  'use strict';
  const MAX_JSON_CHARS = 120000;
  const KEYS = ['visibleHouseFeatures','fasciaAndAttachmentObservations','patioAndObstacles',
    'suggestedEnclosureDesign','measurementsToVerify','limitations'];
  const text = v => typeof v === 'string' ? v.trim().slice(0,350) : '';
  const strings = v => Array.isArray(v) ? v.slice(0,35).map(text).filter(Boolean) : [];
  const bool = v => typeof v === 'boolean' ? v : null;
  // Vision observations remain unmeasured evidence: never admit dimensions into the design.
  const indices=(v,max)=>Array.isArray(v)?[...new Set(v.filter(x=>Number.isInteger(x)&&x>=1&&x<=max))].slice(0,5):[];
  const opening=(o,max)=>({
    id:text(o?.id),type:text(o?.type),description:text(o?.description),
    estimatedRelativePosition:text(o?.estimatedRelativePosition),
    confidence:['high','medium','low'].includes(o?.confidence)?o.confidence:'unverified',
    evidencePhotoIndices:indices(o?.evidencePhotoIndices,max),
    measurementStatus:'unverified'
  });
  const attachmentZone=(o,max)=>({
    id:text(o?.id),observation:text(o?.observation||o?.description),
    confidence:['high','medium','low'].includes(o?.confidence)?o.confidence:'unverified',
    evidencePhotoIndices:indices(o?.evidencePhotoIndices,max),
    structuralSuitability:'unverified'
  });
  function normalize(raw, projectId, photoIds) {
    if (typeof projectId !== 'string' || !projectId.trim()) throw Error('Selecciona un proyecto válido.');
    if (!Array.isArray(photoIds) || photoIds.length < 1 || photoIds.length > 5 ||
        photoIds.some(id => typeof id !== 'string' || !id)) throw Error('Selecciona entre 1 y 5 fotos de ESTE proyecto.');
    if (new Set(photoIds).size !== photoIds.length) throw Error('Hay fotos duplicadas.');
    if (typeof raw === 'string' && raw.length > MAX_JSON_CHARS) throw Error('El JSON excede el tamaño permitido.');
    let data;
    try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch (_) { throw Error('JSON inválido. Copia el resultado completo del piloto.'); }
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
        !data.findings || typeof data.findings !== 'object' || Array.isArray(data.findings)) {
      throw Error('No es un resultado válido de Gorilla AI Vision.');
    }
    const findings = {};
    for (const key of KEYS) findings[key] = strings(data.findings[key]);
    const g = data.findings.siteGeometry && typeof data.findings.siteGeometry === 'object' ?
      data.findings.siteGeometry : {};
    const photoCount = Number(g.photoCount);
    if (Number.isInteger(photoCount) && photoCount > 0 && photoCount !== photoIds.length)
      throw Error('El análisis corresponde a ' + photoCount + ' fotos; seleccionaste ' + photoIds.length + '.');
    const walls = Array.isArray(g.candidateAttachmentWalls) ? g.candidateAttachmentWalls.slice(0,20) : [];
    findings.siteGeometry = {
      stories: Number.isInteger(g.stories) && g.stories > 0 && g.stories < 100 ? g.stories : null,
      houseRoofType: text(g.houseRoofType),
      coveredPatio: bool(g.coveredPatio),
      poolPresent: bool(g.poolPresent),
      poolStatus: g.poolPresent === true ? 'observed-in-images' : 'not-confirmed',
      poolShape: text(g.poolShape),
      deckSurface: text(g.deckSurface),
      facadeOpenings: Array.isArray(g.facadeOpenings) ? g.facadeOpenings.slice(0,30)
        .map(o=>opening(o,photoIds.length)).filter(o=>o.id||o.description) : [],
      upperAttachmentZones: Array.isArray(g.upperAttachmentZones) ? g.upperAttachmentZones.slice(0,20)
        .map(o=>attachmentZone(o,photoIds.length)).filter(o=>o.id||o.observation) : [],
      candidateAttachmentWalls: walls.map(w=>({id:text(w?.id),observation:text(w?.observation),
        visibleMaterial:text(w?.visibleMaterial),structuralSuitability:'unverified'})),
      recommendedCaptureMissingViews: strings(g.recommendedCaptureMissingViews),
      contextConfidence: text(g.contextConfidence)
    };
    const warnings = [];
    if (findings.visibleHouseFeatures.some(s=>/arch|arco/i.test(s)) &&
        !findings.siteGeometry.facadeOpenings.length) warnings.push('Se mencionan arcos, pero no hay geometría de openings.');
    if (g.poolPresent === false) warnings.push('Piscina no confirmada: false no prueba ausencia si las fotos no la muestran.');
    warnings.push('Sin medidas verificadas: el análisis NO modifica el diseño 3D ni el takeoff.');
    return {
      schemaVersion:1, projectId, photoIds:photoIds.slice(), importedAt:Date.now(),
      status:'draft-needs-human-review', model:text(data.model)||'Gemini (unverified version)',
      findings, warnings, reviewed:false
    };
  }
  function belongsTo(analysis, projectId, currentPhotos) {
    return !!analysis && analysis.projectId === projectId && Array.isArray(analysis.photoIds) &&
      analysis.photoIds.every(id=>currentPhotos.some(p=>p.id===id && p.projectId===projectId));
  }
  window.GSSVision = { normalize, belongsTo };
})();
