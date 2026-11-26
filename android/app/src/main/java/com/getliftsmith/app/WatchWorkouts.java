package com.getliftsmith.app;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Workouts a watch ran on its own, with the phone away (docs/decisions/watch-apps.md "Phone-free workouts"). Each one
 * arrives once the watch is near again, whether or not the app is open (WatchListenerService for Wear OS, GarminLink
 * for Garmin), and waits here until the web app has saved it (src/lib/watchWorkout.ts, WorkoutSessionPlugin
 * watchWorkouts and doneWatchWorkout). Kept in its own prefs file, which stays out of phone backups like the rest of
 * the app's data. iOS counterpart: WatchWorkouts in WatchLink.swift.
 */
final class WatchWorkouts {

    static final String PREFS = "liftsmith_watch_workouts";
    private static final String KEY = "list";
    /** A month of watch-only training; anything past this waits on the watch for the next time. */
    static final int MAX = 30;
    /** The most a result may weigh: 120 sets with room to spare (src/lib/watchWorkout.ts parseWatchResult). */
    static final int MAX_CHARS = 64_000;
    static final String BROADCAST = "com.getliftsmith.app.WATCH_WORKOUT";

    private WatchWorkouts() {}

    /** The result's id when it looks like one (letters, digits, - and _, 4 to 64 of them), or null. */
    static String idOf(JSONObject o) {
        String id = o == null ? null : o.optString("id", null);
        return id != null && id.matches("[A-Za-z0-9_-]{4,64}") ? id : null;
    }

    /** A watch's result, checked for shape only (the web app checks every set again), or null. */
    static JSONObject parse(String json) {
        if (json == null || json.length() > MAX_CHARS) return null;
        try {
            JSONObject o = new JSONObject(json);
            if (idOf(o) == null || o.optString("c", "").isEmpty() || o.optJSONArray("sets") == null) return null;
            return o;
        } catch (JSONException e) {
            return null;
        }
    }

    /** Keeps one; the same id twice is kept once. False when it isn't one, or there's no room. */
    static synchronized boolean add(Context context, String json) {
        JSONObject o = parse(json);
        if (o == null) return false;
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONArray list = read(p);
        String id = idOf(o);
        for (int i = 0; i < list.length(); i++) if (id.equals(idOf(list.optJSONObject(i)))) return true;
        if (list.length() >= MAX) return false;
        list.put(o);
        p.edit().putString(KEY, list.toString()).commit();
        return true;
    }

    static synchronized List<JSONObject> all(Context context) {
        JSONArray list = read(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE));
        List<JSONObject> out = new ArrayList<>();
        for (int i = 0; i < list.length(); i++) {
            JSONObject o = list.optJSONObject(i);
            if (o != null) out.add(o);
        }
        return out;
    }

    /** Saved by the web app (or not one it can save): forgotten. */
    static synchronized void remove(Context context, String id) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONArray list = read(p);
        JSONArray keep = new JSONArray();
        for (int i = 0; i < list.length(); i++) {
            JSONObject o = list.optJSONObject(i);
            if (o != null && !id.equals(idOf(o))) keep.put(o);
        }
        p.edit().putString(KEY, keep.toString()).commit();
    }

    private static JSONArray read(SharedPreferences p) {
        try {
            return new JSONArray(p.getString(KEY, "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }
}
