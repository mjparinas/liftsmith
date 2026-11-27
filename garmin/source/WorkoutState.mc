import Toybox.Lang;
import Toybox.Time;

//! The workout the phone is running, as GarminLink sends it: {"t" title, "s" set label, "n" the set (weight and
//! reps), "p" plates, "r" seconds of rest left, "h" heart rate the phone has, "v" vibrate when rest ends, "w" a heads-up buzz 10 s before rest ends, "x" what Machine taken swaps to, "y" why the exercise is there after one}, or
//! {"end" => true} when it ended. "k" is the set timer for holds, carries and cardio: its phases as [seconds from now
//! to the start, to the end or -1 for a count-up, label]. Rest is sent as seconds left rather than a time, so the watch's clock and the
//! phone's never have to agree. "ay", "ak", "aw", "ai", "ar" and "ars" are the set to adjust and "qe", "q" and "qo" the
//! "How did it feel?" question (GarminMessages.java, GarminLink.swift; watchAdjust.ts on the phone). "tk", "tn", "td",
//! "tu", "tl", "tb" and "to" are the set timer START can start here: its set's key, seconds (each side), 2 for each side,
//! a count-up, the words for START, the phase labels and what time's up says (timerRun.ts watchTimerOffer).
(:glance, :background)
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
    var warn as Boolean = false;
    //! Machine taken (src/lib/takenSwap.ts): what UP swaps to, or "" when there's nothing to swap to.
    var taken as String = "";
    //! Why the exercise is there after a Machine taken swap, or "".
    var why as String = "";
    //! When rest ends on the watch's clock (seconds), or 0 while lifting.
    var restEnds as Number = 0;
    //! When the last update arrived (seconds), or 0 when no workout is running.
    var at as Number = 0;
    //! The set timer's phases on the watch's clock: [start, end or -1, label], oldest first.
    var timer as Array = [];

    //! Start timer on a timed hold, carry or cardio set (an empty key: none). The same rules as the phone's
    //! src/lib/setTimer.ts: 5 s to get set, then the hold, 5 s to switch and the other side.
    const LEAD_SEC = 5;
    const SWITCH_SEC = 5;
    var tsKey as String = "";
    var tsSecs as Number = 0;
    var tsSides as Number = 1;
    var tsUp as Boolean = false;
    var tsLabel as String = "";
    var tsLabels as Array = [];
    var tsOver as String = "";
    //! The timer started here with START, counted on the watch's own clock until the phone's phases arrive.
    var startedKey as String = "";
    var startedAt as Number = 0;

    //! Adjust a set (watchAdjust.ts): the set's key, the weight ladder in kg and its words, where the set's own
    //! weight is, the reps and the word after them. An empty key means the set can't be changed on the wrist.
    var adjKey as String = "";
    var ladderKg as Array = [];
    var ladderW as Array = [];
    var ladderI as Number = 0;
    var reps as Number = 0;
    var repsWord as String = "";
    //! "How did it feel?" after an exercise's last set: the exercise, the question and its three answers
    //! (too easy, about right, too hard, sent back as 1, 0 and -1). An empty exercise means nothing is asked.
    var askEx as String = "";
    var askQ as String = "";
    var askO as Array = [];
    //! The weight (kg) and reps picked on the watch for the set in editKey, kept as a weight rather than a place on
    //! the ladder so they survive the phone sending a new one; editKg < 0 and editReps 0 mean not changed.
    var editKey as String = "";
    var editKg as Float = -1.0;
    var editReps as Number = 0;
    //! Which number UP and DOWN change: the reps (true) or the weight.
    var onReps as Boolean = false;
    //! The exercise already answered, so the question isn't asked twice.
    var answered as String = "";

    const REPS_MAX = 100;

    function initialize() {}

    function apply(data) as Void {
        if (!(data instanceof Dictionary) || data.get("end") != null) {
            at = 0;
            restEnds = 0;
            watchHr = 0;
            timer = [];
            adjKey = "";
            askEx = "";
            tsKey = "";
            return;
        }
        var now = Time.now().value();
        title = text(data.get("t"));
        setLabel = text(data.get("s"));
        next = text(data.get("n"));
        plates = text(data.get("p"));
        hr = whole(data.get("h"));
        vibrate = data.get("v") != false;
        warn = data.get("w") == true;
        taken = text(data.get("x"));
        why = text(data.get("y"));
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
        tsKey = text(data.get("tk"));
        tsSecs = whole(data.get("tn"));
        tsSides = whole(data.get("td")) == 2 ? 2 : 1;
        tsUp = data.get("tu") == true;
        tsLabel = text(data.get("tl"));
        tsLabels = [];
        var tb = data.get("tb");
        for (var i = 0; i < 4; i++) {
            tsLabels.add(tb instanceof Array && i < tb.size() ? text(tb[i]) : "");
        }
        tsOver = text(data.get("to"));
        if (tsSecs < 1) {
            tsKey = "";
        }
        if (timer.size() == 0 && tsKey.length() > 0 && tsKey.equals(startedKey) && startedAt > 0) {
            timer = phasesFrom(startedAt);
        }
        adjKey = text(data.get("ay"));
        ladderKg = [];
        ladderW = [];
        var ak = data.get("ak");
        var aw = data.get("aw");
        if (ak instanceof Array && aw instanceof Array && ak.size() == aw.size()) {
            for (var i = 0; i < ak.size() && i < 40; i++) {
                ladderKg.add(decimal(ak[i]));
                ladderW.add(text(aw[i]));
            }
        }
        ladderI = whole(data.get("ai"));
        if (ladderI < 0 || ladderI >= ladderKg.size()) {
            ladderI = 0;
        }
        reps = whole(data.get("ar"));
        repsWord = text(data.get("ars"));
        if (adjKey.length() == 0 || reps < 1) {
            adjKey = "";
        }
        if (!adjKey.equals(editKey)) {
            editKey = adjKey;
            editKg = -1.0;
            editReps = 0;
            onReps = false;
        }
        if (ladderKg.size() == 0) {
            onReps = true;
        }
        askEx = text(data.get("qe"));
        askQ = text(data.get("q"));
        askO = [];
        var qo = data.get("qo");
        if (qo instanceof Array && qo.size() == 3) {
            for (var i = 0; i < 3; i++) {
                askO.add(text(qo[i]));
            }
        } else {
            askEx = "";
        }
        if (askEx.length() == 0) {
            answered = "";
        }
        at = now;
    }

    //! The timer started at `start` (seconds), phase by phase, as the phone's timerPhases lays it out.
    function phasesFrom(start as Number) as Array {
        var lead = start + LEAD_SEC;
        var out = [[start, lead, tsLabels[0]]];
        if (tsUp) {
            out.add([lead, -1, tsLabels[1]]);
            return out;
        }
        out.add([lead, lead + tsSecs, tsLabels[1]]);
        if (tsSides == 2) {
            var sw = lead + tsSecs + SWITCH_SEC;
            out.add([lead + tsSecs, sw, tsLabels[2]]);
            out.add([sw, sw + tsSecs, tsLabels[3]]);
        }
        return out;
    }

    //! START starts the set timer: a timed set is on, not resting, and no timer runs yet.
    function canStartTimer() as Boolean {
        return active() && tsKey.length() > 0 && !resting() && timer.size() == 0;
    }

    //! Starts the timer here at `now`, before the phone's phases arrive.
    function startTimer(now as Number) as Void {
        startedKey = tsKey;
        startedAt = now;
        timer = phasesFrom(now);
    }

    //! A countdown that has run out and waits for the set to be logged.
    function timeUp() as Boolean {
        if (timer.size() == 0 || resting()) {
            return false;
        }
        var end = (timer[timer.size() - 1] as Array)[1] as Number;
        return end >= 0 && Time.now().value() >= end;
    }

    //! The set can be changed now: a set is on (not rest, not a set timer) and the phone sent what to change.
    //! Whether Machine taken can swap now: the phone sent a pick and no set timer is running.
    function canTake() as Boolean {
        return active() && taken.length() > 0 && phase() == null;
    }

    function adjustable() as Boolean {
        return active() && adjKey.length() > 0 && !resting() && phase() == null;
    }

    function hasWeight() as Boolean {
        return ladderKg.size() > 0;
    }

    //! The place on the ladder shown: the one nearest the weight picked on the watch, or the set's own.
    function shownIndex() as Number {
        if (editKg < 0 || ladderKg.size() == 0) {
            return ladderI;
        }
        var best = 0;
        for (var i = 1; i < ladderKg.size(); i++) {
            if ((editKg - (ladderKg[i] as Float)).abs() < (editKg - (ladderKg[best] as Float)).abs()) {
                best = i;
            }
        }
        return best;
    }

    function shownReps() as Number {
        return editReps > 0 ? editReps : reps;
    }

    function shownWeight() as String {
        return ladderW.size() > 0 ? ladderW[shownIndex()] as String : "";
    }

    function edited() as Boolean {
        return editKey.length() > 0 && editKey.equals(adjKey) && (editKg >= 0 || editReps > 0);
    }

    //! One step up (1) or down (-1) on the number UP and DOWN change. False at the end of the ladder or the reps.
    function step(dir as Number) as Boolean {
        if (!adjustable()) {
            return false;
        }
        if (onReps || !hasWeight()) {
            var r = shownReps() + dir;
            if (r < 1 || r > REPS_MAX) {
                return false;
            }
            editReps = r;
        } else {
            var i = shownIndex() + dir;
            if (i < 0 || i >= ladderKg.size()) {
                return false;
            }
            editKg = ladderKg[i] as Float;
        }
        editKey = adjKey;
        return true;
    }

    //! What Log set and adjust carry: the set's key, the weight (kg, when it has one) and the reps.
    function values() as Dictionary {
        var m = { "key" => adjKey, "reps" => shownReps() } as Dictionary;
        if (hasWeight()) {
            m.put("kg", ladderKg[shownIndex()]);
        }
        return m;
    }

    //! "How did it feel?" is waiting for an answer.
    function asking() as Boolean {
        return active() && askEx.length() > 0 && !askEx.equals(answered);
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

    private function decimal(v) as Float {
        if (v instanceof Float) {
            return v;
        }
        if (v instanceof Number || v instanceof Long || v instanceof Double) {
            return v.toFloat();
        }
        return 0.0;
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
