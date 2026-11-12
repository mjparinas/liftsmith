"use client";

// The frame every Tools screen shares: the header with "‹ Tools", a one-line blurb, and a labelled row for a
// − / + box. Each tool is its own file in this folder, opened at #/tools/<arg> (Tools.tsx lists them).
import type { ReactNode } from "react";

import { t } from "@/lib/i18n";

import { go } from "../router";
import { ScreenHeader } from "../ui";

export function ToolScreen({ title, blurb, children }: { title: string; blurb: string; children: ReactNode }) {
  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: t("tools.backTools"), onClick: () => go("tools") }} title={title} />
      <p className="mt-1 text-sm text-muted">{blurb}</p>
      {children}
    </div>
  );
}

/** A label on the left and its control on the right; wraps under the label on narrow phones and big text. */
export function FieldRow({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <div className="w-48 max-w-full">{children}</div>
    </div>
  );
}

/** A number, its unit and a label under it, for result cards. */
export function Figure({ value, unit, label, testId }: { value: string; unit?: string; label: string; testId?: string }) {
  return (
    <div className="min-w-0">
      <div className="num text-2xl font-extrabold" data-testid={testId}>
        {value}
        {unit ? <span className="text-sm font-semibold text-muted"> {unit}</span> : null}
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

/** The one-line "what to do" under a result, with the why built in (AGENTS.md: action over stats). */
export function Advice({ children }: { children: ReactNode }) {
  return (
    <p className="card card-tint mt-3 p-4 text-sm" style={{ "--tint": "var(--color-accent)" } as React.CSSProperties}>
      {children}
    </p>
  );
}
