package com.liftsmith.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Earned app icons (src/lib/themes.ts). Each icon is a launcher activity-alias in AndroidManifest.xml
 * (.IconDefault, .IconForge, ...); switching enables one and disables the rest. The switch is applied
 * when the app goes to the background (MainActivity.onStop), because some launchers close an app whose
 * launcher entry changes while it's open. iOS counterpart: AppIconPlugin in ios/App/App/DelightPlugins.swift.
 */
@CapacitorPlugin(name = "AppIcon")
public class AppIconPlugin extends Plugin {

    static final String[] ICONS = { "default", "forge", "glacier", "aurora", "royal" };
    private static final String PREFS = "liftsmith.appIcon";

    @PluginMethod
    public void set(PluginCall call) {
        String name = call.getString("name", "default");
        if (alias(name) == null) {
            call.reject("Unknown icon " + name);
            return;
        }
        prefs(getContext()).edit().putString("pending", name).apply();
        call.resolve();
    }

    @PluginMethod
    public void get(PluginCall call) {
        SharedPreferences p = prefs(getContext());
        JSObject out = new JSObject();
        out.put("name", p.getString("pending", p.getString("current", "default")));
        call.resolve(out);
    }

    /** Called from MainActivity.onStop. */
    static void applyPending(Context ctx) {
        SharedPreferences p = prefs(ctx);
        String want = p.getString("pending", null);
        if (want == null || want.equals(p.getString("current", "default"))) return;
        PackageManager pm = ctx.getPackageManager();
        for (String name : ICONS) {
            int state = name.equals(want) ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
            pm.setComponentEnabledSetting(new ComponentName(ctx, alias(name)), state, PackageManager.DONT_KILL_APP);
        }
        p.edit().putString("current", want).remove("pending").apply();
    }

    private static String alias(String name) {
        for (String n : ICONS) {
            if (n.equals(name)) return "com.liftsmith.app.Icon" + Character.toUpperCase(n.charAt(0)) + n.substring(1);
        }
        return null;
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
