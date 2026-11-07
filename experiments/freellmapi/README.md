# Gorilla × FreeLLMAPI — Private vision pilot

**Experimental branch ONLY.** Does not change the public Gorilla app on main or GitHub Pages.

## Purpose
Analyze authorized property photos as context for designing the SCREEN ENCLOSURE.
The house is a reference, not the product. This experiment asks a free-tier
vision provider for observations, not measured geometry or engineered plans.

This is NOT a way to use Claude Sonnet for free. FreeLLMAPI routes requests to
free tiers of providers you connect and configure. Availability and limits vary.

## Features
- Load four existing-condition Boca Raton photos from the demo folder.
  Excludes the proposed render (02-render-propuesto.jpg) to avoid contaminating
  observations about the ACTUAL house.
- Optionally upload 1-5 personally authorized photos (JPG/PNG/WebP).
- Compress images locally, then require explicit permission to send them.
- Local gateway sends OpenAI-compatible vision requests to FreeLLMAPI.
- Display structured observations, uncertain features, relevant screen-enclosure
  recommendations and field measurements needed.
- Download a draft JSON for review. Never automatically modify the saved project.
- Optional conceptual 3D preview via existing Gorilla Three.js, ONLY with manually
  entered width/depth/height. AI does not certify or infer exact dimensions.
- No user data written to disk by the experimental server.

## Set up on a computer (Windows/Mac/Linux)

1. Install FreeLLMAPI separately from the author's GitHub page:
   https://github.com/tashfeenahmed/freellmapi
   Follow the official installation documentation. Do not run unreviewed installer scripts.
2. Start it on your own computer, typically on port 3001.
3. Configure at least one provider with a vision-capable free-tier model and
   copy the router's unified API key. Providers require their own signup/keys.
4. Clone Gorilla and check out the branch experiment/freellmapi-vision-pilot.
5. Use Node.js 20+. Set the unified key as a LOCAL environment variable, not
   in the repository.

   On macOS/Linux:

       export FREELLMAPI_API_KEY='your-router-unified-key'
       node experiments/freellmapi/server.mjs

   On Windows PowerShell:

       $env:FREELLMAPI_API_KEY='your-router-unified-key'
       node experiments/freellmapi/server.mjs

6. On THAT computer open:
   http://127.0.0.1:8788/experiments/freellmapi/index.html
7. Click Usar muestra de Boca Raton, review the four real photos and
   unverified sample measurements, check the photo-sharing permission,
   then click Analyze with FreeLLMAPI.
8. Review the draft and use conceptual preview/JSON export as appropriate.

The router uses the model name "auto". Per the upstream API docs, requests
containing images restrict selection to vision-capable connected models.

## Important phone restriction
The pilot listens ONLY on 127.0.0.1 and is NOT reachable from a phone on
a different device. Nor is it currently hosted on the public GitHub Pages app.
Do NOT open router ports, expose the admin dashboard or paste the router key
into public client JavaScript to bypass this restriction.

For an Android/iPhone field pilot, a future authenticated private staging
gateway and controlled credential handling are required. FreeLLMAPI is
self-hosted and intended for individual experimentation, not a public
multi-user production service. Upstream has an experimental Android Termux
installation guide, but that is not our recommended field architecture.

## Privacy and safeguards
- Gateway binds localhost only, checks Host and Origin, no permissive CORS.
- Unified key is in the local environment, never in browser or Git.
- Images are reduced in the browser; max 5 images of 1 MB compressed each.
- No project client names, budgets, property addresses or field records are
  sent automatically. Provider processes only the photos selected/authorized.
- The configured external provider may retain images per its separate terms.
- Model output is validated JSON text, NEVER executable JS.
- No construction approval, fabrication grade takeoff or automatic ordering.

## Testing
Run Node smoke tests with a mock provider and no real API credits:

    node tests/test_freellmapi.mjs

The experiment should only be considered ready for public Gorilla integration
after field reviews, safety tests, authentication, cost controls and approval UX.
