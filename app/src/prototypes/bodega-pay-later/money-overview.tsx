/* MONEY — THE CARDS. Cedar's `money-overview.tsx`, COPIED, re-ordered around the bank account.
 *
 * «We would actually see their bank account to begin with because that's the whole point.»
 *                                                                — Peter, FEED-IA §268
 *
 * ONE COLUMN AT 393 px, in this order and no other (DESIGN-SPEC.md §3 Money):
 *
 *   1  Bank account             the account of record, `Money in` labelled by source and dated,
 *                               and both directions at `#/money/bank`
 *   2  What you owe suppliers   one row per purchase, the state in five words, `Pay` handing the
 *                               amount as a `Figure`, pay-later's own seat its own sentence
 *   3  Who may owe you          `money-credit.tsx` — ONE fiado book, every row with its standing
 *   4  Record                   one level word over three counted indicators, the rule printed
 *   5  Place in the list        the cleared line, her dated facts, and `Suppliers you brought`
 *   6  Payment links            every payment page the shop has made, with its words and its address
 *
 * A TITLE NAMES THE THING AND DROPS THE POSSESSIVE (VOICE rule 2, the QA pass item 53): `Bank
 * account`, `Record`, `Place in the list` — the area says `Money` once, in the header.
 *
 * NO HERO BAND ABOVE THE CARDS. Money's own cover is the dialog on its first open, and the
 * `referrals` cover bands `Suppliers you brought` alone — its second and last seat.
 *
 * ONE CLOCK (item 17). Every seeded day is rolled onto the day Prep reads (`seedDay` in
 * `supplier-payments.ts`), so a purchase one day past its day agreed says so on every date the
 * founder opens the app, and `Money in` ends on today.
 *
 * WHAT IS REAL AND WHAT IS SEEDED, said on the screen rather than in this comment alone: the bank
 * card reads the polled provider capability, so with copper unreachable it draws the account of
 * record and the sentence saying what the read adds to it; `Money in`, the purchases, the record's
 * 90-day counts and the queue's dated facts come from the money seed, and each block says
 * `Sample money` with the window it covers.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { ChevronRight, Copy } from 'lucide-react';
import { Figure } from '../cedar/figure';
import { FeatureArtwork } from '../cedar/feature-artwork';
import { WorkflowDialog } from '../cedar/workflow-dialog';
import { formatMoney } from '../cedar/money-model';
import { readBankActivity, useBankCapability, type BankActivity } from '../cedar/money-bank-api';
import { usePhone } from '../cedar/shell/viewport';
import { house, money as moneySeed, suppliers } from './cast';
import { bodegaMoney, paymentLinks, useMoney, MONEY_SCOPE } from './money-store';
import { WhoOwesYouCard, OwedOverview, fiadoDate } from './money-credit';
import { PaymentLinkComposer } from './payment-link-actions';
import { BANK_REACH_LINE, PaymentSettings } from './payment-settings';
import { PAY_LATER_PLACEHOLDER, PAY_LATER_PLACEHOLDER_LABEL, PAY_LATER_PLACEHOLDER_LINE,
  payLaterVisible } from './paylater';
import { confirmPaid, moneyToday, orderPurchases, paymentGrades, paymentIndicator, purchaseCarriesAmount,
  purchaseDate, purchaseState, purchaseSummary, readPaidBook, seedDay, seedWindowDays,
  withConfirmations, writePaidBook, type SupplierPurchase } from './supplier-payments';
import { readRecord, type RecordReading } from './record';
import { BRING_MORE_ACT, PLACE_MOVES_LINE, INVITE_WORD, inLineWords, queueLine, queueStanding,
  readInvites, supplierCountWords, suppliersBrought, type QueueStanding, type SupplierInvite } from './queue';
import { WORKING_CAPITAL_EN } from './regulatory';
import { saveStatementPdf, type StatementInput } from './paper/statement-pdf';

export { MONEY_SCOPE };

/* ── THE WINDOWS THE SEED COVERS, ON THE DAY THE APP IS OPENED ────────────────────────────── */

const windowWords = (from: string, to: string): string => `${purchaseDate(from)} to ${purchaseDate(to)}`;

/** The seed's windows, rolled onto today's clock, so `Money in` ends on the day Prep prints. */
export const sampleMoneyLine = (): string => {
  const window = seedWindowDays(moneySeed.windows.money);
  return `Sample money · ${windowWords(window.from, window.to)}`;
};
const bankWindowLine = (): string => {
  const window = seedWindowDays(moneySeed.windows.bank);
  return `Sample money · ${windowWords(window.from, window.to)}`;
};

/* ── THE PURCHASES, OFF THE MONEY SEED ────────────────────────────────────────────────────── */

const supplierName = (id: string): string => suppliers.find((row) => row.id === id)?.name ?? id;
const supplierPhone = (id: string): string | undefined => suppliers.find((row) => row.id === id)?.phone;

/**
 * ONE ROW PER PURCHASE. An amount rides a row only where the money seed declares one — the chat
 * corpus states quantities and days and states a price nowhere — so a row with no declared amount
 * reads its quantity line instead, which is exactly what the supplier wrote.
 */
export function seededPurchases(): SupplierPurchase[] {
  const open: SupplierPurchase[] = moneySeed.payables.rows.map((row) => ({
    id: `purchase-${row.supplier}-${row.due}`,
    supplierId: row.supplier,
    supplierName: supplierName(row.supplier),
    ...(supplierPhone(row.supplier) ? { supplierPhone: supplierPhone(row.supplier) } : {}),
    ...(Number.isSafeInteger(row.amountMinor) && row.amountMinor > 0 ? { amountMinor: row.amountMinor } : {}),
    deliveredOn: seedDay(row.delivered),
    dueOn: seedDay(row.due),
  }));
  const settled: SupplierPurchase[] = moneySeed.payables.settled.map((row) => ({
    id: `purchase-${row.supplier}-${row.paid}`,
    supplierId: row.supplier,
    supplierName: supplierName(row.supplier),
    ...(supplierPhone(row.supplier) ? { supplierPhone: supplierPhone(row.supplier) } : {}),
    amountMinor: row.amountMinor,
    deliveredOn: seedDay(row.paid),
    dueOn: seedDay(row.paid),
    settledOn: seedDay(row.paid),
    settledBy: 'bank',
    settledNote: row.grade,
  }));
  return orderPurchases([...open, ...settled]);
}

