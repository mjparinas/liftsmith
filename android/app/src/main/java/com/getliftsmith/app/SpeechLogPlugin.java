package com.getliftsmith.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

/**
 * Voice set logging (a lab; src/lib/speech.ts and voiceLog.ts): hears one utterance ("100 for 8", "too easy")
 * with the phone's on-device speech recognizer and hands back its guesses. On-device only, so the audio
 * never leaves the phone: Android 12+ with an on-device recognizer, otherwise "unavailable" (a recognizer
 * that might send audio to a server is never used). The microphone is asked for on first use.
 * iOS counterpart: ios/App/App/SpeechLogPlugin.swift.
 */
@CapacitorPlugin(name = "SpeechLog", permissions = { @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }) })
public class SpeechLogPlugin extends Plugin {

    private SpeechRecognizer recognizer;
    private PluginCall pending;
    private final Handler main = new Handler(Looper.getMainLooper());

    private boolean onDevice() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext());
    }

    @PluginMethod
    public void available(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", onDevice());
        call.resolve(r);
    }

    @PluginMethod
    public void listen(PluginCall call) {
        if (!onDevice()) {
            call.reject("No on-device recognizer", "unavailable");
            return;
        }
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "micCallback");
            return;
        }
        start(call);
    }

    @PermissionCallback
    private void micCallback(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("Microphone not allowed", "denied");
            return;
        }
        start(call);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        main.post(() -> {
            if (recognizer != null) recognizer.cancel();
            finish(null, "nomatch");
        });
        call.resolve();
    }

    private void start(PluginCall call) {
        main.post(() -> {
            finish(null, "nomatch");
            pending = call;
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return;
            recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext());
            recognizer.setRecognitionListener(new Listener());
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            String lang = call.getString("lang", "");
            if (lang != null && !lang.isEmpty()) intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
            intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // Nudges the recognizer toward the gym words ("reps", "too easy") it might otherwise mishear.
                try {
                    JSArray hints = call.getArray("hints", new JSArray());
                    ArrayList<String> list = new ArrayList<>();
                    for (int i = 0; i < hints.length(); i++) list.add(hints.getString(i));
                    intent.putStringArrayListExtra(RecognizerIntent.EXTRA_BIASING_STRINGS, list);
                } catch (Exception ignored) {}
            }
            try {
                recognizer.startListening(intent);
            } catch (Exception e) {
                finish(null, "error");
            }
        });
    }

    /** Resolves or rejects the waiting call (once) and lets the recognizer go. Main thread. */
    private void finish(ArrayList<String> results, String code) {
        PluginCall call = pending;
        pending = null;
        if (recognizer != null) {
            recognizer.destroy();
            recognizer = null;
        }
        if (call == null) return;
        if (results != null && !results.isEmpty()) {
            JSObject r = new JSObject();
            r.put("results", new JSArray(results));
            call.resolve(r);
        } else {
            call.reject("No speech", code);
        }
    }

    @Override
    protected void handleOnPause() {
        // The app went to the background: stop listening (nothing runs in the background, docs/decisions/battery.md).
        main.post(() -> finish(null, "nomatch"));
        super.handleOnPause();
    }

    private class Listener implements RecognitionListener {
        @Override public void onReadyForSpeech(Bundle params) {}
        @Override public void onBeginningOfSpeech() {}
        @Override public void onRmsChanged(float rmsdB) {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() {}
        @Override public void onPartialResults(Bundle partialResults) {}
        @Override public void onEvent(int eventType, Bundle params) {}

        @Override
        public void onError(int error) {
            String code =
                error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS
                    ? "denied"
                    : error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT
                        ? "nomatch"
                        : error == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED || error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE
                            ? "unavailable"
                            : "error";
            finish(null, code);
        }

        @Override
        public void onResults(Bundle results) {
            finish(results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION), "nomatch");
        }
    }
}
