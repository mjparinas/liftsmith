import Toybox.Application;
import Toybox.Lang;
import Toybox.Math;
import Toybox.Time;
import Toybox.Time.Gregorian;

//! Today's plan as the phone carries it (GarminMessages.carry on Android, GarminMessages.carry in GarminLink.swift),
//! kept in Application.Storage under "wc": {"id", "d" day, "t" title, "y" why, "v" vibrate, "w" heads-up, "o" answers,
//! "dn" all logged, "fn" finish line, "ex": [[name, rest title, question, [kg], [words], reps word]], "st": [[exercise,
//! label, set, ladder place, reps, rest, ask, adjustable, keeps the last set's weight and reps, timed (0, or 1 or 2
//! sides), Start timer's words]]} and "tl" the timer's words (get set, time left, side 1, switch sides, side 2, time's up).
module CarryStore {
    const KEY = "wc";
    const RUN = "run";
    //! Finished workouts waiting for the phone, oldest first, each the "wd" message's body.
    const DONE = "wdq";

    //! Today's carried plan, if the watch can run it today.
    function load() as Dictionary? {
        var c = Application.Storage.getValue(KEY);
        if (!(c instanceof Dictionary)) {
            return null;
        }
        var st = c.get("st");
        var ex = c.get("ex");
        if (!(st instanceof Array) || !(ex instanceof Array) || st.size() == 0 || !TodayStore.dayKey().equals(c.get("d"))) {
            return null;
        }
        return c;
    }

    function waiting() as Array {
        var q = Application.Storage.getValue(DONE);
        return q instanceof Array ? q : [];
    }

    function addWaiting(r as Dictionary) as Void {
        var q = waiting();
        q.add(r);
        while (q.size() > 10) {
            q = q.slice(1, null);
        }
        Application.Storage.setValue(DONE, q);
    }

    //! The phone kept the workout with this id: the watch lets it go.
    function arrived(id as String) as Void {
        var q = waiting();
        var keep = [];
        for (var i = 0; i < q.size(); i++) {
            var r = q[i];
            if (!(r instanceof Dictionary) || !id.equals(r.get("id"))) {
                keep.add(r);
            }
        }
        Application.Storage.setValue(DONE, keep);
    }
}

//! A workout run on the watch with the phone away (docs/decisions/watch-apps.md "Phone-free workouts"). The watch only
//! walks through the phone's steps and keeps each Log set with its time, weight and reps; the phone replays them later.
//! It draws itself in the same short keys the phone sends for its own workouts (WorkoutState.apply), so the screen
//! and the buttons work as they do with the phone. Times are in seconds (Connect IQ numbers are 32-bit). The same
//! rules as Wear OS's WatchRun.java and the Apple Watch's WatchRun.swift.
class GarminRun {
    //! A run this old was forgotten on the wrist: it's finished with what was logged.
    const FORGOTTEN_SEC = 14400;
    const MAX_SETS = 120;

    var c as Dictionary;
    var id as String;
    var start as Number;
    var k as Number = 0;
    var kg as Float = -1.0;
    var reps as Number = 1;
    var restEnds as Number = 0;
    var setFrom as Number;
    var ask as Number = -1;
    //! When START started the timer on the hold on screen (seconds), or 0.
    var timerAt as Number = 0;
    //! Each Log set: [step, at, kg (-1: none), reps, set start] and, for a hold stopped on its second side, its seconds.
    var sets as Array = [];
    var rates as Array = [];
    var hrSum as Number = 0;
    var hrCount as Number = 0;
    var hrMax as Number = 0;
    var hrMin as Number = 0;

    function initialize(carry as Dictionary, now as Number, saved as Dictionary?) {
        c = carry;
        if (saved != null) {
            id = text(saved.get("id"));
            start = whole(saved.get("s"));
            k = whole(saved.get("k"));
            kg = decimal(saved.get("kg"));
            reps = whole(saved.get("r"));
            restEnds = whole(saved.get("re"));
            setFrom = whole(saved.get("sf"));
            ask = whole(saved.get("q"));
            timerAt = whole(saved.get("ta"));
            var s = saved.get("sets");
            sets = s instanceof Array ? s : [];
            var r = saved.get("rates");
            rates = r instanceof Array ? r : [];
            var h = saved.get("hr");
            if (h instanceof Array && h.size() == 4) {
                hrSum = whole(h[0]);
                hrCount = whole(h[1]);
                hrMax = whole(h[2]);
                hrMin = whole(h[3]);
            }
            return;
        }
        id = "g" + now.format("%d") + (Math.rand() % 1000000).format("%d");
        start = now;
        setFrom = now;
        load(0);
    }

    //! Kept in Application.Storage under "run", so closing the app loses nothing.
    function save() as Dictionary {
        return {
            "id" => id, "s" => start, "k" => k, "kg" => kg, "r" => reps, "re" => restEnds, "sf" => setFrom, "q" => ask, "ta" => timerAt,
            "sets" => sets, "rates" => rates, "hr" => [hrSum, hrCount, hrMax, hrMin]
        };
    }

