from __future__ import annotations

import json
import sqlite3

import pytest

from app import bodega, bodega_cases, config

PHONE = "+51987654321"
OTHER = "+51911111111"
OPERATOR = "peter"


@pytest.fixture()
def db(tmp_path, monkeypatch):
    monkeypatch.setattr(config.settings, "state_dir", tmp_path, raising=False)
    with bodega._db() as connection:
        bodega._ensure_contact(connection, PHONE, 100)
        bodega._ensure_contact(connection, OTHER, 100)
        yield connection


def case_input(phone=PHONE):
    return {
        "merchant_phone": phone,
        "merchant_consent": True,
        "consent_at": 101,
        "consent_record": "Merchant agreed on the call to a one-week assisted trial.",
        "objective": "Keep track of supplier orders shared with the operator.",
        "week_outcome": "Review three real orders together by Friday.",
        "next_action": "Merchant shares the next order.",
        "follow_up": "Friday at 16:00 by phone.",
    }


def test_case_requires_existing_identity_and_explicit_consent(db):
    absent = case_input("+51922222222")
    with pytest.raises(bodega_cases.CaseError, match="existing"):
        bodega_cases.open_case(db, absent, OPERATOR, 200)
    unconsented = case_input()
    unconsented["merchant_consent"] = False
    with pytest.raises(bodega_cases.CaseError, match="consent"):
        bodega_cases.open_case(db, unconsented, OPERATOR, 200)
    with pytest.raises(bodega_cases.CaseError, match="future"):
        bodega_cases.open_case(db, case_input() | {"consent_at": 201}, OPERATOR, 200)
    with pytest.raises(bodega_cases.CaseError, match="audit label"):
        bodega_cases.open_case(db, case_input(), "  ", 200)


def test_literal_evidence_keeps_provenance_and_media_has_no_interpretation(db):
    case_id = bodega_cases.open_case(db, case_input(), OPERATOR, 200)
    evidence_id = bodega_cases.add_evidence(db, {
        "case_id": case_id, "merchant_phone": PHONE, "kind": "voice",
        "source_channel": "direct_whatsapp", "source_ref": "wamid.held-by-merchant",
        "observed_at": 190, "media_ref": "provider:wamid.held-by-merchant",
        "media_mime": "audio/ogg", "unknowns": "Contents await operator review.",
    }, OPERATOR, 201)
    row = db.execute("SELECT * FROM assistance_evidence WHERE id=?", (evidence_id,)).fetchone()
    assert row["source_ref"] == "wamid.held-by-merchant"
    assert row["literal_text"] == ""
    assert "interpret" not in row


def test_location_is_tentative_until_explicitly_confirmed(db):
    case_id = bodega_cases.open_case(db, case_input(), OPERATOR, 200)
    base = {"case_id": case_id, "merchant_phone": PHONE, "kind": "location",
            "source_channel": "manual_call", "source_ref": "call:2026-09-23:note-1",
            "observed_at": 190, "latitude": -12.1, "longitude": -77.03,
            "location_label": "Merchant-stated corner", "unknowns": "Exact entrance unknown."}
    evidence_id = bodega_cases.add_evidence(db, base, OPERATOR, 201)
    assert db.execute("SELECT location_confirmed FROM assistance_evidence WHERE id=?",
                      (evidence_id,)).fetchone()[0] == 0
    confirmed = dict(base, source_ref="whatsapp:location-2", location_confirmed=True)
    confirmed_id = bodega_cases.add_evidence(db, confirmed, OPERATOR, 202)
    assert db.execute("SELECT location_confirmed FROM assistance_evidence WHERE id=?",
                      (confirmed_id,)).fetchone()[0] == 1
    with pytest.raises(bodega_cases.CaseError, match="latitude"):
        bodega_cases.add_evidence(db, dict(base, latitude=91), OPERATOR, 203)
    with pytest.raises(bodega_cases.CaseError, match="future"):
        bodega_cases.add_evidence(db, dict(base, source_ref="later", observed_at=204), OPERATOR, 203)


