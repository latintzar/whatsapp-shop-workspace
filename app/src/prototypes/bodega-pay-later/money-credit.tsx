/* WHO OWES YOU — the likely list, then the fiado book. Cedar's `money-credit.tsx`, COPIED, adapted.
 *
 * ═══ THE DEBTOR RULE, WHICH IS WHY THIS FILE LOOKS DIFFERENT FROM CEDAR'S ════════════════════
 * «we wont have how much they're owed reliably. so like it'll be based on messages history
 *  basically»                                                        — Peter, FEED-IA §268
 *
 * Cedar ranks INVOICES it issued. This shop has none: fiscal is off and the evidence is her own
 * chats. So the card holds `Who may owe you` until the first confirmation — the LIKELY
 * list, each row carrying its reason IN WORDS and an amount only where a message stated one — and
 * reads `Who owes you` from that confirmation on, over the fiado book the confirmation records.
 * `customerBalances` keeps Cedar's name and changes its source: the book, rather than the invoices.
 *
 * ═══ WHAT A FIADO REMINDER SAYS, AND WHAT IT LEAVES OUT ══════════════════════════════════════
 * The sale, the amount and the date, and nothing else: Cedar's FEE RUNG is dropped (`chase.ts`), so
 * the three rungs of the ladder differ in their count rather than in their register. The escalation
 * that Cedar puts in a firmer sentence sits here as a flag for a person — she knows her neighbour.
 *
 * ═══ WORD FOR WORD, «FIADO» ══════════════════════════════════════════════════════════════════
 * What a customer owes is FIADO, never «credit», and a document number reaches no string she reads.
 *
 * ═══ ONE SOURCE, SO A NAME CARRIES ONE REASON ════════════════════════════════════════════════
 * `Who may owe you` is this card's own heading, and it stands on the same rows the sign-up's
 * `These businesses have owed you` offers for sharing (ONBOARDING-SPEC.md §0, screen 8): one call,
 * `likelyList` over the ONE reading of the shop's chats (`history/read.ts`), with the reason line
 * and the printed rule as that read wrote them. Two readings of the same chats — `last order
 * yesterday` here, `last order 19 days ago` there — would leave the shop to work out which of them
 * is hers. THE AMOUNT IS ASKED FOR HERE, in Money, where the fiado book lives; the walk shares.
 *
 * THE FIXTURE'S OWN ROWS ARE THE SEED. `fixtures/cast-bodega.json` `chatCorpus.whoOwesYou` stands
 * where a read has yet to run, which is a fresh demo of the bodega world; the read replaces it the
 * moment the walk has read the chats, and the rule line says which rule ordered the rows. The pages
 * are screen 3's to fetch, so Money JOINS that read and starts none of its own.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { Checkbox, STYLE_TYPE } from 'baseui/checkbox';
import { Input } from 'baseui/input';
import { ChevronRight, PhoneCall } from 'lucide-react';
import { customerOf, likelyOwed, money as moneySeed } from './cast';
import { LAUGHS_RULE_LINE, likelyList, readingNow, type LikelyRow as ReadingRow,
  type ThreadReading,
  contactWords,
} from './history/read';
import { purchaseDate } from './supplier-payments';
import { FIADO_STANDING_WORD, bodegaMoney, confirmedFiado, fiadoBook, fiadoTotal, linkForCustomer,
  moneyStateNow, parseSoles, useMoney, type BodegaMoneyState, type FiadoBookRow,
  type FiadoRow } from './money-store';
import { PaymentLinkComposer } from './payment-link-actions';
import { ChaseDialog, sendChase, type ChaseSubject } from './chase-dialog';
import { chaseKey, chaseMessageOf, chaseRecordOf, chaseStatusWords, chaseStepOf, dueChases, putChase,
  readChase, setAuto, chasedWords, writeChase, type ChaseBook, type ChaseRecord } from './chase';

/* ── THE WORDS THE CARD CARRIES ───────────────────────────────────────────────────────────── */

