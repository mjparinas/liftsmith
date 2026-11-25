"use client";

import { useCallback, useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { WEEKDAYS } from "@/lib/calendar";
import { money } from "@/lib/coachPay";
import { assignProgram, endProgramAssigns, type AssignScope } from "@/lib/coachProgramAssign";
import {
  deleteProgram,
  GOALS,
  LEVELS,
  loadMine,
  PROGRAM_LIMITS,
  programLink,
  saveProgram,
  saveProgramKeepingDays,
  type CoachProgram,
  type MinePrograms,
  type ProgramDraft,
} from "@/lib/coachPrograms";
import { PROGRAM_TEMPLATES, routinesFromTemplate, type ProgramTemplate } from "@/lib/coachProgramTemplates";
import { t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { copyText, shareUrl } from "@/lib/shareLinks";
import { SITE_URL } from "@/lib/site";
import { useApp } from "@/lib/store";
import { loadTeams, type Team } from "@/lib/teams";
import { loadOverview, trainerError, type Overview, type Person } from "@/lib/trainer";

import { factsLine } from "./CoachProgram";
import { ProgramCalendar } from "./ProgramCalendar";
import { go } from "./router";
import { RoutinesSheet } from "./Routines";
import { BumpField, Button, Chip, EmptyState, InlineSwitch, Section, Sheet, Skeleton } from "./ui";

// Coaching › Programs (docs/decisions/coach-programs.md): a coach turns a few of their routines into a program with a
// title, a few words, a level, a goal, weeks and a price (free, or a price once their Stripe account takes payments),
// then shares its link. Paid programs sell on the website; the apps only ever show free ones and ones a lifter has.

const FIELD = "mt-1 w-full rounded-xl border border-line bg-raised px-3 py-2";

const templateId = (): string => {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
};

/** Builds draft fields and local routines from a template (kept outside render for purity). */
function draftFromTemplate(tpl: ProgramTemplate, d: ProgramDraft, now = Date.now()) {
  const { routines: made, routineIds, weekdays } = routinesFromTemplate(tpl, now, templateId);
  return {
    made,
    draft: {
      ...d,
      title: d.title.trim() || tpl.title,
      about: d.about.trim() || tpl.about,
      goal: tpl.goal,
      weeks: tpl.weeks,
      routineIds,
      weekdays,
    } satisfies ProgramDraft,
    weeks: String(tpl.weeks),
  };
}

const blank = (): ProgramDraft => ({
  title: "",
  about: "",
  level: "any",
  goal: "strength",
  weeks: 8,
  routineIds: [],
  price: 0,
  listed: true,
});

export function CoachPrograms({ sports = false }: { sports?: boolean }) {
  const [data, setData] = useState<MinePrograms | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ draft: ProgramDraft; program?: CoachProgram } | null>(null);
  const [assigning, setAssigning] = useState<CoachProgram | null>(null);
  const [calendar, setCalendar] = useState<CoachProgram | null>(null);
  const reload = useCallback(() => {
    loadMine()
      .then(setData)
      .catch((e: unknown) => setError(trainerError(e)));
  }, []);
  useEffect(reload, [reload]);

  if (!data)
    return error ? (
      <p className="mt-4 text-sm text-warn" role="status">
        {error}
      </p>
    ) : (
      <Skeleton className="mt-4 h-28" />
    );

  const mine = data.mine ?? [];
  const full = mine.length >= PROGRAM_LIMITS.perCoach;
  return (
    <Section title={t("cpg.mine")} icon="layers" info="coachPrograms">
      <p className="px-1 text-sm text-muted">
        {sports ? t("cpg.mineHintSports") : data.pay?.ready ? t("cpg.mineHint") : t("cpg.mineHintFree")}
      </p>
      {mine.length === 0 ? (
        <EmptyState icon="layers" title={t("cpg.noneMine")} body={sports ? t("cpg.noneMineBodySports") : t("cpg.noneMineBody")} />
      ) : (
        <ul className="mt-3 space-y-3">
          {mine.map((p) => (
            <li key={p.id} className="card p-4">
              <button
                type="button"
                className="press w-full text-left"
                onClick={() => {
                  haptic("tick");
                  setEditing({ program: p, draft: toDraft(p) });
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 font-semibold break-words">{p.title}</span>
                  <span className="num shrink-0 rounded-full bg-raised px-2 py-0.5 text-xs font-semibold text-muted">
                    {p.price ? money(p.price, p.currency) : t("cpg.free")}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-faint">{factsLine(p)}</p>
                <p className="mt-1 text-sm text-muted">
                  {p.listed ? t("cpg.listed") : t("cpg.unlisted")}
                  {p.price ? ` · ${t("cpg.sales", { count: p.sales ?? 0 })}` : ""}
                </p>
              </button>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  kind="ghost"
                  onClick={() => {
                    haptic("tick");
                    setAssigning(p);
                  }}
                >
                  {t("cpg.assign")}
                </Button>
                <Button
                  kind="ghost"
                  onClick={() => {
                    haptic("tick");
                    setCalendar(p);
                  }}
                >
                  {t("cpg.assignCalendar")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        {full ? (
          <p className="text-sm text-muted">{t("cpg.fullMine", { count: PROGRAM_LIMITS.perCoach })}</p>
        ) : (
          <Button icon="plus" kind="ghost" className="w-full" onClick={() => setEditing({ draft: blank() })}>
            {t("cpg.new")}
          </Button>
        )}
      </div>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.program ? t("cpg.edit") : t("cpg.new")} wide>
        {editing && (
          <Editor
            start={editing.draft}
            program={editing.program}
            payReady={data.pay.ready}
            currency={data.pay.currency}
            onDone={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </Sheet>
      <Sheet
        open={!!assigning}
        onClose={() => setAssigning(null)}
        title={assigning ? t("cpg.assignTitle", { title: assigning.title }) : ""}
      >
        {assigning && (
          <AssignSheet
            program={assigning}
            onDone={() => {
              setAssigning(null);
            }}
          />
        )}
      </Sheet>
      <Sheet open={!!calendar} onClose={() => setCalendar(null)} title={t("cpg.cal.title")} wide>
        {calendar && <ProgramCalendar programId={calendar.id} />}
      </Sheet>
    </Section>
  );
}

function toDraft(p: CoachProgram): ProgramDraft {
  return {
    id: p.id,
    title: p.title,
    about: p.about,
    level: p.level,
    goal: p.goal,
    weeks: p.weeks,
    routineIds: [],
    price: p.price,
    listed: p.listed,
  };
}

function Editor({
  start,
  program,
  payReady,
  currency,
  onDone,
}: {
  start: ProgramDraft;
  program?: CoachProgram;
  payReady: boolean;
  currency: string | null;
  onDone: () => void;
}) {
  const { profile } = useApp();
  const routines = profile.routines ?? [];
  const [d, setD] = useState<ProgramDraft>(start);
  const [weeks, setWeeks] = useState(String(start.weeks));
  const [price, setPrice] = useState(start.price ? String(start.price) : "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [routinesOpen, setRoutinesOpen] = useState(false);
  // An existing program keeps its days unless the coach picks new ones.
  const keepDays = !!program && d.routineIds.length === 0;
  const priceNum = Number(price) || 0;
  const ok =
    d.title.trim().length > 0 &&
    (keepDays || d.routineIds.length > 0) &&
    (!priceNum || (payReady && priceNum >= PROGRAM_LIMITS.price[0] && priceNum <= PROGRAM_LIMITS.price[1]));

  const toggleDay = (id: string) => {
    haptic("select");
    setD((x) =>
      x.routineIds.includes(id)
        ? { ...x, routineIds: x.routineIds.filter((r) => r !== id) }
        : x.routineIds.length >= PROGRAM_LIMITS.days
          ? x
          : { ...x, routineIds: [...x.routineIds, id] },
    );
  };

  const save = async () => {
    setBusy(true);
    setNote(null);
    try {
      const draft = { ...d, weeks: Math.min(16, Math.max(1, Math.round(Number(weeks) || 8))), price: payReady ? priceNum : 0 };
      if (keepDays && program) {
        // Same days as before: the server keeps them when the coach sends them back as they were.
        await saveProgramKeepingDays(draft, program);
      } else await saveProgram(draft, routines);
      haptic("success");
      track("feature", { name: "coach_program", detail: program ? "edit" : "new" });
      onDone();
    } catch (e) {
      oops();
      const m = e instanceof Error ? e.message : "";
      setNote(
        m === "title" || m === "about"
          ? t("cpg.err.words")
          : m === "noAccount"
            ? t("cpg.err.noAccount")
            : m === "teen"
              ? t("cpg.err.teen")
              : trainerError(e),
      );
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!program) return;
    setBusy(true);
    try {
      await deleteProgram(program.id);
      onDone();
    } catch (e) {
      setNote(trainerError(e));
    }
    setBusy(false);
  };

  const link = program ? programLink(SITE_URL, program.id) : null;
  const share = async () => {
    if (!link || !program) return;
    haptic("tick");
    if (!(await shareUrl(link, program.title))) setNote((await copyText(link)) ? t("cpg.copied") : link);
  };

  const applyTemplate = (tpl: ProgramTemplate) => {
    const { made, draft, weeks } = draftFromTemplate(tpl, d);
    for (const r of made) useApp.getState().saveRoutine(r);
    setD(draft);
    setWeeks(weeks);
    haptic("success");
    track("feature", { name: "coach_program", detail: `template_${tpl.id}` });
  };

  return (
    <div className="space-y-4">
      {!program && (
        <div>
          <p className="text-sm font-medium">{t("cpg.template")}</p>
          <p className="text-xs text-faint">{t("cpg.templateHint")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROGRAM_TEMPLATES.map((tpl) => (
              <Chip key={tpl.id} onClick={() => applyTemplate(tpl)}>
                {t(`cpg.template.${tpl.id}`)}
              </Chip>
            ))}
          </div>
        </div>
      )}
      <div>
        <label htmlFor="cpg-title" className="text-sm font-medium">
          {t("cpg.name")}
        </label>
        <input
          id="cpg-title"
          value={d.title}
          maxLength={PROGRAM_LIMITS.title}
          placeholder={t("cpg.namePlaceholder")}
          onChange={(e) => setD({ ...d, title: e.target.value })}
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="cpg-about" className="text-sm font-medium">
          {t("cpg.about")}
        </label>
        <textarea
          id="cpg-about"
          value={d.about}
          maxLength={PROGRAM_LIMITS.about}
          rows={3}
          placeholder={t("cpg.aboutPlaceholder")}
          onChange={(e) => setD({ ...d, about: e.target.value })}
          className={FIELD}
        />
      </div>
      <div>
        <p className="text-sm font-medium">{t("cpg.days.label")}</p>
        <p className="text-xs text-faint">
          {keepDays ? t("cpg.days.keep", { count: program?.days.length ?? 0 }) : t("cpg.days.hint", { count: PROGRAM_LIMITS.days })}
        </p>
        {routines.length === 0 ? (
          <div className="mt-2">
            <p className="text-sm text-muted">{t("cpg.days.none")}</p>
            <Button kind="ghost" icon="plus" className="mt-2" onClick={() => setRoutinesOpen(true)}>
              {t("cpg.days.make")}
            </Button>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("cpg.days.label")}>
            {routines.map((r) => {
              const at = d.routineIds.indexOf(r.id);
              return (
                <Chip key={r.id} active={at >= 0} onClick={() => toggleDay(r.id)}>
                  {at >= 0 ? `${at + 1}. ` : ""}
                  {r.name}
                </Chip>
              );
            })}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{t("cpg.levelLabel")}</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("cpg.levelLabel")}>
          {LEVELS.map((l) => (
            <Chip key={l} active={d.level === l} onClick={() => setD({ ...d, level: l })}>
              {t(`cpg.level.${l}`)}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium">{t("cpg.goalLabel")}</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("cpg.goalLabel")}>
          {GOALS.map((g) => (
            <Chip key={g} active={d.goal === g} onClick={() => setD({ ...d, goal: g })}>
              {t(`cpg.goal.${g}`)}
            </Chip>
          ))}
        </div>
      </div>
      <BumpField label={t("cpg.weeksLabel")} value={weeks} onChange={setWeeks} step={1} start={8} min={1} max={16} />
      {payReady ? (
        <div>
          <BumpField
            label={t("cpg.priceLabel", { currency: (currency ?? "usd").toUpperCase() })}
            value={price}
            onChange={setPrice}
            step={1}
            start={20}
            min={0}
            max={PROGRAM_LIMITS.price[1]}
            placeholder={t("cpg.free")}
          />
          <p className="mt-1 text-xs text-faint">{t("cpg.priceHint")}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">{t("cpg.priceNeedsPay")}</p>
      )}
      <InlineSwitch label={t("cpg.listedLabel")} hint={t("cpg.listedHint")} on={d.listed} onChange={(v) => setD({ ...d, listed: v })} />
      {note && (
        <p className="text-sm text-warn" role="status">
          {note}
        </p>
      )}
      <div className="grid gap-2">
        <Button className="w-full" disabled={!ok || busy} onClick={() => void save()}>
          {t("cpg.save")}
        </Button>
        {program && link && (
          <Button kind="ghost" icon="share" className="w-full" onClick={() => void share()}>
            {t("cpg.share")}
          </Button>
        )}
        {program && (
          <Button kind="quiet" className="w-full" onClick={() => go("program", program.id)}>
            {t("cpg.preview")}
          </Button>
        )}
        {program && (
          <Button kind="danger" className="w-full" disabled={busy} onClick={() => void remove()}>
            {program.sales ? t("cpg.takeOff") : t("cpg.delete")}
          </Button>
        )}
      </div>
      <RoutinesSheet open={routinesOpen} onClose={() => setRoutinesOpen(false)} />
    </div>
  );
}

function AssignSheet({ program, onDone }: { program: CoachProgram; onDone: () => void }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scope, setScope] = useState<AssignScope | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [weekdays, setWeekdays] = useState<number[][]>(() =>
    program.days.map((d, i) => d.weekdays ?? defaultWeekdays(program.days.length, i)),
  );

  useEffect(() => {
    void loadOverview()
      .then(setOverview)
      .catch(() => setOverview(null));
    void loadTeams()
      .then((o) => setTeams(o.teams ?? []))
      .catch(() => setTeams([]));
  }, []);

  const clients = overview?.clients ?? [];
  const goAssign = async () => {
    if (!scope) return;
    setBusy(true);
    setNote(null);
    try {
      const r = await assignProgram(program.id, scope, weekdays);
      haptic("success");
      track("feature", { name: "trainer", detail: "assignProgram" });
      setNote(t("cpg.assignDone", { count: r.assigned.length, skip: r.skipped.length }));
      if (r.assigned.length) setTimeout(onDone, 1200);
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
    setBusy(false);
  };

  const takeBack = async () => {
    setBusy(true);
    try {
      await endProgramAssigns({ programId: program.id });
      haptic("toggle");
      setNote(t("cpg.assignTaken"));
      track("feature", { name: "trainer", detail: "endProgram" });
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("cpg.assignHint")}</p>
      {program.days.map((d, i) => (
        <div key={i}>
          <p className="text-sm font-medium">{d.name}</p>
          <div className="mt-1 flex flex-wrap gap-1" role="group" aria-label={t("cpg.weekdays")}>
            {WEEKDAYS.map((label, w) => {
              const on = weekdays[i]?.includes(w) ?? false;
              return (
                <Chip
                  key={w}
                  active={on}
                  onClick={() =>
                    setWeekdays((all) =>
                      all.map((row, ri) => {
                        if (ri !== i) return row;
                        return on ? row.filter((x) => x !== w) : [...row, w].sort((a, b) => a - b);
                      }),
                    )
                  }
                >
                  {label}
                </Chip>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Chip active={scope?.type === "allClients"} onClick={() => setScope({ type: "allClients" })} disabled={!clients.length}>
          {t("cpg.assignAll", { count: clients.length })}
        </Chip>
        <Chip active={scope?.type === "clients"} onClick={() => setScope({ type: "clients", ids: picked })} disabled={!clients.length}>
          {t("cpg.assignPick")}
        </Chip>
        {teams.map((team) => (
          <Chip
            key={team.id}
            active={scope?.type === "team" && scope.teamId === team.id}
            onClick={() => setScope({ type: "team", teamId: team.id })}
          >
            {t("cpg.assignTeam", { name: team.name, count: team.members })}
          </Chip>
        ))}
      </div>
      {scope?.type === "clients" && (
        <div className="flex flex-wrap gap-2">
          {clients.map((c: Person) => {
            const on = picked.includes(c.id);
            return (
              <Chip
                key={c.id}
                active={on}
                onClick={() => {
                  const next = on ? picked.filter((x) => x !== c.id) : [...picked, c.id];
                  setPicked(next);
                  setScope({ type: "clients", ids: next });
                }}
              >
                {c.name}
              </Chip>
            );
          })}
        </div>
      )}
      {note && (
        <p className="text-sm text-muted" role="status">
          {note}
        </p>
      )}
      <Button
        className="w-full"
        disabled={busy || !scope || (scope.type === "clients" && !scope.ids.length) || weekdays.some((w) => !w.length)}
        onClick={() => void goAssign()}
      >
        {t("cpg.assignGo")}
      </Button>
      <Button kind="danger" className="w-full" disabled={busy} onClick={() => void takeBack()}>
        {t("cpg.assignTakeBack")}
      </Button>
    </div>
  );
}

function defaultWeekdays(days: number, i: number): number[] {
  if (days === 4) return [[1], [2], [4], [5]][i] ?? [1 + i];
  if (days === 6) return [[1], [2], [3], [4], [5], [6]][i] ?? [1 + i];
  if (days === 3)
    return (
      [
        [1, 4],
        [2, 5],
        [3, 6],
      ][i] ?? [1]
    );
  if (days === 2)
    return (
      [
        [1, 4],
        [2, 5],
      ][i] ?? [1]
    );
  return [((i % 5) + 1) as number];
}
