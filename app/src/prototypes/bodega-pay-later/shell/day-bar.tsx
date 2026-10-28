/** The header: on a desk the current area and its immediate actions — identity belongs to the rail,
 *  which carries the product's one mark (FEED-IA §253). On a phone, where the rail is away, the
 *  mark and the word lead this bar as the way home. The day belongs to Prep, which draws its own
 *  toggler over its list (prep-design.md). */
import { useStyletron } from 'baseui';
import ExportCentre from './printing';
import { RocotoMark } from './rail';
import { usePhoneFloorHeight } from '../../cedar/shell/viewport';

export default function DayBar({ phone, title }: { phone: boolean; title?: string | null }) {
  const [, theme] = useStyletron();

  /* THE MARK IS A TOUCH CONTROL, SO ON A PHONE IT STANDS AT THE FLOOR (INTX-12 · §188.2).
     `workspace-brand` is an `<a href="#/prep">` — a door a thumb lands on — and it was drawn
     40px tall on every width, which `drives/drive-202-phone-targets.py` measured at 117×40 on
     thirteen routes at 393, 390 and 360. `usePhoneFloorHeight` is the house's own way to say it:
     44px on a phone, nothing on a desk. NO GEOMETRY MOVES. The phone bar's content row already
     stands at 44 (its actions carry the same floor), so the bar keeps its 65px; a desk row stays
     at 40 beside its 40px acts, and the bar keeps its 65px there too. */
  const floor = usePhoneFloorHeight();
  /* `DAY_BAR_NAMED` measured the room the mark, the name and the way out needed together; the
     mark now stands in the rail (FEED-IA §253) and the name leads at every desk width. */

  return (
    <div
      data-testid="day-bar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        gap: theme.sizing.scale500,
        flexWrap: 'nowrap',
        padding: phone
          ? `${theme.sizing.scale400} ${theme.sizing.scale500}`
          : `${theme.sizing.scale500} ${theme.sizing.scale800}`,
        borderBottom: `1px solid ${theme.colors.borderOpaque}`,
        background: theme.colors.backgroundPrimary,
      }}
    >

      {/* ── ONE MARK IN THE WINDOW (FEED-IA §253) ──────────────────────────────────────────────
          Peter, 14 September: «there's two loco things in the app btw!! int he sidebar and outside.
          should only be in sidebar.» On a desk the rail carries the product's face at its head, so
          this bar carried it a second time, 28px away from the first. The rail owns identity; this
          bar owns WHERE YOU ARE and WHAT YOU CAN DO. So on a desk the area's own name leads the
          line, and on a phone — where the rail is away and this bar is the only chrome — the mark
          and the word stand as the way home they have always been. */}
      {phone && (
        <a href="#/prep" data-testid="workspace-brand" aria-label="Rocoto — Prep" style={{
          display: 'flex', alignItems: 'center', gap: theme.sizing.scale200, flex: '1 1 0',
          minWidth: 'max-content', color: theme.colors.contentPrimary, textDecoration: 'none',
          minHeight: '40px', ...floor, ...theme.typography.LabelLarge,
        }}>
          <RocotoMark size={28} testId="header-logo" /><span>Rocoto</span>
        </a>
      )}

      {/* THE NAME LEADS THE LINE AT EVERY DESK WIDTH. `DAY_BAR_NAMED` bought room for the mark, the
          name and the way out together; with the mark in the rail the name costs a fraction of
          that, so the bar states where a person is from its narrowest desk posture up. */}
      {!phone && title && (
        <h1
          data-testid="area-title"
          data-area-title={title}
          style={{
            flex: '1 1 0',
            minWidth: 0,
            margin: 0,
            textAlign: 'left',
            ...theme.typography.LabelLarge,
            color: theme.colors.contentPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h1>
      )}
      {!phone && !title && <span style={{ flex: '1 1 0' }} />}

      {/* ── THE BODEGA'S ONBOARDING IS ITS SIX SCREENS, SO THE JOURNEY RING IS GONE FROM BOTH ──
          Cedar's `OnboardingCard` stood here on a phone. Collapsed it is a 28px ring and its own
          words — «Business setup · 0 of 2 complete» — live in an aria-label, so between the mark and
          Paper a phone carried a label-less circle that at 0 of 2 draws no arc: a seat whose only
          reading is decode, on every phone route at 393 and 320. A shop that has just finished
          screens 1–6 (`ONBOARDING-SPEC.md`) is set up already, so a second checklist right after
          them counts a journey it has walked — and the two steps it counts are CEDAR's phone and
          email setup. The rail's foot dropped the same card for the same reason, and for one more:
          reading the phone posture opened a channel workspace keyed to Cedar
          (`rail.tsx`'s import block holds the whole of it). */}

      <div
        data-testid="day-bar-actions"
        style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: theme.sizing.scale500 }}
      >
        {/* ── THE COPILOT LAUNCHER LEAVES WITH ITS HOST (`shell/frame.tsx`'s own note) ────────
            The agent column keeps its sessions under `rocoto-cedar-copilot-*`, one origin serves
            both prototypes, and the agent column is not part of this candidate — so the seat that
            opened it goes rather than standing as a control that opens nothing. */}
        {/* ── THE «?» IS GONE, AND WITH IT A LIVE SUPPORT QUEUE (QA item 3) ────────────────
            `SupportWidget` mounted Cedar's Zendesk Messaging panel: a dark-teal surface in no
            Rocoto palette, «Built with Zendesk» in its foot, taking the whole 393×852 viewport on
            a phone — and anything typed into it reached a real third-party queue out of a page the
            README calls a design prototype. A shop's questions reach Rocoto on WhatsApp, which is
            the door `#/chat` already is, so the header carries no second one. */}
        <ExportCentre />
      </div>
    </div>
  );
}
