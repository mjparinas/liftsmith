"use client";

// The admin panel (/admin/, server build only). Modelled on Gradelings' panel: one row of filters, tabs for
// each area, tiles for the headline numbers and charts below. Sign-in is an emailed one-time link.
import { useCallback, useEffect, useState } from "react";

import type { Metrics, StoreRevenue } from "@/lib/adminMetrics";
import { CODE_KINDS, type CodeKind } from "@/lib/creatorCode";
import { HOLD_DAYS, MIN_PAYOUT, STORE_FEE, type CreatorRow, type Payout } from "@/lib/creatorMetrics";

import { Automations } from "./Automations";
import { BingSearch } from "./BingSearch";
import { BarList, Card, CohortTable, fmtDay, fmtInt, fmtPct, fmtUsd, Funnel, LineChart, StackedBars, Table, Tile } from "./charts";
import { Experiments, Flags } from "./Flags";
import { Inbox } from "./Inbox";
import { InstallDetail } from "./InstallDetail";
import { Log } from "./Log";
import { MaintenanceBanner, useMaintenance } from "./Maintenance";
import { RunningCosts } from "./RunningCosts";
import { SearchConsole } from "./SearchConsole";
import { System } from "./System";
import { Todo } from "./Todo";
import { loadTwoFactor, TwoFactorGate, type TwoFactorInfo } from "./TwoFactor";
import { Users } from "./Users";

type Staff = { email: string; role: "admin" | "support" };
type Data = Metrics & { staff: Staff };
type Install = {
  id: string;
  firstSeen: number;
  lastSeen: number;
  platform: string;
  store: string | null;
  appVersion: string | null;
  device: string | null;
  os: string | null;
  country: string | null;
  locale: string | null;
  source: string | null;
  test: boolean;
  events: number;
  workouts: number;
};

const TABS = [
  "Overview",
  "To Do",
  "Inbox",
  "Traffic",
  "Acquisition",
  "Funnel",
  "Retention",
  "Engagement",
  "Devices",
  "Revenue",
  "Codes",
  "Users",
  "Installs",
  "Flags",
  "A/B Tests",
  "Automations",
  "System",
  "Log",
] as const;
type Tab = (typeof TABS)[number];
const PERIODS = [7, 28, 90, 365] as const;

/** Where the panel is: a tab, and an account (Users) or install (Installs) open on it. In the address as ?tab=&open=. */
type View = { tab: Tab; open: string | null };
const isTab = (t: string | null): t is Tab => t != null && (TABS as readonly string[]).includes(t);
function readView(): View {
  if (typeof location === "undefined") return { tab: "Overview", open: null };
  const q = new URLSearchParams(location.search);
  const t = q.get("tab");
  const tab = isTab(t) ? t : "Overview";
  const open = q.get("open");
  return { tab, open: open && /^[A-Za-z0-9_-]{8,64}$/.test(open) && (tab === "Users" || tab === "Installs") ? open : null };
}
export function viewUrl(v: View): string {
  const q = new URLSearchParams();
  if (v.tab !== "Overview") q.set("tab", v.tab);
  if (v.open) q.set("open", v.open);
  const s = q.toString();
  return `/admin/${s ? `?${s}` : ""}`;
}
const STORE_LABEL: Record<string, string> = {
  play: "Google Play",
  appstore: "App Store",
  web: "Web",
  other: "Other",
  android: "Android",
  ios: "iOS",
};
const delta = (a: number, b: number) => (b > 0 ? (a - b) / b : null);
const when = (t: number) => new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function SignIn() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(
    typeof location !== "undefined" && location.search.includes("link=expired")
      ? "That link has expired or was already used. Ask for a new one."
      : null,
  );
  const [dev, setDev] = useState<string | null>(null);
  const send = async () => {
    const r = await fetch("/api/admin/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = (await r.json().catch(() => ({}))) as { message?: string; error?: string; devLink?: string };
    setMsg(j.message ?? j.error ?? "Something went wrong.");
    setDev(j.devLink ?? null);
  };
  return (
    <main className="mx-auto max-w-sm px-5 py-20">
      <h1 className="text-2xl font-bold">Liftsmith admin</h1>
      <p className="mt-2 text-sm text-muted">We&apos;ll email you a link that signs you in once.</p>
      <label className="mt-6 block text-sm" htmlFor="admin-email">
        Email
      </label>
      <input
        id="admin-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="card mt-1 w-full px-4 py-3"
      />
      <button
        type="button"
        onClick={() => void send()}
        className="press mt-3 w-full rounded-2xl bg-accent px-5 py-3 font-semibold text-accent-ink"
      >
        Email me a link
      </button>
      {msg && (
        <p className="mt-4 text-sm text-muted" role="status">
          {msg}
        </p>
      )}
      {dev && (
        <a className="mt-2 block break-all text-sm text-accent" href={dev}>
          Development sign-in link
        </a>
      )}
    </main>
  );
}

