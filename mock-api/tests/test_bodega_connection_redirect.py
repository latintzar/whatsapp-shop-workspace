"""The public bodega alias preserves the isolated provider probe's cookie and fixed destination."""

import httpx
import pytest
from starlette.testclient import TestClient

ORIGIN = "https://shop.example.invalid"
COOKIE = "__Host-bodega_connection_probe"


@pytest.fixture()
def client(monkeypatch):
    from app.main import app

    monkeypatch.setenv("BODEGA_BUDDY_LOOP", "off")
    monkeypatch.setenv("CEDAR_WHATSAPP_BRIDGE_ENABLED", "true")
    return TestClient(app, base_url=ORIGIN, headers={"Origin": ORIGIN})


def test_start_reaches_only_the_fixed_provider_service(client, monkeypatch):
    from app import bodega_connection_redirect as bridge

    seen = []

    async def respond(request):
        seen.append(request)
        return httpx.Response(
            303,
            headers={
                "Location": "https://www.facebook.com/v26.0/dialog/oauth?client_id=123",
                "Set-Cookie": f"{COOKIE}=" + "a" * 43 + "; Path=/; Secure; HttpOnly; SameSite=Lax",
            },
        )

    original = httpx.AsyncClient
    monkeypatch.setattr(
        bridge.httpx, "AsyncClient", lambda **kw: original(transport=httpx.MockTransport(respond))
    )
    result = client.get("/api/bodega/connection-test/start?url=https://evil.example", follow_redirects=False)
    assert result.status_code == 303
    assert result.headers["location"].startswith("https://www.facebook.com/v26.0/dialog/oauth?")
    assert COOKIE in result.headers["set-cookie"]
    assert str(seen[0].url) == "http://127.0.0.1:18243/api/proof/whatsapp/redirect/start"
    assert seen[0].headers["origin"] == "https://shop.example.invalid"


def test_complete_requires_browser_origin_and_bounds_body(client):
    client.headers.pop("origin")
    response = client.post("/api/bodega/connection-test/complete", json={"code": "private"})
    assert response.status_code == 403
    client.headers["Origin"] = ORIGIN
    assert client.post("/api/bodega/connection-test/complete", content=b"x" * 16385).status_code == 413


def test_refuses_unexpected_redirect_and_cookie(client, monkeypatch):
    from app import bodega_connection_redirect as bridge

    async def respond(request):
        return httpx.Response(
            303, headers={"Location": "https://evil.example", "Set-Cookie": "unexpected=private"}
        )

    original = httpx.AsyncClient
    monkeypatch.setattr(
        bridge.httpx, "AsyncClient", lambda **kw: original(transport=httpx.MockTransport(respond))
    )
    response = client.get("/api/bodega/connection-test/start", follow_redirects=False)
    assert response.status_code == 502
    assert "set-cookie" not in response.headers
    assert "evil.example" not in response.text


def test_complete_forwards_only_attempt_cookie_and_returns_json(client, monkeypatch):
    from app import bodega_connection_redirect as bridge

    seen = []

    async def respond(request):
        seen.append(request)
        return httpx.Response(200, json={"ok": True})

    original = httpx.AsyncClient
    monkeypatch.setattr(
        bridge.httpx, "AsyncClient", lambda **kw: original(transport=httpx.MockTransport(respond))
    )
    client.cookies.set(COOKIE, "b" * 43)
    client.cookies.set("__Host-bodega_session", "private-business-session")
    result = client.post(
        "/api/bodega/connection-test/complete", json={"code": "private", "state": "bound-state"}
    )
    assert result.status_code == 200 and result.json() == {"ok": True}
    assert seen[0].headers["cookie"] == COOKIE + "=" + "b" * 43
    assert result.headers["cache-control"] == "no-store"


def test_probe_alias_requires_existing_runtime_activation(client, monkeypatch):
    monkeypatch.delenv("CEDAR_WHATSAPP_BRIDGE_ENABLED")
    assert client.get("/api/bodega/connection-test/start", follow_redirects=False).status_code == 503


def test_resume_result_redirect_is_fixed_and_restart_requires_browser_origin(client, monkeypatch):
    from app import bodega_connection_redirect as bridge

    seen = []
    destination = 'https://shop.example.invalid/bodega-pay-later/?connection-test=direct&returned=1'

    async def respond(request):
        seen.append(request)
        return httpx.Response(303, headers={'Location': destination})

    original = httpx.AsyncClient
    monkeypatch.setattr(
        bridge.httpx, 'AsyncClient', lambda **kw: original(transport=httpx.MockTransport(respond))
    )
    response = client.get('/api/bodega/connection-test/start', follow_redirects=False)
    assert response.status_code == 303 and response.headers['location'] == destination
    response = client.post('/api/bodega/connection-test/restart', follow_redirects=False)
    assert response.status_code == 303
    assert str(seen[-1].url) == 'http://127.0.0.1:18243/api/proof/whatsapp/redirect/restart'
    assert seen[-1].method == 'POST'
    client.cookies.set(COOKIE, 'malformed-cookie')
    client.get('/api/bodega/connection-test/start', follow_redirects=False)
    assert seen[-1].headers['cookie'] == COOKIE + '=invalid'
    client.headers.pop('origin')
    assert client.post('/api/bodega/connection-test/restart').status_code == 403
    destination += '&url=https://elsewhere.example'
    response = client.get('/api/bodega/connection-test/start', follow_redirects=False)
    assert response.status_code == 502
