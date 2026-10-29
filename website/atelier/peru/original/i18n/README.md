# The Peru site's words, in two languages

Peter, 20 September 2026: *«please make it in spanish as a snapshot of this finalised version and
put the english one under .com/en and put a language dropdown in the navbar by the CTA».*

**English is the source.** `peru.html`, `peru/privacy.html`, `peru/terms.html` and
`peru/cookies.html` are the live page sources. The credit home is served at `/creditoperu/en`;
English legal pages retain their `/en` URLs. **Spanish is generated.**
`tools/peru_i18n.py` writes their twins in `peru/es/` using the dictionaries in `es/` here;
they are served at `/creditoperu`, `/privacy`, `/terms` and `/cookies`.

**Since 22 September, credit leads one marketing page.** Sales, fiados, receipts and credit
have short detail sheets linked from its roadmap. The primary action is joining the waitlist;
the roadmap distinguishes that available action from features in preparation. Legal pages stay
separate. Their navigation returns to Home and What's coming.

The historical Selling source, `peru/sales.html`, and its generated twin remain in the translation
pipeline for reference. Their old public URLs redirect to the home roadmap in the same language;
the current landing page uses roadmap anchors instead of linking to Selling. The route map in
`tools/switch/ROUTE-MAP.md` records those addresses.

**Nobody hand-edits a generated file** — the first line of each one says so, and `check` catches
it if anyone does.

```
python3 tools/peru_i18n.py extract     # re-read the sources → en/{main,selling,legal}.json
python3 tools/peru_i18n.py build       # write peru/es/*.html
python3 tools/peru_i18n.py check       # the gate
```

## The translation dictionaries

`en/main.json`, `en/selling.json` and `en/legal.json` are READ-ONLY output: an ordered list of
every string on the page, each one `{en, kind, where}`.

* `kind` — `html` (the words inside one block), `attr` (an `alt`, a `title`, an `aria-label`),
  `meta` (the `<title>` and the share text), `jsonld`.
* `where` — the file, the section and the heading the string sits under, so you can find it on the
  page without searching for it.

`es/main.json`, `es/selling.json` and `es/legal.json` are what you WRITE: one flat object, keyed by
the **exact** English string, valued by the Spanish one.

```json
{
  "What's coming": "Lo que viene",
  "<a href=\"/creditoperu/en\">Home</a> <a href=\"/creditoperu/en#roadmap\">What's coming</a>":
    "<a href=\"/creditoperu/en\">Inicio</a> <a href=\"/creditoperu/en#roadmap\">Lo que viene</a>"
}
```

Three rules, and `check` holds each of them:

1. **The key is the English string, character for character.** Copy it out of the `en/` file.
2. **Whatever markup is in the English is in the Spanish.** A `<b>`, an `<a href="…">`, an
   `<em class="tl-tag">` — the tags carry weight, a link or a tag pill, and dropping one changes
   the page. The addresses inside a link stay in the English world (`/creditoperu/en#roadmap`); the build moves
   them to the Spanish one (`/creditoperu#roadmap`) for you.
3. **`{i1}`, `{i2}` are the page's own icons** — a WhatsApp glyph, an arrow, a chevron. Leave each
   one where it belongs in the Spanish sentence; the build puts the real SVG back. Two more
   placeholders behave the same way: `{wa}` marks the word the WhatsApp glyph rides on in the dark
   band's sentence, and `{br}` is where the H1 breaks its line.

`legal.json` holds all three legal pages at once, and a string used on two of them is written once.

## The current glossary

Use Peter's exact lines wherever he supplies them. The current landing page reflects his
22 September direction; the historical Buying/Selling headings and Yape sales headline are retired.

