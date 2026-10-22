package com.yourworld.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;

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
    private static final String EXTRA_NOTIFICATION_URL = "yw_notification_url";
    private static final String EXTRA_NOTIFICATION_TYPE = "yw_notification_type";
    private static final String EXTRA_NOTIFICATION_SENDER_ID = "yw_notification_sender_id";
    private static final String EXTRA_CONVERSATION_ID = "yw_conversation_id";
    private static final String EXTRA_MESSAGE_ID = "yw_message_id";
    private static final String MESSAGE_NOTIFICATION_ACTION = "com.yourworld.app.MESSAGE_NOTIFICATION";
    private static final String APP_NOTIFICATION_ACTION = "com.yourworld.app.APP_NOTIFICATION";
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
    );

    private static volatile CallPushPlugin activePlugin;
    private static JSObject pendingAction;
    private static JSObject pendingNotificationAction;
    private static volatile String activeConversationId;

    @Override
    public void load() {
        super.load();
        activePlugin = this;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("permission", notificationsEnabled() ? "granted" : "prompt");
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
            resolvePermissionResult(call, "denied");
            return;
        }
        registerAfterPermission(call);
    }

    @PluginMethod
    public void getToken(PluginCall call) {
        if (!notificationsEnabled()) {
            resolvePermissionResult(call, "denied");
            return;
        }
        fetchToken(call);
    }

    @PluginMethod
    public void setActiveConversation(PluginCall call) {
        String conversationId = call.getString("conversationId");
        if (conversationId != null && !UUID_PATTERN.matcher(conversationId).matches()) {
            call.reject("A valid conversation ID or null is required.");
            return;
        }
        activeConversationId = conversationId;
        call.resolve();
    }

    static boolean isConversationActive(String conversationId) {
        return conversationId != null && conversationId.equals(activeConversationId);
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
    public void consumePendingNotificationAction(PluginCall call) {
        JSObject result = new JSObject();
        synchronized (CallPushPlugin.class) {
            result.put("action", pendingNotificationAction);
            pendingNotificationAction = null;
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
            resolvePermissionResult(call, "denied");
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
            call.resolve(result);
        });
    }

    private void resolvePermissionResult(PluginCall call, String permission) {
        JSObject result = new JSObject();
        result.put("permission", permission);
        result.put("token", (String) null);
        call.resolve(result);
    }

    private boolean notificationsEnabled() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return getPermissionState("notifications") == PermissionState.GRANTED;
        }
        return NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
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

    static void captureAppNotificationAction(Intent intent) {
        if (intent == null) return;
        String intentAction = intent.getAction();
        String kind = MESSAGE_NOTIFICATION_ACTION.equals(intentAction)
                ? "message"
                : APP_NOTIFICATION_ACTION.equals(intentAction)
                        ? intent.getStringExtra(EXTRA_NOTIFICATION_TYPE)
                        : null;
        if (kind == null) return;

        String url = intent.getStringExtra(EXTRA_NOTIFICATION_URL);
        if (url == null || !url.startsWith("/") || url.startsWith("//") || url.length() > 512) return;

        JSObject event = new JSObject();
        event.put("kind", kind);
        event.put("url", url);
        putStringExtra(event, intent, "senderId", EXTRA_NOTIFICATION_SENDER_ID);
        putStringExtra(event, intent, "conversationId", EXTRA_CONVERSATION_ID);
        putStringExtra(event, intent, "messageId", EXTRA_MESSAGE_ID);

        CallPushPlugin plugin = activePlugin;
        synchronized (CallPushPlugin.class) {
            pendingNotificationAction = event;
        }
        if (plugin != null) {
            plugin.notifyListeners("notificationAction", event);
        }
    }

    private static void putStringExtra(JSObject target, Intent intent, String key, String extra) {
        String value = intent.getStringExtra(extra);
        if (value != null && !value.isEmpty()) target.put(key, value);
    }
}