"""Operator-reviewed assistance cases for the supervised Bodega pilot.

This is a local CLI over the existing private bodega SQLite file. It has no HTTP route, provider,
send, download, or model call. Sensitive case content enters as JSON on stdin or from a file.
"""
from __future__ import annotations

import argparse
import json
import secrets
import sqlite3
import sys
import time
from pathlib import Path
from typing import Any, Sequence

from . import bodega

CLOSED_RETENTION_DAYS = 30
KINDS = {"text", "location", "photo", "voice"}
CHANNELS = {"manual_call", "direct_whatsapp", "business_whatsapp", "app"}
STATUSES = {"open", "reviewed", "closed"}


class CaseError(ValueError):
    pass


def ensure_schema(db: sqlite3.Connection) -> None:
    db.execute(
        "CREATE TABLE IF NOT EXISTS assistance_cases ("
        "id TEXT PRIMARY KEY, merchant_phone TEXT NOT NULL, owner_operator TEXT NOT NULL, "
        "consent_at INTEGER NOT NULL, consent_record TEXT NOT NULL, objective TEXT NOT NULL, "
        "week_outcome TEXT NOT NULL, next_action TEXT NOT NULL, follow_up TEXT NOT NULL, "
        "status TEXT NOT NULL CHECK(status IN ('open','reviewed','closed')), "
        "opened_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, reviewed_at INTEGER NOT NULL DEFAULT 0, "
        "reviewed_by TEXT NOT NULL DEFAULT '', closed_at INTEGER NOT NULL DEFAULT 0)"
    )
    db.execute(
        "CREATE TABLE IF NOT EXISTS assistance_evidence ("
        "id TEXT PRIMARY KEY, case_id TEXT NOT NULL, merchant_phone TEXT NOT NULL, "
        "kind TEXT NOT NULL CHECK(kind IN ('text','location','photo','voice')), "
        "source_channel TEXT NOT NULL CHECK(source_channel IN "
        "('manual_call','direct_whatsapp','business_whatsapp','app')), source_ref TEXT NOT NULL, "
        "observed_at INTEGER NOT NULL, captured_at INTEGER NOT NULL, captured_by TEXT NOT NULL, "
        "literal_text TEXT NOT NULL DEFAULT '', latitude REAL, longitude REAL, "
        "location_label TEXT NOT NULL DEFAULT '', location_confirmed INTEGER NOT NULL DEFAULT 0, "
        "media_ref TEXT NOT NULL DEFAULT '', media_mime TEXT NOT NULL DEFAULT '', "
        "unknowns TEXT NOT NULL DEFAULT '', FOREIGN KEY(case_id) REFERENCES assistance_cases(id))"
    )
    db.execute("CREATE INDEX IF NOT EXISTS assistance_evidence_case ON assistance_evidence(case_id)")
    db.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS assistance_evidence_source ON assistance_evidence("
        "case_id,merchant_phone,kind,source_channel,source_ref)"
    )


def _text(data: dict[str, Any], key: str, *, required: bool = True, limit: int = 2000) -> str:
    value = data.get(key)
    if value is None and not required:
        return ""
    if not isinstance(value, str) or (required and not value.strip()):
        raise CaseError(f"{key} must be a non-empty string")
    clean = value.strip()
    if len(clean) > limit:
        raise CaseError(f"{key} exceeds {limit} characters")
    return clean


def _integer(data: dict[str, Any], key: str) -> int:
    value = data.get(key)
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise CaseError(f"{key} must be a positive integer")
    return value


def _merchant(db: sqlite3.Connection, phone: str) -> None:
    if not bodega.E164.fullmatch(phone):
        raise CaseError("merchant_phone must be E.164")
    if db.execute("SELECT 1 FROM businesses WHERE phone=?", (phone,)).fetchone() is None:
        raise CaseError("merchant_phone must identify an existing bodega contact")


def open_case(db: sqlite3.Connection, data: dict[str, Any], operator: str, now: int | None = None) -> str:
    operator = _operator(operator)
    phone = _text(data, "merchant_phone", limit=16)
    _merchant(db, phone)
    if data.get("merchant_consent") is not True:
        raise CaseError("merchant_consent must be true")
    consent_at = _integer(data, "consent_at")
    consent_record = _text(data, "consent_record", limit=500)
    created = now or int(time.time())
    if consent_at > created:
        raise CaseError("consent_at cannot be in the future")
    identifier = "bac_" + secrets.token_urlsafe(12)
    db.execute(
        "INSERT INTO assistance_cases(id,merchant_phone,owner_operator,consent_at,consent_record,"
        "objective,week_outcome,next_action,follow_up,status,opened_at,updated_at) "
        "VALUES(?,?,?,?,?,?,?,?,?,'open',?,?)",
        (identifier, phone, operator, consent_at, consent_record,
         _text(data, "objective"), _text(data, "week_outcome"),
         _text(data, "next_action"), _text(data, "follow_up"), created, created),
    )
    return identifier


