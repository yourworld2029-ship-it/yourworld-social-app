package com.yourworld.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

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
        configureSystemBars();
        if (webView != null) {
            webView.getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
            // BridgeActivity may have started the initial remote load already.
            // Restart it after applying the no-cache policy so it uses fresh HTML.
            webView.stopLoading();
            webView.reload();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        configureSystemBars();

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
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
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(
                getWindow(),
                getWindow().getDecorView()
        );
        controller.setAppearanceLightStatusBars(false);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);
        controller.show(WindowInsetsCompat.Type.statusBars());
    }
}
