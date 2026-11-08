# Gorilla AI Designer → Claude-quality 3D (implementation roadmap)

**Product principle:** The existing property is a CONTEXT model; the proposed screen enclosure is the separate product. Only proposed, verified construction components enter takeoff and proposals.

## User journey

1. **Client and visit:** prefill contact, address and screening job type; retain a separate project record.
2. **Guided evidence:** up to five images for one inference request; recommend four original site views and one authorized aerial, with additional photos held locally. Capture fascia close-ups, front and diagonal elevations, floor/grade and obstacles. The aerial is an image supplied under proper rights, not a screenshot scraped by the app from Google Maps.
3. **Site interpretation:** infer existing house features, observed envelope, roof/fascia, arches/windows/doors, garage and patios. Tag each proposed feature with the source photo indices and confidence. Keep absent/invisible elements unknown.
4. **AI Designer dialogue:** ask what the seller is **constructing**, not questions about modeling the house for its own sake. Branch on existing-porch infill, pool enclosure, lanai and repairs. Answers persist per project and are invalidated when its evidence changes. The branch introduced here is a deterministic, evidence-conditioned conversation. **A fully generative Gemini follow-up model is not implemented in this phase.**
5. **Scale and measurement:** derive only *provisional* dimensions when a verifiable known-length reference or measured baseline makes estimation possible. Store source, derivation, uncertainty and method. Otherwise leave dimensions null, never supply fabricated feet/inches. Field-verified measurements override and lock estimates; updating them recomputes only proposed enclosure geometry.
6. **Dual-model 3D:** rebuild house context from a *validated, versioned, editable scene graph*; place an independent enclosure assembly with explicitly separate scene nodes. Review with split-photo comparison and orbit walkthrough. Three.js must never eval or execute JavaScript returned by an LLM. Reuse existing V17 profile, panel and order engines.
7. **Outputs:** realistic perspectives, 11×17 conceptual site/plan/elevation/connection details, takeoff and quote generated only from verified and explicitly reviewed proposals. Engineering approval and signed plans remain outside the prototype.

## Prompt architecture for backend implementation (not yet a live endpoint)

### Prompt A — multimodal Site Architect
You are a field architect reading **multiple views of the SAME existing property** plus an aerial. Describe only what can be supported by the photographs. Use distinct IDs and photo indices for each observed structural element. Propose a normalized, non-dimensional scene graph for **the existing house only**. Detect continuity of walls, front arches, roof eaves, gutters, fascia and slab; never make separate diagonal-view duplicates. Mark uncertain, occluded and interior conditions as unknown. Do not create a screen enclosure. Return JSON only, no executable code.

### Prompt B — Gorilla Screen Designer
You are a senior screen enclosure designer. You are given the **existing house context**, prior confirmed user answers and a list of open uncertainties. First ask exactly ONE high-value project-specific question about the work that will actually be built. Tailor questions for porch-infill, pool enclosure, lanai, or repairs; do not ask for details already established by evidence. Present 2–5 concrete selectable answers plus a field-verification option. When the design intent is complete, output a separate, editable screen enclosure proposal with explicit assumptions, no engineering claims, no price, and unknown dimensions null. Never alter the existing house scene or treat a masonry wall as a screen component.

### Prompt C — Parametric Enclosure Planner
Using reviewed design intent and a verified reference measurement, generate a structured enclosure assembly for Three.js. Output separate component nodes, material profiles, mesh selection, panel boundaries, connection candidates, door cutouts and drainage. No fabricated dimensions. All members must pass geometric plausibility checks against the field-confirmed envelope. Roof type Mansard/flat/gable applies only when a new roof is within scope; existing covered porch infill does not get a new roof.

### Prompt D — Field QA and Deliverables
Compare estimated values and their evidence with the seller's verified measurements. Flag differences, incomplete fascia/anchor data and engineering checks. Never treat an AI-estimated value as a field measurement. Gate takeoff and proposal approval behind documented project review. Produce 3D, conceptual drawings and commercial documents from the **same approved geometry** and flag all unverified details.

## Required machine-readable contract

```json
{
  "schemaVersion": "site-scene-v1",
  "projectId": "same-project-id",
  "evidencePhotoIds": ["photo-id"],
  "existingHouse": {
    "source": "ai-suggested",
    "status": "needs-human-review",
    "nodes": [],
    "unknownConditions": []
  },
  "screenEnclosure": {
    "source": "seller-approved-brief",
    "status": "conceptual",
    "nodes": [],
    "separateTakeoff": true
  },
  "measurements": [
    {
      "key": "attachmentHeight",
      "feet": null,
      "status": "unknown",
      "scaleSource": null,
      "fieldVerified": false
    }
  ],
  "qa": {"photoMatchReviewed": false, "engineeringApproved": false}
}
```

This is a **target contract**, not yet produced or consumed by the current Worker.

## Acceptance / quality gate

- Test with **two unrelated houses**: images, scene nodes, measurements and design answers must not cross between projects.
- Test porch-infill for the 22743 SW 56th Ave example: existing three masonry arches preserved, only fitted screen elements new, existing roof unchanged.
- For a separate pool enclosure house, generate new roof/profile geometry connected to *its own* fascia/grade, not cloned from the porch house.
- Reference photo overlay should reproduce visible openings without user correcting large orientation/perspective mistakes.
- A diagonal image can contribute context, but insufficient camera/scale evidence cannot certify dimensions.
- Engine output remains editable after field measurement changes and supports drawing/takeoff consistency.
- No automatic live deployment, supplier order, fabricated seal, false permit status or secret leakage.

## Status as of this branch

**Implemented here:** project-conditioned designer question flow, answer history stored per project, evidenced arch awareness, photo selection recommending 4+1 aerial, zero fake dimensions/approvals, dedicated iPhone route, automated tests.

**Not yet implemented:** generative site scene graph, camera calibration / reconstruction across views, real dynamic Gemini question generation, estimated dimensions from calibrated imagery, detailed site 3D like the hand-authored Claude sample, and automatic 11×17 fabrication/engineering document generation.
