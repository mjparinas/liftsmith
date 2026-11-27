package com.getliftsmith.app.wear;

/**
 * Keeps the watch's countdowns on the phone's second (watch-apps.md "Same second as the phone"). Two things made the
 * watch lag: it redrew once a second from whenever the screen opened, so a change could show up to a second late,
 * and its clock can differ from the phone's. The phone sends rest and set timer ends as times on its own clock, plus
 * when it sent them ("at"), so the watch works out the difference from those and redraws on the exact moment the
 * shown second changes.
 */
final class WatchClock {

    /** How many recent arrivals the offset is worked out from. */
    static final int SAMPLES = 16;
    /** An item that took longer than this was kept for a watch out of range: it says nothing about the clocks. */
    static final long MAX_GAP_MS = 60_000L;
    /**
     * An arrival later than "at" is latency plus the watch being ahead, and the two can't be told apart, so the watch
     * only counts itself ahead past this (the Data Layer can take a second or so). Earlier than "at" can only be the
     * watch being behind, so any of that counts.
     */
    static final long AHEAD_MS = 2_000L;

    private final long[] gaps = new long[SAMPLES];
    private int count = 0;
    private int next = 0;

    /** The phone sent a state at `sentAt` (its clock) and it arrived at `now` (this watch's clock). */
    synchronized void heard(long sentAt, long now) {
        if (sentAt <= 0) return;
        long gap = now - sentAt;
        if (Math.abs(gap) > MAX_GAP_MS) return;
        gaps[next] = gap;
        next = (next + 1) % SAMPLES;
        if (count < SAMPLES) count++;
    }

    /** How far this watch's clock is ahead of the phone's (negative: behind), in ms; add it to a phone time. */
    synchronized long offset() {
        if (count == 0) return 0;
        long least = Long.MAX_VALUE;
        for (int i = 0; i < count; i++) least = Math.min(least, gaps[i]);
        if (least < 0) return least;
        return least > AHEAD_MS ? least : 0;
    }

    /**
     * Ms until a countdown to (or count-up from) `anchor` shows its next second, so the screen redraws right as the
     * phone's does, a few ms after the boundary. 1 s when nothing counts.
     */
    static long nextTick(long now, long anchor) {
        if (anchor <= 0) return 1000L;
        long r = Math.floorMod(anchor - now, 1000L);
        return (r == 0 ? 1000L : r) + 5L;
    }
}