    function steps() as Array {
        return c.get("st") as Array;
    }

    function step(i as Number) as Array? {
        var st = steps();
        if (i < 0 || i >= st.size() || !(st[i] instanceof Array) || (st[i] as Array).size() < 8) {
            return null;
        }
        return st[i] as Array;
    }

    function item(s as Array?) as Array? {
        if (s == null) {
            return null;
        }
        var ex = c.get("ex") as Array;
        var e = whole(s[0]);
        if (e < 0 || e >= ex.size() || !(ex[e] instanceof Array) || (ex[e] as Array).size() < 6) {
            return null;
        }
        return ex[e] as Array;
    }

    function ladder(it as Array?) as Array {
        return it != null && it[3] instanceof Array ? it[3] as Array : [];
    }

    function finishedAll() as Boolean {
        return k >= steps().size();
    }

    function adjustable() as Boolean {
        var s = step(k);
        return s != null && s[7] == true;
    }

    function plannedKg(s as Array?) as Float {
        var l = ladder(item(s));
        if (s == null || l.size() == 0) {
            return -1.0;
        }
        var i = whole(s[3]);
        i = i < 0 ? 0 : (i >= l.size() ? l.size() - 1 : i);
        return decimal(l[i]);
    }

    private function load(i as Number) as Void {
        k = i;
        var s = step(i);
        if (s == null) {
            return;
        }
        kg = plannedKg(s);
        var r = whole(s[4]);
        reps = r < 1 ? 1 : r;
    }

    private function nearest(l as Array, want as Float) as Number {
        var best = 0;
        for (var i = 1; i < l.size(); i++) {
            if ((decimal(l[i]) - want).abs() < (decimal(l[best]) - want).abs()) {
                best = i;
            }
        }
        return best;
    }

    //! The weight (kg, or a negative number to keep it) and reps (or 0) picked on the watch.
    function adjust(want as Float, r as Number) as Void {
        if (!adjustable()) {
            return;
        }
        var l = ladder(item(step(k)));
        if (want >= 0 && l.size() > 0) {
            kg = decimal(l[nearest(l, want)]);
        }
        if (r > 0) {
            reps = r > 100 ? 100 : r;
        }
    }

    // ---------- The set timer on a timed hold (the phone's rules: 5 s to get set, then the hold, each side in turn)

    //! 1 or 2 sides when the step on screen is a timed hold, else 0.
    function sides() as Number {
        var s = step(k);
        var m = s != null && s.size() > 9 ? whole(s[9]) : 0;
        return m == 1 || m == 2 ? m : 0;
    }

    //! The hold's seconds (each side).
    function holdSecs() as Number {
        var r = whole((step(k) as Array)[4]);
        return r < 1 ? 1 : r;
    }

    function timerWord(i as Number) as String {
        var tl = c.get("tl");
        return tl instanceof Array && i < tl.size() ? text(tl[i]) : "";
    }

    //! START on the hold on screen at `now` (once; not during rest).
    function startTimer(now as Number) as Void {
        if (sides() == 0 || restEnds > now || timerAt > 0) {
            return;
        }
        timerAt = now;
    }

    //! When the running hold's countdown ends, or 0.
    function timerEnd() as Number {
        var d = sides();
        if (d == 0 || timerAt <= 0) {
            return 0;
        }
        return timerAt + 5 + holdSecs() * d + (d == 2 ? 5 : 0);
    }

    //! The running hold has run out: it logs itself at its end, as on the phone.
    function timerRanOut(now as Number) as Boolean {
        var end = timerEnd();
        return end > 0 && now >= end;
    }

    //! What Log set saves at `now` for the running hold: [seconds] or, stopped on the second side, [first, second];
    //! null while getting set (the set as planned). Like setTimer.ts timerHeld.
    private function held(now as Number) as Array? {
        var d = sides();
        if (d == 0 || timerAt <= 0) {
            return null;
        }
        var t = now - timerAt - 5;
        var work = holdSecs();
        if (t < 0) {
            return null;
        }
        if (t < work) {
            return [t < 1 ? 1 : t];
        }
        if (d == 1 || t < work + 5) {
            return [work];
        }
        var t2 = t - work - 5;
        return t2 < work ? [work, t2] : [work];
    }

    //! Log set at `now`, then the rest after it.
    function log(now as Number, want as Float, r as Number) as Void {
        var s = step(k);
        if (s == null || sets.size() >= MAX_SETS) {
            return;
        }
        adjust(want, r);
        // A hold timed here saves the seconds held (as planned when stopped while getting set).
        var h = held(now);
        if (h != null) {
            reps = h[0] as Number;
        }
        var from = setFrom > now ? now : setFrom;
        var set = [k, now, kg < 0 ? -1 : kg, reps, from < start ? start : from];
        if (h != null && h.size() > 1) {
            set.add(h[1]);
        }
        sets.add(set);
        timerAt = 0;
        var keptKg = kg;
        var keptReps = reps;
        if (s[6] == true) {
            ask = k;
        }
        load(k + 1);
        var next = step(k);
        // The next set of the same exercise keeps what was dialled in, as on the phone.
        if (next != null && next.size() > 8 && next[8] == true) {
            kg = keptKg;
            reps = keptReps;
        }
        var rest = whole(s[5]);
        restEnds = rest > 0 && next != null ? now + rest : 0;
        setFrom = restEnds > 0 ? restEnds : now;
    }

