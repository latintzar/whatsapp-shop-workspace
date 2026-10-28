/* PREP — THE HOME. One list of the day's orders (DESIGN-SPEC.md §3 · prep-design.md).
 *
 * Peter, FEED-IA §268: «sales shouldn't really be there. Sales should actually be turned into prep…
 * It's like a merging of both instead of some long list for sales.»
 *
 * SO THERE IS ONE LIST AND IT IS BOUNDED TO ONE DAY. A left-right toggler says which day; a
 * full-width 48 px control says which order — `Location`, the default and the marked one, or `Time`;
 * and under them the day's orders stand in groups, `To review` first, the blocks with their counts,
 * `To assign` last. The right pane holds the delivery note with the conversation under it. One
 * persistent `Print`, above the bottom row on a phone and sticky at the foot of the list on a desk.
 *
 * ═══ WHAT THIS SURFACE IS MADE OF, AND WHERE EACH PIECE COMES FROM ═══════════════════════════
 *   the row          `RiverRow`, lifted out of Cedar's `areas/sales.tsx` — «a row a person reads in
 *                    the book and a row they read in the river are one drawing seen twice» (§42.2).
 *                    The search seat's letter-marking is the one thing the lift drops: Find is the
 *                    frame's, and the row carries no query.
 *   the state word   the shop's own three — `Asked for`, `Prepared`, `Handed over` — which is
 *                    Cedar's eight states folded at `PREP_STATE_OF` (`cast-cedar.ts`), with
 *                    `prepWordOf`'s two prep facets over that. NO TICK IS ADDED — §26.1 parked the
 *                    ceremony, `prepareSale` has no call sites, and `sale.prep` is written by the
 *                    seeder alone, which is exactly why the row reads the pick rather than writing
 *                    one. The ⎙ beside the word says one thing on its own: the paper is printed.
 *   the groups       `prep-order.ts`, pure and node-tested.
 *   the day          `day-toggler.tsx`; `today` is ONE reading, `cedarTodayId()`.
 *   the note         the copied `detail.tsx`, which mounts the copied `source-thread.tsx` under it.
 *   the paper        `print-sheet.tsx` over the copied `print-queue` / `print-view` / `print-screen`.
 *
 * ═══ NO PRICES, ANYWHERE ON IT ═══════════════════════════════════════════════════════════════
 * Quantities and units only, on the rows, in the note and on the paper (DESIGN-SPEC.md §3). The seam
 * is one override at the top of each copied file — see `detail.tsx`'s own note — rather than sixty
 * edits; this surface therefore draws no figure and asks for none.
 *
 * ═══ THE MAP IS OFF THE PANE AND OFF THE ROW ═════════════════════════════════════════════════
 * Peter took it off. `TruckChip` keeps its own picture behind its own press, which is where a map
 * belongs: asked for, never standing.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Avatar } from 'baseui/avatar';
import { Button, KIND, SHAPE, SIZE } from 'baseui/button';
import { SegmentedControl, Segment, FILL } from 'baseui/segmented-control';
import Page from '../../cedar/shell/page';
import { LIST_FLOOR, SHEET_SNUG, usePhone, useStacked } from '../../cedar/shell/viewport';
import { usePanes } from '../shell/frame';
/* `writeDay` is the ledger's own `setDay`, aliased: this surface holds a `setDay` of its own
   for which day the list is standing on, and the two are different things. */
import { useDay, dayNow, setDay as writeDay, nowOf, plural } from '../../cedar/day';
import { useGrants } from '../../cedar/grants';
import { zoneWordOf } from '../../cedar/company';
import { cedarTodayId } from '../../cedar/scenario-clock';
import { AttentionLabels } from '../../cedar/attention-labels';
import { TruckChip } from '../../cedar/truck-chip';
import { ActDot, Glyph, STEP } from '../../cedar/glyphs';
import { flagBox, useFlagStanding } from '../../cedar/red-flag';
import { GhostBlock } from '../../../rocoto/ghost';
import type { AreaMeta } from '../shell/area';
import {
  archiveSale, canPrepare, daysWithSales, isMessageOnly, isPrepared, isStanding,
  roundOf, rowStanding, salesOfDay, type RowStanding, type Sale,
} from '../../cedar/sale';
import { BODEGA_CAST, bodegaSales, PREP_STATE_OF, useBodegaDerived } from '../cast-cedar';
import DayToggler, { dayWords } from '../day-toggler';
import {
  PREP_ORDERS, PREP_ORDER_WORD, groupsFor, flatten, prepWordOf, readPrepOrder,
  writePrepOrder, type PrepOrderId, type PrepRow,
} from '../prep-order';
import { PrintPress, usePrintRows, PHONE_ACT_BAR_BOTTOM, PHONE_LIST_END } from '../print-sheet';
import { LAUNCHER_LANE } from '../shell/chats';
import { PrintScreenCard, type PrintScreenRequest } from '../print-screen';

