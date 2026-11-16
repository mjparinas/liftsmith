"use client";

import { SECTION_LABEL } from "@/components/titles";
import { faultIdsFor, formCheckId, stretchFaultIds, type FaultId } from "@/lib/formFaults";
import { t } from "@/lib/i18n";
import type { Stretch } from "@/lib/stretches";
import type { Exercise } from "@/lib/types";
import type { MessageKey } from "@/locales/en";

import { Icon } from "./icons";

// Common mistakes beside the 3D figure (src/lib/formFaults.ts): each one says what it looks like, the fix and a
// short why. Used by the workout's How to sheet, the exercise page and the stretch sheets. Pure web code, so
// Android, iOS and the web app get it together.

export interface Fault {
  id: FaultId;
  /** The mistake, as the lifter would notice it. */
  what: string;
  /** What to do instead. */
  fix: string;
  /** Why it matters, in a short line. */
  why: string;
}

/** A fault's three lines in the app's language. */
export function fault(id: FaultId): Fault {
  return { id, what: t(`ff.${id}` as MessageKey), fix: t(`ff.${id}.fix` as MessageKey), why: t(`ff.${id}.why` as MessageKey) };
}

type Ex = Pick<Exercise, "id" | "pattern" | "primary">;
export const faultsFor = (ex: Ex): Fault[] => faultIdsFor(ex).map(fault);
export const stretchFaults = (s: Pick<Stretch, "kind" | "for" | "pulse">): Fault[] => stretchFaultIds(s).map(fault);

export function FaultList({
  faults,
  title = t("ff.title"),
  className = "",
}: {
  faults: readonly Fault[];
  title?: string;
  className?: string;
}) {
  if (!faults.length) return null;
  return (
    <section className={className} aria-label={title} data-testid="form-faults">
      <h3 className={`mb-2 flex items-center gap-1.5 ${SECTION_LABEL}`}>
        <Icon name="flag" size={14} className="text-warn" />
        {title}
      </h3>
      <ul className="space-y-3">
        {faults.map((f) => (
          <li key={f.id} className="rounded-2xl border border-line bg-raised/60 p-3">
            <p className="font-semibold">{f.what}</p>
            <p className="mt-1 flex gap-2">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-good" />
              <span>{f.fix}</span>
            </p>
            <p className="mt-1 pl-6 text-sm text-muted">{f.why}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The rest timer's form check: one mistake for the next set, with its fix. */
export function FormCheckLine({ ex, setsDone }: { ex: Ex; setsDone: number }) {
  const f = fault(formCheckId(ex, setsDone));
  return (
    <p className="mt-3 flex items-start gap-2 text-left text-sm text-muted" data-testid="form-check">
      <Icon name="flag" size={16} className="mt-0.5 shrink-0 text-warn" />
      <span>
        <span className="font-semibold text-ink">{t("ff.check")}</span> {t("ff.checkLine", { what: f.what, fix: f.fix })}
      </span>
    </p>
  );
}
