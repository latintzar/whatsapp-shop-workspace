"""Play tester enrollment is claimed only after Directory membership readback."""

from __future__ import annotations

import asyncio
import json

import httpx
import pytest

from app import bodega, bodega_testing, config

PHONE = "+51987654321"
EMAIL = "yesenia@example.com"
OPT_IN = "https://play.google.com/apps/testing/org.example.shopworkspace"


@pytest.fixture()
def configured(tmp_path, monkeypatch):
    monkeypatch.setattr(config.settings, "state_dir", tmp_path, raising=False)
    monkeypatch.setattr(
        config.settings, "bodega_play_testers_group", "rocoto-play-testers@soyrocoto.com", raising=False
    )
    monkeypatch.setattr(config.settings, "bodega_play_opt_in_url", OPT_IN, raising=False)
    monkeypatch.setattr(
        config.settings, "bodega_play_delegated_admin", "play-admin@soyrocoto.com", raising=False
    )
    monkeypatch.setattr(
        config.settings,
        "bodega_play_service_account_json",
        json.dumps({"client_email": "tester-sa@rocoto.iam.gserviceaccount.com", "private_key": "fixture"}),
        raising=False,
    )
    with bodega._db() as db:
        bodega._ensure_contact(db, PHONE, bodega._now())


def request(email: str = EMAIL) -> dict:
    with bodega_testing._db() as db:
        return bodega_testing.record_request(db, PHONE, email)


def mock_directory(monkeypatch, handler):
    transport = httpx.MockTransport(handler)

    class Client(httpx.AsyncClient):
        def __init__(self, **kwargs):
            super().__init__(transport=transport, **kwargs)

    monkeypatch.setattr(bodega_testing.httpx, "AsyncClient", Client)
    monkeypatch.setattr(bodega_testing, "_access_token", lambda: "directory-token")


def test_active_readback_is_required_before_opt_in_is_published(configured, monkeypatch):
    assert request() == {"state": "requested", "email": EMAIL}
    seen: list[httpx.Request] = []

    def directory(http_request: httpx.Request) -> httpx.Response:
        seen.append(http_request)
        assert http_request.headers["Authorization"] == "Bearer directory-token"
        if http_request.method == "POST":
            assert http_request.url.raw_path.endswith(b"/groups/rocoto-play-testers%40soyrocoto.com/members")
            assert json.loads(http_request.content) == {"email": EMAIL, "role": "MEMBER"}
            return httpx.Response(200, json={"email": EMAIL})
        assert http_request.method == "GET"
        return httpx.Response(200, json={"email": EMAIL, "status": "ACTIVE"})

    mock_directory(monkeypatch, directory)
    enrolled = asyncio.run(bodega_testing.enroll(PHONE))
    assert enrolled == {"state": "eligible", "email": EMAIL, "optInUrl": OPT_IN}
    assert [item.method for item in seen] == ["POST", "GET"]

    # A changed Play account removes the old eligibility before any new provider proof.
    assert request("other@example.com") == {"state": "requested", "email": "other@example.com"}


def test_insert_success_or_provider_timeout_stays_requested(configured, monkeypatch):
    request()

    def inactive(http_request: httpx.Request) -> httpx.Response:
        if http_request.method == "POST":
            return httpx.Response(200, json={"email": EMAIL})
        return httpx.Response(200, json={"email": EMAIL, "status": "SUSPENDED"})

    mock_directory(monkeypatch, inactive)
    assert asyncio.run(bodega_testing.enroll(PHONE)) == {"state": "requested", "email": EMAIL}

    calls = 0

    async def timeout(_: str, __: str, ___: str) -> tuple[bool, str]:
        nonlocal calls
        calls += 1
        raise httpx.TimeoutException("fixture")

    monkeypatch.setattr(bodega_testing, "_directory_active", timeout)
    assert asyncio.run(bodega_testing.enroll(PHONE)) == {"state": "requested", "email": EMAIL}
    assert calls == 0  # the immediately retried request remains on the retry floor


def test_missing_commissioning_or_another_lease_never_claims_eligibility(configured, monkeypatch):
    request()
    monkeypatch.setattr(config.settings, "bodega_play_service_account_json", "", raising=False)
    assert asyncio.run(bodega_testing.enroll(PHONE)) == {"state": "requested", "email": EMAIL}

    monkeypatch.setattr(
        config.settings,
        "bodega_play_service_account_json",
        json.dumps({"client_email": "tester-sa@rocoto.iam.gserviceaccount.com", "private_key": "fixture"}),
        raising=False,
    )
    with bodega_testing._db() as db:
        db.execute(
            "UPDATE tester_enrollments SET lease='other',lease_until=? WHERE phone=?",
            (bodega._now() + 60, PHONE),
        )
    monkeypatch.setattr(
        bodega_testing, "_access_token", lambda: (_ for _ in ()).throw(AssertionError("no competing call"))
    )
    assert asyncio.run(bodega_testing.enroll(PHONE)) == {"state": "requested", "email": EMAIL}


