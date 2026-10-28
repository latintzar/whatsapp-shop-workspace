/* THE WALK'S ONE SHELL AND ITS MOTION — every screen of the sign-up stands in it
 * (ONBOARDING-SPEC.md §0).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening), verbatim: «always make it super
 * visual usually with visual top and message at the bottom in these», «buttons ideally at the
 * bottom, hyper optimised shit», «follow best cnventions from base», «if should be high excitement
 * the whole time and really feel liek they're joinging something», and the bar this file is judged
 * against: «has tob e dating app level viral and exciting process and have all the animatiosn like
 * we said. remember. super key».
 *
 * So one anatomy carries all ten screens, and a screen only says what is its own:
 *
 *   ┌──────────────────────────────┐
 *   │▁▁▁▁▂▂▂░░░░  the progress     │  slim, drawn OVER the stage in the stage's own ink
 *   │                              │
 *   │         THE STAGE            │  full-bleed, floored at 44% of the phone, taking
 *   │      a picture · the pass    │  every pixel the words and the act leave
 *   │      a handset · a map       │
 *   ├──────────────────────────────┤
 *   │  Title                       │  one line, sentence case, naming the thing
 *   │  One sentence.               │  at most one
 *   │  (the screen's own rows)     │
 *   ├──────────────────────────────┤
 *   │ [   the one act, 56 px    ]  │  anchored at the foot, above the home indicator
 *   │       quiet second act       │  at most one, and quiet
 *   └──────────────────────────────┘
 *
 * ═══ THE FOOT IS ANCHORED, AND THE KEYBOARD NEVER COVERS IT ═════════════════════════════════
 * Two of these screens carry a field, and on a phone the keyboard is half the screen. The column
 * is drawn to the VISUAL VIEWPORT's own height rather than to `100vh`, so the moment the keyboard
 * opens the screen shortens to the room that is left and the act stays on top of it — which is
 * what iOS Safari does NOT do for a `position: fixed` bar (it leaves it under the keyboard) and
 * what Android does by resizing. One rule, read from `window.visualViewport`, covers both.
 *
 * ═══ THE MIDDLE SCROLLS, THE FOOT AND THE PROGRESS STAY ═════════════════════════════════════
 * The column is a grid of three rows — progress · surface · foot — and the surface is the only one
 * that scrolls. A shopkeeper never has to find the button: it is where the thumb already is. The
 * foot itself never moves between screens and never animates: only its label changes, so the act
 * reads as ONE bar the whole walk rides on.
 *
 * ═══ THE MOVEMENT IS QUICK, DIRECTIONAL AND INTERRUPTIBLE ═══════════════════════════════════
 * BOTH HALVES OF THE SHARED AXIS ARE DRAWN: the screen being left slides 32 px the way the walk is
 * going and fades over `MS.leave`, and only then does the address change and the next screen arrive
 * from the other side on a spring sampled into a CSS `linear()` curve (`springCurve` below, `goTo`
 * above). No animation library, and each half is one transform-and-opacity transition on a mounted
 * element, so a person who presses twice is never waiting on an animation to finish.
 * `prefers-reduced-motion` skips the exit and turns every movement into a plain fade.
 *
 * ═══ THE RULES OF THE MOTION (ONBOARDING-SPEC.md §0) ════════════════════════════════════════
 * Transform and opacity only; nothing blocks a tap (every decorative layer is
 * `pointer-events: none`); nothing loops for ever except ONE gentle idle a screen — the pass's
 * two-degree tilt, the pin's pulse — and a spring is a sampled `linear()` curve or the Web
 * Animations API, never a dependency.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { ChevronLeft } from 'lucide-react';
import { DOT_TILE, YAPE, dots } from '../../../rocoto-theme';
import { nativeWalk } from './runtime';

/* ── springs, without a library ───────────────────────────────────────────────────────────── */

/**
 * A DAMPED SPRING, SAMPLED INTO CSS's OWN `linear()` EASING.
 *
 * `cubic-bezier` cannot overshoot and settle; a spring can, and that settle is what makes a bar
 * fill or a pin drop read as a physical thing rather than a tween. CSS `linear()` takes a list of
 * samples, so the spring is integrated here once at module load — about forty numbers — and the
 * result is a plain string every transition can use. No runtime cost per animation, no dependency.
 */
export function springCurve(stiffness: number, damping: number, mass = 1, samples = 44): string {
  const dt = 1 / 240;
  let position = 0;
  let velocity = 0;
  const out: number[] = [];
  /* the curve runs for its whole settling time, then is resampled evenly across `samples` */
  const path: number[] = [];
  for (let step = 0; step < 240 * 2; step += 1) {
    const force = stiffness * (1 - position) - damping * velocity;
    velocity += (force / mass) * dt;
    position += velocity * dt;
    path.push(position);
    if (step > 24 && Math.abs(1 - position) < 0.001 && Math.abs(velocity) < 0.01) break;
  }
  for (let index = 0; index < samples; index += 1) {
    const at = Math.round((index / (samples - 1)) * (path.length - 1));
    out.push(Math.round(path[at] * 10000) / 10000);
  }
  out[0] = 0;
  out[out.length - 1] = 1;
  return `linear(${out.join(',')})`;
}

