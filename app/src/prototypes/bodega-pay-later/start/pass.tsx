/* THE PASS — the object the shop receives, and then completes (ONBOARDING-SPEC.md §0, «THE PASS»).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening): «has tob e dating app level viral and
 * exciting process and have all the animatiosn», «if should be high excitement the whole time and
 * really feel liek they're joinging something».
 *
 * ═══ WHAT IT IS ═════════════════════════════════════════════════════════════════════════════
 * A dark card carrying this business's membership of the waitlist: the label, its name, what kind
 * of business it is, where it is, its place, its reference, and the Yape it connected. It is the
 * one object that crosses four screens of the walk, and it is the same object each time — the shop
 * RECEIVES it on the celebration and then FILLS it in: «Confirm details» is literally the rest of
 * its own pass being written.
 *
 * That is the dating-app mechanic, and it is why the walk feels like joining rather than like a
 * form: a person watches their own card being built, line by line, and every question they answer
 * appears on it before they have put the phone down.
 *
 * ═══ AN UNFILLED LINE IS A BAR, NEVER A BLANK ═══════════════════════════════════════════════
 * Each line the shop has yet to give stands as a dim placeholder BAR of about its own width, so the
 * card visibly has things left to fill — a promise the next screen keeps. The moment a line becomes
 * known it is WIPED IN from the top with an 8 px rise, on the walk's own springs, so the card is
 * seen to gain it.
 *
 * ═══ AND IT LANDS, THEN BREATHES ════════════════════════════════════════════════════════════
 * `land` drops it in from 40 px above, tilted 18° away and at 92%, settling on `SPRING.land`; `idle`
 * then gives it an endless slow tilt of two degrees either way, about six seconds a cycle, which is
 * the ONE endless movement on a pass screen. `useStillness` removes both: the card is simply there,
 * complete, and it keeps still.
 *
 * ═══ WHO DRAWS IT ═══════════════════════════════════════════════════════════════════════════
 *   waitlist    the pass lands, holding the place alone                  (`start/waitlist.tsx`)
 *   business    the name mirrors onto it as it is typed                  (`start/business.tsx`)
 *   referrals   complete, smaller, with the three seats under it          (`start/referrals.tsx`)
 *   done        complete, and the object a shop screenshots              (`start/done.tsx`)
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { YAPE } from '../../../rocoto-theme';
import type { BusinessKind } from './joining';
import { CountUp, MS, SPRING, useStillness } from './walk';
import { figure, useWords, type Lang, type Words } from './words';

/** WHAT THE CARD CALLS EACH TRADE — the caption under the name. The words are the table's
 *  (`start/words.ts`); what stands here is which row each trade reads. */
const KIND_CAPTION: Record<BusinessKind, keyof Words> = {
  supplier: 'passSupplier',
  bodega: 'passBodega',
  restaurant: 'passRestaurant',
};

/**
 * A LINE LANDS THE MOMENT IT IS KNOWN. The flag flips one frame after the value arrives, so the
 * entrance is one property change the browser owns; stillness lands it at once.
 */
function useLanded(known: boolean, still: boolean): boolean {
  const [landed, setLanded] = React.useState(false);
  React.useEffect(() => {
    if (!known) { setLanded(false); return undefined; }
    if (still) { setLanded(true); return undefined; }
    const frame = window.requestAnimationFrame(() => setLanded(true));
    return () => window.cancelAnimationFrame(frame);
  }, [known, still]);
  return landed;
}

