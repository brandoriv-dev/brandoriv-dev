[CmdletBinding()]
param([string] $RepositoryPath = '', [string] $Root = '')

$arguments = @{ SkipPullRequests = $true }
if ($RepositoryPath) { $arguments.RepositoryPath = $RepositoryPath }
if ($Root) { $arguments.Root = $Root }
foreach ($repo in (& (Join-Path $PSScriptRoot 'workbench-agent-contract.ps1') @arguments)) {
    $scripts = @{}
    $packageManager = ''
    $packageError = ''
    foreach ($lock in @('bun.lock', 'bun.lockb', 'pnpm-lock.yaml', 'yarn.lock', 'package-lock.json')) {
        if (Test-Path -LiteralPath (Join-Path $repo.Path $lock)) {
            $packageManager = switch ($lock) { 'bun.lock' { 'bun' }; 'bun.lockb' { 'bun' }; 'pnpm-lock.yaml' { 'pnpm' }; 'yarn.lock' { 'yarn' }; default { 'npm' } }
            break
        }
    }
    $packagePath = Join-Path $repo.Path 'package.json'
    if (Test-Path -LiteralPath $packagePath) {
        if (-not $packageManager) { $packageManager = 'package-json' }
        try {
            $package = Get-Content -LiteralPath $packagePath -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
            if ($package.scripts) { foreach ($property in $package.scripts.PSObject.Properties) { $scripts[$property.Name] = $property.Value } }
        } catch { $packageError = 'Cannot read package.json' }
    }
    $workflowDirectory = Join-Path $repo.Path '.github/workflows'
    $workflows = @()
    if (Test-Path -LiteralPath $workflowDirectory) {
        $workflows = @(Get-ChildItem -LiteralPath $workflowDirectory -File | Where-Object { $_.Extension -in '.yml', '.yaml' } | Select-Object -ExpandProperty Name)
    }
    [pscustomobject]@{
        Repo = $repo.Repo; Path = $repo.Path; Branch = $repo.Branch; Dirty = $repo.Dirty
        Contract = if ($repo.State -eq 'unknown') { 'unknown' } elseif ($repo.Stashes -gt 0) { 'needs-handoff' } elseif ($repo.State -eq 'clean' -and $repo.Publication -eq 'local-only') { 'local-committed' } elseif ($repo.State -eq 'clean') { 'clean' } else { 'needs-handoff' }
        UnpublishedCommits = $repo.UnpublishedCommits; Publication = $repo.Publication; Upstream = $repo.Upstream; Stashes = $repo.Stashes
        GitError = $repo.GitError; PackageError = $packageError; PackageManager = $packageManager
        Workflows = $workflows -join ','
        StandardScripts = (@('check', 'test', 'smoke', 'changes:test', 'changes:lint', 'deploy') | ForEach-Object { if ($scripts.ContainsKey($_)) { "$_=ok" } else { "$_=-" } }) -join ' '
        Remote = $repo.Remote
    }
}
