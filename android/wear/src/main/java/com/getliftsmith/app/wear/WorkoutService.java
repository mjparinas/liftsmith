package com.getliftsmith.app.wear;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;
import androidx.wear.ongoing.OngoingActivity;
import androidx.wear.ongoing.Status;

/**
 * Runs while a workout is on: keeps the app alive with the screen off, reads the watch's heart rate sensor
 * (sent to the phone through WatchHub, at most every 2 s), keeps the rest buzz on time, and shows the workout
 * as an Ongoing Activity (its icon on the watch face), and streams wrist motion while the phone asks for it (Labs,
 * watch rep counting: MotionStream). It stops itself when the phone's workout ends.
 */
public class WorkoutService extends Service implements SensorEventListener, WatchHub.Listener {

    private static final String CHANNEL = "workout";
    private static final int ID = 1;
    private SensorManager sensors;
    private MotionStream motion;

    /** Started by the screen once heart rate is allowed, because a health service needs that permission. */
    static void start(Context context) {
        if (!WorkoutActivity.hrAllowed(context)) return;
        ContextCompat.startForegroundService(context, new Intent(context, WorkoutService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel(CHANNEL, getString(R.string.channel), NotificationManager.IMPORTANCE_LOW));
        WatchHub.listen(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, WorkoutActivity.class), PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_workout)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.in_progress))
            .setCategory(NotificationCompat.CATEGORY_WORKOUT)
            .setOngoing(true)
            .setSilent(true)
            .setContentIntent(open);
        new OngoingActivity.Builder(this, ID, b)
            .setStaticIcon(R.drawable.ic_workout)
            .setTouchIntent(open)
            .setStatus(new Status.Builder().addTemplate(getString(R.string.in_progress)).build())
            .build()
            .apply(this);
        Notification n = b.build();
        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH : 0;
        ServiceCompat.startForeground(this, ID, n, type);
        if (sensors == null) {
            sensors = getSystemService(SensorManager.class);
            Sensor hr = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_HEART_RATE);
            if (hr != null) sensors.registerListener(this, hr, SensorManager.SENSOR_DELAY_NORMAL);
        }
        if (motion == null) motion = new MotionStream(this);
        changed();
        return START_NOT_STICKY;
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        // Accuracy below "low" means the watch isn't reading the wrist yet (a reading of 0 or a guess).
        if (event.accuracy < SensorManager.SENSOR_STATUS_ACCURACY_LOW) return;
        int reading = Math.round(event.values[0]);
        if (reading >= 30 && reading <= 240) WatchHub.heartRate(this, reading);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    public void changed() {
        WorkoutState s = WatchHub.state();
        if (motion != null) motion.set(s != null && s.streamMotion(System.currentTimeMillis()));
        if (s == null) stopSelf();
    }

    @Override
    public void onDestroy() {
        WatchHub.unlisten(this);
        if (sensors != null) sensors.unregisterListener(this);
        if (motion != null) motion.set(false);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    static boolean granted(Context c, String permission) {
        return ContextCompat.checkSelfPermission(c, permission) == PackageManager.PERMISSION_GRANTED;
    }
}
