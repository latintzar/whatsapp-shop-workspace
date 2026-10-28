/* THE PERU MAP — ten whole-name lines over the painted library, and the one name held out.
 *
 * The library is a Spanish wholesaler's set: 794 tiles keyed on trade-standard Spanish names. A
 * Lima bodega writes other correct words for the same goods — `palta` for the avocado, `gaseosa`
 * for the soft drink, `fideo tallarín` for the pasta — so a Peru line carries the local word to the
 * tile the library already holds. `cedar/painting-map.ts` stays untouched: this file wraps it.
 *
 * ═══ THE KEYS ARE WHOLE NAMES, AND THAT IS THE WHOLE POINT ═══════════════════════════════════
 * Cedar's own `PAINTING_ALIASES` rewrites a SUBSTRING inside the written name. Run that way, a
 * `papa`→`patata` line rewrites `papaya` to `patatya`, and the resolver then hands papaya a red
 * potato. It was verified by running it (`fixtures/cast-bodega.json` `faces.peruMapHazard`). So
 * every line here is matched on the folded name ENTIRE, the way `KIND_STANDS_FOR` is keyed: a key
 * either is the name or it is silent, and a neighbouring word is untouchable by construction.
 *
 * ═══ THE MEASURE ON THE END OF A NAME IS A PACK SIZE, NOT A SUBJECT ══════════════════════════
 * A shop writes `aceite vegetal 1 L`, `gaseosa 3 L`, `gaseosa personal 500 ml`, `balón de gas
 * 10 kg`. The litre is how much is in the bottle; the painting is of the bottle. So the trailing
 * measure comes off before the whole-name match, which is why the map holds BOTH `gaseosa` and
 * `gaseosa personal` — two subjects, one of them with its own pack word, each keyed whole.
 *
 * ═══ ONE NAME IS HELD OUT, BY NAME ═══════════════════════════════════════════════════════════
 * `papa blanca`. `patata` resolves to a named variety (`patata-kennebec`), and a picture of another
 * variety is the sentence the library's own review refused. The refusal is written here rather than
 * left to a miss, so a `papa` row arriving in the library later still leaves the drawn mark
 * standing until a `papa blanca` tile is painted.
 *
 * ═══ THE LADDER, IN ORDER ════════════════════════════════════════════════════════════════════
 *   1 · held out        → the family mark stands, with the reason in words
 *   2 · a Peru line     → the tile it names, carrying the line it resolved through
 *   3 · `paintingFor`   → the library's own answer for the name as written
 *   4 · nothing yet     → the family mark, and `product-face-request.ts` asks for a tile
 *
 * The ten lines and the one held-out name are DATA, read from `fixtures/cast-bodega.json`
 * (`faces.peruMapBindings`, `faces.toPaint`), so the world file stays the one place they are
 * written down. What lives here is the RULE: whole-name keying, the pack-size strip, the refusal,
 * and the order of the rungs.
 */
import { paintingFor } from '../cedar/painting-map';
import type { Family } from '../../rocoto/produce-icons';
import { faces, type BodegaProduct, type FaceHow } from './cast';

/** Accents off, lower case — Cedar's own `fold`, restated so this file owns its keying. */
export const fold = (value: string): string =>
  value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** THE PACK SIZE COMES OFF THE END. `1 L`, `500 ml`, `10 kg`, `×4` — how much is in the pack,
 *  which the painting of the pack already shows. Only a TRAILING measure is read, so a name whose
 *  subject carries a number keeps it. */
const MEASURE = /\s*(?:[x×]\s*\d+|\d+(?:[.,]\d+)?\s*(?:l|ml|cl|kg|g|gr|cc|und|u)\.?)\s*$/;

/** The name a whole-name key is matched against: folded, spaced once, pack size off. */
export const wholeName = (value: string): string =>
  fold(value).replace(/[·—–_]/g, ' ').replace(/\s+/g, ' ').trim().replace(MEASURE, '').trim();

/** THE TEN LINES, keyed whole. `faces.peruMapBindings` is the record; this is its index. */
export const PERU_LINES: ReadonlyMap<string, string> = new Map(
  faces.peruMapBindings.map(({ key, slug }) => [wholeName(key), slug]),
);

/** THE NAMES WITH A TILE STILL TO BE PAINTED, and the one among them that is a REFUSAL rather
 *  than a gap: `papa blanca` (`faces.peruMapHazard`). */
export const TO_PAINT: ReadonlySet<string> = new Set(faces.toPaint.map(wholeName));
export const HELD_OUT: ReadonlySet<string> = new Set([wholeName('papa blanca')]);

export const HELD_OUT_REASON =
  '`patata` resolves to a named variety, so the drawn mark stands until a papa blanca tile is painted.';

