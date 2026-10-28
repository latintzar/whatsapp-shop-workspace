import * as React from 'react';
import { useStyletron } from 'baseui';

/* ── THE HERO REGISTER · A FULL-BLEED PICTURE AT THE TOP OF A DIALOG ──────────────────────────
 *
 * A COPY of Cedar's `feature-artwork.tsx` `HeroArtwork`, and a copy for one reason: the file root
 * is this prototype's own (`/bodega-artwork/` rather than `/cedar-artwork/`) and the seats are this
 * prototype's five. Cedar's file is left exactly as it stands; the 3D objects beside it — the
 * wallet, the telephone, the envelope — are still Cedar's set and are imported from there
 * (DESIGN-SPEC.md §5, §7 item 14).
 *
 * WHERE ONE BELONGS (DESIGN-SPEC.md §5, Peter's rule): where a flow starts, where a feature
 * introduces itself, or on a notice a person has to read — once, and rare on purpose. Lists,
 * sheets, steps and ledgers carry none. The five seats and their subjects are pinned in
 * ONBOARDING-SPEC.md §8 and in `app/public/bodega-artwork/README.md`:
 *
 *   arrival     the first screen after the link            bodega · the bodeguera at her counter
 *   referrals   the referral step, and Money → Suppliers you brought   produce stall · the crate
 *   money       Money, first open                          bodega · the bodeguera at her counter
 *   stock       Products, first open                       produce stall · bananas on the rail
 *   customers   Customers, first open                      bodega · three neighbours at the glass
 *
 * THE ALT TEXT IS EMPTY ON PURPOSE. The hero carries no fact the title below it lacks, so a screen
 * reader that announced it would read the picture twice. The title and the body are the content.
 *
 * ONE SCENE, TWO FRAMES, AND HERE BOTH FILES ARE CUT TO THEIR BAND. A phone sheet (≤ 559 px)
 * draws `hero-<seat>.png` at 16:9 as a full-width band (219 px at 393); the desk draws
 * `hero-<seat>-wide.png`, which is ALREADY a 3:1 cut of the same scene, in a 3:1 band. Cedar's
 * desk source is a 21:9 reframe the band has to crop; this set's desk source matches its band, so
 * nothing is lost on either width and each subject stands whole at both — which is why the subject
 * is composed in the middle of the frame in the first place.
 *
 * A HERO THAT HAS YET TO BE GENERATED TAKES NO ROOM. The slot stays in the document with the file
 * it expects, so a drive reads what a dialog is wired to; the moment the file is installed, the
 * picture appears at the top with nothing else to change. All five are installed today. */
export type HeroArtworkKind = 'arrival' | 'referrals' | 'money' | 'stock' | 'customers';

/** The five installed seats, each one file at 16:9 and one at 3:1 beside it.
 *
 * ⚠ MONEY DRAWS THE BODEGA'S OWN COUNTER (QA 55). `hero-money.png` is a FISH STALL — a fishmonger
 * in a blue apron over a counter of fish on ice — and the seeded world is «Bodega Yesenia», a
 * corner shop that sells arroz, aceite and palta. In one sitting the app claimed to be a corner
 * shop, a produce stall and a fishmonger. Money's subject is the shop's own money, and the scene
 * where that happens is the bodeguera at her glass counter with the phone in her hand, which is
 * what `hero-arrival` draws. So Money borrows that frame until a Money scene is drawn in this
 * shop's own trade; the fish file stays installed and unreferenced beside its own record in
 * `app/public/bodega-artwork/README.md`, which names it as the seat's pending re-draw. */
const HERO_FILE: Record<HeroArtworkKind, string> = {
  arrival: 'hero-arrival',
  referrals: 'hero-referrals',
  money: 'hero-arrival',
  stock: 'hero-stock',
  customers: 'hero-customers',
};

/** The root this prototype's covers are installed under — `app/public/bodega-artwork/`. */
export const HERO_ROOT = '/bodega-artwork/';

/** The desk frame is the 3:1 cut; below this width the phone sheet draws the 16:9 whole. */
const HERO_DESK_MIN_WIDTH = 560;

export const heroSource = (kind: HeroArtworkKind): string => `${HERO_ROOT}${HERO_FILE[kind]}.png`;
export const heroWideSource = (kind: HeroArtworkKind): string => `${HERO_ROOT}${HERO_FILE[kind]}-wide.png`;

/** `fill` HANDS THE PICTURE THE WHOLE ROOM IT STANDS IN rather than a band of its own ratio — the
 *  walk's upper part, where the picture is the elastic row and cropping to the phone is the point
 *  (ONBOARDING-SPEC.md §0). A dialog's band keeps its ratio and its collapse-until-drawn. */
export function HeroArtwork({ kind, fill = false }: { kind: HeroArtworkKind; fill?: boolean }) {
  const [css, theme] = useStyletron();
  /* The band claims its room only once the picture has decoded: a slot that opened at full height
     and collapsed on a 404 moved the whole dialog on every open (Cedar's hero review, 11 September).
     A filled room is definite already, so there is nothing to jump and the picture simply arrives. */
  const [drawn, setDrawn] = React.useState(false);
  const source = heroSource(kind);
  const wide = heroWideSource(kind);
  const band = css({
    margin: 0, width: '100%', minWidth: 0, flexShrink: 0, overflow: 'hidden',
    backgroundColor: theme.colors.backgroundSecondary,
    ...(fill
      ? { height: '100%', minHeight: 0 }
      : drawn
        ? { aspectRatio: '3 / 1', [`@media (max-width: ${HERO_DESK_MIN_WIDTH - 1}px)`]: { aspectRatio: '16 / 9' } }
        : { height: 0 }),
  });
  return <figure data-testid={`hero-${kind}`} data-hero={kind} data-hero-source={source} data-hero-wide={wide}
    data-hero-state={drawn ? 'drawn' : 'pending'} className={band}>
    <picture style={{ display: 'block', height: '100%' }}>
      <source media={`(min-width: ${HERO_DESK_MIN_WIDTH}px)`} srcSet={wide} />
      <img src={source} alt="" width={1024} height={576} decoding="async"
        onLoad={() => setDrawn(true)}
        onError={() => setDrawn(false)}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
    </picture>
  </figure>;
}
