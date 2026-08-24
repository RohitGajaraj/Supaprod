// W3 / DESIGN-LOOM section 15 - the knowledge graph as a living 3D universe.
// An imperative three.js renderer (WebGLRenderer + PerspectiveCamera + Scene)
// driven by a d3-force-3d simulation (link / charge / collide / center across
// x, y and z). It is a drop-in alternate to the 2D GraphForceCanvas: identical
// prop shape, identical colors (via graph-visual), identical interactions
// (focus on click, story on double-click, neighborhood lighting), reframed as
// a dark depth-lit constellation with role-color glows, quiet thread edges, a
// slow universe drift when idle, and a faint multi-hue nebula behind it.
//
// Truth law: only the real nodes and edges the graph carries are ever drawn.
// Reduced motion: the physics runs to rest synchronously and the drift stops;
// the scene renders as a settled still and only re-renders on interaction.
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force-3d";
import type { KnowledgeGraph } from "@/lib/knowledge-graph-view";
import { Action, Num } from "@/components/meridian/surface-parts";
import {
  edgeWeight,
  kindCssColor,
  kindLabel,
  nodeRadius,
  outcomeLabel,
  resolveKindColors,
  truncateTitle,
} from "./graph-visual";

type SimNode3D = SimulationNodeDatum & {
  key: string;
  kind: string;
  id: string;
  title: string;
  influence: number;
  r: number;
  color: THREE.Color;
  /** Present on a recorded outcome whose verdict the server could read. */
  outcome: string | null;
  x: number;
  y: number;
  z: number;
};

type SimEdge3D = SimulationLinkDatum<SimNode3D> & {
  id: string;
  source: SimNode3D;
  target: SimNode3D;
  /**
   * A belief that stopped being current, in ANY spelling. This used to read
   * `superseding`, which matched only the two active-voice spellings the engine
   * writes, so the 35 rows stored as `superseded_by` / `contradicted_by` /
   * `killed_by` were drawn as ordinary threads. Additive GL lines cannot carry a
   * dash pattern, so this canvas distinguishes revisions by hue and brightness
   * only; the flat canvas carries the full four-group stroke vocabulary.
   */
  revises: boolean;
  retired: boolean;
  /** Stroke brightness multiplier from the engine's confidence; 1 when unscored. */
  weight: number;
};

type CamState = { theta: number; phi: number; radius: number };

const FOV = 55;
const IDLE_MS = 1500; // stillness before the universe starts to drift
const AUTO_ROTATE = 0.0016; // radians per frame - a slow, calm drift
const SPHERE_SEGMENTS = 18;
const HALO_SCALE = 3.4;
const RING_SCALE = 3.0;

/**
 * OKLab -> linear sRGB (Björn Ottosson's matrices) plus the sRGB transfer,
 * because three.js parses hex, rgb() and hsl() and NOTHING else: handed an
 * oklch string its setStyle warns "unknown color model" and leaves the colour
 * untouched -- which for a fresh THREE.Color means white. Every Meridian token
 * computes to oklch, so a resolved value must land here before setStyle sees
 * it or a rekeyed colour silently paints white on the whole constellation.
 */
