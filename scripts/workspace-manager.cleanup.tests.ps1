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
$script:NativeGitHubApiInvoker = ${function:Invoke-GitHubApi}
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
$CleanupBudgetSeconds = 600
$script:ObservedRunningHealth = $false
function Get-FileHash {
    param([string] $LiteralPath, [string] $Algorithm)
    $runningHealth = Get-Content -LiteralPath (Join-Path $script:TestStateRoot 'health.json') -Raw | ConvertFrom-Json
    if ($runningHealth.phase -ne 'running' -or $runningHealth.lastSuccess -ne $false) { throw 'Running progress must not claim completion.' }
    $script:ObservedRunningHealth = $true
    $hash = Microsoft.PowerShell.Utility\Get-FileHash -LiteralPath $LiteralPath -Algorithm $Algorithm
    # Cross the deadline after hashing, independent of machine/Git speed.
    $script:CleanupDeadline = [DateTime]::UtcNow.AddSeconds(-1)
    return $hash
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
function Remove-Item { param([string] $LiteralPath, [switch] $Recurse, [switch] $Force)
    throw "Noncommit preservation regression reached deletion: $LiteralPath"
}
foreach ($kind in @('blob','tree')) {
    $objects = New-FixtureConfig ('purge-' + $kind)
    $item = New-SyntheticTask $objects ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
    $bare = Join-Path $fixtureRoot ($kind + '-remote.git')
    Invoke-Git $fixtureRoot @('init','--quiet','--bare',$bare) | Out-Null
    Invoke-Git $item.clone @('remote','set-url','origin',$bare) | Out-Null
    $objects.repositories[0].remote = $bare; $item.metadata.remote = $bare
    Save-Metadata $item.root $item.metadata
    Invoke-Git $item.clone @('push','--quiet','origin','HEAD:refs/heads/main') | Out-Null
    $content = Join-Path $fixtureRoot ('unique-' + $kind + '.txt')
    Set-Content -LiteralPath $content -Value ('unique unpublished ' + $kind + ' ' + [Guid]::NewGuid().ToString('N')) -Encoding UTF8
    $object = Invoke-Git $item.clone @('hash-object','-w',$content)
    if ($kind -eq 'tree') {
        # A private index keeps fixture tree creation independent of native stdin encoding.
        $previousIndexFile = [Environment]::GetEnvironmentVariable('GIT_INDEX_FILE', 'Process')
        try {
            $env:GIT_INDEX_FILE = Join-Path $fixtureRoot ('mktree-' + [Guid]::NewGuid().ToString('N') + '.index')
            Invoke-Git $item.clone @('read-tree','--empty') | Out-Null
            Invoke-Git $item.clone @('update-index','--add','--cacheinfo',("100644,$object,unique.txt")) | Out-Null
            $object = Invoke-Git $item.clone @('write-tree')
        } finally {
            $env:GIT_INDEX_FILE = $previousIndexFile
            if ([Environment]::GetEnvironmentVariable('GIT_INDEX_FILE', 'Process') -cne $previousIndexFile) {
                throw 'Private fixture Git index environment was not restored.'
            }
        }
    }
    Invoke-Git $item.clone @('update-ref',('refs/recovery/unique-' + $kind),$object) | Out-Null
    Assert-Test ((Invoke-Git $item.clone @('rev-list','--count',$object,'--not','HEAD')) -eq '0') "native unpublished $kind has misleading zero commit count"
    $manifest = New-IntegrityManifest $item.root $item.metadata.taskId
    $manifest.createdAt = [DateTime]::UtcNow.AddDays(-8).ToString('o')
    Convert-ToJsonText $manifest 8 | Set-Content -LiteralPath (Join-Path $item.root '.workspace-quarantine.json') -Encoding UTF8
    New-Item -ItemType Directory -Path $objects.quarantineRoot | Out-Null
    $held = Join-Path $objects.quarantineRoot $item.metadata.taskId
    Move-Item -LiteralPath $item.root -Destination $held
    $journal = Join-Path $script:TestStateRoot 'transactions.jsonl'
    $journalBefore = (Microsoft.PowerShell.Utility\Get-FileHash -LiteralPath $journal).Hash
    $result = @(Invoke-Purge $objects)
    Assert-Test ($result -contains 2 -and (Test-Path -LiteralPath $held)) "purge retains an expired fixture with a noncommit $kind ref before deletion"
    Assert-IntegrityManifest $held $item.metadata.taskId | Out-Null
    Assert-Test ($journalBefore -eq (Microsoft.PowerShell.Utility\Get-FileHash -LiteralPath $journal).Hash) "$kind purge refusal preserves all files and writes no transaction"
}
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
$scheduledTaskId = ([Guid]::NewGuid().ToString('N'))
$scheduledMarkerPath = Get-CanaryMarkerPath
New-Item -ItemType Directory -Path (Split-Path -Parent $scheduledMarkerPath) -Force | Out-Null
$scheduledSourceHash = (Get-FileHash -LiteralPath $ScriptPath -Algorithm SHA256).Hash.ToLowerInvariant()
Convert-ToJsonText @{ schema = 1; taskId = $scheduledTaskId; proof = (Get-CanaryProof $scheduledTaskId); restored = $true; sourceSha256 = $scheduledSourceHash } | Set-Content -LiteralPath $scheduledMarkerPath -Encoding UTF8
$result = @(Invoke-ScheduledMaintenance $review)
Assert-Test ($result -contains 0) 'scheduled cleanup skips purge by default'
$AllowPurge = $true
function Invoke-Purge { param($Config) $script:ObservedExplicitPurge = $true; return 2 }
$result = @(Invoke-ScheduledMaintenance $review)
Assert-Test ($script:ObservedExplicitPurge -and $result -contains 2) 'explicit scheduled purge opt-in preserves deferred status'
$script:GitHubCompareResponse = $null; $script:GitHubCommitSha = $null; $script:GitHubExitCode = 0; $script:GitHubTimedOut = $false; $script:GitHubCall = $null; $script:GitHubCalls = @()
function Invoke-GitHubApi([string] $Endpoint, [string] $Filter) {
    $script:GitHubCall = @($Endpoint,$Filter)
    $script:GitHubCalls += ,@($Endpoint,$Filter)
    if ($script:GitHubTimedOut) { return [pscustomobject]@{ ExitCode = $null; Output = ''; TimedOut = $true } }
    if ($script:GitHubExitCode -ne 0) { return [pscustomobject]@{ ExitCode = $script:GitHubExitCode; Output = ''; TimedOut = $false } }
    if ($Endpoint -match '/commits/') { return [pscustomobject]@{ ExitCode = 0; Output = $script:GitHubCommitSha; TimedOut = $false } }
    return [pscustomobject]@{ ExitCode = 0; Output = $script:GitHubCompareResponse; TimedOut = $false }
}
$localCommit = 'a' * 40; $remoteTip = 'b' * 40
$compareEndpoint = "repos/brandoriv-dev/brandoriv-dev/compare/$localCommit...$remoteTip"
$compareFilter = '{base: .base_commit.sha, status: .status, ahead_by: .ahead_by, behind_by: .behind_by, merge_base: .merge_base_commit.sha}'
$script:GitHubCommitSha = $remoteTip
$script:GitHubCompareResponse = @{base=$localCommit;status='ahead';ahead_by=2;behind_by=0;merge_base=$localCommit} | ConvertTo-Json -Compress
Assert-Test ((Test-GitHubPublishedCommit 'https://github.com/brandoriv-dev/brandoriv-dev.git' $localCommit $remoteTip) -eq $true) 'exact GitHub compare proves a published ancestor'
Assert-Test ($script:GitHubCalls.Count -eq 2 -and $script:GitHubCalls[0][0] -eq "repos/brandoriv-dev/brandoriv-dev/commits/$remoteTip" -and $script:GitHubCall[0] -eq $compareEndpoint -and $script:GitHubCall[1] -eq $compareFilter) 'GitHub check binds the exact repository and immutable advertised tip'
$script:GitHubCalls = @()
Assert-Test ($null -eq (Test-GitHubPublishedCommit 'https://github.com/../brandoriv-dev.git' $localCommit $remoteTip) -and $script:GitHubCalls.Count -eq 0) 'unsafe GitHub path segments are rejected before invoking gh'
$script:GitHubCommitSha = $localCommit
$script:GitHubCompareResponse = @{base=$localCommit;status='identical';ahead_by=0;behind_by=0;merge_base=$localCommit} | ConvertTo-Json -Compress
Assert-Test ((Test-GitHubPublishedCommit 'https://github.com/brandoriv-dev/brandoriv-dev.git' $localCommit $localCommit) -eq $true) 'identical GitHub tips count as published'
$script:GitHubCommitSha = 'c' * 40
Assert-Test ((Test-GitHubPublishedCommit 'https://github.com/brandoriv-dev/brandoriv-dev.git' $localCommit $remoteTip) -eq $false) 'mismatched immutable commit identity is rejected'
$script:GitHubCommitSha = $remoteTip
$script:GitHubCompareResponse = @{base=$localCommit;status='behind';ahead_by=0;behind_by=2;merge_base=$remoteTip} | ConvertTo-Json -Compress
Assert-Test ((Test-GitHubPublishedCommit 'https://github.com/brandoriv-dev/brandoriv-dev.git' $localCommit $remoteTip) -eq $false) 'behind comparison is rejected'
$script:GitHubCompareResponse = @{base=$localCommit;status='diverged';ahead_by=1;behind_by=1;merge_base=('c' * 40)} | ConvertTo-Json -Compress
Assert-Test ((Test-GitHubPublishedCommit 'https://github.com/brandoriv-dev/brandoriv-dev.git' $localCommit $remoteTip) -eq $false) 'diverged unpublished commit is rejected'
foreach ($httpCode in @(403,404)) {
    $script:GitHubExitCode = 1; $script:GitHubCompareResponse = $null
    Assert-Test ($null -eq (Test-GitHubPublishedCommit 'https://github.com/brandoriv-dev/brandoriv-dev.git' $localCommit $remoteTip)) "GitHub $httpCode failure yields no publication proof"
}
$script:GitHubExitCode = 0; $script:GitHubTimedOut = $true
Assert-Test ($null -eq (Test-GitHubPublishedCommit 'https://github.com/brandoriv-dev/brandoriv-dev.git' $localCommit $remoteTip)) 'timed out GitHub calls yield no publication proof'
$script:GitHubTimedOut = $false
$previousDeadline = $script:CleanupDeadline
$script:CleanupDeadline = [DateTime]::UtcNow.AddMilliseconds(-1)
$deadlineResult = & $script:NativeGitHubApiInvoker 'repos/brandoriv-dev/brandoriv-dev/commits/deadbeef' '.sha'
$script:CleanupDeadline = $previousDeadline
Assert-Test ($deadlineResult.TimedOut -and $deadlineResult.ExitCode -eq $null) 'expired cleanup deadline prevents starting a GitHub subprocess'
$script:GitHubCompareResponse = @{base=$localCommit;status='ahead';ahead_by=1;behind_by=0;merge_base=$localCommit} | ConvertTo-Json -Compress
$malformedResponses = @(
    '{"base":null,"status":"ahead","ahead_by":1,"behind_by":0,"merge_base":"' + $localCommit + '"}',
    (@{base=$localCommit;status='ahead';ahead_by=$null;behind_by=0;merge_base=$localCommit} | ConvertTo-Json -Compress),
    (@{base=$localCommit;status='ahead';ahead_by='1';behind_by=0;merge_base=$localCommit} | ConvertTo-Json -Compress),
    (@{base=$localCommit;status='ahead';ahead_by=1;behind_by=0;merge_base=$localCommit;extra='unexpected'} | ConvertTo-Json -Compress),
    (@{base=$localCommit;status='unknown';ahead_by=1;behind_by=0;merge_base=$localCommit} | ConvertTo-Json -Compress)
)
foreach ($response in $malformedResponses) {
    $script:GitHubCompareResponse = $response
    Assert-Test ($null -eq (Test-GitHubPublishedCommit 'https://github.com/brandoriv-dev/brandoriv-dev.git' $localCommit $remoteTip)) 'malformed GitHub compare schema yields no publication proof'
}
$ancestry = New-FixtureConfig 'github-ancestry'
$ancestry.repositories[0].remote = 'https://github.com/brandoriv-dev/brandoriv-dev.git'
$item = New-SyntheticTask $ancestry ([Guid]::NewGuid().ToString('N')) 'clean-fixture'
$script:GitHubTip = 'd' * 40
function Invoke-GitHubApi([string] $Endpoint, [string] $Filter) {
    $script:GitHubCall = @($Endpoint,$Filter)
    $script:GitHubCalls += ,@($Endpoint,$Filter)
    if ($script:GitHubTimedOut) { return [pscustomobject]@{ ExitCode = $null; Output = ''; TimedOut = $true } }
    if ($script:GitHubExitCode -ne 0) { return [pscustomobject]@{ ExitCode = $script:GitHubExitCode; Output = ''; TimedOut = $false } }
    if ($Endpoint -match '/commits/') {
        $sha = $Endpoint.Split('/')[-1]
        if ($script:GitHubUnresolvableTips -contains $sha) { return [pscustomobject]@{ ExitCode = 1; Output = ''; TimedOut = $false } }
        return [pscustomobject]@{ ExitCode = 0; Output = $sha; TimedOut = $false }
    }
    return [pscustomobject]@{ ExitCode = 0; Output = $script:GitHubCompareResponse; TimedOut = $false }
}
function Get-LiveRemoteRefs([string] $ClonePath) {
    if ($script:GitHubTips) { return (@($script:GitHubTips | ForEach-Object { "$($_.sha)`t$($_.ref)" }) -join "`n") }
    return "$script:GitHubTip`trefs/heads/main"
}
function Set-GitHubCompare([string] $Mode, [string] $Commit) {
    $script:GitHubExitCode = 0
    $script:GitHubCommitSha = $script:GitHubTip
    switch ($Mode) {
        'ahead' { $script:GitHubCompareResponse = @{base=$Commit;status='ahead';ahead_by=1;behind_by=0;merge_base=$Commit} | ConvertTo-Json -Compress }
        'behind' { $script:GitHubCompareResponse = @{base=$Commit;status='behind';ahead_by=0;behind_by=1;merge_base=$script:GitHubTip} | ConvertTo-Json -Compress }
        'unpublished' { $script:GitHubCompareResponse = @{base=$Commit;status='diverged';ahead_by=1;behind_by=1;merge_base=('c' * 40)} | ConvertTo-Json -Compress }
        'unavailable' { $script:GitHubExitCode = 1; $script:GitHubCompareResponse = $null }
    }
}
$candidateCommit = Invoke-Git $item.clone @('rev-parse','HEAD')
$refsBefore = Invoke-Git $item.clone @('for-each-ref','--format=%(refname)|%(objectname)')
$statusBefore = Invoke-Git $item.clone @('status','--porcelain','--untracked-files=all')
$fileBefore = (Get-FileHash -LiteralPath (Join-Path $item.clone 'clean-fixture.txt') -Algorithm SHA256).Hash
Set-GitHubCompare 'ahead' $candidateCommit
$script:GitHubCalls = @()
$preservation = @(Get-PreservationProblems $ancestry $item.metadata $item.clone)
Assert-Test ($preservation.Count -eq 0) 'missing local remote tip is verified by exact GitHub ancestry'
Assert-Test ($script:GitHubCalls.Count -eq 2) 'identical candidate and branch commit share one ancestry proof'
foreach ($mode in @('behind','unpublished','unavailable')) {
    Set-GitHubCompare $mode $candidateCommit
    $preservation = @(Get-PreservationProblems $ancestry $item.metadata $item.clone) -join '; '
    Assert-Test ($preservation -match 'not reachable|could not be verified') "$mode ancestry proof retains the original task"
}
foreach ($kind in @('blob','tree')) {
    if ($kind -eq 'blob') { $nonCommit = Invoke-Git $item.clone @('rev-parse','HEAD:clean-fixture.txt') }
    else { $nonCommit = Invoke-Git $item.clone @('rev-parse','HEAD^{tree}') }
    $ref = "refs/recovery/preservation-$kind"
    Invoke-Git $item.clone @('update-ref',$ref,$nonCommit) | Out-Null
    Set-GitHubCompare 'ahead' $candidateCommit
    $preservation = @(Get-PreservationProblems $ancestry $item.metadata $item.clone) -join '; '
    Assert-Test ($preservation -match 'does not peel to a commit') "published ancestry never qualifies a local $kind ref"
    Invoke-Git $item.clone @('update-ref','-d',$ref) | Out-Null
}
$refsAfter = Invoke-Git $item.clone @('for-each-ref','--format=%(refname)|%(objectname)')
$statusAfter = Invoke-Git $item.clone @('status','--porcelain','--untracked-files=all')
$fileAfter = (Get-FileHash -LiteralPath (Join-Path $item.clone 'clean-fixture.txt') -Algorithm SHA256).Hash
Assert-Test ($refsBefore -eq $refsAfter -and $statusBefore -eq $statusAfter -and $fileBefore -eq $fileAfter) 'publication checks leave local refs and working tree unchanged'
$script:GitHubUnresolvableTips = @('e' * 40)
$script:GitHubTips = @(
    [pscustomobject]@{sha=$script:GitHubUnresolvableTips[0];ref='refs/tags/v1'},
    [pscustomobject]@{sha=('f' * 40);ref='refs/tags/v1^{}'}
)
$script:GitHubCalls = @()
Set-GitHubCompare 'ahead' $candidateCommit
$preservation = @(Get-PreservationProblems $ancestry $item.metadata $item.clone)
Assert-Test ($preservation.Count -eq 0 -and $script:GitHubCalls.Count -eq 3) 'annotated tag object is skipped and its peeled live commit can prove ancestry'
$ancestry.repositories[0].remote = 'https://github.com/another-owner/another-repository.git'
$script:GitHubCalls = @()
$preservation = @(Get-PreservationProblems $ancestry $item.metadata $item.clone) -join '; '
Assert-Test ($preservation -match 'origin differs' -and $script:GitHubCalls.Count -eq 0) 'unaccepted repository identity never reaches GitHub ancestry proof'
$ancestry.repositories[0].remote = 'https://github.com/brandoriv-dev/brandoriv-dev.git'
$script:GitHubUnresolvableTips = @()
$script:GitHubTips = @((0..32 | ForEach-Object { [pscustomobject]@{sha=(('a' * 38) + ('{0:x2}' -f $_));ref="refs/heads/main-$_"} }))
$script:GitHubCalls = @()
Set-GitHubCompare 'unpublished' $candidateCommit
$preservation = @(Get-PreservationProblems $ancestry $item.metadata $item.clone) -join '; '
Assert-Test ($preservation -match 'proof limit' -and $script:GitHubCalls.Count -eq 64) 'remote ancestry checks stop at the bounded unique proof limit'
$script:GitHubTips = $null
Write-Output "All cleanup regressions passed. Fixtures retained at $fixtureRoot"