/** Her own `I paid it` confirmations, kept in step with storage and the reset contract. */
function usePurchases(scope: string): [SupplierPurchase[], (purchaseId: string, on: string) => void] {
  const [book, setBook] = React.useState(() => readPaidBook(scope));
  React.useEffect(() => {
    const again = () => setBook(readPaidBook(scope));
    window.addEventListener('rocoto:bodega-payments-changed', again);
    window.addEventListener('rocoto:bodega-workspace-reset', again);
    window.addEventListener('storage', again);
    return () => {
      window.removeEventListener('rocoto:bodega-payments-changed', again);
      window.removeEventListener('rocoto:bodega-workspace-reset', again);
      window.removeEventListener('storage', again);
    };
  }, [scope]);
  const rows = React.useMemo(() => orderPurchases(withConfirmations(seededPurchases(), book)), [book]);
  const confirm = React.useCallback((purchaseId: string, on: string) => {
    const next = confirmPaid(readPaidBook(scope), purchaseId, on);
    writePaidBook(next);
    setBook(next);
  }, [scope]);
  return [rows, confirm];
}

/* ── THE SHARED CARD SHAPE ────────────────────────────────────────────────────────────────── */

function useCardClass(): { card: string; linkCard: string; grid: string; boardCard: string } {
  const [css, theme] = useStyletron();
  const card = css({
    display: 'grid', alignContent: 'start', alignSelf: 'start', gap: theme.sizing.scale500, minWidth: 0,
    padding: theme.sizing.scale600, border: `1px solid ${theme.colors.borderOpaque}`,
    borderRadius: theme.borders.radius400, backgroundColor: theme.colors.backgroundPrimary,
    color: theme.colors.contentPrimary, textDecoration: 'none',
  });
  const linkCard = css({
    ':hover': { backgroundColor: theme.colors.backgroundSecondary },
    ':focus-visible': { outline: `2px solid ${theme.colors.contentPrimary}`, outlineOffset: '3px' },
  });
  /* ONE COLUMN AT 393 px, TWO ON THE DESK (DESIGN-SPEC.md §8).
     IT IS A COLUMN BOARD RATHER THAN A GRID, and that is what closes item 20's hole. Six cards of
     six different heights in a two-column GRID leave a rectangle of white under every card shorter
     than the one beside it — measured at ~700 px in the right half. A two-column FLOW packs each
     card under the one above it and balances the two columns by height, so a column ends where its
     last card does. `breakInside: avoid` keeps a card whole. */
  const grid = css({
    minWidth: 0,
    columnCount: 2,
    columnGap: theme.sizing.scale600,
    '@media (max-width: 900px)': { columnCount: 1 },
  });
  /** A card seated on that board: kept whole, with the board's own gap under it. */
  const boardCard = `${card} ${css({ breakInside: 'avoid', marginBottom: theme.sizing.scale600 })}`;
  return { card, linkCard, grid, boardCard };
}

/* ── CARD 1 · BANK ACCOUNT ────────────────────────────────────────────────────────────────── */

/**
 * ONE POSTURE, READ FROM ONE PLACE (the QA pass, item 19).
 *
 * `#/money/bank` displayed the shop's BCP account, said no account was connected, said BCP was the
 * one bank outside Rocoto's reach, and offered `Add your bank account` — four statements about one
 * fact, three of them wrong. The account of record is the fixture's own (`house.bank`,
 * `house.account`), which is exactly what Administration shows, so Money says the same thing:
 * the account stands, and the live read opens on it.
 *
 *   reading    the provider answers — the balance and the movements are on screen
 *   on file    the shop's own account, named, with the read still to open on it
 */
export type BankStanding = 'reading' | 'on-file';

export const bankStandingOf = (posture: string): BankStanding =>
  posture === 'ready' ? 'reading' : 'on-file';

/** `BCP · ahorros · moneda nacional · 193-2415678-0-33` — the account of record, in one line. */
export const accountOfRecord = (): string => `${house.bank} · ${house.account}`;

/** What lands on the card once the read opens, said as what IS. */
export const BANK_READ_LINE = 'Your balance and your movements land here once Rocoto opens the read on this account.';

const BANK_WORDS: Record<string, string> = { bbva: 'BBVA', interbank: 'Interbank', scotiabank: 'Scotiabank' };

/** `Money in`, labelled by source and dated — the money seed's own 30 days of credits. */
export const moneyInRows = (): { source: string; credits?: number; amountMinor: number }[] => [
  { source: 'Yape', credits: moneySeed.incoming30d.yape.credits, amountMinor: moneySeed.incoming30d.yape.totalMinor },
  { source: 'Plin', credits: moneySeed.incoming30d.plin.credits, amountMinor: moneySeed.incoming30d.plin.totalMinor },
  { source: 'Counter', amountMinor: moneySeed.incoming30d.cashTillMinor },
];

/** IN-APP DOORS WEAR THE CHEVRON (item 40). `ArrowUpRight` says «this leaves the app», and every
 *  one of these addresses is a hash route inside it; one styling, on every door of every card. */
function Door({ href, children, testId }: { href: string; children: React.ReactNode; testId?: string }) {
  const [, theme] = useStyletron();
  return <a href={href} data-testid={testId} style={{ ...theme.typography.LabelSmall,
    color: theme.colors.contentPrimary, textDecoration: 'none', minHeight: 44,
    display: 'inline-flex', alignItems: 'center', gap: theme.sizing.scale200 }}>
    {children}<ChevronRight size={16} aria-hidden /></a>;
}

