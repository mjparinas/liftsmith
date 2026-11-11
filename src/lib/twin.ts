// The health twin (Melvin, 2026-11-09): the body's numbers at a glance, on the Body tab's Health view.
// Weight, lean mass, body fat, BMI, TDEE, steps, sleep, HRV, resting heart rate, overnight breathing
// rate, VO2 max and how fast heart rate falls in rest. Every number is compared with the lifter's own
// 30-day normal (never with other people), and says in a line what it means and what to do (action over
// stats). Derived from events every time, never stored: weigh-ins (`bodyweight`), daily Health readings
// (`health`, imported by the store from health.ts readDaily), and the heart rate streams of workouts.
// Sleep, HRV, resting HR and breathing rate also feed the readiness call, for Pro (healthExternal).
import type { SessionSummary } from "./derive";
import { inSentence, list, t } from "./i18n";
import { healthSignals, type ExternalSignals } from "./readiness";
import { ACTIVITY, bmiBand, currentTdee } from "./tdee";
import type { AppEvent, HealthMetric, HrSeriesEvent, Profile, SetEvent } from "./types";
import { fmtNum } from "./units";

const DAY = 86_400_000;
const BASELINE_DAYS = 30;
const MIN_BASELINE = 7;

export type TwinId =
  "weight" | "leanMass" | "bodyFat" | "bmi" | "tdee" | "steps" | "sleep" | "hrv" | "restingHr" | "breathing" | "vo2max" | "restDrop";
/** good: going the right way · watch: worth acting on · steady: normal for you · info: no verdict · missing: no data yet. */
export type Status = "good" | "watch" | "steady" | "info" | "missing";

export type TwinAction = { kind: "connect" } | { kind: "route"; route: string; label: string } | { kind: "easy" };

export interface Point {
  day: string;
  value: number;
}

export interface TwinMetric {
  id: TwinId;
  label: string;
  /** The number as shown, with its unit ("80.4 kg", "7 h 40"). Empty when missing. */
  display: string;
  value?: number;
  status: Status;
  /** A word or two for the chip: "Losing slowly", "Short", "Above your normal". */
  chip: string;
  /** What it means for the lifter, in a line. */
  why: string;
  /** What the plan did about it today, when it feeds the readiness call. */
  did?: string;
  action?: TwinAction;
  /** Up to the last 30 days, oldest first, for the detail chart. */
  series: Point[];
  /** The lifter's normal range, for the chart's band. */
  band?: { low: number; high: number; mean: number };
  /** Where it comes from: Health Connect / Apple Health, or the app's own data. */
  source: "health" | "app";
  /** Readings in the last 2 days, so the figure can light it. */
  fresh: boolean;
}

export interface TwinInput {
  events: readonly AppEvent[];
  profile: Profile;
  sessions: Pick<SessionSummary, "start">[];
  now: number;
  /** Pro: health signals change today's plan. */
  pro: boolean;
  /** On a phone with Health Connect or Apple Health (the web app has no health store). */
  native: boolean;
  /** Which store to name: "Health Connect" or "Apple Health". */
  store?: string;
}

// --- Days and readings ---

export function dayOf(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Day key `n` days before `now`'s local day (noon steps, so time changes don't skip a day). */
function daysBack(now: number, n: number): string {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return dayOf(d.getTime());
}

/** One value per day for a metric, oldest first; when a day was re-read, the newest reading wins. */
export function readings(events: readonly AppEvent[], metric: HealthMetric): Point[] {
  const by = new Map<string, { at: number; value: number }>();
  for (const e of events) {
    if (e.type !== "health" || e.metric !== metric) continue;
    const cur = by.get(e.day);
    if (!cur || e.at >= cur.at) by.set(e.day, { at: e.at, value: e.value });
  }
  return [...by.entries()].map(([day, v]) => ({ day, value: v.value })).sort((a, b) => (a.day < b.day ? -1 : 1));
}

const mean = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const sd = (xs: readonly number[]) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length);
};

/**
 * The lifter's normal: the 30 days before `today` (today left out, so a bad night doesn't hide in its
 * own baseline). Needs 7 readings. The band is a standard deviation either side, at least `floor`.
 */
