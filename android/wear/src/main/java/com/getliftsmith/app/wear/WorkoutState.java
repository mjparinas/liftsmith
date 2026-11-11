package com.getliftsmith.app.wear;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * The workout the phone is running, as the phone's WatchLink sends it: the live notification's own fields
 * (src/lib/sessionNotify.ts SessionState) plus when it was sent. Plain data, so it's tested without a watch.
 */
final class WorkoutState {

    /** A workout the phone stopped hearing about this long ago was forgotten (the phone ends those after 3 h). */
    static final long STALE_MS = 3L * 60 * 60 * 1000;

    final String title;
    final String setLabel;
    final String next;
    final String plates;
    /** When rest ends, in ms since 1970, or 0 while lifting. */
    final long restUntil;
    /** Heart rate the phone has (a Bluetooth monitor), or 0. */
    final int hr;
    final boolean vibrate;
    final int done;
    final int total;
    final long at;
    final String sessionId;
    /** Labs, watch rep counting: the phone wants the wrist's motion for this set. */
    final boolean motion;

    private WorkoutState(JSONObject o) {
        title = o.optString("title", "");
        setLabel = o.optString("setLabel", "");
        next = o.optString("next", "");
        plates = o.optString("plates", "");
        restUntil = o.isNull("restUntil") ? 0L : o.optLong("restUntil", 0L);
        hr = o.optInt("hr", 0);
        vibrate = o.optBoolean("vibrate", true);
        done = o.optInt("done", 0);
        total = o.optInt("total", 0);
        at = o.optLong("at", 0L);
        sessionId = o.optString("sessionId", "");
        motion = o.optBoolean("motion", false);
    }

    /** The state in a Data Layer item's "json", or null when there's none or it can't be read. */
    static WorkoutState parse(String json) {
        if (json == null || json.isEmpty()) return null;
        try {
            return new WorkoutState(new JSONObject(json));
        } catch (JSONException e) {
            return null;
        }
    }

    boolean stale(long now) {
        return at > 0 && now - at > STALE_MS;
    }

    /** Whether to stream motion now: the phone asked for it, and rest hasn't started on this watch's clock. */
    boolean streamMotion(long now) {
        return motion && !resting(now);
    }

    boolean resting(long now) {
        return restUntil > now;
    }

    /** Seconds of rest left, rounded up, so "0:01" shows until the very end. */
    long restLeft(long now) {
        return resting(now) ? (restUntil - now + 999) / 1000 : 0;
    }

    /** 85 s is "1:25". */
    static String clock(long seconds) {
        long s = Math.max(0, seconds);
        return (s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
    }
}
