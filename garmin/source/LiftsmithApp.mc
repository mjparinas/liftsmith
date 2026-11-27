// Liftsmith for Garmin watches (docs/decisions/watch-apps.md). The phone's workout on the wrist: the set, the
// weight and reps or the rest countdown, plates and heart rate, with Log set (START) and +30 s (DOWN); UP and DOWN
// change the weight or reps during a set, and MENU answers "How did it feel?" after an exercise's last set. The phone
// sends the state (GarminLink.java on Android, GarminLink.swift on iOS) and does all the logging; the watch only
// shows it, sends taps back and adds its own heart rate. Same job as the Wear OS and Apple Watch apps.
// With today's plan carried to the watch ("wc"), START on the idle screen runs it here with the phone away
// (GarminRun.mc, docs/decisions/watch-apps.md "Phone-free workouts").

import Toybox.Application;
import Toybox.Attention;
import Toybox.Background;
import Toybox.Communications;
import Toybox.Lang;
import Toybox.Sensor;
import Toybox.System;
import Toybox.Time;
import Toybox.Timer;
import Toybox.WatchUi;

//! The glance and the background service (today's call, TodayGlance.mc) load this class too, so it does nothing
//! of its own until getInitialView: the sensor, the timer and phone messages start only in the full app.
(:glance, :background)
class LiftsmithApp extends Application.AppBase {
    var workout as WorkoutState;
    //! A workout run here with the phone away (GarminRun.mc), or null. Left untyped because the glance and the background
    //! service load this class without GarminRun.
    var run = null;
    private var _timer as Timer.Timer?;
    private var _wasResting as Boolean = false;
    //! Seconds of rest left at the last tick, for the heads-up buzz at 10 (REST_WARN_S in the phone's training.ts).
    private var _lastLeft as Number = 0;
    //! The set timer phase last seen (its label), to buzz when it moves on; null with no timer.
    private var _timerPhase as String? = null;
    //! Seconds left in that phase at the last tick, for the ticks at 3, 2 and 1 and the nudge halfway.
    private var _phaseLeft as Number = -1;
    //! A timer phase this long or longer gets a nudge halfway (the same as Wear OS's HALF_FROM_MS).
    const HALF_FROM_SEC = 20;
    private var _hrSentAt as Number = 0;
    private var _running as Boolean = false;
    //! Waits a moment after the last UP or DOWN before the new weight and reps go to the phone, so a run of presses
    //! sends one adjust, not one each.
    private var _adjTimer as Timer.Timer?;
    const ADJUST_WAIT_MS = 1000;

    function initialize() {
        AppBase.initialize();
        workout = new WorkoutState();
    }

    function onStart(state as Dictionary?) as Void {}

    //! The full app only (never the glance or the background service).
    function begin() as Void {
        _running = true;
        Communications.registerForPhoneAppMessages(method(:onPhone));
        // Today's call for the glance, also while the app is closed (TodayService).
        if (Background has :registerForPhoneAppMessageEvent) {
            Background.registerForPhoneAppMessageEvent();
        }
        Sensor.setEnabledSensors([Sensor.SENSOR_HEARTRATE]);
        Sensor.enableSensorEvents(method(:onSensor));
        var timer = new Timer.Timer();
        timer.start(method(:onTick), 1000, true);
        _timer = timer;
        // A phone-free run left open when the app closed carries on (or ends, if it was forgotten on the wrist).
        var saved = Application.Storage.getValue(CarryStore.RUN);
        if (saved instanceof Dictionary && saved.get("c") instanceof Dictionary) {
            run = new GarminRun(saved.get("c") as Dictionary, Time.now().value(), saved);
            if ((run as GarminRun).forgotten(Time.now().value())) {
                finishLocal();
            } else {
                showRun();
            }
        }
        // Ask the phone for today's plan again, in case the app was closed when it last changed, and hand over any
        // phone-free workout still waiting.
        send({ "wq" => 1 });
        sendWaiting();
    }

    function onStop(state as Dictionary?) as Void {
        if (!_running) {
            return;
        }
        flushAdjust();
        saveRun();
        Sensor.enableSensorEvents(null);
        Sensor.setEnabledSensors([]);
        var timer = _timer;
        if (timer != null) {
            timer.stop();
        }
    }

    function getInitialView() as [WatchUi.Views] or [WatchUi.Views, WatchUi.InputDelegates] {
        begin();
        return [new WorkoutView(workout, self), new WorkoutDelegate(self)];
    }

    (:glance)
    function getGlanceView() as [WatchUi.GlanceView] or [WatchUi.GlanceView, WatchUi.GlanceViewDelegate] or Null {
        return [new TodayGlance()];
    }

    (:background)
    function getServiceDelegate() as [System.ServiceDelegate] {
        return [new TodayService()];
    }

