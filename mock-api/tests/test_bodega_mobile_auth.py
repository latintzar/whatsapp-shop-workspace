"""Native authentication proofs: opaque attempts, proof binding and one-use credentials."""

from __future__ import annotations

import base64
import hashlib
import threading
from concurrent.futures import ThreadPoolExecutor

import pytest
from starlette.testclient import TestClient
from test_bodega import CEDAR_SESSION, CONNECTED, ORIGIN, FakeTransport, configured, connection_state, sign_in

from app import bodega


def challenge(verifier: str) -> str:
    return base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()


@pytest.fixture()
def state(tmp_path, monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "state_dir", tmp_path, raising=False)
    monkeypatch.setattr(config.settings, "wa_cloud_token", "", raising=False)
    monkeypatch.setattr(config.settings, "wa_cloud_phone_id", "", raising=False)
    monkeypatch.setenv("CEDAR_WHATSAPP_BRIDGE_ENABLED", "true")
    monkeypatch.setenv("BODEGA_BUDDY_LOOP", "off")
    return tmp_path


@pytest.fixture()
def client(state):
    from app.main import app

    with TestClient(app, base_url=ORIGIN, headers={"Origin": ORIGIN}) as browser:
        yield browser


def native() -> TestClient:
    from app.main import app

    return TestClient(app, base_url=ORIGIN)


def phone_verified(phone: str = CONNECTED) -> tuple[TestClient, dict[str, str]]:
    """An OTP-equivalent bearer for an existing signed-inbound contact."""
    with bodega._db() as db:
        bodega._ensure_contact(db, phone, bodega._now())
    token, _ = bodega._mint_native_session(phone, bodega._now())
    return native(), {"Authorization": f"Bearer {token}"}


def test_legacy_anonymous_meta_handoff_start_remains_a_proofless_pending_attempt(state, monkeypatch):
    configured(monkeypatch)
    verifier = "l" * 43
    app = native()
    started = app.post("/api/bodega/mobile/session/start", json={"challenge": challenge(verifier)})
    assert started.status_code == 201, started.text
    with bodega._db() as db:
        row = db.execute(
            "SELECT expected_phone, approved_phone FROM mobile_handoffs WHERE id=?",
            (started.json()["attempt"],),
        ).fetchone()
    assert dict(row) == {"expected_phone": "", "approved_phone": ""}


