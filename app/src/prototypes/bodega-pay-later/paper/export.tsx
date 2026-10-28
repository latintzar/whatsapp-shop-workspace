/* THE EXPORT DOOR — `#/money/export`, by transaction and by customer (DESIGN-SPEC.md §3 card 5).
 *
 * `Sales export` is the last line of Money's fifth card and the last leg of the loop this whole
 * candidate is about: the shop's book leaves in a file it owns, readable by its contador, its bank
 * and any spreadsheet. Two doors, because those are the two questions anybody opens the file to
 * answer — what happened, and who it happened with.
 *
 * THE ROUTE IS MONEY'S OWN TAIL. `areas/money.tsx` reads `#/money/export` and mounts this
 * component; the door knows what to write and nothing about where it lives, so the area keeps its
 * router and this file keeps the paper.
 *
 * THE PERIOD IS THE RECORD'S, NOT THE FILE'S. The bundle carries the window it is a record of —
 * the fixtures declare 90 days, 20 June to 18 September 2026 — and the door prints it above the
 * doors, so the file's own heading and the screen agree before a finger touches anything.
 *
 * THE SUNAT SENTENCE IS THE TRUE ONE, BYTE-EXACT (DESIGN-SPEC.md §6, WIRING-SPEC.md §7). It is the
 * one Spanish string on this surface because it is the notice a Peruvian shopkeeper actually has
 * to read, and it says what IS: the money is in a bank account, and the bank reports that
 * account's balance at 7 UIT in a month. It is quoted from the spec and never re-worded here.
 *
 * THE ENVELOPE IS CEDAR'S OWN OBJECT (DESIGN-SPEC.md §5: «the envelope on the export»), imported
 * from `../../cedar/feature-artwork` rather than copied — only stores and keyed modules are copied
 * into this folder. There is no hero band here: a cover belongs where a flow starts or a feature
 * introduces itself, and this is a door a person came through on purpose.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SHAPE, SIZE } from 'baseui/button';
import { Checkbox, LABEL_PLACEMENT } from 'baseui/checkbox';
import { WorkflowDialog } from '../../cedar/workflow-dialog';
import { FeatureArtwork } from '../../cedar/feature-artwork';
import { prepareExport } from '../../cedar/export-period';
import type { ManualDocument } from '../../cedar/manual-exports';
import { customers as castCustomers, house, money, prepDay } from '../cast';
import { linkBalance, type BodegaMoneyState } from '../money-store';
import { SUNAT_EN, SUNAT_ES } from '../regulatory';
import { moneyToday, purchaseDate, seedDay, seedWindowDays } from '../supplier-payments';
import { backRun } from './back-run';
import {
  paperDocument, takeAway, type PaperBundle, type PaperCustomer, type PaperSheet, type PaperSheetId,
  type PaperTakeaway, type PaperTransaction,
} from './export-files';

/** THE TRUE SUNAT SENTENCE, HELD BYTE-EXACT (DESIGN-SPEC.md §6), in `regulatory.ts` where both
 *  languages of it stand together. Peru writes the thousands separator as a comma, so the figure
 *  reads `S/ 38,500`; the rule and the figure are the spec's own and are quoted rather than written. */
export const SUNAT_SENTENCE = SUNAT_ES;

/** WHAT THIS BUILD PRINTS (the QA pass, item 2). The screens read English, so the notice prints
 *  the English twin the cleared Spanish was written from; the Spanish ships with the Spanish build. */
export const SUNAT_NOTICE = SUNAT_EN;

/* ── the two doors ────────────────────────────────────────────────────────────────────────── */

type Door = { id: PaperSheetId; label: string; sub: string };

/** `By transaction` and `By customer` are §6's own strings; the sentence under each says what a
 *  row of that file IS, so the choice is made before the press rather than after the download. */
