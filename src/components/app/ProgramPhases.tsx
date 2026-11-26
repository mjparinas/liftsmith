"use client";

import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { PHASE_LIMITS } from "@/lib/programPhases";
import type { PhaseDraft } from "@/lib/programWeek";
import { PHASE_KINDS, type PhaseKind } from "@/lib/types";

import { Bump, Button, Chip } from "./ui";

// Phases in the coach program builder (docs/decisions/coach-programs.md "The program builder", stage 2, 2026-11-26):
// a program is one week repeated, or a few phases in a row (Build, Deload, Peak), each repeating its own week. The
// week editor under this bar edits the phase picked here.

const name = (k: PhaseKind) => t(`cpg.phase.${k}`);

export function ProgramPhases({
  phases,
  sel,
  onSelect,
  onChange,
  singleWeeks,
}: {
  phases: PhaseDraft[];
  sel: number;
  onSelect: (i: number) => void;
  onChange: (phases: PhaseDraft[], sel: number) => void;
  /** The program's weeks while it is a single week, so the first phase starts with them. */
  singleWeeks: number;
}) {
  const total = phases.length > 1 ? phases.reduce((n, p) => n + p.weeks, 0) : singleWeeks;
  const room = PHASE_LIMITS.total - total;
  const full = phases.length >= PHASE_LIMITS.phases;
  const cur = phases[sel] ?? phases[0]!;

  // A new phase starts from the picked phase's week. The first phase keeps the program's weeks, less what's added.
  const add = (kind: PhaseKind, weeks: number) => {
    haptic("success");
    const base = phases.length > 1 ? phases : [{ ...phases[0]!, weeks: Math.min(singleWeeks, PHASE_LIMITS.total - weeks) }];
    const next = [...base, { kind, weeks, week: [...cur.week] }];
    onChange(next, next.length - 1);
  };
  const update = (patch: Partial<PhaseDraft>) =>
    onChange(
      phases.map((p, i) => (i === sel ? { ...p, ...patch } : p)),
      sel,
    );
  const remove = () => {
    haptic("tick");
    const next = phases.filter((_, i) => i !== sel);
    onChange(next, Math.max(0, sel - 1));
  };
  const step = (d: number) => {
    const weeks = cur.weeks + d;
    if (weeks < PHASE_LIMITS.weeks[0] || (d > 0 && room <= 0)) return false;
    update({ weeks });
    return true;
  };

  if (phases.length < 2)
    return (
      <div className="flex flex-wrap gap-2">
        <Button kind="ghost" icon="plus" disabled={room < 1} onClick={() => add("deload", 1)}>
          {t("cpg.phase.addDeload")}
        </Button>
        <Button kind="ghost" icon="layers" disabled={room < 1} onClick={() => add("build", Math.min(4, Math.max(1, room)))}>
          {t("cpg.phase.add")}
        </Button>
      </div>
    );

  return (
    <div className="space-y-3 rounded-2xl border border-line p-3">
      <div>
        <p className="text-sm font-medium">{t("cpg.phases")}</p>
        <p className="text-xs text-faint">{t("cpg.phase.hint")}</p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("cpg.phases")}>
        {phases.map((p, i) => (
          <Chip key={i} active={i === sel} onClick={() => onSelect(i)}>
            {t("cpg.phase.chip", { count: p.weeks, name: name(p.kind), n: i + 1 })}
          </Chip>
        ))}
        {!full && room > 0 && (
          <Chip onClick={() => add("build", Math.min(4, room))}>
            <span aria-hidden="true">+</span> {t("cpg.phase.add")}
          </Chip>
        )}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("cpg.phase.kind")}>
        {PHASE_KINDS.map((k) => (
          <Chip key={k} active={cur.kind === k} onClick={() => update({ kind: k })}>
            {name(k)}
          </Chip>
        ))}
      </div>
      <p className="text-xs text-muted">{t(`cpg.phase.rule.${cur.kind}`)}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Bump dir={-1} size="sm" aria={t("cpg.phase.fewer", { name: name(cur.kind) })} onStep={step} />
          <span className="num w-24 text-center text-sm font-semibold">{t("cpg.phase.weeks", { count: cur.weeks })}</span>
          <Bump dir={1} size="sm" aria={t("cpg.phase.more", { name: name(cur.kind) })} onStep={step} />
        </div>
        <Button kind="quiet" icon="trash" onClick={remove}>
          {t("cpg.phase.remove")}
        </Button>
      </div>
      <p className="text-xs text-faint">{t("cpg.phase.total", { count: total })}</p>
    </div>
  );
}
