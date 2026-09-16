---
name: Normal profile categories
description: Normal profiles can store up to two categories in the existing category field without altering Sports Identity.
---

Normal category selections are serialized in the existing profile category value with a dedicated separator; values beginning with Athlete, Player, or Coach remain reserved for the existing Sports Identity path.

**Why:** The database schema must stay unchanged, while Sports Identity already depends on the category field to detect role and sport.

**How to apply:** Cap normal selections at two in both the editor and save normalization, render normal values as compact chips below the display name, and leave sports-marked values and Bio untouched.