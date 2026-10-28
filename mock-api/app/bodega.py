"""THE BODEGA RIG'S SERVER HALF — the sign-in, the referral record, and Rocoto's own mouth.

`app/src/prototypes/bodega-pay-later/WIRING-SPEC.md` §1 and §4. Two jobs, one module, because they
share one story: the rig knows which shop is asking, and the only number that may write to that shop
is Rocoto's own.

§1 · A VERIFIED PHONE IS THE ACCOUNT; META CONNECTION IS A CAPABILITY. A signed inbound WhatsApp
message creates the durable waitlist contact for its sender. Phone verification may then mint a
native session for that existing contact. Meta's Embedded Signup remains the separate, final proof
that marks this phone as a connected business. Each private route names which of those two proofs it
requires instead of making every bearer imply a Meta connection.

§4 · ROCOTO'S OWN NUMBER. Rocoto's WABA `2033396113925190`, number `+1 978 958 9459`, sends the
closing message and the supplier notice to the number the session holds, which is the number the
connection reported.

⚠ **THIS MODULE'S GRAPH CLIENT IS ITS OWN.** `mock-api` imports nothing from `backend/`, so the four
shapes below — `_post_messages`, `send_text`, `send_template`, `sender_scope` — are modelled on
`backend/whatsapp_cloud.py` and written here. The difference is the one that matters:
**there is no box default.** `backend/config.py` defaults `WA_CLOUD_PHONE_ID` to `1144962938711312`,
another company's number, so a silent fallback would message a Peruvian bodega from the wrong mouth.
Absent values are the named 503 `bodega_whatsapp_unconfigured`, and the destination is always the
session's own number — read from the live proof verification when the session is minted,
never a literal in this file and never a field of the request.

Three more refusals, each proved in `tests/test_bodega.py`: a number that is not E.164 is a named
400; a Graph 2xx carrying no `wamid` raises rather than inventing an id, because an invented id can
never be matched by a delivery webhook; and the global `ROCOTO_EGRESS_SANDBOX` returns an explicit
synthetic marker before any HTTP happens. The journal carries the kind and the outcome of every send
and never a word of what was said.

HOW OFTEN THAT MOUTH MAY SPEAK is the refusal beside them: the gates in front of `/notify` are
`_origin`, which reads a header any HTTP client sets, and the session cookie, so every send takes one
of that destination's `DAILY_SENDS` messages for the day (`bodega_send_ceiling`).

§7 · THE BUDDY ANSWERS, AND THE BUDDY SAYS HELLO FIRST. Peter, 20 September 2026: «the whole signup
onboarding and their persistent waiting list position and referral tracker should be a link the buddy
sends as the first thing». Two doors carry it, and each keeps the refusals above.

`GET|POST /api/bodega/wa/webhook` is Meta's own door, so the page's `Origin` header is no gate here
and the signature is: the GET answers `hub.challenge` only where `hub.verify_token` equals
`BODEGA_WA_VERIFY_TOKEN`, and the POST verifies `X-Hub-Signature-256` over the RAW body against
`BODEGA_WA_APP_SECRET`. **Both fail closed** — an absent value is a named 503 rather than an open
door — a message id is answered once and a delivery status is read and dropped. The signed sender
gets a durable waitlist contact and a small fixed intake in its own language. The destination is
always the number that wrote to Rocoto, which Meta's signature is the evidence for.

THE FIVE-MINUTE HELLO is the other half: a business that finished the walk and stayed quiet for five
minutes is sent the `waitlist_hello` TEMPLATE, because a shop that wrote nothing opened no window.
One loop task, started with the app and cancelled with it, off under `BODEGA_BUDDY_LOOP=off`, five
attempts at most, each refusal backing off further, every one of them spending the same daily ceiling
a `/notify` send spends. The journal names the kind and the outcome and never a word that was said.
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import io
import json
import logging
import os
import re
import secrets
import sqlite3
import time
from contextlib import contextmanager
from contextvars import ContextVar
from pathlib import Path
from typing import Iterator, Literal

import httpx
from fastapi import APIRouter, BackgroundTasks, File, Form, Query, Request, UploadFile
from fastapi.responses import JSONResponse, Response
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, ConfigDict, Field, field_validator

from . import places
from .cedar_access import allowed_origin

# THE CONNECTION SERVICE IS REACHED THE WAY THE BRIDGE REACHES IT (`cedar_whatsapp.py`): the same
# host-only cookie name, the same loopback upstream and the same provider origin, declared once there
# so the sign-in and the browser's own `/api/proof/*` calls can never drift apart.
from .cedar_whatsapp import COOKIE as CEDAR_COOKIE
from .cedar_whatsapp import PROVIDER_ORIGIN, UPSTREAM
from .config import settings
from .errors import RuntimeError_

logger = logging.getLogger("rocoto.runtime.bodega")

router = APIRouter(prefix="/api/bodega", tags=["bodega-rig"])

COOKIE = "__Host-bodega_session"
GRAPH = "https://graph.facebook.com/v21.0"
# httpx's default "python-httpx/x.y" is a known WAF-block magnet on Graph, so every call is named.
_UA = "Rocoto/1.0 (+https://soyrocoto.com)"
SANDBOX_WAMID = "SANDBOX-bodega-wa"

SESSION_TTL = 30 * 24 * 60 * 60
MOBILE_ATTEMPT_TTL = 10 * 60
MOBILE_ATTEMPT_MEMORY = 24 * 60 * 60
MOBILE_ATTEMPTS_STORED = 1_000
MOBILE_LIMITS_STORED = 2_000
MOBILE_REDEEM_TRIES = 5
STATE_READ = 8                   # the connection service verification, read inside a request handler
SEND_DAY = 24 * 60 * 60          # the ceiling's bucket: one destination's day on Rocoto's own WABA
DAILY_SENDS = 40                 # a day of walking the app many times over, and a wall a loop meets
MAX_INVITED = 200

E164 = re.compile(r"^\+[1-9]\d{7,14}$")
OPAQUE = re.compile(r"^[A-Za-z0-9_-]{43,200}$")
PKCE_VALUE = re.compile(r"^[A-Za-z0-9_-]{43,128}$")
# The connection service's own session token, the shape the bridge forwards (`cedar_whatsapp.py`).
CEDAR_TOKEN = re.compile(r"[A-Za-z0-9_-]{20,200}")

# ── §0 · THE WAITLIST — ONBOARDING-SPEC.md §0, screen 3 ─────────────────────────────────────────
# «Bring another business and you move up.» Two named constants carry the whole mechanic, so a
# number a designer wants to tune later is one line, never a literal buried in a handler.
WAITLIST_BASE = 1204              # ONBOARDING-SPEC §0 screen 3's own example, «#1,204» — the first
                                   # real business is not «#1», so this is where the queue starts.
WAITLIST_MOVE_UP = 50              # places a business gains for every business attributed to it.
REFERRALS_PER_COVERED_PURCHASE = 3  # FEED-IA §268, 20 September evening: «every 3 bodegas».
# No look-alike characters: 0/O, 1/I/L are out, so a shopkeeper reading a code aloud at a counter
# never mishears one letter for another. (Digits and letters interleaved in this literal on
# purpose — `test_no_number_is_written_into_this_module` reads eight straight digits as a phone.)
REFERRAL_ALPHABET = "234A56B789CDEFGHJKMNPQRSTUVWXYZ"
REFERRAL_CODE_LENGTH = 6
REFERRAL_CODE = re.compile(f"[{REFERRAL_ALPHABET}]{{{REFERRAL_CODE_LENGTH}}}")

# ── §4/§5 · THE ADDRESS AND THE YAPE STEPS — ONBOARDING-SPEC.md §0, screens 5 and 7 ──────────────
# The address search rides the same per-minute clock shape `_ask` already keeps for the connection
# service (the `asks` table), under its own key so the two ceilings never share a bucket.
ADDRESS_ASKS_PER_SESSION = 30      # a shopkeeper typing an address, several suggestions a keystroke
ADDRESS_ASKS_IN_ALL = 300          # the whole rig's own address budget in a minute
ADDRESS_COUNTRY = "PE"             # this prototype is Peru only; the toggle in places.py is not its
PERU_MOBILE = re.compile(r"^\+519\d{8}$")
# «Small» — a shop's own QR photo, never a scan the size of a document.
YAPE_QR_MAX_BYTES = 2 * 1024 * 1024
YAPE_QR_TYPES = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}

# ── §7 · THE BUDDY'S OWN CLOCKS — Meta's door, the hello, and how a refusal backs off ────────────
# The two secrets are read from the environment at the call, the way the bridge's switch is, so a
# box that sets them needs no restart of this module's own import, and an absent one is a refusal.
WEBHOOK_VERIFY_TOKEN_ENV = "BODEGA_WA_VERIFY_TOKEN"   # what Meta's own subscribe screen echoes
WEBHOOK_SECRET_ENV = "BODEGA_WA_APP_SECRET"           # the app secret every payload is signed with
BUDDY_LOOP_ENV = "BODEGA_BUDDY_LOOP"                  # `off` leaves the hello loop unstarted
INBOUND_MEMORY = 3 * 24 * 60 * 60  # how long a handled message id is remembered, for Meta's retries
WHATSAPP_REPLY_WINDOW = 24 * 60 * 60
WHATSAPP_CLOCK_SKEW = 5 * 60
STATUS_AGAIN = 10 * 60             # a later message is answered with the place again, this often
HELLO_AFTER = 5 * 60               # Peter: «if they didn't message the buddy for 5 minutes»
HELLO_ATTEMPTS = 5                 # attempts at the hello, and then this business is left alone
HELLO_BACKOFF = (5 * 60, 15 * 60, 60 * 60, 6 * 60 * 60)  # after attempt 1, 2, 3, and 4 or more
BUDDY_PERIOD = 30                  # how often the loop looks, which is well under HELLO_AFTER

# What every path says to a browser holding no session: the one act that opens this shop.
SIGN_IN_SAYS = "Connect your WhatsApp to continue."
CONNECTION_ABSENT = ("bodega_connection_absent", SIGN_IN_SAYS, 401)

# ── THE SPANISH, FROM MESSAGES.md ────────────────────────────────────────────────────────────────
# Each string is its row in `app/src/prototypes/bodega-pay-later/MESSAGES.md` §3, and the row's
# variables are the only part that moves.
CLOSING_MESSAGE = (
    "Listo, {name}. Acá me quedo: te aviso cuando entre un proveedor tuyo, cuando te paguen y "
    "cuando toque un pago. Tu negocio en Rocoto está acá: {page}"
)
SUPPLIER_CONNECTED_MESSAGE = "Tu proveedor {name} ya entró. Ya son {count} proveedores tuyos en Rocoto."

# ── THE BUDDY'S THREE SENTENCES — MESSAGES.md §3 rows 21, 22 and 23 ──────────────────────────────
# Spanish is the shop's language and English is the one a shop that came from the English page
# reads (`language` on its own row). Each row states a place and a link, and no rate, fee, amount,
# term or approval: the credit law this file already keeps for every other row.
#
# STATUS is the FIRST thing the buddy says, and it carries the page that holds the place and the
# businesses that joined through this one. FORWARD-INTRO announces the message under it, and
# FORWARDABLE travels ALONE so one long press forwards the whole of it to another shop.
LANGUAGES = ("es", "en")
DEFAULT_LANGUAGE: Literal["es", "en"] = "es"

STATUS_MESSAGE = {
    "es": (
        "¡Hola, {name}! Soy Rocoto 👋 Ya estás en la lista de espera: vas en el puesto #{place}. "
        "Aquí ves tu puesto y quién entró por ti: {status_url}"
    ),
    "en": (
        "Hi {name}! I'm Rocoto 👋 You're on the waitlist, at #{place}. "
        "Your place and who joined through you are here: {status_url}"
    ),
}
JOINED_MESSAGE = {
    "es": (
        "Tu puesto en la lista de espera de Rocoto está asegurado: vas en el #{place}. "
        "Puedes ver tu puesto aquí: {status_url}"
    ),
    "en": (
        "Your place on the Rocoto waitlist is secured: you're #{place}. "
        "You can see your place here: {status_url}"
    ),
}
PERSON_NAME_QUESTION = {"es": "¿Cómo te llamas?", "en": "What's your name?"}
BUSINESS_NAME_QUESTION = {
    "es": "¿Cómo se llama tu negocio?",
    "en": "What's your business called?",
}
PROFILE_CAPTURED_MESSAGE = {
    "es": "Gracias, {person}. He guardado {business} y tu puesto en la lista.",
    "en": "Thanks, {person}. I've saved {business} and your place on the waitlist.",
}
TESTER_EMAIL_QUESTION = {
    "es": "¿Qué correo usas en Google Play? Lo guardaré para darte acceso a la prueba cuando esté lista.",
    "en": "Which email do you use in Google Play? I'll save it for test access when it's ready.",
}
TESTER_EMAIL_CAPTURED = {
    "es": "He guardado {email} para la prueba. Te enviaré el acceso por aquí cuando esté listo.",
    "en": "I've saved {email} for testing. I'll send access here when it's ready.",
}
TESTER_ELIGIBLE = {
    "es": "Ya tienes acceso a la prueba de Rocoto en Google Play: {url}",
    "en": "You now have access to the Rocoto test on Google Play: {url}",
}
TESTER_INVITE_UNCERTAIN = {
    "es": "Escribe «envíame el enlace otra vez» y te lo mando de nuevo.",
    "en": "Write “send the link again” and I'll send it again.",
}
EMAIL = re.compile(r"^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$")
FORWARD_INTRO_MESSAGE = {
    "es": (
        "Aquí abajo te mando el mensaje para que lo reenvíes a otras bodegas y distribuidores. "
        "Cada negocio que entra con tu link te sube de puesto."
    ),
    "en": (
        "Below I'll send the message you can forward to other shops and distributors. "
        "Every business that joins through your link moves you up."
    ),
}
FORWARDABLE_MESSAGE = {
    "es": (
        "Me apunté a la lista de espera de Rocoto. Te guarda los pedidos y los pagos de WhatsApp. "
        "Entra con mi link y los dos subimos de puesto: {referral_url}"
    ),
    "en": (
        "I joined the Rocoto waitlist. It keeps your orders and your payments from WhatsApp. "
        "Join through my link and we both move up: {referral_url}"
    ),
}
# The template the buddy sends a shop that stayed quiet, and the variables its body and its button
# carry: the shop's name, its place, and its own code on the button's link (MESSAGES.md §5 item 8).
HELLO_TEMPLATE = "waitlist_hello"


# ── the bodies this rig accepts ──────────────────────────────────────────────────────────────────

class Empty(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Invited(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(default="", max_length=120)
    phone: str = Field(min_length=6, max_length=24)


class Referrals(BaseModel):
    model_config = ConfigDict(extra="forbid")
    invited: list[Invited] = Field(default_factory=list, max_length=MAX_INVITED)


class Notice(BaseModel):
    """THE DESTINATION IS ABSENT ON PURPOSE: `/notify` writes to the session's own number.

    `extra="forbid"` is what makes that a refusal rather than a silent ignore — a body still carrying
    a `to` field is answered 422 instead of being obeyed or quietly dropped.
    """

    model_config = ConfigDict(extra="forbid")
    kind: Literal["closing", "supplier-connected", "waitlist"]
    name: str = Field(default="", max_length=120)
    count: int = Field(default=0, ge=0, le=9999)


class Address(BaseModel):
    """A suggestion the shop already chose, and the pin's own coordinate for it — never typed
    freehand: `text` and `placeId` come from `address_suggestions`, `lat`/`lng` from `place_details`
    (ONBOARDING-SPEC.md §0, screen 5)."""

    model_config = ConfigDict(extra="forbid")
    text: str = Field(min_length=3, max_length=300)
    placeId: str = Field(min_length=1, max_length=300)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)

    @field_validator("text")
    @classmethod
    def _spoken(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Write the address first.")
        return stripped


BusinessRole = Literal[
    "bodega", "supplier", "restaurant", "sells_to_bodegas", "sells_to_restaurants"
]


class BusinessDetails(BaseModel):
    """Screen 4 and screen 5, one body: what the shop is, its name, and where it is.

    `language` is the walk's own language, and Spanish is what a body that omits it means: the page
    is Spanish everywhere and reads English only where the English site sent the shop over with
    `?lang=en`. Every sentence Rocoto writes to this business afterwards is in the language kept
    here, so the choice outlives the browser that made it.
    """

    model_config = ConfigDict(extra="forbid")
    personName: str = Field(default="", max_length=80)
    kind: BusinessRole
    name: str = Field(min_length=1, max_length=120)
    address: Address
    language: Literal["es", "en"] = DEFAULT_LANGUAGE

    @field_validator("name")
    @classmethod
    def _named(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Write the business's name first.")
        return stripped

    @field_validator("personName")
    @classmethod
    def _person_named(cls, value: str) -> str:
        return value.strip()


class BusinessPatch(BaseModel):
    """One or more profile answers saved before the final Meta connection."""

    model_config = ConfigDict(extra="forbid")
    personName: str | None = Field(default=None, min_length=1, max_length=80)
    kind: BusinessRole | None = None
    name: str | None = Field(default=None, min_length=1, max_length=120)
    address: Address | None = None
    language: Literal["es", "en"] | None = None

    @field_validator("personName", "name")
    @classmethod
    def _trimmed(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            raise ValueError("Write the name first.")
        return stripped


class TesterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=254)

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        clean = value.strip().lower()
        if not EMAIL.fullmatch(clean):
            raise ValueError("Write the Google Play account email.")
        return clean


class ReferralAttribution(BaseModel):
    model_config = ConfigDict(extra="forbid")
    # Bounded well past the code's own length, so a typo or a stray character answers the same
    # quiet «no» as an unknown code rather than a loud 422 that would tell them their shape was off.
    code: str = Field(min_length=1, max_length=40)


class MobileSessionStart(BaseModel):
    """A PKCE S256 challenge from the native app. It contains no phone or callback URL."""

    model_config = ConfigDict(extra="forbid")
    challenge: str = Field(pattern=PKCE_VALUE.pattern)


class MobileSessionApprove(BaseModel):
    """The web page's explicit act after it has shown the connected Meta account."""

    model_config = ConfigDict(extra="forbid")
    attempt: str = Field(pattern=OPAQUE.pattern)
    approve: Literal[True]


