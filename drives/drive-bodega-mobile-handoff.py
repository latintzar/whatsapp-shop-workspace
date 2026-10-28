#!/usr/bin/env python3
"""Hosted Bodega-to-Android handoff proof with a local Meta and API seam.

Run:
  ROCOTO_DIST=app/dist-bodega-mobile-handoff .venv/bin/python drives/drive-bodega-mobile-handoff.py

The artifact is the real browser bundle. Every provider/proof response is intercepted in the
browser, including a synthetic Facebook SDK completion; no request reaches Meta or the runtime.
"""
import asyncio
import functools
import http.server
import json
import os
import pathlib
import socketserver
import threading
from urllib.parse import urlsplit

from playwright.async_api import async_playwright, expect

DIST = pathlib.Path(os.environ.get("ROCOTO_DIST", "app/dist-bodega-mobile-handoff")).resolve()
ATTEMPT = "attempt_0123456789abcdef"
PHONE = "+51987654321"
CODE = "C" * 43
CALLBACK = f"https://demo.soyrocoto.com/bodega-app/auth?attempt={ATTEMPT}&code={CODE}"
TOKEN = "native-bearer-must-not-appear-in-the-hosted-browser"

META = r"""(() => {
  window.FB = {
    init() {},
    login(callback) {
      callback({authResponse: {code: 'synthetic-meta-code'}});
      if (new URLSearchParams(window.location.search).get('hold_meta_finish') === '1') return;
      setTimeout(() => window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://www.facebook.com', data: {type: 'WA_EMBEDDED_SIGNUP',
          event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
          data: {waba_id: '123456789', phone_number_id: '987654321'}}
      })), 0);
    },
  };
})();"""


def proof_state(connection=None):
    return {
        "ready": True, "blockers": [],
        "meta": {"appId": "123", "configId": "4618748161700706", "graphVersion": "v24.0"},
        "connection": connection,
        "setup": {"status": "ready", "step": "complete", "error": None},
        "history": {"status": "complete", "progress": 100, "messages": 0, "conversations": 0,
                    "oldestAt": None, "newestAt": None},
    }


class Fixture:
    def __init__(self, mode):
        self.mode = mode
        self.requests = []
        self.callbacks = []
        self.approvals = 0
        self.proof_sessions = 0
        self.connection_checks = 0
        self.stale_connection = mode == "stale"
        self.fresh_sdk_connected = False
        self.state_lock_pending = False
        self.state_renewed = False
        self.approve_network_failure = mode == "network"
        self.durable_connection_ready = False
        self.state_reads = 0

    async def api(self, route):
        request = route.request
        path = urlsplit(request.url).path
        body = request.post_data or ""
        self.requests.append({"path": path, "headers": request.headers, "body": body})

        def response(status, value):
            return route.fulfill(status=status, content_type="application/json", body=json.dumps(value))

        if path == "/api/bodega/session":
            if self.mode == "disconnected":
                return await response(200, {"signedIn": True, "phone": PHONE, "connection": False})
            if self.mode in ("saved", "malformed", "network"):
                return await response(200, {"signedIn": True, "phone": PHONE})
            return await response(200, {"signedIn": False, "phone": ""})
        if path == "/api/bodega/session/connection":
            self.connection_checks += 1
            if self.mode == "stale" and not self.fresh_sdk_connected:
                self.stale_connection = False
                self.state_lock_pending = True
                return await response(401, {"error": {"code": "bodega_connection_absent"}})
            return await response(200, {"signedIn": True, "phone": PHONE})
        if path == "/api/bodega/mobile/session/approve":
            self.approvals += 1
            if self.approve_network_failure:
                self.approve_network_failure = False
                return await route.abort("failed")
            if self.mode == "malformed":
                return await response(200, {"code": "malformed"})
            return await response(200, {"code": CODE})
        if path == "/api/proof/session":
            self.proof_sessions += 1
            return await response(200, {"ok": True})
        if path == "/api/proof/state":
            self.state_reads += 1
            if self.mode == "returning" and self.durable_connection_ready:
                return await response(200, proof_state({
                    "wabaId": "123456789", "phoneId": "987654321", "number": PHONE,
                    "name": "Fixture Bodega", "coexistence": True,
                }))
            if self.state_lock_pending:
                self.state_lock_pending = False
                self.state_renewed = True
                return await response(401, {"detail": "expired synthetic browser cookie"})
            if self.stale_connection:
                return await response(200, proof_state({"wabaId": "123456789", "phoneId": "987654321",
                                                         "number": PHONE, "name": "Fixture Bodega",
                                                         "coexistence": True}))
            return await response(200, proof_state())
        if path == "/api/proof/whatsapp/code":
            return await response(200, {"authorizationId": "synthetic-authorization"})
        if path == "/api/proof/whatsapp/connect":
            self.fresh_sdk_connected = True
            if self.mode == "returning":
                # The provider operation committed, but the response was lost on its way back.
                self.durable_connection_ready = True
                await route.abort("failed")
                return
            return await response(200, proof_state({"wabaId": "123456789", "phoneId": "987654321",
                                                     "number": PHONE, "name": "Fixture Bodega",
                                                     "coexistence": True}))
        raise AssertionError(f"Unhandled browser handoff request: {path} {body}")

    async def callback(self, route):
        self.callbacks.append(route.request.url)
        await route.abort("blockedbyclient")


