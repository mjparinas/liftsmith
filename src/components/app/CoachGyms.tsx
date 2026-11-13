"use client";

import { useEffect, useState } from "react";

import { EXTRA_LIMITS } from "@/lib/gymExtras";
import { leaveAsTrainer, listAsTrainer, trainerGyms, type TrainerGym } from "@/lib/gymExtrasApi";
import { t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { useApp } from "@/lib/store";

import { go } from "./router";
import { Button, Section } from "./ui";

// "Gyms you train at" for a coach (docs/decisions/gyms.md "Round 3"): pick one of your own gyms that is a real gym, add
// a line about yourself, and the gym's page lists you with "Train with me", which opens the usual "Share my workouts"
// screen. An official gym's owner approves you first.

const input = "card w-full px-4 py-3";

export function CoachGyms() {
  const gyms = useApp((s) => s.gyms);
  const real = gyms.filter((g) => g.placeId);
  const [mine, setMine] = useState<TrainerGym[] | null>(null);
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    let live = true;
    void trainerGyms().then((list) => {
      if (!live) return;
      setMine(list ?? []);
      if (list?.[0]) setBio((b) => b || list[0]!.bio);
    });
    return () => {
      live = false;
    };
  }, [tries]);
  const reload = () => setTries((n) => n + 1);
  const listed = new Set((mine ?? []).map((x) => x.place));
  const add = async (place: string) => {
    const r = await listAsTrainer(place, bio.trim());
    if ("error" in r) {
      oops();
      return setStatus(
        t(
          r.error === "coach"
            ? "gym.coach.err.coach"
            : r.error === "name"
              ? "gym.coach.err.name"
              : r.error === "full"
                ? "gym.coach.err.full"
                : r.error === "words" || r.error === "link"
                  ? "gym.claim.err.words"
                  : r.error === "offline"
                    ? "gym.near.offline"
                    : "gym.near.failed",
        ),
      );
    }
    haptic("success");
    setStatus(r.status === "pending" ? t("gym.coach.pending") : t("gym.coach.listed"));
    reload();
  };
  return (
    <Section title={t("gym.coach.title")} icon="gym">
      <p className="mb-2 text-sm text-muted">{t("gym.coach.note")}</p>
      <label htmlFor="cg-bio" className="mb-1 block text-sm text-muted">
        {t("gym.coach.bio")}
      </label>
      <textarea
        id="cg-bio"
        rows={2}
        maxLength={EXTRA_LIMITS.bio}
        placeholder={t("gym.coach.bioPlaceholder")}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        className={input}
      />
      {mine && mine.length > 0 && (
        <ul className="card mt-3 divide-y divide-line">
          {mine.map((x) => (
            <li key={x.place} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{x.name}</span>
                <span className="block text-sm text-muted">{x.status === "pending" ? t("gym.coach.waiting") : t("gym.coach.shown")}</span>
              </span>
              <Button kind="ghost" onClick={() => void add(x.place)}>
                {t("gym.coach.update")}
              </Button>
              <Button
                kind="quiet"
                onClick={() =>
                  void leaveAsTrainer(x.place).then((ok) => {
                    if (!ok) return oops();
                    haptic("toggle");
                    reload();
                  })
                }
              >
                {t("gym.coach.leave")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {real.filter((g) => !listed.has(g.placeId!)).length > 0 ? (
        <div className="mt-3 grid gap-2">
          {real
            .filter((g) => !listed.has(g.placeId!))
            .map((g) => (
              <Button key={g.id} kind="ghost" icon="plus" className="w-full" onClick={() => void add(g.placeId!)}>
                {t("gym.coach.add", { name: g.name })}
              </Button>
            ))}
        </div>
      ) : (
        !real.length && (
          <div className="mt-3">
            <p className="text-sm text-muted">{t("gym.coach.noReal")}</p>
            <Button kind="ghost" icon="gym" className="mt-2 w-full" onClick={() => go("gym")}>
              {t("gym.coach.findGym")}
            </Button>
          </div>
        )
      )}
      {status && (
        <p className="mt-2 text-sm text-muted" role="status">
          {status}
        </p>
      )}
    </Section>
  );
}