class MobileSessionRedeem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    attempt: str = Field(pattern=OPAQUE.pattern)
    verifier: str = Field(pattern=PKCE_VALUE.pattern)
    code: str = Field(pattern=OPAQUE.pattern)


class MobileSessionStatus(BaseModel):
    model_config = ConfigDict(extra="forbid")
    attempt: str = Field(pattern=OPAQUE.pattern)
    verifier: str = Field(pattern=PKCE_VALUE.pattern)


class MobileCancel(BaseModel):
    model_config = ConfigDict(extra="forbid")
    attempt: str = Field(pattern=OPAQUE.pattern)


# ── the rig's own records ────────────────────────────────────────────────────────────────────────

def _now() -> int:
    """One clock, in one function, so a test can move it."""
    return int(time.time())


def _path() -> Path:
    return settings.state_dir / "bodega-rig.sqlite"


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _pkce_challenge(verifier: str) -> str:
    """RFC 7636's S256 transform. The browser/database only sees this digest."""
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


# WHAT A BUSINESS ROW LEARNED ON 20 SEPTEMBER, each column with a constant default so an existing
# file takes it in place: the language its walk was read in, the moment the walk finished, the
# moment this shop first wrote to Rocoto, and the hello's own record — sent, tried, last tried.
BUSINESS_COLUMNS = (
    ("person_name", "TEXT NOT NULL DEFAULT ''"),
    ("intake_stage", "TEXT NOT NULL DEFAULT ''"),
    ("tester_email", "TEXT NOT NULL DEFAULT ''"),
    ("tester_enrollment", "TEXT NOT NULL DEFAULT ''"),
    ("language", "TEXT NOT NULL DEFAULT 'es'"),
    ("onboarded_at", "INTEGER NOT NULL DEFAULT 0"),
    ("first_inbound_at", "INTEGER NOT NULL DEFAULT 0"),
    ("hello_sent_at", "INTEGER NOT NULL DEFAULT 0"),
    ("hello_attempts", "INTEGER NOT NULL DEFAULT 0"),
    ("hello_attempt_at", "INTEGER NOT NULL DEFAULT 0"),
    ("last_reply_at", "INTEGER NOT NULL DEFAULT 0"),
    # Meta connection evidence belongs to the business record, rather than to a browser cookie.
    # A verified phone session may exist before this value does.
    ("connection_verified_at", "INTEGER NOT NULL DEFAULT 0"),
)


