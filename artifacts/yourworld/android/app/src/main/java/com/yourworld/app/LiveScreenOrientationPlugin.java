package com.yourworld.app;

import android.content.pm.ActivityInfo;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LiveScreenOrientation")
public class LiveScreenOrientationPlugin extends Plugin {
    private boolean liveModeActive;
    private Integer previousRequestedOrientation;

    @PluginMethod
    public void setLiveMode(PluginCall call) {
        Boolean active = call.getBoolean("active");
        if (active == null) {
            call.reject("The live orientation state is required.");
            return;
        }
        if (!(getActivity() instanceof MainActivity)) {
            call.reject("The Android live orientation bridge is unavailable.");
            return;
        }

        MainActivity activity = (MainActivity) getActivity();
        activity.runOnUiThread(() -> {
            try {
                if (active) {
                    if (!liveModeActive) {
                        previousRequestedOrientation = activity.getRequestedOrientation();
                        liveModeActive = true;
                    }
                    activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR);
                } else if (liveModeActive) {
                    Integer previous = previousRequestedOrientation;
                    previousRequestedOrientation = null;
                    liveModeActive = false;
                    activity.setRequestedOrientation(
                            previous != null
                                    ? previous
                                    : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                    );
                }
                call.resolve();
            } catch (RuntimeException error) {
                call.reject("Could not change the live screen orientation.", error);
            }
        });
    }
}
