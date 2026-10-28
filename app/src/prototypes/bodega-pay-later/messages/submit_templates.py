#!/usr/bin/env python3
"""Submit this prototype's WhatsApp templates to Meta, one POST per template.

Reads templates.json beside this file and posts each element to
https://graph.facebook.com/v21.0/{META_WABA_ID}/message_templates with a bearer token from the
environment. One line is printed per template: its name, then the status Meta returns or the error
body it answers with. Credentials come from META_WABA_ID and META_SYSTEM_USER_TOKEN and stay in the
environment: the token is never written to a file, a log line or this repository.

  META_WABA_ID=... META_SYSTEM_USER_TOKEN=... python3 submit_templates.py
  python3 submit_templates.py --dry-run          # the payloads alone, credentials optional
  python3 submit_templates.py --only shop_ready  # one template

MESSAGES.md holds each template's category, its parameters and the argument that keeps it in that
category. Standard library only, Python 3.11 or newer.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

GRAPH_VERSION = os.environ.get("META_GRAPH_VERSION", "v21.0")
DEFAULT_FILE = Path(__file__).with_name("templates.json")
TIMEOUT_SECONDS = 30


def load(path: Path) -> list[dict]:
    """The templates in one file, checked far enough to name a broken entry before any send."""
    payloads = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payloads, list):
        raise ValueError(f"{path}: the file holds one JSON array of template payloads")
    for index, payload in enumerate(payloads):
        if not isinstance(payload, dict) or not payload.get("name"):
            raise ValueError(f"{path}: entry {index} needs an object with a name")
    return payloads


def one_line(text: str, limit: int = 400) -> str:
    """Any response body as a single line, so one template keeps one line of output."""
    return " ".join(text.split())[:limit]


def submit(waba_id: str, token: str, payload: dict) -> tuple[bool, str]:
    """POST one template. Returns whether Meta accepted it, and the line to print."""
    request = urllib.request.Request(
        f"https://graph.facebook.com/{GRAPH_VERSION}/{waba_id}/message_templates",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        return False, f"HTTP {error.code} · {one_line(error.read().decode('utf-8', 'replace'))}"
    except urllib.error.URLError as error:
        return False, f"unreachable · {error.reason}"
    except (OSError, ValueError) as error:
        return False, f"failed · {one_line(str(error))}"
    parts = [str(body.get(field)) for field in ("status", "category") if body.get(field)]
    if body.get("id"):
        parts.append(f"id={body['id']}")
    return True, " · ".join(parts) or one_line(json.dumps(body, ensure_ascii=False))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Submit templates.json to the WhatsApp Graph API.")
    parser.add_argument("file", nargs="?", type=Path, default=DEFAULT_FILE,
                        help="the payload file (default: templates.json beside this script)")
    parser.add_argument("--dry-run", action="store_true",
                        help="print the payloads and send nothing; credentials stay optional")
    parser.add_argument("--only", action="append", metavar="NAME",
                        help="submit the named template alone; repeat for several")
    arguments = parser.parse_args(argv)

    try:
        payloads = load(arguments.file)
    except (OSError, ValueError) as error:
        print(error, file=sys.stderr)
        return 2
    if arguments.only:
        wanted = set(arguments.only)
        missing = sorted(wanted - {payload["name"] for payload in payloads})
        if missing:
            print(f"{arguments.file}: it holds no template named {', '.join(missing)}", file=sys.stderr)
            return 2
        payloads = [payload for payload in payloads if payload["name"] in wanted]

    if arguments.dry_run:
        for payload in payloads:
            print(json.dumps(payload, ensure_ascii=False))
        return 0

    waba_id = os.environ.get("META_WABA_ID", "").strip()
    token = os.environ.get("META_SYSTEM_USER_TOKEN", "").strip()
    absent = [name for name, value in (("META_WABA_ID", waba_id), ("META_SYSTEM_USER_TOKEN", token))
              if not value]
    if absent:
        print(f"set {' and '.join(absent)} in the environment, then run this again; "
              f"--dry-run prints the payloads meanwhile", file=sys.stderr)
        return 2

    accepted = True
    for payload in payloads:
        sent, line = submit(waba_id, token, payload)
        accepted = accepted and sent
        print(f"{payload['name']} · {line}", flush=True)
    return 0 if accepted else 1


if __name__ == "__main__":
    sys.exit(main())
