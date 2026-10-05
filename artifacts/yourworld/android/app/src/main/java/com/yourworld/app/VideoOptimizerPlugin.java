package com.yourworld.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.database.Cursor;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.provider.OpenableColumns;

import androidx.annotation.Nullable;
import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.effect.Presentation;
import androidx.media3.muxer.Mp4Muxer;
import androidx.media3.muxer.Muxer;
import androidx.media3.muxer.MuxerException;
import androidx.media3.transformer.DefaultEncoderFactory;
import androidx.media3.transformer.DefaultMuxer;
import androidx.media3.transformer.EditedMediaItem;
import androidx.media3.transformer.Effects;
import androidx.media3.transformer.ProgressHolder;
import androidx.media3.transformer.Transformer;
import androidx.media3.transformer.VideoEncoderSettings;
import androidx.media3.transformer.ExportResult;
import androidx.media3.transformer.Composition;
import androidx.media3.transformer.ExportException;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.util.Collections;

@CapacitorPlugin(
        name = "VideoOptimizer",
        permissions = {
                @Permission(
                        alias = "videos",
                        strings = {Manifest.permission.READ_MEDIA_VIDEO}
                ),
                @Permission(
                        alias = "legacyStorage",
                        strings = {Manifest.permission.READ_EXTERNAL_STORAGE}
                )
        }
)
public class VideoOptimizerPlugin extends Plugin {
    private static final int MAX_SHORT_SIDE = 1080;
    private static final int MP4_FRONT_METADATA_RESERVE_BYTES = 8 * 1024 * 1024;
    private static final long TARGET_MAX_OUTPUT_BYTES = 66_000_000L;
    private static final int AUDIO_BITRATE = 96_000;
    private static final int MIN_VIDEO_BITRATE = 64_000;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private PluginCall activeCall;
    private Transformer activeTransformer;
    private File activeOutput;
    private final ProgressHolder progressHolder = new ProgressHolder();
    private final Runnable progressPoll = new Runnable() {
        @Override
        public void run() {
            Transformer current = activeTransformer;
            if (current == null) return;
            int state = current.getProgress(progressHolder);
            if (state == Transformer.PROGRESS_STATE_AVAILABLE) {
                notifyProgress(Math.min(99, progressHolder.progress));
            }
            if (activeTransformer != null) {
                mainHandler.postDelayed(this, 500);
            }
        }
    };

