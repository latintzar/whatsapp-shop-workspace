/* THE TURNS — the script as a machine, and the phone that draws it.
 *
 * `messages/chat-script.json` is the spec (MESSAGES.md §6): every turn carries `id`, `about` — what
 * the turn is about, in the reader's words — `from` (`rocoto` · `shop` · `system`, where `system` is
 * the page saying what happened rather than a bubble), `text`, `standsFor` — a template name or
 * `free-form` — and `next`, which is a step id, an array of `{label, to}` forks the page offers, or
 * `null` at a leaf. `buttons`, `footer`, `document` and `image` are the optional parts of a turn.
 * THE WORDS ARE THE SPEC'S: this file reads them and never writes them, `about` included — the step
 * list and the line under the thread carry it, so the reader sees the subject where the slug and the
 * Meta category used to stand.
 *
 * WHAT IS REUSED, AND WHY NOTHING IS REDRAWN
 *   · `rocoto/message` draws every turn — the bubble, the grouping rhythm, the document row, the
 *     stamp, and the `system` line that wears no bubble at all.
 *   · `rocoto/composer` is the bar at the foot, the same component the app writes with.
 *   · `whatsappTheme(base)` repaints four roles on a COPY of the live theme, so those two
 *     components become WhatsApp without learning what WhatsApp is; `channelTheme(…,'whatsapp')`
 *     adds the waiting state of the send disc, which is the channel standing back rather than a
 *     grey control (rocoto-theme.ts §196.7).
 *   · the ground is `dots(theme.colors.mono400)` on `mono100`, because the dot grid means exactly
 *     one thing in this product and that thing is A CONVERSATION (FEED-IA §11).
 *
 * WHAT IS THIS FILE'S OWN: the top bar with Rocoto's number on it, the quick-reply strip under a
 * bubble, and the step list. Cedar's `WhatsappPane` draws the thread from the CUSTOMER's side —
 * it mirrors the authors and keeps only what was said — and this screen is the shop's own phone
 * with the payloads and the buttons on it, so the housing is written here and the bubble is not.
 *
 * IT REACHES NO NETWORK. The script is the only source.
 */
import * as React from 'react';
import { ThemeProvider, useStyletron } from 'baseui';
import { Avatar } from 'baseui/avatar';
import { Button, KIND, SIZE } from 'baseui/button';
import { ReceiptText } from 'lucide-react';
import { Message, AUTHOR, groupThread } from '../../../rocoto/message';
import type { Author } from '../../../rocoto/message';
import { Composer } from '../../../rocoto/composer';
import { channelTheme, DOT_TILE, dots, whatsappTheme } from '../../../rocoto-theme';
import { TOUCH_FLOOR } from '../../cedar/shell/viewport';
import raw from '../messages/chat-script.json';
/* ROCOTO'S OWN NUMBER is declared once, beside the plumbing that sends from it
   (`start/session.ts`); this file takes the constant alone and reaches nothing there. */
import { ROCOTO_NUMBER } from '../start/session';

/* ── THE SCRIPT ───────────────────────────────────────────────────────────────────────────── */

export type Sender = 'rocoto' | 'shop' | 'system';
export type Choice = { label: string; to: string };
export type ScriptButton = { label: string; to?: string };

export type Step = {
  id: string;
  /** what this turn is about, said in the reader's words — the label every list shows */
  about: string;
  from: Sender;
  text: string;
  standsFor: string;
  next: string | Choice[] | null;
  buttons?: ScriptButton[];
  footer?: string;
  document?: string;
  image?: string;
};

export type Script = { version: number; steps: Step[] };

/* The JSON is read as the shape above in one place. Left to itself TypeScript infers a union of one
   literal object type per step, and a union is what makes `step.buttons` unreadable. */
const SCRIPT = raw as unknown as Script;

export const STEPS: readonly Step[] = SCRIPT.steps;

/** The script opens on the shop's own message, which is the door: writing first is what opens the
 *  24-hour window Rocoto answers inside (MESSAGES.md §2). */
export const START: string = STEPS[0].id;

const BY_ID = new Map<string, Step>(STEPS.map((s) => [s.id, s]));

export const stepOf = (id: string): Step | undefined => BY_ID.get(id);

/** WHAT THE TURN IS ABOUT, which is what every label on this screen says. The id stands behind it as
 *  the address the script writes with, and it shows only where a turn arrives with its label blank. */
