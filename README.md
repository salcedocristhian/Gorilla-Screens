# Gorilla Screen Studio — V16 Gorilla Field Pilot

This branch contains the Gorilla Screening Solutions LLC **photo-first field pilot**. New customer projects start with **zero openings, no demo house, no preset roof/gutter and no default price**. The original 22743 SW 56th Ave project is preserved as an **opt-in demo**.

## iPhone workflow
1. Open the app via HTTPS and choose **+ Proyecto desde fotos**.
2. Enter the real property address and customer name.
3. Photograph the front, each opening, roof/fascia and connection details.
4. Open **✎ Plano** on the appropriate photo. Trace rectangular or arched openings and assign aluminum profile sizes and frame pieces.
5. Physically measure openings, enter verified dimensions, and select **Medidas verificadas en campo** for each opening.
6. Approve a 2D drawing revision. Only then can that field project's own 3D, takeoff and conceptual PDF be generated.
7. If the job includes a new screen roof, open the roof editor and enter actual measurements before selecting Flat/Mansard/Gable.
8. Enter real quotation prices and export the 11 × 17 conceptual drawing set and JSON backup with photos.

## Independent projects
- `GSSModel.emptyProject()` creates a unique job with zero preloaded geometry.
- `GSSModel.demoProject()` preserves the existing Boca Raton example separately.
- `normalize()` must not inject sample openings into a blank customer project.
- `js/scene3d.js` draws only the active field project's approved geometry; no borrowed house, garage or landscaping.
- `js/field-plan.js` creates 4 conceptual field sheets (G-0, S-1, S-2, S-3) from approved measurements and available project photos.
- Changes to a drawing require reapproval before definitive 3D/PDF results are updated.

## Testing
- `node tests/test_model.mjs`: unique blank projects, no inherited geometry, demo preserved, independent approval.
- `node tests/test_field_pdf.mjs`: 4 field sheets generated using a jsPDF API stub.
- `node --check js/*.js`: syntax verification.
- Optional Playwright scripts under `tests/` were authored for the original field sandbox; their hard-coded file paths must be adapted before running in a new environment.

See [Gorilla Field Test Checklist](docs/Gorilla-Field-Test-Checklist.md) for the operator procedure.

## Data and privacy
- Projects and photos use **local IndexedDB**, not cloud sync. Export a JSON photo backup after every visit.
- This GitHub repo is public. Do **not** commit private customer photos, addresses, site plans or credentials.
- No automatic AI photogrammetry exists yet. Photos assist manual vector tracing; dimensions require direct physical verification.
- The 3D is schematic parametric framing, not a survey reconstruction of the actual house.
- An 80-inch door may not fit under a narrow arch; the editor checks geometric clearance.
- Conceptual PDFs are **not signed/sealed structural or permit-ready engineering drawings**.

## Hosting
The project uses relative asset paths and can run over HTTPS from GitHub Pages. Three.js and jsPDF currently load from external CDNs; do not promise offline operation before verifying cache behavior on the actual iPhone.

## Deployment workflow
Work in `pilot/v16-gorilla-field`, open a PR against `main`, verify the Pages URL and conduct actual iPhone/field tests before merging. Do not overwrite `main` before reviewing deployment/QA.