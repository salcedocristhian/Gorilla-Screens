# Gorilla V17 — One-capture AI Vision (pilot / gated rollout)

## Goal and scope

In V17 **Fotos**, a salesperson chooses or captures up to five images of ONE house once.
The browser resizes JPEG copies, stores them in the active project's IndexedDB, and selects the new photo IDs. On **Analizar fotos con IA**, it reuses those same saved blobs via multipart POST to a **separate** authenticated Cloudflare Worker. The Worker sends the five images as one Gemini request and returns a JSON report. V17 validates it and saves it only under that project's `aiVision` record. Studio displays a read-only site reference. No dimension, approved drawing, roof geometry, bill of materials, quote or order is changed by Gemini.

**Nothing here modifies the existing `gorilla-ai-vision` Worker, the Cloudflare static preview, or `main`.** Existing manual JSON import remains available under Advanced as a fallback.

## Why a separate Worker

The old `gorilla-ai-vision` pilot was designed for same-origin `/pilot` requests. A cross-origin `fetch` from `previewfixed.*.workers.dev` cannot safely call that endpoint unchanged. Simply setting `Access-Control-Allow-Origin: *` would expose a Gemini-billed API. This separate bridge requires a strong pilot token, an exact origin allowlist, a Cloudflare rate-limit binding, server-side Gemini credentials and strict upload validation.

### Bridge deployment (requires authorized Cloudflare access)

Files: `cloudflare/gorilla-ai-bridge.mjs`, `cloudflare/wrangler.bridge.json`. Requires Wrangler v4.36+ and access to the user's Cloudflare account.

```bash
npx wrangler@latest deploy --config cloudflare/wrangler.bridge.json
npx wrangler@latest secret put GEMINI_API_KEY --config cloudflare/wrangler.bridge.json
npx wrangler@latest secret put GORILLA_PILOT_TOKEN --config cloudflare/wrangler.bridge.json
npx wrangler@latest secret put STUDIO_ALLOWED_ORIGINS --config cloudflare/wrangler.bridge.json
npx wrangler@latest secret put GEMINI_MODEL --config cloudflare/wrangler.bridge.json
```

- `GORILLA_PILOT_TOKEN`: random at least 32 characters, **never commit** or post in chat, never put in localStorage.
- `STUDIO_ALLOWED_ORIGINS`: exactly `https://previewfixed.salcedo-cristhian-2020.workers.dev` while testing this preview. Multiple exact origins may be comma-separated once approved.
- `GEMINI_MODEL`: the currently available Gemini image-capable model ID for the account; verify against the provider. The name printed in a previous report is not proof a new public API model ID is still available.
- `GEMINI_API_KEY`: a secret in Cloudflare; **never in the V17 static files**.
- Wrangler config creates an approximate **5 requests / 60 seconds / Cloudflare location** `AI_RATE_LIMIT` binding. It is not a strict global account-spend cap. For production, add authenticated user accounts, role/project authorization, consent logging, strict quotas (Durable Objects), monitoring, retention and a customer privacy policy.
- The bridge path is `/api/analyze`; health check at `/health`. The configured browser URL is `https://gorilla-studio-ai-bridge.salcedo-cristhian-2020.workers.dev/api/analyze`. If the account does not assign this hostname, adjust the deployment configuration and the browser's endpoint setting, with careful allowlisting.

### Preview deployment

The V17 preview stays in its own static Worker. Deploy **only** the frontend files as a ZIP if desired; do not overwrite the existing Gemini Worker. The frontend shows a pilot credential field that lives only in browser memory, and an Advanced panel for the endpoint (URL only). Until the separate bridge and secrets are configured, analysis will show a friendly connection/configuration error rather than silently sending photos to the old unsecured endpoint.

### Mobile acceptance

1. Create project A, capture three photos of the masonry-arched porch using the one capture selector. Ensure they appear as `site` photos, already checked.
2. Enter pilot token once, confirm owner consent, click **Analizar fotos con IA**. Confirm a single request carries exactly three photos, the JSON is stored with `projectId=A`, status `draft-needs-human-review`, and Studio shows the new evidence without changing measured geometry or takeoff.
3. Create project B, capture five pool enclosure photos, analyze. Verify B photos/results never appear in A.
4. Attempt cross-project bindings, invalid bearer token and an unlisted origin: fail before Gemini is charged.
5. Refresh/offline: photos/results remain in IndexedDB. Pilot access token is cleared on reload, and no API analysis is attempted offline.
6. Verify the old V17 mobile WebGL, plans PDF, cutting-plan CSV and approval invalidation tests.
7. Test both Android Chrome and iPhone Safari manually; the automated browser test emulates mobile size but is not a native phone test.

## Important restrictions

Never present inferred spans, fascia elevation, anchor types or structural suitability as confirmed field measurements. The model is a visual reference and proposed enclosure geometry only. The customer owns the photos and should authorize third-party image processing before starting. Do not use production/private resident photos during an unprotected public preview.
