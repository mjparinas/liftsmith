"use client";

import { useEffect } from "react";

import { recordError } from "@/lib/diag";
import { t } from "@/lib/i18n";

/**
 * The app's last line of defence: anything that fails outside a screen (the app shell, the tab bar), where
 * `ScreenBoundary` can't catch it. Instead of Next.js's bare "This page couldn't load", it says the data is
 * safe, offers Reload, and shows what failed, so a screenshot is enough to find the cause.
 */
export default function AppError({ error }: { error: unknown; retry?: () => void }) {
  const text = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ""}` : String(error);
  useEffect(() => recordError(`App: ${text}`), [text]);
  return (
    <main className="mx-auto max-w-lg px-5 pt-16" role="alert">
      <h1 className="text-2xl font-extrabold">{t("nav.crash.title")}</h1>
      <p className="mt-2 text-muted">{t("nav.crash.body")}</p>
      <button
        type="button"
        onClick={() => location.reload()}
        className="press btn-primary mt-6 w-full rounded-2xl py-4 text-lg font-semibold"
      >
        {t("nav.crash.reload")}
      </button>
      <details open className="mt-6 text-sm">
        <summary className="font-semibold text-muted">{t("nav.crash.details")}</summary>
        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-surface p-3 text-xs text-muted">
          {text.slice(0, 2000)}
        </pre>
      </details>
    </main>
  );
}
