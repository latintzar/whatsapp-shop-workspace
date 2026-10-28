/* SCREEN 3 · `You're on the waitlist!` (ONBOARDING-SPEC.md §0, screen 3).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening), verbatim: «one they connect whatsapp
 * they have to be hit by a "Youre on the Waitlis!"t! confetti t and then next.ype but nxt say
 * "confirm details" as the finl steps. if should be high excitement the whole time and really feel
 * liek they're joinging something.»
 *
 * ═══ THIS IS WHERE THE SHOP RECEIVES ITS PASS ═══════════════════════════════════════════════
 * The moment reads as joining because the shop is GIVEN AN OBJECT: the pass (`start/pass.tsx`),
 * with its place on it and every other line still an open bar. «Confirm details» is then the rest
 * of that same card being filled in, which is what the three screens after this one do.
 *
 * ⚠ IT WAS A NUMBER ON WHITE. The place was set at 84 px in the middle of a white screen with a
 * wash behind it: nothing was received, so nothing was joined, and the celebration was a receipt.
 *
 * ═══ THE MOMENT, IN THE ORDER IT HAPPENS ════════════════════════════════════════════════════
 *   0 ms    the screen is there, the ink stage full-bleed to the top, the act already pressable
 *   40 ms   the pass LANDS — from 40 px above, tilted 18° away, at 92%, settling on `SPRING.land`
 *   0 ms    the place counts up to its own number on an out-quint, about 900 ms, ON the pass
 *   140 ms  confetti bursts from the stage's lower corners — 1.2 s, clipped to the stage, so it
 *           never falls over the words or the button
 *   320 ms  the line saying how many businesses are ahead fades up under it
 *   then    the pass tilts, slowly, two degrees either way — the one endless movement here
 *
 * ═══ THE NUMBER IS THE SERVICE'S ════════════════════════════════════════════════════════════
 * `GET /api/bodega/waitlist` mints a place for this number the first time the connection reports
 * it and reads it back for ever after (`mock-api/app/bodega.py`). The page does no arithmetic on
 * it. Where no connection service answers — local development — the SAMPLE world's own seeded
 * place stands and the screen says `Sample waitlist` beside it, the same rule the read already
 * follows with `Sample chats`.
 *
 * ═══ AND THE ACT UNDER IT NAMES THE REST OF THE WALK ════════════════════════════════════════
 * `Confirm details`, Peter's own words, so everything after this reads as the last steps of
 * joining rather than a new form.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { markReached } from '../stage';
import { Confetti } from './confetti';
import { readDraft, useWaitlist } from './joining';
import { Pass } from './pass';
import { WalkAct, WalkScreen, goTo, useEntered, useStillness } from './walk';
import { useWords } from './words';

export default function Waitlist() {
  const [css, theme] = useStyletron();
  const { w } = useWords();
  const still = useStillness();
  const { standing } = useWaitlist();
  const [draft] = React.useState(() => readDraft());
  const shown = useEntered(320);
  const [burst, setBurst] = React.useState(false);

  React.useEffect(() => { markReached('waitlist'); }, []);

  /* THE BURST WAITS FOR THE NUMBER. Confetti over a blank figure celebrates nothing, so it fires
     a beat after the place has landed — and once, whatever else re-renders. */
  React.useEffect(() => {
    if (!standing || burst) return undefined;
    const timer = window.setTimeout(() => setBurst(true), 140);
    return () => window.clearTimeout(timer);
  }, [standing, burst]);

  /* THE COLOURS ARE THE THEME'S OWN (`app/tools/theme-gate.mjs` forbids a literal), AND THEY ARE
     READ FOR AN INK GROUND: the burst falls on the dark stage, so the product's ink would be a
     shower of black flakes on black. Saffron, the paper the stage is NOT, and a pale grey. */
  const colours = React.useMemo(() => [
    theme.colors.accent,
    theme.colors.contentInversePrimary,
    theme.colors.backgroundTertiary,
  ], [theme]);

  const place = standing?.waitlist.place ?? 0;
  const ahead = standing?.waitlist.ahead ?? 0;

  return (
    <WalkScreen
      testId="start-waitlist"
      step="waitlist"
      stage="ink"
      over={<Confetti run={burst} still={still} colours={colours} testId="waitlist-confetti" />}
      visual={
        /* THE PASS LANDS. It arrives from above, tilted, and settles on the walk's own spring; the
           place counts up ON it; and then it breathes with a slow tilt while the shop reads. */
        <div data-testid="waitlist-place" data-place={place || ''}
          className={css({ display: 'grid', alignContent: 'center', height: '100%', minHeight: 0 })}>
          <Pass
            testId="waitlist-pass"
            placeTestId="waitlist-number"
            sampleTestId="waitlist-sample"
            name={draft.name}
            kind={draft.kind}
            address={draft.address?.text ?? ''}
            place={place}
            reference={standing?.waitlist.referralCode ?? ''}
            yape={draft.yape}
            sample={standing?.source === 'sample' ? w.sampleSays : ''}
            count
            land
            idle
          />
        </div>
      }
      title={w.waitlistTitle}
      sentence={w.waitlistSentence}
      act={<WalkAct testId="waitlist-confirm" onClick={() => goTo('business')}>{w.waitlistAct}</WalkAct>}
    >
      {standing && <p data-testid="waitlist-ahead" data-ahead={ahead}
        className={css({
          ...theme.typography.ParagraphMedium,
          color: theme.colors.contentSecondary,
          margin: 0,
          opacity: shown ? 1 : 0,
          transform: shown ? 'translate3d(0,0,0)' : 'translate3d(0,8px,0)',
          transitionProperty: 'opacity, transform',
          transitionDuration: still ? '0ms' : '420ms',
          transitionTimingFunction: 'cubic-bezier(.2,.8,.3,1)',
        })}>
        {w.ahead(ahead)}
      </p>}
    </WalkScreen>
  );
}

export const meta = { id: 'waitlist', title: 'You’re on the waitlist', owner: 'BODEGA-START', panes: false };
