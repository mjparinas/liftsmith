// The admin To Do tab (modelled on Gradelings' src/server/adminQueue.ts): one list of what needs a person.
// Items worked out from the data (mail waiting for an answer, creators owed a payout, payment failures, a late or
// failed reminder job, setup still to do) plus the admins' own tasks. A worked-out item can be snoozed or dismissed
// by its key (admin_todo_hidden); it comes back when the snooze ends, or, for one whose key changes with the data
// (a new message, a new failure), as soon as there's something new.
import { jobState } from "@/lib/systemHealth";

import { loadCreators } from "./creators";
import { batch, query, run } from "./db";
import { inboxConfigured, waitingMail } from "./inbox";
import { recentJobRuns } from "./monitor";

const DAY = 86_400_000;
/** "Dismiss" hides an item for good, stored as a far-off date so one column covers both. */
const FOREVER = 8_640_000_000_000_000;

export type TodoKind = "inbox" | "creator" | "billing" | "job" | "setup";

export interface TodoItem {
  key: string;
  kind: TodoKind;
  title: string;
  detail: string;
  /** When the thing happened, for sorting newest first within a kind. */
  at: number | null;
  /** Where in the panel to deal with it: a tab name, or an outside link. */
  action: { label: string; tab?: string; href?: string };
}

export interface AdminTask {
  id: number;
  title: string;
  note: string | null;
  due: number | null;
  createdAt: number;
  createdBy: string;
  doneAt: number | null;
  doneBy: string | null;
}

const env = (name: string) => process.env[name]?.trim() || "";

/** Setup the owner still has to do, from which settings are missing. Names only, never values. */
export function setupItems(get: (name: string) => string = env): TodoItem[] {
  const items: TodoItem[] = [];
  const add = (name: string, title: string, detail: string, href?: string) =>
    items.push({
      key: `setup:${name}`,
      kind: "setup",
      title,
      detail,
      at: null,
      action: href ? { label: "Open", href } : { label: "System", tab: "System" },
    });
  const vercelEnv = "https://vercel.com/melvins-projects-b69f55c3/liftsmith/settings/environment-variables";
  if (!get("RESEND_INBOX_API_KEY"))
    add(
      "RESEND_INBOX_API_KEY",
      "Let the Inbox read mail",
      "Create a full-access Resend API key and set it as RESEND_INBOX_API_KEY in Vercel. The sending key can't read received mail.",
      vercelEnv,
    );
  if (!get("ANALYTICS_SECRET"))
    add(
      "ANALYTICS_SECRET",
      "Set the visitor hash salt",
      "Set ANALYTICS_SECRET (any long random string) in Vercel, so the cookieless visitor count isn't guessable.",
      vercelEnv,
    );
  if (!get("NEXT_PUBLIC_SITE_URL"))
    add("NEXT_PUBLIC_SITE_URL", "Set the site address", "Set NEXT_PUBLIC_SITE_URL to https://www.getliftsmith.com in Vercel.", vercelEnv);
  if (!get("UPTIMEROBOT_API_KEY"))
    add(
      "UPTIMEROBOT_API_KEY",
      "Watch the site with UptimeRobot",
      "Add a free UptimeRobot monitor for https://www.getliftsmith.com/api/health/ and set its read-only API key as UPTIMEROBOT_API_KEY.",
      "https://uptimerobot.com/",
    );
  return items;
}

async function inboxItems(now: number): Promise<TodoItem[]> {
  if (!inboxConfigured()) return [];
  const mail = await waitingMail(now);
  return mail.map((m) => ({
    key: `inbox:${m.id}`,
    kind: "inbox" as const,
    title: `Answer ${m.from.replace(/<[^>]*>/, "").trim() || m.fromEmail}`,
    detail: m.subject,
    at: m.receivedAt,
    action: { label: "Open in Inbox", tab: "Inbox" },
  }));
}

async function creatorItems(now: number): Promise<TodoItem[]> {
  const { rows } = await loadCreators(now);
  return rows
    .filter((r) => r.payable)
    .map((r) => ({
      // The amount is in the key, so a payout clears it and a bigger amount brings it back after a dismiss.
      key: `creator:${r.code}:${r.owed.toFixed(2)}`,
      kind: "creator" as const,
      title: `Pay ${r.name} (${r.code})`,
      detail: `$${r.owed.toFixed(2)} owed. Pay by PayPal or Wise, then record the payout.`,
      at: r.lastPayout,
      action: { label: "Codes", tab: "Codes" },
    }));
}

async function billingItems(now: number): Promise<TodoItem[]> {
  const rows = await query<{ id: string; at: number; plan: string | null; store: string }>(
    "SELECT id, at, plan, store FROM subscription_events WHERE source = 'store' AND kind = 'cancel' AND reason = 'billing' AND at > ? ORDER BY at DESC LIMIT 20",
    [now - 14 * DAY],
  );
  if (!rows.length) return [];
  const latest = Number(rows[0].at);
  return [
    {
      key: `billing:${rows[0].id}`,
      kind: "billing",
      title: rows.length === 1 ? "A subscription lapsed on a failed payment" : `${rows.length} subscriptions lapsed on failed payments`,
      detail: "The store retries and emails the subscriber itself. Worth a look if it keeps happening.",
      at: latest,
      action: { label: "Revenue", tab: "Revenue" },
    },
  ];
}

