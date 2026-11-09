"use client";
// The health twin (Melvin, 2026-11-09; AGENTS.md "Health twin"): the Body tab's Health view. The demo
// figure stands with its heart beating at the lifter's resting rate, the main numbers pinned around it,
// and every metric below as a tile that says what it means and what to do. Tapping one opens its last
// 30 days against the lifter's own normal. Free to see; health signals moving today's call is Pro.
import { Info } from "@/components/Info";
import { LiftDemo } from "@/components/demo/LiftDemo";
import { can, isPro } from "@/lib/entitlements";
import { fitnessAge, strengthWeek, type FitnessAge } from "@/lib/fitnessAge";
import type { Term } from "@/lib/glossary";
import { connectHealth, healthAvailable } from "@/lib/health";
import { date, t } from "@/lib/i18n";
import { isNative } from "@/lib/juice";
import { CALL_TEXT, readiness } from "@/lib/readiness";
import { useApp } from "@/lib/store";
import { scoreBand, strength } from "@/lib/strength";
import { healthExternal, twin, type Status, type TwinId, type TwinMetric } from "@/lib/twin";
import { useNow } from "@/lib/useNow";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { go } from "./router";
import { Button, Section, Sheet } from "./ui";

const BODY: TwinId[] = ["weight", "leanMass", "bodyFat", "bmi", "tdee", "steps"];
const HEART: TwinId[] = ["sleep", "hrv", "restingHr", "breathing", "vo2max", "restDrop"];
const TERM: Partial<Record<TwinId, Term>> = { hrv: "hrv", restingHr: "restingHr", breathing: "breathingRate", vo2max: "vo2max", leanMass: "leanMass", bmi: "bmi", restDrop: "restDrop" };

/** Status colours are tokens (good, warn), so they follow the theme and colour-blind safe colours. */
const TONE: Record<Status, string> = {
  good: "border-good/50 text-good",
  watch: "border-warn/60 text-warn",
  steady: "border-line text-muted",
  info: "border-line text-muted",
  missing: "border-line text-faint",
};

const noSubscribe = () => () => {};
const storeName = () => (typeof navigator !== "undefined" && /iPhone|iPad/.test(navigator.userAgent) ? "Apple Health" : "Health Connect");