/** The heading rule of card 3, in one place. */
export const OWED_HEADING_LIKELY = 'Who may owe you';
export const OWED_HEADING_BOOK = 'Who owes you';
export const owedHeading = (confirmed: boolean): string => confirmed ? OWED_HEADING_BOOK : OWED_HEADING_LIKELY;

/**
 * ONE SENTENCE FROM ONE CONSTANT (the QA pass, item 42). Money said «Ranked on your own messages:
 * fiado asked for, how recent, how often» about the same `likelyList` the Data seat described as
 * «Ranked by laughs in your chats for now», and the rig's rule is the laugh count — so the screen
 * whose job is to state the observable fact behind an inference was stating a different one. The
 * read owns the sentence and both screens print it.
 */
export const LIKELY_RULE_LINE = LAUGHS_RULE_LINE;

/** Peru writes the ninth month `setiembre`, and the reminder is read in Lima. */
const SPANISH_MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'] as const;

/** `2 Sep` — the shop's own calendar, the one grammar this surface writes dates in. The month table
 *  lives in `supplier-payments.ts`, so Money writes one date everywhere (`Since 2 Sep`, `Due 24 Sep`). */
export const fiadoDate = purchaseDate;

/** `2 de setiembre` — what a reminder states, the way MESSAGES.md row 14 states it. The reminder
 *  goes to a customer in Lima, so its day is written in her own language (item 39). */
export function fiadoLongDate(day: string): string {
  const at = new Date(`${day}T12:00:00Z`);
  if (!Number.isFinite(at.getTime())) return '';
  return `${at.getUTCDate()} de ${SPANISH_MONTHS[at.getUTCMonth()]}`;
}

/** `3 fiados · Since 2 Sep` — the row's own second line, with document numbers nowhere in it. */
export const fiadoLine = (row: FiadoRow): string =>
  `${row.sales} ${row.sales === 1 ? 'fiado' : 'fiados'} · Since ${fiadoDate(row.since)}`;

/* ── THE BOOK ─────────────────────────────────────────────────────────────────────────────── */

/**
 * CEDAR'S NAME, THIS SHOP'S ONE SOURCE. The book lives in `money-store.ts` — the money seed's own
 * six rows underneath, the shop's confirmations and corrections over them — so Money, Customers,
 * the Data seat and the export read one amount, one count and one date for a person.
 */
export const customerBalances = fiadoBook;

export { fiadoTotal };

/** The likely row a confirmation starts from, with the seeded amount where the money seed holds one
 *  for that person. The corpus itself states no amount, so the field opens blank otherwise. */
export type LikelyRow = {
  customerId: string;
  customerName: string;
  reason: string;
  /** what the money seed holds for this person, where it holds anything */
  seedAmountMinor?: number;
  seedSince?: string;
  seedSales?: number;
};

type Seed = Pick<LikelyRow, 'seedAmountMinor' | 'seedSince' | 'seedSales'>;

/** What the money seed holds for a person, which is what her amount field opens on. */
function seedOf(customerId: string): Seed {
  const seed = moneySeed.fiadoBook.rows.find((held) => held.customer === customerId);
  return seed ? { seedAmountMinor: seed.amountMinor, seedSince: seed.since, seedSales: seed.sales } : {};
}

/** The cast person a read chat belongs to, where the sample world's own chat id names one — so her
 *  row keeps her sheet, her phone and her seed. A chat the cast holds nobody for, which is every
 *  chat on the rig, keeps the read's own id. */
const CAST_CHAT = /^(?:customer|supplier)-(.+)$/;

function castIdOf(chatId: string): string {
  const named = CAST_CHAT.exec(chatId)?.[1] ?? '';
  return named && customerOf(named) ? named : chatId;
}

/** A read chat, as this surface draws it: the reason line the read wrote, kept word for word. */
function rowOfReading(row: ReadingRow): LikelyRow {
  const customerId = castIdOf(row.id);
  return { customerId, customerName: customerOf(customerId)?.name ?? contactWords(row), reason: row.reason,
    ...seedOf(customerId) };
}

