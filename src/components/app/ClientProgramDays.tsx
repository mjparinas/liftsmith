"use client";

// One client's own copy of a season program (docs/decisions/coach-programs.md "The program builder", stage 3,
// Melvin 2026-11-26): the coach changes a day for this client only (an exercise swapped for an injury, say), the day
// says it's changed, and Use the program's day puts it back. Program edits still reach every other day.
import { useState } from "react";

import { WEEKDAYS } from "@/lib/calendar";
import { tweakProgramDay, type ProgramAssign } from "@/lib/coachProgramAssign";
import { t, tFor } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { decodeRoutine, encodeRoutine } from "@/lib/routineShare";
import { trainerError } from "@/lib/trainer";
import type { Routine } from "@/lib/types";

import { RoutineEditor } from "./Routines";
import { Button, Sheet } from "./ui";

export function ClientProgramDays({ assign, athlete, onChange }: { assign: ProgramAssign; athlete: boolean; onChange: () => void }) {
  const [editing, setEditing] = useState<{ day: number; routine: Routine } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const tweaked = new Set(assign.tweaked ?? []);

  const open = (day: number) => {
    const d = assign.days[day];
    const decoded = d ? decodeRoutine(d.code) : null;
    if (!d || !decoded) return;
    setEditing({
      day,
      routine: {
        id: `tweak-${assign.id}-${day}`,
        name: decoded.name || d.name,
        items: decoded.items,
        // A working copy for the editor only: what's saved is its routine code.
        createdAt: 0,
        updatedAt: 0,
        ...(decoded.parts ? { parts: decoded.parts } : {}),
      },
    });
  };
  const save = async (day: number, r: Routine | null) => {
    try {
      await tweakProgramDay(assign.id, day, r ? { name: r.name, code: encodeRoutine(r) } : null);
      haptic(r ? "success" : "toggle");
      sound.tick();
      setNote(r ? tFor(athlete, "cpg.tweak.saved") : t("cpg.tweak.reset"));
      setEditing(null);
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };

  return (
    <div className="mt-3" data-testid="client-program-days">
      <p className="text-xs text-faint">{tFor(athlete, "cpg.tweak.hint")}</p>
      <ul className="mt-2 space-y-2">
        {assign.days.map((d, i) => (
          <li key={i} className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium break-words">{d.name}</p>
              <p className="text-xs text-muted">
                {d.weekdays.map((w) => WEEKDAYS[w]).join(" · ")}
                {tweaked.has(i) && (
                  <span className="ml-2 font-medium text-accent" data-testid="client-day-tweaked">
                    {tFor(athlete, "cpg.tweak.badge")}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              <Button kind="quiet" icon="edit" onClick={() => open(i)}>
                {tFor(athlete, "cpg.tweak.edit")}
              </Button>
              {tweaked.has(i) && (
                <Button kind="quiet" onClick={() => void save(i, null)}>
                  {t("cpg.tweak.undo")}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
      <Sheet wide open={!!editing} onClose={() => setEditing(null)} title={tFor(athlete, "cpg.tweak.title")}>
        {editing && (
          <RoutineEditor coachReps initial={editing.routine} onSave={(r) => void save(editing.day, r)} onCancel={() => setEditing(null)} />
        )}
      </Sheet>
    </div>
  );
}
