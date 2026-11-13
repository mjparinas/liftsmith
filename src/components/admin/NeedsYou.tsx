"use client";

// The top of Overview: what needs a person right now, before any number (action over stats, AGENTS.md). The same
// list as the To Do tab (mail waiting, reports waiting, creators owed, payment failures, a late job, setup still to
// do) plus open tasks, each one click from where it's dealt with. Says so when nothing needs doing.
import { useEffect, useState } from "react";

import type { TodoItem, TodoList } from "@/server/adminTodo";

import { Card } from "./charts";
import { CardBones, Loading } from "./Skeletons";

const SHOWN = 5;

export function NeedsYou({ go }: { go: (tab: string) => void }) {
  const [list, setList] = useState<TodoList | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/todo/")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as TodoList;
        if (live) setList(j);
      })
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, []);
  if (error) return null;
  if (!list)
    return (
      <Loading label="Loading what needs you">
        <CardBones title="Needs you" body="rows" />
      </Loading>
    );
  const tasks = list.tasks.filter((t) => !t.doneAt).length;
  // Setup steps last: they matter, but mail and reports are people waiting.
  const items = [...list.items].sort((a, b) => Number(a.kind === "setup") - Number(b.kind === "setup"));
  if (!items.length && !tasks)
    return (
      <Card title="Needs you" subtitle="Nothing right now: no mail waiting, no reports and nothing owed.">
        {null}
      </Card>
    );
  const rest = items.length - SHOWN + (tasks ? 1 : 0);
  return (
    <Card title="Needs you" subtitle="What's waiting for a person, most urgent first. Snooze or dismiss items on To Do.">
      <ul className="divide-y divide-line">
        {items.slice(0, SHOWN).map((i) => (
          <Row key={i.key} item={i} go={go} />
        ))}
        {tasks > 0 && items.length < SHOWN && (
          <li className="flex flex-wrap items-center gap-3 py-2.5">
            <p className="min-w-0 flex-1 font-semibold">{tasks === 1 ? "1 open task" : `${tasks} open tasks`}</p>
            <OpenButton label="To Do" onClick={() => go("To Do")} />
          </li>
        )}
      </ul>
      {rest > 0 && items.length >= SHOWN && (
        <button type="button" className="mt-2 text-sm text-accent underline" onClick={() => go("To Do")}>
          {rest} more on To Do
        </button>
      )}
    </Card>
  );
}

function Row({ item, go }: { item: TodoItem; go: (tab: string) => void }) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{item.title}</p>
        <p className="truncate text-sm text-muted">{item.detail}</p>
      </div>
      {item.action.tab ? (
        <OpenButton label={item.action.label} onClick={() => go(item.action.tab!)} />
      ) : (
        <a
          href={item.action.href}
          target="_blank"
          rel="noreferrer"
          className="press rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
        >
          {item.action.label}
        </a>
      )}
    </li>
  );
}

function OpenButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="press rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink">
      {label}
    </button>
  );
}