def _owned_case(db: sqlite3.Connection, case_id: str, phone: str, operator: str) -> sqlite3.Row:
    row = db.execute(
        "SELECT * FROM assistance_cases WHERE id=? AND merchant_phone=? AND owner_operator=?",
        (case_id, phone, operator),
    ).fetchone()
    if row is None:
        raise CaseError("case does not exist in this merchant and operator scope")
    return row


def add_evidence(db: sqlite3.Connection, data: dict[str, Any], operator: str, now: int | None = None) -> str:
    operator = _operator(operator)
    case_id = _text(data, "case_id", limit=80)
    phone = _text(data, "merchant_phone", limit=16)
    row = _owned_case(db, case_id, phone, operator)
    if str(row["status"]) == "closed":
        raise CaseError("closed cases are immutable")
    kind = _text(data, "kind", limit=20)
    channel = _text(data, "source_channel", limit=30)
    if kind not in KINDS or channel not in CHANNELS:
        raise CaseError("unsupported evidence kind or source_channel")
    source_ref = _text(data, "source_ref", limit=500)
    observed_at = _integer(data, "observed_at")
    literal, lat, lng, label, confirmed, media_ref, mime = "", None, None, "", 0, "", ""
    if kind == "text":
        literal = _text(data, "literal_text", limit=10_000)
    elif kind == "location":
        lat, lng = data.get("latitude"), data.get("longitude")
        if isinstance(lat, bool) or not isinstance(lat, (int, float)) or not -90 <= lat <= 90:
            raise CaseError("latitude must be between -90 and 90")
        if isinstance(lng, bool) or not isinstance(lng, (int, float)) or not -180 <= lng <= 180:
            raise CaseError("longitude must be between -180 and 180")
        label = _text(data, "location_label", required=False, limit=500)
        confirmed = int(data.get("location_confirmed") is True)
    else:
        media_ref = _text(data, "media_ref", limit=1000)
        mime = _text(data, "media_mime", required=False, limit=120)
    captured = now or int(time.time())
    if observed_at > captured:
        raise CaseError("observed_at cannot be in the future")
    unknowns = _text(data, "unknowns", required=False, limit=2000)
    existing = db.execute(
        "SELECT * FROM assistance_evidence WHERE case_id=? AND merchant_phone=? AND kind=? "
        "AND source_channel=? AND source_ref=?",
        (case_id, phone, kind, channel, source_ref),
    ).fetchone()
    if existing is not None:
        retry_payload = (
            observed_at, literal, lat, lng, label, confirmed, media_ref, mime,
            unknowns,
        )
        held_payload = (
            int(existing["observed_at"]), str(existing["literal_text"]),
            existing["latitude"], existing["longitude"], str(existing["location_label"]),
            int(existing["location_confirmed"]), str(existing["media_ref"]),
            str(existing["media_mime"]), str(existing["unknowns"]),
        )
        if retry_payload != held_payload:
            raise CaseError("source_ref already identifies different evidence")
        return str(existing["id"])
    identifier = "bae_" + secrets.token_urlsafe(12)
    # Revalidate under SQLite's writer lock before storing evidence. A concurrent close or
    # consent withdrawal must win over our earlier read of the case.
    updated = db.execute(
        "UPDATE assistance_cases SET status='open',updated_at=?,reviewed_at=0,reviewed_by='' "
        "WHERE id=? AND merchant_phone=? AND owner_operator=? AND status IN ('open','reviewed')",
        (captured, case_id, phone, operator),
    )
    if updated.rowcount != 1:
        raise CaseError("case changed; reload and retry")
    db.execute(
        "INSERT INTO assistance_evidence(id,case_id,merchant_phone,kind,source_channel,source_ref,"
        "observed_at,captured_at,captured_by,literal_text,latitude,longitude,location_label,"
        "location_confirmed,media_ref,media_mime,unknowns) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (identifier, case_id, phone, kind, channel, source_ref, observed_at, captured, operator,
         literal, lat, lng, label, confirmed, media_ref, mime,
         unknowns),
    )
    return identifier


