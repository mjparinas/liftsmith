"use client";

import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { AuthError, useAccount } from "@/lib/auth";
import { money } from "@/lib/coachPay";
import {
  browse,
  buy,
  canBuyHere,
  getFree,
  loadProgramPage,
  programRoutines,
  shownHere,
  type CoachProgram,
  type ProgramPage,
} from "@/lib/coachPrograms";
import { t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { liveRead } from "@/lib/liveRead";
import { MAX_ROUTINES } from "@/lib/routines";
import { sameItems } from "@/lib/routineShare";
import { useApp } from "@/lib/store";

import { ProgramReviews } from "./ProgramReviews";
import { go } from "./router";
import { Button, EmptyState, ScreenHeader, Skeleton } from "./ui";

// Coaches' programs (#/program, docs/decisions/coach-programs.md): the list, and one program (#/program/<id>, or
// <id>~paid back from Stripe). A program's days save to the lifter's routines in one tap. Paid programs are bought on
// the web app only: the Android and iOS apps show free programs and ones the lifter already has, with no price.

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export function CoachProgramScreen({ arg }: { arg?: string }) {
  const [id, flag] = (arg ?? "").split("~");
  return id ? <ProgramDetail id={id} paid={flag === "paid"} /> : <Browse />;
}

/** "Coach" / "Personal trainer" / "Physio" and the name, or just the name. */
export const byLine = (p: Pick<CoachProgram, "coachName" | "role">) =>
  t("cpg.by", { name: p.coachName || t("cpg.aCoach"), role: p.role ? t(`trn.role.${p.role}`) : t("trn.role.coach") });

export const factsLine = (p: Pick<CoachProgram, "level" | "weeks" | "days">) =>
  [t(`cpg.level.${p.level}`), t("cpg.weeks", { count: p.weeks }), t("cpg.days", { count: p.days.length })].join(" · ");

/** What it costs, where a price may be shown: "Free", or the price on the web app. Nothing for a paid one in the apps. */
export const priceLabel = (p: Pick<CoachProgram, "price" | "currency">) =>
  p.price === 0 ? t("cpg.free") : canBuyHere() ? money(p.price, p.currency) : null;

export function ProgramCard({ p, onOpen }: { p: CoachProgram; onOpen: () => void }) {
  const price = priceLabel(p);
  return (
    <button type="button" onClick={onOpen} className="press card w-full p-4 text-left" data-testid="coach-program">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 font-semibold break-words">{p.title}</span>
        <span className="flex shrink-0 gap-1.5">
          {p.owned && <span className="rounded-full bg-good/15 px-2 py-0.5 text-xs font-semibold text-good">{t("cpg.yours")}</span>}
          {!p.owned && price && <span className="num rounded-full bg-raised px-2 py-0.5 text-xs font-semibold text-muted">{price}</span>}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-faint">{byLine(p)}</p>
      <p className="mt-0.5 text-xs text-faint">
        {factsLine(p)} · {t(`cpg.goal.${p.goal}`)}
      </p>
      {p.about && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.about}</p>}
    </button>
  );
}

