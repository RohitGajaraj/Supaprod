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

/** Comments stripped, so a guard cannot match the prose explaining the fix
 *  (F-188). Module scope, because a later `describe` needs it too: it was
 *  declared INSIDE one describe and the block added below could not see it,
 *  which threw between tests and stopped the rest of the file running. */
const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

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

describe("try the preview again is a real action (P-68b)", () => {
  const DEPLOY = code(readFileSync("src/lib/deployments.functions.ts", "utf8"));
  const RUN2 = code(readFileSync("src/components/track/TrackRun.tsx", "utf8"));

  /** The function's body, bounded at both ends (F-191). */
  const FN = (() => {
    const from = DEPLOY.indexOf("export const retryPreviewNow");
    const to = DEPLOY.indexOf("\nexport const ", from + 1);
    return DEPLOY.slice(from, to === -1 ? DEPLOY.length : to);
  })();

  it("exists at all, so the sentence's own instruction is not empty", () => {
    // P-68's line ends "then press Try again" and there was nothing to press.
    expect(FN.length).toBeGreaterThan(200);
    expect(RUN2).toContain("retryPreview.mutate()");
    expect(RUN2).toContain("Try the preview again");
  });

  it("ignores the sweep's retry window, and nothing else", () => {
    // The window stops an automatic loop paying for a deploy every two minutes.
    // None of that applies to a person who has read the reason and acted on it.
    expect(FN).not.toContain("HOSTED_PREVIEW_RETRY_WINDOW_MS");
    expect(FN).not.toContain("HOSTED_PREVIEW_RETRY_BACKOFF_MS");
    // Same row, same slot, so a success is a preview /ship and R-27 can see.
    expect(FN).toContain('onConflict: "changeset_id,environment,commit_sha"');
    expect(FN).toContain('environment: "preview"');
  });

  it("writes a reasoned row EVEN WHEN THE ATTEMPT THROWS", () => {
    // resolveGitHub, collectRepoFiles and deployChangesetApp each throw before
    // any row exists. That is exactly how the 06:44 attempt left a NULL reason.
    expect(FN).toContain("} catch (e) {");
    expect(FN).toContain("The attempt failed before it reached the host.");
    // The upsert is OUTSIDE the try, so no failure path skips it.
    expect(FN.indexOf("} catch (e) {")).toBeLessThan(FN.indexOf('.from("deployments").upsert'));
  });

  it("never writes a failure with an empty reason", () => {
    expect(FN).toContain("The host refused the deploy and gave no reason for it.");
    expect(FN).toContain("failure_reason: ok ? null : reason");
  });

  it("says 'ran and could not be recorded' rather than 'failed'", () => {
    // The deploy may genuinely have gone out. Those are different facts.
    expect(FN).toContain("The attempt ran and could not be recorded");
  });

  it("marks the row as a person's, not the tick's", () => {
    expect(FN).toContain('triggered_by: "person"');
  });

  it("refreshes the sentence it just corrected", () => {
    expect(RUN2).toContain('queryKey: ["why-ship-stopped", trackId]');
  });
});

describe("the read reaches the row it is about (P-59c)", () => {
  const DEPLOY2 = code(readFileSync("src/lib/deployments.functions.ts", "utf8"));
  const RUN3 = code(readFileSync("src/components/track/TrackRun.tsx", "utf8"));

  /** Bounded at both ends (F-191). */
  const FN = (() => {
    const from = DEPLOY2.indexOf("export const whyShipStopped");
    const to = DEPLOY2.indexOf("\nexport const ", from + 1);
    expect(from).toBeGreaterThan(-1);
    return DEPLOY2.slice(from, to === -1 ? DEPLOY2.length : to);
  })();

  it("names the table that exists", () => {
    // It read `.from("changesets")`. There is no such table -- it is
    // `studio_changesets` -- so PostgREST answered 42P01, the read threw, and
    // the hold card fell back to the generic "This step ran but filed nothing"
    // while the record underneath lined up perfectly. tsc does not check a
    // PostgREST relation name; only a person reading the served surface does.
    expect(FN).toContain('.from("studio_changesets")');
    expect(FN).not.toContain('.from("changesets")');
  });

  it("bounds the deployment by nothing at all, so age cannot hide it", () => {
    // The one failure this product has is from the previous day. A card that
    // goes quiet once a failure is old tells a person their stuck run has no
    // reason when the reason is right there.
    expect(FN).not.toContain("interval");
    expect(FN).not.toContain('gte("created_at"');
  });

  it("answers 'did it fail' separately from 'why'", () => {
    // `failureReason: null` meant no failure AND a failure with no reason. Only
    // one of those is a stopped Ship.
    expect(FN).toContain("failed: false");
    expect(FN).toContain("failed: true");
    expect(RUN3).toContain("shipStopped.data.failed");
  });

  it("still says 'nothing on the attempt says why' for a reasonless failure", () => {
    expect(shipStopFrom(null).kind).toBe("unknown");
    expect(shipStopLine(shipStopFrom(null))).toContain("nothing on the attempt says why");
  });

  it("stands the station's own retry down while the preview is the blocker", () => {
    // "Let Ship try again" runs a station that cannot proceed without a preview,
    // spends an attempt, and returns here.
    /* `shipIsStopped` since the acceptance pass: "no failed deployment" is a
       true answer and not a stoppage, so it must not stand the retry down. */
    expect(RUN3).toContain("answerTheCall || callIsYours || shipIsStopped ? null : (");
  });
});

describe("the card says which branch fired (P-59c acceptance)", () => {
  const RUN5 = code(readFileSync("src/components/track/TrackRun.tsx", "utf8"));

  it("does not hang the retry on a way-out that says nothing", () => {
    /*
     * THE DEFECT A1 READ FIFTY MINUTES AFTER PUBLISH. The control rode on
     * `holdWayOut.next`, and `way-out.ts` returns null for `produced-nothing`
     * by design -- its own header lists that hold as one whose sentence already
     * ends with the action. So the Row was never rendered and the only control
     * that changes anything went with it, while every other signal (the station
     * retry standing down) said the state was read correctly.
     */
    const own = RUN5.indexOf("{shipStop ? (");
    const wayOut = RUN5.indexOf("{holdWayOut.next ? (");
    expect(own).toBeGreaterThan(-1);
    expect(wayOut).toBeGreaterThan(own);
  });

  it("has a sentence for every answer the read can give", () => {
    expect(shipStopLine({ kind: "unread", said: "boom" })).toContain("could not be read");
    expect(shipStopLine({ kind: "none" })).toContain("No preview attempt has failed");
    expect(shipStopLine(shipStopFrom(null))).toContain("nothing on the attempt says why");
    expect(shipStopLine(shipStopFrom("DENO_DEPLOY_TOKEN is not set"))).toContain(
      "DENO_DEPLOY_TOKEN",
    );
    expect(shipStopLine(shipStopFrom("build failed"))).toContain("build failed");
  });

  it("separates a real stop from 'nothing failed'", () => {
    // "none" is a true answer and not a stoppage: it must not take the screen
    // over or stand the station's own retry down.
    expect(RUN5).toContain('shipStop.kind !== "none"');
    expect(RUN5).toContain("answerTheCall || callIsYours || shipIsStopped ? null : (");
  });

  it("names a failed read as a failed read, never as an absence", () => {
    expect(RUN5).toContain('kind: "unread"');
    expect(RUN5).toContain("shipStopped.isError");
  });
});
