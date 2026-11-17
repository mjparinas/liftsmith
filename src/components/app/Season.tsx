"use client";

import { useDeferredValue, useMemo, useState, type CSSProperties } from "react";

import type { Tier } from "@/lib/achievements";
import { useProMember } from "@/lib/billing";
import { COSMETICS } from "@/lib/game";
import { date, num, t } from "@/lib/i18n";
import {
  currentSeason,
  DROP_ODDS,
  GOAL_BONUS,
  kitName,
  rewardLabel,
  seasonsOn,
  TIERS,
  type SeasonState,
  type TierReward,
} from "@/lib/seasons";
import { seasonShare } from "@/lib/shareCards";
import { useApp } from "@/lib/store";
import { THEME_BY_ID } from "@/lib/themes";
import { useNow } from "@/lib/useNow";
import type { MessageKey } from "@/locales/en";

import { Bar, TIER_COLOUR, useGame } from "./Achievements";
import { Avatar } from "./AvatarFace";
import { Icon } from "./icons";
import { go } from "./router";
import { ShareSheet, useShareContext } from "./ShareSheet";
import { Button, EmptyState, InlineSwitch, ProTag, ScreenHeader, Section } from "./ui";

// Training seasons (src/lib/seasons.ts, docs/decisions/seasons.md): the season's track, this week's points with
// why, the season challenges, the rare drop and, once it ends, the recap card. Opened from Awards and from the
// season row on Today's "This week" card.

/** The season to show now, or null (none near, or seasons turned off). Worked out once per hour or change. */
export function useSeason(): SeasonState | null {
  const app = useApp();
  const events = useDeferredValue(app.events);
  const stats = useDeferredValue(app.stats);
  const profile = useDeferredValue(app.profile);
  const now = useNow(60_000);
  const hour = Math.floor(now / 3600_000);
  const on = seasonsOn(profile);
  return useMemo(() => (on ? currentSeason(events, stats, profile, now) : null), [events, stats, profile, hour, on]); // eslint-disable-line react-hooks/exhaustive-deps
}

const dayOf = (ms: number) => date(ms, { weekday: "long", month: "long", day: "numeric" });

/** One line on what the season looks like now: tier and days left, when it starts, or how it ended. */
export function seasonLine(s: SeasonState): string {
  if (s.status === "upcoming") return t("ssn.starts", { day: dayOf(s.start) });
  if (s.status === "ended") return t("ssn.ended", { tier: s.tier });
  return t("ssn.live", { tier: s.tier, count: s.daysLeft });
}

/** The season's medal: a flame on the tier's colour (or the kit's, for the season itself). */
export function SeasonMedal({ tier, size = 36, hue }: { tier?: Tier; size?: number; hue: string }) {
  const c = tier ? TIER_COLOUR[tier] : hue;
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        color: c,
        background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${c} 35%, transparent), color-mix(in srgb, ${c} 8%, transparent) 70%)`,
        boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${c} 55%, transparent)`,
      }}
    >
      <Icon name="flame" size={size * 0.5} />
    </span>
  );
}

function RewardArt({ r, s }: { r: TierReward; s: SeasonState }) {
  if (r.kind === "badge") return <SeasonMedal tier={r.id as Tier} hue={s.kit.hue} />;
  if (r.kind === "theme") {
    const th = THEME_BY_ID.get(r.id);
    return (
      <span
        aria-hidden
        className="h-9 w-9 shrink-0 rounded-full border-4"
        style={{ background: th?.palette.bg, borderColor: th?.palette.accent }}
      />
    );
  }
  const c = COSMETICS.find((x) => x.id === r.id);
  if (c?.kind === "avatar") return <Avatar name={c.name} avatar={c.id} size={36} dim={!r.owned} />;
  return (
    <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center">
      <span className="h-5 w-5 rounded-full" style={{ background: c?.value }} />
    </span>
  );
}

