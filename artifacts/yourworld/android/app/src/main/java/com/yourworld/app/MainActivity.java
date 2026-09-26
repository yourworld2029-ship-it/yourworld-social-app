package com.yourworld.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.view.ViewCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(PrivacyBridgePlugin.class);
        super.onCreate(savedInstanceState);

        configureSystemBars();

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleAppBack();
            }
        });

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            applyWebViewInsets(webView);
            webView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
            webView.getSettings().setDomStorageEnabled(true);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        configureSystemBars();

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            ViewCompat.requestApplyInsets(webView);
            webView.evaluateJavascript(
                    "window.dispatchEvent(new Event('yw-app-resume'));",
                    null
            );
        }
    }

    private void handleAppBack() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) {
            return;
        }

        webView.evaluateJavascript(
                "(function() {"
                        + "var path = window.location.pathname.replace(/\\/$/, '') || '/';"
                        + "if (window.history.length > 1) {"
                        + "window.history.back();"
                        + "return 'back';"
                        + "}"
                        + "if (path === '/') return 'exit';"
                        + "window.history.replaceState(window.history.state, '', '/');"
                        + "window.dispatchEvent(new PopStateEvent('popstate', {state: window.history.state}));"
                        + "return 'home';"
                        + "})()",
                result -> {
                    if ("\"exit\"".equals(result)) {
                        moveTaskToBack(true);
                    }
                }
        );
    }

    private void configureSystemBars() {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(
                getWindow(),
                getWindow().getDecorView()
        );
        controller.setAppearanceLightStatusBars(false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);
        controller.show(WindowInsetsCompat.Type.statusBars());
    }

    private void applyWebViewInsets(WebView webView) {
        final int initialLeft = webView.getPaddingLeft();
        final int initialTop = webView.getPaddingTop();
        final int initialRight = webView.getPaddingRight();
        final int initialBottom = webView.getPaddingBottom();

        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, windowInsets) -> {
            Insets safeInsets = windowInsets.getInsets(
                    WindowInsetsCompat.Type.statusBars()
                            | WindowInsetsCompat.Type.displayCutout()
            );
            // This native padding is the explicit status-bar/cutout spacer while the bar overlays the WebView.
            view.setPadding(
                    initialLeft + safeInsets.left,
                    initialTop + safeInsets.top,
                    initialRight + safeInsets.right,
                    initialBottom + safeInsets.bottom
            );
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(webView);
    }
}
