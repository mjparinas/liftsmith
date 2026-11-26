package com.getliftsmith.app.wear;

import java.util.Calendar;
import org.json.JSONObject;

/**
 * Today's call as the phone sends it for the tile and the complication (the phone's WatchMessages.today, built from
 * the home-screen widget's snapshot in src/lib/widget.ts): the day it was made for, the kind of day, "Push · 45 min",
 * the reason, and the short pieces a watch face has room for. Plain data, so it's tested without a watch.
 */
final class TodayState {

    final String day;
    /** push, normal, recover, program, rest or active (a workout is running). */
    final String kind;
    final String title;
    final String why;
    /** Shown instead of the plan once the day has passed ("Open Liftsmith for today's plan."). */
    final String stale;
    final String call;
    final String mins;
    final String ready;

    private TodayState(JSONObject o) {
        day = o.optString("day", "");
        kind = o.optString("kind", "");
        title = o.optString("title", "");
        why = o.optString("why", "");
        stale = o.optString("stale", "");
        String c = o.optString("call", "");
        call = c.isEmpty() ? title : c;
        mins = o.optString("mins", "");
        ready = o.optString("ready", "");
    }

    /** Null for nothing or junk. */
    static TodayState parse(String json) {
        if (json == null || json.isEmpty()) return null;
        try {
            TodayState t = new TodayState(new JSONObject(json));
            return t.day.isEmpty() || t.title.isEmpty() ? null : t;
        } catch (Exception e) {
            return null;
        }
    }

    /** The phone's day key (src/lib/random.ts dayKey): "2026-11-26" without leading zeros, on the watch's clock. */
    static String dayKey(long ms) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(ms);
        return c.get(Calendar.YEAR) + "-" + (c.get(Calendar.MONTH) + 1) + "-" + c.get(Calendar.DAY_OF_MONTH);
    }

    /** Made for today. Yesterday's plan is never shown as today's: the tile says `stale` instead. */
    boolean current(long now) {
        return day.equals(dayKey(now));
    }

    boolean active() {
        return "active".equals(kind);
    }

    /** "45 min · Readiness 82", leaving out what's empty. */
    String detail() {
        if (mins.isEmpty()) return ready;
        return ready.isEmpty() ? mins : mins + " · " + ready;
    }

    /** Milliseconds until the watch's next midnight, when today's call goes stale. */
    static long untilMidnight(long now) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(now);
        c.add(Calendar.DAY_OF_MONTH, 1);
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 5);
        c.set(Calendar.MILLISECOND, 0);
        return Math.max(60_000L, c.getTimeInMillis() - now);
    }
}