export const aboutOf = (step: Step): string => step.about || step.id;

/** The forks a step hands the page, which is `next` in its array form. */
export const choicesOf = (step: Step): Choice[] => (Array.isArray(step.next) ? step.next : []);

/** Where `Next` goes: the plain id, or the first fork where the step offers several. */
export const defaultNext = (step: Step): string | null => {
  if (typeof step.next === 'string') return step.next;
  if (Array.isArray(step.next)) return step.next[0]?.to ?? null;
  return null;
};

/** Every id a step can reach: its own `next`, its forks, and the targets its buttons carry. */
const edgesOf = (step: Step): string[] => {
  const out: string[] = [];
  const plain = typeof step.next === 'string' ? step.next : null;
  if (plain) out.push(plain);
  for (const choice of choicesOf(step)) out.push(choice.to);
  for (const button of step.buttons ?? []) if (button.to) out.push(button.to);
  return out;
};

/**
 * THE SHORTEST WAY FROM THE TOP TO ONE STEP — what a press in the step list plays, so a jump
 * arrives with the turns that lead to it above it rather than with a bubble on an empty page.
 * A step the graph leaves out stands on its own.
 */
export function pathTo(id: string): string[] {
  if (id === START) return [START];
  const from = new Map<string, string>();
  const queue: string[] = [START];
  const seen = new Set<string>([START]);
  while (queue.length) {
    const here = queue.shift() as string;
    const step = stepOf(here);
    if (!step) continue;
    for (const there of edgesOf(step)) {
      if (seen.has(there)) continue;
      seen.add(there);
      from.set(there, here);
      if (there === id) {
        const path = [id];
        let walk = here;
        while (walk !== START) {
          path.unshift(walk);
          walk = from.get(walk) as string;
        }
        path.unshift(START);
        return path;
      }
      queue.push(there);
    }
  }
  return [id];
}

/* ── THE MACHINE ──────────────────────────────────────────────────────────────────────────── */

export type Play = {
  /** the ids played, in the order they were played */
  played: string[];
  /** the turn the thread ends on */
  current: Step;
  /** the turn the line under the thread describes — the current one, or one the reader tapped */
  shown: Step;
  /** the forks this turn offers the page */
  choices: Choice[];
  /** where `Next` goes, or nothing at a leaf */
  ahead: Step | null;
  /** the shop's own line waiting in the composer, where the next turn is the shop's */
  draft: Step | null;
  advance: (to?: string) => void;
  /** one turn back, so a branch picked by accident is one press to undo (QA 49) */
  back: () => void;
  jump: (id: string) => void;
  show: (id: string) => void;
  reset: () => void;
};

export function usePlay(): Play {
  const [played, setPlayed] = React.useState<string[]>([START]);
  const [picked, setPicked] = React.useState<string | null>(null);

  const currentId = played[played.length - 1];
  const current = stepOf(currentId) ?? (STEPS[0] as Step);
  const shown = (picked && played.includes(picked) ? stepOf(picked) : undefined) ?? current;

  const aheadId = defaultNext(current);
  const ahead = aheadId ? stepOf(aheadId) ?? null : null;
  const choices = choicesOf(current);

  const advance = React.useCallback(
    (to?: string) => {
      setPlayed((seen) => {
        const here = stepOf(seen[seen.length - 1]);
        const target = to ?? (here ? defaultNext(here) : null);
        if (!target || !BY_ID.has(target)) return seen;
        return [...seen, target];
      });
      setPicked(null);
    },
    [],
  );

  /* A FORK IS REVERSIBLE (QA 49). Picking one branch removed the other three and «From the top»
     was the only way to see them again — the whole script replayed to look at one choice. */
  const back = React.useCallback(() => {
    setPlayed((seen) => (seen.length > 1 ? seen.slice(0, -1) : seen));
    setPicked(null);
  }, []);

  const jump = React.useCallback((id: string) => {
    setPlayed(pathTo(id));
    setPicked(null);
  }, []);

  const reset = React.useCallback(() => {
    setPlayed([START]);
    setPicked(null);
  }, []);

  const show = React.useCallback((id: string) => setPicked(id), []);

  /* THE COMPOSER HOLDS THE SHOP'S OWN NEXT LINE. Five turns in the script are the shop writing —
     «Ya les mandé a todos», «Ya está», «Sí, actívalo» — and on those the bar is the real act: the
     words are already in it and the send plays them. Where Rocoto speaks next the bar waits. */
  const draft = ahead && ahead.from === 'shop' && typeof current.next === 'string' ? ahead : null;

  return { played, current, shown, choices, ahead, draft, advance, back, jump, show, reset };
}

