package com.getliftsmith.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebSettings;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WorkoutSessionPlugin.class);
        registerPlugin(CalendarPlugin.class);
        registerPlugin(InstallInfoPlugin.class);
        registerPlugin(VoiceCoachPlugin.class);
        registerPlugin(AppIconPlugin.class);
        registerPlugin(AccountSignInPlugin.class);
        registerPlugin(HealthWorkoutPlugin.class);
        registerPlugin(GarminPlugin.class);
        registerPlugin(SpeechLogPlugin.class);
        registerPlugin(VolumeKeysPlugin.class);
        registerPlugin(StoreReviewPlugin.class);
        registerPlugin(AppUpdatePlugin.class);
        registerPlugin(NowPlayingPlugin.class);
        registerPlugin(ScreenshotsPlugin.class);
        registerPlugin(ScreenAwakePlugin.class);
        registerPlugin(AppBadgePlugin.class);
        // Edge to edge on every Android version, not only 15+ where it's enforced: the page draws under the
        // status and navigation bars and keeps clear of them with env(safe-area-inset-*) (Capacitor's SystemBars
        // passes the insets through). Transparent bars with light icons to start, as the app opens dark; the
        // page switches the icons with the theme (src/lib/appearance.ts). Replaces @capacitor/status-bar, whose
        // colour calls Play flags as deprecated edge-to-edge APIs (docs/decisions/platform-deltas.md).
        // It must run after super.onCreate: BridgeActivity switches from the splash theme to AppTheme.NoActionBar
        // there, and enable() builds the window's decor. Built under the splash theme (on Android 12+ a platform
        // theme with an action bar), every screen got a "Liftsmith" title bar with a stretched icon.
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this, SystemBarStyle.dark(Color.TRANSPARENT), SystemBarStyle.dark(Color.TRANSPARENT));
        // The app fills the screen and doesn't pinch or double-tap zoom (src/lib/nativeZoom.ts locks the
        // page's viewport too). Text size follows the phone's own setting through TextZoom instead.
        WebSettings web = getBridge().getWebView().getSettings();
        web.setSupportZoom(false);
        web.setBuiltInZoomControls(false);
        web.setDisplayZoomControls(false);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        // Volume up logs a set while that lab is on during a workout (VolumeKeysPlugin).
        if (VolumeKeysPlugin.handleKey(event)) return true;
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onStop() {
        super.onStop();
        // An earned app icon picked in Settings switches once the app is in the background.
        AppIconPlugin.applyPending(this);
    }
}
