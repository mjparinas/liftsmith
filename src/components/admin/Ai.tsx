"use client";

// The admin AI helpers' shared parts (docs/decisions/admin-ai.md): whether they can run now, one way to call them, a
// suggestion box with the one button that acts on it, and the Overview's Ask your data card. Claude only suggests;
// every change still goes through the button and the route that made it before.
import { useEffect, useState } from "react";

import type { Metrics } from "@/lib/adminMetrics";
import type { AiStatus } from "@/server/ai";

import { Card } from "./charts";

let pending: Promise<AiStatus | null> | null = null;
const listeners = new Set<(s: AiStatus | null) => void>();

function loadStatus(fresh = false): Promise<AiStatus | null> {
  if (!pending || fresh)
    pending = fetch("/api/admin/ai/")
      .then(async (r) => (r.ok ? ((await r.json()) as AiStatus) : null))
      .catch(() => null)
      .then((s) => {
        for (const l of listeners) l(s);
        return s;
      });
  return pending;
}

/** The helpers' state, loaded once for the whole panel and refreshed after each request (the spend moves). */
export function useAiStatus(): AiStatus | null {
  const [s, setS] = useState<AiStatus | null>(null);
  useEffect(() => {
    listeners.add(setS);
    void loadStatus().then(setS);
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
}

/** One request to /api/admin/ai/. */
export async function aiPost<T>(body: Record<string, unknown>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const r = await fetch("/api/admin/ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await r.json().catch(() => ({}))) as T & { error?: string };
    void loadStatus(true);
    return r.ok ? { ok: true, data: j } : { ok: false, error: j.error ?? "The AI helper didn't work." };
  } catch {
    return { ok: false, error: "Couldn't reach the server." };
  }
}

export const aiBtn = "press rounded-lg border border-accent/40 px-3 py-1.5 text-accent disabled:opacity-50";

/** A line under a helper: the day's spend, or why it can't run. */
export function AiNote({ s }: { s: AiStatus | null }) {
  if (!s) return null;
  return (
    <p className="text-xs text-faint">
      {s.ready ? `AI today: $${s.spent.toFixed(2)} of $${s.cap} · ${s.calls} ${s.calls === 1 ? "request" : "requests"}` : s.why}
    </p>
  );
}

/** Claude's suggestion, with the one button that does it. */
export function AiSuggestion({
  label,
  reason,
  doIt,
  dismiss,
  danger,
}: {
  label: string;
  reason: string;
  doIt?: () => void | Promise<unknown>;
  dismiss: () => void;
  danger?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-2 rounded-lg border border-accent/30 bg-raised p-3 text-sm" role="status">
      <p>
        <span className="font-semibold text-accent">Claude suggests: {label}.</span> {reason}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {doIt && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void Promise.resolve(doIt()).finally(() => setBusy(false));
            }}
            className={`press rounded-lg px-3 py-1.5 font-semibold ${danger ? "border border-bad/40 text-bad" : "bg-accent text-accent-ink"}`}
          >
            {label}
          </button>
        )}
        <button type="button" onClick={dismiss} className="press rounded-lg border border-line px-3 py-1.5 text-muted">
          Ignore
        </button>
      </div>
    </div>
  );
}

const EXAMPLES = [
  "How many trials started this period, and is that up?",
  "Which store brought the most installs?",
  "What share of new installs finished a workout?",
];

/** Ask your data (Overview): a question answered from the numbers already on screen, so nothing more is read. */
export function AskData({ data, days }: { data: Metrics; days: number }) {
  const s = useAiStatus();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<{ q: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ask = async (question: string) => {
    if (question.trim().length < 3 || busy) return;
    setBusy(true);
    setError(null);
    const r = await aiPost<{ answer: string }>({ task: "ask", question, metrics: data });
    setBusy(false);
    if (r.ok) setAnswer({ q: question, text: r.data.answer });
    else setError(r.error);
  };
  if (s && !s.configured) return null;
  return (
    <Card title="Ask your data" subtitle={`Claude answers from this page's numbers for the last ${days} days. Read-only.`}>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(q);
        }}
      >
        <input
          aria-label="Your question"
          value={q}
          maxLength={500}
          onChange={(e) => setQ(e.target.value)}
          placeholder="How many trials converted?"
          className="min-w-0 flex-1 basis-60 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
        />
        <button type="submit" disabled={busy || !s?.ready || q.trim().length < 3} className={aiBtn}>
          {busy ? "Thinking…" : "Ask"}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-2">
        {EXAMPLES.map((x) => (
          <button
            key={x}
            type="button"
            disabled={busy || !s?.ready}
            onClick={() => {
              setQ(x);
              void ask(x);
            }}
            className="press rounded-full border border-line px-3 py-1 text-xs text-muted disabled:opacity-50"
          >
            {x}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-bad" role="alert">
          {error}
        </p>
      )}
      {answer && (
        <div className="mt-3 rounded-lg bg-raised p-3 text-sm" aria-live="polite">
          <p className="text-xs text-muted">{answer.q}</p>
          <p className="mt-1 whitespace-pre-line">{answer.text}</p>
        </div>
      )}
      <div className="mt-2">
        <AiNote s={s} />
      </div>
    </Card>
  );
}