async def open_page(browser, origin, fixture):
    context = await browser.new_context(viewport={"width": 390, "height": 844})
    await context.add_init_script(META)
    external = []

    async def boundary(route):
        url = route.request.url
        if urlsplit(url).netloc == urlsplit(origin).netloc:
            await route.continue_()
        else:
            external.append(url)
            await route.abort("blockedbyclient")

    await context.route("**/*", boundary)
    # Playwright evaluates the most recently registered route first. Install the broad boundary
    # before these local seams so API and callback routes consume their own requests.
    await context.route("**/api/bodega/**", fixture.api)
    await context.route("**/api/proof/**", fixture.api)
    await context.route("https://demo.soyrocoto.com/bodega-app/auth**", fixture.callback)
    page = await context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    hold = "&hold_meta_finish=1" if fixture.mode == "missing_finish" else ""
    await page.goto(f"{origin}/bodega-pay-later/?mobile={ATTEMPT}{hold}#/start/connect")
    return context, page, external, errors


def assert_private(fixture):
    for request in fixture.requests:
        assert "authorization" not in request["headers"], request
        assert TOKEN not in request["body"], request


async def wait_for_callback(page, fixture):
    for _ in range(400):
        if fixture.callbacks:
            return
        await page.wait_for_timeout(25)
    raise AssertionError("The hosted handoff never attempted its App Link callback")


async def saved_requires_click(browser, origin):
    fixture = Fixture("saved")
    context, page, external, errors = await open_page(browser, origin, fixture)
    try:
        await expect(page.get_by_text(PHONE, exact=True)).to_be_visible()
        await expect(page.get_by_test_id("mobile-authorize-return")).to_be_visible()
        assert fixture.approvals == 0, "a saved browser session must wait for account confirmation"
        await page.get_by_test_id("mobile-authorize-return").click()
        await wait_for_callback(page, fixture)
        assert fixture.approvals == 1
        assert fixture.callbacks == [CALLBACK]
        assert_private(fixture)
        assert external == []
        assert errors == []
    finally:
        await context.close()


async def fresh_meta_auto_returns(browser, origin):
    fixture = Fixture("fresh")
    context, page, external, errors = await open_page(browser, origin, fixture)
    try:
        connect = page.get_by_test_id("connect-meta")
        await expect(connect).to_be_enabled()
        await connect.click()
        await wait_for_callback(page, fixture)
        assert fixture.approvals == 1, "one verified Meta completion approves exactly once"
        assert fixture.callbacks == [CALLBACK]
        assert not await page.get_by_test_id("whatsapp-connection-continue").count(), "the fresh finish needs no Continue press"
        assert_private(fixture)
        assert external == []
        assert errors == []
    finally:
        await context.close()


async def disconnected_session_reconnects_meta(browser, origin):
    fixture = Fixture("disconnected")
    context, page, external, errors = await open_page(browser, origin, fixture)
    try:
        connect = page.get_by_test_id("connect-meta")
        await expect(connect).to_be_enabled()
        assert not await page.get_by_test_id("mobile-authorize-return").count(), (
            "an explicitly disconnected session must open Meta setup before approval"
        )
        await connect.click()
        await wait_for_callback(page, fixture)
        assert fixture.fresh_sdk_connected and fixture.connection_checks == 1
        assert fixture.approvals == 1 and fixture.callbacks == [CALLBACK]
        assert_private(fixture)
        assert external == []
        assert errors == []
    finally:
        await context.close()


