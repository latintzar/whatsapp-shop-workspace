/* SCREEN 8 · WHO OWED YOU — `These businesses have owed you` (ONBOARDING-SPEC.md §0, screen 8).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening): «if they his 2 or 3 we then check
 * their contacts and say "these people owed you int he past, wanna share with them? we'll send
 * them a message form your whatsapp if you agree" something like that.»
 *
 * ═══ WHO IS ON IT ═══════════════════════════════════════════════════════════════════════════
 * Only a business that sells to bodegas or to restaurants walks this screen; a bodega goes
 * straight to bringing businesses (`start/joining.ts`, `sellsOnward`). The rows are the read's own
 * likely list — built from the messages alone, each carrying its reason in words
 * (`history/read.ts`, WHATSAPP-HISTORY-SPEC.md §4). No total is asserted anywhere, and no amount
 * is asked for here: this screen is about sharing, and the fiado book is Money's own.
 *
 * ═══ NOTHING IS SENT BY THE APP ═════════════════════════════════════════════════════════════
 * `Share with them` hands the message to the owner's OWN WhatsApp, one chat at a time, with the
 * invitation already written and the owner's own code inside the link. The owner presses send
 * there. The walk adds no path that can message a third party, which is the rule the whole rig
 * keeps (WIRING-SPEC.md §5).
 *
 * ═══ THE MOTION ═════════════════════════════════════════════════════════════════════════════
 * The faces arrive fanned out of a stack, one after another; the count above the list steps as
 * rows are picked; and each row that has been handed off carries a tick that draws itself. The
 * foot counts the hand-offs, so the act says exactly where in the list the next press lands.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Avatar } from 'baseui/avatar';
import { Checkbox } from 'baseui/checkbox';
import { UserRound } from 'lucide-react';
import { REFERENCE_DAY } from '../cast';
import { faceName, waHandoff } from '../referrals';
import { useChatSource } from '../source';
import { SCOPE, markReached } from '../stage';
import {
  contactWords, likelyList, owedReasonLine, readOnce, readingNow,
  type LikelyRow, type ThreadReading,
} from '../history/read';
import { readDraft, useWaitlist } from './joining';
import {
  DrawnTick, MS, SPRING, WalkAct, WalkQuiet, WalkScreen, goTo, stepsFor, useEntered,
  useStillness, tap,
} from './walk';
import { owedReasonEs, useWords, type Lang } from './words';

/** The disc a name is found by in a scrolling column — Cedar's own `FACE.row`. */
const FACE = 28;

/**
 * THE FACE OF ONE ROW, whichever the contacts sync gave it: initials where there is a name, a
 * person glyph where there is a number. Screen 9 draws the same discs, so it stands once here.
 */
export function ContactFace({ row, kind }: {
  row: { name: string; number: string; named: boolean };
  kind: 'customer' | 'supplier';
}) {
  const [css, theme] = useStyletron();
  const words = contactWords(row);
  return (
    <span aria-hidden data-object-face={kind} data-face={row.named ? 'initials' : 'number'}
      className={css({ display: 'inline-flex', flex: '0 0 auto' })}>
      {row.named
        ? <Avatar name={faceName(words)} size={`${FACE}px`}
          overrides={{ Initials: { style: { ...theme.typography.LabelXSmall, letterSpacing: 0 } } }} />
        : <span className={css({
          display: 'grid',
          placeItems: 'center',
          width: `${FACE}px`,
          height: `${FACE}px`,
          borderRadius: '50%',
          backgroundColor: theme.colors.backgroundTertiary,
          color: theme.colors.contentSecondary,
        })}><UserRound size={16} /></span>}
    </span>
  );
}

/** ONE ROW, FANNING OUT OF THE STACK. Each arrives a little after the one above it, rotated a
 *  degree less, so the list unfolds rather than appears. */
