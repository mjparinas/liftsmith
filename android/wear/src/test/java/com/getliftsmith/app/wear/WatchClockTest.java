package com.getliftsmith.app.wear;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class WatchClockTest {

    private static final long NOW = 1_800_000_000_000L;

    @Test
    public void onePhoneUpdateRunsThroughReadyAndHoldWhileDisconnected() {
        String phases = "{'timer':[{'from':%d,'to':%d,'label':'Get set'},{'from':%d,'to':%d,'label':'Plank'}]}";
        WorkoutState watch = WorkoutState.parse(String.format(java.util.Locale.ROOT, phases, NOW, NOW + 5000, NOW + 5000, NOW + 35000));
        assertEquals(5, watch.phase(NOW).seconds(NOW));
        assertEquals("Plank", watch.phase(NOW + 5000).label);
        assertEquals(18, watch.phase(NOW + 17000).seconds(NOW + 17000));
        assertEquals(null, watch.phase(NOW + 35000));

        // The phone starts rest offline. When the watch receives it 12 seconds later, only 48 seconds remain.
        WorkoutState reconnected = WorkoutState.parse("{'restUntil':" + (NOW + 95000) + "}");
        assertEquals(48, reconnected.restLeft(NOW + 47000));
    }

    @Test
    public void openingSnapshotTenSecondsLaterKeepsOriginalRestAndHoldDeadlines() {
        WatchClock clock = new WatchClock();
        long now = NOW + 10_000;
        long shift = clock.offsetFor(NOW, now, false);
        String phases = "{'timer':[{'from':%d,'to':%d,'label':'Get set'},{'from':%d,'to':%d,'label':'Plank'}]}";
        WorkoutState hold = WorkoutState.parse(String.format(java.util.Locale.ROOT, phases, NOW, NOW + 5000, NOW + 5000, NOW + 35000), shift);
        assertEquals("Plank", hold.phase(now).label);
        assertEquals(25, hold.phase(now).seconds(now));
        WorkoutState rest = WorkoutState.parse("{'restUntil':" + (NOW + 60000) + "}", shift);
        assertEquals(50, rest.restLeft(now));
    }

    @Test
    public void noOffset_untilTheWatchIsClearlyAheadOrBehind() {
        WatchClock c = new WatchClock();
        assertEquals(0, c.offset());
        // Arrivals 80 to 900 ms after they were sent: latency, not a clock difference.
        c.heard(NOW, NOW + 900);
        c.heard(NOW, NOW + 80);
        assertEquals(0, c.offset());
    }

    @Test
    public void watchBehind_countsFromTheEarliestArrival() {
        WatchClock c = new WatchClock();
        c.heard(NOW, NOW - 600);
        c.heard(NOW, NOW - 750);
        c.heard(NOW, NOW + 200);
        assertEquals(-750, c.offset());
    }

    @Test
    public void watchAhead_onlyPastTwoSeconds() {
        WatchClock c = new WatchClock();
        c.heard(NOW, NOW + 3_200);
        c.heard(NOW, NOW + 3_500);
        assertEquals(3_200, c.offset());
    }

    @Test
    public void ignoresItemsKeptForAWatchOutOfRange_andOldSamples() {
        WatchClock c = new WatchClock();
        c.heard(NOW, NOW + 5 * 60_000);
        c.heard(0, NOW);
        assertEquals(0, c.offset());
        c.heard(NOW, NOW - 900);
        for (int i = 0; i < WatchClock.SAMPLES; i++) c.heard(NOW, NOW + 100);
        assertEquals(0, c.offset());
    }

    @Test
    public void nextTick_landsJustAfterTheShownSecondChanges() {
        // 90.4 s of rest left: "1:31" changes to "1:30" in 400 ms.
        assertEquals(405, WatchClock.nextTick(NOW, NOW + 90_400));
        assertEquals(1005, WatchClock.nextTick(NOW, NOW + 90_000));
        // A count-up that started 2.3 s ago shows its next second in 700 ms.
        assertEquals(705, WatchClock.nextTick(NOW, NOW - 2_300));
        assertEquals(1000, WatchClock.nextTick(NOW, 0));
    }

    @Test
    public void shiftMovesRestAndTheSetTimerOntoTheWatchClock() {
        String json = "{\"restUntil\":" + (NOW + 60_000) + ",\"at\":" + NOW + "}";
        WorkoutState s = WorkoutState.parse(json, -1_500);
        assertEquals(NOW + 58_500, s.restUntil);
        assertEquals(NOW + 58_500, s.anchor(NOW));
        String timer = "{\"at\":" + NOW + ",\"timer\":[{\"from\":" + NOW + ",\"to\":" + (NOW + 5_000) + ",\"label\":\"Get set\"}]}";
        WorkoutState t = WorkoutState.parse(timer, 1_000);
        // The lead-in hasn't started yet on a watch whose clock is a second ahead.
        assertEquals(null, t.phase(NOW));
        assertEquals(NOW + 6_000, t.anchor(NOW + 1_000));
        assertEquals(5, t.phase(NOW + 1_000).seconds(NOW + 1_000));
    }
}
