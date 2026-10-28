# Own-account setup

Begin with the [synthetic shop](first-result.md). Each external rail uses your accounts, grants, callback origin and private state. Configuration presence records setup; the actual authenticated response/device run establishes acceptance.

`tools/configure.py` collects public identifiers and credentials through separate inputs. It makes an ignored mode-0600 `.local/providers.env`, preserves existing values, and performs local file/configuration operations only. The file is parsed as dotenv, rather than executed as shell code.

```sh
.venv/bin/python tools/configure.py --origin https://shop.example.com \
  --package-id com.example.shop --whatsapp-number +12025550100
.venv/bin/python tools/configure.py --set CEDAR_PROOF_APP_ID YOUR_META_APP_ID
.venv/bin/python tools/configure.py --set CEDAR_PROOF_CONFIG_ID YOUR_LOGIN_CONFIGURATION_ID
.venv/bin/python tools/configure.py --secret CEDAR_PROOF_APP_SECRET
make doctor
```

The example domain, package and reserved fictional number are placeholders; supply your actual owned destinations. The helper updates public native origin, bot link, Android callback hosts and application identifier together. Private keys stay outside the source and build output. The doctor's report contains variable names and presence states.

## Connection and effect map

| Connection | Own configuration | Permitted external effect | Activation proof |
| --- | --- | --- | --- |
| Meta Business coexistence | Meta app, Login for Business configuration, app secret, allowed origin/redirects and webhook | Code exchange, verified WABA/phone access, subscription and explicitly consented eligible history import | Exact account/phone verified; signed chunks projected and counted |
| WhatsApp sender | `WA_CLOUD_TOKEN`, `WA_CLOUD_PHONE_ID`; exact receiving phone and webhook app/verify secrets | Approved message/template inside its applicable policy/window | Provider acceptance ID and separately observed delivery |
| WhatsApp OTP | Approved authentication template/language, `BODEGA_OTP_DIGEST_KEY`, installed app/certificate association | Phone authentication via official SDK, one-tap or manual fallback | Real same-phone redemption on an eligible physical device |
| Google/Play tester enrollment | Own Group, delegated administrator, service account JSON, package and test-track opt-in URL | Exact active membership in the configured tester group | Group eligibility, Play opt-in and installation recorded separately |
| Address search/maps | `GOOGLE_PLACES_API_KEY`; optional referrer/API-restricted browser map key | Address lookup / configured map rendering | Actual API response plus recipient-owned quota limits |
| Order parsing | One of `ANTHROPIC_API_KEY` or `GEMINI_API_KEY`; source-budget/model configuration | Bounded text-to-order request | Model/provider identity and reviewed extracted lines |
| Prometeo | Seller-specific environment/key, bank login/challenge and selected receiving account | Read authenticated account/movement evidence and bounded monitoring | Observed real seller transfer with exact reference/account coverage |
| NubeFact/SUNAT | Seller-specific endpoint/token/RUC, reviewed series/number and activation | Reviewed fiscal issue or query under durable operation identity | Accepted real document and separate payment proof |

## Meta service

The original helper `app/src/prototypes/cedar/connections/configure.py` uses hidden input and generates encryption/verification material. Its recipient defaults are empty. Keep state outside the checkout in an absolute private directory, and preserve the encryption key with the store. The original proof runner accepts a private dotenv file and preflight reports names only:

```sh
.venv/bin/python app/src/prototypes/cedar/connections/configure.py
.venv/bin/python app/src/prototypes/cedar/connections/proof/run.py \
  --env-file .env.cedar-connections.local --preflight
.venv/bin/python app/src/prototypes/cedar/connections/proof/run.py \
  --env-file .env.cedar-connections.local --port 18243
```

The approved HTTPS origin fronts the browser, API and same-origin bridge. Set `SHOP_WHATSAPP_UPSTREAM=http://127.0.0.1:18243`, `SHOP_WHATSAPP_ORIGIN` to that service's declared HTTPS origin and `CEDAR_WHATSAPP_BRIDGE_ENABLED=true` in your private API configuration. `SHOP_PUBLIC_ORIGIN` and `ROCOTO_RUNTIME_PUBLIC_BASE` identify your actual browser/API origin. Server cookies retain Secure/HttpOnly/host-only semantics; TLS is part of the real account flow.

The default `make dev` keeps background outbound behavior paused. `tools/dev.py --providers` reads your private API configuration into separate connected state. Commission a specific operation before enabling its sender/buddy loop. The source sender uses exact phone checks, deduplication, service-window checks and daily limits; your provider account and deployment still own usage limits and permitted effects.

## Tester account custody

For a Google service-account file, use a private file owned by your user, mode 0600:

```sh
.venv/bin/python tools/configure.py --secret-file \
  BODEGA_PLAY_SERVICE_ACCOUNT_JSON /absolute/private/service-account.json
```

Configure its own domain-wide delegation and exact Group membership scope. The runtime checks the configured destination and exact active member before exposing tester eligibility. Upload/signing/Play grants belong to your app; the source's historical release receipts confer neither.

## Bank and fiscal activation

The collection service's native initializer generates its own operator/encryption secrets. The loopback sample runner keeps a separate sample store. For a connected deployment, use its explicit private `runtime init --config ... --state-dir ... --public-origin ...` path and the provider/operator endpoints described in [Copper's contract](../app/src/prototypes/copper/SPEC.md). Secrets and seller QR images remain in private runtime state.

`COPPER_ALLOW_LIVE=0` is the initial gate. Commission the exact seller, bank, account/currency, receiving QR and intended operation before enabling live access. Sample/manual and authenticated bank evidence retain their provenance. Fiscal number reservation, submission and query recovery are independent of the collection-page view.
