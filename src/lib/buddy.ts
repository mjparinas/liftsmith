"use client";

import { inSentence, list, t } from "./i18n";
import { isNative } from "./juice";
import { SITE_URL } from "./site";

// Gym buddy check-ins. Today: one tap writes the check-in and opens the system share sheet with a short
// message, so a friend hears about it in whatever app they already use. Once accounts and sync exist the
// same check-in event becomes a push nudge on each buddy's phone (server side), with no change here.

export function checkinText(opts: { name?: string; gym?: string; focus?: string[]; buddies: string[] }): string {
  const who = opts.buddies.length === 1 ? opts.buddies[0] : opts.buddies.length ? t("buddy.crew") : "";
  const hi = who ? t("buddy.hi", { who }) : "";
  const gym = opts.gym && opts.gym !== "My gym" ? opts.gym : "";
  const focus = opts.focus?.length ? list(opts.focus.map((f) => inSentence(f, true))) : "";
  const body =
    gym && focus
      ? t("buddy.atGymFocus", { gym, focus })
      : gym
        ? t("buddy.atGym", { gym })
        : focus
          ? t("buddy.atFocus", { focus })
          : t("buddy.at");
  return hi + body;
}

type Share = { share(o: { title?: string; text?: string; url?: string; dialogTitle?: string }): Promise<unknown> };

/** Opens the share sheet (native plugin, Web Share, then the clipboard). Returns how it went. */
export async function shareText(text: string): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const url = `${SITE_URL}/`;
  const p = (window as unknown as { Capacitor?: { Plugins?: { Share?: Share } } }).Capacitor?.Plugins?.Share;
  try {
    if (p && isNative()) {
      await p.share({ text, url, dialogTitle: t("buddy.shareTitle") });
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch (e) {
    // Closing the share sheet isn't a failure.
    if (e instanceof Error && e.name === "AbortError") return "cancelled";
    if (e instanceof Error && /cancel/i.test(e.message)) return "cancelled";
    return "failed";
  }
}
