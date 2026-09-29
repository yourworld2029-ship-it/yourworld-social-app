package com.yourworld.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
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
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
    );

    @Override
    public void onMessageReceived(RemoteMessage message) {
        Map<String, String> data = message.getData();
        if (!"call".equals(data.get("type")) || MainActivity.isAppForeground()) return;

        String callId = data.get("callId");
        String mode = data.get("mode");
        if (callId == null || !UUID_PATTERN.matcher(callId).matches()) return;
        if (!"audio".equals(mode) && !"video".equals(mode)) return;

        String peerName = data.get("peerName");
        if (peerName == null || peerName.trim().isEmpty()) peerName = "YourWorld caller";
        peerName = peerName.trim();
        if (peerName.length() > 80) peerName = peerName.substring(0, 80);

        ensureCallChannel();
        showIncomingCall(callId, mode, peerName);
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
                .setFullScreenIntent(openPendingIntent, true)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setTimeoutAfter(45_000)
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
}