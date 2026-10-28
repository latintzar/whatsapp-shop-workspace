/* THE NAVIGATION'S MARKS — the seats of both worlds, drawn from the app's one vocabulary.
 *
 * The slim rail and the phone's bottom row are the SAME navigation in two housings, so they draw
 * the same marks. They used to be drawn HERE, which is how the app ended up with two conversation
 * marks and two document marks — one set for the navigation and one for the panel (FEED-IA §30:
 * «one icon, one meaning, everywhere — the same mark never varies by surface»).
 *
 * So this file no longer draws anything. It is the MAP from a seat to its mark, and the drawing
 * lives once, in `src/prototypes/cedar/glyphs.tsx`, on that file's grid.
 *
 * ═══ TWO MAPS NOW, BECAUSE THERE ARE TWO WORLDS (FEED-IA §53) ═══════════════════════════════
 * The desk's three areas and Administration's ten seats are the same KIND of thing — a mark and a
 * word in a rail — so they are mapped the same way, in one file, and the rail draws either without
 * knowing which world it is in.
 *
 * ONE SEAT IS NOT A GLYPH AT ALL, and that is the interesting one. THE-ADMIN-CANON §2.1 gives «Tu
 * agente» the RocotoMark, and the RocotoMark as `capability.tsx` draws it is SAFFRON — which the
 * accent law reserves for Rocoto's own ACTS. A navigation seat is not an act, so a saffron ring in
 * the rail would be the one place in the app where the accent means «a place» instead of «Rocoto
 * did this».
 *
 * The resolution keeps both laws: the agent's seat wears ROCOTO'S OWN FACE — the same
 * `public/brand/rocoto-mark.svg` the desk rail's head draws — masked in the seat's own ink like
 * every other mark in the rail. It is literally the canon's «RocotoMark», it re-themes, and no
 * accent enters the navigation. Inside the seat, the grant rows keep the saffron ring for the acts
 * that really are Rocoto's. The desk's head and this seat never stand in the same rail — the admin
 * world's head is the way back — so the mark still appears exactly once per screen.
 */
import * as React from 'react';
import { Wallet } from 'lucide-react';
import { Glyph, type GlyphId } from '../../cedar/glyphs';
import type { AdminSeatId, AreaId } from './area';

const SEAT: Record<AreaId, GlyphId> = {
  /* PREP WEARS THE CLIPBOARD (prep-design.md, `SEAT.prep`). `packing` is `ClipboardCheck` — the
     mark the Prep door already wore inside the export centre — and `hasGlyph` below narrows on
     this map, so a seat outside it would draw by its word alone. */
  prep: 'packing',
  /* ⚠ MONEY'S MARK IS OVERRIDDEN BELOW, and the id stays here so the map is still total. Cedar's
     `price` is `BadgeEuro`; see `NEUTRAL_SEAT`. */
  money: 'price',
  stock: 'crate',
  /* THE BOOK OF ACCOUNTS (FEED-IA §37.6). `who` already means «the door to the customer's own
     record» everywhere in this app — it is the mark on the albarán's own door to the profile — so
     the area that IS that record takes the same mark rather than a second one. One icon, one
     meaning, everywhere (§30). */
  customers: 'who',
};

/** THE ADMINISTRATION'S FOUR SEATS (DESIGN-SPEC.md §7 item 5). `agent` and `account` left the
 *  registry with the other five, so every seat here is a glyph and the map is total. */
const ADMIN_SEAT: Record<AdminSeatId, GlyphId> = {
  business: 'brand',
  connections: 'connect',
  'app-settings': 'sliders',
  data: 'data',
};

/** ── ONE SEAT DRAWS OUTSIDE THE VOCABULARY, AND IT SAYS SO HERE ──────────────────────────────
 *  Cedar's `price` mark is lucide's `BadgeEuro`, and a euro badge is the wrong currency over a
 *  Peruvian shop's soles — the navigation would name a currency the app never prints. So Money
 *  wears the WALLET, which is currency-neutral and is already this prototype's own object for the
 *  bank account (DESIGN-SPEC.md §5: «the wallet on `Your bank account`»). It is drawn at the
 *  family's own stroke and snap, so it sits in the rail at the same weight as its neighbours.
 *
 *  It is one entry in a map rather than a branch inside the component, so a reader counting the
 *  seats that leave the vocabulary counts the lines in this object. */
const NEUTRAL_SEAT: Partial<Record<AreaId, typeof Wallet>> = { money: Wallet };

/** True where this id has a mark. An area outside the four is drawn by its word alone. */
export const hasGlyph = (id: string): id is AreaId => id in SEAT;

export default function AreaGlyph({ id, size = 20 }: { id: AreaId; size?: number }) {
  const Own = NEUTRAL_SEAT[id];
  if (Own) {
    return (
      <span aria-hidden="true" style={{ display: 'inline-flex', flex: '0 0 auto', lineHeight: 0 }}>
        <Own size={size} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
      </span>
    );
  }
  return <Glyph id={SEAT[id]} size={size} />;
}

/** THE MARK ON AN ADMINISTRATION SEAT. All four are glyphs in this prototype — the `agent` seat
 *  whose mark was Rocoto's own face left the registry with the five other seats, and the masked
 *  Rocoto face it drew lives on in the rail's own head (`rail.tsx`'s `RocotoMark`). */
export function AdminSeatMark({ id, size = 20 }: { id: AdminSeatId; size?: number }) {
  return <Glyph id={ADMIN_SEAT[id]} size={size} />;
}
