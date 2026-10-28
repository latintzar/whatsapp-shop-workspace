/* YOUR BUSINESS — THE SHOP'S OWN CARD, and the first of Administration's four seats.
 *
 * Cedar's `admin/business.tsx` is the source and its five clauses are the anatomy: a CARD at the
 * head, the parts it SUMMARIZES INTO, the seats those parts are CONNECTED TO, every field MADE
 * WITHIN the card itself rather than on a separate edit screen, and ACTIONS that reach across
 * surfaces. This is that seat at a bodega's scale.
 *
 * ═══ ADMINISTRATION KEEPS FOUR SEATS (DESIGN-SPEC.md §3 · §7 item 5) ═════════════════════════
 * business · connections · app-settings · data, at Cedar's own routes. Team, geography, operations,
 * agent, units and plan leave with the wholesale house that needed them, and the `account` foot
 * leaves with them: one shop, one person, one phone. `app-settings` and `data` also lose their PRICE
 * rows, because one shop sells at one price and the tarifa left this candidate entirely
 * (`WIRING-SPEC.md` §11).
 *
 * ═══ THE SEAT ROW LIVES HERE, AND THE OTHER THREE IMPORT IT ══════════════════════════════════
 * Cedar draws Administration's rail in `shell/frame.tsx`, which is a copy this candidate has still
 * to take (§7 item 5). Until it lands the four seats carry their own row, written once in this file
 * and imported by the other three — the same road `areas/admin/plan.tsx` takes to Cedar's `Value`.
 * When the frame arrives, this row comes out and nothing else moves.
 *
 * ═══ WHAT IS REAL HERE ═══════════════════════════════════════════════════════════════════════
 * The connected WhatsApp number, read from the proof state through the ONE source seam — Peter's own
 * number on the rig, the seeded shop's number on the sample. Everything else on the card is the
 * seeded house of `fixtures/cast-bodega.json`, edited in place and held for the session.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SHAPE, SIZE } from 'baseui/button';
import { Input } from 'baseui/input';
import { ArrowLeft, Check, Pencil } from 'lucide-react';
import Page from '../../../cedar/shell/page';
import { usePhone } from '../../../cedar/shell/viewport';
import type { ProofState } from '../../../cedar/connections/types';
import { house, owner } from '../../cast';
import { SOURCE_WORD, useChatSource } from '../../source';
import { ADMIN_ORDER, ADMIN_TITLE, type AdminSeatId } from '../../shell/area';

export const meta = { id: 'business', title: ADMIN_TITLE.business, owner: 'BODEGA-ADMIN', panes: false };

/* ── THE FOUR SEATS, STATED ONCE ──────────────────────────────────────────────────────────── */

/** ── THE FOUR SEATS, NAMED ONCE (QA 53) ────────────────────────────────────────────────────
 *  The words are `shell/area.ts`'s `ADMIN_TITLE`, read rather than restated: the phone's seat row,
 *  the desk's rail, the day bar and each seat's own heading all draw from that one object, so a
 *  seat renamed there is renamed everywhere in the same edit. This list keeps the ORDER, which is
 *  `ADMIN_ORDER`'s. */
export const ADMIN_SEATS: Array<{ id: AdminSeatId; title: string }> =
  ADMIN_ORDER.map((id) => ({ id, title: ADMIN_TITLE[id] }));

/**
 * THE ROW THAT MOVES BETWEEN THEM, AND THE DOOR BACK TO THE DESK — on the phone alone.
 *
 * `shell/frame.tsx` landed with Administration's own rail, and at the desk it already draws the way
 * back and the four seats down the left edge; a second row of the same four inside the column was
 * the same navigation twice on one screen — looked at, at 1280. On the PHONE the frame draws
 * neither: its push bar renders only while the frame is told which seat is current, and this
 * candidate's router names no area inside the admin world, so the seats would be reachable only by
 * typing a hash. So the row stands where it is the only way through, and stands down where the
 * frame has it covered.
 */
