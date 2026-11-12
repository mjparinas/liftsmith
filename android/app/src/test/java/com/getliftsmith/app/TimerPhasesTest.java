package com.getliftsmith.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.util.List;
import org.junit.Test;

public class TimerPhasesTest {

    private static final String PLANK =
        "[{\"from\":1000,\"to\":6000,\"label\":\"Get set\"},{\"from\":6000,\"to\":36000,\"label\":\"Time left\"}]";

    @Test
    public void stepsThroughTheLeadInAndTheHold() {
        List<TimerPhases.Phase> p = TimerPhases.parse(PLANK);
        assertEquals(2, p.size());
        assertNull(TimerPhases.at(p, 500));
        assertEquals("Get set 0:05", TimerPhases.at(p, 1000).text(1000));
        assertEquals("Time left 0:30", TimerPhases.at(p, 6000).text(6000));
        assertEquals("Time left 0:01", TimerPhases.at(p, 35_500).text(35_500));
        assertNull(TimerPhases.at(p, 36_000));
        assertEquals(36_000L, TimerPhases.end(p));
    }

    @Test
    public void countsCardioUpWithNoEnd() {
        List<TimerPhases.Phase> p = TimerPhases.parse("[{\"from\":0,\"to\":5000,\"label\":\"Get set\"},{\"from\":5000,\"label\":\"Target 20:00\"}]");
        // A phase must start after 1970: the lead-in at 0 is dropped as junk, the count-up stays.
        assertEquals(1, p.size());
        assertEquals("Target 20:00 1:25", TimerPhases.at(p, 90_000).text(90_000));
        assertEquals(0L, TimerPhases.end(p));
    }

    @Test
    public void readsNothingFromJunk() {
        assertTrue(TimerPhases.parse(null).isEmpty());
        assertTrue(TimerPhases.parse("not json").isEmpty());
        assertTrue(TimerPhases.parse("[{\"from\":9000,\"to\":1000,\"label\":\"x\"}]").isEmpty());
    }
}
