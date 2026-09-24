package com.yourworld.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(PrivacyBridgePlugin.class);
        super.onCreate(savedInstanceState);

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
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

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            webView.evaluateJavascript(
                    "window.dispatchEvent(new Event('yw-app-resume'));",
                    null
            );
        }
    }
}
