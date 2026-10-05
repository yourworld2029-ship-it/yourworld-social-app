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

import androidx.core.app.NotificationManagerCompat;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

public class UploadForegroundService extends Service {
    public static final String ACTION_START = "com.yourworld.app.upload.START";
    public static final String ACTION_START_DOWNLOAD = "com.yourworld.app.upload.START_DOWNLOAD";
    public static final String ACTION_UPDATE = "com.yourworld.app.upload.UPDATE";
    public static final String ACTION_STOP = "com.yourworld.app.upload.STOP";
    public static final String ACTION_COMPLETE = "com.yourworld.app.upload.COMPLETE";
    public static final String EXTRA_UPLOAD_ID = "uploadId";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_PROGRESS = "progress";
    public static final String EXTRA_DETAIL = "detail";
    public static final String EXTRA_BYTES_UPLOADED = "bytesUploaded";
    public static final String EXTRA_BYTES_TOTAL = "bytesTotal";
    public static final String EXTRA_CLEAR_BYTE_PROGRESS = "clearByteProgress";

    private static final String CHANNEL_ID = "video_uploads";
    private static final String COMPLETION_CHANNEL_ID = "video_upload_complete";
    private static final int NOTIFICATION_ID = 4201;
    private static final int COMPLETION_NOTIFICATION_ID = 4202;
    private static final String TYPE_UPLOAD = "upload";
    private static final String TYPE_DOWNLOAD = "download";
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

        if (ACTION_START.equals(action) || ACTION_START_DOWNLOAD.equals(action)) {
            String title = intent.getStringExtra(EXTRA_TITLE);
            activeUploads.put(uploadId, new UploadState(
                    title == null || title.trim().isEmpty() ? "Long video" : title.trim(),
                    -1,
                    "",
                    ACTION_START_DOWNLOAD.equals(action) ? TYPE_DOWNLOAD : TYPE_UPLOAD,
                    -1L,
                    -1L
            ));
            acquireWakeLock();
            startInForeground(buildNotification());
        } else if (ACTION_UPDATE.equals(action)) {
            UploadState current = activeUploads.get(uploadId);
            if (current != null) {
                activeUploads.remove(uploadId);
                boolean clearByteProgress =
                        intent.getBooleanExtra(EXTRA_CLEAR_BYTE_PROGRESS, false);
                long bytesUploaded = intent.getLongExtra(EXTRA_BYTES_UPLOADED, -1L);
                long bytesTotal = intent.getLongExtra(EXTRA_BYTES_TOTAL, -1L);
                activeUploads.put(uploadId, new UploadState(
                        current.title,
                        clampProgress(intent.getIntExtra(EXTRA_PROGRESS, -1)),
                        intent.getStringExtra(EXTRA_DETAIL),
                        current.type,
                        clearByteProgress
                                ? -1L
                                : bytesUploaded >= 0L ? bytesUploaded : current.bytesUploaded,
                        clearByteProgress
                                ? -1L
                                : bytesTotal >= 0L ? bytesTotal : current.bytesTotal
                ));
                updateNotification();
            }
        } else if (ACTION_STOP.equals(action) || ACTION_COMPLETE.equals(action)) {
            UploadState finished = activeUploads.remove(uploadId);
            if (ACTION_COMPLETE.equals(action) && finished != null &&
                    TYPE_UPLOAD.equals(finished.type)) {
                notifyVideoPublished();
            }
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
        int progress = current == null ? 0 : Math.max(0, current.progress);
        boolean indeterminate = current == null || current.progress < 0;
        String content = current == null
                ? "Preparing video transfer..."
                : ("download".equals(current.type) ? "Downloading video... " : "Uploading video... ")
                    + (indeterminate ? "" : progress + "%");
        String contentText = title;
        if (current != null && current.bytesUploaded >= 0L && current.bytesTotal > 0L) {
            contentText = formatBytes(current.bytesUploaded)
                    + " / "
                    + formatBytes(current.bytesTotal)
                    + " uploaded";
            if (current.detail != null && !current.detail.trim().isEmpty()
                    && !"Uploading".equalsIgnoreCase(current.detail.trim())) {
                contentText += " · " + current.detail.trim();
            }
            contentText += " · " + title;
        }
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);
        builder.setSmallIcon(R.drawable.ic_upload_notification)
                .setContentTitle(content)
                .setContentText(contentText)
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
                "Video transfers",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Shows progress while videos are uploading or downloading.");
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
            manager.createNotificationChannel(new NotificationChannel(
                    COMPLETION_CHANNEL_ID,
                    "Video upload confirmations",
                    NotificationManager.IMPORTANCE_DEFAULT
            ));
        }
    }

    private void notifyVideoPublished() {
        if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) {
            return;
        }
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, COMPLETION_CHANNEL_ID)
                : new Notification.Builder(this);
        builder.setSmallIcon(R.drawable.ic_upload_notification)
                .setContentTitle("Video Published Successfully!")
                .setCategory(Notification.CATEGORY_STATUS)
                .setAutoCancel(true)
                .setOnlyAlertOnce(false);
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(COMPLETION_NOTIFICATION_ID, builder.build());
        }
    }

    private static int clampProgress(int progress) {
        return progress < 0 ? -1 : Math.max(0, Math.min(100, progress));
    }

    private static String formatBytes(long bytes) {
        long safeBytes = Math.max(0L, bytes);
        if (safeBytes < 1000L) return safeBytes + " B";
        String[] units = {"KB", "MB", "GB", "TB"};
        double value = safeBytes / 1000.0;
        int unitIndex = 0;
        while (value >= 1000.0 && unitIndex < units.length - 1) {
            value /= 1000.0;
            unitIndex++;
        }
        return String.format(Locale.US, value >= 10.0 ? "%.0f %s" : "%.1f %s", value, units[unitIndex]);
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
        final String type;
        final long bytesUploaded;
        final long bytesTotal;

        UploadState(
                String title,
                int progress,
                String detail,
                String type,
                long bytesUploaded,
                long bytesTotal
        ) {
            this.title = title;
            this.progress = progress;
            this.detail = detail;
            this.type = type;
            this.bytesUploaded = bytesUploaded;
            this.bytesTotal = bytesTotal;
        }
    }
}