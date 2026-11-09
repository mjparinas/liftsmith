package com.liftsmith.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

/**
 * The voice coach (src/lib/voice.ts): spoken cues through the system TextToSpeech engine. Music is lowered
 * (transient audio focus with ducking) while it talks, then comes back. WorkoutService also calls speak() for
 * the rest-over cue, so it's heard with the screen locked. iOS counterpart: VoiceCoachPlugin in
 * ios/App/App/DelightPlugins.swift.
 */
@CapacitorPlugin(name = "VoiceCoach")
public class VoiceCoachPlugin extends Plugin {

    private static TextToSpeech tts;
    private static boolean ready = false;
    private static String pending;
    private static AudioFocusRequest focus;

    @PluginMethod
    public void speak(PluginCall call) {
        speak(getContext(), call.getString("text", ""), call.getFloat("rate", 1f));
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) tts.stop();
        release(getContext());
        call.resolve();
    }

    static synchronized void speak(Context ctx, String text, float rate) {
        if (text == null || text.isEmpty()) return;
        final Context app = ctx.getApplicationContext();
        if (tts == null) {
            pending = text;
            tts = new TextToSpeech(app, status -> {
                synchronized (VoiceCoachPlugin.class) {
                    ready = status == TextToSpeech.SUCCESS;
                    if (!ready) return;
                    tts.setLanguage(Locale.getDefault());
                    tts.setAudioAttributes(attrs());
                    tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                        @Override public void onStart(String id) {}
                        @Override public void onDone(String id) { release(app); }
                        @Override public void onError(String id) { release(app); }
                    });
                    if (pending != null) say(app, pending, 1f);
                    pending = null;
                }
            });
            return;
        }
        if (!ready) {
            pending = text;
            return;
        }
        tts.setSpeechRate(rate);
        say(app, text, rate);
    }

    private static AudioAttributes attrs() {
        return new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build();
    }

    private static void say(Context ctx, String text, float rate) {
        AudioManager am = ctx.getSystemService(AudioManager.class);
        if (am != null) {
            focus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK).setAudioAttributes(attrs()).build();
            am.requestAudioFocus(focus);
        }
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, new Bundle(), "cue");
    }

    private static void release(Context ctx) {
        AudioManager am = ctx.getSystemService(AudioManager.class);
        if (am != null && focus != null) am.abandonAudioFocusRequest(focus);
        focus = null;
    }
}
