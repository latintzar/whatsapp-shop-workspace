# Rocoto Peru

Mobile AI-native ERP matching bodegas’ Yape/Plin payments to WhatsApp orders

Rocoto Peru is a mobile AI-native ERP matching bodegas’ Yape/Plin payments to WhatsApp orders. It brings sales, collections and supplier purchases together, with a working-capital design based on the shop’s trading history.

[Website](https://atelierneyra.com/peru) · [Open demo](https://preview.atelierneyra.com/apps/peru/bodega-pay-later.html) · [Product tour](docs/product-tour.md) · [Documentation](https://docs.atelierneyra.com/shop-workspace/overview/)

[![Rocoto Peru Money with receipts, fiado and supplier obligations beside mobile Prep orders](https://atelierneyra.com/assets/product-motion-v5/shop-workspace-0f44723d1911.jpg)](https://preview.atelierneyra.com/apps/peru/bodega-pay-later.html)

[Phone artwork credit](docs/assets/handset-CREDITS.md)

## A sale becomes a traceable payment

1. **Review the order.** Prep groups today’s sales by delivery block; the source chat explains the customer’s request.
2. **Make a payment page.** Give the trade a customer, description and exact amount. Its durable buyer page identifies what the payment is for and where the seller receives it.
3. **Follow the receipt.** The collection ledger keeps partial payments, source evidence and the remaining balance attached to the same request.
4. **Review Money and the next purchase.** See customer fiado, supplier obligations and trading indicators; explore supplier payment terms with their amount and due date together.

## Product areas

| Area | What it does |
| --- | --- |
| Prep | Put today’s orders and preparation first. |
| Chats | Show customer/supplier context and the evidence behind proposed trades. |
| Products and customers | Keep the shop’s goods and trading relationships together. |
| Money | Bring collections, bank state, customer fiado and supplier purchases into one place. |
| Payment pages | Preserve a described request through partial receipts and remaining balances. |
| Record and pay later | Show transparent trading indicators and the purchase/credit exploration. |
| Android onboarding | Verify the phone, complete the shop profile and connect official WhatsApp history. |

The hosted shop uses authored trades and an unconnected bank state. The source includes the browser, encrypted collections service, account adapters and Android app. Live payment matching and lender-backed stock credit have their own configuration and acceptance steps.

[Product tour](docs/product-tour.md) follows the whole trade and maps the interface, payment ledger and credit exploration to source. [Capability status](docs/status.md) records their proof levels.

## Run

Use Node 22+ and Python 3.12+:

```sh
git clone https://github.com/latintzar/whatsapp-shop-workspace.git
cd whatsapp-shop-workspace
make install
make doctor
make dev
```

Open [the local shop](http://127.0.0.1:18240/#/prep). Its **Sample chats** source provides twelve sales grouped by delivery block. [First result](docs/first-result.md) follows a reviewed trade, persistent payment page and sample partial receipt.

Connect your own WhatsApp, payment and optional fiscal accounts through [own-account setup](docs/providers.md). The [installation skill](.agents/skills/install-shop-workspace/SKILL.md) gives your coding agent the same path.

## Guides

[Product tour](docs/product-tour.md) · [Architecture](docs/architecture.md) · [UX decisions](docs/design.md) · [Platform design and modules](docs/implementation.md) · [Capability status](docs/status.md) · [Android setup](docs/android.md) · [Detailed specifications](docs/reference.md)

## Licence

Original code uses [MIT](LICENSE); dependencies and assets retain their [own notices](THIRD_PARTY_NOTICES.md). [Source provenance](docs/provenance.md) records the original revision, export changes and asset boundaries.

[made by atelier neyra](https://atelierneyra.com)