def test_pkce_handoff_requires_same_phone_approval_and_exact_retry_recovers_lost_response(
    client, state, monkeypatch
):
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    verifier = "v" * 43
    app, auth = phone_verified()
    started = app.post(
        "/api/bodega/mobile/session/start", json={"challenge": challenge(verifier)}, headers=auth
    )
    assert started.status_code == 201, started.text
    attempt = started.json()["attempt"]

    pending = app.post(
        "/api/bodega/mobile/session/redeem", json={"attempt": attempt, "verifier": verifier, "code": "x" * 43}
    )
    assert pending.status_code == 409
    assert pending.json()["error"]["code"] == "bodega_mobile_pending"

    # A browser bearer cannot approve: this browser's cookie and the current Meta connection
    # are both required, and its explicit approve field is part of the request body.
    refused = client.post("/api/bodega/mobile/session/approve", json={"attempt": attempt, "approve": True})
    assert refused.status_code == 401
    sign_in(client, graph)
    approved = client.post("/api/bodega/mobile/session/approve", json={"attempt": attempt, "approve": True})
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"
    callback_code = approved.json()["code"]

    # The PKCE verifier alone cannot exchange the victim's browser approval. The callback code is
    # delivered only through the fixed native link and is held alongside the app's pending verifier.
    missing_code = app.post(
        "/api/bodega/mobile/session/redeem", json={"attempt": attempt, "verifier": verifier}
    )
    assert missing_code.status_code == 422
    wrong = app.post(
        "/api/bodega/mobile/session/redeem", json={"attempt": attempt, "verifier": verifier, "code": "x" * 43}
    )
    assert wrong.status_code == 401
    redeemed = app.post(
        "/api/bodega/mobile/session/redeem",
        json={"attempt": attempt, "verifier": verifier, "code": callback_code},
    )
    assert redeemed.status_code == 200
    token = redeemed.json()["token"]
    assert len(token) >= 43
    assert redeemed.json()["session"] == {"signedIn": True, "phone": CONNECTED, "connection": True}

    # A process may lose the first 200 before persisting it. The same held proofs recover that
    # exact live credential instead of consuming the handoff into an unrecoverable state.
    replay = app.post(
        "/api/bodega/mobile/session/redeem",
        json={"attempt": attempt, "verifier": verifier, "code": callback_code},
    )
    assert replay.status_code == 200
    assert replay.json()["token"] == token

    session = app.get("/api/bodega/session", headers={"Authorization": f"Bearer {token}"})
    assert session.json()["signedIn"] is True
    assert session.json()["connection"] is True
    assert app.get("/api/bodega/waitlist", headers={"Authorization": f"Bearer {token}"}).status_code == 200
    expired = app.get("/api/bodega/session", headers={"Authorization": f"Bearer {'z' * 43}"})
    assert expired.status_code == 401 and expired.json()["signedIn"] is False
    attacker = app.post(
        "/api/bodega/mobile/session/redeem",
        json={"attempt": attempt, "verifier": verifier, "code": "x" * 43},
    )
    assert attacker.status_code == 409
    with bodega._db() as db:
        db.execute("DELETE FROM sessions WHERE token_hash=?", (bodega._hash(token),))
    revoked = app.post(
        "/api/bodega/mobile/session/redeem",
        json={"attempt": attempt, "verifier": verifier, "code": callback_code},
    )
    assert revoked.status_code == 409


def test_bearer_bound_handoff_refuses_a_different_browser_meta_phone(client, state, monkeypatch):
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    # Make a phone-verified native credential directly, isolating the account-binding assertion.
    with bodega._db() as db:
        bodega._ensure_contact(db, CONNECTED, bodega._now())
    token, _ = bodega._mint_native_session(CONNECTED, bodega._now())
    verifier = "k" * 43
    app = native()
    start = app.post(
        "/api/bodega/mobile/session/start",
        json={"challenge": challenge(verifier)},
        headers={"Authorization": f"Bearer {token}"},
    )
    attempt = start.json()["attempt"]
    client.cookies.set(bodega.CEDAR_COOKIE, CEDAR_SESSION)
    graph.state = connection_state("+12025550144")
    client.post("/api/bodega/session/connection", json={})
    mismatch = client.post("/api/bodega/mobile/session/approve", json={"attempt": attempt, "approve": True})
    assert mismatch.status_code == 409
    assert mismatch.json()["error"]["code"] == "bodega_mobile_phone_mismatch"


def test_expired_handoff_never_mints_a_native_session(state, monkeypatch):
    configured(monkeypatch)
    verifier = "e" * 43
    app, auth = phone_verified()
    started = app.post(
        "/api/bodega/mobile/session/start", json={"challenge": challenge(verifier)}, headers=auth
    )
    assert started.status_code == 201, started.text
    attempt = started.json()["attempt"]
    now = bodega._now()
    monkeypatch.setattr(bodega, "_now", lambda: now + bodega.MOBILE_ATTEMPT_TTL + 1)
    expired = app.post(
        "/api/bodega/mobile/session/redeem", json={"attempt": attempt, "verifier": verifier, "code": "x" * 43}
    )
    assert expired.status_code == 409
    assert expired.json()["error"]["code"] == "bodega_mobile_attempt_unavailable"