/* ── THE WORDS FOR ONE TURN ───────────────────────────────────────────────────────────────── */

/** Who speaks a turn, short enough to ride beside its label in the step list. */
export const SENDER_WORDS: Record<Sender, string> = {
  rocoto: 'Rocoto',
  shop: 'The shop',
  system: 'The page',
};

/** The template a turn stands for, said in words. `free-form` is Meta's service rail. */
export const standsForWords = (step: Step): string =>
  step.standsFor === 'free-form' ? 'a free-form message' : `the template ${step.standsFor}`;

/** WhatsApp's own emphasis. `*…*` reads bold on a phone, so a figure a message marks that way
 *  stands out here the way it stands out there. */
export function withEmphasis(text: string): React.ReactNode {
  const parts = text.split(/\*([^*\n]+)\*/g);
  return parts.map((part, i) => (
    <React.Fragment key={i}>{i % 2 === 1 ? <strong>{part}</strong> : part}</React.Fragment>
  ));
}

const AUTHOR_OF: Record<Sender, Author> = {
  /* Rocoto's own turns take the AI standing, which is the one standing that signs itself in the
     identity gutter — the kit's single place for «Rocoto wrote this» (message/constants.ts). */
  rocoto: AUTHOR.ai,
  shop: AUTHOR.sent,
  system: AUTHOR.system,
};

/* ── ONE TURN ─────────────────────────────────────────────────────────────────────────────── */

/** The picture in the `voucher` turn is a photo the shop took, so the thread states that a photo
 *  arrived and names it. A drawn stand-in belongs here rather than an invented receipt. */
function PhotoStandIn({ label }: { label: string }) {
  const [, theme] = useStyletron();
  return (
    <div
      data-testid="chat-photo"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.sizing.scale300,
        padding: theme.sizing.scale400,
        borderRadius: theme.borders.radius300,
        backgroundColor: theme.colors.backgroundSecondary,
        color: theme.colors.contentSecondary,
        ...theme.typography.ParagraphXSmall,
      }}
    >
      <ReceiptText size={20} strokeWidth={1.5} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/** WhatsApp's quick replies, which ride UNDER the bubble on the speaker's own side. The offset is
 *  the row's own geometry read off `message/styled-components.ts`: the row's padding, the identity
 *  gutter, and the gap between them. */
