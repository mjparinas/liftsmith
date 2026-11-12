"use client";

import { LEAGUE_LABEL } from "@/lib/game";
import { num, t } from "@/lib/i18n";

import { Badge, Bar, QuestMark, TIER_COLOUR, useGame } from "./Achievements";
import { Icon } from "./icons";
import { go } from "./router";

// The game layer on Today: streak at risk, this week's quests and the closest badge. One glance, no taps
// needed. Tapping the card opens Awards; tapping the "Almost there" row opens Awards at that badge.

export function TodayGame() {
  const g = useGame();
  const s = g.streak;
  const near = g.nearest[0];
  const open = g.quests.filter((q) => !q.done);
  return (
    <div className="card mt-4 overflow-hidden">
      <button type="button" onClick={() => go("achievements")} className="press block w-full p-4 text-left">
        {s.atRisk && (
          <p
            className={`mb-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${s.freezeReady ? "bg-accent/10 text-accent" : "bg-warn/15 text-warn"}`}
          >
            <Icon name={s.freezeReady ? "snowflake" : "flame"} size={16} className="mt-0.5 shrink-0" />
            <span>{s.freezeReady ? t("game.freezeSaves", { count: s.weeks }) : t("game.streakResets", { count: s.weeks })}</span>
          </p>
        )}
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">{t("game.thisWeek")}</span>
          <span className="inline-flex items-center gap-1 text-sm text-muted">
            <Icon name="medal" size={14} className="text-gold" />
            {LEAGUE_LABEL[g.league.league]} · <span className="num">{num(g.league.weekXp)} XP</span>
          </span>
        </div>
        <ul className="mt-2 space-y-2">
          {(open.length ? open : g.quests).slice(0, 3).map((q) => (
            <li key={q.id} className="flex items-center gap-2 text-sm">
              <QuestMark icon={q.icon} done={q.done} size={24} />
              <span className={`min-w-0 flex-1 truncate ${q.done ? "text-muted line-through" : ""}`}>{q.title}</span>
              <span className="num w-10 text-right text-xs text-faint">
                {q.have}/{q.goal}
              </span>
            </li>
          ))}
        </ul>
      </button>
      {near?.next && (
        <button
          type="button"
          onClick={() => go("achievements", near.id)}
          className="press flex w-full items-center gap-3 border-t border-line px-4 py-3 text-left"
        >
          <Badge a={near} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              <span className="font-medium">{t("game.almost")}</span> <span className="text-muted">{near.next.detail}</span>
            </p>
            <div className="mt-1">
              <Bar value={near.progress} label={t("awards.progress", { name: near.name })} colour={TIER_COLOUR[near.next.tier]} />
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
