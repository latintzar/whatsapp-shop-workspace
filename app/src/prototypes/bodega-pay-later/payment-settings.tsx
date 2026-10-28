/* PAYMENTS — the receiving account and when a page goes out. Cedar's `payment-settings.tsx`, COPIED.
 *
 * Cedar's version reads its timing words out of `payment-lifecycle.ts`; that module belongs to the
 * order lifecycle, which this prototype leaves behind with the invoices, so the three timings are
 * named here against `money-model`'s own `PaymentTiming` type — one shop, one choice, one line
 * saying what the choice does.
 *
 * AND IT CARRIES THE BANK GAP, ONCE (WIRING-SPEC.md §8). Prometeo's login pattern resolves to three
 * receiving banks — BBVA, Interbank and Scotiabank — and Yape con DNI opens a BCP savings account,
 * so this shop usually connects no bank today. The gap is a fact, so the screen states it in one
 * line instead of offering a door that answers with an error.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { useMoney } from './money-store';
import { BANK_REACH_LINE } from './regulatory';
import type { MoneySetupState, PaymentTiming } from '../cedar/money-model';

/** The three timings, and what each one does, in the words the shop reads. */
export const PAYMENT_TIMING_WORDS: Record<PaymentTiming, string> = {
  delivery: 'On delivery',
  evening: 'That evening',
  'next-morning': 'The next morning',
};

export const paymentPolicyWords = (timing: PaymentTiming): string => ({
  delivery: 'A payment page goes out as you hand the order over.',
  evening: 'The day’s payment pages go out together in the evening.',
  'next-morning': 'The day’s payment pages go out the next morning.',
}[timing]);

/** The three banks Prometeo reads today, in the order copper resolves them. */
export const RECEIVING_BANKS: readonly MoneySetupState['bank'][] = ['bbva', 'interbank', 'scotiabank'];
export const BANK_WORDS: Record<MoneySetupState['bank'], string> = {
  bbva: 'BBVA', interbank: 'Interbank', scotiabank: 'Scotiabank',
};

/** WHICH BANKS ROCOTO READS, from the one place that states it (`regulatory.ts` · item 43). BCP
 *  leads the seven, so the shop's own account is one of them. */
export { BANK_REACH_LINE };

export function PaymentSettings({ scope }: { scope: string }) {
  const [, theme] = useStyletron();
  const money = useMoney(scope);
  const timing = money.state.setup.paymentTiming ?? 'delivery';
  const [message, setMessage] = React.useState('');
  const field: React.CSSProperties = {
    ...theme.typography.LabelSmall, minHeight: 44, maxWidth: '100%', padding: theme.sizing.scale400,
    color: theme.colors.contentPrimary, background: theme.colors.backgroundPrimary,
    border: `1px solid ${theme.colors.borderOpaque}`, borderRadius: theme.borders.radius200,
  };
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };

  return <section data-testid="payment-settings" style={{ display: 'grid', gap: theme.sizing.scale600,
    padding: theme.sizing.scale600, border: `1px solid ${theme.colors.borderOpaque}`,
    borderRadius: theme.borders.radius400, backgroundColor: theme.colors.backgroundPrimary, minWidth: 0 }}>
    <h2 style={{ ...theme.typography.HeadingXSmall, margin: 0 }}>Receiving account</h2>
    <label style={{ ...theme.typography.ParagraphSmall, display: 'grid', gap: theme.sizing.scale300 }}>Bank
      <select aria-label="Receiving bank" data-testid="payment-bank" value={money.state.setup.bank}
        onChange={(event) => {
          const result = money.updateSetup({ bank: event.target.value as MoneySetupState['bank'] });
          setMessage(result.ok ? 'Saved.' : result.error);
        }} style={field}>
        {RECEIVING_BANKS.map((bank) => <option key={bank} value={bank}>{BANK_WORDS[bank]}</option>)}
      </select>
    </label>
    <p data-testid="payment-bank-reach" style={quiet}>{BANK_REACH_LINE}</p>
    <Button size={SIZE.compact} kind={KIND.secondary} data-testid="payment-connect-bank"
      overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
      onClick={() => { window.location.hash = '#/admin/connections'; }}>Manage the connection</Button>

    <h2 style={{ ...theme.typography.HeadingXSmall, margin: 0, paddingTop: theme.sizing.scale400,
      borderTop: `1px solid ${theme.colors.borderOpaque}` }}>Payment timing</h2>
    <label style={{ ...theme.typography.ParagraphSmall, display: 'grid', gap: theme.sizing.scale300 }}>Send payment pages
      <select aria-label="Send payment pages" data-testid="payment-timing" value={timing}
        onChange={(event) => {
          const result = money.updateSetup({ paymentTiming: event.target.value as PaymentTiming });
          setMessage(result.ok ? 'Saved.' : result.error);
        }} style={field}>
        {(Object.keys(PAYMENT_TIMING_WORDS) as PaymentTiming[]).map((key) =>
          <option key={key} value={key}>{PAYMENT_TIMING_WORDS[key]}</option>)}
      </select>
    </label>
    <p data-testid="payment-policy" style={quiet}>{paymentPolicyWords(timing)}</p>
    {message && <p role="status" style={quiet}>{message}</p>}
  </section>;
}
