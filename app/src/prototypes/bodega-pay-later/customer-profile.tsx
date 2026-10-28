/* THE CUSTOMER SHEET — Cedar's, less the tarifa beat (DESIGN-SPEC.md §3 · §7 item 13).
 *
 * Cedar's `customer-profile.tsx` is the anatomy: a head that names WHO and never scrolls away from
 * the facts about them, then blocks — the record first, the arithmetic off it second, what Rocoto
 * has noticed last. Every block's heading passes the stranger test, every row is a sentence, and
 * Rocoto's own readings carry the saffron mark while the house's own record stays ink.
 *
 * ═══ WHAT THE COPY DROPS, AND WHY ════════════════════════════════════════════════════════════
 * `TheirTarifa` and `tiers.ts`. ONE SHOP SELLS AT ONE PRICE — a bodeguera has one shelf and one
 * price on it — so the band chips, the tier registry door and `setCustomerTier` behind them have no
 * subject here. `WIRING-SPEC.md` §11 states the same drop for the Prep area's `useTiers` and for
 * Administration's price rows, and this file is that decision on this surface.
 *
 * ═══ AND WHAT A CUSTOMER OWES IS `fiado` ═════════════════════════════════════════════════════
 * Never «credit». A neighbour who takes her rice today and pays on Friday is buying **al fiado**,
 * which is a word a Lima shop says out loud, and «credit» is a word a lender says. So the block
 * reads the name, `3 fiados`, the amount and `Since 2 Sep`, and a document number leaves every
 * string she reads. `CustomerFiado` is that block, and Money's rows open the sheet at it.
 *
 * ═══ WHAT IS SEEDED HERE ═════════════════════════════════════════════════════════════════════
 * Eighteen customers from `fixtures/cast-bodega.json`, their fiado book, and the likely list the
 * read produced — replaced per account by a live read's own names and threads. What they usually
 * buy is derived from the customer's own id, so the same sheet returns on every reload
 * (`rules.derived`).
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { ChevronRight, Phone } from 'lucide-react';
import { Figure } from '../cedar/figure';
import { ProductFace } from './areas/stock';
import { faceCatalogue, type Faced } from './painting-peru';
import {
  likelyOwed, products, type BodegaCustomer,
} from './cast';
/* ── ONE FIADO BOOK, READ RATHER THAN RE-DERIVED (QA 7) ───────────────────────────────────────
 * The book used to have two sources: Money read the mutable store while Customers, the Data seat
 * and the export read the fixture — so `#/money` said nobody owed anything two taps from a screen
 * saying six people did. `money-store.ts` owns the one book now (the seed underneath, the shop's
 * own answers over it, each row carrying the word for whose answer it is); every surface calls its
 * readers. This file calls `useFiadoBook` and `FIADO_STANDING_WORD` and derives nothing. */
import { FIADO_STANDING_WORD, MONEY_SCOPE, useFiadoBook, type FiadoBookRow } from './money-store';
/* THE ORDERS A CUSTOMER HAS TODAY ARE THE ONES PREP IS SHOWING (QA 24), built by the same fold, so
   the row's count, its state word and the address it opens are the ones on the Prep list. */
import { BODEGA_CAST, PREP_STATE_OF, bodegaSales } from './cast-cedar';
import { cedarTodayId } from '../cedar/scenario-clock';
import { useDay } from '../cedar/day';

/* ── the facts a sheet needs, read once ───────────────────────────────────────────────────── */

export type Fiado = FiadoBookRow;

/** THE WHOLE BOOK, LIVE — one read for a surface that draws many rows. */
export const useFiado = (): FiadoBookRow[] => useFiadoBook(MONEY_SCOPE);

/** ONE PERSON'S ROW, off the same book. `null` where the book holds nothing for them. */
export function useFiadoOf(id: string): FiadoBookRow | null {
  const book = useFiado();
  return book.find((row) => row.customerId === id) ?? null;
}

/** The word that says whose answer a row is — the shop's, or the read's. */
export const fiadoStandingWord = (row: FiadoBookRow): string => FIADO_STANDING_WORD[row.standing];

