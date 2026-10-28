/* THE ONE PRINT — a press that is always there, and the three sheets behind it.
 *
 * Peter, FEED-IA §268: «It just clarifies everything instead of buttons that are for every scroll.»
 * So Prep carries ONE `Print`, at 48 px, in permanent chrome: a fixed bar above the bottom row on a
 * phone, sticky at the foot of the list pane on a desk. What it opens is a `WorkflowDialog` — the
 * house's own task frame, which docks to a bottom sheet under `PHONE_MAX` — holding three 48 px rows
 * carrying the counts the removed day-paper seats carried:
 *
 *   `Prep list`                    the day's sheet, IN THE ORDER THE LIST IS SHOWING
 *   `Packing list · 34 remaining`  one per order still owed one
 *   `Delivery note · 32 remaining` the order in hand
 *
 * ═══ WHY THE ORDER ON PAPER IS THE ORDER ON SCREEN ═══════════════════════════════════════════
 * `daySheetOrder(day, sheetSales, now)` MAPS the array it is handed and sorts nothing. So the
 * surface passes its own grouped, flattened array and the paper comes out in the sequence a person
 * was just reading — with no change to the print view at all. That is the whole mechanism, and it is
 * why `ordered` is a prop of this component rather than something it computes.
 *
 * ═══ AND THE PHONE'S LIST HOLDS TWO ROWS, NOT THREE ══════════════════════════════════════════
 * `Delivery note` is about the order IN HAND, and the phone's list route holds no selection — the
 * detail is a pushed page. So the third row stands where the selection is: beside the list on the
 * desk, and on the detail route's own act bar on the phone. A row that opened a document nobody had
 * chosen would be the app guessing.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { Glyph, STEP } from '../cedar/glyphs';
import { WorkflowDialog } from '../cedar/workflow-dialog';
import { LAUNCHER_LANE } from './shell/chats';
import { BOTTOM_NAV_HEIGHT } from './shell/bottom-nav';
import { packingOutputs, remainingPackingSales } from './packing-output';
import { newPaperOf, type Sale } from '../cedar/sale';
import type { PrintScreenRequest } from './print-screen';
import type { SectorId } from '../../scenarios/meta';

/** ── THE PHONE'S BAR STANDS ON THE BOTTOM ROW (QA item 11) ────────────────────────────────────
 *  It used to clear `BOTTOM_NAV_HEIGHT + LAUNCHER_LANE` (64 + 80), the room the conversation
 *  launcher's disc needed above the row. The conversation is a SEAT in the bottom row now, so that
 *  lane holds nothing — and the 80 px it reserved is what put a full-width black bar in the MIDDLE
 *  of the list: measured at scrollY 400, the bar stood at 660–708 with a sale row at 643–713 under
 *  it, so a name, an hour and a state word were covered and the row was untappable there.
 *  The bar sits on the chrome at the foot now, where a persistent act belongs. */
export const PHONE_ACT_BAR_BOTTOM = BOTTOM_NAV_HEIGHT;

/** THE PRESS ITSELF IS 48 px, stated once so the bar that draws it and the list that reserves the
 *  band under it read one number. */
export const ACT_BAR_HEIGHT = 48;

/** ── THE BAND THE LIST ENDS ABOVE (QA item 11) ───────────────────────────────────────────────
 *  The bar is `position: fixed` at `PHONE_ACT_BAR_BOTTOM`, so it hovers 144 px above the foot of
 *  the viewport — over the list. The end spacer was `PHONE_ACT_BAR_BOTTOM + 8`, which is smaller
 *  than the bar's own offset plus its height, so at the foot of a scroll the last row still stood
 *  under it and at scrollY 400 a whole row lost its name, its hour and its press for 48 px.
 *  The list ends above the WHOLE band: the lane the bar stands in, the bar, and one step of air. */
export const PHONE_LIST_END = PHONE_ACT_BAR_BOTTOM + ACT_BAR_HEIGHT + 16;

