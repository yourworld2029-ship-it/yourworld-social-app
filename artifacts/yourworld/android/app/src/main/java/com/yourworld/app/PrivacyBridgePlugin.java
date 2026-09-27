package com.yourworld.app;

import android.Manifest;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "PrivacyBridge",
    permissions = {
        @Permission(alias = "camera", strings = { Manifest.permission.CAMERA }),
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
    }
)
public class PrivacyBridgePlugin extends Plugin {
    @PluginMethod
    public void requestCallMediaPermissions(PluginCall call) {
        String mode = call.getString("mode");
        if (!"audio".equals(mode) && !"video".equals(mode)) {
            call.reject("Call mode must be audio or video.");
            return;
        }

        String[] aliases = "video".equals(mode)
            ? new String[] { "camera", "microphone" }
            : new String[] { "microphone" };
        requestPermissionForAliases(aliases, call, "callMediaPermissionsResult");
    }

    @PermissionCallback
    private void callMediaPermissionsResult(PluginCall call) {
        String mode = call.getString("mode");
        boolean microphoneGranted = getPermissionState("microphone") == PermissionState.GRANTED;
        boolean cameraGranted = !"video".equals(mode)
            || getPermissionState("camera") == PermissionState.GRANTED;

        JSObject result = new JSObject();
        result.put("granted", microphoneGranted && cameraGranted);
        call.resolve(result);
    }

    @PluginMethod
    public void setSecureFlag(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled == null) {
            call.reject("The enabled option must be a boolean.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            if (enabled) {
                getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
            } else {
                getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
            }
            call.resolve();
        });
    }
}