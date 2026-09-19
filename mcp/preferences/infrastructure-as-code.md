# Infrastructure-as-Code Preferences

- Inspect the deployed environment, state, parameters, and repository conventions before changing infrastructure.
- Prefer the smallest declarative change and reuse established modules only when their contract fits.
- Pin or constrain provider, module, API, and runtime versions according to the project's policy.
- Keep secrets out of source, outputs, deployment logs, and non-secret parameter files; reference the platform's secret store.
- Treat identity, networking, public exposure, data deletion, and role assignments as high-impact changes requiring explicit review.
- Run the native validation, formatting, lint, plan or what-if, and policy checks before deployment.
- Report replacements, deletions, permission expansion, downtime, migration needs, and rollback limitations clearly.
