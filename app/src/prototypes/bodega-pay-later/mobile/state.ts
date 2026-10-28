export const STEPS = ['arrival', 'connect', 'kind', 'owner', 'name', 'address', 'waitlist'] as const;
export type MobileStep = typeof STEPS[number];
export type BusinessKind = 'bodega' | 'sells_to_bodegas' | 'sells_to_restaurants';
export type MobileDraft = {
  version: 1;
  step: MobileStep;
  language: 'en' | 'es';
  kind: BusinessKind | null;
  ownerName: string;
  name: string;
  address: string;
  publicCode: string;
};
export const DRAFT_KEY = 'rocoto-bodega-android-draft-v1';
import publicSettings from '../../../shop-config.json';
export const DEVELOPMENT_ORIGIN = publicSettings.nativeOrigin;
export const TEST_NOTIFICATION_ID = 731001;
export const TEST_NOTIFICATION_ACTION_TYPE = 'rocoto_tester_actions_v1';
export const TEST_NOTIFICATION_ACTION = 'rocoto_tester_open';
export const TEST_NOTIFICATION_CHANNEL = 'rocoto_tester_v1';
export const TEST_NOTIFICATION_EXTRA = { kind: 'rocoto-tester', version: 1 } as const;
export type NotificationTestStatus = 'scheduled' | 'permission-denied' | 'channel-disabled' | 'error' | 'browser';

/** The WhatsApp app a shop uses is a preference for the Meta hand-off, never account proof. */
export type WhatsAppChoice = 'whatsapp' | 'business';
const WHATSAPP_CHOICE_KEY = 'rocoto-bodega-mobile-whatsapp-choice-v1';

export function readWhatsAppChoice(): WhatsAppChoice | null {
  try {
    const held = window.localStorage.getItem(WHATSAPP_CHOICE_KEY);
    return held === 'whatsapp' || held === 'business' ? held : null;
  } catch { return null; }
}

export function saveWhatsAppChoice(choice: WhatsAppChoice): void {
  try { window.localStorage.setItem(WHATSAPP_CHOICE_KEY, choice); } catch { /* The current screen still holds it. */ }
}

/** Hashes used only while the authenticated customer walk is mounted in the native shell.
 * Legacy steps remain readable so an installed 0.5.0 draft can be routed into the shorter walk. */
export const NATIVE_WALK_STEPS = ['waitlist', 'business', 'address', 'orders', 'owed', 'referrals', 'done'] as const;
export type NativeWalkStep = typeof NATIVE_WALK_STEPS[number];
const NATIVE_WALK_STEP_KEY = 'rocoto-bodega-mobile-walk-step-v1';
const NATIVE_ACCOUNT_KEY = 'rocoto-bodega-mobile-draft-account-v1';
let draftAccount = '';

/** Device drafts belong to the account the server verified, never the previous phone's owner. */
export function selectNativeAccount(phone: string): boolean {
  let previous = draftAccount;
  try { previous ||= window.localStorage.getItem(NATIVE_ACCOUNT_KEY) ?? ''; } catch { /* Memory still isolates this run. */ }
  draftAccount = phone;
  if (previous === phone) return false;
  try {
    window.localStorage.setItem(NATIVE_ACCOUNT_KEY, phone);
    window.localStorage.removeItem(NATIVE_WALK_STEP_KEY);
  } catch { /* The active account remains held in memory. */ }
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  return true;
}

export function nativeWalkStep(hash: string = window.location.hash): NativeWalkStep {
  const found = /^#\/start\/(waitlist|business|address|orders|owed|referrals|done)$/.exec(hash);
  const step = found?.[1] as NativeWalkStep | undefined;
  return !step || step === 'waitlist' ? 'business' : step;
}

export function readNativeWalkStep(): NativeWalkStep {
  try { return nativeWalkStep(`#/start/${window.localStorage.getItem(NATIVE_WALK_STEP_KEY) ?? ''}`); } catch { return 'business'; }
}

export function saveNativeWalkStep(step: NativeWalkStep): void {
  try { window.localStorage.setItem(NATIVE_WALK_STEP_KEY, step); } catch { /* The current route remains mounted. */ }
}
export function singleflightNotificationTest(run: () => Promise<NotificationTestStatus>): () => Promise<NotificationTestStatus> {
  let inFlight: Promise<NotificationTestStatus> | null = null;
  return () => {
    if (inFlight) return inFlight;
    inFlight = run().finally(() => { inFlight = null; });
    return inFlight;
  };
}
export type NotificationTestAdapter = {
  isNative: boolean;
  getAvailability: () => Promise<{ enabled: boolean; channelsSupported: boolean }>;
  checkPermissions: () => Promise<{ display: string }>;
  requestPermissions: () => Promise<{ display: string }>;
  createChannel: () => Promise<void>;
  listChannels: () => Promise<Array<{ id: string; importance?: number }>>;
  registerActions: () => Promise<void>;
  schedule: (notification: { id: number; title: string; body: string; channelId?: string; actionTypeId?: string;
    smallIcon?: string; extra?: unknown; isExactNotification?: boolean }) => Promise<void>;
};
export const EMPTY_DRAFT: MobileDraft = {
  version: 1, step: 'arrival', language: 'es', kind: null, ownerName: '', name: '', address: '', publicCode: '',
};
const kinds: BusinessKind[] = ['bodega', 'sells_to_bodegas', 'sells_to_restaurants'];
export function cleanCode(value: unknown): string {
  return typeof value === 'string' && /^[234A56B789CDEFGHJKMNPQRSTUVWXYZ]{6}$/i.test(value) ? value.toUpperCase() : '';
}

