package com.getliftsmith.app;

import android.os.Bundle;
import android.view.KeyEvent;
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
        super.onCreate(savedInstanceState);
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
