"use client";

import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { withInvite } from "@/lib/inviteLink";
import { haptic, oops, sound } from "@/lib/juice";
import { liveRead } from "@/lib/liveRead";
import {
  browseLibrary,
  GOALS,
  libraryPageUrl,
  loadLibraryRoutine,
  noteSave,
  rate,
  report,
  REPORT_REASONS,
  searchPath,
  type Goal,
  type LibraryRoutine,
  type LibraryView,
  type ReportReason,
  type Search,
  type Sort,
} from "@/lib/routineLibrary";
import { decodeRoutine } from "@/lib/routineShare";
import { copyText, shareUrl } from "@/lib/shareLinks";
import { useApp } from "@/lib/store";
import { EQUIPMENT_LABEL, type Equipment } from "@/lib/types";

import { Icon } from "./icons";
import { go } from "./router";
import { SharedPreview } from "./SharedRoutine";
import { Button, Chip, EmptyState, InlineSwitch, ScreenHeader, Section, Sheet, Skeleton } from "./ui";
import { useShareInvite } from "./useShareInvite";

// The public routine library (#/library, docs/decisions/routine-library.md): search routines other lifters published,
// by words, goal and what the lifter's gym has, best rated or newest first; open one (#/library/<id>) to see it, save
// it to your routines in one tap, rate it once saved, share its page or report it. Publishing is in the routine editor
// (Routines.tsx). Pure web code: the phones call the API on SITE_URL, so Android, iOS and the web get it together.

export function Library({ arg }: { arg?: string }) {
  return arg ? <LibraryDetail id={arg} /> : <LibraryBrowse />;
}

const back = { label: t("prog.title"), onClick: () => go("programs") };

/** "Strength · Beginner · About 45 min · 6 exercises, 18 sets". */
export function factsLine(r: Pick<LibraryRoutine, "goal" | "level" | "minutes" | "code">): string {
  const shared = decodeRoutine(r.code);
  const items = shared?.items ?? [];
  const sets = items.reduce((k, i) => k + i.sets, 0);
  return [
    t(`cpg.goal.${r.goal}`),
    t(`cpg.level.${r.level}`),
    t("rl.minutes", { count: r.minutes }),
    t("rt.summary", { exercises: t("rt.exercises", { count: items.length }), sets: t("rt.sets", { count: sets }) }),
  ].join(" · ");
}

function Stars({ r }: { r: Pick<LibraryRoutine, "rating" | "saves"> }) {
  const avg = r.rating.average;
  if (avg === null && !r.saves) return null;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
      {avg !== null && (
        <span className="inline-flex items-center gap-1">
          <Icon name="star" size={14} filled className="text-ember" />
          <span className="num font-semibold text-ink">{avg.toFixed(1)}</span>
          <span>{t("rl.ratings", { count: r.rating.count })}</span>
        </span>
      )}
      {r.saves > 0 && <span>{t("rl.saves", { count: r.saves })}</span>}
    </p>
  );
}

function RoutineCard({ r }: { r: LibraryRoutine }) {
  return (
    <button type="button" onClick={() => go("library", r.id)} className="press card w-full p-4 text-left" data-testid="library-routine">
      <span className="block font-semibold break-words">{r.title}</span>
      <span className="mt-0.5 block text-xs text-faint">{t("rl.by", { name: r.by || t("rl.aLifter") })}</span>
      <span className="mt-0.5 block text-xs text-faint">{factsLine(r)}</span>
      {r.about && <span className="mt-1 line-clamp-2 block text-sm text-muted">{r.about}</span>}
      <Stars r={r} />
    </button>
  );
}

