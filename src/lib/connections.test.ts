import { describe, expect, it } from "vitest";

import { makeWorkout } from "@/test/factories";

import { localIso } from "./cloud";
import { musicLink, stravaWorkout } from "./connections";

describe("Strava activity", () => {
  it("names the workout and lists the sets, one line per exercise", () => {
    const at = new Date(2027, 0, 15, 8, 0, 0).getTime();
    const events = makeWorkout("w1", at, [
      { exerciseId: "bench-press", weight: 60, reps: 8 },
      { exerciseId: "bench-press", weight: 60, reps: 7 },
      { exerciseId: "pull-up", weight: 0, reps: 10 },
    ]);
    const w = stravaWorkout(events, "w1", "kg")!;
    expect(w.sessionId).toBe("w1");
    expect(w.name).toBe("Strength training");
    expect(w.startLocal).toBe("2027-01-15T08:00:00");
    expect(w.seconds).toBe(240);
    const lines = w.description.split("\n");
    expect(lines[0]).toMatch(/: 60 kg × 8, 60 kg × 7$/);
    expect(lines[1]).toMatch(/: 10$/);
    expect(lines.at(-1)).toBe("Logged with Liftsmith");
  });

  it("shows pounds for a lifter in pounds", () => {
    const events = makeWorkout("w2", Date.now(), [{ weight: 45.359237, reps: 5 }]);
    expect(stravaWorkout(events, "w2", "lb")!.description).toContain("100 lb × 5");
  });

  it("skips a workout with no sets, or one that hasn't ended", () => {
    const empty = makeWorkout("w3", Date.now(), []);
    expect(stravaWorkout(empty, "w3", "kg")).toBeNull();
    const running = makeWorkout("w4", Date.now(), [{ reps: 5 }]).filter((e) => e.type !== "sessionEnd");
    expect(stravaWorkout(running, "w4", "kg")).toBeNull();
  });
});

describe("music", () => {
  it("opens a harder playlist on a push day and a lighter one on an easy day", () => {
    expect(musicLink("spotify", "push")).toBe("https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP");
    expect(musicLink("spotify", "recover")).not.toBe(musicLink("spotify", "push"));
    expect(musicLink("apple", "normal")).toBe("https://music.apple.com/search?term=power%20workout");
    expect(musicLink("youtube", "push")).toBe("https://music.youtube.com/search?q=beast%20mode%20workout");
  });

  it("local time without a zone", () => {
    expect(localIso(new Date(2027, 2, 4, 5, 6, 7).getTime())).toBe("2027-03-04T05:06:07");
  });
});
