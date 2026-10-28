import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const moduleUrl = new URL('../peru/waitlist.js', import.meta.url);
const {
  REFERRAL_TTL_MS,
  referralForVisit,
  waitlistWhatsAppUrl,
  enhanceWaitlistLinks,
} = await import(moduleUrl);

const number = '12025550100';
const sender = 'https://wa.me/'+number+'?text=';
assert.equal(waitlistWhatsAppUrl('en', ''), '/setup.html', 'historical templates await recipient-owned signup');
const english = 'I’d like to join the Rocoto waitlist.';
const spanish = 'Quiero unirme a la lista de espera de Rocoto.';
const code = '23ABCD';

assert.equal(waitlistWhatsAppUrl('en', '', number), sender + encodeURIComponent(english));
assert.equal(waitlistWhatsAppUrl('es', '', number), sender + encodeURIComponent(spanish));
assert.equal(
  waitlistWhatsAppUrl('en', code, number),
  sender + encodeURIComponent(`${english}\nReferral: ${code}`),
);
assert.equal(
  waitlistWhatsAppUrl('es', code, number),
  sender + encodeURIComponent(`${spanish}\nReferencia: ${code}`),
);

function storage(initial = {}) {
  const held = new Map(Object.entries(initial));
  return {
    getItem: key => held.get(key) ?? null,
    setItem: (key, value) => held.set(key, value),
    removeItem: key => held.delete(key),
    held,
  };
}

const now = 1_800_000_000_000;
for (const malicious of [
  '<script>', '23abcd', '23ABCDx', '23ABO1', '23AB%0A', '23ABCD%0AReferral:BAD',
]) {
  const store = storage();
  assert.equal(referralForVisit(`https://soyrocoto.com/?ref=${malicious}`, store, now), '');
  assert.equal(store.held.size, 0);
}

{
  const store = storage();
  assert.equal(referralForVisit(`https://soyrocoto.com/?ref=${code}`, store, now), code);
  const saved = JSON.parse(store.held.values().next().value);
  assert.deepEqual(saved, {code, expiresAt: now + REFERRAL_TTL_MS});
  assert.equal(referralForVisit('https://soyrocoto.com/en', store, now + 1), code);
  assert.equal(referralForVisit('https://soyrocoto.com/en', store, now + REFERRAL_TTL_MS), '');
  assert.equal(store.held.size, 0);
}

function anchor(href, extra = {}) {
  return {href, ...extra};
}

{
  const joins = [anchor('/fallback-one'), anchor('/fallback-two')];
  const languages = [
    anchor('https://soyrocoto.com/', {hreflang: 'es-PE'}),
    anchor('https://soyrocoto.com/en#top', {hreflang: 'en'}),
    anchor('https://example.com/en', {hreflang: 'en'}),
  ];
  const unrelated = anchor('https://demo.soyrocoto.com/bodega-pay-later/?lang=en');
  const document = {
    documentElement: {lang: 'en'},
    querySelectorAll(selector) {
      if (selector === '[data-waitlist-join]') return joins;
      if (selector === 'a[hreflang][href]') return languages;
      return [];
    },
  };
  enhanceWaitlistLinks({
    document,
    location: {href: `https://soyrocoto.com/en?ref=${code}`},
    storage: storage(),
    now,
  });
  assert.ok(joins.every(item => item.href === waitlistWhatsAppUrl('en', code)));
  assert.equal(new URL(languages[0].href).searchParams.get('ref'), code);
  assert.equal(new URL(languages[1].href).searchParams.get('ref'), code);
  assert.equal(new URL(languages[1].href).hash, '#top');
  assert.equal(languages[2].href, 'https://example.com/en');
  assert.equal(unrelated.href, 'https://demo.soyrocoto.com/bodega-pay-later/?lang=en');
}

for (const [path, lang, fallback] of [
  ['peru.html', 'en', waitlistWhatsAppUrl('en', '')],
  ['peru/es/index.html', 'es', waitlistWhatsAppUrl('es', '')],
]) {
  const html = await readFile(new URL(path, root), 'utf8');
  const tagged = [...html.matchAll(/<a\b[^>]*\bdata-waitlist-join\b[^>]*>/g)].map(match => match[0]);
  assert.equal(tagged.length, 5, `${path} marks exactly its five join actions`);
  assert.ok(tagged.every(tag => tag.includes(`href="${fallback}"`)), `${path} has a recipient setup fallback`);
  assert.ok(tagged.every(tag => !/\btarget=/.test(tag)), `${path} keeps the handoff in the same tab`);
  assert.ok(html.includes('<script src="/peru/waitlist.js" type="module"></script>'));
  assert.ok(html.includes('http://127.0.0.1:18240/'), `${path} keeps the product-demo link`);
  assert.ok(!html.match(/data-waitlist-join[^>]*bodega-pay-later|bodega-pay-later[^>]*data-waitlist-join/));
  assert.match(html, new RegExp(`<html lang="${lang === 'en' ? 'en' : 'es-PE'}"`));
}

console.log('PASS waitlist WhatsApp links, strict referrals, session expiry and language preservation');
