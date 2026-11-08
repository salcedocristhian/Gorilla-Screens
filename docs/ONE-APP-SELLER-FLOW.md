# Gorilla Screens — One-App Seller Flow (2026-11-07)

## Product intent
A field seller opens **one Gorilla screen on iPhone 14+**, and stays there from client intake through photographing, site interpretation, project-specific design questions, verification of the actual scope, 3D, quote and conceptual presentation. The **existing house** is context; the **proposed screen enclosure** is billable construction.

## Shipped in this branch (web-only)
1. **Single photo repository**: guided capture saves images once in project-owned IndexedDB. Gemini automatically selects up to five existing photos (prefer four site views plus one licensed aerial). The extra rapid-photo upload remains under **Other capture options** only, for backward compatibility. Nothing is transmitted until the operator checks explicit authorization and starts analysis.
2. **Single Gemini action**: secure Worker access code stays in memory for this open app session, not in localStorage, project exports, URLs, or Git. Gemini API key remains server-side. Authenticated Cloudflare Worker still enforces origin, bearer token, input size, rate limit and JSON validation. **One app** does not mean removing authentication.
3. **One design handoff**: after real Gemini findings are saved, proceed directly to the built-in AI Designer interview rather than manual JSON/prompt copying. Confirmed options can update editable V17 material/finish selections.
4. **One honest stepper**: checked stages indicate actual persisted evidence, reviewed design intent and field-measurement approval; merely opening a later screen cannot imply an approval. A project-specific next action helps salespeople resume a visit.
5. **Protected legacy tools**: manual Porch Trace, editor, enclosure V17, takeoff, conceptual PDF, photos and quotation stay available as before. Browser QA covers demo and new projects, and the new flow.

## What this does NOT implement yet
- Five-photo full-house reconstruction of the realism/accuracy of the human-authored Claude model.
- True camera-pose recovery, LiDAR, native ARKit, photogrammetric mesh, reliable estimated construction dimensions or structural connection design.
- Generative follow-up questions with a second live Gemini call; current Designer is an adaptive, evidence-conditioned interview.
- Automated engineering approval, permit drawing seal, or final fabrication dimensions.

## Cost and privacy conditions
- **Web capture, Three.js viewer and offline-first draft** use open web technologies. GitHub Pages can host a public repo for free subject to GitHub policies.
- **Cloudflare Workers** has a limited free plan; free quotas, traffic and CPU limits apply.
- **Gemini API** offers restricted free usage on some models; higher volume and production privacy protections can require paid billing. Google's free-tier policies indicate submitted content can be used to improve their products; do not use sensitive customer photos on this tier without legal/privacy review and appropriate authorization.
- iPhone Pro **LiDAR/RoomPlan** access is not a capability this Safari/PWA uses. A custom native iOS component would be a separate development and distribution project, potentially with Apple Developer Program cost.
- **Aerial imagery** must be user-authorized and rights-cleared; the app does not scrape Google imagery.
- Customer photos saved locally on a given browser/device are **not synchronized** to other devices; export secure backup if needed. No unencrypted upload to GitHub.

## Ideal operator script
1. Create a visit, confirm client and address.
2. Capture the job from the front, both oblique angles, fascia/attachment, inside patio and optionally an authorized aerial.
3. Check selected photos (up to 5), enter the company access code once that app session, authorize the transmission, tap Analyze.
4. Review evidence and answer adaptive questions: what scope, door, roof (only if in scope), mesh, aluminum finish.
5. Enter a known measurement baseline, then verify each fabrication-critical dimension on site.
6. Adjust separate existing-house context and proposed-screen assembly; verify connections and QA.
7. Generate conceptual presentation and quote. Never label as sealed engineering or fabrication-ready without formal review.

## Next engineering milestone
The next package is a **versioned editable site-scene contract** and actual photo-aligned reconstruction: image-to-surface evidence IDs; calibrated camera pose when supported; parametric house solids and fascia lines; separate proposed-screen components; manual edits; before/after QA; persist project isolation. Start with the 22743 SW 56th Ave demo and a second unrelated property to prevent copying house geometry.

Do not deploy live Worker secrets, bypass bearer auth, send supplier orders, or force phone upgrades.
