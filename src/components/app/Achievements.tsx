"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { CATEGORY_LABEL, TIER_LABEL, type Achievement, type Category, type Tier } from "@/lib/achievements";
import {
  COSMETICS,
  game,
  LEAGUE_LABEL,
  LEAGUES,
  levelForItem,
  RARITY_LABEL,
  rarityOdds,
  type Cosmetic,
  type Game,
  type LevelReward,
} from "@/lib/game";
import { t } from "@/lib/i18n";
import { applyAccent, sound, type TimerSound } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { fmtNum } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import type { MessageKey } from "@/locales/en";

import { Icon } from "./icons";
import { go } from "./router";
import { HUE } from "./theme";
import { Chip, Section } from "./ui";

// Achievements, quests, the league, streak freezes and the locker of crate cosmetics, in one place.

// CSS variables (globals.css), so each has a dark and a light value.
export const TIER_COLOUR: Record<Tier, string> = {
  bronze: "var(--tier-bronze)",
  silver: "var(--tier-silver)",
  gold: "var(--tier-gold)",
  platinum: "var(--tier-platinum)",
};
export const RARITY_COLOUR = {
  common: "var(--rarity-common)",
  rare: "var(--rarity-rare)",
  epic: "var(--rarity-epic)",
  legendary: "var(--rarity-legendary)",
} as const;

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
      style={{
        width: size,
        height: size,
        fontSize: size * 0.46,
        background: a.tier
          ? `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${c} 33%, transparent), color-mix(in srgb, ${c} 8%, transparent) 70%)`
          : "var(--color-raised)",
        boxShadow: `inset 0 0 0 3px ${c}`,
        filter: a.tier || a.hidden ? undefined : "grayscale(1)",
        opacity: a.tier ? 1 : 0.55,
      }}
    >
      {a.icon}
    </span>
  );
}

export function Bar({ value, label, colour = "var(--color-accent)" }: { value: number; label: string; colour?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-raised"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: colour }} />
    </div>
  );
}

function progressText(a: Achievement) {
  if (!a.next) return t("awards.allTiers");
  if (a.hidden) return t("awards.secret");
  const amount = (n: number) =>
    a.unit ? t(`awards.u.${a.unit === "×" ? "x" : a.unit}` as MessageKey, { n: fmtNum(n), count: n }) : fmtNum(n);
  return t("awards.of", { value: amount(a.value), goal: amount(a.next.at) });
}

export function AchievementRow({ a }: { a: Achievement }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Badge a={a} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold">{a.name}</span>
          {a.tier && (
            <span className="shrink-0 text-xs font-semibold" style={{ color: TIER_COLOUR[a.tier] }}>
              {TIER_LABEL[a.tier]}
            </span>
          )}
        </div>
        <p className="truncate text-sm text-muted">{a.next ? a.next.detail : a.detail}</p>
        {!a.hidden && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1">
              <Bar
                value={a.progress}
                label={t("awards.progress", { name: a.name })}
                colour={a.next ? TIER_COLOUR[a.next.tier] : TIER_COLOUR.platinum}
              />
            </div>
            <span className="num shrink-0 text-xs text-faint">{progressText(a)}</span>
          </div>
        )}
        <span className="sr-only">{t("awards.tiers", { level: a.level, count: a.levels })}</span>
      </div>
    </li>
  );
}

export function StreakCard({ g }: { g: Game }) {
  const s = g.streak;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">🔥 {t("awards.streak", { count: s.weeks })}</span>
        <span className="text-sm text-muted" title={t("awards.freezeHelp")}>
          {"🧊".repeat(s.freezes)}
          {s.freezes === 0 ? t("awards.noFreezes") : ` ${t("awards.freezes", { count: s.freezes })}`}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        {s.needed === 0
          ? t("awards.goalDone")
          : s.atRisk
            ? t(s.freezeReady ? "awards.atRiskFreeze" : "awards.atRisk")
            : t(s.weeks > 0 ? "awards.needKeep" : "awards.needStart", { count: s.needed })}
      </p>
      <p className="mt-1 text-xs text-faint">{t("awards.best", { count: s.best })}</p>
    </div>
  );
}

