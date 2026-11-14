package com.getliftsmith.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

/**
 * "A new version is ready" (src/lib/appUpdate.ts; docs/decisions/app-updates.md). Asks Google Play, in the
 * background on start, whether a newer version is out (Play In-App Updates). The lifter's tap on Update starts
 * Play's flexible update: Play asks once, downloads while they keep using the app, and the app shows Restart
 * when it's ready ("downloaded" event). An install that didn't come from Play never hears of an update, and if
 * Play's flow can't start, open() takes the lifter to the Play listing instead.
 * iOS counterpart: AppUpdatePlugin in DelightPlugins.swift (App Store lookup).
 */
@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

    private AppUpdateManager manager;
    private InstallStateUpdatedListener listener;

    private AppUpdateManager manager() {
        if (manager == null) manager = AppUpdateManagerFactory.create(getContext());
        return manager;
    }

    @PluginMethod
    public void check(PluginCall call) {
        JSObject out = new JSObject();
        out.put("available", false);
        try {
            manager()
                .getAppUpdateInfo()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        // Not installed from Play, no Play Store, or offline: nothing to offer.
                        call.resolve(out);
                        return;
                    }
                    AppUpdateInfo info = task.getResult();
                    boolean downloaded = info.installStatus() == InstallStatus.DOWNLOADED;
                    boolean available =
                        info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE ||
                        info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS;
                    out.put("available", available || downloaded);
                    out.put("downloaded", downloaded);
                    out.put("version", String.valueOf(info.availableVersionCode()));
                    Integer stale = info.clientVersionStalenessDays();
                    if (stale != null) out.put("staleDays", stale);
                    call.resolve(out);
                });
        } catch (Exception e) {
            call.resolve(out);
        }
    }

    /** Starts Play's flexible update. Resolves { started } once the lifter answers Play's dialog. */
    @PluginMethod
    public void start(PluginCall call) {
        if (getActivity() == null) {
            JSObject out = new JSObject();
            out.put("started", false);
            call.resolve(out);
            return;
        }
        watchInstall();
        manager()
            .getAppUpdateInfo()
            .addOnCompleteListener(task -> {
                JSObject out = new JSObject();
                out.put("started", false);
                if (!task.isSuccessful() || getActivity() == null) {
                    call.resolve(out);
                    return;
                }
                AppUpdateInfo info = task.getResult();
                if (info.installStatus() == InstallStatus.DOWNLOADED) {
                    out.put("started", true);
                    out.put("downloaded", true);
                    call.resolve(out);
                    return;
                }
                if (
                    info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE || !info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)
                ) {
                    call.resolve(out);
                    return;
                }
                try {
                    manager()
                        .startUpdateFlow(info, getActivity(), AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build())
                        .addOnCompleteListener(flow -> {
                            out.put("started", flow.isSuccessful() && flow.getResult() != null && flow.getResult() == android.app.Activity.RESULT_OK);
                            call.resolve(out);
                        });
                } catch (Exception e) {
                    call.resolve(out);
                }
            });
    }

    /** Installs a downloaded update. Play restarts the app, which reopens where it was (the workout is saved). */
    @PluginMethod
    public void complete(PluginCall call) {
        manager().completeUpdate();
        call.resolve();
    }

    /** Opens the app's Play Store page. */
    @PluginMethod
    public void open(PluginCall call) {
        String pkg = getContext().getPackageName();
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pkg));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Intent web = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + pkg));
            web.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getContext().startActivity(web);
            } catch (ActivityNotFoundException ignored) {
                // No store and no browser: nothing to open.
            }
        }
        call.resolve();
    }

    private void watchInstall() {
        if (listener != null) return;
        listener = state -> {
            if (state.installStatus() == InstallStatus.DOWNLOADED) {
                notifyListeners("downloaded", new JSObject(), true);
            } else if (state.installStatus() == InstallStatus.FAILED || state.installStatus() == InstallStatus.CANCELED) {
                notifyListeners("failed", new JSObject(), false);
            }
        };
        manager().registerListener(listener);
    }

    @Override
    protected void handleOnDestroy() {
        if (listener != null && manager != null) manager.unregisterListener(listener);
        listener = null;
    }
}
