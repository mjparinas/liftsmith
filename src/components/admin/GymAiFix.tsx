"use client";

// Admin › Gyms › Import › AI fix-up (Melvin, 2026-11-19: "a pass on ai fixing stuff … that respects the ai cost limit
// … only run against unclaimed gyms and … only run on them once"; docs/decisions/gyms.md "AI fix-up pass"). One button
// starts the pass on the server (src/server/gymAiFix.ts); the card shows how far it got, why it's paused (the day's AI
// cap, until midnight Pacific), and every change it made with its old value and Undo. Admins start, stop and undo;
// support staff watch.
import { useCallback, useEffect, useState } from "react";

import { isVisible, onVisibility } from "@/lib/visibility";
import type { FixRecent, FixStatus } from "@/server/gymAiFix";

import { Card } from "./charts";
import { HowItWorks } from "./HowItWorks";

/** How often the card reads a running pass (not while it's paused or the tab is hidden). */
export const FIX_POLL_MS = 10_000;

const FIELD: Record<FixRecent["field"], string> = {
  address: "Address",
  city: "City",
  postcode: "Postcode",
  phone: "Phone",
  hours: "Hours",
  email: "Email",
  instagram: "Instagram",
  facebook: "Facebook",
};

async function post(body: Record<string, unknown>): Promise<{ fix?: FixStatus | null; error?: string }> {
  const r = await fetch("/api/admin/gym-places/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!r) return { error: "The admin server didn't answer." };
  const j = (await r.json().catch(() => null)) as { fix?: FixStatus | null; error?: string } | null;
  if (!j) return { error: `The admin server answered ${r.status}.` };
  return r.ok ? j : { ...j, error: j.error ?? `HTTP ${r.status}` };
}

export function GymAiFix({ admin, changed }: { admin: boolean; changed: () => void }) {
  const [fix, setFix] = useState<FixStatus | null>(null);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const running = fix?.state === "running";
  const paused = running && fix.pausedUntil > 0;

  const read = useCallback(
    () =>
      fetch("/api/admin/gym-places/?fix=1")
        .then(async (r) => (r.ok ? ((await r.json()) as { fix: FixStatus | null }) : null))
        .then((j) => j && setFix(j.fix))
        .catch(() => undefined),
    [],
  );
  useEffect(() => {
    void read();
  }, [read]);
  useEffect(() => {
    if (!running || paused) return;
    const t = setInterval(() => isVisible() && void read(), FIX_POLL_MS);
    const off = onVisibility((v) => v && void read());
    return () => {
      clearInterval(t);
      off();
    };
  }, [running, paused, read]);

  const act = async (body: Record<string, unknown>) => {
    setProblem("");
    setBusy(true);
    const r = await post(body);
    setBusy(false);
    if (r.error) setProblem(r.error);
    if (r.fix !== undefined) setFix(r.fix);
    if (body.action === "fixUndo" && !r.error) changed();
  };

  return (
    <Card title="AI fix-up">
      <HowItWorks>
        <p>
          A pass over every unclaimed gym with a website, once each: Claude reads the gym&apos;s own home page next to what we have, fills
          what&apos;s empty and corrects what the page clearly says is different (phone, opening hours, email, Instagram, Facebook, and the
          street address when the page puts it in the gym&apos;s own city). Every answer is checked in code like the import&apos;s AI step.
          The city is only fixed when ours is missing or a postcode, and postcodes are only filled. A page that says the gym closed for good
          or isn&apos;t a gym goes to Admin › Reports for you to decide; nothing is hidden.
        </p>
        <p>
          A gym gets its one go and never another, even if the pass is stopped and started again; claimed gyms are never touched. It spends
          from the same AI daily cap as the other helpers (Flags › AI daily cap): at the cap it pauses and carries on by itself after
          midnight Pacific. Every change is listed below with its old value and Undo.
        </p>
      </HowItWorks>
      {admin && !running && (
        <div className="mt-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void act({ action: "fixStart" })}
            className="press btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
          >
            {busy ? "Starting…" : "Run the AI fix-up on unclaimed gyms"}
          </button>
        </div>
      )}
      {problem && (
        <p className="mt-2 text-sm text-bad" role="alert">
          {problem}
        </p>
      )}
      {fix && <FixCard fix={fix} admin={admin} busy={busy} act={act} />}
    </Card>
  );
}

function FixCard({
  fix,
  admin,
  busy,
  act,
}: {
  fix: FixStatus;
  admin: boolean;
  busy: boolean;
  act: (body: Record<string, unknown>) => Promise<void>;
}) {
  const running = fix.state === "running";
  const pct = fix.total ? Math.min(100, (fix.done / fix.total) * 100) : 100;
  const title = running
    ? fix.pausedUntil
      ? `Paused until ${new Date(fix.pausedUntil).toLocaleString()}`
      : "Running"
    : fix.state === "stopped"
      ? "Stopped"
      : "Done";
  return (
    <div className="mt-3 grid gap-2 rounded-lg border border-line p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 font-semibold" role="status">
          {title}: {fix.done} of {fix.total} gyms
        </p>
        {admin &&
          (running ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void act({ action: "fixStop", job: fix.id })}
              className="press rounded-lg border border-line px-3 py-1.5 text-muted"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void act({ action: "fixClose", job: fix.id })}
              className="press rounded-lg border border-line px-3 py-1.5 text-muted"
            >
              Close
            </button>
          ))}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-raised"
        role="progressbar"
        aria-label="Gyms checked"
        aria-valuemin={0}
        aria-valuemax={fix.total}
        aria-valuenow={fix.done}
      >
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-muted">
        {fix.filled} got missing details, {fix.fixed} had details corrected, {fix.flagged} sent to Reports, {fix.skipped} couldn&apos;t be
        read.
      </p>
      <p className="text-xs text-faint">
        Started by {fix.startedBy || "an admin"} {new Date(fix.startedAt).toLocaleString()}
        {running ? ". Runs on the server, so this page can be closed." : "."}
      </p>
      {fix.note && <p className="text-muted">{fix.note}</p>}
      {fix.recent.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs text-faint">Latest changes ({fix.recent.length})</summary>
          <ul className="mt-1 grid max-h-72 gap-1 overflow-y-auto text-xs">
            {fix.recent.map((c) => (
              <li key={c.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">{c.name}</span>
                <span className="text-muted">
                  {FIELD[c.field]}: {c.before ? `${c.before} → ` : "added "}
                  {c.after}
                </span>
                {c.undone ? (
                  <span className="text-faint">undone</span>
                ) : (
                  admin &&
                  c.field !== "city" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act({ action: "fixUndo", change: c.id })}
                      className="press rounded border border-line px-2 py-0.5 text-muted"
                    >
                      Undo
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