async def returning_tab_recovers_verified_connection(browser, origin):
    fixture = Fixture("returning")
    context, page, external, errors = await open_page(browser, origin, fixture)
    try:
        connect = page.get_by_test_id("connect-meta")
        await expect(connect).to_be_enabled()
        await connect.click()
        await wait_for_callback(page, fixture)
        assert fixture.state_reads >= 3, "return recovery must read the existing proof session"
        assert sum(request["path"] == "/api/proof/whatsapp/connect" for request in fixture.requests) == 1, (
            "recovery observes the one provider operation whose response was lost"
        )
        assert fixture.approvals == 1 and fixture.callbacks == [CALLBACK]
        assert_private(fixture)
        assert external == []
        assert errors == []
    finally:
        await context.close()


async def missing_finish_stays_pending(browser, origin):
    fixture = Fixture("missing_finish")
    context, page, external, errors = await open_page(browser, origin, fixture)
    try:
        await page.get_by_test_id("connect-meta").click()
        await expect(page.get_by_test_id("meta-handoff-progress")).to_be_visible()
        await page.wait_for_timeout(1750)
        assert fixture.state_reads >= 2, "the active attempt may inspect only its browser proof state"
        assert not fixture.fresh_sdk_connected, "a missing Meta FINISH cannot start provider setup"
        assert fixture.approvals == 0 and fixture.callbacks == []
        assert_private(fixture)
        assert external == []
        assert errors == []
    finally:
        await context.close()


async def malformed_code_stays(browser, origin):
    fixture = Fixture("malformed")
    context, page, external, errors = await open_page(browser, origin, fixture)
    try:
        await expect(page.get_by_test_id("mobile-authorize-return")).to_be_visible()
        await page.get_by_test_id("mobile-authorize-return").click()
        await expect(page.get_by_role("alert")).to_be_visible()
        await page.wait_for_timeout(120)
        assert fixture.approvals == 1 and fixture.callbacks == []
        assert_private(fixture)
        assert external == []
        assert errors == []
    finally:
        await context.close()


async def network_failure_retries(browser, origin):
    fixture = Fixture("network")
    context, page, external, errors = await open_page(browser, origin, fixture)
    try:
        action = page.get_by_test_id("mobile-authorize-return")
        await expect(action).to_be_visible()
        await action.click()
        await expect(page.get_by_role("alert")).to_be_visible()
        assert fixture.approvals == 1 and fixture.callbacks == []
        await action.click()
        await wait_for_callback(page, fixture)
        assert fixture.approvals == 2 and fixture.callbacks == [CALLBACK]
        assert_private(fixture)
        assert external == []
        assert errors == []
    finally:
        await context.close()


async def stale_connection_renews_and_auto_returns(browser, origin):
    fixture = Fixture("stale")
    context, page, external, errors = await open_page(browser, origin, fixture)
    try:
        for _ in range(280):
            if fixture.state_renewed and fixture.proof_sessions >= 2:
                break
            await page.wait_for_timeout(25)
        assert fixture.connection_checks >= 1, (
            "the stale connected account must be rejected before the browser proof session renews"
        )
        assert fixture.state_renewed and fixture.proof_sessions >= 2, (
            "a rejected stale account must receive a 401 state read and renew its browser session"
        )
        await expect(page.get_by_test_id("connect-meta")).to_be_enabled()
        await page.get_by_test_id("connect-meta").click()
        await wait_for_callback(page, fixture)
        assert fixture.fresh_sdk_connected and fixture.connection_checks >= 2, (
            "the fresh same-number SDK completion must be checked again"
        )
        assert fixture.approvals == 1 and fixture.callbacks == [CALLBACK]
        assert_private(fixture)
        assert external == []
        assert errors == []
    finally:
        await context.close()


async def main():
    assert (DIST / "bodega-pay-later" / "index.html").is_file(), f"Build the web bundle first: {DIST}"
    handler = functools.partial(type("Quiet", (http.server.SimpleHTTPRequestHandler,), {
        "log_message": lambda *args: None,
    }), directory=str(DIST))
    server = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_address[1]}"
    try:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)
            try:
                await saved_requires_click(browser, origin)
                await fresh_meta_auto_returns(browser, origin)
                await disconnected_session_reconnects_meta(browser, origin)
                await returning_tab_recovers_verified_connection(browser, origin)
                await missing_finish_stays_pending(browser, origin)
                await malformed_code_stays(browser, origin)
                await network_failure_retries(browser, origin)
                await stale_connection_renews_and_auto_returns(browser, origin)
            finally:
                await browser.close()
        print("GREEN hosted handoff: saved confirmation, disconnected reconnect, fresh/lost-response Meta auto-return, missing FINISH pending, malformed code, retry, stale renewal same identity, no bearer leak", flush=True)
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    asyncio.run(main())
