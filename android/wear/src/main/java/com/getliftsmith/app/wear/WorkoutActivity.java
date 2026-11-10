package com.getliftsmith.app.wear;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

/**
 * The watch screen: the set, the weight and reps (or the rest countdown), plates, heart rate, and Log set and
 * +30 s. Everything comes from the phone; a tap goes back to the phone, which logs it and sends the next state.
 */
public class WorkoutActivity extends Activity implements WatchHub.Listener {

    private static final int ASK_HR = 1;
    private final Handler tick = new Handler(Looper.getMainLooper());
    private final Runnable everySecond = new Runnable() {
        @Override
        public void run() {
            render();
            tick.postDelayed(this, 1000);
        }
    };
    private boolean asked = false;
    private TextView set, title, big, sub, hr;
    private Button log, add;

    /** The heart rate permission: Wear OS 6 (API 36) has its own, older watches use body sensors. */
    static String hrPermission() {
        return Build.VERSION.SDK_INT >= 36 ? "android.permission.health.READ_HEART_RATE" : Manifest.permission.BODY_SENSORS;
    }

    static boolean hrAllowed(Context c) {
        return WorkoutService.granted(c, hrPermission());
    }

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        setContentView(R.layout.activity_workout);
        set = findViewById(R.id.set);
        title = findViewById(R.id.title);
        big = findViewById(R.id.big);
        sub = findViewById(R.id.sub);
        hr = findViewById(R.id.hr);
        log = findViewById(R.id.log);
        add = findViewById(R.id.add);
        log.setOnClickListener((v) -> tap(v, "log"));
        add.setOnClickListener((v) -> tap(v, "add30"));
    }

    private void tap(View v, String action) {
        v.performHapticFeedback(HapticFeedbackConstants.CONFIRM);
        WatchHub.action(this, action);
    }

    @Override
    protected void onResume() {
        super.onResume();
        WatchHub.listen(this);
        WatchHub.refresh(this);
        tick.post(everySecond);
    }

    @Override
    protected void onPause() {
        WatchHub.unlisten(this);
        tick.removeCallbacks(everySecond);
        super.onPause();
    }

    @Override
    public void changed() {
        WorkoutState s = WatchHub.state();
        if (s != null) {
            // Asked once, the first time a workout shows; without it the watch still logs sets, just no heart rate.
            // The workout notification (its icon on the watch face) needs notifications on Wear OS 4 and up.
            if (!hrAllowed(this) && !asked) {
                asked = true;
                requestPermissions(
                    Build.VERSION.SDK_INT >= 33 ? new String[] { hrPermission(), Manifest.permission.POST_NOTIFICATIONS } : new String[] { hrPermission() },
                    ASK_HR
                );
            } else if (hrAllowed(this)) WorkoutService.start(this);
        }
        render();
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == ASK_HR && hrAllowed(this) && WatchHub.state() != null) WorkoutService.start(this);
    }

    private void render() {
        WorkoutState s = WatchHub.state();
        long now = System.currentTimeMillis();
        if (s == null) {
            set.setVisibility(View.GONE);
            big.setVisibility(View.GONE);
            hr.setVisibility(View.GONE);
            log.setVisibility(View.GONE);
            add.setVisibility(View.GONE);
            title.setText(R.string.none_title);
            sub.setText(R.string.none_body);
            return;
        }
        boolean resting = s.resting(now);
        set.setVisibility(s.setLabel.isEmpty() ? View.GONE : View.VISIBLE);
        set.setText(s.setLabel);
        title.setText(s.title);
        big.setVisibility(View.VISIBLE);
        big.setText(resting ? WorkoutState.clock(s.restLeft(now)) : s.next);
        big.setContentDescription(resting ? getString(R.string.rest_left, WorkoutState.clock(s.restLeft(now))) : s.next);
        sub.setText(resting ? getString(R.string.up_next, s.next) : s.plates);
        sub.setVisibility(sub.getText().length() == 0 ? View.GONE : View.VISIBLE);
        int bpm = WatchHub.bpm() > 0 ? WatchHub.bpm() : s.hr;
        hr.setVisibility(bpm > 0 ? View.VISIBLE : View.GONE);
        hr.setText(getString(R.string.bpm, bpm));
        log.setVisibility(View.VISIBLE);
        add.setVisibility(resting ? View.VISIBLE : View.GONE);
    }
}
