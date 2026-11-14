import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  EdgesGeometry,
  GridHelper,
  Group,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  ShaderMaterial,
  Scene as T3Scene,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  type BufferGeometry as Geo,
  type Material,
} from "three";

import { partIndices, REGIONS } from "@/lib/demo/mesh";
import { anchorAt, ropePoints, type Anchor, type Prop, type RopeProp, type Vec } from "@/lib/demo/rig";

import { DEMO_COLOURS } from "./colours";
import type { Frame, Scene } from "./engine";

// The hologram in WebGL: a rim-glow shell plus additive wireframe per body part, target muscles
// painted as vertex colours that pulse with effort, an x-ray skeleton, the bar and props as edges.

export function createScene3D(canvas: HTMLCanvasElement): Scene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  const scene = new T3Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 40);
  const cHolo = new Color(DEMO_COLOURS.holo),
    cEmber = new Color(DEMO_COLOURS.ember).multiplyScalar(1.35);
  // on the recovery map, the parts that aren't a muscle are a dim neutral, so no band (Fresh green, the
  // colour-blind set's blue) can be mistaken for the hologram's own cyan
  const cBase = new Color(DEMO_COLOURS.steel).multiplyScalar(0.4);
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const shellMat = keep(
    new ShaderMaterial({
      uniforms: { uOp: { value: 1 } },
      vertexShader: `attribute vec3 aColor; varying vec3 vC; varying float vRim;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vec3 n = normalize(normalMatrix * normal); vec3 v = normalize(-mv.xyz);
        vRim = 1.0 - abs(dot(n, v)); vC = aColor; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uOp; varying vec3 vC; varying float vRim;
      void main(){ float a = uOp * (0.035 + 0.75 * pow(vRim, 2.6)); gl_FragColor = vec4(vC, a); }`,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    }),
  );
  const wireMat = keep(
    new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false }),
  );
  const diagMat = keep(
    new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.16, blending: AdditiveBlending, depthWrite: false }),
  );
  const steelMat = keep(
    new LineBasicMaterial({
      color: new Color(DEMO_COLOURS.steel),
      transparent: true,
      opacity: 0.85,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  const propMat = keep(
    new LineBasicMaterial({
      color: new Color(DEMO_COLOURS.steel),
      transparent: true,
      opacity: 0.32,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );

  // Depth only: a hidden core inside the painted muscles, so the far side's muscles never show through.
  const occludeMat = keep(
    new MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      side: DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2,
    }),
  );

  // Painted muscles (the recovery map) are drawn inside the body as glowing volumes: each muscle's
  // patch of skin pulled in toward its limb's core, under a faint glass skin. Fatigued muscles carry
  // stripes (aHatch), so their state never rests on colour alone. A picked muscle (aSel) glows solid, close
  // to white at its edge, while the rest fade to dim grey, so even a small muscle stands out (Melvin, 2026-11-11).
  const innerVert = `attribute vec3 aColor; attribute float aHatch; attribute float aSel; varying vec3 vC; varying float vRim; varying float vH; varying float vS;
    void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vec3 n = normalize(normalMatrix * normal); vec3 v = normalize(-mv.xyz);
      vRim = 1.0 - abs(dot(n, v)); vC = aColor; vH = aHatch; vS = aSel; gl_Position = projectionMatrix * mv; }`;
  const glowMat = keep(
    new ShaderMaterial({
      vertexShader: innerVert,
      fragmentShader: `varying vec3 vC; varying float vRim; varying float vH; varying float vS;
      void main(){ float stripe = vH > 0.5 && mod(gl_FragCoord.x + gl_FragCoord.y, 10.0) < 3.5 ? 1.0 : 0.0;
        float a = mix(0.16 + 0.9 * pow(vRim, 1.6), 0.75 + 0.6 * pow(vRim, 1.1), vS); a *= 1.0 - 0.7 * stripe;
        vec3 c = mix(vC * 1.25, mix(vC, vec3(1.0), 0.08 + 0.22 * pow(vRim, 2.0)) * 1.8, vS); gl_FragColor = vec4(c, a); }`,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    }),
  );
  const INSET = 0.72;

  // everything that moves with the figure (rolled for side planks)
  const fig = new Group();
  scene.add(fig);

  interface Inner {
    core: Mesh;
    corePos: BufferAttribute;
    pos: BufferAttribute;
    col: BufferAttribute;
    hatch: BufferAttribute;
    sel: BufferAttribute;
    geo: BufferGeometry;
    tris: number[];
    glow: Mesh;
  }
  const parts = new Map<
    string,
    { pos: BufferAttribute; col: BufferAttribute; colD: BufferAttribute; gS: BufferGeometry; objs: (Mesh | LineSegments)[]; inner: Inner }
  >();
  const ensureParts = (f: Frame) => {
    if (parts.size) return;
    for (const m of f.meshes) {
      const n = m.P.NT * m.P.M;
      const pos = new BufferAttribute(m.pos, 3);
      pos.setUsage(DynamicDrawUsage);
      const col = new BufferAttribute(new Float32Array(n * 3), 3);
      col.setUsage(DynamicDrawUsage);
      const colD = new BufferAttribute(new Float32Array(n * 3), 3);
      colD.setUsage(DynamicDrawUsage);
      const { lines, diags, tris } = partIndices(m.P);
      const gW = keep(new BufferGeometry());
      gW.setAttribute("position", pos);
      gW.setAttribute("color", col);
      gW.setIndex(lines);
      const gD = keep(new BufferGeometry());
      gD.setAttribute("position", pos);
      gD.setAttribute("color", colD);
      gD.setIndex(diags);
      const gS = keep(new BufferGeometry());
      gS.setAttribute("position", pos);
      gS.setAttribute("aColor", col);
      gS.setIndex(tris);
      const objs = [new Mesh(gS, shellMat), new LineSegments(gW, wireMat), new LineSegments(gD, diagMat)];
      const iPos = new BufferAttribute(new Float32Array(n * 3), 3);
      iPos.setUsage(DynamicDrawUsage);
      const iCol = new BufferAttribute(new Float32Array(n * 3), 3);
      iCol.setUsage(DynamicDrawUsage);
      const iHatch = new BufferAttribute(new Float32Array(n), 1);
      iHatch.setUsage(DynamicDrawUsage);
      const geo = keep(new BufferGeometry());
      geo.setAttribute("position", iPos);
      geo.setAttribute("aColor", iCol);
      geo.setAttribute("aHatch", iHatch);
      const iSel = new BufferAttribute(new Float32Array(n), 1);
      iSel.setUsage(DynamicDrawUsage);
      geo.setAttribute("aSel", iSel);
      const corePos = new BufferAttribute(new Float32Array(n * 3), 3);
      corePos.setUsage(DynamicDrawUsage);
      const coreGeo = keep(new BufferGeometry());
      coreGeo.setAttribute("position", corePos);
      coreGeo.setIndex(tris);
      const core = new Mesh(coreGeo, occludeMat);
      core.renderOrder = -3;
      const inner: Inner = { core, corePos, pos: iPos, col: iCol, hatch: iHatch, sel: iSel, geo, tris, glow: new Mesh(geo, glowMat) };
      for (const o of [...objs, core, inner.glow]) {
        o.frustumCulled = false;
        fig.add(o);
      }
      parts.set(m.P.name, { pos, col, colD, gS, objs, inner });
    }
  };

  // skeleton
  const skelPos = new BufferAttribute(new Float32Array(1400 * 6), 3);
  skelPos.setUsage(DynamicDrawUsage);
  const skelGeo = keep(new BufferGeometry());
  skelGeo.setAttribute("position", skelPos);
  const skel = new LineSegments(
    skelGeo,
    keep(new LineBasicMaterial({ color: new Color(DEMO_COLOURS.bone), transparent: true, opacity: 0.95, depthWrite: false })),
  );
  skel.frustumCulled = false;
  skel.renderOrder = 5;
  fig.add(skel);

  // loads
  const edges = (g: Geo, mat: Material = steelMat) => {
    const e = new LineSegments(keep(new EdgesGeometry(keep(g), 1)), mat);
    return e;
  };
  const cylZ = (r: number, w: number, seg: number, z: number) => {
    const g = new CylinderGeometry(r, r, w, seg, 1);
    g.rotateX(Math.PI / 2);
    const e = edges(g);
    e.position.z = z;
    return e;
  };
  const makeBarbell = (k: number) => {
    const g = new Group();
    g.add(cylZ(0.014, k < 1 ? 1.5 : 2.1, 8, 0));
    for (const sg of [-1, 1]) {
      const z = k < 1 ? 0.42 : 0.5;
      for (const [z0, w, r] of [
        [z, 0.05, 0.225],
        [z + 0.055, 0.035, 0.19],
        [z + 0.095, 0.025, 0.14],
      ])
        g.add(cylZ(r * k, w * (k < 1 ? 0.6 : 1), 36, sg * (z0 + w / 2)));
      g.add(cylZ(0.03, 0.04, 12, sg * (z - 0.03)));
    }
    return g;
  };
  const barbell = makeBarbell(1),
    smallBar = makeBarbell(0.55);
  const trapbar = new Group();
  {
    const hex: Vec[] = [
      [0.32, 0, 0],
      [0.16, 0, 0.3],
      [-0.16, 0, 0.3],
      [-0.32, 0, 0],
      [-0.16, 0, -0.3],
      [0.16, 0, -0.3],
    ];
    const g = keep(new BufferGeometry().setFromPoints([...hex, hex[0]].map((p) => new Vector3(...p))));
    trapbar.add(new Line(g, steelMat));
    trapbar.add(cylZ(0.014, 0.6, 8, 0));
    for (const sg of [-1, 1]) {
      const sleeve = cylZ(0.016, 0.5, 8, sg * 0.55);
      trapbar.add(sleeve);
      for (const [z0, w, r] of [
        [0.42, 0.05, 0.225],
        [0.47, 0.035, 0.19],
      ])
        trapbar.add(cylZ(r, w, 36, sg * (z0 + w / 2)));
    }
  }
  const makeDumbbell = () => {
    const g = new Group();
    g.add(cylZ(0.014, 0.3, 6, 0));
    for (const sg of [-1, 1]) g.add(cylZ(0.07, 0.05, 12, sg * 0.1));
    return g;
  };
  const makeKettlebell = () => {
    const g = new Group();
    const b = edges(new IcosahedronGeometry(0.09, 1));
    b.position.y = -0.1;
    g.add(b);
    const h = edges(new TorusGeometry(0.055, 0.008, 4, 14));
    h.position.y = -0.02;
    g.add(h);
    return g;
  };
  const bells = [makeDumbbell(), makeDumbbell()];
  const kbs = [makeKettlebell(), makeKettlebell()];
  const wheel = new Group();
  {
    const w = edges(new TorusGeometry(0.09, 0.025, 6, 24));
    wheel.add(w);
    wheel.add(cylZ(0.012, 0.36, 6, 0));
  }
  // a medicine ball held in both hands
  const ball = edges(new IcosahedronGeometry(0.12, 1));
  const handleGeo = keep(new BufferGeometry());
  handleGeo.setAttribute("position", new BufferAttribute(new Float32Array(6), 3));
  const handle = new LineSegments(handleGeo, steelMat);
  handle.frustumCulled = false;
  for (const o of [barbell, smallBar, trapbar, ...bells, ...kbs, wheel, ball, handle]) {
    o.visible = false;
    fig.add(o);
  }

  // props and cables (rebuilt when the exercise changes)
  const propGroup = new Group();
  fig.add(propGroup);
  let cables: { line: LineSegments; from: Anchor; to: Anchor }[] = [];
  let followers: { obj: LineSegments; at: Vec; follow: Anchor }[] = [];
  let ropes: { line: LineSegments; p: RopeProp }[] = [];
  const ROPE_N = 32;
  const buildProps = (props: Prop[]) => {
    for (const c of [...propGroup.children]) {
      propGroup.remove(c);
      (c as LineSegments).geometry?.dispose();
    }
    cables = [];
    followers = [];
    ropes = [];
    for (const p of props) {
      if (p.kind === "box") {
        const e = new LineSegments(new EdgesGeometry(new BoxGeometry(p.size[0], p.size[1], p.size[2]), 1), propMat);
        e.position.set(...p.at);
        e.rotation.z = ((p.tilt ?? 0) * Math.PI) / 180;
        propGroup.add(e);
        if (p.follow) followers.push({ obj: e, at: p.at, follow: p.follow });
      } else if (p.kind === "rail") {
        const g = new CylinderGeometry(0.016, 0.016, p.length, 8, 1, true);
        if (p.axis === "x") g.rotateZ(Math.PI / 2);
        else if (p.axis !== "y") g.rotateX(Math.PI / 2);
        const e = new LineSegments(new EdgesGeometry(g, 1), steelMat);
        g.dispose();
        e.position.set(...p.at);
        propGroup.add(e);
      } else if (p.kind === "rope") {
        const g = new BufferGeometry();
        g.setAttribute("position", new BufferAttribute(new Float32Array(ROPE_N * 6), 3));
        const line = new LineSegments(g, steelMat);
        line.frustumCulled = false;
        propGroup.add(line);
        ropes.push({ line, p });
      } else {
        const g = new BufferGeometry();
        g.setAttribute("position", new BufferAttribute(new Float32Array(6), 3));
        const line = new LineSegments(g, steelMat);
        line.frustumCulled = false;
        propGroup.add(line);
        cables.push({ line, from: p.from, to: p.to });
      }
    }
  };
  // heart: a wireframe heart on the chest that beats with live heart rate
  const heart = new Group();
  const heartMat = keep(
    new LineBasicMaterial({ color: new Color("#ff3b5c"), transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false }),
  );
  {
    const curve = (k: number, rot: number) => {
      const pts: Vector3[] = [];
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3,
          y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        pts.push(new Vector3(Math.sin(rot) * x * k, y * k, Math.cos(rot) * x * k));
      }
      return new Line(keep(new BufferGeometry().setFromPoints(pts)), heartMat);
    };
    for (const [k, r] of [
      [0.0045, 0],
      [0.0034, 0],
      [0.0022, 0],
      [0.0045, 0.6],
      [0.0045, -0.6],
    ])
      heart.add(curve(k, r));
    const glow = new Mesh(
      keep(new IcosahedronGeometry(0.045, 1)),
      keep(
        new ShaderMaterial({
          uniforms: { uOp: { value: 1 } },
          vertexShader: "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
          fragmentShader: "uniform float uOp; void main(){ gl_FragColor = vec4(1.0, 0.23, 0.36, 0.5 * uOp); }",
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
      ),
    );
    heart.add(glow);
  }
  heart.visible = false;
  heart.renderOrder = 6;
  fig.add(heart);

  // bar path
  const pathGeo = keep(new BufferGeometry());
  pathGeo.setAttribute("position", new BufferAttribute(new Float32Array(41 * 3), 3));
  const pathLine = new Line(
    pathGeo,
    keep(new LineDashedMaterial({ color: new Color(DEMO_COLOURS.steel), dashSize: 0.02, gapSize: 0.025, transparent: true, opacity: 0.9 })),
  );
  pathLine.frustumCulled = false;
  fig.add(pathLine);

  // floor: glow rings and a faint grid
  const floor = new Group();
  scene.add(floor);
  for (const [r, op] of [
    [0.35, 0.5],
    [0.6, 0.32],
    [0.9, 0.18],
    [1.25, 0.09],
  ]) {
    const pts: Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts.push(new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    floor.add(
      new Line(
        keep(new BufferGeometry().setFromPoints(pts)),
        keep(new LineBasicMaterial({ color: cHolo, transparent: true, opacity: op, blending: AdditiveBlending, depthWrite: false })),
      ),
    );
  }
  const grid = new GridHelper(3, 24, cHolo, cHolo);
  (grid.material as LineBasicMaterial).transparent = true;
  (grid.material as LineBasicMaterial).opacity = 0.06;
  floor.add(grid);
  keep(grid.geometry);
  keep(grid.material as LineBasicMaterial);

  // which muscles each part's inner geometry covers; rebuilt when the paint changes
  const innerKey = new Map<string, unknown>();
  const drawInner = (m: Frame["meshes"][number], inner: Inner, s: Frame["s"], vis: boolean) => {
    const on = vis && !!s.paint;
    inner.glow.visible = on;
    // a hidden core inside the muscles, so the far side's muscles don't show through
    inner.core.visible = on;
    if (!on) return;
    const { NT, M } = m.P;
    const picked = (k: number) => {
      const r = m.which[k]!;
      return !!s.picked && !!s.selected?.length && r >= 0 && s.selected.includes(REGIONS[r]!.id);
    };
    const keep = (k: number) => m.which[k] >= 0 && m.weights[k] > 0.25;
    if (innerKey.get(m.P.name) !== s.paint) {
      innerKey.set(m.P.name, s.paint);
      const t: number[] = [];
      // a triangle that spans two muscles is left out, so each muscle stands apart with a groove between
      const same = (x: number, y: number) => m.which[x] === m.which[y];
      for (let i = 0; i < inner.tris.length; i += 3) {
        const [x, y, z] = [inner.tris[i], inner.tris[i + 1], inner.tris[i + 2]];
        if (keep(x) && keep(y) && keep(z) && same(x, y) && same(y, z)) t.push(x, y, z);
      }
      inner.geo.setIndex(t);
    }
    // pull each ring's muscle vertices toward the ring's centre
    const a = inner.pos.array as Float32Array,
      co = inner.corePos.array as Float32Array;
    for (let i = 0; i < NT; i++) {
      let cx = 0,
        cy = 0,
        cz = 0;
      for (let j = 0; j < M; j++) {
        const k = (i * M + j) * 3;
        cx += m.pos[k];
        cy += m.pos[k + 1];
        cz += m.pos[k + 2];
      }
      cx /= M;
      cy /= M;
      cz /= M;
      for (let j = 0; j < M; j++) {
        const v = i * M + j,
          k = v * 3;
        // a muscle belly: its middle sits just under the skin, its edges sink toward the bone
        // a picked muscle swells up to the skin, so a small one reads bigger
        const f = INSET + 0.17 * Math.min(1, m.weights[v]) + (picked(v) ? 0.09 : 0);
        co[k] = cx + (m.pos[k] - cx) * 0.62;
        co[k + 1] = cy + (m.pos[k + 1] - cy) * 0.62;
        co[k + 2] = cz + (m.pos[k + 2] - cz) * 0.62;
        a[k] = cx + (m.pos[k] - cx) * f;
        a[k + 1] = cy + (m.pos[k + 1] - cy) * f;
        a[k + 2] = cz + (m.pos[k + 2] - cz) * f;
      }
    }
    inner.pos.needsUpdate = true;
    inner.corePos.needsUpdate = true;
    inner.geo.computeVertexNormals();
    const c = inner.col.array as Float32Array,
      h = inner.hatch.array as Float32Array,
      sel = inner.sel.array as Float32Array;
    for (let k = 0; k < m.weights.length; k++) {
      const r = m.which[k],
        pc = r >= 0 ? paintCols[r] : null;
      const id = r >= 0 ? REGIONS[r].id : null;
      const on = picked(k);
      sel[k] = on ? 1 : 0;
      if (!s.picked) {
        // Today's focus muscles: brighter, with the rest dimmed but still in their colours
        const lit = s.selected?.length ? (id && s.selected.includes(id) ? 1.3 : 0.35) : 1;
        c[k * 3] = (pc?.r ?? 0) * lit;
        c[k * 3 + 1] = (pc?.g ?? 0) * lit;
        c[k * 3 + 2] = (pc?.b ?? 0) * lit;
      } else if (!on) {
        // the rest fade to a dim grey, so the picked muscle is the only colour on the figure
        const g = (((pc?.r ?? 0) + (pc?.g ?? 0) + (pc?.b ?? 0)) / 3) * 0.16;
        c[k * 3] = g;
        c[k * 3 + 1] = g * 1.05;
        c[k * 3 + 2] = g * 1.2;
      } else {
        c[k * 3] = pc?.r ?? 0;
        c[k * 3 + 1] = pc?.g ?? 0;
        c[k * 3 + 2] = pc?.b ?? 0;
      }
      h[k] = id ? (s.hatch?.[id] ?? 0) : 0;
    }
    inner.col.needsUpdate = true;
    inner.sel.needsUpdate = true;
    inner.hatch.needsUpdate = true;
  };

  let paintFor: Frame["s"]["paint"] = undefined;
  let paintCols: (Color | null)[] = [];

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
        f.path.forEach((p, i) => {
          a[i * 3] = p[0];
          a[i * 3 + 1] = p[1];
          a[i * 3 + 2] = p[2] + (f.motion.load === "barbell" ? 0.7 : 0);
        });
        pathGeo.attributes.position.needsUpdate = true;
        pathLine.computeLineDistances();
        floor.position.set(f.cam.target[0], 0, f.cam.target[2]);
      }
      // yaw first, then roll (three.js's default XYZ order applies Y before X), as placeVec does
      fig.rotation.x = (f.roll * Math.PI) / 180;
      fig.rotation.y = (f.yaw * Math.PI) / 180;
      fig.position.set(0, f.place.lift, f.place.shiftZ);
      const pulse = s.muscles ? (s.highlight ? 0.85 : 0.45 + 0.55 * f.effort) : 0;
      // painted muscles (the recovery map): parse each muscle's colour once per change
      if (f.changed || paintFor !== s.paint) {
        paintFor = s.paint;
        paintCols = REGIONS.map((r) => (s.paint?.[r.id] ? new Color(s.paint[r.id]) : null));
      }
      diagMat.opacity = s.paint ? 0.7 : 0.16;
      for (const m of f.meshes) {
        const p = parts.get(m.P.name)!;
        const vis = m.P.kind !== "hair" || !!f.body.hair;
        for (const o of p.objs) o.visible = vis;
        if (!vis) continue;
        p.pos.needsUpdate = true;
        p.gS.computeVertexNormals();
        const c = p.col.array as Float32Array,
          d = p.colD.array as Float32Array;
        if (s.paint) {
          // glass skin over the muscles: a faint neutral wireframe, no colour on the surface, except over a
          // picked muscle, whose skin lights up in its colour like an outline
          for (let k = 0; k < m.weights.length; k++) {
            const r = m.which[k]!;
            const pc = r >= 0 && m.weights[k]! > 0.25 && s.picked && s.selected?.includes(REGIONS[r]!.id) ? paintCols[r] : null;
            if (pc) {
              c[k * 3] = Math.min(1, pc.r * 1.1);
              c[k * 3 + 1] = Math.min(1, pc.g * 1.1);
              c[k * 3 + 2] = Math.min(1, pc.b * 1.1);
            } else {
              // with a muscle picked, the rest of the skin steps back too
              const dim = s.picked && s.selected?.length ? 0.55 : 1;
              c[k * 3] = cBase.r * 0.32 * dim;
              c[k * 3 + 1] = cBase.g * 0.34 * dim;
              c[k * 3 + 2] = cBase.b * 0.4 * dim;
            }
            d[k * 3] = c[k * 3] * 0.4;
            d[k * 3 + 1] = c[k * 3 + 1] * 0.4;
            d[k * 3 + 2] = c[k * 3 + 2] * 0.4;
          }
        } else {
          for (let k = 0; k < m.weights.length; k++) {
            const w = Math.min(1, m.weights[k] * pulse * 1.7);
            c[k * 3] = cHolo.r + (cEmber.r - cHolo.r) * w;
            c[k * 3 + 1] = cHolo.g + (cEmber.g - cHolo.g) * w;
            c[k * 3 + 2] = cHolo.b + (cEmber.b - cHolo.b) * w;
          }
          d.set(c);
        }
        p.col.needsUpdate = true;
        p.colD.needsUpdate = true;
        drawInner(m, p.inner, s, vis);
      }
      // loads
      const load = f.motion.load,
        hold = f.motion.hold ?? "each";
      const small = (f.motion.plates ?? 1) < 1;
      barbell.visible = load === "barbell" && !!J.bar && !small;
      smallBar.visible = load === "barbell" && !!J.bar && small;
      trapbar.visible = load === "trapbar" && !!J.bar;
      if (J.bar) {
        place(barbell, J.bar);
        place(smallBar, J.bar);
        place(trapbar, J.bar);
      }
      const hands = [J.handL, J.handR];
      const mid: Vec = [(J.handL[0] + J.handR[0]) / 2, (J.handL[1] + J.handR[1]) / 2, (J.handL[2] + J.handR[2]) / 2];
      const set = (objs: Group[], on: boolean) =>
        objs.forEach((o, i) => {
          o.visible = on && (hold === "each" || (hold === "R" && i === 1) || (hold === "centre" && i === 0));
          place(o, hold === "centre" ? mid : hands[i]);
          if (o === bells[i]) o.rotation.x = hold === "centre" ? Math.PI / 2 : 0;
        });
      set(bells, load === "dumbbell");
      set(kbs, load === "kettlebell");
      ball.visible = load === "ball";
      place(ball, mid);
      wheel.visible = load === "wheel";
      place(wheel, [mid[0], 0.1, mid[2]]);
      handle.visible = load === "handle";
      if (handle.visible) {
        const a = handleGeo.attributes.position.array as Float32Array;
        a.set(J.handL, 0);
        a.set(J.handR, 3);
        handleGeo.attributes.position.needsUpdate = true;
      }
      for (const c of cables) {
        const a = c.line.geometry.attributes.position.array as Float32Array;
        a.set(anchorAt(J, c.from), 0);
        a.set(anchorAt(J, c.to), 3);
        c.line.geometry.attributes.position.needsUpdate = true;
      }
      for (const r of ropes) {
        const a = r.line.geometry.attributes.position.array as Float32Array;
        const pts = ropePoints(r.p, J, ROPE_N);
        for (let i = 0; i < ROPE_N; i++) {
          a.set(pts[i]!, i * 6);
          a.set(pts[i + 1]!, i * 6 + 3);
        }
        r.line.geometry.attributes.position.needsUpdate = true;
      }
      for (const fl of followers) {
        const p = anchorAt(J, fl.follow);
        fl.obj.position.set(p[0] + fl.at[0], p[1] + fl.at[1], p[2] + fl.at[2]);
      }
      heart.visible = !!f.heart;
      if (f.heart) {
        place(heart, f.heart.at);
        heart.scale.setScalar(1 + 0.4 * f.heart.beat);
        heartMat.opacity = 0.45 + 0.55 * f.heart.beat;
        ((heart.children[heart.children.length - 1] as Mesh).material as ShaderMaterial).uniforms.uOp.value = 0.3 + 0.7 * f.heart.beat;
      }
      // overlays
      skel.visible = s.skeleton;
      if (s.skeleton) {
        skelPos.array.set(f.skel.arr.subarray(0, f.skel.count * 6));
        skelGeo.setDrawRange(0, f.skel.count * 2);
        skelPos.needsUpdate = true;
      }
      shellMat.uniforms.uOp.value = s.skeleton ? 0.6 : 1;
      wireMat.opacity = s.skeleton ? 0.32 : 0.55;
      pathLine.visible = s.path;
      // camera
      const { yaw, pitch, target, distance } = f.cam;
      const yr = (yaw * Math.PI) / 180,
        pr = (pitch * Math.PI) / 180;
      camera.position.set(
        target[0] + Math.sin(yr) * Math.cos(pr) * distance,
        target[1] + Math.sin(pr) * distance,
        target[2] + Math.cos(yr) * Math.cos(pr) * distance,
      );
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
