# Implementation and platform design

This guide retains startup, official account connection, collections, Android, verification and source-provenance detail from public source `04d4f5eead436215ade73e99be7f684647b4b243`. Run its commands from the repository root. The [product tour](product-tour.md) explains the shop experience first.

## Run

Use Node 22+ and Python 3.12+:

```sh
git clone https://github.com/latintzar/whatsapp-shop-workspace.git
cd whatsapp-shop-workspace
make install
make doctor
make dev
```

Open [the local shop](http://127.0.0.1:18240/#/prep). You will see twelve sample sales grouped by delivery block. Open **Money**, **Products**, **Customers** and **Chats** to explore the same synthetic shop. The UI labels its source **Sample chats**. Development state persists in the ignored, private `.local/synthetic/` directory.

The command runs the actual browser app, prototype API on `127.0.0.1:18241`, and durable collection service on `127.0.0.1:18242`. Provider credentials are isolated from the default launch. Use **Ctrl-C** to stop all three processes.

[First result](first-result.md) walks through a reviewed trade and a persistent payment request. [Own-account setup](providers.md) explains each connection and approval. [Agent installation instructions](../.agents/skills/install-shop-workspace/SKILL.md) give a coding agent the same path.

## The platform design

The shop already has relationships and work in WhatsApp. Official Business-app coexistence connects that context while the merchant continues using their familiar app. Eligible, explicitly consented history can supply up to 180 days of one-to-one conversation context. Imported words become proposals with provenance; the merchant confirms their commercial meaning.

The acquisition flow makes progressively larger commitments: referral → signed inbound WhatsApp message → durable waitlist → phone verification → native profile → same-phone Meta connection → business pass. A Google Group can supply a separately configured Play tester audience.

Collection pages put a durable record around a sale while Yape/Plin transfers go to the seller's selected destination. Unique payable cents help distinguish equal-value debts; every historical quote remains reserved so a late transfer keeps its original identity.

Read [the workflow and approvals](workflow.md), [UX decisions](design.md), and [architecture](architecture.md). The [original specifications](reference.md) retain the detailed rationale and implementation contracts.

## What you can reuse

| Module | Implemented scope | Evidence and activation |
| --- | --- | --- |
| Browser shop | Prep, Products, Customers, Money, source conversations, documents and exports | Authored synthetic shop, existing model tests, real browser build |
| WhatsApp connection | Embedded Signup, exact WABA/phone verification, encrypted account stores, signed history/contact projection and recovery | Synthetic protocol tests; historical owned test-account receipt recorded 2,214 messages / 112 threads |
| Trade read | Roles, order/purchase/fiado evidence, reasons and merchant review | Deterministic reader; economic evidence ranking selected for this release |
| Collections | Persistent requests, capability buyer pages, partial receipts, exact-account matching and quote allocation | Local API/browser tests; Prometeo/real wallet configuration and acceptance checks separate |
| Onboarding API | Signed intake, deduplicated/referral state, OTP, same-phone PKCE handoff, tester enrollment leases | Injected-transport tests; you supply approved Meta/Google/Play configuration |
| Android | Locally bundled Capacitor UI, encrypted native session storage, Auth Tab fallback, OTP SDK, return links, haptics and notifications | Web bundle builds; signed builds and physical devices have separate acceptance |
| Extensions | Fiscal adapters, transparent trade indicators, financing exploration and supervised assistance case tooling | [Proof tiers](status.md) distinguish working software, provider/device acceptance and product proposals |

The original [Peru marketing templates](../website/README.md) are retained separately, including English/Spanish source, handset animation and artwork attribution.

## Develop

```sh
make build                 # browser bundle in app/dist
make test                  # offline model, API, history and collection checks
make android               # bundled Android UI in app/dist-android
```

For native compilation, [Android setup](android.md) names the JDK/SDK and your own signing/callback requirements. [Engineering reference](architecture.md#code-map) points to actual modules and tests.

Source comes from one coherent product revision, `e4801f58454c3a7fa639d0570b71f3434d2dc759`, including Android `0.6.1` / code `9`. The sibling AI-native ERP release uses a different historical branch. [Provenance](provenance.md) records their relationship, export changes and asset boundaries.

[made by atelier neyra](https://atelierneyra.com)
