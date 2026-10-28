/* THE DAY CONTROL — a left-right toggler over the day Prep is showing.
 *
 * Peter, FEED-IA §268 (DESIGN-SPEC.md §3): «Today · Friday 18.09». Three parts on one row — the day
 * before · the day · the day after — and the middle one is a BUTTON carrying the label, with Base's
 * own `Datepicker` anchored to it as a popover for the jump nobody walks to.
 *
 * ═══ WHY THE LABEL IS ON A BUTTON RATHER THAN IN BASE'S FIELD ════════════════════════════════
 * Sales' own `DayPicker` puts the label INSIDE the field, and a field can only say what its
 * `formatString` says: `DAY_FORMAT` is `dd/MM/yyyy`, so the control reads `18/09/2026` and the
 * nearness — the one word §18 says a day leads with — has nowhere to go. Its placeholder `All days`
 * shows only while the value is null, and `PICKER_W.snug` is 96 px against a ~140 px label.
 *
 * So the label is the app's own sentence, `nearWordOf` over `dayLabelFromId`, drawn at the button's
 * own step; the calendar stands behind it and keeps everything that was good about it — the 4 px dot
 * under every day that holds orders, and `DENSITY.high` on a phone, because Base's calendar draws
 * its week at 416 px and a 393 px screen is narrower than that.
 *
 * ═══ AND PREP STANDS ON ONE DAY, WHICH IS WHY THERE IS NO RELEASE ════════════════════════════
 * Sales' picker carries a `×` that widens the river back to every day, and it is the performance
 * design of this surface that Prep has no such thing: the list is bounded to ONE day, always, so
 * `jump-today` folds away too — a toggler that opens on today answers it.
 *
 * ═══ THE CHEVRONS TAKE CEDAR'S OWN REMEDY FOR THE 44 px FLOOR ════════════════════════════════
 * Base's `SIZE.mini` circle is 28 px, under `docs/THE-INTERACTION-SPEC.md`'s floor, and the house's
 * own answer is the override `shell/printing.tsx` already uses: `minWidth`/`minHeight` at 44 px on
 * `BaseButton`. A floor, never a size — the mark inside stays where it was.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SHAPE, SIZE } from 'baseui/button';
import { Datepicker, DENSITY } from 'baseui/datepicker';
import { StatefulPopover, PLACEMENT, TRIGGER_TYPE } from 'baseui/popover';
import { Glyph, STEP } from '../cedar/glyphs';
import { dayFromId, dayIdOf, dayLabelFromId, nearWordOf, shiftDay } from '../cedar/sale';
import { usePhone } from '../cedar/shell/viewport';

/** The house's 44 px floor, stated where the control that needs it stands. */
const FLOOR = { BaseButton: { style: { minWidth: '44px', minHeight: '44px', flex: '0 0 auto' } } } as const;

/** A day the toggler steps to, as the surface's own key. */
export const stepDay = (day: string, by: number): string => dayIdOf(shiftDay(dayFromId(day), by));

/** `Today · Friday 18.09`, then `Friday 18.09` past the three near words (`nearWordOf`, §18). */
export function dayWords(day: string, today: string): string {
  const near = nearWordOf(day, today);
  const label = dayLabelFromId(day);
  return near ? `${near} · ${label}` : label;
}

