// Scan to follow (Friends gap list 3, item 4; docs/decisions/friends.md): what a scanned QR code opens. Only our
// own links count: an invite (follow each other), a club, a person's in-app link or their public web page. Anything
// else, another site's code or a code with no link in it, opens nothing.
import { cleanInvite } from "./invite";
import { HANDLE_RE } from "./socialTypes";

export type ScanTarget = { screen: "invite" | "club" | "person"; arg: string };

const OUR_HOSTS = new Set(["www.getliftsmith.com", "getliftsmith.com"]);

export function scanTarget(text: string, ourHost = ""): ScanTarget | null {
  let u: URL;
  try {
    u = new URL(text.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!OUR_HOSTS.has(u.hostname) && u.hostname !== ourHost) return null;
  const hash = u.hash.replace(/^#\/?/, "").split("/");
  const [screen, arg = ""] = hash;
  if (u.pathname.startsWith("/app")) {
    if (screen === "invite" || screen === "club") {
      const code = cleanInvite(arg);
      return code ? { screen, arg: code } : null;
    }
    if (screen === "person") {
      const h = arg.toLowerCase();
      return HANDLE_RE.test(h) ? { screen, arg: h } : null;
    }
    return null;
  }
  // A public profile's web page: /u/<handle>/
  const m = /^\/u\/([a-z0-9_]{3,20})\/?$/.exec(u.pathname.toLowerCase());
  return m ? { screen: "person", arg: m[1]! } : null;
}
