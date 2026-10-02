package com.yourworld.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import java.util.LinkedHashMap;
import java.util.Map;

public class UploadForegroundService extends Service {
    public static final String ACTION_START = "com.yourworld.app.upload.START";
    public static final String ACTION_UPDATE = "com.yourworld.app.upload.UPDATE";
    public static final String ACTION_STOP = "com.yourworld.app.upload.STOP";
    public static final String EXTRA_UPLOAD_ID = "uploadId";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_PROGRESS = "progress";
    public static final String EXTRA_DETAIL = "detail";

    private static final String CHANNEL_ID = "video_uploads";
    private static final int NOTIFICATION_ID = 4201;
    private static final long WAKE_LOCK_TIMEOUT_MS = 6L * 60L * 60L * 1000L;

    private final Map<String, UploadState> activeUploads = new LinkedHashMap<>();
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        String uploadId = intent.getStringExtra(EXTRA_UPLOAD_ID);
        if (uploadId == null || uploadId.trim().isEmpty()) {
            return START_NOT_STICKY;
        }

        if (ACTION_START.equals(action)) {
            String title = intent.getStringExtra(EXTRA_TITLE);
            activeUploads.put(uploadId, new UploadState(
                    title == null || title.trim().isEmpty() ? "Long video" : title.trim(),
                    -1,
                    ""
            ));
            acquireWakeLock();
            startInForeground(buildNotification());
        } else if (ACTION_UPDATE.equals(action)) {
            UploadState current = activeUploads.get(uploadId);
            if (current != null) {
                activeUploads.put(uploadId, new UploadState(
                        current.title,
                        Math.max(0, Math.min(100, intent.getIntExtra(EXTRA_PROGRESS, 0))),
                        intent.getStringExtra(EXTRA_DETAIL)
                ));
                updateNotification();
            }
        } else if (ACTION_STOP.equals(action)) {
            activeUploads.remove(uploadId);
            if (activeUploads.isEmpty()) {
                stopForeground(true);
                releaseWakeLock();
                stopSelf(startId);
            } else {
                updateNotification();
            }
        }

        return START_NOT_STICKY;
    }

    private void startInForeground(Notification notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            );
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void updateNotification() {
        if (activeUploads.isEmpty()) {
            return;
        }
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    private Notification buildNotification() {
        UploadState current = null;
        for (UploadState state : activeUploads.values()) {
            current = state;
        }

        String title = current == null ? "Preparing video upload" : current.title;
        String detail = current == null ? "" : current.detail;
        int progress = current == null ? 0 : Math.max(0, current.progress);
        boolean indeterminate = current == null || current.progress < 0;
        String content = detail == null || detail.trim().isEmpty()
                ? title + " · " + (indeterminate ? "Starting" : progress + "%")
                : title + " · " + detail.trim();
        if (activeUploads.size() > 1) {
            content += " · +" + (activeUploads.size() - 1) + " more";
        }

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);
        builder.setSmallIcon(R.drawable.ic_upload_notification)
                .setContentTitle("Uploading video")
                .setContentText(content)
                .setCategory(Notification.CATEGORY_PROGRESS)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setProgress(100, progress, indeterminate);

        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launchIntent != null) {
            int pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pendingIntentFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    NOTIFICATION_ID,
                    launchIntent,
                    pendingIntentFlags
            );
            builder.setContentIntent(pendingIntent);
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            builder.setPriority(Notification.PRIORITY_LOW);
        }
        return builder.build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Video uploads",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Shows progress while a video is uploading.");
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    private void acquireWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            return;
        }
        PowerManager powerManager = getSystemService(PowerManager.class);
        if (powerManager == null) {
            return;
        }
        wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "YourWorld:VideoUpload"
        );
        wakeLock.setReferenceCounted(false);
        wakeLock.acquire(WAKE_LOCK_TIMEOUT_MS);
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        wakeLock = null;
    }

    @Override
    public void onDestroy() {
        releaseWakeLock();
        activeUploads.clear();
        stopForeground(true);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private static final class UploadState {
        final String title;
        final int progress;
        final String detail;

        UploadState(String title, int progress, String detail) {
            this.title = title;
            this.progress = progress;
            this.detail = detail;
        }
    }
}