export function QuestsCard({ g }: { g: Game }) {
  return (
    <ul className="card divide-y divide-line" aria-label={t("awards.quests")}>
      {g.quests.map((q) => (
        <li key={q.id} className="flex items-center gap-3 px-4 py-3">
          <span aria-hidden className="text-2xl">
            {q.done ? "✅" : q.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2">
              <span className={`truncate ${q.done ? "text-muted line-through" : "font-medium"}`}>{q.title}</span>
              <span className="num shrink-0 text-sm text-accent">{t("awards.plusXp", { xp: q.xp })}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1">
                <Bar
                  value={q.have / q.goal}
                  label={t("awards.progress", { name: q.title })}
                  colour={q.done ? "var(--color-good)" : undefined}
                />
              </div>
              <span className="num text-xs text-faint">
                {q.have}/{q.goal}
              </span>
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
        <span className="font-semibold">🏅 {t("awards.league", { league: LEAGUE_LABEL[l.league] })}</span>
        <span className="num text-sm text-muted">{t("awards.weekXp", { xp: l.weekXp })}</span>
      </div>
      <div className="mt-2">
        <Bar value={pct} label={t("awards.leagueProgress")} />
      </div>
      <p className="mt-1.5 text-xs text-faint">
        {l.promoteAt
          ? l.weekXp >= l.promoteAt
            ? t("awards.moveUp", { league: LEAGUE_LABEL[LEAGUES[l.index + 1]] })
            : t("awards.toMoveUp", { xp: l.promoteAt - l.weekXp, league: LEAGUE_LABEL[LEAGUES[l.index + 1]] })
          : t("awards.topLeague")}
        {l.demoteBelow > 0 && l.weekXp < l.demoteBelow ? ` ${t("awards.drop", { xp: l.demoteBelow })}` : ""}
      </p>
      <ol className="mt-3 flex gap-1" aria-label={t("awards.leagues")}>
        {LEAGUES.map((name, i) => (
          <li key={name} title={LEAGUE_LABEL[name]} className={`h-1.5 flex-1 rounded-full ${i <= l.index ? "bg-accent" : "bg-raised"}`}>
            <span className="sr-only">
              {LEAGUE_LABEL[name]}
              {i === l.index ? ` ${t("awards.you")}` : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** A level reward in words: "Chrome (Epic)" or "a bonus crate for your new title". */
export function rewardText(r: LevelReward): string {
  if (r.source === "crate") return t("awards.reward.crate");
  return t("awards.reward.item", { name: r.item.name, rarity: RARITY_LABEL[r.item.rarity] });
}

function Locker({ g }: { g: Game }) {
  const { profile, setProfile } = useApp();
  const [hint, setHint] = useState<string | null>(null);
  const eq = profile.cosmetics ?? {};
  const equip = (c: Cosmetic) => {
    const next = { ...eq, [c.kind]: c.id };
    setProfile({ cosmetics: next });
    if (c.kind === "accent") applyAccent(c.value);
    if (c.kind === "sound") sound.preview(c.value as TimerSound);
  };
  const groups: [Cosmetic["kind"], string, string][] = [
    ["accent", t("awards.locker.accent"), "accent-blue"],
    ["sound", t("awards.locker.sound"), "sound-classic"],
    ["plates", t("awards.locker.plates"), "plates-classic"],
  ];
  const have = COSMETICS.filter((c) => g.owned.has(c.id)).length;
  return (
    <div className="space-y-4">
      <p className="num text-sm">
        <span className="font-semibold">{t("awards.locker.count", { have, total: COSMETICS.length })}</span>{" "}
        <span className="text-muted">· {t("awards.locker.howTo")}</span>
      </p>
      {groups.map(([kind, label, def]) => {
        const picked = COSMETICS.find((c) => c.id === hint && c.kind === kind);
        const at = picked ? levelForItem(picked.id) : null;
        return (
          <div key={kind}>
            <p className="mb-2 text-sm text-muted">{label}</p>
            <div className="flex flex-wrap gap-2">
              {COSMETICS.filter((c) => c.kind === kind).map((c) => {
                const mine = g.owned.has(c.id);
                const on = (eq[kind] ?? def) === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={mine ? on : undefined}
                    aria-expanded={mine ? undefined : hint === c.id}
                    onClick={() => (mine ? equip(c) : setHint(hint === c.id ? null : c.id))}
                    className={`press flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${on ? "border-accent bg-accent/15" : "border-line bg-surface"} ${mine ? "" : "text-muted"}`}
                  >
                    {kind === "accent" && (
                      <span aria-hidden className={`h-4 w-4 rounded-full ${mine ? "" : "opacity-45"}`} style={{ background: c.value }} />
                    )}
                    {!mine && <Icon name="lock" size={14} />}
                    {!mine && <span className="sr-only">{t("awards.locker.locked")}</span>}
                    <span>{c.name}</span>
                    <span className="text-xs" style={{ color: RARITY_COLOUR[c.rarity] }}>
                      {RARITY_LABEL[c.rarity]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" className="text-sm text-muted">
              {picked && (
                <span className="mt-2 block">
                  {t("awards.locker.odds", { name: picked.name, n: Math.round(1 / rarityOdds(picked.id)) })}
                  {at !== null && ` ${t("awards.locker.atLevel", { level: at })}`}
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const FILTERS: ("all" | "earned" | Category)[] = [
  "all",
  "earned",
  "consistency",
  "strength",
  "volume",
  "records",
  "explore",
  "smart",
  "secret",
];

export function Achievements() {
  const g = useGame();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const list = g.achievements.filter((a) => (filter === "all" ? true : filter === "earned" ? a.level > 0 : a.category === filter));
  const hiddenLeft = list.filter((a) => a.hidden).length;
  const sorted = [...list].sort((a, b) => Number(b.level > 0) - Number(a.level > 0) || b.progress - a.progress);
  return (
    <div className="pb-2">
      <button type="button" onClick={() => go("stats")} className="press -ml-2 pt-2 text-muted">
        ‹ {t("progress.title")}
      </button>
      <h1 className="text-2xl font-bold">{t("awards.title")}</h1>
      <div className="card-tint mt-4 p-4" style={{ "--tint": HUE.violet } as CSSProperties}>
        <div className="flex items-baseline justify-between">
          <span className="font-bold">
            {t("progress.level", { level: g.level.level })} · <span className="text-gradient">{g.level.title}</span>
          </span>
          <span className="num text-sm text-muted">{t("progress.xp", { xp: g.xp })}</span>
        </div>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-raised"
          role="progressbar"
          aria-label={t("awards.levelProgress")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(Math.min(1, g.level.into / g.level.span) * 100)}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-violet shadow-[0_0_12px_rgb(139_123_255/0.6)]"
            style={{ width: `${Math.min(100, (g.level.into / g.level.span) * 100)}%` }}
          />
        </div>
        {g.level.next && (
          <p className="num mt-1.5 text-xs text-faint">{t("progress.xpTo", { xp: g.level.span - g.level.into, next: g.level.next })}</p>
        )}
        {g.next && (
          <p className="num mt-1 text-xs text-muted">{t("awards.nextReward", { level: g.next.level, reward: rewardText(g.next) })}</p>
        )}
        <p className="num mt-3 text-sm">
          <span className="font-semibold">{fmtNum(g.badges.earned)}</span>{" "}
          <span className="text-muted">{t("awards.badgesOf", { total: g.badges.total })}</span>
        </p>
      </div>
      <Section title={t("awards.weekQuests")}>
        <QuestsCard g={g} />
      </Section>
      <Section title={t("awards.leagueTitle")}>
        <LeagueCard g={g} />
      </Section>
      <Section title={t("awards.streakTitle")}>
        <StreakCard g={g} />
      </Section>
      <Section title={t("awards.badges")}>
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? t("awards.all") : f === "earned" ? t("awards.earned") : CATEGORY_LABEL[f]}
            </Chip>
          ))}
        </div>
        <ul className="card divide-y divide-line">
          {sorted
            .filter((a) => !a.hidden || filter === "secret")
            .map((a) => (
              <AchievementRow key={a.id} a={a} />
            ))}
          {filter !== "secret" && hiddenLeft > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setFilter("secret")}
                className="press flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <Badge a={{ icon: "❔", tier: null, hidden: true, name: "" }} />
                <span>
                  <span className="block font-semibold">{t("awards.secretCount", { count: hiddenLeft })}</span>
                  <span className="text-sm text-muted">{t("awards.hidden")}</span>
                </span>
              </button>
            </li>
          )}
          {!sorted.length && <li className="px-4 py-3 text-muted">{t("awards.none")}</li>}
        </ul>
      </Section>
      <Section title={t("awards.locker")} info="crate">
        <Locker g={g} />
      </Section>
    </div>
  );
}