@contextmanager
def _db() -> Iterator[sqlite3.Connection]:
    """The rig's records, in this service's state directory, private to this user.

    The same custody `cedar_access.py` keeps: a regular file opened `O_NOFOLLOW` at mode 0600, and
    `secure_delete` on, so a cleared session leaves nothing legible behind.

    ⚠ **THE MIGRATION IS AN ADDITION, AND TWO TABLES ARE RETIRED IN PLACE.** A records file written
    while the code and the link doors stood holds `codes` and `links`; the demo runtime preserves this
    file across deploys (`RUNTIME_STATE`), so those tables are LEFT EXACTLY WHERE THEY ARE and nothing
    below creates, reads, sweeps or drops them. Leaving a table alone cannot fail; dropping one on
    every open could (WIRING-SPEC §1, 19 September 2026).
    """
    path = _path()
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_symlink():
        raise RuntimeError("The bodega rig's records require a regular private file")
    fd = os.open(path, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    os.close(fd)
    os.chmod(path, 0o600)
    db = sqlite3.connect(path, timeout=5)
    db.row_factory = sqlite3.Row
    try:
        with db:
            db.execute("PRAGMA secure_delete=ON")
            db.execute(
                "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, "
                "token_hash TEXT UNIQUE NOT NULL, phone TEXT NOT NULL, "
                "created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)"
            )
            db.execute(
                "CREATE TABLE IF NOT EXISTS sends (phone TEXT PRIMARY KEY, day INTEGER NOT NULL, "
                "count INTEGER NOT NULL)"
            )
            db.execute(
                "CREATE TABLE IF NOT EXISTS asks (key TEXT PRIMARY KEY, minute INTEGER NOT NULL, "
                "count INTEGER NOT NULL)"
            )
            db.execute(
                "CREATE TABLE IF NOT EXISTS referrals (session_id TEXT NOT NULL, phone TEXT NOT NULL, "
                "name TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, "
                "PRIMARY KEY (session_id, phone))"
            )
            # ONE ROW PER CONNECTED NUMBER — the waitlist place, the referral code, who brought this
            # business, its business details and its Yape, all keyed by the number the connection
            # reported. `_ensure_business` is the one place a row is minted.
            db.execute(
                "CREATE TABLE IF NOT EXISTS businesses ("
                "phone TEXT PRIMARY KEY, "
                "place INTEGER NOT NULL, "
                "referral_code TEXT NOT NULL UNIQUE, "
                "referred_by TEXT NOT NULL DEFAULT '', "
                "attributed_count INTEGER NOT NULL DEFAULT 0, "
                "covered_purchases INTEGER NOT NULL DEFAULT 0, "
                "kind TEXT NOT NULL DEFAULT '', "
                "name TEXT NOT NULL DEFAULT '', "
                "address_text TEXT NOT NULL DEFAULT '', "
                "address_place_id TEXT NOT NULL DEFAULT '', "
                "address_lat REAL, "
                "address_lng REAL, "
                "yape_number TEXT NOT NULL DEFAULT '', "
                "yape_qr_content_type TEXT NOT NULL DEFAULT '', "
                "yape_qr_content BLOB, "
                "created_at INTEGER NOT NULL)"
            )
            # THE 20 SEPTEMBER COLUMNS, ADDED IN PLACE. A records file from an earlier walk holds
            # this table without them, and the demo runtime keeps that file across deploys, so each
            # one is an `ALTER TABLE ... ADD COLUMN` with a constant default rather than a rebuild.
            held = {str(column["name"]) for column in db.execute("PRAGMA table_info(businesses)")}
            for column, declaration in BUSINESS_COLUMNS:
                if column not in held:
                    db.execute(f"ALTER TABLE businesses ADD COLUMN {column} {declaration}")
            # ONE ROW PER MESSAGE META HAS ALREADY DELIVERED HERE: Meta retries a webhook it read no
            # 200 for, and the buddy answering twice is the failure that retry would cause.
            db.execute(
                "CREATE TABLE IF NOT EXISTS wa_inbound (message_id TEXT PRIMARY KEY, "
                "at INTEGER NOT NULL, provider_at INTEGER NOT NULL DEFAULT 0)"
            )
            held_inbound = {
                str(column["name"])
                for column in db.execute("PRAGMA table_info(wa_inbound)")
            }
            if "provider_at" not in held_inbound:
                db.execute("ALTER TABLE wa_inbound ADD COLUMN provider_at INTEGER NOT NULL DEFAULT 0")
            # Native authorization records hold only opaque identifiers and digests. A lost device
            # cannot recover a verifier from this store, and a redeemed attempt stays marked
            # until expiry so a replay never looks like a new authorization.
            db.execute(
                "CREATE TABLE IF NOT EXISTS mobile_handoffs ("
                "id TEXT PRIMARY KEY, challenge_hash TEXT NOT NULL, expected_phone TEXT NOT NULL DEFAULT '', "
                "approved_phone TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, "
                "expires_at INTEGER NOT NULL, "
                "approved_at INTEGER NOT NULL DEFAULT 0, redeemed_at INTEGER NOT NULL DEFAULT 0, "
                "cancelled_at INTEGER NOT NULL DEFAULT 0, redeem_attempts INTEGER NOT NULL DEFAULT 0, "
                "grant_hash TEXT NOT NULL DEFAULT '', session_id TEXT NOT NULL DEFAULT '')"
            )
            held_handoffs = {
                str(column["name"])
                for column in db.execute("PRAGMA table_info(mobile_handoffs)")
            }
            if "grant_hash" not in held_handoffs:
                db.execute("ALTER TABLE mobile_handoffs ADD COLUMN grant_hash TEXT NOT NULL DEFAULT ''")
            if "session_id" not in held_handoffs:
                db.execute("ALTER TABLE mobile_handoffs ADD COLUMN session_id TEXT NOT NULL DEFAULT ''")
            db.execute(
                "CREATE TABLE IF NOT EXISTS mobile_limits ("
                "key TEXT PRIMARY KEY, period INTEGER NOT NULL, count INTEGER NOT NULL, "
                "touched_at INTEGER NOT NULL DEFAULT 0)"
            )
            held_limits = {
                str(column["name"])
                for column in db.execute("PRAGMA table_info(mobile_limits)")
            }
            if "touched_at" not in held_limits:
                db.execute("ALTER TABLE mobile_limits ADD COLUMN touched_at INTEGER NOT NULL DEFAULT 0")
            # The assistance pilot is an operator-owned record in this same private state file.
            # Load its schema after the rig's base tables exist. Its module has no HTTP routes.
            from . import bodega_cases
            bodega_cases.ensure_schema(db)
            yield db
    finally:
        db.close()


def _sweep(db: sqlite3.Connection) -> None:
    now = _now()
    db.execute("DELETE FROM sessions WHERE expires_at<=?", (now,))
    db.execute("DELETE FROM sends WHERE day<?", (now // SEND_DAY,))
    db.execute("DELETE FROM asks WHERE minute<?", (now // ASK_WINDOW,))
    db.execute("DELETE FROM wa_inbound WHERE at<?", (now - INBOUND_MEMORY,))
    db.execute("DELETE FROM mobile_handoffs WHERE expires_at<=?", (now,))
    db.execute("DELETE FROM mobile_limits WHERE period<?", (now - MOBILE_ATTEMPT_MEMORY,))
    db.execute(
        "DELETE FROM mobile_limits WHERE key NOT LIKE '%:*' AND key IN ("
        "SELECT key FROM mobile_limits WHERE key NOT LIKE '%:*' ORDER BY touched_at DESC LIMIT -1 OFFSET ?)",
        (MOBILE_LIMITS_STORED,),
    )
    db.execute(
        "DELETE FROM mobile_handoffs WHERE id IN ("
        "SELECT id FROM mobile_handoffs ORDER BY created_at DESC LIMIT -1 OFFSET ?)",
        (MOBILE_ATTEMPTS_STORED,),
    )


# ── HOW OFTEN THE SIGN-IN MAY ASK THE CONNECTION SERVICE ─────────────────────────────────────────
# `/session/connection` reads the service that holds real WhatsApp accounts, and the gate in front of
# it is `_origin`, a header any client sets. So each browser's connection cookie asks a few times a
# minute, and the whole door asks a bounded number of times a minute whatever cookies arrive, because
# a caller can mint cookie-shaped strings as fast as it can send them.
CONNECTION_UNREACHABLE = (
    "bodega_connection_unreachable",
    "WhatsApp is reconnecting. Open your shop again in a moment.",
    503,
)
SESSIONS_PER_NUMBER = 5
ASK_WINDOW = 60
ASKS_PER_COOKIE = 6
ASKS_IN_ALL = 120
ASK_RECENT = ("bodega_connection_recent", "Ask for this again in a moment.", 429)


def _ask(db: sqlite3.Connection, cookie: str, now: int) -> tuple[str, str, int] | None:
    """Take one read of the connection service for this minute, or name the refusal."""
    minute = now // ASK_WINDOW
    for key, ceiling in ((_hash(cookie), ASKS_PER_COOKIE), ("*", ASKS_IN_ALL)):
        row = db.execute("SELECT minute, count FROM asks WHERE key=?", (key,)).fetchone()
        asked = int(row["count"]) if row is not None and int(row["minute"]) == minute else 0
        if asked >= ceiling:
            return ASK_RECENT
    for key in (_hash(cookie), "*"):
        db.execute(
            "INSERT INTO asks(key,minute,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET "
            "minute=excluded.minute, "
            "count=CASE WHEN asks.minute=excluded.minute THEN asks.count+1 ELSE 1 END",
            (key, minute),
        )
    return None


ADDRESS_RECENT = ("bodega_address_recent", "Try the address search again in a moment.", 429)


def _address_ask(db: sqlite3.Connection, session_id: str, now: int) -> tuple[str, str, int] | None:
    """The address search's own bucket in the same `asks` table `_ask` keeps, under its own key so
    a shopkeeper's autocomplete never spends the connection service's few asks a minute, or the
    reverse. One session, several keystrokes a search — the ceiling is a keystroke's worth wider."""
    minute = now // ASK_WINDOW
    for key, ceiling in ((f"addr:{session_id}", ADDRESS_ASKS_PER_SESSION), ("addr:*", ADDRESS_ASKS_IN_ALL)):
        row = db.execute("SELECT minute, count FROM asks WHERE key=?", (key,)).fetchone()
        asked = int(row["count"]) if row is not None and int(row["minute"]) == minute else 0
        if asked >= ceiling:
            return ADDRESS_RECENT
    for key in (f"addr:{session_id}", "addr:*"):
        db.execute(
            "INSERT INTO asks(key,minute,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET "
            "minute=excluded.minute, "
            "count=CASE WHEN asks.minute=excluded.minute THEN asks.count+1 ELSE 1 END",
            (key, minute),
        )
    return None


# ── HOW OFTEN ROCOTO'S OWN NUMBER MAY SPEAK TO ONE DESTINATION ───────────────────────────────────
# Every notice rides free-form on Rocoto's live WABA, and the gates in front of it are `_origin` — an
# `Origin` header any HTTP client sets — and the session cookie. So every send spends from one
# destination's day (`bodega_send_ceiling`), which is the wall a loop meets.

def _spend(db: sqlite3.Connection, phone: str, now: int) -> tuple[str, str, int] | None:
    """Take one of this destination's messages for today, or name the refusal that stops the send.

    One row per destination, its day written beside its count, so the ceiling resets itself and the
    table stays the size of the numbers in play. **`Reset state` leaves this row standing** — a
    ceiling a press clears is no ceiling — and `_refund` gives the place back where the send failed,
    so a number awaiting its key spends nothing.
    """
    day = now // SEND_DAY
    row = db.execute("SELECT day, count FROM sends WHERE phone=?", (phone,)).fetchone()
    spent = int(row["count"]) if row is not None and int(row["day"]) == day else 0
    if spent >= DAILY_SENDS:
        return (
            "bodega_send_ceiling",
            "Rocoto sent this number its messages for today. The next one goes out tomorrow.",
            429,
        )
    db.execute(
        "INSERT INTO sends(phone,day,count) VALUES(?,?,1) ON CONFLICT(phone) DO UPDATE SET "
        "day=excluded.day, count=CASE WHEN sends.day=excluded.day THEN sends.count+1 ELSE 1 END",
        (phone, day),
    )
    return None


def _refund(phone: str, now: int) -> None:
    """A message that never left gives its place back, the way its credential row is dropped."""
    with _db() as db:
        db.execute(
            "UPDATE sends SET count=count-1 WHERE phone=? AND day=? AND count>0",
            (phone, now // SEND_DAY),
        )


# ── who may ask ──────────────────────────────────────────────────────────────────────────────────

def _origin(request: Request, *, required: bool) -> str:
    """The page's own origin, on `cedar_access.allowed_origin`'s list — one list for both surfaces.

    A write is always the page's, so a POST with no `Origin` is refused; a read renders the first screen, so
    a GET may arrive without one.
    """
    origin = request.headers.get("origin")
    if origin is None:
        if required:
            # Android's native HTTP stack usually omits Origin. A valid bearer may therefore use
            # the same protected endpoints as the browser; an absent Origin alone never opens them.
            if _bearer(request):
                _session(request)
                return ""
            raise RuntimeError_(
                "bodega_origin_required", "Open your shop in Rocoto at its own address to continue.", 403
            )
        return ""
    if not allowed_origin(origin):
        configured_native = (os.environ.get("BODEGA_NATIVE_ORIGIN") or "").rstrip("/")
        if (
            configured_native
            and hmac.compare_digest(origin.rstrip("/"), configured_native)
            and _bearer(request)
        ):
            _session(request)
            return configured_native
        raise RuntimeError_(
            "bodega_origin_refused", "Open your shop in Rocoto at its own address to continue.", 403
        )
    return origin.rstrip("/")


def _native_origin(request: Request) -> None:
    """Native HTTP commonly omits Origin. When it supplies one, accept only an installed origin.

    This is transport hygiene, never the authorization proof: attempts use PKCE, browser approval
    uses its host-only cookie plus the connection service, and authenticated API calls use bearer
    tokens. An arbitrary web page therefore cannot obtain a special native route by naming itself.
    """
    origin = request.headers.get("origin")
    if origin is None:
        return
    configured = (os.environ.get("BODEGA_NATIVE_ORIGIN") or "").rstrip("/")
    if configured and hmac.compare_digest(origin.rstrip("/"), configured):
        return
    if allowed_origin(origin):
        return
    raise RuntimeError_("bodega_native_origin_refused", "Open Rocoto from its installed app.", 403)


def _mobile_limit(
    db: sqlite3.Connection, buckets: tuple[tuple[str, int, int], ...], now: int
) -> tuple[str, str, int] | None:
    """Atomic fixed-window ceiling for untrusted attempt creation and redemption."""
    for key, seconds, ceiling in buckets:
        period = now // seconds
        row = db.execute("SELECT period, count FROM mobile_limits WHERE key=?", (key,)).fetchone()
        count = int(row["count"]) if row is not None and int(row["period"]) == period else 0
        if count >= ceiling:
            return ("bodega_mobile_rate_limited", "Try this sign-in again in a moment.", 429)
    for key, seconds, _ in buckets:
        period = now // seconds
        db.execute(
            "INSERT INTO mobile_limits(key,period,count,touched_at) VALUES(?,?,1,?) "
            "ON CONFLICT(key) DO UPDATE SET "
            "period=excluded.period, count=CASE WHEN mobile_limits.period=excluded.period "
            "THEN mobile_limits.count+1 ELSE 1 END, touched_at=excluded.touched_at",
            (key, period, now),
        )
    return None


def _caller(request: Request) -> str:
    """A rate-limit key only. It never participates in account identity or session authorization."""
    return request.client.host if request.client else "unknown"


def _page(request: Request) -> str:
    """Where the installed page lives, for the links inside the two messages that carry one."""
    base = _origin(request, required=False) or settings.public_base
    return f"{base}/bodega-pay-later/"


def number(value: str) -> str:
    """One E.164 number, or a named refusal — the rule the referral record and every send share.

    Digits alone, `51` implied for a nine-digit mobile (WIRING-SPEC §5), and an international number
    kept as it arrives. A word, an empty field or a nine-digit number that is not Peru's shape never
    reaches Graph: this service refuses by name rather than sending a message into the dark.
    """
    raw = (value or "").strip()
    digits = "".join(ch for ch in raw if ch.isdigit())
    if not raw.startswith("+") and len(digits) == 9:
        digits = "51" + digits
    candidate = "+" + digits
    if not E164.fullmatch(candidate):
        raise RuntimeError_(
            "bodega_number_unreadable",
            "Send this to a WhatsApp number in international form, such as +51 987 654 321.",
            400,
        )
    return candidate


def _bearer(request: Request) -> str:
    """Read one exact Bearer credential, never a query value or an alternate scheme."""
    authorization = request.headers.get("authorization", "")
    prefix = "Bearer "
    return authorization[len(prefix):] if authorization.startswith(prefix) else ""


def _session(request: Request, *, cookie_only: bool = False) -> tuple[str, str]:
    """The signed-in cookie or native Bearer session: its id and verified phone."""
    token = (
        request.cookies.get(COOKIE, "")
        if cookie_only
        else request.cookies.get(COOKIE, "") or _bearer(request)
    )
    row = None
    if OPAQUE.fullmatch(token):
        with _db() as db:
            _sweep(db)
            row = db.execute(
                "SELECT id, phone FROM sessions WHERE token_hash=? AND expires_at>?",
                (_hash(token), _now()),
            ).fetchone()
    if row is None:
        raise RuntimeError_("bodega_session_required", SIGN_IN_SAYS, 401)
    return str(row["id"]), str(row["phone"])


async def _connected_number(request: Request) -> str:
    """The number the connection service reports for THIS BROWSER's own proof session.

    ═══ WHY A CONNECTION IS A SIGN-IN ═══════════════════════════════════════════════════════════
    `POST /api/proof/whatsapp/verify` is session-bound in two steps. It first requires the browser's
    `__Host-cedar_session`, then accepts a store only where that session's sealed record carries an
    account. Before returning its number it asks Meta for the current subscription and callback for
    that exact stored WABA and phone. A fresh browser's session is unbound, and an externally removed
    connection loses its local proof session. So this call proves both the browser account and its
    provider-owned connection now.

    The cookie is forwarded the way the bridge forwards it — the same name, the same pattern, the same
    provider origin — and the read carries its own short timeout, because this is a network call
    inside a request handler.
    """
    cookie = request.cookies.get(CEDAR_COOKIE, "")
    if not CEDAR_TOKEN.fullmatch(cookie):
        raise RuntimeError_(*CONNECTION_ABSENT)
    # THE BRIDGE'S OWN SWITCH COVERS THIS READ TOO: with `/api/proof/*` switched off, a sign-in that
    # still reached the service behind it would be a second way in that the operator's switch misses.
    if os.environ.get("CEDAR_WHATSAPP_BRIDGE_ENABLED") != "true":
        raise RuntimeError_(*CONNECTION_UNREACHABLE)
    with _db() as db:
        _sweep(db)
        refusal = _ask(db, cookie, _now())
    if refusal:
        raise RuntimeError_(*refusal)
    try:
        async with httpx.AsyncClient(timeout=STATE_READ) as client:
            answer = await client.post(
                f"{UPSTREAM}/api/proof/whatsapp/verify",
                headers={
                    "Accept": "application/json",
                    "Origin": PROVIDER_ORIGIN,
                    "Cookie": f"{CEDAR_COOKIE}={cookie}",
                },
            )
    except httpx.HTTPError:
        raise RuntimeError_(*CONNECTION_UNREACHABLE) from None
    if answer.status_code == 503:
        raise RuntimeError_(*CONNECTION_UNREACHABLE)
    if answer.status_code != 200:
        raise RuntimeError_(*CONNECTION_ABSENT)
    try:
        state = answer.json()
    except ValueError:
        raise RuntimeError_(*CONNECTION_ABSENT) from None
    held = state.get("connection") if isinstance(state, dict) else None
    reported = str(held.get("number") or "") if isinstance(held, dict) else ""
    if not reported:
        raise RuntimeError_(*CONNECTION_ABSENT)
    return _reported_number(reported)


REPORTED = re.compile(r"\+?[\d\s().-]+")


def _reported_number(reported: str) -> str:
    """The connection's own number, read as it stands. `number()` is the rule for a number a PERSON
    types, and it implies Peru's `51` for nine digits; a value a service reports is never reshaped
    that way, because a number this module mutates is a number Rocoto then writes to. Meta reports
    the display number in international form with its `+`; the bare form is taken only at full
    international length (11 to 15 digits), and anything carrying other characters is refused."""
    raw = reported.strip()
    digits = "".join(ch for ch in raw if ch.isdigit())
    whole = raw.startswith("+") or 11 <= len(digits) <= 15
    candidate = "+" + digits
    if not REPORTED.fullmatch(raw) or not whole or not E164.fullmatch(candidate):
        raise RuntimeError_(*CONNECTION_ABSENT)
    return candidate


# ── ROCOTO'S OWN MOUTH · the Graph client, written here ──────────────────────────────────────────

_SENDER: ContextVar[str] = ContextVar("bodega_wa_sender", default="")


def sender_scope(from_id: str):
    """Pin the sending number for this task; reset it in a `finally` (WIRING-SPEC §6).

    One turn leaves one mouth. In this rig the pinned number is always Rocoto's own, and the shape
    is kept so the day a send leaves the shop's own coexistence number it has somewhere to go.
    """
    return _SENDER.set((from_id or "").strip())


def reset_sender(token) -> None:
    try:
        _SENDER.reset(token)
    except ValueError:
        logger.debug("bodega sender reset arrived on another task")


def current_sender() -> str:
    """Rocoto's own phone id — the pinned one, else the configured one, and NEVER a literal here."""
    return _SENDER.get() or settings.wa_cloud_phone_id


def _sandboxed() -> bool:
    """The house's global egress switch, read at the call so a deployment can flip it (ENGINEERING.md)."""
    return (os.environ.get("ROCOTO_EGRESS_SANDBOX") or "").strip().lower() in ("1", "true", "yes", "on")


async def _post_messages(payload: dict) -> str:
    """POST to `/{phone_id}/messages`; return the `wamid`. Every failure is named and nothing is invented."""
    if _sandboxed():
        logger.info(
            "bodega whatsapp suppressed", extra={"provider": "whatsapp-cloud", "outcome": "egress_sandbox"}
        )
        return SANDBOX_WAMID
    token, sender = settings.wa_cloud_token, current_sender()
    if not (token and sender):
        raise RuntimeError_(
            "bodega_whatsapp_unconfigured",
            "Rocoto's own WhatsApp number is awaiting its token, so this message stays unsent.",
            503,
        )
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{GRAPH}/{sender}/messages",
                headers={"Authorization": f"Bearer {token}", "User-Agent": _UA},
                json=payload,
            )
    except httpx.HTTPError:
        raise RuntimeError_(
            "bodega_whatsapp_unreachable", "WhatsApp is reconnecting. Send this again in a moment.", 503
        ) from None
    if response.status_code >= 400:
        raise RuntimeError_(
            "bodega_whatsapp_refused",
            f"Rocoto's WhatsApp number answered {response.status_code} to this message.",
            502,
        )
    try:
        data = response.json()
    except ValueError:
        raise RuntimeError_(
            "bodega_whatsapp_unreadable", "Rocoto's WhatsApp number answered in a shape this rig reads.", 502
        ) from None
    messages = data.get("messages") if isinstance(data, dict) else None
    first = messages[0] if isinstance(messages, list) and messages and isinstance(messages[0], dict) else {}
    wamid = str(first.get("id") or "")
    if not wamid:
        # An id we made up is a silent success: the delivery webhook keys on the wamid, so a
        # fabricated one could never be corrected later (backend/whatsapp_cloud.py, 2026-07-26).
        raise RuntimeError_(
            "bodega_whatsapp_no_wamid",
            "Rocoto's WhatsApp number accepted the message without naming it, so this send stays unproven.",
            502,
        )
    return wamid


async def send_text(to: str, text: str) -> str:
    """A free-form service message, inside the window the shop opened by writing first."""
    return await _post_messages({
        "messaging_product": "whatsapp", "recipient_type": "individual",
        "to": to.lstrip("+"), "type": "text",
        "text": {"preview_url": True, "body": text},
    })


async def send_template(
    to: str, name: str, variables: list[str], language: str = "es", button: str = ""
) -> str:
    """The same send on an approved template — MESSAGES.md §5's set, the day Meta clears it.

    The buddy's five-minute hello rides this rail, because a shop that wrote nothing opened no
    window; the rest of the rig's messages still travel free-form inside a window the shop opened.
    `button` is the value of a URL button's own variable, numbered inside its own component, which
    is the shape `waitlist_hello` and `payment_request` both carry.
    """
    components: list[dict] = (
        [{"type": "body", "parameters": [{"type": "text", "text": value} for value in variables]}]
        if variables else []
    )
    if button:
        components.append({
            "type": "button", "sub_type": "url", "index": "0",
            "parameters": [{"type": "text", "text": button}],
        })
    return await _post_messages({
        "messaging_product": "whatsapp", "recipient_type": "individual",
        "to": to.lstrip("+"), "type": "template",
        "template": {"name": name, "language": {"code": language}, "components": components},
    })


# ── the answers ──────────────────────────────────────────────────────────────────────────────────

def _json(payload: dict, status: int = 200) -> JSONResponse:
    return JSONResponse(
        payload, status_code=status,
        headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"},
    )


def _ensure_contact(db: sqlite3.Connection, phone: str, now: int) -> sqlite3.Row:
    """This number's own waitlist row — minted once after signed inbound or Meta proof.

    Every later call is a plain read: the place, the referral code and everything else a business
    fills in afterwards live here for the life of the number, the same way its session does.
    """
    row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
    if row is not None:
        return row
    place = WAITLIST_BASE + db.execute("SELECT COUNT(*) AS n FROM businesses").fetchone()["n"]
    for _ in range(20):
        code = "".join(secrets.choice(REFERRAL_ALPHABET) for _ in range(REFERRAL_CODE_LENGTH))
        try:
            db.execute(
                "INSERT INTO businesses(phone,place,referral_code,created_at) VALUES(?,?,?,?)",
                (phone, place, code, now),
            )
            break
        except sqlite3.IntegrityError:
            continue
    else:
        raise RuntimeError("the bodega rig could not mint a referral code")
    return db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()


_ensure_business = _ensure_contact  # compatibility for existing browser connection call sites


def _contact(phone: str) -> sqlite3.Row:
    """Read an existing waitlist identity without letting a typed phone create one."""
    with _db() as db:
        _sweep(db)
        row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
    if row is None:
        raise RuntimeError_(
            "bodega_waitlist_contact_required",
            "Join the Rocoto waitlist from WhatsApp to continue.",
            409,
        )
    return row


def _business(phone: str) -> sqlite3.Row:
    return _contact(phone)


def _connected_business(phone: str) -> sqlite3.Row:
    """Membership data starts with the verified Meta connection."""
    with _db() as db:
        _sweep(db)
        row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
    if row is None or not int(row["connection_verified_at"]):
        raise RuntimeError_(
            "bodega_connection_required", "Connect WhatsApp Business to continue to your waitlist.", 409
        )
    return row


def _existing_session(request: Request) -> tuple[str, str]:
    """A phone-verified session. Handlers add the Meta capability where they need it."""
    return _session(request)


def _connected_session(request: Request) -> tuple[str, str]:
    session_id, phone = _existing_session(request)
    _connected_business(phone)
    return session_id, phone


def _referral_url_from_page(page: str, code: str) -> str:
    return f"{page}#/r/{code}"


def _referral_url(request: Request, code: str) -> str:
    return _referral_url_from_page(_page(request), code)


def _marketing_referral_url(row: sqlite3.Row) -> str:
    path = "en/" if _language(row) == "en" else ""
    origin = os.environ.get('SHOP_MARKETING_ORIGIN', 'https://shop.example.invalid').rstrip('/')
    return f"{origin}/{path}?ref={row['referral_code']}"


def _status_url_from_page(page: str, code: str) -> str:
    """THE LINK THE BUDDY SENDS FIRST: the page's own address carrying this business's code.

    A query rather than a fragment, because a fragment never leaves the browser — and this link
    arrives in WhatsApp, where the shop's own preview and its taps read the URL as it stands. The
    page takes `?lista=` on load and shows the place, and the referral link keeps `#/r/`.
    """
    return f"{page}?lista={code}"


def _status_url(request: Request, code: str) -> str:
    return _status_url_from_page(_page(request), code)


def _language(row: sqlite3.Row) -> str:
    """This business's own language, and Spanish wherever a row says anything else."""
    held = str(row["language"] or "")
    return held if held in LANGUAGES else DEFAULT_LANGUAGE


def _covered(attributed: int) -> int:
    return attributed // REFERRALS_PER_COVERED_PURCHASE


def _waitlist_view(request: Request, row: sqlite3.Row) -> dict:
    return {
        "place": int(row["place"]),
        "ahead": max(0, int(row["place"]) - 1),
        "referralCode": str(row["referral_code"]),
        "referralUrl": _marketing_referral_url(row),
        "statusUrl": _status_url(request, str(row["referral_code"])),
        "joined": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(int(row["created_at"]))),
        "coveredPurchases": int(row["covered_purchases"]),
        "joinedThroughYou": int(row["attributed_count"]),
        "language": _language(row),
        "onboarded": bool(row["onboarded_at"]),
    }


def peru_mobile(value: str) -> str:
    """A Peruvian mobile in E.164 — the same `51`-implied reading `number()` gives a typed number,
    then the mobile gate: Peru's national mobile numbers are nine digits starting with `9`."""
    candidate = number(value)
    if not PERU_MOBILE.fullmatch(candidate):
        raise RuntimeError_(
            "bodega_yape_number_unreadable",
            "Send this to a Peruvian mobile number, such as +51 987 654 321.",
            400,
        )
    return candidate


def _invited(session_id: str) -> list[dict]:
    with _db() as db:
        rows = db.execute(
            "SELECT name, phone FROM referrals WHERE session_id=? ORDER BY phone",
            (session_id,),
        ).fetchall()
    return [{"name": str(row["name"]), "phone": str(row["phone"])} for row in rows]


def _display_name(row: sqlite3.Row, offered: str = "") -> str:
    """The name this business gave on screen 4, and the one the page offers where the row is bare.

    Peter's rule, kept: a sentence that states a name is refused without one rather than sent half
    written. So this raises the same named 400 the closing message raises, and the buddy's own
    paths journal it and stay quiet.
    """
    name = str(row["name"]).strip() or offered.strip()
    if not name:
        raise RuntimeError_("bodega_notice_needs_name", "Send the name this message states.", 400)
    return name


def _status_text(row: sqlite3.Row, page: str, offered: str = "") -> str:
    """The first thing the buddy says: who it is, this business's place, and the page that holds it."""
    return STATUS_MESSAGE[_language(row)].format(
        name=_display_name(row, offered),
        place=f"{int(row['place']):,}",
        status_url=_status_url_from_page(page, str(row["referral_code"])),
    )


def _forwardable_text(row: sqlite3.Row) -> str:
    """The message the shop forwards, which travels alone so one long press takes the whole of it."""
    return FORWARDABLE_MESSAGE[_language(row)].format(
        referral_url=_referral_url_from_page(_installed_page(), str(row["referral_code"])),
    )


def _installed_page() -> str:
    """Where the page lives for a message that leaves outside a request — the webhook and the loop.

    A browser's `Origin` is what `_page` reads, and neither of those has one, so the service's own
    configured base is the address. It is the same published origin the walk runs on.
    """
    return f"{settings.public_base.rstrip('/')}/bodega-pay-later/"


def _notice_text(body: Notice, page: str, waitlist: sqlite3.Row | None) -> str:
    """MESSAGES.md's own sentence for this kind, and no other: every word Rocoto's number says is a
    row of that file (`waitlist` is new 20 September and awaits that file's own row — the docstring
    above `WAITLIST_MESSAGE` says so). The request names the kind, a name and a count; it never
    carries a sentence of its own (`Notice` forbids the field), so a signed-in page cannot put words
    in Rocoto's mouth.

    A row that states a name, a count or a place is refused without it rather than sent
    half-written: Peter's lines ship whole.
    """
    if body.kind == "waitlist":
        # The buddy states this session's own place — never the request's, so a signed-in page
        # cannot claim a place that is not its own. Since 20 September this row IS the status
        # message, which is also the first thing the buddy says on WhatsApp.
        if waitlist is None:
            raise RuntimeError_("bodega_notice_needs_count", "Join the waitlist before asking for it.", 400)
        return _status_text(waitlist, page, body.name.strip())
    name = body.name.strip()
    if not name:
        raise RuntimeError_("bodega_notice_needs_name", "Send the name this message states.", 400)
    if body.kind == "closing":
        return CLOSING_MESSAGE.format(name=name, page=page)
    if body.count < 1:
        raise RuntimeError_(
            "bodega_notice_needs_count", "Send how many suppliers this shop has on Rocoto.", 400
        )
    return SUPPLIER_CONNECTED_MESSAGE.format(name=name, count=body.count)


@router.post("/session/connection")
async def open_from_connection(body: Empty, request: Request) -> JSONResponse:
    """THE WHATSAPP CONNECTION IS THE SIGN-IN (WIRING-SPEC.md §1).

    The browser asks this once, after Meta's own walk reports an account. The service answers the
    connection for THIS browser's proof session alone (`_connected_number`), so the answer is the
    shop's own evidence, and the number it reports becomes the host-only cookie's own number: Secure,
    HttpOnly, `Path=/`, SameSite Strict, no `Domain`. Every other case is a named refusal.
    """
    _origin(request, required=True)
    phone = await _connected_number(request)
    token, session_id, now = secrets.token_urlsafe(48), secrets.token_hex(16), _now()
    with _db() as db:
        _sweep(db)
        db.execute(
            "INSERT INTO sessions(id,token_hash,phone,created_at,expires_at) VALUES(?,?,?,?,?)",
            (session_id, _hash(token), phone, now, now + SESSION_TTL),
        )
        # A FEW BROWSERS TO A NUMBER, THE NEWEST KEPT: a second phone signs in beside the first, and
        # a loop on this route stops growing the table at the sixth row.
        db.execute(
            "DELETE FROM sessions WHERE phone=? AND id NOT IN ("
            "SELECT id FROM sessions WHERE phone=? ORDER BY created_at DESC, rowid DESC LIMIT ?)",
            (phone, phone, SESSIONS_PER_NUMBER),
        )
        # SCREEN 3, THE MOMENT WHATSAPP CONNECTS: this number's waitlist place is minted here, once,
        # the first time this shop ever connects — every later connection is the same row.
        _ensure_business(db, phone, now)
        # A session is evidence only for this browser; this timestamp records that this business's
        # Meta connection was verified.
        db.execute("UPDATE businesses SET connection_verified_at=? WHERE phone=?", (now, phone))
    logger.info("bodega signed in", extra={"kind": "session", "outcome": "connection"})
    response = _json({"signedIn": True, "phone": phone})
    response.set_cookie(
        COOKIE, token, max_age=SESSION_TTL, path="/", secure=True, httponly=True, samesite="strict"
    )
    return response


@router.get("/session")
async def read_session(request: Request) -> JSONResponse:
    """What the arrival screen renders from when browser storage throws: the cookie and this service.

    An addition to WIRING-SPEC §1's four paths, and the reason is in that section's own «Survives»
    row — a page that can only learn its number from `localStorage` has no answer when storage
    throws. Signed out is an answer here, never a refusal: the arrival screen renders from it.
    """
    _origin(request, required=False)
    try:
        _, phone = _session(request)
    except RuntimeError_:
        # Browser arrival is a normal signed-out state. A presented bearer is different: the app
        # must clear its stored credential rather than preserving an expired one indefinitely.
        return _json(
            {"signedIn": False, "phone": "", "connection": False, "onboarded": False},
            401 if _bearer(request) else 200,
        )
    with _db() as db:
        _sweep(db)
        business = db.execute(
            "SELECT connection_verified_at, onboarded_at FROM businesses WHERE phone=?", (phone,)
        ).fetchone()
    return _json({
        "signedIn": True,
        "phone": phone,
        "connection": bool(business and business["connection_verified_at"]),
        "onboarded": bool(business and business["onboarded_at"]),
    })


def _mint_native_session(phone: str, now: int) -> tuple[str, int]:
    """One bearer credential for a verified phone; its durable lifetime equals browser sessions."""
    token, session_id = secrets.token_urlsafe(48), secrets.token_hex(16)
    expires_at = now + SESSION_TTL
    with _db() as db:
        _sweep(db)
        db.execute(
            "INSERT INTO sessions(id,token_hash,phone,created_at,expires_at) VALUES(?,?,?,?,?)",
            (session_id, _hash(token), phone, now, expires_at),
        )
        db.execute(
            "DELETE FROM sessions WHERE phone=? AND id NOT IN ("
            "SELECT id FROM sessions WHERE phone=? ORDER BY created_at DESC, rowid DESC LIMIT ?)",
            (phone, phone, SESSIONS_PER_NUMBER),
        )
    return token, expires_at


def _mobile_attempt_view(attempt: str, expires_at: int, status: str = "pending") -> dict:
    return {"attempt": attempt, "expiresAt": expires_at, "status": status}


def _consume_mobile_handoff(
    db: sqlite3.Connection, row: sqlite3.Row, attempt: str, session_id: str, now: int
) -> bool:
    """Consume exactly the authorization record that was verified, once."""
    consumed = db.execute(
        "UPDATE mobile_handoffs SET redeemed_at=?,session_id=? WHERE id=? AND expires_at>? "
        "AND cancelled_at=0 AND redeemed_at=0 AND approved_at=? AND approved_phone=? "
        "AND challenge_hash=? AND grant_hash=?",
        (
            now,
            session_id,
            attempt,
            now,
            int(row["approved_at"]),
            str(row["approved_phone"]),
            str(row["challenge_hash"]),
            str(row["grant_hash"]),
        ),
    )
    return consumed.rowcount == 1


def _mobile_session_token(attempt: str, verifier: str, code: str) -> str:
    """Retry-safe token from two app-held high-entropy proofs; the database retains their hashes."""
    material = f"meta-session\0{attempt}\0{verifier}\0{code}".encode()
    return base64.urlsafe_b64encode(hashlib.sha256(material).digest()).rstrip(b"=").decode()


def _recovered_mobile_session(
    db: sqlite3.Connection,
    row: sqlite3.Row,
    attempt: str,
    verifier: str,
    code: str,
    now: int,
) -> tuple[str, int] | None:
    if not int(row["redeemed_at"] or 0) or not str(row["session_id"] or ""):
        return None
    if not (
        hmac.compare_digest(str(row["challenge_hash"]), _hash(_pkce_challenge(verifier)))
        and hmac.compare_digest(str(row["grant_hash"]), _hash(code))
    ):
        return None
    token = _mobile_session_token(attempt, verifier, code)
    session = db.execute(
        "SELECT expires_at FROM sessions WHERE id=? AND phone=? AND token_hash=? AND expires_at>?",
        (str(row["session_id"]), str(row["approved_phone"]), _hash(token), now),
    ).fetchone()
    return (token, int(session["expires_at"])) if session is not None else None


@router.post("/mobile/session/start")
async def start_mobile_session(body: MobileSessionStart, request: Request) -> JSONResponse:
    """Start PKCE; a presented phone bearer binds the attempt, while legacy Meta-first stays valid."""
    _native_origin(request)
    expected_phone = ""
    if _bearer(request):
        _, expected_phone = _session(request)
        _contact(expected_phone)
    now = _now()
    caller = _hash(_caller(request))
    with _db() as db:
        _sweep(db)
        refusal = _mobile_limit(db, ((f"handoff-start:{caller}", 60, 10), ("handoff-start:*", 60, 200)), now)
        if refusal:
            raise RuntimeError_(*refusal)
        attempt = secrets.token_urlsafe(32)
        expires_at = now + MOBILE_ATTEMPT_TTL
        db.execute(
            "INSERT INTO mobile_handoffs(id,challenge_hash,expected_phone,created_at,expires_at) "
            "VALUES(?,?,?,?,?)",
            (attempt, _hash(body.challenge), expected_phone, now, expires_at),
        )
    return _json(_mobile_attempt_view(attempt, expires_at), 201)


@router.post("/mobile/session/approve")
async def approve_mobile_session(body: MobileSessionApprove, request: Request) -> JSONResponse:
    """The browser's explicit approval, after its cookie and current Meta proof agree on one phone."""
    _origin(request, required=True)
    _, cookie_phone = _session(request, cookie_only=True)
    connected_phone = await _connected_number(request)
    if not hmac.compare_digest(cookie_phone, connected_phone):
        raise RuntimeError_(
            "bodega_mobile_connection_changed", "Open the account connected to this Rocoto session.", 409
        )
    now = _now()
    with _db() as db:
        _sweep(db)
        row = db.execute("SELECT * FROM mobile_handoffs WHERE id=?", (body.attempt,)).fetchone()
        if (
            row is None
            or int(row["expires_at"]) <= now
            or int(row["cancelled_at"])
            or int(row["redeemed_at"])
        ):
            raise RuntimeError_("bodega_mobile_attempt_unavailable", "Start the secure sign-in again.", 409)
        expected = str(row["expected_phone"])
        if expected and not hmac.compare_digest(expected, connected_phone):
            raise RuntimeError_(
                "bodega_mobile_phone_mismatch", "Open the same verified phone in WhatsApp Business.", 409
            )
        # This is an authorization code, separate from PKCE. It travels only in the fixed native
        # callback after this browser's explicit approval; the database retains its digest.
        grant = secrets.token_urlsafe(32)
        approved = db.execute(
            "UPDATE mobile_handoffs SET approved_phone=?, approved_at=?, grant_hash=?, "
            "redeem_attempts=0 WHERE id=? AND expires_at>? AND cancelled_at=0 AND redeemed_at=0",
            (connected_phone, now, _hash(grant), body.attempt, now),
        )
        if approved.rowcount != 1:
            raise RuntimeError_("bodega_mobile_attempt_unavailable", "Start the secure sign-in again.", 409)
        _ensure_business(db, connected_phone, now)
        db.execute("UPDATE businesses SET connection_verified_at=? WHERE phone=?", (now, connected_phone))
    return _json({**_mobile_attempt_view(body.attempt, int(row["expires_at"]), "approved"), "code": grant})


@router.post("/mobile/session/status")
async def mobile_session_status(body: MobileSessionStatus, request: Request) -> JSONResponse:
    """Recover a lost app link using the already verified phone and this attempt's PKCE proof.

    This observes explicit browser approval; it grants no new identity or bearer. Anonymous
    Meta-first attempts still need the callback code, so a handoff link cannot become a login trap.
    """
    _native_origin(request)
    if not _bearer(request):
        raise RuntimeError_("bodega_session_required", "Sign in to continue this connection.", 401)
    _, phone = _session(request)
    now = _now()
    with _db() as db:
        _sweep(db)
        row = db.execute("SELECT * FROM mobile_handoffs WHERE id=?", (body.attempt,)).fetchone()
        if (row is None or int(row["expires_at"]) <= now or int(row["cancelled_at"])
            or not str(row["expected_phone"])
            or not hmac.compare_digest(str(row["expected_phone"]), phone)):
            raise RuntimeError_(
                "bodega_mobile_attempt_unavailable", "Continue from this app's connection.", 409
            )
        if not hmac.compare_digest(str(row["challenge_hash"]), _hash(_pkce_challenge(body.verifier))):
            raise RuntimeError_("bodega_mobile_verifier_refused", "Continue from this app's connection.", 401)
        approved = bool(row["approved_at"]) and hmac.compare_digest(str(row["approved_phone"]), phone)
        return _json(_mobile_attempt_view(
            body.attempt, int(row["expires_at"]), "approved" if approved else "pending"
        ))


@router.post("/mobile/session/redeem")
async def redeem_mobile_session(body: MobileSessionRedeem, request: Request) -> JSONResponse:
    """Exchange a browser-approved callback code and PKCE verifier once; neither is logged."""
    _native_origin(request)
    now = _now()
    caller = _hash(_caller(request))
    with _db() as db:
        _sweep(db)
        row = db.execute("SELECT * FROM mobile_handoffs WHERE id=?", (body.attempt,)).fetchone()
        if (
            row is None
            or int(row["expires_at"]) <= now
            or int(row["cancelled_at"])
        ):
            raise RuntimeError_("bodega_mobile_attempt_unavailable", "Start the secure sign-in again.", 409)
        if not row["approved_at"] or not row["approved_phone"]:
            raise RuntimeError_("bodega_mobile_pending", "Finish approval in WhatsApp Business.", 409)
        verified = (
            hmac.compare_digest(str(row["challenge_hash"]), _hash(_pkce_challenge(body.verifier)))
            and bool(row["grant_hash"])
            and hmac.compare_digest(str(row["grant_hash"]), _hash(body.code))
        )
        if int(row["redeemed_at"]):
            recovered = _recovered_mobile_session(
                db, row, body.attempt, body.verifier, body.code, now
            )
            if not verified or recovered is None:
                raise RuntimeError_(
                    "bodega_mobile_attempt_unavailable", "Start the secure sign-in again.", 409
                )
            return _json({
                "token": recovered[0],
                "expiresAt": recovered[1],
                "session": {
                    "signedIn": True,
                    "phone": str(row["approved_phone"]),
                    "connection": True,
                },
            })
        refusal = _mobile_limit(
            db, ((f"handoff-redeem:{caller}", 60, 20), ("handoff-redeem:*", 60, 300)), now
        )
        if refusal:
            raise RuntimeError_(*refusal)
        if not verified:
            tries = int(row["redeem_attempts"]) + 1
            recorded = db.execute(
                "UPDATE mobile_handoffs SET redeem_attempts=?, "
                "cancelled_at=CASE WHEN ?>=? THEN ? ELSE cancelled_at END WHERE id=? "
                "AND expires_at>? AND cancelled_at=0 AND redeemed_at=0 AND approved_at=? "
                "AND approved_phone=? AND challenge_hash=? AND grant_hash=?",
                (
                    tries,
                    tries,
                    MOBILE_REDEEM_TRIES,
                    now,
                    body.attempt,
                    now,
                    int(row["approved_at"]),
                    str(row["approved_phone"]),
                    str(row["challenge_hash"]),
                    str(row["grant_hash"]),
                ),
            )
            if recorded.rowcount != 1:
                raise RuntimeError_(
                    "bodega_mobile_attempt_unavailable", "Start the secure sign-in again.", 409
                )
            raise RuntimeError_(
                "bodega_mobile_verifier_refused", "Continue with the secure sign-in from this app.", 401
            )
        phone = str(row["approved_phone"])
        token = _mobile_session_token(body.attempt, body.verifier, body.code)
        session_id = secrets.token_hex(16)
        expires_at = now + SESSION_TTL
        if not _consume_mobile_handoff(db, row, body.attempt, session_id, now):
            current = db.execute(
                "SELECT * FROM mobile_handoffs WHERE id=?", (body.attempt,)
            ).fetchone()
            recovered = (
                _recovered_mobile_session(
                    db, current, body.attempt, body.verifier, body.code, now
                )
                if current is not None
                else None
            )
            if recovered is not None:
                return _json({
                    "token": recovered[0],
                    "expiresAt": recovered[1],
                    "session": {"signedIn": True, "phone": phone, "connection": True},
                })
            raise RuntimeError_("bodega_mobile_attempt_unavailable", "Start the secure sign-in again.", 409)
        db.execute(
            "INSERT INTO sessions(id,token_hash,phone,created_at,expires_at) VALUES(?,?,?,?,?)",
            (session_id, _hash(token), phone, now, expires_at),
        )
        db.execute(
            "DELETE FROM sessions WHERE phone=? AND id NOT IN ("
            "SELECT id FROM sessions WHERE phone=? ORDER BY created_at DESC, rowid DESC LIMIT ?)",
            (phone, phone, SESSIONS_PER_NUMBER),
        )
    return _json({
        "token": token,
        "expiresAt": expires_at,
        "session": {"signedIn": True, "phone": phone, "connection": True},
    })


@router.post("/mobile/session/cancel")
async def cancel_mobile_session(body: MobileCancel, request: Request) -> JSONResponse:
    """A pending opaque attempt may be cancelled safely; it cannot mint a session afterwards."""
    _native_origin(request)
    now = _now()
    with _db() as db:
        _sweep(db)
        db.execute(
            "UPDATE mobile_handoffs SET cancelled_at=? WHERE id=? AND redeemed_at=0",
            (now, body.attempt),
        )
    return _json({"cancelled": True})


@router.post("/mobile/session/logout", status_code=204)
async def logout_mobile_session(request: Request) -> Response:
    """Revoke the presented native bearer. Browser logout stays on its existing reset control."""
    _native_origin(request)
    token = _bearer(request)
    if OPAQUE.fullmatch(token):
        with _db() as db:
            db.execute("DELETE FROM sessions WHERE token_hash=?", (_hash(token),))
    return Response(status_code=204, headers={"Cache-Control": "no-store"})


@router.get("/mobile/testing")
async def read_tester_request(request: Request) -> JSONResponse:
    from . import bodega_testing

    _native_origin(request)
    _, phone = _existing_session(request)
    with _db() as db:
        row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
        if row is None:
            raise RuntimeError_(
                "bodega_waitlist_contact_required",
                "Join the Rocoto waitlist from WhatsApp to continue.",
                409,
            )
        view = bodega_testing.testing_view(db, row)
    return _json(view)


@router.post("/mobile/testing")
async def save_tester_request(body: TesterRequest, request: Request) -> JSONResponse:
    """Record the Play-account email; enrollment and its URL require later provider proof."""
    from . import bodega_testing

    _native_origin(request)
    _, phone = _existing_session(request)
    with _db() as db:
        bodega_testing.record_request(db, phone, body.email)
    return _json(await bodega_testing.enroll(phone))


@router.post("/session/reset")
async def reset(body: Empty, request: Request) -> JSONResponse:
    """`Reset state`'s server half: this session and its referral rows, gone.

    IT ANSWERS 200 WITH THE COOKIE OR WITHOUT IT, and `cleared` says which — the rig's one control
    stands on the first screen, where a shop has yet to sign in, so a refusal there would be the
    control failing at the one moment it is most used.
    """
    _origin(request, required=True)
    token = request.cookies.get(COOKIE, "")
    with _db() as db:
        row = (
            db.execute(
                "SELECT id FROM sessions WHERE token_hash=?", (_hash(token),)
            ).fetchone()
            if OPAQUE.fullmatch(token) else None
        )
        if row is not None:
            db.execute("DELETE FROM referrals WHERE session_id=?", (row["id"],))
            db.execute("DELETE FROM sessions WHERE id=?", (row["id"],))
        _sweep(db)
    logger.info(
        "bodega state cleared",
        extra={"kind": "session", "outcome": "cleared" if row is not None else "nothing_held"},
    )
    response = _json({"cleared": row is not None})
    response.delete_cookie(COOKIE, path="/", secure=True, httponly=True, samesite="strict")
    return response


@router.post("/referrals")
async def record_referrals(body: Referrals, request: Request) -> JSONResponse:
    """The invitations this shop sent, normalised to E.164 and kept with its session."""
    _origin(request, required=True)
    session_id, _ = _connected_session(request)
    now = _now()
    rows = [(session_id, number(entry.phone), entry.name.strip(), now) for entry in body.invited]
    if rows:
        with _db() as db:
            db.executemany(
                "INSERT INTO referrals(session_id,phone,name,created_at) VALUES(?,?,?,?) "
                "ON CONFLICT(session_id,phone) DO UPDATE SET name=excluded.name",
                rows,
            )
    return _json({"invited": _invited(session_id)})


@router.get("/referrals")
async def read_referrals(request: Request) -> JSONResponse:
    """`Suppliers you brought`, from the service rather than the browser, so a second phone shows it."""
    _origin(request, required=False)
    session_id, _ = _connected_session(request)
    return _json({"invited": _invited(session_id)})


@router.post("/notify")
async def notify(body: Notice, request: Request) -> JSONResponse:
    """MESSAGES.md rows 7 and 8, free-form from Rocoto's own number to THE CONNECTED one.

    THE DESTINATION IS THE SESSION'S OWN NUMBER, which the connection service reported when the
    session was minted. The request names no number, so there is nothing for a caller to steer: the
    only shop Rocoto's mouth can reach through this path is the shop holding the cookie.
    """
    _origin(request, required=True)
    _, to = _connected_session(request)
    waitlist = _business(to) if body.kind == "waitlist" else None
    text = _notice_text(body, _page(request), waitlist)
    now = _now()
    # The cookie in front of this path names who may ask AND who the message reaches; the ceiling
    # bounds how much one signed-in shop may say from Rocoto's mouth to that number in a day.
    with _db() as db:
        refusal = _spend(db, to, now)
    if refusal:
        raise RuntimeError_(*refusal)
    try:
        wamid = await send_text(to, text)
    except RuntimeError_:
        _refund(to, now)
        raise
    logger.info(
        "bodega notice sent", extra={"provider": "whatsapp-cloud", "kind": body.kind, "outcome": wamid}
    )
    return _json({"sent": True, "kind": body.kind, "to": to, "wamid": wamid})


# ── §1/§2 · THE WAITLIST AND THE REFERRAL — ONBOARDING-SPEC.md §0, screens 3 and 9 ───────────────

@router.get("/waitlist")
async def read_waitlist(request: Request) -> JSONResponse:
    """Screen 3's own numbers, and screen 9's: never the page's arithmetic, always the API's."""
    _origin(request, required=False)
    _, phone = _existing_session(request)
    return _json(_waitlist_view(request, _contact(phone)))


@router.post("/onboarded")
async def mark_onboarded(body: Empty, request: Request) -> JSONResponse:
    """THE WALK IS FINISHED, and the five-minute clock starts here (ONBOARDING-SPEC §0, «done»).

    The page calls it once, on the last screen. It is idempotent — a second call keeps the first
    moment, so a reload never restarts the clock — and the body names nothing, because the only
    business this can finish is the one holding the cookie.
    """
    _origin(request, required=True)
    _, phone = _connected_session(request)
    now = _now()
    with _db() as db:
        _sweep(db)
        row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
        if row is None or not int(row["connection_verified_at"]):
            raise RuntimeError_(
                "bodega_connection_required", "Connect WhatsApp Business to continue to your waitlist.", 409
            )
        if not (
            str(row["kind"]) in {
                "bodega", "supplier", "restaurant", "sells_to_bodegas", "sells_to_restaurants"
            }
            and str(row["name"]).strip()
            and str(row["address_place_id"])
            and row["address_lat"] is not None
            and row["address_lng"] is not None
        ):
            raise RuntimeError_(
                "bodega_business_required", "Add your business and address before finishing onboarding.", 409
            )
        if not int(row["onboarded_at"] or 0):
            db.execute("UPDATE businesses SET onboarded_at=? WHERE phone=?", (now, phone))
    logger.info("bodega walk finished", extra={"kind": "onboarded", "outcome": "recorded"})
    return _json({"onboarded": True})


# ── §7 · THE STATUS PAGE — the link the buddy sends first ────────────────────────────────────────
# `?lista=<CODE>` is opened by whoever holds the link, so this read carries NO PHONE AND NO ADDRESS:
# a business's public face is its name, its trade, its place and the businesses that joined through
# it. The ceiling is the `asks` table's, under its own key, so a public path cannot spend the
# connection service's few reads a minute or the address search's.
STATUS_ASKS_PER_CALLER = 30
STATUS_ASKS_IN_ALL = 600
STATUS_RECENT = ("bodega_status_recent", "Open your place again in a moment.", 429)


def _status_ask(db: sqlite3.Connection, caller: str, now: int) -> tuple[str, str, int] | None:
    minute = now // ASK_WINDOW
    buckets = ((f"lista:{_hash(caller)}", STATUS_ASKS_PER_CALLER), ("lista:*", STATUS_ASKS_IN_ALL))
    for key, ceiling in buckets:
        row = db.execute("SELECT minute, count FROM asks WHERE key=?", (key,)).fetchone()
        asked = int(row["count"]) if row is not None and int(row["minute"]) == minute else 0
        if asked >= ceiling:
            return STATUS_RECENT
    for key, _ in buckets:
        db.execute(
            "INSERT INTO asks(key,minute,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET "
            "minute=excluded.minute, "
            "count=CASE WHEN asks.minute=excluded.minute THEN asks.count+1 ELSE 1 END",
            (key, minute),
        )
    return None


@router.get("/status/{code}")
async def read_status(code: str, request: Request) -> JSONResponse:
    """The place, and who joined through this business — read by its code alone, with no session.

    The buddy sends this link as its first message and the shop keeps it, so it answers a browser
    that holds nothing: a phone that reinstalled, a second phone, the shop's partner. A code
    nobody holds answers 404 by name, the way the payment page's own public read does.
    """
    _origin(request, required=False)
    caller = request.client.host if request.client else "unknown"
    with _db() as db:
        _sweep(db)
        refusal = _status_ask(db, caller, _now())
        row = (
            db.execute("SELECT * FROM businesses WHERE referral_code=?", (code.strip().upper(),))
            .fetchone()
            if refusal is None else None
        )
    if refusal:
        raise RuntimeError_(*refusal)
    if row is None:
        raise RuntimeError_("bodega_status_unknown", "This waitlist link is no longer live.", 404)
    joined = int(row["attributed_count"])
    return _json({
        "name": str(row["name"]),
        # A BUSINESS THAT WROTE NO DETAILS YET ANSWERS `null` RATHER THAN AN EMPTY WORD: the page
        # types this field as one of the three trades or nothing (`start/joining.ts`), and a blank
        # string is neither.
        "kind": str(row["kind"]) or None,
        "place": int(row["place"]),
        "ahead": max(0, int(row["place"]) - 1),
        "joined": joined,
        "covered": _covered(joined),
        "referral_url": _marketing_referral_url(row),
        "language": _language(row),
    })


def _attribute_referral(db: sqlite3.Connection, phone: str, code: str) -> bool:
    """Attach an invitee once. The code never replaces the signed sender's identity."""
    mine = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
    if mine is None:
        return False
    if mine["referred_by"]:
        return True
    clean = code.strip().upper()
    if not REFERRAL_CODE.fullmatch(clean):
        return False
    referrer = db.execute("SELECT * FROM businesses WHERE referral_code=?", (clean,)).fetchone()
    if referrer is None or str(referrer["phone"]) == phone:
        return False
    attached = db.execute(
        "UPDATE businesses SET referred_by=? WHERE phone=? AND referred_by=''",
        (referrer["phone"], phone),
    )
    if attached.rowcount != 1:
        return True
    attributed = int(referrer["attributed_count"]) + 1
    covers = int(referrer["covered_purchases"]) + int(
        attributed % REFERRALS_PER_COVERED_PURCHASE == 0
    )
    db.execute(
        "UPDATE businesses SET attributed_count=?, covered_purchases=?, place=? WHERE phone=?",
        (attributed, covers, max(1, int(referrer["place"]) - WAITLIST_MOVE_UP), referrer["phone"]),
    )
    return True


@router.post("/referral/attribute")
async def attribute_referral(body: ReferralAttribution, request: Request) -> JSONResponse:
    """Legacy browser attribution, retained after the connected profile is complete."""
    _origin(request, required=True)
    _, phone = _connected_session(request)
    with _db() as db:
        _sweep(db)
        attributed = _attribute_referral(db, phone, body.code)
    if attributed:
        logger.info("bodega referral attributed", extra={"kind": "referral", "outcome": "attributed"})
    return _json({"attributed": attributed})


# ── §4 · THE BUSINESS — ONBOARDING-SPEC.md §0, screen 4 ──────────────────────────────────────────

def _business_view(row: sqlite3.Row) -> dict:
    address = None
    if row["address_place_id"]:
        address = {
            "text": str(row["address_text"]),
            "placeId": str(row["address_place_id"]),
            "lat": float(row["address_lat"]),
            "lng": float(row["address_lng"]),
        }
    return {
        "personName": str(row["person_name"]),
        "kind": str(row["kind"]), "name": str(row["name"]), "address": address,
        "language": _language(row),
    }


@router.put("/business")
async def write_business(body: BusinessDetails, request: Request) -> JSONResponse:
    _origin(request, required=True)
    _, phone = _existing_session(request)
    with _db() as db:
        _sweep(db)
        if db.execute("SELECT 1 FROM businesses WHERE phone=?", (phone,)).fetchone() is None:
            raise RuntimeError_(
                "bodega_waitlist_contact_required",
                "Join the Rocoto waitlist from WhatsApp to continue.",
                409,
            )
        db.execute(
            "UPDATE businesses SET person_name=CASE WHEN ?='' THEN person_name ELSE ? END, "
            "kind=?, name=?, address_text=?, address_place_id=?, "
            "address_lat=?, address_lng=?, language=? WHERE phone=?",
            (
                body.personName, body.personName, body.kind, body.name,
                body.address.text, body.address.placeId,
                body.address.lat, body.address.lng, body.language, phone,
            ),
        )
        row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
    return _json(_business_view(row))


@router.patch("/business")
async def patch_business(body: BusinessPatch, request: Request) -> JSONResponse:
    """Save profile answers incrementally before the final Meta connection."""
    _origin(request, required=True)
    _, phone = _existing_session(request)
    fields = body.model_dump(exclude_none=True)
    if not fields:
        raise RuntimeError_("bodega_business_answer_required", "Add one profile answer.", 400)
    columns: list[str] = []
    values: list[object] = []
    if "personName" in fields:
        columns.append("person_name=?")
        values.append(fields["personName"])
    if "kind" in fields:
        columns.append("kind=?")
        values.append(fields["kind"])
    if "name" in fields:
        columns.append("name=?")
        values.append(fields["name"])
    if "language" in fields:
        columns.append("language=?")
        values.append(fields["language"])
    if "address" in fields:
        address = body.address
        assert address is not None
        columns.extend(("address_text=?", "address_place_id=?", "address_lat=?", "address_lng=?"))
        values.extend((address.text, address.placeId, address.lat, address.lng))
    with _db() as db:
        _sweep(db)
        if db.execute("SELECT 1 FROM businesses WHERE phone=?", (phone,)).fetchone() is None:
            raise RuntimeError_(
                "bodega_waitlist_contact_required",
                "Join the Rocoto waitlist from WhatsApp to continue.",
                409,
            )
        db.execute(f"UPDATE businesses SET {', '.join(columns)} WHERE phone=?", (*values, phone))
        row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
    return _json(_business_view(row))


@router.get("/business")
async def read_business(request: Request) -> JSONResponse:
    _origin(request, required=False)
    _, phone = _existing_session(request)
    return _json(_business_view(_business(phone)))


# ── §4 · THE ADDRESS — ONBOARDING-SPEC.md §0, screen 5, through `places.py` ──────────────────────
# «In test and without a Maps key» this rig answers a small, fixed set of real Lima addresses
# instead of the named 503 `places.py` gives every other caller, so the walk stays whole offline
# (this rig's own README §«Run it»). It is never a substitute where a key IS configured.
FIXTURE_ADDRESSES: dict[str, dict] = {
    "fixture-av-larco": {
        "placeId": "fixture-av-larco", "text": "Av. Larco 345, Miraflores, Lima, Perú",
        "mainText": "Av. Larco 345", "secondaryText": "Miraflores, Lima, Perú",
        "lat": -12.1211, "lng": -77.0292,
    },
    "fixture-jr-union": {
        "placeId": "fixture-jr-union", "text": "Jr. de la Unión 618, Cercado de Lima, Lima, Perú",
        "mainText": "Jr. de la Unión 618", "secondaryText": "Cercado de Lima, Lima, Perú",
        "lat": -12.0472, "lng": -77.0325,
    },
    "fixture-av-arequipa": {
        "placeId": "fixture-av-arequipa", "text": "Av. Arequipa 2450, Lince, Lima, Perú",
        "mainText": "Av. Arequipa 2450", "secondaryText": "Lince, Lima, Perú",
        "lat": -12.0850, "lng": -77.0330,
    },
}


@router.get("/address/suggestions")
async def address_suggestions(
    request: Request,
    query: str = Query(..., min_length=3, max_length=200),
    sessionToken: str = Query(..., pattern=r"^[A-Za-z0-9_-]{1,36}$"),
) -> JSONResponse:
    _origin(request, required=False)
    session_id, _ = _existing_session(request)
    with _db() as db:
        _sweep(db)
        refusal = _address_ask(db, session_id, _now())
    if refusal:
        raise RuntimeError_(*refusal)
    if not places.settings.places_key:
        return _json({
            "provider": "fixture", "country": ADDRESS_COUNTRY,
            "suggestions": [
                {k: v for k, v in item.items() if k != "lat" and k != "lng"}
                for item in FIXTURE_ADDRESSES.values()
            ],
        })
    return _json(await places.address_suggestions(query, sessionToken, ADDRESS_COUNTRY))


@router.get("/address/place")
async def address_place(
    request: Request,
    placeId: str = Query(..., min_length=1, max_length=300),
    sessionToken: str = Query(..., pattern=r"^[A-Za-z0-9_-]{1,36}$"),
) -> JSONResponse:
    _origin(request, required=False)
    session_id, _ = _existing_session(request)
    with _db() as db:
        _sweep(db)
        refusal = _address_ask(db, session_id, _now())
    if refusal:
        raise RuntimeError_(*refusal)
    if not places.settings.places_key:
        fixture = FIXTURE_ADDRESSES.get(placeId)
        if fixture is None:
            raise RuntimeError_(
                "bodega_address_unknown", "Choose an address from the suggestions to continue.", 422
            )
        return _json({k: v for k, v in fixture.items() if k in ("placeId", "text", "lat", "lng")})
    return _json(await places.place_details(placeId, sessionToken))


# ── §5 · THE YAPE — ONBOARDING-SPEC.md §0, screen 7 ──────────────────────────────────────────────

def _yape_content_type(content: bytes) -> str:
    try:
        with Image.open(io.BytesIO(content)) as image:
            if image.format not in YAPE_QR_TYPES:
                raise RuntimeError_(
                    "bodega_yape_qr_unreadable", "Choose a PNG, JPG or WebP photo of your QR.", 415
                )
            kind = YAPE_QR_TYPES[image.format]
            image.verify()
            return kind
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise RuntimeError_(
            "bodega_yape_qr_unreadable", "Choose a PNG, JPG or WebP photo of your QR.", 415
        ) from None


def _yape_view(row: sqlite3.Row) -> dict:
    return {"number": str(row["yape_number"]), "hasQr": bool(row["yape_qr_content"])}


@router.put("/yape")
async def write_yape(
    request: Request, number: str = Form(...), qr: UploadFile | None = File(default=None)
) -> JSONResponse:
    """The shop's own Yape number, and its QR when this call carries one — a number given again
    without a fresh photo keeps the QR already on file, the way a profile field never blanks its
    neighbour."""
    _origin(request, required=True)
    _, phone = _connected_session(request)
    mobile = peru_mobile(number)
    content, content_type = None, None
    if qr is not None:
        raw = await qr.read(YAPE_QR_MAX_BYTES + 1)
        await qr.close()
        if not raw or len(raw) > YAPE_QR_MAX_BYTES:
            raise RuntimeError_(
                "bodega_yape_qr_too_large", "Choose a QR photo under 2 MB.", 413
            )
        content_type = _yape_content_type(raw)
        content = raw
    with _db() as db:
        _sweep(db)
        _ensure_business(db, phone, _now())
        if content is not None:
            db.execute(
                "UPDATE businesses SET yape_number=?, yape_qr_content_type=?, yape_qr_content=? "
                "WHERE phone=?",
                (mobile, content_type, content, phone),
            )
        else:
            db.execute("UPDATE businesses SET yape_number=? WHERE phone=?", (mobile, phone))
        row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
    return _json(_yape_view(row))


@router.get("/yape")
async def read_yape(request: Request) -> JSONResponse:
    _origin(request, required=False)
    _, phone = _connected_session(request)
    return _json(_yape_view(_business(phone)))


@router.get("/yape/qr")
async def read_own_yape_qr(request: Request) -> Response:
    """Served back to the same session alone: the shop's own screen, not another shop's."""
    _origin(request, required=False)
    _, phone = _connected_session(request)
    return _yape_qr_response(_business(phone))


def _yape_qr_response(row: sqlite3.Row) -> Response:
    content = row["yape_qr_content"]
    if not content:
        raise RuntimeError_("bodega_yape_qr_absent", "This shop has not connected its Yape QR.", 404)
    return Response(
        bytes(content), media_type=str(row["yape_qr_content_type"] or "application/octet-stream"),
        headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"},
    )


@router.get("/pay/{code}/yape")
async def read_shops_yape(code: str, request: Request) -> JSONResponse:
    """The public payment page's own read: a customer paying `#/pay/<id>` needs the shop's Yape
    number to send money to, and no session names it — the referral code is this shop's one public
    address (WIRING-SPEC.md's own `#/pay/<id>` names no other)."""
    _origin(request, required=False)
    with _db() as db:
        row = db.execute(
            "SELECT * FROM businesses WHERE referral_code=?", (code.strip().upper(),)
        ).fetchone()
    if row is None:
        raise RuntimeError_("bodega_shop_unknown", "This payment link is no longer live.", 404)
    return _json(_yape_view(row))


@router.get("/pay/{code}/yape/qr")
async def read_shops_yape_qr(code: str, request: Request) -> Response:
    _origin(request, required=False)
    with _db() as db:
        row = db.execute(
            "SELECT * FROM businesses WHERE referral_code=?", (code.strip().upper(),)
        ).fetchone()
    if row is None:
        raise RuntimeError_("bodega_shop_unknown", "This payment link is no longer live.", 404)
    return _yape_qr_response(row)


# ── §7 · META'S OWN DOOR — signed sender, immediate place, deterministic profile intake ─────────
# The first inbound secures the sender's place. Its following turns collect person name, business
# name and Play-account email. Referral promotion belongs after app profile and Meta connection.

WEBHOOK_UNCONFIGURED = (
    "bodega_webhook_unconfigured",
    "Rocoto's WhatsApp webhook is awaiting its two values, so this call stays unanswered.",
    503,
)
WEBHOOK_REFUSED = ("bodega_webhook_refused", "This call carries no signature Rocoto accepts.", 403)
WEBHOOK_MAX_BYTES = 128 * 1024
SIGNATURE_HEADER = "X-Hub-Signature-256"
SIGNATURE_PREFIX = "sha256="

# The marketing site's exact prefill uses `Referencia: CODE` / `Referral: CODE`. The older spoken
# forms remain readable while published links roll forward.
REFERENCE_IN_TEXT = re.compile(
    r"(?:referencia|referral|reference)\s*(?::|(?:es|is)\s+)\s*"
    f"([{REFERRAL_ALPHABET}]{{{REFERRAL_CODE_LENGTH}}})",
    re.IGNORECASE,
)


def _secret(name: str) -> str:
    """One of the webhook's two values, read at the call the way the bridge's switch is read."""
    return (os.environ.get(name) or "").strip()


def _wa_number(sender: str) -> str:
    """The number Meta names as the sender, in E.164, or an empty string this module stays silent on.

    Meta writes `from` as bare digits, and a business row is keyed by the `+` form the connection
    reported, so the two meet here. Nothing is implied and nothing is reshaped: a value this rule
    cannot read is a message the buddy answers with silence.
    """
    digits = "".join(character for character in sender if character.isdigit())
    candidate = "+" + digits
    return candidate if E164.fullmatch(candidate) else ""


def _said(message: dict) -> str | None:
    """What a person actually wrote, or `None` where this is something else Meta delivers.

    A text, a quick-reply button and an interactive reply are a person writing. A status, a
    reaction, an image and everything else are left alone: the buddy answers words.
    """
    kind = str(message.get("type") or "")
    if kind == "text":
        return str((message.get("text") or {}).get("body") or "")
    if kind == "button":
        return str((message.get("button") or {}).get("text") or "")
    if kind == "interactive":
        interactive = message.get("interactive") or {}
        for field in ("button_reply", "list_reply"):
            held = interactive.get(field)
            if isinstance(held, dict):
                return str(held.get("title") or "")
    return None


def _inbound(payload: dict) -> list[tuple[str, str, str, int]]:
    """User messages addressed to Rocoto's configured number, including Meta's provider timestamp."""
    read: list[tuple[str, str, str, int]] = []
    destination = str(settings.wa_cloud_phone_id or "")
    if not destination:
        return read
    entries = payload.get("entry") if isinstance(payload, dict) else None
    for entry in entries if isinstance(entries, list) else []:
        changes = entry.get("changes") if isinstance(entry, dict) else None
        for change in changes if isinstance(changes, list) else []:
            value = change.get("value") if isinstance(change, dict) else None
            metadata = value.get("metadata") if isinstance(value, dict) else None
            phone_id = str(metadata.get("phone_number_id") or "") if isinstance(metadata, dict) else ""
            if not hmac.compare_digest(phone_id, destination):
                continue
            messages = value.get("messages") if isinstance(value, dict) else None
            for message in messages if isinstance(messages, list) else []:
                if not isinstance(message, dict):
                    continue
                identifier = str(message.get("id") or "")
                sender, said = str(message.get("from") or ""), _said(message)
                timestamp = str(message.get("timestamp") or "")
                provider_at = int(timestamp) if timestamp.isdecimal() else 0
                if identifier and sender and said is not None:
                    read.append((identifier, sender, said, provider_at))
    return read


def _reference_in(said: str) -> str:
    found = REFERENCE_IN_TEXT.search(said or "")
    return found.group(1).upper() if found else ""


def _inbound_language(said: str) -> Literal["es", "en"]:
    clean = (said or "").strip().lower()
    return "en" if clean.startswith(("i'd like to join", "i’d like to join")) else "es"


def _intake_name(said: str, limit: int) -> str:
    """One human answer, bounded and flattened before it becomes profile data."""
    clean = " ".join((said or "").split()).strip()
    return clean[:limit] if clean else ""


def _intake_email(said: str) -> str:
    clean = (said or "").strip().lower()
    return clean if EMAIL.fullmatch(clean) else ""


def _record_inbound(
    identifier: str, sender: str, said: str, now: int, provider_at: int
) -> str | None:
    """Durably accept one signed message and return its intake stage before the ACK."""
    with _db() as db:
        _sweep(db)
        held = db.execute(
            "INSERT OR IGNORE INTO wa_inbound(message_id,at,provider_at) VALUES(?,?,?)",
            (identifier, now, provider_at),
        )
        if held.rowcount != 1:
            return None
        phone = _wa_number(sender)
        if not phone:
            return ""
        existed = db.execute("SELECT 1 FROM businesses WHERE phone=?", (phone,)).fetchone() is not None
        row = _ensure_contact(db, phone, now)
        if not int(row["first_inbound_at"] or 0):
            language = _language(row) if existed else _inbound_language(said)
            _attribute_referral(db, phone, _reference_in(said))
            stage = "complete" if str(row["name"]).strip() else "announce"
            db.execute(
                "UPDATE businesses SET first_inbound_at=?, intake_stage=?, language=? WHERE phone=?",
                (now, stage, language, phone),
            )
        stage = db.execute(
            "SELECT intake_stage FROM businesses WHERE phone=?", (phone,)
        ).fetchone()
        return str(stage["intake_stage"] or "")


async def _say(to: str, text: str, kind: str) -> bool:
    """One free-form sentence from Rocoto's own number, on the same day's ceiling every send takes.

    The window is open because the shop just wrote, which is what makes free-form the rail here. A
    refusal is journalled by its name and gives the day's place back, and the buddy stops rather
    than trying the rest of its turn.
    """
    now = _now()
    with _db() as db:
        refusal = _spend(db, to, now)
    if refusal:
        logger.info(
            "bodega buddy held",
            extra={"provider": "whatsapp-cloud", "kind": kind, "outcome": refusal[0]},
        )
        return False
    try:
        wamid = await send_text(to, text)
    except RuntimeError_ as refused:
        _refund(to, now)
        logger.info(
            "bodega buddy unsent", extra={"provider": "whatsapp-cloud", "kind": kind, "outcome": refused.code}
        )
        return False
    logger.info("bodega buddy said", extra={"provider": "whatsapp-cloud", "kind": kind, "outcome": wamid})
    return True


def _tester_invite_resend(said: str) -> bool:
    clean = " ".join((said or "").lower().split())
    return clean in {
        "envíame el enlace otra vez",
        "enviame el enlace otra vez",
        "reenvíame el enlace",
        "reenviame el enlace",
        "send the link again",
        "send link again",
        "resend the link",
        "resend link",
    }


async def _send_tester_invite(
    to: str, row: sqlite3.Row, url: str, *, force: bool = False
) -> str:
    """Send one provider-proven Play link, retaining the WhatsApp outcome for later inbound recovery."""
    from . import bodega_testing

    now = _now()
    with _db() as db:
        if not bodega_testing.mark_wa_invite_attempting(db, to, force=force):
            held = db.execute(
                "SELECT wa_invite_state FROM tester_enrollments WHERE phone=?", (to,)
            ).fetchone()
            state = str(held["wa_invite_state"] or "") if held is not None else ""
            return "already_sent" if state == "sent" else state
        refusal = _spend(db, to, now)
        if refusal:
            bodega_testing.mark_wa_invite_known_failed(db, to)
            logger.info(
                "bodega buddy held",
                extra={
                    "provider": "whatsapp-cloud",
                    "kind": "waitlist_tester_eligible",
                    "outcome": refusal[0],
                },
            )
            return "known_failed"
    text = TESTER_ELIGIBLE[_language(row)].format(url=url)
    try:
        wamid = await send_text(to, text)
    except RuntimeError_ as refused:
        _refund(to, now)
        # A provider refusal or absent configuration proves that no message left. Transport and
        # response-shape failures are ambiguous, so their `attempting` marker blocks auto-duplicates.
        if refused.code in {"bodega_whatsapp_refused", "bodega_whatsapp_unconfigured"}:
            with _db() as db:
                bodega_testing.mark_wa_invite_known_failed(db, to)
            outcome = "known_failed"
        else:
            outcome = "attempting"
        logger.info(
            "bodega buddy unsent",
            extra={"provider": "whatsapp-cloud", "kind": "waitlist_tester_eligible", "outcome": refused.code},
        )
        return outcome
    with _db() as db:
        bodega_testing.mark_wa_invite_sent(db, to, wamid)
    logger.info(
        "bodega buddy said",
        extra={"provider": "whatsapp-cloud", "kind": "waitlist_tester_eligible", "outcome": wamid},
    )
    return "sent"


def _replied(phone: str, now: int) -> None:
    """When the buddy last answered this business — the clock behind «the place again, at most once
    every ten minutes». It moves on the attempt, so a refused send is never retried on every message."""
    with _db() as db:
        db.execute("UPDATE businesses SET last_reply_at=? WHERE phone=?", (now, phone))


async def answer_inbound(
    sender: str, said: str, expected_stage: str = "", provider_at: int = 0
) -> None:
    """Secure a signed sender's place, then collect two bounded profile names."""
    to = _wa_number(sender)
    if not to:
        logger.info("bodega inbound unread", extra={"kind": "inbound", "outcome": "number_unreadable"})
        return
    now, page = _now(), _installed_page()
    if (
        provider_at <= 0
        or provider_at > now + WHATSAPP_CLOCK_SKEW
        or now - provider_at >= WHATSAPP_REPLY_WINDOW
    ):
        logger.info("bodega inbound held", extra={"kind": "inbound", "outcome": "reply_window_closed"})
        return
    captured_business = False
    captured_email = False
    with _db() as db:
        _sweep(db)
        row = db.execute("SELECT * FROM businesses WHERE phone=?", (to,)).fetchone()
        if row is None:
            logger.info("bodega inbound unmatched", extra={"kind": "inbound", "outcome": "contact_absent"})
            return
        last = int(row["last_reply_at"] or 0)
        stage = str(row["intake_stage"] or ("complete" if str(row["name"]).strip() else "person_name"))
        if expected_stage and stage != expected_stage:
            logger.info("bodega inbound superseded", extra={"kind": "inbound", "outcome": stage})
            return

        if stage == "person_name":
            person = _intake_name(said, 80)
            if person:
                changed = db.execute(
                    "UPDATE businesses SET person_name=?, intake_stage='business_name' "
                    "WHERE phone=? AND intake_stage='person_name'",
                    (person, to),
                )
                if changed.rowcount != 1:
                    return
                stage = "business_name"
        elif stage == "business_name":
            business = _intake_name(said, 120)
            if business:
                changed = db.execute(
                    "UPDATE businesses SET name=?, intake_stage='tester_email' "
                    "WHERE phone=? AND intake_stage='business_name'",
                    (business, to),
                )
                if changed.rowcount != 1:
                    return
                row = db.execute("SELECT * FROM businesses WHERE phone=?", (to,)).fetchone()
                stage = "tester_email"
                captured_business = True
        elif stage == "tester_email":
            email = _intake_email(said)
            if email:
                from . import bodega_testing

                changed = db.execute(
                    "UPDATE businesses SET intake_stage='complete' "
                    "WHERE phone=? AND intake_stage='tester_email'",
                    (to,),
                )
                if changed.rowcount != 1:
                    return
                bodega_testing.record_request(db, to, email)
                row = db.execute("SELECT * FROM businesses WHERE phone=?", (to,)).fetchone()
                stage = "complete"
                captured_email = True

    if stage == "announce":
        status = JOINED_MESSAGE[_language(row)].format(
            place=f"{int(row['place']):,}",
            status_url=_status_url_from_page(page, str(row["referral_code"])),
        )
        _replied(to, now)
        if not await _say(to, status, "waitlist_status"):
            return
        if not await _say(to, PERSON_NAME_QUESTION[_language(row)], "waitlist_person_name"):
            return
        with _db() as db:
            db.execute(
                "UPDATE businesses SET intake_stage='person_name' "
                "WHERE phone=? AND intake_stage='announce'",
                (to,),
            )
        return
    if stage == "person_name":
        await _say(to, PERSON_NAME_QUESTION[_language(row)], "waitlist_person_name")
        return
    if stage == "business_name":
        await _say(to, BUSINESS_NAME_QUESTION[_language(row)], "waitlist_business_name")
        return
    if stage == "tester_email":
        if captured_business:
            await _say(
                to,
                PROFILE_CAPTURED_MESSAGE[_language(row)].format(
                    person=str(row["person_name"]), business=str(row["name"])
                ),
                "waitlist_profile_captured",
            )
        await _say(to, TESTER_EMAIL_QUESTION[_language(row)], "waitlist_tester_email")
        return
    if stage == "complete" and str(row["tester_email"] or ""):
        from . import bodega_testing

        testing = await bodega_testing.enroll(to)
        if testing.get("state") == "eligible" and testing.get("optInUrl"):
            explicit_resend = _tester_invite_resend(said)
            invite = await _send_tester_invite(
                to, row, str(testing["optInUrl"]), force=explicit_resend
            )
            if invite in {"sent", "known_failed"}:
                return
            if invite == "attempting":
                if not explicit_resend:
                    await _say(
                        to,
                        TESTER_INVITE_UNCERTAIN[_language(row)],
                        "waitlist_tester_invite_uncertain",
                    )
                return
        if captured_email:
            await _say(
                to,
                TESTER_EMAIL_CAPTURED[_language(row)].format(email=str(row["tester_email"])),
                "waitlist_tester_requested",
            )
            return
    if now - last < STATUS_AGAIN:
        logger.info("bodega buddy waited", extra={"kind": "inbound", "outcome": "said_recently"})
        return
    try:
        status = _status_text(row, page)
    except RuntimeError_:
        status = JOINED_MESSAGE[_language(row)].format(
            place=f"{int(row['place']):,}",
            status_url=_status_url_from_page(page, str(row["referral_code"])),
        )
    _replied(to, now)
    await _say(to, status, "waitlist_status")


@router.get("/wa/webhook")
async def verify_webhook(
    mode: str = Query("", alias="hub.mode", max_length=40),
    token: str = Query("", alias="hub.verify_token", max_length=200),
    challenge: str = Query("", alias="hub.challenge", max_length=500),
) -> Response:
    """Meta's own subscribe screen, answered in its own shape: the challenge, as plain text.

    It FAILS CLOSED both ways — an absent `BODEGA_WA_VERIFY_TOKEN` is a named 503, and a token that
    is not this box's own is a 403 — and the comparison is constant-time, because the value it
    guards is the one that decides who may subscribe to this shop's inbound mail.
    """
    expected = _secret(WEBHOOK_VERIFY_TOKEN_ENV)
    if not expected:
        raise RuntimeError_(*WEBHOOK_UNCONFIGURED)
    # BYTES ON BOTH SIDES: `compare_digest` raises on a non-ASCII string, and a query parameter
    # carries whatever the caller typed — a refusal is the answer, never a 500.
    if mode != "subscribe" or not hmac.compare_digest(token.encode(), expected.encode()):
        raise RuntimeError_(*WEBHOOK_REFUSED)
    return Response(
        challenge, media_type="text/plain",
        headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"},
    )


@router.post("/wa/webhook")
async def receive_webhook(request: Request, background: BackgroundTasks) -> JSONResponse:
    """What the shop wrote, from Meta, signed — and Rocoto's answer sent after this call returns.

    THE SIGNATURE IS THE ONLY DOOR: `_origin` reads a header any client sets, and Meta sets none, so
    this path is guarded by `X-Hub-Signature-256` over the RAW body against `BODEGA_WA_APP_SECRET`.
    No secret is a named 503 and a signature that does not match is a 403, both before the body is
    read as anything. Meta reads a slow webhook as a failure and retries it, so the sends happen in
    a background task and this answers 200 as soon as the payload is recorded.
    """
    secret = _secret(WEBHOOK_SECRET_ENV)
    if not secret:
        raise RuntimeError_(*WEBHOOK_UNCONFIGURED)
    raw = await request.body()
    if len(raw) > WEBHOOK_MAX_BYTES:
        raise RuntimeError_("bodega_webhook_too_large", "This call is larger than Rocoto reads.", 413)
    signature = request.headers.get(SIGNATURE_HEADER, "")
    expected = SIGNATURE_PREFIX + hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature.encode("utf-8", "replace"), expected.encode()):
        raise RuntimeError_(*WEBHOOK_REFUSED)
    try:
        payload = json.loads(raw or b"{}")
    except ValueError:
        payload = {}
    now = _now()
    taken = 0
    for identifier, sender, said, provider_at in _inbound(payload if isinstance(payload, dict) else {}):
        stage = _record_inbound(identifier, sender, said, now, provider_at)
        if stage is not None:
            taken += 1
            background.add_task(answer_inbound, sender, said, stage, provider_at)
    logger.info("bodega inbound read", extra={"kind": "inbound", "outcome": f"messages:{taken}"})
    return _json({"received": True})


# ── §7 · THE FIVE-MINUTE HELLO — the template, for a shop that wrote nothing ─────────────────────
# Peter: «if they didn't message the buddy for 5 minutes after they finished the last onboarding
# step, we should message them with a meta template just giving them their waitlist status link and
# saying hello.» A shop that wrote nothing opened no window, so this rides the approved template
# `waitlist_hello` and nothing else: its body states the name and the place, and its own URL button
# carries the code of the page that holds them.

_buddy_jobs: set[asyncio.Task] = set()


def _backoff(attempts: int) -> int:
    """How long after a refused attempt the next one may go out."""
    if attempts <= 0:
        return 0
    return HELLO_BACKOFF[min(attempts, len(HELLO_BACKOFF)) - 1]


def _hello_due(now: int) -> list[sqlite3.Row]:
    """The businesses this minute's hello belongs to, and nobody else.

    Four conditions, each one a promise: the walk is finished and five minutes old, this shop has
    written nothing (a shop that wrote is already talking to the buddy), no hello has gone out, and
    the attempts so far are under the ceiling and past their own backoff.
    """
    with _db() as db:
        _sweep(db)
        rows = db.execute(
            "SELECT * FROM businesses WHERE onboarded_at>0 AND onboarded_at<=? AND first_inbound_at=0 "
            "AND hello_sent_at=0 AND hello_attempts<? ORDER BY onboarded_at",
            (now - HELLO_AFTER, HELLO_ATTEMPTS),
        ).fetchall()
    return [
        row for row in rows
        if now - int(row["hello_attempt_at"] or 0) >= _backoff(int(row["hello_attempts"] or 0))
    ]


def _hello_tried(phone: str, now: int, sent: bool) -> None:
    """One attempt recorded, and the moment it went out where it did — a refusal records the attempt
    alone, so the ceiling of five counts refusals and the backoff reads the last of them."""
    with _db() as db:
        db.execute(
            "UPDATE businesses SET hello_attempts=hello_attempts+1, hello_attempt_at=? WHERE phone=?",
            (now, phone),
        )
        if sent:
            db.execute("UPDATE businesses SET hello_sent_at=? WHERE phone=?", (now, phone))


async def hello_tick() -> int:
    """One look at the record, and the hellos it owes. The suite drives this directly.

    Every send spends the same day's ceiling a `/notify` send spends, a refusal is journalled by its
    name and backs the next attempt off further, and the fifth refusal leaves that business alone.
    """
    now, sent = _now(), 0
    for row in _hello_due(now):
        to = str(row["phone"])
        try:
            name = _display_name(row)
        except RuntimeError_ as refused:
            logger.info("bodega hello silent", extra={"kind": HELLO_TEMPLATE, "outcome": refused.code})
            _hello_tried(to, now, sent=False)
            continue
        with _db() as db:
            refusal = _spend(db, to, now)
        if refusal:
            logger.info(
                "bodega hello held",
                extra={"provider": "whatsapp-cloud", "kind": HELLO_TEMPLATE, "outcome": refusal[0]},
            )
            _hello_tried(to, now, sent=False)
            continue
        try:
            wamid = await send_template(
                to, HELLO_TEMPLATE, [name, f"{int(row['place']):,}"],
                language=_language(row), button=str(row["referral_code"]),
            )
        except RuntimeError_ as refused:
            _refund(to, now)
            logger.info(
                "bodega hello unsent",
                extra={"provider": "whatsapp-cloud", "kind": HELLO_TEMPLATE, "outcome": refused.code},
            )
            _hello_tried(to, now, sent=False)
            continue
        _hello_tried(to, now, sent=True)
        sent += 1
        logger.info(
            "bodega hello sent",
            extra={"provider": "whatsapp-cloud", "kind": HELLO_TEMPLATE, "outcome": wamid},
        )
    return sent


async def hello_loop() -> None:
    while True:
        try:
            # No records file is a box where no shop has ever signed in; it is left uncreated.
            if _path().exists():
                await hello_tick()
        except Exception:  # noqa: BLE001 - the loop outlives one failed tick
            logger.exception("bodega hello needs retry")
        await asyncio.sleep(BUDDY_PERIOD)


async def start() -> None:
    """One task, started with the app. `BODEGA_BUDDY_LOOP=off` is the operator's own switch."""
    if _secret(BUDDY_LOOP_ENV).lower() == "off":
        logger.info("bodega buddy loop held", extra={"kind": "buddy", "outcome": "switched_off"})
        return
    if any(not task.done() for task in _buddy_jobs):
        return
    _buddy_jobs.add(asyncio.create_task(hello_loop()))


async def stop() -> None:
    for task in _buddy_jobs:
        task.cancel()
    await asyncio.gather(*_buddy_jobs, return_exceptions=True)
    _buddy_jobs.clear()
