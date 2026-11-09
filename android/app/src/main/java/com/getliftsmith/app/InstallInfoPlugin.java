package com.getliftsmith.app;

import android.content.Context;
import android.content.pm.InstallSourceInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Device and install details for usage analytics (src/lib/installInfo.ts): the device model and Android version,
 * the store that installed the app, and the Play Install Referrer (the utm_* tags on the Play link that brought
 * the lifter in). It never reads the advertising id. iOS counterpart: ios/App/App/InstallInfoPlugin.swift.
 */
@CapacitorPlugin(name = "InstallInfo")
public class InstallInfoPlugin extends Plugin {

    private static final String PREFS = "liftsmith.installInfo";
    private static final String REFERRER = "installReferrer";

    @PluginMethod
    public void get(PluginCall call) {
        Context ctx = getContext();
        JSObject out = new JSObject();
        out.put("platform", "android");
        out.put("os", "Android");
        out.put("osVersion", Build.VERSION.RELEASE);
        out.put("manufacturer", Build.MANUFACTURER);
        out.put("model", Build.MODEL);
        out.put("store", store(ctx));
        try {
            PackageInfo p = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0);
            out.put("appVersion", p.versionName);
            out.put("build", String.valueOf(Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? p.getLongVersionCode() : p.versionCode));
        } catch (PackageManager.NameNotFoundException ignored) {
            // Leave the version to the web layer.
        }
        // The referrer never changes for an install, so it's read from Play once and kept.
        String cached = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(REFERRER, null);
        if (cached != null) {
            out.put("installReferrer", cached);
            call.resolve(out);
            return;
        }
        readReferrer(ctx, call, out);
    }

    private String store(Context ctx) {
        String installer = null;
        try {
            PackageManager pm = ctx.getPackageManager();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                InstallSourceInfo info = pm.getInstallSourceInfo(ctx.getPackageName());
                installer = info.getInstallingPackageName();
            } else {
                installer = pm.getInstallerPackageName(ctx.getPackageName());
            }
        } catch (Exception ignored) {
            // Unknown installer.
        }
        if (installer == null) return "sideload";
        if (installer.equals("com.android.vending")) return "play";
        if (installer.equals("com.sec.android.app.samsungapps")) return "galaxy";
        if (installer.equals("com.amazon.venezia")) return "amazon";
        return "other:" + installer;
    }

    private void readReferrer(Context ctx, PluginCall call, JSObject out) {
        final InstallReferrerClient client;
        try {
            client = InstallReferrerClient.newBuilder(ctx).build();
        } catch (Exception e) {
            call.resolve(out);
            return;
        }
        final boolean[] done = { false };
        client.startConnection(new InstallReferrerStateListener() {
            @Override
            public void onInstallReferrerSetupFinished(int code) {
                if (done[0]) return;
                done[0] = true;
                if (code == InstallReferrerClient.InstallReferrerResponse.OK) {
                    try {
                        ReferrerDetails d = client.getInstallReferrer();
                        String ref = d.getInstallReferrer();
                        if (ref != null) {
                            ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(REFERRER, ref).apply();
                            out.put("installReferrer", ref);
                        }
                    } catch (Exception ignored) {
                        // No referrer: resolve without it.
                    }
                }
                try {
                    client.endConnection();
                } catch (Exception ignored) {}
                call.resolve(out);
            }

            @Override
            public void onInstallReferrerServiceDisconnected() {
                if (done[0]) return;
                done[0] = true;
                call.resolve(out);
            }
        });
    }
}