function LibraryBrowse() {
  const { gyms, profile } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [fits, setFits] = useState(true);
  const [sort, setSort] = useState<Sort>("top");
  const [list, setList] = useState<LibraryRoutine[] | null>(null);
  // The search that last failed to load, so a new search starts without the old error.
  const [failed, setFailed] = useState<string | null>(null);

  // Typing settles for a moment before it searches.
  useEffect(() => {
    const id = setTimeout(() => setQ(text), 300);
    return () => clearTimeout(id);
  }, [text]);

  const search: Search = useMemo(() => ({ q, goal, have: fits && gym ? gym.equipment : null, sort }), [q, goal, fits, gym, sort]);
  const path = searchPath(search);
  const error = failed === path;
  useEffect(() => {
    let stop = false;
    liveRead(
      `library.${path}`,
      () => browseLibrary(search),
      (l) => !stop && setList(l),
    ).catch(() => !stop && setFailed(path));
    return () => {
      stop = true;
    };
  }, [search, path]);

  const filtered = !!(q || goal || fits);
  return (
    <div className="pb-2">
      <ScreenHeader back={back} kicker={t("rl.kicker")} title={t("rl.title")} />
      <p className="mt-1 text-sm text-muted">{t("rl.intro")}</p>
      <div className="desk-col mt-4">
        <label className="sr-only" htmlFor="library-search">
          {t("rl.search")}
        </label>
        <input
          id="library-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("rl.searchPlaceholder")}
          autoComplete="off"
          maxLength={80}
          className="w-full rounded-xl border border-line bg-raised px-3 py-3 text-base outline-none focus:border-accent"
        />
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t("rl.goal")}>
          <Chip active={!goal} onClick={() => setGoal(null)}>
            {t("rl.allGoals")}
          </Chip>
          {GOALS.map((g) => (
            <Chip key={g} active={goal === g} onClick={() => setGoal(goal === g ? null : g)}>
              {t(`cpg.goal.${g}`)}
            </Chip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t("rl.sortBy")}>
          <Chip active={sort === "top"} onClick={() => setSort("top")}>
            {t("rl.sort.top")}
          </Chip>
          <Chip active={sort === "new"} onClick={() => setSort("new")}>
            {t("rl.sort.new")}
          </Chip>
        </div>
        {gym && (
          <div className="card mt-3 p-3">
            <InlineSwitch label={t("rl.fitsGym")} hint={t("rl.fitsGymHint", { gym: gym.name })} on={fits} onChange={setFits} />
          </div>
        )}
      </div>
      {!list && !error && <Skeleton className="mt-4 h-28" />}
      {error && !list && <EmptyState icon="layers" title={t("rl.offline")} body={t("rl.offlineBody")} />}
      {list?.length === 0 &&
        (filtered ? (
          <EmptyState icon="search" title={t("rl.none")} body={t("rl.noneBody")} />
        ) : (
          <EmptyState icon="layers" title={t("rl.empty")} body={t("rl.emptyBody")} />
        ))}
      {!!list?.length && (
        <ul className="desk-cols mt-4 grid gap-3">
          {list.map((r) => (
            <li key={r.id}>
              <RoutineCard r={r} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-faint">{t("rl.publishWhere")}</p>
    </div>
  );
}

function LibraryDetail({ id }: { id: string }) {
  const me = useAccount((s) => s.account?.id ?? null);
  const [r, setR] = useState<LibraryView | null>(null);
  const [state, setState] = useState<"loading" | "gone" | "ok">("loading");
  const [savedNow, setSavedNow] = useState(false);

  useEffect(() => {
    let stop = false;
    liveRead(
      `library.r.${id}`,
      () => loadLibraryRoutine(id),
      (x) => {
        if (stop) return;
        setR(x);
        setState("ok");
      },
    ).catch(() => !stop && setState((s) => (s === "ok" ? s : "gone")));
    return () => {
      stop = true;
    };
  }, [id, me]);

  const libBack = { label: t("rl.title"), onClick: () => go("library") };
  if (state === "loading")
    return (
      <div className="pb-2">
        <ScreenHeader back={libBack} title={t("rl.title")} />
        <Skeleton className="mt-4 h-40" />
      </div>
    );
  if (state === "gone" || !r)
    return (
      <div className="pb-2">
        <ScreenHeader back={libBack} title={t("rl.title")} />
        <EmptyState icon="layers" title={t("rl.gone")} body={t("rl.goneBody")} />
      </div>
    );

  const saved = r.saved || savedNow;
  const onSaved = () => {
    setSavedNow(true);
    track("feature", { name: "routine_library", detail: "save" });
    if (me) void noteSave(r.id).catch(() => null);
  };
  const needs = r.equipment.filter((e): e is Equipment => e in EQUIPMENT_LABEL).map((e) => EQUIPMENT_LABEL[e]);
  const header = (
    <>
      <ScreenHeader back={libBack} kicker={t("rl.by", { name: r.by || t("rl.aLifter") })} title={r.title} />
      <section className="card mt-4 p-4">
        <p className="text-sm font-medium">{factsLine(r)}</p>
        <Stars r={r} />
        {r.about && <p className="mt-2 text-sm whitespace-pre-line text-muted">{r.about}</p>}
        <p className="mt-2 text-xs text-faint">{t("rl.needs", { list: needs.length ? needs.join(", ") : t("rl.bodyweight") })}</p>
      </section>
    </>
  );
  // Exercises the app no longer knows are dropped by the decoder; the preview says so when nothing is left.
  const known = decodeRoutine(r.code)?.items.every((i) => EXERCISE_BY_ID.has(i.exerciseId)) ?? false;
  return (
    <div className="pb-2">
      <SharedPreview code={r.code} header={header} onSaved={onSaved} onBack={() => go("library")} />
      {known && (
        <div className="mt-2 grid gap-4">
          <RateCard r={r} saved={saved} signedIn={!!me} onRated={(x) => setR(x)} />
          <ShareAndReport r={r} signedIn={!!me} />
        </div>
      )}
    </div>
  );
}

function RateCard({
  r,
  saved,
  signedIn,
  onRated,
}: {
  r: LibraryView;
  saved: boolean;
  signedIn: boolean;
  onRated: (r: LibraryView) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  if (r.mine) return <p className="text-center text-sm text-muted">{t("rl.yours")}</p>;
  const why = !signedIn ? t("rl.rateSignIn") : !saved ? t("rl.rateSaveFirst") : r.myStars ? t("rl.rated") : t("rl.rateWhy");
  const give = async (stars: number) => {
    if (busy) return;
    haptic("select");
    sound.tick();
    setBusy(true);
    try {
      const next = stars === r.myStars ? 0 : stars;
      const rating = await rate(r.id, next);
      onRated({ ...r, rating, myStars: next });
      setNote(null);
      track("feature", { name: "routine_library", detail: "rate" });
    } catch {
      oops();
      setNote(t("rl.err.generic"));
    }
    setBusy(false);
  };
  const can = signedIn && saved;
  return (
    <section className="card p-4" aria-labelledby="rate-h">
      <h2 id="rate-h" className="font-semibold">
        {t("rl.rate")}
      </h2>
      <div className="mt-2 flex gap-1" role="group" aria-label={t("rl.rate")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={!can || busy}
            aria-pressed={r.myStars >= n && r.myStars > 0}
            aria-label={t("rl.rateStar", { count: n })}
            onClick={() => void give(n)}
            className="press grid h-11 w-11 place-items-center rounded-full disabled:opacity-40"
          >
            <Icon name="star" size={26} filled={r.myStars >= n} className={r.myStars >= n ? "text-ember" : "text-faint"} />
          </button>
        ))}
      </div>
      <p className="mt-1 text-sm text-muted" role="status">
        {note ?? why}
      </p>
      {r.rating.average === null && <p className="mt-1 text-xs text-faint">{t("rl.notYet", { count: 3 })}</p>}
    </section>
  );
}

function ShareAndReport({ r, signedIn }: { r: LibraryView; signedIn: boolean }) {
  const invite = useShareInvite();
  const [note, setNote] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const share = async () => {
    haptic("tap");
    const url = withInvite(libraryPageUrl(r), await invite.get());
    track("feature", { name: "routine_library", detail: "share" });
    if (await shareUrl(url, r.title)) return;
    setNote((await copyText(url)) ? t("rt.copied") : null);
  };
  return (
    <div className="grid gap-2">
      <Button kind="ghost" icon="share" className="w-full" onClick={() => void share()}>
        {t("rl.sharePage")}
      </Button>
      {note && (
        <p className="text-center text-xs text-faint" role="status">
          {note}
        </p>
      )}
      {signedIn && !r.mine && (
        <Button kind="quiet" icon="flag" className="w-full" onClick={() => setReporting(true)}>
          {t("rl.report")}
        </Button>
      )}
      <ReportSheet id={r.id} open={reporting} onClose={() => setReporting(false)} />
    </div>
  );
}

function ReportSheet({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const send = async () => {
    if (!reason) return;
    haptic("tap");
    try {
      await report(id, reason, text);
      setDone(true);
      setFailed(false);
      track("feature", { name: "routine_library", detail: "report" });
    } catch {
      oops();
      setFailed(true);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title={t("rl.report")}>
      {done ? (
        <p className="text-sm text-muted" role="status">
          {t("rl.reported")}
        </p>
      ) : (
        <Section title={t("rl.reportWhy")}>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("rl.reportWhy")}>
            {REPORT_REASONS.map((x) => (
              <Chip key={x} active={reason === x} onClick={() => setReason(x)}>
                {t(`rl.reason.${x}`)}
              </Chip>
            ))}
          </div>
          <label className="mt-3 block text-sm text-muted" htmlFor="library-report-note">
            {t("rl.reportNote")}
          </label>
          <textarea
            id="library-report-note"
            value={text}
            maxLength={300}
            rows={3}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-2 text-base outline-none focus:border-accent"
          />
          {failed && (
            <p className="mt-2 text-sm text-bad" role="alert">
              {t("rl.err.generic")}
            </p>
          )}
          <Button className="mt-3 w-full" disabled={!reason} onClick={() => void send()}>
            {t("rl.reportSend")}
          </Button>
        </Section>
      )}
    </Sheet>
  );
}
