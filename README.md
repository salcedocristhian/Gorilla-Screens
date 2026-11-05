# Gorilla Screen Studio — V14 (functional field-design preview)

This is an updated working copy of the supplied `Gorilla-Screens-main.zip`. The original project, photos, brand assets, quotations, IndexedDB project storage and Three.js scene architecture are retained.

## Run / publish

Serve the **contents** of this folder (not the surrounding ZIP) over HTTP(S). For local testing:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. To publish, place the folder contents at the GitHub Pages root and enable Pages. On iPhone, open in Safari and use Share → Add to Home Screen. Third-party Three.js and jsPDF scripts require a first online load.

## New practical workflow

1. **Projects**: find a project using the compact search box, add via `+`, import via upload icon.
2. **Location**: enter address and search from the field icon. The map selector switches between aerial and street links; it does **not** circumvent Google Maps screenshot or storage restrictions.
3. **Photos**: take or upload field photos and assign categories; an individual photo can be selected as a tracing reference.
4. **Measurements → 2D editor**: `Abrir editor 2D` opens photo-backed SVG drafting. Select the photo, set opacity, draw arches or rectangular openings, move handles, calibrate from a known dimension, add/move/remove horizontal/vertical profiles, set 1×2 through 4×4, select screen door, review preliminary takeoff and approve a revision.
5. **Measurements → Roof editor**: choose Flat, Mansard or Gable; edit width/depth/rise/mansard inset, drag/add/delete beams and approve an independent conceptual roof revision.
6. **3D**: approved opening profiles and roof style feed the existing parametric scene. Reopen 3D after approval to rebuild. The house is approximate; a roof larger than the photographed 16×2 opening requires a separate site geometry survey and a fit-to-house review.
7. **Deliver**: 11×17 conceptual PDF drawings with G-0 site/location/aerial reference, S-1 screen elevation/roof layout, S-2 typical details, and S-3 reference imagery. The actual aerial image appears only if an authorized photo was uploaded.

## Technical boundaries — do not present as engineered plans

- Camera and photo tracing are **manual / assisted**, not automatic AI photogrammetry. A photograph alone cannot establish reliable real-world dimensions. Scale calibration and field dimensions are required.
- Profile selections, screen areas and roof styles are geometric concepts, **not structurally verified** for wind pressure, deflection, footings, anchors, splices, fasteners or supplier-approved spans.
- The default 22743 project remains a 16'×2' horizontal screen opening with 7" dark-bronze *interior* super gutter, three existing arches, and existing white side gutters. A Mansard or Gable roof changes the scope; do not use the existing house geometry as a fabrication model without a measured site model and engineered details.
- 36"×80" doors in 4'×7' semi-circular arch openings may not fit at the shoulders. Verify door clearances and as-built arch profiles.
- Material quantities are preliminary; do not treat conceptual section diagrams as product approvals.
- Photos and projects are stored locally in IndexedDB. No central login, cloud storage or automated external upload is configured.
- Google Maps screenshot capture is intentionally **not** automated. Use authorized/user-owned reference images instead.
- Installation manuals and isometric supplier PDFs have **not** been integrated: two PDFs mentioned in chat were not available in the uploaded project/container. Product-specific geometry, proprietary parts and manufacturer fasteners remain pending.

## QA performed

- JavaScript syntax checked across `js/*.js` and service worker.
- In a sandboxed Chromium DOM, tested create project → measurements → prefill a 3-opening drawing → approve → roof editor → Mansard geometry change → approve. No JavaScript exceptions in those screens.
- Visual browser test of the full Three.js 3D is still pending because local/remote navigation and CDN dependencies are blocked in the test environment. Evaluate on an actual iPhone before production.

## Key files

- `js/editor.js` — photo-backed vector opening editor
- `js/roof.js` — interactive roof plan editor (Flat/Mansard/Gable)
- `js/model.js` — project records and area calculations
- `js/scene3d.js` — existing house and parametric screen scene
- `js/plan.js` — architectural sheets / location references
- `js/app.js` — screens, project navigation and workflows
- `css/app.css` — touch-oriented responsive UI
