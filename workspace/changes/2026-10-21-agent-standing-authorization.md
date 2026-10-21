# Allow requested delivery without repeated approval

- Status: applied
- Verified: partly
- Checked: Codex, Claude Code, and Pi installed instructions contain the canonical standing authorization; installed Workbench operating contract matches the canonical contract; original Bstack activation and credential protections remain intact; old blanket current-message approval phrases are absent from those installed files
- Not checked: behavioral model compliance and legacy HerdrEnvironment bootstrap regeneration; its config/agent-tools.md source was not found locally
- When (UTC): 2026-10-21T01:43:19Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation instruction files `C:/Users/Brandon/.codex/AGENTS.md`, `C:/Users/Brandon/.claude/CLAUDE.md`, `C:/Users/Brandon/.pi/agent/AGENTS.md`, and `C:/Workbench/AGENTS.md`
- Previous: routine push, merge, deployment, and remote changes required explicit authorization in the current message
- Deployed: standing authorization from workspace/agent-authorization.md installed outside legacy bootstrap blocks in all three client instruction files; corresponding Workbench operating contract applied without replacing unrelated sections
- Operation: agent-standing-authorization

## Intent

Brandon requested removal of the repeated authorization blocks after a feature
stopped at merge instead of reaching deployment. A delivery request now authorizes
routine execution through verified deployment to established targets. New visual
and key technical decisions remain Brandon's to approve.

## Outcome

Updated all four installed instruction files and the tracked Workbench source
contract. Added a canonical shared policy for the three client instruction files.
Brandon's subsequent in-chat instructions independently confirmed the installed
standing authorization. Existing credentials, tool permissions, CI gates,
manifest boundaries, and cloud roles were not modified.

The old tool block names a HerdrEnvironment source absent from the local source
locations checked. Its installed approval paragraph was updated, while the shared
policy remains outside that managed block and explicitly supersedes older blanket
current-message restrictions if a legacy bootstrap later reintroduces one.
No claim is made that the missing bootstrap source was changed or tested.

Instruction-only backups and verification evidence are retained under
`C:/Workbench/ai-artifacts/2026-10-20/agent-standing-authorization/`.
Rollback requires restoring those local backups as well as reverting the tracked
policy; reverting Git alone does not change installed instruction files.
