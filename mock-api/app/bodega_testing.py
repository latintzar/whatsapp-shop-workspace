"""Google Group-backed Google Play tester enrollment.

The group is the Play Console tester source. A browser can only request enrollment for the
email on its signed-in Rocoto contact; this module owns the fixed Google destination and marks a
request eligible only after Directory reports that exact member ACTIVE.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import secrets
import os
import sqlite3
from contextlib import contextmanager
from typing import Iterator
from urllib.parse import quote

import httpx
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import service_account

from . import bodega
from .config import settings
from .errors import RuntimeError_

DIRECTORY_SCOPE = "https://www.googleapis.com/auth/admin.directory.group.member"
DIRECTORY_BASE = "https://admin.googleapis.com/admin/directory/v1"
PLAY_OPT_IN_URL = "https://play.google.com/apps/testing/" + os.environ.get("BODEGA_PLAY_PACKAGE_ID", "org.example.shopworkspace")
LEASE_SECONDS = 60
HTTP_TIMEOUT = 15.0
TOKEN_TIMEOUT = 10.0
RETRY_SECONDS = 60
ELIGIBLE_TTL = 24 * 60 * 60
EMAIL_CHANGES_PER_DAY = 3


@contextmanager
def _db() -> Iterator[sqlite3.Connection]:
    with bodega._db() as db:
        ensure_schema(db)
        yield db


def ensure_schema(db: sqlite3.Connection) -> None:
    """Create the side tables on either this module's connection or bodega's shared transaction."""
    db.execute(
        "CREATE TABLE IF NOT EXISTS tester_enrollments ("
        "phone TEXT PRIMARY KEY, email TEXT NOT NULL, group_email TEXT NOT NULL, "
        "opt_in_url TEXT NOT NULL, "
        "state TEXT NOT NULL, requested_at INTEGER NOT NULL, lease TEXT NOT NULL DEFAULT '', "
        "lease_until INTEGER NOT NULL DEFAULT 0, verified_at INTEGER NOT NULL DEFAULT 0, "
        "last_attempt_at INTEGER NOT NULL DEFAULT 0, invite_receipt TEXT NOT NULL DEFAULT '', "
        "wa_invite_state TEXT NOT NULL DEFAULT '', wa_invite_attempted_at INTEGER NOT NULL DEFAULT 0, "
        "wa_invite_message_id TEXT NOT NULL DEFAULT '')"
    )
    columns = {str(column["name"]) for column in db.execute("PRAGMA table_info(tester_enrollments)")}
    for name, declaration in (
        ("wa_invite_state", "TEXT NOT NULL DEFAULT ''"),
        ("wa_invite_attempted_at", "INTEGER NOT NULL DEFAULT 0"),
        ("wa_invite_message_id", "TEXT NOT NULL DEFAULT ''"),
    ):
        if name not in columns:
            db.execute(f"ALTER TABLE tester_enrollments ADD COLUMN {name} {declaration}")
    db.execute(
        "CREATE TABLE IF NOT EXISTS tester_email_change_limits ("
        "phone TEXT PRIMARY KEY, day INTEGER NOT NULL, count INTEGER NOT NULL)"
    )


def _configured() -> bool:
    """All destinations are operator configuration, never request data."""
    if settings.bodega_play_opt_in_url != PLAY_OPT_IN_URL:
        return False
    if not (
        settings.bodega_play_testers_group
        and settings.bodega_play_delegated_admin
        and settings.bodega_play_service_account_json
    ):
        return False
    try:
        value = json.loads(settings.bodega_play_service_account_json)
    except json.JSONDecodeError:
        return False
    return isinstance(value, dict) and bool(value.get("client_email") and value.get("private_key"))


def _view(row: sqlite3.Row, enrollment: sqlite3.Row | None) -> dict:
    email = str(row["tester_email"] or "")
    if not email:
        return {"state": "unavailable"}
    eligible = (
        _configured()
        and enrollment is not None
        and str(enrollment["state"]) == "eligible"
        and str(enrollment["email"]) == email
        and str(enrollment["group_email"]) == settings.bodega_play_testers_group
        and str(enrollment["opt_in_url"]) == settings.bodega_play_opt_in_url
        and int(enrollment["verified_at"] or 0) >= bodega._now() - ELIGIBLE_TTL
    )
    if eligible:
        return {"state": "eligible", "email": email, "optInUrl": settings.bodega_play_opt_in_url}
    return {"state": "requested", "email": email}


def testing_view(db: sqlite3.Connection, row: sqlite3.Row) -> dict:
    ensure_schema(db)
    enrollment = db.execute("SELECT * FROM tester_enrollments WHERE phone=?", (str(row["phone"]),)).fetchone()
    return _view(row, enrollment)


def record_request(db: sqlite3.Connection, phone: str, email: str) -> dict:
    """Persist a request; changing the email immediately invalidates prior eligibility."""
    ensure_schema(db)
    now = bodega._now()
    current = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
    if current is None:
        raise RuntimeError("tester enrollment requires the existing signed-in contact")
    changed = str(current["tester_email"] or "") != email
    enrollment = db.execute("SELECT * FROM tester_enrollments WHERE phone=?", (phone,)).fetchone()
    if (
        not changed
        and enrollment is not None
        and (
            str(enrollment["group_email"]) == settings.bodega_play_testers_group
            and str(enrollment["opt_in_url"]) == settings.bodega_play_opt_in_url
        )
    ):
        return testing_view(db, current)
    if changed and str(current["tester_email"] or ""):
        day = now // (24 * 60 * 60)
        limit = db.execute(
            "SELECT day,count FROM tester_email_change_limits WHERE phone=?", (phone,)
        ).fetchone()
        count = int(limit["count"]) if limit is not None and int(limit["day"]) == day else 0
        if count >= EMAIL_CHANGES_PER_DAY:
            raise RuntimeError_(
                "bodega_testing_email_rate_limited", "Use the Google Play account you want to test with.", 429
            )
        db.execute(
            "INSERT INTO tester_email_change_limits(phone,day,count) VALUES(?,?,1) "
            "ON CONFLICT(phone) DO UPDATE SET day=excluded.day, "
            "count=CASE WHEN tester_email_change_limits.day=excluded.day "
            "THEN tester_email_change_limits.count+1 ELSE 1 END",
            (phone, day),
        )
    db.execute(
        "UPDATE businesses SET tester_email=?, tester_enrollment='requested' WHERE phone=?",
        (email, phone),
    )
    if changed:
        db.execute("DELETE FROM tester_enrollments WHERE phone=?", (phone,))
    db.execute(
        "INSERT INTO tester_enrollments("
        "phone,email,group_email,opt_in_url,state,requested_at,last_attempt_at) "
        "VALUES(?,?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET email=excluded.email, "
        "group_email=excluded.group_email,opt_in_url=excluded.opt_in_url,state='requested', "
        "requested_at=excluded.requested_at,last_attempt_at=0,lease='',lease_until=0,verified_at=0,invite_receipt=''",
        (
            phone,
            email,
            settings.bodega_play_testers_group,
            settings.bodega_play_opt_in_url,
            "requested",
            now,
            0,
        ),
    )
    row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
    return testing_view(db, row)


def mark_wa_invite_attempting(db: sqlite3.Connection, phone: str, force: bool = False) -> bool:
    """CAS an in-window invitation. `force` is only for a signed explicit resend request."""
    ensure_schema(db)
    states = "('','known_failed','attempting','sent')" if force else "('','known_failed')"
    changed = db.execute(
        "UPDATE tester_enrollments SET wa_invite_state='attempting',wa_invite_attempted_at=?, "
        "wa_invite_message_id='' WHERE phone=? AND wa_invite_state IN " + states,
        (bodega._now(), phone),
    )
    return changed.rowcount == 1


def mark_wa_invite_sent(db: sqlite3.Connection, phone: str, message_id: str) -> None:
    """Persist the provider's `wamid` only after an actual accepted WhatsApp send."""
    ensure_schema(db)
    db.execute(
        "UPDATE tester_enrollments SET wa_invite_state='sent',wa_invite_message_id=? "
        "WHERE phone=? AND wa_invite_state='attempting'",
        (message_id, phone),
    )


