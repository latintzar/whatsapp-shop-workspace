/* THE PAYMENT PAGE — its acts, and the words the shop types. Cedar's `payment-link-actions.tsx`, COPIED.
 *
 * «you can generate new payment links with the description of everything so that you keep stuff
 *  logged»                                                              — Peter, FEED-IA §268
 *
 * A PAYMENT LINK IS ROCOTO'S OWN CHECKOUT PAGE (WIRING-SPEC.md §9): Yape publishes no prefilled link
 * and no request-to-pay, so copper serves `GET /collect/{request_id}/{token}` printing the exact
 * amount and the shop's own account, with one reserved cent per request so a credit matches its own
 * sale. Cedar fills the request's `description` from a document number; HERE THE SHOP TYPES IT, and
 * that one string rides the request, the buyer page, the message and the export row.
 *
 * TWO PARTS: the COMPOSER, where she names an amount and says what it is for, and the ACTS on a page
 * that already stands — `Open the payment page`, `Copy the link`, `Send on WhatsApp`.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { Input } from 'baseui/input';
import { ArrowUpRight, Copy } from 'lucide-react';
import { WorkflowDialog } from '../cedar/workflow-dialog';
import { customerOf, house } from './cast';
import { bodegaMoney, linkBalance, useMoney, type PaymentLink } from './money-store';
import { waDigits } from './referrals';
import { moneyToday } from './supplier-payments';

const touch = { BaseButton: { style: { minHeight: '44px', minWidth: '44px' } } };

/* ── THE ACTS ON A PAGE THAT STANDS ───────────────────────────────────────────────────────── */

export function PaymentLinkActions({ scope, linkId }: { scope: string; linkId: string }) {
  const [, theme] = useStyletron();
  const money = useMoney(scope);
  const link = money.state.links.find((row) => row.id === linkId);
  const [message, setMessage] = React.useState('');
  if (!link) return null;
  const balance = linkBalance(money.state, link.id);
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };

  return <section data-testid="payment-link-actions" aria-label="Payment page"
    data-link-id={link.id} data-amount-minor={link.amountMinor} data-description={link.description}
    style={{ display: 'grid', gap: theme.sizing.scale400, minWidth: 0 }}>
    <h3 style={{ ...theme.typography.LabelMedium, margin: 0 }}>Payment page</h3>
    <p data-testid="payment-link-description" style={{ ...theme.typography.ParagraphSmall, margin: 0, overflowWrap: 'anywhere' }}>
      {link.description}
    </p>
    <p style={quiet}>{bodegaMoney(link.amountMinor)}{balance === 0 ? ' · paid' : ''}</p>
    {link.remotePending
      ? <p role="status" data-testid="payment-link-preparing" style={quiet}>Preparing the payment page…</p>
      : <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.sizing.scale300 }}>
        <a href={link.url} target="_blank" rel="noopener noreferrer" data-testid="payment-link-open"
          style={{ ...theme.typography.LabelSmall, color: theme.colors.contentPrimary, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: theme.sizing.scale200, minHeight: 44,
            paddingLeft: theme.sizing.scale400, paddingRight: theme.sizing.scale400,
            border: `1px solid ${theme.colors.borderOpaque}`, borderRadius: theme.borders.radius200 }}>
          Open the payment page<ArrowUpRight size={16} aria-hidden /></a>
        <Button size={SIZE.compact} kind={KIND.secondary} overrides={touch} data-testid="payment-link-copy"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link.url);
              const result = money.recordLinkAction(link.id, 'copied');
              setMessage(result.ok ? 'The link is on your clipboard.' : result.error);
            } catch { setMessage('Open the payment page to copy its address.'); }
          }}><Copy size={16} aria-hidden />&nbsp;Copy the link</Button>
        {balance > 0 && <Button size={SIZE.compact} kind={KIND.secondary} overrides={touch} data-testid="payment-link-send"
          onClick={() => {
            const result = money.recordLinkAction(link.id, 'sent');
            setMessage(result.ok ? 'Sent on WhatsApp.' : result.error);
          }}>Send on WhatsApp</Button>}
      </div>}
    {message && <p role="status" data-testid="payment-link-message" style={quiet}>{message}</p>}
  </section>;
}

