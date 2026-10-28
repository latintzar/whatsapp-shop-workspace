# Workflow and approvals

| Step | Source of authority | Durable result | Approval or proof |
| --- | --- | --- | --- |
| Referral visit | URL carries an opaque referral code | Browser remembers attribution candidate | Opening a share sheet describes an action, rather than a delivered invitation |
| WhatsApp intake | Signed inbound webhook, exact receiving phone, deduplicated message ID | Real waitlist place and once-only referral attribution | Sender identity comes from the provider |
| Profile questions | Resumable deterministic chat | Name, business and tester email | Customer answers; outbound window and send ceiling apply |
| Native sign-in | Approved WhatsApp authentication template and verified code | Phone-safe session | Zero-tap/one-tap eligibility and manual fallback share server redemption |
| Profile completion | Authenticated native session | Incremental owner/business/address records | Server confirms completion |
| Business connection | Official Meta authorization/coexistence consent | Exact connected account and eligible history | Phone identity and business permission are separate capabilities |
| Trade read | Source message, classifier reasons and evidence pointers | Proposal for order, purchase, role or fiado | Merchant confirms the interpretation and amount |
| Collection page | Described shop record, workspace capability | Persistent request and buyer capability | Seller's receiving destination is separately commissioned |
| Settlement | Exact receiving account, currency, reference/unique amount | Receipt, provenance and remaining principal | Bank evidence, manual entry and sample receipts retain different sources |
| Fiscal issue | Reviewed frozen billing draft, seller series/number and authenticated payment gate | Durable issue/query operation | Seller/provider/SUNAT commissioning and explicit owner/operator authority |
| Financing | Transparent commercial record | Designed lender handoff | Partner, underwriting validation and funded operation have their own evidence |

External operations keep accepted, failed and uncertain states distinct. A network timeout after a provider may have accepted work preserves the pending identity; reconciling it avoids duplicate syncs, invitations or fiscal documents.

The assistant case CLI in `mock-api/app/bodega_cases.py` stores literal consented evidence for a supervised one-week case. Its inclusion adds case custody and retention tooling. The general customer-success agent and working-capital service remain product extensions with their own scope.
