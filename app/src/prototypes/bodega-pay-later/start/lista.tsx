/* THE STATUS PAGE — `#/lista/<CODE>`, the link the buddy sends first (ONBOARDING-SPEC.md §0).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, night), verbatim: «ok so the whole signup
 * onboarding and their persistent waiting list position and referral tracker? should be a link the
 * buddy sends as the first thing.»
 *
 * ═══ WHAT IT IS ═════════════════════════════════════════════════════════════════════════════
 * The shop's place and its referral tracker, on a page that OUTLIVES the walk: it is opened from a
 * WhatsApp message, on whatever phone that message landed on, with no session and no cookie. So it
 * stands on a PUBLIC read by referral code — `GET /api/bodega/status/<code>` — which carries what a
 * person may show somebody and no phone number and no address of its own (`start/joining.ts`).
 *
 * ═══ AND IT IS THE WALK'S OWN IDIOM ═════════════════════════════════════════════════════════
 * The same ink stage, the same pass (`start/pass.tsx`) with this business's name, trade, place and
 * reference on it, the same three seats under it (`start/seats.tsx`), and the same anchored act.
 * A shop opening this link recognises the card it was given while it was joining — which is the
 * whole point of the pass. There is NO progress row: nobody standing here is part-way through
 * anything.
 *
 * ═══ THE ACT IS THE ONE THING THIS PAGE IS FOR ══════════════════════════════════════════════
 * «Share my link» hands the invitation to the owner's own share sheet, exactly as screen 9 does
 * (`start/share.ts`) — nothing here sends anything. The quiet second act opens the shop's own chat
 * with Rocoto, which is where the buddy answers.
 *
 * ═══ ITS LANGUAGE ═══════════════════════════════════════════════════════════════════════════
 * The address first — a person handed a link can ask for English — then the LANGUAGE ON THE
 * BUSINESS'S OWN ROW, which is the language it signed up in (`start/words.ts`). So a Lima shop's
 * status page is Spanish wherever it is opened.
 *
 * ═══ AND WHERE NO SERVICE ANSWERS ═══════════════════════════════════════════════════════════
 * A code the service holds no row for is its own `bodega_status_unknown`, and this page names the
 * waitlist and offers the way in. A service that has yet to answer at all — local development, a
 * review build — is the SAMPLE world, like every other screen of the walk, and the card says
 * «Lista de muestra» beside the figure so a number nobody gave is never passed off as one they did.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { HeroArtwork } from '../hero-artwork';
import {
  MOVE_UP, PER_COVERED_PURCHASE, SAMPLE_WAITLIST, STATUS_UNKNOWN, dropListaQuery, readStatus,
  type BusinessKind, type PublicStatus,
} from './joining';
import { Pass } from './pass';
import { Seats } from './seats';
import { sayHiLink } from './session';
import { handOver } from './share';
import { WalkAct, WalkQuiet, WalkScreen, useStillness, tap } from './walk';
import { useWords, type Lang } from './words';

/** `#/lista/<CODE>` — the page's own address, read the way every other surface reads its tail. */
export function codeOf(hash: string): string {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  try { return decodeURIComponent(parts[1] ?? '').toUpperCase(); } catch { return (parts[1] ?? '').toUpperCase(); }
}

