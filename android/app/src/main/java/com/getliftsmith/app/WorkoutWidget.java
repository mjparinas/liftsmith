package com.getliftsmith.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import java.util.Calendar;
import java.util.Locale;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Home-screen widget: today's call and length with its one-line why, the weekly goal and the top coach's note, with
 * Start (Resume and Log set while a workout runs). One resizable widget; lines appear as it grows. The web app builds
 * every line (src/lib/widget.ts) and hands it over through WorkoutSessionPlugin.setWidget, so this class only draws.
 * Buttons open liftsmith:// links that WorkoutSessionPlugin hands to src/lib/shortcuts.ts. iOS counterpart:
 * QuickStartWidget.swift.
 *
 * Battery: no periodic updates (updatePeriodMillis is 0). It redraws when the app sends a new snapshot, and once
 * after midnight on a non-waking alarm, so yesterday's plan turns into "open for today's plan" instead of lingering.
 */
public class WorkoutWidget extends AppWidgetProvider {

    static final String PREFS = "liftsmith_widget";
    static final String KEY = "json";

    /** Saves the app's snapshot and redraws every placed widget. */
    static void save(Context context, String json) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply();
        refresh(context);
    }

    static void refresh(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, WorkoutWidget.class));
        for (int id : ids) draw(context, manager, id);
        if (ids.length > 0) scheduleMidnight(context);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) draw(context, manager, id);
        scheduleMidnight(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        draw(context, manager, id);
    }

    @Override
    public void onDisabled(Context context) {
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        if (alarms != null) alarms.cancel(midnightIntent(context));
    }

    private static void draw(Context context, AppWidgetManager manager, int id) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_workout);
        Bundle options = manager.getAppWidgetOptions(id);
        // The tallest the launcher gives it (portrait). Under 100 dp: buttons only; under 170 dp: title and why; then everything.
        int h = options == null ? 0 : options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        int size = h == 0 ? 1 : h < 100 ? 0 : h < 170 ? 1 : 2;

        JSONObject s = snapshot(context);
        boolean stale = s != null && !today().equals(s.optString("day"));
        String start = s == null || stale ? context.getString(R.string.shortcut_start_short) : s.optString("start");
        String log = s == null ? context.getString(R.string.shortcut_log_short) : stale ? "" : s.optString("log");

        v.setViewVisibility(R.id.widget_info, size == 0 || s == null ? View.GONE : View.VISIBLE);
        if (s != null) {
            v.setTextViewText(R.id.widget_title, stale ? context.getString(R.string.widget_title) : s.optString("title"));
            v.setInt(R.id.widget_dot, "setColorFilter", colour(stale ? "normal" : s.optString("kind")));
            String why = stale ? s.optString("stale") : s.optString("why");
            text(v, R.id.widget_why, why, size >= 1);
            text(v, R.id.widget_goal, stale ? "" : s.optString("goal"), size >= 2);
            text(v, R.id.widget_note, stale ? "" : s.optString("note"), size >= 2);
        }
        v.setTextViewText(R.id.widget_start, start);
        v.setTextViewText(R.id.widget_log, log);
        v.setViewVisibility(R.id.widget_log, log.isEmpty() ? View.GONE : View.VISIBLE);
        v.setOnClickPendingIntent(R.id.widget_start, link(context, "start", 1));
        v.setOnClickPendingIntent(R.id.widget_log, link(context, "log", 2));
        // The text opens the app on Today, where the full plan and the coach's notes are.
        v.setOnClickPendingIntent(R.id.widget_info, open(context));
        manager.updateAppWidget(id, v);
    }

    private static void text(RemoteViews v, int id, String value, boolean fits) {
        boolean show = fits && value != null && !value.isEmpty();
        v.setViewVisibility(id, show ? View.VISIBLE : View.GONE);
        if (show) v.setTextViewText(id, value);
    }

    /** The app's call colours (src/components/app/theme.ts): push ember, normal blue, easy and rest cyan, active mint. */
    static int colour(String kind) {
        switch (kind) {
            case "push":
                return 0xFFFF8A3D;
            case "recover":
            case "rest":
                return 0xFF38D6E8;
            case "active":
                return 0xFF34D399;
            case "program":
                return 0xFFA78BFA;
            default:
                return 0xFF4C8DFF;
        }
    }

    private static JSONObject snapshot(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY, null);
        if (json == null) return null;
        try {
            JSONObject o = new JSONObject(json);
            return o.optInt("v") == 1 ? o : null;
        } catch (JSONException e) {
            return null;
        }
    }

    /** Same format as dayKey in src/lib/random.ts: local year-month-day, no padding. */
    static String today() {
        Calendar c = Calendar.getInstance();
        return String.format(Locale.ROOT, "%d-%d-%d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    /** One inexact, non-waking alarm a minute after midnight: it fires when the phone next wakes on its own. */
    private static void scheduleMidnight(Context context) {
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        if (alarms == null) return;
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, 1);
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 1);
        c.set(Calendar.SECOND, 0);
        alarms.set(AlarmManager.RTC, c.getTimeInMillis(), midnightIntent(context));
    }

    private static PendingIntent midnightIntent(Context context) {
        Intent i = new Intent(context, WorkoutWidget.class).setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] ids = AppWidgetManager.getInstance(context).getAppWidgetIds(new ComponentName(context, WorkoutWidget.class));
        i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        return PendingIntent.getBroadcast(context, 3, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private static PendingIntent link(Context context, String action, int code) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("liftsmith://" + action))
            .setClass(context, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private static PendingIntent open(Context context) {
        Intent i = new Intent(context, MainActivity.class).setAction(Intent.ACTION_MAIN).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, 4, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
}
