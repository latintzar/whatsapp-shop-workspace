/* SCREEN 5 · YOUR ADDRESS — `Where is it?` (ONBOARDING-SPEC.md §0, screen 5).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening): «the address, with google auto
 * complete in a SUPER nice UI. perfect autocomplete etc. and showing it on the map fullsceen etc
 * with a great continue arrow etc and card at the top etc.»
 *
 * ═══ TWO PANES, ONE SCREEN ══════════════════════════════════════════════════════════════════
 *   SEARCH   a field that answers as it is typed — 220 ms after the last keystroke, one Places
 *            session token for the whole search, skeleton rows while an answer is in flight, the
 *            street bold and the district quiet, and the rows arriving 30 ms apart.
 *   THE MAP  full screen, the card at the TOP carrying the business's name and the address, the
 *            pin dropped in the middle with a settle, draggable to correct it, and the arrow act
 *            at the foot.
 *
 * ═══ WHERE THE SUGGESTIONS COME FROM ════════════════════════════════════════════════════════
 * `GET /api/bodega/address/suggestions`, which is Google Places (New) through the runtime's own
 * key, biased to Peru and session-token'd so Google bills one search rather than one keystroke
 * (`mock-api/app/places.py`). The key stays in the runtime; the page never holds one. Where the
 * runtime answers `awaiting` — local development with no runtime — the sample world's own three
 * Lima addresses stand, which are the same three the runtime itself answers with when no Places
 * key is configured.
 *
 * ═══ THE GROUND UNDER THE PIN ═══════════════════════════════════════════════════════════════
 * Google's Maps JavaScript API, loaded through Cedar's own loader (`cedar/google-ground.ts`) with
 * the browser key the build was given — one load, on demand, with a timeout, and the whole of the
 * quota posture is that module's. The style is composed from THIS THEME's tokens, so the map is
 * muted to the product rather than to Google's default palette, and the default controls are off.
 * A build with no key — or one whose key Google refuses, which is what a browser key restricted to
 * the product's own hostnames does on a developer's machine — draws the PLACE CARD ground below:
 * the same card, the same pin, the same act, on a drawing of Lima rather than on Google's streets.
 * Every proof runs that way, so a screenshot taken today and one taken in a year are the same
 * picture.
 *
 * ═══ THE PIN IS THE MIDDLE, AND THE MAP MOVES UNDER IT ══════════════════════════════════════
 * Correcting a pin by dragging the pin itself puts the thing being aimed at under the finger.
 * Every map that asks for an address does it the other way round — the pin is fixed in the middle
 * and the ground slides beneath it — so the place is always visible and the target is always the
 * centre of the screen. Lifting on drag and settling on stop is what says the pin is a real
 * object. The coordinate the shop leaves it on is what is saved; the words stay the ones Places
 * gave, because this runtime has no reverse-geocode road (WIRING-SPEC.md §14).
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Input } from 'baseui/input';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { isGoogleGroundConfigured, loadGoogleMaps, type GoogleMap } from '../../cedar/google-ground';
import { markReached } from '../stage';
import {
  SAMPLE_PLACES, SAMPLE_SUGGESTIONS, addressPlace, addressSuggestions, newSessionToken,
  readDraft, sellsOnward, writeBusiness, writeDraft, type ChosenAddress, type Suggestion,
} from './joining';
import {
  MS, SPRING, WalkAct, WalkQuiet, WalkScreen, goBack, goTo, stepsFor, useEntered, useStillness, tap,
} from './walk';
import { useWords } from './words';
import { nativeWalk } from './runtime';

/** How long the field waits after the last keystroke before it asks. */
const SETTLE_MS = 220;
/** How far apart the rows arrive. */
const STAGGER_MS = 30;

/** A map that can also be read and listened to. `cedar/google-ground.ts` types the slice Cedar
 *  uses; this screen needs two more calls, so it names them here rather than widening that
 *  module's contract for one caller. */
type DraggableMap = GoogleMap & {
  getCenter: () => { lat: () => number; lng: () => number } | null;
  addListener: (event: string, handler: () => void) => void;
};

/** THE GROUND, MUTED TO THIS THEME. Every colour is a token, so the map re-themes with the brand
 *  and `app/tools/theme-gate.mjs` finds no paint of its own here. */
