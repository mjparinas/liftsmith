"use client";

// A club's crew sessions (Melvin, 2026-11-17: community gap 2; docs/decisions/friends.md "Club chat and crew sessions"):
// a time and place someone in the club posted, who's in, and who trained. On the club sheet above the board. Planning
// one is a name, a day chip and a − / + time (no typing for the time), and an optional place. Everyone who's in gets a
// push an hour before; posting a workout to Friends around its time marks the lifter trained and tags the others.
import { useState, type CSSProperties, type FormEvent } from "react";

import { SECTION_LABEL } from "@/components/titles";
import { track } from "@/lib/analytics";
import { atOf, crewDays, crewWhen, dayLabel, defaultMinutes, minMinutes, stepMinutes } from "@/lib/crew";
import { date, list as fmtList, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { social, socialError } from "@/lib/social";
import { SOCIAL_LIMITS, type ClubDetail, type CrewSession } from "@/lib/socialTypes";
import { useNow } from "@/lib/useNow";

import { Avatar } from "./AvatarFace";
import { Icon } from "./icons";
import { Bump, Button, Chip, Sheet } from "./ui";

export function CrewSessions({ club, onChange }: { club: ClubDetail; onChange: (sessions: CrewSession[]) => void }) {
  const sessions = club.sessions ?? [];
  const [planning, setPlanning] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const now = useNow();
  const act = async (op: "crewGoing" | "crewCancel", b: Record<string, unknown>) => {
    try {
      const r = await social<{ sessions: CrewSession[] }>(op, b);
      haptic("select");
      if (op === "crewGoing" && b.on !== false) sound.pop();
      track("feature", { name: op === "crewGoing" ? "social_crew_going" : "social_crew_cancel" });
      onChange(r.sessions);
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  return (
    <section className="card-tint mt-4 p-4" style={{ "--tint": "var(--color-ember)" } as CSSProperties} aria-labelledby={`crew-${club.id}`}>
      <h3 id={`crew-${club.id}`} className={SECTION_LABEL}>
        <Icon name="calendar" size={16} /> {t("crew.sessions")}
      </h3>
      <p className="mt-1 text-sm text-muted">{t("crew.sessionsHint")}</p>
      {sessions.length ? (
        <ul className="mt-3 space-y-3">
          {sessions.map((x) => {
            const when = x.at <= now ? t("crew.now") : crewWhen(x.at, now);
            const trained = x.going.filter((g) => g.trained).map((g) => g.name);
            return (
              <li key={x.id} className="rounded-2xl border border-line bg-surface p-3">
                <p className="font-semibold">{x.title}</p>
                <p className="text-sm">{x.place ? t("crew.where", { when, place: x.place }) : when}</p>
                <p className="text-xs text-muted">{t("crew.by", { name: x.by.name })}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex -space-x-2" aria-hidden>
                    {x.going.slice(0, 6).map((g) => (
                      <Avatar key={g.handle} name={g.name} avatar={g.avatar} size={26} />
                    ))}
                  </span>
                  <span className="min-w-0 text-sm text-muted">
                    {t("crew.going", { count: x.going.length })}
                    {x.going.length ? `: ${fmtList(x.going.map((g) => g.name))}` : ""}
                  </span>
                </div>
                {trained.length > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-sm">
                    <Icon name="check" size={16} className="text-good" />
                    {fmtList(trained.map((name) => t("crew.trained", { name })))}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    kind={x.in ? "ghost" : "primary"}
                    icon={x.in ? "check" : "plus"}
                    label={x.in ? t("crew.inNow") : undefined}
                    onClick={() => void act("crewGoing", { id: x.id, on: !x.in })}
                  >
                    {t("crew.in")}
                  </Button>
                  {x.canCancel && (
                    <Button kind="quiet" onClick={() => void act("crewCancel", { id: x.id })}>
                      {t("crew.cancel")}
                    </Button>
                  )}
                </div>
                {x.in && x.at > now - 3 * 3_600_000 && <p className="mt-2 text-xs text-muted">{t("crew.trainedNote")}</p>}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm">{t("crew.none")}</p>
      )}
      <Button kind="ghost" icon="plus" className="mt-3 w-full" onClick={() => setPlanning(true)}>
        {t("crew.plan")}
      </Button>
      {note && (
        <p role="alert" className="mt-2 text-sm text-bad">
          {note}
        </p>
      )}
      {planning && <PlanCrew club={club} onClose={() => setPlanning(false)} onPosted={onChange} />}
    </section>
  );
}

function PlanCrew({ club, onClose, onPosted }: { club: ClubDetail; onClose: () => void; onPosted: (s: CrewSession[]) => void }) {
  const [now] = useState(() => Date.now());
  // Late at night today has no time left to offer, so the chips start tomorrow.
  const days = crewDays(now + 1).filter((d) => minMinutes(d, now) <= 24 * 60 - 15);
  const [day, setDay] = useState(days[0]!);
  const [minutes, setMinutes] = useState(() => defaultMinutes(days[0]!, now));
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pickDay = (d: number) => {
    setDay(d);
    setMinutes((m) => (m >= minMinutes(d, now) ? m : defaultMinutes(d, now)));
  };
  const bump = (dir: 1 | -1, size: 1 | 2 | 5) => {
    const next = stepMinutes(minutes, dir, size, day, now);
    if (next === null) return false;
    setMinutes(next);
    return true;
  };
  const at = atOf(day, minutes);
  const post = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !title.trim()) return;
    setBusy(true);
    try {
      const r = await social<{ sessions: CrewSession[] }>("crewPost", { club: club.id, at, title: title.trim(), place: place.trim() });
      haptic("success");
      sound.done();
      track("feature", { name: "social_crew_post" });
      onPosted(r.sessions);
      onClose();
    } catch (err) {
      oops();
      setError(socialError(err));
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} title={t("crew.plan")}>
      <form onSubmit={(e) => void post(e)}>
        <label htmlFor="crew-title" className="block text-sm text-muted">
          {t("crew.name")}
        </label>
        <input
          id="crew-title"
          value={title}
          maxLength={SOCIAL_LIMITS.crewTitle}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("crew.namePlaceholder")}
          className="card mt-1 w-full px-4 py-3"
        />
        <p className={`mt-4 ${SECTION_LABEL}`}>{t("crew.day")}</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("crew.day")}>
          {days.map((d) => (
            <Chip key={d} active={d === day} onClick={() => pickDay(d)}>
              {dayLabel(d, now)}
            </Chip>
          ))}
        </div>
        <p className={`mt-4 ${SECTION_LABEL}`}>{t("crew.time")}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <Bump dir={-1} size="sm" label={t("crew.time")} onStep={bump} />
          <span className="num display text-2xl" aria-live="polite">
            {date(at, { hour: "numeric", minute: "2-digit" })}
          </span>
          <Bump dir={1} size="sm" label={t("crew.time")} onStep={bump} />
        </div>
        <label htmlFor="crew-place" className="mt-4 block text-sm text-muted">
          {t("crew.place")}
        </label>
        <input
          id="crew-place"
          value={place}
          maxLength={SOCIAL_LIMITS.crewPlace}
          onChange={(e) => setPlace(e.target.value)}
          placeholder={club.gymClub ? club.name : t("crew.placePlaceholder")}
          className="card mt-1 w-full px-4 py-3"
        />
        {club.gymClub && <p className="mt-1 text-xs text-muted">{t("crew.placeGym", { gym: club.name })}</p>}
        <p className="mt-4 text-sm font-medium">{crewWhen(at, now)}</p>
        <Button submit className="mt-3 w-full" disabled={busy || !title.trim()}>
          {t("crew.post")}
        </Button>
        {error && (
          <p role="alert" className="mt-2 text-sm text-bad">
            {error}
          </p>
        )}
      </form>
    </Sheet>
  );
}