/* ── the resolution ───────────────────────────────────────────────────────────────────────── */

export type Painting = {
  /** the tile, where one resolved */
  src: string | null;
  how: FaceHow;
  /** the Peru line this name resolved through, where it took one */
  binding?: string;
};

/**
 * THE FACE A NAME RESOLVES TO — the one function every Products surface asks.
 *
 * A `src` is a tile in `app/public/paintings/`. A null `src` means the family mark draws, and `how`
 * says which of the two reasons it is: `held out` (refused, on the record) or `to paint` (a tile is
 * on its way, and `product-face-request.ts` asks for it).
 */
export function paintingForPeru(name: string): Painting {
  const whole = wholeName(name);
  if (HELD_OUT.has(whole)) return { src: null, how: 'held out' };
  const line = PERU_LINES.get(whole);
  if (line) return { src: `/paintings/${line}.webp`, how: 'peru-map', binding: whole };
  const own = paintingFor(name);
  if (own) return { src: own, how: 'direct' };
  return { src: null, how: 'to paint' };
}

/* ── THE FAMILY MARK (`rocoto/produce-icons`) ─────────────────────────────────────────────────
 * Eight families are drawn, and every one of a bodega's shelves lands in one of them. The walk is
 * specific → general and cannot end empty: a word nothing else claims is still goods, and goods
 * have a family — which is what keeps a seat from ever drawing a blank square.
 */
const FAMILY_WORDS: Array<[RegExp, Family]> = [
  [/pollo|pavo|gallina/, 'poultry'],
  [/pescado|atun|jurel|bonito|conserva de pescado/, 'fish'],
  [/leche|queso|yogur|yogurt|mantequilla|huevo/, 'dairy'],
  [/palta|limon|platano|papaya|mango|naranja|manzana|fruta/, 'fruit'],
  [/papa|cebolla|tomate|zanahoria|choclo|verdura|zapallo/, 'vegetable'],
  [/carne|res|cerdo|chuleta|lomo/, 'meat'],
];

const SHELF_FAMILY: Record<string, Family> = {
  Produce: 'fruit',
  Fresh: 'dairy',
  Abarrotes: 'dry',
  Drinks: 'dry',
  Home: 'dry',
};

/** The family whose mark stands for these goods while a tile is on its way. */
export function familyOf(name: string, shelf?: string): Family {
  const whole = wholeName(name);
  for (const [words, family] of FAMILY_WORDS) if (words.test(whole)) return family;
  return (shelf ? SHELF_FAMILY[shelf] : undefined) ?? 'dry';
}

/** The words a person reads for where a face came from, one line per rung. */
export const HOW_WORDS: Record<FaceHow, string> = {
  direct: 'Painted in the library as it stands',
  'peru-map': 'A Peru line carries the local word to its tile',
  'held out': 'The drawn mark stands, by review',
  'to paint': 'The family mark stands while its tile is painted',
};

/* ── the tally, counted live ──────────────────────────────────────────────────────────────── */

export type FaceTally = { direct: number; peruMap: number; heldOut: number; toPaint: number };

/**
 * THE TALLY THE SCREEN PRINTS, run over the names it is drawing.
 *
 * It is counted rather than read out of the world file on purpose: `faces.tally` records what the
 * resolver answered on 18 September, and a number a screen counts for itself is the one that can
 * disagree with it out loud. 13 · 10 · 1 · 6 over the thirty names is the recorded reading.
 */
export function tallyOver(names: readonly string[]): FaceTally {
  const out: FaceTally = { direct: 0, peruMap: 0, heldOut: 0, toPaint: 0 };
  for (const name of names) {
    const { how } = paintingForPeru(name);
    if (how === 'direct') out.direct += 1;
    else if (how === 'peru-map') out.peruMap += 1;
    else if (how === 'held out') out.heldOut += 1;
    else out.toPaint += 1;
  }
  return out;
}

/* ── the catalogue, resolved ──────────────────────────────────────────────────────────────── */

/** A product's own address, off its name — `#/stock/palta`, `#/stock/gaseosa-3-l`. */
export const slugOf = (name: string): string =>
  fold(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export type Faced = BodegaProduct & {
  id: string;
  /** what this row resolves to NOW, through the ladder above */
  resolved: Painting;
  family: Family;
};

/** The catalogue with every face resolved once, in the order the world file holds it. */
export const faceCatalogue = (products: readonly BodegaProduct[]): Faced[] =>
  products.map((product) => ({
    ...product,
    id: slugOf(product.name),
    resolved: paintingForPeru(product.name),
    family: familyOf(product.name, product.shelf),
  }));
