[CmdletBinding()]
param([switch]$Once, [switch]$Check, [switch]$SelfTest)

$ErrorActionPreference = 'Stop'
$repo = 'brandoriv-dev/brandoriv-dev'
$label = 'brandoriv-windows'
$base = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE 'Documents\BrandoRiv\ActionsRunner\brandoriv-windows'))
$runs = Join-Path $base 'runs'
$archive = Join-Path $base 'actions-runner-win-x64-2.338.0.zip'
$archiveHash = 'f48e0750a21812bca5f82de5f7f5aeae71abee647fab5a582f1742d07eba455f'
$mutex = New-Object Threading.Mutex($false, 'Local\BrandoRivActionsRunner-brandoriv-windows')
try { $acquired = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $acquired = $true }
if (-not $acquired) { $mutex.Dispose(); throw 'The Windows runner supervisor is already running.' }
$transcribing = $false

function Get-GitHubHeaders {
    $credential = ("protocol=https" + [char]10 + "host=github.com" + [char]10 + [char]10) | git -c credential.interactive=never credential fill 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'GitHub sign-in is unavailable in Git Credential Manager.' }
    $password = @($credential | Where-Object { $_ -like 'password=*' })
    if ($password.Count -ne 1) { throw 'Git Credential Manager returned no GitHub credential.' }
    return @{ Authorization = ('Bearer ' + $password[0].Substring(9)); Accept = 'application/vnd.github+json'; 'X-GitHub-Api-Version' = '2022-11-28'; 'User-Agent' = 'BrandoRiv-device-runner' }
}

function Remove-OwnedRun([string]$Path) {
    $full = [IO.Path]::GetFullPath($Path)
    if ([IO.Path]::GetDirectoryName($full) -ne $runs -or [IO.Path]::GetFileName($full) -notmatch '^[a-f0-9]{32}$') { throw 'Refusing to remove a path outside owned runner runs.' }
    $ancestor = $full
    while ($ancestor) {
        if ((Get-Item -LiteralPath $ancestor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Preserving a runner path containing a link.' }
        $ancestor = [IO.Path]::GetDirectoryName($ancestor)
    }
    # Check descendants without traversing junctions before recursive removal.
    $pending = New-Object 'Collections.Generic.Queue[string]'
    $pending.Enqueue($full)
    while ($pending.Count) {
        foreach ($item in Get-ChildItem -LiteralPath $pending.Dequeue() -Force) {
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Preserving a runner directory containing a link.' }
            if ($item.PSIsContainer) { $pending.Enqueue($item.FullName) }
        }
    }
    Remove-Item -LiteralPath $full -Recurse -Force
}

if ($SelfTest) {
    try {
        New-Item -ItemType Directory -Path $runs -Force | Out-Null
        $testRun = Join-Path $runs ([Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path (Join-Path $testRun 'child') -Force | Out-Null
        Set-Content -LiteralPath (Join-Path $testRun 'child\marker') -Value 'owned fixture'
        Remove-OwnedRun $testRun
        if (Test-Path -LiteralPath $testRun) { throw 'Owned fixture cleanup failed.' }
        $rejected = $false
        try { Remove-OwnedRun $base } catch { $rejected = $true }
        if (-not $rejected) { throw 'Outside boundary was accepted.' }
        $testRun = Join-Path $runs ([Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $testRun -Force | Out-Null
        $junction = Join-Path $testRun 'external'
        New-Item -ItemType Junction -Path $junction -Target $base | Out-Null
        $rejected = $false
        try { Remove-OwnedRun $testRun } catch { $rejected = $true }
        if (-not $rejected) { throw 'A junction was accepted.' }
        # Nonrecursive deletion removes only the junction, never its target.
        [IO.Directory]::Delete($junction)
        Remove-OwnedRun $testRun
        Write-Output 'Owned cleanup, outside boundary and junction retention checks passed.'
    } finally { $mutex.ReleaseMutex(); $mutex.Dispose() }
    return
}

try {
    New-Item -ItemType Directory -Path $runs -Force | Out-Null
    if (-not $Check) { Start-Transcript -Path (Join-Path $base 'runner.log') -Append | Out-Null; $transcribing = $true }
    if (-not (Test-Path -LiteralPath $archive)) {
        $download = Join-Path $base 'runner-download.zip'
        Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/actions/runner/releases/download/v2.338.0/actions-runner-win-x64-2.338.0.zip' -OutFile $download
        if ((Get-FileHash -LiteralPath $download -Algorithm SHA256).Hash.ToLowerInvariant() -ne $archiveHash) { throw 'GitHub runner archive checksum mismatch.' }
        Move-Item -LiteralPath $download -Destination $archive
    }
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $archiveHash) { throw 'GitHub runner archive checksum mismatch.' }
    $headers = Get-GitHubHeaders
    $repository = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo" -Headers $headers
    if (-not $repository.permissions.admin) { throw 'Repository admin access is required to register the runner.' }
    if ($Check) { Write-Output 'Verified Windows runner archive and GitHub repository admin access.'; return }
    do {
        $run = Join-Path $runs ([Guid]::NewGuid().ToString('N'))
        $runnerId = $null
        try {
            Expand-Archive -LiteralPath $archive -DestinationPath $run
            $listener = Join-Path $run 'bin\Runner.Listener.exe'
            $name = "$env:COMPUTERNAME-$label-$([Guid]::NewGuid().ToString('N').Substring(0,8))"
            $headers = Get-GitHubHeaders
            $registration = Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$repo/actions/runners/registration-token" -Headers $headers
            try {
                $env:ACTIONS_RUNNER_INPUT_TOKEN = $registration.token
                & $listener configure --unattended --ephemeral --url "https://github.com/$repo" --labels $label --name $name --work _work
                if ($LASTEXITCODE -ne 0) { throw "Windows runner registration failed ($LASTEXITCODE)." }
            } finally { Remove-Item Env:ACTIONS_RUNNER_INPUT_TOKEN -ErrorAction SilentlyContinue; Remove-Variable registration -ErrorAction SilentlyContinue }
            $runnerId = (Get-Content -LiteralPath (Join-Path $run '.runner') -Raw | ConvertFrom-Json).agentId
            Remove-Variable headers -ErrorAction SilentlyContinue
            Write-Output "Registered $name. Waiting for one trusted owner job."
            & (Join-Path $run 'run.cmd')
            if ($LASTEXITCODE -ne 0) { throw "Windows runner failed ($LASTEXITCODE)." }
        } catch {
            if ($Once) { throw }
            Write-Warning $_.Exception.Message
            Start-Sleep -Seconds 30
        } finally {
            if ($runnerId) {
                try { Invoke-RestMethod -Method Delete -Uri "https://api.github.com/repos/$repo/actions/runners/$runnerId" -Headers (Get-GitHubHeaders) | Out-Null }
                catch { if ($_.Exception.Response.StatusCode.value__ -ne 404) { Write-Warning 'Could not remove the completed Windows runner registration.' } }
            }
            if (Test-Path -LiteralPath $run) { Remove-OwnedRun $run }
        }
    } while (-not $Once)
} finally {
    Remove-Item Env:ACTIONS_RUNNER_INPUT_TOKEN -ErrorAction SilentlyContinue
    Remove-Variable headers -ErrorAction SilentlyContinue
    if ($transcribing) { Stop-Transcript | Out-Null }
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
