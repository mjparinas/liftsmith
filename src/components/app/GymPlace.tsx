"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchPlace, pickPlace, placeKit, type Place } from "@/lib/gymDirectory";
import { encodeGym } from "@/lib/gymShare";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";

import { go } from "./router";
import { SharedGym } from "./SharedGym";
import { Button, EmptyState, Skeleton } from "./ui";

// A real gym's page in the app (#/gymplace/<id>, docs/decisions/gyms.md): where the website's "Add this gym to your
// Liftsmith" button and, later, the gym's QR code land. Loads the gym, then shows the same preview as Find gyms near
// you, so one tap adds it with its equipment.

export function GymPlace({ id }: { id?: string }) {
  const unit = useApp((s) => s.profile.unit);
  const [place, setPlace] = useState<Place | "gone" | "offline" | null>(null);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (!id) return;
    let live = true;
    void fetchPlace(id).then((p) => live && setPlace(p));
    return () => {
      live = false;
    };
  }, [id, tries]);
  const code = useMemo(() => {
    if (!place || typeof place === "string") return null;
    const c = encodeGym(placeKit(place, unit).kit);
    pickPlace(place, c);
    return c;
  }, [place, unit]);
  if (!id || place === "gone")
    return (
      <div className="pt-10">
        <EmptyState
          icon="gym"
          title={t("gp.gone")}
          body={t("gp.goneBody")}
          action={<Button onClick={() => go("today")}>{t("remix.back")}</Button>}
        />
      </div>
    );
  if (place === "offline")
    return (
      <div className="pt-10">
        <EmptyState
          icon="gym"
          title={t("gym.near.failed")}
          body={t("gym.near.offline")}
          action={<Button onClick={() => setTries((n) => n + 1)}>{t("gym.place.retry")}</Button>}
        />
      </div>
    );
  if (!code)
    return (
      <div className="grid gap-4 pt-6" role="status" aria-label={t("gym.near.looking")}>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
      </div>
    );
  return <SharedGym code={code} />;
}
