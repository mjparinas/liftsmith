package com.getliftsmith.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.service.quicksettings.TileService;
import android.text.format.DateUtils;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Foreground service behind the live workout notification. While it runs, Android keeps the app alive with the
 * screen off, so the rest countdown on the lock screen stays right and the end-of-rest alert fires on time.
 */
public class WorkoutService extends Service {

    static final String ACTION_UPDATE = "com.getliftsmith.app.UPDATE";
    static final String BROADCAST_ACTION = "com.getliftsmith.app.WORKOUT_ACTION";
    static final String EXTRA_ACTION = "action";
    // "-v2": the first channel was IMPORTANCE_LOW, which Android files under "Silent" and hides on the lock screen
    // unless the user shows silent notifications there. An app can't raise a channel's importance once it exists,
    // so the live notification moved to a new channel and the old one is deleted.
    private static final String CHANNEL_LIVE = "workout-live-v2";
    private static final String CHANNEL_LIVE_OLD = "workout-live";
    private static final String CHANNEL_ALERT = "rest-over";
    private static final String CHANNEL_ALERT_SOUND = "rest-over-sound";
    private static final int ID_LIVE = 1;

    /** Whether a workout is running, for the Quick Settings tile (WorkoutTileService). */
    static volatile boolean running = false;

    /**
     * A Log set or +30 s from a watch (Wear OS, Garmin): handled like the notification's own buttons, so it works with
     * the app closed too. Without a workout running there's nothing to log, and the web app ignores it anyway.
     */
    static void tap(Context context, String action) {
        if (running) {
            context.startService(new Intent(context, WorkoutService.class).putExtra(EXTRA_ACTION, action));
        } else {
            context.sendBroadcast(new Intent(BROADCAST_ACTION).setPackage(context.getPackageName()).putExtra(EXTRA_ACTION, action));
        }
    }

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable restOver;
    /** The latest update from the app, kept so the once-a-second rest tick can redraw the notification. */
    private Intent last;
    /** When the current rest started, for the rest bar (kept through +30 s, so the bar grows back rather than resetting). */
    private long restFrom = 0L;
    /** The notification after each of the next Log sets, from the app (sessionAhead.ts), and how many are used. */
    private JSONArray ahead = new JSONArray();
    private int aheadAt = 0;
    /** The last planned set has been logged from the notification with the app closed. */
    private boolean ended = false;
    /** The set timer for holds, carries and cardio (TimerPhases), counted here so it runs with the app asleep. */
    private java.util.List<TimerPhases.Phase> timer = java.util.Collections.emptyList();

