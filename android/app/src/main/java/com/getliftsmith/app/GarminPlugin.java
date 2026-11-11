package com.getliftsmith.app;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Connected apps' Garmin row (src/lib/garmin.ts): which Garmin watches Garmin Connect knows, which are connected and
 * which have the Liftsmith watch app. Android finds the watches by itself (Garmin Connect shares its list), so
 * `choose` only matters on iOS; here it opens Garmin Connect, or its Play page when it's missing.
 */
@CapacitorPlugin(name = "Garmin")
public class GarminPlugin extends Plugin {

    @PluginMethod
    public void status(PluginCall call) {
        GarminLink.status(getContext(), (status) -> {
            try {
                call.resolve(JSObject.fromJSONObject(status));
            } catch (Exception e) {
                call.reject("garmin");
            }
        });
    }

    @PluginMethod
    public void choose(PluginCall call) {
        Intent open = getContext().getPackageManager().getLaunchIntentForPackage(GarminLink.GARMIN_CONNECT);
        if (open == null) {
            open = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + GarminLink.GARMIN_CONNECT));
        }
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(open);
        } catch (Exception e) {
            // No store either (some test devices).
        }
        call.resolve();
    }
}
