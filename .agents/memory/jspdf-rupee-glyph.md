---
name: jsPDF Indian rupee glyph
description: Reliable rendering of the Indian rupee symbol in jsPDF-generated statements.
---

Use an embedded Unicode TrueType font when rendering `₹` in jsPDF. The built-in Helvetica/WinAnsi font can extract and render the rupee symbol as a superscript `1`, which makes financial totals misleading.

**Why:** A generated statement rendered `₹9,454.50` as `¹9,454.50` until a Unicode font was embedded.

**How to apply:** Any PDF containing INR values should embed a font with the rupee glyph and verify the rendered PDF plus extracted text before delivery.