/** THE WALK'S THREE SPRINGS, named for what they carry. */
export const SPRING = {
  /** a screen arriving, and the progress filling: settles once, barely overshoots */
  glide: springCurve(170, 26),
  /** a thing that lands — a pin, a QR thumbnail, a card: a visible bounce */
  land: springCurve(260, 18),
  /** a press answering the finger: fast, no overshoot to speak of */
  press: springCurve(520, 36),
} as const;

export const MS = { move: 300, fill: 520, land: 620, press: 140, leave: 130 } as const;

/* ── the walk, in order ───────────────────────────────────────────────────────────────────── */

/** THE TEN SCREENS, in the order ONBOARDING-SPEC.md §0 walks them. The file name is the route
 *  (`App.tsx`), so this list and `start/*.tsx` say the same thing. */
export const WALK = [
  'arrival', 'connect', 'waitlist', 'business', 'address', 'orders', 'yape', 'owed', 'referrals', 'done',
] as const;
export type WalkStep = (typeof WALK)[number];

/** A SCREEN WEARING THE WALK'S ANATOMY that is NOT one of the ten: the status page the buddy's
 *  first message links to (`start/lista.tsx`), which is the walk's own idiom seen from outside the
 *  walk — the same stage, the same pass, the same anchored act, and no progress row, because
 *  nobody standing on it is part-way through anything. */
export type ScreenId = WalkStep | 'lista';

/** THE LAST STEPS — what the progress counts. The celebration starts them («Confirm details»), so
 *  the bar begins on the screen after it and the shop watches a short row fill up rather than a
 *  long one start. `owed` stands only for a business that sells to bodegas or to restaurants, so
 *  the denominator is the walk this shop is actually on. */
/* YAPE LEFT THE WALK (Peter, 20 September, night: «the part about connecting their yape can come
   from a message the buddy sends them for now»). `#/start/yape` still opens — the status page the
   buddy links to carries it — and the sign-up is one step shorter. */
export const LAST_STEPS: WalkStep[] = ['business', 'address', 'orders', 'owed', 'referrals', 'done'];

export const stepsFor = (withOwed: boolean): WalkStep[] =>
  nativeWalk() ? ['business', 'address'] : LAST_STEPS.filter((step) => withOwed || step !== 'owed');

/** The address of a step. */
export const walkHash = (step: WalkStep): string => `#/start/${step}`;

/** Which way the walk last moved, read by the screen that mounts next. */
const DIRECTION: { from: WalkStep; back: boolean } = { from: 'arrival', back: false };

/** The attribute the outgoing screen's own surface is found by, so the exit below never needs a
 *  ref threaded through ten screens. */
export const SURFACE_MARK = 'data-walk-surface';

/** the exit in flight, so a shop pressing twice moves once */
let leaving = 0;

/**
 * MOVE ON — AND THE SCREEN BEING LEFT ACTUALLY LEAVES.
 *
 * ⚠ THE SHARED AXIS HAD ONE HALF OF ITSELF. The arriving screen slid in from the right and the
 * outgoing one simply VANISHED on the same frame, because the route swap unmounts it — so the
 * movement read as a cut with a slide stuck on the end of it rather than as two screens passing
 * each other. The exit is therefore taken BEFORE the address changes: the live surface is moved
 * 32 px the way the walk is going and faded, and the hash follows `MS.leave` later, by which time
 * the eye has seen the screen go. Forward leaves left and back leaves right, which is the same
 * axis the entrance rides.
 *
 * It is written on the element rather than held in state on purpose: the component that owns that
 * surface is about to be unmounted, so a re-render of it is work nobody will see. Stillness skips
 * the whole thing and changes the address at once.
 */
export function goTo(step: WalkStep) {
  DIRECTION.back = WALK.indexOf(step) < WALK.indexOf(DIRECTION.from);
  DIRECTION.from = step;
  const address = walkHash(step);
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const surface = document.querySelector(`[${SURFACE_MARK}]`) as HTMLElement | null;
  if (still || !surface) { window.location.hash = address; return; }
  surface.style.transitionDuration = `${MS.leave}ms`;
  surface.style.transitionTimingFunction = 'cubic-bezier(.4,0,1,1)';
  surface.style.transform = `translate3d(${DIRECTION.back ? '' : '-'}32px,0,0)`;
  surface.style.opacity = '0';
  window.clearTimeout(leaving);
  leaving = window.setTimeout(() => { window.location.hash = address; }, MS.leave);
}

/* ── THE NEXT STEP'S CHUNK, FETCHED BEFORE THE ACT IS PRESSED ─────────────────────────────────
 * Every step of the walk is its own lazily-loaded chunk (`App.tsx`), so the first thing a tap did
 * on a slow connection was WAIT for a file. The glob here names the same modules `App.tsx` names,
 * and a module fetched through either one is the same entry in the browser's own registry — so
 * warming it here means the component `React.lazy` asks for is already resolved by the time the
 * shop presses. It runs a beat after the screen arrives, so it never competes with the pictures
 * and the fields of the screen the shop is actually looking at. */