export type PrepPrintScope = {
  /** the day the list is standing on */
  day: string;
  /** the day's orders IN THE ORDER THE LIST IS SHOWING — what the sheet prints */
  ordered: Sale[];
  /** the order in hand, where one is open */
  inHand: Sale | null;
  sector: SectorId;
  /** the workspace's own today, for what the paper still owes */
  today: string;
};

/** THE THREE ROWS, AS FACTS. Exported because the list's bar and the detail's bar draw from one
 *  reading — two bars computing «34 remaining» separately is two numbers a pixel apart. */
export type PrintRow = {
  id: 'sheet' | 'packing' | 'albaran';
  word: string;
  /** what the row says after its word: `34 remaining`, or nothing */
  count: string | null;
  request: PrintScreenRequest;
  /** a row whose set is empty still renders, and says so by being quiet */
  ready: boolean;
};

export function usePrintRows(scope: PrepPrintScope): PrintRow[] {
  const history = React.useSyncExternalStore(
    packingOutputs.subscribe, packingOutputs.getSnapshot, packingOutputs.getSnapshot,
  );
  const { day, ordered, inHand, sector, today } = scope;
  return React.useMemo(() => {
    const notesOwed = newPaperOf(ordered, today);
    const packingOwed = remainingPackingSales(ordered, sector, history);
    const rows: PrintRow[] = [
      {
        id: 'sheet',
        word: 'Prep list',
        count: null,
        ready: ordered.length > 0,
        /* THE IDS GO IN THE ORDER THEY ARE DRAWN, and `print-view.tsx` resolves them in exactly
           that order — so the paper is the screen. */
        request: { subject: { kind: 'day', day, salesIds: ordered.map((sale) => sale.id) }, paperKind: 'sheet' },
      },
      {
        id: 'packing',
        word: 'Packing list',
        count: packingOwed.length > 0 ? `${packingOwed.length} remaining` : null,
        ready: packingOwed.length > 0,
        request: { subject: { kind: 'packing', day, salesIds: packingOwed.map((sale) => sale.id) }, paperKind: 'packing' },
      },
      {
        id: 'albaran',
        word: 'Delivery note',
        count: notesOwed.length > 0 ? `${notesOwed.length} remaining` : null,
        /* ── THE ROW STATES A QUANTITY, SO IT PRESSES (QA item 13) ────────────────────────
           `ready` was `inHand !== null`, so the row read «Delivery note · 6 remaining» and
           refused the press on every route where nothing is open — which is the persistent bar's
           whole reason for standing there. It has a subject either way: the order in hand where
           one is open, and otherwise the day run it already builds, which is what the six are. */
        ready: inHand !== null || notesOwed.length > 0,
        request: inHand
          ? { subject: { kind: 'albaran', sale: inHand.id }, paperKind: 'albaranes' }
          : { subject: { kind: 'day', day, run: 'albaranes', salesIds: notesOwed.map((sale) => sale.id) }, paperKind: 'albaranes' },
      },
    ];
    return rows;
  }, [day, ordered, inHand, sector, today, history]);
}

/* ── THE SHEET ────────────────────────────────────────────────────────────────────────────── */

