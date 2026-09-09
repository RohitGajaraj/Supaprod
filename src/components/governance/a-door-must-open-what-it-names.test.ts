/**
 * ── "OPEN THE MISSION" OPENED THE HOME PAGE ───────────────────────────────
 *
 * WALKED FROM /outcomes INTO A DECISION, 2026-09-10. The detail offered a
 * control reading **"Open the mission"**, and it navigated to `/start`.
 *
 * `/runs/$missionId` was deleted (P-14, R-35) and an approval carries a
 * `mission_id` rather than a track id, so a previous pass made it fall back to
 * Start "rather than a dead link". **That chose the wrong failure.** A dead
 * link tells a person it is broken. A link to the home page silently loses
 * their place and looks like it worked: they press a control that names a
 * destination, arrive somewhere else, and have to find their way back to the
 * queue they were working through.
 *
 * ── THE MEASUREMENT THAT DECIDED IT, TAKEN BEFORE CUTTING ─────────────────
 *
 *   pending approvals ............................ 21
 *   carrying a mission_id (so the control drew) ... 7
 *   resolvable to a track through `agent_runs` .... 0
 *
 * Across every status it is 15 of 176. The join this control was built for
 * does not exist for a single call a person can act on today, and rebuilding
 * it would resolve one approval in twelve.
 *
 * ── THE RULE, WHICH IS WIDER THAN THIS CONTROL ────────────────────────────
 * **A door must open what it names.** Where it cannot, the honest move is to
 * cut it, not to point it somewhere plausible: a control that lands a person
 * on a page they did not ask for spends their trust twice, once on the press
 * and once on the way back.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(import.meta.dir, "ApprovalsPanel.tsx"), "utf8");
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("a door must open what it names", () => {
  it("offers no control that promises a mission it cannot reach", () => {
    expect({ promises: CODE.includes("Open the mission") }).toEqual({ promises: false });
  });

  it("does not send a person to the home page from inside a decision", () => {
    /*
     * The specific wrong failure. `SIGNED_IN_HOME` is the right destination
     * for a sign-in redirect and the wrong one for a control on a queue a
     * person is working through.
     */
    expect({ bounces: CODE.includes("SIGNED_IN_HOME") }).toEqual({ bounces: false });
  });

  it("still offers the answers, which are the panel's actual job", () => {
    /*
     * THE MIRROR. Both assertions above pass by finding nothing, so a refactor
     * that emptied this file would read as an improvement. The panel exists to
     * put a decision in front of a person; that must survive.
     */
    expect(CODE).toContain("Approve, and it runs");
    expect(CODE).toContain("Decline, and nothing runs");
    expect(CODE).toContain("Give it 24 more hours");
  });
});