/** The fixture's own row, the seed a shop whose chats are still to be read stands on. */
function rowOfSeed(row: (typeof likelyOwed)[number]): LikelyRow {
  return { customerId: row.customer, customerName: customerOf(row.customer)?.name ?? row.customer,
    reason: row.reason, ...seedOf(row.customer) };
}

export type LikelyStanding = {
  /** the people the list draws, the ones the book already holds left out */
  rows: LikelyRow[];
  /** the rule that ordered them, in the words the read prints for it */
  line: string;
};

/**
 * WHO IS LIKELY TO OWE, OUT OF THE ONE READ. `likelyList` is the call `#/start/owed` makes over the
 * same reading, so both screens rank the same people and print the same reason; the fixture's rows
 * are the seed this falls back to while that read is still to stand.
 */
export function likelyStanding(state: BodegaMoneyState, readings: ThreadReading[]): LikelyStanding {
  /* ANYONE THE BOOK ALREADY HOLDS IS OFF THIS LIST. It filtered on `state.fiado` alone, which is
     the CONFIRMATIONS; the book is seeded, so the six the seed names stood in both lists at once —
     one row with an amount and one without, under the same name, on the same screen. */
  const held = new Set(fiadoBook(state).map((row) => row.customerId));
  const read = likelyList(readings);
  const rows = read.rows.length > 0 ? read.rows.map(rowOfReading) : likelyOwed.map(rowOfSeed);
  return {
    rows: rows.filter((row) => !held.has(row.customerId)),
    line: read.rows.length > 0 && read.rule === 'laughs' ? LAUGHS_RULE_LINE : LIKELY_RULE_LINE,
  };
}

/** THE READING THE WALK LEFT BEHIND — this session's own read where screen 3 ran it, the stored
 *  reading after a reload, and an empty list where the chats are still to be read. */
function useReading(scope: string): ThreadReading[] {
  const [readings, setReadings] = React.useState<ThreadReading[]>(() => readingNow(scope));
  React.useEffect(() => {
    const again = () => setReadings(readingNow(scope));
    // A second tab writes the reading through `storage`; the shared reset clears it in this one.
    window.addEventListener('storage', again);
    window.addEventListener('rocoto:bodega-workspace-reset', again);
    return () => {
      window.removeEventListener('storage', again);
      window.removeEventListener('rocoto:bodega-workspace-reset', again);
    };
  }, [scope]);
  return readings;
}

/* ── THE CHASE BOOK, IN STEP WITH STORAGE ─────────────────────────────────────────────────── */

function useChaseBook(scope: string): [ChaseBook, (next: ChaseBook) => void] {
  const [book, setBook] = React.useState<ChaseBook>(() => readChase(scope));
  React.useEffect(() => {
    setBook(readChase(scope));
    const sync = (event: StorageEvent) => { if (event.key === null || event.key === chaseKey(scope)) setBook(readChase(scope)); };
    // The shared reset contract clears this key in the same tab, where no storage event fires.
    const again = () => setBook(readChase(scope));
    window.addEventListener('storage', sync);
    window.addEventListener('rocoto:bodega-chase-changed', again);
    window.addEventListener('rocoto:bodega-workspace-reset', again);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('rocoto:bodega-chase-changed', again);
      window.removeEventListener('rocoto:bodega-workspace-reset', again);
    };
  }, [scope]);
  const save = React.useCallback((next: ChaseBook) => { writeChase(next); setBook(next); }, []);
  return [book, save];
}

/** The subject a reminder is built from: the person, her number, the fiado and its day. */
export function chaseSubjectOf(row: FiadoRow): ChaseSubject {
  return {
    customerId: row.customerId,
    customerName: row.customerName,
    phone: customerOf(row.customerId)?.phone ?? '',
    amountMinor: row.amountMinor,
    saleDateText: fiadoLongDate(row.since),
    detail: fiadoLine(row),
  };
}

