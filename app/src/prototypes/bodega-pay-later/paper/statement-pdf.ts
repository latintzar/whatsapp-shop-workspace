/* THE RECORD, AS A DOCUMENT — `Save as a document` on `#/money/record` (DESIGN-SPEC.md §3 card 4).
 *
 * WHAT THIS IS FOR. «The lender hand-off is a document the shop sends itself» (WIRING-SPEC.md §8).
 * Until a lender signs there is no share, no consent basis and no transmission: the shop presses a
 * button, gets an A4 file, and decides on its own what to do with it. So this file draws exactly
 * what the record's own screen draws — one level word, three counted lines with their windows and
 * their newest reasons, the rule that produced the word, and the place in the list — and adds
 * nothing a person could not recount off the screen it came from.
 *
 * ⚠ NOT ONE CREDIT FIGURE. No limit, no rate, no term, no date, because the lender name is empty
 * (DESIGN-SPEC.md §8's own test). This module holds no such field to write.
 *
 * HOW IT DRAWS, which is `dossier-pdf.ts`'s way unchanged: fixed A4 pages on `pdf-lib`, the
 * checked-in Inter subset embedded from the same dependency the app's typography uses, and every
 * colour handed in by the caller from the active theme — so the document re-themes with the app
 * and this file owns no paint of its own.
 *
 * THE INPUT IS A READING, NEVER A STORE. `record.ts` folds the indicators and the level word;
 * `queue.ts` folds the standing. Both hand their answers in, so the document and the screen are
 * two readings of one arithmetic.
 */
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import regularUrl from '@fontsource/inter/files/inter-latin-400-normal.woff?url';
import boldUrl from '@fontsource/inter/files/inter-latin-700-normal.woff?url';

/** The document's colours, supplied by the active theme's semantic tokens. */
export type StatementPalette = { ink: string; muted: string; line: string; paper: string };

/** ONE COUNTED LINE. Every field is printed, because an indicator that showed a count and hid its
 *  denominator, its window or its reason would be the weighted total this record exists to refuse. */
export type StatementIndicator = {
  /** the indicator's own name, as the record prints it — `Paid on the day` */
  label: string;
  /** what it counts, and out of what */
  count: number;
  of: number;
  /** the days it counts over */
  windowDays: number;
  /** the day it is counted to */
  asOf: string;
  /** the count below which the line reads as still counting */
  floor: number;
  /** how many of the counted events the bank graded, where the indicator is bank-graded */
  bankGraded?: number;
  /** the newest reason, in words */
  reason: string;
};

/** THE PLACE IN THE LIST, which carries dated facts and no position number. */
export type StatementQueue = {
  /** `2026-09-03` — printed as `In line since 3 September` */
  inLineSince: string;
  suppliers: number;
  invited: number;
  connected: number;
  /** the cleared queue line, verbatim, in the language it was cleared in */
  line: string;
  /** `Your place moves when a supplier you brought joins.` */
  moves: string;
  /** the suppliers this shop brought — a name, a state word and a date each */
  brought?: Array<{ name: string; state: string; at: string }>;
};

/** WHAT `createStatementPdf` TAKES. */
export type StatementInput = {
  /** the shop, as Administration holds it */
  shop: { name: string; legalName: string; taxId: string; address: string };
  /** the instant the document was made, ISO — it stamps the file's own metadata */
  preparedAt: string;
  /** the day it was made, `2026-09-18` */
  preparedDay: string;
  /** the period the indicators are counted over */
  window: { days: number; from: string; to: string };
  /** the level word — one of `levels` */
  level: string;
  /** the closed set, printed so the word can be placed — `Starting` · `Steady` · `Punctual` */
  levels: readonly string[];
  /** the rule that produced the word, printed on the screen and printed here */
  levelRule: string;
  indicators: StatementIndicator[];
  queue?: StatementQueue;
  palette: StatementPalette;
};

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 44;
const WIDTH = A4[0] - MARGIN * 2;

type Row = { label: string; value: string; note?: string };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** `2026-09-18` → `18 September 2026`. */
export const statementDayWords = (iso: string): string => {
  const [year, month, day] = iso.split('-');
  const name = MONTHS[Number(month) - 1];
  return name ? `${Number(day)} ${name} ${year}` : iso;
};

/** The file's own name, so two documents in a downloads folder are told apart unopened. */
export const statementFileName = (input: StatementInput): string =>
  `rocoto-${input.shop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-record-${input.preparedDay}.pdf`;

