/* SCREEN 9 · BRING BUSINESSES — `Move up the list` (ONBOARDING-SPEC.md §0, screen 9).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening): «if they refer they can get another
 * free credit for every 3 bodegas that sign up or some shit», «we make them refer their friends
 * with a nice social sharing thing».
 *
 * ═══ WHAT THE REWARD IS CALLED ══════════════════════════════════════════════════════════════
 * «Every three businesses that join through you cover one more of your purchases.» That wording is
 * the one this product is allowed to use: it states no rate, no fee, no amount, no term and no
 * approval, and it never calls anything free credit (the credit law, DESIGN-SPEC.md §6).
 *
 * ═══ THE PASS AND THE THREE SEATS UNDER IT ══════════════════════════════════════════════════
 * The stage carries the shop's own pass, complete (`start/pass.tsx`), and under it THREE EMPTY
 * SEATS labelled «3 businesses = 1 more covered purchase». That is the ask, drawn: a row of open
 * rings is a thing to fill, and filling it is the act at the foot. Every figure on the card and in
 * the seats is the service's own (`GET /api/bodega/waitlist`); this screen does no arithmetic.
 *
 * ⚠ IT WAS THE SAME NUMBER ON WHITE, AGAIN. The place stood at 68 px in the middle of a white
 * screen — the figure the celebration had just shown at 84 px — over three 12 px dots, and the
 * message about to be shared was a grey box with a raw URL in it.
 *
 * ═══ AND COMING BACK FROM THE SHARE SHEET, THE PLACE DROPS ══════════════════════════════════
 * The share hands the message to the system sheet; on return the screen asks the service for the
 * place again. Where a business actually joined through this link in the meantime, the number
 * COUNTS DOWN from the one that was standing to the one the service now gives — so the reward is
 * something the shop watches happen rather than something it is told about. Where nothing moved,
 * the number stands, because a drop the service did not make is a lie.
 *
 * ═══ THE MESSAGE IS DRAWN AS A MESSAGE ═════════════════════════════════════════════════════
 * The invitation is previewed as an outgoing WhatsApp bubble — their own pale green, the tail, the
 * time and the double tick — with the address shortened to the host and the code, which is what a
 * person reads in a chat. What is handed over is the whole URL; the bubble carries it on `data-url`.
 *
 * ═══ NOTHING IS SENT BY THE APP ═════════════════════════════════════════════════════════════
 * `navigator.share` opens the owner's own sheet; a browser without one copies the link and says
 * so. Either way the owner picks who gets it and presses send themselves.
 *
 * ═══ AND THE MOMENT IT IS SHARED, THE WALK HAS A DOOR ═══════════════════════════════════════
 * The critical path ends here (ONBOARDING-SPEC.md §1), so the share is acknowledged — a tick and
 * one sentence — and the act at the foot becomes `Finish joining`, with sharing again as the quiet
 * second way. A sheet the owner closed changes nothing: the act stays `Share my link`.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { WHATSAPP, WHATSAPP_BUBBLE_TINT } from '../../../rocoto-theme';
import { markReached } from '../stage';
import { MOVE_UP, PER_COVERED_PURCHASE, readDraft, sellsOnward, useWaitlist } from './joining';
import { Pass } from './pass';
import { Seats } from './seats';
import { handOver } from './share';
import {
  DrawnTick, MS, SPRING, WalkAct, WalkQuiet, WalkScreen, goTo, stepsFor, useEntered,
  useStillness, useViewportHeight, tap,
} from './walk';
import { useWords } from './words';

/* THE THREE SEATS UNDER THE PASS stand in `start/seats.tsx`, because the status page the buddy's
 * first message links to draws the same row (`start/lista.tsx`).
 */

/** THE LINK AS IT READS IN A CHAT — the host and the code, which is all a person takes in. What is
 *  SHARED is the whole address; this is the picture of it. */
export function shortLink(url: string): string {
  try {
    const at = new URL(url);
    const code = at.hash.split('/').filter(Boolean).pop() ?? '';
    return code ? `${at.host}/r/${code}` : at.host;
  } catch { return url; }
}

