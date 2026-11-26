package com.getliftsmith.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import org.junit.Test;

public class WatchMessagesTest {

    @Test
    public void onlyLogAdd30AndTakenAreActions() {
        assertEquals("log", WatchMessages.action("log"));
        assertEquals("add30", WatchMessages.action("add30"));
        assertEquals("taken", WatchMessages.action("taken"));
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

    @Test
    public void motionBatchesKeepOnlyTimeAndReadings() throws Exception {
        org.json.JSONObject m = WatchMessages.motion("{\"t\":1000,\"s\":[0,0.5,0.1,20,-0.25,0.2],\"extra\":\"x\"}");
        assertNotNull(m);
        assertEquals(1000, m.getLong("t"));
        assertEquals(6, m.getJSONArray("s").length());
        assertEquals(false, m.has("extra"));
    }

    @Test
    public void motionBatchesMustBeWellFormed() {
        assertNull(WatchMessages.motion(null));
        assertNull(WatchMessages.motion("nope"));
        assertNull(WatchMessages.motion("{\"t\":1,\"s\":[0,1]}"));
        assertNull(WatchMessages.motion("{\"t\":1,\"s\":[0,\"a\",1]}"));
        assertNull(WatchMessages.motion("{\"s\":[0,1,1]}"));
        StringBuilder big = new StringBuilder("{\"t\":1,\"s\":[0");
        for (int i = 1; i < (WatchMessages.MAX_MOTION + 1) * 3; i++) big.append(",0");
        assertNull(WatchMessages.motion(big.append("]}").toString()));
    }

    @Test
    public void plainTapsCarryNothing() {
        WatchMessages.Tap t = WatchMessages.tap("log");
        assertNotNull(t);
        assertEquals("log", t.action);
        assertNull(t.data);
        assertNull(WatchMessages.tap("start"));
    }

    @Test
    public void logCarriesTheWatchsWeightAndReps() throws Exception {
        WatchMessages.Tap t = WatchMessages.tap("{\"a\":\"log\",\"key\":\"s:1:0:0:\",\"kg\":102.5,\"reps\":6,\"junk\":\"x\"}");
        assertNotNull(t);
        assertEquals("log", t.action);
        org.json.JSONObject d = new org.json.JSONObject(t.data);
        assertEquals(102.5, d.getDouble("kg"), 1e-9);
        assertEquals(6, d.getInt("reps"));
        assertEquals("s:1:0:0:", d.getString("key"));
        assertEquals(false, d.has("junk"));
    }

    @Test
    public void adjustAndRateNeedTheirFields() {
        assertNull(WatchMessages.tap("{\"a\":\"adjust\",\"kg\":100}"));
        assertNotNull(WatchMessages.tap("{\"a\":\"adjust\",\"key\":\"k\",\"reps\":8}"));
        assertNull(WatchMessages.tap("{\"a\":\"rate\",\"v\":1}"));
        assertNull(WatchMessages.tap("{\"a\":\"rate\",\"ex\":\"row\",\"v\":3}"));
        assertNotNull(WatchMessages.tap("{\"a\":\"rate\",\"ex\":\"row\",\"v\":-1}"));
        assertNull(WatchMessages.tap("{\"a\":\"start\"}"));
        assertNull(WatchMessages.tap("{nope"));
    }
}
