[CmdletBinding()]
param(
    [string]$InstallDirectory = (Join-Path $env:LOCALAPPDATA 'SoyRootEditor'),
    [string]$PythonPath,
    [switch]$CreateDesktopShortcut,
    [switch]$SkipDependencyInstall
)

$ErrorActionPreference = 'Stop'
$packageRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$wheel = Get-ChildItem -LiteralPath (Join-Path $packageRoot 'packages') -Filter 'soybean_root_bio-*.whl' -File |
    Sort-Object Name -Descending | Select-Object -First 1
if (-not $wheel) {
    throw "No bundled wheel was found under $packageRoot\packages."
}

if (-not $PythonPath) {
    $py = Get-Command 'py.exe' -ErrorAction SilentlyContinue
    if ($py) {
        $pythonExe = $py.Source
        $pythonArgs = @('-3')
    } else {
        $python = Get-Command 'python.exe' -ErrorAction SilentlyContinue
        if (-not $python) { throw 'Python 3.10 or newer was not found. Install Python, then rerun this script.' }
        $pythonExe = $python.Source
        $pythonArgs = @()
    }
} else {
    $pythonExe = (Resolve-Path -LiteralPath $PythonPath).Path
    $pythonArgs = @()
}

& $pythonExe @pythonArgs --version
New-Item -ItemType Directory -Path $InstallDirectory -Force | Out-Null
$venv = Join-Path $InstallDirectory '.venv'
if (-not (Test-Path -LiteralPath (Join-Path $venv 'Scripts\python.exe'))) {
    & $pythonExe @pythonArgs -m venv $venv
}
$venvPython = Join-Path $venv 'Scripts\python.exe'

if (-not $SkipDependencyInstall) {
    & $venvPython -m pip install --upgrade pip
    & $venvPython -m pip install --requirement (Join-Path $packageRoot 'packaging\windows\requirements-runtime.txt')
    & $venvPython -m pip install --no-deps $wheel.FullName
}

Copy-Item -LiteralPath (Join-Path $packageRoot 'packaging\windows\Launch-SoyRootBio-GUI.cmd') -Destination $InstallDirectory -Force
Copy-Item -LiteralPath (Join-Path $packageRoot 'packaging\windows\Launch-SoyRootEditor.cmd') -Destination $InstallDirectory -Force
Copy-Item -LiteralPath (Join-Path $packageRoot 'docs') -Destination $InstallDirectory -Recurse -Force

if ($CreateDesktopShortcut) {
    $desktop = [Environment]::GetFolderPath('Desktop')
    $shortcutPath = Join-Path $desktop 'SoyRootEditor.lnk'
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = Join-Path $InstallDirectory 'Launch-SoyRootEditor.cmd'
    $shortcut.WorkingDirectory = $InstallDirectory
    $shortcut.Description = 'Open the SoyRootEditor 3D viewer and editor'
    $shortcut.Save()
}

Write-Output "Installed to: $InstallDirectory"
Write-Output "GUI launcher: $(Join-Path $InstallDirectory 'Launch-SoyRootBio-GUI.cmd')"
Write-Output "Editor launcher: $(Join-Path $InstallDirectory 'Launch-SoyRootEditor.cmd')"
