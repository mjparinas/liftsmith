package com.getliftsmith.app;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** What the watch may send. Anything else is dropped, so a bad message can't reach the web app. */
final class WatchMessages {

    private WatchMessages() {}

    /** The pieces of the home-screen widget's snapshot (src/lib/widget.ts) the watches show. */
    private static final String[] TODAY_KEYS = { "day", "kind", "title", "why", "stale" };
    private static final String[] TODAY_WATCH_KEYS = { "call", "mins", "ready" };

    /**
     * Today's call for the watch tile, complication and glance, from the widget's snapshot: {day, kind, title, why,
     * stale, call, mins, ready}, all strings. Null for an empty snapshot (signed out, device erased), which clears the
     * watch. An app from before the watch part (no "watch") still gives the title as the call.
     */
    static JSONObject today(String snapshot) {
        try {
            JSONObject s = new JSONObject(snapshot);
            if (s.optInt("v", 0) != 1) return null;
            JSONObject out = new JSONObject();
            for (String k : TODAY_KEYS) out.put(k, s.optString(k, ""));
            JSONObject w = s.optJSONObject("watch");
            for (String k : TODAY_WATCH_KEYS) out.put(k, w == null ? "" : w.optString(k, ""));
            if (out.optString("call").isEmpty()) out.put("call", out.optString("title"));
            return out;
        } catch (JSONException | NullPointerException e) {
            return null;
        }
    }

    /** The most a carried plan may weigh (src/lib/watchWorkout.ts Carry): 80 steps of words with plenty to spare. */
    static final int MAX_CARRY = 48_000;

    /** Today's carried plan as the watch keeps it, or null to take it off (empty, "{}", too big or not a plan). */
    static String carry(String json) {
        if (json == null || json.length() > MAX_CARRY) return null;
        try {
            JSONObject o = new JSONObject(json);
            if (o.optInt("v", 0) != 1 || o.optString("id", "").isEmpty() || o.optJSONArray("st") == null || o.optJSONArray("ex") == null) return null;
            return o.toString();
        } catch (JSONException e) {
            return null;
        }
    }

    /** "log", "add30" or "taken" (Machine taken, src/lib/takenSwap.ts), or null. */
    static String action(String body) {
        return "log".equals(body) || "add30".equals(body) || "taken".equals(body) ? body : null;
    }

    /**
     * A tap from a watch and what came with it (docs/decisions/watch-apps.md "Adjust and rate a set"): Log set and
     * adjust may carry the weight and reps the watch settled on, rate carries how the exercise felt. `data` is clean
     * JSON for the web app (which checks it against the set again, watchAdjust.ts), or null for a plain tap.
     */
    static final class Tap {

        final String action;
        final String data;

        Tap(String action, String data) {
            this.action = action;
            this.data = data;
        }
    }

    /** Reads a field the way both a JSON message (Wear OS) and a Connect IQ dictionary (Garmin) hold it. */
    interface Fields {
        Object get(String key);
    }

    /** A plain "log" or "add30", or {"a": "log" | "add30" | "adjust" | "rate" | "timer", ...}; null for anything else. */
    static Tap tap(String body) {
        if (body == null || body.length() > 1000) return null;
        String plain = action(body);
        if (plain != null) return new Tap(plain, null);
        try {
            JSONObject o = new JSONObject(body);
            return tap(o::opt);
        } catch (JSONException e) {
            return null;
        }
    }

    /** The same from any message's fields. */
    static Tap tap(Fields f) {
        Object a = f.get("a");
        if (!("log".equals(a) || "add30".equals(a) || "adjust".equals(a) || "rate".equals(a) || "timer".equals(a))) return null;
        String action = (String) a;
        JSONObject d = new JSONObject();
        try {
            Object key = f.get("key");
            if (key instanceof String && ((String) key).length() <= 120) d.put("key", key);
            Object kg = f.get("kg");
            if (kg instanceof Number && Double.isFinite(((Number) kg).doubleValue())) d.put("kg", ((Number) kg).doubleValue());
            Object reps = f.get("reps");
            if (reps instanceof Number) d.put("reps", ((Number) reps).intValue());
            Object ex = f.get("ex");
            if (ex instanceof String && ((String) ex).length() <= 120) d.put("ex", ex);
            Object v = f.get("v");
            if (v instanceof Number && Math.abs(((Number) v).intValue()) <= 1) d.put("v", ((Number) v).intValue());
        } catch (JSONException e) {
            return null;
        }
        if ("rate".equals(action) && (!d.has("ex") || !d.has("v"))) return null;
        if ("adjust".equals(action) && (!d.has("key") || !d.has("reps"))) return null;
        // Start timer names the set it's for, so a tap that arrives late can't start the next set's timer.
        if ("timer".equals(action) && !d.has("key")) return null;
        return new Tap(action, d.length() == 0 ? null : d.toString());
    }

    /** A heart rate in beats per minute, or 0 when it isn't a believable one (30 to 240). */
    static int bpm(String body) {
        try {
            int b = Integer.parseInt(body.trim());
            return b >= 30 && b <= 240 ? b : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /** The most readings one motion batch may carry: 4 s at 50 Hz (src/lib/reps/watchMotion.ts MAX_BATCH). */
    static final int MAX_MOTION = 200;

    /**
     * A motion batch for watch rep counting (Labs): {"t": first reading's time in ms, "s": [ms after t, up, rot, ...]},
     * or null when it isn't one. The web app checks every reading again (parseWatchMotion).
     */
    static JSONObject motion(String body) {
        if (body == null || body.length() > 16_000) return null;
        try {
            JSONObject o = new JSONObject(body);
            double t = o.getDouble("t");
            JSONArray s = o.getJSONArray("s");
            if (Double.isNaN(t) || Double.isInfinite(t) || s.length() % 3 != 0 || s.length() > MAX_MOTION * 3) return null;
            JSONArray clean = new JSONArray();
            for (int i = 0; i < s.length(); i++) {
                double v = s.getDouble(i);
                if (Double.isNaN(v) || Double.isInfinite(v)) return null;
                clean.put(v);
            }
            return new JSONObject().put("t", t).put("s", clean);
        } catch (JSONException e) {
            return null;
        }
    }
}
