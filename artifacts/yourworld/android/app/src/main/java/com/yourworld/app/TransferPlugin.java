package com.yourworld.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.util.Base64;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;

@CapacitorPlugin(name = "Transfer")
public class TransferPlugin extends Plugin {
    private BroadcastReceiver receiver;

    @Override
    public void load() {
        receiver = new BroadcastReceiver() {
            @Override public void onReceive(Context context, Intent intent) {
                if (!"com.yourworld.TRANSFER_PROGRESS".equals(intent.getAction())) return;
                JSObject event = new JSObject();
                String payload = intent.getStringExtra("payload");
                try { if (payload != null) event = JSObject.fromJSONObject(new JSONObject(payload)); }
                catch (Exception ignored) { return; }
                notifyListeners("transferProgress", event);
            }
        };
        ContextCompat.registerReceiver(getContext(), receiver,
                new IntentFilter("com.yourworld.TRANSFER_PROGRESS"), ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    @Override
    protected void handleOnDestroy() {
        if (receiver != null) getContext().unregisterReceiver(receiver);
        super.handleOnDestroy();
    }

    @PluginMethod public void beginUpload(PluginCall call) {
        String id = call.getString("id"), name = call.getString("fileName");
        if (id == null || name == null) { call.reject("id and fileName are required"); return; }
        File dir = new File(getContext().getFilesDir(), "transfers/uploads");
        if (!dir.exists() && !dir.mkdirs()) { call.reject("Could not create upload staging directory"); return; }
        File file = new File(dir, safe(id) + "-" + safe(name));
        try {
            FileOutputStream truncate = new FileOutputStream(file, false);
            truncate.close();
            call.resolve();
        }
        catch (Exception e) { call.reject("Could not create upload staging file", e); }
    }

    @PluginMethod public void appendUploadChunk(PluginCall call) {
        String id = call.getString("id"), encoded = call.getString("base64");
        if (id == null || encoded == null) { call.reject("id and base64 are required"); return; }
        try {
            File file = TransferService.findStagingFile(getContext(), id);
            if (file == null) { call.reject("Upload staging file was not found"); return; }
            java.io.FileOutputStream out = new java.io.FileOutputStream(file, true);
            out.write(Base64.decode(encoded, Base64.DEFAULT)); out.close(); call.resolve();
        } catch (Exception e) { call.reject("Could not append upload chunk", e); }
    }

    @PluginMethod public void enqueueUpload(PluginCall call) {
        String[] required = {"id","endpoint","token","apiKey","bucket","path","contentType","cacheControl"};
        for (String key : required) if (call.getString(key) == null) { call.reject(key + " is required"); return; }
        Intent i = new Intent(getContext(), TransferService.class).setAction(TransferService.ACTION_UPLOAD);
        copy(call, i, required); i.putExtra("totalBytes", call.getLong("totalBytes", 0L));
        ContextCompat.startForegroundService(getContext(), i); call.resolve();
    }

    @PluginMethod public void enqueueDownload(PluginCall call) {
        String[] required = {"id","url","fileName","title"};
        for (String key : required) if (call.getString(key) == null) { call.reject(key + " is required"); return; }
        Intent i = new Intent(getContext(), TransferService.class).setAction(TransferService.ACTION_DOWNLOAD);
        copy(call, i, required); i.putExtra("totalBytes", call.getLong("totalBytes", 0L));
        Object metadata = call.getData().opt("metadata");
        if (metadata != null) i.putExtra("metadata", String.valueOf(metadata));
        ContextCompat.startForegroundService(getContext(), i); call.resolve();
    }

    @PluginMethod public void discardUpload(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.trim().isEmpty()) { call.reject("id is required"); return; }
        try { TransferService.discardUpload(getContext(), id); call.resolve(); }
        catch (Exception e) { call.reject("Could not discard upload staging data", e); }
    }

    @PluginMethod public void getTransfers(PluginCall call) {
        call.resolve(TransferService.snapshots(getContext()));
    }

    @PluginMethod public void getDownloadUri(PluginCall call) {
        String relative = call.getString("relativePath");
        try { call.resolve(new JSObject().put("uri", TransferService.downloadUri(getContext(), relative).toString())); }
        catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod public void deleteDownload(PluginCall call) {
        try { TransferService.deleteDownload(getContext(), call.getString("relativePath")); call.resolve(); }
        catch (Exception e) { call.reject(e.getMessage()); }
    }

    private static void copy(PluginCall c, Intent i, String[] keys) {
        for (String k : keys) i.putExtra(k, c.getString(k));
    }
    private static String safe(String s) { return s.replaceAll("[^a-zA-Z0-9._-]", "_"); }
}