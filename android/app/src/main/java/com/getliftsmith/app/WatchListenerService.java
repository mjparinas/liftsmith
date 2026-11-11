package com.getliftsmith.app;

import android.content.Intent;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.WearableListenerService;
import java.nio.charset.StandardCharsets;

/**
 * Messages from the Wear OS app. Log set and +30 s go to the web app exactly like the notification's buttons
 * (WorkoutService's broadcast, which WorkoutSessionPlugin turns into an "action" event); heart rate from the
 * watch's sensor becomes a "heartRate" event, used when no Bluetooth monitor is connected. Motion batches (Labs,
 * watch rep counting) become "watchMotion" events, counted by the web app (src/lib/reps/watchMotion.ts).
 */
public class WatchListenerService extends WearableListenerService {

    static final String PATH_ACTION = "/liftsmith/action";
    static final String PATH_HR = "/liftsmith/hr";
    static final String BROADCAST_HR = "com.getliftsmith.app.WATCH_HR";
    static final String EXTRA_BPM = "bpm";
    static final String PATH_MOTION = "/liftsmith/motion";
    static final String BROADCAST_MOTION = "com.getliftsmith.app.WATCH_MOTION";
    static final String EXTRA_MOTION = "motion";

    @Override
    public void onMessageReceived(MessageEvent event) {
        String body = new String(event.getData(), StandardCharsets.UTF_8);
        if (PATH_ACTION.equals(event.getPath())) {
            String action = WatchMessages.action(body);
            if (action == null) return;
            sendBroadcast(new Intent(WorkoutService.BROADCAST_ACTION).setPackage(getPackageName()).putExtra(WorkoutService.EXTRA_ACTION, action));
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