const DOORS: readonly Door[] = [
  { id: 'orders', label: 'By transaction', sub: 'One row per sale, with what it was for and how it was paid.' },
  { id: 'customers', label: 'By customer', sub: 'One row per person, with what they take and what they owe.' },
];

/* ── the day, in words ────────────────────────────────────────────────────────────────────── */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** `2026-06-20` → `20 June 2026`. A period a person reads aloud, rather than two ISO strings. */
export const dayWords = (iso: string): string => {
  const [year, month, day] = iso.split('-');
  const name = MONTHS[Number(month) - 1];
  return name ? `${Number(day)} ${name} ${year}` : iso;
};

/** ONE GRAMMAR FOR A WINDOW (item 54): `21 Jun to 19 Sep`, the shape Money prints over `Money in`
 *  and over the record's own counts, so the door and the two cards read one calendar. */
export const windowWords = (from: string, to: string): string => `${purchaseDate(from)} to ${purchaseDate(to)}`;

/* ── the seeded bodega, as a record to write ──────────────────────────────────────────────── */

const stateOf = (settles: string): string => (settles === 'fiado' ? 'Fiado' : 'Paid');

/**
 * THE RECORDS THE FIXTURES ACTUALLY DECLARE, turned into rows.
 *
 * THE FILE HOLDS THE PERIOD IT NAMES. The door prints 90 days, and the record two taps away says a
 * sale landed on 26 of the last 28 days and that 218 of 284 sales in that window carry a recorded
 * payment — so the 90 days are in this bundle as transactions, and the two screens agree. The day's
 * twelve orders (`prepDay.orders`) are the reference day's own rows; `paper/back-run.ts` writes the
 * days behind them from the counts the record asserts, the customers' own rates and bands, and the
 * fiado book. A customer's `sales` and `amount` count that same record, and `fiados` and `owed` are
 * the book's, which is now the same money the transaction rows carry.
 *
 * The moment Money's ledger holds those days, the area hands its own bundle in through the `bundle`
 * prop and this function is the seed a lone door boots on.
 */
export function seededBundle(): PaperBundle {
  const fiado = new Map(money.fiadoBook.rows.map((row) => [row.customer, row]));
  /* THE DAY'S TWELVE ARE TODAY'S TWELVE (item 17). The seed's own day is rolled onto the clock
     Prep reads, so the file's newest rows carry the day the shop is standing in. */
  const today = seedDay(prepDay.date);
  const transactions: PaperTransaction[] = [...backRun(), ...prepDay.orders.map((order) => ({
    reference: `sale-${today}-${String(order.n).padStart(2, '0')}`,
    day: today,
    at: order.received,
    customer: castCustomers.find((person) => person.id === order.customer)?.name ?? order.customer,
    amountMinor: order.totalMinor,
    paidBy: order.settles === 'fiado' ? '' : 'cash',
    state: stateOf(order.settles),
  }))];
  const customers: PaperCustomer[] = castCustomers.map((person) => {
    const mine = transactions.filter((row) => row.customer === person.name);
    const owed = fiado.get(person.id);
    return {
      id: person.id,
      name: person.name,
      phone: person.phone,
      channel: 'whatsapp',
      block: person.block,
      settles: person.settles,
      sales: mine.length,
      amountMinor: mine.reduce((total, row) => total + row.amountMinor, 0),
      fiados: owed?.sales ?? 0,
      owedMinor: owed?.amountMinor ?? 0,
      owedSince: owed?.since,
    };
  });
  return {
    house: house.name,
    currency: money.bank.currency,
    today: moneyToday(),
    window: seedWindowDays(money.windows.money),
    transactions,
    customers,
  };
}

/* ── the shop's own ledger, on top of the seed ────────────────────────────────────────────── */

