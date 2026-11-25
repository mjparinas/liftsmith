"use client";

// The admin Reports tab: what lifters reported on Friends (docs/decisions/friends.md), grouped by what was reported,
// most reported first. Three reports have already hidden a post or comment; staff remove it, dismiss the reports
// (which shows it again), or suspend the author (hides everything they wrote and stops them posting). Support
// staff can read; only admins act.
import { useEffect, useState } from "react";

import type { ReportAction, ReportGroup } from "@/server/social";

import { aiBtn, AiNote, aiPost, AiSuggestion, useAiStatus } from "./Ai";
import { Card } from "./charts";
import { REASON_NAME } from "./Moderation";
import { Loading, RowBones } from "./Skeletons";
import { ago } from "./time";
import { useDangerArm } from "./useDangerArm";

type Suggestion = { action: Exclude<ReportAction, "unsuspend">; reason: string };
const key = (g: ReportGroup) => `${g.kind}:${g.targetId}`;

const ACTIONS: { action: ReportAction; label: string; danger?: boolean; effect?: string }[] = [
  { action: "remove", label: "Remove", danger: true, effect: "Deletes the content (or resets a profile name)." },
  { action: "dismiss", label: "Dismiss", effect: "Shows the content again." },
  { action: "suspend", label: "Ban author", danger: true, effect: "Hides everything they wrote on Friends and tells them." },
];

/** Danger actions need a second tap naming the effect; Dismiss stays one tap. */
const CONFIRM_LABEL: Partial<Record<ReportAction, string>> = {
  remove: "Confirm remove?",
  suspend: "Confirm ban?",
};

