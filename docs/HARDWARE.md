# Windows hardware requirements and recommendations

## Runtime requirements

- Windows 10 or Windows 11, 64-bit.
- Python 3.10 or newer for the packaged runtime; Python 3.11 or 3.12 is
  recommended for the smoothest dependency coverage.
- A Chromium-family browser with WebGL2 enabled (Microsoft Edge, Google
  Chrome, or a current Chromium build).
- Approximately 5 GB of free disk space for the environment and dependencies,
  plus room for result bundles and materialised exports.
- Internet access for first-time dependency installation when using the online
  installer bundle.

Node.js 22.13+ and pnpm 11 are required only when rebuilding the frontend from
source. They are not required to run the packaged Python wheel.

## Recommended hardware

| Workload | CPU | RAM | GPU |
| --- | --- | --- | --- |
| Small/medium bundles (up to about 250k vertices) | 4 modern cores | 16 GB | WebGL2-capable integrated GPU is usually sufficient |
| Large bundles (250k–1M vertices) | 8 modern cores | 32 GB | Discrete GPU with 4–8 GB VRAM recommended |
| Very large bundles or several samples | 12–16 cores | 64 GB or more | Discrete GPU with 8 GB+ VRAM and current drivers |

Additional recommendations:

- Use an NVMe SSD for faster PLY, RSML, and materialised-export I/O.
- Keep Windows GPU drivers current and prefer the high-performance GPU for
  the browser when a laptop has both integrated and discrete graphics.
- The viewer retains the full mesh and does not deliberately downsample it;
  RAM and browser GPU memory therefore scale with vertex/face count.
- The analysis pipeline is CPU-based. The GPU accelerates interactive viewing,
  normals, and picking, but CUDA is not required.
- Close memory-heavy browser tabs when opening a large full-resolution mesh.

If the browser reports WebGL or allocation failures, update the GPU driver,
try Edge or Chrome, reduce concurrent analysis jobs, or review the mesh size
before using the editor.

