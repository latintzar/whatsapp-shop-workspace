import * as React from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor, CapacitorHttp, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { installWalkRuntime, type NativeResponse } from '../start/runtime';
import { attributeHeldReferral, canonicalBusinessKind, forgetDraft, readDraft, writeDraft, type Business, type Waitlist } from '../start/joining';
import { pageLang } from '../start/words';
import { DEVELOPMENT_ORIGIN, selectNativeAccount } from './state';
import { cancelConnectionNotifications, notifyConnectionConfirmed, requestConnectionNotifications, shareNative, showConnectionReminder, tap } from './native';

type Pending = { kind: 'meta'; attempt: string; verifier: string; expiresAt: number; code?: string; phoneBound?: boolean }
  | { kind: 'otp'; attempt: string; clientSecret: string; expiresAt: number; phone: string };
type AuthPlugin = {
  openMeta(options: { url: string }): Promise<void>;
  getSession(): Promise<{ token?: string }>;
  setSession(options: { token: string }): Promise<void>;
  clearSession(): Promise<void>;
  resetSession(): Promise<void>;
  getPending(): Promise<{ value?: string }>;
  setPending(options: { value: string }): Promise<void>;
  clearPending(): Promise<void>;
  getWhatsAppApps(): Promise<{ business: boolean; personal: boolean }>;
  prepareOtp(): Promise<{ available: boolean }>;
  consumeWhatsAppOtp(): Promise<{ code?: string }>;
  clearWhatsAppOtp(): Promise<void>;
  addListener(event: 'whatsAppOtp', listener: () => void): Promise<PluginListenerHandle>;
  addListener(event: 'metaReturn', listener: (event: { outcome: 'callback' | 'closed' | 'failed' }) => void): Promise<PluginListenerHandle>;
};
const Auth = registerPlugin<AuthPlugin>('RocotoAuth');
export type MobileStatus = 'loading' | 'signed-out' | 'otp-pending' | 'authenticated' | 'meta-pending' | 'meta-complete' | 'onboarding' | 'waitlist' | 'error';
type Snapshot = {
  status: MobileStatus; phone: string; error: string; connection: boolean; otpExpiresAt: number;
  profile: Business | null; waitlist: Waitlist | null;
};
let snapshot: Snapshot = { status: 'loading', phone: '', error: '', connection: false, otpExpiresAt: 0, profile: null, waitlist: null };
let token = '';
let pending: Pending | null = null;
let boot: Promise<void> | null = null;
let busy = false;
let refreshRequested = false;
const idleWaiters = new Set<() => void>();
async function enterCommand(): Promise<void> {
  while (busy) await new Promise<void>((resolve) => idleWaiters.add(resolve));
  busy = true;
}
function leaveCommand(): void {
  busy = false;
  for (const resolve of idleWaiters) resolve();
  idleWaiters.clear();
  if (refreshRequested) { refreshRequested = false; queueMicrotask(() => { void refresh(); }); }
}
let storageFailed = false;
const listeners = new Set<() => void>();
function publish(patch: Partial<Snapshot>): void {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) listener();
}
function message(error: unknown): string { return error instanceof Error ? error.message : 'bodega_mobile_network'; }
const native = () => Capacitor.isNativePlatform();
const openMetaTab = (url: string): Promise<unknown> => native() ? Auth.openMeta({ url }) : Browser.open({ url });
// Preview credentials live in memory only. Native credentials use the Android keystore bridge.
const keepToken = async (next: string) => { if (native()) await Auth.setSession({ token: next }); token = next; };
async function keepPending(next: Pending | null): Promise<void> {
  if (native()) {
    if (next) await Auth.setPending({ value: JSON.stringify(next) }); else await Auth.clearPending();
  }
  pending = next;
}
function readPending(value?: string): Pending | null {
  try {
    const row = JSON.parse(value ?? 'null') as Pending | null;
    if (!row || !/^[A-Za-z0-9_-]{20,128}$/.test(row.attempt) || !Number.isFinite(row.expiresAt)
      || row.expiresAt * 1000 <= Date.now()) return null;
    if (row.kind === 'meta' && /^[A-Za-z0-9_-]{43,128}$/.test(row.verifier)
      && (row.code === undefined || /^[A-Za-z0-9_-]{43}$/.test(row.code))) return row;
    if (row.kind === 'otp' && /^[A-Za-z0-9_-]{43}$/.test(row.clientSecret) && /^\+[1-9]\d{7,14}$/.test(row.phone)) return row;
  } catch { /* Invalid or expired pending state opens the ordinary sign-in screen. */ }
  return null;
}
export async function mobileRequest(path: string, body?: unknown, method?: 'GET' | 'POST' | 'PUT' | 'PATCH'): Promise<NativeResponse> {
  if (!path.startsWith('/') || path.startsWith('//') || /[\r\n\\]/.test(path) || path.includes('..')) throw new Error('invalid_api_path');
  const verb = method ?? (body === undefined ? 'GET' : 'POST');
  const headers = { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) };
  if (native()) {
    const response = await CapacitorHttp.request({ url: `${DEVELOPMENT_ORIGIN}/api/bodega${path}`,
      method: verb, headers, data: body, connectTimeout: 10000, readTimeout: 30000, disableRedirects: true });
    return { status: response.status, data: response.data };
  }
  const response = await fetch(`/api/bodega${path}`, { method: verb, headers, credentials: 'omit', cache: 'no-store',
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  return { status: response.status, data: await response.json() };
}
installWalkRuntime({ request: mobileRequest, tap: () => { void tap(); }, share: native() ? shareNative : undefined });

function value<T>(response: NativeResponse): T {
  if (response.status < 200 || response.status >= 300) {
    const data = response.data as { error?: string | { code?: string } };
    throw new Error(typeof data?.error === 'string' ? data.error : data?.error?.code ?? 'bodega_mobile_network');
  }
  return response.data as T;
}
type Account = { signedIn: boolean; phone: string; connection?: boolean; onboarded?: boolean };
async function readAccount(): Promise<void> {
  if (!token) { publish({ status: pending?.kind === 'otp' ? 'otp-pending' : pending ? 'meta-pending' : 'signed-out' }); return; }
  const response = await mobileRequest('/session');
  if (response.status === 401) {
    if (native()) await Auth.clearSession();
    token = ''; publish({ status: 'signed-out', phone: '', profile: null, waitlist: null }); return;
  }
  const account = value<Account>(response);
  if (!account.signedIn || !account.phone) throw new Error('bodega_mobile_session_invalid');
  if (selectNativeAccount(account.phone)) forgetDraft();
  publish({ phone: account.phone, connection: Boolean(account.connection) });
  const profile = value<Business>(await mobileRequest('/business'));
  profile.kind = canonicalBusinessKind(profile.kind);
  const draft = readDraft();
  writeDraft({ ...draft, kind: profile.kind || draft.kind, name: profile.name || draft.name, address: profile.address || draft.address });
  await attributeHeldReferral();
  if (!account.onboarded || !account.connection || !profile.personName?.trim() || !profile.name?.trim() || !profile.kind || !profile.address?.placeId) {
    publish({ status: 'onboarding', profile, waitlist: null, error: '' });
    return;
  }
  const waitlist = value<Waitlist>(await mobileRequest('/waitlist'));
  if (!Number.isSafeInteger(waitlist.place) || waitlist.place < 1 || !/^[234A56B789CDEFGHJKMNPQRSTUVWXYZ]{6}$/.test(waitlist.referralCode)) {
    throw new Error('bodega_mobile_record_invalid');
  }
  publish({ status: 'waitlist', profile, waitlist, error: '' });
}
async function showConnectionComplete(): Promise<void> {
  await notifyConnectionConfirmed();
  publish({ status: 'meta-complete', connection: true, error: '' });
  await tap('confirm');
  await new Promise<void>((resolve) => window.setTimeout(resolve, 650));
}
async function accept(response: NativeResponse): Promise<void> {
  const result = value<{ token: string }>(response);
  if (typeof result.token !== 'string' || !/^[A-Za-z0-9_-]{40,256}$/.test(result.token)) throw new Error('bodega_mobile_session_invalid');
  const wasMeta = pending?.kind === 'meta';
  await keepToken(result.token);
  await keepPending(null);
  if (native()) await Auth.clearWhatsAppOtp();
  if (wasMeta) await showConnectionComplete();
  await readAccount();
  await tap('confirm');
}
async function redeem(): Promise<boolean> {
  if (pending?.kind !== 'meta') return false;
  if (pending.expiresAt * 1000 <= Date.now()) {
    await keepPending(null); await cancelConnectionNotifications();
    await readAccount(); publish({ error: 'bodega_mobile_expired' }); return false;
  }
  if (!pending.code) {
    if (token && pending.phoneBound) {
      const result = value<{ status: 'pending' | 'approved' }>(await mobileRequest('/mobile/session/status', {
        attempt: pending.attempt, verifier: pending.verifier,
      }));
      if (result.status === 'approved') {
        await keepPending(null);
        await showConnectionComplete();
        await readAccount();
        return true;
      }
    }
    publish({ status: 'meta-pending' }); return false;
  }
  const response = await mobileRequest('/mobile/session/redeem', { attempt: pending.attempt, verifier: pending.verifier, code: pending.code });
  const data = response.data as { error?: { code?: string }; status?: string };
  if (response.status === 202 || data?.error?.code === 'bodega_mobile_pending') {
    publish({ status: 'meta-pending' }); return false;
  }
  await accept(response);
  return true;
}
async function storeReturn(raw: string): Promise<void> {
  if (pending?.kind !== 'meta') return;
  try {
    const url = new URL(raw);
    if (url.origin !== DEVELOPMENT_ORIGIN || url.username || url.password
      || url.hash || url.pathname !== '/bodega-app/auth' || [...url.searchParams.keys()].length !== 2) return;
    const attempt = url.searchParams.get('attempt');
    const code = url.searchParams.get('code') ?? '';
    if (attempt !== pending.attempt || !/^[A-Za-z0-9_-]{43}$/.test(code)) return;
    await keepPending({ ...pending, code });
  } catch { publish({ error: 'bodega_mobile_return_failed' }); }
}
async function receiveReturn(raw: string): Promise<void> {
  await storeReturn(raw);
  if (pending?.kind === 'meta' && pending.code) await refresh();
}
export async function refresh(): Promise<void> {
  if (busy) { refreshRequested = true; return; }
  busy = true;
  try {
    if (storageFailed) {
      try {
        token = (await Auth.getSession()).token ?? '';
        pending = readPending((await Auth.getPending()).value);
      } catch { throw new Error('bodega_mobile_storage'); }
      storageFailed = false;
      const launch = await App.getLaunchUrl();
      if (launch?.url) await storeReturn(launch.url);
    }
    if (pending?.kind === 'otp') {
      publish({ status: 'otp-pending', phone: pending.phone, otpExpiresAt: pending.expiresAt });
      const code = native() ? (await Auth.consumeWhatsAppOtp()).code : '';
      if (code && /^\d{6}$/.test(code)) await redeemOtp(code);
      return;
    }
    if (pending?.kind === 'meta') { if (!(await redeem())) return; }
    else await readAccount();
  } catch (error) {
    const reason = message(error);
    if (pending?.kind === 'meta' && /attempt_unavailable|verifier_refused|expired/.test(reason)) {
      try { await keepPending(null); await cancelConnectionNotifications(); await readAccount(); publish({ error: reason }); }
      catch (recovery) { publish({ status: 'error', error: message(recovery) }); }
    } else publish({ status: storageFailed ? 'error' : pending?.kind === 'otp' ? 'otp-pending'
      : pending?.kind === 'meta' ? 'meta-pending' : token ? 'error' : 'signed-out', error: reason });
  }
  finally { leaveCommand(); }
}
async function start(): Promise<void> {
  try {
    if (native()) {
      // These listeners must also survive an initial keystore failure and explicit recovery.
      await App.addListener('appStateChange', ({ isActive }) => { if (isActive) void (boot ?? Promise.resolve()).then(refresh); });
      await App.addListener('appUrlOpen', ({ url }) => { void (boot ?? Promise.resolve()).then(() => receiveReturn(url)); });
      await Auth.addListener('whatsAppOtp', () => { void (boot ?? Promise.resolve()).then(refresh); });
      await Auth.addListener('metaReturn', ({ outcome }) => {
        void (boot ?? Promise.resolve()).then(async () => {
          if (outcome !== 'callback') await cancelConnectionNotifications();
          await refresh();
        });
      });
      try {
        token = (await Auth.getSession()).token ?? '';
        pending = readPending((await Auth.getPending()).value);
      } catch { storageFailed = true; throw new Error('bodega_mobile_storage'); }
      if (!pending) { await Auth.clearPending(); await cancelConnectionNotifications(); }
      const launch = await App.getLaunchUrl();
      if (launch?.url) await storeReturn(launch.url);
    }
    await refresh();
  } catch (error) { publish({ status: 'error', error: message(error) }); }
}
const base64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function openMeta(): Promise<void> {
  await enterCommand();
  try {
    if (snapshot.connection && pending?.kind !== 'meta') return;
    if (pending?.kind === 'meta' && pending.expiresAt * 1000 > Date.now()) {
      if (await requestConnectionNotifications()) await showConnectionReminder(pending.expiresAt);
      await openMetaTab(`${DEVELOPMENT_ORIGIN}/bodega-pay-later/?lang=${pageLang()}&mobile=${encodeURIComponent(pending.attempt)}#/start/connect`);
      publish({ status: 'meta-pending', error: '' }); return;
    }
    const verifier = base64(crypto.getRandomValues(new Uint8Array(32)));
    const challenge = base64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
    const result = value<{ attempt: string; expiresAt: number }>(await mobileRequest('/mobile/session/start', { challenge }));
    await keepPending({ kind: 'meta', attempt: result.attempt, verifier, expiresAt: result.expiresAt, phoneBound: Boolean(token) });
    publish({ status: 'meta-pending', error: '' });
    if (await requestConnectionNotifications()) await showConnectionReminder(result.expiresAt);
    await openMetaTab(`${DEVELOPMENT_ORIGIN}/bodega-pay-later/?lang=${pageLang()}&mobile=${encodeURIComponent(result.attempt)}#/start/connect`);
  } catch (error) { await cancelConnectionNotifications(); publish({ error: message(error) }); throw error; }
  finally { leaveCommand(); if (pending?.kind === 'meta' && pending.code) void refresh(); }
}
export async function startOtp(phone: string): Promise<void> {
  await enterCommand();
  try {
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('bodega_otp_phone');
    if (native()) await Auth.prepareOtp();
    const clientSecret = base64(crypto.getRandomValues(new Uint8Array(32)));
    const result = value<{ attempt: string; expiresAt: number }>(await mobileRequest('/mobile/otp/start', { phone, clientSecret }));
    await keepPending({ kind: 'otp', attempt: result.attempt, clientSecret, expiresAt: result.expiresAt, phone });
    publish({ status: 'otp-pending', phone, otpExpiresAt: result.expiresAt, error: '' });
  } catch (error) { publish({ error: message(error) }); throw error; }
  finally { leaveCommand(); if (pending?.kind === 'otp') void refresh(); }
}
async function redeemOtp(code: string): Promise<void> {
  if (pending?.kind !== 'otp') throw new Error('bodega_otp_expired');
  const response = await mobileRequest('/mobile/otp/redeem', { attempt: pending.attempt, clientSecret: pending.clientSecret, code });
  // A delivered code survives transport failures for recovery. Definitive refusal is terminal
  // for that automatic delivery; foregrounding must not spend another guess on the same code.
  if (native() && (response.status === 401 || response.status === 409)) await Auth.clearWhatsAppOtp();
  await accept(response);
}
export async function verifyOtp(code: string): Promise<void> {
  await enterCommand();
  try { await redeemOtp(code); }
  catch (error) { publish({ error: message(error) }); throw error; }
  finally { leaveCommand(); }
}
export async function editPhone(): Promise<void> {
  await enterCommand();
  try {
    await keepPending(null);
    if (native()) await Auth.clearWhatsAppOtp();
    publish({ status: 'signed-out', error: '', otpExpiresAt: 0 });
  } finally { leaveCommand(); }
}
export async function saveProfile(patch: Partial<Business>): Promise<void> {
  const profile = value<Business>(await mobileRequest('/business', patch, 'PATCH'));
  const draft = readDraft();
  writeDraft({ ...draft, kind: profile.kind || draft.kind, name: profile.name || draft.name, address: profile.address || draft.address });
  publish({ profile });
}
let completion: Promise<void> | null = null;
export function completeOnboarding(): Promise<void> {
  // Meta publishes the verified account before its refresh settles. The completion effect may
  // mount during that refresh, so it owns an idempotent single flight instead of dropping a call.
  completion ??= (async () => {
    try {
      value(await mobileRequest('/onboarded', {}));
      await readAccount();
      await tap('confirm');
    } catch (error) { publish({ error: message(error) }); throw error; }
    finally { completion = null; }
  })();
  return completion;
}
export async function logout(): Promise<void> {
  await enterCommand();
  try {
    // The request captures the old bearer synchronously; local sign-out need not wait for radio.
    if (token) void mobileRequest('/mobile/session/logout', {}).catch(() => undefined);
    if (native()) await Auth.clearSession();
    if (native()) await Auth.clearWhatsAppOtp();
    token = ''; await keepPending(null);
    await cancelConnectionNotifications();
    forgetDraft(); selectNativeAccount('');
    publish({ status: 'signed-out', phone: '', connection: false, profile: null, waitlist: null, error: '' });
  } catch (error) { publish({ error: message(error) }); }
  finally { leaveCommand(); }
}
export async function restartSignIn(): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    if (native()) await Auth.resetSession();
    token = ''; pending = null; storageFailed = false;
    await cancelConnectionNotifications();
    publish({ status: 'signed-out', phone: '', profile: null, waitlist: null, error: '' });
  } catch { publish({ status: 'error', error: 'bodega_mobile_storage' }); }
  finally { leaveCommand(); }
}
export function useMobileSession() {
  const state = React.useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => snapshot);
  React.useEffect(() => { boot ??= start(); }, []);
  React.useEffect(() => {
    if (state.status !== 'meta-pending') return undefined;
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 4000);
    return () => window.clearInterval(timer);
  }, [state.status]);
  return { ...state, openMeta, refresh, completeOnboarding, logout, restartSignIn, startOtp, verifyOtp, editPhone, saveProfile };
}

export async function installedWhatsAppApps(): Promise<{ business: boolean; personal: boolean }> {
  return native() ? Auth.getWhatsAppApps() : { business: false, personal: false };
}
