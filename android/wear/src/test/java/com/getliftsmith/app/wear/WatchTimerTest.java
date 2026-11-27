package com.getliftsmith.app.wear;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

/** Start timer on the wrist (docs/decisions/set-timer.md "Started from the watch"): the phone's rules, on the watch's clock. */
public class WatchTimerTest {

    private static final long NOW = 1_800_000_000_000L;
    private static final String OFFER =
        "{\"title\":\"Plank\",\"setLabel\":\"Set 1 of 2\",\"next\":\"0:40\",\"ts\":{\"key\":\"s1:0:0:\",\"s\":40,\"d\":1,\"l\":\"Start timer · 0:40\"," +
        "\"lb\":[\"Get set\",\"Time left\",\"Switch sides\",\"Second side\"],\"o\":\"Time’s up\"}}";

    @Test
    public void offersStartUntilATimerRuns() {
        WorkoutState s = WorkoutState.parse(OFFER);
        assertNotNull(s.ts);
        assertEquals("Start timer · 0:40", s.ts.label);
        assertTrue(s.canStartTimer(NOW));
        s.withStarted("s1:0:0:", NOW);
        assertFalse(s.canStartTimer(NOW));
        assertEquals("Get set", s.phase(NOW + 1000).label);
        assertEquals(4, s.phase(NOW + 1000).seconds(NOW + 1000));
        assertEquals("Time left", s.phase(NOW + 6000).label);
        assertEquals(39, s.phase(NOW + 6000).seconds(NOW + 6000));
        assertNull(s.phase(NOW + 45_000));
        assertTrue(s.timeUp(NOW + 45_000));
        assertEquals("Time’s up", s.timerOver);
    }

    @Test
    public void aStartForAnotherSetIsIgnored() {
        WorkoutState s = WorkoutState.parse(OFFER).withStarted("s1:0:1:", NOW);
        assertTrue(s.canStartTimer(NOW));
    }

    @Test
    public void thePhonesPhasesWinOverTheWatchsOwn() {
        String json = OFFER.replace("{\"title\"", "{\"timer\":[{\"from\":" + (NOW + 500) + ",\"to\":" + (NOW + 5500) + ",\"label\":\"Get set\"}],\"title\"");
        WorkoutState s = WorkoutState.parse(json).withStarted("s1:0:0:", NOW);
        assertEquals(1, s.phases().size());
        assertEquals(NOW + 500, s.phases().get(0).from);
    }

    @Test
    public void eachSideIsLaidOutLikeThePhone() {
        WorkoutState.Offer o = new WorkoutState.Offer("k", 20, 2, false, "", new String[] { "Get set", "First side", "Switch sides", "Second side" }, "");
        List<WorkoutState.Phase> p = o.phases(NOW);
        assertEquals(4, p.size());
        assertEquals(NOW + 5000, p.get(1).from);
        assertEquals(NOW + 25_000, p.get(1).to);
        assertEquals(NOW + 30_000, p.get(3).from);
        assertEquals(NOW + 50_000, o.end(NOW));
        // Held: getting set logs as planned; stopped on the first side, its seconds; on the second, both.
        assertNull(o.held(NOW, NOW + 3000));
        assertArrayEquals(new int[] { 12 }, o.held(NOW, NOW + 17_500));
        assertArrayEquals(new int[] { 20 }, o.held(NOW, NOW + 27_000));
        assertArrayEquals(new int[] { 20, 8 }, o.held(NOW, NOW + 38_900));
        assertArrayEquals(new int[] { 20 }, o.held(NOW, NOW + 60_000));
    }

    @Test
    public void aCountUpRunsUntilLogged() {
        WorkoutState.Offer o = new WorkoutState.Offer("k", 600, 1, true, "", new String[] { "Get set", "Target 10:00", "", "" }, "");
        List<WorkoutState.Phase> p = o.phases(NOW);
        assertEquals(0, p.get(1).to);
        assertEquals(0, o.end(NOW));
        assertArrayEquals(new int[] { 700 }, o.held(NOW, NOW + 705_000));
    }

