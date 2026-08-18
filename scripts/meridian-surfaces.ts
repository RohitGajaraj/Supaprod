/**
 * THE SURFACE LEDGER: which surface still speaks the retired system, and at what depth.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 * `design:ratchet` counts debt per FILE and `design:adoption` counts Meridian
 * components per COMPONENT. Neither answers the question a person porting the
 * product actually asks: "if I open this station and keep clicking, how much of
 * what I meet is still the old system?"
 *
 * A file list cannot answer that, because the debt a reader meets on /discover
 * is not the debt in `_authenticated.discover.tsx`. It is that file plus every
 * component reachable from it, to any depth. The route file can be spotless
 * while the sheet two clicks in is entirely retired, and a per-file report will
 * happily call that surface clean.
 *
 * So this walks the import graph from each route and attributes the whole
 * reachable tree to the surface, with the DEPTH at which each file is first
 * met. Depth 1 is the route itself, depth 2 is what it renders directly, depth
 * 3+ is what you reach by clicking. That is the founder's own framing: layer 1,
 * layer 2, layer 3, the deepest click possible.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ────────────────────────────────────
 * It does not judge. It reports reachable debt and prints the deepest offenders
 * per surface. Deciding what to port first is a person's call; this only makes
 * sure nothing is invisible when they make it.
 *
 * Shared components are counted for EVERY surface that reaches them, on
 * purpose. `shell/primitives` is reached by nearly everything, and a report
 * that charged it to one owner would tell six stations they were clean.
 * `--unique` charges each file to its shallowest surface instead, which is the
 * view you want when planning who does the work rather than what a reader meets.
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const SRC = join(ROOT, "src");
const BASELINE = join(SRC, "__tests__", "meridian-ratchet.baseline.json");

type Baseline = {
  totalOccurrences: number;
  fileCount: number;
  files: Record<string, Record<string, number>>;
};

const baseline = JSON.parse(readFileSync(BASELINE, "utf8")) as Baseline;

/** Debt for one repo-relative path, or 0 when the file carries none. */
function debtOf(rel: string): number {
  const entry = baseline.files[rel];
  if (!entry) return 0;
  return Object.values(entry).reduce((a, c) => a + (typeof c === "number" ? c : 0), 0);
}

/* ------------------------------------------------------------------ *
 * Import resolution
 * ------------------------------------------------------------------ */

const EXTS = [".tsx", ".ts", ".jsx", ".js"];

/** Resolve a specifier to a repo-relative path, or null when it leaves src/.
 *
 *  Only `@/` and relative specifiers can reach our own code; a bare specifier
 *  is a package and is not ours to port. */
function resolveSpec(spec: string, fromFile: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(join(ROOT, fromFile)), spec);
  else return null;

  for (const ext of EXTS) {
    const cand = base + ext;
    if (existsSync(cand) && statSync(cand).isFile()) return relOf(cand);
  }
  if (existsSync(base) && statSync(base).isDirectory()) {
    for (const ext of EXTS) {
      const cand = join(base, "index" + ext);
      if (existsSync(cand)) return relOf(cand);
    }
  }
  return null;
}

function relOf(abs: string): string {
  return abs.slice(ROOT.length + 1);
}

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]{0,400}?from\s*["']([^"']+)["']/g;
const LAZY_RE = /import\(\s*["']([^"']+)["']\s*\)/g;

const importCache = new Map<string, string[]>();

/** Every one of OUR files this file pulls in, static or lazy. */
function importsOf(rel: string): string[] {
  const hit = importCache.get(rel);
  if (hit) return hit;

  const abs = join(ROOT, rel);
  let text = "";
  try {
    text = readFileSync(abs, "utf8");
  } catch {
    importCache.set(rel, []);
    return [];
  }

  const out = new Set<string>();
  for (const re of [IMPORT_RE, LAZY_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const r = resolveSpec(m[1], rel);
      if (r) out.add(r);
    }
  }
  const list = [...out];
  importCache.set(rel, list);
  return list;
}

/* ------------------------------------------------------------------ *
 * Reachability
 * ------------------------------------------------------------------ */

