[CmdletBinding()]
param([string] $ManagerPath = '', [string] $EvidenceRoot = $env:TEMP)
$ErrorActionPreference = 'Stop'
if (-not $ManagerPath) { $ManagerPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'workspace-manager.ps1' }
$errors = $null; $tokens = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($ManagerPath, [ref]$tokens, [ref]$errors)
if ($errors) { throw 'Manager source failed to parse.' }
foreach ($function in $ast.FindAll({ param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] }, $false)) {
    . ([scriptblock]::Create($function.Extent.Text))
}
$ScriptPath = $ManagerPath
$InstallRoot = Split-Path -Parent $ManagerPath
$LockTimeoutSeconds = 1; $MaxTasks = 1; $CleanupBudgetSeconds = 600
$AllowPurge = $false; $Apply = $true
$script:CleanupDeadline = $null; $script:CleanupStarted = $null
$script:CleanupProgressAt = $null; $script:CleanupCurrentTask = $null
$script:CleanupNeedsReview = 0; $script:CleanupProcessed = 0
$script:CleanupOnlyTaskId = $null
# Fixtures are deliberately retained. This suite never deletes or pushes.
# Keep fixture paths short for Windows PowerShell 5.1 file APIs.
$fixtureRoot = Join-Path ([IO.Path]::GetFullPath($EvidenceRoot)) ('wc-' + [Guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Path $fixtureRoot | Out-Null
$script:TestStateRoot = Join-Path $fixtureRoot 'state'
$script:NativeCleanupMutex = ${function:Enter-CleanupMutex}
$script:CleanupMutexName = 'Local\WorkspaceFixtureCleanup-' + [Guid]::NewGuid().ToString('N')
function Enter-CleanupMutex { & $script:NativeCleanupMutex -Name $script:CleanupMutexName }
$script:NativeLiveRemoteReader = ${function:Get-LiveRemoteRefs}
# The real Git ancestry checks run against synthetic repositories. Only the
# remote advertisement is modeled; no external authentication is used.
$script:LiveRemoteDeleted = $false
function Get-LiveRemoteRefs([string] $ClonePath) {
    if ($script:LiveRemoteDeleted) { return '' }
    return (Invoke-Git $ClonePath @('for-each-ref','--format=%(objectname)%09refs/heads/main','refs/remotes/origin/main'))
}
function New-FixtureConfig([string] $Name) {
    $root = Join-Path $fixtureRoot $Name
    $config = [pscustomobject]@{
        workbenchRoot = $root; taskRoot = (Join-Path $root '.tasks')
        quarantineRoot = (Join-Path $fixtureRoot ($Name + '-quarantine'))
        repositories = @([pscustomobject]@{name='brandoriv-dev';path=(Join-Path $root 'baseline');remote='https://github.com/BrandoRiv/brandoriv-dev.git'})
    }
    New-Item -ItemType Directory -Force -Path $config.taskRoot | Out-Null
    return $config
}
$batch = New-FixtureConfig 'batch'
$first = New-SyntheticTask $batch ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
$second = New-SyntheticTask $batch ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
$result = @(Invoke-Cleanup $batch)
Assert-Test ($result -contains 2) 'batch cap reports deferred work'
Assert-Test (@(Get-ChildItem -LiteralPath $batch.quarantineRoot -Directory).Count -eq 1) 'only one clone is quarantined per default batch'
Assert-Test (@(Get-ChildItem -LiteralPath $batch.taskRoot -Directory).Count -eq 1) 'remaining clone is preserved'
$health = Get-Content -LiteralPath (Join-Path $script:TestStateRoot 'health.json') -Raw | ConvertFrom-Json
Assert-Test ($health.phase -eq 'deferred' -and $health.lastSuccess -eq $false -and $health.quarantinedTasks -eq 1) 'partial completion has fresh actionable health'

$timeout = New-FixtureConfig 'timeout'
$item = New-SyntheticTask $timeout ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
$CleanupBudgetSeconds = 1
function Get-FileHash {
    param([string] $LiteralPath, [string] $Algorithm)
    $runningHealth = Get-Content -LiteralPath (Join-Path $script:TestStateRoot 'health.json') -Raw | ConvertFrom-Json
    if ($runningHealth.phase -ne 'running' -or $runningHealth.lastSuccess -ne $false) { throw 'Running progress must not claim completion.' }
    $script:ObservedRunningHealth = $true
    Start-Sleep -Milliseconds 1100
    Microsoft.PowerShell.Utility\Get-FileHash -LiteralPath $LiteralPath -Algorithm $Algorithm
}
$result = @(Invoke-Cleanup $timeout)
Assert-Test $script:ObservedRunningHealth 'health records in-progress work before hashing finishes'
Assert-Test ($result -contains 2 -and (Test-Path -LiteralPath $item.root)) 'budget expiration leaves source in place'
Assert-Test (-not (Test-Path -LiteralPath (Join-Path $timeout.quarantineRoot $item.metadata.taskId))) 'timeout never moves incomplete integrity work'
$health = Get-Content -LiteralPath (Join-Path $script:TestStateRoot 'health.json') -Raw | ConvertFrom-Json
Assert-Test ($health.phase -eq 'deferred' -and $health.lastSuccess -eq $false -and $health.lastError -match 'budget') 'timeout health explains retained work'
# Restore the real hash command without removing a function or a fixture.
function Get-FileHash {
    param([string] $LiteralPath, [string] $Algorithm)
    Microsoft.PowerShell.Utility\Get-FileHash -LiteralPath $LiteralPath -Algorithm $Algorithm
}
$CleanupBudgetSeconds = 600
$result = @(Invoke-Cleanup $timeout)
Assert-Test ($result -contains 0 -and -not (Test-Path -LiteralPath $item.root)) 'interrupted source-only transaction is safely retried'
Assert-IntegrityManifest (Join-Path $timeout.quarantineRoot $item.metadata.taskId) $item.metadata.taskId | Out-Null
Assert-Test $true 'retried quarantine retains full integrity verification'

$review = New-FixtureConfig 'review'
$item = New-SyntheticTask $review ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
Invoke-Git $item.clone @('branch','-M','main') | Out-Null
$result = @(Invoke-Cleanup $review)
$health = Get-Content -LiteralPath (Join-Path $script:TestStateRoot 'health.json') -Raw | ConvertFrom-Json
Assert-Test ($result -contains 2 -and $health.retainedNeedsReview -eq 1 -and (Test-Path -LiteralPath $item.root)) 'branch mismatch is retained with explicit review health'

$healthPath = Join-Path $script:TestStateRoot 'health.json'
foreach ($phase in @('running','deferred')) {
    Write-RunHealth ([DateTime]::UtcNow) $false 'Retained diagnostic' $phase
    $before = (Microsoft.PowerShell.Utility\Get-FileHash -LiteralPath $healthPath -Algorithm SHA256).Hash
    $read = @(Invoke-Health $review)
    $diagnostic = (($read | Where-Object { $_ -is [string] }) -join "`n") | ConvertFrom-Json
    Assert-Test ($read -contains 2 -and $diagnostic.phase -eq $phase -and $diagnostic.lastRun.lastError -eq 'Retained diagnostic') "health preserves truthful $phase state"
    Assert-Test ($before -eq (Microsoft.PowerShell.Utility\Get-FileHash -LiteralPath $healthPath -Algorithm SHA256).Hash) "health does not overwrite $phase run history"
}
$oldState = $script:TestStateRoot
$script:TestStateRoot = Join-Path $fixtureRoot 'absent-state'
$read = @(Invoke-Health $review)
$diagnostic = (($read | Where-Object { $_ -is [string] }) -join "`n") | ConvertFrom-Json
Assert-Test ($read -contains 2 -and $diagnostic.installedReady -and $null -eq $diagnostic.healthy -and -not (Test-Path -LiteralPath $script:TestStateRoot)) 'missing health is unknown without creating state directories'
$script:TestStateRoot = $oldState
Convert-ToJsonText @{schema=1;lastStart=[DateTime]::UtcNow.ToString('o');lastSuccess=$false;lastError='Legacy failure'} | Set-Content -LiteralPath $healthPath -Encoding UTF8
$read = @(Invoke-Health $review)
$diagnostic = (($read | Where-Object { $_ -is [string] }) -join "`n") | ConvertFrom-Json
Assert-Test ($read -contains 1 -and $diagnostic.phase -eq 'failed' -and $diagnostic.lastRun.lastError -eq 'Legacy failure') 'legacy failed run remains a failure'
Set-Content -LiteralPath $healthPath -Value '{' -Encoding UTF8
$before = (Microsoft.PowerShell.Utility\Get-FileHash -LiteralPath $healthPath -Algorithm SHA256).Hash
$read = @(Invoke-Health $review)
Assert-Test ($read -contains 1 -and $before -eq (Microsoft.PowerShell.Utility\Get-FileHash -LiteralPath $healthPath -Algorithm SHA256).Hash) 'malformed health is reported without repairing or overwriting it'
Write-RunHealth ([DateTime]::UtcNow) $true $null 'finished'
$read = @(Invoke-Health $review)
Assert-Test ($read -contains 0) 'success requires a finished successful run'

foreach ($scenario in @('dirty-fixture','untracked-fixture','ahead-fixture')) {
    $retain = New-FixtureConfig $scenario
    $item = New-SyntheticTask $retain ([Guid]::NewGuid().ToString('N')) $scenario
    $result = @(Invoke-Cleanup $retain)
    Assert-Test ($result -contains 2 -and (Test-Path -LiteralPath $item.root)) "$scenario remains in its original task root"
}
$refs = New-FixtureConfig 'alternate-ref'
$item = New-SyntheticTask $refs ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
Invoke-Git $item.clone @('checkout','--quiet','-b','unpublished-alternate') | Out-Null
Set-Content -LiteralPath (Join-Path $item.clone 'alternate.txt') -Value 'unique alternate branch'
Invoke-Git $item.clone @('add','alternate.txt') | Out-Null
Invoke-Git $item.clone @('commit','--quiet','-m','unpublished alternate') | Out-Null
Invoke-Git $item.clone @('update-ref','refs/remotes/origin/deleted-alternate','HEAD') | Out-Null
Invoke-Git $item.clone @('checkout','--quiet',$item.metadata.branch) | Out-Null
$result = @(Invoke-Cleanup $refs)
Assert-Test ($result -contains 2 -and (Test-Path -LiteralPath $item.root)) 'clean published HEAD cannot hide an unpublished alternate branch or stale remote copy'
$tags = New-FixtureConfig 'unpublished-tag'
$item = New-SyntheticTask $tags ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
Invoke-Git $item.clone @('checkout','--quiet','--detach') | Out-Null
Set-Content -LiteralPath (Join-Path $item.clone 'tag.txt') -Value 'unique tagged commit'
Invoke-Git $item.clone @('add','tag.txt') | Out-Null
Invoke-Git $item.clone @('commit','--quiet','-m','tag-only work') | Out-Null
Invoke-Git $item.clone @('tag','preserve-tag') | Out-Null
Invoke-Git $item.clone @('checkout','--quiet',$item.metadata.branch) | Out-Null
$result = @(Invoke-Cleanup $tags)
Assert-Test ($result -contains 2 -and (Test-Path -LiteralPath $item.root)) 'unpublished tag-only work is retained'
$recovery = New-FixtureConfig 'recovery-ref'
$item = New-SyntheticTask $recovery ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
Invoke-Git $item.clone @('checkout','--quiet','--detach') | Out-Null
Set-Content -LiteralPath (Join-Path $item.clone 'recovery.txt') -Value 'recovery-only work'
Invoke-Git $item.clone @('add','recovery.txt') | Out-Null
Invoke-Git $item.clone @('commit','--quiet','-m','recovery-only work') | Out-Null
Invoke-Git $item.clone @('update-ref','refs/recovery/preserved','HEAD') | Out-Null
Invoke-Git $item.clone @('checkout','--quiet',$item.metadata.branch) | Out-Null
$result = @(Invoke-Cleanup $recovery)
Assert-Test ($result -contains 2 -and (Test-Path -LiteralPath $item.root)) 'non-branch recovery refs are retained too'
$deleted = New-FixtureConfig 'deleted-remote'
$item = New-SyntheticTask $deleted ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
$script:LiveRemoteDeleted = $true
$result = @(Invoke-Cleanup $deleted)
Assert-Test ($result -contains 2 -and (Test-Path -LiteralPath $item.root)) 'cached main is insufficient after the live publication disappears'
$script:LiveRemoteDeleted = $false
$native = New-FixtureConfig 'native-remote'
$item = New-SyntheticTask $native ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
$bare = Join-Path $fixtureRoot 'remote.git'
if (-not (Test-UnderPath $bare $fixtureRoot)) { throw 'Synthetic remote escaped fixture root.' }
Invoke-Git $fixtureRoot @('init','--quiet','--bare',$bare) | Out-Null
Invoke-Git $item.clone @('remote','set-url','origin',$bare) | Out-Null
$native.repositories[0].remote = $bare
$item.metadata.remote = $bare
Save-Metadata $item.root $item.metadata
# Push only to this owned local bare fixture, never to an application remote.
Invoke-Git $item.clone @('push','--quiet','origin','HEAD:refs/heads/main') | Out-Null
$script:ModeledLiveRemoteReader = ${function:Get-LiveRemoteRefs}
function Get-LiveRemoteRefs([string] $ClonePath) { & $script:NativeLiveRemoteReader $ClonePath }
$result = @(Invoke-Cleanup $native)
Assert-Test ($result -contains 0 -and (Test-Path -LiteralPath (Join-Path $native.quarantineRoot $item.metadata.taskId))) 'native ls-remote verifies publication in an isolated local bare remote'
${function:Get-LiveRemoteRefs} = $script:ModeledLiveRemoteReader
$mixed = New-FixtureConfig 'mixed-failure-deferred'
$broken = New-SyntheticTask $mixed ('0' * 31 + '1') 'clean-fixture'
Set-Content -LiteralPath (Join-Path $broken.root '.workspace-task.json') -Value '{'
$item = New-SyntheticTask $mixed ('f' * 32) 'clean-fixture'
Invoke-Git $item.clone @('branch','-M','mismatched') | Out-Null
$result = @(Invoke-Cleanup $mixed)
$health = Get-Content -LiteralPath $healthPath -Raw | ConvertFrom-Json
$read = @(Invoke-Health $mixed)
Assert-Test ($result -contains 1 -and $health.phase -eq 'failed' -and $read -contains 1) 'failure outranks later deferred work in exit status and persistent health'
Assert-Test ($health.lastError -notmatch 'branch differs' -and (Test-Path -LiteralPath $broken.root) -and (Test-Path -LiteralPath $item.root)) 'original failure diagnostic and both task roots are preserved'
$purge = New-FixtureConfig 'purge-recheck'
$item = New-SyntheticTask $purge ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
Invoke-Cleanup $purge | Out-Null
$purgePath = Join-Path $purge.quarantineRoot $item.metadata.taskId
$manifestPath = Join-Path $purgePath '.workspace-quarantine.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$manifest.createdAt = [DateTime]::UtcNow.AddDays(-8).ToString('o')
Convert-ToJsonText $manifest 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
$script:LiveRemoteDeleted = $true
$result = @(Invoke-Purge $purge)
Assert-Test ($result -contains 2 -and (Test-Path -LiteralPath $purgePath)) 'purge rechecks live publication after quarantine and retains deleted remote work'
$script:LiveRemoteDeleted = $false
$stash = New-FixtureConfig 'purge-stash'
$stashItem = New-SyntheticTask $stash ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
Invoke-Cleanup $stash | Out-Null
$stashPath = Join-Path $stash.quarantineRoot $stashItem.metadata.taskId
$stashClone = Join-Path $stashPath 'brandoriv-dev'
Set-Content -LiteralPath (Join-Path $stashClone 'stashed.txt') -Value 'preserve real stash'
Invoke-Git $stashClone @('stash','push','--include-untracked','--quiet','-m','retained fixture stash') | Out-Null
$result = @(Invoke-Purge $stash)
Assert-Test ($result -contains 2 -and (Test-Path -LiteralPath $stashPath)) 'purge preserves a real stash created after quarantine'
# Intercept deletion: exercise every purge gate and transaction without deleting
# fixtures. The target must be the exact owned synthetic quarantine.
function Remove-Item { param([string] $LiteralPath, [switch] $Recurse, [switch] $Force)
    if ($LiteralPath -ne $purgePath -or -not (Test-UnderPath $LiteralPath $fixtureRoot)) { throw 'Unexpected purge target.' }
    $script:ObservedPurgeTarget = $LiteralPath
}
$result = @(Invoke-Purge $purge)
Assert-Test ($result -contains 0 -and $script:ObservedPurgeTarget -eq $purgePath) 'purge requires verified live publication, integrity and elapsed retention before exact owned deletion'
function Invoke-Cleanup { param($Config) return 0 }
function Invoke-Purge { param($Config) throw 'Purge must not run without explicit authorization.' }
$result = @(Invoke-ScheduledMaintenance $review)
Assert-Test ($result -contains 0) 'scheduled cleanup skips purge by default'
$AllowPurge = $true
function Invoke-Purge { param($Config) $script:ObservedExplicitPurge = $true; return 2 }
$result = @(Invoke-ScheduledMaintenance $review)
Assert-Test ($script:ObservedExplicitPurge -and $result -contains 2) 'explicit scheduled purge opt-in preserves deferred status'
Write-Output "All cleanup regressions passed. Fixtures retained at $fixtureRoot"
