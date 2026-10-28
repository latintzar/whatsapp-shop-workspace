/* SCREEN 1 · ARRIVAL — `Join the waitlist` (ONBOARDING-SPEC.md §0, screen 1).
 *
 * ═══ THE WORDS ARE PETER'S OWN, AND THEY SHIP AS HE WROTE THEM ══════════════════════════════
 * `BODY` below is his paragraph, verbatim, as one paragraph — it says what the connection is for,
 * what Rocoto learns from it, and what it is used to decide. It replaced a numbered list of three
 * rows in small grey type, which is a table of contents for a screen nobody had agreed to yet.
 * A shop reads ONE thing here and presses one act.
 *
 * THE ACT OPENS META'S OWN CONNECTION: there is one way on from here, `#/start/connect`, where
 * Cedar's walk runs Embedded Signup. The connection is what identifies the shop, so this screen
 * asks for no number.
 *
 * ═══ THE STAGE ══════════════════════════════════════════════════════════════════════════════
 * The bodeguera at her counter, full-bleed to the top of the phone, holding at least 44% of it
 * (`walk.tsx`, `stageFloor`). The words stand on paper under her and the act at the foot, which is
 * the anatomy every screen of this walk keeps.
 *
 * ═══ AND `Reset state` BELONGS TO WHOEVER IS REVIEWING ══════════════════════════════════════
 * It disconnects a real account and sweeps the browser, so it stands behind `?dev=1`
 * (`walk.tsx`, `devRig`) rather than under the act a shopkeeper is looking at.
 *
 * `#/r/<code>` REACHES THIS SCREEN CARRYING A CODE (`App.tsx` holds it and lands here). The code
 * is remembered through the connection and attributed the moment a session exists, so a business
 * that arrived through somebody's link moves that somebody up (`start/joining.ts`).
 *
 * WHAT IS REAL HERE. All of it. `Reset state` posts `/api/proof/whatsapp/disconnect` through the
 * source seam, clears every `rocoto-bodega-*` key (`store/keys.ts`) and this shop's row of the day
 * ledger it shares with Cedar, and posts `/api/bodega/session/reset` for the rig's own session and
 * referral records. It STAYS on this screen and says what it cleared, because a reset a person
 * cannot see is a reset they will press twice.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { chatSource } from '../source';
import { resetLocal } from '../store/keys';
import { forgetCovers } from '../covers';
import { forgetRead } from '../history/read';
import { markReached } from '../stage';
import { WHATSAPP_RESET_EVENT } from '../whatsapp-connection';
import { HeroArtwork } from '../hero-artwork';
import { forgetDraft, forgetReferral, heldReferral } from './joining';
import { distributor, forget, resetRig, useStanding } from './session';
import { WalkAct, WalkQuiet, WalkScreen, devRig, goTo, useStillness } from './walk';
import { useWords } from './words';

export default function Arrival() {
  const [css, theme] = useStyletron();
  /* THE TITLE, AND THE PARAGRAPH UNDER IT — Peter's own words in both languages, as he wrote them
     (`start/words.ts`, `arrivalTitle` and `arrivalBody`). */
  const { w } = useWords();
  const standing = useStanding();
  const still = useStillness();
  const [sent] = React.useState(() => distributor());
  const [invitedBy] = React.useState(() => heldReferral());
  const [cleared, setCleared] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  /* the rig's own door, read once (`walk.tsx`, `devRig`) */
  const [rig] = React.useState(() => devRig());

  React.useEffect(() => { markReached('arrival'); }, []);

  const reset = async () => {
    setBusy(true);
    try {
      const source = await chatSource();
      const dropped = await source.disconnect().then(() => true).catch(() => false);
      await resetRig();
      /* ── THE MEMORIES FIRST, THE SWEEP LAST ───────────────────────────────────────────────
         These drop what the keys alone would leave standing: this session's read, the covers
         already met, the door's own record, the connection store's snapshot and the walk's own
         draft. THREE OF THEM WRITE ON THE WAY OUT — `forgetCovers` publishes an empty book,
         `forget` publishes a signed-out stage, and the reset event republishes the connection —
         so running them after the sweep PUT THREE KEYS BACK the moment it finished. The sweep
         goes last, and it counts what it actually removed. */
      forgetRead();
      forgetCovers();
      forget();
      forgetDraft();
      forgetReferral();
      window.dispatchEvent(new CustomEvent(WHATSAPP_RESET_EVENT));
      /* ── AND THE DAY'S OWN LEDGER, THROUGH CEDAR'S VERB (`store/keys.ts`) ─────────────────
         Every act in this shop — a sale read, a line prepared, a sheet printed — is appended by
         `cedar/sale.ts` to `cedar/day.ts`'s store under `rocoto-app-day`, which the prefix sweep
         leaves standing. `resetDay` empties THIS shop's row, keeps the others, and tells the live
         ledger. It is asked for here rather than imported at the top so screen 1 stays the light
         chunk it is: the fold behind the day is the heaviest module in the app. */
      const [{ resetDay }, { BODEGA_CAST }] = await Promise.all([
        import('../../cedar/day'),
        import('../cast-cedar'),
      ]);
      resetDay(BODEGA_CAST.sector);
      const keys = resetLocal();
      /* the line says what happened in THIS world: the rig disconnects a real account, and the
         sample world holds a seeded one that signs the page back in on its next pass */
      setCleared(source.kind !== 'proof'
        ? w.rigClearedSample(keys.length)
        : dropped
          ? w.rigClearedDropped(keys.length)
          : w.rigClearedHeld(keys.length));
    } finally {
      setBusy(false);
    }
  };

  return (
    <WalkScreen
      testId="start-arrival"
      step="arrival"
      stage="picture"
      visual={<HeroArtwork kind="arrival" fill />}
      title={w.arrivalTitle}
      sentence={w.arrivalBody}
      /* A SHOP THAT IS ALREADY CONNECTED IS ASKED TO CARRY ON, not to connect again: the note under
         the words says `Connected · <number>`, and a button reading «Connect WhatsApp» beside it
         contradicted the line above it. The door is the same one either way. */
      act={<WalkAct testId="arrival-connect" onClick={() => goTo('connect')}>
        {standing.signed ? w.carryOn : w.arrivalConnect}
      </WalkAct>}
      note={standing.signed
        ? <span data-testid="arrival-signed">{w.arrivalConnected(standing.number)}</span>
        : standing.checking ? w.loading : undefined}
      quiet={rig
        ? <WalkQuiet testId="arrival-reset" onClick={() => { void reset(); }}>
          {busy ? w.rigClearing : w.rigReset}
        </WalkQuiet>
        : undefined}
    >
      {(sent || invitedBy) && <p data-testid="arrival-distributor"
        className={css({
          ...theme.typography.LabelMedium,
          margin: 0,
          color: theme.colors.contentPrimary,
          opacity: still ? 1 : undefined,
        })}>
        {sent ? w.invitedBy(sent) : w.invitedBySomebody}
      </p>}
      {cleared && <p role="status" data-testid="arrival-cleared"
        className={css({ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 })}>{cleared}</p>}
    </WalkScreen>
  );
}

export const meta = { id: 'arrival', title: 'Get started', owner: 'BODEGA-START', panes: false };
