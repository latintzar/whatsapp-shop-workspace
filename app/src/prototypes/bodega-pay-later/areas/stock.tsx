/* PRODUCTS — MADE FROM THE ORDERS (DESIGN-SPEC.md §3 · §7 item 13).
 *
 * Peter, FEED-IA §268: «inventory would be made smartly based on their orders.» So nobody types a
 * catalogue here. The thirty rows are the goods the read found in the shop's own order lines and
 * the shop reviewed, shelved the way a bodega is shelved, and each one carries two things: a LEVEL
 * and a FACE.
 *
 * ═══ THE LEVEL IS THE LAST COUNT PLUS OR MINUS THE MOVEMENT SINCE ════════════════════════════
 * `StockLevel` (`rocoto/stock-announcement`) draws it with its date and its unit, and its own note
 * line names the count the figure was reckoned from — `Last count 14 Sep`. Under it the movement:
 * what arrived off supplier lines, what left off sales. `StockAnnouncement` is how the shop DECLARES
 * one, on the product's own sheet: the same typed number means «this is what we have» on one tab and
 * «this is what just arrived» on the other, and the panel says which.
 *
 * ═══ THE FACE WALKS FOUR RUNGS, AND SAYS WHICH ONE ANSWERED ══════════════════════════════════
 * `paintingFor(name)` → `ProductFace` → the `ProduceIcon` family mark, with `painting-peru.ts`
 * holding the ten whole-name Peru lines between them. Counted live over these thirty names, the
 * reading is 13 painted as they stand · 10 on a Peru line · 1 held out · 6 waiting for paint — the
 * same tally `fixtures/cast-bodega.json` `faces.tally` recorded on 18 September, and the screen
 * prints what it counted rather than what the file says, so the two can disagree out loud.
 *
 * ═══ AND A MARK ASKS FOR ITS OWN TILE, ONCE ══════════════════════════════════════════════════
 * Peter: «on the spot illustraion matchingn and ideogram generayion». A product standing on the
 * family mark asks `POST /api/artwork` through `product-face-request.ts` and prints the road's own
 * named answer. While the house holds no `IDEOGRAM_API_KEY` and no `ARTWORK_SHARED_SECRET` that
 * answer is a refusal by name, and the mark keeps standing — which is the posture this surface
 * states in words rather than hiding.
 *
 * ═══ A PRICE LIVES NOWHERE ON THIS SURFACE ═══════════════════════════════════════════════════
 * One shop sells at one price, the tarifa is out of this candidate entirely, and the chat corpus the
 * catalogue was built from states quantities, days and names. So a product carries a name, a shelf,
 * a level and a face, and carries a figure of money nowhere.
 *
 * ROUTES  `#/stock` the catalogue · `#/stock/<id>` one product's sheet.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SHAPE, SIZE } from 'baseui/button';
import { Input } from 'baseui/input';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import Page from '../../cedar/shell/page';
import { LIST_FLOOR, SHEET_SNUG, usePhone, useStacked } from '../../cedar/shell/viewport';
/* ONE COLUMN OF WORK, SAID OUT LOUD. `App.tsx`'s route meta declares `panes: true` for this area —
   Cedar's master-detail default — and the frame reads that as «pad nothing, clamp nothing», which
   at 1280 ran the catalogue's rows flush against the right edge of the window and cut the shelf
   head's own count off. This surface pushes the sheet over the list instead of standing the two
   side by side, so it says what it is DRAWING and the frame gives it the reading column. The day
   the two real panes land, this line comes out. */
import { usePanes } from '../shell/frame';
import { ProduceIcon } from '../../../rocoto/produce-icons';
import { StockAnnouncement, StockLevel, MODE, type Mode, type StockSubmission } from '../../../rocoto/stock-announcement';
import { products } from '../cast';
import { SOURCE_WORD, useChatSource } from '../source';
/* THE COVER, ON THIS AREA'S FIRST OPEN. `covers.tsx` owns the picture, the words, the once-only
   book and the gate together — «the one line an area writes» — so the area writes that line and
   decides nothing about it. */
