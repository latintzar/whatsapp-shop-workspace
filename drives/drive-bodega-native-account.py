#!/usr/bin/env python3
"""Native-account browser proof for the Bodega Android bundle.

Run: ROCOTO_DIST=app/dist-android .venv/bin/python drives/drive-bodega-native-account.py

The bridge is installed before the bundle, so Capacitor takes its Android path.  It is deliberately
small: RocotoAuth represents encrypted native state in this proof's localStorage, Browser records
opens, and CapacitorHttp supplies fixed, local endpoint shapes.  No request leaves the static server.
"""
import asyncio
import functools
import http.server
import os
import pathlib
import socketserver
import tempfile
import threading
from urllib.parse import urlsplit

from playwright.async_api import async_playwright, expect

DIST = pathlib.Path(os.environ.get("ROCOTO_DIST", "app/dist-android")).resolve()
OUT = pathlib.Path(os.environ.get("ROCOTO_SHOTS", "/tmp/rocoto-bodega-native-account"))
TOKEN_KEY = "rocoto-native-auth-token"
PENDING_KEY = "rocoto-native-auth-pending"
MODEL_KEY = "rocoto-native-account-model"
TOKEN = "T" * 64
CODE = "C" * 43


BRIDGE = r"""(() => {
  const tokenKey = 'rocoto-native-auth-token';
  const pendingKey = 'rocoto-native-auth-pending';
  const modelKey = 'rocoto-native-account-model';
  const token = 'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT';
  const referralCode = 'ABC234';
  const blank = () => ({ signed: false, phone: '+51987654321', business: {personName: 'Ana', kind: '', name: 'Bodega Ana', address: null}, connection: false, onboarded: false });
  const load = () => { try { return {...blank(), ...JSON.parse(localStorage.getItem(modelKey) || 'null')}; } catch { return blank(); } };
  const save = (next) => localStorage.setItem(modelKey, JSON.stringify(next));
  const model = load();
  const listeners = {};
  const headers = (name, methods) => ({name, methods: [...methods.map((name) => ({name, rtype: 'promise'})), ...(['RocotoAuth','LocalNotifications'].includes(name) ? [{name:'addListener',rtype:'callback'},{name:'removeListener',rtype:'promise'}] : [])]});
  window.androidBridge = {};
  window.Capacitor = {
    PluginHeaders: [
      headers('RocotoAuth', ['getSession', 'setSession', 'clearSession', 'resetSession', 'getPending', 'setPending', 'clearPending', 'getWhatsAppApps', 'openMeta', 'prepareOtp', 'consumeWhatsAppOtp', 'clearWhatsAppOtp']),
      headers('CapacitorHttp', ['request']), headers('Browser', ['open']),
      headers('LocalNotifications', ['checkPermissions', 'requestPermissions', 'createChannel']),
      headers('RocotoNative', ['haptic', 'share', 'getNotificationAvailability', 'openNotificationSettings', 'openBusinessAppStore', 'showConnectionReminder', 'notifyConnectionConfirmed', 'cancelConnectionNotifications']),
      headers('Haptics', ['impact']), headers('Preferences', ['get', 'set']),
      {name: 'App', methods: [{name: 'addListener', rtype: 'callback'}, {name: 'removeListener', rtype: 'promise'}, {name: 'getLaunchUrl', rtype: 'promise'}, {name: 'exitApp', rtype: 'promise'}]},
    ],
    nativeCallback(plugin, method, options, callback) {
      const event = options && options.eventName;
      if ((plugin === 'App' || plugin === 'RocotoAuth') && event) (listeners[event] ||= []).push(callback);
      return Promise.resolve(`${plugin}:${method}:${event || 'callback'}`);
    },
    nativePromise(plugin, method, options = {}) {
      const response = (status, data) => Promise.resolve({status, data, headers: {}, url: options.url || ''});
      if (plugin === 'RocotoAuth') {
        if (method === 'getSession') { if (window.__native.failAuthRead) return Promise.reject(new Error('synthetic_auth_read')); return Promise.resolve({token: window.__native.exposeToken ? localStorage.getItem(tokenKey) || undefined : undefined}); }
        if (method === 'setSession') { if (window.__native.failAuthWrite) return Promise.reject(new Error('synthetic_auth_write')); localStorage.setItem(tokenKey, options.token); return Promise.resolve({}); }
        if (method === 'clearSession') { localStorage.removeItem(tokenKey); return Promise.resolve({}); }
        if (method === 'resetSession') { localStorage.removeItem(tokenKey); localStorage.removeItem(pendingKey); return Promise.resolve({}); }
        if (method === 'getPending') { if (window.__native.failAuthRead) return Promise.reject(new Error('synthetic_auth_read')); return Promise.resolve({value: localStorage.getItem(pendingKey) || undefined}); }
        if (method === 'setPending') { localStorage.setItem(pendingKey, options.value); return Promise.resolve({}); }
        if (method === 'clearPending') { localStorage.removeItem(pendingKey); return Promise.resolve({}); }
        if (method === 'getWhatsAppApps') return Promise.resolve({business: window.__native.businessInstalled, personal: !window.__native.soleBusiness});
        if (method === 'prepareOtp') return Promise.resolve({available: true});
        if (method === 'consumeWhatsAppOtp') {
          const code = window.__native.autoCode; window.__native.autoCode = '';
          if (window.__native.consumeDelayOnce) {
            window.__native.consumeDelayOnce = false;
            return new Promise((resolve) => setTimeout(() => resolve({code}), 80));
          }
          return Promise.resolve({code});
        }
        if (method === 'clearWhatsAppOtp') return Promise.resolve({});
        if (method === 'openMeta') { window.__native.calls.push({plugin, method, options}); window.__native.browser.push(options.url); return Promise.resolve({}); }
      }
      if (plugin === 'LocalNotifications') {
        window.__native.calls.push({plugin, method, options});
        if (method === 'checkPermissions' || method === 'requestPermissions') return Promise.resolve({display: window.__native.notificationPermission});
        return Promise.resolve({});
      }
      if (plugin === 'Browser' && method === 'open') { window.__native.browser.push(options.url); return Promise.resolve({}); }
      if (plugin === 'RocotoNative' || plugin === 'Haptics') { window.__native.calls.push({plugin, method, options}); return Promise.resolve({performed: true}); }
      if (plugin === 'Preferences') { const key = `pref:${options.key}`; if (method === 'get') return Promise.resolve({value: localStorage.getItem(key) || undefined}); localStorage.setItem(key, options.value); return Promise.resolve({}); }
      if (plugin === 'App' && method === 'getLaunchUrl') return Promise.resolve({url: window.__native.launchUrl || undefined});
      if (plugin === 'App') return Promise.resolve({});
      if (plugin === 'CapacitorHttp' && method === 'request') {
        const url = new URL(options.url);
        const path = url.pathname.replace('/api/bodega', '');
        const body = options.data || {};
        window.__native.requests.push({path, method: options.method, body});
        if (path === '/mobile/otp/start') {
          if (window.__native.failOtpProvider) return response(503, {error: {code: 'bodega_otp_provider_unavailable'}});
          model.phone = body.phone; model.otpAttempt = 'otp_attempt_0123456789abcd'; model.clientSecret = body.clientSecret; save(model);
          return response(201, {attempt: model.otpAttempt, expiresAt: Math.floor(Date.now()/1000)+(window.__native.otpAlreadyExpired ? -1 : 300)});
        }
        if (path === '/mobile/otp/redeem') {
          if (body.code !== '123456' || body.attempt !== model.otpAttempt || body.clientSecret !== model.clientSecret) return response(401, {error: {code: 'bodega_otp_code_refused'}});
          model.signed = true; save(model); return response(200, {token});
        }
        if (path === '/mobile/session/start') { if (!model.signed) return response(401, {error: {code: 'bodega_session_required'}}); model.attempt = 'attempt_0123456789abcdef'; save(model); return response(201, {attempt: model.attempt, expiresAt: Math.floor(Date.now() / 1000) + 600}); }
        if (path === '/mobile/session/redeem') {
          if (body.attempt !== model.attempt || !/^[A-Za-z0-9_-]{43}$/.test(body.verifier) || body.code !== 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC') return response(401, {error: {code: 'bodega_mobile_verifier_refused'}});
          if (window.__native.failMetaTerminalOnce) { window.__native.failMetaTerminalOnce = false; return response(409, {error: {code: 'bodega_mobile_attempt_unavailable'}}); }
          model.signed = true; model.connection = true; model.metaRedeemed = true; model.metaToken = model.metaToken || token; save(model);
          if (window.__native.loseMetaResponseOnce) { window.__native.loseMetaResponseOnce = false; return Promise.reject(new Error('synthetic_meta_response_lost')); }
          return response(200, {token: model.metaToken, expiresAt: Math.floor(Date.now() / 1000) + 86400, session: {signedIn: true, phone: model.phone, connection: true}});
        }
        if (path === '/mobile/session/status') {
          if (body.attempt !== model.attempt || !/^[A-Za-z0-9_-]{43}$/.test(body.verifier)) return response(401, {error: {code: 'bodega_mobile_verifier_refused'}});
          if (window.__native.sessionStatusPendingOnce) { window.__native.sessionStatusPendingOnce = false; return response(200, {status: 'pending'}); }
          return response(200, {status: model.connection ? 'approved' : 'pending'});
        }
        if (path === '/session') return response(model.signed && options.headers && options.headers.Authorization ? 200 : 401, model.signed ? {signedIn: true, phone: model.phone, connection: model.connection, onboarded: model.onboarded} : {signedIn: false, phone: '', connection: false, onboarded: false});
        if (path === '/waitlist') {
          if (!model.onboarded) return response(409, {error: {code: 'bodega_onboarding_pending'}});
          return response(200, {place: 27, ahead: 26, referralCode, referralUrl: 'https://soyrocoto.com/en/?ref=ABC234', statusUrl: 'https://demo.soyrocoto.com/bodega-pay-later/lista/ABC234', joined: '2026-09-22T00:00:00Z', coveredPurchases: 0, joinedThroughYou: 0, onboarded: true});
        }
        if (path === '/business' && options.method === 'GET') return response(200, model.business);
        if (path === '/business' && (options.method === 'PUT' || options.method === 'PATCH')) { if (window.__native.failBusinessWrite) return response(503, {error: {code: 'bodega_mobile_write_failed'}}); model.business = {...model.business, ...body}; save(model); return response(200, model.business); }
        if (path === '/address/suggestions') return response(200, {provider: 'fixture', suggestions: [{placeId: 'fixture-larco', text: 'Av. Larco 345, Miraflores, Lima, Perú', mainText: 'Av. Larco 345', secondaryText: 'Miraflores, Lima, Perú'}]});
        if (path === '/address/place') return response(200, {placeId: 'fixture-larco', text: 'Av. Larco 345, Miraflores, Lima, Perú', lat: -12.1211, lng: -77.0292});
        if (path === '/referral/attribute') return response(200, {attributed: false});
        if (path === '/onboarded') { if (!model.connection) return response(409, {error: {code: 'bodega_connection_required'}}); if (window.__native.failCompletion) return response(503, {error: {code: 'bodega_mobile_completion_failed'}}); if (!model.business.kind || !model.business.name || !model.business.address) return response(409, {error: {code: 'bodega_business_required'}}); model.onboarded = true; save(model); return response(200, {onboarded: true}); }
        if (path === '/mobile/session/logout') { model.signed = false; save(model); return response(204, null); }
        return response(404, {error: {code: 'unhandled_native_fixture'}});
      }
      return Promise.resolve({});
    },
  };
  window.__native = { browser: [], requests: [], calls: [], model, exposeToken: true, soleBusiness: false, businessInstalled: true, notificationPermission: 'granted', failAuthRead: false, failAuthWrite: false, failCompletion: false, failMetaTerminalOnce: false, loseMetaResponseOnce: false, otpAlreadyExpired: false, consumeDelayOnce: false, launchUrl: '',
    sessionStatusPendingOnce: false,
    emitAppUrl: (url) => (listeners.appUrlOpen || []).forEach((callback) => callback({url})),
    emitOtp: () => (listeners.whatsAppOtp || []).forEach((callback) => callback({})),
    emitMetaReturn: (outcome) => (listeners.metaReturn || []).forEach((callback) => callback({outcome})),
    emitActive: () => (listeners.appStateChange || []).forEach((callback) => callback({isActive: true})),
    resetModel: () => { localStorage.removeItem(tokenKey); localStorage.removeItem(pendingKey); localStorage.removeItem(modelKey); },
  };
})();"""


