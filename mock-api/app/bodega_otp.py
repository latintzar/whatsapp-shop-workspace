"""WhatsApp OTP identity rail for native Bodega onboarding.

This is deliberately separate from ``bodega``'s Meta PKCE handoff. An OTP proves control of a
WhatsApp phone; Meta later proves the WhatsApp Business connection. The database retains only
opaque attempt IDs and keyed digests, never an OTP or the native client secret.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import sqlite3
from base64 import urlsafe_b64encode
from contextlib import contextmanager
from typing import Iterator

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from . import bodega
from .config import settings
from .errors import RuntimeError_

router = APIRouter(prefix="/api/bodega/mobile/otp", tags=["bodega-otp"])

OTP_TTL = 10 * 60
OTP_ATTEMPT_MEMORY = 24 * 60 * 60
OTP_ATTEMPTS_STORED = 1_000
OTP_REDEEM_TRIES = 5
OTP_CODE = r"^\d{6}$"
CLIENT_SECRET = r"^[A-Za-z0-9_-]{43,128}$"


class OtpStart(BaseModel):
    """Phone and a device-held secret; neither is an authorization by itself."""

    model_config = ConfigDict(extra="forbid")
    phone: str = Field(min_length=8, max_length=32)
    client_secret: str = Field(alias="clientSecret", pattern=CLIENT_SECRET)

    @field_validator("phone")
    @classmethod
    def _phone(cls, value: str) -> str:
        return bodega.number(value)


class OtpRedeem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    attempt: str = Field(pattern=bodega.OPAQUE.pattern)
    client_secret: str = Field(alias="clientSecret", pattern=CLIENT_SECRET)
    code: str = Field(pattern=OTP_CODE)


def _digest(value: str) -> str:
    """A low-entropy OTP needs a keyed digest, not an ordinary SHA-256 row."""
    key = settings.bodega_otp_digest_key.encode("utf-8")
    return hmac.new(key, value.encode("utf-8"), hashlib.sha256).hexdigest()


def _available() -> None:
    """Never fabricate a send while template commissioning is unfinished."""
    if not (
        settings.wa_cloud_token
        and settings.wa_cloud_phone_id
        and settings.bodega_otp_template_name
        and settings.bodega_otp_template_language
        and len(settings.bodega_otp_digest_key) >= 32
    ):
        raise RuntimeError_(
            "bodega_otp_provider_unavailable",
            "WhatsApp verification is being prepared. Return to Rocoto when it is ready.",
            503,
        )


@contextmanager
def _db() -> Iterator[sqlite3.Connection]:
    """Extend the shared state file without widening the Meta-handoff table."""
    with bodega._db() as db:
        db.execute(
            "CREATE TABLE IF NOT EXISTS otp_attempts ("
            "id TEXT PRIMARY KEY, phone TEXT NOT NULL, client_secret_hash TEXT NOT NULL, "
            "code_hash TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, "
            "sent_at INTEGER NOT NULL DEFAULT 0, redeemed_at INTEGER NOT NULL DEFAULT 0, "
            "cancelled_at INTEGER NOT NULL DEFAULT 0, redeem_attempts INTEGER NOT NULL DEFAULT 0, "
            "message_id TEXT NOT NULL DEFAULT '', session_id TEXT NOT NULL DEFAULT '')"
        )
        columns = {str(row["name"]) for row in db.execute("PRAGMA table_info(otp_attempts)")}
        if "session_id" not in columns:
            db.execute("ALTER TABLE otp_attempts ADD COLUMN session_id TEXT NOT NULL DEFAULT ''")
        db.execute(
            "CREATE TABLE IF NOT EXISTS otp_limits ("
            "key TEXT PRIMARY KEY, period INTEGER NOT NULL, count INTEGER NOT NULL, "
            "touched_at INTEGER NOT NULL)"
        )
        yield db


def _sweep(db: sqlite3.Connection, now: int) -> None:
    db.execute("DELETE FROM otp_attempts WHERE expires_at<=?", (now,))
    db.execute(
        "DELETE FROM otp_attempts WHERE id IN ("
        "SELECT id FROM otp_attempts ORDER BY created_at DESC LIMIT -1 OFFSET ?)",
        (OTP_ATTEMPTS_STORED,),
    )
    db.execute("DELETE FROM otp_limits WHERE touched_at<?", (now - OTP_ATTEMPT_MEMORY,))


def _limit(
    db: sqlite3.Connection, buckets: tuple[tuple[str, int, int], ...], now: int
) -> tuple[str, str, int] | None:
    """OTP-local ceilings survive unrelated bodega maintenance and never read forwarded headers."""
    for key, seconds, ceiling in buckets:
        period = now // seconds
        row = db.execute("SELECT period,count FROM otp_limits WHERE key=?", (key,)).fetchone()
        count = int(row["count"]) if row is not None and int(row["period"]) == period else 0
        if count >= ceiling:
            return ("bodega_mobile_rate_limited", "Try this sign-in again in a moment.", 429)
    for key, seconds, _ in buckets:
        db.execute(
            "INSERT INTO otp_limits(key,period,count,touched_at) VALUES(?,?,1,?) "
            "ON CONFLICT(key) DO UPDATE SET period=excluded.period, "
            "count=CASE WHEN otp_limits.period=excluded.period THEN otp_limits.count+1 ELSE 1 END, "
            "touched_at=excluded.touched_at",
            (key, now // seconds, now),
        )
    return None


def _attempt_view(attempt: str, expires_at: int) -> dict[str, int | str]:
    return {"attempt": attempt, "expiresAt": expires_at}


def _send_payload(phone: str, code: str) -> dict:
    """Meta's authentication-template payload. The code appears in both required parameters."""
    return {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone.lstrip("+"),
        "type": "template",
        "template": {
            "name": settings.bodega_otp_template_name,
            "language": {"code": settings.bodega_otp_template_language},
            "components": [
                {"type": "body", "parameters": [{"type": "text", "text": code}]},
                {
                    "type": "button",
                    "sub_type": "url",
                    "index": "0",
                    "parameters": [{"type": "text", "text": code}],
                },
            ],
        },
    }


