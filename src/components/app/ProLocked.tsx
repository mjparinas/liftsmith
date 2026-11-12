"use client";

import { t } from "@/lib/i18n";

import { go } from "./router";
import { ProTag } from "./ui";

/**
 * A Pro card a free lifter can see but not use yet (AGENTS.md "Money": shown, never hidden). The whole card is
 * the one button, and it opens the paywall at that feature (`#/pro/<from>`, mapped in Pro.tsx FROM).
 */
export function ProLocked({ from, title, body }: { from: string; title: string; body: string }) {
  return (
    <button
      type="button"
      onClick={() => go("pro", from)}
      aria-label={t("pro.locked", { what: title })}
      className="press card w-full p-4 text-left"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-semibold">{title}</span>
        <ProTag />
      </span>
      <span className="mt-1 block text-sm text-muted">{body}</span>
    </button>
  );
}