function StoreTable({ rows, all, assumed }: { rows: StoreRevenue[]; all: StoreRevenue; assumed: Metrics["revenue"]["assumed"] }) {
  const cols = ["All", ...rows.map((r) => STORE_LABEL[r.store])];
  const xs = [all, ...rows];
  const line = (label: string, f: (r: StoreRevenue) => string, a?: string) => [label, ...xs.map(f), a ?? ""];
  return (
    <Table
      columns={["Measure", ...cols, "Forecast assumes"]}
      rows={[
        line("Downloads a week", (r) => String(r.downloadsPerWeek)),
        line("Setup wizard completion", (r) => fmtPct(r.wizardCompletion)),
        line("Trial starts", (r) => fmtInt(r.trialStarts)),
        line("Trial to paid", (r) => `${fmtPct(r.trialToPaid)} (${r.trialsEnded} ended)`, fmtPct(assumed.trialToPaid)),
        line(
          "Download to paid, day 35",
          (r) => `${fmtPct(r.downloadToPaidD35)} (of ${fmtInt(r.d35Cohort)})`,
          fmtPct(assumed.downloadToPaidD35),
        ),
        line("Annual share of new paid", (r) => `${fmtPct(r.annualShare, 0)} (${r.paidStarts})`, fmtPct(assumed.annualShare, 0)),
        line("Monthly churn (30 days)", (r) => fmtPct(r.monthlyChurn), fmtPct(assumed.monthlyChurn, 0)),
        line(
          "Annual first renewal",
          (r) => `${fmtPct(r.annualFirstRenewal, 0)} (${r.annualDue} due)`,
          fmtPct(assumed.annualFirstRenewal, 0),
        ),
        line("Refund rate (90 days)", (r) => fmtPct(r.refundRate), fmtPct(assumed.refundRate)),
        line("Revenue per install, day 14", (r) => fmtUsd(r.revenuePerInstallD14, 2)),
        line("Revenue per install, day 60", (r) => fmtUsd(r.revenuePerInstallD60, 2), fmtUsd(assumed.revenuePerInstallD60, 2)),
        line("Realised price, monthly ($6.99)", (r) => fmtUsd(r.realisedMonthly, 2)),
        line("Realised price, annual ($39.99)", (r) => fmtUsd(r.realisedAnnual, 2), `${fmtPct(assumed.realisedPrice, 0)} of list`),
        line("Paying subscribers", (r) => fmtInt(r.paying)),
        line("Gross MRR", (r) => fmtUsd(r.grossMrr)),
        line("Net MRR (after 15% fee, refunds, VAT)", (r) => fmtUsd(r.netMrr)),
        [
          "Billing-failure cancellations",
          fmtPct(all.billingFailureShare),
          fmtPct(rows[0]?.billingFailureShare),
          "n/a",
          "n/a",
          "Play: 31% of cancels (benchmark)",
        ],
      ]}
    />
  );
}

function Installs({ admin, open, setOpen }: { admin: boolean; open: string | null; setOpen: (id: string | null) => void }) {
  const [data, setData] = useState<{ installs: Install[] } | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/installs/")
      .then(async (r) => {
        if (r.ok && live) setData(await r.json());
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [version]);
  const mark = async (id: string, test: boolean) => {
    await fetch("/api/admin/installs/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, test }),
    });
    setVersion((v) => v + 1);
  };
  if (!data) return <p className="text-muted">Loading…</p>;
  return (
    <div className="space-y-4">
      {open && <InstallDetail id={open} close={() => setOpen(null)} />}
      <Card
        title="Latest installs"
        subtitle="Device and source only. Mark your own phones and CI devices as test so they're left out of every number. The install id is shown in the app under Settings › Usage stats."
      >
        <Table
          columns={["Id", "First seen", "Last seen", "Platform", "Device", "OS", "Version", "Country", "Source", "Workouts", "Events", ""]}
          rows={data.installs.map((i) => [
            <button
              key="id"
              type="button"
              className="text-xs text-accent underline"
              title="Open this install"
              onClick={() => setOpen(i.id)}
            >
              <code>{i.id.slice(0, 8)}</code>
            </button>,
            when(i.firstSeen),
            when(i.lastSeen),
            STORE_LABEL[i.store ?? ""] ?? i.platform,
            i.device ?? "—",
            i.os ?? "—",
            i.appVersion ?? "—",
            i.country ?? "—",
            i.source ?? "—",
            i.workouts,
            i.events,
            admin ? (
              <button
                key={i.id}
                type="button"
                className="text-xs text-accent underline"
                title={i.id}
                onClick={() => void mark(i.id, !i.test)}
              >
                {i.test ? "Count it" : "Mark test"}
              </button>
            ) : i.test ? (
              "test"
            ) : (
              ""
            ),
          ])}
        />
      </Card>
    </div>
  );
}

