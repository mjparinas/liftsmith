// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { canonical, go, goBack, hashOf, historyDepth, isRoute, parse, setBodyView } from "./router";

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

describe("the address says what the screen is called (Melvin, 2026-11-14)", () => {
  it("makes each screen's address from its own name", () => {
    expect(hashOf("stats")).toBe("#/progress");
    expect(hashOf("stats", "bodyweight")).toBe("#/progress/bodyweight");
    expect(hashOf("achievements")).toBe("#/awards");
    expect(hashOf("trainer", "messages")).toBe("#/coaching/messages");
    expect(hashOf("gym")).toBe("#/gyms");
    expect(hashOf("stretch", "warmup")).toBe("#/stretching/warmup");
    expect(hashOf("training")).toBe("#/workout-preferences");
    expect(hashOf("today")).toBe("#/today");
    expect(hashOf("gymlink", "ABC")).toBe("#/gymlink/ABC");
  });

  it("gives the Body tab's two views their own addresses, and opens the last one looked at when none is named", () => {
    expect(hashOf("recovery", "muscles")).toBe("#/muscles");
    expect(hashOf("recovery", "health")).toBe("#/health");
    setBodyView(() => "health");
    expect(hashOf("recovery")).toBe("#/health");
    expect(canonical("#/recovery")).toBe("#/health");
    setBodyView(() => "muscles");
    expect(hashOf("recovery")).toBe("#/muscles");
    expect(parse("#/muscles")).toEqual({ route: "recovery", arg: "muscles" });
    expect(parse("#/health")).toEqual({ route: "recovery", arg: "health" });
  });

  it("still opens old links, bookmarks and notifications, and rewrites them to the new name", () => {
    expect(parse("#/stats/bodyweight")).toEqual({ route: "stats", arg: "bodyweight" });
    expect(parse("#/progress/bodyweight")).toEqual({ route: "stats", arg: "bodyweight" });
    expect(parse("#/trainer/c.client")).toEqual({ route: "trainer", arg: "c.client" });
    expect(parse("#/achievements/first")).toEqual({ route: "achievements", arg: "first" });
    expect(canonical("#/stats/bodyweight")).toBe("#/progress/bodyweight");
    expect(canonical("#/trainer/m.coach")).toBe("#/coaching/m.coach");
    expect(canonical("#/achievements")).toBe("#/awards");
    expect(canonical("#/coaching/clients")).toBe("#/coaching/clients");
    expect(canonical("#/routine/ABC")).toBe("#/routine/ABC");
    expect(canonical("")).toBe("");
    expect(isRoute("#/trainer/x", "trainer")).toBe(true);
    expect(isRoute("#/coaching", "trainer")).toBe(true);
    expect(isRoute("#/gymlink/x", "gym")).toBe(false);
  });

  it("goes to the new name", async () => {
    await step(() => go("stats"));
    expect(location.hash).toBe("#/progress");
    await step(() => goBack());
  });
});
