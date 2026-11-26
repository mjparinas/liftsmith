package com.getliftsmith.app;

import android.content.Intent;
import com.google.android.gms.wearable.DataEvent;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.DataMapItem;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.Wearable;
import com.google.android.gms.wearable.WearableListenerService;
import java.nio.charset.StandardCharsets;

/**
 * Messages from the Wear OS app. Log set and +30 s go to the web app exactly like the notification's buttons
 * (WorkoutService's broadcast, which WorkoutSessionPlugin turns into an "action" event); heart rate from the
 * watch's sensor becomes a "heartRate" event, used when no Bluetooth monitor is connected. Motion batches (Labs,
 * watch rep counting) become "watchMotion" events, counted by the web app (src/lib/reps/watchMotion.ts). A workout the
 * watch ran with the phone away arrives as a Data Layer item under "/liftsmith/done/", is kept (WatchWorkouts) and
 * deleted, which tells the watch it arrived, and waits for the web app to save it.
 */
public class WatchListenerService extends WearableListenerService {

    static final String PATH_ACTION = "/liftsmith/action";
    static final String PATH_HR = "/liftsmith/hr";
    static final String BROADCAST_HR = "com.getliftsmith.app.WATCH_HR";
    static final String EXTRA_BPM = "bpm";
    static final String PATH_MOTION = "/liftsmith/motion";
    static final String BROADCAST_MOTION = "com.getliftsmith.app.WATCH_MOTION";
    static final String EXTRA_MOTION = "motion";

    static final String PATH_DONE = "/liftsmith/done/";

    @Override
    public void onDataChanged(DataEventBuffer events) {
        for (DataEvent e : events) {
            if (e.getType() != DataEvent.TYPE_CHANGED) continue;
            String path = e.getDataItem().getUri().getPath();
            if (path == null || !path.startsWith(PATH_DONE)) continue;
            take(this, e.getDataItem().getUri(), DataMapItem.fromDataItem(e.getDataItem()).getDataMap().getString("json"));
        }
    }

    /** Keeps a watch workout and deletes its item, once it's safely kept (a full queue leaves it on the watch). */
    static void take(android.content.Context context, android.net.Uri uri, String json) {
        if (!WatchWorkouts.add(context, json)) return;
        try {
            Wearable.getDataClient(context).deleteDataItems(uri);
        } catch (Exception ignored) {
            // No Play services: it stays until the next time.
        }
        context.sendBroadcast(new Intent(WatchWorkouts.BROADCAST).setPackage(context.getPackageName()));
    }

    @Override
    public void onMessageReceived(MessageEvent event) {
        String body = new String(event.getData(), StandardCharsets.UTF_8);
        if (PATH_ACTION.equals(event.getPath())) {
            WatchMessages.Tap tap = WatchMessages.tap(body);
            if (tap == null) return;
            WorkoutService.tap(this, tap.action, tap.data);
        } else if (PATH_HR.equals(event.getPath())) {
            int bpm = WatchMessages.bpm(body);
            if (bpm <= 0) return;
            sendBroadcast(new Intent(BROADCAST_HR).setPackage(getPackageName()).putExtra(EXTRA_BPM, bpm));
        } else if (PATH_MOTION.equals(event.getPath())) {
            org.json.JSONObject motion = WatchMessages.motion(body);
            if (motion == null) return;
            sendBroadcast(new Intent(BROADCAST_MOTION).setPackage(getPackageName()).putExtra(EXTRA_MOTION, motion.toString()));
        }
    }
}
