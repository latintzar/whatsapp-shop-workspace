/* CONNECTIONS — one card per rail, and each one says what it actually stands on.
 *
 * Cedar's `admin/connections.tsx` groups Banking, Payments and Communications into one card per
 * account, each opening the same resumable setup content onboarding uses, and lets the VERIFIED
 * provider state own the status word. This seat keeps that law at a bodega's scale: four rails, and
 * the word on each one is read rather than asserted.
 *
 * ═══ WHAT IS READ, AND WHAT IS DOORED ════════════════════════════════════════════════════════
 * WHATSAPP is read — the one source seam answers the connection state itself, so the card prints
 * the number the service reports and how much of the history it has. THE BANK and THE PAYMENT PAGE
 * belong to Money, which owns their setup screens, so their cards carry the door to those screens
 * rather than a second copy of them. ROCOTO'S OWN NUMBER is a fact about the rig: it is the number the
 * closing message and the supplier notice arrive from, separate from the connected one
 * (`DESIGN-SPEC.md` the rig, item 5).
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { ChevronRight } from 'lucide-react';
import type { ProofState } from '../../../cedar/connections/types';
import { house } from '../../cast';
/* ── ONE POSTURE, ONE SOURCE (QA 19) ─────────────────────────────────────────────────────────
 * This card used to print the shop's seeded account whatever the connection said, under a state
 * word read live — so it stood a BCP account as set while Money's own card offered «Add your bank
 * account» and told the shop BCP was the one bank Rocoto has yet to read. The bank capability is
 * the fact both surfaces read now: connected, the account is named here and Money shows the
 * balance; unconnected, the account line is absent on both and each carries the same one act. */
import { useBankCapability } from '../../../cedar/money-bank-api';
import { MONEY_SCOPE } from '../../money-store';
/* ONE POSTURE, ONE SOURCE (QA 19) — the same derivation the conversation's own head reads. */
import { useShopConnection } from '../../shell/connection';
import { SOURCE_WORD, useChatSource } from '../../source';
/* ROCOTO'S OWN NUMBER on Meta's Cloud API is the one that writes to the shop, a separate account
   from the shop's own, and the card says so plainly. The literal is declared once, beside the
   plumbing that sends from it (`start/session.ts`), so the rig's sender moves in one place. */
import { ROCOTO_NUMBER } from '../../start/session';
import { Row, Seat, Section } from './business';

export const meta = { id: 'connections', title: 'Connections', owner: 'BODEGA-ADMIN', panes: false };

const ROCOTO_WABA = '2033396113925190';

/** THE STATE WORD IS READ FROM THE STATE. `ready` plus a connection is a live rail; a rail still
 *  being set up says which step it is on; a rail waiting for a hand says what it wants next. */
function whatsappWords(state: ProofState | null): string {
  if (!state) return 'Reading';
  if (state.connection && state.ready) return 'Connected';
  if (state.setup?.status === 'pending') return `Setting up · ${state.setup.step}`;
  return 'Ready to connect';
}

function historyWords(state: ProofState | null): string {
  const history = state?.history;
  if (!history) return 'Reading';
  if (history.status === 'complete') {
    return `${history.messages.toLocaleString('en-PE')} messages · ${history.conversations} conversations`;
  }
  if (history.status === 'syncing') return `Reading · ${history.progress ?? 0}%`;
  return history.status === 'waiting' ? 'Waiting for the shop' : 'Ready to read';
}

function Door({ label, hash }: { label: string; hash: string }) {
  return (
    <div style={{ alignSelf: 'flex-start', paddingTop: '8px' }}>
      <Button
        kind={KIND.secondary}
        size={SIZE.compact}
        endEnhancer={() => <ChevronRight size={16} aria-hidden />}
        onClick={() => { window.location.hash = hash; }}
      >
        {label}
      </Button>
    </div>
  );
}

