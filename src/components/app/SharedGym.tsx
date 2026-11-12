"use client";

import { useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { listingFor, markAdded, REPORT_REASONS, reportGym } from "@/lib/gymDirectory";
import { decodeGym, sameKit } from "@/lib/gymShare";
import { t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { EQUIPMENT_LABEL } from "@/lib/types";
import { fmtNum } from "@/lib/units";

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
  const existing = addedId ? gyms.find((g) => g.id === addedId) : gyms.find((g) => sameKit(g, kit));
  const plates = kit.plates.filter((p) => p.count > 0);
  const train = (id: string) => {
    haptic("tap");
    setProfile({ activeGymId: id });
    go("today");
  };
  const add = () => {
    haptic("success");
    sound.tick();
    const id = importGym({ ...kit, name });
    track("feature", { name: "gym_share", detail: listing ? "nearby" : "import" });
    if (listing) markAdded(listing);
    setAddedId(id);
  };
  return (
    <div className="pb-2">
      <ScreenHeader title={t("gym.sharedTitle")} kicker={t("gym.sharedKicker")} />
      <section className="card card-tint mt-4 p-4" style={{ ["--tint" as string]: "var(--color-accent)" }}>
        <h2 className="text-xl font-bold break-words">{name}</h2>
        <p className="mt-2 text-sm text-muted">{t("gym.sharedWhy")}</p>
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
