package com.getliftsmith.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.service.quicksettings.TileService;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

/**
 * Foreground service behind the live workout notification. While it runs, Android keeps the app alive with the
 * screen off, so the rest countdown on the lock screen stays right and the end-of-rest alert fires on time.
 */
public class WorkoutService extends Service {

    static final String ACTION_UPDATE = "com.getliftsmith.app.UPDATE";
    static final String BROADCAST_ACTION = "com.getliftsmith.app.WORKOUT_ACTION";
    static final String EXTRA_ACTION = "action";
    private static final String CHANNEL_LIVE = "workout-live";
    private static final String CHANNEL_ALERT = "rest-over";
    private static final String CHANNEL_ALERT_SOUND = "rest-over-sound";
    private static final int ID_LIVE = 1;
    private static final int ID_ALERT = 2;

    /** Whether a workout is running, for the Quick Settings tile (WorkoutTileService). */
    static volatile boolean running = false;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable restOver;

    @Override
    public void onCreate() {
        super.onCreate();
        running = true;
        refreshTile();
        NotificationManager nm = getSystemService(NotificationManager.class);
        NotificationChannel live = new NotificationChannel(CHANNEL_LIVE, getString(R.string.channel_live), NotificationManager.IMPORTANCE_LOW);
        live.setDescription(getString(R.string.channel_live_desc));
        live.setShowBadge(false);
        live.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        NotificationChannel alert = new NotificationChannel(CHANNEL_ALERT, getString(R.string.rest_over), NotificationManager.IMPORTANCE_HIGH);
        alert.setDescription(getString(R.string.channel_alert_desc));
        alert.enableVibration(true);
        alert.setVibrationPattern(new long[] { 0, 250, 120, 250 });
        alert.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
        alert.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(live);
        nm.createNotificationChannel(alert);
        // The same alert without vibration, for lifters who pick "sound only" (channel settings can't change once made).
        NotificationChannel soundOnly = new NotificationChannel(CHANNEL_ALERT_SOUND, getString(R.string.channel_alert_sound), NotificationManager.IMPORTANCE_HIGH);
        soundOnly.setDescription(getString(R.string.channel_alert_sound_desc));
        soundOnly.enableVibration(false);
        soundOnly.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
        soundOnly.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(soundOnly);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || !ACTION_UPDATE.equals(intent.getAction())) {
            if (intent != null && intent.getStringExtra(EXTRA_ACTION) != null) {
                Intent b = new Intent(BROADCAST_ACTION).setPackage(getPackageName()).putExtra(EXTRA_ACTION, intent.getStringExtra(EXTRA_ACTION));
                sendBroadcast(b);
            }
            return START_NOT_STICKY;
        }
        String title = intent.getStringExtra("title");
        String setLabel = intent.getStringExtra("setLabel");
        String next = intent.getStringExtra("next");
        String plates = intent.getStringExtra("plates");
        long restUntil = intent.getLongExtra("restUntil", 0L);
        int hr = intent.getIntExtra("hr", 0);
        String chip = intent.getStringExtra("chip");
        int done = intent.getIntExtra("done", 0);
        int total = intent.getIntExtra("total", 0);
        boolean resting = restUntil > System.currentTimeMillis();

        StringBuilder body = new StringBuilder();
        body.append(resting ? getString(R.string.next_prefix) + " " : "").append(next);
        if (plates != null && !plates.isEmpty()) body.append("\n").append(plates);
        if (hr > 0) body.append("\n♥ ").append(hr).append(" bpm");

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_LIVE)
            .setSmallIcon(R.drawable.ic_stat_workout)
            .setContentTitle(title)
            .setContentText(resting ? getString(R.string.rest_next, next) : setLabel + " · " + next)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body.toString()))
            .setSubText(setLabel)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
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
        // Progress through the whole workout (working sets logged of those planned): a bar in the notification and the Now Bar.
        if (total > 0) b.setProgress(total, Math.min(done, total), false);
        if (resting) {
            // A live countdown drawn by the system: right on the lock screen, and in the status bar chip on Android 16,
            // without waking the app every second.
            b.setUsesChronometer(true).setChronometerCountDown(true).setWhen(restUntil).setShowWhen(true);
        } else {
            // While lifting the chip shows the set ("2/4"), not a clock.
            b.setShowWhen(false);
            if (chip != null && !chip.isEmpty()) b.setShortCriticalText(chip);
        }
        Notification n = b.build();
        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE : 0;
        ServiceCompat.startForeground(this, ID_LIVE, n, type);

        if (restOver != null) handler.removeCallbacks(restOver);
        if (resting) {
            final boolean sound = intent.getBooleanExtra("sound", true);
            final boolean vibrate = intent.getBooleanExtra("vibrate", true);
            final String speak = intent.getStringExtra("speak");
            restOver = () -> {
                alertRestOver(next, sound, vibrate);
                // Voice coach: said here, not in the web layer, so it's heard with the screen locked.
                if (speak != null && !speak.isEmpty()) VoiceCoachPlugin.speak(this, speak, 1f);
            };
            handler.postDelayed(restOver, restUntil - System.currentTimeMillis());
        }
        return START_NOT_STICKY;
    }

    /** The rest-over alert: sound, vibration, both or neither, as picked in Workout preferences. */
    private void alertRestOver(String next, boolean sound, boolean vibrate) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, sound && !vibrate ? CHANNEL_ALERT_SOUND : CHANNEL_ALERT)
            .setSmallIcon(R.drawable.ic_stat_workout)
            .setContentTitle(getString(R.string.rest_over))
            .setContentText(getString(R.string.up_next, next))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setTimeoutAfter(15000)
            .setContentIntent(openApp());
        if (!sound) b.setSilent(true);
        nm.notify(ID_ALERT, b.build());
        if (!vibrate) return;
        Vibrator v = getSystemService(Vibrator.class);
        if (v != null) v.vibrate(VibrationEffect.createWaveform(new long[] { 0, 250, 120, 250 }, -1));
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
