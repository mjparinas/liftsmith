package com.getliftsmith.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;
import java.util.Set;

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
        speak(getContext(), call.getString("text", ""), call.getFloat("rate", 1f), call.getString("lang", ""), call.getString("voiceId", ""));
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) tts.stop();
        release(getContext());
        call.resolve();
    }

    @PluginMethod
    public void voices(PluginCall call) {
        ensure(getContext(), () -> {
            JSArray list = new JSArray();
            if (tts != null) {
                Set<Voice> all = tts.getVoices();
                if (all != null) {
                    for (Voice v : all) {
                        JSObject o = new JSObject();
                        o.put("id", v.getName());
                        o.put("name", v.getName());
                        o.put("lang", v.getLocale() != null ? v.getLocale().toLanguageTag() : "");
                        list.put(o);
                    }
                }
            }
            JSObject r = new JSObject();
            r.put("voices", list);
            call.resolve(r);
        });
    }

    /** The app's language (a BCP 47 tag such as "es-MX"), which can differ from the phone's; empty means the phone's. */
    private static String lang = "";
    private static String voiceId = "";

    static synchronized void speak(Context ctx, String text, float rate, String language) {
        speak(ctx, text, rate, language, "");
    }

    static synchronized void speak(Context ctx, String text, float rate, String language, String voice) {
        if (text == null || text.isEmpty()) return;
        lang = language == null ? "" : language;
        voiceId = voice == null ? "" : voice;
        final Context app = ctx.getApplicationContext();
        if (tts == null) {
            pending = text;
            tts = new TextToSpeech(app, status -> {
                synchronized (VoiceCoachPlugin.class) {
                    ready = status == TextToSpeech.SUCCESS;
                    if (!ready) return;
                    applyVoice();
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
        applyVoice();
        say(app, text, rate);
    }

    private static void ensure(Context ctx, Runnable whenReady) {
        final Context app = ctx.getApplicationContext();
        if (tts != null && ready) {
            whenReady.run();
            return;
        }
        if (tts == null) {
            tts = new TextToSpeech(app, status -> {
                synchronized (VoiceCoachPlugin.class) {
                    ready = status == TextToSpeech.SUCCESS;
                    if (ready) whenReady.run();
                }
            });
            return;
        }
        whenReady.run();
    }

    private static void applyVoice() {
        if (tts == null) return;
        tts.setLanguage(locale());
        if (voiceId.isEmpty()) return;
        Set<Voice> all = tts.getVoices();
        if (all == null) return;
        for (Voice v : all) {
            if (voiceId.equals(v.getName())) {
                tts.setVoice(v);
                return;
            }
        }
    }

    /** The cue's language: the app's when it's set, else the phone's. */
    private static Locale locale() {
        return lang.isEmpty() ? Locale.getDefault() : Locale.forLanguageTag(lang);
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
