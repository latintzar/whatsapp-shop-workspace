# Supervised assistance pilot

This pilot tests whether a Rocoto operator can help an existing Bodega contact achieve one concrete
result during one week. The merchant may use a direct WhatsApp chat, a connected WhatsApp Business
account or the app. The operator records only what the merchant deliberately shares and reviews the
case before any conclusion is treated as established.

The first slice is an operator-only local record. It adds no browser surface, webhook behavior,
provider connection, outbound message, media download or model call. The command runs with the OS
access already required for the private runtime state and uses `bodega-rig.sqlite`, whose file is
opened as a regular `0600` file with `O_NOFOLLOW` and SQLite `secure_delete`.

## Case contract

A case belongs to one existing `businesses.phone` identity and one named operator. Opening it
requires an explicit consent time and a short operator record of how the merchant agreed. The case
stores the merchant's stated objective, the chosen one-week success criterion, next action, agreed
follow-up and status. A mutation must match the case id, merchant phone and owner operator together.

Evidence is append-only. Every item has its capture actor and time, the observed time, a source
channel and a source reference. Text is literal. A location has native latitude and longitude, an
optional merchant-facing label and a separate confirmation bit; it remains tentative until the
merchant explicitly confirms it. A photo or voice note stores an opaque custody/provider reference
and declared media type. This record contains no OCR, transcript, inferred financial fact or other
media interpretation. `unknowns` says what the evidence leaves unresolved.

The supported provenance channels are `manual_call`, `direct_whatsapp`, `business_whatsapp` and
`app`. `manual_call` identifies an operator-entered note; the other labels describe where the
merchant shared the item and do not claim that Rocoto verified a provider event.

Cases move `open → reviewed → closed`. Later evidence on a reviewed case returns it to `open` and
clears the earlier review marker, so the merchant's actual result receives a fresh review. Closed
cases and their evidence become eligible for deletion 30 days after `closed_at`. Open and reviewed
cases remain for the duration of the active pilot, until closure or consent withdrawal; ending the
pilot requires closing or deleting every remaining case. Consent withdrawal deletes the scoped case
and its evidence immediately. The local purge is manual, dry-run by default, and removes eligible
records only with `--apply`. This is the pilot's narrow retention rule; media bytes remain outside
this store under their owner's custody.

## Operator interface

Sensitive and free-text input travels as one JSON object through stdin or a private file, keeping it
out of shell history. The operator name is an explicit audit label; OS access to the private state is
the actual access boundary. Output masks the merchant phone.

```bash
cd mock-api
ROCOTO_RUNTIME_STATE_DIR=/home/peter/.local/state/rocoto/bodega-assistance \
  python -m app.bodega_cases --operator peter open --input /private/case.json
ROCOTO_RUNTIME_STATE_DIR=/home/peter/.local/state/rocoto/bodega-assistance \
  python -m app.bodega_cases --operator peter add-evidence --input - < /private/evidence.json
ROCOTO_RUNTIME_STATE_DIR=/home/peter/.local/state/rocoto/bodega-assistance \
  python -m app.bodega_cases --operator peter show --input /private/case-key.json
ROCOTO_RUNTIME_STATE_DIR=/home/peter/.local/state/rocoto/bodega-assistance \
  python -m app.bodega_cases --operator peter status --input /private/review.json
ROCOTO_RUNTIME_STATE_DIR=/home/peter/.local/state/rocoto/bodega-assistance \
  python -m app.bodega_cases --operator peter withdraw-consent --input /private/case-key.json
ROCOTO_RUNTIME_STATE_DIR=/home/peter/.local/state/rocoto/bodega-assistance \
  python -m app.bodega_cases --operator peter purge
ROCOTO_RUNTIME_STATE_DIR=/home/peter/.local/state/rocoto/bodega-assistance \
  python -m app.bodega_cases --operator peter purge --apply
```

`open` requires `merchant_phone`, `merchant_consent: true`, `consent_at`, `consent_record`,
`objective`, `week_outcome`, `next_action` and `follow_up`. Every command which addresses a case
receives both `case_id` and `merchant_phone`; this is deliberate defense against editing a case under
the wrong merchant. `status` accepts `reviewed` or `closed` plus the current next action and follow-up.

## Acceptance

- A case cannot open for an absent Bodega identity or without recorded merchant consent.
- Case writes cannot cross the merchant or owning operator boundary.
- Evidence preserves its literal value, provenance and unknowns; media gains no derived meaning.
- A location is tentative by default and only an explicit true value confirms it.
- Review and close transitions are ordered; a closed case is immutable.
- Retrying the same scoped evidence provenance returns its existing record.
- Consent withdrawal deletes the scoped case and its evidence immediately.
- The 30-day closed-case purge previews the exact case ids before deleting each case and its evidence.
- The existing Bodega database is upgraded additively and retains earlier tables and rows.
