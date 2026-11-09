"use client";
import { Info } from "@/components/Info";
import { useNow } from "@/lib/useNow";
import { Swatch } from "@/components/BodyMap";
import { RecoveryMap } from "./RecoveryMap";
import { useState } from "react";
import type { Muscle } from "@/lib/types";
import { blockWeek, weekStart } from "@/lib/block";
import { weeklySets } from "@/lib/generator";
import { bandOf, recovery } from "@/lib/recovery";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL, MUSCLES } from "@/lib/types";
import { Button, EmptyState, Section } from "./ui";
import { can } from "@/lib/entitlements";
import { go } from "./router";
import { t } from "@/lib/i18n";

export function Recovery() {
  const { events, profile } = useApp();
  const now = useNow();
  const rec = recovery(events, now);
  const wk = blockWeek(profile, now);
  const done = weeklySets(events, weekStart(profile, now));
  const list = [...MUSCLES].sort((a, b) => rec[a] - rec[b]);
  const [picked, setPicked] = useState<Muscle | null>(null);
  if (!can("recoveryMap")) {
    return (
      <div className="pb-24">
        <h1 className="pt-3 text-[1.75rem] font-extrabold tracking-tight">{t("recovery.title")}<Info term="recovery" /></h1>
        <EmptyState icon="lock" title={t("recovery.locked.title")} body={t("recovery.locked.body")} action={<Button onClick={() => go("pro", "recovery")}>{t("pro.settings.see")}</Button>} />
      </div>
    );
  }
  return (
    <div className="pb-24">
      <h1 className="pt-3 text-[1.75rem] font-extrabold tracking-tight">{t("recovery.title")}<Info term="recovery" /></h1>
      <p className="mt-1 text-muted">{t("recovery.lead")} {t("map.pick")}</p>
      <div className="card mt-4 p-4">
        <RecoveryMap rec={rec} chips={false} selected={picked} onSelect={setPicked} />
      </div>
      <Section title={t("recovery.muscles", { goal: wk.setsPerMuscle })} icon="target">
        <ul className="card divide-y divide-line/70 overflow-hidden">
          {list.map((m) => {
            const b = bandOf(rec[m]);
            const pct = Math.min(100, (done[m] / wk.setsPerMuscle) * 100);
            return (
              <li key={m}>
                <button type="button" aria-pressed={picked === m} onClick={() => { setPicked(picked === m ? null : m); window.scrollTo?.({ top: 0, behavior: "smooth" }); }}
                  className={`press flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left ${picked === m ? "bg-accent/10" : ""}`}>
                <span title={b.label} className="flex"><Swatch band={b.band} colour={b.colour} /><span className="sr-only">{b.label},</span></span>
                <span className="w-28 shrink-0 font-medium">{MUSCLE_LABEL[m]}</span>
                <div className="h-2 min-w-20 flex-1 overflow-hidden rounded-full bg-raised" title={t("recovery.setsOf", { done: Math.round(done[m]), goal: wk.setsPerMuscle })}>
                  <div className={`h-full rounded-full ${pct >= 100 ? "bg-mint" : "bg-gradient-to-r from-accent to-accent-2"}`} style={{ width: `${pct}%`, transition: "width 600ms var(--ease-out-expo)" }} />
                </div>
                <span className="num ml-auto min-w-20 shrink-0 whitespace-nowrap text-right text-sm text-muted">{rec[m]}% · {Math.round(done[m])}/{wk.setsPerMuscle}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}
