"use client";
import { isNative } from "./juice";
import { SITE_URL } from "./site";

// Gym buddy check-ins. Today: one tap writes the check-in and opens the system share sheet with a short
// message, so a friend hears about it in whatever app they already use. Once accounts and sync exist the
// same check-in event becomes a push nudge on each buddy's phone (server side), with no change here.

export function checkinText(opts: { name?: string; gym?: string; focus?: string[]; buddies: string[] }): string {
  const who = opts.buddies.length === 1 ? opts.buddies[0] : opts.buddies.length ? "crew" : "";
  const hi = who ? `Hey ${who}! ` : "";
  const where = opts.gym && opts.gym !== "My gym" ? ` at ${opts.gym}` : "";
  const what = opts.focus?.length ? `, training ${listJoin(opts.focus.map((f) => f.toLowerCase()))} today` : "";
  return `${hi}I'm at the gym${where}${what}. Your turn 💪`;
}

function listJoin(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
}

type Share = { share(o: { title?: string; text?: string; url?: string; dialogTitle?: string }): Promise<unknown> };

/** Opens the share sheet (native plugin, Web Share, then the clipboard). Returns how it went. */
export async function shareText(text: string): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const url = `${SITE_URL}/`;
  const p = (window as unknown as { Capacitor?: { Plugins?: { Share?: Share } } }).Capacitor?.Plugins?.Share;
  try {
    if (p && isNative()) {
      await p.share({ text, url, dialogTitle: "Tell your gym buddies" });
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
