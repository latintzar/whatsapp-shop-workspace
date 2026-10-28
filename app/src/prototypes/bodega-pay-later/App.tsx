/* THE ROUTER — Cedar's glob discipline, this candidate's four areas.
 *
 * AREAS REGISTER BY EXISTING. `areas/<id>.tsx` exporting `meta` and a default component is `#/<id>`,
 * discovered by glob, and THE FILE NAME IS THE ROUTE. The tail after the area belongs to the area,
 * so `#/prep/1642` and `#/money/record` are the same two surfaces reading their own address.
 *
 * FOUR REGISTRIES, FOUR WORLDS (DESIGN-SPEC.md §3):
 *
 *   ./areas/*.tsx        →  #/<area>          THE DESK       Prep · Money · Products · Customers
 *   ./areas/admin/*.tsx  →  #/admin/<seat>    ADMINISTRATION business · connections · app-settings · data
 *   ./start/*.tsx        →  #/start/<step>    ONBOARDING     the critical path, then orientation
 *   ./chat/index.tsx     →  #/chat            ROCOTO ON WHATSAPP the thread after sign-up, turn by turn
 *
 * A `*` crosses no slash, so the desk cannot discover an admin seat and a helper beside a route is
 * a helper. A route whose module has yet to land resolves to HOME, which is `prep`: the scaffold
 * carries the four areas, and the onboarding, administration and chat modules join it by existing
 * (ONBOARDING-SPEC.md §6, DESIGN-SPEC.md §7 items 5, 6 and 15).
 *
 * THE DESK NAVIGATION IS THE COPIED FRAME THE MOMENT IT LANDS. `shell/frame.tsx` is a copy this
 * candidate takes (DESIGN-SPEC.md §7 item 5) and it is landing beside this file, so it is reached
 * through a glob rather than an import: the frame draws the desk the day the file exists, and until
 * then the scaffold's own column stands with the imported `shell/bottom-nav.tsx`, Cedar's own row
 * drawn from these metas.
 *
 * THE SESSION IS A GATE (ONBOARDING-SPEC.md §2, WIRING-SPEC.md §1). The desk and Administration stand
 * behind it: a visitor holding none lands on `#/start`, which is the arrival. THE SESSION IS THE
 * WHATSAPP CONNECTION — the connection service binds an authorised account to the browser's own
 * session, so `useStanding` reads the page's record, then the rig's cookie, then the connection
 * itself. That last read is two network calls rather than one cookie read, which is why the gate
 * renders its own placeholder while `checking` stands. The onboarding walk and the chat simulation are
 * in front of the gate, and the walk itself ends by opening the shop.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import BottomNav, { BOTTOM_NAV_HEIGHT } from '../cedar/shell/bottom-nav';
import { usePhone } from '../cedar/shell/viewport';
import type { AreaMeta } from '../cedar/shell/area';
import { listaAsked, rememberReferral } from './start/joining';
import { useStanding } from './start/session';

/* ── the desk, stated once (DESIGN-SPEC.md §3) ─────────────────────────────────────────────── */

export type BodegaAreaId = 'prep' | 'money' | 'stock' | 'customers';

/** Prep replaces Sales and is where the app opens (FEED-IA §268: «sales shouldn't really be there.
 *  Sales should actually be turned into prep»). */
export const HOME: BodegaAreaId = 'prep';

export const RAIL_ORDER: BodegaAreaId[] = ['prep', 'money', 'stock', 'customers'];

export const AREA_TITLE: Record<BodegaAreaId, string> = {
  prep: 'Prep',
  money: 'Money',
  stock: 'Products',
  customers: 'Customers',
};

/** Administration keeps four seats, at Cedar's own routes; the other six and the `account` foot
 *  leave with the tariffs and the tier registry (DESIGN-SPEC.md §7 item 5). */
export const ADMIN = 'admin';
export const ADMIN_SEATS = ['business', 'connections', 'app-settings', 'data'] as const;
export type AdminSeatId = (typeof ADMIN_SEATS)[number];
export const isAdminSeat = (id: string): id is AdminSeatId =>
  (ADMIN_SEATS as readonly string[]).includes(id);

