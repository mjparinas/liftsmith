package com.getliftsmith.app;

import android.view.WindowManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Keeps the screen on while a workout, a stretching routine or a timed tool is on screen (keepAwake in
 * src/lib/juice.ts). The browser's Screen Wake Lock isn't there in every Android WebView, so the app sets
 * the window's keep-screen-on flag instead. It only holds while the app is in front: Android ignores the
 * flag for a hidden window, so a backgrounded app never keeps the screen lit. iOS counterpart:
 * ScreenAwakePlugin in DelightPlugins.swift (the idle timer).
 */
@CapacitorPlugin(name = "ScreenAwake")
public class ScreenAwakePlugin extends Plugin {

    @PluginMethod
    public void set(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        if (getActivity() == null) {
            call.resolve();
            return;
        }
        getActivity()
            .runOnUiThread(() -> {
                if (on) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                call.resolve();
            });
    }
}
