"use client";

// The top of Overview: what needs a person right now, before any number (action over stats, AGENTS.md). The same
// list as the To Do tab (mail waiting, reports waiting, creators owed, payment failures, a late job, setup still to
// do) plus open tasks, each one click from where it's dealt with. Says so when nothing needs doing.
import { useCallback, useEffect, useState } from "react";

import type { TodoItem, TodoList } from "@/server/adminTodo";

import { Card } from "./charts";
import { CardBones, Loading } from "./Skeletons";

const SHOWN = 5;

/** `onList` hears the list it read, so the To Do count beside the tab's name stays in step with it. */
export function NeedsYou({ go, onList }: { go: (tab: string) => void; onList?: (list: TodoList) => void }) {
  const [list, setList] = useState<TodoList | null>(null);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const load = useCallback(() => {
    setError(false);
    setList(null);
    setVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/todo/")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as TodoList;
        if (!live) return;
        setList(j);
        onList?.(j);
      })
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [onList, version]);
  if (error)
    return (
      <Card title="Needs you" subtitle="Couldn't load what needs you.">
        <p className="text-sm text-bad" role="alert">
          The To Do list didn&apos;t load. Mail and reports may still be waiting.
        </p>
        <button type="button" onClick={load} className="press mt-3 min-h-11 rounded-lg btn-primary px-3 py-2 text-sm font-semibold">
          Retry
        </button>
      </Card>
    );
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
        <button type="button" className="mt-2 min-h-11 text-sm text-accent underline" onClick={() => go("To Do")}>
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
          className="press min-h-11 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink"
        >
          {item.action.label}
        </a>
      )}
    </li>
  );
}

function OpenButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press min-h-11 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink"
    >
      {label}
    </button>
  );
}