export function HealthTwin() {
  const { events, profile, stats, readiness: r, setCall } = useApp();
  const now = useNow(60_000);
  const native = useSyncExternalStore(noSubscribe, isNative, () => false);
  const pro = isPro();
  const store = storeName();
  const metrics = useMemo(() => twin({ events, profile, sessions: stats.sessions, now, pro: can("healthReadiness", pro), native, store }), [events, profile, stats.sessions, now, pro, native, store]);
  const by = new Map(metrics.map((m) => [m.id, m]));
  const [open, setOpen] = useState<TwinId | null>(null);
  const [canHealth, setCanHealth] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => {
    void healthAvailable().then(setCanHealth);
  }, []);
  const hasHealth = events.some((e) => e.type === "health");

  // Free lifters see what Pro would have called today, from the same signals.
  const proCall = useMemo(() => {
    if (can("healthReadiness", pro) || !r) return null;
    const withHealth = readiness(events, profile, now, { cycle: !!profile.cycle?.enabled, ...healthExternal(events, now) });
    return withHealth.call !== r.call ? withHealth.call : null;
  }, [events, profile, now, pro, r]);

  const connect = async () => {
    setNote("");
    if (!(await connectHealth())) return setNote(t("twin.connect.none", { source: store }));
    const s = useApp.getState();
    const [a, b] = await Promise.all([s.importHealthDaily(), s.importHealthBody()]);
    if (!a && !b) setNote(t("twin.connect.none", { source: store }));
  };

  const rhr = by.get("restingHr");
  const watch = metrics.filter((m) => m.status === "watch");
  const summary = metrics.filter((m) => m.display).map((m) => `${m.label} ${m.display}, ${m.chip}`).join(". ");
  const current = open ? by.get(open) : undefined;

  return (
    <div>
      <p className="mt-1 text-muted">{t("twin.lead")}<Info term="healthTwin" /></p>

      {r && (
        <section className="card card-tint mt-4 p-4" style={{ "--tint": r.call === "push" ? "var(--color-ember)" : r.call === "recover" ? "var(--color-cyan)" : "var(--color-accent)" } as React.CSSProperties} aria-label={t("twin.today", { call: CALL_TEXT[r.call].label })} data-testid="twin-verdict">
          <h2 className="text-lg font-bold">{t("twin.today", { call: CALL_TEXT[r.call].label })}</h2>
          <p className="mt-1 text-sm text-muted">
            {(watch.length ? watch.slice(0, 2).map((m) => `${m.label}: ${m.chip.toLowerCase()}`) : r.signals.slice(0, 2).map((s) => s.text)).join(". ") || CALL_TEXT[r.call].blurb}
          </p>
          {proCall && <p className="mt-2 text-sm text-ink">{t("twin.proWould", { call: CALL_TEXT[proCall].label.toLowerCase() })}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => go("today")} icon="today">{t("twin.plan")}</Button>
            {proCall && <Button kind="ghost" onClick={() => go("pro", "twin")}>{t("twin.seePro")}</Button>}
          </div>
        </section>
      )}

      {canHealth && !hasHealth && (
        <section className="card mt-3 p-4" data-testid="twin-connect">
          <p className="text-sm text-muted">{t("twin.connect.body")}</p>
          <div className="mt-3"><Button kind="ghost" icon="heart" onClick={() => void connect()}>{t("twin.connect", { source: store })}</Button></div>
          {note && <p className="mt-2 text-sm text-warn" role="status">{note}</p>}
        </section>
      )}
      {!native && <p className="mt-3 text-sm text-faint">{t("twin.web")}</p>}

      <div className="keep-colours relative mx-auto mt-4 h-[24rem] max-w-[420px]">
        <LiftDemo className="h-full" view="front" bpm={rhr?.value ? Math.round(rhr.value) : null} label={t("body.health")} />
        <span className="sr-only">{t("twin.figure", { summary })}</span>
        <Pin m={by.get("sleep")} className="left-2 top-9" onOpen={setOpen} />
        <Pin m={by.get("hrv")?.display ? by.get("hrv") : rhr} className="right-2 top-20" onOpen={setOpen} />
        <Pin m={by.get("bodyFat")?.display ? by.get("bodyFat") : by.get("bmi")} className="left-2 top-48" onOpen={setOpen} />
        <Pin m={by.get("weight")} className="right-2 top-60" onOpen={setOpen} />
        <Pin m={by.get("tdee")} className="bottom-8 left-1/2 -translate-x-1/2" onOpen={setOpen} />
      </div>

      <FitnessAgeCard native={native} store={store} />

      <Section title={t("twin.group.body")} icon="target">
        <Tiles ids={BODY} by={by} onOpen={setOpen} />
      </Section>
      <Section title={t("twin.group.heart")} icon="heart">
        <Tiles ids={HEART} by={by} onOpen={setOpen} />
      </Section>
      <p className="mt-4 text-xs text-faint">{t("twin.notMedical")}</p>

      <Sheet open={!!current} onClose={() => setOpen(null)} title={current?.label ?? ""}>
        {current && <Detail m={current} store={store} onConnect={() => void connect()} onEasy={() => { setCall("recover"); setOpen(null); go("today"); }} />}
      </Sheet>
    </div>
  );
}

/**
 * Fitness age from VO2 max (AGENTS.md "Fitness age"; docs/FITNESS_AGE.md). General wellness only: a range,
 * its source and what moves it, a standing note that it isn't medical advice, no warning colours, never a
 * notification. Beside it, this week's strength training and the strength score.
 */
