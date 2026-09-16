---
name: Normal profile categories
description: Normal profiles can store up to two categories in the existing category field without altering Sports Identity.
---

Normal category selections live in a dedicated profile array, while the original category value remains reserved for the existing Sports Identity role/sport marker.

**Why:** Normal categories such as Player and Coach must be available to every user, including Sports Identity users, without making ordinary category choices trigger Sports Identity parsing.

**How to apply:** Cap normal selections at two in the editor and save normalization, expose them through public profile/search reads, render them below the display name, and leave the legacy category value and Bio untouched.