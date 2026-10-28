import * as React from 'react';
import { useStyletron } from 'baseui';
import { Phone, MessageCircle, UserRound } from 'lucide-react';
import { pageLang } from '../start/words';
import { QuestionScreen, UnderlineInput } from './question';
import { openChat, tap } from './native';

const say = (en: string, es: string) => pageLang() === 'en' ? en : es;
export function authError(error: unknown): string {
  const code = error instanceof Error ? error.message : String(error);
  if (/provider|template|configuration/.test(code)) return say('Verification is being prepared. Your place is saved in WhatsApp.', 'Estamos preparando la verificación. Tu puesto está guardado en WhatsApp.');
  if (/rate|limit|cooldown/.test(code)) return say('Wait a moment, then request another code.', 'Espera un momento y pide otro código.');
  if (/expired|attempt_unavailable/.test(code)) return say('Request a fresh code to continue.', 'Pide un código nuevo para continuar.');
  if (/refused|invalid|code/.test(code)) return say('Check the six digits in your WhatsApp message.', 'Revisa los seis dígitos del mensaje de WhatsApp.');
  return say('Try again to continue.', 'Inténtalo de nuevo para continuar.');
}

export function PhoneEntry({ initial = '', start, back }: { initial?: string; start: (phone: string) => Promise<void>; back: () => void }) {
  const [css, theme] = useStyletron();
  const [prefix, setPrefix] = React.useState('+51');
  const [number, setNumber] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const digits = number.replace(/\D/g, '');
  // UK national format carries a trunk 0; E.164 drops it after the +44 country code.
  const national = prefix === '+44' ? digits.replace(/^0/, '') : digits;
  const phone = number.trim().startsWith('+') ? `+${digits}` : `${prefix}${national}`;
  const ready = /^\+[1-9]\d{7,14}$/.test(phone);
  const send = async () => {
    if (!ready || busy) return;
    setBusy(true); setError('');
    try { await start(phone); }
    catch (caught) { setError(authError(caught)); }
    finally { setBusy(false); }
  };
  return <QuestionScreen testId="mobile-phone" title={say('What’s your WhatsApp number?', '¿Cuál es tu número de WhatsApp?')}
    icon={<Phone size={24} aria-hidden />} back={back} next={() => { void send(); }} disabled={!ready} busy={busy}
    help={error ? <button type="button" onClick={() => { void openChat(); }} className={css({ ...theme.typography.LabelSmall,
      color: theme.colors.contentPrimary, background: 'none', border: 0, padding: '12px 0', textDecoration: 'underline', cursor: 'pointer' })}>{say('Talk to Rocoto', 'Hablar con Rocoto')}</button> : undefined}>
    <div className={css({ display: 'flex', gap: theme.sizing.scale500, minWidth: 0 })}>
      <select aria-label={say('Country code', 'Código de país')} value={prefix} onChange={(event) => setPrefix(event.target.value)}
        className={css({ ...theme.typography.LabelLarge, maxWidth: '112px', minHeight: '56px', border: 0,
          borderBottom: `1px solid ${theme.colors.contentPrimary}`, borderRadius: 0, backgroundColor: 'transparent', color: theme.colors.contentPrimary })}>
        <option value="+51">🇵🇪 +51</option><option value="+44">🇬🇧 +44</option><option value="+34">🇪🇸 +34</option><option value="+1">🇺🇸 +1</option>
      </select>
      <UnderlineInput autoFocus type="tel" inputMode="tel" autoComplete="tel-national" name="phone" aria-label={say('Phone number', 'Número de teléfono')}
        value={number} onChange={(event) => setNumber(event.target.value)} maxLength={22} enterKeyHint="next" />
    </div>
    <p className={css({ ...theme.typography.ParagraphSmall, margin: 0, color: theme.colors.contentSecondary })}>
      {say('Use the number you messaged Rocoto from. Your requested WhatsApp code fills automatically when available.',
        'Usa el número con el que escribiste a Rocoto. El código que pides por WhatsApp se completa automáticamente cuando está disponible.')}
    </p>
    {error && <p role="alert" className={css({ ...theme.typography.ParagraphSmall, margin: 0 })}>{error}</p>}
  </QuestionScreen>;
}