/** WHAT THE CHATS SUGGESTED, with its reason in words — Rocoto's own reading, so it carries the
 *  mark (`WHATSAPP-HISTORY-SPEC.md` §5, `DESIGN-SPEC.md` §2). */
export const likelyOf = (id: string) => likelyOwed.find((row) => row.customer === id) ?? null;

/** ── TODAY'S ORDERS, OFF THE DAY PREP IS SHOWING (QA 24) ────────────────────────────────────
 *  The sheet used to read `prepDay.orders` — the fixture's own list — and Prep builds its day from
 *  `bodegaSales`. The two disagreed three ways: the link went to `#/prep/1` where sale routes are
 *  keyed by the customer (`#/prep/maribel`), so the only door from a customer to her order fell
 *  through to the list; the row said «9 lines» where Prep's row for the same 07:05 sale said 3;
 *  and the fixture's 07:20 order belonged to a different neighbour than the one Prep drew there.
 *  One fold, one answer: the sheet reads the same sales Prep reads, so the count, the state word
 *  and the address are the ones on the screen it opens. */
export function useOrdersOf(id: string) {
  const edits = useDay(BODEGA_CAST.sector);
  return React.useMemo(() => {
    const today = cedarTodayId();
    return bodegaSales(edits)
      .filter((sale) => sale.day === today && sale.customer.id === id && !sale.archived)
      .map((sale) => ({
        id: sale.id,
        received: sale.at,
        lines: sale.lines.length,
        state: PREP_STATE_OF[sale.state],
      }));
  }, [edits, id]);
}

/** `2026-09-02` → `2 Sep`, which is the shape §6 pins for the fiado row. */
export function dayWords(iso: string): string {
  const at = new Date(`${iso}T12:00:00-05:00`);
  return `${at.getDate()} ${at.toLocaleString('en-PE', { month: 'short', timeZone: 'America/Lima' })}`;
}

/** `3 fiados`, `1 fiado` — the count of open fiados, in the word a Lima shop uses. */
export const fiadoWords = (sales: number): string => `${sales} ${sales === 1 ? 'fiado' : 'fiados'}`;

/** How they settle, as the one word the row prints. */
export const settlesWords = (customer: BodegaCustomer): string =>
  customer.settles === 'fiado' ? 'Pays on fiado' : 'Pays cash';

/* ── WHAT THEY USUALLY BUY, DERIVED ───────────────────────────────────────────────────────────
 * The world file states who buys and how often, and states a line of an order nowhere. So the
 * leaderboard is a pure function of the customer's own id over the catalogue the read built —
 * `rules.derived`, so the same four rows return on every reload — and the sheet says it is seeded.
 */
const CATALOGUE: Faced[] = faceCatalogue(products);

const spin = (id: string): number => {
  let out = 7;
  for (let i = 0; i < id.length; i += 1) out = (out * 131 + id.charCodeAt(i)) % 99991;
  return out;
};

export type Usual = { product: Faced; times: number };

export function usualOf(customer: BodegaCustomer, seats = 4): Usual[] {
  const n = spin(customer.id);
  const out: Usual[] = [];
  for (let i = 0; i < seats; i += 1) {
    const at = (n + i * 977) % CATALOGUE.length;
    out.push({ product: CATALOGUE[at], times: Math.max(customer.perWeek * 4 - i * 3, 2) });
  }
  return out;
}

/* ── the saffron mark ─────────────────────────────────────────────────────────────────────── */

/** ROCOTO'S OWN ACT, MARKED. Saffron means exactly one thing in this app, and a reading off the
 *  shop's chats is one: the shop counted nothing here, Rocoto did. */
export function NoticedMark() {
  const [, theme] = useStyletron();
  return (
    <svg
      data-testid="noticed-mark"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke={theme.colors.accent}
      strokeWidth="1.6"
      role="img"
      aria-label="Rocoto read this"
      style={{ flex: '0 0 auto', marginTop: '4px' }}
    >
      <circle cx="5" cy="5" r="3.2" />
    </svg>
  );
}

/* ── the blocks ───────────────────────────────────────────────────────────────────────────── */

