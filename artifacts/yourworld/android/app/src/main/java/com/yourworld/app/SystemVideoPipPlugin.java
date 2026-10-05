package com.yourworld.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SystemVideoPip")
public class SystemVideoPipPlugin extends Plugin {
    @PluginMethod
    public void setPlaybackState(PluginCall call) {
        MainActivity activity = requireMainActivity(call);
        if (activity == null) return;
        boolean active = Boolean.TRUE.equals(call.getBoolean("active"));
        boolean playing = Boolean.TRUE.equals(call.getBoolean("playing"));
        Integer aspectRatioWidth = call.getInt("aspectRatioWidth");
        Integer aspectRatioHeight = call.getInt("aspectRatioHeight");
        int width = aspectRatioWidth == null ? 16 : aspectRatioWidth;
        int height = aspectRatioHeight == null ? 9 : aspectRatioHeight;

        activity.runOnUiThread(() -> {
            activity.setVideoPipPlaybackState(active, playing, width, height);
            call.resolve();
        });
    }

    @PluginMethod
    public void setFullscreenImmersive(PluginCall call) {
        MainActivity activity = requireMainActivity(call);
        if (activity == null) return;
        Boolean enabled = call.getBoolean("enabled");
        if (enabled == null) {
            call.reject("A fullscreen enabled state is required.");
            return;
        }

        activity.runOnUiThread(() -> {
            activity.setVideoFullscreenImmersiveMode(enabled);
            call.resolve();
        });
    }

    @PluginMethod
    public void getGestureLevels(PluginCall call) {
        MainActivity activity = requireMainActivity(call);
        if (activity == null) return;

        activity.runOnUiThread(() -> {
            JSObject levels = new JSObject();
            levels.put("brightness", activity.getVideoFullscreenBrightness());
            levels.put("volume", activity.getVideoMediaVolume());
            call.resolve(levels);
        });
    }

    @PluginMethod
    public void setScreenBrightness(PluginCall call) {
        MainActivity activity = requireMainActivity(call);
        if (activity == null) return;
        Double value = call.getDouble("value");
        if (value == null || Double.isNaN(value) || Double.isInfinite(value)) {
            call.reject("A finite screen brightness value is required.");
            return;
        }

        activity.runOnUiThread(() -> {
            JSObject result = new JSObject();
            result.put("value", activity.setVideoFullscreenBrightness(value.floatValue()));
            call.resolve(result);
        });
    }

    @PluginMethod
    public void setMediaVolume(PluginCall call) {
        MainActivity activity = requireMainActivity(call);
        if (activity == null) return;
        Double value = call.getDouble("value");
        if (value == null || Double.isNaN(value) || Double.isInfinite(value)) {
            call.reject("A finite media volume value is required.");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                JSObject result = new JSObject();
                result.put("value", activity.setVideoMediaVolume(value.floatValue()));
                call.resolve(result);
            } catch (RuntimeException error) {
                call.reject("Could not adjust Android media volume.", error);
            }
        });
    }

    private MainActivity requireMainActivity(PluginCall call) {
        if (!(getActivity() instanceof MainActivity)) {
            call.reject("The Android video player bridge is unavailable.");
            return null;
        }
        return (MainActivity) getActivity();
    }
}
