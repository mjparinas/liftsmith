package com.getliftsmith.app;

import android.app.PendingIntent;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/**
 * Quick Settings tile (swipe down twice, edit, drag in "Liftsmith"). It reads "Start workout" and opens today's
 * workout, or "Log set" while one is running and logs the set as planned. iOS counterpart: the App Shortcuts in
 * ShortcutIntents.swift, which can sit in Control Center as a Shortcut control or on the Action button.
 */
public class WorkoutTileService extends TileService {

    @Override
    public void onStartListening() {
        Tile tile = getQsTile();
        if (tile == null) return;
        boolean on = WorkoutService.running;
        tile.setState(on ? Tile.STATE_ACTIVE : Tile.STATE_INACTIVE);
        tile.setLabel(getString(R.string.app_name));
        if (Build.VERSION.SDK_INT >= 29) tile.setSubtitle(getString(on ? R.string.shortcut_log_short : R.string.shortcut_start_short));
        tile.setContentDescription(getString(on ? R.string.shortcut_log_long : R.string.shortcut_start_long));
        tile.updateTile();
    }

    @Override
    public void onClick() {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(WorkoutService.running ? "liftsmith://log" : "liftsmith://start"))
            .setClass(this, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        Runnable open = () -> launch(i);
        if (isLocked()) unlockAndRun(open);
        else open.run();
    }

    @SuppressWarnings("deprecation")
    private void launch(Intent i) {
        if (Build.VERSION.SDK_INT >= 34) {
            startActivityAndCollapse(PendingIntent.getActivity(this, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        } else {
            startActivityAndCollapse(i);
        }
    }
}
