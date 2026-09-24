$ErrorActionPreference = 'Stop'
$script = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'workspace-manager.ps1'
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script -Mode test
if ($LASTEXITCODE -ne 0) { throw "workspace-manager tests failed with exit code $LASTEXITCODE" }
Write-Output 'workspace-manager.tests.ps1 passed'
