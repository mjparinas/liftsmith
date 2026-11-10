"use client";

// The admin To Do tab (as in Gradelings' to-do list): what needs a person, worked out from the data (mail waiting,
// creators owed, payment failures, the reminder job, setup still to do), plus the admins' own tasks. Items can be
// snoozed or dismissed; tasks can be added, ticked off and deleted. Support staff can read; only admins change it.
import { useEffect, useState } from "react";

import type { AdminTask, TodoItem, TodoKind, TodoList } from "@/server/adminTodo";

import { Card } from "./charts";
import { ago } from "./time";

const KIND_LABEL: Record<TodoKind, string> = { inbox: "Inbox", creator: "Creators", billing: "Billing", job: "System", setup: "Setup" };
const post = async (body: Record<string, unknown>) => {
  const r = await fetch("/api/admin/todo/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  return r.ok ? null : (j.error ?? "That didn't work.");
};
const dayStart = (t: number) => new Date(new Date(t).toDateString()).getTime();

function Item({ item, admin, go, changed }: { item: TodoItem; admin: boolean; go: (tab: string) => void; changed: () => void }) {
  const hide = async (days: number | null) => {
    if (!(await post({ action: "hide", key: item.key, days }))) changed();
  };
  return (
    <li className="flex flex-wrap items-start gap-3 py-3">
      <span className="mt-0.5 shrink-0 rounded-md border border-line px-2 py-0.5 text-xs text-muted">{KIND_LABEL[item.kind]}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{item.title}</p>
        <p className="text-sm text-muted">
          {item.detail}
          {item.at ? ` · ${ago(item.at)}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {item.action.tab ? (
          <button
            type="button"
            onClick={() => go(item.action.tab!)}
            className="press rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-ink"
          >
            {item.action.label}
          </button>
        ) : (
          <a
            href={item.action.href}
            target="_blank"
            rel="noreferrer"
            className="press rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-ink"
          >
            {item.action.label}
          </a>
        )}
        {admin && (
          <>
            <button type="button" onClick={() => void hide(1)} className="press rounded-lg border border-line px-2 py-1.5 text-muted">
              Tomorrow
            </button>
            <button type="button" onClick={() => void hide(7)} className="press rounded-lg border border-line px-2 py-1.5 text-muted">
              Next week
            </button>
            <button type="button" onClick={() => void hide(null)} className="press rounded-lg border border-line px-2 py-1.5 text-muted">
              Dismiss
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function Task({ task, admin, now, changed }: { task: AdminTask; admin: boolean; now: number; changed: () => void }) {
  const overdue = !task.doneAt && task.due != null && task.due < dayStart(now);
  return (
    <li className="flex items-start gap-3 py-2">
      <input
        type="checkbox"
        aria-label={`${task.doneAt ? "Reopen" : "Done:"} ${task.title}`}
        checked={task.doneAt != null}
        disabled={!admin}
        onChange={async (e) => {
          if (!(await post({ action: "done", id: task.id, done: e.target.checked }))) changed();
        }}
        className="mt-1 h-5 w-5"
      />
      <div className="min-w-0 flex-1">
        <p className={task.doneAt ? "text-muted line-through" : "font-semibold"}>{task.title}</p>
        {task.note && <p className="whitespace-pre-wrap text-sm text-muted">{task.note}</p>}
        <p className="text-xs text-muted">
          {task.due != null && (
            <span className={overdue ? "text-bad" : ""}>
              Due {new Date(task.due).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} ·{" "}
            </span>
          )}
          {task.doneAt ? `Done by ${task.doneBy} ${ago(task.doneAt)}` : `Added by ${task.createdBy} ${ago(task.createdAt)}`}
        </p>
      </div>
      {admin && (
        <button
          type="button"
          onClick={async () => {
            if (confirm(`Delete "${task.title}"?`) && !(await post({ action: "delete", id: task.id }))) changed();
          }}
          className="press text-sm text-muted underline"
        >
          Delete
        </button>
      )}
    </li>
  );
}

export function Todo({ admin, go, onCount }: { admin: boolean; go: (tab: string) => void; onCount?: (n: number) => void }) {
  const [data, setData] = useState<TodoList | null>(null);
  const [now, setNow] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [form, setForm] = useState({ title: "", note: "", due: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const changed = () => setVersion((v) => v + 1);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/todo/")
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as TodoList & { error?: string };
        if (!live) return;
        if (!r.ok) return setError(j.error ?? "The list didn't load.");
        setData(j);
        setNow(Date.now());
        setError(null);
      })
      .catch(() => live && setError("The list didn't load."));
    return () => {
      live = false;
    };
  }, [version]);
  const count = data ? data.items.length + data.tasks.filter((t) => !t.doneAt).length : null;
  useEffect(() => {
    if (count != null) onCount?.(count);
  }, [count, onCount]);

  const add = async () => {
    const err = await post({ action: "add", title: form.title, note: form.note, due: form.due ? `${form.due}T00:00:00Z` : null });
    setMsg(err);
    if (!err) {
      setForm({ title: "", note: "", due: "" });
      changed();
    }
  };

  if (error)
    return (
      <p className="text-sm text-bad" role="alert">
        {error}
      </p>
    );
  if (!data) return <p className="text-muted">Loading…</p>;
  const open = data.tasks.filter((t) => !t.doneAt);
  const done = data.tasks.filter((t) => t.doneAt);
  return (
    <div className="space-y-4">
      <Card
        title="Needs a person"
        subtitle="Worked out from mail, creators, billing, the reminder job and settings, every time you open this tab."
        right={
          data.hidden > 0 && admin ? (
            <button
              type="button"
              onClick={async () => !(await post({ action: "unhide" })) && changed()}
              className="press shrink-0 text-sm text-muted underline"
            >
              Show {data.hidden} snoozed
            </button>
          ) : undefined
        }
      >
        {data.items.length ? (
          <ul className="divide-y divide-line/60">
            {data.items.map((i) => (
              <Item key={i.key} item={i} admin={admin} go={go} changed={changed} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing needs you right now.</p>
        )}
        {data.problems.length > 0 && <p className="mt-2 text-xs text-warn">Couldn&apos;t check: {data.problems.join("; ")}</p>}
      </Card>
      <Card title="Tasks" subtitle="Your own list, shared by every admin.">
        {open.length ? (
          <ul className="divide-y divide-line/60">
            {open.map((t) => (
              <Task key={t.id} task={t} admin={admin} now={now} changed={changed} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No open tasks.</p>
        )}
        {admin && (
          <div className="mt-4 grid gap-2 md:grid-cols-[2fr_1fr_auto]">
            <label className="sr-only" htmlFor="task-title">
              New task
            </label>
            <input
              id="task-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && form.title.trim() && void add()}
              placeholder="Add a task"
              className="card px-3 py-2 text-sm"
            />
            <label className="sr-only" htmlFor="task-due">
              Due date
            </label>
            <input
              id="task-due"
              type="date"
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value })}
              className="card px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={!form.title.trim()}
              onClick={() => void add()}
              className="press rounded-xl bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-50"
            >
              Add
            </button>
            <label className="sr-only" htmlFor="task-note">
              Note
            </label>
            <textarea
              id="task-note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Note (optional)"
              className="card px-3 py-2 text-sm md:col-span-3"
            />
          </div>
        )}
        {msg && (
          <p role="status" className="mt-2 text-sm text-bad">
            {msg}
          </p>
        )}
        {done.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted">Done recently ({done.length})</summary>
            <ul className="divide-y divide-line/60">
              {done.map((t) => (
                <Task key={t.id} task={t} admin={admin} now={now} changed={changed} />
              ))}
            </ul>
          </details>
        )}
      </Card>
    </div>
  );
}
