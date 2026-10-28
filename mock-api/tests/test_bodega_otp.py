"""WhatsApp OTP attempts are isolated from Meta handoffs and never manufacture a provider result."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

import pytest
from starlette.testclient import TestClient

from app import bodega

ORIGIN = "https://shop.example.invalid"
PHONE = "+51987654321"
SECRET = "s" * 43


@pytest.fixture()
def client(tmp_path, monkeypatch):
    from app import config
    from app.main import app

    monkeypatch.setattr(config.settings, "state_dir", tmp_path, raising=False)
    monkeypatch.setattr(config.settings, "wa_cloud_token", "provider-token", raising=False)
    monkeypatch.setattr(config.settings, "wa_cloud_phone_id", "provider-phone-id", raising=False)
    monkeypatch.setattr(config.settings, "bodega_otp_template_name", "rocoto_signin", raising=False)
    monkeypatch.setattr(config.settings, "bodega_otp_template_language", "es", raising=False)
    monkeypatch.setattr(config.settings, "bodega_otp_digest_key", "d" * 32, raising=False)
    with TestClient(app, base_url=ORIGIN) as native:
        yield native


def contact() -> None:
    with bodega._db() as db:
        bodega._ensure_contact(db, PHONE, bodega._now())


def test_uncommissioned_template_refuses_before_an_attempt_or_provider_call(client, monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "bodega_otp_template_name", "", raising=False)

    async def must_not_send(_: dict) -> str:
        raise AssertionError("provider send must not run without a configured authentication template")

    monkeypatch.setattr(bodega, "_post_messages", must_not_send)
    response = client.post("/api/bodega/mobile/otp/start", json={"phone": PHONE, "clientSecret": SECRET})
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "bodega_otp_provider_unavailable"


def test_unknown_phone_gets_an_opaque_decoy_without_a_provider_send(client, monkeypatch):
    async def must_not_send(_: dict) -> str:
        raise AssertionError("a typed number must not receive a provider send")

    monkeypatch.setattr(bodega, "_post_messages", must_not_send)
    unknown = client.post("/api/bodega/mobile/otp/start", json={"phone": PHONE, "clientSecret": SECRET})
    assert unknown.status_code == 201
    assert set(unknown.json()) == {"attempt", "expiresAt"}
    assert len(unknown.json()["attempt"]) >= 20
    refused = client.post(
        "/api/bodega/mobile/otp/redeem",
        json={"attempt": unknown.json()["attempt"], "clientSecret": SECRET, "code": "123456"},
    )
    assert refused.status_code == 401
    assert refused.json()["error"]["code"] == "bodega_otp_code_refused"

    # The public start response cannot be used as a waitlist membership oracle. A registered
    # contact gets the identical shape, while only that path calls the provider.
    contact()

    async def send(_: dict) -> str:
        return "wamid.fixture"

    monkeypatch.setattr(bodega, "_post_messages", send)
    known = client.post("/api/bodega/mobile/otp/start", json={"phone": PHONE, "clientSecret": SECRET})
    assert known.status_code == unknown.status_code
    assert set(known.json()) == set(unknown.json())


def test_otp_start_sends_the_configured_template_then_redeems_once(client, monkeypatch):
    contact()
    sent: list[dict] = []

    async def send(payload: dict) -> str:
        sent.append(payload)
        return "wamid.fixture"

    monkeypatch.setattr(bodega, "_post_messages", send)
    start = client.post("/api/bodega/mobile/otp/start", json={"phone": PHONE, "clientSecret": SECRET})
    assert start.status_code == 201, start.text
    attempt = start.json()["attempt"]
    assert len(sent) == 1
    template = sent[0]["template"]
    assert template["name"] == "rocoto_signin"
    body_code = template["components"][0]["parameters"][0]["text"]
    button_code = template["components"][1]["parameters"][0]["text"]
    assert body_code == button_code and len(body_code) == 6 and body_code.isdecimal()
    with bodega._db() as db:
        stored = db.execute(
            "SELECT client_secret_hash,code_hash,message_id FROM otp_attempts WHERE id=?", (attempt,)
        ).fetchone()
    assert stored is not None
    assert SECRET not in tuple(stored) and body_code not in tuple(stored)

    wrong_secret = client.post(
        "/api/bodega/mobile/otp/redeem",
        json={"attempt": attempt, "clientSecret": "x" * 43, "code": body_code},
    )
    assert wrong_secret.status_code == 401
    correct = client.post(
        "/api/bodega/mobile/otp/redeem",
        json={"attempt": attempt, "clientSecret": SECRET, "code": body_code},
    )
    assert correct.status_code == 200, correct.text
    token = correct.json()["token"]
    assert correct.json()["session"] == {"signedIn": True, "phone": PHONE, "connection": False}
    session = client.get("/api/bodega/session", headers={"Authorization": f"Bearer {token}"})
    assert session.json()["signedIn"] is True
    assert session.json()["connection"] is False
    # A process-death retry carries both high-entropy bindings and must recover its exact session
    # even when ordinary redeem attempt buckets are saturated.
    with bodega._db() as db:
        now = bodega._now()
        db.execute(
            "INSERT INTO otp_limits(key,period,count,touched_at) VALUES(?,?,?,?) "
            "ON CONFLICT(key) DO UPDATE SET period=excluded.period,count=excluded.count, "
            "touched_at=excluded.touched_at",
            (f"otp-redeem:{bodega._hash('testclient')}", now // 60, 10, now),
        )
    recovery = client.post(
        "/api/bodega/mobile/otp/redeem",
        json={"attempt": attempt, "clientSecret": SECRET, "code": body_code},
    )
    assert recovery.status_code == 200
    assert recovery.json()["token"] == token
    attacker_replay = client.post(
        "/api/bodega/mobile/otp/redeem",
        json={"attempt": attempt, "clientSecret": "x" * 43, "code": body_code},
    )
    assert attacker_replay.status_code == 409


def test_otp_locks_after_bounded_code_failures(client, monkeypatch):
    contact()
    sent: list[dict] = []

    async def send(payload: dict) -> str:
        sent.append(payload)
        return "wamid.fixture"

    monkeypatch.setattr(bodega, "_post_messages", send)
    start = client.post("/api/bodega/mobile/otp/start", json={"phone": PHONE, "clientSecret": SECRET})
    attempt = start.json()["attempt"]
    actual = sent[0]["template"]["components"][0]["parameters"][0]["text"]
    wrong = "999999" if actual != "999999" else "888888"
    for _ in range(5):
        refused = client.post(
            "/api/bodega/mobile/otp/redeem",
            json={"attempt": attempt, "clientSecret": SECRET, "code": wrong},
        )
        assert refused.status_code == 401
    unavailable = client.post(
        "/api/bodega/mobile/otp/redeem",
        json={"attempt": attempt, "clientSecret": SECRET, "code": actual},
    )
    assert unavailable.status_code == 409


def test_resend_replaces_the_prior_code_and_expiry_refuses_redeem(client, monkeypatch):
    contact()
    sent: list[dict] = []

    async def send(payload: dict) -> str:
        sent.append(payload)
        return f"wamid.{len(sent)}"

    monkeypatch.setattr(bodega, "_post_messages", send)
    first = client.post("/api/bodega/mobile/otp/start", json={"phone": PHONE, "clientSecret": SECRET})
    second = client.post("/api/bodega/mobile/otp/start", json={"phone": PHONE, "clientSecret": SECRET})
    assert first.status_code == second.status_code == 201
    first_code = sent[0]["template"]["components"][0]["parameters"][0]["text"]
    second_code = sent[1]["template"]["components"][0]["parameters"][0]["text"]
    old = client.post(
        "/api/bodega/mobile/otp/redeem",
        json={"attempt": first.json()["attempt"], "clientSecret": SECRET, "code": first_code},
    )
    assert old.status_code == 409

    with bodega._db() as db:
        db.execute("UPDATE otp_attempts SET expires_at=0 WHERE id=?", (second.json()["attempt"],))
    expired = client.post(
        "/api/bodega/mobile/otp/redeem",
        json={"attempt": second.json()["attempt"], "clientSecret": SECRET, "code": second_code},
    )
    assert expired.status_code == 409


def test_start_rate_limit_uses_the_transport_peer_not_forwarded_headers(client, monkeypatch):
    async def must_not_send(_: dict) -> str:
        raise AssertionError("unknown numbers only receive opaque decoys")

    monkeypatch.setattr(bodega, "_post_messages", must_not_send)
    callers: list[str] = []
    caller = bodega._caller

    def capture_caller(request):
        callers.append(request.client.host if request.client else "missing")
        return caller(request)

    monkeypatch.setattr(bodega, "_caller", capture_caller)
    for index in range(5):
        response = client.post(
            "/api/bodega/mobile/otp/start",
            json={"phone": f"+51987654{300 + index}", "clientSecret": SECRET},
            headers={"X-Forwarded-For": f"198.51.100.{index}"},
        )
        assert response.status_code == 201
    with bodega._db() as db:
        limit_rows = list(db.execute("SELECT key,period,count FROM otp_limits ORDER BY key"))
    assert any(str(row["key"]).startswith("otp-start:") and int(row["count"]) == 5 for row in limit_rows)
    capped = client.post(
        "/api/bodega/mobile/otp/start",
        json={"phone": "+51987654999", "clientSecret": SECRET},
        headers={"X-Forwarded-For": "203.0.113.1"},
    )
    assert callers == ["testclient"] * 6
    assert capped.status_code == 429
    assert capped.json()["error"]["code"] == "bodega_mobile_rate_limited"


def test_simultaneous_exact_redeems_return_one_recoverable_session(client, monkeypatch):
    contact()
    sent: list[dict] = []

    async def send(payload: dict) -> str:
        sent.append(payload)
        return "wamid.fixture"

    monkeypatch.setattr(bodega, "_post_messages", send)
    start = client.post("/api/bodega/mobile/otp/start", json={"phone": PHONE, "clientSecret": SECRET})
    attempt = start.json()["attempt"]
    code = sent[0]["template"]["components"][0]["parameters"][0]["text"]

    def redeem():
        return client.post(
            "/api/bodega/mobile/otp/redeem",
            json={"attempt": attempt, "clientSecret": SECRET, "code": code},
        )

    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: redeem(), range(2)))
    assert [response.status_code for response in responses] == [200, 200]
    assert responses[0].json()["token"] == responses[1].json()["token"]
    with bodega._db() as db:
        sessions = list(db.execute("SELECT id FROM sessions WHERE phone=?", (PHONE,)))
    assert len(sessions) == 1
