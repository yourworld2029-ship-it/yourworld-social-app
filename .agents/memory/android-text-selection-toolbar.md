---
name: Android text-selection toolbar
description: Native text-selection menu contrast in the Capacitor Android WebView.
---

In the Capacitor Android WebView, long-press text selection opens Android's native Cut/Copy floating toolbar. CSS text color and `::selection` styling do not control the toolbar labels or background. Set `android:colorBackgroundFloating`, `android:textColorPrimary`, and `android:textColorSecondary` on the theme actually active for the Activity. A `postSplashScreenTheme` only takes effect when the app installs AndroidX SplashScreen; if it does not, also style the launch theme assigned to the Activity.

**Why:** The launch theme can remain active when AndroidX SplashScreen is not installed in `MainActivity`, so colors added only to the post-splash theme do not affect the native text-selection toolbar.

**How to apply:** For Android copy-menu contrast bugs, inspect the Activity theme and whether `installSplashScreen()` is called before changing WebView field styles. Keep the web content styling scoped to the requested fields.
