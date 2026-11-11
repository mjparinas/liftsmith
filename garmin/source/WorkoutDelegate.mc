import Toybox.Lang;
import Toybox.WatchUi;

//! START (or a tap on touch watches) logs the set as planned; DOWN (or a swipe up) adds 30 s of rest. Both go to
//! the phone exactly like the notification's buttons, and the phone sends back the next state. BACK leaves.
class WorkoutDelegate extends WatchUi.BehaviorDelegate {
    private var _app as LiftsmithApp;

    function initialize(app as LiftsmithApp) {
        BehaviorDelegate.initialize();
        _app = app;
    }

    function onSelect() as Boolean {
        if (!_app.workout.active()) {
            return false;
        }
        _app.send({ "a" => "log" });
        _app.buzz(60);
        return true;
    }

    function onNextPage() as Boolean {
        if (!_app.workout.resting()) {
            return false;
        }
        _app.send({ "a" => "add30" });
        _app.buzz(60);
        return true;
    }
}
