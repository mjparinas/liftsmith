package com.liftsmith.app;

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

    static final String ACTION_UPDATE = "com.liftsmith.app.UPDATE";
    static final String BROADCAST_ACTION = "com.liftsmith.app.WORKOUT_ACTION";
    static final String EXTRA_ACTION = "action";
    private static final String CHANNEL_LIVE = "workout-live";
    private static final String CHANNEL_ALERT = "rest-over";
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
        NotificationChannel live = new NotificationChannel(CHANNEL_LIVE, "Workout in progress", NotificationManager.IMPORTANCE_LOW);
        live.setDescription("Rest timer, next set and heart rate while you train");
        live.setShowBadge(false);
        live.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        NotificationChannel alert = new NotificationChannel(CHANNEL_ALERT, "Rest over", NotificationManager.IMPORTANCE_HIGH);
        alert.setDescription("Sounds and vibrates when your rest ends");
        alert.enableVibration(true);
        alert.setVibrationPattern(new long[] { 0, 250, 120, 250 });
        alert.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
        alert.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(live);
        nm.createNotificationChannel(alert);
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
        boolean resting = restUntil > System.currentTimeMillis();

        StringBuilder body = new StringBuilder();
        body.append(resting ? "Next: " : "").append(next);
        if (plates != null && !plates.isEmpty()) body.append("\n").append(plates);
        if (hr > 0) body.append("\n♥ ").append(hr).append(" bpm");

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_LIVE)
            .setSmallIcon(R.drawable.ic_stat_workout)
            .setContentTitle(title)
            .setContentText(resting ? "Rest · next: " + next : setLabel + " · " + next)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body.toString()))
            .setSubText(setLabel)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_WORKOUT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(0xFF4C8DFF)
            .setContentIntent(openApp())
            .addAction(0, "Log set", action("log"))
            .addAction(0, "+30 s", action("add30"));
        if (resting) {
            // A live countdown drawn by the system: right on the lock screen without waking the app every second.
            b.setUsesChronometer(true).setChronometerCountDown(true).setWhen(restUntil).setShowWhen(true);
        }
        Notification n = b.build();
        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE : 0;
        ServiceCompat.startForeground(this, ID_LIVE, n, type);

        if (restOver != null) handler.removeCallbacks(restOver);
        if (resting) {
            final boolean sound = intent.getBooleanExtra("sound", true);
            restOver = () -> alertRestOver(next, sound);
            handler.postDelayed(restOver, restUntil - System.currentTimeMillis());
        }
        return START_NOT_STICKY;
    }

    private void alertRestOver(String next, boolean sound) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ALERT)
            .setSmallIcon(R.drawable.ic_stat_workout)
            .setContentTitle("Rest over")
            .setContentText("Up next: " + next)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setTimeoutAfter(15000)
            .setContentIntent(openApp());
        if (!sound) b.setSilent(true);
        nm.notify(ID_ALERT, b.build());
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
