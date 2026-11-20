package com.getliftsmith.app.wear;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.core.content.ContextCompat;
import androidx.wear.remote.interactions.RemoteActivityHelper;
import com.google.android.gms.wearable.CapabilityClient;
import com.google.android.gms.wearable.CapabilityInfo;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.Wearable;
import com.google.common.util.concurrent.ListenableFuture;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * Finds the phone and whether it has Liftsmith, which the watch app needs (it's not standalone). The phone app
 * declares the "liftsmith_phone" capability (android/app/src/main/res/values/wear.xml). With it the watch offers
 * Start on phone; a connected phone without it gets Install on phone (Play on the phone); no phone at all says so.
 */
final class PhoneLink {

    static final String CAPABILITY = "liftsmith_phone";
    static final String START_URI = "liftsmith://start";
    static final String STORE_URI = "market://details?id=com.getliftsmith.app";

    enum Status {
        /** Not looked yet. */
        CHECKING,
        /** A phone with Liftsmith is connected. */
        READY,
        /** A phone is connected but doesn't have Liftsmith. */
        NO_APP,
        /** No phone in reach. */
        OFFLINE,
    }

    /** What the watch shows, from the connected nodes and the ones with the phone app among them. */
    static Status statusOf(int connected, int withApp) {
        if (withApp > 0) return Status.READY;
        return connected > 0 ? Status.NO_APP : Status.OFFLINE;
    }

    private PhoneLink() {}

    /** Looks for the phone: connected nodes, then which of them have the phone app. Answers on the main thread. */
    static void check(Context context, Consumer<Result> done) {
        Context app = context.getApplicationContext();
        try {
            Wearable.getNodeClient(app)
                .getConnectedNodes()
                .addOnSuccessListener((List<Node> nodes) ->
                    Wearable.getCapabilityClient(app)
                        .getCapability(CAPABILITY, CapabilityClient.FILTER_REACHABLE)
                        .addOnSuccessListener((CapabilityInfo info) -> {
                            List<String> ids = new ArrayList<>();
                            for (Node n : info.getNodes()) ids.add(n.getId());
                            List<String> all = new ArrayList<>();
                            for (Node n : nodes) all.add(n.getId());
                            done.accept(new Result(statusOf(all.size(), ids.size()), ids, all));
                        })
                        .addOnFailureListener((e) -> done.accept(new Result(statusOf(nodes.size(), 0), new ArrayList<>(), ids(nodes))))
                )
                .addOnFailureListener((e) -> done.accept(new Result(Status.OFFLINE, new ArrayList<>(), new ArrayList<>())));
        } catch (Exception e) {
            done.accept(new Result(Status.OFFLINE, new ArrayList<>(), new ArrayList<>()));
        }
    }

    private static List<String> ids(List<Node> nodes) {
        List<String> out = new ArrayList<>();
        for (Node n : nodes) out.add(n.getId());
        return out;
    }

    /** Opens a link on the phone (the app's start shortcut, or Play's page for the app). Reports whether it went. */
    static void open(Context context, String uri, String nodeId, Consumer<Boolean> done) {
        Context app = context.getApplicationContext();
        try {
            RemoteActivityHelper helper = new RemoteActivityHelper(app, ContextCompat.getMainExecutor(app));
            Intent intent = new Intent(Intent.ACTION_VIEW).addCategory(Intent.CATEGORY_BROWSABLE).setData(Uri.parse(uri));
            ListenableFuture<Void> f = helper.startRemoteActivity(intent, nodeId);
            f.addListener(
                () -> {
                    boolean ok;
                    try {
                        f.get();
                        ok = true;
                    } catch (Exception e) {
                        ok = false;
                    }
                    done.accept(ok);
                },
                ContextCompat.getMainExecutor(app)
            );
        } catch (Exception e) {
            done.accept(false);
        }
    }

    static final class Result {
        final Status status;
        /** Phones with Liftsmith. */
        final List<String> phones;
        /** Every connected node. */
        final List<String> connected;

        Result(Status status, List<String> phones, List<String> connected) {
            this.status = status;
            this.phones = phones;
            this.connected = connected;
        }
    }
}
