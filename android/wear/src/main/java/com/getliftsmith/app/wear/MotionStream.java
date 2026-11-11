package com.getliftsmith.app.wear;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.SystemClock;

/**
 * Reads the watch's linear acceleration, gravity and gyroscope while the phone asks for motion (Labs, watch rep
 * counting: a set is under way and the lab is on), and sends it to the phone in batches through WatchHub. Off
 * the rest of the time, so the sensors never run during rest or without the lab.
 */
final class MotionStream implements SensorEventListener {

    /** 50 readings a second. */
    private static final int RATE_US = 20_000;

    private final Context app;
    private final SensorManager sensors;
    private final MotionBatch batch = new MotionBatch();
    private final float[] gravity = new float[3];
    private boolean haveGravity;
    private double rot;
    private boolean on;

    MotionStream(Context context) {
        app = context.getApplicationContext();
        sensors = app.getSystemService(SensorManager.class);
    }

    /** Starts or stops the stream; does nothing when it's already that way. */
    void set(boolean want) {
        if (want == on || sensors == null) return;
        on = want;
        if (want) {
            haveGravity = false;
            rot = 0;
            register(Sensor.TYPE_GRAVITY);
            register(Sensor.TYPE_GYROSCOPE);
            register(Sensor.TYPE_LINEAR_ACCELERATION);
        } else {
            sensors.unregisterListener(this);
            flush();
        }
    }

    private void register(int type) {
        Sensor s = sensors.getDefaultSensor(type);
        if (s != null) sensors.registerListener(this, s, RATE_US);
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        switch (e.sensor.getType()) {
            case Sensor.TYPE_GRAVITY:
                System.arraycopy(e.values, 0, gravity, 0, 3);
                haveGravity = true;
                break;
            case Sensor.TYPE_GYROSCOPE:
                rot = Math.sqrt(e.values[0] * e.values[0] + e.values[1] * e.values[1] + e.values[2] * e.values[2]);
                break;
            case Sensor.TYPE_LINEAR_ACCELERATION:
                if (!haveGravity) return;
                // Sensor times count from boot; the phone only needs them to be in order and in ms.
                long t = System.currentTimeMillis() - (SystemClock.elapsedRealtimeNanos() - e.timestamp) / 1_000_000L;
                if (batch.add(t, MotionBatch.up(e.values, gravity), rot)) flush();
                break;
            default:
                break;
        }
    }

    private void flush() {
        String body = batch.take();
        if (body != null) WatchHub.motion(app, body);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}