export function baseline(series: readonly Point[], now: number, floor: number): { mean: number; low: number; high: number } | undefined {
  const from = daysBack(now, BASELINE_DAYS),
    today = dayOf(now);
  const xs = series.filter((p) => p.day >= from && p.day < today).map((p) => p.value);
  if (xs.length < MIN_BASELINE) return undefined;
  const m = mean(xs),
    w = Math.max(sd(xs), floor);
  return { mean: m, low: m - w, high: m + w };
}

/** The newest reading from today or the last `days` days. */
function recent(series: readonly Point[], now: number, days: number): Point | undefined {
  const last = series[series.length - 1];
  return last && last.day >= daysBack(now, days) ? last : undefined;
}

const window30 = (series: readonly Point[], now: number) => series.filter((p) => p.day >= daysBack(now, BASELINE_DAYS));

// --- What readiness counts (Pro) ---

/** Sleep, HRV, resting HR and breathing rate for today's readiness call, from the last two days. */
export function healthExternal(events: readonly AppEvent[], now: number): ExternalSignals {
  const out: ExternalSignals = {};
  const sleep = recent(readings(events, "sleep"), now, 0);
  if (sleep) out.sleepHours = sleep.value;
  const hrv = readings(events, "hrv"),
    hrvNow = recent(hrv, now, 1),
    hrvBase = baseline(hrv, now, 0);
  if (hrvNow && hrvBase) out.hrvDelta = (hrvNow.value - hrvBase.mean) / hrvBase.mean;
  const rhr = readings(events, "restingHr"),
    rhrNow = recent(rhr, now, 1),
    rhrBase = baseline(rhr, now, 0);
  if (rhrNow && rhrBase) out.restingHrDelta = rhrNow.value - rhrBase.mean;
  const br = readings(events, "breathing"),
    brNow = recent(br, now, 1),
    brBase = baseline(br, now, 0);
  if (brNow && brBase) out.breathingDelta = brNow.value - brBase.mean;
  return out;
}

/** The readiness line this metric adds today, if any, and what that means for the plan. */
function didFor(key: keyof ExternalSignals, ext: ExternalSignals, pro: boolean): string | undefined {
  const sig = healthSignals({ [key]: ext[key] } as ExternalSignals)[0];
  if (!sig) return undefined;
  if (!pro) return t("twin.did.free", { signal: sig.text });
  return sig.points < 0 ? t("twin.did.easier", { signal: sig.text }) : t("twin.did.push", { signal: sig.text });
}

// --- Rest-time heart rate drop ---

/** Beats per minute nearest to `t` seconds into a stream, within 5 s. */
function bpmAt(s: HrSeriesEvent, t: number): number | undefined {
  let best: number | undefined,
    gap = 6;
  for (let i = 0; i < s.t.length; i++) {
    const g = Math.abs(s.t[i] - t);
    if (g < gap) {
      gap = g;
      best = s.bpm[i];
    }
  }
  return best;
}

/**
 * How far heart rate falls in the first minute of rest, per workout (median of its sets), from the
 * Bluetooth stream saved at the end of each workout. Only sets followed by a minute or more of rest.
 * Exported for tests.
 */
export function restDrops(events: readonly AppEvent[]): Point[] {
  const sets = new Map<string, SetEvent[]>();
  for (const e of events) if (e.type === "set") sets.set(e.sessionId, [...(sets.get(e.sessionId) ?? []), e]);
  const out: { at: number; value: number }[] = [];
  for (const e of events) {
    if (e.type !== "hrSeries" || e.t.length < 60) continue;
    const ss = (sets.get(e.sessionId) ?? []).sort((a, b) => a.at - b.at);
    const drops: number[] = [];
    for (let i = 0; i < ss.length; i++) {
      const t = (ss[i].at - e.start) / 1000,
        next = ss[i + 1];
      if (next && next.at - ss[i].at < 75_000) continue;
      const a = bpmAt(e, t),
        b = bpmAt(e, t + 60);
      if (a && b && a >= 90 && a - b > 0 && a - b < 80) drops.push(a - b);
    }
    if (drops.length >= 3) out.push({ at: e.start, value: drops.sort((x, y) => x - y)[Math.floor(drops.length / 2)] });
  }
  return out.sort((a, b) => a.at - b.at).map((p) => ({ day: dayOf(p.at), value: p.value }));
}

// --- Formatting ---

