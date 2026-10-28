/* THE SHOP'S CONNECTION, READ ONCE (QA 19).
 *
 * Four surfaces stated the WhatsApp posture and three of them disagreed: `#/admin/connections`
 * printed «State: Connected · Number +51 976 431 412» with a «Connect WhatsApp ›» button under it,
 * the order's conversation header offered «Connect WhatsApp» beside a disabled send disc, and App
 * settings said every notice reaches «the number you connected». The cause is two stores: the
 * bodega's own source seam (`source/`, which is what the onboarding connects and what the
 * Connections card reads) and Cedar's provider capability, which this prototype runs no backend
 * for and which therefore answers «unbound» forever.
 *
 * THIS IS THE ONE DERIVATION. It reads the source seam — the same `connection()` the Connections
 * card has always read — and answers the two facts a surface needs: is the shop's own number
 * joined, and what is it. Every entrance that states the posture calls this, so binding a number
 * or losing one repaints all of them together.
 *
 * It is a module of its own rather than a hook inside either caller: an administration seat must
 * not have to import the conversation drawer to learn a fact, and the drawer must not have to
 * import an area.
 */
import * as React from 'react';
import type { ProofState } from '../../cedar/connections/types';
import { useChatSource } from '../source';

export type ShopConnection = {
  /** the source's own answer, whole, for a surface that reads more of it */
  state: ProofState | null;
  /** the shop's number is joined and the read is ready */
  joined: boolean;
  /** the number the service reports, where it reports one */
  number: string;
};

/** THE SHOP'S OWN WHATSAPP, LIVE. */
export function useShopConnection(): ShopConnection {
  const source = useChatSource();
  const [state, setState] = React.useState<ProofState | null>(null);

  React.useEffect(() => {
    if (!source) return undefined;
    let live = true;
    source.connection()
      .then((answer) => { if (live) setState(answer); })
      .catch(() => { /* a surface still draws while the state is on its way */ });
    return () => { live = false; };
  }, [source]);

  const joined = Boolean(state?.connection && state.ready);
  return { state, joined, number: state?.connection?.number ?? '' };
}
