/* SCREEN 6 · YOUR ORDERS, IN THE APP — `Your orders appear here`
 * (ONBOARDING-SPEC.md §0, screen 6).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening): «before that explain that all their
 * orders will appear in the app when they want it, with a little nicely beautifully animated thing
 * shwoing the delivery note in our app in a phone frame».
 *
 * ═══ THE NOTE IS THE REAL ONE ═══════════════════════════════════════════════════════════════
 * Never a drawing of a delivery note: the handset holds THIS SHOP'S OWN BOOK. The sale comes from
 * `bodegaSales` — the same fold Prep and the order detail read — and each line's name is drawn by
 * `document-parts.tsx`'s `LineName`, the one component every surface in this app says what a line
 * is through, on paper and on screen. If the albarán's grammar changes tomorrow, this screen
 * changes with it, because it is not a second copy of it (the house rule: never redraw, lift).
 *
 * ═══ AND IT WRITES ITSELF ═══════════════════════════════════════════════════════════════════
 * The handset slides up, the head lands, and the lines arrive one after another about 90 ms apart
 * — the note being written rather than switched on — and a tick draws under the last of them.
 * Transform and opacity only; stillness prints the whole note at once and keeps still.
 *
 * ═══ AND IT STANDS ON A STAGE ═══════════════════════════════════════════════════════════════
 * A quiet accent wash, full-bleed to the top of the phone, with the handset rising out of the foot
 * of it and running off the bottom edge — a phone held up rather than a thumbnail with white
 * around it. The note it holds is the LONGEST in this shop's book, because a four-line note in a
 * whole phone screen is a picture of an empty app.
 *
 * ═══ WHAT IT CLAIMS ═════════════════════════════════════════════════════════════════════════
 * That orders from the chats become a delivery note the shop can prepare and print. That is what
 * the app does today. Nothing on this screen names a thing that is still planned.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import type { Sale } from '../../cedar/sale';
import type { DayEdits } from '../../cedar/day';
import { LineName } from '../document-parts';
import { BODEGA_CAST, bodegaSales } from '../cast-cedar';
import { useDay } from '../../cedar/day';
import { markReached } from '../stage';
import { readDraft, sellsOnward } from './joining';
import {
  DrawnTick, MS, SPRING, WalkAct, WalkScreen, goTo, stepsFor, useEntered, useStillness,
} from './walk';
import { useWords } from './words';
import { nativeWalk } from './runtime';

/** How far apart the lines land. */
const LINE_MS = 90;

/** THE NOTE THE HANDSET HOLDS — the first sale of this shop's own book that carries enough lines
 *  to read as a delivery note. The book is the same fold Prep reads, over this shop's own day. */
function noteOf(edits: DayEdits): Sale | null {
  try {
    const book = bodegaSales(edits);
    /* THE LONGEST NOTE IN THE BOOK, because the handset is a whole phone screen and a note of four
       lines leaves two thirds of it white — a picture of an empty app on the screen that exists to
       say the app fills itself. Longest, then earliest, so the pick is stable. */
    return [...book].sort((one, two) => two.lines.length - one.lines.length)[0] ?? null;
  } catch {
    return null;
  }
}

/** ONE LINE OF THE NOTE, arriving after the ones above it. */
function NoteLine({ sale, index, still }: { sale: Sale; index: number; still: boolean }) {
  const [css, theme] = useStyletron();
  const line = sale.lines[index];
  const entered = useEntered(360 + index * LINE_MS);
  return (
    <li data-testid="orders-note-line" className={css({
      listStyle: 'none',
      display: 'flex',
      alignItems: 'baseline',
      gap: theme.sizing.scale400,
      minWidth: 0,
      paddingTop: theme.sizing.scale200,
      paddingBottom: theme.sizing.scale200,
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: theme.colors.borderOpaque,
      opacity: entered || still ? 1 : 0,
      transform: entered || still ? 'translate3d(0,0,0)' : 'translate3d(0,8px,0)',
      transitionProperty: 'opacity, transform',
      transitionDuration: still ? '0ms' : '260ms',
      transitionTimingFunction: 'cubic-bezier(.2,.8,.3,1)',
    })}>
      <span className={css({ ...theme.typography.LabelSmall, minWidth: 0, flex: 1, overflowWrap: 'anywhere' })}>
        <LineName line={line} paper />
      </span>
      <span className={css({
        ...theme.typography.LabelSmall, flexShrink: 0, fontVariantNumeric: 'tabular-nums',
      })}>{line.given} {line.unit}</span>
    </li>
  );
}

/** How short the handset may never be on the phone this walk is designed at. */
const HANDSET_FLOOR = 380;

/** THE HANDSET — a phone-shaped frame with the note inside it, sliding up as the screen arrives.
 *
 *  ⚠ IT WAS A SMALL FRAME WITH A BAND OF WHITE UNDER IT. The frame took the note's own height and
 *  stood in the middle of a stage twice as tall, so the screen read as a thumbnail rather than as
 *  a phone. It takes the stage's height now — never under 380 px on a 390 × 844 phone — which is
 *  the shape of the thing it is drawing. */
