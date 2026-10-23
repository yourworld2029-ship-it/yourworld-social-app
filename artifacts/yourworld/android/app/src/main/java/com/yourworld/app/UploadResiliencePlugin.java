package com.yourworld.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
        name = "UploadResilience",
        permissions = {
                @Permission(
                        alias = "notifications",
                        strings = { Manifest.permission.POST_NOTIFICATIONS }
                )
        }
)
public class UploadResiliencePlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias(
                    "notifications",
                    call,
                    "notificationPermissionResult"
            );
            return;
        }
        startUploadService(call);
    }

    @PermissionCallback
    public void notificationPermissionResult(PluginCall call) {
        // Continue the upload even if notification permission is declined. Android still
        // keeps the foreground service in its active-apps list; the app overlay remains
        // available while the user is in YourWorld.
        startUploadService(call);
    }

    private void startUploadService(PluginCall call) {
        String uploadId = call.getString("uploadId");
        if (uploadId == null || uploadId.trim().isEmpty()) {
            call.reject("An upload ID is required.");
            return;
        }

        Intent intent = new Intent(getContext(), UploadForegroundService.class)
                .setAction(UploadForegroundService.ACTION_START)
                .putExtra(UploadForegroundService.EXTRA_UPLOAD_ID, uploadId)
                .putExtra(UploadForegroundService.EXTRA_TITLE, call.getString("title", "Media upload"))
                .putExtra(UploadForegroundService.EXTRA_KIND, call.getString("kind", "video"));
        try {
            ContextCompat.startForegroundService(getContext(), intent);
            JSObject result = new JSObject();
            result.put(
                    "notificationsEnabled",
                    NotificationManagerCompat.from(getContext()).areNotificationsEnabled()
            );
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not start Android upload protection.", error);
        }
    }

    @PluginMethod
    public void update(PluginCall call) {
        String uploadId = call.getString("uploadId");
        if (uploadId == null || uploadId.trim().isEmpty()) {
            call.reject("An upload ID is required.");
            return;
        }

        Intent intent = new Intent(getContext(), UploadForegroundService.class)
                .setAction(UploadForegroundService.ACTION_UPDATE)
                .putExtra(UploadForegroundService.EXTRA_UPLOAD_ID, uploadId)
                .putExtra(UploadForegroundService.EXTRA_PROGRESS, call.getInt("progress", 0))
                .putExtra(UploadForegroundService.EXTRA_DETAIL, call.getString("detail", ""))
                .putExtra(
                        UploadForegroundService.EXTRA_CLEAR_BYTE_PROGRESS,
                        Boolean.TRUE.equals(call.getBoolean("clearByteProgress"))
                );
        Long bytesUploaded = call.getLong("bytesUploaded");
        Long bytesTotal = call.getLong("bytesTotal");
        if (bytesUploaded != null) {
            intent.putExtra(UploadForegroundService.EXTRA_BYTES_UPLOADED, bytesUploaded);
        }
        if (bytesTotal != null) {
            intent.putExtra(UploadForegroundService.EXTRA_BYTES_TOTAL, bytesTotal);
        }
        try {
            getContext().startService(intent);
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not update Android upload progress.", error);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        String uploadId = call.getString("uploadId");
        if (uploadId == null || uploadId.trim().isEmpty()) {
            call.reject("An upload ID is required.");
            return;
        }

        Intent intent = new Intent(getContext(), UploadForegroundService.class)
                .setAction(UploadForegroundService.ACTION_STOP)
                .putExtra(UploadForegroundService.EXTRA_UPLOAD_ID, uploadId);
        try {
            getContext().startService(intent);
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not stop Android upload protection.", error);
        }
    }

    @PluginMethod
    public void complete(PluginCall call) {
        String uploadId = call.getString("uploadId");
        if (uploadId == null || uploadId.trim().isEmpty()) {
            call.reject("An upload ID is required.");
            return;
        }

        Intent intent = new Intent(getContext(), UploadForegroundService.class)
                .setAction(UploadForegroundService.ACTION_COMPLETE)
                .putExtra(UploadForegroundService.EXTRA_UPLOAD_ID, uploadId);
        try {
            getContext().startService(intent);
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not finish Android upload notifications.", error);
        }
    }
}