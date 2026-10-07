package com.yourworld.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.util.UUID;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "DeviceFingerprint")
public class DeviceFingerprintPlugin extends Plugin {
    private static final String KEY_ALIAS = "yourworld_device_fingerprint_key_v1";
    private static final String PREFS_NAME = "yourworld_device_identity";
    private static final String VALUE_KEY = "encrypted_fingerprint";
    private static final String IV_KEY = "fingerprint_iv";

    @PluginMethod
    public synchronized void getFingerprint(PluginCall call) {
        try {
            JSObject result = new JSObject();
            result.put("fingerprint", loadOrCreateFingerprint());
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not read the secure device fingerprint.", error);
        }
    }

    private String loadOrCreateFingerprint() throws Exception {
        Context context = getContext();
        SharedPreferences preferences = context.getSharedPreferences(
                PREFS_NAME,
                Context.MODE_PRIVATE
        );
        String encrypted = preferences.getString(VALUE_KEY, null);
        String encodedIv = preferences.getString(IV_KEY, null);
        if (encrypted != null && encodedIv != null) {
            try {
                return decryptFingerprint(encrypted, encodedIv);
            } catch (Exception ignored) {
                // A lost/rotated Android Keystore key is repaired by deriving
                // the token again from Android ID and persisting it securely.
            }
        }

        String androidId = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ANDROID_ID
        );
        if (androidId == null || androidId.trim().isEmpty()) {
            androidId = UUID.randomUUID().toString();
        }
        String fingerprint = sha256(
                "yourworld-device-v1:" + context.getPackageName() + ":" + androidId
        );

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey());
        byte[] encryptedBytes = cipher.doFinal(fingerprint.getBytes(StandardCharsets.UTF_8));
        String nextEncrypted = Base64.encodeToString(encryptedBytes, Base64.NO_WRAP);
        String nextIv = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP);
        if (!preferences.edit()
                .putString(VALUE_KEY, nextEncrypted)
                .putString(IV_KEY, nextIv)
                .commit()) {
            throw new IllegalStateException("Secure device fingerprint could not be saved.");
        }
        return fingerprint;
    }

    private String decryptFingerprint(String encrypted, String encodedIv) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        byte[] iv = Base64.decode(encodedIv, Base64.NO_WRAP);
        cipher.init(
                Cipher.DECRYPT_MODE,
                getOrCreateKey(),
                new GCMParameterSpec(128, iv)
        );
        byte[] clear = cipher.doFinal(Base64.decode(encrypted, Base64.NO_WRAP));
        return new String(clear, StandardCharsets.UTF_8);
    }

    private SecretKey getOrCreateKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return (SecretKey) keyStore.getKey(KEY_ALIAS, null);
        }
        KeyGenerator keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                "AndroidKeyStore"
        );
        keyGenerator.init(
                new KeyGenParameterSpec.Builder(
                        KEY_ALIAS,
                        KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
                )
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setRandomizedEncryptionRequired(true)
                        .build()
        );
        return keyGenerator.generateKey();
    }

    private static String sha256(String value) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder result = new StringBuilder(digest.length * 2);
        for (byte item : digest) {
            result.append(String.format("%02x", item & 0xff));
        }
        return result.toString();
    }
}
