"use client";

import { useState, type ReactNode } from "react";

import { SECTION_LABEL } from "@/components/titles";
import { findNearby, placeLine, type Listing, type Place } from "@/lib/gymDirectory";
import { decodeGym } from "@/lib/gymShare";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { fmtNum } from "@/lib/units";

import { Icon } from "./icons";
import { Button } from "./ui";

// "Find gyms near you": real gyms around here (gymPlaces.ts on the server; official ones first, with a check mark)
// and setups other lifters listed (gymDirectory.ts), so a lifter whose gym is already set up can take its
// equipment and weights instead of typing them in. Asks for one approximate position on tap only.

type Found = { gyms: Listing[]; places: Place[] };

export function NearbyGyms({
  onPick,
  onPickPlace,
  picked,
  onAdd,
}: {
  onPick: (l: Listing) => void;
  onPickPlace: (p: Place) => void;
  /** The listing or place id picked (setup wizard). */
  picked?: string | null;
  /** "Can't find your gym? Add it": shown after a search, where the screen can open the add form (not in setup). */
  onAdd?: () => void;
}) {
  const [state, setState] = useState<"idle" | "busy" | Found | string>("idle");
  const find = async () => {
    haptic("tick");
    setState("busy");
    const r = await findNearby();
    if ("gyms" in r) return setState(r);
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
  const add = onAdd && (
    <Button kind="quiet" icon="plus" className="w-full" onClick={onAdd}>
      {t("gym.new.link")}
    </Button>
  );
  if (!state.gyms.length && !state.places.length)
    return (
      <div className="grid gap-2">
        <p className="text-sm text-muted" role="status">
          {t("gym.near.none")}
        </p>
        {add}
      </div>
    );
  const row = (key: string, active: boolean, onClick: () => void, title: ReactNode, line: string) => (
    <li key={key}>
      <button
        type="button"
        aria-pressed={active}
        className={`press card w-full p-3 text-left ${active ? "border-accent" : ""}`}
        onClick={() => {
          haptic("select");
          onClick();
        }}
      >
        <span className="flex items-center gap-1.5 font-semibold break-words">{title}</span>
        <span className="num block text-sm text-muted">{line}</span>
      </button>
    </li>
  );
  return (
    <div className="grid gap-3">
      {state.places.length > 0 && (
        <ul className="grid gap-2" aria-label={t("gym.near.title")}>
          {state.places.map((p) =>
            row(
              p.id,
              picked === p.id,
              () => onPickPlace(p),
              <>
                <span className="min-w-0 break-words">{p.name}</span>
                {p.official && (
                  <span className="inline-flex shrink-0 text-accent" title={t("gym.place.official")}>
                    <Icon name="verified" size={18} />
                    <span className="sr-only">{t("gym.place.official")}</span>
                  </span>
                )}
              </>,
              [
                t("gym.near.away", { km: fmtNum(p.km) }),
                placeLine({ address: p.address, city: p.city, region: "" }),
                p.code ? t("gym.place.kitReady") : "",
                p.lifters > 0 ? t("gym.place.lifters", { count: p.lifters }) : "",
              ]
                .filter(Boolean)
                .join(" · "),
            ),
          )}
        </ul>
      )}
      {state.gyms.length > 0 && (
        <div>
          {state.places.length > 0 && <p className={`mb-2 ${SECTION_LABEL}`}>{t("gym.place.setups")}</p>}
          <ul className="grid gap-2" aria-label={t("gym.place.setups")}>
            {state.gyms.map((l) => {
              const kit = decodeGym(l.code);
              return row(
                l.id,
                picked === l.id,
                () => onPick(l),
                <span className="min-w-0 break-words">{l.name}</span>,
                [
                  t("gym.near.away", { km: fmtNum(l.km) }),
                  kit ? t("gym.near.kit", { count: kit.equipment.length }) : "",
                  l.adds > 0 ? t("gym.near.adds", { count: l.adds }) : "",
                ]
                  .filter(Boolean)
                  .join(" · "),
              );
            })}
          </ul>
        </div>
      )}
      {add}
      {state.places.some((p) => p.source === "osm") && <p className="text-xs text-faint">{t("gym.place.osm")}</p>}
    </div>
  );
}