function Handset({ sale }: { sale: Sale }) {
  const [css, theme] = useStyletron();
  const { w, lang } = useWords();
  const still = useStillness();
  const entered = useEntered(80);
  const head = useEntered(220);
  const shown = sale.lines.slice(0, 8);
  const done = useEntered(360 + shown.length * LINE_MS + 220);
  return (
    <div data-testid="orders-handset" className={css({
      boxSizing: 'border-box',
      display: 'grid',
      justifyItems: 'center',
      alignContent: 'end',
      height: '100%',
      minHeight: 0,
      paddingTop: theme.sizing.scale600,
      paddingLeft: theme.sizing.scale600,
      paddingRight: theme.sizing.scale600,
      overflow: 'hidden',
    })}>
      <div className={css({
        boxSizing: 'border-box',
        width: '268px',
        /* THE FRAME TAKES THE STAGE. It rests ON the foot of the stage rather than floating above
           it, which is what a phone held up to a camera does, and the wash carries on above it. */
        height: '100%',
        minHeight: `${HANDSET_FLOOR}px`,
        maxHeight: '520px',
        alignSelf: 'end',
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        borderTopLeftRadius: theme.borders.radius500,
        borderTopRightRadius: theme.borders.radius500,
        borderWidth: '8px',
        borderBottomWidth: 0,
        borderStyle: 'solid',
        borderColor: theme.colors.contentPrimary,
        backgroundColor: theme.colors.backgroundPrimary,
        boxShadow: '0 18px 44px rgba(0,0,0,0.22)',
        overflow: 'hidden',
        position: 'relative',
        opacity: entered || still ? 1 : 0,
        transform: entered || still ? 'translate3d(0,0,0) scale(1)' : 'translate3d(0,42px,0) scale(0.96)',
        transitionProperty: 'opacity, transform',
        transitionDuration: still ? '0ms' : `${MS.land}ms`,
        transitionTimingFunction: SPRING.land,
      })}>
        {/* THE NOTE'S OWN HEAD: whose order it is and which day it is for. */}
        <div className={css({
          display: 'grid', gap: '2px',
          paddingTop: theme.sizing.scale500, paddingBottom: theme.sizing.scale400,
          paddingLeft: theme.sizing.scale500, paddingRight: theme.sizing.scale500,
          borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderOpaque,
          backgroundColor: theme.colors.backgroundSecondary,
          opacity: head || still ? 1 : 0,
          transitionProperty: 'opacity',
          transitionDuration: still ? '0ms' : '260ms',
        })}>
          <span data-testid="orders-note-customer" className={css({ ...theme.typography.LabelMedium, overflowWrap: 'anywhere' })}>{nativeWalk() ? (lang === 'es' ? 'Pedido de ejemplo' : 'Example order') : sale.customer.name}</span>
          <span className={css({ ...theme.typography.LabelXSmall, color: theme.colors.contentSecondary })}>
            {sale.deliveryDay} · {sale.number}
          </span>
        </div>
        <div className={css({
          display: 'grid', alignContent: 'start', gap: theme.sizing.scale500,
          padding: theme.sizing.scale500, minWidth: 0, minHeight: 0, overflow: 'hidden',
        })}>
          <ul data-testid="orders-note" data-lines={shown.length}
            className={css({ display: 'grid', margin: 0, padding: 0, gap: 0, minWidth: 0 })}>
            {shown.map((line, index) => <NoteLine key={line.id} sale={sale} index={index} still={still} />)}
          </ul>
          {/* THE NOTE FINISHES ITSELF — the tick draws UNDER THE LAST LINE, in the flow, because
              the frame's foot runs off the bottom of the stage and a state pinned there would be
              the one thing the stage cut in half. */}
          <div className={css({
            display: 'flex', alignItems: 'center', gap: theme.sizing.scale300,
            color: theme.colors.contentPrimary,
            opacity: done || still ? 1 : 0,
            transform: done || still ? 'translate3d(0,0,0)' : 'translate3d(0,6px,0)',
            transitionProperty: 'opacity, transform',
            transitionDuration: still ? '0ms' : '300ms',
          })}>
            {(done || still) && <DrawnTick size={18} still={still} />}
            <span className={css({ ...theme.typography.LabelSmall })}>{w.ordersReady}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [, theme] = useStyletron();
  const { w } = useWords();
  const [draft] = React.useState(() => readDraft());
  const edits = useDay(BODEGA_CAST.sector);
  const sale = React.useMemo(() => noteOf(edits), [edits]);

  React.useEffect(() => { markReached('orders'); }, []);

  const steps = stepsFor(sellsOnward(draft.kind));

  return (
    <WalkScreen
      testId="start-orders"
      step="orders"
      steps={steps}
      /* A QUIET ACCENT WASH, because what stands on this stage is a drawing of the product rather
         than a photograph or the shop's own card (`walk.tsx`, `stagePaint`). */
      stage="paper"
      visual={sale ? <Handset sale={sale} /> : <span style={{ height: theme.sizing.scale1000 }} />}
      title={w.ordersTitle}
      sentence={w.ordersSentence}
      act={<WalkAct testId="orders-next" onClick={() => goTo(sellsOnward(readDraft().kind) ? 'owed' : 'referrals')}>{w.ordersNext}</WalkAct>}
    />
  );
}

export const meta = { id: 'orders', title: 'Your orders', owner: 'BODEGA-START', panes: false };