    //! Today's call the background service picked up while the app was closed.
    function onBackgroundData(data as Application.PersistableType) as Void {
        if (data instanceof Dictionary) {
            Application.Storage.setValue(TodayStore.KEY, data);
            WatchUi.requestUpdate();
        }
    }

    //! A new state from the phone (or the end of the workout), or today's call for the glance under "g".
    function onPhone(msg as Communications.PhoneAppMessage) as Void {
        var data = msg.data;
        if (data instanceof Dictionary && data.get("g") instanceof Dictionary) {
            Application.Storage.setValue(TodayStore.KEY, data.get("g") as Dictionary);
            WatchUi.requestUpdate();
            return;
        }
        // Today's plan worked out set by set, for a workout here with the phone away.
        if (data instanceof Dictionary && data.get("wc") != null) {
            Application.Storage.setValue(CarryStore.KEY, data.get("wc") instanceof Dictionary ? data.get("wc") as Dictionary : {});
            WatchUi.requestUpdate();
            return;
        }
        // The phone kept a phone-free workout.
        if (data instanceof Dictionary && data.get("wk") instanceof String) {
            CarryStore.arrived(data.get("wk") as String);
            WatchUi.requestUpdate();
            return;
        }
        // A run here owns the screen; the phone's own workout waits until it's finished.
        if (run != null) {
            return;
        }
        workout.apply(msg.data);
        _wasResting = workout.resting();
        var phase = workout.phase();
        _timerPhase = phase == null ? null : (phase as Array)[2] as String;
        WatchUi.requestUpdate();
    }

    //! The watch's own heart rate goes to the phone at most every 5 s while a workout runs. The phone uses it
    //! when no Bluetooth monitor is connected, like the Wear OS and Apple Watch apps' readings.
    function onSensor(info as Sensor.Info) as Void {
        var hr = info.heartRate;
        if (hr == null || !workout.active()) {
            return;
        }
        workout.watchHr = hr;
        if (run != null) {
            // With the phone away, the watch keeps the readings itself and hands back the average, high and low.
            (run as GarminRun).heartRate(hr);
            return;
        }
        var now = Time.now().value();
        if (now - _hrSentAt >= 5) {
            _hrSentAt = now;
            send({ "hr" => hr });
        }
    }

    //! Once a second: redraw the countdown, and buzz when rest ends if the lifter's rest-over alert vibrates.
    function onTick() as Void {
        if (run != null) {
            // A hold timed here with the phone away logs itself when its countdown runs out, as on the phone.
            var r = run as GarminRun;
            if (r.timerRanOut(Time.now().value())) {
                r.log(r.timerEnd(), -1.0, 0);
                saveRun();
            }
            showRun();
        }
        var resting = workout.resting();
        if (_wasResting && !resting && workout.active() && workout.vibrate) {
            buzz(400);
        }
        _wasResting = resting;
        // The heads-up: a short soft buzz as rest crosses 10 seconds left.
        var left = workout.restLeft();
        if (_lastLeft > 10 && left <= 10 && left > 0 && workout.active() && workout.vibrate && workout.warn) {
            if (Attention has :vibrate) {
                Attention.vibrate([new Attention.VibeProfile(40, 80), new Attention.VibeProfile(0, 90), new Attention.VibeProfile(40, 80)]);
            }
        }
        _lastLeft = left;
        // The set timer: a buzz as each phase ends (go, switch sides, time's up).
        var phase = workout.phase();
        var label = phase == null ? "" : (phase as Array)[2] as String;
        if (_timerPhase != null && !_timerPhase.equals(label) && workout.active() && workout.vibrate) {
            buzz(250);
        }
        _timerPhase = phase == null && workout.timer.size() == 0 ? null : label;
        // A light tick at 3, 2 and 1 seconds left, and a nudge halfway through a long phase, so the wrist can stay down.
        if (phase != null && ((phase as Array)[1] as Number) >= 0) {
            var p = phase as Array;
            var pl = workout.phaseSeconds(p);
            var len = (p[1] as Number) - (p[0] as Number);
            if (pl != _phaseLeft && workout.active() && workout.vibrate) {
                if (pl >= 1 && pl <= 3) {
                    buzz(30);
                } else if (len >= HALF_FROM_SEC && pl == len - len / 2) {
                    if (Attention has :vibrate) {
                        Attention.vibrate([new Attention.VibeProfile(60, 60), new Attention.VibeProfile(0, 100), new Attention.VibeProfile(60, 60)]);
                    }
                }
            }
            _phaseLeft = pl;
        } else {
            _phaseLeft = -1;
        }
        WatchUi.requestUpdate();
    }

    //! Send the weight and reps picked on the watch a moment after the last press (the phone changes the set
    //! without logging it).
    function scheduleAdjust() as Void {
        cancelAdjust();
        var t = new Timer.Timer();
        t.start(method(:flushAdjust), ADJUST_WAIT_MS, false);
        _adjTimer = t;
    }

    function cancelAdjust() as Void {
        var t = _adjTimer;
        if (t != null) {
            t.stop();
        }
        _adjTimer = null;
    }

