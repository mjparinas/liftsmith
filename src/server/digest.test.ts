import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveAlertSettings } from "./alerts";
import { resetDb, run } from "./db";
import { digestData, digestDue, digestFrom, digestMail, localClock, sendDigest } from "./digest";
import { clearSystemCache } from "./systemHealth";

// 2026-11-12 16:00 UTC is 8 AM Pacific (standard time).
const NOW = Date.UTC(2026, 10, 12, 16);
const HOUR = 3_600_000;

const mailer = () => {
  const sent: { to: string; subject: string; text: string; html?: string }[] = [];
  return {
    sent,
    mail: async (to: string, subject: string, text: string, html?: string) => (sent.push({ to, subject, text, html }), true),
  };
};
const sub = (id: string, store: string, kind: string, usd: number | null, reason: string | null = null, install = "install-real") =>
  run(
    "INSERT INTO subscription_events (id, at, install_id, subscription, store, kind, plan, usd_micros, reason, source) VALUES (?, ?, ?, ?, ?, ?, 'annual', ?, ?, 'store')",
    [id, NOW - HOUR, install, `sub-${id}`, store, kind, usd, reason],
  );
const account = async (id: string, platform: string | null, at = NOW - HOUR) => {
  await run("INSERT INTO accounts (id, email, created_at, last_seen) VALUES (?, NULL, ?, ?)", [id, at, at]);
  if (platform)
    await run(
      "INSERT INTO account_sessions (token_hash, account_id, created_at, expires_at, last_seen, platform) VALUES (?, ?, ?, ?, ?, ?)",
      [`h-${id}`, id, at, at + 1e9, at, platform],
    );
};

beforeEach(async () => {
  await resetDb();
  clearSystemCache();
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
  vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("MAIL_POSTAL_ADDRESS", "1 Test Street, Testville");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("the morning digest", () => {
  it("counts sign-ups and installs by platform, and Pro by store, leaving test installs out", async () => {
    await account("a1", "android");
    await account("a2", "android");
    await account("a3", "ios");
    await account("a4", null); // no session yet: counted as web
    await account("old", "web", NOW - 30 * HOUR);
    await run("INSERT INTO installs (id, first_seen, last_seen, platform, test) VALUES ('install-real', ?, ?, 'android', 0)", [
      NOW - HOUR,
      NOW,
    ]);
    await run("INSERT INTO installs (id, first_seen, last_seen, platform, test) VALUES ('install-web', ?, ?, 'web', 0)", [NOW - HOUR, NOW]);
    await run("INSERT INTO installs (id, first_seen, last_seen, platform, test) VALUES ('install-test', ?, ?, 'ios', 1)", [
      NOW - HOUR,
      NOW,
    ]);
    await sub("p1", "play", "trial_start", null);
    await sub("p2", "play", "purchase", 39_990_000);
    await sub("w1", "web", "trial_convert", 6_990_000);
    await sub("w2", "web", "cancel", null, "unsubscribe");
    await sub("a1", "appstore", "expire", null, "billing");
    await sub("t1", "appstore", "purchase", 39_990_000, null, "install-test");
    const d = await digestData(NOW);
    expect(d.signups).toEqual({ android: 2, ios: 1, web: 1 });
    expect(d.installs).toEqual({ android: 1, ios: 0, web: 1 });
    expect(d.total).toMatchObject({ trials: 1, started: 2, payments: 2, usdMicros: 46_980_000, cancels: 1, failed: 1 });
    expect(d.money.appstore.payments).toBe(0);

    const g = digestFrom(d);
    expect(g.headline).toBe("Last 24 hours: 4 sign-ups, 2 payments ($46.98 US), 1 cancellation.");
    const text = g.sections.flatMap((s) => [...s.lines, ...(s.bullets ?? [])]).join("\n");
    expect(text).toContain("Sign-ups: 4 (Android 2, iOS 1, web 1).");
    expect(text).toContain("New installs: 2 (Android 1, iOS 0, web 1).");
    expect(text).toContain("Google Play: 1 trial, 1 new subscriber, $39.99 US");
    expect(text).toContain("Stripe (web): 1 new subscriber, $6.99 US, 1 cancellation");
    expect(text).toContain("App Store: 1 failed payment");
  });

  it("reads like Gradelings', with the panel link and the admin footer, in text and HTML", async () => {
    const g = digestFrom(await digestData(NOW));
    expect(g.subject).toMatch(/^Today: \d+ to do/);
    const m = digestMail(g, { postalAddress: "1 Test Street", contact: "hello@getliftsmith.com" }, "https://www.getliftsmith.com");
    for (const body of [m.text, m.html]) {
      expect(body).toContain("Your morning digest");
      expect(body).toContain("https://www.getliftsmith.com/admin/");
      expect(body).toContain("Turn alerts or the digest off in the admin panel under Automations.");
      expect(body).toContain("Liftsmith has no ads and never sells your information.");
      expect(body).toContain("hello@getliftsmith.com");
      expect(body).toContain("1 Test Street");
    }
    expect(m.html).not.toMatch(/<script/i);
  });

  it("goes out once per Pacific day at 8 AM, whichever of the two UTC runs comes first", () => {
    expect(localClock(NOW)).toEqual({ date: "2026-11-12", hour: 8 });
    // Standard time: the 15:00 UTC run is 7 AM, too early; the 16:00 run sends.
    expect(digestDue(Date.UTC(2026, 10, 12, 15), null)).toBe(false);
    expect(digestDue(NOW, null)).toBe(true);
    expect(digestDue(NOW, "2026-11-12")).toBe(false);
    // Daylight time: 15:00 UTC is 8 AM and sends; 16:00 finds it sent.
    expect(localClock(Date.UTC(2026, 6, 1, 15))).toEqual({ date: "2026-07-01", hour: 8 });
    expect(digestDue(Date.UTC(2026, 6, 1, 15), "2026-06-30")).toBe(true);
    expect(digestDue(Date.UTC(2026, 6, 1, 16), "2026-07-01")).toBe(false);
  });

  it("sends one to each admin with the HTML twin, once a day, unless it's off", async () => {
    const m = mailer();
    expect(await sendDigest({ now: Date.UTC(2026, 10, 12, 15), mail: m.mail })).toBe(0);
    expect(await sendDigest({ now: NOW, mail: m.mail })).toBe(1);
    expect(m.sent[0]).toMatchObject({ to: "owner@example.com" });
    expect(m.sent[0]!.html).toContain("<!doctype html>");
    expect(await sendDigest({ now: NOW + HOUR, mail: m.mail })).toBe(0);
    expect(await sendDigest({ now: NOW + HOUR, mail: m.mail, force: true })).toBe(1);
    await saveAlertSettings({ instant: true, digest: false });
    expect(await sendDigest({ now: NOW + 24 * HOUR, mail: m.mail })).toBe(0);
  });
});
