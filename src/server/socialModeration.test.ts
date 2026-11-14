import { beforeEach, describe, expect, it } from "vitest";

import { deleteAccount, resetAccount } from "./accounts";
import { searchAccounts } from "./adminUsers";
import { query, resetDb, run } from "./db";
import { handle } from "./social";
import { liftExpired, moderate, moderationFor, parseAction } from "./socialModeration";

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

const call = (who: string, op: string, b: Record<string, unknown> = {}, now = NOW) => handle(who, { op, ...b }, now);
const join = (who: string, h: string) => call(who, "join", { handle: h, name: h.toUpperCase(), agree: true });
const workout = (id = "s1", at = NOW - 3_600_000) => ({
  workoutId: id,
  at,
  body: {
    seconds: 3000,
    sets: 12,
    volume: 4200,
    prs: 0,
    muscles: ["chest"],
    exercises: [{ id: "bench", name: "Bench press", sets: 4, w: 100, r: 5 }],
  },
});
const account = (id: string, email: string) =>
  run("INSERT INTO accounts (id, email, created_at, last_seen) VALUES (?, ?, ?, ?)", [id, email, NOW, NOW]);

/** Alex and Blair follow each other; both have accounts with emails. */
async function friends() {
  await account("acc-a", "alex@example.com");
  await account("acc-b", "blair@example.com");
  await join("acc-a", "alex");
  await join("acc-b", "blair");
  await call("acc-b", "follow", { handle: "alex" });
  await call("acc-a", "answer", { handle: "blair", accept: true });
  await call("acc-a", "follow", { handle: "blair" });
  await call("acc-b", "answer", { handle: "alex", accept: true });
}
const feedOf = async (who: string) => (await call(who, "feed")).body.posts as { id: string; handle: string }[];

beforeEach(async () => {
  await resetDb();
});

describe("reporting a profile", () => {
  it("takes the profile's own fixed reasons, with a note", async () => {
    await friends();
    expect((await call("acc-b", "report", { kind: "profile", id: "alex", reason: "underage" })).code).toBe(200);
    expect((await call("acc-b", "report", { kind: "profile", id: "alex", reason: "made-up" })).code).toBe(400);
    // Under 13 and impersonation are profile reasons only.
    const id = (await call("acc-a", "post", workout())).body.id as string;
    expect((await call("acc-b", "report", { kind: "post", id, reason: "underage" })).code).toBe(400);
    expect((await call("acc-b", "report", { kind: "post", id, reason: "cheating", note: "x".repeat(400) })).code).toBe(200);
    const [r] = await query("SELECT note FROM reports WHERE kind = 'post'");
    expect(String(r?.note)).toHaveLength(280);
  });
});

