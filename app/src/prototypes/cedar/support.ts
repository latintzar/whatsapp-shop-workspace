/** Rocoto support is a separate, user-opened Zendesk Messaging conversation.
 * Public widget key; never pass customer/order data or identify the operator here.
 * API: https://developer.zendesk.com/api-reference/widget-messaging/web/core/
 * Events: https://developer.zendesk.com/api-reference/widget-messaging/web/events/
 */
export type SupportState = Readonly<{
  phase: 'idle' | 'loading' | 'open' | 'error';
  error: string | null;
  closing: boolean;
}>;
type Zendesk = (...args: unknown[]) => unknown;
type SupportWindow = Window & { zE?: Zendesk };
import publicSettings from '../../shop-config.json';
const SNIPPET = publicSettings.supportSnippet;
const LOAD_TIMEOUT_MS = 20000;
// The supplied SDK hides with a 700ms delay + 200ms fade. Keep customer chat out of that frame.
const HIDE_SETTLE_MS = 1000;
let state: SupportState = { phase: 'idle', error: null, closing: false };
const listeners = new Set<() => void>();
const customerClosers = new Set<() => void>();
let snippetPromise: Promise<void> | undefined;
let configured = false;
let requested = false;
let request = 0;
let timeout: ReturnType<typeof setTimeout> | undefined;
let closeTimeout: ReturnType<typeof setTimeout> | undefined;

export const supportSnapshot = (): SupportState => state;
export const supportSubscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export function registerSupportCloser(closeCustomerChat: () => void): () => void {
  customerClosers.add(closeCustomerChat);
  return () => { customerClosers.delete(closeCustomerChat); };
}
function publish(phase: SupportState['phase'], error: string | null = null, closing = false): void {
  state = { phase, error, closing };
  listeners.forEach((listener) => listener());
}
function api(...args: unknown[]): void {
  // Read the current function: the real SDK replaces the snippet's initial command queue.
  const zendesk = (window as SupportWindow).zE;
  if (typeof zendesk !== 'function') throw new Error('Support is still loading');
  zendesk(...args);
}
function clearTimeout_(): void {
  if (timeout !== undefined) clearTimeout(timeout);
  timeout = undefined;
}
function keepHidden(): void {
  if (requested || typeof window === 'undefined' || !(window as SupportWindow).zE) return;
  try { api('messenger', 'hide'); } catch { /* Loading may have failed. */ }
  // Zendesk can finish its own close/welcome transition after the event callback returns.
  window.requestAnimationFrame(() => {
    if (!requested) { try { api('messenger', 'hide'); } catch { /* Loading may have failed. */ } }
  });
}
function hideWidget(): void {
  if (typeof window === 'undefined' || !(window as SupportWindow).zE) return;
  try { api('messenger', 'close'); } catch { /* Loading may have failed. */ }
  keepHidden();
}
function publishClosed(): void {
  const closing = state.phase === 'open' || state.closing;
  if (closeTimeout !== undefined) clearTimeout(closeTimeout);
  publish('idle', null, closing);
  closeTimeout = closing ? setTimeout(() => {
    closeTimeout = undefined;
    if (!requested) publish('idle');
  }, HIDE_SETTLE_MS) : undefined;
}
export function closeSupport(): void {
  requested = false;
  request += 1;
  clearTimeout_();
  publishClosed();
  hideWidget();
}
function fail(): void {
  requested = false;
  clearTimeout_();
  hideWidget();
  publish('error', 'Support couldn’t connect. Check your connection or content blocker, then retry. If it still won’t open, reload the page.');
}
function configure(): void {
  if (configured) return;
  // This key serves Messaging (verified from its public Zendesk composer configuration).
  api('messenger', 'hide');
  // Functional chat storage only; do not enable visitor-path analytics.
  api('messenger:set', 'cookies', 'functional');
  api('messenger:on', 'open', () => {
    if (!requested) { hideWidget(); return; }
    clearTimeout_();
    customerClosers.forEach((close) => close());
    publish('open');
  });
  api('messenger:on', 'close', () => {
    // Close hides the launcher too. No second, competing chat door remains in the corner.
    const wasRequested = requested;
    requested = false;
    clearTimeout_();
    keepHidden();
    if (wasRequested) publishClosed();
  });
  // Background welcome/unread notifications must not create a second chat launcher.
  // These handlers inspect no message content and leave the support conversation intact.
  api('messenger:on', 'show', keepHidden);
  api('messenger:on', 'unreadMessages', keepHidden);
  api('messenger:on', 'proactiveMessageDisplayed', keepHidden);
  configured = true;
}
function loadSnippet(): Promise<void> {
  if (!SNIPPET) return Promise.reject(new Error('Configure your support account.'));
  if (snippetPromise) return snippetPromise;
  snippetPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'ze-snippet';
    script.src = SNIPPET;
    script.async = true;
    script.onload = () => {
      try { configure(); resolve(); } catch (error) { reject(error); }
    };
    script.onerror = () => { script.remove(); reject(new Error('Support loading stalled')); };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    snippetPromise = undefined;
    throw error;
  });
  return snippetPromise;
}

/** Stable entry point for the navbar and export help link. Opens only; sends nothing. */
export function openSupport(): void {
  if (typeof window === 'undefined' || state.phase === 'open' || state.phase === 'loading') return;
  const thisRequest = ++request;
  if (closeTimeout !== undefined) clearTimeout(closeTimeout);
  closeTimeout = undefined;
  requested = true;
  // Close app overlays before Zendesk takes focus, including customer chat's test selector.
  customerClosers.forEach((close) => close());
  publish('loading');
  clearTimeout_();
  timeout = setTimeout(() => { if (requested && request === thisRequest) fail(); }, LOAD_TIMEOUT_MS);
  void loadSnippet().then(() => {
    // Give React one frame to remove its customer dialog/focus lock first.
    window.requestAnimationFrame(() => {
      if (!requested || request !== thisRequest) return;
      try {
        api('messenger', 'show');
        api('messenger', 'open');
      } catch { fail(); }
    });
  }).catch(() => { if (requested && request === thisRequest) fail(); });
}
