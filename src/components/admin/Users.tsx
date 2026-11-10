"use client";

// The admin Users tab (as in Gradelings' Users): search accounts by email or id, open one to see how it signs in,
// its devices and how much it has synced (counts only, never the lifter's data), keep private staff notes, and,
// for admins, sign it out everywhere or delete it. Plus the CSV downloads.
import { useCallback, useEffect, useState } from "react";

import type { AccountDetail, AccountRow } from "@/server/adminUsers";

import { Card, fmtInt, Table, Tile } from "./charts";
import { ago, when } from "./time";

const PROVIDER: Record<string, string> = { google: "Google", apple: "Apple", email: "Email code" };
const providers = (p: string[]) => p.map((x) => PROVIDER[x] ?? x).join(", ") || "—";
const kb = (b: number) => (b < 1024 ? `${b} B` : b < 1_048_576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1_048_576).toFixed(1)} MB`);

async function post(body: Record<string, unknown>): Promise<string | null> {
  const r = await fetch("/api/admin/users/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  return r.ok ? null : (j.error ?? "That didn't work.");
}

function Account({ id, admin, me, close }: { id: string; admin: boolean; me: string; close: () => void }) {
  const [a, setA] = useState<AccountDetail | null | "missing">(null);
  const [version, setVersion] = useState(0);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/admin/users/?id=${encodeURIComponent(id)}`)
      .then(async (r) => live && setA(r.ok ? ((await r.json()) as { account: AccountDetail }).account : "missing"))
      .catch(() => live && setA("missing"));
    return () => {
      live = false;
    };
  }, [id, version]);
  const act = async (body: Record<string, unknown>, done: string) => {
    const err = await post(body);
    setMsg(err ?? done);
    if (!err) setVersion((v) => v + 1);
    return !err;
  };
  if (a === null) return <Card title="Account">Loading…</Card>;
  if (a === "missing")
    return (
      <Card title="Account" right={<CloseButton close={close} />}>
        <p className="text-sm text-muted">No account with that id. It may have been deleted.</p>
      </Card>
    );
  return (
    <Card title={a.email ?? "Account without an email"} subtitle={`Account ${a.id}`} right={<CloseButton close={close} />}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Signed up" value={when(a.createdAt)} />
        <Tile label="Last seen" value={ago(a.lastSeen)} />
        <Tile label="Synced events" value={fmtInt(a.sync.events)} sub={`${kb(a.sync.bytes)}, ${fmtInt(a.sync.deleted)} deleted`} />
        <Tile label="Pro on the account" value={a.pro ? "Yes (review)" : "No"} sub="Store purchases are per install" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">Sign-in methods</h3>
      <Table
        columns={["Method", "Email", "Added"]}
        rows={a.identities.map((i) => [PROVIDER[i.provider] ?? i.provider, i.email ?? "—", when(i.createdAt)])}
        empty="No sign-in methods."
      />
      <h3 className="mt-4 text-sm font-semibold">Devices signed in</h3>
      <Table
        columns={["Platform", "Signed in", "Last used", "Expires"]}
        rows={a.sessions.map((s) => [s.platform ?? "—", when(s.createdAt), ago(s.lastSeen), when(s.expiresAt)])}
        empty="Not signed in on any device."
      />
      <p className="mt-3 text-sm text-muted">
        Synced: {fmtInt(a.sync.events)} events
        {a.sync.firstAt ? ` from ${when(a.sync.firstAt)} to ${when(a.sync.lastAt ?? a.sync.firstAt)}` : ""}, profile and{" "}
        {fmtInt(a.sync.gyms)} {a.sync.gyms === 1 ? "gym" : "gyms"}. What was synced is never shown here.
      </p>

      <h3 className="mt-4 text-sm font-semibold">Private notes</h3>
      <p className="text-xs text-muted">Only staff see these. Nothing about the lifter&apos;s health or training.</p>
      <ul className="mt-2 space-y-2">
        {a.notes.map((n) => (
          <li key={n.id} className="rounded-lg border border-line p-2 text-sm">
            <p className="whitespace-pre-wrap">{n.text}</p>
            <p className="mt-1 text-xs text-muted">
              {n.author}, {ago(n.at)}
              {(admin || n.author === me) && (
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => void act({ action: "unnote", noteId: n.id }, "Note removed.")}
                >
                  Remove
                </button>
              )}
            </p>
          </li>
        ))}
      </ul>
      <label className="mt-2 block text-sm" htmlFor="account-note">
        Add a note
      </label>
      <textarea
        id="account-note"
        value={note}
        maxLength={1000}
        onChange={(e) => setNote(e.target.value)}
        className="card mt-1 w-full p-2 text-sm"
        rows={2}
      />
      <button
        type="button"
        disabled={!note.trim()}
        onClick={() => void act({ action: "note", id: a.id, text: note }, "Note saved.").then((ok) => ok && setNote(""))}
        className="press mt-1 rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-50"
      >
        Save note
      </button>

      {admin && (
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <button
            type="button"
            className="press rounded-lg border border-line px-3 py-1.5 text-sm"
            onClick={() => void act({ action: "signout", id: a.id }, "Signed out on every device. Their data stays on the devices.")}
          >
            Sign out everywhere
          </button>
          <div>
            <label htmlFor="delete-confirm" className="block text-xs text-muted">
              Delete the account and everything synced to it: type DELETE
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="delete-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="card w-32 px-2 py-1.5 text-sm"
                autoComplete="off"
              />
              <button
                type="button"
                disabled={confirm !== "DELETE"}
                className="press rounded-lg bg-bad px-3 py-1.5 text-sm font-semibold text-bg disabled:opacity-50"
                onClick={() =>
                  void post({ action: "delete", id: a.id, confirm }).then((err) => {
                    setMsg(err);
                    if (!err) close();
                  })
                }
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
      {msg && (
        <p role="status" className="mt-3 text-sm text-muted">
          {msg}
        </p>
      )}
    </Card>
  );
}