const mapStyle = (colours: {
  paper: string; quiet: string; deep: string; ink: string; faint: string;
}): Record<string, unknown>[] => [
  { elementType: 'geometry', stylers: [{ color: colours.quiet }] },
  { elementType: 'labels.text.fill', stylers: [{ color: colours.faint }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: colours.paper }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: colours.paper }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: colours.faint }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: colours.paper }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: colours.deep }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: colours.deep }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: colours.quiet }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: colours.deep }] },
  { elementType: 'labels.text', stylers: [{ color: colours.ink }] },
];

/* ── the pin ──────────────────────────────────────────────────────────────────────────────── */

/** THE PIN, ITS PULSE AND ITS SHADOW. It drops on a spring, lifts while the ground is moving and
 *  settles again when it stops; the shadow widens as it rises, which is the whole of the depth.
 *
 *  THE PULSE IS THIS SCREEN'S ONE IDLE MOVEMENT — a ring leaving the pin every 2.4 s while the
 *  ground is still, the way every map says «here». It stops the moment the ground is being dragged,
 *  because then the pin is the thing being aimed rather than the thing being pointed at, and
 *  stillness removes it with the rest of the movement. */
function Pin({ dropped, lifted, still }: { dropped: boolean; lifted: boolean; still: boolean }) {
  const [css, theme] = useStyletron();
  const rise = still ? 0 : lifted ? 10 : 0;
  return (
    <div aria-hidden data-testid="address-pin" data-pin={dropped ? 'dropped' : 'falling'}
      data-lifted={lifted ? 'yes' : 'resting'}
      className={css({
        position: 'absolute', left: '50%', top: '50%', pointerEvents: 'none',
        transform: 'translate(-50%, -100%)', display: 'grid', justifyItems: 'center',
      })}>
      {/* THE RING, leaving from under the pin's own disc */}
      {dropped && !still && !lifted && <span data-testid="address-pin-pulse" className={css({
        position: 'absolute', left: '50%', top: '22px',
        width: '44px', height: '44px', marginLeft: '-22px', marginTop: '-22px',
        borderRadius: '50%',
        borderWidth: '2px', borderStyle: 'solid', borderColor: theme.colors.contentPrimary,
        animationName: {
          '0%': { transform: 'scale(0.6)', opacity: 0.55 },
          '70%': { transform: 'scale(2.4)', opacity: 0 },
          '100%': { transform: 'scale(2.4)', opacity: 0 },
        },
        animationDuration: '2400ms',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'cubic-bezier(.2,.7,.4,1)',
      })} />}
      <span className={css({
        display: 'grid', placeItems: 'center', width: '44px', height: '44px',
        borderRadius: '50%',
        backgroundColor: theme.colors.contentPrimary,
        color: theme.colors.backgroundPrimary,
        boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
        transform: dropped || still ? `translate3d(0,${-rise}px,0) scale(1)` : 'translate3d(0,-64px,0) scale(0.8)',
        opacity: dropped || still ? 1 : 0,
        transitionProperty: 'transform, opacity',
        transitionDuration: still ? '0ms' : `${MS.land}ms`,
        transitionTimingFunction: SPRING.land,
      })}>
        <MapPin size={22} />
      </span>
      {/* the ripple the pin lands in, and the shadow it rides while the ground moves */}
      <span className={css({
        marginTop: '6px',
        width: lifted ? '22px' : '14px',
        height: '5px',
        borderRadius: '50%',
        backgroundColor: 'rgba(0,0,0,0.28)',
        filter: 'blur(1px)',
        opacity: dropped || still ? (lifted ? 0.5 : 0.85) : 0,
        transform: `translate3d(0,${rise}px,0)`,
        transitionProperty: 'width, opacity, transform',
        transitionDuration: still ? '0ms' : `${MS.land}ms`,
        transitionTimingFunction: SPRING.land,
      })} />
    </div>
  );
}

/* ── the grounds ──────────────────────────────────────────────────────────────────────────── */

