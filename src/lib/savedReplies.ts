// Saved replies for the admin Inbox (ported from Gradelings' src/lib/savedReplies.ts): answers to common
// questions, put into the reply box and edited before sending. Admins can change the list (admin_settings key
// "saved_replies"); until then these are used. `{app}` becomes the app's name.
import { BRAND } from "./brand";

export interface SavedReply {
  id: string;
  title: string;
  body: string;
}

export const DEFAULT_REPLIES: SavedReply[] = [
  {
    id: "cancel",
    title: "Cancelling and refunds",
    body: "Thanks for getting in touch. Subscriptions go through the store you bought from, so you can cancel any time in Google Play (Payments and subscriptions) or on iPhone in Settings, then your name, then Subscriptions. Pro stays on until the end of the period you've paid for.\n\nRefunds are handled by the store too: Google Play and Apple each have a refund request page, and I'm happy to point you to the right one.",
  },
  {
    id: "sync",
    title: "Sync and a new phone",
    body: "Your workouts live on your phone first, so nothing is lost while you're offline. To carry them to a new phone, sign in with the same Google or Apple account on both, or use Settings › Saving and backup › Save a backup file, then restore that file on the new phone.",
  },
  {
    id: "delete-account",
    title: "Deleting an account",
    body: "You can delete your account and everything synced to it any time: Settings, then your account, then Delete my account, or from the page at getliftsmith.com/delete-account/. If you'd like me to do it for you, just reply to confirm.",
  },
  {
    id: "thanks",
    title: "Thanks for the feedback",
    body: "Thank you for taking the time to write. I read every message, and feedback like yours shapes what we build next in {app}.",
  },
];

export const REPLY_LIMITS = { count: 30, title: 60, body: 5000 };

/** Checks a list from the panel. Returns an error to show, or null. */
export function repliesProblem(list: unknown): string | null {
  if (!Array.isArray(list)) return "Send a list of replies.";
  if (list.length > REPLY_LIMITS.count) return `Keep it to ${REPLY_LIMITS.count} saved replies.`;
  const ids = new Set<string>();
  for (const r of list as Partial<SavedReply>[]) {
    if (!r || typeof r.id !== "string" || !/^[a-z0-9-]{1,40}$/.test(r.id) || ids.has(r.id)) return "Each reply needs its own id.";
    ids.add(r.id);
    if (typeof r.title !== "string" || !r.title.trim() || r.title.length > REPLY_LIMITS.title)
      return `Give each reply a title under ${REPLY_LIMITS.title} characters.`;
    if (typeof r.body !== "string" || !r.body.trim() || r.body.length > REPLY_LIMITS.body)
      return `Keep each reply under ${REPLY_LIMITS.body} characters.`;
  }
  return null;
}

export const fillReply = (body: string) => body.replaceAll("{app}", BRAND.name);
