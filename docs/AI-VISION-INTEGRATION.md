# AI Vision → V17: guarded phase-1 integration

## Implemented
- The **Fotos** tab has an AI Vision area and launches the existing Cloudflare `/pilot` in a separate tab.
- Operators paste Gemini's **complete JSON result** and explicitly bind 1–5 project photos. When `siteGeometry.photoCount` exists, the photo count must match.
- The result is normalized into `project.aiVision`, not into measured geometry. Results are always **draft-needs-human-review**.
- The **Studio → Design** section shows a read-only summary and a link back to source photos.
- Each import belongs to one `projectId`; photo references are remapped during project backup import.
- AI analysis is excluded from share links to customers.
- No photo/JSON is sent to GitHub or any Gemini endpoint from the public app.
- Native `/pilot` still exists on Cloudflare and is managed independently.

## Explicitly not implemented
- Browser-to-Worker cross-origin POST from GitHub Pages: the original Worker rejects foreign origins. Do not enable wildcard CORS for client imagery.
- AI-generated 3D reconstruction, inferred dimensions, automated approval or supplier purchases.
- Automatic multi-photo upload inside the public app. The private pilot remains the supported input while authenticated API architecture is reviewed.

## Acceptance checks
1. Create a new project A with three authorized photos showing a screened arch porch. In Fotos, select exactly those three and paste the corresponding Gemini JSON. Confirm `draft-needs-human-review`, arch warnings and no model updates.
2. Create project B with five unrelated pool-enclosure photos, import its result, and verify that its photos/results never appear in project A.
3. Refresh the page, open Studio for both projects, verify project-owned read-only AI summary and unchanged width/depth/height/takeoff.
4. Export project A backup, re-import it, and confirm that all photo references are remapped and the AI result belongs only to the new project.
5. Delete an evidence photo: Studio/Fotos must flag missing evidence; do not silently relabel the result as approved.
6. Test iPhone Safari and Android Chrome, including photo gallery access, clipboard paste, navigation, IndexedDB persistence and offline behavior.
7. Run `node tests/test_vision.mjs`, `node tests/test_model.mjs`, `node tests/test_v17.mjs`, plus CI browser smoke.

## Security follow-up
A production automatic integration requires a trusted authenticated backend with consent, per-user access, project authorization, bounded upload sizes, protected keys, logging, rate limits, CORS restricted to validated origins, and retention/deletion rules. Never place `GEMINI_API_KEY` in browser JavaScript or the public GitHub repository.
