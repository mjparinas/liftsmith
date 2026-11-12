"use client";

// Tools: calculators that use what the app already knows. TDEE (tdee.ts) is drawn here, kept current from
// Your stats (BodyStats.tsx), weigh-ins, body fat and training days, with a history graph. The others each have
// their own file in ./tools/ and an entry in TOOLS, which is the hub's list and the router for #/tools/<arg>.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { TdeeChart, TdeeResults } from "@/components/Tdee";
import { track } from "@/lib/analytics";
import { ffmi, tanakaMax } from "@/lib/calculators";
import { date, inSentence, list, num, t } from "@/lib/i18n";
import { allOneRms, dotsBand, dotsFromData } from "@/lib/onerm";
import { useApp } from "@/lib/store";
import { STRETCHES } from "@/lib/stretches";
import {
  ACTIVITIES,
  ACTIVITY,
  currentBodyFat,
  currentKg,
  currentTdee,
  parseBodyFat,
  tdeeHistory,
  tdeeLog,
  type Activity,
} from "@/lib/tdee";
import type { TdeeEvent, Unit } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { StatsSummary } from "./BodyStats";
import { Icon, type IconName } from "./icons";
import { go } from "./router";
import { HUE } from "./theme";
import { BodyFatTool } from "./tools/BodyFatTool";
import { FfmiTool } from "./tools/FfmiTool";
import { HrZonesTool } from "./tools/HrZonesTool";
import { IntervalTool } from "./tools/IntervalTool";
import { MacrosTool } from "./tools/MacrosTool";
import { OneRmTool } from "./tools/OneRmTool";
import { PlateTool } from "./tools/PlateTool";
import { StrengthTool } from "./tools/StrengthTool";
import { WarmupTool } from "./tools/WarmupTool";
import { BumpField, Chip, ScreenHeader, Section } from "./ui";

const level = (a: Activity) => inSentence(ACTIVITY[a].label, true);
const kcal = (n: number) => num(n);

const DAY = 86_400_000;

export function Tools({ arg }: { arg?: string }) {
  if (arg === "tdee") return <TdeeScreen />;
  const tool = TOOLS.find((x) => x.arg === arg);
  if (tool?.screen) return <tool.screen />;
  return <ToolsHub />;
}

/** One row on the Tools hub: where it goes, its icon and tint, and a line that's the lifter's own number when there is one. */
interface ToolEntry {
  arg: string;
  icon: IconName;
  tint: string;
  title: () => string;
  line: (ctx: HubCtx) => string;
  /** The screen at #/tools/<arg>; TDEE is drawn in this file, stretching is its own route. */
  screen?: () => ReactNode;
  go?: () => void;
}

interface HubCtx {
  tdee: ReturnType<typeof currentTdee>;
  dots: number | null;
  maxes: number;
  ffmi: number | null;
  hrMax?: number;
}

// The order lifters reach for them: calories and food, strength numbers, body, then the timer and stretching.
const TOOLS: ToolEntry[] = [
  {
    arg: "tdee",
    icon: "flame",
    tint: HUE.ember,
    title: () => t("tdee.title"),
    line: ({ tdee }) => (tdee.result ? t("tdee.hubValue", { kcal: kcal(tdee.result.tdee) }) : t("tdee.hub")),
  },
  {
    arg: "macros",
    icon: "leaf",
    tint: HUE.mint,
    title: () => t("calc.mac.title"),
    line: () => t("calc.mac.hub"),
    screen: MacrosTool,
  },
  {
    arg: "onerm",
    icon: "target",
    tint: HUE.accent,
    title: () => t("calc.orm.title"),
    line: ({ maxes }) => (maxes ? t("calc.orm.hubValue", { count: maxes }) : t("calc.orm.hub")),
    screen: OneRmTool,
  },
  {
    arg: "plates",
    icon: "dumbbell",
    tint: HUE.accent,
    title: () => t("tools.plate.title"),
    line: () => t("tools.plate.hub"),
    screen: PlateTool,
  },
  {
    arg: "warmup",
    icon: "layers",
    tint: HUE.accent,
    title: () => t("tools.warm.title"),
    line: () => t("tools.warm.hub"),
    screen: WarmupTool,
  },
  {
    arg: "strength",
    icon: "trophy",
    tint: HUE.gold,
    title: () => t("calc.str.title"),
    line: ({ dots: d }) => (d !== null ? t("calc.str.hubValue", { score: fmtNum(Math.round(d)), band: dotsBand(d) }) : t("calc.str.hub")),
    screen: StrengthTool,
  },
  {
    arg: "bodyfat",
    icon: "layers",
    tint: HUE.violet,
    title: () => t("calc.bf.title"),
    line: () => t("calc.bf.hub"),
    screen: BodyFatTool,
  },
  {
    arg: "ffmi",
    icon: "dumbbell",
    tint: HUE.violet,
    title: () => t("calc.ffmi.title"),
    line: ({ ffmi: f }) => (f !== null ? t("calc.ffmi.hubValue", { value: fmtNum(Math.round(f * 10) / 10) }) : t("calc.ffmi.hub")),
    screen: FfmiTool,
  },
  {
    arg: "hrzones",
    icon: "heart",
    tint: HUE.ember,
    title: () => t("calc.hr.title"),
    line: ({ hrMax }) => (hrMax ? t("calc.hr.hubValue", { bpm: num(hrMax) }) : t("calc.hr.hub")),
    screen: HrZonesTool,
  },
  {
    arg: "intervals",
    icon: "clock",
    tint: HUE.cyan,
    title: () => t("calc.itv.title"),
    line: () => t("calc.itv.hub"),
    screen: IntervalTool,
  },
  {
    arg: "stretch",
    icon: "stretch",
    tint: HUE.cyan,
    title: () => t("str.hub"),
    line: () => t("str.hubBody", { count: STRETCHES.length }),
    go: () => go("stretch"),
  },
];

