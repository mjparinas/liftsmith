package com.getliftsmith.app.wear;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * A workout run on the watch with the phone away (docs/decisions/watch-apps.md "Phone-free workouts"). The phone
 * worked today's plan out ahead, step by step (src/lib/watchWorkout.ts Carry), so the watch only walks through it:
 * the set on screen, the rest after each Log set, the weight and reps changed with the crown, and "How did it feel?".
 * It draws itself in the same JSON the phone sends for its own workouts (WorkoutState), so the screen, the buzzes
 * and the heart rate work exactly as they do with the phone. Each Log set is kept with its time, and the finished
 * workout goes back to the phone as a result the phone replays through its own Log set. Plain data: tested without a
 * watch. Apple Watch and Garmin have the same rules (WatchRun.swift in LiftsmithWatch, garmin/source/WatchRun.mc).
 */
final class WatchRun {

    /** A run this old was forgotten on the wrist: it's finished with what was logged. */
    static final long FORGOTTEN_MS = 4L * 60 * 60 * 1000;
    /** The most sets one run keeps, like the phone's RESULT_SETS. */
    static final int MAX_SETS = 120;

    final JSONObject carry;
    final String id;
    final long start;
    /** The step on screen: the next Log set. */
    int k;
    /** The weight (kg, -1 for none) and reps the next Log set logs. */
    double kg;
    int reps;
    long restUntil;
    /** When the set on screen started: the end of the rest before it, or the last Log set. */
    long setFrom;
    /** The step whose exercise "How did it feel?" asks about, or -1. */
    int ask = -1;
    final JSONArray sets;
    final JSONArray rates;
    int hrSum;
    int hrCount;
    int hrMax;
    int hrMin;

    private WatchRun(JSONObject carry, String id, long start, JSONArray sets, JSONArray rates) {
        this.carry = carry;
        this.id = id;
        this.start = start;
        this.sets = sets;
        this.rates = rates;
    }

    // ---------- The carried plan

    /** Today's carried plan, if it's one the watch can run on `day` (y-m-d, the watch's own date). */
    static JSONObject plan(String json, String day) {
        if (json == null || json.isEmpty()) return null;
        try {
            JSONObject c = new JSONObject(json);
            if (c.optInt("v", 0) != 1 || !day.equals(c.optString("day", ""))) return null;
            JSONArray st = c.optJSONArray("st");
            JSONArray ex = c.optJSONArray("ex");
            if (st == null || ex == null || st.length() == 0) return null;
            for (int i = 0; i < st.length(); i++) {
                JSONObject s = st.optJSONObject(i);
                if (s == null || s.optInt("e", -1) < 0 || s.optInt("e", -1) >= ex.length()) return null;
            }
            return c;
        } catch (JSONException e) {
            return null;
        }
    }

    JSONArray steps() {
        return carry.optJSONArray("st");
    }

    JSONObject step(int i) {
        JSONArray st = steps();
        return st == null || i < 0 || i >= st.length() ? null : st.optJSONObject(i);
    }

    JSONObject item(JSONObject step) {
        JSONArray ex = carry.optJSONArray("ex");
        return step == null || ex == null ? null : ex.optJSONObject(step.optInt("e", 0));
    }

    boolean finishedAll() {
        return k >= steps().length();
    }

    static double[] ladder(JSONObject item) {
        JSONArray a = item == null ? null : item.optJSONArray("kg");
        int n = a == null ? 0 : Math.min(a.length(), 40);
        double[] out = new double[n];
        for (int i = 0; i < n; i++) out[i] = a.optDouble(i, 0);
        return out;
    }

    /** The planned weight of a step (-1 for a bodyweight move or a hold). */
    double plannedKg(JSONObject step) {
        double[] l = ladder(item(step));
        int i = step == null ? 0 : step.optInt("i", 0);
        return l.length == 0 ? -1 : l[Math.max(0, Math.min(l.length - 1, i))];
    }

    // ---------- Running it

    /** A new run of `carry` from now, with an id of its own (letters and digits, like the phone wants). */
    static WatchRun start(JSONObject carry, long now, long salt) {
        String id = "w" + Long.toString(now, 36) + Long.toString(Math.abs(salt) % 1_000_000L, 36);
        WatchRun r = new WatchRun(carry, id, now, new JSONArray(), new JSONArray());
        r.load(0, now);
        r.setFrom = now;
        return r;
    }

