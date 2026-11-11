"use client";

import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { loadBar, nearestLoads } from "@/lib/plates";
import { useApp } from "@/lib/store";
import { fmtNum } from "@/lib/units";

import { PlateBar } from "../Plates";
import { go } from "../router";
import { BumpField, Button, Chip, EmptyState, ScreenHeader } from "../ui";

// Tools › Plate calculator (Melvin, 2026-11-11: table stakes). Which plates go on each side for a weight,
// from the active gym's own bars and plates, in the gym's unit so 45 lb and 20 kg plates stay exact. Works
// offline like the rest of the app. The solver is plates.ts, the same one the workout screen uses.

export function PlateTool() {
  const { gyms, profile } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const unit = gym?.unit ?? profile.unit;
  const bars = gym?.bars ?? [];
  const [barId, setBarId] = useState(bars[0]?.id);
  const bar = bars.find((b) => b.id === barId) ?? bars[0];
  const [want, setWant] = useState(unit === "lb" ? "135" : "60");
  useEffect(() => {
    track("feature", { name: "plate_tool" });
  }, []);
  const back = { label: t("tools.backTools"), onClick: () => go("tools") };
  if (!gym || !bar || !gym.plates.some((p) => p.count >= 2)) {
    return (
      <div>
        <ScreenHeader back={back} title={t("tools.plate.title")} />
        <div className="card mt-4">
          <EmptyState
            icon="gym"
            title={t("tools.plate.noPlates")}
            body={t("tools.plate.noPlatesBody")}
            action={
              <Button kind="ghost" onClick={() => go("gym")}>
                {t("tools.plate.toGyms")}
              </Button>
            }
          />
        </div>
      </div>
    );
  }
  const n = Number(want);
  const target = Number.isFinite(n) && n > 0 ? n : bar.weight;
  const loading = loadBar(Math.max(bar.weight, target), bar.weight, gym.plates);
  const near = loading.exact ? null : nearestLoads(target, bar.weight, gym.plates);
  return (
    <div className="pb-2">
      <ScreenHeader back={back} title={t("tools.plate.title")} />
      <p className="mt-1 text-sm text-muted">{t("tools.plate.intro", { gym: gym.name })}</p>
      <div className="card mt-4 p-4">
        <label htmlFor="plate-want" className="text-sm font-semibold">
          {t("tools.plate.target", { unit })}
        </label>
        <BumpField
          id="plate-want"
          className="mt-1"
          size="lg"
          label={t("tools.plate.target", { unit })}
          value={want}
          onChange={setWant}
          step={unit === "lb" ? 5 : 2.5}
          start={unit === "lb" ? 135 : 60}
          min={bar.weight}
          max={unit === "lb" ? 1500 : 700}
        />
        {bars.length > 1 && (
          <div className="mt-4">
            <div className="text-sm font-semibold">{t("tools.plate.bar")}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {bars.map((b) => (
                <Chip key={b.id} active={b.id === bar.id} onClick={() => setBarId(b.id)}>
                  {b.name} · {fmtNum(b.weight)} {unit}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>
      <section className="card mt-4 p-4" aria-live="polite" data-testid="plate-result">
        <p className="display text-3xl">
          {fmtNum(loading.total)} <span className="text-lg font-semibold text-muted">{unit}</span>
        </p>
        <div className="mt-2">
          <PlateBar loading={loading} bar={bar.weight} unit={unit} />
        </div>
        {near && (
          <p className="mt-2 text-sm text-muted">
            {near.above !== null
              ? t("tools.plate.near", { want: fmtNum(target), below: fmtNum(near.below), above: fmtNum(near.above), unit })
              : t("tools.plate.nearMax", { want: fmtNum(target), below: fmtNum(near.below), unit })}
          </p>
        )}
      </section>
    </div>
  );
}
