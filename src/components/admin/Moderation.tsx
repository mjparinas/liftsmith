"use client";

// The Friends part of an account on the admin Users tab (docs/decisions/moderation.md): how many reports, who sent
// each and why, what the lifter has been told, and the actions (warn, suspend, ban, shadow ban, unban, off
// leaderboards, reset the name or handle, dismiss the reports), with the history of what staff did. Admins act;
// support staff read.
import { useState } from "react";

import type { ModerationDetail, ModState } from "@/server/socialModeration";

import { fmtInt, Table, Tile } from "./charts";
import { ago, when } from "./time";

/** The report reasons in staff's words (the app's own text is in the six languages). */
export const REASON_NAME: Record<string, string> = {
  spam: "Spam or scam",
  abuse: "Bullying or harassment",
  hate: "Hate",
  sexual: "Sexual content",
  danger: "Dangerous advice",
  impersonation: "Pretending to be someone else",
  name: "Offensive name or handle",
  underage: "Under 13",
  cheating: "Fake lifts or cheating",
  other: "Something else",
};
const REASONS = Object.keys(REASON_NAME);

export const STATE_NAME: Record<ModState, string> = {
  ok: "In good standing",
  suspended: "Suspended",
  banned: "Banned",
  shadow: "Shadow banned",
};

const STATUS_NAME: Record<string, string> = { open: "Waiting", dismissed: "Dismissed", removed: "Removed", suspended: "Banned" };

const ACTION_NAME: Record<string, string> = {
  "mod.warn": "Warned",
  "mod.suspend": "Suspended",
  "mod.ban": "Banned",
  "mod.shadow": "Shadow banned",
  "mod.unban": "Unbanned",
  "mod.boardsOff": "Taken off leaderboards",
  "mod.boardsOn": "Back on leaderboards",
  "mod.resetName": "Name reset",
  "mod.resetHandle": "Handle reset",
  "mod.dismiss": "Reports dismissed",
  "report.remove": "Removed (Reports tab)",
  "report.dismiss": "Dismissed (Reports tab)",
  "report.suspend": "Banned (Reports tab)",
  "report.unsuspend": "Unbanned (Reports tab)",
};

/** A small coloured label for a standing, an under 18 or a waiting count. */
export function Badge({ tone, children }: { tone: "bad" | "warn" | "good" | "muted"; children: string }) {
  const cls = {
    bad: "border-bad/50 text-bad",
    warn: "border-warn/50 text-warn",
    good: "border-good/50 text-good",
    muted: "border-line text-muted",
  }[tone];
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}

export const stateTone = (s: ModState) => (s === "ok" ? "good" : s === "shadow" ? "warn" : "bad");

function detailOf(d: string | null): string {
  if (!d) return "";
  try {
    const x = JSON.parse(d) as { reason?: string; days?: number };
    return [x.reason ? (REASON_NAME[x.reason] ?? x.reason) : "", x.days ? `${x.days} days` : ""].filter(Boolean).join(", ");
  } catch {
    return "";
  }
}

