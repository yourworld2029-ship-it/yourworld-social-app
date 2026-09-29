package com.yourworld.app;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.database.ContentObserver;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.view.WindowManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Executor;
import java.util.function.Consumer;

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
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }),
        @Permission(alias = "images", strings = { Manifest.permission.READ_MEDIA_IMAGES }),
        @Permission(alias = "videos", strings = { Manifest.permission.READ_MEDIA_VIDEO }),
        @Permission(alias = "selectedVisualMedia", strings = { Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED }),
        @Permission(alias = "legacyStorage", strings = { Manifest.permission.READ_EXTERNAL_STORAGE }),
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class PrivacyBridgePlugin extends Plugin {
    private boolean captureMonitoringEnabled = false;
    private boolean screenshotMonitoringEnabled = false;
    private boolean recordingMonitoringEnabled = false;
    private Api34ScreenCaptureCallback screenCaptureCallback;
    private ContentObserver legacyScreenshotObserver;
    private long lastScreenshotEventAt = 0L;
    private final Consumer<Integer> screenRecordingCallback = state -> {
        if (captureMonitoringEnabled &&
            state == WindowManager.SCREEN_RECORDING_STATE_VISIBLE) {
            emitCaptureEvent("recording");
        }
    };

    private static final class Api34ScreenCaptureCallback {
        private final Activity.ScreenCaptureCallback callback;

        private Api34ScreenCaptureCallback(PrivacyBridgePlugin plugin) {
            callback = plugin::emitScreenshotCaptured;
        }

        private void register(Activity activity, Executor executor) {
            activity.registerScreenCaptureCallback(executor, callback);
        }

        private void unregister(Activity activity) {
            activity.unregisterScreenCaptureCallback(callback);
        }
    }

    private void emitScreenshotCaptured() {
        emitCaptureEvent("screenshot");
    }

    private void emitCaptureEvent(String kind) {
        if (!captureMonitoringEnabled) return;
        if ("screenshot".equals(kind)) {
            long now = System.currentTimeMillis();
            if (now - lastScreenshotEventAt < 2_500L) return;
            lastScreenshotEventAt = now;
        }
        JSObject event = new JSObject();
        event.put("kind", kind);
        notifyListeners("capture", event);
    }

    private void startLegacyScreenshotMonitoring() {
        if (legacyScreenshotObserver != null || Build.VERSION.SDK_INT >= 34) return;

        ContentResolver resolver = getContext().getContentResolver();
        legacyScreenshotObserver = new ContentObserver(new Handler(Looper.getMainLooper())) {
            @Override
            public void onChange(boolean selfChange, Uri uri) {
                super.onChange(selfChange, uri);
                if (!captureMonitoringEnabled || uri == null) return;

                String displayName = null;
                String relativePath = null;
                String[] projection = Build.VERSION.SDK_INT >= 29
                    ? new String[] {
                        MediaStore.Images.Media.DISPLAY_NAME,
                        MediaStore.Images.Media.RELATIVE_PATH
                    }
                    : new String[] { MediaStore.Images.Media.DISPLAY_NAME };
                try (Cursor cursor = resolver.query(
                    uri,
                    projection,
                    null,
                    null,
                    null
                )) {
                    if (cursor != null && cursor.moveToFirst()) {
                        int column = cursor.getColumnIndex(MediaStore.Images.Media.DISPLAY_NAME);
                        if (column >= 0) displayName = cursor.getString(column);
                        if (Build.VERSION.SDK_INT >= 29) {
                            int pathColumn = cursor.getColumnIndex(
                                MediaStore.Images.Media.RELATIVE_PATH
                            );
                            if (pathColumn >= 0) relativePath = cursor.getString(pathColumn);
                        }
                    }
                } catch (SecurityException | IllegalArgumentException ignored) {
                    // Older Android versions may not grant access to the changed media row.
                }

                String location = (displayName == null ? "" : displayName) + " " +
                    (relativePath == null ? "" : relativePath);
                if (location.toLowerCase(Locale.ROOT).contains("screenshot")) {
                    emitCaptureEvent("screenshot");
                }
            }
        };
        resolver.registerContentObserver(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            true,
            legacyScreenshotObserver
        );
    }

    private void stopCaptureMonitoring() {
        captureMonitoringEnabled = false;
        Activity activity = getActivity();

        if (screenshotMonitoringEnabled) {
            if (Build.VERSION.SDK_INT >= 34 && screenCaptureCallback != null) {
                screenCaptureCallback.unregister(activity);
            } else if (legacyScreenshotObserver != null) {
                getContext().getContentResolver().unregisterContentObserver(
                    legacyScreenshotObserver
                );
                legacyScreenshotObserver = null;
            }
            screenshotMonitoringEnabled = false;
        }

        if (recordingMonitoringEnabled && Build.VERSION.SDK_INT >= 35) {
            WindowManager windowManager = activity.getWindowManager();
            if (windowManager != null) {
                windowManager.removeScreenRecordingCallback(screenRecordingCallback);
            }
            recordingMonitoringEnabled = false;
        }
    }

    @PluginMethod
    public void requestStartupRuntimePermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            call.resolve();
            return;
        }

        List<String> aliases = new ArrayList<>();
        aliases.add("camera");
        aliases.add("microphone");
        if (Build.VERSION.SDK_INT >= 34) {
            aliases.add("images");
            aliases.add("videos");
            aliases.add("selectedVisualMedia");
        } else if (Build.VERSION.SDK_INT >= 33) {
            aliases.add("images");
            aliases.add("videos");
        } else {
            aliases.add("legacyStorage");
        }
        if (Build.VERSION.SDK_INT >= 33) {
            aliases.add("notifications");
        }
        requestPermissionForAliases(
            aliases.toArray(new String[0]),
            call,
            "startupRuntimePermissionsResult"
        );
    }

    @PermissionCallback
    private void startupRuntimePermissionsResult(PluginCall call) {
        // Permission denial is a normal result; do not reject the startup call.
        call.resolve();
    }

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
    public void setScreenSecurity(PluginCall call) {
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

    @PluginMethod
    public void setCaptureMonitoring(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled == null) {
            call.reject("The enabled option must be a boolean.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            if (!enabled) {
                stopCaptureMonitoring();
                call.resolve();
                return;
            }

            try {
                captureMonitoringEnabled = true;
                Executor mainExecutor = command -> getActivity().runOnUiThread(command);

                if (!screenshotMonitoringEnabled) {
                    if (Build.VERSION.SDK_INT >= 34) {
                        if (screenCaptureCallback == null) {
                            screenCaptureCallback = new Api34ScreenCaptureCallback(this);
                        }
                        screenCaptureCallback.register(getActivity(), mainExecutor);
                    } else {
                        startLegacyScreenshotMonitoring();
                    }
                    screenshotMonitoringEnabled = true;
                }

                if (Build.VERSION.SDK_INT >= 35 && !recordingMonitoringEnabled) {
                    WindowManager windowManager = getActivity().getWindowManager();
                    if (windowManager == null) {
                        call.reject("Screen recording monitoring is unavailable.");
                        stopCaptureMonitoring();
                        return;
                    }
                    int initialState = windowManager.addScreenRecordingCallback(
                        mainExecutor,
                        screenRecordingCallback
                    );
                    recordingMonitoringEnabled = true;
                    if (initialState == WindowManager.SCREEN_RECORDING_STATE_VISIBLE) {
                        screenRecordingCallback.accept(initialState);
                    }
                }
            } catch (RuntimeException error) {
                stopCaptureMonitoring();
                call.reject("Android capture monitoring could not be started.");
                return;
            }
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        stopCaptureMonitoring();
        super.handleOnDestroy();
    }
}