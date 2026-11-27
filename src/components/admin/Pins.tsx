"use client";

// The Pins tab (src/server/pins.ts, /api/admin/pins/, docs/decisions/pinterest.md): the Pinterest link, how often pins
// go out, and the queue of pins and clips the "Pins" GitHub workflow made from the 3D figures. The weekly job is a
// look down the new ones and Approve all; everything else runs on its own.
import { useCallback, useEffect, useState } from "react";

import { InlineSwitch } from "@/components/app/ui";

import { Card } from "./charts";

type Status = "review" | "ready" | "posting" | "processing" | "posted" | "failed" | "skipped";
interface Pin {
  id: string;
  exercise: string;
  kind: "image" | "video";
  title: string;
  description: string;
  link: string;
  board: string;
  media_url: string;
  cover_url: string;
  status: Status;
  created_at: number;
  posted_at: number | null;
  pin_id: string | null;
  error: string;
}
interface Settings {
  perDay: number;
  video: boolean;
  review: boolean;
  paused: boolean;
  sandbox: boolean;
}
interface Data {
  counts: Record<Status, number>;
  pins: Pin[];
  settings: Settings;
  pinterest: { configured: boolean; connected: boolean; user: string; sandbox: boolean; expires: number };
  now: number;
}

const LABEL: Record<Status, string> = {
  review: "Waiting for a look",
  ready: "Queued",
  posting: "Sending",
  processing: "Pinterest is processing the video",
  posted: "Posted",
  failed: "Failed",
  skipped: "Skipped",
};
const VIEWS = [
  ["review", "Waiting for a look"],
  ["ready", "Queued"],
  ["failed", "Failed"],
  ["posted", "Posted"],
] as const;
type ViewKey = (typeof VIEWS)[number][0];

async function fetchQueue(): Promise<Data | null> {
  const r = await fetch("/api/admin/pins/").catch(() => null);
  return r?.ok ? ((await r.json()) as Data) : null;
}

const day = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

