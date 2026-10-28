"""Browser diagnostic reports carry a fixed vocabulary, never provider or business data."""

import json
import logging
from uuid import uuid4

import pytest
from starlette.testclient import TestClient

from app import bodega_connection_test as reports
from app.logging_setup import JsonLine
from app.main import app

ORIGIN = "https://shop.example.invalid"
PATH = "/api/bodega/connection-test/events"


def report(**changes):
    return {
        "runId": str(uuid4()),
        "events": [{"kind": "load", "page": 1, "attempt": 0, "at": 1789984221000}],
        **changes,
    }


@pytest.fixture(autouse=True)
def fresh_limits():
    reports._minute.clear()
    reports._hour.clear()
    yield
    reports._minute.clear()
    reports._hour.clear()


def test_valid_report_is_accepted_without_a_session_and_journalled(caplog, monkeypatch, tmp_path):
    from app.config import settings
    monkeypatch.setattr(settings, "state_dir", tmp_path)
    with caplog.at_level(logging.INFO, logger=reports.logger.name):
        response = TestClient(app).post(PATH, json=report(), headers={"Origin": ORIGIN})
    assert response.status_code == 202
    assert response.json() == {"accepted": True}
    records = [r for r in caplog.records if r.name == reports.logger.name]
    assert len(records) == 1
    assert '"kind":"load"' in records[0].getMessage()
    assert '"source":"browser_reported"' in records[0].getMessage()
    journal = json.loads(JsonLine().format(records[0]))
    assert journal["kind"] == "connection_test"
    assert json.loads(journal["msg"])["events"][0]["kind"] == "load"
    assert response.headers["cache-control"] == "no-store"
    assert list(tmp_path.iterdir()) == []


@pytest.mark.parametrize("origin", [None, "null", "https://elsewhere.example", "https://kit.soyrocoto.com"])
def test_explicit_development_origin_is_required(origin, caplog):
    headers = {"Origin": origin} if origin else {}
    response = TestClient(app).post(PATH, json=report(), headers=headers)
    assert response.status_code == 403
    assert not any(r.name == reports.logger.name for r in caplog.records)


def test_stream_is_capped_even_without_content_length(caplog):
    def chunks():
        yield b" " * 8192
        yield b"sensitive-value"
    response = TestClient(app).post(PATH, content=chunks(), headers={"Origin": ORIGIN})
    assert response.status_code == 413
    assert "sensitive-value" not in response.text + caplog.text
    assert not any(r.name == reports.logger.name for r in caplog.records)


@pytest.mark.parametrize("change", [
    {"access_token": "sensitive-value"},
    {"runId": "sensitive-value"},
    {"events": [{"kind": "sensitive-value", "page": 1, "attempt": 0, "at": 1000}]},
    {"events": [{"kind": "failure", "value": "sensitive-value", "page": 1, "attempt": 0, "at": 1000}]},
    {"events": [{"kind": "load", "page": 1, "attempt": 0, "at": 1000, "sensitive-value": "private"}]},
    {"events": [{"kind": "load", "page": "1", "attempt": 0, "at": 1000}]},
    {"events": [{"kind": "load", "page": True, "attempt": 0, "at": 1000}]},
    {"events": [{"kind": "load", "page": 1, "attempt": -1, "at": 1000}]},
    {"events": []},
])
def test_unsafe_or_invalid_fields_are_refused_without_echo_or_journal(change, caplog):
    response = TestClient(app).post(PATH, json=report(**change), headers={"Origin": ORIGIN})
    assert response.status_code == 422
    assert "sensitive-value" not in response.text + caplog.text
    assert "access_token" not in response.text + caplog.text
    assert not any(r.name == reports.logger.name for r in caplog.records)


def test_at_most_ten_events_are_accepted():
    body = report()
    body["events"] *= 11
    response = TestClient(app).post(PATH, json=body, headers={"Origin": ORIGIN})
    assert response.status_code == 422


def test_global_minute_and_hour_caps_cannot_be_bypassed_by_new_run_ids(monkeypatch):
    clock = [10.0]
    monkeypatch.setattr(reports, "monotonic", lambda: clock[0])
    monkeypatch.setattr(reports, "REPORTS_PER_MINUTE", 2)
    monkeypatch.setattr(reports, "REPORTS_PER_HOUR", 3)
    client = TestClient(app)
    def send():
        return client.post(PATH, json=report(), headers={"Origin": ORIGIN}).status_code
    assert [send(), send(), send()] == [202, 202, 429]
    clock[0] += 60
    assert [send(), send()] == [202, 429]
    clock[0] += 3600
    assert send() == 202


def test_invalid_bodies_also_spend_the_global_cap(monkeypatch):
    monkeypatch.setattr(reports, "REPORTS_PER_MINUTE", 1)
    client = TestClient(app)
    assert client.post(PATH, content="{", headers={"Origin": ORIGIN}).status_code == 422
    assert client.post(PATH, json=report(), headers={"Origin": ORIGIN}).status_code == 429


def test_reports_have_no_public_reader():
    assert TestClient(app).get(PATH, headers={"Origin": ORIGIN}).status_code == 405
