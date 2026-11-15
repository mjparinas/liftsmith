// Statuses in coach chat (Melvin, 2026-11-13: "Trainers should be able to set a status (offline, with a client, on
// vacation, etc)"; 2026-11-15: "also add an online state, and other possible useful states"). Anyone in coaching, coach
// or client, picks one; the other side sees what it works out to (`shownState`). Online isn't picked: it's what
// "Automatic" shows while the person has had coaching open in the last couple of minutes, and Offline otherwise, with
// how long ago. Do not disturb and On vacation also hold chat pushes to that person (the server checks `muted`).
// Busy statuses can end on their own (`until`). No server or browser imports, so the server can read it.

/** What a person can pick. "auto" is Online while active, Offline otherwise. */
export const STATUSES = ["auto", "busy", "training", "away", "dnd", "vacation", "offline"] as const;
export type Status = (typeof STATUSES)[number];

/** What the other side sees. */
export type Shown = "online" | "offline" | "busy" | "training" | "away" | "dnd" | "vacation";

export const isStatus = (x: unknown): x is Status => typeof x === "string" && (STATUSES as readonly string[]).includes(x);

/** Active this recently counts as online. The dock asks every 20 seconds while it's on screen. */
export const ONLINE_MS = 2.5 * 60_000;

/** How long a pick can last: chips under the picker, then "until I change it" (0). */
export const DURATIONS = [60 * 60_000, 2 * 60 * 60_000, 4 * 60 * 60_000] as const;

/** A person's status as stored: what they picked, until when (0: until they change it), and when they were last active. */
export interface Presence {
  status: Status;
  until: number;
  seenAt: number;
}

/** The picked status, or "auto" once its time is up. */
export function liveStatus(p: Pick<Presence, "status" | "until">, now: number): Status {
  return p.until > 0 && p.until <= now ? "auto" : p.status;
}

/** What the other side sees. Appear offline shows Offline (and no "active 5 min ago"). */
export function shownState(p: Presence, now: number): Shown {
  const s = liveStatus(p, now);
  if (s === "offline") return "offline";
  if (s === "auto") return now - p.seenAt <= ONLINE_MS ? "online" : "offline";
  return s;
}

/** Chat pushes to this person wait while they're on Do not disturb or on vacation. */
export function muted(p: Pick<Presence, "status" | "until">, now: number): boolean {
  const s = liveStatus(p, now);
  return s === "dnd" || s === "vacation";
}

/** The dot's colour role for a shown state: green, amber, red, violet or grey. Paired with words, never alone. */
export function stateTone(s: Shown): "good" | "warn" | "bad" | "violet" | "faint" {
  switch (s) {
    case "online":
      return "good";
    case "busy":
    case "training":
    case "away":
      return "warn";
    case "dnd":
      return "bad";
    case "vacation":
      return "violet";
    case "offline":
      return "faint";
  }
}
