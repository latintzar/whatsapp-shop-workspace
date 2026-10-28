/* SCREEN 4 · YOUR BUSINESS — `What is your business?`, then its name
 * (ONBOARDING-SPEC.md §0, screen 4).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening): «We shoul ask them if they're a
 * bodega or if they sell to bodegas or if they sell to restaurants», «in the signup we should defo
 * ask for the name of their bodega too».
 *
 * ═══ ONE QUESTION AT A TIME, ON ONE SCREEN ══════════════════════════════════════════════════
 * The kind is three picture TILES; the name is one field over the shop's own pass. They are two
 * PANES of the same screen, so the progress counts one step and the foot stays where it is and
 * only changes its label — `Continue`, then `Save my business` (ONBOARDING-SPEC.md §0, «the frame»).
 *
 * ═══ THE TILES ARE THE SCREEN ═══════════════════════════════════════════════════════════════
 * ⚠ THEY WERE THREE SMALL THUMBNAILS IN BIG EMPTY ROWS, and the third one was a crop of sky. Now
 * each choice is a FULL-WIDTH PICTURE TILE and the three of them share every pixel the words and
 * the act leave, so the screen is three photographs of three trades and a person points at their
 * own. The picture is the tile: an ink scrim rises from its foot, the name of the trade is set in
 * white across the bottom of it, and a ring in the top corner draws a tick when it is chosen.
 *
 * EACH PICTURE'S CROP IS CHOSEN BY LOOKING AT IT (`app/public/bodega-artwork/README.md`):
 *   A bodega              `hero-arrival`    the bodeguera at her glass counter
 *   I sell to bodegas     `hero-referrals`  the delivery man handing a crate across the stall
 *   I sell to restaurants `hero-money`      the fish stall — Lima's pescaderos supply its cevicherías
 *
 * ═══ WHAT A TAP DOES ════════════════════════════════════════════════════════════════════════
 * The picked tile grows a little on `SPRING.press`, its tick DRAWS itself, the other two dim to
 * half, and the screen goes on by itself after a beat — Peter's «auto-advance on single choices»,
 * which is what makes a sign-up feel quick rather than obedient. The act stays live the whole time,
 * so a person who reaches for the button instead is never waiting on the beat.
 *
 * ═══ AND THE NAME IS WRITTEN ONTO THE PASS ══════════════════════════════════════════════════
 * The name pane stands on the ink stage with the shop's own pass on it, its kind already filled in,
 * and the field MIRRORS onto the card as the shop types: the placeholder bar gives way to the name
 * it is being given. That is the whole point of the pass — a person watches their own card get
 * built (ONBOARDING-SPEC.md §0, «THE PASS»).
 *
 * ═══ THE KEYBOARD NEVER COVERS THE ACT ══════════════════════════════════════════════════════
 * `WalkScreen` draws the column to the VISUAL VIEWPORT's own height, so the moment the keyboard
 * opens the screen shortens to the room left and the bar rides on top of it — on iOS, where a
 * fixed bar would sit under the keyboard, and on Android, which resizes. The stage shrinks with it
 * and the pass goes COMPACT, its name line and its place alone, so the card is still there and the
 * act is still on the screen.
 *
 * ═══ THE NAME COMES PREFILLED WHERE THE CONNECTION REPORTED ONE ═════════════════════════════
 * A WhatsApp Business profile carries the business's own name, and `start/connect.tsx` writes it
 * into the walk's draft the moment the account links. Typing it a second time is work the shop has
 * already done.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Input } from 'baseui/input';
import { Store } from 'lucide-react';
import { QuestionScreen, UnderlineInput } from '../mobile/question';
import { markReached } from '../stage';
import { HERO_ROOT } from '../hero-artwork';
import { readDraft, sellsOnward, useWaitlist, writeDraft, type BusinessKind } from './joining';
import { Pass } from './pass';
import {
  DrawnTick, MS, SPRING, WalkAct, WalkQuiet, WalkScreen, goTo, stepsFor, useEntered,
  useStillness, useViewportHeight, tap,
} from './walk';
import { nativeWalk } from './runtime';
import { useWords, type Words } from './words';

/** THE THREE, each with the scene it names and the crop that keeps the person in the frame. The
 *  words are the table's (`start/words.ts`); what stands here is which picture each trade has. */
const KINDS: { id: BusinessKind; says: keyof Words; picture: string; at: string }[] = [
  { id: 'supplier', says: 'kindSupplier', picture: `${HERO_ROOT}hero-referrals.png`, at: '50% 55%' },
  { id: 'bodega', says: 'kindBodega', picture: `${HERO_ROOT}hero-arrival.png`, at: '50% 38%' },
  { id: 'restaurant', says: 'kindRestaurant', picture: `${HERO_ROOT}hero-money.png`, at: '45% 42%' },
];

/** How tall a tile may never be shorter than — three of these and their gaps fit a 740 px phone. */
const TILE_FLOOR = 132;

