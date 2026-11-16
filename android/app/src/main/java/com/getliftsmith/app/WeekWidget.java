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
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * This week widget (Melvin chose it, 2026-11-15): "2 of 4 this week", the streak, a seven-day strip (trained, a
 * stretch day, planned, rest) and what keeps the streak going, with Start. The app builds every line
 * (src/lib/widget.ts weekPart) inside the same snapshot as the Today widget, so this class only draws it. iOS
 * counterpart: WeekWidget in RecoveryWeekWidgets.swift.
 *
 * Battery: no periodic updates. It redraws when the app sends a snapshot and once after midnight on a non-waking
 * alarm, when it asks to open the app instead of showing yesterday's week.
 */
public class WeekWidget extends AppWidgetProvider {

    private static final int[] CELLS = { R.id.week_d0, R.id.week_d1, R.id.week_d2, R.id.week_d3, R.id.week_d4, R.id.week_d5, R.id.week_d6 };
    private static final int[] LETTERS = { R.id.week_l0, R.id.week_l1, R.id.week_l2, R.id.week_l3, R.id.week_l4, R.id.week_l5, R.id.week_l6 };
    private static final int[] DOTS = { R.id.week_m0, R.id.week_m1, R.id.week_m2, R.id.week_m3, R.id.week_m4, R.id.week_m5, R.id.week_m6 };

    static void refresh(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, WeekWidget.class));
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
        if (alarms != null) alarms.cancel(alarm(context));
    }

    private static void draw(Context context, AppWidgetManager manager, int id) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_week);
        Bundle options = manager.getAppWidgetOptions(id);
        // Under 110 dp tall there's only room for the title and the strip; the line and Start come with height.
        int h = options == null ? 0 : options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        boolean tall = h == 0 || h >= 110;

        JSONObject s = WorkoutWidget.snapshot(context);
        JSONObject w = s == null ? null : s.optJSONObject("week");
        boolean stale = s != null && !WorkoutWidget.today().equals(s.optString("day"));
        if (w == null || stale) {
            // Before the app has sent a week (or once the day has passed): the name and the way in.
            v.setTextViewText(R.id.week_title, context.getString(R.string.widget_week_title));
            v.setTextViewText(R.id.week_streak, "");
            v.setViewVisibility(R.id.week_strip, View.GONE);
            String line = s == null ? "" : s.optString("stale");
            v.setTextViewText(R.id.week_why, line);
            v.setViewVisibility(R.id.week_why, line.isEmpty() ? View.GONE : View.VISIBLE);
        } else {
            v.setTextViewText(R.id.week_title, w.optString("title"));
            v.setTextViewText(R.id.week_streak, w.optString("streak"));
            v.setViewVisibility(R.id.week_strip, View.VISIBLE);
            JSONArray days = w.optJSONArray("days");
            for (int i = 0; i < 7; i++) {
                JSONObject d = days == null ? null : days.optJSONObject(i);
                if (d == null) {
                    v.setViewVisibility(CELLS[i], View.INVISIBLE);
                    continue;
                }
                v.setViewVisibility(CELLS[i], View.VISIBLE);
                boolean today = d.optBoolean("today");
                v.setTextViewText(LETTERS[i], d.optString("l"));
                v.setTextColor(LETTERS[i], today ? 0xFFFFFFFF : 0xFF9AA6B7);
                mark(v, DOTS[i], d.optString("m"));
            }
            // The strip says it in words for screen readers: the title and the line under it.
            v.setContentDescription(R.id.week_strip, w.optString("title") + ". " + w.optString("why"));
            v.setTextViewText(R.id.week_why, w.optString("why"));
            v.setViewVisibility(R.id.week_why, tall ? View.VISIBLE : View.GONE);
        }
        v.setTextViewText(R.id.week_start, s == null || stale ? context.getString(R.string.shortcut_start_short) : s.optString("start"));
        v.setViewVisibility(R.id.week_start, tall ? View.VISIBLE : View.GONE);
        v.setOnClickPendingIntent(R.id.week_start, WorkoutWidget.link(context, "start", 5));
        v.setOnClickPendingIntent(R.id.week_info, WorkoutWidget.open(context));
        manager.updateAppWidget(id, v);
    }

    /** Each day's mark has its own shape as well as colour (WCAG 1.4.1): trained and stretch are filled, planned a ring, rest a small dot. */
    private static void mark(RemoteViews v, int id, String m) {
        switch (m) {
            case "done":
                v.setImageViewResource(id, R.drawable.widget_day_done);
                v.setInt(id, "setColorFilter", 0xFF34D399);
                break;
            case "stretch":
                v.setImageViewResource(id, R.drawable.widget_day_done);
                v.setInt(id, "setColorFilter", 0xFF38D6E8);
                break;
            case "plan":
                v.setImageViewResource(id, R.drawable.widget_day_plan);
                v.setInt(id, "setColorFilter", 0xFF4C8DFF);
                break;
            default:
                v.setImageViewResource(id, R.drawable.widget_day_rest);
                v.setInt(id, "setColorFilter", 0xFF5B6777);
        }
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
        alarms.set(AlarmManager.RTC, c.getTimeInMillis(), alarm(context));
    }

    private static PendingIntent alarm(Context context) {
        Intent i = new Intent(context, WeekWidget.class).setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] ids = AppWidgetManager.getInstance(context).getAppWidgetIds(new ComponentName(context, WeekWidget.class));
        i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        return PendingIntent.getBroadcast(context, 6, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
}
