"use client";

// Posters and table stands to print and mail (docs/decisions/gyms.md, step 4), in the admin Gyms tab under the claims.
// An order comes from a gym in the app (its owner, or someone whose claim is waiting) or from Send posters on a gym
// below. Print opens the sheet: a letter with the gym's one-time claim code (unclaimed gyms), the poster and two stand
// inserts. Then mark it printed and shipped. Support staff can read; only admins print or change an order.
import { useEffect, useState } from "react";

import type { PosterAction, PosterRow } from "@/server/gymPosters";

import { Card } from "./charts";
import { ago } from "./time";

const ITEMS: Record<PosterRow["items"], string> = { both: "Poster and stand", poster: "Poster", stand: "Stand" };
const LANG: Record<string, string> = { en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian", ja: "Japanese" };

export function GymPosters({ admin, version }: { admin: boolean; version: number }) {
  const [rows, setRows] = useState<PosterRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/gym-posters/")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as { orders: PosterRow[] };
        if (live) setRows(j.orders);
      })
      .catch(() => live && setError("The poster orders didn't load."));
    return () => {
      live = false;
    };
  }, [version, mine]);
  const act = async (o: PosterRow, action: PosterAction) => {
    const r = await fetch("/api/admin/gym-posters/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: o.id, action }),
    });
    if (!r.ok) setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "That didn't work.");
    setMine((v) => v + 1);
  };
  const open = rows?.filter((o) => o.status === "requested" || o.status === "printed") ?? [];
  const done = rows?.filter((o) => o.status === "shipped" || o.status === "cancelled") ?? [];
  const toPrint = open.filter((o) => o.status === "requested").length;
  const button = "press rounded-lg border border-line px-3 py-1.5 text-muted";
  return (
    <Card title="Posters and stands" subtitle={rows ? `${toPrint} to print, ${open.length - toPrint} to mail` : undefined}>
      <p className="text-sm text-muted">
        Print opens the sheet for the order: a letter for the envelope (with the gym&apos;s one-time claim code when nobody has claimed it),
        the poster, and two 4 × 6 in inserts for a table stand. The QR code opens the gym&apos;s page and counts the scan. Mark it printed,
        then shipped once it&apos;s in the mail; shipping forgets the code here, and the gym keeps only a hash of it.
      </p>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
      {rows === null ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : open.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing to print or mail.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {open.map((o) => (
            <li key={o.id} className="flex flex-wrap items-start gap-3 py-3">
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold break-words">
                  {o.placeName}
                  {o.official ? " ✓" : ""} · {ITEMS[o.items]} · {o.status === "requested" ? "to print" : "printed, to mail"}
                </p>
                <p className="break-words whitespace-pre-line">{[o.shipTo, o.address].filter(Boolean).join("\n")}</p>
                <p className="text-xs text-faint">
                  {o.fromGym ? "Asked for by the gym" : "Added by staff"} · {LANG[o.lang] ?? o.lang} · {ago(o.createdAt)}
                </p>
              </div>
              {admin && (
                <div className="flex flex-wrap gap-2 text-sm">
                  <a
                    href={`/api/admin/gym-posters/print/?id=${o.id}`}
                    target="_blank"
                    rel="noopener"
                    className="press rounded-lg border border-accent/50 px-3 py-1.5 text-accent"
                  >
                    Print
                  </a>
                  {o.status === "requested" && (
                    <button type="button" onClick={() => void act(o, "printed")} className={button}>
                      Printed
                    </button>
                  )}
                  <button type="button" onClick={() => void act(o, "shipped")} className={button}>
                    Shipped
                  </button>
                  <button type="button" onClick={() => void act(o, "cancel")} className={button}>
                    Cancel
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted">Last 60 days ({done.length})</summary>
          <ul className="mt-2 grid gap-1">
            {done.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-2 text-muted">
                <span>
                  {o.placeName}: {o.status === "shipped" ? `shipped ${ago(o.shippedAt)}` : "cancelled"} · {o.qrScans}{" "}
                  {o.qrScans === 1 ? "scan" : "scans"}
                </span>
                {admin && o.status === "cancelled" && (
                  <button type="button" onClick={() => void act(o, "reopen")} className="underline">
                    Reopen
                  </button>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