/** ONE LINE OF THE PASS — the bar while it is open, the words once they are known. */
function PassLine({ known, bar = '62%', complete = false, children, testId }: {
  known: boolean;
  /** how wide the placeholder stands, which is roughly how long the answer will be */
  bar?: string;
  /** THE CARD IS FINISHED, so a line this record carries none of is LEFT OUT rather than drawn as
   *  a bar. A bar promises the next screen will fill it, and on the status page there is no next
   *  screen: the public record simply holds no address (`start/lista.tsx`). */
  complete?: boolean;
  children: React.ReactNode;
  testId?: string;
}) {
  const [css, theme] = useStyletron();
  const still = useStillness();
  const landed = useLanded(known, still);
  if (!known && complete) return null;
  if (!known) {
    return <span aria-hidden data-testid={testId} data-pass-line="open" className={css({
      display: 'block',
      height: '13px',
      width: bar,
      borderRadius: theme.borders.radius100,
      backgroundColor: `color-mix(in srgb, ${theme.colors.contentInversePrimary} 20%, ${theme.colors.backgroundInversePrimary})`,
    })} />;
  }
  return (
    <span data-testid={testId} data-pass-line="filled" className={css({
      display: 'block',
      minWidth: 0,
      opacity: landed ? 1 : 0,
      transform: landed ? 'translate3d(0,0,0)' : 'translate3d(0,8px,0)',
      clipPath: landed ? 'inset(-8% -8% -8% -8%)' : 'inset(100% -8% -8% -8%)',
      transitionProperty: 'opacity, transform, clip-path',
      transitionDuration: still ? '0ms' : `${MS.move}ms`,
      transitionTimingFunction: SPRING.glide,
    })}>{children}</span>
  );
}

/** HOW BIG THE NAME IS SET — one line always, shrinking a step at a time to 18 px and then
 *  ellipsing. Measured from the string rather than from the box: a card 340 px wide fits about
 *  sixteen characters at 28 px, and a name longer than that is rarer than a reflow is ugly. */
export function nameSize(name: string): number {
  if (name.length <= 16) return 28;
  if (name.length <= 22) return 23;
  return 18;
}

export type PassProps = {
  /** the business's own name, empty until screen 4 */
  name?: string;
  kind?: BusinessKind | null;
  /** the address line, empty until screen 5 */
  address?: string;
  /** the place the service gave, 0 until it has answered */
  place?: number;
  /** the referral code, which is the reference this business is known by */
  reference?: string;
  /** the Yape chip, once the shop has connected one */
  yape?: boolean;
  /** the caption a figure the service never gave carries */
  sample?: string;
  /** the count-up on the place, for the screen where it arrives */
  count?: boolean;
  /** where the count starts — the place that was standing, where the service has since moved this
   *  business up and the shop should watch it DROP (`start/referrals.tsx`) */
  countFrom?: number;
  /** how long the count takes */
  countMs?: number;
  /** the landing: from 40 px above, tilted, at 92% */
  land?: boolean;
  /** the endless slow tilt, two degrees either way */
  idle?: boolean;
  /** how big the card stands — under 1 where it SHARES its stage with something else. The box
   *  it takes in the layout shrinks with it, so what stands under it starts where it ends. */
  scale?: number;
  /** the keyboard is up: the name and the place alone */
  compact?: boolean;
  /** the language the card is written in, where the screen learns it from a record rather than
   *  from the address — the status page (`start/words.ts`) */
  lang?: Lang | '';
  /** the card is finished: a line the record holds none of is left out rather than standing as a
   *  placeholder bar (the status page, whose public record carries no address) */
  complete?: boolean;
  testId?: string;
  nameTestId?: string;
  placeTestId?: string;
  sampleTestId?: string;
};