export const meta: AreaMeta = {
  id: 'prep',
  title: 'Prep',
  owner: 'BODEGA-PREP',
  /* MASTER-DETAIL (§38): the list and the note, two full-height panes on the desk. Declared, so the
     frame stands in this posture on the first paint of a move rather than one frame later. */
  panes: true,
};

/* ── THE ROW ──────────────────────────────────────────────────────────────────────────────── */

/** `FACE.row` is 28 in Cedar's river and the row keeps 28 — the discs a name is found by in a
 *  scrolling column. */
const FACE_ROW = 28;

/** How long the archive line stands before it goes. Long enough to read a name and reach for the
 *  press; short enough that it is gone before the next act (QA item 31). */
const UNDO_STANDS = 8000;

/** THE ACT, ANNOUNCED, WITH ITS WAY BACK. `role="status"` so a reader hears it without the focus
 *  moving, and the press beside it is the whole of the reversal. */
function UndoLine({ says, onUndo, phone }: { says: string; onUndo: () => void; phone: boolean }) {
  const [, theme] = useStyletron();
  return (
    <div
      role="status"
      data-testid="prep-undo"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: theme.sizing.scale500, minWidth: 0,
        padding: `${theme.sizing.scale300} ${theme.sizing.scale500}`,
        borderRadius: theme.borders.radius300,
        border: `1px solid ${theme.colors.borderOpaque}`,
        background: theme.colors.backgroundPrimary,
        boxShadow: theme.lighting.shadow500,
        pointerEvents: 'auto',
        ...(phone ? { width: '100%' } : { maxWidth: '360px' }),
      }}
    >
      <span style={{ ...theme.typography.LabelSmall, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{says}</span>
      <Button
        kind={KIND.tertiary}
        size={SIZE.compact}
        data-testid="prep-undo-take"
        onClick={onUndo}
        startEnhancer={<Glyph id="undo" size={STEP.small} />}
        overrides={{ BaseButton: { style: { minHeight: '44px', flex: '0 0 auto' } } }}
      >
        Undo
      </Button>
    </div>
  );
}

function CustomerFace({ of, size, muted = false }: { of: { name: string }; size: number; muted?: boolean }) {
  const [, theme] = useStyletron();
  return (
    <span
      aria-hidden="true"
      data-object-face="customer"
      style={{ display: 'inline-flex', flex: '0 0 auto', opacity: muted ? 0.55 : 1 }}
    >
      <Avatar
        name={of.name}
        size={`${size}px`}
        /* Base's default is the body's size, which in a 28px circle is a letter pressed against the
           edge; the initials take the seat's own step. */
        overrides={{ Initials: { style: { ...theme.typography.LabelXSmall, letterSpacing: 0 } } }}
      />
    </span>
  );
}

/**
 * THE WORD UNDER THE ROW, IN ONE TREATMENT — AND THE PAPER AS ITS OWN MARK BESIDE IT.
 *
 * The word says where the goods are (`cast.ts` · `PREP_STATES`): `Asked for`, `Prepared`,
 * `Handed over`, with `Re-check` over them where the pick went stale. ONE SIZE, ONE COLOUR, ON
 * EVERY ROW. The seat used to draw it two ways — 14 px ink where the day pressed, 12 px grey where
 * it did not — so one list printed «Made» in two weights an inch apart with nothing saying what
 * the difference was, and a person reading it had to guess whether the weight or the ⎙ carried the
 * fact. It was neither: both said «nothing is owed on this row», twice.
 *
 * SO THE SECOND WEIGHT GOES AND THE ⎙ KEEPS THE WHOLE OF ITS OWN FACT — the paper for this order
 * is printed — on every row that has it, with its word for a screen reader and under the pointer.
 * The row already dims as a whole when nothing is owed (`quiet`, and the muted face beside it) and
 * the red pills above carry what is asking for a person, so the state word owes neither job.
 */
function RowWord({ standing, facet }: { standing: RowStanding; facet: string }) {
  const [, theme] = useStyletron();
  return (
    <span
      data-row-word={facet}
      data-row-paper={standing.printed ? 'yes' : 'no'}
      title={standing.printed ? 'Printed' : undefined}
      style={{
        ...theme.typography.LabelXSmall,
        color: theme.colors.contentTertiary,
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.sizing.scale100,
        whiteSpace: 'nowrap',
      }}
    >
      {standing.printed && <Glyph id="print" size={STEP.small} title="Printed" />}
      {facet}
    </span>
  );
}