export function CodeEntry({ phone, expiresAt, verify, resend, edit, externalError = '' }: { phone: string; expiresAt: number;
  verify: (code: string) => Promise<void>; resend: () => Promise<void>; edit: () => void; externalError?: string }) {
  const [css, theme] = useStyletron();
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [now, setNow] = React.useState(Date.now());
  const submitted = React.useRef('');
  React.useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const submit = async (digits = code) => {
    if (busy || digits.length !== 6) return;
    setBusy(true); setError(''); submitted.current = digits;
    try { await verify(digits); }
    catch (caught) { setError(authError(caught)); }
    finally { setBusy(false); }
  };
  const change = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6 && digits !== submitted.current) void submit(digits);
  };
  const action = css({ ...theme.typography.LabelSmall, color: theme.colors.contentPrimary, background: 'none',
    border: 0, padding: '12px 0', textDecoration: 'underline', cursor: 'pointer' });
  // A local cooldown guides the UI; the server independently enforces send and guess limits.
  const [resendAt, setResendAt] = React.useState(expiresAt * 1000 <= Date.now() ? 0 : Date.now() + 60000);
  const repeat = async () => {
    if (busy || now < resendAt) return;
    setBusy(true); setError('');
    try { await resend(); setCode(''); submitted.current = ''; setResendAt(Date.now() + 60000); }
    catch (caught) { setError(authError(caught)); }
    finally { setBusy(false); }
  };
  return <QuestionScreen testId="mobile-otp" title={say('Check your WhatsApp', 'Revisa tu WhatsApp')}
    step={1} icon={<MessageCircle size={24} aria-hidden />} back={edit} next={() => { void submit(); }} disabled={code.length !== 6} busy={busy}
    help={<button type="button" className={action} disabled={busy || now < resendAt} onClick={() => { void repeat(); }}>
      {now < resendAt ? say(`Send again in ${Math.ceil((resendAt - now) / 1000)}s`, `Enviar de nuevo en ${Math.ceil((resendAt - now) / 1000)}s`) : say('Send another code', 'Enviar otro código')}
    </button>}>
    <p className={css({ ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary, margin: 0 })}>
      {phone}{' · '}<button type="button" className={action} onClick={edit}>{say('Edit', 'Editar')}</button>
    </p>
    <div className={css({ position: 'relative', height: '68px' })}>
      <div aria-hidden className={css({ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', height: '100%' })}>
        {Array.from({ length: 6 }, (_, i) => <span key={i} className={css({ ...theme.typography.HeadingLarge, display: 'grid', placeItems: 'center',
          borderBottom: `${i === code.length ? 2 : 1}px solid ${theme.colors.contentPrimary}` })}>{code[i] || ''}</span>)}
      </div>
      <input autoFocus autoComplete="one-time-code" inputMode="numeric" type="text" name="otp" aria-label={say('Six-digit code', 'Código de seis dígitos')}
        value={code} onChange={(event) => change(event.target.value)} maxLength={16} enterKeyHint="done"
        className={css({ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'text' })} />
    </div>
    <p role={error ? 'alert' : 'status'} className={css({ ...theme.typography.ParagraphSmall, margin: 0, color: theme.colors.contentSecondary })}>
      {error || (externalError ? authError(externalError) : '') || (expiresAt * 1000 <= now ? say('Request a fresh code to continue.', 'Pide un código nuevo para continuar.')
        : say('Your code can fill automatically. You can also paste the six digits.', 'Tu código puede completarse automáticamente. También puedes pegar los seis dígitos.'))}
    </p>
  </QuestionScreen>;
}

export function PersonName({ initial, save }: { initial: string; save: (personName: string) => Promise<void> }) {
  const [css, theme] = useStyletron();
  const [name, setName] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const next = async () => {
    if (busy || !name.trim()) return;
    setBusy(true); setError('');
    try { await save(name.trim()); await tap('selection'); }
    catch (caught) { setError(authError(caught)); }
    finally { setBusy(false); }
  };
  return <QuestionScreen testId="mobile-person" title={say('What’s your name?', '¿Cómo te llamas?')} icon={<UserRound size={24} aria-hidden />}
    step={2} next={() => { void next(); }} disabled={!name.trim()} busy={busy}>
    <UnderlineInput autoFocus autoComplete="given-name" name="personName" value={name} onChange={(event) => setName(event.target.value)}
      aria-label={say('Your name', 'Tu nombre')} maxLength={80} enterKeyHint="next" />
    {error && <p role="alert" className={css({ ...theme.typography.ParagraphSmall, margin: 0 })}>{error}</p>}
  </QuestionScreen>;
}
