"use client";

// The admin Automations tab (Gradelings' Automations, without the automatic nudges Liftsmith doesn't have): the
// switches for instant alerts and the morning digest, who they go to, and a test alert.
import { useEffect, useState } from "react";

import { Card } from "./charts";

type Data = { settings: { instant: boolean; digest: boolean }; recipients: string[]; canSend: boolean };

function Toggle({
  label,
  help,
  on,
  disabled,
  change,
}: {
  label: string;
  help: string;
  on: boolean;
  disabled: boolean;
  change: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-3">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted">{help}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={() => change(!on)}
        className={`press relative h-7 w-12 shrink-0 rounded-full border border-line transition-colors disabled:opacity-50 ${on ? "bg-accent" : "bg-raised"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-all ${on ? "left-6" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export function Automations({ admin }: { admin: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const load = () =>
    fetch("/api/admin/automations/")
      .then(async (r) => r.ok && setData((await r.json()) as Data))
      .catch(() => {});
  useEffect(() => {
    void load();
  }, []);
  if (!data) return <p className="text-muted">Loading…</p>;
  const save = async (next: Data["settings"]) => {
    setData({ ...data, settings: next });
    const r = await fetch("/api/admin/automations/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setMsg(r.ok ? "Saved." : "That didn't save.");
  };
  const test = async (action: "test" | "digest") => {
    const r = await fetch("/api/admin/automations/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    setMsg(
      r.ok
        ? action === "digest"
          ? "Digest sent. Check your inbox."
          : "Test alert sent. Check your inbox."
        : (j.error ?? "Nothing was sent."),
    );
  };
  const s = data.settings;
  return (
    <div className="space-y-4">
      <Card
        title="Alerts and the morning digest"
        subtitle={`Sent to ${data.recipients.length ? data.recipients.join(", ") : "nobody yet (set ADMIN_EMAILS)"}. Never to support staff. Counts and links only, never a lifter's email or training.`}
      >
        {!data.canSend && (
          <p className="mb-2 text-sm text-warn">Email isn&apos;t set up on the server (RESEND_API_KEY), so nothing can be sent.</p>
        )}
        <Toggle
          label="Instant alerts"
          help="A store payment failed, the reminder or admin job failed, a System check went down or came back, repeated failed admin sign-ins, and good news: a new paying customer. The same alert goes out at most once every 6 hours."
          on={s.instant}
          disabled={!admin}
          change={(instant) => void save({ ...s, instant })}
        />
        <Toggle
          label="Morning digest"
          help="Each day at 8 AM Pacific: site health (the live site, UptimeRobot and every System check), the last 24 hours' sign-ups and installs by platform (Android, iOS, web), workouts, new coaches and clients, and Pro trials, new subscribers, payments and cancellations by store (Google Play, App Store, Stripe), plus what waits on To Do."
          on={s.digest}
          disabled={!admin}
          change={(digest) => void save({ ...s, digest })}
        />
        {admin && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="press rounded-lg border border-line px-3 py-1.5 text-sm" onClick={() => void test("test")}>
              Send a test alert
            </button>
            <button type="button" className="press rounded-lg border border-line px-3 py-1.5 text-sm" onClick={() => void test("digest")}>
              Send today&apos;s digest now
            </button>
          </div>
        )}
        {msg && (
          <p role="status" className="mt-2 text-sm text-muted">
            {msg}
          </p>
        )}
      </Card>
      <p className="text-xs text-muted">
        Site-down alerts come from UptimeRobot watching /api/health/. The daily check runs from Vercel Cron (/api/cron/admin/), which also
        records the database size for the Capacity card; the digest has its own (/api/cron/digest/).
      </p>
    </div>
  );
}