function Replies({
  step,
  onPress,
}: {
  step: Step;
  onPress: (button: ScriptButton) => void;
}) {
  const [, theme] = useStyletron();
  const sent = step.from === 'shop';
  const gutter = `calc(${theme.sizing.scale300} + ${theme.sizing.scale700} + ${theme.sizing.scale100})`;
  return (
    <div
      data-testid={`chat-replies-${step.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.sizing.scale100,
        width: '78%',
        marginTop: theme.sizing.scale100,
        marginLeft: sent ? 'auto' : gutter,
        marginRight: sent ? theme.sizing.scale300 : 'auto',
      }}
    >
      {(step.buttons ?? []).map((button) => (
        <Button
          key={button.label}
          kind={KIND.tertiary}
          size={SIZE.compact}
          data-testid={`chat-reply-${button.label}`}
          onClick={() => onPress(button)}
          overrides={{
            BaseButton: {
              style: {
                width: '100%',
                minHeight: `${TOUCH_FLOOR}px`,
                backgroundColor: theme.colors.mono200,
                color: theme.colors.accent,
                borderRadius: theme.borders.radius400,
                ...theme.typography.LabelSmall,
                boxShadow: `inset 0 0 0 ${theme.borders.border300.borderWidth} ${theme.colors.borderTransparent}`,
              },
            },
          }}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}

function Turn({
  step,
  grouped,
  last,
  onPress,
  onShow,
}: {
  step: Step;
  grouped: boolean;
  last: boolean;
  onPress: (button: ScriptButton) => void;
  onShow: () => void;
}) {
  const [, theme] = useStyletron();
  const author = AUTHOR_OF[step.from];
  const payload = step.document
    ? { name: step.document, detail: 'CSV' }
    : undefined;

  return (
    <div data-testid={`chat-turn-${step.id}`} data-current={last ? 'yes' : undefined}>
      {/* A TAP SHOWS WHAT THIS TURN STANDS FOR (MESSAGES.md §6). The bubble itself holds the
          gesture in the app; here the row carries it, so the words and the payload stay the
          component's own.

          THE ROW IS THE TARGET, SO THE ROW STANDS ON THE HAND'S FLOOR. A one-line turn measured
          361 × 40 at 393 — «Hola, quiero probar Rocoto», the press that opens the whole
          simulation — which is 4px under the floor the rest of this prototype keeps (the step
          list below, `day-toggler.tsx`'s chevrons, `areas/stock.tsx`'s Evidence seat). It is a
          FLOOR: the short rows grow to 44 and every taller row stays exactly where it stood. */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${aboutOf(step)} stands for ${standsForWords(step)}`}
        onClick={onShow}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onShow();
          }
        }}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          minHeight: `${TOUCH_FLOOR}px`,
        }}
      >
        <Message
          author={author}
          grouped={grouped}
          status={author === AUTHOR.sent ? 'sent' : undefined}
          document={payload}
          slot={step.image ? <PhotoStandIn label="Voucher photo" /> : undefined}
          overrides={
            author === AUTHOR.system
              ? {
                  /* ── NO MARK BESIDE A BUBBLE IN A ONE-TO-ONE THREAD (QA 49) ────────────────
                     The kit reserves an identity gutter on every received row and paints a small
                     ink dot in it on the first of a run. In an AI thread that dot is Rocoto's own
                     presence; in a WhatsApp conversation between two people it read as a stray
                     list bullet floating left of the bubble. The GUTTER stays — the quick-reply
                     strip under a bubble measures its own offset from it — and only the mark
                     goes, so nothing moves. */
                  IdentityMark: { component: () => null },
                  System: {
                    style: {
                      backgroundColor: theme.colors.backgroundPrimary,
                      borderRadius: theme.borders.radius300,
                      color: theme.colors.contentSecondary,
                      paddingTop: theme.sizing.scale300,
                      paddingRight: theme.sizing.scale500,
                      paddingBottom: theme.sizing.scale300,
                      paddingLeft: theme.sizing.scale500,
                      marginTop: theme.sizing.scale300,
                      marginBottom: theme.sizing.scale300,
                    },
                  },
                }
              : { IdentityMark: { component: () => null } }
          }
        >
          {step.footer ? (
            <>
              {withEmphasis(step.text)}
              <span
                style={{
                  display: 'block',
                  marginTop: theme.sizing.scale300,
                  ...theme.typography.ParagraphXSmall,
                  color: theme.colors.contentTertiary,
                }}
              >
                {step.footer}
              </span>
            </>
          ) : (
            withEmphasis(step.text)
          )}
        </Message>
      </div>
      {step.buttons && step.buttons.length > 0 && <Replies step={step} onPress={onPress} />}
    </div>
  );
}

/* ── THE PHONE ────────────────────────────────────────────────────────────────────────────── */

/** The top bar wears Rocoto's own number on Meta's Cloud API, the one the code and the closing
 *  message leave from (DESIGN-SPEC.md "The rig" item 5). The shop's thread is with that number. */
function Top() {
  const [, theme] = useStyletron();
  return (
    <div
      data-testid="chat-top"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.sizing.scale400,
        padding: `${theme.sizing.scale400} ${theme.sizing.scale500}`,
        backgroundColor: theme.colors.backgroundPrimary,
        borderBottom: `1px solid ${theme.colors.borderOpaque}`,
        flex: '0 0 auto',
        minWidth: 0,
      }}
    >
      <span aria-hidden="true" style={{ flex: '0 0 auto', display: 'inline-flex' }}>
        <Avatar name="Rocoto" size="scale900" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ ...theme.typography.LabelSmall, display: 'block' }}>Rocoto</span>
        <span
          style={{
            ...theme.typography.ParagraphXSmall,
            color: theme.colors.contentTertiary,
            display: 'block',
          }}
        >
          {ROCOTO_NUMBER}
        </span>
      </span>
    </div>
  );
}

