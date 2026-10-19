---
name: YourWorld narrow change scope
description: The user repeatedly requires YourWorld changes to stay limited to the exact screens and behavior named in each request.
---

For YourWorld requests, change only the components and behavior the user explicitly names. Keep unrelated screens, settings, backend logic, and existing interactions untouched.

**Why:** The user repeatedly states “baki kuch bhi ni chedna h” and similar strict scope constraints.

**How to apply:** Inspect the existing handlers first, make the smallest targeted edit, and verify the requested path without opportunistic refactors.
