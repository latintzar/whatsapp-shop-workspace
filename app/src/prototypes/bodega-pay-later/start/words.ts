/* THE WALK'S WORDS, IN BOTH LANGUAGES — one table, two columns (ONBOARDING-SPEC.md §0).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, night), verbatim: «it all haes to be in
 * spanish the website and the onboarding. english only if they clicked fromt he english page.»
 *
 * ═══ SPANISH IS THE DEFAULT, AND ENGLISH IS A THING THE LINK ASKED FOR ══════════════════════
 * A shop arriving at this page reads Spanish. `?lang=en` — which is how the English site links to
 * the sign-up — reads English, and the choice is kept for the SESSION, so every screen after the
 * first one keeps the language the first one was opened in. The business's own row records it
 * (`language` on `PUT /api/bodega/business`), so the buddy writes to that shop in the language it
 * signed up in (MESSAGES.md).
 *
 * ═══ ONE TABLE, SO A STRING EXISTS ONCE ═════════════════════════════════════════════════════
 * Every string the sign-up SHOWS is a row below with an `en` and an `es` column — the ten screens,
 * the pass, the invitation the owner forwards, the greeting the shop sends the buddy, the status
 * page, and the customer's own payment page, which is customer-facing and follows the same rule.
 * A screen holds no literal of its own: it reads `useWords()` and prints a row. That is what makes
 * the second language a column rather than a fork of the walk.
 *
 * English is written first and Spanish second, which is the house order — and the ENGLISH column
 * is exactly what shipped before this table existed, word for word, because the drive asserts it
 * (`drives/drive-268-bodega-onboarding.py`, which opens the walk with `?lang=en`). The Spanish is
 * written as a Peruvian shopkeeper talks — «negocio», «lista de espera», «subes de puesto»,
 * «proveedor», «pedido», «nota de entrega», «fiado» — rather than translated word for word, and it
 * keeps the copy law the English keeps: never a negative, a heading names the thing, short
 * complete sentences, and no rate, fee, amount, term, date or promise of approval anywhere near
 * the credit (DESIGN-SPEC.md §6).
 *
 * ═══ WHAT IS NOT HERE ═══════════════════════════════════════════════════════════════════════
 *   · The rig's own door (`Reset state` and its cleared line) stands behind `?dev=1` and belongs to
 *     whoever is reviewing, so it keeps the review language — English — in both columns.
 *   · Cedar's Embedded Signup walk (`../cedar/connections/app.tsx`) carries its own five titles and
 *     is another candidate's file; screen 2 states its own sentence here and mounts that walk whole.
 *   · The likely list's ROW REASONS are the read's own line (`history/read.ts`, `owedReasonLine`),
 *     which Money reads too; `owedReasonEs` below writes the Spanish of the same facts so screen 8
 *     reads Spanish without a second copy of the English one.
 */
import * as React from 'react';

/* ── which language this page is in ───────────────────────────────────────────────────────── */

export type Lang = 'es' | 'en';

export const LANGS: Lang[] = ['es', 'en'];

/** The default. A shop that asked for nothing reads Spanish. */
export const HOUSE_LANG: Lang = 'es';

/** Where the session keeps the choice. It rides session storage, because it is worth one visit —
 *  and it is the page's own memory, never evidence about an account (`stage.ts`'s rule). */
export const LANG_KEY = 'rocoto-bodega-lang';

const asLang = (value: string): Lang | '' => (value === 'en' ? 'en' : value === 'es' ? 'es' : '');

/** What the address asked for, `?lang=en`. */
export function askedLang(search: string = window.location.search): Lang | '' {
  try { return asLang((new URLSearchParams(search).get('lang') ?? '').trim().toLowerCase()); } catch { return ''; }
}

export function heldLang(): Lang | '' {
  try { return asLang(window.sessionStorage.getItem(LANG_KEY) ?? ''); } catch { return ''; }
}

export function holdLang(lang: Lang): void {
  try { window.sessionStorage.setItem(LANG_KEY, lang); } catch { /* a browser that refuses forgets */ }
}

/* THE CHOICE IS TAKEN ONCE, ON THE LOAD THAT CARRIES ONE. Every screen after it reads the held
   value, so `#/start/business` reached from an English arrival is English without the address
   having to carry the flag through ten hashes. */
