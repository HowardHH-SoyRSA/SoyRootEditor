# Windows package contents

The release package contains:

- `soybean_root_bio-*.whl`, the installable SoyRootBio/SoyRootEditor wheel;
- `Install-SoyRootEditor.ps1`, which creates an isolated `.venv`, installs
  runtime dependencies, and optionally creates a desktop shortcut;
- command launchers for the batch GUI and 3D editor; and
- the user-facing documentation under `docs/`.

This first package is an online installer: third-party scientific Python
dependencies are retrieved from PyPI. It does not modify the automatic result
bundles. The editor writes session logs and materialised edits only to the
selected session directory.

