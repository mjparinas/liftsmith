import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, Color, CylinderGeometry, DoubleSide, DynamicDrawUsage,
  EdgesGeometry, GridHelper, Group, IcosahedronGeometry, Line, LineBasicMaterial, LineDashedMaterial, LineSegments, Mesh,
  PerspectiveCamera, Scene as T3Scene, ShaderMaterial, TorusGeometry, Vector3, WebGLRenderer, type BufferGeometry as Geo, type Material,
} from "three";
import { partIndices } from "@/lib/demo/mesh";
import { anchorAt, type Anchor, type Prop, type Vec } from "@/lib/demo/rig";
import { DEMO_COLOURS } from "./colours";
import type { Frame, Scene } from "./engine";

// The hologram in WebGL: a rim-glow shell plus additive wireframe per body part, target muscles
// painted as vertex colours that pulse with effort, an x-ray skeleton, the bar and props as edges.

export function createScene3D(canvas: HTMLCanvasElement): Scene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  const scene = new T3Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 40);
  const cHolo = new Color(DEMO_COLOURS.holo), cEmber = new Color(DEMO_COLOURS.ember).multiplyScalar(1.35);
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const shellMat = keep(new ShaderMaterial({
    uniforms: { uOp: { value: 1 } },
    vertexShader: `attribute vec3 aColor; varying vec3 vC; varying float vRim;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vec3 n = normalize(normalMatrix * normal); vec3 v = normalize(-mv.xyz);
        vRim = 1.0 - abs(dot(n, v)); vC = aColor; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uOp; varying vec3 vC; varying float vRim;
      void main(){ float a = uOp * (0.035 + 0.75 * pow(vRim, 2.6)); gl_FragColor = vec4(vC, a); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
  }));
  const wireMat = keep(new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false }));
  const diagMat = keep(new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.16, blending: AdditiveBlending, depthWrite: false }));
  const steelMat = keep(new LineBasicMaterial({ color: new Color(DEMO_COLOURS.steel), transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false }));
  const propMat = keep(new LineBasicMaterial({ color: new Color(DEMO_COLOURS.steel), transparent: true, opacity: 0.32, blending: AdditiveBlending, depthWrite: false }));

  // everything that moves with the figure (rolled for side planks)
  const fig = new Group();
  scene.add(fig);

  const parts = new Map<string, { pos: BufferAttribute; col: BufferAttribute; gS: BufferGeometry; objs: (Mesh | LineSegments)[] }>();
  const ensureParts = (f: Frame) => {
    if (parts.size) return;
    for (const m of f.meshes) {
      const n = m.P.NT * m.P.M;
      const pos = new BufferAttribute(m.pos, 3); pos.setUsage(DynamicDrawUsage);
      const col = new BufferAttribute(new Float32Array(n * 3), 3); col.setUsage(DynamicDrawUsage);
      const { lines, diags, tris } = partIndices(m.P);
      const gW = keep(new BufferGeometry()); gW.setAttribute("position", pos); gW.setAttribute("color", col); gW.setIndex(lines);
      const gD = keep(new BufferGeometry()); gD.setAttribute("position", pos); gD.setAttribute("color", col); gD.setIndex(diags);
      const gS = keep(new BufferGeometry()); gS.setAttribute("position", pos); gS.setAttribute("aColor", col); gS.setIndex(tris);
      const objs = [new Mesh(gS, shellMat), new LineSegments(gW, wireMat), new LineSegments(gD, diagMat)];
      for (const o of objs) { o.frustumCulled = false; fig.add(o); }
      parts.set(m.P.name, { pos, col, gS, objs });
    }
  };

  // skeleton
  const skelPos = new BufferAttribute(new Float32Array(1400 * 6), 3); skelPos.setUsage(DynamicDrawUsage);
  const skelGeo = keep(new BufferGeometry()); skelGeo.setAttribute("position", skelPos);
  const skel = new LineSegments(skelGeo, keep(new LineBasicMaterial({ color: new Color(DEMO_COLOURS.bone), transparent: true, opacity: 0.95, depthWrite: false })));
  skel.frustumCulled = false; skel.renderOrder = 5; fig.add(skel);

  // loads
  const edges = (g: Geo, mat: Material = steelMat) => { const e = new LineSegments(keep(new EdgesGeometry(keep(g), 1)), mat); return e; };
  const cylZ = (r: number, w: number, seg: number, z: number) => { const g = new CylinderGeometry(r, r, w, seg, 1); g.rotateX(Math.PI / 2); const e = edges(g); e.position.z = z; return e; };
  const makeBarbell = (k: number) => {
    const g = new Group();
    g.add(cylZ(0.014, k < 1 ? 1.5 : 2.1, 8, 0));
    for (const sg of [-1, 1]) {
      const z = k < 1 ? 0.42 : 0.5;
      for (const [z0, w, r] of [[z, 0.05, 0.225], [z + 0.055, 0.035, 0.19], [z + 0.095, 0.025, 0.14]]) g.add(cylZ(r * k, w * (k < 1 ? 0.6 : 1), 36, sg * (z0 + w / 2)));
      g.add(cylZ(0.03, 0.04, 12, sg * (z - 0.03)));
    }
    return g;
  };
  const barbell = makeBarbell(1), smallBar = makeBarbell(0.55);
  const trapbar = new Group();
  {
    const hex: Vec[] = [[0.32, 0, 0], [0.16, 0, 0.3], [-0.16, 0, 0.3], [-0.32, 0, 0], [-0.16, 0, -0.3], [0.16, 0, -0.3]];
    const g = keep(new BufferGeometry().setFromPoints([...hex, hex[0]].map((p) => new Vector3(...p))));
    trapbar.add(new Line(g, steelMat));
    trapbar.add(cylZ(0.014, 0.6, 8, 0));
    for (const sg of [-1, 1]) {
      const sleeve = cylZ(0.016, 0.5, 8, sg * 0.55); trapbar.add(sleeve);
      for (const [z0, w, r] of [[0.42, 0.05, 0.225], [0.47, 0.035, 0.19]]) trapbar.add(cylZ(r, w, 36, sg * (z0 + w / 2)));
    }
  }
  const makeDumbbell = () => { const g = new Group(); g.add(cylZ(0.014, 0.3, 6, 0)); for (const sg of [-1, 1]) g.add(cylZ(0.07, 0.05, 12, sg * 0.1)); return g; };
  const makeKettlebell = () => { const g = new Group(); const b = edges(new IcosahedronGeometry(0.09, 1)); b.position.y = -0.1; g.add(b); const h = edges(new TorusGeometry(0.055, 0.008, 4, 14)); h.position.y = -0.02; g.add(h); return g; };
  const bells = [makeDumbbell(), makeDumbbell()];
  const kbs = [makeKettlebell(), makeKettlebell()];
  const wheel = new Group(); { const w = edges(new TorusGeometry(0.09, 0.025, 6, 24)); wheel.add(w); wheel.add(cylZ(0.012, 0.36, 6, 0)); }
  const handleGeo = keep(new BufferGeometry()); handleGeo.setAttribute("position", new BufferAttribute(new Float32Array(6), 3));
  const handle = new LineSegments(handleGeo, steelMat); handle.frustumCulled = false;
  for (const o of [barbell, smallBar, trapbar, ...bells, ...kbs, wheel, handle]) { o.visible = false; fig.add(o); }

  // props and cables (rebuilt when the exercise changes)
  const propGroup = new Group(); fig.add(propGroup);
  let cables: { line: LineSegments; from: Anchor; to: Anchor }[] = [];
  let followers: { obj: LineSegments; at: Vec; follow: Anchor }[] = [];
  const buildProps = (props: Prop[]) => {
    for (const c of [...propGroup.children]) { propGroup.remove(c); (c as LineSegments).geometry?.dispose(); }
    cables = [];
    followers = [];
    for (const p of props) {
      if (p.kind === "box") {
        const e = new LineSegments(new EdgesGeometry(new BoxGeometry(p.size[0], p.size[1], p.size[2]), 1), propMat);
        e.position.set(...p.at); e.rotation.z = ((p.tilt ?? 0) * Math.PI) / 180; propGroup.add(e);
        if (p.follow) followers.push({ obj: e, at: p.at, follow: p.follow });
      } else if (p.kind === "rail") {
        const g = new CylinderGeometry(0.016, 0.016, p.length, 8, 1, true);
        if (p.axis === "x") g.rotateZ(Math.PI / 2); else if (p.axis !== "y") g.rotateX(Math.PI / 2);
        const e = new LineSegments(new EdgesGeometry(g, 1), steelMat); g.dispose(); e.position.set(...p.at); propGroup.add(e);
      } else {
        const g = new BufferGeometry(); g.setAttribute("position", new BufferAttribute(new Float32Array(6), 3));
        const line = new LineSegments(g, steelMat); line.frustumCulled = false; propGroup.add(line);
        cables.push({ line, from: p.from, to: p.to });
      }
    }
  };
  // heart: a wireframe heart on the chest that beats with live heart rate
  const heart = new Group();
  const heartMat = keep(new LineBasicMaterial({ color: new Color("#ff3b5c"), transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false }));
  {
    const curve = (k: number, rot: number) => {
      const pts: Vector3[] = [];
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        pts.push(new Vector3(Math.sin(rot) * x * k, y * k, Math.cos(rot) * x * k));
      }
      return new Line(keep(new BufferGeometry().setFromPoints(pts)), heartMat);
    };
    for (const [k, r] of [[0.0045, 0], [0.0034, 0], [0.0022, 0], [0.0045, 0.6], [0.0045, -0.6]]) heart.add(curve(k, r));
    const glow = new Mesh(keep(new IcosahedronGeometry(0.045, 1)), keep(new ShaderMaterial({ uniforms: { uOp: { value: 1 } }, vertexShader: "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }", fragmentShader: "uniform float uOp; void main(){ gl_FragColor = vec4(1.0, 0.23, 0.36, 0.5 * uOp); }", transparent: true, depthWrite: false, blending: AdditiveBlending })));
    heart.add(glow);
  }
  heart.visible = false; heart.renderOrder = 6; fig.add(heart);

  // bar path
  const pathGeo = keep(new BufferGeometry()); pathGeo.setAttribute("position", new BufferAttribute(new Float32Array(41 * 3), 3));
  const pathLine = new Line(pathGeo, keep(new LineDashedMaterial({ color: new Color(DEMO_COLOURS.steel), dashSize: 0.02, gapSize: 0.025, transparent: true, opacity: 0.9 })));
  pathLine.frustumCulled = false; fig.add(pathLine);

  // floor: glow rings and a faint grid
  const floor = new Group(); scene.add(floor);
  for (const [r, op] of [[0.35, 0.5], [0.6, 0.32], [0.9, 0.18], [1.25, 0.09]]) {
    const pts: Vector3[] = [];
    for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; pts.push(new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
    floor.add(new Line(keep(new BufferGeometry().setFromPoints(pts)), keep(new LineBasicMaterial({ color: cHolo, transparent: true, opacity: op, blending: AdditiveBlending, depthWrite: false }))));
  }
  const grid = new GridHelper(3, 24, cHolo, cHolo);
  (grid.material as LineBasicMaterial).transparent = true; (grid.material as LineBasicMaterial).opacity = 0.06;
  floor.add(grid); keep(grid.geometry); keep(grid.material as LineBasicMaterial);

  const place = (o: { position: Vector3 }, p: Vec) => o.position.set(p[0], p[1], p[2]);

  return {
    resize(w, h, dpr) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    },
    draw(f) {
      ensureParts(f);
      const { s, J } = f;
      if (f.changed) {
        buildProps(f.motion.props?.(f.body) ?? []);
        const a = pathGeo.attributes.position.array as Float32Array;
        f.path.forEach((p, i) => { a[i * 3] = p[0]; a[i * 3 + 1] = p[1]; a[i * 3 + 2] = p[2] + (f.motion.load === "barbell" ? 0.7 : 0); });
        pathGeo.attributes.position.needsUpdate = true;
        pathLine.computeLineDistances();
        floor.position.set(f.cam.target[0], 0, f.cam.target[2]);
      }
      fig.rotation.x = (f.roll * Math.PI) / 180;
      fig.position.set(0, f.place.lift, f.place.shiftZ);
      const pulse = s.muscles ? (s.highlight ? 0.85 : 0.45 + 0.55 * f.effort) : 0;
      for (const m of f.meshes) {
        const p = parts.get(m.P.name)!;
        const vis = m.P.kind !== "hair" || !!f.body.hair;
        for (const o of p.objs) o.visible = vis;
        if (!vis) continue;
        p.pos.needsUpdate = true;
        p.gS.computeVertexNormals();
        const c = p.col.array as Float32Array;
        for (let k = 0; k < m.weights.length; k++) {
          const w = Math.min(1, m.weights[k] * pulse * 1.7);
          c[k * 3] = cHolo.r + (cEmber.r - cHolo.r) * w; c[k * 3 + 1] = cHolo.g + (cEmber.g - cHolo.g) * w; c[k * 3 + 2] = cHolo.b + (cEmber.b - cHolo.b) * w;
        }
        p.col.needsUpdate = true;
      }
      // loads
      const load = f.motion.load, hold = f.motion.hold ?? "each";
      const small = (f.motion.plates ?? 1) < 1;
      barbell.visible = load === "barbell" && !!J.bar && !small;
      smallBar.visible = load === "barbell" && !!J.bar && small;
      trapbar.visible = load === "trapbar" && !!J.bar;
      if (J.bar) { place(barbell, J.bar); place(smallBar, J.bar); place(trapbar, J.bar); }
      const hands = [J.handL, J.handR];
      const mid: Vec = [(J.handL[0] + J.handR[0]) / 2, (J.handL[1] + J.handR[1]) / 2, (J.handL[2] + J.handR[2]) / 2];
      const set = (objs: Group[], on: boolean) => objs.forEach((o, i) => {
        o.visible = on && (hold === "each" || (hold === "R" && i === 1) || (hold === "centre" && i === 0));
        place(o, hold === "centre" ? mid : hands[i]);
        if (o === bells[i]) o.rotation.x = hold === "centre" ? Math.PI / 2 : 0;
      });
      set(bells, load === "dumbbell");
      set(kbs, load === "kettlebell");
      wheel.visible = load === "wheel"; place(wheel, [mid[0], 0.1, mid[2]]);
      handle.visible = load === "handle";
      if (handle.visible) { const a = handleGeo.attributes.position.array as Float32Array; a.set(J.handL, 0); a.set(J.handR, 3); handleGeo.attributes.position.needsUpdate = true; }
      for (const c of cables) {
        const a = c.line.geometry.attributes.position.array as Float32Array;
        a.set(anchorAt(J, c.from), 0); a.set(anchorAt(J, c.to), 3);
        c.line.geometry.attributes.position.needsUpdate = true;
      }
      for (const fl of followers) { const p = anchorAt(J, fl.follow); fl.obj.position.set(p[0] + fl.at[0], p[1] + fl.at[1], p[2] + fl.at[2]); }
      heart.visible = !!f.heart;
      if (f.heart) {
        place(heart, f.heart.at);
        heart.scale.setScalar(1 + 0.4 * f.heart.beat);
        heartMat.opacity = 0.45 + 0.55 * f.heart.beat;
        ((heart.children[heart.children.length - 1] as Mesh).material as ShaderMaterial).uniforms.uOp.value = 0.3 + 0.7 * f.heart.beat;
      }
      // overlays
      skel.visible = s.skeleton;
      if (s.skeleton) { skelPos.array.set(f.skel.arr.subarray(0, f.skel.count * 6)); skelGeo.setDrawRange(0, f.skel.count * 2); skelPos.needsUpdate = true; }
      shellMat.uniforms.uOp.value = s.skeleton ? 0.6 : 1;
      wireMat.opacity = s.skeleton ? 0.32 : 0.55;
      pathLine.visible = s.path;
      // camera
      const { yaw, pitch, target, distance } = f.cam;
      const yr = (yaw * Math.PI) / 180, pr = (pitch * Math.PI) / 180;
      camera.position.set(target[0] + Math.sin(yr) * Math.cos(pr) * distance, target[1] + Math.sin(pr) * distance, target[2] + Math.cos(yr) * Math.cos(pr) * distance);
      camera.lookAt(target[0], target[1], target[2]);
      renderer.render(scene, camera);
    },
    dispose() {
      for (const c of propGroup.children) (c as LineSegments).geometry?.dispose();
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
