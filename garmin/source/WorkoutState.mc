import Toybox.Lang;
import Toybox.Time;

//! The workout the phone is running, as GarminLink sends it: {"t" title, "s" set label, "n" the set (weight and
//! reps), "p" plates, "r" seconds of rest left, "h" heart rate the phone has, "v" vibrate when rest ends}, or
//! {"end" => true} when it ended. Rest is sent as seconds left rather than a time, so the watch's clock and the
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

    function initialize() {}

    function apply(data) as Void {
        if (!(data instanceof Dictionary) || data.get("end") != null) {
            at = 0;
            restEnds = 0;
            watchHr = 0;
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
