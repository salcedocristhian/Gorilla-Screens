# Gorilla AI Vision: isolated experimental GitHub integration

**Status:** Not deployed; PR #9 only. Existing main and published Gorilla remain unchanged.

## What was added

- An **AI Vision** tab inside Gorilla Studio on this experimental branch. It selects 1–5 photos from the CURRENT project, excludes render images, resizes photos on-device, and requests explicit owner/operator consent before any network transmission.
- A configurable HTTPS gateway URL (no API keys in web code). When not configured, analysis stays disabled and photos stay on the phone.
- A Cloudflare Worker gateway that verifies Cloudflare Access signatures, audience and allowed email, checks CORS, validates image payloads, and forwards to a protected OpenAI-compatible vision endpoint.
- JSON observations presented as an **unverified draft**. No geometry changes, purchase-order approval, material recalculation, or permit assertions are caused by AI output.
- Automated Node / browser tests with simulated upstream responses. These do NOT establish live inference with an external model.

## Option A — no local computer: hosted vision provider

Use a provider with a compatible image-input chat completions endpoint (for example Google Gemini's OpenAI-compatible API where available). This is the easiest way to begin a mobile pilot. Provider free tiers, terms and rate limits are separate; no guarantee of unlimited use or free Claude access.

Set Worker configuration:
- VISION_UPSTREAM_URL: provider HTTPS chat-completions endpoint.
- VISION_UPSTREAM_KEY: provider API key as a Worker **secret**.
- VISION_MODEL: image-capable model ID (confirm current ID with provider).

## Option B — FreeLLMAPI router

FreeLLMAPI is a self-hosted Node/SQLite server. GitHub Pages cannot execute it. Run it on a private hosted server/container with a configured vision-capable provider; do NOT expose its dashboard on the open internet. Protect the HTTPS upstream with Cloudflare Access or equivalent.

Worker configuration:
- FREELLMAPI_URL: protected HTTPS endpoint ending in /v1/chat/completions.
- FREELLMAPI_API_KEY: FreeLLMAPI's unified API key as a Worker **secret**.
- FREELLMAPI_MODEL: a known image-capable model/profile, not an assumed text-only automatic selection.
- UPSTREAM_ACCESS_CLIENT_ID and UPSTREAM_ACCESS_CLIENT_SECRET: optional private Access service credentials.

If Option A vars are present, they take priority over Option B vars.

## Steps needed to activate

1. Create a Cloudflare account and deploy the Worker from experiments/freellmapi/cloudflare-worker.mjs using the provided wrangler.toml. Keep workers_dev disabled; configure a controlled HTTPS route.
2. Protect its route with a Cloudflare Access application limited to the test operator. Add the Access application Audience.
3. Configure these Worker environment variables: CF_ACCESS_TEAM_DOMAIN (example yourteam.cloudflareaccess.com), CF_ACCESS_AUD, ALLOWED_EMAILS (comma-separated operator emails), GORILLA_ALLOWED_ORIGIN (https://salcedocristhian.github.io).
4. Add all provider keys and upstream Access service credentials as Cloudflare **secrets**, never into GitHub or frontend settings.
5. Ensure Cloudflare Access authentication cookies/JWT are available to the Worker's request. Cross-origin cookie restrictions may block GitHub Pages on some mobile browsers; a later same-origin deployment solves that. This has not yet been field tested.
6. In the branch version of Gorilla, open Studio → AI Vision, configure only the HTTPS Worker URL ending in /analyze, select photos and consent before analysis.
7. Review the unverified observations; check that the real 3D proposal, quantities and verified measurements remain unchanged.

**No live deployment is possible from a GitHub commit alone.** The user must connect a Cloudflare account, configure provider credentials, and authorize an actual deployment. This experiment is neither a substitute for field dimensions nor a structural engineering review.

**Privacy:** Site photographs may depict private homes. Only submit images with permission and subject to the chosen provider's retention policy. Never commit live photos or API keys to a public repository.

See the official upstream project: https://github.com/tashfeenahmed/freellmapi and API documentation: https://github.com/tashfeenahmed/freellmapi/blob/main/docs/en/api/01-rest-api.md

## QA

- tests/test_freellmapi_worker.mjs — signed Access JWT, allowed-origin, input validation, private upstream, draft-only response.
- tests/test_v17_browser.mjs — mobile layout, opt-in, configured/not-configured modes, mock inference, and no mutation to design measurements.
- All provider responses and auth checks in CI are simulated. Live testing with a configured provider is still pending.
