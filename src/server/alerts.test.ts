import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

import * as automationsRoute from "@/app/api/admin/automations/route.api";
import * as maintenanceRoute from "@/app/api/admin/maintenance/route.api";
import * as systemRoute from "@/app/api/admin/system/route.api";
import { MAINTENANCE_CACHE_MS, openDuringMaintenance } from "@/lib/maintenance";
import { daysUntilFull, restoreDrillState } from "@/lib/systemHealth";
import { proxy } from "@/proxy.api";

import { finishSignIn, startSignIn } from "./adminAuth";
import {
  ALERT_GAP,
  alertForStoreEvent,
  digestLines,
  reportStaffFailure,
  saveAlertSettings,
  sendAlert,
  sendDigest,
  watchSystem,
} from "./alerts";
import { dbSize, sampleDbSize, sizeSamples } from "./capacity";
import { query, resetDb, run } from "./db";
import { clearMaintenanceCache, maintenanceOn, setMaintenance } from "./maintenance";
import { backupsCheck, clearSystemCache, securityCheck } from "./systemHealth";

const NOW = Date.UTC(2026, 10, 10, 13);
const DAY = 86_400_000;
const SITE = "https://www.getliftsmith.com";

const mailer = () => {
  const sent: { to: string; subject: string; text: string }[] = [];
  return { sent, mail: async (to: string, subject: string, text: string) => (sent.push({ to, subject, text }), true) };
};
async function cookieFor(email: string) {
  const r = await startSignIn(new Request(`${SITE}/api/admin/login/`, { method: "POST" }), email);
  const { devLink } = (await r.json()) as { devLink: string };
  const done = await finishSignIn(new Request(devLink));
  return `ls_admin=${/ls_admin=([^;]+)/.exec(done.headers.get("set-cookie") ?? "")![1]}`;
}
const send = (method: string, path: string, cookie: string, body: unknown) =>
  new Request(`${SITE}${path}`, { method, headers: { cookie, origin: SITE }, body: JSON.stringify(body) });
const subEvent = (id: string, kind: string, at: number, extra: Record<string, unknown> = {}) =>
  run(
    "INSERT INTO subscription_events (id, at, install_id, subscription, store, kind, plan, usd_micros, country, reason, source) VALUES (?, ?, ?, ?, 'play', ?, 'annual', ?, 'CA', ?, 'store')",
    [
      id,
      at,
      (extra.install as string) ?? "install-aaaa-1",
      (extra.sub as string) ?? "GPA.1",
      kind,
      (extra.usd as number) ?? 39_990_000,
      (extra.reason as string) ?? null,
    ],
  );

