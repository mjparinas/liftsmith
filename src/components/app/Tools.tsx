"use client";
// Tools: calculators that use what the app already knows. First up, TDEE (tdee.ts), kept current from
// weigh-ins, birthday, height, body fat and training days, with a history graph.
import { TdeeChart, TdeeResults } from "@/components/Tdee";
import { connectHealth, healthAvailable, readHeight } from "@/lib/health";
import { useApp } from "@/lib/store";
import { ACTIVITIES, ACTIVITY, currentBodyFat, currentKg, currentTdee, tdeeHistory, tdeeLog, type Activity } from "@/lib/tdee";
import type { TdeeEvent, Unit } from "@/lib/types";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import { track } from "@/lib/analytics";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { go } from "./router";
import { BumpField, Button, Chip, Section } from "./ui";
import { Icon } from "./icons";

// Screen text in one place (i18n).
const T = {
  back: "‹ Progress",
  backTools: "‹ Tools",
  tools: "Tools",
  tdeeTitle: "TDEE calculator",
  tdeeBlurb: "Calories a day to hold your weight. It stays up to date by itself from your weigh-ins, birthday and how often you train.",
  hubTdee: "Calories a day to hold your weight, tracked over time",
  fromHealth: (ios: boolean) => `Fill in from ${ios ? "Apple Health" : "Health Connect"}`,
  healthNone: "No access yet. You can allow it in your phone's health settings.",
  healthDone: "Updated from your health data.",
  you: "You",
  sex: "Sex",
  female: "Female",
  male: "Male",
  age: "Age",
  height: "Height",
  weight: "Weight",
  weightNote: "Saved as today's weigh-in. Hold + or − to go faster.",
  optional: "Your age",
  heightCm: "Height (cm)",
  heightIn: "Height (in)",
  set: "Tap + or −",
  off: "Off",
  on: "On",
  bodyFatPct: "Body fat",
  bodyFat: "Use body fat",
  bodyFatNote: "With body fat, BMR comes from lean mass (Katch-McArdle), which suits lifters.",
  activity: "Activity",
  auto: "Auto",
  autoWorkouts: (d: number, a: Activity) => `From your workouts: ${fmtNum(d)} training days a week over the last 4 weeks, so ${ACTIVITY[a].label.toLowerCase()}.`,
  autoSteps: (steps: number, d: number, a: Activity) => `From your steps and workouts: about ${fmtNum(steps)} steps a day this week and ${fmtNum(d)} training days a week, so ${ACTIVITY[a].label.toLowerCase()}.`,
  autoPlan: (d: number, a: Activity) => `From your goal of ${d} days a week (${ACTIVITY[a].label.toLowerCase()}) until there are two weeks of workouts.`,
  manual: "Picked by hand. Choose Auto to follow your workouts.",
  missing: (m: string[]) => `Add your ${m.join(", ").replace(/, ([^,]*)$/, " and $1")} to see your TDEE.`,
  results: "Your daily calories",
  overTime: "Your TDEE over time",
  changes: "Changes",
};

const DAY = 86_400_000;

export function Tools({ arg }: { arg?: string }) {
  if (arg === "tdee") return <TdeeScreen />;
  return <ToolsHub />;
}