const ASKED = askedLang();
if (ASKED) holdLang(ASKED);

/**
 * THE LANGUAGE THIS SCREEN IS IN: the address first, then what the caller prefers — the status
 * page, which reads the language off the business's own row — then the session, then Spanish.
 */
export function pageLang(prefer: Lang | '' = ''): Lang {
  return ASKED || prefer || heldLang() || HOUSE_LANG;
}

/* ── the numbers ──────────────────────────────────────────────────────────────────────────── */

/** A PLACE, AS PERU WRITES ONE: `1,204`. Peru groups thousands with a comma and marks decimals
 *  with a point, which is exactly what `en-US` prints — so ONE formatter serves both columns and
 *  the two languages can never drift into two different figures. */
export const figure = (value: number): string => value.toLocaleString('en-US');

/* ── the table ────────────────────────────────────────────────────────────────────────────── */

type Row<T> = { en: T; es: T };

/** A row's English and Spanish, in the house order. */
const say = <T,>(en: T, es: T): Row<T> => ({ en, es });

const ROWS = {
  /* ── screen 1 · the arrival ─────────────────────────────────────────────────────────────── */

  arrivalTitle: say('Join the waitlist', 'Únete a la lista de espera'),
  /* PETER'S OWN PARAGRAPH, verbatim in both languages: his English (20 September, evening) and
     its Spanish twin (20 September, night). One paragraph, and the apostrophes are the walk's own
     typographic ones. */
  arrivalBody: say(
    'To join the waitlist, you need to connect your WhatsApp to Rocoto. This will give you'
    + ' the chance to show us the reality of your business and your relationships. This is how we’ll'
    + ' be able to understand you when you need the cash to buy stock or when you need credit to buy'
    + ' stock. Don’t worry, we won’t do anything unauthorized on your account. This is purely for us'
    + ' to learn about your business.',
    'Para unirte a la lista de espera, conecta tu WhatsApp a Rocoto. Así nos muestras la realidad'
    + ' de tu negocio y de tus relaciones. Con eso te vamos a entender cuando necesites plata para'
    + ' comprar mercadería, o crédito para comprarla. Tranquilo: en tu cuenta solo pasa lo que tú'
    + ' autorizas. Esto es solo para que conozcamos tu negocio.',
  ),
  arrivalConnect: say('Connect WhatsApp', 'Conectar WhatsApp'),
  carryOn: say('Continue', 'Continuar'),
  arrivalConnected: say(
    (number: string) => `Connected · ${number}`,
    (number: string) => `Conectado · ${number}`,
  ),
  loading: say('Loading…', 'Cargando…'),
  invitedBy: say(
    (business: string) => `${business} invited you`,
    (business: string) => `${business} te invitó`,
  ),
  invitedBySomebody: say('A business invited you', 'Un negocio te invitó'),

  /* THE RIG'S OWN DOOR — behind `?dev=1`, for whoever is reviewing, so it keeps the review
     language in both columns (the English-first rule for surfaces being reviewed). */
  rigReset: say('Reset state', 'Reset state'),
  rigClearing: say('Clearing…', 'Clearing…'),
  rigClearedSample: say(
    (keys: number) => `State cleared · ${keys} keys · sample chats stay connected`,
    (keys: number) => `State cleared · ${keys} keys · sample chats stay connected`,
  ),
  rigClearedDropped: say(
    (keys: number) => `State cleared · ${keys} keys · WhatsApp disconnected`,
    (keys: number) => `State cleared · ${keys} keys · WhatsApp disconnected`,
  ),
  rigClearedHeld: say(
    (keys: number) => `State cleared · ${keys} keys · WhatsApp still connected, connect here to disconnect it`,
    (keys: number) => `State cleared · ${keys} keys · WhatsApp still connected, connect here to disconnect it`,
  ),

  /* ── screen 2 · the connection ──────────────────────────────────────────────────────────── */

  connectWhy: say(
    'Rocoto reads your chats to list who owes you and who you owe. WhatsApp keeps working on your phone, and broadcast lists become read-only.',
    'Rocoto lee tus chats para armar la lista de quién te debe y a quién le debes. WhatsApp sigue igual en tu teléfono, y las listas de difusión quedan de solo lectura.',
  ),
  connectDone: say('WhatsApp connected', 'WhatsApp conectado'),

  /* ── screen 3 · the celebration ─────────────────────────────────────────────────────────── */

  waitlistTitle: say('You’re on the waitlist!', '¡Ya estás en la lista de espera!'),
  waitlistSentence: say('Bring another business and you move up.', 'Trae otro negocio y subes de puesto.'),
  waitlistAct: say('Confirm details', 'Confirma tus datos'),
  ahead: say(
    (count: number) => (count === 1 ? '1 business is ahead of you.' : `${figure(count)} businesses are ahead of you.`),
    (count: number) => (count === 1 ? '1 negocio va delante de ti.' : `${figure(count)} negocios van delante de ti.`),
  ),
  /** The word a screen prints where the figure came from the seed rather than the service. */
  sampleSays: say('Sample waitlist', 'Lista de muestra'),

  /* ── screen 4 · the business ────────────────────────────────────────────────────────────── */

  kindTitle: say('What is your business?', '¿Qué es tu negocio?'),
  kindSupplier: say('Supplier', 'Proveedor'),
  kindBodega: say('Bodega', 'Bodega'),
  kindRestaurant: say('Restaurant', 'Restaurante'),
  nameTitle: say('What is it called?', '¿Cómo se llama?'),
  nameSentence: say(
    'This is the name your customers see on what Rocoto sends them.',
    'Es el nombre que tus clientes ven en lo que Rocoto les manda.',
  ),
  nameField: say('The name of your business', 'El nombre de tu negocio'),
  namePlaceholder: say('Bodega Yesenia', 'Bodega Yesenia'),
  nameSave: say('Save my business', 'Guardar mi negocio'),
  changeKind: say('Change what my business is', 'Cambiar qué es mi negocio'),

  /* ── screen 5 · the address ─────────────────────────────────────────────────────────────── */

  addressTitle: say('Where is it?', '¿Dónde queda?'),
  addressSentence: say('Type the street and pick your address.', 'Escribe la calle y elige tu dirección.'),
  addressField: say('Search for your address', 'Busca tu dirección'),
  addressPlaceholder: say('Av. Larco 345', 'Av. Larco 345'),
  addressRecent: say('Recent', 'Reciente'),
  addressEmpty: say('Try the street and its number.', 'Prueba con la calle y su número.'),
  addressConfirm: say('Confirm this address', 'Confirmar esta dirección'),
  addressAgain: say('Search again', 'Buscar otra vez'),
  addressBack: say('Back to your business', 'Volver a tu negocio'),
  addressDrag: say('Drag the map to put the pin on your door.', 'Mueve el mapa para dejar el pin en tu puerta.'),
  yourBusiness: say('Your business', 'Tu negocio'),

  /* ── screen 6 · the orders ──────────────────────────────────────────────────────────────── */

  ordersTitle: say('Your orders appear here', 'Tus pedidos aparecen aquí'),
  ordersSentence: say(
    'Every order from your chats becomes a delivery note you can prepare and print.',
    'Cada pedido de tus chats se vuelve una nota de entrega que preparas e imprimes.',
  ),
  ordersNext: say('Continue', 'Continuar'),
  ordersReady: say('Ready to prepare', 'Listo para preparar'),

  /* ── screen 7 · the Yape ────────────────────────────────────────────────────────────────── */

  yapeTitle: say('Connect your Yape', 'Conecta tu Yape'),
  yapeSentence: say(
    'Rocoto sends your Yape link in the chat when a customer orders.',
    'Rocoto manda tu link de Yape en el chat cuando un cliente pide.',
  ),
  yapeField: say('Your Yape number', 'Tu número de Yape'),
  yapeConnect: say('Connect my Yape', 'Conectar mi Yape'),
  yapeConnected: say('Yape connected', 'Yape conectado'),
  yapeAddQr: say('Add my Yape QR', 'Agregar mi QR de Yape'),
  yapeChangeQr: say('Change my Yape QR', 'Cambiar mi QR de Yape'),
  yapeAsk: say(
    'Type your nine-digit Yape number, such as 987 654 321',
    'Escribe tu número de Yape de nueve dígitos, así: 987 654 321',
  ),
  skip: say('Skip for now', 'Ahora no'),

  /* ── screen 8 · who owed you ────────────────────────────────────────────────────────────── */

  owedTitle: say('These businesses have owed you', 'Estos negocios te han debido'),
  owedSentence: say(
    'Share Rocoto with them. The message goes from your own WhatsApp when you press send there.',
    'Comparte Rocoto con ellos. El mensaje sale de tu propio WhatsApp cuando le das enviar ahí.',
  ),
  owedPicked: say(
    (count: number) => (count === 1 ? '1 business picked' : `${figure(count)} businesses picked`),
    (count: number) => (count === 1 ? '1 negocio elegido' : `${figure(count)} negocios elegidos`),
  ),
  owedShareAll: say('Share with them', 'Compartir con ellos'),
  owedShareWith: say(
    (who: string) => `Share with ${who}`,
    (who: string) => `Compartir con ${who}`,
  ),
  owedCount: say(
    (sent: number, of: number) => `${sent} of ${of} shared`,
    (sent: number, of: number) => `${sent} de ${of} compartidos`,
  ),
  owedRowShared: say('Shared', 'Compartido'),
  owedNext: say('Next: move up the list', 'Siguiente: sube en la lista'),
  owedEmpty: say(
    'Your chats are still being read. Move on and share your link instead.',
    'Seguimos leyendo tus chats. Sigue y comparte tu link.',
  ),

  /* ── screen 9 · move up the list ────────────────────────────────────────────────────────── */

  referralsTitle: say('Move up the list', 'Sube en la lista'),
  /* THE REWARD'S OWN WORDING, and no other: a covered purchase, never a rate, a fee, an amount, a
     term or an approval (the credit law, DESIGN-SPEC.md §6). */
  referralsSentence: say(
    (per: number) => `Every ${per} businesses that join through you cover one more of your purchases.`,
    (per: number) => `Cada ${per} negocios que entran con tu link te cubren una compra más.`,
  ),
  seatsLabel: say(
    (per: number) => `${per} businesses = 1 more covered purchase`,
    (per: number) => `${per} negocios = 1 compra cubierta más`,
  ),
  worth: say(
    (places: number) => `Each business you bring moves you up ${places} places.`,
    (places: number) => `Cada negocio que traes te sube ${places} puestos.`,
  ),
  covered: say(
    (count: number) => (count === 1 ? '1 of your purchases is covered.' : `${figure(count)} of your purchases are covered.`),
    (count: number) => (count === 1 ? '1 de tus compras está cubierta.' : `${figure(count)} de tus compras están cubiertas.`),
  ),
  shareLink: say('Share my link', 'Compartir mi link'),
  shareAgain: say('Share my link again', 'Compartir mi link otra vez'),
  finishJoining: say('Finish joining', 'Terminar'),
  sharedSays: say(
    'Your link is shared. Your place moves as they join.',
    'Tu link está compartido. Tu puesto sube conforme entran.',
  ),
  clipboardSays: say(
    'Your link is on the clipboard. Paste it into any chat.',
    'Tu link está copiado. Pégalo en cualquier chat.',
  ),
  printedSays: say(
    (url: string) => `Copy your link: ${url}`,
    (url: string) => `Copia tu link: ${url}`,
  ),

  /* ── the invitation the owner forwards ──────────────────────────────────────────────────── */

  /* ⚠ NOTHING SENDS THIS. It is handed to the owner's own share sheet or to `wa.me`, and the owner
     presses send. It names the sender's business, says what Rocoto does, and carries the sender's
     own code in the link. */
  invitation: say(
    (business: string, url: string) => `${business || 'My business'} is on the Rocoto waitlist.`
      + ' Rocoto keeps your orders and your payments in WhatsApp.'
      + ` Join through my link and we both move up: ${url}`,
    (business: string, url: string) => `${business || 'Mi negocio'} está en la lista de espera de Rocoto.`
      + ' Rocoto te guarda los pedidos y los pagos en WhatsApp.'
      + ` Entra con mi link y los dos subimos de puesto: ${url}`,
  ),
  /** The short line that rides `navigator.share`, where the sheet shows a title of its own. */
  shareTitle: say('Join me on Rocoto', 'Entra a Rocoto conmigo'),

  /* ── screen 10 · done, and the buddy ────────────────────────────────────────────────────── */

  doneTitle: say('You’re in', 'Ya estás dentro'),
  doneSentence: say(
    'Say hi and Rocoto answers there with your place and your link.',
    'Salúdale y Rocoto te responde ahí con tu puesto y tu link.',
  ),
  doneSayHi: say('Say hi to Rocoto on WhatsApp', 'Salúdale a Rocoto en WhatsApp'),
  doneStands: say(
    (number: string) => `Rocoto is on WhatsApp at ${number}.`,
    (number: string) => `Rocoto está en WhatsApp en ${number}.`,
  ),
  openRocoto: say('Open Rocoto', 'Abrir Rocoto'),
  install: say('Add to Home Screen', 'Agregar a la pantalla de inicio'),
  installSteps: say(
    ['Tap Share in Safari', 'Choose Add to Home Screen', 'Tap Add'],
    ['Toca Compartir en Safari', 'Elige Agregar a pantalla de inicio', 'Toca Agregar'],
  ),
  installDone: say('Done', 'Listo'),
  /* THE GREETING THE SHOP SENDS THE BUDDY. It carries the business's own name and its reference, so
     the buddy finds the row by the sender's number first and by the reference in the text second
     (MESSAGES.md). It is what opens the 24-hour window. */
  greeting: say(
    (name: string, code: string) => `Hi Rocoto, this is ${name}. My reference is ${code}.`,
    (name: string, code: string) => `Hola Rocoto, soy ${name}. Mi referencia es ${code}.`,
  ),

  /* ── the pass ───────────────────────────────────────────────────────────────────────────── */

  /** The label across the top of the card. The card sets it in caps, so this is the sentence case
   *  of «LISTA DE ESPERA ROCOTO». */
  passLabel: say('Rocoto waitlist', 'Lista de espera Rocoto'),
  passSupplier: say('Supplier', 'Proveedor'),
  passBodega: say('Bodega', 'Bodega'),
  passRestaurant: say('Restaurant', 'Restaurante'),
  passReference: say(
    (code: string) => `Reference ${code}`,
    (code: string) => `Referencia ${code}`,
  ),

  /* ── the status page, `#/lista/<CODE>` ──────────────────────────────────────────────────── */

  listaTitle: say('Your place in the queue', 'Tu puesto en la lista'),
  listaJoined: say(
    (count: number) => (count === 1
      ? '1 business joined through your link.'
      : `${figure(count)} businesses joined through your link.`),
    (count: number) => (count === 1
      ? '1 negocio entró con tu link.'
      : `${figure(count)} negocios entraron con tu link.`),
  ),
  /** What the line says while the seats are still to fill: the act, rather than the count of
   *  nobody (the copy law — say what IS). */
  listaShareFirst: say(
    'Share your link and businesses join through it.',
    'Comparte tu link y empiezan a entrar negocios.',
  ),
  /* A CODE THE SERVICE HOLDS NO ROW FOR. The screen names the thing it IS — the waitlist — says
     where a status link comes from, and offers the one way in. */
  listaUnknownTitle: say('The Rocoto waitlist', 'La lista de espera de Rocoto'),
  listaUnknownSentence: say(
    'Your status link arrives in Rocoto’s own message on WhatsApp.',
    'Tu link de estado llega en el mensaje de Rocoto en WhatsApp.',
  ),
  listaJoin: say('Join the waitlist', 'Únete a la lista de espera'),

  /* ── the customer's own payment page ────────────────────────────────────────────────────── */

  payTitle: say('Payment link', 'Link de pago'),
  payReference: say(
    (reference: string) => `Reference ${reference}`,
    (reference: string) => `Referencia ${reference}`,
  ),
  payNow: say('Pay now', 'Pagar ahora'),
  payLater: say('Pay later', 'Pagar después'),
  paySend: say(
    (amount: string) => `Send ${amount} to that number from Yape or Plin, and write the reference above.`,
    (amount: string) => `Manda ${amount} a ese número desde Yape o Plin, y escribe la referencia de arriba.`,
  ),
  payCopy: say('Copy the amount', 'Copiar el monto'),
  payOpenYape: say('Open Yape', 'Abrir Yape'),
  payCopyFirst: say('Copy the amount and Open Yape comes live.', 'Copia el monto y se activa Abrir Yape.'),
  payCopied: say(
    (amount: string) => `${amount} is on your clipboard. Paste it into Yape.`,
    (amount: string) => `${amount} está copiado. Pégalo en Yape.`,
  ),
  payRead: say(
    (amount: string) => `Read the amount above — ${amount} — and type it into Yape.`,
    (amount: string) => `Mira el monto de arriba — ${amount} — y escríbelo en Yape.`,
  ),
  payLaterSays: say(
    (shop: string) => `${shop} keeps this open, and Rocoto tells them you are paying later.`,
    (shop: string) => `${shop} lo deja abierto, y Rocoto les avisa que vas a pagar después.`,
  ),
  payMissing: say(
    'This payment page opens in the browser the shop made it in.',
    'Esta página de pago se abre en el navegador donde la bodega la hizo.',
  ),
} as const;