export function BankCard({ scope, className }: { scope: string; className?: string }) {
  const [, theme] = useStyletron();
  const bank = useBankCapability(scope);
  const standing = bankStandingOf(bank.posture);
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };

  return <section data-testid="money-bank-card" data-bank-posture={bank.posture}
    data-bank-standing={standing} className={className}
    style={{ display: 'grid', gap: theme.sizing.scale500, alignContent: 'start', minWidth: 0 }}>
    <h2 style={{ ...theme.typography.HeadingXSmall, margin: 0 }}>Bank account</h2>

    {standing === 'reading' ? <>
      <span data-testid="money-bank-balance" data-amount-minor={bank.balanceMinor ?? 0}
        style={{ display: 'block' }}>
        <Figure value={(bank.balanceMinor ?? 0) / 100} unit="S/" size="display" decimals={2} />
      </span>
      <p style={quiet}>{BANK_WORDS[bank.bank ?? ''] ?? house.bank} · {bank.accountLabel} {bank.accountMask}</p>
    </> : <div data-testid="money-bank-on-file" style={{ display: 'grid', justifyItems: 'start',
      gap: theme.sizing.scale400 }}>
      <FeatureArtwork kind="money" size={120} />
      <p data-testid="money-bank-account" style={{ ...theme.typography.ParagraphMedium, margin: 0 }}>
        {accountOfRecord()}</p>
      <p style={quiet}>{BANK_READ_LINE}</p>
      <p data-testid="money-bank-reach" style={quiet}>{BANK_REACH_LINE}</p>
      <Button size={SIZE.compact} kind={KIND.secondary} data-testid="money-bank-manage"
        overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
        onClick={() => { window.location.hash = '#/admin/connections'; }}>Manage the connection</Button>
    </div>}

    <div style={{ display: 'grid', gap: theme.sizing.scale300, paddingTop: theme.sizing.scale400,
      borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.sizing.scale300 }}>
        <h3 style={{ ...theme.typography.LabelMedium, margin: 0 }}>Money in</h3>
        <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentSecondary }}>{bankWindowLine()}</span>
      </div>
      {moneyInRows().map((row) => <div key={row.source} data-testid={`money-in-${row.source.toLowerCase()}`}
        style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.sizing.scale400,
          minHeight: '32px' }}>
        <span style={{ ...theme.typography.ParagraphSmall, minWidth: 0 }}>
          {row.source}{row.credits ? ` · ${row.credits} payments` : ''}
        </span>
        <span style={{ ...theme.typography.LabelSmall, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {bodegaMoney(row.amountMinor)}</span>
      </div>)}
      <Door href="#/money/bank" testId="money-bank-open">Money in and money out</Door>
    </div>
  </section>;
}

/* ── THE PAYMENT PAGES THE SHOP HAS MADE ──────────────────────────────────────────────────── */

/**
 * A PAGE THAT WAS MADE IS A PAGE THAT IS ON SCREEN (the QA pass, item 8). `Make the page` wrote a
 * record to storage and painted nothing, so the shop pressed it and read an unchanged screen. Every
 * page it has made stands here with its words, its amount and its own address.
 */
export function PaymentLinksCard({ scope, className }: { scope: string; className?: string }) {
  const [, theme] = useStyletron();
  const { state } = useMoney(scope);
  const [composing, setComposing] = React.useState(false);
  const rows = paymentLinks(state);
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };

  return <section data-testid="money-links-card" data-links={rows.length} className={className}
    style={{ display: 'grid', gap: theme.sizing.scale400, alignContent: 'start', minWidth: 0 }}>
    <h2 style={{ ...theme.typography.HeadingXSmall, margin: 0 }}>Payment links</h2>
    {rows.length > 0
      ? rows.slice(0, 5).map((row) => <a key={row.id} href={row.url.slice(row.url.indexOf('#'))}
        data-testid={`money-link-row-${row.id}`} data-amount-minor={row.amountMinor}
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center',
          gap: theme.sizing.scale400, minHeight: '48px', textDecoration: 'none',
          color: theme.colors.contentPrimary, paddingTop: theme.sizing.scale300,
          paddingBottom: theme.sizing.scale300, borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
        <span style={{ display: 'grid', gap: theme.sizing.scale100, minWidth: 0 }}>
          <span style={{ ...theme.typography.LabelMedium, overflowWrap: 'anywhere' }}>{row.customerName}</span>
          <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentSecondary,
            overflowWrap: 'anywhere' }}>{row.description}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: theme.sizing.scale200,
          ...theme.typography.LabelMedium, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {bodegaMoney(row.amountMinor)}<ChevronRight size={16} aria-hidden /></span>
      </a>)
      : <p style={quiet}>A payment page you make stands here, with its words, its amount and its own address.</p>}
    <Button size={SIZE.compact} kind={KIND.secondary} data-testid="money-links-make"
      overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
      onClick={() => setComposing(true)}>Make a payment page</Button>
    {composing && <PaymentLinkComposer scope={scope} onClose={() => setComposing(false)} />}
  </section>;
}

/* ── CARD 2 · WHAT YOU OWE YOUR SUPPLIERS ─────────────────────────────────────────────────── */

