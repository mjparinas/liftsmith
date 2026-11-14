"use client";

// The admin Users tab (as in Gradelings' Users): search accounts by email or id, open one to see how it signs in,
// its devices and how much it has synced (counts only, never the lifter's data), keep private staff notes, and,
// for admins, sign it out everywhere, reset it or delete it. Its Friends standing and reports, and the moderation
// actions, are in Moderation.tsx (docs/decisions/moderation.md). Plus the CSV downloads.
import { useCallback, useEffect, useState } from "react";

import type { AccountDetail, AccountRow, CoachTotals, Role, UserFilter, UserSort } from "@/server/adminUsers";
import type { ModerationDetail } from "@/server/socialModeration";

import { Card, fmtInt, Table, Tile } from "./charts";
import { Badge, Moderation, STATE_NAME, stateTone } from "./Moderation";
import { SchoolCoaches } from "./SchoolCoaches";
import { LineBones, Loading, TableBones, TileBones } from "./Skeletons";
import { ago, when } from "./time";

const PROVIDER: Record<string, string> = { google: "Google", apple: "Apple", email: "Email code" };
const providers = (p: string[]) => p.map((x) => PROVIDER[x] ?? x).join(", ") || "—";
const ROLE_NAME: Record<Role, string> = { lifter: "Lifter", coach: "Coach", client: "Client", both: "Coach and client" };
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

function Account({
  id,
  admin,
  me,
  close,
  openAccount,
}: {
  id: string;
  admin: boolean;
  me: string;
  close: () => void;
  openAccount: (id: string) => void;
}) {
  const [a, setA] = useState<AccountDetail | null | "missing">(null);
  const [m, setM] = useState<ModerationDetail | null>(null);
  const [version, setVersion] = useState(0);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetName, setResetName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/admin/users/?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (!live) return;
        if (!r.ok) return setA("missing");
        const j = (await r.json()) as { account: AccountDetail; moderation?: ModerationDetail };
        setA(j.account);
        setM(j.moderation ?? null);
      })
      .catch(() => live && setA("missing"));
    return () => {
      live = false;
    };
  }, [id, version]);
  const act = async (body: Record<string, unknown>, done: string) => {
    const err = await post({ id, ...body });
    setMsg(err ?? done);
    if (!err) setVersion((v) => v + 1);
    return !err;
  };
  if (a === null)
    return (
      <Card title="Account">
        <Loading label="Loading account" className="space-y-4">
          <TileBones />
          <LineBones n={5} />
        </Loading>
      </Card>
    );
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

      {m && <Moderation m={m} admin={admin} act={act} openAccount={openAccount} />}

      {admin && (
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <button
            type="button"
            className="press rounded-lg border border-line px-3 py-1.5 text-sm"
            onClick={() => void act({ action: "signout", id: a.id }, "Signed out on every device. Their data stays on the devices.")}
          >
            Sign out everywhere
          </button>
          <button
            type="button"
            className="press rounded-lg border border-bad/60 px-3 py-1.5 text-sm text-bad"
            onClick={() => setResetting(true)}
          >
            Reset account
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
      {admin && resetting && (
        <ResetDialog
          name={a.handle ?? a.email ?? a.id}
          value={resetName}
          onChange={setResetName}
          onCancel={() => {
            setResetting(false);
            setResetName("");
          }}
          onReset={() =>
            void act(
              { action: "reset", confirm: resetName },
              "Account reset. Everything they made is cleared, their devices are signed out and wiped, and their sign-in and Pro stay.",
            ).then((ok) => {
              if (ok) {
                setResetting(false);
                setResetName("");
              }
            })
          }
        />
      )}
      {msg && (
        <p role="status" className="mt-3 text-sm text-muted">
          {msg}
        </p>
      )}
    </Card>
  );
}

/**
 * "Are you sure?" for Reset account (Melvin, 2026-11-14: "forces you to type their username correctly"): the button
 * waits until their Friends handle (or their email, without one) is typed exactly. The server checks it too.
 */
