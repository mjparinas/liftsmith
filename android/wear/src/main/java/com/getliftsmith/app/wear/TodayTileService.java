package com.getliftsmith.app.wear;

import android.content.Context;
import androidx.concurrent.futures.CallbackToFutureAdapter;
import androidx.wear.protolayout.ActionBuilders;
import androidx.wear.protolayout.DeviceParametersBuilders.DeviceParameters;
import androidx.wear.protolayout.LayoutElementBuilders;
import androidx.wear.protolayout.ModifiersBuilders;
import androidx.wear.protolayout.ResourceBuilders;
import androidx.wear.protolayout.TimelineBuilders;
import androidx.wear.protolayout.material.Chip;
import androidx.wear.protolayout.material.ChipColors;
import androidx.wear.protolayout.material.Colors;
import androidx.wear.protolayout.material.Text;
import androidx.wear.protolayout.material.Typography;
import androidx.wear.protolayout.material.layouts.PrimaryLayout;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import com.google.common.util.concurrent.ListenableFuture;

/**
 * The Today tile (Melvin picked it, 2026-11-26): today's call from the phone, "Push · 45 min", how long and how ready
 * ("45 min · Readiness 82"), the one-line reason, and Start on phone, which opens the phone app's start shortcut
 * (WorkoutActivity, PhoneLink.START_URI). During a workout it says so and opens the watch app. The tile only draws
 * what TodayStore holds: it asks again when the phone sends a new call and once at midnight, never on a timer.
 */
public class TodayTileService extends TileService {

    private static final String RESOURCES = "1";

    // The app's dark tokens (res/values/colors.xml): watches are always dark.
    private static final int ACCENT = 0xFF4C8DFF;
    private static final int ACCENT_INK = 0xFF06122A;
    private static final int INK = 0xFFEEF2F7;
    private static final int DIM = 0xFFA3AEBD;
    private static final int CARD = 0xFF1A2230;
    private static final Colors COLORS = new Colors(ACCENT, ACCENT_INK, CARD, INK);

    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest request) {
        long now = System.currentTimeMillis();
        LayoutElementBuilders.LayoutElement layout = layout(this, request.getDeviceConfiguration(), TodayStore.load(this), now);
        TileBuilders.Tile tile = new TileBuilders.Tile.Builder()
            .setResourcesVersion(RESOURCES)
            // Once at midnight, so yesterday's plan never shows as today's.
            .setFreshnessIntervalMillis(TodayState.untilMidnight(now))
            .setTileTimeline(TimelineBuilders.Timeline.fromLayoutElement(layout))
            .build();
        return CallbackToFutureAdapter.getFuture((c) -> c.set(tile));
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onTileResourcesRequest(RequestBuilders.ResourcesRequest request) {
        ResourceBuilders.Resources r = new ResourceBuilders.Resources.Builder().setVersion(RESOURCES).build();
        return CallbackToFutureAdapter.getFuture((c) -> c.set(r));
    }

    static LayoutElementBuilders.LayoutElement layout(Context context, DeviceParameters device, TodayState t, long now) {
        boolean current = t != null && t.current(now);
        String label;
        String main;
        String detail = "";
        String why = "";
        boolean start;
        if (t == null) {
            label = context.getString(R.string.tile_label);
            main = context.getString(R.string.no_today);
            start = true;
        } else if (!current) {
            label = context.getString(R.string.tile_label);
            main = t.stale.isEmpty() ? context.getString(R.string.no_today) : t.stale;
            start = true;
        } else if (t.active()) {
            label = context.getString(R.string.tile_label);
            main = t.title;
            start = false;
        } else {
            label = t.call;
            main = t.mins.isEmpty() ? t.title : t.mins;
            detail = t.mins.isEmpty() ? "" : t.ready;
            why = t.why;
            start = true;
        }

        LayoutElementBuilders.Column.Builder body = new LayoutElementBuilders.Column.Builder();
        body.addContent(text(context, main, Typography.TYPOGRAPHY_TITLE3, INK, 2));
        if (!detail.isEmpty()) body.addContent(text(context, detail, Typography.TYPOGRAPHY_CAPTION1, ACCENT, 1));
        if (!why.isEmpty()) body.addContent(text(context, why, Typography.TYPOGRAPHY_CAPTION2, DIM, 2));

        Chip chip = new Chip.Builder(context, click(context, start), device)
            .setPrimaryLabelContent(context.getString(start ? R.string.start_on_phone : R.string.open_app))
            .setChipColors(ChipColors.primaryChipColors(COLORS))
            .build();

        return new PrimaryLayout.Builder(device)
            .setPrimaryLabelTextContent(text(context, label, Typography.TYPOGRAPHY_CAPTION1, ACCENT, 1))
            .setContent(body.build())
            .setPrimaryChipContent(chip)
            .build();
    }

    private static Text text(Context context, String s, int typography, int color, int lines) {
        return new Text.Builder(context, s)
            .setTypography(typography)
            .setColor(androidx.wear.protolayout.ColorBuilders.argb(color))
            .setMaxLines(lines)
            .build();
    }

    /** Opens the watch app; with `start`, it goes straight on to Start on phone (WorkoutActivity.EXTRA_START). */
    private static ModifiersBuilders.Clickable click(Context context, boolean start) {
        ActionBuilders.AndroidActivity.Builder activity = new ActionBuilders.AndroidActivity.Builder()
            .setPackageName(context.getPackageName())
            .setClassName(WorkoutActivity.class.getName());
        if (start) activity.addKeyToExtraMapping(WorkoutActivity.EXTRA_START, new ActionBuilders.AndroidBooleanExtra.Builder().setValue(true).build());
        return new ModifiersBuilders.Clickable.Builder()
            .setId(start ? "start" : "open")
            .setOnClick(new ActionBuilders.LaunchAction.Builder().setAndroidActivity(activity.build()).build())
            .build();
    }
}
