package com.getliftsmith.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Recovery widget (Melvin chose it, 2026-11-15): which body areas are ready to train and which are still recovering,
 * with when each will be ready ("Legs · ready Tue 6 PM"), and Start. Tapping it opens Body's muscle view. The app
 * works out each area's ready time from the same recovery model as the recovery map (src/lib/widget.ts
 * recoveryPart); this class compares those times with the clock as it draws, so an area moves to "ready" without
 * the app. iOS counterpart: RecoveryWidget in RecoveryWeekWidgets.swift.
 *
 * Battery: no periodic updates. One inexact, non-waking alarm at the next ready time (or after midnight, whichever
 * comes first) redraws it when the phone next wakes on its own.
 */
public class RecoveryWidget extends AppWidgetProvider {

    static void refresh(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, RecoveryWidget.class));
        for (int id : ids) draw(context, manager, id);
        if (ids.length > 0) schedule(context);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) draw(context, manager, id);
        schedule(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        draw(context, manager, id);
    }

    @Override
    public void onDisabled(Context context) {
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        if (alarms != null) alarms.cancel(alarm(context));
    }

    private static JSONObject part(Context context) {
        JSONObject s = WorkoutWidget.snapshot(context);
        return s == null ? null : s.optJSONObject("rec");
    }

    private static void draw(Context context, AppWidgetManager manager, int id) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_recovery);
        Bundle options = manager.getAppWidgetOptions(id);
        int h = options == null ? 0 : options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        boolean tall = h == 0 || h >= 110;
        JSONObject r = part(context);
        JSONObject s = WorkoutWidget.snapshot(context);
        long now = System.currentTimeMillis();

        if (r == null) {
            v.setTextViewText(R.id.rec_ready_title, context.getString(R.string.widget_recovery_title));
            v.setViewVisibility(R.id.rec_ready, View.GONE);
            v.setViewVisibility(R.id.rec_resting_title, View.GONE);
            v.setViewVisibility(R.id.rec_resting, View.GONE);
        } else {
            String sep = r.optString("sep", ", ");
            List<String> ready = new ArrayList<>();
            List<String> resting = new ArrayList<>();
            JSONArray areas = r.optJSONArray("areas");
            // The app sends the areas in body order; recovering ones are listed soonest first.
            List<JSONObject> waiting = new ArrayList<>();
            for (int i = 0; areas != null && i < areas.length(); i++) {
                JSONObject a = areas.optJSONObject(i);
                if (a == null) continue;
                if (a.optLong("at") <= now) ready.add(a.optString("n"));
                else waiting.add(a);
            }
            waiting.sort((a, b) -> Long.compare(a.optLong("at"), b.optLong("at")));
            for (JSONObject a : waiting) resting.add(a.optString("line"));

            if (resting.isEmpty()) {
                v.setTextViewText(R.id.rec_ready_title, r.optString("ready"));
                v.setTextViewText(R.id.rec_ready, r.optString("all"));
            } else {
                v.setTextViewText(R.id.rec_ready_title, r.optString("ready"));
                v.setTextViewText(R.id.rec_ready, ready.isEmpty() ? "–" : String.join(sep, ready));
            }
            v.setViewVisibility(R.id.rec_ready, View.VISIBLE);
            boolean showResting = !resting.isEmpty();
            v.setViewVisibility(R.id.rec_resting_title, showResting ? View.VISIBLE : View.GONE);
            v.setTextViewText(R.id.rec_resting_title, r.optString("resting"));
            v.setViewVisibility(R.id.rec_resting, showResting ? View.VISIBLE : View.GONE);
            v.setTextViewText(R.id.rec_resting, String.join("\n", resting));
        }
        v.setTextViewText(R.id.rec_start, s == null ? context.getString(R.string.shortcut_start_short) : s.optString("start"));
        v.setViewVisibility(R.id.rec_start, tall ? View.VISIBLE : View.GONE);
        v.setOnClickPendingIntent(R.id.rec_start, WorkoutWidget.link(context, "start", 7));
        v.setOnClickPendingIntent(R.id.rec_info, WorkoutWidget.link(context, "muscles", 8));
        manager.updateAppWidget(id, v);
    }

    /** The next time the widget changes on its own: the soonest area to become ready, or a minute after midnight. */
    private static void schedule(Context context) {
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        if (alarms == null) return;
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, 1);
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 1);
        c.set(Calendar.SECOND, 0);
        long next = c.getTimeInMillis();
        long now = System.currentTimeMillis();
        JSONObject r = part(context);
        JSONArray areas = r == null ? null : r.optJSONArray("areas");
        for (int i = 0; areas != null && i < areas.length(); i++) {
            JSONObject a = areas.optJSONObject(i);
            long at = a == null ? 0 : a.optLong("at");
            if (at > now && at < next) next = at;
        }
        alarms.set(AlarmManager.RTC, next, alarm(context));
    }

    private static PendingIntent alarm(Context context) {
        Intent i = new Intent(context, RecoveryWidget.class).setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] ids = AppWidgetManager.getInstance(context).getAppWidgetIds(new ComponentName(context, RecoveryWidget.class));
        i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        return PendingIntent.getBroadcast(context, 9, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
}