/** Breadth-first from a route, recording the SHALLOWEST depth each file is met
 *  at. Breadth-first matters: depth is "how many clicks in did this first
 *  appear", and a depth-first walk would report whichever path it wandered down
 *  first, which is not a fact about the product. */
function reachFrom(entry: string): Map<string, number> {
  const depth = new Map<string, number>([[entry, 1]]);
  let frontier = [entry];
  while (frontier.length) {
    const next: string[] = [];
    for (const file of frontier) {
      const d = depth.get(file)!;
      for (const dep of importsOf(file)) {
        if (depth.has(dep)) continue;
        depth.set(dep, d + 1);
        next.push(dep);
      }
    }
    frontier = next;
  }
  return depth;
}

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

function routeFiles(): string[] {
  const dir = join(SRC, "routes");
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const abs = join(d, name);
      const st = statSync(abs);
      if (st.isDirectory()) {
        if (name === "__tests__") continue;
        walk(abs);
      } else if (name.endsWith(".tsx") && !name.includes(".test.")) {
        out.push(relOf(abs));
      }
    }
  };
  walk(dir);
  return out.sort();
}

/** The seven stations, by the route that opens each one. Order is the loop's
 *  own order, which is the order a person walks them, not alphabetical. */
const STATIONS: Array<[string, string[]]> = [
  ["01 discover", ["_authenticated.discover.tsx", "_authenticated.discovery.tsx"]],
  ["02 decide", ["_authenticated.decide.tsx"]],
  ["03 plan", ["_authenticated.plan.index.tsx", "_authenticated.plan.spec.$id.tsx"]],
  ["04 design", ["_authenticated.design.tsx"]],
  ["05 build", ["_authenticated.build.index.tsx", "_authenticated.build.$missionId.tsx"]],
  ["06 ship", ["_authenticated.ship.tsx"]],
  ["07 learn", ["_authenticated.learn.tsx"]],
];

const argv = process.argv.slice(2);
const wantUnique = argv.includes("--unique");
const wantStations = argv.includes("--stations");
const detailFor = (() => {
  const i = argv.indexOf("--surface");
  return i >= 0 ? argv[i + 1] : null;
})();

const routes = routeFiles();

type SurfaceRow = {
  route: string;
  own: number;
  reachable: number;
  files: number;
  dirty: number;
  byDepth: Map<number, number>;
  depths: Map<string, number>;
};

function measure(route: string): SurfaceRow {
  const depths = reachFrom(route);
  const byDepth = new Map<number, number>();
  let reachable = 0;
  let dirty = 0;
  for (const [file, d] of depths) {
    const debt = debtOf(file);
    if (debt > 0) {
      reachable += debt;
      dirty++;
      byDepth.set(d, (byDepth.get(d) ?? 0) + debt);
    }
  }
  return { route, own: debtOf(route), reachable, files: depths.size, dirty, byDepth, depths };
}

const rows = routes.map(measure);

/* ------------------------------------------------------------------ *
 * Reporting
 * ------------------------------------------------------------------ */

const short = (r: string) => r.replace("src/routes/", "");

if (detailFor) {
  const row = rows.find((r) => short(r.route).includes(detailFor));
  if (!row) {
    console.error(`No surface matching "${detailFor}".`);
    process.exit(1);
  }
  console.log(`SURFACE  ${short(row.route)}`);
  console.log(
    `reachable debt ${row.reachable} across ${row.dirty} dirty files of ${row.files} reached\n`,
  );
  const dirtyFiles = [...row.depths.entries()]
    .map(([f, d]) => ({ f, d, debt: debtOf(f) }))
    .filter((x) => x.debt > 0)
    .sort((a, b) => a.d - b.d || b.debt - a.debt);
  let lastDepth = -1;
  for (const { f, d, debt } of dirtyFiles) {
    if (d !== lastDepth) {
      console.log(
        `\n  ── depth ${d} ${d === 1 ? "(the route itself)" : d === 2 ? "(what it renders)" : "(reached by clicking)"}`,
      );
      lastDepth = d;
    }
    console.log(`     ${String(debt).padStart(4)}  ${f}`);
  }
  process.exit(0);
}

