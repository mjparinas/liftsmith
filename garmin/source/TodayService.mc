import Toybox.Background;
import Toybox.Communications;
import Toybox.Lang;
import Toybox.System;

//! Today's call reaches the watch while the app is closed: the phone's message wakes this background service, which
//! hands today's part to the app (onBackgroundData keeps it for the glance). Anything else waits for the app.
(:background)
class TodayService extends System.ServiceDelegate {
    function initialize() {
        ServiceDelegate.initialize();
    }

    function onPhoneAppMessage(msg as Communications.PhoneAppMessage) as Void {
        var data = msg.data;
        if (data instanceof Dictionary && data.get("g") instanceof Dictionary) {
            Background.exit(data.get("g") as Dictionary);
        } else {
            Background.exit(null);
        }
    }
}
