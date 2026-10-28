/* ON-THE-SPOT PAINTING — a product drawing the family mark asks for its own tile, once.
 *
 * Peter, FEED-IA §268: «on the spot illustraion matchingn and ideogram generayion». The road's
 * server half already stands: `mock-api/app/artwork.py`, mounted at `POST /api/artwork` by
 * `mock-api/app/main.py`. Its method is Peter's own and this file drives it rather than restating
 * it — describe a library tile of the same family, take that description VERBATIM, swap exactly one
 * substring for the new subject, generate at the family's own square.
 *
 * ═══ WHAT THIS FILE IS FOR, WHICH IS THE REFUSAL ═════════════════════════════════════════════
 * The house holds no `IDEOGRAM_API_KEY` tonight, and the door ahead of the provider wants
 * `ARTWORK_SHARED_SECRET` on `X-Rocoto-Artwork-Key`. That header is deliberately OUTSIDE the
 * service's CORS allow-list, so the road is the house's own tooling over the wire and a page holds
 * no secret to send. The honest posture is therefore the one this module reports: the ask goes out
 * ONCE per product, the service answers by NAME, and the screen states that name in words while the
 * family mark keeps standing. Nothing about this file changes the day the key arrives — the same
 * ask reaches the same road and comes back with a tile.
 *
 *   artwork_awaiting_secret   503 · the house has still to set its own key for this road
 *   artwork_awaiting_key      503 · the house has still to hold the provider's key
 *   artwork_unauthorized      401 · something else was presented at the door
 *   artwork_ceiling_reached   429 · the rolling hour's generations are spent
 *
 * ═══ ONCE, AND SHARED ════════════════════════════════════════════════════════════════════════
 * A generation is money — `reported_cost_usd_micros` rides every answer — so a list of thirty rows
 * may not each start their own request, and a component that remounts may not start a second. The
 * promise is memoised by product name for the life of the page, which is what «asks once» means in
 * a screen that scrolls.
 */
import * as React from 'react';
import { RuntimeRefused, RuntimeUnreachable, runtimeBase } from '../cedar/runtime-client';
import type { Family } from '../../rocoto/produce-icons';

/** The header the house key travels on — `artwork.py`'s `HOUSE_HEADER`, stated once. */
export const HOUSE_HEADER = 'X-Rocoto-Artwork-Key';

/** ONE TILE PER FAMILY, REVIEWED, as the reference whose description becomes the prompt. Each is a
 *  file in `app/public/paintings/`, and each is the plainest member of its family so the swap has a
 *  short subject to replace. `subject` is the words that name it INSIDE that description, which is
 *  the substring `artwork.py` looks for and refuses by name when it is absent. */
export const FAMILY_REFERENCE: Record<Family, { slug: string; subject: string }> = {
  dry: { slug: 'arroz', subject: 'rice' },
  dairy: { slug: 'leche', subject: 'milk' },
  fruit: { slug: 'papaya', subject: 'papaya' },
  vegetable: { slug: 'tomate-rama', subject: 'tomatoes' },
  poultry: { slug: 'pechuga-de-pollo', subject: 'chicken' },
  meat: { slug: 'cerdo', subject: 'pork' },
  fish: { slug: 'conserva-de-pescado', subject: 'fish' },
  shellfish: { slug: 'gamba-roja', subject: 'prawn' },
};

export type FaceRequest =
  /** the ask is on its way */
  | { state: 'asking' }
  /** a tile came back, and this is where it is */
  | { state: 'painted'; src: string }
  /** the road answered by name, and these are the words for the screen */
  | { state: 'refused'; code: string; said: string; words: string };

/** THE WORDS A PERSON READS, one per named refusal. Each says what the road is waiting for. */
export const REFUSAL_WORDS: Record<string, string> = {
  artwork_awaiting_secret: 'Painting waits for the house key on this road.',
  artwork_awaiting_key: 'Painting waits for the provider key the house holds.',
  artwork_unauthorized: 'Painting waits for the house key this road accepts.',
  artwork_ceiling_reached: 'Painting resumes with the next hour’s slot.',
  runtime_unreachable: 'Painting waits for the runtime that serves this road.',
};

