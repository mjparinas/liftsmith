// Creator codes, shared by the app (creator.ts) and the server (src/server/creators.ts).

/** "lift-melvin " → "LIFT-MELVIN". Letters, digits and dashes, 3 to 24 characters; anything else is null. */
export function normalizeCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    // Keep it as typed.
  }
  s = s.toUpperCase().replace(/\s+/g, "");
  return /^[A-Z0-9](?:[A-Z0-9-]{1,22})[A-Z0-9]$/.test(s) ? s : null;
}

/** The Play listing link that carries a code through the install (Android only). */
export function playLinkWithCode(playUrl: string, code: string): string {
  const u = new URL(playUrl);
  u.searchParams.set("referrer", `utm_source=creator&utm_medium=creator&utm_campaign=${code}`);
  return u.toString();
}
