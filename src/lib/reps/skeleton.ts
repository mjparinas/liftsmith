import type { Keypoint } from "./pose";

// The bones drawn over the camera preview while counting reps (Melvin, 2026-11-10: "bones drawn on the
// camera superimposed over my image"), so the lifter can see what the camera reads. MediaPipe BlazePose
// indices (33 landmarks): arms, shoulders, torso, hips, legs and feet. The head is a dot at the nose.

/** Pairs of BlazePose landmark indices joined by a bone. */
export const BONES: readonly (readonly [number, number])[] = [
  [11, 12], // shoulders
  [11, 13], // left upper arm
  [13, 15], // left forearm
  [12, 14], // right upper arm
  [14, 16], // right forearm
  [11, 23], // left side
  [12, 24], // right side
  [23, 24], // hips
  [23, 25], // left thigh
  [25, 27], // left shin
  [24, 26], // right thigh
  [26, 28], // right shin
  [27, 29], // left heel
  [29, 31], // left sole
  [27, 31], // left foot
  [28, 30], // right heel
  [30, 32], // right sole
  [28, 32], // right foot
];

/** Landmarks drawn as joints: the nose (head) and every point a bone uses. */
export const JOINTS: readonly number[] = [0, ...new Set(BONES.flat())];

/** A point under this visibility isn't drawn: a guess the camera can't see would mislead. */
export const MIN_VISIBILITY = 0.5;

/**
 * Where a normalised video point lands on a box showing the video with `object-fit: cover` (the preview):
 * the video is scaled to fill the box and centred, so its overflow is cropped evenly.
 */
export function coverPoint(p: Keypoint, video: { w: number; h: number }, box: { w: number; h: number }): { x: number; y: number } {
  const s = Math.max(box.w / Math.max(1, video.w), box.h / Math.max(1, video.h));
  return { x: (box.w - video.w * s) / 2 + p.x * video.w * s, y: (box.h - video.h * s) / 2 + p.y * video.h * s };
}

/** The bones and joints to draw, in box pixels, leaving out any whose points the camera can't see well. */
export function skeleton(
  kps: readonly Keypoint[] | undefined,
  video: { w: number; h: number },
  box: { w: number; h: number },
): { bones: [{ x: number; y: number }, { x: number; y: number }][]; joints: { x: number; y: number }[] } {
  if (!kps?.length) return { bones: [], joints: [] };
  const at = (i: number) => {
    const p = kps[i];
    return p && (p.visibility ?? 1) >= MIN_VISIBILITY ? coverPoint(p, video, box) : null;
  };
  const bones: [{ x: number; y: number }, { x: number; y: number }][] = [];
  for (const [a, b] of BONES) {
    const pa = at(a);
    const pb = at(b);
    if (pa && pb) bones.push([pa, pb]);
  }
  const joints = JOINTS.map(at).filter((p): p is { x: number; y: number } => p !== null);
  return { bones, joints };
}
