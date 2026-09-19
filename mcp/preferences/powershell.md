# PowerShell Preferences

- Follow the repository's PowerShell analyzer and formatting configuration.
- Use approved Verb-Noun names for reusable functions and descriptive parameter names.
- Prefer cmdlets and typed objects over parsing display text or composing commands as strings.
- Use `-LiteralPath` for user-controlled or computed paths and validate resolved targets before destructive operations.
- Set explicit error behavior where failure matters; preserve useful error context instead of silently continuing.
- Avoid leaking secrets through command lines, logs, transcripts, URLs, or process arguments.
- Make scripts idempotent where practical, support `-WhatIf` for consequential changes, and test both success and failure paths.
