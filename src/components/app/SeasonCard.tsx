"use client";

import { useDeferredValue, useMemo } from "react";

import { TIER_LABEL } from "@/lib/achievements";
import { t } from "@/lib/i18n";
import { kitName, KITS, seasonOwned, seasonsOn } from "@/lib/seasons";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";

import { Bar } from "./Achievements";
import { Icon } from "./icons";
import { go } from "./router";
import { seasonLine, SeasonMedal, useSeason } from "./Season";
import { Section } from "./ui";

// The Seasons part of Awards (seasons.ts): the season running or near, one tap to its track, and the season
// badges earned so far, which stay after their season ends. Nothing shows with seasons turned off.

export function SeasonCard() {
  const s = useSeason();
  const app = useApp();
  const events = useDeferredValue(app.events);
  const stats = useDeferredValue(app.stats);
  const profile = useDeferredValue(app.profile);
  const now = useNow(3600_000);
  const on = seasonsOn(profile);
  const badges = useMemo(() => (on ? seasonOwned(events, stats, profile, now).badges : []), [events, stats, profile, now, on]);
  if (!on || (!s && !badges.length)) return null;
  return (
    <Section title={t("ssn.section")} icon="flame" info="season">
      <div className="card overflow-hidden">
        {s && (
          <button type="button" onClick={() => go("season")} className="press flex w-full items-center gap-3 p-4 text-left">
            <SeasonMedal hue={s.kit.hue} size={44} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-muted">{seasonLine(s)}</p>
              {s.status !== "upcoming" && (
                <div className="mt-1.5">
                  <Bar value={s.into / s.span} label={t("ssn.barLabel")} colour={s.kit.hue} />
                </div>
              )}
            </div>
            <Icon name="chevronRight" size={16} className="shrink-0 text-faint" />
          </button>
        )}
        {badges.length > 0 && (
          <ul className={`flex flex-wrap gap-3 p-4 ${s ? "border-t border-line" : ""}`} aria-label={t("ssn.badges")}>
            {badges.map((b) => (
              <li key={`${b.season.id}-${b.tier}`} className="flex items-center gap-2 text-sm">
                <SeasonMedal tier={b.tier} hue={KITS[b.season.kit]?.hue ?? "var(--color-ember)"} size={32} />
                <span>
                  {kitName(b.season.kit)} · {TIER_LABEL[b.tier]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
