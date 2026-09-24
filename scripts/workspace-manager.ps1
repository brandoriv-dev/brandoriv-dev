<#
Workspace Manager

PowerShell 5.1-compatible, deliberately fail-closed local workspace hygiene.
The source copy is kept in brandoriv-dev; the installer copies this file and
workspace/manifest.json to %LOCALAPPDATA%\BrandoRiv\WorkspaceManager.
#>
[CmdletBinding()]
param(
    [ValidateSet('audit','new-task','cleanup','purge','install','install-task','canary','complete','abandon','extend','health','test','lease-keeper')]
    [string] $Mode = 'audit',
    [string] $Repository,
    [string] $TaskId,
    [int] $TtlHours = 24,
    [switch] $Apply,
    [switch] $RestoreCanary,
    [string] $LeasePath,
    [int] $TtlSeconds = 86400
)

$ErrorActionPreference = 'Stop'
$ScriptPath = [IO.Path]::GetFullPath($MyInvocation.MyCommand.Path)
$ScriptDirectory = Split-Path -Parent $ScriptPath
$InstallRoot = Join-Path $env:LOCALAPPDATA 'BrandoRiv\WorkspaceManager'
$SourceManifest = Join-Path (Split-Path -Parent $ScriptDirectory) 'workspace\manifest.json'
$InstalledManifest = Join-Path $ScriptDirectory 'manifest.json'
$script:TestStateRoot = $null
$script:CleanupOnlyTaskId = $null

function Get-Config {
    $manifestPath = $InstalledManifest
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { $manifestPath = $SourceManifest }
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw "Manifest not found: $manifestPath" }
    $cfg = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($cfg.version -ne 1) { throw 'Unsupported workspace manifest version.' }
    foreach ($property in @('workbenchRoot','taskRoot','quarantineRoot','repositories')) {
        if ($null -eq $cfg.$property) { throw "Manifest field is missing: $property" }
    }
    $cfg.workbenchRoot = [IO.Path]::GetFullPath($cfg.workbenchRoot)
    $cfg.taskRoot = [IO.Path]::GetFullPath($cfg.taskRoot)
    $cfg.quarantineRoot = [IO.Path]::GetFullPath($cfg.quarantineRoot)
    $seen = @{}
    foreach ($repo in @($cfg.repositories)) {
        if ([string]::IsNullOrWhiteSpace($repo.name) -or $seen.ContainsKey($repo.name)) { throw 'Manifest has duplicate or empty repository names.' }
        $seen[$repo.name] = $true
        if ($repo.name -notmatch '^[a-z0-9][a-z0-9.-]*$') { throw "Unsafe repository name: $($repo.name)" }
        if ([string]::IsNullOrWhiteSpace($repo.remote) -or $repo.remote -notmatch '^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.git$') { throw "Unsafe repository remote for $($repo.name)." }
        $repo.path = [IO.Path]::GetFullPath($repo.path)
        if (-not (Test-UnderPath $repo.path $cfg.workbenchRoot) -or $repo.path -match '(?i)onedrive') { throw "Canonical repository is outside the Workbench or in OneDrive: $($repo.path)" }
    }
    if (-not (Test-UnderPath $cfg.taskRoot $cfg.workbenchRoot) -or $cfg.taskRoot -match '(?i)onedrive') { throw 'Task root is not an approved Workbench child.' }
    if (Test-UnderPath $cfg.quarantineRoot $cfg.workbenchRoot) { throw 'Quarantine must be outside Workbench.' }
    if ($cfg.quarantineRoot -match '(?i)onedrive') { throw 'Quarantine may not be in OneDrive.' }
    return $cfg
}

function Convert-ToJsonText([object] $InputObject, [int] $Depth = 8, [switch] $Compress) {
    if ($InputObject -is [Collections.IDictionary]) {
        $properties = @{}
        foreach ($key in $InputObject.Keys) { $properties[$key] = $InputObject[$key] }
        [void]($InputObject = [pscustomobject]$properties)
    }
    if ($Compress) { return (ConvertTo-Json -InputObject $InputObject -Compress -Depth $Depth) }
    return (ConvertTo-Json -InputObject $InputObject -Depth $Depth)
}

function Convert-MetadataToJson([object] $Metadata) {
    $plain = [ordered]@{}
    if ($Metadata -is [Collections.IDictionary]) {
        foreach ($key in $Metadata.Keys) { $plain[[string]$key] = $Metadata[$key] }
    } else {
        foreach ($property in $Metadata.PSObject.Properties) { $plain[$property.Name] = $property.Value }
    }
    return (ConvertTo-Json -InputObject ([pscustomobject]$plain) -Depth 8)
}

