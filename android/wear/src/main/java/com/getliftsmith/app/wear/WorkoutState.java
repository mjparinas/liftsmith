package com.getliftsmith.app.wear;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.json.JSONArray;
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
    /** A gentle buzz 10 seconds before rest ends (Workout preferences), only when vibrate is on too. */
    final boolean warn;
    final int done;
    final int total;
    final long at;
    final String sessionId;
    /** Labs, watch rep counting: the phone wants the wrist's motion for this set. */
    final boolean motion;
    /** The set timer for holds, carries and cardio, phase by phase in wall-clock time (sessionNotify.ts TimerSegment). */
    final List<Phase> timer;

    /** One phase of the set timer: counts down to `to`, or up from `from` when `to` is 0. */
    static final class Phase {
        final long from;
        final long to;
        final String label;

        Phase(long from, long to, String label) {
            this.from = from;
            this.to = to;
            this.label = label;
        }

        /** Whole seconds left (rounded up), or seconds so far for a count-up. */
        long seconds(long now) {
            return to > 0 ? Math.max(0, (to - now + 999) / 1000) : Math.max(0, (now - from) / 1000);
        }
    }

    private WorkoutState(JSONObject o) {
        title = o.optString("title", "");
        setLabel = o.optString("setLabel", "");
        next = o.optString("next", "");
        plates = o.optString("plates", "");
        restUntil = o.isNull("restUntil") ? 0L : o.optLong("restUntil", 0L);
        hr = o.optInt("hr", 0);
        vibrate = o.optBoolean("vibrate", true);
        warn = o.optBoolean("warn", false);
        done = o.optInt("done", 0);
        total = o.optInt("total", 0);
        at = o.optLong("at", 0L);
        sessionId = o.optString("sessionId", "");
        motion = o.optBoolean("motion", false);
        timer = phases(o.optJSONArray("timer"));
    }

    private static List<Phase> phases(JSONArray a) {
        if (a == null) return Collections.emptyList();
        List<Phase> out = new ArrayList<>();
        for (int i = 0; i < a.length() && i < 8; i++) {
            JSONObject p = a.optJSONObject(i);
            if (p == null) continue;
            long from = p.optLong("from", 0L);
            long to = p.isNull("to") ? 0L : p.optLong("to", 0L);
            if (from <= 0 || (to > 0 && to <= from)) continue;
            out.add(new Phase(from, to, p.optString("label", "")));
        }
        return out;
    }

    /** The set timer's phase at `now` (started, not ended), or null; never while resting. Same rule as the phone's. */
    Phase phase(long now) {
        if (resting(now)) return null;
        for (Phase p : timer) if (p.from <= now && (p.to == 0 || now < p.to)) return p;
        return null;
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
