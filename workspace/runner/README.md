# Device runner

`DESKTOP-FFHBMGE` runs this repository's Actions checks and Cloudflare deployment
through Docker Desktop's Linux engine. The PC must be awake, online and signed
in. Cloudflare still serves the site when the PC is offline; jobs wait for the PC.

Build the pinned image from an owned workspace:

```powershell
docker --context desktop-linux build --tag brandoriv-dev-runner:2.338.0 workspace/runner
powershell.exe -NoProfile -ExecutionPolicy Bypass -File workspace/runner/device-runner.ps1 -Check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File workspace/runner/device-runner.ps1
```

The supervisor uses the Windows user's existing Git Credential Manager login
only to obtain short-lived runner registration tokens. It starts an unprivileged
Linux container with no host mounts, no Docker socket, limited resources and no
extra capabilities. Each registered runner accepts one job, unregisters itself,
and loses its filesystem before the next runner is created. This prevents PR
code from persisting into a later deployment. Do not attach Windows files or
credentials to this container.

CI runs owner-authored changes from this repository. Fork workflows require
approval from all external contributors; do not approve unreviewed workflows.
The manual paid model study remains manual and requires its existing API secret.
Runner updates follow GitHub's automatic updater; update the image when runner
or Playwright requirements change.

The installed supervisor belongs under
`%LOCALAPPDATA%\BrandoRiv\ActionsRunner\brandoriv-dev`. Its user logon task starts
Docker Desktop and then the supervisor. Its log is local; Actions logs stay in
GitHub. Stop the task to pause job handling; let an active job finish before
stopping or changing its container.

Deployment needs the GitHub `production` environment restricted to `main`, with
`CLOUDFLARE_API_TOKEN` and the current `PUBLIC_WEB3FORMS_KEY` if the contact form
uses one. Keep the token out of this image and the Windows runner directory.
Disable the Worker's Cloudflare Builds integration after a verified device
deployment so provider builds do not run as well.

This public repository cannot call the private `brandoriv-dev/cicd` reusable
workflows. The portfolio workflow invokes its existing, repository-specific
`bun run deploy` command; no generic shared deployment logic is copied here.
