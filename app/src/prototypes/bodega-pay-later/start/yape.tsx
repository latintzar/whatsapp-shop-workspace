/* SCREEN 7 · CONNECT YOUR YAPE — `Connect your Yape` (ONBOARDING-SPEC.md §0, screen 7).
 *
 * Peter, 20 September 2026 (`docs/FEED-IA.md` §268, evening): «then we ask if they wanna connect
 * yape, with nicely branded shit. figure out how to get their yape QR and amount setter.»
 *
 * ═══ WHOSE COLOUR THIS IS ═══════════════════════════════════════════════════════════════════
 * The field is drawn in YAPE'S OWN PURPLE, which is a named exception in `rocoto-theme.ts` on the
 * same licence WhatsApp's green holds: it is a drawing of SOMEBODY ELSE'S product, shown so a
 * shopkeeper recognises in one glance which app this screen is about. Painting it saffron would
 * say «Rocoto did this», which is the opposite of what the field means — the shop connects its
 * own Yape. The mark is the product's NAME set in this app's own type; Yape's logotype itself
 * stays Yape's. It is the whole label — a sentence beside it describing the drawing would be a
 * note about the design printed where a shopkeeper reads product copy.
 *
 * ═══ THE STAGE IS YAPE'S PURPLE OUTRIGHT ════════════════════════════════════════════════════
 * ⚠ IT WAS A PALE LILAC WASH WITH A TINY CHIP ON IT, and nobody looking at it would have said the
 * word Yape. The stage is Yape's own purple edge to edge and up to the top of the phone now
 * (`walk.tsx`, the `yape` tone — the one screen that asks for it), with the name set large in
 * white on it and the shop's QR on a white tile lying at a slight angle, squaring up the moment
 * the number is one Yape would accept.
 *
 * ═══ WHAT IS STORED, AND WHERE ══════════════════════════════════════════════════════════════
 * `PUT /api/bodega/yape` takes the number — a Peruvian mobile, validated by the service, never by
 * this page alone — and a photo or screenshot of the shop's own QR, which the service sniffs for
 * a real PNG, JPEG or WebP under 2 MB and keeps with the business. A number given again with no
 * fresh photo keeps the photo already on file.
 *
 * ═══ THE MOTION ═════════════════════════════════════════════════════════════════════════════
 * The purple arrives as a circular reveal out of the act at the foot; the QR thumbnail pops on a
 * spring the moment it is chosen; and connecting ends in a tick that draws itself where the
 * button's words were. Stillness draws all three as plain states.
 *
 * ═══ AND SKIPPING IS A REAL WAY ON ══════════════════════════════════════════════════════════
 * `Skip for now` is quiet and always there: a shop with no Yape on its counter still joins.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Input } from 'baseui/input';
import { ImagePlus, QrCode } from 'lucide-react';
import { YAPE, yapeLift } from '../../../rocoto-theme';
import { markReached } from '../stage';
import {
  readDraft, sellsOnward, writeDraft, writeYape, yapeDigits, yapeE164, yapeReady, yapeWords,
} from './joining';
import {
  DrawnTick, MS, SPRING, WalkAct, WalkQuiet, WalkScreen, goTo, stepsFor,
  useEntered, useStillness, tap,
} from './walk';
import { useWords } from './words';

/** YAPE'S OWN MARK. Large, on the stage, it is Yape's app icon — the purple square with the
 *  «S/» bubble and the script name, the picture a shopkeeper taps every day — from
 *  `app/public/connection-brands/yape-icon.webp` (126 px, drawn at 60 CSS px so it keeps two source
 *  pixels per CSS pixel; provenance in that folder's README). Peter, 20 September: «the Yape and
 *  Plin logos need to be in the right place… You shouldn't make up other stuff», so the name set
 *  in this app's type, which stood here while the repository held only a 72 px favicon, is gone
 *  from the stage. Small, inside a line of text, it stays a word. */
function YapeMark({ large = false }: { large?: boolean }) {
  const [css, theme] = useStyletron();
  if (large) {
    return (
      <img data-testid="yape-mark" src="/connection-brands/yape-icon.webp" alt="Yape"
        width={60} height={60}
        className={css({
          display: 'block', width: '60px', height: '60px',
          borderTopLeftRadius: theme.borders.radius400, borderTopRightRadius: theme.borders.radius400,
          borderBottomLeftRadius: theme.borders.radius400, borderBottomRightRadius: theme.borders.radius400,
        })} />
    );
  }
  return (
    <span data-testid="yape-mark" className={css({
      display: 'inline-flex', alignItems: 'center',
      color: YAPE.onPurple,
      ...theme.typography.LabelSmall,
    })}>Yape</span>
  );
}

