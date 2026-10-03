package com.yourworld.app;

import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "OfflineMediaDownload")
public class OfflineMediaDownloadPlugin extends Plugin {
    private static final int RANGE_PARTS = 4;
    private static final int CONNECT_TIMEOUT_MS = 25_000;
    private static final int READ_TIMEOUT_MS = 60_000;
    private static final int BUFFER_BYTES = 64 * 1024;
    private static final Pattern CONTENT_RANGE =
            Pattern.compile("^bytes (\\d+)-(\\d+)/(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void download(PluginCall call) {
        String sourceUrl = call.getString("url");
        String relativePath = call.getString("path");
        String transferId = call.getString("transferId");
        if (sourceUrl == null || relativePath == null || transferId == null) {
            call.reject("The video URL, file path, and transfer ID are required.");
            return;
        }
        try {
            URL parsedUrl = new URL(sourceUrl);
            if (!"https".equalsIgnoreCase(parsedUrl.getProtocol())) {
                call.reject("Offline videos must be downloaded over HTTPS.");
                return;
            }
            resolveTarget(relativePath);
        } catch (Exception error) {
            call.reject("The offline video path or URL is invalid.", error);
            return;
        }

        executor.execute(() -> {
            try {
                File target = resolveTarget(relativePath);
                long size = downloadToFile(sourceUrl, target, transferId);
                JSObject result = new JSObject();
                result.put("sizeBytes", size);
                call.resolve(result);
            } catch (Exception error) {
                call.reject(
                        error.getMessage() == null
                                ? "The offline video could not be downloaded."
                                : error.getMessage(),
                        error
                );
            }
        });
    }

    private File resolveTarget(String relativePath) throws Exception {
        if (!relativePath.startsWith("device_offline_videos/") ||
                relativePath.contains("\\") ||
                relativePath.contains("../") ||
                relativePath.endsWith("/..")) {
            throw new IllegalArgumentException("The offline video path is outside its data folder.");
        }
        File root = getContext().getFilesDir().getCanonicalFile();
        File target = new File(root, relativePath).getCanonicalFile();
        String rootPrefix = root.getPath() + File.separator;
        if (!target.getPath().startsWith(rootPrefix)) {
            throw new IllegalArgumentException("The offline video path is outside app storage.");
        }
        File parent = target.getParentFile();
        if (parent == null || (!parent.isDirectory() && !parent.mkdirs())) {
            throw new IllegalStateException("The offline video folder could not be created.");
        }
        return target;
    }

    private long downloadToFile(String sourceUrl, File target, String transferId) throws Exception {
        File temporary = new File(target.getParentFile(), target.getName() + ".download");
        deleteQuietly(temporary);
        Long totalBytes = probeRangeSupport(sourceUrl);
        if (totalBytes != null && totalBytes > 0) {
            List<File> parts = new ArrayList<>();
            try {
                downloadRanges(sourceUrl, target, transferId, totalBytes, parts);
                joinParts(parts, temporary, totalBytes);
                replaceFile(temporary, target);
                emitProgress(transferId, totalBytes, totalBytes, "complete");
                return totalBytes;
            } catch (Exception invalidRange) {
                for (File part : parts) deleteQuietly(part);
                deleteQuietly(temporary);
                emitProgress(transferId, 0, totalBytes, "fallback");
            }
        }

        long fullSize = downloadFullFile(sourceUrl, temporary, transferId, totalBytes);
        if (fullSize <= 0) {
            deleteQuietly(temporary);
            throw new IllegalStateException("The downloaded offline video is empty.");
        }
        replaceFile(temporary, target);
        emitProgress(transferId, fullSize, fullSize, "complete");
        return fullSize;
    }

