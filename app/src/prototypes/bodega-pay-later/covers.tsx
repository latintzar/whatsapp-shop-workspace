/* THE COVERS — three dialogs, one each, on the area's first open (DESIGN-SPEC.md §5, §3).
 *
 * THE RULE, PETER'S OWN: a full-bleed cover belongs where a flow starts, where a feature
 * introduces itself, or on a notice a person has to read — once, and rare on purpose. Lists,
 * sheets, steps and ledgers carry none, which is why Prep has no cover at all: the day's sales are
 * its picture. So three areas introduce themselves here, each in the anatomy Uber's own modals use
 * and Cedar already draws on `Pay over time`:
 *
 *        image   ·   title   ·   body   ·   ONE action
 *
 * ONE ACTION, AND IT IS THE DOOR IN. A cover that offered two choices would be a decision, and the
 * area behind it is the answer to the only question the person has. `Open Money` closes the cover
 * and leaves them where they already were.
 *
 * ONCE MEANS ONCE, AND THE BROWSER REMEMBERS. The book below is one `rocoto-bodega-*` key — the
 * prefix comes from `store/keys.ts`, so `Reset state`'s prefix sweep clears it the same day it was
 * added (that file: «it sweeps by prefix rather than by the list above, so a store added later is
 * cleared the day it lands»). A shop that resets the rig meets each area fresh, which is exactly
 * what a demo of a first open needs.
 *
 * THE FOURTH BAND IS NOT A DIALOG. `referrals` serves two seats — screen 5 of the critical path and
 * Money → `Suppliers you brought` — and neither is a cover dialog: they are surfaces with a picture
 * at the top. `ReferralsCover` is that band alone, so both seats draw one file through one export
 * (ONBOARDING-SPEC.md §8).
 *
 * `arrival` is the fifth seat and the onboarding package's own, drawn straight from `HeroArtwork`
 * on screen 1.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { WorkflowDialog } from '../cedar/workflow-dialog';
import { HeroArtwork } from './hero-artwork';
import { KEYS } from './store/keys';

/* ── the three areas that introduce themselves ────────────────────────────────────────────── */

/** The areas that carry a cover. Prep carries none, and the referral band is not a dialog. */
export type CoverArea = 'money' | 'stock' | 'customers';

export const COVER_AREAS: readonly CoverArea[] = ['money', 'stock', 'customers'];

/** WHAT EACH COVER SAYS, PINNED (DESIGN-SPEC.md §6 · the decisions of 18 September).
 *
 * `area` is the frame's own word — the place the person is standing in — and `title` is the
 * sentence under the picture that names what the place holds. Both are in §6's string table, so
 * neither is invented here and neither may be improved in passing. */
type CoverText = { area: string; title: string; body: string; act: string };

export const COVER_TEXT: Record<CoverArea, CoverText> = {
  money: {
    area: 'Money',
    title: 'See what you have and what you owe',
    body: 'Your bank account first, then supplier payments and customers who owe you.',
    act: 'Open Money',
  },
  stock: {
    area: 'Products',
    title: 'See what you sell',
    body: 'A product list built from your supplier orders.',
    act: 'Open Products',
  },
  customers: {
    area: 'Customers',
    title: 'See who buys from you',
    body: 'See who comes back, what they buy and what they owe.',
    act: 'Open Customers',
  },
};

/* ── the book that makes it happen once ───────────────────────────────────────────────────── */

/** ONE KEY, THREE MARKS. The prefix is `store/keys.ts`'s, so a reset takes it with everything
 *  else this prototype writes; the value is the hour each cover was met, because a mark with a
 *  date on it can be read back by a drive and by a person. */
export const COVERS_KEY = KEYS.covers;

type Book = Partial<Record<CoverArea, string>>;

const parse = (raw: unknown): Book => {
  if (!raw || typeof raw !== 'object') return {};
  const out: Book = {};
  for (const area of COVER_AREAS) {
    const at = (raw as Record<string, unknown>)[area];
    if (typeof at === 'string' && at) out[area] = at;
  }
  return out;
};

let BOOK: Book = (() => {
  try {
    return parse(JSON.parse(window.localStorage.getItem(COVERS_KEY) ?? 'null'));
  } catch {
    /* a browser where storage throws still renders, and every cover then opens on every visit */
    return {};
  }
})();

const publish = (next: Book): void => {
  BOOK = next;
  try {
    window.localStorage.setItem(COVERS_KEY, JSON.stringify(next));
  } catch {
    /* a private window keeps the mark for this session alone, which is honest */
  }
};

/** WHICH COVERS THIS BROWSER HAS ALREADY MET, with the hour each one was met. */
export const coversMetNow = (): Book => BOOK;

/** MARK ONE MET. The first mark stands: a second write would re-date a meeting that already
 *  happened, which is the drift `rememberAnxiety` exists to stop on Cedar's side. */
