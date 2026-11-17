"use client";

// The admin AI helpers' shared parts (docs/decisions/admin-ai.md): whether they can run now, one way to call them, a
// suggestion box with the one button that acts on it, and the header's Ask AI. Claude only suggests;
// every change still goes through the button and the route that made it before.
import { useEffect, useRef, useState } from "react";

import type { Metrics } from "@/lib/adminMetrics";
import type { AiStatus } from "@/server/ai";
import type { PageInsights } from "@/server/aiHelpers";

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

export const aiBtn = "press rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 font-semibold text-accent disabled:opacity-50";

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
            className={`press rounded-lg px-3 py-1.5 font-semibold ${danger ? "border border-bad/40 text-bad" : "btn-primary"}`}
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

/** The words of the tab on screen, as a person reads them (the page body is marked `data-admin-page`). */
function pageWords(): string {
  const el = document.querySelector<HTMLElement>("[data-admin-page]");
  if (!el) return "";
  // innerText keeps the layout's line breaks; jsdom has only textContent.
  return (el.innerText || el.textContent || "").slice(0, 60_000);
}

/** The header's Ask AI button: one per panel, admins only, hidden until the API key is set. */
export function AskAiButton({ open, toggle }: { open: boolean; toggle: () => void }) {
  const s = useAiStatus();
  if (!s?.configured) return null;
  return (
    <button type="button" aria-expanded={open} aria-controls="ask-ai" onClick={toggle} className={`${aiBtn} text-sm`}>
      Ask AI
    </button>
  );
}

/**
 * Ask AI, under the header on every tab (Melvin, 2026-11-16): sends the tab's words as shown (and on the stats tabs its
 * numbers) and shows what needs doing, each with the tab to open for it. Reads nothing more from the database and
 * changes nothing; a follow-up question asks again about the same tab.
 */
export function AskAiPanel({ tab, metrics, go, close }: { tab: string; metrics?: Metrics; go: (tab: string) => void; close: () => void }) {
  const s = useAiStatus();
  const [q, setQ] = useState("");
  const [result, setResult] = useState<{ q: string; insights: PageInsights } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ask = async (question: string) => {
    setBusy(true);
    setError(null);
    const r = await aiPost<{ insights: PageInsights }>({ task: "page", tab, page: pageWords(), metrics, question });
    setBusy(false);
    if (r.ok) setResult({ q: question, insights: r.data.insights });
    else setError(r.error);
  };
  const ready = Boolean(s?.ready);
  // Opening the panel is the request: ask once the state says the helpers can run.
  const asked = useRef(false);
  useEffect(() => {
    if (!ready || asked.current) return;
    asked.current = true;
    void ask("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return (
    <section id="ask-ai" aria-label={`Ask AI about ${tab}`} className="card rounded-xl border border-accent/30 p-4">
      <div className="flex items-start gap-3">
        <h2 className="mr-auto font-bold tracking-tight">What needs doing on {tab}</h2>
        <button type="button" onClick={close} className="press text-sm text-muted" aria-label="Close Ask AI">
          ✕
        </button>
      </div>
      {s && !s.ready && <p className="mt-2 text-sm text-muted">{s.why}</p>}
      {busy && (
        <p className="mt-2 text-sm text-muted" aria-live="polite">
          Reading this tab…
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-bad" role="alert">
          {error}
        </p>
      )}
      {result && !busy && (
        <div className="mt-2 space-y-3 text-sm" aria-live="polite">
          {result.q && <p className="text-xs text-muted">{result.q}</p>}
          <p className="whitespace-pre-line">{result.insights.summary}</p>
          {result.insights.actions.length > 0 && (
            <ol className="space-y-2">
              {result.insights.actions.map((a, i) => (
                <li key={i} className="flex flex-wrap items-start gap-2 rounded-lg bg-raised p-3">
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="font-semibold">{a.do}</p>
                    <p className="text-muted">{a.why}</p>
                  </div>
                  {a.tab && (
                    <button type="button" onClick={() => go(a.tab!)} className={aiBtn}>
                      Open {a.tab}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim().length >= 3) void ask(q.trim());
        }}
      >
        <input
          aria-label={`Ask about ${tab}`}
          value={q}
          maxLength={500}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Ask about ${tab}`}
          className="min-w-0 flex-1 basis-60 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
        />
        <button type="submit" disabled={busy || !ready || q.trim().length < 3} className={aiBtn}>
          Ask
        </button>
        <button
          type="button"
          disabled={busy || !ready}
          onClick={() => void ask("")}
          className="press rounded-lg border border-line px-3 py-1.5 text-muted disabled:opacity-50"
        >
          Look again
        </button>
      </form>
      <div className="mt-2">
        <AiNote s={s} />
      </div>
    </section>
  );
}
