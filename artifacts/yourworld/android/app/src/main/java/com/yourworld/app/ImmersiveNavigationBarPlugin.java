package com.yourworld.app;

import android.app.Activity;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.view.ViewCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ImmersiveNavigationBar")
public class ImmersiveNavigationBarPlugin extends Plugin {
    @PluginMethod
    public void hide(PluginCall call) {
        updateVisibility(call, true);
    }

    @PluginMethod
    public void show(PluginCall call) {
        updateVisibility(call, false);
    }

    private void updateVisibility(PluginCall call, boolean hide) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Android navigation bar is unavailable.");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
                        activity.getWindow(),
                        activity.getWindow().getDecorView()
                );
                if (hide) {
                    controller.setSystemBarsBehavior(
                            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    );
                    controller.hide(WindowInsetsCompat.Type.navigationBars());
                } else {
                    controller.setSystemBarsBehavior(
                            WindowInsetsControllerCompat.BEHAVIOR_DEFAULT
                    );
                    controller.show(WindowInsetsCompat.Type.navigationBars());
                    ViewCompat.requestApplyInsets(activity.getWindow().getDecorView());
                }
                call.resolve();
            } catch (Exception error) {
                call.reject("Unable to update Android navigation bar visibility.");
            }
        });
    }
}