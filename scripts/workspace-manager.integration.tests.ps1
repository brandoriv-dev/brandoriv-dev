[CmdletBinding()]
param([Parameter(Mandatory=$true)][string] $EvidenceRoot)
$ErrorActionPreference = 'Stop'
$manager = Join-Path $PSScriptRoot 'workspace-manager.ps1'
$tokens = $null; $parseErrors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile($manager, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw 'Manager source does not parse.' }
# Load definitions only: never execute the dispatch block, installer, or legacy
# fixture suite. Every fixture is retained for inspection.
foreach ($definition in $ast.FindAll({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] }, $false)) {
    Invoke-Expression $definition.Extent.Text
}
$fixture = Join-Path ([IO.Path]::GetFullPath($EvidenceRoot)) ('manager-integration-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixture | Out-Null
$canonical = Join-Path $fixture 'canonical'
New-Item -ItemType Directory -Path (Join-Path $canonical '.git') -Force | Out-Null
$config = [pscustomobject]@{
    workbenchRoot = $fixture; taskRoot = (Join-Path $fixture 'tasks')
    quarantineRoot = (Join-Path ([IO.Path]::GetDirectoryName($fixture)) ('quarantine-' + [Guid]::NewGuid().ToString('N')))
    repositories = @([pscustomobject]@{name='fixture'; path=$canonical; remote='https://github.com/example/fixture.git'})
}
$Repository = 'fixture'; $TtlHours = 1; $Apply = $false
$LockTimeoutSeconds = 1
$MaxTasks = 1; $CleanupBudgetSeconds = 60; $AllowPurge = $false
$script:CleanupDeadline = $null
$script:CleanupStarted = $null
$script:CleanupProgressAt = $null
$script:CleanupCurrentTask = $null
$script:CleanupNeedsReview = 0
$script:CleanupProcessed = 0
$script:TestStateRoot = Join-Path $fixture 'state'
$script:CleanupOnlyTaskId = $null
$script:Calls = New-Object Collections.Generic.List[string]
$script:RemoteDefault = 'master'
$script:FreshHead = '1111111111111111111111111111111111111111'
$script:LeaseStarts = 0
$script:ActualRemote = 'https://github.com/example/fixture.git'
$script:SimulatedDirty = ''; $script:SimulatedStash = ''; $script:RemoteContainingHead = 'refs/remotes/origin/main'
function Assert-Integration([bool] $Condition, [string] $Name) {
    if (-not $Condition) { throw "FAIL: $Name" }
    Write-Output "PASS: $Name"
}
# Both native clone and wrapper calls are simulated; no remote or local push
# occurs. Actual metadata and path validation remain enabled.
function git {
    $script:Calls.Add(($args -join ' '))
    if ($args[0] -ne 'clone') { throw 'Unexpected native Git operation.' }
    New-Item -ItemType Directory -Path (Join-Path $args[-1] '.git') -Force | Out-Null
    $global:LASTEXITCODE = 0
}
function Invoke-Git([string] $WorkingDirectory, [string[]] $Arguments) {
    $script:Calls.Add(($Arguments -join ' '))
    switch ($Arguments[0]) {
        'symbolic-ref' { return "refs/remotes/origin/$script:RemoteDefault" }
        'rev-parse' { return $script:FreshHead }
        'checkout' { return }
        'branch' { return $script:ExpectedBranch }
        'remote' { return $script:ActualRemote }
        'status' { return $script:SimulatedDirty }
        'stash' { return $script:SimulatedStash }
        'for-each-ref' { return $script:RemoteContainingHead }
        default { throw "Forbidden Git operation: $($Arguments[0])" }
    }
}
function Start-Lease([string] $TaskRoot, [object] $Metadata, [int] $Hours) {
    $script:LeaseStarts++
    $Metadata.leasePath = Join-Path $TaskRoot '.workspace-lease'
    $Metadata.expiresAt = [DateTime]::UtcNow.AddHours($Hours).ToString('o')
    Save-Metadata $TaskRoot $Metadata
    return 123
}
Invoke-NewTask $config | Out-Null
$firstDirectory = @(Get-ChildItem -LiteralPath $config.taskRoot -Directory)[0]
$first = Get-Metadata $firstDirectory.FullName
Assert-Integration ($first.remoteHead -eq $script:FreshHead) 'allocation records fresh cloned remote HEAD'
Assert-Integration ($script:Calls.Contains('symbolic-ref refs/remotes/origin/HEAD')) 'allocation discovers master default branch'
Assert-Integration (@($script:Calls | Where-Object { $_ -match '^push\b' }).Count -eq 0) 'allocation performs zero pushes'
Assert-Integration ($script:Calls.Contains("checkout --quiet -b $($first.branch) $script:FreshHead")) 'task branch starts at discovered fresh HEAD'
$script:RemoteDefault = 'main'
Invoke-NewTask $config | Out-Null
Assert-Integration (@(Get-ChildItem -LiteralPath $config.taskRoot -Directory).Count -eq 2) 'sequential allocations have independent task identities'
$TaskId = $first.taskId; $script:ExpectedBranch = $first.branch
$userFile = Join-Path $first.clonePath 'preserved-untracked.txt'
Set-Content -LiteralPath $userFile -Value 'retain this content' -Encoding UTF8
$before = (Get-FileHash -LiteralPath $userFile).Hash
$startsBefore = $script:LeaseStarts
Invoke-Lifecycle $config 'resume' | Out-Null
Assert-Integration ($script:LeaseStarts -eq ($startsBefore + 1)) 'resume renews an available task lease'
Assert-Integration ((Get-FileHash -LiteralPath $userFile).Hash -eq $before) 'resume preserves untracked content'
$script:ExpectedBranch = 'unrelated'
$rejected = $false
try { Invoke-Lifecycle $config 'resume' | Out-Null } catch { $rejected = $_.Exception.Message -match 'branch differs' }
Assert-Integration $rejected 'resume rejects branch ownership mismatch'
$script:ExpectedBranch = $first.branch
$script:ActualRemote = 'https://github.com/example/unrelated.git'
$rejected = $false
try { Invoke-Lifecycle $config 'resume' | Out-Null } catch { $rejected = $_.Exception.Message -match 'origin differs' }
Assert-Integration $rejected 'resume rejects altered clone origin'
$script:ActualRemote = 'https://github.com/example/fixture.git'
# Expiry alone must not make unfinished work eligible for quarantine.
$first = Get-Metadata $firstDirectory.FullName
$first.expiresAt = [DateTime]::UtcNow.AddDays(-2).ToString('o')
Save-Metadata $firstDirectory.FullName $first
$cleanupOutput = @(Invoke-Cleanup $config) -join "`n"
Assert-Integration ($cleanupOutput -notmatch ('would quarantine ' + $first.taskId)) 'expired active task is excluded from quarantine'
Assert-Integration ((Get-FileHash -LiteralPath $userFile).Hash -eq $before) 'cleanup audit preserves unfinished content'
$first = Get-Metadata $firstDirectory.FullName
$first.leasePid = $PID
$first.leaseProcessStart = [DateTime]::UtcNow.AddDays(-7).ToString('o')
Stop-OwnedLease $first
Assert-Integration ($null -eq $first.leasePid -and $null -ne (Get-Process -Id $PID)) 'reused PID is cleared without stopping unrelated process'
$first.leasePid = [int]::MaxValue
$first.leaseProcessStart = [DateTime]::UtcNow.ToString('o')
Stop-OwnedLease $first
Assert-Integration ($null -eq $first.leasePid) 'missing keeper PID can be released safely'
$first.leasePid = $null
Save-Metadata $firstDirectory.FullName $first
$handle = [IO.File]::Open($first.leasePath, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
try {
    $rejected = $false
    try { Invoke-Lifecycle $config 'resume' | Out-Null } catch { $rejected = $_.Exception.Message -match 'live lease' }
    Assert-Integration $rejected 'resume refuses a currently held lease'
} finally { $handle.Dispose() }
Invoke-Lifecycle $config 'complete' | Out-Null
Invoke-Lifecycle $config 'complete' | Out-Null
Assert-Integration ((Get-Metadata $firstDirectory.FullName).status -eq 'completed') 'completion is idempotent'
Assert-Integration ((Get-FileHash -LiteralPath $userFile).Hash -eq $before) 'completion preserves clone contents'
$script:ExpectedBranch = $first.branch
$script:SimulatedDirty = '?? preserved-untracked.txt'
$cleanupOutput = @(Invoke-Cleanup $config) -join "`n"
Assert-Integration ($cleanupOutput -match ('keep ' + $first.taskId + ': local changes or stashes')) 'completed dirty clone stays available for handoff'
$script:SimulatedDirty = ''; $script:SimulatedStash = 'stash@{0}: preserved'
$cleanupOutput = @(Invoke-Cleanup $config) -join "`n"
Assert-Integration ($cleanupOutput -match ('keep ' + $first.taskId + ': local changes or stashes')) 'completed stashed clone stays available for handoff'
$script:SimulatedStash = ''; $script:RemoteContainingHead = ''
$cleanupOutput = @(Invoke-Cleanup $config) -join "`n"
Assert-Integration ($cleanupOutput -match ('keep ' + $first.taskId + ': local HEAD')) 'completed unpushed clone stays available for handoff'
$script:RemoteContainingHead = 'refs/remotes/origin/main'
$cleanupOutput = @(Invoke-Cleanup $config) -join "`n"
Assert-Integration ($cleanupOutput -match ('would quarantine ' + $first.taskId)) 'clean published completed clone is eligible in audit mode'
$script:ExpectedBranch = 'unrelated'
$cleanupResult = @(Invoke-Cleanup $config)
$health = Get-Content -LiteralPath (Join-Path $script:TestStateRoot 'health.json') -Raw | ConvertFrom-Json
Assert-Integration ($cleanupResult -contains 2 -and $health.phase -eq 'deferred' -and -not $health.lastSuccess -and $health.retainedNeedsReview -eq 1) 'branch mismatch is retained with truthful deferred health'
Assert-Integration (Test-Path -LiteralPath $firstDirectory.FullName) 'branch mismatch cleanup preserves source clone'
$script:ExpectedBranch = $first.branch
Invoke-Lifecycle $config 'resume' | Out-Null
$reopened = Get-Metadata $firstDirectory.FullName
Assert-Integration ($reopened.status -eq 'active' -and $null -eq $reopened.PSObject.Properties['completedAt']) 'completed handoff resumes as active without stale completion timestamp'
Assert-Integration ((Get-FileHash -LiteralPath $userFile).Hash -eq $before) 'reopening completed handoff preserves untracked content'
Invoke-Lifecycle $config 'complete' | Out-Null
$secondDirectory = @(Get-ChildItem -LiteralPath $config.taskRoot -Directory | Where-Object Name -ne $TaskId)[0]
$second = Get-Metadata $secondDirectory.FullName
$second.status = 'creating'; $second.expiresAt = [DateTime]::UtcNow.AddDays(-2).ToString('o')
Save-Metadata $secondDirectory.FullName $second
$cleanupOutput = @(Invoke-Cleanup $config) -join "`n"
Assert-Integration ($cleanupOutput -notmatch ('would quarantine ' + $second.taskId)) 'expired creating task is excluded from quarantine'
$second.status = 'active'; Save-Metadata $secondDirectory.FullName $second
$TaskId = $second.taskId
Invoke-Lifecycle $config 'abandon' | Out-Null
Invoke-Lifecycle $config 'abandon' | Out-Null
Assert-Integration ((Get-Metadata $secondDirectory.FullName).status -eq 'abandoned') 'abandonment is idempotent'
$script:ExpectedBranch = $second.branch
Invoke-Lifecycle $config 'resume' | Out-Null
$reopened = Get-Metadata $secondDirectory.FullName
Assert-Integration ($reopened.status -eq 'active' -and $null -eq $reopened.PSObject.Properties['abandonedAt']) 'abandoned handoff resumes as active without stale abandonment timestamp'
Invoke-Lifecycle $config 'abandon' | Out-Null
# Another process must hold the mutex: acquisition on this same thread would
# be recursive and would not exercise contention.
$holderScript = Join-Path $fixture 'hold-allocator.ps1'
$holderReady = Join-Path $fixture 'allocator-ready.txt'
@'
param([string] $ReadyPath)
$mutex = New-Object Threading.Mutex($false, 'Global\BrandoRiv.WorkspaceManager.Allocator')
try {
    [void]$mutex.WaitOne()
    Set-Content -LiteralPath $ReadyPath -Value 'ready'
    Start-Sleep -Seconds 3
} finally { $mutex.ReleaseMutex(); $mutex.Dispose() }
'@ | Set-Content -LiteralPath $holderScript -Encoding UTF8
$holder = Start-Process -FilePath powershell.exe -WindowStyle Hidden -PassThru -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $holderScript + '"'),'-ReadyPath',('"' + $holderReady + '"'))
for ($attempt=0; $attempt -lt 50 -and -not (Test-Path -LiteralPath $holderReady); $attempt++) { Start-Sleep -Milliseconds 100 }
Assert-Integration (Test-Path -LiteralPath $holderReady) 'independent process acquired allocator lock'
$rejected = $false; $timer = [Diagnostics.Stopwatch]::StartNew()
try { $unexpected = Enter-AllocatorMutex; $unexpected.ReleaseMutex(); $unexpected.Dispose() } catch { $rejected = $_.Exception.Message -match 'timed out.*retry' }
$timer.Stop()
Assert-Integration ($rejected -and $timer.Elapsed.TotalSeconds -ge 0.8 -and $timer.Elapsed.TotalSeconds -lt 2.5) 'allocator waits then gives bounded actionable timeout'
$holder.WaitForExit()
$available = Enter-AllocatorMutex
$available.ReleaseMutex(); $available.Dispose()
Assert-Integration $true 'allocator lock becomes available after competing process finishes'
Write-Output "Integration fixtures retained at $fixture"
