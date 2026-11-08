# Photo-to-scene experimental implementation

The Designer now has a separate “Casa 3D” card. Selected, consented project photos are sent through the existing authenticated Gemini bridge with `task=reconstruct`. The response is a bounded `site-scene-v1` scene, not executable model code. The same validator runs in the Worker and browser.

The viewer draws editable walls, columns, roof surface boxes and slabs in relative XYZ coordinates. Walls support distinct rectangular and curved arch openings. Each surface cites photo indices. The operator can compare original photos, correct coordinates and openings, and save the scene in that project's record. The optional screen overlay is a separate Three.js group fitting eligible openings, without a new roof, takeoff, prices, or verified dimensions. It is not a complete enclosure design or door assembly.

## Scope and limits

- This is an uncalibrated visual interpretation, not camera-pose recovery or photogrammetry. Ratios may be wrong. Geometry remains relative and all verification flags remain false.
- Hidden surfaces must be omitted. Insufficient evidence can produce an empty scene and missing-view instructions.
- Client rejects missing/foreign scene responses; an old deployed Worker produces an explicit unsupported message and retains the saved scene.
- Invalid geometry, overlapping openings and missing source photos block use. Edits cannot silently promote the scene into fabrication or existing V17 quantities.
- Project source photos are stored locally; this does not add cloud synchronization.
- Existing saved scene is replaced only on a successful explicit regeneration. Camera view resets when switching edited elements.
- Roof surfaces are simplified boxes; complex roofs and complete-house fidelity remain future work.

## Validation

`node tests/test_site_scene.mjs` checks two different synthetic house fixtures, arch bounds, photo ownership, malformed output, forged approval stripping, gateway authentication, old Worker behavior and API client binding.

`node tests/test_site_scene_browser.mjs` uses a mocked Gemini response to test the real mobile UI/WebGL viewer, consent, editing, persistence and project isolation. The QA image is synthetic software-test evidence, not proof of real reconstruction quality.

## Live acceptance still required

No deployment or live photo submission is performed by this change. Deploy the matching frontend and Worker in an isolated preview with the existing secure configuration. The Worker bundle now contains `cloudflare/` and `js/site-scene-contract.js`; deploy with `wrangler deploy --config cloudflare/wrangler.bridge.json` from its root. Keep the API key server-side.

Run consented real photos of 22743 SW 56th Ave and a second unrelated property. Record omissions, duplicate surfaces, opening shape/orientation errors and required manual corrections. Compare against the reference model and field observations. Do not mark the reconstruction milestone complete based only on synthetic regression tests. A working Gemini model and endpoint must be verified in that environment; this branch preserves the existing model configuration.
