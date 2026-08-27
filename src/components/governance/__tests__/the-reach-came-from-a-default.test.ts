/**
 * THE BOUNDARY TOLD A PERSON THEIR AGENTS HAD EARNED IT. THEY HAD NOT.
 *
 * U-093 made the screen count what actually runs: 68 of 74 tools go without
 * asking, because `resolveApprovalMode` turns every `confirm` tool into `auto`
 * on a trusted arc. It then explained WHY in the wrong words -- "because your
 * agents have earned the trust that clears them".
 *
 * MEASURED ON THE LIVE DATABASE, 2026-08-27. `agent_autonomy` holds 93 rows,
 * every one of them `trusted`. 92 have `set_at` equal to `created_at`, so they
 * were never promoted after creation; exactly ONE was. And the bootstrap in
 * `20260708150000_founder_autonomy_defaults.sql` inserts
 *
 *     INSERT INTO public.agent_autonomy (user_id, agent_id, arc)
 *     VALUES (p_user_id, p_agent_id, 'trusted')
 *
 * where every earlier migration inserted `observing`. That is founder ruling
 * SW-7, autonomous by default, and it means the reach came from a DEFAULT
 * nobody chose rather than from a record anything proved. Only 2 trust
 * graduations have ever been approved, both on 2026-07-09.
 *
 * "Earned" is the reassuring reading, and it is the one that stops a person
 * looking at the dial they could actually move.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";

const SURFACES = [
  "src/components/governance/BoundaryControls.tsx",
  "src/components/governance/BoundaryStatement.tsx",
];

/** Prose only: the comment explaining why "earned" was wrong has to say it. */
function prose(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

describe("the reach came from a default", () => {
  it("no boundary surface explains autonomy as something the agents earned", () => {
    for (const path of SURFACES) {
      const said = prose(readFileSync(path, "utf8")).toLowerCase();
      expect(said, `${path} still says earned`).not.toContain("earned");
      expect(said, `${path} still says have earned`).not.toContain("have earned");
    }
  });

  it("and each names the default plus the control that changes it", () => {
    for (const path of SURFACES) {
      const said = prose(readFileSync(path, "utf8"));
      expect(said, `${path} does not name the default`).toContain(
        "starts out running alone except on the risky calls",
      );
      expect(said, `${path} does not name the door`).toContain("Crew");
    }
  });

  /**
   * The bootstrap is the whole finding, so it is asserted against the migration
   * rather than remembered. If a future migration returns the default to
   * `observing`, this fails and the copy above becomes wrong in the other
   * direction, which is exactly when someone should be made to reread it.
   */
  it("the seeded arc really is trusted, not observing", () => {
    const sql = readFileSync(
      "supabase/migrations/20260708150000_founder_autonomy_defaults.sql",
      "utf8",
    );
    const bootstrap = sql.slice(sql.indexOf("INSERT INTO public.agent_autonomy"));
    expect(bootstrap.slice(0, 200)).toContain("'trusted'");
  });
});
