package com.getliftsmith.app.wear;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

/** Phone-free workouts: the watch walks the phone's steps, and hands back what it logged (watch-apps.md). */
public class WatchRunTest {

    private static final long NOW = 1_800_000_000_000L;

    /** Two exercises: a bench press warm-up and two sets (the second keeps what was dialled in), then push-ups. */
    private static final String CARRY =
        "{\"v\":1,\"id\":\"c1\",\"day\":\"2027-01-15\",\"title\":\"Push · 45 min\",\"why\":\"Slept well\",\"vib\":true,\"warn\":false," +
        "\"o\":[\"Too easy\",\"About right\",\"Too hard\"],\"done\":\"All sets logged\",\"fin\":\"Tap Finish to save it\"," +
        "\"ex\":[{\"n\":\"Bench press\",\"rt\":\"Rest · Bench press\",\"q\":\"How was Bench press?\",\"kg\":[40,57.5,60,62.5],\"w\":[\"40 kg\",\"57.5 kg\",\"60 kg\",\"62.5 kg\"],\"rs\":\"reps\"}," +
        "{\"n\":\"Push-up\",\"rt\":\"Rest · Push-up\",\"q\":\"How was Push-up?\",\"kg\":[],\"w\":[],\"rs\":\"reps\"}]," +
        "\"st\":[{\"e\":0,\"l\":\"Warm-up 1 of 1\",\"t\":\"40 kg × 5\",\"i\":0,\"r\":5,\"s\":60,\"a\":1}," +
        "{\"e\":0,\"l\":\"Set 1 of 2\",\"t\":\"60 kg × 8\",\"i\":2,\"r\":8,\"s\":120,\"a\":1}," +
        "{\"e\":0,\"l\":\"Set 2 of 2\",\"t\":\"60 kg × 8\",\"i\":2,\"r\":8,\"s\":90,\"f\":1,\"a\":1,\"c\":1}," +
        "{\"e\":1,\"l\":\"Set 1 of 1\",\"t\":\"12 reps\",\"i\":0,\"r\":12,\"s\":0,\"f\":1,\"a\":1}]}";

    private static WatchRun run() {
        JSONObject c = WatchRun.plan(CARRY, "2027-01-15");
        assertNotNull(c);
        return WatchRun.start(c, NOW, 42);
    }

    @Test
    public void onlyRunsTodaysPlan() {
        assertNull(WatchRun.plan(CARRY, "2027-01-16"));
        assertNull(WatchRun.plan("{}", "2027-01-15"));
        assertNull(WatchRun.plan("", "2027-01-15"));
    }

    @Test
    public void showsTheStepLikeThePhonesOwnWorkout() {
        WatchRun r = run();
        WorkoutState s = WorkoutState.parse(r.state(NOW));
        assertEquals("Bench press", s.title);
        assertEquals("Warm-up 1 of 1", s.setLabel);
        assertEquals("40 kg × 5", s.next);
        assertNotNull(s.adj);
        assertEquals(0, s.adj.i);
        assertEquals(5, s.adj.reps);
        assertFalse(s.resting(NOW));
        r.log(NOW + 30_000, null, null);
        s = WorkoutState.parse(r.state(NOW + 31_000));
        assertTrue(s.resting(NOW + 31_000));
        assertEquals("Rest · Bench press", s.title);
        assertEquals("60 kg × 8", s.next);
    }

    @Test
    public void keepsWhatWasDialledInForTheNextSetAndAsksAfterTheLast() {
        WatchRun r = run();
        r.log(NOW + 30_000, null, null);
        r.log(NOW + 200_000, 62.5, 6);
        // The second set of the same lift keeps 62.5 × 6.
        WorkoutState s = WorkoutState.parse(r.state(NOW + 210_000));
        assertEquals("62.5 kg × 6 reps", s.next);
        assertEquals(3, s.adj.i);
        assertNull(s.ask);
        r.log(NOW + 400_000, null, null);
        s = WorkoutState.parse(r.state(NOW + 401_000));
        assertNotNull(s.ask);
        assertEquals("How was Bench press?", s.ask.question);
        r.rate(-1);
        assertNull(WorkoutState.parse(r.state(NOW + 402_000)).ask);
        r.log(NOW + 600_000, null, 15);
        assertTrue(r.finishedAll());
        s = WorkoutState.parse(r.state(NOW + 601_000));
        assertEquals("All sets logged", s.title);
        assertNull(s.adj);
    }

    @Test
    public void handsBackEverySetWithItsTimeForThePhone() throws Exception {
        WatchRun r = run();
        assertNull(r.result(NOW));
        r.log(NOW + 30_000, null, null);
        r.add30(NOW + 40_000);
        r.log(NOW + 200_000, 62.5, 6);
        r.heartRate(120);
        r.heartRate(140);
        JSONObject o = new JSONObject(r.result(NOW + 300_000));
        assertEquals("c1", o.getString("c"));
        assertTrue(o.getString("id").matches("[A-Za-z0-9_-]{4,64}"));
        JSONArray sets = o.getJSONArray("sets");
        assertEquals(2, sets.length());
        assertEquals(0, sets.getJSONArray(0).getInt(0));
        assertEquals(40.0, sets.getJSONArray(0).getDouble(2), 1e-9);
        assertEquals(1, sets.getJSONArray(1).getInt(0));
        assertEquals(62.5, sets.getJSONArray(1).getDouble(2), 1e-9);
        assertEquals(6, sets.getJSONArray(1).getInt(3));
        // The second set started when rest ended: 60 s plus the 30 s added.
        assertEquals(NOW + 30_000 + 90_000, sets.getJSONArray(1).getLong(4));
        assertEquals(130, o.getJSONArray("hr").getInt(0));
    }

    @Test
    public void aBodyweightSetSendsNoWeight() throws Exception {
        WatchRun r = run();
        for (int i = 0; i < 3; i++) r.log(NOW + (i + 1) * 60_000L, null, null);
        r.log(NOW + 300_000, null, 15);
        JSONArray last = new JSONObject(r.result(NOW + 301_000)).getJSONArray("sets").getJSONArray(3);
        assertEquals(-1.0, last.getDouble(2), 1e-9);
        assertEquals(15, last.getInt(3));
    }

    @Test
    public void survivesTheAppClosing() {
        WatchRun r = run();
        r.log(NOW + 30_000, 57.5, 5);
        WatchRun back = WatchRun.restore(r.save());
        assertNotNull(back);
        assertEquals(r.id, back.id);
        assertEquals(1, back.k);
        assertEquals(r.state(NOW + 40_000), back.state(NOW + 40_000));
        assertFalse(back.forgotten(NOW + 60_000));
        assertTrue(back.forgotten(NOW + WatchRun.FORGOTTEN_MS + 60_000));
    }
}