import { AreaCover } from '../covers';
import {
  HELD_OUT_REASON, HOW_WORDS, faceCatalogue, tallyOver, type Faced,
} from '../painting-peru';
import { useFaceRequest } from '../product-face-request';

export const meta = { id: 'stock', title: 'Products', owner: 'BODEGA-STOCK', panes: true };

/* ── the shelves, in the order a bodega is walked ─────────────────────────────────────────── */

const SHELVES = ['Abarrotes', 'Fresh', 'Produce', 'Drinks', 'Home'] as const;

/** ── THE SHELF'S WORD, IN ONE REGISTER (QA 44) ─────────────────────────────────────────────
 *  The world file writes a shelf as the shop says it, and `Abarrotes` stood among four English
 *  heads on a screen whose H1, body and counts are all English — one Spanish word in a list of
 *  five, which reads as an oversight rather than as the shop's voice. This build prints English,
 *  so the shelf does too; the shop's own nouns come back whole with the Spanish build, from this
 *  one map. The KEY is the data and never moves: `cast-bodega.json` and `painting-peru.ts`'s
 *  `SHELF_FAMILY` both file goods under `Abarrotes`. */
const SHELF_WORD: Record<string, string> = {
  Abarrotes: 'Dry goods',
  Fresh: 'Fresh',
  Produce: 'Produce',
  Drinks: 'Drinks',
  Home: 'Home',
};

/** The word a shelf is drawn with, with the world file's own as the fallback. */
const shelfWord = (shelf: string): string => SHELF_WORD[shelf] ?? shelf;

/** ── ONE STAMP GRAMMAR (QA 23 · QA 54) ─────────────────────────────────────────────────────
 *  The panel's own stamp read «As of Sep 19, 10:24 PM» — month before day and a twelve-hour
 *  clock, on a screen whose every other hour is 07:05, 12:30, 16:45. `en-PE`'s own ICU data
 *  renders the US order, so the grammar is stated here rather than delegated: a day in a fact is
 *  «19 Sep» and a time is 24-hour, which is what every other surface in this prototype prints. */
/** ── THE LOCALE THE CLOCK AND THE CALENDAR ARE READ IN (QA 23 · QA 54) ─────────────────────
 *  The workspace is Peruvian, and `en-PE`'s own CLDR data renders the US forms: «Sep 19» and
 *  «11:11 PM». This app writes 07:05, 12:30, 16:45 and «Saturday 19.09» everywhere else, so the
 *  kit's own `formatTime`/`formatStamp` are given the locale whose forms match the house's —
 *  day first, 24-hour. The figures read identically under both. */
const CLOCK = 'en-GB';

const stampWords = (at: Date): string => {
  const day = at.toLocaleDateString(CLOCK, { day: 'numeric', month: 'short' }).replace('Sept', 'Sep');
  const time = at.toLocaleTimeString(CLOCK, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} · ${time}`;
};

/** The day the counting was last done, which is the date every level is reckoned from (§6). */
const LAST_COUNT = 'Last count 14 Sep';

/* ── THE LEVEL, DERIVED AND REPRODUCIBLE ──────────────────────────────────────────────────────
 * `fixtures/cast-bodega.json` `rules.derived`: every generated figure is a pure function of its
 * row's own index, so the same morning returns on every reload. The counts below are SEEDED — the
 * world file states a product's name, its shelf and its face, and says a quantity nowhere — so they
 * are derived here from the name itself and the surface says they are seeded.
 */
const KILO = /papa|cebolla|tomate|limon|palta|platano|papaya|pollo|queso/;

const seed = (name: string): number => {
  let out = 0;
  for (let i = 0; i < name.length; i += 1) out = (out * 31 + name.charCodeAt(i)) % 9973;
  return out;
};

export type Level = {
  /** what the 14 September count wrote down */
  counted: number;
  /** what came in off supplier lines since */
  arrived: number;
  /** what left off sales since */
  left: number;
  /** the count plus or minus the movement — the number the row draws */
  standing: number;
  unit: string;
  decimals: number;
};

export function levelOf(name: string): Level {
  const n = seed(name);
  const kilos = KILO.test(name.toLowerCase());
  const counted = kilos ? 6 + (n % 22) : 8 + (n % 54);
  const arrived = kilos ? 4 + (n % 15) : 6 + (n % 40);
  const left = kilos ? 3 + ((n >> 3) % 17) : 5 + ((n >> 3) % 44);
  return {
    counted,
    arrived,
    left,
    standing: Math.max(counted + arrived - left, 0),
    unit: kilos ? 'kg' : 'units',
    decimals: 0,
  };
}

/** THE ONE LINE UNDER THE COUNT: what moved, and which way. It read «23 in · 5 out since the
 *  count» and wrapped to a second line on every row at 393 — looked at — and the three words it
 *  wrapped for are already said by the note directly above it, which names the count and its date.
 *  So the line says the movement and stops, and the sheet spells both halves out in full. */
const movementWords = (level: Level): string => `${level.arrived} in · ${level.left} out`;

/** The world file writes its reasons in the repository's own backticked prose; a screen reads
 *  words. */
const plainly = (words: string): string => words.replace(/`/g, '');