def _session_token(attempt: str, client_secret: str) -> str:
    """Retry-safe native credential derived from the device-held secret, never persisted raw."""
    material = f"otp-session\0{attempt}\0{client_secret}".encode("utf-8")
    return (
        urlsafe_b64encode(
            hmac.new(settings.bodega_otp_digest_key.encode("utf-8"), material, hashlib.sha256).digest()
        )
        .rstrip(b"=")
        .decode("ascii")
    )


def _recovered_session(
    db: sqlite3.Connection, row: sqlite3.Row, attempt: str, client_secret: str, code: str, now: int
) -> tuple[str, int] | None:
    """Return a still-live grant only for the device that consumed this exact OTP.

    This makes a process death between a successful response and encrypted native persistence
    recoverable. It is deliberately not a general OTP replay: both keyed digests and the stored
    session binding must match.
    """
    if not int(row["redeemed_at"]) or not str(row["session_id"]):
        return None
    if not (
        hmac.compare_digest(str(row["client_secret_hash"]), _digest(client_secret))
        and hmac.compare_digest(str(row["code_hash"]), _digest(code))
    ):
        return None
    token = _session_token(attempt, client_secret)
    recovered = db.execute(
        "SELECT expires_at FROM sessions WHERE id=? AND phone=? AND token_hash=? AND expires_at>?",
        (str(row["session_id"]), str(row["phone"]), bodega._hash(token), now),
    ).fetchone()
    return (token, int(recovered["expires_at"])) if recovered is not None else None


