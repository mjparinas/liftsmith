package com.getliftsmith.app.wear;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

public class MotionBatchTest {

    @Test
    public void packsReadingsAfterTheFirstOnesTime() throws Exception {
        MotionBatch b = new MotionBatch();
        assertFalse(b.add(1000, 0.5, 0.1));
        assertFalse(b.add(1020, -0.25, -0.2));
        JSONObject o = new JSONObject(b.take());
        assertEquals(1000, o.getLong("t"));
        JSONArray s = o.getJSONArray("s");
        assertEquals(6, s.length());
        assertEquals(20, s.getInt(3));
        assertEquals(-0.25, s.getDouble(4), 1e-9);
        // Rotation is a size, never negative.
        assertEquals(0.2, s.getDouble(5), 1e-9);
        assertNull(b.take());
    }

    @Test
    public void sendsAboutFourTimesASecond() {
        MotionBatch b = new MotionBatch();
        boolean due = false;
        long t = 0;
        while (!due) {
            due = b.add(t, 0, 0);
            t += 20;
        }
        assertTrue(t - 20 >= MotionBatch.SEND_MS);
        assertTrue(b.size() <= MotionBatch.MAX);
    }

    @Test
    public void skipsReadingsTooCloseTogether() {
        MotionBatch b = new MotionBatch();
        b.add(0, 1, 0);
        b.add(5, 1, 0);
        b.add(20, 1, 0);
        assertEquals(2, b.size());
    }

    @Test
    public void upIsTheProjectionOnGravity() {
        float[] g = { 0f, 0f, 9.81f };
        assertEquals(2.0, MotionBatch.up(new float[] { 1f, 0f, 2f }, g), 1e-6);
        float[] tilted = { 9.81f, 0f, 0f };
        assertEquals(-1.5, MotionBatch.up(new float[] { -1.5f, 3f, 0f }, tilted), 1e-6);
    }
}
