import Toybox.Lang;
import Toybox.Time;

//! The workout the phone is running, as GarminLink sends it: {"t" title, "s" set label, "n" the set (weight and
//! reps), "p" plates, "r" seconds of rest left, "h" heart rate the phone has, "v" vibrate when rest ends}, or
//! {"end" => true} when it ended. "k" is the set timer for holds, carries and cardio: its phases as [seconds from now
//! to the start, to the end or -1 for a count-up, label]. Rest is sent as seconds left rather than a time, so the watch's clock and the
//! phone's never have to agree.
class WorkoutState {
    //! A workout the phone stopped updating this long ago was forgotten (the phone ends those after 3 hours).
    const STALE_SEC = 10800;

    var title as String = "";
    var setLabel as String = "";
    var next as String = "";
    var plates as String = "";
    var hr as Number = 0;
    var watchHr as Number = 0;
    var vibrate as Boolean = true;
    //! When rest ends on the watch's clock (seconds), or 0 while lifting.
    var restEnds as Number = 0;
    //! When the last update arrived (seconds), or 0 when no workout is running.
    var at as Number = 0;
    //! The set timer's phases on the watch's clock: [start, end or -1, label], oldest first.
    var timer as Array = [];

    function initialize() {}

    function apply(data) as Void {
        if (!(data instanceof Dictionary) || data.get("end") != null) {
            at = 0;
            restEnds = 0;
            watchHr = 0;
            timer = [];
            return;
        }
        var now = Time.now().value();
        title = text(data.get("t"));
        setLabel = text(data.get("s"));
        next = text(data.get("n"));
        plates = text(data.get("p"));
        hr = whole(data.get("h"));
        vibrate = data.get("v") != false;
        var rest = whole(data.get("r"));
        restEnds = rest > 0 ? now + rest : 0;
        timer = [];
        var k = data.get("k");
        if (k instanceof Array) {
            for (var i = 0; i < k.size() && i < 8; i++) {
                var p = k[i];
                if (p instanceof Array && p.size() == 3) {
                    var end = whole(p[1]);
                    timer.add([now + whole(p[0]), end < 0 ? -1 : now + end, text(p[2])]);
                }
            }
        }
        at = now;
    }

    function active() as Boolean {
        return at > 0 && Time.now().value() - at <= STALE_SEC;
    }

    function restLeft() as Number {
        var left = restEnds - Time.now().value();
        return left > 0 ? left : 0;
    }

    function resting() as Boolean {
        return restLeft() > 0;
    }

    //! The set timer's phase now (started, not ended), or null; never while resting.
    function phase() {
        if (resting()) {
            return null;
        }
        var now = Time.now().value();
        for (var i = 0; i < timer.size(); i++) {
            var p = timer[i] as Array;
            if ((p[0] as Number) <= now && ((p[1] as Number) < 0 || now < (p[1] as Number))) {
                return p;
            }
        }
        return null;
    }

    //! Seconds left in a countdown phase, or seconds so far in a count-up.
    function phaseSeconds(p as Array) as Number {
        var now = Time.now().value();
        var end = p[1] as Number;
        var s = end < 0 ? now - (p[0] as Number) : end - now;
        return s > 0 ? s : 0;
    }

    //! The phone's monitor wins; otherwise the watch's own reading.
    function bpm() as Number {
        return hr > 0 ? hr : watchHr;
    }

    private function text(v) as String {
        if (v == null) {
            return "";
        }
        return v instanceof String ? v : v.toString();
    }

    private function whole(v) as Number {
        if (v instanceof Number) {
            return v;
        }
        if (v instanceof Long || v instanceof Float || v instanceof Double) {
            return v.toNumber();
        }
        return 0;
    }
}

//! 85 seconds is "1:25".
function clock(seconds as Number) as String {
    return Lang.format("$1$:$2$", [seconds / 60, (seconds % 60).format("%02d")]);
}
