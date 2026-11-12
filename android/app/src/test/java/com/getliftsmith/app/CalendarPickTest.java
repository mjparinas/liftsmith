package com.getliftsmith.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class CalendarPickTest {

    @Test
    public void googlePrimaryBeatsAPhoneOnlyCalendar() {
        // Samsung's "My calendar" is primary on its own local account, and used to win.
        assertTrue(CalendarPick.score("com.google", true, true) > CalendarPick.score("LOCAL", true, true));
        assertTrue(CalendarPick.score("com.google", true, true) > CalendarPick.score("local", true, true));
    }

    @Test
    public void ranksPrimaryThenSyncedThenOthers() {
        assertTrue(CalendarPick.score("com.google", true, true) > CalendarPick.score("com.microsoft.exchange", true, true));
        assertTrue(CalendarPick.score("com.microsoft.exchange", true, true) > CalendarPick.score("com.google", false, true));
        assertTrue(CalendarPick.score("com.google", false, true) > CalendarPick.score("com.google", false, false));
        assertTrue(CalendarPick.score("com.google", false, false) > CalendarPick.score(null, true, true));
        assertEquals(0, CalendarPick.score(null, false, false));
    }
}