    /** Puts step `i` on screen with its planned weight and reps. */
    private void load(int i, long now) {
        k = i;
        JSONObject s = step(i);
        if (s == null) return;
        kg = plannedKg(s);
        reps = Math.max(1, s.optInt("r", 1));
    }

    /** Whether the set on screen can be changed (not a hold), and whether it has a weight to change. */
    boolean adjustable() {
        JSONObject s = step(k);
        return s != null && s.optInt("a", 0) == 1;
    }

    /** Log set: the set on screen with `kg` and `reps` when the watch changed them, at `now`, then rest. */
    void log(long now, Double withKg, Integer withReps) {
        JSONObject s = step(k);
        if (s == null || sets.length() >= MAX_SETS) return;
        if (adjustable()) adjust(withKg, withReps);
        try {
            sets.put(new JSONArray().put(k).put(now).put(kg < 0 ? -1 : kg).put(reps).put(Math.max(start, Math.min(setFrom, now))));
        } catch (JSONException ignored) {
            return;
        }
        double keptKg = kg;
        int keptReps = reps;
        ask = s.optInt("f", 0) == 1 ? k : ask;
        int rest = s.optInt("s", 0);
        load(k + 1, now);
        JSONObject next = step(k);
        // The next set of the same exercise keeps what was dialled in, as on the phone.
        if (next != null && next.optInt("c", 0) == 1) {
            kg = keptKg;
            reps = keptReps;
        }
        restUntil = rest > 0 && next != null ? now + rest * 1000L : 0;
        setFrom = restUntil > 0 ? restUntil : now;
    }

    /** A weight from the ladder (the nearest step to it) and reps from 1 to 100. Null leaves either as it is. */
    void adjust(Double withKg, Integer withReps) {
        if (!adjustable()) return;
        double[] l = ladder(item(step(k)));
        if (withKg != null && l.length > 0) {
            int best = 0;
            for (int i = 0; i < l.length; i++) if (Math.abs(l[i] - withKg) < Math.abs(l[best] - withKg)) best = i;
            kg = l[best];
        }
        if (withReps != null) reps = Math.max(1, Math.min(100, withReps));
    }

    void add30(long now) {
        if (restUntil > now) {
            restUntil += 30_000L;
            setFrom = restUntil;
        }
    }

    /** "How did it feel?": 1 too easy, 0 about right, -1 too hard, for the exercise just finished. */
    void rate(int v) {
        if (ask < 0 || v < -1 || v > 1) return;
        rates.put(new JSONArray().put(ask).put(v));
        ask = -1;
    }

    /** A reading from the watch's heart rate sensor, for the workout's average, highest and lowest. */
    void heartRate(int bpm) {
        if (bpm < 30 || bpm > 240) return;
        hrSum += bpm;
        hrCount++;
        hrMax = Math.max(hrMax, bpm);
        hrMin = hrMin == 0 ? bpm : Math.min(hrMin, bpm);
    }

    boolean forgotten(long now) {
        long last = sets.length() == 0 ? start : sets.optJSONArray(sets.length() - 1).optLong(1, start);
        return now - last > FORGOTTEN_MS;
    }

    // ---------- What the screen shows: the phone's own workout JSON (WorkoutState)

    String state(long now) {
        JSONObject o = new JSONObject();
        try {
            o.put("at", now);
            o.put("sessionId", id);
            o.put("vibrate", carry.optBoolean("vib", true));
            o.put("warn", carry.optBoolean("warn", false));
            o.put("done", sets.length());
            o.put("total", steps().length());
            if (ask >= 0) {
                JSONObject asked = item(step(ask));
                JSONArray answers = carry.optJSONArray("o");
                if (asked != null && answers != null && answers.length() == 3) {
                    o.put(
                        "ask",
                        new JSONObject()
                            .put("ex", Integer.toString(ask))
                            .put("q", asked.optString("q", ""))
                            .put("o", answers)
                            .put("v", new JSONArray().put(1).put(0).put(-1))
                    );
                }
            }
            JSONObject s = step(k);
            if (s == null) {
                o.put("title", carry.optString("done", ""));
                o.put("setLabel", "");
                o.put("next", carry.optString("fin", ""));
                return o.toString();
            }
            JSONObject item = item(s);
            boolean resting = restUntil > now;
            o.put("title", item == null ? "" : item.optString(resting ? "rt" : "n", ""));
            o.put("setLabel", s.optString("l", ""));
            o.put("next", text(s, item));
            if (resting) o.put("restUntil", restUntil);
            if (adjustable() && item != null) {
                double[] l = ladder(item);
                int at = 0;
                for (int i = 0; i < l.length; i++) if (Math.abs(l[i] - kg) < Math.abs(l[at] - kg)) at = i;
                JSONArray kgs = new JSONArray();
                for (double x : l) kgs.put(x);
                o.put(
                    "adj",
                    new JSONObject()
                        .put("key", id + ":" + k)
                        .put("kg", kgs)
                        .put("w", item.optJSONArray("w") == null ? new JSONArray() : item.optJSONArray("w"))
                        .put("i", at)
                        .put("reps", reps)
                        .put("rs", item.optString("rs", ""))
                );
            }
        } catch (JSONException ignored) {
            // Plain values; never thrown.
        }
        return o.toString();
    }

