"use client";

// Editing the Inbox's saved replies (admins; src/lib/savedReplies.ts, /api/admin/replies/). The list is saved
// whole. `{app}` in a reply becomes the app's name.
import { useEffect, useState } from "react";

import { REPLY_LIMITS, type SavedReply } from "@/lib/savedReplies";

import { Card } from "./charts";

const slug = (title: string, taken: Set<string>) => {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "reply";
  let id = base;
  for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
  return id;
};

export function SavedReplies() {
  const [list, setList] = useState<SavedReply[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/replies/")
      .then(async (r) => r.ok && live && setList(((await r.json()) as { replies: SavedReply[] }).replies))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!list) return null;
  const change = (i: number, patch: Partial<SavedReply>) => setList(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const save = async () => {
    const r = await fetch("/api/admin/replies/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replies: list }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    setMsg(r.ok ? "Saved." : (j.error ?? "That didn't save."));
  };
  return (
    <Card
      title="Saved replies"
      subtitle="Answers to common questions, put into a reply and edited before sending. {app} becomes the app's name."
    >
      {!open ? (
        <button type="button" className="press rounded-lg border border-line px-3 py-1.5 text-sm" onClick={() => setOpen(true)}>
          Edit {list.length} saved replies
        </button>
      ) : (
        <div className="space-y-4 text-sm">
          {list.map((r, i) => (
            <div key={r.id} className="space-y-1">
              <label className="block">
                <span className="block text-xs text-muted">Title</span>
                <input
                  value={r.title}
                  maxLength={REPLY_LIMITS.title}
                  onChange={(e) => change(i, { title: e.target.value })}
                  className="card mt-1 w-full px-2 py-1.5"
                />
              </label>
              <label className="block">
                <span className="block text-xs text-muted">Reply</span>
                <textarea
                  value={r.body}
                  rows={4}
                  maxLength={REPLY_LIMITS.body}
                  onChange={(e) => change(i, { body: e.target.value })}
                  className="card mt-1 w-full px-2 py-1.5"
                />
              </label>
              <button type="button" className="text-xs text-muted underline" onClick={() => setList(list.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {list.length < REPLY_LIMITS.count && (
              <button
                type="button"
                className="press rounded-lg border border-line px-3 py-1.5"
                onClick={() => setList([...list, { id: slug("New reply", new Set(list.map((r) => r.id))), title: "New reply", body: "" }])}
              >
                Add a reply
              </button>
            )}
            <button
              type="button"
              className="press rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-ink"
              onClick={() => void save()}
            >
              Save replies
            </button>
          </div>
        </div>
      )}
      {msg && (
        <p role="status" className="mt-2 text-sm text-muted">
          {msg}
        </p>
      )}
    </Card>
  );
}