const STEP_MODULES = import.meta.glob('./*.tsx') as Record<string, () => Promise<unknown>>;

export function useWarmNext(step: ScreenId, steps?: WalkStep[]): void {
  React.useEffect(() => {
    const order: readonly ScreenId[] = steps && steps.includes(step as WalkStep) ? steps : WALK;
    const at = order.indexOf(step);
    const next = at >= 0 ? order[at + 1] : undefined;
    if (!next) return undefined;
    const timer = window.setTimeout(() => { void STEP_MODULES[`./${next}.tsx`]?.(); }, 220);
    return () => window.clearTimeout(timer);
  }, [step, steps]);
}

/** GO BACK ONE, skipping the steps this shop is not walking. */
export function goBack(step: WalkStep, steps: WalkStep[]) {
  const at = steps.indexOf(step);
  if (at > 0) { goTo(steps[at - 1]); return; }
  goTo(step === 'waitlist' ? 'arrival' : 'waitlist');
}

/* ── the room the keyboard leaves ─────────────────────────────────────────────────────────── */

/**
 * THE HEIGHT THE SCREEN ACTUALLY HAS. `window.visualViewport.height` is the room left once the
 * keyboard is up, on every browser that has one; a browser with none answers `null` and the column
 * takes `100dvh`, which is the same number.
 */
export function useViewportHeight(): number | null {
  const [height, setHeight] = React.useState<number | null>(() => window.visualViewport?.height ?? null);
  React.useEffect(() => {
    const port = window.visualViewport;
    if (!port) return undefined;
    const read = () => setHeight(port.height);
    read();
    port.addEventListener('resize', read);
    port.addEventListener('scroll', read);
    return () => {
      port.removeEventListener('resize', read);
      port.removeEventListener('scroll', read);
    };
  }, []);
  return height;
}

/**
 * THE RIG'S OWN DOOR — `?dev=1`.
 *
 * The walk carries one control that belongs to whoever is REVIEWING it rather than to a shop:
 * `Reset state`, which disconnects the account and sweeps this browser. A shopkeeper opening the
 * link should never see it, so it stands behind the same shape of flag the rest of this prototype
 * already uses for its own doors (`?theatre=1` on the chats, `?faces=1` on Products).
 */
export const devRig = (search: string = window.location.search): boolean => {
  try { return new URLSearchParams(search).get('dev') === '1'; } catch { return false; }
};

/** Whether this person asked their system for less movement. Read once per screen. */
export function useStillness(): boolean {
  const [still, setStill] = React.useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  React.useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;
    const read = () => setStill(query.matches);
    query.addEventListener?.('change', read);
    return () => query.removeEventListener?.('change', read);
  }, []);
  return still;
}

/**
 * MOUNTED, THEN SETTLED. The element renders in its offset state and is flipped on the next paint,
 * so every entrance is ONE property change the browser owns and can interrupt. `after` staggers a
 * row against its neighbours (the suggestion rows arrive 30 ms apart).
 */
