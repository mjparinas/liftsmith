package com.getliftsmith.app.wear;

import android.content.ComponentName;
import android.content.Context;
import androidx.wear.tiles.TileService;
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester;

/**
 * Keeps today's call on the watch (it arrives from the phone on the Data Layer path "/liftsmith/today", see
 * PhoneListenerService) and tells the tile and the complication to redraw. Nothing here polls: the phone sends a new
 * call only when one of its lines changes, and the tile asks again once at midnight.
 */
final class TodayStore {

    static final String PATH_TODAY = "/liftsmith/today";
    private static final String PREFS = "today";
    private static final String KEY = "json";

    private TodayStore() {}

    static TodayState load(Context context) {
        return TodayState.parse(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null));
    }

    static String raw(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null);
    }

    /** A new call from the phone, or null when the phone took it away (signed out). */
    static void save(Context context, String json) {
        Context app = context.getApplicationContext();
        app.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply();
        try {
            TileService.getUpdater(app).requestUpdate(TodayTileService.class);
        } catch (Exception ignored) {
            // No tiles on this watch.
        }
        try {
            ComplicationDataSourceUpdateRequester.create(app, new ComponentName(app, TodayComplicationService.class)).requestUpdateAll();
        } catch (Exception ignored) {
            // No watch face using it.
        }
    }
}
