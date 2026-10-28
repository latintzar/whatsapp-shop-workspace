# Agent guide

Functional title: **Shop records from WhatsApp**. This is the historical advanced Rocoto Peru source, baseline `e4801f58454c3a7fa639d0570b71f3434d2dc759`. Preserve its matched Bodega/Cedar/Copper/Android closure; the sibling ERP uses another main lineage.

Read README, docs/architecture.md and docs/status.md. The skill `.agents/skills/install-shop-workspace/SKILL.md` provides own-account installation. `make build` and `make test` cover the source package; `tools/first-result.py` optionally proves the actual local UI/API.

Keep the real UI and merchant review/provenance boundaries. Synthetic inputs and provider facts retain their declared sources. Use the recipient's explicitly selected accounts; collect credentials through hidden/private input. Messages, contacts, signing keys and runtime databases remain private. Default local startup uses isolated synthetic state and loopback-only Python networking.

Provider calls, sending, fiscal actions, signed native publication and deployment keep their explicit authorized scope. Report actual checks and remaining acceptance. Preserve MIT ownership and dependency notices.