def update_status(
    db: sqlite3.Connection, data: dict[str, Any], operator: str, now: int | None = None
) -> None:
    operator = _operator(operator)
    case_id, phone = _text(data, "case_id", limit=80), _text(data, "merchant_phone", limit=16)
    row = _owned_case(db, case_id, phone, operator)
    status = _text(data, "status", limit=20)
    if status not in STATUSES or status == "open":
        raise CaseError("status must be reviewed or closed")
    current = str(row["status"])
    if (current, status) not in {("open", "reviewed"), ("reviewed", "closed")}:
        raise CaseError(f"case cannot move from {current} to {status}")
    changed = now or int(time.time())
    reviewed_at = changed if status == "reviewed" else int(row["reviewed_at"])
    reviewed_by = operator if status == "reviewed" else str(row["reviewed_by"])
    closed_at = changed if status == "closed" else 0
    updated = db.execute(
        "UPDATE assistance_cases SET status=?,next_action=?,follow_up=?,updated_at=?,reviewed_at=?,"
        "reviewed_by=?,closed_at=? WHERE id=? AND merchant_phone=? AND owner_operator=? AND status=?",
        (status, _text(data, "next_action"), _text(data, "follow_up"), changed, reviewed_at,
        reviewed_by, closed_at, case_id, phone, operator, current),
    )
    if updated.rowcount != 1:
        raise CaseError("case status changed; reload and retry")


def case_view(db: sqlite3.Connection, data: dict[str, Any], operator: str) -> dict[str, Any]:
    operator = _operator(operator)
    row = _owned_case(db, _text(data, "case_id", limit=80),
                      _text(data, "merchant_phone", limit=16), operator)
    evidence = db.execute(
        "SELECT * FROM assistance_evidence WHERE case_id=? AND merchant_phone=? ORDER BY captured_at,id",
        (row["id"], row["merchant_phone"]),
    ).fetchall()
    case = dict(row)
    case["merchant_phone"] = "••••" + str(row["merchant_phone"])[-4:]
    items = [dict(item) for item in evidence]
    for item in items:
        item["merchant_phone"] = case["merchant_phone"]
    return {"case": case, "evidence": items}


def withdraw_consent(db: sqlite3.Connection, data: dict[str, Any], operator: str) -> None:
    """Immediately remove one scoped case and its evidence after consent is withdrawn."""
    operator = _operator(operator)
    case_id = _text(data, "case_id", limit=80)
    phone = _text(data, "merchant_phone", limit=16)
    _owned_case(db, case_id, phone, operator)
    db.execute("DELETE FROM assistance_evidence WHERE case_id=? AND merchant_phone=?", (case_id, phone))
    deleted = db.execute(
        "DELETE FROM assistance_cases WHERE id=? AND merchant_phone=? AND owner_operator=?",
        (case_id, phone, operator),
    )
    if deleted.rowcount != 1:
        raise CaseError("case does not exist in this merchant and operator scope")


def purge(db: sqlite3.Connection, *, now: int | None = None, apply: bool = False) -> list[str]:
    cutoff = (now or int(time.time())) - CLOSED_RETENTION_DAYS * 86400
    ids = [str(row["id"]) for row in db.execute(
        "SELECT id FROM assistance_cases WHERE status='closed' AND closed_at>0 AND closed_at<=? ORDER BY id",
        (cutoff,),
    )]
    if apply and ids:
        marks = ",".join("?" for _ in ids)
        db.execute(f"DELETE FROM assistance_evidence WHERE case_id IN ({marks})", ids)
        db.execute(f"DELETE FROM assistance_cases WHERE id IN ({marks})", ids)
    return ids


def _input(path: str) -> dict[str, Any]:
    raw = sys.stdin.read() if path == "-" else Path(path).read_text()
    value = json.loads(raw)
    if not isinstance(value, dict):
        raise CaseError("input must be one JSON object")
    return value


def _operator(value: str) -> str:
    clean = value.strip()
    if not clean or len(clean) > 120:
        raise CaseError("operator must be a non-empty audit label")
    return clean


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Local operator review for Bodega assistance cases")
    parser.add_argument("--operator", required=True, help="local operator identity")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("open", "add-evidence", "show", "status", "withdraw-consent"):
        command = sub.add_parser(name)
        command.add_argument("--input", required=True, metavar="FILE|-", help="JSON file or stdin")
    command = sub.add_parser("purge")
    command.add_argument("--apply", action="store_true")
    args = parser.parse_args(argv)
    try:
        with bodega._db() as db:
            if args.command == "open":
                result: Any = {"case_id": open_case(db, _input(args.input), args.operator)}
            elif args.command == "add-evidence":
                result = {"evidence_id": add_evidence(db, _input(args.input), args.operator)}
            elif args.command == "show":
                result = case_view(db, _input(args.input), args.operator)
            elif args.command == "status":
                update_status(db, _input(args.input), args.operator)
                result = {"updated": True}
            elif args.command == "withdraw-consent":
                withdraw_consent(db, _input(args.input), args.operator)
                result = {"deleted": True}
            else:
                ids = purge(db, apply=args.apply)
                result = {"mode": "apply" if args.apply else "dry-run", "cases": ids, "count": len(ids)}
    except (CaseError, json.JSONDecodeError, OSError) as error:
        print(json.dumps({"error": str(error)}), file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
