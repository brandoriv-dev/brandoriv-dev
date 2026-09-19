# TypeScript and JavaScript Preferences

- Follow the repository's formatter, linter, module, runtime, and package-manager configuration.
- Prefer TypeScript when the project already uses it; preserve strictness and avoid `any` unless the boundary is genuinely untyped and documented.
- Model uncertain external data as `unknown`, then validate or narrow it at the boundary.
- Prefer small named functions and straightforward control flow over compressed expressions or clever type machinery.
- Keep browser, server, and build-time code boundaries explicit. Do not expose secrets to client bundles.
- Preserve framework conventions for React, Astro, Node.js, and the active runtime rather than introducing parallel patterns.
- Handle promises deliberately; do not leave floating promises or swallow rejected operations.
- Add or update focused tests for behavior changes and run the configured type-check, lint, and test commands.
