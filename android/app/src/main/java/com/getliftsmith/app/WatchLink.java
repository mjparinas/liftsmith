package com.getliftsmith.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.core.content.ContextCompat;
import androidx.wear.remote.interactions.RemoteActivityHelper;
import com.google.android.gms.wearable.CapabilityClient;
import com.google.android.gms.wearable.CapabilityInfo;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.PutDataMapRequest;
import com.google.android.gms.wearable.PutDataRequest;
import com.google.android.gms.wearable.Wearable;
import java.util.Set;
import org.json.JSONObject;

/**
 * Phone side of the Wear OS app (android/wear). The live workout goes to the watch as one Data Layer item,
 * "/liftsmith/workout", which the system keeps in step on both devices, so a watch that was out of range or
 * asleep catches up as soon as it's back. The watch's Log set, +30 s and heart rate come back through
 * WatchListenerService. Nothing is sent when no watch has the app (Data Layer calls are cheap no-ops then).
 * iOS counterpart: ios/App/App/WatchLink.swift.
 */
final class WatchLink {

    static final String PATH_WORKOUT = "/liftsmith/workout";
    /** Today's call for the watch tile and complication (WatchMessages.today), kept apart from the live workout. */
    static final String PATH_TODAY = "/liftsmith/today";
    /** Declared by the watch app (wear/src/main/res/values/wear.xml), so only watches with it are opened. */
    static final String CAPABILITY = "liftsmith_watch";

    private static String launchedFor = null;

    private WatchLink() {}

    /** The workout as the watch shows it: the notification's own fields plus when it was sent. */
    static void update(Context context, JSONObject state) {
        try {
            state.put("at", System.currentTimeMillis());
            // The steps after a Machine taken tap are for the phone's own service (WorkoutService), not the watch.
            JSONObject forWatch = new JSONObject(state.toString());
            forWatch.remove("takenStep");
            PutDataMapRequest req = PutDataMapRequest.create(PATH_WORKOUT);
            req.getDataMap().putString("json", forWatch.toString());
            PutDataRequest put = req.asPutDataRequest().setUrgent();
            Wearable.getDataClient(context).putDataItem(put);
        } catch (Exception ignored) {
            // No Play services (some Android builds): the phone app works the same without a watch.
        }
        String session = state.optString("sessionId", "");
        if (!session.isEmpty() && !session.equals(launchedFor)) {
            launchedFor = session;
            openOnWatch(context);
        }
    }

    /** The workout ended: the watch goes back to its "start on your phone" screen. */
    static void stop(Context context) {
        launchedFor = null;
        try {
            Uri uri = new Uri.Builder().scheme("wear").path(PATH_WORKOUT).build();
            Wearable.getDataClient(context).deleteDataItems(uri);
        } catch (Exception ignored) {
            // No Play services.
        }
    }

    /**
     * Today's call for the watch's tile and complication, from the home-screen widget's snapshot, which the app sends
     * only when a line changes (src/lib/widget.ts). The Data Layer skips an item whose bytes didn't change, so nothing
     * wakes the watch for nothing. An empty snapshot (signed out) takes it off the watch.
     */
    static void today(Context context, String snapshot) {
        JSONObject today = WatchMessages.today(snapshot);
        try {
            if (today == null) {
                Uri uri = new Uri.Builder().scheme("wear").path(PATH_TODAY).build();
                Wearable.getDataClient(context).deleteDataItems(uri);
                return;
            }
            PutDataMapRequest req = PutDataMapRequest.create(PATH_TODAY);
            req.getDataMap().putString("json", today.toString());
            Wearable.getDataClient(context).putDataItem(req.asPutDataRequest());
        } catch (Exception ignored) {
            // No Play services: no watch to tell.
        }
    }

    /** Today's plan worked out set by set, for a workout on the watch with the phone away (src/lib/watchWorkout.ts). */
    static final String PATH_CARRY = "/liftsmith/carry";

    /**
     * Today's carried plan (WatchMessages.carry checks it). Like today's call, the Data Layer skips bytes that didn't
     * change, so a watch only wakes for a new plan; an empty one takes it off the watch.
     */
    static void carry(Context context, String json) {
        String carry = WatchMessages.carry(json);
        try {
            if (carry == null) {
                Uri uri = new Uri.Builder().scheme("wear").path(PATH_CARRY).build();
                Wearable.getDataClient(context).deleteDataItems(uri);
                return;
            }
            PutDataMapRequest req = PutDataMapRequest.create(PATH_CARRY);
            req.getDataMap().putString("json", carry);
            Wearable.getDataClient(context).putDataItem(req.asPutDataRequest());
        } catch (Exception ignored) {
            // No Play services: no watch to tell.
        }
    }

    /**
     * Watch workouts whose item is still on the Data Layer (they arrived while the listener couldn't run): kept now,
     * then `then` runs. Called when the app opens.
     */
    static void collect(Context context, Runnable then) {
        try {
            Uri uri = new Uri.Builder().scheme("wear").path(WatchListenerService.PATH_DONE).build();
            Wearable.getDataClient(context)
                .getDataItems(uri, com.google.android.gms.wearable.DataClient.FILTER_PREFIX)
                .addOnSuccessListener((com.google.android.gms.wearable.DataItemBuffer items) -> {
                    for (com.google.android.gms.wearable.DataItem item : items) {
                        WatchListenerService.take(
                            context,
                            item.getUri(),
                            com.google.android.gms.wearable.DataMapItem.fromDataItem(item).getDataMap().getString("json")
                        );
                    }
                    items.release();
                    then.run();
                })
                .addOnFailureListener((Exception e) -> then.run());
        } catch (Exception e) {
            then.run();
        }
    }

    /** A workout started on the phone: open the watch app, so heart rate and the rest buzz start with it. */
    private static void openOnWatch(Context context) {
        try {
            Wearable.getCapabilityClient(context)
                .getCapability(CAPABILITY, CapabilityClient.FILTER_REACHABLE)
                .addOnSuccessListener((CapabilityInfo info) -> {
                    Set<Node> nodes = info.getNodes();
                    RemoteActivityHelper helper = new RemoteActivityHelper(context, ContextCompat.getMainExecutor(context));
                    Intent open = new Intent(Intent.ACTION_VIEW)
                        .addCategory(Intent.CATEGORY_BROWSABLE)
                        .setData(Uri.parse("liftsmith://watch"));
                    for (Node n : nodes) helper.startRemoteActivity(open, n.getId());
                });
        } catch (Exception ignored) {
            // No Play services.
        }
    }
}
