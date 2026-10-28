import * as React from 'react';
import { useStyletron } from 'baseui';
import { Browser } from '@capacitor/browser';
import type { Business, Waitlist } from '../start/joining';
import { Pass } from '../start/pass';
import { handOver, type Handed } from '../start/share';
import { pageLang } from '../start/words';
import { openChat, tap } from './native';
import { MobileScreen } from './screen';
import { EARLY_OFFER, nativeInvitation } from './invitation';

export function WaitlistHome({ profile, waitlist, phone, switchAccount }: {
  profile: Business | null; waitlist: Waitlist; phone: string; switchAccount: () => void;
}) {
  const [css, theme] = useStyletron();
  const lang = pageLang(waitlist.language ?? '');
  const say = (en: string, es: string) => lang === 'en' ? en : es;
  const offer = EARLY_OFFER[lang];
  const invitation = nativeInvitation(lang, waitlist.referralUrl);
  const [handed, setHanded] = React.useState<Handed>('');
  const share = async () => {
    const result = await handOver({ title: say('Join me on Rocoto', 'Entra a Rocoto conmigo'), text: invitation, url: waitlist.referralUrl });
    setHanded(result); await tap('selection');
  };
  return <MobileScreen key="home" dark visualHeight="280px" visual={<div className={css({ display: 'grid', placeItems: 'center', height: '100%', minHeight: 0 })}>
    <Pass name={profile?.name || say('Your business', 'Tu negocio')} kind={profile?.kind ?? null}
      address="" place={waitlist.place} reference="" lang={lang} complete land count testId="mobile-waitlist-pass" />
  </div>}
    title={offer.title} action={() => { void share(); }} actionLabel={say('Invite a business', 'Invitar a un negocio')}
    secondary={() => { void openChat(); }} secondaryLabel={say('Talk to Rocoto', 'Hablar con Rocoto')}>
    <details className={css({ ...theme.typography.ParagraphSmall })}>
      <summary className={css({ cursor: 'pointer', paddingTop: theme.sizing.scale200, paddingBottom: theme.sizing.scale200 })}>
        {say('Your verified WhatsApp Business', 'Tu WhatsApp Business verificado')}
      </summary>
      <p className={css({ margin: 0, paddingTop: theme.sizing.scale300, color: theme.colors.contentSecondary, overflowWrap: 'anywhere' })}>
        {phone}<br />{profile?.address?.text}
      </p>
      <button type="button" onClick={switchAccount} className={css({ ...theme.typography.LabelSmall, color: theme.colors.contentPrimary,
        background: 'none', border: 0, padding: '12px 0', textDecoration: 'underline', cursor: 'pointer' })}>
        {say('Switch account', 'Cambiar de cuenta')}
      </button>
    </details>
    <div className={css({ display: 'grid', gap: theme.sizing.scale300 })}>
      <p className={css({ ...theme.typography.LabelMedium, margin: 0 })}>{offer.details}</p>
      <p className={css({ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 })}>
        {offer.timing} {offer.approval}{' '}
        <button type="button" onClick={() => { void Browser.open({ url: offer.termsUrl }); }} className={css({
          ...theme.typography.ParagraphSmall, display: 'inline', color: theme.colors.contentPrimary, background: 'none',
          border: 0, padding: 0, textDecoration: 'underline', cursor: 'pointer',
        })}>{offer.terms}</button>
      </p>
    </div>
    <div className={css({ borderTop: `1px solid ${theme.colors.borderOpaque}`, paddingTop: theme.sizing.scale500,
      display: 'grid', gap: theme.sizing.scale300 })}>
      <p className={css({ ...theme.typography.LabelLarge, margin: 0 })}>
        {say('Invite businesses to move up', 'Invita negocios para subir de puesto')}
      </p>
      <p data-testid="mobile-referral-count" className={css({ ...theme.typography.ParagraphSmall, margin: 0, color: theme.colors.contentSecondary })}>
        {waitlist.joinedThroughYou === 1 ? say('1 business joined through you', '1 negocio llegó por ti')
          : say(`${waitlist.joinedThroughYou ?? 0} businesses joined through you`, `${waitlist.joinedThroughYou ?? 0} negocios llegaron por ti`)}
      </p>
      <details className={css({ ...theme.typography.ParagraphSmall })}>
        <summary className={css({ cursor: 'pointer', paddingTop: theme.sizing.scale300, paddingBottom: theme.sizing.scale300 })}>
          {say('Preview invitation', 'Ver invitación')}
        </summary>
        <p data-testid="mobile-invitation-preview" className={css({ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
          padding: theme.sizing.scale500, borderRadius: theme.borders.radius300, backgroundColor: theme.colors.backgroundSecondary })}>{invitation}</p>
      </details>
    </div>
    {handed === 'clipboard' && <p role="status" className={css({ ...theme.typography.ParagraphSmall, margin: 0 })}>
      {say('Your invitation is copied.', 'Tu invitación está copiada.')}</p>}
    {handed === 'printed' && <p className={css({ ...theme.typography.ParagraphSmall, margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' })}>{invitation}</p>}
  </MobileScreen>;
}
