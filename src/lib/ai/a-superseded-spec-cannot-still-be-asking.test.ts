/**
 * P-57 stopped the eleventh twin. The twenty-one already filed each still held a
 * design gate open, so the approvals heading P-56 had just made honest was
 * counting one spec twice.
 *
 * The number that decided the shape of the fix: NINE specs were already
 * superseded, properly, and still held a pending gate. So supersession has never
 * closed one, and a sweep would have left the tenth to reappear. It is an
 * invariant on the table, and the backfill goes through it rather than around.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";

const MIGRATIONS = readdirSync("supabase/migrations");
const M = readFileSync(
  "supabase/migrations/20260904020000_a_superseded_spec_cannot_still_be_asking.sql",
  "utf8",
);
const SHIP = readFileSync("src/components/ship/WhatShipped.tsx", "utf8");
/** F-188: a guard that reads a file matches the comment explaining the fix. */
const SQL = M.replace(/^\s*--.*$/gm, "");

describe("a superseded spec cannot still be asking", () => {
  it("is a trigger, so it holds for the path nobody remembered", () => {
    // Nine specs were superseded by something other than the path P-57 guarded.
    // A fix in one code path would not have covered them or the next writer.
    expect(M).toContain("create trigger close_design_gate_on_supersede");
    expect(M).toContain("after update of superseded_at on public.spine_track_members");
  });

  it("only ever moves a gate OUT of pending, never over a person's answer", () => {
    // Superseding a spec does not un-approve a design somebody signed off on,
    // and the Ship page reads that answer back as a receipt.
    expect(M).toContain("set design_gate_status = 'superseded'");
    expect(M).toContain("and design_gate_status = 'pending'");
  });

  it("adds a value rather than reusing 'rejected'", () => {
    // "Design rejected" on 21 specs no person looked at is a fabricated human
    // judgment, which is the defect WhatShipped's own header exists to prevent.
    expect(M).toContain("'superseded'");
    expect(M).toMatch(
      /check \(design_gate_status = any \(array\['pending','approved','rejected','superseded'\]\)\)/,
    );
  });

  it("leaves design_decided_at null, because nobody decided", () => {
    // It is the timestamp of a person's decision and the Ship page pairs it with
    // the status to render a sign-off. Nothing in the migration WRITES it --
    // checked against the SQL with comments stripped, because the comment that
    // explains why it stays null names the column (F-188, third time today).
    // The ban is on WRITING it, not on naming it: the `comment on column`
    // statement is real SQL and says, correctly, that it stays null. Banning
    // the substring made a correct migration fail, which is F-188's own lesson
    // one layer down -- assert what the defect DOES.
    expect(SQL).not.toMatch(/design_decided_at\s*=/);
    expect(SQL).not.toMatch(/insert[\s\S]*design_decided_at/i);
    // Proves the stripper left the statements behind.
    expect(SQL).toContain("create trigger close_design_gate_on_supersede");
  });

  it("records the ids it touched", () => {
    for (const id of ["148d5737", "dd0a33e8", "64fa0caf", "f2aa82f1"]) {
      expect(M).toContain(id);
    }
  });

  it("follows the day's migration series", () => {
    // A1's note on 20260903180000: it sorted before the same day's other files.
    expect(MIGRATIONS).toContain("20260904020000_a_superseded_spec_cannot_still_be_asking.sql");
  });

  it("never words a superseded gate as a sign-off", () => {
    expect(SHIP).toContain("function gateClosedWithSpec");
    const words = SHIP.slice(
      SHIP.indexOf("function designGateWords"),
      SHIP.indexOf("function gateClosedWithSpec"),
    );
    expect(words).not.toContain("superseded");
  });

  it("reports a superseded gate as a fact, not as a gap the team failed to close", () => {
    expect(SHIP).toContain("its design gate closed with it");
    // And the genuine-gap sentence keeps its exact words for a real hole.
    expect(SHIP).toContain(
      "No design gate was decided on this spec, so no human approval is on the record for how it looks.",
    );
    expect(SHIP).toContain("!gateClosedWithSpec(prd.design_gate_status)");
  });
});
