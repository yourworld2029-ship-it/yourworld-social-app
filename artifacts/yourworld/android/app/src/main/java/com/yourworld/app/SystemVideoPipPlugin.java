package com.yourworld.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SystemVideoPip")
public class SystemVideoPipPlugin extends Plugin {
    @PluginMethod
    public void setPlaybackState(PluginCall call) {
        if (!(getActivity() instanceof MainActivity)) {
            call.reject("The Android video picture-in-picture bridge is unavailable.");
            return;
        }

        MainActivity activity = (MainActivity) getActivity();
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
}