/**
 * THE PLACE CARD GROUND — what the screen draws where this build was given no Maps key, and what
 * every proof runs on.
 *
 * ⚠ IT WAS A FIELD OF GREY RECTANGLES. Fifteen identical blocks on a ruled grid read as a loading
 * state, not as a place: a person looked at it and waited for the map to arrive. What makes a
 * drawing read as a MAP is the things a grid has none of — a coast, avenues that cut across the
 * blocks at an angle, a park, blocks of unequal size. So this draws Lima's own shape in the
 * theme's paper tones: the Pacific down the western edge, the cliff road along it, two avenues
 * running inland, a park where they meet, and the ordinary streets between. Nothing here claims to
 * be a survey — it is the register of a map, which is what the card at the top needs under it.
 *
 * Every colour is a theme token, so the ground re-themes with the brand like everything else.
 */
function CardGround() {
  const [css, theme] = useStyletron();
  /* FOUR STEPS OF ONE GREY, mixed off two tokens rather than written: the ground, the blocks on
     it, the sea, and the streets, which are the PAPER. Read at arm's length the picture has to
     separate into those four; the first draft used Base's own three neighbouring greys and they
     came out as one flat field with white lines on it. */
  const land = `color-mix(in srgb, ${theme.colors.contentPrimary} 4%, ${theme.colors.backgroundSecondary})`;
  const block = `color-mix(in srgb, ${theme.colors.contentPrimary} 11%, ${theme.colors.backgroundSecondary})`;
  const street = theme.colors.backgroundPrimary;
  const water = `color-mix(in srgb, ${theme.colors.contentPrimary} 24%, ${theme.colors.backgroundSecondary})`;
  const park = `color-mix(in srgb, ${theme.colors.contentPrimary} 17%, ${theme.colors.backgroundSecondary})`;
  /* the ordinary blocks: unequal, because a city is */
  const blocks: [number, number, number, number][] = [
    [96, 20, 78, 74], [186, 20, 96, 74], [294, 20, 84, 52],
    [96, 106, 78, 96], [186, 106, 96, 62], [294, 84, 84, 84],
    [96, 214, 60, 70], [168, 180, 54, 104], [234, 180, 48, 104], [294, 180, 84, 60],
    [110, 322, 64, 88], [186, 296, 96, 60], [294, 252, 84, 104],
    [128, 422, 46, 76], [186, 368, 60, 130], [258, 368, 60, 90], [330, 368, 48, 74],
    [146, 510, 64, 80], [222, 470, 78, 120], [312, 454, 66, 96],
    [160, 602, 60, 78], [232, 602, 68, 78], [312, 562, 66, 118],
  ];
  return (
    <div data-testid="address-ground-card" className={css({
      position: 'absolute', inset: 0, overflow: 'hidden',
      backgroundColor: land,
    })}>
      <svg width="100%" height="100%" aria-hidden preserveAspectRatio="xMidYMid slice" viewBox="0 0 390 700"
        style={{ display: 'block', position: 'absolute', inset: 0 }}>
        {/* THE COAST — the Pacific down the western edge, and the land ending on a curve */}
        <path d="M0 0 L74 0 C62 140 92 280 58 420 C36 520 70 610 44 700 L0 700 Z" fill={water} />
        {/* the cliff road along the sea, which is the landmark every Lima address is placed off */}
        <path d="M74 0 C62 140 92 280 58 420 C36 520 70 610 44 700"
          fill="none" stroke={street} strokeWidth={8} />

        {/* THE BLOCKS, then the streets over them */}
        {blocks.map(([x, y, w, h]) => (
          <rect key={`b${x}-${y}`} x={x} y={y} width={w} height={h} rx={3} fill={block} />
        ))}

        {/* the ordinary streets */}
        {[180, 288, 388].map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={700} stroke={street} strokeWidth={7} />
        ))}
        {[100, 208, 290, 362, 464, 596].map((y) => (
          <line key={`h${y}`} x1={40} y1={y} x2={390} y2={y} stroke={street} strokeWidth={7} />
        ))}

        {/* TWO AVENUES, cutting the grid the way an avenue does */}
        <line x1={44} y1={700} x2={390} y2={182} stroke={street} strokeWidth={15} />
        <line x1={70} y1={0} x2={390} y2={520} stroke={street} strokeWidth={12} />

        {/* THE PARK where they cross — a rounded block with its own path through it */}
        <rect x={196} y={396} width={104} height={92} rx={16} fill={park} />
        <path d="M204 470 C232 440 258 452 292 408" fill="none" stroke={street} strokeWidth={4} />
      </svg>
    </div>
  );
}

