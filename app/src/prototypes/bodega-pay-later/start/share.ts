/* HANDING THE INVITATION OVER — the one road, used by the two screens that offer it
 * (ONBOARDING-SPEC.md §0, screen 9, and the status page).
 *
 * ⚠ NOTHING HERE SENDS ANYTHING. `navigator.share` opens the OWNER'S OWN sheet, and the owner picks
 * who gets the message and presses send in their own WhatsApp. A browser with no sheet copies the
 * words instead and the screen says so; a browser that refuses the clipboard prints the link for
 * the owner to select. The walk adds no path that can message a third party, which is the rule the
 * whole rig keeps (WIRING-SPEC.md §5).
 *
 * WHAT CAME BACK IS A STATE THE SCREEN READS:
 *   `sheet`      the system sheet took the words
 *   `clipboard`  they are on the clipboard
 *   `printed`    they are on the screen for the owner to select
 *   ``           the owner CLOSED the sheet, which is an answer of its own: they backed out, so
 *                the act stays «Share my link» and the screen claims nothing
 */
export type Handed = '' | 'sheet' | 'clipboard' | 'printed';
import { nativeWalk } from './runtime';

export async function handOver(what: { title: string; text: string; url: string }): Promise<Handed> {
  const native = nativeWalk();
  if (native?.share) {
    try { await native.share(what); return 'sheet'; } catch { return ''; }
  }
  const sheet = navigator.share;
  if (sheet) {
    try {
      await sheet.call(navigator, { title: what.title, text: what.text, url: what.url });
      return 'sheet';
    } catch {
      return '';
    }
  }
  try {
    await navigator.clipboard.writeText(what.text.includes(what.url) ? what.text : `${what.text}\n${what.url}`);
    return 'clipboard';
  } catch {
    return 'printed';
  }
}