function OwedRow({ row, index, picked, shared, lang, shareWord, onPick }: {
  row: LikelyRow;
  index: number;
  picked: boolean;
  shared: boolean;
  lang: Lang;
  shareWord: string;
  onPick: () => void;
}) {
  const [css, theme] = useStyletron();
  const still = useStillness();
  const entered = useEntered(120 + index * 60);
  return (
    <li data-testid="owed-row" data-row-name={contactWords(row)} data-row-number={row.number}
      data-row-picked={picked ? 'yes' : 'open'} data-row-shared={shared ? 'yes' : 'open'}
      className={css({
        listStyle: 'none',
        display: 'flex',
        gap: theme.sizing.scale400,
        alignItems: 'flex-start',
        minWidth: 0,
        opacity: entered || still ? 1 : 0,
        /* the fan: out of a stack, each one a degree less tilted than the one above */
        transform: entered || still
          ? 'translate3d(0,0,0) rotate(0deg)'
          : `translate3d(0,${-8 - index * 3}px,0) rotate(${(3 - index) * 1.2}deg)`,
        transformOrigin: 'left center',
        transitionProperty: 'opacity, transform',
        transitionDuration: still ? '0ms' : `${MS.move}ms`,
        transitionTimingFunction: SPRING.glide,
      })}>
      <Checkbox checked={picked} onChange={() => { tap(still); onPick(); }}
        overrides={{
          Root: { props: { 'data-testid': 'owed-tick' }, style: { minHeight: '56px', alignItems: 'flex-start' } },
          Label: { style: { paddingLeft: theme.sizing.scale400, minWidth: 0 } },
        }}>
        <span className={css({ display: 'flex', gap: theme.sizing.scale400, alignItems: 'flex-start', minWidth: 0 })}>
          <ContactFace row={row} kind="customer" />
          <span className={css({ display: 'grid', gap: theme.sizing.scale100, minWidth: 0 })}>
            <span className={css({ ...theme.typography.LabelLarge, overflowWrap: 'anywhere' })}>{contactWords(row)}</span>
            {/* THE REASON IS THE PAYMENT EVIDENCE OF THAT CHAT, in the page's own language: the
                read's own English line, or the Spanish of the same facts in the same order
                (`history/read.ts`, `start/words.ts`). */}
            <span data-testid="owed-reason" className={css({ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary })}>
              {lang === 'es' ? owedReasonEs(row) : owedReasonLine(row)}
            </span>
          </span>
        </span>
      </Checkbox>
      {shared && <span className={css({
        display: 'flex', alignItems: 'center', gap: theme.sizing.scale200, flexShrink: 0,
        marginTop: theme.sizing.scale500, color: theme.colors.contentPrimary,
        ...theme.typography.LabelXSmall,
      })}>
        <DrawnTick size={16} still={still} />{shareWord}
      </span>}
    </li>
  );
}