/* ── reading a column ─────────────────────────────────────────────────────────────────────── */

/** One language's column of the table above, with each row's own type kept. */
export type Words = { [K in keyof typeof ROWS]: (typeof ROWS)[K]['en'] };

/* The columns are cut once and held, so a screen that re-renders reads the same object rather
   than building a new one every frame. */
const CUT = new Map<Lang, Words>();

export function words(lang: Lang): Words {
  const held = CUT.get(lang);
  if (held) return held;
  const out = Object.fromEntries(
    Object.entries(ROWS).map(([key, row]) => [key, (row as Record<Lang, unknown>)[lang]]),
  ) as Words;
  CUT.set(lang, out);
  return out;
}

/**
 * THE WORDS THIS SCREEN PRINTS, AND THE LANGUAGE IT IS IN.
 *
 * `prefer` is for a screen that learns the language from a RECORD rather than from the address —
 * the status page, which reads the business's own `language`. The address still wins, so a person
 * handed a Spanish shop's link can read it in English by asking for English.
 */
export function useWords(prefer: Lang | '' = ''): { lang: Lang; w: Words } {
  return React.useMemo(() => {
    const lang = pageLang(prefer);
    return { lang, w: words(lang) };
  }, [prefer]);
}

/* ── the likely list's reason, in Spanish ─────────────────────────────────────────────────── */

