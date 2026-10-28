import publicSettings from '../../../shop-config.json';
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Check } from 'lucide-react';
import { WhatsAppWalk } from '../whatsapp-connection';
import { bodegaApi, openFromConnection, readSession } from './session';
import { WalkAct, WalkScreen } from './walk';
import { useWords } from './words';

/** The callback carries one opaque, attempt-bound redemption code; the app joins it to its held verifier. */
export function MobileConnect({ attempt }: { attempt: string }) {
  const [css, theme] = useStyletron();
  const { lang } = useWords();
  const [phone, setPhone] = React.useState('');
  const [checking, setChecking] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [returnUrl, setReturnUrl] = React.useState('');
  /* An approval code is one-use. Keep the locally generated callback for this browser document so
     a return-link retry never asks the server to mint another one. It deliberately stays out of
     storage: the native app already holds the verifier and the code belongs only in the App Link. */
  const approvedReturn = React.useRef('');
  const approving = React.useRef(false);
  const finishing = React.useRef(false);
  const finishConnection = async () => {
    if (finishing.current) return;
    finishing.current = true;
    try {
      const result = await openFromConnection();
      if (!result.ok || !result.value.signedIn || !result.value.phone) { finishing.current = false; setFailed(true); return; }
      setPhone(result.value.phone);
      /* This is a fresh, verified Meta completion. The saved-browser-session road below still waits
         for its owner to press Open Rocoto and review the number shown on this page. */
      void approve();
    } catch {
      finishing.current = false;
      setFailed(true);
    }
  };
  React.useEffect(() => {
    let live = true;
    void readSession().then((result) => {
      if (live) {
        if (result.ok && result.value.signedIn && result.value.phone && result.value.connection !== false) {
          setPhone(result.value.phone);
        }
        setChecking(false);
      }
    }).catch(() => { if (live) { setChecking(false); setFailed(true); } });
    return () => { live = false; };
  }, []);
  const approve = async () => {
    const knownReturn = approvedReturn.current || returnUrl;
    if (knownReturn) { window.location.assign(knownReturn); return; }
    if (approving.current) return;
    approving.current = true;
    setBusy(true); setFailed(false);
    try {
      const result = await bodegaApi<{ code: string }>('/mobile/session/approve', { attempt, approve: true });
      if (!result.ok) {
        setFailed(true);
        if (result.code.includes('connection') || result.code.includes('session')) setPhone('');
        return;
      }
      if (!/^[A-Za-z0-9_-]{43}$/.test(result.value.code)) { setFailed(true); return; }
      const callback = `${publicSettings.nativeOrigin}/bodega-app/auth?attempt=${encodeURIComponent(attempt)}&code=${encodeURIComponent(result.value.code)}`;
      approvedReturn.current = callback;
      setReturnUrl(callback);
      /* Android opens this verified App Link directly. If it keeps the browser document instead,
         the visible Open Rocoto action below reuses this exact callback. */
      window.location.assign(callback);
    } catch {
      setFailed(true);
    } finally {
      approving.current = false;
      setBusy(false);
    }
  };
  return <WalkScreen testId="mobile-browser-connect" step="connect" fill={!phone}
    stage={phone ? 'paper' : undefined}
    title={phone ? (lang === 'es' ? 'Continúa en Rocoto' : 'Continue in Rocoto') : undefined}
    sentence={phone || undefined}
    visual={phone ? <div className={css({ display: 'grid', placeItems: 'center', minHeight: '220px' })}><Check size={72} aria-hidden /></div> : undefined}
    note={failed ? <span role="alert">{lang === 'es' ? 'Vuelve a intentarlo para continuar.' : 'Try again to continue.'}</span> : undefined}
    act={phone ? <WalkAct testId="mobile-authorize-return" isLoading={busy} onClick={() => { void approve(); }}>
      {lang === 'es' ? 'Abrir Rocoto' : 'Open Rocoto'}
    </WalkAct> : undefined}>
    {checking ? <p role="status" className={css(theme.typography.ParagraphMedium)}>{lang === 'es' ? 'Cargando tu cuenta…' : 'Loading your account…'}</p>
      : !phone && <WhatsAppWalk lang={lang} businessConfirmed autoComplete handoffMode
        onComplete={() => { void finishConnection(); }} />}
  </WalkScreen>;
}