export function SeatRow({ current }: { current: string }) {
  const [css, theme] = useStyletron();
  const phone = usePhone();
  if (!phone) return null;
  return (
    <nav
      aria-label="Administration"
      data-testid="admin-seats"
      style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale400 }}
    >
      <div style={{ alignSelf: 'flex-start' }}>
        <Button
          kind={KIND.tertiary}
          size={SIZE.compact}
          startEnhancer={() => <ArrowLeft size={18} aria-hidden />}
          onClick={() => { window.location.hash = '#/prep'; }}
        >
          Prep
        </Button>
      </div>
      <div
        className={css({
          display: 'flex',
          gap: theme.sizing.scale200,
          flexWrap: 'wrap',
        })}
      >
        {ADMIN_SEATS.map((seat) => {
          const on = seat.id === current;
          return (
            <a
              key={seat.id}
              href={`#/admin/${seat.id}`}
              data-seat={seat.id}
              aria-current={on ? 'page' : undefined}
              className={css({
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '44px',
                paddingLeft: theme.sizing.scale400,
                paddingRight: theme.sizing.scale400,
                borderRadius: theme.borders.radius300,
                border: `1px solid ${on ? theme.colors.contentPrimary : theme.colors.borderOpaque}`,
                background: on ? theme.colors.contentPrimary : theme.colors.backgroundPrimary,
                color: on ? theme.colors.backgroundPrimary : theme.colors.contentPrimary,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                ...theme.typography.LabelXSmall,
              })}
            >
              {seat.title}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/* ── THE SEAT'S OWN ANATOMY, shared by the four ───────────────────────────────────────────── */

/** One administration seat: the row, the seat's name, and its sections in one scrolling column. */
export function Seat({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  const [, theme] = useStyletron();
  return (
    <Page title={title}>
      <div
        data-testid={`admin-${id}`}
        style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale700, minWidth: 0 }}
      >
        <SeatRow current={id} />
        <header style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale200 }}>
          <h1 style={{ margin: 0, ...theme.typography.HeadingMedium }}>{title}</h1>
          {lead && (
            <p style={{ margin: 0, maxWidth: '60ch', ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary }}>
              {lead}
            </p>
          )}
        </header>
        {children}
      </div>
    </Page>
  );
}

/** A card of rows, with its own blatant heading. */
export function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  const [, theme] = useStyletron();
  return (
    <section
      data-section={title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.sizing.scale400,
        padding: theme.sizing.scale600,
        background: theme.colors.backgroundPrimary,
        border: `1px solid ${theme.colors.borderOpaque}`,
        borderRadius: theme.borders.radius300,
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      <h2 style={{ margin: 0, ...theme.typography.HeadingXSmall }}>{title}</h2>
      {note && (
        <p style={{ margin: 0, ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}>
          {note}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale300 }}>{children}</div>
    </section>
  );
}

/** A labelled row: the label over the value, the value in the row's own ink. */
export function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [, theme] = useStyletron();
  return (
    <div
      data-row={label}
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
      <span style={{ ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary }}>{label}</span>
      {value !== undefined && (
        <span style={{ ...theme.typography.LabelMedium, wordBreak: 'break-word' }}>{value}</span>
      )}
      {children}
    </div>
  );
}

/**
 * A FACT EDITED WHERE IT IS READ (Cedar's «made within those parts»).
 *
 * Underline at rest, a field once it is pressed, and the value stands the moment it is kept. The
 * cell holds its place while it is empty, because a fact that vanishes moves the two beside it.
 */
export function Value({
  label,
  value,
  onChange,
  invite,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  /** what the cell asks for while it is empty — what it WANTS, said as a want */
  invite?: string;
}) {
  return (
    <Row label={label}>
      <Editable label={label} value={value} onChange={onChange} invite={invite} />
    </Row>
  );
}

/** THE CONTROL ITSELF, so a value can stand inside a row or as the head of a card. */
export function Editable({
  label,
  value,
  onChange,
  invite,
  step,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  invite?: string;
  /** the type step the value is read at — the head of a card reads it bigger than a row does */
  step?: React.CSSProperties;
}) {
  const [, theme] = useStyletron();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => { setDraft(value); }, [value]);

  return (
    <>
      {editing ? (
        <div style={{ display: 'flex', gap: theme.sizing.scale300, alignItems: 'center' }}>
          <Input
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            aria-label={label}
            size="compact"
            autoFocus
          />
          <Button
            kind={KIND.primary}
            size={SIZE.compact}
            shape={SHAPE.square}
            aria-label={`Keep ${label}`}
            onClick={() => { onChange(draft.trim()); setEditing(false); }}
            overrides={{ BaseButton: { style: { minWidth: '44px', minHeight: '44px' } } }}
          >
            <Check size={18} aria-hidden />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          data-editable={label}
          onClick={() => setEditing(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.sizing.scale300,
            minHeight: '44px',
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: value ? theme.colors.contentPrimary : theme.colors.contentTertiary,
            textAlign: 'left',
            cursor: 'default',
            ...theme.typography.LabelMedium,
            ...step,
          }}
        >
          <span style={{ borderBottom: `1px solid ${theme.colors.borderOpaque}` }}>
            {value || invite || label}
          </span>
          <Pencil size={14} aria-hidden style={{ flex: '0 0 auto', color: theme.colors.contentTertiary }} />
        </button>
      )}
    </>
  );
}

