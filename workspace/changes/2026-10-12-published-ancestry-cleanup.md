# Install bounded published-ancestry cleanup

- Status: planned
- Verified: not checked
- Checked: The cleanup regression suite passes in Windows PowerShell 5.1, including bounded request deadlines, malformed GitHub responses, proof-limit retention, duplicate-proof reuse, annotated-tag peeling, and unchanged local refs and working tree. The integration and CLI lifecycle suites passed on this source before the final bounded-query refinements.
- Not checked: Hosted checks for the final PR revision, the installed-source canary, and the next scheduled cleanup receipt. No installation or scheduler change has occurred.
- When (UTC): 2026-10-12 (planned; exact execution time pending)
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation manager `C:\Users\Brandon\AppData\Local\BrandoRiv\WorkspaceManager`; Task Scheduler task `\BrandoRiv Workspace Manager Cleanup`
- Previous: Installed manager source `39d17fd817e860674eda1cb7f07f22730eae57fe`; script SHA-256 `90CC39930775872774AFC555B90F3ABE67D7CB2F8EC9D7D6BA8A043B9842397B`; existing task definition and installation rollback files to be captured before the operation
- Deployed: Planned only: exact checked merged main, installed-byte readback, a fresh source-bound canary, and the existing daily task preserved at 03:15 local with batch 10, cleanup budget 600 seconds, and purge off
- Operation: 2026-10-12-published-ancestry-cleanup
- Source: PR #154; merged main SHA and hosted run pending

## Intent

The installed cleanup run retained completed clones whose local copies lacked newer advertised GitHub commit objects. The source repair verifies exact advertised commit identities and ancestry through bounded authenticated GitHub API calls, without fetching into completed clones or changing publication, integrity, lease, or retention rules.

After PR #154 merges with all five required checks passing, capture the current manager, manifest, installation metadata, and task definition as rollback inputs. Install the exact checked main and compare installed bytes with that source. Run a fresh installed-source canary and require its marker to identify those exact bytes before re-enabling the existing daily task. Keep its 03:15 local schedule, batch size 10, 600-second cleanup budget, and purge-off action. Then run the actual Workspace Manager scheduled cleanup and verify whether the completed clean clone `f82650c0e04746f69e305874cc40b934` is recognized through its exact live published ancestry. Do not fetch into that completed clone, run purge, or alter its refs or working tree.

## Outcome

This is a preparation record. No external installation, task registration, cleanup, or purge has occurred. The installed script SHA-256 is recorded above as the rollback identity; capture the complete rollback inputs and record the actual installed source, canary, task readback, and cleanup receipt after execution.
