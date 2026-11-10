"use client";

// Maintenance mode in the admin panel (Gradelings' Maintenance.tsx): the switch on the System tab (TURN ON typed to
// switch on; off needs no typing) and the banner every tab shows while it's on.
import { useCallback, useEffect, useState } from "react";

import { ago } from "./time";

type State = { on: boolean; since: number | null; by: string | null };

/** The switch's state, re-read every 30 seconds and whenever `version` changes. */
export function useMaintenance(): [State | null, () => void] {
  const [state, setState] = useState<State | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    const read = () =>
      fetch("/api/admin/maintenance/")
        .then(async (r) => r.ok && live && setState((await r.json()) as State))
        .catch(() => {});
    void read();
    const t = setInterval(() => void read(), 30_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [version]);
  return [state, useCallback(() => setVersion((v) => v + 1), [])];
}

async function put(on: boolean, confirm?: string): Promise<string | null> {
  const r = await fetch("/api/admin/maintenance/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ on, confirm }),
  });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  return r.ok ? null : (j.error ?? "That didn't work.");
}

export function MaintenanceBanner({ state, admin, changed }: { state: State | null; admin: boolean; changed: () => void }) {
  if (!state?.on) return null;
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-warn bg-warn/15 px-4 py-2 text-sm">
      <strong>Maintenance mode is on.</strong>
      <span className="text-muted">
        The website and API answer 503{state.since ? `, since ${ago(state.since)}` : ""}
        {state.by ? ` (${state.by})` : ""}. The apps keep working offline.
      </span>
      {admin && (
        <button
          type="button"
          className="press ml-auto rounded-lg bg-accent px-3 py-1 font-semibold text-accent-ink"
          onClick={() => void put(false).then(changed)}
        >
          Turn off maintenance mode
        </button>
      )}
    </div>
  );
}

export function MaintenanceCard({ state, admin, changed }: { state: State | null; admin: boolean; changed: () => void }) {
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <section className="card p-4">
      <h2 className="font-semibold">Maintenance mode</h2>
      <p className="mt-0.5 text-xs text-muted">
        While it&apos;s on, every page but the home page, privacy policy, account deletion and the web app answers 503, and so does the API
        (sync and usage stats wait on the device). This panel, sign-in to it, the store webhook, scheduled jobs, reminder links and the
        health check keep working. It takes up to 15 seconds to reach every server.
      </p>
      {!state ? (
        <p className="mt-2 text-sm text-muted">Loading…</p>
      ) : state.on ? (
        <p className="mt-2 text-sm">
          <strong>On</strong>
          {state.since ? ` since ${ago(state.since)}` : ""}. Turn it off from the banner above.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm">
            <strong>Off.</strong>
          </p>
          {admin && (
            <div className="mt-2 flex flex-wrap items-end gap-2 text-sm">
              <label htmlFor="maintenance-confirm" className="block">
                <span className="block text-xs text-muted">Type TURN ON to switch it on</span>
                <input
                  id="maintenance-confirm"
                  value={confirm}
                  autoComplete="off"
                  onChange={(e) => setConfirm(e.target.value)}
                  className="card mt-1 w-36 px-2 py-1.5"
                />
              </label>
              <button
                type="button"
                disabled={confirm !== "TURN ON"}
                className="press rounded-lg bg-warn px-3 py-1.5 font-semibold text-bg disabled:opacity-50"
                onClick={() =>
                  void put(true, confirm).then((err) => {
                    setMsg(err);
                    setConfirm("");
                    changed();
                  })
                }
              >
                Turn on maintenance mode
              </button>
            </div>
          )}
        </>
      )}
      {msg && (
        <p role="status" className="mt-2 text-sm text-bad">
          {msg}
        </p>
      )}
    </section>
  );
}
