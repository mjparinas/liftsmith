package com.getliftsmith.app.wear;

import android.content.Context;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import com.google.android.gms.wearable.DataMap;
import com.google.android.gms.wearable.DataItem;
import com.google.android.gms.wearable.DataItemBuffer;
import com.google.android.gms.wearable.DataMapItem;
import com.google.android.gms.wearable.PutDataMapRequest;
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
    /** One buzz as a phase of the set timer ends (go, switch sides, time's up). */
    private static final Runnable timerBuzz = () -> buzz(new long[] { 0, 200, 120, 200 });
    /** A light tick on each of a phase's last three seconds, like the phone's beeps. */
    private static final Runnable timerTick = () -> buzz(new long[] { 0, 30 });
    /** Halfway through a hold of 20 s or more: a soft double tap, so the lifter knows without looking. */
    private static final Runnable timerHalf = () -> buzz(new long[] { 0, 60, 100, 60 });
    /** Every timer buzz is posted with this token, so one call cancels them all when the timer changes. */
    private static final Object TIMER = new Object();
    /** Holds this long or longer get the halfway tap. */
    static final long HALF_FROM_MS = 20_000L;
    /** Start timer tapped on this watch during a phone workout: the set it was for and when, until the phone's phases come. */
    private static String startedKey;
    private static long startedAt;
    /** Seconds before rest ends for the heads-up tap; the same as REST_WARN_S in the phone's src/lib/training.ts. */
    private static final long REST_WARN_MS = 10_000L;
    /** The heads-up before rest ends: a gentle double tap on the wrist, softer than the rest-over buzz. */
    private static final Runnable warnBuzz = () -> {
        Vibrator v = appContext == null ? null : appContext.getSystemService(Vibrator.class);
        if (v != null) v.vibrate(VibrationEffect.createWaveform(new long[] { 0, 40, 90, 40 }, -1));
    };
    private static List<String> phones = new ArrayList<>();
    private static PhoneLink.Status phoneStatus = PhoneLink.Status.CHECKING;
    private static String phoneNode;

    /** A workout running on the watch with the phone away (WatchRun), or null. It wins over the phone's on screen. */
    private static WatchRun run;
    private static boolean runLoaded;

    /** How far this watch's clock is from the phone's, learnt from each state the phone sends. */
    private static final WatchClock clock = new WatchClock();

    private WatchHub() {}

    private static long latestUpdate;

    static void receive(Context context, DataMap map, boolean live) {
        String json = map == null ? null : map.getString("json");
        WorkoutState parsed = WorkoutState.parse(json);
        long at = map == null ? 0 : map.getLong("at", parsed == null ? 0 : parsed.at);
        long arrived = System.currentTimeMillis();
        main.post(() -> {
            if (at > 0 && at < latestUpdate) return;
            // A retained item may have spent seconds in transit or minutes on the watch before refresh().
            // Only the direct message gives us a fresh clock sample.
            if (at > 0 && at == latestUpdate && !live) return;
            latestUpdate = at;
            long shift = clock.offsetFor(at, arrived, live && parsed != null);
            set(context, shift == 0 ? parsed : WorkoutState.parse(json, shift));
        });
    }

    static WorkoutState state() {
        WatchRun r = run;
        long now = System.currentTimeMillis();
        if (r != null) {
            // A hold run on the watch logs itself the moment its countdown runs out, as on the phone.
            if (r.timerRanOut(now) && appContext != null) {
                r.log(r.timerEnd(), null, null);
                CarryStore.saveRun(appContext, r);
                // The rest after it buzzes on time, and the screen moves on.
                localChanged(appContext);
            }
            return WorkoutState.parse(r.state(now));
        }
        WorkoutState s = state;
        return s == null || s.stale(now) ? null : s.withStarted(startedKey, startedAt);
    }

    /** Whether the workout on screen is the watch's own (no phone needed). */
    static boolean local() {
        return run != null;
    }

    /** Whether the run has logged every set it carried: only Finish is left. */
    static boolean localDone() {
        WatchRun r = run;
        return r != null && r.finishedAll();
    }

    /** Today's carried plan, if there's one for today the watch can run on its own. */
    static org.json.JSONObject carried(Context context) {
        return WatchRun.plan(CarryStore.rawCarry(context), CarryStore.today(System.currentTimeMillis()));
    }

    /** How many finished runs haven't reached the phone yet. */
    static int waiting(Context context) {
        return CarryStore.waiting(context).size();
    }

    /** Brings back a run the app was closed in the middle of; one forgotten for hours is finished as it stands. */
    private static void loadRun(Context app) {
        if (runLoaded) return;
        runLoaded = true;
        run = CarryStore.loadRun(app);
        if (run != null && run.forgotten(System.currentTimeMillis())) finishLocal(app);
    }

    /** Start on watch: today's carried plan, run here. */
    static void startLocal(Context context) {
        Context app = context.getApplicationContext();
        org.json.JSONObject c = carried(app);
        if (c == null || run != null) return;
        long now = System.currentTimeMillis();
        run = WatchRun.start(c, now, System.nanoTime());
        CarryStore.saveRun(app, run);
        localChanged(app);
    }

    /**
     * Finish: the run goes to the phone as a Data Layer item of its own, which waits on the watch until the phone is
     * near (phone at home, in a locker, off), and the screen goes back to idle. Nothing goes when no set was logged.
     */
    static void finishLocal(Context context) {
        Context app = context.getApplicationContext();
        WatchRun r = run;
        if (r == null) return;
        String result = r.result(System.currentTimeMillis());
        if (result != null) {
            try {
                PutDataMapRequest req = PutDataMapRequest.create(CarryStore.PATH_DONE + r.id);
                req.getDataMap().putString("json", result);
                Wearable.getDataClient(app).putDataItem(req.asPutDataRequest().setUrgent());
                CarryStore.addWaiting(app, r.id);
            } catch (Exception ignored) {
                // No Play services: nothing can reach the phone from this watch.
            }
        }
        run = null;
        CarryStore.saveRun(app, null);
        localChanged(app);
    }

    private static void localChanged(Context app) {
        appContext = app;
        main.post(() -> {
            scheduleBuzz(app, state());
            for (Listener l : listeners) l.changed();
        });
    }

    /** A tap on the watch's own run: logged here, kept, and the screen and buzzes follow. */
    private static void localAction(Context app, String action, org.json.JSONObject fields) {
        WatchRun r = run;
        if (r == null) return;
        long now = System.currentTimeMillis();
        Double kg = fields != null && fields.has("kg") ? fields.optDouble("kg") : null;
        Integer reps = fields != null && fields.has("reps") ? fields.optInt("reps") : null;
        switch (action) {
            case "log":
                r.log(now, kg, reps);
                break;
            case "adjust":
                r.adjust(kg, reps);
                break;
            case "add30":
                r.add30(now);
                break;
            case "rate":
                if (fields != null) r.rate(fields.optInt("v", 9));
                break;
            case "timer":
                r.startTimer(now);
                break;
            default:
                return;
        }
        CarryStore.saveRun(app, r);
        localChanged(app);
    }

    /** Today's carried plan from the phone (or null: taken off). */
    static void carry(Context context, String json) {
        CarryStore.saveCarry(context, json);
        main.post(() -> {
            for (Listener l : listeners) l.changed();
        });
    }

    /** The phone kept a finished run and deleted its item: it arrived. */
    static void arrived(Context context, String id) {
        CarryStore.arrived(context, id);
        main.post(() -> {
            for (Listener l : listeners) l.changed();
        });
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
        loadRun(app);
        // Today's carried plan, in case it came while the listener couldn't run.
        Uri carry = new Uri.Builder().scheme("wear").path(CarryStore.PATH_CARRY).build();
        Wearable.getDataClient(app).getDataItems(carry).addOnSuccessListener((DataItemBuffer items) -> {
            String json = null;
            for (DataItem item : items) json = DataMapItem.fromDataItem(item).getDataMap().getString("json");
            items.release();
            if (json != null && !json.equals(CarryStore.rawCarry(app))) carry(app, json);
        });
        Uri uri = new Uri.Builder().scheme("wear").path(PATH_WORKOUT).build();
        Wearable.getDataClient(app).getDataItems(uri).addOnSuccessListener((DataItemBuffer items) -> {
            DataMap found = null;
            for (DataItem item : items) found = DataMapItem.fromDataItem(item).getDataMap();
            items.release();
            if (found != null) receive(app, found, false);
        });
        // Today's call too, in case it came while the app wasn't installed or the listener missed it.
        Uri today = new Uri.Builder().scheme("wear").path(TodayStore.PATH_TODAY).build();
        Wearable.getDataClient(app).getDataItems(today).addOnSuccessListener((DataItemBuffer items) -> {
            String json = null;
            for (DataItem item : items) json = DataMapItem.fromDataItem(item).getDataMap().getString("json");
            items.release();
            if (json != null && !json.equals(TodayStore.raw(app))) TodayStore.save(app, json);
        });
        findPhones(app);
    }

    /** A new workout state from the phone, or null when it ended. */
    private static void set(Context context, WorkoutState next) {
        Context app = context.getApplicationContext();
        WorkoutState prev = state;
        state = next;
        appContext = app;
        // The watch's own run stays on screen; the phone's workout shows once it's finished.
        if (run != null) {
            for (Listener l : listeners) l.changed();
            return;
        }
        if (next == null) bpm = 0;
        if (next != null && next.vibrate && next.newCue(prev)) cueBuzz(app);
        // With this watch's own Start timer kept on it until the phone's phases come.
        scheduleBuzz(app, state());
        for (Listener l : listeners) l.changed();
    }

    /** A reading from the watch's heart rate sensor (WorkoutService). */
    static void heartRate(Context context, int reading) {
        main.post(() -> {
            bpm = reading;
            for (Listener l : listeners) l.changed();
        });
        WatchRun r = run;
        if (r != null) {
            // The watch's own run keeps its heart rate for the phone to save later; there's no phone to send it to.
            r.heartRate(reading);
            return;
        }
        long now = System.currentTimeMillis();
        if (now - lastHrSent < HR_SEND_MS) return;
        lastHrSent = now;
        send(context.getApplicationContext(), PATH_HR, Integer.toString(reading));
    }

    /** Log set or +30 s, done on the phone exactly like the notification's buttons. */
    static void action(Context context, String action) {
        if (run != null) {
            localAction(context.getApplicationContext(), action, null);
            return;
        }
        send(context.getApplicationContext(), PATH_ACTION, action);
    }

    /**
     * A tap with what goes with it: Log set or adjust with the weight and reps chosen on the watch, or rate with how
     * the exercise felt. The phone checks the fields (WatchMessages.tap) and the web app the set (watchAdjust.ts).
     */
    static void action(Context context, String action, org.json.JSONObject fields) {
        if (run != null) {
            localAction(context.getApplicationContext(), action, fields);
            return;
        }
        try {
            fields.put("a", action);
        } catch (org.json.JSONException e) {
            action(context, action);
            return;
        }
        send(context.getApplicationContext(), PATH_ACTION, fields.toString());
    }

    /**
     * Start timer on a timed hold, carry or cardio set: the watch counts it at once on its own clock (and buzzes), and the
     * phone starts the same timer from this moment (timerRun.ts startFromWatch). In the watch's own run it's kept there.
     */
    static void startTimer(Context context) {
        Context app = context.getApplicationContext();
        appContext = app;
        long now = System.currentTimeMillis();
        WorkoutState s = state();
        if (s == null || !s.canStartTimer(now)) return;
        if (run != null) {
            localAction(app, "timer", null);
            return;
        }
        startedKey = s.ts.key;
        startedAt = now;
        org.json.JSONObject f = new org.json.JSONObject();
        try {
            f.put("key", s.ts.key);
        } catch (org.json.JSONException ignored) {
            return;
        }
        action(app, "timer", f);
        main.post(() -> {
            scheduleBuzz(app, state());
            for (Listener l : listeners) l.changed();
        });
    }

    /** A batch of wrist motion (MotionStream), counted into reps on the phone. */
    static void motion(Context context, String body) {
        if (run != null) return;
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

    /** The phone, and whether it has Liftsmith (PhoneLink): the screen's idle state and where messages go. */
    static PhoneLink.Status phone() {
        return phoneStatus;
    }

    /** The first phone with Liftsmith, for Start on phone, or the first connected one, for Install on phone. */
    static String phoneNode() {
        return phoneNode;
    }

    /** Looks for the phone again (the screen opened, or a phone came or went), then tells the listeners. */
    static void findPhones(Context app, Runnable then) {
        PhoneLink.check(app, (PhoneLink.Result r) -> {
            // Messages go to phones with the app; when the capability isn't known yet, to every connected node.
            phones = r.phones.isEmpty() ? r.connected : r.phones;
            phoneNode = !r.phones.isEmpty() ? r.phones.get(0) : r.connected.isEmpty() ? null : r.connected.get(0);
            phoneStatus = r.status;
            main.post(() -> {
                for (Listener l : listeners) l.changed();
            });
            then.run();
        });
    }

    private static void buzz(long[] pattern) {
        Vibrator v = appContext == null ? null : appContext.getSystemService(Vibrator.class);
        if (v != null) v.vibrate(VibrationEffect.createWaveform(pattern, -1));
    }

    /** Hands-free watch sets (Labs): one short tap when the set started or logged itself, so the lifter knows without looking. */
    private static void cueBuzz(Context app) {
        Vibrator v = app.getSystemService(Vibrator.class);
        if (v != null) v.vibrate(VibrationEffect.createOneShot(120, VibrationEffect.DEFAULT_AMPLITUDE));
    }

    /** A buzz on the wrist when rest ends, if the lifter's rest-over alert vibrates (Workout preferences). */
    private static void scheduleBuzz(Context app, WorkoutState s) {
        if (restBuzz != null) main.removeCallbacks(restBuzz);
        restBuzz = null;
        main.removeCallbacksAndMessages(TIMER);
        main.removeCallbacks(warnBuzz);
        long now = System.currentTimeMillis();
        // The set timer: a buzz as each phase ends (go, switch sides, time's up), a tick on its last three seconds and a
        // soft tap halfway through a long hold, felt with the phone in a bag.
        if (s != null && s.vibrate && !s.resting(now)) {
            long up = SystemClock.uptimeMillis();
            for (WorkoutState.Phase p : s.phases()) {
                if (p.to <= now) continue;
                main.postAtTime(timerBuzz, TIMER, up + p.to - now);
                for (int k = 1; k <= 3; k++) if (p.to - k * 1000L > now && p.to - k * 1000L > p.from) main.postAtTime(timerTick, TIMER, up + p.to - k * 1000L - now);
                long half = p.from + (p.to - p.from) / 2;
                if (p.to - p.from >= HALF_FROM_MS && half > now) main.postAtTime(timerHalf, TIMER, up + half - now);
            }
        }
        if (s == null || !s.vibrate || !s.resting(now)) return;
        restBuzz = () -> {
            Vibrator v = app.getSystemService(Vibrator.class);
            if (v != null) v.vibrate(VibrationEffect.createWaveform(new long[] { 0, 300, 150, 300 }, -1));
        };
        main.postDelayed(restBuzz, s.restUntil - now);
        if (s.warn && s.restUntil - REST_WARN_MS > now) main.postDelayed(warnBuzz, s.restUntil - REST_WARN_MS - now);
    }
}
