package com.liftsmith.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

/**
 * Home-screen widget with Start workout and Log set. Each button opens a liftsmith:// link that WorkoutSessionPlugin
 * hands to src/lib/shortcuts.ts, so it behaves like every other shortcut. iOS counterpart: QuickStartWidget.swift.
 */
public class WorkoutWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_workout);
        views.setOnClickPendingIntent(R.id.widget_start, open(context, "start", 1));
        views.setOnClickPendingIntent(R.id.widget_log, open(context, "log", 2));
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    private static PendingIntent open(Context context, String action, int code) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("liftsmith://" + action))
            .setClass(context, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
}
