# /peru — the page, its phones and its words

## 22 September 2026 — one illustration style and notification logo padding

Peter, verbatim:

> also can all the images be int he style of the banking image? all the images are cool framings but that style is unique and different ot hem all

> also the logo in the notif doesnt have neough padding around the face inside the little white thing come on

The illustration reference is the fishmonger beside the bank logos (`bank-art-wide.webp` /
`bank-art-tall.webp`): painterly tonal shapes, directional light, subtle brush texture and
natural proportions. Preserve the subject, placement, viewpoint and crops of the bodega,
retail fish-counter, distributor handover and closing bodega illustrations while matching
that treatment. These are narrative illustrations, separate from the real product screens,
phone frames, company/bank marks and product thumbnails. Reuse the banking reference unchanged.
Use the supplied existing images as edit targets and the banking artwork as the style reference;
keep originals/provenance in repository history and publish optimized WebP assets.

Peter subsequently specified, verbatim:

> make sure this is somehow saved as OUR style get it?

The company's `brand/illustration-style/README.md` now owns this as the Rocoto narrative
illustration style, with the banking reference, full-resolution examples, exact prompts and
asset checksums. `BRAND-KIT.md` and the canonical index point to it; the website README and
asset record link back. Four composition-preserving edits were made with built-in image_gen,
then exported at the existing dimensions as WebP q82/method6. The reference remains unchanged.

The notification screenshot shows the face filling its white rounded tile too tightly. Preserve
the previously requested 60px tile and give the face optical inner padding. Regenerate both
languages and both sizes of affected repayment posters, retaining the live/still match.


Verified the four scene exports in both languages at 390 and 1600px. The original subjects,
people/phone counts, handover action and responsive framing remain intact. Their combined
WebP payload is 201,554 bytes, with the banking reference untouched and existing lazy loading
retained. Full-resolution masters and exact prompts stay in the company brand folder.

The notification tile remains 60×60px. Its SVG renders in a centered 46px box; the SVG's native
whitespace gives the visible face approximately 10.7px optical top/bottom padding. Inspected
live mobile playback and the desktop reduced-motion poster. Regenerated EN/ES repayment
posters at 780×1688 and 520×1126; the four total 108,808 bytes. No additional runtime is loaded.
Hosted preview: https://rocoto-6gbjule1d-rocoto-labs.vercel.app. Its nine changed public assets
match the reviewed artifact, and both languages pass the same mobile/desktop checks. The company
style guide, references, masters and prompts were committed in company revision `3bcf2eb`.

## 22 September 2026 — visual roadmap sheets

Peter, verbatim:

> what we had the ventas page before LOL and then they dissapeared.. lol

> is this the best it can be and why arent there the visual things? eash thign here should have a visual thign in it, fuck. otherwise we suck. its so much text idk.

The supplied screenshot shows the Sales sheet repeating its explanation in an introduction,
body paragraph, example box and note, with no product visual. Replace these text examples in
all four sheets with one substantial product composition each, one short introductory sentence
and only the necessary qualification. Sales: restore the original WhatsApp selling phone from `peru/sales.html`, including the
customer payment page. Tabs: restore its original automatic-collection list, with two settled
customers and three upcoming dates. Receipts: the same sale as
a clearly marked draft boleta. Credit: the existing S/386 invoice, supplier payment today and
repayment in seven days, alongside the early offer and approval conditions.

Provenance: existing website `peru/demos/tienda.html` seeds and `pages.js` document/payment
components; the pinned bodega prototype at revision `1e6f5f3e` supplies the product theme and
money-credit balance hierarchy. The prototype's fiscal issuance is absent. These compositions
are website proposals for planned functionality; keep “In preparation” visible and the receipt
in draft state. Use Inter, white/ink product surfaces, inline currency and the existing grocery
thumbnails. Reuse the existing lightweight demo player for the restored phone; native HTML/CSS for the
other three, with a short entrance that settles and reduced-motion static end states,
lazy images, native dialog focus/history and the existing no-JavaScript fallback. Inspect all
four sheets at 390 and 1600px and check 320px fit before publishing.


Verified both languages at 320, 390, 768 and 1600px: each sheet contains its visual, stays
within the viewport width and retains native focus, Escape, Back/Forward and reload behavior.
Closed sheets request neither the sales demo nor the product font/thumbnails. Only the open
sheet's phone plays; closing detaches its document. A delayed readiness callback is now invalidated
on detach so reopening retains the poster until the fresh demo is ready. Reduced motion,
scripts off and browsers without native dialogs show the completed sales still. The collection
list announces only the final payment state. Existing first-paint/failed-image tests and the
translation, TypeScript, link and public-build/route gates pass. Screenshots of all four panels
were inspected at 390 and 1600px. These additions reuse existing imagery, fonts and demo code.
Final preview: https://rocoto-n9z1ajr1l-rocoto-labs.vercel.app. The rebuilt artifact includes
the concurrent Android 0.5.0 download from `f9115c4`, verified byte-for-byte with its download headers.

## 22 September 2026 — centred mobile stories and decisive payment confirmations

Peter, verbatim:

> probably mobile should be centred no? the text? or?
>
> also the pago enviado and all that shit should probably be bigger confirms and like idk jsust design better stuff?
>
> bigger tick. idk. how does monzo/revolut/paypal etc do these payment confirms etc??? super clear shit. no?
>
> basically SOTA with the same apple pay feel...

Centre mobile story text with its phone, keeping the heading-first sequence and desktop's
alternating layout. Replace the small inline payment-status treatment with a clear completion
moment: a prominent check, explicit status, amount and recipient, then secondary repayment
information. Keep processing distinct from success and retain the invoice review before
confirmation. Use the existing Inter, ink/white/neutral product tokens and deterministic demo
clock; motion must settle cleanly and respect reduced motion. Apply the same hierarchy to
WhatsApp receipt previews and the credit-repayment result. These are website demonstration
states and a web-to-app design proposal; the product runtime remains separately owned.

Reference anatomy and decisions:

