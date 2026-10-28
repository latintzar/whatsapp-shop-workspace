/* APP SETTINGS — the app's own knobs, and the business's own facts stay next door.
 *
 * Cedar's `admin/app-settings.tsx` holds what is about the SOFTWARE rather than about the house:
 * the printer, what the house is told about, the language the interface speaks. That boundary is
 * what keeps `Your business` a card about a shop and this seat a card about an app.
 *
 * ═══ THE PRICE ROWS LEFT WITH THE TARIFA (DESIGN-SPEC.md §7 item 5 · WIRING-SPEC.md §11) ══════
 * Cedar's printing block asks whether a sheet prints VALUED or unvalued, because a wholesale house
 * prints one document for the driver and another for the office. One shop sells at one price and
 * this candidate has no tarifa, no tier registry and no price on a product — so the valued/unvalued
 * pair, and every other price row this seat carried, are gone rather than defaulted.
 *
 * ═══ THE SHEETS ARE PREP'S, AND THIS SEAT SETS THEM ══════════════════════════════════════════
 * Prep keeps ONE persistent `Print` and the export door is renamed `Paper`, so the choice of paper,
 * copies and which of the three sheets it prints is made here, once, and the button on the work
 * surface stays one button.
 *
 * ═══ LANGUAGE ═══════════════════════════════════════════════════════════════════════════════
 * English is the source this pass writes, inline, and Spanish is a build-time transform of that
 * source that arrives as its own pass (§7 item 20). Choosing a language is therefore a navigation
 * to the other built entry rather than a switch inside the page, which is why this row states the
 * language and doors rather than toggling.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Checkbox, LABEL_PLACEMENT } from 'baseui/checkbox';
import { ChevronRight } from 'lucide-react';
import { Row, Seat, Section } from './business';

export const meta = { id: 'app-settings', title: 'App settings', owner: 'BODEGA-ADMIN', panes: false };

/* ── the paper ────────────────────────────────────────────────────────────────────────────── */

const PAPERS = ['A4', 'A5', 'Ticket'] as const;
type Paper = (typeof PAPERS)[number];

/** THE THREE SHEETS PREP PRINTS, in the order its one button offers them (`DESIGN-SPEC.md` §3). */
const SHEETS = [
  { id: 'prep', label: 'Prep list', note: 'The day’s orders in the order shown' },
  { id: 'packing', label: 'Packing list', note: 'What goes in each bag' },
  { id: 'delivery', label: 'Delivery note', note: 'The note that travels with the order' },
];

/** WHAT THE SHOP IS TOLD ABOUT, each on the one channel she reads. */
const NOTICES = [
  { id: 'order', label: 'A new order arrives', note: 'On WhatsApp, as it lands' },
  { id: 'reply', label: 'An order needs a reply', note: 'When the customer wrote last' },
  { id: 'paid', label: 'A payment lands', note: 'Matched to the sale it belongs to' },
  { id: 'supplier', label: 'A supplier you brought joins', note: 'Your place in the list moves' },
];

function Picker<T extends string>({
  label,
  options,
  chosen,
  onChoose,
}: {
  label: string;
  options: readonly T[];
  chosen: T;
  onChoose: (next: T) => void;
}) {
  const [css, theme] = useStyletron();
  return (
    <Row label={label}>
      <div className={css({ display: 'flex', gap: theme.sizing.scale300, flexWrap: 'wrap' })}>
        {options.map((option) => {
          const on = option === chosen;
          return (
            <button
              key={option}
              type="button"
              data-option={option}
              aria-pressed={on}
              onClick={() => onChoose(option)}
              className={css({
                minHeight: '44px',
                minWidth: '64px',
                paddingLeft: theme.sizing.scale500,
                paddingRight: theme.sizing.scale500,
                borderRadius: theme.borders.radius300,
                border: `1px solid ${on ? theme.colors.contentPrimary : theme.colors.borderOpaque}`,
                background: on ? theme.colors.contentPrimary : theme.colors.backgroundPrimary,
                color: on ? theme.colors.backgroundPrimary : theme.colors.contentPrimary,
                cursor: 'default',
                ...theme.typography.LabelSmall,
              })}
            >
              {option}
            </button>
          );
        })}
      </div>
    </Row>
  );
}