function Browse() {
  const [list, setList] = useState<CoachProgram[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    liveRead(
      `programs.browse.${canBuyHere() ? "all" : "free"}`,
      () => browse(),
      (l) => setList(l.filter(shownHere)),
    ).catch(() => setError(true));
  }, []);
  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: t("prog.title"), onClick: () => go("programs") }} title={t("cpg.title")} />
      <p className="mt-1 text-sm text-muted">{canBuyHere() ? t("cpg.intro") : t("cpg.introApp")}</p>
      {!list && !error && <Skeleton className="mt-4 h-28" />}
      {(error || list?.length === 0) && <EmptyState icon="layers" title={t("cpg.none")} body={t("cpg.noneBody")} />}
      {!!list?.length && (
        <ul className="mt-4 space-y-3">
          {list.map((p) => (
            <li key={p.id}>
              <ProgramCard p={p} onOpen={() => go("program", p.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProgramDetail({ id, paid }: { id: string; paid: boolean }) {
  const { profile, active, saveShared } = useApp();
  const me = useAccount((s) => s.account?.id ?? null);
  const signedIn = !!me;
  const [p, setP] = useState<CoachProgram | null>(null);
  const [page, setPage] = useState<Omit<ProgramPage, "program">>({});
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<"loading" | "gone" | "ok">("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(paid ? t("cpg.thanks") : null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let stop = false;
    const load = () =>
      loadProgramPage(id)
        .then(({ program, ...rest }) => {
          if (stop) return;
          setP(program);
          setPage(rest);
          setState("ok");
        })
        // Gone, unlisted, or no connection the first time: a reload that worked before keeps what it showed.
        .catch(() => !stop && setState((s) => (s === "ok" ? s : "gone")));
    void load();
    // Back from Stripe: the sale reaches us by Stripe's webhook, a moment after the page comes back.
    const timers = paid ? [2_000, 5_000, 10_000, 20_000].map((ms) => setTimeout(() => void load(), ms)) : [];
    return () => {
      stop = true;
      timers.forEach(clearTimeout);
    };
  }, [id, paid, reload]);

  const routines = useMemo(() => profile.routines ?? [], [profile.routines]);
  const days = useMemo(() => (p ? programRoutines(p, 0, () => "") : []), [p]);
  const allSaved = days.length > 0 && days.every((d) => routines.some((r) => sameItems(r.items, d.items)));

  const back = { label: t("cpg.title"), onClick: () => go("program") };
  if (state === "loading")
    return (
      <div className="pb-2">
        <ScreenHeader back={back} title={t("cpg.title")} />
        <Skeleton className="mt-4 h-40" />
      </div>
    );
  // A paid program this lifter doesn't have isn't shown in the apps at all (store billing rules).
  if (state === "gone" || !p || !shownHere(p))
    return (
      <div className="pb-2">
        <ScreenHeader back={back} title={t("cpg.title")} />
        <EmptyState icon="layers" title={t("cpg.gone")} body={t("cpg.goneBody")} />
      </div>
    );

  const price = priceLabel(p);
  const canSave = days.length > 0;
  const room = MAX_ROUTINES - routines.length >= days.length;

  const saveDays = async () => {
    haptic("success");
    sound.tick();
    const now = Date.now();
    for (const r of programRoutines(p, now, newId)) if (!routines.some((x) => sameItems(x.items, r.items))) saveShared(r, false);
    setSaved(true);
    track("feature", { name: "coach_program", detail: p.owned ? "save" : "get" });
    // A free one goes on the lifter's list too, when they're signed in (it works signed out as well).
    if (!p.owned && p.price === 0 && signedIn) setP(await getFree(p.id).catch(() => p));
  };

  const purchase = async () => {
    haptic("tap");
    setBusy(true);
    setNote(null);
    try {
      track("feature", { name: "coach_program", detail: "buy" });
      await buy(p.id);
    } catch (e) {
      setNote(e instanceof AuthError && e.message === "teen" ? t("cpg.teen") : t("cpg.buyFailed"));
    }
    setBusy(false);
  };

  return (
    <div className="pb-2">
      <ScreenHeader back={back} kicker={byLine(p)} title={p.title} />
      <section className="card card-tint mt-4 p-4" style={{ ["--tint" as string]: "var(--color-accent)" }}>
        <p className="text-sm font-medium">
          {factsLine(p)} · {t(`cpg.goal.${p.goal}`)}
        </p>
        {p.about && <p className="mt-2 text-sm whitespace-pre-line text-muted">{p.about}</p>}
        {!p.owned && price && <p className="num mt-3 text-2xl font-extrabold">{price}</p>}
      </section>

      <ol className="card mt-4 divide-y divide-line">
        {p.days.map((d, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <span className="num w-6 shrink-0 text-sm font-bold text-accent">{i + 1}</span>
            <span className="min-w-0 flex-1">
              {d.code ? (
                <button
                  type="button"
                  className="press font-medium break-words underline-offset-2 hover:underline"
                  onClick={() => go("routine", d.code)}
                >
                  {d.name}
                </button>
              ) : (
                <span className="font-medium break-words">{d.name}</span>
              )}
            </span>
            <span className="num shrink-0 text-sm text-muted">
              {t("rt.summary", { exercises: t("rt.exercises", { count: d.exercises }), sets: t("rt.sets", { count: d.sets }) })}
            </span>
          </li>
        ))}
      </ol>
      {!canSave && <p className="mt-3 text-sm text-muted">{t("cpg.lockedDays")}</p>}

      {note && (
        <p className="mt-4 text-sm text-muted" role="status">
          {note}
        </p>
      )}

      <div className="mt-6 grid gap-2">
        {canSave ? (
          allSaved || saved ? (
            <>
              <p className="text-center text-sm text-good" role="status">
                {t("cpg.saved", { count: days.length })}
              </p>
              {!active && (
                <Button icon="check" className="w-full py-4 text-lg" onClick={() => go("today")}>
                  {t("cpg.toToday")}
                </Button>
              )}
            </>
          ) : !room ? (
            <p className="text-center text-sm text-muted" role="status">
              {t("rt.sharedFull", { count: MAX_ROUTINES })}
            </p>
          ) : (
            <Button icon="plus" className="w-full py-4 text-lg" onClick={() => void saveDays()}>
              {p.owned ? t("cpg.saveDays", { count: days.length }) : t("cpg.getFree")}
            </Button>
          )
        ) : canBuyHere() && p.price > 0 ? (
          signedIn ? (
            <Button icon="lock" className="w-full py-4 text-lg" disabled={busy} onClick={() => void purchase()}>
              {t("cpg.buy", { price: price ?? "" })}
            </Button>
          ) : (
            <Button className="w-full py-4 text-lg" onClick={() => go("account")}>
              {t("cpg.signInToBuy")}
            </Button>
          )
        ) : null}
        {canSave && <p className="text-center text-xs text-faint">{t("cpg.saveWhy")}</p>}
        {!canSave && canBuyHere() && p.price > 0 && <p className="text-center text-xs text-faint">{t("cpg.buyWhy")}</p>}
      </div>

      <div className="mt-6">
        <ProgramReviews
          id={p.id}
          page={page}
          coach={p.coachName}
          own={!!me && me === p.coachId}
          onChanged={() => setReload((n) => n + 1)}
        />
      </div>
    </div>
  );
}
