/* SCREEN 2 · THE WHATSAPP CONNECTION (ONBOARDING-SPEC.md §0, screen 2).
 *
 * Cedar's Embedded Signup and coexistence walk, mounted whole, with Cedar's five setup titles kept
 * verbatim: `WhatsAppSetup` comes from `../cedar/connections/app.tsx` as it stands, and the copied
 * `whatsapp-connection.tsx` beside it holds the store whose key this surface renamed.
 *
 * WHY AND THE COST ARE STATED ONCE, under the walk: Rocoto reads the chats to list who owes the shop
 * and who it owes; WhatsApp keeps working on the phone, and broadcast lists become read-only. The
 * history consent screen is Meta's own, so this page asks once and states the result.
 *
 * THE SEAM DECIDES WHETHER THERE IS ANYTHING TO CONNECT. `source.connection()` answers for the live rig
 * and for the sample world with ONE shape, so this screen asks it rather than asking which world it is
 * in: a connection reported means the account is linked and the walk carries on to the celebration;
 * no connection means Meta's walk, which is what the rig runs on Peter's own number.
 *
 * ONE HEADING, AND NO OBJECT ABOVE IT. The screen once printed its own title, a sentence and Cedar's
 * 3D telephone over the walk's question, which made two headings and a picture of a desk phone on a
 * screen about WhatsApp (Peter, 19 September, FEED-IA §268). The walk's question is the heading now.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Check } from 'lucide-react';
import type { Connection } from '../../cedar/connections/types';
import { chatSource } from '../source';
import { markReached } from '../stage';
import { WhatsAppWalk } from '../whatsapp-connection';
import { attributeHeldReferral, readDraft, writeDraft } from './joining';
import { openFromConnection } from './session';
import { WalkAct, WalkScreen, goTo } from './walk';
import { useWords } from './words';
import { MobileConnect } from './mobile-connect';

export default function Connect() {
  const attempt = new URLSearchParams(window.location.search).get('mobile') ?? '';
  if (/^[A-Za-z0-9_-]{20,128}$/.test(attempt)) return <MobileConnect attempt={attempt} />;
  return <BrowserConnect />;
}

function BrowserConnect() {
  const [css, theme] = useStyletron();
  /* WHY ROCOTO ASKS, AND WHAT IT COSTS — one line under Meta's walk, said once (`start/words.ts`,
     `connectWhy`). The first sentence is the access explanation (brief, active, how and why the
     chats are used); the second is the two facts the WhatsApp Business app connection changes and
     keeps. META'S OWN WALK reads this screen's own language too: it is Cedar's file
     (`../cedar/connections/app.tsx`) and another candidate owns it, so its `lang` prop — passed
     down through `WhatsAppWalk` below — answers each of its own strings from Cedar's own Spanish
     table rather than duplicating them here. */
  const { lang, w } = useWords();
  const [connection, setConnection] = React.useState<Connection | null>(null);
  const [read, setRead] = React.useState(false);

  React.useEffect(() => { markReached('connect'); }, []);

  React.useEffect(() => {
    let live = true;
    void chatSource()
      .then((source) => source.connection())
      .then((state) => { if (live) { setConnection(state.connection); setRead(true); } })
      .catch(() => { if (live) setRead(true); });
    return () => { live = false; };
  }, []);

  /* THE CELEBRATION IS THE NEXT SCREEN (ONBOARDING-SPEC.md §0; Peter: «one they connect whatsapp
     they have to be hit by a "Youre on the Waitlis!"t! confetti t and then next»). */
  const onward = () => { goTo('waitlist'); };

  /* THE CONNECTION IS THE SIGN-IN, so the walk's own session is minted here, once, from the account
     Meta's walk just reported (`start/session.ts`, WIRING-SPEC.md §1). The walk carries on either
     way: the desk's gate stands on the connection itself as well, so a rig whose `/api/bodega/*` is
     still to answer walks the whole path.

     AND THE LINK THAT BROUGHT THIS BUSINESS IS ATTRIBUTED HERE, because this is the first moment a
     session exists to attach it to (`start/joining.ts`). The service is idempotent and answers an
     unknown code with a plain no, so it is safe wherever the walk arrived from. */
  const linked = async (next: Connection) => {
    setConnection(next);
    /* THE WHATSAPP BUSINESS PROFILE ALREADY CARRIES A NAME where the account set one, so screen 4
       offers it rather than asking for something the shop has already typed once (ONBOARDING-SPEC
       §0, screen 4: «prefilled from the WhatsApp Business profile when the connection reports it»). */
    const reported = (next.name ?? '').trim();
    if (reported) { const held = readDraft(); if (!held.name) writeDraft({ ...held, name: reported }); }
    await openFromConnection().catch(() => undefined);
    await attributeHeldReferral().catch(() => false);
    onward();
  };

  return (
    <WalkScreen
      testId="start-connect"
      step="connect"
      /* ONE HEADING TO A SCREEN. While the account is still to link, Cedar's walk carries the
         screen's one heading — «Do you use the WhatsApp Business app?» — so this screen yields its
         own, and the line that says why Rocoto asks stands under the walk. Linked, it names the
         fact. */
      title={connection ? w.connectDone : undefined}
      /* ⚠ THE LINKED SCREEN WAS A SMALL CARD WITH 450 px OF WHITE UNDER IT. The account is the one
         thing that has just happened, so it stands on a stage of its own like every other moment
         of the walk, and the words sit under it. While the account is still to link, Meta's walk
         is a form and takes the room instead. */
      stage={connection ? 'paper' : undefined}
      visual={connection
        ? <div data-testid="connect-account" data-connected={connection.number}
          className={css({
            boxSizing: 'border-box',
            display: 'grid', justifyItems: 'center', alignContent: 'center',
            gap: theme.sizing.scale600, height: '100%', minHeight: 0,
            paddingLeft: theme.sizing.scale600, paddingRight: theme.sizing.scale600,
          })}>
          {/* THE ACCOUNT AS AN OBJECT, not two lines of text on a wash: a card the shop recognises
              as its own WhatsApp, with the tick sitting on its shoulder. */}
          <span className={css({
            position: 'relative',
            boxSizing: 'border-box',
            display: 'grid', justifyItems: 'center', gap: theme.sizing.scale300,
            width: 'min(300px, calc(100vw - 64px))',
            paddingTop: theme.sizing.scale900,
            paddingBottom: theme.sizing.scale800,
            paddingLeft: theme.sizing.scale700,
            paddingRight: theme.sizing.scale700,
            borderRadius: theme.borders.radius500,
            backgroundColor: theme.colors.backgroundPrimary,
            boxShadow: '0 18px 44px rgba(0,0,0,0.14)',
            minWidth: 0,
          })}>
            <span aria-hidden className={css({
              position: 'absolute', top: '-28px',
              display: 'grid', placeItems: 'center',
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: theme.colors.contentPrimary,
              color: theme.colors.contentInversePrimary,
              boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
            })}>
              <Check size={28} strokeWidth={2.6} />
            </span>
            <strong className={css({ ...theme.typography.HeadingSmall, overflowWrap: 'anywhere', textAlign: 'center' })}>{connection.name}</strong>
            <span className={css({ ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary })}>{connection.number}</span>
          </span>
        </div>
        : undefined}
      fill={!connection}
      note={connection ? undefined : <span data-testid="connect-why">{w.connectWhy}</span>}
      act={connection ? <WalkAct testId="connect-continue" onClick={onward}>{w.carryOn}</WalkAct> : undefined}
    >
      {connection
        ? undefined
        : read && <div className={css({ width: '100%', minWidth: 0 })}>
          <WhatsAppWalk onComplete={(next) => { void linked(next); }} lang={lang} />
        </div>}
    </WalkScreen>
  );
}

export const meta = { id: 'connect', title: 'Connect WhatsApp Business', owner: 'BODEGA-START', panes: false };