/* ── THE COMPOSER ─────────────────────────────────────────────────────────────────────────── */

export type PaymentLinkComposerProps = {
  scope: string;
  /** the customer the page is for, where the shop opened it on a row */
  customerId?: string;
  customerName?: string;
  /** the amount the row suggests, in minor units */
  amountMinor?: number;
  onMade?: (link: PaymentLink) => void;
  onClose: () => void;
};

const solesText = (amountMinor?: number): string =>
  amountMinor && amountMinor > 0 ? (amountMinor / 100).toFixed(2) : '';

const minorOf = (text: string): number => {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
};

/** The message the shop sends with the page, in the customer's own language. */
export const linkMessageOf = (description: string, amountText: string, url: string): string =>
  `${description} · ${amountText}. Te dejo el link para pagar: ${url}`;

/**
 * THE PRESS ENDS ON SOMETHING (the QA pass, item 8).
 *
 * `Make the page` wrote a record to storage and closed the sheet, so the screen it returned to was
 * byte-identical to the one before the press: no link, nothing to copy, nothing to send, and the
 * page scrolled to the bottom on the way out. The dialog stays open on a RESULT STEP instead — the
 * address, `Copy the link`, `Send it on WhatsApp` — and the page it made stands on Money's own
 * `Payment links` card afterwards.
 *
 * ONE NAME FOR THE OBJECT. The title said «payment link» and the act said «Make the page», so the
 * dialog called one thing two things in 200 px. It is a PAYMENT PAGE, in the title and the button.
 */
