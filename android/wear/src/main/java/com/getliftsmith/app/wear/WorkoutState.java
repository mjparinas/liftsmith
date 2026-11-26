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
    /** Labs, hands-free watch sets: keep streaming through rest, so the phone sees the next set start. */
    final boolean motionRest;
    /** Labs, hands-free watch sets: a new id means the set started or logged itself, and the watch buzzes once. */
    final String cue;
    /** Machine taken (src/lib/takenSwap.ts): what one tap swaps to ("Swaps to Dumbbell row, 30 kg × 10"); empty hides the button. */
    final String taken;
    /** Why the exercise is there after a Machine taken swap ("In for Lat pulldown, which was taken"), or empty. */
    final String why;
    /** The set timer for holds, carries and cardio, phase by phase in wall-clock time (sessionNotify.ts TimerSegment). */
    final List<Phase> timer;
    /** What the crown and − / + can change on this set, or null (watchAdjust.ts watchAdj). */
    final Adj adj;
    /** "How did it feel?" after an exercise's last set, or null (watchAdjust.ts watchAsk). */
    final Ask ask;

    /**
     * The set's weight and reps as the phone offers them: a ladder of weights around the set's own (lightest first,
     * empty for a bodyweight move) with the words for each, where the set's own weight is, and the reps.
     */
    static final class Adj {

        /** The most reps the watch sends, like the phone's REPS_MAX. */
        static final int REPS_MAX = 100;
        final String key;
        final double[] kg;
        final String[] words;
        final int i;
        final int reps;
        final String repsWord;

        Adj(String key, double[] kg, String[] words, int i, int reps, String repsWord) {
            this.key = key;
            this.kg = kg;
            this.words = words;
            this.i = i;
            this.reps = reps;
            this.repsWord = repsWord;
        }

        /** The ladder's step closest to `want` kg, so a choice survives the phone sending the ladder again around it. */
        int nearest(double want) {
            int best = i;
            for (int k = 0; k < kg.length; k++) if (Math.abs(kg[k] - want) < Math.abs(kg[best] - want)) best = k;
            return best;
        }

        boolean hasWeight() {
            return kg.length > 0;
        }

        static int clampReps(int r) {
            return Math.max(1, Math.min(REPS_MAX, r));
        }

        static Adj parse(JSONObject o) {
            if (o == null) return null;
            JSONArray kg = o.optJSONArray("kg");
            JSONArray w = o.optJSONArray("w");
            int n = kg == null || w == null || kg.length() != w.length() ? 0 : Math.min(kg.length(), 40);
            double[] k = new double[n];
            String[] words = new String[n];
            for (int x = 0; x < n; x++) {
                k[x] = kg.optDouble(x, 0);
                words[x] = w.optString(x, "");
            }
            int i = o.optInt("i", 0);
            if (n > 0 && (i < 0 || i >= n)) return null;
            String key = o.optString("key", "");
            int reps = o.optInt("reps", 0);
            if (key.isEmpty() || reps < 1) return null;
            return new Adj(key, k, words, n == 0 ? 0 : i, clampReps(reps), o.optString("rs", ""));
        }
    }

    /** The question, its three answers and the rating each sends (1 too easy, 0 about right, -1 too hard). */
    static final class Ask {

        final String ex;
        final String question;
        final String[] answers;
        final int[] values;

        Ask(String ex, String question, String[] answers, int[] values) {
            this.ex = ex;
            this.question = question;
            this.answers = answers;
            this.values = values;
        }

        static Ask parse(JSONObject o) {
            if (o == null) return null;
            JSONArray a = o.optJSONArray("o");
            JSONArray v = o.optJSONArray("v");
            if (a == null || v == null || a.length() != 3 || v.length() != 3) return null;
            String ex = o.optString("ex", "");
            if (ex.isEmpty()) return null;
            return new Ask(
                ex,
                o.optString("q", ""),
                new String[] { a.optString(0, ""), a.optString(1, ""), a.optString(2, "") },
                new int[] { v.optInt(0, 0), v.optInt(1, 0), v.optInt(2, 0) }
            );
        }
    }

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
        motionRest = o.optBoolean("motionRest", false);
        cue = o.optString("cue", "");
        taken = o.optString("taken", "");
        why = o.optString("why", "");
        timer = phases(o.optJSONArray("timer"));
        adj = Adj.parse(o.optJSONObject("adj"));
        ask = Ask.parse(o.optJSONObject("ask"));
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

    /** Whether to stream motion now: the phone asked for it, and rest hasn't started on this watch's clock (or the
     * phone wants rest too, to see the next set start). */
    boolean streamMotion(long now) {
        return motion && (motionRest || !resting(now));
    }

    /** Whether going from `prev` to this state should buzz: a new cue during the same workout. */
    boolean newCue(WorkoutState prev) {
        return !cue.isEmpty() && prev != null && prev.sessionId.equals(sessionId) && !cue.equals(prev.cue);
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