/** What the painting road's posture is called, one title per state. */
const POSTURE_TITLE: Record<'asking' | 'painted' | 'refused', string> = {
  asking: 'Its tile is being asked for',
  painted: 'Its tile arrived',
  refused: 'Its tile waits',
};

/* ── THE FACE SEAT ───────────────────────────────────────────────────────────────────────────
 * One box, one size, one quiet ground, and whatever resolved inside it on `contain`. A tile carries
 * its own white, so the ground comes off where a painting is drawn and stays where the drawn mark
 * stands — Cedar's own `ProductFace` construction, rebuilt on this prototype's own resolver so the
 * ten Peru lines are inside the walk rather than beside it.
 */
export function ProductFace({ of, size = 36 }: { of: Faced; size?: number }) {
  const [, theme] = useStyletron();
  const painted = of.resolved.src;
  return (
    <span
      aria-hidden="true"
      data-face={painted ? 'painting' : 'mark'}
      data-face-how={of.resolved.how}
      style={{
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        flex: '0 0 auto',
        borderRadius: theme.borders.radius200,
        /* ── ONE BOX FOR BOTH RUNGS (QA 35) ────────────────────────────────────────────────
           A painted tile drew on nothing and a family mark drew inside a grey rounded card, so
           one list held two objects: «arroz extra» a bare 40px transparent tile beside «papa
           blanca» in a 44px grey card whose mark read as a broken image, each starting at a
           different x. They are the same thing at two rungs of one ladder, so they take the same
           seat: the same width, the same ground, the same radius — and the fallback then reads
           as a drawing rather than as a failure. The ground is PAPER, as `detail.tsx`'s seat is:
           the painted tiles are opaque white, so a grey seat would show only under the marks. */
        background: theme.colors.backgroundPrimary,
        overflow: 'hidden',
      }}
    >
      {painted ? (
        <img
          src={painted}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      ) : (
        /* THE MARK TAKES THE SEAT IT IS GIVEN. A 20 px drawing inside a 64 px box read as a speck
           on the sheet's own head — looked at, at 393 — so the seat picks the step that fills it. */
        <ProduceIcon family={of.family} size={size >= 56 ? 'large' : size >= 36 ? 'compact' : 'mini'} />
      )}
    </span>
  );
}

/* ── the catalogue row ────────────────────────────────────────────────────────────────────── */

/* THE NAME OF THE THING SURVIVES THE NARROWEST PHONE. `LevelName` and `Note` carry the kit's own
   `ellipsis`, and the floor of zero above hands the width back to the column by cutting them: on a
   288 px cell at 320 the name column measured about 74 px, so the catalogue read «arroz ex…»,
   «azúcar r…», «aceite v…», with the count line cut mid-date at «Last count 1…» — looked at, at
   320. A row whose subject is unreadable says nothing, so both lines WRAP here: the row grows a
   line taller on the narrowest phone, every name stands whole, and the figure and the 44 px
   chevron keep their seats. The break is a last resort the measurement below keeps out of reach. */