    function flushAdjust() as Void {
        if (_adjTimer == null) {
            return;
        }
        _adjTimer = null;
        if (workout.adjustable() && workout.edited()) {
            var msg = workout.values();
            msg.put("a", "adjust");
            send(msg);
        }
    }

    //! "How did it feel?" with the phone's question and three answers.
    function ask() as Void {
        var menu = new WatchUi.Menu2({ :title => workout.askQ });
        var values = [1, 0, -1];
        for (var i = 0; i < 3 && i < workout.askO.size(); i++) {
            menu.addItem(new WatchUi.MenuItem(workout.askO[i] as String, null, values[i], {}));
        }
        WatchUi.pushView(menu, new RateDelegate(self, workout.askEx), WatchUi.SLIDE_LEFT);
    }

    //! Log set ({"a" => "log"}, with "key", "kg" and "reps" when changed on the watch), adjust, rate, +30 s ({"a" => "add30"}) or a heart rate reading ({"hr" => bpm}).
    function send(msg as Dictionary) as Void {
        if (run != null && msg.get("a") != null) {
            local(msg);
            return;
        }
        Communications.transmit(msg, null, new SendListener());
    }

    //! A tap on the run here instead of the phone: Log set, adjust, +30 s or rate.
    private function local(msg as Dictionary) as Void {
        var r = run as GarminRun;
        var now = Time.now().value();
        var a = msg.get("a");
        var kg = msg.get("kg");
        var want = kg instanceof Float || kg instanceof Number || kg instanceof Double ? kg.toFloat() : -1.0;
        var reps = msg.get("reps") instanceof Number ? msg.get("reps") as Number : 0;
        if ("log".equals(a)) {
            r.log(now, want, reps);
        } else if ("adjust".equals(a)) {
            r.adjust(want, reps);
        } else if ("add30".equals(a)) {
            r.add30(now);
        } else if ("rate".equals(a) && msg.get("v") instanceof Number) {
            r.rate(msg.get("v") as Number);
        } else if ("timer".equals(a)) {
            r.startTimer(now);
        } else {
            return;
        }
        saveRun();
        showRun();
    }

    //! START on a timed hold, carry or cardio set: the timer counts here at once on the watch's own clock (with buzzes),
    //! and the phone starts the same timer from this moment (timerRun.ts startFromWatch). On a run here it's kept here.
    function startTimer() as Void {
        if (!workout.canStartTimer()) {
            return;
        }
        var key = workout.tsKey;
        if (run == null) {
            workout.startTimer(Time.now().value());
        }
        send({ "a" => "timer", "key" => key });
        var phase = workout.phase();
        _timerPhase = phase == null ? null : (phase as Array)[2] as String;
        buzz(60);
        WatchUi.requestUpdate();
    }

    //! Today's carried plan, when nothing runs and the watch could start it on its own.
    function carried() as Dictionary? {
        return run == null && !workout.active() ? CarryStore.load() : null;
    }

    //! Starts today's carried plan here, with the phone away.
    function startLocal() as Void {
        var c = carried();
        if (c == null) {
            return;
        }
        run = new GarminRun(c, Time.now().value(), null);
        saveRun();
        showRun();
        buzz(120);
    }

    //! Ends the run here and keeps what was logged for the phone, which saves it whenever it's near again.
    function finishLocal() as Void {
        var r = run;
        if (r == null) {
            return;
        }
        var result = r.result(Time.now().value());
        if (result != null) {
            CarryStore.addWaiting(result);
        }
        run = null;
        Application.Storage.deleteValue(CarryStore.RUN);
        workout.apply(null);
        _wasResting = false;
        _timerPhase = null;
        buzz(300);
        sendWaiting();
        WatchUi.requestUpdate();
    }

    //! Every phone-free workout still waiting goes to the phone; it answers {"wk" => id} once it has kept one.
    function sendWaiting() as Void {
        var q = CarryStore.waiting();
        for (var i = 0; i < q.size(); i++) {
            Communications.transmit({ "wd" => q[i] }, null, new SendListener());
        }
    }

    private function saveRun() as Void {
        var r = run;
        if (r == null) {
            return;
        }
        var o = r.save();
        o.put("c", r.c);
        Application.Storage.setValue(CarryStore.RUN, o);
    }

    private function showRun() as Void {
        var r = run;
        if (r != null) {
            workout.apply(r.state(Time.now().value()));
        }
    }

    function buzz(ms as Number) as Void {
        if (Attention has :vibrate) {
            Attention.vibrate([new Attention.VibeProfile(100, ms)]);
        }
    }
}

//! Nothing to do either way: the phone answers a tap with the next state, and a lost heart rate reading is
//! replaced by the next one.
class SendListener extends Communications.ConnectionListener {
    function initialize() {
        Communications.ConnectionListener.initialize();
    }

    function onComplete() as Void {}

    function onError() as Void {}
}
