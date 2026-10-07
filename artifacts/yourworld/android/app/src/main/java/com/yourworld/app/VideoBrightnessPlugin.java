package com.yourworld.app;

import android.provider.Settings;
import android.view.Window;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "VideoBrightness")
public class VideoBrightnessPlugin extends Plugin {
    private Float originalWindowBrightness;

    @PluginMethod
    public void getBrightness(PluginCall call) {
        MainActivity activity = requireMainActivity(call);
        if (activity == null) return;

        activity.runOnUiThread(() -> {
            WindowManager.LayoutParams attributes = activity.getWindow().getAttributes();
            float brightness = attributes.screenBrightness;
            if (brightness < 0f) {
                int systemBrightness = Settings.System.getInt(
                        activity.getContentResolver(),
                        Settings.System.SCREEN_BRIGHTNESS,
                        128
                );
                brightness = systemBrightness / 255f;
            }

            JSObject result = new JSObject();
            result.put("value", Math.min(1f, Math.max(0.02f, brightness)));
            call.resolve(result);
        });
    }

    @PluginMethod
    public void setBrightness(PluginCall call) {
        MainActivity activity = requireMainActivity(call);
        if (activity == null) return;
        Double requested = call.getDouble("value");
        if (requested == null || Double.isNaN(requested) || Double.isInfinite(requested)) {
            call.reject("A finite brightness value is required.");
            return;
        }

        float value = (float) Math.min(1d, Math.max(0.02d, requested));
        activity.runOnUiThread(() -> {
            Window window = activity.getWindow();
            WindowManager.LayoutParams attributes = window.getAttributes();
            if (originalWindowBrightness == null) {
                originalWindowBrightness = attributes.screenBrightness;
            }
            attributes.screenBrightness = value;
            window.setAttributes(attributes);
            call.resolve();
        });
    }

    @PluginMethod
    public void restoreBrightness(PluginCall call) {
        MainActivity activity = requireMainActivity(call);
        if (activity == null) return;

        activity.runOnUiThread(() -> {
            Float original = originalWindowBrightness;
            if (original != null) {
                Window window = activity.getWindow();
                WindowManager.LayoutParams attributes = window.getAttributes();
                attributes.screenBrightness = original;
                window.setAttributes(attributes);
                originalWindowBrightness = null;
            }
            call.resolve();
        });
    }

    private MainActivity requireMainActivity(PluginCall call) {
        if (!(getActivity() instanceof MainActivity)) {
            call.reject("The Android screen brightness bridge is unavailable.");
            return null;
        }
        return (MainActivity) getActivity();
    }
}
