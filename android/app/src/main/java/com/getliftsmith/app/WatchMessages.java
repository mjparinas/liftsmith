package com.getliftsmith.app;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** What the watch may send. Anything else is dropped, so a bad message can't reach the web app. */
final class WatchMessages {

    private WatchMessages() {}

    /** "log" or "add30", or null. */
    static String action(String body) {
        return "log".equals(body) || "add30".equals(body) ? body : null;
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
