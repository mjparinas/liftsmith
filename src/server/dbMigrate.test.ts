// The schema check on a server's first query (migrate in db.ts): each statement is a network hop to Turso in
// production, so an up-to-date database must take one read, and only what's missing is made.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const calls = { n: 0 };
vi.mock("@libsql/client", async (orig) => {
  const real = await orig<typeof import("@libsql/client")>();
  return {
    ...real,
    createClient: (cfg: Parameters<typeof real.createClient>[0]) => {
      const c = real.createClient(cfg);
      return new Proxy(c, {
        get(target, prop, recv) {
          const v = Reflect.get(target, prop, recv) as unknown;
          if (typeof v !== "function") return v;
          const f = (v as (...a: unknown[]) => unknown).bind(target);
          return prop === "execute" || prop === "batch" ? (...a: unknown[]) => (calls.n++, f(...a)) : f;
        },
      });
    },
  };
});

const { query, resetDb, run } = await import("./db");

const dir = mkdtempSync(join(tmpdir(), "liftsmith-db-"));
const was = process.env.DATABASE_URL;
beforeAll(() => {
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
});
afterAll(async () => {
  await resetDb();
  if (was === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = was;
  rmSync(dir, { recursive: true, force: true });
});

/** Hops for the first query on a fresh server, the migration included. */
async function coldStart(): Promise<number> {
  await resetDb();
  calls.n = 0;
  await query("SELECT 1");
  return calls.n - 1;
}

describe("the schema check on a cold start", () => {
  it("makes everything on an empty database, then takes one read once it's up to date", async () => {
    expect(await coldStart()).toBeLessThanOrEqual(4);
    expect(await query("SELECT push_posts FROM social_profiles")).toEqual([]);
    // One read, plus one batch while SCHEMA carries one-off data fixes (UPDATE statements run on every start).
    expect(await coldStart()).toBeLessThanOrEqual(2);
  });

  it("adds only what an older database is missing", async () => {
    await run("DROP INDEX posts_at");
    await run("ALTER TABLE social_profiles DROP COLUMN push_posts");
    // A read, the missing index (with any data fixes), a second read and the missing column.
    expect(await coldStart()).toBe(4);
    expect((await query("SELECT name FROM sqlite_master WHERE name = 'posts_at'")).length).toBe(1);
    expect(await query("SELECT push_posts FROM social_profiles")).toEqual([]);
    expect(await coldStart()).toBeLessThanOrEqual(2);
  });
});
