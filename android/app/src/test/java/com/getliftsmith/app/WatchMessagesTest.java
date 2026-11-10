package com.getliftsmith.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

public class WatchMessagesTest {

    @Test
    public void onlyLogAndAdd30AreActions() {
        assertEquals("log", WatchMessages.action("log"));
        assertEquals("add30", WatchMessages.action("add30"));
        assertNull(WatchMessages.action("start"));
        assertNull(WatchMessages.action(""));
        assertNull(WatchMessages.action("log; drop"));
    }

    @Test
    public void heartRateMustBeBelievable() {
        assertEquals(132, WatchMessages.bpm("132"));
        assertEquals(60, WatchMessages.bpm(" 60\n"));
        assertEquals(0, WatchMessages.bpm("29"));
        assertEquals(0, WatchMessages.bpm("241"));
        assertEquals(0, WatchMessages.bpm("fast"));
    }
}