function Toggle({
  label,
  note,
  on,
  onChange,
}: {
  label: string;
  note: string;
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  const [, theme] = useStyletron();
  return (
    <div
      data-toggle={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.sizing.scale100,
        paddingTop: theme.sizing.scale300,
        paddingBottom: theme.sizing.scale300,
        borderTop: `1px solid ${theme.colors.borderOpaque}`,
        minWidth: 0,
      }}
    >
      <Checkbox
        checked={on}
        onChange={(event) => onChange(event.currentTarget.checked)}
        labelPlacement={LABEL_PLACEMENT.right}
        overrides={{ Root: { style: { minHeight: '44px', alignItems: 'center' } } }}
      >
        {label}
      </Checkbox>
      <span style={{ ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary, paddingLeft: theme.sizing.scale900 }}>
        {note}
      </span>
    </div>
  );
}

export default function AppSettings() {
  const [css, theme] = useStyletron();
  const [paper, setPaper] = React.useState<Paper>('A5');
  const [copies, setCopies] = React.useState<'1' | '2'>('1');
  const [sheets, setSheets] = React.useState<Record<string, boolean>>({ prep: true, packing: true, delivery: true });
  const [notices, setNotices] = React.useState<Record<string, boolean>>({
    order: true, reply: true, paid: true, supplier: true,
  });

  return (
    <Seat id="app-settings" title="App settings" lead="The paper, what you are told about, and the language.">
      <Section title="Paper" note="Prep keeps one Print button, and it prints what you choose here.">
        <Picker label="Sheet size" options={PAPERS} chosen={paper} onChoose={setPaper} />
        <Picker label="Copies" options={['1', '2'] as const} chosen={copies} onChoose={setCopies} />
        {SHEETS.map((sheet) => (
          <Toggle
            key={sheet.id}
            label={sheet.label}
            note={sheet.note}
            on={sheets[sheet.id]}
            onChange={(next) => setSheets({ ...sheets, [sheet.id]: next })}
          />
        ))}
      </Section>

      {/* ONE POSTURE, ONE SENTENCE (QA 19). «on the number you connected» asserted a connection
          this seat cannot see; the card's subject is WHERE the notice arrives, which is the shop's
          own WhatsApp, and Connections is the one seat that states whether it is joined yet. */}
      <Section title="What you are told about" note="Every one of these reaches you on WhatsApp.">
        {NOTICES.map((notice) => (
          <Toggle
            key={notice.id}
            label={notice.label}
            note={notice.note}
            on={notices[notice.id]}
            onChange={(next) => setNotices({ ...notices, [notice.id]: next })}
          />
        ))}
      </Section>

      {/* ── THE WAY TO `#/chat` (DESIGN-SPEC.md §4 · MESSAGES.md §6) ─────────────────────────
          WhatsApp is where Rocoto stays with the shop once it has signed up in the browser: the
          notices and the offers travel there, and the simulation plays that thread turn by turn. It
          lives here because it is a fact about the SOFTWARE rather than about the shop, and because
          a route with no way in is a route Peter has to type. */}
      <Section title="Rocoto on WhatsApp" note="The messages Rocoto sends your shop, turn by turn.">
        <Row label="Open it">
          <a
            href="#/chat"
            data-testid="app-settings-chat"
            className={css({
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.sizing.scale200,
              minHeight: '44px',
              color: theme.colors.contentPrimary,
              textDecoration: 'none',
              ...theme.typography.LabelMedium,
            })}
          >
            Rocoto on WhatsApp
            <ChevronRight size={18} aria-hidden />
          </a>
        </Row>
      </Section>

      {/* ── THE BUILD'S OWN NOUNS LEFT THIS SEAT (QA 52 · QA 53) ──────────────────────────────
          «English is what this build speaks; Spanish arrives as its own build…», «Spanish, once
          its build lands» and «Your shop reads» spend three lines on how the software is
          assembled. A person reading a settings seat wants the fact: which language the app is
          speaking to them in, and which ones it speaks. */}
      <Section title="Language" note="The language Rocoto speaks to you in.">
        <Row label="Now" value="English" />
      </Section>
    </Seat>
  );
}
