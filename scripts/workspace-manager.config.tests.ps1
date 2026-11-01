$ErrorActionPreference = 'Stop'
$manager = Join-Path $PSScriptRoot 'workspace-manager.ps1'
$tokens = $null; $errors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile($manager, [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw 'Manager source does not parse.' }
foreach ($definition in $ast.FindAll({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] }, $false)) {
    . ([scriptblock]::Create($definition.Extent.Text))
}
$SourceManifest = Join-Path (Split-Path $PSScriptRoot -Parent) 'workspace/manifest.json'
$InstalledManifest = Join-Path $PSScriptRoot 'manifest.json'
$actual = Get-Config
$expected = Join-Path $env:LOCALAPPDATA 'BrandoRiv/WorkspaceQuarantine'
if ($actual.quarantineRoot -ne [IO.Path]::GetFullPath($expected)) {
    throw 'Quarantine must resolve against the current account, not a previous profile.'
}
Write-Output 'Current-account quarantine configuration passed.'
