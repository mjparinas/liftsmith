import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as exportRoute from "@/app/api/admin/export/route.api";
import * as installsRoute from "@/app/api/admin/installs/route.api";
import * as usersRoute from "@/app/api/admin/users/route.api";
import { csvCell, toCsv } from "@/lib/csv";

import { finishSignIn, startSignIn } from "./adminAuth";
import { accountDetail, searchAccounts } from "./adminUsers";
import { query, resetDb, run } from "./db";

const NOW = Date.UTC(2026, 10, 10, 12);
const DAY = 86_400_000;
const SITE = "https://www.getliftsmith.com";

async function cookieFor(email: string) {
  const r = await startSignIn(new Request(`${SITE}/api/admin/login/`, { method: "POST" }), email);
  const { devLink } = (await r.json()) as { devLink: string };
  const done = await finishSignIn(new Request(devLink));
  return `ls_admin=${/ls_admin=([^;]+)/.exec(done.headers.get("set-cookie") ?? "")![1]}`;
}
const get = (path: string, cookie: string) => new Request(`${SITE}${path}`, { headers: { cookie } });
const post = (path: string, cookie: string, body: unknown) =>
  new Request(`${SITE}${path}`, { method: "POST", headers: { cookie, origin: SITE }, body: JSON.stringify(body) });

async function seedAccount(id: string, email: string | null, extra: { events?: number; provider?: string } = {}) {
  await run("INSERT INTO accounts (id, email, created_at, last_seen) VALUES (?, ?, ?, ?)", [id, email, NOW - 10 * DAY, NOW - DAY]);
  await run("INSERT INTO account_identities (provider, subject, account_id, email, created_at) VALUES (?, ?, ?, ?, ?)", [
    extra.provider ?? "google",
    `sub-${id}`,
    id,
    email,
    NOW - 10 * DAY,
  ]);
  await run(
    "INSERT INTO account_sessions (token_hash, account_id, created_at, expires_at, last_seen, platform) VALUES (?, ?, ?, ?, ?, 'android')",
    [`hash-${id}`, id, NOW - 10 * DAY, NOW + 300 * DAY, NOW - DAY],
  );
  for (let i = 0; i < (extra.events ?? 0); i++)
    await run("INSERT INTO sync_events (account_id, id, at, body) VALUES (?, ?, ?, ?)", [
      id,
      `ev-${i}`,
      NOW - i * DAY,
      '{"kind":"set","weight":100}',
    ]);
}

beforeEach(async () => {
  await resetDb();
  vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
  vi.stubEnv("SUPPORT_EMAILS", "help@example.com");
  vi.stubEnv("RESEND_API_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("admin sign-in links", () => {
  it("work once, even when two requests race with the same link", async () => {
    const r = await startSignIn(new Request(`${SITE}/api/admin/login/`, { method: "POST" }), "owner@example.com");
    const { devLink } = (await r.json()) as { devLink: string };
    const both = await Promise.all([finishSignIn(new Request(devLink)), finishSignIn(new Request(devLink))]);
    expect(both.filter((res) => res.headers.get("set-cookie")?.includes("ls_admin=")).length).toBe(1);
    expect(await query("SELECT * FROM admin_sessions")).toHaveLength(1);
  });
});

describe("finding accounts", () => {
  it("searches by part of an email, by id, and lists the newest first when empty", async () => {
    await seedAccount("acct-aaaa-1111", "lifter@example.com", { events: 3 });
    await seedAccount("acct-bbbb-2222", "other@example.org", { provider: "apple" });
    expect((await searchAccounts("LIFTER")).map((a) => a.id)).toEqual(["acct-aaaa-1111"]);
    expect((await searchAccounts("acct-bbbb-2222")).map((a) => a.email)).toEqual(["other@example.org"]);
    expect(await searchAccounts("%")).toEqual([]);
    const all = await searchAccounts("");
    expect(all).toHaveLength(2);
    expect(all.find((a) => a.id === "acct-aaaa-1111")).toMatchObject({ providers: ["google"], devices: 1, events: 3 });
  });

  it("counts what was synced without reading it", async () => {
    await seedAccount("acct-aaaa-1111", "lifter@example.com", { events: 2 });
    await run("INSERT INTO sync_events (account_id, id, at, body) VALUES (?, 'gone', ?, NULL)", ["acct-aaaa-1111", NOW]);
    await run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'gym:home', '{}', ?), (?, 'profile', '{}', ?)", [
      "acct-aaaa-1111",
      NOW,
      "acct-aaaa-1111",
      NOW,
    ]);
    const d = await accountDetail("acct-aaaa-1111");
    expect(d?.sync).toMatchObject({ events: 2, deleted: 1, records: 2, gyms: 1 });
    expect(JSON.stringify(d)).not.toContain("weight");
  });
});

