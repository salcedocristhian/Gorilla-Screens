# Gorilla AI Auto-Reconstruct — V17.1 private pilot

**Current state:** GitHub experimental PR, not merged into main. The user has successfully
tested a private Cloudflare Worker that accepted **five photos** and returned descriptive
Gemini JSON. The updated, **richer geometric output schema** below is now implemented
in GitHub but has NOT been verified as deployed in Cloudflare. Source:
`cloudflare/gorilla-vision-multiphoto-v2.js`.

## Objective

The **existing house is context**, not the construction product. The editable product
continues to be the screen enclosure. The AI may help create a *schematic existing
house visual reference*, but must never invent surveyed or fabricated dimensions.

## Implemented in Gorilla branch

- Studio → Design → **AI Site Reconstruction · V1 Experiment**.
- Select source photos already stored with this **same project** (no cross-project data).
- Open the protected Cloudflare Gemini pilot, analyze authorized photographs there,
  copy JSON results, and paste into Gorilla.
- The new `js/v17-reconstruct.js` validates photo evidence, visible story count,
  covered patio, balcony, pool/spa, surface, candidate connection zones, roof type,
  optional normalized facade openings and missing visual references.
- Three.js automatically renders **SCHEMATIC, NOT MEASURED** house story massing,
  covered-patio slab, balcony, possible connection-level indicators, swimming pool
  and spa ONLY when corresponding structured observations support them.
- All pool position/size, storey heights, and attachment band extents are proportional
  visual placeholders, NOT recovered survey dimensions or coordinates.
- If the current Gemini output contains **only text**, Gorilla creates a reviewable
  **observation draft** and keeps the existing schematic house volume. It does NOT
  synthesize measured windows, doors or house dimensions.
- If a future improved analysis returns explicitly normalized facade opening
  annotations, V17 preview draws **nonstructural visual overlays** on the reference facade.
- The seller may mark the draft **Reviewed as visual reference**. This NEVER marks
  field dimensions or engineering approval as verified.
- The enamel finish, roof beams, door frame, takeoff, cuts, prices and purchase approval
  remain independent from the AI house reference.
- Project export/import remaps AI evidence photo IDs and won't link to a different client's pictures.
- Automated tests cover parsing, invalid annotations, source photo isolation,
  review state and preservation of the existing Gorilla material quantities.

## Multi-photo Cloudflare Worker V2 (staged only)

\`cloudflare/gorilla-vision-multiphoto-v2.js\` is a **complete template** for the
existing \`gorilla-ai-vision\` Worker. It is NOT deployed automatically by pushing
to GitHub. It provides:

- \`GET /\`: service status and Gemini secret presence.
- \`GET /check-gemini\`: Gemini model catalogue connectivity.
- \`GET /pilot\`: browser page to select up to five same-property photos, authorize
  upload, request analysis and copy a JSON response.
- \`POST /api/reconstruct\`: same-origin, access-protected, JSON-only image analysis
  (up to five compressed JPEGs). No wildcard CORS.
- JSON response with findings and `siteGeometry`: optional stories, coveredPatio,
  poolPresent, spaPresent, balconyPresent, houseRoofType, poolShape, deckSurface,
  candidateAttachmentWalls / upperAttachmentZones and relative facade annotations.
- The current Gemini deployment may still use the previous descriptive-only
  schema. Update the Worker separately before expecting the newer fields.

**Deployment is a separate, explicit manual action by the Cloudflare account owner:**
open Cloudflare → Workers & Pages → \`gorilla-ai-vision\` → Edit code, and replace
the source with the reviewed Worker V2 file. Preserve \`GEMINI_API_KEY\` as an
encrypted Secret and **Cloudflare Access → All traffic** before deployment.

**No direct public Github Pages-to-Worker calls:** Access authentication on the
Worker doesn't automatically grant cross-origin browser requests from GitHub Pages.
The first pilot hands JSON across by copy/paste. A later protected app integration
requires a deliberate authenticated architecture with session handling, origin/CSRF
policies, quota enforcement, client consent, and provider cost controls.

## Accuracy and privacy boundaries

- Five independent photos can improve observations but do not make automatic
  photogrammetry, scale, camera calibration or engineering dimension verification.
- Rendering any house reference in V17 still requires manually entered preliminary
  enclosure width/depth/height; the UI will not infer or invent them from photos.
- Unknown roof type produces neutral massing, not a falsely recognized gable/hip roof.
- No confidence score proves an attachment location is structurally suitable; all
  candidate walls and upper zones remain unverified.
- If the AI says `stories: null` or `poolPresent: null`, Gorilla DOES NOT claim it
  has identified the feature or use prose heuristics to fabricate geometry.
- Relative facade rectangles in images are not exact 3D world coordinates; previews
  are provisional overlays and may not coincide with physical openings.
- House facade width, depth, fascia attachment and slab measurements need explicit
  field verification; do not derive procurement from AI.
- Photo upload occurs only after user consent. Google AI Studio free-tier privacy
  rules apply. Avoid photos containing people, license plates, addresses or secrets.
- User photos remain local in Gorilla's browser until authorized upload to Gemini.
  GitHub stores source code but not user photos or Gemini API secrets.
- The Worker has an **instance-local** courtesy cooldown, not a robust global quota.
  Before production add authenticated per-user usage limits, durable rate limiting,
  monitoring and spending protections.
- Never expose the Worker with Access disabled and never paste your Gemini API key
  into GitHub code.

## Test order

1. Run Node syntax checks and \`node tests/test_v17_reconstruct.mjs\`.
2. Run existing \`node tests/test_v17.mjs\` and \`node tests/test_model.mjs\`.
3. Browser regression: \`node tests/test_v17_browser.mjs\` on mobile-sized viewport.
4. In an authorized pilot, verify Worker V2 with 1, 3 and 5 *same-site* photos,
   including one case where the AI correctly refuses to place unsupported openings.
5. Confirm that newly generated house references do not mutate verified structure,
   door placements, supplier takeoff, prices, or any other customer's project.
6. Do not merge or deploy broadly until browser QA and authenticated-photo
   handling have passed review.

## Next iteration

- Multi-view image alignment from common feature points and camera geometry;
- One user-provided known length to establish an approximate scale;
- Manual correction and lock for fascia, slope, corner elevations, attachment anchors;
- Reviewable geometric graph linking existing house reference and *proposed* enclosure;
- Optional photogrammetry / depth-estimation backend for advanced accuracy;
- True private in-app AI call once authentication and consent are integrated.
