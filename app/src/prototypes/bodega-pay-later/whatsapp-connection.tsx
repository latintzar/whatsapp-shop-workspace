/* THE WHATSAPP CONNECTION — Cedar's `whatsapp-connection.tsx`, copied, its key renamed.
 *
 * COPIED RATHER THAN IMPORTED, FOR ONE REASON: the store. One origin serves `/cedar/` and
 * `/bodega-pay-later/`, so a shared browser key means one prototype editing the other's ledger —
 * this copy writes `rocoto-bodega-whatsapp-selected-v1` (`store/keys.ts`, WIRING-SPEC.md §2 and §11).
 * Everything else about Meta's walk is IMPORTED as it stands: `connections/app.tsx`'s `WhatsAppSetup`
 * with its five setup titles, `connections/hooks.ts`'s session and polling, `whatsapp-capability.ts`'s
 * posture, and `setup-frame.tsx`'s anatomy. Cedar's own files carry no behaviour change: `WhatsAppSetup`
 * gained one optional `lang` prop, defaulting to 'en', so every existing caller — Cedar's own
 * `ConnectionsApp` included — paints exactly what it painted before (FEED-IA §268). The bodega walk
 * is the one caller that passes `'es'`, forwarded from `start/words.ts` through `WhatsAppWalk` below.
 *
 * WHAT THIS COPY DROPS, and why:
 *   · `useConfig` — Cedar's config provider and its wholesale cast. This surface is one shop, so the
 *     sector word is `stage.ts`'s own scope and the business name is the bodega's own.
 *   · `Use test data` — it opened Cedar's onboarding rehearsal over Cedar's cast. This prototype's
 *     stand-in is the source seam's sample world (`source/index.ts`), reached where the bridge
 *     answers 503, and named `Sample chats` where the spec says.
 *
 * ── `visited` IS A UI FACT, AND IT HAS NO VOTE ANYWHERE (Cedar's own note, FEED-IA §246 · §247.2) ──
 * «this browser has been through the WhatsApp door» is a real and useful fact, and it is never
 * connection evidence: `whatsappCapabilityOf` derives the posture from the polled `/state` alone, and
 * the reset returns this flag to false along with the snapshot.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND } from 'baseui/button';
import { Check } from 'lucide-react';
import { ConnectionSetupFrame, type SetupPresentation } from '../cedar/setup-frame';
import { WhatsAppSetup } from '../cedar/connections/app';
import { proofApi } from '../cedar/connections/api';
import { useProofPolling, useProofSession } from '../cedar/connections/hooks';
import type { Connection, ProofState } from '../cedar/connections/types';
import {
  WHATSAPP_OTHER_WORKSPACE,
  whatsappActs,
  whatsappCapabilityOf,
  whatsappWordFor,
  type WhatsAppCapability,
} from '../cedar/whatsapp-capability';
import whatsappLogo from '../cedar/connections/assets/whatsapp-business.webp';
import { WHATSAPP } from '../../rocoto-theme';
import { KEYS } from './store/keys';
import { SCOPE } from './stage';
import { house } from './cast';

/** The workspace word this surface's connection is bound to. One shop, one scope. */
export const SECTOR = SCOPE;

type Request = {
  presentation: SetupPresentation;
  onComplete?: (connection: Connection) => void;
  onClose?: () => void;
};

type Snapshot = {
  visited: boolean;
  request: Request | null;
  state: ProofState | null;
  error: string;
  busy: boolean;
  checkedAt: number;
};

/** THE RENAMED KEY. Cedar keeps `rocoto-cedar-whatsapp-selected-v1`; this surface keeps its own. */
const selectionKey = KEYS.whatsappSelected;

function readVisited(): boolean {
  try { return localStorage.getItem(selectionKey) === 'true'; } catch { return false; }
}

