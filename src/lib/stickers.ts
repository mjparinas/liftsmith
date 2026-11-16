// Gym stickers for coach chat (Melvin, 2026-11-13: "Ability to add emojis and stickers to chats? Can the stickers be
// gym / weight lifting themed"; docs/decisions/trainer-mode.md "Chat dock, statuses and stickers"). Each is our own
// drawing (StickerArt.tsx: the kettlebell mascot or one of our icons on a tinted tile, with a short caption from the
// language catalogues, `stk.<id>`). A message carries only the id, so the server keeps the list too (a sticker it
// doesn't know is refused), and the emoji stands in for the drawing where a picture can't go: the push notification.
// No server or browser imports, so the server can read it.

export const STICKERS = [
  { id: "pr", emoji: "🏆" },
  { id: "letsgo", emoji: "⚡" },
  { id: "light", emoji: "🏋️" },
  { id: "fire", emoji: "🔥" },
  { id: "proud", emoji: "🙌" },
  { id: "morning", emoji: "☀️" },
  { id: "thinking", emoji: "🤔" },
  { id: "rest", emoji: "😴" },
  { id: "water", emoji: "💧" },
  { id: "protein", emoji: "🥤" },
  { id: "form", emoji: "🎥" },
  { id: "deload", emoji: "🍃" },
] as const;

export type StickerId = (typeof STICKERS)[number]["id"];

export const isSticker = (x: unknown): x is StickerId => typeof x === "string" && STICKERS.some((s) => s.id === x);

/** The emoji that stands in for a sticker in a push notification. */
export const stickerEmoji = (id: StickerId): string => STICKERS.find((s) => s.id === id)?.emoji ?? "";

/**
 * Emoji for the picker: gym and training first, then everyday replies. Typing any emoji from the keyboard works too;
 * this is the quick row for a mouse on a desktop and a short list on a phone.
 */
export const EMOJI = [
  "💪",
  "🏋️",
  "🔥",
  "🏆",
  "⚡",
  "🎯",
  "🥇",
  "📈",
  "🦵",
  "🏃",
  "🧘",
  "🚴",
  "💧",
  "🥤",
  "🍗",
  "🥦",
  "😴",
  "🩹",
  "👍",
  "👏",
  "🙌",
  "🎉",
  "😀",
  "😅",
  "😂",
  "🤔",
  "😮",
  "😬",
  "🙏",
  "❤️",
  "✅",
  "👀",
] as const;
