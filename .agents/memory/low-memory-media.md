---
name: Low-memory media policy
description: Low-end Android performance constraints and the separation between display buffers and persistent downloads.
---

YourWorld must target Android phones with 2–3 GB RAM. Treat a reported 4 GB device-memory bucket conservatively, rather than assuming an eight-core CPU means sufficient memory.

**Why:** browser device-memory values are rounded; a 3 GB phone can report 4 GB, and CPU-core count does not represent available decoder/GPU memory.

**How to apply:** use memory-first capability detection and limit live list players. The user's requested next-video preload must remain metadata-first and share a single auxiliary decoder with missing-poster reads, rather than creating extra players or large speculative buffers.

Screen-sized image object URLs and canvas buffers are temporary display resources. Release them when cards leave the viewport; never clear the offline download library to reduce memory use.

**Why:** the user explicitly requires download persistence to remain unchanged during performance optimization.

**How to apply:** keep display-buffer lifetimes separate from persistent file/cache ownership. Preserve protected Reel canvas rendering; optimize frame scheduling and buffer dimensions rather than bypassing that protection.

Do not claim steady 60 FPS or crash-free low-end behavior from a successful web build or browser simulation.

**Why:** actual Android decoder limits, thermal throttling, GPU behavior, and 4G conditions require physical-device profiling.

**How to apply:** report code/build/browser checks separately from hardware FPS and memory validation.