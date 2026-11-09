"use client";
import { track } from "@/lib/analytics";
import { can } from "@/lib/entitlements";
import { haptic } from "@/lib/juice";
import { missingFor, pickProgram, PROGRAM_BY_ID, PROGRAMS, weeklyPreview, type ProgramId, type ProgramInfo } from "@/lib/programs";
import { useApp } from "@/lib/store";
import { EQUIPMENT_LABEL, MUSCLES, MUSCLE_LABEL } from "@/lib/types";
import { useNow } from "@/lib/useNow";
import { useMemo, useState } from "react";
import { go } from "./router";
import { Button, Sheet } from "./ui";

// Pick how Today's workout is planned: the adaptive engine (the default), a classic fixed program,
// or a split the adaptive engine fills in. Text for the screen stays here so it can be translated.

const TEXT = {
  title: "Programs",
  intro: "Pick how your workouts are planned. You can switch any time; your history and stats stay.",
  adaptive: "Adaptive (recommended)",
  adaptiveBlurb: "Plans each workout from your gym, recovery and training block, sized to the time you have.",
  current: "Current",
  pro: "Pro",
  free: "Free",
  start: "Start this program",
  restart: "Restart from the beginning",
  needs: "This gym is missing",
  needsAfter: "Exercises it can't do are swapped for the closest match.",
  week: "A typical week, in hard sets per muscle",
  perWeek: (n: number) => `${n} days a week`,
};

export function Programs() {
  const { profile, gyms, events, setProfile } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const [open, setOpen] = useState<ProgramInfo | null>(null);
  const src = profile.planSource;
  const currentId = src?.kind === "program" ? src.id : null;

  const choose = (id: ProgramId | null) => {
    haptic("tap");
    if (!gym) return;
    setProfile({ planSource: id ? pickProgram(id, { profile, gym, events, now: Date.now() }) : { kind: "adaptive" } });
    track("feature", { name: "program", detail: id ?? "adaptive" });
    setOpen(null);
    go("today");
  };

  return (
    <div className="pb-24">
      <button type="button" onClick={() => go("settings")} className="press -ml-2 min-h-11 pt-2 text-muted">‹ Settings</button>
      <h1 className="text-2xl font-bold">{TEXT.title}</h1>
      <p className="mt-1 text-sm text-muted">{TEXT.intro}</p>

      <ul className="mt-4 space-y-3">
        <li>
          <button type="button" onClick={() => choose(null)} aria-pressed={!currentId} className={`press card w-full p-4 text-left ${!currentId ? "border-accent" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{TEXT.adaptive}</span>
              {!currentId && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{TEXT.current}</span>}
            </div>
            <p className="mt-1 text-sm text-muted">{TEXT.adaptiveBlurb}</p>
          </button>
        </li>
        {PROGRAMS.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => { haptic("tick"); setOpen(p); }} className={`press card w-full p-4 text-left ${currentId === p.id ? "border-accent" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{p.name}</span>
                <span className="flex shrink-0 gap-1.5">
                  {currentId === p.id && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{TEXT.current}</span>}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.tier === "pro" ? "bg-warn/15 text-warn" : "bg-raised text-muted"}`}>{p.tier === "pro" ? TEXT.pro : TEXT.free}</span>
                </span>
              </div>
              <p className="mt-0.5 text-xs text-faint">{p.level} · {TEXT.perWeek(p.daysPerWeek)} · also known as {p.aka[0]}</p>
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
          <li key={h} className="flex gap-3"><span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">{i + 1}</span>{h}</li>
        ))}
      </ol>
      {missing.length > 0 && (
        <p className="rounded-xl bg-warn/10 px-3 py-2 text-sm text-warn">{TEXT.needs}: {missing.map((e) => EQUIPMENT_LABEL[e].toLowerCase()).join(", ")}. {TEXT.needsAfter}</p>
      )}
      <div>
        <h3 className="text-sm font-semibold text-muted">{TEXT.week}</h3>
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
      <p className="text-xs text-faint">{p.basedOn} Names belong to their owners; this app isn&apos;t affiliated with them.</p>
      <Button className="w-full" disabled={!allowed} onClick={onStart}>{current ? TEXT.restart : TEXT.start}</Button>
    </div>
  );
}

/** The current program's name, for Settings and Today. */
export function programName(id: string | undefined): string | null {
  return id ? (PROGRAM_BY_ID.get(id)?.name ?? null) : null;
}