const initial = (): Snapshot => ({ visited: readVisited(), request: null, state: null, error: '', busy: false, checkedAt: 0 });
let snapshot: Snapshot = initial();
const listeners = new Set<() => void>();
function update(patch: Partial<Snapshot>) { snapshot = { ...snapshot, ...patch }; listeners.forEach((listener) => listener()); }
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const read = () => snapshot;

export const useWhatsAppConnection = () => React.useSyncExternalStore(subscribe, read, read);

/** THE ONE DERIVATION EVERY WHATSAPP ENTRANCE READS (`../cedar/whatsapp-capability.ts`), subscribed. */
export function useWhatsAppCapability(sector: string = SECTOR): WhatsAppCapability {
  const held = useWhatsAppConnection();
  return React.useMemo(
    () => whatsappCapabilityOf({ state: held.state, error: held.error, checkedAt: held.checkedAt, visited: held.visited }, sector),
    [held.state, held.error, held.checkedAt, held.visited, sector],
  );
}

/** Opening the door is a visit. It is recorded as one, and it proves the door was opened. */
function noteWhatsAppVisit(): void {
  try { localStorage.setItem(selectionKey, 'true'); } catch { /* the current session still works */ }
  if (!snapshot.visited) update({ visited: true });
}

export function openWhatsAppConnection(request: Request): void {
  noteWhatsAppVisit();
  update({ request });
}

/** THE SHARED RESET CONTRACT · this store returns to its initial posture (`Reset state`). */
function resetWhatsAppConnection() {
  snapshot = { ...initial(), request: snapshot.request };
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('rocoto-bodega-whatsapp-refresh'));
}

export const WHATSAPP_RESET_EVENT = 'rocoto:bodega-workspace-reset';
export const WHATSAPP_REFRESH_EVENT = 'rocoto-bodega-whatsapp-refresh';

if (typeof window !== 'undefined') {
  window.addEventListener(WHATSAPP_RESET_EVENT, resetWhatsAppConnection);
}

function close(completed = false) {
  const request = snapshot.request;
  update({ request: null });
  if (!completed) request?.onClose?.();
}

/* ── one picture for every posture that is not a connection (Cedar's §246 · §247.2) ───────────── */

/** THE SENTENCE'S SPANISH TWIN, the same way Cedar's own file keeps one (`connections/app.tsx`'s
 *  `SPANISH`): `says` overrides either language when a caller has its own line to say. */
const SAYS_DEFAULT: Record<'en' | 'es', string> = {
  en: 'Connect WhatsApp Business to read your chats and build your book.',
  es: 'Conecta WhatsApp Business para leer tus chats y armar tu libreta.',
};

export function WhatsAppSetupState({ sector = SECTOR, onOpenSetup, size = 96, says, lang = 'en' }: {
  sector?: string; onOpenSetup?: () => void; size?: number; says?: string; lang?: 'en' | 'es';
}) {
  /* ⚠ THE MARK IS META'S, AND IT IS DRAWN AT A MARK'S SIZE — Cedar's own reasoning, kept: a brand
     mark blown up to a feature object's size outweighs the sentence and the act beside it. */
  const [, theme] = useStyletron();
  const capability = useWhatsAppCapability(sector);
  const acts = whatsappActs(capability);
  const sentence = says ?? SAYS_DEFAULT[lang];
  const open = () => {
    if (onOpenSetup) { onOpenSetup(); return; }
    openWhatsAppConnection({ presentation: 'dialog' });
  };
  return <div data-testid="whatsapp-setup-state" data-whatsapp-posture={capability.posture} data-acts={acts ? 'yes' : 'no'}
    style={{ display: 'grid', justifyItems: 'center', gap: theme.sizing.scale500, textAlign: 'center' }}>
    <img src={whatsappLogo} alt="" width={size} height={size} style={{ maxWidth: '100%', height: 'auto' }} />
    <p style={{ ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary, margin: 0, maxWidth: 320 }}>
      {acts ? sentence : WHATSAPP_OTHER_WORKSPACE}</p>
    <Button onClick={open} data-testid="whatsapp-open-setup" overrides={{ BaseButton: { style: {
      minHeight: '48px', backgroundColor: WHATSAPP.green, color: WHATSAPP.onGreen,
      ':hover': { backgroundColor: `color-mix(in srgb, ${WHATSAPP.green} 88%, ${theme.colors.contentPrimary})` },
      ':active': { backgroundColor: `color-mix(in srgb, ${WHATSAPP.green} 78%, ${theme.colors.contentPrimary})` },
    } } }}>{whatsappWordFor(capability)}</Button>
    {capability.error && <p role="status" data-testid="whatsapp-setup-note"
      style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0, maxWidth: 320 }}>{capability.error}</p>}
  </div>;
}

