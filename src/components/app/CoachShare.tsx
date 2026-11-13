"use client";

// What a client shares with one coach, item by item (Melvin, 2026-11-13: "clients should agree to show things …
// technically they can share as much or as little as they choose"; docs/decisions/trainer-mode.md "What a client
// shares"). Their training is always shared, because that's what coaching is; everything else is a switch, per coach:
// heart rate, workout notes, readiness and recovery, body data, pain and injuries, and cycle. The consent screen
// shows the same switches before the client agrees, with heart rate and notes on (JOIN_SHARES).
import { useState } from "react";

import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { bodyCompOn } from "@/lib/teen";
import { setShare, shareKinds, trainerError, type ShareKind } from "@/lib/trainer";

import { InlineSwitch, SwitchRow } from "./ui";

const LABEL = {
  hr: "trn.shareHr",
  notes: "trn.shareNotes",
  health: "trn.shareHealth",
  body: "trn.shareBody",
  pain: "trn.sharePain",
  cycle: "trn.shareCycle",
} as const satisfies Record<ShareKind, string>;
const HINT = {
  hr: "trn.shareHrHint",
  notes: "trn.shareNotesHint",
  health: "trn.shareHealthHint",
  body: "trn.shareBodyHint",
  pain: "trn.sharePainHint",
  cycle: "trn.shareCycleHint",
} as const satisfies Record<ShareKind, string>;

/** The kinds this lifter can share: body data and cycle wait for an under-18 until body composition is on (teen.ts). */
function useKinds(): ShareKind[] {
  return shareKinds(bodyCompOn(useApp((s) => s.profile)));
}

/** A client's switches for one coach, saved as each one flips. */
export function ShareSwitches({
  coachId,
  name,
  on,
  onChange,
}: {
  coachId: string;
  name: string;
  on: readonly ShareKind[];
  onChange: () => void;
}) {
  const kinds = useKinds();
  const [note, setNote] = useState<string | null>(null);
  const flip = async (k: ShareKind, v: boolean) => {
    try {
      await setShare(coachId, k, v);
      haptic("toggle");
      track("feature", { name: "trainer", detail: `${v ? "share" : "unshare"}:${k}` });
      setNote(null);
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };
  return (
    <>
      {kinds.map((k) => (
        <SwitchRow key={k} label={t(LABEL[k], { name })} hint={t(HINT[k])} on={on.includes(k)} onChange={(v) => void flip(k, v)} />
      ))}
      {note && (
        <p className="mt-1 px-1 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </>
  );
}

/** The same switches on the consent screen, kept here until the client agrees. */
export function ConsentShares({
  name,
  picked,
  onPick,
}: {
  name: string;
  picked: readonly ShareKind[];
  onPick: (next: ShareKind[]) => void;
}) {
  const kinds = useKinds();
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold">{t("trn.consentPick")}</p>
      <div className="mt-1 divide-y divide-line">
        {kinds.map((k) => (
          <InlineSwitch
            key={k}
            className="py-2"
            label={t(LABEL[k], { name })}
            hint={t(HINT[k])}
            on={picked.includes(k)}
            onChange={(v) => onPick(v ? [...picked, k] : picked.filter((x) => x !== k))}
          />
        ))}
      </div>
    </div>
  );
}
