import { partIndices, placeVec } from "@/lib/demo/mesh";
import { anchorAt, type Joints, type Prop, type Vec } from "@/lib/demo/rig";

import { DEMO_COLOURS } from "./colours";
import type { Scene } from "./engine";

// The same hologram drawn with the 2D canvas, for phones without WebGL (Melvin, 2026-11-09: 3D
// everywhere, 2D only when WebGL is missing). It projects the same mesh with the same camera and
// draws its rings and lines additively, so it looks like the 3D figure without the glowing shell.

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const HOLO = hex(DEMO_COLOURS.holo),
  EMBER = hex(DEMO_COLOURS.ember);
const BINS = 5;
const binColour = (b: number, a: number) => {
  const w = b / (BINS - 1);
  const c = HOLO.map((v, i) => Math.round(v + (EMBER[i] - v) * w));
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
};

export function createScene2D(canvas: HTMLCanvasElement): Scene {
  const ctx = canvas.getContext("2d")!;
  let W = 1,
    H = 1,
    dpr = 1;
  const indices = new Map<string, number[]>();

  return {
    resize(w, h, r) {
      W = w;
      H = h;
      dpr = r;
      canvas.width = Math.round(w * r);
      canvas.height = Math.round(h * r);
    },
    draw(f) {
      const { s, J } = f;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      // camera basis
      const { yaw, pitch, target, distance } = f.cam;
      const yr = (yaw * Math.PI) / 180,
        pr = (pitch * Math.PI) / 180;
      const eye: Vec = [
        target[0] + Math.sin(yr) * Math.cos(pr) * distance,
        target[1] + Math.sin(pr) * distance,
        target[2] + Math.cos(yr) * Math.cos(pr) * distance,
      ];
      const fw = norm3([target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]]);
      const right = norm3(cross3(fw, [0, 1, 0]));
      const up = cross3(right, fw);
      const focal = H / 2 / Math.tan((16 * Math.PI) / 180);
      const proj = (p: Vec): [number, number] => {
        const v: Vec = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]];
        const z = Math.max(0.1, v[0] * fw[0] + v[1] * fw[1] + v[2] * fw[2]);
        return [
          W / 2 + ((v[0] * right[0] + v[1] * right[1] + v[2] * right[2]) * focal) / z,
          H / 2 - ((v[0] * up[0] + v[1] * up[1] + v[2] * up[2]) * focal) / z,
        ];
      };
      const world = (p: Vec) => placeVec(p, f.roll, f.place.lift, f.place.shiftZ, f.yaw);
      const line = (a: Vec, b: Vec) => {
        const p = proj(world(a)),
          q = proj(world(b));
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(q[0], q[1]);
      };

      // floor rings
      ctx.lineWidth = 1;
      for (const [r, op] of [
        [0.35, 0.5],
        [0.6, 0.32],
        [0.9, 0.18],
        [1.25, 0.09],
      ]) {
        ctx.strokeStyle = binColour(0, op);
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          const p = proj([target[0] + Math.cos(a) * r, 0, target[2] + Math.sin(a) * r]);
          if (i) ctx.lineTo(p[0], p[1]);
          else ctx.moveTo(p[0], p[1]);
        }
        ctx.stroke();
      }

      // body wireframe, bucketed by muscle weight so there are only a few stroke colours
      const pulse = s.muscles ? (s.highlight ? 0.85 : 0.45 + 0.55 * f.effort) : 0;
      const paths: Path2D[] = Array.from({ length: BINS }, () => new Path2D());
      for (const m of f.meshes) {
        if (m.P.kind === "hair" && !f.body.hair) continue;
        let idx = indices.get(m.P.name);
        if (!idx) {
          idx = partIndices(m.P).lines;
          indices.set(m.P.name, idx);
        }
        const n = m.P.NT * m.P.M;
        const pts = new Float32Array(n * 2);
        for (let k = 0; k < n; k++) {
          const p = proj(world([m.pos[k * 3], m.pos[k * 3 + 1], m.pos[k * 3 + 2]]));
          pts[k * 2] = p[0];
          pts[k * 2 + 1] = p[1];
        }
        for (let i = 0; i < idx.length; i += 2) {
          const a = idx[i],
            b = idx[i + 1];
          const w = Math.min(1, ((m.weights[a] + m.weights[b]) / 2) * pulse * 1.7);
          const path = paths[Math.round(w * (BINS - 1))];
          path.moveTo(pts[a * 2], pts[a * 2 + 1]);
          path.lineTo(pts[b * 2], pts[b * 2 + 1]);
        }
      }
      ctx.lineWidth = 0.8;
      paths.forEach((p, b) => {
        ctx.strokeStyle = binColour(b, s.skeleton ? 0.22 : b ? 0.6 : 0.34);
        ctx.stroke(p);
      });

      // skeleton
      if (s.skeleton && f.skel.count) {
        ctx.strokeStyle = DEMO_COLOURS.bone;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const a = f.skel.arr;
        for (let i = 0; i < f.skel.count; i++) line([a[i * 6], a[i * 6 + 1], a[i * 6 + 2]], [a[i * 6 + 3], a[i * 6 + 4], a[i * 6 + 5]]);
        ctx.stroke();
      }

      // bar, loads, props and cables
      ctx.strokeStyle = "rgba(212,224,234,0.8)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const ring = (c: Vec, r: number, axis: "z" | "y") => {
        for (let i = 0; i <= 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          const p: Vec =
            axis === "z" ? [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2]] : [c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r];
          const q = proj(world(p));
          if (i) ctx.lineTo(q[0], q[1]);
          else ctx.moveTo(q[0], q[1]);
        }
      };
      const load = f.motion.load,
        hold = f.motion.hold ?? "each";
      if ((load === "barbell" || load === "trapbar") && J.bar) {
        const b = J.bar;
        line([b[0], b[1], -1.05], [b[0], b[1], 1.05]);
        const k = f.motion.plates ?? 1,
          z0 = k < 1 ? 0.44 : 0.52;
        for (const sg of [-1, 1])
          for (const [z, r] of [
            [z0, 0.225],
            [z0 + 0.05, 0.19],
            [z0 + 0.08, 0.14],
          ])
            ring([b[0], b[1], sg * z], r * k, "z");
      }
      const hands = [J.handL, J.handR];
      const mid: Vec = [(J.handL[0] + J.handR[0]) / 2, (J.handL[1] + J.handR[1]) / 2, (J.handL[2] + J.handR[2]) / 2];
      if (load === "dumbbell" || load === "kettlebell") {
        const at = hold === "centre" ? [mid] : hold === "R" ? [J.handR] : hands;
        for (const h of at) {
          if (load === "dumbbell") {
            line([h[0], h[1], h[2] - 0.15], [h[0], h[1], h[2] + 0.15]);
            ring([h[0], h[1], h[2] - 0.1], 0.07, "z");
            ring([h[0], h[1], h[2] + 0.1], 0.07, "z");
          } else ring([h[0], h[1] - 0.1, h[2]], 0.09, "z");
        }
      }
      if (load === "handle") line(J.handL, J.handR);
      if (load === "ball") {
        ring(mid, 0.12, "z");
        ring(mid, 0.12, "y");
      }
      if (load === "wheel") ring([mid[0], 0.1, mid[2]], 0.09, "z");
      for (const p of f.motion.props?.(f.body) ?? []) drawProp(p, J, line);
      ctx.stroke();

      if (f.heart) {
        const c = f.heart.at,
          k = 0.0045 * (1 + 0.4 * f.heart.beat);
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const t = (i / 40) * Math.PI * 2;
          const x = 16 * Math.sin(t) ** 3,
            y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          const q = proj(world([c[0], c[1] + y * k, c[2] + x * k]));
          if (i) ctx.lineTo(q[0], q[1]);
          else ctx.moveTo(q[0], q[1]);
        }
        ctx.fillStyle = `rgba(255,59,92,${0.25 + 0.6 * f.heart.beat})`;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,59,92,0.9)";
        ctx.stroke();
      }
      if (s.path) {
        ctx.strokeStyle = "rgba(212,224,234,0.8)";
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        f.path.forEach((p, i) => {
          const q = proj(world([p[0], p[1], p[2] + (load === "barbell" ? 0.7 : 0)]));
          if (i) ctx.lineTo(q[0], q[1]);
          else ctx.moveTo(q[0], q[1]);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.globalCompositeOperation = "source-over";
    },
    dispose() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

function drawProp(p: Prop, J: Joints, line: (a: Vec, b: Vec) => void) {
  if (p.kind === "box") {
    const [sx, sy, sz] = [p.size[0] / 2, p.size[1] / 2, p.size[2] / 2];
    const t = ((p.tilt ?? 0) * Math.PI) / 180,
      c = Math.cos(t),
      s = Math.sin(t);
    const o = p.follow ? anchorAt(J, p.follow) : [0, 0, 0];
    const pt = (x: number, y: number, z: number): Vec => [
      o[0] + p.at[0] + x * c - y * s,
      o[1] + p.at[1] + x * s + y * c,
      o[2] + p.at[2] + z,
    ];
    const v = [-1, 1];
    for (const a of v)
      for (const b of v) {
        line(pt(-sx, a * sy, b * sz), pt(sx, a * sy, b * sz));
        line(pt(a * sx, -sy, b * sz), pt(a * sx, sy, b * sz));
        line(pt(a * sx, b * sy, -sz), pt(a * sx, b * sy, sz));
      }
  } else if (p.kind === "rail") {
    const h = p.length / 2,
      a = p.at;
    line(
      p.axis === "x" ? [a[0] - h, a[1], a[2]] : p.axis === "y" ? [a[0], a[1] - h, a[2]] : [a[0], a[1], a[2] - h],
      p.axis === "x" ? [a[0] + h, a[1], a[2]] : p.axis === "y" ? [a[0], a[1] + h, a[2]] : [a[0], a[1], a[2] + h],
    );
  } else line(anchorAt(J, p.from), anchorAt(J, p.to));
}

const cross3 = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = (a: Vec): Vec => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