def test_mutations_are_scoped_to_case_merchant_and_owner(db):
    case_id = bodega_cases.open_case(db, case_input(), OPERATOR, 200)
    evidence = {"case_id": case_id, "merchant_phone": OTHER, "kind": "text",
                "source_channel": "manual_call", "source_ref": "call:note",
                "observed_at": 190, "literal_text": "Owner stated this."}
    with pytest.raises(bodega_cases.CaseError, match="scope"):
        bodega_cases.add_evidence(db, evidence, OPERATOR, 201)
    evidence["merchant_phone"] = PHONE
    with pytest.raises(bodega_cases.CaseError, match="scope"):
        bodega_cases.add_evidence(db, evidence, "another-operator", 201)


def test_review_close_and_purge_are_ordered_and_delete_related_records(db):
    case_id = bodega_cases.open_case(db, case_input(), OPERATOR, 200)
    bodega_cases.add_evidence(db, {
        "case_id": case_id, "merchant_phone": PHONE, "kind": "text",
        "source_channel": "manual_call", "source_ref": "call:note-1",
        "observed_at": 190, "literal_text": "The merchant's literal answer.", "unknowns": "",
    }, OPERATOR, 201)
    status = {"case_id": case_id, "merchant_phone": PHONE,
              "next_action": "Operator checks the shared order.", "follow_up": "Friday by phone."}
    with pytest.raises(bodega_cases.CaseError, match="cannot move"):
        bodega_cases.update_status(db, dict(status, status="closed"), OPERATOR, 202)
    bodega_cases.update_status(db, dict(status, status="reviewed"), OPERATOR, 202)
    bodega_cases.add_evidence(db, {
        "case_id": case_id, "merchant_phone": PHONE, "kind": "text",
        "source_channel": "manual_call", "source_ref": "late-note",
        "observed_at": 202, "literal_text": "The merchant's later result.",
    }, OPERATOR, 202)
    reopened = db.execute("SELECT status,reviewed_at,reviewed_by FROM assistance_cases").fetchone()
    assert tuple(reopened) == ("open", 0, "")
    bodega_cases.update_status(db, dict(status, status="reviewed"), OPERATOR, 202)
    bodega_cases.update_status(db, dict(status, status="closed"), OPERATOR, 203)
    before = 203 + bodega_cases.CLOSED_RETENTION_DAYS * 86400 - 1
    assert bodega_cases.purge(db, now=before, apply=True) == []
    due = 203 + bodega_cases.CLOSED_RETENTION_DAYS * 86400
    assert bodega_cases.purge(db, now=due, apply=False) == [case_id]
    assert db.execute("SELECT count(*) FROM assistance_cases").fetchone()[0] == 1
    assert bodega_cases.purge(db, now=due, apply=True) == [case_id]
    assert db.execute("SELECT count(*) FROM assistance_cases").fetchone()[0] == 0
    assert db.execute("SELECT count(*) FROM assistance_evidence").fetchone()[0] == 0


def test_operator_view_masks_phone(db):
    case_id = bodega_cases.open_case(db, case_input(), OPERATOR, 200)
    view = bodega_cases.case_view(db, {"case_id": case_id, "merchant_phone": PHONE}, OPERATOR)
    assert view["case"]["merchant_phone"] == "••••4321"
    assert PHONE not in str(view)


def test_evidence_retry_is_idempotent_and_consent_withdrawal_deletes_scope(db):
    case_id = bodega_cases.open_case(db, case_input(), OPERATOR, 200)
    evidence = {"case_id": case_id, "merchant_phone": PHONE, "kind": "text",
                "source_channel": "manual_call", "source_ref": "call:stable-note",
                "observed_at": 190, "literal_text": "Literal merchant answer."}
    first = bodega_cases.add_evidence(db, evidence, OPERATOR, 201)
    assert bodega_cases.add_evidence(db, evidence, OPERATOR, 202) == first
    assert db.execute("SELECT count(*) FROM assistance_evidence").fetchone()[0] == 1
    with pytest.raises(bodega_cases.CaseError, match="different evidence"):
        bodega_cases.add_evidence(
            db, dict(evidence, literal_text="Different text under the same source."), OPERATOR, 203
        )
    with pytest.raises(bodega_cases.CaseError, match="different evidence"):
        bodega_cases.add_evidence(db, dict(evidence, observed_at=191), OPERATOR, 203)
    bodega_cases.withdraw_consent(
        db, {"case_id": case_id, "merchant_phone": PHONE}, OPERATOR
    )
    assert db.execute("SELECT count(*) FROM assistance_cases").fetchone()[0] == 0
    assert db.execute("SELECT count(*) FROM assistance_evidence").fetchone()[0] == 0