/** The onboarding steps, in the order ONBOARDING-SPEC.md §0 walks them. `#/start` is the arrival,
 *  and `start/walk.tsx`'s own `WALK` is the same list read from the walk's side. */
export const START_STEPS = [
  'arrival', 'connect', 'waitlist', 'business', 'address', 'orders', 'yape', 'owed', 'referrals', 'done',
] as const;
export type StartStep = (typeof START_STEPS)[number];

/** THE REFERRAL DOOR — `#/r/<code>`, the address a shared link carries (ONBOARDING-SPEC.md §0).
 *  The code is held for this browser and attributed the moment a session exists, which is the
 *  connection (`start/joining.ts`); the address itself becomes the arrival, so a reload lands
 *  where the person is standing rather than re-attributing. */
export const REFERRAL_DOOR = 'r';

/** THE STATUS PAGE — `#/lista/<CODE>`, and the `?lista=<CODE>` query the buddy's first message
 *  carries (ONBOARDING-SPEC.md §0). It is a QUERY on the way in because a link in a WhatsApp
 *  message is forwarded, shortened and previewed, and a hash survives none of that reliably; the
 *  page turns it into the route on the first render and then spends it (`start/joining.ts`).
 *  It stands IN FRONT OF THE SESSION GATE: a shop opens it on whatever phone the message landed
 *  on, holding no session at all. */
export const LISTA = 'lista';

/* ── the registries ───────────────────────────────────────────────────────────────────────── */

type Loader = () => Promise<{ default: React.ComponentType }>;
type RouteMeta = AreaMeta & { path: string };

const AREA_MODULES = import.meta.glob('./areas/*.tsx') as Record<string, Loader>;
const ADMIN_MODULES = import.meta.glob('./areas/admin/*.tsx') as Record<string, Loader>;
const START_MODULES = import.meta.glob('./start/*.tsx') as Record<string, Loader>;
const CHAT_MODULES = import.meta.glob('./chat/*.tsx') as Record<string, Loader>;
/** THE CUSTOMER'S OWN PAGE (`pay/link.tsx`), which is neither the desk nor the walk. */
const PAY_MODULES = import.meta.glob('./pay/*.tsx') as Record<string, Loader>;
const SHELL_MODULES = import.meta.glob('./shell/*.tsx') as Record<string, () => Promise<unknown>>;

/** The rail's contract, synchronous, so the navigation draws before a route module is fetched —
 *  Cedar's `route-meta.ts` reasoning, held in this file while the desk is four surfaces long. */
const DESK_ROUTE_META: RouteMeta[] = [
  { path: './areas/prep.tsx', id: 'prep', title: AREA_TITLE.prep, owner: 'BODEGA-PREP', panes: true },
  { path: './areas/money.tsx', id: 'money', title: AREA_TITLE.money, owner: 'BODEGA-MONEY', panes: false },
  { path: './areas/stock.tsx', id: 'stock', title: AREA_TITLE.stock, owner: 'BODEGA-STOCK', panes: true },
  { path: './areas/customers.tsx', id: 'customers', title: AREA_TITLE.customers, owner: 'BODEGA-CUSTOMERS', panes: true },
];

type Registered = { id: string; meta: AreaMeta; component: React.LazyExoticComponent<React.ComponentType> };

/** A stale path is a programmer error: it fails loudly here rather than quietly removing a place
 *  from the navigation. */
function register(routes: RouteMeta[], modules: Record<string, Loader>): Registered[] {
  return routes.map(({ path, ...meta }) => {
    const load = modules[path];
    if (!load) throw new Error(`Route module is missing: ${path}`);
    return { id: meta.id, meta, component: React.lazy(load) };
  });
}

const REGISTERED = register(DESK_ROUTE_META, AREA_MODULES);

