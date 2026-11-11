package com.getliftsmith.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Handler;
import android.os.Looper;
import com.garmin.android.connectiq.ConnectIQ;
import com.garmin.android.connectiq.IQApp;
import com.garmin.android.connectiq.IQDevice;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Phone side of the Garmin watch app (garmin/, a Connect IQ app). Through Garmin's Connect IQ SDK, which talks to
 * the watch via the Garmin Connect app: the live workout goes to every paired Garmin watch (GarminMessages.state),
 * the watch app is asked to open when a workout starts (the watch asks the lifter first), and its Log set, +30 s and
 * heart rate come back as the same broadcasts the Wear OS app uses (WatchListenerService), so the web app can't
 * tell them apart. Nothing happens on phones without Garmin Connect. iOS counterpart: GarminLink.swift.
 */
final class GarminLink {

    /** The watch app's id (garmin/manifest.xml). */
    static final String APP_ID = "a818f48482054d7fa025f6b704934614";
    static final String GARMIN_CONNECT = "com.garmin.android.apps.connectmobile";

    interface StatusCallback {
        void done(JSONObject status);
    }

    private static ConnectIQ ciq;
    private static boolean ready;
    private static Context context;
    private static final List<Runnable> whenReady = new ArrayList<>();
    private static final Handler main = new Handler(Looper.getMainLooper());

    private static Map<String, Object> last;
    private static long lastAt;
    private static String launchedFor;

    private GarminLink() {}

