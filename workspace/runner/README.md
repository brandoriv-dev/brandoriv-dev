# Device runner

`DESKTOP-FFHBMGE` runs Actions checks, agent review and existing deployments
through Docker Desktop's Linux engine. The PC must be awake, online and signed
in. Hosting continues to serve applications when the PC is offline; jobs wait
for the PC. Existing Azure OIDC and Cloudflare deployment credentials remain in
GitHub and are supplied only to the jobs that need them.

Build the pinned image from an owned workspace:

```powershell
docker --context desktop-linux build --tag brandoriv-dev-runner:2.338.0-fleet workspace/runner
powershell.exe -NoProfile -ExecutionPolicy Bypass -File workspace/runner/device-runner.ps1 -Organization -Check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File workspace/runner/device-runner.ps1 -Organization
```

The image provides Node 24, Bun 1.4.2, .NET SDK 10.0.401, GitHub CLI, Azure CLI
2.91.0, Bicep 0.48.1, Docker CLI 29.8.0 and Playwright 1.63.0 with Chromium and
its operating-system dependencies. Workflows can install their own Node, .NET
and Playwright versions in writable directories. Install Chromium with
`npx playwright install chromium`; operating-system package installation needs
root and belongs in this image.

The supervisor uses the Windows user's GitHub CLI organization login or Git
Credential Manager repository login only to obtain short-lived runner
registration tokens. These credentials stay on Windows. It starts an unprivileged
Linux container with no host mounts, no Docker socket, limited resources and no
extra capabilities. Each registered runner accepts one job, unregisters itself,
and loses its filesystem before the next runner is created. This prevents PR
code from persisting into a later deployment. Do not attach Windows files or
credentials to this container.

## Private repositories and Docker checks

The private fleet uses `brandoriv-private` and the organization's `device-private`
runner group, restricted to its six private repositories. The public portfolio
uses a separate repository runner without a Docker sidecar. The private runner
shares the network namespace of a new, per-job rootless
Docker daemon. Container builds and disposable SQL Server use that daemon;
they cannot inspect or manage Docker Desktop's other containers. SQL Server's
published `127.0.0.1:1433` is reachable from the job, matching the existing SQL
integration workflow.

The sidecar uses the official pinned image
`docker:29.8.0-dind-rootless@sha256:03d00e52a056d9126139f7fb1bafd890552b89382b97b783a35b9b87fdc13f4b`.
It needs `--privileged` for nested user namespaces, but runs its daemon as the
image's `rootless` user. Its Docker API is forwarded only to loopback inside
the shared namespace, with no workstation port publication:

```text
--env DOCKER_TLS_CERTDIR=
--env "DOCKERD_ROOTLESS_ROOTLESSKIT_FLAGS=-p 127.0.0.1:2375:2375/tcp"
<pinned image> dockerd --host=tcp://0.0.0.0:2375 --tls=false
```

The job uses `--network container:<sidecar>` and
`DOCKER_HOST=tcp://127.0.0.1:2375`. Explicit `dockerd` bypasses the image's default
forwarder, which would listen on every interface. TLS is disabled only for this
unpublished loopback API. Remove both containers and the sidecar's anonymous
volumes after every job (`docker rm --volumes`); never reuse the daemon between
PR verification and deployment. Keep the sidecar unavailable to public or
unreviewed fork jobs. Rootless Docker reduces daemon privileges but the outer
privileged container still shares Docker Desktop's Linux kernel.

Before changing the image or daemon configuration, run
`bash workspace/runner/verify-runtime.sh --sql` inside a disposable private test
runner with a fresh sidecar. It checks nonroot execution, a real nested Docker
build, Bicep compilation, .NET compilation, Chromium, and synthetic loopback SQL
Server. The script creates its own random test password and removes its test
database container and image. It must not run alongside a real job using port
1433. Omit `--sql` for a toolchain check when that port is already occupied.

CI runs owner-authored changes from this repository. Fork workflows require
approval from all external contributors; do not approve unreviewed workflows.
The manual paid model study remains manual and requires its existing API secret.
Runner updates follow GitHub's automatic updater; update the image when runner
or Playwright requirements change.

The installed supervisors belong under
`%USERPROFILE%\Documents\BrandoRiv\ActionsRunner\brandoriv-private` and
`brandoriv-dev`. GitHub CLI belongs under `Documents\BrandoRiv\Tools\gh\bin`
and its nonsecret configuration under `Documents\BrandoRiv\Config\gh`; the
login token remains in Windows Credential Manager. Documents paths are visible
to both Codex and Task Scheduler; Codex's MSIX package virtualizes AppData writes.
Each user logon task starts Docker Desktop and then the supervisor. Actions logs stay in
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