    @Override
    public void onCreate() {
        super.onCreate();
        running = true;
        refreshTile();
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.deleteNotificationChannel(CHANNEL_LIVE_OLD);
        // Default importance so it shows on the lock screen, with no sound or vibration so the countdown never buzzes.
        NotificationChannel live = new NotificationChannel(CHANNEL_LIVE, getString(R.string.channel_live), NotificationManager.IMPORTANCE_DEFAULT);
        live.setSound(null, null);
        live.enableVibration(false);
        live.setDescription(getString(R.string.channel_live_desc));
        live.setShowBadge(false);
        live.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(live);
        // Rest over is said in the live card itself now (Melvin, 2026-11-12), so the separate alert channels go.
        nm.deleteNotificationChannel(CHANNEL_ALERT);
        nm.deleteNotificationChannel(CHANNEL_ALERT_SOUND);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || !ACTION_UPDATE.equals(intent.getAction())) {
            String action = intent == null ? null : intent.getStringExtra(EXTRA_ACTION);
            if (action != null) tapped(action, System.currentTimeMillis());
            return START_NOT_STICKY;
        }
        // A fresh update from the app: the sets ahead start again from the set it's on.
        ahead = WorkoutTaps.parse(intent.getStringExtra("ahead"));
        aheadAt = 0;
        ended = false;
        show(intent);
        return START_NOT_STICKY;
    }

    /**
     * A Log set or +30 s tap. With the app's screen open (or in the background) it goes to the web app, which logs it
     * and sends a new update. With the app closed nothing could hear it, so the tap is kept with its time (WorkoutTaps)
     * for the app to log when it opens, and the notification moves on by itself: to the next set the app worked out
     * ahead of time (sessionAhead.ts), with its rest counting down and the rest-over alert at the end.
     */
    private void tapped(String action, long at) {
        if (WorkoutSessionPlugin.isLive()) {
            sendBroadcast(new Intent(BROADCAST_ACTION).setPackage(getPackageName()).putExtra(EXTRA_ACTION, action).putExtra("at", at));
            return;
        }
        if (last == null) {
            WorkoutTaps.add(this, action, at);
            return;
        }
        if ("log".equals(action)) {
            // Every planned set is logged: further taps would log nothing, so they aren't kept either.
            if (ended) return;
            WorkoutTaps.add(this, action, at);
            JSONObject step = ahead.optJSONObject(aheadAt);
            if (step == null) return;
            aheadAt++;
            ended = step.optBoolean("end", false);
            long rest = step.optLong("rest", 0L);
            Intent n = new Intent(last)
                .putExtra("title", step.optString("title", ""))
                .putExtra("setLabel", step.optString("setLabel", ""))
                .putExtra("next", step.optString("next", ""))
                .putExtra("plates", step.optString("plates", ""))
                .putExtra("chip", step.optString("chip", ""))
                .putExtra("done", step.optInt("done", 0))
                .putExtra("total", step.optInt("total", 0))
                .putExtra("restUntil", rest > 0 ? at + rest * 1000L : 0L)
                .putExtra("restTotal", rest)
                // The voice coach's cue was for the rest just gone; the app writes the next one.
                .putExtra("speak", "")
                // Heart rate came from the app, which isn't running to update it.
                .putExtra("hr", 0)
                // A new set: the last rest's "Rest over" is done with, and so is the set timer.
                .putExtra("restDone", false)
                .putExtra("timer", "[]")
                .putExtra("timerDone", false);
            show(n);
            watches(n);
        } else if ("add30".equals(action)) {
            long restUntil = last.getLongExtra("restUntil", 0L);
            // Like the app's +30 s: only while resting.
            if (restUntil <= at) return;
            WorkoutTaps.add(this, action, at);
            long total = restFrom > 0 ? (restUntil - restFrom + 999) / 1000 : 0;
            Intent n = new Intent(last).putExtra("restUntil", restUntil + 30_000L).putExtra("restTotal", total + 30);
            show(n);
            watches(n);
        }
    }

    /** The watch apps follow the notification while the app is closed (the app sends them its own updates otherwise). */
    private void watches(Intent n) {
        JSONObject w = new JSONObject();
        try {
            w.put("title", n.getStringExtra("title"));
            w.put("setLabel", n.getStringExtra("setLabel"));
            w.put("next", n.getStringExtra("next"));
            w.put("plates", n.getStringExtra("plates"));
            w.put("vibrate", n.getBooleanExtra("vibrate", true));
            w.put("done", n.getIntExtra("done", 0));
            w.put("total", n.getIntExtra("total", 0));
            long restUntil = n.getLongExtra("restUntil", 0L);
            if (restUntil > 0) w.put("restUntil", restUntil);
        } catch (JSONException ignored) {
            return;
        }
        WatchLink.update(this, w);
        GarminLink.update(this, w);
    }

    /** Draws the notification for `intent` and schedules its rest: the countdown redraws, the ticks and the alert. */
    private void show(Intent intent) {
        last = intent;
        long restUntil = intent.getLongExtra("restUntil", 0L);
        boolean resting = restUntil > System.currentTimeMillis();
        // When this rest started: the app sends its whole length (+30 s included), else keep what we had, else now.
        long restTotal = intent.getLongExtra("restTotal", 0L) * 1000L;
        if (!resting) restFrom = 0L;
        else if (restTotal > 0) restFrom = restUntil - restTotal;
        else if (restFrom == 0L) restFrom = System.currentTimeMillis();

        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE : 0;
        ServiceCompat.startForeground(this, ID_LIVE, build(intent), type);
        handler.removeCallbacks(restTick);
        if (resting) scheduleTick(restUntil);
        scheduleTimer(intent, resting);

        if (restOver != null) handler.removeCallbacks(restOver);
        handler.removeCallbacks(countdownTick);
        if (resting) {
            final boolean sound = intent.getBooleanExtra("sound", true);
            final boolean vibrate = intent.getBooleanExtra("vibrate", true);
            final String speak = intent.getStringExtra("speak");
            final String speakLang = intent.getStringExtra("speakLang");
            restOver = () -> {
                handler.removeCallbacks(restTick);
                restFrom = 0L;
                // Rest is over: the live card says so ("Rest over", "Up next: 70 lb × 6 reps") and the chip shows the
                // set ("2/4") again, without waiting for the app; no second notification.
                if (last != null) {
                    last = new Intent(last).putExtra("restDone", true);
                    getSystemService(NotificationManager.class).notify(ID_LIVE, build(last));
                }
                alertRestOver(sound, vibrate);
                // Voice coach: said here, not in the web layer, so it's heard with the screen locked.
                if (speak != null && !speak.isEmpty()) VoiceCoachPlugin.speak(this, speak, 1f, speakLang);
            };
            handler.postDelayed(restOver, restUntil - System.currentTimeMillis());
            // Feel the countdown: three light ticks in the last three seconds, so rest ending is felt with the
            // phone in a pocket. Same rule as the rest-over buzz: only when vibration is on for it.
            if (vibrate) {
                for (int s = 3; s >= 1; s--) {
                    long at = restUntil - s * 1000L - System.currentTimeMillis();
                    if (at > 0) handler.postDelayed(countdownTick, at);
                }
            }
        }
    }

    /**
     * The live notification for the latest update. While resting it says the time left in words ("1:23 left"), in
     * the status bar chip and the Now Bar, and as a rest bar that empties as rest runs out. There is no system
     * chronometer in the header, so the time shows once; the service redraws once a second during rest (restTick) and
     * stops when rest ends.
     */
    private Notification build(Intent intent) {
        String title = intent.getStringExtra("title");
        String setLabel = intent.getStringExtra("setLabel");
        String next = intent.getStringExtra("next");
        String plates = intent.getStringExtra("plates");
        long restUntil = intent.getLongExtra("restUntil", 0L);
        int hr = intent.getIntExtra("hr", 0);
        String chip = intent.getStringExtra("chip");
        int done = intent.getIntExtra("done", 0);
        int total = intent.getIntExtra("total", 0);
        long now = System.currentTimeMillis();
        boolean resting = restUntil > now;
        // The set timer while lifting: "Time left 0:23" in place of the set, in the chip and as a bar.
        TimerPhases.Phase phase = resting ? null : TimerPhases.at(TimerPhases.parse(intent.getStringExtra("timer")), now);
        // The hold ran out with no update from the app yet: the card says so ("Time's up") until it logs the set.
        String overText = !resting && phase == null && intent.getBooleanExtra("timerDone", false) ? intent.getStringExtra("timerOver") : null;
        // Whole seconds left, rounded up, so it reads 0:01 in the last second and never 0:00 while still resting.
        long secLeft = resting ? (restUntil - now + 999) / 1000 : 0;
        String left = DateUtils.formatElapsedTime(secLeft);

        StringBuilder body = new StringBuilder();
        if (resting) body.append(getString(R.string.rest_left, left)).append("\n").append(getString(R.string.next_prefix)).append(" ");
        body.append(next);
        if (plates != null && !plates.isEmpty()) body.append("\n").append(plates);
        if (hr > 0) body.append("\n♥ ").append(hr).append(" bpm");

        // Rest just ran out with no update from the app yet: the card itself says so, in place of a second notification.
        boolean restDone = !resting && intent.getBooleanExtra("restDone", false);
        if (restDone) {
            title = getString(R.string.rest_over);
            body.setLength(0);
            body.append(getString(R.string.up_next, next));
            if (plates != null && !plates.isEmpty()) body.append("\n").append(plates);
            if (hr > 0) body.append("\n♥ ").append(hr).append(" bpm");
        }

        if (phase != null) body.insert(0, phase.text(now) + "\n");
        else if (overText != null && !overText.isEmpty()) body.insert(0, overText + "\n");

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_LIVE)
            .setSmallIcon(R.drawable.ic_stat_workout)
            .setContentTitle(title)
            .setContentText(
                resting ? getString(R.string.rest_left_next, left, next)
                    : restDone ? getString(R.string.up_next, next)
                    : phase != null ? phase.text(now)
                    : overText != null && !overText.isEmpty() ? overText
                    : setLabel == null || setLabel.isEmpty() ? next : setLabel + " · " + next
            )
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body.toString()))
            .setSubText(setLabel)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_WORKOUT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(0xFF4C8DFF)
            .setContentIntent(openApp())
            .addAction(0, getString(R.string.shortcut_log_short), action("log"))
            .addAction(0, getString(R.string.add_30), action("add30"))
            // Android 16 Live Updates: ask for promotion, so the workout gets a chip in the status bar and sits at the
            // top of the shade and the lock screen. Samsung's One UI 8 shows promoted notifications in its Now Bar too.
            // Promotion needs an ongoing notification with a title, a standard or BigText style, no custom views and
            // no colorized background, on a channel above IMPORTANCE_MIN; all true here. Older Android ignores it.
            .setRequestPromotedOngoing(true);
        if (resting) {
            // The rest bar: time left of the whole rest, emptying as it runs out (in seconds, so +30 s fits).
            long span = Math.max(1, (restUntil - (restFrom > 0 ? restFrom : now) + 999) / 1000);
            b.setProgress((int) Math.max(span, secLeft), (int) secLeft, false);
            // The time in the chip ("1:23"). No system chronometer in the header: the text already says the time left,
            // and the header clock showed it a second time beside the title (Melvin, 2026-11-12).
            b.setShowWhen(false);
            b.setShortCriticalText(left);
        } else if (phase != null) {
            // The timer's bar: how far through this phase (a count-up has no end, so it shows the workout's bar).
            if (phase.to > 0) {
                long span = Math.max(1, (phase.to - phase.from) / 1000);
                b.setProgress((int) span, (int) Math.min(span, (now - phase.from) / 1000), false);
            } else if (total > 0) b.setProgress(total, Math.min(done, total), false);
            b.setShowWhen(false);
            b.setShortCriticalText(TimerPhases.clock(phase.seconds(now)));
        } else {
            // Progress through the whole workout (working sets logged of those planned): a bar in the notification and the Now Bar.
            if (total > 0) b.setProgress(total, Math.min(done, total), false);
            // While lifting the chip shows the set ("2/4"), not a clock.
            b.setShowWhen(false);
            if (chip != null && !chip.isEmpty()) b.setShortCriticalText(chip);
        }
        return b.build();
    }

    /**
     * The set timer: redraws once a second while a phase runs, a buzz as each phase ends (go, switch sides), and the
     * rest-over sound and buzz when the hold is over, so it's heard and felt with the phone locked. Nothing while resting.
     */
    private void scheduleTimer(Intent intent, boolean resting) {
        handler.removeCallbacks(timerTick);
        handler.removeCallbacks(timerStep);
        handler.removeCallbacks(timerOver);
        timer = resting ? java.util.Collections.emptyList() : TimerPhases.parse(intent.getStringExtra("timer"));
        if (timer.isEmpty()) return;
        long now = System.currentTimeMillis();
        handler.postDelayed(timerTick, 1000L - (now % 1000L));
        for (int i = 0; i < timer.size() - 1; i++) {
            long at = timer.get(i).to - now;
            if (at > 0) handler.postDelayed(timerStep, at);
        }
        long end = TimerPhases.end(timer);
        if (end > now) {
            final boolean sound = intent.getBooleanExtra("sound", true);
            final boolean vibrate = intent.getBooleanExtra("vibrate", true);
            timerOverAlert = () -> {
                if (last != null) {
                    last = new Intent(last).putExtra("timerDone", true);
                    getSystemService(NotificationManager.class).notify(ID_LIVE, build(last));
                }
                alertRestOver(sound, vibrate);
            };
            handler.postDelayed(timerOver, end - now);
        }
    }

    private Runnable timerOverAlert;
    private final Runnable timerOver = () -> {
        if (timerOverAlert != null) timerOverAlert.run();
    };

    /** One buzz as a phase of the set timer ends (posted once per phase; removeCallbacks cancels all of them). */
    private final Runnable timerStep = () -> {
        Vibrator v = getSystemService(Vibrator.class);
        if (v != null) v.vibrate(VibrationEffect.createOneShot(120, 200));
    };

    /** Once a second while the set timer runs, so "Time left 0:23", the chip and the bar stay right. */
    private final Runnable timerTick = () -> {
        if (last == null || timer.isEmpty()) return;
        long now = System.currentTimeMillis();
        if (TimerPhases.at(timer, now) == null && now >= TimerPhases.end(timer) && TimerPhases.end(timer) > 0) return;
        getSystemService(NotificationManager.class).notify(ID_LIVE, build(last));
        handler.postDelayed(this.timerTick, 1000L - (now % 1000L));
    };

    /** Redraws the notification on the next whole second of rest left, so "1:23 left" and the rest bar stay right. */
    private void scheduleTick(long restUntil) {
        long ms = (restUntil - System.currentTimeMillis()) % 1000L;
        handler.postDelayed(restTick, ms <= 0 ? 1000L : ms);
    }

    /** Once a second during rest only: there is nothing to redraw while lifting, and it stops when rest ends. */
    private final Runnable restTick = () -> {
        if (last == null) return;
        long restUntil = last.getLongExtra("restUntil", 0L);
        if (restUntil <= System.currentTimeMillis()) return;
        getSystemService(NotificationManager.class).notify(ID_LIVE, build(last));
        scheduleTick(restUntil);
    };

    /** One light tick of the rest countdown (posted three times; removeCallbacks cancels all of them). */
    private final Runnable countdownTick = () -> {
        Vibrator v = getSystemService(Vibrator.class);
        if (v != null) v.vibrate(VibrationEffect.createOneShot(30, 120));
    };

    /**
     * The rest-over alert: sound, vibration, both or neither, as picked in Workout preferences. The live card shows the
     * words, so this only plays the phone's notification sound (not in silent, vibrate or Do Not Disturb) and buzzes.
     */
    private void alertRestOver(boolean sound, boolean vibrate) {
        if (sound && soundAllowed()) {
            try {
                Ringtone r = RingtoneManager.getRingtone(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION));
                if (r != null) {
                    r.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
                    r.play();
                }
            } catch (RuntimeException ignored) {
                // No notification sound on this phone; the card and the buzz still say rest is over.
            }
        }
        if (!vibrate) return;
        Vibrator v = getSystemService(Vibrator.class);
        if (v != null) v.vibrate(VibrationEffect.createWaveform(new long[] { 0, 250, 120, 250 }, -1));
    }

    /** A notification sound may play: the ringer is on and Do Not Disturb isn't holding notifications back. */
    private boolean soundAllowed() {
        AudioManager am = getSystemService(AudioManager.class);
        if (am != null && am.getRingerMode() != AudioManager.RINGER_MODE_NORMAL) return false;
        NotificationManager nm = getSystemService(NotificationManager.class);
        return nm == null || nm.getCurrentInterruptionFilter() <= NotificationManager.INTERRUPTION_FILTER_ALL;
    }

    private PendingIntent openApp() {
        Intent i = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(this, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private PendingIntent action(String name) {
        Intent i = new Intent(this, WorkoutService.class).putExtra(EXTRA_ACTION, name);
        return PendingIntent.getService(this, name.hashCode(), i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @Override
    public void onDestroy() {
        if (restOver != null) handler.removeCallbacks(restOver);
        handler.removeCallbacks(restTick);
        handler.removeCallbacks(countdownTick);
        handler.removeCallbacks(timerTick);
        handler.removeCallbacks(timerStep);
        handler.removeCallbacks(timerOver);
        running = false;
        refreshTile();
        super.onDestroy();
    }

    private void refreshTile() {
        try {
            TileService.requestListeningState(this, new ComponentName(this, WorkoutTileService.class));
        } catch (RuntimeException ignored) {
            // The tile isn't added; nothing to refresh.
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
