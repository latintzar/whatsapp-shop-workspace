"""THE BUDDY — signed-inbound waitlist intake, Meta's own door, and the five-minute hello.

Peter, 20 September 2026: «the whole signup onboarding and their persistent waiting list position
and referral tracker should be a link the buddy sends as the first thing. if they didn't message
the buddy for 5 minutes after they finished the last onboarding step, we should message them with a
meta template just giving them their waitlist status link and saying hello… and then when they
reply we should message them saying below i'll send the message you can forward to other shops and
distributors.»

Nothing here reaches Meta: the Graph client's `httpx` is the fake transport `test_bodega.py`
already owns, and every send lands in it. What this suite guards is the half that changes when
someone edits this repository:

  · the language a business was read in is kept on its own row, and Spanish is what a body that
    names none means,
  · the walk's last step is recorded once, however many times the page presses it,
  · `GET /status/{code}` is PUBLIC and carries no phone and no address, because the buddy sends
    that link into WhatsApp and whoever holds it opens it,
  · Meta's door FAILS CLOSED both ways — no verify token and no app secret are named 503s, a wrong
    token is 403 and an unsigned body is 403 — and a retried message id is answered once,
  · the first signed message secures the sender's place, then collects person, business and tester
    email fields through a deterministic state machine,
  · a referral code attributes the sender to its inviter and never substitutes the inviter's row,
  · a later message is answered with the place again, at most once every ten minutes,
  · a business that finished the walk and stayed quiet five minutes is sent the TEMPLATE, once,
    five attempts at most, each refusal backing the next one further off.
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json

import httpx
import pytest

# The rig's own fake Graph and its sign-in, from the suite beside this one: one transport, one door.
from test_bodega import (
    CONNECTED,
    ORIGIN,
    ROCOTO_PHONE_ID,
    WAMID,
    FakeTransport,
    configured,
    refuse,
    sign_in,
)

from app import bodega, bodega_testing

VERIFY_TOKEN = "verify-token-for-the-rig"
APP_SECRET = "app-secret-for-the-rig"
LIMA = {
    "text": "Av. Larco 345, Miraflores, Lima, Perú", "placeId": "fixture-av-larco",
    "lat": -12.1211, "lng": -77.0292,
}
# A second and a third shop, each a whole international number, so `_reported_number` takes them as
# they stand. Digits interleaved on purpose: they are test data, never a number Rocoto writes to.
SECOND = "+51955000111"
THIRD = "+51955000222"


class Clock:
    """One clock the whole test moves, because five minutes and ten minutes are the subject here."""

    def __init__(self, monkeypatch, at: int = 1_780_000_000):
        self.at = at
        monkeypatch.setattr(bodega, "_now", lambda: self.at)

    def forward(self, seconds: int) -> None:
        self.at += seconds


class Answers:
    """The fake Graph, with a switch: a run that refuses every send is what the backoff is read on."""

    def __init__(self) -> None:
        self.refusing = False

    def __call__(self, request: httpx.Request) -> httpx.Response:
        if self.refusing:
            return httpx.Response(400, json={"error": {"message": "this window is closed"}})
        return httpx.Response(200, json={"messages": [{"id": WAMID}]})


@pytest.fixture()
def state(tmp_path, monkeypatch):
    """The rig with no key, a scratch state directory, and both of the buddy's doors shut.

    It mirrors `test_bodega.py`'s own fixture and adds this section's three names: the hello loop
    is off, so booting the app starts no task, and the webhook's two values are absent, so each
    test hands over the one it is about and the fail-closed answer is what the others read.
    """
    from app import config

    monkeypatch.setattr(config.settings, "state_dir", tmp_path, raising=False)
    monkeypatch.setattr(config.settings, "wa_cloud_token", "", raising=False)
    monkeypatch.setattr(config.settings, "wa_cloud_phone_id", "", raising=False)
    monkeypatch.delenv("ROCOTO_EGRESS_SANDBOX", raising=False)
    monkeypatch.setenv("CEDAR_WHATSAPP_BRIDGE_ENABLED", "true")
    monkeypatch.setenv("BODEGA_BUDDY_LOOP", "off")
    monkeypatch.delenv("BODEGA_WA_VERIFY_TOKEN", raising=False)
    monkeypatch.delenv("BODEGA_WA_APP_SECRET", raising=False)
    return tmp_path


@pytest.fixture()
def client(state):
    """HTTPS, because the session cookie is Secure and host-only (`test_bodega.py` says why)."""
    from starlette.testclient import TestClient

    from app.main import app

    with TestClient(app, base_url=ORIGIN, headers={"Origin": ORIGIN}) as connection:
        yield connection


@pytest.fixture()
def published(state, monkeypatch):
    """The service's own published address, which is where a link in a WhatsApp message points.

    The webhook and the hello loop answer outside any browser request, so there is no `Origin` to
    read: both take `ROCOTO_RUNTIME_PUBLIC_BASE`, which the demo host sets.
    """
    from app import config

    monkeypatch.setattr(config.settings, "public_base", ORIGIN, raising=False)
    return ORIGIN


PAGE = f"{ORIGIN}/bodega-pay-later/"


# ── the shop, joined and finished ────────────────────────────────────────────────────────────────

def joined(client, graph, phone=CONNECTED, name="Bodega Yesenia", language="es") -> dict:
    """A signed-in shop with its business written — the walk up to its last screen."""
    sign_in(client, graph, phone)
    written = client.put(
        "/api/bodega/business",
        json={"kind": "bodega", "name": name, "address": LIMA, "language": language},
    )
    assert written.status_code == 200, written.text
    return client.get("/api/bodega/waitlist").json()


def finished(client) -> None:
    answered = client.post("/api/bodega/onboarded", json={})
    assert answered.status_code == 200, answered.text
    assert answered.json() == {"onboarded": True}


# ── what Meta posts ──────────────────────────────────────────────────────────────────────────────

def wrote(sender: str, said: str, identifier: str = "wamid.FIRST") -> dict:
    """One inbound text, in the shape the Cloud API delivers it."""
    return {
        "object": "whatsapp_business_account",
        "entry": [{"id": "rocoto-waba", "changes": [{"field": "messages", "value": {
            "messaging_product": "whatsapp",
            "metadata": {"display_phone_number": "rocoto", "phone_number_id": ROCOTO_PHONE_ID},
            "contacts": [{"profile": {"name": "Yesenia"}, "wa_id": sender.lstrip("+")}],
            "messages": [{
                "from": sender.lstrip("+"), "id": identifier, "timestamp": str(bodega._now()),
                "type": "text", "text": {"body": said},
            }],
        }}]}],
    }


def delivered(identifier: str = "wamid.FIRST") -> dict:
    """A delivery status, which is the other thing this webhook receives all day."""
    return {
        "object": "whatsapp_business_account",
        "entry": [{"id": "rocoto-waba", "changes": [{"field": "messages", "value": {
            "messaging_product": "whatsapp",
            "metadata": {"display_phone_number": "rocoto", "phone_number_id": ROCOTO_PHONE_ID},
            "statuses": [{
                "id": identifier, "status": "delivered", "timestamp": str(bodega._now()),
                "recipient_id": CONNECTED.lstrip("+"),
            }],
        }}]}],
    }


def post_webhook(client, payload: dict, secret: str = APP_SECRET, signature: str = ""):
    raw = json.dumps(payload).encode()
    mark = signature or "sha256=" + hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
    return client.post(
        "/api/bodega/wa/webhook", content=raw,
        headers={"Content-Type": "application/json", "X-Hub-Signature-256": mark},
    )


def bodies(graph) -> list[str]:
    return [payload["text"]["body"] for payload in graph.payloads if payload["type"] == "text"]


# ── §1 · THE CONTRACT — the language, the last step, and the public place ───────────────────────

def test_spanish_is_the_default_and_english_is_kept_where_the_page_asked_for_it(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    joined(client, graph, CONNECTED, language="es")
    assert client.get("/api/bodega/business").json()["language"] == "es"
    assert client.get("/api/bodega/waitlist").json()["language"] == "es"

    # The English site links with `?lang=en`, and the choice outlives the browser that made it.
    english = joined(client, graph, SECOND, name="Yesenia's shop", language="en")
    assert english["language"] == "en"
    assert client.get("/api/bodega/business").json()["language"] == "en"

    # A language nobody offers is refused at the door rather than stored.
    refused = client.put(
        "/api/bodega/business",
        json={"kind": "bodega", "name": "Bodega Yesenia", "address": LIMA, "language": "fr"},
    )
    assert refused.status_code == 422


def test_the_walks_last_step_is_recorded_once_however_often_the_page_presses_it(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    clock = Clock(monkeypatch)
    joined(client, graph, CONNECTED)
    assert client.get("/api/bodega/waitlist").json()["onboarded"] is False

    finished(client)
    first = bodega._business(CONNECTED)["onboarded_at"]
    assert first == clock.at
    assert client.get("/api/bodega/waitlist").json()["onboarded"] is True

    # A reload presses it again, and the five-minute clock keeps the moment it already holds.
    clock.forward(120)
    finished(client)
    assert bodega._business(CONNECTED)["onboarded_at"] == first


def test_the_walks_last_step_needs_the_session(client, monkeypatch):
    FakeTransport(monkeypatch, refuse)
    answered = client.post("/api/bodega/onboarded", json={})
    assert answered.status_code == 401
    assert answered.json()["error"]["code"] == "bodega_session_required"


def test_the_status_page_is_public_and_carries_no_phone_and_no_address(client, monkeypatch):
    graph = FakeTransport(monkeypatch, refuse)
    mine = joined(client, graph, CONNECTED)

    # WHOEVER HOLDS THE LINK OPENS IT: the cookie goes, and the read still answers.
    client.cookies.clear()
    read = client.get(f"/api/bodega/status/{mine['referralCode']}")
    assert read.status_code == 200, read.text
    body = read.json()
    assert set(body) == {"name", "kind", "place", "ahead", "joined", "covered", "referral_url", "language"}
    assert body["name"] == "Bodega Yesenia"
    assert body["kind"] == "bodega"
    assert body["place"] == mine["place"]
    assert body["ahead"] == mine["place"] - 1
    assert body["referral_url"] == mine["referralUrl"]
    assert body["language"] == "es"
    whole = read.text
    assert CONNECTED not in whole and CONNECTED.lstrip("+") not in whole
    assert LIMA["text"] not in whole and LIMA["placeId"] not in whole

    # A code lower-cased in a paste reads the same row; a code nobody holds is a named 404.
    assert client.get(f"/api/bodega/status/{mine['referralCode'].lower()}").json() == body

    # A BUSINESS THAT HAS WRITTEN NO DETAILS YET answers a name of no words and a trade of none,
    # which is what the page types (`start/joining.ts`).
    sign_in(client, graph, SECOND)
    bare = client.get(f"/api/bodega/status/{client.get('/api/bodega/waitlist').json()['referralCode']}")
    assert bare.json()["kind"] is None and bare.json()["name"] == ""

    unknown = client.get("/api/bodega/status/ZZZZZZ")
    assert unknown.status_code == 404
    assert unknown.json()["error"]["code"] == "bodega_status_unknown"


def test_the_status_page_counts_who_joined_and_what_that_covers(client, monkeypatch):
    """0, 2, 3 and 7 businesses joined through this code: `covered` is every third of them."""
    graph = FakeTransport(monkeypatch, refuse)
    clock = Clock(monkeypatch)
    mine = joined(client, graph, CONNECTED)
    code = mine["referralCode"]

    def read() -> dict:
        return client.get(f"/api/bodega/status/{code}").json()

    assert (read()["joined"], read()["covered"]) == (0, 0)

    for index in range(7):
        # A MINUTE PER BUSINESS: the sign-in asks the connection service a few times a minute, and
        # seven shops joining in one second is that ceiling rather than this arithmetic.
        clock.forward(bodega.ASK_WINDOW + 1)
        sign_in(client, graph, f"+51955{index:06d}")
        attributed = client.post("/api/bodega/referral/attribute", json={"code": code})
        assert attributed.json() == {"attributed": True}
        if index + 1 in (2, 3, 7):
            answered = read()
            assert (answered["joined"], answered["covered"]) == (index + 1, (index + 1) // 3)


# ── §2 · META'S OWN DOOR ────────────────────────────────────────────────────────────────────────

def test_the_verification_answers_metas_challenge_only_with_this_boxs_own_token(client, monkeypatch):
    FakeTransport(monkeypatch, refuse)
    monkeypatch.setenv("BODEGA_WA_VERIFY_TOKEN", VERIFY_TOKEN)
    asked = {"hub.mode": "subscribe", "hub.verify_token": VERIFY_TOKEN, "hub.challenge": "1158201444"}
    answered = client.get("/api/bodega/wa/webhook", params=asked)
    assert answered.status_code == 200
    assert answered.text == "1158201444"
    assert answered.headers["content-type"].startswith("text/plain")

    wrong = client.get("/api/bodega/wa/webhook", params={**asked, "hub.verify_token": "someone-elses"})
    assert wrong.status_code == 403
    assert wrong.json()["error"]["code"] == "bodega_webhook_refused"

    other_mode = client.get("/api/bodega/wa/webhook", params={**asked, "hub.mode": "unsubscribe"})
    assert other_mode.status_code == 403

    # A token carrying letters outside ASCII is a refusal, never a failure inside the comparison.
    accented = client.get("/api/bodega/wa/webhook", params={**asked, "hub.verify_token": "señor"})
    assert accented.status_code == 403
    assert accented.json()["error"]["code"] == "bodega_webhook_refused"


def test_a_box_holding_no_verify_token_answers_a_named_503(client, monkeypatch):
    """FAIL CLOSED: a door with no token is shut, never open."""
    FakeTransport(monkeypatch, refuse)
    answered = client.get("/api/bodega/wa/webhook", params={
        "hub.mode": "subscribe", "hub.verify_token": "anything", "hub.challenge": "1158201444",
    })
    assert answered.status_code == 503
    assert answered.json()["error"]["code"] == "bodega_webhook_unconfigured"


def test_a_payload_is_read_only_where_its_signature_is_this_apps_own(client, monkeypatch, published):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    Clock(monkeypatch)
    joined(client, graph, CONNECTED)

    # No secret: the named 503, and nothing is read.
    unconfigured = post_webhook(client, wrote(CONNECTED, "Hola"))
    assert unconfigured.status_code == 503
    assert unconfigured.json()["error"]["code"] == "bodega_webhook_unconfigured"

    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)
    forged = post_webhook(client, wrote(CONNECTED, "Hola"), secret="someone-elses-secret")
    assert forged.status_code == 403
    assert forged.json()["error"]["code"] == "bodega_webhook_refused"

    missing = client.post("/api/bodega/wa/webhook", json=wrote(CONNECTED, "Hola"))
    assert missing.status_code == 403

    assert graph.requests == []


def test_a_delivery_status_and_a_repeated_id_are_answered_with_nothing(client, monkeypatch, published):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    Clock(monkeypatch)
    joined(client, graph, CONNECTED)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)

    status = post_webhook(client, delivered())
    assert status.status_code == 200 and status.json() == {"received": True}
    assert graph.requests == []

    first = post_webhook(client, wrote(CONNECTED, "Hola Rocoto"))
    assert first.status_code == 200
    spoken = len(graph.requests)
    assert spoken == 1

    # META RETRIES WHAT IT READ NO 200 FOR, and the same id is answered once.
    again = post_webhook(client, wrote(CONNECTED, "Hola Rocoto"))
    assert again.status_code == 200
    assert len(graph.requests) == spoken


def test_signed_messages_for_another_meta_phone_never_create_a_waitlist_contact(
    client, monkeypatch, published
):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    Clock(monkeypatch)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)
    payload = wrote(THIRD, "Quiero unirme a la lista de espera de Rocoto.", "wamid.OTHER-PHONE")
    payload["entry"][0]["changes"][0]["value"]["metadata"]["phone_number_id"] = "merchant-phone-id"

    answered = post_webhook(client, payload)

    assert answered.status_code == 200 and answered.json() == {"received": True}
    with bodega._db() as db:
        assert db.execute("SELECT 1 FROM businesses WHERE phone=?", (THIRD,)).fetchone() is None
    assert graph.requests == []


def test_an_old_signed_message_secures_the_place_without_opening_a_reply_window(
    client, monkeypatch, published
):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    clock = Clock(monkeypatch)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)
    payload = wrote(THIRD, "Quiero unirme a la lista de espera de Rocoto.", "wamid.OLD")
    provider_at = clock.at - bodega.WHATSAPP_REPLY_WINDOW - 1
    payload["entry"][0]["changes"][0]["value"]["messages"][0]["timestamp"] = str(provider_at)

    answered = post_webhook(client, payload)

    assert answered.status_code == 200
    assert bodega._contact(THIRD)["intake_stage"] == "announce"
    with bodega._db() as db:
        recorded = db.execute(
            "SELECT provider_at FROM wa_inbound WHERE message_id='wamid.OLD'"
        ).fetchone()
    assert recorded["provider_at"] == provider_at
    assert graph.requests == []


def test_first_signed_inbound_secures_a_place_and_starts_name_intake(client, monkeypatch, published):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    Clock(monkeypatch)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)

    answered = post_webhook(
        client,
        wrote(THIRD, "Quiero unirme a la lista de espera de Rocoto.", identifier="wamid.NEW"),
    )
    assert answered.status_code == 200
    row = bodega._contact(THIRD)
    assert row["place"] == bodega.WAITLIST_BASE
    assert row["person_name"] == "" and row["name"] == ""
    assert row["intake_stage"] == "person_name"
    assert graph.destinations == [THIRD.lstrip("+")] * 2
    assert f"#{bodega.WAITLIST_BASE:,}" in bodies(graph)[0]
    assert bodies(graph)[1] == "¿Cómo te llamas?"


def test_membership_and_referral_are_durable_before_background_reply_runs(
    client, monkeypatch, published
):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    Clock(monkeypatch)
    inviter = joined(client, graph, CONNECTED)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)
    monkeypatch.setattr(bodega.BackgroundTasks, "add_task", lambda *args, **kwargs: None)

    post_webhook(client, wrote(
        THIRD,
        "Quiero unirme a la lista de espera de Rocoto.\n"
        f"Referencia: {inviter['referralCode']}",
        "wamid.DURABLE",
    ))

    contact = bodega._contact(THIRD)
    assert contact["place"] == bodega.WAITLIST_BASE + 1
    assert contact["referred_by"] == CONNECTED
    assert contact["intake_stage"] == "announce"
    assert bodega._contact(CONNECTED)["attributed_count"] == 1
    assert graph.requests == []


def test_the_exact_english_website_join_message_sets_english_before_the_ack(
    client, monkeypatch, published
):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    Clock(monkeypatch)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)

    post_webhook(client, wrote(THIRD, "I’d like to join the Rocoto waitlist.", "wamid.ENGLISH"))

    assert bodega._contact(THIRD)["language"] == "en"
    assert bodies(graph)[0].startswith("Your place on the Rocoto waitlist is secured")
    assert bodies(graph)[1] == "What's your name?"


def test_name_intake_is_deterministic_and_finishes_with_the_captured_profile(
    client, monkeypatch, published
):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    Clock(monkeypatch)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)

    post_webhook(client, wrote(THIRD, "Quiero unirme a la lista de espera de Rocoto.", "wamid.JOIN"))
    post_webhook(client, wrote(THIRD, "Yesenia", "wamid.PERSON"))
    assert bodies(graph)[-1] == "¿Cómo se llama tu negocio?"
    post_webhook(client, wrote(THIRD, "Bodega Yesenia", "wamid.BUSINESS"))
    assert bodies(graph)[-1].startswith("¿Qué correo usas en Google Play?")
    post_webhook(client, wrote(THIRD, "yesenia@example.com", "wamid.EMAIL"))

    row = bodega._contact(THIRD)
    assert row["person_name"] == "Yesenia"
    assert row["name"] == "Bodega Yesenia"
    assert row["intake_stage"] == "complete"
    assert row["tester_email"] == "yesenia@example.com"
    assert row["tester_enrollment"] == "requested"
    assert bodies(graph)[-1] == (
        "He guardado yesenia@example.com para la prueba. "
        "Te enviaré el acceso por aquí cuando esté listo."
    )


def test_a_known_failed_tester_link_send_retries_on_the_next_signed_message(
    client, monkeypatch, published
):
    answers = Answers()
    answers.refusing = True
    graph = FakeTransport(monkeypatch, answers)
    configured(monkeypatch)
    Clock(monkeypatch)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)
    with bodega._db() as db:
        bodega._ensure_contact(db, THIRD, bodega._now())
        db.execute(
            "UPDATE businesses SET person_name='Yesenia',name='Bodega Yesenia',"
            "intake_stage='tester_email',first_inbound_at=? WHERE phone=?",
            (bodega._now(), THIRD),
        )

    async def eligible(_: str) -> dict:
        return {"state": "eligible", "email": "yesenia@example.com", "optInUrl": "https://play.test"}

    monkeypatch.setattr(bodega_testing, "enroll", eligible)
    post_webhook(client, wrote(THIRD, "yesenia@example.com", "wamid.EMAIL-FAIL"))
    with bodega_testing._db() as db:
        failed = db.execute(
            "SELECT wa_invite_state FROM tester_enrollments WHERE phone=?", (THIRD,)
        ).fetchone()
    assert failed["wa_invite_state"] == "known_failed"

    answers.refusing = False
    post_webhook(client, wrote(THIRD, "Hola", "wamid.RETRY-LINK"))
    with bodega_testing._db() as db:
        sent = db.execute(
            "SELECT wa_invite_state,wa_invite_message_id FROM tester_enrollments WHERE phone=?",
            (THIRD,),
        ).fetchone()
    assert dict(sent) == {"wa_invite_state": "sent", "wa_invite_message_id": WAMID}
    assert bodies(graph)[-1] == "Ya tienes acceso a la prueba de Rocoto en Google Play: https://play.test"


def test_two_rapid_name_messages_cannot_cross_the_intake_stage(client, monkeypatch, published):
    FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    Clock(monkeypatch)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)
    post_webhook(client, wrote(THIRD, "Quiero unirme a la lista de espera de Rocoto.", "wamid.JOIN"))

    batch = wrote(THIRD, "Yesenia", "wamid.NAME-ONE")
    messages = batch["entry"][0]["changes"][0]["value"]["messages"]
    messages.append({
        **messages[0],
        "id": "wamid.NAME-TWO",
        "text": {"body": "Este segundo mensaje sigue siendo una respuesta de nombre"},
    })
    post_webhook(client, batch)

    contact = bodega._contact(THIRD)
    assert contact["person_name"] == "Yesenia"
    assert contact["name"] == ""
    assert contact["intake_stage"] == "business_name"


def test_an_existing_profile_gets_its_place_without_an_early_referral_prompt(client, monkeypatch, published):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    Clock(monkeypatch)
    mine = joined(client, graph, CONNECTED)
    finished(client)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)

    answered = post_webhook(client, wrote(CONNECTED, "Hola Rocoto, soy Bodega Yesenia."))
    assert answered.status_code == 200
    assert graph.destinations == [CONNECTED.lstrip("+")]
    assert bodies(graph) == [
        f"¡Hola, Bodega Yesenia! Soy Rocoto 👋 Ya estás en la lista de espera: vas en el puesto "
        f"#{mine['place']:,}. Aquí ves tu puesto y quién entró por ti: "
        f"{PAGE}?lista={mine['referralCode']}",
    ]


def test_a_shop_that_came_from_the_english_page_is_answered_in_english(client, monkeypatch, published):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    Clock(monkeypatch)
    mine = joined(client, graph, SECOND, name="Yesenia's shop", language="en")
    finished(client)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)

    post_webhook(client, wrote(SECOND, "Hi Rocoto, this is Yesenia's shop."))
    assert bodies(graph) == [
        f"Hi Yesenia's shop! I'm Rocoto 👋 You're on the waitlist, at #{mine['place']:,}. "
        f"Your place and who joined through you are here: {PAGE}?lista={mine['referralCode']}",
    ]


def test_a_later_message_is_answered_with_the_place_alone_every_ten_minutes(client, monkeypatch, published):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    clock = Clock(monkeypatch)
    mine = joined(client, graph, CONNECTED)
    finished(client)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)
    post_webhook(client, wrote(CONNECTED, "Hola"))
    assert len(graph.requests) == 1

    clock.forward(bodega.STATUS_AGAIN - 60)
    post_webhook(client, wrote(CONNECTED, "¿Y ahora?", identifier="wamid.SECOND"))
    assert len(graph.requests) == 1

    clock.forward(120)
    post_webhook(client, wrote(CONNECTED, "¿Y ahora?", identifier="wamid.THIRD"))
    assert len(graph.requests) == 2
    assert bodies(graph)[-1] == (
        f"¡Hola, Bodega Yesenia! Soy Rocoto 👋 Ya estás en la lista de espera: vas en el puesto "
        f"#{mine['place']:,}. Aquí ves tu puesto y quién entró por ti: "
        f"{PAGE}?lista={mine['referralCode']}"
    )


def test_the_reference_attributes_a_distinct_new_contact_to_the_inviter_once(
    client, monkeypatch, published
):
    """The sender owns the new row; the referral code only names who invited it."""
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    Clock(monkeypatch)
    mine = joined(client, graph, CONNECTED)
    finished(client)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)

    said = (
        "Quiero unirme a la lista de espera de Rocoto.\n"
        f"Referencia: {mine['referralCode'].lower()}"
    )
    post_webhook(client, wrote(THIRD, said, identifier="wamid.REFERENCE"))
    invitee = bodega._contact(THIRD)
    inviter = bodega._contact(CONNECTED)
    assert invitee["phone"] == THIRD
    assert invitee["referred_by"] == CONNECTED
    assert invitee["referral_code"] != mine["referralCode"]
    assert inviter["attributed_count"] == 1
    assert graph.destinations == [THIRD.lstrip("+")] * 2

    post_webhook(client, wrote(THIRD, said, identifier="wamid.REFERENCE-AGAIN"))
    assert bodega._contact(CONNECTED)["attributed_count"] == 1


# ── §3 · THE FIVE-MINUTE HELLO ──────────────────────────────────────────────────────────────────

def template(graph) -> dict:
    return [payload for payload in graph.payloads if payload["type"] == "template"][-1]


def test_the_hello_waits_five_minutes_and_then_states_the_name_the_place_and_the_code(
    client, monkeypatch, published
):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    clock = Clock(monkeypatch)
    mine = joined(client, graph, CONNECTED)
    finished(client)

    clock.forward(bodega.HELLO_AFTER - 60)
    assert asyncio.run(bodega.hello_tick()) == 0
    assert graph.requests == []

    clock.forward(120)
    assert asyncio.run(bodega.hello_tick()) == 1
    sent = template(graph)
    assert sent["to"] == CONNECTED.lstrip("+")
    assert sent["template"]["name"] == "waitlist_hello"
    assert sent["template"]["language"] == {"code": "es"}
    assert sent["template"]["components"] == [
        {"type": "body", "parameters": [
            {"type": "text", "text": "Bodega Yesenia"},
            {"type": "text", "text": f"{mine['place']:,}"},
        ]},
        {"type": "button", "sub_type": "url", "index": "0",
         "parameters": [{"type": "text", "text": mine["referralCode"]}]},
    ]

    # ONCE. A later tick has nothing to say to this shop.
    clock.forward(bodega.HELLO_AFTER)
    assert asyncio.run(bodega.hello_tick()) == 0
    assert len(graph.requests) == 1


def test_the_hello_goes_out_in_the_language_the_walk_was_read_in(client, monkeypatch, published):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    clock = Clock(monkeypatch)
    joined(client, graph, SECOND, name="Yesenia's shop", language="en")
    finished(client)

    clock.forward(bodega.HELLO_AFTER + 1)
    assert asyncio.run(bodega.hello_tick()) == 1
    assert template(graph)["template"]["language"] == {"code": "en"}


def test_a_shop_that_wrote_first_is_never_sent_the_hello(client, monkeypatch, published):
    """A shop already talking to the buddy opened its own window, and the template is for silence."""
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    clock = Clock(monkeypatch)
    joined(client, graph, CONNECTED)
    finished(client)
    monkeypatch.setenv("BODEGA_WA_APP_SECRET", APP_SECRET)

    clock.forward(60)
    post_webhook(client, wrote(CONNECTED, "Hola Rocoto"))
    assert len(graph.requests) == 1

    clock.forward(bodega.HELLO_AFTER + 1)
    assert asyncio.run(bodega.hello_tick()) == 0
    assert len(graph.requests) == 1


def test_a_refused_hello_backs_off_and_five_refusals_leave_that_shop_alone(client, monkeypatch, published):
    answers = Answers()
    graph = FakeTransport(monkeypatch, answers)
    configured(monkeypatch)
    clock = Clock(monkeypatch)
    joined(client, graph, CONNECTED)
    finished(client)
    answers.refusing = True

    clock.forward(bodega.HELLO_AFTER + 1)
    assert asyncio.run(bodega.hello_tick()) == 0
    assert len(graph.requests) == 1
    held = bodega._business(CONNECTED)
    assert held["hello_attempts"] == 1 and held["hello_sent_at"] == 0

    # THE BACKOFF IS REAL: the minute after a refusal has nothing in it.
    clock.forward(60)
    assert asyncio.run(bodega.hello_tick()) == 0
    assert len(graph.requests) == 1

    # Four more attempts, each past its own backoff, and then this shop is left alone.
    for attempt in range(2, 6):
        clock.forward(bodega.HELLO_BACKOFF[-1] + 1)
        assert asyncio.run(bodega.hello_tick()) == 0
        assert len(graph.requests) == attempt
    assert bodega._business(CONNECTED)["hello_attempts"] == bodega.HELLO_ATTEMPTS

    clock.forward(bodega.HELLO_BACKOFF[-1] * 10)
    assert asyncio.run(bodega.hello_tick()) == 0
    assert len(graph.requests) == bodega.HELLO_ATTEMPTS

    # A shop that answers again is reached the moment the window opens: the refusals were the
    # template's, and the day's ceiling gave every one of those places back.
    answers.refusing = False
    assert bodega._business(CONNECTED)["hello_sent_at"] == 0


def test_the_hello_takes_the_same_days_ceiling_every_other_send_takes(client, monkeypatch, published):
    graph = FakeTransport(monkeypatch, Answers())
    configured(monkeypatch)
    clock = Clock(monkeypatch)
    joined(client, graph, CONNECTED)
    finished(client)
    monkeypatch.setattr(bodega, "DAILY_SENDS", 0)

    clock.forward(bodega.HELLO_AFTER + 1)
    assert asyncio.run(bodega.hello_tick()) == 0
    assert graph.requests == []
    assert bodega._business(CONNECTED)["hello_attempts"] == 1


def test_the_sandbox_holds_the_hello_before_any_http(client, monkeypatch, published):
    """`ROCOTO_EGRESS_SANDBOX` is the house's own switch: the marker comes back, nothing is sent."""
    graph = FakeTransport(monkeypatch, refuse)
    configured(monkeypatch)
    clock = Clock(monkeypatch)
    joined(client, graph, CONNECTED)
    finished(client)
    monkeypatch.setenv("ROCOTO_EGRESS_SANDBOX", "true")

    clock.forward(bodega.HELLO_AFTER + 1)
    assert asyncio.run(bodega.hello_tick()) == 1
    assert graph.requests == []
    assert bodega._business(CONNECTED)["hello_sent_at"] == clock.at


def test_the_loop_is_off_under_its_own_switch(monkeypatch, state):
    monkeypatch.setenv("BODEGA_BUDDY_LOOP", "off")
    asyncio.run(bodega.start())
    assert bodega._buddy_jobs == set()
