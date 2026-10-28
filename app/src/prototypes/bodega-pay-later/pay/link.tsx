/* THE PAYMENT PAGE — `#/pay/<id>`, the page the CUSTOMER opens (the QA pass, item 8;
 * ONBOARDING-SPEC.md §0, «Yape on the payment page»).
 *
 * `Make the page` minted a URL and no route answered it, so opening the link the shop had just
 * sent painted the shop's own Money overview: the customer saw the bodega's balance, its
 * payables and its fiado book. This route is the other side of the counter and carries FOUR
 * facts and nothing else — whose shop it is, the exact amount, what it is for, and how to pay.
 *
 * IT STANDS OUTSIDE THE DESK. `App.tsx` mounts it in the walk's own bare column: no rail, no
 * bottom row, no day bar, nothing a shopkeeper's app has and a customer's page does not. It is
 * also in front of the session gate, because the person opening it holds no session.
 *
 * ═══ PAY NOW: THE QR, THE NUMBER, THE AMOUNT, AND THEN YAPE ════════════════════════════════
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening): «figure out how to get their yape
 * QR and amount setter. and if the amount setting doesnt work just put the amount and make them
 * copy it first, then enable the "complete in yape" button.»
 *
 * WHAT THE RESEARCH FOUND, 20 September 2026 (recorded in WIRING-SPEC.md §15):
 *   · Yape publishes NO documented URL scheme, deep link or web API that carries an amount into a
 *     personal or business Yape account. Its own help centre documents the QR and the app.
 *   · Charging an exact amount on the web is documented only through a PROVIDER — Culqi
 *     (CulqiLink, CulqiOnline), Izipay, Mercado Pago, Niubiz — each of which needs a registered
 *     company and an approved affiliation (Websy's provider comparison, read 20 September 2026,
 *     against Culqi's and Izipay's own published pages). That is the road Peter named: «i need to
 *     register a company to access culqi which will give me the yape on file».
 *   · So today the page takes the copy-then-open path, exactly as he described it: the amount is
 *     copied with one press, and `Open Yape` comes live the moment it is on the clipboard — the
 *     customer pastes it into Yape rather than typing it, which is where the wrong figure comes
 *     from.
 *   · `Open Yape` opens the app that is installed: on Android through the store's own package
 *     name, which falls back to the store listing; elsewhere through the App Store page. Neither
 *     carries an amount, which is why the amount goes on the clipboard first.
 *
 * ═══ WHOSE YAPE IT SHOWS ════════════════════════════════════════════════════════════════════
 * `GET /api/bodega/pay/<code>/yape` and `/yape/qr`, keyed by the shop's own public code, which is
 * the one public name a business on the waitlist has (`mock-api/app/bodega.py`). A link minted
 * before a shop connected its Yape falls back to the seeded shop's own number, which is what the
 * page printed before this screen existed.
 *
 * WHAT IT MAY SAY ABOUT PAYING LATER. `Pay later` is one press and one sentence: it tells the
 * shop. A rate, a term, an instalment, a limit and an approval word wait for a signed lender
 * (`regulatory.ts`), so this page states the shop's own amount and nothing about credit.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { Figure } from '../../cedar/figure';
import { house } from '../cast';
import { shopsYape, shopsYapeQr, yapeWords } from '../start/joining';
import { useWords } from '../start/words';
import { YAPE, yapeWash } from '../../../rocoto-theme';
import { MONEY_SCOPE, bodegaMoney, useMoney, type PaymentLink } from '../money-store';

/** `#/pay/<id>` — the page's own address, read the way the areas read theirs. */
export function linkIdOf(hash: string): string {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  try { return decodeURIComponent(parts[1] ?? ''); } catch { return parts[1] ?? ''; }
}

