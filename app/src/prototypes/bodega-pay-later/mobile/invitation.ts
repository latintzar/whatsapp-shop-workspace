import publicSettings from '../../../shop-config.json';
import type { Lang } from '../start/words';

/** Published Peru early-signup offer: soyrocoto.com/terms#early-offer, 22 September 2026.
 * Keep the upcoming-service and approval conditions with the offer in shared messages. */
export const EARLY_OFFER = {
  en: {
    title: '3 loans at 0% interest',
    details: 'Up to S/500 each · 7 days to repay',
    timing: 'Your early-signup offer when credit launches.',
    approval: 'Each loan is subject to assessment and approval.',
    terms: 'See terms', termsUrl: `${publicSettings.nativeOrigin}/en/terms#early-offer`,
    invitation: 'I joined the Rocoto waitlist. Rocoto is preparing credit to stock your business.\n\n'
      + 'Join before launch for 3 loans at 0% interest, up to S/500 each, with 7 days to repay. '
      + 'Each loan is subject to assessment and approval.\n\nJoin through my link:',
  },
  es: {
    title: '3 créditos al 0% de interés',
    details: 'Hasta S/500 cada uno · 7 días para pagar',
    timing: 'Tu beneficio por unirte antes del lanzamiento del crédito.',
    approval: 'Cada crédito está sujeto a evaluación y aprobación.',
    terms: 'Ver condiciones', termsUrl: `${publicSettings.nativeOrigin}/terms#early-offer`,
    invitation: 'Me apunté a la lista de espera de Rocoto. Rocoto está preparando crédito para comprar mercadería.\n\n'
      + 'Únete antes del lanzamiento y accede a 3 créditos al 0% de interés, de hasta S/500 cada uno y con 7 días para pagar. '
      + 'Cada crédito está sujeto a evaluación y aprobación.\n\nEntra con mi enlace:',
  },
} as const;

/** Use the server-issued attribution URL verbatim; it identifies an invitation, not a session. */
export function nativeInvitation(lang: Lang, url: string): string {
  return `${EARLY_OFFER[lang].invitation}\n${url}\n\n${EARLY_OFFER[lang].terms}: ${EARLY_OFFER[lang].termsUrl}`;
}