const WRAPS = {
  style: {
    whiteSpace: 'normal' as const,
    overflow: 'visible' as const,
    textOverflow: 'clip' as const,
    overflowWrap: 'break-word' as const,
  },
};

/* AND THE NAME BREAKS AT A SPACE, NEVER INSIDE A WORD (DESIGN-SPEC.md §8). Wrapping alone left the
   identity column at 79 px on a 288 px cell, and two of the thirty names carry a word wider than
   that — «evaporada» at 81 px, «detergente» at 82 px — so those two would have broken mid-word.
   Measured, at 320, over all thirty rows. The row's own padding and its gaps are what the name is
   short of, so at the narrowest phone the row spends less on them: the identity column comes out
   at 101 px, wider than the longest word any name holds, and the figure and chevron keep the seats
   the spec gives them. The wider phone keeps the kit's own spacing. */
const NARROW = '@media (max-width: 360px)';

function CatalogueRow({ of, onOpen }: { of: Faced; onOpen: () => void }) {
  const level = levelOf(of.name);
  return (
    <StockLevel
      name={of.name}
      trail={level.standing}
      unit={level.unit}
      decimals={level.decimals}
      locale={CLOCK}
      evidence={{ kind: 'document', label: LAST_COUNT }}
      onOpenEvidence={onOpen}
      evidenceLabel={`Open ${of.name}`}
      overrides={{
        /* THE ROW MUST FIT THE COLUMN IT IS IN. `LevelRoot` is `width: 100%` with its own padding,
           so on a 361 px column it measured 377 and pushed its chevron off the right gutter —
           looked at, at 393. The border box is what makes «100%» mean the column. And a grid item
           keeps `min-width: auto`, so the row still grew to its min-content — the name and «Last
           count 14 Sep» both carry `white-space: nowrap` — and on a 288 px cell at 320 every row
           measured 341, taking 24 px of the 44 px chevron off the screen under `overflow-x: clip`.
           A floor of zero hands the width back to the column, and `WRAPS` above keeps the name
           whole in the width it is given. */
        Root: {
          style: ({ $theme }) => ({
            boxSizing: 'border-box',
            minWidth: 0,
            [NARROW]: {
              gap: $theme.sizing.scale300,
              paddingLeft: $theme.sizing.scale400,
              paddingRight: $theme.sizing.scale300,
            },
          }),
        },
        Mark: { component: () => <ProductFace of={of} size={36} /> },
        Name: WRAPS,
        Note: WRAPS,
        /* INTX-12 · a row's one control is a thumb target, so the chevron takes the floor. */
        Evidence: { style: { minWidth: '44px', minHeight: '44px' } },
      }}
    >
      <Movement level={level} />
    </StockLevel>
  );
}

function Movement({ level }: { level: Level }) {
  const [, theme] = useStyletron();
  return (
    <span
      data-movement="since-the-count"
      style={{ ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary }}
    >
      {movementWords(level)}
    </span>
  );
}

/* ── the shelf head ───────────────────────────────────────────────────────────────────────── */

function ShelfHead({ shelf, held }: { shelf: string; held: number }) {
  const [, theme] = useStyletron();
  return (
    <div
      data-shelf={shelf}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: theme.sizing.scale400,
        paddingTop: theme.sizing.scale600,
        paddingBottom: theme.sizing.scale300,
        borderBottom: `1px solid ${theme.colors.contentPrimary}`,
        /* THE HEAD IS THE PAGE'S OWN GROUND, so only the rule under it reads. Painted on the
           secondary step it came out as a filled grey band across the column once the frame moved
           the page onto paper — looked at, at 393 and 1280. It still has to be OPAQUE, because a
           sticky head with rows sliding under it is the one place transparency destroys. */
        background: theme.colors.backgroundPrimary,
        minWidth: 0,
      }}
    >
      <h2 style={{ margin: 0, ...theme.typography.HeadingXSmall }}>{shelfWord(shelf)}</h2>
      <span style={{ ...theme.typography.ParagraphXSmall, color: theme.colors.contentTertiary }}>
        {held} {held === 1 ? 'product' : 'products'}
      </span>
    </div>
  );
}