export function PrintSheet({
  isOpen, rows, only, onPick, onClose,
}: {
  isOpen: boolean;
  rows: PrintRow[];
  /** which rows this bar carries — the list's two, or the detail's one */
  only?: PrintRow['id'][];
  onPick: (request: PrintScreenRequest) => void;
  onClose: () => void;
}) {
  const [, theme] = useStyletron();
  const shown = only ? rows.filter((row) => only.includes(row.id)) : rows;
  return (
    <WorkflowDialog isOpen={isOpen} title="Print" testId="prep-print-sheet" onClose={onClose}>
      <div style={{ display: 'grid', gap: theme.sizing.scale300, minWidth: 0 }}>
        {shown.map((row) => (
          <Button
            key={row.id}
            kind={KIND.secondary}
            size={SIZE.compact}
            data-testid={`print-${row.id}`}
            data-ready={row.ready ? 'yes' : 'no'}
            disabled={!row.ready}
            onClick={() => { onPick(row.request); onClose(); }}
            startEnhancer={<Glyph id="print" size={STEP.small} />}
            overrides={{
              BaseButton: {
                style: {
                  width: '100%',
                  /* ⚠ `min-height` LOSES HERE. The frame's touch floor is
                     `[data-baseweb="button"][data-baseweb="button"]{min-height:44px}` — one step of
                     specificity above a Styletron class — so a 48 px row asked for with `minHeight`
                     came out 44. `height` is a different property and is never overridden by it. */
                  height: '48px',
                  minHeight: '48px',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                },
              },
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: theme.sizing.scale200, minWidth: 0 }}>
              <span>{row.word}</span>
              {row.count && (
                <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentSecondary }}>
                  · {row.count}
                </span>
              )}
            </span>
          </Button>
        ))}
      </div>
    </WorkflowDialog>
  );
}

/* ── THE PRESS ────────────────────────────────────────────────────────────────────────────── */

/**
 * THE PERSISTENT `Print`. Two housings, one control:
 *
 *   PHONE  fixed, full width, at `PHONE_ACT_BAR_BOTTOM` plus the safe-area inset, so it clears the
 *          bottom row and the launcher's disc rather than standing on top of either.
 *   DESK   sticky at the foot of the list pane, right-aligned, leaving the launcher's lane at its
 *          own end — the inversion §83.3 minted: «whatever stands at the foot of a pane reserves
 *          the corner for it in its own padding».
 */
export function PrintPress({
  rows, only, phone, testid = 'prep-print', onPick,
}: {
  rows: PrintRow[];
  only?: PrintRow['id'][];
  phone: boolean;
  testid?: string;
  onPick: (request: PrintScreenRequest) => void;
}) {
  const [, theme] = useStyletron();
  const [open, setOpen] = React.useState(false);
  /* ── A DAY WITH NOTHING ON IT PRINTS NOTHING (QA item 29) ─────────────────────────────────
     On a day with no orders the bar stood full-width and black under 900 px of white, and
     pressing it offered three rows that would put an empty sheet on paper. The press reads the
     rows it opens: where none of them can act, the control says so by being quiet. */
  const shown = only ? rows.filter((row) => only.includes(row.id)) : rows;
  const anyReady = shown.some((row) => row.ready);
  return (
    <>
      <div
        data-testid={`${testid}-bar`}
        style={phone ? {
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: `calc(${PHONE_ACT_BAR_BOTTOM}px + env(safe-area-inset-bottom, 0px))`,
          zIndex: 3,
          display: 'flex',
          padding: `0 ${theme.sizing.scale600}`,
          pointerEvents: 'none',
        } : {
          position: 'sticky',
          bottom: 0,
          zIndex: 3,
          display: 'flex',
          justifyContent: 'flex-end',
          padding: `${theme.sizing.scale400} ${theme.sizing.scale600}`,
          paddingRight: `${LAUNCHER_LANE}px`,
          pointerEvents: 'none',
        }}
      >
        <Button
          kind={KIND.primary}
          size={SIZE.compact}
          data-testid={testid}
          data-ready={anyReady ? 'yes' : 'no'}
          disabled={!anyReady}
          onClick={() => setOpen(true)}
          startEnhancer={<Glyph id="print" size={STEP.small} />}
          overrides={{
            BaseButton: {
              style: {
                /* see the row above: `height` is what actually holds 48 against the frame's floor */
                height: '48px',
                minHeight: '48px',
                pointerEvents: 'auto',
                boxShadow: theme.lighting.shadow500,
                ...(phone ? { width: '100%' } : null),
              },
            },
          }}
        >
          Print
        </Button>
      </div>
      <PrintSheet isOpen={open} rows={rows} only={only} onPick={onPick} onClose={() => setOpen(false)} />
    </>
  );
}
