[CmdletBinding()]
param([string] $ManagerPath = '', [Parameter(Mandatory=$true)][string] $EvidenceRoot)
$ErrorActionPreference = 'Stop'
if (-not $ManagerPath) { $ManagerPath = Join-Path $PSScriptRoot 'workspace-manager.ps1' }
$ManagerPath = (Resolve-Path -LiteralPath $ManagerPath).Path
$fixtureRoot = Join-Path ([IO.Path]::GetFullPath($EvidenceRoot)) ('cli-' + [Guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Path $fixtureRoot | Out-Null
$gitExe = @(Get-Command git.exe -CommandType Application)[0].Source
$remote = 'https://github.com/example/workspace-fixture.git'
$firstId = '11111111111111111111111111111111'
$selectedId = '22222222222222222222222222222222'

function Assert-Cli([bool] $Condition, [string] $Name) {
    if (-not $Condition) { throw "FAIL: $Name (fixtures retained at $fixtureRoot)" }
    Write-Output "PASS: $Name"
}
function Invoke-FixtureGit([string[]] $Arguments) {
    $oldPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = @(& $gitExe @Arguments 2>&1)
        if ($LASTEXITCODE -ne 0) { throw "Fixture Git failed: $($output -join ' ')" }
        return ($output -join "`n")
    } finally { $ErrorActionPreference = $oldPreference }
}
function Get-TreeEvidence([string] $Root) {
    return (@(Get-ChildItem -LiteralPath $Root -Recurse -Force | Sort-Object FullName | ForEach-Object {
        $relative = $_.FullName.Substring($Root.Length)
        if ($_.PSIsContainer) { "directory|$relative" }
        else { "file|$relative|$($_.Length)|$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash)" }
    }) -join "`n")
}
function New-CliFixture([string] $Name) {
    $root = Join-Path $fixtureRoot $Name
    $workbench = Join-Path $root 'wb'
    $app = Join-Path $root 'app'
    $run = Join-Path $root 'run'
    New-Item -ItemType Directory -Path $workbench, $app, $run -Force | Out-Null
    $config = [pscustomobject]@{
        version=1; workbenchRoot=$workbench; taskRoot=(Join-Path $workbench '.tasks')
        quarantineRoot=(Join-Path $root 'q')
        repositories=@([pscustomobject]@{name='brandoriv-dev';path=(Join-Path $workbench 'baseline');remote=$remote})
    }
    New-Item -ItemType Directory -Path $config.taskRoot, $config.quarantineRoot -Force | Out-Null
    $copy = Join-Path $run 'workspace-manager.ps1'
    Copy-Item -LiteralPath $ManagerPath -Destination $copy
    Assert-Cli ((Get-FileHash -LiteralPath $copy).Hash -eq (Get-FileHash -LiteralPath $ManagerPath).Hash) "$Name runs exact manager bytes" | Out-Host
    $config | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $run 'manifest.json') -Encoding UTF8
    return [pscustomobject]@{ root=$root; config=$config; app=$app; manager=$copy; state=(Join-Path $app 'BrandoRiv\WorkspaceManager\state'); calls=0 }
}
function New-CliTask([object] $Fixture, [string] $Id) {
    $config = $Fixture.config
    $root = Join-Path $config.taskRoot $Id
    $clone = Join-Path $root 'brandoriv-dev'
    New-Item -ItemType Directory -Path $root | Out-Null
    Invoke-FixtureGit @('clone','--quiet',$bareRemote,$clone) | Out-Null
    $branch = "agent/brandoriv-dev/$Id"
    Invoke-FixtureGit @('-C',$clone,'checkout','--quiet','-b',$branch) | Out-Null
    Invoke-FixtureGit @('-C',$clone,'remote','set-url','origin',$remote) | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $clone 'ignored\nested') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $clone 'ignored\nested\preserve.txt') -Value 'ignored content must survive quarantine' -Encoding UTF8
    $meta = [pscustomobject]@{
        schema=1; taskId=$Id; cloneId=([Guid]::NewGuid().ToString('N')); repository='brandoriv-dev'
        canonicalPath=$config.repositories[0].path; taskRoot=$root; clonePath=$clone; remote=$remote; branch=$branch
        status='completed'; createdAt=[DateTime]::UtcNow.ToString('o'); updatedAt=[DateTime]::UtcNow.ToString('o')
        expiresAt=[DateTime]::UtcNow.AddDays(-1).ToString('o')
    }
    $meta | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $root '.workspace-task.json') -Encoding UTF8
    return $root
}
function Invoke-Cli([object] $Fixture, [string[]] $Arguments) {
    $Fixture.calls++
    $stdout = Join-Path $Fixture.root ("cli-$($Fixture.calls).out.txt")
    $stderr = Join-Path $Fixture.root ("cli-$($Fixture.calls).err.txt")
    $oldApp = $env:LOCALAPPDATA
    try {
        $env:LOCALAPPDATA = $Fixture.app
        $process = Start-Process -FilePath powershell.exe -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr -ArgumentList (@('-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $Fixture.manager + '"')) + $Arguments)
        return $process.ExitCode
    } finally { $env:LOCALAPPDATA = $oldApp }
}
function Add-Pending([object] $Fixture, [hashtable] $Entry) {
    New-Item -ItemType Directory -Path $Fixture.state -Force | Out-Null
    $Entry | ConvertTo-Json -Compress | Add-Content -LiteralPath (Join-Path $Fixture.state 'transactions.jsonl') -Encoding UTF8
}

# Only this process and its children see the isolated Git configuration. Native
# Git reads the synthetic remote advertisement from a local bare repository;
# no authentication, external network, remote push, installer or purge is used.
$oldGlobal = $env:GIT_CONFIG_GLOBAL; $oldNoSystem = $env:GIT_CONFIG_NOSYSTEM; $oldPath = $env:PATH
$oldTemp = $env:TEMP
$oldNativeGit = $env:WORKSPACE_CLI_NATIVE_GIT; $oldRemote = $env:WORKSPACE_CLI_REMOTE
try {
    $env:GIT_CONFIG_GLOBAL = Join-Path $fixtureRoot 'gitconfig'
    $env:GIT_CONFIG_NOSYSTEM = '1'
    $seed = Join-Path $fixtureRoot 'seed'
    $bareRemote = Join-Path $fixtureRoot 'remote.git'
    New-Item -ItemType Directory -Path $seed | Out-Null
    Invoke-FixtureGit @('init','--quiet',$seed) | Out-Null
    Invoke-FixtureGit @('-C',$seed,'config','user.name','Workspace CLI Fixture') | Out-Null
    Invoke-FixtureGit @('-C',$seed,'config','user.email','workspace-cli@test.invalid') | Out-Null
    Set-Content -LiteralPath (Join-Path $seed 'fixture.txt') -Value 'published fixture' -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $seed '.gitignore') -Value 'ignored/' -Encoding UTF8
    Invoke-FixtureGit @('-C',$seed,'add','.') | Out-Null
    Invoke-FixtureGit @('-C',$seed,'commit','--quiet','-m','fixture') | Out-Null
    Invoke-FixtureGit @('-C',$seed,'branch','-M','main') | Out-Null
    Invoke-FixtureGit @('clone','--quiet','--bare',$seed,$bareRemote) | Out-Null
    # Intercept only the remote URL at the existing Git subprocess boundary.
    # All status, refs, ancestry and ls-remote operations still use native Git.
    $bin = Join-Path $fixtureRoot 'bin'
    New-Item -ItemType Directory -Path $bin | Out-Null
    # Use a native argument-forwarder so Git format strings containing | never
    # pass through cmd.exe. It redirects only ls-remote's origin argument.
    Add-Type -OutputAssembly (Join-Path $bin 'git.exe') -OutputType ConsoleApplication -TypeDefinition @'
using System;
using System.Diagnostics;
using System.Text;
public class FixtureGit {
    static string Quote(string value) {
        var result = new StringBuilder("\"");
        int slashes = 0;
        foreach (char c in value) {
            if (c == '\\') { slashes++; continue; }
            result.Append('\\', c == '"' ? slashes * 2 + 1 : slashes);
            result.Append(c); slashes = 0;
        }
        result.Append('\\', slashes * 2); result.Append('"');
        return result.ToString();
    }
    public static int Main(string[] args) {
        if (args.Length == 6 && args[0] == "-C" && args[2] == "ls-remote" && args[5] == "origin")
            args[5] = Environment.GetEnvironmentVariable("WORKSPACE_CLI_REMOTE");
        var quoted = Array.ConvertAll(args, Quote);
        var info = new ProcessStartInfo(Environment.GetEnvironmentVariable("WORKSPACE_CLI_NATIVE_GIT"), String.Join(" ", quoted));
        info.UseShellExecute = false;
        using (var process = Process.Start(info)) { process.WaitForExit(); return process.ExitCode; }
    }
}
'@
    $env:WORKSPACE_CLI_NATIVE_GIT = $gitExe
    $env:WORKSPACE_CLI_REMOTE = $bareRemote
    $env:PATH = $bin + ';' + $oldPath

    $targeted = New-CliFixture 'target'
    $first = New-CliTask $targeted $firstId
    $selected = New-CliTask $targeted $selectedId
    $unmanaged = Join-Path $targeted.config.taskRoot '000-unmanaged'
    New-Item -ItemType Directory -Path $unmanaged | Out-Null
    Set-Content -LiteralPath (Join-Path $unmanaged '.workspace-task.json') -Value '{' -Encoding UTF8
    $unmanagedBefore = Get-TreeEvidence $unmanaged
    Set-Content -LiteralPath (Join-Path $targeted.root 'unmanaged-before.txt') -Value $unmanagedBefore -Encoding UTF8
    $linkTarget = Join-Path $targeted.root 'link-target'
    New-Item -ItemType Directory -Path $linkTarget | Out-Null
    Set-Content -LiteralPath (Join-Path $linkTarget 'preserve.txt') -Value 'unrelated junction target'
    $link = Join-Path $targeted.config.taskRoot '000-junction'
    New-Item -ItemType Junction -Path $link -Target $linkTarget | Out-Null
    $linkBefore = Get-TreeEvidence $linkTarget
    Set-Content -LiteralPath (Join-Path $targeted.root 'junction-target-before.txt') -Value $linkBefore -Encoding UTF8
    $firstBefore = Get-TreeEvidence $first
    $selectedBefore = Get-TreeEvidence $selected
    Set-Content -LiteralPath (Join-Path $targeted.root 'first-before.txt') -Value $firstBefore -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $targeted.root 'selected-before.txt') -Value $selectedBefore -Encoding UTF8
    Assert-Cli ((Invoke-Cli $targeted @('-Mode','cleanup','-TaskId',$selectedId,'-Apply','-MaxTasks','2')) -eq 0) 'scoped CLI cleanup succeeds'
    Assert-Cli ((Test-Path -LiteralPath $first) -and $firstBefore -eq (Get-TreeEvidence $first)) 'other eligible task retains every directory and file hash'
    Assert-Cli ($unmanagedBefore -eq (Get-TreeEvidence $unmanaged) -and $linkBefore -eq (Get-TreeEvidence $linkTarget) -and ((Get-Item -LiteralPath $link -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) 'unrelated malformed directory and junction are skipped before path or metadata checks'
    $destination = Join-Path $targeted.config.quarantineRoot $selectedId
    Assert-Cli (-not (Test-Path -LiteralPath $selected) -and (Test-Path -LiteralPath $destination)) 'CLI quarantines only the selected task'
    # Compare the moved source independently of the manager integrity helper.
    $movedEvidence = (Get-TreeEvidence $destination) -split "`n" | Where-Object { $_ -notmatch '^file\|\\.workspace-quarantine.json\|' }
    Assert-Cli ($selectedBefore -eq ($movedEvidence -join "`n")) 'selected task preserves ignored files and complete Git tree'
    $manifest = Get-Content -LiteralPath (Join-Path $destination '.workspace-quarantine.json') -Raw | ConvertFrom-Json
    Assert-Cli ($manifest.taskId -eq $selectedId -and @($manifest.files).Count -gt 0) 'selected quarantine records its integrity manifest'

    $recovery = New-CliFixture 'recovery'
    $other = New-CliTask $recovery $firstId
    $chosen = New-CliTask $recovery $selectedId
    $purgeId = '33333333333333333333333333333333'
    $purgeSource = New-CliTask $recovery $purgeId
    $purgeDestination = Join-Path $recovery.config.quarantineRoot $purgeId
    $purgeFiles = @(Get-ChildItem -LiteralPath $purgeSource -File -Recurse -Force | ForEach-Object {
        @{path=$_.FullName.Substring($purgeSource.Length).TrimStart('\');sha256=(Get-FileHash -LiteralPath $_.FullName).Hash.ToLowerInvariant()}
    })
    @{schema=1;taskId=$purgeId;createdAt=[DateTime]::UtcNow.AddDays(-8).ToString('o');files=$purgeFiles} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $purgeSource '.workspace-quarantine.json') -Encoding UTF8
    Move-Item -LiteralPath $purgeSource -Destination $purgeDestination
    $purgeBefore = Get-TreeEvidence $purgeDestination
    Set-Content -LiteralPath (Join-Path $recovery.root 'purge-before.txt') -Value $purgeBefore -Encoding UTF8
    Add-Pending $recovery @{operation='quarantine';phase='prepare';taskId=$firstId;source=$other;destination=(Join-Path $recovery.config.quarantineRoot $firstId)}
    Add-Pending $recovery @{operation='purge';phase='prepare';taskId=$purgeId;path=$purgeDestination}
    Add-Pending $recovery @{operation='purge';phase='prepare';taskId=('4' * 32);path=(Join-Path $recovery.config.quarantineRoot ('4' * 32))}
    # A selected source-only prepare remains eligible for the existing retry.
    Add-Pending $recovery @{operation='quarantine';phase='prepare';taskId=$selectedId;source=$chosen;destination=(Join-Path $recovery.config.quarantineRoot $selectedId)}
    $journalPath = Join-Path $recovery.state 'transactions.jsonl'
    $originalBytes = [IO.File]::ReadAllBytes($journalPath)
    [IO.File]::WriteAllBytes((Join-Path $recovery.root 'journal-before.jsonl'), $originalBytes)
    $originalLines = @(Get-Content -LiteralPath $journalPath)
    $otherBefore = Get-TreeEvidence $other
    Set-Content -LiteralPath (Join-Path $recovery.root 'other-before.txt') -Value $otherBefore -Encoding UTF8
    Assert-Cli ((Invoke-Cli $recovery @('-Mode','cleanup','-TaskId',$selectedId,'-Apply','-MaxTasks','2')) -eq 0) 'scoped CLI recovers and retries its selected pending prepare'
    $lines = @(Get-Content -LiteralPath $journalPath)
    $afterBytes = [IO.File]::ReadAllBytes($journalPath)
    Assert-Cli ($afterBytes.Length -ge $originalBytes.Length -and [Convert]::ToBase64String($originalBytes) -eq [Convert]::ToBase64String([byte[]]$afterBytes[0..($originalBytes.Length-1)])) 'existing raw journal bytes remain unchanged'
    $appended = @($lines | Select-Object -Skip $originalLines.Count | ForEach-Object { $_ | ConvertFrom-Json })
    Assert-Cli ($appended.Count -ge 3 -and @($appended | Where-Object taskId -ne $selectedId).Count -eq 0) 'no unrelated quarantine or purge transaction is recovered or written'
    Assert-Cli ((Test-Path -LiteralPath $other) -and $otherBefore -eq (Get-TreeEvidence $other)) 'unrelated pending source remains exact'
    Assert-Cli ($purgeBefore -eq (Get-TreeEvidence $purgeDestination)) 'unrelated pending purge destination retains every file and Git object'

    $ambiguous = New-CliFixture 'ambiguous'
    $other = New-CliTask $ambiguous $firstId
    New-CliTask $ambiguous $selectedId | Out-Null
    $otherDestination = Join-Path $ambiguous.config.quarantineRoot $firstId
    New-Item -ItemType Directory -Path $otherDestination | Out-Null
    Set-Content -LiteralPath (Join-Path $otherDestination 'keep.txt') -Value 'unrelated ambiguous destination'
    Add-Pending $ambiguous @{operation='quarantine';phase='prepare';taskId=$firstId;source=$other;destination=$otherDestination}
    $otherBefore = Get-TreeEvidence $other
    $destinationBefore = Get-TreeEvidence $otherDestination
    Set-Content -LiteralPath (Join-Path $ambiguous.root 'other-before.txt') -Value $otherBefore -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $ambiguous.root 'destination-before.txt') -Value $destinationBefore -Encoding UTF8
    Assert-Cli ((Invoke-Cli $ambiguous @('-Mode','cleanup','-TaskId',$selectedId,'-Apply')) -eq 0) 'unrelated ambiguous recovery cannot block selected cleanup'
    Assert-Cli ($otherBefore -eq (Get-TreeEvidence $other) -and $destinationBefore -eq (Get-TreeEvidence $otherDestination)) 'unrelated ambiguous source and destination stay exact'

    $invalid = New-CliFixture 'invalid'
    New-CliTask $invalid $firstId | Out-Null
    $invalidBefore = Get-TreeEvidence $invalid.config.workbenchRoot
    Set-Content -LiteralPath (Join-Path $invalid.root 'workbench-before.txt') -Value $invalidBefore -Encoding UTF8
    # Quoted tokens survive native -File argument parsing, including empty input.
    foreach ($token in @('""','" "','../other','C:\outside',('A' * 32),('1' * 31),('1' * 33),('"' + ('1' * 32) + "`n" + '"'))) {
        Assert-Cli ((Invoke-Cli $invalid @('-Mode','cleanup','-TaskId',$token,'-Apply')) -ne 0) "unsafe TaskId $token fails"
        Assert-Cli ($invalidBefore -eq (Get-TreeEvidence $invalid.config.workbenchRoot) -and -not (Test-Path -LiteralPath $invalid.state) -and @(Get-ChildItem -LiteralPath $invalid.config.quarantineRoot -Force).Count -eq 0) 'invalid task id refuses before task, journal or health mutations'
    }

    $fleet = New-CliFixture 'fleet'
    New-CliTask $fleet $firstId | Out-Null
    New-CliTask $fleet $selectedId | Out-Null
    Assert-Cli ((Invoke-Cli $fleet @('-Mode','scheduled','-Apply','-MaxTasks','2')) -eq 0) 'scheduled CLI retains whole-fleet cleanup'
    Assert-Cli (@(Get-ChildItem -LiteralPath $fleet.config.taskRoot -Directory).Count -eq 0 -and @(Get-ChildItem -LiteralPath $fleet.config.quarantineRoot -Directory).Count -eq 2) 'scheduled CLI quarantines both eligible tasks without purge'

    foreach ($kind in @('blob','tree')) {
        $objectFixture = New-CliFixture ('noncommit-' + $kind)
        $taskRoot = New-CliTask $objectFixture $selectedId
        $clone = Join-Path $taskRoot 'brandoriv-dev'
        $content = Join-Path $objectFixture.root 'unique-object.txt'
        Set-Content -LiteralPath $content -Value ('unpublished ' + $kind + ' fixture ' + [Guid]::NewGuid().ToString('N')) -Encoding UTF8
        $blob = Invoke-FixtureGit @('-C',$clone,'hash-object','-w',$content)
        $object = $blob
        $ref = 'refs/recovery/unique-blob'
        if ($kind -eq 'tree') {
            $object = ("100644 blob $blob`tunique-object.txt" | & $gitExe -C $clone mktree)
            if ($LASTEXITCODE -ne 0) { throw 'Native Git fixture tree creation failed.' }
            $ref = 'refs/tags/unique-tree'
        }
        Invoke-FixtureGit @('-C',$clone,'update-ref',$ref,$object) | Out-Null
        $publishedObjects = Invoke-FixtureGit @('-C',$clone,'rev-list','--objects','HEAD')
        $legacyCount = Invoke-FixtureGit @('-C',$clone,'rev-list','--count',$object,'--not','HEAD')
        Assert-Cli ($legacyCount -eq '0' -and $object -notin ($publishedObjects -split '\s+')) "$kind fixture demonstrates zero commit count for an object absent from published closure"
        @{kind=$kind;ref=$ref;object=$object;legacyCount=$legacyCount;publishedObjects=$publishedObjects} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $objectFixture.root 'object-proof.json') -Encoding UTF8
        $before = Get-TreeEvidence $taskRoot
        Set-Content -LiteralPath (Join-Path $objectFixture.root 'task-before.txt') -Value $before -Encoding UTF8
        Assert-Cli ((Invoke-Cli $objectFixture @('-Mode','cleanup','-TaskId',$selectedId,'-Apply')) -eq 2) "$kind ref causes actual CLI cleanup deferral"
        $health = Get-Content -LiteralPath (Join-Path $objectFixture.state 'health.json') -Raw | ConvertFrom-Json
        Assert-Cli ($health.phase -eq 'deferred' -and $health.lastError -like '*does not peel to a commit*' -and $before -eq (Get-TreeEvidence $taskRoot) -and @(Get-ChildItem -LiteralPath $objectFixture.config.quarantineRoot -Force).Count -eq 0) "$kind ref and every source file are preserved without quarantine"
    }

    $env:TEMP = Join-Path $fixtureRoot 'canary-temp'
    New-Item -ItemType Directory -Path $env:TEMP | Out-Null
    foreach ($scenario in @('published','unavailable','restore-corrupt')) {
        $canary = New-CliFixture ('canary-' + $scenario)
        $unrelated = New-CliTask $canary $firstId
        Add-Pending $canary @{operation='quarantine';phase='prepare';taskId=$firstId;source=$unrelated;destination=(Join-Path $canary.config.quarantineRoot $firstId)}
        # An old marker cannot turn this run's failure into success.
        $markerPath = Join-Path $canary.state 'canary-success.json'
        Set-Content -LiteralPath $markerPath -Value '{"schema":1,"restored":true,"old":true}' -Encoding UTF8
        $markerBefore = Get-TreeEvidence $canary.state
        $workbenchBefore = Get-TreeEvidence $canary.config.workbenchRoot
        Set-Content -LiteralPath (Join-Path $canary.root 'state-before.txt') -Value $markerBefore -Encoding UTF8
        Set-Content -LiteralPath (Join-Path $canary.root 'workbench-before.txt') -Value $workbenchBefore -Encoding UTF8
        # Only the unavailable case uses the existing argument-forwarder as a
        # remote-advertisement fault. Success checks the canary's actual origin.
        $env:PATH = if ($scenario -eq 'unavailable') { $bin + ';' + $oldPath } else { $oldPath }
        if ($scenario -eq 'restore-corrupt') {
            $launcher = Join-Path (Split-Path -Parent $canary.manager) 'restore-fault.ps1'
            # The original manager still dispatches its own CLI. Inject a single
            # post-move corruption at the filesystem boundary, never replacing
            # publication or integrity checks. Only private canary paths qualify.
            @'
function global:Move-Item {
    [CmdletBinding()]
    param([string] $LiteralPath, [string] $Destination)
    $isRestore = (Split-Path -Leaf (Split-Path -Parent $LiteralPath)) -eq 'q'
    if ($isRestore) {
        $id = Split-Path -Leaf $LiteralPath
        $privateRoot = Split-Path -Parent (Split-Path -Parent $LiteralPath)
        $expected = Join-Path (Join-Path $privateRoot 'wb\.tasks') $id
        if ($id -cnotmatch '\A[0-9a-f]{32}\z' -or (Split-Path -Leaf $privateRoot) -ne ('wm-canary-' + $id.Substring(0,8)) -or $Destination -ne $expected -or (Split-Path -Parent $privateRoot) -ne $env:TEMP) { throw 'Restore fault escaped its exact private fixture.' }
    }
    Microsoft.PowerShell.Management\Move-Item -LiteralPath $LiteralPath -Destination $Destination
    if ($isRestore) {
        Add-Content -LiteralPath (Join-Path $Destination 'brandoriv-dev\canary-fixture.txt') -Value 'injected restore corruption'
        Set-Content -LiteralPath (Join-Path $privateRoot 'restore-fault.json') -Value $Destination
    }
}
& (Join-Path $PSScriptRoot 'workspace-manager.ps1') -Mode canary
exit $LASTEXITCODE
'@ | Set-Content -LiteralPath $launcher -Encoding UTF8
            $canary.manager = $launcher
        }
        $beforeFixtures = @(Get-ChildItem -LiteralPath $env:TEMP -Directory | ForEach-Object Name)
        $code = Invoke-Cli $canary @('-Mode','canary')
        $newFixtures = @(Get-ChildItem -LiteralPath $env:TEMP -Directory | Where-Object { $_.Name -notin $beforeFixtures })
        Assert-Cli ($newFixtures.Count -eq 1) "$scenario canary retains exactly one private fixture"
        $privateRoot = $newFixtures[0].FullName
        $privateTasks = @(Get-ChildItem -LiteralPath (Join-Path $privateRoot 'wb\.tasks') -Directory)
        Assert-Cli ($privateTasks.Count -eq 1 -and $privateTasks[0].Name -cmatch '\A[0-9a-f]{32}\z') "$scenario canary retains its exact synthetic task"
        $id = $privateTasks[0].Name
        Assert-Cli ($workbenchBefore -eq (Get-TreeEvidence $canary.config.workbenchRoot) -and @(Get-ChildItem -LiteralPath $canary.config.quarantineRoot -Force).Count -eq 0) "$scenario canary preserves unrelated production tasks and quarantine"
        if ($scenario -eq 'published') {
            Assert-Cli ($code -eq 0) 'canary CLI succeeds with genuine private publication'
            $marker = Get-Content -LiteralPath $markerPath -Raw | ConvertFrom-Json
            $source = Join-Path (Split-Path -Parent $canary.manager) 'workspace-manager.ps1'
            Assert-Cli ($marker.taskId -eq $id -and $marker.restored -eq $true -and $marker.fixtureRoot -eq $privateRoot -and $marker.sourceSha256 -eq (Get-FileHash -LiteralPath $source).Hash.ToLowerInvariant()) 'fresh canary marker identifies this fixture and exact source bytes'
            $afterState = (Get-TreeEvidence $canary.state) -split "`n" | Where-Object { $_ -notmatch '^file\|\\canary-success.json\|' }
            $beforeState = $markerBefore -split "`n" | Where-Object { $_ -notmatch '^file\|\\canary-success.json\|' }
            Assert-Cli (($afterState -join "`n") -eq ($beforeState -join "`n")) 'successful canary changes only production success marker'
            $restored = Join-Path $privateRoot ('wb\.tasks\' + $id)
            $manifest = Get-Content -LiteralPath (Join-Path $restored '.workspace-quarantine.json') -Raw | ConvertFrom-Json
            foreach ($file in $manifest.files) {
                Assert-Cli ((Get-FileHash -LiteralPath (Join-Path $restored $file.path)).Hash.ToLowerInvariant() -eq $file.sha256) "restored canary preserves $($file.path)"
            }
            $head = Invoke-FixtureGit @('-C',(Join-Path $restored 'brandoriv-dev'),'rev-parse','HEAD')
            $refs = Invoke-FixtureGit @('-C',(Join-Path $restored 'brandoriv-dev'),'ls-remote','--heads','--tags','origin')
            Assert-Cli ($refs.StartsWith($head + "`t") -and @(Get-ChildItem -LiteralPath (Join-Path $privateRoot 'q') -Force).Count -eq 0) 'actual local bare origin advertises restored HEAD and private quarantine is empty'
        } else {
            Assert-Cli ($code -eq 1 -and $markerBefore -eq (Get-TreeEvidence $canary.state)) "$scenario failure returns nonzero and leaves all production state and old marker exact"
            $events = @(Get-Content -LiteralPath (Join-Path $privateRoot 'state\events.jsonl') | ForEach-Object { $_ | ConvertFrom-Json })
            $failures = @($events | Where-Object event -eq 'canary-failed')
            Assert-Cli ($failures.Count -eq 1 -and $failures[0].taskId -eq $id) "$scenario failure records private diagnostics"
            if ($scenario -eq 'unavailable') {
                $health = Get-Content -LiteralPath (Join-Path $privateRoot 'state\health.json') -Raw | ConvertFrom-Json
                Assert-Cli ($health.phase -eq 'deferred' -and $health.quarantinedTasks -eq 0) 'unavailable live publication remains refused by unchanged preservation guard'
            } else {
                Assert-Cli ((Test-Path -LiteralPath (Join-Path $privateRoot 'restore-fault.json')) -and $failures[0].error -like '*Quarantine file hash mismatch*') 'actual restored-tree corruption refuses success proof'
            }
        }
    }
    Write-Output "CLI fixtures retained at $fixtureRoot"
} finally {
    $env:GIT_CONFIG_GLOBAL = $oldGlobal
    $env:GIT_CONFIG_NOSYSTEM = $oldNoSystem
    $env:PATH = $oldPath
    $env:TEMP = $oldTemp
    $env:WORKSPACE_CLI_NATIVE_GIT = $oldNativeGit
    $env:WORKSPACE_CLI_REMOTE = $oldRemote
}
