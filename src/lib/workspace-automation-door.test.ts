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

  it("the door is mounted on a route, not only defined in a component", () => {
    // A component nobody mounts is the same defect one file along. This asks for
    // an actual import from something under routes/.
    const mounted = SURFACES.filter(
      (s) => s.file.includes("/routes/") && s.code.includes("AutomationBoundary"),
    );
    expect(mounted.length).toBeGreaterThan(0);
  });

  it("offers every flag in the catalogue, so none can go dark unnoticed", () => {
    // Rendered by iterating AUTOMATION_FLAGS rather than by four hand-written
    // rows, so a fifth flag added to the catalogue gets a switch for free. A
    // hand-written list is how the mint-path scope list fell a ruling behind.
    const door = SURFACES.find((s) => s.file.endsWith("AutomationBoundary.tsx"));
    expect(door).toBeTruthy();
    expect(door!.code).toContain("AUTOMATION_FLAGS.map(");
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

describe("the gate this closes was invisible in the job ledger", () => {
  it("both sweeps behind the scout flag still return before opening a job run", () => {
    // NOT FIXED HERE, and pinned so the next person knows the shape and so that
    // moving the check inside the ledger wrapper is a deliberate change rather
    // than an accident. Both ticks test the platform key and return BEFORE they
    // call the ledger wrapper, so a dormant tick records no run at all and its
    // honest explanation goes into a body only pg_cron reads. Nothing in
    // `job_runs` distinguishes "off on purpose" from "never scheduled". The
    // surface above is what makes the state visible today; the ledger still
    // cannot say it.
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
      expect(guard, `${tick}: the guard runs before the ledger opens`).toBeLessThan(wrapperCall);
    }
  });
});