const AREAS: AreaMeta[] = [
  ...RAIL_ORDER.map((id) => REGISTERED.find((m) => m.id === id)?.meta).filter(Boolean) as AreaMeta[],
  ...REGISTERED.filter((m) => !(RAIL_ORDER as string[]).includes(m.id)).map((m) => m.meta),
];

const COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = Object.fromEntries(
  REGISTERED.map((m) => [m.id, m.component]),
);

/** A module that has still to land yields nothing, and the route resolves to HOME. */
const lazyFrom = (
  modules: Record<string, Loader>,
  path: string,
): React.LazyExoticComponent<React.ComponentType> | undefined => {
  const load = modules[path];
  return load ? React.lazy(load) : undefined;
};

const ADMIN_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = Object.fromEntries(
  ADMIN_SEATS.map((seat) => [seat, lazyFrom(ADMIN_MODULES, `./areas/admin/${seat}.tsx`)])
    .filter(([, component]) => Boolean(component)) as [string, React.LazyExoticComponent<React.ComponentType>][],
);

const START_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = Object.fromEntries(
  START_STEPS.map((step) => [step, lazyFrom(START_MODULES, `./start/${step}.tsx`)])
    .filter(([, component]) => Boolean(component)) as [string, React.LazyExoticComponent<React.ComponentType>][],
);

const CHAT_COMPONENT = lazyFrom(CHAT_MODULES, './chat/index.tsx');
const LISTA_COMPONENT = lazyFrom(START_MODULES, './start/lista.tsx');
const PAY_COMPONENT = lazyFrom(PAY_MODULES, './pay/link.tsx');

/* ── routing ──────────────────────────────────────────────────────────────────────────────── */

export type Route =
  | { world: 'desk'; area: string }
  | { world: 'admin'; seat: string | null }
  | { world: 'start'; step: string }
  | { world: 'lista'; code: string }
  | { world: 'chat' }
  | { world: 'pay' };

/** READ THE HASH. `#/money/record` is Money reading its own tail; `#/start` is the arrival;
 *  `#/admin` is the world with the seat still to choose. */
export function readRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === ADMIN) return { world: 'admin', seat: parts[1] && isAdminSeat(parts[1]) ? parts[1] : null };
  if (parts[0] === 'start') return { world: 'start', step: parts[1] ?? 'arrival' };
  /* `#/lista/<CODE>` is the STATUS PAGE: its own world, in front of the session gate. */
  if (parts[0] === LISTA) return { world: 'lista', code: parts[1] ?? '' };
  if (parts[0] === 'chat') return { world: 'chat' };
  /* `#/pay/<id>` is the CUSTOMER's payment page: its own world, in front of the session gate. */
  if (parts[0] === 'pay') return { world: 'pay' };
  return { world: 'desk', area: parts[0] ?? '' };
}

/** WHICH PLACE A ROUTE IS, tail excluded — what the scroll reset keys on. */
const placeOf = (route: Route): string => {
  if (route.world === 'admin') return `admin/${route.seat ?? ''}`;
  if (route.world === 'start') return `start/${route.step}`;
  if (route.world === 'lista') return `lista/${route.code}`;
  if (route.world === 'chat') return 'chat';
  if (route.world === 'pay') return 'pay';
  return `desk/${route.area}`;
};

/** THE ORDER'S OLD ADDRESS. Cedar's object doors write `#/sales/<id>` — `cedar/anchors.tsx`'s
 *  `HOME_OF.order` — and this candidate turned Sales into Prep (FEED-IA §268), so a door pressed in
 *  a conversation or a chip would land on a route with no module and be sent to HOME with its id
 *  dropped. The address is REWRITTEN rather than aliased, so a reload, a back press and a copied
 *  link all reach the one place the order lives. Nothing else about the door changes. */
