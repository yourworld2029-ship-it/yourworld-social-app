package com.yourworld.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;
import java.util.regex.Pattern;

public class IncomingCallMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "yourworld-incoming-calls";
    private static final String EXTRA_CALL_ID = "yw_call_id";
    private static final String EXTRA_CALL_ACTION = "yw_call_action";
    private static final String EXTRA_CALL_MODE = "yw_call_mode";
    private static final String EXTRA_PEER_NAME = "yw_peer_name";
    private static final String MESSAGE_CHANNEL_ID = "yourworld-messages";
    private static final String CAPTURE_CHANNEL_ID = "yourworld-chat-security";
    private static final String EXTRA_MESSAGE_ID = "yw_message_id";
    private static final String EXTRA_CONVERSATION_ID = "yw_conversation_id";
    private static final long WAKE_LOCK_TIMEOUT_MS = 10_000L;
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
    );

    @Override
    public void onMessageReceived(RemoteMessage message) {
        Map<String, String> data = message.getData();
        String type = data.get("type");
        if ("call-dismiss".equals(type)) {
            String callId = data.get("callId");
            if (callId != null && UUID_PATTERN.matcher(callId).matches()) {
                NotificationManagerCompat.from(this).cancel(notificationTag(callId), callId.hashCode());
            }
            return;
        }
        if (!"call".equals(type) && !"message".equals(type) && !"capture-alert".equals(type)) return;
        String conversationId = data.get("conversationId");
        if ("call".equals(type)
                && MainActivity.isAppForeground()
                && !isDeviceLockedOrScreenOff()) return;
        if ("message".equals(type)
                && MainActivity.isAppForeground()
                && CallPushPlugin.isConversationActive(conversationId)) return;
        if ("capture-alert".equals(type)
                && MainActivity.isAppForeground()
                && CallPushPlugin.isConversationActive(conversationId)) return;
        // Realtime is the in-app delivery path; do not wake the screen or post
        // OS notifications when the recipient has disabled notifications.
        if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) return;

        PowerManager powerManager = getSystemService(PowerManager.class);
        PowerManager.WakeLock wakeLock = null;
        try {
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(
                        PowerManager.PARTIAL_WAKE_LOCK,
                        "YourWorld:incoming-push"
                );
                wakeLock.acquire(WAKE_LOCK_TIMEOUT_MS);
            }

            if ("call".equals(type)) {
                String callId = data.get("callId");
                String mode = data.get("mode");
                if (callId == null || !UUID_PATTERN.matcher(callId).matches()) return;
                if (!"audio".equals(mode) && !"video".equals(mode)) return;
                String peerName = safeText(data.get("peerName"), "YourWorld caller", 80);
                ensureCallChannel();
                showIncomingCall(callId, mode, peerName);
            } else if ("message".equals(type)) {
                showMessage(data);
            } else {
                showCaptureAlert(data);
            }
        } finally {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        }
    }

    private String safeText(String value, String fallback, int maxLength) {
        if (value == null || value.trim().isEmpty()) return fallback;
        String trimmed = value.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    private boolean isDeviceLockedOrScreenOff() {
        KeyguardManager keyguardManager = getSystemService(KeyguardManager.class);
        PowerManager powerManager = getSystemService(PowerManager.class);
        return (keyguardManager != null && keyguardManager.isKeyguardLocked())
                || (powerManager != null && !powerManager.isInteractive());
    }

    static String notificationTag(String callId) {
        return "yourworld-call-" + callId;
    }

    private void showIncomingCall(String callId, String mode, String peerName) {
        Intent openIntent = callIntent(callId, "open", mode, peerName);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
                this,
                callId.hashCode(),
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        PendingIntent declinePendingIntent = PendingIntent.getActivity(
                this,
                callId.hashCode() ^ 0x41A7,
                callIntent(callId, "decline", mode, peerName),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        PendingIntent answerPendingIntent = PendingIntent.getActivity(
                this,
                callId.hashCode() ^ 0x79D3,
                callIntent(callId, "accept", mode, peerName),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Person caller = new Person.Builder()
                .setName(peerName)
                .setImportant(true)
                .build();
        String callLabel = "video".equals(mode) ? "Incoming video call" : "Incoming audio call";
        NotificationCompat.Builder notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(peerName)
                .setContentText(callLabel)
                .setContentIntent(openPendingIntent)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setTimeoutAfter(30_000)
                .setStyle(NotificationCompat.CallStyle.forIncomingCall(
                        caller,
                        declinePendingIntent,
                        answerPendingIntent
                ));

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(notificationTag(callId), callId.hashCode(), notification.build());
        }
    }

    private void showMessage(Map<String, String> data) {
        String messageId = safeText(data.get("messageId"), String.valueOf(System.currentTimeMillis()), 80);
        String conversationId = safeText(data.get("conversationId"), "", 100);
        String peerName = safeText(data.get("peerName"), "YourWorld", 80);
        String body = safeText(data.get("body"), "Sent you a message", 120);

        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setAction("com.yourworld.app.MESSAGE_NOTIFICATION");
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        openIntent.putExtra(EXTRA_MESSAGE_ID, messageId);
        openIntent.putExtra(EXTRA_CONVERSATION_ID, conversationId);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
                this,
                messageId.hashCode(),
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        ensureMessageChannel();
        NotificationCompat.Builder notification = new NotificationCompat.Builder(this, MESSAGE_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(peerName)
                .setContentText(body)
                .setContentIntent(openPendingIntent)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
                .setAutoCancel(true)
                .setOnlyAlertOnce(false);

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify("yourworld-message-" + messageId, messageId.hashCode(), notification.build());
        }
    }

    private void showCaptureAlert(Map<String, String> data) {
        String conversationId = safeText(data.get("conversationId"), "", 100);
        String eventId = safeText(data.get("eventId"), String.valueOf(System.currentTimeMillis()), 100);
        String actorName = safeText(data.get("actorName"), "A chat participant", 80);
        String kind = data.get("kind");
        if (!UUID_PATTERN.matcher(conversationId).matches()) return;
        if (!"screenshot".equals(kind) && !"recording".equals(kind)) return;

        String body = "screenshot".equals(kind)
                ? actorName + " took a screenshot in your protected chat."
                : actorName + " started a screen recording in your protected chat.";
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setAction("com.yourworld.app.CAPTURE_ALERT_NOTIFICATION");
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        openIntent.putExtra(EXTRA_CONVERSATION_ID, conversationId);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
                this,
                eventId.hashCode(),
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        ensureCaptureAlertChannel();
        NotificationCompat.Builder notification = new NotificationCompat.Builder(this, CAPTURE_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Protected chat alert")
                .setContentText(body)
                .setContentIntent(openPendingIntent)
                .setCategory(NotificationCompat.CATEGORY_STATUS)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
                .setAutoCancel(true)
                .setOnlyAlertOnce(false);

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify("yourworld-capture-" + eventId, eventId.hashCode(), notification.build());
        }
    }

    private Intent callIntent(String callId, String action, String mode, String peerName) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction("com.yourworld.app.INCOMING_CALL");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra(EXTRA_CALL_ID, callId);
        intent.putExtra(EXTRA_CALL_ACTION, action);
        intent.putExtra(EXTRA_CALL_MODE, mode);
        intent.putExtra(EXTRA_PEER_NAME, peerName);
        return intent;
    }

    private void ensureCallChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Incoming calls",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Alerts for incoming YourWorld calls.");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 500, 250, 500 });
        Uri ringtone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        if (ringtone == null) {
            ringtone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        channel.setSound(ringtone, audioAttributes);
        manager.createNotificationChannel(channel);
    }

    private void ensureMessageChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(MESSAGE_CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
                MESSAGE_CHANNEL_ID,
                "Messages",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Alerts for new YourWorld messages.");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 250, 150, 250 });
        Uri notificationSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        channel.setSound(notificationSound, audioAttributes);
        manager.createNotificationChannel(channel);
    }

    private void ensureCaptureAlertChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CAPTURE_CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
                CAPTURE_CHANNEL_ID,
                "Chat protection alerts",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Alerts when Android reports a screenshot or screen recording in a protected chat.");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 250, 150, 250 });
        Uri notificationSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        channel.setSound(notificationSound, audioAttributes);
        manager.createNotificationChannel(channel);
    }
}