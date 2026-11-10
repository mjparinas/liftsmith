"use client";

// Settings (restructured 2026-11-10, Melvin approved the audit): Liftsmith Pro first, then Account, then one
// row per group, each opening its own page (#/settings/<group>) with a line saying what's in it. Every
// setting lives in exactly one group. Old deep links still land: #/settings/saving opens Your data at
// Saving and backup, #/settings/themes and #/settings/accessibility open Look and feel at that section.
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cleanA11y, TEXT_SIZES, type Colours, type Contrast, type Hand, type TextSize } from "@/lib/a11y";
import { analyticsOn, installId, setAnalytics } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { entActive, useBilling } from "@/lib/billing";
import { BRAND } from "@/lib/brand";
import { saveFile, setsCsv, stamp } from "@/lib/exportData";
import { flag, setLocalFlag } from "@/lib/flags";
import type { Term } from "@/lib/glossary";
import { LANG_NAME, LANGS, t, type LangPref } from "@/lib/i18n";
import { feel } from "@/lib/juice";
import { erasePhotos } from "@/lib/photos";
import { deleteEmail } from "@/lib/reminders";
import { SITE_URL } from "@/lib/site";
import { useApp } from "@/lib/store";
import type { Experience, Goal, Variability } from "@/lib/types";
import { fromKg, plainNum } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { CalendarSettings } from "./CalendarSettings";
import { CycleSettings } from "./CycleSettings";
import { DelightSettings } from "./DelightSettings";
import { Icon, type IconName } from "./icons";
import { ImportWorkouts } from "./ImportCsv";
import { MessageSettings } from "./MessageSettings";
import { programName } from "./Programs";
import { go, useRoute } from "./router";
import { SavingSettings } from "./Saving";
import { RestTimerSettings } from "./TrainingSettings";
import { Button, Chip, Section, SwitchRow } from "./ui";

const GROUPS = ["training", "workout", "reminders", "look", "body", "data"] as const;
type Group = (typeof GROUPS)[number];

const GROUP_ICON: Record<Group, IconName> = {
  training: "target",
  workout: "dumbbell",
  reminders: "clock",
  look: "sparkle",
  body: "heart",
  data: "lock",
};

/** Old deep links into the single long Settings screen, and the group (and section) they open now. */
const LEGACY: Record<string, [Group, string]> = {
  saving: ["data", "saving"],
  themes: ["look", "themes"],
  accessibility: ["look", "accessibility"],
};

function Row<T extends string | number>({
  label,
  value,
  options,
  onPick,
  info,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onPick: (v: T) => void;
  info?: Term;
}) {
  return (
    <Section title={label} info={info}>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <Chip key={String(v)} active={v === value} onClick={() => onPick(v)}>
            {l}
          </Chip>
        ))}
      </div>
    </Section>
  );
}

