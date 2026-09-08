@echo off
setlocal
set "ROOT=%~dp0"
if "%~1"=="" (
  echo Usage: Launch-SoyRootEditor.cmd "D:\path\to\SoyRootBio_output"
  exit /b 2
)
if not exist "%ROOT%.venv\Scripts\python.exe" (
  echo SoyRootEditor is not installed in this directory.
  echo Run packaging\windows\Install-SoyRootEditor.ps1 first.
  exit /b 1
)
set "OUTPUT_DIR=%~1"
shift
"%ROOT%.venv\Scripts\python.exe" -m soyrootbio.cli editor --output "%OUTPUT_DIR%" %*
endlocal