/** THE DOUBLE TICK a sent message carries. Drawn, because it is two strokes. */
function DoubleTick({ colour }: { colour: string }) {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" aria-hidden style={{ display: 'block', flexShrink: 0 }}>
      <path d="M1 6.6 L4.2 9.8 L10.2 2.2" fill="none" stroke={colour} strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.4 6.6 L9.6 9.8 L15.6 2.2" fill="none" stroke={colour} strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Referrals() {
  const [css, theme] = useStyletron();
  const { lang, w } = useWords();
  const still = useStillness();
  const { standing, again } = useWaitlist();
  const height = useViewportHeight();
  const [draft] = React.useState(() => readDraft());
  /* THE TIME THE BUBBLE CARRIES is this phone's own, read once: the message is about to be sent,
     so the time on it is now. */
  const [sentAt] = React.useState(() =>
    new Date().toLocaleTimeString(lang === 'es' ? 'es-PE' : 'en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [says, setSays] = React.useState('');
  /* ⚠ THE SCREEN HAD NO DOOR ONCE THE MESSAGE WAS HANDED OVER. The critical path ends the moment
     the referral is shared (ONBOARDING-SPEC.md §1), and the act still read `Share my link` while
     the only way to `You're in` was a quiet button saying `Skip for now` — a false label for
     somebody who has just shared. So the share is a state: once the link has left THIS SCREEN by
     any of its three roads — the system sheet, the clipboard, or printed for the shop to select —
     the act carries the walk on and sharing again is the quiet second way. A sheet the owner
     CLOSED is the one case that changes nothing: they backed out, so the act stays `Share my
     link`. The tick belongs to the two roads that actually took the words. */
  const [handed, setHanded] = React.useState<'' | 'sheet' | 'clipboard' | 'printed'>('');
  /* THE PLACE THE SCREEN WAS SHOWING before the share sheet opened — what the count-down starts
     from where the service has since moved this business up. */
  const held = React.useRef<number | null>(null);
  const bubble = useEntered(220);

  React.useEffect(() => { markReached('referrals'); }, []);

  const place = standing?.waitlist.place ?? 0;
  const joined = standing?.waitlist.joinedThroughYou ?? 0;
  const covered = standing?.waitlist.coveredPurchases ?? 0;
  const url = standing?.waitlist.referralUrl ?? '';
  const body = w.invitation(draft.name, url);
  /* what the bubble SHOWS: the same words with the address read the way a person reads one */
  const shown = url ? body.replace(url, shortLink(url)) : body;
  const from = held.current !== null && held.current > place ? held.current : undefined;

  const steps = stepsFor(sellsOnward(draft.kind));

  const share = async () => {
    held.current = place;
    tap(still, 12);
    /* THE OWNER'S OWN SHEET, THE CLIPBOARD, OR THE WORDS ON THE SCREEN (`start/share.ts`). Every
       path there hands the words over; none of them sends. A sheet the owner CLOSED answers with
       nothing, and the act stays `Share my link`. */
    const road = await handOver({ title: w.shareTitle, text: body, url });
    setHanded(road);
    setSays(road === 'clipboard' ? w.clipboardSays : road === 'printed' ? w.printedSays(url) : '');
    again();
  };

  return (
    <WalkScreen
      testId="start-referrals"
      step="referrals"
      steps={steps}
      stage="ink"
      visual={
        /* THE PASS, COMPLETE, AND THE SEATS IT IS TRYING TO FILL. */
        <div data-testid="referrals-place" data-place={place || ''}
          className={css({
            boxSizing: 'border-box',
            display: 'grid', justifyItems: 'center', alignContent: 'center',
            gap: theme.sizing.scale400,
            height: '100%', minHeight: 0,
            paddingBottom: theme.sizing.scale700,
          })}>
          <Pass
            testId="referrals-pass"
            placeTestId="referrals-number"
            sampleTestId="referrals-sample"
            name={draft.name}
            kind={draft.kind}
            address={draft.address?.text ?? ''}
            place={place}
            reference={standing?.waitlist.referralCode ?? ''}
            yape={draft.yape}
            sample={standing?.source === 'sample' ? w.sampleSays : ''}
            count
            countFrom={from}
            countMs={700}
            /* THE PASS SHARES THIS STAGE with the three seats, so it stands smaller than it does on
               the celebration — and smaller again on a short phone, where the bubble under the
               words takes room the stage would otherwise have. */
            scale={(height ?? 844) >= 800 ? 0.82 : 0.56}
          />
          <Seats filled={joined % PER_COVERED_PURCHASE} total={PER_COVERED_PURCHASE} still={still}
            label={w.seatsLabel(PER_COVERED_PURCHASE)} />
        </div>
      }
      title={w.referralsTitle}
      sentence={w.referralsSentence(PER_COVERED_PURCHASE)}
      note={handed === 'sheet' || handed === 'clipboard'
        ? <span data-testid="referrals-shared" className={css({
          display: 'inline-flex', alignItems: 'center', gap: theme.sizing.scale300,
          color: theme.colors.contentPrimary,
        })}>
          <DrawnTick size={16} still={still} />
          {says || w.sharedSays}
        </span>
        : says ? <span data-testid="referrals-says">{says}</span> : undefined}
      act={handed
        ? <WalkAct testId="referrals-done" onClick={() => goTo('done')}>{w.finishJoining}</WalkAct>
        : <WalkAct testId="referrals-share" onClick={() => { void share(); }}>{w.shareLink}</WalkAct>}
      quiet={handed
        ? <WalkQuiet testId="referrals-share-again" onClick={() => { void share(); }}>{w.shareAgain}</WalkQuiet>
        : <WalkQuiet testId="referrals-later" onClick={() => goTo('done')}>{w.skip}</WalkQuiet>}
    >
      <span data-testid="referrals-worth" className={css({
        ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary,
      })}>{w.worth(MOVE_UP)}</span>
      {covered > 0 && <p data-testid="referrals-covered"
        className={css({ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 })}>
        {w.covered(covered)}
      </p>}

      {/* ═══ THE MESSAGE, DRAWN AS IT WILL ARRIVE ═══════════════════════════════════════════
          ⚠ IT WAS A GREY BOX WITH A RAW URL IN IT. The owner is about to put this in front of
          somebody they sell to, so they should see the THING, not its text: an outgoing WhatsApp
          bubble in WhatsApp's own pale green, with the tail, the time and the double tick, and the
          address shortened to what a person actually reads — the host and the code. What is handed
          to the share sheet is the whole URL, which `data-url` carries for anything that checks. */}
      <div data-testid="referrals-preview" data-url={url} className={css({
        display: 'grid', justifyItems: 'end', minWidth: 0,
        paddingRight: theme.sizing.scale300,
        opacity: bubble || still ? 1 : 0,
        transform: bubble || still ? 'translate3d(0,0,0) scale(1)' : 'translate3d(0,10px,0) scale(0.96)',
        transformOrigin: 'bottom right',
        transitionProperty: 'opacity, transform',
        transitionDuration: still ? '0ms' : `${MS.land}ms`,
        transitionTimingFunction: SPRING.land,
      })}>
        <span className={css({
          position: 'relative',
          display: 'grid',
          gap: theme.sizing.scale100,
          maxWidth: '90%',
          minWidth: 0,
          overflowWrap: 'anywhere',
          /* WHATSAPP'S OWN OUTGOING GREEN, at the mix `rocoto-theme.ts` already states for the
             bubble in the emulated phone — the same licence, and the same recipe. */
          backgroundColor: `color-mix(in srgb, ${WHATSAPP.green} ${WHATSAPP_BUBBLE_TINT}%, ${theme.colors.backgroundPrimary})`,
          color: theme.colors.contentPrimary,
          paddingTop: theme.sizing.scale400,
          paddingBottom: theme.sizing.scale300,
          paddingLeft: theme.sizing.scale500,
          paddingRight: theme.sizing.scale500,
          borderTopLeftRadius: theme.borders.radius400,
          borderTopRightRadius: theme.borders.radius400,
          borderBottomLeftRadius: theme.borders.radius400,
          borderBottomRightRadius: theme.borders.radius100,
        })}>
          <span className={css({ ...theme.typography.ParagraphSmall })}>{shown}</span>
          <span className={css({
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: theme.sizing.scale200,
            ...theme.typography.LabelXSmall,
            color: theme.colors.contentSecondary,
          })}>
            {sentAt}<DoubleTick colour={theme.colors.contentSecondary} />
          </span>
          {/* THE TAIL — the little point a WhatsApp bubble hangs from, in the bubble's own green. */}
          <span aria-hidden className={css({
            position: 'absolute', right: '-6px', bottom: 0,
            width: 0, height: 0,
            borderLeftWidth: '8px', borderLeftStyle: 'solid',
            borderLeftColor: `color-mix(in srgb, ${WHATSAPP.green} ${WHATSAPP_BUBBLE_TINT}%, ${theme.colors.backgroundPrimary})`,
            borderBottomWidth: '8px', borderBottomStyle: 'solid', borderBottomColor: 'transparent',
          })} />
        </span>
      </div>
    </WalkScreen>
  );
}

export const meta = { id: 'referrals', title: 'Move up the list', owner: 'BODEGA-START', panes: false };