export default function Owed() {
  const [css, theme] = useStyletron();
  const { lang, w } = useWords();
  const still = useStillness();
  const source = useChatSource();
  const { standing } = useWaitlist();
  const [draft] = React.useState(() => readDraft());
  const [readings, setReadings] = React.useState<ThreadReading[]>(() => readingNow(SCOPE));
  const [picked, setPicked] = React.useState<Record<string, boolean>>({});
  const [shared, setShared] = React.useState<Record<string, boolean>>({});
  /* THE STORED READING IS TAKEN ONCE, AT MOUNT. A read in flight publishes after every chat, so
     the rows arrive as they land on a long personal history rather than after the whole run. */
  const stored = React.useRef(readings.length > 0);

  React.useEffect(() => { markReached('owed'); }, []);

  React.useEffect(() => {
    if (!source || stored.current) return;
    let live = true;
    const land = (held: { readings: ThreadReading[] }) => {
      if (live && held.readings.length > 0) setReadings(held.readings);
    };
    void readOnce(source, { referenceDay: REFERENCE_DAY, scope: SCOPE, onStanding: land }).then(land);
    return () => { live = false; };
  }, [source]);

  /* ── WHICH BUSINESSES, AND IN WHAT ORDER ────────────────────────────────────────────────
     The payment evidence ranks this screen: the chats that asked to pay later, or hold an order
     with no payment message after it, newest and most insistent first. Where a shop's chats carry
     none of that yet the standing rule's own field stands in, so the screen has businesses to
     share with rather than an empty list — and either way the ROW says only what the chat holds
     about money (`owedReasonLine`). The laughs rule and the sentence naming it belong to the Money
     surface that owns them; a distributor being shown this screen never reads them. */
  const reading = React.useMemo(() => {
    const evidence = likelyList(readings, { rule: 'evidence' });
    return evidence.rows.length > 0 ? evidence : likelyList(readings);
  }, [readings]);
  const rows = reading.rows;

  /* EVERY ROW ARRIVES PICKED, because the list is Rocoto's proposal and the owner unticks. */
  React.useEffect(() => {
    setPicked((held) => {
      const next = { ...held };
      for (const row of rows) if (next[row.id] === undefined) next[row.id] = true;
      return next;
    });
  }, [rows]);

  const chosen = rows.filter((row) => picked[row.id]);
  const sentCount = chosen.filter((row) => shared[row.id]).length;
  const next = chosen.find((row) => !shared[row.id]);

  /* A SHOP ON THIS SCREEN SELLS ONWARD BY DEFINITION, so its walk counts this step. */
  const steps = stepsFor(true);
  const onward = () => goTo('referrals');

  /** THE HAND-OFF: the owner's own WhatsApp, on that chat, with the message already written. */
  const hand = (row: LikelyRow) => {
    const body = w.invitation(draft.name, standing?.waitlist.referralUrl ?? '');
    setShared((held) => ({ ...held, [row.id]: true }));
    tap(still, 12);
    window.open(waHandoff(row.number, body), '_blank', 'noopener,noreferrer');
  };

  return (
    <WalkScreen
      testId="start-owed"
      step="owed"
      steps={steps}
      fill
      title={w.owedTitle}
      sentence={w.owedSentence}
      note={sentCount > 0
        ? <span data-testid="owed-count">{w.owedCount(sentCount, chosen.length)}</span>
        : undefined}
      act={next
        ? <WalkAct testId="owed-share" onClick={() => hand(next)}>
          {sentCount === 0 ? w.owedShareAll : w.owedShareWith(contactWords(next))}
        </WalkAct>
        : <WalkAct testId="owed-done" onClick={onward}>{w.owedNext}</WalkAct>}
      quiet={next
        ? <WalkQuiet testId="owed-skip" onClick={onward}>{w.skip}</WalkQuiet>
        : undefined}
    >
      <div className={css({
        /* a column, so the rule, the thin sentence and the count keep their own heights whether
           they are drawn or not, and the LIST takes whatever is left */
        display: 'flex', flexDirection: 'column', gap: theme.sizing.scale500,
        minHeight: 0, minWidth: 0, flexGrow: 1,
      })}>
      {rows.length > 0 && <p data-testid="owed-picked" data-picked={chosen.length}
        className={css({
          ...theme.typography.LabelMedium,
          margin: 0,
          fontVariantNumeric: 'tabular-nums',
          color: theme.colors.contentPrimary,
        })}>
        {w.owedPicked(chosen.length)}
      </p>}
      <ul data-testid="owed-list" data-rows={rows.length}
        className={css({
          display: 'grid', gap: theme.sizing.scale300, margin: 0, padding: 0,
          minHeight: 0, alignContent: 'start', overflowY: 'auto', flexGrow: 1,
        })}>
        {rows.map((row, index) => (
          <OwedRow key={row.id} row={row} index={index} lang={lang} shareWord={w.owedRowShared}
            picked={Boolean(picked[row.id])} shared={Boolean(shared[row.id])}
            onPick={() => setPicked((held) => ({ ...held, [row.id]: !held[row.id] }))} />
        ))}
      </ul>
      {rows.length === 0 && <p data-testid="owed-empty"
        className={css({ ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary, margin: 0 })}>
        {w.owedEmpty}
      </p>}
      </div>
    </WalkScreen>
  );
}

export const meta = { id: 'owed', title: 'Who owed you', owner: 'BODEGA-START', panes: false };
