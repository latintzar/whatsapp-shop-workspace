"""THE BODEGA RIG'S SERVER HALF, against a fake transport (WIRING-SPEC.md §1 · §4).

Nothing here reaches Meta or the connection service. What the suite guards is the half that changes
when someone edits this repository, and each assertion is one of the promises WIRING-SPEC §1 and §4
make in their own «Survives» rows:

  · THE WHATSAPP CONNECTION IS THE SIGN-IN: a browser whose proof session the connection service
    reports a connection for is the signed-in shop, and every other case is a named refusal,
  · absent values answer a NAMED 503 rather than borrowing another company's number,
  · the destination is the number the CONNECTION reports — never a constant in the code, and never a
    number the request names,
  · a Graph 2xx with no `wamid` RAISES rather than inventing an id,
  · `ROCOTO_EGRESS_SANDBOX` returns an explicit synthetic marker before any HTTP,
  · `Reset state` clears the rig's own session and referral records, and answers whether it found one,
  · one destination's day of messages has a ceiling, and a message that never left spends nothing.
"""

from __future__ import annotations

import ast
import asyncio
import io
import json
import pathlib
import re
import sqlite3

import httpx
import pytest
from PIL import Image
from starlette.testclient import TestClient

from app import bodega
from app.cedar_whatsapp import COOKIE as CEDAR_COOKIE

ORIGIN = "https://shop.example.invalid"
CONNECTED = "+51987654321"          # the number GET /api/proof/state reports for this browser
OTHER = "+12025550144"              # Reserved fictional test number — a different country on purpose
ROCOTO_PHONE_ID = "778899112233"    # Rocoto's own WABA number, handed to the process
WAMID = "wamid.HBgLNTE5ODc2NTQzMjEVAgARGBI5RkNCM0Y0"
# The browser's own connection-service session, the shape the bridge forwards.
CEDAR_SESSION = "cedar-session-token-0123456789"


# ── the rig, with no key and a scratch state directory ───────────────────────────────────────────

@pytest.fixture()
def state(tmp_path, monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "state_dir", tmp_path, raising=False)
    monkeypatch.setattr(config.settings, "wa_cloud_token", "", raising=False)
    monkeypatch.setattr(config.settings, "wa_cloud_phone_id", "", raising=False)
    monkeypatch.delenv("ROCOTO_EGRESS_SANDBOX", raising=False)
    # the bridge's own switch covers the sign-in's read of the connection service too
    monkeypatch.setenv("CEDAR_WHATSAPP_BRIDGE_ENABLED", "true")
    # THE BUDDY'S OWN DOORS ARE SHUT IN THE SUITE: the hello loop is off, so a test that boots the
    # app starts no task of its own, and the webhook's two values are absent, so its own tests hand
    # them over one at a time and the fail-closed answer is what everything else reads.
    monkeypatch.setenv("BODEGA_BUDDY_LOOP", "off")
    monkeypatch.delenv("BODEGA_WA_VERIFY_TOKEN", raising=False)
    monkeypatch.delenv("BODEGA_WA_APP_SECRET", raising=False)
    return tmp_path


@pytest.fixture()
def client(state):
    from app.main import app

    # HTTPS, because the session cookie is Secure and host-only: an http test client would drop it
    # and the suite would prove nothing about the posture that ships.
    with TestClient(app, base_url=ORIGIN, headers={"Origin": ORIGIN}) as connection:
        yield connection


def configured(monkeypatch, token: str = "system-user-token-0123456789") -> None:
    """Hand the process Rocoto's own two values, the way systemd's EnvironmentFile does."""
    from app import config

    monkeypatch.setattr(config.settings, "wa_cloud_token", token, raising=False)
    monkeypatch.setattr(config.settings, "wa_cloud_phone_id", ROCOTO_PHONE_ID, raising=False)


def connection_state(number: str = CONNECTED, name: str = "Bodega Yesenia") -> dict:
    """Live proof verification for an account-bound Cedar browser session."""
    return {
        "ready": True,
        "blockers": [],
        "meta": {"appId": "rig", "configId": "rig", "graphVersion": "v21.0"},
        "connection": {
            "wabaId": "rig", "phoneId": "rig", "number": number, "name": name, "coexistence": True,
        },
        "setup": {"status": "ready", "step": "complete", "error": None},
        "history": {"status": "complete", "progress": 100},
    }