/** PDF colours come from the active theme's semantic tokens, converted here. */
function colour(value: string) {
  const hex = value.match(/^#([a-f\d]{3}|[a-f\d]{6})$/i)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((part) => part + part).join('') : hex;
    return rgb(parseInt(full.slice(0, 2), 16) / 255, parseInt(full.slice(2, 4), 16) / 255, parseInt(full.slice(4, 6), 16) / 255); // theme-gate-allow: convert the supplied semantic theme token to PDF channels
  }
  const channels = value.match(/[\d.]+/g)?.map(Number);
  if (channels && channels.length >= 3) return rgb(channels[0] / 255, channels[1] / 255, channels[2] / 255); // theme-gate-allow: preserve the supplied semantic theme token in PDF colour space
  throw new Error('Choose a theme colour for the document.');
}

/** The fonts come from the same checked-in Inter dependency as the app's typography. */
async function fontBytes(url: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Load the document font, then try again.');
  return response.arrayBuffer();
}

/** A line that states its count, its denominator and its window — the record's own anatomy. */
const indicatorValue = (indicator: StatementIndicator): string =>
  indicator.count >= indicator.floor
    ? `${indicator.count} of ${indicator.of}`
    : `Unknown · Counts from ${indicator.floor}`;

const indicatorNote = (indicator: StatementIndicator): string => {
  const parts = [`Last ${indicator.windowDays} days, to ${statementDayWords(indicator.asOf)}`];
  if (indicator.bankGraded !== undefined) parts.push(`${indicator.bankGraded} confirmed by your bank`);
  parts.push(indicator.reason);
  return parts.join(' · ');
};

/**
 * THE RECORD, ON A4.
 *
 * One page for a shop with three indicators and its place in the list; a second opens by itself
 * where the supplier list is long, because `room` starts a page rather than overflowing one.
 */
