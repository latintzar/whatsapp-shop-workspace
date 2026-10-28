# WhatsApp webview connection experiment

Target: bodega development. The direct entry is
`https://demo.soyrocoto.com/api/bodega/connection-test/start`; the SDK comparison is
`https://demo.soyrocoto.com/bodega-pay-later/?connection-test=1`.
Peter’s instructions are preserved in FEED-IA §269 (historical reference outside this export);
[issue 165](https://github.com/Rocoto-Labs/rocoto/issues/165) tracks the experiment.
The company [platform study](https://github.com/Rocoto-Labs/company/blob/main/notes/bodega-signup-connect-flow-2026-09/whatsapp-webview-study-2026-09-22.md) separates documented support from phone observations.

## Entry topology

Peter’s preferred journey qualifies the business in chat and opens Meta itself in the retained
WhatsApp webview. The direct test entry redirects in the same window to Facebook Login for
Business, using the existing Embedded Signup configuration and Coexistence extras. The pieces
are documented separately; their combined behavior inside WhatsApp is what this experiment tests.

Peter verified `https://demo.soyrocoto.com/` in the app’s allowed OAuth return URIs and enabled
Embedded browser OAuth login on 22 September. The public return stays on the declared development
origin. The shared connection provider keeps credential custody behind the existing loopback
bridge; its separate historical preview hostname is not part of this customer journey.

The dedicated attempt cookie and one-use server state bind the return to the browser. Reopening
the same message button reuses the pending attempt and its encrypted original Meta dialog URL.
It preserves the original expiry; a longer-lived diagnostic cookie distinguishes an expired
attempt from the first visit. Processing and terminal attempts open their result. A new attempt
requires an explicit restart POST. If the browser discards all cookies, correlation is unavailable;
that is a phone-test failure to record, not evidence of automatic recovery. The root
entry removes the OAuth query before loading application analytics, sends the code immediately to
the private receiver, and opens a clean bodega result URL. The receiver exchanges the code with
the exact same return URI and discards the resulting token. **Authorization received** is the
result of this experiment; a new account connection/history import is a separate operation.
Peter’s existing connection and signup records remain intact.

The SDK comparison remains available to observe the alternative popup topology and its richer
page/SDK lifecycle reports. Hosted Embedded Signup’s documented landing also has a launch button
and restricted customization; it is not evidence of a same-window Coexistence journey.

## SDK comparison: Meta authorization

The isolated comparison entry opens the existing Meta SDK and connection service even when the browser already
holds a connection. A new successful attempt requires the controller’s completion callback. The
initial account state is a separate baseline. This entry leaves the bodega signup, queue and referral
records alone, and requests no new history import. Existing provider authorization can shorten
Meta’s screens; record the screens actually offered.

A normal URL-button message is the launch mechanism to investigate. Actual WhatsApp-native
container availability and its return behavior require observation on Peter’s WhatsApp Business
phone. A working website, a clicked URL, or desktop browser QA alone establishes none of them.
Record WhatsApp Business version, phone OS/version and the container controls Peter actually sees.

| Step | Peter does | Observe |
| --- | --- | --- |
| 1 | Open the test button from Rocoto’s chat | WhatsApp-native webview, system browser sheet, or external browser; available close/minimize/back controls |
| 2 | Open Meta setup and advance to an identifiable screen | Popup behavior, login success, whether the Rocoto page remains available |
| 3 | Leave the Meta screen and return to Rocoto’s chat; tap the same message button | Same server attempt and original Meta URL; observe whether Meta restores the exact screen and entered values |
| 4 | Reach Meta’s code step if offered; navigate to WhatsApp Business’s Business Platform connection screen | Whether reaching app settings requires destroying the webview; whether the code and provider attempt stay valid |
| 5 | Leave Business Platform settings, return to Rocoto’s chat and tap the same message button | Decisive test: the same verification process and Meta step continue after code entry |
| 6 | Deliberately close the webview and tap the original message button again | New document versus restoration; any provider step retained independently |
| 7 | Click Finish in Meta | Immediate code exchange and chat handoff; observe whether the native webview closes or remains retained |
| 8 | Lock/background the phone briefly and return | Page lifetime and actual retained screen; record elapsed time |

The same-message-button return is the primary path. A retained/minimized-window control is an
optional comparison. Record close/reopen separately; explicitly start a new attempt only when
Peter selects that action after an expired or completed test.
The shared signup controller bounds one authorization attempt at five minutes. Meta’s authorization
code is exchanged immediately on its callback; the server-side pending handle lasts ten minutes.
These clocks differ from cookies and persistent account authorization.

## What the operator receives

The direct route reports launch, validated return and token-exchange outcome, associated with a
random diagnostic run ID. Repeat button requests also record a resume event for that same run.
A successful result attempts navigation to the documented Rocoto `wa.me` chat destination and
keeps a visible manual fallback. Chat navigation and native container closure are separate
observations; the API provides no documented general webpage command to close WhatsApp’s browser.
While Meta occupies the webview, our page is absent: internal screen
transitions, minimizing and resuming Meta require Peter’s observations. A callback proves the
return path; it does not prove a particular intermediate screen was preserved.

The SDK comparison test page sends allowlisted lifecycle and outcome events to
`POST /api/bodega/connection-test/events`: a random diagnostic run ID, timestamps, page/attempt
counters and bounded event values. Local storage holds a bounded report across reloads.
Restoring that report preserves evidence; it cannot recreate a lost cross-origin Meta window.

The sink validates payload size and fields, requires an allowed development Origin, rate-limits
records and writes the server journal. It provides no public report-read route and changes no
customer/provider records. Client reports are diagnostic claims, never identity or authorization.
The operator follows the development service journal over the existing authorized host access.
Telemetry delivery is best effort during closure; a missing final event is inconclusive.
The SDK message protocol identifies Meta's origin but does not correlate its messages to our
local attempt counter. A late message from an earlier open Meta window can appear during a new
attempt. Close the preceding Meta window before restarting, and use the verified completion
callback rather than a lone observed provider event to judge success.

The page can observe document lifecycle and the documented SDK callbacks. It cannot inspect Meta’s
DOM, password fields, entered verification code or arbitrary current screen. Peter supplies those
visual observations. Provider tokens and authorization codes remain in the existing exchange
transport and server storage; they are excluded from this diagnostic stream.

## Next experiments: WhatsApp as the interface

After the first test, use a separately recorded result for each capability.

| Capability | Evidence required |
| --- | --- |
| Rocoto forms and drafts | Field/scroll state survives minimize, close/reopen, phone background and session expiry; server persistence distinguished from live tab preservation |
| Authentication | Same browser returns to own account; forwarded entry cannot expose a customer’s private record; fresh device can prove ownership |
| Native WhatsApp Flows | Supported form/media components, completion payload, cancellation and draft behavior measured independently of website webview |
| Images, files and location | Camera/gallery/file chooser and native location handoff return to the intended Rocoto step |
| Navigation and conversation | Move between chat and several app tasks, preserve context and reopen the intended task |
| External services | Maps/payment/provider authorization round trip tested per service, including callback/expiry handling |
| Messaging | Freeform versus approved-template entry outside the customer-service window, delivery and inbound receipt |
| Recovery | Offline/reconnect, expired proof cookie, app restart, duplicate callbacks and provider timeout produce truthful recoverable state |
| Device coverage | Repeat key cases on current Android/iOS WhatsApp Business; consumer WhatsApp and desktop are separate clients |

## Verification and result boundary

Automated tests use synthetic Meta/API responses to prove isolation, event filtering, lifecycle
classification and current-attempt success handling. Phone observations establish the actual
WhatsApp container and Meta interoperability. Record the deployment receipt and device findings
with the company study before deciding whether WhatsApp can serve as Rocoto’s app interface.

Run the synthetic browser drive with:

```sh
ROCOTO_DIST=app/dist-export-review .venv/bin/python drives/drive-269-bodega-connection.py
```

## Read-only session check

`/bodega-pay-later/?connection-test=session` reads the existing bodega and WhatsApp-connection
sessions with two GET requests. It creates no browser session, starts no authorization and
changes no account. Recognized sessions show only their phone suffix. Missing cookies/401 and
service errors are separate outcomes; a failed network call cannot establish that someone is
signed out. Two recognized sessions for different phones are shown as a mismatch.

The chat sender's number is known to the verified WhatsApp webhook; a plain website navigation
does not automatically receive that identity. This page tests existing cookie continuity. A
future chat-to-app login must bind a verified sender to the browser deliberately; forwarding a
personal link alone is not proof of phone ownership. Passkeys and catalogue entry remain later
work. Check the session before creating new authentication, then test Meta-screen retention.
Peter placed disconnect/reconnect last; this experiment does not invoke either operation.
