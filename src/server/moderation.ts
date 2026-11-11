// What people may write on Friends (docs/decisions/friends.md): handles, names and comments. Both app stores ask
// apps with posts from users for a way to filter objectionable text before it's posted, as well as reporting and
// blocking. This is the first filter; reports (three people hide a post or comment until it's reviewed) and the
// admin Reports queue catch the rest.
//
// The word list is kept as short SHA-256 hashes of each word after `normalize`, so slurs aren't written out in
// this public repo. A word is checked whole (a token between spaces or punctuation), never as part of a longer
// word, so ordinary words that happen to contain one aren't refused. Normalizing undoes the common dodges:
// capitals, accents, digits for letters (n1gg3r) and doubled letters.
import { createHash } from "node:crypto";

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s" };

/** One word, lowercased, accents and leetspeak undone, letters only, runs of one letter squeezed to one. */
export const normalize = (word: string) =>
  word
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[013457@$]/g, (c) => LEET[c] ?? c)
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1+/g, "$1");

const digest = (w: string) => createHash("sha256").update(w).digest("hex").slice(0, 16);

/** Slurs and the worst insults in our six languages' Latin scripts (hashes of the normalized word). */
export const BLOCKED = new Set([
  "044eb98b18769b88",
  "0c44ea5c78ea14db",
  "0ce875d620076b53",
  "11cf8376a1575fdc",
  "158869a97379229b",
  "17bde8b4064612e2",
  "185e1b81f537c8d4",
  "1bc9c8ddd83611a8",
  "1d6e50abde753415",
  "22fc75e65a0e9d34",
  "268651b3ece98010",
  "333f7618092958c7",
  "362234c02fd606c4",
  "38ba35fc0a476152",
  "39d9f82ef85359e2",
  "3b1e0d7c5dd45583",
  "45cd3e1bb472d8e2",
  "4814058be6f32168",
  "517ae3f73216da64",
  "566f532d486c9477",
  "5a9f0a1e29ac9b73",
  "63bd9333b1a0b11d",
  "63dfbc4b4d18bbd4",
  "6843ca0984504b23",
  "693ee9961bef39c1",
  "7122c9a14ba2d20e",
  "76b30a2ce85f13c1",
  "77d1228a9f021466",
  "7d6c36a4fd820ad5",
  "84105992682cfadf",
  "886d51e97ad7931d",
  "92a9bf818e7e0002",
  "937d56e49744d206",
  "98b52c4b6b7d1f48",
  "9915ba2d822280f2",
  "9ae315a94e428a7e",
  "a511c0753b1214eb",
  "b1106bd2a8594910",
  "b27c1d7f1e7ff7b3",
  "b76e107adf3aab86",
  "b81c922678e46b0b",
  "c1cabb6f6e431f9c",
  "c2c3b68b48832afd",
  "c3de533e9b7fe63b",
  "d5ebe71514c411d4",
  "db775d1df73f2886",
  "e10c5b19ca9fd258",
  "eef3bd091670c344",
  "f3cf22cc8c5b2039",
  "f9d0d9b18ae9033a",
]);

/** Whether any whole word of `text` is on the list. `list` is for tests. */
export function hasBlockedWord(text: string, list: ReadonlySet<string> = BLOCKED): boolean {
  // Words split on anything that isn't a letter, digit or one of the leetspeak stand-ins, and handles split on _.
  for (const raw of text.split(/[^\p{L}\p{N}@$]+/u)) {
    const w = normalize(raw);
    if (w.length >= 3 && list.has(digest(w))) return true;
  }
  return false;
}

/** Links are refused in comments and names: they're how spam and scams spread, and a workout chat doesn't need them. */
export const hasLink = (text: string) =>
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|ru|xyz|app|me|ly|gg|link|info|biz|tk|top|site|club|shop|online)\b)/i.test(text);

/** Control characters out, spaces squeezed, trimmed and cut to `max`. */
export const tidy = (v: unknown, max: number) =>
  typeof v === "string"
    ? v
        .replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";

export type TextVerdict = { ok: true; text: string } | { ok: false; error: "empty" | "link" | "words" };

/** Checks something a person wrote for others to read. */
export function checkText(v: unknown, max: number): TextVerdict {
  const text = tidy(v, max);
  if (!text) return { ok: false, error: "empty" };
  if (hasLink(text)) return { ok: false, error: "link" };
  if (hasBlockedWord(text)) return { ok: false, error: "words" };
  return { ok: true, text };
}
