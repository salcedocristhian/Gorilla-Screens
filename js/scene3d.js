/* Visor 3D paramétrico. 1 unidad = 1 pie. x → derecha, y ↑, z → hacia la calle.
   El porche va de x=0 a x=porchW; ala izquierda a la izquierda, garage a la derecha. */
(function () {
  const T = window.THREE;
  const M_ = window.GSSModel;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function canvasTex(w, h, draw, rx, ry) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 8; return t;
  }
  function noiseFill(g, w, h, base, n, spread, size) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { const v = rnd(-spread, spread); g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`; const s = rnd(size * 0.3, size); g.fillRect(rnd(0, w), rnd(0, h), s, s); }
  }
  function stuccoDraw(base) {
    return (g, w, h) => {
      noiseFill(g, w, h, base, 9000, 0.07, 3);
      for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${rnd(0.04, 0.1)})`; g.lineWidth = rnd(1, 3); g.beginPath(); const x = rnd(0, w), y = rnd(0, h); g.moveTo(x, y); g.quadraticCurveTo(x + rnd(-30, 30), y + rnd(-20, 20), x + rnd(-40, 40), y + rnd(-25, 25)); g.stroke(); }
    };
  }

  class Viewer {
    constructor(host) {
      this.host = host;
      this.MOBILE = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 700;
      const r = this.renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.MOBILE ? 1.75 : 2));
      r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
      r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
      r.domElement.style.touchAction = 'none';
      r.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; host.dispatchEvent(new CustomEvent('viewer-lost', { bubbles: true })); });
      host.appendChild(r.domElement);
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(40, 1, 0.1, 600);
      this.controls = new T.OrbitControls(this.camera, r.domElement);
      Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, maxPolarAngle: Math.PI * 0.49, minDistance: 3, maxDistance: 140 });
      this._textures(); this._env();
      this.after = true; this.showLand = true; this.showPalms = false;
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 300));
      this.resize();
      const loop = () => { if (this.dead) return; this._tick(); requestAnimationFrame(loop); };
      loop();
    }
    mount(host) { if (host === this.host) return; this.ro.unobserve(this.host); this.host = host; host.appendChild(this.renderer.domElement); this.ro.observe(host); this.resize(); }
    _textures() {
      const X = this.tex = {};
      X.stucco = canvasTex(512, 512, stuccoDraw('#d8c1a4'));
      X.stuccoShade = canvasTex(512, 512, stuccoDraw('#cfb79a'));
      X.grass = canvasTex(512, 512, (g, w, h) => { noiseFill(g, w, h, '#4f7d2c', 14000, 0.12, 3); for (let i = 0; i < 4000; i++) { g.strokeStyle = `rgba(${rnd(60, 120) | 0},${rnd(130, 175) | 0},${rnd(40, 70) | 0},0.5)`; g.beginPath(); const x = rnd(0, w), y = rnd(0, h); g.moveTo(x, y); g.lineTo(x + rnd(-2, 2), y - rnd(3, 7)); g.stroke(); } });
      X.concrete = canvasTex(512, 512, (g, w, h) => noiseFill(g, w, h, '#cfccc5', 9000, 0.06, 4));
      X.slab = canvasTex(512, 512, (g, w, h) => { noiseFill(g, w, h, '#b9b7b1', 8000, 0.08, 5); for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(80,80,80,${rnd(0.04, 0.1)})`; g.beginPath(); g.ellipse(rnd(0, w), rnd(0, h), rnd(20, 90), rnd(10, 40), rnd(0, 3), 0, 7); g.fill(); } });
      X.shingle = canvasTex(512, 512, (g, w, h) => { noiseFill(g, w, h, '#6a5444', 6000, 0.08, 4); for (let y = 0; y < h; y += 16) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, y, w, 2); for (let x = (y / 16 % 2) * 12; x < w; x += 24) g.fillRect(x, y, 1.5, 16); } });
      X.mulch = canvasTex(256, 256, (g, w, h) => noiseFill(g, w, h, '#3b2c22', 5000, 0.15, 4), 4, 4);
      X.garage = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#f2f2ef'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 20) { g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(0, y + 2, w, 1); } });
      X.blinds = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#6c7473'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y, w, 2); } });
      X.rug = canvasTex(512, 300, (g, w, h) => { g.fillStyle = '#2b2b2d'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6b6b70'; g.lineWidth = 6; for (let y = 0; y < h + 40; y += 34) for (let x = -40; x < w + 40; x += 40) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y - 16); g.lineTo(x + 40, y); g.stroke(); } g.fillStyle = '#2b2b2d'; g.fillRect(70, 112, 372, 76); g.fillStyle = '#9a9aa0'; g.font = 'bold 64px Helvetica, Arial'; g.textAlign = 'center'; g.fillText('WELCOME', w / 2, 174); });
    }
    _env() {
      const s = this.scene;
      s.background = canvasTex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fbbd6'); gr.addColorStop(0.65, '#dce6ee'); gr.addColorStop(1, '#eef2f4'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      s.fog = new T.Fog('#e3eaef', 100, 280);
      s.add(new T.HemisphereLight('#e6eef5', '#7d8a5c', 0.75));
      const sun = this.sun = new T.DirectionalLight('#fff4e2', 1.25);
      sun.position.set(-35, 60, 45); sun.castShadow = true;
      const ms = this.MOBILE ? 2048 : 4096; sun.shadow.mapSize.set(ms, ms); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
      Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 220 });
      s.add(sun); s.add(sun.target);
    }

    // ------------------------------------------------------------------ build
    build(P) {
      P = M_.normalize(P);
      if (this.root) { this.scene.remove(this.root); this.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material._own) o.material.dispose(); }); }
      const root = this.root = new T.Group(); this.scene.add(root);
      const land = this.land = new T.Group(), palms = this.palmsG = new T.Group(), screens = this.screens = new T.Group(), newWork = this.newWork = new T.Group(), existing = this.existing = new T.Group();
      [land, palms, screens, newWork, existing].forEach(g => root.add(g));
      const X = this.tex;
      let target = root;
      const mat = o => { const m = new T.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, o)); m._own = true; return m; };
      const texMat = (tex, w, h, extra) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(w / 8, h / 8); return mat(Object.assign({ map: t }, extra || {})); };
      const fc = (M_.FRAME_COLORS[P.frameColor] || M_.FRAME_COLORS.bronze).hex;
      const M = {
        trim: mat({ color: '#f6f6f3', roughness: 0.5 }),
        glass: new T.MeshStandardMaterial({ color: '#1f2a2b', roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.55 }),
        blinds: mat({ map: X.blinds, roughness: 0.8 }),
        frame: mat({ color: fc, roughness: 0.45, metalness: 0.55 }),
        bronze: mat({ color: '#4f3d2c', roughness: 0.45, metalness: 0.55 }),
        black: mat({ color: '#1b1b1c', roughness: 0.5 }),
        brass: mat({ color: '#a8915c', roughness: 0.35, metalness: 0.8 }),
        frosted: mat({ color: '#f2efe6', roughness: 0.3, emissive: '#3a3528' }),
        block: mat({ color: '#d6cfc2', roughness: 0.95 }), blockDark: mat({ color: '#8a7a6a', roughness: 0.95 }),
        leaf: mat({ color: '#2f5a1f', roughness: 0.7 }), leafV: mat({ color: '#4f7a2a', roughness: 0.7 }), leafEdge: mat({ color: '#c7b443', roughness: 0.7 }),
        hole: mat({ color: '#2a221c', roughness: 1 }), asphalt: mat({ color: '#3f4144', roughness: 1 }),
        mesh: new T.MeshStandardMaterial({ color: '#0e0d0c', roughness: 1, transparent: true, opacity: 0.8, side: T.DoubleSide, depthWrite: false }),
        meshTop: new T.MeshStandardMaterial({ color: '#0e0d0c', roughness: 1, transparent: true, opacity: 0.62, side: T.DoubleSide, depthWrite: false })
      };
      M.glass._own = M.mesh._own = M.meshTop._own = true;
      const add = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; target.add(m); return m; };
      const box = (x0, x1, y0, y1, z0, z1, material, cast = true) => { const m = new T.Mesh(new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), material); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return add(m, cast); };
      const stuccoBox = (x0, x1, y0, y1, z0, z1, shade) => box(x0, x1, y0, y1, z0, z1, texMat(shade ? X.stuccoShade : X.stucco, Math.max(x1 - x0, z1 - z0), y1 - y0));
      const flat = (pts, y, material) => { const s = new T.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], -p[1]) : s.moveTo(p[0], -p[1])); const g = new T.ShapeGeometry(s); const uv = g.attributes.uv, pos = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 8, pos.getY(i) / 8); const m = new T.Mesh(g, material); m.rotation.x = -Math.PI / 2; m.position.y = y; return add(m, false, true); };

      const H = P.house, LW = H.leftWingW, PW = H.porchW, GW = H.garageW, D = H.porchDepth, AWH = H.archWallH;
      const PZ = -(D + 1), BACK = PZ - 27;
      const fasciaZ = P.topScreen.on ? Math.min(-1.5, Math.max(PZ + 0.5, -(P.topScreen.depth + 0.93))) : Math.max(PZ + 0.5, -3);
      const L = M_.layout(P);
      this.dims = { LW, PW, GW, D, PZ, fasciaZ, cx: (-LW + PW + GW) / 2 };

      // ---------- ground
      const gt = X.grass.clone(); gt.needsUpdate = true; gt.repeat.set(40, 40);
      const lawn = new T.Mesh(new T.PlaneGeometry(300, 300), mat({ map: gt })); lawn.rotation.x = -Math.PI / 2; lawn.position.x = this.dims.cx; add(lawn, false);
      flat([[-150, 40], [150, 40], [150, 80], [-150, 80]], 0.02, M.asphalt);
      flat([[-150, 30], [150, 30], [150, 34], [-150, 34]], 0.05, texMat(X.concrete, 8, 8));
      flat([[PW + 0.5, 0], [PW + GW, 0], [PW + GW, 40], [PW + 0.5, 40]], 0.05, texMat(X.concrete, 8, 8));
      const door = L.items[L.doorIdx], dx = door.cx;
      flat([[dx - 1.9, 0], [dx + 1.9, 0], [dx + 1.9, 3.5], [PW + 0.5, 3.5], [PW + 0.5, 7], [dx - 1.9, 7]], 0.06, texMat(X.concrete, 8, 8));

      // ---------- roofs helpers
      const gable = (x0, x1, z, h, peak, depth) => { const s = new T.Shape(); s.moveTo(x0, h); s.lineTo(x1, h); s.lineTo((x0 + x1) / 2, peak); s.lineTo(x0, h); const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false }); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 8, uv.getY(i) / 8); const t = X.stucco.clone(); t.needsUpdate = true; const m = new T.Mesh(g, mat({ map: t })); m.position.z = z - depth; return add(m); };
      const gableRoof = (x0, x1, zFront, zBack, h, peak, overL, overR, overZ) => {
        const cx = (x0 + x1) / 2, half = (x1 - x0) / 2, slope = (peak - h) / half, d = zFront - zBack + overZ * 2, zc = (zFront + zBack) / 2;
        [[-1, overL], [1, overR]].forEach(([side, over]) => {
          const run = half + over, rise = slope * run, Ls = Math.hypot(run, rise), ang = Math.atan2(rise, run);
          const r = new T.Mesh(new T.BoxGeometry(Ls, 0.35, d), texMat(X.shingle, Ls, d)); r.position.set(cx + side * run / 2, peak + 0.2 - rise / 2, zc); r.rotation.z = -side * ang; add(r);
          const f = new T.Mesh(new T.BoxGeometry(Ls, 0.55, 0.18), M.trim); f.position.set(cx + side * run / 2, peak - 0.05 - rise / 2, zFront + overZ + 0.02); f.rotation.z = -side * ang; add(f);
        });
      };
      const windowFront = (x0, x1, y0, y1, z) => {
        const t = 0.2;
        box(x0 - t, x1 + t, y1, y1 + t, z, z + 0.14, M.trim); box(x0 - t, x1 + t, y0 - t, y0, z, z + 0.14, M.trim);
        box(x0 - t, x0, y0, y1, z, z + 0.14, M.trim); box(x1, x1 + t, y0, y1, z, z + 0.14, M.trim);
        box(x0, x1, y0, y1, z + 0.003, z + 0.012, M.blinds, false); box(x0, x1, y0, y1, z + 0.02, z + 0.04, M.glass, false);
        box((x0 + x1) / 2 - 0.07, (x0 + x1) / 2 + 0.07, y0, y1, z + 0.04, z + 0.12, M.trim);
        box(x0 - 0.4, x1 + 0.4, y0 - 0.42, y0 - 0.2, z, z + 0.35, M.trim);
      };
      const wingDepth = Math.max(12, D + 4);

      // ---------- left wing
      const lwPeak = 9 + LW / 2 * 0.61;
      stuccoBox(-LW, 0, 0, 9, -wingDepth, 0);
      gable(-LW, 0, 0, 9, lwPeak, 0.6);
      gableRoof(-LW, 0, 0, -wingDepth, 9, lwPeak, 1.4, 0, 1.4);
      box(-LW / 2 - 0.8, -LW / 2 + 0.8, lwPeak - 3.3, lwPeak - 2.1, 0, 0.12, M.trim);
      const nw = Math.max(0, H.leftWindows | 0), sp = LW / Math.max(1, nw);
      for (let i = 0; i < nw; i++) { const c = -LW + sp * (i + 0.5); windowFront(c - 1.5, c + 1.5, 3.7, 7.0, 0); }

      // ---------- garage wing
      const gwPeak = 9 + GW / 2 * 0.69;
      stuccoBox(PW, PW + GW, 0, 9, -wingDepth, 0);
      gable(PW, PW + GW, 0, 9, gwPeak, 0.6);
      gableRoof(PW, PW + GW, 0, -wingDepth, 9, gwPeak, 0, 1.4, 1.4);
      const gdW = Math.min(H.garageDoorW, GW - 2), gd0 = PW + (GW - gdW) / 2 + 0.4;
      const gtex = X.garage.clone(); gtex.needsUpdate = true;
      box(gd0 - 0.2, gd0 + gdW + 0.2, 0, 7.2, 0, 0.1, M.trim); box(gd0, gd0 + gdW, 0, 7.0, 0.06, 0.14, mat({ map: gtex, roughness: 0.6 }));
      if (H.evCharger) { box(PW + 0.5, PW + 0.95, 3.9, 4.7, 0, 0.25, M.black); const c1 = new T.Mesh(new T.TorusGeometry(0.5, 0.05, 8, 40), M.black); c1.position.set(PW + 0.72, 3.1, 0.25); add(c1); }
      (() => { const t = canvasTex(256, 96, (g, w, h) => { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2c'; g.font = 'bold 60px Helvetica, Arial'; g.textAlign = 'center'; const n = (P.address.match(/^\s*(\d+)/) || [])[1] || ''; g.fillText(n, w / 2, 68); }); const m = new T.Mesh(new T.PlaneGeometry(1.6, 0.6), mat({ map: t })); m.position.set(PW + GW - 3.5, 8.0, 0.06); add(m, false); })();

      // ---------- main body + hip roof
      stuccoBox(-LW + 0.1, PW + GW - 0.1, 0, 9, BACK, PZ, true);
      (() => {
        const x0 = -LW - 1.4, x1 = PW + GW + 1.4, zf = fasciaZ, zb = BACK - 1.4, y0 = 9.1, pitch = 0.36;
        const half = (zf - zb) / 2, zm = (zf + zb) / 2, yr = y0 + half * pitch;
        const A = [x0, y0, zf], B = [x1, y0, zf], C = [x1, y0, zb], Dd = [x0, y0, zb], R1 = [x0 + half, yr, zm], R2 = [x1 - half, yr, zm];
        const tris = [A, B, R2, A, R2, R1, C, Dd, R1, C, R1, R2, Dd, A, R1, B, C, R2], pos = [], uv = [];
        tris.forEach(p => { pos.push(p[0], p[1], p[2]); uv.push(p[0] / 8, (p[2] + p[1]) / 8); });
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
        const t = X.shingle.clone(); t.needsUpdate = true; add(new T.Mesh(g, mat({ map: t, side: T.DoubleSide })));
      })();
      stuccoBox(PW / 2 - 10, PW / 2 + 10, 0, 9.2, BACK - 12, BACK + 0.1, true);
      box(PW / 2 - 10.6, PW / 2 + 10.6, 9.2, 9.5, BACK - 12.6, BACK + 0.1, mat({ color: '#8f9396' }));

      // ---------- porch: ceiling, fascia, gutters
      box(0, PW, 8.85, 9.05, PZ, fasciaZ, texMat(X.stucco, PW, 4));
      box(0, PW, 8.7, 9.45, fasciaZ - 0.2, fasciaZ, M.trim); // fascia
      box(1.5, Math.min(5.5, PW - 1), 8.8, 8.86, PZ + 1, PZ + 1.7, M.hole, false); // missing soffit panel (existing condition)
      // existing gutters to remain: along the wing eaves at each end of the porch
      target = existing;
      [[-0.45, 0], [PW, PW + 0.45]].slice(0, Math.max(0, Math.min(2, P.gutter.existingRemain))).forEach(([a, b]) => { box(a, b, 8.7, 9.15, fasciaZ, 1.4, M.trim); });
      // existing porch gutter + white downspout (before only)
      this.beforeOnly = new T.Group(); root.add(this.beforeOnly); target = this.beforeOnly;
      box(0, PW, 8.95, 9.4, fasciaZ, fasciaZ + 0.35, M.trim);
      const dsX0 = PW - 0.5, dsX1 = PW - 0.15, dsZ0 = fasciaZ - 0.6, dsZ1 = fasciaZ - 0.25;
      box(dsX0, dsX1, 0.5, 8.8, dsZ0, dsZ1, M.trim);
      // NEW: super gutter on the fascia + new downspout in frame color, same place
      target = newWork;
      if (P.gutter.superOn) {
        const gl = Math.min(PW, P.gutter.superLen || PW), g0 = PW - gl;
        box(g0, PW, 8.85, 9.5, fasciaZ, fasciaZ + 0.6, M.frame);
        box(g0, PW, 9.42, 9.5, fasciaZ + 0.55, fasciaZ + 0.68, M.frame);
        box(g0 - 0.04, g0, 8.85, 9.5, fasciaZ, fasciaZ + 0.68, M.frame); box(PW - 0.04, PW, 8.85, 9.5, fasciaZ, fasciaZ + 0.68, M.frame);
      } else box(0, PW, 8.95, 9.4, fasciaZ, fasciaZ + 0.35, M.trim);
      box(dsX0, dsX1, 0.5, 8.85, dsZ0, dsZ1, P.gutter.downspoutNew ? M.frame : M.trim);
      box(dsX0 + 0.05, dsX1 - 0.05, 8.6, 9.0, dsZ1, fasciaZ + 0.3, P.gutter.downspoutNew ? M.frame : M.trim);
      target = root;
      const ext = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 1.8, 14), M.black); ext.rotation.z = Math.PI / 2; ext.position.set(PW - 1.2, 0.4, (dsZ0 + dsZ1) / 2); add(ext);

      // ---------- house front behind the porch: door, lantern, window, rug
      stuccoBox(0, PW, 0, 9, PZ - 0.5, PZ, true);
      box(dx - 1.75, dx + 1.75, 0, 7.0, PZ, PZ + 0.1, M.trim);
      box(dx - 1.5, dx + 1.5, 0.05, 6.67, PZ + 0.05, PZ + 0.18, mat({ color: '#f5f5f2', roughness: 0.5 }));
      const pm = mat({ color: '#e7e5df' });
      [[0.3, 5.3, 0.95, 1.0], [1.55, 5.3, 0.95, 1.0], [0.3, 2.65, 0.95, 2.3], [1.55, 2.65, 0.95, 2.3], [0.3, 0.3, 0.95, 2.0], [1.55, 0.3, 0.95, 2.0]].forEach(p => {
        const x0 = dx - 1.5 + p[0], y0 = p[1];
        [[x0, x0 + p[2], y0, y0 + 0.06], [x0, x0 + p[2], y0 + p[3] - 0.06, y0 + p[3]], [x0, x0 + 0.06, y0, y0 + p[3]], [x0 + p[2] - 0.06, x0 + p[2], y0, y0 + p[3]]].forEach(b => box(b[0], b[1], b[2], b[3], PZ + 0.18, PZ + 0.21, pm, false));
      });
      box(dx + 1.05, dx + 1.3, 3.55, 4.05, PZ + 0.18, PZ + 0.26, M.brass); box(dx + 1.08, dx + 1.27, 3.2, 3.3, PZ + 0.18, PZ + 0.34, M.brass);
      const LX = dx + 2.4;
      box(LX - 0.08, LX + 0.08, 5.55, 6.4, PZ, PZ + 0.1, M.bronze); box(LX - 0.06, LX + 0.06, 6.15, 6.25, PZ + 0.1, PZ + 0.4, M.bronze);
      const cap = new T.Mesh(new T.ConeGeometry(0.34, 0.3, 4), M.bronze); cap.rotation.y = Math.PI / 4; cap.position.set(LX, 6.25, PZ + 0.5); add(cap);
      const lan = new T.Mesh(new T.CylinderGeometry(0.26, 0.18, 0.62, 4, 1), M.frosted); lan.rotation.y = Math.PI / 4; lan.position.set(LX, 5.8, PZ + 0.5); add(lan);
      box(LX - 0.15, LX + 0.15, 4.25, 4.7, PZ, PZ + 0.04, M.trim); box(LX - 0.11, LX + 0.11, 3.55, 3.95, PZ, PZ + 0.06, M.black);
      const wx0 = dx + 3.4, wx1 = Math.min(PW - 0.8, wx0 + H.frontWindowW);
      if (wx1 - wx0 > 2) {
        const y0 = 2.4, y1 = 6.67, ft = 0.25, ww = wx1 - wx0;
        box(wx0 - ft, wx1 + ft, y1, y1 + ft, PZ, PZ + 0.16, M.trim); box(wx0 - ft, wx1 + ft, y0 - ft, y0, PZ, PZ + 0.16, M.trim);
        box(wx0 - ft, wx0, y0, y1, PZ, PZ + 0.16, M.trim); box(wx1, wx1 + ft, y0, y1, PZ, PZ + 0.16, M.trim);
        const panes = [[0, 0.36], [0.38, 0.82], [0.84, 1]].map(p => [wx0 + p[0] * ww, wx0 + p[1] * ww]);
        panes.forEach((p, i) => { box(p[0], p[1], y0, y1, PZ + 0.003, PZ + 0.012, M.blinds, false); box(p[0], p[1], y0, y1, PZ + 0.03, PZ + 0.05, M.glass, false); if (i < 2) box(p[1], p[1] + ww * 0.02, y0, y1, PZ, PZ + 0.16, M.trim); });
        box(wx0 - 0.45, wx1 + 0.45, y0 - 0.55, y0 - 0.25, PZ, PZ + 0.45, M.trim);
      }
      const rug = new T.Mesh(new T.PlaneGeometry(2.6, 1.55), mat({ map: X.rug, roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.rotation.z = 0.12; rug.position.set(dx + 0.2, 0.235, PZ + 1.15); add(rug, false);
      box(0, PW, -0.05, 0.22, PZ, 0.25, texMat(X.slab, PW, D), false);

      // ---------- arch / opening wall
      (() => {
        const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(0, AWH); s.lineTo(PW, AWH); s.lineTo(PW, 0);
        [...L.items].reverse().forEach(o => {
          const r = o.w / 2, h = Math.min(o.h, AWH - 0.4);
          s.lineTo(o.x1, 0);
          if (o.type === 'arch') { s.lineTo(o.x1, h - r); s.absarc(o.cx, h - r, r, 0, Math.PI, false); }
          else { s.lineTo(o.x1, h); s.lineTo(o.x0, h); }
          s.lineTo(o.x0, 0);
        });
        s.lineTo(0, 0);
        const g = new T.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 48 });
        const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 8, uv.getY(i) / 8);
        const t = X.stucco.clone(); t.needsUpdate = true; const m = new T.Mesh(g, mat({ map: t })); m.position.z = -1; add(m);
      })();

      // ---------- planters + landscaping
      target = root;
      const p0 = door.x1 + 0.4;
      if (PW - p0 > 1.5) {
        box(p0, PW, 0, 0.28, 0, 2.7, mat({ map: X.mulch }), false);
        for (let x = p0; x < PW - 0.1; x += 1.05) box(x, Math.min(PW, x + 0.98), 0, 0.5, 2.7, 3.3, M.block);
        for (let z = 0.2; z < 2.7; z += 1.05) box(p0 - 0.6, p0, 0, 0.5, z, z + 0.98, M.block);
      }
      box(-LW, -0.6, 0, 0.28, 0, 3.0, mat({ map: X.mulch }), false);
      for (let x = -LW; x < -0.8; x += 1.05) box(x, x + 0.98, 0, 0.42, 3.0, 3.6, M.blockDark);
      target = land;
      const blade = new T.ConeGeometry(0.16, 1, 5); blade.translate(0, 0.5, 0);
      const snake = (x, z, hb) => { const n = 4 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) { const h = hb * rnd(0.7, 1.1); const b = new T.Mesh(blade, Math.random() > 0.45 ? M.leaf : M.leafV); b.scale.set(1, h, 0.32); b.position.set(x + rnd(-0.18, 0.18), 0.25, z + rnd(-0.15, 0.15)); b.rotation.set(rnd(-0.18, 0.18), rnd(0, 3), rnd(-0.18, 0.18)); add(b, true, false); const e = new T.Mesh(blade, M.leafEdge); e.scale.set(1.08, h * 0.96, 0.22); e.position.copy(b.position); e.rotation.copy(b.rotation); add(e, false, false); } };
      if (PW - p0 > 1.5) for (let x = p0 + 0.5; x < PW - 0.3; x += 0.78) snake(x, 1.35, 2.5);
      for (let x = -LW + 0.6; x < -1; x += 0.72) snake(x, 1.5, 1.9);
      const tree = (x, z, s) => { box(x - 0.4 * s, x + 0.4 * s, 0, 8 * s, z - 0.4 * s, z + 0.4 * s, mat({ color: '#5b4636' })); [[0, 10, 0, 5], [2.5, 9, 1, 3.6], [-2.5, 9.5, -1, 3.8], [0, 12.5, -1, 3.6]].forEach(c => { const m = new T.Mesh(new T.IcosahedronGeometry(c[3] * s, 1), mat({ color: '#3f5f33', flatShading: true })); m.position.set(x + c[0] * s, c[1] * s, z + c[2] * s); add(m); }); };
      tree(-LW - 10, -16, 1.1); tree(PW + GW + 10, -34, 1.0);
      target = palms;
      const palm = (x, z, h, lean) => { const g = new T.Group(); g.position.set(x, 0, z); g.rotation.z = lean || 0; palms.add(g); const tr = new T.Mesh(new T.CylinderGeometry(0.42, 0.62, h, 12), mat({ color: '#b9b2a6' })); tr.position.y = h / 2; tr.castShadow = true; g.add(tr); const fr = new T.ConeGeometry(0.9, 9, 4); fr.translate(0, 4.5, 0); for (let i = 0; i < 11; i++) { const f = new T.Mesh(fr, mat({ color: i % 2 ? '#4f7a2a' : '#5f8a33', flatShading: true })); f.scale.set(1, 1, 0.12); f.position.y = h + 2.2; f.rotation.set(0, i / 11 * Math.PI * 2, 1.15 + (i % 3) * 0.2); f.castShadow = true; g.add(f); } };
      palm(PW / 2 - 4, 26, 26, 0.02); palm(PW / 2 - 0.5, 27.5, 24, -0.03); palm(PW / 2 + 5, 26.5, 25, -0.32);

      // ---------- NEW screens: 1x2 one-piece frame around each opening + mesh
      target = screens;
      const F = 2 / 12, FD = 1 / 12, SZ = -0.42;
      const archShape = (cx, r, spring, y0) => { const s = new T.Shape(); s.moveTo(cx - r, y0); s.lineTo(cx - r, spring); s.absarc(cx, spring, r, Math.PI, 0, true); s.lineTo(cx + r, y0); s.lineTo(cx - r, y0); return s; };
      const rectShape = (x0, x1, y0, y1) => { const s = new T.Shape(); s.moveTo(x0, y0); s.lineTo(x0, y1); s.lineTo(x1, y1); s.lineTo(x1, y0); s.lineTo(x0, y0); return s; };
      const sBox = (x0, x1, y0, y1, z0, z1, m) => { const b = new T.Mesh(new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m || M.frame); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); b.castShadow = true; screens.add(b); return b; };
      L.items.forEach(o => {
        const r = o.w / 2, h = Math.min(o.h, AWH - 0.4), spring = h - r;
        let outer, inner;
        if (o.type === 'arch') { outer = archShape(o.cx, r, spring, 0); inner = archShape(o.cx, r - F, spring, F); }
        else { outer = rectShape(o.x0, o.x1, 0, h); inner = rectShape(o.x0 + F, o.x1 - F, F, h - F); }
        outer.holes.push(inner);
        const fr = new T.Mesh(new T.ExtrudeGeometry(outer, { depth: FD, bevelEnabled: false, curveSegments: 48 }), M.frame); fr.position.z = SZ; fr.castShadow = true; screens.add(fr);
        const innerFill = o.type === 'arch' ? archShape(o.cx, r - F, spring, F) : rectShape(o.x0 + F, o.x1 - F, F, h - F);
        const mesh = new T.Mesh(new T.ShapeGeometry(innerFill, 48), M.mesh); mesh.position.z = SZ + FD / 2; screens.add(mesh);
        // Profiles selected in the approved 2D frame plan become individual 3D pieces.
        (o.segments || []).forEach(seg => {
          const t = Math.min(.96, Math.max(.04, Number(seg.t) || .5));
          const inches = Math.max(1, Math.min(4, parseFloat(String(seg.profile || '1x2').split('x')[0]) || 1));
          const sw = inches / 12;
          if (seg.direction === 'v') {
            const xx = o.x0 + o.w * t;
            const dx = xx - o.cx;
            const yTop = o.type === 'arch' ? spring + Math.sqrt(Math.max(0, r*r - dx*dx)) : h;
            if (yTop > F) sBox(xx-sw/2, xx+sw/2, F, yTop, SZ-.015, SZ+FD+.015);
          } else {
            const yy = Math.min(h-F, Math.max(F, h * t));
            let l = o.x0 + F, rr = o.x1 - F;
            if (o.type === 'arch' && yy > spring) {
              const half = Math.sqrt(Math.max(0, r*r - (yy-spring)*(yy-spring)));
              l = o.cx - half + F/3; rr = o.cx + half - F/3;
            }
            if (rr > l) sBox(l, rr, yy-sw/2, yy+sw/2, SZ-.015, SZ+FD+.015);
          }
        });
        if (o.door) {
          const dh = o.type === 'arch' ? spring : Math.min(h - F, 6.67), z0 = SZ - 0.01, z1 = SZ + FD + 0.03;
          sBox(o.x0 + F, o.x1 - F, dh - F / 2, dh + F / 2, z0, z1);
          sBox(o.x0 + F, o.x0 + F * 2.2, F, dh, z0, z1); sBox(o.x1 - F * 2.2, o.x1 - F, F, dh, z0, z1);
          sBox(o.x0 + F, o.x1 - F, F, F * 2.6, z0, z1); sBox(o.x0 + F, o.x1 - F, Math.min(2.55, dh / 2), Math.min(2.55, dh / 2) + F * 1.2, z0, z1);
          sBox(o.x1 - 0.55, o.x1 - 0.45, Math.min(2.75, dh / 2 + 0.2), Math.min(3.25, dh / 2 + 0.7), z1, z1 + 0.09, M.black);
        }
      });
      // Roof screen — parametric geometry from approved 2D roof drafting.
      // This is a construction concept, not an engineered structural section.
      if (P.topScreen.on) {
        const y = AWH + 0.04, x0 = 0, x1 = PW;
        const za = fasciaZ + (P.gutter.superOn ? 0.68 : 0.35), zb = -0.25;
        const roof = P.roofDesign?.status === 'approved-conceptual' ? P.roofDesign : {style:'flat',bays:[]};
        const style = roof.style || 'flat';
        const inset = Math.max(.08, Math.min(Math.min(PW, zb-za)/2-.04, +roof.inset || 1));
        const rise = Math.max(0, Math.min(20, +roof.rise || 0));
        const pts = [];
        const tri=(a,b,c)=>pts.push(...a,...b,...c);
        const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d);};
        const beam=(a,b,width=.115)=>{
          const va=new T.Vector3(...a), vb=new T.Vector3(...b), vector=vb.clone().sub(va), len=vector.length();
          if(len<.04)return;
          const mesh=new T.Mesh(new T.BoxGeometry(width,.095,len),M.frame);
          mesh.position.copy(va.add(vb).multiplyScalar(.5));
          mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),vector.normalize());
          mesh.castShadow=true;screens.add(mesh);
        };
        const A=[x0,y,za], B=[x1,y,za], C=[x1,y,zb], Dd=[x0,y,zb];
        if(style==='mansard' && (zb-za)>2*inset && PW>2*inset){
          const Ai=[x0+inset,y+rise,za+inset],Bi=[x1-inset,y+rise,za+inset],
                Ci=[x1-inset,y+rise,zb-inset],Di=[x0+inset,y+rise,zb-inset];
          quad(A,B,Bi,Ai);quad(B,C,Ci,Bi);quad(C,Dd,Di,Ci);quad(Dd,A,Ai,Di);
          quad(Ai,Bi,Ci,Di);
          [A,B,C,Dd].forEach((p,i)=>beam(p,[B,C,Dd,A][i]));
          [Ai,Bi,Ci,Di].forEach((p,i)=>beam(p,[Bi,Ci,Di,Ai][i]));
          [[A,Ai],[B,Bi],[C,Ci],[Dd,Di]].forEach(pair=>beam(...pair));
        } else if(style==='gable' && rise>0){
          const rm=(za+zb)/2, Ra=[x0,y+rise,rm],Rb=[x1,y+rise,rm];
          quad(A,B,Rb,Ra);quad(Ra,Rb,C,Dd);
          [[A,B],[B,C],[C,Dd],[Dd,A],[Ra,Rb],[A,Ra],[B,Rb],[Dd,Ra],[C,Rb]].forEach(pair=>beam(...pair));
        } else {
          quad(A,B,C,Dd);
          [[A,B],[B,C],[C,Dd],[Dd,A]].forEach(pair=>beam(...pair));
        }
        const geom=new T.BufferGeometry();
        geom.setAttribute('position',new T.Float32BufferAttribute(pts,3));geom.computeVertexNormals();
        const roofMesh=new T.Mesh(geom,M.meshTop);roofMesh.receiveShadow=true;screens.add(roofMesh);
        // Bay positions are user editable in the roof plan; keep the default 16x2 opening ONE panel.
        for(const t of (roof.bays||[])){
          const x=x0+(x1-x0)*Math.max(.03,Math.min(.97,+t||.5));
          if(style==='gable'&&rise>0){let mid=(za+zb)/2;beam([x,y,za],[x,y+rise,mid]);beam([x,y+rise,mid],[x,y,zb]);}
          else if(style==='mansard'&&rise>0&&(zb-za)>2*inset){beam([x,y,za],[x,y+rise,za+inset]);beam([x,y+rise,za+inset],[x,y+rise,zb-inset]);beam([x,y+rise,zb-inset],[x,y,zb]);}
          else beam([x,y,za],[x,y,zb]);
        }
      }
      this._views();
      this.apply();
      this.sun.target.position.set(this.dims.cx, 0, -6); this.sun.position.set(this.dims.cx - 35, 60, 45);
    }
    apply() { if (!this.root) return; this.screens.visible = this.after; this.newWork.visible = this.after; this.beforeOnly.visible = !this.after; this.land.visible = this.showLand; this.palmsG.visible = this.showPalms; }
    setAfter(on) { this.after = on; this.apply(); }
    setLandscape(on) { this.showLand = on; this.apply(); }
    setPalms(on) { this.showPalms = on; this.apply(); }

    _views() {
      const d = this.dims, pc = d.PW / 2, cx = d.cx;
      this.VIEWS = {
        frente: { p: [cx, 6.4, 64], t: [cx, 7, 0] },
        izq: { p: [cx - 46, 9, 42], t: [pc - 4, 5, -2] },
        der: { p: [cx + 40, 8, 38], t: [pc - 3, 5, -2] },
        arcos: { p: [pc, 5, 21], t: [pc, 4.6, -2] },
        top: { p: [pc + 2, 22, 13], t: [pc, 8.5, -2] },
        porche: { p: [d.PW - 1.3, 5.2, d.PZ + 2.4], t: [1, 4.2, d.PZ + 4.8], fov: 78 },
        aerea: { p: [cx + 26, 62, 54], t: [cx, 0, -10] }
      };
    }
    goView(name, instant) {
      const v = this.VIEWS && this.VIEWS[name]; if (!v) return; this.view = name;
      const to = { p: new T.Vector3(...v.p), t: new T.Vector3(...v.t), fov: v.fov || 40 };
      const asp = Math.max(0.3, this.host.clientWidth / Math.max(1, this.host.clientHeight)), fac = v.fov ? 1 : Math.max(1, 1.05 / asp);
      if (fac > 1) to.p.sub(to.t).multiplyScalar(fac).add(to.t);
      if (instant) { this.camera.fov = to.fov; this.camera.updateProjectionMatrix(); this.camera.position.copy(to.p); this.controls.target.copy(to.t); this.controls.update(); this.anim = null; return; }
      this.anim = { from: { p: this.camera.position.clone(), t: this.controls.target.clone(), fov: this.camera.fov }, to, k: 0 };
    }
    resize() { const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight); this.renderer.setSize(w, h, false); this.renderer.domElement.style.width = '100%'; this.renderer.domElement.style.height = '100%'; this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
    _tick() {
      const a = this.anim;
      if (a) { const now = performance.now(); a.t0 = a.t0 || now; a.k = Math.min(1, (now - a.t0) / 750); const e = 1 - Math.pow(1 - a.k, 3); this.camera.position.lerpVectors(a.from.p, a.to.p, e); this.controls.target.lerpVectors(a.from.t, a.to.t, e); this.camera.fov = a.from.fov + (a.to.fov - a.from.fov) * e; this.camera.updateProjectionMatrix(); if (a.k >= 1) this.anim = null; }
      if (!this.host.isConnected || this.host.clientWidth === 0) return;
      this.controls.update(); this.renderer.render(this.scene, this.camera);
    }
    snapshot(w, h, view, type, opts) {
      opts = opts || {};
      const cam = this.camera, ctl = this.controls, r = this.renderer;
      const sp = cam.position.clone(), st = ctl.target.clone(), sf = cam.fov, pr = r.getPixelRatio(), ow = this.host.clientWidth, oh = this.host.clientHeight, sa = this.after;
      if (opts.after !== undefined) this.setAfter(opts.after);
      if (view) { const v = this.VIEWS[view]; cam.position.set(...v.p); ctl.target.set(...v.t); cam.fov = v.fov || 40; cam.lookAt(ctl.target); }
      r.setPixelRatio(1); r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      r.render(this.scene, cam); const url = r.domElement.toDataURL(type || 'image/jpeg', 0.9);
      this.setAfter(sa); cam.position.copy(sp); ctl.target.copy(st); cam.fov = sf; r.setPixelRatio(pr); this.resize(); ctl.update();
      return url;
    }
  }
  window.GSSViewer = Viewer;
})();
