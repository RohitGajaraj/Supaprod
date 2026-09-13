/**
 * ── EVERY SURFACE IS REACHABLE, OR IT SENDS YOU SOMEWHERE ─────────────────
 *
 * The founder's second territory asks for structure that matches how a person
 * thinks, and names the moves: *"Rename, merge, split or delete surfaces."*
 * This is the invariant that keeps the answer honest afterwards.
 *
 * **A route nobody links is not automatically wrong.** A retired surface that
 * redirects is doing exactly the right thing: an old link in an email, a doc or
 * an agent's output still lands somewhere useful instead of 404ing. What is
 * wrong is a route that *renders a page* nobody can get to — it takes build
 * time, it drifts, and it is a second structure competing with the real one.
 *
 * ── MEASURED 2026-09-10 AND CLEAN, WHICH IS THE REASON TO PIN IT ──────────
 * 38 authenticated routes. Ten are linked from nothing in the tree — the seven
 * stations, `/runs/$missionId`, `/prds`, `/brain` — **and every one of them is
 * a redirect stub**, most under 25 lines, several carrying the ruling that
 * retired them. That is a tidy result and the only way it stays tidy is if
 * something notices the first route that renders into the void.
 *
 * ── AND MY OWN FIRST MEASUREMENT WAS WRONG, IN THE WAY LAW 18 NAMES ───────
 * The scan that found this reported `/today` as a live shell link with no
 * route. It is not: `/today` survives only in three COMMENTS explaining what
 * the home used to be called. I had not stripped comments — thirty minutes
 * after publishing the half of law 18 that says a guard must read the thing its
 * name claims. The strip below is not boilerplate; it is the whole difference
 * between this file and a false alarm.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const ROUTES = join(ROOT, "routes");

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

/** Authenticated route files, by the path segment they own. */
function authedRoutes(): Array<{ seg: string; file: string }> {
  const out: Array<{ seg: string; file: string }> = [];
  for (const f of readdirSync(ROUTES)) {
    if (!f.endsWith(".tsx") || !f.startsWith("_authenticated.")) continue;
    const n = f.slice("_authenticated.".length, -4);
    const seg = n.split(".")[0]!;
    if (!seg || seg.startsWith("$")) continue;
    out.push({ seg: `/${seg}`, file: f });
  }
  return out;
}

/** Every `/segment` any file links to, comments stripped. */
function linked(): Set<string> {
  const out = new Set<string>();
  for (const f of walk(ROOT)) {
    const src = strip(readFileSync(f, "utf8"));
    for (const m of src.matchAll(/to:\s*"(\/[a-z0-9-]+)|to="(\/[a-z0-9-]+)/g)) {
      out.add(m[1] ?? m[2]!);
    }
  }
  return out;
}

/** A route file whose whole job is to send you elsewhere. */
function redirects(file: string): boolean {
  return /throw\s+redirect|\bredirect\(/.test(strip(readFileSync(join(ROUTES, file), "utf8")));
}

describe("no surface nobody can reach", () => {
  it("renders no authenticated page that nothing links to", () => {
    const have = linked();
    const stranded = authedRoutes()
      .filter((r) => !have.has(r.seg) && !redirects(r.file))
      .map((r) => r.file);
    expect(
      stranded,
      "an authenticated route renders a page no link in the tree reaches. Either link it, or make it a redirect to the surface that replaced it — a retired page that redirects still catches old links; one that lingers is a second structure competing with the real one.",
    ).toEqual([]);
  });

  it("still finds the routes and the links it claims to read", () => {
    /*
     * THE MIRROR. The assertion above passes by finding nothing, so a walker
     * that stopped descending would report a clean bill of health — and an
     * empty LINK set is the dangerous direction, because it makes every route
     * look stranded and would fail loudly, while an empty ROUTE set passes in
     * silence.
     */
    expect(authedRoutes().length).toBeGreaterThan(25);
    expect(linked().size).toBeGreaterThan(10);
    for (const seg of ["/start", "/inbox", "/outcomes"]) {
      expect({ seg, linked: linked().has(seg) }).toEqual({ seg, linked: true });
    }
  });

  it("keeps the retired stations gone, rather than as redirects nothing follows", () => {
    /*
     * ── WHAT THIS USED TO ASSERT, AND WHY IT INVERTED (Lane 1, 2026-09-10) ──
     *
     * It required `discover`, `decide`, `design`, `ship` and `learn` to EXIST
     * as routes and to be redirects, on the reasoning that "these catch links
     * from before that was true."
     *
     * They caught nothing. Measured across the whole of `src/`, excluding each
     * stub's own file, its comments and `legacy-redirects`' own list: **zero
     * inbound links** to `/brain`, `/learn`, `/ship`, `/decide`, `/design`,
     * `/discover`, `/prds`, `/build` or `/runs/$missionId`. The one real
     * reference left in the tree was `research.server.ts` pointing a citation
     * at `/brain`, and a citation is the most expensive place to spend a hop
     * through an address that exists only to bounce you: it lands mid-thought.
     * It now names `/outcomes`, which is where `/brain` was sending it.
     *
     * The stubs' own headers gave them a one-week inbound-link window opening
     * 2026-09-02. It closed. And `legacy-redirects.ts` carries this repo's
     * ruling on the general case, which P-10 already applied to 49 of them:
     * **the 404 with a door is the correct landing.** A redirect nobody follows
     * is not a safety net, it is a second address for a surface that has one.
     *
     * SO THE CLAIM INVERTS, AND IT IS THE STRONGER OF THE TWO. A station must
     * not exist as a route AT ALL. A station is a stop on a run's road, reached
     * through `/track/:id`; the moment one grows an address again the product
     * has two structures for one idea, and this fires before it grows a page.
     */
    const gone = ["discover", "decide", "design", "ship", "learn", "brain", "prds"];
    const back = gone.filter((seg) => authedRoutes().some((r) => r.seg === `/${seg}`));
    expect(
      back,
      "a retired station has an address again. A station is a stop on a run's road, reached through /track/:id; a route of its own is a second structure for one idea.",
    ).toEqual([]);
  });
});
