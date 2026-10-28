/* FIND — the one palette, on the bodega's OWN map (QA 25).
 *
 * «/» from any surface, `⌘K` from any keyboard, the rail's own Find seat: one box in the middle of
 * the screen with the app's map in it.
 *
 * ═══ WHY THIS FILE EXISTS RATHER THAN CEDAR'S ════════════════════════════════════════════════
 * `cedar/shell/search-modal.tsx` builds its Places and Administration groups out of CEDAR's
 * registry, imported statically. Cedar keeps eleven administration seats; this shop keeps four
 * (`shell/area.ts`, DESIGN-SPEC.md §7 item 5). So the palette offered Team, Geography, Operations,
 * Units, Plan and Your agent — six rows that set a hash with no route behind it, landing the person
 * on «Your business» with nothing said, verified on all six. It also called the home area «Sales»
 * while the rail, the day bar and the routes all say Prep.
 *
 * NOTHING IS REDRAWN. The box, the walk, the keycaps, the row grammar and the marks are Cedar's
 * own `PickList` and its store (`openSearch` · `closeSearch` · `useSearchOpen`), lifted whole; what
 * this file owns is the ROWS — the four places, the four seats, the shop's own book, its catalogue
 * and its conversations. One registry, read from `shell/area.ts`, which is the same file the rail
 * and the bottom row draw from, so a seat can never appear here and nowhere else.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { Modal, ROLE, SIZE as MODAL_SIZE } from 'baseui/modal';
import { Glyph, STEP, type GlyphId } from '../../cedar/glyphs';
import { termsOf, wordsOf, matches } from '../../cedar/search';
import {
  PickList, closeSearch, openSearch, useSearchOpen,
  type PickGroup, type PickRow,
} from '../../cedar/shell/search-modal';
import { usePhone } from '../../cedar/shell/viewport';
import AreaGlyph, { AdminSeatMark } from './glyphs';
import {
  ADMIN, ADMIN_ORDER, ADMIN_TITLE, ADMIN_RAIL_WORD, AREA_TITLE, RAIL_ORDER,
  type AdminSeatId, type AreaId,
} from './area';
import type { Thread } from './threads';
import { customers, products } from '../cast';
import { faceCatalogue } from '../painting-peru';

/** The palette stands over everything the page stacks, under nothing. Cedar's own rung. */
const FIND_LAYER = 1100;

const mark = (id: GlyphId): React.ReactNode => <Glyph id={id} size={STEP.medium} />;

/** THE PLACES — the four the rail draws, in the rail's own order, with the rail's own words and
 *  the rail's own marks, so a place looks and reads the same wherever it appears. */
const places = (): PickRow[] =>
  RAIL_ORDER.map((id: AreaId) => ({
    key: `area-${id}`,
    kind: 'area',
    mark: <AreaGlyph id={id} size={STEP.medium} />,
    word: AREA_TITLE[id],
    context: 'Where you work',
    words: wordsOf([AREA_TITLE[id]]),
    open: () => { window.location.hash = `#/${id}`; },
  }));

/** THE ADMINISTRATION'S FOUR SEATS, and only the four that exist. */
const seats = (): PickRow[] =>
  ADMIN_ORDER.map((seat: AdminSeatId) => ({
    key: `seat-${seat}`,
    kind: 'seat',
    mark: <AdminSeatMark id={seat} size={STEP.medium} />,
    word: ADMIN_TITLE[seat],
    context: 'Administration',
    words: wordsOf([ADMIN_TITLE[seat], ADMIN_RAIL_WORD[seat], 'administration']),
    open: () => { window.location.hash = `#/${ADMIN}/${seat}`; },
  }));

/** THE BOOK. Each row opens the person's own sheet, which is where every fact about them stands. */
const people = (): PickRow[] =>
  customers.map((c) => ({
    key: `customer-${c.id}`,
    kind: 'customer',
    mark: mark('who'),
    word: c.name,
    context: c.block,
    words: wordsOf([c.name, c.block, c.address, c.phone]),
    open: () => { window.location.hash = `#/customers/${c.id}`; },
  }));

