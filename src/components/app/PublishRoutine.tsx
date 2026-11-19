"use client";

import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { AuthError, useAccount } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import {
  GOALS,
  LEVELS,
  LIBRARY_RULES,
  libraryPageUrl,
  loadMine,
  publish,
  publishedFrom,
  unpublish,
  type Goal,
  type Level,
  type LibraryRoutine,
} from "@/lib/routineLibrary";
import { useApp } from "@/lib/store";
import { isTeen } from "@/lib/teen";
import type { Routine } from "@/lib/types";

import { go } from "./router";
import { Button, Chip, InlineSwitch } from "./ui";

// "Publish to the routine library" in the routine editor (docs/decisions/routine-library.md): the lifter picks a goal
// and a level, adds a few words if they like and chooses whether their name shows, then publishes. Only the routine's
// exercises, sets, supersets and parts go out, never weights or notes. A published routine can be updated or taken out
// here. Signed out, it offers sign-in; under 18, it says publishing opens at 18 (saving and rating still work).

const goalFrom = (g: string | undefined): Goal => (g === "strength" ? "strength" : g === "muscle" ? "muscle" : "fitness");

export function PublishRoutine({ routine }: { routine: Routine }) {
  const { profile } = useApp();
  const signedIn = !!useAccount((s) => s.account);
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<LibraryRoutine[] | null>(null);
  const [title, setTitle] = useState(routine.name);
  const [about, setAbout] = useState("");
  const [goal, setGoal] = useState<Goal>(goalFrom(profile.goal));
  const [level, setLevel] = useState<Level>("any");
  const [showName, setShowName] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const published = mine ? publishedFrom(routine, mine) : undefined;
  useEffect(() => {
    if (!open || !signedIn || mine) return;
    loadMine()
      .then((m) => {
        setMine(m);
        const p = publishedFrom(routine, m);
        if (p) {
          setTitle(p.title);
          setAbout(p.about);
          setGoal(p.goal);
          setLevel(p.level);
          setShowName(!!p.by);
        }
      })
      .catch(() => setMine([]));
  }, [open, signedIn, mine, routine]);

  if (!open)
    return (
      <Button kind="ghost" icon="globe" className="w-full" onClick={() => setOpen(true)}>
        {t("rl.publish")}
      </Button>
    );

  const body = () => {
    if (!signedIn)
      return (
        <>
          <p className="text-sm text-muted">{t("rl.signInPublish")}</p>
          <Button kind="ghost" className="mt-3 w-full" onClick={() => go("account")}>
            {t("rl.signIn")}
          </Button>
        </>
      );
    if (isTeen(profile)) return <p className="text-sm text-muted">{t("rl.teen")}</p>;
    const send = async () => {
      haptic("tap");
      setBusy(true);
      setNote(null);
      try {
        const r = await publish({ ...routine, name: routine.name }, { id: published?.id, title, about, goal, level, showName });
        setMine((m) => [r, ...(m ?? []).filter((x) => x.id !== r.id)]);
        haptic("success");
        sound.tick();
        setNote(published ? t("rl.updated") : t("rl.published"));
        track("feature", { name: "routine_library", detail: published ? "update" : "publish" });
      } catch (e) {
        oops();
        const why = e instanceof AuthError ? e.message : "";
        setNote(
          why === "title"
            ? t("rl.err.title")
            : why === "about"
              ? t("rl.err.about")
              : why === "full"
                ? t("rl.err.full", { count: LIBRARY_RULES.perAccount })
                : why === "teen"
                  ? t("rl.teen")
                  : t("rl.err.generic"),
        );
      }
      setBusy(false);
    };
    const takeDown = async () => {
      if (!published) return;
      haptic("warning");
      setBusy(true);
      try {
        await unpublish(published.id);
        setMine((m) => (m ?? []).filter((x) => x.id !== published.id));
        setNote(t("rl.unpublished"));
        track("feature", { name: "routine_library", detail: "unpublish" });
      } catch {
        oops();
        setNote(t("rl.err.generic"));
      }
      setBusy(false);
    };
    return (
      <>
        <p className="text-sm text-muted">{t("rl.publishWhy")}</p>
        {published && "hidden" in published && published.hidden === true && <p className="mt-2 text-sm text-warn">{t("rl.hidden")}</p>}
        <label className="mt-3 block text-sm font-medium" htmlFor="publish-title">
          {t("rl.titleLabel")}
        </label>
        <input
          id="publish-title"
          value={title}
          maxLength={LIBRARY_RULES.title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-2.5 text-base outline-none focus:border-accent"
        />
        <label className="mt-3 block text-sm font-medium" htmlFor="publish-about">
          {t("rl.about")}
        </label>
        <textarea
          id="publish-about"
          value={about}
          maxLength={LIBRARY_RULES.about}
          rows={3}
          placeholder={t("rl.aboutPlaceholder")}
          onChange={(e) => setAbout(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-2 text-base outline-none focus:border-accent"
        />
        <p className="mt-3 text-sm font-medium" id="publish-goal">
          {t("rl.goal")}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-labelledby="publish-goal">
          {GOALS.map((g) => (
            <Chip key={g} active={goal === g} onClick={() => setGoal(g)}>
              {t(`cpg.goal.${g}`)}
            </Chip>
          ))}
        </div>
        <p className="mt-3 text-sm font-medium" id="publish-level">
          {t("rl.level")}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-labelledby="publish-level">
          {LEVELS.map((l) => (
            <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
              {t(`cpg.level.${l}`)}
            </Chip>
          ))}
        </div>
        <div className="mt-3">
          <InlineSwitch
            label={t("rl.showName")}
            hint={profile.name?.trim() ? t("rl.showNameHint", { name: profile.name.trim() }) : t("rl.showNameNone")}
            on={showName}
            onChange={setShowName}
          />
        </div>
        <div className="mt-3 grid gap-2">
          <Button icon="globe" className="w-full" disabled={busy || !title.trim() || !mine} onClick={() => void send()}>
            {published ? t("rl.update") : t("rl.publishGo")}
          </Button>
          {published && (
            <>
              <Button kind="quiet" className="w-full" onClick={() => go("library", published.id)}>
                {t("rl.view")}
              </Button>
              <Button kind="danger" className="w-full" disabled={busy} onClick={() => void takeDown()}>
                {t("rl.unpublish")}
              </Button>
            </>
          )}
        </div>
        {published && <p className="mt-2 text-xs break-all text-faint">{libraryPageUrl(published)}</p>}
      </>
    );
  };

  return (
    <section className="card p-4" aria-labelledby="publish-h">
      <h3 id="publish-h" className="font-semibold">
        {t("rl.publishTitle")}
      </h3>
      <div className="mt-2">{body()}</div>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </section>
  );
}
