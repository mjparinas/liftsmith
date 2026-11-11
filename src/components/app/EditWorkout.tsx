"use client";

import { useId, useMemo, useState } from "react";

import { sessionDetail } from "@/lib/dashboard";
import { NAME_MAX, NOTE_MAX, sessionNoteOf } from "@/lib/editHistory";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { date, t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { TIMED } from "@/lib/progression";
import { useApp } from "@/lib/store";
import type { Exercise, SetEvent, Unit } from "@/lib/types";
import { fmtNum, fromKg, toKg } from "@/lib/units";

import { setText } from "./format";
import { Icon } from "./icons";
import { BumpField, Button, Sheet } from "./ui";

// Fixing a finished workout (Melvin, 2026-11-11: table stakes). History › a workout › Edit opens this sheet:
// its name and note, every set (tap one to change its weight and reps or take it out) and Delete this
// workout, which asks once. Nothing is saved until Save changes. The rules are in editHistory.ts and the
// actions in store/history.ts. Pure web code: Android, iOS and the web app get it together.

const exName = (id: string) => EXERCISE_BY_ID.get(id)?.name ?? id;
/** Reps count seconds for holds, carries and cardio. */
const timed = (ex: Exercise | undefined) => !!ex && (TIMED.has(ex.id) || !!ex.cardio);

/** Display-unit weight step for the bump buttons. Typing still takes any number. */
function weightStep(ex: Exercise | undefined, unit: Unit): number {
  if (ex?.load === "barbell" || ex?.load === "machine") return unit === "lb" ? 5 : 2.5;
  return unit === "lb" ? 2.5 : 1;
}

const show = (kg: number, unit: Unit) => String(Math.round(fromKg(kg, unit) * 100) / 100);

interface Draft {
  weight: string;
  reps: string;
}

/** The workout's name and note boxes, shared by the edit sheet and the Done screen. */
function NameNoteFields({
  name,
  text,
  onName,
  onText,
}: {
  name: string;
  text: string;
  onName: (v: string) => void;
  onText: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${id}-name`} className="text-sm font-semibold">
          {t("hx.name")}
        </label>
        <input
          id={`${id}-name`}
          value={name}
          maxLength={NAME_MAX}
          onChange={(e) => onName(e.target.value)}
          placeholder={t("hx.namePlaceholder")}
          className="mt-1 min-h-11 w-full rounded-xl border border-line bg-raised px-3"
        />
      </div>
      <div>
        <label htmlFor={`${id}-note`} className="text-sm font-semibold">
          {t("hx.note")}
        </label>
        <textarea
          id={`${id}-note`}
          value={text}
          maxLength={NOTE_MAX}
          rows={3}
          onChange={(e) => onText(e.target.value)}
          placeholder={t("hx.notePlaceholder")}
          className="mt-1 w-full rounded-xl border border-line bg-raised p-3 text-sm"
        />
      </div>
    </div>
  );
}

export function EditWorkoutSheet({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { events, profile, editPastSet, removePastSet, deleteWorkout, noteWorkout } = useApp();
  const unit = profile.unit;
  const detail = useMemo(() => sessionDetail(events, sessionId), [events, sessionId]);
  const saved = sessionNoteOf(events, sessionId);
  const [name, setName] = useState(saved?.name ?? "");
  const [text, setText2] = useState(saved?.text ?? "");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  if (!detail) return null;

  const draftOf = (s: SetEvent): Draft => drafts[s.id] ?? { weight: show(s.weight, unit), reps: String(s.reps) };
  const put = (s: SetEvent, d: Partial<Draft>) => setDrafts({ ...drafts, [s.id]: { ...draftOf(s), ...d } });
  const remove = (s: SetEvent) => {
    haptic("tick");
    setRemoved(new Set([...removed, s.id]));
    setOpen(null);
  };

  const save = () => {
    const all = detail.exercises.flatMap((g) => g.sets);
    // Every set taken out: that's deleting the workout.
    if (all.every((s) => removed.has(s.id))) {
      deleteWorkout(sessionId);
      onClose();
      return;
    }
    for (const s of all) if (removed.has(s.id)) removePastSet(s.id);
    for (const s of all) {
      const d = drafts[s.id];
      if (!d || removed.has(s.id)) continue;
      const w = Number(d.weight);
      const r = Number(d.reps);
      if (!Number.isFinite(w) || !Number.isFinite(r) || r < 1) continue;
      editPastSet(s.id, { weight: toKg(w, unit), reps: r });
    }
    noteWorkout(sessionId, { name, text });
    haptic("success");
    onClose();
  };

  const when = date(detail.start, { weekday: "long", month: "long", day: "numeric" });
  return (
    <Sheet open onClose={onClose} title={t("hx.title")}>
      <p className="text-sm text-muted">{when}</p>
      <div className="mt-4">
        <NameNoteFields name={name} text={text} onName={setName} onText={setText2} />
      </div>
      <h3 className="mt-5 text-sm font-semibold">{t("hx.sets")}</h3>
      <p className="text-xs text-faint">{t("hx.tapSet")}</p>
      <div className="mt-2 space-y-4">
        {detail.exercises.map((g, gi) => {
          const ex = EXERCISE_BY_ID.get(g.exerciseId);
          const left = g.sets.filter((s) => !removed.has(s.id));
          if (!left.length) return null;
          return (
            <div key={gi}>
              <h4 className="font-medium">{exName(g.exerciseId)}</h4>
              <ol className="mt-1 space-y-1">
                {left.map((s, j) => {
                  const d = draftOf(s);
                  const isOpen = open === s.id;
                  const kg = toKg(Number(d.weight) || 0, unit);
                  const reps = Number(d.reps) || s.reps;
                  return (
                    <li key={s.id} className="rounded-xl border border-line bg-surface">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => {
                          haptic("select");
                          setOpen(isOpen ? null : s.id);
                        }}
                        className="press num flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm"
                      >
                        <span className="w-5 text-faint">{j + 1}</span>
                        <span className="flex-1">{ex ? setText(ex, kg, reps, unit, s.distanceM) : fmtNum(reps)}</span>
                        <Icon name={isOpen ? "chevronUp" : "chevronDown"} size={16} className="text-muted" />
                      </button>
                      {isOpen && (
                        <div className="space-y-3 border-t border-line p-3">
                          {!ex?.cardio && (
                            <div>
                              <div className="text-xs text-muted">{t("hx.weight", { unit })}</div>
                              <BumpField
                                className="mt-1"
                                label={t("hx.weightOf", { name: exName(g.exerciseId), n: j + 1 })}
                                value={d.weight}
                                onChange={(v) => put(s, { weight: v })}
                                step={weightStep(ex, unit)}
                                start={fromKg(s.weight, unit)}
                                max={unit === "lb" ? 2000 : 900}
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-muted">{timed(ex) ? t("hx.seconds") : t("hx.reps")}</div>
                            <BumpField
                              className="mt-1"
                              label={t("hx.repsOf", { name: exName(g.exerciseId), n: j + 1 })}
                              value={d.reps}
                              onChange={(v) => put(s, { reps: v })}
                              step={1}
                              start={s.reps}
                              min={1}
                              max={timed(ex) ? 36000 : 500}
                            />
                          </div>
                          <Button kind="quiet" icon="trash" className="w-full" onClick={() => remove(s)}>
                            {t("hx.removeSet")}
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
      {removed.size > 0 && (
        <p className="mt-3 text-sm text-muted" role="status">
          {t("hx.removedCount", { count: removed.size })}{" "}
          <button type="button" className="press min-h-11 text-accent underline" onClick={() => setRemoved(new Set())}>
            {t("hx.undoRemove")}
          </button>
        </p>
      )}
      <p className="mt-4 text-xs text-faint">{t("hx.healthNote")}</p>
      <div className="mt-4 grid gap-2">
        <Button icon="check" className="w-full" onClick={save}>
          {t("hx.save")}
        </Button>
        {asking ? (
          <div className="rounded-2xl border border-bad/30 bg-bad/10 p-3" role="alertdialog" aria-label={t("hx.deleteAsk")}>
            <p className="text-sm">{t("hx.deleteAsk")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button kind="ghost" onClick={() => setAsking(false)}>
                {t("hx.deleteNo")}
              </Button>
              <Button
                kind="danger"
                onClick={() => {
                  deleteWorkout(sessionId);
                  sound.back();
                  haptic("warning");
                  onClose();
                }}
              >
                {t("hx.deleteYes")}
              </Button>
            </div>
          </div>
        ) : (
          <Button kind="danger" icon="trash" className="w-full" onClick={() => setAsking(true)}>
            {t("hx.delete")}
          </Button>
        )}
        <Button kind="quiet" className="w-full" onClick={onClose}>
          {t("hx.cancel")}
        </Button>
      </div>
    </Sheet>
  );
}

/** On the Done screen: name the workout and write a note on it, folded away until tapped. */
export function WorkoutNoteCard({ sessionId }: { sessionId: string }) {
  const { events, noteWorkout } = useApp();
  const saved = sessionNoteOf(events, sessionId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(saved?.name ?? "");
  const [text, setText2] = useState(saved?.text ?? "");
  const [done, setDone] = useState(false);
  if (!open)
    return (
      <Button kind="ghost" icon="edit" className="mt-4 w-full" onClick={() => setOpen(true)}>
        {saved ? t("hx.doneEdit") : t("hx.doneAdd")}
      </Button>
    );
  return (
    <section className="card mt-4 p-4 text-left" aria-label={t("hx.doneAdd")}>
      <NameNoteFields
        name={name}
        text={text}
        onName={(v) => {
          setName(v);
          setDone(false);
        }}
        onText={(v) => {
          setText2(v);
          setDone(false);
        }}
      />
      <Button
        kind="ghost"
        className="mt-3 w-full"
        onClick={() => {
          noteWorkout(sessionId, { name, text });
          setDone(true);
        }}
      >
        {done ? t("hx.saved") : t("hx.saveNote")}
      </Button>
    </section>
  );
}
