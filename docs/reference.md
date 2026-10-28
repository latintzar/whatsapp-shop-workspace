# Specifications and reference

Read these after the [first result](first-result.md) and [architecture](architecture.md). They preserve the detailed historical design, source rationale and individual function/module contracts. Current export commands and account destinations are governed by this release's root guide.

| Topic | Original source |
| --- | --- |
| Full shop design and responsive behavior | [DESIGN-SPEC](../app/src/prototypes/bodega-pay-later/DESIGN-SPEC.md) |
| Screen-by-screen acquisition | [ONBOARDING-SPEC](../app/src/prototypes/bodega-pay-later/ONBOARDING-SPEC.md) |
| Message provenance and merchant confirmation | [WHATSAPP-HISTORY-SPEC](../app/src/prototypes/bodega-pay-later/WHATSAPP-HISTORY-SPEC.md) |
| Runtime, state, money and provider wiring | [WIRING-SPEC](../app/src/prototypes/bodega-pay-later/WIRING-SPEC.md) |
| Native identity and distribution | [MOBILE-SPEC](../app/src/prototypes/bodega-pay-later/MOBILE-SPEC.md) |
| Template/message design | [MESSAGES](../app/src/prototypes/bodega-pay-later/MESSAGES.md) |
| Generated shop world | [Fixture source](../app/src/prototypes/bodega-pay-later/fixtures/README.md) |
| Official connection protocol and custody | [Connection source](../app/src/prototypes/cedar/connections/README.md) |
| Collections/provider/fiscal contracts | [Copper specification](../app/src/prototypes/copper/SPEC.md) |
| Supervised assistance evidence | [ASSISTANCE-PILOT-SPEC](../app/src/prototypes/bodega-pay-later/ASSISTANCE-PILOT-SPEC.md) |

Historical source documents refer to the original company's private operations and release records. Those references identify their original authority; they grant access to neither records nor accounts. Public installation uses [own-account setup](providers.md), [native setup](android.md) and the export's functional guide.

The directory/module map names the implementation entrypoints. The included source preserves its inline contracts and test suites, which document edge cases such as one-time sync recovery, phone/account separation, quote reservation and partial-payment conservation.
