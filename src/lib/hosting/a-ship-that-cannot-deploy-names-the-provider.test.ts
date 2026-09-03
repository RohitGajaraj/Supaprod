/**
 * The first honest Ship failed at preview on 2026-09-03 and the founder had to
 * ask what to set. Every guard here is about that sentence being on the screen.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import {
  shipStopFrom,
  shipStopLine,
  shipStopWaitsOnAPerson,
  PREVIEW_HOST_VARS,
} from "./a-ship-that-cannot-deploy-names-the-provider";

describe("a Ship that cannot deploy names the provider", () => {
  it("names the variable and the place, and ends on the action", () => {
    const stop = shipStopFrom("DENO_DEPLOY_TOKEN is not set");
    expect(stop.kind).toBe("missing-provider");
    expect(shipStopLine(stop)).toBe(
      "Ship has no preview host. Set DENO_DEPLOY_TOKEN and DENO_DEPLOY_ORG on the Lovable project, then press Try again.",
    );
  });

  it("matches the variable NAME, not the sentence around it", () => {
    // deno-deploy.server.ts:61 throws one wording today. Coupling to that string
    // breaks the moment somebody rewords the throw; the name is the stable part.
    for (const said of [
      "DENO_DEPLOY_TOKEN is not set",
      "Error: missing DENO_DEPLOY_TOKEN in environment",
      "deploy failed: DENO_DEPLOY_ORG not configured",
      "DENO_DEPLOY_ACCESS_TOKEN absent",
    ]) {
      expect(shipStopFrom(said).kind).toBe("missing-provider");
    }
  });

  it("does not claim a missing token for an unrelated failure", () => {
    const stop = shipStopFrom("build failed: main.ts not found");
    expect(stop.kind).toBe("other");
    expect(shipStopLine(stop)).toContain("build failed: main.ts not found");
    expect(shipStopLine(stop)).not.toContain("DENO_DEPLOY");
  });

  it("keeps 'no reason recorded' as its own answer", () => {
    // The one failed deployment in production carries failure_reason NULL. It
    // predates P-39 item 3. Calling that a missing token would send the founder
    // to set a secret that may already be set.
    for (const empty of [null, undefined, "", "   "]) {
      expect(shipStopFrom(empty).kind).toBe("unknown");
    }
    const line = shipStopLine(shipStopFrom(null));
    expect(line).not.toContain("DENO_DEPLOY");
    expect(line).toContain("nothing on the attempt says why");
    // And never "the host said:" with nothing after it.
    expect(line).not.toContain("said:");
  });

  it("waits on a PERSON only when a person can act", () => {
    // `produced-nothing` reads "the run worked and its output went nowhere",
    // which points at the crew. A missing secret points at a person.
    expect(shipStopWaitsOnAPerson(shipStopFrom("DENO_DEPLOY_TOKEN is not set"))).toBe(true);
    expect(shipStopWaitsOnAPerson(shipStopFrom("build failed"))).toBe(false);
    expect(shipStopWaitsOnAPerson(shipStopFrom(null))).toBe(false);
  });

  it("names both variables, because one without the other is a second failure", () => {
    expect(PREVIEW_HOST_VARS).toEqual(["DENO_DEPLOY_TOKEN", "DENO_DEPLOY_ORG"]);
  });

  it("hands the settings row a boolean and never the value", () => {
    const src = readFileSync("src/lib/deployments.functions.ts", "utf8");
    const fn = src.slice(src.indexOf("export const previewHostConfigured"));
    expect(fn).toContain("configured: denoDeployConfigured()");
    // The token and the org value must not travel over the wire.
    expect(fn).not.toContain("process.env");
    expect(fn).not.toContain("denoToken");
    expect(fn).not.toContain("denoOrgSlug");
    expect(fn).toContain("requireSupabaseAuth");
  });
});

describe("the two surfaces read one source", () => {
  const code = (src: string): string =>
    src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const RUN = code(readFileSync("src/components/track/TrackRun.tsx", "utf8"));
  const WAYOUT = code(readFileSync("src/components/track/way-out.ts", "utf8"));
  const CONN = code(
    readFileSync("src/components/connections/AccountConnectionsSection.tsx", "utf8"),
  );
  const DEPLOY = code(readFileSync("src/lib/deployments.functions.ts", "utf8"));

  it("asks why Ship stopped only at Ship, and only while held", () => {
    // Everywhere else the read has no question to answer, and firing it would
    // put a query on every run screen to be told null.
    expect(RUN).toContain('enabled: track?.station === "ship" && Boolean(track?.holdReason)');
  });

  it("does not treat a pending or failed read as 'nothing stopped it'", () => {
    expect(RUN).toContain("shipStopped.isSuccess");
    // Proves the stripper left the component behind.
    expect(RUN).toContain("const holdWayOut = wayOut(");
  });

  it("overrides the sentence and never the control", () => {
    // way-out.ts's own header: the dead end was the absent next step, not the
    // button. A person who just set the secret comes back wanting Try again.
    expect(WAYOUT).toContain("if (shipStop?.actionable)");
    expect(WAYOUT).toContain("onThisScreen: true");
    expect(WAYOUT).not.toContain("hideRetry");
  });

  it("reads deployments, not the member row that has never existed", () => {
    // F-36: ship has never filed a `deployment` track member -- 0 rows in
    // 1,516 -- so reading the reason there ships a hold card that is right in
    // the code and blank on every real track.
    const fn = DEPLOY.slice(DEPLOY.indexOf("export const whyShipStopped"));
    expect(fn).toContain('.from("deployments")');
    expect(fn).not.toContain("spine_track_members");
  });

  it("stops showing the sentence once a later deploy succeeded", () => {
    // A hold, not a scar: the newest attempt decides, in one ordered read, so
    // two queries cannot straddle a deploy that lands between them.
    const fn = DEPLOY.slice(DEPLOY.indexOf("export const whyShipStopped"));
    expect(fn).toContain('.in("status", ["failure", "success"])');
    expect(fn).toContain('newest.status !== "failure"');
  });

  it("gives both surfaces the same variables from one place", () => {
    // The settings row and the hold card must not name two different things.
    expect(CONN).toContain("previewHost.data?.vars");
    expect(DEPLOY).toContain("PREVIEW_HOST_VARS");
  });
});
