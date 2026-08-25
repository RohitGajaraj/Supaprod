/**
 * The automation writers have a door, and an armed flag that cannot run says so.
 *
 * WHY THIS FILE EXISTS. `auto_derive_enabled` shipped with no writer anywhere in
 * the repo for six weeks, and two cron jobs read it as a filter, so both selected
 * zero rows on every run while reporting healthy. The repair built the writers and
 * a guard test that every gating flag must have one.
 *
 * THE REPAIR STOPPED ONE LAYER SHORT. `getWorkspaceAutomation` and
 * `setWorkspaceAutomation` were correct, RLS-enforced, zero-row-checked, tested,
 * and called by NOTHING in `src/components` or `src/routes`. So the flag went from
 * "no code can write it" to "no person can reach the code that writes it", and
 * arming it still required SQL. The guard asked whether a writer EXISTS. It did
 * not ask whether anyone can press it.
 *
 * That is the audit's own section 9 pattern applied to the audit's own fix, which
 * is why the guard below is about reachability from a SURFACE rather than about
 * the existence of a function.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  AUTOMATION_FLAGS,
  AUTOMATION_PLATFORM_KEYS,
  automationRunState,
} from "./workspace-automation";

const SRC = join(import.meta.dir, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/** Every non-test source file under components and routes, read once. */
const SURFACES = [...walk(join(SRC, "components")), ...walk(join(SRC, "routes"))].map((f) => ({
  file: f,
  code: readFileSync(f, "utf8"),
}));

describe("a person can reach the switches", () => {
  it("something on a surface reads the flags", () => {
    const readers = SURFACES.filter((s) => s.code.includes("getWorkspaceAutomation"));
    expect(readers.length).toBeGreaterThan(0);
  });

  it("something on a surface writes them", () => {
    // The half that matters. A read-only door would render four switches that
    // cannot move, which is worse than no door because it looks like a control.
    const writers = SURFACES.filter((s) => s.code.includes("setWorkspaceAutomation"));
    expect(writers.length).toBeGreaterThan(0);
  });

  it("the door is mounted where a route renders it", () => {
    // A component nobody mounts is the same defect one file along. The mount
    // used to have to sit in a routes/ file directly; since the item 22 fold
    // (2026-08-25, retargeted by LANE 1 -- MAIN owns this file) the switch
    // lives two links down a chain that a route still renders:
    // engine-room route -> SafetyRoom -> BoundaryControls -> AutomationBoundary.
    // So the guard walks the chain link by link, with the same file-scan
    // mechanism as the rest of this file.
    const importer = SURFACES.find(
      (s) => s.code.includes("AutomationBoundary") && s.file.endsWith("BoundaryControls.tsx"),
    );
    expect(importer).toBeTruthy();
    const room = SURFACES.find(
      (s) =>
        s.file.includes(join(SRC, "components", "engine-room")) &&
        s.code.includes("BoundaryControls"),
    );
    expect(room).toBeTruthy();
    const route = SURFACES.find(
      (s) => s.file.includes("/routes/") && s.code.includes("engine-room"),
    );
    expect(route).toBeTruthy();
  });

  it("offers every flag in the catalogue, so none can go dark unnoticed", () => {
    // Rendered by ITERATING AUTOMATION_FLAGS rather than by four hand-written
    // rows, so a fifth flag added to the catalogue gets a switch for free. A
    // hand-written list is how the mint-path scope list fell a ruling behind.
    //
    // The assertion was loosened from `AUTOMATION_FLAGS.map(` on 2026-08-15, when
    // the component gained an `only` filter so Discover could render the one flag
    // it owns. That is a legitimate change and it broke a test about a different
    // property, which is the same brittleness I loosened a select-column guard for
    // earlier today. What matters is that the catalogue is the source, not the
    // exact expression that walks it.
    const door = SURFACES.find((s) => s.file.endsWith("AutomationBoundary.tsx"));
    expect(door).toBeTruthy();
    expect(door!.code).toContain("AUTOMATION_FLAGS.filter(");
    expect(door!.code).toContain(".map((flag) =>");
  });

  it("the governance mount renders ALL of them, never a subset", () => {
    // THE PROPERTY THE FILTER PUT AT RISK. A station may render one flag, but the
    // governance page is the one place every flag has to appear, or a flag can go
    // dark with nowhere to notice it. The mount must pass no `only`.
    // SUBJECT MOVED 2026-08-25 (item 22 fold; retargeted by LANE 1 -- MAIN owns
    // this file): the mount left `_authenticated.boundary.tsx` for
    // `governance/BoundaryControls.tsx`, which the Safety room renders.
    const page = SURFACES.find((s) => s.file.endsWith("BoundaryControls.tsx"));
    expect(page).toBeTruthy();
    const mount = page!.code.slice(page!.code.indexOf("<AutomationBoundary"));
    const tag = mount.slice(0, mount.indexOf("/>") + 2);
    expect(tag).toContain("workspaceId=");
    expect(tag, "the governance mount must not filter the catalogue").not.toContain("only=");
  });

  it("states the spend before the switch, not after it", () => {
    // A person deciding whether to arm something needs to know it costs money
    // before they press. Two of the four flags spend on a schedule.
    const door = SURFACES.find((s) => s.file.endsWith("AutomationBoundary.tsx"))!;
    expect(door.code).toContain("flag.costsModelCalls");
    expect(AUTOMATION_FLAGS.filter((f) => f.costsModelCalls).length).toBeGreaterThan(0);
  });
});

