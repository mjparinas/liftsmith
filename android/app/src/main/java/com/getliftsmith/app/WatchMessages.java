package com.getliftsmith.app;

/** What the watch may send. Anything else is dropped, so a bad message can't reach the web app. */
final class WatchMessages {

    private WatchMessages() {}

    /** "log" or "add30", or null. */
    static String action(String body) {
        return "log".equals(body) || "add30".equals(body) ? body : null;
    }

    /** A heart rate in beats per minute, or 0 when it isn't a believable one (30 to 240). */
    static int bpm(String body) {
        try {
            int b = Integer.parseInt(body.trim());
            return b >= 30 && b <= 240 ? b : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