@router.post("/start")
async def start_otp(body: OtpStart, request: Request) -> JSONResponse:
    bodega._native_origin(request)
    _available()
    now = bodega._now()
    caller = bodega._hash(bodega._caller(request))
    phone_key = bodega._hash(body.phone)
    # Count every requested number before contact lookup, otherwise this endpoint becomes a
    # free waitlist-membership oracle and its per-phone ceiling can be bypassed with unknown rows.
    with _db() as db:
        _sweep(db, now)
        refusal = _limit(
            db,
            (
                (f"otp-start:{caller}", 60, 5),
                (f"otp-start-phone:{phone_key}", 10 * 60, 3),
                ("otp-start:*", 60, 100),
            ),
            now,
        )
        known = db.execute("SELECT 1 FROM businesses WHERE phone=?", (body.phone,)).fetchone() is not None
        db.commit()
    if refusal:
        raise RuntimeError_(*refusal)
    attempt = secrets.token_urlsafe(32)
    expires_at = now + OTP_TTL
    # Keep unknown numbers indistinguishable at this public boundary. The decoy has no sent
    # message and can never redeem; it also never creates a waitlist/business record.
    if not known:
        with _db() as db:
            _sweep(db, now)
            db.execute(
                "INSERT INTO otp_attempts("
                "id,phone,client_secret_hash,code_hash,created_at,expires_at,sent_at) "
                "VALUES(?,?,?,?,?,?,?)",
                (
                    attempt,
                    body.phone,
                    _digest(body.client_secret),
                    _digest(f"decoy:{secrets.token_urlsafe(32)}"),
                    now,
                    expires_at,
                    now,
                ),
            )
        return JSONResponse(
            _attempt_view(attempt, expires_at), status_code=201, headers={"Cache-Control": "no-store"}
        )
    code = f"{secrets.randbelow(1_000_000):06d}"
    with _db() as db:
        _sweep(db, now)
        db.execute(
            "INSERT INTO otp_attempts(id,phone,client_secret_hash,code_hash,created_at,expires_at) "
            "VALUES(?,?,?,?,?,?)",
            (attempt, body.phone, _digest(body.client_secret), _digest(code), now, expires_at),
        )
    try:
        message_id = await bodega._post_messages(_send_payload(body.phone, code))
    except RuntimeError_:
        with _db() as db:
            db.execute("UPDATE otp_attempts SET cancelled_at=? WHERE id=? AND redeemed_at=0", (now, attempt))
        raise
    with _db() as db:
        # A resend supersedes the previous code only after this template was accepted. A provider
        # failure therefore leaves the last delivered code usable instead of stranding the user.
        db.execute(
            "UPDATE otp_attempts SET cancelled_at=? WHERE phone=? AND id<>? AND expires_at>? "
            "AND sent_at>0 AND redeemed_at=0 AND cancelled_at=0",
            (now, body.phone, attempt, now),
        )
        sent = db.execute(
            "UPDATE otp_attempts SET sent_at=?, message_id=? WHERE id=? AND expires_at>? "
            "AND cancelled_at=0 AND redeemed_at=0",
            (now, message_id, attempt, now),
        )
        if sent.rowcount != 1:
            raise RuntimeError_("bodega_otp_attempt_unavailable", "Start WhatsApp verification again.", 409)
    return JSONResponse(
        _attempt_view(attempt, expires_at), status_code=201, headers={"Cache-Control": "no-store"}
    )