/* ── the session behind Meta's walk ───────────────────────────────────────────────────────────── */

type WalkProps = {
  /** where a completed connection goes */
  onComplete?: (connection: Connection) => void;
  /** the connection this browser already holds, drawn with its own act */
  standing?: React.ReactNode;
  /** the sign-up's own language (`start/words.ts`), forwarded to Cedar's `WhatsAppSetup` untouched. */
  lang?: 'en' | 'es';
  businessConfirmed?: boolean;
  /** The native browser handoff may return immediately after a newly verified Meta completion. */
  autoComplete?: boolean;
  /** The Android Auth Tab owns one automatic return path and may recover only server-verified state. */
  handoffMode?: boolean;
};

/**
 * META'S WALK, MOUNTED IN THE PAGE — what screen 2 renders under its own title and sentence.
 * The session, the polling and `WhatsAppSetup` are Cedar's own; this component supplies the box.
 */
export function WhatsAppWalk({ onComplete, standing, lang = 'en', businessConfirmed = false,
  autoComplete = false, handoffMode = false }: WalkProps) {
  const [, theme] = useStyletron();
  const session = useProofSession();
  const [recovery, setRecovery] = React.useState('');
  const attempted = React.useRef(false);
  const completedConnection = React.useRef('');
  const [automaticCompletionStarted, setAutomaticCompletionStarted] = React.useState(false);
  const [signupActive, setSignupActive] = React.useState(false);
  const recoveryRequest = React.useRef(false);
  const onLocked = React.useCallback(() => {
    if (attempted.current) setRecovery('Your setup session needs a fresh connection. Continue with WhatsApp Business.');
    session.restart();
  }, [session.restart]);
  const state = useProofPolling<ProofState>('/state', session.ready, onLocked);
  const onActivityChange = React.useCallback((active: boolean) => {
    setSignupActive(active);
    update({ busy: active });
    if (active) { attempted.current = true; setRecovery(''); state.pause(); } else state.resume();
  }, [state.pause, state.resume]);
  React.useEffect(() => {
    if (state.data) session.confirm();
    if (state.data?.connection) { attempted.current = false; setRecovery(''); }
    update({ state: state.data, error: session.error || state.error, checkedAt: state.data ? Date.now() : snapshot.checkedAt });
  }, [state.data, state.error, session.error, session.confirm]);
  React.useEffect(() => {
    const refresh = (event: Event) => ((event as CustomEvent<{ renew?: boolean }>).detail?.renew ? onLocked() : state.refresh());
    window.addEventListener(WHATSAPP_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(WHATSAPP_REFRESH_EVENT, refresh);
  }, [state.refresh, onLocked]);
  const paragraph = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };
  const connection = session.ready ? state.data?.connection : null;
  React.useEffect(() => {
    if (!handoffMode || !signupActive || connection) return undefined;
    let live = true;
    const recover = async () => {
      if (!live || document.hidden || recoveryRequest.current) return;
      recoveryRequest.current = true;
      try {
        const next = await proofApi<ProofState>('/state', { timeoutMs: 5000 });
        /* A binding becomes usable only after its provider setup is complete. Earlier connection
         * rows are intentionally invisible here: approving one would race callback verification. */
        if (live && next.connection && next.setup?.status === 'ready') state.adopt(next);
      } catch {
        /* Pending and rotating proof sessions stay on this attempt. Recovery never starts OAuth. */
      } finally {
        recoveryRequest.current = false;
      }
    };
    const foreground = () => { if (!document.hidden) void recover(); };
    void recover();
    const interval = window.setInterval(foreground, 1500);
    window.addEventListener('focus', foreground);
    window.addEventListener('pageshow', foreground);
    document.addEventListener('visibilitychange', foreground);
    return () => {
      live = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', foreground);
      window.removeEventListener('pageshow', foreground);
      document.removeEventListener('visibilitychange', foreground);
    };
  }, [handoffMode, signupActive, connection, state.adopt]);
  React.useEffect(() => {
    if (!autoComplete || !connection || !onComplete) return;
    const identity = `${connection.wabaId}:${connection.phoneId}:${connection.number}`;
    if (completedConnection.current === identity) return;
    completedConnection.current = identity;
    setAutomaticCompletionStarted(true);
    onComplete(connection);
  }, [autoComplete, connection, onComplete]);
  if (connection && standing) return <>{standing}</>;
  return <div data-testid="whatsapp-walk" style={{ display: 'grid', gap: theme.sizing.scale600 }}>
    {recovery && <p role="alert" style={paragraph}>{recovery}</p>}
    {connection && <div data-testid="whatsapp-existing-account" style={{ display: 'flex', alignItems: 'center', gap: theme.sizing.scale500,
      padding: theme.sizing.scale600, border: `1px solid ${theme.colors.borderOpaque}`, borderRadius: theme.borders.radius400 }}>
      <img src={whatsappLogo} alt="" width={48} height={48} />
      <div style={{ display: 'grid', gap: theme.sizing.scale200, minWidth: 0, flex: 1 }}>
        <strong style={theme.typography.LabelLarge}>{connection.name || house.name}</strong>
        <span style={paragraph}>{connection.number}</span>
      </div>
      <Check size={20} aria-label="Connected" />
    </div>}
    {connection && onComplete && (!autoComplete || automaticCompletionStarted) && <Button data-testid="whatsapp-connection-continue"
      overrides={{ BaseButton: { style: { minHeight: '48px' } } }}
      onClick={() => onComplete(connection)}>Continue</Button>}
    {session.ready && state.data && !connection ? <>
      {state.error && <p role="alert" style={paragraph}>{state.error}</p>}
      <WhatsAppSetup state={state.data} businessConfirmed={businessConfirmed} onConnected={(next) => state.adopt(next)} onLocked={onLocked}
        onRefresh={state.refresh} onActivityChange={onActivityChange} lang={lang} handoffMode={handoffMode} />
    </> : !connection && <div style={{ display: 'grid', gap: theme.sizing.scale500 }}>
      <p role="status" style={paragraph}>{session.error || state.error || 'Opening your WhatsApp connection…'}</p>
      {(session.error || state.error) && <Button kind={KIND.secondary} overrides={{ BaseButton: { style: { minHeight: '48px' } } }}
        onClick={session.error ? session.retry : state.refresh}>Try again</Button>}
    </div>}
  </div>;
}

/** Cedar's dialog host, kept: a surface that opens the walk from a card rather than from a screen. */
function WhatsAppSession() {
  const [, theme] = useStyletron();
  const held = useWhatsAppConnection();
  if (!held.request) return null;
  const paragraph = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };
  return <ConnectionSetupFrame title="" contentTitleId="connections-title" presentation={held.request.presentation}
    onClose={() => close()} testId="whatsapp-connection" disclosure={<p style={paragraph}>
      Meta controls your account and history permissions. Your connected chats stay available in Rocoto.
    </p>}>
    <WhatsAppWalk onComplete={(connection) => { const complete = snapshot.request?.onComplete; close(true); complete?.(connection); }} />
  </ConnectionSetupFrame>;
}

export default function WhatsAppConnectionHost() {
  return <WhatsAppSession />;
}
