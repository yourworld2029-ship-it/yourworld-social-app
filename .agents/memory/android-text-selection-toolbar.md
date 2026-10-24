---
name: Android text-selection toolbar
description: Native text-selection menu contrast in the Capacitor Android WebView.
---

In the Capacitor Android WebView, long-press text selection opens Android's native Cut/Copy floating toolbar. CSS text color and `::selection` styling do not control the toolbar labels or background. Set the splash theme's `postSplashScreenTheme` to the app's real Activity theme, then set `android:colorBackgroundFloating`, `android:textColorPrimary`, and `android:textColorSecondary` there for contrast.

**Why:** White caption text remained readable while the native Cut/Copy actions were dark on a dark popup; changing textarea CSS did not fix the actual issue.

**How to apply:** For Android copy-menu contrast bugs, inspect the Activity and post-splash theme before changing WebView field styles. Keep the web content styling scoped to the requested fields.
