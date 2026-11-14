"use client";

import { useEffect } from "react";

import { APP_PATH } from "@/lib/site";

// /me/ was the big-screen dashboard. It folded into the app (docs/decisions/desktop-layout.md, stage 2; Melvin,
// 2026-11-12: "fold me into app and retire it"), which has a desktop layout of its own now. Old links and
// bookmarks land on the closest app screen.
export const ME_TO_APP: Record<string, string> = {
  log: "log",
  friends: "friends",
  trophies: "awards",
};

/** The app screen for an old dashboard hash ("#/log", "#/history/<id>", ""): Progress unless it has its own. */
export function appHashFor(hash: string): string {
  const tab = hash.replace(/^#\/?/, "").split("/")[0] ?? "";
  return `#/${ME_TO_APP[tab] ?? "progress"}`;
}

export function MeRedirect() {
  useEffect(() => {
    location.replace(`${APP_PATH}${appHashFor(location.hash)}`);
  }, []);
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <a href={APP_PATH} className="text-accent underline">
        Open the app
      </a>
    </main>
  );
}
