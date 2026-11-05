/* Gorilla Screening Solutions — modelo del proyecto (unidades: pies) */
(function () {
  const FRAME_COLORS = {
    bronze: { name: 'Bronce', en: 'Bronze', hex: '#4F3D2C' },
    white: { name: 'Blanco', en: 'White', hex: '#F2F2EE' },
    black: { name: 'Negro', en: 'Black', hex: '#1E1E20' }
  };

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function demoTemplate() {
    return {
      v: 1,
      id: uid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      address: '',
      client: { name: '', phone: '', email: '' },
      salesperson: '',
      notes: '',
      house: {
        leftWingW: 18, leftWindows: 3, porchW: 16, porchDepth: 6, archWallH: 9 + 2 / 12,
        garageW: 13, garageDoorW: 9, frontWindowW: 6.5, evCharger: false, palms: false
      },
      openings: [
        { type: 'arch', w: 4, h: 7, door: true },
        { type: 'arch', w: 4, h: 7, door: false },
        { type: 'arch', w: 4, h: 7, door: false }
      ],
      pier: 1.25,
      topScreen: { on: true, length: 16, depth: 2 },
      gutter: { superOn: true, superLen: 16, existingRemain: 2, downspoutNew: true },
      frameColor: 'bronze',
      mesh: '18×14 fiberglass charcoal',
      quote: { rate: 20, extras: [], lang: 'es', number: '' }
    };
  }

  /** New field jobs NEVER inherit a test house, openings or roof. */
  function emptyProject() {
    return {
      v: 2, kind: 'field', id: uid(), createdAt: Date.now(), updatedAt: Date.now(),
      workflow: 'photos', address: '', client: { name: '', phone: '', email: '' },
      salesperson: '', notes: '',
      house: { leftWingW: 0, leftWindows: 0, porchW: 0, porchDepth: 0,
        archWallH: 0, garageW: 0, garageDoorW: 0, frontWindowW: 0, evCharger: false, palms: false },
      openings: [], pier: 0, topScreen: { on: false, length: 0, depth: 0 },
      gutter: { superOn: false, superLen: 0, existingRemain: 0, downspoutNew: false },
      frameColor: 'bronze', mesh: '18×14 fiberglass charcoal',
      drawingDraft: null, approvedDrawing: null, roofDraft: null, roofDesign: null,
      designStatus: 'awaiting-photos',
      quote: { rate: 0, extras: [], lang: 'es', number: '' }
    };
  }
  const defaultProject = emptyProject;
  function hasApprovedGeometry(p) {
    return !!(p && p.kind === 'field' && p.approvedDrawing &&
      Array.isArray(p.approvedDrawing.items) && p.approvedDrawing.items.length &&
      p.designStatus === 'approved');
  }
  function demoProject() {
    const p = demoTemplate();
    p.id = 'demo-22743'; p.kind = 'demo'; p.designStatus = 'example';
    p.address = '22743 SW 56th Ave, Boca Raton, FL 33433';
    p.client.name = '[Nombre del cliente]';
    p.house.evCharger = true;
    p.notes = 'Proyecto de ejemplo. Arcos 4×7 (3), top screen de un solo panel 16′ × 2′ sin soportes, super gutter 16′ en fascia, 2 gutters existentes se quedan, downspout nuevo color frame.';
    return p;
  }

  // ---------- áreas ----------
  function openingArea(o) {
    if (o.type === 'arch') { const r = o.w / 2, spring = Math.max(0, o.h - r); return o.w * spring + Math.PI * r * r / 2; }
    return o.w * o.h;
  }
  function areas(p) {
    const rows = p.openings.map((o, i) => ({
      label: 'Opening ' + (i + 1) + (o.door ? ' (door)' : ''),
      labelEs: 'Opening ' + (i + 1) + (o.door ? ' (con puerta)' : ''),
      dims: fmt(o.w) + ' × ' + fmt(o.h) + (o.type === 'arch' ? ' arch' : ''),
      dimsEs: fmt(o.w) + ' × ' + fmt(o.h) + (o.type === 'arch' ? ' arco' : ' rect.'),
      sqft: openingArea(o)
    }));
    if (p.topScreen?.on && p.topScreen.length > 0 && p.topScreen.depth > 0) {
      const r=p.roofDesign, W=p.topScreen.length, D=p.topScreen.depth;
      let sf=W*D, label='Top screen';
      if(r?.status==='approved-conceptual' && r.style==='mansard' && r.inset>0 && r.inset*2<Math.min(W,D)) {
        const i=r.inset;sf=(W-2*i)*(D-2*i)+2*(W+D-2*i)*Math.hypot(i,r.rise||0);label='Mansard roof screen';
      } else if(r?.status==='approved-conceptual' && r.style==='gable') {sf=2*W*Math.hypot(D/2,r.rise||0);label='Gable roof screen';}
      rows.push({label, labelEs:label,dims:fmt(W)+' × '+fmt(D),dimsEs:fmt(W)+' × '+fmt(D),sqft:sf});
    }
    const total = rows.reduce((s, r) => s + r.sqft, 0);
    return { rows, total };
  }
  function quoteTotals(p) {
    const a = areas(p), rate = Number(p.quote.rate) || 0, sqft = Math.round(a.total * 10) / 10;
    const screens = round2(sqft * rate);
    const extras = (p.quote.extras || []).filter(e => e.desc || e.amount).map(e => ({ desc: e.desc || '', amount: Number(e.amount) || 0 }));
    const total = round2(screens + extras.reduce((s, e) => s + e.amount, 0));
    return { sqft, rows: a.rows, rate, screens, extras, total };
  }
  function round2(n) { return Math.round(n * 100) / 100; }
  function money(n) { return '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  // ---------- pies / pulgadas ----------
  function split(ft) { let tot = Math.round(ft * 12 * 8) / 8; const f = Math.floor(tot / 12 + 1e-9); return { f, i: Math.round((tot - f * 12) * 8) / 8 }; }
  function fmt(ft) { const s = split(ft); return s.i ? s.f + '′-' + s.i + '″' : s.f + '′'; }
  function fmtPlain(ft) { const s = split(ft); return s.f + "'-" + s.i + '"'; }

  // ---------- layout del muro de openings ----------
  function layout(p) {
    const W = Number(p.house.porchW)||0, n = p.openings.length;
    if (!n) return { W, pier:Number(p.pier)||0, end:0, items:[], doorIdx:-1, warn:[] };
    const sum = p.openings.reduce((s, o) => s + o.w, 0);
    const pier = Math.max(0.5, Number(p.pier) || 1);
    let end = (W - sum - pier * (n - 1)) / 2;
    const warn = [];
    if (end < 0.25) warn.push('Los openings y pilares no caben en el ancho del porche. Revisa las medidas.');
    end = Math.max(0.25, end);
    let x = end; const items = p.openings.map(o => { const it = Object.assign({}, o, { x0: x, x1: x + o.w, cx: x + o.w / 2 }); x += o.w + pier; return it; });
    const doorIdx = Math.max(0, p.openings.findIndex(o => o.door));
    return { W, pier, end, items, doorIdx, warn };
  }

  // ---------- compartir con el cliente (todo en el link) ----------
  function encodeShare(p) {
    const lite = JSON.parse(JSON.stringify(p)); delete lite.notes;
    const json = JSON.stringify(lite);
    const b = btoa(unescape(encodeURIComponent(json)));
    return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeShare(s) {
    const b = s.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b))));
  }
  function normalize(p) { // Never populate missing geometry from the demonstration project.
    if (!p || typeof p !== 'object') throw new Error('Project missing');
    // Legacy data without a kind are preserved as legacy, never silently replaced.
    const d = p.kind === 'demo' || p.id === 'demo-22743' ? demoTemplate() : emptyProject();
    const out = Object.assign({}, d, p);
    out.kind = p.kind || (p.id === 'demo-22743' ? 'demo' : 'legacy');
    ['house', 'topScreen', 'gutter', 'quote', 'client'].forEach(k => {
      out[k] = Object.assign({}, d[k], p[k] || {});
    });
    out.openings = Array.isArray(p.openings) ? p.openings.map(o => Object.assign({}, o)) : [];
    if (out.kind === 'field') {
      out.approvedDrawing = p.approvedDrawing || null;
      out.designStatus = p.designStatus || (out.approvedDrawing ? 'approved' : 'awaiting-photos');
    }
    return out;
  }

  window.GSSModel = { FRAME_COLORS, uid, emptyProject, defaultProject, demoProject, hasApprovedGeometry,
    openingArea, areas, quoteTotals, money, fmt, fmtPlain, split, layout, encodeShare, decodeShare, normalize };
})();
