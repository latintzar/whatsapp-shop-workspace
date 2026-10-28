import publicSettings from '../../shop-config.json';
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND } from 'baseui/button';
import { ProofApiError, proofApi } from '../cedar/connections/api';
import { useProofSession } from '../cedar/connections/hooks';
import { beginSignup, loadMetaSdk, readSignupEvent, type MetaSdk, type SignupStatus } from '../cedar/connections/meta';
import type { ProofState } from '../cedar/connections/types';
import { appendExperimentEvent, CONNECTION_EXPERIMENT_KEY, CONNECTION_EXPERIMENT_RUN_KEY,
  isExperimentRunId, sanitizeExperimentJournal,
  type ExperimentEvent, type ExperimentJournal } from './connection-experiment-state';

const words = {
  en: {
    title: 'WhatsApp Business connection',
    intro: 'Open Meta, complete the connection steps, then return to Rocoto.',
    open: 'Open Meta setup', reopen: 'Reopen Meta', return: 'Return to Rocoto on WhatsApp',
    existing: 'Saved connection', checking: 'Checking this browser session',
    connected: 'Available in this session', pending: 'Ready to connect', checkAgain: 'Check again',
    current: 'This attempt', idle: 'Ready to open Meta', completed: 'Meta connection completed',
    completionBody: 'Meta’s response has been verified and the connection has been saved.',
    failed: 'Open Meta again to continue', failureBody: 'Start a fresh attempt from this page.',
    restored: 'This page has reopened. Open Meta to start a fresh attempt.',
    previous: 'Previous attempt', previousCompleted: 'Completed', previousFailed: 'Another attempt is needed',
    previousInterrupted: 'Page reopened during setup',
    waiting: 'Complete the steps in Meta, then return to this page.',
    preparing: 'Preparing Meta setup', config: 'Meta setup is awaiting account configuration.',
    sessionError: 'Check the browser session to continue.', sdkError: 'Load Meta again to continue.',
    loadAgain: 'Load Meta again', details: 'Test details', report: 'Copy test report', copied: 'Report copied',
    manual: 'Select and copy this report', journal: 'Saved events', testCode: 'Test code',
    statuses: { opening: 'Opening Meta', authorizing: 'Waiting for Meta authorization',
      exchanging: 'Verifying Meta authorization', awaiting_details: 'Waiting for Meta account details',
      connecting: 'Saving the verified connection' },
  },
  es: {
    title: 'Conexión de WhatsApp Business',
    intro: 'Abre Meta, completa los pasos de conexión y vuelve a Rocoto.',
    open: 'Abrir configuración de Meta', reopen: 'Volver a abrir Meta', return: 'Volver a Rocoto en WhatsApp',
    existing: 'Conexión guardada', checking: 'Comprobando la sesión de este navegador',
    connected: 'Disponible en esta sesión', pending: 'Lista para conectar', checkAgain: 'Comprobar de nuevo',
    current: 'Este intento', idle: 'Todo listo para abrir Meta', completed: 'Conexión con Meta completada',
    completionBody: 'La respuesta de Meta se ha verificado y la conexión está guardada.',
    failed: 'Abre Meta de nuevo para continuar', failureBody: 'Empieza otro intento desde esta página.',
    restored: 'Esta página se ha vuelto a abrir. Abre Meta para empezar otro intento.',
    previous: 'Intento anterior', previousCompleted: 'Completado', previousFailed: 'Hace falta otro intento',
    previousInterrupted: 'Página reabierta durante la configuración',
    waiting: 'Completa los pasos en Meta y vuelve a esta página.',
    preparing: 'Preparando la configuración de Meta', config: 'La configuración de Meta está pendiente.',
    sessionError: 'Comprueba la sesión del navegador para continuar.', sdkError: 'Carga Meta de nuevo para continuar.',
    loadAgain: 'Cargar Meta de nuevo', details: 'Detalles de la prueba', report: 'Copiar informe de la prueba', copied: 'Informe copiado',
    manual: 'Selecciona y copia este informe', journal: 'Eventos guardados', testCode: 'Código de prueba',
    statuses: { opening: 'Abriendo Meta', authorizing: 'Esperando la autorización de Meta',
      exchanging: 'Verificando la autorización de Meta', awaiting_details: 'Esperando los datos de la cuenta de Meta',
      connecting: 'Guardando la conexión verificada' },
  },
};