    /** The set in words: the phone's own while it's as planned, else the ladder's words for the weight and the reps. */
    private String text(JSONObject s, JSONObject item) {
        if (item == null || (Math.abs(kg - plannedKg(s)) < 1e-6 && reps == s.optInt("r", 1))) return s.optString("t", "");
        double[] l = ladder(item);
        JSONArray w = item.optJSONArray("w");
        String rs = item.optString("rs", "");
        String r = reps + (rs.isEmpty() ? "" : " " + rs);
        if (l.length == 0 || w == null) return r;
        int at = 0;
        for (int i = 0; i < l.length; i++) if (Math.abs(l[i] - kg) < Math.abs(l[at] - kg)) at = i;
        return w.optString(at, "") + " × " + r;
    }

    // ---------- Back to the phone

    /** What the phone saves (src/lib/watchWorkout.ts parseWatchResult), or null when no set was logged. */
    String result(long now) {
        if (sets.length() == 0) return null;
        JSONObject o = new JSONObject();
        try {
            long end = Math.max(start, sets.optJSONArray(sets.length() - 1).optLong(1, now));
            o.put("v", 1).put("id", id).put("c", carry.optString("id", "")).put("start", start).put("end", Math.max(end, Math.min(now, end + 120_000L)));
            o.put("sets", sets).put("rates", rates);
            JSONArray hr = new JSONArray();
            if (hrCount > 0) hr.put(Math.round((float) hrSum / hrCount)).put(hrMax).put(hrMin);
            o.put("hr", hr);
        } catch (JSONException e) {
            return null;
        }
        return o.toString();
    }

    // ---------- Kept on the watch, so a run survives the app being closed

    String save() {
        JSONObject o = new JSONObject();
        try {
            o.put("carry", carry).put("id", id).put("start", start).put("k", k).put("kg", kg).put("reps", reps);
            o.put("restUntil", restUntil).put("setFrom", setFrom).put("ask", ask).put("sets", sets).put("rates", rates);
            o.put("hr", new JSONArray().put(hrSum).put(hrCount).put(hrMax).put(hrMin));
        } catch (JSONException e) {
            return null;
        }
        return o.toString();
    }

    static WatchRun restore(String json) {
        if (json == null || json.isEmpty()) return null;
        try {
            JSONObject o = new JSONObject(json);
            JSONObject carry = o.getJSONObject("carry");
            WatchRun r = new WatchRun(carry, o.getString("id"), o.getLong("start"), o.optJSONArray("sets") == null ? new JSONArray() : o.getJSONArray("sets"), o.optJSONArray("rates") == null ? new JSONArray() : o.getJSONArray("rates"));
            r.k = o.optInt("k", 0);
            r.kg = o.optDouble("kg", -1);
            r.reps = o.optInt("reps", 1);
            r.restUntil = o.optLong("restUntil", 0);
            r.setFrom = o.optLong("setFrom", r.start);
            r.ask = o.optInt("ask", -1);
            JSONArray hr = o.optJSONArray("hr");
            if (hr != null && hr.length() == 4) {
                r.hrSum = hr.optInt(0);
                r.hrCount = hr.optInt(1);
                r.hrMax = hr.optInt(2);
                r.hrMin = hr.optInt(3);
            }
            return r.steps() == null ? null : r;
        } catch (JSONException e) {
            return null;
        }
    }
}
