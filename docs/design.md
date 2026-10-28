# UX decisions

The original design starts from the merchant's existing platforms, relationships and language. Its source specifications explain the individual screens; these are the decisions that connect the system.

| Decision | Why it exists | Source |
| --- | --- | --- |
| WhatsApp coexistence before an empty ERP | The shop already has identity, contact names and trading history. Provider-authorized context gives the workspace a meaningful starting point. | [History contract](../app/src/prototypes/bodega-pay-later/WHATSAPP-HISTORY-SPEC.md) |
| Progressive commitments | Joining a list, verifying a phone, completing a profile and authorizing business history each ask for different trust. The later native flow acquires them in that order. | [Mobile contract](../app/src/prototypes/bodega-pay-later/MOBILE-SPEC.md) |
| Prep as home | One shop acts on today's work. Prep groups sales by the block where they go, ahead of a general sales dashboard. | [Design specification](../app/src/prototypes/bodega-pay-later/DESIGN-SPEC.md) |
| Source conversations beside records | A role or fiado is an interpretation of someone's words. Showing its provenance and reasons makes merchant confirmation meaningful. | [Reader](../app/src/prototypes/bodega-pay-later/history/read.ts) |
| Familiar money rails with a durable page | The seller keeps their own receiving destination. The page supplies description, exact amount and persistent settlement identity. | [Collection contract](../app/src/prototypes/copper/SPEC.md) |
| Transparent trade indicators | Starting / Steady / Punctual expose counted windows, denominators and evidence floors. They make behavior understandable before any financing claim. | [Record arithmetic](../app/src/prototypes/bodega-pay-later/record.ts) |
| Native questions sized to the keyboard | One question, a direct input, progress and one forward action stay inside the visual viewport. Auth Tab reuses the browser's actual login session for Meta. | [Native UI](../app/src/prototypes/bodega-pay-later/mobile/README.md) |
| Explicit action states | A share sheet, accepted Graph message, eligible tester, Play install and bank receipt mean different things. Their labels correspond to their actual source. | [Workflow](workflow.md) |

The browser retains the original Inter/Fraunces typography, shared theme, artwork and responsive shell. The native bundle finishes at verified onboarding and the waitlist/business pass; its scope differs from the full browser shop.

The historical personal-account experiment ranked referrals by laughs so family chats could exercise the journey. This release selects the already implemented economic evidence rule. The test-only alternate remains documented in `history/rank.ts` and its explicit replay tests; it supplies useful provenance for why the two rules exist.
