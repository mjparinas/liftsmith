// Coaches and clients in the admin panel and the morning digest (Melvin, 2026-11-12: "track whether someone is a user
// vs a coach"). An account becomes a coach with its first invite; a client by joining one.
import { beforeEach, describe, expect, it } from "vitest";

import { deleteAccount } from "./accounts";
import { coachTotals, searchAccounts } from "./adminUsers";
import { joinCoach, makeInvite } from "./coach";
import { query, resetDb, run } from "./db";
import { digestData, digestFrom } from "./digest";

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

const account = (id: string, at = NOW - 40 * DAY) =>
  run("INSERT INTO accounts (id, email, created_at, last_seen) VALUES (?, ?, ?, ?)", [id, `${id}@example.com`, at, NOW]);

beforeEach(async () => {
  await resetDb();
});

describe("coach and client counts", () => {
  it("count coaches by their first invite, where they came from, and their clients", async () => {
    for (const id of ["page-coach", "app-coach", "client", "lifter"]) await account(id);
    // From the coaches page, a month and a half ago; it's the first invite that counts, so a later one doesn't move it.
    await makeInvite("page-coach", NOW - 45 * DAY, "AAAABBBB", "coaches");
    await makeInvite("page-coach", NOW - 2 * 3_600_000, "CCCCDDDD", "app");
    await joinCoach("client", "CCCCDDDD", NOW - 3_600_000);
    // In the app, today, with anything else as via counted as the app.
    await makeInvite("app-coach", NOW - 3_600_000, "EEEEFFFF", "<script>");

    expect(await query("SELECT account_id, via FROM coach_accounts ORDER BY account_id")).toEqual([
      { account_id: "app-coach", via: "app" },
      { account_id: "page-coach", via: "coaches" },
    ]);
    expect(await coachTotals(NOW)).toEqual({
      coaches: 2,
      coachesFromPage: 1,
      coachesWithClients: 1,
      clients: 1,
      coachesNew: 1,
      coachesNewFromPage: 0,
      clientsNew: 1,
    });
    const roles = Object.fromEntries((await searchAccounts("")).map((a) => [a.id, a.role]));
    expect(roles).toEqual({ "page-coach": "coach", "app-coach": "coach", client: "client", lifter: "lifter" });

    // The digest's last 24 hours: one new coach (in the app) and one new client.
    const text = digestFrom(await digestData(NOW))
      .sections.find((s) => s.title === "Coaching")!
      .lines.join("\n");
    expect(text).toContain("1 new coach (0 from the coaches page), 1 new client.");
    expect(text).toContain("All time: 2 coaches (1 with clients), 1 client.");
  });

  it("an account that is both shows as both, and a deleted account stops counting", async () => {
    for (const id of ["a", "b"]) await account(id);
    await makeInvite("a", NOW, "AAAABBBB");
    await makeInvite("b", NOW, "CCCCDDDD");
    await joinCoach("a", "CCCCDDDD", NOW);
    expect((await searchAccounts("a@example.com"))[0]!.role).toBe("both");
    await deleteAccount("a");
    expect(await query("SELECT * FROM coach_accounts WHERE account_id = 'a'")).toEqual([]);
    expect((await coachTotals(NOW)).coaches).toBe(1);
  });
});