class FakeTransport:
    """Every call this module makes, captured, and the connection service answered.

    ONE STUB FOR BOTH HOPS, because the module holds one `httpx` import: the connection service's
    `/api/proof/whatsapp/verify` is answered from `self.state` before the responder is consulted, so a test
    whose responder refuses every Graph call can still sign a shop in. `requests` therefore holds
    the Graph calls alone, which is what the ceiling assertions count.
    """

    def __init__(self, monkeypatch, responder=None):
        self.requests: list[httpx.Request] = []
        self.asks: list[httpx.Request] = []
        self.state: dict | None = connection_state()
        self._responder = responder or (lambda _: httpx.Response(200, json={"messages": [{"id": WAMID}]}))
        original = httpx.AsyncClient
        monkeypatch.setattr(
            bodega.httpx, "AsyncClient",
            lambda **kwargs: original(transport=httpx.MockTransport(self._handle)),
        )

    def _handle(self, request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/proof/whatsapp/verify":
            self.asks.append(request)
            if self.state is None:
                return httpx.Response(401, json={"error": {"code": "proof_session_required"}})
            return httpx.Response(200, json=self.state)
        self.requests.append(request)
        return self._responder(request)

    @property
    def payloads(self) -> list[dict]:
        return [json.loads(request.content) for request in self.requests]

    @property
    def destinations(self) -> list[str]:
        return [payload["to"] for payload in self.payloads]


# The suite's own name for the transport, read as «the fake Graph» wherever a Graph call is the subject.
FakeGraph = FakeTransport


def refuse(_: httpx.Request) -> httpx.Response:
    raise AssertionError("this path must never reach Graph")


def sign_in(client: TestClient, graph: FakeTransport, to: str = CONNECTED) -> None:
    """THE CONNECTION IS THE DOOR: the browser's own proof session, reported by the service.

    The cookie the bridge forwards is set here, the service's answer is stubbed above, and
    `POST /session/connection` is what mints `__Host-bodega_session`.
    """
    client.cookies.set(CEDAR_COOKIE, CEDAR_SESSION)
    graph.state = connection_state(to)
    signed = client.post("/api/bodega/session/connection", json={})
    assert signed.status_code == 200, signed.text
    assert signed.json() == {"signedIn": True, "phone": to}


# ── §1 · the connection is the sign-in ───────────────────────────────────────────────────────────

def test_a_browser_with_no_connection_cookie_is_a_named_401(client, monkeypatch):
    """No connection-service session, no shop: the refusal names itself and reaches no service."""
    graph = FakeTransport(monkeypatch, refuse)
    configured(monkeypatch)
    answered = client.post("/api/bodega/session/connection", json={})
    assert answered.status_code == 401
    assert answered.json()["error"]["code"] == "bodega_connection_absent"
    assert answered.json()["error"]["message"] == "Connect your WhatsApp to continue."
    assert graph.asks == []                  # the cookie is missing, so the service is never asked
    assert not client.cookies.get(bodega.COOKIE)


def test_a_session_the_service_reports_no_connection_for_is_a_named_401(client, monkeypatch):
    """`store_for_session` answers `None` until Meta verified the account, and so does this."""
    graph = FakeTransport(monkeypatch, refuse)
    configured(monkeypatch)
    client.cookies.set(CEDAR_COOKIE, CEDAR_SESSION)
    graph.state = {**connection_state(), "connection": None}
    answered = client.post("/api/bodega/session/connection", json={})
    assert answered.status_code == 401
    assert answered.json()["error"]["code"] == "bodega_connection_absent"
    assert len(graph.asks) == 1
    assert graph.asks[0].headers.get("cookie") == f"{CEDAR_COOKIE}={CEDAR_SESSION}"
    assert not client.cookies.get(bodega.COOKIE)


def test_a_reported_connection_mints_the_session_and_the_read_names_the_phone(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    configured(monkeypatch)
    sign_in(client, graph)
    assert client.cookies.get(bodega.COOKIE)
    assert client.get("/api/bodega/session").json() == {
        "signedIn": True, "phone": CONNECTED, "connection": True, "onboarded": False,
    }
    # Nine digits alone are read as Peru's, so the service's own spelling normalises to E.164.
    graph.state = connection_state("+51 987 654 300")
    again = client.post("/api/bodega/session/connection", json={})
    assert again.status_code == 200 and again.json()["phone"] == "+51987654300"
    assert client.get("/api/bodega/session").json() == {
        "signedIn": True, "phone": "+51987654300", "connection": True, "onboarded": False,
    }


def test_a_connection_service_out_of_reach_is_a_named_503(client, monkeypatch):
    """The page walks on where the service is still to answer, the way the history's own 503 does."""
    original = httpx.AsyncClient

    def unreachable(_: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("the connection service is still to answer")

    monkeypatch.setattr(
        bodega.httpx, "AsyncClient",
        lambda **kwargs: original(transport=httpx.MockTransport(unreachable)),
    )
    client.cookies.set(CEDAR_COOKIE, CEDAR_SESSION)
    answered = client.post("/api/bodega/session/connection", json={})
    assert answered.status_code == 503
    assert answered.json()["error"]["code"] == "bodega_connection_unreachable"


def test_the_session_cookie_is_host_only_secure_and_httponly(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    configured(monkeypatch)
    client.cookies.set(CEDAR_COOKIE, CEDAR_SESSION)
    graph.state = connection_state()
    response = client.post("/api/bodega/session/connection", json={})
    cookie = response.headers["set-cookie"]
    assert cookie.startswith(f"{bodega.COOKIE}=")
    assert "Secure" in cookie and "HttpOnly" in cookie and "Path=/" in cookie
    assert "domain" not in cookie.lower()
    assert response.headers["cache-control"] == "no-store"


def test_a_write_from_another_origin_is_refused(client, monkeypatch):
    FakeTransport(monkeypatch, refuse)
    configured(monkeypatch)
    foreign = client.post(
        "/api/bodega/session/connection", json={}, headers={"Origin": "https://evil.example"}
    )
    assert foreign.status_code == 403
    assert foreign.json()["error"]["code"] == "bodega_origin_refused"


def test_a_number_the_connection_reports_unreadably_is_a_named_refusal(client, monkeypatch):
    """The one place a destination is read from outside: a value the service reports is read as it
    stands or refused, and a refusal leaves the browser signed out."""
    graph = FakeTransport(monkeypatch, refuse)
    configured(monkeypatch)
    client.cookies.set(CEDAR_COOKIE, CEDAR_SESSION)
    for value in ("the connected number", "987 65", "+0 1234567"):
        graph.state = connection_state(value)
        answered = client.post("/api/bodega/session/connection", json={})
        assert answered.status_code == 401, value
        assert answered.json()["error"]["code"] == "bodega_connection_absent"
        assert not client.cookies.get(bodega.COOKIE)


# ── §4 · Rocoto's own number ─────────────────────────────────────────────────────────────────────

def test_absent_values_answer_the_named_503_and_reach_no_provider(client, monkeypatch):
    """The whole point of the module: no key, no send, and the refusal has a name the UI can read."""
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph)
    response = client.post("/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"})
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "bodega_whatsapp_unconfigured"

    # A token with no number is still unconfigured: both halves or nothing.
    from app import config

    monkeypatch.setattr(config.settings, "wa_cloud_token", "system-user-token-0123456789", raising=False)
    again = client.post("/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"})
    assert again.status_code == 503
    assert again.json()["error"]["code"] == "bodega_whatsapp_unconfigured"


def test_no_number_is_written_into_this_module(state):
    """`backend/config.py` defaults WA_CLOUD_PHONE_ID to another company's number. This module holds
    no phone id and no destination of its own — proved over the AST, so the prose that NAMES the
    borrowed number in the module docstring is read as prose and a literal anywhere else is red."""
    tree = ast.parse(pathlib.Path(bodega.__file__).read_text(encoding="utf-8"))
    prose = {
        id(node.body[0].value)
        for node in ast.walk(tree)
        if isinstance(node, (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef))
        and node.body and isinstance(node.body[0], ast.Expr)
        and isinstance(node.body[0].value, ast.Constant) and isinstance(node.body[0].value.value, str)
    }
    phoneish = re.compile(r"\+?\d{8,}")
    written = [
        node.value for node in ast.walk(tree)
        if isinstance(node, ast.Constant) and isinstance(node.value, str)
        and id(node) not in prose and phoneish.search(node.value)
    ]
    assert written == []
    assert bodega.current_sender() == ""


def test_the_destination_is_the_number_the_connection_reports(client, monkeypatch):
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    sign_in(client, graph, CONNECTED)
    notice = client.post("/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"})
    assert notice.status_code == 200, notice.text
    assert notice.json()["to"] == CONNECTED and notice.json()["wamid"] == WAMID

    # A SECOND BROWSER, A SECOND CONNECTION, AND EACH MESSAGE GOES TO ITS OWN SHOP.
    sign_in(client, graph, OTHER)
    assert client.post("/api/bodega/notify", json={"kind": "closing", "name": "Rosa"}).status_code == 200
    assert graph.destinations == [CONNECTED.lstrip("+"), OTHER.lstrip("+")]
    # And the mouth is the configured phone id, on Graph's own path.
    assert str(graph.requests[-1].url) == f"https://graph.facebook.com/v21.0/{ROCOTO_PHONE_ID}/messages"
    assert graph.requests[-1].headers["authorization"].startswith("Bearer ")


