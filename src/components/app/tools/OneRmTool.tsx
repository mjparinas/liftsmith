"use client";

// Tools › One-rep max: every lift's estimated max from the lifter's own sets (the same list and sheet as
// Progress, OneRepMax.tsx), plus the set calculator for any weight and reps.
import { useEffect } from "react";

import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";

import { OneRmSection, SetCalculator } from "../OneRepMax";
import { ToolScreen } from "./shared";

export function OneRmTool() {
  const unit = useApp((s) => s.profile.unit);
  useEffect(() => track("feature", { name: "tool_onerm" }), []);
  return (
    <ToolScreen title={t("calc.orm.title")} blurb={t("calc.orm.blurb")}>
      <OneRmSection />
      <div className="card mt-7 px-4 pb-4">
        <SetCalculator unit={unit} />
      </div>
    </ToolScreen>
  );
}
