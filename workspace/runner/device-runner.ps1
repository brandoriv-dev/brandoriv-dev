[CmdletBinding()]
param([switch]$Once, [switch]$Check)

$ErrorActionPreference = 'Stop'
$repo = 'brandoriv-dev/brandoriv-dev'
$container = 'brandoriv-dev-runner'
$image = 'brandoriv-dev-runner:2.338.0'
$dockerContext = 'desktop-linux'
$mutex = New-Object Threading.Mutex($false, 'Local\BrandoRivActionsRunner-brandoriv-dev')
try { $acquired = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $acquired = $true }
if (-not $acquired) { $mutex.Dispose(); throw 'The device runner supervisor is already running.' }

function Invoke-Docker([string[]]$Arguments) {
    $result = & docker --context $dockerContext @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Docker command failed ($LASTEXITCODE): $($Arguments[0])" }
    return $result
}

function Get-GitHubHeaders {
    $credential = "protocol=https`nhost=github.com`n`n" | git -c credential.interactive=never credential fill 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'GitHub sign-in is unavailable in Git Credential Manager.' }
    $password = @($credential | Where-Object { $_ -like 'password=*' })
    if ($password.Count -ne 1) { throw 'Git Credential Manager returned no GitHub credential.' }
    return @{ Authorization = ('Bearer ' + $password[0].Substring(9)); Accept = 'application/vnd.github+json'; 'X-GitHub-Api-Version' = '2022-11-28'; 'User-Agent' = 'BrandoRiv-device-runner' }
}

try {
    $os = Invoke-Docker -Arguments @('info', '--format', '{{.OSType}}')
    if ($os -ne 'linux') { throw 'Start Docker Desktop with its Linux engine before starting the runner.' }
    Invoke-Docker -Arguments @('image', 'inspect', $image, '--format', '{{.Id}}') | Out-Null
    $headers = Get-GitHubHeaders
    $repository = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo" -Headers $headers
    if (-not $repository.permissions.admin) { throw 'Repository admin access is required to register the runner.' }
    if ($Check) { Write-Output 'Linux Docker image and GitHub repository admin access verified.'; return }

    do {
        $ownedContainer = $false
        try {
            $existing = & docker --context $dockerContext container inspect $container 2>$null
            if ($LASTEXITCODE -eq 0) {
                $state = @($existing | ConvertFrom-Json)[0]
                if ($state.Config.Labels.'dev.brandoriv.repository' -ne $repo) { throw 'The container name belongs to another workload; refusing to change it.' }
                $ownedContainer = $true
                Write-Output 'Resuming the existing isolated runner container.'
                if ($state.State.Status -eq 'created') { Invoke-Docker -Arguments @('start', $container) | Out-Null }
            } else {
                $headers = Get-GitHubHeaders
                $registration = Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$repo/actions/runners/registration-token" -Headers $headers
                Invoke-Docker -Arguments @('create', '--name', $container, '--label', "dev.brandoriv.repository=$repo", '--memory', '6g', '--cpus', '4', '--pids-limit', '1024', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--log-opt', 'max-size=10m', '--log-opt', 'max-file=3', $image) | Out-Null
                $ownedContainer = $true
                Invoke-Docker -Arguments @('start', $container) | Out-Null
                # Only the one-hour registration token crosses into the container.
                # The Windows Git credential and host files are never mounted.
                $runnerName = "$env:COMPUTERNAME-brandoriv-dev-$([Guid]::NewGuid().ToString('N').Substring(0,8))"
                $configCommand = 'read -r token; ./config.sh --unattended --ephemeral --url https://github.com/brandoriv-dev/brandoriv-dev --labels brandoriv-dev --name "$1" --work _work --token "$token" && touch .configured'
                $registration.token | & docker --context $dockerContext exec -i $container bash -c $configCommand -- $runnerName | Out-Null
                $registration = $null
                $headers = $null
                if ($LASTEXITCODE -ne 0) { throw 'GitHub runner registration failed.' }
                Write-Output "Registered isolated runner $runnerName. Waiting for one job."
            }

            $exitCode = Invoke-Docker -Arguments @('wait', $container)
            Write-Output "Runner container finished with code $exitCode."
            # Each runner gets one job. Dispose its filesystem before the next job,
            # so pull-request code cannot persist into a later production deploy.
            Invoke-Docker -Arguments @('rm', $container) | Out-Null
        } catch {
            Write-Warning $_.Exception.Message
            if ($ownedContainer) {
                & docker --context $dockerContext stop --time 30 $container | Out-Null
                & docker --context $dockerContext rm $container | Out-Null
            }
            if ($Once) { throw }
            Start-Sleep -Seconds 30
        }
    } while (-not $Once)
} finally {
    $headers = $null
    $registration = $null
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
