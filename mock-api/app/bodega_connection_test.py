"""Bounded browser reports for the development WhatsApp connection experiment.

Reports are untrusted observations, including their run identifier and client clock. They grant
no identity or account access. The private runtime journal is the only sink; this router never
reads or changes business, session or provider state and offers no public report reader.
"""
from __future__ import annotations

import json
import logging
import threading
from collections import deque
from time import monotonic
from typing import Literal

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import UUID4, BaseModel, ConfigDict, Field, ValidationError

from .cedar_access import allowed_origin
from .errors import RuntimeError_

router = APIRouter(prefix="/api/bodega/connection-test", tags=["bodega-connection-test"])
logger = logging.getLogger("rocoto.runtime.bodega.connection_test")
MAX_BODY_BYTES = 8 * 1024
REPORTS_PER_MINUTE = 120
REPORTS_PER_HOUR = 1000
_minute: deque[float] = deque()
_hour: deque[float] = deque()
_lock = threading.Lock()


class Event(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    at: int = Field(ge=0, le=8_640_000_000_000_000)
    page: int = Field(ge=0, le=10000)
    attempt: int = Field(ge=0, le=1000)
    kind: Literal[
        "load", "visibility", "pagehide", "pageshow", "launch", "status", "completion", "failure",
        "provider_event",
    ]
    value: Literal[
        "opening", "authorizing", "exchanging", "awaiting_details", "connecting",
        "visible", "hidden", "persisted", "fresh", "session", "network", "provider", "complete",
        "cancel", "error", "finish", "finish_coexistence",
    ] | None = None


class Report(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    runId: UUID4
    events: list[Event] = Field(min_length=1, max_length=10)


def _spend() -> None:
    """A process-wide bound, including invalid bodies; client-chosen IDs allocate no buckets."""
    now = monotonic()
    with _lock:
        while _minute and _minute[0] <= now - 60:
            _minute.popleft()
        while _hour and _hour[0] <= now - 3600:
            _hour.popleft()
        if len(_minute) >= REPORTS_PER_MINUTE or len(_hour) >= REPORTS_PER_HOUR:
            raise RuntimeError_("connection_test_recent", "Reports continue after a short pause.", 429)
        _minute.append(now)
        _hour.append(now)


@router.post("/events")
async def receive_events(request: Request) -> JSONResponse:
    origin = request.headers.get("origin", "")
    if not origin or not allowed_origin(origin):
        raise RuntimeError_("connection_test_origin", "Open the test at its development address.", 403)
    _spend()
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > MAX_BODY_BYTES:
            raise RuntimeError_("connection_test_size", "Send up to ten short test events.", 413)
        body.extend(chunk)
    try:
        report = Report.model_validate_json(body)
    except ValidationError:
        # Framework validation can echo an input or field name. Keep this response and log fixed.
        raise RuntimeError_("connection_test_shape", "Send the supported test event fields.", 422) from None
    safe = {"source": "browser_reported", **report.model_dump(mode="json", exclude_none=True)}
    # The runtime formatter preserves msg and kind; arbitrary structured extras are dropped.
    logger.info("%s", json.dumps(safe, separators=(",", ":")), extra={"kind": "connection_test"})
    return JSONResponse(
        {"accepted": True}, status_code=202,
        headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"},
    )
