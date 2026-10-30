# Rocoto Peru

Mobile AI-native ERP matching bodegas’ Yape/Plin payments to WhatsApp orders

Rocoto Peru is a phone-first workspace for bodega owners who buy from suppliers, sell to neighbours and manage money through WhatsApp. It brings their shop’s balance, purchases and customer payments into one place.

[Website](https://atelierneyra.com/peru) · [Open app](https://preview.atelierneyra.com/apps/peru/bodega-pay-later.html) · [Documentation](https://docs.atelierneyra.com/shop-workspace/overview/)

![Rocoto Peru](https://atelierneyra.com/assets/product-motion-v4/shop-workspace.jpg)

[Phone artwork credit](docs/assets/handset-CREDITS.md)

## Money and purchases

- **See the shop’s money.** Money brings together sample receipts, customer debts and supplier obligations, with a place for the bank balance once an account is connected.
- **Work from WhatsApp.** Conversations become proposed sales and purchases, with the merchant reviewing their meaning and preparation.
- **Explore flexible payment.** Transaction history supplies transparent indicators and an interface for purchase, payment and credit exploration. A lender partnership, validated underwriting and funded credit remain future work.

The preview uses an authored sample shop. The source includes the browser workspace, durable collection service, provider integrations and Android app; [capability status](docs/status.md) distinguishes working software from external acceptance.

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

[First result](docs/first-result.md) walks through a reviewed trade and a persistent payment request. [Own-account setup](docs/providers.md) explains each connection and approval. [Agent installation instructions](.agents/skills/install-shop-workspace/SKILL.md) give a coding agent the same path.

## The platform design

The shop already has relationships and work in WhatsApp. Official Business-app coexistence connects that context while the merchant continues using their familiar app. Eligible, explicitly consented history can supply up to 180 days of one-to-one conversation context. Imported words become proposals with provenance; the merchant confirms their commercial meaning.

The acquisition flow makes progressively larger commitments: referral → signed inbound WhatsApp message → durable waitlist → phone verification → native profile → same-phone Meta connection → business pass. A Google Group can supply a separately commissioned Play tester audience.

Collection pages put a durable record around a sale while Yape/Plin transfers go to the seller's selected destination. Unique payable cents help distinguish equal-value debts; every historical quote remains reserved so a late transfer keeps its original identity.

Read [the workflow and approvals](docs/workflow.md), [UX decisions](docs/design.md), and [architecture](docs/architecture.md). The [original specifications](docs/reference.md) retain the detailed rationale and implementation contracts.

## What you can reuse

| Module | Implemented scope | Evidence and activation |
| --- | --- | --- |
| Browser shop | Prep, Products, Customers, Money, source conversations, documents and exports | Authored synthetic shop, existing model tests, real browser build |
| WhatsApp connection | Embedded Signup, exact WABA/phone verification, encrypted account stores, signed history/contact projection and recovery | Synthetic protocol tests; historical owned test-account receipt recorded 2,214 messages / 112 threads |
| Trade read | Roles, order/purchase/fiado evidence, reasons and merchant review | Deterministic reader; economic evidence ranking selected for this release |
| Collections | Persistent requests, capability buyer pages, partial receipts, exact-account matching and quote allocation | Local API/browser tests; Prometeo/real wallet commissioning separate |
| Onboarding API | Signed intake, deduplicated/referral state, OTP, same-phone PKCE handoff, tester enrollment leases | Injected-transport tests; operator supplies approved Meta/Google/Play configuration |
| Android | Locally bundled Capacitor UI, encrypted native session storage, Auth Tab fallback, OTP SDK, return links, haptics and notifications | Web bundle builds; signed builds and physical devices have separate acceptance |
| Extensions | Fiscal adapters, transparent trade indicators, financing exploration and supervised assistance case tooling | [Proof tiers](docs/status.md) distinguish working software, provider/device acceptance and product proposals |

The original [Peru marketing templates](website/README.md) are retained separately, including English/Spanish source, handset animation and artwork attribution.

## Develop

```sh
make build                 # browser bundle in app/dist
make test                  # offline model, API, history and collection checks
make android               # bundled Android UI in app/dist-android
```

For native compilation, [Android setup](docs/android.md) names the JDK/SDK and your own signing/callback requirements. [Engineering reference](docs/architecture.md#code-map) points to actual modules and tests.

Source comes from one coherent product revision, `e4801f58454c3a7fa639d0570b71f3434d2dc759`, including Android `0.6.1` / code `9`. The sibling AI-native ERP release uses a different historical branch. [Provenance](docs/provenance.md) records their relationship, export changes and asset boundaries.

[made by atelier neyra](https://atelierneyra.com)
