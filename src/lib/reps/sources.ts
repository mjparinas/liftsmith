// Live inputs for the rep counter lab: the camera through MediaPipe Pose Landmarker (WASM + WebGL in the
// web view on Android, iOS and desktop browsers), and the phone's own motion sensors through
// DeviceMotionEvent. Frames are analysed in memory and dropped; nothing is recorded or uploaded.
// Only the model and its runtime are downloaded, once, then cached by the browser.

import type { Keypoint } from "./pose";

/** Pinned so the runtime matches the npm types. Self-host both before this leaves the lab. */
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm";
const MODEL = {
  lite: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
  full: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
};

export interface PoseEngine {
  detect(video: HTMLVideoElement, t: number): Keypoint[] | undefined;
  close(): void;
}

export async function loadPose(model: keyof typeof MODEL = "lite"): Promise<PoseEngine> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const files = await FilesetResolver.forVisionTasks(WASM);
  const make = (delegate: "GPU" | "CPU") => PoseLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL[model], delegate }, runningMode: "VIDEO", numPoses: 1 });
  // The GPU delegate is several times faster on phones; some web views refuse it, so fall back to CPU.
  const pl = await make("GPU").catch(() => make("CPU"));
  return {
    detect(video, t) {
      const r = pl.detectForVideo(video, t);
      return r.landmarks[0]?.map((p) => ({ x: p.x, y: p.y, visibility: p.visibility }));
    },
    close: () => pl.close(),
  };
}

/** `user` is the screen-side camera, so the lifter can see themselves line up; `environment` the back one. */
export async function openCamera(video: HTMLVideoElement, facing: "user" | "environment" = "user"): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } });
  video.srcObject = stream;
  await video.play();
  return stream;
}

export type MotionReading = { t: number; fused?: { up: number; rot: number }; raw: [number, number, number] };

/** Asks for motion access where the platform requires it (iOS), then streams readings until stopped. */
export async function startMotion(onReading: (r: MotionReading) => void): Promise<() => void> {
  const DME = (globalThis as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
  if (DME?.requestPermission && (await DME.requestPermission()) !== "granted") throw new Error("Motion access was declined");
  const on = (e: DeviceMotionEvent) => {
    const g = e.accelerationIncludingGravity;
    if (!g || g.x == null || g.y == null || g.z == null) return;
    const raw: [number, number, number] = [g.x, g.y, g.z];
    const a = e.acceleration;
    const r = e.rotationRate;
    let fused: MotionReading["fused"];
    if (a && a.x != null && a.y != null && a.z != null) {
      // Gravity is what's left after the platform removes linear acceleration; project onto it for "up".
      const gx = g.x - a.x, gy = g.y - a.y, gz = g.z - a.z;
      const n = Math.hypot(gx, gy, gz) || 1;
      const up = (a.x * gx + a.y * gy + a.z * gz) / n;
      const rot = r ? (Math.hypot(r.alpha ?? 0, r.beta ?? 0, r.gamma ?? 0) * Math.PI) / 180 : 0;
      fused = { up, rot };
    }
    onReading({ t: e.timeStamp || performance.now(), fused, raw });
  };
  window.addEventListener("devicemotion", on);
  return () => window.removeEventListener("devicemotion", on);
}