/** The banks Rocoto reads, in the shop's own words, off the capability's own ids. */
const BANK_WORD: Record<'bbva' | 'interbank' | 'scotiabank', string> = {
  bbva: 'BBVA',
  interbank: 'Interbank',
  scotiabank: 'Scotiabank',
};

export default function Connections() {
  const [, theme] = useStyletron();
  const source = useChatSource();
  const shop = useShopConnection();
  const bank = useBankCapability(MONEY_SCOPE);
  const bankOn = bank.posture === 'ready';
  const state = shop.state;

  const whatsappOn = shop.joined;

  return (
    <Seat
      id="connections"
      title="Connections"
      lead="What Rocoto is joined to, and what each one is standing on."
    >
      {/* ── WHATSAPP: THE DOOR ANSWERS THE STATE (QA 19 · QA 53) ──────────────────────────────
          The card read «State: Connected · Number +51 976 431 412» with «Connect WhatsApp ›»
          underneath it — an act offering to do the thing the line above said was done. The number
          stands where a connection reports one, and the act is the one that fits the state. */}
      <Section title="WhatsApp" note="The shop's own number, and the chats Rocoto reads to build the book.">
        <Row label="State" value={whatsappWords(state)} />
        {whatsappOn && <Row label="Number" value={state?.connection?.number ?? house.whatsapp} />}
        <Row label="The read" value={historyWords(state)} />
        <Row label="The source" value={source ? SOURCE_WORD[source.kind] : 'Reading'} />
        <Door label={whatsappOn ? 'Manage the connection' : 'Connect WhatsApp'} hash="#/start/connect" />
      </Section>

      <Section
        title="Rocoto's own number"
        note="The closing message and the supplier notice arrive from here, on Meta's Cloud API, so the shop can tell them apart from its own."
      >
        <Row label="Number" value={ROCOTO_NUMBER} />
        <Row label="WhatsApp account" value={ROCOTO_WABA} />
        <Row label="How it writes" value="Inside the 24 hours the shop opens by writing first" />
      </Section>

      {/* ── THE BANK SAYS WHAT MONEY SAYS (QA 19) ────────────────────────────────────────────
          One posture, two words, in both places: `reading` while the provider answers — Money
          draws the balance and the movements — and `on file` while the shop's own account of
          record stands with the read still to open on it. The account is the SAME account on both
          surfaces, which is the whole of the fix: Administration showed it as set while Money
          offered «Add your bank account» about the same shop.
          The derivation is `money-overview.tsx`'s `bankStandingOf`, said again in one ternary
          rather than imported: an administration seat that imported Money would pull the whole
          Money closure into its own chunk. */}
      <Section title="Bank" note="Money reads the account, so a payment that lands is matched to the sale it belongs to.">
        <Row label="State" value={bankOn ? 'Reading this account' : 'On file'} />
        <Row label="Bank" value={bankOn ? (BANK_WORD[bank.bank ?? 'bbva'] ?? house.bank) : house.bank} />
        <Row label="Account" value={bankOn ? (bank.accountLabel || bank.accountMask) : house.account} />
        <Door
          label={bankOn ? 'Open Money' : 'Open the read on this account'}
          hash={bankOn ? '#/money/bank' : '#/money/setup/payments'}
        />
      </Section>

      <Section title="Payment page" note="A link carries the exact amount and your own account, with the description you typed on it.">
        <Row label="Yape" value={house.yape} />
        <Row label="Where a link lands" value="Rocoto's own checkout page" />
        <Door label="Set up payments" hash="#/money/setup/payments" />
      </Section>

      {/* «Each state word here is read from the rail itself» names the RAIL — the build's own noun
          for a connected service (QA 52). What the shop needs to know is that the words are the
          services' own answers rather than something the app wrote down once. */}
      <p style={{ margin: 0, ...theme.typography.ParagraphSmall, color: theme.colors.contentTertiary }}>
        Every state word here is what the service itself answered.
      </p>
    </Seat>
  );
}
