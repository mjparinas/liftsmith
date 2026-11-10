package com.getliftsmith.app.wear;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
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
}
