/* MONEY — THE BANK ACCOUNT FIRST (DESIGN-SPEC.md §3, FEED-IA §268).
 *
 * «We would actually see their bank account to begin with because that's the whole point.»
 *
 * THIS FILE IS THE AREA'S ADDRESS BOOK and nothing else: the five cards, the bank, the purchases,
 * the owed list, the record and the export each live in their own module, and the tail after
 * `#/money` chooses which one draws. The tail belongs to the area (`App.tsx`), so `#/money/record`
 * is Money reading its own address rather than a route of its own.
 *
 *   #/money                     the five cards, one column at 393 px
 *   #/money/bank                both directions on the connected account
 *   #/money/suppliers           every purchase, its state in one of five words
 *   #/money/owed                who owes her — the likely list, then the fiado book
 *   #/money/record              cards 4 and 5, each at its own block (`#record`, `#place`)
 *   #/money/export              the export door — by transaction and by customer
 *   #/money/setup/payments      the receiving account and when a page goes out
 *
 * THE COVER IS THE EXPORT-COVERS ITEM'S (`covers.tsx`), so it is mounted through a GUARDED DYNAMIC
 * IMPORT: the area compiles and draws whether or not that module has landed, and the moment it does
 * the dialog opens on Money's first open with nothing here to change.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { ArrowLeft } from 'lucide-react';
import Page from '../../cedar/shell/page';
import { MoneyOverview, BankPage, SuppliersPage, RecordPage, PaymentsSetupPage,
  OwedOverview } from '../money-overview';
import { MONEY_SCOPE, useMoney } from '../money-store';
import { MoneyExport, ledgerBundle } from '../paper/export';

export const meta = { id: 'money', title: 'Money', owner: 'BODEGA-MONEY', panes: false };

/** The tail after `#/money`, read the way Cedar's own Money area reads it. */
function useMoneyRoute(): string[] {
  const [hash, setHash] = React.useState(() => window.location.hash);
  React.useEffect(() => {
    const read = () => setHash(window.location.hash);
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  return hash.replace(/^#\/?/, '').split('/').map((part) => {
    try { return decodeURIComponent(part); } catch { return part; }
  });
}

/* ── THE COVERS, MOUNTED IF THEY ARE THERE ────────────────────────────────────────────────── */

type AreaCoverComponent = React.ComponentType<{ area: 'money' }>;
type BandComponent = React.ComponentType<Record<string, never>>;

/** THE GUARD IS `import.meta.glob`, WHICH IS WHY `tsc` STAYS GREEN. A literal `import('./covers')`
 *  of a module that has still to land is a type error and a build error; a glob that matches nothing
 *  is an empty object — the same discipline `App.tsx` uses for a route whose module is outstanding.
 *  Both seats are globbed, because `covers.tsx` is the export-covers item's file and may sit beside
 *  this one or at the prototype's root.
 *
 *  TWO SEATS COME OUT OF IT: `AreaCover` is Money's cover DIALOG on its first open, and
 *  `ReferralsCover` is the band over `Suppliers you brought` — the `referrals` seat's second and
 *  last home (DESIGN-SPEC.md §3 card 5, ONBOARDING-SPEC.md §8). */
const COVER_MODULES = {
  ...import.meta.glob('./covers.tsx'),
  ...import.meta.glob('../covers.tsx'),
} as Record<string, () => Promise<Record<string, unknown>>>;

function useCovers(): { AreaCover: AreaCoverComponent | null; ReferralsCover: BandComponent | null } {
  const [held, setHeld] = React.useState<{ AreaCover: AreaCoverComponent | null; ReferralsCover: BandComponent | null }>(
    { AreaCover: null, ReferralsCover: null });
  React.useEffect(() => {
    const load = Object.values(COVER_MODULES)[0];
    if (!load) return;
    let active = true;
    void load()
      .then((module) => {
        if (!active) return;
        const area = module.AreaCover as AreaCoverComponent | undefined;
        const band = module.ReferralsCover as BandComponent | undefined;
        setHeld({
          AreaCover: typeof area === 'function' ? area : null,
          ReferralsCover: typeof band === 'function' ? band : null,
        });
      })
      .catch(() => { /* The area draws its cards while that module is outstanding. */ });
    return () => { active = false; };
  }, []);
  return held;
}

/* ── THE AREA ─────────────────────────────────────────────────────────────────────────────── */

export default function Money() {
  const [, theme] = useStyletron();
  const route = useMoneyRoute();
  const tail = route[1] ?? '';
  /* MONEY WANTS THE DESK IT IS STANDING ON (the QA pass, item 20). The frame publishes
     `useWideColumn`, and importing `shell/frame.tsx` from here puts Cedar's own `money-credit.tsx`
     — and with it the revolving-advance route — into Money's import closure, which
     `app/tools/test-bodega-money.mjs` is built to refuse. So the ask belongs to the frame's own
     package: `areas/money.tsx` declares `panes: false`, and the wide column is what that surface
     needs. What this file owns is the LAYOUT inside whatever column it is given, below. */
  const { AreaCover, ReferralsCover } = useCovers();
  const scope = MONEY_SCOPE;
  /* THE EXPORT DOOR IS FED THE SHOP'S OWN LEDGER (`paper/export.tsx`), so the words typed on a
     payment page reach the row of the file that page is about. */
  const { state } = useMoney(scope);

  const back = <a href="#/money" data-testid="money-back" style={{ ...theme.typography.LabelSmall,
    color: theme.colors.contentPrimary, textDecoration: 'none', minHeight: 44, display: 'inline-flex',
    alignItems: 'center', gap: theme.sizing.scale200 }}><ArrowLeft size={18} aria-hidden />Money</a>;

  const surface = () => {
    if (tail === 'bank') return <BankPage scope={scope} />;
    if (tail === 'suppliers') return <SuppliersPage scope={scope} />;
    if (tail === 'owed') return <OwedOverview scope={scope} />;
    if (tail === 'record') return <RecordPage scope={scope} referralsCover={ReferralsCover ?? undefined} />;
    if (tail === 'setup') return <PaymentsSetupPage scope={scope} />;
    return null;
  };

  const inner = surface();

  /* ── `Sales export` IS A DOOR RATHER THAN A PAGE ──────────────────────────────────────────
     `MoneyExport` is the house's own task frame (`WorkflowDialog`), which docks to a bottom sheet
     under the phone's width and carries its own close. So it stands OVER the five cards rather
     than inside the tail's column — a `‹ Money` link behind a dialog is a way out nobody can
     press — and closing it returns to `#/money`. The door is fed the shop's own ledger, so the
     words typed on a payment page reach the row of the file that page is about. */
  if (tail === 'export') {
    return <Page title={meta.title}>
      <div data-testid="area-money" style={{ display: 'grid', gap: theme.sizing.scale600, minWidth: 0 }}>
        <MoneyOverview scope={scope} />
      </div>
      <MoneyExport onClose={() => { window.location.hash = '#/money'; }} bundle={ledgerBundle(state)} />
    </Page>;
  }

  return <Page title={meta.title}>
    {AreaCover && <AreaCover area="money" />}
    {inner ? <div data-testid={`money-${tail}`} style={{ display: 'grid', gap: theme.sizing.scale600, minWidth: 0 }}>
      {back}
      {inner}
    </div> : <div data-testid="area-money" style={{ display: 'grid', gap: theme.sizing.scale600, minWidth: 0 }}>
      {/* THE AREA IS NAMED ONCE (item 53). The frame draws `Money` centred in the header, so an
          H1 reading `Your money` under it was the third name for one place in one viewport. */}
      <MoneyOverview scope={scope} />
    </div>}
  </Page>;
}