export const aliased = (hash: string, search: string = window.location.search): string | null => {
  const path = hash.replace(/^#\/?/, '');
  /* ── THE BUDDY'S FIRST LINK LANDS ON THE STATUS PAGE ─────────────────────────────────────
     `?lista=<CODE>` is what the buddy's own message carries, so it is read here and rewritten to
     the route. The page spends the query as it mounts (`start/joining.ts`, `dropListaQuery`),
     which is what stops a press leaving for the walk being pulled straight back here. */
  const asked = listaAsked(search);
  if (asked && !path.startsWith(`${LISTA}/`)) return `#/${LISTA}/${encodeURIComponent(asked)}`;
  /* ── A SHARED LINK LANDS ON THE ARRIVAL, CARRYING ITS CODE ───────────────────────────────
     `#/r/<code>` is what a business hands another business. The code is remembered for this
     browser and the address is rewritten to the walk's first screen, so the walk is the same one
     everybody sees and a reload attributes nothing twice (`start/joining.ts`). */
  if (path === REFERRAL_DOOR || path.startsWith(`${REFERRAL_DOOR}/`)) {
    const code = path.slice(REFERRAL_DOOR.length + 1).split('/')[0];
    if (code) rememberReferral(decodeURIComponent(code));
    return '#/start';
  }
  if (path === 'sales') return `#/${HOME}`;
  /* ── A SEAT THIS WORLD HAS NOT GOT LANDS ON THE WORLD (QA 25) ────────────────────────────
     `#/admin/team`, `#/admin/geography`, `#/admin/plan` — Cedar's seats, which this shop keeps
     none of — resolved to `seat: null` and then drew the FIRST seat while the address still said
     the one that was asked for. A person asked for one screen, got another, and was told nothing.
     The address is rewritten to the world itself, so what is drawn and what the bar reads are the
     same place, and a reload lands where the person is standing. */
  if (path.startsWith(`${ADMIN}/`)) {
    const seat = path.slice(ADMIN.length + 1).split('/')[0];
    if (seat && !isAdminSeat(seat)) return `#/${ADMIN}`;
  }
  /* A PAGE MINTED BEFORE THE CUSTOMER'S ROUTE LANDED still reaches it, so a link already sent on
     WhatsApp opens the payment page rather than the shop's Money. */
  if (path.startsWith('money/link/')) return `#/pay/${path.slice('money/link/'.length)}`;
  return path.startsWith('sales/') ? `#/${HOME}/${path.slice('sales/'.length)}` : null;
};

const useRoute = (): Route => {
  /* THE ALIAS IS READ ON THE FIRST RENDER TOO, or `#/sales/sonia` LOSES ITS ID. Read raw, the first
     route is `desk/sales`, which stands on no module — and the HOME redirect below fires in the same
     commit as the rewrite, replacing `#/prep/sonia` with a bare `#/prep`. Resolving the address here
     makes the first route `desk/prep`, so the module stands, the redirect keeps quiet, and the tail
     survives a pasted link. */
  const [route, setRoute] = React.useState<Route>(() => readRoute(aliased(window.location.hash) ?? window.location.hash));
  React.useEffect(() => {
    const on = () => {
      const moved = aliased(window.location.hash);
      /* the rewrite raises its own `hashchange`, which this listener answers with the new address */
      if (moved) { window.location.replace(moved); return; }
      /* ⚠ INSIDE A TRANSITION, SO THE SCREEN BEING LEFT STAYS ON THE PHONE while the next step's
         chunk lands. React holds the mounted tree rather than dropping to the Suspense fallback,
         which is what turned every tap of the walk into a blank white page on a slow connection.
         The press is answered by the act itself (`walk.tsx`'s `usePress`), so the wait reads as a
         button held down rather than as a page that went away. */
      React.startTransition(() => setRoute(readRoute(window.location.hash)));
    };
    on();
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  /* ARRIVING SOMEWHERE STARTS AT ITS TOP, and a tail is the same surface saying something about
     itself, so the reset fires on the place and on nothing else (Cedar's `App.tsx`, §98.3). */
  const place = placeOf(route);
  React.useLayoutEffect(() => {
    const port = document.scrollingElement ?? document.documentElement;
    if (port) port.scrollTop = 0;
  }, [place]);

  return route;
};

/** THE COMPONENT A ROUTE STANDS ON, or nothing where its module has still to land. */
function componentFor(route: Route): React.LazyExoticComponent<React.ComponentType> | undefined {
  if (route.world === 'desk') return COMPONENTS[route.area || HOME];
  if (route.world === 'admin') return route.seat ? ADMIN_COMPONENTS[route.seat] : ADMIN_COMPONENTS[ADMIN_SEATS[0]];
  if (route.world === 'start') return START_COMPONENTS[route.step];
  if (route.world === 'lista') return LISTA_COMPONENT;
  if (route.world === 'pay') return PAY_COMPONENT;
  return CHAT_COMPONENT;
}

function RouteLoading() {
  const [, theme] = useStyletron();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{ minHeight: '100%', color: theme.colors.contentSecondary, ...theme.typography.ParagraphSmall }}
    >
      Loading…
    </div>
  );
}

/**
 * THE WALK'S OWN WAIT — THE FRAME, WITH THE WORDS STILL TO LAND.
 *
 * ⚠ EVERY STEP IS A LAZY CHUNK, and the bare `Loading…` above blanked the phone on every tap:
 * white page, small grey word, top-left, no progress row and no bar at the foot. On a Lima
 * connection that was the dominant experience of the sign-up. Two things answer it, and this is
 * the second of them: where a fallback IS drawn — a deep link straight into a step, a cold cache —
 * it is the walk's own anatomy with its three rows, so what arrives fills a frame that is already
 * standing rather than replacing a blank page. The first is `useRoute`, which moves the walk
 * inside a transition so the OUTGOING screen stays on the phone while the next chunk lands, and
 * the third is `walk.tsx`'s `useWarmNext`, which fetches the next step on arrival at this one, so
 * by the time the act is pressed the chunk is usually already in the cache.
 */
function WalkLoading() {
  const [css, theme] = useStyletron();
  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Joining Rocoto"
      data-testid="walk-loading"
      className={css({
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        height: '100dvh',
        minHeight: '100dvh',
        width: '100%',
        minWidth: 0,
        backgroundColor: theme.colors.backgroundPrimary,
        overflow: 'hidden',
      })}
    >
      <div className={css({
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: theme.sizing.scale200,
        paddingTop: theme.sizing.scale500,
        paddingRight: theme.sizing.scale600,
        paddingBottom: theme.sizing.scale300,
        paddingLeft: theme.sizing.scale600,
      })}>
        {Array.from({ length: 7 }, (_unused, index) => (
          <span key={index} aria-hidden className={css({
            height: '4px',
            borderRadius: theme.borders.radius100,
            backgroundColor: theme.colors.backgroundTertiary,
          })} />
        ))}
      </div>
      <div aria-hidden className={css({
        minHeight: 0,
        margin: theme.sizing.scale600,
        borderRadius: theme.borders.radius500,
        backgroundColor: theme.colors.backgroundSecondary,
      })} />
      <div className={css({
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: theme.colors.borderOpaque,
        paddingTop: theme.sizing.scale500,
        paddingRight: theme.sizing.scale600,
        paddingLeft: theme.sizing.scale600,
        paddingBottom: `calc(${theme.sizing.scale500} + env(safe-area-inset-bottom, 0px))`,
      })}>
        <span aria-hidden className={css({
          display: 'block',
          minHeight: '56px',
          borderRadius: theme.borders.radius400,
          backgroundColor: theme.colors.backgroundTertiary,
        })} />
      </div>
    </section>
  );
}

