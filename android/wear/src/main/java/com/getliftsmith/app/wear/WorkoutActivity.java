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
import com.google.android.gms.wearable.CapabilityClient;
import com.google.android.gms.wearable.Wearable;

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
            // Without a phone that has the app, look again every 15 s (a phone that just got Liftsmith, or came back).
            if (WatchHub.phone() != PhoneLink.Status.READY && ++sinceCheck >= 15) {
                sinceCheck = 0;
                WatchHub.findPhones(getApplicationContext(), () -> {});
            }
            render();
            tick.postDelayed(this, 1000);
        }
    };
    private boolean asked = false;
    private TextView set, title, big, sub, hr, note;
    private Button log, add, phone;
    /** What the last Start on phone or Install on phone tap said ("Check your phone"), until the state changes. */
    private int tapNote = 0;
    private PhoneLink.Status tapFor = null;
    private int sinceCheck = 0;
    /** A phone with Liftsmith came or went (PhoneLink.CAPABILITY): look again. */
    private final CapabilityClient.OnCapabilityChangedListener capability = (info) -> WatchHub.findPhones(getApplicationContext(), () -> {});

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
        phone = findViewById(R.id.phone);
        note = findViewById(R.id.note);
        log.setOnClickListener((v) -> tap(v, "log"));
        add.setOnClickListener((v) -> tap(v, "add30"));
        phone.setOnClickListener(this::openOnPhone);
    }

    /** Start on phone (the app's start shortcut) or Install on phone (Play's page for the app), on the phone. */
    private void openOnPhone(View v) {
        String node = WatchHub.phoneNode();
        PhoneLink.Status status = WatchHub.phone();
        if (node == null || (status != PhoneLink.Status.READY && status != PhoneLink.Status.NO_APP)) return;
        v.performHapticFeedback(HapticFeedbackConstants.CONFIRM);
        boolean install = status == PhoneLink.Status.NO_APP;
        PhoneLink.open(this, install ? PhoneLink.STORE_URI : PhoneLink.START_URI, node, (Boolean ok) -> {
            tapFor = status;
            tapNote = ok ? R.string.check_phone : install ? R.string.install_failed : R.string.open_failed;
            render();
        });
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
        try {
            Wearable.getCapabilityClient(this).addListener(capability, PhoneLink.CAPABILITY);
        } catch (Exception ignored) {
            // No Play services on this watch: the screen says the phone isn't connected.
        }
        tick.post(everySecond);
    }

    @Override
    protected void onPause() {
        WatchHub.unlisten(this);
        try {
            Wearable.getCapabilityClient(this).removeListener(capability, PhoneLink.CAPABILITY);
        } catch (Exception ignored) {
            // No Play services.
        }
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
        PhoneLink.Status link = WatchHub.phone();
        if (tapFor != link) tapNote = 0;
        if (s == null) {
            set.setVisibility(View.GONE);
            big.setVisibility(View.GONE);
            hr.setVisibility(View.GONE);
            log.setVisibility(View.GONE);
            add.setVisibility(View.GONE);
            // Not standalone: say what the phone needs, and offer the one step that gets there.
            switch (link) {
                case NO_APP:
                    title.setText(R.string.no_app_title);
                    sub.setText(R.string.no_app_body);
                    phone.setText(R.string.install_on_phone);
                    phone.setVisibility(View.VISIBLE);
                    break;
                case OFFLINE:
                    title.setText(R.string.offline_title);
                    sub.setText(R.string.offline_body);
                    phone.setVisibility(View.GONE);
                    break;
                case READY:
                    title.setText(R.string.none_title);
                    sub.setText(R.string.none_body);
                    phone.setText(R.string.start_on_phone);
                    phone.setVisibility(View.VISIBLE);
                    break;
                case CHECKING:
                default:
                    title.setText(R.string.none_title);
                    sub.setText(R.string.none_body);
                    phone.setVisibility(View.GONE);
                    break;
            }
            sub.setVisibility(View.VISIBLE);
            note.setVisibility(tapNote == 0 ? View.GONE : View.VISIBLE);
            if (tapNote != 0) note.setText(tapNote);
            return;
        }
        phone.setVisibility(View.GONE);
        // Mid-workout with the phone out of reach: taps can't arrive, so say so instead of failing quietly.
        note.setVisibility(link == PhoneLink.Status.OFFLINE ? View.VISIBLE : View.GONE);
        if (link == PhoneLink.Status.OFFLINE) note.setText(R.string.offline_title);
        boolean resting = s.resting(now);
        // The set timer (holds, carries, cardio): its clock in the big line and what it's counting under it.
        WorkoutState.Phase phase = s.phase(now);
        set.setVisibility(s.setLabel.isEmpty() ? View.GONE : View.VISIBLE);
        set.setText(s.setLabel);
        title.setText(s.title);
        big.setVisibility(View.VISIBLE);
        if (phase != null) {
            String clock = WorkoutState.clock(phase.seconds(now));
            big.setText(clock);
            big.setContentDescription(phase.label + " " + clock);
            sub.setText(phase.label);
        } else {
            big.setText(resting ? WorkoutState.clock(s.restLeft(now)) : s.next);
            big.setContentDescription(resting ? getString(R.string.rest_left, WorkoutState.clock(s.restLeft(now))) : s.next);
            sub.setText(resting ? getString(R.string.up_next, s.next) : s.plates);
        }
        sub.setVisibility(sub.getText().length() == 0 ? View.GONE : View.VISIBLE);
        int bpm = WatchHub.bpm() > 0 ? WatchHub.bpm() : s.hr;
        hr.setVisibility(bpm > 0 ? View.VISIBLE : View.GONE);
        hr.setText(getString(R.string.bpm, bpm));
        log.setVisibility(View.VISIBLE);
        add.setVisibility(resting ? View.VISIBLE : View.GONE);
    }
}
