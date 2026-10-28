/* ── THE PARTS A DOCUMENT IS DRAWN FROM, ON SCREEN AND ON PAPER ───────────────────────────────
 * Four things the panel and the paper both draw, in one module they can both import: the LAYER step
 * a popover takes to clear the chrome, the panel's own head, a line's NAME with the words riding it,
 * and the dual-flush print control.
 *
 * ═══ WHY THEY ARE HERE AND NOT IN `detail.tsx` ══════════════════════════════════════════════
 * `detail.tsx` is the heaviest module in the package, and `areas/prep.tsx` reaches it through
 * `React.lazy` so a phone opening the desk pays for the list and nothing else. That door only holds
 * while NOTHING on a desk route imports the panel statically — and two edges went straight through
 * it: `print-view.tsx` took the head and the line's name from `detail.tsx`, and the export centre in
 * `shell/printing.tsx` took the panel itself. Measured on the built bundle, `#/prep` downloaded the
 * whole 288 KB panel chunk before a person had opened a single order.
 *
 * So the shared parts stand in their own module, which both the panel and the paper import, and the
 * panel stays behind the lazy door. This module imports the catalogue, the sale's own model and the
 * kit — every one of them already on the desk route — and it imports `detail.tsx` never.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SHAPE, SIZE } from 'baseui/button';
import { ButtonGroup, MODE } from 'baseui/button-group';
import { StatefulMenu } from 'baseui/menu';
import { StatefulPopover, PLACEMENT, TRIGGER_TYPE } from 'baseui/popover';
import { StatefulTooltip, PLACEMENT as TOOLTIP_PLACEMENT } from 'baseui/tooltip';
/* ONE VOCABULARY OF MARKS (§30): the app's meanings, mapped onto the Lucide pack in one file */
import { Glyph, Shortcut, STEP, type GlyphId } from '../cedar/glyphs';
import { TOUCH_FLOOR, usePhone } from '../cedar/shell/viewport';
import Name from '../../scenarios/shell/Name';
import { dimensionsFor, ground, type DimensionId } from '../cedar/catalogue';
/* THE FAMILY GRAMMAR, MIRRORED ON THE LINE (THE-OBJECT-MAP C5) — a base and the word riding it */
import { memberOf, type SaleLine } from '../cedar/sale';

/* ── A LAYER MUST CLEAR THE CHROME (FEED-IA §54.1) ────────────────────────────────────────────
 * «There are some labels that appear behind the actual thing.»
 *
 * Base mounts every popover, menu and TOOLTIP in a layer at the end of the body with no z-index of
 * its own, so it paints in tree order — under every positioned thing this app raises above it: the
 * band (4), the header block (12), this sheet's own sticky dock (2) and its head (3). The panel's
 * menus already carried the step; the hover LABELS carried none, which is precisely the defect the
 * founder read: the label was drawn, and the thing it labelled was drawn on top of it.
 *
 * Twelve is the app's one step for a layer that must clear everything, and it is spelled ONCE here
 * so a new control cannot quietly ship without it.
 */
export const LAYER = 12;

/** the override every hover label on this surface carries, so none of them can paint underneath */
export const OVER_THE_CHROME = { Body: { style: { zIndex: LAYER } } } as const;

/** THE DIMENSIONS A LINE ACTUALLY CARRIES, each with the label it answers to (§41.1). A line that
 *  was never asked returns none — which is the whole of «the option's presence costs them nothing»,
 *  made mechanical rather than promised. */
export function dimensionWords(line: SaleLine): Array<{ id: DimensionId; label: string; word: string }> {
  const held = line.dimensions;
  if (!held) return [];
  return dimensionsFor(line.product.family, ground(line.product.name, line.product.family))
    .filter((d) => Boolean(held[d.id]))
    .map((d) => ({ id: d.id, label: d.label, word: held[d.id] as string }));
}

/* ── THE LINE'S NAME (THE-INTELLIGENCE §2) ────────────────────────────────────────────────────
 * «An amendment renders as a small chip riding the line's name: Chicken wings · frozen — the
 * amendment bold-chipped in ink, in the trade's own word, exactly as said.» It is part of the
 * NAME and not a column, so every surface that says what a line is says it through here: the
 * detail's own row and the albarán that prints. A chip that existed on screen and vanished on
 * paper would be an amendment nobody could hold the house to.
 *
 * A CORRECTED LINE READS AS THE CUSTOMER SAID IT (§1). They put their word back, so their word is
 * the name — and it carries no provisional underline, because it is not a catalogue row yet.
 */
