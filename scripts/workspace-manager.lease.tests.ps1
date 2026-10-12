[CmdletBinding()]
param([Parameter(Mandatory=$true)][string] $ManagerPath)
$ErrorActionPreference = 'Stop'
$tokens = $null; $parseErrors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile($ManagerPath, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw 'Manager source does not parse.' }
$definition = @($ast.FindAll({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Start-Lease' }, $false))
if ($definition.Count -ne 1) { throw 'Expected the actual Start-Lease implementation.' }
. ([scriptblock]::Create($definition[0].Extent.Text))
$ScriptPath = $ManagerPath
$script:WaitCount = 0; $script:ReadyAfter = 75
$script:Stopped = $null; $script:Saved = $null; $script:Launch = $null
# Model process startup and the lock boundary, not the allocation implementation.
# No process is launched, no task is allocated and no metadata file is written.
function Start-Process { param($FilePath, $ArgumentList, $WindowStyle, [switch]$PassThru)
    $script:Launch = @{ FilePath=$FilePath; Arguments=$ArgumentList; WindowStyle=$WindowStyle }
    return [pscustomobject]@{Id=7300}
}
function Start-Sleep { param($Milliseconds) $script:WaitCount++ }
function Test-LeaseAvailable { param($TaskRoot) return $script:WaitCount -lt $script:ReadyAfter }
function Get-Process { param($Id, $ErrorAction) return [pscustomobject]@{StartTime=[datetime]'2026-10-11T00:00:00Z'} }
function Stop-Process { param($Id, [switch]$Force, $ErrorAction) $script:Stopped=$Id }
function Save-Metadata { param($TaskRoot, $Metadata) $script:Saved=$Metadata }
function Assert-Lease([bool]$Condition, [string]$Name) {
    if (-not $Condition) { throw "FAIL: $Name" }
    Write-Output "PASS: $Name"
}
$taskRoot = Join-Path ([IO.Path]::GetTempPath()) 'workspace-lease-readiness-fixture'
$metadata = [pscustomobject]@{taskId='fixture'; status='active'}
$pidResult = Start-Lease $taskRoot $metadata 1
Assert-Lease ($pidResult -eq 7300 -and $script:WaitCount -eq 75) 'a lock acquired after the old five-second window succeeds'
Assert-Lease ($script:Saved.leasePid -eq 7300 -and $script:Saved.leasePath -eq (Join-Path $taskRoot '.workspace-lease')) 'metadata binds the launched keeper and actual lock path'
Assert-Lease ($null -eq $script:Stopped -and $script:Launch.WindowStyle -eq 'Hidden') 'successful keeper remains running in a hidden window'
$script:WaitCount=0; $script:ReadyAfter=301; $script:Saved=$null
$rejected=$false
try { Start-Lease $taskRoot $metadata 1 | Out-Null }
catch { $rejected=$_.Exception.Message -eq 'Lease keeper did not acquire its exclusive handle before allocation returned.' }
Assert-Lease ($rejected -and $script:WaitCount -eq 300) 'a keeper that never acquires the lock still fails within the bound'
Assert-Lease ($script:Stopped -eq 7300 -and $null -eq $script:Saved) 'failed startup stops only its launched process and publishes no lease metadata'

# Exercise the actual installer at mocked Task Scheduler boundaries. Registration
# must carry the caller's bounded batch settings into its next unattended run.
$installer = @($ast.FindAll({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Invoke-InstallTask' }, $false))
if ($installer.Count -ne 1) { throw 'Expected the actual scheduled-task installer.' }
. ([scriptblock]::Create($installer[0].Extent.Text))
$InstallRoot = $taskRoot; $MaxTasks=10; $CleanupBudgetSeconds=600; $Apply=$true
$script:Registered=$null; $script:CanaryPath=$null
function Test-Path { param($LiteralPath, $PathType) return $true }
function Test-CanarySuccess { param($ExpectedScriptPath) $script:CanaryPath=$ExpectedScriptPath; return $true }
function New-ScheduledTaskAction { param($Execute, $Argument, $WorkingDirectory) return [pscustomobject]@{Execute=$Execute; Arguments=$Argument; WorkingDirectory=$WorkingDirectory} }
function New-ScheduledTaskTrigger { param([switch]$Daily, $At) return [pscustomobject]@{StartBoundary='2026-10-12T03:15:00'} }
function New-ScheduledTaskSettingsSet { param([switch]$StartWhenAvailable, $MultipleInstances, $ExecutionTimeLimit) return [pscustomobject]@{StartWhenAvailable=[bool]$StartWhenAvailable; MultipleInstances=$MultipleInstances} }
function New-ScheduledTaskPrincipal { param($UserId, $LogonType, $RunLevel) return [pscustomobject]@{UserId=$UserId; LogonType=$LogonType} }
function Register-ScheduledTask { param($TaskName, $Action, $Trigger, $Settings, $Principal, [switch]$Force) $script:Registered=[pscustomobject]@{Actions=$Action; Triggers=@($Trigger); Settings=$Settings; Principal=$Principal} }
function Get-ScheduledTask { param($TaskName, $ErrorAction) return $script:Registered }
function Unregister-ScheduledTask { param($TaskName, $Confirm, $ErrorAction) throw 'Unexpected unregister in passing fixture.' }
Invoke-InstallTask | Out-Null
Assert-Lease ($script:Registered.Actions.Arguments -match '-MaxTasks 10 -CleanupBudgetSeconds 600$') 'unattended action retains the requested batch count and time budget'
Assert-Lease ($script:CanaryPath -eq (Join-Path $InstallRoot 'workspace-manager.ps1') -and $script:Registered.Actions.Arguments -notmatch 'AllowPurge') 'batch configuration preserves the installed canary gate and purge-off action'