export function Pass({
  name = '', kind = null, address = '', place = 0, reference = '', yape = false, sample = '',
  count = false, countFrom, countMs = 900, land = false, idle = false, scale = 1, compact = false,
  lang = '', complete = false, testId = 'pass', nameTestId, placeTestId, sampleTestId,
}: PassProps) {
  const [css, theme] = useStyletron();
  const { w } = useWords(lang);
  const still = useStillness();
  /* THE LANDING is one flip on the frame after the card mounts. */
  const [settled, setSettled] = React.useState(!land);
  React.useEffect(() => {
    if (!land) { setSettled(true); return undefined; }
    if (still) { setSettled(true); return undefined; }
    const timer = window.setTimeout(() => setSettled(true), 40);
    return () => window.clearTimeout(timer);
  }, [land, still]);

  /* THE TILT — three seconds each way, which is a six-second cycle. */
  const [tilted, setTilted] = React.useState(false);
  React.useEffect(() => {
    if (!idle || still) return undefined;
    const timer = window.setInterval(() => setTilted((was) => !was), 3000);
    return () => window.clearInterval(timer);
  }, [idle, still]);

  /* ⚠ A SCALED CARD STILL TOOK ITS FULL HEIGHT IN THE LAYOUT, and on a 360 × 740 phone that pushed
     the seats under it off the bottom of the stage. `transform` paints smaller without measuring
     smaller, so the card's own height is READ and the box it stands in is given the scaled height,
     with the transform pinned to the top of that box. One observer, only where the scale is not 1. */
  const card = React.useRef<HTMLDivElement | null>(null);
  const [tall, setTall] = React.useState(0);
  React.useLayoutEffect(() => {
    if (scale === 1) return undefined;
    const node = card.current;
    if (!node) return undefined;
    const read = () => setTall(node.offsetHeight);
    read();
    const watch = new ResizeObserver(read);
    watch.observe(node);
    return () => watch.disconnect();
  }, [scale]);

  const rim = `color-mix(in srgb, ${theme.colors.contentInversePrimary} 16%, ${theme.colors.backgroundInversePrimary})`;
  const quiet = `color-mix(in srgb, ${theme.colors.contentInversePrimary} 62%, ${theme.colors.backgroundInversePrimary})`;

  return (
    /* ⚠ NO `minHeight: 0` HERE. It let a grid that was short of room SQUASH this box while the
       card inside it went on painting its own height — so on a 360 x 740 phone the referral
       screen's seats were drawn straight through the bottom of the card. The box keeps its own
       height, so a screen that asks for more than it has overflows VISIBLY and gets fixed. */
    <div className={css({
      display: 'grid', placeItems: 'center', minWidth: 0,
      perspective: '900px',
      paddingLeft: theme.sizing.scale600, paddingRight: theme.sizing.scale600,
    })}>
      <div className={css({
        minWidth: 0,
        transformStyle: 'preserve-3d',
        /* the box is the card at the size it is PAINTED, so whatever stands under it starts there */
        ...(scale !== 1 && tall > 0 ? { height: `${Math.round(tall * scale)}px` } : {}),
        transformOrigin: 'top center',
        transform: settled || still
          ? `translate3d(0,0,0) rotateX(0deg) scale(${scale})`
          : `translate3d(0,-40px,0) rotateX(18deg) scale(${scale * 0.92})`,
        opacity: settled || still ? 1 : 0,
        transitionProperty: 'opacity, transform',
        transitionDuration: still ? '0ms' : `${MS.land}ms`,
        transitionTimingFunction: SPRING.land,
      })}>
        <div className={css({
          minWidth: 0,
          transform: still || !idle ? 'rotateY(0deg)' : tilted ? 'rotateY(2deg)' : 'rotateY(-2deg)',
          transitionProperty: 'transform',
          transitionDuration: still || !idle ? '0ms' : '3000ms',
          transitionTimingFunction: 'cubic-bezier(.4,0,.6,1)',
        })}>
          <div ref={card} data-testid={testId} data-place={place || ''} data-reference={reference}
            data-pass-yape={yape ? 'yes' : 'open'}
            className={css({
              position: 'relative',
              /* THE CARD'S OWN WIDTH, and never wider than the phone it stands on. `border-box`,
                 because the padding and the rim are part of the card rather than additions to it:
                 read as content the card measured 382 px on a 390 px phone and stood on the
                 screen's own edges. */
              boxSizing: 'border-box',
              width: 'min(340px, calc(100vw - 48px))',
              /* how TALL it stands is the caller's `scale`, measured above, because a percentage
                 max-height against an auto-height parent is inert and would have been a comment
                 pretending to be a rule. The stage clips whatever is left. */
              display: 'grid',
              gap: theme.sizing.scale500,
              paddingTop: theme.sizing.scale700,
              paddingBottom: theme.sizing.scale700,
              paddingLeft: theme.sizing.scale700,
              paddingRight: theme.sizing.scale700,
              borderRadius: theme.borders.radius500,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: rim,
              /* A STEP LIGHTER THAN THE STAGE IT STANDS ON, so the card reads as an object lying on
                 the ground rather than as a hole in it. */
              backgroundColor: `color-mix(in srgb, ${theme.colors.contentInversePrimary} 7%, ${theme.colors.backgroundInversePrimary})`,
              color: theme.colors.contentInversePrimary,
              boxShadow: '0 22px 48px rgba(0,0,0,0.42)',
              minWidth: 0,
            })}>
            {/* THE LABEL, AND THE MARK — the company's own, masked so it takes the card's ink
                rather than carrying a colour of its own (`shell/rail.tsx`'s rule: lift, never
                redraw). */}
            <span className={css({
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: theme.sizing.scale400, minWidth: 0,
            })}>
              <span className={css({
                ...theme.typography.LabelXSmall,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: quiet,
              })}>{w.passLabel}</span>
              <span aria-hidden className={css({
                width: '26px', height: '26px', flexShrink: 0,
                backgroundColor: theme.colors.contentInversePrimary,
                opacity: 0.62,
                WebkitMaskImage: 'url(/brand/rocoto-mark.svg)',
                maskImage: 'url(/brand/rocoto-mark.svg)',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
              })} />
            </span>

            {/* THE NAME — the line the shop writes on screen 4, mirrored here as it types. */}
            <PassLine known={Boolean(name)} bar="76%" complete={complete} testId={nameTestId}>
              <strong className={css({
                display: 'block',
                fontFamily: theme.typography.HeadingLarge.fontFamily,
                fontWeight: 700,
                fontSize: `${nameSize(name)}px`,
                lineHeight: `${nameSize(name) + 5}px`,
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              })}>{name}</strong>
            </PassLine>

            {!compact && <PassLine known={Boolean(kind)} bar="44%" complete={complete}>
              <span className={css({ ...theme.typography.LabelSmall, color: quiet })}>
                {kind ? (w[KIND_CAPTION[kind]] as string) : ''}
              </span>
            </PassLine>}

            {!compact && <PassLine known={Boolean(address)} bar="66%" complete={complete}>
              <span className={css({
                ...theme.typography.ParagraphSmall, color: quiet,
                display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              })}>{address}</span>
            </PassLine>}

            <span aria-hidden className={css({
              display: 'block', height: '1px', backgroundColor: rim,
            })} />

            {/* THE PLACE, AND THE REFERENCE THIS BUSINESS IS KNOWN BY. */}
            <span className={css({
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              gap: theme.sizing.scale400, flexWrap: 'wrap', minWidth: 0,
            })}>
              <span className={css({
                fontFamily: theme.typography.DisplayLarge.fontFamily,
                fontWeight: 700,
                fontSize: '46px',
                lineHeight: '48px',
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
              })}>
                {/* THE FIGURE CARRIES ITS OWN VALUE, counted or printed, so a drive reads the
                    number the service gave beside the one the screen is showing. */}
                {place > 0
                  ? (count
                    ? <CountUp to={place} from={countFrom} ms={countMs} still={still} prefix="#" testId={placeTestId} />
                    : <span data-testid={placeTestId} data-value={place}>#{figure(place)}</span>)
                  : <span data-testid={placeTestId}>#·</span>}
              </span>
              <PassLine known={Boolean(reference)} bar="42%" complete={complete}>
                <span className={css({
                  ...theme.typography.LabelSmall, color: quiet, letterSpacing: '0.06em',
                })}>{w.passReference(reference)}</span>
              </PassLine>
            </span>

            {/* THE YAPE CHIP — it appears on the pass once the shop has connected its own, which is
                what makes screen 7 land on an object rather than on a record. */}
            {(yape || sample) && <span className={css({
              display: 'flex', alignItems: 'center', gap: theme.sizing.scale400,
              flexWrap: 'wrap', minWidth: 0,
            })}>
              {yape && <span data-testid={`${testId}-yape`} className={css({
                display: 'inline-grid', placeItems: 'center',
                minWidth: '52px', height: '24px',
                paddingLeft: theme.sizing.scale300, paddingRight: theme.sizing.scale300,
                borderRadius: theme.borders.radius200,
                backgroundColor: YAPE.purple,
                color: YAPE.onPurple,
                ...theme.typography.LabelXSmall,
                animationName: still ? undefined : { '0%': { transform: 'scale(0.4)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
                animationDuration: `${MS.land}ms`,
                animationTimingFunction: SPRING.land,
              })}>Yape</span>}
              {sample && <span data-testid={sampleTestId} className={css({
                ...theme.typography.LabelXSmall, color: quiet,
              })}>{sample}</span>}
            </span>}
          </div>
        </div>
      </div>
    </div>
  );
}
