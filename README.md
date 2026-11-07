# Gorilla Screen Studio — V17 Beta + V16 Field Pilot

**V17 is integrated in the project navigation as Studio.** It adds a separate conceptual 3D enclosure workspace, manual project-photo comparison, 11 × 17 preliminary drawings, profile takeoff, commercial-bar cutting plan, cost inputs, and human-reviewed supplier RFQ handoff. Existing V16 photo tracing, approvals, 3D and deliverables remain available.

**In review: AI Vision JSON handoff.** The Fotos tab can attach the Gemini /pilot JSON report to photos from the same project, and Studio Design displays a read-only summary. No direct photo upload from GitHub Pages, no inferred geometry, and no automatic field approvals. See [AI Vision Integration](docs/AI-VISION-INTEGRATION.md).\n\n**New: Enclosure on Existing House Reference (V17 beta).** In `Studio → Design`, Gorilla can display a reference house volume and facade photo from that exact project's Fotos records behind the editable screen enclosure. The house is a separate visual layer; change the selected photo, sketch facade width/depth/roof type/offset and enter the field-verified fascia elevation. The tool flags mismatches and provides an explicit `Match enclosure height to fascia` action. The site plan shows **existing house + proposed enclosure** in a schematic shared coordinate system. This does not produce an AI reconstruction, survey, engineering model, or verified attachment measurements; the operator must inspect the geometry and confirm dimensions. Existing house quantities never go into the enclosure takeoff.

**Start:** create a new project from photos, record the address and field dimensions, open the new **Studio** tab, choose roof/profile/finish settings, preview 3D, then open **Deliverables** or **Takeoff & Order**. No customer data is uploaded to GitHub; field data remain local.

**Not production engineering or fully automated AI:** no five-photo automatic house reconstruction, no automatic camera calibration, no permit-ready sealed drawings, and no direct ABC/Lansing purchase API. Engineering, manufacturer-specific components and actual vendor stock/prices require independent verification. The app will never transmit a purchase order without a person acting.

See [V17 Implementation & QA](docs/V17-IMPLEMENTATION.md) and [V17 Actions](https://github.com/salcedocristhian/Gorilla-Screens/actions/workflows/v17-ci.yml).

---

## Preserved V16 Pilot

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