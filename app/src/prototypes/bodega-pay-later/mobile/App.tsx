import * as React from 'react';
import { App as NativeApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useStyletron } from 'baseui';
import { Check, Store } from 'lucide-react';
import { Spinner, SIZE as SPINNER_SIZE } from 'baseui/spinner';
import StartAddress from '../start/address';
import whatsappBusinessLogo from '../../cedar/connections/assets/whatsapp-business.webp';
import whatsappGlyph from '../../cedar/connections/assets/whatsapp-glyph.png';
import { pageLang } from '../start/words';
import { openBusinessAppStore, tap } from './native';
import { installedWhatsAppApps, useMobileSession } from './session';
import { MobileScreen } from './screen';
import { nativeWalkStep, readNativeWalkStep, readWhatsAppChoice, saveNativeWalkStep, saveWhatsAppChoice, type NativeWalkStep, type WhatsAppChoice } from './state';
import { readDraft, canonicalBusinessKind, type Business } from '../start/joining';
import { WaitlistHome } from './waitlist';
import { CodeEntry, PersonName, PhoneEntry } from './phone';
import { BusinessProfile } from './profile';

const say = (en: string, es: string): string => pageLang() === 'en' ? en : es;

const COPY = {
  welcome: { action: 'Get started' },
  choice: {
    title: say('Which WhatsApp do you use?', '¿Qué WhatsApp usas?'), personal: 'WhatsApp', business: 'WhatsApp Business',
  },
  install: {
    title: say('Install WhatsApp Business', 'Instala WhatsApp Business'),
    body: say('Move your chats to WhatsApp Business, then return to Rocoto.', 'Lleva tus chats a WhatsApp Business y vuelve a Rocoto.'),
    store: say('Open Google Play', 'Abrir Google Play'),
    ready: say('I installed WhatsApp Business', 'Ya instalé WhatsApp Business'),
    finishing: say('Finish installing WhatsApp Business in Google Play, then return to Rocoto.', 'Termina de instalar WhatsApp Business en Google Play y vuelve a Rocoto.'),
  },
  meta: { title: say('Connect your WhatsApp', 'Conecta tu WhatsApp'), body: say('Complete Meta’s steps and return here.', 'Completa los pasos de Meta y vuelve aquí.'), action: say('Open Meta', 'Abrir Meta') },
  complete: {
    savingTitle: say('Saving your business', 'Guardando tu negocio'),
    retryTitle: say('Save your business', 'Guarda tu negocio'),
  },
  loading: say('Preparing Rocoto…', 'Preparando Rocoto…'), retry: say('Try again', 'Intentar otra vez'),
};

function readableError(code: string): string {
  if (code.includes('meta')) return say('Try connecting Meta again.', 'La conexión con Meta necesita otro intento.');
  return say('Try again to continue.', 'Inténtalo de nuevo para continuar.');
}

