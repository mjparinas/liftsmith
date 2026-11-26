package com.getliftsmith.app.wear;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class WorkoutStateTest {

    private static final long NOW = 1_800_000_000_000L;

    @Test
    public void readsWhatThePhoneSends() {
        WorkoutState s = WorkoutState.parse(
            "{\"title\":\"Back squat\",\"setLabel\":\"Set 2 of 4\",\"next\":\"100 kg × 5\",\"plates\":\"20 + 10 + 5\"," +
            "\"restUntil\":" + (NOW + 90_000) + ",\"hr\":120,\"vibrate\":false,\"done\":3,\"total\":12,\"at\":" + NOW + ",\"sessionId\":\"s1\"}");
        assertEquals("Back squat", s.title);
        assertEquals("Set 2 of 4", s.setLabel);
        assertEquals("100 kg × 5", s.next);
        assertEquals("20 + 10 + 5", s.plates);
        assertEquals(120, s.hr);
        assertFalse(s.vibrate);
        assertEquals(12, s.total);
        assertEquals("s1", s.sessionId);
        assertTrue(s.resting(NOW));
        assertEquals(90, s.restLeft(NOW));
    }

    @Test
    public void lifting_whenRestIsNullOrOver() {
        WorkoutState lifting = WorkoutState.parse("{\"title\":\"Row\",\"restUntil\":null,\"at\":" + NOW + "}");
        assertFalse(lifting.resting(NOW));
        assertEquals(0, lifting.restLeft(NOW));
        assertTrue(lifting.vibrate);
        WorkoutState over = WorkoutState.parse("{\"restUntil\":" + (NOW - 1) + "}");
        assertFalse(over.resting(NOW));
    }

    @Test
    public void restRoundsUp_soTheLastSecondStillShows() {
        WorkoutState s = WorkoutState.parse("{\"restUntil\":" + (NOW + 200) + "}");
        assertEquals(1, s.restLeft(NOW));
    }

    @Test
    public void forgottenWorkoutsAreStale() {
        WorkoutState s = WorkoutState.parse("{\"at\":" + NOW + "}");
        assertFalse(s.stale(NOW + WorkoutState.STALE_MS));
        assertTrue(s.stale(NOW + WorkoutState.STALE_MS + 1));
    }

    @Test
    public void junkIsNoWorkout() {
        assertNull(WorkoutState.parse(null));
        assertNull(WorkoutState.parse(""));
        assertNull(WorkoutState.parse("{not json"));
    }

    @Test
    public void clock() {
        assertEquals("0:00", WorkoutState.clock(0));
        assertEquals("0:09", WorkoutState.clock(9));
        assertEquals("1:25", WorkoutState.clock(85));
        assertEquals("10:00", WorkoutState.clock(600));
        assertEquals("0:00", WorkoutState.clock(-5));
    }

    @Test
    public void motionOnlyWhileThePhoneAsksAndNotResting() {
        assertFalse(WorkoutState.parse("{\"title\":\"Squat\"}").streamMotion(NOW));
        assertTrue(WorkoutState.parse("{\"motion\":true}").streamMotion(NOW));
        assertFalse(WorkoutState.parse("{\"motion\":true,\"restUntil\":" + (NOW + 60_000) + "}").streamMotion(NOW));
        // Hands-free watch sets: the phone wants rest too, to see the next set start.
        assertTrue(WorkoutState.parse("{\"motion\":true,\"motionRest\":true,\"restUntil\":" + (NOW + 60_000) + "}").streamMotion(NOW));
        assertFalse(WorkoutState.parse("{\"motionRest\":true,\"restUntil\":" + (NOW + 60_000) + "}").streamMotion(NOW));
    }

    @Test
    public void setTimerStepsThroughItsPhases() {
        WorkoutState s = WorkoutState.parse(
            "{\"timer\":[{\"from\":" + NOW + ",\"to\":" + (NOW + 5000) + ",\"label\":\"Get set\"},"
                + "{\"from\":" + (NOW + 5000) + ",\"to\":" + (NOW + 35_000) + ",\"label\":\"Time left\"}]}"
        );
        assertEquals("Get set", s.phase(NOW).label);
        assertEquals(5, s.phase(NOW).seconds(NOW));
        assertEquals("Time left", s.phase(NOW + 5000).label);
        assertEquals(1, s.phase(NOW + 34_500).seconds(NOW + 34_500));
        assertNull(s.phase(NOW + 35_000));
        assertNull(WorkoutState.parse("{\"title\":\"Plank\"}").phase(NOW));
    }

    @Test
    public void setTimerCountsCardioUpAndHidesWhileResting() {
        WorkoutState up = WorkoutState.parse("{\"timer\":[{\"from\":" + NOW + ",\"label\":\"Target 20:00\"}]}");
        assertEquals(85, up.phase(NOW + 85_400).seconds(NOW + 85_400));
        WorkoutState rest = WorkoutState.parse(
            "{\"restUntil\":" + (NOW + 60_000) + ",\"timer\":[{\"from\":" + NOW + ",\"label\":\"x\"}]}"
        );
        assertNull(rest.phase(NOW + 1000));
    }

    @Test
    public void buzzesOnANewCueOnly() {
        WorkoutState a = WorkoutState.parse("{\"sessionId\":\"s1\",\"cue\":\"go:1\"}");
        WorkoutState b = WorkoutState.parse("{\"sessionId\":\"s1\",\"cue\":\"logged:2\"}");
        WorkoutState other = WorkoutState.parse("{\"sessionId\":\"s2\",\"cue\":\"logged:3\"}");
        assertFalse(a.newCue(null));
        assertFalse(a.newCue(a));
        assertTrue(b.newCue(a));
        assertFalse(other.newCue(b));
        assertFalse(WorkoutState.parse("{\"sessionId\":\"s1\"}").newCue(a));
    }

    @Test
    public void readsTheSetsLadderAndFindsTheNearestStep() {
        WorkoutState s = WorkoutState.parse(
            "{\"title\":\"Bench\",\"adj\":{\"key\":\"s:1:0:2:\",\"kg\":[97.5,100,102.5],\"w\":[\"97.5 kg\",\"100 kg\",\"102.5 kg\"],\"i\":1,\"reps\":8,\"rs\":\"reps\"}}"
        );
        assertNotNull(s.adj);
        assertEquals("s:1:0:2:", s.adj.key);
        assertEquals(8, s.adj.reps);
        assertEquals(2, s.adj.nearest(102.4));
        assertEquals(0, s.adj.nearest(50));
        assertTrue(s.adj.hasWeight());
    }

    @Test
    public void aBodyweightSetHasRepsOnlyAndBadLaddersAreDropped() {
        WorkoutState bw = WorkoutState.parse("{\"adj\":{\"key\":\"k\",\"kg\":[],\"w\":[],\"i\":0,\"reps\":12}}");
        assertNotNull(bw.adj);
        assertEquals(false, bw.adj.hasWeight());
        assertNull(WorkoutState.parse("{\"adj\":{\"key\":\"k\",\"kg\":[1,2],\"w\":[\"a\",\"b\"],\"i\":5,\"reps\":8}}").adj);
        assertNull(WorkoutState.parse("{\"adj\":{\"kg\":[],\"w\":[],\"reps\":8}}").adj);
        assertEquals(100, WorkoutState.Adj.clampReps(500));
        assertEquals(1, WorkoutState.Adj.clampReps(0));
    }

    @Test
    public void readsHowDidItFeel() {
        WorkoutState s = WorkoutState.parse(
            "{\"ask\":{\"ex\":\"bench-press\",\"q\":\"How did Bench press feel?\",\"o\":[\"Too easy\",\"About right\",\"Too hard\"],\"v\":[1,0,-1]}}"
        );
        assertNotNull(s.ask);
        assertEquals(-1, s.ask.values[2]);
        assertEquals("About right", s.ask.answers[1]);
        assertNull(WorkoutState.parse("{\"ask\":{\"ex\":\"x\",\"o\":[\"a\"],\"v\":[1]}}").ask);
    }
}
