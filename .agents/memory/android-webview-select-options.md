---
name: Android WebView select menus
description: Dark-theme dropdown option readability in YourWorld's Android WebView.
---

Native HTML `<select>` option popups can ignore the surrounding dark CSS in Android WebView and render dark option text on a dark popup. For app-owned dark dropdowns, use the existing Radix Select component with explicit popup background and item text/focus colors.

**Why:** The native payout-country list appeared as a black panel with unreadable option labels even though its closed `<select>` had white text.

**How to apply:** Replace native selects only in the affected UI, preserve their values and change callbacks, and verify the bundled Android client contains the styled selector.