    private Long probeRangeSupport(String sourceUrl) {
        HttpURLConnection connection = null;
        try {
            connection = openConnection(sourceUrl);
            connection.setRequestProperty("Range", "bytes=0-0");
            int status = connection.getResponseCode();
            if (status != HttpURLConnection.HTTP_PARTIAL) return null;

            Matcher match = CONTENT_RANGE.matcher(
                    valueOrEmpty(connection.getHeaderField("Content-Range")).trim()
            );
            if (!match.matches() ||
                    Long.parseLong(match.group(1)) != 0 ||
                    Long.parseLong(match.group(2)) != 0) {
                return null;
            }
            long total = Long.parseLong(match.group(3));
            if (total <= 0) return null;
            try (InputStream input = connection.getInputStream()) {
                return input.read() < 0 ? null : total;
            }
        } catch (Exception ignored) {
            return null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private void downloadRanges(
            String sourceUrl,
            File target,
            String transferId,
            long totalBytes,
            List<File> parts
    ) throws Exception {
        long chunkSize = Math.max(1, (totalBytes + RANGE_PARTS - 1) / RANGE_PARTS);
        List<RangeRequest> requests = new ArrayList<>();
        for (int index = 0; index < RANGE_PARTS; index++) {
            long start = index * chunkSize;
            if (start >= totalBytes) break;
            long end = Math.min(totalBytes - 1, start + chunkSize - 1);
            File part = new File(target.getParentFile(), target.getName() + ".part-" + index);
            deleteQuietly(part);
            parts.add(part);
            requests.add(new RangeRequest(start, end, part));
        }

        ExecutorService rangeExecutor = Executors.newFixedThreadPool(requests.size());
        AtomicLong downloaded = new AtomicLong(0);
        List<Future<Void>> futures = new ArrayList<>();
        try {
            for (RangeRequest request : requests) {
                futures.add(rangeExecutor.submit((Callable<Void>) () -> {
                    downloadRange(sourceUrl, request, totalBytes, transferId, downloaded);
                    return null;
                }));
            }
            Exception failure = null;
            for (Future<Void> future : futures) {
                try {
                    future.get();
                } catch (Exception error) {
                    if (failure == null) failure = error;
                }
            }
            if (failure != null) throw new IllegalStateException(
                    "A video byte range was missing or invalid.", failure
            );
        } finally {
            rangeExecutor.shutdownNow();
        }
    }

    private void downloadRange(
            String sourceUrl,
            RangeRequest range,
            long totalBytes,
            String transferId,
            AtomicLong downloaded
    ) throws Exception {
        HttpURLConnection connection = null;
        long expectedBytes = range.end - range.start + 1;
        try {
            connection = openConnection(sourceUrl);
            connection.setRequestProperty(
                    "Range",
                    "bytes=" + range.start + "-" + range.end
            );
            if (connection.getResponseCode() != HttpURLConnection.HTTP_PARTIAL) {
                throw new IllegalStateException("The server did not honor the video byte range.");
            }
            Matcher match = CONTENT_RANGE.matcher(
                    valueOrEmpty(connection.getHeaderField("Content-Range")).trim()
            );
            if (!match.matches() ||
                    Long.parseLong(match.group(1)) != range.start ||
                    Long.parseLong(match.group(2)) != range.end ||
                    Long.parseLong(match.group(3)) != totalBytes) {
                throw new IllegalStateException("The server returned an invalid video byte range.");
            }

            long received = 0;
            byte[] buffer = new byte[BUFFER_BYTES];
            try (
                    InputStream input = new BufferedInputStream(connection.getInputStream());
                    FileOutputStream fileOutput = new FileOutputStream(range.file);
                    BufferedOutputStream output = new BufferedOutputStream(fileOutput, BUFFER_BYTES)
            ) {
                int count;
                while ((count = input.read(buffer)) != -1) {
                    received += count;
                    if (received > expectedBytes) {
                        throw new IllegalStateException("The server sent extra bytes for a video range.");
                    }
                    output.write(buffer, 0, count);
                    long loaded = downloaded.addAndGet(count);
                    emitProgress(transferId, loaded, totalBytes, "ranges");
                }
            }
            if (received != expectedBytes || range.file.length() != expectedBytes) {
                throw new IllegalStateException("The video byte range was incomplete.");
            }
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private void joinParts(List<File> parts, File destination, long totalBytes) throws Exception {
        long written = 0;
        byte[] buffer = new byte[BUFFER_BYTES];
        try (FileOutputStream fileOutput = new FileOutputStream(destination);
             BufferedOutputStream output = new BufferedOutputStream(fileOutput, BUFFER_BYTES)) {
            for (File part : parts) {
                try (InputStream input = new BufferedInputStream(new FileInputStream(part))) {
                    int count;
                    while ((count = input.read(buffer)) != -1) {
                        output.write(buffer, 0, count);
                        written += count;
                    }
                }
            }
        }
        if (written != totalBytes || destination.length() != totalBytes) {
            throw new IllegalStateException("The completed video ranges did not match the source size.");
        }
        for (File part : parts) deleteQuietly(part);
    }

    private long downloadFullFile(
            String sourceUrl,
            File destination,
            String transferId,
            Long expectedBytes
    ) throws Exception {
        HttpURLConnection connection = null;
        try {
            connection = openConnection(sourceUrl);
            int status = connection.getResponseCode();
            if (status != HttpURLConnection.HTTP_OK) {
                throw new IllegalStateException("The video source rejected the full download.");
            }
            long declaredBytes = 0;
            try {
                declaredBytes = Long.parseLong(
                        valueOrEmpty(connection.getHeaderField("Content-Length")).trim()
                );
            } catch (NumberFormatException ignored) {
                // A chunked response can still be verified by the final file size.
            }
            long totalBytes = declaredBytes > 0
                    ? declaredBytes
                    : expectedBytes == null ? 0 : expectedBytes;
            long received = 0;
            byte[] buffer = new byte[BUFFER_BYTES];
            try (
                    InputStream input = new BufferedInputStream(connection.getInputStream());
                    FileOutputStream fileOutput = new FileOutputStream(destination);
                    BufferedOutputStream output = new BufferedOutputStream(fileOutput, BUFFER_BYTES)
            ) {
                int count;
                while ((count = input.read(buffer)) != -1) {
                    output.write(buffer, 0, count);
                    received += count;
                    emitProgress(transferId, received, totalBytes, "full-get");
                }
            }
            if (totalBytes > 0 && received != totalBytes) {
                throw new IllegalStateException("The full video download was incomplete.");
            }
            return received;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private HttpURLConnection openConnection(String sourceUrl) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(sourceUrl).openConnection();
        connection.setInstanceFollowRedirects(true);
        connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
        connection.setReadTimeout(READ_TIMEOUT_MS);
        connection.setRequestProperty("Accept-Encoding", "identity");
        connection.setRequestProperty("Cache-Control", "no-cache");
        return connection;
    }

    private void replaceFile(File temporary, File target) throws Exception {
        if (target.exists() && !target.delete()) {
            throw new IllegalStateException("The previous offline video could not be replaced.");
        }
        if (!temporary.renameTo(target)) {
            throw new IllegalStateException("The completed offline video could not be saved.");
        }
    }

    private void emitProgress(String transferId, long bytes, long total, String stage) {
        JSObject event = new JSObject();
        event.put("transferId", transferId);
        event.put("bytesTransferred", bytes);
        event.put("totalBytes", total);
        event.put("stage", stage);
        mainHandler.post(() -> notifyListeners("progress", event));
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private void deleteQuietly(File file) {
        if (file.exists()) file.delete();
    }

    private static final class RangeRequest {
        final long start;
        final long end;
        final File file;

        RangeRequest(long start, long end, File file) {
            this.start = start;
            this.end = end;
            this.file = file;
        }
    }
}