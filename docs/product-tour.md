# Product tour

Rocoto Peru is a mobile AI-native ERP matching bodegas’ Yape/Plin payments to WhatsApp orders. It brings sales, collections and supplier purchases together, with a working-capital design based on the shop’s trading history.

The order is in a chat, the payment is in a wallet and the next stock purchase needs cash. A shop owner needs a clear view of the money tied to each trade and the obligations coming next.

## A WhatsApp sale becomes a traceable payment

1. **Review today’s sale.** Prep groups orders by delivery block. Open a sale, inspect its lines and consult the source chat when the customer’s wording needs interpretation.
2. **Confirm what the shop is owed.** Money separates candidate fiados from the merchant’s confirmed debt book. Confirming an interpretation makes it a record the owner can act on.
3. **Make a payment page.** Choose the customer, amount and description. Open or copy the durable page for that trade; the buyer sees the seller’s selected receiving destination and exact quote.
4. **Match the receipt.** The collection ledger keeps partial receipts and the remaining principal. Exact receiving account, currency and reference or reserved payable cents connect a transfer to its request. Sample, manual and bank evidence retain their source.
5. **Plan the next purchase.** Return to Money to inspect supplier obligations and the shop’s trading record. Purchase and pay-later exploration show an amount, due date and terms; funded stock credit needs an agreed lender partnership.

Follow the editable payment-page and partial-receipt sequence in your own local workspace using the first-result guide. The hosted shop is an authored sample with an unconnected bank state. Connect your own Meta account, configure wallet/bank evidence and validate the lender partnership to complete the live workflow.

## Product areas

| Area | What you do | Result |
| --- | --- | --- |
| Prep | Open today’s orders by delivery block and review preparation. | The owner starts with the work the shop needs to complete. |
| Chats | Read customer and supplier context alongside proposed trades. | Interpretations carry their source words and reasons. |
| Products and customers | Inspect the goods and trading relationships behind sales. | The same shop identity carries through orders and payments. |
| Money | Inspect receipts, bank state, supplier purchases and who owes the shop. | Collections and obligations share one place while retaining their own records. |
| Payment pages | Describe a trade, issue a page and follow partial payment. | The persistent request survives reloads and keeps its remaining balance. |
| Record and pay later | Inspect transparent trading indicators and purchase terms. | The credit exploration can be continued with a lender and validated underwriting. |
| Android onboarding | Verify the phone, complete the profile and connect WhatsApp. | Native session storage, official coexistence and eligible history have explicit account boundaries. |

## Design decisions

- **Existing relationships come first.** The merchant already uses WhatsApp, Yape and Plin. The workspace joins those activities around the trade.
- **Confirmation gives a chat commercial meaning.** A message can suggest an order or fiado. The owner reviews that proposal before relying on it as a record.
- **Fiado and stock credit are different obligations.** Customer debt belongs in the shop’s receivables; financing a supplier purchase has separate lender terms.
- **A late transfer keeps its identity.** Issued payable amounts stay reserved so old payment instructions still refer to their original request.

## Reached stage

The released browser, deterministic trade reader, encrypted collections service and bank/Meta adapters are implemented. The first result uses authored chats, trades and receipts; the hosted bank remains unconnected. Native onboarding has its own Android and physical-device acceptance steps. Purchase and offer exploration are retained, with a lender agreement, underwriting validation and funded operation identified as the next layer.

## Modules

| Source | Responsibility |
| --- | --- |
| [Shop routes](../app/src/prototypes/bodega-pay-later/App.tsx) | Mount Prep, Products, Customers, Money, chats and onboarding. |
| [Conversation reader](../app/src/prototypes/bodega-pay-later/history/read.ts) | Derive roles and proposed trade meaning with evidence pointers. |
| [Money area](../app/src/prototypes/bodega-pay-later/areas/money.tsx) | Connect the bank, suppliers, fiado, record and export views. |
| [Payment-page interface](../app/src/prototypes/bodega-pay-later/payment-link-actions.tsx) | Compose a described page and expose its resulting link. |
| [Persistent collections](../app/src/prototypes/copper/runtime/cedar_service.py) | Serve the encrypted request, receipt and buyer-capability ledger. |
| [Payment matching](../app/src/prototypes/copper/runtime/cedar_amounts.py) | Reserve exact quotes and conserve principal across partial receipts. |
| [Trade indicators](../app/src/prototypes/bodega-pay-later/record.ts) | Compute transparent windows, counts and evidence floors. |
| [Native transport](../app/src/prototypes/bodega-pay-later/mobile/) | Handle phone sessions, authorization handoff and recovery. |

## Setup and implementation

[First result](first-result.md) · [Own-account setup](providers.md) · [Architecture](architecture.md) · [UX decisions](design.md) · [Approval workflow](workflow.md) · [Detailed reference](reference.md) · [Android setup](android.md) · [Capability status](status.md) · [Agent skill](../.agents/skills/install-shop-workspace/SKILL.md) · [Platform design and implementation](implementation.md)

[made by atelier neyra](https://atelierneyra.com)
