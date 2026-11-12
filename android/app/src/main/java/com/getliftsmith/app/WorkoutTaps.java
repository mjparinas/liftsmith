package com.getliftsmith.app;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Log set and +30 s taps on the workout notification made while the app is closed (its screen, and with it the web
 * app, is gone; the foreground service keeps running). Each tap is kept with its time and handed to the web app when
 * it next opens, which logs it at that time (WorkoutSessionPlugin.load, sessionNotify.ts). Kept in its own prefs file,
 * which stays out of phone backups like the rest of the app's data (data_extraction_rules.xml).
 * iOS counterpart: WorkoutTaps.swift.
 */
final class WorkoutTaps {

    static final String PREFS = "liftsmith_taps";
    private static final String KEY = "taps";
    /** A whole workout of taps is a few dozen; anything past this is a stuck button, not sets. */
    static final int MAX = 200;

    private WorkoutTaps() {}

    static synchronized void add(Context context, String action, long at) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONArray list = parse(p.getString(KEY, "[]"));
        if (list.length() >= MAX) return;
        try {
            list.put(new JSONObject().put("action", action).put("at", at));
        } catch (JSONException ignored) {
            return;
        }
        p.edit().putString(KEY, list.toString()).apply();
    }

    /** Every kept tap, oldest first, and the list emptied. */
    static synchronized List<JSONObject> drain(Context context) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONArray list = parse(p.getString(KEY, "[]"));
        p.edit().remove(KEY).commit();
        List<JSONObject> out = new ArrayList<>();
        for (int i = 0; i < list.length(); i++) {
            JSONObject o = list.optJSONObject(i);
            if (o != null && o.optString("action", null) != null) out.add(o);
        }
        return out;
    }

    static JSONArray parse(String json) {
        try {
            return new JSONArray(json == null ? "[]" : json);
        } catch (JSONException e) {
            return new JSONArray();
        }
    }
}