async def expect_native(page):
    assert await page.evaluate("window.Capacitor.getPlatform()") == "android"
    assert await page.evaluate("window.Capacitor.isNativePlatform()") is True


async def open_context(pw, profile, origin, preload="", viewport=None):
    context = await pw.chromium.launch_persistent_context(profile, headless=True, viewport=viewport or {"width": 390, "height": 1600})
    context.set_default_timeout(9000)
    remote = []
    async def boundary(route):
        if urlsplit(route.request.url).netloc == urlsplit(origin).netloc:
            await route.continue_()
        else:
            remote.append(route.request.url)
            await route.abort()
    await context.route("**/*", boundary)
    await context.add_init_script(BRIDGE + preload)
    page = context.pages[0] if context.pages else await context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    await page.goto(origin + "/?lang=en")
    return context, page, remote, errors


async def no_horizontal_overflow(page):
    widths = await page.evaluate("({viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth})")
    assert widths["document"] <= widths["viewport"], widths


async def shot(page, name):
    await page.evaluate("document.fonts.ready")
    await page.wait_for_timeout(800)
    await page.screenshot(path=str(OUT / name), full_page=True)
    await no_horizontal_overflow(page)


async def assert_waitlist_not_loaded(page):
    requests = await page.evaluate("window.__native.requests.filter(r => r.path === '/waitlist').length")
    assert requests == 0, requests
    assert await page.get_by_test_id("mobile-waitlist-pass").count() == 0


