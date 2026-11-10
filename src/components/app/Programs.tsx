"use client";

import { useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { can } from "@/lib/entitlements";
import { inSentence, list, t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { missingFor, PICKER_ORDER, pickProgram, PROGRAM_BY_ID, weeklyPreview, type ProgramId, type ProgramInfo } from "@/lib/programs";
import { useApp } from "@/lib/store";
import { EQUIPMENT_LABEL, MUSCLE_LABEL, MUSCLES } from "@/lib/types";
import { useNow } from "@/lib/useNow";

import { go } from "./router";
import { Button, Sheet } from "./ui";

// Pick how Today's workout is planned: the adaptive engine (the default), a classic fixed program,
// or a split the adaptive engine fills in. Program details (summary, steps, credit) are still English.

const level = (l: ProgramInfo["level"]) => t(`prog.level.${l}`);

export function Programs() {
  const { profile, gyms, events, setProfile } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const [open, setOpen] = useState<ProgramInfo | null>(null);
  const src = profile.planSource;
  const currentId = src?.kind === "program" ? src.id : null;

  const choose = (id: ProgramId | null) => {
    haptic("tap");
    if (!gym) return;
    // Adaptive plans and splits are Pro: without it, the paywall instead.
    if (!id ? !can("adaptive") : PROGRAM_BY_ID.get(id)?.tier === "pro" && !can("adaptiveSplits")) return go("pro", "programs");
    setProfile({ planSource: id ? pickProgram(id, { profile, gym, events, now: Date.now() }) : { kind: "adaptive" }, proPlan: undefined });
    track("feature", { name: "program", detail: id ?? "adaptive" });
    setOpen(null);
    go("today");
  };

  return (
    <div className="pb-24">
      <button type="button" onClick={() => go("settings")} className="press -ml-2 min-h-11 pt-2 text-muted">
        {t("train.back")}
      </button>
      <h1 className="text-2xl font-bold">{t("prog.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("prog.intro")}</p>

      <ul className="mt-4 space-y-3">
        <li>
          <button
            type="button"
            onClick={() => choose(null)}
            aria-pressed={!currentId}
            className={`press card w-full p-4 text-left ${!currentId ? "border-accent" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{t("prog.adaptive")}</span>
              {!currentId && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{t("prog.current")}</span>
              )}
              {!can("adaptive") && (
                <span className="rounded-full bg-warn/15 px-2 py-0.5 text-xs font-semibold text-warn">{t("prog.pro")}</span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">{t("prog.adaptiveBlurb")}</p>
          </button>
        </li>
        {PICKER_ORDER.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => {
                haptic("tick");
                setOpen(p);
              }}
              className={`press card w-full p-4 text-left ${currentId === p.id ? "border-accent" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{p.name}</span>
                <span className="flex shrink-0 gap-1.5">
                  {currentId === p.id && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{t("prog.current")}</span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.tier === "pro" ? "bg-warn/15 text-warn" : "bg-raised text-muted"}`}
                  >
                    {p.tier === "pro" ? t("prog.pro") : t("prog.free")}
                  </span>
                </span>
              </div>
              <p className="mt-0.5 text-xs text-faint">
                {level(p.level)} · {t("prog.perWeek", { count: p.daysPerWeek })} · {t("prog.aka", { name: p.aka[0] })}
              </p>
              <p className="mt-1 text-sm text-muted">{p.summary}</p>
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""}>
        {open && gym && <Detail p={open} current={currentId === open.id} onStart={() => choose(open.id)} />}
      </Sheet>
    </div>
  );
}

function Detail({ p, current, onStart }: { p: ProgramInfo; current: boolean; onStart: () => void }) {
  const { profile, gyms, events } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const missing = missingFor(p.id, gym);
  const now = useNow(3600_000);
  const week = useMemo(() => weeklyPreview(p.id, { profile, gym, events, now }), [p.id, profile, gym, events, now]);
  const rows = MUSCLES.filter((m) => week[m] >= 1).sort((a, b) => week[b] - week[a]);
  const max = Math.max(1, ...rows.map((m) => week[m]));
  const allowed = p.tier === "free" || can("adaptiveSplits");
  return (
    <div className="space-y-4">
      <p className="text-muted">{p.summary}</p>
      <ol className="space-y-2 text-sm">
        {p.how.map((h, i) => (
          <li key={h} className="flex gap-3">
            <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">{i + 1}</span>
            {h}
          </li>
        ))}
      </ol>
      {missing.length > 0 && (
        <p className="rounded-xl bg-warn/10 px-3 py-2 text-sm text-warn">
          {t("prog.needs", { items: list(missing.map((e) => inSentence(EQUIPMENT_LABEL[e], true))) })}
        </p>
      )}
      <div>
        <h3 className="text-sm font-semibold text-muted">{t("prog.week")}</h3>
        <ul className="mt-2 space-y-1">
          {rows.map((m) => (
            <li key={m} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0 text-muted">{MUSCLE_LABEL[m]}</span>
              <span className="h-2 rounded-full bg-accent/70" style={{ width: `${(week[m] / max) * 60}%` }} aria-hidden />
              <span className="num text-xs text-faint">{Math.round(week[m])}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-faint">
        {p.basedOn} {t("prog.owners")}
      </p>
      <Button className="w-full" onClick={onStart}>
        {!allowed ? t("prog.unlock") : current ? t("prog.restart") : t("prog.start")}
      </Button>
    </div>
  );
}

/** The current program's name, for Settings and Today. */
export function programName(id: string | undefined): string | null {
  return id ? (PROGRAM_BY_ID.get(id)?.name ?? null) : null;
}
