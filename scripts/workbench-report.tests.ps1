# Non-destructive focused tests. Fixtures are intentionally retained for inspection.
$ErrorActionPreference = 'Stop'
$fixture = Join-Path $env:TEMP ('workbench-report-tests-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixture | Out-Null
foreach ($name in @('first', 'second', '.tasks/task/leased')) { New-Item -ItemType Directory -Path (Join-Path $fixture "$name/.git") -Force | Out-Null }
@{ clonePath = (Join-Path $fixture '.tasks/task/leased') } | ConvertTo-Json | Set-Content (Join-Path $fixture '.tasks/task/.workspace-task.json')
$global:reportTestStash = $true; $global:reportTestPrCalls = 0; $global:reportTestFailPR = $false; $global:reportTestFailGit = $false
function git {
    $global:LASTEXITCODE = 0
    if ($global:reportTestFailGit) { $global:LASTEXITCODE = 1; 'simulated Git failure'; return }
    if ($args[2] -eq 'branch') { 'feature' }
    elseif ($args[2] -eq 'remote') { 'https://github.com/example/project.git' }
    elseif ($args[2] -eq 'rev-list') { '2' }
    elseif ($args[2] -eq 'stash') { if ($global:reportTestStash) { 'stash@{0}: owned handoff' } }
    elseif ($args[2] -eq 'for-each-ref') { '' }
    elseif ($args[1] -like '*second') { ' M owned.txt' }
}
function gh {
    $global:reportTestPrCalls++
    $global:LASTEXITCODE = 0
    if ($global:reportTestFailPR) { $global:LASTEXITCODE = 1; 'simulated auth failure'; return }
    '[{"number":3,"title":"Existing task","headRefName":"feature","url":"https://github.com/example/project/pull/3"}]'
}
function Assert($condition, $message) { if (-not $condition) { throw $message } }
$reporter = Join-Path $PSScriptRoot 'workbench-agent-contract.ps1'
$rows = @(& $reporter -Root $fixture)
Assert ($rows.Count -eq 3) 'Global report must include leased clone at fixed metadata depth'
Assert ($global:reportTestPrCalls -eq 1) 'Duplicate remotes must query PRs once'
Assert (($rows | Where-Object Repo -eq 'second').State -eq 'dirty') 'Remote dedupe must preserve clone dirtiness'
$scoped = @(& $reporter -RepositoryPath (Join-Path $fixture 'first'))
Assert ($scoped[0].UnpublishedCommits -eq 2 -and $scoped[0].Publication -eq 'local-only' -and $scoped[0].Stashes -eq 1) 'Local commits and stashes must be visible'
$localHealth = @(& (Join-Path $PSScriptRoot 'workbench-health.ps1') -RepositoryPath (Join-Path $fixture 'first'))[0]
Assert ($localHealth.Contract -eq 'needs-handoff') 'Existing stashes require handoff even with a clean tree'
$global:reportTestStash = $false
$localHealth = @(& (Join-Path $PSScriptRoot 'workbench-health.ps1') -RepositoryPath (Join-Path $fixture 'first'))[0]
Assert ($localHealth.Contract -eq 'local-committed') 'Clean unpublished commits require local handoff status'
Assert ($scoped.Count -eq 1) 'Scoped report must exclude siblings'
$global:reportTestFailPR = $true
$failed = @(& $reporter -RepositoryPath (Join-Path $fixture 'first'))[0]
Assert ($failed.PRState -eq 'error' -and $null -eq $failed.OpenPRs) 'PR failure must remain unknown, not zero'
$global:reportTestFailGit = $true
$failed = @(& $reporter -RepositoryPath (Join-Path $fixture 'first'))[0]
Assert ($failed.State -eq 'unknown' -and $null -eq $failed.Dirty) 'Git failure must never appear clean'
$health = @(& (Join-Path $PSScriptRoot 'workbench-health.ps1') -RepositoryPath (Join-Path $fixture 'first'))[0]
Assert ($health.Contract -eq 'unknown') 'Health must preserve Git failure'
Write-Output "PASS: focused reporter checks. Retained fixtures: $fixture"