function PayDialog({ purchase, onPaid, onClose }: {
  purchase: SupplierPurchase; onPaid: (on: string) => void; onClose: () => void;
}) {
  const [, theme] = useStyletron();
  const [message, setMessage] = React.useState('');
  const amount = purchase.amountMinor ?? 0;
  const label: React.CSSProperties = { ...theme.typography.LabelSmall, color: theme.colors.contentSecondary };

  return <WorkflowDialog title={`Pay ${purchase.supplierName}`} onClose={onClose} testId="pay-dialog"
    step={`Delivered ${purchaseDate(purchase.deliveredOn)} · due ${purchaseDate(purchase.dueOn)}`}
    actions={<Button data-testid="pay-confirm" overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
      onClick={() => { onPaid(moneyToday()); onClose(); }}>I paid it</Button>}>
    <div style={{ display: 'grid', gap: theme.sizing.scale700, minWidth: 0 }}>
      <div style={{ display: 'grid', gap: theme.sizing.scale300 }}>
        <span style={label}>Amount</span>
        {amount > 0
          ? <span data-testid="pay-amount" data-amount-minor={amount}>
            <Figure value={amount / 100} unit="S/" size="large" decimals={2} />
          </span>
          : <p data-testid="pay-amount" style={{ ...theme.typography.ParagraphMedium, margin: 0 }}>
            {purchase.quantityLine ?? 'The amount arrives with the supplier’s own message.'}</p>}
        {amount > 0 && <Button size={SIZE.compact} kind={KIND.secondary} data-testid="pay-copy"
          overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText((amount / 100).toFixed(2));
              setMessage('The amount is on your clipboard.');
            } catch { setMessage('Read the amount above and type it into your app.'); }
          }}><Copy size={16} aria-hidden />&nbsp;Copy the amount</Button>}
      </div>
      <div style={{ display: 'grid', gap: theme.sizing.scale300 }}>
        <span style={label}>Their account</span>
        <p style={{ ...theme.typography.ParagraphMedium, margin: 0 }}>
          Yape · {purchase.supplierPhone ?? 'ask them for their number'}</p>
      </div>
      {/* THE SENTENCE NAMES THE EVENT, AND THE ACT NAMES ITSELF (item 37). «Press below» describes
          a layout rather than a fact: it means nothing to a screen reader and it is wrong the
          moment the sheet reflows, and `I paid it` already says what the press does. */}
      <p style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 }}>
        When your bank shows the payment, Rocoto settles this row on its own.
      </p>
      {message && <p role="status" data-testid="pay-message" style={{ ...theme.typography.ParagraphSmall, margin: 0 }}>{message}</p>}
    </div>
  </WorkflowDialog>;
}

/**
 * ONE GRID, THREE CELLS: the supplier and its state, the amount, the act (item 38).
 *
 * The rows were a flex line whose amount was pushed right by whatever followed it, so four open
 * purchases right-aligned at one x and the settled row — which carries no `Pay` — sat 60 px out of
 * the column, on the screen where the column IS the point. The act's cell stands empty on a settled
 * row instead, so every figure in the card reads down one edge.
 */
const PURCHASE_GRID = 'minmax(0, 1fr) auto 88px';

function PurchaseRow({ purchase, today, onPay }: {
  purchase: SupplierPurchase; today: string; onPay: () => void;
}) {
  const [, theme] = useStyletron();
  const state = purchaseState(purchase, today, payLaterVisible());
  return <div data-testid={`purchase-row-${purchase.id}`} data-state={state.kind}
    data-amount-minor={purchase.amountMinor ?? 0}
    style={{ display: 'grid', gridTemplateColumns: PURCHASE_GRID, alignItems: 'center',
      columnGap: theme.sizing.scale400, minHeight: '48px', paddingTop: theme.sizing.scale400,
      paddingBottom: theme.sizing.scale400, borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
    <span style={{ display: 'grid', gap: theme.sizing.scale100, minWidth: 0 }}>
      <span style={{ ...theme.typography.LabelMedium, overflowWrap: 'anywhere' }}>{purchase.supplierName}</span>
      <span data-testid={`purchase-state-${purchase.id}`}
        style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentSecondary }}>{state.word}</span>
    </span>
    {purchaseCarriesAmount(purchase)
      ? <span style={{ ...theme.typography.LabelMedium, whiteSpace: 'nowrap', textAlign: 'right',
        fontVariantNumeric: 'tabular-nums' }}>{bodegaMoney(purchase.amountMinor as number)}</span>
      : <span style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, textAlign: 'right' }}>
        {purchase.quantityLine ?? 'Amount from their message'}</span>}
    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
      {purchase.settledOn ? null : <Button size={SIZE.compact} kind={KIND.secondary}
        overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
        data-testid={`purchase-pay-${purchase.id}`} onClick={onPay}>Pay</Button>}
    </span>
  </div>;
}

export function SuppliersCard({ scope, className, full = false }: { scope: string; className?: string; full?: boolean }) {
  const [, theme] = useStyletron();
  const [rows, confirm] = usePurchases(scope);
  const [paying, setPaying] = React.useState<string | null>(null);
  const today = moneyToday();
  const openRows = rows.filter((row) => !row.settledOn);
  const settledRows = rows.filter((row) => row.settledOn);
  const shown = full ? openRows : openRows.slice(0, 4);
  const open = rows.find((row) => row.id === paying);
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };

  return <section data-testid="money-suppliers-card" className={className}
    style={{ display: 'grid', gap: theme.sizing.scale400, alignContent: 'start', minWidth: 0 }}>
    {/* The full page states the heading itself, so the card says it once rather than twice. */}
    <header style={{ display: 'grid', gap: theme.sizing.scale200 }}>
      {!full && <h2 style={{ ...theme.typography.HeadingXSmall, margin: 0 }}>What you owe suppliers</h2>}
      <p data-testid="money-suppliers-summary" style={quiet}>{purchaseSummary(rows, today)}</p>
    </header>
    {shown.map((row) => <PurchaseRow key={row.id} purchase={row} today={today} onPay={() => setPaying(row.id)} />)}

    {/* SETTLED ROWS STAND UNDER THEIR OWN WORD (item 38). Five rows under «4 purchases to pay»
        left the fifth one unaccounted for, and its empty act cell read as a row half-drawn. */}
    {full && settledRows.length > 0 && <>
      <h3 data-testid="money-suppliers-settled" style={{ ...theme.typography.LabelLarge, margin: 0,
        paddingTop: theme.sizing.scale500 }}>Settled</h3>
      {settledRows.map((row) => <PurchaseRow key={row.id} purchase={row} today={today} onPay={() => setPaying(row.id)} />)}
    </>}

    {!full && <Door href="#/money/suppliers" testId="money-suppliers-open">Every purchase</Door>}

    {/* PAY-LATER'S OWN SEAT, DECLARED IN WORDS, AND OUTSIDE THE ROW LIST (item 38). `Offered` and
        `Used` land on these rows the day a lender signs. Inside the list it read as one more
        purchase; under the card's own rule it reads as the region it is. */}
    <div data-placeholder={PAY_LATER_PLACEHOLDER} data-pay-later-visible={payLaterVisible() ? 'yes' : 'no'}
      style={{ display: 'grid', gap: theme.sizing.scale200, marginTop: theme.sizing.scale400,
        padding: theme.sizing.scale500, borderRadius: theme.borders.radius300,
        backgroundColor: theme.colors.backgroundSecondary }}>
      <h3 style={{ ...theme.typography.LabelMedium, margin: 0 }}>{PAY_LATER_PLACEHOLDER_LABEL}</h3>
      <p style={quiet}>{PAY_LATER_PLACEHOLDER_LINE}</p>
    </div>

    {open && <PayDialog purchase={open} onPaid={(on) => confirm(open.id, on)} onClose={() => setPaying(null)} />}
  </section>;
}

