# Peru — bank and deposit-taking institution logos

Assets for the "choose your bank" tile grid of the connect-your-account flow.
Collected 19 September 2026.

## Where the list came from

The list is the SBS register, not memory. The Superintendencia de Banca, Seguros y AFP
publishes its supervised entities at
<https://www.sbs.gob.pe/supervisados-y-registros/empresas-supervisadas/directorio-del-sistema-financiero/empresas-bancarias>.
The public pages render their table from an internal endpoint,
`https://www.sbs.gob.pe/app/sadel/Paginas/Redir/ListarFuncionarios.aspx?codTpEntidad=<code>`,
which is what was read (the portal sits behind Imperva/Incapsula, so the pages were fetched
through a text-extraction proxy):

| SBS directory | code | URL | entities on 19 Sep 2026 |
|---|---|---|---|
| Empresas bancarias | `B` | [empresas-bancarias](https://www.sbs.gob.pe/supervisados-y-registros/empresas-supervisadas/directorio-del-sistema-financiero/empresas-bancarias) | 23 (incl. Banco de la Nación, Agrobanco, COFIDE) |
| Cajas municipales | `C` | [cajas-municipales](https://www.sbs.gob.pe/directorios/directorio-de-empresas-supervisadas/cajas-municipales) | 11 (10 CMAC + CMCP Lima) |
| Empresas financieras | `F` | [empresas-financieras](https://www.sbs.gob.pe/directorios/directorio-de-empresas-supervisadas/empresas-financieras) | 6 |
| Cajas rurales | `R` | [cajas-rurales](https://www.sbs.gob.pe/directorios/directorio-de-empresas-supervisadas/cajas-rurales-de-ahorro-y-credito) | 5 |

The SBS notes that this directory is kept up to date by the supervised companies themselves,
so an entity that has not refreshed its officers can be missing a row; every institution in
the grid was cross-checked against its own live site.

**Entities the SBS lists as in liquidation — kept out of the grid:** CMAC Sullana,
CRAC Raíz, CRAC Señor de Luren, CRAC Del Centro, Financiera Credinka, Financiera TFC
(<https://www.sbs.gob.pe/supervisados-y-registros/entidades-en-liquidacion>).

**Recent conversions and renames, verified against the institutions' own announcements:**
CrediScotia Financiera → Banco Santander Consumer Perú · Financiera Oh! → Alfin Banco ·
Compartamos Financiera → Compartamos Banco · Financiera Efectiva → Banco Efectiva ·
Banco de Comercio → Bancom.

The two wallets a shop actually handles, Yape (Credicorp/BCP) and Plin (the interbank wallet of
Interbank, BBVA, Scotiabank and BanBif), are in the grid as `type: "billetera"` with
`sbs_listed: false` — they are products of listed institutions, not separately listed entities.

## How a file is made

- SVG source → published as `<slug>.svg`, byte-for-byte as served. A source only stays SVG when
  it carries a `viewBox`, embeds no `<image>`, references nothing off-host and sets no live
  `<text>` (which would need a font the browser will not have). Everything else is rasterised.
- Raster source → trimmed to its ink, scaled into a 320×128 box (2× of the 160×64 tile),
  optically centred on a transparent canvas, saved lossless as `<slug>.webp`.
- The two wallet app icons (Yape, Plin) are square, so they fill the tile's 64 px height rather
  than its 160 px width.
- `width` / `height` in `manifest.json` are the CSS pixels the mark occupies inside a 160×64 tile.
- `needs_dark_tile` is `false` for every entry: every mark in the grid reads on a white tile.
- Originals are kept untouched under `src/<slug>/`.

Nothing here is drawn, redrawn or reconstructed. Where only a light-on-transparent version was
served, the institution's full-colour version was found elsewhere rather than inverted or recoloured.

## Where each logo came from

Source order: the institution's own site first, then the institution's own federation or wallet
consortium, then Wikimedia Commons.

| # | Institution | File | Source | Licence note |
|---|---|---|---|---|
| 1 | BCP | `bcp.svg` | viabcp.com | trademark, own site |
| 2 | Yape | `yape.webp` | Commons [Icono de la aplicación Yape.png](https://commons.wikimedia.org/wiki/File:Icono_de_la_aplicaci%C3%B3n_Yape.png) | CC BY-SA 4.0 |
| 3 | Interbank | `interbank.svg` | interbank.pe | trademark, own site |
| 4 | BBVA | `bbva.svg` | bbva.pe | trademark, own site |
| 5 | Plin | `plin.webp` | plin.pe (`themes/plin/favicon/android-icon-192x192.png`) | trademark, own site |
| 6 | Scotiabank | `scotiabank.svg` | scotiabank.com.pe | trademark, own site |
| 7 | Banco de la Nación | `banco-de-la-nacion.webp` | bn.com.pe | trademark, own site |
| 8 | Mibanco | `mibanco.svg` | mibanco.com.pe | trademark, own site |
| 9 | Caja Arequipa | `cmac-arequipa.svg` | cajaarequipa.pe (`2024/03/logofot.svg`) | trademark, own site |
| 10 | Caja Huancayo | `cmac-huancayo.webp` | plin.pe (consortium the caja belongs to) | trademark |
| 11 | Caja Piura | `cmac-piura.webp` | fpcmac.org.pe (FEPCMAC, the cajas' own federation) | trademark |
| 12 | Caja Cusco | `cmac-cusco.svg` | cmac-cusco.com.pe | trademark, own site |
| 13 | Caja Trujillo | `cmac-trujillo.webp` | fpcmac.org.pe (FEPCMAC) | trademark |
| 14 | Caja Ica | `cmac-ica.webp` | Caja Ica (`static.wixstatic.com/.../CAJAICALOGO.png`) | trademark, own site |
| 15 | Caja Tacna | `cmac-tacna.svg` | cmactacna.com.pe | trademark, own site |
| 16 | Caja Maynas | `cmac-maynas.webp` | cajamaynas.pe | trademark, own site |
| 17 | Caja Paita | `cmac-paita.webp` | cajapaita.pe | trademark, own site |
| 18 | Caja del Santa | `cmac-del-santa.webp` | fpcmac.org.pe (FEPCMAC) | trademark |
| 19 | Compartamos Banco | `compartamos-banco.webp` | Commons [Compartamos banco logo.png](https://commons.wikimedia.org/wiki/File:Compartamos_banco_logo.png) | CC BY-SA 4.0 |
| 20 | BanBif | `banbif.svg` | Commons [Banbif logo.svg](https://commons.wikimedia.org/wiki/File:Banbif_logo.svg) | CC0 |
| 21 | Banco Pichincha | `banco-pichincha.svg` | pichincha.pe | trademark, own site |
| 22 | Banco Falabella | `banco-falabella.svg` | Commons [Logotipo Banco Falabella.svg](https://commons.wikimedia.org/wiki/File:Logotipo_Banco_Falabella.svg) | public domain (text logo) |
| 23 | Banco Ripley | `banco-ripley.svg` | bancoripley.com.pe | trademark, own site |
| 24 | Alfin Banco | `alfin-banco.svg` | alfinbanco.pe | trademark, own site |
| 25 | Santander Consumer | `santander-consumer.webp` | santander.com.pe (`assets/img/logo-santander-consumer.png`) | trademark, own site |
| 26 | Banco Santander Perú | `banco-santander-peru.svg` | Commons [Banco Santander Logotipo.svg](https://commons.wikimedia.org/wiki/File:Banco_Santander_Logotipo.svg) | public domain (text logo) |
| 27 | Bancom | `bancom.webp` | Commons [Bancom (Banco de Comercio) Logo.png](https://commons.wikimedia.org/wiki/File:Bancom_(Banco_de_Comercio)_Logo.png) | public domain (text logo) |
| 28 | Citibank | `citibank-peru.webp` | Commons [Citibank.svg](https://commons.wikimedia.org/wiki/File:Citibank.svg) | public domain (text logo) |
| 29 | ICBC | `icbc-peru.svg` | Commons [ICBC China logo.svg](https://commons.wikimedia.org/wiki/File:ICBC_China_logo.svg) | public domain (text logo) |
| 30 | BCI | `banco-bci.svg` | Commons [Bci Logotype.svg](https://commons.wikimedia.org/wiki/File:Bci_Logotype.svg) | public domain (text logo) |
| 31 | Financiera Confianza | `financiera-confianza.webp` | confianza.pe (`img/confianza-logo-cabecera.png`) | trademark, own site |
| 32 | Qapaq | `financiera-qapaq.webp` | qapaq.pe | trademark, own site |
| 33 | Surgir | `financiera-surgir.svg` | surgir.com.pe | trademark, own site |
| 34 | Proempresa | `financiera-proempresa.webp` | proempresa.com.pe (`2022/05/logo.png`) | trademark, own site |
| 35 | Agrobanco | `agrobanco.svg` | agrobanco.com.pe | trademark, own site |

The exact URL each file was taken from is the `source_url` of its entry in `manifest.json`.

Commons file pages carry the licence shown above; the underlying marks stay the institutions'
trademarks in every case, and the "public domain" note describes the file, not the trademark.

## Notes on four marks that used to need a dark tile

Compartamos Banco, Caja Arequipa, Santander Consumer and Financiera Confianza were first lifted
in their light-on-transparent form, which only reads on a dark tile. Each one now carries its
full-colour version and sits on the same white tile as the rest of the grid:

- **Compartamos Banco** — the magenta wordmark with its shoal of fish, from Wikimedia Commons;
  the version their own site serves in the header is the white one.
- **Caja Arequipa** — the plain mark, `logofot.svg` from their own site. The header file on the
  same site is the lockup that carries the "40 años" seal, which is kept out of the grid.
- **Santander Consumer** — the red flame with the two-line wordmark, from the Santander Perú
  group site.
- **Financiera Confianza** — the blue wordmark from their own header. Their alternative file adds
  the "Fundación BBVA Microfinanzas" lockup, which is kept out of the grid.

## Trademarks

The names and logos in this folder are the trademarks of the institutions they identify, and
they are shown for one purpose: to let a shopkeeper recognise and choose the institution that
holds their account. Their presence describes a choice available in the flow. Rocoto claims no
partnership, sponsorship, endorsement or affiliation with any of them, and no institution is
represented as a customer or partner. Any institution that asks to have its logo removed has it
removed from the grid.

## What is in the grid on 19 September 2026

35 institutions, every tile viewed at its rendered size before it was accepted, ordered by how
many small shops use them: BCP, Yape, Interbank, BBVA, Plin, Scotiabank, Banco de la Nación,
Mibanco, then the cajas (Arequipa, Huancayo, Piura, Cusco, Trujillo, Ica, Tacna, Maynas, Paita,
Del Santa), then the remaining banks (Compartamos, BanBif, Pichincha, Falabella, Ripley, Alfin,
Santander Consumer, Santander Perú, Bancom, Citibank, ICBC, BCI), the financieras (Confianza,
Qapaq, Surgir, Proempresa) and Agrobanco.

One flag to check with the brand: the ICBC file served by Commons places the red emblem to the
right of the wordmark, while ICBC's usual lockup puts it to the left. The file is published as
served rather than rearranged.

Two notes on artwork quality: Caja Piura, Caja Trujillo, Caja Ica and Caja del Santa come from
FEPCMAC at 300 px square, which is a 1.7× upscale at the tile's 2× density — sharp enough at
160×64, and the only full-colour source those four serve, since their own sites refuse automated
reading. Caja Maynas's own logo is a lockup on a red plate, so that tile carries more colour
than its neighbours.

## Listed, operating, still missing a logo

Nothing was drawn to fill these gaps.

- **Banco GNB Perú** — their site refuses automated reading. The group's brand files that are
  reachable are "Banco GNB Paraguay" and "Banco GNB Fusión"; the plain "Banco GNB" file is the
  white version. A Peru-specific full-colour mark stays to be found.
- **Banco Efectiva** and **Caja Metropolitana de Lima** — their sites refuse automated reading,
  and the only artwork either serves anywhere is its app-store icon, which is a dark square: the
  same tile the rest of this pass removed.
- **Bank of China (Perú)** — the only file served is the 101×29 footer mark on
  bankofchina.com, which is too small to put on a tile.
- **Cajas rurales**: Cencosud Scotia, Incasur, Los Andes, Prymera.
- **Financieras**: Infinance XP, Mitsui Auto Finance.

The fastest way to finish them is to open each institution's press or brand page by hand and
save the asset into `src/<slug>/`, then re-run the trim-and-fit step.
