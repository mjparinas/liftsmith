"use client";

import { useEffect, useState } from "react";

import {
  askForStand,
  editGym,
  ownedGyms,
  releaseGym,
  STAND_MIN_LIFTERS,
  standOrder,
  startGymClub,
  type OwnedGym,
  type StandOrder,
} from "@/lib/gymClaims";
import { encodeGym, kitOf } from "@/lib/gymShare";
import { currentLang, num, t, weekday } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { DAYS, formatHours, parseHours, type Week } from "@/lib/openingHours";
import { SITE_URL } from "@/lib/site";
import { useApp } from "@/lib/store";

import { go, goBack } from "./router";
import { Button, Chip, EmptyState, ScreenHeader, Section, Skeleton, Switch, SwitchRow } from "./ui";

// The owner's page for an official gym (#/gymedit/<id>, docs/decisions/gyms.md step 3): opening hours, website, phone,
// a short description, the equipment lifters get when they add the gym (one of the owner's own gym setups), and the
// free poster to print, plus a mailed table stand once 20 lifters train there (step 4).

const input = "card w-full px-4 py-3";
const OPEN = "06:00";
const CLOSE = "22:00";

/** One opening time per day, as the editor keeps it. Days with two ranges keep the first and last times. */
type Day = { open: boolean; from: string; to: string };

function toDays(raw: string): Day[] {
  const week = parseHours(raw);
  return DAYS.map((_, i) => {
    const d = week?.[i] ?? [];
    if (!week) return { open: true, from: OPEN, to: CLOSE };
    if (!d.length) return { open: false, from: OPEN, to: CLOSE };
    return { open: true, from: d[0]!.split("-")[0]!, to: d.at(-1)!.split("-")[1]! };
  });
}
const toWeek = (days: Day[]): Week => days.map((d) => (d.open && d.from < d.to ? [`${d.from}-${d.to}`] : []));

const errorText = (e: string) =>
  t(
    e === "hours"
      ? "gym.edit.err.hours"
      : e === "website"
        ? "gym.edit.err.website"
        : e === "words" || e === "link"
          ? "gym.claim.err.words"
          : e === "offline"
            ? "gym.near.offline"
            : "gym.near.failed",
  );

