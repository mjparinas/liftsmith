import { describe, expect, it } from "vitest";

import type { Keypoint } from "./pose";
import { BONES, coverPoint, JOINTS, skeleton } from "./skeleton";

// 33 BlazePose landmarks, all clearly seen, at the centre unless moved.
const pose = (over: Record<number, Keypoint> = {}): Keypoint[] =>
  Array.from({ length: 33 }, (_, i) => over[i] ?? { x: 0.5, y: 0.5, visibility: 0.9 });

describe("bones over the camera preview", () => {
  it("places points where object-fit: cover shows them, cropping the overflow evenly", () => {
    // A 640x480 video in a 120x160 portrait box: scaled by 1/3 to fill the height, 213 wide, 46.7 cut each side.
    const video = { w: 640, h: 480 };
    const box = { w: 120, h: 160 };
    expect(coverPoint({ x: 0.5, y: 0.5 }, video, box)).toEqual({ x: 60, y: 80 });
    const left = coverPoint({ x: 0, y: 0 }, video, box);
    expect(left.x).toBeCloseTo(-46.67, 1);
    expect(left.y).toBe(0);
    expect(coverPoint({ x: 1, y: 1 }, video, box).x).toBeCloseTo(166.67, 1);
  });

  it("draws every bone and joint the camera sees", () => {
    const s = skeleton(pose(), { w: 640, h: 480 }, { w: 120, h: 160 });
    expect(s.bones).toHaveLength(BONES.length);
    expect(s.joints).toHaveLength(JOINTS.length);
  });

  it("leaves out bones whose ends the camera can't see well", () => {
    // Left knee (25) hidden: the left thigh (23-25) and shin (25-27) go, everything else stays.
    const s = skeleton(pose({ 25: { x: 0.4, y: 0.7, visibility: 0.2 } }), { w: 640, h: 480 }, { w: 120, h: 160 });
    expect(s.bones).toHaveLength(BONES.length - 2);
    expect(s.joints).toHaveLength(JOINTS.length - 1);
  });

  it("draws nothing without a pose", () => {
    expect(skeleton(undefined, { w: 640, h: 480 }, { w: 120, h: 160 })).toEqual({ bones: [], joints: [] });
    expect(skeleton([], { w: 640, h: 480 }, { w: 120, h: 160 })).toEqual({ bones: [], joints: [] });
  });
});
