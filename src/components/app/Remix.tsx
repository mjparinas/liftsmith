"use client";

import { useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { exercise } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { adaptRemix, decodeRemix, encodeShared, remixUrl, sharedFromSession } from "@/lib/remix";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";

import { loadText, repsText } from "./format";
import { go } from "./router";
import { Button, ScreenHeader } from "./ui";

// A shared workout opened from a link (#/remix/<code>), rebuilt for this lifter's gym and strength.

export function Remix({ code }: { code?: string }) {
  const { start, active, profile, gyms, events } = useApp();
  const now = useNow();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  // Rebuilt once per link and gym, not on every new set, so the list doesn't shift while reading it.
  const remix = useMemo(() => {
    const shared = code ? decodeRemix(code) : [];
    return gym && shared.length ? adaptRemix(shared, gym, profile, events, now) : null;
  }, [code, gym?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!remix || !remix.plan.items.length) {
    return (
      <div className="pt-10 text-center">
        <p className="text-muted">{t("remix.broken")}</p>
        <Button className="mt-4" onClick={() => go("today")}>
          {t("remix.back")}
        </Button>
      </div>
    );
  }
  const { plan, swapped, missing } = remix;
  return (
    <div className="pb-2">
      <ScreenHeader title={t("remix.title")} />
      <p className="mt-1 text-muted">{t("remix.rebuilt", { gym: gym?.name ?? t("remix.yourGym"), min: plan.estMinutes })}</p>
      {(swapped.length > 0 || missing.length > 0) && (
        <div className="card mt-4 p-4 text-sm">
          {swapped.map((x) => (
            <p key={x.from} className="text-muted">
              {exercise(x.from).name} → <span className="text-ink">{exercise(x.to).name}</span> {t("remix.closest")}
            </p>
          ))}
          {missing.map((id) => (
            <p key={id} className="text-muted">
              {t("remix.missing", { name: exercise(id).name })}
            </p>
          ))}
        </div>
      )}
      <ol className="card mt-4 divide-y divide-line">
        {plan.items.map((it) => {
          const e = exercise(it.exerciseId);
          return (
            <li key={it.exerciseId} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium">{e.name}</span>
              <span className="num shrink-0 text-sm text-muted">
                {it.sets} × {repsText(e, it.target.reps)} · {loadText(e, it.target.weight, profile.unit)}
              </span>
            </li>
          );
        })}
      </ol>
      {active ? (
        <p className="mt-6 text-center text-sm text-muted">{t("remix.finishFirst")}</p>
      ) : (
        <Button
          className="mt-6 w-full py-4 text-lg"
          onClick={() => {
            haptic("tap");
            track("feature", { name: "remix", detail: swapped.length ? "adapted" : "as shared" });
            start(plan);
            go("workout");
          }}
        >
          {t("remix.start")}
        </Button>
      )}
      <Button kind="quiet" className="mt-2 w-full" onClick={() => go("today")}>
        {t("remix.notNow")}
      </Button>
    </div>
  );
}

/** "Share this workout": a link that opens it rebuilt for the other person's gym and weights. */
export function ShareWorkout({ sessionId }: { sessionId: string }) {
  const { events, profile } = useApp();
  const [note, setNote] = useState<string | null>(null);
  const items = sharedFromSession(events, sessionId, profile.goal);
  if (!items.length) return null;
  const url = remixUrl(encodeShared(items));
  const share = async () => {
    haptic("tap");
    const text = t("done.remixText");
    try {
      if (navigator.share) {
        await navigator.share({ title: t("remix.shareTitle"), text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNote(t("done.remixCopied"));
    } catch {
      setNote(null);
    }
  };
  return (
    <div>
      <Button kind="ghost" className="w-full" onClick={share}>
        {t("done.remixShare")}
      </Button>
      <p className="mt-1 text-xs text-faint">{note ?? t("done.remixHint")}</p>
    </div>
  );
}