function RouteContent({ component: Component, walk = false }: {
  component: React.LazyExoticComponent<React.ComponentType>;
  walk?: boolean;
}) {
  return <React.Suspense fallback={walk ? <WalkLoading /> : <RouteLoading />}><Component /></React.Suspense>;
}

/* ── the copied frame, reached through a glob ──────────────────────────────────────────────────
 * `shell/frame.tsx` carries the rail, the panes and the centred area name. It is a copy this
 * candidate takes, landing beside this file, and a glob takes a module that has yet to land as an
 * empty answer: `tsc` resolves nothing, the bundle grows by nothing, and the desk wears the frame
 * the day the file exists. Until then the scaffold's own column below stands, and the report says so.
 */
type FrameLike = React.ComponentType<{
  areas: AreaMeta[];
  current: string;
  children: React.ReactNode;
  world?: 'desk' | 'admin';
  tabs?: AreaMeta[];
  back?: string;
  backTitle?: string;
}>;

const FrameLazy = (() => {
  const load = SHELL_MODULES['./shell/frame.tsx'];
  if (!load) return null;
  return React.lazy(async () => {
    const module = (await load()) as { default?: FrameLike };
    return { default: module.default ?? (((props: { children: React.ReactNode }) => <>{props.children}</>) as FrameLike) };
  });
})();