/* ── CARD 4 · YOUR RECORD ─────────────────────────────────────────────────────────────────── */

/** The reading, off the money seed's own indicators plus whatever she has confirmed since. */
export function useRecordReading(scope: string): RecordReading {
  const [rows] = usePurchases(scope);
  const today = moneyToday();
  return React.useMemo(() => {
    const grades = paymentGrades(rows, today);
    const seed = moneySeed.record.indicators;
    const paidSeed = seed.find((row) => row.id === 'paid-on-the-day');
    const payments = paymentIndicator(
      { count: paidSeed?.count ?? 0, of: paidSeed?.of ?? 0, bankGraded: paidSeed?.bankGraded ?? 0,
        newestReason: paidSeed?.newestReason ? `${purchaseDate(today)} · ${paidSeed.newestReason}` : undefined },
      grades, moneySeed.payables.settled.length);
    return readRecord({
      asOf: today,
      connectedOn: seedDay(moneySeed.queue.inLineSince, today),
      lastMeasuredPaymentOn: grades.newestOn || undefined,
      indicators: [
        { id: 'paid-on-the-day', ...payments },
        /* THE SEED STATES THE FACT AND THE CLOCK STATES ITS DAY. A reason that carried «18 Sep»
           inside the string was still printing it on the 20th (item 17). */
        ...seed.filter((row) => row.id !== 'paid-on-the-day').map((row) => ({
          id: row.id as 'days-with-a-sale' | 'sales-with-the-payment-recorded',
          count: row.count, of: row.of,
          newestReason: `${purchaseDate(today)} · ${row.newestReason}`,
        })),
      ],
    });
  }, [rows, today]);
}

export function RecordCard({ scope, className }: { scope: string; className?: string }) {
  const [, theme] = useStyletron();
  const reading = useRecordReading(scope);
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };
  return <a href="#/money/record" data-testid="money-record-card" data-level={reading.level} className={className}
    style={{ display: 'grid', gap: theme.sizing.scale400, alignContent: 'start', minWidth: 0,
      color: theme.colors.contentPrimary, textDecoration: 'none' }}>
    <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.sizing.scale400 }}>
      <h2 style={{ ...theme.typography.HeadingXSmall, margin: 0 }}>Record</h2>
      <ChevronRight size={18} aria-hidden />
    </header>
    <strong data-testid="money-record-level" style={{ ...theme.typography.HeadingLarge, margin: 0 }}>{reading.level}</strong>
    <p data-testid="money-record-reason" style={quiet}>{reading.levelReason}</p>
    {reading.indicators.map((row) => <div key={row.id} data-testid={`record-line-${row.id}`}
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between',
        gap: theme.sizing.scale300, paddingTop: theme.sizing.scale300,
        borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
      <span style={{ ...theme.typography.ParagraphSmall, minWidth: 0 }}>{row.title}</span>
      <span style={{ ...theme.typography.LabelSmall, whiteSpace: 'nowrap' }}>{row.words}</span>
    </div>)}
  </a>;
}

/* ── CARD 5 · YOUR PLACE IN THE LIST ──────────────────────────────────────────────────────── */

function useStanding(scope: string): { standing: QueueStanding; invites: SupplierInvite[] } {
  const [invites, setInvites] = React.useState<SupplierInvite[]>(() => readInvites(scope));
  React.useEffect(() => {
    const again = () => setInvites(readInvites(scope));
    window.addEventListener('storage', again);
    window.addEventListener('rocoto:bodega-workspace-reset', again);
    window.addEventListener('rocoto:bodega-invites-changed', again);
    return () => {
      window.removeEventListener('storage', again);
      window.removeEventListener('rocoto:bodega-workspace-reset', again);
      window.removeEventListener('rocoto:bodega-invites-changed', again);
    };
  }, [scope]);
  const standing = React.useMemo(() => queueStanding(moneySeed.queue, invites), [invites]);
  return { standing, invites };
}

export function PlaceCard({ scope, className }: { scope: string; className?: string }) {
  const [, theme] = useStyletron();
  const { standing } = useStanding(scope);
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };
  /* THE CARD CARRIES TWO DOORS RATHER THAN BEING ONE. `Suppliers you brought` and `Sales export`
     are two different destinations named in this card's own paragraph (DESIGN-SPEC.md §3 card 5),
     and a link inside a link is neither of them. */
  return <section data-testid="money-place-card" className={className}
    style={{ display: 'grid', gap: theme.sizing.scale400, alignContent: 'start', minWidth: 0 }}>
    <h2 style={{ ...theme.typography.HeadingXSmall, margin: 0 }}>Place in the list</h2>
    {/* ONE LANGUAGE ON ONE SCREEN (item 2). This build reads English, so the cleared line prints
        the English it was written from; the Spanish stands in `regulatory.ts` and in the fixture
        for the Spanish build, byte-exact and untouched. */}
    <p data-testid="money-queue-line" style={{ ...theme.typography.ParagraphMedium, margin: 0 }}>
      {queueLine(standing)}</p>
    <p data-testid="money-queue-since" style={quiet}>{inLineWords(standing.inLineSince)}</p>
    <p data-testid="money-queue-suppliers" style={quiet}>{supplierCountWords(standing)}</p>
    <p style={quiet}>{PLACE_MOVES_LINE}</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.sizing.scale600, alignItems: 'center',
      paddingTop: theme.sizing.scale400, borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
      <Door href="#/money/record#brought" testId="money-place-open">Suppliers you brought</Door>
      <Door href="#/money/export" testId="money-export-door">Sales export</Door>
    </div>
  </section>;
}

