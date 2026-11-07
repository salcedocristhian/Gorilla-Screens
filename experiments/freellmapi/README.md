# Experimental AI Vision adapter — NOT production

This branch is isolated from main. It does not expose a public AI endpoint or modify any approved enclosure dimensions.

## Why a local adapter?
FreeLLMAPI is a third-party local model router, not an Anthropic API credit grant. Its free provider quotas vary, and some models do not support image inputs. Never put provider credentials or an unrestricted local router on GitHub Pages.

## Local test workflow
1. Install and run FreeLLMAPI on your own trusted computer, following its upstream documentation. Configure an **image-capable** provider and check its current terms and limits.
2. Run the experimental Node proxy with `GORILLA_AI_UPSTREAM` set to the router's **local** OpenAI-compatible chat-completions endpoint (for example `http://127.0.0.1:8000/v1/chat/completions`, only if that is the endpoint your installation actually exposes), `GORILLA_AI_MODEL` set to the configured vision model, and `GORILLA_AI_TOKEN` set to a random secret.
3. The proxy listens on `127.0.0.1:8789` and requires `Authorization: Bearer <token>`. It rejects remote connections, unexpected paths, oversized bodies and non-image requests. It is for **desktop local testing only**; mobile devices cannot reach it directly.
4. Send 1–5 project-owned images as base64 data URLs, with explicit operator consent. The response is a **draft interpretation** only. Review fascia, openings, roof and dimensions manually in Gorilla.
5. For iPhone/Android or a public Gorilla integration, build a separate authenticated backend with per-user access control, quotas, consent, and data-retention policies. Do not publish this local proxy to the internet.

The AI is not allowed to approve plans, alter takeoff, set verified dimensions, or issue purchase orders. Model output is untrusted and must be reviewed before any geometry change.