async def authenticate(page, automatic=False):
    await shot(page, "390x844-welcome.png")
    await page.get_by_role("button", name="Get started", exact=True).click()
    await expect(page.get_by_test_id("mobile-phone")).to_be_visible()
    await shot(page, "390x844-phone.png")
    if not automatic:
        await page.set_viewport_size({"width":390,"height":1600})
        await shot(page, "390x1600-phone.png")
        await page.set_viewport_size({"width":390,"height":844})
    await page.set_viewport_size({"width":390,"height":508})
    await shot(page, "390x508-phone-keyboard.png")
    next_button = await page.get_by_role("button",name="Continue",exact=True).bounding_box()
    assert next_button and next_button["y"] + next_button["height"] <= 508, next_button
    await page.set_viewport_size({"width":390,"height":844})
    await page.get_by_role("textbox", name="Phone number", exact=True).fill("987654321")
    assert await page.evaluate("window.__native.browser") == []
    await page.get_by_role("button", name="Continue", exact=True).click()
    await expect(page.get_by_test_id("mobile-otp")).to_be_visible()
    await shot(page, "390x844-otp.png")
    if automatic:
        # Simulated process recreation: opaque OTP state and its client secret must survive.
        await page.reload()
        await expect(page.get_by_test_id("mobile-otp")).to_be_visible()
        await page.evaluate("window.__native.autoCode = '123456'; window.__native.emitActive()")
    else:
        await page.get_by_role("textbox", name="Six-digit code", exact=True).fill("000000")
        await expect(page.get_by_role("alert")).to_be_visible()
        assert await page.evaluate("localStorage.getItem('rocoto-native-auth-token')") is None
        await page.get_by_role("textbox", name="Six-digit code", exact=True).fill("123456")
    await expect(page.get_by_test_id("mobile-business-profile")).to_be_visible()
    await expect(page.get_by_role("heading", name="What is your business?", exact=True)).to_be_visible()
    await shot(page, "390x844-business-kind.png")
    await page.set_viewport_size({"width": 320, "height": 568})
    await shot(page, "320x568-business-kind.png")
    cards = await page.get_by_test_id("mobile-business-kinds").locator("button").evaluate_all(
        "nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return {top: box.top, bottom: box.bottom}; })"
    )
    assert len(cards) == 3 and all(card["top"] >= 0 and card["bottom"] <= 568 for card in cards), cards
    await page.set_viewport_size({"width": 390, "height": 844})
    assert await page.evaluate("window.__native.browser") == []
    assert await page.evaluate("window.__native.model.connection") is False
    await assert_waitlist_not_loaded(page)


