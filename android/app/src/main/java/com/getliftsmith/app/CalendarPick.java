package com.getliftsmith.app;

/**
 * Which calendar the training event goes into (CalendarPlugin.pickCalendar). Plain Java so it can be unit tested.
 * The first writable calendar is often a phone-only one (Samsung's "My calendar", a local account) that Google
 * Calendar never shows, so the event was saved but the lifter couldn't find it (Melvin, 2026-11-12).
 */
final class CalendarPick {

    /** CalendarContract.ACCOUNT_TYPE_LOCAL. */
    static final String LOCAL = "LOCAL";

    private CalendarPick() {}

    /**
     * Higher is better: a Google account's primary calendar, then any account's primary calendar, then any synced
     * calendar, then an unsynced one, and a phone-only calendar last.
     */
    static int score(String accountType, boolean primary, boolean synced) {
        if (accountType == null || LOCAL.equals(accountType) || accountType.toLowerCase(java.util.Locale.ROOT).contains("local")) return 0;
        if ("com.google".equals(accountType) && primary) return 4;
        if (primary) return 3;
        return synced ? 2 : 1;
    }
}
