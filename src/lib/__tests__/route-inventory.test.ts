// Route inventory (cleanup sweep 2026-07-11): every PUBLIC route must be
// reachable from somewhere inside the app. A public page nobody links to is
// either dead weight or a broken funnel (the /trust incident: a page that
// shipped and then silently fell out of every footer). This test statically
// greps the src tree and fails when a public route file has zero inbound
// references from any other src file.
//
// Deliberately grep-based and synchronous: no router import, no rendering,
// deterministic, and fast enough to run in every suite.
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "..");
const ROUTES_DIR = join(SRC, "routes");

// Public routes that legitimately have no inbound link, each with the reason.
// Add here ONLY with a reason; an empty reason should fail review.
const EXEMPT: Record<string, string> = {
  "/trust": "redirect-only stub (301 to /security); kept because URLs are forever",
  "/p/teardown":
    "RPT-03 no-signup public demo wedge, reached via external marketing/discovery links; its internal inbound link belongs on the public landing, frozen until the landing revamp lands. Remove this exemption when the landing links it.",
};

/** Top-level public route files: not _authenticated/_root, not api/, not
 *  index (the site entry), not bracket-escaped externally-entered routes
 *  (the Lovable OAuth consent screen), not .ts server routes (mcp). */
function publicRouteFiles(): string[] {
  return readdirSync(ROUTES_DIR).filter((f) => {
    if (!f.endsWith(".tsx")) return false;
    if (f.startsWith("_") || f.startsWith("[")) return false;
    if (f === "index.tsx" || f === "routeTree.gen.ts") return false;
    return statSync(join(ROUTES_DIR, f)).isFile();
  });
}

/** "checkout.return.tsx" -> "/checkout/return"; "p.$slug.tsx" -> "/p/$slug". */
function routePath(file: string): string {
  return (
    "/" +
    file
      .replace(/\.tsx$/, "")
      .split(".")
      .join("/")
  );
}

/** The strings whose presence in another file counts as an inbound link. */
function needles(path: string): string[] {
  const dollar = path.indexOf("$");
  if (dollar === -1) return [path];
  const prefix = path.slice(0, dollar);
  // to="/p/$slug" (router link) or `/p/${slug}` (built URL) both count.
  return [path, prefix + "${"];
}

/** True when `content` contains `needle` NOT followed by a route-ish char,
 *  so "/demo" never matches "/demos" or "/demo-x". Template needles end in
 *  "${" and are matched as plain substrings. */
function containsRef(content: string, needle: string): boolean {
  if (needle.endsWith("${")) return content.includes(needle);
  let from = 0;
  for (;;) {
    const i = content.indexOf(needle, from);
    if (i === -1) return false;
    const after = content[i + needle.length];
    if (after === undefined || !/[a-zA-Z0-9_-]/.test(after)) return true;
    from = i + 1;
  }
}

/** Every src .ts/.tsx file except generated output and the macOS " 2" dupes. */
function corpusFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.endsWith(" 2") || entry.name === "node_modules") continue;
      corpusFiles(full, out);
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      entry.name !== "routeTree.gen.ts"
    ) {
      out.push(full);
    }
  }
  return out;
}

describe("route inventory - every public route has an inbound link", () => {
  const files = publicRouteFiles();

  test("the inventory itself is non-trivial (the routes dir moved or emptied?)", () => {
    expect(files.length).toBeGreaterThan(5);
    // Canary peers named in the sweep order: these must exist as public routes.
    const paths = files.map(routePath);
    for (const p of ["/proof", "/security", "/privacy", "/subprocessors", "/demo"]) {
      expect(paths).toContain(p);
    }
  });

  const corpus = corpusFiles(SRC).map((f) => ({ file: f, content: readFileSync(f, "utf8") }));

  for (const file of files) {
    const path = routePath(file);
    if (EXEMPT[path]) continue;
    test(`${path} (${file}) is linked from at least one other src file`, () => {
      const own = join(ROUTES_DIR, file);
      const ns = needles(path);
      const hit = corpus.some((c) => c.file !== own && ns.some((n) => containsRef(c.content, n)));
      expect(hit).toBe(true);
    });
  }

  test("exempt routes still exist (delete the exemption when the route goes)", () => {
    const paths = files.map(routePath);
    for (const p of Object.keys(EXEMPT)) expect(paths).toContain(p);
  });
});