function FitnessAgeCard({ native, store }: { native: boolean; store: string }) {
  const { events, profile, stats } = useApp();
  const now = useNow(60_000);
  const r = useMemo(() => fitnessAge(events, profile, now), [events, profile, now]);
  const week = useMemo(() => strengthWeek(stats.sessions, now), [stats.sessions, now]);
  const score = useMemo(() => strength(events, profile, now, { adjustAge: profile.delight?.ageAdjust !== false }).overall, [events, profile, now]);
  const [how, setHow] = useState(false);
  const v: FitnessAge | null = r.ok ? r.value : null;
  const big = v ? (v.atFloor ? t("fit.floor", { age: v.fitnessAge }) : v.atCeiling ? t("fit.ceiling", { age: v.fitnessAge }) : t("fit.value", { age: v.fitnessAge })) : "—";
  const one = (x: number) => (Math.round(x * 10) / 10).toFixed(1);
  return (
    <Section title={t("fit.title")} icon="heart">
      <div className="card p-4" data-testid="fitness-age">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="num display text-3xl">{big}</span>
          {v && <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${v.verdict === "younger" ? "border-good/50 text-good" : "border-line text-muted"}`}>{t(`fit.chip.${v.verdict}`)}</span>}
          <Info term="fitnessAge" />
        </div>
        {v ? (
          <>
            <p className="mt-1 text-sm text-muted">{t("fit.range", { low: v.low, high: v.high, age: v.age })}</p>
            <p className="mt-2 text-sm text-muted">{t("fit.from", { vo2: one(v.vo2), date: date(new Date(`${v.day}T12:00:00`), { day: "numeric", month: "short" }), who: t(v.sex === "male" ? "fit.man" : "fit.woman"), age: v.age, expected: one(v.expected) })}</p>
            <p className="mt-2 text-sm text-ink">{t(`fit.todo.${v.verdict}`)}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted">
            {r.ok ? "" : r.missing.includes("vo2") ? (native ? t("fit.missing.vo2", { source: store }) : t("fit.missing.web")) : t("fit.missing.profile")}
          </p>
        )}
        <p className="mt-3 text-sm text-muted">{t("fit.strength", { count: week.days, minutes: week.minutes })}</p>
        {score !== null && <p className="mt-1 text-sm text-muted">{t("fit.score", { score, band: scoreBand(score) })}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button kind="ghost" onClick={() => setHow(true)}>{t("fit.how")}</Button>
          {!r.ok && !r.missing.includes("vo2") && <Button kind="ghost" onClick={() => go("tools", "tdee")}>{t("fit.addProfile")}</Button>}
          {score !== null && <Button kind="ghost" onClick={() => go("stats")}>{t("fit.seeProgress")}</Button>}
        </div>
        <p className="mt-3 text-xs text-faint">{t("fit.disclaimer")}</p>
      </div>
      <Sheet open={how} onClose={() => setHow(false)} title={t("fit.how")}>
        {(["fit.how.1", "fit.how.2", "fit.how.3", "fit.how.4"] as const).map((k) => <p key={k} className="mt-2">{t(k)}</p>)}
        <p className="mt-4 text-xs text-faint">{t("fit.disclaimer")}</p>
      </Sheet>
    </Section>
  );
}

function Pin({ m, className, onOpen }: { m?: TwinMetric; className: string; onOpen: (id: TwinId) => void }) {
  if (!m || !m.display) return null;
  return (
    <button type="button" onClick={() => onOpen(m.id)}
      className={`press absolute z-10 max-w-[9.5rem] rounded-xl border border-line bg-surface/90 px-2.5 py-1.5 text-left backdrop-blur ${className}`}>
      <span className="block truncate text-[0.6875rem] uppercase tracking-wider text-muted">{m.label}<span className="sr-only">:</span></span>
      <span className="num block text-sm font-bold text-ink">{m.display}</span>
      <span className={`block truncate text-[0.6875rem] ${m.status === "good" ? "text-good" : m.status === "watch" ? "text-warn" : "text-muted"}`}>{m.chip}</span>
    </button>
  );
}

function Tiles({ ids, by, onOpen }: { ids: TwinId[]; by: Map<TwinId, TwinMetric>; onOpen: (id: TwinId) => void }) {
  return (
    <ul className="space-y-2">
      {ids.map((id) => by.get(id)).filter((m): m is TwinMetric => !!m).map((m) => (
        <li key={m.id}>
          <button type="button" onClick={() => onOpen(m.id)} data-testid={`twin-${m.id}`} className="press card block w-full p-3.5 text-left">
            <span className="flex flex-wrap items-start gap-x-3 gap-y-1">
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{m.label}</span>
                <span className="num display block text-xl">{m.display || "—"}</span>
              </span>
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE[m.status]}`}>{m.chip}</span>
            </span>
            <span className="mt-1 block text-sm text-muted">{m.why}</span>
            {m.did && <span className="mt-1 block text-sm text-ink">{m.did}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Detail({ m, store, onConnect, onEasy }: { m: TwinMetric; store: string; onConnect: () => void; onEasy: () => void }) {
  const term = TERM[m.id];
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="num display text-3xl">{m.display || "—"}</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE[m.status]}`}>{m.chip}</span>
        {term && <Info term={term} />}
      </div>
      {m.series.length >= 2 && <Chart m={m} />}
      {m.band && m.id !== "sleep" && <p className="mt-1 text-xs text-faint">{t("twin.normal", { low: fmt(m.band.low), high: fmt(m.band.high) })}</p>}
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{t("twin.why")}</h3>
      <p className="mt-1">{m.why}</p>
      {m.did && (
        <>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{t("twin.did")}</h3>
          <p className="mt-1">{m.did}</p>
        </>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {m.action?.kind === "connect" && <Button kind="ghost" icon="heart" onClick={onConnect}>{t("twin.connect", { source: store })}</Button>}
        {m.action?.kind === "route" && <Button kind="ghost" onClick={() => { const [route, arg] = (m.action as { route: string }).route.split("/"); go(route as Parameters<typeof go>[0], arg); }}>{m.action.label}</Button>}
        {m.status === "watch" && can("adaptive") && ["sleep", "hrv", "restingHr", "breathing", "restDrop"].includes(m.id) && <Button kind="ghost" onClick={onEasy}>{t("twin.easy")}</Button>}
      </div>
      <p className="mt-4 text-xs text-faint">{m.source === "health" ? t("twin.from.health", { source: store }) : t("twin.from.app")} · {t("twin.notMedical")}</p>
    </div>
  );
}

const fmt = (v: number) => (Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));

/** The last 30 days as a line, with the lifter's normal as a band behind it. Drawn to one scale. */
function Chart({ m }: { m: TwinMetric }) {
  const W = 300, H = 110, PAD = 18;
  const vals = m.series.map((p) => p.value);
  const lo0 = Math.min(...vals, m.band?.low ?? Infinity), hi0 = Math.max(...vals, m.band?.high ?? -Infinity);
  const span = hi0 - lo0 || Math.max(1, Math.abs(hi0) * 0.1);
  const lo = lo0 - span * 0.1, hi = hi0 + span * 0.1;
  const day = (d: string) => new Date(`${d}T12:00:00`).getTime();
  const t0 = day(m.series[0].day), t1 = day(m.series[m.series.length - 1].day);
  const x = (d: string) => PAD + ((day(d) - t0) / Math.max(1, t1 - t0)) * (W - 2 * PAD);
  const y = (v: number) => 8 + (1 - (v - lo) / (hi - lo)) * (H - 26);
  const pts = m.series.map((p) => `${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const last = m.series[m.series.length - 1];
  return (
    <figure className="mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t("twin.chart.label", { label: m.label })}>
        {m.band && <rect x={PAD} width={W - 2 * PAD} y={y(m.band.high)} height={Math.max(1, y(m.band.low) - y(m.band.high))} fill="var(--color-cyan)" opacity={0.12} />}
        {m.band && <line x1={PAD} x2={W - PAD} y1={y(m.band.mean)} y2={y(m.band.mean)} stroke="var(--color-cyan)" strokeDasharray="3 4" opacity={0.6} />}
        <polyline points={pts} fill="none" stroke="var(--color-ink)" strokeWidth={1.8} strokeLinejoin="round" />
        <circle cx={x(last.day)} cy={y(last.value)} r={3.5} fill={m.status === "watch" ? "var(--color-warn)" : "var(--color-accent)"} />
        <text x={PAD} y={H - 3} fontSize={10} fill="var(--color-muted)">{m.series[0].day.slice(5)}</text>
        <text x={W - PAD} y={H - 3} fontSize={10} textAnchor="end" fill="var(--color-muted)">{last.day.slice(5)}</text>
      </svg>
      <figcaption className="sr-only">{m.series.map((p) => `${p.day}: ${fmt(p.value)}`).join(", ")}</figcaption>
    </figure>
  );
}