@router.post("/redeem")
async def redeem_otp(body: OtpRedeem, request: Request) -> JSONResponse:
    bodega._native_origin(request)
    now = bodega._now()
    caller = bodega._hash(bodega._caller(request))
    with _db() as db:
        _sweep(db, now)
        row = db.execute("SELECT * FROM otp_attempts WHERE id=?", (body.attempt,)).fetchone()
        if (
            row is None
            or int(row["expires_at"]) <= now
            or not int(row["sent_at"])
            or int(row["cancelled_at"])
            or int(row["redeem_attempts"]) >= OTP_REDEEM_TRIES
        ):
            raise RuntimeError_("bodega_otp_attempt_unavailable", "Start WhatsApp verification again.", 409)
        valid = hmac.compare_digest(
            str(row["client_secret_hash"]), _digest(body.client_secret)
        ) and hmac.compare_digest(str(row["code_hash"]), _digest(body.code))
        if int(row["redeemed_at"]):
            recovered = _recovered_session(db, row, body.attempt, body.client_secret, body.code, now)
            if not valid or recovered is None:
                raise RuntimeError_(
                    "bodega_otp_attempt_unavailable", "Start WhatsApp verification again.", 409
                )
            contact = db.execute("SELECT * FROM businesses WHERE phone=?", (str(row["phone"]),)).fetchone()
            if contact is None:
                raise RuntimeError_(
                    "bodega_otp_attempt_unavailable", "Start WhatsApp verification again.", 409
                )
            return JSONResponse(
                {
                    "token": recovered[0],
                    "expiresAt": recovered[1],
                    "session": {
                        "signedIn": True,
                        "phone": str(row["phone"]),
                        "connection": bool(int(contact["connection_verified_at"])),
                    },
                },
                headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"},
            )
        refusal = _limit(
            db,
            (
                (f"otp-redeem:{caller}", 60, 10),
                (f"otp-redeem-phone:{bodega._hash(str(row['phone']))}", 10 * 60, 8),
                ("otp-redeem:*", 60, 200),
            ),
            now,
        )
        db.commit()
        if refusal:
            raise RuntimeError_(*refusal)
        if not valid:
            refused = db.execute(
                "UPDATE otp_attempts SET redeem_attempts=redeem_attempts+1, "
                "cancelled_at=CASE WHEN redeem_attempts+1>=? THEN ? ELSE cancelled_at END "
                "WHERE id=? AND redeemed_at=0 AND cancelled_at=0",
                (OTP_REDEEM_TRIES, now, body.attempt),
            )
            # RuntimeError_ unwinds the shared transaction; retain this security counter first.
            db.commit()
            if refused.rowcount != 1:
                raise RuntimeError_(
                    "bodega_otp_attempt_unavailable", "Start WhatsApp verification again.", 409
                )
            raise RuntimeError_("bodega_otp_code_refused", "Check the verification code and try again.", 401)
        phone = str(row["phone"])
        contact = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
        if contact is None:
            raise RuntimeError_("bodega_otp_attempt_unavailable", "Start WhatsApp verification again.", 409)
        token = _session_token(body.attempt, body.client_secret)
        session_id = secrets.token_hex(16)
        expires_at = now + bodega.SESSION_TTL
        consumed = db.execute(
            "UPDATE otp_attempts SET redeemed_at=?, session_id=? WHERE id=? AND expires_at>? AND sent_at>0 "
            "AND cancelled_at=0 AND redeemed_at=0 AND redeem_attempts<? "
            "AND client_secret_hash=? AND code_hash=?",
            (
                now,
                session_id,
                body.attempt,
                now,
                OTP_REDEEM_TRIES,
                _digest(body.client_secret),
                _digest(body.code),
            ),
        )
        if consumed.rowcount != 1:
            current = db.execute("SELECT * FROM otp_attempts WHERE id=?", (body.attempt,)).fetchone()
            recovered = (
                _recovered_session(db, current, body.attempt, body.client_secret, body.code, now)
                if current is not None
                else None
            )
            if recovered is not None:
                return JSONResponse(
                    {
                        "token": recovered[0],
                        "expiresAt": recovered[1],
                        "session": {
                            "signedIn": True,
                            "phone": phone,
                            "connection": bool(int(contact["connection_verified_at"])),
                        },
                    },
                    headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"},
                )
            raise RuntimeError_("bodega_otp_attempt_unavailable", "Start WhatsApp verification again.", 409)
        db.execute(
            "INSERT INTO sessions(id,token_hash,phone,created_at,expires_at) VALUES(?,?,?,?,?)",
            (session_id, bodega._hash(token), phone, now, expires_at),
        )
        db.execute(
            "DELETE FROM sessions WHERE phone=? AND id NOT IN ("
            "SELECT id FROM sessions WHERE phone=? ORDER BY created_at DESC, rowid DESC LIMIT ?)",
            (phone, phone, bodega.SESSIONS_PER_NUMBER),
        )
        connection = bool(int(contact["connection_verified_at"]))
    return JSONResponse(
        {
            "token": token,
            "expiresAt": expires_at,
            "session": {"signedIn": True, "phone": phone, "connection": connection},
        },
        headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"},
    )