export function LineName({
  line,
  paper = false,
  prep,
  customerOption,
}: {
  line: SaleLine;
  paper?: boolean;
  /* ── THE PREP NOTE, ON THE PAPER (THE-DENSE-BRIEF-DESIGN §6) ─────────────────────────────
   * «The prep note prints on the individual albarán AND the day's sheet, in the same position —
   * small indented line under the item name.» The paper is where the note's real reader is, so it
   * travels through the same component the screen's name goes through and cannot be on one and
   * missing from the other.
   *
   * ON SCREEN THE NOTE IS DRAWN BY THE LINE, NOT HERE, and deliberately: the screen's name is
   * wrapped in the Editable that opens the WORD, and a note inside that button would make the
   * note part of the name's tap target. The note has its own target, one row down. */
  prep?: string;
  /** Explicitly approved outward-facing wording; never inferred from a team note. */
  customerOption?: string;
}) {
  const [, theme] = useStyletron();
  /* ── A LINE IS A BASE AND THE WORD RIDING IT (THE-OBJECT-MAP C5 · FEED-IA §75.6) ──────────
   * Stock draws a family head and its members, each member saying only what it ADDS. A line is
   * that object from the other side, so it draws the same two parts — and it asks `memberOf` for
   * them rather than reading `line.amendment`, because a word can reach a line two ways: the
   * customer's own qualifier this morning, or a word that has already GRADUATED into a product.
   * Before this, the second one printed as one long compound while Stock two screens away drew it
   * as a family and a member: the same goods in two grammars. One fold, one drawing, both. */
  const member = memberOf(line);
  const name = line.corrected && line.asked
    ? <>{line.asked}</>
    : member.word && !line.amendment
      /* a graduated member: the BASE is the name, and the word rides it below like any other */
      ? <>{member.base}</>
      : <Name of={line.product} />;
  /* ── THE DIMENSIONS TRAVEL WITH THE GOODS (FEED-IA §41.1) ────────────────────────────────
   * This component's own law, one paragraph up: «a chip that existed on screen and vanished on
   * paper would be an amendment nobody could hold the house to». A dimension is exactly that kind
   * of fact — «congelado» is what the customer is receiving — so it prints beside the name on the
   * paper the crate travels with, in the same lockup the amendment already uses.
   *
   * ON SCREEN IT DRAWS ELSEWHERE, deliberately: the resting row carries it in the sub-line beside
   * the lote, where it is a tap from its own register (§31.3). Paper has no sub-line, so on paper
   * it rides the name. One fact, two honest positions, never printed twice.
   *
   * ⚠ AND NOTHING ELSE COMES WITH IT (FEED-IA §197.2 «Remove class everywhere»). §41.2's class —
   * the fact the house's own papers appended and the customer's albarán never carried — is gone
   * from all three: the day sheet, the packing list and the albarán state the goods. */
  const dims = paper ? dimensionWords(line).map((d) => d.word) : [];
  const note = paper && prep ? (
    <span
      data-testid={`paper-prep-${line.id}`}
      style={{
        display: 'block',
        paddingLeft: theme.sizing.scale300,
        paddingTop: theme.sizing.scale100,
        ...theme.typography.ParagraphXSmall,
        color: theme.colors.contentPrimary,
        fontWeight: 400,
      }}
    >
      {prep}
    </span>
  ) : null;
  const option = paper && customerOption ? (
    <span
      data-testid={`paper-customer-option-${line.id}`}
      style={{
        display: 'block',
        paddingLeft: theme.sizing.scale300,
        paddingTop: theme.sizing.scale100,
        ...theme.typography.ParagraphXSmall,
        color: theme.colors.contentPrimary,
        fontWeight: 400,
      }}
    >
      Option: {customerOption}
    </span>
  ) : null;
  /** the dimensions, in the amendment's own paper lockup, so one line reads as one sentence */
  const marks = dims.length > 0 ? (
    <span data-testid={`paper-dimensions-${line.id}`} style={{ fontWeight: 700 }}>
      {dims.map((w) => ` · ${w}`).join('')}
    </span>
  ) : null;

  if (!member.word) {
    return marks || note || option ? <>{name}{marks}{note}{option}</> : name;
  }
  return (
    <>
      {name}
      {/* THE JOIN THE CATALOGUE WROTE, NEVER ONE THIS FILE PICKS (C7). «Merluza · sin cabeza» and
          «Merluza de pincho» are two names the register minted differently, and the paper prints
          the goods by the house's own name for them — so the raya comes off the fold. */}
      {paper ? member.join : null}
      <span
        data-testid={`amendment-${line.id}`}
        style={
          paper
            ? { fontWeight: 700 }
            : {
                display: 'inline-block',
                marginLeft: theme.sizing.scale200,
                padding: `0 ${theme.sizing.scale200}`,
                borderRadius: theme.borders.radius100,
                background: theme.colors.backgroundTertiary,
                color: theme.colors.contentPrimary,
                fontWeight: 700,
                /* ── THE LONG SORT IS THE TEST (FEED-IA §109.3) ─────────────────────────────
                   «Long names, long sorts: the wrap is designed.» This lockup used to be
                   `nowrap`, which is right for a two-word grade and wrong for what actually
                   rides a line: `ridesOf` joins the sort, the packaging and every word the
                   parser left to them — «sin cabeza congelada caja 6 kg» — and at 390 that
                   painted straight out of the name's column. It WRAPS instead, at its own
                   spaces, breaking a single monstrous word rather than overflowing. Nothing
                   else moves when it does: the price keeps its column and the lot
                   keeps the end of the facts line, which is what «without moving the
                   constants» means. */
                maxWidth: '100%',
                whiteSpace: 'normal',
                overflowWrap: 'break-word',
              }
        }
      >
        {member.word}
      </span>
      {marks}
      {note}
      {option}
    </>
  );
}