function CloseButton({ close }: { close: () => void }) {
  return (
    <button type="button" onClick={close} className="press rounded-lg border border-line px-3 py-1 text-sm text-muted">
      Close
    </button>
  );
}

export function Users({
  admin,
  me,
  open,
  setOpen,
}: {
  admin: boolean;
  me: string;
  open: string | null;
  setOpen: (id: string | null) => void;
}) {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<{ accounts: AccountRow[]; totals: { total: number; new30: number; active30: number } } | null>(null);
  const load = useCallback((term: string) => {
    fetch(`/api/admin/users/?q=${encodeURIComponent(term)}`)
      .then(async (r) => r.ok && setData(await r.json()))
      .catch(() => {});
  }, []);
  useEffect(() => load(search), [load, search, open]);
  return (
    <div className="space-y-4">
      {open && <Account id={open} admin={admin} me={me} close={() => setOpen(null)} />}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <Tile label="Accounts" value={fmtInt(data.totals.total)} />
          <Tile label="New in 30 days" value={fmtInt(data.totals.new30)} />
          <Tile label="Seen in 30 days" value={fmtInt(data.totals.active30)} />
        </div>
      )}
      <Card title="Accounts" subtitle="An account exists only for sync. Most lifters never make one, so installs are under Installs.">
        <form
          className="mb-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q);
          }}
        >
          <label htmlFor="user-search" className="sr-only">
            Search by email or account id
          </label>
          <input
            id="user-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email or account id"
            className="card w-full max-w-md px-3 py-2 text-sm"
          />
          <button type="submit" className="press rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink">
            Search
          </button>
        </form>
        {!data ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <Table
            columns={["Email", "Signed up", "Last seen", "Sign-in", "Devices", "Synced events", ""]}
            rows={data.accounts.map((a) => [
              a.email ?? "—",
              when(a.createdAt),
              ago(a.lastSeen),
              providers(a.providers),
              a.devices,
              fmtInt(a.events),
              <button key={a.id} type="button" className="text-xs text-accent underline" onClick={() => setOpen(a.id)}>
                Open
              </button>,
            ])}
            empty={search ? "No account matches." : "No accounts yet."}
          />
        )}
      </Card>
      {admin && (
        <Card
          title="Downloads"
          subtitle="CSV files. No synced data, health readings or anything a lifter typed. Each download is in the log."
        >
          <div className="flex flex-wrap gap-2 text-sm">
            {(
              [
                ["accounts", "Accounts"],
                ["installs", "Installs"],
                ["subscriptions", "Subscription events"],
              ] as const
            ).map(([type, label]) => (
              <a key={type} href={`/api/admin/export/?type=${type}`} className="press rounded-lg border border-line px-3 py-1.5">
                Download {label.toLowerCase()} CSV
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