export function Pins({ admin }: { admin: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [view, setView] = useState<ViewKey>("review");
  const [msg, setMsg] = useState<string | null>(() => {
    if (typeof location === "undefined") return null;
    const r = new URLSearchParams(location.search).get("pinterest");
    return r === "connected" ? "Pinterest is connected." : r;
  });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await fetchQueue();
    if (d) setData(d);
    else setMsg("The queue didn't load. Try again in a moment.");
  }, []);
  useEffect(() => {
    let live = true;
    void fetchQueue().then((d) => {
      if (!live) return;
      if (d) setData(d);
      else setMsg("The queue didn't load. Try again in a moment.");
    });
    return () => {
      live = false;
    };
  }, []);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(`${action}:${String(extra.id ?? "")}`);
    try {
      const r = await fetch("/api/admin/pins/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string; url?: string; status?: Status; changed?: number };
      if (!r.ok) setMsg(j.error ?? "That didn't work.");
      else if (j.url) location.assign(j.url);
      else {
        if (action === "post") setMsg(j.status === "posted" ? "Posted." : `Now: ${LABEL[j.status ?? "failed"]}.`);
        else if (action === "approveAll") setMsg(`${j.changed ?? 0} approved.`);
        else setMsg(null);
        await load();
      }
    } finally {
      setBusy(null);
    }
  };

  if (!data)
    return (
      <p role="status" className="text-sm text-muted">
        {msg ?? "Loading the queue…"}
      </p>
    );
  const { counts, settings: s, pinterest: p } = data;
  const queued = counts.ready + (s.review ? 0 : counts.review);
  const shown = data.pins.filter((x) =>
    view === "posted"
      ? x.status === "posted" || x.status === "skipped"
      : view === "failed"
        ? x.status === "failed" || x.status === "posting" || x.status === "processing"
        : x.status === view,
  );
  const save = (next: Partial<Settings>) => void act("settings", { settings: next });

  return (
    <div className="space-y-4">
      {msg && (
        <p role="status" className="card px-4 py-3 text-sm">
          {msg}
        </p>
      )}
      <Card
        title="Pinterest"
        subtitle="Each exercise becomes a tall pin and a 15-second clip from its 3D figure, with three form cues and a link to its page. They post at a steady pace on a board per muscle group."
      >
        {!p.configured ? (
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Make a free Pinterest business account for Liftsmith, then an app on developers.pinterest.com.</li>
            <li>
              In the app, add the redirect address <code className="text-ink">https://www.getliftsmith.com/api/admin/pins/callback/</code>.
            </li>
            <li>
              Put its App ID and secret in Vercel as PINTEREST_APP_ID and PINTEREST_APP_SECRET, then come back here and press Connect.
            </li>
          </ol>
        ) : p.connected ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>
              Connected{p.user ? ` as @${p.user}` : ""}
              {p.sandbox ? " (sandbox: only you see these pins)" : ""}. Sign-in lasts until {day(p.expires)}.
            </span>
            {admin && (
              <button type="button" className="press rounded-lg border border-line px-3 py-1.5" onClick={() => void act("disconnect")}>
                Disconnect
              </button>
            )}
          </div>
        ) : (
          admin && (
            <button type="button" className="press rounded-lg btn-primary px-3 py-1.5 font-semibold" onClick={() => void act("connect")}>
              Connect Pinterest
            </button>
          )
        )}
      </Card>

      <Card title="Posting" subtitle={`${queued} queued: enough for ${Math.floor(queued / s.perDay)} days at this pace.`}>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3">
            <span>Pins a day</span>
            <select
              disabled={!admin}
              value={s.perDay}
              onChange={(e) => save({ perDay: Number(e.target.value) })}
              className="card px-2 py-1.5"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <InlineSwitch label="Pause posting" on={s.paused} onChange={(v) => admin && save({ paused: v })} />
          <InlineSwitch
            label="Look before they post"
            hint="New pins wait here for Approve. Off sends them straight to the queue."
            on={s.review}
            onChange={(v) => admin && save({ review: v })}
          />
          <InlineSwitch label="Post the clips as video pins" on={s.video} onChange={(v) => admin && save({ video: v })} />
          <InlineSwitch
            label="Sandbox"
            hint="For a Pinterest app on Trial access: pins go to Pinterest's sandbox, where only you see them, and clips wait. Connect again after changing it."
            on={s.sandbox}
            onChange={(v) => admin && save({ sandbox: v })}
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Show">
        {VIEWS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={view === k}
            onClick={() => setView(k)}
            className={`press rounded-full border px-3 py-1.5 text-sm ${view === k ? "border-accent text-ink" : "border-line text-muted"}`}
          >
            {label} ({k === "posted" ? counts.posted : k === "failed" ? counts.failed + counts.posting + counts.processing : counts[k]})
          </button>
        ))}
        {admin && view === "review" && counts.review > 0 && (
          <button
            type="button"
            disabled={!!busy}
            className="press ml-auto rounded-lg btn-primary px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
            onClick={() => void act("approveAll")}
          >
            Approve all {counts.review}
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="card px-4 py-6 text-center text-sm text-muted">
          {view === "review"
            ? "Nothing waiting. The Pins workflow makes the next batch every Monday (or run it from GitHub › Actions › Pins)."
            : "Nothing here yet."}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((pin) => (
            <PinCard key={pin.id} pin={pin} admin={admin} busy={busy} act={act} sandbox={s.sandbox} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PinCard({
  pin,
  admin,
  busy,
  act,
  sandbox,
}: {
  pin: Pin;
  admin: boolean;
  busy: string | null;
  act: (a: string, x?: Record<string, unknown>) => Promise<void>;
  sandbox: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(pin.title);
  const [description, setDescription] = useState(pin.description);
  const open = pin.status === "review" || pin.status === "ready" || pin.status === "failed";
  const go = (a: string, x: Record<string, unknown> = {}) => void act(a, { id: pin.id, ...x });
  return (
    <li className="card flex flex-col gap-3 p-3">
      <div className="flex gap-3">
        <div className="w-28 shrink-0 overflow-hidden rounded-lg bg-black/30">
          {pin.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pin.media_url} alt={`Pin for ${pin.exercise}`} loading="lazy" className="block w-full" />
          ) : (
            <video src={pin.media_url} poster={pin.cover_url} controls muted playsInline preload="none" className="block w-full">
              <track kind="captions" />
            </video>
          )}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {pin.kind === "image" ? "Pin" : "Clip"} · {pin.board}
          </p>
          <p className="mt-1 font-semibold">{pin.title}</p>
          <p className="mt-1 text-xs text-muted">
            {LABEL[pin.status]}
            {pin.posted_at ? ` ${day(pin.posted_at)}` : ""}
          </p>
          {pin.error && <p className="mt-1 text-xs text-bad">{pin.error}</p>}
          {pin.pin_id && (
            <a
              className="mt-1 inline-block text-xs text-accent underline"
              href={`https://www.pinterest.com/pin/${pin.pin_id}/`}
              target="_blank"
              rel="noreferrer"
            >
              Open on Pinterest
            </a>
          )}
        </div>
      </div>
      {editing ? (
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex flex-col gap-1">
            Title
            <input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} className="card px-2 py-1.5 text-ink" />
          </label>
          <label className="flex flex-col gap-1">
            Description
            <textarea
              value={description}
              maxLength={500}
              rows={5}
              onChange={(e) => setDescription(e.target.value)}
              className="card px-2 py-1.5 text-ink"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="press rounded-lg btn-primary px-3 py-1.5 font-semibold"
              onClick={() => {
                go("edit", { title, description });
                setEditing(false);
              }}
            >
              Save
            </button>
            <button type="button" className="press rounded-lg border border-line px-3 py-1.5" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 text-sm">
          {admin && pin.status === "review" && (
            <button type="button" className="press rounded-lg btn-primary px-3 py-1.5 font-semibold" onClick={() => go("approve")}>
              Approve
            </button>
          )}
          {admin && pin.status === "failed" && (
            <button type="button" className="press rounded-lg btn-primary px-3 py-1.5 font-semibold" onClick={() => go("retry")}>
              Try again
            </button>
          )}
          {admin && open && !(sandbox && pin.kind === "video") && (
            <button
              type="button"
              disabled={!!busy}
              className="press rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
              onClick={() => go("post")}
            >
              {busy === `post:${pin.id}` ? "Posting…" : "Post now"}
            </button>
          )}
          {admin && open && (
            <button type="button" className="press rounded-lg border border-line px-3 py-1.5" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
          {admin && open && (
            <button type="button" className="press rounded-lg border border-line px-3 py-1.5" onClick={() => go("skip")}>
              Skip
            </button>
          )}
          <a className="press rounded-lg border border-line px-3 py-1.5" href={pin.media_url} download>
            Download
          </a>
        </div>
      )}
    </li>
  );
}