export function rememberCover(area: CoverArea, at: string = new Date().toISOString()): void {
  if (BOOK[area]) return;
  publish({ ...BOOK, [area]: at });
}

/** FORGET THEM ALL — what a drive calls to meet the areas fresh without clearing the rest of the
 *  rig. `Reset state` clears this key by its prefix and needs nothing from here. */
export function forgetCovers(): void {
  publish({});
}

/* ── the hook every area writes one line of ───────────────────────────────────────────────── */

/**
 * OPEN THIS AREA'S COVER ON ITS FIRST OPEN, AND NEVER AGAIN.
 *
 * The decision is made on the first render, from the book as it stands, and the mark is written
 * the moment the cover opens rather than when it closes: a person who meets a cover and reloads
 * the page has met it, and a cover that came back would read as a fault.
 */
export function useAreaCover(area: CoverArea): { isOpen: boolean; close: () => void } {
  const [standing, setStanding] = React.useState(() => !coversMetNow()[area]);
  React.useEffect(() => {
    if (standing) rememberCover(area);
  }, [area, standing]);
  return { isOpen: standing, close: () => setStanding(false) };
}

/* ── the dialog ───────────────────────────────────────────────────────────────────────────── */

export type CoverProps = {
  /** the frame is open by default, so an area that gates it with `useAreaCover` passes nothing */
  isOpen?: boolean;
  /** what the one action and the frame's close control both do */
  onClose: () => void;
};

/** THE FRAME, ONCE, so three covers cannot drift apart. Cedar's `WorkflowDialog` is the frame: it
 *  is centred at the desk and docks as a bottom sheet under 559 px (`PHONE_MAX`), and the picture
 *  runs the full width above the title exactly as it does on `Pay over time`. */
function Cover({ area, isOpen = true, onClose }: CoverProps & { area: CoverArea }) {
  const [css, theme] = useStyletron();
  const text = COVER_TEXT[area];
  const gutter = css({
    padding: theme.sizing.scale800,
    '@media (max-width: 600px)': { padding: theme.sizing.scale600 },
  });
  return <WorkflowDialog isOpen={isOpen} title={text.area} onClose={onClose} flush
    testId={`cover-${area}`} dataProps={{ 'data-cover': area }}
    actions={<Button data-testid={`cover-${area}-act`} onClick={onClose}>{text.act}</Button>}>
    <div className={css({
      height: '100%', minHeight: 0, minWidth: 0, overflowY: 'auto', overflowX: 'hidden',
      overscrollBehavior: 'contain', display: 'grid', gridTemplateRows: 'auto 1fr', alignContent: 'start',
    })}>
      <HeroArtwork kind={area} />
      <div className={gutter} style={{ display: 'grid', gap: theme.sizing.scale500, alignContent: 'start' }}>
        <h3 data-testid={`cover-${area}-title`} style={{ ...theme.typography.HeadingMedium, margin: 0 }}>{text.title}</h3>
        <p data-testid={`cover-${area}-body`} style={{ ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary, margin: 0, maxWidth: '46ch' }}>{text.body}</p>
      </div>
    </div>
  </WorkflowDialog>;
}

/** MONEY, ON ITS FIRST OPEN — the bank account, the payables and the fiado book, named. */
export const MoneyCover = (props: CoverProps) => <Cover area="money" {...props} />;

/** PRODUCTS, ON ITS FIRST OPEN — the catalogue the shop's own purchases built. */
export const ProductsCover = (props: CoverProps) => <Cover area="stock" {...props} />;

/** CUSTOMERS, ON ITS FIRST OPEN — the book of who comes back. */
export const CustomersCover = (props: CoverProps) => <Cover area="customers" {...props} />;

const DIALOG: Record<CoverArea, (props: CoverProps) => React.JSX.Element> = {
  money: MoneyCover,
  stock: ProductsCover,
  customers: CustomersCover,
};

/**
 * THE ONE LINE AN AREA WRITES: `<AreaCover area="money" />` at the top of its own component.
 *
 * It holds the gate and the dialog together so an area cannot wire one without the other — the
 * failure that would show a cover on every visit, or never.
 */
export function AreaCover({ area }: { area: CoverArea }) {
  const cover = useAreaCover(area);
  if (!cover.isOpen) return null;
  const Dialog = DIALOG[area];
  return <Dialog isOpen onClose={cover.close} />;
}

/* ── the referral band, which is two seats and no dialog ──────────────────────────────────── */

/**
 * THE `referrals` SEAT, AS A BAND. Screen 5 of the critical path and Money → `Suppliers you
 * brought` are the two surfaces it serves (ONBOARDING-SPEC.md §8): a full-width picture at the top
 * of the surface, with the surface's own title and rows under it. Its caller owns the corners,
 * because on screen 5 the band is full-bleed and inside Money it sits at the head of a card.
 */
export function ReferralsCover() {
  return <div data-testid="cover-referrals"><HeroArtwork kind="referrals" /></div>;
}