async def profile_walk(page):
    await page.get_by_test_id("mobile-business-kind-bodega").click()
    await expect(page.get_by_test_id("mobile-business-name-input")).to_have_value("Bodega Ana")
    await shot(page, "390x844-business-name.png")
    await page.evaluate("window.dispatchEvent(new Event('rocoto:profile-back'))")
    await expect(page.get_by_test_id("mobile-business-kinds")).to_be_visible()
    await page.get_by_test_id("mobile-business-kind-bodega").click()
    await expect(page.get_by_test_id("mobile-business-name-input")).to_be_visible()
    await page.get_by_test_id("question-next").click()
    await expect(page.get_by_test_id("address-query")).to_be_visible()
    await shot(page, "390x844-address-search.png")
    await page.get_by_test_id("address-query").fill("Larco")
    await expect(page.get_by_test_id("address-suggestion")).to_be_visible()
    await page.get_by_test_id("address-suggestion").click()
    await expect(page.get_by_test_id("address-map")).to_be_visible()
    await shot(page, "390x844-address.png")
    await page.get_by_test_id("address-confirm").click()
    await expect(page.get_by_role("heading", name="Which WhatsApp do you use?", exact=True)).to_be_visible()
    await shot(page, "390x844-whatsapp-choice.png")
    assert await page.evaluate("window.__native.model.onboarded") is False
    assert await page.evaluate("window.__native.browser") == []
    await assert_waitlist_not_loaded(page)