describe("armed and idle is a state, and it is said out loud", () => {
  const scout = AUTOMATION_FLAGS.find((f) => f.column === "auto_scout_enabled")!;

  it("a flag whose platform is unconfigured is grounded, not on", () => {
    // The switch reads on and the work cannot happen. Reporting that as "on" is
    // answering the question wrongly, which is worse than not answering.
    expect(automationRunState({ flag: scout, enabled: true, platformReady: false })).toBe(
      "grounded",
    );
    expect(automationRunState({ flag: scout, enabled: true, platformReady: true })).toBe("on");
    expect(automationRunState({ flag: scout, enabled: false, platformReady: false })).toBe("off");
  });

  it("a flag with no platform dependency is never grounded", () => {
    for (const flag of AUTOMATION_FLAGS.filter((f) => !f.requiresPlatform)) {
      expect(automationRunState({ flag, enabled: true, platformReady: false })).toBe("on");
    }
  });

  it("an unchecked platform reads as ready, because a label must not invent an outage", () => {
    // The opposite direction from how this codebase treats an unknown elsewhere,
    // and deliberate: this feeds a sentence, not a gate. A client that cannot
    // read a server env var would otherwise show every flag as grounded.
    expect(automationRunState({ flag: scout, enabled: true, platformReady: null })).toBe("on");
    expect(automationRunState({ flag: scout, enabled: true })).toBe("on");
  });

  it("names the missing capability in words a person can act on", () => {
    // Never the variable name. The person reading this cannot set an env var, so
    // telling them what it is called is not help.
    expect(scout.requiresPlatform).toBeTruthy();
    const missing = scout.requiresPlatform!.missing;
    expect(missing).not.toContain("FIRECRAWL");
    expect(missing).not.toContain("_KEY");
    expect(missing.length).toBeGreaterThan(30);
  });

  it("declares a platform key the server can actually probe", () => {
    expect(AUTOMATION_PLATFORM_KEYS).toContain("FIRECRAWL_API_KEY");
    // And the probe reports booleans only. Shipping the value to a client would
    // hand a workspace member a platform secret.
    const impl = readFileSync(join(SRC, "lib", "workspace-automation.functions.ts"), "utf8");
    expect(impl).toContain("Boolean(process.env[key])");
    expect(impl).toContain("platformReadiness()");
  });

  it("returns the platform fact alongside the switches, never on its own", () => {
    // A caller cannot render "armed and idle" from the switch alone, so the pair
    // travels together and one cannot be fetched without the other.
    const impl = readFileSync(join(SRC, "lib", "workspace-automation.functions.ts"), "utf8");
    expect(impl).toContain("return { state, platform: platformReadiness() };");
  });
});

describe("a dormant sweep records that it is dormant", () => {
  it("both sweeps check the platform key INSIDE their job run, not before it", () => {
    // FIXED 2026-08-15, and this test was inverted to pin the fix rather than
    // the defect.
    //
    // Both ticks used to test the platform key and RETURN before calling the
    // ledger wrapper, so a dormant sweep wrote no `job_runs` row at all, on any
    // tick, ever, and its honest explanation went into a JSON body only pg_cron
    // reads. That left the ledger unable to tell "switched off on purpose" from
    // "the cron entry is gone": both are silence. `EXPECTED_JOBS` lists these two
    // with four-hour and twenty-six-hour staleness windows, so the one state the
    // ledger could never report was exactly the one it was watching for.
    //
    // The dormant tick is now recorded as a healthy run, because it is one: it
    // fired, decided correctly that there was nothing it could do, and said so.
    // What the row buys is proof the schedule is alive.
    //
    // Compared on the GUARD and the WRAPPER CALL, not on the first mention of
    // either: the import sits at the top of the file and a header comment names
    // the key, so a naive indexOf compares a comment against an import and
    // answers backwards. My first version of this test did exactly that.
    for (const tick of ["scout-tick.ts", "researcher-tick.ts"]) {
      const code = readFileSync(join(SRC, "routes", "api", "public", "hooks", tick), "utf8");
      const guard = code.indexOf("if (!process.env.FIRECRAWL_API_KEY)");
      const wrapperCall = code.search(/return withJobRun(Http)?\(/);
      expect(guard, `${tick} should still carry the activation guard`).toBeGreaterThan(-1);
      expect(wrapperCall, `${tick} should still open a job run`).toBeGreaterThan(-1);
      expect(
        guard,
        `${tick}: the guard must run INSIDE the job run, so a dormant tick still records one`,
      ).toBeGreaterThan(wrapperCall);
    }
  });

  it("still answers 200 with a named reason, so pg_cron sees no failure", () => {
    // A dormant tick is not an error and must not be scored as one. The response
    // stays exactly what it was; only where it is produced from has moved.
    for (const tick of ["scout-tick.ts", "researcher-tick.ts"]) {
      const code = readFileSync(join(SRC, "routes", "api", "public", "hooks", tick), "utf8");
      expect(code).toContain("skipped: true");
      expect(code).toMatch(/reason: "(scout dormant, no firecrawl key|FIRECRAWL_API_KEY not set)"/);
    }
  });
});