const PrepRowCard = React.memo(function PrepRowCard({
  sale, standing, facet, received, selected, onOpen, onArchive,
}: {
  sale: Sale;
  standing: RowStanding;
  /** the state word with prep's facets over it, already resolved */
  facet: string;
  /** under `Time`, the second line leads with the hour it arrived */
  received: boolean;
  selected: boolean;
  onOpen: () => void;
  onArchive: () => void;
}) {
  const [, theme] = useStyletron();
  const [over, setOver] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  /* ── THE RING IS THE KEYBOARD'S, NEVER THE POINTER'S (QA item 32) ───────────────────────────
     `focused` is true for a mouse press too, and a row that grew a ring under a click would be
     the app answering a hand it was never asked to. The browser's own answer to «did they arrive
     here by key» is `:focus-visible`, read once as the focus lands. */
  const [ring, setRing] = React.useState(false);
  const phone = usePhone();
  const round = roundOf(sale);
  const quiet = standing.closed;
  const flag = useFlagStanding(sale);
  const near = over || focused || phone;

  return (
    <div
      data-archive-row={sale.id}
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      /* A DAY OF A WHOLESALE HOUSE IS 286 ROWS (measured on the seeded cast). `content-visibility`
         is the browser's own answer — a row outside the scrollport lays out as a box of the stated
         size and paints nothing — and it is Cedar's own idiom on this row, lifted with it. */
      style={{
        display: 'flex',
        alignItems: 'stretch',
        minWidth: 0,
        contentVisibility: selected ? 'visible' : 'auto',
        containIntrinsicSize: `auto ${phone ? 112 : 96}px`,
      }}
    >
      <button
        type="button"
        data-prep-row={sale.id}
        data-state={sale.state}
        data-closed={standing.closed ? 'yes' : 'no'}
        data-selected={selected ? 'yes' : 'no'}
        data-flagged={flag.any ? 'yes' : 'no'}
        data-testid={`open-${sale.id}`}
        onFocus={(event) => {
          setFocused(true);
          setRing(typeof event.currentTarget.matches === 'function' && event.currentTarget.matches(':focus-visible'));
        }}
        onBlur={() => { setFocused(false); setRing(false); }}
        onClick={onOpen}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          /* ── THE RAIL WRAPS RATHER THAN STARVING THE NAME (Cedar's own C30, one level simpler) ─
             At 320 the pills are ~150 px of `nowrap` beside a 28 px face, which left «Hotel Rec»
             sixty pixels and printed «Hot…». A name you cannot read is a list you cannot use, so
             the row declares the width below which the words stop reading and the rail takes a
             line of its own under them when it cannot sit beside them — right-aligned, keeping its
             column relationship, and at the same point on every row. */
          flexWrap: 'wrap',
          rowGap: theme.sizing.scale200,
          gap: theme.sizing.scale500,
          minWidth: 0,
          margin: `${theme.sizing.scale100} 0`,
          padding: `${theme.sizing.scale500} ${theme.sizing.scale600}`,
          /* THE OUTLINE TAKES NO LAYOUT (§37.3): a row that starts being flagged must not move the
             rows around it, so the flag is drawn outside the border box. */
          border: `1px solid ${selected || focused || over ? theme.colors.borderOpaque : 'transparent'}`,
          ...flagBox(theme, flag.any),
          /* ── THE ROW ANSWERS THE KEYBOARD (QA item 32) ──────────────────────────────────
             Tabbing onto a row drew nothing but the same grey fill the pointer draws, so a person
             walking the list by key could not tell where they were — and the ring has to be
             written HERE rather than in a `:focus-visible` class, because `flagBox` above writes
             `outline: none` inline on every unflagged row and an inline value outranks a class.
             It is INSET so a ring never moves the rows around it, and it is INK — the ring the
             day bar and the top bar already wear — because saffron is what «To review» means
             six rows down this very list. A flag keeps its own outline: that is a fact about the
             order, and it outranks where the keyboard happens to be. */
          ...(ring && !flag.any
            ? { outline: `2px solid ${theme.colors.contentPrimary}`, outlineOffset: '-2px' }
            : null),
          borderRadius: theme.borders.radius300,
          background: selected || over || focused ? theme.colors.backgroundSecondary : 'transparent',
          transitionProperty: 'box-shadow, background-color, border-color',
          transitionDuration: theme.animation.timing400,
          transitionTimingFunction: theme.animation.easeOutCurve,
          color: quiet ? theme.colors.contentSecondary : theme.colors.contentPrimary,
          textAlign: 'left',
          cursor: 'default',
          fontFamily: 'inherit',
          minHeight: '48px',
        }}
      >
        {/* THE FACE TRAVELS WITH THE NAME. It is inside the wrapping unit rather than beside it,
            so when the rail drops to its own line the disc stays against the name it belongs to
            instead of standing alone on a line of its own. */}
        <span style={{ display: 'flex', alignItems: 'center', gap: theme.sizing.scale500, flex: '1 1 180px', minWidth: 0 }}>
        <CustomerFace of={sale.customer} size={FACE_ROW} muted={standing.closed} />

        <span style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale100, flex: '1 1 auto', minWidth: 0 }}>
          <span
            data-customer={sale.customer.name}
            style={{
              ...theme.typography.LabelMedium,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sale.customer.name}
          </span>
          {/* THE FACTS — and nothing on this line is ever the point of the row. The hour keeps its
              own box and never shrinks: it is what a person navigates the morning by. */}
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.sizing.scale300,
              flexWrap: 'wrap',
              rowGap: theme.sizing.scale100,
              minWidth: 0,
              ...theme.typography.ParagraphXSmall,
              color: theme.colors.contentTertiary,
            }}
          >
            {isMessageOnly(sale) && <ActDot label="Rocoto read it" />}
            <span style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}>
              {received ? `Received ${sale.at}` : `${sale.lines.length} ${plural(sale.lines.length, 'line')}`}
            </span>
            {!received && (
              <span data-hour={sale.at} style={{ flex: '0 0 auto', whiteSpace: 'nowrap', marginLeft: `-${theme.sizing.scale200}` }}>
                · {sale.at}
              </span>
            )}
            {round && <TruckChip round={round} />}
          </span>
        </span>
        </span>

        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: theme.sizing.scale100, whiteSpace: 'nowrap', marginLeft: 'auto', flex: '0 0 auto', maxWidth: '100%' }}>
          <AttentionLabels sale={sale} />
          <RowWord standing={standing} facet={facet} />
        </span>
      </button>

      {/* THE TRAILING CONTROL STAYS THE ARCHIVE PRESS, which is what keeps `Archived` reachable
          through Find once it has left the day. */}
      <span style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto', paddingRight: theme.sizing.scale200 }}>
        <Button
          kind={KIND.tertiary}
          size={SIZE.mini}
          shape={SHAPE.circle}
          data-testid={`archive-${sale.id}`}
          aria-label={`Archive ${sale.customer.name}`}
          title="Archive delivery note"
          onClick={onArchive}
          overrides={{ BaseButton: { style: { minWidth: '44px', minHeight: '44px', opacity: near ? 1 : 0, ':focus-visible': { opacity: 1 } } } }}
        >
          <Glyph id="archive" size={STEP.small} />
        </Button>
      </span>
    </div>
  );
});

