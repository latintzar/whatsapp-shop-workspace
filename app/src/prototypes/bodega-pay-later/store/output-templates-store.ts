/* THE OUTPUT TEMPLATES, ON THIS SHOP'S OWN KEY (WIRING-SPEC.md §11).
 *
 * WHY A COPY AND NOT AN IMPORT. `cedar/output-templates.ts` is two things in one file: a pure
 * vocabulary — the categories, the layouts, the acts that return the next template — and a STORE
 * under `rocoto:outputs:templates:<sector>`. Everything pure is imported from there and stays one
 * definition for both houses; the three functions that touch the browser are re-stated here against
 * `rocoto-bodega-output-templates-v1:<sector>`, because this shop and Cedar's fruit house share one
 * origin and the cast seats both on the `fruit` catalogue. On Cedar's key, a template the shopkeeper
 * edits on the Print screen IS Cedar's albarán template, and `Reset state` could only undo that by
 * deleting another house's paper.
 *
 * THE READ OPENS ON WHAT SHIPS. There is nothing to migrate into a store born today: Cedar's legacy
 * export copies belong to Cedar's houses, so a shop whose key holds nothing gets `shippedTemplates()`
 * and writes its own list the first time it saves one.
 */
import { parseTemplates, shippedTemplates, type Template } from '../../cedar/output-templates';
import { KEYS, scoped } from './keys';

const keyFor = (sector: string): string => scoped(KEYS.outputTemplates, sector);

/** The version the stored shape carries, so a build that cannot read a store opens on what ships. */
export const TEMPLATES_VERSION = 1;

/** What this shop's key holds, or `null` where it holds nothing this build can read. */
const stored = (sector: string): Template[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(keyFor(sector)) ?? 'null');
    const parsed = parseTemplates(raw);
    return parsed && parsed.length ? parsed : null;
  } catch { return null; }
};

/** THE READ. A store that parses returns its list; a shop with nothing stored opens on what ships. */
export const readTemplates = (sector: string): Template[] =>
  (typeof window === 'undefined' ? shippedTemplates() : stored(sector) ?? shippedTemplates());

/* ── ONE LIST, AND EVERY SURFACE READING IT HEARS THE WRITE ───────────────────────────────────
 * The library and the day's head stand in two different trees, so a write PUBLISHES and every
 * reader re-reads from the one key — the shape `cedar/output-templates.ts` gives its own store, and
 * the reason a template given a day seat redraws the day head without a reload. The `storage` event
 * carries a write made in another tab.
 */
const listeners = new Set<() => void>();

/** Subscribe to the template list. Returns the unsubscribe, so a React effect can return it. */
export const subscribeTemplates = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

const publish = (): void => { listeners.forEach((listener) => listener()); };

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key.startsWith(KEYS.outputTemplates)) publish();
  });
}

/** THE WRITE. `false` says the store stalled, and the surface says so in its own words; the caller
 *  keeps the values it holds. A write that lands is published, so the library, the print screen and
 *  the day's two seats read the same list on the next frame. */
export const writeTemplates = (sector: string, next: Template[]): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(keyFor(sector), JSON.stringify({ version: TEMPLATES_VERSION, templates: next }));
    publish();
    return true;
  } catch { return false; }
};