def mark_wa_invite_known_failed(db: sqlite3.Connection, phone: str) -> None:
    """An explicit provider refusal is retryable on a later signed inbound, unlike uncertainty."""
    ensure_schema(db)
    db.execute(
        "UPDATE tester_enrollments SET wa_invite_state='known_failed' "
        "WHERE phone=? AND wa_invite_state='attempting'",
        (phone,),
    )


def _access_token() -> str:
    """Use the company service account impersonating the fixed delegated administrator."""
    info = json.loads(settings.bodega_play_service_account_json)
    credential = service_account.Credentials.from_service_account_info(
        info, scopes=[DIRECTORY_SCOPE], subject=settings.bodega_play_delegated_admin
    )
    credential.refresh(_bounded_google_request())
    return str(credential.token)


def _bounded_google_request():
    """Cap the auth transport itself; cancelling its worker cannot otherwise stop a socket."""
    request = GoogleRequest()

    def bounded(*args, **kwargs):
        timeout = kwargs.get("timeout", TOKEN_TIMEOUT)
        try:
            kwargs["timeout"] = min(float(timeout), TOKEN_TIMEOUT)
        except (TypeError, ValueError):
            kwargs["timeout"] = TOKEN_TIMEOUT
        return request(*args, **kwargs)

    return bounded


def _member_url(group: str, email: str) -> str:
    return f"{DIRECTORY_BASE}/groups/{quote(group, safe='')}/members/{quote(email, safe='')}"