beforeEach(async () => {
  await resetDb();
  clearMaintenanceCache();
  clearSystemCache();
  vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
  vi.stubEnv("SUPPORT_EMAILS", "help@example.com");
  vi.stubEnv("RESEND_API_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("maintenance mode", () => {
  it("keeps the home page, admin, web app, store pages and machine endpoints open", () => {
    for (const p of [
      "/",
      "/admin/",
      "/api/admin/stats/",
      "/app/",
      "/privacy/",
      "/delete-account",
      "/api/health/",
      "/api/billing/revenuecat/",
      "/api/cron/reminders/",
      "/api/reminders/unsubscribe/",
      "/icon.svg",
    ])
      expect(openDuringMaintenance(p), p).toBe(true);
    for (const p of ["/exercises/", "/api/sync/", "/api/collect/", "/api/flags/", "/me/", "/api/account/"])
      expect(openDuringMaintenance(p), p).toBe(false);
  });

  it("answers 503 from the proxy while on, and reads the switch at most every 15 seconds", async () => {
    // The proxy reads the clock itself; pin it to NOW, or once the real time passes NOW its cached reading
    // looks newer than NOW + the cache time and the switch never seems stale.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    onTestFinished(() => void vi.useRealTimers());
    const req = (path: string) =>
      ({ nextUrl: new URL(`${SITE}${path}`), headers: new Headers({ origin: "capacitor://localhost" }) }) as never;
    // The proxy reads the clock itself, so pin it to NOW: the cache times below are counted from there.
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    try {
      expect((await proxy(req("/api/sync/"))).status).toBe(200);
      await setMaintenance(true, "owner@example.com", NOW);
      const api = await proxy(req("/api/sync/"));
      expect(api.status).toBe(503);
      expect(api.headers.get("x-maintenance")).toBe("on");
      expect(api.headers.get("access-control-allow-origin")).toBe("capacitor://localhost");
      expect(await api.json()).toMatchObject({ error: expect.stringMatching(/maintenance/) });
      const page = await proxy(req("/exercises/"));
      expect(page.headers.get("content-type")).toMatch(/text\/html/);
      expect((await proxy(req("/admin/"))).status).toBe(200);
      // Another server's copy catches up within the cache time.
      await run("UPDATE admin_settings SET value = ? WHERE key = 'maintenance'", [JSON.stringify({ on: false })]);
      expect(await maintenanceOn(NOW + 1000)).toBe(true);
      expect(await maintenanceOn(NOW + MAINTENANCE_CACHE_MS + 1)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("needs TURN ON typed and an admin, and is audited", async () => {
    const help = await cookieFor("help@example.com");
    expect((await maintenanceRoute.PUT(send("PUT", "/api/admin/maintenance/", help, { on: true, confirm: "TURN ON" }))).status).toBe(404);
    const owner = await cookieFor("owner@example.com");
    expect((await maintenanceRoute.PUT(send("PUT", "/api/admin/maintenance/", owner, { on: true, confirm: "turn on" }))).status).toBe(400);
    expect((await maintenanceRoute.PUT(send("PUT", "/api/admin/maintenance/", owner, { on: true, confirm: "TURN ON" }))).status).toBe(200);
    expect((await maintenanceRoute.PUT(send("PUT", "/api/admin/maintenance/", owner, { on: false }))).status).toBe(200);
    expect((await query("SELECT action FROM admin_audit WHERE action LIKE 'maintenance.%' ORDER BY id")).map((r) => r.action)).toEqual([
      "maintenance.on",
      "maintenance.off",
    ]);
  });
});

describe("alerts", () => {
  it("go to admins only, at most once every 6 hours per kind, and not when switched off", async () => {
    const m = mailer();
    expect(await sendAlert("x", { subject: "Thing broke", lines: ["Line"] }, { now: NOW, mail: m.mail })).toBe(true);
    expect(m.sent).toEqual([expect.objectContaining({ to: "owner@example.com", subject: "Alert: Thing broke" })]);
    expect(await sendAlert("x", { subject: "Thing broke", lines: [] }, { now: NOW + ALERT_GAP - 1, mail: m.mail })).toBe(false);
    expect(await sendAlert("x", { subject: "Thing broke", lines: [] }, { now: NOW + ALERT_GAP + 1, mail: m.mail })).toBe(true);
    await saveAlertSettings({ instant: false, digest: true });
    expect(await sendAlert("y", { subject: "Other", lines: [] }, { now: NOW, mail: m.mail })).toBe(false);
  });

  it("announce a subscription's first payment only, and a billing failure", async () => {
    const m = mailer();
    await subEvent("rc-1", "purchase", NOW);
    expect(await alertForStoreEvent("rc-1", { now: NOW, mail: m.mail })).toBe(true);
    expect(m.sent[0]).toMatchObject({ subject: "New paying customer on Google Play" });
    expect(m.sent[0]!.text).toMatch(/\$39\.99 US\), in CA/);
    expect(m.sent[0]!.text).toMatch(/tab=Installs&open=install-aaaa-1/);
    await subEvent("rc-2", "renew", NOW + 30 * DAY);
    expect(await alertForStoreEvent("rc-2", { now: NOW + 30 * DAY, mail: m.mail })).toBe(false);
    await subEvent("rc-3", "trial_convert", NOW + 31 * DAY);
    expect(await alertForStoreEvent("rc-3", { now: NOW + 31 * DAY, mail: m.mail })).toBe(false);
    await subEvent("rc-4", "cancel", NOW + 32 * DAY, { reason: "billing" });
    expect(await alertForStoreEvent("rc-4", { now: NOW + 32 * DAY, mail: m.mail })).toBe(true);
    expect(m.sent[1]!.subject).toBe("Alert: A payment failed on Google Play");
    expect(await alertForStoreEvent("rc-missing", { now: NOW, mail: m.mail })).toBe(false);
  });

  it("note failed sign-ins for staff only, and alert when five fail in 15 minutes", async () => {
    const m = mailer();
    await reportStaffFailure("someone@example.com", "link", { now: NOW, mail: m.mail });
    expect(await query("SELECT * FROM staff_sign_in_failures")).toHaveLength(0);
    for (let i = 0; i < 5; i++) await reportStaffFailure("Owner@example.com", "link", { now: NOW + i * 1000, mail: m.mail });
    expect(m.sent.map((s) => s.subject)).toEqual(["Alert: Repeated failed admin sign-ins"]);
    const card = await securityCheck(NOW + 10_000);
    expect(card.summary).toMatch(/5 failed sign-ins in 24 hours/);
    expect(card.rows.find((r) => r.label.startsWith("owner@example.com"))?.value).toMatch(/5 failed sign-ins/);
  });

  it("records a used sign-in link as a failure", async () => {
    const r = await startSignIn(new Request(`${SITE}/api/admin/login/`, { method: "POST" }), "owner@example.com");
    const { devLink } = (await r.json()) as { devLink: string };
    await finishSignIn(new Request(devLink));
    await finishSignIn(new Request(devLink));
    expect(await query("SELECT email, step FROM staff_sign_in_failures")).toEqual([{ email: "owner@example.com", step: "link" }]);
  });

  it("watch the System checks: alert when one goes down and again when it's back", async () => {
    const m = mailer();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const first = await watchSystem({ now: NOW, mail: m.mail });
    expect(first.down).toContain("site");
    expect(m.sent[0]!.subject).toMatch(/^Alert: .*Live site/);
    fetchMock.mockRestore();
    await run("UPDATE admin_settings SET value = ? WHERE key = 'alert:down'", [JSON.stringify(["site", "gone"])]);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const second = await watchSystem({ now: NOW + 1, mail: m.mail });
    expect(second.down).toContain("site");
    expect(m.sent.at(-1)!.subject).toMatch(/gone working again/);
    vi.restoreAllMocks();
  });

  it("write a digest of the last day in counts, and send it unless off", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    await run("INSERT INTO installs (id, first_seen, last_seen, platform) VALUES ('install-aaaa-1', ?, ?, 'android')", [NOW - 1000, NOW]);
    await subEvent("rc-1", "purchase", NOW - 1000);
    const d = await digestLines(NOW);
    expect(d.lines[0]).toMatch(/^Last 24 hours: 1 new installs/);
    expect(d.lines[1]).toMatch(/1 payments \(\$39\.99 US/);
    const m = mailer();
    expect(await sendDigest({ now: NOW, mail: m.mail })).toBe(1);
    expect(m.sent[0]!.subject).toMatch(/^Liftsmith today: /);
    await saveAlertSettings({ instant: true, digest: false });
    expect(await sendDigest({ now: NOW, mail: m.mail })).toBe(0);
    vi.restoreAllMocks();
  });

  it("send a test alert from Automations only for admins", async () => {
    const help = await cookieFor("help@example.com");
    expect((await automationsRoute.POST(send("POST", "/api/admin/automations/", help, { action: "test" }))).status).toBe(404);
    const owner = await cookieFor("owner@example.com");
    // No email key here, so nothing can go out.
    expect((await automationsRoute.POST(send("POST", "/api/admin/automations/", owner, { action: "test" }))).status).toBe(409);
    expect((await automationsRoute.PUT(send("PUT", "/api/admin/automations/", owner, { instant: false, digest: true }))).status).toBe(200);
    const got = (await (
      await automationsRoute.GET(new Request(`${SITE}/api/admin/automations/`, { headers: { cookie: help } }))
    ).json()) as {
      settings: unknown;
      recipients: string[];
    };
    expect(got).toMatchObject({ settings: { instant: false, digest: true }, recipients: ["owner@example.com"] });
  });
});

describe("capacity and backups", () => {
  it("measures the database and samples it once a day", async () => {
    expect(await dbSize()).toBeGreaterThan(0);
    await sampleDbSize(NOW);
    await sampleDbSize(NOW + 1000);
    expect(await sizeSamples()).toHaveLength(1);
    expect(
      daysUntilFull(
        [
          { day: 0, bytes: 100 },
          { day: 10, bytes: 200 },
        ],
        1200,
      ),
    ).toBe(100);
    expect(
      daysUntilFull(
        [
          { day: 0, bytes: 100 },
          { day: 3, bytes: 200 },
        ],
        1200,
      ),
    ).toBeNull();
    expect(
      daysUntilFull(
        [
          { day: 0, bytes: 100 },
          { day: 10, bytes: 200 },
        ],
        null,
      ),
    ).toBeNull();
  });

  it("warns until a restore is practised, and records one from the System tab", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", "");
    expect((await backupsCheck(NOW)).state).toBe("off");
    expect(restoreDrillState(null, NOW)).toBe("warn");
    expect(restoreDrillState(NOW - 40 * DAY, NOW)).toBe("warn");
    expect(restoreDrillState(NOW - 3 * DAY, NOW)).toBe("ok");
    const owner = await cookieFor("owner@example.com");
    expect(
      (await systemRoute.POST(send("POST", "/api/admin/system/", owner, { action: "restore-drill", date: "2999-01-01" }))).status,
    ).toBe(400);
    expect(
      (await systemRoute.POST(send("POST", "/api/admin/system/", owner, { action: "restore-drill", date: "2026-11-01" }))).status,
    ).toBe(200);
    vi.stubEnv("DATABASE_URL", "libsql://example.turso.io");
    const card = await backupsCheck(Date.UTC(2026, 10, 10));
    expect(card.state).toBe("ok");
  });
});