function Test-UnderPath([string] $Path, [string] $Root) {
    try {
        $p = [IO.Path]::GetFullPath($Path).TrimEnd('\')
        $r = [IO.Path]::GetFullPath($Root).TrimEnd('\')
        return $p.Equals($r, [StringComparison]::OrdinalIgnoreCase) -or $p.StartsWith($r + '\', [StringComparison]::OrdinalIgnoreCase)
    } catch { return $false }
}

function Test-ReparsePath([string] $Path) {
    $current = [IO.Path]::GetFullPath($Path).TrimEnd('\')
    while ($current -and $current -ne [IO.Path]::GetPathRoot($current).TrimEnd('\')) {
        if (Test-Path -LiteralPath $current) {
            $item = Get-Item -LiteralPath $current -Force
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { return $true }
        }
        $parent = Split-Path -Parent $current
        if ($parent -eq $current) { break }
        $current = $parent.TrimEnd('\')
    }
    return $false
}

function Assert-SafePath([string] $Path, [string] $AllowedRoot, [switch] $AllowRoot) {
    if ([string]::IsNullOrWhiteSpace($Path) -or -not [IO.Path]::IsPathRooted($Path)) { throw "Path is not absolute: $Path" }
    $full = [IO.Path]::GetFullPath($Path).TrimEnd('\')
    $root = [IO.Path]::GetFullPath($AllowedRoot).TrimEnd('\')
    if ((-not $AllowRoot) -and $full.Equals($root, [StringComparison]::OrdinalIgnoreCase)) { throw "Refusing to operate on root: $full" }
    if (-not (Test-UnderPath $full $root)) { throw "Path is outside approved root: $full" }
    if ($full -match '(?i)(^|[\/])OneDrive([\/]|$)') { throw "OneDrive paths are not allowed: $full" }
    if (Test-ReparsePath $full) { throw "Reparse-point path is not allowed: $full" }
    return $full
}

function Get-Repository([object] $Config, [string] $Name) {
    if ([string]::IsNullOrWhiteSpace($Name)) { throw 'Repository is required.' }
    $repo = @($Config.repositories | Where-Object { $_.name -ceq $Name })
    if ($repo.Count -ne 1) { throw "Repository is not in the exact manifest: $Name" }
    Assert-SafePath $repo[0].path $Config.workbenchRoot | Out-Null
    return $repo[0]
}

function Write-JsonLine([string] $Path, [hashtable] $Value) {
    $parent = Split-Path -Parent $Path
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
    if (Test-Path -LiteralPath $Path) {
        $length = (Get-Item -LiteralPath $Path -Force).Length
        if ($length -gt 5242880) {
            $archive = "$Path.1"
            if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive -Force }
            Move-Item -LiteralPath $Path -Destination $archive
        }
    }
    $line = Convert-ToJsonText $Value 8 -Compress
    Add-Content -LiteralPath $Path -Value $line -Encoding UTF8
}

function Get-StateRoot {
    if ($null -ne $script:TestStateRoot) { return $script:TestStateRoot }
    return (Join-Path $InstallRoot 'state')
}
function Write-Transaction([hashtable] $Value) {
    $Value.timestamp = [DateTime]::UtcNow.ToString('o')
    Write-JsonLine (Join-Path (Get-StateRoot) 'transactions.jsonl') $Value
}
function Write-Event([string] $Event, [hashtable] $Data) {
    $Data.event = $Event
    $Data.timestamp = [DateTime]::UtcNow.ToString('o')
    Write-JsonLine (Join-Path (Get-StateRoot) 'events.jsonl') $Data
}

function Invoke-Git([string] $WorkingDirectory, [string[]] $Arguments) {
    $output = & git -C $WorkingDirectory @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) { throw "git $($Arguments -join ' ') failed in $WorkingDirectory`: $($output -join ' ')" }
    return ($output -join "`n").Trim()
}

function Get-Metadata([string] $TaskRoot) {
    $path = Join-Path $TaskRoot '.workspace-task.json'
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Task metadata is missing: $TaskRoot" }
    $meta = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    if ($meta.taskId -notmatch '^[0-9a-f]{32}$') { throw "Unsafe task id in metadata: $TaskRoot" }
    if ($meta.taskRoot -ne [IO.Path]::GetFullPath($TaskRoot)) { throw "Metadata path mismatch: $TaskRoot" }
    return $meta
}

function Save-Metadata([string] $TaskRoot, [object] $Metadata) {
    $path = Join-Path $TaskRoot '.workspace-task.json'
    $Metadata.updatedAt = [DateTime]::UtcNow.ToString('o')
    $tmp = "$path.tmp-$PID"
    Convert-MetadataToJson $Metadata | Set-Content -LiteralPath $tmp -Encoding UTF8
    Move-Item -LiteralPath $tmp -Destination $path -Force
}

function Assert-TaskMetadata([object] $Config, [string] $TaskRoot, [object] $Metadata) {
    $taskPath = [IO.Path]::GetFullPath($TaskRoot).TrimEnd('\')
    if ($Metadata.taskRoot -ne $taskPath) { throw "Task metadata path mismatch: $taskPath" }
    $repo = Get-Repository $Config $Metadata.repository
    $expectedClone = [IO.Path]::GetFullPath((Join-Path $taskPath $repo.name)).TrimEnd('\')
    if ($Metadata.clonePath -ne $expectedClone) { throw "Task clone path mismatch: $taskPath" }
    if ($Metadata.canonicalPath -ne [IO.Path]::GetFullPath($repo.path)) { throw "Task canonical path mismatch: $taskPath" }
    if ($Metadata.remote -ne $repo.remote) { throw "Task remote mismatch: $taskPath" }
    if ($Metadata.branch -notmatch "^agent/$([Regex]::Escape($repo.name))/[0-9a-f]{32}$") { throw "Task branch is not manager-owned: $taskPath" }
    Assert-SafePath $expectedClone $taskPath | Out-Null
}

function Start-Lease([string] $TaskRoot, [object] $Metadata, [int] $Hours) {
    $leaseMetadata = [ordered]@{}
    foreach ($property in $Metadata.PSObject.Properties) { $leaseMetadata[$property.Name] = $property.Value }
    $lease = Join-Path $TaskRoot '.workspace-lease'
    $args = @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $ScriptPath + '"'),'-Mode','lease-keeper','-LeasePath',('"' + $lease + '"'),'-TtlSeconds',([string]([Math]::Max(300, $Hours * 3600))))
    $process = Start-Process -FilePath 'powershell.exe' -ArgumentList $args -WindowStyle Hidden -PassThru
    $held = $false
    for ($attempt = 0; $attempt -lt 50; $attempt++) {
        Start-Sleep -Milliseconds 100
        if (-not (Test-LeaseAvailable $TaskRoot)) { $held = $true; break }
    }
    if (-not $held) {
        try { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue } catch { }
        throw 'Lease keeper did not acquire its exclusive handle before allocation returned.'
    }
    $leaseMetadata.leasePath = $lease
    $leaseMetadata.leasePid = $process.Id
    $leaseMetadata.leaseProcessStart = (Get-Process -Id $process.Id -ErrorAction Stop).StartTime.ToUniversalTime().ToString('o')
    $leaseMetadata.expiresAt = [DateTime]::UtcNow.AddHours($Hours).ToString('o')
    Save-Metadata $TaskRoot $leaseMetadata
    return $process.Id
}

function Invoke-LeaseKeeper {
    if ([string]::IsNullOrWhiteSpace($LeasePath)) { throw 'LeasePath is required.' }
    $lease = [IO.Path]::GetFullPath($LeasePath)
    $stream = $null
    try {
        $stream = [IO.File]::Open($lease, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
        $started = [DateTime]::UtcNow
        while (([DateTime]::UtcNow - $started).TotalSeconds -lt $TtlSeconds) {
            $heartbeat = Join-Path (Split-Path -Parent $lease) '.workspace-lease-heartbeat.json'
            Convert-ToJsonText @{ pid = $PID; heartbeat = [DateTime]::UtcNow.ToString('o'); expiresAt = $started.AddSeconds($TtlSeconds).ToString('o') } | Set-Content -LiteralPath $heartbeat -Encoding UTF8
            Start-Sleep -Seconds 15
        }
    } finally { if ($null -ne $stream) { $stream.Dispose() } }
}

function Test-LeaseAvailable([string] $TaskRoot) {
    $lease = Join-Path $TaskRoot '.workspace-lease'
    if (-not (Test-Path -LiteralPath $lease -PathType Leaf)) { return $true }
    $stream = $null
    try {
        $stream = [IO.File]::Open($lease, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
        return $true
    } catch { return $false }
    finally { if ($null -ne $stream) { $stream.Dispose() } }
}

function Enter-AllocatorMutex {
    $mutex = New-Object System.Threading.Mutex($false, 'Global\BrandoRiv.WorkspaceManager.Allocator')
    if (-not $mutex.WaitOne(0)) { $mutex.Dispose(); throw 'Another task allocation is already running.' }
    return $mutex
}

function Stop-OwnedLease([object] $Metadata) {
    if (-not $Metadata.leasePid) { return }
    try {
        $process = Get-Process -Id ([int]$Metadata.leasePid) -ErrorAction Stop
        $processStart = $process.StartTime.ToUniversalTime()
        $recorded = [DateTime]::Parse($Metadata.leaseProcessStart).ToUniversalTime()
        if ([Math]::Abs(($processStart - $recorded).TotalSeconds) -gt 10) { throw 'Lease PID was reused; refusing to stop it.' }
        Stop-Process -Id $process.Id -Force -ErrorAction Stop
        try { Wait-Process -Id $process.Id -Timeout 5 -ErrorAction SilentlyContinue } catch { }
        for ($attempt = 0; $attempt -lt 50; $attempt++) {
            if (Test-LeaseAvailable ([IO.Path]::GetDirectoryName($Metadata.leasePath))) { break }
            Start-Sleep -Milliseconds 100
        }
    } catch [System.Management.Automation.PSArgumentException] { }
      catch { throw }
}

function Invoke-NewTask([object] $Config) {
    $allocatorMutex = Enter-AllocatorMutex
    try {
    $repo = Get-Repository $Config $Repository
    $canonical = Assert-SafePath $repo.path $Config.workbenchRoot
    if (-not (Test-Path -LiteralPath (Join-Path $canonical '.git') -PathType Container)) { throw "Canonical clone is not a Git repository: $canonical" }
    Assert-SafePath $Config.taskRoot $Config.workbenchRoot | Out-Null
    New-Item -ItemType Directory -Force -Path $Config.taskRoot | Out-Null
    $id = ([Guid]::NewGuid().ToString('N'))
    $taskRoot = Join-Path $Config.taskRoot $id
    $taskRepo = Join-Path $taskRoot $repo.name
    Assert-SafePath $taskRepo $Config.taskRoot | Out-Null
    New-Item -ItemType Directory -Force -Path $taskRoot | Out-Null
    $branch = "agent/$($repo.name)/$id"
    $meta = [pscustomobject]@{
        schema = 1; taskId = $id; cloneId = ([Guid]::NewGuid().ToString('N')); repository = $repo.name
        canonicalPath = $canonical; taskRoot = [IO.Path]::GetFullPath($taskRoot); clonePath = [IO.Path]::GetFullPath($taskRepo)
        remote = $repo.remote; branch = $branch; createdAt = [DateTime]::UtcNow.ToString('o'); updatedAt = [DateTime]::UtcNow.ToString('o')
        status = 'creating'; remoteHead = $null
    }
    Convert-MetadataToJson $meta | Set-Content -LiteralPath (Join-Path $taskRoot '.workspace-task.json') -Encoding UTF8
    try {
        $main = $null
        try { $main = Invoke-Git $canonical @('rev-parse','origin/main') } catch { $main = Invoke-Git $canonical @('rev-parse','origin/master') }
        $meta.remoteHead = $main
        & git clone --no-local --origin origin $repo.remote $taskRepo 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "git clone failed for $($repo.remote)" }
        Invoke-Git $taskRepo @('checkout','-b',$branch,"origin/main") | Out-Null
        Invoke-Git $taskRepo @('push','origin',"refs/heads/$branch`:refs/heads/$branch") | Out-Null
        $meta.status = 'active'
        Save-Metadata $taskRoot $meta
        Start-Lease $taskRoot $meta $TtlHours | Out-Null
        Write-Event 'task-created' @{ taskId = $id; repository = $repo.name; branch = $branch; clonePath = $taskRepo }
        Write-Output "created task $id ($repo.name) at $taskRepo on pushed branch $branch"
    } catch {
        Write-Warning $_.ScriptStackTrace
        $meta.status = 'failed'
        Add-Member -InputObject $meta -MemberType NoteProperty -Name failure -Value $_.Exception.Message -Force
        $meta.expiresAt = [DateTime]::UtcNow.ToString('o')
        Save-Metadata $taskRoot $meta
        Write-Event 'task-create-failed' @{ taskId = $id; repository = $repo.name; error = $_.Exception.Message }
        throw
    }
    } finally { $allocatorMutex.ReleaseMutex(); $allocatorMutex.Dispose() }
}

function Get-TaskForLifecycle([object] $Config) {
    if ($TaskId -notmatch '^[0-9a-f]{32}$') { throw 'TaskId must be the exact 32-character manager task id.' }
    $taskRoot = Join-Path $Config.taskRoot $TaskId
    Assert-SafePath $taskRoot $Config.taskRoot | Out-Null
    if (-not (Test-Path -LiteralPath $taskRoot -PathType Container)) { throw "Task does not exist: $TaskId" }
    $meta = Get-Metadata $taskRoot
    Assert-TaskMetadata $Config $taskRoot $meta
    return @{ root = $taskRoot; metadata = $meta }
}

function Invoke-Lifecycle([object] $Config, [string] $Action) {
    $mutex = Enter-CleanupMutex
    try {
    $task = Get-TaskForLifecycle $Config
    $meta = $task.metadata
    if ($Action -eq 'complete') {
        Stop-OwnedLease $meta
        $meta.status = 'completed'
        $meta.expiresAt = [DateTime]::UtcNow.ToString('o')
        Add-Member -InputObject $meta -MemberType NoteProperty -Name completedAt -Value ([DateTime]::UtcNow.ToString('o')) -Force
        Save-Metadata $task.root $meta
        Write-Event 'task-completed' @{ taskId = $meta.taskId }
        Write-Output "completed task $($meta.taskId)"
        return 0
    }
    if ($Action -eq 'abandon') {
        Stop-OwnedLease $meta
        $meta.status = 'abandoned'
        Add-Member -InputObject $meta -MemberType NoteProperty -Name abandonedAt -Value ([DateTime]::UtcNow.ToString('o')) -Force
        $meta.expiresAt = [DateTime]::UtcNow.ToString('o')
        Save-Metadata $task.root $meta
        Write-Event 'task-abandoned' @{ taskId = $meta.taskId }
        Write-Output "abandoned task $($meta.taskId); cleanup remains quarantine-first"
        return 0
    }
    if ($Action -eq 'extend') {
        if ($meta.status -ne 'active') { throw "Only active tasks can be extended; status is $($meta.status)." }
        Stop-OwnedLease $meta
        $meta.expiresAt = [DateTime]::UtcNow.AddHours($TtlHours).ToString('o')
        Save-Metadata $task.root $meta
        Start-Lease $task.root $meta $TtlHours | Out-Null
        Write-Event 'task-extended' @{ taskId = $meta.taskId; ttlHours = $TtlHours }
        Write-Output "extended task $($meta.taskId) by $TtlHours hours"
        return 0
    }
    throw "Unknown lifecycle action: $Action"
    } finally { $mutex.ReleaseMutex(); $mutex.Dispose() }
}

function Invoke-Audit([object] $Config) {
    Assert-SafePath $Config.workbenchRoot $Config.workbenchRoot -AllowRoot | Out-Null
    $issues = New-Object System.Collections.Generic.List[string]
    foreach ($repo in @($Config.repositories)) {
        try {
            Assert-SafePath $repo.path $Config.workbenchRoot | Out-Null
            $gitPath = Join-Path $repo.path '.git'
            if (-not (Test-Path -LiteralPath $gitPath)) { $issues.Add("missing canonical Git repository: $($repo.name)") }
            else {
                $status = & git -C $repo.path status --porcelain 2>&1
                if ($LASTEXITCODE -ne 0) { $issues.Add("cannot inspect canonical repository: $($repo.name)") }
                elseif ($status) { Write-Warning "canonical dirty (audit only): $($repo.name)" }
                $remote = (& git -C $repo.path remote get-url origin 2>&1).Trim().ToLowerInvariant()
                $expectedRemote = $repo.remote.ToString().TrimEnd('/').ToLowerInvariant()
                if ($remote -ne $expectedRemote) { $issues.Add("canonical remote mismatch for $($repo.name): $remote") }
                $main = (& git -C $repo.path show-ref --verify refs/remotes/origin/main 2>&1)
                if ($LASTEXITCODE -ne 0) { $issues.Add("canonical origin/main is missing: $($repo.name)") }
                $upstream = (& git -C $repo.path rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null)
                if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($upstream)) { Write-Warning "canonical has no upstream (audit only): $($repo.name)" }
                $prune = (& git -C $repo.path config --get remote.origin.prune 2>$null).Trim().ToLowerInvariant()
                if ($prune -ne 'true') { $issues.Add("canonical remote.origin.prune is not true: $($repo.name)") }
            }
        } catch { $issues.Add($_.Exception.Message) }
    }
    if (Test-Path -LiteralPath $Config.taskRoot) {
        foreach ($dir in @(Get-ChildItem -LiteralPath $Config.taskRoot -Directory -Force)) {
            try {
                Assert-SafePath $dir.FullName $Config.taskRoot | Out-Null
                $meta = Get-Metadata $dir.FullName
                Assert-TaskMetadata $Config $dir.FullName $meta
                if ($script:CleanupOnlyTaskId -and $meta.taskId -ne $script:CleanupOnlyTaskId) { continue }
                Write-Output "task $($meta.taskId): $($meta.status), $($meta.repository), lease available=$((Test-LeaseAvailable $dir.FullName))"
            } catch { $issues.Add("task $($dir.Name): $($_.Exception.Message)") }
        }
    }
    if ($issues.Count -gt 0) { foreach ($issue in $issues) { Write-Warning $issue }; return 2 }
    Write-Output 'workspace audit passed (canonical clones are audit-only; no files changed)'
    return 0
}

function Enter-CleanupMutex {
    $mutex = New-Object System.Threading.Mutex($false, 'Global\BrandoRiv.WorkspaceManager.Cleanup')
    if (-not $mutex.WaitOne(0)) { $mutex.Dispose(); throw 'Another workspace-manager cleanup is already running.' }
    return $mutex
}

function Recover-PendingTransactions([object] $Config) {
    $path = Join-Path (Get-StateRoot) 'transactions.jsonl'
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return }
    $pending = @{}
    foreach ($line in @(Get-Content -LiteralPath $path)) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        try { $entry = $line | ConvertFrom-Json } catch { throw "Transaction log is malformed; cleanup is blocked: $path" }
        $key = "$($entry.operation):$($entry.taskId)"
        if ($entry.operation -in @('quarantine','purge') -and $entry.phase -eq 'prepare') { $pending[$key] = $entry }
        elseif ($entry.operation -in @('quarantine','purge') -and $entry.phase -in @('committed','recovered')) { $pending.Remove($key) }
    }
    foreach ($entry in @($pending.Values)) {
        if ($entry.operation -eq 'purge') {
            $purgePath = [IO.Path]::GetFullPath($entry.path)
            Assert-SafePath $purgePath $Config.quarantineRoot | Out-Null
            if (Test-Path -LiteralPath $purgePath) { Assert-IntegrityManifest $purgePath $entry.taskId | Out-Null; Write-Transaction @{ operation = 'purge'; phase = 'recovered'; taskId = $entry.taskId; path = $purgePath; recovery = 'integrity verified; purge will retry' } }
            else { Write-Transaction @{ operation = 'purge'; phase = 'committed'; taskId = $entry.taskId; path = $purgePath; recovery = 'destination already absent' } }
            continue
        }
        $source = [IO.Path]::GetFullPath($entry.source)
        $destination = [IO.Path]::GetFullPath($entry.destination)
        Assert-SafePath $source $Config.taskRoot | Out-Null
        Assert-SafePath $destination $Config.quarantineRoot | Out-Null
        $sourceExists = Test-Path -LiteralPath $source
        $destinationExists = Test-Path -LiteralPath $destination
        if ($sourceExists -and $destinationExists) { throw "Ambiguous interrupted quarantine; both source and destination exist: $($entry.taskId)" }
        if (-not $sourceExists -and $destinationExists) {
            Write-Transaction @{ operation = $entry.operation; phase = 'recovered'; taskId = $entry.taskId; source = $source; destination = $destination; recovery = 'destination exists and source is absent' }
        } elseif ($sourceExists -and -not $destinationExists) {
            Write-Output "pending quarantine remains recoverable: $($entry.taskId)"
        } else {
            throw "Interrupted quarantine has neither source nor destination: $($entry.taskId)"
        }
    }
}

function Write-RunHealth([datetime] $Started, [bool] $Success, [string] $ErrorMessage) {
    New-Item -ItemType Directory -Force -Path (Get-StateRoot) | Out-Null
    $health = [ordered]@{ schema = 1; lastStart = $Started.ToUniversalTime().ToString('o'); lastSuccess = $Success; lastDurationSeconds = [Math]::Round(([DateTime]::UtcNow - $Started.ToUniversalTime()).TotalSeconds, 3); lastError = $ErrorMessage; writtenAt = [DateTime]::UtcNow.ToString('o') }
    Convert-ToJsonText $health 5 | Set-Content -LiteralPath (Join-Path (Get-StateRoot) 'health.json') -Encoding UTF8
}

function New-IntegrityManifest([string] $TaskRoot, [string] $TaskId) {
    $files = New-Object System.Collections.Generic.List[object]
    foreach ($directory in @(Get-ChildItem -LiteralPath $TaskRoot -Directory -Recurse -Force)) {
        Assert-SafePath $directory.FullName $TaskRoot | Out-Null
    }
    foreach ($file in @(Get-ChildItem -LiteralPath $TaskRoot -File -Recurse -Force)) {
        if ($file.Name -eq '.workspace-quarantine.json') { continue }
        Assert-SafePath $file.FullName $TaskRoot | Out-Null
        $relative = $file.FullName.Substring($TaskRoot.Length).TrimStart('\')
        if ([string]::IsNullOrWhiteSpace($relative) -or $relative -match '(^|[\\/])\.\.?([\\/]|$)') { throw "Unsafe quarantine relative path: $relative" }
        $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        $files.Add([ordered]@{ path = $relative; sha256 = $hash })
    }
    return [ordered]@{ schema = 1; taskId = $TaskId; createdAt = [DateTime]::UtcNow.ToString('o'); files = @($files.ToArray()) }
}

function Assert-IntegrityManifest([string] $Root, [string] $ExpectedTaskId) {
    $manifestPath = Join-Path $Root '.workspace-quarantine.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw "Quarantine integrity manifest is missing: $Root" }
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($manifest.schema -ne 1 -or $manifest.taskId -ne $ExpectedTaskId) { throw "Quarantine integrity manifest identity mismatch: $Root" }
    $expected = @{}
    foreach ($file in @($manifest.files)) {
        if ([string]::IsNullOrWhiteSpace($file.path) -or $file.path -match '(^|[\\/])\.\.?([\\/]|$)' -or [IO.Path]::IsPathRooted($file.path)) { throw "Unsafe quarantine manifest path: $($file.path)" }
        if ($expected.ContainsKey($file.path)) { throw "Duplicate quarantine manifest path: $($file.path)" }
        $expected[$file.path] = $file.sha256.ToLowerInvariant()
        $full = [IO.Path]::GetFullPath((Join-Path $Root $file.path))
        Assert-SafePath $full $Root | Out-Null
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { throw "Quarantine file is missing: $($file.path)" }
        $actual = (Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actual -ne $expected[$file.path]) { throw "Quarantine file hash mismatch: $($file.path)" }
    }
    $actualFiles = @(Get-ChildItem -LiteralPath $Root -File -Recurse -Force | Where-Object { $_.Name -ne '.workspace-quarantine.json' })
    foreach ($directory in @(Get-ChildItem -LiteralPath $Root -Directory -Recurse -Force)) {
        Assert-SafePath $directory.FullName $Root | Out-Null
    }
    if ($actualFiles.Count -ne $expected.Count) { throw "Quarantine contains files outside its integrity manifest: $Root" }
    return $manifest
}

function Invoke-Cleanup([object] $Config) {
    $started = [DateTime]::UtcNow
    try { $mutex = Enter-CleanupMutex } catch { Write-RunHealth $started $false $_.Exception.Message; throw }
    $failed = $false
    $lastError = $null
    try {
        $now = [DateTime]::UtcNow
        if (-not (Test-Path -LiteralPath $Config.taskRoot)) { Write-Output 'no task root; audit complete'; return 0 }
        Recover-PendingTransactions $Config
        foreach ($dir in @(Get-ChildItem -LiteralPath $Config.taskRoot -Directory -Force)) {
            try {
                Assert-SafePath $dir.FullName $Config.taskRoot | Out-Null
                if ($script:CleanupOnlyTaskId -and $dir.Name -ne $script:CleanupOnlyTaskId) { continue }
                $meta = Get-Metadata $dir.FullName
                Assert-TaskMetadata $Config $dir.FullName $meta
                if ($meta.status -notin @('active','failed','creating','completed','abandoned')) { Write-Output "skip $($dir.Name): status $($meta.status)"; continue }
                $expiry = $null
                if ($meta.expiresAt) { $expiry = [DateTime]::Parse($meta.expiresAt).ToUniversalTime() }
                if ($null -eq $expiry -or $expiry -gt $now) { Write-Output "keep $($meta.taskId): not expired"; continue }
                if (-not (Test-LeaseAvailable $dir.FullName)) { Write-Output "keep $($meta.taskId): active lease"; continue }
                $destination = Join-Path $Config.quarantineRoot $meta.taskId
                if (Test-UnderPath $Config.quarantineRoot $Config.workbenchRoot -or $Config.quarantineRoot -match '(?i)onedrive' -or (Test-ReparsePath $Config.quarantineRoot)) { throw "Quarantine root is not safe: $($Config.quarantineRoot)" }
                if (Test-Path -LiteralPath $destination) { throw "quarantine destination already exists: $destination" }
                if (-not $Apply) { Write-Output "would quarantine $($meta.taskId): $($dir.FullName) -> $destination"; continue }
                Write-Transaction @{ operation = 'quarantine'; phase = 'prepare'; taskId = $meta.taskId; source = $dir.FullName; destination = $destination }
                $integrity = New-IntegrityManifest $dir.FullName $meta.taskId
                Convert-ToJsonText $integrity 8 | Set-Content -LiteralPath (Join-Path $dir.FullName '.workspace-quarantine.json') -Encoding UTF8
                New-Item -ItemType Directory -Force -Path $Config.quarantineRoot | Out-Null
                Move-Item -LiteralPath $dir.FullName -Destination $destination
                Write-Transaction @{ operation = 'quarantine'; phase = 'committed'; taskId = $meta.taskId; source = $dir.FullName; destination = $destination }
                Write-Output "quarantined $($meta.taskId)"
            } catch { $failed = $true; $lastError = $_.Exception.Message; Write-Transaction @{ operation = 'quarantine'; phase = 'failed'; source = $dir.FullName; error = $_.Exception.Message }; Write-Warning "$($_.Exception.Message) [$($dir.Name)]" }
        }
    } catch {
        $failed = $true
        $lastError = $_.Exception.Message
        throw
    } finally { Write-RunHealth $started (-not $failed) $lastError; $mutex.ReleaseMutex(); $mutex.Dispose() }
    if ($failed) { return 1 }
    return 0
}

function Invoke-Purge([object] $Config) {
    if (-not $Apply) { Write-Output 'purge is audit-only; pass -Apply after the seven-day retention period'; return 0 }
    $mutex = Enter-CleanupMutex
    $failed = $false
    try {
    if (-not (Test-Path -LiteralPath $Config.quarantineRoot)) { return 0 }
    foreach ($dir in @(Get-ChildItem -LiteralPath $Config.quarantineRoot -Directory -Force)) {
        try {
        if ($dir.Name -notmatch '^[0-9a-f]{32}$') { Write-Warning "skip unrecognized quarantine entry: $($dir.Name)"; continue }
        Assert-SafePath $dir.FullName $Config.quarantineRoot | Out-Null
        $metaPath = Join-Path $dir.FullName '.workspace-task.json'
        if (-not (Test-Path -LiteralPath $metaPath -PathType Leaf)) { Write-Warning "skip quarantine without manifest: $($dir.Name)"; continue }
        $meta = Get-Content -LiteralPath $metaPath -Raw | ConvertFrom-Json
        if ($meta.taskId -ne $dir.Name -or ((-not ($meta.taskRoot -match '\.tasks\\')) -and (-not (Test-UnderPath $meta.taskRoot $Config.taskRoot)))) { Write-Warning "skip quarantine manifest mismatch: $($dir.Name)"; continue }
        $integrity = Assert-IntegrityManifest $dir.FullName $dir.Name
        $quarantineAt = [DateTime]::Parse($integrity.createdAt).ToUniversalTime()
        $age = ([DateTime]::UtcNow - $quarantineAt).TotalDays
        if ($age -lt 7) { Write-Output "retain $($dir.Name): $([Math]::Round(7 - $age, 1)) days remain"; continue }
        Write-Transaction @{ operation = 'purge'; phase = 'prepare'; taskId = $dir.Name; path = $dir.FullName }
        Remove-Item -LiteralPath $dir.FullName -Recurse -Force
        Write-Transaction @{ operation = 'purge'; phase = 'committed'; taskId = $dir.Name; path = $dir.FullName }
        Write-Output "purged $($dir.Name) after retention"
        } catch { $failed = $true; Write-Warning $_.Exception.Message; Write-Transaction @{ operation = 'purge'; phase = 'failed'; taskId = $dir.Name; path = $dir.FullName; error = $_.Exception.Message } }
    }
    } finally { $mutex.ReleaseMutex(); $mutex.Dispose() }
    if ($failed) { return 1 }
    return 0
}

function Invoke-Install {
    if ($ScriptPath -match '(?i)OneDrive') { throw 'Refusing to install from OneDrive.' }
    New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
    New-Item -ItemType Directory -Force -Path (Get-StateRoot) | Out-Null
    Copy-Item -LiteralPath $ScriptPath -Destination (Join-Path $InstallRoot 'workspace-manager.ps1') -Force
    Copy-Item -LiteralPath $SourceManifest -Destination (Join-Path $InstallRoot 'manifest.json') -Force
    Convert-ToJsonText @{ schema = 1; installedAt = [DateTime]::UtcNow.ToString('o'); source = $ScriptPath; mode = 'audit-only' } | Set-Content -LiteralPath (Join-Path $InstallRoot 'install.json') -Encoding UTF8
    Write-Output "installed audit-only manager at $InstallRoot (scheduler unchanged)"
}

function Invoke-InstallTask {
    $taskName = 'BrandoRiv Workspace Manager Cleanup'
    $installedScript = Join-Path $InstallRoot 'workspace-manager.ps1'
    if (-not (Test-Path -LiteralPath $installedScript -PathType Leaf)) { throw "Install the manager first: $installedScript" }
    # Task Scheduler normalizes the current interactive account to its local name.
    $user = $env:USERNAME
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ("-NoProfile -ExecutionPolicy Bypass -File `"$installedScript`" -Mode cleanup -Apply") -WorkingDirectory $InstallRoot
    $trigger = New-ScheduledTaskTrigger -Daily -At 3:15am
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
    $principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
    if ($Apply -and -not (Test-CanarySuccess)) { throw 'Destructive scheduled cleanup is blocked until a successful canary quarantine-and-restore is recorded.' }
    if (-not $Apply) {
        Write-Output "would register '$taskName' for $user (interactive, StartWhenAvailable, IgnoreNew)"
        Write-Output "action: powershell.exe -File $installedScript -Mode cleanup -Apply"
        return 0
    }
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    try {
        $registered = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
        $expectedArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$installedScript`" -Mode cleanup -Apply"
        if ($registered.Principal.UserId -ne $user -or $registered.Principal.LogonType -ne 'Interactive') { throw 'Scheduled task principal verification failed.' }
        if ($registered.Actions.Execute -notmatch '(?i)powershell\.exe$' -or $registered.Actions.Arguments -ne $expectedArgs -or $registered.Actions.WorkingDirectory -ne $InstallRoot) { throw 'Scheduled task action verification failed.' }
        if ($registered.Settings.StartWhenAvailable -ne $true -or $registered.Settings.MultipleInstances -notmatch '(?i)IgnoreNew') { throw 'Scheduled task settings verification failed.' }
        if ($registered.Triggers.Count -lt 1 -or $registered.Triggers[0].StartBoundary -notmatch 'T03:15:00') { throw 'Scheduled task trigger verification failed.' }
    } catch {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
        throw
    }
    Write-Output "registered and verified '$taskName' for $user"
    return 0
}

function Get-CanaryMarkerPath { return (Join-Path (Get-StateRoot) 'canary-success.json') }
function Get-CanaryProof([string] $TaskId) {
    $material = "$env:COMPUTERNAME|$env:USERNAME|workspace-manager-canary-v1|$TaskId"
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($material))).Replace('-', '').ToLowerInvariant()) }
    finally { $sha.Dispose() }
}
function Test-CanarySuccess {
    $path = Get-CanaryMarkerPath
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return $false }
    try {
        $marker = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
        return $marker.schema -eq 1 -and $marker.taskId -match '^[0-9a-f]{32}$' -and $marker.proof -eq (Get-CanaryProof $marker.taskId) -and $marker.restored -eq $true
    } catch { return $false }
}
function Invoke-Canary([object] $Config) {
    Assert-SafePath $Config.taskRoot $Config.workbenchRoot | Out-Null
    if (Test-UnderPath $Config.quarantineRoot $Config.workbenchRoot -or $Config.quarantineRoot -match '(?i)onedrive' -or (Test-ReparsePath $Config.quarantineRoot)) { throw "Canary quarantine root is not safe: $($Config.quarantineRoot)" }
    if (-not (Test-Path -LiteralPath $Config.taskRoot)) { New-Item -ItemType Directory -Force -Path $Config.taskRoot | Out-Null }
    $id = ([Guid]::NewGuid().ToString('N'))
    $root = Join-Path $Config.taskRoot $id
    $repo = Get-Repository $Config 'brandoriv-dev'
    New-Item -ItemType Directory -Force -Path (Join-Path $root $repo.name) | Out-Null
    $meta = [pscustomobject]@{ schema = 1; taskId = $id; cloneId = ([Guid]::NewGuid().ToString('N')); repository = $repo.name; canonicalPath = $repo.path; taskRoot = $root; clonePath = (Join-Path $root $repo.name); remote = $repo.remote; branch = "agent/$($repo.name)/$id"; createdAt = [DateTime]::UtcNow.ToString('o'); updatedAt = [DateTime]::UtcNow.ToString('o'); status = 'active'; expiresAt = [DateTime]::UtcNow.AddMinutes(-1).ToString('o') }
    Convert-MetadataToJson $meta | Set-Content -LiteralPath (Join-Path $root '.workspace-task.json') -Encoding UTF8
    $script:CleanupOnlyTaskId = $id
    try {
        $script:Apply = $true
        $cleanupResult = @(Invoke-Cleanup $Config)
        if ($cleanupResult -contains 1) { throw 'Canary cleanup returned a failure.' }
        $quarantine = Join-Path $Config.quarantineRoot $id
        if (-not (Test-Path -LiteralPath $quarantine -PathType Container)) { throw 'Canary was not quarantined.' }
        Assert-IntegrityManifest $quarantine $id | Out-Null
        Move-Item -LiteralPath $quarantine -Destination $root
        Assert-IntegrityManifest $root $id | Out-Null
        Remove-Item -LiteralPath $root -Recurse -Force
        New-Item -ItemType Directory -Force -Path (Get-StateRoot) | Out-Null
        Convert-ToJsonText @{ schema = 1; taskId = $id; proof = (Get-CanaryProof $id); restored = $true; completedAt = [DateTime]::UtcNow.ToString('o') } | Set-Content -LiteralPath (Get-CanaryMarkerPath) -Encoding UTF8
        Write-Output 'canary quarantine and restore succeeded; destructive registration is now eligible'
        return 0
    } finally { $script:CleanupOnlyTaskId = $null; if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force } }
}

