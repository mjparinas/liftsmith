"use client";

// Finding people and richer profiles (Melvin, 2026-11-12, Friends gap list 2: items 1 and 8; docs/decisions/friends.md).
// People you may know (from real ties only), finding public profiles by name, a profile's level, streak and
// training calendar, and its followers and following lists.
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { date, t, weekday } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { refreshSocial, social, socialError } from "@/lib/social";
import { suggestionWhy, trainingCalendar, usualDaysLine } from "@/lib/socialProfile";
import { SOCIAL_LIMITS, type PersonCard, type PersonRow, type Suggestion } from "@/lib/socialTypes";
import { fmtNum } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { Avatar } from "./AvatarFace";
import { Icon } from "./icons";
import { go } from "./router";
import { Button, Section, Sheet } from "./ui";

/** One person in a list: their avatar, name and handle, opening their profile, with an optional line and buttons. */
export function PersonLine({ p, line, children }: { p: PersonRow; line?: string; children?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 py-1.5 pl-4 pr-1">
      <button type="button" onClick={() => go("person", p.handle)} className="press flex min-w-0 flex-1 items-center gap-3 py-1 text-left">
        <Avatar name={p.name} avatar={p.avatar} size={36} />
        <span className="min-w-0">
          <span className="block truncate font-medium">{p.name}</span>
          <span className="block truncate text-xs text-muted">{line ?? `@${p.handle}`}</span>
        </span>
      </button>
      {children}
    </li>
  );
}

/**
 * People you may know: someone who follows the lifter, training partners, club mates and people followed by
 * people they follow, each with why. Follow is one tap; Hide stops suggesting that person. Nothing shows when
 * there's no one to suggest.
 */
export function Suggestions({ reload = 0, onFollowed }: { reload?: number; onFollowed?: () => void }) {
  const [rows, setRows] = useState<Suggestion[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    social<{ people: Suggestion[] }>("suggest")
      .then((r) => live && setRows(r.people))
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, [reload]);
  const act = async (p: Suggestion, op: "follow" | "unsuggest") => {
    haptic("tick");
    try {
      await social(op, { handle: p.handle });
      setRows((r) => (r ?? []).filter((x) => x.handle !== p.handle));
      if (op === "follow") {
        track("feature", { name: "social_follow_suggested", value: p.reason });
        onFollowed?.();
        void refreshSocial();
      }
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  if (!rows?.length) return null;
  return (
    <Section title={t("social.suggest")}>
      <ul className="card divide-y divide-line">
        {rows.map((p) => (
          <PersonLine key={p.handle} p={p} line={suggestionWhy(p)}>
            <Button kind="primary" className="px-3 py-2 text-sm" onClick={() => void act(p, "follow")}>
              {p.open ? t("friends.follow") : t("social.ask")}
            </Button>
            <Button
              kind="quiet"
              className="px-3 py-2 text-sm"
              label={t("social.hideNamed", { name: p.name })}
              onClick={() => void act(p, "unsuggest")}
            >
              {t("social.hide")}
            </Button>
          </PersonLine>
        ))}
      </ul>
      {note && (
        <p role="status" className="mt-2 text-sm text-muted">
          {note}
        </p>
      )}
    </Section>
  );
}

/** Results for the find box as the lifter types: public profiles by name or handle, and an exact handle. */
export function SearchResults({ q }: { q: string }) {
  const [rows, setRows] = useState<PersonRow[] | null>(null);
  const query = q.trim();
  useEffect(() => {
    if (query.replace(/^@/, "").length < SOCIAL_LIMITS.searchMin) return;
    let live = true;
    // Waits for a pause in typing, so each letter isn't a request.
    const timer = setTimeout(() => {
      social<{ people: PersonRow[] }>("search", { q: query })
        .then((r) => live && setRows(r.people))
        .catch(() => live && setRows([]));
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query]);
  if (rows === null || query.replace(/^@/, "").length < SOCIAL_LIMITS.searchMin) return null;
  return (
    <ul className="card mt-2 divide-y divide-line" aria-label={t("social.results")}>
      {rows.map((p) => (
        <PersonLine key={p.handle} p={p} />
      ))}
      {!rows.length && <li className="px-4 py-3 text-sm text-muted">{t("social.noResults")}</li>}
    </ul>
  );
}

/** A profile's level, training-week streak and training calendar, with the days they usually train. */
export function ProfileStats({ person }: { person: PersonCard }) {
  const now = useNow();
  if (!person.canSee) return null;
  const weeks = trainingCalendar(person.trained, now);
  const usual = usualDaysLine(person.trained);
  const self = person.relation === "self";
  return (
    <>
      {(person.level > 0 || person.streak > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {person.level > 0 && (
            <span className="card inline-flex items-center gap-1.5 px-3 py-1.5 text-sm">
              <Icon name="sparkle" size={16} className="text-violet" />
              {t("social.level", { level: fmtNum(person.level) })}
            </span>
          )}
          {person.streak > 0 && (
            <span className="card inline-flex items-center gap-1.5 px-3 py-1.5 text-sm">
              <Icon name="flame" size={16} className="text-ember" />
              {t("social.streak", { count: person.streak })}
            </span>
          )}
        </div>
      )}
      <Section title={t("social.calendar")} icon="calendar">
        <div className="card p-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-2">
            <div className="grid grid-rows-7 gap-1 text-right text-[0.625rem] leading-none text-muted" aria-hidden>
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <span key={d} className="flex h-3 items-center justify-end">
                  {d % 2 ? weekday(d).slice(0, 2) : ""}
                </span>
              ))}
            </div>
            <ol
              className="grid grid-flow-col grid-rows-7 justify-between gap-1"
              aria-label={t("social.calendarLabel", { count: person.trained.length })}
            >
              {weeks.flatMap((w) =>
                w.days.map((on, i) => (
                  <li
                    key={`${w.start}-${i}`}
                    title={date(new Date(w.start + i * 86_400_000 + 43_200_000), { weekday: "short", month: "short", day: "numeric" })}
                    className={`h-3 w-3 rounded-[3px] ${on ? "bg-mint" : "bg-raised"}`}
                  />
                )),
              )}
            </ol>
          </div>
          <p className="mt-3 text-sm text-muted">
            {usual ?? (person.trained.length ? t("social.usualNone") : self ? t("social.calendarEmptySelf") : t("social.calendarEmpty"))}
          </p>
        </div>
      </Section>
    </>
  );
}

/** A profile's followers or following, opened from the counts on it (only for readers who may see the posts). */
export function PersonPeopleSheet({
  handle,
  list,
  onClose,
}: {
  handle: string;
  list: "followers" | "following" | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!list} onClose={onClose} title={list === "followers" ? t("friends.person.followers") : t("friends.person.following")}>
      {list && <PersonPeople key={list} handle={handle} list={list} />}
    </Sheet>
  );
}

function PersonPeople({ handle, list }: { handle: string; list: "followers" | "following" }) {
  const [rows, setRows] = useState<PersonRow[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    social<{ people: PersonRow[] }>("personPeople", { handle, list })
      .then((r) => live && setRows(r.people))
      .catch((e: unknown) => live && (setRows([]), setNote(socialError(e))));
    return () => {
      live = false;
    };
  }, [handle, list]);
  if (rows === null) return <p className="text-sm text-muted">{t("social.loading")}</p>;
  return (
    <ul className="card divide-y divide-line">
      {rows.map((p) => (
        <PersonLine key={p.handle} p={p} />
      ))}
      {!rows.length && <li className="px-4 py-3 text-sm text-muted">{note ?? t("social.listNone")}</li>}
    </ul>
  );
}
