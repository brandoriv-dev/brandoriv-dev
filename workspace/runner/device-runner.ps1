[CmdletBinding()]
param([switch]$Organization, [switch]$Once, [switch]$Check)

$ErrorActionPreference = 'Stop'
$repo = 'brandoriv-dev/brandoriv-dev'
$scope = if ($Organization) { 'https://github.com/brandoriv-dev' } else { "https://github.com/$repo" }
$apiScope = if ($Organization) { 'orgs/brandoriv-dev' } else { "repos/$repo" }
$label = if ($Organization) { 'brandoriv-private' } else { 'brandoriv-dev' }
$container = "$label-runner"
$sidecar = "$label-docker"
$image = if ($Organization) { 'brandoriv-dev-runner:2.338.0-fleet' } else { 'brandoriv-dev-runner:2.338.0' }
$dockerImage = 'docker:29.8.0-dind-rootless@sha256:03d00e52a056d9126139f7fb1bafd890552b89382b97b783a35b9b87fdc13f4b'
$dockerContext = 'desktop-linux'
$ghExe = Join-Path $env:USERPROFILE 'Documents\BrandoRiv\Tools\gh\bin\gh.exe'
$env:GH_CONFIG_DIR = Join-Path $env:USERPROFILE 'Documents\BrandoRiv\Config\gh'
$mutex = New-Object Threading.Mutex($false, "Local\BrandoRivActionsRunner-$label")
try { $acquired = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $acquired = $true }
if (-not $acquired) { $mutex.Dispose(); throw 'The device runner supervisor is already running.' }

function Invoke-Docker([string[]]$Arguments) {
    $result = & docker --context $dockerContext @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Docker command failed ($LASTEXITCODE): $($Arguments[0])" }
    return $result
}

function Get-GitHubHeaders {
    if ($Organization) {
        $token = & $ghExe auth token --hostname github.com
        if ($LASTEXITCODE -ne 0 -or -not $token) { throw 'Sign in to GitHub CLI with organization runner administration access.' }
    } else {
        $credential = ("protocol=https" + [char]10 + "host=github.com" + [char]10 + [char]10) | git -c credential.interactive=never credential fill 2>$null
        if ($LASTEXITCODE -ne 0) { throw 'GitHub sign-in is unavailable in Git Credential Manager.' }
        $password = @($credential | Where-Object { $_ -like 'password=*' })
        if ($password.Count -ne 1) { throw 'Git Credential Manager returned no GitHub credential.' }
        $token = $password[0].Substring(9)
    }
    return @{ Authorization = ('Bearer ' + $token); Accept = 'application/vnd.github+json'; 'X-GitHub-Api-Version' = '2022-11-28'; 'User-Agent' = 'BrandoRiv-device-runner' }
}

function Get-OwnedContainer([string]$Name) {
    $id = Invoke-Docker -Arguments @('container', 'ls', '--all', '--filter', "name=^/$Name$", '--format', '{{.ID}}')
    if (-not $id) { return $null }
    $json = Invoke-Docker -Arguments @('container', 'inspect', $Name)
    $state = @(($json -join [Environment]::NewLine) | ConvertFrom-Json)[0]
    $owned = $state.Config.Labels.'dev.brandoriv.runner-scope' -eq $scope
    # Resume the repository container registered before the fleet migration.
    if (-not $Organization -and $state.Config.Labels.'dev.brandoriv.repository' -eq $repo) { $owned = $true }
    if (-not $owned) { throw "Container $Name belongs to another workload; refusing to change it." }
    return $state
}

function Remove-OwnedContainer([string]$Name) {
    $state = Get-OwnedContainer $Name
    if (-not $state) { return }
    if ($state.State.Running) { Invoke-Docker -Arguments @('stop', '--time', '30', $Name) | Out-Null }
    Invoke-Docker -Arguments @('rm', '--volumes', $Name) | Out-Null
}