/** "This week: 2 of 3 days, 400 points" with what's left to earn, and the catch-up or finale note. */
function WeekWhy({ s }: { s: SeasonState }) {
  const w = s.weeks.at(-1);
  if (s.status !== "live" || !w) return null;
  const left = Math.max(0, w.goal - w.days);
  return (
    <div className="mt-3 space-y-1 text-sm">
      <p>
        <span className="font-semibold">{t("ssn.week", { n: s.week + 1, of: s.def.weeks })}</span>{" "}
        <span className="num text-muted">
          {t("ssn.weekPoints", { days: Math.min(w.days, w.goal), goal: w.goal, points: num(w.total) })}
        </span>
      </p>
      <p className="text-muted">{left > 0 ? t("ssn.weekLeft", { count: left, bonus: num(GOAL_BONUS) }) : t("ssn.weekDone")}</p>
      {w.catchUp && <p className="text-accent">{t("ssn.catchUp")}</p>}
      {w.finale && <p className="text-ember">{t("ssn.finale")}</p>}
    </div>
  );
}

export function SeasonScreen() {
  const s = useSeason();
  const { profile, setProfile, stats } = useApp();
  const member = useProMember();
  const g = useGame();
  const ctx = useShareContext(g);
  const [sharing, setSharing] = useState(false);
  const back = { label: `‹ ${t("awards.title")}`, onClick: () => go("achievements") };
  if (!seasonsOn(profile))
    return (
      <div className="desk-col pb-2">
        <ScreenHeader back={back} title={t("ssn.screen")} info="season" />
        <div className="mt-4">
          <EmptyState
            icon="flame"
            tint="var(--color-ember)"
            title={t("ssn.offTitle")}
            body={t("ssn.offBody")}
            action={
              <Button className="w-full" onClick={() => setProfile({ delight: { ...profile.delight, seasons: true } })}>
                {t("ssn.turnOn")}
              </Button>
            }
          />
        </div>
      </div>
    );
  if (!s)
    return (
      <div className="desk-col pb-2">
        <ScreenHeader back={back} title={t("ssn.screen")} info="season" />
        <div className="mt-4">
          <EmptyState icon="flame" tint="var(--color-ember)" title={t("ssn.noneTitle")} body={t("ssn.noneBody")} />
        </div>
      </div>
    );
  const workouts = stats.sessions.filter((x) => x.start >= s.start && x.start < s.end).length;
  const shareItems = sharing ? [seasonShare(s, workouts, ctx)] : [];
  const free = s.rewards.filter((r) => !r.pro).sort((a, b) => a.tier - b.tier);
  const pro = s.rewards.filter((r) => r.pro).sort((a, b) => a.tier - b.tier);
  const dropItem = COSMETICS.find((c) => c.id === s.kit.drop);
  const row = (r: TierReward) => (
    <li key={`${r.tier}-${r.id}`} className="flex items-center gap-3 px-4 py-3">
      <span className={`num w-8 shrink-0 text-center text-sm font-bold ${s.tier >= r.tier ? "text-ink" : "text-faint"}`}>{r.tier}</span>
      <RewardArt r={r} s={s} />
      <span className={`min-w-0 flex-1 ${r.owned ? "" : "text-muted"}`}>
        <span className="block font-medium">{rewardLabel(r, s.kit)}</span>
        <span className="block text-xs text-faint">{t("ssn.tierN", { tier: r.tier })}</span>
      </span>
      {r.owned ? (
        <Icon name="check" size={18} className="shrink-0 text-good" />
      ) : (
        <>
          <Icon name="lock" size={16} className="shrink-0 text-faint" />
          <span className="sr-only">{t("awards.locker.locked")}</span>
        </>
      )}
    </li>
  );
  return (
    <div className="desk-cols pb-2">
      <ScreenHeader className="desk-span" back={back} kicker={t("ssn.kicker", { n: s.n })} title={kitName(s.kit.id)} info="season" />
      <ShareSheet open={sharing} onClose={() => setSharing(false)} items={shareItems} />
      <div className="card-tint desk-span mt-4 p-4" style={{ "--tint": s.kit.hue } as CSSProperties}>
        <div className="flex items-center gap-3">
          <SeasonMedal hue={s.kit.hue} size={48} />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{seasonLine(s)}</p>
            <p className="num text-sm text-muted">
              {t("ssn.points", { n: num(s.points) })}
              {s.prestige > 0 && <> · {t("ssn.prestige", { count: s.prestige })}</>}
            </p>
          </div>
        </div>
        {s.status !== "upcoming" && (
          <div className="mt-3">
            <Bar value={s.into / s.span} label={t("ssn.barLabel")} colour={s.kit.hue} />
            <p className="num mt-1.5 text-xs text-faint">
              {s.tier < TIERS
                ? t("ssn.toTier", { points: num(s.span - s.into), tier: s.tier + 1 })
                : t("ssn.toStar", { points: num(s.span - s.into) })}
            </p>
          </div>
        )}
        <WeekWhy s={s} />
        {s.status === "upcoming" && <p className="mt-3 text-sm text-muted">{t("ssn.how.body")}</p>}
        {s.status === "ended" && (
          <Button className="mt-3 w-full" icon="share" onClick={() => setSharing(true)}>
            {t("ssn.shareRecap")}
          </Button>
        )}
      </div>
      <Section title={t("ssn.track")} icon="flag">
        <ul className="card divide-y divide-line">{free.map(row)}</ul>
      </Section>
      <Section title={t("ssn.proRow")} icon="sparkle">
        <div className="card">
          {!member && !s.pro && (
            <button
              type="button"
              onClick={() => go("pro", "season")}
              className="press flex w-full items-center gap-2 border-b border-line px-4 py-3 text-left text-sm"
            >
              <ProTag />
              <span className="min-w-0 flex-1 text-muted">{t("ssn.proWhy")}</span>
              <Icon name="chevronRight" size={16} className="shrink-0 text-faint" />
            </button>
          )}
          <ul className="divide-y divide-line">{pro.map(row)}</ul>
        </div>
      </Section>
      <Section title={t("ssn.challenges")} icon="target">
        <ul className="card divide-y divide-line">
          {s.challenges.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-sm font-medium ${c.done ? "text-muted line-through" : ""}`}>
                  {t(`ssn.ch.${c.id}` as MessageKey, { count: c.goal })}
                </span>
                <span className="num text-xs text-faint">
                  {c.have}/{c.goal}
                </span>
              </div>
              <div className="mt-1.5">
                <Bar value={c.have / c.goal} label={t(`ssn.ch.${c.id}` as MessageKey, { count: c.goal })} colour={s.kit.hue} />
              </div>
            </li>
          ))}
        </ul>
      </Section>
      {dropItem && (
        <Section title={t("ssn.drop")} icon="gift">
          <div className="card flex items-center gap-3 p-4">
            <span
              aria-hidden
              className="h-9 w-9 shrink-0 rounded-full"
              style={{ background: "conic-gradient(var(--color-gold), var(--color-ember), var(--color-bad), var(--color-gold))" }}
            />
            <p className="min-w-0 flex-1 text-sm">
              <span className="block font-medium">{dropItem.name}</span>
              <span className="text-muted">{s.drop ? t("ssn.dropGot") : t("ssn.dropHow", { n: Math.round(1 / DROP_ODDS) })}</span>
            </p>
            {s.drop && <Icon name="check" size={18} className="shrink-0 text-good" />}
          </div>
        </Section>
      )}
      <div className="card mt-6 p-4">
        <InlineSwitch
          label={t("ssn.setting")}
          hint={t("ssn.settingHint")}
          on
          onChange={(v) => setProfile({ delight: { ...profile.delight, seasons: v } })}
        />
      </div>
    </div>
  );
}
