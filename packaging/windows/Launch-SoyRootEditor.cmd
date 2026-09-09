@echo off
setlocal
set "ROOT=%~dp0"
if not exist "%ROOT%.venv\Scripts\python.exe" (
  echo SoyRootEditor is not installed in this directory.
  echo Run packaging\windows\Install-SoyRootEditor.ps1 first.
  exit /b 1
)
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -SessionVariable viewerSession 'http://127.0.0.1:8765/'; if ($r.Content -notmatch 'SoyRoot Studio') { exit 1 }; $health = Invoke-RestMethod -TimeoutSec 2 -WebSession $viewerSession 'http://127.0.0.1:8765/api/health'; if ($health.viewer_id) { exit 0 }; exit 2 } catch { exit 1 }" >nul 2>&1
if errorlevel 2 (
  echo An older SoyRootEditor service is already using port 8765.
  echo Close that viewer, then launch this shortcut again.
  exit /b 2
)
if not errorlevel 1 (
  if "%~1"=="" (
    powershell -NoProfile -Command "Start-Process 'http://127.0.0.1:8765/?new-window=1'"
  ) else (
    set "SOYROOTEDITOR_DATASET=%~1"
    powershell -NoProfile -Command "$url = 'http://127.0.0.1:8765/?new-window=1&dataset=' + [Uri]::EscapeDataString($env:SOYROOTEDITOR_DATASET); Start-Process $url"
  )
  exit /b 0
)
if "%~1"=="" (
  "%ROOT%.venv\Scripts\python.exe" -m soyrootbio.cli editor
  exit /b %ERRORLEVEL%
)
set "OUTPUT_DIR=%~1"
shift
"%ROOT%.venv\Scripts\python.exe" -m soyrootbio.cli editor --output "%OUTPUT_DIR%" %*
endlocal