/* ===================================================================
 * THE AUTHENTICATED HALF, added 2026-07-30 after the Artifacts incident.
 *
 * The test above has covered PUBLIC routes since the /trust incident. The
 * authenticated app had no equivalent, and the cost of that came due all at
 * once: a reachability audit on 2026-07-30 found /artifacts, a 575-line fully
 * redesigned surface, reachable from nothing but the retired Mission Control
 * chrome. Nobody could get to it. The founder assumed it had never been built.
 *
 * It was the ninth instance that day of one pattern: a capability finished and
 * given no door. The strip nothing published. Build, whose route was a
 * redirect to a different axis. The agent the header could not name. A theme
 * system with no switch. A chevron with no menu. Sign-out reachable from one
 * retired component. Voice wired into a hook the pane never rendered. A
 * lineage sheet never mounted. And this.
 *
 * Server logic gets built because it is the interesting part and it is
 * testable. The four lines that put it on screen get deferred because they
 * feel trivial. So the repo accumulates working engines with no ignition, and
 * every one of them reads as "not built" to anyone actually using the product.
 *
 * THE RULE THAT MAKES THIS TEST WORK, and without it the test is theatre: a
 * link from a RETIRED surface does not count. /artifacts WAS linked, from
 * MissionShell.tsx, and a naive inbound-link check would have passed it every
 * day it was unreachable. Dead chrome linking a live surface is worse than no
 * link at all, because it looks like coverage.
 * =================================================================== */

/** Files whose links do NOT count: the shell the rebuild replaced and never
 *  ported. Add here when a surface is retired, and the test will immediately
 *  tell you what it was the last door to. */
const RETIRED_LINKERS = [
  "components/mission/MissionShell.tsx",
  "components/mission/MissionShellView.tsx",
  "components/mission/RoomChrome.tsx",
  "components/supaprod/CommandPalette.tsx",
];

/** Authenticated surfaces that legitimately have no door, each with a reason.
 *  Add ONLY with a reason; an empty reason should fail review. */
const AUTH_EXEMPT: Record<string, string> = {
  "/start":
    "parked Phase-5 alternative to /onboarding, unlinked on purpose until the merge at Gate 2",
  "/onboarding": "entered by the authenticated gate on first run, not by a link",
  "/m": "Mission Control, the one unported surface; kept alive as a URL while retirement is planned",
  "/meridian":
    "the Meridian design gallery: a workbench, not a product surface. It renders every component in both grounds so a design is looked at before it ships, which is the failure this repo has already paid for twice (two designs rejected in one evening, both reasoned from tokens and neither ever rendered). It is deliberately absent from the rail: the spine already carries more doors than it should, and a component catalogue is not a station. Reached by typing the URL. Delete this exemption if it ever gets a door.",
};

/** A redirect stub is not a surface. It has no content to be orphaned from. */
function isRedirectStub(content: string): boolean {
  return content.includes("throw redirect") && content.split("\n").length < 45;
}

function authRouteFiles(): string[] {
  return readdirSync(ROUTES_DIR).filter((f) => {
    if (!f.startsWith("_authenticated.") || !f.endsWith(".tsx")) return false;
    if (f === "_authenticated.tsx") return false;
    // Param routes are reached by construction, never by a literal string.
    if (f.includes("$")) return false;
    return true;
  });
}

/** "_authenticated.plan.index.tsx" -> "/plan"; "_authenticated.brain.tsx" -> "/brain". */
function authRoutePath(file: string): string {
  return (
    "/" +
    file
      .replace(/^_authenticated\./, "")
      .replace(/\.tsx$/, "")
      .replace(/\.index$/, "")
      .split(".")
      .join("/")
  );
}

describe("route inventory - every authenticated surface has a LIVE door", () => {
  const files = authRouteFiles();
  const corpus = corpusFiles(SRC).map((f) => ({ file: f, content: readFileSync(f, "utf8") }));

  test("the inventory itself is non-trivial", () => {
    const paths = files.map(authRoutePath);
    expect(files.length).toBeGreaterThan(20);
    for (const p of ["/today", "/runs", "/brain", "/crew", "/settings"]) {
      expect(paths).toContain(p);
    }
  });

  for (const file of files) {
    const path = authRoutePath(file);
    if (AUTH_EXEMPT[path]) continue;
    const own = join(ROUTES_DIR, file);
    const content = readFileSync(own, "utf8");
    if (isRedirectStub(content)) continue;

    test(`${path} is reachable from a surface that is not retired`, () => {
      const ns = needles(path);
      const hits = corpus.filter(
        (c) => c.file !== own && ns.some((n) => containsRef(c.content, n)),
      );
      const live = hits.filter((c) => !RETIRED_LINKERS.some((r) => c.file.endsWith(r)));

      // The message carries the diagnosis, because the failure mode this
      // catches is subtle: "it IS linked" is the wrong conclusion when the
      // only linker is a surface nobody can open.
      const detail =
        hits.length > 0 && live.length === 0
          ? `${path} is linked ONLY from retired chrome (${hits
              .map((h) => h.file.split("/src/")[1])
              .join(
                ", ",
              )}). That is how /artifacts went orphaned: a link from a dead surface looks like coverage and is not.`
          : `${path} has no inbound link at all. Give it a door, or add it to AUTH_EXEMPT with a reason.`;

      if (live.length === 0) throw new Error(detail);
      expect(live.length).toBeGreaterThan(0);
    });
  }
});
