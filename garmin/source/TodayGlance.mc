import Toybox.Application;
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.Time;
import Toybox.Time.Gregorian;
import Toybox.WatchUi;

//! Today's call as the phone sends it for the glance (GarminMessages.today on Android, WatchMessages.garminToday on
//! iOS), kept in Application.Storage under "today": {"d" day, "k" kind, "t" title, "y" why, "c" call, "m" minutes,
//! "r" readiness, "x" stale}. The glance, the background service and the idle screen all read it from here.
(:glance, :background)
module TodayStore {
    const KEY = "today";

    //! The phone's day key (src/lib/random.ts dayKey): "2026-11-26" without leading zeros, on the watch's clock.
    function dayKey() as String {
        var i = Gregorian.info(Time.now(), Time.FORMAT_SHORT);
        return i.year.format("%d") + "-" + (i.month as Number).format("%d") + "-" + i.day.format("%d");
    }

    function load() as Dictionary? {
        var t = Application.Storage.getValue(KEY);
        return t instanceof Dictionary ? t : null;
    }

    //! Made for today, and not a workout already running (the app shows that itself).
    function current(t as Dictionary?) as Boolean {
        return t != null && dayKey().equals(text(t, "d")) && !"active".equals(text(t, "k"));
    }

    function text(t as Dictionary, key as String) as String {
        var v = t.get(key);
        return v instanceof String ? v : "";
    }

    //! "45 min · Readiness 82", leaving out what's empty.
    function detail(t as Dictionary) as String {
        var m = text(t, "m");
        var r = text(t, "r");
        if (m.length() == 0) {
            return r;
        }
        return r.length() == 0 ? m : m + " · " + r;
    }
}

//! The glance (Melvin picked it, 2026-11-26): today's call from the phone, "Push · 45 min", and under it readiness or
//! the reason. Starting needs the phone, so it says what's waiting; opening it opens the app.
(:glance)
class TodayGlance extends WatchUi.GlanceView {
    function initialize() {
        GlanceView.initialize();
    }

    function onUpdate(dc as Graphics.Dc) as Void {
        var t = TodayStore.load();
        var top;
        var under;
        if (TodayStore.current(t)) {
            var d = t as Dictionary;
            top = TodayStore.text(d, "t");
            under = TodayStore.text(d, "r");
            if (under.length() == 0) {
                under = TodayStore.text(d, "y");
            }
        } else {
            top = WatchUi.loadResource(Rez.Strings.AppName) as String;
            under = t != null && TodayStore.text(t, "x").length() > 0 ? TodayStore.text(t, "x") : WatchUi.loadResource(Rez.Strings.TodayNone) as String;
        }
        var h = dc.getHeight();
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(0, h * 0.3, Graphics.FONT_GLANCE, top, Graphics.TEXT_JUSTIFY_LEFT | Graphics.TEXT_JUSTIFY_VCENTER);
        dc.setColor(0x9aa4b2, Graphics.COLOR_TRANSPARENT);
        dc.drawText(0, h * 0.72, Graphics.FONT_GLANCE, under, Graphics.TEXT_JUSTIFY_LEFT | Graphics.TEXT_JUSTIFY_VCENTER);
    }
}
