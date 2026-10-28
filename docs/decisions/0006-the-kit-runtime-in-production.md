# 0006 · The kit runtime runs in production, behind kit.soyrocoto.com/api
**Date:** 2026-09-04 · **Status:** accepted

## Context
The kit at kit.soyrocoto.com is a static page. Four things it must do need a secret — document
extraction, Google Places, Deepgram, Twilio — and a static page can hold none of them. Peter's line
was «i want it all self contained in here, same as twilio».

## Decision
**`mock-api/` is a production service.** It runs on the box, behind the kit's own origin at `/api`,
holding the real provider keys and implementing exactly the contract the kit reads. It is deployed
by `mock-api/deploy/` (historical reference outside this export): a systemd unit, a Caddy snippet with its patcher,
`deploy.sh`, and `with-env.py`, which hands the process only the names in `env-names.txt`. **It
never fabricates**: a missing key is `missing` in `/api/health` and a named 503 on the endpoint. It
carries no tenant product logic (decision [0005](0005-one-codebase-two-builds.md)).

## Consequences
The design build is real: the kit's drives measure real provider latency, which is where the floors
in decision [0003](0003-document-reading-by-anthropic-vision.md) come from. The keys on that box are
live, so CORS is an allow-list and the logs run through one redactor. The directory name is
historical; the product's own service is `backend/` (historical reference outside this export).

## Source
`mock-api/README.md` (historical reference outside this export) · `mock-api/deploy/` (historical reference outside this export) ·
THE-RUNTIME-SPEC (historical reference outside this export) RUN-10, proven from the box 2026-09-04 · `docs/FEED-IA.md` (historical reference outside this export) §196.5, §196.6.