const textFor = (subject: ChaseSubject, link: string): string => chaseMessageOf({
  customerName: subject.customerName,
  saleDateText: subject.saleDateText,
  amountText: bodegaMoney(subject.amountMinor),
  link,
});

/* ── CARD 3, ON THE MONEY COLUMN ──────────────────────────────────────────────────────────── */

export function WhoOwesYouCard({ scope, className }: { scope: string; className?: string }) {
  const [css, theme] = useStyletron();
  const { state } = useMoney(scope);
  const [book, saveBook] = useChaseBook(scope);
  const [open, setOpen] = React.useState<string | null>(null);
  const [composing, setComposing] = React.useState(false);
  const readings = useReading(scope);
  const rows = fiadoBook(state);
  const confirmed = confirmedFiado(state);
  const likely = React.useMemo(() => likelyStanding(state, readings), [state, readings]);
  const top = rows.slice(0, 5);
  const now = new Date().toISOString();
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };
  const rowLink = css({
    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center',
    gap: theme.sizing.scale400, minHeight: '48px', textDecoration: 'none',
    color: theme.colors.contentPrimary, paddingTop: theme.sizing.scale400, paddingBottom: theme.sizing.scale400,
    borderTop: `1px solid ${theme.colors.borderOpaque}`,
    ':hover': { backgroundColor: theme.colors.backgroundSecondary },
    ':focus-visible': { outline: `2px solid ${theme.colors.contentPrimary}`, outlineOffset: '-2px' },
  });
  const opened = rows.find((row) => row.customerId === open);

  return <section data-testid="money-owed-card" data-confirmed={confirmed ? 'yes' : 'no'} className={className}
    style={{ display: 'grid', gap: theme.sizing.scale500, minWidth: 0, alignContent: 'start' }}>
    <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.sizing.scale400 }}>
      <h2 data-testid="money-owed-heading" style={{ ...theme.typography.HeadingXSmall, margin: 0 }}>{owedHeading(confirmed)}</h2>
      {rows.length > 0 && <strong data-testid="money-owed-total" style={{ ...theme.typography.HeadingSmall,
        whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{bodegaMoney(fiadoTotal(rows))}</strong>}
    </header>

    {/* ONE BOOK, AND EVERY ROW SAYS WHOSE ANSWER IT IS (the QA pass, item 7). The card read the
        confirmations alone and painted five names with empty amounts, while Customers two taps
        away printed the same six people with exact figures off the fixture. The figures were
        always there; what was missing was the word saying the shop has still to answer for them. */}
    {rows.length > 0 && <p style={quiet}>{rows.length} {rows.length === 1 ? 'person' : 'people'} · {likely.line}</p>}
    {top.map((row) => <a key={row.customerId} href={`#/customers/${encodeURIComponent(row.customerId)}`}
      data-testid={`money-owed-row-${row.customerId}`} data-amount-minor={row.amountMinor}
      data-standing={row.standing} className={rowLink}>
      <span style={{ display: 'grid', gap: theme.sizing.scale100, minWidth: 0 }}>
        <span style={{ ...theme.typography.LabelMedium, overflowWrap: 'anywhere' }}>{row.customerName}</span>
        <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentSecondary }}>
          {fiadoLine(row)} · {FIADO_STANDING_WORD[row.standing]}</span>
        {chasedWords(chaseRecordOf(book, row.customerId).sends.slice(-1)[0]?.at ?? null, now)
          && <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentSecondary }}>
            {chaseStatusWords(chaseRecordOf(book, row.customerId), now)}</span>}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: theme.sizing.scale200,
        ...theme.typography.LabelMedium, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {bodegaMoney(row.amountMinor)}<ChevronRight size={16} aria-hidden /></span>
    </a>)}
    {likely.rows.slice(0, 5).map((row) => <div key={row.customerId} data-testid={`money-likely-row-${row.customerId}`}
      style={{ display: 'grid', gap: theme.sizing.scale100, minWidth: 0, paddingTop: theme.sizing.scale400,
        paddingBottom: theme.sizing.scale400, borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
      <span style={{ ...theme.typography.LabelMedium, overflowWrap: 'anywhere' }}>{row.customerName}</span>
      <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentSecondary }}>{row.reason}</span>
    </div>)}

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.sizing.scale300, alignItems: 'center',
      paddingTop: theme.sizing.scale400, borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
      <a href="#/money/owed" data-testid="money-owed-open-all" style={{ ...theme.typography.LabelSmall,
        color: theme.colors.contentPrimary, textDecoration: 'none', minHeight: 44, display: 'inline-flex',
        alignItems: 'center', gap: theme.sizing.scale200 }}>Open the fiado book<ChevronRight size={16} aria-hidden /></a>
      {top[0] && <Button size={SIZE.compact} kind={KIND.secondary} data-testid="money-owed-chase"
        overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
        onClick={() => setOpen(top[0].customerId)}>Chase now</Button>}
      <Button size={SIZE.compact} kind={KIND.secondary} data-testid="money-owed-payment-link"
        overrides={{ BaseButton: { style: { minHeight: '44px' } } }}
        onClick={() => setComposing(true)}>Send a payment link</Button>
    </div>

    {opened && <ChaseDialog scope={scope} subject={chaseSubjectOf(opened)}
      record={chaseRecordOf(book, opened.customerId)}
      everyHours={chaseRecordOf(book, opened.customerId).auto.everyHours}
      link={linkForCustomer(state, opened.customerId)}
      buildText={(link) => textFor(chaseSubjectOf(opened), link)}
      onSent={(record) => saveBook(putChase(readChase(scope), record))}
      onMakeLink={() => setComposing(true)}
      onClose={() => setOpen(null)} />}
    {composing && <PaymentLinkComposer scope={scope} onClose={() => setComposing(false)} />}
  </section>;
}