def test_status_transition_reports_lost_guarded_update(db):
    case_id = bodega_cases.open_case(db, case_input(), OPERATOR, 200)

    class LostUpdate:
        rowcount = 0

    class RacingConnection:
        def __init__(self, held):
            self.held = held

        def execute(self, statement, parameters=()):
            if statement.startswith("UPDATE assistance_cases SET status="):
                return LostUpdate()
            return self.held.execute(statement, parameters)

    with pytest.raises(bodega_cases.CaseError, match="reload and retry"):
        bodega_cases.update_status(RacingConnection(db), {
            "case_id": case_id, "merchant_phone": PHONE, "status": "reviewed",
            "next_action": "Review together.", "follow_up": "Friday by phone.",
        }, OPERATOR, 202)


@pytest.mark.parametrize("concurrent_change", ["closed", "withdrawn"])
def test_evidence_rechecks_case_after_concurrent_close_or_withdrawal(db, monkeypatch, concurrent_change):
    case_id = bodega_cases.open_case(db, case_input(), OPERATOR, 200)
    held_lookup = bodega_cases._owned_case

    def stale_lookup(connection, identifier, phone, operator):
        held = held_lookup(connection, identifier, phone, operator)
        if concurrent_change == "closed":
            connection.execute("UPDATE assistance_cases SET status='closed' WHERE id=?", (identifier,))
        else:
            connection.execute("DELETE FROM assistance_cases WHERE id=?", (identifier,))
        return held

    monkeypatch.setattr(bodega_cases, "_owned_case", stale_lookup)
    with pytest.raises(bodega_cases.CaseError, match="reload and retry"):
        bodega_cases.add_evidence(db, {
            "case_id": case_id, "merchant_phone": PHONE, "kind": "text",
            "source_channel": "manual_call", "source_ref": "late-evidence",
            "observed_at": 190, "literal_text": "A late note.",
        }, OPERATOR, 202)
    assert db.execute("SELECT count(*) FROM assistance_evidence").fetchone()[0] == 0
    state = db.execute("SELECT status FROM assistance_cases WHERE id=?", (case_id,)).fetchone()
    assert state is None if concurrent_change == "withdrawn" else state["status"] == "closed"


def test_existing_database_is_additively_upgraded(tmp_path, monkeypatch):
    monkeypatch.setattr(config.settings, "state_dir", tmp_path, raising=False)
    path = tmp_path / "bodega-rig.sqlite"
    with sqlite3.connect(path) as old:
        old.execute("CREATE TABLE legacy(value TEXT)")
        old.execute("INSERT INTO legacy VALUES('kept')")
    with bodega._db() as upgraded:
        assert upgraded.execute("SELECT value FROM legacy").fetchone()[0] == "kept"
        assert upgraded.execute("SELECT count(*) FROM assistance_cases").fetchone()[0] == 0


def test_cli_json_file_opens_and_shows_case_without_provider_calls(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(config.settings, "state_dir", tmp_path, raising=False)
    monkeypatch.setattr(
        bodega, "send_text", lambda *_args, **_kwargs: pytest.fail("CLI attempted a provider send")
    )
    with bodega._db() as connection:
        bodega._ensure_contact(connection, PHONE, 100)
    opened = tmp_path / "open.json"
    opened.write_text(json.dumps(case_input()))
    assert bodega_cases.main(["--operator", OPERATOR, "open", "--input", str(opened)]) == 0
    case_id = json.loads(capsys.readouterr().out)["case_id"]
    key = tmp_path / "key.json"
    key.write_text(json.dumps({"case_id": case_id, "merchant_phone": PHONE}))
    assert bodega_cases.main(["--operator", OPERATOR, "show", "--input", str(key)]) == 0
    shown = json.loads(capsys.readouterr().out)
    assert shown["case"]["objective"] == case_input()["objective"]
    assert shown["case"]["merchant_phone"] == "••••4321"