export function useEntered(after = 0): boolean {
  const still = useStillness();
  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    if (after <= 0) {
      const frame = window.requestAnimationFrame(() => setEntered(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const timer = window.setTimeout(() => setEntered(true), after);
    return () => window.clearTimeout(timer);
  }, [after]);
  return still ? true : entered;
}

/** THE PHONE'S OWN ANSWER TO A PRESS — 10 ms where the browser allows it, and silence elsewhere.
 *  Stillness turns it off with the rest of the movement. */
export function tap(still: boolean, ms = 10): void {
  if (still) return;
  const native = nativeWalk();
  if (native) { native.tap(); return; }
  try { window.navigator.vibrate?.(ms); } catch { /* a browser that refuses simply stays quiet */ }
}

/* ── THE STAGE ────────────────────────────────────────────────────────────────────────────────
 *
 * Peter: «always make it super visual usually with visual top and message at the bottom».
 *
 * ⚠ SIX SCREENS WERE A SMALL OBJECT FLOATING IN A WHITE VOID. The upper part took its room, but it
 * took it as PAPER: a number, a chip, a handset standing in the middle of nothing, with the phone's
 * own white running edge to edge around them. Nothing read as a place the shop had arrived at.
 *
 * A STAGE IS THE UPPER PART OWNING ITS ROOM AS A SURFACE. It is full-bleed — edge to edge and up to
 * the very top of the screen, with the progress row drawn OVER it rather than above it — it holds a
 * floor of the screen's height so it can never collapse to a band, and it absorbs every pixel the
 * words and the act leave, so there is no white between the picture and the sentence to begin with.
 *
 * FOUR TONES, AND A SCREEN ASKS FOR ONE BY NAME:
 *   ink      the walk's own dark card ground — the pass lands on it (waitlist, name, referrals, done)
 *   yape     Yape's own purple, the named brand exception, asked for by `start/yape.tsx` ALONE
 *   paper    a quiet accent wash, for a stage holding a drawing of the product (the orders handset)
 *   picture  a photograph covering the room, the words on paper under it (the arrival)
 */
export type StageTone = 'ink' | 'yape' | 'paper' | 'picture';

/**
 * THE FLOOR THE STAGE NEVER GOES UNDER — 44% of a 390 × 844 phone, 38% of a 360 × 740 one.
 *
 * It is read from the VISUAL VIEWPORT rather than from `100dvh`, so the moment a keyboard opens the
 * stage shrinks with the room instead of holding 44% of a screen half of which is a keyboard: the
 * field and the act win that argument, and the screen that carries a field says what it draws in
 * the room that is left (`start/business.tsx`'s compact pass).
 */
export function stageFloor(height: number): number {
  if (height >= 800) return Math.round(height * 0.44);
  if (height >= 680) return Math.round(height * 0.38);
  return Math.round(height * 0.22);
}

type Paint = {
  backgroundColor: string;
  color: string;
  backgroundImage?: string;
  backgroundSize?: string;
};

/** WHAT A TONE PAINTS. Two theme tokens a tone, mixed rather than written, so `?theme=proof` moves
 *  every stage in the walk and `app/tools/theme-gate.mjs` finds no paint of its own here. Yape's
 *  purple is the one brand colour, and it comes from the theme's own named exception. */
export function stagePaint(tone: StageTone, theme: ReturnType<typeof useStyletron>[1]): Paint {
  if (tone === 'ink') {
    return {
      backgroundColor: theme.colors.backgroundInversePrimary,
      color: theme.colors.contentInversePrimary,
      /* the brand's dotted paper, at a whisper: the ground has a texture rather than a pattern */
      backgroundImage: dots(`color-mix(in srgb, ${theme.colors.contentInversePrimary} 13%, ${theme.colors.backgroundInversePrimary})`),
      backgroundSize: DOT_TILE,
    };
  }
  if (tone === 'yape') {
    return { backgroundColor: YAPE.purple, color: YAPE.onPurple };
  }
  if (tone === 'paper') {
    return {
      backgroundColor: theme.colors.backgroundSecondary,
      color: theme.colors.contentPrimary,
      backgroundImage: `radial-gradient(120% 86% at 50% 8%,`
        + ` color-mix(in srgb, ${theme.colors.accent} 13%, ${theme.colors.backgroundPrimary}) 0%,`
        + ` ${theme.colors.backgroundSecondary} 92%)`,
    };
  }
  return { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.contentPrimary };
}

/** A DARK STAGE CARRIES THE PROGRESS IN ITS OWN INK. The row is drawn over the stage, so on ink and
 *  on Yape's purple it takes the tone's own contrast pair; on paper and over a picture it keeps the
 *  walk's ordinary ink. */
const progressInk = (tone: StageTone | undefined, theme: ReturnType<typeof useStyletron>[1]):
{ track: string; fill: string } => {
  if (tone === 'ink') {
    return {
      track: `color-mix(in srgb, ${theme.colors.contentInversePrimary} 26%, ${theme.colors.backgroundInversePrimary})`,
      fill: theme.colors.contentInversePrimary,
    };
  }
  if (tone === 'yape') {
    return {
      track: `color-mix(in srgb, ${YAPE.onPurple} 30%, ${YAPE.purple})`,
      fill: YAPE.onPurple,
    };
  }
  return { track: theme.colors.backgroundTertiary, fill: theme.colors.contentPrimary };
};

/* ── the progress ─────────────────────────────────────────────────────────────────────────── */

/** THE SLIM BAR. One segment a step, the walked ones full, the one being walked filling on a
 *  spring — and the whole row is four pixels tall, because it is a reassurance rather than a
 *  subject. A short row of segments is what makes «the last steps» look short. */
export function WalkProgress({ step, steps, tone }: {
  step: ScreenId;
  steps: WalkStep[];
  /** the stage it is drawn over, where there is one */
  tone?: StageTone;
}) {
  const [css, theme] = useStyletron();
  const still = useStillness();
  const entered = useEntered();
  /* A SCREEN THE ROW DOES NOT COUNT draws no row at all, which is what a place off the list means
     here — the celebration, and the status page. */
  const at = steps.indexOf(step as WalkStep);
  const ink = progressInk(tone, theme);
  if (at < 0) return null;
  return (
    <div data-testid="walk-progress" data-step={step} data-at={at + 1} data-of={steps.length}
      role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={at + 1}
      aria-label="Joining Rocoto"
      className={css({
        display: 'grid',
        gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
        gap: theme.sizing.scale200,
        paddingTop: theme.sizing.scale500,
        paddingRight: theme.sizing.scale600,
        paddingBottom: theme.sizing.scale300,
        paddingLeft: theme.sizing.scale600,
        /* over a stage the row rides on the stage's own ground; on paper it carries its own */
        backgroundColor: tone ? 'transparent' : theme.colors.backgroundPrimary,
      })}>
      {steps.map((each, index) => (
        <span key={each} data-segment={each} data-filled={index <= at ? 'yes' : 'open'}
          className={css({
            height: '4px',
            borderRadius: theme.borders.radius100,
            backgroundColor: ink.track,
            overflow: 'hidden',
          })}>
          <span aria-hidden className={css({
            display: 'block',
            height: '100%',
            backgroundColor: ink.fill,
            transformOrigin: 'left center',
            transform: index < at || (index === at && (entered || still)) ? 'scaleX(1)' : 'scaleX(0)',
            ...(index === at && !still
              ? { transitionProperty: 'transform', transitionDuration: `${MS.fill}ms`, transitionTimingFunction: SPRING.glide }
              : {}),
          })} />
        </span>
      ))}
    </div>
  );
}

/* ── the acts ─────────────────────────────────────────────────────────────────────────────── */

/** EVERY PRESS IS ANSWERED. The button scales to .97 on a spring under the finger and comes back,
 *  and the phone buzzes for 10 ms where it can — the two things that make a tap feel taken. */
function usePress(): { pressed: boolean; handlers: Record<string, () => void> } {
  const still = useStillness();
  const [pressed, setPressed] = React.useState(false);
  const down = React.useCallback(() => { setPressed(true); tap(still); }, [still]);
  const up = React.useCallback(() => setPressed(false), []);
  return {
    pressed: pressed && !still,
    handlers: { onPointerDown: down, onPointerUp: up, onPointerCancel: up, onPointerLeave: up },
  };
}

/** THE ONE ACT — 56 px, full width, at the foot, a verb and its object. */
export function WalkAct({ children, onClick, testId, disabled = false, href, isLoading = false, target }: {
  children: React.ReactNode;
  onClick?: () => void;
  testId: string;
  disabled?: boolean;
  href?: string;
  isLoading?: boolean;
  target?: string;
}) {
  const { pressed, handlers } = usePress();
  return (
    <Button kind={KIND.primary} size={SIZE.large} onClick={onClick} disabled={disabled} href={href}
      target={target} isLoading={isLoading}
      overrides={{ BaseButton: {
        props: { 'data-testid': testId, ...handlers },
        style: {
          minHeight: '56px',
          width: '100%',
          whiteSpace: 'normal',
          transform: pressed ? 'scale(0.97)' : 'scale(1)',
          transitionProperty: 'transform, background-color',
          transitionDuration: `${MS.press}ms`,
          transitionTimingFunction: SPRING.press,
        },
      } }}>
      {children}
    </Button>
  );
}

/** THE QUIET SECOND WAY ON — at most one to a screen, and never louder than the act above it. */
export function WalkQuiet({ children, onClick, testId, href, target }: {
  children: React.ReactNode;
  onClick?: () => void;
  testId: string;
  href?: string;
  target?: string;
}) {
  const { pressed, handlers } = usePress();
  return (
    <Button kind={KIND.tertiary} size={SIZE.default} onClick={onClick} href={href} target={target}
      overrides={{ BaseButton: {
        props: { 'data-testid': testId, ...handlers },
        style: {
          minHeight: '48px',
          width: '100%',
          whiteSpace: 'normal',
          transform: pressed ? 'scale(0.97)' : 'scale(1)',
          transitionProperty: 'transform',
          transitionDuration: `${MS.press}ms`,
          transitionTimingFunction: SPRING.press,
        },
      } }}>
      {children}
    </Button>
  );
}

/* ── the screen ───────────────────────────────────────────────────────────────────────────── */

export type WalkScreenProps = {
  testId: string;
  /** which of the ten this is — the progress and the movement read it — or the status page, which
   *  wears the same anatomy and counts no steps */
  step: ScreenId;
  /** the steps the bar counts, or nothing where the screen carries no bar */
  steps?: WalkStep[];
  /** THE UPPER PART: a picture, a map, a handset, a number set large. It claims the room that is
   *  left once the words and the act have theirs. */
  visual?: React.ReactNode;
  /** THE STAGE THE VISUAL STANDS ON — full-bleed, floored, and painted in one of four tones. A
   *  screen whose upper part is a surface rather than a drawing asks for one by name. */
  stage?: StageTone;
  /** the visual takes the WHOLE screen, with the words and the act over it (the map) */
  fullBleed?: boolean;
  title?: React.ReactNode;
  /** at most one */
  sentence?: React.ReactNode;
  /** the screen's own rows, under the sentence */
  children?: React.ReactNode;
  /** the one act */
  act?: React.ReactNode;
  /** the quiet second way on */
  quiet?: React.ReactNode;
  /** a line above the act — a state, never a third act */
  note?: React.ReactNode;
  /** THE SCREEN'S OWN ROWS TAKE THE ROOM THAT IS LEFT — a list that should spread to the foot
   *  rather than end halfway down it (the three choices, the suggestions, the likely list). */
  fill?: boolean;
  /** a layer over everything, drawn last and taking no press — the confetti */
  over?: React.ReactNode;
};

export function WalkScreen({
  testId, step, steps, visual, stage, fullBleed = false, title, sentence, children, act, quiet, note,
  over, fill = false,
}: WalkScreenProps) {
  const [css, theme] = useStyletron();
  const height = useViewportHeight();
  const still = useStillness();
  const entered = useEntered();
  const back = DIRECTION.back;
  useWarmNext(step, steps);
  /* THE STAGE IS FULL-BLEED AND REACHES THE TOP, so the progress row leaves the flow and is drawn
     over it; a screen with no stage keeps the row above the surface as it always was. */
  const staged = stage !== undefined && visual !== undefined && !fullBleed;
  const floor = staged ? stageFloor(height ?? 844) : 0;
  const paint = staged ? stagePaint(stage, theme) : null;
  const native = nativeWalk() !== null;
  /* The authenticated Android walk scrolls as one document, including its act. Browser onboarding
     keeps the fixed foot used by the established desktop layout. */
  const inlineNativeAct = native ? act : undefined;
  const inlineNativeQuiet = native ? quiet : undefined;
  const fixedAct = native ? undefined : act;
  const fixedQuiet = native ? undefined : quiet;
  const nativeFullBleedActions = native && fullBleed && Boolean(inlineNativeAct || inlineNativeQuiet || note);
  const nativeBack = native && steps && steps.indexOf(step as WalkStep) > 0;

  return (
    <section
      data-testid={testId}
      data-walk-step={step}
      data-walk-stage={stage ?? 'paper-screen'}
      className={css({
        position: 'relative',
        display: 'grid',
        gridTemplateRows: staged ? 'minmax(0, 1fr) auto' : 'auto minmax(0, 1fr) auto',
        height: height ? `${height}px` : '100dvh',
        minHeight: height ? `${height}px` : '100dvh',
        width: '100%',
        minWidth: 0,
        backgroundColor: theme.colors.backgroundPrimary,
        overflow: 'hidden',
      })}
    >
      {staged
        ? (steps ? <div className={css({
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, pointerEvents: 'none',
        })}><WalkProgress step={step} steps={steps} tone={stage} /></div> : null)
        : <div>
          {steps && <WalkProgress step={step} steps={steps} />}
          {nativeBack && <div className={css({ paddingLeft: theme.sizing.scale300, paddingRight: theme.sizing.scale300 })}>
            <Button kind={KIND.tertiary} size={SIZE.compact} aria-label="Volver" onClick={() => goBack(step as WalkStep, steps)}
              overrides={{ BaseButton: { style: { minWidth: '44px', minHeight: '44px', paddingLeft: 0, paddingRight: 0 } } }}>
              <ChevronLeft size={24} aria-hidden />
            </Button>
          </div>}
        </div>}

      <div
        data-testid={`${testId}-surface`}
        {...{ [SURFACE_MARK]: 'yes' }}
        className={css({
          position: 'relative',
          minHeight: 0,
          minWidth: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          display: 'grid',
          /* ── THE PICTURE TAKES THE ROOM; THE WORDS SIT UNDER IT ─────────────────────────────
             Peter: «always make it super visual usually with visual top and message at the bottom
             in these».

             ⚠ THE ROWS WERE THE OTHER WAY ROUND, AND IT LEFT A HOLE. The picture's row took its
             own natural height at the top and the words were pushed to the bottom of the room,
             so on six of the ten screens a band of empty white stood between them — 309 px of a
             844 px phone on the waitlist celebration and on the Yape screen, which are the two
             moments that are supposed to land. Now the PICTURE'S row is the elastic one and the
             words take exactly their own height beneath it: the visual grows into whatever the
             words leave, and a number set large or a wash reads as a full upper part rather than
             as a small thing with a void under it. The words' row is `auto`, so a short room (the
             keyboard is up) keeps every word and the surface scrolls, which is what it always
             did. A screen carrying rows that should spread instead asks for `fill`. */
          gridTemplateRows: fullBleed
            ? 'minmax(0, 1fr)'
            : native && visual !== undefined
              ? 'minmax(130px, min(40vh, 320px)) auto'
            : staged
              /* THE STAGE HOLDS ITS FLOOR AND TAKES EVERYTHING THE WORDS LEAVE. Where the words
                 are longer than the room that is left — the arrival's own paragraph on a 740 px
                 phone — the surface scrolls under the foot, which stays where it is. */
              ? `minmax(${floor}px, 1fr) auto`
              : fill
                ? (visual === undefined ? 'minmax(0, 1fr)' : 'auto minmax(0, 1fr)')
                : (visual === undefined ? 'auto' : 'minmax(0, 1fr) auto'),
          alignContent: 'stretch',
          opacity: entered ? 1 : 0,
          transform: entered || still ? 'translate3d(0,0,0)' : `translate3d(${back ? '-' : ''}24px,0,0)`,
          transitionProperty: 'opacity, transform',
          transitionDuration: still ? '120ms' : `${MS.move}ms`,
          transitionTimingFunction: SPRING.glide,
          willChange: 'transform, opacity',
        })}
      >
        {visual !== undefined && (
          <div data-testid={`${testId}-visual`} data-stage={stage ?? ''} className={css({
            /* ⚠ STATIC WHEN IT IS IN FLOW. A `position: relative` picture paints ABOVE the static
               words that follow it whatever the DOM order says, and on a short screen it laid
               itself over the title. In flow it is static and the words win, as they should. A
               STAGE is relative, because the burst and the progress are drawn on it. */
            position: fullBleed ? 'absolute' : staged ? 'relative' : 'static',
            inset: fullBleed ? 0 : 'auto',
            overflow: fullBleed ? 'visible' : 'hidden',
            minWidth: 0,
            minHeight: 0,
            display: 'grid',
            /* ONE ROW, TAKING THE WHOLE BOX. The child is handed the room rather than centred in
               it, so a picture covers it, a wash reaches its edges, and a block that wants to sit
               in the middle says so itself with its own `alignContent: center`. */
            gridTemplateRows: 'minmax(0, 1fr)',
            alignContent: 'stretch',
            justifyItems: 'stretch',
            ...(paint ?? {}),
            /* THE ROW OVER THE STAGE HAS TO CLEAR THE PROGRESS. A picture covers the whole room
               and the bar rides on it; every other tone keeps its content under the bar. */
            ...(staged && steps && stage !== 'picture' ? { paddingTop: theme.sizing.scale800 } : {}),
          })}>
            {visual}
            {/* THE BURST IS THE STAGE'S, NEVER THE SCREEN'S (ONBOARDING-SPEC.md §0: «never over
                the button»). Drawn inside the stage it is clipped to it, so the confetti rains on
                the picture and the words and the act underneath stay clean. */}
            {staged && over && <div aria-hidden data-testid={`${testId}-over`} className={css({
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
            })}>{over}</div>}
          </div>
        )}
        {(title || sentence || children || (native && (inlineNativeAct || inlineNativeQuiet || note))) && (
          <div className={css({
            position: 'relative',
            display: 'grid',
            /* the words' row is exactly their own height now, under the picture that took the rest */
            alignSelf: 'stretch',
            /* WITH `fill` THE BLOCK IS EXACTLY TWO ROWS: the words, then the screen's own rows
               taking everything they leave. Two rows rather than three, because a screen with no
               sentence would otherwise put its list in the row the sentence was going to have and
               the rows would stop halfway down the screen. */
            gridTemplateRows: fill && !native
              ? (title || sentence ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)')
              : undefined,
            gap: theme.sizing.scale500,
            minWidth: 0,
            minHeight: 0,
            alignContent: fill && !native ? 'stretch' : 'start',
            paddingTop: theme.sizing.scale700,
            paddingRight: theme.sizing.scale600,
            paddingBottom: theme.sizing.scale600,
            paddingLeft: theme.sizing.scale600,
          })}>
            {(title || sentence) && <div className={css({
              display: 'grid', gap: theme.sizing.scale400, minWidth: 0,
            })}>
              {title && <h1 className={css({
                ...theme.typography.HeadingLarge, margin: 0, overflowWrap: 'anywhere', textWrap: 'balance',
                ...(native ? { fontWeight: 600, letterSpacing: '-0.025em' } : {}),
              })}>{title}</h1>}
              {sentence && <p className={css({
                ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary, margin: 0, textWrap: 'pretty',
              })}>{sentence}</p>}
            </div>}
            {/* THE SCREEN'S OWN ROWS STAND IN ONE BOX. Left loose they became grid items of the
                words block, and a single field stretched to the whole room it was given while the
                list under it spilled past the foot. One box, starting at its top, scrolling inside
                the room that is left. */}
            {children !== undefined && <div data-testid={`${testId}-rows`} className={css({
              /* A COLUMN RATHER THAN A GRID WHEN IT HAS ROOM TO SHARE. Under `fill` the rows box
                 has a definite height, and the row that should spread to the foot — the three
                 choices, the likely list — simply asks for `flexGrow: 1`. A grid would have had
                 to be told how many rows there were, and every screen carries a different number. */
              display: fill && !native ? 'flex' : 'grid',
              flexDirection: 'column',
              gap: theme.sizing.scale500,
              alignContent: 'start',
              minWidth: 0,
              minHeight: 0,
              ...(fill && !native ? { overflowY: 'auto', overflowX: 'hidden' } : {}),
            })}>{children}</div>}
            {native && (inlineNativeAct || inlineNativeQuiet || note) && <div className={css({
              display: 'grid', gap: theme.sizing.scale300, minWidth: 0,
              /* The map owns the screen; its native actions sit in the lower field, clear of the
                 address card and comfortably above the system edge. */
              ...(nativeFullBleedActions ? {
                position: 'absolute', left: theme.sizing.scale600, right: theme.sizing.scale600,
                bottom: `max(18vh, calc(${theme.sizing.scale1200} + env(safe-area-inset-bottom, 0px)))`,
              } : {}),
            })}>
              {note && <div role="status" className={css({
                ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, textWrap: 'pretty',
              })}>{note}</div>}
              {inlineNativeAct}
              {inlineNativeQuiet}
            </div>}
          </div>
        )}
      </div>

      {(fixedAct || fixedQuiet || (!native && note)) && (
        /* THE FOOT NEVER MOVES AND NEVER ANIMATES. It is the one thing that stays put from the
           first screen to the last, so only its label changes as the walk goes on. */
        <div data-testid={`${testId}-foot`} className={css({
          display: 'grid',
          gap: theme.sizing.scale300,
          minWidth: 0,
          borderTopWidth: '1px',
          borderTopStyle: 'solid',
          borderTopColor: theme.colors.borderOpaque,
          backgroundColor: theme.colors.backgroundPrimary,
          paddingTop: theme.sizing.scale500,
          paddingRight: theme.sizing.scale600,
          paddingLeft: theme.sizing.scale600,
          paddingBottom: `calc(${theme.sizing.scale500} + env(safe-area-inset-bottom, 0px))`,
        })}>
          {note && <div role="status" className={css({
            ...theme.typography.ParagraphSmall,
            color: theme.colors.contentSecondary,
            textWrap: 'pretty',
          })}>{note}</div>}
          {fixedAct}
          {fixedQuiet}
        </div>
      )}

      {/* THE LAYER OVER EVERYTHING TAKES NO PRESS (ONBOARDING-SPEC.md §0: «never over the
          button»). A screen with no stage draws it here, over the whole column; a staged screen
          draws it on the stage alone, above. */}
      {!staged && over && <div aria-hidden data-testid={`${testId}-over`} className={css({
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
      })}>{over}</div>}
    </section>
  );
}

/* ── the pieces a screen builds its visual from ───────────────────────────────────────────── */

/** A NUMBER SET LARGE, COUNTING UP TO ITSELF. The waitlist place and the covered purchases both
 *  arrive this way: the figure starts short of its own value and reaches it in under a second, so
 *  the eye follows it there. Stillness prints the number and keeps still. */
export function CountUp({ to, still, prefix = '', testId, ms = 900, from }: {
  to: number;
  still: boolean;
  prefix?: string;
  testId?: string;
  ms?: number;
  /** where the count starts; by default a little short of its own value */
  from?: number;
}) {
  const start = from ?? Math.max(0, Math.round(to * 0.88));
  const [shown, setShown] = React.useState(() => (still ? to : start));
  React.useEffect(() => {
    if (still) { setShown(to); return undefined; }
    const began = from ?? Math.max(0, Math.round(to * 0.88));
    setShown(began);
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const part = Math.min(1, (now - started) / ms);
      /* out-quint: fast at first, settling on the last digits — the number arrives rather than
         ticking over like a counter */
      const eased = 1 - (1 - part) ** 5;
      setShown(Math.round(began + (to - began) * eased));
      if (part < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [to, still, ms, from]);
  return <span data-testid={testId} data-value={to}
    style={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}{shown.toLocaleString('en-US')}</span>;
}

/** What a breath adds to a style object. It is named rather than borrowed from React's own
 *  `CSSProperties`, whose `fontSize` and `letterSpacing` are wider than Styletron's and would
 *  widen every style object this spreads into. */
export type Breath = {
  transform?: string;
  transitionProperty?: string;
  transitionDuration?: string;
  transitionTimingFunction?: string;
};

/** THE ONE THING THAT LOOPS — a slow breath on the hero number, four seconds a cycle, two per
 *  cent of scale. It is the only endless movement in the walk (ONBOARDING-SPEC.md §0). */
export function useIdleBreath(still: boolean): Breath {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    if (still) return undefined;
    const timer = window.setInterval(() => setOn((was) => !was), 2000);
    return () => window.clearInterval(timer);
  }, [still]);
  if (still) return {};
  return {
    transform: on ? 'scale(1.02)' : 'scale(1)',
    transitionProperty: 'transform',
    transitionDuration: '2000ms',
    transitionTimingFunction: 'cubic-bezier(.4,0,.6,1)',
  };
}

/** A TICK THAT DRAWS ITSELF — the stroke is dashed to its own length and the offset runs to zero,
 *  so the mark is written rather than switched on. Every confirmation in the walk uses this one. */
export function DrawnTick({ size = 20, still, ms = 320, colour }: {
  size?: number;
  still: boolean;
  ms?: number;
  colour?: string;
}) {
  const entered = useEntered();
  const length = 26;
  return (
    <svg data-testid="drawn-tick" width={size} height={size} viewBox="0 0 24 24" aria-hidden
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}>
      <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke={colour ?? 'currentColor'} strokeWidth={2.4}
        strokeLinecap="round" strokeLinejoin="round"
        style={{
          strokeDasharray: length,
          strokeDashoffset: still || entered ? 0 : length,
          transitionProperty: 'stroke-dashoffset',
          transitionDuration: still ? '0ms' : `${ms}ms`,
          transitionTimingFunction: 'cubic-bezier(.2,.8,.3,1)',
        }} />
    </svg>
  );
}