const blank = {
  kind: "creator" as CodeKind,
  code: "",
  name: "",
  contact: "",
  rate: "30",
  months: "12",
  note: "",
  active: true,
  trialDays: "30",
  offering: "creator30",
  endsAt: "",
  maxUses: "",
};
const dayOf = (ms: number | null) => (ms == null ? "" : new Date(ms).toISOString().slice(0, 10));

/**
 * Codes (docs/decisions/marketing-and-growth.md): creators' codes, with what they brought in and what each creator
 * is owed, and promo codes of our own (no commission), each with its own trial or offering, end date and limit.
 */
function Creators({ admin, days }: { admin: boolean; days: number }) {
  const [data, setData] = useState<{ rows: CreatorRow[]; payouts: Payout[] } | null>(null);
  const [version, setVersion] = useState(0);
  const [form, setForm] = useState(blank);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/admin/creators/?days=${days}`)
      .then(async (r) => {
        if (r.ok && live) setData(await r.json());
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [version, days]);
  const post = async (body: unknown) => {
    const r = await fetch("/api/admin/creators/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    setMsg(r.ok ? "Saved." : (j.error ?? "Something went wrong."));
    if (r.ok) setVersion((v) => v + 1);
    return r.ok;
  };
  const save = async () => {
    const body = {
      action: "save",
      ...form,
      rate: Number(form.rate) / 100,
      months: Number(form.months),
      // A promo with no trial gives what its offering gives (a discount).
      trialDays: form.trialDays.trim() || null,
      endsAt: form.endsAt ? `${form.endsAt}T23:59:59Z` : null,
      maxUses: form.maxUses.trim() || null,
    };
    if (await post(body)) setForm(blank);
  };
  const edit = (c: CreatorRow) =>
    setForm({
      kind: c.kind,
      code: c.code,
      name: c.name,
      contact: c.contact ?? "",
      rate: String(Math.round(c.rate * 1000) / 10),
      months: String(c.months),
      note: c.note ?? "",
      active: c.active,
      trialDays: c.trialDays == null ? "" : String(c.trialDays),
      offering: c.offering,
      endsAt: dayOf(c.endsAt),
      maxUses: c.maxUses == null ? "" : String(c.maxUses),
    });
  const pay = async (c: CreatorRow) => {
    const amount = window.prompt(`Record a payout to ${c.name}. Amount paid in USD (owed: ${fmtUsd(c.owed, 2)}):`, c.owed.toFixed(2));
    if (!amount) return;
    const note = window.prompt("Note (PayPal or Wise reference), optional:") ?? "";
    await post({ action: "payout", code: c.code, usd: Number(amount), note });
  };
  if (!data) return <p className="text-muted">Loading…</p>;
  const rows = data.rows;
  const sum = (f: (r: CreatorRow) => number) => rows.reduce((t, r) => t + f(r), 0);
  // Promo and lifetime codes are ours: no creator, contact or commission.
  const promo = form.kind !== "creator";
  const lifetime = form.kind === "lifetime";
  const field = (label: string, key: Exclude<keyof typeof blank, "kind" | "active">, hint?: string, type = "text") => (
    <label className="block text-sm">
      <span className="text-xs text-muted">{label}</span>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={hint}
        className="card mt-1 w-full px-3 py-2"
      />
    </label>
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tile
          label="Live codes"
          value={fmtInt(rows.filter((r) => r.active).length)}
          sub={`${rows.filter((r) => r.kind === "creator").length} creators · ${rows.filter((r) => r.kind === "promo").length} promo · ${rows.filter((r) => r.kind === "lifetime").length} lifetime`}
        />
        <Tile
          label={`Code sign-ups, ${days} days`}
          value={fmtInt(sum((r) => r.signupsPeriod))}
          sub={`${fmtInt(sum((r) => r.signups))} all time`}
        />
        <Tile label="Paying subscribers" value={fmtInt(sum((r) => r.paying))} sub={`${fmtInt(sum((r) => r.trials))} trials`} />
        <Tile
          label="Commission earned"
          value={fmtUsd(
            sum((r) => r.earned),
            2,
          )}
          sub={`${fmtUsd(
            sum((r) => r.paid),
            2,
          )} paid`}
        />
        <Tile
          label="Owed now"
          value={fmtUsd(
            sum((r) => Math.max(0, r.owed)),
            2,
          )}
          sub={`${rows.filter((r) => r.payable).length} ready to pay`}
        />
      </div>
      <Card
        title="Codes"
        subtitle={`Commission is the rate times our net revenue (the store price less its ${Math.round(STORE_FEE * 100)}% fee) for each subscriber's first months after their first payment. Revenue counts once it's ${HOLD_DAYS} days old, so refunds can't be paid out; a refund takes its share back. Pay monthly once someone is owed ${fmtUsd(MIN_PAYOUT)} or more.`}
        right={
          <a className="text-xs text-accent underline" href="/api/admin/creators/?format=csv">
            Payout list (CSV)
          </a>
        }
      >
        <Table
          columns={["Code", "Name", "Terms", "Sign-ups", "Trials", "Paying", "Refunds", "Gross", "Earned", "Paid", "Owed", "Last paid", ""]}
          empty="No codes yet. Add the first one below."
          rows={rows.map((r) => [
            <code key="c" className="text-xs">
              {r.code}
            </code>,
            <span key="n">
              {r.name}
              {!r.active && <span className="ml-1 text-xs text-muted">(paused)</span>}
            </span>,
            [
              r.kind === "lifetime" ? "Pro for life" : r.kind === "promo" ? "Promo" : `${Math.round(r.rate * 100)}% · ${r.months} mo`,
              r.kind === "lifetime" ? "" : r.trialDays == null ? `offer ${r.offering}` : `${r.trialDays}-day trial`,
              r.endsAt != null ? `ends ${dayOf(r.endsAt)}` : "",
              r.maxUses != null ? `${fmtInt(r.signups)}/${fmtInt(r.maxUses)} used` : "",
            ]
              .filter(Boolean)
              .join(" · "),
            fmtInt(r.signups),
            fmtInt(r.trials),
            fmtInt(r.paying),
            fmtInt(r.refunds),
            fmtUsd(r.gross, 2),
            fmtUsd(r.earned, 2),
            fmtUsd(r.paid, 2),
            <span key="o" className={r.payable ? "font-semibold text-good" : ""}>
              {fmtUsd(r.owed, 2)}
            </span>,
            r.lastPayout ? when(r.lastPayout) : "—",
            admin ? (
              <span key="a" className="flex gap-2 text-xs">
                <button type="button" className="text-accent underline" onClick={() => edit(r)}>
                  Edit
                </button>
                {r.owed > 0 && (
                  <button type="button" className="text-accent underline" onClick={() => void pay(r)}>
                    Record payout
                  </button>
                )}
              </span>
            ) : (
              ""
            ),
          ])}
        />
      </Card>
      {admin && (
        <Card
          title={form.code && rows.some((r) => r.code === form.code.toUpperCase()) ? `Edit ${form.code.toUpperCase()}` : "Add a code"}
          subtitle="Its link is www.getliftsmith.com/c/<code>, or people type it under Settings › Redeem a code. The trial and offering decide what it gives: a longer trial through creator30, or a discount through any RevenueCat offering whose store products carry it (set those up in RevenueCat, Play Console and App Store Connect first). On Google Play, tag the code's offer with the offering id and rc-ignore-offer."
        >
          <div className="mb-3 flex gap-2 text-sm" role="group" aria-label="Kind of code">
            {CODE_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={form.kind === k}
                onClick={() => setForm({ ...form, kind: k, ...(k !== "creator" && form.trialDays === "30" ? { trialDays: "" } : {}) })}
                className={`press rounded-xl border px-3 py-1.5 ${form.kind === k ? "border-accent text-accent" : "border-line text-muted"}`}
              >
                {k === "creator"
                  ? "Creator's code (earns commission)"
                  : k === "promo"
                    ? "Promo code (ours, no commission)"
                    : "Lifetime Pro (free for good, needs sign-in)"}
              </button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {field(
              lifetime ? "Code (10+ letters and digits, hard to guess)" : "Code",
              "code",
              lifetime ? "PALS-7Q4K-X2M9" : promo ? "SUMMER26" : "LIFT-ALEX",
            )}
            {field(promo ? "Label (only shown here)" : "Name or handle", "name", promo ? "Summer sale 2026" : "@alexlifts")}
            {!promo && field("Contact (email or handle)", "contact")}
            {!promo && field("Commission %", "rate")}
            {!promo && field("Months per subscriber", "months")}
            {!lifetime && field("Trial days (blank: the offering's own terms)", "trialDays", promo ? "blank for a discount" : "30")}
            {!lifetime && field("RevenueCat offering", "offering", "creator30")}
            {field("Ends (optional)", "endsAt", "", "date")}
            {field(lifetime ? "Most accounts (optional)" : "Most uses (optional)", "maxUses", lifetime ? "3" : "500")}
            {field("Note", "note", promo ? "Newsletter, 2026-12" : "Agreement signed 2026-11-09")}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active (a paused or ended code stops working for new sign-ups; people who already used it keep what it gave)
          </label>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => void save()}
              className="press rounded-xl bg-accent px-4 py-2 font-semibold text-accent-ink"
            >
              Save code
            </button>
            <button type="button" onClick={() => setForm(blank)} className="press rounded-xl px-4 py-2 text-muted">
              Clear
            </button>
          </div>
          {msg && (
            <p role="status" className="mt-2 text-sm text-muted">
              {msg}
            </p>
          )}
        </Card>
      )}
      <Card title="Payouts" subtitle="Recorded after paying by PayPal or Wise.">
        <Table
          columns={["When", "Code", "Amount", "By", "Note"]}
          rows={data.payouts.map((p) => [when(p.paidAt), p.code, fmtUsd(p.usd, 2), p.admin, p.note ?? ""])}
          empty="No payouts yet."
        />
      </Card>
    </div>
  );
}

