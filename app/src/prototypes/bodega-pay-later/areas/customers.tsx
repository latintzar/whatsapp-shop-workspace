/* CUSTOMERS — THE BOOK AND THE SHEET (DESIGN-SPEC.md §3 · §7 item 13).
 *
 * Cedar's book: one column, filter-as-you-type, letter heads that park under the pane's own head,
 * and a row that is the door to the sheet. «Three homes, one grammar» — Prep, Products and
 * Customers all search the same way, so a person who has found a product can find a neighbour.
 *
 * ═══ THE NAMES ARE THE SHOP'S OWN ════════════════════════════════════════════════════════════
 * `Rosa menú`, `Elmer taxi`, `Julia 2do piso`. A bodeguera's phone holds PEOPLE rather than
 * accounts, so half-labels stand exactly as the read returns them, and the book letters and sorts
 * them in Spanish collation because `Ñ` has a place of its own in it.
 *
 * ═══ WHAT A CUSTOMER OWES IS `fiado` ═════════════════════════════════════════════════════════
 * Never «credit». The row reads the name, `3 fiados`, the amount and `Since 2 Sep`, and a document
 * number leaves every string she reads. `customer-profile.tsx` draws the block inside the sheet, and
 * Money's `Who owes you` rows open it at `#/customers/<id>`.
 *
 * ═══ AND THE TARIFA LEFT WITH THE TIER REGISTRY ══════════════════════════════════════════════
 * One shop sells at one price, so the copied sheet drops `TheirTarifa` and `tiers.ts` entirely
 * (`WIRING-SPEC.md` §11). What survives is the book, the sheet and the fiado.
 *
 * ROUTES  `#/customers` the book · `#/customers/<id>` one person's sheet.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { Input } from 'baseui/input';
import { ArrowLeft, Search } from 'lucide-react';
import Page from '../../cedar/shell/page';
import { Figure } from '../../cedar/figure';
/* ONE COLUMN OF WORK, SAID OUT LOUD — the same declaration `areas/stock.tsx` makes, and for the
   same measured reason: the book pushes the sheet over itself rather than standing two panes, so
   the frame gives it the reading column with its own gutters at the desk. */
import { usePanes } from '../shell/frame';
import { LIST_FLOOR, SHEET_SNUG, usePhone, useStacked } from '../../cedar/shell/viewport';
import { customers } from '../cast';
import { SOURCE_WORD, useChatSource } from '../source';
/* THE COVER, ON THIS AREA'S FIRST OPEN — «the one line an area writes» (`covers.tsx`). */
import { AreaCover } from '../covers';
import {
  CustomerSheet, dayWords, fiadoWords, settlesWords, useFiado,
} from '../customer-profile';
/* ONE FIADO BOOK (QA 7): the book `money-store.ts` owns, read here rather than re-derived off the
   fixture — so what a row says a neighbour owes is what Money says, to the soles. */
import type { FiadoBookRow } from '../money-store';
import type { BodegaCustomer } from '../cast';

export const meta = { id: 'customers', title: 'Customers', owner: 'BODEGA-CUSTOMERS', panes: true };

/* ── the book's own order ─────────────────────────────────────────────────────────────────── */

/** Spanish collation, because these are Peruvian names and `Ñ` sits between `N` and `O`. */
const byName = (a: BodegaCustomer, b: BodegaCustomer) => a.name.localeCompare(b.name, 'es');

/** The letter a name files under, accents folded so `Á` files with `A`. */
const letterOf = (name: string): string =>
  name.trim().charAt(0).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '') || '#';

/* ── the row ──────────────────────────────────────────────────────────────────────────────── */