- [Apple Pay support](https://support.apple.com/en-us/102626) documents a checkmark and “Done”.
  [Apple's feedback design talk](https://developer.apple.com/videos/play/wwdc2019/223/) describes
  coordinating the completion animation and feedback. Apply one short tick draw, then hold the
  result. This website uses visual feedback; native haptics/sounds are outside this task.
- [Revolut Reader guide, p14](https://cdn.revolut.com/pdf/Revolut%20Reader%20User%20Guide.pdf#page=14),
  viewed: a large outlined check, status, amount, receipt link and one main action in a white
  sheet above the dimmed form. Apply that hierarchy using Rocoto's neutral product palette.
- [PayPal QR guide](https://www.paypalobjects.com/marketing/web/ee/qrcode/QRC_Display_Consumer_Facing_en_EE.pdf),
  viewed: the payment illustration emphasizes amount and paid status. Keep those readable in
  the scaled handset. Its illustration is a reference, rather than a current-app audit.
- [Monzo's design principles](https://monzo.com/blog/2022/11/04/how-we-design-magic-moments-at-monzo)
  describe selective expressive moments. Use restrained completion motion; their embedded
  animation was unavailable, so no visual claim is made about that specific screen.

The WhatsApp receipt check grows from 21 to 56px, invoice confirmation from 24 to 88px, and
repayment has a 104px result mark. Amounts in both app results use 56px type. Processing and
success share their geometry. Success checks are driven by the existing demo clock, including
forward/reverse seeks; reduced motion displays the complete mark. The receipt's future date
is explicitly labelled “Devuelves el crédito el”. Repayment shows its result for four seconds
before the invoice action; the invoice keeps its original product document structure.

Verified EN/ES centred stories at 320, 390, 768 and 899px, with desktop controls at 900/1440px.
Viewed the real landing at 390/1600px with both new result screens. All review, processing,
confirmation, repayment and invoice states fit; the amount and currency stay on one line.
Three repayment cycles retain their own totals and suppliers. Forward/reverse seeks agree;
processing never shows a success tick. Four-times CPU playback crosses the new states and
cycle boundary; reduced motion shows a completed static check. The outgoing lock screen's
brief top strip clears with its existing slide transition. The 14 readiness cases, held/failed
image regressions, translation, TypeScript and 14 public-build/route tests pass. Regenerated
the English and Spanish buying posters at both existing sizes. Preview:
https://rocoto-hdq4i1a4d-rocoto-labs.vercel.app.


## 22 September 2026 — mobile story hierarchy and repayment third

Peter, verbatim:

> mobile arrnagement allignment etc is super bad. also the Cuando Compras, is that really the best best header? and the fecha de pago thign should be 3rd. but also it's not really saying bmuch and then they all rely on extra 2 sentences. we can be sharper no? mor

The screenshot shows a narrow single-column page with the buying phone above centered copy,
long explanations and large gaps before the next handset. Read the trailing “mor” as a request
for further sharpening. Arrange the stories as Buying, Invoice payment, Repayment. Each gets
a self-contained heading and one supporting sentence. Mobile reads heading, sentence, phone,
with a shared left text edge and a shorter gap within each story than between stories.
Keep the handset's existing size and geometry. The final repayment phone now carries the
turn into the roadmap so the reordered delivery phone cannot fly across the repayment copy.

Spanish headings: “Compra a crédito por WhatsApp”, “Paga tu factura con una foto”,
“Pago automático desde Yape”. Each has one supporting sentence. The old mobile font override
was earlier than the default heading rule and therefore lost; the new rules set 36–56px type
within the mobile story layout. Copy precedes the phone in DOM and visual order. Phone spacing
is 32–40px within each story, with the existing larger separation between stories.

EN/ES checks pass at 320, 390, 768, 899, 900 and 1600px: story order, text gutters,
phone centering, no horizontal overflow, deferred initial hero, reduced motion and console.
Viewed Spanish screenshots at 320, 390, 768 and 1600px. Scripts-off content remains readable.
The loading regression now holds the repayment poster and verifies that its turned frame stays
hidden until the complete phone can paint. TypeScript, translation, repository links and the
14 public-build/route unit tests pass. Preview: https://rocoto-68omvy73c-rocoto-labs.vercel.app.


## 22 September 2026 — full-size Rocoto notification picture

Peter, verbatim:

> also the profile pic of rocoto should be the size of the notif not smalt

The collection notification's 38px icon added 5px padding to a logo that already contains
whitespace, leaving a visible face only about 23.5px tall beside 61.5px of text. Give Rocoto
a 60px tile with zero added padding and enlarge the existing SVG within it so the full face
fills that height. Scope the sizing to Rocoto and keep the existing paper background. Refresh
both languages' collection posters at their existing responsive sizes.

The tile is 60×60px; the complete face paints about 56px high. EN/ES notifications across
all three purchase cycles fit their text, and the tap/open transition keeps its timing and
target. Viewed the real landing at 390/1600px and regenerated both languages' 780px and 520px
posters. The existing SVG is reused. Preview: https://rocoto-9pu8u4t4p-rocoto-labs.vercel.app.

## 22 September 2026 — lower the phone scroll locks

Peter, verbatim:

> the frames are a taaad on the high side int he place they lock during scrolling

The supplied screenshot shows the travelling buying phone held above the viewport's centre.
Centre both desktop phone locks in the available vertical space, changing the free-space
factor from 45% to 50%. This lowers them subtly while retaining the 92px top clearance and
their existing section handoffs. Mobile uses its existing in-flow layout.

Viewed forward/reverse handoffs and both locks at 1600×1000 and 1440×900. The phones move
down 19.16px and 14.16px respectively, stay fully inside the viewport, and meet the buying
dock within 0.005px. The 390px mobile layout retains its in-flow phones. Preview:
https://rocoto-cjevbzsfn-rocoto-labs.vercel.app.

## 22 September 2026 — clean phone frames

Peter, verbatim:

> why are there pause buttons and text under each frame, so shit and sloppy.

Remove the landing phones' demo captions and reader playback controls in both languages.
The frames remain product illustrations. Keep automatic playback in their content sections,
offscreen/tab pausing and reduced-motion stills. Move the existing journey playback policy
out of caption visibility: the hero stays still until docked at Buying, and delivery stays
still while turning toward the roadmap. Removing presentation must preserve initial loading.

Removed all four landing captions and the control-script request from the English source and
generated Spanish page. The main phone player now owns still/playing state directly. Checked
390/1600 px in both languages, initial unloaded hero, row playback, offscreen pause, mobile
resize and reduced motion. A delayed delivery iframe that becomes ready while turned pauses
at its scene's poster frame. Screenshots were viewed; translation and public-build gates pass.
Preview: https://rocoto-8kjb7oqeu-rocoto-labs.vercel.app.

## 22 September 2026 — stable first paint and lighter loading

Peter, verbatim:

> why put anything int he navbar at all
>
> things load buggilybtw. we can see the structure of stuff. feels not the lightest it can be

Follow the preceding navigation simplification: the home header keeps the brand and signup
act, with language selection in the footer. Fix the observed loading defects rather than
covering the page with a loading screen. Preserve the working phone journeys and invoice demo.

Reproduced on cold, cache-disabled 1.6 Mbps/150 ms connections with 4× CPU throttling: a visible
empty handset frame precedes its poster, and already-painted title/nav content disappears when
the deferred entrance animation begins. Delaying `peru.js` also exposes all four closed
feature dialogs in normal document flow; initialization then removes about 2,052 px of page
height. Native dialog fallback must expose only the requested detail, never every closed sheet.
An animated logo served at 24–44 CSS px downloads a 115 KB GIF; the hero's 780px poster costs
about 89 KB despite painting at 218–275 CSS px. Optimize those owned assets at useful resolutions.

The loading correction keeps text static on first paint and applies reveals only to offscreen
content. A small synchronous image gate reserves each handset's geometry and reveals the
complete plate/screen after decode. Live demonstrations wait for required imagery and fonts;
failed required assets retain the complete still. Logo animation uses the existing open/closed
SVGs at the GIF's original timings, pauses in hidden tabs and honors reduced motion. Responsive
520px posters keep the original higher-resolution source available through `srcset`.

`tools/test_peru_loading.mjs` reproduces the old closed-sheet flash against the live pre-fix
release and passes locally for held script/poster requests on desktop and mobile.
`tools/test_demo_readiness.mjs` fails against pre-fix `wa.js` when the invoice is delayed;
14 corrected readiness cases cover delayed fonts/images, required-image failure, optional
bank fallback, manifest-assigned imagery and cold/cached playback in both languages.
The full Python suite retains its two pre-existing Spain legal-generator path assertions.

First-paint screencasts also caught a paint race beyond the held-request tests: a decoded
image could precede its blocking stylesheet, then paint asynchronously after the CSS frame.
The gate now validates both images, requests synchronous painting and waits two animation
frames for styled layout. Viewed throttled frames show paper followed by the complete phone.
Failed plate/poster tests keep the unfinished handset hidden even if its iframe reports ready.

The rotating handset retains thirteen coarse poses and one-degree poses within eight degrees
of the current angle. Two fetch/decode jobs run at once, stale callbacks are discarded and
returning to the delivery position releases fine-pose references. The durable local-assets
regression covers delayed responses, rapid reversals, exact angles and reference/request bounds.
Chrome can retain decoded caches after references are released; this is not an absolute browser
memory cap. A complete slow traversal can still download the full sequence.

English and Spanish header/footer/sheet checks pass at 320, 390 and 1600 pixels, including
held-script scrolling and opening a detail before initialization. TypeScript, 13 public-build/
route tests, the 381-unit translation gate and the repository link gate pass. Preview
https://rocoto-7s42kacy0-rocoto-labs.vercel.app passes the 163-route comparison with zero
unexplained differences. Its sign-in callback matches production after removing only Vercel's
injected preview-feedback script.

The final preview, https://rocoto-fcjce5z6i-rocoto-labs.vercel.app, adds an opacity guard to
the same phone gate: a turned canvas explicitly sets its own visibility and could otherwise
escape the inherited hidden state. The held-delivery regression now exercises that real turn;
viewed before/after screenshots and the complete first-paint regression pass.

Hosted cache-disabled measurements, normal motion and no scrolling at load + 1.8 seconds:

| Page and viewport | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Spanish, 390 px | 287,100 B | 148,587 B | 48.2% |
| English, 390 px | 283,964 B | 147,368 B | 48.1% |
| Spanish, 1600 px | 320,350 B | 175,718 B | 45.1% |
| English, 1600 px | 316,082 B | 173,572 B | 45.1% |

No GIF or turn-frame request occurs in those initial-view checks. Real throttled screencasts
show paper followed by the completed handset, with no intermediate frame or screen scaffold.
Both languages' reduced-motion and footer-menu checks pass. Measurements exclude hosting
preview instrumentation; image choice still varies with viewport and device-pixel ratio.

## 22 September 2026 — one page, roadmap details and early invitation

Peter, verbatim:

> yeah and what do i put ont he website. maybe we put each of those things linked to the things int he roadmap, as modals. get it? maybe that;s best. no subpages per se apat form privacy etc. to keep it super clear/
>
> yeha do it. super good feel ok? execute it all.
>
> and the script, can you give that to me again in a way also that wouldnt make them get scared of scams or something as its cold.
>
> and when do i tell them what it is. i wann ahevt he brand feel of blomfield which is mildly aspirational that thyere almost getting gifted this system

This authorizes implementation of the preceding strategy: one Peru marketing page, a credit-led
offer and waitlist CTA, with optional roadmap sheets for sales, fiados/collections, boletas and
credit. Historical Selling routes return to the roadmap in the visitor's language. Legal,
account and signup routes retain their jobs. The main offer keeps the agreed three seven-day
credits at 0% interest, up to S/500 each, with assessment and approval stated alongside it.

Feature availability follows current evidence: joining is available; POS, automatic collection,
boletas and lending are being prepared. Replace the earlier speculative months and "Yape sales
today" claim. Explain how sales/payment history helps assess credit without exposing unselected
voice/OCR/hardware implementation. The existing hero and delivery phone journeys remain.

Use the current paper/ink tokens, light display type and quiet native-dialog motion. Sheets
open from the roadmap, preserve reading position and return focus, work with Back/Escape,
and honor reduced motion. Core credit terms remain on the page. Plain links expose the same
details with scripts off. Native browser behavior keeps this small and framework-free.

The generous feel comes from the real signup offer and invitation to try the service early.
The phone POS has no established free price; avoid inventing one. The company-owned
[call script](https://github.com/Rocoto-Labs/company/blob/main/outward/cold-sales/peru-pos-credit-waitlist-2026-09.md)
identifies Peter, Rocoto and the product immediately, offers the real domain for verification,
and asks one low-pressure shop question at a time. No outreach is sent by this task.

### Implementation and verification

Implemented in the static English source and generated Spanish page. Four native dialogs use
the current paper/ink palette; desktop sheets open from the right and phone sheets from the
bottom. Hash URLs support direct links, reload and browser history. Keyboard focus stays within
the sheet and returns to its opener; Escape, close controls and intentional backdrop clicks
dismiss it without losing the reading position. Background demos pause. Recycled demo iframes
use replacement navigation so their attach/detach cycle adds no entries to browser history;
sheet dismissal settles its history transition before resuming playback. Reduced-motion users
get immediate transitions; scripts-off and unsupported-dialog browsers get readable inline
details. Core offer conditions remain inline.

Verified English and Spanish at 1440, 390 and 320 pixels: all four sheets, Tab containment,
Escape, focus restoration, scroll preservation, Back/Forward, reload, shared links, overflow
and console checks. Normal-motion desktop/mobile behavior and fallback rendering were checked
separately. Screenshots were viewed. The generated translation gate covers 383 units; TypeScript,
13 public-build/route tests, the site link gate and the 128-route switch check pass. The latter
checks 38 unchanged functional routes and 2,460 internal links. The existing Spain legal gate
still reports its three baseline stale-generation/old-path failures; this change leaves those
Spain sources and generated documents untouched.

The HTML/CSS/JavaScript addition totals about 2.3 KB gzip and adds no framework or new runtime
dependency. The removed standalone Selling box also removes its lazy-loaded photograph from
the home page. Public build strips internal authoring comments and excludes private records.

Final preview: https://rocoto-ddjkrfsp0-rocoto-labs.vercel.app.
The preceding preview https://rocoto-py0tqoprc-rocoto-labs.vercel.app passed the full
163-route comparison with all six expected redirects and zero unexplained differences.
The final preview adds the verified demo-history correction; routing and page content are identical. Hosted browser checks cover both
languages, sheet controls, a shared credit link, a legacy Selling redirect with its query
parameter, and 404 responses for private source/specification paths. The route comparison uses
explicit expectations for all six 308 migrations and edited home/legal pages, including the
English home alias `/en/index.html`. Vercel injects its review toolbar into the short preview
sign-in callback: stripping only that known preview script produces a byte-for-byte match with
production and the built artifact. The callback source and behavior are unchanged.

## 22 September 2026 — selling is payment links for each sale

Peter, verbatim:

> # Apunta tus ventas Yape
>
> this feels wrong for the sales thing. its that it sends yape links in whatsapp. also they can enter their inperson sales and it generates the yape link for that too.
>
> it's literally likeondemand shopify. idk how best to do it.
>
> what do u think

Product clarification: incoming WhatsApp orders and merchant-entered in-person sales both
produce a customer payment link. The sales page should lead with creating and collecting the
sale; the saved sales record follows that action. "On-demand Shopify" is Peter's positioning
reference, not approved customer-facing wording or a claim of additional storefront features.
This entry records the discussion; replacement copy and page changes have not shipped.

## 22 September 2026 — public-source and browser-copying threat

Peter, verbatim:

> and yeah aboutt he secutiry of other solo preneurs, vibe coders, people with custom codex and claude code setups. how can we block anything?
>
> but alsoliterally getting the source in auseful way. for example, making it browser rendering so they cant just use playwright etc.
>
> stop screenshots posisble?
>
> is there ay ocr spoofing method?
>
> and still be light as fuck. badically i dont want people reverse engineering this work right now. and i want it to be superlight. this is like codebase conventions and public coding conventions no?
>
> what;s WAF

Protect private authoring material and investigate available bot controls. Canvas/WebGL reduces
semantic DOM extraction but still renders into a browser that automation can capture. Browser
screen-capture permissions govern the page's own capture API, not operating-system or automation
screenshots. OCR distortion has no dependable protection against modern visual models and would
degrade reading/accessibility. Do not represent obfuscation, bot detection or watermarking as
copy prevention. Keep valuable private logic and data behind authenticated server boundaries.
The repository README records the publication and lightweight-frontend conventions. Prefer
hosting-edge filtering over browser anti-copy scripts. WAF means Web Application Firewall;
its rules run at the edge, while client-side bot verification is a separate integration choice.

## 22 September 2026 — business-credit language and transaction views

Peter, verbatim:

> did u learn from cuotealo? is that the right wording about this shit or is it consumer wording?
>
> what about 0% interest and shit like that? i dont wanna soudn awkward
>
> across the whole thing
>
> and the confirmations etc think about the feeling of the views. the color. the AI slop text. what shoudl be test or icon. etc. SOTA fintec

Scope: both Peru marketing pages and all their demonstration screens, in English and Spanish.
App/onboarding implementation remains with the separate handoff. Review copy, hierarchy,
colour and icon use as one transaction experience. Keep the lighter offer placement, handset
journeys and established product components.

Cuotéalo explicitly describes personal credit for instalment shopping. Borrow its plain
transaction vocabulary; use Rocoto's own business context: suppliers, stock, invoices and
payment dates. BCP's business page uses buying stock and paying suppliers to describe working
capital. The early offer is expressed as 0% interest to the customer for three seven-day credits
of up to S/500 each. Supporting terms continue to explain that Rocoto covers interest and fees
and the customer repays principal. This is customer pricing, not a claim about the lender's
underlying contractual rate.

Transaction grammar: amount and counterparty first; a short factual state; exact costs and
repayment date before commitment; one explicit action. Icons support state and familiar controls,
while amounts, dates and consequential actions retain words. Product ink/white/neutral surfaces
remain; colour is not the sole status signal. Remove duplicated success prose and explanatory
interface narration. Preserve separate meanings for paying a supplier and repaying credit.

References checked: [Cuotéalo](https://www.viabcp.com/cuotealo),
[BCP business finance](https://www.viabcp.com/pymes/financiamiento/financiamiento-para-tu-negocio),
[Monzo Business](https://monzo.com/business-banking), [Wise Business](https://wise.com/gb/business/).

Implemented: one 0% offer across Buying, Selling, FAQ and terms; separate supplier-payment and
credit-repayment labels; explicit interest, fees and date in the review sheet; a compact receipt;
neutral copy feedback; quieter captions with accessible playback controls. Pausing preserves the
exact transaction across offscreen returns. Reduced-motion views keep the still posters.
The hero waits until its visible demo caption before loading the conversation runtime; fresh
mobile and desktop hero checks make zero demo-runtime requests. Invoice photos load only their
selected language. All eight EN/ES posters were refreshed and compressed as WebP.

Verification: EN/ES payment states and repeated loops, reverse seeking, keyboard controls,
reduced-motion changes and 320/390/1280/1600 layouts. The 352-unit bilingual gate, TypeScript,
Markdown links and eight publication tests pass. Two existing Spain legal-generator tests and
three existing legal-gate assertions remain failing; their inputs are outside this change.

## 22 September 2026 — invoice payment drawer

Peter, verbatim:

> for the invoice thing ideally there;s a slideout thing that confirms the paymetn etc... like all that stuff seriously done. come on

Website scope: complete the photographed-invoice demonstration in On delivery. Keep the invoice
visible behind the product's bottom-docked workflow sheet. Show payment review, explicit
confirmation, processing, supplier-paid receipt, then the invoice with its repayment scheduled.
The example uses the early offer above: S/386 principal, seven days, S/0 interest and fees,
automatic repayment on September 26 for the September 19 invoice. The original invoice and
all amounts agree. This remains a timed website demonstration, with no payment submission.

Reuse the product's Inter type, white sheet, ink CTA, 16px top corners and docked workflow
transition. Keep review and receipt readable, support reverse seeking and repeated playback,
and show a still review frame for reduced motion. English and Spanish have the same states.

Verification: both languages render all seven states; two complete playback cycles keep seven
page nodes. Reverse seeking and reset restore the camera and clear the drawer. The entering
sheet transitions from below; processing animates only while active. Reduced motion holds the
review frame. Source screenshots pass at 320, 390, 1280 and 1600px; the offer is weight 400.
The bilingual/link gates, TypeScript and all seven public-build tests pass. The two existing
Spain legal-generator test failures and three legal-gate failures remain unchanged from 1621b4f.

## 22 September 2026 — lighter hero offer

Peter, verbatim:

> put the creditos thing in place of the "para bodegas" and not sothick...

Replace the audience/status paragraph and separate offer card with a normal-weight offer sentence
in the status paragraph's existing position below the actions. Put the per-loan cap and terms link
on a smaller supporting line. The FAQ and terms retain the principal-repayment explanation.

## 22 September 2026 — website feedback

Peter, verbatim (website scope):

> paga despues ahi mismo is wrongwording wise. it can defo be better said.
>
> can u make the phone go from the middle int he hero to the first "Cuando compras" section.
>
> then, the 3d sideways phone animate that from the "en la entrega" to be sideways next to the timeline?
>
> and then it has to be clear that they get 3 free 1-week loans up to 500 soles (that;s a fine point) when they join early. get it? whatever way uber eats would promo that shit.
>
> See this product and tell me what language, wording, phrases we can copy from them: https://www.viabcp.com/cuotealo
>
> “Lo que abre tu cliente” should be in a phone frame
>
> The website source code shows notes!! Fuck!!! And we have to make it impossible for other people’s Claude codes to copy it. Can it be screenshotproof for Mac/windows/mobile also? There is a real threat here of peoplerunning their ai to grab and figure out he depth from the public stuff.
>
> please take ths stuff for the website. onboarding an dapp related stuff give it back to me so i can give it to another session

Implementation scope: the current bilingual Buying and Selling site, based on `195db91`.
The hero handset travels face-on into When you buy. The delivery handset supplies the baked
sideways turn beside the roadmap. Scrolling backward restores both; reduced motion retains
readable static phones. The customer payment note uses the existing handset frame.

The early signup offer is three seven-day loans, each up to S/500, with Rocoto covering
interest and fees. Principal is repaid after seven days. This directive supplies the previously
unset amount and term and supersedes earlier copy advice that withheld those details. Present
the offer as the early signup benefit for the planned launch, alongside existing credit approval
and supervised-provider disclosures. The heading carries the offer; the amount qualifies it.

Public packaging removes internal HTML, JS and CSS commentary and excludes private source,
specifications and source maps. Delivered interface code and visible pixels remain inspectable;
the website makes no screenshot-prevention or copy-prevention guarantee.

Copy reference checked on September 22: [BCP Cuotéalo](https://www.viabcp.com/cuotealo).
Useful short phrases: «financia tus compras», «fecha de pago», «confirma tu préstamo».
The reusable pattern is a familiar verb plus the specific purchase/payment action. Rocoto's
statement becomes «Ya compras y vendes por WhatsApp. Con Rocoto, también pagas a crédito.»
BCP-specific claims about instant approval, rates, instalments and extra cash are specific to
that product; they supply no evidence for Rocoto's offer or capabilities.

The complete original brief and the separate onboarding/app handoff live in the company subject:
[September 22 handoff](https://github.com/Rocoto-Labs/company/blob/main/notes/bodega-signup-connect-flow-2026-09/handoff.md).

Verification for this revision: TypeScript passes; all seven public-artifact regressions pass;
the bilingual gate checks 354 units across five pages. Desktop motion was checked at 900, 1280
and 1440px, including reverse scrolling, window resizing and a changed reduced-motion preference.
Mobile at 320 and 390px and scripts-off/reduced-motion modes retain static readable layouts.
Screenshots were inspected at 1600 and 390px. The customer note's whole 390×844 document fits
inside the original handset frame.

The hosted sanitized preview preserves status and redirect behavior across all 163 route probes.
All 130 HTML files retain the same visible text after packaging. Public specification, editable
source, translation JSON and source-map probes return 404. HTML comments and source-map references
are absent from the artifact. An independent review found zero excluded direct asset dependencies.
The two existing legal-generator unit-test failures and three existing legal-checker failures
reproduce on the starting revision after the earlier Spain path move; those files are unchanged.

## 20 September 2026 — TWO LANGUAGES: Spanish at the root, English under /en

Peter, verbatim:

> please make it in spanish as a snapshot of this finalised version and put the english one under
> .com/en and put a language dropdown in the navbar by the CTA

The design, in ten lines.

1. **English stays the source.** `peru.html`, `peru/sales.html` and the three legal files are the
   files a builder edits. They keep their names, their assets and their addresses inside the page,
   and they are served under `/en`, `/en/selling`, `/en/privacy`, `/en/terms`, `/en/cookies`.
2. **Spanish is generated**, into `peru/es/{index,selling,privacy,terms,cookies}.html`, by
   `tools/peru_i18n.py`. Nobody hand-edits one; the first line of each says so.
3. **The words live outside both.** `peru/i18n/en/*.json` is the extraction a translator reads;
   `peru/i18n/es/*.json` is what they write back, keyed by the exact English string.
4. **URL paths are English in both languages** (company canon): `/selling` in Spanish,
   `/en/selling` in English. The root is Spanish because Peru reads Spanish.
5. **The build does the rest of the move:** `lang="es-PE"`, `og:locale`, the canonical and
   `og:url`, the hreflang pair on both languages, every in-page address from the `/en` world to the
   root one, `?lang=en` → `?lang=es` on every demo, a `-es` poster and a `-es` share picture the
   moment each file exists.
6. **Two units are generated, not translated as markup:** the dark band's sentence (one span per
   letter, the WhatsApp glyph, the aria-label) is carried as a plain sentence with `{wa}`, and the
   H1 (one span per word) as a plain sentence with `{br}`. Both re-render their English byte for
   byte, which is how the codec is proved.
7. **`check` is the gate**, and it is red on: a unit with no twin, a twin nobody asks for, a
   generated file that is not what `build` would write, an English unit still standing in a
   Spanish page, a twin that drops an icon placeholder, a unit that fails to round-trip, and a
   language control that is not what `lang_control()` writes.
8. **The language control sits in the nav, beside the act and before it** — a `<details>` pill
   showing this page's code (EN / ES) over a two-row card, «Español» then «English», each pointing
   at the SAME page in the other language. It opens without moving anything, closes on an outside
   click and on Escape, and carries the current `#hash` across.
9. **Below 360 px the control is a door, not a menu:** the other language's two letters, linking
   straight there. Both are in the HTML; the stylesheet shows one.
10. **The nav's act in Spanish reads «Únete a la lista»**, at every width. The body's acts keep
    «Únete a la lista de espera». That is a measurement, not a taste — see the table.

### What the Spanish build settled

Written after the five pages were assembled and read, viewport by viewport, at 1440 · 1024 · 390 ·
360 · 320 in both languages.

1. **The whole Spanish page is 19 px shorter than the English one** (12 618 against 12 637 at
   1440). Spanish running longer is a sentence-level fact, not a page-level one, and the design
   absorbed it everywhere: zero horizontal overflow on ten pages at five widths, zero console
   errors, zero failed requests.
2. **Four Spanish headings take one line more than their English twin**, and none of them pushes a
   layout: «Cuando compras» (2 against 1), «Lanzamiento completo: crédito en WhatsApp» (2 against
   1), «Únete a la lista de espera» in the closing card (2 against 1), and «La exportación para
   una fiscalización» (3 against 2). The last is the only three-line heading in either language —
   and «Connect the account you already use» is three lines in ENGLISH, so three is inside what
   the design was drawn for. `fiscalización` is SUNAT's own word for the thing and there is no
   shorter faithful Spanish, so it stands.
3. **`check` had to be re-cut before it could be honest.** Its third rule searched the whole
   generated file for the rendered English, which finds the English inside a comment the source
   keeps on purpose (Peter's own quotes, builder notes for counsel) and inside a class name —
   `class="ssoon"` contains «soon». It now READS THE GENERATED PAGE BACK with the same extractor
   and compares copy against copy. Proved red on purpose: putting one Spanish heading back to
   English names it twice, at the heading and at the footer link that repeats it.
4. **`build` was failing open.** It promised «every twin required» and then wrote a half-English
   page and exited 0; `--allow-missing` wrote the same bytes. The plain verb now exits 1 and says
   how many units have no twin.
5. **One English sentence was saying two things in Spanish**, and it was the credit one. The
   Selling page had «compras con paga después» for the feature the whole site calls «pagar
   después», and «hasta un monto por cada una», which drops the *set* in «up to a set amount
   each» — the cap is the part RS SBS 3274-2017 art. 24 cares about. Both pages now carry the
   Buying page's sentence word for word. The footer credit had the same shape: «Modelo 3D del
   teléfono» on one page and «del celular» on the other, for one English word, on a page that says
   «celular» seven times. Both say «celular».
6. **Three assets were shot in Spanish**: the four demo posters (`peru/demos/posters/*-es.webp`),
   the share card (`peru/og-peru-es.jpg`) and the photographed invoice
   (`peru/demos/av/invoice-counter-es.webp`). The build swaps each in the moment the file exists,
   so nothing had to be wired by hand.
7. **The share card is shot whole in Spanish and the English one is not re-shot.** The English
   card was made from `vender.html`, a demo that has since left the site, so re-running it would
   quietly change a finalised English asset. `peru/tools/og.py --lang en` re-renders the English
   LEFT COLUMN only and pastes it onto the shipped card's own handset pixels, which is how the
   type layer is checked (mean difference 0.35 of 255 — JPEG noise). Spanish is shot whole,
   because a Spanish link preview cannot hold a phone full of English chat; its handset plays
   `compras.html` in Spanish.
8. **The photographed invoice is one template in two languages.** `peru/tools/shoot_invoice.py`
   holds the Spanish twin of every printed word and stops the shoot if a word it expects is no
   longer on the paper, or if a label outgrows its box. The supplier, the R.U.C., the series and
   number, the date, the four lines, their amounts and S/ 386.00 are the same document in both.
9. **The handset still flies on the Spanish page.** At 1440, scrolled 0 → 2300 in 100 px steps:
   it lifts to `fixed` out of the hero's foot, turns as it crosses to the left, holds edge-on at
   x = 105 from 1000 to 1400 beside the fully lit sentence, turns back, and returns to `relative`
   docked in row one by 2200.
10. **What is still English on the Spanish page:** `peru/cap/pedido-escritorio*.webp` and
    `peru/cap/pedido-movil-sm.webp`, the two baked captures of the Rocoto app under «Cada pedido,
    anotado para ti». They are screenshots of the product, so they follow the app's language, not
    the site's. Everything else in every phone on both pages is Spanish.

### The bar, measured

Chromium, DPR 1, the nav's four objects and the right edge of the last one against the viewport.
Spanish was measured with the brief's placeholder labels injected («Comprar», «Vender», and each
act label in turn); the translators supply the real ones.

| language · act | 1440 | 1024 | 768 | 520 | 390 | 360 | 320 |
|---|---|---|---|---|---|---|---|
| English · Join the waitlist | 1394 / 46 | 991 / 33 | 743 / 25 | 498 / 22 | 374 / 16 | 344 / 16 | 308 / 12 |
| Spanish · Únete a la lista de espera | 1394 / 46 | 991 / 33 | 743 / 25 | 498 / 22 | 406 / **−16** | 406 / **−46** | 369 / **−49** |
| Spanish · Únete a la lista | 1394 / 46 | 991 / 33 | 743 / 25 | 498 / 22 | 374 / 16 | 344 / 16 | 308 / 12 |

Each cell is *right edge of the act / pixels left to the viewport*. Zero overlaps between brand,
links, control and act at every width; zero horizontal page scroll; zero layout shift when the
control opens (the card is out of flow). At 320 the control is the two-letter door.

The four boxes, left–right, brand · links · control · act:

| | 1440 | 390 | 320 |
|---|---|---|---|
| English | 46–141 · 662–778 · 1160–1224 · 1234–1394 | 16–40 · 68–157 · 185–234 · 240–374 | 12–36 · 47–129 · 139–177 · 183–308 |
| Spanish (short act) | 46–141 · 653–787 · 1166–1227 · 1237–1394 | 16–40 · 63–168 · 192–239 · 245–374 | 12–36 · 43–137 · 144–182 · 188–308 |

**What the table decides.** «Únete a la lista de espera» needs 406 px of a 360 px bar. Every move
the brief allows was taken first — the face is 24 px, «Rocoto» is hidden below 520, the type and
the air are tightened below 420, and below 360 the control is two letters — and the full label
still runs 46 px off a 360 px screen. So the NAV's act is the short one.

**The gutter the Spanish bar was eating.** With the real labels in, «Comprar Vender» measures
109 px where «Buying Selling» measures 89. Those 20 px are more than the bar has left on a phone:
measured, the Spanish grid overran its own content box by 3 px at 360 and 4 px at 320, so the
act's right gutter came out 13 px against the mark's 16, and 8 px against 12. The page did not
scroll — the padding absorbed it — but the bar was lopsided in Spanish and square in English. One
rule, `.pnav-links:lang(es) { gap }` at the 420 and 359 breakpoints, takes it back out of the air
between the two links. The figures above are after it; English is untouched, to the pixel.

**A bug this uncovered.** `.act-sm` is defined below the nav in `peru/peru.css`, so every phone
rule written up in the nav section lost to it. The `@media (max-width: 400px)` block that was
meant to shrink the act at 360 had never applied: the act was 160 px wide at 1440 and at 320
alike. The phone blocks now sit after the act's own rules, where they win, and the four media
queries run wide to narrow (860 · 700 · 520 · 420 · 359) instead of 860 · 520 · 340 · 400, where
the 340 block was dead for the same reason.


Peter, 19 September 2026 (verbatim in the product repository's `docs/FEED-IA.md` §268, last entry). This
file is what the builders build from. The page that stood here before is `/peru-shit`.

## What the page is

One page, light, Spanish (Peru), for the owner of a bodega, a market stall or a fish stall, read on a
phone first. It sells ONE mechanic and shows it happening inside WhatsApp drawn as WhatsApp:

> The shop orders from its supplier as it always does. In the same chat a link arrives: pay now with
> Yape, or pay later with Rocoto. The pay-later link opens inside WhatsApp, the shop picks its bank
> once, and the supplier writes that the money arrived.

The reader is always the shop («tú» = Yesenia, Bodega Yesenia). One act on the whole page:
**«Conecta tu WhatsApp»**, which opens `https://demo.soyrocoto.com/bodega-pay-later/`.

Peter's complaints about the old page are the acceptance test of this one: phones whose ratio and
resolution changed with the viewport; phones that were «just text»; no clear three-step; a nav and a
structure that read as a side page; slop. The illustrations stay: he called them lovely.

## Laws that bind every word

- **Say what IS.** No negative constructions in copy (no «no», «sin», «nunca», «ni»; say the positive
  fact). The one exception is the regulator's own sentence in the footer, which is law.
- **A heading names the thing**, bluntly; cover the rest of the section and a stranger still knows what
  is under it. No slogan cadence, no small kicker above a headline, no exclamation marks, no «nosotros».
- A row is a short heading plus ONE sentence that adds a fact. Buttons are a verb and its object.
- Sentence case everywhere. Peruvian Spanish, «tú». Short complete sentences.
- **Credit advertising (the company's own legal note, `credit-advertising-rules.md`):** pay later is
  being prepared with a lender the SBS supervises, and no lender is signed. So the page states NO
  rate, NO term, NO number of instalments, NO credit amount, NO «pre-aprobado», NO «aprobado», NO
  comparison with another product, and it never says pay later is available today. These two
  sentences are cleared and ship verbatim wherever the status is stated:
  «Estamos preparando crédito de capital de trabajo para negocios como el tuyo, con una entidad
  financiera supervisada por la SBS. Los negocios que ya usan Rocoto entran primero, y cada negocio que
  traes te adelanta en la lista.»
  The footer carries, always visible: «Rocoto no cuenta con autorización ni supervisión de la
  Superintendencia de Banca, Seguros y AFP.»
  A purchase total inside a simulated chat (S/ 386.00) is the price of an order and is allowed; a
  repayment date, «30 días», «sin intereses» and «en 3 cuotas» are not.
- Every phone carries the line «Conversación simulada» once, under it.
- Third parties' marks (WhatsApp, Yape, the banks) name those things and claim no partnership.

## The craft reference

chataigne.ai: one handset that travels through the scroll, WhatsApp screens coded as WhatsApp, the
in-chat browser sliding up, voice notes, generous white space, big calm type, a glass pill for the
act. `scratchpad/landing/reference-study.md` holds its measured mechanics (when it lands). We rebuild
that level of craft with our own code and our own assets: nothing of theirs is copied into this
repository (no bundle, no model, no image), because no licence on their site grants it.

## Peter on the live English page (20 September, midday), verbatim, and what it changes

THIS SECTION OVERRIDES EVERYTHING BELOW IT.

> ok so like why trial version also why is there such small padding then that phone doesnt animate to fully sideways...
>
> the transiaiton isn't smooth at all. you literally. like. is screwed us by showing you a good result and now we're fucked as you literally ont do the settings that chaaigne did that worked. why figure out sometjing totally different that's phenomenally worse
> their header text is also bigger.

> you also didnt use the real whatsapp background, which is this: https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png
> also dotn show the person typing, just send the messages. but do show the typing animation for the incoming stuff.

> also the first phone, shouldnt animate all the way to the rightfor the. "When you sell" section. it shuld just rotate into place with th etext being on the right of it, not the left. then everything below it has to switch position too to compensate

> also remove dots from the people's names int he header of the chats. nobody calls peoplelike that. it'll always be the businessess name that theyre texting whether their supplier or their client. Bodega or Pescadero etc
> do u get what i mean about chataigne. we're already there. you already figured it out. now do what i'd do and get the parts from them verbatim that worked.
> literally our site is making even my phone bug when i open the page.

> the thing with th qr needs to havt eh yape logo etc. it;s this https://www.yape.com.pe/_next/image?url=https%3A%2F%2Fwww.datocms-assets.com%2F56886%2F1690217622-4.png&w=640&q=100
>
> copy this vberbatim. and the point there is that it works for tracking instore payments too. we;d have boleta digital. we can say it's there. and the conecta tu whatsapp is to joint the waitlist and get the first three payments at no cost to the seller. should be clear like that.

What it changes:

1. **The reference's SETTINGS, in our own code.** The reference page's measured numbers and behaviour
   (its type scale, its hero anatomy, its scroll law) are matched value for value. Its code, styles,
   images, typeface and 3D model stay where they are: everything here is written and drawn by us. The
   measurements are in the scratchpad's `landing/reference-study.md` (§B type, §C phone, §D journey).
2. **Type.** H1 `clamp(64px, 8vw, 136px)`, leading .92, tracking −.05em, weight 400; 12vw on a phone.
   Row headings `clamp(52px, 5.8vw, 96px)`; row body 20 px. The hero's words, acts and phone get the
   reference's air: the phone's top stands well clear of the last line above it.
3. **The journey on a desk.** The handset is a REAL-TIME 3D object again (our own procedural model,
   `peru/handset/handset.js`, lit as the bake is lit), loaded after the first screen, with the baked
   frame under it until it is ready and as the fallback. It turns a FULL 90° about Y (edge-on, with a
   −1.6° roll) while the dark sentence is read, and unwinds as it docks. The path is the reference's:
   out of the hero's foot, left to the page's left rule, a 5 % contraction, the edge-on hold, then
   ROTATE INTO PLACE in row one. Motion is a function of scroll, eased on the progress with
   continuous velocity at every join, followed by a critically damped follower; at the dock the phone
   is re-parented into its slot so the page carries it.
4. **The rows switch sides.** Row one: phone LEFT, words RIGHT. Row two: words left, phone right. Row
   three: phone left. The heading «For selling, for buying and in your shop» leaves the page: the
   dark sentence is the section's header, as in the reference, and nothing stands in the phone's
   column while it docks. On a phone every row is phone first, words under it.
5. **Below 900 px nothing flies and no 3D loads.** Peter's own phone stutters on the page. The page is
   profiled at 390 × 844 under CPU throttle and made cheap: no work per frame at rest, no style writes
   that change nothing, bounded DOM in the endless chats, off-screen demos fully stopped.
6. **WhatsApp, more exactly.** The chat wallpaper is WhatsApp's own default wallpaper (the file Peter
   gave), not our doodle. The phone's owner is never shown typing: outgoing messages simply send.
   Incoming messages are always preceded by the typing indicator (dots in the thread, «typing…» under
   the name). Every chat header is a BUSINESS name, with no «·» and no person's name: a cevichería, a
   bodega, a pescadería.
7. **In your shop = Yape's QR, tracked.** The QR page inside the chat's browser is drawn as Yape's own
   «Mi QR» screen (purple field, white card, the QR, the shop's name, Yape's mark), in our own markup,
   with a QR that encodes OUR address (a stranger's scannable QR never ships). The row says what it
   is for: payments in the shop are written down too, and the digital boleta goes with them.
8. **What «Connect your WhatsApp» means is said in plain words:** it joins the waitlist, and the first
   three payments cost the seller nothing. The words «Trial version» leave the page. The cleared
   sentence about the supervised lender stays on the page (closing card and questions), verbatim.

### Peter, the same afternoon: the invoice photo, the sales side page, who it helps, who owes you, the model

> Also payme it should also show that it can be on delivery. taking aphoto of the invoice the supplier just handed them. reckon we can do that? they send it to rocoto, and boom.
>
> i wonder if we should keep the rocoto as an app to differentiate fromt heir normal convos. a feature as simple as speechify. get it? that would be brilliant, high speed. cos its aboutt hat. not really sales. well. sales is too. it's a separat ething but conceptually makes everythign super complciated as it forces a perspective shift and the people taking the credit are consumers in that case. consumers have yape credito for that.
>
> We can have another section that's for tracking Yape sales cos we do helpw ith that, but it;s what it is. it can be a subpage, cos it;s a biproduct and solves the issue. get it? that would let us show the export function in case of inspections, and that COMING SOON we'll be able to issue the boleta digital. would be a sidepage, but it can papear as a click ont hat wide rectangular box you canput for ventas. if u can generate the image for that to be the bodega showing a phoen with a wr to a person. but not a fresh food bodega i mean these bodegas ok?
>
> then the square little boxes i guess are about who it helps, but put those in a seaprate section, get it? it helps bodegas, minoristas, mayoristas.
> cos they fiar people that;s th epoint
> and they have hgh demand events too
> main page
> their 3d model is pepn soruce its from a tutorial. use it. they grabed it from apple

> We keep track of who owes them what. perhaps this can be a section with just a list of cards, isolated, for who owes them how much ok? separate secton in the page after eveyrthing no?

(With the first message came three photographs of the bodegas he means: a counter with a purple Yape
QR placard and a customer's phone scanning it; an owner writing in her notebook behind a glass
counter among sweets, gum displays and soft drinks; a shop walled with tins, biscuits, snacks and
cleaning products. Packaged goods, never a fresh-produce stall.)

What it changes:

9. **The model.** Verified at the source: the reference's handset is «Apple iPhone 15 Pro Max Black»
   by polyman, CC BY 4.0, published by a public tutorial. We use that model from its public source,
   with the credit the licence asks for (`peru/handset/model/CREDITS.md`, one line in the footer). It
   replaces our procedural handset everywhere: live on a desk, baked for every still phone.
10. **Buying, on delivery.** The buying story also shows the delivery: the supplier hands over the
    invoice, the shop photographs it and sends it to Rocoto, and the pay-now / pay-later answer
    comes straight back.
11. **Yape sales are a side page** (`/peru/sales`): Rocoto writes down the shop's Yape sales, exports
    them for an inspection, and, marked COMING SOON, issues the digital boleta. On the main page it
    is one wide box that opens the side page, with a new picture in the page's illustration family: a
    packaged-goods bodega whose owner shows a phone with a QR to a customer.
12. **Who it helps is its own section**, three square boxes: bodegas, retailers (minoristas),
    wholesalers (mayoristas) — the businesses that sell on credit to their own customers («fiar») and
    that stock up for high-demand dates.
13. **Who owes you is its own section, near the end:** a plain list of cards, one per customer, with
    what each one owes — lifted from the prototype's own fiado book, never invented.
14. **OPEN, asked to Peter:** whether the main page tells the buying story alone, with Rocoto as its
    own chat («as simple as Speechify»), and the selling story moves out with the sales side page.

### The travelling handset, as built (20 September, from §3 and §9 above)

**The object.** Every handset on the page is the licensed model — «Apple iPhone 15 Pro Max Black» by
polyman, CC BY 4.0, at `peru/handset/model/iphone-15-pro-max.glb` (887 KB, Draco geometry, WebP
textures, credited in the footer and in `model/CREDITS.md`). `peru/handset/model.js` turns it a half
turn about Y so its glass faces +Z, scales it by its own height to 71.4 × 146.6 × 11.3 mm, finds the
display mesh by its shape, puts out that mesh's own wallpaper and re-lights the file's materials in
the studio `handset.js` already had. The bakes — `front.webp`, `turn-00…45.webp`, `shadow.webp` — are
that same object, rendered from that same scene; the procedural handset that used to be here is now
only a bake-time comparison (`demo.html`, `bake.html?proc=1`).

**The geometry that came out of it**, measured off the new bake and written as literals in
`phone.css`, `peru.js` and `handset.json`:

| | |
|---|---|
| handset in the 0.78 render box | left 20.9402 % · top 3.4 % · width 58.1197 % · height 93.2 % |
| glass in the render box | left 23.3125 % · top 4.9515 % · width 53.375 % · height 90.0970 % |
| glass corner | 13 % / 6.02 % (the model's display mesh's own 50.7 px circle on the 390-wide document) |
| body aspect `--ph-ar` | 0.48641 |
| stage box off `.ph-body` | left −36.02944 % · top −3.64807 % · width 172.05870 % |
| `--ph-s` | `--ph-w / 424.669` |

The display mesh measures 0.4628 wide per unit high and the demos are 390 × 844, which is 0.4621, so
the rectangle the page is handed is the largest 390 : 844 one inside the panel. Registration,
measured on a row phone and on the travelling phone at DPR 1, 2 and 3: every edge within one device
pixel (0.33 px at DPR 3, 0.5 px at DPR 2, 1.0 px at DPR 1, which is that method's own resolution).

**The law of the journey**, the reference's, value for value:

    rotY = 90° · m        rotZ = −1.6° · m        m = min(u, 1 − v_turn)

`u` is the travel in, `v` the release out, both `smootherstep` (6t⁵ − 15t⁴ + 10t³ — value, velocity
AND acceleration zero at both ends, so no leg begins at full speed after a stop; it is also, measured
on the reference's own page, the curve its travel follows). Three scrolls set the shape, every one of
them read off a live rectangle rather than tuned:

* `S1` the turn is complete — the dark band's top is a fifth of a screen down;
* `S2` the hold is over — the sticky sentence unpins, `tail.bottom − stickHeight − top`;
* `S3` the phone is home — the dock sits at reading height.

At 1440 × 900 they are 736 / 1090 / 1820 — measured on the page, the handset is at exactly 90° from
scroll 726 to 1098, a 372 px hold it holds to a hundredth of a pixel in x and in y — 40 % travelling,
19 % held edge-on, 40 % coming home, against the reference's own 37 / 18 / 45. The rotation unwinds
over the first 66 % of the release, so the handset is face-on well before it lands. The path is hero foot → the page's own left rule (the
band's wrap, minus 5 % of the handset's width, which is the reference's 25 px outside its 120 px
gutter) → hold → the dock's live rectangle. Row one's phone column is on the LEFT, the same side as
the waypoint, so the last leg is a rotation with a short drift, never a flight across the page. The
held size sits 65 % of the way from the dock's to the hero's, which is the reference's 537.6 between
its 520 and its 547.2 — with today's CSS both are `--ph-w-page`, so that contraction is 0 % until the
hero's handset is given its own, larger width.

**Smooth.** A critically damped follower (τ = 95 ms, integrated analytically so any frame length is
stable) sits between the scroll and the pose, with its own rAF that runs only until it settles. Its
weight falls to zero over the release's 60–90 %, so the hand-off happens with the follower exactly on
the real scroll. Sampled every 6 px of scroll from settled paint through the whole journey, the
largest change in speed from one sample to the next is 3.2 % of the top speed in x, 3.0 % in y and
4.5 % in rotation — a leg that started at full speed after a stop would read 100 %.

**The hand-off is a re-parent**: past `S3` the phone is moved into the dock, its transform and inline
width dropped, and the page carries it; on the way back up it is lifted into the air again. Measured
from settled paint in both directions: 0.0 px. The move is `moveBefore`, the atomic move that keeps
a running `<iframe>` alive — an ordinary `appendChild` tears the demo's document down and reloads it,
so the conversation that has been playing all the way down the page restarts at the exact moment the
phone lands. Where `moveBefore` is missing the phone simply never docks: it stays fixed and keeps
tracking the dock's own rectangle, which is the same rectangle, and the reader keeps the chat.

**Load policy.** Nothing of this is on the first screen (274 KB at 1440, of which the handset is one
12.2 KB `front.webp`). On the reader's first scroll, pointer or key — or on idle after load — and
only where `FLIES` is true (≥ 900 px, motion allowed), the address asks for the live handset, the
machine reports a GPU and save-data is off, the page imports `handset/live.js` and pulls the model,
three.js, GLTFLoader + DRACOLoader and Google's Draco decoder: **1.79 MB raw, 1.06 MB gzipped.**
The baked sequence arrives in three waves, coarse to fine — every FOURTH pose at once (13 frames,
134 KB, the whole turn at an 8° step, so a reader who scrolls immediately sees a handset that
turns), every second pose if the model is more than 400 ms late or there will be no model at all
(24 frames, 255 KB, a 4° step), and all forty-six (498 KB, the 2° step it is baked at) on the frame
the handset first moves. The canvas draws one frame at the pose the handset is already holding
before the plate steps aside; live and baked coincide to 0.03 px of silhouette.

**The fallback is the same handset.** Under 900 px, under reduced motion, on save-data, without the
`?live3d=1` the kill switch asks for, or on a machine whose WebGL renderer names itself a software
rasteriser (SwiftShader, llvmpipe and their kin — measured here, they draw this scene in 275 to
2301 ms a frame against 17 ms for the baked sequence), nothing is created, imported or listened
for. Past that, four things still hand the journey back to the baked sequence for the rest of the
session: a failed import or a missing file; the six-second deadline below; ONE turning frame over a
second, which is what «Page Unresponsive» is made of and which no grace period excuses; and the
older pair of tripwires, two turning frames over 220 ms or five over 50 ms inside twenty.

### Why it froze on a real GPU, and what is different (20 September)

On the founder's Mac — a real GPU, Chrome, ANGLE over Metal — the page went «Page Unresponsive» the
moment the live handset mounted, and a remote probe of the same build hung his tab too. It never
showed here, because this box has no GPU at all: it renders through SwiftShader, which compiles a
much simpler program set. **The first `renderer.render` of a 31-material PBR scene compiles and
links a program for every material it meets, on the main thread, and on ANGLE/Metal that is seconds
of it.** The build before this one did exactly that, twice — once as a «warm frame» drawn on
purpose.

So the live path now takes the craft reference's configuration, value for value, and its policies
with it:

* **the room is three's own `RoomEnvironment` through `PMREMGenerator` at sigma 0.04**, plus its
  four lights — `HemisphereLight(0xffffff, 0x071018, 1.05)` and three `DirectionalLight`s (2.8
  white at (−6, 8, 11), 0.95 `0xdde7f5` at (6, −1, 8), 1.1 `0xc9dcff` at (5, 4, −5)). The bespoke
  rig of seventy emissive panels is now `handset/studio-rig.js`, imported only by `lighting:
  'studio'`, which is the bake-time comparison and never the page;
* **sRGB out, ACES filmic at exposure 1**, `alpha`, `antialias`, `powerPreference:
  'high-performance'`, anisotropy capped at 8, the model's own display put out where the HTML
  screen goes;
* **the pixel ratio is capped at 2** and the backing store is set ONCE per change
  (`setDrawingBufferSize`), never larger than the box needs, and a box that did not change costs a
  comparison;
* **render on demand only** — one draw per pose, none at all while an `IntersectionObserver` says
  the handset is off screen or the tab is in the background;
* **and the shaders are prepared off the critical path**: `renderer.compile(scene, camera)`, then
  `KHR_parallel_shader_compile`'s `COMPLETION_STATUS_KHR` polled from a `setTimeout`, so the link
  runs on the driver's threads and the page scrolls, lays out and paints between looks. `draw()` is
  inert until it lands, and `LINK_STATUS` is read afterwards, because «the compiler stopped» is not
  «it worked».

**Six seconds, and then the baked handset keeps the page.** One clock covers the whole mount. When
it fires the poll is cancelled on the spot, the stage it died in is written down, and the mount
throws; the reader keeps the sequence they were already watching. Every stage is timed and put on
`window.__handsetTimings` — import, build, model, room, size, compile, shaders, first-frame, live,
plus the renderer's own name, the gaps between the first two dozen turning frames, and the reason
if it stood down. **Open the page with `?live3d=1` and read `__handsetTimings` in the console:** it
is the one thing a machine that stutters can hand back. `?live3d=force` mounts it even on a
software renderer, which is how this was profiled.

**The lens is the one reference setting this page does not take.** The reference frames its handset
through 34°; ours is 14°, and every registration number the page owns — `--ph-ar`, `--ph-s`, the
stage box, the glass's four percentages, `handset.json` — was measured off a 14° bake. A lens
changes no shader and no draw; moving it moves every phone on the page by about 2 %.

**And one line had to come out.** `renderer.forceContextLoss()` on dispose looks like hygiene and
is a trap: measured on this page, losing the context made Chromium rebuild every other context on
it — the demos are iframes — as ONE task of 13.4 seconds, arriving at the exact moment the page
walks away from 3D. Removing it took the run from a 13.4 s task to none.

**Measured here, on software GL.** The mount with the parallel-compile path exercised: import 346,
build 356, model 586, room 676, size 708, compile 740, shaders ready 1985, first frame 2110 ms, and
the longest main-thread task attributable to the handset is 123 ms. The poll looked 89 times, 16 to
19 ms apart, yielding every time. With completion withheld the deadline fires at 6000 ms and the
page falls back. On the baked path a reader gets no long task at all: p50 17 ms, p95 34 ms.
Software GL cannot prove smoothness on a GPU — that check belongs to a machine that has one.

### THE PAGE'S STORY, FROM PETER'S OWN THREAD (20 September, evening) — this governs the words and the order

Source: his 32 prompts, verbatim, in the company repository
(`notes/peru-yape-on-file-roadmap-2026-09/peter-prompts.md`) and the decision record beside them
(`decisions/peru-roadmap-yape-on-file-and-who-pays-2026-09-20.md`). In this session he added:
«Yeah [the main page is buying only], cos that means it's THEM that has it. the supplier can easily
get it. They just have to agree quickly to the terms.» · «first three transactions are free
basically. up to some amount each. new customer promo for buyers.» · «the selling is gonna be the
subpage as that's the feature we have until we are able to launch loans. that's what they'll use now
once we refer their customers (or friends)» · Rocoto in the demos is «not a contact that's the
point.» · «i landed on a better arrangement basically. one which makes sense to charge for the card
on file but only when we launch that whole thing».

15. **The main page is «the pay later inside whatsapp thing», and it is about BUYING STOCK.** The
    credit is the bodega's («it's THEM that has it»); the supplier is small («supplier is not a
    giant»), is paid at once, and only has to agree to the terms. The consumer side (a shop's own
    customers paying later) leaves the main page.
16. **Rocoto is an app, never a contact.** It is connected to the business's WhatsApp and reads it;
    it is «a feature as simple as speechify». In the phones: the conversation is always between two
    BUSINESSES; the pay-later link is sent by the supplier, a person, inside their normal chat («the
    supplier just sends our link every time they're asked to fiar»); an invoice photographed on
    delivery is shared to the Rocoto app. No chat with a Rocoto account appears anywhere.
17. **Three phones, one purchase:** (a) WHEN YOU ARE ASKED TO FIAR — the supplier's phone: the order
    and «can I pay you next week?» arrive, the supplier sends the link, the money arrives today;
    (b) WHEN YOU BUY — the bodega's phone: the link arrives in the same chat, the bodega agrees to
    the terms once, pays in a week; (c) ON DELIVERY — the invoice the supplier hands over is
    photographed and shared to Rocoto, and the pay-later answer comes straight back.
17b. **CORRECTION TO 16–17 (Peter, 20 September, after seeing it live) — THE BUYER HAS ROCOTO, AND THE
    PHONES SAY SO.** Verbatim: «the when you buy thing. remember. it's the one buying that has rocoto.
    so they're the ones that say "im gonna pay later with rocoto, and then a photo gets send saying
    "funds sent to SUPPLIER" showing the confirmatioN that the supplier got paid. its like when you
    give your friends a monzo link to pay them back meaning saying "here's a monzo link with the 25
    quid i owe you"» · «the animations of the link webpage that opens up is a bit fast. also, when they
    take the invoice pic that should literally auto turn into a "pay later" screen that they just tap
    and boom. not go to "sharing" to add to rocoto. would be int he real rocoto app. and that would
    look after they had "pay later" and it's confirmed … say when they'll be charged automatically
    for it, and then it goes to the [camera] again. as the loop» · «And the invoice should be in the
    nice format that we do them in our site. you didnt use the same style as our delivery notes in
    terms of structure and stuff».
    So: (a) the SUPPLIER's phone — a shop orders and writes that it will pay later with Rocoto; the
    shop's message with Rocoto's confirmation card arrives («Funds sent to <the supplier>», the
    amount, today); the bank's notification lands; the supplier did nothing and is paid today. The
    supplier sends no link. (b) the BODEGA's phone — it orders, the supplier gives the total, the
    bodega writes «I'll pay later with Rocoto», and its next message is the confirmation card as an
    image («Funds sent to Distribuidora Ricardo · S/ 386.00»), which the supplier thanks it for. No
    in-chat browser in this story. (c) ON DELIVERY — entirely inside the Rocoto app: the app's own
    camera on the invoice, the shutter, and the photograph turns by itself into the purchase set as
    OUR DELIVERY NOTE is set (the prototype's real order detail: the document head, the rows with
    their faces, quantity and unit on one line, the total as a figure), with one act, «Pay later»; a
    tap, and the confirmation says the supplier is paid today and that Rocoto collects it
    automatically on the agreed day (no date, no rate, no amount of credit); then the camera again,
    for the next invoice. No iOS share sheet. Where the in-chat browser still appears on any page,
    its rise, its loading and its page changes run about a third slower than they do now.
17c. **AND THE CONFIRMATION IS A LINK, WITH ITS PREVIEW DOING THE WORK (Peter, minutes later).**
    Verbatim: «would actually be a link with the social graph image preview being that confirmation
    tick that the funds were sent. a nifty way to use previews as real data. get it? and then show the
    supplier reply saying got the funds, thanks! then follow up with a message about how they'll get
    the thign they rodered tomorrow or whatever. and then the whole thing loops with that, get it? good
    way to do a loop ith the same info each[.] right now you have other timeconvo stuff int he messages
    above the animated new oens and thats the thing that confuses people. minimal noise / infinite
    loops therefore.»
    So: the buyer's confirmation is a WhatsApp LINK message — the URL (`soyrocoto.com/p/…`), and above
    it WhatsApp's own link-preview card whose image is Rocoto's confirmation (the tick, «Funds sent»,
    the amount, the supplier's name), with the preview's title and domain under it, exactly as
    WhatsApp draws a preview. Then the supplier: «Got the funds, thanks!», and a second message that
    the order arrives tomorrow. That exchange IS the loop: the thread opens EMPTY of older small talk
    (no «yesterday» history above it), plays order → total → «I'll pay later with Rocoto» → the link
    with its preview → the thanks → the delivery line, rests, and the next order begins under it.
    Both chat demos (the supplier's phone and the bodega's) follow this; nothing else is on screen.
17d. **ROW TWO IS THE AUTOMATIC DEBIT, NOT THE SUPPLIER'S PHONE (Peter, the same evening).** Verbatim:
    «Do we really need to see what your supplier sees? I think here we just need to show that they
    can get their money deposited in their Yape. I think that's the important thing to show there:
    automatically debited at the time, so they don't have to worry about missing a payment. That's
    it.» So the three rows are all the BUYER's: «When you buy» (the chat, the link whose preview is
    the confirmation) · «When it is time to pay» (Rocoto collects it from your Yape on the agreed
    day, by itself; the supplier had the money in their Yape the day you bought) · «On delivery»
    (the invoice photographed inside Rocoto). Row two's phone shows that one moment and nothing else:
    the collection arriving as a notification and the purchase marked settled in the Rocoto app.
    `vender.html` (the supplier's phone) leaves the main page.
17e. **TWO PAGES, BUYING AND SELLING; PERU IS THE SITE (Peter, 20 September, night).** Verbatim, the
    parts that bind this site:
    «The whole thing about logging your Yape sales is that when people message them and they get sales
    in, it automatically replies with a Yape link. In that Yape link, it shows the delivery note in
    our format. Those customers get a really nice thing, and that's where it has the "Pay Now" button,
    or that's where it has the copy amount, or that's where it has the button that, when clicked, makes
    them just go to Yape to pay the amount. It shows them the amount, and it goes to Yape to pay that
    amount. Do you get it? And the Yape and Plin logos need to be in the right place. It's also Plin,
    by the way, obviously, but you need to understand that these are the things that we're
    highlighting. You shouldn't make up other stuff.»
    «Yes, they can see all of their history of transactions from buying and selling in the app, and
    which ones were paid in full. That's all it is with that, and you should put in that selling
    thing: coming soon. If they're giving credit to a business, they're going to be able to
    auto-collect with Yape, so that's a sort of subsection of the selling page because that's another
    feature that's coming soon. … It actually works perfectly, and that's going to be free, by the
    way. I've decided this part is going to be free: the auto collection.»
    «Obviously, before you have that feature, you need to have the coming soon section. You need to
    have the fact that they can export to PDF and show their inspector, and put a little illustration
    of an inspector.»
    «the way that the girl in that illustration literally has the phone facing herself, and she's on
    the same side of the counter as the customer, which looks weird. She should be behind the counter,
    pointing to a QR code or some little card. Do you get it? Usually, that's how they do it.»
    «actually, we don't need to have a debt page now because it would be a coming soon page within
    selling. This is a benefit to the seller, essentially. … This whole website is a buying and
    selling page. Super, super easy.»
    «And now put the whole current main homepage under Spain, and then put the Peru thing as the main
    one. For Spain, all the links will have to be relative, so this: Spain/etc. The privacy and the
    main privacy policy, no cookies, and all of that stuff are for Peru. I'm switching, which is my
    main focus, okay?»
    «make sure that the Rocoto, anywhere that you have the logo, is the blinking one, the gif, for
    sure. For "Connect your WhatsApp," surely that's the best way: "Join the waitlist."»
    «also there's lag in the loading of these frames look» (a row phone painting its poster's ALT TEXT
    while the picture loads).
    So:
    - THE SITE IS TWO PAGES: **Buying** (`/`, today's `/peru`) and **Selling** (`/selling`, today's
      `/peru/sales`). `/peru/fiados` goes; «auto-collect with Yape» becomes a COMING SOON section
      inside Selling, for a business that gives credit to other businesses, and it is FREE. The nav
      reads Buying · Selling. Old addresses redirect.
    - SELLING says only what is: a customer orders in the chat; Rocoto replies by itself with the Yape
      link; the link opens the order as OUR delivery note with the amount, «Pay now», «Copy the
      amount» and the button that opens Yape; Yape's and Plin's marks stand where the customer pays;
      every sale is written down; the whole history of buying and selling, with what was paid in full,
      is in the app; it exports to PDF for an inspector (with a small illustration of an inspector);
      COMING SOON: auto-collect with Yape (free), and digital receipts. Nothing else is invented.
    - THE PICTURE for Selling is re-made: the owner BEHIND her counter pointing at a small QR card
      standing on it, the customer in front scanning it.
    - THE ACT reads «Join the waitlist» everywhere; the app's first screen explains, in a few airy
      words, why WhatsApp is connected (the product repo carries his draft).
    - THE LOGO is the blinking face (`/brand/face-blink-*.gif`) wherever the face appears.
    - A POSTER NEVER SHOWS ITS ALT TEXT: until the picture has loaded the screen is plain paper.
    - SPAIN MOVES UNDER `/spain/`, whole, with every old marketing address redirected to its new one;
      functional addresses that outside systems hold (sign-in callbacks, proposals and bookings
      already sent, the deck) keep working. The root's privacy page is Peru's; the Peru pages set no
      cookies.
18. **The roadmap is said openly, as a vertical timeline, five steps** («maybe we openly say it»),
    each a thing YOU will be able to do, with its month named and marked as planned:
    1 · Today — connect your WhatsApp: you are on the list, and each business you bring moves you up.
    2 · Today, WHILE YOU WAIT (Peter, same evening: «now its waitlist, and while they wait they can
        auto send yape links in whatsapp and log purchases in person») — Rocoto sends your Yape link
        in the chat when a customer orders, and writes down what you sell at the counter: «Apunta tus
        ventas Yape». Your sales in one place, ready if SUNAT asks.
    3 · October — «Auto-cobro de fiados»: what you are owed collects itself through Yape on File —
        your neighbours' tabs if you are a bodega, your bodegas' if you are the one who fía.
    4 · November — «Boleta digital».
    5 · December — «Paga después», the credit («then its credito»): pay your supplier later.
    His order, verbatim: «then its auto cobro de fiados / then its boleta digital / then its credito».
    Steps 3–5 carry «planned» in plain sight. No rate, amount, term or approval is printed.
    WHY EACH ONE WAITS, said openly in one plain sentence per step (Peter, same evening: «cos i need
    to register a company to access culqi which will give me the yape on file. then i need to get an
    api allowance from sunat for the boleta digital or use nubefactu or similar, takes more time /
    then credito requires a credit facility and an approved credit risk model so even more time»):
    October — the company is being registered in Peru, which is what opens Yape on File to us;
    November — boletas travel through SUNAT's own system, and that connection is being set up;
    December — credit needs a funded facility and a risk model a lender has approved, and both come
    first. The page names no provider (Culqi, Nubefact and the rest stay in the company's records):
    nothing is signed with them yet.
19. **The early-bird offer is the reason to join today:** the first businesses in get their first
    three pay-later purchases with Rocoto covering the cost, up to an amount per purchase that Peter
    sets (placeholder until he does; the page never says «free credit», «gratis» or «sin intereses»:
    company note `pay-later-free-week-2026-09`). Joining = connecting WhatsApp. After connecting,
    referring friends moves you up («refer friends to bump yourself up»).
20. **Two side pages, plain names:** `/peru/sales` «Apunta tus ventas Yape» (live today: sales
    written down, the export for an inspection, the digital boleta planned) and `/peru/fiados`
    «Auto-cobro de fiados» (for anyone who fía today: suppliers, wholesalers, bodegas; who owes you,
    live today; collecting by itself through Yape on File, planned; the one who gives the credit pays
    a small fee for the facility once it is live, and no figure is printed yet).
21. **The voice is Tom Blomfield's at Monzo:** second person, friendly, open, blunt, responsible,
    on the reader's side; every line a thing «you'll be able to do». It still obeys the house laws:
    it says what IS (no fear copy, no negatives), headings name the thing, no slogans. Spanish
    ships; English is today's review language.
22. **Who it helps:** bodegas, retailers (minoristas), wholesalers (mayoristas): they sell on credit
    to their own customers and they stock up for high-demand dates.

## Peter on language (20 September), verbatim

> Bro, also, obviously not going to launch in Peru in English. Why would? It needs to be. Oh my God, do all the screens in English now so that I can make sure, because my brain does design review in English, and then later we'll make it in Spanish as the main thing.

What changes: **the page and every phone screen are ENGLISH now, for his design review**; Spanish is what
ships later. So every string lives in a table with both languages: `peru/STRINGS.md` for the page
(key · English · Spanish, the Spanish being the text already written in this spec), and each demo
carries `en` and `es` tables and reads `?lang=` (default `en` for now; the page passes `lang=en`).
The English obeys the same laws (say what IS, a heading names the thing, one sentence adds one fact,
verb-and-object buttons, sentence case). English twins of the fixed lines: «Rocoto is preparing
working-capital credit for businesses like yours, with a financial institution supervised by the SBS.
Businesses that already use Rocoto go first, and each business you bring moves you up the list.» ·
footer: «Rocoto holds no authorisation or supervision from the Superintendencia de Banca, Seguros y
AFP.» · the act: «Connect your WhatsApp» · H1: «Pay later, inside your WhatsApp» · sub: «Your customer
orders the way they always do.» «In the same chat they choose to pay now with Yape or pay later with
Rocoto, and you get paid on delivery.» · rows: «When you sell» · «When you buy» · «In your shop» ·
section heading «For selling, for buying and in your shop» · steps: «Three steps» — «Connect your
WhatsApp» · «Choose your bank» · «Sell and buy as always». People keep their names (Pescadería El Ancla,
Cevichería El Muelle, Ricardo · Terminal Pesquero, Rosa Quispe); money stays in soles («S/ 540.00»);
chat lines are natural English («I need 3 boxes of shrimp for tomorrow. Can I pay you next week?»).

## Peter on structure, weight and light (20 September), verbatim, and what it changes

> still feels i feel probably bad. cos the animations could have shown multiple "steps" at once. think aboutt he most cognitively smooth. where we very c.eanly to a stranger explain that it's for selling. and for buying too. and then for in-person too. up to you. we have the split text-phoneanimated and then columnised. i reckon either either we have three of the split text, just like that Swiss company did it, and then we have another section which has columns to explain some other thing, maybe the in-person how it works. I think the split text and phone, we can use one of them to be getting a message or getting an order, and the other one can be sending an order. I don't know, and setting up can be the third one: how it's easy to set up, but I don't know.
>
> Think about this: these are key, key, key parts, and remember the infinite animation thing and all that. The website is still extremely heavy, by the way, especially the first animations. All lighting is completely off. […]

> remov the carusel cos that;s unnecessary. the scrolling theing remove it

THIS SECTION WINS over everything below it. The decision («up to you»), made for the stranger who
has ten seconds: three USES told in one repeated shape, then three STEPS to start.

1. **The pinned, scroll-scrubbed three-step stage is removed**, with its captions, its three-dot rail
   and the scrubbing. So is the «Tu cliente» row, and so is the drifting logo rail above the bank band
   (the bank tiles under it already say it).
2. **Three split rows, text one side and ONE animated phone the other, alternating; each phone plays
   its WHOLE flow, forever, never resetting:**
   - **«Cuando vendes»** — «Tu cliente te pide por WhatsApp.» «Rocoto responde con el link: pagar ahora
     con Yape o pagar después con Rocoto. Tú cobras al entregar.» — `vender.html`
   - **«Cuando compras»** — «Le pides a tu proveedor como siempre.» «El link llega al mismo chat. Eliges tu
     banco una vez, tu proveedor cobra y tú pagas después.» — `compras.html`
   - **«En tu tienda»** — «Una nota de voz y una foto.» «Rocoto lo anota y te manda el cobro con su QR.» — `tienda.html`
   The section's heading: **«Para vender, para comprar y en tu tienda»**. The travelling phone rises from
   the hero playing `vender.html`, turns over the dark sentence and docks into the first row's slot.
3. **«Tres pasos» becomes how you START, in three columns:** 1 **«Conecta tu WhatsApp»** «Usas tu mismo
   número, y tu WhatsApp Business sigue igual en tu celular.» · 2 **«Elige tu banco»** «Una sola vez, entre
   los bancos de la lista.» · 3 **«Vende y compra como siempre»** «Cada pedido lleva su link: Yape al
   momento, o pagar después con Rocoto.»
4. **Weight.** Measured live on a phone: 1,182 KB on first load, 2,979 KB after a full scroll. Budget:
   **≤ 450 KB on first load and ≤ 1.4 MB after a full scroll on a phone.** No three.js at run time: the
   handset is the baked frame everywhere and the turn is the baked sequence; illustrations and posters
   are served at the size they are drawn (`srcset`/`sizes`, the `-sm` files, posters at 780 px); fonts
   self-hosted and subset; one iframe mounted at a time beyond the hero; nothing preloaded that the
   first screen does not paint.
5. **Light.** The handset's lighting reads wrong on the page. Re-light and re-bake it as a product
   shot: a dark graphite body, a crisp highlight travelling along the band as it turns, a soft
   reflection across the glass, a quiet contact shadow; judged by LOOKING at it on the page's paper
   beside the reference's public page. Our own model and scene; nothing of theirs is copied.

### The flight is a desk's (20 September, from looking at 390)

Rendered at 390 × 844 and looked at in 100 px steps: the flown handset left the screen for three
hundred pixels of scroll, left the hero's foot blank behind it, and crossed «For selling, for buying
and in your shop» on its way to the row. Below 900 px nothing flies. The hero keeps its handset,
which leaves with the hero; the dark sentence pins in the middle of the screen and is fully lit by
the time the pin lets go; row one has its own phone, which opens on the lock screen with the order
landing on it. `peru.js` decides it once at load (`FLIES`), and `html.lit-pin` carries the phone's
band. From 900 px up the journey is unchanged: out of the hero, turned beside the sentence, docked
in row one. `peru/og-peru.jpg` is the English card, captured from the page's own parts.

## Peter on the live page (20 September), verbatim, and what it changes

> you still dd carousel. the 1 2 3 should be literally scroll-separate.

> u cliente paga desde el chat - phone is too big. maintain a consistens size across the website pls

THIS SECTION WINS over everything below it:

1. **The pinned three-step stage STAYS** (Peter, a few minutes later: «oh i get it. 1 2 3 was 3 parts of the
   animation. maybe that;s fine. but still. the frame sizes make it hard for me to judge the rest.»). The
   work is the frame sizes.
2. **One phone size across the page.** Every handset (the docked hero phone, the three step rows, the
   three point-of-view rows) has the SAME width at a given viewport, from one custom property
   (`--ph-w-page`): about 300 px on a desk (1440), scaling down smoothly to about 250 px at 390 and
   230 px at 360. The only exception is the small phone inside the laptop composition of the orders
   band. The hero's peeking phone is that same size (it may not be larger to fill the foot).

## Peter on the snapshot (19 September, late), verbatim, and what it changes

> SUPER BAD. […] i want their exact phoen frames. the exact structure of their pages. their mini phone demos animated in each thing. they dont have a carousel style. which makes it super easy to track. Each animation infinitely loops cos it starts with its ending state and simply another message is sent. it's so good. Even their typing annimation and the way messages send.

> i dont even see phone frames in oursi dont even see the phoen frame in the hero at the bottom half peeking with th enitification coming in (which would be a new order from a customer saying "Can i pay next week?"

> or saying "i need 3 boxes of shrimp"

(He also asked again for their code and their handset; those stay theirs. What follows is built by us.)

What changes — THIS SECTION WINS over everything below it:

1. **A photoreal handset.** The CSS-drawn phone reads as a drawing. The handset becomes rendered
   frames of a real 3D object (an openly licensed model, or one we model), lit like a product shot and
   rendered at 3×: `peru/handset/front.webp` (transparent where the screen is, so the 390 × 844 screen
   sits under the glass) and a turn sequence `peru/handset/turn-XX.webp` for the opening rotation. The
   CSS handset remains only as the fallback while the frames load.
2. **The hero shows the phone.** Its top half peeks over the foot of the hero from the first paint,
   large (about 40 % of the viewport's height visible at 1440 × 900, the same on a phone), and **a
   WhatsApp notification drops onto it**: a customer's order.
3. **The hero's story is a sale**, and the reader is the seller. Cast: you are **Pescadería El Ancla**;
   the customer is **Cevichería El Muelle**. Banner: «Necesito 3 cajas de langostinos para mañana. ¿Te
   puedo pagar la próxima semana?» → the chat opens → the chip «Rocoto respondió por ti» and your
   message «Claro. 3 cajas de langostinos son S/ 540.00. Elige cómo pagar:» with «Pagar ahora con Yape» /
   «Pagar después con Rocoto» → the chip «Cevichería El Muelle eligió pagar después» → banner **Rocoto**
   «Recibiste S/ 540.00 de Cevichería El Muelle.» → you type and send «Listo, mañana a las 6 te llevo
   las 3 cajas 🙌». Chapters for the captions: **1 «Te llega un pedido»** «Tu cliente te escribe por
   WhatsApp, igual que hoy.» · **2 «Rocoto responde con el link»** «En el mismo chat: pagar ahora con Yape
   o pagar después con Rocoto.» · **3 «Cobras al entregar»** «Tu cliente le paga a Rocoto después, y la
   venta queda anotada.»
   H1: **«Pagar después, dentro de tu WhatsApp»**. Sub: **«Tu cliente te pide como siempre.»** «En el
   mismo chat elige pagar ahora con Yape o pagar después con Rocoto, y tú cobras al entregar.»
4. **Every demo starts full and loops by sending one more message.** A phone is never empty: each demo
   opens on a populated conversation (earlier messages of the same two people, dated «AYER» / «HOY»),
   plays its beats, rests, and the loop returns to that populated opening with a soft cross-fade, so an
   animation can be joined at any moment and read at once. The poster frame is a full conversation.
5. **One small phone per section, looping in place. No carousel, no tabs, no toggle, no auto-advance.**
   Point-of-view rows after the journey: **«Tu cliente»** (`cliente.html`, recast: the cevichería's
   phone; it picks «Pagar después con Rocoto», the in-chat browser, the seven banks, «Cuenta conectada»)
   · **«Cuando tú compras»** (`compras.html`: the same shop buying from its supplier, the founder's
   earlier story) · **«En tu tienda»** (`tienda.html`).
6. **Typing and sending match the reference's feel**: the composer's text appearing at a human cadence,
   the send button morphing from the microphone, the bubble leaving the composer and landing in the
   list, the single grey tick turning to two and then blue. Measured against their live demos at 16 ms,
   the way bubble entry was.
7. **The page's structure follows the reference slot for slot** (already the order in «fit and
   arrangement»), with our words and pictures in each slot.

## Peter's later words (19 September, night), verbatim, and what they change

> even the beginnign animation is so fucking good. where the phone rotates. and the way each frame animates. it just makes sense. we can have one frame for each person's POV. bodega. supplier. etc
> their phone frames are the highest res i've ever seen. their whatsapp vice notes an dbubbles are too good to be manually made by them

> they have no copyright on animations. etc. the chataigne naimations are so good they just feel right. anything different violats human's nuance feel

What changes:

1. **The handset has a body and it turns.** On the opening flight the phone rotates about its vertical
   axis (edge-on while the headline of the next section reveals, then unwinding as it docks), with a
   small roll, exactly the beat the reference plays. So the handset is a real 3D object with thickness:
   a titanium band, a glass front with the island, a back with a camera plateau, drawn as vectors so it
   is sharp at any size and any pixel ratio. The 390 × 844 screen rides the front face through the same
   3D transform (an iframe takes CSS 3D transforms), and is hidden while the face is turned away. The
   journey stays scrubbed by scroll in one rAF with no CSS transition on the phone. On a phone-width
   viewport the turn is smaller and the handset keeps its size. Reduced motion docks it from the start.
2. **Every phone arrives the way theirs do**: each story row's handset settles into its slot (a short
   turn from a few degrees, a rise, the shadow landing), then its demo starts.
3. **One phone per point of view**, in alternating rows (phone one side, words the other), replacing
   the segmented toggle of section 5:
   - **Tú, la bodega** — `compras.html` — «Tu proveedor cobra y tú pagas después» · «Pides por WhatsApp.
     El link llega al mismo chat con las dos opciones.»
   - **Tu proveedor** — `proveedor.html` (Ricardo's phone) — «Tu proveedor ofrece las dos opciones en cada
     pedido» · «Rocoto responde por él con el total y el link, y le avisa cuando el pago llega.»
   - **Tu cliente** — `cliente.html` (Rosa's phone) — «Tu cliente paga desde el chat» · «Le llega tu
     mensaje con el total. Toca el link y paga con Yape al momento, o elige pagar después.»
   - **En tu tienda** — `tienda.html`, with the `scan-qr` illustration in a second handset on a desk —
     «Una nota de voz y una foto» · «Dices qué se lleva tu cliente y tomas una foto. Rocoto lo anota y
     te da un QR para cobrar.»
4. **The motion is theirs to the frame, the code is ours.** The reference animates with framer-motion
   (Motion, MIT). We use the same open-source engine with the measured values, and compare curves
   against their live demos at 16 ms. Their components, artwork, typeface and 3D model stay theirs.

New demos for the WhatsApp builder:
- **`proveedor.html`** — Ricardo's phone, chat «Bodega Yesenia»: incoming «Hola Ricardo, para mañana: 2
  cajas de tomate, 1 saco de papa y 1 de cebolla roja.» · Ricardo records and sends a voice note (the
  recording state plays: red mic, timer, live wave, then the sent voice note) · centred chip «Rocoto
  respondió por ti» and the outgoing «Listo, Yesenia 👍 Son S/ 386.00. Elige cómo pagar:» with the two
  CTA-URL buttons · centred chip «Bodega Yesenia eligió pagar después» · notification banner **Rocoto**
  «Recibiste S/ 386.00 de Bodega Yesenia.» · Ricardo types and sends «Ya me llegó el pago 🙌 Mañana a
  las 6 te lo dejo en la bodega.»
- **`cliente.html`** — Rosa's phone, chat «Bodega Yesenia» (the shop's picture as avatar): she sends
  «Casera, ¿me separas 2 kilos de tomate y 1 de limón para las 5?» · incoming «Claro, Rosa. Son S/ 23.50.
  Elige cómo pagar:» with the two buttons · the touch dot presses «Pagar ahora con Yape» · the in-chat
  browser opens the payment page (`pago.html`'s screen: Bodega Yesenia · S/ 23.50 · «Pagar ahora» with
  the Yape mark, «Pagar después» with the Rocoto face) · she picks «Pagar ahora» · «Pago enviado» ·
  the sheet closes · incoming «Recibido, Rosa. Te espero a las 5 🙌».

## Peter's words on fit and arrangement (19 September, night), verbatim, and what they change

> and all of the fitting, arrangement, alignment, initial scroll animations, shrinking/etc, scaling, fonts, spacing, across ALL viewports. their images for the security thing etc. very fucking good., of course, we can generate our own but in the places they do. like the security section can be about bank connections and show the grid below the paragraph and the heart imaghe we can replac with one of our illustrations, like of the fish salesman with a portrait framr for desktop since its on the right and the same image landscape framed on mobile at the top fo the section, get it??

> and the simplicity of their nav bar etc. their thing is so good but so simple, it does it all

What changes (this section overrides the page anatomy below where they differ):

1. **The reference is the yardstick for fit, at every viewport.** The study's measured system is the
   bar: gutter `clamp(22px, 3.2vw, 62px)`, content max 1200, one easing, the type scale and how it
   steps down from 1440 to 390, the row gaps and section paddings, how the hero shrinks and the phone
   scales, where each block sits at 1920, 1440, 1024, 768, 390 and 360. Meet those proportions with our
   own code, our own words, our own pictures and our own colour. Their distinctive objects stay theirs
   (the green glass pill, their artwork, their typeface, their handset): ours are the ink pill, our
   illustrations, an open-licence face and the handset we draw.
2. **Type.** Their face is a commercial grotesque set light (weight 400) with tight tracking, and the
   open-licence face they themselves name as its fallback is **Hanken Grotesk** (OFL, Google Fonts).
   This page sets display AND body in Hanken Grotesk: display at 400 with `letter-spacing` about
   −0.045em and line-height about 0.98–1.04, body at 400 in stone grey at −0.01em. Fraunces leaves this
   page (keep the family behind one custom property, `--display`, so it can be switched back in one line).
3. **The nav is as simple as theirs:** the face and «Rocoto» left, three links («Cómo funciona» ·
   «Bancos» · «Preguntas»), the act as the ink pill right. Nothing else. It tightens after the first
   scroll and changes tone over the dark band.
4. **The order of the page follows the reference's slots:**
   hero (headline, sub, acts, the phone rising from the foot) → the **dark statement band**, its
   sentence revealing letter by letter while the phone turns edge-on and flies → the phone **docks into
   the first story row**, which is the pinned three-step stage («Tú, la bodega», scrubbed by scroll) →
   the story rows by point of view, alternating (tu proveedor · tu cliente · en tu tienda) → a light
   band, words left and picture right: **«Tus pedidos, en tu celular y en tu computadora»** (the desk
   frame with the phone over its edge) → the **bank band** (below) → «Para quién» (the three
   illustrated cards and the distributors' band) → preguntas → the closing card → the footer.
   The separate «Tres pasos» three-column section stays, directly after the story rows, as the static
   recap Peter asked for.
5. **The bank band takes the place their security band holds** (a dark band, words left, picture
   right): H2 **«Conecta la cuenta que ya usas»**; paragraph «Eliges tu banco, tu caja o tu billetera una
   sola vez. Rocoto anota cada pago en tu negocio.»; **the grid of bank tiles directly under the
   paragraph**, in the left column (white tiles on the dark band, 4 columns on a desk, 3 on a phone);
   the small line about the marks under the grid; and, where their picture sits, **our fishmonger
   illustration in a portrait frame on a desk** (right column, tall rounded frame, `/peru/img/voice-and-photo.webp`)
   and **the same picture in a landscape frame at the top of the section on a phone** (`<picture>` art
   direction: the same file with `object-fit: cover` and an `object-position` that keeps the man and the
   fish whole; judge by looking, and if a 16:9 cut of the portrait loses him, use `/peru-shit/hero-money.webp`,
   the fish stall cover, for the landscape frame).
   The three trust facts (Meta's official connection, the six months of chats, the supervised lender
   with the two cleared sentences) move into «Preguntas» and the footer, which already carry them.
6. Every picture slot of the reference gets one of OUR pictures in the same place and proportion: the
   closing card carries the bodega cover where theirs carries its glass bubble; the orders band carries
   the desk-and-phone composition where theirs carries its printer.

## Peter on the banks (19 September, night), verbatim

> do these banks: Banco de Crédito del Perú (BCP) – The largest commercial bank in Peru. · BBVA Perú · Interbank · Scotiabank Perú · BanBif (Banco Interamericano de Finanzas) · Banco Pichincha · Mibanco

> imagine something has 35 parameters, fair enogu hwe dont copy them verbatim, but we have all 35 parameters, just ith slightly different settings. their page is also INSANELY light.

What changes: the grid shows **these seven, in this order** (`featured: true` in `/peru/banks/manifest.json`,
which now lists them first): BCP · BBVA · Interbank · Scotiabank · BanBif · Banco Pichincha · Mibanco.
On the page the eighth tile reads «y 28 entidades más» and opens the rest (a `<details>`, so it works
with scripts off); inside the phone's «Elige tu banco» screen the grid is the seven plus a last tile
«Otro banco o caja». Keep every dimension of craft the study lists (nothing is dropped for speed), set
with our own values; and keep the page visually LIGHT: few things in view at once, generous white
space, the light type weight, colour only on the act and inside the phones.

## The phone — a fixed screen, scaled whole

Every phone on the page is the same component, and its screen is a **390 × 844 document scaled as one
piece**, exactly like a screenshot. The page's viewport never reflows what is inside a phone.

```html
<figure class="ph" data-demo="/peru/demos/compras.html" data-mode="auto">
  <div class="ph-body">                 <!-- the handset, drawn in CSS, aspect-ratio locked -->
    <div class="ph-screen">             <!-- clips to the screen's rounded rectangle, radii in % -->
      <img class="ph-poster" src="/peru/demos/posters/compras.webp" width="1170" height="2532" alt="…">
      <iframe class="ph-frame" title="…" tabindex="-1" aria-hidden="true" width="390" height="844"></iframe>
    </div>
    <span class="ph-island"></span>
  </div>
  <figcaption class="ph-note">Conversación simulada</figcaption>
</figure>
```

- `.ph-body` has `aspect-ratio` fixed (screen 390:844 plus an even bezel); its WIDTH is the only thing
  the layout sets (`--ph-w`). The iframe is 390 × 844 CSS px with `transform-origin: 0 0;
  transform: scale(var(--ph-s))`, and `--ph-s = screenWidth / 390` is set by one ResizeObserver.
- The poster (a real capture of the demo at 3×, made by `peru/tools/posters.py` with Playwright) shows
  first and is what a reader without scripts sees; the iframe is attached when the phone nears the
  viewport and fades in when the demo posts `{type:'rocoto-demo', state:'ready'}`.
- `data-mode`: `auto` (plays while on screen, pauses off screen, loops after a rest), `scroll` (the
  parent posts `{type:'rocoto-demo', cmd:'progress', p:0..1}` and the demo seeks its timeline),
  `static` (poster only). Commands: `play`, `pause`, `restart`, `progress`.
- The handset is drawn, never an image: titanium edge (two-stop border), 1 px inner highlight, island,
  soft contact shadow under it. It may tilt a few degrees in 3D on the hero's journey. It looks right at
  240 px wide and at 420 px wide.
- A desk frame (`.desk`) for the orders band: a browser window drawn in CSS around a fixed-ratio
  capture (`<img>` with width and height), so it also scales as a screenshot.

## WhatsApp, drawn as WhatsApp (`peru/wa/`)

`wa.css` + `wa.js`, used by every demo page. iOS WhatsApp, light theme, Spanish. It must survive a
side-by-side with a real screenshot: status bar (time, signal, Wi-Fi, battery), chat header (back
chevron with unread count, avatar, name, «en línea» / «grabando audio…» / «escribiendo…», video and
call glyphs), the doodle wallpaper on `#EFEAE2`, bubbles (incoming `#FFFFFF`, outgoing `#D9FDD3`, 7.5 px
radius, the tail on the first bubble of a run, 1 px soft shadow), 16 px system text (`-apple-system,
"SF Pro Text", "Helvetica Neue", Inter`), the time and the grey/blue double ticks tucked into the last
line, date chips, the encryption notice, **voice note** (avatar with mic badge, play/pause, 1×, waveform
bars that fill as it plays, duration counting), **photo message**, **CTA-URL buttons** under a bubble
(hairline divider, the external-link glyph, WhatsApp blue `#027EB5`-family text; two stacked buttons
are allowed), **quick-reply buttons**, link preview card, centred system chip, typing dots, the
composer (plus, field, camera, mic), the **notification banner** dropping from the top, the **chat
list**, the home indicator, and the **in-chat browser**: a sheet that slides up over the chat with its
bar («Listo» on the left, the lock and the host in the middle, reload on the right), a thin progress
line, then the page. All glyphs are inline SVG drawn for this kit.

**AND TWO THINGS THAT ARE NOT WHATSAPP AT ALL.** The first is **Rocoto's confirmation**, drawn in
HTML rather than decoded — Rocoto's paper, its face mark, a lead, the payee, the figure through
`WA.figure` and a quiet reference. It has two shapes and one drawing (`cardHTML(c, wide)`): the
card an image message carries (`kind: 'card'`), and the OPEN-GRAPH frame that stands in the picture
slot of a link preview (`previewHTML`, `p.card`), which is how it travels since item 17c — with
the tick where the funds were sent, and without it where a link asks a customer to pay. The kit
also marks a message Rocoto sent FOR the shop (`by: 'rocoto'`) and paints a URL inside a message in
the app's own link blue (`link: true`, or a string for an address on its own line). The second is a **full-screen app page** (`scene.app`) that opens with iOS's
scale-and-fade while whatever is behind it stands back; on delivery it holds the whole demo, and
Rocoto's own camera is a page of it. Each is a state of the clock like every other part of the
kit — `scene.app` with its `at` / `down`, `scene.flash` for the shutter's white beat — so a scrub
answers for both, and each cycle's own is installed by `setApp` without rebuilding a decoded
photograph. `scene.camera` and `scene.share`, iOS's own camera and its share sheet, are still in
the kit and no demo draws them: item 17b took the phone off iOS and put it inside Rocoto.

`wa.js` is a small timeline player: a demo declares its events (`at` ms, `do`), and the player can
`play`, `pause`, `restart`, `seek(ms)` and report `duration`. Seeking renders the state AT that time
(scroll mode must scrub backwards and forwards cleanly), so events are declarative state changes, and
CSS transitions carry the motion. Auto mode rests 3.5 s on the last frame and loops with a cross-fade.
`?poster` renders the demo's chosen poster frame with motion off. `prefers-reduced-motion` renders the
poster frame and steps through states without transitions.

## The demos (`peru/demos/*.html`, each 390 × 844)

FOUR DEMOS. Three are the BUYER'S phone and stand in the three rows of the main page — item
**17d** put every row on that one phone — and the fourth is the SELLING page's. Every one is a
fixed 390 × 844 document built on the kit in `peru/wa/`, painted in English with a Spanish table
beside it (`?lang=es`), and every one runs an ENDLESS loop: the next exchange is appended ahead of
the clock, so nothing resets, no frame is a dead one, and the DOM stays the size of one
conversation. Money in soles, «S/ 386.00». Rocoto is an APP throughout — a link, a notification, a
screen — and a chat with a Rocoto contact appears on no page.

**THE THREE ROWS TELL ONE PURCHASE.** The order in `compras.html`, the paper in `entrega.html` and
the settled document in `cobro.html` are the same four lines of Distribuidora Ricardo's standing
restock and the same S/ 386.00 — rice, cooking oil, evaporated milk, powder detergent — so a reader
who goes down the page follows one purchase from the order to the day it settles.

The businesses: **Bodega Yesenia** (the shop the reader is), **Distribuidora Ricardo** (its
supplier, and the name on the paper), **Lácteos del Valle** and **Iván gaseosas** (its other
suppliers, off the prototype's own cast), **Rosa menú** (the lunch place that buys from it).

**MINIMAL NOISE (item 17c).** Every chat demo opens EMPTY: WhatsApp's encryption notice, today's
chip, and nothing else. Peter, on seeing the old ones — «right now you have other timeconvo stuff
int he messages above the animated new oens and thats the thing that confuses people. minimal noise
/ infinite loops therefore.» So no yesterday, no small talk, and the first thing that happens is
the first beat of the loop.

**THE CONFIRMATION TRAVELS AS A LINK, AND THE PREVIEW CARRIES THE DATA (item 17c).** Peter: «would
actually be a link with the social graph image preview being that confirmation tick that the funds
were sent. a nifty way to use previews as real data.» So the shop's message is a URL —
`soyrocoto.com/p/5409-118` — and above it WhatsApp's own preview: the picture, then the title and
the host. The PICTURE is Rocoto's confirmation, drawn by the kit in an open-graph frame
(`cardHTML(card, wide)` inside `previewHTML`; `.wa-card.wide.tick` in `wa.css`): the tick, «Funds
sent», the figure, and the supplier's name. It is HTML rather than a photograph, so it is crisp at
every width the page scales a handset to — 268 px of card inside a 390 px screen, which is 185 px
where a row draws the handset at 270, and it was judged at that size. The same drawing without its
tick is the preview of the SELLING link, where it states the order and its total instead.

1. **`compras.html`** — WHEN YOU BUY, and the HERO's own phone. The shop's phone in Distribuidora
   Ricardo's chat. The order simply sends (the shop is never shown typing); Ricardo's total comes
   back with the three dots before it; the shop writes «I'll pay it later with Rocoto»; its next
   message is the LINK, with the confirmation as its preview; Ricardo answers «Got the funds,
   thanks!» and then that the order arrives tomorrow. Rest, and the next day's order under it, for
   ever — four orders, each with its own goods, total and reference.
   - Beats, in ms: 600 the order · 2600 the total · 4300 «I'll pay it later with Rocoto» ·
     6000 the link · 8200 the thanks · 9900 it arrives tomorrow · 11200 the end, 2600 of rest.
   - Poster: 10600, the whole exchange on one screen. It is also what the hero paints first, at
     `fetchpriority=high`, so the hero's phone reads before its iframe is attached.

2. **`cobro.html`** — WHEN IT IS TIME TO PAY: that one moment and nothing else (item 17d, Peter:
   «I think here we just need to show that they can get their money deposited in their Yape…
   automatically debited at the time, so they don't have to worry about missing a payment. That's
   it.»). The phone is asleep. Rocoto — the app, wearing its own face on ink, with no messenger
   badge — says the purchase from Distribuidora Ricardo was collected from your Yape today. A
   touch, the lock lifts, and Rocoto stands on that purchase: the document `entrega.html` reads
   off the paper, with the settled block in the place the act stood — «Paid in full · Collected
   from your Yape today». The screen dims, the phone locks, and the next purchase lands the same
   way: Lácteos del Valle, Iván gaseosas, round and round.
   - Beats, in ms: 900 the notification · 2900 the touch · 3250 the app · 8400 the screen dims ·
     8700 locked again · 9600 the end of the cycle.
   - The screen DIMS to .58 and never goes black: on the page a handset with black glass for most
     of a second reads as a broken phone.
   - THE DOCUMENT IS LIFTED, never drawn — `WA_PAGES.collected` shares `doc()` with the delivery
     demo, so both screens are the one drawing off `app/src/prototypes/bodega-pay-later/` and
     `peru/cap/pedido-movil.webp`. The settled block is the shape `money-overview.tsx` gives a
     purchase it has closed, where the act's cell simply stands empty.
   - The words carry no credit: the purchase's own total, «Paid in full», «Collected from your
     Yape today». No rate, no term, no day it was owed by, no amount, no approval word. The day a
     collection lands is the day agreed, and it differs from purchase to purchase, so no gap on
     the screen reads as a term.
   - Poster: 2000, the sleeping phone with Rocoto's notification on it. Row three already stands
     as that document, and two still phones drawing the same page read as one picture twice.

3. **`entrega.html`** — ON DELIVERY, ENTIRELY INSIDE THE ROCOTO APP. Peter, 20 September: «when
   they take the invoice pic that should literally auto turn into a "pay later" screen that they
   just tap and boom. not go to "sharing" to add to rocoto. would be in the real rocoto app… say
   when they'll be charged automatically for it, and then it goes to the [camera] again. as the
   loop». So there is no WhatsApp on this phone, no iOS camera and no share sheet. The app's own
   camera stands on the paper invoice — the app's head, a plain viewfinder with four corner marks,
   one shutter — the shutter goes, the phone's white beat with it, and the frame is held for a
   moment while the invoice is read. Then the photograph turns by itself into THE PURCHASE, and
   there is ONE act at its foot: `Pay later`. A touch, and where the act stood the settled block
   says the supplier is paid today and that Rocoto collects it automatically on the agreed day —
   no date, no rate, no amount of credit. Then the camera again, for the next invoice.
   Poster: the invoice read, and the one act at its foot.
   - Beats, in ms: 0 the camera · 1700 the shutter · 1900 the frame held, «Reading the invoice…» ·
     3000 the purchase · 5200 pay later is pressed · 5600 it is done · 8400 the camera again.
   - **The purchase screen is LIFTED, never drawn** (the law: «any Rocoto app screen shown is
     lifted from the real prototype»), and it is set exactly as OUR DELIVERY NOTES are set — Peter:
     «And the invoice should be in the nice format that we do them in our site. you didnt use the
     same style as our delivery notes in terms of structure and stuff». Its parts and where each
     one comes from are named in `WA_PAGES.purchase` (`peru/demos/pages.js`), off
     `app/src/prototypes/bodega-pay-later/` and the real capture at `peru/cap/pedido-movil.webp`:
     the document head of `detail.tsx` on a phone (the supplier at HeadingXSmall, the day under it
     in the brand's own date face, then the provenance line at LabelXSmall in `contentTertiary`);
     one line per line off `document-parts.tsx` and that capture — the painted face at 40 px, the
     name at LabelMedium, the quantity in ink with its unit beside it, the row's own menu at the
     right edge, on a **66 px pitch**; the count strip the real screen carries above its dock; the
     figure lockup of `rocoto/figure`; and one 52 px act as `pay/link.tsx` draws one. Base Web's
     own ramp under the Rocoto theme, Inter, Base's colours and its 8 px corner. No rate, no term,
     no date owed by, no approval word: `Offered` and `Used` render only once a lender signs
     (`paylater.ts`), so they are absent here too.
   - **The faces** are the product's own paintings, resized to 120 px and kept beside the demo:
     `peru/demos/av/faces/{arroz,aceite,leche}.webp`, off
     `app/public/paintings/` through `fixtures/cast-bodega.json`. A product nobody has painted yet
     stands as its seat alone, which is what the real screen draws.
   - **The photograph** is ours: `peru/demos/av/invoice-counter.webp` (1170 × 1560, 102 KB), an
     invoice of Distribuidora Ricardo — a sample R.U.C., the four lines of the standing order, the
     total in soles — rendered from HTML, warped onto a counter, lit, shadowed and grained by
     `scratchpad/landing/delivery/shoot_invoice.py`. ⚠ THE PAPER AND THE APP AGREE: the day
     (19/09/2026 → «Saturday 19.09»), the number (E001-004812), the four lines and the total the
     app reads back are that paper's own, so the loop is the SAME delivery rather than a new date
     the paper would contradict. A per-supplier paper is a re-run of that script with its fields
     changed, at about 100 KB each, and a Spanish paper is the same re-run when Spanish ships.
4. **`tienda.html`** — WHEN YOU SELL, the SELLING page's own demo, on the SELLER's phone (item
   17e). The chat is with a CUSTOMER — Rosa menú, off the prototype's cast — and never with
   Rocoto. She orders; ROCOTO ANSWERS FOR THE SHOP, and that outgoing message says so: the kit's
   own Rocoto mark and «Sent by Rocoto» (`.wa-by` in `wa.css`), the order as the link's preview,
   and the address under it. Then HER side of that link opens in the chat's browser at the slower
   pace: the shop and its address, the order set as OUR delivery note, the amount, and «Pay now»;
   then Yape's and Plin's marks, the amount as a figure, the shop's own number, «Copy the amount»,
   and «Open Yape», which is asleep until the amount is in hand. She pays, writes that she has,
   and Rocoto writes the sale down with the day's.
   - Beats, in ms: 700 her order · 3000 the link · 5200 she opens it · 5400 the browser and her
     page · 9000 «Pay now» · 9350 Yape and Plin · 12000 «Copy the amount» · 12350 «Open Yape»
     awake · 14600 she presses it · 15200 the browser falls · 16400 she has paid · 18200 the sale
     is written down · 19400 the end, 2600 of rest.
   - **Her page is LIFTED** — `WA_PAGES.pay`, off `pay/link.tsx`, which carries four facts and
     nothing else: whose shop it is, the exact amount, what it is for, and how to pay. Its own
     research is why the amount is copied first: no published Yape address carries an amount
     (`WIRING-SPEC.md` §15), so `Open Yape` comes live once the figure is on the clipboard. The
     order inside it is the same `doc()` the app draws, `flat` — in a page's column rather than
     filling a screen.
   - **Yape's and Plin's marks** are the files the scouts brought (`peru/banks/yape.webp`,
     `peru/banks/plin.webp`, each app's own square tile on a wide canvas, taken with `cover`), and
     they stand where the customer pays, under «Pay with Yape or Plin».
   - **The day is the cycle's, not the goods'.** The chat's date chip and the day on the delivery
     note are computed from one base (`dayOf(k)`), so a thread that has run for an hour never
     shows a chip from one day over a document from another.
   - Poster: 8200, her page open on the order with its amount and its act.
   - Nothing about credit is on this phone: auto-collecting what another business owes is a COMING
     SOON section of the selling page, and it is free.

**The in-chat browser travels a third slower** than it did (item 17b): its rise is 800 ms rather
than 600 (`SHEET_MS` in `wa.js`, `--wa-sp-sheet-slow-t` in `wa.css`), its loading line 960 ms rather
than 720, and a page change 350 ms rather than 260. The banner's drop, the share card and the
composer keep their own 600. `tienda.html` is the only demo that opens one, and each page of it
stands still for about two and a half seconds.

**What the page checks before it believes a demo** (run at 390 × 844, DPR 3, against the worktree's
own server; the runner is `peru/tools/check_demos.py`): twelve or more instants across TWO cycles on
a contact sheet somebody has LOOKED at; the console clean; `?t=` painting the same pixels twice
over; the thread bounded — eight cycles and the DOM is still the size of one conversation (measured
20 September: compras 25 rows and 339 nodes, cobro 0 rows and 175 nodes with one banner, entrega 0
rows and 230 nodes, tienda 22 rows and 427 nodes); the protocol intact (`{state:'ready', duration}`
out, `play` / `pause` / `restart` / `progress` in); and a PAUSED phone a still photograph — zero
running animations, zero rAF, the clock frozen and two screenshots a second and a half apart
identical to the byte.


## The page (`peru.html`, `peru/peru.css`, `peru/peru.js`)

Type: **Fraunces** for display (opsz, weight 560–620, tight tracking), **Inter** for everything else;
the two the site already loads. Colour (from `brand-vars.css`): paper `#FAF7F3`, cloud `#F2ECE5`, white cards, line `#DAD2C8`, ink `#1A1413`,
stone `#6F665C` for secondary text, Rocoto red `#C01B2C` for the numerals and the one accent, WhatsApp green only inside
phones and on the WhatsApp glyph of the act. One dark band. Max width 1200, 24 px gutters on a phone,
sections breathe (clamp 72–140 px). Everything works at 360, 390, 768, 1024, 1440, 1920.

0. **Nav** — fixed, a glass bar that tightens after the first scroll: the Rocoto face (`/brand/face-open.svg`,
   blinking via `/brand/face-blink-transparent.gif` where motion is allowed) + «Rocoto» left;
   «Cómo funciona» · «Compras y ventas» · «Bancos» · «Preguntas» centre (hidden under 860 px); the act
   as a dark pill right: «Conecta tu WhatsApp». No dropdown, no burger menu with other pages.
1. **Hero** — H1 (Fraunces, clamp 40–84 px, words rise one by one on load):
   **«Pagar después a tu proveedor, desde tu WhatsApp»**
   Sub: **«Le pides como siempre.»** «En el mismo chat eliges pagar ahora con Yape o pagar después con
   Rocoto, y tu proveedor cobra.»
   Acts: «Conecta tu WhatsApp» (dark pill, WhatsApp glyph) · «Mira cómo funciona» (text, arrow down).
   Status line under the acts, 14 px, ink at 70 %: «Versión de prueba, con pantallas en inglés por
   ahora. Estamos preparando crédito de capital de trabajo para negocios como el tuyo, con una entidad
   financiera supervisada por la SBS.»
   The phone's top third rises from the foot of the hero.
2. **The journey** (`#como-funciona`) — a pinned stage (`position: sticky`, about 400 vh of scroll):
   the ONE phone travels from the hero's foot to the centre, grows to about 84 vh tall (never wider
   than 86 vw), and its `hero.html` timeline is scrubbed by the scroll. Beside it on a desk, above it on
   a phone, three captions swap with the chapters, each a big red numeral, a heading and one sentence:
   1 **«Pides como siempre»** «Le escribes a tu proveedor por WhatsApp, igual que hoy.»
   2 **«Eliges cómo pagar»** «En el mismo chat llega el link: pagar ahora con Yape o pagar después con Rocoto.»
   3 **«Eliges tu banco una vez»** «Tu proveedor recibe su pago y tu compra queda anotada.»
   A progress rail of three dots. With reduced motion, or without scripts, the stage is three static
   rows, each with a poster of its chapter.
3. **Dark band** — one sentence in large type, letters lighting as it scrolls in, with the WhatsApp and
   Yape marks inline: «Tus clientes y tus proveedores ya están en WhatsApp. Ahí mismo cobras y pagas.»
4. **Three steps, three columns** (`#tres-pasos`) — H2 «Tres pasos». Cards with a big numeral, a small
   visual, heading, sentence: 1 **«Conecta tu WhatsApp»** «Usas tu mismo número, y tu WhatsApp Business
   sigue igual en tu celular.» 2 **«Pide y vende como siempre»** «Rocoto lee tus chats y anota cada
   pedido, cada fiado y cada pago.» 3 **«Paga ahora o paga después»** «Cada pedido lleva su link: Yape
   al momento, o pagar después con Rocoto.»
5. **Compras · Ventas · En tu tienda** (`#compras-y-ventas`) — H2 «En tus compras, en tus ventas y en tu
   tienda». A segmented control centred on top (three pills, the active one slides); under it a phone
   (the demo of the tab) and the tab's copy; the tab changes on tap, and by itself every full loop.
   - Compras: **«Tu proveedor cobra y tú pagas después»** «Pides por WhatsApp. El link llega al mismo
     chat con las dos opciones.» (`compras.html`)
   - Ventas: **«Tu cliente paga desde el chat»** «Cuando te hacen un pedido, Rocoto responde por ti con el
     total y el link: Yape al momento, o pagar después.» (`ventas.html`, and `pago.html` beside it on a desk)
   - En tu tienda: **«Una nota de voz y una foto»** «Dices qué se lleva tu cliente y tomas una foto. Rocoto
     lo anota y te da un QR para cobrar.» (`tienda.html`, and beside it on a desk the `scan-qr`
     illustration inside a second phone body, same ratio.)
6. **Orders on the phone and on the desk** (`#pedidos`) — H2 «Tus pedidos, en tu celular y en tu
   computadora». «Cada pedido que llega por WhatsApp queda anotado, con su nota de entrega y su
   conversación. Lo preparas desde el celular y lo imprimes desde la computadora.» A desk frame with the
   real capture of Prep at 1440 × 800 and, overlapping its right edge, a phone with the real capture of
   the same order at 393 wide (the detail pane). Under both: «Pantallas de la versión de prueba, en
   inglés por ahora.»
7. **Banks** (`#bancos`) — H2 «Conecta la cuenta que ya usas». «Eliges tu banco, tu caja o tu billetera
   una sola vez.» A grid of tiles from `/peru/banks/manifest.json` (white tile, 1 px line, logo centred
   in a 160 × 64 box, name as `alt`; 3 columns on a phone, 6 on a desk; tiles rise in a stagger). Under
   the grid, small: «Las marcas pertenecen a cada entidad. Rocoto las muestra para que encuentres la tuya.»
8. **For whom** (`#para-quien`) — H2 «Para bodegas, puestos de mercado y pescaderías». Three tall cards,
   each an illustration (16:9 art cropped to the card) with a label and one line:
   Bodegas «Tus pedidos al mayorista y tus fiados, anotados.» · Puestos de mercado «Lo que compras de
   madrugada y lo que te deben tus caseros.» · Pescaderías «El pedido del día y el cobro, en el mismo chat.»
   Then a wide band with the `supplier-van` illustration: **«Para distribuidores y mayoristas»** «Ofreces
   las dos opciones en cada pedido. Tu cliente elige, y el pago queda anotado en los dos negocios.»
9. **Trust** (`#confianza`) — H2 «Tu WhatsApp sigue siendo tuyo». Three facts: **«Conexión oficial de
   Meta»** «Rocoto se conecta con la integración de WhatsApp Business. Tu app sigue funcionando en tu
   celular.» · **«Tus chats de los últimos 6 meses»** «Rocoto los lee uno por uno para anotar pedidos,
   fiados y pagos. Tus grupos quedan aparte.» · **«Crédito con una entidad supervisada»** + the two
   cleared sentences verbatim. Link: «Política de privacidad».
10. **Preguntas** (`#preguntas`) — accordion, first open, plus/minus morph, height animates:
    - «¿Necesito WhatsApp Business?» «Sí. Es la app gratuita de WhatsApp para negocios. Pasas tu número
      y tus chats en unos minutos, y Rocoto se conecta a esa app.»
    - «¿Cuándo abre pagar después?» + the two cleared sentences verbatim.
    - «¿Mi proveedor tiene que usar Rocoto?» «Le llega una invitación desde tu WhatsApp. Cuando conecta
      el suyo, el link de pago aparece en tus pedidos con él.»
    - «¿Qué lee Rocoto de mi WhatsApp?» «Tus conversaciones de los últimos 6 meses, una por una. Tus
      grupos quedan aparte y tus listas de difusión pasan a modo de lectura.»
    - «¿Funciona con Yape?» «Sí. Cada venta puede llevar su link de pago: tu cliente ve el monto exacto
      y te paga desde su Yape o su banco.»
    - «¿Qué ve la SUNAT de mis yapeos?» «Tu plata de Yape está en una cuenta del banco, y el banco le
      informa a la SUNAT el saldo de esa cuenta cuando llega a S/ 38,500 en el mes, que son 7 UIT en 2026.»
11. **Closing card** — rounded card on paper with the bodega illustration: H2 «Conecta tu WhatsApp»
    «Usas tu mismo número, y tu WhatsApp Business sigue igual.» + the act.
12. **Footer** — the face and «Rocoto para bodegas, puestos de mercado y pescaderías en el Perú.»;
    links (the sections, «Política de privacidad», `hello@soyrocoto.com`); the regulator's sentence,
    always visible; «© 2026 Rocoto. Rocoto es un producto de Leo Casa Ltd.»; the marks line.

Motion: reveals are 12–16 px rises with opacity over 500–700 ms on a soft ease-out, staggered 60–90 ms,
once; the act has a pressed state; nothing bounces; nothing moves with reduced motion. No layout
shift: every image carries width and height. LCP is the H1. No framework, no three.js: plain HTML,
CSS and one small script per concern. The page reads whole with scripts off.

`<head>`: title «Rocoto | Pagar después a tu proveedor, desde tu WhatsApp», description, canonical
`https://soyrocoto.com/peru`, `hreflang es-PE`, Open Graph with `/peru/og-peru.jpg` (1200 × 630, made
from the hero: the H1 on paper with the phone), favicon links as the site's other pages.

## Files and who owns them

| Path | Owner |
|---|---|
| `peru/wa/wa.css`, `peru/wa/wa.js`, `peru/wa/glyphs.svg` (if used), `peru/demos/*.html`, `peru/demos/posters/*`, `peru/tools/posters.py` | the WhatsApp builder |
| `peru.html`, `peru/peru.css`, `peru/peru.js`, `peru/phone.css`, `peru/og-peru.jpg`, `peru/cap/*` | the page builder |
| `peru/banks/*`, `peru/img/*` | the scouts (arrive under `peru-next/`, moved in by the lead) |

## Acceptance

1. At 360, 390, 768, 1440 and 1920 wide every phone's screen is pixel-identical in layout (only scaled):
   measured by comparing the iframe's inner layout width (always 390) and by overlaying captures.
2. A real WhatsApp screenshot beside `compras.html` reads as the same app.
3. The journey scrubs forward and backward with the scroll at 60 fps on a mid phone, and the page is
   whole with scripts off and with reduced motion.
4. No string breaks a law above; the legal lens finds no rate, term, instalment count, approval word or
   availability claim.
5. Lighthouse mobile: performance ≥ 90, accessibility ≥ 95, CLS < 0.02.
6. Looked at, as painted, by a person: it reads as the company's main page, never as a side page.