async def _directory_active(token: str, group: str, email: str) -> tuple[bool, str]:
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, follow_redirects=False) as client:
        added = await client.post(
            f"{DIRECTORY_BASE}/groups/{quote(group, safe='')}/members",
            headers=headers,
            json={"email": email, "role": "MEMBER"},
        )
        # 409 is the documented idempotent case: still require a fresh membership read below.
        if added.status_code not in (200, 201, 409):
            return False, ""
        member = await client.get(_member_url(group, email), headers=headers)
    if member.status_code != 200:
        return False, ""
    payload = member.json()
    active = (
        str(payload.get("email", "")).lower() == email and str(payload.get("status", "")).upper() == "ACTIVE"
    )
    receipt = hashlib.sha256(str(payload.get("id", "")).encode("utf-8")).hexdigest()[:16] if active else ""
    return active, receipt


async def enroll(phone: str) -> dict:
    """Attempt one enrollment, guarded by a short DB lease; provider errors stay requested."""
    if not _configured():
        with _db() as db:
            row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
            return testing_view(db, row) if row is not None else {"state": "unavailable"}
    now, lease = bodega._now(), secrets.token_urlsafe(16)
    with _db() as db:
        row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
        if row is None or not str(row["tester_email"] or ""):
            return {"state": "unavailable"}
        email = str(row["tester_email"])
        enrollment = db.execute("SELECT * FROM tester_enrollments WHERE phone=?", (phone,)).fetchone()
        if enrollment is None:
            # Existing waitlist contacts can predate this table. Their persisted request is enough
            # to seed a pending row; it still needs the same Directory proof to become eligible.
            db.execute(
                "INSERT INTO tester_enrollments("
                "phone,email,group_email,opt_in_url,state,requested_at,last_attempt_at) "
                "VALUES(?,?,?,?,?,?,?)",
                (
                    phone,
                    email,
                    settings.bodega_play_testers_group,
                    settings.bodega_play_opt_in_url,
                    "requested",
                    now,
                    0,
                ),
            )
            enrollment = db.execute("SELECT * FROM tester_enrollments WHERE phone=?", (phone,)).fetchone()
        if _view(row, enrollment).get("state") == "eligible":
            return testing_view(db, row)
        # Requests saved before commissioning receive the operator's fixed destination at the
        # first configured attempt. The browser never supplies this group or URL.
        db.execute(
            "UPDATE tester_enrollments SET group_email=?,opt_in_url=?,state='requested', "
            "lease='',lease_until=0,last_attempt_at=0 WHERE phone=? AND email=? "
            "AND (group_email<>? OR opt_in_url<>?)",
            (
                settings.bodega_play_testers_group,
                settings.bodega_play_opt_in_url,
                phone,
                email,
                settings.bodega_play_testers_group,
                settings.bodega_play_opt_in_url,
            ),
        )
        acquired = db.execute(
            "UPDATE tester_enrollments SET lease=?,lease_until=?,last_attempt_at=? "
            "WHERE phone=? AND email=? AND group_email=? AND opt_in_url=? AND lease_until<=? "
            "AND (last_attempt_at=0 OR last_attempt_at<=?)",
            (
                lease,
                now + LEASE_SECONDS,
                now,
                phone,
                email,
                settings.bodega_play_testers_group,
                settings.bodega_play_opt_in_url,
                now,
                now - RETRY_SECONDS,
            ),
        )
        if acquired.rowcount != 1:
            return testing_view(db, row)
    try:
        token = await asyncio.wait_for(asyncio.to_thread(_access_token), timeout=TOKEN_TIMEOUT)
        active, receipt = await _directory_active(token, settings.bodega_play_testers_group, email)
    except (asyncio.TimeoutError, GoogleAuthError, ValueError, OSError, httpx.HTTPError):
        active, receipt = False, ""
    with _db() as db:
        row = db.execute("SELECT * FROM businesses WHERE phone=?", (phone,)).fetchone()
        if row is None or str(row["tester_email"] or "") != email:
            return testing_view(db, row) if row is not None else {"state": "unavailable"}
        if active:
            confirmed = db.execute(
                "UPDATE tester_enrollments SET state='eligible',verified_at=?,invite_receipt=?, "
                "lease='',lease_until=0 WHERE phone=? AND email=? AND lease=?",
                (bodega._now(), receipt, phone, email, lease),
            )
            if confirmed.rowcount == 1:
                db.execute(
                    "UPDATE businesses SET tester_enrollment='eligible' WHERE phone=? AND tester_email=?",
                    (phone, email),
                )
        else:
            db.execute(
                "UPDATE tester_enrollments SET state='requested',lease='',lease_until=0 "
                "WHERE phone=? AND lease=?",
                (phone, lease),
            )
        return testing_view(db, row)