function Invoke-Health([object] $Config) {
    Assert-SafePath $Config.taskRoot $Config.workbenchRoot | Out-Null
    $result = [ordered]@{ healthy = $true; installRoot = $InstallRoot; mode = 'audit-only'; taskRoot = $Config.taskRoot; quarantineRoot = $Config.quarantineRoot; checkedAt = [DateTime]::UtcNow.ToString('o') }
    if (-not (Test-Path -LiteralPath (Join-Path $InstallRoot 'workspace-manager.ps1'))) { $result.healthy = $false }
    if (-not (Test-Path -LiteralPath $Config.taskRoot)) { New-Item -ItemType Directory -Force -Path $Config.taskRoot | Out-Null }
    New-Item -ItemType Directory -Force -Path (Get-StateRoot) | Out-Null
    Convert-ToJsonText $result 5 | Set-Content -LiteralPath (Join-Path (Get-StateRoot) 'health.json') -Encoding UTF8
    Convert-ToJsonText $result 5
    if (-not $result.healthy) { return 1 }
    return 0
}

function Assert-Test([bool] $Condition, [string] $Message) { if (-not $Condition) { throw "TEST FAILED: $Message" }; Write-Output "PASS: $Message" }
function New-SyntheticTask([object] $Config, [string] $Id, [string] $Scenario) {
    $repo = Get-Repository $Config 'brandoriv-dev'
    $root = Join-Path $Config.taskRoot $Id
    $clone = Join-Path $root $repo.name
    New-Item -ItemType Directory -Force -Path $clone | Out-Null
    $meta = [pscustomobject]@{ schema = 1; taskId = $Id; cloneId = ([Guid]::NewGuid().ToString('N')); repository = $repo.name; canonicalPath = $repo.path; taskRoot = $root; clonePath = $clone; remote = $repo.remote; branch = "agent/$($repo.name)/$Id"; createdAt = [DateTime]::UtcNow.ToString('o'); updatedAt = [DateTime]::UtcNow.ToString('o'); status = 'active'; expiresAt = [DateTime]::UtcNow.AddMinutes(-1).ToString('o'); scenario = $Scenario }
    Convert-ToJsonText $meta 8 | Set-Content -LiteralPath (Join-Path $root '.workspace-task.json') -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $clone "$Scenario.txt") -Value $Scenario -Encoding UTF8
    return @{ root = $root; clone = $clone; metadata = $meta }
}
function Invoke-Tests([object] $Config) {
    $testRoot = Join-Path $env:TEMP ('.workspace-manager-test-' + $PID)
    New-Item -ItemType Directory -Force -Path $testRoot | Out-Null
    try {
        Assert-Test (Test-UnderPath (Join-Path $Config.workbenchRoot 'moss') $Config.workbenchRoot) 'approved child path is under Workbench'
        Assert-Test (-not (Test-UnderPath 'C:\\Users\\Brandon\\OneDrive\\Desktop\\Workbench' $Config.workbenchRoot)) 'OneDrive path is not an approved child'
        Assert-Test (-not (Test-UnderPath 'C:\\Windows\\Temp' $Config.workbenchRoot)) 'outside path is rejected'
        $junctionTarget = Join-Path $testRoot 'junction-target'; New-Item -ItemType Directory -Force -Path $junctionTarget | Out-Null
        $junctionPath = Join-Path $testRoot 'junction'
        $junctionCreated = $false
        try {
            New-Item -ItemType Junction -Path $junctionPath -Target $junctionTarget -ErrorAction Stop | Out-Null
            $junctionCreated = $true
        } catch {
            Write-Output 'SKIP: reparse-point creation is unavailable to this account'
        }
        if ($junctionCreated) {
            try { Assert-Test (Test-ReparsePath $junctionPath) 'reparse-point path is rejected' }
            finally { if (Test-Path -LiteralPath $junctionPath) { Remove-Item -LiteralPath $junctionPath -Force } }
        }
        $leaseTask = Join-Path $testRoot 'lease-task'; New-Item -ItemType Directory -Force -Path $leaseTask | Out-Null
        $lease = Join-Path $leaseTask '.workspace-lease'
        $stream = [IO.File]::Open($lease, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
        Assert-Test (-not (Test-LeaseAvailable $leaseTask)) 'exclusive lease blocks cleanup'
        $stream.Dispose(); Assert-Test (Test-LeaseAvailable $leaseTask) 'released lease is available'
        $mutex = Enter-CleanupMutex; try { Assert-Test $true 'global cleanup mutex can be acquired' } finally { $mutex.ReleaseMutex(); $mutex.Dispose() }
        Assert-Test (Test-UnderPath $Config.taskRoot $Config.workbenchRoot) 'task root stays inside Workbench'
        Assert-Test (-not (Test-UnderPath $Config.quarantineRoot $Config.workbenchRoot)) 'quarantine stays outside Workbench'
        $testPrincipal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
        Assert-Test ($testPrincipal.UserId -eq $env:USERNAME -and $testPrincipal.LogonType -eq 'Interactive') 'scheduled cleanup uses the normalized current user and PowerShell 5.1 interactive logon enum'
        $sandbox = Join-Path $testRoot 'sandbox'
        $sandboxConfig = [pscustomobject]@{ workbenchRoot = $Config.workbenchRoot; taskRoot = (Join-Path $sandbox 'tasks'); quarantineRoot = (Join-Path $sandbox 'quarantine'); repositories = $Config.repositories }
        New-Item -ItemType Directory -Force -Path $sandboxConfig.taskRoot, $sandboxConfig.quarantineRoot | Out-Null
        $script:TestStateRoot = Join-Path $sandbox 'state'; New-Item -ItemType Directory -Force -Path $script:TestStateRoot | Out-Null
        $oldApply = $Apply; $script:Apply = $true
        foreach ($scenario in @('clean-fixture','dirty-fixture','untracked-fixture','ahead-fixture','detached-fixture','missing-upstream-fixture')) {
            $id = ([Guid]::NewGuid().ToString('N')); $item = New-SyntheticTask $sandboxConfig $id $scenario; $script:CleanupOnlyTaskId = $id
            $result = @(Invoke-Cleanup $sandboxConfig)
            $quarantine = Join-Path $sandboxConfig.quarantineRoot $id
            Assert-Test ($result -notcontains 1 -and (Test-Path -LiteralPath $quarantine -PathType Container)) "expired synthetic $scenario task is quarantined (cleanup invariant)"
            Assert-IntegrityManifest $quarantine $id | Out-Null
            Move-Item -LiteralPath $quarantine -Destination $item.root
            Remove-Item -LiteralPath $item.root -Recurse -Force
        }
        $leaseId = ([Guid]::NewGuid().ToString('N')); $leaseItem = New-SyntheticTask $sandboxConfig $leaseId 'active-lease'; $script:CleanupOnlyTaskId = $leaseId
        $heldLease = [IO.File]::Open((Join-Path $leaseItem.root '.workspace-lease'), [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
        Invoke-Cleanup $sandboxConfig | Out-Null; Assert-Test (Test-Path -LiteralPath $leaseItem.root) 'active lease prevents quarantine'; $heldLease.Dispose(); Invoke-Cleanup $sandboxConfig | Out-Null
        Remove-Item -LiteralPath (Join-Path $sandboxConfig.quarantineRoot $leaseId) -Recurse -Force
        $keeperId = ([Guid]::NewGuid().ToString('N')); $keeperItem = New-SyntheticTask $sandboxConfig $keeperId 'keeper-race'; $keeperPid = Start-Lease $keeperItem.root $keeperItem.metadata 1; Assert-Test (-not (Test-LeaseAvailable $keeperItem.root)) 'lease keeper holds handle before allocation returns'; $keeperMeta = Get-Metadata $keeperItem.root; Stop-OwnedLease $keeperMeta; Start-Sleep -Milliseconds 300; Assert-Test (Test-LeaseAvailable $keeperItem.root) 'owned lease can be released'; Remove-Item -LiteralPath $keeperItem.root -Recurse -Force
        $lifecycleItem = New-SyntheticTask $sandboxConfig ([Guid]::NewGuid().ToString('N')) 'lifecycle'; $TaskId = $lifecycleItem.metadata.taskId; Invoke-Lifecycle $sandboxConfig 'extend' | Out-Null; $extended = Get-Metadata $lifecycleItem.root; Assert-Test ($extended.expiresAt -and -not (Test-LeaseAvailable $lifecycleItem.root)) 'active task can safely extend its lease'; Invoke-Lifecycle $sandboxConfig 'complete' | Out-Null; $completed = Get-Metadata $lifecycleItem.root; Assert-Test ($completed.status -eq 'completed' -and (Test-LeaseAvailable $lifecycleItem.root)) 'task completion releases ownership'; $script:CleanupOnlyTaskId = $TaskId; Invoke-Cleanup $sandboxConfig | Out-Null; Assert-Test (Test-Path -LiteralPath (Join-Path $sandboxConfig.quarantineRoot $TaskId)) 'completed task is eligible for quarantine'; Remove-Item -LiteralPath (Join-Path $sandboxConfig.quarantineRoot $TaskId) -Recurse -Force; $TaskId = $null
        $abandonedItem = New-SyntheticTask $sandboxConfig ([Guid]::NewGuid().ToString('N')); $abandonedMeta = Get-Metadata $abandonedItem.root; $abandonedMeta.status = 'abandoned'; Save-Metadata $abandonedItem.root $abandonedMeta; $script:CleanupOnlyTaskId = $abandonedMeta.taskId; Invoke-Cleanup $sandboxConfig | Out-Null; Assert-Test (Test-Path -LiteralPath (Join-Path $sandboxConfig.quarantineRoot $abandonedMeta.taskId)) 'abandoned task is eligible for quarantine'; Remove-Item -LiteralPath (Join-Path $sandboxConfig.quarantineRoot $abandonedMeta.taskId) -Recurse -Force
        $failedItem = New-SyntheticTask $sandboxConfig ([Guid]::NewGuid().ToString('N')); $failedMeta = Get-Metadata $failedItem.root; $failedMeta.status = 'failed'; $failedMeta.expiresAt = [DateTime]::UtcNow.ToString('o'); Save-Metadata $failedItem.root $failedMeta; $script:CleanupOnlyTaskId = $failedMeta.taskId; Invoke-Cleanup $sandboxConfig | Out-Null; Assert-Test (Test-Path -LiteralPath (Join-Path $sandboxConfig.quarantineRoot $failedMeta.taskId)) 'failed allocation with expiry is eligible for quarantine'; Remove-Item -LiteralPath (Join-Path $sandboxConfig.quarantineRoot $failedMeta.taskId) -Recurse -Force; $script:CleanupOnlyTaskId = $null
        $malformed = Join-Path $sandboxConfig.taskRoot 'malformed'; New-Item -ItemType Directory -Force -Path $malformed | Out-Null; Set-Content -LiteralPath (Join-Path $malformed '.workspace-task.json') -Value '{' -Encoding UTF8; $script:CleanupOnlyTaskId = $null
        Assert-Test ((Invoke-Cleanup $sandboxConfig) -contains 1) 'malformed metadata fails closed'; Assert-Test (Test-Path -LiteralPath $malformed) 'malformed metadata is retained'; Remove-Item -LiteralPath $malformed -Recurse -Force
        $unknown = Join-Path $sandboxConfig.taskRoot 'unknown'; New-Item -ItemType Directory -Force -Path $unknown | Out-Null
        Assert-Test ((Invoke-Cleanup $sandboxConfig) -contains 1) 'unknown task directory fails closed'; Remove-Item -LiteralPath $unknown -Recurse -Force
        $targetedItem = New-SyntheticTask $sandboxConfig ([Guid]::NewGuid().ToString('N')) 'targeted-cleanup'; $unrelated = Join-Path $sandboxConfig.taskRoot 'unrelated-unmanaged'; New-Item -ItemType Directory -Force -Path $unrelated | Out-Null; $script:CleanupOnlyTaskId = $targetedItem.metadata.taskId
        Assert-Test ((Invoke-Cleanup $sandboxConfig) -contains 0) 'targeted cleanup ignores unrelated unmanaged task directories'; Assert-Test (Test-Path -LiteralPath (Join-Path $sandboxConfig.quarantineRoot $targetedItem.metadata.taskId)) 'targeted cleanup quarantines only its selected task'; Assert-Test (Test-Path -LiteralPath $unrelated) 'targeted cleanup preserves unrelated unmanaged directories'; Remove-Item -LiteralPath (Join-Path $sandboxConfig.quarantineRoot $targetedItem.metadata.taskId) -Recurse -Force; Remove-Item -LiteralPath $unrelated -Recurse -Force; $script:CleanupOnlyTaskId = $null
        $junctionTask = New-SyntheticTask $sandboxConfig ([Guid]::NewGuid().ToString('N')) 'reparse-target'; $script:CleanupOnlyTaskId = $junctionTask.metadata.taskId
        $jtarget = Join-Path $junctionTask.clone 'target'; New-Item -ItemType Directory -Force -Path $jtarget | Out-Null; $jpath = Join-Path $junctionTask.clone 'link'; New-Item -ItemType Junction -Path $jpath -Target $jtarget | Out-Null
        Assert-Test ((Invoke-Cleanup $sandboxConfig) -contains 1) 'reparse target fails closed'; Remove-Item -LiteralPath $jpath -Force; Remove-Item -LiteralPath $junctionTask.root -Recurse -Force; Set-Content -LiteralPath (Join-Path $script:TestStateRoot 'transactions.jsonl') -Value '' -Encoding UTF8
        $script:CleanupOnlyTaskId = $null
        $mutex = Enter-CleanupMutex
        try {
            $child = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $ScriptPath + '"'),'-Mode','cleanup') -PassThru -Wait -WindowStyle Hidden
            Assert-Test ($child.ExitCode -eq 1) 'concurrent cleanup is rejected by global mutex'
        } finally { $mutex.ReleaseMutex(); $mutex.Dispose() }
        $recoveryId = ([Guid]::NewGuid().ToString('N')); $recoverySource = Join-Path $sandboxConfig.taskRoot $recoveryId; $recoveryDestination = Join-Path $sandboxConfig.quarantineRoot $recoveryId; New-Item -ItemType Directory -Force -Path $recoveryDestination | Out-Null; Write-Transaction @{ operation = 'quarantine'; phase = 'prepare'; taskId = $recoveryId; source = $recoverySource; destination = $recoveryDestination }; Recover-PendingTransactions $sandboxConfig; Assert-Test ((Get-Content -LiteralPath (Join-Path $script:TestStateRoot 'transactions.jsonl') -Raw) -match 'recovered') 'interrupted move is reconciled'
        $purgeItem = New-SyntheticTask $sandboxConfig ([Guid]::NewGuid().ToString('N')) 'purge-retention'; $script:CleanupOnlyTaskId = $purgeItem.metadata.taskId; Invoke-Cleanup $sandboxConfig | Out-Null; $purgePath = Join-Path $sandboxConfig.quarantineRoot $purgeItem.metadata.taskId; $purgeManifestPath = Join-Path $purgePath '.workspace-quarantine.json'; $purgeManifest = Get-Content -LiteralPath $purgeManifestPath -Raw | ConvertFrom-Json; $purgeManifest.createdAt = [DateTime]::UtcNow.AddDays(-8).ToString('o'); Convert-ToJsonText $purgeManifest 8 | Set-Content -LiteralPath $purgeManifestPath -Encoding UTF8; Assert-Test ((Invoke-Purge $sandboxConfig) -contains 0 -and -not (Test-Path -LiteralPath $purgePath)) 'verified quarantine is purged after recorded retention'; $script:CleanupOnlyTaskId = $null
        $health = Get-Content -LiteralPath (Join-Path $script:TestStateRoot 'health.json') -Raw | ConvertFrom-Json
        Assert-Test ($health.lastStart -and $health.lastSuccess -eq $true -and $health.lastDurationSeconds -ge 0) 'cleanup writes successful health timing'
        Assert-Test (-not (Test-CanarySuccess)) 'destructive registration is blocked without canary proof'
        $script:Apply = $oldApply; $script:TestStateRoot = $null
        Write-Output 'workspace-manager tests passed; no canonical or task repository was modified'
    } finally { if (Test-Path -LiteralPath $testRoot) { Remove-Item -LiteralPath $testRoot -Recurse -Force } }
    return 0
}

try {
    if ($Mode -eq 'lease-keeper') { Invoke-LeaseKeeper; exit 0 }
    if ($Mode -eq 'install') { Invoke-Install; exit 0 }
    $config = Get-Config
    $code = 0
    $result = @()
    switch ($Mode) {
        'audit' { $result = @(Invoke-Audit $config) }
        'new-task' { $result = @(Invoke-NewTask $config) }
        'cleanup' { $result = @(Invoke-Cleanup $config) }
        'purge' { $result = @(Invoke-Purge $config) }
        'install-task' { $result = @(Invoke-InstallTask) }
        'canary' { $result = @(Invoke-Canary $config) }
        'complete' { $result = @(Invoke-Lifecycle $config 'complete') }
        'abandon' { $result = @(Invoke-Lifecycle $config 'abandon') }
        'extend' { $result = @(Invoke-Lifecycle $config 'extend') }
        'health' { $result = @(Invoke-Health $config) }
        'test' { $result = @(Invoke-Tests $config) }
    }
    foreach ($item in $result) {
        if ($item -is [int]) { $code = [int]$item } else { Write-Output $item }
    }
    exit $code
} catch {
    try { Write-Event 'manager-failed' @{ mode = $Mode; error = $_.Exception.Message } } catch { }
    Write-Error $_.Exception.Message
    exit 1
}
