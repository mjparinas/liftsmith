"use client";
import { CATEGORY_LABEL, TIER_LABEL, type Achievement, type Category, type Tier } from "@/lib/achievements";
import { COSMETICS, LEAGUES, RARITY_LABEL, game, type Cosmetic, type Game } from "@/lib/game";
import { applyAccent, sound, type TimerSound } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { fmtNum } from "@/lib/units";
import { useMemo, useState } from "react";
import { go } from "./router";
import { Chip, Section } from "./ui";

// Achievements, quests, the league, streak freezes and the locker of crate cosmetics, in one place.

export const TIER_COLOUR: Record<Tier, string> = { bronze: "#c98a55", silver: "#c3ccd8", gold: "#f2c14e", platinum: "#9be7ff" };
const RARITY_COLOUR = { common: "#8a97a8", rare: "#4c8dff", epic: "#a78bfa", legendary: "#f2c14e" } as const;

export function useGame(): Game {
  const { events, stats, profile } = useApp();
  const now = useNow();
  // Recomputed when the events change, or when the day ticks over (quests and streaks are weekly).
  const day = Math.floor(now / 3600_000);
  return useMemo(() => game(events, stats, profile, now), [events, stats, profile, day]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function Badge({ a, size = 56 }: { a: Pick<Achievement, "icon" | "tier" | "hidden" | "name">; size?: number }) {
  const c = a.tier ? TIER_COLOUR[a.tier] : "var(--color-line)";
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, fontSize: size * 0.46, background: a.tier ? `radial-gradient(circle at 35% 30%, ${c}55, ${c}14 70%)` : "var(--color-raised)", boxShadow: `inset 0 0 0 3px ${c}`, filter: a.tier || a.hidden ? undefined : "grayscale(1)", opacity: a.tier ? 1 : 0.55 }}
    >
      {a.icon}
    </span>
  );
}

export function Bar({ value, label, colour = "var(--color-accent)" }: { value: number; label: string; colour?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="h-2 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: colour }} />
    </div>
  );
}

function progressText(a: Achievement) {
  if (!a.next) return "Every tier done";
  if (a.hidden) return "Secret";
  const u = a.unit ? (a.unit === "×" ? "×" : ` ${a.unit}`) : "";
  return `${fmtNum(a.value)}${u} of ${fmtNum(a.next.at)}${u}`;
}

export function AchievementRow({ a }: { a: Achievement }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Badge a={a} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold">{a.name}</span>
          {a.tier && <span className="shrink-0 text-xs font-semibold" style={{ color: TIER_COLOUR[a.tier] }}>{TIER_LABEL[a.tier]}</span>}
        </div>
        <p className="truncate text-sm text-muted">{a.next ? a.next.detail : a.detail}</p>
        {!a.hidden && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1"><Bar value={a.progress} label={`${a.name} progress`} colour={a.next ? TIER_COLOUR[a.next.tier] : TIER_COLOUR.platinum} /></div>
            <span className="num shrink-0 text-xs text-faint">{progressText(a)}</span>
          </div>
        )}
        <span className="sr-only">{a.level} of {a.levels} tiers</span>
      </div>
    </li>
  );
}

export function StreakCard({ g }: { g: Game }) {
  const s = g.streak;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">🔥 {s.weeks}-week streak</span>
        <span className="text-sm text-muted" title="Freezes save your streak if a week falls short. You earn one every 4 goal weeks, up to 2.">
          {"🧊".repeat(s.freezes)}{s.freezes === 0 ? "No freezes" : ` ${s.freezes} freeze${s.freezes > 1 ? "s" : ""}`}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        {s.needed === 0 ? "This week's goal is done. Rest well." : s.atRisk ? (s.freezeReady ? "Your goal is out of reach this week, but a freeze will keep your streak." : "Your goal is out of reach this week. Your streak resets on Monday.") : `${s.needed} more workout${s.needed > 1 ? "s" : ""} this week to ${s.weeks > 0 ? "keep it going" : "start your streak"}.`}
      </p>
      <p className="mt-1 text-xs text-faint">Best: {s.best} weeks · a freeze every 4 goal weeks, up to 2</p>
    </div>
  );
}

