package com.getliftsmith.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.media.AudioPlaybackConfiguration;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.KeyEvent;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.List;

/**
 * Now playing (src/lib/nowPlaying.ts; docs/decisions/now-playing.md): play, pause and skip whatever music app
 * is playing, from Today and the workout screen. Melvin asked for it on 2026-11-13 in place of the mood
 * playlists, with a switch to turn it off.
 *
 * - With no permission at all, the buttons send the phone's own media keys (AudioManager.dispatchMediaKeyEvent),
 *   which Android hands to the app that last played, the same as a headset button; whether music is playing
 *   comes from AudioManager, and an AudioPlaybackCallback says when that changes.
 * - Once the lifter allows notification access (MediaListener), the plugin reads the active media sessions
 *   instead: the song, the artist and the app, and it controls that session directly.
 *
 * Only between watch() and unwatch(), which JS calls while the control is on screen, so nothing runs in the
 * background (docs/decisions/battery.md). iOS counterpart: ios/App/App/NowPlayingPlugin.swift.
 */
@CapacitorPlugin(name = "NowPlaying")
public class NowPlayingPlugin extends Plugin {

    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean watching;
    private MediaController current;
    private final MediaController.Callback sessionCallback = new MediaController.Callback() {
        @Override
        public void onPlaybackStateChanged(PlaybackState state) {
            emit();
        }

        @Override
        public void onMetadataChanged(MediaMetadata metadata) {
            emit();
        }

        @Override
        public void onSessionDestroyed() {
            emit();
        }
    };
    private final MediaSessionManager.OnActiveSessionsChangedListener sessionsChanged = (controllers) -> emit();
    private final AudioManager.AudioPlaybackCallback playbackCallback = new AudioManager.AudioPlaybackCallback() {
        @Override
        public void onPlaybackConfigChanged(List<AudioPlaybackConfiguration> configs) {
            // A short wait, so a skip (a moment of silence between songs) doesn't flash Play.
            main.removeCallbacks(emitLater);
            main.postDelayed(emitLater, 400);
        }
    };
    private final Runnable emitLater = this::emit;

