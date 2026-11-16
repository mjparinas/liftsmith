import { describe, expect, it } from "vitest";

import { titleWith } from "./chatLive";
import { liveStatus, muted, ONLINE_MS, shownState, stateTone } from "./coachStatus";
import { isSticker, stickerEmoji, STICKERS } from "./stickers";

const NOW = 1_800_000_000_000;

describe("coach chat statuses", () => {
  it("shows Online while active on Automatic, Offline after", () => {
    expect(shownState({ status: "auto", until: 0, seenAt: NOW - ONLINE_MS }, NOW)).toBe("online");
    expect(shownState({ status: "auto", until: 0, seenAt: NOW - ONLINE_MS - 1 }, NOW)).toBe("offline");
  });

  it("shows a picked status whether or not they're active, and Appear offline as Offline", () => {
    expect(shownState({ status: "busy", until: 0, seenAt: 0 }, NOW)).toBe("busy");
    expect(shownState({ status: "offline", until: 0, seenAt: NOW }, NOW)).toBe("offline");
  });

  it("ends a picked status at its time", () => {
    expect(liveStatus({ status: "away", until: NOW }, NOW)).toBe("auto");
    expect(liveStatus({ status: "away", until: NOW + 1 }, NOW)).toBe("away");
    expect(shownState({ status: "away", until: NOW - 1, seenAt: NOW }, NOW)).toBe("online");
  });

  it("holds pushes on Do not disturb and vacation only, until they end", () => {
    expect(muted({ status: "dnd", until: 0 }, NOW)).toBe(true);
    expect(muted({ status: "vacation", until: NOW + 1 }, NOW)).toBe(true);
    expect(muted({ status: "vacation", until: NOW - 1 }, NOW)).toBe(false);
    expect(muted({ status: "busy", until: 0 }, NOW)).toBe(false);
  });

  it("gives every state a colour role", () => {
    expect(stateTone("online")).toBe("good");
    expect(stateTone("dnd")).toBe("bad");
    expect(stateTone("vacation")).toBe("violet");
    expect(stateTone("offline")).toBe("faint");
  });
});

describe("stickers and the tab title", () => {
  it("knows its stickers, each with an emoji for pushes", () => {
    expect(isSticker("pr")).toBe(true);
    expect(isSticker("nope")).toBe(false);
    for (const s of STICKERS) expect(stickerEmoji(s.id)).not.toBe("");
  });

  it("puts the unread count in front of the title, and takes it off", () => {
    expect(titleWith("Liftsmith", 2)).toBe("(2) Liftsmith");
    expect(titleWith("(2) Liftsmith", 5)).toBe("(5) Liftsmith");
    expect(titleWith("(5) Liftsmith", 0)).toBe("Liftsmith");
    expect(titleWith("Liftsmith", 120)).toBe("(99+) Liftsmith");
    expect(titleWith("(99+) Liftsmith", 0)).toBe("Liftsmith");
  });
});