export function GymEdit({ id }: { id?: string }) {
  const gyms = useApp((s) => s.gyms);
  const [gym, setGym] = useState<OwnedGym | null | "none">(null);
  const [allDay, setAllDay] = useState(false);
  const [days, setDays] = useState<Day[]>([]);
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [kitFrom, setKitFrom] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [stand, setStand] = useState<StandOrder | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    if (id) void standOrder(id).then((o) => live && setStand(o));
    void ownedGyms().then((list) => {
      if (!live) return;
      const g = list?.find((x) => x.id === id) ?? "none";
      setGym(g);
      if (g === "none") return;
      setAllDay(g.hours === "24/7");
      setDays(toDays(g.hours));
      setWebsite(g.website);
      setPhone(g.phone);
      setAbout(g.description);
      setKitFrom(gyms.find((x) => x.placeId === g.id)?.id ?? null);
    });
    return () => {
      live = false;
    };
    // The lifter's gyms are only read once, to preselect the setup the owner added this gym with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  if (gym === null)
    return (
      <div className="grid gap-4 pt-6" role="status" aria-label={t("gym.near.looking")}>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    );
  if (gym === "none")
    return (
      <div className="pt-10">
        <EmptyState
          icon="gym"
          title={t("gym.edit.notYours")}
          body={t("gym.edit.notYoursBody")}
          action={<Button onClick={() => go("today")}>{t("remix.back")}</Button>}
        />
      </div>
    );
  const setDay = (i: number, change: Partial<Day>) => setDays((list) => list.map((d, j) => (j === i ? { ...d, ...change } : d)));
  const save = async () => {
    if (busy) return;
    setBusy(true);
    const source = gyms.find((g) => g.id === kitFrom);
    const r = await editGym(gym.id, {
      hours: allDay ? "24/7" : formatHours(toWeek(days)),
      website: website.trim(),
      phone: phone.trim(),
      description: about.trim(),
      ...(source ? { code: encodeGym({ ...kitOf(source), name: gym.name }) } : {}),
    });
    setBusy(false);
    if (r === true) {
      haptic("success");
      setStatus(t("gym.edit.saved"));
    } else {
      oops();
      setStatus(errorText(r));
    }
  };
  return (
    <div className="pb-2">
      <ScreenHeader title={t("gym.edit.title")} kicker={gym.name} back={{ label: t("gym.back"), onClick: goBack }} />

      <Results gym={gym} />
      <ClubSection gym={gym} />

      <Section title={t("gp.hours")}>
        <SwitchRow label={t("gp.allDay")} on={allDay} onChange={setAllDay} />
        {!allDay && (
          <ul className="card mt-3 divide-y divide-line">
            {days.map((d, i) => {
              const day = weekday((i + 1) % 7, "long");
              return (
                <li key={i} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2">
                  <span className="flex min-h-11 items-center gap-3">
                    <Switch on={d.open} onChange={(open) => setDay(i, { open })} label={t("gym.edit.openOn", { day })} />
                    <span aria-hidden>{day}</span>
                  </span>
                  {d.open ? (
                    <span className="flex items-center gap-2">
                      <input
                        type="time"
                        aria-label={t("gym.edit.opens", { day })}
                        value={d.from}
                        onChange={(e) => setDay(i, { from: e.target.value })}
                        className="card num px-2 py-2"
                      />
                      <span aria-hidden>–</span>
                      <input
                        type="time"
                        aria-label={t("gym.edit.closes", { day })}
                        value={d.to}
                        onChange={(e) => setDay(i, { to: e.target.value })}
                        className="card num px-2 py-2"
                      />
                    </span>
                  ) : (
                    <span className="text-sm text-muted">{t("gp.closed")}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={t("gym.edit.kit")}>
        <p className="mb-2 text-sm text-muted">{t("gym.edit.kitNote")}</p>
        <div className="flex flex-wrap gap-2">
          {gyms.map((g) => (
            <Chip key={g.id} active={kitFrom === g.id} onClick={() => setKitFrom(kitFrom === g.id ? null : g.id)}>
              {g.name}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-xs text-faint">{gym.code ? t("gym.edit.kitSet") : t("gym.edit.kitNone")}</p>
      </Section>

      <PosterSection gym={gym} stand={stand} onAsked={setStand} />

      <Section title={t("gym.edit.contact")}>
        <div className="space-y-3">
          <div>
            <label htmlFor="ge-web" className="mb-1 block text-sm text-muted">
              {t("gp.website")}
            </label>
            <input
              id="ge-web"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="ge-phone" className="mb-1 block text-sm text-muted">
              {t("gp.phone")}
            </label>
            <input id="ge-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="ge-about" className="mb-1 block text-sm text-muted">
              {t("gym.edit.about")}
            </label>
            <textarea id="ge-about" rows={3} maxLength={500} value={about} onChange={(e) => setAbout(e.target.value)} className={input} />
          </div>
        </div>
      </Section>

      <div className="mt-6 grid gap-2">
        <Button className="w-full py-4 text-lg" disabled={busy} onClick={() => void save()}>
          {t("gym.edit.save")}
        </Button>
        {status && (
          <p className="text-center text-sm text-muted" role="status">
            {status}
          </p>
        )}
        <a
          href={`${SITE_URL}/gyms/${gym.citySlug}/${gym.slug}/`}
          target="_blank"
          rel="noopener"
          className="press card flex min-h-11 items-center justify-between px-4 py-3 text-sm"
        >
          <span>{t("gym.place.page")}</span>
          <span aria-hidden className="text-muted">
            ›
          </span>
        </a>
        <Button
          kind="quiet"
          className="w-full"
          onClick={() => {
            if (!window.confirm(t("gym.edit.releaseAsk", { name: gym.name }))) return;
            void releaseGym(gym.id).then((ok) => ok && go("today"));
          }}
        >
          {t("gym.edit.release")}
        </Button>
      </div>
    </div>
  );
}

/**
 * How the gym is doing, and the one thing to do next (AGENTS.md "Action over stats"): lifters in all, new ones and
 * poster scans in the last 30 days, then the first step that's missing: hours, equipment, the poster, the 20 lifters a
 * mailed stand needs, or keeping the stand where members check in.
 */
function Results({ gym }: { gym: OwnedGym }) {
  const next = !gym.hours
    ? t("gym.edit.next.hours")
    : !gym.code
      ? t("gym.edit.next.kit")
      : gym.scans30 === 0
        ? t("gym.edit.next.poster")
        : gym.lifters < STAND_MIN_LIFTERS
          ? t("gym.edit.next.stand", { count: STAND_MIN_LIFTERS - gym.lifters })
          : t("gym.edit.next.keep");
  const tile = (value: number, label: string) => (
    <div className="card p-3 text-center">
      <p className="display text-2xl">{num(value)}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
  return (
    <Section title={t("gym.edit.results")}>
      <div className="grid grid-cols-3 gap-2">
        {tile(gym.lifters, t("gym.edit.res.lifters"))}
        {tile(gym.newLifters, t("gym.edit.res.new"))}
        {tile(gym.scans30, t("gym.edit.res.scans"))}
      </div>
      <p className="card card-tint mt-3 p-3 text-sm" style={{ ["--tint" as string]: "var(--color-accent)" }}>
        {next}
      </p>
    </Section>
  );
}

/** The gym's own club, with its weekly leaderboard and crew goal (social.ts gymClubStart). It runs in Friends. */
function ClubSection({ gym }: { gym: OwnedGym }) {
  const [code, setCode] = useState(gym.club);
  const [problem, setProblem] = useState<"friends" | string | null>(null);
  const [busy, setBusy] = useState(false);
  const start = async () => {
    if (busy) return;
    setBusy(true);
    const r = await startGymClub(gym.id);
    setBusy(false);
    if ("code" in r) {
      haptic("success");
      setCode(r.code);
      return go("club", r.code);
    }
    oops();
    setProblem(r.error === "notJoined" ? "friends" : errorText(r.error));
  };
  return (
    <Section title={t("gym.edit.club")}>
      <p className="mb-2 text-sm text-muted">{t("gym.edit.clubNote")}</p>
      {code ? (
        <Button kind="ghost" icon="trophy" className="w-full" onClick={() => go("club", code)}>
          {t("gym.edit.clubOpen")}
        </Button>
      ) : problem === "friends" ? (
        <div className="grid gap-2">
          <p className="text-sm" role="alert">
            {t("gym.edit.clubFriends")}
          </p>
          <Button kind="ghost" icon="people" className="w-full" onClick={() => go("friends")}>
            {t("gym.edit.clubGoFriends")}
          </Button>
        </div>
      ) : (
        <>
          <Button kind="ghost" icon="trophy" className="w-full" disabled={busy} onClick={() => void start()}>
            {t("gym.edit.clubStart")}
          </Button>
          {problem && (
            <p className="mt-2 text-sm text-bad" role="alert">
              {problem}
            </p>
          )}
        </>
      )}
    </Section>
  );
}

/** The free poster any gym prints itself, and the table stand we mail once STAND_MIN_LIFTERS lifters train there. */
function PosterSection({ gym, stand, onAsked }: { gym: OwnedGym; stand: StandOrder | null; onAsked: (o: StandOrder) => void }) {
  const [address, setAddress] = useState(gym.address);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const earned = gym.lifters >= STAND_MIN_LIFTERS;
  const open = stand && stand.status !== "cancelled";
  const ask = async () => {
    if (busy) return;
    setBusy(true);
    const r = await askForStand(gym.id, address.trim(), currentLang());
    setBusy(false);
    if (r === true) {
      haptic("success");
      onAsked({ status: "requested", createdAt: Date.now() });
    } else {
      oops();
      setError(r === "address" ? t("gym.edit.standErr") : errorText(r));
    }
  };
  return (
    <Section title={t("gym.edit.poster")}>
      <p className="mb-2 text-sm text-muted">{t("gym.edit.posterNote")}</p>
      <a
        href={`${SITE_URL}/gyms/${gym.citySlug}/${gym.slug}/poster/`}
        target="_blank"
        rel="noopener"
        className="press card flex min-h-11 items-center justify-between px-4 py-3 text-sm"
      >
        <span>{t("gym.edit.posterPrint")}</span>
        <span aria-hidden className="text-muted">
          ›
        </span>
      </a>
      <div className="mt-3 text-sm">
        {open ? (
          <p className="text-muted" role="status">
            {stand.status === "shipped" ? t("gym.edit.standShipped") : t("gym.edit.standAsked")}
          </p>
        ) : !earned ? (
          <p className="text-muted">{t("gym.edit.standLocked", { count: num(gym.lifters) })}</p>
        ) : (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void ask();
            }}
          >
            <p>{t("gym.edit.standAsk")}</p>
            <label htmlFor="ge-stand" className="block text-muted">
              {t("gym.edit.standAddress")}
            </label>
            <textarea
              id="ge-stand"
              rows={3}
              maxLength={300}
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={input}
            />
            <Button kind="ghost" className="w-full" disabled={busy || address.trim().length < 8} submit>
              {t("gym.edit.standSend")}
            </Button>
            {error && (
              <p className="text-bad" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </Section>
  );
}
