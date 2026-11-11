package com.getliftsmith.app.wear;

/**
 * Wrist motion for watch rep counting (Labs), packed for the phone: {"t": first reading's time in ms, "s": [ms after
 * t, up, rot, ...]}, where up is vertical linear acceleration in m/s² (up positive) and rot the rotation rate in
 * rad/s. The phone counts the reps (src/lib/reps/watchMotion.ts), so both watch apps only measure and send.
 * Plain data, so it's tested without a watch. Apple Watch counterpart: WatchModel.swift (motion).
 */
final class MotionBatch {

    /** Readings closer together than this are skipped: about 50 a second is plenty to count reps. */
    static final long MIN_GAP_MS = 18;
    /** A batch goes to the phone this often, so the count keeps up with the lifter. */
    static final long SEND_MS = 250;
    /** The phone takes at most this many readings per batch (WatchMessages.MAX_MOTION). */
    static final int MAX = 200;

    private final StringBuilder s = new StringBuilder();
    private long first = -1;
    private long last = -1;
    private int count;

    /** Adds a reading; returns true when the batch should go now. */
    boolean add(long t, double up, double rot) {
        if (last >= 0 && t - last < MIN_GAP_MS) return false;
        if (first < 0) first = t;
        if (t < first) return false;
        last = t;
        if (count > 0) s.append(',');
        s.append(t - first).append(',').append(round(up)).append(',').append(round(Math.abs(rot)));
        count++;
        return count >= MAX || t - first >= SEND_MS;
    }

    int size() {
        return count;
    }

    /** The batch as JSON, and a fresh start; null when there's nothing in it. */
    String take() {
        if (count == 0) return null;
        String out = "{\"t\":" + first + ",\"s\":[" + s + "]}";
        s.setLength(0);
        first = -1;
        count = 0;
        return out;
    }

    /** Three decimals keep the message small and are finer than the sensors' own noise. */
    private static String round(double v) {
        if (Double.isNaN(v) || Double.isInfinite(v)) return "0";
        double r = Math.max(-99, Math.min(99, Math.round(v * 1000) / 1000.0));
        return r == Math.rint(r) ? Long.toString((long) r) : Double.toString(r);
    }

    /** Vertical part of the linear acceleration: its projection on gravity (Android's gravity sensor points up). */
    static double up(float[] linear, float[] gravity) {
        double n = Math.sqrt(gravity[0] * gravity[0] + gravity[1] * gravity[1] + gravity[2] * gravity[2]);
        if (n < 1e-3) return 0;
        return (linear[0] * gravity[0] + linear[1] * gravity[1] + linear[2] * gravity[2]) / n;
    }
}