/**
 * THE THREAD, INSIDE THE PHONE. The frame is chrome only on the desk: at phone width the page IS
 * the phone, so the border and the corners leave and the column takes the screen.
 *
 * THE FRAME IS THE SIZE OF WHAT HAS BEEN PLAYED. A thread of one turn inside a frame built for
 * twenty reads as a screen that failed to load, so the thread carries a floor of about three bubbles
 * — enough for a chat that just opened to look like one — and grows turn by turn until `cap`, where
 * it starts scrolling and the line under it and the acts stay on the window.
 */
export function Phone({
  play,
  phone,
  cap,
}: {
  play: Play;
  phone: boolean;
  cap: string;
}) {
  const [, base] = useStyletron();
  const theme = React.useMemo(
    () => channelTheme(whatsappTheme(base as never), 'whatsapp'),
    [base],
  );
  const port = React.useRef<HTMLDivElement>(null);
  const [typed, setTyped] = React.useState('');

  const steps = play.played.map((id) => stepOf(id)).filter(Boolean) as Step[];
  const grouping = groupThread(steps.map((s) => AUTHOR_OF[s.from]));

  React.useEffect(() => {
    const el = port.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [play.played.length]);

  /* The bar carries the shop's own next line, or it waits. Either way it is the same component the
     app writes with, wearing the channel on its disc. */
  const draft = play.draft;
  React.useEffect(() => setTyped(draft ? draft.text : ''), [draft]);

  const press = (button: ScriptButton) => play.advance(button.to ?? undefined);

  return (
    <ThemeProvider theme={theme as never}>
      <div
        data-testid="chat-phone"
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '393px',
          overflow: 'hidden',
          backgroundColor: theme.colors.mono100,
          ...(phone
            ? null
            : {
                borderRadius: theme.borders.radius500,
                border: `1px solid ${theme.colors.borderOpaque}`,
              }),
        }}
      >
        <Top />
        <div
          ref={port}
          role="log"
          data-testid="chat-thread"
          style={{
            flex: '1 1 auto',
            /* the floor is about three bubbles: room for a thread to look like one, and little
               enough that the first turn arrives with the page rather than at the end of a field */
            minHeight: theme.sizing.scale3200,
            maxHeight: cap,
            overflowY: 'auto',
            overflowX: 'clip',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: theme.sizing.scale400,
            paddingBottom: theme.sizing.scale600,
            backgroundColor: theme.colors.mono100,
            backgroundImage: dots(theme.colors.mono400),
            backgroundSize: DOT_TILE,
          }}
        >
          {/* THE TURNS SIT ON THE FLOOR OF THE PANE, and the way there is `margin-top: auto` rather
              than `justify-content: flex-end`: with the alignment, the turns a tall thread pushes
              past the top edge leave the scrollable region altogether — Chrome measured
              `scrollHeight === clientHeight` on a thread of twenty, which put the first turns out
              of the reader's reach. The auto margin takes the free space while there is some and
              resolves to zero once the thread fills the pane, which is the same picture and a
              thread that scrolls all the way back. */}
          <div style={{ marginTop: 'auto' }}>
            {steps.map((step, i) => (
              <Turn
                key={`${step.id}-${i}`}
                step={step}
                grouped={grouping[i]}
                last={i === steps.length - 1}
                onPress={press}
                onShow={() => play.show(step.id)}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            flex: '0 0 auto',
            padding: theme.sizing.scale400,
            backgroundColor: theme.colors.backgroundPrimary,
            borderTop: `1px solid ${theme.colors.borderOpaque}`,
          }}
        >
          <Composer
            value={typed}
            onChange={setTyped}
            onSend={draft ? () => play.advance(draft.id) : undefined}
            disabled={!draft}
            size="compact"
            placeholder="Message"
            sendLabel="Send"
            maxLines={3}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

/* ── THE LINE UNDER THE THREAD ────────────────────────────────────────────────────────────── */

/** WHICH REAL MESSAGE THIS TURN IS. One line, the spec's own vocabulary: what the turn is about, who
 *  sends it, and the template it stands for. A tap on any bubble moves the line to that turn. */
export function StandsFor({ step }: { step: Step }) {
  const [, theme] = useStyletron();
  return (
    <p
      data-testid="chat-stands-for"
      data-step={step.id}
      data-stands-for={step.standsFor}
      style={{
        margin: 0,
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.sizing.scale300,
        alignItems: 'baseline',
        ...theme.typography.ParagraphXSmall,
        color: theme.colors.contentSecondary,
      }}
    >
      <span style={{ ...theme.typography.LabelXSmall, color: theme.colors.contentPrimary }}>
        {aboutOf(step)}
      </span>
      {/* ── A WRAPPED LINE NEVER BEGINS ON A SEPARATOR (QA 49) ────────────────────────────────
          The three facts were joined with middle dots inside the flow, so at 393 the row broke
          after «· The page» and the second line opened «· stands for a free-form message» — a
          sentence starting with a punctuation mark nothing precedes. Each fact is its own pill
          now: the row wraps between them and every line starts on a word. */}
      <Pill>{SENDER_WORDS[step.from]}</Pill>
      <Pill>Stands for {standsForWords(step)}</Pill>
    </p>
  );
}

/** One fact from the line under the thread, in a box of its own so a wrap falls between facts. */
function Pill({ children }: { children: React.ReactNode }) {
  const [, theme] = useStyletron();
  return (
    <span
      style={{
        ...theme.typography.LabelXSmall,
        color: theme.colors.contentSecondary,
        border: `1px solid ${theme.colors.borderOpaque}`,
        borderRadius: theme.borders.radius200,
        padding: `2px ${theme.sizing.scale200}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

/* ── THE STEP LIST, ON THE DESK ───────────────────────────────────────────────────────────── */

/**
 * EVERY STEP, IN THE FILE'S OWN ORDER, each one saying what it is about with its speaker beside it —
 * and a press plays the shortest path to it, so any turn in the script is one press away. Read down
 * the column and the whole script is there in the reader's own words; the template each turn stands
 * for waits one line under the thread, where a tap puts it.
 *
 * SAFFRON IS SPENT ONCE, on the turn the thread stands on, and only where that turn is Rocoto's
 * own act. The played turns behind it read in full ink; the ones still ahead stand back.
 */
export function StepList({ play, cap }: { play: Play; cap: string }) {
  const [, theme] = useStyletron();
  const seen = new Set(play.played);
  /* THE TURN THE THREAD STANDS ON KEEPS ITSELF IN VIEW, so a jump or a `Next` never leaves the
     list pointing at a row that scrolled away. */
  const row = React.useRef<HTMLLIElement>(null);
  React.useEffect(() => {
    row.current?.scrollIntoView({ block: 'nearest' });
  }, [play.current.id]);
  return (
    <section
      data-testid="chat-steps"
      aria-label="Steps"
      style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale300, minWidth: 0 }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: theme.sizing.scale400 }}>
        <h2 style={{ margin: 0, ...theme.typography.LabelMedium }}>Steps</h2>
        <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentTertiary }}>
          {STEPS.length} turns
        </span>
      </header>
      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          maxHeight: cap,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.sizing.scale0,
        }}
      >
        {STEPS.map((step) => {
          const here = step.id === play.current.id;
          const behind = seen.has(step.id);
          const mark = here && step.from === 'rocoto' ? theme.colors.accent : theme.colors.contentPrimary;
          return (
            <li key={step.id} ref={here ? row : undefined}>
              <button
                type="button"
                data-testid={`chat-step-${step.id}`}
                data-here={here ? 'yes' : undefined}
                onClick={() => play.jump(step.id)}
                style={{
                  width: '100%',
                  minHeight: `${TOUCH_FLOOR}px`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.sizing.scale400,
                  textAlign: 'left',
                  font: 'inherit',
                  cursor: 'pointer',
                  padding: `${theme.sizing.scale200} ${theme.sizing.scale400}`,
                  borderWidth: 0,
                  borderRadius: theme.borders.radius300,
                  backgroundColor: here ? theme.colors.backgroundTertiary : 'transparent',
                  color: behind ? theme.colors.contentPrimary : theme.colors.contentTertiary,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flex: '0 0 auto',
                    width: theme.sizing.scale200,
                    height: theme.sizing.scale200,
                    borderRadius: '50%',
                    backgroundColor: here ? mark : 'transparent',
                    boxShadow: behind && !here ? `inset 0 0 0 1px ${theme.colors.contentTertiary}` : undefined,
                  }}
                />
                <span style={{ flex: 1, minWidth: 0, ...theme.typography.LabelSmall }}>
                  {aboutOf(step)}
                </span>
                <span
                  style={{
                    flex: '0 0 auto',
                    ...theme.typography.ParagraphXSmall,
                    color: theme.colors.contentTertiary,
                  }}
                >
                  {SENDER_WORDS[step.from]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