export function PaymentLinkComposer({ scope, customerId, customerName, amountMinor, onMade, onClose }: PaymentLinkComposerProps) {
  const [, theme] = useStyletron();
  const money = useMoney(scope);
  const [amount, setAmount] = React.useState(() => solesText(amountMinor));
  const [description, setDescription] = React.useState('');
  const [name, setName] = React.useState(customerName ?? '');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [made, setMade] = React.useState<PaymentLink | null>(null);
  const first = React.useRef<HTMLInputElement | null>(null);
  const minor = minorOf(amount);
  const ready = minor > 0 && description.trim().length > 0 && name.trim().length > 0;

  /* THE SCROLL STAYS WHERE THE SHOP LEFT IT (item 8). The dialog's own open moved the page to its
     foot, and closing it left the reader at the bottom of a screen they opened at the top. */
  const held = React.useRef(0);
  React.useEffect(() => {
    held.current = window.scrollY;
    /* FOCUS THE FIRST FIELD, NEVER THE CLOSE CONTROL (item 41): a keyboard user's first Enter
       landed on «Close» and dismissed the sheet. */
    const timer = window.setTimeout(() => first.current?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
      window.scrollTo({ top: held.current });
    };
  }, []);

  const make = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setMessage('');
    const result = await money.createLink({
      amountMinor: minor, description, customerName: name.trim(),
      ...(customerId ? { customerId } : {}),
      sellerName: house.name, accountLabel: house.account,
      sampleClock: `${moneyToday()}T12:00:00-05:00`,
    });
    setBusy(false);
    if (result.ok) { setMade(result.value); onMade?.(result.value); }
    else setMessage(result.error);
  };

  const label: React.CSSProperties = { ...theme.typography.LabelSmall, display: 'grid', gap: theme.sizing.scale300 };
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };
  const phone = customerId ? customerOf(customerId)?.phone ?? '' : '';

  if (made) {
    const text = linkMessageOf(made.description, bodegaMoney(made.amountMinor), made.url);
    const whatsapp = `https://wa.me/${waDigits(phone)}?text=${encodeURIComponent(text)}`;
    return <WorkflowDialog title="Payment page" onClose={onClose} testId="payment-link-composer"
      step={`${made.customerName} · ${bodegaMoney(made.amountMinor)}`}
      actions={<Button kind={KIND.secondary} data-testid="payment-link-done"
        overrides={{ BaseButton: { style: { minHeight: '44px' } } }} onClick={onClose}>Done</Button>}>
      <div data-testid="payment-link-made" data-link-id={made.id} data-link-url={made.url}
        style={{ display: 'grid', gap: theme.sizing.scale600, minWidth: 0 }}>
        <p style={{ ...theme.typography.ParagraphMedium, margin: 0 }}>{made.description}</p>
        <p data-testid="payment-link-address" style={{ ...quiet, overflowWrap: 'anywhere' }}>{made.url}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.sizing.scale300, alignItems: 'center' }}>
          <Button size={SIZE.compact} kind={KIND.secondary} overrides={touch} data-testid="payment-link-copy-made"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(made.url);
                const result = money.recordLinkAction(made.id, 'copied');
                setMessage(result.ok ? 'The link is on your clipboard.' : result.error);
              } catch { setMessage('Read the address above and type it into your chat.'); }
            }}><Copy size={16} aria-hidden />&nbsp;Copy the link</Button>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" data-testid="payment-link-whatsapp"
            onClick={() => money.recordLinkAction(made.id, 'sent')}
            style={{ ...theme.typography.LabelSmall, color: theme.colors.contentPrimary, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: theme.sizing.scale200, minHeight: 44,
              paddingLeft: theme.sizing.scale400, paddingRight: theme.sizing.scale400,
              border: `1px solid ${theme.colors.borderOpaque}`, borderRadius: theme.borders.radius200 }}>
            Send it on WhatsApp<ArrowUpRight size={16} aria-hidden /></a>
          <a href={made.url.slice(made.url.indexOf('#'))} data-testid="payment-link-open-made"
            style={{ ...theme.typography.LabelSmall, color: theme.colors.contentPrimary, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: theme.sizing.scale200, minHeight: 44 }}>
            Open the payment page<ArrowUpRight size={16} aria-hidden /></a>
        </div>
        {message && <p role="status" style={quiet}>{message}</p>}
      </div>
    </WorkflowDialog>;
  }

  return <WorkflowDialog title="Payment page" onClose={onClose} testId="payment-link-composer"
    step="Rocoto's own page, with your account on it"
    actions={<Button data-testid="payment-link-make" disabled={!ready} isLoading={busy}
      overrides={{ BaseButton: { style: { minHeight: '44px' } } }} onClick={() => void make()}>Make the page</Button>}>
    {/* THE FIELDS ARE A FORM, so Enter in the last one makes the page (item 41). */}
    <form onSubmit={(event) => { event.preventDefault(); void make(); }}
      style={{ display: 'grid', gap: theme.sizing.scale700, minWidth: 0 }}>
      <label style={label}>Who it is for
        <Input value={name} onChange={(event) => setName(event.currentTarget.value)} size="compact"
          aria-label="Who it is for" placeholder="Rosa menú" inputRef={first}
          overrides={{ Input: { props: { 'data-testid': 'payment-link-customer' } } }} />
      </label>
      <label style={label}>Amount in soles
        <Input value={amount} onChange={(event) => setAmount(event.currentTarget.value)} size="compact"
          inputMode="decimal" aria-label="Amount in soles" startEnhancer="S/"
          overrides={{ Input: { props: { 'data-testid': 'payment-link-amount' } } }} />
      </label>
      <label style={label}>What this is for
        <Input value={description} onChange={(event) => setDescription(event.currentTarget.value)} size="compact"
          aria-label="What this is for" placeholder="Fiado of 2 September"
          overrides={{ Input: { props: { 'data-testid': 'payment-link-what-for' } } }} />
      </label>
      {/* A CUSTOMER MAY BE ANYONE (item 37), so the sentence says `your customer` and `they`. */}
      <p style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 }}>
        What you write here stands on the page your customer opens, in the message they read, and in your export.
      </p>
      {minor > 0 && <p data-testid="payment-link-preview" style={{ ...theme.typography.LabelMedium, margin: 0 }}>
        {bodegaMoney(minor)}
      </p>}
      {message && <p role="alert" style={{ ...theme.typography.ParagraphSmall, margin: 0 }}>{message}</p>}
      <button type="submit" hidden aria-hidden tabIndex={-1} />
    </form>
  </WorkflowDialog>;
}
