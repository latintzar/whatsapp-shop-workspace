# Landing pictures — Peru shops

## Current Rocoto illustration style — 22 September 2026

The [company illustration guide](https://github.com/Rocoto-Labs/company/blob/main/brand/illustration-style/README.md)
owns the current direction, banking reference, full-resolution examples and exact generation
prompts. Peter selected the painterly fishmonger illustration in the banking section as
Rocoto's narrative illustration style. Use that actual image as the visual reference for each
new scene or style edit, preserving an existing scene's composition when restyling it.

`who-bodega.webp`, `who-retail.webp`, `who-wholesale.webp` and `../cap/close-art.webp` now use
this treatment. They were edited with built-in `image_gen`, using the previous images as
composition targets and `../cap/bank-art-wide.webp` as the style reference. The closing bodega
was also a character/style reference for the tighter bodega crop. Public files retain their
existing dimensions and are WebP q82/method6. Full-resolution masters, the generation prompts
and checksums live with the company guide. This direction supersedes the older flat-outline
recipes below for future narrative illustrations; their original source/crop history remains.

Four pictures for the Peru landing page (bodegas, market produce stalls, fish stalls), made
19 September 2026 through the founder's selected Ideogram connection, organisation `peteran`
(`3w5wxLd_TNivI8c3CkcxdA`), model Ideogram 4.0, rendering speed QUALITY, magic prompt OFF.

The three illustrations follow the locked method of `library/illustrations/README.md` in the
Rocoto repository: the hero anchor's own Ideogram describe carries every style word verbatim —
modern minimalist art style, clean lines and bold colours, geometric pale-yellow clouds on a
vibrant blue sky, the soft glow on profiles, the warm uplifting mood — and only the subject
sentences change. Following the third lesson recorded there, the anchor's gaze clauses are
subject: each seat here has something to look at, so the gaze goes to the code card, the phone
at the mouth, and the crate. `from-above` is a photograph and stands outside that register.

Deliverables are WebP at `cwebp -q 88`. Originals are the Ideogram PNGs in `src/`, at the
provider's native resolution for the four accepted pictures and at 1024-wide review size for the
rejected candidates.

| File | Pixels | Source original |
|---|---|---|
| `scan-qr.webp` | 1170 × 2080 | `src/scan-qr.png` (1440 × 2560) |
| `scan-qr-sm.webp` | 585 × 1040 | same |
| `voice-and-photo.webp` | 1170 × 2080 | `src/voice-and-photo.png` (1440 × 2560) |
| `voice-and-photo-sm.webp` | 585 × 1040 | same |
| `from-above.webp` | 1200 × 1500 | `src/from-above.png` (1792 × 2240) |
| `from-above-sm.webp` | 600 × 750 | same |
| `supplier-van.webp` | 1920 × 1080 | `src/supplier-van.png` (2560 × 1440) |
| `supplier-van-sm.webp` | 960 × 540 | same |

---

## `scan-qr` — illustration, 9:16

Generation id `3M6M0t0pT-qYrIBLWYDYdg`, response `i4r3HpB9UQKr_aglUUiLcw`, batch
`LT77xH8AQ9yv-sIJs7wyeA`. Candidate file `src/cand-scan-qr-a.webp`.

**THE PROMPT AS SENT**

A stylized digital illustration of a customer scanning a small square code placard at a fruit and vegetable stall inside a bright covered Lima market. The customer stands in the near foreground seen in profile, in a warm cream shirt, holding a phone up in one hand toward a small square placard standing upright on the stall counter among the crates; the placard is an abstract pattern of plain dark squares and blocks, a flat geometric block pattern with no writing of any kind, and the phone's screen is turned away from the viewer. Beside it the stallholder in a sage apron stands behind the counter, also in profile, her eyes on the customer. The stall fills the frame around them: hands of yellow bananas hanging from a rail above, tiers of wooden crates of tomatoes, mangoes, limes and avocados, white sacks of potatoes and red onions open at the front, a tray of carrots on the counter. Tall vertical composition, the two figures, the counter and the square placard whole and unclipped inside the central band of the tall frame, sunlit produce above them and pale market floor below; bright morning light reaches every corner. A bright blue sky shows above the stall through the open roof of the hall. The illustration has a modern, minimalist art style with clean lines and bold colors. The clouds in the background are rendered in a simple, geometric style with pale yellow coloring against the vibrant blue sky. The lighting creates a soft glow effect on the faces of the figures, emphasizing their profiles as they look toward the small square placard on the counter. The illustration has a warm, uplifting mood with its bright color palette and the figures' attention on the placard between them. No text, lettering, logos or brand marks anywhere.

**Judged** at 390 px and again cropped to the central 82 %, which is what a 390 × 844 phone-shaped
frame shows of a 9:16 picture. Both figures, the counter and the card stay whole inside that crop.
The phone screen is a plain blank rectangle and the card is an abstract block square.

**Rejected**

- `QjEAnBeOUtKL6oey-_Evyg` (`src/cand-scan-qr-b.webp`) — the card is drawn as a real scannable QR
  code and floats in mid-air above the crates instead of standing on the counter; the phone screen
  carries a small invented interface.
- `DD2M1iiYUOu3hejhR2GYHA` (`src/cand-scan-qr-c.webp`) — the customer fills the foreground from
  behind, so no profile and no face; a second person's shoulder crowds the right edge.
- `SieRLl7uXtyU3iug4vHoOw`, `QBC9TZ9dXYWn02K-Bc0p3w` (`src/cand-scan-qr-d.webp`,
  `src/cand-scan-qr-f.webp`) — a second pass that filled the frame; both cut the heads of both
  figures at the top and side edges.
- `WYNLWM_9WAiRRC1Y2Tl3zQ` (`src/cand-scan-qr-e.webp`) — the closest of the second pass and whole in
  frame, but the sky turns teal and the surface carries a grain that the accepted covers do not
  have, so it leaves the family.

---

## `voice-and-photo` — illustration, 9:16

Generation id `DjBm5hOCQ0W-pWDNe8KVVQ`, response `JxojGDpwUGys-97F3XX84A`, batch
`-qjNmEaRSsaauHPZNfztjw`. Candidate file `src/cand-voice-f.webp`.

**THE PROMPT AS SENT**

A stylized digital illustration of a fishmonger speaking a voice message into his phone at a busy fish stall inside a bright covered Lima market, the stall filling the whole frame: the counter is heaped with whole silver fish, pink fillets and prawns on crushed ice, with lemons and bunches of parsley in a tray at the front edge and wooden crates of fish stacked behind. The fishmonger in a blue apron over a white shirt and a white cap stands in the middle in profile, holding a slim dark phone close to his mouth in one hand as he speaks into it, the phone's screen turned away from the viewer, his other hand resting on the rim of a wooden crate he is filling; his gaze is down on the crate. A wall of pale blue-green tiles runs behind him and a bright blue sky shows through the open end of the hall. Tall vertical composition, the figure, the counter and the crate whole and unclipped inside the central band of the tall frame, ice and fish filling the lower band and the tiled wall the upper; bright morning light and saturated market colour fill all four corners of the frame. The illustration has a modern, minimalist art style with clean lines and bold colors. The clouds in the background are rendered in a simple, geometric style with pale yellow coloring against the vibrant blue sky. The lighting creates a soft glow effect on the face of the figure, emphasizing his profile as he speaks into the phone at his mouth. The illustration has a warm, uplifting mood with its bright color palette and the fishmonger's attention on the message he is recording. No text, lettering, logos or brand marks anywhere.

**The lesson this seat repeats.** The first prompt named the tiled wall and a "pale market floor"
and left the rest of the stall unsaid, and Ideogram filled the gaps with grey concrete: three
candidates that read as an architecture study. The register lives in the furniture, so the second
prompt names the fish, the ice, the fillets, the prawns, the lemons, the parsley and the stacked
crates, and says the market's colour fills all four corners. Every style word stands verbatim.

**Rejected**

- `T55hHvsLVr-tip-eSyf1KQ` (`src/cand-voice-a.webp`) — a navy slab across the bottom-left and a
  white line across the middle; the figure is small inside broken panels of grey wall.
- `qN5qrmUBUW2WxntTfo087w` (`src/cand-voice-b.webp`) — roughly half the frame is empty grey wall and
  floor, and the phone reads as a small green object at his mouth.
- `_WvkiAvgVJeK68c6nuGHCw` (`src/cand-voice-c.webp`) — he holds the phone to his ear, which is a
  call rather than a voice note, over a wide empty grey floor.
- `aIkQhWgEVqKDrVUnoswquw` (`src/cand-voice-d.webp`) — in family and usable, but a dark ceiling band
  cuts across the top edge and the figure sits off to the left of the crate.
- `zkELIqgaWxy0jK0cTN0WhA` (`src/cand-voice-e.webp`) — the phone sits against his ear again, and the
  sky takes the top 40 % with the counter pushed low.
- `yqyoHCNgU0CvM8nw7R9T4w` (`src/cand-voice-g.webp`) — phone at the ear, and a heavy dark counter
  mass along the bottom.

---

## `from-above` — photograph, 4:5

Generation id `3mdjzUQGTUKUYsXTJUZ1bw`, response `OKcGlvlmXqKv4GNovd_Nbg`, batch
`l510QvdaQqKYeFpLcTMS7Q`. Candidate file `src/cand-photo-b.webp`.

This one is a photo message inside a WhatsApp chat, so it is a photograph and stands outside the
illustration register.

**THE PROMPT AS SENT**

A real phone photograph taken straight down from directly above a shop counter in a small Lima market bodega, with an order being put together on the worn counter top: a wooden crate of ripe red tomatoes, a heap of green limes and a few red onions beside it, two or three small packets in plain unmarked paper wrappers, and a small sheet of lined paper bearing only a few faint pencil strokes and no writing at all, partly tucked under the edge of the crate. Natural daylight falling from one side of the frame, soft real shadows, true everyday colours, the counter slightly scuffed. Slightly tilted and slightly off-centre framing, the casual overhead snapshot a shopkeeper takes with a phone, ordinary phone camera look, no styling. One bare hand entering at the edge of the frame resting on the rim of the crate. No faces, no packaging designs, no logos, no readable text, no brand names, no writing anywhere.

**Judged** at 700 px: the lined sheet carries faint grey pencil marks that stay unreadable at every
size, the paper packets are blank, the hand at the left edge has five fingers, and no face appears.

**Rejected**

- `Xl9OaaUZUqOqDAlIC4wqTA` (`src/cand-photo-a.webp`) — the strongest frame of the three, and the one
  that loses it: the brown paper packets carry faint stamped marks that read as lettering. The
  crate also holds tomatoes alone, with the limes and onions on a separate tray behind.
- `rjqXNCy6XvqJWGz7EYscJA` (`src/cand-photo-c.webp`) — the order is pushed to the top edge and the
  bottom-right half of the frame is bare concrete.

---

## `supplier-van` — illustration, 16:9

Generation id `ECGDIKsOSLOpTrZbzKxEcA`, response `ZawgmRkVUdqJ3jwGMRr9XQ`, batch
`22KRu01JSvS2Y8AoahAinQ`. Candidate file `src/cand-van-a.webp`.

**THE PROMPT AS SENT**

A stylized digital illustration of a distributor delivering crates to a bodega in Lima. At the kerb outside the shop stands his small white delivery van with its back doors open and stacked wooden crates of tomatoes, limes and mangoes inside; in the middle of the frame the distributor in a coral jacket hands a wooden crate of produce across to the bodeguera in a sage apron who stands in the doorway of her shop. Both figures are seen in profile and both look down at the crate held between their hands, their eyes on the produce they are passing. The bodega behind her has a red awning over the pavement and an open folding iron grille door, with shelves of bottles and tins in blank colour-block labels glimpsed inside. Bright morning light reaches every corner of the frame, pale pavement below and a vibrant blue sky above. Wide horizontal composition, light everywhere, the van, the two figures and the crate in the middle band of the frame. The illustration has a modern, minimalist art style with clean lines and bold colors. The clouds in the background are rendered in a simple, geometric style with pale yellow coloring against the vibrant blue sky. The lighting creates a soft glow effect on the faces of the figures, emphasizing their profiles as they look down at the crate between them. The illustration has a warm, uplifting mood with its bright color palette and the two figures' attention on the crate they hand over. No text, lettering, logos or brand marks anywhere.

**Judged** at 1000 px and again at the delivered 1920: the van carries no badge or lettering, the
bottles on the shelves inside keep blank colour-block labels, and the three hands on the crate are
correct.

**Rejected**

- `qlq0vx8tX2K4je1n3lLwdQ` (`src/cand-van-b.webp`) — a tighter framing that cuts the van, so the
  band loses the delivery that the picture is there to carry.
- `KdBY6YdbX06k-cfBQm5PPw` (`src/cand-moto-a.webp`) and `MBZQHIgVUGOpzLvFc7bYkw`
  (`src/cand-moto-b.webp`) — the mototaxi pass; both leave the left half of the band as bare sky and
  empty road, and the vehicle reads as a scooter with a flat bed.

---

# The 20 September pass — «Who it helps», the sales box, and the picture that is still owed

Four files were installed on 20 September for the three sections added that afternoon (SPEC,
«Peter, the same afternoon», decisions 11, 12 and 13). Three of them are CUTS of Rocoto's own
illustration library; the fourth seat — the one Peter actually described — is **still owed**,
because no route to Ideogram answered from the session that built the sections. Its exact prompt
is written out below, ready to send the moment a route exists.

## The picture that is owed — `bodega-qr`, 16:9

Peter: *«if u can generate the image for that to be the bodega showing a phoen with a wr to a
person. but not a fresh food bodega i mean these bodegas ok?»* — with three photographs: a counter
with a purple QR placard and a customer's phone scanning it; an owner behind a glass counter among
sweets, gum displays and soft drinks; a shop walled floor to ceiling with tins, biscuits, snacks
and cleaning products. **Packaged goods, never fruit, vegetables or fish.**

**WHY IT IS NOT HERE.** Three routes were tried and all three are closed to an unattended session:

- **1Password.** `op` 2.39.0 is installed and the account `peter@soyrocoto.com` is configured, but
  `op item list --vault Rocoto` answers *«You are not currently signed in»*: the vault needs an
  interactive unlock, which a session with no terminal of its own cannot give it.
- **The repository's artwork route** (`mock-api/app/artwork.py`, `POST /api/artwork`). The
  deployed runtime answers `/api/health` with `"artwork":"awaiting key"`, so the house holds no
  `IDEOGRAM_API_KEY` and every call there refuses with `artwork_awaiting_key` by design.
- **A provider connection in the session.** None is attached.

So no generation id and no candidate exists for this seat. Nothing was faked in its place: the wide
box carries an honest cut of a real picture of the same shop (`sales-counter`, below), and this
prompt is what replaces it.

**THE PROMPT, READY TO SEND** (Ideogram 4.0, 16x9, rendering speed QUALITY, magic prompt OFF).
It is the locked frame of `library/illustrations/prompts/hero-bodega-arrival.txt` in the product
repository — the anchor's own Ideogram describe
(`prompts/hero-anchor-describe-2026-09-11.txt`), every style sentence VERBATIM, with only the
subject sentences replaced:

> A stylized digital illustration of a bodeguera showing a square code on her phone to a customer across the glass display counter of her small Lima bodega: she stands behind the counter in a sage apron over a warm cream shirt, holding her phone up with its screen turned toward the customer, and that screen carries an abstract pattern of plain dark squares and blocks, a flat geometric block pattern with no writing of any kind; the customer in a warm cream shirt stands in front of the counter holding their own phone up toward it, its screen turned away from the viewer; both are seen in profile with a calm gaze on the code between them. The glass counter is full of sweets and chocolate bars in plain coloured wrappers; behind her the shelves are packed to the ceiling with bottles, tins and packets with blank colour-block labels; strips of small sachets hang from the ceiling; a drinks fridge stands at the side; morning light comes through the open iron grille door under a red awning, with a bright blue sky beyond. Wide horizontal composition, the counter, the two figures and the phone with the square code in the middle band of the frame. The illustration has a modern, minimalist art style with clean lines and bold colors. The clouds in the background are rendered in a simple, geometric style with pale yellow coloring against the vibrant blue sky. The lighting creates a soft glow effect on the faces of the figures, emphasizing their profiles as they look toward the sky. The illustration has a warm, uplifting mood with its bright color palette and upward gaze of the figures. No text, lettering, logos or brand marks anywhere.

**What to check before accepting a candidate**, judged at the size the box draws it (about 660 px
wide on a desk, 346 px on a phone) and again at 240 px:

- the code on the phone is an abstract block pattern and **encodes nothing**; the customer's screen
  is blank; no lettering, no logo, no brand mark anywhere;
- the shop is PACKAGED GOODS — tins, bottles, packets, sachet strips, sweets — with no fresh
  produce and no fish;
- both figures, the counter and the phone with the code stand whole inside the middle band, so the
  16:9 box and any later cut show the same subject;
- the sky keeps the family's vibrant blue with pale-yellow geometric clouds, and the surface has
  no grain the four accepted covers lack.

**When it lands:** ship `bodega-qr.webp` at 1024 wide and `bodega-qr-sm.webp` at 720, swap the two
`src`/`srcset` values in the `.sbox` on `peru.html` and in the closing card of `peru/sales.html`,
cut a 3:2 square-box crop of it for `who-bodega.webp`, and record the generation id, the response,
the batch and every rejected candidate here, the way the four seats above are recorded.

## `bodega-qr` — generated 20 September 2026, evening

Through the founder's Ideogram connection (organisation `peteran`), Ideogram 4.0, 2560 × 1440,
rendering speed QUALITY, magic prompt OFF, the prompt above sent verbatim, one image per call (a
batch of four is refused on this plan: «not enough quota to submit this batch job»; a second job in
parallel is refused: «too many generations are running»).

- **Accepted — B:** request `0Zp1QpitR0GhyeQi8lu12g`, response `tBQQ-WA1VhGzaB2yHIF55A`, seed
  20260920 (`src/cand-bodega-qr-b.webp`). The bodeguera in profile holds her phone up with an abstract
  block code; the customer's phone is turned away and shows its back; shelves of bottles, jars and
  tins, sachet strips, a drinks fridge, the iron grille under a red awning, blue sky with pale
  clouds; no lettering anywhere. Packaged goods only.
- **Rejected — A:** request `m42G8SUFSB6B0xTO7RZ6oA`, response `Qyqkju3BUKK3FwVW92jnYg`
  (`src/cand-bodega-qr-a.webp`). The customer is drawn from behind with HIS phone's screen facing the
  viewer and carrying the same block code, so the picture reads as two codes; the owner faces the
  viewer instead of standing in profile.

Both carry a fine paper grain the four older covers do not have; B is the closer of the two and is
what the box and the sales page now show. The connection serves the 1024 × 576 rendition only; the
native 2560 × 1440 file is downloadable from the permalink (`https://ideogram.ai/g/0Zp1QpitR0GhyeQi8lu12g/0`)
and replaces these when someone fetches it.

Installed as `bodega-qr.webp` (1024 × 576) and `bodega-qr-sm.webp` (720 × 405) in the wide sales box
on `peru.html`, and cut 600 × 576 from x = 160 as `hero-sales.webp` / `hero-sales-sm.webp` for the
two-column hero of `peru/sales.html`. `hero-tabs.webp` (the hero of `peru/fiados.html`) is a cut of
`accepted/hero-bodega-customers.png`, x = 60…660.

## The four files that are installed

They are CUTS, not generations: the source pictures are Rocoto's own, and the cut is recorded so
any one of them can be re-made. `hero-bodega-*` are the bodega prototype's covers at
`library/illustrations/accepted/` in `/home/peter/wt/bodega-pay-later`, from the same anchor and
the same verbatim style sentences as the four illustrations above; `supplier-van` is this
directory's own. Each cut was judged on a contact sheet at 384 px and 240 px before it was
installed. All four are `cwebp -q 80`.

| File | Pixels | Cut from | The box (x, y, w, h) in the source |
|---|---|---|---|
| `who-bodega.webp` | 690 × 460 | `accepted/hero-bodega-arrival.png` (1024 × 576) | 332, 58, 690, 460 |
| `who-retail.webp` | 690 × 460 | `accepted/hero-bodega-money.png` (1024 × 576) | 110, 70, 690, 460 |
| `who-wholesale.webp` | 690 × 460 | `supplier-van.webp` (1920 × 1080) | 900, 300, 920, 613 → 690 × 460 |
| `sales-counter.webp` | 1024 × 576 | `accepted/hero-bodega-customers.png` | 52, 113, 768 × 432 (re-cut, below) |
| `sales-counter-sm.webp` | 720 × 405 | same | same cut |

**Why these three for the three boxes.** `hero-bodega-arrival` IS the shop in Peter's photographs —
a glass counter of sweets in plain wrappers, shelves packed to the ceiling with bottles, tins and
packets, sachet strips hanging from the rail, a drinks fridge, the iron grille under a red awning —
so the bodega box is in the family the owed picture will join. `hero-bodega-money` is a fish stall,
and a fish stall is a minorista; the page says so itself in the footer («bodegas, market stalls and
fish stalls»). `supplier-van` is the delivery, which is what a mayorista does. `hero-bodega-customers`
is three neighbours at that same bodega counter with the bodeguera serving them, which is the sale
the sales box is about; it is the honest stand-in for the owed picture — the right shop and a real
counter, with the phone and the code still to come.

### THE 20 SEPTEMBER RE-CUT — three pictures, one family

The first three cuts did not read as one family, judged on a contact sheet at 1024 and 390: box one
opened on a teal shop window with two white lozenges in its left quarter, box two was a flat
deep-cobalt sky across its top third — the most saturated thing in the band — and box three was a
cyan street with a white van and two small distant figures. Three skies, three chroma levels, three
subject distances. The re-cut holds all three to one rule: **an interior or a shopfront, one or two
figures at the same distance, and no sky slab.**

| Box | Was | Is | What the cut did |
|---|---|---|---|
| Bodegas | `hero-bodega-arrival` 160, 67 | `hero-bodega-arrival` 332, 58 | starts right of the blue window, so the bodeguera and her shelves fill the frame and the teal slab leaves it |
| Retailers | `hero-bodega-stock` (banana stall, cobalt sky) | `hero-bodega-money` 110, 70 | the fishmonger and his customer, two phones over the ice, tiled wall behind and the corridor's sky cropped away |
| Wholesalers | `supplier-van` 335, 110 (van, cyan sky, small figures) | `supplier-van` 900, 300 | tight on the two figures and the crate at the shop door, the packed shelves behind the grille, sky down to a corner |

Judged on `scratchpad/landing/sections/fix/fam.jpg` at 380 px and again at 240 px, then on the
rendered page at 1440, 1024, 390 and 360. The alt text follows the pictures, in both columns of
`peru/STRINGS.md` (`who.alt.retail`, `who.alt.whole`).

**The sales box's stand-in is re-cut to the family's rule, and the owed picture stays owed.**
`sales-counter` carried the whole 1024 × 576 frame, whose right third is a flat cobalt slab — the
most saturated thing in the band, one section under three boxes whose own written rule is «no sky
slab». The cut is now **52, 113, 768 × 432** of the same frame, delivered at 1024 × 576 and
720 × 405 (Lanczos from the 768-wide cut, `cwebp -q 80`, 41 KB and 31 KB — 8 KB and 2 KB lighter
than the files they replace). It ends at x = 820, thirty pixels clear of the bodeguera, so the blue
is a window strip behind her rather than a slab beside the words, the four figures stand at the
same distance as the three square boxes above, and the packed shelves and the sweet counter fill
the frame. Judged at the size the box draws it — 624 × 313 on a desk, 346 × 195 on a phone — and
again at 240 px, then on the rendered page at 1440, 1024 and 390.

**What the cut does NOT fix, and Peter decides:** the subject of decision 11 — an owner showing a
phone with a QR to a customer — is still absent, and every figure's gaze still goes up (the
anchor's «upward gaze» style words), so on a box headed «Your Yape sales, written down» four people
look at the ceiling. The `bodega-qr` prompt above is written and unrun, because the house holds no
Ideogram key (`/api/health` answers `"artwork":"awaiting key"`). Two ways: ship the re-cut stand-in
now and swap when a route exists, or hold the box until `bodega-qr` lands.

---

# The 20 September night pass — the card on the counter, and the inspector that is owed

## `bodega-qr` — RE-MADE, because the first one had the picture the wrong way round

Peter, looking at the shipped `bodega-qr` (SPEC §17e, verbatim):

> the way that the girl in that illustration literally has the phone facing herself, and she's on
> the same side of the counter as the customer, which looks weird. She should be behind the
> counter, pointing to a QR code or some little card. Do you get it? Usually, that's how they do
> it.

So the subject changes and nothing else does: the owner stands BEHIND her glass counter and POINTS
at a small square code card standing on the counter top; the customer stands in FRONT of the
counter and holds a phone up to that card. Packaged goods, an abstract block code, blank screens,
no lettering, no brand marks.

**THE METHOD IS THE LOCKED ONE.** The anchor's own Ideogram describe carries every style sentence
verbatim — modern minimalist art style, clean lines and bold colours, geometric pale-yellow clouds
on a vibrant blue sky, the soft glow on the profiles, the warm uplifting mood — and only the
subject sentences change. Following this file's third lesson, the anchor's gaze clauses are
subject: the gaze goes to the card on the counter.

Ideogram 4.0 through the founder's connection (organisation `peteran`), 2560 × 1440, rendering
speed QUALITY, magic prompt OFF, one image per call (the plan refuses a batch and refuses a second
job in parallel).

- **Accepted — B:** request `CZDbuk3BRqKv6tJhGFp9gQ`, response `1zckxYS5X0CRb4QB4O9gXg`, seed
  20260922, permalink `https://ideogram.ai/g/CZDbuk3BRqKv6tJhGFp9gQ/0`
  (`src/cand-bodega-card-b.webp`, the native 2560 × 1440 at `cwebp -q 94`). She is behind the
  counter in profile, arm out, finger on a small square block-code card standing on the counter;
  he is in front of it holding a phone up to the card with its screen turned away; the glass
  counter is full of sweets in plain wrappers, the shelves are packed with bottles, jars and tins
  in blank colour-block labels, sachet strips hang from the rail, the drinks fridge stands at the
  right, and the iron grille under a red awning opens on a vibrant blue sky with pale geometric
  clouds. No lettering anywhere. Packaged goods only.

  **THE PROMPT AS SENT**

  A stylized digital illustration of a bodeguera pointing at a small square code card standing on the glass display counter of her small Lima bodega. She stands behind the counter on the right, in a sage apron over a warm cream shirt, seen in clean side profile, her arm reaching out and her index finger pointing at the card. The card is a small square placard standing upright on the counter top between them, carrying an abstract pattern of plain dark squares and blocks, a flat geometric block pattern with no writing of any kind. On the left, in front of the counter, a customer in a warm cream shirt stands in clean side profile facing her, his whole face and profile visible to the viewer, holding a phone up toward the card with the phone's screen turned away from the viewer so only its plain dark back shows. The glass counter between them holds sweets and chocolate bars in plain coloured wrappers; behind her the shelves are packed with bottles, tins and packets in blank colour-block labels; strips of small sachets hang from the rail above her; a drinks fridge stands at the side; the open iron grille door under a red awning lets in bright morning light, with a vibrant blue sky beyond. Wide horizontal composition, bright morning light reaching every corner of the frame, pale walls and a pale floor, the counter across the middle, the two figures on their own sides of it and the small square card whole and unclipped in the middle band of the frame. The illustration has a modern, minimalist art style with clean lines and bold colors. The clouds in the background are rendered in a simple, geometric style with pale yellow coloring against the vibrant blue sky. The lighting creates a soft glow effect on the faces of the figures, emphasizing their profiles as they look toward the small square card on the counter. The illustration has a warm, uplifting mood with its bright color palette and the figures' attention on the card between them. No text, lettering, logos or brand marks anywhere.

**Rejected**

- **A** — request `lNg7TbY7QZavQeANcUEn3A`, response `-ari8_LAVRKI-GtPA4TDhQ`, seed 20260921
  (`src/cand-bodega-card-a.webp`). Two reasons, either one enough. The customer is drawn from
  BEHIND — the back of his head and shoulder fill the left third — which is the same fault that
  rejected `cand-bodega-qr-a` before it, and his phone's screen faces the viewer as a bright white
  slab. And the band is dark: deep browns and maroons under a dim ceiling, against a family whose
  own rule is bright morning light reaching every corner. The corrections that made B are in its
  prompt: «clean side profile», «his whole face and profile visible», «only its plain dark back
  shows», «bright morning light reaching every corner of the frame, pale walls and a pale floor».

**A THIRD PASS WAS WANTED AND COULD NOT RUN.** Candidate C would have pulled the customer back to
the bodeguera's own distance — in B he still stands nearer the camera than she does — and shrunk
the code card, which reads a little like a small monitor on a stand. The Ideogram plan answered
`MCP_DAILY_LIMIT` on that call and on both attempts at the inspector below, so B ships and C is
owed.

**Installed**

| File | Pixels | From |
|---|---|---|
| `bodega-qr.webp` | 1024 × 576 | the whole frame, Lanczos, `cwebp -q 82` |
| `bodega-qr-sm.webp` | 720 × 405 | same |
| `hero-sales.webp` | 1024 × 768 | the 4:3 cut **x = 380, 1920 × 1440**, Lanczos, `cwebp -q 82` |
| `hero-sales-sm.webp` | 640 × 480 | same cut |

`hero-sales` is cut 4:3 on purpose: `.sph-art` is a 4:3 box with `object-fit: cover`, so a 16:9
file would lose a quarter of its width there — which is how the bodeguera's own shelves left the
frame before. The cut was chosen off a three-up contact sheet at x = 200 / 380 / 560, judged at
440 px: 380 is the one that keeps him whole on the left, the card in the centre and her shelves on
the right, with the doorway down to a strip rather than a slab. Judged again on the rendered page
at 1440, 1024, 390 and 360.

## The picture that is STILL OWED — `inspector`, 16:9

Peter (§17e): *«you need to have the fact that they can export to PDF and show their inspector, and
put a little illustration of an inspector.»* The seat is in `peru/sales.html` §4, beside the export
card. **It is empty rather than filled with a picture of something else.** Two calls were made and
both were refused with `MCP_DAILY_LIMIT` — «This is an Ideogram account entitlement issue, not a
transient server capacity problem.» Nothing in the library is an inspector, so nothing stands in.

**THE PROMPT, READY TO SEND** (Ideogram 4.0, 2560 × 1440, QUALITY, magic prompt OFF, one per call).
Same locked method: the anchor's style sentences verbatim, the gaze clauses on the phone between
them, only the subject changed.

> A stylized digital illustration of a municipal inspector with a clipboard at the counter of a small Lima bodega. The inspector stands on the left in front of the glass counter in a plain pale-blue short-sleeved shirt, seen in clean side profile, holding a plain clipboard with a completely blank sheet on it and no writing of any kind. The bodeguera stands behind the counter on the right in a sage apron over a warm cream shirt, also in clean side profile, holding her phone up toward him with its screen turned away from the viewer. The glass counter between them holds sweets and chocolate bars in plain coloured wrappers; behind her the shelves are packed with bottles, tins and packets in blank colour-block labels; strips of small sachets hang from the rail above her; the open iron grille door under a red awning lets in bright morning light, with a patch of vibrant blue sky beyond. Wide horizontal composition, bright morning light reaching every corner of the frame, pale walls and a pale floor, both figures whole and unclipped in the middle band of the frame. The illustration has a modern, minimalist art style with clean lines and bold colors. The clouds in the background are rendered in a simple, geometric style with pale yellow coloring against the vibrant blue sky. The lighting creates a soft glow effect on the faces of the figures, emphasizing their profiles as they look toward the phone between them. The illustration has a warm, uplifting mood with its bright color palette and the figures' attention on the phone between them. No text, lettering, logos, insignia, badges or brand marks anywhere.

**What to check before accepting a candidate**, judged small — the seat is quiet, about 300 px wide
on a desk:

- NO insignia, badge, crest, armband or lettering of any kind: a real body's mark on an invented
  inspector is the one thing this picture must never carry;
- the clipboard's sheet is blank, and the bodeguera's phone screen is turned away;
- both in clean side profile, at the same distance, whole inside the middle band;
- the family's bright morning light, vibrant blue sky, pale-yellow geometric clouds, packaged goods.

**When it lands:** ship `inspector.webp` at 900 wide and `inspector-sm.webp` at 600, put the figure
in `peru/sales.html` §4 beside the export card, and record the id, the response and every rejection
here.

## What left with `/peru/fiados`

`hero-tabs.webp` and `hero-tabs-sm.webp` were that page's hero — a cut of
`accepted/hero-bodega-customers.png`, x = 60…660 — and they are deleted with it. The auto-collect
subject now lives as a COMING SOON block inside `peru/sales.html#auto-collect` and carries no
picture of its own.

## The three product faces on the customer's payment page

`peru/img/faces/azucar.webp`, `leche.webp` and `refresco.webp` are the app's OWN product paintings
(`app/public/paintings/` in the bodega prototype: `azucar.webp`, `leche.webp`, `refresco.webp`),
each 1024 × 1024 in the source, thumbnailed to 160 px and written at `cwebp -q 82` — 910, 1044 and
1470 bytes. They are drawn at 40 px. They are lifted, never redrawn.