/** ONE PICTURE TILE — the trade, its name across the foot, and the ring that ticks when chosen. */
function KindTile({ kind, says, picture, at, picked, dimmed, onPick, after, floor }: {
  kind: BusinessKind;
  says: string;
  picture: string;
  at: string;
  picked: boolean;
  dimmed: boolean;
  onPick: () => void;
  after: number;
  floor: number;
}) {
  const [css, theme] = useStyletron();
  const still = useStillness();
  const entered = useEntered(after);
  return (
    <li className={css({ listStyle: 'none', minWidth: 0, minHeight: 0, display: 'grid' })}>
      <button type="button" data-testid={`business-kind-${kind}`} data-picked={picked ? 'yes' : 'open'}
        aria-pressed={picked}
        onClick={() => { tap(still); onPick(); }}
        className={css({
          appearance: 'none',
          position: 'relative',
          display: 'block',
          boxSizing: 'border-box',
          width: '100%',
          minWidth: 0,
          minHeight: `${floor}px`,
          height: '100%',
          padding: 0,
          overflow: 'hidden',
          textAlign: 'left',
          cursor: 'pointer',
          borderRadius: theme.borders.radius400,
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: picked ? theme.colors.borderSelected : 'transparent',
          backgroundColor: theme.colors.backgroundTertiary,
          color: theme.colors.contentInversePrimary,
          opacity: entered ? (dimmed ? 0.5 : 1) : 0,
          transform: entered
            ? (picked ? 'translate3d(0,0,0) scale(1.02)' : 'translate3d(0,0,0) scale(1)')
            : 'translate3d(0,14px,0) scale(0.98)',
          transitionProperty: 'opacity, transform, border-color',
          transitionDuration: still ? '0ms' : `${picked ? MS.press : MS.move}ms`,
          transitionTimingFunction: picked ? SPRING.press : SPRING.glide,
          willChange: 'transform, opacity',
        })}>
        <img src={picture} alt="" width={1024} height={576} decoding="async"
          className={css({
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: at,
            display: 'block',
          })} />
        {/* THE SCRIM — black at the foot, gone by two thirds up, so the name reads on whatever the
            picture happens to put under it. A neutral alpha is geometry rather than brand
            (`app/tools/theme-gate.mjs`). */}
        <span aria-hidden className={css({
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.34) 44%, rgba(0,0,0,0) 76%)',
        })} />
        <span className={css({
          position: 'absolute', left: theme.sizing.scale600, right: theme.sizing.scale900,
          bottom: theme.sizing.scale500,
          ...theme.typography.HeadingSmall,
          color: theme.colors.contentInversePrimary,
          textShadow: '0 1px 12px rgba(0,0,0,0.5)',
          minWidth: 0,
        })}>{says}</span>
        {/* THE RING, TOP RIGHT — open while the choice is open, and the tick drawn into it. */}
        <span aria-hidden className={css({
          position: 'absolute', top: theme.sizing.scale500, right: theme.sizing.scale500,
          display: 'grid', placeItems: 'center',
          width: '32px', height: '32px',
          borderRadius: '50%',
          borderWidth: '2px',
          borderStyle: 'solid',
          boxSizing: 'border-box',
          borderColor: theme.colors.contentInversePrimary,
          backgroundColor: picked ? theme.colors.contentInversePrimary : 'rgba(0,0,0,0.40)',
          color: picked ? theme.colors.contentPrimary : theme.colors.contentInversePrimary,
          boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
          transitionProperty: 'background-color, color',
          transitionDuration: still ? '0ms' : `${MS.press}ms`,
        })}>
          {picked && <DrawnTick size={20} still={still} />}
        </span>
      </button>
    </li>
  );
}