function readJournal(): ExperimentJournal {
  try { return sanitizeExperimentJournal(JSON.parse(localStorage.getItem(CONNECTION_EXPERIMENT_KEY) ?? 'null')); }
  catch { return sanitizeExperimentJournal(null); }
}

function testRunId(): string {
  try {
    const saved = localStorage.getItem(CONNECTION_EXPERIMENT_RUN_KEY);
    if (isExperimentRunId(saved)) return saved;
  } catch { /* A fresh diagnostic run also works with browser storage disabled. */ }
  const created = crypto.randomUUID();
  try { localStorage.setItem(CONNECTION_EXPERIMENT_RUN_KEY, created); }
  catch { /* This identifier is for correlating test events, never for account access. */ }
  return created;
}

/** An isolated probe: bodega onboarding writes and its completion-aware router never mount here. */
export default function ConnectionExperiment() {
  const [css, theme] = useStyletron();
  const lang = new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'es';
  const w = words[lang];
  const { ready, error: sessionError, retry, restart, confirm } = useProofSession();
  const [runId] = React.useState(testRunId);
  const [previous] = React.useState(readJournal);
  const journalRef = React.useRef(previous);
  const [journal, setJournal] = React.useState(previous);
  const [state, setState] = React.useState<ProofState | null>(null);
  const [saved, setSaved] = React.useState<'checking' | 'connected' | 'pending'>('checking');
  const [readError, setReadError] = React.useState(false);
  const [revision, setRevision] = React.useState(0);
  const [sdk, setSdk] = React.useState<MetaSdk | null>(null);
  const [sdkError, setSdkError] = React.useState(false);
  const [sdkRevision, setSdkRevision] = React.useState(0);
  const [status, setStatus] = React.useState<SignupStatus | null>(null);
  const [outcome, setOutcome] = React.useState<'idle' | 'active' | 'completed' | 'failed'>('idle');
  const [copied, setCopied] = React.useState<'idle' | 'copied' | 'manual'>('idle');
  const request = React.useRef<AbortController | null>(null);
  const stop = React.useRef<(() => void) | undefined>();
  const active = React.useRef(false);
  const observedUntil = React.useRef(0);
  const loadRecorded = React.useRef(false);

  const record = React.useCallback((kind: ExperimentEvent['kind'], value?: ExperimentEvent['value']) => {
    const next = appendExperimentEvent(journalRef.current, { kind, ...(value ? { value } : {}) });
    journalRef.current = next;
    setJournal(next);
    try { localStorage.setItem(CONNECTION_EXPERIMENT_KEY, JSON.stringify(next)); }
    catch { /* The current page keeps its sanitized journal when browser storage is unavailable. */ }
    // The event vocabulary is fixed; provider responses and browser/account identifiers stay out.
    void fetch('/api/bodega/connection-test/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
      cache: 'no-store', keepalive: true,
      body: JSON.stringify({ runId, events: [next.events[next.events.length - 1]] }),
    }).catch(() => { /* The local journal remains available when live delivery is interrupted. */ });
  }, [runId]);

  React.useEffect(() => {
    if (!loadRecorded.current) { loadRecorded.current = true; record('load'); }
    const visibility = () => record('visibility', document.visibilityState === 'hidden' ? 'hidden' : 'visible');
    const hide = (event: PageTransitionEvent) => record('pagehide', event.persisted ? 'persisted' : 'fresh');
    const show = (event: PageTransitionEvent) => record('pageshow', event.persisted ? 'persisted' : 'fresh');
    const provider = (event: MessageEvent) => {
      if (Date.now() > observedUntil.current) return;
      const answer = readSignupEvent(event.origin, event.data);
      if (answer?.cancelled) record('provider_event', 'cancel');
      else if (answer?.failed) record('provider_event', 'error');
      else if (answer?.session) record('provider_event', answer.session.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
        ? 'finish_coexistence' : 'finish');
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', show);
    window.addEventListener('message', provider);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', show);
      window.removeEventListener('message', provider);
      observedUntil.current = 0;
      stop.current?.();
      request.current?.abort();
    };
  }, [record]);

  React.useEffect(() => {
    if (!ready || active.current) return;
    const controller = new AbortController();
    request.current = controller;
    setReadError(false);
    void proofApi<ProofState>('/state', { signal: controller.signal }).then((next) => {
      if (controller.signal.aborted || active.current) return;
      setState(next);
      setSaved(next.connection ? 'connected' : 'pending');
      confirm();
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setReadError(true);
      if (error instanceof ProofApiError && error.status === 401) restart();
    });
    return () => controller.abort();
  }, [ready, revision, confirm, restart]);

  const appId = state?.meta.appId;
  const configId = state?.meta.configId;
  const graphVersion = state?.meta.graphVersion;
  const configured = state?.ready === true && Boolean(appId && configId && graphVersion);
  React.useEffect(() => {
    if (!configured || !appId || !graphVersion) return;
    let alive = true;
    setSdkError(false);
    void loadMetaSdk().then((loaded) => {
      if (!alive) return;
      loaded.init({ appId, version: graphVersion, cookie: true, xfbml: false, autoLogAppEvents: false });
      setSdk(loaded);
    }).catch(() => { if (alive) setSdkError(true); });
    return () => { alive = false; };
  }, [configured, appId, graphVersion, sdkRevision]);

  const onStatus = React.useCallback((next: SignupStatus) => {
    setStatus(next);
    record('status', next);
  }, [record]);
  const onConnected = React.useCallback((next: ProofState) => {
    active.current = false;
    observedUntil.current = 0;
    stop.current = undefined;
    setStatus(null);
    setState(next);
    setSaved(next.connection ? 'connected' : 'pending');
    setOutcome('completed');
    confirm();
    record('completion', 'complete');
  }, [confirm, record]);
  const onError = React.useCallback((error: unknown) => {
    active.current = false;
    setStatus(null);
    setOutcome('failed');
    const category = error instanceof ProofApiError && error.status === 401 ? 'session'
      : error instanceof ProofApiError && error.status === 0 ? 'network' : 'provider';
    record('failure', category);
    if (category === 'session') restart();
  }, [record, restart]);
  const launch = () => {
    if (!sdk || !configured || !configId || !ready) return;
    stop.current?.();
    request.current?.abort();
    active.current = true;
    observedUntil.current = Date.now() + 30 * 60 * 1000;
    setOutcome('active');
    record('launch');
    stop.current = beginSignup({ sdk, configId, historyRequested: false, onStatus, onConnected, onError });
  };

  const busy = outcome === 'active';
  const canOpen = ready && configured && Boolean(sdk) && !readError;
  const interrupted = previous.outcome === 'active' || previous.outcome === 'interrupted';
  const report = JSON.stringify({ probe: 'bodega-whatsapp-connection', runId, ...journal }, null, 2);
  const copyReport = async () => {
    try { await navigator.clipboard.writeText(report); setCopied('copied'); }
    catch { setCopied('manual'); }
  };
  const paragraph = { ...theme.typography.ParagraphMedium, marginTop: '0px', marginBottom: '0px' };

  return <main lang={lang} data-testid="connection-experiment" className={css({
    minHeight: '100dvh', boxSizing: 'border-box', width: '100%', backgroundColor: theme.colors.backgroundPrimary,
    color: theme.colors.contentPrimary, fontFamily: theme.typography.ParagraphMedium.fontFamily,
    padding: theme.sizing.scale700, paddingTop: `max(${theme.sizing.scale800}, env(safe-area-inset-top))`,
    paddingBottom: `max(${theme.sizing.scale800}, env(safe-area-inset-bottom))`,
  })}>
    <div className={css({ width: '100%', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto',
      display: 'grid', gap: theme.sizing.scale900, minWidth: 0 })}>
      <div className={css({ display: 'flex', alignItems: 'center', gap: theme.sizing.scale400 })}>
        <img src="/brand/rocoto-mark.svg" width={32} height={32} alt="" />
        <span className={css({ ...theme.typography.HeadingSmall })}>Rocoto</span>
      </div>
      <header className={css({ display: 'grid', gap: theme.sizing.scale500 })}>
        <h1 className={css({ ...theme.typography.HeadingLarge, margin: 0, overflowWrap: 'anywhere' })}>{w.title}</h1>
        <p className={css({ ...paragraph, color: theme.colors.contentSecondary })}>{w.intro}</p>
      </header>
      <section aria-labelledby="connection-attempt-title" className={css({ display: 'grid', gap: theme.sizing.scale600 })}>
        <div role="status" aria-live="polite" aria-atomic="true" data-testid="connection-attempt-status"
          data-outcome={outcome} className={css({ display: 'grid', gap: theme.sizing.scale400 })}>
          <h2 id="connection-attempt-title" className={css({ ...theme.typography.LabelMedium, margin: 0 })}>{w.current}</h2>
          <p className={css({ ...paragraph, fontWeight: 600 })}>{status ? w.statuses[status]
            : outcome === 'completed' ? w.completed : outcome === 'failed' ? w.failed : w.idle}</p>
          <p className={css({ ...paragraph, color: theme.colors.contentSecondary })}>{busy ? w.waiting
            : outcome === 'completed' ? w.completionBody : outcome === 'failed' ? w.failureBody
              : interrupted ? w.restored : configured && !sdk && !sdkError ? w.preparing : ''}</p>
        </div>
        {(sessionError || readError) && <div role="alert">
          <p className={css(paragraph)}>{w.sessionError}</p>
          <Button kind={KIND.tertiary} onClick={() => { setReadError(false); retry(); setRevision((value) => value + 1); }}>{w.checkAgain}</Button>
        </div>}
        {state && !configured && <p role="status" className={css(paragraph)}>{w.config}</p>}
        {sdkError && <div role="alert">
          <p className={css(paragraph)}>{w.sdkError}</p>
          <Button kind={KIND.tertiary} onClick={() => setSdkRevision((value) => value + 1)}>{w.loadAgain}</Button>
        </div>}
        <Button type="button" onClick={launch} disabled={!canOpen || busy} data-testid="open-meta-setup"
          overrides={{ BaseButton: { style: { width: '100%', minHeight: '52px' } } }}>{w.open}</Button>
        {busy && (status === 'opening' || status === 'authorizing' || status === 'awaiting_details') &&
          <Button type="button" kind={KIND.tertiary} onClick={launch} disabled={!canOpen}>{w.reopen}</Button>}
        <a href={publicSettings.botChat || '#/admin/connections'} data-testid="connection-return-chat" className={css({
          ...theme.typography.LabelLarge, color: theme.colors.contentPrimary, paddingTop: theme.sizing.scale500,
          paddingBottom: theme.sizing.scale500, textAlign: 'center', lineHeight: '24px', minHeight: '44px',
          boxSizing: 'border-box', ':focus-visible': { outline: `2px solid ${theme.colors.contentPrimary}`, outlineOffset: '4px' },
        })}>{w.return}</a>
      </section>
      <section aria-labelledby="saved-connection-title" className={css({ display: 'grid', gap: theme.sizing.scale300,
        borderTop: `1px solid ${theme.colors.borderOpaque}`, paddingTop: theme.sizing.scale600 })}>
        <h2 id="saved-connection-title" className={css({ ...theme.typography.LabelMedium, margin: 0 })}>{w.existing}</h2>
        <p data-testid="connection-saved-status" className={css({ ...paragraph, color: theme.colors.contentSecondary })}>
          {saved === 'connected' ? w.connected : saved === 'pending' ? w.pending : w.checking}</p>
      </section>
      <details data-testid="connection-test-details" className={css({ ...theme.typography.ParagraphSmall, minWidth: 0 })}>
        <summary className={css({ cursor: 'pointer', minHeight: '44px', display: 'list-item', paddingTop: theme.sizing.scale400,
          boxSizing: 'border-box', ':focus-visible': { outline: `2px solid ${theme.colors.contentPrimary}`, outlineOffset: '4px' } })}>{w.details}</summary>
        {previous.attempt > 0 && <p>{w.previous}: {interrupted ? w.previousInterrupted
          : previous.outcome === 'completed' ? w.previousCompleted : w.previousFailed}</p>}
        <p data-testid="connection-test-code">{w.testCode}: {runId.slice(-6)}</p>
        <p>{w.journal}: {journal.events.length}</p>
        <Button type="button" kind={KIND.secondary} onClick={() => void copyReport()}>{w.report}</Button>
        {copied === 'copied' && <p role="status">{w.copied}</p>}
        {copied === 'manual' && <label className={css({ display: 'grid', gap: theme.sizing.scale400, marginTop: theme.sizing.scale500 })}>
          {w.manual}<textarea readOnly value={report} rows={8} onFocus={(event) => event.currentTarget.select()}
            className={css({ ...theme.typography.ParagraphXSmall, width: '100%', boxSizing: 'border-box',
              color: theme.colors.contentPrimary, backgroundColor: theme.colors.backgroundSecondary })} />
        </label>}
        <pre className={css({ ...theme.typography.ParagraphXSmall, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
          color: theme.colors.contentSecondary })}>{report}</pre>
      </details>
    </div>
  </main>;
}
