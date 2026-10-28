# Architecture

The browser candidate is a shop workflow, backed by three deliberately different forms of state. The authored sample source and local drafts support immediate inspection; account identity/history live in an encrypted WhatsApp service; collection obligations and receipts live in a separate persistent ledger.

```text
Bodega browser ── same-origin /api ── prototype API
       │                                │
       │                                ├─ signed WhatsApp intake / OTP / tester enrollment
       │                                └─ fixed-route bridge → encrypted WhatsApp proof service → Meta
       │
       └─ collection client → Copper native Cedar service → encrypted SQLite ledger
                                              ├─ sample bank
                                              ├─ commissioned Prometeo transport
                                              └─ optional reviewed fiscal transport

Bundled Android UI → authenticated native API transport → the same prototype API
      └─ Auth Tab / Custom Tab → Meta → HTTPS callback + one-use code + PKCE → same-phone session
```

## Code map

| Location | Responsibility |
| --- | --- |
| `app/src/prototypes/bodega-pay-later/App.tsx` | Four-area route registry, onboarding/admin/pay routes and session gate |
| `.../source/index.ts` | One chat interface; live account source or labelled authored sample |
| `.../history/read.ts`, `rank.ts` | Interpret evidence, rank candidates and preserve review boundaries |
| `.../stage.ts`, `start/session.ts`, `start/joining.ts` | Browser progression, account standing, referrals and server state |
| `.../cast.ts`, `cast-cedar.ts`, `money-store.ts`, `money-api.ts`, `record.ts` | Shop models, collection client and transparent trade indicators |
| `.../mobile/` | Native transport, encrypted session/pending handoff, drafts and onboarding |
| `mock-api/app/bodega*.py` | Durable intake/session/referral state, provider message custody, OTP and tester enrollment |
| `mock-api/app/cedar_whatsapp.py` | Allowlisted bridge routes and exact upstream origin/cookie forwarding |
| `app/src/prototypes/cedar/connections/proof/` | Meta code exchange, verified routing, opaque browser sessions, encrypted account stores, signed event projection and reconciliation |
| `app/src/prototypes/copper/runtime/cedar_service.py` | Actual persistent collection HTTP API; inspect its `/docs` OpenAPI locally |
| `.../cedar_store.py`, `cedar_amounts.py` | Encrypted durable ledger, immutable quote reservations, matching and conservation |
| `.../providers/` | Explicit provider contracts and injected-HTTP transports |
| `app/src/rocoto`, `app/src/kit`, `app/src/scenarios`, `.../cedar/` | Original shared UI/model/printing dependency closure |
| `app/android/` | Gradle wrapper, native plugins, secure storage, verified return-link handling and tests |

The full original Cedar dependency tree is retained because Bodega imports its document, catalogue, paper, geometry, components and model helpers. Copying only the Bodega directory breaks those real imports. The browser entry stays Bodega's original provider chain; the release build selects its entry directly rather than the later ERP entry.

## Identity and history

An unbound browser session can read public connection configuration. Meta returns an authorization code; the server exchanges it immediately and independently checks the exact WABA and phone before rotating into an account-bound session. Cookies are secure, host-only and HttpOnly; stores persist opaque token hashes and encrypted bindings. Additional accounts get separate directories.

Signed history/contact chunks join by Meta's opaque user identity, preserve message provenance and distinguish historical imports from incoming work. Provider progress and local projection progress have separate counters. Accepted one-time history work remains recorded across restart; ambiguous outcomes require reconciliation before a repeat request. Media placeholders remain placeholders until media custody is implemented.

Trade interpretation proposes meaning. A conversation alone cannot establish a complete ledger. The browser's confirmation layer and source pointers make that distinction inspectable.

## Collections

Each browser workspace has its own bearer capability. Buyer links reveal one request under an opaque capability. Operator actions use a separate token. The service stores principal, quoted rounding, partial receipts, source provenance, account binding and remaining balance durably.

The allocator searches 0–99 cents above remaining principal. Every issued quote remains reserved, including superseded and paid quotes. Matching uses exact account/currency plus reference or the currently unique exact amount. Exhaustion requires a reference. Late evidence therefore retains the original request identity, and uncertain evidence stays reviewable.

Prometeo credentials/session custody and fiscal submission/recovery are optional transports. Frozen fiscal identity survives uncertain submission; querying the same identity precedes another issue attempt. The Bodega UI keeps generic sales, with fiscal activation documented separately.

## Local state and security

`tools/dev.py` launches loopback processes with a minimal environment. Default launch creates private `.local/synthetic/`, generates collection encryption/operator secrets and enables an explicitly sample bank. Provider mode uses separate `.local/connected/` state and a recipient-owned mode-0600 environment file. The runner preserves existing encryption keys. Back up keys with the corresponding encrypted store.

Production operations, customer records, uploaded media, native signing keys and original deployment/account files are outside this source export. The maintained PostgreSQL backend belongs to the sibling ERP source; these advanced Bodega services use their own SQLite stores rather than a fabricated PostgreSQL replacement.

## Verification

`tools/verify.py` runs the preserved Bodega model suites, prototype API contracts, encrypted WhatsApp service tests and collection tests in isolated temporary state. Provider transports are injected in those suites. `tools/first-result.py` covers real local HTTP/browser behavior. Native web compilation and physical-device/provider acceptance are separate checks in [status](status.md).
