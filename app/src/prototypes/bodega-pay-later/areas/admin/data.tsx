/* YOUR DATA — what Rocoto read, what it read IN it, and the road back out.
 *
 * Cedar's `admin/data.tsx` is the LEDGER and the desk is the ACTION: the analysis is read whole
 * here, occasionally, the way an administration seat is read, and the actionable readings ride the
 * objects on the desk — a likely debtor's reason line stands inside her own customer sheet
 * (`customer-profile.tsx`), and the fiado book she confirmed stands in Money.
 *
 * ═══ THE ROUND TRIP, WHICH IS THE WHOLE SEAT ═════════════════════════════════════════════════
 *   GAVE      the shop connected its WhatsApp and let Rocoto read it.
 *   LEARNED   the read: threads, messages, the window it covers.
 *   SHOWS     what it read in them — who most likely owes, each row carrying its reason in WORDS.
 *   TAKES BACK the export, by transaction and by customer.
 *
 * ═══ THE SAFFRON LINE ════════════════════════════════════════════════════════════════════════
 * ANALYSIS is Rocoto's own act and carries the mark: the likely list is a reading off her chats.
 * ARITHMETIC is counting and stays plain ink: the message count, the thread count, the window.
 *
 * ═══ AND THE RANKING RULE IS PRINTED, BECAUSE IT IS A TEST RULE ══════════════════════════════
 * Until the debt read exists, the rig's «top people» are ranked on «haha» / «jaja» per chat. A test
 * rule that a screen states out loud can be replaced in public; one that a screen hides becomes a
 * fact nobody remembers choosing (`WHATSAPP-HISTORY-SPEC.md` §5).
 *
 * ═══ THE PRICE ROWS LEFT WITH THE TARIFA ═════════════════════════════════════════════════════
 * Cedar's twelve insights include the most profitable line and what a basket's VALUE changed. One
 * shop sells at one price, so those rows have no subject and are gone rather than defaulted
 * (`WIRING-SPEC.md` §11).
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { ChevronRight } from 'lucide-react';
import { corpus, customers, likelyOwed, money, nameOf } from '../../cast';
/* ── THE RULE IS ONE CONSTANT (QA 42) ────────────────────────────────────────────────────────
 * Two screens printed two different rules for the SAME ranked list: this seat said the laugh
 * count, Money said «fiado asked for, how recent, how often». `history/rank.ts` is where the rule
 * lives and where its sentence is written verbatim, so both screens read that one line and a rule
 * change is one edit. */
import { LAUGHS_RULE_LINE } from '../../history/rank';
/* ONE FIADO BOOK (QA 7): the book `money-store.ts` owns, so «What you confirmed» counts the rows
   the shop actually answered for rather than the fixture's own six. */
import { MONEY_SCOPE, useFiadoBook } from '../../money-store';
import { SOURCE_WORD, useChatSource } from '../../source';
import { NoticedMark, dayWords, fiadoWords } from '../../customer-profile';
import { Row, Seat, Section } from './business';

export const meta = { id: 'data', title: 'Your data', owner: 'BODEGA-ADMIN', panes: false };

/** THE TEST RANKING RULE, verbatim, because the screen that hides it owns it forever — and read
 *  from the rule's own file, so Money and this seat can never state it differently (QA 42). */
const RANKING_RULE = LAUGHS_RULE_LINE;

const dayRange = (from: string, to: string): string => `${dayWords(from)} to ${dayWords(to)}`;

export default function YourData() {
  const [, theme] = useStyletron();
  const source = useChatSource();
  const book = useFiadoBook(MONEY_SCOPE);
  const confirmed = book.filter((row) => row.standing === 'confirmed');

  return (
    <Seat id="data" title="Your data" lead="What Rocoto read, what it read in it, and how to take it out again.">
      <Section title="What Rocoto read" note="Your own chats, over the window you gave it.">
        <Row label="The source" value={source ? SOURCE_WORD[source.kind] : 'Reading'} />
        <Row label="Conversations" value={`${corpus.threads} conversations`} />
        <Row label="Messages" value={`${corpus.messages.toLocaleString('en-PE')} messages`} />
        <Row label="Photos in them" value={`${corpus.imageMessages} messages carry a photo`} />
        <Row label="The window" value={`${corpus.windowDays} days · ${dayRange(corpus.from, corpus.to)}`} />
        <Row label="People in your book" value={`${customers.length} customers`} />
      </Section>

      <Section
        title="Who may owe you"
        note="Read from the chats, and each row carries the reason it stands on. A row becomes a fiado the moment you confirm it."
      >
        {likelyOwed.map((row) => (
          <div
            key={row.customer}
            data-likely={row.customer}
            style={{
              display: 'flex',
              gap: theme.sizing.scale300,
              alignItems: 'flex-start',
              paddingTop: theme.sizing.scale400,
              paddingBottom: theme.sizing.scale400,
              borderTop: `1px solid ${theme.colors.borderOpaque}`,
              minWidth: 0,
            }}
          >
            <NoticedMark />
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale100, flex: 1, minWidth: 0 }}>
              {/* ── A NAME THAT OPENS A SHEET IS A TARGET (QA 50) ──────────────────────────
                  These six measured 309 × 20 px — the only presses under the house's 44 px floor
                  across all twenty-two routes. The treatment is the one `money-overview.tsx`
                  already gives its own door links: the box grows around the words, and the words
                  stay exactly where they were. */}
              <a
                href={`#/customers/${row.customer}`}
                style={{
                  ...theme.typography.LabelMedium,
                  color: theme.colors.contentPrimary,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  minHeight: '44px',
                }}
              >
                {nameOf(row.customer)}
              </a>
              <span style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}>
                {row.reason}
              </span>
            </div>
          </div>
        ))}
      </Section>

      {/* «A test rule stays on the screen until the one that replaces it lands» is the build
          talking about itself (QA 52). The fact is that Rocoto shows the rule it is using. */}
      <Section title="The rule it ranks on" note="Rocoto shows the rule it is ranking on, so you can tell it apart from what you wrote down.">
        <Row label="Today" value={RANKING_RULE} />
        <Row label="What replaces it" value="The debt read, off the same chats" />
      </Section>

      <Section title="What you confirmed" note="The fiado book is what you pressed on the read screen, and it is what Money counts.">
        <Row label="In your fiado book" value={`${confirmed.length} customers`} />
        {confirmed.map((row) => (
          <Row
            key={row.customerId}
            label={row.customerName}
            value={`${fiadoWords(row.sales)} · Since ${dayWords(row.since)}`}
          />
        ))}
      </Section>

      <Section title="Taking it out" note="Your sales as a file, by transaction and by customer, over the window you choose.">
        <Row label="The window Rocoto holds" value={`${money.windows.money.days} days · ${dayRange(money.windows.money.from, money.windows.money.to)}`} />
        <div style={{ alignSelf: 'flex-start', paddingTop: theme.sizing.scale300 }}>
          <Button
            kind={KIND.secondary}
            size={SIZE.compact}
            endEnhancer={() => <ChevronRight size={16} aria-hidden />}
            onClick={() => { window.location.hash = '#/money/export'; }}
          >
            Sales export
          </Button>
        </div>
      </Section>
    </Seat>
  );
}
