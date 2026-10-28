import publicSettings from '../../shop-config.json';
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { isExperimentRunId } from './connection-experiment-state';

const START = '/api/bodega/connection-test/start';
const RESTART = '/api/bodega/connection-test/restart';
const CHAT = publicSettings.botChat || '#/admin/connections';
const statuses = ['pending', 'processing', 'authorized', 'cancelled', 'failed', 'expired'] as const;
type ResultStatus = typeof statuses[number];
type Result = { status: ResultStatus; runId?: string };
const words = {
  en: {
    opening: 'Opening Meta', openingBody: 'Meta setup opens in this window.',
    checking: 'Checking the Meta response',
    authorized: 'Meta authorization received',
    authorizedBody: 'Returning to Rocoto on WhatsApp.',
    processing: 'Verifying Meta authorization', processingBody: 'The current authorization is processing.',
    pending: 'Meta authorization pending', pendingBody: 'Open Meta to continue the test.',
    cancelled: 'Meta setup closed', failed: 'Open Meta again', expired: 'Start a fresh Meta test',
    retryBody: 'Start a new test to open Meta again.', open: 'Open Meta setup',
    restart: 'Start a new test', check: 'Check result', checkBody: 'Check the current authorization result to continue.',
    return: 'Return to Rocoto on WhatsApp', testCode: 'Test code',
  },
  es: {
    opening: 'Abriendo Meta', openingBody: 'La configuración de Meta se abre en esta ventana.',
    checking: 'Comprobando la respuesta de Meta',
    authorized: 'Autorización de Meta recibida',
    authorizedBody: 'Volviendo a Rocoto en WhatsApp.',
    processing: 'Verificando la autorización de Meta', processingBody: 'La autorización actual se está procesando.',
    pending: 'Autorización de Meta pendiente', pendingBody: 'Abre Meta para continuar la prueba.',
    cancelled: 'Configuración de Meta cerrada', failed: 'Abre Meta de nuevo', expired: 'Empieza otra prueba de Meta',
    retryBody: 'Empieza una prueba nueva para abrir Meta de nuevo.', open: 'Abrir configuración de Meta',
    restart: 'Empezar una prueba nueva', check: 'Comprobar resultado', checkBody: 'Comprueba el resultado de la autorización actual para continuar.',
    return: 'Volver a Rocoto en WhatsApp', testCode: 'Código de prueba',
  },
};

