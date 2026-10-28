# Android waitlist onboarding

22 September 2026. Source brief: FEED-IA (historical reference outside this export).
Package `com.soyrocoto.app`, candidate version code 9 / 0.6.1. Target: locally bundled Android
customer app and the checkout-owned development prototype API. Production business runtime and
its agent harness remain separate. The customer app ends at the waitlist.

## Commitment ladder

The first commitment is a WhatsApp message. A referral URL opens `https://soyrocoto.com/?ref=CODE`
(or its English `/en/` equivalent). The site's join action prepares a Rocoto WhatsApp message
carrying the referral; the person sends it. Only a trusted signed inbound creates membership.
A link click or app download never creates a verified identity.

The deterministic chat immediately returns the actual waitlist position, then collects personal
name, business name and Google Play testing email. The referral owner and sender are separate
records. A referral can attribute once; retries and webhook redelivery preserve the original place.
The first chat asks for the next small commitment, not referrals.

The second commitment is installing and signing into the app. Google Play tester registration,
eligibility, opt-in and installation are separate states. A collected email means requested;
only verified membership makes the person eligible. The public Play opt-in link becomes available
once the owned track is commissioned. Direct APK delivery remains a development distribution path.

The app asks the same phone number and verifies a WhatsApp authentication code. It loads the
personal and business names already collected in chat, asks the remaining business type and
address questions, and connects WhatsApp Business through Meta last. Successful connection and
profile completion unlock the final waitlist/referral home.

## Visual contract

The approved fishmonger artwork scales with width and anchors to the bottom. Taller phones reveal
more tiled wall. The actual black Rocoto mark sits tightly beside the Fraunces wordmark. The only
welcome action is Peter's literal `Get started`.

Peter's Hinge references define the entry grammar: paper surface, large black serif question,
an outlined step icon and progress dots, underlined phone/name fields, six underlined code positions,
and a circular forward chevron within the keyboard's visual viewport. One semantic code input
supports full-code paste and autofill. Body copy uses Inter. Colour comes from the Rocoto theme.

Known personal and business names are hydrated from the verified account. Business type offers three large choices: Proveedor, Bodega and Restaurante.
Their canonical values are supplier, bodega and restaurant; both retained sells_to_* values map
to supplier. The business name is a separate underlined question with a plain back chevron. Address uses real suggestions and selected-place confirmation.
A successful server write precedes advance. Every interactive control remains reachable at
320×568 and with the keyboard open. The waitlist's complete business pass retains its height while
the surrounding page scrolls.

## Identity and authorization

The signed inbound sender owns the waitlist contact. `/mobile/otp/start` takes normalized phone
and a random client-held secret, sends only a configured approved authentication template, and
returns an opaque expiring attempt. It exposes no account existence result. `/mobile/otp/redeem`
requires attempt, client secret and code; bounded failures and an atomic single-use update precede
the native bearer. Digests are held server-side; codes and secrets stay out of logs and URLs.

Android starts Meta's official WhatsApp OTP SDK handshake before requesting delivery. Its exported
receiver and one-tap activity validate the received handshake through that SDK. Native UUID/code
state and the JS attempt record use AndroidKeyStore-backed encryption. A code-free event wakes
the app; foreground/startup can consume a retained code after process death. The same server
redemption handles zero-tap, one-tap and manual entry. A missing provider configuration produces
an honest retry/contact state, never a locally generated successful login.

The phone bearer authorizes only the person's own waitlist and profile routes. Meta connection
proof remains distinct. The 0.6 app sends its bearer to `/mobile/session/start`, binding
`expected_phone`. Legacy 0.5.1 anonymous starts remain compatible and still require a real Meta
connection plus browser approval and PKCE; a presented bearer is always validated.
The app starts a fresh PKCE browser handoff only at the final connection step or explicit retry.
Approval requires a verified browser Meta connection with the same phone. Anonymous redemption requires
attempt, verifier and one-use callback code. For phone-first attempts, `/mobile/session/status`
accepts the current phone bearer and PKCE verifier and reports approval only when this exact
attempt was approved by the same verified browser phone. It returns neither a code nor a new
bearer. This recovers a lost app-link callback without widening anonymous authentication. The fixed verified HTTPS callback is
`https://demo.soyrocoto.com/bodega-app/auth`. Custom schemes and unrelated attempts grant no access.

The regular Auth Tab/Custom Tab uses ordinary browser cookies. Rocoto cannot read Meta's page,
copy its pairing code or recreate provider page state after browser process death. Embedded Signup
v4 is selected by verified configuration `4618748161700706` with Cloud API products. Session logging
format `sessionInfoVersion: "3"` is a separate setting. Provider consent, code entry and history
sharing remain Meta's own screens. Account mismatch fails closed.

The Android launcher and return notification use a routing activity that reveals the existing
task instead of clearing the Auth Tab above the app. Before opening Meta, Rocoto requests
notification permission and creates an ongoing return shortcut until the attempt expires.
This reminder says to continue the connection; it does not assert that WhatsApp has connected.
Closing the browser clears the reminder and checks the same pending attempt. A confirmed result
clears the reminder, displays the success tick, and continues the saved onboarding position.

During the native browser handoff, foreground recovery reads the existing proof session while
Meta's SDK is active. Only a durable connection whose provider setup is `ready` may finish the
handoff. This recovers a lost response after a successful provider write. Receiving Meta's
authorization code alone is insufficient: the FINISH event must also identify the WhatsApp
assets. A page closed before FINISH cannot be completed by guessing those identifiers. The
existing browser document remains the route back to that provider step; a destroyed document
has no guaranteed resume API.

## Completion and immediate value

Native onboarding requests and displays the waitlist only after the server records completion
and all profile answers are present. A newly confirmed connection shows a centered success tick
before advancing. Back preserves the pending attempt.

The final home is a real business pass: saved business details, confirmed WhatsApp connection and
the account's reserved waitlist position. It carries the current public launch offer—three loans
at 0% interest, up to S/500 each, seven days to repay—subject to assessment and approval when credit
launches. This is an offer under the [published terms](https://soyrocoto.com/terms#early-offer),
not a granted loan or an inference from legacy `coveredPurchases` counters.

Referral sharing appears here, after the greater commitment. The invitation explains Rocoto and
the offer, includes the server-issued website referral link exactly once, and links terms. The
server advances the inviter once per valid attributed person. Opening a share sheet establishes
neither a send nor a referral. Foreground refresh reloads real counts and the recorded connection proof. The current prototype
retains historical `connection_verified_at`; provider disconnect events do not yet clear that field.
A live lifecycle adapter is required before treating it as ongoing connection health or exposing
private message-history actions. The home labels the historical verification accordingly.

Saved profile details and a verified connection are immediate account value. Message-history
analysis, credit assessment, proactive advice and the employee agent are separate later capabilities;
this candidate never manufactures those results.

## Proof and release

Required: repository gates and tests; signed-inbound/deduplication/referral tests; OTP expiry,
wrong secret/code, rate limits and replay tests; pre-Meta vs connected route authority; same-phone
Meta binding; native SDK compilation; the native account browser drive with an explicitly mocked
bridge/provider; phone, keyboard-sized and desktop visual inspection.

Physical delivery, WhatsApp Business zero-tap, Play signing identity, real Meta completion and
real Play enrollment require their own provider/device evidence. Provider provisioning and
release readiness are recorded separately from the compiled candidate. Keys stay outside Git.
The API origin remains `https://demo.soyrocoto.com` for this development candidate.
