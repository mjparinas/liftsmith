"use client";

import { useEffect, useState, type FormEvent } from "react";

import { readAccount } from "@/lib/auth";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import {
  cancelStaffInvite,
  inviteStaff,
  joinStaff,
  removeStaff,
  staffInvite,
  staffLink,
  staffOf,
  type OwnedGym,
  type StaffView,
} from "@/lib/gymClaims";
import { readStarter } from "@/lib/gymStarter";
import { date, t } from "@/lib/i18n";
import { confetti, haptic, oops } from "@/lib/juice";
import { encodeRoutine } from "@/lib/routineShare";
import { copyText, shareUrl } from "@/lib/shareLinks";
import { useApp } from "@/lib/store";

import { go, goBack } from "./router";
import { Button, Chip, EmptyState, ScreenHeader, Section, Skeleton } from "./ui";

// Staff accounts and the starter program for an official gym (Melvin, 2026-11-13, docs/decisions/gyms.md "Staff and
// the starter program"). The owner invites managers and front-desk staff with a one-time link (#/gymstaff/<code>);
// they sign in with their own account and manage the gym's page with the owner. The starter program is one of the
// manager's own routines, suggested to new members on the gym's page.

const input = "card w-full px-4 py-3";

/** One line per exercise: "3 × Goblet squat". */
export function starterLines(code: string): { name: string; lines: string[] } | null {
  const s = readStarter(code);
  if (!s) return null;
  return { name: s.name || t("rt.defaultName"), lines: s.items.map((i) => `${i.sets} × ${EXERCISE_BY_ID.get(i.id)?.name ?? i.id}`) };
}