/** Same-window redirect test. Its independent cookie never opens or resets a proof session. */
export default function DirectConnectionExperiment() {
  const [css, theme] = useStyletron();
  const query = new URLSearchParams(window.location.search);
  const lang = query.get('lang') === 'en' ? 'en' : 'es';
  const returned = query.get('returned') === '1';
  const callbackFailed = query.get('callback') === 'failed';
  const w = words[lang];
  const [result, setResult] = React.useState<Result | null>(null);
  const [failed, setFailed] = React.useState(callbackFailed);
  const [revision, setRevision] = React.useState(0);
  const [polling, setPolling] = React.useState(false);
  const returnAttempted = React.useRef(false);

  React.useEffect(() => {
    if (!returned) { window.location.replace(START); return; }
    if (callbackFailed) return;
    let alive = true;
    let request: AbortController | undefined;
    let nextRead: number | undefined;
    const deadline = performance.now() + 60000;
    setFailed(false);
    setPolling(true);
    const read = async () => {
      request = new AbortController();
      const timeout = window.setTimeout(() => request?.abort(), Math.min(10000, Math.max(1, deadline - performance.now())));
      try {
        const response = await fetch('/api/bodega/connection-test/result', {
          credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' },
          signal: request.signal,
        });
        if (!response.ok) throw new Error('Result unavailable');
        const answer: unknown = await response.json();
        if (!answer || typeof answer !== 'object' || !('status' in answer)
          || !statuses.includes(answer.status as ResultStatus)) throw new Error('Result unavailable');
        if (!alive) return;
        const status = answer.status as ResultStatus;
        setResult({ status, ...('runId' in answer && isExperimentRunId(answer.runId) ? { runId: answer.runId } : {}) });
        if (status === 'processing' && performance.now() + 2000 < deadline) nextRead = window.setTimeout(() => void read(), 2000);
        else setPolling(false);
      } catch { if (alive) { setFailed(true); setPolling(false); } }
      finally { window.clearTimeout(timeout); }
    };
    void read();
    return () => { alive = false; request?.abort(); window.clearTimeout(nextRead); };
  }, [returned, callbackFailed, revision]);

  React.useEffect(() => {
    if (result?.status !== 'authorized' || failed || returnAttempted.current) return;
    // Click-to-chat navigation is documented; whether the native container closes is a phone test.
    const timer = window.setTimeout(() => {
      returnAttempted.current = true;
      try { window.location.replace(CHAT); } catch { /* The visible chat link remains available. */ }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [result?.status, failed]);

  const title = !returned ? w.opening : failed ? (callbackFailed ? w.failed : w.check) : result ? w[result.status] : w.checking;
  const body = !returned ? w.openingBody : failed ? (callbackFailed ? w.retryBody : w.checkBody)
    : result?.status === 'authorized' ? w.authorizedBody : result?.status === 'processing' ? w.processingBody
      : result?.status === 'pending' ? w.pendingBody
      : result ? w.retryBody : '';
  const needsRestart = callbackFailed || (result && ['cancelled', 'failed', 'expired'].includes(result.status));
  return <main lang={lang} data-testid="direct-connection-experiment" className={css({
    minHeight: '100dvh', boxSizing: 'border-box', width: '100%', backgroundColor: theme.colors.backgroundPrimary,
    color: theme.colors.contentPrimary, fontFamily: theme.typography.ParagraphMedium.fontFamily,
    padding: theme.sizing.scale700, paddingTop: `max(${theme.sizing.scale1000}, env(safe-area-inset-top))`,
    paddingBottom: `max(${theme.sizing.scale800}, env(safe-area-inset-bottom))`,
  })}>
    <div className={css({ width: '100%', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto',
      display: 'grid', gap: theme.sizing.scale800, minWidth: 0 })}>
      <div className={css({ display: 'flex', alignItems: 'center', gap: theme.sizing.scale400 })}>
        <img src="/brand/rocoto-mark.svg" width={32} height={32} alt="" />
        <span className={css({ ...theme.typography.HeadingSmall })}>Rocoto</span>
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" data-testid="direct-connection-result"
        data-status={failed ? 'failed' : result?.status ?? (returned ? 'checking' : 'opening')}>
        <h1 className={css({ ...theme.typography.HeadingLarge, margin: 0, overflowWrap: 'anywhere' })}>{title}</h1>
        {body && <p className={css({ ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary,
          marginBottom: 0, marginTop: theme.sizing.scale600 })}>{body}</p>}
      </div>
      {(!returned || result?.status === 'pending') && <Button $as="a" href={START} data-testid="direct-open-meta"
        overrides={{ BaseButton: { style: { width: '100%', minHeight: '52px', boxSizing: 'border-box' } } }}>{w.open}</Button>}
      {needsRestart && <form method="post" action={RESTART}>
        <Button type="submit" data-testid="direct-restart-meta"
          overrides={{ BaseButton: { style: { width: '100%', minHeight: '52px' } } }}>{w.restart}</Button>
      </form>}
      {!callbackFailed && (failed || (result?.status === 'processing' && !polling)) &&
        <Button type="button" onClick={() => setRevision((value) => value + 1)} disabled={polling}
          data-testid="direct-check-result">{w.check}</Button>}
      <a href={CHAT} data-testid="direct-return-chat" className={css({ ...theme.typography.LabelLarge,
        color: theme.colors.contentPrimary, textAlign: 'center', minHeight: '44px', lineHeight: '24px',
        paddingTop: theme.sizing.scale400, paddingBottom: theme.sizing.scale400, boxSizing: 'border-box',
        ':focus-visible': { outline: `2px solid ${theme.colors.contentPrimary}`, outlineOffset: '4px' },
      })}>{w.return}</a>
      {result?.runId && <p data-testid="direct-test-code" className={css({ ...theme.typography.ParagraphSmall,
        color: theme.colors.contentSecondary, margin: 0 })}>{w.testCode}: {result.runId.slice(-6)}</p>}
    </div>
  </main>;
}