export function Block({
  title,
  id,
  actions,
  children,
}: {
  title: string;
  id?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [, theme] = useStyletron();
  return (
    <section
      id={id}
      data-block={id ?? title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.sizing.scale500,
        padding: theme.sizing.scale600,
        background: theme.colors.backgroundPrimary,
        borderRadius: theme.borders.radius300,
        border: `1px solid ${theme.colors.borderOpaque}`,
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      {/* THE HEADING TAKES THE LINE IT NEEDS. At 393 a heading and an act sharing one row squeezed
          both into two lines each — looked at — so the act wraps under the heading instead of
          fighting it for the column. */}
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: theme.sizing.scale400,
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ margin: 0, ...theme.typography.HeadingXSmall, flex: '1 1 auto' }}>{title}</h2>
        {actions}
      </header>
      {children}
    </section>
  );
}

/**
 * THE FIADO BLOCK — what a customer owes, inside their own sheet.
 *
 * Peter: «also linked inside their customer sheets». Money's `Who owes you` rows open
 * `#/customers/<id>`, and this is the block they open onto — the same amount, the same count, the
 * same date, drawn once. The reminder itself belongs to Money, so the block's own door goes there.
 */
export function CustomerFiado({ of }: { of: BodegaCustomer }) {
  const [, theme] = useStyletron();
  const fiado = useFiadoOf(of.id);
  return (
    <Block title="What they owe you" id="fiado">
      {fiado ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale300 }}>
          <Figure value={fiado.amountMinor / 100} unit="S/" size="large" />
          <span style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}>
            {fiadoWords(fiado.sales)} · Since {dayWords(fiado.since)}
          </span>
          {/* WHOSE ANSWER THIS IS (QA 7). One book, and each row says whether the shop wrote the
              figure down or the read proposed it — the same word Money prints on the same row. */}
          <span data-fiado-standing={fiado.standing} style={{ ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary }}>
            {fiadoStandingWord(fiado)}
          </span>
        </div>
      ) : (
        <p style={{ margin: 0, ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary }}>
          {of.settles === 'fiado'
            ? 'Their fiados are settled up to today.'
            : 'They pay cash at the counter.'}
        </p>
      )}
      {/* THE REMINDER BELONGS TO MONEY, so the block's own door goes there rather than growing a
          second `Chase now` on this surface. One act, at the foot of the block it is about. */}
      <div style={{ alignSelf: 'flex-start' }}>
        <Button
          kind={KIND.secondary}
          size={SIZE.compact}
          endEnhancer={() => <ChevronRight size={16} aria-hidden />}
          onClick={() => { window.location.hash = '#/money/owed'; }}
        >
          Open Money
        </Button>
      </div>
    </Block>
  );
}

/* ── the sheet ────────────────────────────────────────────────────────────────────────────── */