/* ── THE WHOLE LIST, `#/money/owed` ───────────────────────────────────────────────────────── */

/** THE AUTO-CHASE TIMER, one runner for the page. It calls the same `sendChase` the dialog calls,
 *  so a timed reminder and a hand-sent one are the same event in the same record. */
function useChaseRunner(scope: string, rows: readonly FiadoRow[], book: ChaseBook,
  save: (next: ChaseBook) => void): void {
  const rowsRef = React.useRef(rows);
  React.useEffect(() => { rowsRef.current = rows; }, [rows]);
  React.useEffect(() => {
    const tick = () => {
      const now = new Date().toISOString();
      const current = readChase(scope);
      const balances = Object.fromEntries(rowsRef.current.map((row) => [row.customerId, row.amountMinor]));
      let next = current;
      for (const record of dueChases(current.records, now, balances)) {
        const row = rowsRef.current.find((item) => item.customerId === record.customerId);
        if (!row) continue;
        const subject = chaseSubjectOf(row);
        const link = linkForCustomer(moneyStateNow(scope), row.customerId);
        next = putChase(next, sendChase({ scope, subject, text: textFor(subject, link?.url ?? ''),
          channel: 'whatsapp', step: chaseStepOf(record), now, record,
          everyHours: record.auto.everyHours }));
      }
      if (next !== current) save(next);
    };
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, [scope, save]);
}

export function OwedOverview({ scope }: { scope: string }) {
  const [css, theme] = useStyletron();
  const money = useMoney(scope);
  const { state } = money;
  const [book, saveBook] = useChaseBook(scope);
  const [now, setNow] = React.useState(() => new Date().toISOString());
  const [open, setOpen] = React.useState<string | null>(null);
  const [composing, setComposing] = React.useState<LikelyRow | FiadoRow | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState('');
  const readings = useReading(scope);
  const allRows = fiadoBook(state);
  const rows = allRows.filter((row) => row.standing === 'confirmed');
  const unanswered = allRows.filter((row) => row.standing === 'likely');
  const likely = React.useMemo(() => likelyStanding(state, readings), [state, readings]);
  useChaseRunner(scope, rows, book, saveBook);
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date().toISOString()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const card = css({
    display: 'grid', gap: theme.sizing.scale500, minWidth: 0, padding: theme.sizing.scale600,
    border: `1px solid ${theme.colors.borderOpaque}`, borderRadius: theme.borders.radius400,
    backgroundColor: theme.colors.backgroundPrimary,
  });
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };
  const touch = { BaseButton: { style: { minHeight: '44px' } } };
  const opened = rows.find((row) => row.customerId === open);
  const composingRow = composing as (LikelyRow & FiadoRow) | null;

  /** What the field holds for a row: the shop's own keystrokes, or the figure the book opened on. */
  const draftOf = (row: { customerId: string; amountMinor?: number }): string =>
    drafts[row.customerId] ?? (row.amountMinor && row.amountMinor > 0 ? (row.amountMinor / 100).toFixed(2) : '');

  /**
   * THE FIGURE THE SHOP CAN SEE IS THE FIGURE THAT IS BOOKED (items 18 and 27). The act used to
   * fall back to `row.seedAmountMinor` on an empty field, so an empty press booked S/ 460.00
   * against Maribel and stamped it confirmed — an amount the shop never typed and never read.
   * The field opens on the seeded figure instead, every keystroke goes through one reader, and a
   * field that holds nothing readable leaves the act unpressable.
   */
  const confirm = (row: LikelyRow | FiadoBookRow) => {
    const reading = parseSoles(draftOf(row as { customerId: string; amountMinor?: number }));
    if (!reading.ok) { setMessage(reading.error); return; }
    const seeded = row as Partial<LikelyRow> & Partial<FiadoBookRow>;
    const result = money.confirmFiado({ customerId: row.customerId, customerName: row.customerName,
      amountMinor: reading.amountMinor,
      since: seeded.seedSince ?? seeded.since ?? new Date().toISOString().slice(0, 10),
      sales: seeded.seedSales ?? seeded.sales ?? 1, reason: row.reason });
    setMessage(result.ok ? `${row.customerName} is in your fiado book.` : result.error);
  };

  return <section data-testid="money-owed-page" style={{ display: 'grid', gap: theme.sizing.scale700, minWidth: 0 }}>
    <header style={{ display: 'grid', gap: theme.sizing.scale300 }}>
      <h1 style={{ ...theme.typography.HeadingMedium, margin: 0 }}>{owedHeading(rows.length > 0)}</h1>
      <p style={quiet}>{allRows.length > 0
        ? `${allRows.length} ${allRows.length === 1 ? 'person' : 'people'} · ${bodegaMoney(fiadoTotal(allRows))}`
        : likely.line}</p>
      <p data-testid="money-owed-rule" style={quiet}>{likely.line}</p>
      {/* ONE FILLED PRIMARY ON THE PAGE (item 36). Every row carried its own black button, so the
          page had six primaries and no primary. */}
      <span><Button kind={KIND.primary} size={SIZE.compact} overrides={touch}
        data-testid="money-owed-make-link" onClick={() => setComposing(rows[0] ?? unanswered[0] ?? null)}>
        Make a payment page</Button></span>
    </header>
    {message && <p role="status" data-testid="money-owed-message" style={quiet}>{message}</p>}

    {rows.map((row) => {
      const record = chaseRecordOf(book, row.customerId);
      const subject = chaseSubjectOf(row);
      return <article key={row.customerId} className={card} data-testid={`fiado-card-${row.customerId}`}
        data-amount-minor={row.amountMinor} data-step={chaseStepOf(record)} data-auto={record.auto.on ? 'on' : 'off'}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: theme.sizing.scale500 }}>
          <span style={{ display: 'grid', gap: theme.sizing.scale100, minWidth: 0 }}>
            <a href={`#/customers/${encodeURIComponent(row.customerId)}`} data-testid={`fiado-customer-${row.customerId}`}
              className={css({ ...theme.typography.LabelLarge, color: theme.colors.contentPrimary,
                textDecoration: 'none', overflowWrap: 'anywhere', ':hover': { textDecoration: 'underline' } })}>
              {row.customerName}</a>
            <span style={quiet}>{fiadoLine(row)}</span>
            {row.reason && <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentSecondary }}>{row.reason}</span>}
          </span>
          <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.sizing.scale500, marginLeft: 'auto' }}>
            <strong style={{ ...theme.typography.HeadingXSmall, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
              {bodegaMoney(row.amountMinor)}</strong>
            <Button kind={KIND.secondary} size={SIZE.compact} overrides={touch}
              data-testid={`chase-now-${row.customerId}`} onClick={() => setOpen(row.customerId)}>Chase now</Button>
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.sizing.scale300, alignItems: 'center' }}>
          <Button kind={KIND.secondary} size={SIZE.compact} overrides={touch}
            data-testid={`fiado-link-${row.customerId}`} onClick={() => setComposing(row)}>Send a payment link</Button>
          <Button kind={KIND.tertiary} size={SIZE.compact} overrides={touch}
            data-testid={`fiado-forget-${row.customerId}`}
            onClick={() => { money.forgetFiado(row.customerId); setMessage(`${row.customerName} is back on the likely list.`); }}>
            Put back on the likely list</Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: theme.sizing.scale400, borderTop: `1px solid ${theme.colors.borderOpaque}`, paddingTop: theme.sizing.scale400 }}>
          <Checkbox checked={record.auto.on} checkmarkType={STYLE_TYPE.toggle_round}
            onChange={(event) => {
              const on = (event.target as HTMLInputElement).checked;
              saveBook(putChase(readChase(scope), setAuto(record, on, record.auto.everyHours, new Date().toISOString())));
            }}
            overrides={{ Input: { props: { 'data-testid': `auto-chase-${row.customerId}` } },
              Root: { style: { minHeight: '44px', alignItems: 'center' } } }}>Remind again on its own</Checkbox>
          <span data-testid={`chase-status-${row.customerId}`} style={{ ...quiet, whiteSpace: 'nowrap' }}>
            {chaseStatusWords(record, now) || `Every ${record.auto.everyHours} h once you turn it on`}</span>
        </div>
        {record.flaggedAt && <div data-testid={`fiado-flag-${row.customerId}`} style={{ display: 'flex',
          alignItems: 'center', gap: theme.sizing.scale300, padding: theme.sizing.scale400,
          borderRadius: theme.borders.radius300, backgroundColor: theme.colors.backgroundSecondary,
          ...theme.typography.LabelSmall }}>
          <PhoneCall size={16} aria-hidden />Three reminders stand. This one is yours to finish.</div>}
        {record.sends.length > 0 && <details data-testid={`fiado-sends-${row.customerId}`}>
          <summary className={css({ ...theme.typography.LabelSmall, minHeight: '44px', alignContent: 'center', cursor: 'pointer' })}>
            {record.sends.length} {record.sends.length === 1 ? 'reminder' : 'reminders'} sent</summary>
          {record.sends.map((send) => <p key={send.at} style={{ ...quiet, paddingTop: theme.sizing.scale300,
            whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{chasedWords(send.at, now)} · {send.text}</p>)}
        </details>}
        {/* the subject the dialog would carry, read by the drive to prove the words */}
        <span hidden data-testid={`fiado-message-${row.customerId}`}>{textFor(subject, linkForCustomer(state, row.customerId)?.url ?? '')}</span>
      </article>;
    })}

    {/* ══ THE ROWS THE SHOP HAS STILL TO ANSWER FOR ═══════════════════════════════════════════
        ONE INSTRUCTION, ONE LABEL PER FIELD, ONE ACT PER ROW (item 36). The label «Amount in
        soles» stood over six fields on one screen and the S/ prefix says it, so the sentence is
        said once under the heading and the field carries its accessible name alone. On the desk
        the row reads as a table — the person and the reason in one column, a short field, one act
        — instead of a 775 px card whose content stopped at x≈887.
        THE ROW IS A FORM (item 41), so Enter in the field books the row. */}
    {(unanswered.length > 0 || likely.rows.length > 0) && <section data-testid="money-likely-list"
      style={{ display: 'grid', gap: theme.sizing.scale500 }}>
      {rows.length > 0 && <h2 style={{ ...theme.typography.HeadingXSmall, margin: 0 }}>Likely, from your own messages</h2>}
      <p style={quiet}>A row joins your fiado book on your own say-so, with the amount you remember, in soles.</p>
      {[...unanswered, ...likely.rows].map((row) => <form key={row.customerId} className={card}
        data-testid={`likely-card-${row.customerId}`}
        onSubmit={(event) => { event.preventDefault(); confirm(row); }}>
        <div className={css({ display: 'grid', alignItems: 'end', gap: theme.sizing.scale400,
          gridTemplateColumns: 'minmax(0, 1fr) 140px auto',
          '@media (max-width: 700px)': { gridTemplateColumns: 'minmax(0, 1fr)' } })}>
          <span style={{ display: 'grid', gap: theme.sizing.scale100, minWidth: 0 }}>
            <span style={{ ...theme.typography.LabelLarge, overflowWrap: 'anywhere' }}>{row.customerName}</span>
            <span style={quiet}>{row.reason}</span>
          </span>
          <Input size="compact" inputMode="decimal" startEnhancer="S/"
            value={draftOf(row as { customerId: string; amountMinor?: number })}
            onChange={(event) => setDrafts({ ...drafts, [row.customerId]: event.currentTarget.value })}
            aria-label={`Amount ${row.customerName} owes, in soles`}
            overrides={{ Input: { props: { 'data-testid': `likely-amount-${row.customerId}` } } }} />
          <Button kind={KIND.secondary} size={SIZE.compact} overrides={touch} type="submit"
            disabled={!parseSoles(draftOf(row as { customerId: string; amountMinor?: number })).ok}
            data-testid={`likely-confirm-${row.customerId}`}>Put it in the book</Button>
        </div>
      </form>)}
    </section>}

    {opened && <ChaseDialog scope={scope} subject={chaseSubjectOf(opened)}
      record={chaseRecordOf(book, opened.customerId)}
      everyHours={chaseRecordOf(book, opened.customerId).auto.everyHours}
      link={linkForCustomer(state, opened.customerId)}
      buildText={(link) => textFor(chaseSubjectOf(opened), link)}
      onSent={(record) => { saveBook(putChase(readChase(scope), record)); setNow(new Date().toISOString()); }}
      onMakeLink={() => setComposing(opened)}
      onClose={() => setOpen(null)} />}
    {composingRow && <PaymentLinkComposer scope={scope} customerId={composingRow.customerId}
      customerName={composingRow.customerName} amountMinor={composingRow.amountMinor}
      onClose={() => setComposing(null)} />}
  </section>;
}