/** Draft storage carries user-entered details and navigation, never proof of account ownership. */
export function readDraftValue(raw: string | null): MobileDraft {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) return { ...EMPTY_DRAFT };
    const draft = value as Record<string, unknown>;
    return {
      version: 1,
      step: STEPS.includes(draft.step as MobileStep) ? draft.step as MobileStep : 'arrival',
      language: draft.language === 'en' ? 'en' : 'es',
      kind: kinds.includes(draft.kind as BusinessKind) ? draft.kind as BusinessKind : null,
      ownerName: typeof draft.ownerName === 'string' ? draft.ownerName.slice(0, 80) : '',
      name: typeof draft.name === 'string' ? draft.name.slice(0, 100) : '',
      address: typeof draft.address === 'string' ? draft.address.slice(0, 240) : '',
      publicCode: cleanCode(draft.publicCode),
    };
  } catch { return { ...EMPTY_DRAFT }; }
}

export function acceptsReturn(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'rocoto:' && url.hostname === 'return' && !url.username && !url.password
      && !url.port && (url.pathname === '' || url.pathname === '/') && !url.search && !url.hash;
  } catch { return false; }
}

/** Only Rocoto's public status links and its exact native waitlist door are accepted. */
export function publicCodeFromLink(raw: string): string {
  const value = raw.trim();
  if (cleanCode(value)) return cleanCode(value);
  try {
    const url = new URL(value);
    if (url.username || url.password || url.port) return '';
    if (url.protocol === 'rocoto:' && url.hostname === 'waitlist' && !url.search && !url.hash) {
      return cleanCode(url.pathname.slice(1));
    }
    if (url.origin !== DEVELOPMENT_ORIGIN) return '';
    if (url.pathname.startsWith('/bodega-app/waitlist/') && !url.search && !url.hash) {
      return cleanCode(url.pathname.slice('/bodega-app/waitlist/'.length));
    }
    if (!['/bodega-pay-later/', '/bodega-app/'].includes(url.pathname)) return '';
    if (url.searchParams.has('lista')) {
      if (url.pathname === '/bodega-app/' && (url.hash || [...url.searchParams.keys()].length !== 1)) return '';
      return cleanCode(url.searchParams.get('lista'));
    }
    const hash = /^#\/lista\/([a-z0-9]{4,12})$/i.exec(url.hash);
    return hash ? cleanCode(hash[1]) : '';
  } catch { return ''; }
}

export type PublicWaitlist = { name: string; kind: BusinessKind | null; place: number; ahead: number; joined: number };
export function publicWaitlistValue(value: unknown): PublicWaitlist | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const count = (number: unknown): number | null => typeof number === 'number' && Number.isSafeInteger(number)
    && number >= 0 && number <= 1_000_000_000 ? number : null;
  const place = count(item.place), ahead = count(item.ahead), joined = count(item.joined);
  if (place === null || place < 1 || ahead === null || joined === null || typeof item.name !== 'string') return null;
  return { name: item.name.slice(0, 100), kind: kinds.includes(item.kind as BusinessKind) ? item.kind as BusinessKind : null,
    place, ahead, joined };
}

/** Accept only the notification action emitted by this bundled local test. */
export function isTestNotificationAction(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const action = value as { actionId?: unknown; notification?: unknown };
  if (action.actionId !== TEST_NOTIFICATION_ACTION && action.actionId !== 'tap') return false;
  if (!action.notification || typeof action.notification !== 'object') return false;
  const notification = action.notification as { id?: unknown; extra?: unknown };
  if (notification.id !== TEST_NOTIFICATION_ID || !notification.extra || typeof notification.extra !== 'object') return false;
  const extra = notification.extra as Record<string, unknown>;
  return Object.keys(extra).length === 2 && extra.kind === TEST_NOTIFICATION_EXTRA.kind && extra.version === TEST_NOTIFICATION_EXTRA.version;
}

/** The notification proof's side effects are injected so permission and OS branches stay testable. */
export async function orchestrateNotificationTest(adapter: NotificationTestAdapter): Promise<NotificationTestStatus> {
  if (!adapter.isNative) return 'browser';
  try {
    const permission = await adapter.checkPermissions();
    if (permission.display !== 'granted') {
      const requested = await adapter.requestPermissions();
      if (requested.display !== 'granted') return 'permission-denied';
    }
    const availability = await adapter.getAvailability();
    if (!availability.enabled) return 'permission-denied';
    if (availability.channelsSupported) {
      await adapter.createChannel();
      const channel = (await adapter.listChannels()).find((item) => item.id === TEST_NOTIFICATION_CHANNEL);
      if (channel && channel.importance === 0) return 'channel-disabled';
    }
    await adapter.registerActions();
    await adapter.schedule({
      id: TEST_NOTIFICATION_ID, title: 'Prueba de Rocoto', body: 'Toca Abrir Rocoto para comprobar la notificación local.',
      ...(availability.channelsSupported ? { channelId: TEST_NOTIFICATION_CHANNEL } : {}), actionTypeId: TEST_NOTIFICATION_ACTION_TYPE,
      smallIcon: 'rocoto_notification_icon', extra: { ...TEST_NOTIFICATION_EXTRA }, isExactNotification: false,
    });
    return 'scheduled';
  } catch { return 'error'; }
}
