package com.getliftsmith.app;

import android.app.Activity;
import android.os.Build;
import androidx.annotation.ChecksSdkIntAtLeast;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Tells the web app when the lifter takes a screenshot of Liftsmith, so it can offer branded share cards with their
 * invite link (src/lib/screenshots.ts, docs/decisions/sharing.md "Share cards when you take a screenshot"). The
 * screenshot itself is never touched or blocked: Android takes it as usual, and the app only hears that it happened.
 *
 * Android 14 (API 34) and newer: Activity.ScreenCaptureCallback, registered while the activity is started (it only
 * fires for screenshots of this app's own window), with the install-time DETECT_SCREEN_CAPTURE permission. Older
 * Android has no way to know without reading the photo library, which we won't ask for, so it says unsupported and the
 * sheet never shows there. iOS counterpart: ScreenshotsPlugin in ios/App/App/DelightPlugins.swift.
 */
@CapacitorPlugin(name = "Screenshots")
public class ScreenshotsPlugin extends Plugin {

    private Object callback;
    private boolean registered;

    @ChecksSdkIntAtLeast(api = 34)
    private static boolean supported() {
        return Build.VERSION.SDK_INT >= 34;
    }

    @Override
    public void load() {
        if (!supported()) return;
        callback = (Activity.ScreenCaptureCallback) () -> notifyListeners("screenshot", new JSObject());
        register();
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject r = new JSObject();
        r.put("supported", supported());
        call.resolve(r);
    }

    @Override
    protected void handleOnStart() {
        register();
    }

    @Override
    protected void handleOnStop() {
        unregister();
    }

    private void register() {
        if (!supported() || registered || callback == null || getActivity() == null) return;
        try {
            getActivity().registerScreenCaptureCallback(getActivity().getMainExecutor(), (Activity.ScreenCaptureCallback) callback);
            registered = true;
        } catch (RuntimeException e) {
            // Missing permission or a destroyed activity: no sheet, the screenshot still works.
        }
    }

    private void unregister() {
        if (!supported() || !registered || callback == null || getActivity() == null) return;
        try {
            getActivity().unregisterScreenCaptureCallback((Activity.ScreenCaptureCallback) callback);
        } catch (RuntimeException e) {
            // Already gone with the activity.
        }
        registered = false;
    }
}