/** A row that opens another page: a title, a line saying what's there, and a chevron. The whole row is the one button. */
function NavRow({ title, sub, icon, onClick }: { title: string; sub?: string; icon?: IconName; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="press card flex w-full items-center gap-3 px-4 py-3 text-left">
      {icon && (
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-raised text-accent">
          <Icon name={icon} size={20} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        {sub && <span className="block text-sm text-muted">{sub}</span>}
      </span>
      <span aria-hidden className="text-faint">
        ›
      </span>
    </button>
  );
}

/** Liftsmith Pro, first on Settings and the one tinted card there (Melvin, 2026-11-10: "it should be at the very top"). */
function ProCard() {
  const { live, ent } = useBilling();
  const now = useNow(60_000);
  const pro = !live || entActive(ent, now);
  const status = !live
    ? t("pro.settings.unlocked")
    : entActive(ent, now)
      ? ent?.plan === "monthly"
        ? t("pro.status.monthly")
        : t("pro.status.yearly")
      : t("pro.settings.free");
  return (
    <section
      className="card card-tint mt-4 p-4"
      style={{ "--tint": "var(--color-violet)" } as React.CSSProperties}
      aria-labelledby="pro-card"
    >
      <h2 id="pro-card" className="text-lg font-bold">
        {t("pro.settings")}
      </h2>
      <p className="mt-1 text-sm text-ink">{status}</p>
      {!pro && <p className="mt-1 text-sm text-muted">{t("settings.pro.lead")}</p>}
      <Button className="mt-3 w-full" icon="sparkle" onClick={() => go("pro", "settings")}>
        {pro && live ? t("settings.pro.manage") : t("pro.settings.see")}
      </Button>
    </section>
  );
}

/** Settings' second row: sign in to back up and sync, or who's signed in. */
function AccountRow() {
  const account = useAccount((s) => s.account);
  return (
    <div className="mt-3">
      <NavRow
        title={t("account.row")}
        sub={account ? (account.email ? t("account.row.in", { email: account.email }) : t("account.syncNow")) : t("account.row.out")}
        icon="link"
        onClick={() => go("account")}
      />
    </div>
  );
}

export function Settings() {
  const { profile } = useApp();
  const { arg } = useRoute();
  const legacy = arg ? LEGACY[arg] : undefined;
  const group: Group | null = legacy ? legacy[0] : (GROUPS as readonly string[]).includes(arg ?? "") ? (arg as Group) : null;
  const anchor = legacy?.[1];
  useEffect(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView?.({ block: "start" });
  }, [anchor]);
  const taps = useRef<number[]>([]);
  const [motionNote, setMotionNote] = useState("");

  if (group) return <GroupPage group={group} />;

  const goal = t(`goal.${profile.goal}`);
  const program = programName(profile.planSource?.kind === "program" ? profile.planSource.id : undefined) ?? t("settings.adaptive");
  const sums: Record<Group, string> = {
    training: t("settings.g.training.sum", { program, goal, count: profile.daysPerWeek }),
    workout: t("settings.g.workout.sum"),
    reminders: t("settings.g.reminders.sum"),
    look: t("settings.g.look.sum"),
    body: t("settings.g.body.sum"),
    data: t("settings.g.data.sum"),
  };
  return (
    <div className="pb-24">
      <button type="button" onClick={() => go("today")} className="press -ml-2 pt-2 text-muted">
        ‹ {t("nav.back.today")}
      </button>
      {/* Five quick taps on the title switch phone-motion rep counting on or off (the `repMotion` flag, for testing; docs/decisions/camera-rep-counting.md). */}
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">
        <button
          type="button"
          className="cursor-default"
          onClick={() => {
            const now = Date.now();
            taps.current = [...taps.current.filter((x) => now - x < 2000), now];
            if (taps.current.length >= 5) {
              taps.current = [];
              const on = !flag("repMotion");
              setLocalFlag("repMotion", on);
              setMotionNote(on ? t("settings.motionOn") : t("settings.motionOff"));
            }
          }}
        >
          {t("settings.title")}
        </button>
      </h1>
      {motionNote && (
        <p className="mt-2 text-sm text-muted" role="status">
          {motionNote}
        </p>
      )}
      <ProCard />
      <AccountRow />
      <div className="mt-2">
        <NavRow title={t("conn.row")} sub={t("conn.rowNote")} icon="link" onClick={() => go("connections")} />
      </div>
      <ul className="mt-3 space-y-2">
        {GROUPS.map((g) => (
          <li key={g}>
            <NavRow title={t(`settings.g.${g}`)} sub={sums[g]} icon={GROUP_ICON[g]} onClick={() => go("settings", g)} />
          </li>
        ))}
      </ul>
      <Section title={t("settings.g.help")}>
        <NavRow title={t("settings.feedback")} onClick={() => go("feedback")} />
      </Section>
      <p className="mt-8 text-center text-xs text-faint">{t("settings.footer", { brand: BRAND.name })}</p>
    </div>
  );
}

/** One group's page: "‹ Settings", its title, and its settings. */
function GroupPage({ group }: { group: Group }) {
  const body: Record<Group, ReactNode> = {
    training: <TrainingGroup />,
    workout: <WorkoutGroup />,
    reminders: <MessageSettings />,
    look: <LookGroup />,
    body: <BodyGroup />,
    data: <DataGroup />,
  };
  return (
    <div className="pb-24">
      <button type="button" onClick={() => go("settings")} className="press -ml-2 min-h-11 pt-2 text-muted">
        {t("settings.back")}
      </button>
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">{t(`settings.g.${group}`)}</h1>
      {body[group]}
    </div>
  );
}

/** Training: what the plan is built for, when you train, injuries, and the rarer block options. */
function TrainingGroup() {
  const { profile, setProfile } = useApp();
  return (
    <>
      <Section title={t("settings.program")}>
        <NavRow
          title={programName(profile.planSource?.kind === "program" ? profile.planSource.id : undefined) ?? t("settings.adaptive")}
          sub={t("settings.change")}
          onClick={() => go("programs")}
        />
      </Section>
      <Row<Goal>
        label={t("settings.goal")}
        value={profile.goal}
        onPick={(goal) => setProfile({ goal })}
        options={[
          ["muscle", t("goal.muscle")],
          ["strength", t("goal.strength")],
          ["general", t("goal.general")],
        ]}
      />
      <Row<Experience>
        label={t("settings.experience")}
        value={profile.experience}
        onPick={(experience) => setProfile({ experience })}
        options={[
          ["new", t("exp.new")],
          ["intermediate", t("exp.intermediate")],
          ["advanced", t("exp.advanced")],
        ]}
      />
      <CalendarSettings />
      <div className="mt-6">
        <NavRow title={t("settings.injuries")} icon="heart" onClick={() => go("injuries")} />
      </div>
      <Section title={t("settings.more")}>
        <Row<Variability>
          info="variety"
          label={t("settings.variety")}
          value={profile.variability}
          onPick={(variability) => setProfile({ variability })}
          options={[
            ["consistent", t("variety.consistent")],
            ["balanced", t("variety.balanced")],
            ["variable", t("variety.variable")],
          ]}
        />
        <Row<number>
          info="deloadWeeks"
          label={t("settings.block")}
          value={profile.blockWeeks}
          onPick={(blockWeeks) => setProfile({ blockWeeks })}
          options={[3, 4, 5, 6].map((d) => [d, t("settings.weeks", { count: d })])}
        />
        <Section title={t("settings.trainingBlock")} info="blockWeek">
          <Button kind="ghost" className="w-full" onClick={() => setProfile({ blockStart: Date.now() })}>
            {t("settings.newBlock")}
          </Button>
        </Section>
      </Section>
      <Button kind="ghost" className="mt-6 w-full" onClick={() => go("setup")}>
        {t("settings.rerun")}
      </Button>
    </>
  );
}

/** Workout: what happens while you lift. One-handed controls first, then sounds, the rest timer and the extras between sets. */
function WorkoutGroup() {
  const { profile, setProfile } = useApp();
  const a = cleanA11y(profile.a11y);
  return (
    <>
      <div id="one-handed">
        <Row<Hand>
          label={t("a11y.hand")}
          value={a.hand}
          onPick={(hand) => setProfile({ a11y: { ...a, hand } })}
          options={[
            ["off", t("settings.off")],
            ["right", t("a11y.hand.right")],
            ["left", t("a11y.hand.left")],
          ]}
        />
        <p className="mt-2 px-1 text-xs text-faint">{t("a11y.hand.note")}</p>
      </div>
      <SwitchRow
        label={t("settings.sounds")}
        on={!!profile.restSounds}
        onChange={(v) => {
          feel.sound = v;
          setProfile({ restSounds: v });
        }}
      />
      <SwitchRow
        label={t("settings.vibration")}
        on={profile.haptics !== false}
        onChange={(v) => {
          feel.haptics = v;
          setProfile({ haptics: v });
        }}
      />
      <RestTimerSettings />
      <Section title={t("settings.duringRest")}>
        <DelightSettings part="workout" />
      </Section>
      <Section title={t("train.title")}>
        <NavRow title={t("settings.plan")} onClick={() => go("training")} />
      </Section>
    </>
  );
}

/** Look and feel: appearance, earned themes and icons, the daily quote, language, and accessibility. */
function LookGroup() {
  const { profile, setProfile } = useApp();
  return (
    <>
      <Row<"dark" | "light" | "system">
        label={t("settings.appearance")}
        value={profile.theme ?? "dark"}
        onPick={(theme) => setProfile({ theme })}
        options={[
          ["dark", t("appearance.dark")],
          ["light", t("appearance.light")],
          ["system", t("appearance.system")],
        ]}
      />
      <DelightSettings part="look" />
      <SwitchRow label={t("settings.quote")} on={profile.quotes !== false} onChange={(v) => setProfile({ quotes: v })} />
      <Row<LangPref>
        label={t("settings.language")}
        value={profile.language ?? "system"}
        onPick={(language) => setProfile({ language })}
        options={[["system", t("settings.language.system")], ...LANGS.map((l) => [l, LANG_NAME[l]] as [LangPref, string])]}
      />
      <p className="mt-2 px-1 text-xs text-faint">{t("settings.language.note")}</p>
      <AccessibilitySettings />
    </>
  );
}

/** Look and feel › Accessibility: text size, colour-blind safe colours, contrast and Lean mode (a11y.ts). */
function AccessibilitySettings() {
  const { profile, setProfile } = useApp();
  const a = cleanA11y(profile.a11y);
  const set = (p: Partial<typeof a>) => setProfile({ a11y: { ...a, ...p } });
  return (
    <section id="accessibility" className="mt-6 scroll-mt-4">
      <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-muted">{t("settings.accessibility")}</h2>
      <Row<TextSize>
        label={t("a11y.text")}
        value={a.text}
        onPick={(text) => set({ text })}
        options={TEXT_SIZES.map(([v]) => [v, t(`a11y.text.${v}`)])}
      />
      <p className="mt-2 px-1 text-xs text-faint">{t("a11y.text.note")}</p>
      <Row<Colours>
        label={t("a11y.colours")}
        value={a.colours}
        onPick={(colours) => set({ colours })}
        options={[
          ["standard", t("a11y.colours.standard")],
          ["cvd", t("a11y.colours.cvd")],
        ]}
      />
      <p className="mt-2 px-1 text-xs text-faint">{t("a11y.colours.note")}</p>
      <Row<Contrast>
        label={t("a11y.contrast")}
        value={a.contrast}
        onPick={(contrast) => set({ contrast })}
        options={[
          ["system", t("a11y.text.system")],
          ["standard", t("a11y.colours.standard")],
          ["more", t("a11y.contrast.more")],
        ]}
      />
      <p className="mt-2 px-1 text-xs text-faint">{t("a11y.contrast.note")}</p>
      <SwitchRow label={t("settings.lean")} hint={t("settings.lean.note")} on={!!profile.lean} onChange={(lean) => setProfile({ lean })} />
    </section>
  );
}

/** Body and units: units, the body weight the plan uses (from the last weigh-in), and cycle-aware readiness. */
function BodyGroup() {
  const { profile, setProfile } = useApp();
  return (
    <>
      <Section title={t("settings.units")}>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("settings.units")}>
          {(
            [
              ["kg", t("units.kg")],
              ["lb", t("units.lb")],
            ] as const
          ).map(([u, l]) => (
            <Chip key={u} active={profile.unit === u} onClick={() => setProfile({ unit: u })}>
              {l}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-xs text-faint">{t("settings.units.note")}</p>
      </Section>
      <Section title={t("settings.bodyweight.label")}>
        <NavRow
          title={t("settings.bw.now", { weight: plainNum(fromKg(profile.bodyweight, profile.unit)), unit: profile.unit })}
          sub={t("settings.bw.log")}
          onClick={() => go("stats")}
        />
        <p className="mt-2 px-1 text-xs text-faint">{t("settings.bw.note")}</p>
      </Section>
      <CycleSettings />
    </>
  );
}

/** Your data and privacy: saving and backup, the sets CSV, importing, usage stats, and erasing this device. */
function DataGroup() {
  const { profile, reset, events } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [stats, setStats] = useState(analyticsOn());
  return (
    <>
      <div id="saving" className="scroll-mt-4">
        <SavingSettings />
      </div>
      <Section title={t("settings.data")}>
        <Button
          kind="ghost"
          className="mb-3 w-full"
          onClick={() => void saveFile(`liftsmith-sets-${stamp()}.csv`, "text/csv", setsCsv(events, profile.unit))}
        >
          {t("settings.exportCsv")}
        </Button>
        <p className="mb-3 text-xs text-faint">{t("settings.data.note")}</p>
        <ImportWorkouts />
      </Section>
      <Section title={t("settings.stats")}>
        <SwitchRow
          label={t("settings.stats.on")}
          on={stats}
          onChange={(v) => {
            setAnalytics(v);
            setStats(v);
          }}
          hint={
            <>
              {t("settings.stats.note")}{" "}
              <a className="underline" href={`${SITE_URL}/privacy/`} target="_blank" rel="noreferrer">
                {t("settings.privacy")}
              </a>
              {stats ? ` · ${t("settings.installId", { id: installId().slice(0, 8) })}` : ""}
            </>
          }
        />
      </Section>
      <Section title={t("settings.erase")}>
        {confirm ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">{t("settings.erase.warn")}</p>
            <Button
              kind="danger"
              className="w-full"
              onClick={() =>
                void deleteEmail().finally(() => {
                  void erasePhotos();
                  void reset();
                })
              }
            >
              {t("settings.erase.confirm")}
            </Button>
            <Button kind="quiet" className="w-full" onClick={() => setConfirm(false)}>
              {t("settings.cancel")}
            </Button>
          </div>
        ) : (
          <Button kind="danger" className="w-full" onClick={() => setConfirm(true)}>
            {t("settings.erase")}
          </Button>
        )}
      </Section>
    </>
  );
}