/** THE CATALOGUE, as the read built it. */
const goods = (): PickRow[] =>
  faceCatalogue(products).map((p) => ({
    key: `product-${p.id}`,
    kind: 'product',
    mark: mark('crate'),
    word: p.name,
    context: p.shelf,
    words: wordsOf([p.name, p.shelf]),
    open: () => { window.location.hash = `#/stock/${p.id}`; },
  }));

/** THE CONVERSATIONS. The index is the thread's own folded words, so a search here finds what was
 *  said inside a message rather than only who said it. */
const conversations = (threads: Thread[], onThread: (id: string) => void): PickRow[] =>
  threads.map((t) => ({
    key: `thread-${t.id}`,
    kind: 'thread',
    mark: mark('chat'),
    word: t.customer.name,
    context: t.at,
    words: t.words,
    open: () => onThread(t.id),
  }));

/** How many of one kind a group shows, so a palette answers rather than scrolls. */
const CAP = 6;

const keep = (rows: PickRow[], terms: string[]): PickRow[] =>
  rows.filter((row) => matches(terms, row.words)).slice(0, CAP);

function groupsFor(terms: string[], threads: Thread[], onThread: (id: string) => void): PickGroup[] {
  /* AN EMPTY FIELD ANSWERS WITH THE MAP. A palette with nothing typed in it is navigation; the
     shop's whole book under a blank field is not an answer to anything. */
  if (terms.length === 0) {
    return [
      { title: 'Places', rows: places() },
      { title: 'Administration', rows: seats() },
    ];
  }
  return [
    { title: 'Places', rows: keep(places(), terms) },
    { title: 'Customers', rows: keep(people(), terms) },
    { title: 'Products', rows: keep(goods(), terms) },
    { title: 'Conversations', rows: keep(conversations(threads, onThread), terms) },
    { title: 'Administration', rows: keep(seats(), terms) },
  ];
}

/** Is the person typing into something of their own right now? «/» is a letter in a field. */
const writing = (): boolean => {
  const at = document.activeElement as HTMLElement | null;
  if (!at) return false;
  const tag = at.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || at.isContentEditable;
};

export default function FindModal({
  threads,
  onThread,
}: {
  threads: Thread[];
  onThread: (id: string) => void;
}) {
  const [, theme] = useStyletron();
  const phone = usePhone();
  const intent = useSearchOpen();
  const open = intent !== null;
  const [query, setQuery] = React.useState('');

  const terms = React.useMemo(() => termsOf(query), [query]);
  const groups = React.useMemo(
    () => (open ? groupsFor(terms, threads, onThread).filter((g) => g.rows.length > 0) : []),
    [open, terms, threads, onThread],
  );

  /* The box opens empty every time: a word left over from the last question is a filter nobody
     asked for on the next one. */
  React.useEffect(() => { if (!open) setQuery(''); }, [open]);

  const take = React.useCallback((row: PickRow) => {
    closeSearch();
    row.open();
  }, []);

  /* ── THE SUMMON, FROM ANYWHERE ─────────────────────────────────────────────────────────── */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const chord = (e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'k' || e.key === 'K');
      const slash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !writing();
      if (!chord && !slash) return;
      e.preventDefault();
      openSearch('everything');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const calm =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <Modal
      isOpen={open}
      onClose={closeSearch}
      animate={!calm}
      autoFocus={false}
      size={MODAL_SIZE.auto}
      role={ROLE.dialog}
      overrides={{
        Root: { props: { 'data-testid': 'search-modal-root' }, style: { zIndex: FIND_LAYER } },
        Close: { component: () => null },
        DialogContainer: { style: { alignItems: 'center' } },
        Dialog: {
          props: { 'data-testid': 'search-modal' },
          style: {
            width: phone ? '100%' : '640px',
            maxWidth: '100%',
            maxHeight: phone ? '70vh' : '64vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: theme.typography.ParagraphMedium.fontFamily,
          },
        },
      }}
    >
      <PickList
        intent={intent ?? 'none'}
        groups={groups}
        terms={terms}
        query={query}
        onQuery={setQuery}
        label="Find anything"
        onTake={take}
      />
    </Modal>
  );
}