    static boolean garminConnectInstalled(Context ctx) {
        try {
            ctx.getPackageManager().getPackageInfo(GARMIN_CONNECT, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    /** Starts the SDK once (it binds to Garmin Connect), then runs `then`. Does nothing without Garmin Connect. */
    private static void start(Context ctx, Runnable then) {
        if (ready) {
            then.run();
            return;
        }
        whenReady.add(then);
        if (ciq != null) return;
        context = ctx.getApplicationContext();
        if (!garminConnectInstalled(context)) {
            flush();
            return;
        }
        try {
            ciq = ConnectIQ.getInstance(context, ConnectIQ.IQConnectType.WIRELESS);
            ciq.initialize(context, false, new ConnectIQ.ConnectIQListener() {
                @Override
                public void onSdkReady() {
                    ready = true;
                    listen();
                    flush();
                }

                @Override
                public void onInitializeError(ConnectIQ.IQSdkErrorStatus status) {
                    ciq = null;
                    flush();
                }

                @Override
                public void onSdkShutDown() {
                    ready = false;
                    ciq = null;
                }
            });
        } catch (Exception e) {
            ciq = null;
            flush();
        }
    }

    private static void flush() {
        List<Runnable> run = new ArrayList<>(whenReady);
        whenReady.clear();
        for (Runnable r : run) r.run();
    }

    /** Log set, +30 s and heart rate from the watch, handled exactly like the Wear OS app's. */
    private static final ConnectIQ.IQApplicationEventListener incoming = (device, app, message, status) -> {
        if (status != ConnectIQ.IQMessageStatus.SUCCESS || context == null) return;
        String action = GarminMessages.action(message);
        if (action != null) {
            context.sendBroadcast(
                new Intent(WorkoutService.BROADCAST_ACTION).setPackage(context.getPackageName()).putExtra(WorkoutService.EXTRA_ACTION, action)
            );
        }
        int bpm = GarminMessages.bpm(message);
        if (bpm > 0) {
            context.sendBroadcast(
                new Intent(WatchListenerService.BROADCAST_HR).setPackage(context.getPackageName()).putExtra(WatchListenerService.EXTRA_BPM, bpm)
            );
        }
    };

    private static void listen() {
        try {
            // Garmin Connect delivers to our binding service (works on Android 14+ without a broadcast receiver).
            ciq.registerAppToUseBinderService(APP_ID);
            ciq.registerForAppEvents(incoming);
        } catch (Exception binderFailed) {
            try {
                for (IQDevice d : ciq.getKnownDevices()) ciq.registerForAppEvents(d, new IQApp(APP_ID), incoming);
            } catch (Exception ignored) {
                // Garmin Connect went away; the next update starts again.
            }
        }
    }

    private static List<IQDevice> connected() {
        List<IQDevice> out = new ArrayList<>();
        try {
            for (IQDevice d : ciq.getKnownDevices()) {
                if (ciq.getDeviceStatus(d) == IQDevice.IQDeviceStatus.CONNECTED) out.add(d);
            }
        } catch (Exception ignored) {
            // No devices.
        }
        return out;
    }

    private static void send(Map<String, Object> message) {
        for (IQDevice d : connected()) {
            try {
                ciq.sendMessage(d, new IQApp(APP_ID), message, (dev, app, status) -> {});
            } catch (Exception ignored) {
                // The watch dropped off; the next update tries again.
            }
        }
    }

    /** The workout as the watch shows it (WorkoutSession.update). */
    static void update(Context ctx, JSONObject state) {
        start(ctx, () -> {
            if (!ready) return;
            long now = System.currentTimeMillis();
            Map<String, Object> next = GarminMessages.state(state, now);
            if (GarminMessages.worthSending(last, next, now - lastAt)) {
                last = next;
                lastAt = now;
                send(next);
            }
            String session = state.optString("sessionId", "");
            if (!session.isEmpty() && !session.equals(launchedFor)) {
                launchedFor = session;
                for (IQDevice d : connected()) {
                    try {
                        ciq.openApplication(d, new IQApp(APP_ID), (dev, app, status) -> {});
                    } catch (Exception ignored) {
                        // Not installed on that watch.
                    }
                }
            }
        });
    }

    /** The workout ended. */
    static void stop(Context ctx) {
        launchedFor = null;
        last = null;
        if (ciq == null) return;
        start(ctx, () -> {
            if (ready) send(GarminMessages.end());
        });
    }

    /**
     * For Connected apps: {app: "missing" | "ready", devices: [{name, connected, installed}]}. Whether the watch
     * app is installed is asked of each watch; one that doesn't answer in 4 s counts as not installed.
     */
    static void status(Context ctx, StatusCallback cb) {
        start(ctx, () -> {
            JSONObject out = new JSONObject();
            JSONArray devices = new JSONArray();
            try {
                out.put("app", ready ? "ready" : "missing");
                out.put("devices", devices);
            } catch (Exception ignored) {
                // Can't happen with these values.
            }
            List<IQDevice> known = new ArrayList<>();
            if (ready) {
                try {
                    known.addAll(ciq.getKnownDevices());
                } catch (Exception ignored) {
                    // None.
                }
            }
            if (known.isEmpty()) {
                cb.done(out);
                return;
            }
            final int[] left = { known.size() };
            final boolean[] sent = { false };
            Runnable finish = () -> {
                if (sent[0]) return;
                sent[0] = true;
                cb.done(out);
            };
            for (IQDevice d : known) {
                JSONObject row = new JSONObject();
                try {
                    row.put("name", d.getFriendlyName());
                    row.put("connected", ciq.getDeviceStatus(d) == IQDevice.IQDeviceStatus.CONNECTED);
                    row.put("installed", false);
                    devices.put(row);
                    ciq.getApplicationInfo(APP_ID, d, new ConnectIQ.IQApplicationInfoListener() {
                        @Override
                        public void onApplicationInfoReceived(IQApp app) {
                            try {
                                row.put("installed", true);
                            } catch (Exception ignored) {
                                // Can't happen.
                            }
                            if (--left[0] == 0) main.post(finish);
                        }

                        @Override
                        public void onApplicationNotInstalled(String id) {
                            if (--left[0] == 0) main.post(finish);
                        }
                    });
                } catch (Exception e) {
                    if (--left[0] == 0) main.post(finish);
                }
            }
            main.postDelayed(finish, 4000);
        });
    }
}
