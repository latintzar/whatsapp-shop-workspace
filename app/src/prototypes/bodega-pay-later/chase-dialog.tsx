/* CHASE NOW — the send a fiado row opens. Cedar's `chase-dialog.tsx`, COPIED, the fee gone.
 *
 * THE DIALOG STATES FOUR FACTS AND OFFERS ONE ACT (Cedar's own anatomy, kept): who it goes to,
 * which rung of the ladder it stands on, the exact words, and the door it travels. Everything a
 * person can change is in the words themselves, so the act needs no second question.
 *
 * WHAT THE COPY CHANGES:
 *   · the subject is a CUSTOMER and her fiado, rather than an invoice — fiscal is off
 *   · Cedar's fee sentence left with `chase.ts`'s fee rung, so the words are MESSAGES.md row 14's
 *     one cleared sentence: the sale, the amount and the date
 *   · the payment page is the shop's own `#/money/link/<id>` page, made by `money-store.createLink`
 *     with the words the shop typed, so the reminder points at the same page the card shares
 *   · the send is ONE SEAM, `sendChase`, which the dialog calls on Send and the auto-chase timer in
 *     `money-credit.tsx` calls with no dialog at all — one path, so a hand-sent reminder and a
 *     timed one are the same event
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { Textarea } from 'baseui/textarea';
import { ArrowUpRight } from 'lucide-react';
import { WorkflowDialog } from '../cedar/workflow-dialog';
import { moneyActions, type PaymentLink } from './money-store';
import { chaseStepOf, chaseStepWords, recordSend, type ChaseEvery, type ChaseRecord, type ChaseSend,
  type ChaseStep } from './chase';

export type ChaseSubject = {
  customerId: string;
  customerName: string;
  /** how the shop reaches her, which is the door the reminder travels */
  phone: string;
  amountMinor: number;
  /** the sale's own day, as the reminder states it */
  saleDateText: string;
  /** `3 fiados · Since 2 Sep`, the row's own second line */
  detail: string;
};

export type ChaseSendInput = {
  scope: string;
  subject: ChaseSubject;
  text: string;
  channel: ChaseSend['channel'];
  step: ChaseStep;
  /** the wall-clock instant the timer measures from */
  now: string;
  record: ChaseRecord;
  everyHours: ChaseEvery;
  linkId?: string;
};

/** One reminder, sent. Returns the record the card should hold afterwards. */
export function sendChase(input: ChaseSendInput): ChaseRecord {
  if (input.linkId) moneyActions(input.scope).recordLinkAction(input.linkId, 'sent');
  return recordSend(input.record,
    { at: input.now, step: input.step, channel: input.channel, text: input.text }, input.everyHours);
}

export type ChaseDialogProps = {
  scope: string;
  subject: ChaseSubject;
  record: ChaseRecord;
  everyHours: ChaseEvery;
  /** the page this reminder points at, once one stands */
  link?: PaymentLink;
  /** the words for this rung, given the page's address once it resolves */
  buildText: (link: string) => string;
  onSent: (record: ChaseRecord) => void;
  /** the act that makes the page this reminder would carry (the QA pass, item 39) */
  onMakeLink?: () => void;
  onClose: () => void;
};

export function ChaseDialog({ scope, subject, record, everyHours, link, buildText, onSent, onMakeLink, onClose }: ChaseDialogProps) {
  const [, theme] = useStyletron();
  const step = chaseStepOf(record);
  const [text, setText] = React.useState(() => buildText(link?.url ?? ''));
  const edited = React.useRef(false);
  const sending = React.useRef(false);
  const [sendError, setSendError] = React.useState('');

  React.useEffect(() => {
    if (link && !edited.current) setText(buildText(link.url));
    // The words are rebuilt for this row's own rung; `buildText` closes over the current book.
  }, [link?.url, subject.customerId]);

  const send = () => {
    if (sending.current) return;
    sending.current = true;
    setSendError('');
    try {
      onSent(sendChase({ scope, subject, text, channel: 'whatsapp', step,
        now: new Date().toISOString(), record, everyHours, linkId: link?.id }));
      onClose();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Reconnect to send this reminder.');
    } finally { sending.current = false; }
  };

  const label: React.CSSProperties = { ...theme.typography.LabelSmall, color: theme.colors.contentSecondary };
  const fact: React.CSSProperties = { ...theme.typography.ParagraphSmall, margin: 0, overflowWrap: 'anywhere' };

  return <WorkflowDialog title="Chase now" onClose={onClose} testId="chase-dialog" step={chaseStepWords(step)}
    actions={<Button data-testid="chase-send" disabled={text.trim().length === 0} onClick={send}
      overrides={{ BaseButton: { style: { minHeight: '44px' } } }}>Send</Button>}>
    <div style={{ display: 'grid', gap: theme.sizing.scale700, minWidth: 0 }}>
      {sendError && <p role="alert" style={fact}>{sendError}</p>}
      <div style={{ display: 'grid', gap: theme.sizing.scale200 }}>
        <span data-testid="chase-customer" style={theme.typography.HeadingXSmall}>{subject.customerName}</span>
        <span style={label}>{subject.detail}</span>
      </div>
      <label style={{ display: 'grid', gap: theme.sizing.scale300, ...theme.typography.LabelSmall, minWidth: 0 }}>Message
        <Textarea value={text} rows={5} aria-label="Reminder message"
          onChange={(event) => { edited.current = true; setText(event.currentTarget.value); }}
          overrides={{ Input: { props: { 'data-testid': 'chase-message' } } }} />
      </label>
      <div style={{ display: 'grid', gap: theme.sizing.scale200, minWidth: 0 }}>
        <span style={label}>Payment page</span>
        {link ? <a data-testid="chase-link" href={link.url} target="_blank" rel="noopener noreferrer"
          style={{ ...fact, color: theme.colors.contentPrimary, display: 'inline-flex', alignItems: 'center',
            gap: theme.sizing.scale200, minHeight: '44px' }}>Open the payment page<ArrowUpRight size={14} aria-hidden /></a>
          /* THE SENTENCE NAMED AN ACT THE SCREEN COULD NOT PERFORM (item 39). It is the act now. */
          : <span data-testid="chase-link"><Button kind={KIND.secondary} size={SIZE.compact}
            overrides={{ BaseButton: { style: { minHeight: '44px' } } }} data-testid="chase-make-link"
            onClick={() => { onClose(); onMakeLink?.(); }}>Make a payment page</Button></span>}
      </div>
      <div style={{ display: 'grid', gap: theme.sizing.scale200, minWidth: 0 }}>
        <span style={label}>Channel</span>
        <p data-testid="chase-channel" style={fact}>WhatsApp · {subject.phone}</p>
      </div>
    </div>
  </WorkflowDialog>;
}
