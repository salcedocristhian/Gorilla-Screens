/* Cotización (carta vertical) — precio por pie cuadrado. Español o inglés. */
(function () {
  const Mo = window.GSSModel;
  const TXT = {
    es: { title: 'COTIZACIÓN', no: 'No.', date: 'Fecha', valid: 'Válida por 30 días', client: 'CLIENTE', project: 'PROYECTO', desc: 'Descripción', qty: 'Cantidad', rate: 'Precio', amount: 'Importe', screens: 'Screen enclosure — frame 1×2 de una pieza, color ', mesh: 'malla ', breakdown: 'Desglose de área', extras: 'Extras', total: 'TOTAL', scope: 'ALCANCE DEL TRABAJO', terms: 'TÉRMINOS', termsTxt: ['Depósito: [ ]% al aceptar, saldo al terminar.', 'Permiso e ingeniería: [incluido / no incluido].', 'Medidas sujetas a verificación en campo antes de fabricar.'], sign: 'Aceptado por el cliente', sigDate: 'Fecha', seller: 'Vendedor', sqft: 'pie cuad.', render: 'Vista 3D propuesta' },
    en: { title: 'QUOTE', no: 'No.', date: 'Date', valid: 'Valid for 30 days', client: 'CLIENT', project: 'PROJECT', desc: 'Description', qty: 'Qty', rate: 'Rate', amount: 'Amount', screens: 'Screen enclosure — one-piece 1×2 frame, color ', mesh: 'mesh ', breakdown: 'Area breakdown', extras: 'Extras', total: 'TOTAL', scope: 'SCOPE OF WORK', terms: 'TERMS', termsTxt: ['Deposit: [ ]% upon acceptance, balance upon completion.', 'Permit & engineering: [included / not included].', 'Dimensions subject to field verification before fabrication.'], sign: 'Accepted by client', sigDate: 'Date', seller: 'Salesperson', sqft: 'sq ft', render: 'Proposed 3D view' }
  };
  function scope(P, lang) {
    const es = lang === 'es', fc = Mo.FRAME_COLORS[P.frameColor] || Mo.FRAME_COLORS.bronze, c = es ? fc.name.toLowerCase() : fc.en.toLowerCase();
    const n = P.openings.length, door = P.openings.some(o => o.door);
    const out = [];
    const profiles=[...new Set(P.openings.map(o=>o.profile||'1x2'))].join(', ');
    out.push(es ? `Screens nuevos en (${n}) openings con perfiles ${profiles} de aluminio, color ${c}.` : `New screens at (${n}) openings with aluminum profiles ${profiles}, ${c}.`);
    if (door) out.push(es ? 'Puerta de screen con bisagras, manija y cierre.' : 'Screen door with hinges, pull handle and closer.');
    if (P.topScreen.on) {const roof=P.roofDesign?.style||'flat';const geom=Mo.fmt(P.topScreen.length)+' × '+Mo.fmt(P.topScreen.depth);out.push(es?`Techo ${roof} de screen ${geom}; perfiles y anclajes según diseño aprobado.`:`${roof} screen roof ${geom}; profiles and fasteners per approved design.`);}
    if (P.gutter.superOn) out.push(es ? `Super gutter nuevo de ${Math.round(P.gutter.superLen)}′ en la fascia, color del frame.` : `New ${Math.round(P.gutter.superLen)}′ super gutter on fascia, frame color.`);
    if (P.gutter.existingRemain) out.push(es ? `${P.gutter.existingRemain} gutter(s) existente(s) se quedan.` : `${P.gutter.existingRemain} existing gutter(s) to remain.`);
    if (P.gutter.downspoutNew) out.push(es ? 'Downspout nuevo, mismo lugar y posición, color del frame.' : 'New downspout, same location and position, frame color.');
    return out;
  }
  window.GSSQuote = async function (P, A) {
    const { jsPDF } = window.jspdf; P = Mo.normalize(P);
    const lang = P.quote.lang === 'en' ? 'en' : 'es', t = TXT[lang], q = Mo.quoteTotals(P), co = A.company || {};
    const doc = new jsPDF({ unit: 'in', format: 'letter', compress: true });
    const font = (sz, st) => { doc.setFont('helvetica', st || 'normal'); doc.setFontSize(sz); };
    const ink = c => { doc.setTextColor(...c); doc.setDrawColor(...c); };
    const clean = s => String(s).replace(/′/g, "'").replace(/″/g, '"').replace(/×/g, 'x').replace(/—/g, '-').replace(/²/g, '2');
    const dk = [29, 29, 31], sub = [110, 110, 115], acc = [79, 61, 44];
    if (A.logo) doc.addImage(A.logo, 'PNG', 0.6, 0.45, 1.75, 1.3);
    ink(dk); font(10, 'bold'); doc.text(co.name || 'GORILLA SCREENING SOLUTIONS LLC', 7.9, 0.75, { align: 'right' });
    font(8.5); ink(sub); [co.address || '[COMPANY ADDRESS]', co.phone || '[PHONE]', co.email || '[EMAIL]', 'Lic. # ' + (co.license || '[LICENSE]')].forEach((l, i) => doc.text(clean(l), 7.9, 0.95 + i * 0.16, { align: 'right' }));
    ink(acc); font(22, 'bold'); doc.text(t.title, 0.6, 2.25);
    ink(sub); font(9); const today = new Date();
    doc.text(`${t.no} ${P.quote.number || '-'}    ${t.date}: ${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}    ${t.valid}`, 0.6, 2.5);
    ink(dk); doc.setLineWidth(0.01); doc.line(0.6, 2.65, 7.9, 2.65);
    font(8, 'bold'); ink(sub); doc.text(t.client, 0.6, 2.9); doc.text(t.project, 4.3, 2.9);
    ink(dk); font(10, 'bold'); doc.text(clean(P.client.name || '-'), 0.6, 3.08); font(9); [P.client.phone, P.client.email].filter(Boolean).forEach((l, i) => doc.text(clean(l), 0.6, 3.25 + i * 0.16));
    font(10, 'bold'); const ad = doc.splitTextToSize(clean(P.address || '-'), 3.5); doc.text(ad, 4.3, 3.08);
    // table
    let y = 3.75; doc.setFillColor(245, 245, 247); doc.rect(0.6, y, 7.3, 0.3, 'F'); font(8.5, 'bold'); ink(sub);
    doc.text(t.desc, 0.7, y + 0.2); doc.text(t.qty, 5.2, y + 0.2, { align: 'right' }); doc.text(t.rate, 6.4, y + 0.2, { align: 'right' }); doc.text(t.amount, 7.8, y + 0.2, { align: 'right' });
    y += 0.5; ink(dk); font(9.5, 'bold');
    const fc = Mo.FRAME_COLORS[P.frameColor] || Mo.FRAME_COLORS.bronze;
    const d1 = doc.splitTextToSize(clean(t.screens + (lang === 'es' ? fc.name.toLowerCase() : fc.en.toLowerCase()) + ', ' + t.mesh + (P.mesh || '[MESH TYPE]')), 3.2);
    doc.text(d1, 0.7, y); font(9.5); doc.text(q.sqft.toFixed(1) + ' ' + t.sqft, 5.2, y, { align: 'right' }); doc.text(Mo.money(q.rate) + '/' + t.sqft, 6.4, y, { align: 'right' }); font(9.5, 'bold'); doc.text(Mo.money(q.screens), 7.8, y, { align: 'right' });
    y += d1.length * 0.16 + 0.08; font(8); ink(sub); doc.text(t.breakdown + ':', 0.85, y); y += 0.15;
    q.rows.forEach(r => { doc.text(clean((lang === 'es' ? r.labelEs : r.label) + ' — ' + (lang === 'es' ? r.dimsEs : r.dims)), 0.95, y); doc.text(r.sqft.toFixed(1) + ' ' + t.sqft, 5.2, y, { align: 'right' }); y += 0.15; });
    if (q.extras.length) { y += 0.1; ink(dk); font(9, 'bold'); doc.text(t.extras, 0.7, y); y += 0.17; font(9.5); q.extras.forEach(e => { doc.text(clean(e.desc), 0.85, y); doc.text(Mo.money(e.amount), 7.8, y, { align: 'right' }); y += 0.18; }); }
    y += 0.08; ink(dk); doc.line(4.3, y, 7.9, y); y += 0.3; font(13, 'bold'); doc.text(t.total, 4.4, y); ink(acc); doc.text(Mo.money(q.total), 7.8, y, { align: 'right' });
    // 3D image + scope
    y += 0.35; const imgY = y;
    if (A.render) { doc.addImage(A.render, 'JPEG', 0.6, imgY, 3.6, 2.2); font(7.5); ink(sub); doc.text(t.render, 0.6, imgY + 2.35); }
    let sy = imgY + 0.1; ink(dk); font(8.5, 'bold'); doc.text(t.scope, 4.45, sy); sy += 0.18; font(8.5);
    scope(P, lang).forEach(s => { const l = doc.splitTextToSize('- ' + clean(s), 3.4); doc.text(l, 4.45, sy); sy += l.length * 0.14 + 0.04; });
    y = Math.max(imgY + 2.6, sy + 0.15);
    font(8.5, 'bold'); ink(dk); doc.text(t.terms, 0.6, y); y += 0.18; font(8.5); ink(sub); t.termsTxt.forEach(l => { doc.text(l, 0.6, y); y += 0.15; });
    y = Math.max(y + 0.5, 9.9); ink(dk); doc.line(0.6, y, 3.6, y); doc.line(4.3, y, 5.9, y); doc.line(6.3, y, 7.9, y);
    font(8); ink(sub); doc.text(t.sign, 0.6, y + 0.15); doc.text(t.sigDate, 4.3, y + 0.15); doc.text(t.seller + (P.salesperson ? ': ' + clean(P.salesperson) : ''), 6.3, y + 0.15);
    return doc.output('blob');
  };
})();
