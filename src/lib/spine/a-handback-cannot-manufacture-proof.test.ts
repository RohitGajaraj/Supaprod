/**
 * A HANDBACK CANNOT MANUFACTURE PROOF (gaps #6 and #12, 2026-08-26).
 *
 * ── THE MOST EXPENSIVE THING THIS FUNCTION COULD DO ────────────────────────
 * `release.publish` requires a `deployments` row with `status = 'success'`, and
 * R-27 gates the production deploy on **proof rather than a click**. F-36 is the
 * standing finding that the loop cannot produce that row.
 *
 * `submitStationByHand` writes a `deployments` row. **If it wrote `success`, a
 * person's pasted URL would become the evidence R-27 exists to demand** — and it
 * would look like a feature while doing it. Every value in that table today is
 * `success`, so the wrong constant was one keystroke away.
 *
 * It writes `claimed`, which cannot satisfy `release.publish`. That is the
 * design, not a shortfall: F-36's missing member row gets written, the proof does
 * not.
 *
 * The same rule one table over: a handed-back PR is `pr_open`, never `merged`.
 * We were told a pull request exists. Nobody checked whether it landed, and
 * `merged` is what promotion reads.
 *
 * ── AND THE TRACE GOES FIRST ───────────────────────────────────────────────
 * `recordTrackDrive(via: "press")` runs before any write can fail. R-18 forbids
 * counting a run a person touched as unattended, and F-79 caught a false
 * acceptance that survived precisely because a human act left no trace. If the
 * writes below it fail, the record still says somebody reached in — the safe
 * direction to be wrong in.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");
const FN = SRC.slice(SRC.indexOf("export const submitStationByHand"));

describe("it never writes the row release.publish reads as proof", () => {
  it("the deployment status is 'claimed', not 'success'", () => {
    expect(FN).toContain('status: "claimed"');
    // The whole point, stated as an assertion: nowhere in this function.
    expect(FN).not.toContain('status: "success"');
  });

  it("the handed-back PR is pr_open, never merged", () => {
    expect(FN).toContain('status: "pr_open"');
    expect(FN).not.toContain('status: "merged"');
  });

  it("it is attributed as a handback rather than a machine trigger", () => {
    // `triggered_by` already carries ci-poll-tick | promote | release, all of
    // them machine. A person's claim must not borrow one of those.
    expect(FN).toContain('triggered_by: "handback"');
  });
});

describe("the track loses its unattended claim, before anything else happens", () => {
  it("records the press", () => {
    expect(FN).toContain('via: "press"');
  });

  it("and records it BEFORE the artifact writes", () => {
    const press = FN.indexOf('via: "press"');
    const deploymentWrite = FN.indexOf('from("deployments"');
    const changesetWrite = FN.indexOf('from("studio_changesets"');
    expect(press).toBeGreaterThan(-1);
    expect(press).toBeLessThan(deploymentWrite);
    expect(press).toBeLessThan(changesetWrite);
  });

  it("and before the hold is cleared, so a failed write cannot leave a silent release", () => {
    const press = FN.indexOf('via: "press"');
    const clear = FN.indexOf("last_hold: null");
    expect(press).toBeLessThan(clear);
  });
});

describe("it refuses what a link cannot stand in for", () => {
  it("only Build and Ship accept a pasted link", () => {
    expect(FN).toContain('station !== "build" && station !== "ship"');
  });

  it("and the refusal says what to do instead, rather than filing an empty row", () => {
    // The other five produce a spec, a decision, a prototype — things a URL is
    // not. Accepting one would put an empty artifact where real work belongs.
    expect(FN).toContain("produces something a link cannot");
  });
});

describe("it writes only columns that exist, which I got wrong first", () => {
  /*
   * THE DEFECT I SHIPPED WHILE WRITING THIS FILE.
   *
   * My first version inserted `workspace_id` and `user_id` into
   * `spine_track_members`. That table has exactly five columns —
   * `track_id, artifact_kind, artifact_id, station, created_at` — and neither of
   * those is among them. **`as never` hid it from the typechecker**, and the
   * insert had no error check, so it would have failed SILENTLY: the deployment
   * row written, the member row refused, the station still looking empty and
   * nothing anywhere saying why.
   *
   * That is F-76 exactly, committed by the person who spent the morning fixing
   * F-76, in the same commit as a test about not inventing columns. The lesson
   * is not "be careful" — it is that `as never` turns a compile error into a
   * runtime one, so any table it touches needs a written-down column list.
   */
  /*
   * A PRECISE NEGATIVE, NOT A KEY PARSER.
   *
   * My first guard extracted every `key:` from the insert and checked it against
   * a column list. It was unreliable in both directions: it captured `id` from
   * the type annotation `(dep as { id: string })` and missed `station`, which is
   * shorthand. **A guard I cannot trust is worse than none** — it fails on drift
   * that is not there and gets believed — which is the same reason I declined to
   * write the READ_ONLY_TOOLS drift guard an hour earlier.
   *
   * So it asserts the exact thing that went wrong instead: the two phantom
   * columns are not in either insert.
   */
  const PHANTOM = ["workspace_id", "user_id"];

  it("the spine_track_members inserts carry neither phantom column", () => {
    const inserts = [
      ...FN.matchAll(/spine_track_members[\s\S]{0,200}?\.insert\(\{([\s\S]*?)\} as never\)/g),
    ];
    expect(inserts.length, "expected both member inserts to be found").toBe(2);
    for (const m of inserts) {
      for (const bad of PHANTOM) {
        expect(m[1], `spine_track_members has no column "${bad}"`).not.toContain(bad);
      }
    }
  });

  it("and a refused member row is reported, never swallowed", () => {
    // An orphaned artifact with no member row is a station that looks empty for
    // a reason nobody can see.
    expect(FN).toContain("error: memberErr");
    expect(FN).toContain("could not be attached to this work");
  });
});
