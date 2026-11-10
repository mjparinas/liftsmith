// The health twin (Melvin, 2026-11-09): the body's numbers at a glance, on the Body tab's Health view.
// Weight, lean mass, body fat, BMI, TDEE, steps, sleep, HRV, resting heart rate, overnight breathing
// rate, VO2 max and how fast heart rate falls in rest. Every number is compared with the lifter's own
// 30-day normal (never with other people), and says in a line what it means and what to do (action over
// stats). Derived from events every time, never stored: weigh-ins (`bodyweight`), daily Health readings
// (`health`, imported by the store from health.ts readDaily), and the heart rate streams of workouts.
// Sleep, HRV, resting HR and breathing rate also feed the readiness call, for Pro (healthExternal).
import type { SessionSummary } from "./derive";
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
  /** A word or two for the chip: "On pace", "Short", "Above your normal". */
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
  if (!pro) return `${sig.text}: with Pro, today's plan would take this into account.`;
  return sig.points < 0
    ? `${sig.text}: counted in today's call, so the plan leans easier.`
    : `${sig.text}: counted in today's call, so the plan can push a little.`;
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
  const store = input.store ?? "your Health app";
  const unit = profile.unit;
  const ext = healthExternal(events, now);
  const missing = (id: TwinId, label: string, what: string): TwinMetric => ({
    id,
    label,
    display: "",
    status: "missing",
    chip: native ? "Not connected" : "On your phone",
    why: native
      ? `Comes from ${store}. Allow ${what} there, or wear a watch or ring that records it.`
      : `Comes from your phone's health app. Open Liftsmith on your phone to see it.`,
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
      chip = "One weigh-in",
      why = "Weigh in once or twice a week, same time of day, to see your trend.";
    if (!lastW) {
      chip = "From setup";
      why = "Your setup weight. Log a weigh-in on Progress, or let a smart scale send it through your health app.";
    } else if (recentW.length >= 3 && recentW[recentW.length - 1].at - recentW[0].at >= 10 * DAY) {
      // Least-squares slope in kg a day.
      const xs = recentW.map((e) => (e.at - recentW[0].at) / DAY),
        ys = recentW.map((e) => e.kg);
      const mx = mean(xs),
        my = mean(ys);
      const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / (xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 1);
      const perWeek = ((slope * 7) / kgNow) * 100;
      const rate = `${perWeek > 0 ? "+" : ""}${fmtNum(Math.round(perWeek * 10) / 10)}% a week`;
      const maint = tdee.result ? ` Eat about ${kcal(tdee.result.tdee)} to hold it.` : "";
      if (perWeek < -1) {
        status = "watch";
        chip = "Dropping fast";
        why = `${rate}. Faster than 1% a week costs muscle and strength. Eat about 300 kcal more a day.`;
      } else if (perWeek <= -0.25) {
        status = "good";
        chip = "On pace";
        why = `${rate}. A pace that keeps muscle while you lose fat, if losing is the aim.${maint}`;
      } else if (perWeek < 0.25) {
        status = "steady";
        chip = "Steady";
        why = `${rate}: holding steady.${maint}`;
      } else if (perWeek <= 0.5) {
        status = profile.goal === "muscle" ? "good" : "info";
        chip = "Gaining slowly";
        why = `${rate}. A lean-gain pace: most of it can be muscle while your lifts climb.`;
      } else {
        status = "watch";
        chip = "Gaining fast";
        why = `${rate}. Faster than about 0.5% a week is mostly fat. Eat about 200 kcal less a day.`;
      }
    } else if (recentW.length) {
      chip = "Need more";
      why = "Three weigh-ins over two weeks show your trend. Keep weighing in.";
    }
    out.push({
      id: "weight",
      label: "Weight",
      display: kgText(kgNow, unit),
      value: kgNow,
      status,
      chip,
      why,
      series: window30(wSeries, now).map((p) => ({ ...p, value: unit === "lb" ? p.value * 2.20462 : p.value })),
      source: "app",
      fresh: !!lastW && lastW.at >= now - 2 * DAY,
      action: { kind: "route", route: "stats", label: "Log a weigh-in" },
    });
  }

  // Body fat and lean mass: the change over about six weeks.
  const fats = weighIns.filter((e) => e.bodyFat && e.at >= now - 180 * DAY);
  const lastF = fats[fats.length - 1];
  if (!lastF) {
    out.push({
      ...missing("bodyFat", "Body fat", "body fat"),
      why: native
        ? `Comes from a smart scale or body scanner through ${store}.`
        : "Comes from a smart scale through your phone's health app.",
      chip: native ? "No reading" : "On your phone",
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
        label: "Body fat",
        display: `${fmtNum(Math.round(lastF.bodyFat! * 10) / 10)}%`,
        value: lastF.bodyFat,
        status: "info",
        chip: "Building a trend",
        why: "Readings five or more weeks apart show whether you're losing fat or gaining muscle.",
        series: fatSeries,
        source: "health",
        fresh: lastF.at >= now - 2 * DAY,
      });
      out.push({
        id: "leanMass",
        label: "Lean mass",
        display: kgText(lean(lastF), unit),
        value: lean(lastF),
        status: "info",
        chip: "Building a trend",
        why: "Everything that isn't fat: muscle, bone, water. The number that tells you if training is building muscle.",
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
        fc = "Steady",
        fw = `${fmtNum(Math.round(dFat * 10) / 10)} points in ${weeks} weeks.`;
      if (dFat <= -0.5) {
        fs = "good";
        fc = "Down";
        fw = `Down ${fmtNum(Math.round(-dFat * 10) / 10)} points in ${weeks} weeks.`;
      } else if (dFat >= 1) {
        fs = "watch";
        fc = "Creeping up";
        fw = `Up ${fmtNum(Math.round(dFat * 10) / 10)} points in ${weeks} weeks. If that isn't the plan, eat about 200 kcal less a day and keep the lifting.`;
      }
      let ls: Status = "steady",
        lc = "Kept",
        lw = `${dLeanText} in ${weeks} weeks: muscle held.`;
      if (dLean >= 0.3) {
        ls = "good";
        lc = "Building";
        lw = `${dLeanText} in ${weeks} weeks: the training is building muscle.`;
      } else if (dLean <= -0.7 && dKg < 0) {
        ls = "watch";
        lc = "Losing some";
        lw = `${dLeanText} in ${weeks} weeks along with the weight. Slow the loss to about 0.5% a week and keep protein at ${tdee.result ? `${tdee.result.protein[0]}–${tdee.result.protein[1]} g` : "1.6–2.2 g per kg"} a day.`;
      }
      out.push({
        id: "bodyFat",
        label: "Body fat",
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
        label: "Lean mass",
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
      label: "BMI",
      display: fmtNum(Math.round(bmi * 10) / 10),
      value: bmi,
      status: ignore ? "info" : bmi >= 18.5 && bmi < 25 ? "steady" : "info",
      chip: ignore ? "Ignore it" : band,
      why: ignore
        ? `Says "${band.toLowerCase()}", but at ${fmtNum(Math.round(lastF!.bodyFat! * 10) / 10)}% body fat you're lean. BMI can't tell muscle from fat.`
        : "A rough guide made for people who don't lift. Body fat says more about you.",
      series: [],
      source: "app",
      fresh: false,
    });
  } else {
    out.push({
      id: "bmi",
      label: "BMI",
      display: "",
      status: "missing",
      chip: "Needs height",
      why: "Add your height to see it.",
      action: { kind: "route", route: "tools/tdee", label: "Add height" },
      series: [],
      source: "app",
      fresh: false,
    });
  }

  // Energy: TDEE and what to eat for the goal.
  if (tdee.result) {
    const r = tdee.result;
    const from =
      tdee.activity.source === "steps"
        ? `your steps and training (${ACTIVITY[tdee.activity.activity].label.toLowerCase()})`
        : tdee.activity.source === "workouts"
          ? `your training (${ACTIVITY[tdee.activity.activity].label.toLowerCase()})`
          : `${ACTIVITY[tdee.activity.activity].label.toLowerCase()} activity`;
    out.push({
      id: "tdee",
      label: "Energy (TDEE)",
      display: kcal(r.tdee),
      value: r.tdee,
      status: "info",
      chip: "A day",
      why: `About what you burn a day, from ${from}. To lose 0.5 kg a week eat about ${kcal(r.cut)}; for a lean gain about ${kcal(r.bulk)}. Protein ${r.protein[0]}–${r.protein[1]} g.`,
      action: { kind: "route", route: "tools/tdee", label: "Open TDEE" },
      series: [],
      source: "app",
      fresh: false,
    });
  } else {
    out.push({
      id: "tdee",
      label: "Energy (TDEE)",
      display: "",
      status: "missing",
      chip: "Needs details",
      why: `Add your ${tdee.missing.join(", ")} to see what you burn a day.`,
      action: { kind: "route", route: "tools/tdee", label: "Add details" },
      series: [],
      source: "app",
      fresh: false,
    });
  }

  // Sleep: last night and the last seven.
  const sleep = readings(events, "sleep");
  const last7 = sleep.filter((p) => p.day >= daysBack(now, 6));
  if (!sleep.length || !recent(sleep, now, 7)) out.push(missing("sleep", "Sleep", "sleep"));
  else {
    const night = recent(sleep, now, 0);
    const avg = last7.length >= 3 ? mean(last7.map((p) => p.value)) : undefined;
    const short = last7.filter((p) => p.value < 7).length;
    let status: Status = "steady",
      chip = "Enough",
      why = "";
    if (avg !== undefined && avg < 7) {
      status = "watch";
      chip = "Short";
      why = `${hm(avg)} a night this week, under 7 h on ${short} of ${last7.length} nights. Short sleep slows recovery and strength more than any set count. An earlier, fixed bedtime is the cheapest gain there is.`;
    } else if (avg !== undefined) {
      status = avg >= 7.5 ? "good" : "steady";
      chip = avg >= 7.5 ? "Well rested" : "Enough";
      why = `${hm(avg)} a night this week. 7 to 9 hours lets your muscles rebuild between workouts.`;
    } else why = "A few more nights show your weekly average. 7 to 9 hours is what recovery needs.";
    out.push({
      id: "sleep",
      label: night ? "Sleep last night" : "Sleep",
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
    const j = b
      ? judge(cur.value, b)
      : { status: "info" as Status, chip: "Learning your normal", why: `${about} A week of readings sets your normal.` };
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
    "HRV",
    "hrv",
    "heart rate variability",
    2,
    (v) => `${fmtNum(Math.round(v))} ms`,
    "hrvDelta",
    (v, b) => {
      const d = ((v - b.mean) / b.mean) * 100;
      if (d < -10)
        return {
          status: "watch",
          chip: "Below your normal",
          why: `${pct(d)} on your normal of ${fmtNum(Math.round(b.mean))} ms. Your body is still under stress from training, sleep or something else: a day to go easier.`,
        };
      if (d > 5)
        return {
          status: "good",
          chip: "Above your normal",
          why: `${pct(d)} on your normal of ${fmtNum(Math.round(b.mean))} ms. You've recovered well: a good day to push.`,
        };
      return {
        status: "steady",
        chip: "Normal for you",
        why: `Within your normal (${fmtNum(Math.round(b.low))}–${fmtNum(Math.round(b.high))} ms). Train as planned.`,
      };
    },
    "The beat-to-beat variation of your heart. Higher than your own normal means you've recovered.",
  );
  vsNormal(
    "restingHr",
    "Resting heart rate",
    "restingHr",
    "resting heart rate",
    1.5,
    (v) => `${fmtNum(Math.round(v))} bpm`,
    "restingHrDelta",
    (v, b) => {
      const d = v - b.mean;
      if (d > 5)
        return {
          status: "watch",
          chip: "Up",
          why: `${fmtNum(Math.round(d))} bpm over your normal of ${fmtNum(Math.round(b.mean))}. That often comes with poor sleep, stress or a cold starting: go easy and see how tomorrow looks.`,
        };
      if (d <= -3)
        return {
          status: "good",
          chip: "Lower",
          why: `${fmtNum(Math.round(-d))} bpm under your normal. A lower resting rate comes with better fitness and recovery.`,
        };
      return { status: "steady", chip: "Steady", why: `Close to your normal of ${fmtNum(Math.round(b.mean))} bpm.` };
    },
    "Your heart rate at rest. A few beats over your own normal is an early sign to take it easier.",
  );
  vsNormal(
    "breathing",
    "Breathing rate",
    "breathing",
    "respiratory rate",
    0.4,
    (v) => `${fmtNum(Math.round(v * 10) / 10)} /min`,
    "breathingDelta",
    (v, b) => {
      const d = v - b.mean;
      if (d >= 2)
        return {
          status: "watch",
          chip: "Up overnight",
          why: `${fmtNum(Math.round(d * 10) / 10)} breaths a minute over your normal while asleep. That's often one of the first signs of getting ill: an easy day or a rest day is the smart call.`,
        };
      return {
        status: "steady",
        chip: "Normal for you",
        why: `Close to your normal of ${fmtNum(Math.round(b.mean * 10) / 10)} breaths a minute while asleep.`,
      };
    },
    "Breaths a minute while you sleep, from a watch or ring.",
  );

  // Steps: the week against your normal, and what they do to TDEE.
  const steps = readings(events, "steps");
  const week = steps.filter((p) => p.day >= daysBack(now, 7) && p.day < dayOf(now));
  if (!week.length) out.push(missing("steps", "Steps", "steps"));
  else {
    const avg = mean(week.map((p) => p.value));
    const counted = tdee.activity.source === "steps";
    const tail = counted ? ` They set your TDEE's activity level (${ACTIVITY[tdee.activity.activity].label.toLowerCase()}).` : "";
    const s: Status = avg < 5000 ? "watch" : avg >= 8000 ? "good" : "steady";
    const why =
      avg < 5000
        ? `${fmtNum(Math.round(avg / 100) * 100)} a day this week. A 20-minute walk adds about 2,000 and helps you recover between workouts.${tail}`
        : `${fmtNum(Math.round(avg / 100) * 100)} a day this week.${tail}`;
    out.push({
      id: "steps",
      label: "Steps",
      display: `${fmtNum(Math.round(avg / 100) * 100)} a day`,
      value: avg,
      status: s,
      chip: avg < 5000 ? "Low" : avg >= 8000 ? "Active" : "Fair",
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
      ...missing("vo2max", "VO₂ max", "VO₂ max"),
      why: native
        ? `Comes from an Apple Watch, Fitbit, Pixel Watch or Garmin through ${store}, after outdoor walks or runs.`
        : "Comes from a watch through your phone's health app.",
    });
  else {
    const old = vo2.filter((p) => p.day <= daysBack(now, 75) && p.day >= daysBack(now, 120));
    const d = old.length ? v.value - mean(old.map((p) => p.value)) : undefined;
    const base = "The best single measure of heart fitness. Lifting barely moves it; two 20-minute hard cardio sessions a week do.";
    const [status, chip, why]: [Status, string, string] =
      d === undefined
        ? ["info", "Cardio fitness", base]
        : d <= -2
          ? ["watch", "Slipping", `Down ${fmtNum(Math.round(-d * 10) / 10)} in three months. ${base}`]
          : d >= 1
            ? ["good", "Rising", `Up ${fmtNum(Math.round(d * 10) / 10)} in three months. Keep the cardio going.`]
            : ["steady", "Steady", `Steady over three months. ${base}`];
    out.push({
      id: "vo2max",
      label: "VO₂ max",
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
    const about = "How far your heart rate falls in the first minute of rest between sets. A bigger drop means a fitter heart.";
    const [status, chip, why]: [Status, string, string] =
      d === undefined
        ? ["info", "Your baseline", `${about} A month more shows your trend.`]
        : d >= 3
          ? ["good", "Fitter", `Up from −${fmtNum(Math.round(then!))} bpm a month or more ago. ${about}`]
          : d <= -4
            ? [
                "watch",
                "Slower",
                `Down from −${fmtNum(Math.round(then!))} bpm. Tired or under-recovered hearts settle slower: check sleep and take your easy days.`,
              ]
            : ["steady", "Steady", about];
    out.push({
      id: "restDrop",
      label: "Heart rate drop in rest",
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
      label: "Heart rate drop in rest",
      display: "",
      status: "missing",
      chip: "Needs a strap",
      why: "Wear a heart rate monitor in three workouts to see how fast your heart settles between sets.",
      action: { kind: "route", route: "settings", label: "Pair a monitor" },
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