/**
 * THE RECORD MONEY ACTUALLY HOLDS, as a bundle to write.
 *
 * The seeded ninety days stand underneath, and every payment page the shop has made since joins
 * them WITH THE WORDS IT TYPED — Peter: «you can generate new payment links with the description of
 * everything so that you keep stuff logged». That description is the one field the seeded day
 * cannot fill, and it is the reason this door is fed the store rather than the fixture: a row of
 * the file says what the sale was FOR, in the shop's own sentence.
 *
 * The confirmed fiado book replaces the seed's per-customer figures where the shop has confirmed a
 * row, because a confirmation is the shop's own answer about that person and the seed is a guess.
 */
export function ledgerBundle(state: BodegaMoneyState): PaperBundle {
  const seeded = seededBundle();
  const made: PaperTransaction[] = state.links.map((link) => ({
    reference: link.reference || link.id,
    day: link.createdAt.slice(0, 10),
    customer: link.customerName,
    describedAs: link.description,
    amountMinor: link.amountMinor,
    paidBy: linkBalance(state, link.id) === 0 ? 'yape' : undefined,
    state: linkBalance(state, link.id) === 0 ? 'Paid' : link.sentAt ? 'Sent' : 'Open',
    link: link.url,
  }));
  const confirmed = new Map(state.fiado.map((row) => [row.customerId, row]));
  const customers: PaperCustomer[] = seeded.customers.map((person) => {
    const own = made.filter((row) => row.customer === person.name);
    const book = confirmed.get(person.id);
    return {
      ...person,
      sales: person.sales + own.length,
      amountMinor: person.amountMinor + own.reduce((total, row) => total + row.amountMinor, 0),
      fiados: book ? book.sales : person.fiados,
      owedMinor: book ? book.amountMinor : person.owedMinor,
      owedSince: book ? book.since : person.owedSince,
    };
  });
  return { ...seeded, transactions: [...seeded.transactions, ...made], customers };
}

/* ── the door ─────────────────────────────────────────────────────────────────────────────── */

export type MoneyExportProps = {
  /** what the close control does — `areas/money.tsx` returns to `#/money` */
  onClose: () => void;
  /** the record to write. Left out, the door writes the seeded bodega world. */
  bundle?: PaperBundle;
};

/**
 * `Sales export`, the door of the same name.
 *
 * `prepareExport` does two jobs here (WIRING-SPEC.md §7): it signs every record in the document so
 * a second export can tell what moved, and — with `Only what changed` ticked — it projects the
 * document down to the records whose own rows differ from the last file taken here. The coverage
 * it returns is held for this visit alone, so the control says exactly what it measures and claims
 * nothing that outlives the page.
 */
