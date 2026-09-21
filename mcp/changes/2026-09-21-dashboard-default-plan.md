# Dashboard default rule and active-dashboard alignment plan

- **Status:** Implemented and verified locally; publication pending.
- **Recorded on (UTC):** 2026-09-21
- **Actor:** Codex on Brandon's behalf
- **Targets:** MCP policy catalog and console in this repository; Harness in `agent-harness`; Trading Agent in `trading-agent`
- **Intent:** Add an explicitly invoked `/dashboard-default` rule based on the approved Relay mockup, then use that rule to reshape the three active operational dashboards around a concise state summary, one dominant working visualization, supporting detail on demand, neutral surfaces, and mobile-first primary navigation.
- **Scope boundary:** The new rule is not automatically routed by generic dashboard or frontend language. It is selected only by `/dashboard-default` or an explicit category request. Existing product behavior, authentication, safety controls, and data contracts remain unchanged.
- **Verification:** Full repository tests; desktop and 390-pixel phone screenshots for Harness and Trading; MCP build and routing/policy checks; source regression assertions for the new information hierarchy.
- **Rollback:** Revert the dashboard-default policy/catalog commit and each dashboard-specific redesign commit independently. No data migration is involved.