export function CustomerSheet({ of }: { of: BodegaCustomer }) {
  const [, theme] = useStyletron();
  const usual = usualOf(of);
  const today = useOrdersOf(of.id);
  const likely = likelyOf(of.id);

  return (
    <article
      data-testid="customer-sheet"
      data-customer={of.id}
      style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale600, minWidth: 0 }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale200, minWidth: 0 }}>
        <h1 style={{ margin: 0, ...theme.typography.HeadingMedium }}>{of.name}</h1>
        <span style={{ ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary }}>
          {settlesWords(of)} · {of.perWeek} a week
        </span>
        {/* THE BLOCK IS INSIDE THE ADDRESS ALREADY for most of this book — «Av. Próceres de la
            Independencia 2140 · Av. Próceres de la Independencia» said one street twice — so the
            block is printed only where the address leaves it out. */}
        <span style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentTertiary }}>
          {of.address.startsWith(of.block) ? of.address : `${of.address} · ${of.block}`}
        </span>
        <div style={{ alignSelf: 'flex-start', paddingTop: theme.sizing.scale300 }}>
          <Button
            kind={KIND.secondary}
            size={SIZE.compact}
            startEnhancer={() => <Phone size={16} aria-hidden />}
            $as="a"
            href={`tel:${of.phone.replace(/\s/g, '')}`}
          >
            {of.phone}
          </Button>
        </div>
      </header>

      <CustomerFiado of={of} />

      <Block title="What they buy">
        {/* THE LINE IS THE SHOP'S OWN (QA 23). «Seeded from the read, over the last four weeks»
            says «seeded», which is the rig's word for how a fixture was built. What the shop
            needs to know is where the four rows came from and what window they cover. */}
        <p style={{ margin: 0, ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary }}>
          From your chats, over the last four weeks
        </p>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: theme.sizing.scale300 }}>
          {usual.map(({ product, times }, rank) => (
            <li
              key={product.id}
              data-usual={product.id}
              style={{ display: 'flex', alignItems: 'center', gap: theme.sizing.scale400, minWidth: 0 }}
            >
              <span style={{ ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary, width: '16px' }}>
                {rank + 1}
              </span>
              <ProductFace of={product} size={32} />
              <a
                href={`#/stock/${product.id}`}
                style={{
                  ...theme.typography.LabelMedium,
                  color: theme.colors.contentPrimary,
                  textDecoration: 'none',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {product.name}
              </a>
              <span style={{ ...theme.typography.LabelSmall, color: theme.colors.contentSecondary, whiteSpace: 'nowrap' }}>
                {times}×
              </span>
            </li>
          ))}
        </ol>
      </Block>

      {/* «Their orders» → «Orders» (QA 53): the sheet is already this person's, so the possessive
          spends a word saying what the H1 above it has said. */}
      <Block title="Orders">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale300 }}>
          <Row label="Today" value={today.length > 0 ? `${today.length} ${today.length === 1 ? 'sale' : 'sales'}` : 'At the counter'} />
          {/* «A week» is not a phrase (QA 45). The row is what they buy in the week it is. */}
          <Row label="This week" value={`${of.perWeek} ${of.perWeek === 1 ? 'sale' : 'sales'}`} />
          <Row label="Messages read" value={`${of.messages} messages`} />
          {today.map((order) => (
            <a
              key={order.id}
              /* THE DOOR OPENS THE ORDER (QA 24) — the same address the Prep list writes. */
              href={`#/prep/${order.id}`}
              data-order={order.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: theme.sizing.scale400,
                minHeight: '44px',
                padding: `${theme.sizing.scale300} ${theme.sizing.scale400}`,
                borderRadius: theme.borders.radius200,
                background: theme.colors.backgroundSecondary,
                color: theme.colors.contentPrimary,
                textDecoration: 'none',
              }}
            >
              <span style={theme.typography.LabelMedium}>{order.received} · {order.lines} lines</span>
              <span style={{ ...theme.typography.LabelSmall, color: theme.colors.contentSecondary }}>{order.state}</span>
            </a>
          ))}
        </div>
      </Block>

      {likely && (
        /* ── THE CARD NAMES THE THING, AND THE ACT IT NAMES EXISTS (QA 45) ──────────────────
           «Rocoto has noticed» is an observation rather than a label — cover the card and a
           stranger cannot say what is under it — and its foot named an act the screen could not
           perform: «it stands until you confirm it», with nothing to confirm it with. VOICE rule
           12 wants the correction one tap away, so the act is on the card and it is the same act,
           in the same words, that Money's own row carries. */
        <Block title="What the chats suggest">
          <div style={{ display: 'flex', gap: theme.sizing.scale300, alignItems: 'flex-start' }}>
            <NoticedMark />
            <p style={{ margin: 0, ...theme.typography.ParagraphMedium, color: theme.colors.contentPrimary }}>
              {likely.reason}
            </p>
          </div>
          <p style={{ margin: 0, ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary }}>
            Read from your chats
          </p>
          <div style={{ alignSelf: 'flex-start' }}>
            <Button
              kind={KIND.secondary}
              size={SIZE.compact}
              data-testid="customer-put-in-book"
              endEnhancer={() => <ChevronRight size={16} aria-hidden />}
              onClick={() => { window.location.hash = '#/money/owed'; }}
            >
              Put it in the book
            </Button>
          </div>
        </Block>
      )}
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const [, theme] = useStyletron();
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.sizing.scale400 }}>
      <span style={{ ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary }}>{label}</span>
      <span style={{ ...theme.typography.LabelMedium }}>{value}</span>
    </div>
  );
}