describe("staff actions", () => {
  it("a warning shows in Friends until Got it", async () => {
    await friends();
    expect(await moderate("acc-a", { action: "warn", reason: "abuse" }, NOW)).toBe(true);
    const me = (await call("acc-a", "me")).body;
    expect(me.suspended).toBe(false);
    expect(me.notice).toEqual({ kind: "warn", reason: "abuse", at: NOW, until: null });
    expect((await call("acc-a", "noticeSeen")).body.notice).toBeNull();
  });

  it("a suspension hides them and ends by itself", async () => {
    await friends();
    expect(await moderate("acc-a", parseAction({ what: "suspend", days: 3, reason: "spam" })!, NOW)).toBe(true);
    expect(parseAction({ what: "suspend", days: 2 })).toBeNull(); // only the offered lengths
    expect((await call("acc-a", "me")).body).toMatchObject({ suspended: true, notice: { kind: "suspend", until: NOW + 3 * DAY } });
    expect((await call("acc-a", "post", workout())).body.error).toBe("suspended");
    expect((await call("acc-b", "lookup", { handle: "alex" })).code).toBe(404);
    expect(await liftExpired(NOW + 2 * DAY)).toBe(0);
    expect(await liftExpired(NOW + 3 * DAY)).toBe(1);
    expect((await call("acc-b", "lookup", { handle: "alex" })).code).toBe(200);
    expect((await call("acc-a", "me")).body).toMatchObject({ suspended: false, notice: null });
  });

  it("an expired suspension also lifts when the lifter opens Friends", async () => {
    await friends();
    await moderate("acc-a", { action: "suspend", days: 1, reason: "" }, NOW);
    expect((await call("acc-a", "me", {}, NOW + 2 * DAY)).body.suspended).toBe(false);
  });

  it("a ban follows the email past deleting the account, until an unban", async () => {
    await friends();
    await moderate("acc-a", { action: "ban", reason: "hate" }, NOW);
    expect((await call("acc-a", "me")).body).toMatchObject({ suspended: true, notice: { kind: "ban", reason: "hate", until: null } });
    await deleteAccount("acc-a", async () => null);
    await account("acc-a2", "Alex@Example.com");
    expect((await join("acc-a2", "alex_again")).body.error).toBe("suspended");
    expect((await moderationFor("acc-a2")).emailBanned).toBe(true);
  });

  it("a shadow ban lets them carry on while nobody else sees them, and never tells them", async () => {
    await friends();
    const blairPost = (await call("acc-b", "post", workout("b1"))).body.id as string;
    await moderate("acc-a", { action: "shadow" }, NOW);
    expect((await call("acc-a", "me")).body).toMatchObject({ suspended: false, notice: null });
    const mine = (await call("acc-a", "post", workout("a1"))).body.id as string;
    expect(mine).toBeTruthy();
    expect((await feedOf("acc-a")).map((p) => p.handle)).toContain("alex");
    expect((await feedOf("acc-b")).map((p) => p.handle)).not.toContain("alex");
    expect((await call("acc-a", "comment", { id: blairPost, text: "Nice set" })).code).toBe(200);
    const theirs = (await call("acc-b", "thread", { id: blairPost })).body.comments as unknown[];
    const own = (await call("acc-a", "thread", { id: blairPost })).body.comments as unknown[];
    expect(theirs).toHaveLength(0);
    expect(own).toHaveLength(1);
    expect((await call("acc-b", "lookup", { handle: "alex" })).code).toBe(404);
    // Unban brings them back.
    await moderate("acc-a", { action: "unban" });
    expect((await feedOf("acc-b")).map((p) => p.handle)).toContain("alex");
  });

  it("off leaderboards: gone from friends' boards, still on their own", async () => {
    await friends();
    await call("acc-a", "post", workout());
    await moderate("acc-a", { action: "boardsOff" });
    const board = async (who: string) =>
      ((await call(who, "board", { from: NOW - 3 * DAY })).body.rows as { handle: string }[]).map((r) => r.handle);
    expect(await board("acc-b")).toEqual(["blair"]);
    expect(await board("acc-a")).toContain("alex");
    await moderate("acc-a", { action: "boardsOn" });
    expect(await board("acc-b")).toContain("alex");
  });

  it("resets a name or handle, and dismisses every report about them", async () => {
    await friends();
    await call("acc-a", "update", { name: "Rude Name" });
    const id = (await call("acc-a", "post", workout())).body.id as string;
    for (const who of ["acc-b", "acc-c", "acc-d"]) {
      if (who !== "acc-b") await join(who, who.replace("acc-", "person_"));
      await call(who, "report", { kind: "post", id, reason: "spam" });
    }
    await call("acc-b", "report", { kind: "profile", id: "alex", reason: "name" });
    await moderate("acc-a", { action: "resetName" });
    expect((await call("acc-a", "me")).body.profile).toMatchObject({ name: "alex" });
    await moderate("acc-a", { action: "resetHandle" });
    const h = ((await call("acc-a", "me")).body.profile as { handle: string; name: string }).handle;
    expect(h).toMatch(/^lifter_[a-z0-9]{6}$/);
    expect(((await call("acc-a", "me")).body.profile as { name: string }).name).toBe(h);
    expect((await moderationFor("acc-a")).counts).toEqual({ open: 4, total: 4, reporters: 3 });
    await moderate("acc-a", { action: "dismiss" });
    expect((await moderationFor("acc-a")).counts.open).toBe(0);
    expect((await feedOf("acc-b")).map((p) => p.id)).toContain(id); // the hidden post shows again
  });

  it("does nothing for someone who never joined Friends", async () => {
    expect(await moderate("nobody", { action: "ban", reason: "" })).toBe(false);
  });
});

