package com.yourworld.app;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

@CapacitorPlugin(name = "CallAudioRouting")
public class CallAudioRoutingPlugin extends Plugin {
    private AudioManager audioManager;
    private int previousMode = AudioManager.MODE_NORMAL;
    private boolean previousSpeakerphoneOn;
    private AudioDeviceInfo previousCommunicationDevice;
    private boolean sessionActive;

    @PluginMethod
    public void start(PluginCall call) {
        String route = call.getString("route");
        if (!isValidRoute(route)) {
            call.reject("Audio route must be earpiece or speaker.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                beginSession(route);
                call.resolve();
            } catch (Exception error) {
                restoreAudioState();
                call.reject(error.getMessage() == null ? "Unable to route call audio." : error.getMessage());
            }
        });
    }

    @PluginMethod
    public void setRoute(PluginCall call) {
        String route = call.getString("route");
        if (!isValidRoute(route)) {
            call.reject("Audio route must be earpiece or speaker.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            boolean wasActive = sessionActive;
            try {
                beginSession(route);
                call.resolve();
            } catch (Exception error) {
                if (!wasActive) {
                    restoreAudioState();
                }
                call.reject(error.getMessage() == null ? "Unable to route call audio." : error.getMessage());
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            restoreAudioState();
            call.resolve();
        });
    }

    private void beginSession(String route) {
        if (audioManager == null) {
            audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        }
        if (audioManager == null) {
            throw new IllegalStateException("Android audio routing is unavailable.");
        }

        if (!sessionActive) {
            previousMode = audioManager.getMode();
            previousSpeakerphoneOn = audioManager.isSpeakerphoneOn();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                previousCommunicationDevice = audioManager.getCommunicationDevice();
            }
            sessionActive = true;
        }

        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        if (!applyRoute(route)) {
            throw new IllegalStateException("This device does not provide the requested " + route + " route.");
        }
    }

    private boolean applyRoute(String route) {
        boolean useSpeaker = "speaker".equals(route);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            int wantedType = useSpeaker
                ? AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
                : AudioDeviceInfo.TYPE_BUILTIN_EARPIECE;
            List<AudioDeviceInfo> devices = audioManager.getAvailableCommunicationDevices();
            for (AudioDeviceInfo device : devices) {
                if (device.getType() == wantedType) {
                    return audioManager.setCommunicationDevice(device);
                }
            }
            return false;
        }

        audioManager.setSpeakerphoneOn(useSpeaker);
        return true;
    }

    private void restoreAudioState() {
        if (!sessionActive || audioManager == null) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            audioManager.clearCommunicationDevice();
            if (previousCommunicationDevice != null) {
                audioManager.setCommunicationDevice(previousCommunicationDevice);
            } else {
                audioManager.setSpeakerphoneOn(previousSpeakerphoneOn);
            }
        } else {
            audioManager.setSpeakerphoneOn(previousSpeakerphoneOn);
        }
        audioManager.setMode(previousMode);
        previousCommunicationDevice = null;
        sessionActive = false;
    }

    private boolean isValidRoute(String route) {
        return "earpiece".equals(route) || "speaker".equals(route);
    }
}