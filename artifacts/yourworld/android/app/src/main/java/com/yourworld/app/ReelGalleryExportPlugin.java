package com.yourworld.app;

import android.Manifest;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(
        name = "ReelGalleryExport",
        permissions = {
                @Permission(
                        alias = "legacyStorage",
                        strings = {Manifest.permission.WRITE_EXTERNAL_STORAGE}
                )
        }
)
public class ReelGalleryExportPlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final ConcurrentHashMap<String, GallerySession> sessions =
            new ConcurrentHashMap<>();

    @PluginMethod
    public void beginSave(PluginCall call) {
        String mimeType = call.getString("mimeType");
        String fileName = sanitizeFileName(call.getString("fileName"));
        mimeType = normalizeVideoMimeType(mimeType);
        if (mimeType == null) {
            call.reject("The YourWorld gallery only accepts MP4 or WebM video.");
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
                ContextCompat.checkSelfPermission(
                        getContext(),
                        Manifest.permission.WRITE_EXTERNAL_STORAGE
                ) != PackageManager.PERMISSION_GRANTED) {
            requestPermissionForAlias(
                    "legacyStorage",
                    call,
                    "legacyStoragePermissionResult"
            );
            return;
        }
        createSession(call, fileName, mimeType);
    }

    @PermissionCallback
    private void legacyStoragePermissionResult(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
                ContextCompat.checkSelfPermission(
                        getContext(),
                        Manifest.permission.WRITE_EXTERNAL_STORAGE
                ) != PackageManager.PERMISSION_GRANTED) {
            call.reject("Storage permission is required to save this Reel to Gallery.");
            return;
        }
        createSession(
                call,
                sanitizeFileName(call.getString("fileName")),
                call.getString("mimeType")
        );
    }

    private void createSession(PluginCall call, String fileName, String mimeType) {
        String normalizedMimeType = normalizeVideoMimeType(mimeType);
        if (normalizedMimeType == null) {
            call.reject("The YourWorld gallery only accepts MP4 or WebM video.");
            return;
        }
        executor.execute(() -> {
            try {
                String transferId = UUID.randomUUID().toString();
                GallerySession session = createGallerySession(fileName, normalizedMimeType);
                sessions.put(transferId, session);
                JSObject result = new JSObject();
                result.put("transferId", transferId);
                call.resolve(result);
            } catch (Exception error) {
                call.reject(
                        error.getMessage() == null
                                ? "Could not create the Reel gallery file."
                                : error.getMessage(),
                        error
                );
            }
        });
    }

    @PluginMethod
    public void appendData(PluginCall call) {
        String transferId = call.getString("transferId");
        String base64 = call.getString("base64");
        if (transferId == null || base64 == null) {
            call.reject("The Reel export transfer and data are required.");
            return;
        }
        executor.execute(() -> {
            GallerySession session = sessions.get(transferId);
            if (session == null) {
                call.reject("The Reel gallery transfer is no longer active.");
                return;
            }
            try {
                byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                synchronized (session) {
                    session.output.write(bytes);
                    session.sizeBytes += bytes.length;
                }
                call.resolve();
            } catch (Exception error) {
                call.reject("Could not write the watermarked Reel to Gallery.", error);
            }
        });
    }

    @PluginMethod
    public void finishSave(PluginCall call) {
        String transferId = call.getString("transferId");
        if (transferId == null) {
            call.reject("A Reel gallery transfer ID is required.");
            return;
        }
        executor.execute(() -> {
            GallerySession session = sessions.remove(transferId);
            if (session == null) {
                call.reject("The Reel gallery transfer is no longer active.");
                return;
            }
            try {
                synchronized (session) {
                    session.output.flush();
                    session.output.close();
                }
                if (session.sizeBytes <= 0) {
                    discardSession(session);
                    call.reject("The watermarked Reel file is empty.");
                    return;
                }
                String uri = publishSession(session);
                JSObject result = new JSObject();
                result.put("uri", uri);
                result.put("sizeBytes", session.sizeBytes);
                call.resolve(result);
            } catch (Exception error) {
                discardSession(session);
                call.reject(
                        error.getMessage() == null
                                ? "The watermarked Reel could not be saved to Gallery."
                                : error.getMessage(),
                        error
                );
            }
        });
    }

    @PluginMethod
    public void cancelSave(PluginCall call) {
        String transferId = call.getString("transferId");
        if (transferId == null) {
            call.resolve();
            return;
        }
        executor.execute(() -> {
            GallerySession session = sessions.remove(transferId);
            if (session != null) discardSession(session);
            call.resolve();
        });
    }

    private GallerySession createGallerySession(String fileName, String mimeType) throws Exception {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
            values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
            values.put(
                    MediaStore.MediaColumns.RELATIVE_PATH,
                    Environment.DIRECTORY_MOVIES + "/YourWorld"
            );
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);
            Uri uri = getContext().getContentResolver().insert(
                    MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
                    values
            );
            if (uri == null) {
                throw new IllegalStateException("Android could not create a Gallery entry.");
            }
            OutputStream output = getContext().getContentResolver().openOutputStream(uri, "w");
            if (output == null) {
                getContext().getContentResolver().delete(uri, null, null);
                throw new IllegalStateException("Android could not open the Gallery file.");
            }
            return new GallerySession(uri, null, output, mimeType);
        }

        File movies = Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_MOVIES
        );
        File directory = new File(movies, "YourWorld");
        if (!directory.isDirectory() && !directory.mkdirs()) {
            throw new IllegalStateException("The YourWorld Gallery folder could not be created.");
        }
        File file = new File(directory, fileName);
        if (file.exists()) {
            int extensionIndex = fileName.lastIndexOf('.');
            String stem = extensionIndex > 0 ? fileName.substring(0, extensionIndex) : fileName;
            String extension = extensionIndex > 0 ? fileName.substring(extensionIndex) : ".mp4";
            file = new File(directory, stem + "-" + System.currentTimeMillis() + extension);
        }
        return new GallerySession(null, file, new FileOutputStream(file, false), mimeType);
    }

    private String publishSession(GallerySession session) throws Exception {
        if (session.uri != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.IS_PENDING, 0);
            int updated = getContext().getContentResolver().update(
                    session.uri,
                    values,
                    null,
                    null
            );
            if (updated <= 0) {
                throw new IllegalStateException("Android could not publish the Gallery video.");
            }
            return session.uri.toString();
        }
        if (session.file == null || !session.file.isFile()) {
            throw new IllegalStateException("The saved Gallery video is missing.");
        }
        MediaScannerConnection.scanFile(
                getContext(),
                new String[] {session.file.getAbsolutePath()},
                new String[] {session.mimeType},
                null
        );
        return Uri.fromFile(session.file).toString();
    }

    private void discardSession(GallerySession session) {
        try {
            session.output.close();
        } catch (Exception ignored) {
            // Cleanup continues even if the partial output stream is already closed.
        }
        if (session.uri != null) {
            getContext().getContentResolver().delete(session.uri, null, null);
        }
        if (session.file != null && session.file.exists()) {
            session.file.delete();
        }
    }

    private String sanitizeFileName(String value) {
        String safe = value == null ? "" : value.trim();
        safe = safe.replaceAll("[^A-Za-z0-9._-]+", "-");
        safe = safe.replaceAll("^-+|-+$", "");
        if (!safe.toLowerCase(Locale.ROOT).endsWith(".mp4") &&
                !safe.toLowerCase(Locale.ROOT).endsWith(".webm")) safe += ".mp4";
        if (safe.length() > 120) {
            String extension = safe.toLowerCase(Locale.ROOT).endsWith(".webm") ? ".webm" : ".mp4";
            safe = safe.substring(0, 120 - extension.length()) + extension;
        }
        return safe.isEmpty() ? "yourworld-reel.mp4" : safe;
    }

    private boolean isSupportedVideoMimeType(String mimeType) {
        return "video/mp4".equalsIgnoreCase(mimeType) ||
                "video/webm".equalsIgnoreCase(mimeType);
    }

    private String normalizeVideoMimeType(String mimeType) {
        if (mimeType == null) return null;
        String normalized = mimeType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
        return isSupportedVideoMimeType(normalized) ? normalized : null;
    }

    @Override
    protected void handleOnDestroy() {
        for (String transferId : sessions.keySet()) {
            GallerySession session = sessions.remove(transferId);
            if (session != null) executor.execute(() -> discardSession(session));
        }
        executor.shutdown();
        super.handleOnDestroy();
    }

    private static final class GallerySession {
        final Uri uri;
        final File file;
        final OutputStream output;
        final String mimeType;
        long sizeBytes;

        GallerySession(Uri uri, File file, OutputStream output, String mimeType) {
            this.uri = uri;
            this.file = file;
            this.output = output;
            this.mimeType = mimeType;
        }
    }
}