function useLinkId(): string {
  const [hash, setHash] = React.useState(() => window.location.hash);
  React.useEffect(() => {
    const read = () => setHash(window.location.hash);
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  return linkIdOf(hash);
}

/** THE ADDRESS THAT OPENS THE APP THAT IS INSTALLED. Android takes the store's own package name
 *  through an `intent:` URL, which falls back to the listing where the app is absent; every other
 *  browser takes the App Store page. Neither carries an amount — no published Yape address does
 *  (WIRING-SPEC.md §15) — which is why the amount is copied first. */
export const YAPE_ANDROID = 'intent://pay#Intent;scheme=yape;package=com.bcp.innovacxion.yapeapp;'
  + 'S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.bcp.innovacxion.yapeapp;end';
export const YAPE_ELSEWHERE = 'https://apps.apple.com/pe/app/yape/id1443492467';

export const yapeOpenLink = (agent: string = navigator.userAgent): string =>
  (/android/i.test(agent) ? YAPE_ANDROID : YAPE_ELSEWHERE);

/** The shop's Yape, as the payment page reads it. */
type ShopsYape = { number: string; hasQr: boolean };

/* ── the page ─────────────────────────────────────────────────────────────────────────────── */

export default function PaymentPage() {
  const [, theme] = useStyletron();
  /* THE CUSTOMER'S PAGE IS CUSTOMER-FACING, so it reads the same table the sign-up does: Spanish,
     unless the address asked for English (`start/words.ts`). */
  const { w } = useWords();
  const id = useLinkId();
  const { state } = useMoney(MONEY_SCOPE);
  const link: PaymentLink | undefined = state.links.find((row) => row.id === id);
  const [paying, setPaying] = React.useState<'yape' | 'later' | null>(null);
  const [message, setMessage] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [shop, setShop] = React.useState<ShopsYape | null>(null);
  const quiet: React.CSSProperties = { ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0 };

  /* THE SHOP'S OWN YAPE, by the public code this link names. A link that names no shop this
     service holds keeps the seeded shop's own number, which is what the page printed before. */
  React.useEffect(() => {
    if (!id) return undefined;
    let live = true;
    void fetch(shopsYape(id), { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } })
      .then((answer) => (answer.ok ? answer.json() : null))
      .then((body) => { if (live && body && typeof body.number === 'string') setShop(body as ShopsYape); })
      .catch(() => undefined);
    return () => { live = false; };
  }, [id]);

  const exact = link ? (link.amountMinor / 100).toFixed(2) : '';
  const yapeNumber = shop?.number ? `+51 ${yapeWords(shop.number)}` : house.yape;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exact);
      setCopied(true);
      setMessage(w.payCopied(bodegaMoney(link?.amountMinor ?? 0)));
    } catch {
      /* A BROWSER THAT REFUSES THE CLIPBOARD STILL LETS THE PERSON PAY: the figure is on the
         screen and the act comes live, because the rule is «read the amount, then open Yape». */
      setCopied(true);
      setMessage(w.payRead(bodegaMoney(link?.amountMinor ?? 0)));
    }
  };

  return <main data-testid="payment-page" data-link-id={id}
    style={{ display: 'grid', gap: theme.sizing.scale700, minWidth: 0,
      padding: theme.sizing.scale800, alignContent: 'start' }}>
    {/* THE SHOP IS NAMED ONLY ON A LINK THIS BROWSER HOLDS. A link lives in the browser that made it
        while this is a prototype, so a page opened elsewhere names the page and says where it opens;
        printing the sample shop's name and address over that sentence told a customer the wrong shop. */}
    <header style={{ display: 'grid', gap: theme.sizing.scale200 }}>
      <h1 data-testid="payment-page-shop" style={{ ...theme.typography.HeadingMedium, margin: 0 }}>{link ? house.name : w.payTitle}</h1>
      {link && <p style={quiet}>{house.address}</p>}
    </header>

    {link ? <>
      <div data-testid="payment-page-amount" data-amount-minor={link.amountMinor}
        style={{ display: 'grid', gap: theme.sizing.scale300 }}>
        <Figure value={link.amountMinor / 100} unit="S/" size="display" decimals={2} />
        <p data-testid="payment-page-description" style={{ ...theme.typography.ParagraphMedium, margin: 0,
          overflowWrap: 'anywhere' }}>{link.description}</p>
        <p style={quiet}>{w.payReference(link.reference)}</p>
      </div>

      <div style={{ display: 'grid', gap: theme.sizing.scale400, justifyItems: 'stretch' }}>
        <Button data-testid="payment-page-pay-now" overrides={{ BaseButton: { style: { minHeight: '56px' } } }}
          onClick={() => setPaying('yape')}>{w.payNow}</Button>
        <Button kind={KIND.secondary} data-testid="payment-page-pay-later"
          overrides={{ BaseButton: { style: { minHeight: '56px' } } }}
          onClick={() => setPaying('later')}>{w.payLater}</Button>
      </div>

      {paying === 'yape' && <section data-testid="payment-page-yape"
        style={{ display: 'grid', gap: theme.sizing.scale500, padding: theme.sizing.scale600,
          borderRadius: theme.borders.radius400, backgroundImage: yapeWash(theme.colors.backgroundPrimary) }}>
        {/* THE TWO WALLETS' OWN ICONS, side by side, where the customer looks first. Peter, 20
            September: «the Yape and Plin logos need to be in the right place… It's also Plin, by the
            way.» The number under them takes a payment from either wallet. The files and their
            provenance are in `app/public/connection-brands/README.md`. */}
        <div style={{ display: 'flex', gap: theme.sizing.scale400, alignItems: 'center' }}>
          <img data-testid="payment-page-yape-mark" src="/connection-brands/yape-icon.webp" alt="Yape"
            width={44} height={44} style={{ display: 'block', width: '44px', height: '44px', borderRadius: theme.borders.radius300 }} />
          <img data-testid="payment-page-plin-mark" src="/connection-brands/plin-icon.webp" alt="Plin"
            width={44} height={44} style={{ display: 'block', width: '44px', height: '44px' }} />
        </div>

        {/* THE SHOP'S OWN QR, where it gave one — the thing a customer scans with Yape open. */}
        {shop?.hasQr && <img data-testid="payment-page-yape-qr" src={shopsYapeQr(id)} alt="" width={200} height={200}
          style={{ width: '200px', height: '200px', objectFit: 'contain', justifySelf: 'center',
            display: 'block', borderRadius: theme.borders.radius300, backgroundColor: theme.colors.backgroundPrimary,
            padding: theme.sizing.scale400 }} />}

        <p data-testid="payment-page-yape-number" style={{ ...theme.typography.HeadingSmall, margin: 0 }}>{yapeNumber}</p>
        <p style={quiet}>{w.paySend(bodegaMoney(link.amountMinor))}</p>

        <Button size={SIZE.large} kind={KIND.secondary} data-testid="payment-page-copy"
          overrides={{ BaseButton: { style: { minHeight: '56px', width: '100%' } } }}
          onClick={() => { void copy(); }}>
          <Copy size={18} aria-hidden />&nbsp;{w.payCopy}
        </Button>
        {/* THE SECOND ACT COMES LIVE ONCE THE AMOUNT IS IN HAND, because no published Yape address
            carries one (WIRING-SPEC.md §15) and a customer typing it is where a wrong figure starts. */}
        <Button size={SIZE.large} disabled={!copied} data-testid="payment-page-open-yape"
          href={copied ? yapeOpenLink() : undefined} target="_blank"
          overrides={{ BaseButton: { style: { minHeight: '56px', width: '100%' } } }}>
          <ExternalLink size={18} aria-hidden />&nbsp;{w.payOpenYape}
        </Button>
        {!copied && <p data-testid="payment-page-copy-first" style={quiet}>{w.payCopyFirst}</p>}
      </section>}

      {paying === 'later' && <p role="status" data-testid="payment-page-later" style={{
        ...theme.typography.ParagraphMedium, margin: 0, padding: theme.sizing.scale600,
        borderRadius: theme.borders.radius300, backgroundColor: theme.colors.backgroundSecondary }}>
        {w.payLaterSays(house.name)}
      </p>}

      {message && <p role="status" data-testid="payment-page-says" style={quiet}>{message}</p>}
    </> : <p data-testid="payment-page-missing" style={{ ...theme.typography.ParagraphMedium, margin: 0 }}>
      {w.payMissing}
    </p>}
  </main>;
}