export default function DayToggler({
  day,
  today,
  days,
  onPick,
}: {
  /** the day Prep is showing — one day, always */
  day: string;
  /** the workspace's own today, one reading, so the word and the calendar agree */
  today: string;
  /** the days that hold orders — the dots under the calendar's numbers */
  days: Set<string>;
  onPick: (day: string) => void;
}) {
  const [, theme] = useStyletron();
  const phone = usePhone();

  /* THE LABEL IN ITS TWO PARTS, because only one of them may be lost. `dayWords` still says the
     whole sentence for the ear; the eye gets the same words in two pieces so the line can break
     between them and never inside the date. */
  const near = nearWordOf(day, today);
  const dayDate = dayLabelFromId(day);

  const chevron = (by: number, testid: string, label: string, turn: number) => (
    <Button
      kind={KIND.tertiary}
      size={SIZE.mini}
      shape={SHAPE.circle}
      data-testid={testid}
      aria-label={label}
      title={label}
      overrides={FLOOR}
      onClick={() => onPick(stepDay(day, by))}
    >
      <span aria-hidden="true" style={{ display: 'inline-flex', transform: `rotate(${turn}deg)` }}>
        <Glyph id="caret" size={STEP.small} />
      </span>
    </Button>
  );

  return (
    <div
      data-testid="day-toggler"
      data-day={day}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.sizing.scale200,
        /* THE THREE PARTS ARE ONE GROUP, not a row with the day stretched between two edges: a
           `flex: 1 1 auto` label put the chevrons at the ends of a 1,500 px desk pane, which is
           two controls a hand has to travel between rather than a toggler. */
        width: 'fit-content',
        maxWidth: '100%',
        minWidth: 0,
        minHeight: '48px',
      }}
    >
      {chevron(-1, 'narrow-prev', 'The day before', 90)}

      {/* THE DAY ITSELF, AND THE CALENDAR BEHIND IT. One control: the words are the button and the
          jump is the popover the same button opens, so there is no second seat on the row saying
          the same day in digits. */}
      <StatefulPopover
        placement={PLACEMENT.bottomLeft}
        triggerType={TRIGGER_TYPE.click}
        dismissOnEsc
        dismissOnClickOutside
        overrides={{ Body: { style: { zIndex: 12 } } }}
        content={({ close }) => (
          <div data-testid="day-calendar" style={{ maxWidth: '100vw', boxSizing: 'border-box' }}>
            <Datepicker
              value={dayFromId(day)}
              highlightedDate={dayFromId(day)}
              onChange={({ date }) => {
                const one = Array.isArray(date) ? date[0] : date;
                if (one) onPick(dayIdOf(one));
                close();
              }}
              quickSelect={false}
              density={phone ? DENSITY.high : DENSITY.default}
              /* THE DOTS ARE THE DAYS THAT HOLD ORDERS. A jump into an empty day is a jump nobody
                 meant to make, so the calendar says where the work is before the finger lands —
                 and an empty day stays reachable, because a day with nothing on it is a real day. */
              dateLabel={(d: Date) =>
                days.has(dayIdOf(d)) ? (
                  <span
                    aria-label="has orders"
                    style={{
                      display: 'block',
                      width: 4,
                      height: 4,
                      margin: '0 auto',
                      borderRadius: '50%',
                      background: 'currentColor',
                    }}
                  />
                ) : null
              }
            />
          </div>
        )}
      >
        <Button
          kind={KIND.tertiary}
          size={SIZE.compact}
          data-testid="prep-day"
          data-day={day}
          aria-label={`${dayWords(day, today)} · pick a day`}
          startEnhancer={<Glyph id="days" size={STEP.small} />}
          overrides={{
            BaseButton: {
              style: {
                /* the frame's touch floor outranks a Styletron `min-height`; `height` holds 48 */
                height: '48px',
                minHeight: '48px',
                /* AND 48 IS ROOM FOR TWO LINES, which is what the wrap below needs. `LabelMedium`
                   carries a FIXED 20px line box, so two lines are 40px whatever font arrives —
                   loaded Inter or the fallback — and the air is 4 above and 4 below. Base's own
                   compact padding was 10, which left 28px for a 40px block. */
                paddingTop: theme.sizing.scale100,
                paddingBottom: theme.sizing.scale100,
                flex: '0 1 auto',
                minWidth: 0,
                justifyContent: 'flex-start',
                ...theme.typography.LabelMedium,
                /* the backstop that keeps the `9` of «Friday 18.09» off the chevron beside it: two
                   controls may never occupy one pixel, however narrow the glass gets. */
                overflow: 'hidden',
              },
            },
          }}
        >
          {/* ── AT 320 THE LABEL YIELDS BY WRAPPING, AND THE DATE IS THE PART THAT NEVER BREAKS ──
              It used to yield by CLIPPING, and a clip takes the TAIL: measured on every step of
              the toggler at 320, «Today · Saturday 19.09» painted «Today · Sat…» and «Monday
              14.09» painted «Monday 14….». What the clip was eating is the digits — and past the
              three near words the label IS the date, so the control stopped saying which day the
              twelve sales under it belong to.
              SO THE BREAK OPPORTUNITY IS THE «·» AND THERE IS NO OTHER. The near word is the only
              piece a reader can lose and still know the day; `Saturday 19.09` is one reading, the
              way a price and its unit are one, so it travels as a single `nowrap` word. */}
          <span style={{ display: 'block', minWidth: 0 }}>
            {near ? `${near} · ` : null}
            <span style={{ whiteSpace: 'nowrap' }}>{dayDate}</span>
          </span>
        </Button>
      </StatefulPopover>

      {chevron(1, 'narrow-next', 'The day after', -90)}
    </div>
  );
}
