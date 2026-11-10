package com.getliftsmith.app;

import android.os.Bundle;
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
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStop() {
        super.onStop();
        // An earned app icon picked in Settings switches once the app is in the background.
        AppIconPlugin.applyPending(this);
    }
}
