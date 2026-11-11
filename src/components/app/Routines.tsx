"use client";

import { useMemo, useState } from "react";

import { available, exercise } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { MAX_ITEMS, moveItem, NAME_MAX, routineFrom } from "@/lib/routines";
import { useApp } from "@/lib/store";
import { linkedToNext, linksOf, toggleLink, withLinks } from "@/lib/superset";
import { MUSCLE_LABEL, type Gym, type Routine, type RoutineItem } from "@/lib/types";

import { ExerciseBrowser } from "./ExerciseBrowser";
import { Icon } from "./icons";
import { Button, EmptyState, LinkToggle, Sheet } from "./ui";

// Saved routines (routines.ts): pick one for today, save today's plan or a finished workout, or build
// one from the exercise library. All of it is optional and happens before or after a workout.

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

function summary(r: Routine): string {
  const sets = r.items.reduce((n, i) => n + i.sets, 0);
  return t("rt.summary", { exercises: t("rt.exercises", { count: r.items.length }), sets: t("rt.sets", { count: sets }) });
}

/** The routines sheet on Today: use one, go back to the adaptive plan, save or build one. */
export function RoutinesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, preview, routineId, pickRoutine, saveRoutine, deleteRoutine } = useApp();
  const [editing, setEditing] = useState<Routine | null>(null);
  const routines = profile.routines ?? [];
  const close = () => {
    setEditing(null);
    onClose();
  };
  if (editing) {
    return (
      <Sheet open={open} onClose={close} title={routines.some((r) => r.id === editing.id) ? t("rt.edit") : t("rt.new")}>
        <RoutineEditor
          initial={editing}
          onSave={(r) => {
            haptic("success");
            sound.tick();
            saveRoutine(r);
            setEditing(null);
          }}
          onDelete={
            routines.some((r) => r.id === editing.id)
              ? () => {
                  haptic("warning");
                  deleteRoutine(editing.id);
                  setEditing(null);
                }
              : undefined
          }
          onCancel={() => setEditing(null)}
        />
      </Sheet>
    );
  }
  return (
    <Sheet open={open} onClose={close} title={t("rt.title")}>
      {routineId && (
        <Button
          kind="ghost"
          icon="sparkle"
          className="mb-3 w-full"
          onClick={() => {
            haptic("tick");
            pickRoutine(null);
            close();
          }}
        >
          {t("rt.backAdaptive")}
        </Button>
      )}
      {routines.length ? (
        <ul className="space-y-2">
          {routines.map((r) => {
            const on = r.id === routineId;
            return (
              <li
                key={r.id}
                className={`flex items-center gap-2 rounded-2xl border p-3 ${on ? "border-accent/50 bg-accent/10" : "border-line bg-raised"}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{r.name}</div>
                  <div className="num text-sm text-muted">{summary(r)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(r)}
                  aria-label={t("rt.editName", { name: r.name })}
                  className="press grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-muted hover:text-ink"
                >
                  <Icon name="settings" size={18} />
                </button>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    haptic("tap");
                    pickRoutine(on ? null : r.id);
                    close();
                  }}
                  className={`press min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${on ? "bg-accent/20 text-accent" : "border border-accent/50 text-accent"}`}
                >
                  {on ? t("rt.inUse") : t("rt.useToday")}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon="layers" mascot="curious" title={t("rt.empty")} body={t("rt.emptyBody")} />
      )}
      <div className="mt-4 grid gap-2">
        {preview && preview.items.length > 0 && (
          <Button
            kind="ghost"
            icon="plus"
            className="w-full"
            onClick={() => setEditing(routineFrom(preview.items, t("rt.todaysPlan"), newId(), Date.now()))}
          >
            {t("rt.saveToday")}
          </Button>
        )}
        <Button
          kind="quiet"
          icon="plus"
          className="w-full"
          onClick={() => {
            const at = Date.now();
            setEditing({ id: newId(), name: "", items: [], createdAt: at, updatedAt: at });
          }}
        >
          {t("rt.build")}
        </Button>
      </div>
    </Sheet>
  );
}

/** "Save as routine" on the summary: what was actually done, with any swaps and supersets. */
export function SaveDoneAsRoutine({ items }: { items: RoutineItem[] }) {
  const { saveRoutine } = useApp();
  const [editing, setEditing] = useState<Routine | null>(null);
  const [saved, setSaved] = useState(false);
  if (!items.length) return null;
  return (
    <>
      <Button
        kind="quiet"
        icon={saved ? "check" : "layers"}
        className="mt-3 w-full"
        disabled={saved}
        onClick={() => setEditing({ ...routineFrom(items, "", newId(), Date.now()), name: "" })}
      >
        {saved ? t("rt.saved") : t("rt.saveAs")}
      </Button>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title={t("rt.saveAs")}>
        {editing && (
          <RoutineEditor
            initial={editing}
            onSave={(r) => {
              haptic("success");
              saveRoutine(r);
              setSaved(true);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Sheet>
    </>
  );
}

function RoutineEditor({
  initial,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: Routine;
  onSave: (r: Routine) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const { gyms, profile } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const [name, setName] = useState(initial.name);
  const [items, setItems] = useState<RoutineItem[]>(initial.items);
  const [adding, setAdding] = useState(initial.items.length === 0);
  const tick = () => {
    haptic("select");
    sound.tick();
  };
  const setSets = (i: number, d: number) => {
    tick();
    setItems(items.map((x, k) => (k === i ? { ...x, sets: Math.min(10, Math.max(1, x.sets + d)) } : x)));
  };
  const remove = (i: number) => {
    tick();
    const left = items.filter((_, k) => k !== i);
    // Keep the supersets that don't involve the removed exercise; a lone leftover loses its link.
    setItems(withLinks(left, linksOf(left)));
  };
  return (
    <div>
      <label className="block text-sm font-medium" htmlFor="routine-name">
        {t("rt.name")}
      </label>
      <input
        id="routine-name"
        value={name}
        maxLength={NAME_MAX}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("rt.namePlaceholder")}
        className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-3 text-base outline-none focus:border-accent"
      />
      {items.length > 0 && (
        <ol className="mt-4 divide-y divide-line/70 overflow-hidden rounded-2xl border border-line">
          {items.map((it, i) => {
            const ex = exercise(it.exerciseId);
            return (
              <li key={`${it.exerciseId}-${i}`} className={`px-3 py-2 ${it.group ? "bg-accent/5" : ""}`}>
                <div className="flex items-center gap-2">
                  {i > 0 ? (
                    <LinkToggle
                      on={linkedToNext(items, i - 1)}
                      first={exercise(items[i - 1].exerciseId).name}
                      second={ex.name}
                      onToggle={() => setItems(toggleLink(items, i - 1))}
                    />
                  ) : (
                    <span className="w-11 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{ex.name}</div>
                    <div className="text-xs text-muted">{ex.primary.map((m) => MUSCLE_LABEL[m]).join(", ")}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label={t("rt.remove", { name: ex.name })}
                    className="press grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:text-bad"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      aria-hidden
                    >
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between pl-[52px]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSets(i, -1)}
                      aria-label={t("rt.fewer", { name: ex.name })}
                      className="press grid h-11 w-11 place-items-center rounded-full border border-line"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.6}
                        strokeLinecap="round"
                        aria-hidden
                      >
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="num w-16 text-center text-sm font-semibold">{t("rt.sets", { count: it.sets })}</span>
                    <button
                      type="button"
                      onClick={() => setSets(i, 1)}
                      aria-label={t("rt.more", { name: ex.name })}
                      className="press grid h-11 w-11 place-items-center rounded-full border border-line"
                    >
                      <Icon name="plus" size={16} strokeWidth={2.6} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => {
                        tick();
                        setItems(moveItem(items, i, -1));
                      }}
                      aria-label={t("rt.up", { name: ex.name })}
                      className="press grid h-11 w-11 place-items-center rounded-full text-muted disabled:opacity-30"
                    >
                      <Icon name="chevronLeft" size={18} className="rotate-90" />
                    </button>
                    <button
                      type="button"
                      disabled={i === items.length - 1}
                      onClick={() => {
                        tick();
                        setItems(moveItem(items, i, 1));
                      }}
                      aria-label={t("rt.down", { name: ex.name })}
                      className="press grid h-11 w-11 place-items-center rounded-full text-muted disabled:opacity-30"
                    >
                      <Icon name="chevronRight" size={18} className="rotate-90" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {items.length < MAX_ITEMS &&
        (adding ? (
          <ExercisePicker
            gym={gym}
            skip={items.map((i) => i.exerciseId)}
            onPick={(id) => {
              tick();
              setItems([...items, { exerciseId: id, sets: 3 }]);
              setAdding(false);
            }}
          />
        ) : (
          <Button kind="quiet" icon="plus" className="mt-3 w-full" onClick={() => setAdding(true)}>
            {t("rt.add")}
          </Button>
        ))}
      <div className="mt-5 grid gap-2">
        <Button icon="check" className="w-full" disabled={!items.length} onClick={() => onSave({ ...initial, name, items })}>
          {t("rt.save")}
        </Button>
        {onDelete && (
          <Button kind="danger" className="w-full" onClick={onDelete}>
            {t("rt.delete")}
          </Button>
        )}
        <Button kind="quiet" className="w-full" onClick={onCancel}>
          {t("rt.cancel")}
        </Button>
      </div>
    </div>
  );
}

function ExercisePicker({ gym, skip, onPick }: { gym: Gym | undefined; skip: string[]; onPick: (id: string) => void }) {
  const can = useMemo(() => new Set(available(gym?.equipment ?? []).map((e) => e.id)), [gym]);
  return (
    <div className="mt-4 rounded-2xl border border-line p-3">
      <p className="mb-2 text-sm font-medium">{t("rt.add")}</p>
      <ExerciseBrowser
        id="routine"
        gym={gym}
        skip={skip}
        onPick={onPick}
        action={<Icon name="plus" size={18} />}
        note={(e) => (can.has(e.id) ? undefined : t("rt.notHere"))}
      />
    </div>
  );
}
