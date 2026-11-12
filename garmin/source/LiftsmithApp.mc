// Liftsmith for Garmin watches (docs/decisions/watch-apps.md). The phone's workout on the wrist: the set, the
// weight and reps or the rest countdown, plates and heart rate, with Log set (START) and +30 s (DOWN). The phone
// sends the state (GarminLink.java on Android, GarminLink.swift on iOS) and does all the logging; the watch only
// shows it, sends taps back and adds its own heart rate. Same job as the Wear OS and Apple Watch apps.

import Toybox.Application;
import Toybox.Attention;
import Toybox.Communications;
import Toybox.Lang;
import Toybox.Sensor;
import Toybox.Time;
import Toybox.Timer;
import Toybox.WatchUi;

class LiftsmithApp extends Application.AppBase {
    var workout as WorkoutState;
    private var _timer as Timer.Timer?;
    private var _wasResting as Boolean = false;
    //! The set timer phase last seen (its label), to buzz when it moves on; null with no timer.
    private var _timerPhase as String? = null;
    private var _hrSentAt as Number = 0;

    function initialize() {
        AppBase.initialize();
        workout = new WorkoutState();
    }

    function onStart(state as Dictionary?) as Void {
        Communications.registerForPhoneAppMessages(method(:onPhone));
        Sensor.setEnabledSensors([Sensor.SENSOR_HEARTRATE]);
        Sensor.enableSensorEvents(method(:onSensor));
        var timer = new Timer.Timer();
        timer.start(method(:onTick), 1000, true);
        _timer = timer;
    }

    function onStop(state as Dictionary?) as Void {
        Sensor.enableSensorEvents(null);
        Sensor.setEnabledSensors([]);
        var timer = _timer;
        if (timer != null) {
            timer.stop();
        }
    }

    function getInitialView() as [WatchUi.Views] or [WatchUi.Views, WatchUi.InputDelegates] {
        return [new WorkoutView(workout), new WorkoutDelegate(self)];
    }

    //! A new state from the phone (or the end of the workout).
    function onPhone(msg as Communications.PhoneAppMessage) as Void {
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
        var now = Time.now().value();
        if (now - _hrSentAt >= 5) {
            _hrSentAt = now;
            send({ "hr" => hr });
        }
    }

    //! Once a second: redraw the countdown, and buzz when rest ends if the lifter's rest-over alert vibrates.
    function onTick() as Void {
        var resting = workout.resting();
        if (_wasResting && !resting && workout.active() && workout.vibrate) {
            buzz(400);
        }
        _wasResting = resting;
        // The set timer: a buzz as each phase ends (go, switch sides, time's up).
        var phase = workout.phase();
        var label = phase == null ? "" : (phase as Array)[2] as String;
        if (_timerPhase != null && !_timerPhase.equals(label) && workout.active() && workout.vibrate) {
            buzz(250);
        }
        _timerPhase = phase == null && workout.timer.size() == 0 ? null : label;
        WatchUi.requestUpdate();
    }

    //! Log set ({"a" => "log"}), +30 s ({"a" => "add30"}) or a heart rate reading ({"hr" => bpm}).
    function send(msg as Dictionary) as Void {
        Communications.transmit(msg, null, new SendListener());
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
