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
    /** A timed set the watch can start itself (Start timer), or null (sessionNotify.ts TimerOffer). */
    final Offer ts;
    /** What the watch says once the timer's last phase has run out ("Time's up"). */
    final String timerOver;
    /** The timer started on this watch before the phone's phases arrive (or with the phone asleep), or empty. */
    private List<Phase> started = Collections.emptyList();
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

    /**
     * A timed hold, carry or cardio set the watch can start with its own Start timer (docs/decisions/set-timer.md
     * "Started from the watch"): the set's key, the seconds (each side), 2 for a hold done on each side, a count-up for
     * cardio, the button's words, and the labels for getting set, the first (or only) side, switching and the second.
     * The watch counts it with the phone's own rules (src/lib/setTimer.ts): a 5-second lead-in, and 5 s to switch.
     */
    static final class Offer {

        static final long LEAD_MS = 5000;
        static final long SWITCH_MS = 5000;
        final String key;
        final int secs;
        final int sides;
        final boolean up;
        final String label;
        final String[] labels;
        final String over;

        Offer(String key, int secs, int sides, boolean up, String label, String[] labels, String over) {
            this.key = key;
            this.secs = Math.max(1, secs);
            this.sides = sides == 2 ? 2 : 1;
            this.up = up;
            this.label = label;
            this.labels = labels;
            this.over = over;
        }

        static Offer parse(JSONObject o) {
            if (o == null || o.optString("key", "").isEmpty() || o.optInt("s", 0) < 1) return null;
            JSONArray lb = o.optJSONArray("lb");
            String[] labels = new String[4];
            for (int i = 0; i < 4; i++) labels[i] = lb == null ? "" : lb.optString(i, "");
            return new Offer(o.optString("key"), o.optInt("s"), o.optInt("d", 1), o.optInt("u", 0) == 1, o.optString("l", ""), labels, o.optString("o", ""));
        }

        /** The timer started at `start`, phase by phase, as the phone's timerPhases lays it out. */
        List<Phase> phases(long start) {
            List<Phase> out = new ArrayList<>();
            long lead = start + LEAD_MS;
            out.add(new Phase(start, lead, labels[0]));
            if (up) {
                out.add(new Phase(lead, 0, labels[1]));
                return out;
            }
            long work = secs * 1000L;
            out.add(new Phase(lead, lead + work, labels[1]));
            if (sides == 2) {
                long sw = lead + work + SWITCH_MS;
                out.add(new Phase(lead + work, sw, labels[2]));
                out.add(new Phase(sw, sw + work, labels[3]));
            }
            return out;
        }

        /** When a countdown started at `start` runs out (0 for a count-up, which runs until the set is logged). */
        long end(long start) {
            return up ? 0 : start + LEAD_MS + secs * 1000L * sides + (sides == 2 ? SWITCH_MS : 0);
        }

        /**
         * What Log set saves at `at` for a timer started at `start`: the seconds held ([reps] or, stopped on the second
         * side, [first side, second side]), or null during the lead-in (the set as planned). Like setTimer.ts timerHeld.
         */
        int[] held(long start, long at) {
            long t = at - start - LEAD_MS;
            if (t < 0) return null;
            if (up) return new int[] { (int) Math.max(1, t / 1000) };
            long work = secs * 1000L;
            if (t < work) return new int[] { (int) Math.max(1, t / 1000) };
            if (sides == 1 || t < work + SWITCH_MS) return new int[] { secs };
            long t2 = t - work - SWITCH_MS;
            if (t2 < work) return new int[] { secs, (int) Math.max(0, t2 / 1000) };
            return new int[] { secs };
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

    private WorkoutState(JSONObject o, long shift) {
        title = o.optString("title", "");
        setLabel = o.optString("setLabel", "");
        next = o.optString("next", "");
        plates = o.optString("plates", "");
        long rest = o.isNull("restUntil") ? 0L : o.optLong("restUntil", 0L);
        // Times from the phone are on its clock; `shift` moves them onto this watch's (WatchClock).
        restUntil = rest > 0 ? rest + shift : 0L;
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
        timer = phases(o.optJSONArray("timer"), shift);
        ts = Offer.parse(o.optJSONObject("ts"));
        timerOver = o.optString("timerOver", ts == null ? "" : ts.over);
        adj = Adj.parse(o.optJSONObject("adj"));
        ask = Ask.parse(o.optJSONObject("ask"));
    }

    private static List<Phase> phases(JSONArray a, long shift) {
        if (a == null) return Collections.emptyList();
        List<Phase> out = new ArrayList<>();
        for (int i = 0; i < a.length() && i < 8; i++) {
            JSONObject p = a.optJSONObject(i);
            if (p == null) continue;
            long from = p.optLong("from", 0L);
            long to = p.isNull("to") ? 0L : p.optLong("to", 0L);
            if (from <= 0 || (to > 0 && to <= from)) continue;
            out.add(new Phase(from + shift, to > 0 ? to + shift : 0L, p.optString("label", "")));
        }
        return out;
    }

    /** The set timer's phases: the phone's, or the ones this watch started on its own until the phone's arrive. */
    List<Phase> phases() {
        return timer.isEmpty() ? started : timer;
    }

    /** The set timer's phase at `now` (started, not ended), or null; never while resting. Same rule as the phone's. */
    Phase phase(long now) {
        if (resting(now)) return null;
        for (Phase p : phases()) if (p.from <= now && (p.to == 0 || now < p.to)) return p;
        return null;
    }

    /** A set timer is running or has run out on this set (its phases are known), so Start timer is gone. */
    boolean timing() {
        return !phases().isEmpty();
    }

    /** The countdown has run out and the phone hasn't moved on yet: "Time's up" until the set is logged. */
    boolean timeUp(long now) {
        List<Phase> p = phases();
        if (p.isEmpty() || resting(now)) return false;
        Phase last = p.get(p.size() - 1);
        return last.to > 0 && now >= last.to;
    }

    /** Start timer shows: a timed set offered, lifting, and no timer known for it yet. */
    boolean canStartTimer(long now) {
        return ts != null && !resting(now) && !timing();
    }

    /** This watch's own Start timer for the set `key`, kept on this state while the phone's phases haven't come. */
    WorkoutState withStarted(String key, long start) {
        if (ts != null && ts.key.equals(key) && timer.isEmpty() && start > 0) started = ts.phases(start);
        return this;
    }

    /** The state in a Data Layer item's "json", or null when there's none or it can't be read. */
    static WorkoutState parse(String json) {
        return parse(json, 0L);
    }

    /** The same, with the phone's times moved `shift` ms onto this watch's clock (WatchClock.offset). */
    static WorkoutState parse(String json, long shift) {
        if (json == null || json.isEmpty()) return null;
        try {
            return new WorkoutState(new JSONObject(json), shift);
        } catch (JSONException e) {
            return null;
        }
    }

    /**
     * What the countdown on screen counts to (rest's end, or the set timer phase's end, or its start for a count-up),
     * so the screen can redraw on the second it changes (WatchClock.nextTick); 0 when nothing counts.
     */
    long anchor(long now) {
        if (resting(now)) return restUntil;
        Phase p = phase(now);
        if (p == null) return 0L;
        return p.to > 0 ? p.to : p.from;
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