def test_a_stray_destination_in_the_body_steers_nothing(client, monkeypatch):
    """The client chose the destination once, and that is the thing this change removes.

    `to` left the body, so a request carrying one is refused rather than obeyed — and either way the
    number it names reaches no message.
    """
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    sign_in(client, graph, CONNECTED)
    stray = client.post(
        "/api/bodega/notify", json={"kind": "closing", "name": "Yesenia", "to": OTHER}
    )
    assert stray.status_code >= 400, stray.text
    assert OTHER.lstrip("+") not in graph.destinations
    # The same shop, asking plainly, still reaches its own number.
    assert client.post("/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"}).status_code == 200
    assert graph.destinations == [CONNECTED.lstrip("+")]


def test_a_2xx_with_no_wamid_raises_rather_than_inventing_an_id(client, monkeypatch):
    """An id we made up can never be matched by a delivery webhook, so it is a failure here."""
    graph = FakeTransport(monkeypatch, lambda _: httpx.Response(200, json={"messages": [{}]}))
    configured(monkeypatch)
    sign_in(client, graph)
    response = client.post("/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"})
    assert response.status_code == 502
    assert response.json()["error"]["code"] == "bodega_whatsapp_no_wamid"
    assert len(graph.requests) == 1


def test_the_sandbox_returns_its_synthetic_marker_before_any_http(state, monkeypatch):
    monkeypatch.setenv("ROCOTO_EGRESS_SANDBOX", "1")
    FakeTransport(monkeypatch, refuse)
    configured(monkeypatch)
    assert asyncio.run(bodega.send_text(CONNECTED, "hola")) == bodega.SANDBOX_WAMID
    assert asyncio.run(bodega.send_template(CONNECTED, "closing_agent", ["Yesenia"])) == bodega.SANDBOX_WAMID


def test_the_template_send_carries_metas_own_shape(state, monkeypatch):
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    assert asyncio.run(bodega.send_template(CONNECTED, "supplier_connected", ["San Jorge", "3"])) == WAMID
    payload = graph.payloads[-1]
    assert payload["type"] == "template"
    assert payload["template"]["name"] == "supplier_connected"
    assert payload["template"]["language"] == {"code": "es"}
    assert payload["template"]["components"][0]["parameters"] == [
        {"type": "text", "text": "San Jorge"}, {"type": "text", "text": "3"},
    ]


def test_the_two_notices_read_their_spanish_from_messages_md(client, monkeypatch):
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    sign_in(client, graph)
    assert client.post(
        "/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"}
    ).status_code == 200
    closing = graph.payloads[-1]["text"]["body"]
    assert closing.startswith("Listo, Yesenia. Acá me quedo: te aviso cuando entre un proveedor tuyo,")
    assert f"{ORIGIN}/bodega-pay-later/" in closing

    assert client.post(
        "/api/bodega/notify",
        json={"kind": "supplier-connected", "name": "Mayorista San Jorge", "count": 3},
    ).status_code == 200
    assert graph.payloads[-1]["text"]["body"] == (
        "Tu proveedor Mayorista San Jorge ya entró. Ya son 3 proveedores tuyos en Rocoto."
    )

    # A row that states a name is refused without one rather than sent half-written.
    bare = client.post("/api/bodega/notify", json={"kind": "closing"})
    assert bare.status_code == 400 and bare.json()["error"]["code"] == "bodega_notice_needs_name"


