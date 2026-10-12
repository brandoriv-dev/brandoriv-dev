# Install bounded published-ancestry cleanup

- Status: applied
- Verified: partly
- Checked: The bounded GitHub ancestry helper passed its Windows PowerShell fixtures; exact main CI passed; the installed source-bound canary and task readback passed. Root's authenticated preflight matched candidate `e9c578da827015a72035a5efebea83a287c27a68` to advertised main `80e3313f9d51f7b4e8a30dfd8e854df3517d6a91` (`ahead` by 5, `behind` by 0, base and merge base equal to the candidate). On the next installed-source batch, the actual scheduled action quarantined that exact task without fetching into its clone.
- Not checked: a naturally triggered 03:15 run has not yet been observed; five other completed clones remain safely retained for local changes/stashes or unpublished history. PR #160 is still pending to publish three archived Bstack history heads; the next cleanup run must verify their disposition. Purge remains off.
- When (UTC): 2026-10-12T02:52:28Z
- Actor: Codex for Brandon Rivera
- Target: Brandon workstation manager `C:\Users\Brandon\AppData\Local\BrandoRiv\WorkspaceManager`; Task Scheduler task `\BrandoRiv Workspace Manager Cleanup`
- Previous: Installed manager source `39d17fd817e860674eda1cb7f07f22730eae57fe`; script SHA-256 `90CC39930775872774AFC555B90F3ABE67D7CB2F8EC9D7D6BA8A043B9842397B`; daily task at 03:15 local with `MaxTasks 10`, `CleanupBudgetSeconds 600`, and purge off
- Deployed: Main `e9f928a2e6666ab2bd0936024bfd93fd2450770e`; installed script SHA-256 `0CA2B326849CAB34FB9C0D1FAF68B42935CEA0DB45A3200A1F39A98F86137BE0`; manifest SHA-256 `C62D58B17C403346F0F7126BB1203737B322597D397808156CD56BB9E26F8EA2`; canary `a679c2c6a1ac4ed7a893369fdad3bb86`; task Ready with the prior schedule and purge-off settings
- Operation: 2026-10-12-published-ancestry-cleanup
- Source: PR #154 ancestry fix, included in PR #155 merged main; PR #155 head `5944327b68b230a6a27f8c363c551202843b842e`; main CI run `38196374931`

## Intent

The installed cleanup run retained completed clones whose local copies lacked newer advertised GitHub commit objects. The source repair verifies exact advertised commit identities and ancestry through bounded authenticated GitHub API calls, without fetching into completed clones or changing publication, integrity, lease, or retention rules.

PR #154's ancestry repair was included in the installed PR #155 main source. The guarded installer captured rollback inputs, installed exact checked main, verified the script and manifest bytes, and passed canary `a679c2c6a1ac4ed7a893369fdad3bb86` before restoring the existing scheduled task. The readback retained the 03:15 local schedule, batch size 10, 600-second budget and purge-off action. A separate authenticated preflight proved the exact candidate/advertised-tip relation; the installed scheduled action later quarantined task `f82650c0e04746f69e305874cc40b934`, with no fetch into that clone. The first 2e861af run deferred after 600.026 seconds with three quarantines and zero review holds; the later e9f928a run quarantined four additional clones and retained five unrelated holds. No purge occurred, and no completed clone's refs or working tree were changed.

## Outcome

The installed source, canary, task readback and actual scheduled receipts are recorded above. Exact ancestry proof and quarantine receipts are in `C:\Workbench\ai-artifacts\2026-10-11\non-date-gated-completion\published-ancestry-preflight.json`, `published-ancestry-cleanup-completed.json`, and `C:\Workbench\ai-artifacts\2026-10-11\cleanup-path-check-performance\scheduled-cleanup-outcome-2-sanitized.json`. Five preserved tasks still need their specific handoffs/published ancestry before cleanup can finish; the pending Bstack history-preservation PR addresses three of them.