/** Whether this build draws the copied frame — what a report and a drive can read. */
export const FRAME_INSTALLED = FrameLazy !== null;

/** THE COLUMN — Cedar's 1200 px desk container, 16 px gutters, and room above the phone's row.
 *  It stands while `shell/frame.tsx` is still to land. */
function Shell({ areas, current, inWorld, children }: {
  areas: AreaMeta[];
  current: string;
  inWorld: boolean;
  children: React.ReactNode;
}) {
  const [css, theme] = useStyletron();
  return (
    <div
      className={css({
        minHeight: '100vh',
        backgroundColor: theme.colors.backgroundSecondary,
        color: theme.colors.contentPrimary,
        fontFamily: theme.typography.ParagraphMedium.fontFamily,
      })}
    >
      <main
        className={css({
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme.sizing.scale600,
          paddingRight: theme.sizing.scale600,
          paddingTop: theme.sizing.scale800,
          paddingBottom: `calc(${BOTTOM_NAV_HEIGHT + 24}px + env(safe-area-inset-bottom, 0px))`,
        })}
      >
        {children}
      </main>
      <BottomNav areas={areas} current={current} inWorld={inWorld} />
    </div>
  );
}

/** THE WALK'S OWN SHELL — one column, no rail and no bottom row, because the nav starts at
 *  `Open Rocoto` (ONBOARDING-SPEC.md §4). The column is the phone's width on the desk as well, so
 *  what Peter reads at 393 px is what a drive reads at 1280. */
function StartShell({ children, walk = false }: { children: React.ReactNode; walk?: boolean }) {
  const [css, theme] = useStyletron();
  return (
    <div
      className={css({
        minHeight: '100vh',
        backgroundColor: theme.colors.backgroundSecondary,
        color: theme.colors.contentPrimary,
        fontFamily: theme.typography.ParagraphMedium.fontFamily,
        display: 'flex',
        justifyContent: 'center',
      })}
    >
      <main
        data-walk-shell={walk ? 'yes' : 'no'}
        className={css({
          width: '100%',
          maxWidth: '560px',
          minWidth: 0,
          backgroundColor: theme.colors.backgroundPrimary,
          /* ⚠ THE WALK'S OWN SHELL ADDS NOTHING UNDER THE WALK. `WalkScreen` draws itself to the
             visual viewport's exact height and carries `env(safe-area-inset-bottom)` inside its
             own foot, so a `scale900` of padding here made every screen 32 px TALLER THAN THE
             PHONE. The page then scrolled, and the first field to take the caret scrolled it — so
             the segmented progress bar, the one thing that makes «the last steps» look short, sat
             32 px above the top of the screen. The customer's payment page is an ordinary column
             and keeps its room. */
          ...(walk
            ? { overflow: 'hidden' }
            : { paddingBottom: `calc(${theme.sizing.scale900} + env(safe-area-inset-bottom, 0px))` }),
        })}
      >
        {children}
      </main>
    </div>
  );
}

const ConnectionExperiment = React.lazy(() => import('./connection-experiment'));
const DirectConnectionExperiment = React.lazy(() => import('./direct-connection-experiment'));
const SessionExperiment = React.lazy(() => import('./session-experiment'));