export async function createStatementPdf(input: StatementInput, signal?: AbortSignal): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await Promise.all([fontBytes(regularUrl, signal), fontBytes(boldUrl, signal)]);
  const regular = await pdf.embedFont(regularBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  const ink = colour(input.palette.ink), muted = colour(input.palette.muted);
  const line = colour(input.palette.line), paper = colour(input.palette.paper);
  pdf.setTitle(`Your record · ${input.shop.legalName}`);
  pdf.setAuthor(input.shop.legalName);
  pdf.setCreator('Rocoto');
  const prepared = new Date(input.preparedAt);
  pdf.setCreationDate(prepared);
  pdf.setModificationDate(prepared);
  let page!: PDFPage; // newPage initialises the page before any content is drawn.
  let y = 0;

  const lines = (value: string, font: PDFFont, size: number, width: number): string[] => {
    const result: string[] = [];
    for (const paragraph of String(value).split(/\r?\n/)) {
      let current = '';
      for (const word of paragraph.split(/[ \t]+/).filter(Boolean)) {
        const joined = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(joined, size) <= width) { current = joined; continue; }
        if (current) { result.push(current); current = ''; }
        // A long shop name keeps every character when it wraps across the fixed measure.
        for (const part of word) {
          if (current && font.widthOfTextAtSize(current + part, size) > width) { result.push(current); current = part; }
          else current += part;
        }
      }
      result.push(current);
    }
    return result;
  };
  const text = (value: string, x: number, top: number, size = 10, strong = false, tone = ink, width = WIDTH): number => {
    const font = strong ? bold : regular;
    const wrapped = lines(value, font, size, width);
    wrapped.forEach((row, index) => page.drawText(row, { x, y: top - index * (size + 4), size, font, color: tone }));
    return wrapped.length * (size + 4);
  };
  const newPage = () => {
    page = pdf.addPage(A4);
    page.drawRectangle({ x: 0, y: 0, width: A4[0], height: A4[1], color: paper });
    const headerHeight = text(input.shop.legalName, MARGIN, A4[1] - 35, 9, true, ink, WIDTH * 0.6);
    const stamp = `Prepared ${statementDayWords(input.preparedDay)}`;
    text(stamp, A4[0] - MARGIN - regular.widthOfTextAtSize(stamp, 8), A4[1] - 35, 8, false, muted);
    const ruleY = A4[1] - 35 - headerHeight;
    page.drawLine({ start: { x: MARGIN, y: ruleY }, end: { x: A4[0] - MARGIN, y: ruleY }, thickness: 0.6, color: line });
    y = ruleY - 30;
  };
  const room = (height: number) => { if (y - height < 57) newPage(); };
  const paragraph = (value: string, strong = false, size = 10, tone = ink) => {
    const height = lines(value, strong ? bold : regular, size, WIDTH).length * (size + 4);
    room(height + 8 + Math.max(0, size - 10)); y -= Math.max(0, size - 10);
    y -= text(value, MARGIN, y, size, strong, tone); y -= 8;
  };
  const row = ({ label, value, note }: Row) => {
    const labelWidth = WIDTH * 0.49, valueWidth = WIDTH - labelWidth - 12;
    const height = Math.max(lines(label, regular, 9, labelWidth).length * 13,
      lines(value, bold, 10, valueWidth).length * 14) + (note ? lines(note, regular, 8, WIDTH).length * 12 + 3 : 0) + 12;
    room(height);
    const used = Math.max(text(label, MARGIN, y, 9, false, muted, labelWidth),
      text(value, MARGIN + labelWidth + 12, y, 10, true, ink, valueWidth));
    y -= used + 4;
    if (note) y -= text(note, MARGIN, y, 8, false, muted) + 3;
    y -= 8;
  };
  const section = (number: string, title: string, source: string) => {
    room(92);
    y -= 8;
    page.drawLine({ start: { x: MARGIN, y: y + 12 }, end: { x: A4[0] - MARGIN, y: y + 12 }, thickness: 0.7, color: line });
    y -= text(`${number}   ${title}`, MARGIN, y, 15, true) + 3;
    y -= text(source, MARGIN, y, 8, false, muted) + 12;
  };

  newPage();
  paragraph('Your record', true, 10, muted);
  paragraph(input.shop.legalName, true, 30);
  paragraph(`${input.shop.taxId} · ${input.shop.address}`, false, 10, muted);
  paragraph(`Counted to ${statementDayWords(input.preparedDay)}, over ${statementDayWords(input.window.from)} to ${statementDayWords(input.window.to)}`, false, 9, muted);

  /* THE LEVEL WORD, AT THE SIZE OF THE THING IT IS. One word, the set it came from under it, and
     the rule that produced it — so a reader can place the word and recount it. */
  room(86);
  page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: A4[0] - MARGIN, y: y + 4 }, thickness: 1, color: ink });
  text(input.level, MARGIN, y - 26, 26, true, ink, WIDTH);
  text(input.levels.join(' · '), MARGIN, y - 48, 9, false, muted, WIDTH);
  y -= 72;
  paragraph(input.levelRule, false, 9, muted);

  section('01', 'What it counts', `Each line states its count, the days it counts over and the newest reason · ${input.window.days} days`);
  for (const indicator of input.indicators) {
    row({ label: indicator.label, value: indicatorValue(indicator), note: indicatorNote(indicator) });
  }

  if (input.queue) {
    const queue = input.queue;
    section('02', 'Your place in the list', `In line since ${statementDayWords(queue.inLineSince)}`);
    row({ label: 'Suppliers on Rocoto', value: `${queue.connected} of ${queue.suppliers}`, note: `${queue.invited} invited` });
    paragraph(queue.line, false, 10);
    paragraph(queue.moves, false, 9, muted);
    if (queue.brought?.length) {
      paragraph('Suppliers you brought', true, 11);
      /* The name and its date share one line and the state word stands beside them, the way
         `dossier-pdf.ts` draws its top customers: a three-fact row given a note of its own cost
         55 pt each and pushed a four-supplier list onto a second, almost empty page. */
      for (const supplier of queue.brought) {
        row({ label: `${supplier.name} · ${statementDayWords(supplier.at)}`, value: supplier.state });
      }
    }
  }

  const pages = pdf.getPages();
  pages.forEach((item, index) => {
    page = item;
    text('Rocoto · Your record', MARGIN, 28, 8, false, muted);
    text(`${index + 1} / ${pages.length}`, A4[0] - MARGIN - 25, 28, 8, false, muted, 40);
  });
  return pdf.save();
}

/* ── the two ways it reaches a person ─────────────────────────────────────────────────────── */

const blobOf = (bytes: Uint8Array): Blob =>
  new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });

/** `Save as a document` — the file on their disk. Returns the bytes it wrote, so the act can say
 *  what it did in the control's own seat. */
export async function saveStatementPdf(input: StatementInput, signal?: AbortSignal): Promise<number> {
  const bytes = await createStatementPdf(input, signal);
  const url = URL.createObjectURL(blobOf(bytes));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = statementFileName(input);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return bytes.byteLength;
}

/** THE SAME DOCUMENT, IN A TAB — the answer for a phone where a download is awkward
 *  (WIRING-SPEC.md §7: «the statement also opens in a tab»). */
export async function openStatementPdf(input: StatementInput, signal?: AbortSignal): Promise<number> {
  const bytes = await createStatementPdf(input, signal);
  const url = URL.createObjectURL(blobOf(bytes));
  window.open(url, '_blank', 'noopener');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return bytes.byteLength;
}
