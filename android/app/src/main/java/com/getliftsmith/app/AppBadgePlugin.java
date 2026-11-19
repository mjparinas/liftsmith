package com.getliftsmith.app;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.service.notification.StatusBarNotification;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * The number on the app icon (src/lib/iconBadge.ts). Android's launchers draw the badge from the app's notifications:
 * each Friends or coaching push carries the count (FCM's notification_count, src/server/push.ts), so the icon shows
 * it while the app is closed. Once the lifter has seen everything in the app (the count is 0), this clears those
 * pushes from the shade, which takes the badge away. The workout's own notification (another channel) stays.
 * iOS counterpart: AppBadgePlugin in DelightPlugins.swift (sets the number itself).
 */
@CapacitorPlugin(name = "AppBadge")
public class AppBadgePlugin extends Plugin {

    /** The channel Friends and coaching pushes use (src/lib/push.ts and push.ts on the server). */
    static final String CHANNEL = "friends";

    @PluginMethod
    public void set(PluginCall call) {
        int count = call.getInt("count", 0);
        if (count > 0 || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.resolve();
            return;
        }
        try {
            NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                for (StatusBarNotification sbn : nm.getActiveNotifications()) {
                    Notification n = sbn.getNotification();
                    if (n != null && CHANNEL.equals(n.getChannelId())) nm.cancel(sbn.getTag(), sbn.getId());
                }
            }
        } catch (Exception ignored) {
            // a badge is a nicety; never break the app over it
        }
        call.resolve();
    }
}