export function Reports({ admin, onCount }: { admin: boolean; onCount: (n: number) => void }) {
  const [rows, setRows] = useState<ReportGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const { armed, isArmed, request } = useDangerArm();
  useEffect(() => {
    let live = true;
    fetch("/api/admin/reports/")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as { reports: ReportGroup[] };
        if (!live) return;
        setRows(j.reports);
        onCount(j.reports.length);
      })
      .catch(() => live && setError("The reports didn't load."));
    return () => {
      live = false;
    };
  }, [version, onCount]);
  const load = () => setVersion((v) => v + 1);
  const ai = useAiStatus();
  const [tips, setTips] = useState<Record<string, Suggestion | "…" | { error: string }>>({});
  const suggest = async (g: ReportGroup) => {
    setTips((t) => ({ ...t, [key(g)]: "…" }));
    const r = await aiPost<{ suggestion: Suggestion }>({
      task: "triage",
      report: {
        kind: g.kind,
        content: g.content,
        reports: g.reports,
        reasons: g.reasons,
        notes: g.notes,
        author: g.author,
        hidden: g.hidden,
      },
    });
    setTips((t) => ({ ...t, [key(g)]: r.ok ? r.data.suggestion : { error: r.error } }));
  };
  const suggestAll = async () => {
    for (const g of rows ?? []) if (!tips[key(g)]) await suggest(g);
  };
  const act = async (g: ReportGroup, action: ReportAction) => {
    const r = await fetch("/api/admin/reports/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: g.kind, id: g.targetId, action }),
    });
    if (!r.ok) setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "That didn't work.");
    load();
  };
  /** Remove and Ban need two taps; Dismiss and Unban run at once. Returns true when the request was sent. */
  const requestAct = (g: ReportGroup, action: ReportAction): boolean => {
    const needsConfirm = action === "remove" || action === "suspend";
    return request(key(g), action, needsConfirm, () => void act(g, action));
  };
  const armedMeta = armed && ACTIONS.find((x) => x.action === armed.action);
  const armedLabel = armedMeta ? `${CONFIRM_LABEL[armedMeta.action] ?? armedMeta.label} — ${armedMeta.effect ?? ""} Esc cancels.` : null;
  return (
    <Card title="Reports on Friends, coach reviews and the community">
      <ul className="space-y-1.5 text-sm">
        {ACTIONS.map((a) => (
          <li key={a.action}>
            <span className={`font-semibold ${a.danger ? "text-bad" : "text-ink"}`}>{a.label}</span>
            <span className="text-muted"> — {a.effect}</span>
          </li>
        ))}
      </ul>
      <details className="mt-3 text-sm text-muted">
        <summary className="press min-h-11 cursor-pointer list-none py-2 text-accent underline marker:content-none [&::-webkit-details-marker]:hidden">
          Full policy
        </summary>
        <p className="mt-1 max-w-prose">
          Posts, comments, profiles, coach reviews, coaches&apos; replies and community ideas, bugs and comments that people reported. Three
          reports hide a post, comment, review or reply until it&apos;s decided here. For a profile, Remove resets the name to the handle
          and clears the tagline; for a reply, it clears the reply and keeps the review. Ban author on a community idea, bug or comment
          blocks them from posting there. For warnings, suspensions, shadow bans and who reported whom, open the author on the Users tab.
        </p>
      </details>
      {admin && ai?.configured && rows && rows.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <button type="button" disabled={!ai.ready} onClick={() => void suggestAll()} className={aiBtn}>
            Suggest for all with AI
          </button>
          <AiNote s={ai} />
        </div>
      )}
      {error && (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-bad" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setRows(null);
              load();
            }}
            className="press min-h-11 rounded-lg btn-primary px-3 py-2 text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      )}
      {armedLabel && (
        <p className="mt-2 text-sm text-bad" role="status" aria-live="polite">
          {armedLabel}
        </p>
      )}
      {rows === null ? (
        !error && (
          <Loading label="Loading reports" className="mt-3">
            <RowBones n={3} />
          </Loading>
        )
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing waiting.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {rows.map((g) => (
            <li key={`${g.kind}:${g.targetId}`} className="flex flex-wrap items-start gap-3 py-3">
              <span className="mt-0.5 shrink-0 rounded-md border border-line px-2 py-0.5 text-xs text-muted">{g.kind}</span>
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold">{g.content || "(empty)"}</p>
                <p className="text-sm text-muted">
                  {g.author
                    ? `${g.author.handle ? `@${g.author.handle} (${g.author.name})` : g.author.name || "No name"}${g.author.suspended ? " · banned or suspended" : ""}`
                    : "author gone"}{" "}
                  · {g.reports} {g.reports === 1 ? "report" : "reports"} ·{" "}
                  {Object.entries(g.reasons)
                    .map(([k, n]) => `${REASON_NAME[k] ?? k} ${n}`)
                    .join(", ")}{" "}
                  · last {ago(g.lastAt)}
                  {g.hidden ? " · hidden" : ""}
                </p>
                {g.notes.length > 0 && <p className="mt-1 text-sm text-muted">Notes: {g.notes.join(" | ")}</p>}
                {admin && (
                  <Tip
                    tip={tips[key(g)]}
                    act={(a) => requestAct(g, a)}
                    drop={() => setTips((t) => Object.fromEntries(Object.entries(t).filter(([k]) => k !== key(g))))}
                  />
                )}
              </div>
              {admin && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {ACTIONS.filter(
                    (a) =>
                      !(a.action === "remove" && !g.content) &&
                      !(a.action === "suspend" && (g.kind === "review" || g.kind === "routine") && !g.author?.handle),
                  ).map((a) => {
                    const ready = isArmed(key(g), a.action);
                    return (
                      <button
                        key={a.action}
                        type="button"
                        aria-pressed={a.danger ? ready : undefined}
                        title={ready ? "Esc cancels" : a.effect}
                        onClick={() => requestAct(g, a.action)}
                        className={`press min-h-11 rounded-lg px-3 py-1.5 ${
                          a.danger
                            ? ready
                              ? "border border-bad bg-bad/15 font-semibold text-bad"
                              : "border border-bad/40 text-bad"
                            : "border border-line text-muted"
                        }`}
                      >
                        {ready ? (CONFIRM_LABEL[a.action] ?? `Confirm ${a.label}?`) : a.label}
                      </button>
                    );
                  })}
                  {ai?.ready && !tips[key(g)] && (
                    <button type="button" onClick={() => void suggest(g)} className={aiBtn}>
                      Suggest
                    </button>
                  )}
                  {g.author?.suspended && (
                    <button
                      type="button"
                      onClick={() => void act(g, "unsuspend")}
                      className="press min-h-11 rounded-lg border border-line px-3 py-1.5 text-muted"
                    >
                      Unban
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const LABEL: Record<Suggestion["action"], string> = { remove: "Remove", dismiss: "Dismiss", suspend: "Ban author" };

function Tip({
  tip,
  act,
  drop,
}: {
  tip: Suggestion | "…" | { error: string } | undefined;
  /** Returns true when the action was sent (not merely armed). */
  act: (a: ReportAction) => boolean;
  drop: () => void;
}) {
  if (!tip) return null;
  if (tip === "…") return <p className="mt-2 text-sm text-muted">Claude is reading it…</p>;
  if ("error" in tip)
    return (
      <p className="mt-2 text-sm text-bad" role="alert">
        {tip.error}
      </p>
    );
  return (
    <AiSuggestion
      label={LABEL[tip.action]}
      reason={tip.reason}
      danger={tip.action !== "dismiss"}
      doIt={() => {
        if (act(tip.action)) drop();
      }}
      dismiss={drop}
    />
  );
}
