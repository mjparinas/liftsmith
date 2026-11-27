import Toybox.Lang;
import Toybox.WatchUi;

//! On a timed hold, carry or cardio set START first starts the set timer (set-timer.md "Started from the watch").
//! START (or a tap on touch watches) logs the set, with the weight and reps picked on the watch; during a set UP and
//! DOWN (or swipes) step the weight or the reps along the phone's own steps and MENU (or a long press) switches
//! which; during rest DOWN adds 30 s, UP is Machine taken when the phone has a pick (also on a set that can't be changed) and
//! MENU answers "How did it feel?" when the phone asks. Everything goes to the
//! phone like the notification's buttons, and the phone sends back the next state. BACK leaves.
class WorkoutDelegate extends WatchUi.BehaviorDelegate {
    private var _app as LiftsmithApp;

    function initialize(app as LiftsmithApp) {
        BehaviorDelegate.initialize();
        _app = app;
    }

    function onSelect() as Boolean {
        var w = _app.workout;
        if (!w.active()) {
            // Today's plan is on the watch: START runs it here with the phone away.
            if (_app.carried() != null) {
                _app.startLocal();
                return true;
            }
            return false;
        }
        var run = _app.run as GarminRun?;
        if (run != null && run.finishedAll()) {
            _app.finishLocal();
            return true;
        }
        if (w.canStartTimer()) {
            _app.startTimer();
            return true;
        }
        var msg = { "a" => "log" } as Dictionary;
        if (w.adjustable() && w.edited()) {
            var v = w.values();
            var keys = v.keys();
            for (var i = 0; i < keys.size(); i++) {
                msg.put(keys[i], v.get(keys[i]));
            }
        }
        _app.cancelAdjust();
        _app.send(msg);
        _app.buzz(60);
        return true;
    }

    function onPreviousPage() as Boolean {
        var w = _app.workout;
        if (w.resting() || !w.adjustable()) {
            return taken();
        }
        return change(1);
    }

    function onNextPage() as Boolean {
        var w = _app.workout;
        if (w.resting()) {
            if (!w.active()) {
                return false;
            }
            _app.send({ "a" => "add30" });
            _app.buzz(60);
            return true;
        }
        return change(-1);
    }

    function onMenu() as Boolean {
        var w = _app.workout;
        if (w.asking() && w.resting()) {
            _app.ask();
            return true;
        }
        if (w.adjustable() && w.hasWeight()) {
            w.onReps = !w.onReps;
            _app.buzz(30);
            WatchUi.requestUpdate();
            return true;
        }
        if (w.asking()) {
            _app.ask();
            return true;
        }
        return false;
    }

    //! BACK on a phone-free run asks before finishing it; otherwise it leaves as usual.
    function onBack() as Boolean {
        if (_app.run == null) {
            return false;
        }
        var ask = new WatchUi.Confirmation(WatchUi.loadResource(Rez.Strings.FinishAsk) as String);
        WatchUi.pushView(ask, new FinishDelegate(_app), WatchUi.SLIDE_IMMEDIATE);
        return true;
    }

    private function change(dir as Number) as Boolean {
        var w = _app.workout;
        if (!w.adjustable()) {
            return false;
        }
        if (w.step(dir)) {
            _app.buzz(20);
            _app.scheduleAdjust();
        }
        WatchUi.requestUpdate();
        return true;
    }

    //! Machine taken: the phone swaps the exercise for its pick (takenSwap.ts) and sends the new state.
    private function taken() as Boolean {
        if (!_app.workout.active() || !_app.workout.canTake()) {
            return false;
        }
        _app.send({ "a" => "taken" });
        _app.buzz(60);
        return true;
    }
}

//! The three answers to "How did it feel?", from the phone: too easy, about right, too hard.
class RateDelegate extends WatchUi.Menu2InputDelegate {
    private var _app as LiftsmithApp;
    private var _ex as String;

    function initialize(app as LiftsmithApp, ex as String) {
        Menu2InputDelegate.initialize();
        _app = app;
        _ex = ex;
    }

    function onSelect(item as WatchUi.MenuItem) as Void {
        var v = item.getId() as Number;
        _app.workout.answered = _ex;
        _app.send({ "a" => "rate", "ex" => _ex, "v" => v });
        _app.buzz(60);
        WatchUi.popView(WatchUi.SLIDE_RIGHT);
    }
}

//! "Finish and save it for your phone?" on a phone-free run.
class FinishDelegate extends WatchUi.ConfirmationDelegate {
    private var _app as LiftsmithApp;

    function initialize(app as LiftsmithApp) {
        ConfirmationDelegate.initialize();
        _app = app;
    }

    function onResponse(response as WatchUi.Confirm) as Boolean {
        if (response == WatchUi.CONFIRM_YES) {
            _app.finishLocal();
        }
        return true;
    }
}
