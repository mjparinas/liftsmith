package com.getliftsmith.app.wear;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.util.Calendar;
import org.junit.Test;

public class TodayStateTest {

    private static long at(int y, int m, int d, int h) {
        Calendar c = Calendar.getInstance();
        c.clear();
        c.set(y, m - 1, d, h, 0, 0);
        return c.getTimeInMillis();
    }

    @Test
    public void dayKeyMatchesThePhonesWithoutLeadingZeros() {
        assertEquals("2026-11-6", TodayState.dayKey(at(2026, 11, 6, 9)));
        assertEquals("2027-1-1", TodayState.dayKey(at(2027, 1, 1, 0)));
    }

    @Test
    public void todayIsCurrentOnlyOnItsOwnDay() {
        TodayState t = TodayState.parse(
            "{\"day\":\"2026-11-26\",\"kind\":\"push\",\"title\":\"Push · 45 min\",\"why\":\"Slept well\",\"call\":\"Push\",\"mins\":\"45 min\",\"ready\":\"Readiness 82\"}"
        );
        assertTrue(t.current(at(2026, 11, 26, 23)));
        assertFalse(t.current(at(2026, 11, 27, 0)));
        assertEquals("45 min · Readiness 82", t.detail());
        assertFalse(t.active());
    }

    @Test
    public void detailLeavesOutWhatsEmptyAndCallFallsBackToTheTitle() {
        TodayState rest = TodayState.parse("{\"day\":\"d\",\"kind\":\"rest\",\"title\":\"Rest day\"}");
        assertEquals("Rest day", rest.call);
        assertEquals("", rest.detail());
        TodayState noScore = TodayState.parse("{\"day\":\"d\",\"kind\":\"normal\",\"title\":\"T\",\"mins\":\"30 min\"}");
        assertEquals("30 min", noScore.detail());
        assertTrue(TodayState.parse("{\"day\":\"d\",\"kind\":\"active\",\"title\":\"In progress\"}").active());
    }

    @Test
    public void junkIsNothing() {
        assertNull(TodayState.parse(null));
        assertNull(TodayState.parse(""));
        assertNull(TodayState.parse("nope"));
        assertNull(TodayState.parse("{\"kind\":\"push\"}"));
    }

    @Test
    public void staleAtTheNextMidnight() {
        long now = at(2026, 11, 26, 22);
        long left = TodayState.untilMidnight(now);
        assertEquals("2026-11-27", TodayState.dayKey(now + left));
        assertTrue(left <= 2 * 3_600_000L + 10_000L);
    }
}