/* ── THE KIND OF SHOP IS A FACT, AND IT WAS DRAWN AS A SWITCH (QA 51 · QA 52) ─────────────────
 * «A bodega / A produce stall / A fish stall» read as the control that changes the world it names.
 * Pressing «A fish stall» changed the sentence under it and nothing else: the shop stayed Bodega
 * Yesenia, the catalogue stayed arroz and aceite, Prep and Products were identical. A developer's
 * world-picker standing in the shop's own settings, offering a shop a world it cannot have.
 *
 * AND ITS SENTENCE WAS THE RIG'S OWN. «— the world seeded today» names the seeding of a fixture;
 * the shop's own word for what is on its shelves is what belongs on a card about the shop.
 *
 * So the card STATES the kind, in the same row, with the shop described under it. The other two
 * worlds return the day they reseed — `DESIGN-SPEC.md` §9 item 7 holds them — and until then the
 * three are kept here as the record of what is coming rather than as three pressable lies.
 */
const WORLDS: Array<{ id: string; word: string; changes: string }> = [
  {
    id: 'bodega',
    word: 'A bodega',
    changes: 'Shelves to the ceiling, a glass counter and the drinks fridge.',
  },
  {
    id: 'produce-stall',
    word: 'A produce stall',
    changes: 'Crates and sacks stand in for shelves, a puesto in a mercado, and trade runs in the morning.',
  },
  {
    id: 'fish-stall',
    word: 'A fish stall',
    changes: 'Ice and whole fish off a dawn run to the terminal, sold by the kilo, the day’s catch as the list.',
  },
];

function Worlds({ chosen }: { chosen: string }) {
  const [, theme] = useStyletron();
  const world = WORLDS.find((w) => w.id === chosen) ?? WORLDS[0];
  return (
    <div data-world={world.id} style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale100 }}>
      <span style={{ ...theme.typography.LabelMedium }}>{world.word}</span>
      <p style={{ margin: 0, ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}>
        {world.changes}
      </p>
    </div>
  );
}

/* ── the connected number, read from the proof state ──────────────────────────────────────── */

function useConnection(): { state: ProofState | null; word: string } {
  const source = useChatSource();
  const [state, setState] = React.useState<ProofState | null>(null);
  React.useEffect(() => {
    if (!source) return;
    let live = true;
    source.connection().then((answer) => { if (live) setState(answer); }).catch(() => { /* the card
      still draws the seeded number while the state is on its way */ });
    return () => { live = false; };
  }, [source]);
  return { state, word: source ? SOURCE_WORD[source.kind] : 'Reading' };
}

/* ── the seat ─────────────────────────────────────────────────────────────────────────────── */

export default function Business() {
  const [, theme] = useStyletron();
  const phone = usePhone();
  const { state, word } = useConnection();
  const [name, setName] = React.useState(house.name);
  const [address, setAddress] = React.useState(house.address);
  const world = 'bodega';

  const connected = state?.connection?.number ?? house.whatsapp;
  const history = state?.history;

  return (
    <Seat id="business" title={ADMIN_TITLE.business} lead="The shop, its address, and the number Rocoto reads.">
      <Section title="The shop">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.sizing.scale500,
            paddingBottom: theme.sizing.scale400,
            minWidth: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: phone ? '48px' : '56px',
              height: phone ? '48px' : '56px',
              flex: '0 0 auto',
              borderRadius: theme.borders.radius200,
              background: theme.colors.backgroundSecondary,
              ...theme.typography.HeadingXSmall,
              color: theme.colors.contentSecondary,
            }}
          >
            {name.charAt(0)}
          </span>
          {/* THE NAME IS EDITED WHERE IT IS READ. A big name at the head of the card and a «Shop
              name» row underneath said the shop's name twice on one screen — looked at, at 393 —
              so the head's own name IS the control, which is what «made within those parts»
              means. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale100, minWidth: 0 }}>
            <Editable
              label="Shop name"
              value={name}
              onChange={setName}
              invite="Name your shop"
              step={theme.typography.HeadingXSmall}
            />
            <span style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}>
              {house.barrio}, {house.district}
            </span>
          </div>
        </div>
        <Value label="Address" value={address} onChange={setAddress} invite="Add the address" />
        <Row label="The kind of shop">
          <Worlds chosen={world} />
        </Row>
      </Section>

      <Section title="The number Rocoto reads" note="Read from the connection itself, so the card says what the service says.">
        <Row label="WhatsApp" value={connected} />
        <Row label="The source" value={word} />
        {history && (
          <Row
            label="What it has read"
            value={`${history.messages.toLocaleString('en-PE')} messages · ${history.conversations} conversations`}
          />
        )}
        <Row label="Shop phone" value={house.phone} />
        <Row label="Yape" value={house.yape} />
      </Section>

      <Section title="Who the shop is">
        <Row label="Owner" value={`${owner.name} · ${owner.role}`} />
        <Row label="Legal name" value={house.legalName} />
        <Row label="Kind of taxpayer" value={house.legalPerson} />
        <Row label="RUC" value={house.taxId} />
      </Section>

      <Section title="Where you get paid">
        <Row label="Bank" value={house.bank} />
        <Row label="Account" value={house.account} />
        <Row label="CCI" value={house.cci} />
      </Section>
    </Seat>
  );
}