def test_one_destinations_day_of_messages_has_a_ceiling(client, monkeypatch):
    """The ceiling bounds the day, so a signed-in shop asking in a loop meets a wall."""
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    monkeypatch.setattr(bodega, "DAILY_SENDS", 3)
    sign_in(client, graph, CONNECTED)
    # An hour into a day bucket, so the whole walk below stays inside one day.
    start = (bodega._now() // bodega.SEND_DAY) * bodega.SEND_DAY + 3600
    monkeypatch.setattr(bodega, "_now", lambda: start)
    for step in range(3):
        sent = client.post("/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"})
        assert sent.status_code == 200, f"{step} · {sent.text}"

    walled = client.post("/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"})
    assert walled.status_code == 429 and walled.json()["error"]["code"] == "bodega_send_ceiling"
    assert len(graph.requests) == 3

    # It is PER DESTINATION, so another shop is reachable now, and this one is tomorrow.
    sign_in(client, graph, OTHER)
    assert client.post("/api/bodega/notify", json={"kind": "closing", "name": "Rosa"}).status_code == 200
    monkeypatch.setattr(bodega, "_now", lambda: start + bodega.SEND_DAY + 1)
    sign_in(client, graph, CONNECTED)
    assert client.post("/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"}).status_code == 200


def test_a_message_that_never_left_spends_nothing_of_the_day(client, monkeypatch):
    """A number awaiting Rocoto's key stays reachable the moment the key lands (`_refund`)."""
    graph = FakeTransport(monkeypatch)
    monkeypatch.setattr(bodega, "DAILY_SENDS", 1)
    sign_in(client, graph)
    unconfigured = client.post("/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"})
    assert unconfigured.status_code == 503
    assert unconfigured.json()["error"]["code"] == "bodega_whatsapp_unconfigured"
    assert graph.requests == []              # the refusal lands before any HTTP

    configured(monkeypatch)
    assert client.post(
        "/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"}
    ).status_code == 200
    assert len(graph.requests) == 1


def test_a_send_with_no_session_is_a_named_401(client, monkeypatch):
    """`/notify` reads its destination from the session, so a browser with none has nowhere to write."""
    FakeTransport(monkeypatch, refuse)
    configured(monkeypatch)
    answered = client.post("/api/bodega/notify", json={"kind": "closing", "name": "Yesenia"})
    assert answered.status_code == 401
    assert answered.json()["error"]["code"] == "bodega_session_required"
    assert answered.json()["error"]["message"] == "Connect your WhatsApp to continue."


# ── §5 · the referral record, and the reset ──────────────────────────────────────────────────────

def test_the_referral_record_normalises_to_e164_and_survives_the_page(client, monkeypatch):
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    sign_in(client, graph)
    written = client.post("/api/bodega/referrals", json={"invited": [
        {"name": "Mayorista San Jorge", "phone": "987 654 300"},
        {"name": "Rosa menú", "phone": "+1 202 555 0144"},
    ]})
    assert written.status_code == 200, written.text
    # The service answers in number order; the screen does its own «top rows first» sort.
    assert written.json() == {"invited": [
        {"name": "Rosa menú", "phone": "+12025550144"},
        {"name": "Mayorista San Jorge", "phone": "+51987654300"},
    ]}
    assert client.get("/api/bodega/referrals").json() == written.json()
    assert client.post("/api/bodega/referrals", json={"invited": [
        {"name": "Mayorista San Jorge", "phone": "51987654300"},
    ]}).json()["invited"] == written.json()["invited"]  # one row per number, name refreshed

    # An invited number that is not E.164 is the same named 400 the connection's own number answers.
    unreadable = client.post("/api/bodega/referrals", json={"invited": [{"name": "?", "phone": "987 65"}]})
    assert unreadable.status_code == 400
    assert unreadable.json()["error"]["code"] == "bodega_number_unreadable"


def test_reset_clears_the_rigs_session_and_referral_records(client, monkeypatch, state):
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    sign_in(client, graph)
    assert client.post("/api/bodega/referrals", json={"invited": [
        {"name": "Mayorista San Jorge", "phone": "987654300"},
    ]}).status_code == 200

    records = state / "bodega-rig.sqlite"
    with sqlite3.connect(records) as db:
        assert db.execute("SELECT count(*) FROM sessions").fetchone()[0] == 1
        assert db.execute("SELECT count(*) FROM referrals").fetchone()[0] == 1

    cleared = client.post("/api/bodega/session/reset", json={})
    assert cleared.status_code == 200 and cleared.json() == {"cleared": True}
    with sqlite3.connect(records) as db:
        assert db.execute("SELECT count(*) FROM sessions").fetchone()[0] == 0
        assert db.execute("SELECT count(*) FROM referrals").fetchone()[0] == 0

    # The connection is what the page signs in with now, and a signed-out read says so rather than
    # refusing.
    client.cookies.clear()
    assert client.get("/api/bodega/session").json() == {
        "signedIn": False, "phone": "", "connection": False, "onboarded": False,
    }
    assert client.get("/api/bodega/referrals").status_code == 401