function useCode(): string {
  const [hash, setHash] = React.useState(() => window.location.hash);
  React.useEffect(() => {
    const read = () => setHash(window.location.hash);
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  return codeOf(hash);
}

/** WHAT THE PAGE IS STANDING ON: the service's own row, the seeded one, or a code with no row. */
type Standing =
  | { kind: 'service'; status: PublicStatus }
  | { kind: 'sample'; status: PublicStatus }
  | { kind: 'unknown' };

/** THE SAMPLE WORLD'S OWN STANDING, seeded beside its chats and its money (`fixtures/README.md`). */
const sampleStatus = (code: string): PublicStatus => ({
  name: 'Bodega Yesenia',
  kind: 'bodega',
  place: SAMPLE_WAITLIST.place,
  ahead: SAMPLE_WAITLIST.ahead,
  joined: 0,
  covered: 0,
  referral_url: `${window.location.origin}${window.location.pathname}#/r/${code}`,
  language: '',
});

export default function Lista() {
  const [css, theme] = useStyletron();
  const still = useStillness();
  const code = useCode();
  const [standing, setStanding] = React.useState<Standing | null>(null);
  const [says, setSays] = React.useState('');
  const [handed, setHanded] = React.useState<'' | 'sheet' | 'clipboard' | 'printed'>('');

  /* THE LINK'S OWN QUERY IS SPENT once the address has become the route, so a press that leaves
     this page for the walk is never pulled back here (`start/joining.ts`). Nothing about the WALK
     is recorded here: this page is outside it, and the stage record is the walk's own memory. */
  React.useEffect(() => { dropListaQuery(); }, []);

  React.useEffect(() => {
    if (!code) { setStanding({ kind: 'unknown' }); return undefined; }
    let live = true;
    void readStatus(code).then((answer) => {
      if (!live) return;
      if (answer.ok) { setStanding({ kind: 'service', status: answer.value }); return; }
      setStanding(answer.code === STATUS_UNKNOWN
        ? { kind: 'unknown' }
        : { kind: 'sample', status: sampleStatus(code) });
    });
    return () => { live = false; };
  }, [code]);

  /* THE LANGUAGE THE ROW WAS WRITTEN IN, where the service answered with one. */
  const held = standing && standing.kind !== 'unknown' ? standing.status.language : '';
  const { w } = useWords(held === 'en' || held === 'es' ? (held as Lang) : '');

  const status = standing && standing.kind !== 'unknown' ? standing.status : null;
  const url = status?.referral_url ?? '';
  const body = status ? w.invitation(status.name, url) : '';

  const share = async () => {
    tap(still, 12);
    const road = await handOver({ title: w.shareTitle, text: body, url });
    setHanded(road);
    setSays(road === 'clipboard' ? w.clipboardSays : road === 'printed' ? w.printedSays(url) : '');
  };

  /* ── A CODE WITH NO ROW ─────────────────────────────────────────────────────────────────── */
  if (standing?.kind === 'unknown') {
    return (
      <WalkScreen
        testId="start-lista"
        step="lista"
        /* THE ARRIVAL'S OWN STAGE, because this screen leads to the arrival: the same bodeguera at
           her counter, so the way on is somewhere the person has already been told about rather
           than a dead end with a logo on it. */
        stage="picture"
        visual={<div data-testid="lista-unknown" className={css({ height: '100%', minHeight: 0 })}>
          <HeroArtwork kind="arrival" fill />
        </div>}
        title={w.listaUnknownTitle}
        sentence={w.listaUnknownSentence}
        act={<WalkAct testId="lista-join" onClick={() => { window.location.hash = '#/start'; }}>
          {w.listaJoin}
        </WalkAct>}
      />
    );
  }

  /* ── THE PLACE, AND THE SEATS THIS SHOP IS FILLING ──────────────────────────────────────── */
  return (
    <WalkScreen
      testId="start-lista"
      step="lista"
      stage="ink"
      visual={
        <div data-testid="lista-place" data-place={status?.place || ''}
          className={css({
            boxSizing: 'border-box',
            display: 'grid', justifyItems: 'center', alignContent: 'center',
            gap: theme.sizing.scale400,
            height: '100%', minHeight: 0,
            paddingBottom: theme.sizing.scale700,
          })}>
          <Pass
            testId="lista-pass"
            placeTestId="lista-number"
            sampleTestId="lista-sample"
            name={status?.name ?? ''}
            kind={(status?.kind ?? null) as BusinessKind | null}
            place={status?.place ?? 0}
            reference={code}
            sample={standing?.kind === 'sample' ? w.sampleSays : ''}
            lang={held === 'en' || held === 'es' ? (held as Lang) : ''}
            /* THE CARD IS FINISHED HERE. The public record carries no address, and a placeholder
               bar on this page would promise a screen that fills it (`start/pass.tsx`). */
            complete
            land
            idle
          />
          <Seats filled={(status?.joined ?? 0) % PER_COVERED_PURCHASE} total={PER_COVERED_PURCHASE}
            still={still} label={w.seatsLabel(PER_COVERED_PURCHASE)} />
        </div>
      }
      title={w.listaTitle}
      sentence={status ? w.ahead(status.ahead) : w.loading}
      note={says ? <span data-testid="lista-says">{says}</span> : undefined}
      act={<WalkAct testId="lista-share" onClick={() => { void share(); }}>
        {handed ? w.shareAgain : w.shareLink}
      </WalkAct>}
      quiet={<>
        <WalkQuiet testId="lista-say-hi" target="_blank"
          href={sayHiLink(w.greeting(status?.name ?? w.yourBusiness, code))}>{w.doneSayHi}</WalkQuiet>
        {/* YAPE IS CONNECTED FROM HERE NOW, the page the buddy's first message opens (Peter, 20
            September, night), so the sign-up itself stays short. */}
        <WalkQuiet testId="lista-yape" href="#/start/yape">{w.yapeTitle}</WalkQuiet>
      </>}
    >
      <span data-testid="lista-worth" className={css({
        ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary,
      })}>{w.worth(MOVE_UP)}</span>
      <p data-testid="lista-joined" data-joined={status?.joined ?? 0}
        className={css({ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 })}>
        {(status?.joined ?? 0) > 0 ? w.listaJoined(status?.joined ?? 0) : w.listaShareFirst}
      </p>
      {(status?.covered ?? 0) > 0 && <p data-testid="lista-covered"
        className={css({ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 })}>
        {w.covered(status?.covered ?? 0)}
      </p>}
    </WalkScreen>
  );
}

export const meta = { id: 'lista', title: 'Your place in the queue', owner: 'BODEGA-START', panes: false };