    function add30(now as Number) as Void {
        if (restEnds <= now) {
            return;
        }
        restEnds += 30;
        setFrom = restEnds;
    }

    function rate(v as Number) as Void {
        if (ask < 0 || v < -1 || v > 1) {
            return;
        }
        rates.add([ask, v]);
        ask = -1;
    }

    function heartRate(bpm as Number) as Void {
        if (bpm < 30 || bpm > 240) {
            return;
        }
        hrSum += bpm;
        hrCount += 1;
        hrMax = bpm > hrMax ? bpm : hrMax;
        hrMin = hrMin == 0 || bpm < hrMin ? bpm : hrMin;
    }

    function forgotten(now as Number) as Boolean {
        var last = sets.size() > 0 ? whole((sets[sets.size() - 1] as Array)[1]) : start;
        return now - last > FORGOTTEN_SEC;
    }

    //! What the screen shows, in the short keys of the phone's own workout messages (WorkoutState.apply).
    function state(now as Number) as Dictionary {
        var o = { "v" => c.get("v") != false, "w" => c.get("w") == true } as Dictionary;
        var asked = item(step(ask));
        var answers = c.get("o");
        if (ask >= 0 && asked != null && answers instanceof Array && answers.size() == 3) {
            o.put("qe", ask.format("%d"));
            o.put("q", text(asked[2]));
            o.put("qo", answers);
        }
        var s = step(k);
        var it = item(s);
        if (s != null && it != null) {
            var resting = restEnds > now;
            o.put("t", text(resting ? it[1] : it[0]));
            o.put("s", text(s[1]));
            o.put("n", next(s, it));
            if (resting) {
                o.put("r", restEnds - now);
            }
            var d = sides();
            if (!resting && d > 0) {
                var secs = holdSecs();
                var labels = [timerWord(0), timerWord(d == 2 ? 2 : 1), timerWord(3), timerWord(4)];
                o.put("tk", id + ":" + k.format("%d"));
                o.put("tn", secs);
                o.put("td", d);
                o.put("tl", s.size() > 10 ? text(s[10]) : "");
                o.put("tb", labels);
                o.put("to", timerWord(5));
                if (timerAt > 0) {
                    // Its phases in seconds from now, as the phone sends them; a phase already over says 0.
                    var lead = timerAt + 5;
                    var ph = [[timerAt, lead, labels[0]], [lead, lead + secs, labels[1]]];
                    if (d == 2) {
                        ph.add([lead + secs, lead + secs + 5, labels[2]]);
                        ph.add([lead + secs + 5, lead + secs * 2 + 5, labels[3]]);
                    }
                    var k2 = [];
                    for (var i = 0; i < ph.size(); i++) {
                        var p = ph[i] as Array;
                        var end = (p[1] as Number) - now;
                        k2.add([(p[0] as Number) - now, end < 0 ? 0 : end, p[2]]);
                    }
                    o.put("k", k2);
                }
            }
            if (adjustable()) {
                var l = ladder(it);
                var w = it[4] instanceof Array ? it[4] as Array : [];
                o.put("ay", id + ":" + k.format("%d"));
                o.put("ak", l);
                o.put("aw", w);
                o.put("ai", l.size() == 0 ? 0 : nearest(l, kg));
                o.put("ar", reps);
                o.put("ars", text(it[5]));
            }
        } else {
            o.put("t", text(c.get("dn")));
            o.put("s", "");
            o.put("n", text(c.get("fn")));
        }
        return o;
    }

    private function next(s as Array, it as Array) as String {
        if ((kg - plannedKg(s)).abs() < 0.001 && reps == whole(s[4])) {
            return text(s[2]);
        }
        var word = text(it[5]);
        var r = word.length() > 0 ? reps.format("%d") + " " + word : reps.format("%d");
        var l = ladder(it);
        var w = it[4] instanceof Array ? it[4] as Array : [];
        if (l.size() == 0 || w.size() != l.size()) {
            return r;
        }
        return text(w[nearest(l, kg)]) + " × " + r;
    }

    //! What the phone saves (GarminMessages.result), or null when no set was logged.
    function result(now as Number) as Dictionary? {
        if (sets.size() == 0) {
            return null;
        }
        var last = whole((sets[sets.size() - 1] as Array)[1]);
        var end = last > start ? last : start;
        var cap = end + 120;
        var stop = now < cap ? now : cap;
        var hr = hrCount > 0 ? [Math.round(hrSum.toFloat() / hrCount).toNumber(), hrMax, hrMin] : [];
        return { "id" => id, "c" => text(c.get("id")), "s" => start, "e" => stop > end ? stop : end, "sets" => sets, "rates" => rates, "hr" => hr };
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
        return -1.0;
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
