package com.getliftsmith.app.wear;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.Icon;
import androidx.wear.watchface.complications.data.ComplicationData;
import androidx.wear.watchface.complications.data.ComplicationType;
import androidx.wear.watchface.complications.data.LongTextComplicationData;
import androidx.wear.watchface.complications.data.MonochromaticImage;
import androidx.wear.watchface.complications.data.NoDataComplicationData;
import androidx.wear.watchface.complications.data.PlainComplicationText;
import androidx.wear.watchface.complications.data.ShortTextComplicationData;
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceService;
import androidx.wear.watchface.complications.datasource.ComplicationRequest;

/**
 * Today's call on the watch face (Melvin picked it, 2026-11-26): the short slot shows the call with its length
 * ("Push", "45 min"), the long one "Push · 45 min" with readiness. A tap opens the watch app, which shows the same
 * call with Start on phone (a tap on a watch face is too easy to make by accident to start anything by itself).
 * Redrawn when the phone sends a new call (TodayStore) and at most hourly by the system, so it turns stale at midnight.
 */
public class TodayComplicationService extends ComplicationDataSourceService {

    @Override
    public void onComplicationRequest(ComplicationRequest request, ComplicationRequestListener listener) {
        try {
            listener.onComplicationData(data(this, request.getComplicationType(), TodayStore.load(this), System.currentTimeMillis()));
        } catch (Exception ignored) {
            // The watch face went away.
        }
    }

    @Override
    public ComplicationData getPreviewData(ComplicationType type) {
        return build(this, type, "Push", "45 min", "Push · 45 min · Readiness 82");
    }

    static ComplicationData data(Context context, ComplicationType type, TodayState t, long now) {
        if (t == null || !t.current(now)) {
            String name = context.getString(R.string.app_name);
            return build(context, type, name, "", t == null ? context.getString(R.string.no_today) : t.stale);
        }
        String line = t.detail().isEmpty() ? t.title : t.call + " · " + t.detail();
        return build(context, type, t.call, t.mins, line);
    }

    private static ComplicationData build(Context context, ComplicationType type, String text, String title, String line) {
        PlainComplicationText said = plain(line.isEmpty() ? text : line);
        MonochromaticImage icon = new MonochromaticImage.Builder(Icon.createWithResource(context, R.drawable.ic_workout)).build();
        PendingIntent tap = PendingIntent.getActivity(
            context,
            0,
            new Intent(context, WorkoutActivity.class),
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        if (type == ComplicationType.SHORT_TEXT) {
            ShortTextComplicationData.Builder b = new ShortTextComplicationData.Builder(plain(text), said).setMonochromaticImage(icon).setTapAction(tap);
            if (!title.isEmpty()) b.setTitle(plain(title));
            return b.build();
        }
        if (type == ComplicationType.LONG_TEXT) {
            LongTextComplicationData.Builder b = new LongTextComplicationData.Builder(plain(line.isEmpty() ? text : line), said)
                .setMonochromaticImage(icon)
                .setTapAction(tap);
            return b.build();
        }
        return new NoDataComplicationData();
    }

    private static PlainComplicationText plain(String s) {
        return new PlainComplicationText.Builder(s).build();
    }
}
