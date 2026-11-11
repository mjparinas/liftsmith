package com.getliftsmith.app;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * The live workout notification (src/lib/sessionNotify.ts calls it). It keeps WorkoutService running in the
 * foreground with an ongoing notification: a live rest countdown on the lock screen, the next set and its plates,
 * heart rate, and Log set / +30 s buttons. Button taps come back to the web app as "action" events. The same
 * workout goes to a Wear OS watch (WatchLink), whose taps come back the same way and whose heart rate arrives as
 * "heartRate" events.
 * iOS counterpart: ios/App/App/WorkoutSessionPlugin.swift.
 */
@CapacitorPlugin(name = "WorkoutSession", permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) })
public class WorkoutSessionPlugin extends Plugin {

    private BroadcastReceiver receiver;
    private BroadcastReceiver watchHr;

    @Override
    public void load() {
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                JSObject data = new JSObject();
                data.put("action", intent.getStringExtra(WorkoutService.EXTRA_ACTION));
                notifyListeners("action", data, true);
            }
        };
        ContextCompat.registerReceiver(getContext(), receiver, new IntentFilter(WorkoutService.BROADCAST_ACTION), ContextCompat.RECEIVER_NOT_EXPORTED);
        // Heart rate from the Wear OS app's sensor (WatchListenerService).
        watchHr = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                JSObject data = new JSObject();
                data.put("bpm", intent.getIntExtra(WatchListenerService.EXTRA_BPM, 0));
                notifyListeners("heartRate", data);
            }
        };
        ContextCompat.registerReceiver(getContext(), watchHr, new IntentFilter(WatchListenerService.BROADCAST_HR), ContextCompat.RECEIVER_NOT_EXPORTED);
        // A shortcut that cold-started the app. The event is kept until the web app listens for it.
        if (getActivity() != null && deliver(getActivity().getIntent())) getActivity().setIntent(new Intent(Intent.ACTION_MAIN));
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        deliver(intent);
    }

    /** Shortcut links: liftsmith://start, liftsmith://log, liftsmith://add30. Anything else is ignored. */
    static String shortcutAction(Uri uri) {
        if (uri == null || !"liftsmith".equals(uri.getScheme())) return null;
        String a = uri.getHost();
        return "start".equals(a) || "log".equals(a) || "add30".equals(a) ? a : null;
    }

    private boolean deliver(Intent intent) {
        String a = intent == null ? null : shortcutAction(intent.getData());
        if (a == null) return false;
        JSObject data = new JSObject();
        data.put("action", a);
        notifyListeners("action", data, true);
        return true;
    }

    @Override
    protected void handleOnDestroy() {
        if (receiver != null) getContext().unregisterReceiver(receiver);
        if (watchHr != null) getContext().unregisterReceiver(watchHr);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("granted", true);
            call.resolve(r);
            return;
        }
        requestPermissionForAlias("notifications", call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", getPermissionState("notifications") == PermissionState.GRANTED);
        call.resolve(r);
    }

    @PluginMethod
    public void update(PluginCall call) {
        Intent i = new Intent(getContext(), WorkoutService.class);
        i.setAction(WorkoutService.ACTION_UPDATE);
        i.putExtra("title", call.getString("title", "Workout"));
        i.putExtra("setLabel", call.getString("setLabel", ""));
        i.putExtra("next", call.getString("next", ""));
        i.putExtra("plates", call.getString("plates", ""));
        Double restUntil = call.getDouble("restUntil");
        i.putExtra("restUntil", restUntil == null ? 0L : restUntil.longValue());
        // The whole rest in seconds (+30 s included), for the rest bar in the notification.
        i.putExtra("restTotal", (long) call.getInt("restTotal", 0));
        Integer hr = call.getInt("hr");
        i.putExtra("hr", hr == null ? 0 : hr);
        i.putExtra("sound", call.getBoolean("sound", true));
        i.putExtra("vibrate", call.getBoolean("vibrate", true));
        i.putExtra("speak", call.getString("speak", ""));
        i.putExtra("speakLang", call.getString("speakLang", ""));
        i.putExtra("chip", call.getString("chip", ""));
        i.putExtra("done", call.getInt("done", 0));
        i.putExtra("total", call.getInt("total", 0));
        ContextCompat.startForegroundService(getContext(), i);
        // The same workout on a Wear OS watch (WatchLink, android/wear).
        WatchLink.update(getContext(), call.getData());
        // And on a Garmin watch (GarminLink, garmin/).
        GarminLink.update(getContext(), call.getData());
        call.resolve();
    }

    /** The home-screen widget's snapshot (src/lib/widget.ts), drawn by WorkoutWidget. */
    @PluginMethod
    public void setWidget(PluginCall call) {
        String json = call.getString("json");
        if (json != null) WorkoutWidget.save(getContext(), json);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), WorkoutService.class));
        WatchLink.stop(getContext());
        GarminLink.stop(getContext());
        call.resolve();
    }
}
