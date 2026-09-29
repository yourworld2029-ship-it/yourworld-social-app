package com.yourworld.app;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.firebase.messaging.FirebaseMessaging;

import java.util.regex.Pattern;

@CapacitorPlugin(
        name = "CallPush",
        permissions = {
                @Permission(
                        alias = "notifications",
                        strings = { Manifest.permission.POST_NOTIFICATIONS }
                )
        }
)
public class CallPushPlugin extends Plugin {
    private static final String EXTRA_CALL_ID = "yw_call_id";
    private static final String EXTRA_CALL_ACTION = "yw_call_action";
    private static final String EXTRA_CALL_MODE = "yw_call_mode";
    private static final String EXTRA_PEER_NAME = "yw_peer_name";
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
    );

    private static volatile CallPushPlugin activePlugin;
    private static JSObject pendingAction;

    @Override
    public void load() {
        super.load();
        activePlugin = this;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("permission", notificationsEnabled() ? "granted" : "prompt");
        result.put("fullScreenIntentAllowed", fullScreenIntentAllowed());
        call.resolve(result);
    }

    @PluginMethod
    public void register(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
            return;
        }
        registerAfterPermission(call);
    }

    @PermissionCallback
    public void notificationPermissionCallback(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && getPermissionState("notifications") != PermissionState.GRANTED) {
            resolvePermissionResult(call, "denied", false);
            return;
        }
        registerAfterPermission(call);
    }

    @PluginMethod
    public void getToken(PluginCall call) {
        if (!notificationsEnabled()) {
            resolvePermissionResult(call, "denied", false);
            return;
        }
        fetchToken(call);
    }

    @PluginMethod
    public void consumePendingAction(PluginCall call) {
        JSObject result = new JSObject();
        synchronized (CallPushPlugin.class) {
            result.put("action", pendingAction);
            pendingAction = null;
        }
        call.resolve(result);
    }

    @PluginMethod
    public void dismiss(PluginCall call) {
        String callId = call.getString("callId");
        if (callId == null || !UUID_PATTERN.matcher(callId).matches()) {
            call.reject("A valid call ID is required.");
            return;
        }
        NotificationManagerCompat.from(getContext())
                .cancel(IncomingCallMessagingService.notificationTag(callId), callId.hashCode());
        call.resolve();
    }

    private void registerAfterPermission(PluginCall call) {
        if (!notificationsEnabled()) {
            resolvePermissionResult(call, "denied", false);
            return;
        }

        if (Build.VERSION.SDK_INT >= 34 && !fullScreenIntentAllowed()) {
            try {
                Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
                settingsIntent.setData(Uri.parse("package:" + getContext().getPackageName()));
                getActivity().startActivity(settingsIntent);
                resolvePermissionResult(call, "granted", true);
            } catch (Exception error) {
                call.reject("Android could not open full-screen call notification settings.");
            }
            return;
        }

        fetchToken(call);
    }

    private void fetchToken(PluginCall call) {
        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (!task.isSuccessful() || task.getResult() == null) {
                call.reject("Could not register this device for call notifications.");
                return;
            }
            JSObject result = new JSObject();
            result.put("permission", "granted");
            result.put("token", task.getResult());
            result.put("fullScreenIntentPermissionRequired", false);
            call.resolve(result);
        });
    }

    private void resolvePermissionResult(
            PluginCall call,
            String permission,
            boolean fullScreenIntentPermissionRequired
    ) {
        JSObject result = new JSObject();
        result.put("permission", permission);
        result.put("token", (String) null);
        result.put("fullScreenIntentPermissionRequired", fullScreenIntentPermissionRequired);
        call.resolve(result);
    }

    private boolean notificationsEnabled() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return getPermissionState("notifications") == PermissionState.GRANTED;
        }
        return NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
    }

    private boolean fullScreenIntentAllowed() {
        if (Build.VERSION.SDK_INT < 34) {
            return true;
        }
        NotificationManager manager = getContext().getSystemService(NotificationManager.class);
        return manager != null && manager.canUseFullScreenIntent();
    }

    static boolean isCallNotificationIntent(Intent intent) {
        if (intent == null) return false;
        String callId = intent.getStringExtra(EXTRA_CALL_ID);
        String action = intent.getStringExtra(EXTRA_CALL_ACTION);
        return callId != null
                && UUID_PATTERN.matcher(callId).matches()
                && ("open".equals(action) || "accept".equals(action) || "decline".equals(action));
    }

    static void captureNotificationAction(Intent intent) {
        if (!isCallNotificationIntent(intent)) return;
        String action = intent.getStringExtra(EXTRA_CALL_ACTION);
        if (!"accept".equals(action) && !"decline".equals(action)) return;

        JSObject event = new JSObject();
        event.put("action", action);
        event.put("callId", intent.getStringExtra(EXTRA_CALL_ID));
        event.put("mode", intent.getStringExtra(EXTRA_CALL_MODE));
        event.put("peerName", intent.getStringExtra(EXTRA_PEER_NAME));

        CallPushPlugin plugin = activePlugin;
        synchronized (CallPushPlugin.class) {
            pendingAction = event;
        }
        if (plugin != null) {
            plugin.notifyListeners("callAction", event);
        }
    }
}