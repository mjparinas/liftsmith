"use client";

// Statuses in coach chat (src/lib/coachStatus.ts): the dot and words beside a person, and the sheet where the lifter
// picks their own. The dot is never the only cue: its words always sit beside it or in its label (WCAG 1.4.1).
import { useState } from "react";

import { pickStatus } from "@/lib/chatLive";
import { DURATIONS, stateTone, type Shown, type Status } from "@/lib/coachStatus";
import { date, relative, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import type { ShownPresence } from "@/lib/trainer";

import { Button, Chip, Sheet } from "./ui";

const TONE_VAR = {
  good: "var(--color-good)",
  warn: "var(--color-warn)",
  bad: "var(--color-bad)",
  violet: "var(--color-violet)",
  faint: "var(--color-faint)",
} as const;

const STATE_WORD = {
  online: "trn.st.online",
  offline: "trn.st.offline",
  busy: "trn.st.busy",
  training: "trn.st.training",
  away: "trn.st.away",
  dnd: "trn.st.dnd",
  vacation: "trn.st.vacation",
} as const satisfies Record<Shown, string>;

const PICK_WORD = {
  auto: "trn.st.auto",
  busy: "trn.st.busy",
  training: "trn.st.training",
  away: "trn.st.away",
  dnd: "trn.st.dnd",
  vacation: "trn.st.vacation",
  offline: "trn.st.appearOffline",
} as const satisfies Record<Status, string>;

const PICK_HINT = {
  auto: "trn.st.autoHint",
  busy: "trn.st.busyHint",
  training: "trn.st.trainingHint",
  away: "trn.st.awayHint",
  dnd: "trn.st.dndHint",
  vacation: "trn.st.vacationHint",
  offline: "trn.st.offlineHint",
} as const satisfies Record<Status, string>;

/** What each pick shows as to the other side, for its dot in the sheet. */
const PICK_SHOWS: Record<Status, Shown> = {
  auto: "online",
  busy: "busy",
  training: "training",
  away: "away",
  dnd: "dnd",
  vacation: "vacation",
  offline: "offline",
};

/** The order in the sheet: the everyday ones first, appear offline last. */
const PICKS: readonly Status[] = ["auto", "busy", "training", "away", "dnd", "vacation", "offline"];
/** The picks that end after a while (vacation ends on a day instead). */
const TIMED: ReadonlySet<Status> = new Set(["busy", "training", "away", "dnd"]);

/** A small status dot: green online, amber busy, red do not disturb, violet vacation, grey offline. */
export function StatusDot({ state, className = "" }: { state: Shown; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-2.5 shrink-0 rounded-full ring-2 ring-surface ${className}`}
      style={{ background: TONE_VAR[stateTone(state)] }}
    />
  );
}

/** How long ago, in the largest unit that fits: "5 minutes ago", "3 hours ago", "2 days ago". */
function ago(ms: number, now: number): string {
  const min = Math.max(1, Math.round((now - ms) / 60_000));
  if (min < 60) return relative(-min, "minute");
  const h = Math.round(min / 60);
  if (h < 24) return relative(-h, "hour");
  return relative(-Math.round(h / 24), "day");
}

/** The words for someone's presence: "Online", "Active 5 minutes ago", "With a client until 3:30 PM", "On vacation, back Nov 22". */
export function presenceText(p: ShownPresence, now: number): string {
  if (p.state === "offline") return p.seenAt ? t("trn.st.active", { ago: ago(p.seenAt, now) }) : t("trn.st.offline");
  const word = t(STATE_WORD[p.state]);
  if (!p.until || p.until <= now) return word;
  if (p.state === "vacation")
    return t("trn.st.back", { status: word, date: date(p.until, { weekday: "short", month: "short", day: "numeric" }) });
  return t("trn.st.until", { status: word, time: date(p.until, { hour: "numeric", minute: "2-digit" }) });
}

/** The lifter's own status, as a button that opens the sheet to change it. */
export function MyStatusButton({ status, until, now, className = "" }: { status: Status; until: number; now: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const shows = PICK_SHOWS[status];
  const label = status === "auto" ? t("trn.st.auto") : presenceText({ state: shows, until }, now);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`press inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm ${className}`}
        aria-label={t("trn.st.mine", { status: label })}
      >
        <StatusDot state={shows} />
        <span className="truncate">{label}</span>
      </button>
      {/* Mounted only while open, so it starts from the status as it is now each time. */}
      {open && <StatusSheet open onClose={() => setOpen(false)} status={status} until={until} now={now} />}
    </>
  );
}

const dayInput = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Picks a status and how long it lasts. */
export function StatusSheet({
  open,
  onClose,
  status,
  until,
  now,
}: {
  open: boolean;
  onClose: () => void;
  status: Status;
  until: number;
  now: number;
}) {
  const [pick, setPick] = useState<Status>(status);
  // How long a timed pick lasts, in ms from now (0: until changed); a vacation's last day, as yyyy-mm-dd.
  const [span, setSpan] = useState<number>(0);
  const [back, setBack] = useState(until > now && status === "vacation" ? dayInput(until) : "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const save = async () => {
    // A vacation ends at the end of the day before the lifter is back.
    const end = pick === "vacation" && back ? new Date(`${back}T00:00:00`).getTime() : TIMED.has(pick) && span > 0 ? Date.now() + span : 0;
    setBusy(true);
    try {
      await pickStatus(pick, end);
      haptic("toggle");
      setNote(null);
      onClose();
    } catch {
      oops();
      setNote(t("trn.st.failed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title={t("trn.st.title")}>
      <p className="text-sm text-muted">{t("trn.st.lead")}</p>
      <div className="mt-3 grid gap-2" role="radiogroup" aria-label={t("trn.st.title")}>
        {PICKS.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={pick === s}
            onClick={() => {
              haptic("select");
              setPick(s);
            }}
            className={`press flex min-h-12 items-start gap-3 rounded-2xl border px-3 py-2.5 text-left ${pick === s ? "border-accent/70 bg-accent/10" : "border-line bg-surface"}`}
          >
            <StatusDot state={PICK_SHOWS[s]} className="mt-1.5" />
            <span className="min-w-0">
              <span className="block font-semibold">{t(PICK_WORD[s])}</span>
              <span className="block text-sm text-muted">{t(PICK_HINT[s])}</span>
            </span>
          </button>
        ))}
      </div>
      {TIMED.has(pick) && (
        <div className="mt-4">
          <p className="text-sm font-semibold">{t("trn.st.forHow")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <Chip key={d} active={span === d} onClick={() => setSpan(d)}>
                {t("trn.st.hours", { count: d / 3_600_000 })}
              </Chip>
            ))}
            <Chip active={span === 0} onClick={() => setSpan(0)}>
              {t("trn.st.untilChange")}
            </Chip>
          </div>
        </div>
      )}
      {pick === "vacation" && (
        <div className="mt-4">
          <label htmlFor="trn-st-back" className="text-sm font-semibold">
            {t("trn.st.backOn")}
          </label>
          <input
            id="trn-st-back"
            type="date"
            value={back}
            min={dayInput(now + 86_400_000)}
            onChange={(e) => setBack(e.target.value)}
            className="mt-2 block min-h-11 w-full rounded-xl border border-line bg-raised px-3"
          />
          <p className="mt-1 text-sm text-muted">{t("trn.st.backHint")}</p>
        </div>
      )}
      {note && (
        <p className="mt-3 text-sm text-warn" role="status">
          {note}
        </p>
      )}
      <Button className="mt-5 w-full" disabled={busy} onClick={() => void save()}>
        {t("trn.st.save")}
      </Button>
    </Sheet>
  );
}