function ResetDialog({
  name,
  value,
  onChange,
  onCancel,
  onReset,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onReset: () => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        aria-describedby="reset-body"
        className="card w-full max-w-md bg-bg p-5"
      >
        <h2 id="reset-title" className="text-lg font-bold">
          Reset this account?
        </h2>
        <div id="reset-body" className="mt-2 space-y-2 text-sm">
          <p>
            This clears everything they made: workouts, body data and settings, shared links, Friends, coaching links and chats, shared gym
            setups and connected apps. It can&apos;t be undone.
          </p>
          <p className="text-muted">
            Kept: the account and how they sign in, staff notes, and everything that pays for or proves Pro (store purchases, a web
            subscription, coach payments, earned Pro, school teams, gyms they own). Every device is signed out and wiped, so old data
            can&apos;t sync back. A Friends ban or suspension stays.
          </p>
        </div>
        <label htmlFor="reset-confirm" className="mt-4 block text-sm">
          Type <span className="font-mono font-semibold">{name}</span> to confirm
        </label>
        <input
          id="reset-confirm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="card mt-1 w-full px-2 py-1.5 font-mono text-sm"
          autoComplete="off"
          spellCheck={false}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- the dialog's one field, opened by the admin on purpose
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="press rounded-lg border border-line px-3 py-1.5 text-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            disabled={value !== name}
            className="press rounded-lg bg-bad px-3 py-1.5 text-sm font-semibold text-bg disabled:opacity-50"
            onClick={onReset}
          >
            Reset account
          </button>
        </div>
      </div>
    </div>
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
  initialQuery = "",
}: {
  admin: boolean;
  me: string;
  open: string | null;
  setOpen: (id: string | null) => void;
  /** A search to start with, from the header's search box. */
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery);
  const [filter, setFilter] = useState<UserFilter>("all");
  const [sort, setSort] = useState<UserSort>("newest");
  const [data, setData] = useState<{
    accounts: AccountRow[];
    totals: { total: number; new30: number; active30: number } & Partial<CoachTotals>;
  } | null>(null);
  const load = useCallback((term: string, f: UserFilter, so: UserSort) => {
    fetch(`/api/admin/users/?q=${encodeURIComponent(term)}&filter=${f}&sort=${so}`)
      .then(async (r) => r.ok && setData(await r.json()))
      .catch(() => {});
  }, []);
  useEffect(() => load(search, filter, sort), [load, search, filter, sort, open]);
  return (
    <div className="space-y-4">
      {open && <Account key={open} id={open} admin={admin} me={me} close={() => setOpen(null)} openAccount={setOpen} />}
      {!open && <SchoolCoaches admin={admin} />}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <Tile label="Accounts" value={fmtInt(data.totals.total)} />
          <Tile label="New in 30 days" value={fmtInt(data.totals.new30)} />
          <Tile label="Seen in 30 days" value={fmtInt(data.totals.active30)} />
        </div>
      )}
      {data && data.totals.coaches != null && (
        <div className="grid grid-cols-3 gap-3">
          <Tile
            label="Coaches"
            value={fmtInt(data.totals.coaches)}
            sub={`${fmtInt(data.totals.coachesFromPage ?? 0)} from the coaches page, ${fmtInt(data.totals.coachesNew ?? 0)} new in 30 days`}
          />
          <Tile label="Coaches with clients" value={fmtInt(data.totals.coachesWithClients ?? 0)} />
          <Tile label="Clients" value={fmtInt(data.totals.clients ?? 0)} sub={`${fmtInt(data.totals.clientsNew ?? 0)} new in 30 days`} />
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
            Search by email, Friends handle or account id
          </label>
          <input
            id="user-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email, @handle or account id"
            className="card w-full max-w-md px-3 py-2 text-sm"
          />
          <button type="submit" className="press rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink">
            Search
          </button>
        </form>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Show" className="flex flex-wrap gap-1">
            {(
              [
                ["all", "Everyone"],
                ["reported", "Reported"],
                ["actioned", "Banned, suspended or limited"],
                ["teens", "Under 18"],
              ] as const
            ).map(([f, label]) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`press rounded-full border px-3 py-1 text-sm ${filter === f ? "border-accent bg-accent/15 text-accent" : "border-line text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label htmlFor="user-sort" className="ml-auto text-sm text-muted">
            Sort
          </label>
          <select id="user-sort" value={sort} onChange={(e) => setSort(e.target.value as UserSort)} className="card px-2 py-1 text-sm">
            <option value="newest">Newest</option>
            <option value="reports">Most reported</option>
            <option value="seen">Last seen</option>
          </select>
        </div>
        {!data ? (
          <Loading label="Loading accounts">
            <TableBones />
          </Loading>
        ) : (
          <Table
            columns={["Email", "Friends", "Reports", "Role", "Signed up", "Last seen", "Sign-in", "Devices", "Synced events", ""]}
            rows={data.accounts.map((a) => [
              a.email ?? "—",
              a.handle ? (
                <span key="f" className="flex flex-wrap items-center gap-1">
                  @{a.handle}
                  {a.state !== "ok" && <Badge tone={stateTone(a.state)}>{STATE_NAME[a.state]}</Badge>}
                  {a.minor && <Badge tone="warn">Under 18</Badge>}
                </span>
              ) : a.minor ? (
                <Badge key="f" tone="warn">
                  Under 18
                </Badge>
              ) : (
                "—"
              ),
              a.reports ? (
                <span key="r">
                  {a.openReports ? <Badge tone="bad">{`${fmtInt(a.openReports)} waiting`}</Badge> : null} {fmtInt(a.reports ?? 0)} in all
                </span>
              ) : (
                "—"
              ),
              ROLE_NAME[a.role],
              when(a.createdAt),
              ago(a.lastSeen),
              providers(a.providers),
              a.devices,
              fmtInt(a.events),
              <button key={a.id} type="button" className="text-xs text-accent underline" onClick={() => setOpen(a.id)}>
                Open
              </button>,
            ])}
            empty={search || filter !== "all" ? "No account matches." : "No accounts yet."}
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
