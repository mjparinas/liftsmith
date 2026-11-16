"use client";

import { useState } from "react";

import { reportPlace } from "@/lib/gymDirectory";
import { PLACE_REPORT_LIMITS, PLACE_REPORT_REASONS, type PlaceReportReason } from "@/lib/gymPlaceReport";
import { t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";

import { Button, Chip, Sheet } from "./ui";

// Report a problem with a real gym's page (docs/decisions/gyms.md "Reporting a gym page"): wrong details, closed for good,
// listed twice, not a gym, or something else, with an optional note. It goes to staff (gymPlaceReports.ts), who fix the
// page, merge it with its duplicate or take it down. The website's gym pages have the same form without scripts.

export function PlaceReport({ placeId, name }: { placeId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<PlaceReportReason | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const send = async () => {
    if (!reason || busy) return;
    setBusy(true);
    const r = await reportPlace(placeId, reason, note.trim());
    setBusy(false);
    if (r !== "ok") {
      oops();
      return setError(t(r === "slow" ? "gp.reportSlow" : r === "offline" ? "gym.near.offline" : "gp.reportFailed"));
    }
    haptic("success");
    setSent(true);
    setOpen(false);
  };
  if (sent)
    return (
      <p className="text-center text-sm text-muted" role="status">
        {t("gp.reportThanks")}
      </p>
    );
  return (
    <>
      <Button kind="quiet" icon="flag" className="w-full" onClick={() => setOpen(true)}>
        {t("gp.reportLink")}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("gp.reportTitle")}>
        <p className="text-sm text-muted">{t("gp.reportIntro", { name })}</p>
        <p className="mt-4 mb-2 font-semibold" id="place-report-why">
          {t("gp.reportWhy")}
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="place-report-why">
          {PLACE_REPORT_REASONS.map((r) => (
            <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
              {t(`gp.reason.${r}`)}
            </Chip>
          ))}
        </div>
        <label htmlFor="place-report-note" className="mt-4 mb-1 block text-sm text-muted">
          {t("gp.reportNote")}
        </label>
        <textarea
          id="place-report-note"
          maxLength={PLACE_REPORT_LIMITS.note}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="card w-full px-4 py-3"
        />
        {error && (
          <p className="mt-2 text-sm text-bad" role="alert">
            {error}
          </p>
        )}
        <Button className="mt-4 w-full" disabled={!reason || busy} onClick={() => void send()}>
          {t("gp.reportSend")}
        </Button>
      </Sheet>
    </>
  );
}