    private AudioManager audio() {
        return (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    private MediaSessionManager sessions() {
        return (MediaSessionManager) getContext().getSystemService(Context.MEDIA_SESSION_SERVICE);
    }

    private ComponentName listener() {
        return new ComponentName(getContext(), MediaListener.class);
    }

    private boolean granted() {
        return NotificationManagerCompat.getEnabledListenerPackages(getContext()).contains(getContext().getPackageName());
    }

    /** The session to show: one that's playing, else the most recent one. Never our own. */
    private MediaController pick() {
        if (!granted()) return null;
        try {
            List<MediaController> list = sessions().getActiveSessions(listener());
            MediaController first = null;
            for (MediaController c : list) {
                if (getContext().getPackageName().equals(c.getPackageName())) continue;
                PlaybackState s = c.getPlaybackState();
                if (s != null && s.getState() == PlaybackState.STATE_PLAYING) return c;
                if (first == null) first = c;
            }
            return first;
        } catch (SecurityException e) {
            return null;
        }
    }

    private void follow(MediaController next) {
        if (current != null && next != null && current.getSessionToken().equals(next.getSessionToken())) return;
        if (current != null) current.unregisterCallback(sessionCallback);
        current = next;
        if (current != null) current.registerCallback(sessionCallback, main);
    }

    private JSObject snapshot() {
        JSObject out = new JSObject();
        MediaController c = pick();
        if (watching) follow(c);
        if (c != null) {
            JSObject now = new JSObject();
            PlaybackState s = c.getPlaybackState();
            now.put("playing", s != null && s.getState() == PlaybackState.STATE_PLAYING);
            MediaMetadata m = c.getMetadata();
            if (m != null) {
                String title = m.getString(MediaMetadata.METADATA_KEY_TITLE);
                String artist = m.getString(MediaMetadata.METADATA_KEY_ARTIST);
                if (title != null && !title.isEmpty()) now.put("title", title);
                if (artist != null && !artist.isEmpty()) now.put("artist", artist);
            }
            String app = appName(c.getPackageName());
            if (app != null) now.put("app", app);
            out.put("now", now);
        } else if (audio().isMusicActive()) {
            JSObject now = new JSObject();
            now.put("playing", true);
            out.put("now", now);
        } else {
            out.put("now", null);
        }
        out.put("granted", granted());
        return out;
    }

    private String appName(String pkg) {
        try {
            PackageManager pm = getContext().getPackageManager();
            ApplicationInfo info = pm.getApplicationInfo(pkg, 0);
            return pm.getApplicationLabel(info).toString();
        } catch (PackageManager.NameNotFoundException e) {
            return null;
        }
    }

    private void emit() {
        if (!watching) return;
        notifyListeners("change", snapshot());
    }

    @PluginMethod
    public void state(PluginCall call) {
        main.post(() -> call.resolve(snapshot()));
    }

    @PluginMethod
    public void watch(PluginCall call) {
        main.post(() -> {
            if (!watching) {
                watching = true;
                audio().registerAudioPlaybackCallback(playbackCallback, main);
                if (granted()) {
                    try {
                        sessions().addOnActiveSessionsChangedListener(sessionsChanged, listener(), main);
                    } catch (SecurityException ignored) {}
                }
            }
            call.resolve(snapshot());
        });
    }

    @PluginMethod
    public void unwatch(PluginCall call) {
        main.post(() -> {
            stop();
            call.resolve();
        });
    }

    private void stop() {
        if (!watching) return;
        watching = false;
        main.removeCallbacks(emitLater);
        audio().unregisterAudioPlaybackCallback(playbackCallback);
        try {
            sessions().removeOnActiveSessionsChangedListener(sessionsChanged);
        } catch (RuntimeException ignored) {}
        follow(null);
    }

    @PluginMethod
    public void control(PluginCall call) {
        String what = call.getString("do", "");
        main.post(() -> {
            MediaController c = pick();
            if (c != null) {
                MediaController.TransportControls t = c.getTransportControls();
                switch (what) {
                    case "play":
                        t.play();
                        break;
                    case "pause":
                        t.pause();
                        break;
                    case "next":
                        t.skipToNext();
                        break;
                    case "previous":
                        t.skipToPrevious();
                        break;
                    default:
                        break;
                }
            } else {
                int key;
                switch (what) {
                    case "play":
                        key = KeyEvent.KEYCODE_MEDIA_PLAY;
                        break;
                    case "pause":
                        key = KeyEvent.KEYCODE_MEDIA_PAUSE;
                        break;
                    case "next":
                        key = KeyEvent.KEYCODE_MEDIA_NEXT;
                        break;
                    case "previous":
                        key = KeyEvent.KEYCODE_MEDIA_PREVIOUS;
                        break;
                    default:
                        key = 0;
                        break;
                }
                if (key != 0) {
                    long t = SystemClock.uptimeMillis();
                    audio().dispatchMediaKeyEvent(new KeyEvent(t, t, KeyEvent.ACTION_DOWN, key, 0));
                    audio().dispatchMediaKeyEvent(new KeyEvent(t, t, KeyEvent.ACTION_UP, key, 0));
                }
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void access(PluginCall call) {
        JSObject out = new JSObject();
        out.put("granted", granted());
        out.put("canAsk", true);
        call.resolve(out);
    }

    /** Opens Android's notification access page (Liftsmith's own entry on Android 11+). JS checks again on return. */
    @PluginMethod
    public void askAccess(PluginCall call) {
        Intent intent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS);
            intent.putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, listener().flattenToString());
        } else {
            intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
        } catch (RuntimeException e) {
            Intent all = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            all.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(all);
        }
        JSObject out = new JSObject();
        out.put("granted", granted());
        out.put("canAsk", true);
        call.resolve(out);
    }

    @Override
    protected void handleOnDestroy() {
        stop();
    }
}
