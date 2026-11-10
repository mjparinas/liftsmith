"use client";

// Tools: calculators that use what the app already knows. First up, TDEE (tdee.ts), kept current from
// weigh-ins, birthday, height, body fat and training days, with a history graph.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { TdeeChart, TdeeResults } from "@/components/Tdee";
import { track } from "@/lib/analytics";
import { connectHealth, healthAvailable, readHeight } from "@/lib/health";
import { date, list, num, t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
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
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { Icon } from "./icons";
import { go } from "./router";
import { BumpField, Button, Chip, Section } from "./ui";

const level = (a: Activity) => ACTIVITY[a].label.toLocaleLowerCase();
const kcal = (n: number) => num(n);

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
      <button type="button" onClick={() => go("stats")} className="press -ml-2 pt-2 text-muted">
        {t("tools.back")}
      </button>
      <h1 className="text-[28px] font-extrabold tracking-tight">{t("tools.title")}</h1>
      <ul className="mt-4 space-y-3">
        <li>
          <button type="button" onClick={() => go("tools", "tdee")} className="press card flex w-full items-center gap-4 p-4 text-left">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
              <Icon name="flame" size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t("tdee.title")}</span>
              <span className="block text-sm text-muted">
                {cur.result ? t("tdee.hubValue", { kcal: kcal(cur.result.tdee) }) : t("tdee.hub")}
              </span>
            </span>
            <span className="text-accent" aria-hidden>
              ›
            </span>
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
  const [height, setHeight] = useState(
    profile.heightCm ? String(imperial ? Math.round(profile.heightCm / 2.54) : Math.round(profile.heightCm)) : "",
  );
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
    if (!(await connectHealth())) return setHealthNote(t("tdee.healthNone"));
    await useApp.getState().importHealthBody();
    useApp.getState().applyHealthBody(await readHeight());
    const { profile: p, events: ev } = useApp.getState();
    const kg = currentKg(ev, p);
    if (kg) setWeight(fmtNum(Math.round(fromKg(kg, unit) * 10) / 10));
    if (p.heightCm) setHeight(String(imperial ? Math.round(p.heightCm / 2.54) : Math.round(p.heightCm)));
    const fat = currentBodyFat(ev, p);
    if (fat !== undefined) setFatText(fmtNum(fat));
    setHealthNote(t("tdee.healthDone"));
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
  // Weight and body fat become one weigh-in 1.5 s after the last change to either, so the reading reaches
  // the trend lines, the health twin and coach's notes, not just this calculator.
  const pending = useRef<{ kg?: number; fat?: number }>({});
  const persist = () => {
    clearTimeout(save.current);
    save.current = setTimeout(() => {
      const { events: ev, profile: p } = useApp.getState();
      const curKg = currentKg(ev, p);
      const { kg = curKg, fat: pct } = pending.current;
      pending.current = {};
      const kgChanged = Math.abs(kg - curKg) >= 0.05;
      const fatChanged =
        pct !== undefined &&
        pct !==
          currentBodyFat(
            ev.filter((e) => e.type === "bodyweight"),
            { ...p, bodyFat: undefined },
          );
      if (kgChanged || fatChanged) logBodyweight(kg, fatChanged ? pct : undefined);
    }, 1500);
  };
  const onWeight = (v: string) => {
    setWeight(v);
    const kg = Math.round(toKg(Number(v), unit) * 10) / 10;
    if (!(kg >= 25 && kg <= 350)) return;
    pending.current.kg = kg;
    persist();
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
    <div className="pb-24">
      <button type="button" onClick={() => go("tools")} className="press -ml-2 pt-2 text-muted">
        {t("tools.backTools")}
      </button>
      <h1 className="text-[28px] font-extrabold tracking-tight">{t("tdee.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("tdee.blurb")}</p>

      <Section title={t("tdee.you")}>
        <div className="card space-y-4 p-4">
          {canHealth && (
            <div>
              <Button kind="ghost" className="w-full" onClick={() => void fillFromHealth()}>
                {t("tdee.fromHealth", { source: ios ? "Apple Health" : "Health Connect" })}
              </Button>
              {healthNote && (
                <p className="mt-2 text-sm text-muted" role="status">
                  {healthNote}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold" id="tdee-sex">
              {t("tdee.sex")}
            </span>
            <div className="flex gap-2" role="group" aria-labelledby="tdee-sex">
              <Chip active={profile.sex === "female"} onClick={() => setProfile({ sex: "female" })}>
                {t("tdee.female")}
              </Chip>
              <Chip active={profile.sex === "male"} onClick={() => setProfile({ sex: "male" })}>
                {t("tdee.male")}
              </Chip>
            </div>
          </div>
          <Row id="tdee-age" label={t("tdee.age")}>
            <BumpField
              id="tdee-age"
              label={t("tdee.age").toLocaleLowerCase()}
              value={age}
              onChange={onAge}
              step={1}
              start={30}
              min={13}
              max={100}
              placeholder={t("tdee.agePlaceholder")}
            />
          </Row>
          <Row id="tdee-height" label={imperial ? t("tdee.heightIn") : t("tdee.heightCm")}>
            <BumpField
              id="tdee-height"
              label={t("tdee.height").toLocaleLowerCase()}
              value={height}
              onChange={onHeight}
              step={1}
              start={imperial ? (profile.sex === "female" ? 64 : 70) : profile.sex === "female" ? 163 : 177}
              min={imperial ? 40 : 100}
              max={imperial ? 98 : 250}
            />
          </Row>
          <div>
            <Row id="tdee-weight" label={t("tdee.weightUnit", { unit })}>
              <BumpField
                id="tdee-weight"
                label={t("tdee.weight").toLocaleLowerCase()}
                value={weight}
                onChange={onWeight}
                step={imperial ? 0.5 : 0.1}
                start={Math.round(fromKg(profile.bodyweight, unit))}
                min={imperial ? 55 : 25}
                max={imperial ? 770 : 350}
              />
            </Row>
            <p className="mt-1 text-xs text-faint">{t("tdee.weightNote")}</p>
          </div>
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
                    label={t("tdee.bodyFatPct").toLocaleLowerCase()}
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
