"use client";

import { useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { listingFor, markAdded, placeFor, placeLine, REPORT_REASONS, reportGym } from "@/lib/gymDirectory";
import { decodeGym, sameKit } from "@/lib/gymShare";
import { t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { EQUIPMENT_LABEL } from "@/lib/types";
import { fmtNum } from "@/lib/units";

import { Icon } from "./icons";
import { go } from "./router";
import { Button, EmptyState, ScreenHeader, Section, Sheet } from "./ui";

// A gym someone shared (#/gymlink/<code>, gymShare.ts): a preview of its equipment, plates and
// weights, then one tap adds it to this lifter's gyms and trains there.

const range = (list: readonly number[], key: "gym.dumbbells.range" | "gym.kettlebells.range", unit: string) =>
  list.length ? t(key, { from: fmtNum(list[0]!), to: fmtNum(list.at(-1)!), unit, count: list.length }) : t("gym.dumbbells.none");

export function SharedGym({ code }: { code?: string }) {
  const { gyms, active, importGym, setProfile } = useApp();
  const kit = useMemo(() => (code ? decodeGym(code) : null), [code]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const listing = useMemo(() => listingFor(code), [code]);
  // A real gym picked from Find gyms near you (gymPlaces.ts): its name, address and check mark.
  const place = useMemo(() => placeFor(code), [code]);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  if (!kit) {
    return (
      <div className="pt-10">
        <EmptyState
          icon="gym"
          title={t("gym.linkBroken")}
          body={t("gym.linkBrokenBody")}
          action={<Button onClick={() => go("today")}>{t("remix.back")}</Button>}
        />
      </div>
    );
  }
  const name = kit.name || t("gym.sharedName");
  // A real gym is "already yours" when one of your gyms is that gym, whatever its kit; a shared setup when the kit matches.
  const existing = addedId
    ? gyms.find((g) => g.id === addedId)
    : place
      ? gyms.find((g) => g.placeId === place.id)
      : gyms.find((g) => sameKit(g, kit));
  const plates = kit.plates.filter((p) => p.count > 0);
  const train = (id: string) => {
    haptic("tap");
    setProfile({ activeGymId: id });
    go("today");
  };
  const add = () => {
    haptic("success");
    sound.tick();
    const id = importGym({ ...kit, name }, place?.id);
    track("feature", { name: "gym_share", detail: place ? (place.official ? "official" : "place") : listing ? "nearby" : "import" });
    markAdded(listing, place?.id);
    setAddedId(id);
  };
  return (
    <div className="pb-2">
      <ScreenHeader title={place ? t("gym.place.title") : t("gym.sharedTitle")} kicker={place ? undefined : t("gym.sharedKicker")} />
      <section className="card card-tint mt-4 p-4" style={{ ["--tint" as string]: "var(--color-accent)" }}>
        <h2 className="flex items-center gap-1.5 text-xl font-bold break-words">
          <span className="min-w-0 break-words">{name}</span>
          {place?.official && (
            <span className="inline-flex shrink-0 text-accent">
              <Icon name="verified" size={22} />
              <span className="sr-only">{t("gym.place.official")}</span>
            </span>
          )}
        </h2>
        {place && placeLine(place) && <p className="mt-1 text-sm text-muted">{placeLine(place)}</p>}
        <p className="mt-2 text-sm text-muted">{!place ? t("gym.sharedWhy") : place.code ? t("gym.place.why") : t("gym.place.typical")}</p>
        {place?.official && <p className="mt-2 text-sm text-muted">{t("gym.place.officialNote")}</p>}
      </section>

      <Section title={t("gym.equipment")}>
        <div className="card p-4">
          {kit.equipment.length ? (
            <ul className="flex flex-wrap gap-2">
              {kit.equipment.map((e) => (
                <li key={e} className="rounded-full border border-line px-3 py-1 text-sm">
                  {EQUIPMENT_LABEL[e]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t("gym.bodyweight")}</p>
          )}
        </div>
      </Section>

      <Section title={t("gym.sharedKit")}>
        <dl className="card divide-y divide-line text-sm">
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 px-4 py-3">
            <dt className="text-muted">{t("gym.bars")}</dt>
            <dd className="num text-right">
              {kit.bars.length ? kit.bars.map((b) => `${b.name} ${fmtNum(b.weight)} ${kit.unit}`).join(", ") : t("gym.dumbbells.none")}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 px-4 py-3">
            <dt className="text-muted">{t("gym.sharedPlates")}</dt>
            <dd className="num text-right">
              {plates.length ? `${plates.map((p) => fmtNum(p.weight)).join(", ")} ${kit.unit}` : t("gym.dumbbells.none")}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 px-4 py-3">
            <dt className="text-muted">{t("gym.sharedDumbbells")}</dt>
            <dd className="num text-right">{range(kit.dumbbells, "gym.dumbbells.range", kit.unit)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 px-4 py-3">
            <dt className="text-muted">{t("gym.sharedKettlebells")}</dt>
            <dd className="num text-right">{range(kit.kettlebells, "gym.kettlebells.range", kit.unit)}</dd>
          </div>
        </dl>
      </Section>

      <div className="mt-6 grid gap-2">
        {existing ? (
          <>
            <p className="text-center text-sm text-muted" role="status">
              {addedId ? t("gym.sharedAdded") : t("gym.sharedHave", { name: existing.name })}
            </p>
            {active ? (
              <p className="text-center text-sm text-muted">{t("gym.sharedLater")}</p>
            ) : (
              <Button icon="check" className="w-full py-4 text-lg" onClick={() => train(existing.id)}>
                {t("gym.sharedUse")}
              </Button>
            )}
          </>
        ) : (
          <Button icon="plus" className="w-full py-4 text-lg" onClick={add}>
            {t("gym.sharedAdd")}
          </Button>
        )}
        <Button kind="quiet" className="w-full" onClick={() => go("today")}>
          {existing ? t("remix.back") : t("remix.notNow")}
        </Button>
        {listing &&
          (reported ? (
            <p className="text-center text-sm text-muted" role="status">
              {t("gym.report.thanks")}
            </p>
          ) : (
            <Button kind="quiet" className="w-full" onClick={() => setReporting(true)}>
              {t("gym.report.open")}
            </Button>
          ))}
      </div>
      <Sheet open={reporting} onClose={() => setReporting(false)} title={t("gym.report.title")}>
        <p className="text-sm text-muted">{t("gym.report.note")}</p>
        <div className="mt-4 grid gap-2">
          {REPORT_REASONS.map((r) => (
            <Button
              key={r}
              kind="ghost"
              className="w-full"
              onClick={async () => {
                if (listing && (await reportGym(listing, r))) setReported(true);
                setReporting(false);
              }}
            >
              {t(`gym.report.${r}`)}
            </Button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