describe("the Users routes", () => {
  it("lets support read and add notes, but not sign out or delete, and logs what support opened", async () => {
    await seedAccount("acct-aaaa-1111", "lifter@example.com");
    const help = await cookieFor("help@example.com");
    const r = await usersRoute.GET(get("/api/admin/users/?id=acct-aaaa-1111", help));
    expect(r.status).toBe(200);
    expect((await query("SELECT action FROM admin_audit WHERE action = 'account.view'")).length).toBe(1);
    expect(
      (await usersRoute.POST(post("/api/admin/users/", help, { action: "note", id: "acct-aaaa-1111", text: "Asked about Pro" }))).status,
    ).toBe(200);
    expect((await usersRoute.POST(post("/api/admin/users/", help, { action: "signout", id: "acct-aaaa-1111" }))).status).toBe(403);
    expect(
      (await usersRoute.POST(post("/api/admin/users/", help, { action: "delete", id: "acct-aaaa-1111", confirm: "DELETE" }))).status,
    ).toBe(403);
    // Support removes only their own notes.
    const owner = await cookieFor("owner@example.com");
    await usersRoute.POST(post("/api/admin/users/", owner, { action: "note", id: "acct-aaaa-1111", text: "Owner's note" }));
    const notes = (await accountDetail("acct-aaaa-1111"))!.notes;
    const ownerNote = notes.find((n) => n.author === "owner@example.com")!;
    expect((await usersRoute.POST(post("/api/admin/users/", help, { action: "unnote", noteId: ownerNote.id }))).status).toBe(404);
    expect((await usersRoute.POST(post("/api/admin/users/", owner, { action: "unnote", noteId: ownerNote.id }))).status).toBe(200);
  });

  it("signs an account out everywhere, and deletes it only with DELETE typed, notes included", async () => {
    await seedAccount("acct-aaaa-1111", "lifter@example.com", { events: 2 });
    const owner = await cookieFor("owner@example.com");
    const out = await usersRoute.POST(post("/api/admin/users/", owner, { action: "signout", id: "acct-aaaa-1111" }));
    expect(await out.json()).toMatchObject({ sessions: 1 });
    expect(await query("SELECT * FROM account_sessions")).toHaveLength(0);
    await usersRoute.POST(post("/api/admin/users/", owner, { action: "note", id: "acct-aaaa-1111", text: "Asked to be deleted" }));
    expect(
      (await usersRoute.POST(post("/api/admin/users/", owner, { action: "delete", id: "acct-aaaa-1111", confirm: "delete" }))).status,
    ).toBe(400);
    expect(
      (await usersRoute.POST(post("/api/admin/users/", owner, { action: "delete", id: "acct-aaaa-1111", confirm: "DELETE" }))).status,
    ).toBe(200);
    for (const t of ["accounts", "account_identities", "sync_events", "account_notes"])
      expect(await query(`SELECT * FROM ${t}`)).toHaveLength(0);
    // The log keeps the id, never the email.
    expect(JSON.stringify(await query("SELECT * FROM admin_audit WHERE action = 'account.delete'"))).not.toContain("lifter@");
  });

  it("refuses a note that's empty or too long", async () => {
    await seedAccount("acct-aaaa-1111", "lifter@example.com");
    const owner = await cookieFor("owner@example.com");
    expect((await usersRoute.POST(post("/api/admin/users/", owner, { action: "note", id: "acct-aaaa-1111", text: "  " }))).status).toBe(
      400,
    );
    expect(
      (await usersRoute.POST(post("/api/admin/users/", owner, { action: "note", id: "acct-aaaa-1111", text: "x".repeat(1001) }))).status,
    ).toBe(400);
  });

  it("opens one install's page with its events and subscription", async () => {
    await run(
      "INSERT INTO installs (id, first_seen, last_seen, platform, model, store) VALUES ('install-aaaa-1', ?, ?, 'android', 'Pixel 8', 'play')",
      [NOW - DAY, NOW],
    );
    await run(
      "INSERT INTO events (id, install_id, name, at, received_at, platform) VALUES ('e1', 'install-aaaa-1', 'workout_finish', ?, ?, 'android')",
      [NOW, NOW],
    );
    await run(
      "INSERT INTO subscription_events (id, at, install_id, store, kind, plan, usd_micros, source) VALUES ('s1', ?, 'install-aaaa-1', 'play', 'purchase', 'annual', 39990000, 'store')",
      [NOW],
    );
    const help = await cookieFor("help@example.com");
    const r = await installsRoute.GET(get("/api/admin/installs/?id=install-aaaa-1", help));
    const d = (await r.json()) as { install: { device: string }; counts: unknown[]; subs: { usd: number }[] };
    expect(d.install.device).toBe("Pixel 8");
    expect(d.counts).toEqual([expect.objectContaining({ name: "workout_finish", n: 1 })]);
    expect(d.subs[0].usd).toBeCloseTo(39.99);
    expect((await installsRoute.GET(get("/api/admin/installs/?id=install-none-0", help))).status).toBe(404);
  });
});

describe("CSV downloads", () => {
  it("are for admins only, escape formulas and are logged", async () => {
    await seedAccount("acct-aaaa-1111", '=HYPERLINK("x")@example.com', { events: 1 });
    const help = await cookieFor("help@example.com");
    expect((await exportRoute.GET(get("/api/admin/export/?type=accounts", help))).status).toBe(404);
    const owner = await cookieFor("owner@example.com");
    const r = await exportRoute.GET(get("/api/admin/export/?type=accounts", owner));
    expect(r.headers.get("content-type")).toMatch(/text\/csv/);
    const csv = await r.text();
    expect(csv.split("\r\n")[0]).toBe("account_id,email,created,last_seen,sign_in,devices,synced_events");
    expect(csv).toContain(`"'=HYPERLINK(""x"")@example.com"`);
    expect((await exportRoute.GET(get("/api/admin/export/?type=events", owner))).status).toBe(400);
    for (const t of ["installs", "subscriptions"])
      expect((await exportRoute.GET(get(`/api/admin/export/?type=${t}`, owner))).status).toBe(200);
    expect((await query("SELECT target FROM admin_audit WHERE action = 'export'")).map((r) => r.target)).toEqual([
      "accounts",
      "installs",
      "subscriptions",
    ]);
  });

  it("quotes commas and new lines, and leaves numbers alone", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell("-5")).toBe("'-5");
    expect(csvCell(-5)).toBe("-5");
    expect(toCsv(["x"], [["line\nbreak"]])).toBe('x\r\n"line\nbreak"\r\n');
  });
});
