/* #/chat — ROCOTO ON WHATSAPP, SIMULATED (DESIGN-SPEC.md §4 · MESSAGES.md §6).
 *
 * The shop signs up in the browser. WhatsApp is where Rocoto stays with it afterwards — Peter, 19
 * September 2026: «there wouldnt be a whatsapp version… whatsapp is the buddy for orientation»
 * (FEED-IA §268). So this route plays `messages/chat-script.json` from the first message Rocoto
 * writes once the shop has connected — the closing message, a supplier joining, the weekly
 * statement, a payment due, the payment links, the export — turn by turn in the WhatsApp theme, and
 * Peter reads the conversation from here with no phone in his hand.
 *
 * FOUR THINGS THIS SCREEN OWES HIM:
 *   1. ONE TURN AT A TIME, on a `Next` act — a thread that arrived all at once says nothing about
 *      the order the shop actually reads it in.
 *   2. THE FORKS ARE REAL TAPS. A step whose `next` is an array hands its labels to the act row
 *      («Supplier connected» · «Weekly statement» · «Payment links on»), and the quick replies the
 *      script writes into a bubble are pressable where they stand.
 *   3. WHICH REAL MESSAGE EACH TURN IS. One line under the thread says what the turn is about, who
 *      sends it and the template it stands for, and a tap on any bubble moves that line to it.
 *   4. THE WHOLE SCRIPT AGAIN, from the top, in one press.
 *
 * THE PHONE IS 393 AND THE PAGE IS THE PHONE AT PHONE WIDTH — the frame's border and corners are
 * desk chrome, and on the desk the step list stands beside it, so any turn in the script is one press
 * away.
 *
 * It reaches no network: the script is the only source, and `turns.tsx` holds the machine.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import Page from '../../cedar/shell/page';
import { usePhone } from '../../cedar/shell/viewport';
import { Phone, StandsFor, StepList, usePlay } from './turns';

/** THE THREAD'S OWN ROOM, read off the window rather than stated flat: the line under the thread
 *  and the acts under that are what the screen is for, so the frame yields to them on a short
 *  window and stops growing on a tall one. These are CEILINGS — the thread stands as tall as the
 *  turns played, from a floor of about three bubbles, and starts scrolling here. The step list is a
 *  full index of the script from its first paint, so it keeps the room it always had. */
const PHONE_THREAD_CAP = 'clamp(220px, calc(100svh - 500px), 400px)';
const DESK_THREAD_CAP = 'clamp(240px, calc(100svh - 520px), 440px)';
const STEPS_CAP = 'clamp(360px, calc(100svh - 380px), 620px)';

export const meta = { id: 'chat', title: 'Rocoto on WhatsApp', owner: 'BODEGA-CHAT', panes: false };

export default function Chat() {
  const [css, theme] = useStyletron();
  const phone = usePhone();
  const play = usePlay();
  const cap = phone ? PHONE_THREAD_CAP : DESK_THREAD_CAP;

  return (
    <Page title={meta.title}>
      <section
        data-testid="area-chat"
        style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale600, minWidth: 0 }}
      >
        <h1 style={{ margin: 0, ...theme.typography.HeadingMedium }}>Rocoto on WhatsApp</h1>
        <p
          style={{
            margin: 0,
            maxWidth: '60ch',
            ...theme.typography.ParagraphMedium,
            color: theme.colors.contentSecondary,
          }}
        >
          The thread between Rocoto and a shop once it has connected, turn by turn.
        </p>

        <div
          className={css({
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: theme.sizing.scale800,
            minWidth: 0,
          })}
        >
          <div
            className={css({
              display: 'flex',
              flexDirection: 'column',
              gap: theme.sizing.scale500,
              flex: '1 1 320px',
              maxWidth: '393px',
              minWidth: 0,
            })}
          >
            <Phone play={play} phone={phone} cap={cap} />
            <StandsFor step={play.shown} />
            <Acts play={play} />
          </div>

          {!phone && (
            <div className={css({ flex: '0 1 360px', minWidth: 0 })}>
              <StepList play={play} cap={STEPS_CAP} />
            </div>
          )}
        </div>
      </section>
    </Page>
  );
}

/** THE ACTS. The fork's own labels where the step offers one, `Next` where it walks on, and the
 *  replay, which is always available. */
function Acts({ play }: { play: ReturnType<typeof usePlay> }) {
  const [, theme] = useStyletron();
  const { choices, ahead } = play;
  return (
    <div
      data-testid="chat-acts"
      style={{ display: 'flex', flexWrap: 'wrap', gap: theme.sizing.scale300, alignItems: 'center' }}
    >
      {/* ── A FORK SAYS IT IS A FORK (QA 49) ─────────────────────────────────────────────────
          «Next» disappeared after one press and four chips took its place with no sentence over
          them, so the control a person was using vanished and four unexplained words arrived. The
          line names what the chips are for; `Step back` below is the way out of a branch, which
          was «From the top» and nothing else. */}
      {choices.length > 0 && (
        <p
          data-testid="chat-fork-line"
          style={{ margin: 0, width: '100%', ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}
        >
          Pick what happens next
        </p>
      )}
      {choices.map((choice) => (
        <Button
          key={choice.to}
          kind={KIND.secondary}
          size={SIZE.compact}
          data-testid={`chat-choice-${choice.to}`}
          onClick={() => play.advance(choice.to)}
          overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
        >
          {choice.label}
        </Button>
      ))}

      {choices.length === 0 && ahead && (
        <Button
          kind={KIND.primary}
          size={SIZE.compact}
          data-testid="chat-next"
          onClick={() => play.advance()}
          overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
        >
          Next
        </Button>
      )}

      {choices.length === 0 && !ahead && (
        <span
          data-testid="chat-leaf"
          style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}
        >
          This branch ends here.
        </span>
      )}

      {play.played.length > 1 && (
        <Button
          kind={KIND.tertiary}
          size={SIZE.compact}
          data-testid="chat-back"
          onClick={play.back}
          overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
        >
          Step back
        </Button>
      )}

      <Button
        kind={KIND.tertiary}
        size={SIZE.compact}
        data-testid="chat-replay"
        onClick={play.reset}
        overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
      >
        From the top
      </Button>
    </div>
  );
}