/** The connection probe owns its entry before the ordinary onboarding/session router mounts. */
export default function App() {
  const connectionTest = new URLSearchParams(window.location.search).get('connection-test');
  if (connectionTest === 'session') {
    return <React.Suspense fallback={<RouteLoading />}><SessionExperiment /></React.Suspense>;
  }
  if (connectionTest === 'direct') {
    return <React.Suspense fallback={<RouteLoading />}><DirectConnectionExperiment /></React.Suspense>;
  }
  if (connectionTest === '1') {
    return <React.Suspense fallback={<RouteLoading />}><ConnectionExperiment /></React.Suspense>;
  }
  return <BodegaApp />;
}

function BodegaApp() {
  const requested = useRoute();
  const standing = componentFor(requested);
  /* A route whose module has still to land is HOME, and the address follows so a reload reaches the
     same place. */
  const resolved: Route = standing ? requested : { world: 'desk', area: HOME };
  const door = useStanding();
  /* THE GATE. The desk and Administration stand behind the session; the walk and the simulation are in
     front of it. A visitor holding no session lands on the arrival, whose act opens Meta's own
     connection — the one way in. */
  const behindDoor = resolved.world === 'desk' || resolved.world === 'admin';
  const shut = behindDoor && !door.signed && !door.checking;
  React.useEffect(() => {
    /* AN ADDRESS BEING REWRITTEN OWNS ITSELF this tick: the rewrite raises its own `hashchange` and
       this render's `standing` was read from the address before it. Answering here would drop the
       tail the rewrite is carrying. */
    if (aliased(window.location.hash)) return;
    if (!standing) { window.location.replace(`#/${HOME}`); return; }
    if (shut) window.location.replace('#/start');
  }, [standing, shut]);
  const Current = standing ?? COMPONENTS[HOME];
  const phone = usePhone();

  if (resolved.world === 'start' || resolved.world === 'pay' || resolved.world === 'lista') {
    /* THE CUSTOMER'S PAGE WEARS NO SHELL: the walk's own bare column carries it (`pay/link.tsx`).
       The STATUS PAGE wears the walk's own column, because it is the walk's own anatomy standing
       outside the walk (`start/lista.tsx`). */
    const inWalk = resolved.world === 'start' || resolved.world === 'lista';
    return (
      <StartShell walk={inWalk}>
        <RouteContent component={Current} walk={inWalk} />
      </StartShell>
    );
  }
  if (behindDoor && !door.signed) {
    return <StartShell><div data-testid="door-gate" style={{ padding: 16 }}><RouteLoading /></div></StartShell>;
  }

  const current = resolved.world === 'desk' ? (resolved.area || HOME) : '';
  const inWorld = resolved.world === 'admin';
  const surface = (
    /* THE WRAPPER PASSES THE HEIGHT ON (DESIGN-SPEC.md §7 item 5). The copied frame gives its child
       a full-height grid cell, and a plain `div` between the two BROKE THE CHAIN: Prep's panes grid
       and its sticky `Print` both measure `100%` of a box that had collapsed to its content, so the
       list pane stood as tall as its rows and the press rode below the fold. `height: 100%` carries
       the room down and `minHeight: 0` lets a grid child scroll inside it rather than growing the
       page. The phone posture is read here for the surfaces that ask the wrapper what it is. */
    <div data-posture={phone ? 'phone' : 'desk'} style={{ height: '100%', minHeight: 0 }}>
      <RouteContent component={Current} />
    </div>
  );
  if (FrameLazy) {
    return (
      <React.Suspense fallback={<Shell areas={AREAS} current={current} inWorld={inWorld}>{surface}</Shell>}>
        <FrameLazy areas={AREAS} current={current} world={inWorld ? 'admin' : 'desk'} tabs={AREAS}
          back={`#/${HOME}`} backTitle={AREA_TITLE[HOME]}>
          {surface}
        </FrameLazy>
      </React.Suspense>
    );
  }
  return (
    <Shell areas={AREAS} current={current} inWorld={inWorld}>
      {surface}
    </Shell>
  );
}
