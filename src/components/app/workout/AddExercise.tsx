"use client";

import { useState } from "react";

import { exercise } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { useApp } from "@/lib/store";

import { ExerciseBrowser } from "../ExerciseBrowser";
import { Icon } from "../icons";
import { Button, Sheet } from "../ui";

/**
 * "Add an exercise" under the workout (Melvin, 2026-11-11): the shared exercise browser in a sheet, and
 * the pick goes on the end of today's workout (cardio as one set). Between sets only, like everything optional.
 */
export function AddExercise() {
  const s = useApp();
  const { active, gyms } = s;
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  if (!active) return null;
  const gym = gyms.find((g) => g.id === active.plan.gymId) ?? gyms[0];
  return (
    <div className="mt-4">
      <Button kind="quiet" icon="plus" className="w-full" onClick={() => setOpen(true)}>
        {t("wk.find.add")}
      </Button>
      <p className="mt-1 text-center text-sm text-muted" role="status">
        {added ? t("wk.find.added", { name: exercise(added).name }) : ""}
      </p>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("wk.find.add")}>
        <ExerciseBrowser
          id="add"
          gym={gym}
          skip={active.plan.items.map((i) => i.exerciseId)}
          onPick={(id) => {
            haptic("tick");
            sound.tick();
            s.addExercise(id);
            setAdded(id);
            setOpen(false);
          }}
          action={<Icon name="plus" size={18} />}
        />
      </Sheet>
    </div>
  );
}
