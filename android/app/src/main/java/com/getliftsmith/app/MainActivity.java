package com.getliftsmith.app;

import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebSettings;
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
        registerPlugin(NowPlayingPlugin.class);
        super.onCreate(savedInstanceState);
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
