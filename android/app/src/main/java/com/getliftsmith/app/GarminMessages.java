package com.getliftsmith.app;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * What goes to and comes from the Garmin watch app (garmin/source). Plain data, so it's tested without a watch.
 * The phone sends short keys because Connect IQ messages are small and slow: "t" title, "s" set label, "n" the set,
 * "p" plates, "r" seconds of rest left (not a time, so the two clocks never have to agree), "h" heart rate from a
 * Bluetooth monitor, "v" vibrate when rest ends, "w" a heads-up buzz 10 s before rest ends, "k" the set timer's phases as [seconds from now to its start, to its
 * end or -1 for a count-up, label] and "ki" which timer that is, plus the set's weight ladder and "How did it feel?" (below).
 * "x" is what Machine taken swaps to (none: Machine taken is off) and "y" why the exercise is there after one.
 * The watch sends {"a": "log" | "add30" | "taken"}, {"a": "log" | "adjust", "key", "kg", "reps"}, {"a": "rate", "ex", "v"} or {"hr": bpm}.
 * iOS counterpart: GarminLink.swift (GarminMessages).
 */
final class GarminMessages {

    /** Heart-rate-only changes go at most this often, because each message takes a second or two over Bluetooth. */
    static final long HR_ONLY_MS = 10_000;

    private GarminMessages() {}

    /** The notification's state (WorkoutSession.update) as the watch reads it. */
    static Map<String, Object> state(JSONObject s, long now) {
        Map<String, Object> m = new HashMap<>();
        m.put("t", s.optString("title", ""));
        m.put("s", s.optString("setLabel", ""));
        m.put("n", s.optString("next", ""));
        m.put("p", s.optString("plates", ""));
        long restUntil = s.isNull("restUntil") ? 0L : s.optLong("restUntil", 0L);
        m.put("r", restUntil > now ? (int) ((restUntil - now + 999) / 1000) : 0);
        m.put("h", s.optInt("hr", 0));
        m.put("v", s.optBoolean("vibrate", true));
        m.put("w", s.optBoolean("warn", false));
        // Machine taken (src/lib/takenSwap.ts): what UP swaps to, and why the exercise is there after a swap.
        m.put("x", s.optString("taken", ""));
        m.put("y", s.optString("why", ""));
        // The set timer (holds, carries, cardio), in seconds from now like rest, so the two clocks never have to agree.
        List<Object> k = new ArrayList<>();
        JSONArray timer = restUntil > now ? null : s.optJSONArray("timer");
        long first = 0L;
        for (int i = 0; timer != null && i < timer.length() && i < 8; i++) {
            JSONObject p = timer.optJSONObject(i);
            if (p == null) continue;
            long from = p.optLong("from", 0L);
            long to = p.isNull("to") ? 0L : p.optLong("to", 0L);
            if (from <= 0 || (to > 0 && to <= from)) continue;
            if (first == 0L) first = from;
            k.add(Arrays.asList(
                (int) Math.floorDiv(from - now, 1000L),
                to > 0 ? (int) ((to - now + 999) / 1000) : -1,
                p.optString("label", "")
            ));
        }
        m.put("k", k);
        m.put("ki", first > 0 ? String.valueOf(first) : "");
        // Adjust and rate a set (watchAdjust.ts): "ay" the set's key, "ak" the weight ladder in kg, "aw" its words,
        // "ai" where the set's own weight is, "ar" the reps and "ars" the word after them; "qe" the exercise asked
        // about, "q" the question and "qo" its three answers (too easy, about right, too hard).
        JSONObject adj = s.optJSONObject("adj");
        if (adj != null && restUntil <= now) {
            m.put("ay", adj.optString("key", ""));
            m.put("ak", numbers(adj.optJSONArray("kg")));
            m.put("aw", strings(adj.optJSONArray("w")));
            m.put("ai", adj.optInt("i", 0));
            m.put("ar", adj.optInt("reps", 0));
            m.put("ars", adj.optString("rs", ""));
        }
        JSONObject ask = s.optJSONObject("ask");
        if (ask != null) {
            m.put("qe", ask.optString("ex", ""));
            m.put("q", ask.optString("q", ""));
            m.put("qo", strings(ask.optJSONArray("o")));
        }
        return m;
    }