const hm = (h: number) => {
  const mins = Math.round(h * 60);
  return `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, "0")}`;
};
const kgText = (kg: number, unit: Profile["unit"]) =>
  unit === "lb" ? `${fmtNum(Math.round(kg * 2.20462 * 10) / 10)} lb` : `${fmtNum(Math.round(kg * 10) / 10)} kg`;
const kcal = (n: number) => `${fmtNum(Math.round(n / 10) * 10)} kcal`;
const pct = (x: number) => `${x > 0 ? "+" : ""}${fmtNum(Math.round(x))}%`;

// --- The metrics ---

export function twin(input: TwinInput): TwinMetric[] {
  const { events, profile, now, pro, native } = input;
  const store = input.store ?? t("twin.yourHealthApp");
  const unit = profile.unit;
  const ext = healthExternal(events, now);
  const missing = (id: TwinId, label: string, what: string): TwinMetric => ({
    id,
    label,
    display: "",
    status: "missing",
    chip: native ? t("twin.c.notConnected") : t("twin.c.onPhone"),
    why: native ? t("twin.w.missing", { store, what }) : t("twin.w.missingWeb"),
    action: native ? { kind: "connect" } : undefined,
    series: [],
    source: "health",
    fresh: false,
  });

  const out: TwinMetric[] = [];
  const tdee = currentTdee(events as AppEvent[], input.sessions, profile, now);

  // Weight: the trend over the last four weeks of weigh-ins.
  const weighIns = events.filter((e) => e.type === "bodyweight").sort((a, b) => a.at - b.at);
  const wSeries: Point[] = [];
  for (const e of weighIns) {
    const day = dayOf(e.at);
    if (wSeries.length && wSeries[wSeries.length - 1].day === day) wSeries[wSeries.length - 1].value = e.kg;
    else wSeries.push({ day, value: e.kg });
  }
  const lastW = weighIns[weighIns.length - 1];
  const kgNow = lastW?.kg ?? profile.bodyweight;
  {
    const recentW = weighIns.filter((e) => e.at >= now - 28 * DAY);
    let status: Status = "info",
      chip = t("twin.c.oneWeighIn"),
      why = t("twin.w.oneWeighIn");
    if (!lastW) {
      chip = t("twin.c.fromSetup");
      why = t("twin.w.fromSetup");
    } else if (recentW.length >= 3 && recentW[recentW.length - 1].at - recentW[0].at >= 10 * DAY) {
      // Least-squares slope in kg a day.
      const xs = recentW.map((e) => (e.at - recentW[0].at) / DAY),
        ys = recentW.map((e) => e.kg);
      const mx = mean(xs),
        my = mean(ys);
      const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / (xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 1);
      const perWeek = ((slope * 7) / kgNow) * 100;
      const rate = t("twin.rate", { rate: `${perWeek > 0 ? "+" : ""}${fmtNum(Math.round(perWeek * 10) / 10)}` });
      const maint = tdee.result ? ` ${t("twin.w.maint", { kcal: kcal(tdee.result.tdee) })}` : "";
      if (perWeek < -1) {
        status = "watch";
        chip = t("twin.c.dropFast");
        why = t("twin.w.dropFast", { rate });
      } else if (perWeek <= -0.25) {
        // A healthy pace of loss, but not progress for someone trying to build muscle.
        status = profile.goal === "muscle" ? "info" : "good";
        chip = t("twin.c.loseSlow");
        why = t("twin.w.onPace", { rate }) + maint;
      } else if (perWeek < 0.25) {
        status = "steady";
        chip = t("twin.c.steady");
        why = t("twin.w.steadyWeight", { rate }) + maint;
      } else if (perWeek <= 0.5) {
        status = profile.goal === "muscle" ? "good" : "info";
        chip = t("twin.c.gainSlow");
        why = t("twin.w.gainSlow", { rate });
      } else {
        status = "watch";
        chip = t("twin.c.gainFast");
        why = t("twin.w.gainFast", { rate });
      }
    } else if (recentW.length) {
      chip = t("twin.c.needMore");
      why = t("twin.w.needMore");
    }
    out.push({
      id: "weight",
      label: t("twin.l.weight"),
      display: kgText(kgNow, unit),
      value: kgNow,
      status,
      chip,
      why,
      series: window30(wSeries, now).map((p) => ({ ...p, value: unit === "lb" ? p.value * 2.20462 : p.value })),
      source: "app",
      fresh: !!lastW && lastW.at >= now - 2 * DAY,
      action: { kind: "route", route: "stats", label: t("twin.a.weighIn") },
    });
  }

  // Body fat and lean mass: the change over about six weeks.
  const fats = weighIns.filter((e) => e.bodyFat && e.at >= now - 180 * DAY);
  const lastF = fats[fats.length - 1];
  if (!lastF) {
    out.push({
      ...missing("bodyFat", t("twin.l.bodyFat"), t("twin.what.bodyFat")),
      why: native ? t("twin.w.fatMissing", { store }) : t("twin.w.fatMissingWeb"),
      chip: t("twin.c.noReading"),
      action: { kind: "route", route: "stats", label: t("twin.a.logFat") },
    });
  } else {
    const then = [...fats].reverse().find((e) => e.at <= lastF.at - 35 * DAY);
    const lean = (e: { kg: number; bodyFat?: number }) => e.kg * (1 - e.bodyFat! / 100);
    const fatSeries = window30(
      fats.map((e) => ({ day: dayOf(e.at), value: e.bodyFat! })),
      now,
    );
    if (!then) {
      out.push({
        id: "bodyFat",
        label: t("twin.l.bodyFat"),
        display: `${fmtNum(Math.round(lastF.bodyFat! * 10) / 10)}%`,
        value: lastF.bodyFat,
        status: "info",
        chip: t("twin.c.building"),
        why: t("twin.w.fatTrend"),
        series: fatSeries,
        source: "health",
        fresh: lastF.at >= now - 2 * DAY,
      });
      out.push({
        id: "leanMass",
        label: t("twin.l.leanMass"),
        display: kgText(lean(lastF), unit),
        value: lean(lastF),
        status: "info",
        chip: t("twin.c.building"),
        why: t("twin.w.leanAbout"),
        series: [],
        source: "health",
        fresh: false,
      });
    } else {
      const dFat = lastF.bodyFat! - then.bodyFat!,
        dLean = lean(lastF) - lean(then),
        dKg = lastF.kg - then.kg;
      const weeks = Math.round((lastF.at - then.at) / (7 * DAY));
      const dLeanText = `${dLean >= 0 ? "+" : "−"}${kgText(Math.abs(dLean), unit)}`;
      let fs: Status = "steady",
        fc = t("twin.c.steady"),
        fw = t("twin.w.fatSteady", { n: fmtNum(Math.round(dFat * 10) / 10), weeks });
      if (dFat <= -0.5) {
        fs = "good";
        fc = t("twin.c.down");
        fw = t("twin.w.fatDown", { n: fmtNum(Math.round(-dFat * 10) / 10), weeks });
      } else if (dFat >= 1) {
        fs = "watch";
        fc = t("twin.c.creeping");
        fw = t("twin.w.fatUp", { n: fmtNum(Math.round(dFat * 10) / 10), weeks });
      }
      let ls: Status = "steady",
        lc = t("twin.c.kept"),
        lw = t("twin.w.leanKept", { delta: dLeanText, weeks });
      if (dLean >= 0.3) {
        ls = "good";
        lc = t("twin.c.buildingMuscle");
        lw = t("twin.w.leanUp", { delta: dLeanText, weeks });
      } else if (dLean <= -0.7 && dKg < 0) {
        ls = "watch";
        lc = t("twin.c.losingSome");
        lw = t("twin.w.leanDown", {
          delta: dLeanText,
          weeks,
          protein: tdee.result ? `${tdee.result.protein[0]}–${tdee.result.protein[1]} g` : t("twin.proteinPerKg"),
        });
      }
      out.push({
        id: "bodyFat",
        label: t("twin.l.bodyFat"),
        display: `${fmtNum(Math.round(lastF.bodyFat! * 10) / 10)}%`,
        value: lastF.bodyFat,
        status: fs,
        chip: fc,
        why: fw,
        series: fatSeries,
        source: "health",
        fresh: lastF.at >= now - 2 * DAY,
      });
      out.push({
        id: "leanMass",
        label: t("twin.l.leanMass"),
        display: kgText(lean(lastF), unit),
        value: lean(lastF),
        status: ls,
        chip: lc,
        why: lw,
        series: window30(
          fats.map((e) => ({ day: dayOf(e.at), value: lean(e) * (unit === "lb" ? 2.20462 : 1) })),
          now,
        ),
        source: "health",
        fresh: false,
      });
    }
  }

  // BMI, with when to ignore it.
  if (profile.heightCm) {
    const bmi = kgNow / (profile.heightCm / 100) ** 2;
    const leanCut = profile.sex === "female" ? 30 : profile.sex === "male" ? 20 : 25;
    const band = bmiBand(bmi);
    const ignore = bmi >= 25 && lastF && lastF.bodyFat! < leanCut;
    out.push({
      id: "bmi",
      label: t("twin.l.bmi"),
      display: fmtNum(Math.round(bmi * 10) / 10),
      value: bmi,
      status: ignore ? "info" : bmi >= 18.5 && bmi < 25 ? "steady" : "info",
      chip: ignore ? t("twin.c.ignore") : band,
      why: ignore
        ? t("twin.w.bmiIgnore", { band: inSentence(band, true), fat: fmtNum(Math.round(lastF!.bodyFat! * 10) / 10) })
        : t("twin.w.bmi"),
      series: [],
      source: "app",
      fresh: false,
    });
  } else {
    out.push({
      id: "bmi",
      label: t("twin.l.bmi"),
      display: "",
      status: "missing",
      chip: t("twin.c.needsHeight"),
      why: t("twin.w.needsHeight"),
      action: { kind: "route", route: "tools/tdee", label: t("twin.a.addHeight") },
      series: [],
      source: "app",
      fresh: false,
    });
  }

  // Energy: TDEE and what to eat for the goal.
  if (tdee.result) {
    const r = tdee.result;
    const level = inSentence(ACTIVITY[tdee.activity.activity].label, true);
    const from =
      tdee.activity.source === "steps"
        ? t("twin.from.steps", { level })
        : tdee.activity.source === "workouts"
          ? t("twin.from.workouts", { level })
          : t("twin.from.level", { level });
    out.push({
      id: "tdee",
      label: t("twin.l.tdee"),
      display: kcal(r.tdee),
      value: r.tdee,
      status: "info",
      chip: t("twin.c.aDay"),
      why: t("twin.w.tdee", { from, cut: kcal(r.cut), bulk: kcal(r.bulk), low: r.protein[0], high: r.protein[1] }),
      action: { kind: "route", route: "tools/tdee", label: t("twin.a.tdee") },
      series: [],
      source: "app",
      fresh: false,
    });
  } else {
    out.push({
      id: "tdee",
      label: t("twin.l.tdee"),
      display: "",
      status: "missing",
      chip: t("twin.c.needsDetails"),
      why: t("twin.w.needsDetails", { missing: list(tdee.missing.map((k) => t(`twin.need.${k}`))) }),
      action: { kind: "route", route: "tools/tdee", label: t("twin.a.addDetails") },
      series: [],
      source: "app",
      fresh: false,
    });
  }

  // Sleep: last night and the last seven.
  const sleep = readings(events, "sleep");
  const last7 = sleep.filter((p) => p.day >= daysBack(now, 6));
  if (!sleep.length || !recent(sleep, now, 7)) out.push(missing("sleep", t("twin.l.sleep"), t("twin.what.sleep")));
  else {
    const night = recent(sleep, now, 0);
    const avg = last7.length >= 3 ? mean(last7.map((p) => p.value)) : undefined;
    const short = last7.filter((p) => p.value < 7).length;
    let status: Status = "steady",
      chip = t("twin.c.enough"),
      why = "";
    if (avg !== undefined && avg < 7) {
      status = "watch";
      chip = t("twin.c.short");
      why = t("twin.w.sleepShort", { avg: hm(avg), short, nights: last7.length });
    } else if (avg !== undefined) {
      status = avg >= 7.5 ? "good" : "steady";
      chip = avg >= 7.5 ? t("twin.c.rested") : t("twin.c.enough");
      why = t("twin.w.sleepOk", { avg: hm(avg) });
    } else why = t("twin.w.sleepFew");
    out.push({
      id: "sleep",
      label: night ? t("twin.l.sleepNight") : t("twin.l.sleep"),
      display: hm((night ?? sleep[sleep.length - 1]).value),
      value: (night ?? sleep[sleep.length - 1]).value,
      status,
      chip,
      why,
      did: didFor("sleepHours", ext, pro),
      series: window30(sleep, now),
      band: { low: 7, high: 9, mean: 8 },
      source: "health",
      fresh: !!night,
    });
  }

  // Heart: HRV, resting heart rate, breathing rate, against the lifter's own normal.
  const vsNormal = (
    id: TwinId,
    label: string,
    metric: HealthMetric,
    what: string,
    floor: number,
    fmt: (v: number) => string,
    key: keyof ExternalSignals,
    judge: (v: number, b: { mean: number; low: number; high: number }) => { status: Status; chip: string; why: string },
    about: string,
  ) => {
    const series = readings(events, metric);
    const cur = recent(series, now, 2);
    if (!cur) {
      out.push(missing(id, label, what));
      return;
    }
    const b = baseline(series, now, floor);
    const j = b ? judge(cur.value, b) : { status: "info" as Status, chip: t("twin.c.learning"), why: t("twin.w.learning", { about }) };
    out.push({
      id,
      label,
      display: fmt(cur.value),
      value: cur.value,
      ...j,
      did: didFor(key, ext, pro),
      series: window30(series, now),
      band: b,
      source: "health",
      fresh: true,
    });
  };
  vsNormal(
    "hrv",
    t("twin.l.hrv"),
    "hrv",
    t("twin.what.hrv"),
    2,
    (v) => `${fmtNum(Math.round(v))} ms`,
    "hrvDelta",
    (v, b) => {
      const d = ((v - b.mean) / b.mean) * 100;
      if (d < -10)
        return {
          status: "watch",
          chip: t("twin.c.below"),
          why: t("twin.w.hrvLow", { pct: pct(d), mean: fmtNum(Math.round(b.mean)) }),
        };
      if (d > 5)
        return {
          status: "good",
          chip: t("twin.c.above"),
          why: t("twin.w.hrvHigh", { pct: pct(d), mean: fmtNum(Math.round(b.mean)) }),
        };
      return {
        status: "steady",
        chip: t("twin.c.normal"),
        why: t("twin.w.hrvNormal", { low: fmtNum(Math.round(b.low)), high: fmtNum(Math.round(b.high)) }),
      };
    },
    t("twin.about.hrv"),
  );
  vsNormal(
    "restingHr",
    t("twin.l.restingHr"),
    "restingHr",
    t("twin.what.restingHr"),
    1.5,
    (v) => `${fmtNum(Math.round(v))} bpm`,
    "restingHrDelta",
    (v, b) => {
      const d = v - b.mean;
      if (d > 5)
        return {
          status: "watch",
          chip: t("twin.c.up"),
          why: t("twin.w.rhrUp", { d: fmtNum(Math.round(d)), mean: fmtNum(Math.round(b.mean)) }),
        };
      if (d <= -3)
        return {
          status: "good",
          chip: t("twin.c.lower"),
          why: t("twin.w.rhrLow", { d: fmtNum(Math.round(-d)) }),
        };
      return { status: "steady", chip: t("twin.c.steady"), why: t("twin.w.rhrNormal", { mean: fmtNum(Math.round(b.mean)) }) };
    },
    t("twin.about.restingHr"),
  );
  vsNormal(
    "breathing",
    t("twin.l.breathing"),
    "breathing",
    t("twin.what.breathing"),
    0.4,
    (v) => t("twin.perMin", { n: fmtNum(Math.round(v * 10) / 10) }),
    "breathingDelta",
    (v, b) => {
      const d = v - b.mean;
      if (d >= 2)
        return {
          status: "watch",
          chip: t("twin.c.upOvernight"),
          why: t("twin.w.breathUp", { d: fmtNum(Math.round(d * 10) / 10) }),
        };
      return {
        status: "steady",
        chip: t("twin.c.normal"),
        why: t("twin.w.breathNormal", { mean: fmtNum(Math.round(b.mean * 10) / 10) }),
      };
    },
    t("twin.about.breathing"),
  );

  // Steps: the week against your normal, and what they do to TDEE.
  const steps = readings(events, "steps");
  const week = steps.filter((p) => p.day >= daysBack(now, 7) && p.day < dayOf(now));
  if (!week.length) out.push(missing("steps", t("twin.l.steps"), t("twin.what.steps")));
  else {
    const avg = mean(week.map((p) => p.value));
    const counted = tdee.activity.source === "steps";
    const tail = counted ? ` ${t("twin.w.stepsTail", { level: inSentence(ACTIVITY[tdee.activity.activity].label, true) })}` : "";
    const n = fmtNum(Math.round(avg / 100) * 100);
    const s: Status = avg < 5000 ? "watch" : avg >= 8000 ? "good" : "steady";
    const why = (avg < 5000 ? t("twin.w.stepsLow", { n }) : t("twin.w.steps", { n })) + tail;
    out.push({
      id: "steps",
      label: t("twin.l.steps"),
      display: t("twin.perDay", { n }),
      value: avg,
      status: s,
      chip: avg < 5000 ? t("twin.c.low") : avg >= 8000 ? t("twin.c.active") : t("twin.c.fair"),
      why,
      series: window30(steps, now),
      source: "health",
      fresh: true,
    });
  }

  // VO2 max: cardio fitness, and its trend over three months.
  const vo2 = readings(events, "vo2max");
  const v = recent(vo2, now, 120);
  if (!v)
    out.push({
      ...missing("vo2max", t("twin.l.vo2max"), t("twin.what.vo2max")),
      why: native ? t("twin.w.vo2Missing", { store }) : t("twin.w.vo2MissingWeb"),
    });
  else {
    const old = vo2.filter((p) => p.day <= daysBack(now, 75) && p.day >= daysBack(now, 120));
    const d = old.length ? v.value - mean(old.map((p) => p.value)) : undefined;
    const about = t("twin.about.vo2");
    const [status, chip, why]: [Status, string, string] =
      d === undefined
        ? ["info", t("twin.c.cardio"), about]
        : d <= -2
          ? ["watch", t("twin.c.slipping"), t("twin.w.vo2Down", { n: fmtNum(Math.round(-d * 10) / 10), about })]
          : d >= 1
            ? ["good", t("twin.c.rising"), t("twin.w.vo2Up", { n: fmtNum(Math.round(d * 10) / 10) })]
            : ["steady", t("twin.c.steady"), t("twin.w.vo2Steady", { about })];
    out.push({
      id: "vo2max",
      label: t("twin.l.vo2max"),
      display: `${fmtNum(Math.round(v.value * 10) / 10)}`,
      value: v.value,
      status,
      chip,
      why,
      series: vo2.filter((p) => p.day >= daysBack(now, 120)),
      source: "health",
      fresh: false,
    });
  }

  // Rest-time heart rate drop, from the lifter's own strap.
  const drops = restDrops(events);
  if (drops.length >= 3) {
    const lastThree = drops
      .slice(-3)
      .map((p) => p.value)
      .sort((a, b) => a - b)[1];
    const earlier = drops.filter((p) => p.day <= daysBack(now, 30) && p.day >= daysBack(now, 120)).map((p) => p.value);
    const then = earlier.length >= 3 ? earlier.sort((a, b) => a - b)[Math.floor(earlier.length / 2)] : undefined;
    const d = then === undefined ? undefined : lastThree - then;
    const about = t("twin.about.restDrop");
    const [status, chip, why]: [Status, string, string] =
      d === undefined
        ? ["info", t("twin.c.baseline"), t("twin.w.dropBaseline", { about })]
        : d >= 3
          ? ["good", t("twin.c.fitter"), t("twin.w.dropUp", { n: fmtNum(Math.round(then!)), about })]
          : d <= -4
            ? ["watch", t("twin.c.slower"), t("twin.w.dropDown", { n: fmtNum(Math.round(then!)) })]
            : ["steady", t("twin.c.steady"), about];
    out.push({
      id: "restDrop",
      label: t("twin.l.restDrop"),
      display: `−${fmtNum(Math.round(lastThree))} bpm`,
      value: lastThree,
      status,
      chip,
      why,
      series: drops.filter((p) => p.day >= daysBack(now, 120)),
      source: "app",
      fresh: false,
    });
  } else {
    out.push({
      id: "restDrop",
      label: t("twin.l.restDrop"),
      display: "",
      status: "missing",
      chip: t("twin.c.needsStrap"),
      why: t("twin.w.needsStrap"),
      action: { kind: "route", route: "settings", label: t("twin.a.pair") },
      series: [],
      source: "app",
      fresh: false,
    });
  }

  return out;
}

/** Health metrics that need attention, worst first, for the verdict line and the Today hint. */
export function needsAttention(metrics: readonly TwinMetric[]): TwinMetric[] {
  return metrics.filter((m) => m.status === "watch");
}