def test_reset_answers_with_no_cookie_so_the_control_never_fails(client, monkeypatch):
    """`Reset state` is the rig's one control: it answers whether it found a session to clear."""
    FakeTransport(monkeypatch, refuse)
    empty = client.post("/api/bodega/session/reset", json={})
    assert empty.status_code == 200
    assert empty.json() == {"cleared": False}


def test_the_state_directory_of_an_earlier_walk_still_opens(client, monkeypatch, state):
    """A records file written while the code and link doors stood keeps its rows and its tables.

    The rig's demo runtime preserves this file across deploys (`RUNTIME_STATE`), so the migration is
    an addition: the two retired tables are left exactly where they are and nothing reads them.
    """
    records = state / "bodega-rig.sqlite"
    with sqlite3.connect(records) as db:
        db.execute(
            "CREATE TABLE codes (phone TEXT PRIMARY KEY, code_hash TEXT NOT NULL, "
            "stale_hash TEXT NOT NULL DEFAULT '', issued_at INTEGER NOT NULL, "
            "expires_at INTEGER NOT NULL, tries INTEGER NOT NULL DEFAULT 0)"
        )
        db.execute("INSERT INTO codes VALUES('+51987654321','x','',0,0,0)")
        db.execute(
            "CREATE TABLE links (token_hash TEXT PRIMARY KEY, phone TEXT NOT NULL, "
            "issued_at INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL)"
        )
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    sign_in(client, graph)
    assert client.get("/api/bodega/session").json() == {
        "signedIn": True, "phone": CONNECTED, "connection": True, "onboarded": False,
    }
    with sqlite3.connect(records) as db:
        assert db.execute("SELECT count(*) FROM codes").fetchone()[0] == 1


# ── THE REVIEW OF 19 SEPTEMBER 2026: five more refusals, each one a request that was tried ─────────


def test_the_page_cannot_put_words_in_rocotos_mouth(client, monkeypatch):
    """`/notify` names a kind, a name and a count. A body carrying its own sentence is refused, and
    nothing leaves Rocoto's number."""
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    sign_in(client, graph)
    before = len(graph.requests)
    answered = client.post(
        "/api/bodega/notify",
        json={"kind": "closing", "name": "Yesenia", "text": "anything at all http://example.invalid"},
    )
    assert answered.status_code == 422
    assert len(graph.requests) == before


def test_the_bridges_switch_covers_the_sign_in(client, monkeypatch):
    """With `/api/proof/*` switched off, the sign-in never reaches the service behind it."""
    graph = FakeTransport(monkeypatch)
    monkeypatch.setenv("CEDAR_WHATSAPP_BRIDGE_ENABLED", "false")
    client.cookies.set(CEDAR_COOKIE, CEDAR_SESSION)
    graph.state = connection_state(CONNECTED)
    answered = client.post("/api/bodega/session/connection", json={})
    assert answered.status_code == 503
    assert answered.json()["error"]["code"] == "bodega_connection_unreachable"
    assert graph.asks == []


def test_the_sign_in_asks_the_connection_service_a_few_times_a_minute(client, monkeypatch):
    graph = FakeTransport(monkeypatch)
    client.cookies.set(CEDAR_COOKIE, CEDAR_SESSION)
    graph.state = connection_state(CONNECTED)
    codes = [
        client.post("/api/bodega/session/connection", json={}).status_code
        for _ in range(bodega.ASKS_PER_COOKIE + 2)
    ]
    assert codes[: bodega.ASKS_PER_COOKIE] == [200] * bodega.ASKS_PER_COOKIE
    assert codes[bodega.ASKS_PER_COOKIE :] == [429, 429]
    assert len(graph.asks) == bodega.ASKS_PER_COOKIE


def test_a_number_keeps_a_few_sessions_the_newest_ones(client, monkeypatch, state):
    graph = FakeTransport(monkeypatch)
    client.cookies.set(CEDAR_COOKIE, CEDAR_SESSION)
    graph.state = connection_state(CONNECTED)
    monkeypatch.setattr(bodega, "ASKS_PER_COOKIE", 50)
    for _ in range(bodega.SESSIONS_PER_NUMBER + 4):
        assert client.post("/api/bodega/session/connection", json={}).status_code == 200
    with bodega._db() as db:
        held = db.execute("SELECT COUNT(*) AS n FROM sessions WHERE phone=?", (CONNECTED,)).fetchone()["n"]
    assert held == bodega.SESSIONS_PER_NUMBER
    # and the browser that signed in last is still signed in
    assert client.get("/api/bodega/session").json()["signedIn"] is True


@pytest.mark.parametrize("reported", ["(978) 958-9459", "+51987654321 ext 5", "987654321", "hola"])
def test_a_number_the_service_reports_is_read_as_it_stands_or_refused(reported):
    """Never reshaped: nine bare digits are a Peruvian mobile when a PERSON types them, and a
    refusal when a service reports them."""
    with pytest.raises(bodega.RuntimeError_):
        bodega._reported_number(reported)


@pytest.mark.parametrize(
    ("reported", "read"),
    [
        ("+51 987 654 321", "+51987654321"),
        ("+1 (202) 555-0100", "+12025550100"),
        ("34612345263", "+34612345263"),
    ],
)
def test_a_whole_international_number_is_taken(reported, read):
    assert bodega._reported_number(reported) == read


# ── §0 · THE WALK AS OF 20 SEPTEMBER (evening) — ONBOARDING-SPEC.md §0 ───────────────────────────
# Screen 3 «You're on the waitlist!», screen 4 the business, screen 5 the address, screen 7 the
# Yape, and the buddy's own reply once the shop is in.

def _png(size=(2, 2)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, "white").save(buffer, "PNG")
    return buffer.getvalue()