const timesEs = (count: number): string => (count === 1 ? 'una vez' : count === 2 ? 'dos veces' : `${figure(count)} veces`);

const daysEs = (days: number): string => (days <= 0 ? 'hoy' : days === 1 ? 'ayer' : `hace ${figure(days)} días`);

/**
 * `Pidió fiado dos veces · último pedido hace 3 días · 2 pagos vistos` — the same facts, in the
 * same order, as the read's own English line (`history/read.ts`, `owedReasonLine`), which Money
 * reads as well and which the drive asserts. A fact the chat carries none of is left out rather
 * than printed as a zero, and the first fact it does carry opens the line.
 *
 * ⚠ IT NEVER SAYS «LAUGHS», in either language: screen 8 is the screen a distributor is shown.
 */
export const owedReasonEs = (row: {
  fiadoAsks: number; lastOrderDaysAgo: number; lastMessageDaysAgo: number; paymentsSeen: number;
}): string => {
  const facts = [
    ...(row.fiadoAsks > 0 ? [`pidió fiado ${timesEs(row.fiadoAsks)}`] : []),
    ...(row.lastOrderDaysAgo < 999
      ? [`último pedido ${daysEs(row.lastOrderDaysAgo)}`]
      : [`último mensaje ${daysEs(row.lastMessageDaysAgo)}`]),
    ...(row.paymentsSeen > 0 ? [`${figure(row.paymentsSeen)} pagos vistos`] : []),
  ];
  return facts.map((fact, index) => (index === 0 ? fact.charAt(0).toUpperCase() + fact.slice(1) : fact)).join(' · ');
};