async def meta_last(page, install=False):
    if install:
        await page.evaluate("window.__native.businessInstalled = false")
        await page.get_by_test_id("whatsapp-choice-whatsapp").click()
        await expect(page.get_by_role("heading", name="Install WhatsApp Business", exact=True)).to_be_visible()
        await shot(page, "390x844-whatsapp-install.png")
        assert await page.evaluate("window.__native.browser") == []
        await page.evaluate("window.__native.businessInstalled = true; window.__native.emitActive()")
    else:
        await page.get_by_test_id("whatsapp-choice-business").click()
    await expect(page.get_by_test_id("mobile-connection-progress")).to_be_visible()
    await shot(page, "390x844-meta.png")
    assert len(await page.evaluate("window.__native.browser")) == 1
    handoff = await page.evaluate("""window.__native.calls.filter(c =>
      (c.plugin === 'LocalNotifications' && ['checkPermissions','createChannel'].includes(c.method)) ||
      (c.plugin === 'RocotoNative' && c.method === 'showConnectionReminder') ||
      (c.plugin === 'RocotoAuth' && c.method === 'openMeta'))""")
    assert [(call["plugin"], call["method"]) for call in handoff[-4:]] == [
        ("LocalNotifications", "checkPermissions"),
        ("LocalNotifications", "createChannel"),
        ("RocotoNative", "showConnectionReminder"),
        ("RocotoAuth", "openMeta"),
    ], handoff
    reminder_expiry = handoff[-2]["options"]["expiresAt"]
    now = await page.evaluate("Math.floor(Date.now()/1000)")
    assert now < reminder_expiry <= now + 600, reminder_expiry

    cancels_before_close = await page.evaluate("window.__native.calls.filter(c => c.plugin === 'RocotoNative' && c.method === 'cancelConnectionNotifications').length")
    await page.evaluate("window.__native.emitMetaReturn('closed')")
    await page.wait_for_function("before => window.__native.calls.filter(c => c.plugin === 'RocotoNative' && c.method === 'cancelConnectionNotifications').length > before", arg=cancels_before_close)
    pending_after_close = await page.evaluate("JSON.parse(localStorage.getItem('rocoto-native-auth-pending'))")
    assert pending_after_close["attempt"] == "attempt_0123456789abcdef", pending_after_close
    assert len(await page.evaluate("window.__native.browser")) == 1
    cancels_after_close = await page.evaluate("window.__native.calls.filter(c => c.plugin === 'RocotoNative' && c.method === 'cancelConnectionNotifications').length")
    for bad in ["rocoto://auth?attempt=wrong&code=", "https://outside.invalid/bodega-app/auth?attempt=attempt_0123456789abcdef&code="]:
        await page.evaluate("url => window.__native.emitAppUrl(url)", bad + CODE)
    await page.wait_for_timeout(80)
    assert await page.evaluate("window.__native.model.connection") is False
    await page.evaluate("url => window.__native.emitAppUrl(url)", "https://demo.soyrocoto.com/bodega-app/auth?attempt=attempt_0123456789abcdef&code=" + CODE)
    await expect(page.get_by_test_id("mobile-connection-complete")).to_be_visible()
    await page.wait_for_timeout(120)
    await assert_waitlist_not_loaded(page)
    await expect(page.get_by_role("heading", name="3 loans at 0% interest", exact=True)).to_be_visible()
    assert await page.evaluate("window.__native.model.connection && window.__native.model.onboarded") is True
    assert await page.evaluate("window.__native.calls.filter(c => c.plugin === 'RocotoNative' && c.method === 'cancelConnectionNotifications').length") > cancels_after_close
    assert await page.evaluate("window.__native.calls.some(c => c.plugin === 'RocotoNative' && c.method === 'haptic' && c.options.kind === 'confirm')") is True


