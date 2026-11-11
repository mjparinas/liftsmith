// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { go, goBack, historyDepth, parse } from "./router";

// jsdom moves through history after a task, like a browser; wait for the hashchange.
const settled = () => new Promise<void>((r) => window.addEventListener("hashchange", () => r(), { once: true }));
const route = () => parse(location.hash).route;
const step = async (f: () => void) => {
  const done = settled();
  f();
  await done;
};

describe("screen history (the back button)", () => {
  beforeEach(async () => {
    // Back to the start of this test's history: Today with nothing behind it.
    while (historyDepth() > 0) {
      const done = settled();
      history.back();
      await done;
    }
    if (location.hash !== "#/today") {
      const done = settled();
      location.hash = "#/today";
      await done;
    }
  });

  it("counts the screens behind this one", async () => {
    const start = historyDepth();
    await step(() => go("settings"));
    expect(historyDepth()).toBe(start + 1);
    await step(() => go("training"));
    expect(historyDepth()).toBe(start + 2);
  });

  it("a screen's own '‹ Settings' link steps back instead of stacking Settings on top of the sub-screen", async () => {
    await step(() => go("settings"));
    await step(() => go("training"));
    const depth = historyDepth();
    await step(() => go("settings"));
    expect(route()).toBe("settings");
    // One step back, not forward: so the phone's back now goes to Today, not to Training again.
    expect(historyDepth()).toBe(depth - 1);
  });

  it("back from a sub-screen goes to the previous screen", async () => {
    await step(() => go("settings"));
    await step(() => go("programs"));
    await step(goBack);
    expect(route()).toBe("settings");
  });

  it("back from a screen with nothing behind it goes to Today", () => {
    history.replaceState({ next: "kept" }, "", "#/account");
    goBack();
    expect(route()).toBe("today");
    // Next.js's own router state stays beside ours.
    expect((history.state as { next?: string }).next).toBe("kept");
  });
});

describe("Next.js stays out of the app's own back steps (the Android 'This page couldn't load')", () => {
  // Next's router adds its popstate listener on hydration, after ours; it stands in for that one here.
  it("a back step that changes only the hash never reaches Next's listener", async () => {
    let next = 0;
    const nextListener = () => next++;
    window.addEventListener("popstate", nextListener);
    try {
      await step(() => go("workout"));
      await step(() => go("today")); // the workout screen's "Today": a step back
      expect(route()).toBe("today");
      await step(() => go("settings"));
      await step(() => goBack()); // "‹ Back" and the phone's back
      expect(route()).toBe("today");
      expect(next).toBe(0);
    } finally {
      window.removeEventListener("popstate", nextListener);
    }
  });

  it("a step back to another page (a different path) still goes to Next", async () => {
    let next = 0;
    const nextListener = () => next++;
    window.addEventListener("popstate", nextListener);
    const here = location.pathname + location.search + location.hash;
    try {
      history.pushState(null, "", "/privacy/");
      const popped = new Promise<void>((r) => window.addEventListener("popstate", () => r(), { once: true }));
      history.back();
      await popped;
      expect(location.pathname + location.search + location.hash).toBe(here);
      expect(next).toBe(1);
    } finally {
      window.removeEventListener("popstate", nextListener);
    }
  });
});
