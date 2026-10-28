import publicSettings from '../../shop-config.json';
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button } from 'baseui/button';
import { classifySession, maskedSessionPhone, sessionsMismatch, type SessionCheck } from './session-experiment-state';

const words = {
  en: {
    title: 'Saved browser sessions', app: 'Rocoto app session', proof: 'WhatsApp connection session',
    checking: 'Checking the saved session', recognized: 'Session recognized', sign_in: 'Sign-in needed',
    unknown: 'Check this session again', source: 'Identity source', cookie: 'Existing browser cookie',
    identity: 'Your verified browser session identifies the account.', refresh: 'Check again',
    mismatch: 'These sessions belong to different phone numbers.', return: 'Return to Rocoto on WhatsApp',
  },
  es: {
    title: 'Sesiones guardadas del navegador', app: 'Sesión de Rocoto', proof: 'Sesión de conexión de WhatsApp',
    checking: 'Comprobando la sesión guardada', recognized: 'Sesión reconocida', sign_in: 'Inicio de sesión pendiente',
    unknown: 'Vuelve a comprobar esta sesión', source: 'Origen de la identidad', cookie: 'Cookie guardada del navegador',
    identity: 'Tu sesión verificada del navegador identifica la cuenta.', refresh: 'Comprobar de nuevo',
    mismatch: 'Estas sesiones pertenecen a números distintos.', return: 'Volver a Rocoto en WhatsApp',
  },
};

/** Reads existing account cookies only. Opening this page creates or reconnects no session. */
export default function SessionExperiment() {
  const [css, theme] = useStyletron();
  const lang = new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'es';
  const w = words[lang];
  const [revision, setRevision] = React.useState(0);
  const [checks, setChecks] = React.useState<{ bodega: SessionCheck | null; proof: SessionCheck | null }>({ bodega: null, proof: null });
  React.useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setChecks({ bodega: null, proof: null });
    const read = async (source: 'bodega' | 'proof', path: string) => {
      let next: SessionCheck = { status: 'unknown' };
      try {
        const response = await fetch(path, { method: 'GET', credentials: 'same-origin', cache: 'no-store',
          headers: { Accept: 'application/json' }, signal: controller.signal });
        next = classifySession(source, response.status, await response.json().catch(() => null));
      } catch { /* Transport errors cannot establish whether a saved session exists. */ }
      if (alive) setChecks((current) => ({ ...current, [source]: next }));
    };
    void Promise.allSettled([read('bodega', '/api/bodega/session'), read('proof', '/api/proof/state')])
      .then(() => window.clearTimeout(timeout));
    return () => { alive = false; controller.abort(); window.clearTimeout(timeout); };
  }, [revision]);
  const mismatch = checks.bodega && checks.proof && sessionsMismatch(checks.bodega, checks.proof);
  const paragraph = { ...theme.typography.ParagraphMedium, marginTop: '0px', marginBottom: '0px' };
  return <main lang={lang} data-testid="session-experiment" className={css({ minHeight: '100dvh',
    boxSizing: 'border-box', width: '100%', backgroundColor: theme.colors.backgroundPrimary,
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
      <h1 className={css({ ...theme.typography.HeadingLarge, margin: 0, overflowWrap: 'anywhere' })}>{w.title}</h1>
      <div role="status" aria-live="polite" aria-atomic="true" className={css({ display: 'grid', gap: theme.sizing.scale700 })}>
        {(['bodega', 'proof'] as const).map((source) => <section key={source} data-testid={`session-${source}`}
          data-status={checks[source]?.status ?? 'checking'} className={css({ display: 'grid', gap: theme.sizing.scale300 })}>
          <h2 className={css({ ...theme.typography.LabelLarge, margin: 0 })}>{source === 'bodega' ? w.app : w.proof}</h2>
          <p className={css({ ...paragraph, color: theme.colors.contentSecondary })}>
            {checks[source] ? w[checks[source].status] : w.checking}
            {checks[source] && maskedSessionPhone(checks[source]) ? ` · ${maskedSessionPhone(checks[source])}` : ''}
          </p>
        </section>)}
        {mismatch && <p data-testid="session-mismatch" className={css(paragraph)}>{w.mismatch}</p>}
      </div>
      <section className={css({ display: 'grid', gap: theme.sizing.scale300 })}>
        <h2 className={css({ ...theme.typography.LabelLarge, margin: 0 })}>{w.source}</h2>
        <p className={css(paragraph)}>{w.cookie}</p>
        <p className={css({ ...paragraph, color: theme.colors.contentSecondary })}>{w.identity}</p>
      </section>
      <Button onClick={() => setRevision((value) => value + 1)} disabled={!checks.bodega || !checks.proof}
        data-testid="session-refresh" overrides={{ BaseButton: { style: { width: '100%', minHeight: '52px' } } }}>{w.refresh}</Button>
      <a href={publicSettings.botChat || '#/admin/connections'} className={css({ ...theme.typography.LabelLarge,
        color: theme.colors.contentPrimary, textAlign: 'center', minHeight: '44px', lineHeight: '24px',
        paddingTop: theme.sizing.scale400, paddingBottom: theme.sizing.scale400, boxSizing: 'border-box',
        ':focus-visible': { outline: `2px solid ${theme.colors.contentPrimary}`, outlineOffset: '4px' },
      })}>{w.return}</a>
    </div>
  </main>;
}
