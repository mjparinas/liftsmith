"use client";

// Setup's coach path (trainer mode out of Labs, 2026-11-12; docs/decisions/trainer-mode.md). A lifter who opened a
// coach's invite and signed in sees whose invite it is, says what their coach should call them, reads exactly what the
// coach will and won't see, and agrees. The coach's starting setup (goal, experience, days a week) comes back with the
// link, so setup asks only for the gym, units and body weight. Not agreeing goes on to the usual setup.
import { useEffect, useState } from "react";

import { SCREEN_TITLE } from "@/components/titles";
import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { joinInvite, previewInvite, trainerError, type Person, type Setup } from "@/lib/trainer";

import { Mascot } from "./Mascot";
import { Button } from "./ui";

export function CoachJoin({
  code,
  name,
  onName,
  onJoined,
  onOwn,
}: {
  code: string;
  name: string;
  onName: (name: string) => void;
  onJoined: (setup: Setup) => void;
  onOwn: () => void;
}) {
  const [coach, setCoach] = useState<{ coach: Person; setup?: Setup } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    previewInvite(code)
      .then((r) => live && setCoach(r))
      .catch((e: unknown) => live && setError(trainerError(e)));
    return () => {
      live = false;
    };
  }, [code]);
  const agree = async () => {
    setBusy(true);
    try {
      const r = await joinInvite(code);
      haptic("success");
      sound.done();
      track("feature", { name: "trainer", detail: "join" });
      onJoined(r.setup ?? {});
    } catch (e) {
      oops();
      setError(trainerError(e));
    } finally {
      setBusy(false);
    }
  };
  const who = coach?.coach.name || t("trn.noName");
  const skips = coach?.setup && Object.keys(coach.setup).length > 0;
  return (
    <>
      <div className="flex items-center gap-3">
        <Mascot mood="cheer" size={64} className="animate-spring-in shrink-0" />
        <div>
          <p className="text-gradient text-sm font-bold uppercase tracking-[0.16em]">{t("setup.coach.kicker")}</p>
          <h1 className={`mt-1 ${SCREEN_TITLE}`}>{coach ? t("setup.coach.joinTitle", { name: who }) : t("setup.coach.title")}</h1>
        </div>
      </div>
      {error ? (
        <div className="mt-6">
          <p role="alert" className="card px-4 py-3 text-sm text-warn">
            {error}
          </p>
          <Button className="mt-4 w-full" onClick={onOwn}>
            {t("setup.coach.own")}
          </Button>
        </div>
      ) : !coach ? (
        <p role="status" className="mt-6 text-muted">
          {t("setup.coach.loading")}
        </p>
      ) : (
        <>
          {skips && <p className="mt-4 text-muted">{t("setup.coach.skips", { name: who })}</p>}
          <label htmlFor="coach-name" className="mt-6 block text-lg font-semibold">
            {t("setup.coach.name")}
          </label>
          <input
            id="coach-name"
            value={name}
            onChange={(e) => onName(e.target.value)}
            autoComplete="name"
            placeholder={t("setup.name.placeholder")}
            maxLength={40}
            className="mt-3 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-lg focus:border-accent/70 focus:outline-none"
          />
          <section className="card card-tint mt-6 p-4" style={{ ["--tint" as string]: "var(--color-accent)" }}>
            <p className="font-semibold">{t("trn.consentTitle", { name: who })}</p>
            <p className="mt-2 text-sm">{t("trn.consentSees")}</p>
            <p className="mt-2 text-sm text-muted">{t("trn.consentNot")}</p>
            <p className="mt-2 text-sm text-muted">{t("trn.consentStop")}</p>
          </section>
          <Button className="mt-5 w-full py-4 text-lg" disabled={busy} onClick={() => void agree()}>
            {t("trn.agree")}
          </Button>
          <Button kind="quiet" className="mt-2 w-full" onClick={onOwn}>
            {t("setup.coach.own")}
          </Button>
        </>
      )}
    </>
  );
}
