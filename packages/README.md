# SoyRootEditor 0.2.0 Windows packages

The release bundle is an online installer for Windows. Extract
`SoyRootEditor-0.2.0-windows-online.zip` and run
`packaging\windows\Install-SoyRootEditor.ps1`. The installer creates an isolated
Python environment, installs the bundled wheel, and downloads runtime
dependencies on first install. See [the Windows installation guide](../docs/INSTALL_WINDOWS.md).

The wheel is also provided separately for scripted or developer installations.

| Artifact | Purpose |
| --- | --- |
| `SoyRootEditor-0.2.0-windows-online.zip` | Installer, launchers, documentation, and bundled wheel |
| `soybean_root_bio-0.2.0-py3-none-any.whl` | Python package containing the viewer/editor and analysis code |

SHA-256 checksums are recorded in [`SHA256SUMS.txt`](SHA256SUMS.txt).