function ToolsHub() {
  const { events, stats, profile } = useApp();
  const now = useNow(60_000);
  const ctx = useMemo<HubCtx>(() => {
    const kg = currentKg(events, profile);
    const fat = currentBodyFat(events, profile);
    const f = profile.heightCm && fat !== undefined ? ffmi(kg, profile.heightCm, fat) : null;
    const age = profile.birthYear ? new Date(now).getFullYear() - profile.birthYear : undefined;
    return {
      tdee: currentTdee(events, stats.sessions, profile, now),
      dots: profile.sex ? dotsFromData(events, profile, now, profile.sex).score : null,
      maxes: allOneRms(events, now, profile).length,
      ffmi: f?.normalized ?? null,
      hrMax: profile.hrMax ?? (age !== undefined ? tanakaMax(age) : undefined),
    };
  }, [events, stats.sessions, profile, now]);
  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: t("tools.back"), onClick: () => go("stats") }} title={t("tools.title")} />
      <ul className="mt-4 space-y-3">
        {TOOLS.map((x) => (
          <li key={x.arg}>
            <button
              type="button"
              onClick={x.go ?? (() => go("tools", x.arg))}
              className="press card flex w-full items-center gap-4 p-4 text-left"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                style={{ background: `color-mix(in srgb, ${x.tint} 15%, transparent)`, color: x.tint }}
              >
                <Icon name={x.icon} size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{x.title()}</span>
                <span className="block text-sm text-muted">{x.line(ctx)}</span>
              </span>
              <span className="text-accent" aria-hidden>
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TdeeScreen() {
  const { events, stats, profile, setProfile, logBodyweight } = useApp();
  const now = useNow(60_000);
  const unit = profile.unit;
  const cur = useMemo(() => currentTdee(events, stats.sessions, profile, now), [events, stats.sessions, profile, now]);
  const history = useMemo(() => tdeeHistory(events), [events]);
  const log = useMemo(() => tdeeLog(events), [events]);
  // Sex, age, height and weight live in Your stats (BodyStats.tsx), the one place every tool reads them
  // from; this screen shows them with one link there. Body fat stays here, because using it is a choice
  // about the formula.
  const fat = currentBodyFat(events, profile);
  const [fatText, setFatText] = useState(fat !== undefined ? fmtNum(fat) : "");
  const save = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(save.current), []);

  useEffect(() => {
    track("feature", { name: "tdee_open" });
  }, []);

  // Body fat becomes a weigh-in (with the current weight) 1.5 s after the last change, so the reading reaches
  // the trend lines, the health twin and coach's notes, not just this calculator.
  const pending = useRef<{ fat?: number }>({});
  const persist = () => {
    clearTimeout(save.current);
    save.current = setTimeout(() => {
      const { events: ev, profile: p } = useApp.getState();
      const curKg = currentKg(ev, p);
      const { fat: pct } = pending.current;
      pending.current = {};
      const fatChanged =
        pct !== undefined &&
        pct !==
          currentBodyFat(
            ev.filter((e) => e.type === "bodyweight"),
            { ...p, bodyFat: undefined },
          );
      if (fatChanged) logBodyweight(curKg, pct);
    }, 1500);
  };
  // `record` is false for the typical value filled in when body fat is switched on: a guess, not a reading,
  // so it stays out of the weigh-ins (and coach's notes) until the lifter changes it.
  const onFat = (v: string, record = true) => {
    setFatText(v);
    const n = parseBodyFat(v);
    if (n === undefined) return;
    setProfile({ bodyFat: { pct: n, at: Date.now() }, tdee: { ...useApp.getState().profile.tdee, useBodyFat: true } });
    if (!record) return;
    pending.current.fat = n;
    persist();
  };
  const setActivity = (a: Activity | undefined) => setProfile({ tdee: { ...profile.tdee, activity: a } });
  const a = cur.activity;
  const useFat = fat !== undefined && profile.tdee?.useBodyFat !== false;

  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: t("tools.backTools"), onClick: () => go("tools") }} title={t("tdee.title")} />
      <p className="mt-1 text-sm text-muted">{t("tdee.blurb")}</p>

      <Section title={t("tdee.you")}>
        <StatsSummary need={["sex", "age", "height"]} />
        <div className="card mt-3 space-y-4 p-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold" id="tdee-fat-on">
                {t("tdee.bodyFat")}
              </span>
              <div className="flex gap-2" role="group" aria-labelledby="tdee-fat-on">
                <Chip active={!useFat} onClick={() => setProfile({ tdee: { ...profile.tdee, useBodyFat: false } })}>
                  {t("tdee.off")}
                </Chip>
                <Chip
                  active={useFat}
                  onClick={() =>
                    fat === undefined
                      ? onFat(profile.sex === "female" ? "25" : "18", false)
                      : setProfile({ tdee: { ...profile.tdee, useBodyFat: true } })
                  }
                >
                  {t("tdee.on")}
                </Chip>
              </div>
            </div>
            {useFat && (
              <div className="mt-3">
                <Row id="tdee-fat" label={t("tdee.bodyFatPct")}>
                  <BumpField
                    id="tdee-fat"
                    label={inSentence(t("tdee.bodyFatPct"), true)}
                    value={fatText}
                    onChange={onFat}
                    step={0.5}
                    start={20}
                    min={3}
                    max={60}
                  />
                </Row>
              </div>
            )}
            <p className="mt-1 text-xs text-faint">{t("tdee.bodyFatNote")}</p>
          </div>
        </div>
      </Section>

      <Section title={t("tdee.activity")}>
        <div className="flex flex-wrap gap-2">
          <Chip active={a.source !== "manual"} onClick={() => setActivity(undefined)}>
            {t("tdee.auto")}
          </Chip>
          {ACTIVITIES.map((x) => (
            <Chip key={x} active={a.source === "manual" && a.activity === x} onClick={() => setActivity(x)}>
              {ACTIVITY[x].label}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">
          {a.source === "steps"
            ? t("tdee.autoSteps", { steps: fmtNum(a.steps ?? 0), days: fmtNum(a.perWeek), level: level(a.activity) })
            : a.source === "workouts"
              ? t("tdee.autoWorkouts", { days: fmtNum(a.perWeek), level: level(a.activity) })
              : a.source === "plan"
                ? t("tdee.autoPlan", { days: a.perWeek, level: level(a.activity) })
                : t("tdee.manual")}
        </p>
      </Section>

      <Section title={t("tdee.results")}>
        {cur.result ? (
          <TdeeResults r={cur.result} activity={a.activity} />
        ) : (
          <p className="card p-4 text-muted">{t("tdee.missing", { items: list(cur.missing.map((m) => t(`tdee.missing.${m}`))) })}</p>
        )}
      </Section>

      <Section title={t("tdee.overTime")} icon="progress">
        <TdeeChart points={history} now={now} />
        {log.length > 0 && (
          <ul className="card mt-3 divide-y divide-line" aria-label={t("tdee.changes")}>
            {[...log]
              .reverse()
              .slice(0, 12)
              .map((e, i, arr) => (
                <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{whyText(e, arr[i + 1], unit)}</div>
                    <div className="text-xs text-muted">
                      {date(e.at, { month: "short", day: "numeric", year: now - e.at > 300 * DAY ? "numeric" : undefined })}
                    </div>
                  </div>
                  <div className="num shrink-0 text-right">
                    <div className="font-semibold">{kcal(e.kcal)}</div>
                    {arr[i + 1] && (
                      <div className="text-xs text-muted">
                        {e.kcal >= arr[i + 1].kcal ? "+" : ""}
                        {e.kcal - arr[i + 1].kcal}
                      </div>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Row({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="shrink-0 font-semibold">
        {label}
      </label>
      <div className="w-48 max-w-[60%]">{children}</div>
    </div>
  );
}

/** Why a snapshot was recorded, in words. */
export function whyText(e: TdeeEvent, prev: TdeeEvent | undefined, unit: Unit): string {
  const parts = e.changes.map((c) => {
    switch (c) {
      case "first":
        return t("tdee.why.first");
      case "weight": {
        const w = `${fmtNum(Math.round(fromKg(e.kg, unit) * 10) / 10)} ${unit}`;
        if (!prev) return t("tdee.why.weight", { w });
        return t(e.kg > prev.kg ? "tdee.why.weightUp" : "tdee.why.weightDown", { w });
      }
      case "activity":
        return e.steps !== undefined && e.activitySource === "steps"
          ? t("tdee.why.steps", { level: ACTIVITY[e.activity].label, steps: fmtNum(e.steps) })
          : e.perWeek !== undefined && e.activitySource === "workouts"
            ? t("tdee.why.days", { level: ACTIVITY[e.activity].label, days: fmtNum(e.perWeek) })
            : ACTIVITY[e.activity].label;
      case "age":
        return t("tdee.why.age", { age: e.age ?? "" });
      case "height":
        return t("tdee.why.height");
      case "sex":
        return t("tdee.why.sex");
      case "bodyFat":
        return e.bodyFat !== undefined ? t("tdee.why.bodyFat", { pct: fmtNum(e.bodyFat) }) : t("tdee.why.bodyFatOff");
      default:
        return t("tdee.why.other");
    }
  });
  return parts.join(" · ");
}