def test_simultaneous_exact_meta_redeems_return_one_durable_session(client, state, monkeypatch):
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    verifier = "r" * 43
    app, auth = phone_verified()
    started = app.post(
        "/api/bodega/mobile/session/start", json={"challenge": challenge(verifier)}, headers=auth
    )
    assert started.status_code == 201
    attempt = started.json()["attempt"]
    sign_in(client, graph)
    approved = client.post("/api/bodega/mobile/session/approve", json={"attempt": attempt, "approve": True})
    assert approved.status_code == 200
    code = approved.json()["code"]

    ready = threading.Barrier(2)

    def redeem():
        ready.wait(timeout=5)
        return app.post(
            "/api/bodega/mobile/session/redeem",
            json={"attempt": attempt, "verifier": verifier, "code": code},
        )

    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: redeem(), range(2)))
    assert [response.status_code for response in responses] == [200, 200]
    assert responses[0].json()["token"] == responses[1].json()["token"]
    with bodega._db() as db:
        handoff = db.execute("SELECT session_id FROM mobile_handoffs WHERE id=?", (attempt,)).fetchone()
        sessions = list(db.execute("SELECT id FROM sessions WHERE id=?", (handoff["session_id"],)))
    assert len(sessions) == 1


def test_bound_phone_recovers_browser_approval_when_app_link_is_lost(client, state, monkeypatch):
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    app, auth = phone_verified()
    verifier = "p" * 43
    started = app.post(
        "/api/bodega/mobile/session/start", json={"challenge": challenge(verifier)}, headers=auth
    )
    attempt = started.json()["attempt"]
    body = {"attempt": attempt, "verifier": verifier}
    pending = app.post("/api/bodega/mobile/session/status", json=body, headers=auth)
    assert pending.status_code == 200
    assert pending.json()["status"] == "pending"
    sign_in(client, graph)
    # Historical account proof alone cannot complete this particular handoff.
    assert (
        app.post("/api/bodega/mobile/session/status", json=body, headers=auth).json()["status"] == "pending"
    )
    approved = client.post("/api/bodega/mobile/session/approve", json={"attempt": attempt, "approve": True})
    assert approved.status_code == 200
    # Discard the app-link code. Existing phone authority can observe this same-phone approval.
    recovered = app.post("/api/bodega/mobile/session/status", json=body, headers=auth)
    assert recovered.status_code == 200
    assert recovered.json()["status"] == "approved"
    assert "code" not in recovered.json() and "token" not in recovered.json()
    assert app.get("/api/bodega/session", headers=auth).json()["connection"] is True


def test_status_recovery_never_grants_anonymous_or_other_phone_authority(client, state, monkeypatch):
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    app, auth = phone_verified()
    verifier = "t" * 43
    started = app.post(
        "/api/bodega/mobile/session/start", json={"challenge": challenge(verifier)}, headers=auth
    )
    body = {"attempt": started.json()["attempt"], "verifier": verifier}
    sign_in(client, graph)
    client.post("/api/bodega/mobile/session/approve", json={"attempt": body["attempt"], "approve": True})
    assert app.post("/api/bodega/mobile/session/status", json=body).status_code == 401
    other_app, other_auth = phone_verified("+34600111222")
    assert (
        other_app.post("/api/bodega/mobile/session/status", json=body, headers=other_auth).status_code == 409
    )
    bad = {**body, "verifier": "u" * 43}
    assert app.post("/api/bodega/mobile/session/status", json=bad, headers=auth).status_code == 401
    anonymous = app.post("/api/bodega/mobile/session/start", json={"challenge": challenge(verifier)}).json()[
        "attempt"
    ]
    client.post("/api/bodega/mobile/session/approve", json={"attempt": anonymous, "approve": True})
    assert (
        app.post(
            "/api/bodega/mobile/session/status", json={**body, "attempt": anonymous}, headers=auth
        ).status_code
        == 409
    )
    with bodega._db() as db:
        db.execute("UPDATE mobile_handoffs SET cancelled_at=? WHERE id=?", (bodega._now(), body["attempt"]))
    assert app.post("/api/bodega/mobile/session/status", json=body, headers=auth).status_code == 409