def test_precommissioning_request_rebinds_to_the_fixed_destination(configured, monkeypatch):
    monkeypatch.setattr(config.settings, "bodega_play_testers_group", "", raising=False)
    monkeypatch.setattr(config.settings, "bodega_play_opt_in_url", "", raising=False)
    monkeypatch.setattr(config.settings, "bodega_play_delegated_admin", "", raising=False)
    monkeypatch.setattr(config.settings, "bodega_play_service_account_json", "", raising=False)
    assert request() == {"state": "requested", "email": EMAIL}

    monkeypatch.setattr(
        config.settings, "bodega_play_testers_group", "rocoto-play-testers@soyrocoto.com", raising=False
    )
    monkeypatch.setattr(config.settings, "bodega_play_opt_in_url", OPT_IN, raising=False)
    monkeypatch.setattr(
        config.settings, "bodega_play_delegated_admin", "play-admin@soyrocoto.com", raising=False
    )
    monkeypatch.setattr(
        config.settings,
        "bodega_play_service_account_json",
        json.dumps({"client_email": "tester-sa@rocoto.iam.gserviceaccount.com", "private_key": "fixture"}),
        raising=False,
    )
    monkeypatch.setattr(bodega_testing, "_access_token", lambda: "directory-token")

    async def active(_: str, __: str, ___: str) -> tuple[bool, str]:
        return True, "fixture-receipt"

    monkeypatch.setattr(bodega_testing, "_directory_active", active)
    assert asyncio.run(bodega_testing.enroll(PHONE)) == {
        "state": "eligible",
        "email": EMAIL,
        "optInUrl": OPT_IN,
    }


def test_same_email_is_idempotent_and_stale_readback_cannot_promote_a_new_email(configured, monkeypatch):
    request()
    monkeypatch.setattr(bodega_testing, "_access_token", lambda: "directory-token")

    async def active(_: str, __: str, ___: str) -> tuple[bool, str]:
        return True, "fixture-receipt"

    monkeypatch.setattr(bodega_testing, "_directory_active", active)
    assert asyncio.run(bodega_testing.enroll(PHONE))["state"] == "eligible"
    with bodega_testing._db() as db:
        before = db.execute(
            "SELECT lease,verified_at FROM tester_enrollments WHERE phone=?", (PHONE,)
        ).fetchone()
        assert bodega_testing.record_request(db, PHONE, EMAIL)["state"] == "eligible"
        after = db.execute(
            "SELECT lease,verified_at FROM tester_enrollments WHERE phone=?", (PHONE,)
        ).fetchone()
    assert dict(before) == dict(after)

    entered, release = asyncio.Event(), asyncio.Event()

    async def delayed(_: str, __: str, ___: str) -> tuple[bool, str]:
        entered.set()
        await release.wait()
        return True, "late-receipt"

    # A fresh email request has no former eligibility; the delayed prior read is then harmless.
    request("first-change@example.com")
    monkeypatch.setattr(bodega_testing, "_directory_active", delayed)

    async def race():
        pending = asyncio.create_task(bodega_testing.enroll(PHONE))
        await entered.wait()
        request("new-play-account@example.com")
        release.set()
        return await pending

    assert asyncio.run(race()) == {"state": "requested", "email": "new-play-account@example.com"}


def test_email_changes_are_bounded_per_contact(configured):
    request()
    for number in range(1, bodega_testing.EMAIL_CHANGES_PER_DAY + 1):
        request(f"play{number}@example.com")
    with pytest.raises(Exception) as raised:
        request("one-too-many@example.com")
    assert getattr(raised.value, "code", "") == "bodega_testing_email_rate_limited"


def test_google_credential_refresh_transport_is_capped(monkeypatch):
    seen: list[float] = []

    class Credential:
        token = "fixture-token"

        def refresh(self, request):
            request("https://oauth2.googleapis.com/token", timeout=120)

    def transport(*_, **kwargs):
        seen.append(kwargs["timeout"])
        return object()

    monkeypatch.setattr(bodega_testing, "GoogleRequest", lambda: transport)
    monkeypatch.setattr(
        bodega_testing.service_account.Credentials,
        "from_service_account_info",
        lambda *_, **__: Credential(),
    )
    monkeypatch.setattr(
        config.settings,
        "bodega_play_service_account_json",
        json.dumps({"client_email": "tester-sa@rocoto.iam.gserviceaccount.com", "private_key": "fixture"}),
        raising=False,
    )
    assert bodega_testing._access_token() == "fixture-token"
    assert seen == [bodega_testing.TOKEN_TIMEOUT]


def test_whatsapp_invitation_receipt_state_is_cas_and_requires_explicit_resend(configured):
    request()
    with bodega_testing._db() as db:
        assert bodega_testing.mark_wa_invite_attempting(db, PHONE) is True
        assert bodega_testing.mark_wa_invite_attempting(db, PHONE) is False
        bodega_testing.mark_wa_invite_sent(db, PHONE, "wamid.fixture")
        assert bodega_testing.mark_wa_invite_attempting(db, PHONE) is False
        assert bodega_testing.mark_wa_invite_attempting(db, PHONE, force=True) is True
        bodega_testing.mark_wa_invite_known_failed(db, PHONE)
        assert bodega_testing.mark_wa_invite_attempting(db, PHONE) is True
        bodega_testing.mark_wa_invite_sent(db, PHONE, "wamid.second")
        row = db.execute(
            "SELECT wa_invite_state,wa_invite_message_id FROM tester_enrollments WHERE phone=?", (PHONE,)
        ).fetchone()
    assert dict(row) == {"wa_invite_state": "sent", "wa_invite_message_id": "wamid.second"}
