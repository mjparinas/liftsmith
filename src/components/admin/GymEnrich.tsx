"use client";

// Admin › Gyms: fill in missing details from each gym's own website (src/server/gymEnrich.ts, docs/decisions/gyms.md
// "More details per gym"). It asks the server for one batch after another (each batch reads a couple of dozen sites,
// several at once), shows what was filled in and why a site was skipped, and can be stopped; a gym already read this
// month is passed over, so running it again carries on where it stopped.
import { useRef, useState } from "react";

import type { EnrichBatch, EnrichOne } from "@/server/gymEnrich";

import { Card } from "./charts";

const FIELD: Record<string, string> = {
  phone: "phone",
  email: "email",
  hours: "hours",
  address: "address",
  postcode: "postcode",
  instagram: "Instagram",
  facebook: "Facebook",
};

export function GymEnrich({ admin, changed }: { admin: boolean; changed: () => void }) {
  const [running, setRunning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [done, setDone] = useState<EnrichOne[]>([]);
  const [left, setLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stop = useRef(false);

  const start = async () => {
    stop.current = false;
    setRunning(true);
    setError(null);
    setDone([]);
    const all: EnrichOne[] = [];
    while (!stop.current) {
      const r = await fetch("/api/admin/gym-places/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enrich" }),
      }).catch(() => null);
      const j = r?.ok ? ((await r.json().catch(() => null)) as EnrichBatch | null) : null;
      if (!j) {
        setError(r ? `The admin server answered ${r.status}.` : "The admin server didn't answer.");
        break;
      }
      all.push(...j.done);
      setDone([...all]);
      setLeft(j.left);
      changed();
      if (!j.done.length || j.left === 0) break;
    }
    setRunning(false);
    setStopping(false);
  };

  const filled = done.filter((d) => d.filled.length);
  const count = (f: string) => done.filter((d) => d.filled.includes(f as EnrichOne["filled"][number])).length;

  return (
    <Card
      title="Fill in details from gym websites"
      subtitle="Hours, phone, email, address, postcode and social pages the map doesn't have."
    >
      <p className="text-sm text-muted">
        Reads the home page of each unclaimed gym that has a website and is missing something: its structured data first, then its phone,
        email and social links. Only empty fields are filled, a claimed gym is never touched, and a gym is read at most once a month.
        Directory and map sites are never read.
      </p>
      {admin && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {running ? (
            <button
              type="button"
              onClick={() => {
                stop.current = true;
                setStopping(true);
              }}
              className="press rounded-lg border border-line px-3 py-1.5 text-muted"
            >
              {stopping ? "Stopping…" : "Stop"}
            </button>
          ) : (
            <button type="button" onClick={() => void start()} className="press rounded-lg border border-line px-3 py-1.5">
              Fill in from websites
            </button>
          )}
          {done.length > 0 && (
            <span className="text-muted" role="status">
              {running ? "Reading… " : ""}
              {done.length} read, {filled.length} filled in{left !== null ? `, ${left} left` : ""}
            </span>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
      {filled.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          {Object.keys(FIELD)
            .map((f) => [FIELD[f], count(f)] as const)
            .filter(([, n]) => n)
            .map(([label, n]) => `${n} ${label}`)
            .join(", ")}
        </p>
      )}
      {done.length > 0 && (
        <ul className="mt-2 max-h-48 overflow-y-auto text-xs text-faint">
          {[...done].reverse().map((d) => (
            <li key={d.id}>
              {d.name}: {d.filled.length ? `filled ${d.filled.map((f) => FIELD[f]).join(", ")}` : d.skipped} ({(d.ms / 1000).toFixed(1)} s)
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
