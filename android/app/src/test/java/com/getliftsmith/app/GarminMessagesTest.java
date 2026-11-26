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
        assertEquals(false, m.get("w"));
        assertEquals(true, GarminMessages.state(lifting().put("warn", true), NOW).get("w"));
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
    public void machineTakenGoesWithItsPickAndWhy() throws Exception {
        Map<String, Object> a = GarminMessages.state(lifting(), NOW);
        assertEquals("", a.get("x"));
        Map<String, Object> b = GarminMessages.state(lifting().put("taken", "Swaps to Dumbbell row, 30 kg × 10"), NOW);
        assertEquals("Swaps to Dumbbell row, 30 kg × 10", b.get("x"));
        assertTrue(GarminMessages.worthSending(a, b, 500));
        Map<String, Object> c = GarminMessages.state(lifting().put("why", "In for Lat pulldown, which was taken"), NOW);
        assertEquals("In for Lat pulldown, which was taken", c.get("y"));
        assertTrue(GarminMessages.worthSending(a, c, 500));
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
        assertEquals("taken", GarminMessages.action(msg("a", "taken")));
        assertNull(GarminMessages.action(msg("a", "discard")));
        assertNull(GarminMessages.action(msg("a", 3)));
        assertNull(GarminMessages.action(null));
        assertEquals(142, GarminMessages.bpm(msg("hr", 142)));
        assertEquals(0, GarminMessages.bpm(msg("hr", 400)));
        assertEquals(0, GarminMessages.bpm(msg("hr", "142")));
        assertEquals(0, GarminMessages.bpm(Arrays.asList("x", 1)));
    }

    @Test
    public void setTimerGoesAsSecondsFromNow() throws Exception {
        JSONObject plank = lifting().put(
            "timer",
            new org.json.JSONArray(
                "[{\"from\":" + (NOW - 2000) + ",\"to\":" + (NOW + 3000) + ",\"label\":\"Get set\"},"
                    + "{\"from\":" + (NOW + 3000) + ",\"to\":" + (NOW + 33_000) + ",\"label\":\"Time left\"}]"
            )
        );
        Map<String, Object> m = GarminMessages.state(plank, NOW);
        assertEquals(java.util.Arrays.asList(java.util.Arrays.asList(-2, 3, "Get set"), java.util.Arrays.asList(3, 33, "Time left")), m.get("k"));
        assertEquals(String.valueOf(NOW - 2000), m.get("ki"));
        // A new timer is worth a message; the same one a second later isn't.
        assertTrue(GarminMessages.worthSending(GarminMessages.state(lifting(), NOW), m, 500));
        assertFalse(GarminMessages.worthSending(m, GarminMessages.state(plank, NOW + 1000), 1000));
        assertEquals(java.util.Collections.emptyList(), GarminMessages.state(lifting(), NOW).get("k"));
    }

    @Test
    @SuppressWarnings("unchecked")
    public void todayGoesUnderItsOwnKeySoItIsNeverTakenForAWorkout() throws Exception {
        org.json.JSONObject t = new org.json.JSONObject().put("day", "2026-11-26").put("call", "Push").put("mins", "45 min").put("ready", "Readiness 82");
        java.util.Map<String, Object> m = GarminMessages.today(t);
        assertEquals(1, m.size());
        java.util.Map<String, Object> g = (java.util.Map<String, Object>) m.get("g");
        assertEquals("Push", g.get("c"));
        assertEquals("45 min", g.get("m"));
        assertEquals("Readiness 82", g.get("r"));
        assertEquals("", g.get("y"));
        assertEquals("", ((java.util.Map<String, Object>) GarminMessages.today(null).get("g")).get("c"));
    }

    @Test
    public void theLadderAndTheQuestionGoToTheWatch() throws Exception {
        JSONObject s = lifting()
            .put("adj", new JSONObject().put("key", "s1:2:0:2:").put("kg", new org.json.JSONArray("[97.5,100,102.5]")).put("w", new org.json.JSONArray("[\"97.5 kg\",\"100 kg\",\"102.5 kg\"]")).put("i", 1).put("reps", 5).put("rs", "reps"))
            .put("ask", new JSONObject().put("ex", "back-squat").put("q", "How did Back squat feel?").put("o", new org.json.JSONArray("[\"Too easy\",\"About right\",\"Too hard\"]")));
        Map<String, Object> m = GarminMessages.state(s, NOW);
        assertEquals("s1:2:0:2:", m.get("ay"));
        assertEquals(3, ((List<?>) m.get("ak")).size());
        assertEquals("100 kg", ((List<?>) m.get("aw")).get(1));
        assertEquals(5, m.get("ar"));
        assertEquals("back-squat", m.get("qe"));
        assertEquals(3, ((List<?>) m.get("qo")).size());
    }

    @Test
    public void tapsCarryTheirFields() throws Exception {
        Map<String, Object> d = new HashMap<>();
        d.put("a", "log");
        d.put("key", "k");
        d.put("kg", 60.0f);
        d.put("reps", 8);
        WatchMessages.Tap t = GarminMessages.tap(Collections.<Object>singletonList(d));
        assertEquals("log", t.action);
        assertEquals(8, new JSONObject(t.data).getInt("reps"));
        assertNull(GarminMessages.tap(Collections.<Object>singletonList(Collections.singletonMap("hr", 120))));
    }

    private static final String CARRY =
        "{\"v\":1,\"id\":\"c1\",\"day\":\"2027-1-15\",\"title\":\"Push\",\"why\":\"\",\"vib\":true,\"warn\":false,\"o\":[\"a\",\"b\",\"c\"]," +
        "\"done\":\"Done\",\"fin\":\"Finish\",\"ex\":[{\"n\":\"Bench press\",\"rt\":\"Rest\",\"q\":\"How?\",\"kg\":[60,62.5],\"w\":[\"60 kg\",\"62.5 kg\"],\"rs\":\"reps\"}]," +
        "\"st\":[{\"e\":0,\"l\":\"Set 1 of 2\",\"t\":\"60 kg × 8\",\"i\":0,\"r\":8,\"s\":90,\"a\":1},{\"e\":0,\"l\":\"Set 2 of 2\",\"t\":\"60 kg × 8\",\"i\":0,\"r\":8,\"s\":0,\"f\":1,\"a\":1,\"c\":1}]}";

    @Test
    @SuppressWarnings("unchecked")
    public void todaysPlanGoesToTheWatchInShortKeys() throws Exception {
        Map<String, Object> wc = (Map<String, Object>) GarminMessages.carry(new JSONObject(WatchMessages.carry(CARRY))).get("wc");
        assertEquals("c1", wc.get("id"));
        assertEquals("2027-1-15", wc.get("d"));
        List<?> st = (List<?>) wc.get("st");
        assertEquals(2, st.size());
        List<?> second = (List<?>) st.get(1);
        assertEquals(9, second.size());
        assertEquals(true, second.get(6));
        assertEquals(true, second.get(8));
        assertEquals(false, ((List<?>) st.get(0)).get(8));
        List<?> ex = (List<?>) ((List<?>) wc.get("ex")).get(0);
        assertEquals("Bench press", ex.get(0));
        assertTrue(((Map<?, ?>) GarminMessages.carry(null).get("wc")).isEmpty());
        assertNull(WatchMessages.carry("{\"v\":2}"));
    }

    @Test
    public void aWatchWorkoutComesBackInMilliseconds() throws Exception {
        Map<String, Object> wd = new HashMap<>();
        wd.put("id", "g18000000001234");
        wd.put("c", "c1");
        wd.put("s", 1_800_000_000);
        wd.put("e", 1_800_000_300);
        wd.put("sets", Arrays.asList(Arrays.asList(0, 1_800_000_100, 62.5f, 6, 1_800_000_000), Arrays.asList(1, 1_800_000_250, -1, 8, 1_800_000_190)));
        wd.put("rates", Collections.singletonList(Arrays.asList(1, -1)));
        wd.put("hr", Arrays.asList(130, 150, 100));
        JSONObject r = GarminMessages.result(Collections.<Object>singletonList(Collections.singletonMap("wd", wd)));
        assertEquals("g18000000001234", r.getString("id"));
        assertEquals(1_800_000_000_000L, r.getLong("start"));
        assertEquals(1_800_000_100_000L, r.getJSONArray("sets").getJSONArray(0).getLong(1));
        assertEquals(62.5, r.getJSONArray("sets").getJSONArray(0).getDouble(2), 1e-6);
        assertEquals(-1.0, r.getJSONArray("sets").getJSONArray(1).getDouble(2), 1e-9);
        assertEquals("g18000000001234", GarminMessages.received("g18000000001234").get("wk"));
        assertNull(GarminMessages.result(Collections.<Object>singletonList(Collections.singletonMap("hr", 120))));
        assertTrue(GarminMessages.wantsCarry(Collections.<Object>singletonList(Collections.singletonMap("wq", 1))));
        assertFalse(GarminMessages.wantsCarry(Collections.<Object>singletonList(Collections.singletonMap("hr", 120))));
    }
}