export default function Business({ personName }: { personName?: string } = {}) {
  const [css, theme] = useStyletron();
  const { w } = useWords();
  const still = useStillness();
  const height = useViewportHeight();
  const { standing } = useWaitlist();
  const [draft, setDraft] = React.useState(() => readDraft());
  /* THE PANE THE SCREEN IS ON: the question, then the name. A shop coming back to change its kind
     lands on the question again. */
  const [pane, setPane] = React.useState<'kind' | 'name'>(() => (readDraft().kind ? 'name' : 'kind'));
  const [name, setName] = React.useState(() => readDraft().name);
  const field = React.useRef<HTMLInputElement | null>(null);
  const moving = React.useRef(0);

  React.useEffect(() => { markReached('business'); }, []);
  React.useEffect(() => () => window.clearTimeout(moving.current), []);

  /* THE FIELD TAKES THE CARET the moment its pane arrives, so the keyboard is already up and the
     shop types rather than hunting for the box. */
  React.useEffect(() => {
    if (pane !== 'name') return undefined;
    const timer = window.setTimeout(() => field.current?.focus(), still ? 0 : 260);
    return () => window.clearTimeout(timer);
  }, [pane, still]);

  const pick = (kind: BusinessKind) => {
    setDraft(writeDraft({ ...draft, kind }));
    /* A SINGLE CHOICE GOES ON BY ITSELF, after long enough to see the tick draw. */
    window.clearTimeout(moving.current);
    moving.current = window.setTimeout(() => setPane('name'), still ? 0 : 420);
  };

  const save = () => {
    const written = name.trim();
    if (!written || !draft.kind) return;
    setDraft(writeDraft({ ...draft, name: written }));
    goTo('address');
  };

  const steps = stepsFor(sellsOnward(draft.kind));
  const ready = Boolean(draft.kind) && name.trim().length > 0;
  const entered = useEntered(60);
  /* THE KEYBOARD IS UP when the room left is about 508 px of an 844 px phone. The pass goes
     compact there: its name line and its place, which is what the shop is looking at anyway. */
  const compact = (height ?? 844) < 620;
  const native = nativeWalk() !== null;
  const tileFloor = native && (height ?? 844) <= 600 ? 112 : TILE_FLOOR;

  if (native && pane === 'name') return <QuestionScreen testId="start-business" step={3} icon={<Store size={24} aria-hidden />}
    title={w.nameTitle} back={() => setPane('kind')} next={save} disabled={!ready}>
    <UnderlineInput data-testid="business-name" value={name} autoFocus autoComplete="organization" aria-label={w.nameField}
      maxLength={100} enterKeyHint="next" onChange={(event) => { setName(event.target.value); writeDraft({ ...draft, name: event.target.value }); }} />
  </QuestionScreen>;

  return (
    <WalkScreen
      testId="start-business"
      step="business"
      steps={steps}
      fill={pane === 'kind'}
      /* THE NAME PANE STANDS ON THE SHOP'S OWN PASS, which already carries the kind it just
         chose — and takes the name as it is typed. */
      stage={pane === 'name' ? 'ink' : undefined}
      visual={pane === 'name'
        ? <div data-testid="business-chosen"
          className={css({ display: 'grid', alignContent: 'center', height: '100%', minHeight: 0 })}>
          <Pass
            testId="business-pass"
            name={name}
            kind={draft.kind}
            address={draft.address?.text ?? ''}
            place={standing?.waitlist.place ?? 0}
            reference={standing?.waitlist.referralCode ?? ''}
            yape={draft.yape}
            sample={standing?.source === 'sample' && !compact ? w.sampleSays : ''}
            compact={compact}
          />
        </div>
        : undefined}
      title={pane === 'kind' ? (native && personName ? `${personName}, ${w.kindTitle.charAt(0).toLowerCase()}${w.kindTitle.slice(1)}` : w.kindTitle) : w.nameTitle}
      sentence={pane === 'name' ? w.nameSentence : undefined}
      act={pane === 'kind'
        ? (native ? undefined : <WalkAct testId="business-continue" disabled={!draft.kind}
          onClick={() => { window.clearTimeout(moving.current); setPane('name'); }}>{w.carryOn}</WalkAct>
        )
        : <WalkAct testId="business-save" disabled={!ready} onClick={save}>{w.nameSave}</WalkAct>}
      quiet={pane === 'name'
        ? <WalkQuiet testId="business-change-kind" onClick={() => setPane('kind')}>{w.changeKind}</WalkQuiet>
        : undefined}
    >
      {pane === 'kind'
        ? <ul data-testid="business-kinds" data-picked={draft.kind ?? ''}
          className={css({
            display: 'grid', gridTemplateRows: `repeat(3, minmax(${tileFloor}px, 1fr))`,
            gap: theme.sizing.scale400, margin: 0, padding: 0, minHeight: 0,
            /* the three tiles SPREAD to the foot, sharing every pixel the words leave */
            flexGrow: 1,
          })}>
          {KINDS.map((each, index) => (
            <KindTile key={each.id} kind={each.id} says={w[each.says] as string} picture={each.picture} at={each.at}
              picked={draft.kind === each.id}
              dimmed={Boolean(draft.kind) && draft.kind !== each.id}
              after={80 + index * 70}
              floor={tileFloor}
              onPick={() => pick(each.id)} />
          ))}
        </ul>
        : <div data-testid="business-name-field" className={css({
          display: 'grid', gap: theme.sizing.scale400, minWidth: 0,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translate3d(0,0,0)' : 'translate3d(16px,0,0)',
          transitionProperty: 'opacity, transform',
          transitionDuration: still ? '0ms' : `${MS.move}ms`,
          transitionTimingFunction: SPRING.glide,
        })}>
          <Input inputRef={field} value={name} placeholder={w.namePlaceholder} clearable
            aria-label={w.nameField}
            onChange={(event) => { const value = event.currentTarget.value; setName(value); writeDraft({ ...draft, name: value }); }}
            onKeyDown={(event) => { if (event.key === 'Enter' && ready) save(); }}
            onFocus={(event) => {
              /* THE FIELD PUTS ITSELF IN THE ROOM THE KEYBOARD LEAVES. The column has already
                 shortened by then, so one scroll into view is the whole of it. */
              window.setTimeout(() => event.target.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' }), 260);
            }}
            overrides={{
              Input: { props: { 'data-testid': 'business-name', enterKeyHint: 'done', autoCapitalize: 'words' } },
              Root: { style: { minHeight: '56px' } },
            }} />
        </div>}
    </WalkScreen>
  );
}

export const meta = { id: 'business', title: 'Your business', owner: 'BODEGA-START', panes: false };