function ToolsHub() {
  const { events, stats, profile } = useApp();
  const now = useNow(60_000);
  const cur = useMemo(() => currentTdee(events, stats.sessions, profile, now), [events, stats.sessions, profile, now]);
  return (
    <div className="pb-24">
      <button type="button" onClick={() => go("stats")} className="press -ml-2 pt-2 text-muted">{T.back}</button>
      <h1 className="text-[28px] font-extrabold tracking-tight">{T.tools}</h1>
      <ul className="mt-4 space-y-3">
        <li>
          <button type="button" onClick={() => go("tools", "tdee")} className="press card flex w-full items-center gap-4 p-4 text-left">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent"><Icon name="flame" size={22} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{T.tdeeTitle}</span>
              <span className="block text-sm text-muted">{cur.result ? `${cur.result.tdee.toLocaleString("en-US")} kcal a day` : T.hubTdee}</span>
            </span>
            <span className="text-accent" aria-hidden>›</span>
          </button>
        </li>
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
  // Number boxes use the shared BumpField (− box +, hold to repeat, typing still works). Each box keeps its
  // own text; a valid value goes to the profile straight away, and weight becomes one weigh-in 1.5 s
  // after the last change, so holding + doesn't log dozens.
  const imperial = unit === "lb";
  const [age, setAge] = useState(cur.inputs.age !== undefined ? String(cur.inputs.age) : "");
  const [height, setHeight] = useState(profile.heightCm ? String(imperial ? Math.round(profile.heightCm / 2.54) : Math.round(profile.heightCm)) : "");
  const [weight, setWeight] = useState(fmtNum(Math.round(fromKg(cur.inputs.kg ?? profile.bodyweight, unit) * 10) / 10));
  const fat = currentBodyFat(events, profile);
  const [fatText, setFatText] = useState(fat !== undefined ? fmtNum(fat) : "");
  const save = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(save.current), []);
  const [canHealth, setCanHealth] = useState(false);
  const [healthNote, setHealthNote] = useState("");
  const ios = typeof navigator !== "undefined" && /iPhone|iPad/.test(navigator.userAgent);

  useEffect(() => {
    track("feature", { name: "tdee_open" });
    void healthAvailable().then(setCanHealth);
  }, []);

  const fillFromHealth = async () => {
    if (!(await connectHealth())) return setHealthNote(T.healthNone);
    await useApp.getState().importHealthBody();
    useApp.getState().applyHealthBody(await readHeight());
    const { profile: p, events: ev } = useApp.getState();
    const kg = currentKg(ev, p);
    if (kg) setWeight(fmtNum(Math.round(fromKg(kg, unit) * 10) / 10));
    if (p.heightCm) setHeight(String(imperial ? Math.round(p.heightCm / 2.54) : Math.round(p.heightCm)));
    const fat = currentBodyFat(ev, p);
    if (fat !== undefined) setFatText(fmtNum(fat));
    setHealthNote(T.healthDone);
  };

  const onAge = (v: string) => {
    setAge(v);
    const n = Number(v);
    if (n >= 13 && n <= 100) setProfile({ birthYear: new Date(now).getFullYear() - n });
  };
  const onHeight = (v: string) => {
    setHeight(v);
    const cm = Number(v) * (imperial ? 2.54 : 1);
    if (cm >= 100 && cm <= 250) setProfile({ heightCm: Math.round(cm * 10) / 10 });
  };
  const onWeight = (v: string) => {
    setWeight(v);
    clearTimeout(save.current);
    const kg = Math.round(toKg(Number(v), unit) * 10) / 10;
    if (!(kg >= 25 && kg <= 350)) return;
    save.current = setTimeout(() => {
      if (Math.abs(kg - currentKg(useApp.getState().events, useApp.getState().profile)) >= 0.05) logBodyweight(kg);
    }, 1500);
  };
  const onFat = (v: string) => {
    setFatText(v);
    const n = Number(v);
    if (v && n >= 3 && n <= 60) setProfile({ bodyFat: { pct: n, at: Date.now() }, tdee: { ...useApp.getState().profile.tdee, useBodyFat: true } });
  };
  const setActivity = (a: Activity | undefined) => setProfile({ tdee: { ...profile.tdee, activity: a } });
  const a = cur.activity;
  const useFat = fat !== undefined && profile.tdee?.useBodyFat !== false;

  return (
    <div className="pb-24">
      <button type="button" onClick={() => go("tools")} className="press -ml-2 pt-2 text-muted">{T.backTools}</button>
      <h1 className="text-[28px] font-extrabold tracking-tight">{T.tdeeTitle}</h1>
      <p className="mt-1 text-sm text-muted">{T.tdeeBlurb}</p>

      <Section title={T.you}>
        <div className="card space-y-4 p-4">
          {canHealth && (
            <div>
              <Button kind="ghost" className="w-full" onClick={() => void fillFromHealth()}>{T.fromHealth(ios)}</Button>
              {healthNote && <p className="mt-2 text-sm text-muted" role="status">{healthNote}</p>}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold" id="tdee-sex">{T.sex}</span>
            <div className="flex gap-2" role="group" aria-labelledby="tdee-sex">
              <Chip active={profile.sex === "female"} onClick={() => setProfile({ sex: "female" })}>{T.female}</Chip>
              <Chip active={profile.sex === "male"} onClick={() => setProfile({ sex: "male" })}>{T.male}</Chip>
            </div>
          </div>
          <Row id="tdee-age" label={T.age}>
            <BumpField id="tdee-age" label={T.age.toLowerCase()} value={age} onChange={onAge} step={1} start={30} min={13} max={100} placeholder={T.optional} />
          </Row>
          <Row id="tdee-height" label={imperial ? T.heightIn : T.heightCm}>
            <BumpField id="tdee-height" label={T.height.toLowerCase()} value={height} onChange={onHeight} step={1} start={imperial ? (profile.sex === "female" ? 64 : 70) : profile.sex === "female" ? 163 : 177} min={imperial ? 40 : 100} max={imperial ? 98 : 250} />
          </Row>
          <div>
            <Row id="tdee-weight" label={`${T.weight} (${unit})`}>
              <BumpField id="tdee-weight" label={T.weight.toLowerCase()} value={weight} onChange={onWeight} step={imperial ? 0.5 : 0.1} start={Math.round(fromKg(profile.bodyweight, unit))} min={imperial ? 55 : 25} max={imperial ? 770 : 350} />
            </Row>
            <p className="mt-1 text-xs text-faint">{T.weightNote}</p>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold" id="tdee-fat-on">{T.bodyFat}</span>
              <div className="flex gap-2" role="group" aria-labelledby="tdee-fat-on">
                <Chip active={!useFat} onClick={() => setProfile({ tdee: { ...profile.tdee, useBodyFat: false } })}>{T.off}</Chip>
                <Chip active={useFat} onClick={() => (fat === undefined ? onFat(profile.sex === "female" ? "25" : "18") : setProfile({ tdee: { ...profile.tdee, useBodyFat: true } }))}>{T.on}</Chip>
              </div>
            </div>
            {useFat && (
              <div className="mt-3">
                <Row id="tdee-fat" label={T.bodyFatPct}>
                  <BumpField id="tdee-fat" label="body fat" value={fatText} onChange={onFat} step={0.5} start={20} min={3} max={60} />
                </Row>
              </div>
            )}
            <p className="mt-1 text-xs text-faint">{T.bodyFatNote}</p>
          </div>
        </div>
      </Section>

      <Section title={T.activity}>
        <div className="flex flex-wrap gap-2">
          <Chip active={a.source !== "manual"} onClick={() => setActivity(undefined)}>{T.auto}</Chip>
          {ACTIVITIES.map((x) => <Chip key={x} active={a.source === "manual" && a.activity === x} onClick={() => setActivity(x)}>{ACTIVITY[x].label}</Chip>)}
        </div>
        <p className="mt-2 text-sm text-muted">{a.source === "steps" ? T.autoSteps(a.steps ?? 0, a.perWeek, a.activity) : a.source === "workouts" ? T.autoWorkouts(a.perWeek, a.activity) : a.source === "plan" ? T.autoPlan(a.perWeek, a.activity) : T.manual}</p>
      </Section>

      <Section title={T.results}>
        {cur.result ? <TdeeResults r={cur.result} activity={a.activity} /> : <p className="card p-4 text-muted">{T.missing(cur.missing)}</p>}
      </Section>

      <Section title={T.overTime} icon="progress">
        <TdeeChart points={history} now={now} />
        {log.length > 0 && (
          <ul className="card mt-3 divide-y divide-line" aria-label={T.changes}>
            {[...log].reverse().slice(0, 12).map((e, i, arr) => (
              <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">{whyText(e, arr[i + 1], unit)}</div>
                  <div className="text-xs text-muted">{new Date(e.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: now - e.at > 300 * DAY ? "numeric" : undefined })}</div>
                </div>
                <div className="num shrink-0 text-right">
                  <div className="font-semibold">{e.kcal.toLocaleString("en-US")}</div>
                  {arr[i + 1] && <div className="text-xs text-muted">{e.kcal >= arr[i + 1].kcal ? "+" : ""}{e.kcal - arr[i + 1].kcal}</div>}
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
      <label htmlFor={id} className="shrink-0 font-semibold">{label}</label>
      <div className="w-48 max-w-[60%]">{children}</div>
    </div>
  );
}


/** Why a snapshot was recorded, in words. */
export function whyText(e: TdeeEvent, prev: TdeeEvent | undefined, unit: Unit): string {
  const parts = e.changes.map((c) => {
    switch (c) {
      case "first": return "First calculation";
      case "weight": {
        const w = `${fmtNum(Math.round(fromKg(e.kg, unit) * 10) / 10)} ${unit}`;
        if (!prev) return `Weight ${w}`;
        return `Weight ${e.kg > prev.kg ? "up" : "down"} to ${w}`;
      }
      case "activity": return `${ACTIVITY[e.activity].label}${e.steps !== undefined && e.activitySource === "steps" ? ` (${fmtNum(e.steps)} steps a day)` : e.perWeek !== undefined && e.activitySource === "workouts" ? ` (${fmtNum(e.perWeek)} days a week)` : ""}`;
      case "age": return `Turned ${e.age}`;
      case "height": return "Height updated";
      case "sex": return "Sex updated";
      case "bodyFat": return e.bodyFat !== undefined ? `Body fat ${fmtNum(e.bodyFat)}%` : "Body fat removed";
      default: return "Recalculated";
    }
  });
  return parts.join(" · ");
}