/* ── THE FIADO BLOCK INSIDE A CUSTOMER SHEET ──────────────────────────────────────────────── */

/** Cedar's `CustomerCredit`, renamed to the word this shop uses. Money's rows open the sheet, and
 *  the sheet shows that person's own fiado (DESIGN-SPEC.md §3 Customers). */
export function CustomerFiado({ scope, customerId }: { scope: string; customerId: string }) {
  const [, theme] = useStyletron();
  const { state } = useMoney(scope);
  const row = fiadoBook(state).find((held) => held.customerId === customerId);
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };
  return <section data-testid="customer-fiado" data-standing={row?.standing ?? 'none'}
    style={{ display: 'grid', gap: theme.sizing.scale400, minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: theme.sizing.scale400 }}>
      <h3 style={{ ...theme.typography.HeadingXSmall, margin: 0 }}>Fiado</h3>
      <strong data-testid="customer-fiado-total" style={{ ...theme.typography.HeadingSmall,
        whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{bodegaMoney(row?.amountMinor ?? 0)}</strong>
    </div>
    {row ? <p style={quiet}>{fiadoLine(row)} · {FIADO_STANDING_WORD[row.standing]}</p>
      : <p style={quiet}>A fiado you put in the book stands here, with the day it started.</p>}
  </section>;
}
