# Gorilla Screen Studio V17 — implementation, QA, and roadmap

**Status:** Field-pilot implementation on \`feature/v17-design-to-purchase-studio\` for review. Not a production launch and **not engineered construction documents**.

## Source-derived reference pattern

Public project examples were supplied to define the desired *categories* of deliverables and product families; no third-party drawings/assets were copied:

- [Screen Patio (Nokomis)](https://screen-factory-florida.com/projects/screen-patio/): Engineering & Plans, Layout Visualization, Site Planning; IRP patio concept.
- [Screen Patio Enclosure (Cape Coral)](https://screen-factory-florida.com/projects/screen-patio-enclosure-cape-coral-4357/): concrete extension, IRP roof, screen walls.
- [Giant Panoramic Screen Enclosure (Tampa)](https://screen-factory-florida.com/projects/giant-panoramic-screen-enclosure-tampa-3419/): Picture View, larger roof members, supports and cable engineering.
- [Mansard Pool Screen Enclosure (Cape Coral)](https://screen-factory-florida.com/projects/mansard-pool-screen-enclosure-cape-coral-2140/): Mansard references.

## Features implemented in this PR

| Scope | Implementation | Caveat |
| --- | --- | --- |
| Project navigation | New **Studio** tab; existing app sections retained | Existing 3D remains separate |
| Design model | Width, depth, wall height, Mansard/Flat/Gable/IRP/Mixed selector, profile and mesh selections | Dimensions must be measured; these are independent conceptual parameters |
| 3D | Isolated orbitable Three.js framing viewer, schematic attachment wall, roof grid, super gutter/downspouts | No photogrammetric reconstruction of an actual house or structural verification |
| Wall framing | ~6 ft target panels, 2×5 posts, selectable profiles, upper 2×2 roof receiver/spline, lower distinct 1×2 wall spline, 2×2 chair rail at 36 inches, 1×2 bottom, door | Post sections and attachments must be engineered |
| Roof framing | ~6×6 ft roof modules, 2×8 beams from house-side gutter to front, 2×2 secondary traverses, configurable profiles | Mansard/IRP beam calculations currently schematic, not fabrication schedules |
| Finishes | White default on new field intake, Dark Bronze alternative; Black removed from active selector | Legacy Black projects preserved, not converted silently |
| Photo comparison | Existing own-project photo and own-project render with reveal slider, render scale and XY offset | Manual image pairing/alignment; **no AI automatic camera matching** |
| Deliverables | 11×17 multi-page PDF: conceptual elevation/plan, roof framing, proposed site footprint, material summary | No survey boundaries, setbacks, sealed structural drawings or true CAD/DXF yet |
| Stock cut optimizer | Pieces grouped by profile, 24/30 ft configurable stock, first-fit packing, remaining offcuts, purchase quantities, 10% reserve target without double counting | Confirm actual vendor stock, saw kerf, splice design, lengths and SKU |
| Supplier handoff | Supplier selection, per-profile private input costs, configurable margin; download CSV; explicit local approval; manual email RFQ or phone launch | No supplier API, validated pricing, automatic email transmission or actual PO |
| Change control | Signed purchase-list fingerprint goes OUTDATED when geometry, profiles, stock/supplier or profile price changes | An authorized buyer still must verify every quote and submit the real purchase order |

**Privacy:** All saved project data are local to the browser's IndexedDB. Do not commit real customer photos, property surveys or credentials into the public repository.

## QA and quick acceptance

The workflow \`.github/workflows/v17-ci.yml\` checks the original V16 isolation test, V17 parametric calculations, JS syntax and a mobile Chromium smoke scenario if browser setup succeeds.

1. Open the branch using a safe local Pages preview/staging host, or run \`python3 -m http.server 8765\` in the checkout.
2. Create a **new field project**. Confirm that it contains zero inherited openings or house geometry; new finish preselects White.
3. Open **Studio**. Enter test dimensions: 30 ft front × 20 ft depth × 8 ft height. Rotate the 3D schematic and confirm roof framing stays attached to the correct site, not the example house.
4. Confirm distinct top 2×2 and lower 1×2 profiles, 2×5 posts, 2×8 beams, 2×2 cross-members, interruptions at the door, and editable section values.
5. Switch to **Deliverables**; download conceptual PDF and cutting CSV. Check labels (unverified/verified), stock quantities and *no invented setbacks*.
6. In **Takeoff & Order**, verify approval is blocked until the user attests measurements; confirm >30 ft unspliced pieces are flagged. An approved list must become **OUTDATED** after changes.
7. Load the existing opt-in demo. In Studio > Photo Match, compare that project's existing before and proposed render; adjust the reveal slider. Confirm new projects do not inherit demo photos.
8. Verify on actual iPhone Safari and Android Chrome before merge. Screenshots/test in CI are not equivalent to physical-device acceptance.

## NOT implemented or NOT complete

- High-fidelity AI house/patio/pool reconstruction from five photographs, geospatial/photogrammetric measurement or calibrated automatic camera match.
- Structural member checks, wind loading, signed/sealed plans, county/city permit handling, engineer-approved Picture View spans, proprietary connection design.
- Automatically engineered K-braces/cables, complete insulated-roof panel schedules, solid-roof drainage/flashings and structural/civil foundation drawings.
- One-click upload of complete project backups to Drive, team auth/multi-tenant SaaS, real supplier catalog/SKU/prices, direct supplier ordering, messaging APIs.
- Shop/fabrication-grade cutting with blade kerf, manufacturer-specific connectors and exact part compatibility.

**Safety gates:** The V17 conceptual purchasing approval is blocked for Picture View and IRP/Mixed because their current material schedules cannot represent complete engineered orders. A manual supplier RFQ is never transmitted autonomously.

## Suggested follow-on phases

- **V17.1:** Stabilize PDF accuracy, profile-specific stocking/SKUs, door positioning, wall/roof junctions, true takeoff from one 3D geometry graph, attachment verification and cross-project isolation.
- **V17.2:** Camera calibration with operator control points; optional secure backend for image segmentation and reconstruction, with explicit estimated-versus-field-verified dimensions.
- **V18:** Engineer-reviewed panoramic and IRP hybrid materials, approved drawing imports, actual survey/setback review and controlled engineering handoff.
- **V19:** Authorized supplier integrations and multi-company isolation/billing; per-tenant tariffs and approval workflows.

## Rollout

Keep \`main\` unchanged while evaluating this feature branch. Merge only after tests pass, phone-browser QA and stakeholder sign-off. GitHub Pages is a static host; external vision AI, authorization, storage, and live vendor APIs need additional services.
