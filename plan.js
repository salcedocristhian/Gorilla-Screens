/* Gorilla Screening — 11 x 17 architectural sheets. Bronze linework differentiates new work; never a sealed engineering design. */
(function () {
  const Mo = window.GSSModel;
  const RED = [74, 57, 44], BLK = [28, 37, 49], GRY = [116, 122, 130], LRED = [198, 201, 203];

  window.GSSPlan = async function (P, A) {
    const { jsPDF } = window.jspdf;
    P = Mo.normalize(P);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: [11, 17], compress: true });
    const col = c => { doc.setDrawColor(...c); doc.setTextColor(...c); };
    const lw = w => doc.setLineWidth(w);
    const font = (sz, st) => { doc.setFont('helvetica', st || 'normal'); doc.setFontSize(sz); };
    const ftin = ft => Mo.fmtPlain(ft);
    const poly = (pts, close) => { for (let i = 0; i < pts.length - 1; i++) doc.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); if (close) doc.line(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1]); };
    const archPts = (cx, base, r, spring, n) => { n = n || 40; const p = [[cx - r, base], [cx - r, base - spring]]; for (let i = 0; i <= n; i++) { const a = Math.PI - Math.PI * i / n; p.push([cx + r * Math.cos(a), base - spring - r * Math.sin(a)]); } p.push([cx + r, base]); return p; };
    const rectPts = (x0, x1, base, h) => [[x0, base], [x0, base - h], [x1, base - h], [x1, base]];
    const openPts = (o, X, Y, s, inset) => { inset = inset || 0; const h = o.h; if (o.type === 'arch') return archPts(X(o.cx), Y(0) - inset, o.w / 2 * s - inset, (h - o.w / 2) * s - inset); return rectPts(X(o.x0) + inset, X(o.x1) - inset, Y(0) - inset, h * s - 2 * inset); };
    const meshArch = (cx, base, r, spring, step) => { for (let y = base - step; y > base - spring - r; y -= step) { const dy = base - spring - y; const hw = dy <= 0 ? r : Math.sqrt(Math.max(0, r * r - dy * dy)); doc.line(cx - hw, y, cx + hw, y); } for (let x = cx - r + step; x < cx + r; x += step) { const dx = x - cx; doc.line(x, base, x, base - spring - Math.sqrt(Math.max(0, r * r - dx * dx))); } };
    const meshRect = (x0, x1, y0, y1, step) => { for (let y = y0 + step; y < y1; y += step) doc.line(x0, y, x1, y); for (let x = x0 + step; x < x1; x += step) doc.line(x, y0, x, y1); };
    const meshOpen = (o, X, Y, s, inset, step) => { if (o.type === 'arch') meshArch(X(o.cx), Y(0) - inset, o.w / 2 * s - inset, (o.h - o.w / 2) * s - inset, step); else meshRect(X(o.x0) + inset, X(o.x1) - inset, Y(o.h) + inset, Y(0) - inset, step); };
    const tick = (x, y) => doc.line(x - 0.04, y + 0.04, x + 0.04, y - 0.04);
    const dimH = (x1, x2, y, text) => { col(BLK); lw(0.006); doc.line(x1, y, x2, y); doc.line(x1, y - 0.06, x1, y + 0.06); doc.line(x2, y - 0.06, x2, y + 0.06); tick(x1, y); tick(x2, y); font(6.5); doc.text(text, (x1 + x2) / 2, y + 0.13, { align: 'center' }); };
    const dimV = (x, y1, y2, text) => { col(BLK); lw(0.006); doc.line(x, y1, x, y2); doc.line(x - 0.06, y1, x + 0.06, y1); doc.line(x - 0.06, y2, x + 0.06, y2); tick(x, y1); tick(x, y2); font(6.5); doc.text(text, x - 0.06, (y1 + y2) / 2, { angle: 90, align: 'center' }); };
    const leader = (x1, y1, x2, y2, lines, color) => { col(color || BLK); lw(0.006); doc.line(x1, y1, x2, y2); doc.circle(x1, y1, 0.012, 'F'); font(6); lines.forEach((t, i) => doc.text(t, x2 + (x2 >= x1 ? 0.04 : -0.04), y2 + 0.03 + i * 0.1, { align: x2 >= x1 ? 'left' : 'right' })); };
    const title = (x, y, num, name, scale) => { col(BLK); lw(0.01); doc.circle(x + 0.16, y, 0.16); font(9, 'bold'); doc.text(String(num), x + 0.16, y + 0.045, { align: 'center' }); doc.text(name, x + 0.42, y - 0.01); lw(0.012); doc.line(x + 0.42, y + 0.04, x + 0.42 + doc.getTextWidth(name), y + 0.04); font(6.5); doc.text('Scale: ' + scale, x + 0.42, y + 0.16); };
    const wrap = (text, x, y, w, sz, lh, st) => { font(sz, st); const ls = doc.splitTextToSize(text, w); doc.text(ls, x, y, { lineHeightFactor: lh || 1.25 }); return y + ls.length * sz / 72 * (lh || 1.25); };
    const scaleFor = (len, room) => { const opts = [[0.5, '1/2" = 1\'-0"'], [0.375, '3/8" = 1\'-0"'], [0.25, '1/4" = 1\'-0"'], [0.1875, '3/16" = 1\'-0"'], [0.125, '1/8" = 1\'-0"']]; return opts.find(o => len * o[0] <= room) || opts[opts.length - 1]; };

    const L = Mo.layout(P), H = P.house, PW = H.porchW, AWH = H.archWallH, FR = 2 / 12;
    const fasciaZ = P.topScreen.on ? -(P.topScreen.depth + 0.5) : -3;
    const FC = (Mo.FRAME_COLORS[P.frameColor] || Mo.FRAME_COLORS.bronze).en.toUpperCase();
    const addr = P.address.split(',');
    const addr1 = (addr[0] || '').trim(), addr2 = addr.slice(1).join(',').trim();
    const company = A.company || {};
    const today = new Date(); const ds = String(today.getMonth() + 1).padStart(2, '0') + '/' + String(today.getDate()).padStart(2, '0') + '/' + today.getFullYear();
    const nOpen = P.openings.length, nArch = P.openings.filter(o => o.type === 'arch').length;
    const projName = 'SCREEN ENCLOSURE - (' + nOpen + ') ' + (nArch === nOpen ? 'ARCHED' : '') + ' OPENINGS' + (P.topScreen.on ? ' + TOP SCREEN' : '');

    function frame(sheetNo, sheetName) {
      col(BLK); lw(0.03); doc.rect(0.3, 0.3, 16.4, 10.4); lw(0.01); doc.rect(0.38, 0.38, 16.24, 10.24);
      const X = 14.1, W = 2.52; lw(0.012); doc.line(X, 0.38, X, 10.62);
      if (A.logo) doc.addImage(A.logo, 'PNG', X + 0.26, 0.5, 2.0, 1.48);
      let y = 2.15; col(GRY); font(6, 'bold'); doc.text('PREPARED BY:', X + 0.1, y); col(BLK);
      font(7, 'bold'); doc.text(doc.splitTextToSize(company.name || 'GORILLA SCREENING SOLUTIONS LLC', W-0.2).slice(0,2), X + 0.1, y + 0.15);
      const cl = [company.address || '[COMPANY ADDRESS]', 'tel: ' + (company.phone || '[PHONE]'), company.email || '[EMAIL]', 'LIC. # ' + (company.license || '[CONTRACTOR LICENSE]')];
      font(6.5); cl.forEach((l, i) => doc.text(l, X + 0.1, y + 0.28 + i * 0.11));
      y += 0.3 + cl.length * 0.11; lw(0.008); doc.line(X, y, X + W, y);
      y += 0.16; col(GRY); font(6, 'bold'); doc.text('PROJECT:', X + 0.1, y); col(BLK);
      y = wrap(projName, X + 0.1, y + 0.15, W - 0.2, 8, 1.25, 'bold') + 0.02;
      col(GRY); font(6, 'bold'); doc.text('ADDRESS:', X + 0.1, y + 0.06); col(BLK); font(7.5, 'bold'); doc.text(addr1 || '[ADDRESS]', X + 0.1, y + 0.2); doc.text(addr2, X + 0.1, y + 0.32);
      y += 0.44; col(GRY); font(6, 'bold'); doc.text('OWNER:', X + 0.1, y); col(BLK); font(7); doc.text(P.client.name || '[OWNER NAME]', X + 0.6, y);
      y += 0.1; doc.line(X, y, X + W, y);
      y += 0.15; col(GRY); font(6, 'bold'); doc.text('ENGINEER OF RECORD:', X + 0.1, y); col(BLK); font(7); doc.text(company.engineer || '[ENGINEER NAME] - FL PE # [ ]', X + 0.1, y + 0.13);
      y += 0.22; lw(0.008); doc.rect(X + 0.45, y, 1.6, 1.3); col(GRY); font(6, 'bold'); doc.text('ENGINEER SEAL', X + 1.25, y + 0.58, { align: 'center' }); doc.text('(NOT PROVIDED)', X + 1.25, y + 0.73, { align: 'center' }); col(BLK);
      y += 1.42; col(GRY); y = wrap('Designs are subject to modification as required by actual field measurements, standard industry practices, existing structural conditions and applicable building codes (FBC). Contractor shall field verify all dimensions and conditions prior to fabrication. These plans are the property of ' + (company.name || 'Gorilla Screening Solutions LLC') + ' and shall not be reproduced without written consent.', X + 0.1, y, W - 0.2, 5, 1.2); col(BLK);
      y += 0.05; doc.line(X, y, X + W, y);
      y += 0.14; font(6, 'bold'); doc.text('REVISIONS', X + 0.1, y); y += 0.06;
      for (let i = 0; i < 3; i++) { doc.rect(X + 0.1, y, 0.3, 0.17); doc.rect(X + 0.4, y, 0.6, 0.17); doc.rect(X + 1.0, y, W - 1.1, 0.17); y += 0.17; }
      y += 0.08;
      [['Scale:', 'AS SHOWN'], ['Job No.:', P.quote.number || '[JOB NO.]'], ['Drawn by:', P.salesperson || '[ ]'], ['Checked by:', '[ ]'], ['DATE:', ds]].forEach(r => { font(6.5, 'bold'); doc.text(r[0], X + 0.1, y + 0.12); font(6.5); doc.text(String(r[1]), X + 0.85, y + 0.12); doc.line(X + 0.1, y + 0.17, X + W - 0.1, y + 0.17); y += 0.2; });
      const sy = 9.55; lw(0.012); doc.line(X, sy, X + W, sy);
      font(7, 'bold'); col(GRY); doc.text('SHEET', X + 0.1, sy + 0.16); col(BLK);
      font(9, 'bold'); doc.text(sheetName, X + 0.1, sy + 0.38); font(22, 'bold'); doc.text(sheetNo, X + W - 0.12, sy + 0.86, { align: 'right' });
    }

    // ===================== G-0: project cover + site location + aerial reference
    // The app uses an uploaded, authorized aerial photograph only. Never manufactures a Google capture.
    frame('G-0', 'SITE & LOCATION');
    (function cover() {
      const x=0.8, right=13.82;
      const label=(name, xx, yy)=>{col(BLK);font(9,'bold');doc.text(name,xx,yy);};
      const box=(xx,yy,ww,hh)=>{col([188,193,199]);lw(.009);doc.rect(xx,yy,ww,hh);col(BLK);};
      const put=(im, xx, yy, ww, hh, fmt)=>{if(!im)return false;try{doc.addImage(im,fmt||'JPEG',xx,yy,ww,hh,undefined,'FAST');return true;}catch(e){return false;}};
      // Cover header
      doc.setFillColor(39,51,65);doc.rect(.78,.7,13.05,.54,'F');
      doc.setTextColor(255,255,255);font(15,'bold');doc.text('PROPOSED SCREEN ENCLOSURE  |  FIELD DESIGN',1.0,1.04);
      col(BLK);font(10,'bold');doc.text(P.address||'PROJECT ADDRESS TO BE CONFIRMED',1.0,1.51);
      font(7);col(GRY);doc.text('CLIENT: '+(P.client.name||'TO BE CONFIRMED'),1.0,1.74);
      const status=P.approvedDrawing?.revision?'2D DRAWING APPROVED - REV '+P.approvedDrawing.revision:'CONCEPTUAL / PENDING FIELD VERIFICATION';
      doc.text('DRAWING STATUS: '+status,6.4,1.74);
      // Project perspective and existing photo
      label('PROPOSED FINISHED VIEW  /  3D CONCEPT',.91,2.13);box(.9,2.25,7.58,4.25);
      if(!put(A.persp,.95,2.30,7.48,4.14,'JPEG')){col(GRY);font(10);doc.text('3D PREVIEW UNAVAILABLE',4.65,4.48,{align:'center'});}
      label('EXISTING CONDITION  /  FIELD PHOTO',8.68,2.13);box(8.65,2.25,5.18,4.25);
      const existing=(A.photos||[]).find(q=>q.label?.toLowerCase().includes('existing'))||A.photos?.[0];
      if(!put(existing?.url,8.70,2.30,5.08,4.14,'JPEG')){col(GRY);font(8);doc.text('ADD FRONT PHOTO IN PHOTOS TAB',11.2,4.48,{align:'center'});}
      // Aerial/Location, dedicated reference that does not misstate location
      label('AERIAL REFERENCE / SITE LOCATION',.91,6.87);box(.9,6.97,7.58,2.73);
      if(!put(A.aerial,1.0,7.08,7.36,2.46,'JPEG')){
        col(GRY);font(9,'bold');doc.text('NO AERIAL IMAGE ATTACHED',4.67,7.95,{align:'center'});
        font(7);doc.text('Add an authorized aerial photo in the Photos tab.',4.67,8.23,{align:'center'});
        doc.text('Aerial image will then appear on this sheet automatically.',4.67,8.43,{align:'center'});
        // north symbol / location concept (not an actual georeferenced plot)
        col(BLK);lw(.014);doc.line(1.5,8.9,1.5,8.2);doc.line(1.5,8.2,1.39,8.44);doc.line(1.5,8.2,1.61,8.44);font(8,'bold');doc.text('N',1.5,8.1,{align:'center'});
      }
      label('LOCATION / SHEET INDEX',8.68,6.87);box(8.65,6.97,5.18,2.73);
      font(8,'bold');doc.text('PROJECT LOCATION',8.87,7.29);font(8);col(BLK);
      doc.splitTextToSize(P.address||'Address pending',4.55).slice(0,2).forEach((t,i)=>doc.text(t,8.87,7.52+i*.18));
      const geo=P.geo;
      font(7);col(GRY);doc.text(geo?('COORD. (REFERENCE): '+geo.lat.toFixed(5)+', '+geo.lng.toFixed(5)):'COORDINATES: NOT VERIFIED',8.87,8.05);
      col(BLK);font(7,'bold');doc.text('SHEET INDEX',8.87,8.36);font(7);
      [['G-0','Site / Location'],['S-1','Elevations / Roof & Porch Plans'],['S-2','Construction Details'],['S-3','Photos / 3D References']].forEach((e,i)=>doc.text(e[0]+'  '+e[1],8.87,8.56+i*.20));
      col(GRY);font(6.5);doc.text('Concept presentation only. Verify field dimensions, loads and connections.',.9,10.16);
    })();
    doc.addPage([11, 17], 'landscape');

    // ===================== S-1: elevation, top screen plan, porch plan, sq ft, notes
    frame('S-1', 'SCREEN PLAN');
    (function elevation() {
      const [s, sl] = scaleFor(PW, 7.4), ox = 1.6, base = 4.45, X = f => ox + f * s, Y = f => base - f * s;
      col(BLK); lw(0.014); poly([[X(0), Y(0)], [X(0), Y(AWH)], [X(PW), Y(AWH)], [X(PW), Y(0)]]);
      L.items.forEach(o => poly(openPts(o, X, Y, s)));
      lw(0.02); doc.line(X(0) - 0.5, Y(0), X(PW) + 0.5, Y(0));
      col(GRY); lw(0.008); doc.line(X(0), Y(0), X(0) - 0.35, Y(0)); doc.line(X(PW), Y(0), X(PW) + 0.35, Y(0));
      // existing gutters to remain (both ends, at the wing eaves)
      col(BLK); lw(0.01);
      if (P.gutter.existingRemain > 0) { doc.rect(X(-0.45), Y(9.15), 0.45 * s, 0.45 * s); leader(X(-0.2), Y(9.0), X(0) + 0.15, 0.55, ['EXIST. GUTTER TO REMAIN'], BLK); }
      if (P.gutter.existingRemain > 1) { doc.rect(X(PW), Y(9.15), 0.45 * s, 0.45 * s); leader(X(PW + 0.2), Y(9.0), X(PW) + 0.55, 0.62, ['EXIST. GUTTER TO REMAIN'], BLK); }
      // NEW screens
      L.items.forEach(o => {
        const fr = FR * s;
        col(LRED); lw(0.003); meshOpen(o, X, Y, s, fr, 0.06);
        col(RED); lw(0.012); poly(openPts(o, X, Y, s)); poly(openPts(o, X, Y, s, fr));
        // User-drawn members from the approved photo-traced frame plan.
        (o.segments || []).forEach(m => {
          const t = Math.min(.96, Math.max(.04, Number(m.t) || .5));
          const ow = Math.max(1, Math.min(4, parseFloat(String(m.profile||'1x2').split('x')[0])||1));
          lw(Math.max(.006, ow/12*s));
          if(m.direction==='v') {
            const xx=o.x0+o.w*t, dx=xx-o.cx;
            const yy=o.type==='arch' ? (o.h-o.w/2+Math.sqrt(Math.max(0, o.w*o.w/4-dx*dx))) : o.h;
            doc.line(X(xx),Y(0),X(xx),Y(yy));
          } else {
            const yy=o.h*t;
            let a=o.x0,b=o.x1;
            if(o.type==='arch'&&yy>o.h-o.w/2){const dy=yy-(o.h-o.w/2),half=Math.sqrt(Math.max(0,o.w*o.w/4-dy*dy));a=o.cx-half;b=o.cx+half;}
            doc.line(X(a),Y(yy),X(b),Y(yy));
          }
        });
        if (o.door) { const dh = o.type === 'arch' ? o.h - o.w / 2 : Math.min(o.h, 6.67); lw(0.014); doc.line(X(o.x0), Y(dh), X(o.x1), Y(dh)); doc.line(X(o.x0) + fr * 2, Y(0), X(o.x0) + fr * 2, Y(dh)); doc.line(X(o.x1) - fr * 2, Y(0), X(o.x1) - fr * 2, Y(dh)); doc.line(X(o.x0), Y(dh / 2), X(o.x1), Y(dh / 2)); doc.circle(X(o.x1) - 0.12, Y(dh / 2 + 0.4), 0.02, 'F'); }
      });
      // NEW top screen (edge) + super gutter + downspout (hidden behind wall)
      col(RED);
      if (P.topScreen.on) { lw(0.025); doc.line(X(0), Y(AWH) - 0.015, X(PW), Y(AWH) - 0.015); }
      if (P.gutter.superOn) { const gl = Math.min(PW, P.gutter.superLen); lw(0.012); doc.rect(X(PW - gl), Y(9.5), gl * s, (9.5 - AWH) * s); }
      if (P.gutter.downspoutNew) { lw(0.01); doc.setLineDashPattern([0.05, 0.04], 0); doc.line(X(PW - 0.35), Y(AWH), X(PW - 0.35), Y(0.5)); doc.setLineDashPattern([], 0); }
      const lastO = L.items[L.items.length - 1], dO = L.items[L.doorIdx];
      if (P.topScreen.on) leader(X(PW / 2), Y(AWH) - 0.02, X(PW / 2) + 0.3, 0.62, ['NEW TOP SCREEN (SEE PLAN 4)'], RED);
      if (P.gutter.superOn) leader(X(PW - 1.5), Y(9.35), X(PW) + 0.55, 0.92, ['NEW ' + Math.round(P.gutter.superLen) + ' LF SUPER GUTTER ON FASCIA', 'COLOR: ' + FC + ' (MATCH FRAME)'], RED);
      if (P.gutter.downspoutNew) leader(X(PW - 0.35), Y(3), X(PW) + 0.55, Y(3.4), ['NEW DOWNSPOUT, SAME LOCATION', 'COLOR: ' + FC + ' (MATCH FRAME)'], RED);
      leader(X(lastO.cx) + 0.2, Y(lastO.h - 1.2), X(PW) + 0.55, Y(5.6), ['NEW 1"x2" ALUM. FRAME, ' + FC + ',', 'ONE PIECE AROUND EACH OPENING', 'NEW SCREEN MESH ' + (P.mesh || '[MESH TYPE]')], RED);
      if (dO.door) leader(X(dO.cx) - 0.1, Y(1.2), X(0) - 0.25, Y(1.2), ['NEW SCREEN DOOR', '(SEE DETAIL 5)'], RED);
      // dims
      const segs = [0]; L.items.forEach(o => { segs.push(o.x0, o.x1); }); segs.push(PW);
      for (let i = 0; i < segs.length - 1; i++) if (segs[i + 1] - segs[i] > 0.05) dimH(X(segs[i]), X(segs[i + 1]), Y(0) + 0.26, ftin(segs[i + 1] - segs[i]));
      dimH(X(0), X(PW), Y(0) + 0.52, ftin(PW) + ' (F.V.)');
      dimV(X(0) - 0.12, Y(0), Y(AWH), ftin(AWH));
      const o0 = L.items[0];
      font(6.5); col(BLK); doc.text(ftin(o0.h) + ' OPENING HT.', X(o0.x0) + 0.06, Y(o0.h) - 0.06);
      font(6.5); L.items.forEach((o, i) => doc.text('OPENING ' + (i + 1) + (o.door ? ' (DOOR)' : ''), X(o.cx), Y(AWH) + 0.18, { align: 'center' }));
      title(ox, 5.33, 1, 'FRONT ELEVATION', sl);
    })();
    (function topPlan() {
      if (!P.topScreen.on) return;
      const len = P.topScreen.length, dep = P.topScreen.depth, [s, sl] = scaleFor(len, 4.2), ox = 7.9, top = 6.5, X = f => ox + f * s, Z = f => top + f * s;
      col(BLK); lw(0.012);
      doc.rect(X(0), Z(-0.6), len * s, 0.6 * s); col(GRY); font(5.5); doc.text('EXIST. FASCIA / ROOF EDGE', X(len / 2), Z(-0.6) - 0.05, { align: 'center' }); col(BLK);
      doc.rect(X(0), Z(dep), len * s, 1.0 * s); font(5.5); doc.text('EXIST. ARCH WALL BELOW', X(len / 2), Z(dep) + 1.0 * s + 0.1, { align: 'center' });
      col(LRED); lw(0.003); meshRect(X(0), X(len), Z(0), Z(dep), 0.06);
      col(RED); lw(0.018); doc.rect(X(0), Z(0), len * s, dep * s);
      // Concept roof profiles are governed by the separately approved roof frame layout.
      const roof=P.roofDesign?.status==='approved-conceptual'?P.roofDesign:null;
      if(roof?.style==='mansard'&&roof.inset*2<Math.min(len,dep)) {
        const ins=roof.inset;doc.rect(X(ins),Z(ins),(len-2*ins)*s,(dep-2*ins)*s);
        [[0,0,ins,ins],[len,0,len-ins,ins],[0,dep,ins,dep-ins],[len,dep,len-ins,dep-ins]].forEach(a=>doc.line(X(a[0]),Z(a[1]),X(a[2]),Z(a[3])));
      } else if(roof?.style==='gable'){
        doc.line(X(0),Z(dep/2),X(len),Z(dep/2));
      }
      (roof?.bays||[]).forEach(t=>{const xx=len*Math.max(.04,Math.min(.96,t));doc.line(X(xx),Z(0),X(xx),Z(dep));});
      if (P.gutter.superOn) { lw(0.01); doc.setLineDashPattern([0.06, 0.04], 0); doc.line(X(len - Math.min(len, P.gutter.superLen)), Z(0) - 0.03, X(len), Z(0) - 0.03); doc.setLineDashPattern([], 0); }
      dimH(X(0), X(len), Z(dep) + 1.0 * s + 0.24, ftin(len) + ' (F.V.)');
      dimV(X(0) - 0.15, Z(0), Z(dep), ftin(dep));
      leader(X(len * 0.25), Z(dep / 2), X(len) + 0.2, Z(dep / 2) - 0.25, ['NEW ROOF SCREEN - ' + (roof?.style?.toUpperCase()||'FLAT'), 'PERIMETER FRAME, ' + FC, (roof?.bays?.length ? roof.bays.length + ' INTERIOR BEAMS (PRELIMINARY)' : 'NO INTERIOR BEAMS SHOWN'), 'SCREEN MESH ' + (P.mesh || '[MESH TYPE]'), Mo.areas(P).rows.at(-1).sqft.toFixed(1) + ' SQ FT'], RED);
      title(ox, Z(dep) + 1.0 * s + 0.72, 4, 'TOP SCREEN PLAN', sl);
    })();
    (function porchPlan() {
      const [s, sl] = scaleFor(PW, 5.0), D = H.porchDepth, ox = 1.6, oy = 5.95, X = f => ox + f * s, Zp = z => oy + (z + D + 1.5) * s, PZ = -(D + 1);
      col(BLK); lw(0.02); doc.rect(X(0), Zp(PZ - 0.6), PW * s, 0.6 * s);
      let last = 0; L.items.forEach(o => { doc.rect(X(last), Zp(-1), (o.x0 - last) * s, 1 * s); last = o.x1; }); doc.rect(X(last), Zp(-1), (PW - last) * s, 1 * s);
      col(GRY); lw(0.006); doc.line(X(0), Zp(-1), X(0), Zp(PZ)); doc.line(X(PW), Zp(-1), X(PW), Zp(PZ));
      col(BLK); font(6); doc.text('CONC. PORCH SLAB (EXIST.)', X(PW / 2), Zp((PZ - 1) / 2), { align: 'center' });
      const dO = L.items[L.doorIdx], hx = X(dO.cx - 1.5), hy = Zp(PZ); lw(0.01); doc.line(hx, hy, hx, hy + 3 * s); poly(Array.from({ length: 13 }, (_, i) => { const a = i / 12 * Math.PI / 2; return [hx + 3 * s * Math.cos(a), hy + 3 * s * Math.sin(a)]; }));
      font(5.5); doc.text('EXIST. DOOR', X(dO.cx), Zp(PZ) - 0.06, { align: 'center' });
      const wx0 = dO.cx + 3.4, wx1 = Math.min(PW - 0.8, wx0 + H.frontWindowW); if (wx1 - wx0 > 2) { doc.line(X(wx0), Zp(PZ) - 0.02, X(wx1), Zp(PZ) - 0.02); doc.line(X(wx0), Zp(PZ) + 0.02, X(wx1), Zp(PZ) + 0.02); doc.text('EXIST. WINDOW', X((wx0 + wx1) / 2), Zp(PZ) - 0.06, { align: 'center' }); }
      if (P.topScreen.on) { col(RED); lw(0.008); doc.setLineDashPattern([0.06, 0.04], 0); doc.rect(X(0), Zp(fasciaZ), PW * s, (-0.25 - fasciaZ) * s); doc.setLineDashPattern([], 0); font(5.5); doc.text('TOP SCREEN ABOVE', X(PW) - 0.05, Zp(fasciaZ) + 0.1, { align: 'right' }); }
      col(RED); lw(0.018); L.items.forEach(o => doc.line(X(o.x0), Zp(-0.4), X(o.x1), Zp(-0.4)));
      if (dO.door) { lw(0.008); const sx = X(dO.x0 + FR), sy = Zp(-0.4), sr = (dO.w - 2 * FR) * s; doc.line(sx, sy, sx, sy + sr); poly(Array.from({ length: 13 }, (_, i) => { const a = i / 12 * Math.PI / 2; return [sx + sr * Math.cos(a), sy + sr * Math.sin(a)]; })); }
      if (P.gutter.downspoutNew) { doc.setFillColor(...RED); doc.rect(X(PW - 0.5), Zp(fasciaZ - 0.6), 0.35 * s, 0.35 * s, 'F'); leader(X(PW - 0.32), Zp(fasciaZ - 0.45), X(PW) + 0.3, Zp(fasciaZ - 0.45), ['NEW DOWNSPOUT'], RED); }
      dimH(X(0), X(PW), Zp(0) + 0.28, ftin(PW));
      dimV(X(PW) + 0.2, Zp(PZ), Zp(-1), ftin(D) + ' PORCH');
      title(ox, Zp(0) + 0.75, 2, 'PORCH PLAN', sl);
    })();
    (function sqftTable() {
      const a = Mo.areas(P); let x = 10.75, y = 0.75, w = 3.1;
      col(BLK); font(8, 'bold'); doc.text('SCREEN AREA (SQ FT)', x, y); y += 0.1; lw(0.008);
      font(6.5, 'bold'); doc.rect(x, y, w, 0.2); doc.text('ITEM', x + 0.06, y + 0.14); doc.text('SIZE', x + 1.35, y + 0.14); doc.text('SQ FT', x + w - 0.06, y + 0.14, { align: 'right' }); y += 0.2;
      font(6.5); a.rows.forEach(r => { doc.rect(x, y, w, 0.19); doc.text(r.label.toUpperCase(), x + 0.06, y + 0.13); doc.text(r.dims.replace(/′/g, "'").replace(/″/g, '"'), x + 1.35, y + 0.13); doc.text(r.sqft.toFixed(1), x + w - 0.06, y + 0.13, { align: 'right' }); y += 0.19; });
      font(7, 'bold'); doc.rect(x, y, w, 0.22); doc.text('TOTAL', x + 0.06, y + 0.15); doc.text(a.total.toFixed(1) + ' SQ FT', x + w - 0.06, y + 0.15, { align: 'right' });
      font(5.5); col(GRY); doc.text('Arch area = W x (H - W/2) + PI x (W/2)^2 / 2', x, y + 0.36); col(BLK);
    })();
    (function notes() {
      let y = 2.55 + Mo.areas(P).rows.length * 0.19, x = 10.75, w = 3.1; col(BLK); font(8, 'bold'); doc.text('SCREEN NOTES', x, y); y += 0.12;
      col(RED); font(6, 'bold'); doc.text('DARK BRONZE = PROPOSED ALUMINUM / SCREEN. GRAY = EXISTING CONDITIONS.', x, y + 0.04); col(BLK); y += 0.18;
      const N = [
        'PROVIDE NEW 1"x2" ALUMINUM FRAME, ' + FC + ' FINISH, ONE CONTINUOUS PIECE AROUND EACH OPENING' + (nArch ? ', ROLLED TO THE ARCH RADIUS AT ARCHED OPENINGS.' : '.'),
        'SCREEN MESH: ' + (P.mesh || '[MESH TYPE]') + ', INSTALLED WITH SPLINE, TIGHT AND WRINKLE-FREE.',
        P.topScreen.on ? 'ROOF SCREEN: ' + (P.roofDesign?.status==='approved-conceptual'?P.roofDesign.style.toUpperCase():'FLAT') + ' ' + ftin(P.topScreen.length) + ' x ' + ftin(P.topScreen.depth) + ' AT APPROVED/PROPOSED ROOF GEOMETRY, WITH PERIMETER AND ANY APPROVED INTERIOR MEMBERS. FIELD VERIFY.' : '',
        P.gutter.superOn ? 'NEW ' + Math.round(P.gutter.superLen) + ' LF SUPER GUTTER ON EXIST. FASCIA (INSIDE THE ENCLOSURE), COLOR TO MATCH FRAME.' : '',
        P.gutter.existingRemain ? '(' + P.gutter.existingRemain + ') EXISTING REGULAR GUTTER(S) TO REMAIN.' : '',
        P.gutter.downspoutNew ? 'REPLACE DOWNSPOUT WITH NEW, SAME LOCATION AND POSITION, COLOR TO MATCH FRAME.' : '',
        L.items.some(o => o.door) ? 'SCREEN DOOR: PROVIDE (2) HINGES, PULL HANDLE AND CLOSER, FINISH TO MATCH FRAME.' : '',
        'FASTEN FRAMES TO EXISTING STUCCO / CMU AND FASCIA WITH [ANCHOR TYPE, SIZE AND SPACING] AS SPECIFIED BY ENGINEER OF RECORD. SEAL ALL PENETRATIONS.',
        'CONTRACTOR SHALL FIELD VERIFY ALL DIMENSIONS PRIOR TO FABRICATION. DO NOT DAMAGE EXISTING STUCCO, ROOF, LANDSCAPING OR CURBS.'
      ].filter(Boolean);
      N.forEach((n, i) => { y = wrap((i + 1) + '. ' + n, x, y, w, 5.6, 1.18) + 0.03; });
      if (L.warn.length) { col(RED); wrap('WARNING: ' + L.warn.join(' '), x, y + 0.05, w, 6, 1.2, 'bold'); col(BLK); }
    })();

    // ===================== S-2: details
    doc.addPage([11, 17], 'landscape'); frame('S-2', 'SCREEN DETAILS');
    const typ = L.items.find(o => !o.door) || L.items[0];
    (function typical() {
      const s = 0.5, o = typ, cxp = 2.6, base = 4.6, r = o.w / 2 * s, fr = FR * s, X = f => cxp + (f - o.cx) * s, Y = f => base - f * s;
      col(BLK); lw(0.012); doc.line(X(o.x0) - 0.6, base, X(o.x1) + 0.6, base);
      lw(0.006); poly(openPts(o, X, Y, s));
      col(LRED); lw(0.003); meshOpen(o, X, Y, s, fr, 0.05);
      col(RED); lw(0.016); poly(openPts(o, X, Y, s)); lw(0.012); poly(openPts(o, X, Y, s, fr));
      dimH(X(o.x0), X(o.x1), base + 0.25, ftin(o.w) + ' (F.V.)'); dimV(X(o.x0) - 0.35, base, Y(o.h), ftin(o.h) + ' (F.V.)');
      if (o.type === 'arch') { col(BLK); lw(0.006); const sp = (o.h - o.w / 2) * s; doc.line(cxp, base - sp, cxp + r * 0.7, base - sp - r * 0.7); font(6.5); doc.text('R = ' + ftin(o.w / 2), cxp + 0.05, base - sp - 0.06); }
      leader(X(o.x1) - fr / 2, Y(o.h * 0.55), X(o.x1) + 0.45, Y(o.h * 0.75), ['1"x2" ALUM. FRAME', FC + ', ONE PIECE'], RED);
      leader(cxp + 0.2, Y(1.6), X(o.x1) + 0.45, Y(1.9), ['SCREEN MESH', (P.mesh || '[MESH TYPE]'), 'W/ SPLINE'], RED);
      leader(X(o.x1) - 0.02, Y(3.4), X(o.x1) + 0.45, Y(3.6), ['ANCHOR TO STUCCO/CMU:', '[ANCHOR TYPE @ SPACING]', 'BY ENGINEER - F.V.'], RED);
      title(1.0, 5.35, 3, 'TYPICAL OPENING SCREEN', '1/2" = 1\'-0"');
    })();
    const dO = L.items.find(o => o.door);
    if (dO) (function doorDet() {
      const s = 0.5, o = dO, cxp = 6.6, base = 4.6, fr = FR * s, X = f => cxp + (f - o.cx) * s, Y = f => base - f * s, dh = o.type === 'arch' ? o.h - o.w / 2 : Math.min(o.h, 6.67);
      col(BLK); lw(0.012); doc.line(X(o.x0) - 0.5, base, X(o.x1) + 0.5, base);
      col(LRED); lw(0.003); meshOpen(o, X, Y, s, fr, 0.05);
      col(RED); lw(0.016); poly(openPts(o, X, Y, s)); lw(0.012); poly(openPts(o, X, Y, s, fr));
      lw(0.02); doc.line(X(o.x0), Y(dh), X(o.x1), Y(dh)); doc.line(X(o.x0) + fr * 2.2, base, X(o.x0) + fr * 2.2, Y(dh)); doc.line(X(o.x1) - fr * 2.2, base, X(o.x1) - fr * 2.2, Y(dh)); doc.line(X(o.x0), base - fr * 2.6, X(o.x1), base - fr * 2.6); doc.line(X(o.x0), Y(dh / 2), X(o.x1), Y(dh / 2));
      doc.setFillColor(...RED); doc.rect(X(o.x1) - 0.3, Y(dh / 2 + 0.7), 0.05, 0.25, 'F'); doc.rect(X(o.x0) + 0.06, Y(1.35), 0.04, 0.17, 'F'); doc.rect(X(o.x0) + 0.06, Y(dh - 0.6), 0.04, 0.17, 'F');
      dimV(X(o.x1) + 0.4, base, Y(dh), ftin(dh) + ' DOOR (F.V.)'); dimH(X(o.x0), X(o.x1), base + 0.25, ftin(o.w - 2 * FR) + ' CLEAR');
      leader(X(o.cx) + 0.1, Y(dh + 0.6), X(o.x1) + 0.6, Y(dh + 1.4), ['FIXED SCREEN ABOVE DOOR'], RED);
      leader(X(o.x1) - 0.27, Y(dh / 2 + 0.6), X(o.x1) + 0.6, Y(dh / 2 + 0.2), ['PULL HANDLE + CLOSER'], RED);
      leader(X(o.x0) + 0.08, Y(1.3), X(o.x1) + 0.6, Y(0.6), ['HINGES (2)'], RED);
      title(5.3, 5.35, 5, 'SCREEN DOOR', '1/2" = 1\'-0"');
    })();
    (function jamb() {
      const ox = 10.3, oy = 1.3, k = 1.5 / 12, wallT = 12, fW = 2, fD = 1, setback = 4;
      col(BLK); lw(0.012); doc.rect(ox, oy, 0.6, wallT * k); col(GRY); lw(0.003); for (let i = 0; i < 7; i++) doc.line(ox, oy + i * 0.21, ox + 0.6, Math.min(oy + wallT * k, oy + i * 0.21 + 0.25));
      col(BLK); font(6); doc.text('EXT.', ox + 0.3, oy - 0.08, { align: 'center' }); doc.text('PORCH', ox + 0.3, oy + wallT * k + 0.14, { align: 'center' });
      col(RED); lw(0.012); const fx = ox + 0.6, fy = oy + setback * k; doc.rect(fx, fy, fW * k, fD * k); doc.line(fx + fW * k, fy + fD * k / 2, fx + fW * k + 0.8, fy + fD * k / 2);
      leader(fx + fW * k / 2, fy + fD * k, fx + 0.95, fy + 0.55, ['1"x2" FRAME (2" FACE x 1")'], RED);
      leader(fx + fW * k + 0.5, fy + fD * k / 2, fx + 0.95, fy - 0.2, ['SCREEN MESH'], RED);
      leader(fx + 0.02, fy + 0.04, fx + 0.95, fy + 0.95, ['SEALANT + ANCHOR PER ENGINEER'], RED);
      dimV(ox - 0.15, oy, oy + wallT * k, '12" WALL (F.V.)');
      title(10.1, 3.35, 6, 'SECTION A - JAMB', '1-1/2" = 1\'-0"');
    })();
    if (P.topScreen.on) (function sectionB() {
      const s = 1.0, ox = 1.2, base = 8.9, zmin = fasciaZ - 1.2, X = z => ox + (-z) * s, Y = y => base - (y - 7.6) * s;
      col(BLK); lw(0.014);
      poly([[X(0), Y(7.6)], [X(0), Y(AWH)], [X(-1), Y(AWH)], [X(-1), Y(7.6)]]); col(GRY); lw(0.004); for (let i = 0; i < 8; i++) doc.line(X(0), Y(7.6) - i * 0.2, X(-1), Y(7.6) - i * 0.2 - 0.3 < Y(AWH) ? Y(AWH) : Y(7.6) - i * 0.2 - 0.3);
      col(BLK); font(6); doc.text('EXIST. ARCH WALL', X(-0.5), Y(7.6) + 0.14, { align: 'center' });
      lw(0.014); doc.rect(X(fasciaZ), Y(9.45), 0.2 * s, 0.75 * s); // fascia
      doc.line(X(fasciaZ - 0.2), Y(8.95), X(zmin - 0.6), Y(8.95)); doc.line(X(fasciaZ - 0.2), Y(9.45), X(zmin - 0.6), Y(9.45 + 0.36 * 0.8));
      font(6); doc.text('EXIST. SOFFIT / PORCH CEILING', X(zmin - 0.6), Y(8.95) + 0.13, { align: 'right' }); doc.text('EXIST. ROOF', X(zmin - 0.6), Y(9.75) - 0.05, { align: 'right' });
      leader(X(fasciaZ - 0.1), Y(8.8), X(fasciaZ - 0.7), Y(8.35), ['EXIST. FASCIA'], BLK);
      col(RED); lw(0.016);
      if (P.gutter.superOn) { const g0 = fasciaZ, g1 = fasciaZ + 0.6; poly([[X(g0), Y(9.5)], [X(g0), Y(8.85)], [X(g1 - 0.15), Y(8.85)], [X(g1), Y(9.1)], [X(g1), Y(9.5)]]); leader(X(g1 - 0.2), Y(9.0), X(g1) + 0.0, Y(8.2), ['NEW SUPER GUTTER, ' + FC, 'ON EXIST. FASCIA'], RED); }
      const za = fasciaZ + (P.gutter.superOn ? 0.68 : 0.35), zb = -0.25;
      lw(0.02); doc.line(X(zb), Y(AWH + 0.08), X(za), Y(AWH + 0.08));
      lw(0.012); doc.rect(X(zb), Y(AWH + 0.083), FR * s, (1 / 12) * s); doc.rect(X(za) - FR * s, Y(AWH + 0.083), FR * s, (1 / 12) * s);
      leader(X((za + zb) / 2), Y(AWH + 0.08), X((za + zb) / 2) + 0.4, Y(10.25), ['NEW TOP SCREEN (ONE PANEL): 1"x2" PERIMETER', 'FRAME + MESH, FASTEN PER ENGINEER'], RED);
      dimH(X(zb), X(za), Y(7.6) + 0.35, ftin(Math.round(Math.abs(za - zb) * 24) / 24) + ' CLEAR (F.V.)');
      title(1.0, 9.55, 7, 'SECTION B - TOP SCREEN & GUTTER', '1" = 1\'-0"');
    })();
    if (A.persp) { doc.addImage(A.persp, 'JPEG', 8.2, 5.9, 5.6, 3.45); col(BLK); lw(0.008); doc.rect(8.2, 5.9, 5.6, 3.45); }
    title(8.2, 9.75, 8, '3D PERSPECTIVE', 'NTS');

    // ===================== S-3: photos & 3D
    doc.addPage([11, 17], 'landscape'); frame('S-3', 'PHOTOS & 3D VIEWS');
    const cell = (img, x, y, w, h, n, name) => { if (img) { try { doc.addImage(img, 'JPEG', x, y, w, h); } catch (e) { } } col(BLK); lw(0.008); doc.rect(x, y, w, h); title(x, y + h + 0.3, n, name, 'NTS'); };
    const ph = (A.photos || []).slice(0, 2);
    cell(ph[0] && ph[0].url, 0.8, 0.8, 6.3, 3.6, 1, ph[0] ? ph[0].label.toUpperCase() : 'EXISTING CONDITION (PHOTO)');
    cell(ph[1] ? ph[1].url : A.before3d, 7.4, 0.8, 6.3, 3.6, 2, ph[1] ? ph[1].label.toUpperCase() : '3D - EXISTING');
    cell(A.front, 0.8, 5.6, 4.1, 2.6, 3, '3D - FRONT (NEW)');
    cell(A.porch, 5.1, 5.6, 4.1, 2.6, 4, '3D - PORCH');
    cell(A.top, 9.4, 5.6, 4.3, 2.6, 5, '3D - TOP SCREEN');
    col(GRY); font(6); doc.text('3D views generated from the project model and field measurements. For reference only - field verify all dimensions.', 0.8, 9.3);
    return doc.output('blob');
  };
})();