/* ── THE PANEL'S CHROME (FEED-IA §7.1, and §22.5 which put the flip back in it) ────────────────
 * «Why is Send and 1 of 16 below it? Why is a group thinking at all WITHIN the single thing?»
 *
 * Because the flip had been moved onto the dock, where it did not belong. ‹ 3 of 16 › is about THE
 * LIST — it is the reader's place in a morning's worth of documents — and the dock under the card
 * holds only acts upon THIS document. A document that counts its siblings has stopped being one.
 *
 * So the flip comes back up here, and the bar it comes back to is drawn deliberately as THE FRAME
 * AROUND THE THING rather than as part of it: it sits on the panel's own grey ground, it is
 * separated by a hairline, it carries no elevation, and everything in it is at the smallest step.
 * The document below is white, raised and full-sized. Frame and thing, two registers, never one.
 *
 * The chevrons walk THE LIST THE PERSON IS LOOKING AT — the feed's own order in the feed, the day's
 * own order in the day — so flipping is reading on, never a jump into some ordering the panel
 * invented. It is one line, the same line on a desk and on a phone, and it never scrolls away.
 */
/* ── THE TWO POSTURES (FEED-IA §23, and Peter's correction of 2026-08-24) ─────────────────────
 * «Rocoto will be used by the SAME PEOPLE.» So the posture follows THE TASK AT HAND, never a role
 * and never a place: one human answers a customer at 06:40 and packs the crate at 07:20, and the
 * document is the same document in both. The posture is therefore ONE FLIP, on the panel itself —
 * from packing, Send and the chat door are a press away rather than walled off; from answering, so
 * are the ticks.
 *
 *   ANSWER   the document that answers. Send, the chat door, the corrections, the annotation.
 *   PACK     the same card as a picking list. The packed/printed facets lead, the quantities are
 *            large enough to read at arm's length, every line takes a tick, and the amount editor
 *            is one tap from the row — packing is when weights are entered.
 *
 * It opens in the posture of the surface it was opened from (the feed answers, a day packs) and
 * then obeys the person. Same entity, same wrap, two postures.
 *
 * ═══ PARKED, 2026-08-24 ════════════════════════════════════════════════════════════════════
 * The workflow moved under this while it was being built: THE PEOPLE WHO PACK WORK FROM PAPER —
 * a comercial prints the prep sheet and hands it to the bay, and the owner revises on screen. An
 * on-screen packing posture may therefore be answering a question nobody asks, and Peter is
 * deciding the model. So the posture machinery stands here COMPILING AND UNMOUNTED: `SaleDetail`
 * pins `register` to 'answer' at its only call site, `PanelHead`'s posture seats draw only when a
 * caller hands it both props, and no caller does. Nothing is deleted, because none of it is known
 * to be wrong yet — it is waiting on his call. What DID ship out of §23 is `PrintFlush` below,
 * which survives every outcome.
 */
export type Register = 'answer' | 'pack';