$transcribing = $false
try {
    if (-not $Check) {
        Start-Transcript -Path (Join-Path $PSScriptRoot 'runner.log') -Append | Out-Null
        $transcribing = $true
        & docker desktop start --detach | Out-Null
    }
    do {
        try {
            if ((Invoke-Docker -Arguments @('info', '--format', '{{.OSType}}')) -ne 'linux') { throw 'Start Docker Desktop with its Linux engine.' }
            Invoke-Docker -Arguments @('image', 'inspect', $image, '--format', '{{.Id}}') | Out-Null
            if ($Organization) { Invoke-Docker -Arguments @('image', 'inspect', $dockerImage, '--format', '{{.Id}}') | Out-Null }
            $headers = Get-GitHubHeaders
            if ($Organization) {
                $groups = Invoke-RestMethod -Uri "https://api.github.com/$apiScope/actions/runner-groups" -Headers $headers
                $group = @($groups.runner_groups | Where-Object name -eq 'device-private')
                if ($group.Count -ne 1 -or $group[0].allows_public_repositories -or $group[0].visibility -ne 'selected') { throw 'The selected private-only device-private group is required.' }
            } else {
                $repository = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo" -Headers $headers
                if (-not $repository.permissions.admin) { throw 'Repository admin access is required to register the runner.' }
            }
            $headers = $null
            break
        } catch {
            $headers = $null
            if ($Check -or $Once) { throw }
            Write-Warning $_.Exception.Message
            Start-Sleep -Seconds 30
        }
    } while ($true)
    if ($Check) { Write-Output "Linux runtime and GitHub runner access verified for $label."; return }

    do {
        $createdRunner = $false
        try {
            $existing = Get-OwnedContainer $container
            if ($existing -and $existing.State.Running) {
                if ($Organization) {
                    $daemon = Get-OwnedContainer $sidecar
                    if (-not $daemon -or -not $daemon.State.Running) { throw 'The existing runner has no running isolated Docker daemon.' }
                }
                Write-Output 'Resuming the existing isolated runner container.'
            } else {
                Remove-OwnedContainer $container
                if ($Organization) {
                    Remove-OwnedContainer $sidecar
                    Invoke-Docker -Arguments @('run', '--detach', '--name', $sidecar, '--label', "dev.brandoriv.runner-scope=$scope", '--privileged', '--memory', '8g', '--cpus', '4', '--pids-limit', '2048', '--log-opt', 'max-size=10m', '--log-opt', 'max-file=3', '--env', 'DOCKER_TLS_CERTDIR=', '--env', 'DOCKERD_ROOTLESS_ROOTLESSKIT_FLAGS=-p 127.0.0.1:2375:2375/tcp', $dockerImage, 'dockerd', '--host=tcp://0.0.0.0:2375', '--tls=false') | Out-Null
                }
                $headers = Get-GitHubHeaders
                $registration = Invoke-RestMethod -Method Post -Uri "https://api.github.com/$apiScope/actions/runners/registration-token" -Headers $headers
                $headers = $null
                $arguments = @('create', '--name', $container, '--label', "dev.brandoriv.runner-scope=$scope", '--memory', '6g', '--cpus', '4', '--pids-limit', '2048', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--log-opt', 'max-size=10m', '--log-opt', 'max-file=3')
                if ($Organization) { $arguments += @('--network', "container:$sidecar", '--env', 'DOCKER_HOST=tcp://127.0.0.1:2375') }
                $arguments += $image
                Invoke-Docker -Arguments $arguments | Out-Null
                $createdRunner = $true
                Invoke-Docker -Arguments @('start', $container) | Out-Null
                $runnerName = "$env:COMPUTERNAME-$label-$([Guid]::NewGuid().ToString('N').Substring(0,8))"
                $configureArguments = @('--context', $dockerContext, 'exec', '-i', $container, 'bash', './configure.sh', $runnerName, $scope, $label)
                if ($Organization) { $configureArguments += 'device-private' }
                # Only the one-hour registration token enters the job container.
                $registration.token | & docker @configureArguments | Out-Null
                $registration = $null
                if ($LASTEXITCODE -ne 0) { throw 'GitHub runner registration failed.' }
                Write-Output "Registered $runnerName. Waiting for one job."
            }
            $exitCode = Invoke-Docker -Arguments @('wait', $container)
            Write-Output "Runner container finished with code $exitCode."
            Remove-OwnedContainer $container
            if ($Organization) { Remove-OwnedContainer $sidecar }
        } catch {
            $headers = $null
            $registration = $null
            Write-Warning $_.Exception.Message
            if ($createdRunner) { Remove-OwnedContainer $container }
            if ($Organization -and -not (Get-OwnedContainer $container)) { Remove-OwnedContainer $sidecar }
            if ($Once) { throw }
            Start-Sleep -Seconds 30
        }
    } while (-not $Once)
} finally {
    $headers = $null
    $registration = $null
    $mutex.ReleaseMutex()
    $mutex.Dispose()
    if ($transcribing) { Stop-Transcript | Out-Null }
}