/** HOW TALL THE PANES ARE — the room left under the chrome, measured rather than assumed, which
 *  is the same reading `areas/prep.tsx` takes for its own two panes. */
function useBoxHeight(ref: React.RefObject<HTMLElement | null>): number | null {
  const [height, setHeight] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    const read = () => {
      const top = ref.current?.getBoundingClientRect().top;
      if (top === undefined) return;
      setHeight(Math.max(0, Math.round(window.innerHeight - top)));
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [ref]);
  return height;
}

/* ── the tail this area reads ─────────────────────────────────────────────────────────────── */

/** `#/stock/<id>` is this area saying something about one of its own rows (App.tsx's own rule). */
function useProductTail(): string | null {
  const read = () => {
    const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    return parts[0] === 'stock' && parts[1] ? decodeURIComponent(parts[1]) : null;
  };
  const [tail, setTail] = React.useState<string | null>(read);
  React.useEffect(() => {
    const on = () => setTail(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return tail;
}

/* ── one product's sheet ──────────────────────────────────────────────────────────────────── */

function ProductSheet({ of, back = true }: { of: Faced; back?: boolean }) {
  const [, theme] = useStyletron();
  const phone = usePhone();
  const level = levelOf(of.name);
  const mark = of.resolved.src === null;
  const request = useFaceRequest(of.name, of.family, mark);
  const [mode, setMode] = React.useState<Mode>(MODE.now);
  const [typed, setTyped] = React.useState(String(level.standing));
  const [declared, setDeclared] = React.useState<StockSubmission | null>(null);
  const standing = declared
    ? declared.result
    : level.standing;

  return (
    <section
      data-testid="product-sheet"
      data-product={of.id}
      style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale700 }}
    >
      {/* THE WAY BACK BELONGS TO THE PUSH MODEL. Beside the catalogue on a desk the list is
          already on screen, so a «Products» button would be a control that changes nothing. */}
      {back && (
        <div style={{ alignSelf: 'flex-start' }}>
          <Button
            kind={KIND.tertiary}
            size={SIZE.compact}
            startEnhancer={() => <ArrowLeft size={18} aria-hidden />}
            onClick={() => { window.location.hash = '#/stock'; }}
          >
            Products
          </Button>
        </div>
      )}

      {/* ── THE HEAD NAMES THE PRODUCT, AND THE PICTURE STANDS IN THE CARD NAMED FOR IT (QA 23)
          «Its picture» held no picture — the face was up here — and «Its picture» / «Its level»
          are headings a stranger cannot decode with the section covered. So the head is the name,
          the shelf and the level, and the picture is inside `Picture`, drawn once. */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale100, minWidth: 0 }}>
        <h1 style={{ margin: 0, ...theme.typography.HeadingMedium }}>{of.name}</h1>
        <span style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}>
          {shelfWord(of.shelf)} · {standing} {level.unit}
        </span>
      </header>

      <Block title="Picture">
        <ProductFace of={of} size={phone ? 96 : 120} />
        {/* THE WORLD FILE'S OWN REASON, where it wrote one; the review's reason where it left it to
            this map. One of the two, so the sheet says a thing once.
            ⚠ `HOW_WORDS` AND THE TILE'S FILE NAME LEFT THIS CARD (QA 23). «Painted in the library
            as it stands» and «Tile · arroz» are the artwork pipeline's own words on a shopkeeper's
            screen: they name a library, a resolver rung and a file, none of which she has. The
            tally behind the header carries the same facts for whoever is building the library. */}
        <p style={{ margin: 0, ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}>
          {plainly(of.why ?? (of.resolved.how === 'held out' ? HELD_OUT_REASON : ''))}
        </p>
        {mark && (
          <div
            data-artwork-posture={request?.state ?? 'idle'}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.sizing.scale300,
              padding: theme.sizing.scale500,
              borderRadius: theme.borders.radius300,
              background: theme.colors.backgroundSecondary,
            }}
          >
            <span style={{ ...theme.typography.LabelSmall }}>{POSTURE_TITLE[request?.state ?? 'asking']}</span>
            <span style={{ ...theme.typography.ParagraphSmall, color: theme.colors.contentSecondary }}>
              {request?.state === 'refused'
                ? request.words
                : request?.state === 'painted'
                  ? 'The house described a library tile of the same family and swapped the subject.'
                  : 'Rocoto is asking the house to paint one.'}
            </span>
            {request?.state === 'refused' && (
              <span
                data-artwork-code={request.code}
                style={{ ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary }}
              >
                POST /api/artwork · {request.code}
              </span>
            )}
            <div>
              <Button kind={KIND.secondary} size={SIZE.compact}>Add photos</Button>
            </div>
          </div>
        )}
      </Block>

      <Block title="Stock level">
        <StockLevel
          name={of.name}
          trail={level.standing}
          declared={declared ? declared.result : undefined}
          declaredAt={declared ? declared.at : undefined}
          unit={level.unit}
          decimals={level.decimals}
          locale={CLOCK}
          evidence={{ kind: 'document', label: LAST_COUNT }}
          overrides={{
            Root: { style: { boxSizing: 'border-box' } },
            Mark: { component: () => <ProductFace of={of} size={36} /> },
            Name: WRAPS,
            Note: WRAPS,
          }}
        >
          <Movement level={level} />
        </StockLevel>
        <StockAnnouncement
          onHand={standing}
          onHandNote={LAST_COUNT}
          unit={level.unit}
          decimals={level.decimals}
          locale={CLOCK}
          aria-label={`Announce ${of.name}`}
          mode={mode}
          onModeChange={({ mode: next }) => setMode(next)}
          value={typed}
          onChange={({ value }) => setTyped(value)}
          onSubmit={(submission) => setDeclared(submission)}
          /* ── THE TABS SAY WHAT THE NUMBER IS, IN THE SHOP'S OWN GRAMMAR (QA 23) ────────────
             The kit's defaults are first person — «I'm telling you how much we have now» — and
             «we» is the one pronoun VOICE rule 8 bans; at 393 each wrapped to three lines while
             at 1440 only the right one wrapped, so the pair sat unevenly at both widths. The
             component publishes `labels` for exactly this, so the constants stay the kit's. */
          labels={{ now: 'The count now', add: 'What just arrived' }}
          /* the same 320 reading as the row above: `On hand · Last count 14 Sep` came out as
             «On hand · Last count 1…» on the standing line, so the date this figure is reckoned
             from wraps rather than ending in an ellipsis.
             THE STAMP IS THE WORKSPACE'S GRAMMAR (QA 23 · QA 54) — see `stampWords`. */
          overrides={{
            StandingLabel: WRAPS,
            Stamp: {
              component: () => (
                <span style={{ ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary }}>
                  {declared ? `As of ${stampWords(declared.at)}` : ''}
                </span>
              ),
            },
          }}
        />
      </Block>

      {/* ── ONE HEADING, ONE SUBJECT (QA 23) ────────────────────────────────────────────────
          «Where it sits» carried the shelf AND the three movements the level is reckoned from,
          which is two questions under one label. Split, each heading names what is under it. */}
      <Block title="Shelf">
        <Fact label="Where it sits" value={shelfWord(of.shelf)} />
      </Block>

      <Block title="How the level was reached">
        <Fact label="Counted 14 Sep" value={`${level.counted} ${level.unit}`} />
        <Fact label="Arrived since" value={`${level.arrived} ${level.unit}`} />
        <Fact label="Sold since" value={`${level.left} ${level.unit}`} />
      </Block>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  const [, theme] = useStyletron();
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.sizing.scale500,
        padding: theme.sizing.scale600,
        background: theme.colors.backgroundPrimary,
        borderRadius: theme.borders.radius300,
        border: `1px solid ${theme.colors.borderOpaque}`,
      }}
    >
      <h2 style={{ margin: 0, ...theme.typography.HeadingXSmall }}>{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const [, theme] = useStyletron();
  return (
    <div style={{ display: 'flex', gap: theme.sizing.scale400, alignItems: 'baseline', flexWrap: 'wrap' }}>
      <dt style={{ minWidth: '120px', ...theme.typography.LabelXSmall, color: theme.colors.contentTertiary }}>{label}</dt>
      <dd style={{ margin: 0, ...theme.typography.LabelMedium }}>{value}</dd>
    </div>
  );
}