async def main():
    assert (DIST / "index.html").is_file(), f"Build Android assets first: {DIST}"
    OUT.mkdir(parents=True, exist_ok=True)
    handler = functools.partial(type("Quiet", (http.server.SimpleHTTPRequestHandler,), {"log_message": lambda *args: None}), directory=str(DIST))
    server = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_address[1]}"
    try:
        async with async_playwright() as pw:
            for automatic in [False, True]:
                with tempfile.TemporaryDirectory(prefix="rocoto-native-phone-") as profile:
                    context, page, remote, errors = await open_context(pw, profile, origin, viewport={"width":390,"height":844})
                    await expect_native(page)
                    await authenticate(page, automatic=automatic)
                    await profile_walk(page)
                    await meta_last(page, install=automatic)
                    for width, height in [(320,568),(390,844),(1600,1000)]:
                        await page.set_viewport_size({"width":width,"height":height})
                        await shot(page, f"{width}x{height}-waitlist-home.png")
                        card = await page.get_by_test_id("mobile-waitlist-pass").bounding_box()
                        assert card and card["y"] >= 0 and card["y"] + card["height"] <= 280, card
                    await page.get_by_role("button", name="Invite a business", exact=True).click()
                    shares = await page.evaluate("window.__native.calls.filter(c => c.method === 'share')")
                    assert len(shares) == 1 and shares[0]["options"]["text"].count("https://soyrocoto.com/en/?ref=ABC234") == 1
                    assert "subject to assessment and approval" in shares[0]["options"]["text"]
                    await page.reload()
                    await expect(page.get_by_role("heading", name="3 loans at 0% interest", exact=True)).to_be_visible()
                    assert remote == [], remote
                    assert errors == [], errors
                    await context.close()
            old_account = """
                window.__native.model.signed = true;
                localStorage.setItem('rocoto-native-auth-token', 'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT');
                localStorage.setItem('rocoto-bodega-mobile-draft-account-v1', '+51911111111');
                localStorage.setItem('rocoto-bodega-joining', JSON.stringify({kind:'bodega',name:'Another account',address:null,yape:false}));
                localStorage.setItem('rocoto-bodega-mobile-walk-step-v1', 'address');
            """
            with tempfile.TemporaryDirectory(prefix="rocoto-native-account-scope-") as profile:
                context,page,remote,errors = await open_context(pw,profile,origin,old_account)
                await expect(page.get_by_test_id("mobile-business-profile")).to_be_visible()
                draft = await page.evaluate("JSON.parse(localStorage.getItem('rocoto-bodega-joining'))")
                assert draft["name"] == "Bodega Ana" and draft["kind"] is None
                assert 'Another account' not in await page.locator('body').inner_text()
                assert await page.evaluate("localStorage.getItem('rocoto-bodega-mobile-walk-step-v1')") == 'business'
                await context.close()
            with tempfile.TemporaryDirectory(prefix="rocoto-native-provider-") as profile:
                context,page,remote,errors = await open_context(pw,profile,origin,"window.__native.failOtpProvider = true;",viewport={"width":320,"height":568})
                await page.get_by_role("button",name="Get started",exact=True).click()
                await page.get_by_role("textbox",name="Phone number",exact=True).fill("987654321")
                await page.get_by_role("button",name="Continue",exact=True).click()
                await expect(page.get_by_role("alert")).to_contain_text("Verification is being prepared")
                assert await page.evaluate("localStorage.getItem('rocoto-native-auth-token')") is None
                assert await page.evaluate("window.__native.browser") == []
                await shot(page,"320x568-phone-unavailable.png")
                await context.close()

            legacy_missing_name = """
                window.__native.model.signed = true;
                window.__native.model.connection = true;
                window.__native.model.onboarded = true;
                window.__native.model.business = {personName:'',kind:'bodega',name:'Legacy Market',address:{placeId:'fixture-larco',text:'Av. Larco 345, Miraflores, Lima, Perú',lat:-12.1211,lng:-77.0292}};
                localStorage.setItem('rocoto-native-account-model', JSON.stringify(window.__native.model));
                localStorage.setItem('rocoto-native-auth-token', 'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT');
            """
            with tempfile.TemporaryDirectory(prefix="rocoto-native-legacy-name-") as profile:
                context,page,remote,errors = await open_context(pw,profile,origin,legacy_missing_name,viewport={"width":390,"height":844})
                await expect(page.get_by_test_id("mobile-person")).to_be_visible()
                await shot(page,"390x844-person-name.png")
                await page.get_by_role("textbox",name="Your name",exact=True).fill("Ana")
                await page.get_by_role("button",name="Continue",exact=True).click()
                await expect(page.get_by_role("heading",name="3 loans at 0% interest",exact=True)).to_be_visible()
                assert await page.evaluate("window.__native.model.business.personName") == "Ana"
                assert remote == [] and errors == [], (remote, errors)
                await context.close()

            with tempfile.TemporaryDirectory(prefix="rocoto-native-expired-otp-") as profile:
                context,page,remote,errors = await open_context(pw,profile,origin,"window.__native.otpAlreadyExpired = true;",viewport={"width":390,"height":844})
                await page.get_by_role("button",name="Get started",exact=True).click()
                await page.get_by_role("textbox",name="Phone number",exact=True).fill("987654321")
                await page.get_by_role("button",name="Continue",exact=True).click()
                await expect(page.get_by_test_id("mobile-otp")).to_be_visible()
                resend = page.get_by_role("button",name="Send another code",exact=True)
                await expect(resend).to_be_enabled()
                await resend.click()
                starts = await page.evaluate("window.__native.requests.filter(r => r.path === '/mobile/otp/start').length")
                assert starts == 2, starts
                assert remote == [] and errors == [], (remote, errors)
                await context.close()

            with tempfile.TemporaryDirectory(prefix="rocoto-native-uk-phone-") as profile:
                context,page,remote,errors = await open_context(pw,profile,origin,viewport={"width":390,"height":844})
                await page.get_by_role("button",name="Get started",exact=True).click()
                await page.get_by_role("combobox",name="Country code",exact=True).select_option("+44")
                await page.get_by_role("textbox",name="Phone number",exact=True).fill("07911 123456")
                await page.get_by_role("button",name="Continue",exact=True).click()
                await expect(page.get_by_test_id("mobile-otp")).to_be_visible()
                sent_phone = await page.evaluate("window.__native.requests.find(r => r.path === '/mobile/otp/start').body.phone")
                assert sent_phone == "+447911123456", sent_phone
                assert remote == [] and errors == [], (remote, errors)
                await context.close()

            with tempfile.TemporaryDirectory(prefix="rocoto-native-otp-race-") as profile:
                context,page,remote,errors = await open_context(pw,profile,origin,viewport={"width":390,"height":844})
                await page.get_by_role("button",name="Get started",exact=True).click()
                await page.get_by_role("textbox",name="Phone number",exact=True).fill("987654321")
                await page.get_by_role("button",name="Continue",exact=True).click()
                await expect(page.get_by_test_id("mobile-otp")).to_be_visible()
                await page.wait_for_timeout(120)
                await page.evaluate("""() => {
                    window.__native.consumeDelayOnce = true;
                    window.__native.emitActive();
                    setTimeout(() => { window.__native.autoCode = '123456'; window.__native.emitOtp(); }, 10);
                }""")
                await expect(page.get_by_test_id("mobile-business-profile")).to_be_visible()
                redeems = await page.evaluate("window.__native.requests.filter(r => r.path === '/mobile/otp/redeem').length")
                assert redeems == 1, redeems
                assert remote == [] and errors == [], (remote, errors)
                await context.close()

            complete_business = "{personName:'Ana',kind:'bodega',name:'Bodega Ana',address:{placeId:'fixture-larco',text:'Av. Larco 345, Miraflores, Lima, Perú',lat:-12.1211,lng:-77.0292}}"
            pending_meta = "{kind:'meta',attempt:'attempt_0123456789abcdef',verifier:'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',expiresAt:Math.floor(Date.now()/1000)+600,code:'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',phoneBound:true}"
            terminal_meta = f"""
                window.__native.model.signed = true;
                window.__native.model.business = {complete_business};
                window.__native.model.attempt = 'attempt_0123456789abcdef';
                window.__native.failMetaTerminalOnce = true;
                localStorage.setItem('rocoto-native-account-model', JSON.stringify(window.__native.model));
                localStorage.setItem('rocoto-native-auth-token', '{TOKEN}');
                localStorage.setItem('rocoto-native-auth-pending', JSON.stringify({pending_meta}));
            """
            with tempfile.TemporaryDirectory(prefix="rocoto-native-terminal-meta-") as profile:
                context,page,remote,errors = await open_context(pw,profile,origin,terminal_meta,viewport={"width":390,"height":844})
                await expect(page.get_by_role("heading",name="Which WhatsApp do you use?",exact=True)).to_be_visible()
                assert await page.evaluate("localStorage.getItem('rocoto-native-auth-pending')") is None
                assert await page.get_by_text("Preparing Rocoto…",exact=True).count() == 0
                assert remote == [] and errors == [], (remote, errors)
                await context.close()

            lost_meta = f"""
                window.__native.model.signed = true;
                window.__native.model.business = {complete_business};
                window.__native.model.attempt = 'attempt_0123456789abcdef';
                window.__native.sessionStatusPendingOnce = true;
                localStorage.setItem('rocoto-native-account-model', JSON.stringify(window.__native.model));
                localStorage.setItem('rocoto-native-auth-token', '{TOKEN}');
                localStorage.setItem('rocoto-native-auth-pending', JSON.stringify({{kind:'meta',attempt:'attempt_0123456789abcdef',verifier:'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',expiresAt:Math.floor(Date.now()/1000)+600,phoneBound:true}}));
            """
            with tempfile.TemporaryDirectory(prefix="rocoto-native-meta-replay-") as profile:
                context,page,remote,errors = await open_context(pw,profile,origin,lost_meta,viewport={"width":390,"height":844})
                await expect(page.get_by_test_id("mobile-connection-progress")).to_be_visible()
                await assert_waitlist_not_loaded(page)
                await page.evaluate("window.__native.model.connection = true; window.__native.emitActive()")
                await expect(page.get_by_test_id("mobile-connection-complete")).to_be_visible()
                await expect(page.get_by_role("heading",name="3 loans at 0% interest",exact=True)).to_be_visible()
                statuses = await page.evaluate("window.__native.requests.filter(r => r.path === '/mobile/session/status').length")
                assert statuses >= 1, statuses
                assert await page.evaluate("window.__native.requests.filter(r => r.path === '/mobile/session/start').length") == 0
                assert await page.evaluate("window.__native.browser") == []
                assert await page.evaluate("localStorage.getItem('rocoto-native-auth-token')") == TOKEN
                assert await page.evaluate("window.__native.model.onboarded") is True
                assert remote == [] and errors == [], (remote, errors)
                await context.close()
        print(f"GREEN WhatsApp-first native: manual/automatic OTP, UK E.164, expired resend, busy-refresh trailing consume, provider refusal, migrated name repair, profile before Meta, install-return, terminal callback recovery without a second Meta launch, completion, account scope, referral link, restart and small screens. {OUT}")
    finally:
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    asyncio.run(main())
