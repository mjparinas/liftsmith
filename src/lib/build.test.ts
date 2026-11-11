import { describe, expect, it } from "vitest";

import { commitUrl, shortCommit, versionLabel } from "./build";

describe("build stamp", () => {
  it("shortens a commit hash to seven characters", () => {
    expect(shortCommit("3336DEEab12f0c9e8d7a6b5c4d3e2f1a0b9c8d7e")).toBe("3336dee");
    expect(shortCommit(" 3336dee\n")).toBe("3336dee");
  });

  it("says dev when the build couldn't tell", () => {
    expect(shortCommit("")).toBe("dev");
    expect(shortCommit("not-a-hash")).toBe("dev");
    expect(commitUrl("")).toBeNull();
  });

  it("links the commit on GitHub", () => {
    expect(commitUrl("3336dee")).toBe("https://github.com/mjparinas/liftsmith/commit/3336dee");
  });

  it("adds the store build number on the phone apps", () => {
    expect(versionLabel({ appVersion: "0.2.0", build: "8" })).toBe("0.2.0 (8)");
    expect(versionLabel({ appVersion: "0.2.0" })).toBe("0.2.0");
  });
});