def test_the_waitlist_place_is_minted_once_and_a_second_business_starts_further_down(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    first = client.get("/api/bodega/waitlist")
    assert first.status_code == 200, first.text
    body = first.json()
    assert body["place"] == bodega.WAITLIST_BASE
    assert body["ahead"] == bodega.WAITLIST_BASE - 1
    assert bodega.REFERRAL_CODE.fullmatch(body["referralCode"])
    assert body["referralUrl"] == f"https://shop.example.invalid/?ref={body['referralCode']}"
    assert body["coveredPurchases"] == 0
    assert body["joinedThroughYou"] == 0
    assert body["joined"]

    # Reconnecting the same number reads the SAME row — not a fresh mint.
    sign_in(client, graph, CONNECTED)
    assert client.get("/api/bodega/waitlist").json() == body

    # A second number is a second row, one place further down the queue, with its own code.
    sign_in(client, graph, OTHER)
    second = client.get("/api/bodega/waitlist").json()
    assert second["place"] == bodega.WAITLIST_BASE + 1
    assert second["referralCode"] != body["referralCode"]


def test_the_waitlist_answers_a_named_401_with_no_session(client, monkeypatch):
    FakeTransport(monkeypatch, refuse)
    answered = client.get("/api/bodega/waitlist")
    assert answered.status_code == 401
    assert answered.json()["error"]["code"] == "bodega_session_required"


def test_referral_attribution_is_quiet_on_self_and_on_an_unknown_code(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    code = client.get("/api/bodega/waitlist").json()["referralCode"]

    unknown = client.post("/api/bodega/referral/attribute", json={"code": "ZZZZZZ"})
    assert unknown.status_code == 200 and unknown.json() == {"attributed": False}

    selfref = client.post("/api/bodega/referral/attribute", json={"code": code})
    assert selfref.status_code == 200 and selfref.json() == {"attributed": False}

    # A shape outside the no-look-alike alphabet is the same quiet «no».
    malformed = client.post("/api/bodega/referral/attribute", json={"code": "0O1IL!"})
    assert malformed.json() == {"attributed": False}


def test_referral_attribution_moves_the_referrer_up_and_covers_every_third(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    code = client.get("/api/bodega/waitlist").json()["referralCode"]

    for phone in (OTHER, "+51900000003", "+51900000004"):
        sign_in(client, graph, phone)
        # Case folds, so a link pasted lower-case still attributes.
        attributed = client.post("/api/bodega/referral/attribute", json={"code": code.lower()})
        assert attributed.status_code == 200 and attributed.json() == {"attributed": True}
        # Idempotent: asking again — even with a different code — changes nothing further.
        again = client.post("/api/bodega/referral/attribute", json={"code": "ZZZZZZ"})
        assert again.json() == {"attributed": True}

    sign_in(client, graph, CONNECTED)
    mine = client.get("/api/bodega/waitlist").json()
    assert mine["joinedThroughYou"] == 3
    assert mine["coveredPurchases"] == 1
    assert mine["place"] == max(1, bodega.WAITLIST_BASE - 3 * bodega.WAITLIST_MOVE_UP)


def test_business_details_round_trip_and_validate(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    body = {
        "kind": "bodega", "name": "  Bodega Yesenia  ",
        "address": {
            "text": "Av. Larco 345, Miraflores, Lima, Perú", "placeId": "fixture-av-larco",
            "lat": -12.1211, "lng": -77.0292,
        },
    }
    written = client.put("/api/bodega/business", json=body)
    assert written.status_code == 200, written.text
    assert written.json() == {
        "personName": "", "kind": "bodega", "name": "Bodega Yesenia",
        "address": {
            "text": "Av. Larco 345, Miraflores, Lima, Perú", "placeId": "fixture-av-larco",
            "lat": -12.1211, "lng": -77.0292,
        },
        # SPANISH IS WHAT A BODY THAT NAMES NO LANGUAGE MEANS (20 September): the page is Spanish
        # everywhere, and English only where the English site sent this shop over.
        "language": "es",
    }
    assert client.get("/api/bodega/business").json() == written.json()

    # A shop that has written nothing yet answers empty rather than refusing the read.
    sign_in(client, graph, OTHER)
    assert client.get("/api/bodega/business").json() == {
        "personName": "", "kind": "", "name": "", "address": None, "language": "es"
    }

    assert client.put(
        "/api/bodega/business", json={**body, "kind": "sells_everything"}
    ).status_code == 422
    assert client.put(
        "/api/bodega/business",
        json={**body, "address": {**body["address"], "lat": 200}},
    ).status_code == 422
    assert client.put("/api/bodega/business", json={**body, "extra": "not asked for"}).status_code == 422
    assert client.put(
        "/api/bodega/business", json={**body, "name": "   "}
    ).status_code == 422


@pytest.mark.parametrize(
    "kind", ["supplier", "bodega", "restaurant", "sells_to_bodegas", "sells_to_restaurants"]
)
def test_business_kind_accepts_canonical_roles_and_retained_supplier_records(client, monkeypatch, kind):
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    body = {
        "kind": kind, "name": "Mercado Aurora",
        "address": {
            "text": "Av. Larco 345, Miraflores, Lima, Perú", "placeId": "fixture-av-larco",
            "lat": -12.1211, "lng": -77.0292,
        },
    }
    assert client.put("/api/bodega/business", json=body).status_code == 200
    # A canonical role reaches the same completion guard; retained seller records remain valid.
    assert client.post("/api/bodega/onboarded", json={}).status_code == 200


def test_phone_verified_contact_can_build_profile_before_meta_and_sensitive_routes_stay_gated(
    client, monkeypatch
):
    FakeTransport(monkeypatch, refuse)
    with bodega._db() as db:
        bodega._ensure_contact(db, CONNECTED, bodega._now())
    token, _ = bodega._mint_native_session(CONNECTED, bodega._now())
    headers = {"Authorization": f"Bearer {token}"}

    assert client.get("/api/bodega/waitlist", headers=headers).status_code == 200
    profile = client.patch(
        "/api/bodega/business", json={"personName": "Yesenia", "name": "Bodega Yesenia"},
        headers=headers,
    )
    assert profile.status_code == 200, profile.text
    assert profile.json()["personName"] == "Yesenia"
    assert profile.json()["name"] == "Bodega Yesenia"

    for method, path, body in (
        ("post", "/api/bodega/notify", {"kind": "waitlist"}),
        ("post", "/api/bodega/onboarded", {}),
        ("post", "/api/bodega/referral/attribute", {"code": "ABC234"}),
        ("get", "/api/bodega/referrals", None),
        ("get", "/api/bodega/yape", None),
    ):
        arguments = {"json": body} if body is not None else {}
        response = getattr(client, method)(path, headers=headers, **arguments)
        assert response.status_code == 409, (path, response.text)
        assert response.json()["error"]["code"] == "bodega_connection_required"


def test_tester_email_is_a_durable_request_and_never_claims_play_eligibility(client, monkeypatch):
    FakeTransport(monkeypatch, refuse)
    with bodega._db() as db:
        bodega._ensure_contact(db, CONNECTED, bodega._now())
    token, _ = bodega._mint_native_session(CONNECTED, bodega._now())
    headers = {"Authorization": f"Bearer {token}"}

    assert client.get("/api/bodega/mobile/testing", headers=headers).json() == {"state": "unavailable"}
    saved = client.post(
        "/api/bodega/mobile/testing", json={"email": " Yesenia@Example.com "}, headers=headers
    )
    assert saved.status_code == 200, saved.text
    assert saved.json() == {"state": "requested", "email": "yesenia@example.com"}
    assert "optInUrl" not in saved.json()
    assert client.get("/api/bodega/mobile/testing", headers=headers).json() == saved.json()


def test_address_suggestions_use_the_offline_fixture_with_no_maps_key(client, monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "places_key", "", raising=False)
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    result = client.get(
        "/api/bodega/address/suggestions",
        params={"query": "Av. Larco", "sessionToken": "session-token-0123456789"},
    )
    assert result.status_code == 200, result.text
    body = result.json()
    assert body["provider"] == "fixture" and body["country"] == "PE"
    assert {s["placeId"] for s in body["suggestions"]} == set(bodega.FIXTURE_ADDRESSES)
    assert all("lat" not in s and "lng" not in s for s in body["suggestions"])

    place = client.get(
        "/api/bodega/address/place",
        params={"placeId": "fixture-av-larco", "sessionToken": "session-token-0123456789"},
    )
    assert place.status_code == 200
    assert place.json() == {
        "placeId": "fixture-av-larco", "text": "Av. Larco 345, Miraflores, Lima, Perú",
        "lat": -12.1211, "lng": -77.0292,
    }

    unknown = client.get(
        "/api/bodega/address/place",
        params={"placeId": "not-a-real-place", "sessionToken": "session-token-0123456789"},
    )
    assert unknown.status_code == 422
    assert unknown.json()["error"]["code"] == "bodega_address_unknown"


def test_address_search_requires_a_session(client, monkeypatch):
    FakeTransport(monkeypatch, refuse)
    answered = client.get(
        "/api/bodega/address/suggestions",
        params={"query": "Av. Larco", "sessionToken": "session-token-0123456789"},
    )
    assert answered.status_code == 401


def test_address_search_reaches_places_when_a_key_is_configured(client, monkeypatch):
    from app import config

    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    monkeypatch.setattr(config.settings, "places_key", "fixture-key", raising=False)
    seen = []

    async def suggestions(query, session_token, country):
        seen.append((query, session_token, country))
        return {"provider": "google-places", "country": country, "suggestions": []}

    async def details(place_id, session_token):
        seen.append((place_id, session_token))
        return {"placeId": place_id, "text": "Real place", "lat": 1.0, "lng": 2.0}

    monkeypatch.setattr(bodega.places, "address_suggestions", suggestions)
    monkeypatch.setattr(bodega.places, "place_details", details)

    result = client.get(
        "/api/bodega/address/suggestions",
        params={"query": "Av. Larco", "sessionToken": "session-token-0123456789"},
    )
    assert result.status_code == 200
    assert seen == [("Av. Larco", "session-token-0123456789", "PE")]

    place = client.get(
        "/api/bodega/address/place",
        params={"placeId": "ChIJ-real", "sessionToken": "session-token-0123456789"},
    )
    assert place.json() == {"placeId": "ChIJ-real", "text": "Real place", "lat": 1.0, "lng": 2.0}
    assert seen[-1] == ("ChIJ-real", "session-token-0123456789")


def test_address_search_is_rate_limited_per_session(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    monkeypatch.setattr(bodega, "ADDRESS_ASKS_PER_SESSION", 2)
    for step in range(2):
        assert client.get(
            "/api/bodega/address/suggestions",
            params={"query": "Av. Larco", "sessionToken": "session-token-0123456789"},
        ).status_code == 200, step
    walled = client.get(
        "/api/bodega/address/suggestions",
        params={"query": "Av. Larco", "sessionToken": "session-token-0123456789"},
    )
    assert walled.status_code == 429
    assert walled.json()["error"]["code"] == "bodega_address_recent"


def test_yape_round_trip_number_and_qr_and_the_public_payment_page(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    written = client.put(
        "/api/bodega/yape",
        data={"number": "987654321"},
        files={"qr": ("qr.png", _png(), "image/png")},
    )
    assert written.status_code == 200, written.text
    assert written.json() == {"number": "+51987654321", "hasQr": True}
    assert client.get("/api/bodega/yape").json() == written.json()

    qr = client.get("/api/bodega/yape/qr")
    assert qr.status_code == 200
    assert qr.headers["content-type"].startswith("image/png")
    assert qr.content == _png()

    code = client.get("/api/bodega/waitlist").json()["referralCode"]
    public = client.get(f"/api/bodega/pay/{code}/yape")
    assert public.status_code == 200 and public.json() == {"number": "+51987654321", "hasQr": True}
    public_qr = client.get(f"/api/bodega/pay/{code}/yape/qr")
    assert public_qr.status_code == 200 and public_qr.content == _png()

    # A number given again, with no fresh photo, keeps the QR already on file.
    kept = client.put("/api/bodega/yape", data={"number": "987654322"})
    assert kept.status_code == 200
    assert kept.json() == {"number": "+51987654322", "hasQr": True}
    assert client.get("/api/bodega/yape/qr").content == _png()


def test_yape_number_must_be_a_peru_mobile(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    landline = client.put("/api/bodega/yape", data={"number": "812345678"})
    assert landline.status_code == 400
    assert landline.json()["error"]["code"] == "bodega_yape_number_unreadable"

    foreign = client.put("/api/bodega/yape", data={"number": "+34987654321"})
    assert foreign.status_code == 400


def test_a_browser_with_no_session_is_refused_by_its_own_machine_word(client):
    """THE WALK TELLS THE TWO REFUSALS APART BY THEIR CODE, not by their sentence.

    Screen 7 of the sign-up once held a shop for ever on a refusal it could do nothing about:
    every path here answers 401 where no connection service minted the session — local
    development, every drive, every review build — and the screen read that as a refusal about
    the number the shop had typed. So the contract the page keys on is stated here: a browser
    holding no session is `bodega_session_required`, and a number the service will not take is
    `bodega_yape_number_unreadable`. Only the second is the shop's own to fix, and only the
    second holds the walk (`app/src/prototypes/bodega-pay-later/start/yape.tsx`).
    """
    shut = client.put("/api/bodega/yape", data={"number": "987654321"})
    assert shut.status_code == 401
    assert shut.json()["error"]["code"] == "bodega_session_required"
    assert shut.json()["error"]["code"] != "bodega_yape_number_unreadable"
    for path in ("/api/bodega/waitlist", "/api/bodega/business", "/api/bodega/yape"):
        assert client.get(path).status_code == 401


def test_yape_qr_is_size_capped_and_type_checked(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    too_big = client.put(
        "/api/bodega/yape", data={"number": "987654321"},
        files={"qr": ("qr.png", b"x" * (bodega.YAPE_QR_MAX_BYTES + 1), "image/png")},
    )
    assert too_big.status_code == 413

    wrong_type = client.put(
        "/api/bodega/yape", data={"number": "987654321"},
        files={"qr": ("qr.txt", b"not an image", "text/plain")},
    )
    assert wrong_type.status_code == 415

    # Neither refused upload wrote a number or a QR over the shop's record.
    assert client.get("/api/bodega/yape").json() == {"number": "", "hasQr": False}


def test_yape_qr_is_absent_until_uploaded_and_an_unknown_link_is_a_named_404(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    sign_in(client, graph, CONNECTED)
    absent = client.get("/api/bodega/yape/qr")
    assert absent.status_code == 404
    assert absent.json()["error"]["code"] == "bodega_yape_qr_absent"

    unknown = client.get("/api/bodega/pay/ZZZZZZ/yape")
    assert unknown.status_code == 404
    assert unknown.json()["error"]["code"] == "bodega_shop_unknown"


def test_the_buddys_waitlist_reply_states_the_place_and_the_link(client, monkeypatch):
    """The `waitlist` notice IS the status message since 20 September: it names the shop, its place
    and the page that holds both, which is the first thing the buddy says on WhatsApp."""
    graph = FakeTransport(monkeypatch)
    configured(monkeypatch)
    sign_in(client, graph, CONNECTED)
    client.put("/api/bodega/business", json={
        "kind": "bodega", "name": "Bodega Yesenia",
        "address": {
            "text": "Av. Larco 345, Miraflores, Lima, Perú", "placeId": "fixture-av-larco",
            "lat": -12.1211, "lng": -77.0292,
        },
    })
    mine = client.get("/api/bodega/waitlist").json()

    sent = client.post("/api/bodega/notify", json={"kind": "waitlist"})
    assert sent.status_code == 200, sent.text
    assert sent.json()["kind"] == "waitlist"
    text = graph.payloads[-1]["text"]["body"]
    assert text == (
        f"¡Hola, Bodega Yesenia! Soy Rocoto 👋 Ya estás en la lista de espera: vas en el puesto "
        f"#{mine['place']:,}. Aquí ves tu puesto y quién entró por ti: {mine['statusUrl']}"
    )
    assert mine["statusUrl"] == f"{ORIGIN}/bodega-pay-later/?lista={mine['referralCode']}"

    # The same ceiling as the other two notices — one wall for one destination's day.
    monkeypatch.setattr(bodega, "DAILY_SENDS", 1)
    walled = client.post("/api/bodega/notify", json={"kind": "waitlist"})
    assert walled.status_code == 429
    assert walled.json()["error"]["code"] == "bodega_send_ceiling"
