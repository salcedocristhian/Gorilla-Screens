/* Gorilla Screens — app de campo para vendedores. Todo corre en el navegador; los datos viven en el dispositivo. */
(function () {
  const Mo = window.GSSModel, St = window.GSSStore;
  const app = document.getElementById('app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => [...(el || document).querySelectorAll(sel)];
  const LOGO = 'assets/gorilla-logo.png';
  const IC = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    studio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4zM4 12h16M12 4v16"/><path d="M7 7h2m6 9h2"/></svg>',
    datos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    fotos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    medidas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l14-14 4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/></svg>',
    '3d': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
    precio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3"/></svg>',
    entregar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>'
  };
  const TABS = [['datos', 'Datos'], ['fotos', 'Fotos'], ['medidas', 'Medidas'], ['3d', '3D'], ['studio', 'Studio'], ['precio', 'Precio'], ['entregar', 'Entregar']];
  const PHOTO_CATS = [
    ['aerea', 'Vista aérea', 'Imagen aérea autorizada o fotografía propia. Se muestra en el plano de ubicación.'],
    ['street', 'Vista desde la calle', 'Fotografía propia o referencia con derechos de uso.'],
    ['frente', 'Frente de la casa', 'Foto completa del frente, de esquina a esquina.'],
    ['openings', 'Cada opening', 'Una foto de frente por opening, con la cinta métrica visible si puedes.'],
    ['porche', 'Porche / interior', 'Desde adentro, mirando a los lados: puerta, ventana, luz, piso.'],
    ['detalles', 'Fascia, gutters y downspout', 'Fascia, gutters existentes, downspout y techo.'],
    ['render', 'Render propuesto (opcional)', 'Si ya tienes un render del diseño.']
  ];
  const VIEWS = [['frente', 'Frente'], ['izq', 'Lado izq.'], ['der', 'Lado der.'], ['arcos', 'Openings'], ['top', 'Techo'], ['porche', 'Porche'], ['aerea', 'Aérea']];

  let S = { project: null, photos: [], viewer: null, builtFor: '', view: 'frente', after: true, land: true, palms: false, logoData: null, saveT: null };

  // ---------- utilities
  let toastT; function toast(t, ms) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), ms || 2600); }
  function company() { try { return JSON.parse(localStorage.getItem('gss-company') || '{}'); } catch (e) { return {}; } }
  function setCompany(c) { try { localStorage.setItem('gss-company', JSON.stringify(c)); } catch (e) { } }
  async function logoData() { if (S.logoData) return S.logoData; const b = await (await fetch(LOGO)).blob(); S.logoData = await blobToDataURL(b); return S.logoData; }
  function blobToDataURL(b) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); }); }
  function dataURLtoBlob(u) { const [h, b] = u.split(','); const bin = atob(b); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: h.slice(5, h.indexOf(';')) }); }
  async function resizeImage(file, max) {
    max = max || 1600;
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return await new Promise(res => c.toBlob(res, 'image/jpeg', 0.85));
    } finally { URL.revokeObjectURL(url); }
  }
  // Saving files: the share sheet on phones (iOS can't save blob links from a home-screen app), a normal download elsewhere.
  async function saveBlob(name, blob) {
    const type = blob.type || (name.endsWith('.pdf') ? 'application/pdf' : name.endsWith('.png') ? 'image/png' : 'application/octet-stream');
    try {
      const file = new File([blob], name, { type });
      if (matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function slug(s) { return String(s || 'proyecto').split(',')[0].trim().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'proyecto'; }
  function saveSoon() {
    clearTimeout(S.saveT);
    const item = S.project; // capture the owner: never save the next project in a pending callback
    if (!item) return;
    S.saveT = setTimeout(() => St.saveProject(item).catch(() => toast('No se pudo guardar en el dispositivo')), 350);
  }

  // ---------- viewer (one WebGL renderer for the whole app: phones limit how many you can open)
  function viewer() {
    if (!S.viewer) {
      if (!window.THREE || !THREE.OrbitControls) { toast('No cargó el motor 3D. Revisa tu conexión.'); return null; }
      S.viewer = new window.GSSViewer($('#offscreen'));
      $('#offscreen').addEventListener('viewer-lost', () => toast('El 3D se pausó por memoria. Recarga la página.', 5000));
      app.addEventListener('viewer-lost', () => toast('El 3D se pausó por memoria. Recarga la página.', 5000));
    }
    const key = JSON.stringify([S.project.id, S.project.kind, S.project.approvedDrawing?.revision,
      S.project.roofDesign?.revision, S.project.house, S.project.openings, S.project.pier,
      S.project.topScreen, S.project.gutter, S.project.frameColor, S.project.address]);
    if (S.project.kind === 'field' && !Mo.hasApprovedGeometry(S.project)) return null;
    if (S.builtFor !== key) { S.viewer.build(S.project); S.builtFor = key; S.viewer.goView(S.view, true); }
    S.viewer.setAfter(S.after); S.viewer.setLandscape(S.land); S.viewer.setPalms(S.palms);
    return S.viewer;
  }
  function parkViewer() { if (S.viewer) S.viewer.mount($('#offscreen')); }

  // ---------- router
  window.addEventListener('hashchange', route);
  async function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/');
    parkViewer();
    if (parts[0] === 'cliente' && parts[1]) return clientView(parts.slice(1).join('/'));
    if (parts[0] === 'p' && parts[1]) {
      if (!S.project || S.project.id !== parts[1]) {
        const p = await St.getProject(parts[1]);
        if (!p) { location.hash = '#/'; return; }
        S.project = Mo.normalize(p); S.builtFor = ''; S.view='frente'; S.after=true; await loadPhotos();
      }
      return projectView(parts[2] || 'datos');
    }
    if (parts[0] === 'ajustes') return settingsView();
    return homeView();
  }
  async function loadPhotos() { S.photos.forEach(p => p.url && URL.revokeObjectURL(p.url)); S.photos = (await St.listPhotos(S.project.id)).map(p => Object.assign(p, { url: URL.createObjectURL(p.blob) })); }

  function topbar(title, subtitle, left, right) {
    return `<header class="topbar">${left || `<img src="${LOGO}" alt="Gorilla Screening Solutions">`}<div class="t"><b>${esc(title)}</b>${subtitle ? `<span>${esc(subtitle)}</span>` : ''}</div>${right || ''}</header>`;
  }

  // ---------- home
  async function homeView() {
    document.title = 'Gorilla Screens · Proyectos';
    const list = await St.listProjects();
    app.innerHTML = topbar('Gorilla Screens', 'Proyectos de screens', '', `<a class="iconbtn" href="#/ajustes" aria-label="Ajustes de la compañía">${IC.gear}</a>`) + `
      <main class="wrap">
        <h1 class="h1">Proyectos</h1>
        <p class="lead">Para campo: fotografías → dibujo → medidas verificadas → 3D y plano.</p>
        <div class="home-tools" style="margin-bottom:14px">
          <label class="field project-search"><span class="sr-only">Filtrar proyectos</span><input id="projectFilter" type="search" placeholder="⌕  Buscar proyectos" aria-label="Buscar proyectos"></label>
          <button class="iconbtn tool-plus" data-a="new" aria-label="Crear nuevo proyecto" title="Nuevo proyecto">+</button>
          <label class="iconbtn tool-upload" title="Importar proyecto" aria-label="Importar proyecto">⇧<input type="file" accept=".json,application/json" data-a="import"></label>
        </div>
        <div class="card field-start"><div class="row"><span class="l"><b>Desde fotografías</b><br><span class="sub">Crea un proyecto vacío, toma fotos y traza tu propio diseño.</span></span><span class="field-steps">01 → 02 → 03</span></div><button class="btn block" data-a="newphoto">+ Proyecto desde fotos</button></div>
        ${St.usingMemory() ? '<p class="warn">Este navegador no permite guardar en el dispositivo (modo privado). Los proyectos se perderán al cerrar.</p>' : ''}
        <div class="plist">
          ${list.map(p => { const q = Mo.quoteTotals(Mo.normalize(p)); return `<a class="pitem" href="#/p/${esc(p.id)}/datos" style="text-decoration:none;color:inherit"><img class="thumb" src="${LOGO}" alt=""><div style="min-width:0"><b>${esc(p.address || 'Sin dirección')}</b><span>${esc(p.client && p.client.name || 'Sin cliente')} · ${Mo.hasApprovedGeometry(p) || p.kind!=='field' ? q.sqft.toFixed(0)+' pie²' : 'Geometría pendiente'}${p.quote?.rate>0 && q.sqft>0 ? ' · '+Mo.money(q.total) : ''}</span><span>Actualizado ${new Date(p.updatedAt).toLocaleDateString('es-US')}</span></div></a>`; }).join('') || '<div class="card sub">Todavía no hay proyectos.</div>'}
        </div>
        ${list.some(p => p.id === 'demo-22743') ? '' : '<div class="pad"></div><button class="btn sec block" data-a="demo">Cargar proyecto de ejemplo (22743 SW 56th Ave)</button>'}
      </main>`;
    const createEmpty = async () => { const p = Mo.emptyProject(); await St.saveProject(p); location.hash = '#/p/' + p.id + '/datos'; };
    $('[data-a="new"]').onclick = createEmpty;
    $('[data-a="newphoto"]').onclick = createEmpty;
    const dm = $('[data-a="demo"]'); if (dm) dm.onclick = loadDemo;
    $('[data-a="import"]').onchange = importProject;
    $('#projectFilter').oninput = e => { const q=e.target.value.toLowerCase().trim(); $$('.pitem').forEach(a=>a.style.display=(a.textContent.toLowerCase().includes(q)?'':'none')); };
  }
  async function loadDemo() {
    toast('Cargando ejemplo…');
    const p = Mo.demoProject(); await St.saveProject(p);
    const files = [['01-frente-actual.jpg', 'frente'], ['02-render-propuesto.jpg', 'render'], ['03-porche-puerta-ventana.jpg', 'porche'], ['04-porche-arcos-a.jpg', 'porche'], ['05-porche-arcos-b.jpg', 'porche']];
    for (const [f, cat] of files) { try { const b = await (await fetch('demo/' + f)).blob(); await St.savePhoto({ id: Mo.uid(), projectId: p.id, cat, blob: b, createdAt: Date.now() }); } catch (e) { } }
    location.hash = '#/p/' + p.id + '/3d';
  }
  async function importProject(e) {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text()); if(data.app!=='gorilla-screens' || !data.project || !Array.isArray(data.photos))throw Error('Unsupported project');
      const p = Mo.normalize(data.project); const idMap={}; p.id=Mo.uid();
      const parsedPhotos=[];for (const ph of data.photos) {const old=ph.id||ph.sourceId;const nid=Mo.uid();if(old)idMap[old]=nid;parsedPhotos.push({ id:nid,projectId:p.id,cat:ph.cat||'detalles',blob:dataURLtoBlob(ph.data),createdAt:Date.now() });}
      if(p.drawingDraft?.sourcePhotoId)p.drawingDraft.sourcePhotoId=idMap[p.drawingDraft.sourcePhotoId]||'';
      if(p.approvedDrawing?.photoId)p.approvedDrawing.photoId=idMap[p.approvedDrawing.photoId]||'';
      if(p.roofDraft?.photoId)p.roofDraft.photoId=idMap[p.roofDraft.photoId]||'';
      if(p.roofDesign?.photoId)p.roofDesign.photoId=idMap[p.roofDesign.photoId]||'';
      // Project-specific V17 context images must follow the imported project's new photo IDs.
      // Never let a photo reference resolve against another customer's IndexedDB record.
      if(p.studioV17?.site?.photoId)p.studioV17.site.photoId=idMap[p.studioV17.site.photoId]||'';
      if(p.studioV17?.match?.before)p.studioV17.match.before=idMap[p.studioV17.match.before]||'';
      if(p.studioV17?.match?.after)p.studioV17.match.after=idMap[p.studioV17.match.after]||'';

      await St.saveProject(p); for(const ph of parsedPhotos)await St.savePhoto(ph);
      location.hash = '#/p/' + p.id + '/datos';
    } catch (err) { toast('Archivo no válido'); }
  }

  // ---------- settings
  function settingsView() {
    const c = company();
    const f = (k, l, ph, type) => `<div class="field"><label for="c-${k}">${l}</label><input id="c-${k}" data-k="${k}" type="${type || 'text'}" value="${esc(c[k] || '')}" placeholder="${esc(ph || '')}"></div>`;
    app.innerHTML = topbar('Ajustes', 'Datos de la compañía para el plano y la cotización', `<a class="iconbtn" href="#/" aria-label="Volver">${IC.back}</a>`) + `
      <main class="wrap"><div class="card">
        ${f('name', 'Nombre de la compañía', 'GORILLA SCREENING SOLUTIONS LLC')}${f('address', 'Dirección', '')}${f('phone', 'Teléfono', '', 'tel')}${f('email', 'Email', '', 'email')}${f('license', 'Licencia de contratista', '')}${f('engineer', 'Ingeniero de récord (nombre y PE #)', '')}
      </div><p class="lead">Se guardan en este dispositivo.</p></main>`;
    $$('[data-k]').forEach(i => i.oninput = () => { const c2 = company(); c2[i.dataset.k] = i.value; setCompany(c2); });
  }

  // ---------- project
  function projectView(tab) {
    const p = S.project;
    document.title = (p.address || 'Proyecto') + ' · Gorilla Screens';
    const q = Mo.quoteTotals(p);
    app.innerHTML = topbar(p.address || 'Proyecto nuevo', (p.client.name || 'Sin cliente') + ' · ' + q.sqft.toFixed(1) + ' pie²', `<a class="iconbtn" href="#/" aria-label="Volver a proyectos">${IC.back}</a>`) +
      `<nav class="tabbar" aria-label="Secciones del proyecto">${TABS.map(([k, l]) => `<a href="#/p/${esc(p.id)}/${k}" ${(['editor','roof','parts'].includes(tab) ? k === 'medidas' : k === tab) ? 'aria-current="page"' : ''}>${IC[k]}<span>${l}</span></a>`).join('')}</nav>
       <main class="wrap" id="tab"></main>`;
    const el = $('#tab');
    if (tab === 'editor') { return tabEditor(el); }
    if (tab === 'roof') { return tabRoof(el); }
    if (tab === 'parts') { return tabParts(el); }
    ({ datos: tabDatos, fotos: tabFotos, medidas: p.kind==='field'?tabFieldMeasures:tabMedidas, '3d': tab3D, studio: tabStudio, precio: tabPrecio, entregar: tabEntregar }[tab] || tabDatos)(el);
    window.scrollTo(0, 0);
  }
  function tabStudio(el) {
    if (!window.GSSV17) { el.innerHTML='<div class="card">V17 Studio no disponible.</div>'; return; }
    window.GSSV17.mount({project:S.project,photos:S.photos,host:el,save:saveSoon,notify:toast});
  }

  function tabEditor(el) {
    if (!window.GSSPhotoEditor) { el.innerHTML='<div class="card">Editor no disponible.</div>'; return; }
    el.classList.add('draft-page');
    window.GSSPhotoEditor.editor({
      project:S.project, photos:S.photos, host:el,
      goBack:()=>location.hash='#/p/'+S.project.id+'/medidas',
      save:()=>{ saveSoon(); },
      approved:async(revision)=>{ S.builtFor='';try{await St.saveProject(S.project);toast('Plano aprobado: revisión '+revision);location.hash='#/p/'+S.project.id+'/3d';}catch(e){toast('Error guardando revisión. Exporta un respaldo.');} }
    });
  }

  function tabParts(el) {
    if (!window.GSSManufacturer) { el.innerHTML='<div class="card">Catálogo no disponible.</div>';return; }
    window.GSSManufacturer.render({ project:S.project,host:el,save:saveSoon,
      back:()=>location.hash='#/p/'+S.project.id+'/medidas' });
  }

  function tabRoof(el) {
    if (!window.GSSRoofEditor) { el.innerHTML='<div class="card">Editor de techo no disponible.</div>'; return; }
    el.classList.add('draft-page');
    window.GSSRoofEditor.editor({ project:S.project, photos:S.photos, host:el,
      goBack:()=>location.hash='#/p/'+S.project.id+'/medidas',
      save:()=>saveSoon(),
      approved:async(revision)=>{S.builtFor='';try{await St.saveProject(S.project);toast('Techo aprobado · Revisión '+revision);location.hash='#/p/'+S.project.id+'/3d';}catch(e){toast('No se pudo guardar el techo.');}}
    });
  }

  function refreshHeader() { const q = Mo.quoteTotals(S.project); const t = $('.topbar .t'); if (t) t.innerHTML = `<b>${esc(S.project.address || 'Proyecto nuevo')}</b><span>${esc(S.project.client.name || 'Sin cliente')} · ${q.sqft.toFixed(1)} pie²</span>`; }

  function mapLinks(p) {
    const a = encodeURIComponent(p.address || '');
    const ll = p.geo ? p.geo.lat + ',' + p.geo.lng : null;
    return {
      sat: ll ? `https://www.google.com/maps/@?api=1&map_action=map&center=${ll}&zoom=20&basemap=satellite` : `https://www.google.com/maps/search/?api=1&query=${a}`,
      street: ll ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${ll}` : `https://www.google.com/maps/search/?api=1&query=${a}`,
      embed: `https://maps.google.com/maps?q=${a}&t=k&z=20&ie=UTF8&iwloc=&output=embed`
    };
  }
  function tabDatos(el) {
    const p = S.project, m = mapLinks(p);
    el.innerHTML = `
      ${p.kind==='field'?`<section class="card field-start"><div class="cap">GORILLA FIELD PILOT · DESDE FOTOS</div><h2>Proyecto sin modelo heredado</h2><p class="lead">Primero registra la dirección, luego toma fotografías y dibuja los openings sobre la imagen. El 3D se desbloquea cuando el plano queda aprobado.</p><a class="btn block" href="#/p/${p.id}/fotos" style="text-decoration:none">1 · Continuar a Fotos →</a></section>`:''}
      <div class="card">
        <div class="field"><label for="addr">Dirección del proyecto</label><div class="address-inline"><input id="addr" autocomplete="street-address" value="${esc(p.address)}" placeholder="Dirección del proyecto"><button class="iconbtn search-inside" data-a="geo" title="Buscar ubicación" aria-label="Buscar ubicación">⌕</button></div></div>
        ${p.address ? `<div class="mapbox"><iframe title="Vista satelital" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${esc(m.embed)}"></iframe></div>
        <div class="location-actions"><div class="seg" aria-label="Tipo de mapa"><button data-mapmode="sat" aria-pressed="true">Aérea</button><button data-mapmode="street" aria-pressed="false">Calle</button></div><a class="btn sec map-open" href="${esc(m.sat)}" target="_blank" rel="noopener" id="openSelectedMap">↗ Abrir vista</a></div>
        <p class="lead smalltext" style="margin:8px 0 0">La vista aérea puede agregarse a Fotos si cuentas con una imagen autorizada. Esta app no captura ni almacena automáticamente Google Maps.</p>` : ''}
      </div>
      <div class="card">
        <div class="cap">ACABADO DEL ALUMINIO · DATOS INICIALES</div>
        <div class="field"><label for="projectFinish">Selecciona color para este proyecto</label><select id="projectFinish"><option value="white" ${p.frameColor==='white'?'selected':''}>White</option><option value="bronze" ${p.frameColor==='bronze'?'selected':''}>Dark Bronze</option></select></div>
        <p class="lead smalltext">El acabado seleccionado se refleja en Studio, el modelo y los materiales. Las selecciones históricas quedan preservadas.</p>
      </div>
      <div class="card">
        <p class="cap">Cliente</p>
        <div class="field"><label for="cn">Nombre</label><input id="cn" data-c="name" autocomplete="name" value="${esc(p.client.name)}"></div>
        <div class="grid2"><div class="field"><label for="cp">Teléfono</label><input id="cp" data-c="phone" type="tel" autocomplete="tel" value="${esc(p.client.phone)}"></div>
        <div class="field"><label for="ce">Email</label><input id="ce" data-c="email" type="email" autocomplete="email" value="${esc(p.client.email)}"></div></div>
      </div>
      <div class="card">
        <div class="field"><label for="sp">Vendedor</label><input id="sp" value="${esc(p.salesperson)}"></div>
        <div class="field"><label for="nt">Notas internas</label><textarea id="nt">${esc(p.notes)}</textarea></div>
        <button class="btn danger block" data-a="del">Borrar proyecto</button>
      </div>`;
    $$('[data-mapmode]',el).forEach(b => b.onclick=()=>{ $$('[data-mapmode]',el).forEach(x=>x.setAttribute('aria-pressed',String(x===b))); const url=b.dataset.mapmode==='street'?m.street:m.sat; const target=$('#openSelectedMap',el); if(target)target.href=url; });
    $('#addr').oninput = e => { p.address = e.target.value; p.geo = null; saveSoon(); refreshHeader(); };
    $('#addr').onchange = () => tabDatos(el);
    $$('[data-c]').forEach(i => i.oninput = () => { p.client[i.dataset.c] = i.value; saveSoon(); refreshHeader(); });
    $('#projectFinish').onchange = e => { p.frameColor=e.target.value; if (p.studioV17) p.studioV17.finish=e.target.value; S.builtFor='';saveSoon(); };
    $('#sp').oninput = e => { p.salesperson = e.target.value; saveSoon(); };
    $('#nt').oninput = e => { p.notes = e.target.value; saveSoon(); };
    $('[data-a="geo"]').onclick = async () => {
      if (!p.address) return toast('Escribe la dirección');
      try {
        const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=' + encodeURIComponent(p.address), { headers: { 'Accept': 'application/json' } });
        const j = await r.json();
        if (j[0]) { p.geo = { lat: +(+j[0].lat).toFixed(6), lng: +(+j[0].lon).toFixed(6) }; saveSoon(); toast('Ubicación encontrada'); } else toast('No encontré coordenadas; los botones abren la búsqueda');
      } catch (e) { toast('Sin conexión al buscador; los botones abren la búsqueda'); }
      tabDatos(el);
    };
    $('[data-a="del"]').onclick = async () => { if (!confirm('¿Borrar este proyecto y sus fotos?')) return; await St.deleteProject(p.id); S.project = null; location.hash = '#/'; };
  }

  function tabFotos(el) {
    const p=S.project, by = c => S.photos.filter(x => x.cat === c);
    el.innerHTML = PHOTO_CATS.map(([k, l, h]) => `
      <section class="card" aria-labelledby="h-${k}">
        <div class="row" style="min-height:0"><b id="h-${k}" style="font-size:16px">${l}</b><span class="sub">${by(k).length || ''}</span></div>
        <p class="lead" style="margin:4px 0 0;font-size:14px">${h}</p>
        <div class="photos">
          ${by(k).map(x => `<div class="ph"><button style="all:unset;display:block;width:100%;height:100%;cursor:pointer" data-open="${x.id}" aria-label="Ver foto"><img src="${x.url}" alt="${esc(l)}"></button><button class="x" data-del="${x.id}" aria-label="Borrar foto">×</button>${!['aerea','street','render'].includes(k)?`<button class="trace-photo" data-trace="${x.id}" title="Dibujar sobre esta foto">✎ Plano</button>`:''}</div>`).join('')}
          <label class="addph" aria-label="Agregar foto a ${esc(l)}">+<input type="file" accept="image/*" multiple data-cat="${k}"></label>
        </div>
      </section>`).join('');
    if(p.kind==='field'){el.insertAdjacentHTML('afterbegin',`<section class="card field-start"><div class="cap">PASO 2 · FOTOGRAFÍAS</div><h2>Captura la propiedad real</h2><p class="lead">Toma el frente, cada opening, la fascia y el techo. Después toca ✎ Plano en una foto para trazar el dibujo y verificar dimensiones.</p><a class="btn sec block" href="#/p/${p.id}/editor" style="text-decoration:none">Abrir dibujo 2D</a><p class="lead smalltext">El reconocimiento automático con IA todavía no está conectado. Ninguna dimensión se inventará a partir de la imagen.</p></section>`);}
    $$('input[data-cat]', el).forEach(i => i.onchange = async () => {
      const files = [...i.files]; if (!files.length) return; toast('Guardando ' + files.length + ' foto(s)…');
      for (const f of files) { try { const b = await resizeImage(f, 1600); await St.savePhoto({ id: Mo.uid(), projectId: S.project.id, cat: i.dataset.cat, blob: b, createdAt: Date.now() }); } catch (e) { toast('Una foto no se pudo leer'); } }
      await loadPhotos(); tabFotos(el);
    });
    $$('[data-del]', el).forEach(b => b.onclick = async () => {const phid=b.dataset.del;if(S.project.approvedDrawing?.photoId===phid){alert('Esta foto es la referencia de un plano aprobado. Para retirarla, genera primero una nueva revisión con otra fotografía.');return;}if(!confirm('¿Eliminar esta fotografía del proyecto?'))return;if(S.project.drawingDraft?.sourcePhotoId===phid){S.project.drawingDraft.sourcePhotoId='';saveSoon();}await St.deletePhoto(phid);await loadPhotos();tabFotos(el);});
    $$('[data-trace]',el).forEach(b=>b.onclick=()=>{window.GSSPhotoEditor.initDraft(S.project).sourcePhotoId=b.dataset.trace;saveSoon();location.hash='#/p/'+S.project.id+'/editor';});
    $$('[data-open]', el).forEach(b => b.onclick = () => { const x = S.photos.find(y => y.id === b.dataset.open); const o = document.createElement('div'); o.className = 'overlay'; o.innerHTML = `<img src="${x.url}" alt=""><button aria-label="Cerrar">×</button>`; o.onclick = () => o.remove(); document.body.appendChild(o); });
  }

  // feet + inches input pair
  function ftin(id, val) { const s = Mo.split(val); return `<div class="ftin"><input id="${id}-f" inputmode="decimal" aria-label="pies" value="${s.f}"><span>′</span><input id="${id}-i" inputmode="decimal" aria-label="pulgadas" value="${s.i}"><span>″</span></div>`; }
  function readFtin(id) { const f = parseFloat(($('#' + id + '-f') || {}).value) || 0, i = parseFloat(($('#' + id + '-i') || {}).value) || 0; return f + i / 12; }
  function tabFieldMeasures(el) {
    const p=S.project, ok=Mo.hasApprovedGeometry(p), items=p.approvedDrawing?.items||[];
    const nDraft=p.drawingDraft?.items?.length||0;
    const q=Mo.areas(p), roof=p.roofDesign?.status==='approved-conceptual';
    el.innerHTML=`<div class="card field-start"><div class="cap">PASO 3 · PHOTO → PLAN</div>
      <h2>${ok?'Plano geométrico aprobado · REV '+p.approvedDrawing.revision:'Plano por dibujar o verificar'}</h2>
      <p class="lead">${ok?'Puedes editar el diseño y aprobar una nueva revisión; hasta entonces solo la revisión aprobada debe generar resultados.':'Abre una foto y dibuja cada opening. Marca como verificadas las medidas que confirmaste físicamente en la propiedad.'}</p>
      <div class="field-summary"><span>${nDraft} openings en borrador</span><span>${ok?'✓ Aprobado':'Pendiente'}</span></div>
      <a class="btn block" href="#/p/${p.id}/editor" style="text-decoration:none">✎ ${ok?'Editar nuevo plano':'Dibujar openings sobre foto'}</a></div>
      <div class="card"><div class="cap">OPENINGS · MEDIDAS APROBADAS</div>
      ${items.length?items.map((o,i)=>`<div class="field-measure-row"><span><b>${i+1}. ${o.type==='arch'?'Arco':'Rectangular'}</b><small>${o.profile||'1x2'} · ${o.door?'Con puerta · ':''}${o.verified?'✓ Verificado':'Por verificar'}</small></span><b>${Mo.fmt(o.w)} × ${Mo.fmt(o.h)}</b></div>`).join(''):'<p class="lead">No hay geometría aprobada. Este proyecto no utiliza los arcos de Boca Raton.</p>'}
      <div class="row"><span class="l">Área de screen del proyecto</span><b>${ok?q.total.toFixed(1)+' pie²':'—'}</b></div></div>
      <div class="card"><div class="cap">ROOF FRAME PLAN</div><p class="lead">${roof?'✓ '+p.roofDesign.style.toUpperCase()+' · revisión '+p.roofDesign.revision:'Opcional · crear solo cuando exista techo dentro del alcance'}</p>
      <a class="btn sec block" href="#/p/${p.id}/roof" style="text-decoration:none">▱ Flat / Mansard / Gable · Editor</a></div>
      <div class="card"><div class="cap">BIBLIOTECA TÉCNICA</div><a class="btn sec block" href="#/p/${p.id}/parts" style="text-decoration:none">Perfiles, puertas y manuales del fabricante</a></div>
      <div class="card"><p class="lead smalltext">Las fotos no proporcionan medidas exactas ni información estructural oculta. Validar la escala, los anclajes y las condiciones existentes en campo.</p></div>`;
  }

  function tabMedidas(el) {
    const p = S.project, a = Mo.areas(p), L = Mo.layout(p);
    const sw = (id, on, label) => `<div class="row"><span class="l">${label}</span><button class="sw" id="${id}" aria-pressed="${on}" aria-label="${esc(label)}"></button></div>`;
    el.innerHTML = `
      <div class="card workflow-card"><div class="cap">Roof Frame Plan · Flat / Mansard / Gable</div><div class="row"><span class="l">${p.roofDesign?.status ? '✓ Techo aprobado · Rev. '+p.roofDesign.revision : 'Geometría de techo por revisar'}</span><span class="sub">${p.roofDesign?.style||'flat'} · ${Mo.fmt(p.topScreen.length)} × ${Mo.fmt(p.topScreen.depth)}</span></div><button class="btn block" data-a="roofedit">▱ Editor de techo · perfiles y vigas</button><p class="lead smalltext">Selecciona Flat, Mansard o Gable y mueve vigas directamente en el plano táctil. Mansard requiere dimensiones suficientes.</p></div>
      <div class="card workflow-card"><div class="row"><span class="l"><b>Biblioteca de construcción</b><br><span class="sub">Perfiles reales, clips, puerta y montaje · Screen Tight / EZ Screen</span></span><a class="iconbtn" href="#/p/${p.id}/parts" aria-label="Abrir catálogo técnico" title="Catálogo técnico">⌁</a></div><a class="btn sec block" href="#/p/${p.id}/parts" style="text-decoration:none">Consultar materiales y detalles técnicos</a></div>
      <div class="card workflow-card"><div class="cap">Dibujo paramétrico desde fotografía</div><div class="row"><span class="l">${p.approvedDrawing?.revision ? '✓ Plano aprobado · Rev. '+p.approvedDrawing.revision : 'Borrador · pendiente de revisión'}</span><span class="sub">${p.drawingDraft?.items?.length||0} openings en el dibujo</span></div><button class="btn block" data-a="draw">✎ Abrir editor 2D</button><p class="lead smalltext">Superpone perfiles y cotas sobre tus fotos. Aprobar una revisión actualiza este listado y el modelo 3D.</p></div>
      <div class="card"><div class="row" style="min-height:0"><span class="l">Área total de screen</span><span class="big">${a.total.toFixed(1)} pie²</span></div>${L.warn.map(w => `<p class="warn">${esc(w)}</p>`).join('')}</div>
      <div class="card"><p class="cap">Openings</p>
        ${p.openings.map((o, i) => `<div class="opening">
          <div class="head"><b>Opening ${i + 1}</b><span class="sub">${Mo.openingArea(o).toFixed(1)} pie²</span></div>
          <div class="seg" role="group" aria-label="Forma del opening ${i + 1}" style="margin-bottom:10px"><button data-ot="${i}:arch" aria-pressed="${o.type === 'arch'}">Arco</button><button data-ot="${i}:rect" aria-pressed="${o.type === 'rect'}">Rectangular</button></div>
          <div class="grid2"><div class="field"><label>Ancho</label>${ftin('ow' + i, o.w)}</div><div class="field"><label>Alto total</label>${ftin('oh' + i, o.h)}</div></div>
          <div class="row"><span class="l">Lleva puerta de screen</span><button class="sw" data-od="${i}" aria-pressed="${!!o.door}" aria-label="Puerta en opening ${i + 1}"></button></div>
          ${p.openings.length > 1 ? `<button class="btn danger block" data-orm="${i}">Quitar opening</button>` : ''}
        </div>`).join('')}
        <div class="btns two"><button class="btn sec" data-a="addo">Agregar opening</button><button class="btn sec" data-a="copyo">Copiar el último</button></div>
        <div class="pad"></div>
        <div class="field"><label>Ancho de los pilares entre openings</label>${ftin('pier', p.pier)}</div>
      </div>
      <div class="card"><p class="cap">Porche</p>
        <div class="grid2"><div class="field"><label>Ancho total del muro</label>${ftin('pw', p.house.porchW)}</div><div class="field"><label>Profundidad</label>${ftin('pd', p.house.porchDepth)}</div></div>
        <div class="field"><label>Altura del muro de openings</label>${ftin('awh', p.house.archWallH)}</div>
      </div>
      <div class="card"><p class="cap">Top screen</p>
        ${sw('ts', p.topScreen.on, 'Lleva top screen')}
        <div class="grid2" style="margin-top:8px"><div class="field"><label>Largo</label>${ftin('tl', p.topScreen.length)}</div><div class="field"><label>Ancho</label>${ftin('td', p.topScreen.depth)}</div></div>
      </div>
      <div class="card"><p class="cap">Gutters y downspout</p>
        ${sw('sg', p.gutter.superOn, 'Super gutter nuevo en la fascia')}
        <div class="field" style="margin-top:8px"><label>Largo del super gutter</label>${ftin('sgl', p.gutter.superLen)}</div>
        <div class="row"><span class="l">Gutters existentes que se quedan</span><div class="seg" role="group" aria-label="Gutters existentes">${[0, 1, 2].map(n => `<button data-eg="${n}" aria-pressed="${p.gutter.existingRemain === n}">${n}</button>`).join('')}</div></div>
        ${sw('dn', p.gutter.downspoutNew, 'Downspout nuevo (color del frame)')}
      </div>
      <div class="card"><p class="cap">Color y malla</p>
        <div class="chips" role="group" aria-label="Color del frame">${Object.entries(Mo.FRAME_COLORS).filter(([k])=>k!=='black').map(([k, c]) => `<button class="chip" data-fc="${k}" aria-pressed="${p.frameColor === k}">${c.name}</button>`).join('')}</div>
        <div class="field" style="margin-top:12px"><label for="mesh">Tipo de malla</label><input id="mesh" value="${esc(p.mesh)}" placeholder="Ej. 18×14 charcoal"></div>
      </div>
      <div class="card"><p class="cap">Casa (para el modelo 3D)</p>
        <div class="grid2"><div class="field"><label>Ala izquierda, ancho</label>${ftin('lw', p.house.leftWingW)}</div><div class="field"><label for="nwin">Ventanas en el ala</label><input id="nwin" inputmode="numeric" value="${p.house.leftWindows}"></div></div>
        <div class="grid2"><div class="field"><label>Garage, ancho</label>${ftin('gw', p.house.garageW)}</div><div class="field"><label>Puerta del garage</label>${ftin('gdw', p.house.garageDoorW)}</div></div>
        <div class="field"><label>Ventana del porche, ancho</label>${ftin('fww', p.house.frontWindowW)}</div>
        ${sw('ev', p.house.evCharger, 'Cargador eléctrico en la pared')}
      </div>`;
    $('[data-a="draw"]',el).onclick=()=>location.hash='#/p/'+p.id+'/editor';
    $('[data-a="roofedit"]',el).onclick=()=>location.hash='#/p/'+p.id+'/roof';
    const recalc = () => {
      p.openings.forEach((o, i) => { o.w = Math.max(1, readFtin('ow' + i)); o.h = Math.max(o.w / 2 + 0.5, readFtin('oh' + i)); });
      p.pier = readFtin('pier'); p.house.porchW = Math.max(4, readFtin('pw')); p.house.porchDepth = Math.max(2, readFtin('pd')); p.house.archWallH = Math.max(6, readFtin('awh'));
      p.topScreen.length = readFtin('tl'); p.topScreen.depth = readFtin('td'); p.gutter.superLen = readFtin('sgl');
      p.house.leftWingW = Math.max(6, readFtin('lw')); p.house.garageW = Math.max(8, readFtin('gw')); p.house.garageDoorW = readFtin('gdw'); p.house.frontWindowW = readFtin('fww');
      p.house.leftWindows = Math.max(0, Math.min(6, parseInt($('#nwin').value) || 0)); p.mesh = $('#mesh').value;
      saveSoon(); refreshHeader();
      const a2 = Mo.areas(p); $('.big', el).textContent = a2.total.toFixed(1) + ' pie²';
      $$('.opening', el).forEach((n, i) => { $('.head .sub', n).textContent = Mo.openingArea(p.openings[i]).toFixed(1) + ' pie²'; });
    };
    $$('.ftin input, #nwin, #mesh', el).forEach(i => { i.addEventListener('input', recalc); i.addEventListener('focus', () => i.select && i.select()); });
    const redraw = () => { saveSoon(); refreshHeader(); const y = window.scrollY; tabMedidas(el); window.scrollTo(0, y); };
    $$('[data-ot]', el).forEach(b => b.onclick = () => { const [i, t] = b.dataset.ot.split(':'); p.openings[i].type = t; redraw(); });
    $$('[data-od]', el).forEach(b => b.onclick = () => { const i = +b.dataset.od, on = !p.openings[i].door; p.openings.forEach(o => o.door = false); p.openings[i].door = on; redraw(); });
    $$('[data-orm]', el).forEach(b => b.onclick = () => { p.openings.splice(+b.dataset.orm, 1); redraw(); });
    $('[data-a="addo"]', el).onclick = () => { p.openings.push({ type: 'rect', w: 4, h: 7, door: false }); redraw(); };
    $('[data-a="copyo"]', el).onclick = () => { const l = p.openings[p.openings.length - 1]; p.openings.push(Object.assign({}, l, { door: false })); redraw(); };
    const tog = (id, get, set) => { const b = $('#' + id, el); if (b) b.onclick = () => { set(!get()); redraw(); }; };
    tog('ts', () => p.topScreen.on, v => p.topScreen.on = v); tog('sg', () => p.gutter.superOn, v => p.gutter.superOn = v); tog('dn', () => p.gutter.downspoutNew, v => p.gutter.downspoutNew = v); tog('ev', () => p.house.evCharger, v => p.house.evCharger = v);
    $$('[data-eg]', el).forEach(b => b.onclick = () => { p.gutter.existingRemain = +b.dataset.eg; redraw(); });
    $$('[data-fc]', el).forEach(b => b.onclick = () => { p.frameColor = b.dataset.fc; redraw(); });
  }

  function viewerMarkup(withLogo) {
    return `<section class="viewport" aria-label="Visor 3D"><div class="stage" id="stage"></div><div class="vpill" id="vname"></div>${withLogo ? `<img class="vwm" src="${LOGO}" alt="" aria-hidden="true">` : ''}
      <nav class="views" aria-label="Vistas">${VIEWS.map(([k, l]) => `<button data-v="${k}" aria-pressed="${S.view === k}">${l}</button>`).join('')}</nav></section>`;
  }
  function wireViewer(el) {
    const v = viewer(); if (!v) return;
    v.mount($('#stage', el)); v.goView(S.view, true);
    const name = () => { const f = VIEWS.find(x => x[0] === S.view); $('#vname', el).textContent = (f ? f[1] : '') + ' · ' + (S.after ? 'Con screens' : 'Antes'); };
    name();
    $$('[data-v]', el).forEach(b => b.onclick = () => { S.view = b.dataset.v; v.goView(S.view); $$('[data-v]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); name(); const n = b.parentNode; n.scrollTo({ left: b.offsetLeft - (n.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' }); });
    $$('[data-ab]', el).forEach(b => b.onclick = () => { S.after = b.dataset.ab === '1'; v.setAfter(S.after); $$('[data-ab]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); name(); });
  }
  function tab3D(el) {
    // Resolve the active project in this scope; V16's missing `p` blanked the demo 3D tab.
    const p = S.project;
    if(S.project.kind==='field' && !Mo.hasApprovedGeometry(S.project)){
      el.innerHTML=`<section class="card field-start"><div class="cap">MODELO 3D · PROYECTO INDIVIDUAL</div><h2>Primero aprueba el dibujo del proyecto</h2><p class="lead">Este proyecto todavía no tiene geometría aprobada. Nunca mostraremos una casa o un screen enclosure de otro cliente.</p><a class="btn block" href="#/p/${S.project.id}/editor" style="text-decoration:none">Abrir editor 2D</a></section>`;return;
    }
    if(S.project.kind==='field'){
      el.innerHTML=`<div class="card field-start"><div class="cap">VISTA 3D · REV ${S.project.approvedDrawing.revision}</div><p class="lead">Solo muestra los openings y el techo que tú aprobaste. El entorno de la vivienda no se inventa; se incorporará cuando exista una geometría del sitio.</p></div>${viewerMarkup(true)}<div class="card"><div class="row"><span class="l">Revisión de dibujo</span><b>${S.project.approvedDrawing.revision}</b></div><div class="row"><span class="l">Techo</span><b>${S.project.roofDesign?.status==='approved-conceptual'?esc(S.project.roofDesign.style):'Sin techo aprobado'}</b></div></div><button class="btn sec block" data-a="shot">Guardar imagen de esta vista</button>`;
      wireViewer(el);const btn=$('[data-a="shot"]',el);btn.onclick=async()=>{try{const v=viewer();if(!v)return;await saveBlob('Gorilla-3D-'+slug(S.project.address)+'.png',dataURLtoBlob(v.snapshot(1500,1000,'frente','image/png')));}catch(err){toast('No se pudo exportar imagen');}};return;
    }
    el.innerHTML = `
      ${p.kind==='field'?'':`<div class="seg" role="group" aria-label="Comparar" style="margin-bottom:12px"><button data-ab="0" aria-pressed="${!S.after}">Antes</button><button data-ab="1" aria-pressed="${S.after}">Con screens</button></div>`}
      ${viewerMarkup(true)}
      <div class="pad"></div>
      <div class="card">
        <div class="row"><span class="l">Landscaping</span><button class="sw" id="tl" aria-pressed="${S.land}" aria-label="Landscaping"></button></div>
        <div class="row"><span class="l">Palmas del frente</span><button class="sw" id="tp" aria-pressed="${S.palms}" aria-label="Palmas"></button></div>
      </div>
      <a class="btn sec block" href="#/p/${S.project.id}/roof" style="text-decoration:none">▱ Editar plano de techo · Flat / Mansard</a>
      <button class="btn sec block" data-a="shot">Guardar captura de esta vista</button>`;
    wireViewer(el);
    $('#tl', el).onclick = e => { S.land = !S.land; e.currentTarget.setAttribute('aria-pressed', S.land); S.viewer.setLandscape(S.land); };
    $('#tp', el).onclick = e => { S.palms = !S.palms; e.currentTarget.setAttribute('aria-pressed', S.palms); S.viewer.setPalms(S.palms); };
    $('[data-a="shot"]', el).onclick = async () => { const v = viewer(); const u = v.snapshot(v.MOBILE ? 1600 : 2400, v.MOBILE ? 1000 : 1500, null, 'image/png'); await saveBlob('Vista-' + S.view + '-' + slug(S.project.address) + '.png', dataURLtoBlob(u)); };
  }

  function tabPrecio(el) {
    if(S.project.kind==='field' && !Mo.hasApprovedGeometry(S.project)){el.innerHTML=`<section class="card field-start"><div class="cap">COTIZACIÓN</div><h2>Esperando geometría aprobada</h2><p class="lead">No se generará un precio desde el proyecto de prueba. Primero dibuja y verifica tus openings.</p><a class="btn block" href="#/p/${S.project.id}/editor">Abrir editor 2D</a></section>`;return;}
    const p = S.project, q = Mo.quoteTotals(p), preset = [15, 20, 25].includes(Number(p.quote.rate));
    el.innerHTML = `
      <div class="card"><p class="cap">Área de screen</p>
        <table class="sq">${q.rows.map(r => `<tr><td>${esc(r.labelEs)}<br><span class="sub" style="font-size:13px">${esc(r.dimsEs)}</span></td><td>${r.sqft.toFixed(1)} pie²</td></tr>`).join('')}<tr class="tot"><td>Total</td><td>${q.sqft.toFixed(1)} pie²</td></tr></table>
      </div>
      <div class="card"><p class="cap">Precio por pie²</p>
        <div class="chips" role="group" aria-label="Precio por pie cuadrado">${[15, 20, 25].map(v => `<button class="chip" data-rate="${v}" aria-pressed="${Number(p.quote.rate) === v}">$${v}</button>`).join('')}<button class="chip" data-rate="otro" aria-pressed="${!preset}">Otro</button></div>
        <div class="field ${preset ? 'hidden' : ''}" id="otroBox" style="margin-top:12px"><label for="otro">Precio por pie² (USD)</label><input id="otro" inputmode="decimal" value="${preset ? '' : esc(p.quote.rate)}" placeholder="18.50"></div>
        <div class="row" style="margin-top:6px"><span class="l">${q.sqft.toFixed(1)} pie² × ${Mo.money(q.rate)}</span><span class="r" id="scr">${Mo.money(q.screens)}</span></div>
      </div>
      <div class="card"><p class="cap">Extras (opcional)</p>
        <div id="extras">${(p.quote.extras || []).map((e, i) => `<div class="extra"><input data-ed="${i}" value="${esc(e.desc)}" placeholder="Descripción" aria-label="Descripción del extra"><input data-ea="${i}" inputmode="decimal" value="${esc(e.amount)}" placeholder="$" aria-label="Importe"><button class="iconbtn" data-er="${i}" aria-label="Quitar extra">×</button></div>`).join('')}</div>
        <button class="btn sec block" data-a="adde">Agregar extra</button>
      </div>
      <div class="card"><div class="row" style="min-height:0"><span class="l">Total</span><span class="big" id="tot">${Mo.money(q.total)}</span></div></div>
      <div class="card">
        <div class="row"><span class="l">Idioma de la cotización</span><div class="seg" role="group" aria-label="Idioma"><button data-lang="es" aria-pressed="${p.quote.lang !== 'en'}">Español</button><button data-lang="en" aria-pressed="${p.quote.lang === 'en'}">English</button></div></div>
        <div class="field" style="margin-top:8px"><label for="qn">Número de cotización / job</label><input id="qn" value="${esc(p.quote.number)}" placeholder="Q-${new Date().getFullYear()}-001"></div>
        <button class="btn block" data-a="qpdf">Descargar cotización PDF</button>
      </div>`;
    const upd = () => { const q2 = Mo.quoteTotals(p); $('#scr', el).textContent = Mo.money(q2.screens); $('#tot', el).textContent = Mo.money(q2.total); $('.row .l', $$('.card', el)[1]).textContent = q2.sqft.toFixed(1) + ' pie² × ' + Mo.money(q2.rate); saveSoon(); };
    $$('[data-rate]', el).forEach(b => b.onclick = () => { $$('[data-rate]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); if (b.dataset.rate === 'otro') { $('#otroBox', el).classList.remove('hidden'); $('#otro', el).focus(); p.quote.rate = parseFloat($('#otro', el).value) || 0; } else { $('#otroBox', el).classList.add('hidden'); p.quote.rate = +b.dataset.rate; } upd(); });
    $('#otro', el).oninput = e => { p.quote.rate = parseFloat(e.target.value.replace(/[^\d.]/g, '')) || 0; upd(); };
    $$('[data-ed]', el).forEach(i => i.oninput = () => { p.quote.extras[+i.dataset.ed].desc = i.value; upd(); });
    $$('[data-ea]', el).forEach(i => i.oninput = () => { p.quote.extras[+i.dataset.ea].amount = parseFloat(i.value.replace(/[^\d.-]/g, '')) || 0; upd(); });
    $$('[data-er]', el).forEach(b => b.onclick = () => { p.quote.extras.splice(+b.dataset.er, 1); saveSoon(); tabPrecio(el); });
    $('[data-a="adde"]', el).onclick = () => { p.quote.extras.push({ desc: '', amount: '' }); saveSoon(); tabPrecio(el); };
    $$('[data-lang]', el).forEach(b => b.onclick = () => { p.quote.lang = b.dataset.lang; $$('[data-lang]', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); saveSoon(); });
    $('#qn', el).oninput = e => { p.quote.number = e.target.value; saveSoon(); };
    $('[data-a="qpdf"]', el).onclick = () => makeQuote(el);
  }

  async function busy(el, on) { $$('button', el).forEach(b => b.disabled = on); }
  async function makeQuote(el) {
    if(S.project.kind==='field'&&!Mo.hasApprovedGeometry(S.project)){toast('Primero aprueba el plano 2D');return;}
    busy(el, true); toast('Generando cotización…', 8000); await new Promise(r => setTimeout(r, 50));
    try { const v = viewer(); const render = v.snapshot(1500, 920, 'izq', 'image/jpeg', { after: true }); const blob = await window.GSSQuote(S.project, { logo: await logoData(), company: S.project._company || company(), render }); await saveBlob('Cotizacion-' + slug(S.project.address) + '.pdf', blob); toast('Cotización lista'); }
    catch (e) { console.error(e); toast('No se pudo generar la cotización'); }
    busy(el, false);
  }
  async function makePlan(el) {
    if(S.project.kind==='field' && !Mo.hasApprovedGeometry(S.project)){toast('Primero aprueba el plano 2D');return;}
    if(S.project.kind==='field'){
      busy(el,true);try{
        const existing=S.photos.find(x=>x.cat==='frente')||S.photos.find(x=>x.cat==='openings');
        const aerial=S.photos.find(x=>x.cat==='aerea');
        const assets={logo:await logoData(),company:company(),existing:existing?await blobToDataURL(existing.blob):null,aerial:aerial?await blobToDataURL(aerial.blob):null};
        const blob=await window.GSSFieldPlan(S.project,assets);
        await saveBlob('Plano-Gorilla-'+slug(S.project.address)+'.pdf',blob);toast('Plano generado desde TU proyecto');
      }catch(e){console.error(e);toast('Error al generar el plano');}busy(el,false);return;
    }
    busy(el, true); toast('Generando plano…', 10000); await new Promise(r => setTimeout(r, 50));
    try {
      const v = viewer(), big = v.MOBILE ? [1400, 860] : [2000, 1230];
      const shots = { persp: v.snapshot(big[0], big[1], 'izq', 'image/jpeg', { after: true }), front: v.snapshot(1200, 740, 'frente', 'image/jpeg', { after: true }), porch: v.snapshot(1200, 740, 'porche', 'image/jpeg', { after: true }), top: v.snapshot(1200, 740, 'top', 'image/jpeg', { after: true }), before3d: v.snapshot(1600, 920, 'frente', 'image/jpeg', { after: false }) };
      const pick = ['frente', 'render', 'street', 'aerea'], photos = [];
      for (const c of pick) { const ph = S.photos.find(x => x.cat === c); if (ph && photos.length < 2) photos.push({ label: { frente: 'Existing condition (photo)', render: 'Proposed (render)', street: 'Street view', aerea: 'Aerial view' }[c], url: await blobToDataURL(ph.blob) }); }
      const aerial=S.photos.find(x=>x.cat==='aerea'); const blob = await window.GSSPlan(S.project, Object.assign({ logo: await logoData(), company: company(), photos, aerial:aerial?await blobToDataURL(aerial.blob):null }, shots));
      await saveBlob('Plano-Screens-' + slug(S.project.address) + '.pdf', blob); toast('Plano listo');
    } catch (e) { console.error(e); toast('No se pudo generar el plano'); }
    busy(el, false);
  }
  function shareURL(withPrice) { const p = JSON.parse(JSON.stringify(S.project)); p._company = company(); delete p.geo; if (!withPrice) { p.quote.rate = 0; p.quote.extras = []; p.quote.hidePrice = true; } return location.href.split('#')[0] + '#/cliente/' + Mo.encodeShare(p); }
  function tabEntregar(el) {
    const p = S.project;
    el.innerHTML = `
      ${p.kind==='field'&&!Mo.hasApprovedGeometry(p)?`<section class="card field-start"><div class="cap">ENTREGABLES · PENDIENTE</div><h2>Aprueba primero el plano</h2><p class="lead">Mientras tanto puedes exportar y respaldar el proyecto con sus fotos. Ningún PDF mostrará la casa del ejemplo.</p><a class="btn sec block" href="#/p/${p.id}/editor">Abrir dibujo 2D</a></section>`:''}
      ${p.kind==='field'&&!Mo.hasApprovedGeometry(p)?'':`<div class="card"><p class="cap">Para el ingeniero</p>
        <p class="lead" style="font-size:14px">Plano arquitectónico 11 × 17: portada, ubicación, vista aérea (si fue agregada), elevación, planta, detalles y fotos. Sin líneas rojas; trabajo nuevo en bronce oscuro.</p>
        <button class="btn block" data-a="plan">Descargar plano PDF</button></div>
      <div class="card"><p class="cap">Para el cliente</p>
        <button class="btn sec block" data-a="quote">Descargar cotización PDF</button>
        <div class="pad"></div>
        <div class="row"><span class="l">Incluir precio en el link</span><button class="sw" id="wp" aria-pressed="true" aria-label="Incluir precio"></button></div>
        <button class="btn sec block" data-a="link">Compartir link del 3D con el cliente</button>
        <p class="lead" style="font-size:13px;margin:8px 0 0">El link lleva el modelo y la cotización, sin fotos ni notas internas.</p></div>`}
      <div class="card"><p class="cap">Pasar el proyecto a otro dispositivo</p>
        <button class="btn sec block" data-a="export">Exportar proyecto con fotos (.json)</button></div>`;
    const btnPlan=$('[data-a="plan"]',el);if(btnPlan)btnPlan.onclick = () => makePlan(el);
    const btnQuote=$('[data-a="quote"]',el);if(btnQuote)btnQuote.onclick = () => makeQuote(el);
    if($('#wp',el))$('#wp', el).onclick = e => e.currentTarget.setAttribute('aria-pressed', String(e.currentTarget.getAttribute('aria-pressed') !== 'true'));
    const btnLink=$('[data-a="link"]',el);if(btnLink)btnLink.onclick = async () => {
      const url = shareURL($('#wp', el)?.getAttribute('aria-pressed') === 'true');
      try { if (navigator.share) { await navigator.share({ title: 'Su proyecto de screens', url }); return; } } catch (e) { if (e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(url); toast('Link copiado'); } catch (e) { prompt('Copia este link:', url); }
    };
    $('[data-a="export"]', el).onclick = async () => {
      toast('Preparando archivo…');
      const photos = []; for (const ph of S.photos) photos.push({ id: ph.id, cat: ph.cat, data: await blobToDataURL(ph.blob) });
      await saveBlob('Proyecto-' + slug(p.address) + '.json', new Blob([JSON.stringify({ app: 'gorilla-screens', v: 1, project: p, photos })], { type: 'application/json' }));
    };
  }

  // ---------- client view (read-only, opened from the shared link)
  function clientView(data) {
    let p; try { p = Mo.normalize(Mo.decodeShare(data)); } catch (e) { app.innerHTML = topbar('Link no válido', '') + '<main class="wrap"><div class="card">Este link está incompleto. Pide uno nuevo a tu vendedor.</div></main>'; return; }
    S.project = p; S.photos = []; S.builtFor = ''; S.view='frente';
    document.title = 'Su proyecto · ' + (p.address || '');
    if(p.kind==='field'&&!Mo.hasApprovedGeometry(p)){app.innerHTML=topbar('Plano no aprobado',p.address)+'<main class="wrap"><div class="card">No existe un modelo 3D aprobado para compartir.</div></main>';return;}
    const q = Mo.quoteTotals(p), showPrice = !p.quote.hidePrice;
    app.innerHTML = topbar('Su proyecto de screens', p.address) + `<main class="wrap">
      ${p.kind==='field'?'':`<div class="seg" role="group" aria-label="Comparar" style="margin-bottom:12px"><button data-ab="0" aria-pressed="${!S.after}">Antes</button><button data-ab="1" aria-pressed="${S.after}">Con screens</button></div>`}
      ${viewerMarkup(true)}<div class="pad"></div>
      <div class="card"><p class="cap">Resumen</p>
        <div class="row"><span class="l">Área de screen</span><span class="r">${q.sqft.toFixed(1)} pie²</span></div>
        <div class="row"><span class="l">Frame</span><span class="r">${esc(p.kind==='field'?[...new Set(p.openings.map(o=>o.profile||'1x2'))].join(', '):'1×2 de una pieza')} · ${esc((Mo.FRAME_COLORS[p.frameColor] || {}).name || '')}</span></div>
        ${showPrice ? `<div class="row"><span class="l">Total</span><span class="r" style="font-weight:700;color:var(--text)">${Mo.money(q.total)}</span></div>` : ''}
      </div>
      ${showPrice ? '<button class="btn block" data-a="quote">Descargar cotización PDF</button>' : ''}
      <p class="lead" style="margin-top:16px;font-size:13px">Gorilla Screening Solutions LLC · Las medidas se verifican en campo antes de fabricar.</p></main>`;
    wireViewer(app);
    const qb = $('[data-a="quote"]'); if (qb) qb.onclick = () => makeQuote(app);
  }

  // ---------- boot
  if (!location.hash) location.hash = '#/';
  route();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
})();