export function MoneyExport({ onClose, bundle }: MoneyExportProps) {
  const [css, theme] = useStyletron();
  const record = React.useMemo(() => bundle ?? seededBundle(), [bundle]);
  const document_ = React.useMemo(() => paperDocument(record), [record]);
  const [coverage, setCoverage] = React.useState<Record<string, string>>({});
  const [changedOnly, setChangedOnly] = React.useState(false);
  const [took, setTook] = React.useState<Partial<Record<PaperSheetId, PaperTakeaway>>>({});
  const taken = Object.keys(took).length > 0;

  const write = (id: PaperSheetId) => {
    const prepared = prepareExport(document_ as ManualDocument, coverage, changedOnly && taken);
    const sheet = prepared.document.sheets[id === 'orders' ? 0 : 1] as PaperSheet;
    const result = takeAway(sheet, record.house, record.today);
    setCoverage(prepared.coverage);
    setTook((was) => ({ ...was, [id]: result }));
  };

  /* THE FACTS ARE THE FILE'S OWN ROWS. The period decides what goes in the file
     (`export-files.ts transactionsInWindow`), so the line above the doors counts the rows the two
     sheets hold rather than everything the bundle carries — a payment page made after the period
     closed is in the ledger and outside this file, and a count that included it would promise a
     row the shop cannot find. */
  const facts = [
    `${record.window.days} days`,
    `${document_.sheets[0].rows.length} sales`,
    `${document_.sheets[1].rows.length} customers`,
  ].join(' · ');

  return <WorkflowDialog title="Sales export" onClose={onClose} testId="money-export"
    dataProps={{ 'data-window-from': record.window.from, 'data-window-to': record.window.to }}
    actions={<Button kind={KIND.secondary} data-testid="money-export-done" onClick={onClose}>Done</Button>}>
    <div style={{ display: 'grid', gap: theme.sizing.scale700, alignContent: 'start', minWidth: 0 }}>

      {/* THE PERIOD, ABOVE THE DOORS, so the screen and the file's own heading agree first. */}
      <div className={css({ display: 'flex', alignItems: 'center', gap: theme.sizing.scale600, minWidth: 0 })}>
        <FeatureArtwork kind="email" size={88} />
        <div style={{ display: 'grid', gap: theme.sizing.scale200, minWidth: 0 }}>
          <strong data-testid="export-period" style={{ ...theme.typography.LabelLarge }}>
            {windowWords(record.window.from, record.window.to)}
          </strong>
          <span data-testid="export-facts" style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}>{facts}</span>
        </div>
      </div>

      {/* THE TWO DOORS. A press writes the file and the row states what went, in the control's own
          seat, because a download leaves nothing else on the screen (§76). */}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: theme.sizing.scale300 }}>
        {DOORS.map((door) => {
          const result = took[door.id];
          /* ONE SHAPE AT EVERY WIDTH: the words on the left, the control pinned right. What the
             press did sits WITH the words rather than beside the button, because at 393 px a
             badge in the control's seat pushes the button onto a second line and the two rows
             stop looking like one list. */
          return <li key={door.id} data-testid={`export-${door.id}`} className={css({
            display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center',
            columnGap: theme.sizing.scale500, minHeight: '48px',
            paddingTop: theme.sizing.scale400, paddingBottom: theme.sizing.scale400,
            borderBottom: `1px solid ${theme.colors.borderOpaque}`,
          })}>
            <span style={{ display: 'grid', gap: theme.sizing.scale100, minWidth: 0 }}>
              <strong style={theme.typography.LabelMedium}>{door.label}</strong>
              <span style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}>{door.sub}</span>
              {result && <span data-testid={`export-${door.id}-took`}
                style={{ ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary }}>
                {result.rows} rows · {Math.max(1, Math.round(result.bytes / 1024))} KB
              </span>}
            </span>
            <Button kind={KIND.tertiary} size={SIZE.compact} shape={SHAPE.pill}
              data-testid={`export-${door.id}-go`} onClick={() => write(door.id)}>Export</Button>
          </li>;
        })}
      </ul>

      {/* ONE CONTROL, AND IT SAYS WHAT IT MEASURES. It appears once a file has been taken here,
          because before that there is nothing for it to be measured against. */}
      {taken && <div data-testid="export-changed-only">
        <Checkbox checked={changedOnly} labelPlacement={LABEL_PLACEMENT.right}
          onChange={(event) => setChangedOnly(event.currentTarget.checked)}
          overrides={{ Root: { props: { 'data-testid': 'export-changed-only-control' } } }}>
          Only what changed since your last export
        </Checkbox>
        <p style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentTertiary, margin: `${theme.sizing.scale200} 0 0 0` }}>
          Counted from the files you take on this page.
        </p>
      </div>}

      {/* THE TRUE SUNAT SENTENCE, under the doors, where a person reads it before they send the
          file anywhere. Byte-exact from DESIGN-SPEC.md §6. */}
      <p data-testid="sunat-notice" className={css({
        margin: 0, padding: theme.sizing.scale600, borderRadius: theme.borders.radius300,
        backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.contentSecondary,
        ...theme.typography.ParagraphSmall,
      })}>{SUNAT_NOTICE}</p>
    </div>
  </WorkflowDialog>;
}

export default MoneyExport;