| English | Spanish (Peru) |
|---|---|
| credit to stock your business | **Crédito para comprar mercadería** |
| pay with credit | **Paga a crédito** |
| sales on your phone | **Ventas en tu celular** |
| tabs and collections | **Fiados y cobros** |
| auto-collect your tabs | **Auto-cobro de fiados** |
| electronic receipts | **Boletas electrónicas** |
| bodegas, retailers and wholesalers | **bodegas, minoristas, mayoristas** |
| to sell on credit · a tab | **fiar** · **fiado** |
| Home · How it works | **Inicio** · **Cómo funciona** |
| Join the waitlist (the act) | **Únete a la lista de espera** |
| What's coming (the timeline) | **Lo que viene** |
| Today · In preparation (the timeline tags) | **Hoy** · **En preparación** |
| When you buy · When it is time to pay · On delivery | **Cuando compras** · **Cuando toca pagar** · **En la entrega** |
| supplier · order · delivery note · invoice | **proveedor** · **pedido** · **nota de entrega** · **factura** |
| Who owes you · paid in full | **Quién te debe** · **Pagado completo** |
| sample · business · waitlist | **de muestra** · **negocio** · **lista de espera** |
| you move up | **subes en la lista** |
| covered by Rocoto | **los cubre Rocoto** |

The reader is **tú**, in Peruvian usage — the way Yape and a Lima bodega talk. Supplier and
shopkeeper call each other **casero / casera** in a chat. Money in page copy is **dinero** or
**pago**; **plata** belongs in a chat bubble. `S/ 386.00` stays as it is written. Business names and
people's names stay as they are. WhatsApp, Yape, Plin, SUNAT and the SBS are written the way those
institutions write themselves, and WhatsApp's own interface strings use WhatsApp's real Spanish
(«en línea», «escribiendo…», «HOY»).

**The nav's act is the short label.** Measured at 1440 · 1024 · 768 · 520 · 390 · 360 · 320, with
every move the brief allows already taken, `Únete a la lista de espera` needs 399 px of a 360 px
bar. So the bar's act reads **`Únete a la lista`**, at every width, and the body's acts keep the
full `Únete a la lista de espera`. The table is in `peru/SPEC.md`.

The nav's act is exactly ONE key, and it is the only one that takes the short label:

| file | key | label |
|---|---|---|
| `main.json` | `{i1}Join the waitlist` | **Únete a la lista** — the bar |
| `main.json` | the roadmap's first-step action | **Únete a la lista de espera** |
| `main.json` | the `<p class="pe-acts">` units, and `Join the waitlist` in the footer | the body |

## Laws that bind the Spanish exactly as they bind the English

* **Say what IS.** Keep copy affirmative. Preserve the existing regulator disclosure exactly:
  «Rocoto no cuenta con autorización ni supervisión de la Superintendencia de Banca, Seguros y AFP.»
* **A heading names the thing, blatantly**, in the same words a stranger would use. Same bluntness
  as the English, same length. No slogan cadence, no kicker carrying the message.
* **Availability stays explicit.** Joining the waitlist is available today. Planned features read
  as **En preparación**, and visitors are told that Rocoto will notify them when they are ready.
  Replace calendar estimates with a confirmed availability statement only when the release is ready.
* **Peter's approved early-signup offer stays precise:** **3 créditos al 0% de interés**,
  **hasta S/500 cada uno**, **7 días para pagar**, for businesses that join before launch. Rocoto
  covers those interest and fees; the customer repays principal. Each loan remains subject to
  assessment and approval. Keep the conditions beside the offer and link to `/en/terms#early-offer`
  (generated Spanish `/terms#early-offer`). The lender, its contractual rates and full conditions
  are disclosed before acceptance, as the terms page states. The earlier blanket ban on showing
  offer figures has been superseded by this explicit product brief; it is not a legal approval.

## The demos and the posters

The four demos under `peru/demos/` keep their own `en` / `es` tables and answer `?lang=`; the
generated Spanish pages ask for `?lang=es` by themselves. What still has to be SHOT in Spanish:

* `peru/tools/posters.py --lang es` writes `peru/demos/posters/<name>-es.webp`, and the build points
  the Spanish pages at each one the moment the file exists;
* `peru/tools/shoot_invoice.py` shoots `peru/demos/av/invoice-counter-es.webp`, the printed invoice
  in `entrega`, and that demo picks it up the moment it answers;
* `peru/og-peru-es.jpg`, the share picture, which the build swaps in the same way.