async function jobItems(now: number): Promise<TodoItem[]> {
  if (!env("CRON_SECRET")) return [];
  const runs = await recentJobRuns("reminders", 3);
  const state = jobState(runs, now);
  if (state === "ok") return [];
  const last = runs[0];
  return [
    {
      key: `job:${last?.startedAt ?? "never"}`,
      kind: "job",
      title: !last
        ? "The daily reminder job hasn't run yet"
        : state === "down"
          ? "The daily reminder job failed"
          : "The daily reminder job is late",
      detail: "Reminder emails go out from it. The System tab shows its last runs.",
      at: last?.startedAt ?? null,
      action: { label: "System", tab: "System" },
    },
  ];
}

/** Runs a source, leaving it out (with a note) when it fails, so one broken service doesn't empty the list. */
async function from(name: string, fn: () => Promise<TodoItem[]>, problems: string[]): Promise<TodoItem[]> {
  try {
    return await fn();
  } catch (e) {
    problems.push(`${name}: ${(e as Error).message}`);
    return [];
  }
}

export interface TodoList {
  items: TodoItem[];
  /** How many items are snoozed or dismissed right now. */
  hidden: number;
  tasks: AdminTask[];
  problems: string[];
}

export async function todoList(now = Date.now()): Promise<TodoList> {
  const problems: string[] = [];
  const groups = await Promise.all([
    from("Inbox", () => inboxItems(now), problems),
    from("Creators", () => creatorItems(now), problems),
    from("Billing", () => billingItems(now), problems),
    from("Reminder job", () => jobItems(now), problems),
    Promise.resolve(setupItems()),
  ]);
  const hiddenRows = await query<{ key: string }>("SELECT key FROM admin_todo_hidden WHERE until > ?", [now]);
  const hiddenKeys = new Set(hiddenRows.map((r) => String(r.key)));
  const all = groups.flat();
  const items = all.filter((i) => !hiddenKeys.has(i.key));
  return { items, hidden: all.length - items.length, tasks: await listTasks(), problems };
}

/** Snoozes an item for `days` (1 to 365), or dismisses it for good when `days` is null. */
export async function hideItem(key: string, days: number | null, now = Date.now()): Promise<void> {
  const until = days == null ? FOREVER : now + days * DAY;
  await run(
    "INSERT INTO admin_todo_hidden (key, until, at) VALUES (?, ?, ?) ON CONFLICT (key) DO UPDATE SET until = excluded.until, at = excluded.at",
    [key, until, now],
  );
}

/** Brings back every snoozed and dismissed item. */
export async function unhideAll(): Promise<void> {
  await run("DELETE FROM admin_todo_hidden");
}

/** Forgets hides that ended long ago, so the table doesn't grow forever. */
export async function pruneHidden(now = Date.now()): Promise<void> {
  await run("DELETE FROM admin_todo_hidden WHERE until < ?", [now - 30 * DAY]);
}

const toTask = (r: Record<string, unknown>): AdminTask => ({
  id: Number(r.id),
  title: String(r.title),
  note: r.note == null ? null : String(r.note),
  due: r.due == null ? null : Number(r.due),
  createdAt: Number(r.created_at),
  createdBy: String(r.created_by),
  doneAt: r.done_at == null ? null : Number(r.done_at),
  doneBy: r.done_by == null ? null : String(r.done_by),
});

/** Open tasks (soonest due first, then oldest) and the last 20 done. */
export async function listTasks(): Promise<AdminTask[]> {
  const open = await query("SELECT * FROM admin_tasks WHERE done_at IS NULL ORDER BY due IS NULL, due, created_at");
  const done = await query("SELECT * FROM admin_tasks WHERE done_at IS NOT NULL ORDER BY done_at DESC LIMIT 20");
  return [...open, ...done].map(toTask);
}

export function checkTask(
  body: Record<string, unknown>,
): { ok: true; title: string; note: string | null; due: number | null } | { ok: false; error: string } {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return { ok: false, error: "Give the task a title." };
  if (title.length > 200) return { ok: false, error: "Keep the title under 200 characters." };
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 2000) : null;
  let due: number | null = null;
  if (body.due != null && body.due !== "") {
    due = typeof body.due === "number" ? body.due : Date.parse(String(body.due));
    if (!Number.isFinite(due)) return { ok: false, error: "That due date isn't a date." };
  }
  return { ok: true, title, note, due };
}

export async function addTask(
  t: { title: string; note: string | null; due: number | null },
  admin: string,
  now = Date.now(),
): Promise<number> {
  await run("INSERT INTO admin_tasks (title, note, due, created_at, created_by) VALUES (?, ?, ?, ?, ?)", [
    t.title,
    t.note,
    t.due,
    now,
    admin,
  ]);
  const [row] = await query<{ id: number }>("SELECT MAX(id) AS id FROM admin_tasks");
  return Number(row.id);
}

/** Marks a task done or not done; false when there's no such task. */
export async function setTaskDone(id: number, done: boolean, admin: string, now = Date.now()): Promise<boolean> {
  return (await run("UPDATE admin_tasks SET done_at = ?, done_by = ? WHERE id = ?", [done ? now : null, done ? admin : null, id])) > 0;
}

export async function deleteTask(id: number): Promise<boolean> {
  return (await run("DELETE FROM admin_tasks WHERE id = ?", [id])) > 0;
}

/** For tests. */
export async function clearTodo(): Promise<void> {
  await batch([
    { sql: "DELETE FROM admin_tasks", args: [] },
    { sql: "DELETE FROM admin_todo_hidden", args: [] },
  ]);
}