/* ── THE SURFACE ──────────────────────────────────────────────────────────────────────────── */

/** THE NOTE IS LAZY (prep-design.md, «Performance on a phone»). `detail.tsx` is the heaviest module
 *  in the package by a factor of two, and the list route needs none of it: it arrives with the first
 *  order a person opens. */
const SaleDetail = React.lazy(() => import('../detail'));

/**
 * ── THE BOX §38 NEEDS, MEASURED RATHER THAN INHERITED ────────────────────────────────────────
 *
 * The frame hands a panes surface the whole box under the chrome and `Page fill` passes it on. One
 * element in between breaks the chain: the router wraps every area in a plain `<div data-posture>`
 * (`App.tsx`), and a block box of its own height turns `height: 100%` on the panes below it into
 * `auto` — measured on the seeded day, the grid came out 22,781 px tall, with the list pane growing
 * to the whole river and the sticky press at the bottom of all of it.
 *
 * So this surface MEASURES the room it has: its own top against the visual viewport. That answer is
 * right whether or not the wrapper ever carries a height, it costs one read per resize, and it is a
 * fact about the screen rather than an assumption about four ancestors.
 */
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

/** The tail after the area belongs to the area, so `#/prep/<id>` is this surface reading its own
 *  address (`App.tsx`: «the file name is the route»). */
const tailOf = (hash: string): string => {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return parts[0] === 'prep' ? parts[1] ?? '' : '';
};

