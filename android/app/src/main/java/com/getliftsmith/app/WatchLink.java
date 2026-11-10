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
    /** Declared by the watch app (wear/src/main/res/values/wear.xml), so only watches with it are opened. */
    static final String CAPABILITY = "liftsmith_watch";

    private static String launchedFor = null;

    private WatchLink() {}

    /** The workout as the watch shows it: the notification's own fields plus when it was sent. */
    static void update(Context context, JSONObject state) {
        try {
            state.put("at", System.currentTimeMillis());
            PutDataMapRequest req = PutDataMapRequest.create(PATH_WORKOUT);
            req.getDataMap().putString("json", state.toString());
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