/** GOOGLE'S GROUND, muted to the theme, its own controls off, gestures cooperative. */
function GoogleGround({ at, onMoved, onFail, onDragging }: {
  at: ChosenAddress;
  onMoved: (lat: number, lng: number) => void;
  onFail: () => void;
  onDragging: (moving: boolean) => void;
}) {
  const [, theme] = useStyletron();
  const host = React.useRef<HTMLDivElement | null>(null);
  const map = React.useRef<DraggableMap | null>(null);
  const moved = React.useRef(onMoved);
  moved.current = onMoved;

  React.useEffect(() => {
    let live = true;
    /* ⚠ A KEY GOOGLE REFUSES AFTER THE MAP IS BUILT PAINTED GOOGLE'S OWN ERROR PANEL.
       `google-ground.ts` answers `gm_authFailure` while it is still LOADING, and that is the case
       it can see: an invalid key, a referrer mismatch or an exhausted quota reported before the
       library resolves. Google also reports one AFTER the script has loaded and the `Map` has been
       constructed — which is exactly what a browser key restricted to the product's own hostnames
       does on a developer's machine — and then it draws «Oops! Something went wrong.» in English
       inside the host element, under this screen's own card. The refusal is the provider saying
       «use the other ground», wherever in the life of the map it arrives, so this screen listens
       for it too and falls to the drawn one. The loader's own handler is kept and called first. */
    const shared = window as unknown as { gm_authFailure?: () => void };
    let before: (() => void) | undefined;
    void loadGoogleMaps().then((api) => {
      if (!live || !host.current) return;
      if (!api) { onFail(); return; }
      /* set AFTER the loader has settled, because the loader installs its own handler while it
         waits and would otherwise replace this one the moment it was called */
      before = shared.gm_authFailure;
      shared.gm_authFailure = () => { before?.(); if (live) onFail(); };
      try {
        const drawn = new api.Map(host.current, {
          center: { lat: at.lat, lng: at.lng },
          zoom: 17,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'cooperative',
          keyboardShortcuts: false,
          styles: mapStyle({
            paper: theme.colors.backgroundPrimary,
            quiet: theme.colors.backgroundSecondary,
            deep: theme.colors.backgroundTertiary,
            ink: theme.colors.contentPrimary,
            faint: theme.colors.contentSecondary,
          }),
        }) as DraggableMap;
        map.current = drawn;
        drawn.addListener('dragstart', () => onDragging(true));
        drawn.addListener('idle', () => {
          onDragging(false);
          const centre = drawn.getCenter?.();
          if (centre) moved.current(centre.lat(), centre.lng());
        });
      } catch { onFail(); }
    });
    return () => { live = false; map.current = null; shared.gm_authFailure = before; };
    /* the map is built once for this address; a second address remounts the screen's own pane */
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={host} data-testid="address-ground-google"
    style={{ position: 'absolute', inset: 0 }} />;
}

/* ── the suggestion row ───────────────────────────────────────────────────────────────────── */

function SuggestionRow({ row, index, onPick, onKeyDown }: {
  row: Suggestion;
  index: number;
  onPick: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const [css, theme] = useStyletron();
  const still = useStillness();
  const entered = useEntered(index * STAGGER_MS);
  return (
    <li className={css({ listStyle: 'none', minWidth: 0 })}>
      <button type="button" data-testid="address-suggestion" data-place-id={row.placeId}
        onClick={() => { tap(still); onPick(); }} onKeyDown={onKeyDown}
        className={css({
          appearance: 'none', display: 'flex', alignItems: 'center', gap: theme.sizing.scale500,
          width: '100%', minWidth: 0, minHeight: '64px', textAlign: 'left', cursor: 'pointer',
          paddingTop: theme.sizing.scale400, paddingBottom: theme.sizing.scale400,
          paddingLeft: theme.sizing.scale400, paddingRight: theme.sizing.scale400,
          borderWidth: 0, borderRadius: theme.borders.radius300,
          backgroundColor: theme.colors.backgroundPrimary,
          color: theme.colors.contentPrimary,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translate3d(0,0,0)' : 'translate3d(0,8px,0)',
          transitionProperty: 'opacity, transform, background-color',
          transitionDuration: still ? '0ms' : '260ms',
          transitionTimingFunction: 'cubic-bezier(.2,.8,.3,1)',
          ':hover': { backgroundColor: theme.colors.backgroundSecondary },
        })}>
        <MapPin size={18} aria-hidden style={{ flexShrink: 0, color: theme.colors.contentSecondary }} />
        <span className={css({ display: 'grid', gap: '2px', minWidth: 0 })}>
          <span className={css({ ...theme.typography.LabelLarge, overflowWrap: 'anywhere' })}>{row.mainText}</span>
          <span className={css({ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, overflowWrap: 'anywhere' })}>{row.secondaryText}</span>
        </span>
      </button>
    </li>
  );
}

/** WHILE AN ANSWER IS IN FLIGHT — three rows of the shape the answer will take, so the list does
 *  not jump when it lands. */
function Skeletons() {
  const [css, theme] = useStyletron();
  const still = useStillness();
  return (
    <ul data-testid="address-skeletons" className={css({ display: 'grid', gap: theme.sizing.scale300, margin: 0, padding: 0 })}>
      {[0, 1, 2].map((row) => (
        <li key={row} aria-hidden className={css({ listStyle: 'none', display: 'grid', gap: '6px', minHeight: '64px', padding: theme.sizing.scale400 })}>
          <span className={css({
            height: '14px', width: `${70 - row * 12}%`, borderRadius: theme.borders.radius200,
            backgroundColor: theme.colors.backgroundSecondary,
            ...(still ? {} : { animationName: { '0%': { opacity: 0.55 }, '50%': { opacity: 1 }, '100%': { opacity: 0.55 } }, animationDuration: '1.1s', animationIterationCount: 'infinite' }),
          })} />
          <span className={css({
            height: '11px', width: `${52 - row * 9}%`, borderRadius: theme.borders.radius200,
            backgroundColor: theme.colors.backgroundSecondary,
          })} />
        </li>
      ))}
    </ul>
  );
}

/* ── the screen ───────────────────────────────────────────────────────────────────────────── */

export default function Address() {
  const [css, theme] = useStyletron();
  /* THE RECORD IS WRITTEN ON THIS SCREEN, so this is where the walk's own language joins it
     (`start/words.ts`): the buddy then writes to the shop the way the shop read the sign-up. */
  const { lang, w } = useWords();
  const still = useStillness();
  const [draft, setDraft] = React.useState(() => readDraft());
  const [query, setQuery] = React.useState('');
  const [rows, setRows] = React.useState<Suggestion[]>([]);
  const [asking, setAsking] = React.useState(false);
  const [picked, setPicked] = React.useState<ChosenAddress | null>(() => readDraft().address);
  const [dropped, setDropped] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [googleFailed, setGoogleFailed] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [failure, setFailure] = React.useState(false);
  const token = React.useRef(newSessionToken());
  const list = React.useRef<HTMLUListElement | null>(null);

  React.useEffect(() => { markReached('address'); }, []);

  /* THE FIELD ASKS 220 ms AFTER THE LAST KEYSTROKE, on one session token, and a late answer to an
     older query is dropped rather than painted over a newer one. */
  React.useEffect(() => {
    const wanted = query.trim();
    if (picked) return undefined;
    if (wanted.length < 3) { setRows([]); setAsking(false); return undefined; }
    setAsking(true);
    let live = true;
    const timer = window.setTimeout(() => {
      void addressSuggestions(wanted, token.current).then((answer) => {
        if (!live) return;
        setAsking(false);
        setFailure(!answer.ok && Boolean(nativeWalk()));
        setRows(answer.ok
          ? answer.value.suggestions
          /* the sample world answers with the same three Lima addresses the runtime itself
             answers with where no Places key is configured */
          : nativeWalk() ? [] : SAMPLE_SUGGESTIONS.filter((row) => row.text.toLowerCase().includes(wanted.toLowerCase().slice(0, 3))
            || SAMPLE_SUGGESTIONS.length > 0));
      });
    }, SETTLE_MS);
    return () => { live = false; window.clearTimeout(timer); setAsking(false); };
  }, [query, picked]);

  /* THE PIN DROPS a beat after the map pane arrives, so the ground is under it when it lands. */
  React.useEffect(() => {
    if (!picked) { setDropped(false); return undefined; }
    const timer = window.setTimeout(() => setDropped(true), still ? 0 : 260);
    return () => window.clearTimeout(timer);
  }, [picked, still]);

  const pick = async (row: Suggestion) => {
    const answer = await addressPlace(row.placeId, token.current);
    if (!answer.ok && nativeWalk()) { setFailure(true); return; }
    setFailure(false);
    const chosen: ChosenAddress = answer.ok
      ? answer.value
      : SAMPLE_PLACES[row.placeId] ?? { placeId: row.placeId, text: row.text, lat: -12.0464, lng: -77.0428 };
    /* THE SESSION ENDS WITH THE PICK, which is what Places bills; the next search opens a new one. */
    token.current = newSessionToken();
    setPicked(chosen);
    setDraft(writeDraft({ ...draft, address: chosen }));
  };

  const moved = React.useCallback((lat: number, lng: number) => {
    setPicked((held) => (held && (held.lat !== lat || held.lng !== lng) ? { ...held, lat, lng } : held));
  }, []);

  const confirm = async () => {
    if (!picked || !draft.kind || !draft.name) return;
    setSaving(true);
    const held = { ...draft, address: picked };
    writeDraft(held);
    setDraft(held);
    /* THE RECORD IS WRITTEN HERE, because this is the first moment all three facts exist. It is
       allowed to be awaiting: the walk carries its own draft either way (`start/joining.ts`). */
    const answer = await writeBusiness({ kind: draft.kind, name: draft.name, address: picked, language: lang })
      .catch(() => undefined);
    setSaving(false);
    if (nativeWalk() && !answer?.ok) { setFailure(true); return; }
    setFailure(false);
    goTo(nativeWalk() ? 'done' : 'orders');
  };

  const steps = stepsFor(sellsOnward(draft.kind));
  /* THE ROWS TAKE THE ARROW KEYS, so a person on a keyboard walks the list rather than tabbing
     past it. */
  const rowKeys = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const all = Array.from(list.current?.querySelectorAll('button') ?? []);
    const at = all.indexOf(event.currentTarget);
    const next = all[at + (event.key === 'ArrowDown' ? 1 : -1)];
    next?.focus();
  };

  if (picked) {
    /* ── THE MAP, FULL SCREEN, THE CARD AT THE TOP AND THE ARROW AT THE FOOT ─────────────── */
    return (
      <WalkScreen
        testId="start-address"
        step="address"
        steps={steps}
        fullBleed
        note={failure ? <span role="alert">{lang === 'es' ? 'Vuelve a intentarlo para guardar tu dirección.' : 'Try again to save your address.'}</span> : undefined}
        visual={
          <div data-testid="address-map" data-ground={isGoogleGroundConfigured() && !googleFailed ? 'google' : 'card'}
            className={css({ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' })}>
            {isGoogleGroundConfigured() && !googleFailed
              ? <GoogleGround at={picked} onMoved={moved} onDragging={setDragging}
                onFail={() => setGoogleFailed(true)} />
              : <CardGround />}
            <Pin dropped={dropped} lifted={dragging} still={still} />
          </div>
        }
        act={<WalkAct testId="address-confirm" isLoading={saving} onClick={() => { void confirm(); }}>
          <span className={css({ display: 'inline-flex', alignItems: 'center', gap: theme.sizing.scale300 })}>
            {w.addressConfirm}<ArrowRight size={18} aria-hidden />
          </span>
        </WalkAct>}
        quiet={<WalkQuiet testId="address-search-again"
          onClick={() => { setPicked(null); setRows([]); setQuery(''); }}>{w.addressAgain}</WalkQuiet>}
      >
        {/* THE CARD AT THE TOP — the business's name and the address under it, over the ground. */}
        <div data-testid="address-card" className={css({
          position: 'absolute', top: theme.sizing.scale600, left: theme.sizing.scale600, right: theme.sizing.scale600,
          display: 'grid', gap: theme.sizing.scale200, minWidth: 0,
          padding: theme.sizing.scale600,
          borderRadius: theme.borders.radius400,
          backgroundColor: theme.colors.backgroundPrimary,
          boxShadow: '0 10px 30px rgba(0,0,0,0.16)',
          opacity: dropped || still ? 1 : 0,
          transform: dropped || still ? 'translate3d(0,0,0)' : 'translate3d(0,-12px,0)',
          transitionProperty: 'opacity, transform',
          transitionDuration: still ? '0ms' : `${MS.move}ms`,
          transitionTimingFunction: SPRING.glide,
        })}>
          <strong data-testid="address-card-name" className={css({ ...theme.typography.LabelLarge, overflowWrap: 'anywhere' })}>{draft.name || w.yourBusiness}</strong>
          <span data-testid="address-card-text" className={css({ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, overflowWrap: 'anywhere' })}>{picked.text}</span>
          <span className={css({ ...theme.typography.LabelXSmall, color: theme.colors.contentSecondary })}>
            {w.addressDrag}
          </span>
        </div>
      </WalkScreen>
    );
  }

  /* ── THE SEARCH ─────────────────────────────────────────────────────────────────────────── */
  return (
    <WalkScreen
      testId="start-address"
      step="address"
      steps={steps}
      fill
      title={w.addressTitle}
      sentence={w.addressSentence}
      act={nativeWalk() ? undefined : <WalkAct testId="address-back" disabled>{w.addressConfirm}</WalkAct>}
      quiet={nativeWalk() ? undefined : <WalkQuiet testId="address-back-step" onClick={() => goBack('address', steps)}>{w.addressBack}</WalkQuiet>}
    >
      {failure && <p role="alert">{lang === 'es' ? 'Vuelve a intentarlo para guardar tu dirección.' : 'Try again to save your address.'}</p>}
      <Input value={query} placeholder={w.addressPlaceholder} clearable autoFocus
        aria-label={w.addressField}
        startEnhancer={() => <Search size={18} aria-hidden />}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onFocus={(event) => {
          window.setTimeout(() => event.target.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' }), 240);
        }}
        overrides={{
          Input: { props: { 'data-testid': 'address-query', enterKeyHint: 'search', autoComplete: 'off' } },
          Root: { style: { minHeight: '56px' } },
        }} />

      {/* THE ADDRESS THIS SHOP ALREADY PICKED stands first, because coming back to change one
          digit should take one press (ONBOARDING-SPEC.md §0: «recent/nearby first»). */}
      {draft.address && query.trim().length === 0 && (
        <ul className={css({ display: 'grid', gap: theme.sizing.scale300, margin: 0, padding: 0 })}>
          <li className={css({ listStyle: 'none' })}>
            <span className={css({ ...theme.typography.LabelXSmall, color: theme.colors.contentSecondary })}>{w.addressRecent}</span>
          </li>
          <SuggestionRow index={0} onKeyDown={rowKeys}
            row={{
              placeId: draft.address.placeId,
              text: draft.address.text,
              mainText: draft.address.text.split(',')[0],
              secondaryText: draft.address.text.split(',').slice(1).join(',').trim(),
            }}
            onPick={() => { setPicked(draft.address); }} />
        </ul>
      )}

      {asking && <Skeletons />}

      {!asking && rows.length > 0 && (
        <ul ref={list} data-testid="address-suggestions" data-rows={rows.length}
          className={css({ display: 'grid', gap: theme.sizing.scale200, margin: 0, padding: 0 })}>
          {rows.map((row, index) => (
            <SuggestionRow key={row.placeId} row={row} index={index} onKeyDown={rowKeys}
              onPick={() => { void pick(row); }} />
          ))}
        </ul>
      )}

      {!asking && rows.length === 0 && query.trim().length >= 3 && (
        <p data-testid="address-empty" className={css({ ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary, margin: 0 })}>
          {w.addressEmpty}
        </p>
      )}
    </WalkScreen>
  );
}

export const meta = { id: 'address', title: 'Your address', owner: 'BODEGA-START', panes: false };