    @PluginMethod
    public void pickAndOptimize(PluginCall call) {
        if (activeCall != null) {
            call.reject("Another video is already being prepared.");
            return;
        }
        activeCall = call;
        String permissionAlias = videoPermissionAlias();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
                getPermissionState(permissionAlias) == PermissionState.GRANTED) {
            openVideoPicker(call);
            return;
        }
        requestPermissionForAlias(
                permissionAlias,
                call,
                "videoLibraryPermissionResult"
        );
    }

    @PermissionCallback
    private void videoLibraryPermissionResult(PluginCall call) {
        if (call == null || activeCall != call) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                getPermissionState(videoPermissionAlias()) != PermissionState.GRANTED) {
            failOptimization(call, "Video library access was not granted.", null);
            return;
        }
        openVideoPicker(call);
    }

    private String videoPermissionAlias() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                ? "videos"
                : "legacyStorage";
    }

    private void openVideoPicker(PluginCall call) {
        Intent galleryPicker = new Intent(Intent.ACTION_PICK);
        galleryPicker.setDataAndType(
                MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
                "video/*"
        );
        galleryPicker.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        if (tryOpenPicker(call, galleryPicker)) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            Intent systemPhotoPicker = new Intent(MediaStore.ACTION_PICK_IMAGES);
            systemPhotoPicker.setType("video/*");
            systemPhotoPicker.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            if (tryOpenPicker(call, systemPhotoPicker)) return;
        }

        Intent videoContentPicker = new Intent(Intent.ACTION_GET_CONTENT);
        videoContentPicker.addCategory(Intent.CATEGORY_OPENABLE);
        videoContentPicker.setType("video/*");
        videoContentPicker.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        if (tryOpenPicker(call, videoContentPicker)) return;

        failOptimization(call, "No video gallery is available on this device.", null);
    }

    private boolean tryOpenPicker(PluginCall call, Intent intent) {
        if (intent.resolveActivity(getContext().getPackageManager()) == null) return false;
        try {
            startActivityForResult(call, intent, "onVideoPicked");
            return true;
        } catch (ActivityNotFoundException | IllegalArgumentException error) {
            return false;
        }
    }

    @ActivityCallback
    private void onVideoPicked(PluginCall call, ActivityResult result) {
        if (call == null || activeCall != call) return;
        if (result == null || result.getResultCode() != Activity.RESULT_OK ||
                result.getData() == null || result.getData().getData() == null) {
            activeCall = null;
            JSObject response = new JSObject();
            response.put("cancelled", true);
            call.resolve(response);
            return;
        }

        Uri input = result.getData().getData();
        try {
            startOptimization(call, input);
        } catch (Exception error) {
            failOptimization(call, "Could not prepare this video for upload.", error);
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        PluginCall pending = activeCall;
        Transformer transformer = activeTransformer;
        File output = activeOutput;
        activeCall = null;
        activeTransformer = null;
        activeOutput = null;
        mainHandler.removeCallbacks(progressPoll);
        if (transformer != null) {
            try {
                transformer.cancel();
            } catch (Exception ignored) {
                // The export may already be completing.
            }
        }
        if (output != null) output.delete();
        if (pending != null) pending.reject("Video optimization was cancelled.");
        call.resolve();
    }

    @PluginMethod
    public void deleteOutput(PluginCall call) {
        String path = call.getString("path");
        if (path == null || !deleteOwnedOutput(path)) {
            call.reject("The temporary optimized video could not be removed.");
            return;
        }
        call.resolve();
    }

    private void startOptimization(PluginCall call, Uri input) throws Exception {
        MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        int width;
        int height;
        int rotation;
        long durationMs;
        try {
            retriever.setDataSource(getContext(), input);
            width = parseMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH);
            height = parseMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT);
            rotation = parseMetadata(retriever, MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION);
            durationMs = parseMetadataLong(retriever, MediaMetadataRetriever.METADATA_KEY_DURATION);
        } finally {
            retriever.release();
        }
        if (width <= 0 || height <= 0 || durationMs <= 0) {
            throw new IOException("Video dimensions or duration are unavailable.");
        }

        if (rotation == 90 || rotation == 270) {
            int swap = width;
            width = height;
            height = swap;
        }
        double scale = Math.min(1d, (double) MAX_SHORT_SIDE / Math.min(width, height));
        int outputWidth = even((int) Math.floor(width * scale));
        int outputHeight = even((int) Math.floor(height * scale));
        int targetBitrate = targetVideoBitrate(Math.min(width, height), durationMs);

        File cacheDir = getContext().getCacheDir();
        long estimatedOutputBytes =
                (durationMs * ((long) targetBitrate + AUDIO_BITRATE) / 8_000L * 115L / 100L)
                        + MP4_FRONT_METADATA_RESERVE_BYTES;
        if (cacheDir.getUsableSpace() < estimatedOutputBytes) {
            throw new IOException("There is not enough free device storage to optimize this video.");
        }
        File output = new File(cacheDir, "yw-optimized-" + System.currentTimeMillis() + ".mp4");
        output.delete();
        activeOutput = output;

        VideoEncoderSettings videoSettings = new VideoEncoderSettings.Builder()
                .setBitrate(targetBitrate)
                .setiFrameIntervalSeconds(2f)
                .build();
        DefaultEncoderFactory encoderFactory = new DefaultEncoderFactory.Builder(getContext())
                .setRequestedVideoEncoderSettings(videoSettings)
                .setEnableFallback(true)
                .build();

        Transformer transformer = new Transformer.Builder(getContext())
                .setVideoMimeType(MimeTypes.VIDEO_H264)
                .setAudioMimeType(MimeTypes.AUDIO_AAC)
                .setEncoderFactory(encoderFactory)
                .setMuxerFactory(fastStartMuxerFactory())
                .addListener(new Transformer.Listener() {
                    @Override
                    public void onCompleted(Composition composition, ExportResult exportResult) {
                        completeOptimization(call, output, outputWidth, outputHeight, durationMs);
                    }

                    @Override
                    public void onError(
                            Composition composition,
                            ExportResult exportResult,
                            ExportException exportException
                    ) {
                        failOptimization(call, "Video optimization failed.",
                                exportException);
                    }
                })
                .build();
        activeTransformer = transformer;
        EditedMediaItem edited = new EditedMediaItem.Builder(MediaItem.fromUri(input))
                .setEffects(new Effects(
                        Collections.emptyList(),
                        Collections.singletonList(Presentation.createForWidthAndHeight(
                                outputWidth,
                                outputHeight,
                                Presentation.LAYOUT_SCALE_TO_FIT
                        ))
                ))
                .build();
        transformer.start(edited, output.getAbsolutePath());
        notifyProgress(0);
        mainHandler.post(progressPoll);
    }

    private Muxer.Factory fastStartMuxerFactory() {
        DefaultMuxer.Factory supportedTypes = new DefaultMuxer.Factory();
        return new Muxer.Factory() {
            @Override
            public Muxer create(String path) throws MuxerException {
                try {
                    return new Mp4Muxer.Builder(new FileOutputStream(path))
                            .setAttemptStreamableOutputEnabled(true)
                            .experimentalSetFreeSpaceAfterFileTypeBox(
                                    MP4_FRONT_METADATA_RESERVE_BYTES
                            )
                            .build();
                } catch (IOException error) {
                    throw new MuxerException("Could not create the optimized MP4 file.", error);
                }
            }

            @Override
            public com.google.common.collect.ImmutableList<String> getSupportedSampleMimeTypes(
                    @C.TrackType int trackType
            ) {
                return supportedTypes.getSupportedSampleMimeTypes(trackType);
            }
        };
    }

    private void completeOptimization(
            PluginCall call,
            File output,
            int width,
            int height,
            long durationMs
    ) {
        if (activeCall != call) {
            output.delete();
            return;
        }
        mainHandler.removeCallbacks(progressPoll);
        if (!output.isFile() || output.length() <= 0 || !hasFastStartLayout(output)) {
            failOptimization(call, "Could not produce a fast-start MP4 for this video.", null);
            return;
        }
        activeCall = null;
        activeTransformer = null;
        activeOutput = null;
        notifyProgress(100);
        JSObject response = new JSObject();
        response.put("cancelled", false);
        response.put("path", output.getAbsolutePath());
        response.put("fileName", "yourworld-video-" + System.currentTimeMillis() + ".mp4");
        response.put("size", output.length());
        response.put("width", width);
        response.put("height", height);
        response.put("durationSeconds", durationMs / 1000d);
        call.resolve(response);
    }

    private void failOptimization(PluginCall call, String message, @Nullable Throwable error) {
        if (activeCall != call) return;
        mainHandler.removeCallbacks(progressPoll);
        File output = activeOutput;
        activeCall = null;
        activeTransformer = null;
        activeOutput = null;
        if (output != null) output.delete();
        if (error == null) call.reject(message);
        else call.reject(
                message,
                error instanceof Exception ? (Exception) error : new Exception(error)
        );
    }

    private void notifyProgress(int percent) {
        JSObject event = new JSObject();
        event.put("progress", Math.max(0, Math.min(100, percent)));
        notifyListeners("optimizationProgress", event);
    }

    private boolean deleteOwnedOutput(String path) {
        try {
            File cache = getContext().getCacheDir().getCanonicalFile();
            File output = new File(path).getCanonicalFile();
            return output.getParentFile() != null &&
                    output.getParentFile().equals(cache) &&
                    output.getName().startsWith("yw-optimized-") &&
                    (!output.exists() || output.delete());
        } catch (IOException error) {
            return false;
        }
    }

    private static int targetVideoBitrate(int shortSide, long durationMs) {
        int qualityCeiling = shortSide >= 1080 ? 4_200_000 : 2_500_000;
        long mediaBytes = Math.max(
                1L,
                TARGET_MAX_OUTPUT_BYTES - MP4_FRONT_METADATA_RESERVE_BYTES
        );
        long totalBitrateBudget = (mediaBytes * 8_000L) / durationMs;
        long videoBitrateBudget = totalBitrateBudget - AUDIO_BITRATE;
        return (int) Math.max(
                MIN_VIDEO_BITRATE,
                Math.min((long) qualityCeiling, videoBitrateBudget)
        );
    }

    private static int parseMetadata(MediaMetadataRetriever retriever, int key) {
        try {
            String value = retriever.extractMetadata(key);
            return value == null ? 0 : Integer.parseInt(value);
        } catch (Exception ignored) {
            return 0;
        }
    }

    private static long parseMetadataLong(MediaMetadataRetriever retriever, int key) {
        try {
            String value = retriever.extractMetadata(key);
            return value == null ? 0L : Long.parseLong(value);
        } catch (Exception ignored) {
            return 0L;
        }
    }

    private static int even(int value) {
        return Math.max(2, value - (value % 2));
    }

    private static boolean hasFastStartLayout(File file) {
        try (RandomAccessFile input = new RandomAccessFile(file, "r")) {
            long position = 0;
            long length = input.length();
            boolean mediaDataSeen = false;
            int scanned = 0;
            while (position + 8 <= length && scanned < 16 * 1024 * 1024) {
                input.seek(position);
                long boxSize = Integer.toUnsignedLong(input.readInt());
                int type = input.readInt();
                boolean extendedSize = boxSize == 1;
                if (extendedSize) {
                    boxSize = input.readLong();
                    position += 16;
                } else {
                    position += 8;
                }
                long headerSize = extendedSize ? 16 : 8;
                if (boxSize <= 0 || position - headerSize + boxSize > length) {
                    return false;
                }
                if (type == 0x6d646174) mediaDataSeen = true; // mdat
                if (type == 0x6d6f6f76) return !mediaDataSeen; // moov
                long advance = boxSize - headerSize;
                if (advance <= 0) return false;
                position += advance;
                scanned += (int) Math.min(Integer.MAX_VALUE, boxSize);
            }
            return false;
        } catch (IOException error) {
            return false;
        }
    }
}