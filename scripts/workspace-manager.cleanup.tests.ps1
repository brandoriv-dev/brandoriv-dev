[CmdletBinding()]
param([string] $ManagerPath = '')
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
$fixtureRoot = Join-Path $env:TEMP ('workspace-cleanup-regression-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixtureRoot | Out-Null
$script:TestStateRoot = Join-Path $fixtureRoot 'state'
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

function Invoke-Cleanup { param($Config) return 0 }
function Invoke-Purge { param($Config) throw 'Purge must not run without explicit authorization.' }
$result = @(Invoke-ScheduledMaintenance $review)
Assert-Test ($result -contains 0) 'scheduled cleanup skips purge by default'
Write-Output "All cleanup regressions passed. Fixtures retained at $fixtureRoot"