function CustomerRow({ of, fiado, onOpen }: { of: BodegaCustomer; fiado: FiadoBookRow | null; onOpen: () => void }) {
  const [, theme] = useStyletron();
  const [over, setOver] = React.useState(false);
  return (
    <button
      type="button"
      data-customer-row={of.id}
      data-testid={`customer-${of.id}`}
      onClick={onOpen}
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.sizing.scale500,
        width: '100%',
        boxSizing: 'border-box',
        minHeight: '64px',
        padding: `${theme.sizing.scale400} ${theme.sizing.scale500}`,
        border: `1px solid ${over ? theme.colors.borderOpaque : 'transparent'}`,
        borderRadius: theme.borders.radius300,
        background: over ? theme.colors.backgroundPrimary : 'transparent',
        color: theme.colors.contentPrimary,
        textAlign: 'left',
        cursor: 'default',
        fontFamily: 'inherit',
        minWidth: 0,
      }}
    >
      <Initial of={of} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale100, flex: 1, minWidth: 0 }}>
        <span
          data-customer={of.name}
          style={{
            ...theme.typography.LabelMedium,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {of.name}
        </span>
        <span
          style={{
            ...theme.typography.ParagraphXSmall,
            color: theme.colors.contentTertiary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fiado
            ? `${fiadoWords(fiado.sales)} · Since ${dayWords(fiado.since)}`
            : `${settlesWords(of)} · ${of.block}`}
        </span>
      </span>
      {fiado && (
        <span style={{ whiteSpace: 'nowrap', flex: '0 0 auto' }}>
          <Figure value={fiado.amountMinor / 100} unit="S/" size="compact" />
        </span>
      )}
    </button>
  );
}

/** THE FACE OF A PERSON IS THEIR OWN INITIAL. The painted library holds goods; a neighbour is drawn
 *  with the letter her name is filed under, on the same seat a product's face takes, so the two
 *  books share one left edge. */
function Initial({ of }: { of: BodegaCustomer }) {
  const [, theme] = useStyletron();
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '36px',
        height: '36px',
        flex: '0 0 auto',
        borderRadius: theme.borders.radius200,
        background: theme.colors.backgroundSecondary,
        ...theme.typography.LabelMedium,
        color: theme.colors.contentSecondary,
      }}
    >
      {letterOf(of.name)}
    </span>
  );
}

/* ── THE SECTION HEAD ─────────────────────────────────────────────────────────────────────────
 * Cedar's letter head, at this book's own scale. Cedar letters 296 accounts because a letter is how
 * you find one row in three hundred; eighteen neighbours lettered came out as fourteen headings
 * over one row each — looked at, at 393 — which is a table of contents longer than the book.
 *
 * So the alphabet stays the ORDER, in Spanish collation, and the heads name the two groups a
 * bodeguera actually reads for: who owes her today, and everybody else. Same sticky head, same
 * count on the right, same rule under it.
 */
function SectionHead({ letter, held }: { letter: string; held: number }) {
  const [, theme] = useStyletron();
  return (
    <div
      data-section={letter}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: theme.sizing.scale400,
        paddingTop: theme.sizing.scale600,
        paddingBottom: theme.sizing.scale300,
        borderBottom: `1px solid ${theme.colors.contentPrimary}`,
        /* THE HEAD IS THE PAGE'S OWN GROUND, so only the rule under it reads. Painted on the
           secondary step it came out as a filled grey band across the column once the frame moved
           the page onto paper — looked at, at 393 and 1280. It still has to be OPAQUE, because a
           sticky head with rows sliding under it is the one place transparency destroys. */
        background: theme.colors.backgroundPrimary,
        minWidth: 0,
      }}
    >
      <h2 style={{ margin: 0, ...theme.typography.HeadingXSmall }}>{letter}</h2>
      <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentTertiary }}>
        {held} {held === 1 ? 'customer' : 'customers'}
      </span>
    </div>
  );
}

/* ── the tail this area reads ─────────────────────────────────────────────────────────────── */

/** `#/customers/<id>` is this area saying something about one of its own rows, and a second tail —
 *  `#/customers/<id>/fiado` — is Money asking for the block inside it. */
