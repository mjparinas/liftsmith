package com.getliftsmith.app.wear;

import android.content.Context;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import com.google.android.gms.wearable.DataItem;
import com.google.android.gms.wearable.DataItemBuffer;
import com.google.android.gms.wearable.DataMapItem;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.Wearable;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * The watch app's one source of truth: the phone's workout (from the Data Layer), the heart rate the watch
 * measures, and the messages back to the phone. The screen and the workout service both listen to it.
 * Messages and paths match the phone's WatchLink.java and WatchListenerService.java.
 */
final class WatchHub {

    static final String PATH_WORKOUT = "/liftsmith/workout";
    static final String PATH_ACTION = "/liftsmith/action";
    static final String PATH_HR = "/liftsmith/hr";
    /** Wrist motion for watch rep counting (Labs), as MotionBatch packs it. */
    static final String PATH_MOTION = "/liftsmith/motion";
    /** Heart rate goes to the phone at most this often; the phone keeps about one reading a second. */
    static final long HR_SEND_MS = 2000;

    interface Listener {
        void changed();
    }

    private static final Handler main = new Handler(Looper.getMainLooper());
    private static final List<Listener> listeners = new CopyOnWriteArrayList<>();
    private static WorkoutState state;
    private static int bpm;
    private static long lastHrSent;
    private static Runnable restBuzz;
    private static Context appContext;
    /** One buzz as a phase of the set timer ends (posted once per phase; removeCallbacks cancels them all). */
    private static final Runnable timerBuzz = () -> {
        Vibrator v = appContext == null ? null : appContext.getSystemService(Vibrator.class);
        if (v != null) v.vibrate(VibrationEffect.createWaveform(new long[] { 0, 200, 120, 200 }, -1));
    };
    private static List<String> phones = new ArrayList<>();

    private WatchHub() {}

    static WorkoutState state() {
        WorkoutState s = state;
        return s == null || s.stale(System.currentTimeMillis()) ? null : s;
    }

    /** The watch's own reading, or 0. */
    static int bpm() {
        return bpm;
    }

    static void listen(Listener l) {
        listeners.add(l);
    }

    static void unlisten(Listener l) {
        listeners.remove(l);
    }

    /** Reads the phone's current workout (the app just opened, or came back). */
    static void refresh(Context context) {
        Context app = context.getApplicationContext();
        Uri uri = new Uri.Builder().scheme("wear").path(PATH_WORKOUT).build();
        Wearable.getDataClient(app).getDataItems(uri).addOnSuccessListener((DataItemBuffer items) -> {
            WorkoutState found = null;
            for (DataItem item : items) found = WorkoutState.parse(DataMapItem.fromDataItem(item).getDataMap().getString("json"));
            items.release();
            set(app, found);
        });
        findPhones(app);
    }

    /** A new workout state from the phone, or null when it ended. */
    static void set(Context context, WorkoutState next) {
        Context app = context.getApplicationContext();
        main.post(() -> {
            state = next;
            if (next == null) bpm = 0;
            appContext = app;
            scheduleBuzz(app, next);
            for (Listener l : listeners) l.changed();
        });
    }

    /** A reading from the watch's heart rate sensor (WorkoutService). */
    static void heartRate(Context context, int reading) {
        main.post(() -> {
            bpm = reading;
            for (Listener l : listeners) l.changed();
        });
        long now = System.currentTimeMillis();
        if (now - lastHrSent < HR_SEND_MS) return;
        lastHrSent = now;
        send(context.getApplicationContext(), PATH_HR, Integer.toString(reading));
    }

    /** Log set or +30 s, done on the phone exactly like the notification's buttons. */
    static void action(Context context, String action) {
        send(context.getApplicationContext(), PATH_ACTION, action);
    }

    /** A batch of wrist motion (MotionStream), counted into reps on the phone. */
    static void motion(Context context, String body) {
        send(context.getApplicationContext(), PATH_MOTION, body);
    }

    private static void send(Context app, String path, String body) {
        byte[] data = body.getBytes(StandardCharsets.UTF_8);
        if (phones.isEmpty()) {
            findPhones(app, () -> sendTo(app, path, data));
            return;
        }
        sendTo(app, path, data);
    }

    private static void sendTo(Context app, String path, byte[] data) {
        for (String id : phones) Wearable.getMessageClient(app).sendMessage(id, path, data);
    }

    private static void findPhones(Context app) {
        findPhones(app, () -> {});
    }

    private static void findPhones(Context app, Runnable then) {
        Wearable.getNodeClient(app).getConnectedNodes().addOnSuccessListener((List<Node> nodes) -> {
            List<String> ids = new ArrayList<>();
            for (Node n : nodes) ids.add(n.getId());
            phones = ids;
            then.run();
        });
    }

    /** A buzz on the wrist when rest ends, if the lifter's rest-over alert vibrates (Workout preferences). */
    private static void scheduleBuzz(Context app, WorkoutState s) {
        if (restBuzz != null) main.removeCallbacks(restBuzz);
        restBuzz = null;
        main.removeCallbacks(timerBuzz);
        long now = System.currentTimeMillis();
        // The set timer: a buzz as each phase ends (go, switch sides, time's up), felt with the phone in a bag.
        if (s != null && s.vibrate && !s.resting(now)) {
            for (WorkoutState.Phase p : s.timer) if (p.to > now) main.postDelayed(timerBuzz, p.to - now);
        }
        if (s == null || !s.vibrate || !s.resting(now)) return;
        restBuzz = () -> {
            Vibrator v = app.getSystemService(Vibrator.class);
            if (v != null) v.vibrate(VibrationEffect.createWaveform(new long[] { 0, 300, 150, 300 }, -1));
        };
        main.postDelayed(restBuzz, s.restUntil - now);
    }
}
