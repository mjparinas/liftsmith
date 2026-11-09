package com.liftsmith.app;

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
 * heart rate, and Log set / +30 s buttons. Button taps come back to the web app as "action" events.
 * iOS counterpart: ios/App/App/WorkoutSessionPlugin.swift.
 */
@CapacitorPlugin(name = "WorkoutSession", permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) })
public class WorkoutSessionPlugin extends Plugin {

    private BroadcastReceiver receiver;

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
        Integer hr = call.getInt("hr");
        i.putExtra("hr", hr == null ? 0 : hr);
        i.putExtra("sound", call.getBoolean("sound", true));
        ContextCompat.startForegroundService(getContext(), i);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), WorkoutService.class));
        call.resolve();
    }
}
