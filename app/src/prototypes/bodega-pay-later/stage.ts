/* HOW FAR THIS SHOP STANDS — the one record of the walk (DESIGN-SPEC.md §7 item 12).
 *
 * The critical path is four beats and the orientation follows it (ONBOARDING-SPEC.md §1), so one
 * fact has to survive a reload: where the shop got to. It lives in `rocoto-bodega-stage-v1:<scope>`
 * — one of the twelve keys `Reset state` clears (`store/keys.ts`) — and it holds four things:
 *
 *   · `signed`   who the page is signed in as. The connection writes it, the reset clears it, and
 *                `App.tsx`'s gate reads it: a visitor with no session lands on `#/start`.
 *   · `reached`  the steps the shop has walked, in the order it walked them, so a reload comes back
 *                to the walk rather than to the beginning of it.
 *   · `installed` the home-screen act, answered.
 *
 * THE COVERS KEEP THEIR OWN BOOK. `covers.tsx` holds which area covers a shop has met, under its own
 * `rocoto-bodega-covers-v1` key, so that fact is recorded once and in one place.
 *
 * IT IS THE PAGE'S OWN MEMORY, AND IT IS NEVER EVIDENCE ABOUT AN ACCOUNT. The WhatsApp connection,
 * the history and the invitations are the services' own records; this file holds where a person is
 * standing. A browser where storage throws still renders, so every read answers with a fresh walk
 * and every write is allowed to fail.
 */
import { KEYS, scoped } from './store/keys';

/** One shop, one scope. The suffix every `rocoto-bodega-*` store takes. */
export const SCOPE = 'bodega';

/** The walk, in the order ONBOARDING-SPEC.md §0 walks it, and `shop` for the desk beyond it. */
export const STEPS = [
  'arrival', 'connect', 'waitlist', 'business', 'address', 'orders', 'yape', 'owed', 'referrals',
  'done', 'shop',
] as const;
export type StageStep = (typeof STEPS)[number];

/** What proved the number: the WhatsApp connection, which is the one sign-in (WIRING-SPEC.md §1). */
export type SignedVia = 'connection';

export type Signed = { number: string; via: SignedVia; at: string };

export type Stage = {
  version: 1;
  scope: string;
  signed: Signed | null;
  reached: StageStep[];
  installed: boolean;
};

const fresh = (scope: string): Stage => ({ version: 1, scope, signed: null, reached: [], installed: false });

const isStep = (value: unknown): value is StageStep => (STEPS as readonly string[]).includes(String(value));

/** THE ONE WAY IN, CHECKED ON THE WAY OUT OF STORAGE. A record written while the code and the link
 *  doors stood carries `via: 'code'` or `'link'`, and neither is a sign-in any more: such a record
 *  READS AS SIGNED OUT, so the browser goes back through the connection rather than standing on a
 *  door that left (19 September 2026). */
const isVia = (value: unknown): value is SignedVia => value === 'connection';

/** A stored record is data from a previous session, so every field is checked before it is trusted. */
function parse(raw: string | null, scope: string): Stage {
  if (!raw) return fresh(scope);
  try {
    const held = JSON.parse(raw) as Partial<Stage>;
    const signed = held.signed && typeof held.signed.number === 'string' && isVia(held.signed.via)
      ? { number: held.signed.number, via: held.signed.via, at: held.signed.at ?? '' } as Signed
      : null;
    return {
      version: 1,
      scope,
      signed,
      reached: Array.isArray(held.reached) ? held.reached.filter(isStep) : [],
      installed: held.installed === true,
    };
  } catch {
    return fresh(scope);
  }
}

export function readStage(scope: string = SCOPE): Stage {
  try {
    return parse(window.localStorage.getItem(scoped(KEYS.stage, scope)), scope);
  } catch {
    return fresh(scope);
  }
}

export function writeStage(next: Stage): Stage {
  try {
    window.localStorage.setItem(scoped(KEYS.stage, next.scope), JSON.stringify(next));
  } catch { /* a browser where storage throws keeps the walk for this session alone */ }
  announce(next);
  return next;
}

/* ── the acts ─────────────────────────────────────────────────────────────────────────────────── */

export function markReached(step: StageStep, scope: string = SCOPE): Stage {
  const held = readStage(scope);
  if (held.reached.includes(step)) return held;
  return writeStage({ ...held, reached: [...held.reached, step] });
}

export function signIn(signed: Signed, scope: string = SCOPE): Stage {
  return writeStage({ ...readStage(scope), signed });
}

export function signOut(scope: string = SCOPE): Stage {
  return writeStage(fresh(scope));
}

export function markInstalled(scope: string = SCOPE): Stage {
  return writeStage({ ...readStage(scope), installed: true });
}

/** The furthest step this shop reached, or the arrival where the walk has yet to start. */
export function standing(scope: string = SCOPE): StageStep {
  const held = readStage(scope);
  for (let i = STEPS.length - 1; i >= 0; i -= 1) if (held.reached.includes(STEPS[i])) return STEPS[i];
  return 'arrival';
}

/** The address the walk resumes at. */
export const stepHash = (step: StageStep): string => (step === 'shop' ? '#/prep' : `#/start/${step}`);

/* ── one event, so every surface reads one record ─────────────────────────────────────────────── */

export const STAGE_EVENT = 'rocoto-bodega-stage';

function announce(next: Stage): void {
  try {
    window.dispatchEvent(new CustomEvent<Stage>(STAGE_EVENT, { detail: next }));
  } catch { /* a document that cannot dispatch still holds the written record */ }
}
