import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addTask, checkTask, deleteTask, hideItem, listTasks, setTaskDone, setupItems, todoList, unhideAll } from "./adminTodo";
import { run, resetDb } from "./db";
import { recentJobRuns, trackJob } from "./monitor";

const NOW = Date.UTC(2026, 10, 9, 12);
const DAY = 86_400_000;

beforeEach(async () => {
  await resetDb();
  // No inbox key, so the list never calls Resend; setup items stay quiet unless a test asks for them.
  vi.stubEnv("RESEND_INBOX_API_KEY", "");
  vi.stubEnv("RESEND_API_KEY", "");
  for (const n of ["ANALYTICS_SECRET", "NEXT_PUBLIC_SITE_URL", "UPTIMEROBOT_API_KEY", "CRON_SECRET"]) vi.stubEnv(n, "set");
});
afterEach(() => vi.unstubAllEnvs());

describe("admin to-do list", () => {
  it("lists setup still to do by setting name", () => {
    const keys = setupItems(() => "").map((i) => i.key);
    expect(keys).toEqual(["setup:RESEND_INBOX_API_KEY", "setup:ANALYTICS_SECRET", "setup:NEXT_PUBLIC_SITE_URL", "setup:UPTIMEROBOT_API_KEY"]);
    expect(setupItems(() => "x")).toEqual([]);
    for (const i of setupItems(() => "")) expect(i.detail).toMatch(/www\.getliftsmith\.com|Vercel|Resend|UptimeRobot/);
  });

  it("adds a late or failed reminder job, and snoozes it", async () => {
    await trackJob("reminders", async () => Response.json({ sent: 3 }), () => NOW - 2 * DAY);
    let list = await todoList(NOW);
    const job = list.items.find((i) => i.kind === "job")!;
    expect(job.title).toMatch(/late/);
    await hideItem(job.key, 1, NOW);
    list = await todoList(NOW);
    expect(list.items.find((i) => i.kind === "job")).toBeUndefined();
    expect(list.hidden).toBe(1);
    // Back after the snooze ends.
    expect((await todoList(NOW + 2 * DAY)).items.find((i) => i.kind === "job")).toBeDefined();
    await hideItem(job.key, null, NOW);
    expect((await todoList(NOW + 400 * DAY)).items.find((i) => i.key === job.key)).toBeUndefined();
    await unhideAll();
    expect((await todoList(NOW)).hidden).toBe(0);
  });

  it("records a failed job and says so", async () => {
    await expect(trackJob("reminders", async () => { throw new Error("Resend down"); }, () => NOW - 3_600_000)).rejects.toThrow("Resend down");
    const [run0] = await recentJobRuns("reminders");
    expect(run0).toMatchObject({ ok: false, detail: "Resend down" });
    expect((await todoList(NOW)).items.find((i) => i.kind === "job")?.title).toMatch(/failed/);
  });

  it("flags payment failures from the store in the last two weeks", async () => {
    await run("INSERT INTO subscription_events (id, at, store, kind, reason, source) VALUES ('e1', ?, 'play', 'cancel', 'billing', 'store')", [NOW - DAY]);
    await run("INSERT INTO subscription_events (id, at, store, kind, reason, source) VALUES ('e0', ?, 'play', 'cancel', 'billing', 'store')", [NOW - 30 * DAY]);
    const items = (await todoList(NOW)).items.filter((i) => i.kind === "billing");
    expect(items).toHaveLength(1);
    expect(items[0].title).toMatch(/A subscription lapsed/);
  });

  it("keeps the admins' own tasks", async () => {
    expect(checkTask({ title: " " }).ok).toBe(false);
    expect(checkTask({ title: "x", due: "not a date" }).ok).toBe(false);
    const t = checkTask({ title: "Order official store badges", due: "2026-11-20T00:00:00Z" });
    if (!t.ok) throw new Error(t.error);
    const id = await addTask(t, "admin@getliftsmith.com", NOW);
    await addTask({ title: "Later, no date", note: null, due: null }, "admin@getliftsmith.com", NOW);
    expect((await listTasks()).map((x) => x.title)).toEqual(["Order official store badges", "Later, no date"]);
    expect(await setTaskDone(id, true, "admin@getliftsmith.com", NOW)).toBe(true);
    const [first] = (await listTasks()).filter((x) => x.doneAt);
    expect(first).toMatchObject({ id, doneBy: "admin@getliftsmith.com" });
    expect(await deleteTask(id)).toBe(true);
    expect(await deleteTask(id)).toBe(false);
    expect(await setTaskDone(999, true, "a", NOW)).toBe(false);
  });
});