    private static final String CARRY =
        "{\"v\":1,\"id\":\"c1\",\"day\":\"2027-01-15\",\"title\":\"Core\",\"why\":\"\",\"vib\":true,\"warn\":false," +
        "\"o\":[\"Too easy\",\"About right\",\"Too hard\"],\"done\":\"All sets logged\",\"fin\":\"Tap Finish to save it\"," +
        "\"tl\":[\"Get set\",\"Time left\",\"First side\",\"Switch sides\",\"Second side\",\"Time’s up\"]," +
        "\"ex\":[{\"n\":\"Plank\",\"rt\":\"Rest · Plank\",\"q\":\"How was Plank?\",\"kg\":[],\"w\":[],\"rs\":\"s\"}," +
        "{\"n\":\"Side plank\",\"rt\":\"Rest · Side plank\",\"q\":\"How was Side plank?\",\"kg\":[],\"w\":[],\"rs\":\"s\"}]," +
        "\"st\":[{\"e\":0,\"l\":\"Set 1 of 1\",\"t\":\"0:40\",\"i\":0,\"r\":40,\"s\":60,\"m\":1,\"tt\":\"Start timer · 0:40\"}," +
        "{\"e\":1,\"l\":\"Set 1 of 1\",\"t\":\"0:20 each side\",\"i\":0,\"r\":20,\"s\":0,\"m\":2,\"tt\":\"Start timer · 0:20 a side\"}]}";

    private static WatchRun run() {
        JSONObject c = WatchRun.plan(CARRY, "2027-01-15");
        assertNotNull(c);
        return WatchRun.start(c, NOW, 42);
    }

    @Test
    public void aPhoneFreeHoldOffersItsTimer() {
        WatchRun r = run();
        WorkoutState s = WorkoutState.parse(r.state(NOW));
        assertNotNull(s.ts);
        assertEquals("Start timer · 0:40", s.ts.label);
        assertEquals("Time left", s.ts.labels[1]);
        assertNull(s.adj);
        r.startTimer(NOW + 1000);
        s = WorkoutState.parse(r.state(NOW + 2000));
        assertFalse(s.canStartTimer(NOW + 2000));
        assertEquals("Get set", s.phase(NOW + 2000).label);
        assertEquals("Time left", s.phase(NOW + 10_000).label);
    }

    @Test
    public void aPhoneFreeHoldLogsItselfWhenItRunsOut() {
        WatchRun r = run();
        r.startTimer(NOW);
        assertFalse(r.timerRanOut(NOW + 44_000));
        assertTrue(r.timerRanOut(NOW + 45_000));
        r.log(r.timerEnd(), null, null);
        JSONArray set = r.sets.optJSONArray(0);
        assertEquals(NOW + 45_000, set.optLong(1));
        assertEquals(40, set.optInt(3));
        assertEquals(0, r.timerAt);
        // Rest after it, then the side plank with its own timer.
        assertTrue(r.restUntil > NOW + 45_000);
    }

    @Test
    public void stoppingAHoldEarlySavesTheSecondsHeld() {
        WatchRun r = run();
        r.startTimer(NOW);
        r.log(NOW + 5000 + 31_400, null, null);
        assertEquals(31, r.sets.optJSONArray(0).optInt(3));
        // Stopped on the second side: the first side's full time, then the second side's own.
        r.restUntil = 0;
        r.startTimer(NOW + 200_000);
        r.log(NOW + 200_000 + 5000 + 20_000 + 5000 + 7_200, null, null);
        JSONArray side = r.sets.optJSONArray(1);
        assertEquals(20, side.optInt(3));
        assertEquals(7, side.optInt(5));
    }

    @Test
    public void aRunningTimerSurvivesTheAppClosing() {
        WatchRun r = run();
        r.startTimer(NOW + 3000);
        WatchRun back = WatchRun.restore(r.save());
        assertEquals(NOW + 3000, back.timerAt);
    }
}
