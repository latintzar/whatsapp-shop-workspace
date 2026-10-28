import { Capacitor, CapacitorHttp, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications, type ActionPerformed } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { cleanCode, DEVELOPMENT_ORIGIN, DRAFT_KEY, isTestNotificationAction, readDraftValue, publicWaitlistValue,
  TEST_NOTIFICATION_ACTION, TEST_NOTIFICATION_ACTION_TYPE, TEST_NOTIFICATION_CHANNEL,
  orchestrateNotificationTest, singleflightNotificationTest, type MobileDraft, type NotificationTestAdapter, type NotificationTestStatus } from './state';

let pendingSave: Promise<void> = Promise.resolve();
const RocotoNative = registerPlugin<{
  haptic(options: { kind: 'selection' | 'confirm' | 'reject' }): Promise<{ performed: boolean }>;
  getNotificationAvailability(): Promise<{ enabled: boolean; channelsSupported: boolean }>;
  openNotificationSettings(): Promise<void>;
  openBusinessAppStore(): Promise<void>;
  showConnectionReminder(options: { expiresAt: number }): Promise<void>;
  notifyConnectionConfirmed(): Promise<void>;
  cancelConnectionNotifications(): Promise<void>;
  share(options: { title: string; text: string }): Promise<void>;
}>('RocotoNative');
export async function loadDraft(): Promise<MobileDraft> {
  const { value } = await Preferences.get({ key: DRAFT_KEY });
  return readDraftValue(value);
}
export function saveDraft(draft: MobileDraft): Promise<void> {
  const value = JSON.stringify(readDraftValue(JSON.stringify(draft)));
  const next = pendingSave.catch(() => undefined).then(() => Preferences.set({ key: DRAFT_KEY, value }));
  pendingSave = next;
  return next;
}
export async function tap(kind: 'selection' | 'confirm' | 'reject' = 'selection'): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) await RocotoNative.haptic({ kind });
    else await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* The visual press remains available. */ }
}
export const shareNative = (what: { title: string; text: string; url: string }): Promise<void> =>
  RocotoNative.share({ title: what.title, text: what.text.includes(what.url) ? what.text : `${what.text}\n${what.url}` });

export type { NotificationTestStatus } from './state';

let actionQueue: Promise<void> = Promise.resolve();
const actionSubscribers = new Set<(action: ActionPerformed) => void | Promise<void>>();
const pendingActions: ActionPerformed[] = [];
function dispatchNotificationAction(action: ActionPerformed): void {
  actionQueue = actionQueue.then(async () => {
    if (!isTestNotificationAction(action)) return;
    if (actionSubscribers.size === 0) { pendingActions.splice(0, pendingActions.length, action); return; }
    for (const subscriber of actionSubscribers) await subscriber(action);
  }).catch(() => undefined);
}
// Install before React renders so a cold-start action is retained until the app is ready.
void LocalNotifications.addListener('localNotificationActionPerformed', dispatchNotificationAction).catch(() => undefined);
export function subscribeNotificationActions(listener: (action: ActionPerformed) => void | Promise<void>): PluginListenerHandle {
  actionSubscribers.add(listener);
  const pending = pendingActions.splice(0);
  for (const action of pending) dispatchNotificationAction(action);
  return { remove: async () => { actionSubscribers.delete(listener); } };
}

