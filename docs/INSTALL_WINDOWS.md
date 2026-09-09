# Windows installation

The release bundle is an online installer package: it includes the
SoyRootEditor wheel and launchers, while Python downloads the scientific
dependencies from PyPI during installation. The automatic result files are
not included in the installer.

## Install

1. Extract the release ZIP to a writable location such as
   `%LOCALAPPDATA%\SoyRootEditor` or `C:\SoyRootEditor`.
2. Open PowerShell in the extracted directory.
3. Run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\packaging\windows\Install-SoyRootEditor.ps1 -CreateDesktopShortcut
   ```

   The installer creates an isolated `.venv`, installs the bundled wheel and
   runtime dependencies, and copies the launchers and documentation.

If several Python installations are present, pass an explicit interpreter:

```powershell
powershell -ExecutionPolicy Bypass -File .\packaging\windows\Install-SoyRootEditor.ps1 `
  -PythonPath "C:\Users\Public\Python312\python.exe" `
  -CreateDesktopShortcut
```

## Launch

- Use the **SoyRootEditor** desktop shortcut to open the 3D viewer and choose a
  completed output folder.
- Use `Launch-SoyRootBio-GUI.cmd` for the batch analysis GUI.
- Use `Launch-SoyRootEditor.cmd "D:\results\sample"` to open a completed
  SoyRootBio bundle directly in the 3D editor.
- If the local viewer service is already running, the launcher reuses it and
  opens an independent viewer window. The **Dataset** control switches folders;
  the adjacent new-window button opens additional datasets simultaneously.
- The editor server binds to `127.0.0.1` by default.

## Troubleshooting

- If PowerShell blocks the installer, use the `-ExecutionPolicy Bypass`
  invocation shown above; this changes policy only for that process.
- If dependency installation fails, confirm Python is 3.10+ and that the
  device can reach PyPI, then rerun the installer from the same directory.
- If the 3D view is blank or slow, update the browser/GPU driver and check the
  hardware guidance in `docs/HARDWARE.md`.

The current bundle is not fully offline: a future release can add a wheelhouse
of pinned third-party wheels for air-gapped installation.