function useCustomerTail(): { id: string | null; block: string | null } {
  const read = () => {
    const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    return parts[0] === 'customers'
      ? { id: parts[1] ? decodeURIComponent(parts[1]) : null, block: parts[2] ?? null }
      : { id: null, block: null };
  };
  const [tail, setTail] = React.useState(read);
  React.useEffect(() => {
    const on = () => setTail(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return tail;
}

/* ── the area ─────────────────────────────────────────────────────────────────────────────── */

/** HOW TALL THE PANES ARE — the room left under the chrome, measured rather than assumed, the
 *  same reading `areas/prep.tsx` and `areas/stock.tsx` take for their own two panes. */
function useBoxHeight(ref: React.RefObject<HTMLElement | null>): number | null {
  const [height, setHeight] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    const read = () => {
      const top = ref.current?.getBoundingClientRect().top;
      if (top === undefined) return;
      setHeight(Math.max(0, Math.round(window.innerHeight - top)));
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [ref]);
  return height;
}

export default function Customers() {
  const [, theme] = useStyletron();
  const phone = usePhone();
  const stacked = useStacked();
  /* ── THE DESK IS BOOK PLUS SHEET (QA 46) ──────────────────────────────────────────────────
     The book declared `panes: true` and then stood them down, so opening a neighbour REPLACED
     the eighteen names with a 776px sheet in the middle of an empty desk. It declares what it
     draws now: two panes at the desk, the push model on a phone and at the stacked rung. */
  usePanes(!phone);
  const box = React.useRef<HTMLDivElement | null>(null);
  const boxHeight = useBoxHeight(box);
  const source = useChatSource();
  const tail = useCustomerTail();
  const [query, setQuery] = React.useState('');

  const book = React.useMemo(() => [...customers].sort(byName), []);
  /* THE ONE BOOK, READ ONCE FOR THE WHOLE LIST (QA 7). */
  const fiado = useFiado();
  const fiadoOf = React.useCallback(
    (id: string) => fiado.find((row) => row.customerId === id) ?? null,
    [fiado],
  );
  const inTheBook = fiado.filter((row) => row.standing === 'confirmed').length;

  const words = query.trim().toLowerCase();
  const shown = React.useMemo(
    () => (words
      ? book.filter((c) => `${c.name} ${c.block} ${c.address} ${c.phone}`.toLowerCase().includes(words))
      : book),
    [book, words],
  );

  /* ── THE GROUPS CARRY THE STANDING (QA 7) ────────────────────────────────────────────────
     «Owing today · 6 customers» over exact amounts was the book stating as settled fact what the
     read had only proposed. The word for whose answer a row is now belongs to the heading, where
     it costs a row no width and a stranger can read it: what the shop wrote down, what the chats
     suggest, and everybody else. */
  const groups = React.useMemo(() => {
    const standing = (person: BodegaCustomer) => fiadoOf(person.id)?.standing ?? null;
    return [
      { letter: 'In your fiado book', rows: shown.filter((p) => standing(p) === 'confirmed') },
      { letter: 'Likely to owe you', rows: shown.filter((p) => standing(p) === 'likely') },
      { letter: 'The rest of the book', rows: shown.filter((p) => standing(p) === null) },
    ].filter((group) => group.rows.length > 0);
  }, [shown, fiadoOf]);

  /* MONEY'S ROW OPENS THE BLOCK, not just the sheet. A tail naming a block scrolls to it once the
     sheet has drawn, which is what «also linked inside their customer sheets» asks for. */
  const open = tail.id ? book.find((c) => c.id === tail.id) : undefined;
  React.useEffect(() => {
    if (!open || !tail.block) return;
    const at = document.getElementById(tail.block);
    if (at) at.scrollIntoView({ block: 'start' });
  }, [open, tail.block]);

  /** the desk stands both panes; the phone and the stacked rung push one over the other */
  const panes = !phone && !stacked;

  const sheet = open ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale600, minWidth: 0 }}>
      {/* THE WAY BACK BELONGS TO THE PUSH MODEL. Beside the book on a desk the names are already
          on screen, so a «Customers» button would be a control that changes nothing. */}
      {!panes && (
        <div style={{ alignSelf: 'flex-start' }}>
          <Button
            kind={KIND.tertiary}
            size={SIZE.compact}
            startEnhancer={() => <ArrowLeft size={18} aria-hidden />}
            onClick={() => { window.location.hash = '#/customers'; }}
          >
            Customers
          </Button>
        </div>
      )}
      <CustomerSheet of={open} />
    </div>
  ) : null;

  const list = (
      <section
        data-testid="area-customers"
        style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale600, minWidth: 0 }}
      >
        <header style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale300 }}>
          <h1 style={{ margin: 0, ...theme.typography.HeadingMedium }}>The people who buy from you</h1>
          <p style={{ margin: 0, maxWidth: '60ch', ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary }}>
            See who comes back, what they buy and what they owe.
          </p>
          <p style={{ margin: 0, ...theme.typography.ParagraphSmall, color: theme.colors.contentTertiary }}>
            {book.length} customers · {inTheBook} in the fiado book ·{' '}
            {source ? SOURCE_WORD[source.kind] : 'Reading'}
          </p>
        </header>

        <Input
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search customers"
          aria-label="Search customers"
          clearable
          startEnhancer={() => <Search size={18} aria-hidden />}
          overrides={{
            Root: { style: { minHeight: '48px', backgroundColor: theme.colors.backgroundPrimary } },
            Input: { style: { backgroundColor: theme.colors.backgroundPrimary } },
            StartEnhancer: { style: { backgroundColor: theme.colors.backgroundPrimary } },
          }}
        />

        {groups.map(({ letter, rows }) => (
          <div key={letter} style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale100 }}>
            <SectionHead letter={letter} held={rows.length} />
            {rows.map((person) => (
              <CustomerRow
                key={person.id}
                of={person}
                fiado={fiadoOf(person.id)}
                onOpen={() => { window.location.hash = `#/customers/${person.id}`; }}
              />
            ))}
          </div>
        ))}

        {groups.length === 0 && (
          <p style={{ margin: 0, ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary }}>
            Try another word — the book holds {book.length} customers.
          </p>
        )}
      </section>
  );

  /* ── THE PUSH MODEL: one screen, one scroll ───────────────────────────────────────────── */
  if (!panes) {
    return (
      <Page title={meta.title}>
        <AreaCover area="customers" />
        {sheet ?? list}
      </Page>
    );
  }

  /* ── THE DESK: THE BOOK LEFT, THE PERSON RIGHT (§38 · QA 46) ─────────────────────────────
     Cedar's own book grammar, which this file was copied from and then stood down: the page
     itself does not scroll, each pane is one scrollport, and the SHEET is what yields when the
     room runs short. Every row is still the same button, so the whole book stays keyboard
     reachable and a press moves the right-hand pane rather than taking the list away. */
  return (
    <Page title={meta.title} fill>
      <AreaCover area="customers" />
      <div
        ref={box}
        data-testid="customers-panes"
        data-open={open ? 'yes' : 'no'}
        style={{
          display: 'grid',
          gridTemplateColumns: open
            ? `minmax(${LIST_FLOOR}px, 1fr) minmax(0, ${SHEET_SNUG}px)`
            : 'minmax(0, 1fr)',
          height: boxHeight === null ? '100%' : `${boxHeight}px`,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <div
          data-testid="customers-list-pane"
          style={{
            minWidth: 0,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'clip',
            padding: `${theme.sizing.scale700} ${theme.sizing.scale700} ${theme.sizing.scale900}`,
            boxSizing: 'border-box',
          }}
        >
          {list}
        </div>
        {open && (
          <div
            data-testid="customers-sheet-pane"
            style={{
              minWidth: 0,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'clip',
              padding: `${theme.sizing.scale700} ${theme.sizing.scale700} ${theme.sizing.scale900}`,
              boxSizing: 'border-box',
              borderLeft: `1px solid ${theme.colors.mono400}`,
              background: theme.colors.backgroundSecondary,
            }}
          >
            {sheet}
          </div>
        )}
      </div>
    </Page>
  );
}