/* ── the area ─────────────────────────────────────────────────────────────────────────────── */

export default function Products() {
  const [css, theme] = useStyletron();
  const phone = usePhone();
  const stacked = useStacked();
  /* ── THE DESK IS LIST PLUS SHEET (QA 46) ──────────────────────────────────────────────────
     This area declared `panes: true` in the registry and then stood them down, so opening a row
     REPLACED the catalogue with a 776px sheet in the middle of an empty 1440px desk — the README
     recorded it as a known deviation and it is still what the founder sees. It declares what it
     draws now: two panes at the desk, the push model on a phone and at the stacked rung, where
     two honest panes do not fit. */
  usePanes(!phone);
  const source = useChatSource();
  const tail = useProductTail();
  const [query, setQuery] = React.useState('');

  const box = React.useRef<HTMLDivElement | null>(null);
  const boxHeight = useBoxHeight(box);

  const catalogue = React.useMemo(() => faceCatalogue(products), []);
  const tally = React.useMemo(() => tallyOver(products.map((p) => p.name)), []);
  /** The painting tally is a builder's reading, so it stands where a builder asks for it. */
  const facesShown = React.useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('faces') === '1',
    [],
  );

  const words = query.trim().toLowerCase();
  const shown = React.useMemo(
    () => (words ? catalogue.filter((p) => `${p.name} ${p.shelf}`.toLowerCase().includes(words)) : catalogue),
    [catalogue, words],
  );

  const open = tail ? catalogue.find((p) => p.id === tail) : undefined;
  /** the desk stands both panes; the phone and the stacked rung push one over the other */
  const panes = !phone && !stacked;

  const list = (
      <section
        data-testid="area-stock"
        style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale600, minWidth: 0 }}
      >
        <header style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale300 }}>
          <h1 style={{ margin: 0, ...theme.typography.HeadingMedium }}>What you sell</h1>
          <p style={{ margin: 0, maxWidth: '60ch', ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary }}>
            A product list built from your supplier orders.
          </p>
          {/* ── THE LINE SAYS WHAT THE SHOP HAS (QA 23) ──────────────────────────────────────
              It used to read «30 products · 13 painted · 10 on a Peru line · 7 on the family
              mark · Sample chats» — the artwork library's own vocabulary on the second line of
              the second-most-visited area. Those three counts are how the PAINTING is going, and
              the person who needs them is whoever is building the library, so they stand behind
              `?faces=1` and the shop reads the two facts that are about the shop. */}
          <p
            data-faces-tally
            style={{ margin: 0, ...theme.typography.ParagraphSmall, color: theme.colors.contentTertiary }}
          >
            {catalogue.length} products · {source ? SOURCE_WORD[source.kind] : 'Reading'}
            {facesShown && ` · ${tally.direct} painted · ${tally.peruMap} on a Peru line · ${tally.heldOut + tally.toPaint} on the family mark`}
          </p>
        </header>

        <Input
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search products"
          aria-label="Search products"
          clearable
          startEnhancer={() => <Search size={18} aria-hidden />}
          /* THE FIELD READS AS A FIELD ON THIS GROUND. Base's own input fill is the same step as
             `backgroundSecondary`, which is the area's ground, so the seat vanished into the page —
             looked at, at 393. Paper under it gives the search its own edge, and 48 px is the act
             bar's height. */
          overrides={{
            Root: { style: { minHeight: '48px', backgroundColor: theme.colors.backgroundPrimary } },
            Input: { style: { backgroundColor: theme.colors.backgroundPrimary } },
            StartEnhancer: { style: { backgroundColor: theme.colors.backgroundPrimary } },
          }}
        />

        {SHELVES.map((shelf) => {
          const rows = shown.filter((p) => p.shelf === shelf);
          if (rows.length === 0) return null;
          return (
            <div key={shelf} style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale300 }}>
              <ShelfHead shelf={shelf} held={rows.length} />
              {/* TWO ROWS ABREAST ONLY WHERE THE COLUMN IS WIDE (QA 46). The media query asks
                  the WINDOW, and with a product open the catalogue stands in a ~570px pane inside
                  a 1440px window — so it answered «two» and every second name broke mid-word
                  («atún en conserv a»). With the sheet open the list is one column, which is what
                  the room it actually has can hold. */}
              <div
                className={css({
                  display: 'grid',
                  gap: theme.sizing.scale300,
                  gridTemplateColumns: '1fr',
                  ...(open ? null : { '@media (min-width: 900px)': { gridTemplateColumns: '1fr 1fr' } }),
                })}
              >
                {rows.map((product) => (
                  <CatalogueRow
                    key={product.id}
                    of={product}
                    onOpen={() => { window.location.hash = `#/stock/${product.id}`; }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {shown.length === 0 && (
          <p style={{ margin: 0, ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary }}>
            Try another word — the catalogue holds {catalogue.length} products.
          </p>
        )}

        {!phone && !panes && (
          <div>
            <Button
              kind={KIND.tertiary}
              size={SIZE.compact}
              shape={SHAPE.default}
              endEnhancer={() => <ChevronRight size={18} aria-hidden />}
              onClick={() => { window.location.hash = `#/stock/${catalogue[0].id}`; }}
            >
              Open the first product
            </Button>
          </div>
        )}
      </section>
  );

  const sheet = open ? <ProductSheet of={open} back={!panes} /> : null;

  /* ── THE PUSH MODEL: one screen, one scroll ───────────────────────────────────────────── */
  if (!panes) {
    return (
      <Page title={meta.title}>
        <AreaCover area="stock" />
        {sheet ?? list}
      </Page>
    );
  }

  /* ── THE DESK: THE CATALOGUE LEFT, THE PRODUCT RIGHT (§38 · QA 46) ────────────────────────
     The same grammar Prep keeps: the page itself does not scroll, each pane is one scrollport,
     and the SHEET is what yields when the room runs short. A row is reachable from the keyboard
     because it is still the same `CatalogueRow` — a real control with a real focus ring — and
     opening one now moves the right-hand pane instead of taking the list away. */
  return (
    <Page title={meta.title} fill>
      <AreaCover area="stock" />
      <div
        ref={box}
        data-testid="stock-panes"
        data-open={open ? 'yes' : 'no'}
        style={{
          display: 'grid',
          gridTemplateColumns: open
            ? `minmax(${LIST_FLOOR}px, 1fr) minmax(0, ${SHEET_SNUG}px)`
            : 'minmax(0, 1fr)',
          height: boxHeight === null ? '100%' : `${boxHeight}px`,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <div
          data-testid="stock-list-pane"
          style={{
            minWidth: 0,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'clip',
            padding: `${theme.sizing.scale700} ${theme.sizing.scale700} ${theme.sizing.scale900}`,
            boxSizing: 'border-box',
          }}
        >
          {list}
        </div>
        {open && (
          <div
            data-testid="stock-sheet-pane"
            style={{
              minWidth: 0,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'clip',
              padding: `${theme.sizing.scale700} ${theme.sizing.scale700} ${theme.sizing.scale900}`,
              boxSizing: 'border-box',
              /* THE SEAM. One hairline and the quieter ground — the sheet is a pane of this
                 surface rather than a card standing on it. */
              borderLeft: `1px solid ${theme.colors.mono400}`,
              background: theme.colors.backgroundSecondary,
            }}
          >
            {sheet}
          </div>
        )}
      </div>
    </Page>
  );
}
