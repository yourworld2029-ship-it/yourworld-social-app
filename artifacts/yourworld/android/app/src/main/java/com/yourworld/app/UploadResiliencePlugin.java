package com.yourworld.app;

import android.content.Intent;

import androidx.core.content.ContextCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "UploadResilience")
public class UploadResiliencePlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
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
            call.resolve();
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