    /**
     * Today's call for the glance (WatchMessages.today), under "g" so the watch never takes it for a workout:
     * {"g": {"d" day, "k" kind, "t" title, "y" why, "c" call, "m" minutes, "r" readiness, "x" stale}}.
     */
    static Map<String, Object> today(JSONObject t) {
        Map<String, Object> g = new HashMap<>();
        String[][] keys = { { "d", "day" }, { "k", "kind" }, { "t", "title" }, { "y", "why" }, { "c", "call" }, { "m", "mins" }, { "r", "ready" }, { "x", "stale" } };
        for (String[] k : keys) g.put(k[0], t == null ? "" : t.optString(k[1], ""));
        Map<String, Object> m = new HashMap<>();
        m.put("g", g);
        return m;
    }

    private static List<Object> numbers(JSONArray a) {
        List<Object> out = new ArrayList<>();
        for (int i = 0; a != null && i < a.length() && i < 24; i++) out.add((float) a.optDouble(i, 0));
        return out;
    }

    private static List<Object> strings(JSONArray a) {
        List<Object> out = new ArrayList<>();
        for (int i = 0; a != null && i < a.length() && i < 24; i++) out.add(a.optString(i, ""));
        return out;
    }

    /** The workout ended: the watch goes back to "No workout running". */
    static Map<String, Object> end() {
        Map<String, Object> m = new HashMap<>();
        m.put("end", true);
        return m;
    }

    /**
     * Whether a new state is worth a message: anything but heart rate changed, or the last one went long enough ago.
     * Rest seconds tick down by themselves on the watch, so a later copy of the same rest isn't a change.
     */
    static boolean worthSending(Map<String, Object> last, Map<String, Object> next, long sinceLastMs) {
        if (last == null) return true;
        for (String k : new String[] { "t", "s", "n", "p", "v", "w", "ki", "x", "y", "ay", "ai", "ar", "qe" }) {
            Object a = last.get(k);
            if (a == null ? next.get(k) != null : !a.equals(next.get(k))) return true;
        }
        boolean wasResting = ((Integer) last.get("r")) > 0;
        boolean resting = ((Integer) next.get("r")) > 0;
        long lastEnds = ((Integer) last.get("r")) * 1000L;
        long nextEnds = ((Integer) next.get("r")) * 1000L + sinceLastMs;
        if (wasResting != resting || (resting && Math.abs(nextEnds - lastEnds) > 1500)) return true;
        return !last.get("h").equals(next.get("h")) && sinceLastMs >= HR_ONLY_MS;
    }

    /** "log", "add30" or "taken" from the watch, or null. */
    static String action(List<Object> message) {
        Object a = field(message, "a");
        return a instanceof String ? WatchMessages.action((String) a) : null;
    }

    /** A tap with what came with it ({"a": "log", "key": …, "kg": …, "reps": …} or {"a": "rate", …}), or null. */
    static WatchMessages.Tap tap(List<Object> message) {
        if (field(message, "a") == null) return null;
        return WatchMessages.tap((String key) -> field(message, key));
    }

    /** A believable heart rate from the watch's sensor (30 to 240), or 0. */
    static int bpm(List<Object> message) {
        Object b = field(message, "hr");
        return b instanceof Number ? WatchMessages.bpm(String.valueOf(((Number) b).intValue())) : 0;
    }

    private static Object field(List<Object> message, String key) {
        if (message == null) return null;
        for (Object o : message) {
            if (o instanceof Map && ((Map<?, ?>) o).containsKey(key)) return ((Map<?, ?>) o).get(key);
        }
        return null;
    }
}