export default function Yape() {
  const [css, theme] = useStyletron();
  const { w } = useWords();
  const still = useStillness();
  const [draft] = React.useState(() => readDraft());
  const [digits, setDigits] = React.useState('');
  const [qr, setQr] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [connected, setConnected] = React.useState(false);
  const [says, setSays] = React.useState('');
  const chooser = React.useRef<HTMLInputElement | null>(null);
  /* THE PURPLE ARRIVES OUT OF THE ACT, once, on the first paint after the screen lands. */
  const revealed = useEntered(120);

  React.useEffect(() => { markReached('yape'); }, []);

  React.useEffect(() => {
    if (!qr) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(qr);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [qr]);

  const onward = () => goTo(sellsOnward(draft.kind) ? 'owed' : 'referrals');
  const steps = stepsFor(sellsOnward(draft.kind));

  /** ONLY A REFUSAL THE SHOP CAN ACT ON HOLDS THE SHOP.
   *
   * ⚠ THIS SCREEN ONCE DEAD-ENDED THE WALK. Every `/api/bodega/*` call answers 401 where no
   * connection service minted the session — local development, every drive, every review build —
   * and a 401 is `again`, not `awaiting`. So the one branch that carried on never ran, and the
   * shop stood on screen 7 for ever reading «Connect your WhatsApp to continue.» under a WhatsApp
   * it had just connected. Every other screen of the walk carries on through exactly this answer
   * (`start/address.tsx` falls to the sample place, `useWaitlist` to the sample place), and this
   * one now follows the same rule, told apart by the service's own machine word rather than by
   * its sentence: `bodega_yape_number_unreadable` is about the nine digits the shop typed and
   * `bodega_yape_qr_*` about the photo it chose — both are its own work to fix — and anything
   * else is about the rig, which is nothing a shopkeeper can do at a counter. */
  const shopsOwnRefusal = (code: string): boolean =>
    code === 'bodega_yape_number_unreadable' || code.startsWith('bodega_yape_qr_');

  const connect = async () => {
    if (!yapeReady(digits)) { setSays(w.yapeAsk); return; }
    setSaving(true);
    const answer = await writeYape(yapeE164(digits), qr);
    setSaving(false);
    if (!answer.ok && shopsOwnRefusal(answer.code)) {
      /* THE SERVICE'S OWN SENTENCE: it knows what it refused, and the shop can fix it here. */
      setSays(answer.says);
      return;
    }
    setSays('');
    setConnected(true);
    /* THE CHIP GOES ON THE PASS. The shop sees it on the next card it is shown, which is what
       makes connecting a Yape a thing that HAPPENED rather than a form that was submitted
       (`start/pass.tsx`). */
    writeDraft({ ...draft, yape: true });
    tap(still, 16);
    window.setTimeout(onward, still ? 0 : 700);
  };

  return (
    <WalkScreen
      testId="start-yape"
      step="yape"
      steps={steps}
      stage="yape"
      visual={
        /* ⚠ THE SEAT SHOWS WHAT THE SHOP HAS GIVEN, AND NOTHING ELSE. It once printed the field's
           own placeholder — `+51 987 654 321` — in HeadingMedium, in the seat where the connected
           number stands, so the example and the real thing were the same picture. The room is the
           QR's instead: a square that holds the photo the moment one is chosen, with the number
           under it once it is typed. */
        <div data-testid="yape-field" data-revealed={revealed ? 'yes' : 'closed'}
          className={css({
            boxSizing: 'border-box',
            display: 'grid', gap: theme.sizing.scale600, justifyItems: 'center',
            alignContent: 'center',
            height: '100%', minHeight: 0,
            paddingTop: theme.sizing.scale600,
            paddingBottom: theme.sizing.scale800,
            paddingLeft: theme.sizing.scale600,
            paddingRight: theme.sizing.scale600,
            /* THE GROUND IS YAPE'S OWN PURPLE (`walk.tsx`, the `yape` stage tone), and this is the
               lift on it: a light from where the mark stands, mixed off the brand's own two. */
            backgroundImage: yapeLift(),
            /* THE CIRCULAR REVEAL, out of where the act stands */
            clipPath: revealed || still ? 'circle(150% at 50% 120%)' : 'circle(0% at 50% 120%)',
            transitionProperty: 'clip-path',
            transitionDuration: still ? '0ms' : '620ms',
            transitionTimingFunction: 'cubic-bezier(.2,.8,.3,1)',
          })}>
          <YapeMark large />
          {/* THE QR'S OWN TILE — white, rounded, and lying at a slight angle until the number is
              one Yape would accept, when it squares up. A card tossed on a counter, straightened
              the moment it is right. */}
          <div data-testid="yape-qr-seat" data-given={qr ? 'yes' : 'open'}
            data-square={yapeReady(digits) ? 'yes' : 'tilted'}
            className={css({
              boxSizing: 'border-box',
              display: 'grid', placeItems: 'center',
              width: '164px', height: '164px',
              padding: theme.sizing.scale400,
              borderRadius: theme.borders.radius500,
              backgroundColor: YAPE.onPurple,
              color: theme.colors.contentPrimary,
              boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
              overflow: 'hidden',
              transform: yapeReady(digits) || still ? 'rotate(0deg)' : 'rotate(-4deg)',
              transitionProperty: 'transform',
              transitionDuration: still ? '0ms' : `${MS.land}ms`,
              transitionTimingFunction: SPRING.land,
            })}>
            {preview
              ? <img src={preview} alt="" data-testid="yape-qr-preview" width={148} height={148}
                className={css({
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  borderRadius: theme.borders.radius300,
                  animationName: still ? undefined : { '0%': { transform: 'scale(0.4)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
                  animationDuration: `${MS.land}ms`,
                  animationTimingFunction: SPRING.land,
                })} />
              : <QrCode size={92} strokeWidth={1.4} aria-hidden />}
          </div>
          <span data-testid="yape-shown" data-given={digits ? 'yes' : 'open'} className={css({
            ...theme.typography.HeadingMedium, fontVariantNumeric: 'tabular-nums',
            color: YAPE.onPurple,
            minHeight: theme.sizing.scale900,
          })}>{digits ? `+51 ${yapeWords(digits)}` : ''}</span>
        </div>
      }
      title={w.yapeTitle}
      sentence={w.yapeSentence}
      note={says ? <span data-testid="yape-says">{says}</span> : undefined}
      act={<WalkAct testId="yape-connect" isLoading={saving} onClick={() => { void connect(); }}>
        {connected
          ? <span className={css({ display: 'inline-flex', alignItems: 'center', gap: theme.sizing.scale300 })}>
            <DrawnTick size={20} still={still} />{w.yapeConnected}
          </span>
          : w.yapeConnect}
      </WalkAct>}
      quiet={<WalkQuiet testId="yape-skip" onClick={onward}>{w.skip}</WalkQuiet>}
    >
      <Input value={yapeWords(digits)} placeholder="987 654 321"
        aria-label={w.yapeField}
        onChange={(event) => setDigits(yapeDigits(event.currentTarget.value))}
        startEnhancer={() => <span className={css({ ...theme.typography.LabelMedium, color: theme.colors.contentSecondary })}>+51</span>}
        onFocus={(event) => {
          window.setTimeout(() => event.target.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' }), 260);
        }}
        overrides={{
          Input: {
            props: {
              'data-testid': 'yape-number', inputMode: 'numeric', enterKeyHint: 'done',
              autoComplete: 'tel-national', pattern: '[0-9 ]*',
            },
          },
          Root: { style: { minHeight: '56px' } },
        }} />

      {/* THE QR COMES OFF THE PHONE — a photo of the counter's own QR, or the screenshot the Yape
          app makes of it. The chooser takes both; `capture` is left off so the camera roll is the
          first offer, which is where a screenshot lives. */}
      <input ref={chooser} type="file" accept="image/png,image/jpeg,image/webp" hidden
        data-testid="yape-qr-input"
        onChange={(event) => { setQr(event.currentTarget.files?.[0] ?? null); setSays(''); }} />
      <WalkQuiet testId="yape-qr-add" onClick={() => chooser.current?.click()}>
        <span className={css({ display: 'inline-flex', alignItems: 'center', gap: theme.sizing.scale300 })}>
          <ImagePlus size={18} aria-hidden />{qr ? w.yapeChangeQr : w.yapeAddQr}
        </span>
      </WalkQuiet>
      {qr && <p data-testid="yape-qr-name" className={css({
        ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary, margin: 0, overflowWrap: 'anywhere',
      })}>{qr.name}</p>}
    </WalkScreen>
  );
}

export const meta = { id: 'yape', title: 'Connect your Yape', owner: 'BODEGA-START', panes: false };
