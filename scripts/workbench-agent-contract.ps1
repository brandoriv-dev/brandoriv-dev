[CmdletBinding()]
param(
    [string] $RepositoryPath = '',
    [string] $Root = '',
    [switch] $SkipPullRequests
)

if ($RepositoryPath -and $Root) { throw 'Choose -RepositoryPath or -Root, not both.' }
if (-not $Root -and -not $RepositoryPath) { $RepositoryPath = (Get-Location).Path }
$paths = @()
if ($RepositoryPath) {
    $paths = @((Resolve-Path -LiteralPath $RepositoryPath -ErrorAction Stop).Path)
} else {
    $Root = (Resolve-Path -LiteralPath $Root -ErrorAction Stop).Path
    $paths = @(Get-ChildItem -LiteralPath $Root -Directory -Force | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName '.git') } | Select-Object -ExpandProperty FullName)
    # Read only manager metadata at its fixed depth; never recursively scan task clones.
    $taskRoot = Join-Path $Root '.tasks'
    if (Test-Path -LiteralPath $taskRoot) {
        foreach ($task in Get-ChildItem -LiteralPath $taskRoot -Directory -Force) {
            $metadataPath = Join-Path $task.FullName '.workspace-task.json'
            if (-not (Test-Path -LiteralPath $metadataPath)) { continue }
            try {
                $metadata = Get-Content -LiteralPath $metadataPath -Raw -ErrorAction Stop | ConvertFrom-Json
                $candidate = [IO.Path]::GetFullPath([string]$metadata.clonePath)
                $boundary = $task.FullName.TrimEnd('\') + '\'
                if ($candidate.StartsWith($boundary, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath (Join-Path $candidate '.git'))) { $paths += $candidate }
            } catch { Write-Warning "Cannot inspect task metadata at $metadataPath : $($_.Exception.Message)" }
        }
    }
}
$prCache = @{}
foreach ($path in ($paths | Sort-Object -Unique)) {
    $errors = @()
    $branch = $null; $dirtyCount = $null; $remote = $null
    $unpublished = $null; $stashCount = $null; $tracking = $null
    try {
        $branchOutput = @(& git -C $path branch --show-current 2>&1)
        if ($LASTEXITCODE -eq 0) { $branch = ($branchOutput -join '').Trim() } else { $errors += 'git branch failed' }
        $statusOutput = @(& git -C $path status --short 2>&1)
        if ($LASTEXITCODE -eq 0) { $dirtyCount = $statusOutput.Count } else { $errors += 'git status failed' }
        $remoteOutput = @(& git -C $path remote get-url origin 2>&1)
        if ($LASTEXITCODE -eq 0) { $remote = ($remoteOutput -join '').Trim() } else { $errors += 'git origin lookup failed' }
        $countOutput = @(& git -C $path rev-list --count HEAD --not --remotes 2>&1)
        if ($LASTEXITCODE -eq 0 -and ($countOutput -join '') -match '^\d+$') { $unpublished = [int]($countOutput -join '') } else { $errors += 'git unpublished commit lookup failed' }
        $stashOutput = @(& git -C $path stash list 2>&1)
        if ($LASTEXITCODE -eq 0) { $stashCount = $stashOutput.Count } else { $errors += 'git stash lookup failed' }
        $trackingOutput = @(& git -C $path for-each-ref '--format=%(upstream:short)' ('refs/heads/' + $branch) 2>&1)
        if ($LASTEXITCODE -eq 0) { $tracking = ($trackingOutput -join '').Trim() } else { $errors += 'git tracking lookup failed' }
    } catch { $errors += 'Git command unavailable or could not execute' }
    $pr = [pscustomobject]@{ State = 'not-applicable'; Count = $null; Summary = ''; Error = '' }
    if ($SkipPullRequests) { $pr.State = 'not-checked' }
    elseif ($remote -match '^https://github\.com/(?<owner>[^/]+)/(?<name>[^/]+?)(?:\.git)?/?$' -or $remote -match '^git@github\.com:(?<owner>[^/]+)/(?<name>[^/]+?)(?:\.git)?$') {
        $repoName = "$($Matches.owner)/$($Matches.name)".ToLowerInvariant()
        if (-not $prCache.ContainsKey($repoName)) {
            try {
                $output = @(& gh pr list --repo $repoName --state open --json number,title,headRefName,url 2>&1)
                if ($LASTEXITCODE -ne 0) { throw 'gh pr list failed; check GitHub connectivity and authentication.' }
                $items = @(($output -join "`n") | ConvertFrom-Json -ErrorAction Stop)
                $prCache[$repoName] = [pscustomobject]@{ State = 'ok'; Count = $items.Count; Summary = (($items | ForEach-Object { "#$($_.number) $($_.headRefName) $($_.title) $($_.url)" }) -join ' | '); Error = '' }
            } catch {
                $prCache[$repoName] = [pscustomobject]@{ State = 'error'; Count = $null; Summary = ''; Error = $_.Exception.Message }
            }
        }
        $pr = $prCache[$repoName]
    } elseif (-not $remote) { $pr.State = 'unknown' }
    [pscustomobject]@{
        Repo = Split-Path -Leaf $path
        Path = $path
        Branch = $branch
        Dirty = $dirtyCount
        State = if ($errors.Count) { 'unknown' } elseif ($dirtyCount -eq 0) { 'clean' } else { 'dirty' }
        GitError = $errors -join '; '
        UnpublishedCommits = $unpublished
        Publication = if ($null -eq $unpublished) { 'unknown' } elseif ($unpublished -gt 0) { 'local-only' } else { 'reachable-from-cached-remote' }
        Upstream = $tracking
        Stashes = $stashCount
        Remote = $remote
        PRState = $pr.State
        OpenPRs = $pr.Count
        PRSummary = $pr.Summary
        PRError = $pr.Error
    }
}
