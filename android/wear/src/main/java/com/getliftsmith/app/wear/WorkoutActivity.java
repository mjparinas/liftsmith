package com.getliftsmith.app.wear;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.HapticFeedbackConstants;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.widget.Button;
import android.widget.TextView;
import org.json.JSONException;
import org.json.JSONObject;
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
    private TextView set, title, why, big, sub, hr, note, takenTo, weight, reps, askQ;
    private Button log, add, taken, phone;
    private View scroll, adjust, weightRow, askBox;
    private final Button[] askButtons = new Button[3];
    /**
     * The set as changed on the watch (watch-apps.md "Adjust and rate a set"): for the set named `editKey`, the
     * weight in kg (kept as a weight, not a place on the ladder, so it survives the phone re-centring the ladder) and
     * the reps, and whether the crown moves the reps rather than the weight.
     */
    private String editKey = null;
    private double editKg = 0;
    private int editReps = 0;
    private boolean crownReps = false;
    private boolean edited = false;
    /** The exercise answered here, so its question goes until the phone sends the next state. */
    private String answered = null;
    private float crownTravel = 0;
    /** The weight and reps go to the phone a moment after the last change, so its screen shows them too. */
    private final Runnable sendAdjust = () -> {
        WorkoutState s = WatchHub.state();
        if (s != null && s.adj != null && s.adj.key.equals(editKey)) WatchHub.action(this, "adjust", fields(s.adj));
    };
    private static final long ADJUST_DELAY_MS = 800;
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
        why = findViewById(R.id.why);
        taken = findViewById(R.id.taken);
        takenTo = findViewById(R.id.taken_to);
        big = findViewById(R.id.big);
        sub = findViewById(R.id.sub);
        hr = findViewById(R.id.hr);
        log = findViewById(R.id.log);
        add = findViewById(R.id.add);
        phone = findViewById(R.id.phone);
        note = findViewById(R.id.note);
        scroll = findViewById(R.id.scroll);
        adjust = findViewById(R.id.adjust);
        weightRow = findViewById(R.id.weightRow);
        weight = findViewById(R.id.weight);
        reps = findViewById(R.id.reps);
        askBox = findViewById(R.id.askBox);
        askQ = findViewById(R.id.askQ);
        askButtons[0] = findViewById(R.id.ask0);
        askButtons[1] = findViewById(R.id.ask1);
        askButtons[2] = findViewById(R.id.ask2);
        for (int k = 0; k < 3; k++) {
            final int which = k;
            askButtons[k].setOnClickListener((v) -> rate(v, which));
        }
        findViewById(R.id.weightDown).setOnClickListener((v) -> stepWeight(v, -1));
        findViewById(R.id.weightUp).setOnClickListener((v) -> stepWeight(v, 1));
        findViewById(R.id.repsDown).setOnClickListener((v) -> stepReps(v, -1));
        findViewById(R.id.repsUp).setOnClickListener((v) -> stepReps(v, 1));
        weight.setOnClickListener((v) -> pickCrown(v, false));
        reps.setOnClickListener((v) -> pickCrown(v, true));
        // The crown or bezel moves the chosen number while a set can be changed, and scrolls the screen otherwise.
        scroll.setOnGenericMotionListener((v, e) -> crown(e));
        log.setOnClickListener((v) -> logSet(v));
        add.setOnClickListener((v) -> tap(v, "add30"));
        taken.setOnClickListener((v) -> tap(v, "taken"));
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

    /** Log set, with the weight and reps chosen here when the set can be changed. */
    private void logSet(View v) {
        tick.removeCallbacks(sendAdjust);
        WorkoutState s = WatchHub.state();
        WorkoutState.Adj a = adjustable(s);
        if (a == null) {
            tap(v, "log");
            return;
        }
        v.performHapticFeedback(HapticFeedbackConstants.CONFIRM);
        WatchHub.action(this, "log", fields(a));
    }

    private JSONObject fields(WorkoutState.Adj adj) {
        JSONObject o = new JSONObject();
        try {
            o.put("key", adj.key);
            if (adj.hasWeight()) o.put("kg", editKg);
            o.put("reps", editReps);
        } catch (JSONException ignored) {
            // Plain values; never thrown.
        }
        return o;
    }

    /** The set the watch can change now (lifting, no set timer), with its own changes brought in line, or null. */
    private WorkoutState.Adj adjustable(WorkoutState s) {
        long now = System.currentTimeMillis();
        if (s == null || s.adj == null || s.resting(now) || s.phase(now) != null) return null;
        if (!s.adj.key.equals(editKey)) {
            // A new set: start from what the phone planned.
            editKey = s.adj.key;
            editKg = s.adj.hasWeight() ? s.adj.kg[s.adj.i] : 0;
            editReps = s.adj.reps;
            crownReps = !s.adj.hasWeight();
            edited = false;
        } else if (!edited) {
            // Changed on the phone: follow it.
            editKg = s.adj.hasWeight() ? s.adj.kg[s.adj.i] : 0;
            editReps = s.adj.reps;
        }
        return s.adj;
    }

    private void stepWeight(View v, int dir) {
        WorkoutState.Adj a = adjustable(WatchHub.state());
        if (a == null || !a.hasWeight()) return;
        int at = a.nearest(editKg) + dir;
        if (at < 0 || at >= a.kg.length) {
            v.performHapticFeedback(HapticFeedbackConstants.REJECT);
            return;
        }
        editKg = a.kg[at];
        changed(v);
    }

    private void stepReps(View v, int dir) {
        WorkoutState.Adj a = adjustable(WatchHub.state());
        if (a == null) return;
        int next = WorkoutState.Adj.clampReps(editReps + dir);
        if (next == editReps) {
            v.performHapticFeedback(HapticFeedbackConstants.REJECT);
            return;
        }
        editReps = next;
        changed(v);
    }

    private void changed(View v) {
        edited = true;
        v.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
        tick.removeCallbacks(sendAdjust);
        tick.postDelayed(sendAdjust, ADJUST_DELAY_MS);
        render();
    }

    /** Which number the crown moves: tap the weight or the reps. */
    private void pickCrown(View v, boolean toReps) {
        WorkoutState.Adj a = adjustable(WatchHub.state());
        if (a == null || (!toReps && !a.hasWeight())) return;
        crownReps = toReps;
        v.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
        render();
    }

    /** A turn of the crown or bezel: one step of the chosen number for each notch's worth of travel. */
    private boolean crown(MotionEvent e) {
        if (e.getAction() != MotionEvent.ACTION_SCROLL || !e.isFromSource(InputDevice.SOURCE_ROTARY_ENCODER)) return false;
        WorkoutState.Adj a = adjustable(WatchHub.state());
        if (a == null) return false;
        crownTravel += -e.getAxisValue(MotionEvent.AXIS_SCROLL) * ViewConfiguration.get(this).getScaledVerticalScrollFactor();
        float notch = 48 * getResources().getDisplayMetrics().density;
        View target = crownReps ? reps : weight;
        while (Math.abs(crownTravel) >= notch) {
            // Turning up (clockwise) is heavier or more reps.
            int dir = crownTravel < 0 ? 1 : -1;
            crownTravel += dir * notch;
            if (crownReps) stepReps(target, dir);
            else stepWeight(target, dir);
        }
        return true;
    }

    /** One of the three answers to "How did it feel?". */
    private void rate(View v, int which) {
        WorkoutState s = WatchHub.state();
        if (s == null || s.ask == null) return;
        v.performHapticFeedback(HapticFeedbackConstants.CONFIRM);
        JSONObject o = new JSONObject();
        try {
            o.put("ex", s.ask.ex);
            o.put("v", s.ask.values[which]);
        } catch (JSONException ignored) {
            return;
        }
        WatchHub.action(this, "rate", o);
        answered = s.ask.ex;
        render();
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
        // The crown's turns reach the screen that has focus.
        scroll.requestFocus();
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
        // A change still waiting goes now, so it isn't lost when the screen goes.
        if (tick.hasCallbacks(sendAdjust)) {
            tick.removeCallbacks(sendAdjust);
            sendAdjust.run();
        }
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
            why.setVisibility(View.GONE);
            taken.setVisibility(View.GONE);
            takenTo.setVisibility(View.GONE);
            adjust.setVisibility(View.GONE);
            askBox.setVisibility(View.GONE);
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
        why.setVisibility(s.why.isEmpty() ? View.GONE : View.VISIBLE);
        why.setText(s.why);
        // Machine taken: only when the phone has a pick (and Pro); the line under it says what it swaps to.
        boolean canSwap = !s.taken.isEmpty() && phase == null;
        taken.setVisibility(canSwap ? View.VISIBLE : View.GONE);
        takenTo.setVisibility(canSwap ? View.VISIBLE : View.GONE);
        takenTo.setText(s.taken);
        taken.setContentDescription(getString(R.string.machine_taken) + ". " + s.taken);
        // The set's weight and reps, changed with − / + or the crown (watchAdjust.ts on the phone).
        WorkoutState.Adj a = adjustable(s);
        adjust.setVisibility(a == null ? View.GONE : View.VISIBLE);
        if (a != null) {
            big.setVisibility(View.GONE);
            weightRow.setVisibility(a.hasWeight() ? View.VISIBLE : View.GONE);
            if (a.hasWeight()) {
                String w = a.words[a.nearest(editKg)];
                weight.setText(w);
                weight.setContentDescription(getString(R.string.weight_value, w));
                weight.setTextColor(getColor(crownReps ? R.color.ink : R.color.accent));
            }
            String r = editReps + (a.repsWord.isEmpty() ? "" : " " + a.repsWord);
            reps.setText(r);
            reps.setContentDescription(getString(R.string.reps_value, r));
            reps.setTextColor(getColor(crownReps && a.hasWeight() ? R.color.accent : R.color.ink));
        }
        // How did it feel, after an exercise's last set, until answered here or on the phone.
        if (s.ask == null) answered = null;
        boolean asking = s.ask != null && !s.ask.ex.equals(answered);
        askBox.setVisibility(asking ? View.VISIBLE : View.GONE);
        if (asking) {
            askQ.setText(s.ask.question);
            for (int k = 0; k < 3; k++) askButtons[k].setText(s.ask.answers[k]);
        }
    }
}
