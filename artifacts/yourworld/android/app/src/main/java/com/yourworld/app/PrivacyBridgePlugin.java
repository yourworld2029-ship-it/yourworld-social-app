package com.yourworld.app;

import android.view.WindowManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PrivacyBridge")
public class PrivacyBridgePlugin extends Plugin {
    @PluginMethod
    public void setSecureFlag(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled == null) {
            call.reject("The enabled option must be a boolean.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().setFlags(
                    WindowManager.LayoutParams.FLAG_SECURE,
                    WindowManager.LayoutParams.FLAG_SECURE
            );
            call.resolve();
        });
    }
}