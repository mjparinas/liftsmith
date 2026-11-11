"use client";

import { Component, type ReactNode } from "react";

import { recordError } from "@/lib/diag";
import { t } from "@/lib/i18n";

import { Button, EmptyState } from "./ui";

/**
 * A screen that fails to draw shows this instead of Next.js's "This page couldn't load", which sits over the
 * whole app with no way back but a reload. The tab bar stays, so another screen is one tap away, and the
 * error goes into the diagnostics a bug report carries. A first failure gets one more try straight away
 * (a passing hiccup draws fine the second time); a second shows the message and a Reload button.
 */
export class ScreenBoundary extends Component<{ children: ReactNode }, { broke: boolean; failed: number; detail: string }> {
  state = { broke: false, failed: 0, detail: "" };

  static getDerivedStateFromError() {
    return { broke: true };
  }

  componentDidCatch(error: unknown) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ""}` : String(error);
    recordError(`Screen: ${detail}`);
    this.setState((s) => ({ broke: false, failed: s.failed + 1, detail }));
  }

  render() {
    const { broke, failed, detail } = this.state;
    if (broke) return null;
    if (failed >= 2)
      return (
        <div className="card mt-6" role="alert">
          <EmptyState
            icon="info"
            title={t("nav.crash.title")}
            body={t("nav.crash.body")}
            action={<Button onClick={() => location.reload()}>{t("nav.crash.reload")}</Button>}
          />
          {/* What failed, so a screenshot is enough to find the cause. */}
          <details open className="px-4 pb-4 text-sm">
            <summary className="font-semibold text-muted">{t("nav.crash.details")}</summary>
            <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-surface p-3 text-xs text-muted">
              {detail.slice(0, 2000)}
            </pre>
          </details>
        </div>
      );
    // The retry: a fresh copy of the screen, keyed by the failure count.
    return <ScreenKey key={failed}>{this.props.children}</ScreenKey>;
  }
}

function ScreenKey({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