export function Moderation({
  m,
  admin,
  act,
  openAccount,
}: {
  m: ModerationDetail;
  admin: boolean;
  /** Sends {action: "mod", what, …} for this account and reloads it. */
  act: (body: Record<string, unknown>, done: string) => Promise<boolean>;
  openAccount: (id: string) => void;
}) {
  const [reason, setReason] = useState(() => {
    const open = m.reports.filter((r) => r.status === "open");
    const counts = new Map<string, number>();
    for (const r of open) counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  });
  const [days, setDays] = useState(7);
  const mod = (what: string, done: string, extra: Record<string, unknown> = {}) => void act({ action: "mod", what, ...extra }, done);
  if (!m.profile)
    return (
      <>
        <h3 className="mt-5 text-sm font-semibold">Friends and reports</h3>
        <p className="text-sm text-muted">
          Hasn&apos;t joined Friends, so there&apos;s nothing to moderate.
          {m.emailBanned && " Their email is on the ban list, so they can't join until an admin unbans them."}
        </p>
      </>
    );
  const btn = "press rounded-lg border border-line px-3 py-1.5 text-sm";
  return (
    <section aria-labelledby="mod-title" className="mt-5 border-t border-line pt-4">
      <h3 id="mod-title" className="text-sm font-semibold">
        Friends and reports
      </h3>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">@{m.profile.handle}</span>
        <span className="text-muted">{m.profile.name}</span>
        <Badge tone={stateTone(m.state)}>
          {m.state === "suspended" && m.until ? `Suspended until ${when(m.until)}` : STATE_NAME[m.state]}
        </Badge>
        {m.boardsOff && <Badge tone="warn">Off leaderboards</Badge>}
        {m.minor && <Badge tone="warn">Under 18</Badge>}
        {m.profile.public && <Badge tone="muted">Public profile</Badge>}
      </p>
      {m.minor && (
        <p className="mt-2 rounded-lg border border-warn/50 p-2 text-sm">
          Under 18: teen-safe defaults apply (no public profile, not suggested to strangers). Prefer a warning first, and if a report says
          they&apos;re under 13, delete the account: nobody under 13 may use Liftsmith.
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Reports waiting" value={fmtInt(m.counts.open)} />
        <Tile
          label="Reports ever"
          value={fmtInt(m.counts.total)}
          sub={`from ${fmtInt(m.counts.reporters)} ${m.counts.reporters === 1 ? "person" : "people"}`}
        />
        <Tile
          label="Reports they sent"
          value={fmtInt(m.made.total)}
          sub={m.made.dismissed ? `${fmtInt(m.made.dismissed)} dismissed` : "None dismissed"}
        />
        <Tile
          label="Last told"
          value={m.notice ? { warn: "A warning", suspend: "A suspension", ban: "A ban" }[m.notice.kind] : "Nothing"}
          sub={m.notice ? `${ago(m.notice.at)}${m.notice.reason ? `, ${REASON_NAME[m.notice.reason] ?? m.notice.reason}` : ""}` : undefined}
        />
      </div>

      <h4 className="mt-4 text-sm font-semibold">Who reported them</h4>
      <Table
        columns={["Reported by", "Reason", "About", "When", "Status"]}
        rows={m.reports.map((r) => [
          r.reporter ? (
            <span key="by" className="flex flex-wrap items-center gap-1">
              <button type="button" className="text-left text-accent underline" onClick={() => openAccount(r.reporter!.accountId)}>
                {r.reporter.handle ? `@${r.reporter.handle}` : (r.reporter.email ?? r.reporter.accountId)}
              </button>
              {r.reporter.minor && <Badge tone="warn">Under 18</Badge>}
            </span>
          ) : (
            "Left Friends"
          ),
          <span key="why">
            {REASON_NAME[r.reason] ?? r.reason}
            {r.note && <span className="block text-xs text-muted">“{r.note}”</span>}
          </span>,
          <span key="what" className="line-clamp-2 break-words">
            {r.content}
          </span>,
          ago(r.at),
          STATUS_NAME[r.status] ?? r.status,
        ])}
        empty="Nobody has reported them."
      />

      {admin && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="mod-reason" className="block text-xs text-muted">
                Reason they&apos;re told
              </label>
              <select id="mod-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="card mt-1 px-2 py-1.5 text-sm">
                <option value="">No reason given</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {REASON_NAME[r]}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className={btn} onClick={() => mod("warn", "Warned. They'll see it in Friends.", { reason })}>
              Warn
            </button>
            <div className="flex items-end gap-2">
              <div>
                <label htmlFor="mod-days" className="block text-xs text-muted">
                  Suspend for
                </label>
                <select
                  id="mod-days"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="card mt-1 px-2 py-1.5 text-sm"
                >
                  {[1, 3, 7, 30].map((d) => (
                    <option key={d} value={d}>
                      {d === 1 ? "1 day" : `${d} days`}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className={btn} onClick={() => mod("suspend", `Suspended for ${days} days.`, { reason, days })}>
                Suspend
              </button>
            </div>
            <button
              type="button"
              className="press rounded-lg border border-bad/60 px-3 py-1.5 text-sm text-bad"
              onClick={() => mod("ban", "Banned from Friends. Their email can't join again until they're unbanned.", { reason })}
            >
              Ban
            </button>
            <button type="button" className={btn} onClick={() => mod("shadow", "Shadow banned. They aren't told.")}>
              Shadow ban
            </button>
            {(m.state !== "ok" || m.emailBanned) && (
              <button type="button" className={btn} onClick={() => mod("unban", "Unbanned. Their profile shows again.")}>
                Unban
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btn}
              onClick={() =>
                m.boardsOff
                  ? mod("boardsOn", "Back on leaderboards.")
                  : mod("boardsOff", "Taken off other people's leaderboards. They still see their own line.")
              }
            >
              {m.boardsOff ? "Put back on leaderboards" : "Take off leaderboards"}
            </button>
            <button type="button" className={btn} onClick={() => mod("resetName", "Name reset to their handle.")}>
              Reset name
            </button>
            <button type="button" className={btn} onClick={() => mod("resetHandle", "Handle replaced with a random one.")}>
              Reset handle
            </button>
            {m.counts.open > 0 && (
              <button
                type="button"
                className={btn}
                onClick={() => mod("dismiss", "Reports dismissed. Hidden posts and comments show again.")}
              >
                Dismiss {m.counts.open === 1 ? "the report" : `all ${m.counts.open} reports`}
              </button>
            )}
          </div>
          <p className="text-xs text-muted">
            Warn, suspend and ban tell them in Friends with the reason. A shadow ban tells them nothing: they carry on, and nobody else sees
            what they post. Only Friends is affected; their own workouts and sync stay theirs.
          </p>
        </div>
      )}

      <h4 className="mt-4 text-sm font-semibold">What staff did</h4>
      <Table
        columns={["When", "Who", "What"]}
        rows={m.history.map((h) => [
          when(h.at),
          h.admin,
          [ACTION_NAME[h.action] ?? h.action, detailOf(h.detail)].filter(Boolean).join(": "),
        ])}
        empty="Nothing yet."
      />
    </section>
  );
}
