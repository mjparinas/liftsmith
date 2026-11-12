import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { healthAvailable, readHints, strengthKcal } from "./health";
import { chipText, onSessionAction } from "./sessionNotify";

describe("native wrappers on the web", () => {
  it("estimates strength-training calories at about 5 METs", () => {
    expect(strengthKcal(3600, 80)).toBe(400);
    expect(strengthKcal(1800, 70)).toBe(175);
    expect(strengthKcal(0, 80)).toBe(0);
  });

  it("treats Health as unavailable outside the native shell", async () => {
    expect(await healthAvailable()).toBe(false);
    expect(await readHints()).toEqual({});
  });

  it("returns a harmless unsubscribe when there is no native notification", () => {
    const off = onSessionAction(() => {});
    expect(off).toBeTypeOf("function");
    expect(() => off()).not.toThrow();
  });

  it("keeps the status bar chip short enough to show in full", () => {
    expect(chipText(false, 2, 4)).toBe("2/4");
    expect(chipText(true, 1, 2)).toBe("W1/2");
    // Android shows chip text only when it fits; under 7 characters always does.
    expect(chipText(true, 10, 12).length).toBeLessThan(7);
  });
});

describe("rest time left on the Android Live Update", () => {
  const app = join(__dirname, "../../android/app/src/main");
  const service = readFileSync(join(app, "java/com/getliftsmith/app/WorkoutService.java"), "utf8");

  it("says the time left once, in the text, the chip and a rest bar, with no second clock beside the title", () => {
    const resting = service.slice(service.indexOf("if (resting) {\n            // The rest bar"));
    expect(resting).toContain("b.setProgress(");
    expect(resting).toContain("b.setShortCriticalText(left)");
    // The header chronometer showed the rest time a second time to the right of the title (2026-11-12).
    expect(service).not.toContain("setUsesChronometer(true)");
    expect(resting.slice(0, resting.indexOf("} else {"))).toContain("b.setShowWhen(false)");
    expect(service).toContain("getString(R.string.rest_left_next, left, next)");
  });

  it("says rest is over in the live card itself, not in a second notification", () => {
    expect(service).toContain('putExtra("restDone", true)');
    expect(service).toContain("getString(R.string.rest_over)");
    expect(service).not.toContain("ID_ALERT");
    expect(service).toContain("nm.deleteNotificationChannel(CHANNEL_ALERT);");
    // A set logged from the card starts fresh, without the last rest's "Rest over".
    expect(service).toContain('putExtra("restDone", false)');
    const ios = readFileSync(join(__dirname, "../../ios/App/App/WorkoutSessionPlugin.swift"), "utf8");
    expect(ios).toContain("staleDate: restUntil");
    const live = readFileSync(join(__dirname, "../../ios/App/LiftsmithWidgets/WorkoutLiveActivity.swift"), "utf8");
    expect(live).toContain('Text("Rest over")');
  });

  it("redraws once a second only while resting, and stops when rest ends or the workout does", () => {
    expect(service).toMatch(/if \(resting\) scheduleTick\(restUntil\);/);
    expect(service).toMatch(/restOver = \(\) -> \{\s+handler\.removeCallbacks\(restTick\);/);
    expect(service.slice(service.indexOf("public void onDestroy()"))).toContain("handler.removeCallbacks(restTick);");
  });

  it("has the time-left text in every language, with both placeholders", () => {
    for (const dir of ["values", "values-es", "values-fr", "values-de", "values-it", "values-ja"]) {
      const xml = readFileSync(join(app, "res", dir, "strings.xml"), "utf8");
      expect(xml, dir).toMatch(/name="rest_left">[^<]*%1\$s/);
      expect(xml, dir).toMatch(/name="rest_left_next">[^<]*%1\$s[^<]*%2\$s/);
    }
  });
});

describe("Log set on the notification with the app closed", () => {
  const java = (f: string) => readFileSync(join(__dirname, "../../android/app/src/main/java/com/getliftsmith/app", f), "utf8");
  const ios = (f: string) => readFileSync(join(__dirname, "../../ios/App/App", f), "utf8");

  it("Android keeps the tap with its time and moves the notification on when no web app can hear it", () => {
    const service = java("WorkoutService.java");
    const tapped = service.slice(service.indexOf("private void tapped("));
    expect(tapped).toMatch(/if \(WorkoutSessionPlugin\.isLive\(\)\) \{\s+sendBroadcast\([^;]*putExtra\("at", at\)\);\s+return;/);
    expect(tapped).toContain("WorkoutTaps.add(this, action, at);");
    expect(tapped).toContain("ahead.optJSONObject(aheadAt)");
    expect(tapped).toContain('putExtra("restUntil", rest > 0 ? at + rest * 1000L : 0L)');
    // A fresh update from the app starts the look-ahead again.
    expect(service).toMatch(/ahead = WorkoutTaps\.parse\(intent\.getStringExtra\("ahead"\)\);\s+aheadAt = 0;/);
  });

  it("Android hands kept taps to the web app on load, and watch taps go the same way", () => {
    const plugin = java("WorkoutSessionPlugin.java");
    expect(plugin).toMatch(/WorkoutTaps\.drain\(getContext\(\)\)[\s\S]*?notifyListeners\("action", data, true\);[\s\S]*?current = this;/);
    expect(plugin).toContain("if (current == this) current = null;");
    expect(plugin).toContain('i.putExtra("ahead"');
    expect(java("WatchListenerService.java")).toContain("WorkoutService.tap(this, action);");
    expect(java("GarminLink.java")).toContain("WorkoutService.tap(context, action);");
  });

  it("iOS catches the rest-over alert's buttons from launch and hands them over when the app comes back", () => {
    const app = ios("AppDelegate.swift");
    expect(app).toMatch(
      /didFinishLaunchingWithOptions[\s\S]*?UNUserNotificationCenter\.current\(\)\.delegate = EarlyNotifications\.shared/,
    );
    const plugin = ios("WorkoutSessionPlugin.swift");
    expect(plugin).toContain("EarlyNotifications.shared.handOff(to: next)");
    expect(plugin).toContain("UIApplication.didBecomeActiveNotification");
    expect(plugin).toMatch(/if action == "log" \|\| action == "add30" \{ return tap\(action, done: completionHandler\) \}/);
    expect(plugin).toContain("WorkoutTaps.remember(state: state, ahead:");
    expect(plugin).toContain("values.isExcludedFromBackup = true");
  });
});
