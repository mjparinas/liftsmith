"use client";

import { useState } from "react";

import { findNearby, type Listing } from "@/lib/gymDirectory";
import { decodeGym } from "@/lib/gymShare";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { fmtNum } from "@/lib/units";

import { Button } from "./ui";

// "Find my gym": gyms other lifters listed near here (gymDirectory.ts), so a lifter whose gym is already set up
// can take its equipment and weights instead of typing them in. Asks for one approximate position on tap only.

export function NearbyGyms({ onPick, picked }: { onPick: (l: Listing) => void; picked?: string | null }) {
  const [state, setState] = useState<"idle" | "busy" | Listing[] | string>("idle");
  const find = async () => {
    haptic("tick");
    setState("busy");
    const r = await findNearby();
    if ("gyms" in r) return setState(r.gyms);
    setState(t(r.error === "location" ? "gym.near.location" : r.error === "offline" ? "gym.near.offline" : "gym.near.failed"));
  };
  if (state === "idle" || state === "busy" || typeof state === "string")
    return (
      <div>
        <Button kind="ghost" icon="pin" className="w-full" onClick={find} disabled={state === "busy"}>
          {state === "busy" ? t("gym.near.looking") : t("gym.near.find")}
        </Button>
        <p className="mt-1 text-xs text-faint" role="status">
          {typeof state === "string" && state !== "idle" && state !== "busy" ? state : t("gym.near.note")}
        </p>
      </div>
    );
  if (!state.length)
    return (
      <p className="text-sm text-muted" role="status">
        {t("gym.near.none")}
      </p>
    );
  return (
    <ul className="grid gap-2" aria-label={t("gym.near.title")}>
      {state.map((l) => {
        const kit = decodeGym(l.code);
        return (
          <li key={l.id}>
            <button
              type="button"
              aria-pressed={picked === l.id}
              className={`press card w-full p-3 text-left ${picked === l.id ? "border-accent" : ""}`}
              onClick={() => {
                haptic("select");
                onPick(l);
              }}
            >
              <span className="block font-semibold break-words">{l.name}</span>
              <span className="num block text-sm text-muted">
                {t("gym.near.away", { km: fmtNum(l.km) })}
                {kit ? ` · ${t("gym.near.kit", { count: kit.equipment.length })}` : ""}
                {l.adds > 0 ? ` · ${t("gym.near.adds", { count: l.adds })}` : ""}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