if (wantStations) {
  console.log("THE SPINE, 01 to 07: debt a reader meets, by depth\n");
  console.log("station          own  reachable  dirty   d1    d2    d3+");
  console.log("-".repeat(62));
  for (const [name, entries] of STATIONS) {
    const mine = rows.filter((r) => entries.some((e) => r.route.endsWith(e)));
    if (!mine.length) {
      console.log(`${name.padEnd(15)} (no route found)`);
      continue;
    }
    // A station's reachable set is the UNION of its routes', so a file reached
    // by both the index and the detail is one thing a reader meets, not two.
    const union = new Map<string, number>();
    for (const r of mine)
      for (const [f, d] of r.depths) union.set(f, Math.min(d, union.get(f) ?? Infinity));
    let own = 0,
      reach = 0,
      dirty = 0,
      d1 = 0,
      d2 = 0,
      d3 = 0;
    for (const r of mine) own += r.own;
    for (const [f, d] of union) {
      const debt = debtOf(f);
      if (!debt) continue;
      reach += debt;
      dirty++;
      if (d === 1) d1 += debt;
      else if (d === 2) d2 += debt;
      else d3 += debt;
    }
    console.log(
      `${name.padEnd(15)} ${String(own).padStart(4)} ${String(reach).padStart(10)} ${String(dirty).padStart(6)} ${String(d1).padStart(4)} ${String(d2).padStart(5)} ${String(d3).padStart(6)}`,
    );
  }
  console.log("\nd1 = the route file. d2 = what it renders. d3+ = what you reach by clicking.");
  console.log("Shared files are counted for every station that reaches them, on purpose:");
  console.log("shell/primitives is met on all seven, and charging it to one would");
  console.log("tell the other six they were clean.");
  process.exit(0);
}

if (wantUnique) {
  // Charge each dirty file to its shallowest surface, ties broken by the
  // surface that reaches fewer files, so a focused route owns its own tree
  // rather than losing it to a hub that happens to import everything.
  const owner = new Map<string, { route: string; depth: number; span: number }>();
  for (const r of rows)
    for (const [f, d] of r.depths) {
      if (!debtOf(f)) continue;
      const cur = owner.get(f);
      if (!cur || d < cur.depth || (d === cur.depth && r.files < cur.span))
        owner.set(f, { route: r.route, depth: d, span: r.files });
    }
  const tally = new Map<string, number>();
  for (const [f, o] of owner) tally.set(o.route, (tally.get(o.route) ?? 0) + debtOf(f));
  const sorted = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  console.log("DEBT CHARGED ONCE, to the shallowest surface that reaches it\n");
  console.log("  debt  surface");
  console.log("-".repeat(62));
  for (const [route, debt] of sorted.slice(0, 40))
    console.log(`${String(debt).padStart(6)}  ${short(route)}`);
  const total = sorted.reduce((a, r) => a + r[1], 0);
  console.log(
    `\n${total} occurrences over ${sorted.length} surfaces. Every file is charged exactly once.`,
  );
  process.exit(0);
}

const sorted = [...rows].sort((a, b) => b.reachable - a.reachable);
console.log("WHAT A READER MEETS, per surface, retired-system occurrences\n");
console.log("reachable   own  dirty  surface");
console.log("-".repeat(70));
for (const r of sorted.slice(0, 40))
  console.log(
    `${String(r.reachable).padStart(9)} ${String(r.own).padStart(5)} ${String(r.dirty).padStart(6)}  ${short(r.route)}`,
  );

const clean = rows.filter((r) => r.reachable === 0).length;
console.log(
  `\n${rows.length} surfaces. ${clean} reach no retired code at all. ${rows.length - clean} still do.`,
);
console.log(
  `Baseline total: ${baseline.totalOccurrences} occurrences in ${baseline.fileCount} files.`,
);
console.log("\n  --stations          the spine 01 to 07, by depth");
console.log("  --unique            charge each file once, for planning who does the work");
console.log("  --surface <match>   every dirty file behind one surface, by depth");
