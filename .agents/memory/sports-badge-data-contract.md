---
name: Public sports badge data contract
description: The safe public inputs for rendering verified Sports Identity and monetization badges.
---

Verified Sports Identity badges must fail closed unless the public profile is approved and contains an existing International/National representation. Every verified tier displays a country flag derived from public country/country_code data when available, then the public Sports Identity representation text, with India as the missing-value fallback. Monetization unlocks the Diamond/Star only when an existing public monetization signal is active or approved; private verification-detail rows contain identity/contact/document data and must not be queried for broad display.

**Why:** The live schema keeps sports verification details owner-scoped, while public profile and monetization data are readable for social surfaces. Reading private verification details to render badges would expose sensitive verification data and break the display boundary.

**How to apply:** Reuse the shared resolver and compact/profile badge components for new name surfaces. Treat missing profile, unknown representation, and query errors as no badge; keep unsupported or missing country values on the verified badge with the India flag fallback.