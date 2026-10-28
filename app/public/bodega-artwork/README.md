# Bodega pay later — cover images

Owner: Rocoto / bodega pay later. Environment: development. The system that makes these files, their
anchor, prompts, candidates and receipts is `library/illustrations` (historical reference outside this export);
this directory holds only the installed copies the prototype reads through its hero slot
(`app/src/prototypes/bodega-pay-later/`, the `HeroArtwork` seat named in DESIGN-SPEC.md).

Register (FEED-IA §247.6, §268): Uber's modal illustration — one full-bleed flat scene at the top of a
dialog, in the anatomy image · title · body · one primary action, drawn once where a flow starts or an
area introduces itself. The subject is the dialog's own, a Lima corner shop, with no lettering anywhere,
so the Castellano build ships the same file. The style words are the anchor's own `describe`
(`library/illustrations/prompts/hero-anchor-describe-2026-09-11.txt`); only the subject sentences change.

| Files | Drawn at | World · subject |
|---|---|---|
| `hero-arrival.png` (16:9, phone) · `hero-arrival-wide.png` (3:1, desk band) | the first screen the shop sees after the link, above its title, **and Money's first open** | bodega · the bodeguera behind her glass counter of sweets with a phone in her hand, shelves packed to the ceiling, sachet strips, the drinks fridge, the grille door under a red awning |
| `hero-referrals.png` · `hero-referrals-wide.png` | the referral step, and Money → Suppliers you brought | produce stall · a delivery man hands a crate across the stall to the stallholder, both of them looking at the crate; bananas hang above, crates of tomatoes, mangoes, limes and avocados, sacks of potatoes and onions |
| `hero-money.png` · `hero-money-wide.png` | **the `I sell to restaurants` tile of screen 4** · and held, pending a Money re-draw | fish stall · a customer pays by phone across a counter of fish on ice, the fishmonger in a blue apron and white cap, tiled wall. **Money draws `hero-arrival` instead** (19 September): the seeded world is a corner shop, so a fishmonger on Money claimed a trade the shop does not keep. This seat returns the day a Money scene is drawn in the bodega's own trade. |
| `hero-stock.png` · `hero-stock-wide.png` | Products, first open | produce stall · the stallholder hangs a hand of bananas on the rail above her crates and sacks |
| `hero-customers.png` · `hero-customers-wide.png` | Customers, first open | bodega · three neighbours at the glass counter while the bodeguera greets them, sachet strips hanging, shelves behind |

**THE THREE BUSINESS-KIND TILES ARE THESE SAME THREE SCENES** (20 September, the direction pass).
Screen 4 of the sign-up asks a shop what it is, and each choice is a full-width picture tile of the
trade it names, so a shopkeeper recognises their own before they read a word
(`app/src/prototypes/bodega-pay-later/start/business.tsx`):

| Choice | File | Crop, chosen by looking |
|---|---|---|
| `A bodega` | `hero-arrival.png` | `50% 38%` — the bodeguera and her counter, clear of the grille door |
| `I sell to bodegas` | `hero-referrals.png` | `50% 55%` — the handover itself, the crate between the two men |
| `I sell to restaurants` | `hero-money.png` | `45% 42%` — both faces, the fish on ice under them. Lima's pescaderos are who supply its cevicherías, so the fish stall is the restaurant supplier's own trade |

The tile shows the picture as a cover with an ink scrim rising from its foot and the name of the
trade set in white across the bottom, so the crop matters and each one is stated per scene rather
than guessed once for all three. `hero-stock.png` stood in the third tile until this pass and drew a
band of blue sky — a broken crop, and the wrong trade.

**The style, stated once.** The anchor's own describe, verbatim, with only the subject sentences changed: a modern minimalist digital illustration, clean lines, bold flat colours, geometric pale-yellow clouds on a vibrant blue sky, faces in profile under a soft glow, warm mood. **The gaze is subject, so it follows the seat**: four seats keep the anchor's calm upward gaze; `referrals`, whose whole subject is the handover, puts both men's eyes on the crate (the 19 September re-render, recorded in `library/illustrations/README.md`). **The place, drawn as it is**: Peter's photographs of 18 September fixed three worlds — the bodega, the produce stall (minorista), the fish stall (pescadero) — and the first set, which read as a tidy deli, is kept under `library/illustrations/candidates/` as the rejected record. **The fit**: each subject is the dialog's own and is composed in the middle band, so the 16:9 phone frame and the 3:1 desk band show the same whole scene, and the title and body under the picture name what it shows.

Provenance: Ideogram 4.0 generations of 18 September 2026 through Peter's Ideogram connection selected
for the Rocoto trial, 16:9 at QUALITY, with `referrals` re-rendered the same way on 19 September; the 21:9
reframes added lettering to every seat, so each 3:1 desk
band is cut from a lettering-free region (the box per seat is in
`library/illustrations/accepted/receipts.json` under `bodegaCovers`). Prompts as sent:
`library/illustrations/prompts/hero-bodega-<seat>.txt`. Exact copies: `library/illustrations/accepted/hero-bodega-<seat>*.png`.
The images are decorative; the title and body under each carry the content, so the slot's alt text is empty.

## Native welcome, 22 September 2026

`welcome-fish-tiles.webp` is the native full-screen welcome. Peter selected the website’s
[fishmonger illustration](https://soyrocoto.com/peru/cap/bank-art-tall.webp) and requested the tiled
wall be extended upward for the logo. The source and edit receipt (historical reference outside this export)
and exact edit prompt (historical reference outside this export)
record this built-in image-tool edit. The original site asset remains intact. The actual Rocoto
SVG mark, Fraunces name and Get started action are live UI elements over the illustration.
