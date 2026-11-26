import Toybox.Graphics;
import Toybox.Lang;
import Toybox.WatchUi;

//! The one screen: the set, the exercise, the weight and reps (or the rest countdown), plates or what's next,
//! the weight and reps picked with UP and DOWN,
//! heart rate, and which button does what. Always dark, the app's own colours.
class WorkoutView extends WatchUi.View {
    const BG = 0x0b1020;
    const INK = 0xffffff;
    const BLUE = 0x4c8dff;
    const CYAN = 0x38d6e8;
    const MUTED = 0x9aa4b2;
    const RED = 0xff5a5a;

    private var _w as WorkoutState;

    function initialize(w as WorkoutState) {
        View.initialize();
        _w = w;
    }

    function onUpdate(dc as Graphics.Dc) as Void {
        var w = dc.getWidth();
        var h = dc.getHeight();
        var cx = w / 2;
        dc.setColor(INK, BG);
        dc.clear();

        if (!_w.active()) {
            line(dc, cx, h * 0.38, WatchUi.loadResource(Rez.Strings.NoneTitle) as String, Graphics.FONT_SMALL, INK, w * 0.8, 2);
            line(dc, cx, h * 0.62, WatchUi.loadResource(Rez.Strings.NoneBody) as String, Graphics.FONT_XTINY, MUTED, w * 0.75, 3);
            return;
        }

        var resting = _w.resting();
        line(dc, cx, h * 0.16, _w.setLabel, Graphics.FONT_XTINY, BLUE, w * 0.6, 1);
        line(dc, cx, h * 0.28, _w.title, Graphics.FONT_SMALL, INK, w * 0.82, 1);
        var phase = _w.phase();
        if (phase != null) {
            // The set timer (holds, carries, cardio): its clock, and what it's counting under it.
            dc.setColor(CYAN, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, h * 0.47, Graphics.FONT_NUMBER_MEDIUM, clock(_w.phaseSeconds(phase as Array)), Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            line(dc, cx, h * 0.64, (phase as Array)[2] as String, Graphics.FONT_XTINY, MUTED, w * 0.86, 1);
        } else if (resting) {
            dc.setColor(CYAN, Graphics.COLOR_TRANSPARENT);
            dc.drawText(cx, h * 0.47, Graphics.FONT_NUMBER_MEDIUM, clock(_w.restLeft()), Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            line(dc, cx, h * 0.64, Lang.format(WatchUi.loadResource(Rez.Strings.Next) as String, [_w.next]), Graphics.FONT_XTINY, MUTED, w * 0.86, 1);
        } else if (_w.adjustable()) {
            // The set's weight and reps as picked on the watch; the one UP and DOWN change is blue, with arrows.
            var repsText = _w.repsWord.length() > 0 ? Lang.format("$1$ $2$", [_w.shownReps(), _w.repsWord]) : _w.shownReps().toString();
            if (_w.hasWeight()) {
                value(dc, cx, h * 0.42, _w.shownWeight(), Graphics.FONT_MEDIUM, !_w.onReps, w);
                value(dc, cx, h * 0.55, repsText, Graphics.FONT_SMALL, _w.onReps, w);
                if (_w.shownIndex() == _w.ladderI) {
                    line(dc, cx, h * 0.65, _w.plates, Graphics.FONT_XTINY, MUTED, w * 0.86, 1);
                }
            } else {
                value(dc, cx, h * 0.47, repsText, Graphics.FONT_MEDIUM, true, w);
            }
        } else {
            line(dc, cx, h * 0.47, _w.next, Graphics.FONT_MEDIUM, INK, w * 0.9, 1);
            // After a Machine taken swap the new lift's plates matter most; with none, why it's there.
            line(dc, cx, h * 0.64, _w.plates.length() > 0 ? _w.plates : _w.why, Graphics.FONT_XTINY, MUTED, w * 0.86, 1);
        }
        var bpm = _w.bpm();
        if (bpm > 0) {
            line(dc, cx, h * 0.75, Lang.format(WatchUi.loadResource(Rez.Strings.Bpm) as String, [bpm]), Graphics.FONT_XTINY, RED, w * 0.6, 1);
        }
        // UP is Machine taken during rest, and on a set whose weight and reps can't be changed here.
        var taken = _w.canTake() && (resting || !_w.adjustable());
        var hint = resting
            ? (_w.asking() ? Rez.Strings.HintRate : (taken ? Rez.Strings.HintAddTaken : Rez.Strings.HintAdd))
            : (taken ? Rez.Strings.HintLogTaken : Rez.Strings.HintLog);
        line(dc, cx, h * 0.87, WatchUi.loadResource(hint) as String, Graphics.FONT_XTINY, MUTED, w * 0.6, 1);
    }

    //! A number UP and DOWN can change: blue with an arrow each side when they change it, white otherwise.
    private function value(dc as Graphics.Dc, x as Numeric, y as Numeric, s as String, font as Graphics.FontType, focused as Boolean, width as Numeric) as Void {
        line(dc, x, y, s, font, focused ? BLUE : INK, width * 0.7, 1);
        if (!focused) {
            return;
        }
        var half = dc.getTextWidthInPixels(s, font) / 2;
        var max = width * 0.35;
        if (half > max) {
            half = max;
        }
        var a = 6;
        var lx = x - half - 10;
        var rx = x + half + 10;
        dc.setColor(BLUE, Graphics.COLOR_TRANSPARENT);
        dc.fillPolygon([[lx - a, y], [lx, y - a], [lx, y + a]]);
        dc.fillPolygon([[rx + a, y], [rx, y - a], [rx, y + a]]);
    }

    //! Centred text that wraps to at most `lines` lines and is cut short with an ellipsis past that.
    private function line(dc as Graphics.Dc, x as Numeric, y as Numeric, s as String, font as Graphics.FontType, color as Number, width as Numeric, lines as Number) as Void {
        if (s.length() == 0) {
            return;
        }
        var fitted = Graphics.fitTextToArea(s, font, width, dc.getFontHeight(font) * lines, true);
        if (fitted == null) {
            return;
        }
        dc.setColor(color, Graphics.COLOR_TRANSPARENT);
        dc.drawText(x, y, font, fitted, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }
}
