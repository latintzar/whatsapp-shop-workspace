/* SCREEN 10 · DONE — `You’re in` (ONBOARDING-SPEC.md §0, screen 10).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening): «and then once done, well they're
 * done. the final button can be "say hi to rocoto in Whatsapp" and they tpa that and it says hi to
 * rocoto acos they just signed up (include a ref numbr if you want) and boom we're in their
 * whatsapp and signed up now.»
 *
 * ═══ THE PASS, COMPLETE ═════════════════════════════════════════════════════════════════════
 * The card the shop received on the celebration, with every line the walk asked for filled in: its
 * name, its trade, its address, the Yape it connected, its place and its reference
 * (`start/pass.tsx`). It settles in under a smaller burst of confetti, and it is the object a
 * person screenshots. Every figure on it is the service's own (`GET /api/bodega/waitlist`); the
 * reference IS the referral code, which is the one public name this business has.
 *
 * ═══ THE BUDDY, AND WHAT OPENS THE WINDOW ═══════════════════════════════════════════════════
 * `Say hi to Rocoto on WhatsApp` opens the shop's own chat with Rocoto's number, with the greeting
 * and its reference already written. THAT MESSAGE IS WHAT OPENS THE 24-HOUR WINDOW, so the buddy
 * can answer inside it — and the answer is the reviewed notice path, a fixed kind to the SESSION's
 * own number, never free text and never another number (`mock-api/app/bodega.py`, `Notice`).
 * The screen claims no delivery: it states where Rocoto is, and offers the act that opens the
 * window.
 *
 * ═══ AND THEN THE APP ═══════════════════════════════════════════════════════════════════════
 * `Open Rocoto` lands on Prep, which is home. The install stands beside it where the browser
 * offers one: over HTTPS with a manifest and icons at 192 and 512 the browser holds its own
 * prompt, and where it holds none — every iOS Safari — the same press opens iPhone's three steps.
 * `installed` is recorded from the browser alone, on `appinstalled` or `display-mode: standalone`
 * (§268 QA item 1).
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { WorkflowDialog } from '../workflow-dialog';
import { markInstalled, markReached, readStage } from '../stage';
import { Confetti } from './confetti';
import { forgetDraft, markOnboarded, readDraft, useWaitlist } from './joining';
import { Pass } from './pass';
import { ROCOTO_NUMBER, connectedAccount, notify, sayHiLink } from './session';
import { MS, WalkAct, WalkQuiet, WalkScreen, useEntered, useStillness, tap } from './walk';
import { useWords } from './words';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };

export default function Done() {
  const [css, theme] = useStyletron();
  const { w } = useWords();
  const still = useStillness();
  const { standing } = useWaitlist();
  const [draft] = React.useState(() => readDraft());
  const [prompt, setPrompt] = React.useState<InstallEvent | null>(null);
  const [installed, setInstalled] = React.useState(() => readStage().installed);
  const [steps, setSteps] = React.useState(false);
  const [saidHi, setSaidHi] = React.useState(false);
  const [burst, setBurst] = React.useState(false);
  const card = useEntered(120);

  React.useEffect(() => { markReached('done'); }, []);

  /* ═══ THE WALK IS WALKED, AND THE SERVICE IS TOLD ═════════════════════════════════════════
     Peter, 20 September 2026: «if they didn tmessage the buddy for 5 minutes after they finished
     the las tonbaroding step, we should messages them with imeta template just giving them their
     waitlist status link and saying hello». Reaching this screen IS that last step, so it is
     recorded here, once, and the buddy's own five-minute clock starts from the service's record
     (`mock-api/app/bodega.py`). The call is idempotent and its answer moves nothing here: a rig
     with no session behind it refuses it, and the shop is done either way. */
  React.useEffect(() => { void markOnboarded().catch(() => undefined); }, []);

  /* THE CLOSING MESSAGE, ATTEMPTED ONCE, to the number the session holds. The name is the
     connection's own, which is the `{{1}}` MESSAGES.md row 7 states. Whether it ARRIVES depends on
     an open window or an approved template, so its answer moves nothing on this screen. */
  React.useEffect(() => {
    void connectedAccount().then((account) => notify('closing', account.name)).catch(() => undefined);
  }, []);

  /* THE SMALLER BURST, once the card has something to celebrate. */
  React.useEffect(() => {
    if (!standing || burst) return undefined;
    const timer = window.setTimeout(() => setBurst(true), 220);
    return () => window.clearTimeout(timer);
  }, [standing, burst]);

  /* ═══ WHAT MARKS THIS PAGE INSTALLED (§268 QA item 1) ══════════════════════════════════════
     TWO FACTS, AND THE BROWSER STATES BOTH: the `appinstalled` event, and a page already running
     in its own window (`display-mode: standalone`). Nothing else. */
  React.useEffect(() => {
    const running = window.matchMedia?.('(display-mode: standalone)');
    if (running?.matches) { setInstalled(true); markInstalled(); }
    const take = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    window.addEventListener('beforeinstallprompt', take);
    const done = () => { setInstalled(true); markInstalled(); };
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('beforeinstallprompt', take);
      window.removeEventListener('appinstalled', done);
    };
  }, []);

  /* READ FOR THE INK STAGE the pass lands on: saffron, the paper the ground is NOT, and a pale
     grey. The product's own ink would be black flakes falling on black. */
  const colours = React.useMemo(() => [
    theme.colors.accent,
    theme.colors.contentInversePrimary,
    theme.colors.backgroundTertiary,
  ], [theme]);

  const code = standing?.waitlist.referralCode ?? '';
  const place = standing?.waitlist.place ?? 0;

  const install = async () => {
    if (!prompt) { setSteps(true); return; }
    await prompt.prompt();
    setPrompt(null);
  };

  const openShop = () => {
    /* THE WALK'S OWN DRAFT IS DONE WITH; the record lives with the business now. */
    forgetDraft();
    window.location.hash = '#/prep';
  };

  return (
    <WalkScreen
      testId="start-done"
      step="done"
      over={<Confetti run={burst} still={still} colours={colours} testId="done-confetti" />}
      stage="ink"
      visual={
        /* THE PASS, COMPLETE — the object a shop screenshots and shows somebody. Every line the
           walk asked for is on it: the name, the trade, the address, the Yape it connected, the
           place and the reference (`start/pass.tsx`). */
        <div className={css({
          display: 'grid', alignContent: 'center', height: '100%', minHeight: 0,
          opacity: card || still ? 1 : 0,
          transitionProperty: 'opacity',
          transitionDuration: still ? '0ms' : `${MS.move}ms`,
        })}>
          <Pass
            testId="done-card"
            nameTestId="done-name"
            placeTestId="done-place"
            sampleTestId="done-sample"
            name={draft.name || 'Your business'}
            kind={draft.kind}
            address={draft.address?.text ?? ''}
            place={place}
            reference={code}
            yape={draft.yape}
            sample={standing?.source === 'sample' ? w.sampleSays : ''}
            land
            idle
          />
        </div>
      }
      title={w.doneTitle}
      sentence={w.doneSentence}
      note={<span data-testid="done-stands">{w.doneStands(ROCOTO_NUMBER)}</span>}
      act={saidHi
        ? <WalkAct testId="done-open" onClick={openShop}>{w.openRocoto}</WalkAct>
        : <WalkAct testId="done-whatsapp" href={sayHiLink(w.greeting(draft.name || w.yourBusiness, code))} target="_blank"
          onClick={() => { tap(still, 12); setSaidHi(true); }}>{w.doneSayHi}</WalkAct>}
      quiet={saidHi
        ? (installed ? undefined : <WalkQuiet testId="done-install" onClick={() => { void install(); }}>{w.install}</WalkQuiet>)
        : <WalkQuiet testId="done-open-later" onClick={openShop}>{w.openRocoto}</WalkQuiet>}
    >
      {/* IPHONE'S OWN PATH, IN ITS OWN SHEET. Safari installs a page from the Share menu and offers
          a page no prompt of its own, so the act opens the three steps and the shop takes them
          there; the install marks itself from the browser's own word for it. */}
      {steps && <WorkflowDialog isOpen title={w.install} onClose={() => setSteps(false)} testId="done-steps"
        actions={<Button onClick={() => setSteps(false)}
          overrides={{ BaseButton: { props: { 'data-testid': 'done-steps-done' }, style: { minHeight: '48px' } } }}>{w.installDone}</Button>}>
        <ol data-testid="done-steps-list" className={css({ display: 'grid', gap: theme.sizing.scale500, margin: 0, paddingLeft: theme.sizing.scale700 })}>
          {w.installSteps.map((step) => (
            <li key={step} className={css({ ...theme.typography.ParagraphMedium })}>{step}</li>
          ))}
        </ol>
      </WorkflowDialog>}
    </WalkScreen>
  );
}

export const meta = { id: 'done', title: 'You’re in', owner: 'BODEGA-START', panes: false };