const POSTURES: Array<{ id: Register; label: string; glyph: GlyphId }> = [
  { id: 'answer', label: 'Answer', glyph: 'doc' },
  { id: 'pack', label: 'Pack', glyph: 'check' },
];

export function PanelHead({
  title,
  position,
  count,
  posture,
  onPosture,
  onPrev,
  onNext,
  onClose,
  closeLabel = 'Close',
}: {
  /** a panel that IS a place — the paper, say — names itself here; a panel that frames a document
   *  says nothing, because the document says it */
  title?: React.ReactNode;
  /** 1-based place in the current list */
  position?: number;
  count?: number;
  /** the posture the document is being read in, where the panel offers both */
  posture?: Register;
  onPosture?: (next: Register) => void;
  onPrev?: () => void;
  onNext?: () => void;
  /* ── NO X ON THE ALWAYS-THERE PANEL (FEED-IA §37.9) ──────────────────────────────────────
   * «No X on the always-there albarán — the panel is always there; closing is walking.»
   *
   * On the desk the sheet pane is never empty: close one albarán and the next one is standing in
   * it, so the ✕ was a control whose whole promise — «this goes away» — the surface could not
   * keep. Walking IS the close: the flip, a row in the river, a card in the band.
   *
   * So the way out is OPTIONAL, and a panel that has one is a panel you can actually leave: the
   * PHONE, where the albarán took the screen and back is a real destination, and THE PAPER, which
   * is a place you opened over the work and close again. A panel that hands no `onClose` draws no
   * chrome for one. */
  onClose?: () => void;
  closeLabel?: string;
}) {
  const [, theme] = useStyletron();
  const phone = usePhone();
  const flips = position !== undefined && count !== undefined && count > 1;
  /* THE HOVER LABEL IS A DESK THING (§32). A phone has no pointer to hover with, and a keycap on a
     screen with no keyboard is a promise nothing can keep — so the chevrons wear their words on
     the desk and their aria everywhere. */
  const tipped = (node: React.ReactNode, content: React.ReactNode) =>
    phone ? (
      node
    ) : (
      <StatefulTooltip content={content} placement={TOOLTIP_PLACEMENT.top} showArrow overrides={OVER_THE_CHROME}>
        {node}
      </StatefulTooltip>
    );
  return (
    <div
      data-testid="panel-head"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 3,
        display: 'flex',
        alignItems: 'center',
        gap: theme.sizing.scale400,
        padding: `${theme.sizing.scale200} ${theme.sizing.scale400}`,
        /* a mono step, not `borderOpaque` — the frame stands on the panel's own grey and Base's
           hairline colour IS that grey, so the edge that separates frame from thing would have
           been drawn in the colour of the thing it separates */
        borderBottom: `1px solid ${theme.colors.mono400}`,
        background: theme.colors.backgroundSecondary,
        minWidth: 0,
      }}
    >
      {flips && (
        <span
          data-testid="panel-flip"
          style={{ display: 'inline-flex', alignItems: 'center', gap: theme.sizing.scale100, flex: '0 0 auto' }}
        >
          {/* THE FLIP IS THE WALK, AND THE WALK HAS KEYS (§32.A). The chevrons and ← → are one
              act on one list, so the label says both: the sentence, then the key that does it. */}
          {tipped(
            <Button kind={KIND.tertiary} size={SIZE.compact} overrides={{ BaseButton: { style: { minWidth: '48px', minHeight: '48px', fontSize: '28px' } } }} data-testid="flip-prev" aria-label="Previous delivery note" onClick={onPrev}>
              <span aria-hidden="true" style={{ display: 'inline-flex', transform: 'rotate(90deg)' }}><Glyph id="caret" size={20} /></span>
            </Button>,
            <Shortcut label="Previous delivery note" keys={['←']} />,
          )}
          {tipped(
            <Button kind={KIND.tertiary} size={SIZE.compact} overrides={{ BaseButton: { style: { minWidth: '48px', minHeight: '48px', fontSize: '28px' } } }} data-testid="flip-next" aria-label="Next delivery note" onClick={onNext}>
              <span aria-hidden="true" style={{ display: 'inline-flex', transform: 'rotate(-90deg)' }}><Glyph id="caret" size={20} /></span>
            </Button>,
            <Shortcut label="Next delivery note" keys={['→']} />,
          )}
        </span>
      )}
      {/* THE POSTURE, ONE FLIP AWAY (§23). It stands in the panel's CHROME rather than on the dock,
          because the dock holds only acts upon the document (§22.5) and this is not one: it is how
          the reader is looking at it, which is the same class of thing as where they are in the
          list and the way out. */}
      {posture && onPosture && (
        <span data-testid="posture-switch" data-posture={posture} style={{ flex: '0 0 auto', minWidth: 0 }}>
          <ButtonGroup
            mode={MODE.radio}
            size={SIZE.mini}
            kind={KIND.secondary}
            selected={POSTURES.findIndex((p) => p.id === posture)}
            onClick={(_e, i) => onPosture(POSTURES[i].id)}
            aria-label="How this delivery note is being read"
          >
            {POSTURES.map((p) => (
              <Button key={p.id} data-testid={`posture-${p.id}`} startEnhancer={<Glyph id={p.glyph} size={STEP.small} />}>
                {p.label}
              </Button>
            ))}
          </ButtonGroup>
        </span>
      )}
      <span
        style={{
          ...theme.typography.LabelXSmall,
          color: theme.colors.contentSecondary,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: flips ? 'right' : 'left',
        }}
      >
        {title ?? ''}
      </span>
      {onClose && (
        <Button kind={KIND.tertiary} size={SIZE.mini} shape={SHAPE.circle} data-testid="close-detail" aria-label={closeLabel} onClick={onClose}>
          ✕
        </Button>
      )}
    </div>
  );
}

