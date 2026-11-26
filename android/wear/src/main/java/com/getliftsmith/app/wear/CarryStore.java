package com.getliftsmith.app.wear;

import android.content.Context;
import android.content.SharedPreferences;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * What a phone-free workout keeps on the watch (docs/decisions/watch-apps.md "Phone-free workouts"): today's plan as
 * the phone carried it (Data Layer "/liftsmith/carry"), the run in progress, so closing the app loses nothing, and the
 * ids of finished runs still on their way to the phone. A finished run goes as a Data Layer item of its own,
 * "/liftsmith/done/<id>", which the system keeps until the phone is near; the phone deletes it once it's safe, and that
 * tells the watch it arrived (PhoneListenerService).
 */
final class CarryStore {

    static final String PATH_CARRY = "/liftsmith/carry";
    static final String PATH_DONE = "/liftsmith/done/";
    private static final String PREFS = "carry";

    private CarryStore() {}

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** The watch's own date, like the phone's dayKey (src/lib/random.ts: "2026-11-5", no leading zeros). */
    static String today(long now) {
        return new SimpleDateFormat("yyyy-M-d", Locale.ROOT).format(new Date(now));
    }

    static void saveCarry(Context c, String json) {
        prefs(c).edit().putString("plan", json).apply();
    }

    static String rawCarry(Context c) {
        return prefs(c).getString("plan", null);
    }

    static void saveRun(Context c, WatchRun run) {
        prefs(c).edit().putString("run", run == null ? null : run.save()).apply();
    }

    static WatchRun loadRun(Context c) {
        return WatchRun.restore(prefs(c).getString("run", null));
    }

    static Set<String> waiting(Context c) {
        return new HashSet<>(prefs(c).getStringSet("waiting", new HashSet<>()));
    }

    static void addWaiting(Context c, String id) {
        Set<String> w = waiting(c);
        w.add(id);
        prefs(c).edit().putStringSet("waiting", w).apply();
    }

    static void arrived(Context c, String id) {
        Set<String> w = waiting(c);
        if (w.remove(id)) prefs(c).edit().putStringSet("waiting", w).apply();
    }
}