export function AdminApp() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(28);
  const [view, setView] = useState<View>(readView);
  const tab = view.tab;
  const [data, setData] = useState<Data | null>(null);
  const [state, setState] = useState<"loading" | "signin" | "twofactor" | "ok" | "error">("loading");
  const [twoFactor, setTwoFactor] = useState<TwoFactorInfo | null>(null);
  // Maintenance mode's state, for the banner on every tab and the switch on System.
  const maintenance = useMaintenance();
  const [counts, setCounts] = useState<Partial<Record<Tab, number>>>({});
  const setCount = useCallback((t: Tab, n: number) => setCounts((c) => (c[t] === n ? c : { ...c, [t]: n })), []);
  const todoCount = useCallback((n: number) => setCount("To Do", n), [setCount]);
  const inboxCount = useCallback((n: number) => setCount("Inbox", n), [setCount]);
  // Each tab (and an open account or install) has its own address, and every move is in the browser history,
  // so Back, Forward, a reload and a shared link all land on the same place (as in Gradelings).
  const navigate = useCallback((next: View) => {
    setView(next);
    const url = viewUrl(next);
    if (url !== location.pathname + location.search) history.pushState(null, "", url);
  }, []);
  const setTab = useCallback((t: Tab) => navigate({ tab: t, open: null }), [navigate]);
  const openIn = useCallback((t: Tab) => (id: string | null) => navigate({ tab: t, open: id }), [navigate]);
  useEffect(() => {
    const back = () => setView(readView());
    addEventListener("popstate", back);
    return () => removeEventListener("popstate", back);
  }, []);
  const go = useCallback((t: string) => (TABS as readonly string[]).includes(t) && setTab(t as Tab), [setTab]);
  // The tab counts, once signed in: mail waiting for an answer, and everything on the to-do list.
  useEffect(() => {
    if (state !== "ok") return;
    let live = true;
    const read = (url: string, f: (j: Record<string, unknown>) => number | null) =>
      fetch(url)
        .then(async (r) => (r.ok ? f((await r.json()) as Record<string, unknown>) : null))
        .catch(() => null);
    void read("/api/admin/inbox/?count=1", (j) => (typeof j.waiting === "number" ? j.waiting : null)).then(
      (n) => live && n != null && inboxCount(n),
    );
    void read("/api/admin/todo/", (j) =>
      Array.isArray(j.items) && Array.isArray(j.tasks)
        ? j.items.length + (j.tasks as { doneAt: unknown }[]).filter((t) => !t.doneAt).length
        : null,
    ).then((n) => live && n != null && todoCount(n));
    return () => {
      live = false;
    };
  }, [state, inboxCount, todoCount]);
  useEffect(() => {
    let live = true;
    fetch(`/api/admin/stats/?days=${days}`)
      .then(async (r) => {
        if (!live) return;
        if (r.status === 404) {
          // Signed in with the link but not past the second step yet, or not signed in at all.
          const tf = await loadTwoFactor();
          if (!live) return;
          setTwoFactor(tf);
          return setState(tf && !tf.ready ? "twofactor" : "signin");
        }
        if (!r.ok) return setState("error");
        const j = (await r.json()) as Data;
        if (!live) return;
        setData(j);
        setState("ok");
      })
      .catch(() => live && setState("error"));
    return () => {
      live = false;
    };
  }, [days]);

  if (state === "signin") return <SignIn />;
  if (state === "twofactor" && twoFactor) return <TwoFactorGate info={twoFactor} />;
  if (state === "error")
    return <main className="p-8 text-muted">The stats didn&apos;t load. Is the database set up (DATABASE_URL or TURSO_DATABASE_URL)?</main>;
  if (!data) return <main className="p-8 text-muted">Loading…</main>;
  const o = data.overview;
  const rev = data.revenue;
  const site = data.site;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="sticky top-0 z-20 -mx-4 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mr-auto text-lg font-bold">Liftsmith admin</h1>
          <div className="flex gap-1" role="group" aria-label="Period">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={days === p}
                onClick={() => setDays(p)}
                className={`press rounded-full border px-3 py-1.5 text-sm ${days === p ? "border-accent bg-accent/15" : "border-line text-muted"}`}
              >
                {p === 365 ? "1 year" : `${p} days`}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted">
            {data.staff.email} ({data.staff.role})
          </span>
          <button
            type="button"
            className="text-xs text-muted underline"
            onClick={() => void fetch("/api/admin/logout/", { method: "POST" }).then(() => setState("signin"))}
          >
            Sign out
          </button>
        </div>
        <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              aria-current={tab === t ? "page" : undefined}
              onClick={() => setTab(t)}
              className={`press shrink-0 rounded-lg px-3 py-1.5 text-sm ${tab === t ? "bg-raised text-ink" : "text-muted"}`}
            >
              {t}
              {counts[t] ? (
                <span
                  className="ml-1.5 rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-ink"
                  aria-label={`${counts[t]} waiting`}
                >
                  {counts[t]}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </header>

      <div className="mt-4 space-y-4">
        <MaintenanceBanner state={maintenance[0]} admin={data.staff.role === "admin"} changed={maintenance[1]} />
        {tab === "Overview" && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="New installs" value={fmtInt(o.installs)} delta={delta(o.installs, o.prevInstalls)} sub="vs the period before" />
              <Tile label="Site visitors" value={fmtInt(o.visitors)} delta={delta(o.visitors, o.prevVisitors)} sub="daily unique, summed" />
              <Tile
                label="Active today / week / month"
                value={`${fmtInt(o.dau)} / ${fmtInt(o.wau)} / ${fmtInt(o.mau)}`}
                sub={`stickiness ${fmtPct(o.stickiness, 0)} (DAU/MAU)`}
              />
              <Tile label="Workouts finished" value={fmtInt(o.workouts)} />
              <Tile
                label="Finished setup"
                value={fmtPct(o.setupRate, 0)}
                sub={o.minutesToSetup != null ? `median ${o.minutesToSetup} min after install` : undefined}
              />
              <Tile
                label="Started a workout"
                value={fmtPct(o.firstWorkoutRate, 0)}
                sub={o.hoursToFirstWorkout != null ? `median ${o.hoursToFirstWorkout} h after install` : undefined}
              />
              <Tile label="Trial starts" value={fmtInt(o.trialStarts)} />
              <Tile label="MRR gross / net" value={`${fmtUsd(o.grossMrr)} / ${fmtUsd(o.netMrr)}`} sub={`${fmtInt(o.paying)} paying`} />
            </div>
            <Card title="New installs a day" subtitle="By store.">
              <StackedBars
                rows={data.installsDaily}
                keys={["play", "appstore", "web", "other"]}
                labels={STORE_LABEL}
                label="New installs a day by store"
              />
            </Card>
            <Card title="Active installs a day" subtitle="Installs that opened the app or did anything, by platform.">
              <LineChart
                rows={data.activeDaily}
                x="day"
                lines={[
                  { key: "android", label: "Android" },
                  { key: "ios", label: "iOS" },
                  { key: "web", label: "Web" },
                ]}
                xLabel={fmtDay}
                label="Active installs a day"
              />
            </Card>
          </>
        )}

        {tab === "Traffic" && (
          <>
            <SearchConsole days={days} />
            <BingSearch days={days} />
            <h2 className="pt-4 text-lg font-bold">Visits to the website</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="Visitors" value={fmtInt(site.visitors)} delta={delta(site.visitors, site.prevVisitors)} />
              <Tile label="Page views" value={fmtInt(site.views)} delta={delta(site.views, site.prevViews)} />
              <Tile label="Pages a visitor" value={site.viewsPerVisitor == null ? "—" : String(site.viewsPerVisitor)} />
              <Tile label="Call-to-action clicks" value={fmtInt(site.ctaTotal)} sub={`${fmtPct(site.ctaRate)} of visitors`} />
            </div>
            <Card title="Visitors and page views" subtitle="Public pages only, cookieless; a visitor counts once a day. Bots are left out.">
              <LineChart
                rows={site.daily}
                x="day"
                lines={[
                  { key: "visitors", label: "Visitors" },
                  { key: "views", label: "Page views" },
                ]}
                xLabel={fmtDay}
                label="Visitors and page views a day"
              />
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Top pages">
                <BarList rows={site.pages} />
              </Card>
              <Card title="Referrers" subtitle="The site that linked to us.">
                <BarList rows={site.referrers} />
              </Card>
              <Card title="UTM source / medium">
                <BarList rows={site.sources} />
              </Card>
              <Card title="Campaigns">
                <BarList rows={site.campaigns} empty="No tagged campaigns yet." />
              </Card>
              <Card title="Countries">
                <BarList rows={site.countries} />
              </Card>
              <Card title="Devices">
                <BarList rows={site.devices} />
              </Card>
              <Card title="Browsers">
                <BarList rows={site.browsers} />
              </Card>
              <Card title="Operating systems">
                <BarList rows={site.os} />
              </Card>
            </div>
            <Card title="Call-to-action clicks" subtitle="Open the app, Google Play and App Store links, by the page they were on.">
              <Table
                columns={["Click", "Page", "Clicks"]}
                rows={site.ctas.map((c) => [c.key, c.path, fmtInt(c.n)])}
                empty="No clicks yet."
              />
            </Card>
          </>
        )}

        {tab === "Acquisition" && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="New installs" value={fmtInt(o.installs)} />
              <Tile label="From Apple Search Ads" value={fmtInt(data.acquisition.searchAds)} />
              <Tile label="Tagged campaigns" value={fmtInt(data.acquisition.campaigns.reduce((s, c) => s + c.n, 0))} />
              <Tile label="Countries" value={fmtInt(data.devices.countries.length)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card
                title="Where installs came from"
                subtitle="Play install referrer tags, Apple Search Ads, or the first website visit for web installs."
              >
                <BarList rows={data.acquisition.sources} />
              </Card>
              <Card title="Campaigns">
                <BarList
                  rows={data.acquisition.campaigns}
                  empty="Tag store and site links with utm_source, utm_medium and utm_campaign to see them here."
                />
              </Card>
              <Card title="Referring sites (web installs)">
                <BarList rows={data.acquisition.referrers} />
              </Card>
              <Card title="Countries">
                <BarList rows={data.devices.countries} />
              </Card>
              <Card title="Stores">
                <BarList rows={data.devices.stores.map((s) => ({ ...s, key: STORE_LABEL[s.key] ?? s.key }))} />
              </Card>
              <Card title="Languages">
                <BarList rows={data.devices.locales} />
              </Card>
            </div>
          </>
        )}

        {tab === "Funnel" && (
          <>
            <Card title="From install to paid" subtitle="The installs made in the period, and how far each got.">
              <Funnel steps={data.funnel} />
            </Card>
            <Card
              title="Website to web app"
              subtitle="Visitors in the period. Store installs are credited by their store link's tags instead (Acquisition)."
            >
              <Funnel steps={data.siteFunnel} />
            </Card>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(data.funnelByStore).map(([s, steps]) => (
                <Card key={s} title={STORE_LABEL[s]}>
                  <Funnel steps={steps} />
                </Card>
              ))}
            </div>
            <Card title="Setup wizard, step by step" subtitle="Installs that reached each step.">
              <Funnel steps={data.onboarding.map((s) => ({ key: `${s.step + 1}. ${s.name}`, n: s.n }))} />
            </Card>
          </>
        )}

        {tab === "Retention" && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Tile label="Day 1" value={fmtPct(data.retention.d1, 0)} sub="back on day 1 or later" />
              <Tile label="Day 7" value={fmtPct(data.retention.d7, 0)} sub="back on day 7 or later" />
              <Tile label="Day 30" value={fmtPct(data.retention.d30, 0)} sub="back on day 30 or later" />
            </div>
            <Card
              title="Weekly cohorts"
              subtitle="Each row is a week's installs; each cell the share that used the app in that week after installing (W0 is the install week)."
            >
              <CohortTable rows={data.retention.cohorts} />
            </Card>
          </>
        )}

        {tab === "Engagement" && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile
                label="Workouts finished"
                value={fmtInt(data.engagement.finished)}
                sub={data.engagement.perActiveInstall != null ? `${data.engagement.perActiveInstall} a monthly active install` : undefined}
              />
              <Tile label="Average length" value={data.engagement.avgMinutes == null ? "—" : `${data.engagement.avgMinutes} min`} />
              <Tile label="Average sets" value={data.engagement.avgSets == null ? "—" : String(data.engagement.avgSets)} />
              <Tile label="Ended by themselves" value={fmtPct(data.engagement.autoEnded, 0)} sub={`${fmtInt(data.engagement.prs)} PRs`} />
            </div>
            <Card title="Workouts finished a day">
              <LineChart
                rows={data.engagement.workoutsDaily}
                x="day"
                lines={[{ key: "n", label: "Workouts" }]}
                xLabel={fmtDay}
                label="Workouts finished a day"
              />
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Screens viewed">
                <BarList rows={data.engagement.screens} />
              </Card>
              <Card title="Features used" subtitle="Installs that used each feature.">
                <BarList rows={data.engagement.features} />
              </Card>
              <Card title="Permissions" subtitle="Granted and refused, when the app asked.">
                <Table
                  columns={["Permission", "Granted", "Refused", "Rate"]}
                  rows={data.engagement.permissions.map((p) => [
                    p.key,
                    fmtInt(p.granted),
                    fmtInt(p.denied),
                    fmtPct(p.granted + p.denied ? p.granted / (p.granted + p.denied) : null, 0),
                  ])}
                />
              </Card>
            </div>
          </>
        )}

        {tab === "Devices" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Platforms">
              <BarList rows={data.devices.platforms.map((s) => ({ ...s, key: STORE_LABEL[s.key] ?? s.key }))} />
            </Card>
            <Card title="Operating system versions">
              <BarList rows={data.devices.os} />
            </Card>
            <Card title="Device models">
              <BarList rows={data.devices.models} />
            </Card>
            <Card title="Manufacturers">
              <BarList rows={data.devices.manufacturers} />
            </Card>
            <Card title="App versions in use" subtitle="Installs active in the period.">
              <BarList rows={data.devices.versions} />
            </Card>
            <Card title="Phones and tablets">
              <BarList rows={data.devices.formFactors} />
            </Card>
          </div>
        )}

        {tab === "Revenue" && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="Gross MRR" value={fmtUsd(rev.all.grossMrr)} />
              <Tile label="Net MRR" value={fmtUsd(rev.all.netMrr)} sub="after store fee, refunds and VAT" />
              <Tile label="Paying subscribers" value={fmtInt(rev.all.paying)} />
              <Tile label="Paywall views" value={fmtInt(rev.paywallViews)} sub={`${fmtInt(rev.all.trialStarts)} trials`} />
            </div>
            <RunningCosts admin={data.staff.role === "admin"} netMrr={rev.all.netMrr} />
            <Card
              title="Forecast against actual"
              subtitle="Gross MRR by month since launch, log scale. Dashed: the forecast's conservative, base and optimistic cases."
            >
              {rev.forecast.length ? (
                <LineChart
                  rows={rev.forecast}
                  x="month"
                  lines={[
                    { key: "actual", label: "Actual" },
                    { key: "lo", label: "Conservative", dashed: true },
                    { key: "mid", label: "Base", dashed: true },
                    { key: "hi", label: "Optimistic", dashed: true },
                  ]}
                  xLabel={(m) => `M${m}`}
                  yFormat={(v) => fmtUsd(v)}
                  log
                  height={220}
                  label="Gross MRR against the forecast"
                />
              ) : (
                <p className="text-sm text-muted">Starts with the first store install (or set LAUNCH_DATE).</p>
              )}
            </Card>
            <Card
              title="Forecast inputs by store"
              subtitle="The numbers the revenue forecast depends on, measured. Subscription numbers come from the app's purchase events until store server notifications land with billing."
            >
              <StoreTable rows={rev.byStore} all={rev.all} assumed={rev.assumed} />
            </Card>
            <Card title="Gross MRR over the period">
              <LineChart
                rows={rev.mrrDaily}
                x="day"
                lines={[{ key: "gross", label: "Gross MRR" }]}
                xLabel={fmtDay}
                yFormat={(v) => fmtUsd(v)}
                label="Gross MRR over the period"
              />
            </Card>
          </>
        )}

        {tab === "Codes" && <Creators admin={data.staff.role === "admin"} days={days} />}
        {tab === "Users" && <Users admin={data.staff.role === "admin"} me={data.staff.email} open={view.open} setOpen={openIn("Users")} />}
        {tab === "Installs" && <Installs admin={data.staff.role === "admin"} open={view.open} setOpen={openIn("Installs")} />}
        {tab === "To Do" && <Todo admin={data.staff.role === "admin"} go={go} onCount={todoCount} />}
        {tab === "Inbox" && <Inbox admin={data.staff.role === "admin"} onCount={inboxCount} />}
        {tab === "Flags" && <Flags admin={data.staff.role === "admin"} />}
        {tab === "A/B Tests" && <Experiments admin={data.staff.role === "admin"} />}
        {tab === "Automations" && <Automations admin={data.staff.role === "admin"} />}
        {tab === "System" && <System admin={data.staff.role === "admin"} maintenance={maintenance} />}
        {tab === "Log" && <Log />}
      </div>
    </div>
  );
}