/* ── THE PRINT CONTROL IS DUAL-FLUSH (Peter, 2026-08-24) ──────────────────────────────────────
 * «A toilet's full flush with the small half-flush inset.» PRINTING NEVER ROUTES THROUGH A
 * PREVIEW: the big press puts the paper on the printer there and then (§20's queue), and the small
 * inset eye opens the sheet for the person who wants to look. One composed object, two targets, and
 * the sizes say which is the act — a print button that opened a preview instead was the act asking
 * permission to be the act.
 *
 * It is ONE component and it is exported, so every print in the app — the document's dock, the
 * bay's verb row, the day's sheet, a row's own mark — is the same object at a different size.
 * Icon-only where a row has no width for words; labelled where the dock has.
 */

/** THE SCOPE MENU THE BIG COLUMN CARRIES, where a print has a scope (§28, §29). One line per
 *  answer, each one already counted — «Print all 5 again» — so the person never does the sum. */
export type PrintMenu = {
  /** what the ▾ column announces to anybody who cannot see it */
  ariaLabel: string;
  items: Array<{ label: string; onSelect: () => void }>;
};

export function PrintFlush({
  label,
  ariaLabel,
  paperLabel = 'Look at the paper',
  glyph = 'print',
  kind = KIND.secondary,
  size = SIZE.compact,
  count,
  countSuffix,
  disabled = false,
  menu,
  note,
  tile = false,
  shortcut,
  testid,
  onPrint,
  onPaper,
}: {
  /** the words on the full flush; absent draws the mark alone */
  label?: string;
  /** what the mark alone announces, where there are no words */
  ariaLabel?: string;
  paperLabel?: string;
  /** ── THE MARK IS THE DESTINATION, NEVER THE ACT (§54.4, canon §15.3 rule 3) ────────────────
   *  «It is still absolutely unclear what is about packing and what is not. Really bad.» A day
   *  prints THREE different papers — the albaranes, the van's own sheet, the bay's packing lists
   *  — and all three controls wore this component's default ⎙, which is the mark of the ACT. So
   *  the mark says WHERE THE PAPER GOES and the caller names it: `van` for the run's sheet,
   *  `PACKING_MARK` for the bay, and the printer for the albaranes themselves, which are the one
   *  press whose destination really is the printer. */
  glyph?: GlyphId;
  kind?: (typeof KIND)[keyof typeof KIND];
  size?: (typeof SIZE)[keyof typeof SIZE];
  /** the pages the printer still owes for this document, where it owes any */
  count?: number;
  countSuffix?: string;
  /** nothing to print. The control stands down rather than offering an act with no object. */
  disabled?: boolean;
  /** THE SEAM §28 NAMED, CLOSED (§31.4). A day's print has a scope and a single albarán's has
   *  none, so the middle column exists only where a caller hands it one. */
  menu?: PrintMenu;
  /** WHAT THE TILE'S SECOND LINE SAYS WHEN THE ACT STANDS DOWN (§199). A tile always has two
   *  lines: the paper's NAME on top and the work under it. Where there is a count the second line
   *  is the mark and the number; where the control is standing down there is no act to mark, so
   *  the caller hands the STATE in these words and the mark stands down with the press. */
  note?: string;
  /** ── AND ON A PHONE THE PAIR STANDS AS TILES (FEED-IA §199, Peter) ────────────────────────
   *  «On mobile, the print buttons on each day look way too long now that I looked at that …
   *  They should be a double row, with the icon and the quantity left to print below, so that
   *  they're thick but next to each other rather than stacked and thin.»
   *
   *  So a caller that puts TWO of these on one phone row says `tile`, and the control changes
   *  posture rather than shape: the same three columns, the same seam, the same testids — the
   *  words on two lines, the two slim seats folded into a rail at the tile's right edge, one
   *  above the other so both keep the hand's own 44px, and the whole object 88px thick. It is
   *  the phone's answer only: a desk has the room the single row was drawn for, and `usePhone`
   *  is what decides, so no docked column can put phone furniture on a desk (§103). */
  tile?: boolean;
  /** THE KEYS THAT DO THIS PRESS (§32.A). Only where a key really reaches this control: the
   *  document's own dock takes P, and a day's paper takes none — a cap on a control no key can
   *  press is the software claiming a shortcut it does not have. */
  shortcut?: string[];
  testid: string;
  onPrint: () => void;
  /** ── A CONTROL WITH NO PAPER CARRIES NO EYE (OUT-02.3's own rule, on the day's seats) ──────
   *  Every caller until E200 printed a sheet, so the eye was this object's third column by
   *  definition. A day seat may now hold a `file` or an `email` template, and there is no paper
   *  to look at: the seat states its act and stops, rather than drawing a door onto the thing it
   *  has just done. The body takes the whole radius where no rail stands beside it. */
  onPaper?: () => void;
}) {
  const [, theme] = useStyletron();
  const phone = usePhone();
  const filled = kind === KIND.primary;
  /* THE SEAM BETWEEN THE FLUSHES. On ink it is drawn in the inverse ink; on anything else it is a
     mono step, because Base's `borderOpaque` IS `backgroundSecondary` in the light theme and a
     hairline drawn in the colour of the fill beside it is a hairline nobody sees. */
  const seam = filled ? theme.colors.contentInverseTertiary : theme.colors.mono400;
  /** whether anything stands on the trailing side of the body — the scope menu, the eye, or both */
  const railed = Boolean(menu || onPaper);
  const square = railed ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 } : {};
  const joined = {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftColor: seam,
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid' as const,
  };
  const middle = { ...joined, borderTopRightRadius: 0, borderBottomRightRadius: 0 };
  const mark = size === SIZE.large ? STEP.medium : STEP.small;

  /* ── THE TILE'S OWN GEOMETRY (§199) ────────────────────────────────────────────────────────
     Two seats, one above the other, each at the hand's own number — so the rail is 44 wide and
     the tile is 88 thick, and both numbers come from `TOUCH_FLOOR` rather than being typed.

     AND WHY THE MARK RIDES THE SECOND LINE, MEASURED. A day's own content is 296px at 360; two
     tiles a step apart are 144 each; the rail takes 44, the body's padding 16, so the words have
     84px. «Packing lists» is 71 at this step, so the name fits and «⎙ Packing lists» — 91 —
     does not. The mark therefore stands where the work is, beside the number it prints: «⎙ 34
     left», which is the act, under the paper's name, which is the label. Peter's own sentence
     asks for exactly that pair — «the icon and the quantity left to print below». */
  const tiled = tile && phone;
  const RAIL = TOUCH_FLOOR;
  const THICK = TOUCH_FLOOR * 2;
  const radius = theme.borders.buttonBorderRadius;
  const bodyTile = {
    flex: '1 1 auto',
    minWidth: 0,
    minHeight: `${THICK}px`,
    justifyContent: 'flex-start',
    textAlign: 'left' as const,
    paddingTop: theme.sizing.scale300,
    paddingBottom: theme.sizing.scale300,
    /* ── 6px, AND IT IS A MEASUREMENT (E200.06) ────────────────────────────────────────────
       At 8px the body's words had 84px at 360 and «Packing sheets» — the name the packing
       template ships under once the seats are TEMPLATES rather than fixed papers — measures 86.
       Two pixels, and the tile's own law breaks: «the name and the mark cannot share line one at
       360 without truncating the name» (OUT-03.3) exists so the NAME survives. 6px gives the words
       88 and keeps a real gutter against the rail's seam. Read off the built bundle at 360 and
       390, both shipped names, by `drive-200-day-seats.py`. */
    paddingLeft: theme.sizing.scale200,
    paddingRight: theme.sizing.scale200,
    borderTopLeftRadius: radius,
    borderBottomLeftRadius: radius,
    borderTopRightRadius: railed ? 0 : radius,
    borderBottomRightRadius: railed ? 0 : radius,
  };
  /** a seat on the rail: square, at the floor in both axes, its radii its own (§31.2) */
  const seatTile = {
    flex: '0 0 auto',
    width: `${RAIL}px`,
    minWidth: `${RAIL}px`,
    maxWidth: `${RAIL}px`,
    height: `${RAIL}px`,
    minHeight: `${RAIL}px`,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftColor: seam,
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid' as const,
  };
  const scopeSeat = { ...seatTile, borderTopRightRadius: radius, borderBottomRightRadius: 0 };
  /** A MENU STANDING ALONE TAKES THE WHOLE RAIL, so a tile keeps one silhouette however many seats
   *  it has: 88px of rail, both trailing corners its own. */
  const soleScopeSeat = { ...scopeSeat, borderBottomRightRadius: radius, minHeight: `${THICK}px`, height: `${THICK}px` };
  const paperSeat = {
    ...seatTile,
    borderTopRightRadius: menu ? 0 : radius,
    borderBottomRightRadius: radius,
    ...(menu
      ? { borderTopColor: seam, borderTopWidth: '1px', borderTopStyle: 'solid' as const }
      : { minHeight: `${THICK}px`, height: `${THICK}px` }),
  };
  /** WHAT THE SECOND LINE SAYS: the number the press moves, or the state that stood the press
   *  down. The mark goes with the act, so a standing-down tile carries words alone.
   *
   *  ⚠ A DISABLED PRESS MAY NOT SHOW A NUMBER FOR THE ACT IT IS REFUSING. `count` is still handed
   *  in when the day holds paper for review — the desk wants it, because the desk's own LABEL
   *  already carries the state («Review to print · 32 left») and the number is the size of the
   *  review. A tile has no such label: its first line is the paper's name, so the same number
   *  under it reads «⎙ 32 left to print» beside a press that will not print. So the tile takes
   *  the NOTE whenever the press is standing down, and the desk is left exactly as it was.
   *  Found by the E196.4 verifier on a rendered build; `drive-196-day-tiles.py`'s `held` leg
   *  is the assertion that keeps it. */
  const counted = count !== undefined && count > 0;
  const tileCounted = counted && !disabled;
  const under = tileCounted ? `${count}${countSuffix ? ` ${countSuffix}` : ''}` : note;

  const printFace = tiled ? (
    <span data-tile-face style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', minWidth: 0, maxWidth: '100%' }}>
      {/* TRUNCATE WITHOUT LOSING CONTENT (`better-typography`). The two names that ship stand whole
          at 360; a house that calls its paper «Cold store delivery sheets» keeps every character
          of it on the node's own title and in the sentence the seat announces. */}
      <span
        data-tile-name
        title={label}
        style={{ ...theme.typography.LabelXSmall, minWidth: 0, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {label}
      </span>
      {under && (
        <span data-tile-count style={{ display: 'flex', alignItems: 'center', gap: theme.sizing.scale100, minWidth: 0, maxWidth: '100%', opacity: 0.72 }}>
          {tileCounted && <Glyph id={glyph} size={mark} />}
          <span style={{ ...theme.typography.ParagraphXSmall, minWidth: 0 }}>{under}</span>
        </span>
      )}
    </span>
  ) : (
    <>
      {label}
      {count !== undefined && count > 0 && (
        <span style={{ opacity: 0.72 }}>{label ? <>&nbsp;· {count}</> : <>&nbsp;{count}</>}{countSuffix ? ` ${countSuffix}` : ''}</span>
      )}
    </>
  );

  const seats = (
    <>
      {menu && (
        <StatefulPopover
          placement={PLACEMENT.bottomLeft}
          triggerType={TRIGGER_TYPE.click}
          /* A LAYER MUST CLEAR THE CHROME (found while building §32). Base mounts a layer at the
             end of the body with no z-index, so it paints under anything positioned above it — and
             a day's re-print menu opens from a whisper that the sticky band sits on the moment the
             river is scrolled. 12 is the step this app gives a layer that must clear everything. */
          overrides={{ Body: { style: { zIndex: LAYER } } }}
          content={({ close }) => (
            <div data-testid={`${testid}-menu`}>
              <StatefulMenu
                /* Base's own list, at the width a compact attached menu reads at (§28: «a small
                   attached menu, not a dialog»). */
                overrides={{ List: { style: { minWidth: '200px' } } }}
                items={menu.items.map((i) => ({ label: i.label }))}
                onItemSelect={({ item }) => {
                  menu.items.find((i) => i.label === item.label)?.onSelect();
                  close();
                }}
              />
            </div>
          )}
        >
          <Button
            kind={kind}
            size={size}
            data-testid={`${testid}-scope`}
            aria-label={menu.ariaLabel}
            overrides={{ BaseButton: { style: tiled ? (onPaper ? scopeSeat : soleScopeSeat) : (onPaper ? middle : joined) } }}
          >
            <Glyph id="caret" size={mark} />
          </Button>
        </StatefulPopover>
      )}

      {onPaper && (
        <StatefulTooltip content={paperLabel} placement={TOOLTIP_PLACEMENT.top} showArrow overrides={OVER_THE_CHROME}>
          <Button
            kind={kind}
            size={size}
            data-testid={`${testid}-paper`}
            aria-label={paperLabel}
            onClick={onPaper}
            overrides={{ BaseButton: { style: tiled ? paperSeat : joined } }}
          >
            <Glyph id="eye" size={mark} />
          </Button>
        </StatefulTooltip>
      )}
    </>
  );

  return (
    <span
      data-testid={testid}
      data-tile={tiled ? 'yes' : undefined}
      style={{
        display: tiled ? 'flex' : 'inline-flex',
        alignItems: 'stretch',
        /* THE CORNERS ARE DRAWN, NOT CROPPED (§31.2). This used to square its inner corners with
           `overflow: hidden` on the wrapper, which is a container shaping its children by cutting
           them — the habit the icon audit is here to end. Every column states its own radii. */
        minWidth: 0,
        maxWidth: '100%',
        /* TWO TILES SHARE THE ROW AND MEASURE THE SAME (§199): a zero basis with an equal pull, so
           the pair never splits by whichever name is longer. */
        ...(tiled ? { flex: '1 1 0', minHeight: `${THICK}px` } : null),
      }}
    >
      {/* AND A TILE SAYS ITS OWN SENTENCE, SO NOTHING HOVERS OVER IT (§199). The tooltip exists
          because a mark alone cannot say which paper it prints (§30); a tile already carries the
          name and the number in type, and a label repeating itself over the thumb that just
          pressed it is furniture. The seats keep theirs — they are marks. */}
      {tiled ? (
        <Button
          kind={kind}
          size={size}
          disabled={disabled}
          data-testid={`${testid}-print`}
          data-queued={count && count > 0 ? count : undefined}
          /* A TILE WITH NO WORDS STILL HAS TO SAY WHICH PAPER IT PRINTS. `label` is optional, and
             the flush arm below has always fallen back to `ariaLabel` where a caller draws the
             mark alone; the tile arm did not, so a `tile` caller without words announced its
             count and nothing else — «32 left», of what. Both postures now answer the same. */
          aria-label={label ? undefined : ariaLabel}
          onClick={onPrint}
          overrides={{ BaseButton: { style: bodyTile } }}
        >
          {printFace}
        </Button>
      ) : (
        <StatefulTooltip
          /* THE LABEL SAYS THE KEY (§32). The sentence is the control's own; the cap after it is the
             fact that a hand sweeping a morning never has to reach for the mouse. */
          content={
            shortcut && !phone ? <Shortcut label={label ?? ariaLabel} keys={shortcut} /> : label ?? ariaLabel
          }
          placement={TOOLTIP_PLACEMENT.top}
          showArrow
          overrides={OVER_THE_CHROME}
        >
          <Button
            kind={kind}
            size={size}
            disabled={disabled}
            data-testid={`${testid}-print`}
            data-queued={count && count > 0 ? count : undefined}
            aria-label={label ? undefined : ariaLabel}
            startEnhancer={<Glyph id={glyph} size={mark} />}
            onClick={onPrint}
            overrides={{ BaseButton: { style: square } }}
          >
            {printFace}
          </Button>
        </StatefulTooltip>
      )}

      {/* THE RAIL (§199). On a phone the two slim seats stand one above the other at the tile's
          right edge, each keeping the hand's own 44px; on a desk they stay the row they were. */}
      {!railed ? null : tiled ? (
        <span data-tile-rail style={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto', alignItems: 'stretch' }}>{seats}</span>
      ) : (
        seats
      )}
    </span>
  );
}
