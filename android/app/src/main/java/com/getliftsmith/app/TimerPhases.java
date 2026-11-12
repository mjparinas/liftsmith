package com.getliftsmith.app;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The set timer for holds, carries and cardio as the app sends it (sessionNotify.ts TimerSegment): phase by phase in
 * wall-clock time, so the notification and the watches count it down on their own while the app is asleep. A phase
 * counts down to `to`, or up from `from` when it has no end. Plain data, so it's tested without a phone.
 * iOS counterpart: TimerPhase in Shared/WorkoutActivity.swift; Wear OS: WorkoutState.Phase.
 */
final class TimerPhases {

    static final class Phase {
        final long from;
        /** 0 for a count-up, which runs until the set is logged. */
        final long to;
        final String label;

        Phase(long from, long to, String label) {
            this.from = from;
            this.to = to;
            this.label = label;
        }

        /** Whole seconds left (rounded up, so 0:01 shows until the end), or seconds so far for a count-up. */
        long seconds(long now) {
            return to > 0 ? Math.max(0, (to - now + 999) / 1000) : Math.max(0, (now - from) / 1000);
        }

        /** "Time left 0:23". */
        String text(long now) {
            return label + " " + clock(seconds(now));
        }
    }

    private TimerPhases() {}

    /** 85 s is "1:25". */
    static String clock(long seconds) {
        long s = Math.max(0, seconds);
        return (s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
    }

    /** The phases in the app's JSON, oldest first; empty when there are none or it can't be read. */
    static List<Phase> parse(String json) {
        if (json == null || json.isEmpty()) return Collections.emptyList();
        List<Phase> out = new ArrayList<>();
        try {
            JSONArray a = new JSONArray(json);
            for (int i = 0; i < a.length() && i < 8; i++) {
                JSONObject o = a.optJSONObject(i);
                if (o == null || !o.has("from")) continue;
                long from = o.optLong("from", 0L);
                long to = o.isNull("to") ? 0L : o.optLong("to", 0L);
                if (from <= 0 || (to > 0 && to <= from)) continue;
                out.add(new Phase(from, to, o.optString("label", "")));
            }
        } catch (org.json.JSONException e) {
            return Collections.emptyList();
        }
        return out;
    }

    /** The phase showing at `now` (started, not ended), or null. Same rule as timerSegmentAt in sessionNotify.ts. */
    static Phase at(List<Phase> phases, long now) {
        for (Phase p : phases) if (p.from <= now && (p.to == 0 || now < p.to)) return p;
        return null;
    }

    /** When the last countdown ends (the hold is over), or 0 when the timer counts up or there is none. */
    static long end(List<Phase> phases) {
        if (phases.isEmpty()) return 0L;
        return phases.get(phases.size() - 1).to;
    }
}