describe("the Users tab", () => {
  it("shows who reported someone, why, and what staff did", async () => {
    await friends();
    await call("acc-b", "report", { kind: "profile", id: "alex", reason: "other", note: "Keeps messaging me" });
    await run("INSERT INTO admin_audit (at, admin, action, target, detail) VALUES (?, 'owner@example.com', 'mod.warn', 'acc-a', ?)", [
      NOW,
      JSON.stringify({ reason: "abuse" }),
    ]);
    const m = await moderationFor("acc-a");
    expect(m.profile).toMatchObject({ handle: "alex" });
    expect(m.reports).toHaveLength(1);
    expect(m.reports[0]).toMatchObject({
      kind: "profile",
      reason: "other",
      note: "Keeps messaging me",
      status: "open",
      reporter: { accountId: "acc-b", handle: "blair", email: "blair@example.com", minor: false },
    });
    expect(m.history).toEqual([{ at: NOW, admin: "owner@example.com", action: "mod.warn", detail: '{"reason":"abuse"}' }]);
    expect((await moderationFor("acc-b")).made).toEqual({ total: 1, dismissed: 0 });
  });

  it("filters and sorts accounts by reports, standing and age", async () => {
    await friends();
    await account("acc-c", "casey@example.com");
    await join("acc-c", "casey");
    await call("acc-b", "report", { kind: "profile", id: "alex", reason: "spam" });
    await call("acc-c", "report", { kind: "profile", id: "alex", reason: "spam" });
    await call("acc-a", "report", { kind: "profile", id: "casey", reason: "spam" });
    const reported = await searchAccounts("", 50, { filter: "reported", sort: "reports", now: NOW });
    expect(reported.map((a) => [a.handle, a.openReports])).toEqual([
      ["alex", 2],
      ["casey", 1],
    ]);
    expect((await searchAccounts("@blair", 50, { now: NOW })).map((a) => a.id)).toEqual(["acc-b"]);
    await moderate("acc-c", { action: "shadow" });
    expect((await searchAccounts("", 50, { filter: "actioned", now: NOW })).map((a) => [a.id, a.state])).toEqual([["acc-c", "shadow"]]);
    await run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES ('acc-b', 'profile', ?, 1)", [
      JSON.stringify({ birthYear: new Date(NOW).getUTCFullYear() - 15 }),
    ]);
    expect((await searchAccounts("", 50, { filter: "teens", now: NOW })).map((a) => a.id)).toEqual(["acc-b"]);
  });
});

describe("resetting an account", () => {
  it("clears what they made and signs every device out, but keeps the sign-in, notes and a ban", async () => {
    await friends();
    await call("acc-a", "post", workout());
    await run(
      "INSERT INTO account_identities (provider, subject, account_id, email, created_at) VALUES ('google', 'g1', 'acc-a', 'alex@example.com', 1)",
    );
    await run(
      "INSERT INTO account_sessions (token_hash, account_id, created_at, expires_at, last_seen) VALUES ('t1', 'acc-a', 1, 9e15, 1)",
    );
    await run("INSERT INTO sync_events (account_id, id, at, body) VALUES ('acc-a', 'e1', 1, '{}')");
    await run("INSERT INTO account_notes (account_id, at, author, text) VALUES ('acc-a', 1, 'owner@example.com', 'Asked for a reset')");
    await resetAccount("acc-a");
    const count = async (sql: string) => Number((await query(sql, ["acc-a"]))[0]?.n);
    expect(await count("SELECT COUNT(*) AS n FROM sync_events WHERE account_id = ?")).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM account_sessions WHERE account_id = ?")).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM posts WHERE account_id = ?")).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM social_profiles WHERE account_id = ?")).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM accounts WHERE id = ?")).toBe(1);
    expect(await count("SELECT COUNT(*) AS n FROM account_identities WHERE account_id = ?")).toBe(1);
    expect(await count("SELECT COUNT(*) AS n FROM account_notes WHERE account_id = ?")).toBe(1);

    await moderate("acc-b", { action: "suspend", days: 7, reason: "abuse" }, NOW);
    await resetAccount("acc-b");
    expect((await call("acc-b", "me")).body.suspended).toBe(true);
  });
});
