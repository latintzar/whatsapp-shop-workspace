import { whatsappNumber } from './owner.js';
const WHATSAPP_NUMBER = whatsappNumber;
const STORAGE_KEY = 'rocoto-waitlist-referral-v1';
const REFERRAL = /^[234A56B789CDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export const REFERRAL_TTL_MS = 30 * 60 * 1000;

function validReferral(value) {
  return typeof value === 'string' && REFERRAL.test(value);
}

function storedReferral(storage, now) {
  if (!storage) return '';
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
    if (saved && validReferral(saved.code) && Number.isFinite(saved.expiresAt) && saved.expiresAt > now) {
      return saved.code;
    }
    storage.removeItem(STORAGE_KEY);
  } catch {
    try { storage.removeItem(STORAGE_KEY); } catch {}
  }
  return '';
}

export function referralForVisit(href, storage, now = Date.now()) {
  let supplied = '';
  try { supplied = new URL(href).searchParams.get('ref') || ''; } catch {}
  if (!validReferral(supplied)) return storedReferral(storage, now);
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({code: supplied, expiresAt: now + REFERRAL_TTL_MS}));
  } catch {}
  return supplied;
}

export function waitlistWhatsAppUrl(lang, referral = '', number = WHATSAPP_NUMBER) {
  if (!/^[1-9]\d{7,14}$/.test(number)) return '/setup.html';
  const message = lang === 'es'
    ? 'Quiero unirme a la lista de espera de Rocoto.'
    : 'I’d like to join the Rocoto waitlist.';
  const label = lang === 'es' ? 'Referencia' : 'Referral';
  const text = validReferral(referral) ? `${message}\n${label}: ${referral}` : message;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function enhanceWaitlistLinks({
  document: page,
  location,
  storage,
  now = Date.now(),
} = {}) {
  if (!page || !location) return '';
  const referral = referralForVisit(location.href, storage, now);
  const lang = page.documentElement.lang.toLowerCase().startsWith('es') ? 'es' : 'en';
  const whatsapp = waitlistWhatsAppUrl(lang, referral);
  for (const link of page.querySelectorAll('[data-waitlist-join]')) link.href = whatsapp;

  if (referral) {
    const current = new URL(location.href);
    for (const link of page.querySelectorAll('a[hreflang][href]')) {
      const target = new URL(link.href, current);
      if (target.origin !== current.origin) continue;
      target.searchParams.set('ref', referral);
      link.href = target.href;
    }
  }
  return referral;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  let storage;
  try { storage = window.sessionStorage; } catch {}
  enhanceWaitlistLinks({document, location: window.location, storage});
}
