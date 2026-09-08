[CmdletBinding()]
param(
    [string]$PythonPath = 'python'
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$dist = Join-Path $root 'dist'
$packages = Join-Path $root 'packages'
$stage = Join-Path $root '.windows-package-stage'
$version = '0.2.0'

New-Item -ItemType Directory -Path $dist,$packages -Force | Out-Null
& $PythonPath -m pip wheel $root --no-deps --wheel-dir $dist
$wheel = Get-ChildItem -LiteralPath $dist -Filter 'soybean_root_bio-*.whl' -File |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $wheel) { throw 'The wheel build did not produce an artifact.' }
Copy-Item -LiteralPath $wheel.FullName -Destination $packages -Force

if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $stage 'packaging\windows'),(Join-Path $stage 'packages'),(Join-Path $stage 'docs') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'packaging\windows\Install-SoyRootEditor.ps1') -Destination (Join-Path $stage 'packaging\windows') -Force
Copy-Item -LiteralPath (Join-Path $root 'packaging\windows\Launch-SoyRootBio-GUI.cmd') -Destination (Join-Path $stage 'packaging\windows') -Force
Copy-Item -LiteralPath (Join-Path $root 'packaging\windows\Launch-SoyRootEditor.cmd') -Destination (Join-Path $stage 'packaging\windows') -Force
Copy-Item -LiteralPath (Join-Path $root 'packaging\windows\requirements-runtime.txt') -Destination (Join-Path $stage 'packaging\windows') -Force
Copy-Item -LiteralPath $wheel.FullName -Destination (Join-Path $stage 'packages') -Force
Copy-Item -Path (Join-Path $root 'docs\*') -Destination (Join-Path $stage 'docs') -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root 'README.md') -Destination $stage -Force
Copy-Item -LiteralPath (Join-Path $root 'LICENSE') -Destination $stage -Force

$zip = Join-Path $dist "SoyRootEditor-$version-windows-online.zip"
if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal
Remove-Item -LiteralPath $stage -Recurse -Force
Write-Output "Wheel: $($wheel.FullName)"
Write-Output "Installer ZIP: $zip"