export const REFUSAL_FALLBACK = 'Painting waits for the road that makes a tile.';

const wordsFor = (code: string): string => REFUSAL_WORDS[code] ?? REFUSAL_FALLBACK;

/** THE ASK, over the wire. One call, the shape `main.py` documents: a family reference to describe,
 *  the subject words inside that description, and the product's own name in their place. */
async function ask(name: string, family: Family): Promise<FaceRequest> {
  const reference = FAMILY_REFERENCE[family];
  const base = runtimeBase();
  let response: Response;
  try {
    response = await fetch(`${base}/api/artwork`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        reference: reference.slug,
        replace: reference.subject,
        subject: name,
      }),
    });
  } catch (cause) {
    const unreachable = new RuntimeUnreachable(base || window.location.origin, cause);
    return { state: 'refused', code: 'runtime_unreachable', said: unreachable.message, words: wordsFor('runtime_unreachable') };
  }
  if (!response.ok) {
    let code = '';
    let said = '';
    try {
      const body = (await response.json()) as { error?: { code?: string; message?: string } };
      code = String(body?.error?.code ?? '');
      said = String(body?.error?.message ?? '');
    } catch {
      /* A DEVELOPMENT SERVER ANSWERS THE PAGE ITSELF on a path it has no route for, so the body is
         HTML and the status is the only thing it said. The refusal keeps its name from the road it
         was aimed at, which is the runtime. */
      code = 'runtime_unreachable';
    }
    const named = code || 'runtime_unreachable';
    const refused = new RuntimeRefused(response.status, named, said, '/api/artwork');
    return { state: 'refused', code: named, said: refused.said || refused.message, words: wordsFor(named) };
  }
  /* A 200 on a development server is the page's own HTML, so the answer is read for the field the
     road actually returns and treated as a refusal where that field is absent. */
  let painted: { image?: { url?: string; data?: string; content_type?: string } } | null = null;
  try {
    painted = (await response.json()) as { image?: { url?: string; data?: string; content_type?: string } };
  } catch {
    return { state: 'refused', code: 'runtime_unreachable', said: 'The road answered with a page.', words: wordsFor('runtime_unreachable') };
  }
  const url = painted?.image?.url;
  const data = painted?.image?.data;
  const type = painted?.image?.content_type ?? 'image/webp';
  if (url) return { state: 'painted', src: url };
  if (data) return { state: 'painted', src: `data:${type};base64,${data}` };
  return { state: 'refused', code: 'runtime_unreachable', said: 'The road answered with a page.', words: wordsFor('runtime_unreachable') };
}

/** THE ONE ASK PER PRODUCT, held for the life of the page. */
const asked = new Map<string, Promise<FaceRequest>>();

export function requestFace(name: string, family: Family): Promise<FaceRequest> {
  const held = asked.get(name);
  if (held) return held;
  const started = ask(name, family);
  asked.set(name, started);
  return started;
}

/** What has already been asked, for a surface that wants to say how many asks it made. */
export const asksMade = (): number => asked.size;

/**
 * THE ASK, FOR A COMPONENT. Handed a product on the family mark, it asks once and reports the
 * posture in words; handed `enabled: false` — a product whose tile already stands — it asks nothing.
 */
export function useFaceRequest(name: string, family: Family, enabled: boolean): FaceRequest | null {
  const [request, setRequest] = React.useState<FaceRequest | null>(enabled ? { state: 'asking' } : null);
  React.useEffect(() => {
    if (!enabled) { setRequest(null); return; }
    let live = true;
    setRequest({ state: 'asking' });
    requestFace(name, family).then((answer) => { if (live) setRequest(answer); });
    return () => { live = false; };
  }, [name, family, enabled]);
  return request;
}