/** The owner's page: pick the routine new members are offered, or stop offering one. Saved with the page. */
export function StarterSection({ starter, onStarter }: { starter: string; onStarter: (code: string) => void }) {
  const saved = useApp((s) => s.profile.routines);
  const routines = saved ?? [];
  const shown = starterLines(starter);
  return (
    <Section title={t("gp.starterTitle")}>
      <p className="mb-2 text-sm text-muted">{t("gym.edit.starterNote")}</p>
      {shown ? (
        <div className="card mb-3 p-4">
          <p className="font-semibold break-words">{shown.name}</p>
          <ul className="mt-1 text-sm text-muted">
            {shown.lines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
          <Button kind="quiet" className="mt-2 w-full" onClick={() => onStarter("")}>
            {t("gym.edit.starterOff")}
          </Button>
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted">{t("gym.edit.starterNone")}</p>
      )}
      {routines.length ? (
        <div className="flex flex-wrap gap-2">
          {routines.map((r) => {
            const code = encodeRoutine(r);
            return (
              <Chip key={r.id} active={code === starter} onClick={() => onStarter(code === starter ? "" : code)}>
                {r.name}
              </Chip>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">{t("gym.edit.starterNoRoutines")}</p>
      )}
    </Section>
  );
}

/** The gym's page in the app: the starter program with one button that opens the usual Save screen for a routine. */
export function StarterCard({ code }: { code: string }) {
  const shown = starterLines(code);
  if (!shown) return null;
  return (
    <Section title={t("gp.starterTitle")}>
      <div className="card p-4">
        <p className="text-sm text-muted">{t("gp.starterBody")}</p>
        <p className="mt-3 font-semibold break-words">{shown.name}</p>
        <ul className="mt-1 text-sm">
          {shown.lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        <Button kind="ghost" icon="plus" className="mt-3 w-full" onClick={() => go("routine", code)}>
          {t("gp.starterSave")}
        </Button>
      </div>
    </Section>
  );
}

/**
 * Who manages the gym. The owner invites (a link to share, good once for a week), cancels invites and removes people;
 * staff see the list and can leave. Letting the gym go stays the owner's (on the owner's page).
 */
export function StaffSection({ gym }: { gym: OwnedGym }) {
  const owner = gym.role !== "staff";
  const [view, setView] = useState<StaffView | null>(null);
  const [tries, setTries] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    void staffOf(gym.id).then((v) => live && setView({ staff: v?.staff ?? [], invites: v?.invites ?? [] }));
    return () => {
      live = false;
    };
  }, [gym.id, tries]);
  const reload = () => setTries((n) => n + 1);
  const send = async (code: string) => {
    const url = staffLink(code);
    if (await shareUrl(url, t("gym.staff.shareTitle", { name: gym.name }))) return;
    if (await copyText(url)) setStatus(t("gym.staff.copied"));
  };
  const invite = async () => {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    const r = await inviteStaff(gym.id);
    setBusy(false);
    if ("error" in r) {
      oops();
      return setStatus(t(r.error === "full" ? "gym.staff.full" : r.error === "offline" ? "gym.near.offline" : "gym.near.failed"));
    }
    haptic("success");
    reload();
    await send(r.code);
  };
  return (
    <Section title={t("gym.staff.title")}>
      <p className="mb-2 text-sm text-muted">{owner ? t("gym.staff.note") : t("gym.staff.noteStaff")}</p>
      {!view ? (
        <Skeleton className="h-16" />
      ) : (
        <>
          {view.staff.length ? (
            <ul className="card divide-y divide-line">
              {view.staff.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="min-w-0">
                    <span className="block font-semibold break-words">{m.me ? t("gym.staff.you") : m.name}</span>
                    <span className="block text-xs text-muted">
                      {t("gym.staff.since", { date: date(m.at, { month: "short", day: "numeric" }) })}
                    </span>
                  </span>
                  {owner && (
                    <Button
                      kind="quiet"
                      onClick={() => {
                        if (!window.confirm(t("gym.staff.removeAsk", { name: m.name }))) return;
                        void removeStaff(gym.id, m.id).then((ok) => (ok ? reload() : oops()));
                      }}
                    >
                      {t("gym.staff.remove", { name: m.name })}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t("gym.staff.none")}</p>
          )}
          {owner && view.invites.length > 0 && (
            <ul className="card mt-3 divide-y divide-line">
              {view.invites.map((i) => (
                <li key={i.code} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="text-sm text-muted">
                    {t("gym.staff.pending", { date: date(i.expiresAt, { month: "short", day: "numeric" }) })}
                  </span>
                  <span className="flex gap-1">
                    <Button kind="quiet" onClick={() => void send(i.code)}>
                      {t("gym.staff.share")}
                    </Button>
                    <Button kind="quiet" onClick={() => void cancelStaffInvite(gym.id, i.code).then((ok) => (ok ? reload() : oops()))}>
                      {t("gym.staff.cancel")}
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {owner ? (
            <Button kind="ghost" icon="people" className="mt-3 w-full" disabled={busy} onClick={() => void invite()}>
              {t("gym.staff.invite")}
            </Button>
          ) : (
            <Button
              kind="quiet"
              className="mt-3 w-full"
              onClick={() => {
                if (!window.confirm(t("gym.staff.leaveAsk", { name: gym.name }))) return;
                void removeStaff(gym.id).then((ok) => (ok ? go("today") : oops()));
              }}
            >
              {t("gym.staff.leave")}
            </Button>
          )}
          {owner && <p className="mt-2 text-xs text-faint">{t("gym.staff.inviteNote")}</p>}
          {status && (
            <p className="mt-2 text-sm text-muted" role="status">
              {status}
            </p>
          )}
        </>
      )}
    </Section>
  );
}

/** #/gymstaff/<code>: the invite link. Shows the gym's name, asks for the name the owner will see, and joins. */
export function GymStaffJoin({ code }: { code?: string }) {
  const profileName = useApp((s) => s.profile.name ?? "");
  const signedIn = !!readAccount()?.token;
  const [gym, setGym] = useState<{ place: string; name: string } | "gone" | "offline" | null>(null);
  const [name, setName] = useState(profileName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!code || !signedIn) return;
    let live = true;
    void staffInvite(code).then((r) => {
      if (!live) return;
      setGym("error" in r ? (r.error === "offline" ? "offline" : "gone") : r);
    });
    return () => {
      live = false;
    };
  }, [code, signedIn]);
  const header = <ScreenHeader title={t("gym.staff.joinTitle")} back={{ label: t("gym.back"), onClick: goBack }} />;
  if (!signedIn)
    return (
      <div className="pb-2">
        {header}
        <EmptyState
          icon="people"
          title={t("gym.staff.signInTitle")}
          body={t("gym.staff.signIn")}
          action={<Button onClick={() => go("account")}>{t("gym.list.signInGo")}</Button>}
        />
      </div>
    );
  if (!code || gym === "gone" || gym === "offline")
    return (
      <div className="pb-2">
        {header}
        <EmptyState
          icon="people"
          title={gym === "offline" ? t("gym.near.failed") : t("gym.staff.gone")}
          body={gym === "offline" ? t("gym.near.offline") : t("gym.staff.goneBody")}
          action={<Button onClick={() => go("today")}>{t("remix.back")}</Button>}
        />
      </div>
    );
  if (!gym)
    return (
      <div className="grid gap-4 pt-6" role="status" aria-label={t("gym.near.looking")}>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32" />
      </div>
    );
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await joinStaff(code, name.trim());
    setBusy(false);
    if ("error" in r) {
      oops();
      return setError(
        t(
          r.error === "owner"
            ? "gym.staff.already"
            : r.error === "full"
              ? "gym.staff.full"
              : r.error === "name" || r.error === "empty"
                ? "gym.claim.err.name"
                : r.error === "words" || r.error === "link"
                  ? "gym.claim.err.words"
                  : r.error === "gone"
                    ? "gym.staff.gone"
                    : r.error === "offline"
                      ? "gym.near.offline"
                      : "gym.near.failed",
        ),
      );
    }
    haptic("celebrate");
    void confetti();
    go("gymedit", r.place);
  };
  return (
    <div className="pb-2">
      {header}
      <section className="card card-tint mt-4 p-4" style={{ ["--tint" as string]: "var(--color-accent)" }}>
        <h2 className="text-xl font-bold break-words">{gym.name}</h2>
        <p className="mt-2 text-sm text-muted">{t("gym.staff.joinBody", { name: gym.name })}</p>
      </section>
      <form className="mt-4 space-y-3" onSubmit={(e) => void submit(e)}>
        <div>
          <label htmlFor="gs-name" className="mb-1 block text-sm text-muted">
            {t("gym.staff.joinName")}
          </label>
          <input id="gs-name" autoComplete="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </div>
        <Button className="w-full py-4 text-lg" disabled={busy || !name.trim()} submit>
          {t("gym.staff.join")}
        </Button>
        {error && (
          <p className="text-center text-sm text-bad" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
