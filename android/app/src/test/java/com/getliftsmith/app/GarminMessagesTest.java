package com.getliftsmith.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONObject;
import org.junit.Test;

public class GarminMessagesTest {

    private static final long NOW = 1_800_000_000_000L;

    private static JSONObject lifting() throws Exception {
        return new JSONObject()
            .put("title", "Back squat")
            .put("setLabel", "Set 2 of 4")
            .put("next", "100 kg × 5")
            .put("plates", "20 + 15 + 5")
            .put("hr", 120)
            .put("vibrate", false)
            .put("sessionId", "s1");
    }

    @Test
    public void stateUsesShortKeysAndRestAsSecondsLeft() throws Exception {
        Map<String, Object> m = GarminMessages.state(lifting().put("restUntil", NOW + 84_100), NOW);
        assertEquals("Back squat", m.get("t"));
        assertEquals("Set 2 of 4", m.get("s"));
        assertEquals("100 kg × 5", m.get("n"));
        assertEquals("20 + 15 + 5", m.get("p"));
        assertEquals(85, m.get("r"));
        assertEquals(120, m.get("h"));
        assertEquals(false, m.get("v"));
        assertEquals(0, GarminMessages.state(lifting(), NOW).get("r"));
        assertEquals(0, GarminMessages.state(lifting().put("restUntil", NOW - 5), NOW).get("r"));
    }

    @Test
    public void onlyRealChangesAreSent() throws Exception {
        Map<String, Object> a = GarminMessages.state(lifting(), NOW);
        assertTrue(GarminMessages.worthSending(null, a, 0));
        assertFalse(GarminMessages.worthSending(a, GarminMessages.state(lifting(), NOW), 500));
        // A new set goes straight away.
        assertTrue(GarminMessages.worthSending(a, GarminMessages.state(lifting().put("setLabel", "Set 3 of 4"), NOW), 500));
        // Heart rate alone waits 10 s.
        Map<String, Object> hr = GarminMessages.state(lifting().put("hr", 130), NOW);
        assertFalse(GarminMessages.worthSending(a, hr, 3_000));
        assertTrue(GarminMessages.worthSending(a, hr, 10_000));
        // Rest starting, and +30 s, go straight away; the same rest a few seconds later doesn't.
        Map<String, Object> rest = GarminMessages.state(lifting().put("restUntil", NOW + 90_000), NOW);
        assertTrue(GarminMessages.worthSending(a, rest, 500));
        assertFalse(GarminMessages.worthSending(rest, GarminMessages.state(lifting().put("restUntil", NOW + 90_000), NOW + 4_000), 4_000));
        assertTrue(GarminMessages.worthSending(rest, GarminMessages.state(lifting().put("restUntil", NOW + 120_000), NOW + 4_000), 4_000));
    }

    @Test
    public void endClearsTheWatch() {
        assertEquals(true, GarminMessages.end().get("end"));
    }

    private static List<Object> msg(String k, Object v) {
        Map<String, Object> m = new HashMap<>();
        m.put(k, v);
        return Collections.singletonList(m);
    }

    @Test
    public void onlyLogAdd30AndBelievableHeartRatesComeIn() {
        assertEquals("log", GarminMessages.action(msg("a", "log")));
        assertEquals("add30", GarminMessages.action(msg("a", "add30")));
        assertNull(GarminMessages.action(msg("a", "discard")));
        assertNull(GarminMessages.action(msg("a", 3)));
        assertNull(GarminMessages.action(null));
        assertEquals(142, GarminMessages.bpm(msg("hr", 142)));
        assertEquals(0, GarminMessages.bpm(msg("hr", 400)));
        assertEquals(0, GarminMessages.bpm(msg("hr", "142")));
        assertEquals(0, GarminMessages.bpm(Arrays.asList("x", 1)));
    }
}