function PrepSurface() {
  const [, theme] = useStyletron();
  const phone = usePhone();
  const stacked = useStacked();
  const pushed = phone || stacked;
  const panes = !phone;
  usePanes(!phone);

  /* THE WORLD IS THE BODEGA'S (`cast-cedar.ts`). Cedar's config keeps every other answer it gives —
     the albarán's posture, the rails, the lots — and the house, the book, the catalogue AND THE
     PERSON come from this shop. Cedar's `config.owner.name` was the last field read out of that
     config here, and it answers with Cedar's own operator, «Peter». */
  const derived = useBodegaDerived();
  const cast = BODEGA_CAST;
  const edits = useDay(cast.sector);
  const grants = useGrants();
  const now = nowOf(cast);

  /* ── THE WHOLE BOOK, THEN ONE DAY OF IT ───────────────────────────────────────────────────
     `buildSales` is the fold, and the surface narrows it. A question on a customer's channel is a
     conversation record rather than something to pack, so it stays out of the list. */
  const allSales = React.useMemo(
    () => bodegaSales(edits).filter((sale) => !isMessageOnly(sale) && !sale.archived),
    [cast, edits, grants],
  );

  /* ONE READING OF TODAY (`scenario-clock.ts`), so the toggler's word, the calendar's highlight and
     what the paper still owes all agree. */
  const today = cedarTodayId();
  const [day, setDay] = React.useState(today);
  const days = React.useMemo(() => daysWithSales(allSales), [allSales]);
  const sales = React.useMemo(() => salesOfDay(allSales, day), [allSales, day]);

  /* ── THE ORDER, PER WORKSPACE, SURVIVING THE DAY WALK ─────────────────────────────────────── */
  const [order, setOrder] = React.useState<PrepOrderId>(() => readPrepOrder());
  const takeOrder = (next: PrepOrderId) => { setOrder(next); writePrepOrder(next); };

  /* ── THE ONE FOLD (prep-design.md). The grouping is keyed on the three things it reads, and the
     per-row flag standing is hoisted into it so the list asks `red-flag` once rather than N times. */
  const rows = React.useMemo(() => sales.map((sale) => {
    const standing = rowStanding(sale, today);
    const row: PrepRow & { sale: Sale; standing: RowStanding; facet: string } = {
      id: sale.id,
      at: sale.at,
      /* THE BLOCK IS THE CUSTOMER'S OWN STREET. `cast-cedar.ts` writes the fixture's block word —
         `Jr. Los Amautas`, `Av. Gran Chimú` — into `zone`, so the group heading is the address a
         person walks to. `zoneWordOf` reads the house's RUN names, which a bodega keeps none of,
         and `roundOf` answers null unless the customer has both a truck and a zone. */
      block: sale.customer.zone ?? null,
      /* IT NEEDS JUDGING BEFORE IT CAN BE PACKED: `canPrepare` is `RANK >= committed`, so an order
         still at `request` would otherwise have nowhere to be — which is the duty Sales' own
         `To review` scope carried and this group inherits. */
      review: !canPrepare(sale) || isStanding(sale, today),
      prepared: isPrepared(sale),
      recheck: Boolean(sale.prep?.stale),
      sale,
      standing,
      facet: '',
    };
    row.facet = prepWordOf(row, PREP_STATE_OF[sale.state]);
    return row;
  }), [sales, today]);

  const groups = React.useMemo(() => groupsFor(order, rows), [order, rows]);
  /** THE ORDER THE LIST IS SHOWING, FLAT — what the paper prints. */
  const ordered = React.useMemo(() => flatten(groups).map((row) => row.sale), [groups]);

  /* ── WHAT IS OPEN ─────────────────────────────────────────────────────────────────────────── */
  const [selected, setSelected] = React.useState<string | null>(() => tailOf(window.location.hash));
  React.useEffect(() => {
    const read = () => setSelected(tailOf(window.location.hash) || null);
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  const open = (id: string | null) => {
    window.location.hash = id ? `#/prep/${id}` : '#/prep';
    setSelected(id);
  };
  /* A selection the day no longer holds is no selection: walking the toggler closes the note rather
     than leaving yesterday's order standing beside today's list. */
  const inHand = React.useMemo(
    () => ordered.find((sale) => sale.id === selected) ?? null,
    [ordered, selected],
  );
  React.useEffect(() => {
    if (selected && !inHand) open(null);
  }, [selected, inHand]);

  /* THE PHONE PUSHES, so it starts at the top of what it pushed. */
  React.useEffect(() => {
    if (phone && inHand) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [phone, inHand]);

  /* ── ARCHIVING IS ONE TAP, SO IT CARRIES ITS WAY BACK (QA item 31) ────────────────────────
     The glyph on every row took «Received · 12 sales» to 11 with nothing said and nothing to
     press: on a phone the archived order was then reachable only through Find, and a person who
     hit it with a thumb had no way of knowing which row had gone. The act announces itself in a
     `role="status"` line with its own Undo, and the line stands for a few seconds.

     THE REVERSAL IS THE EVENT, TAKEN BACK OUT. `archiveSale` appends one event to the day's
     ledger; Undo removes exactly the events this press added, so everything that has landed since
     survives — `detail.tsx`'s own `reversible` reasoning, kept here rather than imported, because
     importing it would open the lazy door this list keeps shut. */
  const [undone, setUndone] = React.useState<{ says: string; take: () => void } | null>(null);
  React.useEffect(() => {
    if (!undone) return undefined;
    const timer = window.setTimeout(() => setUndone(null), UNDO_STANDS);
    return () => window.clearTimeout(timer);
  }, [undone]);
  const archive = (sale: Sale) => {
    const before = dayNow().events;
    archiveSale(sale, now, cast.owner.name);
    const landed = dayNow().events;
    if (landed.length === before.length) return;
    const mine = new Set(landed.slice(before.length));
    setUndone({
      says: `${sale.customer.name} archived`,
      take: () => { writeDay((prev) => ({ events: prev.events.filter((event) => !mine.has(event)) })); setUndone(null); },
    });
  };

  const [printing, setPrinting] = React.useState<PrintScreenRequest | null>(null);
  const printRows = usePrintRows({ day, ordered, inHand, sector: cast.sector, today });

  const listPane = React.useRef<HTMLDivElement | null>(null);
  const box = React.useRef<HTMLDivElement | null>(null);
  const boxHeight = useBoxHeight(box);

  /* ── THE HEADER BLOCK: THE DAY, THEN THE ORDER ────────────────────────────────────────────── */
  const header = (
    <div
      data-testid="prep-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.sizing.scale300,
        /* ── THE PHONE'S GUTTER IS THE FRAME'S, AND IT IS PAID ONCE (measured in the DOM, 19 Sept)
           This band drew a SECOND 16px inset inside the column's own 16, so 64 of a 320 screen was
           gutter and the day toggler was handed 256px for a 322px composition — 44 chevron + 6 +
           156 button + 6 + 44 chevron — and the day's own date clipped to «Monday 14….».
           The rows below already stand on the frame's gutter and pad themselves, so the band does
           the same: the day control and the order row now line up with the cards' own edges, and
           the label gets the 288px the screen actually has. The desk keeps its own 40, where the
           surface declares panes and the frame hands it a box with no padding at all. */
        padding: phone
          ? `0 0 ${theme.sizing.scale300}`
          : `${theme.sizing.scale600} ${theme.sizing.scale900} ${theme.sizing.scale400}`,
        borderBottom: phone ? undefined : `1px solid ${theme.colors.borderOpaque}`,
        background: theme.colors.backgroundPrimary,
        minWidth: 0,
      }}
    >
      <DayToggler day={day} today={today} days={days} onPick={setDay} />

      {/* ── THE TWO ORDERS, ON THEIR OWN FULL-WIDTH ROW AT 48 px ───────────────────────────────
          `Location` is the DEFAULT AND THE MARKED ONE, and the mark's COLOUR comes free: Base's own
          `StyledActive` draws `scale0 solid $theme.colors.primary` over `backgroundPrimary`, and
          `rocoto-theme.ts` sets `primary: brand.ink` — «ordinary interaction is the person's hand:
          ink, never accent». That is Peter's «with a colour in the toggle», spent inside the colour
          law, with saffron left meaning *Rocoto acted*. Its GEOMETRY is the one override below.
          Base's own list is 40 px tall; the house's row is 48. */}
      <SegmentedControl
        activeKey={order}
        fill={FILL.fixed}
        /* FULL WIDTH, STATED. Base's own root is `fit-content`, which on a fixed fill gives each
           segment `flex-basis: 0` inside a box only as wide as its content — so `Location` came out
           as «Loca…» at both widths. The row is the control's, so the control takes the row. */
        width="100%"
        onChange={({ activeKey }) => takeOrder(activeKey as PrepOrderId)}
        overrides={{
          Root: { props: { 'data-testid': 'prep-order', 'data-order': order } },
          /* ── THE GROUP NAMES ITSELF, AND THE CHOICE IS READ OUT (QA item 32) ──────────────
             Base draws the list as a `listbox` of `option`s and labels it «segmented control» —
             the name of the WIDGET, over a wrapper carrying «Sort orders» on no role at all, so a
             reader heard the component and never the question. The label goes where the role is;
             `aria-selected` on each option is what says which one is standing. */
          SegmentList: { props: { 'aria-label': 'Sort orders' }, style: { minHeight: '48px' } },
          /* ── THE MARK IS GEOMETRY, NEVER A MEASUREMENT (the pane split, 19 Sept) ─────────────
             Base sizes this pill in PIXELS read off the active segment, and it reads on mount and
             on `activeKey` only. THE PANE SPLITS WITHOUT EITHER: opening an order at 1280 takes
             this row from 1000 px to 360 px, and the 500 px pill stayed put — one capsule over
             both words, its right end 140 px past the end of the control; walking back widened the
             row to 1000 and left the pill at 180. Base's own per-segment `ResizeObserver` cannot
             catch it, because the effect holding the baseline it compares against runs after EVERY
             render, so the pane's new width is already the baseline by the time the observer
             fires — which is also why dragging the window healed nothing.
             `FILL.fixed` makes the answer exact with no measuring at all: the list is a flex row
             with no gap and each segment is `flexGrow: 1; flexBasis: 0`, so a segment is `1 / n` of
             the row, the pill is that per cent wide, and it stands `index × 100` per cent along
             (a per-cent `translateX` counts the pill's own width). Right at every width, at every
             pane state, and Base's `all` transition still slides it. */
          Active: {
            style: {
              width: `${100 / PREP_ORDERS.length}%`,
              transform: `translateX(${100 * Math.max(0, PREP_ORDERS.indexOf(order))}%)`,
            },
          },
        }}
      >
        {PREP_ORDERS.map((id) => (
          <Segment
            key={id}
            overrides={{
              Segment: {
                props: { 'data-testid': `prep-order-${id}`, 'data-selected': order === id ? 'yes' : 'no' },
                style: {
                  minHeight: '48px',
                  /* ── FOCUS IS INK, NEVER THE ALERT RED (QA item 32) ───────────────────────
                     Base's own ring is `3px solid $theme.colors.accent`, and this house's accent
                     is the red the list prints «To review» in, six rows below — so a person
                     tabbing onto the sort control was told their own hand was an error. The house
                     ring is ink, which is what «ordinary interaction is the person's hand» means
                     (`rocoto-theme.ts`). */
                  ':focus-visible': {
                    outline: `2px solid ${theme.colors.contentPrimary}`,
                    outlineOffset: '-2px',
                  },
                },
              },
              Label: { style: { whiteSpace: 'nowrap' } },
            }}
            label={PREP_ORDER_WORD[id]}
          />
        ))}
      </SegmentedControl>
    </div>
  );

  /* ── THE LIST ─────────────────────────────────────────────────────────────────────────────── */
  const list = (
    <div data-testid="prep-list" data-sales={sales.length} style={{ display: 'flex', flexDirection: 'column', minWidth: 0, ...(sales.length === 0 ? { flex: '1 1 auto' } : null) }}>
      {groups.map((group) => (
        <section key={group.key} data-prep-group={group.word} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* A HEADING NAMES THE THING AND CARRIES ITS COUNT, and the count reads `sales`. */}
          <h2
            data-testid={`prep-group-${group.key}`}
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              margin: 0,
              padding: `${theme.sizing.scale500} ${theme.sizing.scale600} ${theme.sizing.scale200}`,
              background: theme.colors.mono100,
              ...theme.typography.LabelSmall,
              color: theme.colors.contentSecondary,
            }}
          >
            {group.heading}
          </h2>
          {group.rows.map((row) => (
            <PrepRowCard
              key={row.id}
              sale={row.sale}
              standing={row.standing}
              facet={row.facet}
              received={order === 'time'}
              selected={row.id === selected}
              onOpen={() => open(row.id)}
              /* THE SHOP'S OWN OWNER (the Barcelona-cast leak, 19 Sept). What this writes is read
                 back in the sheet's head as «Archived by …», so a row archived here and a sheet
                 archived in `detail.tsx` have to name the same person: Yesenia, off the cast. */
              onArchive={() => archive(row.sale)}
            />
          ))}
        </section>
      ))}
      {/* ── A DAY WITH NOTHING ON IT SAYS SO, IN THE MIDDLE OF THE ROOM (QA item 29) ────────
          One 14 px line flush left at the top of 900 px of white read as a list that had failed to
          load. It stands in the middle of the space it is about and it NAMES THE DAY, because the
          question a person walking the toggler is asking is about this day and not about Prep. */}
      {sales.length === 0 && (
        <div
          data-testid="prep-empty"
          data-day={day}
          style={{
            display: 'grid', alignContent: 'center', justifyItems: 'center', textAlign: 'center',
            flex: '1 1 auto', minHeight: '240px',
            padding: `${theme.sizing.scale900} ${theme.sizing.scale600}`,
            gap: theme.sizing.scale300,
          }}
        >
          <span style={{ ...theme.typography.HeadingXSmall, color: theme.colors.contentPrimary }}>
            Preparation is clear on {dayWords(day, today)}
          </span>
          <span style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, maxWidth: '36ch' }}>
            Orders land here as customers send them.
          </span>
        </div>
      )}
    </div>
  );

  /* ── THE NOTE, WITH THE CONVERSATION UNDER IT ─────────────────────────────────────────────── */
  const note = inHand ? (
    <React.Suspense fallback={<div style={{ padding: theme.sizing.scale700 }}><GhostBlock height={320} /></div>}>
      <SaleDetail
        cast={cast}
        derived={derived}
        sale={inHand}
        sales={ordered}
        list={ordered}
        onPick={(id) => open(id)}
        onClose={() => {
          if (pushed) { open(null); return; }
          const i = ordered.findIndex((sale) => sale.id === inHand.id);
          open((ordered[i + 1] ?? ordered[i - 1])?.id ?? null);
        }}
        /* ESC LEAVES THE ORDER (QA item 41). The dock's own way out walks to the next one on the
           desk; the key means «back to the list», so it lands on `#/prep`. */
        onEscape={() => open(null)}
        onPrint={() => setPrinting({ subject: { kind: 'albaran', sale: inHand.id }, paperKind: 'albaranes' })}
      />
    </React.Suspense>
  ) : null;

  const paper = (
    <PrintScreenCard
      request={printing}
      cast={cast}
      derived={derived}
      sales={ordered}
      onClose={() => setPrinting(null)}
    />
  );

  /* ── THE PHONE: ONE SCREEN, ONE SCROLL, PUSH AND BACK ─────────────────────────────────────── */
  if (phone) {
    return (
      <Page title={meta.title}>
        {inHand ? (
          /* ── THE PHONE'S DETAIL ALREADY HAS ITS ACT BAR, AND IT IS THE SHEET'S OWN DOCK ────
              `Delivery note` is the row about the order IN HAND, and on this route the document's
              own dock carries it: `SaleDetail`'s `Print` / `Print again` is wired to this surface's
              print screen on exactly that subject. A second persistent press 96 px above it would
              be two controls for one act — the thing the one `Print` exists to end. */
          <div data-testid="detail-open" style={{ minWidth: 0, overflowX: 'clip' }}>
            {note}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {header}
            {list}
            {/* THE SCROLL ENDS ABOVE THE WHOLE BAND (QA item 11) — the bottom row, the launcher's
                lane, the bar that floats in it and one step of air. `PHONE_LIST_END` is that
                arithmetic, stated in `print-sheet.tsx` beside the bar it measures. */}
            <div aria-hidden="true" style={{ height: `${PHONE_LIST_END}px`, flex: '0 0 auto' }} />
            {undone && (
              <div style={{ position: 'fixed', left: 0, right: 0, bottom: `calc(${PHONE_ACT_BAR_BOTTOM + 56}px + env(safe-area-inset-bottom, 0px))`, zIndex: 3, display: 'flex', padding: `0 ${theme.sizing.scale600}`, pointerEvents: 'none' }}>
                <UndoLine says={undone.says} onUndo={undone.take} phone />
              </div>
            )}
            <PrintPress rows={printRows} only={['sheet', 'packing']} phone onPick={setPrinting} />
          </div>
        )}
        {paper}
      </Page>
    );
  }

  /* ── THE DESK: TWO PANES, THE PAGE ITSELF NOT SCROLLING (§38) ─────────────────────────────── */
  return (
    <Page title={meta.title} fill={panes}>
      <div
        ref={box}
        data-testid="panes"
        data-open={inHand ? 'yes' : 'no'}
        style={{
          display: 'grid',
          /* THE NOTE IS WHAT YIELDS when the room runs short, never the list. Below `STACK_MAX`
             there is no room for two honest panes, so the grid is one column and the note stands in
             it alone. */
          gridTemplateColumns: inHand && !stacked
            ? `minmax(${LIST_FLOOR}px, 1fr) minmax(0, ${SHEET_SNUG}px)`
            : 'minmax(0, 1fr)',
          height: boxHeight === null ? '100%' : `${boxHeight}px`,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        {(!stacked || !inHand) && (
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            {header}
            <div
              ref={listPane}
              data-testid="list-pane"
              style={{
                flex: '1 1 auto',
                minWidth: 0,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'clip',
                padding: `0 ${theme.sizing.scale600}`,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {list}
              {/* THE PRESS IS STICKY AT THE FOOT OF THE PANE, and it is INSIDE the scrollport so it
                  stands over the last rows rather than taking a band of the pane's height. */}
              <div style={{ flex: '1 1 auto', minHeight: theme.sizing.scale600 }} />
              {undone && (
                <div style={{ position: 'sticky', bottom: '64px', zIndex: 3, display: 'flex', justifyContent: 'flex-end', padding: `0 ${theme.sizing.scale600}`, paddingRight: `${LAUNCHER_LANE}px`, pointerEvents: 'none' }}>
                  <UndoLine says={undone.says} onUndo={undone.take} phone={false} />
                </div>
              )}
              <PrintPress rows={printRows} only={['sheet', 'packing', 'albaran']} phone={false} onPick={setPrinting} />
            </div>
          </div>
        )}
        {inHand && (
          <div
            data-testid="detail-open"
            style={{
              minWidth: 0,
              minHeight: 0,
              overflowY: 'auto',
              scrollPaddingTop: '64px',
              overflowX: 'clip',
              /* THE SEAM. One hairline between the two panes and no ground at all — the note is a
                 pane of the same surface, not a card standing on it. */
              borderLeft: stacked ? undefined : `1px solid ${theme.colors.mono400}`,
              background: theme.colors.backgroundSecondary,
            }}
          >
            {note}
          </div>
        )}
      </div>
      {paper}
    </Page>
  );
}

export default function Prep() {
  return <PrepSurface />;
}
