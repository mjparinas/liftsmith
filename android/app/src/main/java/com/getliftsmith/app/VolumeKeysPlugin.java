package com.getliftsmith.app;

import android.content.Context;
import android.database.ContentObserver;
import android.media.AudioManager;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.KeyEvent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Volume up logs a set (a lab, labVolumeLog; src/lib/volumeKeys.ts). Melvin picked the volume button over
 * play/pause on 2026-11-12, because play/pause belongs to the music app and would stop the music.
 *
 * While JS has it enabled and Liftsmith is on screen:
 * - the phone's own volume up key is taken by MainActivity.dispatchKeyEvent (see handleKey), so the volume
 *   never moves;
 * - earbuds and headphones change the media volume over Bluetooth without a key event reaching the app, so a
 *   ContentObserver watches the music volume, and a rise is a press: the volume goes straight back.
 * Volume down is left alone. Android doesn't let an app see volume keys while it's in the background, so
 * this stops in onPause and starts again in onResume. iOS counterpart: ios/App/App/VolumeKeysPlugin.swift.
 */
@CapacitorPlugin(name = "VolumeKeys")
public class VolumeKeysPlugin extends Plugin {

    private static VolumeKeysPlugin instance;
    private boolean enabled;
    private boolean watching;
    private int last = -1;
    private final Handler main = new Handler(Looper.getMainLooper());
    private ContentObserver observer;

    @Override
    public void load() {
        instance = this;
    }

    private AudioManager audio() {
        return (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    @PluginMethod
    public void enable(PluginCall call) {
        main.post(() -> {
            enabled = true;
            watch();
        });
        call.resolve();
    }

    @PluginMethod
    public void disable(PluginCall call) {
        main.post(() -> {
            enabled = false;
            unwatch();
        });
        call.resolve();
    }

    /** Called by MainActivity for every key event; true when the event was a press this plugin took. */
    static boolean handleKey(KeyEvent event) {
        VolumeKeysPlugin p = instance;
        if (p == null || !p.enabled || event.getKeyCode() != KeyEvent.KEYCODE_VOLUME_UP) return false;
        if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) p.press("phone");
        return true;
    }

    private void press(String from) {
        JSObject data = new JSObject();
        data.put("from", from);
        notifyListeners("press", data);
    }

    private void watch() {
        if (watching || !enabled) return;
        AudioManager a = audio();
        if (a == null) return;
        // At the top a press over Bluetooth can't raise the volume, so nothing would be seen: start one step down.
        int max = a.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
        if (a.getStreamVolume(AudioManager.STREAM_MUSIC) >= max && max > 0) a.setStreamVolume(AudioManager.STREAM_MUSIC, max - 1, 0);
        last = a.getStreamVolume(AudioManager.STREAM_MUSIC);
        observer = new ContentObserver(main) {
            @Override
            public void onChange(boolean selfChange) {
                AudioManager am = audio();
                if (am == null || !enabled) return;
                int now = am.getStreamVolume(AudioManager.STREAM_MUSIC);
                if (now > last) {
                    press("earbuds");
                    am.setStreamVolume(AudioManager.STREAM_MUSIC, last, 0);
                } else last = now;
            }
        };
        getContext().getContentResolver().registerContentObserver(Settings.System.CONTENT_URI, true, observer);
        watching = true;
    }

    private void unwatch() {
        if (!watching) return;
        if (observer != null) getContext().getContentResolver().unregisterContentObserver(observer);
        observer = null;
        watching = false;
    }

    @Override
    protected void handleOnPause() {
        unwatch();
    }

    @Override
    protected void handleOnResume() {
        if (enabled) watch();
    }

    @Override
    protected void handleOnDestroy() {
        unwatch();
        if (instance == this) instance = null;
    }
}