async function runNotificationTest(): Promise<NotificationTestStatus> {
  const adapter: NotificationTestAdapter = {
    isNative: Capacitor.isNativePlatform(),
    getAvailability: () => RocotoNative.getNotificationAvailability(),
    checkPermissions: () => LocalNotifications.checkPermissions(),
    requestPermissions: () => LocalNotifications.requestPermissions(),
    createChannel: () => LocalNotifications.createChannel({ id: TEST_NOTIFICATION_CHANNEL, name: 'Pruebas de Rocoto', description: 'Notificaciones locales de prueba de Rocoto.', importance: 3, visibility: 1, vibration: true }),
    listChannels: async () => (await LocalNotifications.listChannels()).channels,
    registerActions: () => LocalNotifications.registerActionTypes({ types: [{ id: TEST_NOTIFICATION_ACTION_TYPE, actions: [{ id: TEST_NOTIFICATION_ACTION, title: 'Abrir Rocoto', foreground: true }] }] }),
    schedule: async (notification) => { await LocalNotifications.schedule({ notifications: [notification] }); },
  };
  return orchestrateNotificationTest(adapter);
}
const runNotificationTestSingleflight = singleflightNotificationTest(runNotificationTest);
export function sendNotificationTest(): Promise<NotificationTestStatus> {
  return runNotificationTestSingleflight();
}

export async function openNotificationSettings(): Promise<void> {
  if (Capacitor.isNativePlatform()) await RocotoNative.openNotificationSettings();
}

const CONNECTION_NOTIFICATION_CHANNEL = 'whatsapp-connection';
/** Ask while the person is still in Rocoto, before the browser handoff. */
export async function requestConnectionNotifications(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') return false;
    await LocalNotifications.createChannel({
      id: CONNECTION_NOTIFICATION_CHANNEL,
      name: 'Conexión de WhatsApp',
      description: 'Avisos sobre la conexión de WhatsApp con Rocoto.',
      importance: 3,
      visibility: 1,
      vibration: true,
    });
    return true;
  } catch { return false; }
}

/** A return affordance while the original browser document owns the live Meta exchange. */
export async function showConnectionReminder(expiresAt: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try { await RocotoNative.showConnectionReminder({ expiresAt }); }
  catch { /* The open Auth Tab remains the primary return path. */ }
}

/** Call only after the authenticated server reports an approved connection. */
export async function notifyConnectionConfirmed(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await RocotoNative.cancelConnectionNotifications();
    if (document.visibilityState === 'visible') return;
    await RocotoNative.notifyConnectionConfirmed();
  } catch { /* The authenticated in-app state remains authoritative. */ }
}

export async function cancelConnectionNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try { await RocotoNative.cancelConnectionNotifications(); }
  catch { /* Cleanup is best effort. */ }
}
export async function openSignup(language: 'en' | 'es'): Promise<void> {
  await pendingSave;
  await Browser.open({ url: `${DEVELOPMENT_ORIGIN}/bodega-pay-later/?lang=${language}#/start/connect` });
}
export async function openChat(): Promise<void> {
  const { ROCOTO_CHAT } = await import('../start/session');
  if (!ROCOTO_CHAT) throw new Error('Configure your WhatsApp number.');
  await Browser.open({ url: ROCOTO_CHAT });
}
export async function openBusinessAppStore(): Promise<void> {
  if (Capacitor.isNativePlatform()) await RocotoNative.openBusinessAppStore();
  else await Browser.open({ url: 'https://play.google.com/store/apps/details?id=com.whatsapp.w4b' });
}
export async function readPublicWaitlist(code: string) {
  const safe = cleanCode(code);
  if (!safe) throw new Error('invalid_link');
  const url = `${DEVELOPMENT_ORIGIN}/api/bodega/status/${safe}`;
  if (Capacitor.isNativePlatform()) {
    const result = await CapacitorHttp.get({ url, headers: { Accept: 'application/json' }, connectTimeout: 10000, readTimeout: 10000 });
    if (result.status === 404) return { kind: 'unknown' as const };
    if (result.status !== 200) throw new Error('service_unavailable');
    const value = publicWaitlistValue(result.data);
    if (!value) throw new Error('invalid_response');
    return { kind: 'ready' as const, value };
  }
  const result = await fetch(url, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (result.status === 404) return { kind: 'unknown' as const };
  if (!result.ok) throw new Error('service_unavailable');
  const value = publicWaitlistValue(await result.json());
  if (!value) throw new Error('invalid_response');
  return { kind: 'ready' as const, value };
}