export function QuestsCard({ g }: { g: Game }) {
  return (
    <ul className="card divide-y divide-line" aria-label="Weekly quests">
      {g.quests.map((q) => (
        <li key={q.id} className="flex items-center gap-3 px-4 py-3">
          <span aria-hidden className="text-2xl">{q.done ? "✅" : q.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2">
              <span className={`truncate ${q.done ? "text-muted line-through" : "font-medium"}`}>{q.title}</span>
              <span className="num shrink-0 text-sm text-accent">+{q.xp} XP</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1"><Bar value={q.have / q.goal} label={`${q.title} progress`} colour={q.done ? "var(--color-good)" : undefined} /></div>
              <span className="num text-xs text-faint">{q.have}/{q.goal}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LeagueCard({ g }: { g: Game }) {
  const l = g.league;
  const pct = l.promoteAt ? l.weekXp / l.promoteAt : 1;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">🏅 {l.league} league</span>
        <span className="num text-sm text-muted">{fmtNum(l.weekXp)} XP this week</span>
      </div>
      <div className="mt-2"><Bar value={pct} label="Progress to the next league" /></div>
      <p className="mt-1.5 text-xs text-faint">
        {l.promoteAt ? (l.weekXp >= l.promoteAt ? `You move up to ${LEAGUES[l.index + 1]} on Monday.` : `${fmtNum(l.promoteAt - l.weekXp)} XP more this week to move up to ${LEAGUES[l.index + 1]}.`) : "Top league. Stay above the line to keep it."}
        {l.demoteBelow > 0 && l.weekXp < l.demoteBelow ? ` Below ${fmtNum(l.demoteBelow)} XP drops you a league.` : ""}
      </p>
      <ol className="mt-3 flex gap-1" aria-label="Leagues">
        {LEAGUES.map((name, i) => (
          <li key={name} title={name} className={`h-1.5 flex-1 rounded-full ${i <= l.index ? "bg-accent" : "bg-raised"}`}><span className="sr-only">{name}{i === l.index ? " (you)" : ""}</span></li>
        ))}
      </ol>
    </div>
  );
}

function Locker({ g }: { g: Game }) {
  const { profile, setProfile } = useApp();
  const eq = profile.cosmetics ?? {};
  const equip = (c: Cosmetic) => {
    const next = { ...eq, [c.kind]: c.id };
    setProfile({ cosmetics: next });
    if (c.kind === "accent") applyAccent(c.value);
    if (c.kind === "sound") sound.preview(c.value as TimerSound);
  };
  const groups: [Cosmetic["kind"], string, string][] = [["accent", "Accent colour", "accent-blue"], ["sound", "Rest timer sound", "sound-classic"], ["plates", "Plate finish", "plates-classic"]];
  return (
    <div className="space-y-4">
      {groups.map(([kind, label, def]) => (
        <div key={kind}>
          <p className="mb-2 text-sm text-muted">{label}</p>
          <div className="flex flex-wrap gap-2">
            {COSMETICS.filter((c) => c.kind === kind).map((c) => {
              const have = g.owned.has(c.id);
              const on = (eq[kind] ?? def) === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={!have}
                  aria-pressed={on}
                  onClick={() => equip(c)}
                  className={`press flex items-center gap-2 rounded-full border px-3 py-2 text-sm disabled:opacity-45 ${on ? "border-accent bg-accent/15" : "border-line bg-surface"}`}
                >
                  {kind === "accent" && <span aria-hidden className="h-4 w-4 rounded-full" style={{ background: c.value }} />}
                  <span>{have ? c.name : `🔒 ${c.name}`}</span>
                  <span className="text-xs" style={{ color: RARITY_COLOUR[c.rarity] }}>{RARITY_LABEL[c.rarity]}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-faint">Every finished workout opens a crate. Repeats turn into 25 bonus XP.</p>
    </div>
  );
}

const FILTERS: ("all" | "earned" | Category)[] = ["all", "earned", "consistency", "strength", "volume", "records", "explore", "smart", "secret"];

export function Achievements() {
  const g = useGame();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const list = g.achievements.filter((a) => (filter === "all" ? true : filter === "earned" ? a.level > 0 : a.category === filter));
  const hiddenLeft = list.filter((a) => a.hidden).length;
  const sorted = [...list].sort((a, b) => Number(b.level > 0) - Number(a.level > 0) || b.progress - a.progress);
  return (
    <div className="pb-24">
      <button type="button" onClick={() => go("stats")} className="press -ml-2 pt-2 text-muted">‹ Progress</button>
      <h1 className="text-2xl font-bold">Achievements</h1>
      <div className="card mt-4 p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Level {g.level.level} · {g.level.title}</span>
          <span className="num text-sm text-muted">{fmtNum(g.xp)} XP</span>
        </div>
        <div className="mt-2"><Bar value={g.level.into / g.level.span} label="Progress to the next level" /></div>
        {g.level.next && <p className="num mt-1.5 text-xs text-faint">{fmtNum(g.level.span - g.level.into)} XP to {g.level.next}</p>}
        <p className="num mt-3 text-sm"><span className="font-semibold">{g.badges.earned}</span> <span className="text-muted">of {g.badges.total} badges earned</span></p>
      </div>
      <Section title="This week's quests"><QuestsCard g={g} /></Section>
      <Section title="League"><LeagueCard g={g} /></Section>
      <Section title="Streak"><StreakCard g={g} /></Section>
      <Section title="Badges">
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "earned" ? "Earned" : CATEGORY_LABEL[f]}</Chip>)}
        </div>
        <ul className="card divide-y divide-line">
          {sorted.filter((a) => !a.hidden || filter === "secret").map((a) => <AchievementRow key={a.id} a={a} />)}
          {filter !== "secret" && hiddenLeft > 0 && (
            <li>
              <button type="button" onClick={() => setFilter("secret")} className="press flex w-full items-center gap-3 px-4 py-3 text-left">
                <Badge a={{ icon: "❔", tier: null, hidden: true, name: "" }} />
                <span><span className="block font-semibold">{hiddenLeft} secret achievements</span><span className="text-sm text-muted">Hidden until you earn them</span></span>
              </button>
            </li>
          )}
          {!sorted.length && <li className="px-4 py-3 text-muted">Nothing here yet.</li>}
        </ul>
      </Section>
      <Section title="Locker"><Locker g={g} /></Section>
    </div>
  );
}
