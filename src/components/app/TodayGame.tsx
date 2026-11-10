"use client";

import { LEAGUE_LABEL } from "@/lib/game";
import { fmtNum } from "@/lib/units";

import { Badge, Bar, TIER_COLOUR, useGame } from "./Achievements";
import { go } from "./router";

// The game layer on Today: streak at risk, this week's quests and the closest badge. One glance, no taps
// needed; tapping opens Awards.

export function TodayGame() {
  const g = useGame();
  const s = g.streak;
  const near = g.nearest[0];
  const open = g.quests.filter((q) => !q.done);
  return (
    <button type="button" onClick={() => go("achievements")} className="press card mt-4 block w-full p-4 text-left">
      {s.atRisk && (
        <p className={`mb-3 rounded-xl px-3 py-2 text-sm ${s.freezeReady ? "bg-accent/10 text-accent" : "bg-warn/15 text-warn"}`}>
          {s.freezeReady
            ? `🧊 This week's goal is out of reach. A freeze will save your ${s.weeks}-week streak.`
            : `🔥 This week's goal is out of reach, so your ${s.weeks}-week streak starts again on Monday. Every 4 goal weeks earns a freeze.`}
        </p>
      )}
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">This week</span>
        <span className="text-sm text-muted">
          🏅 {LEAGUE_LABEL[g.league.league]} · <span className="num">{fmtNum(g.league.weekXp)} XP</span>
        </span>
      </div>
      <ul className="mt-2 space-y-2">
        {(open.length ? open : g.quests).slice(0, 3).map((q) => (
          <li key={q.id} className="flex items-center gap-2 text-sm">
            <span aria-hidden>{q.done ? "✅" : q.icon}</span>
            <span className={`min-w-0 flex-1 truncate ${q.done ? "text-muted line-through" : ""}`}>{q.title}</span>
            <span className="num w-10 text-right text-xs text-faint">
              {q.have}/{q.goal}
            </span>
          </li>
        ))}
      </ul>
      {near?.next && (
        <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
          <Badge a={near} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              <span className="font-medium">Almost there:</span> <span className="text-muted">{near.next.detail}</span>
            </p>
            <div className="mt-1">
              <Bar value={near.progress} label={`${near.name} progress`} colour={TIER_COLOUR[near.next.tier]} />
            </div>
          </div>
        </div>
      )}
    </button>
  );
}