function Visual({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const [css, theme] = useStyletron();
  return <div className={css({ display: 'grid', height: '100%', minHeight: 0, placeItems: 'center', padding: theme.sizing.scale700,
    color: dark ? theme.colors.contentInversePrimary : theme.colors.contentPrimary,
  })}>{children}</div>;
}

function MetaVisual() {
  const [css, theme] = useStyletron();
  return <Visual dark><div className={css({ display: 'grid', placeItems: 'center' })}>
    <img src={whatsappBusinessLogo} width="84" height="84" alt="WhatsApp Business" className={css({ borderRadius: theme.borders.radius400 })} />
  </div></Visual>;
}

/** Width fixes the scene's scale; the lower edge stays anchored as the viewport grows.
 * The tile strip continues the approved artwork above its existing wall on extra-tall phones. */
function WelcomeArtwork() {
  const [css] = useStyletron();
  const tileId = React.useId().replace(/:/g, '');
  const artwork = '/bodega-artwork/welcome-fish-tiles.webp';
  return <svg aria-hidden viewBox="0 0 836 2541" className={css({
    position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'auto', display: 'block', filter: 'brightness(.78)',
  })}>
    <defs><pattern id={tileId} patternUnits="userSpaceOnUse" width="836" height="66">
      <image href={artwork} width="836" height="1881" y="-61" />
    </pattern></defs>
    <rect width="836" height="660" fill={`url(#${tileId})`} />
    <image href={artwork} width="836" height="1881" y="660" />
  </svg>;
}

/** Old native hashes resolve from the retained facts; completion still has to pass the server. */
function requiredNativeStep(profile: Business | null): 'business' | 'address' | 'done' {
  const draft = readDraft();
  const kind = canonicalBusinessKind(profile?.kind) || draft.kind;
  const name = profile?.name?.trim() || draft.name.trim();
  const address = profile?.address ?? draft.address;
  if (!kind || !name) return 'business';
  return address?.text && address.placeId && Number.isFinite(address.lat) && Number.isFinite(address.lng) ? 'done' : 'address';
}

function WalkRouter({ complete, profile, save, connection, connect }: { complete: () => Promise<void>; profile: Business | null;
  save: (patch: Partial<Business>) => Promise<void>; connection: boolean; connect: React.ReactNode }) {
  const [hash, setHash] = React.useState(() => window.location.hash);
  React.useEffect(() => {
    if (!/^#\/start\//.test(window.location.hash)) window.location.hash = `#/start/${requiredNativeStep(profile) === 'done' ? 'done' : readNativeWalkStep()}`;
    saveNativeWalkStep(nativeWalkStep());
    const change = () => { const next = nativeWalkStep(); saveNativeWalkStep(next); setHash(window.location.hash); };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const step = nativeWalkStep(hash);
  const required = requiredNativeStep(profile);
  if (step === 'waitlist' || step === 'orders' || step === 'owed' || step === 'referrals') {
    return <WalkRedirect to={`#/start/${required}`} />;
  }
  if (step === 'address' && required === 'business') return <WalkRedirect to="#/start/business" />;
  if (step === 'done' && required !== 'done') return <WalkRedirect to={`#/start/${required}`} />;
  if (step === 'done') return connection ? <NativeCompletion complete={complete} /> : <>{connect}</>;
  return step === 'address' ? <StartAddress /> : <BusinessProfile initial={{ kind: profile?.kind ?? null, name: profile?.name ?? '' }}
    save={save} complete={() => { window.location.hash = '#/start/address'; }} />;
}

function WalkRedirect({ to }: { to: string }) {
  React.useEffect(() => { window.location.replace(to); }, [to]);
  return null;
}

function nativeWalkBack(step: NativeWalkStep): void {
  if (step === 'business') { window.dispatchEvent(new Event('rocoto:profile-back')); return; }
  const previous: Partial<Record<NativeWalkStep, NativeWalkStep>> = {
    address: 'business', done: 'address',
  };
  if (previous[step]) window.location.hash = `#/start/${previous[step]}`;
}

function NativeCompletion({ complete }: { complete: () => Promise<void> }) {
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState('');
  const started = React.useRef(false);
  const finish = async () => {
    if (busy) return;
    setBusy(true); setFailed('');
    try { await complete(); await tap('confirm'); }
    catch (error) { setFailed(readableError(error instanceof Error ? error.message : '')); await tap('reject'); }
    finally { setBusy(false); }
  };
  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    void finish();
  }, []);
  if (!failed) return <LoadingScreen label={COPY.complete.savingTitle} />;
  return <MobileScreen key="complete" title={COPY.complete.retryTitle}
    action={() => { void finish(); }} actionLabel={COPY.retry} disabled={busy}>
    <p role="alert">{failed}</p>
  </MobileScreen>;
}

function LoadingScreen({ label = COPY.loading }: { label?: string }) {
  const [css, theme] = useStyletron();
  return <main role="status" aria-live="polite" className={css({ height: '100dvh', display: 'grid', placeItems: 'center',
    padding: theme.sizing.scale600, backgroundColor: theme.colors.backgroundPrimary, color: theme.colors.contentPrimary,
  })}><span className={css(theme.typography.LabelLarge)}>{label}</span></main>;
}

function ConnectionProgress({ complete = false, resume, error }: { complete?: boolean; resume?: () => void; error?: string }) {
  const [css, theme] = useStyletron();
  return <main data-testid={complete ? 'mobile-connection-complete' : 'mobile-connection-progress'} className={css({
    minHeight: '100dvh', display: 'grid', placeItems: 'center', boxSizing: 'border-box', padding: theme.sizing.scale700,
    backgroundColor: theme.colors.backgroundPrimary, color: theme.colors.contentPrimary,
  })}>
    <div className={css({ display: 'grid', justifyItems: 'center', gap: theme.sizing.scale600, textAlign: 'center', maxWidth: '360px' })}>
      {complete ? <Check size={56} strokeWidth={2} aria-hidden /> : <Spinner $size={SPINNER_SIZE.large} $color={theme.colors.contentPrimary} />}
      <h1 role="status" aria-live="polite" className={css({ ...theme.typography.HeadingMedium, margin: 0 })}>
        {complete ? say('WhatsApp connected', 'WhatsApp conectado') : say('Connecting', 'Conectando')}
      </h1>
      {!complete && resume && <button type="button" onClick={resume} data-testid="mobile-resume-meta" className={css({
        ...theme.typography.LabelLarge, minHeight: '48px', padding: `${theme.sizing.scale400} ${theme.sizing.scale600}`,
        border: 0, borderRadius: theme.borders.radius400, cursor: 'pointer',
        backgroundColor: theme.colors.contentPrimary, color: theme.colors.contentInversePrimary,
      })}>{say('Continue in Meta', 'Continuar en Meta')}</button>}
      {error && <p role="alert" className={css({ ...theme.typography.ParagraphSmall, margin: 0 })}>{error}</p>}
    </div>
  </main>;
}

function WhatsAppChoice({ choice, choose }: { choice: WhatsAppChoice | null; choose: (choice: WhatsAppChoice) => void }) {
  const [css, theme] = useStyletron();
  const option = (value: WhatsAppChoice, title: string, icon: React.ReactNode) => <button type="button" key={value}
    data-testid={`whatsapp-choice-${value}`} aria-pressed={choice === value} onClick={() => choose(value)} className={css({ width: '100%', display: 'grid', gridTemplateColumns: '48px 1fr',
      gap: theme.sizing.scale400, textAlign: 'left', alignItems: 'center', borderRadius: theme.borders.radius400,
      border: `2px solid ${theme.colors.contentPrimary}`,
      backgroundColor: choice === value ? theme.colors.contentPrimary : theme.colors.backgroundPrimary,
      color: choice === value ? theme.colors.contentInversePrimary : theme.colors.contentPrimary,
      padding: theme.sizing.scale500, cursor: 'pointer', minHeight: '76px',
      ':focus-visible': { outline: `3px solid ${theme.colors.contentPrimary}`, outlineOffset: '3px' },
    })}>
    {icon}<strong className={css(theme.typography.LabelLarge)}>{title}</strong>
  </button>;
  return <div className={css({ display: 'grid', gap: theme.sizing.scale300 })}>
    {option('whatsapp', COPY.choice.personal, <img src={whatsappGlyph} width="32" height="32" alt="" />)}
    {option('business', COPY.choice.business, <img src={whatsappBusinessLogo} width="32" height="32" alt="" className={css({ borderRadius: theme.borders.radius200 })} />)}
  </div>;
}

export default function MobileApp() {
  const [css, theme] = useStyletron();
  const session = useMobileSession();
  const [choice, setChoice] = React.useState<WhatsAppChoice | null>(() => readWhatsAppChoice());
  const [openingMeta, setOpeningMeta] = React.useState(false);
  const [localError, setLocalError] = React.useState('');
  const [showChoice, setShowChoice] = React.useState(false);
  const [apps, setApps] = React.useState<{ business: boolean; personal: boolean } | null>(null);
  const [installBusiness, setInstallBusiness] = React.useState(false);
  const [storeOpened, setStoreOpened] = React.useState(false);
  const [installNote, setInstallNote] = React.useState('');
  const installContinuing = React.useRef(false);
  React.useEffect(() => { void installedWhatsAppApps().then(setApps).catch(() => setApps(null)); }, []);

  const phaseBack = React.useCallback(() => {
    if (installBusiness) { setInstallBusiness(false); setInstallNote(''); return; }
    if (session.status === 'onboarding') { nativeWalkBack(nativeWalkStep()); return; }
    if (session.status === 'otp-pending') { void session.editPhone(); setShowChoice(true); return; }
    if (session.status === 'meta-pending' || session.status === 'meta-complete') return;
    if (session.status === 'authenticated' || session.status === 'signed-out') { setShowChoice(false); return; }
    void NativeApp.exitApp();
  }, [session.status, installBusiness]);

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let live = true;
    const handle = NativeApp.addListener('backButton', () => {
      if (!live) return;
      phaseBack();
    });
    return () => { live = false; void handle.then((listener) => listener.remove()); };
  }, [phaseBack]);

  const openMeta = async (selected: WhatsAppChoice | null = choice) => {
    if ((!selected && session.status !== 'meta-pending') || openingMeta) return;
    if (selected) { setChoice(selected); saveWhatsAppChoice(selected); }
    setOpeningMeta(true); setLocalError('');
    try { await session.openMeta(); await tap('confirm'); }
    catch (error) { setLocalError(readableError(error instanceof Error ? error.message : '')); await tap('reject'); }
    finally { setOpeningMeta(false); }
  };
  const openStore = async () => {
    setStoreOpened(true); setInstallNote('');
    try { await openBusinessAppStore(); }
    catch { setStoreOpened(false); setInstallNote(COPY.install.finishing); }
  };
  const finishInstall = async () => {
    if (installContinuing.current) return;
    setInstallNote('');
    try {
      const detected = await installedWhatsAppApps();
      setApps(detected);
      if (detected.business) {
        installContinuing.current = true; setInstallBusiness(false);
        try { await openMeta('whatsapp'); } finally { installContinuing.current = false; }
        return;
      }
    } catch { /* The explicit store action remains available. */ }
    setInstallNote(COPY.install.finishing);
  };
  React.useEffect(() => {
    if (!installBusiness || !Capacitor.isNativePlatform()) return undefined;
    let live = true;
    const handle = NativeApp.addListener('appStateChange', ({ isActive }) => {
      if (!live || !isActive) return;
      void installedWhatsAppApps().then((detected) => {
        if (!live) return;
        setApps(detected);
        if (detected.business && !installContinuing.current) {
          installContinuing.current = true; setInstallBusiness(false);
          void openMeta('whatsapp').finally(() => { installContinuing.current = false; });
        }
      }).catch(() => undefined);
    });
    return () => { live = false; void handle.then((listener) => listener.remove()); };
  }, [installBusiness]);
  const chooseWhatsApp = async (next: WhatsAppChoice) => {
    if (openingMeta) return;
    setChoice(next); saveWhatsAppChoice(next); void tap('selection');
    if (next === 'business') { await openMeta(next); return; }
    try {
      const detected = await installedWhatsAppApps();
      setApps(detected);
      if (detected.business) { await openMeta(next); return; }
    } catch { /* The install screen remains the safe route. */ }
    installContinuing.current = false;
    setInstallBusiness(true);
    await openStore();
  };
  const sessionError = session.error ? readableError(session.error) : '';

  const choiceBody = <>
    <WhatsAppChoice choice={choice} choose={(next) => { void chooseWhatsApp(next); }} />
    {(localError || sessionError) && <p role="alert">{localError || sessionError}</p>}
  </>;

  if (session.status === 'loading') return <LoadingScreen />;
  if (session.status === 'error') return <MobileScreen dark visual={<MetaVisual />} title={say('Return to Rocoto', 'Vuelve a Rocoto')}
    sentence={readableError(session.error)} action={() => { void session.refresh(); }} actionLabel={COPY.retry}
    secondary={session.error === 'bodega_mobile_storage' ? () => { void session.restartSignIn().catch(() => undefined); } : undefined}
    secondaryLabel={pageLang() === 'es' ? 'Volver a iniciar sesión' : 'Sign in again'} />;
  if (session.status === 'signed-out' && !showChoice) return <MobileScreen key="welcome" welcome visual={<WelcomeArtwork />}
    brand={<div data-testid="mobile-welcome-logo" aria-label="Rocoto" className={css({
      display: 'flex', alignItems: 'center', gap: theme.sizing.scale100, color: theme.colors.contentPrimary,
    })}>
      <span aria-hidden className={css({ display: 'block', width: 'clamp(42px, 12vw, 50px)', height: 'clamp(60px, 18vw, 76px)',
        backgroundColor: theme.colors.contentPrimary,
        maskImage: 'url(/brand/rocoto-mark.svg)', WebkitMaskImage: 'url(/brand/rocoto-mark.svg)',
        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center',
        maskSize: 'auto 100%', WebkitMaskSize: 'auto 100%',
      })} />
      <span aria-hidden className={css({ ...theme.typography.HeadingLarge, fontSize: 'clamp(40px, 13vw, 56px)',
        fontFamily: (theme as unknown as { brand?: { wordmarkFont?: string } }).brand?.wordmarkFont ?? theme.typography.HeadingLarge.fontFamily,
        fontWeight: 500, lineHeight: 1, letterSpacing: '-0.04em',
      })}>Rocoto</span>
    </div>}
    action={() => { setShowChoice(true); void tap('selection'); }} actionLabel={COPY.welcome.action} />;
  if (installBusiness) return <MobileScreen key="install-business"
    title={COPY.install.title} sentence={COPY.install.body} back={phaseBack} backLabel={say('Back', 'Volver')}
    action={() => { if (storeOpened) void finishInstall(); else void openStore(); }} actionLabel={storeOpened ? COPY.install.ready : COPY.install.store}
    secondary={storeOpened ? () => { void openStore(); } : undefined} secondaryLabel={COPY.install.store}>
    <div data-testid="whatsapp-install">
      {installNote && <p data-testid="whatsapp-install-status" role="status" className={css({ ...theme.typography.ParagraphSmall, margin: 0, color: theme.colors.contentSecondary })}>{installNote}</p>}
    </div>
  </MobileScreen>;
  if (session.status === 'signed-out') return <PhoneEntry initial={session.phone} start={session.startOtp} back={() => setShowChoice(false)} />;
  if (session.status === 'otp-pending') return <CodeEntry phone={session.phone} expiresAt={session.otpExpiresAt}
    externalError={session.error} verify={session.verifyOtp} resend={() => session.startOtp(session.phone)} edit={() => { setShowChoice(true); void session.editPhone(); }} />;
  if (session.status === 'meta-complete') return <ConnectionProgress complete />;
  if (session.status === 'meta-pending') return <ConnectionProgress resume={openingMeta ? undefined : () => { void openMeta(); }} error={localError || sessionError} />;
  if ((session.status === 'onboarding' || session.status === 'waitlist') && !session.profile?.personName) return <PersonName initial=""
    save={(personName) => session.saveProfile({ personName })} />;
  if (session.status === 'onboarding') return <WalkRouter complete={session.completeOnboarding} profile={session.profile} save={session.saveProfile}
    connection={session.connection} connect={<MobileScreen title={COPY.choice.title} back={phaseBack} backLabel={say('Back', 'Volver')}>
      {apps?.business && !apps.personal ? <WhatsAppChoice choice="business" choose={(next) => { void chooseWhatsApp(next); }} /> : choiceBody}
    </MobileScreen>} />;
  if (session.status === 'waitlist' && session.waitlist) return <WaitlistHome profile={session.profile} waitlist={session.waitlist} phone={session.phone}
    switchAccount={() => { setShowChoice(false); void session.logout(); }} />;
  return <MobileScreen dark visual={<Visual dark><Store size={72} strokeWidth={1.2} aria-hidden /></Visual>} title="Rocoto"
    sentence="Estamos preparando tu lista de espera." action={() => { void session.refresh(); }} actionLabel={COPY.retry} />;
}