/* ── THE COLUMN ───────────────────────────────────────────────────────────────────────────── */

/** SIX CARDS, ONE COLUMN AT 393 px AND TWO ON THE DESK (DESIGN-SPEC.md §3 Money). The export is
 *  card 5's own door; `Payment links` is where a page the shop made comes back (item 8). */
export function MoneyOverview({ scope }: { scope: string }) {
  const { linkCard, grid, boardCard } = useCardClass();
  return <div data-testid="money-overview" className={grid}>
    <BankCard scope={scope} className={boardCard} />
    <SuppliersCard scope={scope} className={boardCard} />
    <WhoOwesYouCard scope={scope} className={boardCard} />
    <RecordCard scope={scope} className={`${boardCard} ${linkCard}`} />
    <PlaceCard scope={scope} className={boardCard} />
    <PaymentLinksCard scope={scope} className={boardCard} />
  </div>;
}

/* ── `#/money/bank` — BOTH DIRECTIONS ─────────────────────────────────────────────────────── */

export function BankPage({ scope }: { scope: string }) {
  const [, theme] = useStyletron();
  const bank = useBankCapability(scope);
  const [activity, setActivity] = React.useState<BankActivity | null>(null);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    let active = true;
    void readBankActivity(scope)
      .then((feed) => { if (active) { setActivity(feed); setError(''); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Refresh your bank movements.'); });
    return () => { active = false; };
  }, [scope]);
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };
  const movements = activity?.movements ?? [];

  return <section data-testid="money-bank-page" data-bank-standing={bankStandingOf(bank.posture)}
    style={{ display: 'grid', gap: theme.sizing.scale600, minWidth: 0 }}>
    <header style={{ display: 'grid', gap: theme.sizing.scale200 }}>
      <h1 style={{ ...theme.typography.HeadingMedium, margin: 0 }}>Money in and money out</h1>
      <p style={quiet}>{accountOfRecord()}</p>
    </header>
    {bank.posture === 'ready'
      ? movements.length > 0
        ? movements.map((row) => <div key={row.id} data-testid={`bank-movement-${row.id}`}
          data-debit-minor={row.debit_minor} data-credit-minor={row.credit_minor}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between',
            gap: theme.sizing.scale400, paddingTop: theme.sizing.scale400, paddingBottom: theme.sizing.scale400,
            borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
          <span style={{ display: 'grid', gap: theme.sizing.scale100, minWidth: 0 }}>
            <span style={{ ...theme.typography.LabelSmall, overflowWrap: 'anywhere' }}>{row.detail}</span>
            <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentSecondary }}>
              {purchaseDate(row.date)} · {row.credit_minor > 0 ? 'Money in' : 'Money out'}</span>
          </span>
          <span style={{ ...theme.typography.LabelMedium, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(row.credit_minor > 0 ? row.credit_minor : row.debit_minor, row.currency)}</span>
        </div>)
        : <p role="status" style={quiet}>{error || 'Your movements arrive with the next bank read.'}</p>
      : <div style={{ display: 'grid', gap: theme.sizing.scale500, justifyItems: 'start' }}>
        <FeatureArtwork kind="money" size={140} />
        {/* ONE POSTURE (item 19). The account above is the shop's own, so this says what the read
            adds to it rather than asking for an account that is already here. */}
        <p style={{ ...theme.typography.ParagraphMedium, margin: 0 }}>
          Both directions stand here once Rocoto opens the read: what came in, and what you paid out.
        </p>
        <p style={quiet}>{BANK_REACH_LINE}</p>
        <Button size={SIZE.compact} kind={KIND.secondary}
          overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
          data-testid="money-bank-page-manage"
          onClick={() => { window.location.hash = '#/admin/connections'; }}>Manage the connection</Button>
      </div>}
    <div style={{ display: 'grid', gap: theme.sizing.scale300, paddingTop: theme.sizing.scale500,
      borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
      <h2 style={{ ...theme.typography.HeadingXSmall, margin: 0 }}>Money in</h2>
      <p style={quiet}>{bankWindowLine()}</p>
      {moneyInRows().map((row) => <div key={row.source}
        style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.sizing.scale400 }}>
        <span style={theme.typography.ParagraphSmall}>{row.source}{row.credits ? ` · ${row.credits} payments` : ''}</span>
        <span style={{ ...theme.typography.LabelSmall, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {bodegaMoney(row.amountMinor)}</span>
      </div>)}
      <h2 style={{ ...theme.typography.HeadingXSmall, margin: 0, paddingTop: theme.sizing.scale400 }}>Money out</h2>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.sizing.scale400 }}>
        <span style={theme.typography.ParagraphSmall}>Through the bank · {moneySeed.outgoing30d.throughBank.payments} payments</span>
        <span style={{ ...theme.typography.LabelSmall, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {bodegaMoney(moneySeed.outgoing30d.throughBank.totalMinor)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.sizing.scale400 }}>
        <span style={theme.typography.ParagraphSmall}>From the till</span>
        <span style={{ ...theme.typography.LabelSmall, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {bodegaMoney(moneySeed.outgoing30d.fromTillMinor)}</span>
      </div>
    </div>
  </section>;
}

/* ── `#/money/suppliers` — EVERY PURCHASE ─────────────────────────────────────────────────── */

export function SuppliersPage({ scope }: { scope: string }) {
  const [, theme] = useStyletron();
  const { card } = useCardClass();
  return <section data-testid="money-suppliers-page" style={{ display: 'grid', gap: theme.sizing.scale600, minWidth: 0 }}>
    <h1 style={{ ...theme.typography.HeadingMedium, margin: 0 }}>What you owe suppliers</h1>
    <SuppliersCard scope={scope} className={card} full />
  </section>;
}

/* ── `#/money/record` — CARDS 4 AND 5, EACH AT ITS OWN BLOCK ───────────────────────────────── */

export function RecordPage({ scope, referralsCover: ReferralsBand }: {
  scope: string;
  /** the `referrals` cover band, handed down by `areas/money.tsx`'s guarded import of `covers.tsx` */
  referralsCover?: React.ComponentType<Record<string, never>>;
}) {
  const [, theme] = useStyletron();
  const { card } = useCardClass();
  const phone = usePhone();
  const reading = useRecordReading(scope);
  const { standing, invites } = useStanding(scope);
  /* THE ROWS AND THE COUNTS COME OFF ONE LIST (item 22): the seed's four invitations paint as
     rows, and the shop's own invitations replace them by supplier. */
  const brought = suppliersBrought(invites, moneySeed.queue);
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState('');

  /* THE DOCUMENT'S INPUT IS THIS SCREEN'S OWN READING (`paper/statement-pdf.ts`: «the input is a
     reading, never a store»), so the page and the paper are two renderings of one arithmetic. */
  const statement: StatementInput = React.useMemo(() => ({
    shop: { name: house.name, legalName: house.legalName, taxId: house.taxId, address: house.address },
    preparedAt: new Date().toISOString(),
    preparedDay: reading.asOf,
    window: seedWindowDays(moneySeed.windows.money),
    level: reading.level,
    levels: moneySeed.record.levels,
    levelRule: reading.rule.join(' '),
    indicators: reading.indicators.map((row) => ({
      label: row.title,
      count: row.count,
      of: row.of,
      windowDays: row.windowDays,
      asOf: row.asOf,
      floor: row.floor,
      bankGraded: row.bankGraded ?? undefined,
      reason: row.newestReason,
    })),
    queue: {
      inLineSince: standing.inLineSince,
      suppliers: standing.suppliers,
      invited: standing.invited,
      connected: standing.connected,
      line: queueLine(standing),
      moves: PLACE_MOVES_LINE,
      brought: brought.map((row) => ({ name: row.name, state: INVITE_WORD[row.state], at: row.at ?? reading.asOf })),
    },
    palette: {
      ink: theme.colors.contentPrimary,
      muted: theme.colors.contentSecondary,
      line: theme.colors.borderOpaque,
      paper: theme.colors.backgroundPrimary,
    },
  }), [reading, standing, brought, theme]);

  return <section data-testid="money-record-page" style={{ display: 'grid', gap: theme.sizing.scale700, minWidth: 0 }}>
    {/* ── the record ── */}
    <section id="record" className={card} data-testid="record-block" data-level={reading.level}
      style={{ scrollMarginTop: theme.sizing.scale800 }}>
      <h1 style={{ ...theme.typography.HeadingMedium, margin: 0 }}>Record</h1>
      <strong data-testid="record-level" style={{ ...(phone ? theme.typography.DisplayXSmall : theme.typography.DisplaySmall) }}>
        {reading.level}</strong>
      <p data-testid="record-reason" style={{ ...theme.typography.ParagraphMedium, margin: 0 }}>{reading.levelReason}</p>
      <p style={quiet}>{sampleMoneyLine()}</p>

      {/* THE COUNTS THE SHOP CAN RECOUNT, AND NOTHING IT CANNOT (item 21). The per-row percentage
          is gone: VOICE §3 lists a percentage under «what they never do», and `8 of 9 payments` is
          the same fact in the arithmetic a shopkeeper does herself. */}
      {reading.indicators.map((row) => <div key={row.id} data-testid={`record-indicator-${row.id}`}
        data-measured={row.measured ? 'yes' : 'no'} data-per-cent={row.perCent ?? ''}
        style={{ display: 'grid', gap: theme.sizing.scale200, paddingTop: theme.sizing.scale500,
          borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between',
          gap: theme.sizing.scale300 }}>
          <h2 style={{ ...theme.typography.LabelLarge, margin: 0 }}>{row.title}</h2>
          <span style={{ ...theme.typography.LabelMedium, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {row.words}</span>
        </div>
        {/* THE WINDOW LINE STATES THE WINDOW. The floor belongs to the row that sits under it, and
            `record.ts` already writes it in words beside the title — `Unknown · Counts from 3
            payments` — so a measured row prints its window alone. Same anatomy the A4 prints
            (`paper/statement-pdf.ts`: the floor rides the value, the note carries the window),
            which is what keeps the screen and the paper one arithmetic. */}
        <span style={quiet}>Last {row.windowDays} days to {purchaseDate(row.asOf)}</span>
        {row.gradeWords && <span data-testid={`record-grade-${row.id}`} style={quiet}>{row.gradeWords}</span>}
        {row.newestReason && <span data-testid={`record-newest-${row.id}`} style={quiet}>{row.newestReason}</span>}
      </div>)}

      {/* THE LEVEL RULE, PRINTED ON THE SCREEN. */}
      <div data-testid="record-rule" style={{ display: 'grid', gap: theme.sizing.scale200,
        paddingTop: theme.sizing.scale500, borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
        <h2 style={{ ...theme.typography.LabelLarge, margin: 0 }}>How the word is worked out</h2>
        {reading.rule.map((line) => <span key={line} style={theme.typography.ParagraphSmall}>{line}</span>)}
        <span style={quiet}>{reading.quietRule}</span>
      </div>

      {/* THE TRAIL LEFT THIS SCREEN (item 21). Every reason it quoted is printed once already, on
          the indicator row it belongs to, and the block repeated all three and then the level
          sentence a third time — under a chip labelled «Memory», which is the name of an internal
          log rather than anything a shopkeeper reads. The reasons stand on their rows. */}

      {/* ── `Save as a document` IS THE A4 (WIRING-SPEC.md §8) ──────────────────────────────
          «The lender hand-off is a document the shop sends itself», so the press writes
          `paper/statement-pdf.ts`'s page rather than a spreadsheet: the level word, the three
          counted lines with their windows and their newest reasons, the rule behind the word, and
          the place in the list — the same reading this screen draws, on paper the shop owns. The
          colours are handed in from the live theme, so the document re-themes with the app. */}
      <Button size={SIZE.compact} kind={KIND.secondary} data-testid="record-save"
        overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
        disabled={saving}
        onClick={() => {
          setSaving(true);
          setSaved('');
          void saveStatementPdf(statement)
            .then((bytes) => setSaved(`Saved · ${Math.max(1, Math.round(bytes / 1024))} KB`))
            .catch(() => setSaved('The document needs another press.'))
            .finally(() => setSaving(false));
        }}>Save as a document</Button>
      {saved && <span role="status" data-testid="record-saved" style={quiet}>{saved}</span>}
    </section>

    {/* ── the place in the list ── */}
    <section id="place" className={card} data-testid="place-block" style={{ scrollMarginTop: theme.sizing.scale800 }}>
      <h1 style={{ ...theme.typography.HeadingMedium, margin: 0 }}>Place in the list</h1>
      <p data-testid="place-queue-line" style={{ ...theme.typography.ParagraphLarge, margin: 0 }}>
        {queueLine(standing)}</p>
      <p data-testid="place-since" style={{ ...theme.typography.ParagraphMedium, margin: 0 }}>{inLineWords(standing.inLineSince)}</p>
      <p data-testid="place-suppliers" style={{ ...theme.typography.ParagraphMedium, margin: 0 }}>{supplierCountWords(standing)}</p>
      <p style={quiet}>{PLACE_MOVES_LINE}</p>

      <div style={{ display: 'grid', gap: theme.sizing.scale300, paddingTop: theme.sizing.scale500,
        borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
        <h2 style={{ ...theme.typography.LabelLarge, margin: 0 }}>Working capital</h2>
        {/* ONE LANGUAGE (item 2). The card printed the cleared Spanish and its English twin back
            to back, which reads as a translation left in by accident. */}
        <p data-testid="working-capital-line" style={theme.typography.ParagraphSmall}>{WORKING_CAPITAL_EN}</p>
      </div>
    </section>

    {/* ── suppliers you brought, under the referral cover ── */}
    <section id="brought" data-testid="brought-block" style={{ scrollMarginTop: theme.sizing.scale800,
      display: 'grid', minWidth: 0, overflow: 'hidden', backgroundColor: theme.colors.backgroundPrimary,
      border: `1px solid ${theme.colors.borderOpaque}`, borderRadius: theme.borders.radius400 }}>
      {/* THE `referrals` SEAT'S SECOND AND LAST HOME: a band at the head of this card, the caller
          owning the corners (covers.tsx's own note). */}
      {ReferralsBand && <ReferralsBand />}
      <div style={{ display: 'grid', gap: theme.sizing.scale500, minWidth: 0, padding: theme.sizing.scale600 }}>
      <h2 style={{ ...theme.typography.HeadingXSmall, margin: 0 }}>Suppliers you brought</h2>
      {brought.length > 0
        ? brought.map((row) => <div key={row.id} data-testid={`brought-row-${row.supplierId}`} data-state={row.state}
          style={{ display: 'flex', alignItems: 'center', gap: theme.sizing.scale400, minHeight: '48px',
            paddingTop: theme.sizing.scale300, borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
          <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 28, height: 28,
            borderRadius: theme.borders.radius300, backgroundColor: theme.colors.backgroundSecondary,
            ...theme.typography.LabelXSmall }}>
            {row.name.split(' ').slice(0, 2).map((part) => part.slice(0, 1)).join('')}</span>
          <span style={{ ...theme.typography.LabelMedium, flex: '1 1 auto', minWidth: 0, overflowWrap: 'anywhere' }}>{row.name}</span>
          <span style={{ ...theme.typography.LabelSmall, whiteSpace: 'nowrap' }}>{INVITE_WORD[row.state]}</span>
          {row.at && <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentSecondary,
            whiteSpace: 'nowrap' }}>{fiadoDate(row.at.slice(0, 10))}</span>}
        </div>)
        : <p style={quiet}>
          {standing.invited} of your {standing.suppliers} suppliers carry an invitation, and {standing.connected} have connected.
          Each row lands here with its own word as you send them.
        </p>}
      <Button size={SIZE.compact} kind={KIND.secondary} data-testid="brought-invite-more"
        overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
        onClick={() => { window.location.hash = '#/start/referrals'; }}>{BRING_MORE_ACT}</Button>
      </div>
    </section>
  </section>;
}

/* ── `#/money/export` — THE DOOR, NOT A PAGE ─────────────────────────────────────────────────
 * `Sales export` is `paper/export.tsx`'s `MoneyExport`, mounted by `areas/money.tsx` over the five
 * cards. The compact surface that stood here wrote two spreadsheets off the payment links alone;
 * the door writes the shop's whole record — the seeded ninety days plus every page it has made —
 * signs each row so a second export can say what moved, and carries the SUNAT sentence under the
 * two presses. One export, one arithmetic, one place to change it.
 */

/* ── `#/money/setup/payments` ──────────────────────────────────────────────────────────────── */

export function PaymentsSetupPage({ scope }: { scope: string }) {
  const [, theme] = useStyletron();
  return <section data-testid="money-payments-page" style={{ display: 'grid', gap: theme.sizing.scale600, minWidth: 0 }}>
    <h1 style={{ ...theme.typography.HeadingMedium, margin: 0 }}>Payments</h1>
    <PaymentSettings scope={scope} />
  </section>;
}

export { OwedOverview };
