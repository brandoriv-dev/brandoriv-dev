# Register the central CI/CD repository with Workspace Manager

- Status: planned
- Verified: not checked
- Checked: the new private `BrandoRiv/cicd` repository and `C:\Workbench\cicd` audit clone exist
- Not checked: the installed manager has not yet been refreshed or used to allocate a `cicd` task
- When (UTC): 2026-09-25T00:00:00Z
- Actor: Codex for Brandon Rivera
- Target: local Workspace Manager manifest and installed configuration for repository key `cicd`
- Previous: installed manifest without a `cicd` repository entry
- Deployed: pending
- Operation: central-cicd-workflows

## Intent

Register the new central workflow repository so agents can follow the same leased
clone policy used by the application repositories. The fixed clone remains an
audit-only baseline; implementation must occur in a manager-created task clone.

## Outcome

Pending installation and an allocation check.
