@echo off
setlocal
set "ROOT=%~dp0"
if not exist "%ROOT%.venv\Scripts\python.exe" (
  echo SoyRootEditor is not installed in this directory.
  echo Run packaging\windows\Install-SoyRootEditor.ps1 first.
  exit /b 1
)
"%ROOT%.venv\Scripts\python.exe" -m soyrootbio.cli gui %*
endlocal