function oklchToRgb(css: string): string {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(css);
  if (!m) return css;
  const L = parseFloat(m[1]);
  const C = parseFloat(m[2]);
  const hDeg = parseFloat(m[3]);
  const h = (hDeg * Math.PI) / 180;
  const A = C * Math.cos(h);
  const B = C * Math.sin(h);
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.291485548 * B;
  const L3 = l_ * l_ * l_;
  const M3 = m_ * m_ * m_;
  const S3 = s_ * s_ * s_;
  const gam = (x: number) => {
    x = Math.min(1, Math.max(0, x));
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };
  const r = gam(4.0767416621 * L3 - 3.3077115913 * M3 + 0.2309699292 * S3);
  const g = gam(-1.2684380046 * L3 + 2.6097574011 * M3 - 0.3413193965 * S3);
  const b = gam(-0.0041960863 * L3 - 0.7034186147 * M3 + 1.707614701 * S3);
  // Hex is the one colour spelling every parser here accepts, and it is built
  // from the converted channels rather than frozen in source.
  const hx = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${hx(r)}${hx(g)}${hx(b)}`;
}

/** Deterministic z seed so a rebuild reads as growth, not a relayout (no Math.random). */
function seedZ(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = ((h >>> 0) % 100000) / 100000;
  return (u * 2 - 1) * 130;
}

/** A soft white radial glow, tinted per-node via the sprite material color. */
function makeGlowTexture(): THREE.Texture {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  if (!ctx) return tex;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.22, "rgba(255,255,255,0.55)");
  g.addColorStop(0.55, "rgba(255,255,255,0.16)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.needsUpdate = true;
  return tex;
}

/** A thin billboarded ring for the focus and selection markers, both neutral. */
function makeRingTexture(): THREE.Texture {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  if (!ctx) return tex;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.66, "rgba(255,255,255,0)");
  g.addColorStop(0.78, "rgba(255,255,255,0.95)");
  g.addColorStop(0.9, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.needsUpdate = true;
  return tex;
}

function toThreeColor(css: string, fallback: string): THREE.Color {
  const color = new THREE.Color();
  const v = (css || "").trim();
  try {
    color.setStyle(v.startsWith("oklch(") ? oklchToRgb(v) : v || fallback);
  } catch {
    color.set(fallback);
  }
  return color;
}

export function GraphUniverseCanvas({
  graph,
  selectedKey,
  onSelect,
  onOpenStory,
  staleKeys,
  hotKeys,
  reducedMotion,
}: {
  graph: KnowledgeGraph;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onOpenStory: (key: string) => void;
  staleKeys?: Set<string>;
  hotKeys?: Set<string>;
  reducedMotion: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());

  const simRef = useRef<Simulation<SimNode3D, undefined> | null>(null);
  const nodesRef = useRef<SimNode3D[]>([]);
  const edgesRef = useRef<SimEdge3D[]>([]);
  const nodeByKey = useRef(new Map<string, SimNode3D>());
  const posMemory = useRef(new Map<string, { x: number; y: number; z: number }>());

  const meshMapRef = useRef(new Map<string, THREE.Mesh>());
  const haloMapRef = useRef(new Map<string, THREE.Sprite>());
  const ringMapRef = useRef(new Map<string, THREE.Sprite>());
  const meshListRef = useRef<THREE.Object3D[]>([]);
  const lineRef = useRef<THREE.LineSegments | null>(null);
  const edgePosRef = useRef<Float32Array>(new Float32Array(0));
  const edgeColorRef = useRef<Float32Array>(new Float32Array(0));

  const sphereGeoRef = useRef<THREE.SphereGeometry | null>(null);
  const glowTexRef = useRef<THREE.Texture | null>(null);
  const ringTexRef = useRef<THREE.Texture | null>(null);

  const camStateRef = useRef<CamState>({ theta: 0.6, phi: 1.12, radius: 520 });
  const defaultCamRef = useRef<CamState>({ theta: 0.6, phi: 1.12, radius: 520 });
  const userMovedCam = useRef(false);
  const dragging = useRef<{
    active: boolean;
    lastX: number;
    lastY: number;
    startX: number;
    startY: number;
    startT: number;
    moved: boolean;
  } | null>(null);
  const lastInteract = useRef(0);
  const rafId = useRef<number | null>(null);
  const sizeRef = useRef({ w: 800, h: 520 });

  /**
   * Chrome colours, resolved off the live Meridian tokens by the init effect
   * below before anything paints. Empty until then, and never painted empty:
   * the effect that fills them is declared first and runs to completion in the
   * same mount pass.
   */
  const chromeRef = useRef({
    thread: toThreeColor("", ""),
    ground: toThreeColor("", ""),
    madder: toThreeColor("", ""),
    marigold: toThreeColor("", ""),
    selection: toThreeColor("", ""),
    pearl: toThreeColor("", ""),
  });
  const colorsRef = useRef<Map<string, string>>(new Map());

  // Imperative helpers are stored in refs so the graph-build, selection and
  // resize effects can call the closures the init effect created once.
  const applyEmphasisRef = useRef<(() => void) | null>(null);
  const renderOnceRef = useRef<(() => void) | null>(null);
  const startLoopRef = useRef<(() => void) | null>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const positionLabelRef = useRef<(() => void) | null>(null);

  const [hover, setHover] = useState<{ key: string; sx: number; sy: number } | null>(null);
  const hoverKeyRef = useRef<string | null>(null);
  hoverKeyRef.current = hover?.key ?? null;

  const selectedRef = useRef(selectedKey);
  selectedRef.current = selectedKey;
  const staleRef = useRef(staleKeys);
  staleRef.current = staleKeys;
  const hotRef = useRef(hotKeys);
  hotRef.current = hotKeys;
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onOpenStoryRef = useRef(onOpenStory);
  onOpenStoryRef.current = onOpenStory;
  const focusKeyRef = useRef<string | null>(graph.focusKey);
  focusKeyRef.current = graph.focusKey;

  const neighborSets = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of graph.edges) {
      const s = m.get(e.source) ?? new Set<string>();
      s.add(e.target);
      m.set(e.source, s);
      const t = m.get(e.target) ?? new Set<string>();
      t.add(e.source);
      m.set(e.target, t);
    }
    return m;
  }, [graph.edges]);
  const neighborsRef = useRef(neighborSets);
  neighborsRef.current = neighborSets;

  // Directional degree per node: how many artifacts fed INTO it (incoming) and
  // how many it went on to shape (outgoing). This is the compounding story the
  // hover card tells ("from 3, shaped 2"), not just a flat link count.
  const degreeByKey = useMemo(() => {
    const m = new Map<string, { inbound: number; outbound: number }>();
    for (const e of graph.edges) {
      const s = m.get(e.source) ?? { inbound: 0, outbound: 0 };
      s.outbound++;
      m.set(e.source, s);
      const t = m.get(e.target) ?? { inbound: 0, outbound: 0 };
      t.inbound++;
      m.set(e.target, t);
    }
    return m;
  }, [graph.edges]);

  // One-time scene setup + all imperative handlers (they read refs only, so a
  // closure captured here stays correct for the component's whole life).
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const mount = mountRef.current;
    if (!wrapper || !mount) return;

    // Resolve token colors off the live DOM (so 3D matches the 2D canvas exactly).
    colorsRef.current = resolveKindColors(wrapper);
    /**
     * Meridian reads, 2026-08-25. The retired reads moved: --ash to --mrd-mute
     * (the de-emphasised neutral is the same role on Meridian's ladder),
     * --sp-sink to --mrd-sink so a dimmed thread fades into exactly the recess
     * the wrapper paints, --madder to --mrd-fail, --marigold to --mrd-hold,
     * and --text-primary/--pearl to --mrd-ink -- selection and focus separate
     * by OPACITY and ring size, which needs no second hue.
     *
     * No literal fallbacks any more: every --mrd-* token is declared on :root
     * in meridian.css for both grounds. toThreeColor runs each resolved value
     * through the oklch converter above, because three.js cannot parse what
     * Meridian computes.
     */
    const styles = window.getComputedStyle(wrapper);
    const read = (token: string) => styles.getPropertyValue(token).trim();
    chromeRef.current = {
      thread: toThreeColor(read("--mrd-mute"), ""),
      /**
       * The colour a dimmed thread fades INTO, read off the panel the canvas sits
       * in so it follows the theme instead of assuming one. `--mrd-sink` is the
       * surface this wrapper already paints itself with (see the style below).
       */
      ground: toThreeColor(read("--mrd-sink"), ""),
      madder: toThreeColor(read("--mrd-fail"), ""),
      marigold: toThreeColor(read("--mrd-hold"), ""),
      selection: toThreeColor(read("--mrd-ink"), ""),
      pearl: toThreeColor(read("--mrd-ink"), ""),
    };

    const rect = wrapper.getBoundingClientRect();
    const w = Math.max(280, rect.width);
    const h = Math.max(320, rect.height);
    sizeRef.current = { w, h };

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    canvas.style.cursor = "grab";
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "The knowledge universe: an interactive 3D constellation of this workspace's signals, specs, decisions and outcomes. Drag to orbit, scroll to zoom. Use the list view for a screen reader friendly outline.",
    );
    mount.appendChild(canvas);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(FOV, w / h, 0.1, 12000);
    cameraRef.current = camera;

    // Shared, reused resources (disposed once, on unmount).
    sphereGeoRef.current = new THREE.SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
    glowTexRef.current = makeGlowTexture();
    ringTexRef.current = makeRingTexture();

    // A faint starfield gives the universe parallax and depth (DESIGN-LOOM 15).
    const starCount = 240;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      let sh = 2166136261 ^ i;
      sh = Math.imul(sh ^ (sh >>> 15), 2246822507);
      const rand = (n: number) => {
        sh = Math.imul(sh ^ (sh >>> 13), 3266489917 + n);
        return ((sh >>> 0) % 100000) / 100000;
      };
      const r = 1400 + rand(1) * 900;
      const theta = rand(2) * Math.PI * 2;
      const phi = Math.acos(2 * rand(3) - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: chromeRef.current.thread,
      size: 3.2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    stars.renderOrder = -2;
    scene.add(stars);

    // Edge threads: one additive LineSegments; per-edge color/intensity encodes
    // both the category and the focus dimming (recomputed in applyEmphasis).
    const edgeGeom = new THREE.BufferGeometry();
    edgeGeom.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(0), 3));
    edgeGeom.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(0), 3));
    /**
     * NORMAL blending, not additive.
     *
     * Additive blending only reads on a dark ground: on the light theme it pushes
     * every thread toward white, so the graph lost its edges entirely the moment
     * a user switched themes. Normal blending plus a colour that fades toward the
     * BACKGROUND (see applyEmphasis) gives the same "quiet thread" reading in both
     * themes, which is what a connected-graph view like Obsidian's relies on: the
     * links have to be the thing you see first.
     */
    const edgeMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(edgeGeom, edgeMat);
    lines.renderOrder = -1;
    lines.frustumCulled = false;
    scene.add(lines);
    lineRef.current = lines;

    const ndc = new THREE.Vector2();
    const tmpVec = new THREE.Vector3();
    const tmpColor = new THREE.Color();

    const updateCamera = () => {
      const cam = camStateRef.current;
      const sinPhi = Math.sin(cam.phi);
      camera.position.set(
        cam.radius * sinPhi * Math.sin(cam.theta),
        cam.radius * Math.cos(cam.phi),
        cam.radius * sinPhi * Math.cos(cam.theta),
      );
      camera.lookAt(0, 0, 0);
    };

    const syncPositions = () => {
      const nodes = nodesRef.current;
      for (const n of nodes) {
        const mesh = meshMapRef.current.get(n.key);
        if (mesh) mesh.position.set(n.x, n.y, n.z);
        const halo = haloMapRef.current.get(n.key);
        if (halo) halo.position.set(n.x, n.y, n.z);
        const ring = ringMapRef.current.get(n.key);
        if (ring) ring.position.set(n.x, n.y, n.z);
      }
      const edges = edgesRef.current;
      const pos = edgePosRef.current;
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        const o = i * 6;
        pos[o] = e.source.x;
        pos[o + 1] = e.source.y;
        pos[o + 2] = e.source.z;
        pos[o + 3] = e.target.x;
        pos[o + 4] = e.target.y;
        pos[o + 5] = e.target.z;
      }
      const line = lineRef.current;
      if (line && edges.length > 0) {
        const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
        attr.needsUpdate = true;
      }
    };

    const applyEmphasis = () => {
      const selected = selectedRef.current;
      const hovered = hoverKeyRef.current;
      const active = selected ?? hovered;
      const focus = focusKeyRef.current;
      const stale = staleRef.current;
      const hot = hotRef.current;
      const lit = active ? neighborsRef.current.get(active) : undefined;
      const isLit = (key: string) => !active || key === active || (lit?.has(key) ?? false);
      const chrome = chromeRef.current;

      for (const n of nodesRef.current) {
        const litNode = isLit(n.key);
        const dim = litNode ? 1 : 0.22;
        const mesh = meshMapRef.current.get(n.key);
        if (mesh) {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = dim;
        }
        const halo = haloMapRef.current.get(n.key);
        if (halo) {
          const isSel = n.key === selected;
          const isFocus = n.key === focus;
          (halo.material as THREE.SpriteMaterial).opacity =
            (isSel ? 0.95 : n.key === hovered ? 0.9 : isFocus ? 0.75 : 0.55) * dim;
        }
        const ring = ringMapRef.current.get(n.key);
        if (ring) {
          const mat = ring.material as THREE.SpriteMaterial;
          let show = false;
          if (n.key === selected) {
            mat.color.copy(chrome.selection);
            mat.opacity = 1 * dim;
            ring.scale.setScalar(n.r * (RING_SCALE + 0.7));
            show = true;
          } else if (n.key === focus) {
            mat.color.copy(chrome.pearl);
            mat.opacity = 0.6 * dim;
            ring.scale.setScalar(n.r * RING_SCALE);
            show = true;
          } else if (hot?.has(n.key)) {
            mat.color.copy(chrome.madder);
            mat.opacity = 0.8 * dim;
            ring.scale.setScalar(n.r * RING_SCALE);
            show = true;
          } else if (stale?.has(n.key)) {
            mat.color.copy(chrome.marigold);
            mat.opacity = 0.7 * dim;
            ring.scale.setScalar(n.r * (RING_SCALE + 0.25));
            show = true;
          }
          ring.visible = show;
        }
      }

      // Edge colors: bake category + dim into additive intensity.
      const edges = edgesRef.current;
      const colorArr = edgeColorRef.current;
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        const litEdge = isLit(e.source.key) && isLit(e.target.key);
        let base: THREE.Color;
        let intensity: number;
        if (e.revises && !e.retired) {
          base = chrome.madder;
          // A strong claim and a tentative one must not look identical. Weight
          // comes from the engine's own confidence, and an UNSCORED edge sits at
          // full weight rather than dimmed: "we did not score this" is not "we do
          // not believe this".
          intensity = (litEdge ? 0.95 : 0.32) * e.weight;
        } else if (e.retired) {
          base = chrome.thread;
          intensity = litEdge ? 0.3 : 0.12;
        } else if (active && litEdge) {
          // This fires on hover too, not only on true selection, so it stays
          // neutral and brightness alone carries the emphasis. The selected
          // node's own ring is neutral as well, as of 2026-08-15: selection and
          // focus separate by OPACITY (1.0 against 0.6) and RING SIZE, which
          // still reads with the hue removed. The ring used to be ember, which
          // meant clicking any node in the graph lit the product's one accent
          // on whatever the pointer had just landed on.
          base = chrome.thread;
          intensity = 0.9;
        } else {
          base = chrome.thread;
          intensity = litEdge ? 0.62 : 0.12;
        }
        // Fade toward the BACKGROUND, not toward black. multiplyScalar darkens,
        // which reads as "dimmer" only when the ground is dark; on the light theme
        // it made a dim thread DARKER and therefore louder than a lit one. Lerping
        // to the ground colour is the same visual on dark and correct on light.
        tmpColor.copy(base).lerp(chrome.ground, 1 - intensity);
        const o = i * 6;
        colorArr[o] = tmpColor.r;
        colorArr[o + 1] = tmpColor.g;
        colorArr[o + 2] = tmpColor.b;
        colorArr[o + 3] = tmpColor.r;
        colorArr[o + 4] = tmpColor.g;
        colorArr[o + 5] = tmpColor.b;
      }
      const line = lineRef.current;
      if (line && edges.length > 0) {
        const attr = line.geometry.getAttribute("color") as THREE.BufferAttribute;
        attr.needsUpdate = true;
      }
    };

    const positionLabel = () => {
      const el = labelRef.current;
      const key = hoverKeyRef.current;
      if (!el || !key) return;
      const n = nodeByKey.current.get(key);
      if (!n) return;
      tmpVec.set(n.x, n.y, n.z).project(camera);
      const behind = tmpVec.z > 1 || tmpVec.z < -1;
      const { w: vw, h: vh } = sizeRef.current;
      const sx = (tmpVec.x * 0.5 + 0.5) * vw;
      const sy = (-tmpVec.y * 0.5 + 0.5) * vh;
      const cardW = el.offsetWidth || 220;
      const cardH = el.offsetHeight || 78;
      let left = sx + 16;
      let top = sy + 14;
      if (left + cardW > vw) left = sx - cardW - 16;
      if (top + cardH > vh) top = sy - cardH - 14;
      el.style.left = `${Math.max(6, Math.min(left, vw - cardW - 6))}px`;
      el.style.top = `${Math.max(6, Math.min(top, vh - cardH - 6))}px`;
      el.style.opacity = behind ? "0" : "1";
    };
    positionLabelRef.current = positionLabel;

    const renderOnce = () => {
      syncPositions();
      updateCamera();
      renderer.render(scene, camera);
      positionLabel();
    };
    renderOnceRef.current = renderOnce;
    applyEmphasisRef.current = applyEmphasis;

    // isVisible tracks whether the canvas panel is in the viewport (via
    // IntersectionObserver). When false we skip RAF scheduling entirely.
    let isVisible = true;

    const loop = () => {
      // Hard-stop: tab is hidden or panel scrolled off-screen.
      if (document.hidden || !isVisible) {
        rafId.current = null;
        return;
      }

      const sim = simRef.current;
      let changed = false;

      // Check if physics simulation is running
      if (sim && !reducedRef.current) {
        if (sim.alpha() > sim.alphaMin() || sim.alphaTarget() > 0) {
          sim.tick();
          changed = true;
        }
      }

      // Check if auto-rotation should be active (not dragging and past idle timeout)
      if (
        !reducedRef.current &&
        !(dragging.current?.active ?? false) &&
        performance.now() - lastInteract.current > IDLE_MS
      ) {
        camStateRef.current.theta += AUTO_ROTATE;
        changed = true;
      }

      // Only render if something changed or hover state exists (reduce GPU/battery when idle)
      if (changed || hoverKeyRef.current) {
        syncPositions();
        updateCamera();
        renderer.render(scene, camera);
        if (hoverKeyRef.current) positionLabel();
      }

      // Only reschedule RAF if there's active animation or user interaction pending
      if (changed) {
        rafId.current = requestAnimationFrame(loop);
      } else {
        rafId.current = null;
      }
    };
    const startLoop = () => {
      if (rafId.current !== null) return;
      // Do not start if the tab is backgrounded or panel is out of view.
      if (document.hidden || !isVisible) return;
      rafId.current = requestAnimationFrame(loop);
    };
    const stopLoop = () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    // Pause RAF when the tab goes to the background; restart on return.
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else if (!reducedRef.current) {
        lastInteract.current = performance.now();
        startLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Pause RAF when the canvas panel scrolls out of view (IntersectionObserver).
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (!wasVisible && isVisible && !reducedRef.current) {
          // Panel came back into view, so resume if there is work to do.
          lastInteract.current = performance.now();
          startLoop();
        } else if (!isVisible) {
          stopLoop();
        }
      },
      { threshold: 0.01 },
    );
    observer.observe(mount);
    startLoopRef.current = startLoop;
    stopLoopRef.current = stopLoop;

    const localPoint = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { sx: e.clientX - r.left, sy: e.clientY - r.top };
    };
    const pick = (sx: number, sy: number): string | null => {
      const { w: vw, h: vh } = sizeRef.current;
      ndc.x = (sx / vw) * 2 - 1;
      ndc.y = -(sy / vh) * 2 + 1;
      raycasterRef.current.setFromCamera(ndc, camera);
      const hits = raycasterRef.current.intersectObjects(meshListRef.current, false);
      return hits.length ? (hits[0].object.userData.key as string) : null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // A touch/pen pointer can vanish before this runs; orbit still works.
      }
      const { sx, sy } = localPoint(e);
      dragging.current = {
        active: true,
        lastX: sx,
        lastY: sy,
        startX: sx,
        startY: sy,
        startT: performance.now(),
        moved: false,
      };
      lastInteract.current = performance.now();
      if (hoverKeyRef.current) setHover(null);
      canvas.style.cursor = "grabbing";
      // Interaction restarts the RAF loop if it self-stopped after the sim settled.
      if (!reducedRef.current) startLoop();
    };
    const onPointerMove = (e: PointerEvent) => {
      lastInteract.current = performance.now();
      // Interaction restarts the RAF loop if it self-stopped after the sim settled.
      if (!reducedRef.current && rafId.current === null) startLoop();
      const d = dragging.current;
      const { sx, sy } = localPoint(e);
      if (d?.active) {
        const dx = sx - d.lastX;
        const dy = sy - d.lastY;
        if (Math.hypot(sx - d.startX, sy - d.startY) > 4) d.moved = true;
        d.lastX = sx;
        d.lastY = sy;
        const cam = camStateRef.current;
        cam.theta -= dx * 0.006;
        cam.phi = Math.max(0.16, Math.min(Math.PI - 0.16, cam.phi - dy * 0.006));
        userMovedCam.current = true;
        if (reducedRef.current) renderOnce();
        return;
      }
      const key = pick(sx, sy);
      if (key !== hoverKeyRef.current) {
        setHover(key ? { key, sx, sy } : null);
      }
      canvas.style.cursor = key ? "pointer" : "grab";
    };
    const onPointerUp = (e: PointerEvent) => {
      const d = dragging.current;
      dragging.current = null;
      canvas.style.cursor = "grab";
      if (!d) return;
      const dt = performance.now() - d.startT;
      if (!d.moved && dt < 500) {
        const { sx, sy } = localPoint(e);
        const key = pick(sx, sy);
        // dim 17 (click-to-open): a single click on a node opens its detail
        // (the story panel) and focuses it; clicking empty space clears the
        // focus. No double-click requirement, no dead node.
        if (key) {
          onSelectRef.current(key);
          onOpenStoryRef.current(key);
        } else {
          onSelectRef.current(null);
        }
      }
    };
    const onPointerLeave = () => {
      dragging.current = null;
      if (hoverKeyRef.current) setHover(null);
      canvas.style.cursor = "grab";
    };
    const onDoubleClick = (e: MouseEvent) => {
      const { sx, sy } = localPoint(e);
      const key = pick(sx, sy);
      if (key) onOpenStoryRef.current(key);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = camStateRef.current;
      const factor = e.deltaY < 0 ? 0.9 : 1.111;
      cam.radius = Math.max(90, Math.min(3200, cam.radius * factor));
      userMovedCam.current = true;
      lastInteract.current = performance.now();
      if (reducedRef.current) {
        renderOnce();
      } else {
        // Restart loop in case it self-stopped while sim was settled.
        startLoop();
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("dblclick", onDoubleClick);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      stopLoop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("dblclick", onDoubleClick);
      canvas.removeEventListener("wheel", onWheel);

      simRef.current?.stop();
      // Dispose every node object's material.
      for (const mesh of meshMapRef.current.values()) (mesh.material as THREE.Material).dispose();
      for (const halo of haloMapRef.current.values()) (halo.material as THREE.Material).dispose();
      for (const ring of ringMapRef.current.values()) (ring.material as THREE.Material).dispose();
      meshMapRef.current.clear();
      haloMapRef.current.clear();
      ringMapRef.current.clear();
      meshListRef.current = [];

      edgeGeom.dispose();
      edgeMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      sphereGeoRef.current?.dispose();
      glowTexRef.current?.dispose();
      ringTexRef.current?.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      lineRef.current = null;
    };
  }, []);

  // Build (or rebuild) the constellation whenever the graph changes.
  useEffect(() => {
    const scene = sceneRef.current;
    const sphereGeo = sphereGeoRef.current;
    const glowTex = glowTexRef.current;
    const ringTex = ringTexRef.current;
    const line = lineRef.current;
    if (!scene || !sphereGeo || !glowTex || !ringTex || !line) return;

    // Persist prior positions so a time-scrub reads as growth, not a relayout.
    for (const n of nodesRef.current) posMemory.current.set(n.key, { x: n.x, y: n.y, z: n.z });
    simRef.current?.stop();

    // Tear down the previous node objects (shared geometry/textures are kept).
    for (const mesh of meshMapRef.current.values()) {
      scene.remove(mesh);
      (mesh.material as THREE.Material).dispose();
    }
    for (const halo of haloMapRef.current.values()) {
      scene.remove(halo);
      (halo.material as THREE.Material).dispose();
    }
    for (const ring of ringMapRef.current.values()) {
      scene.remove(ring);
      (ring.material as THREE.Material).dispose();
    }
    meshMapRef.current.clear();
    haloMapRef.current.clear();
    ringMapRef.current.clear();
    meshListRef.current = [];
    nodeByKey.current.clear();

    const isFirstBuild = nodesRef.current.length === 0;
    const colors = colorsRef.current;
    // __unknown is always present in the map resolveKindColors builds.
    const unknown = colors.get("__unknown") ?? "";

    const nodes: SimNode3D[] = graph.nodes.map((n) => {
      const prior = posMemory.current.get(n.key);
      const color = toThreeColor(colors.get(n.kind) ?? unknown, unknown);
      const node: SimNode3D = {
        key: n.key,
        kind: n.kind,
        id: n.id,
        title: n.title,
        influence: n.influence,
        r: Math.round(nodeRadius(n, n.key === graph.focusKey) * 2) / 2,
        color,
        outcome: n.outcome,
        x: prior?.x ?? n.x,
        y: prior?.y ?? n.y,
        z: prior?.z ?? seedZ(n.key),
      };
      nodeByKey.current.set(n.key, node);
      return node;
    });

    for (const n of nodes) {
      const mat = new THREE.MeshBasicMaterial({ color: n.color, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.scale.setScalar(n.r);
      mesh.position.set(n.x, n.y, n.z);
      mesh.userData.key = n.key;
      scene.add(mesh);
      meshMapRef.current.set(n.key, mesh);
      meshListRef.current.push(mesh);

      const haloMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: n.color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.55,
      });
      const halo = new THREE.Sprite(haloMat);
      halo.scale.setScalar(n.r * HALO_SCALE);
      halo.position.set(n.x, n.y, n.z);
      scene.add(halo);
      haloMapRef.current.set(n.key, halo);

      const ringMat = new THREE.SpriteMaterial({
        map: ringTex,
        color: chromeRef.current.pearl,
        transparent: true,
        depthWrite: false,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Sprite(ringMat);
      ring.scale.setScalar(n.r * RING_SCALE);
      ring.position.set(n.x, n.y, n.z);
      ring.visible = false;
      scene.add(ring);
      ringMapRef.current.set(n.key, ring);
    }

    const edges: SimEdge3D[] = [];
    for (const e of graph.edges) {
      const source = nodeByKey.current.get(e.source);
      const target = nodeByKey.current.get(e.target);
      if (!source || !target) continue;
      edges.push({
        id: e.id,
        source,
        target,
        revises: e.revises,
        retired: e.retired,
        // Clamped at 1 so a high-confidence edge never blows past the additive
        // ceiling and reads as a different colour instead of a stronger one.
        weight: Math.min(1, edgeWeight(e.confidence)),
      });
    }
    nodesRef.current = nodes;
    edgesRef.current = edges;

    // Size the edge buffers for the new edge set.
    edgePosRef.current = new Float32Array(edges.length * 6);
    edgeColorRef.current = new Float32Array(edges.length * 6);
    /**
     * BufferAttribute, NOT Float32BufferAttribute. This is why the 3D graph drew
     * nodes and no edges (found 2026-08-03 on the live app).
     *
     * three/src/core/BufferAttribute.js:
     *   class Float32BufferAttribute extends BufferAttribute {
     *     constructor(array, itemSize, normalized) {
     *       super(new Float32Array(array), itemSize, normalized);   // <- COPIES
     *
     * So `attr.array` was a different Float32Array from `edgePosRef.current`. The
     * frame loop wrote every edge endpoint into the ref and then set needsUpdate
     * on the attribute wrapping the COPY, which stayed all zeros. Every segment
     * collapsed to a degenerate point at the origin, so nothing was visible even
     * though the data was perfect: the hover card correctly read "3 links, from 3"
     * on a node with no line attached to it, and the Flat canvas drew the same
     * graph properly the whole time.
     *
     * BufferAttribute takes the array by reference, which is what a per-frame
     * mutable buffer requires. `setUsage(DynamicDrawUsage)` tells the driver this
     * is rewritten every frame rather than uploaded once.
     */
    const posAttr = new THREE.BufferAttribute(edgePosRef.current, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    const colAttr = new THREE.BufferAttribute(edgeColorRef.current, 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    line.geometry.setAttribute("position", posAttr);
    line.geometry.setAttribute("color", colAttr);

    const sim = forceSimulation<SimNode3D>(nodes, 3)
      .force(
        "link",
        forceLink<SimNode3D, SimEdge3D>(edges)
          .distance((l) => 60 + (l.source.r + l.target.r) * 0.9)
          .strength(0.5),
      )
      .force("charge", forceManyBody<SimNode3D>().strength(-190).distanceMax(520))
      .force(
        "collide",
        forceCollide<SimNode3D>()
          .radius((n) => n.r + 6)
          .strength(0.9),
      )
      .force("center", forceCenter<SimNode3D>(0, 0, 0).strength(0.22))
      .alphaDecay(0.035)
      .velocityDecay(0.34)
      .alpha(isFirstBuild ? 0.9 : 0.5)
      .stop();
    simRef.current = sim;

    if (reducedRef.current) {
      let guard = 0;
      while (sim.alpha() > sim.alphaMin() && guard < 320) {
        sim.tick();
        guard++;
      }
    }

    // Frame the constellation on first sight; keep the user's camera after.
    if (!userMovedCam.current && nodes.length > 0) {
      let maxDist = 0;
      for (const n of nodes) {
        maxDist = Math.max(maxDist, Math.hypot(n.x, n.y, n.z) + n.r);
      }
      const radius = Math.max(200, maxDist * 2.2);
      defaultCamRef.current = { theta: 0.6, phi: 1.12, radius };
      camStateRef.current = { ...defaultCamRef.current };
    }

    applyEmphasisRef.current?.();
    lastInteract.current = performance.now();
    if (reducedRef.current) {
      stopLoopRef.current?.();
      renderOnceRef.current?.();
    } else {
      startLoopRef.current?.();
    }

    return () => {
      sim.stop();
    };
  }, [graph]);

  // Re-light on focus / selection / annotation change.
  useEffect(() => {
    applyEmphasisRef.current?.();
    if (reducedRef.current) renderOnceRef.current?.();
  }, [selectedKey, staleKeys, hotKeys]);

  // Hover lights the hovered node's connections immediately (Rauno: responsive,
  // reveal the relationship on intent, not only on commit). Under reduced
  // motion the drift loop is off, so paint one frame.
  useEffect(() => {
    applyEmphasisRef.current?.();
    if (reducedRef.current) renderOnceRef.current?.();
  }, [hover]);

  // Start / stop the drift loop when the motion preference flips at runtime.
  useEffect(() => {
    if (reducedMotion) {
      stopLoopRef.current?.();
      const sim = simRef.current;
      if (sim) {
        let guard = 0;
        while (sim.alpha() > sim.alphaMin() && guard < 320) {
          sim.tick();
          guard++;
        }
      }
      applyEmphasisRef.current?.();
      renderOnceRef.current?.();
    } else {
      lastInteract.current = performance.now();
      startLoopRef.current?.();
    }
  }, [reducedMotion]);

  // Position the hover label once when it appears (covers the reduced-motion
  // still, where no loop runs to track it).
  useEffect(() => {
    if (hover) positionLabelRef.current?.();
  }, [hover]);

  // DPR-aware sizing.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const apply = () => {
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      if (!renderer || !camera) return;
      const rect = wrapper.getBoundingClientRect();
      const w = Math.max(280, rect.width);
      const h = Math.max(320, rect.height);
      sizeRef.current = { w, h };
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderOnceRef.current?.();
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  const hoverNode = hover ? (nodeByKey.current.get(hover.key) ?? null) : null;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(420px, 58vh, 640px)",
        // The ONE bordered container in this region. The recess reads as a
        // window cut into the page rather than a card sitting on it.
        background: "var(--mrd-sink)",
        border: "1px solid var(--mrd-line)",
        borderRadius: "var(--mrd-r-card)",
        overflow: "hidden",
      }}
    >
      {/* The nebula went with the retired system. Two stacked radial gradients,
          one of them EMBER, is a blurred orb (anti-slop ban 2) spending the one
          colour reserved for marking the human on a decorative wash. The recess
          is the depth, and the constellation is the picture. */}
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
      {hoverNode ? (
        <div
          ref={labelRef}
          role="tooltip"
          style={{
            position: "absolute",
            left: hover ? hover.sx + 16 : 0,
            top: hover ? hover.sy + 14 : 0,
            maxWidth: 260,
            pointerEvents: "none",
            // SOLID, not glass. Blur is chrome material for things that
            // genuinely float (anti-slop ban 2), and a label read against a
            // moving constellation is the one place it costs contrast rather
            // than buying depth.
            background: "var(--mrd-float)",
            border: "1px solid var(--mrd-line)",
            borderRadius: "var(--mrd-r-card)",
            boxShadow: "var(--mrd-shadow-float)",
            padding: "10px 12px",
            zIndex: 5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                borderRadius: 3,
                background: kindCssColor(hoverNode.kind),
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "var(--mrd-t-base)", color: "var(--mrd-mute)" }}>
              {kindLabel(hoverNode.kind)}
            </span>
            {/* How it turned out, where the record actually knows. Green and red
                carry outcomes, and a recorded outcome is the one node on this
                canvas that IS one. Absent, never guessed, when unread. The
                retired sp-classes became their tokens: fail to --mrd-fail,
                pass to --mrd-pass. */}
            {outcomeLabel(hoverNode.outcome) ? (
              <span
                style={{
                  fontSize: "var(--mrd-t-base)",
                  color:
                    hoverNode.outcome === "missed"
                      ? "var(--mrd-fail)"
                      : "var(--mrd-pass)",
                }}
              >
                {outcomeLabel(hoverNode.outcome)}
              </span>
            ) : null}
          </div>
          <div
            style={{
              color: "var(--mrd-ink)",
              lineHeight: "var(--mrd-lh-snug)",
              marginBottom: 6,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {truncateTitle(hoverNode.title, 60) || "Untitled"}
          </div>
          <div style={{ fontSize: "var(--mrd-t-base)", color: "var(--mrd-mute)" }}>
            <Num>{hoverNode.influence}</Num> {hoverNode.influence === 1 ? "link" : "links"}
            {(() => {
              const deg = degreeByKey.get(hoverNode.key);
              if (!deg || (deg.inbound === 0 && deg.outbound === 0)) return null;
              const parts: string[] = [];
              if (deg.inbound > 0) parts.push(`from ${deg.inbound}`);
              if (deg.outbound > 0) parts.push(`shaped ${deg.outbound}`);
              return ` · ${parts.join(", ")}`;
            })()}
          </div>
          <div style={{ fontSize: "var(--mrd-t-base)", color: "var(--mrd-mute)", marginTop: 5 }}>
            Hover lights its connections, click to focus, double-click for the story
          </div>
        </div>
      ) : null}
      <div style={{ position: "absolute", right: 10, bottom: 8 }}>
        <Action
          variant="quiet"
          onClick={() => {
            userMovedCam.current = false;
            camStateRef.current = { ...defaultCamRef.current };
            lastInteract.current = performance.now();
            if (!reducedRef.current) simRef.current?.alpha(0.3);
            if (reducedRef.current) renderOnceRef.current?.();
          }}
        >
          Recentre
        </Action>
      </div>
    </div>
  );
}
